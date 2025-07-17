/**
 * @fileoverview Commitlint configuration for X.com Enhanced Gallery
 *
 * 이 설정은 Conventional Commits 표준을 따르는 커밋 메시지를 강제합니다.
 * (This configuration enforces commit messages that follow the Conventional Commits standard.)
 *
 * @see {@link https://www.conventionalcommits.org/} - Conventional Commits spec
 * @see {@link https://commitlint.js.org/} - Commitlint documentation
 */

module.exports = {
  extends: ['@commitlint/config-conventional'],

  rules: {
    // 타입 제한 (Type restriction)
    'type-enum': [
      2,
      'always',
      [
        'feat', // 새로운 기능 (New feature)
        'fix', // 버그 수정 (Bug fix)
        'docs', // 문서 변경 (Documentation change)
        'style', // 코드 스타일 변경 (포맷팅 등) (Code style change, e.g., formatting)
        'refactor', // 리팩토링 (Refactoring)
        'test', // 테스트 추가/수정 (Add/modify tests)
        'chore', // 빌드 과정이나 보조 도구 변경 (Build process or auxiliary tool changes)
        'perf', // 성능 개선 (Performance improvement)
        'ci', // CI 설정 변경 (CI configuration change)
        'build', // 빌드 시스템 변경 (Build system change)
        'revert', // 이전 커밋 되돌리기 (Revert previous commit)
      ],
    ],

    // 제목 길이 제한 (Subject length restriction)
    'subject-max-length': [2, 'always', 72],
    'subject-min-length': [2, 'always', 3],

    // 제목 형식 (Subject format)
    'subject-case': [2, 'always', 'sentence-case'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],

    // 타입 형식 (Type format)
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],

    // 범위 (scope) 설정 (Scope settings)
    'scope-enum': [
      2,
      'always',
      [
        'gallery', // 갤러리 기능 (Gallery feature)
        'media', // 미디어 처리 (Media handling)
        'download', // 다운로드 기능 (Download feature)
        'settings', // 설정 관리 (Settings management)
        'ui', // UI 컴포넌트 (UI component)
        'core', // 핵심 로직 (Core logic)
        'infra', // 인프라스트럭처 (Infrastructure)
        'build', // 빌드 시스템 (Build system)
        'deps', // 의존성 (Dependencies)
        'config', // 설정 파일 (Configuration file)
        'test', // 테스트 (Test)
        'ci', // CI/CD (CI/CD)
        'docs', // 문서 (Documentation)
      ],
    ],
    'scope-case': [2, 'always', 'lower-case'],

    // 헤더 길이 제한 (Header length restriction)
    'header-max-length': [2, 'always', 100],

    // 본문 규칙 (Body rules)
    'body-leading-blank': [2, 'always'],
    'body-max-line-length': [2, 'always', 100],

    // 푸터 규칙 (Footer rules)
    'footer-leading-blank': [2, 'always'],
    'footer-max-line-length': [2, 'always', 100],
  },
  // 커스텀 플러그인 (필요시)
  // plugins: [], // 플러그인이 필요할 때만 추가하세요.
  plugins: [],

  // 무시할 패턴 (Ignore patterns)
  ignores: [
    // Merge 커밋 (Merge commits)
    commit => commit.includes('Merge '),
    // Revert 커밋 (Revert commits)
    commit => commit.includes('Revert '),
    // 자동 생성된 커밋 (Automatically generated commits)
    commit => commit.includes('[skip ci]'),
  ],

  // 기본 설정 확장 (Extend default settings)
  defaultIgnores: true,

  // 헬프 URL (Help URL)
  helpUrl: 'https://github.com/conventional-changelog/commitlint/#what-is-commitlint',

  // 파서 옵션 (Parser options)
  parserPreset: {
    parserOpts: {
      // 헤더 패턴: type(scope): description (Header pattern: type(scope): description)
      headerPattern: /^(\w*)(?:\(([^\)]*)\))?: (.*)$/,
      headerCorrespondence: ['type', 'scope', 'subject'],
      // 참조 액션 (Reference actions)
      referenceActions: [
        'close',
        'closes',
        'closed',
        'fix',
        'fixes',
        'fixed',
        'resolve',
        'resolves',
        'resolved',
      ],
      // 이슈 패턴 (Issue pattern)
      issuePrefixes: ['#'],
      // 노트 키워드 (Note keywords)
      noteKeywords: ['BREAKING CHANGE', 'BREAKING-CHANGE'],
      // 필드 패턴 (Field pattern)
      fieldPattern: /^-(.*?)-$/,
      revertPattern: /^Revert\s"([\s\S]*)"\s*This reverts commit (\w*)\./,
      // 주의사항 패턴 (현재는 확장 목적 또는 향후 플러그인에서 사용 가능성을 위해 포함됨)
      warnPattern: /^WARN\s+(.*)/,
      // 머지 패턴 (향후 커스텀 플러그인 또는 분석 도구에서 활용 가능성을 위해 포함됨)
      mergePattern: /^Merge pull request #(\d+) from (.*)$/,
      mergeCorrespondence: ['id', 'source'],
      mergeCorrespondence: ['id', 'source'],
    },
  },
};
