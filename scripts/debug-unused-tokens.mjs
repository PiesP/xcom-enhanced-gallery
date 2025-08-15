/**
 * Unused 토큰 상세 분석 스크립트
 */
import { promises as fs } from 'fs';
import path from 'path';

// 정규식: 정의 ( --token-name: )
const DEFINE_RE = /(--[a-z0-9-]+)\s*:/gi;
// 정규식: 참조 ( var(--token-name) )
const REFERENCE_RE = /var\(\s*(--[a-z0-9-]+)\s*(?:[,)]|$)/gi;

function collectByRegex(source, regex, prefix) {
  const out = new Set();
  if (!source) return out;
  let m;
  const re = new RegExp(regex.source, regex.flags);
  while ((m = re.exec(source)) !== null) {
    const captured = m[1];
    if (typeof captured !== 'string') continue;
    const token = captured;
    if (!prefix || token.startsWith(prefix)) {
      out.add(token);
    }
  }
  return out;
}

async function analyzeStyleTokens(opts) {
  const cwd = opts.cwd || process.cwd();
  const prefix = opts.tokenPrefixFilter || '--xeg-';
  const includeDefinitionRefs =
    opts.includeDefinitionReferences === undefined ? true : !!opts.includeDefinitionReferences;

  const definedTokens = new Set();
  const referencedTokens = new Set();

  // 정의 파일 처리
  await Promise.all(
    opts.definitionRoots.map(async rel => {
      const abs = path.isAbsolute(rel) ? rel : path.join(cwd, rel);
      try {
        const css = await fs.readFile(abs, 'utf-8');
        collectByRegex(css, DEFINE_RE, prefix).forEach(t => definedTokens.add(t));
        if (includeDefinitionRefs) {
          collectByRegex(css, REFERENCE_RE, prefix).forEach(t => referencedTokens.add(t));
        }
      } catch {
        // ignore missing files
      }
    })
  );

  // 컴포넌트 파일 처리
  await Promise.all(
    opts.componentFiles.map(async rel => {
      const abs = path.isAbsolute(rel) ? rel : path.join(cwd, rel);
      try {
        const css = await fs.readFile(abs, 'utf-8');
        collectByRegex(css, REFERENCE_RE, prefix).forEach(t => referencedTokens.add(t));
      } catch {
        // ignore missing files
      }
    })
  );

  // 누락 토큰 = referenced - defined
  const missingTokens = new Set();
  referencedTokens.forEach(t => {
    if (!definedTokens.has(t)) missingTokens.add(t);
  });

  // 사용되지 않은 토큰 = defined - referenced
  const unusedTokens = new Set();
  definedTokens.forEach(t => {
    if (!referencedTokens.has(t)) unusedTokens.add(t);
  });

  return {
    definedTokens,
    referencedTokens,
    missingTokens,
    unusedTokens,
  };
}

async function main() {
  const root = path.join(process.cwd(), 'src');
  const allCss = [];

  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) await walk(full);
      else if (
        full.endsWith('.css') &&
        !full.endsWith('design-tokens.css') &&
        !full.endsWith('design-tokens-solid.css')
      ) {
        allCss.push(full);
      }
    }
  }
  await walk(root);

  const result = await analyzeStyleTokens({
    definitionRoots: [
      'src/shared/styles/design-tokens.css',
      'src/shared/styles/design-tokens-solid.css',
    ],
    componentFiles: allCss.map(p => path.relative(process.cwd(), p).replace(/\\/g, '/')),
  });

  // deprecated 토큰 파싱
  const tokensCss = await fs.readFile('src/shared/styles/design-tokens.css', 'utf-8');
  const deprecatedSectionMatch = tokensCss.match(/DEPRECATED TOKENS[\s\S]*?:root \{([\s\S]*?)\n\}/);
  const deprecatedTokens = new Set();
  if (deprecatedSectionMatch) {
    const body = deprecatedSectionMatch[1];
    const re = /(--[a-z0-9-]+)\s*:/gi;
    let m;
    while ((m = re.exec(body)) !== null) deprecatedTokens.add(m[1]);
  }

  const effectiveUnused = [...result.unusedTokens].filter(t => !deprecatedTokens.has(t));

  console.log('=== TOKEN ANALYSIS ===');
  console.log('Total defined:', result.definedTokens.size);
  console.log('Total referenced:', result.referencedTokens.size);
  console.log('Total unused:', result.unusedTokens.size);
  console.log('Deprecated tokens:', deprecatedTokens.size);
  console.log('Effective unused:', effectiveUnused.length);
  console.log('Need to remove:', Math.max(0, effectiveUnused.length - 200));

  console.log('\n=== SAMPLE UNUSED TOKENS (first 50) ===');
  effectiveUnused.slice(0, 50).forEach((token, i) => {
    console.log((i + 1).toString().padStart(2) + ':', token);
  });

  // 토큰 그룹별 분석
  const groups = {};
  effectiveUnused.forEach(token => {
    const parts = token.split('-');
    if (parts.length >= 3) {
      const group = parts.slice(0, 3).join('-'); // --xeg-color, --xeg-spacing 등
      groups[group] = (groups[group] || 0) + 1;
    }
  });

  console.log('\n=== UNUSED TOKEN GROUPS ===');
  Object.entries(groups)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15)
    .forEach(([group, count]) => {
      console.log(`${group}*: ${count} tokens`);
    });
}

main().catch(console.error);
