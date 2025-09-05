/**
 * @fileoverview 삭제된 파일들을 참조하는 테스트 파일들을 정리
 */

const fs = require('fs');
const path = require('path');

// 삭제된 파일들
const deletedFiles = [
  'shared/components/ui/primitive/IconButton.css',
  'shared/components/ui/Toolbar/ToolbarButton.module.css',
];

// 대체할 파일들 (남아있는 파일들만)
const remainingFiles = ['shared/components/ui/Button/Button.module.css'];

// 업데이트할 테스트 파일들
const testFiles = [
  'test/unit/styles/interaction-state-standards.test.ts',
  'test/unit/styles/theme-color-consistency.test.ts',
];

function updateTestFile(filePath) {
  console.log(`\n📄 Updating ${filePath}`);

  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  // 삭제된 파일들을 배열에서 제거
  deletedFiles.forEach(deletedFile => {
    const escapedPath = deletedFile.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // 배열에서 삭제된 항목 제거
    const arrayItemRegex = new RegExp(`\\s*'${escapedPath}',?\\s*`, 'g');
    const beforeUpdate = content;
    content = content.replace(arrayItemRegex, '\n      ');

    if (content !== beforeUpdate) {
      console.log(`  ✅ Removed reference to ${deletedFile}`);
      modified = true;
    }
  });

  // 빈 배열이 생기지 않도록 최소한 하나는 남겨둠
  const cssFilesArrayRegex = /const cssFiles = \[\s*\]/g;
  if (cssFilesArrayRegex.test(content)) {
    content = content.replace(
      cssFilesArrayRegex,
      `const cssFiles = [
      '${remainingFiles[0]}',
    ]`
    );
    console.log(`  ✅ Added fallback file to prevent empty array`);
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`  ✅ Updated ${filePath}`);
  } else {
    console.log(`  ⏩ No changes needed for ${filePath}`);
  }
}

function main() {
  console.log('🧹 Cleaning up test file references to deleted files...\n');

  testFiles.forEach(testFile => {
    const fullPath = path.join(__dirname, '..', testFile);

    if (fs.existsSync(fullPath)) {
      try {
        updateTestFile(fullPath);
      } catch (error) {
        console.error(`❌ Error updating ${testFile}:`, error.message);
      }
    } else {
      console.log(`⚠️  Test file not found: ${testFile}`);
    }
  });

  console.log('\n✅ Test file cleanup completed');
}

main();
