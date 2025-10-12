import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { relative, join } from 'node:path';

/**
 * Guard: Avoid importing shared/media barrel from sensitive layers
 * - Disallowed: "@shared/media" or "../media" (relative) inside shared/services or shared/container
 * - Allowed: concrete modules like "@shared/media/filename-service"
 */
describe('lint: media barrel avoidance in sensitive modules', () => {
  it('services/container should not import shared/media barrel', () => {
    const includeRoots = ['src/shared/services', 'src/shared/container'];

    const files: string[] = [];
    const shouldSkipDir = (p: string) =>
      /(^|[\\/])node_modules([\\/]|$)/.test(p) ||
      /(^|[\\/])src[\\/]shared[\\/]media([\\/]|$)/.test(p);
    const isTargetFile = (p: string) => /[.]ts$/.test(p) && !/[.]d[.]ts$/.test(p);

    const walk = (dir: string) => {
      if (shouldSkipDir(dir)) return;
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        const st = statSync(full);
        if (st.isDirectory()) {
          if (!shouldSkipDir(full)) walk(full);
        } else if (st.isFile() && isTargetFile(full)) {
          files.push(full);
        }
      }
    };

    includeRoots.forEach(r => walk(r));

    const offenders: { file: string; line: number; lineText: string }[] = [];
    const barrelPatterns = [
      /from\s+['"]@shared\/media['"]/,
      /from\s+['"]\.\.\/media['"]/,
      /from\s+['"]\.\.\/\.\.\/shared\/media['"]/,
    ];

    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      const lines = content.split(/\r?\n/);
      lines.forEach((line, idx) => {
        if (barrelPatterns.some(re => re.test(line))) {
          offenders.push({ file, line: idx + 1, lineText: line.trim() });
        }
      });
    }

    const rel = (f: string) => relative(process.cwd(), f).replace(/\\/g, '/');
    const message =
      offenders.length === 0
        ? 'no media barrel imports in sensitive modules'
        : offenders.map(o => `${rel(o.file)}:${o.line} -> ${o.lineText}`).join('\n');

    expect({ message, offenders }).toEqual({
      message: 'no media barrel imports in sensitive modules',
      offenders: [],
    });
  });
});
