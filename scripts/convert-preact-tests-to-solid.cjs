/**
 * Convert Preact test files to Solid.js testing patterns
 * Phase 10.1 automation script
 */

const fs = require('fs');
const path = require('path');

// Files to convert
const filesToConvert = [
  'test/unit/shared/components/ui/aria-contract.test.tsx',
  'test/unit/shared/components/ui/IconButton.test.tsx',
  'test/unit/shared/components/ui/variant-contract.test.tsx',
  'test/unit/shared/components/ui/wrapper-compat.test.tsx',
  'test/unit/shared/components/ui/ToolbarHeadless.test.tsx',
  'test/unit/shared/components/ui/SettingsModal.test.tsx',
  'test/unit/shared/components/ui/icon-only-accessibility.test.tsx',
  'test/unit/shared/components/ui/Button-icon-variant.test.tsx',
  'test/unit/shared/components/ui/aria-attributes-migration.test.tsx',
];

function convertFile(filePath) {
  const fullPath = path.resolve(__dirname, '..', filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf-8');
  let modified = false;

  // 1. Remove `import { h } from 'preact';`
  if (content.includes("import { h } from 'preact';")) {
    content = content.replace(/import\s*\{\s*h\s*\}\s*from\s*['"]preact['"];?\s*\n/g, '');
    modified = true;
  }

  // 2. Replace renderWithVendorPreact import
  if (content.includes('renderWithVendorPreact')) {
    content = content.replace(
      /import\s*\{\s*renderWithVendorPreact\s+as\s+render\s*\}\s*from\s*['"][^'"]+render-with-vendor-preact['"]/g,
      "import { render } from '@solidjs/testing-library'"
    );
    modified = true;
  }

  // 3. Replace @testing-library/preact cleanup
  if (content.includes('@testing-library/preact')) {
    content = content.replace(
      /import\s*\{([^}]+)\}\s*from\s*['"]@testing-library\/preact['"];?/g,
      (match, imports) => {
        const importList = imports
          .split(',')
          .map(i => i.trim())
          .filter(i => i !== 'cleanup');
        if (importList.length === 0) {
          return "import { cleanup } from '@solidjs/testing-library';";
        }
        return `import { ${importList.join(', ')} } from '@solidjs/testing-library';`;
      }
    );

    // Add cleanup import if not present
    if (content.includes('cleanup()') && !content.includes("from '@solidjs/testing-library'")) {
      content = content.replace(
        /import\s*\{\s*render\s*\}\s*from\s*'@solidjs\/testing-library'/,
        "import { render, cleanup } from '@solidjs/testing-library'"
      );
    }
    modified = true;
  }

  // 4. Convert h() calls to JSX (simple pattern - may need manual adjustment)
  // Pattern: h(Component, { props }, children) → <Component {...props}>children</Component>
  // This is complex and may require manual intervention for complex cases

  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf-8');
    console.log(`✅ Converted: ${filePath}`);
    return true;
  }

  console.log(`⏭️  No changes needed: ${filePath}`);
  return false;
}

function main() {
  console.log('🔄 Converting Preact test files to Solid.js patterns...\n');

  let converted = 0;
  for (const file of filesToConvert) {
    if (convertFile(file)) {
      converted++;
    }
  }

  console.log(`\n✨ Conversion complete: ${converted}/${filesToConvert.length} files modified`);
  console.log('\n⚠️  Note: h() to JSX conversion may need manual adjustment.');
  console.log('    Please review each file and test for correctness.');
}

main();
