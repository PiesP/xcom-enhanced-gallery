/**
 * @fileoverview Commitlint configuration for X.com Enhanced Gallery
 *
 * 이 설정은 Conventional Commits 표준을 따르는 커밋 메시지를 강제합니다.
 *
 * @see {@link https://www.conventionalcommits.org/} - Conventional Commits spec
 * @see {@link https://commitlint.js.org/} - Commitlint documentation
 */

module.exports = {
  extends: ['@commitlint/config-conventional'],

  rules: {
    // 타입 제한
    'type-enum': [
      2,
      'always',
      [
        'feat', // 새로운 기능
        'fix', // 버그 수정
        'docs', // 문서 변경
        'style', // 코드 스타일 변경 (포맷팅 등)
        'refactor', // 리팩토링
        'test', // 테스트 추가/수정
        'chore', // 빌드 과정이나 보조 도구 변경
        'perf', // 성능 개선
        'ci', // CI 설정 변경
        'build', // 빌드 시스템 변경
        'revert', // 이전 커밋 되돌리기
      ],
    ],

    // 제목 길이 제한
    'subject-max-length': [2, 'always', 72],
    'subject-min-length': [2, 'always', 3],

    // 제목 형식
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],

    // 타입 형식
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],

    // 범위 (scope) 설정
    'scope-enum': [
      2,
      'always',
      [
        'gallery', // 갤러리 기능
        'media', // 미디어 처리
        'download', // 다운로드 기능
        'settings', // 설정 관리
        'ui', // UI 컴포넌트
        'core', // 핵심 로직
        'infra', // 인프라스트럭처
        'build', // 빌드 시스템
        'deps', // 의존성
        'config', // 설정 파일
        'test', // 테스트
        'ci', // CI/CD
        'docs', // 문서
      ],
    ],
    'scope-case': [2, 'always', 'lower-case'],

    // 헤더 길이 제한
    'header-max-length': [2, 'always', 100],

    // 본문 규칙
    'body-leading-blank': [2, 'always'],
    'body-max-line-length': [2, 'always', 100],

    // 푸터 규칙
    'footer-leading-blank': [2, 'always'],
    'footer-max-line-length': [2, 'always', 100],
  },

  // 커스텀 플러그인 (필요시)
  plugins: [],

  // 무시할 패턴
  ignores: [
    // Merge 커밋
    commit => commit.includes('Merge '),
    // Revert 커밋
    commit => commit.includes('Revert '),
    // 자동 생성된 커밋
    commit => commit.includes('[skip ci]'),
  ],

  // 기본 설정 확장
  defaultIgnores: true,

  // 헬프 URL
  helpUrl: 'https://github.com/conventional-changelog/commitlint/#what-is-commitlint',

  // 파서 옵션
  parserPreset: {
    parserOpts: {
      // 헤더 패턴: type(scope): description
      headerPattern: /^(\w*)(?:\(([^\)]*)\))?: (.*)$/,
      headerCorrespondence: ['type', 'scope', 'subject'],
      // 참조 액션
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
      // 이슈 패턴
      issuePrefixes: ['#'],
      // 노트 키워드
      noteKeywords: ['BREAKING CHANGE', 'BREAKING-CHANGE'],
      // 필드 패턴
      fieldPattern: /^-(.*?)-$/,
      revertPattern: /^Revert\s"([\s\S]*)"\s*This reverts commit (\w*)\./,
      revertCorrespondence: ['header', 'hash'],
      // 주의사항 패턴
      warnPattern: /^WARN\s+(.*)/,
      mergePattern: /^Merge pull request #(\d+) from (.*)$/,
      mergeCorrespondence: ['id', 'source'],
    },
  },
};
