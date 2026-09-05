import type { ValidationResult } from '../core/validation/types';
import './Validation.css';

type ValidationSummaryProps = {
  result: ValidationResult;
};

export function ValidationSummary({ result }: ValidationSummaryProps) {
  if (result.issues.length === 0) {
    return (
      <div className="validation-summary validation-summary--ok">
        <strong>Validation OK</strong>
        <span>現在のGraphに問題はありません。</span>
      </div>
    );
  }

  return (
    <div className="validation-summary" role="status">
      <strong>Validation</strong>
      <span className="validation-summary__error">Errors {result.errors.length}</span>
      <span className="validation-summary__warning">Warnings {result.warnings.length}</span>
      <span className="validation-summary__message">{result.issues[0]?.message}</span>
    </div>
  );
}
