import { rmSync } from 'node:fs';

for (const path of ['dist', 'dist-extension', 'dist-extension-firefox']) {
  rmSync(path, { force: true, recursive: true });
}
