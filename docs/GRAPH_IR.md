# Graph IR

現在のGraph IRは、React FlowやADKに依存しないアプリ独自形式とする。

```text
GraphProject
- id
- version
- name
- nodes[]
- edges[]
```

## Node

Nodeは`kind`を判別キーにしたdiscriminated union。

共通フィールド:

```text
- id
- kind
- name
- description
- position
- config
```

Node種別と固有config:

```text
Agent
- instruction

Router
- condition

Tool
- toolType

HumanInput
- prompt

Join
- strategy = all
```

`position`は現段階ではGraph IR側に保持するが、React Flow固有型は保存しない。

## Edge

```text
GraphEdge
- id
- sourceNodeId
- sourcePortId = out
- targetNodeId
- targetPortId = in
```

EdgeもReact FlowのEdge型をそのまま保存しない。

## Validationとの関係

Validatorは`GraphProject`だけを入力として動作する。
Canvas UIやReact Flowを参照しない。

```text
Canvas
  ↓
Graph IR
  ├─ Validator
  ├─ Specification Generator
  └─ Adapter（将来）
```

この分離により、同じGraph IRをADK、LangGraph、独自Runtimeなどへ変換できる構造を維持する。
