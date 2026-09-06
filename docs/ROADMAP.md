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
- Graph JSON Export / Import

## STEP 2A — done
- UI非依存Validator
- Error / Warning
- Node設定 / Graph構造検証
- Cycle policy

## STEP 2B — done
- Graph Specification Generator
- Markdown Preview / Copy / Save

## STEP 2C — done
- Coding LLM Prompt Generator
- Validationを含む実装指示

## STEP 3A — done
- Google ADK 2.x Graph Workflow Mapping調査
- ADK Adapter Readiness
- READY / PARTIAL / BLOCKED判定

## STEP 3B — done
- Edge選択 / Edge削除
- Router EdgeのRoute key編集
- Router routeKey必須・重複Validation
- Tool設定を種別ごとの構造化configへ拡張
- 旧Tool JSONを新configへ読み込み時に移行
- ADK default modelをAdapter設定として分離
- ADK ReadinessをrouteKey / Tool config / default modelへ対応
- SpecificationへRoute key / Tool詳細を反映

## STEP 3C — next
- Google ADK Python Code Generator
- Browser上でCode Preview
- READYなNodeは具体コードへ変換
- PARTIAL / BLOCKEDはTODOを明示
- `agent.py` / requirements候補 / mapping report

その後:
- ZIP Export
- Runtime Bridge
- 実行TraceをCanvasへ戻す
