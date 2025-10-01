/**
 * Legacy Pattern Codemod
 *
 * TypeScript AST 기반 레거시 패턴 자동 변환 도구
 * - .value 읽기 → 함수 호출 변환
 * - False positive 필터링 (DOM .value, Iterator .next().value, Map/Set .values())
 * - Dry-run 모드 지원
 */

import { Project, type SourceFile, SyntaxKind } from 'ts-morph';

export type TransformOptions = {
  dryRun?: boolean;
  verbose?: boolean;
};

export type TransformResult = {
  filePath: string;
  original: string;
  transformed: string;
  hasChanges: boolean;
  changeCount: number;
};

/**
 * 레거시 패턴 변환 함수
 */
export async function transformLegacyPatterns(
  project: Project,
  options: TransformOptions = {}
): Promise<TransformResult[]> {
  const results: TransformResult[] = [];
  const sourceFiles = project.getSourceFiles();

  for (const sourceFile of sourceFiles) {
    const result = transformSourceFile(sourceFile, options);
    results.push(result);
  }

  return results;
}

function transformSourceFile(sourceFile: SourceFile, options: TransformOptions): TransformResult {
  const originalText = sourceFile.getFullText();
  let changeCount = 0;

  // .value 프로퍼티 접근 찾기
  const propertyAccessExpressions = sourceFile.getDescendantsOfKind(
    SyntaxKind.PropertyAccessExpression
  );

  // 중첩된 .value를 올바르게 처리하려면 역순으로 변환 (깊은 것부터)
  const reversedExpressions = [...propertyAccessExpressions].reverse();

  for (const expr of reversedExpressions) {
    // 노드가 이미 forgotten 상태인지 확인
    if (expr.wasForgotten()) {
      continue;
    }

    const propertyName = expr.getName();

    // .value 패턴이 아니면 스킵
    if (propertyName !== 'value') {
      continue;
    }

    // False positive 필터링
    if (shouldSkipTransform(expr, sourceFile)) {
      continue;
    }

    // signal.value → signal() 변환
    const objectExpr = expr.getExpression();
    const objectText = objectExpr.getText();

    // 변환: signal.value → signal()
    expr.replaceWithText(`${objectText}()`);
    changeCount++;
  }

  const transformedText = sourceFile.getFullText();
  const hasChanges = changeCount > 0;

  // Dry-run이 아니면 변경사항 저장
  if (!options.dryRun && hasChanges) {
    sourceFile.saveSync();
  } else if (options.dryRun && hasChanges) {
    // Dry-run: 원본으로 되돌림
    sourceFile.replaceWithText(originalText);
  }

  return {
    filePath: sourceFile.getFilePath(),
    original: originalText,
    transformed: transformedText,
    hasChanges,
    changeCount,
  };
}

function shouldSkipTransform(expr: any, sourceFile: SourceFile): boolean {
  // 1. 레거시 호환성 테스트 코드 보존
  const fileText = sourceFile.getFullText();
  if (fileText.includes('@legacy-compat-test')) {
    return true;
  }

  // 2. Iterator .next().value 패턴 보존
  // .value 앞에 .next()가 있는지 확인
  const objectExpr = expr.getExpression();
  const objectText = objectExpr.getText();

  // .next().value 패턴 감지
  if (objectText.includes('.next()')) {
    return true;
  }

  // 3. DOM 요소 .value 보존 (타입 기반 필터링)
  // HTMLInputElement, HTMLSelectElement, HTMLTextAreaElement 패턴
  if (
    objectText.includes('document.querySelector') ||
    objectText.includes('getElementById') ||
    objectText.includes('getElementsBy') ||
    objectText.match(/input|select|textarea/i)
  ) {
    return true;
  }

  // 4. Map/Set .values() 메서드 호출 보존
  // 실제로는 .values인데 .value 체크를 통과하지 않아서 여기선 불필요
  // 하지만 방어적 코드로 유지
  const nextSibling = expr.getNextSibling();
  if (nextSibling?.getKind() === SyntaxKind.OpenParenToken) {
    // .value() 형태는 함수 호출이므로 변환 대상이 아님
    return true;
  }

  return false;
}
