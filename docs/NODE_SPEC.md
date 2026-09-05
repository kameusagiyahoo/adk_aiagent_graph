# Node Spec

## 共通

すべてのNodeが保持する情報:
- id
- kind
- name
- description
- position
- config

Canvas上では左側にInput Port、右側にOutput Portを表示する。
Nodeを選択するとInspectorから設定を編集できる。

## Agent

意味: LLMなどで判断・処理する主体。

固有設定:
- instruction

## Router

意味: 条件に応じて次の処理先を選ぶ。

固有設定:
- condition

## Tool

意味: API・検索・計算などの外部処理を実行する。

固有設定:
- toolType

現在のUI候補:
- custom
- http
- mcp
- search
- database
- file

## HumanInput

意味: 人から追加情報や承認を受け取る。

固有設定:
- prompt

## Join

意味: 複数の処理結果をまとめる。

固有設定:
- strategy = all

STEP 1ではJoin strategyは all 固定。
