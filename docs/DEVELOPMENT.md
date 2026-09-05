# Development

## 原則
- 小さい変更単位で進める
- GraphロジックとCanvas UIを分離する
- ADK固有コードはcoreへ入れない
- Backendは必要になるまで追加しない
- 既存OSSコードをコピーしない

## STEP 1C確認
1. `npm install`
2. `npm run dev`
3. 2個以上のNodeを追加する
4. Node右側のOutput Portを押してドラッグする
5. 別Node左側のInput Portへドロップする
6. Edgeが表示されることを確認する
7. Nodeを移動してEdgeが追従することを確認する
8. スマホでもPortをつかめることを確認する
