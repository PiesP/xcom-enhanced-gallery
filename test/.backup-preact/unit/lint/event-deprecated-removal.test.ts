import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readdirSync } from 'node:fs';

// Guard test: forbid deprecated event utilities usage
describe('lint: deprecated event utilities removed (S3)', () => {
  const cwd = process.cwd();
  const srcDir = join(cwd, 'src');

  const DISALLOWED = [
    // Importing DOMEventManager directly (alias or relative)
    /from\s+['"]@shared\/dom\/DOMEventManager['"]/,
    /from\s+['"][./].*shared\/dom\/DOMEventManager['"]/,
    // Importing GalleryEventManager symbol from events (alias or relative)
    /from\s+['"]@shared\/utils\/events['"][^;]*\bGalleryEventManager\b/,
    /from\s+['"][./].*shared\/utils\/events['"][^;]*\bGalleryEventManager\b/,
    // Importing TwitterEventManager symbol from events (alias or relative)
    /from\s+['"]@shared\/utils\/events['"][^;]*\bTwitterEventManager\b/,
    /from\s+['"][./].*shared\/utils\/events['"][^;]*\bTwitterEventManager\b/,
    // Importing the events module at all from external consumers (ban entire module)
    /from\s+['"]@shared\/utils\/events['"]/,
    /from\s+['"][./].*shared\/utils\/events['"]/,
    // Importing deprecated symbols via event-managers barrel
    /from\s+['"]@shared\/services\/event-managers['"][^;]*\bDOMEventManager\b/,
    /from\s+['"]@shared\/services\/event-managers['"][^;]*\bGalleryEventManager\b/,
    /from\s+['"]@shared\/services\/event-managers['"][^;]*\bTwitterEventManager\b/,
    // Importing TwitterEventManager via services/EventManager directly (alias or relative)
    /from\s+['"]@shared\/services\/EventManager['"][^;]*\bTwitterEventManager\b/,
    /from\s+['"][./].*shared\/services\/EventManager['"][^;]*\bTwitterEventManager\b/,
  ];

  function walk(dir: string, list: string[] = []): string[] {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full, list);
      else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) list.push(full);
    }
    return list;
  }

  it('source does not import deprecated event utilities', () => {
    const files = walk(srcDir);
    const offenders: Array<{ file: string; pattern: string }> = [];
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      for (const rx of DISALLOWED) {
        if (rx.test(text)) offenders.push({ file, pattern: String(rx) });
      }
    }

    // Allow internal definitions within the deprecated modules themselves
    const filtered = offenders.filter(o => {
      // Allow matches inside the source modules themselves and the unified EventManager adapter
      const isModuleSelfWin =
        /shared\\dom\\DOMEventManager\.ts$/.test(o.file) ||
        /shared\\utils\\events\.ts$/.test(o.file);
      const isModuleSelfPosix =
        /shared\/dom\/DOMEventManager\.ts$/.test(o.file) ||
        /shared\/utils\/events\.ts$/.test(o.file);
      const isUnifiedAdapterWin = /shared\\services\\EventManager\.ts$/.test(o.file);
      const isUnifiedAdapterPosix = /shared\/services\/EventManager\.ts$/.test(o.file);
      const isEventsBarrelWin = /shared\\utils\\events\\index\.ts$/.test(o.file);
      const isEventsBarrelPosix = /shared\/utils\/events\/index\.ts$/.test(o.file);
      return !(
        isModuleSelfWin ||
        isModuleSelfPosix ||
        isUnifiedAdapterWin ||
        isUnifiedAdapterPosix ||
        isEventsBarrelWin ||
        isEventsBarrelPosix
      );
    });

    expect(
      filtered,
      `Deprecated event utilities found:\n${filtered
        .map(o => `- ${o.file} matched ${o.pattern}`)
        .join('\n')}`
    ).toHaveLength(0);
  });
});
