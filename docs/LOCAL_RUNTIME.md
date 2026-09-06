# Local Runtime

Agent Graph DesignerのRuntimeはPCローカル完結を基本方針とする。

## 構成

```text
Browser (Vite / GitHub Pages)
  ↓ token authenticated HTTP
Local Bridge 127.0.0.1:8765
  ↓ isolated Python process
Google ADK Runner
  ↓ loopback only
Ollama 127.0.0.1:11434
```

## STEP 4C

- `ollama_chat/<model>`をADK `LiteLlm`へ変換
- Local Bridge経由でOllama `/api/tags`を確認
- Local Executionでは`OLLAMA_API_BASE`を子プロセスへ渡す
- localhost / 127.0.0.1 / ::1以外への通信は遮断
- ADK Event Traceの`author` / `node_name`を生成時symbol mapでGraph Nodeへ戻す
- 実行済みNodeに順番バッジを表示し、連続した実行Node間のEdgeを強調する

## 制約

- 現在のTrace表示は実行完了後にまとめて反映する。ストリーミング表示は次段階。
- Router / ToolにGenerator TODOが残る場合は実行できないことがある。
- HumanInputのresumeは未対応。
