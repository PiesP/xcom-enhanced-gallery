/**
 * @fileoverview Design Token Policy - Unified token usage enforcement
 *
 * This test enforces the design token system policy across the entire codebase:
 * 1. No hardcoded colors (hex, rgb, oklch) in CSS/TSX files
 * 2. No hardcoded durations/easings in runtime injected styles
 * 3. No direct token usage in inline styles (must use CSS classes)
 * 4. All component CSS must reference semantic/component tokens only
 *
 * Consolidates checks from:
 * - design-tokens.usage-scan.red.test.ts
 * - injected-css.token-policy.red.test.ts
 * - component-css.token-source.guard.test.ts
 * - design-token-violations.test.ts
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function toPosix(p: string): string {
  return p.replace(/\\/g, '/');
}

function listFilesRecursive(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFilesRecursive(p));
    else out.push(p);
  }
  return out;
}

describe('Design Token Policy - Unified', () => {
  const ROOT = process.cwd();
  const SRC = join(ROOT, 'src');

  describe('1. No hardcoded colors in source files', () => {
    it('should not contain raw color literals in component CSS', () => {
      const files = listFilesRecursive(SRC).filter(f => /\.module\.css$/.test(f));
      const offenders: string[] = [];

      // Allowed exceptions: primitive token definition file and certain legacy files
      const PRIMITIVE_FILE = toPosix(join(ROOT, 'src/shared/styles/design-tokens.primitive.css'));
      const ALLOW_LIST = new Set([
        PRIMITIVE_FILE,
        toPosix(
          join(
            ROOT,
            'src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.module.css'
          )
        ),
        toPosix(join(ROOT, 'src/features/gallery/styles/Gallery.module.css')),
      ]);

      for (const file of files) {
        if (ALLOW_LIST.has(toPosix(file))) continue;

        const content = readFileSync(file, 'utf8');
        const noComments = content.replace(/\/\*[\s\S]*?\*\//g, '');

        // Check for hex colors (#rrggbb, #rgb)
        if (/(?:^|[^&])#[0-9a-fA-F]{3,8}\b/.test(noComments)) {
          offenders.push(`${file}: contains hex color`);
        }

        // Check for rgb/rgba
        if (/rgba?\s*\(/.test(noComments)) {
          offenders.push(`${file}: contains rgb/rgba`);
        }

        // Check for oklch (allowed only in primitive tokens and specific legacy files)
        if (/oklch\s*\(/.test(noComments)) {
          offenders.push(`${file}: contains oklch (use primitive tokens)`);
        }
      }

      if (offenders.length > 0) {
        throw new Error(
          'Component CSS files must not contain raw color literals:\n' +
            offenders.map(o => `  - ${o}`).join('\n') +
            '\n\nUse semantic/component tokens (var(--xeg-*)) instead.'
        );
      }
    });

    it('should not contain inline color styles in TSX files', () => {
      const files = listFilesRecursive(SRC).filter(f => /\.tsx?$/.test(f));
      const offenders: string[] = [];

      for (const file of files) {
        const content = readFileSync(file, 'utf8');

        // Check for style prop with color literals
        if (/style\s*=\s*\{[^}]*(?:#[0-9a-fA-F]{3,8}|rgba?\s*\(|oklch\s*\()/.test(content)) {
          offenders.push(file);
        }
      }

      if (offenders.length > 0) {
        throw new Error(
          'TSX files must not contain inline color styles:\n' +
            offenders.map(f => `  - ${f}`).join('\n') +
            '\n\nUse CSS modules with token variables instead.'
        );
      }
    });
  });

  describe('2. Runtime injected CSS must use tokens', () => {
    beforeEach(() => {
      const doc = globalThis.document;
      doc
        .querySelectorAll('style#xcom-gallery-animations, style#xcom-animations')
        .forEach(s => s.remove());
    });

    it('css-animations inject uses only duration/easing tokens', async () => {
      const { injectAnimationStyles } = await import('../../../src/shared/utils/css-animations');
      injectAnimationStyles();

      const doc = globalThis.document;
      const style = doc.getElementById('xcom-gallery-animations');
      expect(style).not.toBeNull();
      const css = style?.textContent || '';

      // No hardcoded duration values (e.g., 150ms, 0.2s)
      const hardcodedDurations = css.match(/\b\d+(?:\.\d+)?m?s\b/g) || [];
      expect(hardcodedDurations.length).toBe(0);

      // No raw easing functions (ignore var(...) references)
      const cssNoVars = css.replace(/var\([^)]*\)/g, '');
      expect(cssNoVars).not.toMatch(/cubic-bezier\(/);
      expect(cssNoVars).not.toMatch(/\bease(?:-in|-out|-in-out)?\b/);

      // Must use standard easing tokens
      expect(css).toMatch(/var\(--xeg-(?:ease-standard|ease-accelerate|ease-decelerate)\)/);
    });

    it('AnimationService inject uses only duration/easing tokens', async () => {
      const { AnimationService } = await import('../../../src/shared/services/animation-service');
      const svc = AnimationService.getInstance();
      const doc = globalThis.document;
      await svc.fadeIn(doc.createElement('div'));

      const style = doc.getElementById('xcom-animations');
      expect(style).not.toBeNull();
      const css = style?.textContent || '';

      // No hardcoded duration values
      const hardcodedDurations = css.match(/\b\d+(?:\.\d+)?m?s\b/g) || [];
      expect(hardcodedDurations.length).toBe(0);

      // No raw easing functions
      const cssNoVars = css.replace(/var\([^)]*\)/g, '');
      expect(cssNoVars).not.toMatch(/cubic-bezier\(/);
      expect(cssNoVars).not.toMatch(/\bease(?:-in|-out|-in-out)?\b/);

      // Must use standard easing tokens
      expect(css).toMatch(/var\(--xeg-(?:ease-standard|ease-accelerate|ease-decelerate)\)/);
    });
  });

  describe('3. Unused legacy tokens detection', () => {
    it('should not have unused overlay aliases without color- prefix', () => {
      const TOKENS_FILE = toPosix(join(ROOT, 'src/shared/styles/design-tokens.css'));
      const TARGET_TOKENS = [
        '--xeg-overlay-light',
        '--xeg-overlay-medium',
        '--xeg-overlay-strong',
        '--xeg-overlay-backdrop',
      ] as const;

      const tokensCss = readFileSync(TOKENS_FILE, 'utf8');
      const declared = new Set(TARGET_TOKENS.filter(t => new RegExp(`${t}\\s*:`).test(tokensCss)));

      const offenders: string[] = [];
      const files = listFilesRecursive(SRC).filter(f => /\.(css|ts|tsx)$/.test(f));

      for (const token of TARGET_TOKENS) {
        if (!declared.has(token)) continue; // Already removed

        const usageNeedle = `var(${token})`;
        let used = false;
        for (const f of files) {
          if (toPosix(f) === TOKENS_FILE) continue; // Skip declaration file
          const text = readFileSync(f, 'utf8');
          if (text.includes(usageNeedle)) {
            used = true;
            break;
          }
        }

        if (!used) offenders.push(token);
      }

      if (offenders.length > 0) {
        throw new Error(
          'Unused legacy overlay aliases detected (remove from tokens file):\n' +
            offenders.map(t => `- ${t}`).join('\n')
        );
      }
    });
  });

  describe('4. Component token source validation', () => {
    it('should not reference primitive tokens directly in component CSS', () => {
      const files = listFilesRecursive(SRC).filter(f => /\.module\.css$/.test(f));
      const SEMANTIC_FILE = toPosix(join(ROOT, 'src/shared/styles/design-tokens.semantic.css'));
      const COMPONENT_FILE = toPosix(join(ROOT, 'src/shared/styles/design-tokens.component.css'));
      const offenders: string[] = [];

      for (const file of files) {
        const posixPath = toPosix(file);
        // Skip token definition files themselves
        if (posixPath === SEMANTIC_FILE || posixPath === COMPONENT_FILE) continue;

        const content = readFileSync(file, 'utf8');

        // Check for primitive token usage (--xeg-primitive-*)
        if (/var\(--xeg-primitive-/.test(content)) {
          offenders.push(`${file}: references primitive tokens directly`);
        }
      }

      if (offenders.length > 0) {
        throw new Error(
          'Component CSS must reference semantic/component tokens only:\n' +
            offenders.map(o => `  - ${o}`).join('\n') +
            '\n\nCreate semantic mappings in design-tokens.semantic.css'
        );
      }
    });

    it('should not have local token redefinitions in component CSS', () => {
      const files = listFilesRecursive(SRC).filter(f => /\.module\.css$/.test(f));
      const SEMANTIC_FILE = toPosix(join(ROOT, 'src/shared/styles/design-tokens.semantic.css'));
      const COMPONENT_FILE = toPosix(join(ROOT, 'src/shared/styles/design-tokens.component.css'));
      const offenders: Array<{ file: string; redefinitions: string[] }> = [];

      for (const file of files) {
        const posixPath = toPosix(file);
        // Skip token definition files themselves
        if (posixPath === SEMANTIC_FILE || posixPath === COMPONENT_FILE) continue;

        const content = readFileSync(file, 'utf8');

        // Detect local redefinitions: --xeg-xxx: var(--xeg-yyy)
        const redefinitions = content.match(/^\s*--xeg-[a-z0-9-]+:\s*var\(--xeg-/gm);

        if (redefinitions && redefinitions.length > 0) {
          offenders.push({ file, redefinitions });
        }
      }

      if (offenders.length > 0) {
        throw new Error(
          'Component CSS must not redefine semantic tokens locally:\n' +
            offenders
              .map(o => `  - ${o.file}:\n` + o.redefinitions.map(r => `    ${r.trim()}`).join('\n'))
              .join('\n') +
            '\n\nUse semantic tokens directly from design-tokens.semantic.css'
        );
      }
    });
  });

  describe('5. Token naming and consistency standards', () => {
    it('should use consistent xeg- prefix for all component tokens', () => {
      const files = listFilesRecursive(SRC).filter(f => /\.module\.css$/.test(f));
      const SEMANTIC_FILE = toPosix(join(ROOT, 'src/shared/styles/design-tokens.semantic.css'));
      const TOOLBAR_FILE = toPosix(
        join(ROOT, 'src/shared/components/ui/Toolbar/Toolbar.module.css')
      );
      const offenders: Array<{ file: string; tokens: string[] }> = [];

      const STANDARD_PREFIXES = [
        '--color-',
        '--shadow-',
        '--radius-',
        '--space-',
        '--duration-',
        '--ease-',
        '--font-',
        '--line-',
        '--border-',
      ];

      // Local state tokens allowed in specific files
      const LOCAL_STATE_TOKENS = new Set([
        '--toolbar-opacity',
        '--toolbar-pointer-events',
        '--toolbar-bg',
        '--toolbar-bg-loading',
        '--toolbar-bg-downloading',
        '--toolbar-bg-error',
      ]);

      for (const file of files) {
        const posixPath = toPosix(file);
        if (posixPath === SEMANTIC_FILE) continue;

        const content = readFileSync(file, 'utf8');
        const nonXegTokens = content.match(/var\(--(?!xeg-)[a-z][a-z0-9-]*\)/g) || [];

        // Filter out standard CSS tokens and local state tokens
        const nonStandard = nonXegTokens.filter(token => {
          const isStandard = STANDARD_PREFIXES.some(prefix => token.includes(prefix));
          const tokenName = token.match(/var\((--[^)]+)\)/)?.[1];
          const isLocalState =
            posixPath === TOOLBAR_FILE && tokenName && LOCAL_STATE_TOKENS.has(tokenName);
          return !isStandard && !isLocalState;
        });

        if (nonStandard.length > 0) {
          const uniqueTokens = Array.from(new Set(nonStandard));
          offenders.push({ file, tokens: uniqueTokens });
        }
      }

      if (offenders.length > 0) {
        throw new Error(
          'Component CSS should use xeg- prefixed tokens for custom properties:\n' +
            offenders
              .map(o => `  - ${o.file}:\n` + o.tokens.map(t => `    ${t}`).join('\n'))
              .join('\n') +
            '\n\nNote: Standard tokens (--color-, --shadow-, etc.) and local state tokens are allowed.'
        );
      }
    });

    it('should not have duplicate token definitions in semantic CSS', () => {
      const SEMANTIC_FILE = join(ROOT, 'src/shared/styles/design-tokens.semantic.css');
      const content = readFileSync(SEMANTIC_FILE, 'utf8');

      // Extract all token definitions outside of theme scopes
      const rootScope = content.match(/:root\s*\{[^}]+\}/gs)?.[0] || '';
      const definitions = rootScope.match(/--[a-z0-9-]+:/g) || [];

      const counts = new Map<string, number>();
      for (const def of definitions) {
        const token = def.slice(0, -1); // Remove ':'
        counts.set(token, (counts.get(token) || 0) + 1);
      }

      const duplicates = Array.from(counts.entries()).filter(([_, count]) => count > 1);

      if (duplicates.length > 0) {
        throw new Error(
          'Duplicate token definitions found in :root scope of semantic.css:\n' +
            duplicates.map(([token, count]) => `  - ${token} (${count} times)`).join('\n')
        );
      }
    });

    it('should have required toolbar tokens in semantic CSS', () => {
      const SEMANTIC_FILE = join(ROOT, 'src/shared/styles/design-tokens.semantic.css');
      const content = readFileSync(SEMANTIC_FILE, 'utf8');

      const REQUIRED_TOKENS = [
        '--xeg-bg-toolbar',
        '--color-border-default',
        '--xeg-shadow-md',
      ] as const;

      const missing = REQUIRED_TOKENS.filter(token => !new RegExp(`${token}\\s*:`).test(content));

      if (missing.length > 0) {
        throw new Error(
          'Required toolbar tokens missing in semantic CSS:\n' +
            missing.map(t => `  - ${t}`).join('\n')
        );
      }
    });
  });
});
