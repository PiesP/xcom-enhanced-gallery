import { readdir, readFile } from 'fs/promises';
import { extname, join } from 'path';
import crypto from 'crypto';

interface TestFileMeta {
  file: string;
  hash: string;
  simplified: string;
  size: number;
}

async function collect(dir: string, acc: string[] = []): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) await collect(full, acc);
    else if (/\.(test|spec)\.[tj]sx?$/.test(e.name)) acc.push(full);
  }
  return acc;
}

function simplify(content: string): string {
  // 시나리오 의미만 추출 (it/describe 타이틀 + expect 패턴)
  return (
    content
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .match(/(describe|it|test)\([^)]*\)|expect\([^)]*\)/g)
      ?.join('\n')
      .toLowerCase() ?? ''
  );
}

function stableHash(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

async function main(): Promise<void> {
  const root = join(process.cwd(), 'test');
  const files = await collect(root);
  const metas: TestFileMeta[] = [];
  for (const f of files) {
    const raw = await readFile(f, 'utf8');
    const simplified = simplify(raw);
    const hash = stableHash(simplified);
    metas.push({ file: f.replace(process.cwd() + '\\', ''), hash, simplified, size: raw.length });
  }

  const groups = new Map<string, TestFileMeta[]>();
  metas.forEach(m => {
    groups.set(m.hash, [...(groups.get(m.hash) || []), m]);
  });

  const duplicates = [...groups.values()].filter(g => g.length > 1);

  if (!duplicates.length) {
    console.log('✅ 중복 후보 없음');
    return;
  }

  console.log('⚠️ 중복/유사 시나리오 그룹');
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
