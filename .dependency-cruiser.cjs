/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    // Clean Architecture 의존성 규칙: features → shared → core → infrastructure
    {
      name: 'no-infrastructure-upward-deps',
      comment: 'Infrastructure는 다른 레이어에 의존할 수 없음 (자체 완결형)',
      severity: 'error',
      from: { path: '^src/infrastructure' },
      to: { path: '^src/(core|shared|features|app)' },
    },
    {
      name: 'no-core-upward-deps',
      comment: 'Core는 infrastructure에만 의존 가능',
      severity: 'error',
      from: {
        path: '^src/core',
        pathNot: [
          '^src/core/services/ServiceRegistry.ts', // ServiceRegistry는 동적 import 허용
        ],
      },
      to: { path: '^src/(shared|features|app)' },
    },
    {
      name: 'no-shared-upward-deps',
      comment: 'Shared는 core, infrastructure에만 의존 가능',
      severity: 'error',
      from: { path: '^src/shared' },
      to: { path: '^src/(features|app)' },
    },

    // 외부 라이브러리 접근 제한 (vendor getter 사용 강제)
    {
      name: 'no-direct-vendor-imports',
      comment: '외부 라이브러리는 vendors getter를 통해 접근',
      severity: 'warn',
      from: {
        path: '^src',
        pathNot: [
          '^src/(shared/utils/vendors|infrastructure/external/vendors)', // vendors 유틸리티
          '^src/shared/types/vendor.types.ts', // 타입 정의 파일
          '^src/types/', // 전역 타입 정의
        ],
      },
      to: { path: '^(fflate|preact|@preact)' },
    },

    // 순환 참조 방지
    {
      name: 'no-circular-deps',
      comment: '순환 참조 금지',
      severity: 'error',
      from: {},
      to: { circular: true },
    },

    // 고아 모듈 검사 (실제 사용되지 않는 파일만)
    {
      name: 'no-orphans',
      comment: '사용되지 않는 고아 모듈',
      severity: 'info', // 심각도 낮춤
      from: {
        orphan: true,
        pathNot: [
          '(^|/)[.][^/]+[.](?:js|cjs|mjs|ts|cts|mts|json)$', // dot files
          '[.]d[.]ts$', // TypeScript declaration files
          '(^|/)tsconfig[.]json$', // TypeScript config
          '(^|/)(?:babel|webpack)[.]config[.](?:js|cjs|mjs|ts|cts|mts|json)$', // configs
          '^src/main[.]ts$', // 메인 진입점
          '^src/types/', // 타입 정의 파일들
          '^src/.*/index[.]ts$', // 배럴 export 파일들
          'REFACTORING_PLAN[.]ts$', // 리팩토링 계획 문서
          '^src/shared/utils/(timer-utils|performance-core)[.]ts$', // 실제 사용되는 파일들
          '^src/infrastructure/types[.]ts$', // 인프라 타입 파일
          '^src/core/services/(ScrollLockService|PreciseMediaMapper|MediaPageTypeDetector)[.]ts$',
          '^src/core/services/cache/EnhancedMediaCacheService[.]ts$',
          '^src/core/constants/STABLE_SELECTORS[.]ts$',
          // 레거시 서비스들 (deprecated, 직접 사용되지 않음)
          '^src/features/media/services/(MediaExtractionService|StableMediaExtractionService)[.]ts$',
          '^src/app/coordinators/MediaExtractionCoordinator[.]ts$',
        ],
      },
      to: {},
    },
  ],

  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    includeOnly: '^src',
    tsPreCompilationDeps: true,
  },
};
