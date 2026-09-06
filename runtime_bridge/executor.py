from __future__ import annotations

import ipaddress
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path, PurePosixPath
from typing import Any
from urllib.parse import urlparse

from validator import MAX_FILE_BYTES, MAX_FILES, MAX_TOTAL_BYTES, PACKAGE_RE, _safe_relative_path

RESULT_PREFIX = "__AGD_EXEC_RESULT__="


def _is_loopback_url(value: str) -> bool:
    try:
        parsed = urlparse(value)
        host = parsed.hostname or ""
        if host in {"localhost", "127.0.0.1", "::1"}:
            return True
        return ipaddress.ip_address(host).is_loopback
    except (ValueError, TypeError):
        return False


def _runtime_script() -> str:
    return r'''
import asyncio
import importlib
import ipaddress
import json
import socket
import sys
import traceback

PREFIX = "__AGD_EXEC_RESULT__="
root_dir = sys.argv[1]
package_name = sys.argv[2]
user_text = sys.argv[3]
mode = sys.argv[4]
sys.path.insert(0, root_dir)


def _is_loopback_host(host):
    if host in {"localhost", "127.0.0.1", "::1"}:
        return True
    try:
        return ipaddress.ip_address(host).is_loopback
    except ValueError:
        return False


_original_getaddrinfo = socket.getaddrinfo
_openai_ips = set()
if mode == "openai":
    try:
        for info in _original_getaddrinfo("api.openai.com", 443, type=socket.SOCK_STREAM):
            address = info[4]
            if address:
                _openai_ips.add(str(address[0]))
    except Exception:
        pass

_original_socket = socket.socket
class RestrictedSocket(_original_socket):
    def _check(self, address):
        host = address[0] if isinstance(address, tuple) and address else ""
        text = str(host)
        if _is_loopback_host(text):
            return
        if mode == "openai" and text in _openai_ips:
            return
        raise RuntimeError(f"Network access blocked by Agent Graph Runtime: {text}")

    def connect(self, address):
        self._check(address)
        return super().connect(address)

    def connect_ex(self, address):
        self._check(address)
        return super().connect_ex(address)

socket.socket = RestrictedSocket


def text_from_event(event):
    parts = getattr(getattr(event, "content", None), "parts", None) or []
    texts = [getattr(part, "text", None) for part in parts]
    return "\n".join(text for text in texts if text)


def tool_names(event, method_name):
    method = getattr(event, method_name, None)
    if not callable(method):
        return []
    try:
        return [str(getattr(item, "name", "")) for item in method() if getattr(item, "name", None)]
    except Exception:
        return []


async def main():
    from google.adk.runners import Runner
    from google.adk.sessions import InMemorySessionService
    from google.adk.agents.run_config import RunConfig
    from google.genai import types

    module = importlib.import_module(f"{package_name}.agent")
    root_agent = getattr(module, "root_agent")
    session_service = InMemorySessionService()
    app_name = f"agd_{package_name}"
    user_id = "local-user"
    session = await session_service.create_session(app_name=app_name, user_id=user_id)
    runner = Runner(agent=root_agent, app_name=app_name, session_service=session_service)
    content = types.Content(role="user", parts=[types.Part(text=user_text)])
    trace = []
    final_text = ""
    invocation_id = ""

    async for event in runner.run_async(
        user_id=user_id,
        session_id=session.id,
        new_message=content,
        run_config=RunConfig(max_llm_calls=20),
    ):
        if len(trace) >= 200:
            raise RuntimeError("Trace event limit exceeded (200)")
        text = text_from_event(event)
        invocation_id = str(getattr(event, "invocation_id", invocation_id) or invocation_id)
        item = {
            "eventId": str(getattr(event, "id", "")),
            "author": str(getattr(event, "author", "") or ""),
            "nodeName": str(getattr(event, "node_name", "") or ""),
            "branch": str(getattr(event, "branch", "") or ""),
            "route": str(getattr(getattr(event, "actions", None), "route", "") or ""),
            "text": text,
            "functionCalls": tool_names(event, "get_function_calls"),
            "functionResponses": tool_names(event, "get_function_responses"),
            "isFinal": bool(event.is_final_response()),
        }
        trace.append(item)
        if item["isFinal"] and text:
            final_text = text

    return {
        "status": "completed",
        "invocationId": invocation_id,
        "finalText": final_text,
        "trace": trace,
        "error": None,
    }


try:
    result = asyncio.run(main())
except Exception as exc:
    result = {
        "status": "failed",
        "invocationId": "",
        "finalText": "",
        "trace": [],
        "error": f"{type(exc).__name__}: {exc}",
        "traceback": traceback.format_exc(limit=6),
    }

print(PREFIX + json.dumps(result, ensure_ascii=False))
'''


def _failed(message: str) -> dict[str, Any]:
    return {"status": "failed", "invocationId": "", "finalText": "", "trace": [], "error": message}


def _override_agent_model(content: str, model: str) -> str:
    safe_model = model.strip().replace("\n", "").replace("\r", "")
    if not safe_model:
        return content
    expression = f'LiteLlm(model={json.dumps("openai/" + safe_model)})'
    updated, count = re.subn(r'LiteLlm\(model="openai/[^"\\]+"\)', expression, content, count=1)
    return updated if count else content


def execute_generated_project(
    package_name: str,
    files: list[dict[str, str]],
    user_text: str,
    *,
    mode: str,
    model: str,
    vllm_base_url: str | None = None,
) -> dict[str, Any]:
    if mode not in {"openai", "vllm"}:
        return _failed("Runtime modeはopenaiまたはvllmを指定してください。")
    model = model.strip()
    if not model:
        return _failed("Model名が空です。")

    openai_api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    vllm_api_key = os.environ.get("AGD_VLLM_API_KEY", "").strip() or "local-vllm"
    if mode == "openai" and not openai_api_key:
        return _failed("OPENAI_API_KEYがLocal Bridgeの環境変数に設定されていません。")
    if mode == "vllm":
        vllm_base_url = (vllm_base_url or "").strip().rstrip("/")
        if not vllm_base_url or not _is_loopback_url(vllm_base_url):
            return _failed("vLLM Base URLはlocalhost / loopbackのOpenAI互換URLを指定してください。")
        if not vllm_base_url.endswith("/v1"):
            return _failed("vLLM Base URLは /v1 で終わるURLを指定してください。")

    if not PACKAGE_RE.fullmatch(package_name):
        return _failed("Python package名が不正です。")
    if not files or len(files) > MAX_FILES:
        return _failed(f"file数は1〜{MAX_FILES}件にしてください。")

    normalized: list[tuple[PurePosixPath, str]] = []
    seen: set[str] = set()
    total_bytes = 0
    try:
        for item in files:
            path = _safe_relative_path(str(item.get("path", "")))
            key = path.as_posix()
            if key in seen:
                raise ValueError(f"duplicate file path: {key}")
            seen.add(key)
            content = str(item.get("content", ""))
            if key == "agent.py":
                content = _override_agent_model(content, model)
            size = len(content.encode("utf-8"))
            if size > MAX_FILE_BYTES:
                raise ValueError(f"file too large: {key}")
            total_bytes += size
            normalized.append((path, content))
        if total_bytes > MAX_TOTAL_BYTES:
            raise ValueError("payload too large")
        if "agent.py" not in seen or "__init__.py" not in seen:
            raise ValueError("agent.py / __init__.py が必要です")
    except ValueError as exc:
        return _failed(str(exc))

    with tempfile.TemporaryDirectory(prefix="agent-graph-exec-") as temp_dir:
        root = Path(temp_dir)
        package_root = root / package_name
        package_root.mkdir(parents=True, exist_ok=True)
        for path, content in normalized:
            destination = package_root.joinpath(*path.parts)
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_text(content, encoding="utf-8")

        safe_env = {key: os.environ[key] for key in ("PATH", "SYSTEMROOT", "WINDIR", "TEMP", "TMP") if key in os.environ}
        safe_env.update({
            "HOME": temp_dir,
            "PYTHONIOENCODING": "utf-8",
            "PYTHONDONTWRITEBYTECODE": "1",
            "PYTHONUTF8": "1",
        })
        if mode == "openai":
            safe_env.update({
                "OPENAI_API_KEY": openai_api_key,
                "NO_PROXY": "localhost,127.0.0.1,::1,api.openai.com",
            })
        else:
            safe_env.update({
                "OPENAI_API_KEY": vllm_api_key,
                "OPENAI_API_BASE": vllm_base_url or "",
                "OPENAI_BASE_URL": vllm_base_url or "",
                "NO_PROXY": "localhost,127.0.0.1,::1",
            })

        try:
            process = subprocess.run(
                [sys.executable, "-I", "-c", _runtime_script(), temp_dir, package_name, user_text, mode],
                cwd=temp_dir,
                env=safe_env,
                capture_output=True,
                text=True,
                timeout=120,
                check=False,
            )
        except subprocess.TimeoutExpired:
            return _failed(f"{mode} Executionが120秒でタイムアウトしました。")

        payload_line = next((line for line in reversed(process.stdout.splitlines()) if line.startswith(RESULT_PREFIX)), None)
        if payload_line is None:
            detail = (process.stderr or process.stdout or f"exit={process.returncode}").strip()
            return _failed(detail[-2000:])
        try:
            return json.loads(payload_line[len(RESULT_PREFIX):])
        except Exception as exc:
            return _failed(f"実行結果JSON解析失敗: {exc}")
