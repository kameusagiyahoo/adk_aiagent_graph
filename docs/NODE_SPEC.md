# Node Spec

## Common ports

STEP 1Cでは全Nodeに共通の最小Portを持たせる。

- `in`: 左側のInput Port
- `out`: 右側のOutput Port

Outputから別NodeのInputへ接続してEdgeを作る。
Routerの複数分岐PortやJoinの個別入力Portは後続STEPで拡張する。

## Agent
意味: LLMなどで判断・処理する主体。

## Router
意味: 条件に応じて次の処理先を選ぶ。

## Tool
意味: API・検索・計算など外部処理を実行する。

## HumanInput
意味: 人から追加情報や承認を受け取る。

## Join
意味: 複数の処理結果をまとめる。
