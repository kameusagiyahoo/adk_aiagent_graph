# ADK Adapter

未実装。

原則:

```text
Canvas -> Graph IR -> Validator -> ADK Adapter -> ADK Project
```

ADK固有仕様を `core/` に持ち込まない。

STEP 1BではAgent / Router / Tool / HumanInput / JoinをGraph IRに追加するだけで、ADKへの変換はまだ行わない。
