# ADK Adapter

## 方針

```text
Canvas
  -> Graph IR
  -> Validator
  -> ADK Adapter
  -> ADK Code Generator
  -> Google ADK Project
```

ADK固有仕様を `core/` へ持ち込まない。Graph IRはRuntime非依存を維持する。

## Target

- Google ADK 2.x
- Python
- Graph-based `Workflow(edges=[...])`
- `SequentialAgent / ParallelAgent / LoopAgent`を主変換先にしない

## Mapping

| Canvas | ADK |
| --- | --- |
| Agent | `Agent` / `LlmAgent` in `Workflow` |
| Router | Function Node returning `Event(route=...)` + routed edges |
| HumanInput | Function Node yielding `RequestInput` |
| Join | `JoinNode` |
| Tool | Function Node / FunctionTool等のAdapter |
| MCP Tool | `McpToolset`はLLM Agentへ付与可能。決定論的な単独Graph Tool Nodeは現段階ではPARTIAL |
| Edge | `Workflow` edges |
| Router Edge | route key map |

## Code Generator

STEP 3Cではブラウザ上で以下を生成する。

- `agent.py`
- `requirements.txt`
- `mapping.md`

生成ポリシー:

- Canvasにない業務ロジックを推測しない。
- Routerの自然言語ConditionはPython条件式へ勝手に変換しない。
- Tool実装・認証・Secretを勝手に生成しない。
- 未確定箇所は `TODO` / `NotImplementedError` として明示する。
- Google ADKのprivate moduleをCode Generatorから直接利用しない。

## 次

STEP 3DでZIP Exportと最小ADK Project構成を生成する。
