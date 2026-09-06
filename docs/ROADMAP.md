# Roadmap

## STEP 1A — done
- Canvas
- Agent追加
- Agent移動

## STEP 1B — done
- Agent / Router / Tool / HumanInput / Join
- スマホ向けNode追加バー

## STEP 1C — done
- Input / Output Port
- Edge接続

## STEP 1D — done
- Node選択
- Node設定編集
- Node削除
- Node削除時に関連Edgeも削除
- スマホ向けBottom Sheet Inspector

## STEP 1E — done
- localStorage自動保存
- Graph JSON Export
- Graph JSON Import
- Import時の基本バリデーション

## STEP 2A — done
- Graph IRを基準にしたUI非依存Validator
- Error / Warningの区別
- Node設定不足の検証
- 孤立Nodeの検出
- Router出力不足 / Join入力不足の検出
- ID重複 / Dangling Edgeの検出
- Cycle検出（Policyでoff / warning / errorを変更可能）
- Canvas上のValidation badge
- Node Inspectorで指摘内容を表示

## STEP 2B — done
- Graph IRから実装非依存Specificationを生成
- Node定義 / 接続 / 入口 / 出口をMarkdown化
- Node種別ごとの処理仕様を文章化
- Router分岐ラベル未定義など現在の制約を明記
- スマホ向けSpecification Preview
- Markdownコピー / `.md`保存

## STEP 2C — done
- Specification + ValidationからCoding LLM向けPromptを生成
- Graphに存在しない仕様を勝手に追加しない制約をPromptへ明記
- Validation Error時は未設定値を推測せずTODOとして残す指示を追加
- 既存Repositoryでは既存技術スタックを優先する共通Prompt
- Graph IRとRuntime / UIの分離を実装要件として維持
- スマホ向けPrompt Preview
- Promptコピー / `.md`保存

## STEP 3A — done
- Google ADK 2.x公式仕様を基準にMappingを再整理
- 新規変換の第一候補をGraph-based `Workflow(edges=[...])` に決定
- Agent → LlmAgent
- Router → route Function Node + conditional edges
- Tool → FunctionTool / McpToolset等
- HumanInput → RequestInput系HITL node
- Join → JoinNode
- NodeごとのADK変換 readiness（READY / PARTIAL / BLOCKED）
- Browser上のADK変換チェックPreview

## STEP 3B — next
- GraphEdgeへRouter用 `routeKey` / branch labelを追加
- Edge選択・編集UI
- Router outgoing EdgeではrouteKeyを必須化
- ADK Adapter設定としてdefault modelを追加
- Tool固有設定schemaの第一段階を設計

## STEP 3C — later
- Python ADK 2.xコードPreview
- `Workflow(edges=[...])` 生成
- Agent / Router / HumanInput / Joinのコード生成
- Toolは設定が揃ったtypeから段階的に生成
- requirements / entry point生成

その後にZIP ExportとRuntime Bridgeへ進む。
