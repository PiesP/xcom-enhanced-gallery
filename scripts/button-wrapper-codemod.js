/**
 * @fileoverview Button Wrapper Codemod Script
 *
 * 이 스크립트는 프로젝트 전체에서 legacy wrapper 컴포넌트들을
 * 통합된 Button 컴포넌트로 자동 변환합니다.
 *
 * 변환 규칙:
 * 1. ToolbarButton → Button
 * 2. IconButton → Button (iconOnly: true 추가)
 * 3. Button-legacy → Button
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

const importReplacements = [
  // ToolbarButton imports
  {
    oldImport:
      /import\s*\{\s*ToolbarButton\s*(?:,\s*[^}]+)?\s*\}\s*from\s*['"]([^'"]*\/Toolbar\/ToolbarButton)['"];?/g,
    newImport: `import { Button } from '@shared/components/ui/Button';`,
  },
  {
    oldImport:
      /import\s*\{\s*ToolbarButton\s*as\s+(\w+)\s*\}\s*from\s*['"]([^'"]*\/Toolbar\/ToolbarButton)['"];?/g,
    newImport: `import { Button as $1 } from '@shared/components/ui/Button';`,
  },

  // IconButton imports
  {
    oldImport:
      /import\s*\{\s*IconButton\s*(?:,\s*[^}]+)?\s*\}\s*from\s*['"]([^'"]*\/primitive\/IconButton)['"];?/g,
    newImport: `import { Button } from '@shared/components/ui/Button';`,
  },
  {
    oldImport:
      /import\s*\{\s*IconButton\s*as\s+(\w+)\s*\}\s*from\s*['"]([^'"]*\/primitive\/IconButton)['"];?/g,
    newImport: `import { Button as $1 } from '@shared/components/ui/Button';`,
  },

  // Button-legacy imports
  {
    oldImport:
      /import\s*\{\s*Button\s*(?:,\s*[^}]+)?\s*\}\s*from\s*['"]([^'"]*\/Button-legacy\/Button)['"];?/g,
    newImport: `import { Button } from '@shared/components/ui/Button';`,
  },
];

const componentReplacements = [
  // ToolbarButton → Button (props 그대로 유지)
  {
    oldPattern: /<ToolbarButton(\s[^>]*)?>/g,
    newPattern: '<Button$1>',
  },
  {
    oldPattern: /<\/ToolbarButton>/g,
    newPattern: '</Button>',
  },

  // IconButton → Button with iconOnly
  {
    oldPattern: /<IconButton(\s[^>]*)?>/g,
    newPattern: '<Button iconOnly$1>',
  },
  {
    oldPattern: /<\/IconButton>/g,
    newPattern: '</Button>',
  },
];

async function findAllTSXFiles() {
  return glob('**/*.{ts,tsx}', {
    cwd: process.cwd(),
    ignore: ['node_modules/**', 'dist/**', '*.d.ts'],
    absolute: true,
  });
}

function transformImports(content) {
  let transformed = content;

  for (const { oldImport, newImport } of importReplacements) {
    transformed = transformed.replace(oldImport, newImport);
  }

  return transformed;
}

function transformComponents(content) {
  let transformed = content;

  for (const { oldPattern, newPattern } of componentReplacements) {
    transformed = transformed.replace(oldPattern, newPattern);
  }

  return transformed;
}

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const withImports = transformImports(content);
  const withComponents = transformComponents(withImports);

  const hasChanges = content !== withComponents;

  if (hasChanges) {
    const lines = content.split('\n');
    const changedLines = withComponents.split('\n');

    let preview = `\n=== ${path.relative(process.cwd(), filePath)} ===\n`;
    for (let i = 0; i < Math.max(lines.length, changedLines.length); i++) {
      if (lines[i] !== changedLines[i]) {
        preview += `- ${lines[i] || '(empty)'}\n`;
        preview += `+ ${changedLines[i] || '(empty)'}\n`;
      }
    }

    return { hasChanges, preview };
  }

  return { hasChanges: false, preview: '' };
}

async function runCodemod(dryRun = true) {
  console.log('🔍 Scanning for files to transform...');

  const files = await findAllTSXFiles();
  const filesToChange = [];
  let previewOutput = '';

  for (const file of files) {
    const analysis = analyzeFile(file);
    if (analysis.hasChanges) {
      filesToChange.push(file);
      previewOutput += analysis.preview;
    }
  }

  console.log(`\n📊 Found ${filesToChange.length} files to transform:`);
  console.log(filesToChange.map(f => path.relative(process.cwd(), f)).join('\n'));

  if (previewOutput) {
    console.log('\n📝 Preview of changes:');
    console.log(previewOutput);
  }

  if (!dryRun && filesToChange.length > 0) {
    console.log('\n🚀 Applying transformations...');

    for (const file of filesToChange) {
      const content = fs.readFileSync(file, 'utf-8');
      const transformed = transformComponents(transformImports(content));
      fs.writeFileSync(file, transformed, 'utf-8');
      console.log(`✅ ${path.relative(process.cwd(), file)}`);
    }

    console.log(`\n🎉 Successfully transformed ${filesToChange.length} files!`);
  } else if (filesToChange.length === 0) {
    console.log('\n✨ No files need transformation.');
  }
}

// CLI interface
const isDryRun = !process.argv.includes('--apply');

if (isDryRun) {
  console.log('🔍 DRY RUN MODE - No files will be modified');
  console.log('Use --apply flag to actually transform files\n');
}

runCodemod(isDryRun).catch(console.error);
