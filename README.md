# Agent Graph Designer

AIエージェントやアプリ構成を、ブラウザ上のノードCanvasで設計するための独自実装プロジェクトです。

## Current step

STEP 1B: 5 Node Types

- Canvasを表示
- Agent / Router / Tool / HumanInput / Join を追加
- 5種類のNodeをドラッグ移動
- Graph IRとCanvas UIを分離
- スマホ向けの横スクロールNode追加バー

まだEdge、Port、保存、設定編集、Validator、ADK連携は実装していません。

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

GitHub Pagesは `main /docs` を公開します。Viteの静的ビルド成果物も `docs/` に生成します。
