#!/usr/bin/env node
/**
 * Legacy Codemod CLI Runner
 *
 * 실제 파일 시스템에 Codemod를 적용하는 CLI 도구
 * - src/ 디렉터리의 .ts/.tsx 파일 대상
 * - Dry-run 모드 지원
 * - 변환 리포트 생성
 */

import { Project } from 'ts-morph';
import { transformLegacyPatterns } from './legacy-codemod.js';
import { writeFile } from 'fs/promises';
import { resolve, relative, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

interface CliOptions {
  dryRun: boolean;
  verbose: boolean;
  pattern?: string;
  include?: string[];
}

interface TransformReport {
  timestamp: string;
  options: CliOptions;
  summary: {
    totalFiles: number;
    changedFiles: number;
    totalChanges: number;
    skippedFiles: number;
  };
  files: Array<{
    path: string;
    changeCount: number;
    preview?: string;
  }>;
}

/**
 * CLI 인자 파싱
 */
function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {
    dryRun: args.includes('--dry-run') || args.includes('-d'),
    verbose: args.includes('--verbose') || args.includes('-v'),
  };

  const patternIndex = args.indexOf('--pattern');
  if (patternIndex !== -1 && args[patternIndex + 1]) {
    options.pattern = args[patternIndex + 1];
  }

  const includeIndex = args.indexOf('--include');
  if (includeIndex !== -1 && args[includeIndex + 1]) {
    options.include = args[includeIndex + 1].split(',');
  }

  return options;
}

/**
 * 프로젝트 생성 및 파일 로드
 */
function createProject(options: CliOptions): Project {
  const project = new Project({
    tsConfigFilePath: resolve(projectRoot, 'tsconfig.json'),
    skipAddingFilesFromTsConfig: false,
  });

  // 특정 파일만 포함하는 경우
  if (options.include && options.include.length > 0) {
    const sourceFiles = project.getSourceFiles();
    const includedFiles = new Set(options.include.map(f => resolve(projectRoot, f)));

    sourceFiles.forEach(sf => {
      if (!includedFiles.has(sf.getFilePath())) {
        project.removeSourceFile(sf);
      }
    });
  } else {
    // src/ 디렉터리만 필터링
    const sourceFiles = project.getSourceFiles();
    sourceFiles.forEach(sf => {
      const filePath = sf.getFilePath();
      const relativePath = relative(projectRoot, filePath);

      // src/ 외부 파일 제거
      if (!relativePath.startsWith('src\\') && !relativePath.startsWith('src/')) {
        project.removeSourceFile(sf);
      }
    });
  }

  return project;
}

/**
 * 변환 리포트 생성
 */
function generateReport(
  results: Awaited<ReturnType<typeof transformLegacyPatterns>>,
  options: CliOptions
): TransformReport {
  const changedFiles = results.filter(r => r.hasChanges);
  const totalChanges = results.reduce((sum, r) => sum + r.changeCount, 0);

  const report: TransformReport = {
    timestamp: new Date().toISOString(),
    options,
    summary: {
      totalFiles: results.length,
      changedFiles: changedFiles.length,
      totalChanges,
      skippedFiles: results.length - changedFiles.length,
    },
    files: changedFiles.map(r => ({
      path: relative(projectRoot, r.filePath),
      changeCount: r.changeCount,
      preview:
        options.verbose && r.hasChanges
          ? `${r.original.slice(0, 100)}... => ${r.transformed.slice(0, 100)}...`
          : undefined,
    })),
  };

  return report;
}

/**
 * 리포트를 Markdown 형식으로 변환
 */
function reportToMarkdown(report: TransformReport): string {
  const lines: string[] = [];

  lines.push('# Legacy Codemod 변환 리포트');
  lines.push('');
  lines.push(`- **실행 시간**: ${new Date(report.timestamp).toLocaleString('ko-KR')}`);
  lines.push(`- **모드**: ${report.options.dryRun ? 'Dry-run (미리보기)' : '실제 변환'}`);
  lines.push('');

  lines.push('## 요약');
  lines.push('');
  lines.push(`- 전체 파일: ${report.summary.totalFiles}개`);
  lines.push(`- 변경된 파일: ${report.summary.changedFiles}개`);
  lines.push(`- 전체 변경 수: ${report.summary.totalChanges}개`);
  lines.push(`- 건너뛴 파일: ${report.summary.skippedFiles}개`);
  lines.push('');

  if (report.files.length > 0) {
    lines.push('## 변경된 파일 목록');
    lines.push('');

    report.files.forEach(file => {
      lines.push(`### \`${file.path}\``);
      lines.push('');
      lines.push(`- 변경 수: ${file.changeCount}개`);
      if (file.preview) {
        lines.push('- 미리보기:');
        lines.push('  ```');
        lines.push(`  ${file.preview}`);
        lines.push('  ```');
      }
      lines.push('');
    });
  }

  return lines.join('\n');
}

/**
 * 메인 실행 함수
 */
async function main() {
  const options = parseArgs();

  console.log('🚀 Legacy Codemod 시작...');
  console.log(`   모드: ${options.dryRun ? 'Dry-run (미리보기)' : '실제 변환'}`);
  console.log('');

  // 1. 프로젝트 로드
  console.log('📂 프로젝트 로드 중...');
  const project = createProject(options);
  const sourceFiles = project.getSourceFiles();
  console.log(`   파일 수: ${sourceFiles.length}개`);
  console.log('');

  // 2. 변환 실행
  console.log('🔄 변환 중...');
  const results = await transformLegacyPatterns(project, {
    dryRun: options.dryRun,
    verbose: options.verbose,
  });
  console.log('');

  // 3. 리포트 생성
  const report = generateReport(results, options);

  console.log('📊 변환 결과:');
  console.log(`   전체 파일: ${report.summary.totalFiles}개`);
  console.log(`   변경된 파일: ${report.summary.changedFiles}개`);
  console.log(`   전체 변경: ${report.summary.totalChanges}개`);
  console.log(`   건너뛴 파일: ${report.summary.skippedFiles}개`);
  console.log('');

  // 4. 변경된 파일 목록 출력
  if (report.files.length > 0) {
    console.log('📝 변경된 파일:');
    report.files.slice(0, 10).forEach(file => {
      console.log(`   - ${file.path} (${file.changeCount}개)`);
    });
    if (report.files.length > 10) {
      console.log(`   ... 외 ${report.files.length - 10}개 파일`);
    }
    console.log('');
  }

  // 5. 리포트 저장
  if (!options.dryRun && report.summary.changedFiles > 0) {
    const reportPath = resolve(projectRoot, 'docs/legacy-cleanup-auto-report.md');
    const markdown = reportToMarkdown(report);
    await writeFile(reportPath, markdown, 'utf-8');
    console.log(`✅ 리포트 저장: docs/legacy-cleanup-auto-report.md`);
  } else if (options.dryRun && report.summary.changedFiles > 0) {
    console.log(
      'ℹ️  Dry-run 모드: 실제 파일은 변경되지 않았습니다. --dry-run 옵션을 제거하면 실제 변환됩니다.'
    );
  }

  console.log('');
  console.log('✨ 완료!');

  // 종료 코드 반환
  process.exit(report.summary.changedFiles > 0 ? 0 : 1);
}

// 에러 핸들링
main().catch(error => {
  console.error('❌ 오류 발생:');
  console.error(error);
  process.exit(1);
});
