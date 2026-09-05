# Development

## 原則
- 小さい変更単位で進める
- GraphロジックとCanvas UIを分離する
- ADK固有コードはcoreへ入れない
- Backendは必要になるまで追加しない
- 既存OSSコードをコピーしない

## GitHub Pages

公開方式は `Deploy from a branch`。

```text
Branch: main
Folder: /docs
```

Viteは公開用 `index.html / assets` を `docs/` に生成する。
`docs/*.md` の設計ドキュメントはビルド時に保持する。

## STEP 1B確認
1. Pagesを開く
2. Agent / Router / Tool / HumanInput / Join の5ボタンが見える
3. 各ボタンからNodeを追加できる
4. 各Nodeの種別が見た目で区別できる
5. 各Nodeをドラッグ移動できる
6. スマホ幅でNode追加バーを横スクロールできる
