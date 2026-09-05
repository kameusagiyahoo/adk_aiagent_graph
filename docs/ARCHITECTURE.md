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

STEP 1BではCanvasに5種類のNodeを描画するが、Nodeの意味と設定値はGraph IR側に保持する。

## GitHub Pages

GitHub Pagesは `main /docs` を公開する。
Viteの生成物は `docs/index.html` と `docs/assets/` に出力する。
設計ドキュメントの `docs/*.md` はビルド時に削除しない。
