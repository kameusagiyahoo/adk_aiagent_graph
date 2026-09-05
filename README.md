# Agent Graph Designer

AIエージェントやアプリ構成を、ブラウザ上のノードCanvasで設計するための独自実装プロジェクトです。

## Current step

STEP 1C: Port / Edge MVP

- Canvas表示
- Agent / Router / Tool / HumanInput / Join を追加
- Nodeをドラッグ移動
- 各NodeにInput / Output Portを表示
- OutputからInputへドラッグしてEdge接続
- Graph IRとCanvas UIを分離

まだNode削除、設定編集、保存、Validator、ADK連携は実装していません。

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

GitHub Pagesは `main /docs` を公開します。Viteの静的ビルド成果物は `docs/` に生成されます。
