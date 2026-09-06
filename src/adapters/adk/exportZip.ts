import { strToU8, zipSync } from 'fflate';
import type { AdkCodeGeneration } from './codegenTypes';

export const downloadAdkProjectZip = (generation: AdkCodeGeneration) => {
  if (!generation.staticCheck.canExport) {
    throw new Error('静的チェックにErrorが残っているためZIPを作成できません。');
  }

  const entries: Record<string, Uint8Array> = {};
  for (const file of generation.files) {
    entries[`${generation.packageName}/${file.path}`] = strToU8(file.content);
  }

  const zipped = zipSync(entries, { level: 6 });
  const bytes = new Uint8Array(zipped.length);
  bytes.set(zipped);
  const blob = new Blob([bytes.buffer], { type: 'application/zip' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = `${generation.packageName}.zip`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};
