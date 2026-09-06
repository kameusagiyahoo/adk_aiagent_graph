# Runtime Debug

現在は実LLM接続なしでも動作イメージを確認できるMock Simulationを標準デバッグ経路として利用できます。

## Mock Simulation
- ブラウザだけで実行
- API key不要
- Local Bridge不要
- AgentはMock応答
- ToolはStub結果
- HumanInputはMock入力
- RouterはrouteKeyを手動選択可能
- Joinは合流としてTrace表示
- 実行Node / EdgeをCanvas上で強調
- 到達しないNodeやCycle相当をWarning表示

Mock SimulationはGraph IRの構造確認用であり、実際のLLM・Tool・ADK Runtimeの結果を保証するものではありません。

## 実Runtime
後続で次の3モードを統合します。
1. Mock
2. OpenAI API
3. vLLM Local (OpenAI-compatible API)
