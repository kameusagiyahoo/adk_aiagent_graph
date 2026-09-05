# Architecture

## 現在の境界

```text
React Flow UI
    ↓↑
canvas/reactFlowAdapter.ts
    ↓↑
core/graph
```

React FlowのNode型をアプリの正式なGraph形式として扱わない。
正式データは `core/graph` の型が所有する。
