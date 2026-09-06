# Google ADK Adapter

## 方針

```text
Canvas
  ↓
Graph IR
  ↓
Validator
  ↓
ADK Adapter
  ↓
Google ADK Project
```

ADK固有仕様を `core/graph` に持ち込まない。
ADKへの変換可否・不足情報は `src/adapters/adk` で判定する。

## Target

2026-09-06時点の公式ADK 2.x仕様を基準に、最初のコード生成対象は **Python + Graph-based Workflow** とする。

新規実装では、旧来の `SequentialAgent` / `ParallelAgent` / `LoopAgent` をGraph IRの主変換先にはしない。
Canvasが元々Graphなので、`Workflow(edges=[...])` を第一候補とする。

## Mapping

| Graph IR | Google ADK | 状態 |
|---|---|---|
| Agent | `LlmAgent`をWorkflow nodeとして利用 | model設定追加後に生成可能 |
| Router | routeを返すFunction Node + conditional edges | EdgeのrouteKeyが未実装 |
| Tool | `FunctionTool` / `McpToolset`等 | Tool固有設定schemaが未実装 |
| HumanInput | `RequestInput`系HITL node | 単純入力ならMapping可能 |
| Join | `JoinNode` | 2入力以上ならMapping可能 |
| Edge | `Workflow.edges` | 通常EdgeはMapping可能 |

## Router

ADKのGraph分岐は、Router相当Nodeが `Event(route=...)` を返し、route値と接続先をconditional edgeで対応付ける。

現在の `GraphEdge` は接続先しか持たないため、次段階で例えば以下を追加する必要がある。

```ts
routeKey?: string
```

Routerから出るEdgeでは `routeKey` を必須にする方向。

## Tool

現在のGraph IRは `toolType` のみ。
RunnableなADKコード生成にはTool typeごとに追加情報が必要。

例:

- `custom`: function名、引数schema、返り値schema、実装参照
- `http`: URL、method、request/response schema、認証方式
- `mcp`: transport、server URLまたはstdio command、tool filter
- `search`: 利用する検索Tool/provider
- `database`: 接続方法、query契約
- `file`: 許可範囲、操作契約

Secret値そのものはGraph JSONへ保存しない。

## State

ADK 2.x Graph WorkflowではNodeのoutputを次Nodeへ直接渡せるため、単純なNode間データ受け渡しだけなら `session.state` は必須ではない。

永続状態、会話状態、複数Nodeから共有する状態が必要になった時点で、State Node / State mappingを追加する。
ADKではSession StateやContext経由のstate更新を利用できる。

## HumanInput

Canvasの独立したHumanInput NodeはGraph WorkflowのHITL入力待ちへMappingする。

Tool実行直前のyes/no承認は別概念で、ADKのTool Confirmationとして将来別設定にする。
HumanInput NodeとTool Confirmationを同一視しない。

## Official references

- https://adk.dev/graphs/
- https://adk.dev/graphs/routes/
- https://adk.dev/workflows/human-input/
- https://adk.dev/tools-custom/
- https://adk.dev/tools-custom/mcp-tools/
- https://adk.dev/sessions/state/

## STEP 3A

実装済み:

- Graph IRからADK Mapping readinessを解析
- Nodeごとに READY / PARTIAL / BLOCKED を表示
- ADK変換に必要な不足情報を列挙
- Browser上でMarkdownプレビュー / コピー / 保存

次はRouter EdgeのrouteKeyとADK Adapter設定をGraph/UIへ追加する。
