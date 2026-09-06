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
- Node選択 / 設定編集 / 削除
- Edge連動削除
- スマホ向けBottom Sheet Inspector

## STEP 1E — done
- localStorage自動保存
- Graph JSON Export / Import

## STEP 2A — done
- UI非依存Validator
- Error / Warning
- Node / Edge / Router / Join / Cycle検証

## STEP 2B — done
- Graph IRからSpecification生成
- Markdown Preview / Copy / Save

## STEP 2C — done
- Coding LLM向けPrompt Generator
- Validationを含む実装指示

## STEP 3A — done
- Google ADK 2.x Graph Workflowの公式Mapping確認
- ADK Adapter Readiness
- Graph IRとADK固有設定を分離

## STEP 3B — done
- Router Edge routeKey
- Edge Inspector
- Tool設定のdiscriminated union化
- ADK default model設定
- ADK向けValidation拡張

## STEP 3C — done
- Graph IRからGoogle ADK Pythonコードを生成
- `agent.py` / `requirements.txt` / `mapping.md`
- ブラウザCode Preview / Copy / 個別保存
- 未確定のRouter/ToolロジックはTODOとして明示
- 公開APIで保証できないMCP決定論的NodeはPARTIAL扱い

## STEP 3D — next
- 生成ファイルのZIP Export
- 最小ADK Project構成（`__init__.py` / README等）
- 生成物の静的検証

その後にLocal Runtime Bridgeと実行Trace可視化へ進む。
