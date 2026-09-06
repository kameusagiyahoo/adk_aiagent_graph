from __future__ import annotations

import importlib.metadata
import os
import secrets
import sys
from typing import Annotated

from fastapi import Depends, FastAPI, Header, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from executor import execute_generated_project
from validator import validate_generated_project

BRIDGE_VERSION = "0.2.0"
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


@app.get("/v1/health", dependencies=[Depends(require_token)])
def health():
    return {
        "service": "agent-graph-designer-local-bridge",
        "version": BRIDGE_VERSION,
        "pythonVersion": sys.version.split()[0],
        "adkVersion": adk_version(),
    }


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
    )


if __name__ == "__main__":
    import uvicorn

    print("Agent Graph Designer Local Bridge")
    print("---------------------------------")
    print("Listening : http://127.0.0.1:8765")
    print(f"Token     : {BRIDGE_TOKEN}")
    print("TokenをWebアプリの Runtime 画面へ入力してください。")
    print("Bridgeは127.0.0.1にのみbindします。")
    print("Local Executionはlocalhost以外への通信を遮断します。")
    uvicorn.run(app, host="127.0.0.1", port=8765, log_level="info")
