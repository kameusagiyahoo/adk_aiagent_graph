# Runtime Debug

現在は実LLM接続なしでも動作イメージを確認できるMock Debuggerを標準デバッグ経路として利用できます。

## Mock Debugger
- ブラウザだけで実行
- API key不要
- Local Bridge不要
- 1 NodeずつStep実行
- 自動実行 / Pause
- BreakpointでNode実行直前に停止
- 任意Nodeから現在Stateを引き継いで再開
- State JSONを実行途中で編集
- AgentはMock応答
- ToolはStub結果
- HumanInputはMock入力
- RouterはrouteKeyを手動選択可能
- Joinは合流としてTrace表示
- Node別Mock出力を編集可能
- IN / OUT / State変化を表示
- 実行Node / EdgeをCanvas上で強調
- 実行履歴を最大8件保存し、経路・最終出力・Step数・Warning数を比較
- 到達しないNodeやCycle相当をWarning表示

Mock DebuggerはGraph IRの構造確認用であり、実際のLLM・Tool・ADK Runtimeの結果を保証するものではありません。

## 実Runtime
実接続は次の3モードへ統合する。
1. Mock Debugger
2. OpenAI API
3. vLLM Local (OpenAI-compatible API)

開発中はMock Debuggerを標準にし、構造とStateが固まった後で実LLMへ切り替える。
