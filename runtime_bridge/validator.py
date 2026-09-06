from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import tempfile
import time
from pathlib import Path, PurePosixPath
from typing import Any

PACKAGE_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")
ALLOWED_SUFFIXES = {".py", ".txt", ".md", ".json", ".yaml", ".yml"}
REQUIRED_FILES = {"__init__.py", "agent.py", "requirements.txt"}
MAX_FILES = 40
MAX_FILE_BYTES = 512 * 1024
MAX_TOTAL_BYTES = 2 * 1024 * 1024
RESULT_PREFIX = "__AGD_RUNTIME_RESULT__="


def _check(check_id: str, label: str, status: str, detail: str, started: float) -> dict[str, Any]:
    return {
        "id": check_id,
        "label": label,
        "status": status,
        "detail": detail,
        "durationMs": max(0, round((time.perf_counter() - started) * 1000)),
    }


def _safe_relative_path(raw: str) -> PurePosixPath:
    path = PurePosixPath(raw)
    if path.is_absolute() or not path.parts or any(part in {"", ".", ".."} for part in path.parts):
        raise ValueError(f"unsafe file path: {raw}")
    if path.suffix.lower() not in ALLOWED_SUFFIXES:
        raise ValueError(f"unsupported file type: {raw}")
    return path


def _runtime_script() -> str:
    return r'''
import importlib
import importlib.metadata
import json
import socket
import sys
import time
import traceback

PREFIX = "__AGD_RUNTIME_RESULT__="
root_dir = sys.argv[1]
package_name = sys.argv[2]
sys.path.insert(0, root_dir)
checks = []
adk_version = "unknown"


def add(check_id, label, status, detail, started):
    checks.append({
        "id": check_id,
        "label": label,
        "status": status,
        "detail": detail,
        "durationMs": max(0, round((time.perf_counter() - started) * 1000)),
    })


def block_network(*args, **kwargs):
    raise RuntimeError("Network access is disabled during Runtime validation")


_original_socket = socket.socket
class OfflineSocket(_original_socket):
    def connect(self, *args, **kwargs):
        return block_network(*args, **kwargs)
    def connect_ex(self, *args, **kwargs):
        block_network(*args, **kwargs)
        return 1

socket.socket = OfflineSocket
socket.create_connection = block_network

started = time.perf_counter()
try:
    import google.adk  # noqa: F401
    try:
        adk_version = importlib.metadata.version("google-adk")
    except Exception:
        adk_version = "installed"
    add("google-adk-import", "google-adk import", "pass", f"google-adk {adk_version}", started)
    adk_ok = True
except Exception as exc:
    add("google-adk-import", "google-adk import", "fail", f"{type(exc).__name__}: {exc}", started)
    adk_ok = False

module = None
if adk_ok:
    started = time.perf_counter()
    try:
        module = importlib.import_module(f"{package_name}.agent")
        add("package-import", "生成package import", "pass", f"Imported {package_name}.agent", started)
    except Exception as exc:
        detail = f"{type(exc).__name__}: {exc}"
        trace = traceback.format_exc(limit=4).strip().replace("\n", " | ")
        add("package-import", "生成package import", "fail", f"{detail} | {trace}", started)
else:
    add("package-import", "生成package import", "skip", "google-adk import失敗のため未実行", time.perf_counter())

root_agent = None
if module is not None:
    started = time.perf_counter()
    root_agent = getattr(module, "root_agent", None)
    if root_agent is None:
        add("root-agent", "root_agent存在", "fail", "agent.pyにroot_agentが見つかりません", started)
    else:
        add("root-agent", "root_agent存在", "pass", f"type={type(root_agent).__name__}", started)
else:
    add("root-agent", "root_agent存在", "skip", "生成package import失敗のため未実行", time.perf_counter())

if root_agent is not None:
    started = time.perf_counter()
    try:
        from google.adk import Workflow
        if isinstance(root_agent, Workflow):
            add("workflow-type", "Workflow構築", "pass", "root_agent is google.adk.Workflow", started)
        else:
            add("workflow-type", "Workflow構築", "fail", f"root_agent type={type(root_agent).__name__}", started)
    except Exception as exc:
        add("workflow-type", "Workflow構築", "fail", f"{type(exc).__name__}: {exc}", started)
else:
    add("workflow-type", "Workflow構築", "skip", "root_agentがないため未実行", time.perf_counter())

payload = {
    "checks": checks,
    "adkVersion": adk_version,
}
print(PREFIX + json.dumps(payload, ensure_ascii=False))
'''


def validate_generated_project(package_name: str, files: list[dict[str, str]]) -> dict[str, Any]:
    checks: list[dict[str, Any]] = []

    started = time.perf_counter()
    if not PACKAGE_RE.fullmatch(package_name):
        checks.append(_check("package-layout", "package構造", "fail", "Python package名が不正です", started))
        return _finish(checks, "unknown")
    if not files or len(files) > MAX_FILES:
        checks.append(_check("package-layout", "package構造", "fail", f"file数は1〜{MAX_FILES}件にしてください", started))
        return _finish(checks, "unknown")

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
            size = len(content.encode("utf-8"))
            if size > MAX_FILE_BYTES:
                raise ValueError(f"file too large: {key}")
            total_bytes += size
            normalized.append((path, content))
        if total_bytes > MAX_TOTAL_BYTES:
            raise ValueError("payload too large")
        missing = sorted(REQUIRED_FILES - seen)
        if missing:
            raise ValueError(f"missing required files: {', '.join(missing)}")
    except ValueError as exc:
        checks.append(_check("package-layout", "package構造", "fail", str(exc), started))
        return _finish(checks, "unknown")

    checks.append(
        _check(
            "package-layout",
            "package構造",
            "pass",
            f"{package_name}/ : {len(normalized)} files / {total_bytes} bytes",
            started,
        )
    )

    started = time.perf_counter()
    syntax_errors: list[str] = []
    for path, content in normalized:
        if path.suffix == ".py":
            try:
                compile(content, f"{package_name}/{path.as_posix()}", "exec")
            except SyntaxError as exc:
                syntax_errors.append(f"{path}:{exc.lineno}: {exc.msg}")
    if syntax_errors:
        checks.append(_check("python-syntax", "Python構文", "fail", " | ".join(syntax_errors), started))
        for check_id, label in (
            ("google-adk-import", "google-adk import"),
            ("package-import", "生成package import"),
            ("root-agent", "root_agent存在"),
            ("workflow-type", "Workflow構築"),
        ):
            checks.append(_check(check_id, label, "skip", "Python構文エラーのため未実行", time.perf_counter()))
        return _finish(checks, "unknown")
    checks.append(_check("python-syntax", "Python構文", "pass", "全Pythonファイルをcompile()で確認", started))

    with tempfile.TemporaryDirectory(prefix="agent-graph-runtime-") as temp_dir:
        root = Path(temp_dir)
        package_root = root / package_name
        package_root.mkdir(parents=True, exist_ok=True)
        for path, content in normalized:
            destination = package_root.joinpath(*path.parts)
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_text(content, encoding="utf-8")

        safe_env = {
            key: os.environ[key]
            for key in ("PATH", "SYSTEMROOT", "WINDIR", "TEMP", "TMP")
            if key in os.environ
        }
        safe_env.update({
            "HOME": temp_dir,
            "PYTHONIOENCODING": "utf-8",
            "PYTHONDONTWRITEBYTECODE": "1",
        })

        started = time.perf_counter()
        try:
            process = subprocess.run(
                [sys.executable, "-I", "-c", _runtime_script(), temp_dir, package_name],
                cwd=temp_dir,
                env=safe_env,
                capture_output=True,
                text=True,
                timeout=15,
                check=False,
            )
        except subprocess.TimeoutExpired:
            checks.append(_check("runtime-process", "隔離Pythonプロセス", "fail", "15秒でタイムアウト", started))
            return _finish(checks, "unknown")

        payload_line = next(
            (line for line in reversed(process.stdout.splitlines()) if line.startswith(RESULT_PREFIX)),
            None,
        )
        if payload_line is None:
            detail = (process.stderr or process.stdout or f"exit={process.returncode}").strip()
            checks.append(_check("runtime-process", "隔離Pythonプロセス", "fail", detail[-1200:], started))
            return _finish(checks, "unknown")

        try:
            payload = json.loads(payload_line[len(RESULT_PREFIX):])
            checks.extend(payload.get("checks", []))
            adk_version = str(payload.get("adkVersion", "unknown"))
        except Exception as exc:
            checks.append(_check("runtime-process", "隔離Pythonプロセス", "fail", f"結果JSON解析失敗: {exc}", started))
            return _finish(checks, "unknown")

    return _finish(checks, adk_version)


def _finish(checks: list[dict[str, Any]], adk_version: str) -> dict[str, Any]:
    failed = any(check.get("status") == "fail" for check in checks)
    return {
        "status": "failed" if failed else "passed",
        "pythonVersion": sys.version.split()[0],
        "adkVersion": adk_version,
        "checks": checks,
    }
