# Specification Generator

## 目的

Graph IRを、人間やCoding LLMが読める実装非依存のMarkdown仕様書へ変換する。

```text
Graph IR
  ↓
Specification Generator
  ↓
Markdown Specification
```

## 現在の出力

- Project概要
- Node数 / Edge数
- 入口Node / 出口Node
- Node定義
- Node固有設定
- 接続一覧
- Node種別ごとの処理仕様
- 現在のGraph IR上の制約

## Nodeごとの意味

- Agent: Instructionに従って判断・処理する
- Router: Conditionを評価し、接続先候補から次の処理先を選ぶ
- Tool: Tool typeに応じた外部処理を実行する
- HumanInput: Promptを提示して人から情報または承認を受ける
- Join: 複数入力をstrategyに従って統合する

## 重要な制約

現時点ではRouterの各Edgeに分岐ラベルや個別条件を保持していない。
そのためSpecificationではRouterの出力Edgeを「分岐候補」として表現する。

State / Schema / RuntimeもまだGraph IRへ導入していないため、仕様書では生成しない。

ValidationはSpecification Generatorとは独立したレイヤーであり、Errorが存在しても仕様書自体は生成可能とする。
