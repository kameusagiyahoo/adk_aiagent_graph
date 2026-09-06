from __future__ import annotations

import importlib.metadata
import ipaddress
import json
import os
import secrets
import sys
import urllib.error
import urllib.request
from typing import Annotated
from urllib.parse import urlparse

from fastapi import Depends, FastAPI, Header, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from executor import execute_generated_project
from validator import validate_generated_project

BRIDGE_VERSION = "0.5.0"
BRIDGE_TOKEN = os.environ.get("AGD_BRIDGE_TOKEN") or secrets.token_urlsafe(24)
DEFAULT_ORIGINS = [
    "https://kameusagiyahoo.github.io",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
ALLOWED_ORIGINS = [
    value.strip()
    for value in os.environ.get("AGD_ALLOWED_ORIGINS", ",".join(DEFAULT_ORIGINS)).split(",")
    if value.strip()
]

app = FastAPI(title="Agent Graph Designer Local Bridge", version=BRIDGE_VERSION)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "X-Agent-Graph-Token"],
)


@app.middleware("http")
async def private_network_header(request, call_next):
    response: Response = await call_next(request)
    response.headers["Access-Control-Allow-Private-Network"] = "true"
    response.headers["Cache-Control"] = "no-store"
    return response


class GeneratedFile(BaseModel):
    path: str = Field(min_length=1, max_length=240)
    content: str


class ValidateRequest(BaseModel):
    packageName: str = Field(min_length=1, max_length=120)
    files: list[GeneratedFile] = Field(min_length=1, max_length=40)


class ExecuteRequest(ValidateRequest):
    inputText: str = Field(min_length=1, max_length=12000)
    mode: str = Field(pattern="^(openai|vllm)$")
    model: str = Field(min_length=1, max_length=300)
    vllmBaseUrl: str | None = None


class VllmCheckRequest(BaseModel):
    baseUrl: str = Field(min_length=1, max_length=300)


def require_token(
    token: Annotated[str | None, Header(alias="X-Agent-Graph-Token")] = None,
) -> None:
    if not token or not secrets.compare_digest(token, BRIDGE_TOKEN):
        raise HTTPException(status_code=401, detail="Bridge Tokenが一致しません。")


def adk_version() -> str:
    try:
        return importlib.metadata.version("google-adk")
    except importlib.metadata.PackageNotFoundError:
        return "not-installed"


def normalize_loopback_vllm_url(value: str) -> str:
    parsed = urlparse(value.strip())
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise ValueError("vLLM Base URLが不正です。")
    host = parsed.hostname
    is_loopback = host in {"localhost", "127.0.0.1", "::1"}
    if not is_loopback:
        try:
            is_loopback = ipaddress.ip_address(host).is_loopback
        except ValueError:
            is_loopback = False
    if not is_loopback:
        raise ValueError("vLLMはlocalhost / loopbackのみ指定できます。")
    return value.strip().rstrip("/")


@app.get("/v1/health", dependencies=[Depends(require_token)])
def health():
    return {
        "service": "agent-graph-designer-local-bridge",
        "version": BRIDGE_VERSION,
        "pythonVersion": sys.version.split()[0],
        "adkVersion": adk_version(),
        "openaiConfigured": bool(os.environ.get("OPENAI_API_KEY", "").strip()),
        "vllmApiKeyConfigured": bool(os.environ.get("AGD_VLLM_API_KEY", "").strip()),
    }


@app.post("/v1/vllm-check", dependencies=[Depends(require_token)])
def vllm_check(request: VllmCheckRequest):
    try:
        base_url = normalize_loopback_vllm_url(request.baseUrl)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    api_key = os.environ.get("AGD_VLLM_API_KEY", "").strip()
    headers = {"Accept": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    req = urllib.request.Request(f"{base_url}/models", headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            body = json.loads(response.read().decode("utf-8"))
        models = [str(item.get("id", "")) for item in body.get("data", []) if item.get("id")]
        return {"ok": True, "baseUrl": base_url, "models": models, "error": None}
    except (urllib.error.URLError, TimeoutError, ValueError, json.JSONDecodeError) as exc:
        return {"ok": False, "baseUrl": base_url, "models": [], "error": str(exc)}


@app.post("/v1/validate", dependencies=[Depends(require_token)])
def validate(request: ValidateRequest):
    return validate_generated_project(
        request.packageName,
        [item.model_dump() for item in request.files],
    )


@app.post("/v1/execute", dependencies=[Depends(require_token)])
def execute(request: ExecuteRequest):
    return execute_generated_project(
        request.packageName,
        [item.model_dump() for item in request.files],
        request.inputText,
        mode=request.mode,
        model=request.model,
        vllm_base_url=request.vllmBaseUrl,
    )


if __name__ == "__main__":
    import uvicorn

    print("Agent Graph Designer Local Bridge")
    print("---------------------------------")
    print("Listening : http://127.0.0.1:8765")
    print(f"Token     : {BRIDGE_TOKEN}")
    print(f"OpenAI key: {'configured' if os.environ.get('OPENAI_API_KEY', '').strip() else 'NOT SET'}")
    print(f"vLLM key  : {'configured' if os.environ.get('AGD_VLLM_API_KEY', '').strip() else 'not set (optional)'}")
    print("Runtime mode is selected in the Web UI: Mock / OpenAI / vLLM Local")
    print("Bridgeは127.0.0.1にのみbindします。")
    uvicorn.run(app, host="127.0.0.1", port=8765, log_level="info")
