# Architecture

## 現在の境界

```text
React Flow UI
    ↓↑
canvas/reactFlowAdapter.ts
    ↓↑
core/graph (Graph IR)
    ├─ core/validation
    └─ core/specification
```

React FlowのNode型をアプリの正式なGraph形式として扱わない。
正式データは `core/graph` の型が所有する。

CanvasはGraph IRを編集するUIであり、ValidatorとSpecification GeneratorはCanvasに依存しない。

```text
Canvas
  ↓↑
Graph IR
  ├─ Validator
  └─ Specification Generator
        ↓
      Markdown仕様書
```

`core/specification` はGraph IRを入力として、人間またはLLMが読める実装非依存の仕様書を生成する。
React Flowの型、DOM、GitHub Pages、Google ADKの型には依存させない。

将来は同じGraph IRから次の出力を分岐させる。

```text
Graph IR
  ├─ Validator
  ├─ Specification Generator
  ├─ Prompt Generator
  ├─ ADK Adapter
  └─ 他Runtime Adapter
```

## GitHub Pages

GitHub Pagesは `main /docs` を公開する。
Viteの生成物は `docs/index.html` と `docs/assets/` に出力する。
設計ドキュメントの `docs/*.md` はビルド時に削除しない。
