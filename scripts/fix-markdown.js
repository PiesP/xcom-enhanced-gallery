#!/usr/bin/env node

/**
 * Markdown 린트 오류 자동 수정 스크립트
 *
 * 수정 대상 오류:
 * - MD028: Blockquote 내부 빈 줄
 * - MD029: Ordered list 번호 형식
 * - MD003: Heading 스타일 (setext → atx)
 * - MD022: Heading 주변 빈 줄
 * - MD001: Heading 레벨 증가
 * - MD046: Code block 스타일 (fenced → indented)
 * - MD009: Trailing spaces
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * MD028: Blockquote 내부 빈 줄 제거
 * @param {string} content
 * @returns {string}
 */
function fixBlockquoteBlankLines(content) {
  const lines = content.split('\n');
  const result = [];
  let inBlockquote = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('>')) {
      inBlockquote = true;
      result.push(line);
    } else if (inBlockquote && line.trim() === '') {
      // Blockquote 다음 빈 줄
      if (i + 1 < lines.length && lines[i + 1].startsWith('>')) {
        // 다음 줄도 blockquote면 빈 줄 건너뛰기
        continue;
      } else {
        inBlockquote = false;
        result.push(line);
      }
    } else {
      inBlockquote = false;
      result.push(line);
    }
  }

  return result.join('\n');
}

/**
 * MD029: Ordered list 번호를 1로 시작하도록 수정
 * @param {string} content
 * @returns {string}
 */
function fixOrderedListPrefix(content) {
  const lines = content.split('\n');
  const result = [];

  for (const line of lines) {
    // 2-9 숫자로 시작하는 리스트 항목을 1로 변경
    if (/^[2-9]\.(\s|$)/.test(line)) {
      result.push(line.replace(/^[2-9]\./, '1.'));
    } else {
      result.push(line);
    }
  }

  return result.join('\n');
}

/**
 * MD003: Setext 스타일 heading을 ATX 스타일로 변경
 * @param {string} content
 * @returns {string}
 */
function fixHeadingStyle(content) {
  const lines = content.split('\n');
  const result = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 다음 줄이 존재하고 '====' 또는 '----'로 시작하는 경우
    if (i + 1 < lines.length) {
      const nextLine = lines[i + 1];

      if (/^=+\s*$/.test(nextLine)) {
        // H1 heading
        result.push(`# ${line}`);
        i += 2; // 현재 줄과 다음 줄 건너뛰기
        continue;
      } else if (/^-+\s*$/.test(nextLine)) {
        // H2 heading
        result.push(`## ${line}`);
        i += 2;
        continue;
      }
    }

    result.push(line);
    i += 1;
  }

  return result.join('\n');
}

/**
 * MD022: Heading 주변에 빈 줄 추가
 * @param {string} content
 * @returns {string}
 */
function fixBlanksAroundHeadings(content) {
  const lines = content.split('\n');
  const result = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Heading 감지 (ATX 스타일)
    if (/^#{1,6}\s/.test(line)) {
      // 이전 줄이 비어있지 않으면 빈 줄 추가
      if (i > 0 && result.length > 0 && result[result.length - 1].trim() !== '') {
        result.push('');
      }

      result.push(line);

      // 다음 줄이 비어있지 않으면 빈 줄 추가 (테이블이 아닌 경우)
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        if (nextLine.trim() !== '' && !nextLine.startsWith('|')) {
          result.push('');
        }
      }
    } else {
      result.push(line);
    }
  }

  return result.join('\n');
}

/**
 * MD001: Heading 레벨을 점진적으로 증가하도록 수정
 * @param {string} content
 * @returns {string}
 */
function fixHeadingIncrement(content) {
  const lines = content.split('\n');
  const result = [];
  let lastLevel = 0;

  for (let line of lines) {
    const match = line.match(/^(#{1,6})\s/);

    if (match) {
      let currentLevel = match[1].length;

      // 레벨이 1보다 크게 증가하면 조정
      if (lastLevel > 0 && currentLevel > lastLevel + 1) {
        // 적절한 레벨로 조정
        const adjustedLevel = lastLevel + 1;
        line = '#'.repeat(adjustedLevel) + line.substring(currentLevel);
        currentLevel = adjustedLevel;
      }

      lastLevel = currentLevel;
    }

    result.push(line);
  }

  return result.join('\n');
}

/**
 * MD009: Trailing spaces 제거 (줄 끝 공백)
 * @param {string} content
 * @returns {string}
 */
function fixTrailingSpaces(content) {
  const lines = content.split('\n');
  const result = [];

  for (const line of lines) {
    // 줄 끝 공백 제거 (단, 2 spaces는 허용 - hard break)
    const stripped = line.trimEnd();

    // 2 spaces로 끝나는 경우는 유지
    if (line.endsWith('  ') && !line.endsWith('   ')) {
      result.push(stripped + '  ');
    } else {
      result.push(stripped);
    }
  }

  return result.join('\n');
}

/**
 * MD046: Fenced code block을 indented로 변경 (리스트 내부에서만)
 * @param {string} content
 * @returns {string}
 */
function fixCodeBlockStyle(content) {
  const lines = content.split('\n');
  const result = [];
  let i = 0;
  let inList = false;
  let listIndent = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 리스트 항목 감지
    const listMatch = line.match(/^(\s*)[*\-+]\s/) || line.match(/^(\s*)\d+\.\s/);
    if (listMatch) {
      inList = true;
      listIndent = listMatch[1].length;
      result.push(line);
      i += 1;
      continue;
    }

    // Fenced code block 감지 (리스트 내부)
    if (inList && /^\s*```/.test(line)) {
      // Fenced code block 시작
      const codeLines = [];
      i += 1;

      // Code block 내용 수집
      while (i < lines.length && !/^\s*```/.test(lines[i])) {
        const codeLine = lines[i];

        // Indented로 변환 (4 spaces)
        if (codeLine.trim()) {
          codeLines.push(' '.repeat(listIndent + 4) + codeLine.trimStart());
        } else {
          codeLines.push('');
        }
        i += 1;
      }

      // Code block 종료 (```) 건너뛰기
      if (i < lines.length) {
        i += 1;
      }

      // Indented code lines 추가
      result.push(...codeLines);
      continue;
    }

    // 빈 줄이거나 리스트 연속이 아니면 리스트 종료
    if (line.trim() === '' || !line.startsWith(' '.repeat(listIndent))) {
      inList = false;
    }

    result.push(line);
    i += 1;
  }

  return result.join('\n');
}

/**
 * Markdown 파일의 모든 린트 오류 수정
 * @param {string} filePath
 */
function fixMarkdownFile(filePath) {
  console.log(`🔧 수정 중: ${filePath}`);

  let content = fs.readFileSync(filePath, 'utf-8');
  const originalContent = content;

  // 순서대로 수정 적용
  content = fixTrailingSpaces(content);
  content = fixBlockquoteBlankLines(content);
  content = fixOrderedListPrefix(content);
  content = fixHeadingStyle(content);
  content = fixBlanksAroundHeadings(content);
  content = fixHeadingIncrement(content);
  content = fixCodeBlockStyle(content);

  // 변경사항이 있으면 파일 저장
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ 수정 완료: ${filePath}`);
  } else {
    console.log(`ℹ️  변경사항 없음: ${filePath}`);
  }
}

/**
 * 메인 실행 함수
 */
function main() {
  const docsDir = path.join(__dirname, '..', 'docs');

  // 수정 대상 파일
  const targetFiles = [
    path.join(docsDir, 'TDD_REFACTORING_PLAN_COMPLETED.md'),
    path.join(docsDir, 'TDD_REFACTORING_PLAN.md'),
  ];

  for (const filePath of targetFiles) {
    if (fs.existsSync(filePath)) {
      fixMarkdownFile(filePath);
    } else {
      console.warn(`⚠️  파일 없음: ${filePath}`);
    }
  }

  console.log('\n✨ 모든 Markdown 파일 수정 완료!');
  console.log('💡 실행: npm run lint:md');
}

main();
