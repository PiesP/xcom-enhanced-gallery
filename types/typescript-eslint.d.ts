/**
 * TypeScript ESLint 유틸리티 모듈에 대한 타입 선언입니다.
 *
 * 이 모듈은 @typescript-eslint/utils 패키지의 모든 유틸리티 함수와
 * 타입 정의를 재내보내습니다. ESLint 설정과 커스텀 규칙 개발에 필요한
 * TypeScript 관련 도구들을 제공합니다.
 *
 * @example
 * ```typescript
 * import { ESLintUtils } from '@typescript-eslint/utils/ts-eslint';
 *
 * const createRule = ESLintUtils.RuleCreator(
 *   name => `https://example.com/rule/${name}`
 * );
 * ```
 */
declare module '@typescript-eslint/utils/ts-eslint' {
  export * from '@typescript-eslint/utils/dist/ts-eslint';
}

/**
 * TypeScript ESLint 플러그인의 규칙 모음에 대한 타입 선언입니다.
 *
 * 이 모듈은 @typescript-eslint/eslint-plugin에서 제공하는 모든 ESLint 규칙들을
 * 객체 형태로 내보냅니다. 각 규칙은 TypeScript 코드의 특정 패턴을 검사하고
 * 코드 품질 향상을 위한 경고나 오류를 제공합니다.
 *
 * @example
 * ```typescript
 * import rules from '@typescript-eslint/eslint-plugin/rules';
 *
 * // 특정 규칙에 접근
 * const noUnusedVarsRule = rules['no-unused-vars'];
 * console.log(noUnusedVarsRule.meta.docs.description);
 * ```
 */
declare module '@typescript-eslint/eslint-plugin/rules' {
  /**
   * TypeScript ESLint 규칙들의 컬렉션입니다.
   *
   * 각 키는 규칙 이름(예: 'no-unused-vars', 'prefer-const')이고,
   * 값은 해당 규칙의 구현체입니다. 규칙 구현체는 ESLint Rule 인터페이스를
   * 준수하며, 메타데이터, 스키마, 그리고 create 함수를 포함합니다.
   *
   * @remarks
   * 이 객체는 런타임에 동적으로 생성되므로 any 타입을 사용합니다.
   * 특정 규칙의 타입이 필요한 경우, @typescript-eslint/utils의
   * RuleModule 타입을 사용하여 캐스팅할 수 있습니다.
   */
  const rules: Record<string, any>;
  export default rules;
}
