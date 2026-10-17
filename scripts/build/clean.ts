import { rmSync } from 'node:fs';

export function clean(): void {
  for (const path of ['dist', 'dist-extension', 'dist-extension-firefox']) {
    rmSync(path, { force: true, recursive: true });
  }
}

if (import.meta.main) {
  clean();
}
