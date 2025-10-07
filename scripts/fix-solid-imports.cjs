#!/usr/bin/env node
/**
 * @fileoverview Solid.js imports를 vendors getter로 변환하는 스크립트
 * Phase 9: Solid.js Vendors Getter 전환
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// 변환 통계
const stats = {
  processed: 0,
  modified: 0,
  skipped: 0,
  errors: [],
};

/**
 * Solid.js import를 vendors getter로 변환
 */
function convertSolidImports(content, filePath) {
  let modified = false;
  let result = content;

  // vendor-manager-static.ts는 제외 (vendors 제공자 자체)
  if (filePath.includes('vendor-manager-static.ts')) {
    return { content: result, modified: false };
  }

  // Pattern 1: import { items, type Type } from 'solid-js';
  // 먼저 type과 일반 import를 분리
  const solidImportRegex = /import\s*\{([^}]+)\}\s*from\s+['"]solid-js['"];?\s*\n/g;
  const matches = [...content.matchAll(solidImportRegex)];

  if (matches.length > 0) {
    modified = true;

    matches.forEach(match => {
      const imports = match[1];
      const typeImports = [];
      const regularImports = [];

      // import 문자열을 파싱하여 type과 일반을 분리
      imports.split(',').forEach(item => {
        const trimmed = item.trim();
        if (trimmed.startsWith('type ')) {
          typeImports.push(trimmed.replace(/^type\s+/, ''));
        } else if (trimmed) {
          regularImports.push(trimmed);
        }
      });

      let replacement = '';

      // 일반 import가 있으면 getSolid() 사용
      if (regularImports.length > 0) {
        replacement += `import { getSolid } from '@shared/external/vendors';\nconst { ${regularImports.join(', ')} } = getSolid();\n`;
      }

      // type import가 있으면 별도로
      if (typeImports.length > 0) {
        replacement += `import type { ${typeImports.join(', ')} } from '@shared/external/vendors';\n`;
      }

      result = result.replace(match[0], replacement);
    });
  }

  // Pattern 2: import type { Type } from 'solid-js'; (이미 분리된 경우)
  const solidTypeOnlyRegex = /import\s+type\s*\{([^}]+)\}\s*from\s+['"]solid-js['"];?\s*\n/g;
  if (solidTypeOnlyRegex.test(result)) {
    result = result.replace(solidTypeOnlyRegex, (match, types) => {
      modified = true;
      const cleanTypes = types.trim();
      return `import type { ${cleanTypes} } from '@shared/external/vendors';\n`;
    });
  }

  // Pattern 3: import { items, type Type } from 'solid-js/web';
  const solidWebImportRegex = /import\s*\{([^}]+)\}\s*from\s+['"]solid-js\/web['"];?\s*\n/g;
  const webMatches = [...result.matchAll(solidWebImportRegex)];

  if (webMatches.length > 0) {
    modified = true;

    webMatches.forEach(match => {
      const imports = match[1];
      const typeImports = [];
      const regularImports = [];

      imports.split(',').forEach(item => {
        const trimmed = item.trim();
        if (trimmed.startsWith('type ')) {
          typeImports.push(trimmed.replace(/^type\s+/, ''));
        } else if (trimmed) {
          regularImports.push(trimmed);
        }
      });

      let replacement = '';

      if (regularImports.length > 0) {
        replacement += `import { getSolidWeb } from '@shared/external/vendors';\nconst { ${regularImports.join(', ')} } = getSolidWeb();\n`;
      }

      if (typeImports.length > 0) {
        replacement += `import type { ${typeImports.join(', ')} } from '@shared/external/vendors';\n`;
      }

      result = result.replace(match[0], replacement);
    });
  }

  // 중복된 import 제거 및 정리
  if (modified) {
    // getSolid() 중복 제거
    const getSolidImports = [];
    result = result.replace(
      /import { getSolid } from '@shared\/external\/vendors';\nconst \{([^}]+)\} = getSolid\(\);\n/g,
      (match, imports) => {
        getSolidImports.push(imports.trim());
        return '';
      }
    );

    // getSolidWeb() 중복 제거
    const getSolidWebImports = [];
    result = result.replace(
      /import { getSolidWeb } from '@shared\/external\/vendors';\nconst \{([^}]+)\} = getSolidWeb\(\);\n/g,
      (match, imports) => {
        getSolidWebImports.push(imports.trim());
        return '';
      }
    );

    // type import 중복 제거
    const typeImports = [];
    result = result.replace(
      /import type \{([^}]+)\} from '@shared\/external\/vendors';\n/g,
      (match, types) => {
        typeImports.push(types.trim());
        return '';
      }
    );

    // 통합하여 파일 상단에 배치
    let imports = '';

    if (getSolidImports.length > 0) {
      const combined = [
        ...new Set(
          getSolidImports
            .join(', ')
            .split(',')
            .map(s => s.trim())
        ),
      ];
      imports += `import { getSolid } from '@shared/external/vendors';\nconst { ${combined.join(', ')} } = getSolid();\n`;
    }

    if (getSolidWebImports.length > 0) {
      const combined = [
        ...new Set(
          getSolidWebImports
            .join(', ')
            .split(',')
            .map(s => s.trim())
        ),
      ];
      imports += `import { getSolidWeb } from '@shared/external/vendors';\nconst { ${combined.join(', ')} } = getSolidWeb();\n`;
    }

    if (typeImports.length > 0) {
      const combined = [
        ...new Set(
          typeImports
            .join(', ')
            .split(',')
            .map(s => s.trim())
        ),
      ];
      imports += `import type { ${combined.join(', ')} } from '@shared/external/vendors';\n`;
    }

    // 파일 시작 부분에 삽입
    result = imports + '\n' + result;

    // 빈 줄 정리
    result = result.replace(/\n{3,}/g, '\n\n');
  }

  return { content: result, modified };
}

/**
 * 파일 처리
 */
async function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { content: newContent, modified } = convertSolidImports(content, filePath);

    stats.processed++;

    if (modified) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      stats.modified++;
      console.log(`✅ Modified: ${path.relative(process.cwd(), filePath)}`);
    } else {
      stats.skipped++;
    }
  } catch (error) {
    stats.errors.push({ filePath, error: error.message });
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

/**
 * 메인 실행
 */
async function main() {
  console.log('🚀 Starting Solid.js imports conversion...\n');

  // src 디렉터리의 모든 .ts, .tsx 파일 찾기
  const files = await glob('src/**/*.{ts,tsx}', {
    ignore: ['**/node_modules/**', '**/dist/**'],
  });

  console.log(`📁 Found ${files.length} files to process\n`);

  // 각 파일 처리
  for (const file of files) {
    await processFile(file);
  }

  // 결과 출력
  console.log('\n📊 Conversion Summary:');
  console.log(`   Total files processed: ${stats.processed}`);
  console.log(`   Files modified: ${stats.modified}`);
  console.log(`   Files skipped: ${stats.skipped}`);

  if (stats.errors.length > 0) {
    console.log(`\n❌ Errors (${stats.errors.length}):`);
    stats.errors.forEach(({ filePath, error }) => {
      console.log(`   - ${path.relative(process.cwd(), filePath)}: ${error}`);
    });
  }

  console.log('\n✨ Conversion completed!');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
