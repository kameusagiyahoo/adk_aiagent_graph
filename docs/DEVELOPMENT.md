# Development

## 原則
- 小さい変更単位で進める
- GraphロジックとCanvas UIを分離する
- ADK固有コードはcoreへ入れない
- Backendは必要になるまで追加しない
- 既存OSSコードをコピーしない
- GitHub Pagesは main /docs を公開する

## STEP 1D 確認
1. Nodeを追加する
2. NodeをタップしてInspectorを開く
3. Name / Descriptionを変更する
4. Node種別ごとの固有設定を変更する
5. Canvas上の表示へ即時反映されることを確認する
6. 接続済みNodeを削除する
7. Nodeと関連Edgeが同時に消えることを確認する
8. スマホではInspectorがBottom Sheetとして操作できることを確認する

次STEPでlocalStorageとJSON Export / Importを追加する。
