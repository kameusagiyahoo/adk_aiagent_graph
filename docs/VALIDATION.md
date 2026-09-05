# Validation

Validatorは`src/core/validation/`に置き、UI・React Flow・ADKから独立させる。

## Severity

- `error`: そのままでは仕様化・コード生成へ進めるべきでない問題
- `warning`: 設計上の注意。将来のNode種別やRuntimeによっては許容される可能性がある問題

## 現在のルール

### Error
- Node ID重複
- Edge ID重複
- Edgeが存在しないNodeを参照
- Node名が空
- AgentのInstructionが空
- RouterのConditionが空
- HumanInputのPromptが空

### Warning
- Nodeが孤立している
- Routerの出力先が2本未満
- Joinの入力元が2本未満
- Cycleを検出

## Cycle Policy

Cycleは将来のLoop表現で必要になる可能性があるため、常に禁止しない。

```text
cycleSeverity = off | warning | error
```

現在の既定値は`warning`。

## 出力

```text
ValidationResult
- issues[]
- errors[]
- warnings[]
```

各Issueは`nodeId`または`edgeId`を持てるため、CanvasやInspectorで該当箇所へ表示できる。
