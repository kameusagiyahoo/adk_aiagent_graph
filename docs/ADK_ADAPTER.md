# ADK Adapter

## Boundary

```text
Canvas
  ↓
Graph IR
  ↓
Validator
  ↓
ADK Adapter
  ↓
Google ADK 2.x Graph Workflow
```

ADK固有仕様は `core/graph` に持ち込まない。
Adapter固有設定は `src/adapters/adk` が所有する。

## Current mapping

| Graph | ADK 2.x |
|---|---|
| Agent | `LlmAgent` in `Workflow` |
| Router | Function Node returning `Event(route=...)` + conditional edge map |
| Tool / MCP | `McpToolset` |
| Tool / Custom | `FunctionTool` または tool-backed Function Node |
| HumanInput | Function Node yielding `RequestInput` |
| Join | `JoinNode` |
| Edge | `Workflow(edges=[...])` |

## STEP 3B

### Router routeKey

Routerから出るGraph Edgeは `routeKey` を持つ。
同じRouter内でrouteKeyは一意とする。
空routeKeyはValidation Error。

```text
Router
  ├─ [APPROVE] → Agent
  └─ [REJECT]  → HumanInput
```

ADK Pythonでは概念的に次へ変換する。

```python
(router, {
    "APPROVE": approve_node,
    "REJECT": reject_node,
})
```

`DEFAULT_ROUTE` は将来Code GeneratorでADKのdefault route定数へ変換する。

### ADK default model

AgentのmodelはGraph IRへ保存しない。
ADK Adapter設定として保持する。
初期値は `gemini-flash-latest`。

Graph IRはframework非依存のAgent意味を保持し、ADK Adapterが `LlmAgent(model=...)` を補う。

### Tool config

Toolは種別だけでなく実行に必要な最小設定をGraph IRへ持つ。

- custom: functionName / description
- http: method / url
- mcp: transport + command/args または SSE URL
- search: provider
- database: connectionRef / operation
- file: operation / path

API keyやPasswordなどSecret本体はGraphへ保存しない。

## Official references checked for STEP 3B

- https://adk.dev/workflows/graph-routes/
- https://adk.dev/workflows/human-input/
- https://adk.dev/tools/function-tools/
- https://adk.dev/tools-custom/mcp-tools/
- https://adk.dev/agents/llm-agents/

## Next

STEP 3Cで、Readinessが許す範囲からPython ADKコードPreviewを生成する。
BLOCKED項目は推測で補完せず、生成コード内TODOとして残す。
