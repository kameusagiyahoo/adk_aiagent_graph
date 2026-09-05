# Graph IR

STEP 1Bでは5種類のNodeをGraph IRとして定義する。

```text
GraphProject
- id
- version
- name
- nodes
- edges
```

共通Node情報:

```text
- id
- kind
- name
- description
- position
- config
```

Node kind:

```text
agent
router
tool
humanInput
join
```

現在の最小config:

```text
Agent       -> instruction
Router      -> condition
Tool        -> toolType
HumanInput  -> prompt
Join        -> strategy
```

`position`はGraph IR側に保持する。
React Flow固有データはIRへ保存しない。
PortとEdgeの正式仕様は次STEP以降で追加する。
