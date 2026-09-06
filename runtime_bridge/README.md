# Local Runtime Bridge

Agent Graph DesignerのGitHub Pagesから、同一PC上のPython / Google ADK環境で生成コードを実行前検証するための最小Bridgeです。

## 目的

Web側だけでは確認できない以下を、別Pythonプロセスで確認します。

1. package構造
2. Python構文
3. `google.adk` import
4. 生成package import
5. `root_agent`存在
6. `root_agent`が`Workflow`として構築できるか

LLMへのAPI呼び出し、Tool実行、MCP接続などの本実行は行いません。

## 起動

```bash
cd runtime_bridge
python -m venv .venv
source .venv/bin/activate
# Windows: .venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

起動時に次のようなTokenが表示されます。

```text
Listening : http://127.0.0.1:8765
Token     : <random token>
```

Agent Graph Designerの`Runtime`画面で、URLとTokenを入力して`接続確認`→`Runtime検証`を実行してください。

## セキュリティ

- `127.0.0.1`にのみbindします。
- 起動ごとにランダムTokenを生成します。`AGD_BRIDGE_TOKEN`で明示指定も可能です。
- CORSの既定許可元はGitHub PagesとViteのlocalhost開発環境だけです。
- 検証対象は一時ディレクトリへ展開します。
- import検証は別Pythonプロセス、15秒タイムアウトで実行します。
- 親プロセスのAPIキー等を子プロセス環境へ引き継ぎません。
- import検証中のネットワーク接続はブロックします。

生成コードをimportする以上、Bridgeへ任意コードを送れる相手にはローカルPython実行権限を与えることになります。Tokenを第三者へ共有しないでください。

## Originを追加する場合

```bash
AGD_ALLOWED_ORIGINS="https://kameusagiyahoo.github.io,http://localhost:5173" python app.py
```

## スマホについて

`127.0.0.1`は「そのブラウザが動いている端末自身」です。iPhoneからPC上のBridgeへ接続する場合は、このSTEP 4Aのloopback方式では届きません。STEP 4BでHTTPS/Tunnel経路を追加します。
