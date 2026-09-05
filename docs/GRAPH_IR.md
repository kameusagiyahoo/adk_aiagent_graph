# Graph IR

STEP 1では最小形のみ定義する。

```text
GraphProject
- id
- version
- name
- nodes
- edges
```

Nodeは現在 `Agent` のみ。

```text
AgentGraphNode
- id
- kind = agent
- name
- description
- position
- config.instruction
```

`position`は現段階ではGraph IR側に保持する。
React Flow固有データはIRへ保存しない。
