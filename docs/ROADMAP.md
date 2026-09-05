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

## STEP 2B — next
- Graph Specification Generator
- Graphを人間/LLMが読める仕様書へ変換
- Node役割、接続、分岐、設定の整理

その後にPrompt Generator、ADK Adapterへ進む。
