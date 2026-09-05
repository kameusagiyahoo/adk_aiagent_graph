# Node Spec

STEP 1Bでは5種類のNodeを扱う。

## Agent
意味: LLMなどで判断・処理する主体。
最小設定: `instruction`

## Router
意味: 条件に応じて次の処理先を選ぶ。
最小設定: `condition`

## Tool
意味: API・検索・計算など外部処理を実行する。
最小設定: `toolType`

## HumanInput
意味: 人から追加情報や承認を受け取る。
最小設定: `prompt`

## Join
意味: 複数の処理結果をまとめる。
最小設定: `strategy`

全Node共通で `id / kind / name / description / position / config` を保持する。
Portは次STEP以降で追加する。
