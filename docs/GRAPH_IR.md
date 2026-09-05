# Graph IR

現在の最小Graph IR:

```text
GraphProject
- id
- version
- name
- nodes[]
- edges[]
```

Node種別:
- Agent
- Router
- Tool
- HumanInput
- Join

各Nodeは共通して以下を持つ。

```text
- id
- kind
- name
- description
- position
- config
```

EdgeはReact FlowのEdge型をそのまま保存せず、独自形式で保持する。

```text
GraphEdge
- id
- sourceNodeId
- sourcePortId = out
- targetNodeId
- targetPortId = in
```

`position`は現段階ではGraph IR側に保持する。
React Flow固有データはIRへ保存しない。
