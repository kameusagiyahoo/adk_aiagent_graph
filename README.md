# Agent Graph Designer

AIエージェントやアプリ構成を、ブラウザ上のノードCanvasで設計するための独自実装プロジェクトです。

## Current step

STEP 1: Canvas MVP

- Canvasを表示
- Agent Nodeを追加
- Agent Nodeをドラッグ移動
- Graph IRとCanvas UIを分離

まだEdge、保存、設定編集、Validator、ADK連携は実装していません。

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

GitHub Pagesでの公開を前提に、Viteの静的ビルドで動作する構成です。
