# Prompt Generator

STEP 2Cでは、Graph IRから生成したSpecificationとValidator結果を入力にして、CodexなどのCoding LLMへ渡せる実装Promptを生成する。

```text
Graph IR
  ├─ Validator
  └─ Specification Generator
          ↓
     Prompt Generator
          ↓
   Generic Coding LLM Prompt
```

## 目的

Prompt Generatorは特定Runtimeへ直接変換しない。
Google ADKやLangGraphなどのAdapterより前段に置き、Graphの意味を保ったまま実装指示へ変換する。

## Promptに含める内容

- Project名と実装目的
- Graph仕様
- Validation Error / Warning
- Graphにない仕様を勝手に追加しないルール
- 未設定値を推測しないルール
- 既存Repositoryの技術スタックを優先するルール
- GraphドメインとUI / Runtime固有コードを分離するルール
- Secretをハードコードしないルール
- 成果物と完了条件

Validation Errorが残っていてもPrompt自体は生成できる。ただしCoding LLMには、未設定値を勝手に補完せず、実装可能な骨格とTODOを残すよう明示する。

## 現在の対象

`generic-coding-llm`

現段階ではCodexなどの一般的なCoding LLM向けであり、Google ADK専用Promptではない。
次段のADK AdapterでGraph IRをGoogle ADKの構造へ明示的にMappingする。
