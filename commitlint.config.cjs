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
        'wip', // 진행 중인 작업 (임시 허용)
      ],
    ],

    // 제목 길이 제한 완화
    'subject-max-length': [2, 'always', 120], // 80 → 120자로 완화
    'subject-min-length': [1, 'always', 1], // 3 → 1자로 완화, 경고 레벨로 변경

    // 제목 형식 (한국어 지원을 위해 case 검사 비활성화)
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'subject-case': [0], // 한국어 커밋 메시지 지원을 위해 비활성화

    // 타입 형식
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],

    // 범위 (scope) 설정 - 선택적으로 변경
    'scope-enum': [
      1, // 2 → 1로 변경하여 경고 레벨로 완화
      'always',
      [
        'gallery', // 갤러리 기능
        'media', // 미디어 처리
        'download', // 다운로드 기능
        'settings', // 설정 관리
        'ui', // UI 컴포넌트
        'core', // 핵심 로직
        'shared', // 공통 모듈
        'external', // 외부 의존성
        'hooks', // 커스텀 훅
        'utils', // 유틸리티
        'types', // 타입 정의
        'styles', // 스타일링
        'components', // 컴포넌트
        'services', // 서비스 레이어
        'infra', // 인프라스트럭처
        'build', // 빌드 시스템
        'deps', // 의존성
        'config', // 설정 파일
        'test', // 테스트
        'tests', // 테스트 (복수형 허용)
        'ci', // CI/CD
        'docs', // 문서
        'cleanup', // 코드 정리
        'refactor', // 리팩토링
        'tdd', // TDD 관련
        'temp', // 임시 작업
      ],
    ],
    'scope-case': [1, 'always', 'lower-case'], // 경고 레벨로 완화

    // 헤더 길이 제한 완화
    'header-max-length': [2, 'always', 120], // 100 → 120자로 완화

    // 본문 규칙 완화
    'body-leading-blank': [1, 'always'], // 경고 레벨로 완화
    'body-max-line-length': [1, 'always', 120], // 100 → 120자로 완화, 경고 레벨

    // 푸터 규칙 완화
    'footer-leading-blank': [1, 'always'], // 경고 레벨로 완화
    'footer-max-line-length': [1, 'always', 120], // 100 → 120자로 완화, 경고 레벨
  },

  // 커스텀 플러그인 (필요시)
  plugins: [],

  // 무시할 패턴 - 한국어 커밋 패턴 고려 (더 관대하게)
  ignores: [
    // Merge 커밋
    commit => commit.includes('Merge '),
    // Revert 커밋
    commit => commit.includes('Revert '),
    // 자동 생성된 커밋
    commit => commit.includes('[skip ci]'),
    // WIP 커밋 (더 포괄적으로)
    commit => commit.toLowerCase().includes('wip'),
    commit => commit.toLowerCase().includes('work in progress'),
    // 임시 커밋 (더 포괄적으로)
    commit => commit.includes('임시'),
    commit => commit.includes('temp'),
    commit => commit.includes('tmp'),
    commit => commit.toLowerCase().includes('temporary'),
    // 개발 중 커밋
    commit => commit.toLowerCase().includes('in progress'),
    commit => commit.includes('진행중'),
    commit => commit.includes('개발중'),
    // 빠른 수정
    commit => commit.toLowerCase().includes('quick fix'),
    commit => commit.includes('빠른수정'),
    // 디버그 커밋
    commit => commit.toLowerCase().includes('debug'),
    commit => commit.includes('디버그'),
    // 테스트 커밋
    commit => commit.toLowerCase().startsWith('test:'),
    commit => commit.includes('테스트'),
  ],

  // 기본 설정 확장
  defaultIgnores: true,

  // 헬프 URL
  helpUrl: 'https://github.com/conventional-changelog/commitlint/#what-is-commitlint',

  // 파서 옵션
  parserPreset: {
    parserOpts: {
      // 헤더 패턴: type(scope): description
      headerPattern: /^(\w*)(?:\(([^)]*)\))?: (.*)$/,
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
