import { realpathSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function clean(): void {
  for (const path of ['dist', 'dist-extension', 'dist-extension-firefox']) {
    rmSync(path, { force: true, recursive: true });
  }
}

function isDirectInvocation(): boolean {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (isDirectInvocation()) clean();
