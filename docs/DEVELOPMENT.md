# Development

## STEP 4C verification

1. `npm install`
2. `npm run build`
3. `python -m py_compile runtime_bridge/app.py runtime_bridge/validator.py runtime_bridge/executor.py`
4. `cd runtime_bridge && pip install -r requirements.txt && python app.py`
5. Ollamaを起動し、任意のモデルをpullする
6. Runtime画面でOllama URLとModelを設定
7. `Ollama確認`でモデル一覧を取得
8. `Runtime検証`
9. `ローカル実行`
10. 実行後、Canvasの対応Nodeに`✓ 1`, `✓ 2`...が表示され、通過Edgeが強調されることを確認
