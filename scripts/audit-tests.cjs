// Duplicate / similar test audit script (CommonJS)
// 목적: describe/it/expect 토큰 기반 단순화 해시로 유사/중복 테스트 파일 탐지

const { readdir, readFile } = require('fs/promises');
const { join } = require('path');
const crypto = require('crypto');

async function collect(dir, acc = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) await collect(full, acc);
    else if (/\.(test|spec)\.[tj]sx?$/.test(e.name)) acc.push(full);
  }
  return acc;
}

function simplify(content) {
  return (
    content
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .match(/(describe|it|test)\([^)]*\)|expect\([^)]*\)/g)
      ?.join('\n')
      .toLowerCase() || ''
  );
}

function stableHash(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

async function main() {
  const root = join(process.cwd(), 'test');
  const files = await collect(root);
  const metas = [];
  for (const f of files) {
    const raw = await readFile(f, 'utf8');
    const simplified = simplify(raw);
    const hash = stableHash(simplified);
    metas.push({ file: f.replace(process.cwd() + '\\', ''), hash, size: raw.length });
  }

  const groups = new Map();
  metas.forEach(m => {
    groups.set(m.hash, [...(groups.get(m.hash) || []), m]);
  });

  const duplicates = [...groups.values()].filter(g => g.length > 1);
  if (!duplicates.length) {
    console.log('✅ 중복 후보 없음');
    return;
  }

  console.log('⚠️ 중복/유사 시나리오 그룹 (사이즈 작은 것을 우선 보존 고려)');
  for (const group of duplicates) {
    console.log('\n---');
    group
      .sort((a, b) => a.size - b.size)
      .forEach((m, idx) => {
        console.log(`${idx === 0 ? '🟩 기준(보존 제안)' : '🟥 후보'}: ${m.file} (size=${m.size})`);
      });
  }
  console.log('\n실행 후 결과를 바탕으로 테스트 축소 결정을 진행하세요.');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
