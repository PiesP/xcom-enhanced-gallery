#!/usr/bin/env node
/**
 * @file Icon Usage Audit Tool
 * @description 코드베이스 전체에서 아이콘 사용 패턴을 분석하고 리포트를 생성합니다.
 *
 * 주요 기능:
 * - 아이콘 사용처 분석 (파일 경로, 줄 번호, 컨텍스트)
 * - 중복 사용 감지 (동일 아이콘이 다른 의미로 사용)
 * - 미사용 아이콘 감지 (등록되었지만 사용되지 않음)
 * - 사용 빈도 분석 (통계 및 백분율)
 * - Markdown 리포트 생성
 *
 * CLI Options:
 * --format <type>   리포트 형식 (markdown, json, console)
 * --output <path>   출력 파일 경로
 */

/* eslint-env node */

import { promises as fs } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

// CORE_ICONS 목록 (iconRegistry.ts에서 정의된 것과 동일)
const CORE_ICONS = [
  'Download',
  'Settings',
  'Close',
  'ChevronLeft',
  'ChevronRight',
  'ZoomIn',
  'ArrowAutofitWidth',
  'ArrowAutofitHeight',
  'ArrowsMaximize',
  'FileZip',
  'QuestionMark',
  'Notifications',
  'NotificationsOff',
];

/**
 * 디렉터리를 재귀적으로 스캔하여 .ts, .tsx 파일을 찾습니다.
 * @param {string} dir
 * @param {Array<string>} fileList
 * @returns {Promise<Array<string>>}
 */
async function scanDirectory(dir, fileList = []) {
  const files = await fs.readdir(dir, { withFileTypes: true });

  for (const file of files) {
    const filePath = join(dir, file.name);

    if (file.isDirectory()) {
      // node_modules, dist 디렉터리 제외
      if (file.name !== 'node_modules' && file.name !== 'dist') {
        await scanDirectory(filePath, fileList);
      }
    } else if (file.isFile()) {
      if (file.name.endsWith('.ts') || file.name.endsWith('.tsx')) {
        fileList.push(filePath);
      }
    }
  }

  return fileList;
}

/**
 * 아이콘 사용처를 분석합니다.
 * @returns {Promise<Array<{iconName: string, filePath: string, lineNumber: number, context: string}>>}
 */
export async function analyzeIconUsage() {
  const srcDir = join(PROJECT_ROOT, 'src');
  const sourceFiles = await scanDirectory(srcDir);

  const usages = [];

  for (const filePath of sourceFiles) {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // icon= 패턴 매칭 (예: icon="Settings", icon={IconName.Settings})
      const iconPropMatch = line.match(/icon=["']?(\w+)["']?|icon=\{IconName\.(\w+)\}/);
      if (iconPropMatch) {
        const iconName = iconPropMatch[1] || iconPropMatch[2];
        if (CORE_ICONS.includes(iconName)) {
          usages.push({
            iconName,
            filePath: relative(PROJECT_ROOT, filePath),
            lineNumber: index + 1,
            context: line.trim(),
          });
        }
      }

      // iconName= 패턴 매칭
      const iconNameMatch = line.match(/iconName=["']?(\w+)["']?|iconName=\{IconName\.(\w+)\}/);
      if (iconNameMatch) {
        const iconName = iconNameMatch[1] || iconNameMatch[2];
        if (CORE_ICONS.includes(iconName)) {
          usages.push({
            iconName,
            filePath: relative(PROJECT_ROOT, filePath),
            lineNumber: index + 1,
            context: line.trim(),
          });
        }
      }

      // name= 패턴 매칭 (LazyIcon 컴포넌트)
      const nameMatch = line.match(/name=["']?(\w+)["']?|name=\{IconName\.(\w+)\}/);
      if (nameMatch && line.includes('LazyIcon')) {
        const iconName = nameMatch[1] || nameMatch[2];
        if (CORE_ICONS.includes(iconName)) {
          usages.push({
            iconName,
            filePath: relative(PROJECT_ROOT, filePath),
            lineNumber: index + 1,
            context: line.trim(),
          });
        }
      }
    });
  }

  return usages;
}

/**
 * 중복 의미 사용을 감지합니다.
 * @param {Array<{iconName: string, filePath: string, lineNumber: number, context: string}>} usages
 * @returns {Array<{iconName: string, usageCount: number, locations: Array}>}
 */
export function findDuplicateSemantics(usages) {
  const iconGroups = usages.reduce((acc, usage) => {
    if (!acc[usage.iconName]) {
      acc[usage.iconName] = [];
    }
    acc[usage.iconName].push(usage);
    return acc;
  }, {});

  return Object.entries(iconGroups)
    .filter(([, locations]) => locations.length > 1)
    .map(([iconName, locations]) => ({
      iconName,
      usageCount: locations.length,
      locations,
    }));
}

/**
 * 미사용 아이콘을 찾습니다.
 * @param {Array<{iconName: string}>} usages
 * @returns {Array<string>}
 */
export function findUnusedIcons(usages) {
  const usedIcons = new Set(usages.map(u => u.iconName));
  return CORE_ICONS.filter(icon => !usedIcons.has(icon));
}

/**
 * 아이콘 사용 빈도를 계산합니다.
 * @param {Array<{iconName: string}>} usages
 * @returns {Array<{iconName: string, count: number, percentage: number}>}
 */
export function calculateUsageFrequency(usages) {
  const total = usages.length;
  const frequency = usages.reduce((acc, usage) => {
    acc[usage.iconName] = (acc[usage.iconName] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(frequency)
    .map(([iconName, count]) => ({
      iconName,
      count,
      percentage: ((count / total) * 100).toFixed(2),
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Markdown 리포트를 생성합니다.
 * @param {Object} options
 * @param {Array} options.usages
 * @param {Array} options.duplicates
 * @param {Array} options.unusedIcons
 * @param {Array} options.frequency
 * @returns {string}
 */
export function generateReport({ usages, duplicates, unusedIcons, frequency }) {
  let report = '# Icon Usage Audit Report\n\n';

  // Summary
  report += '## Summary\n\n';
  report += `- Total icon usages: ${usages.length}\n`;
  report += `- Unique icons used: ${frequency.length}\n`;
  report += `- Unused icons: ${unusedIcons.length}\n`;
  report += `- Duplicate semantics detected: ${duplicates.length}\n\n`;

  // Usage Frequency
  report += '## Usage Frequency\n\n';
  report += '| Icon Name | Count | Percentage |\n';
  report += '|-----------|-------|------------|\n';
  frequency.forEach(({ iconName, count, percentage }) => {
    report += `| ${iconName} | ${count} | ${percentage}% |\n`;
  });
  report += '\n';

  // Duplicate Semantics
  if (duplicates.length > 0) {
    report += '## ⚠️ Duplicate Semantics\n\n';
    report += 'These icons are used in multiple locations:\n\n';
    duplicates.forEach(({ iconName, usageCount, locations }) => {
      report += `### ${iconName} (${usageCount} usages)\n\n`;
      locations.forEach(({ filePath, lineNumber, context }) => {
        report += `- \`${filePath}:${lineNumber}\`: ${context}\n`;
      });
      report += '\n';
    });
  }

  // Unused Icons
  if (unusedIcons.length > 0) {
    report += '## 📦 Unused Icons\n\n';
    report += 'These icons are registered but not used:\n\n';
    unusedIcons.forEach(icon => {
      report += `- ${icon}\n`;
    });
    report += '\n';
  }

  return report;
}

/**
 * CLI 실행
 */
async function main() {
  const args = process.argv.slice(2);
  const format = args.includes('--format') ? args[args.indexOf('--format') + 1] : 'console';
  const outputPath = args.includes('--output') ? args[args.indexOf('--output') + 1] : null;

  console.log('🔍 Analyzing icon usage...');
  const usages = await analyzeIconUsage();
  const duplicates = findDuplicateSemantics(usages);
  const unusedIcons = findUnusedIcons(usages);
  const frequency = calculateUsageFrequency(usages);

  if (format === 'json') {
    const jsonReport = JSON.stringify({ usages, duplicates, unusedIcons, frequency }, null, 2);
    if (outputPath) {
      await fs.writeFile(outputPath, jsonReport, 'utf-8');
      console.log(`✅ JSON report saved to ${outputPath}`);
    } else {
      console.log(jsonReport);
    }
  } else if (format === 'markdown') {
    const markdownReport = generateReport({
      usages,
      duplicates,
      unusedIcons,
      frequency,
    });
    if (outputPath) {
      await fs.writeFile(outputPath, markdownReport, 'utf-8');
      console.log(`✅ Markdown report saved to ${outputPath}`);
    } else {
      console.log(markdownReport);
    }
  } else {
    // console format (default)
    const markdownReport = generateReport({
      usages,
      duplicates,
      unusedIcons,
      frequency,
    });
    console.log(markdownReport);
  }
}

// CLI 실행 체크
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
}
