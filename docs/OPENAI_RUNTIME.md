# OpenAI API Runtime

STEP 4CのRuntime方針は、Web UIとGoogle ADK RuntimeをPCローカルで動かし、LLM推論だけOpenAI APIへ送る構成です。

```text
Agent Graph Designer
  -> http://127.0.0.1:8765 Local Bridge
  -> Google ADK / LiteLLM
  -> https://api.openai.com
```

## API key

API keyはGraph IR、localStorage、生成ZIP、Web UIには保存しません。
Local Bridgeを起動するシェルの環境変数 `OPENAI_API_KEY` だけを使用します。

```bash
export OPENAI_API_KEY="..."
python runtime_bridge/app.py
```

PowerShell:

```powershell
$env:OPENAI_API_KEY="..."
python runtime_bridge/app.py
```

## Model

ADK PythonからOpenAIモデルを使う場合はLiteLLM connectorを使用します。
CanvasのADK model設定 `gpt-5.6-terra` は生成時に次へ変換されます。

```python
LiteLlm(model="openai/gpt-5.6-terra")
```

モデル名はADK設定で変更可能です。Graph IRには保存しません。

## Network policy

Bridge自体は127.0.0.1だけで待受します。
生成Agentの実行プロセスには `OPENAI_API_KEY` だけを必要なSecretとして渡し、OpenAI APIとloopback以外への接続を制限します。

TraceはADK EventからCanvas UIへ戻します。Runtime TraceはGraph IRには保存しません。
