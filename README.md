# Agent Graph Designer

AIエージェントやアプリ構成を、ブラウザ上のノードCanvasで設計するための独自実装プロジェクトです。

## Current step

STEP 1D: Canvas Editor MVP

実装済み:
- Canvas表示
- Agent / Router / Tool / HumanInput / Join
- Node追加・ドラッグ移動
- Input / Output Port
- Edge接続
- Node選択
- Node設定編集
- Node削除
- Node削除時の関連Edge削除
- スマホ向けBottom Sheet Inspector
- Graph IRとCanvas UIの分離

まだ未実装:
- localStorage
- JSON Export / Import
- Validator
- ADK連携
- Backend

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

GitHub Pagesは `main` ブランチの `/docs` を公開します。
Viteの静的ビルド成果物も `/docs` に生成されます。
