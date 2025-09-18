#!/usr/bin/env node
/*
 * scripts/generate-icon-map.cjs
 * ICN-R5 REFACTOR: 아이콘 동적 import 맵 자동 생성 스텁
 * 현재는 iconRegistry.ts 내 ICON_IMPORTS 수동 정의를 검증만 수행.
 * 향후 hero 디렉터리 스캔 후 템플릿으로 ICON_IMPORTS 오버라이트 가능.
 */
const { readdirSync, writeFileSync } = require('node:fs');
const { resolve } = require('node:path');

function main() {
  const heroDir = resolve(__dirname, '../src/shared/components/ui/Icon/hero');
  const files = readdirSync(heroDir).filter(f => /^Hero[A-Za-z0-9].*\.tsx$/.test(f));
  // 간단 검증 출력
  // eslint-disable-next-line no-console
  console.log(`[generate-icon-map] hero icon count: ${files.length}`);
  // 향후: 템플릿 생성 -> src/shared/services/iconRegistry.generated.ts 등
  writeFileSync(
    resolve(__dirname, '../.cache/icon-map-stub.json'),
    JSON.stringify({ generatedAt: new Date().toISOString(), files }, null, 2),
    'utf8'
  );
}

main();
