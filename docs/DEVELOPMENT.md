# Development

## 原則
- 小さい変更単位で進める
- GraphロジックとCanvas UIを分離する
- ADK固有コードはcoreへ入れない
- Backendは必要になるまで追加しない
- 既存OSSコードをコピーしない
- GitHub Pagesは main /docs を公開する

## STEP 1E 確認
1. NodeとEdgeを作る
2. ページを再読み込みする
3. localStorageから同じGraphが復元されることを確認する
4. 「書出」でJSONファイルを保存する
5. Canvasを変更する
6. 「読込」で先ほどのJSONを選ぶ
7. Node / Edge / 設定 / 座標が戻ることを確認する
8. 不正なJSONを読み込ませた場合にエラー表示されることを確認する

STEP 1のCanvas Editor MVPはここで完了。
次はGraph IRとValidatorをUI非依存で実装する。
