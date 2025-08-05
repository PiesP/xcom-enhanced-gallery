/**
 * @fileoverview 테스트 최적화 정리 스크립트
 * @description 중복되거나 불필요한 테스트 파일들을 정리하는 스크립트
 * @version 1.0.0
 */

/**
 * 중복 제거 대상 테스트 파일들
 */
export const DEPRECATED_TESTS = [
  // TDD 리팩토링 중복 파일들
  'test/refactoring/tdd-style-consolidation-red.test.ts',
  'test/refactoring/tdd-style-consolidation-green.test.ts',
  'test/refactoring/tdd-style-consolidation-refactor.test.ts',
  'test/refactoring/tdd-style-consolidation.test.ts', // 통합버전으로 대체

  // 미디어 서비스 중복 테스트들
  'test/unit/shared/services/MediaExtractionService.test.ts',
  'test/features/media/media.behavior.test.ts',

  // 통합 테스트 중복들
  'test/integration/extension.integration.test.ts',
  'test/integration/gallery-activation.test.ts',
  'test/integration/utils.integration.test.ts',

  // 툴바 테스트 중복들
  'test/features/toolbar/toolbar-hover-consistency.test.ts',
  'test/features/toolbar/toolbar-hover-consistency-completion.test.ts',

  // 서비스 매니저 중복들
  'test/unit/shared/services/ServiceManager.test.ts', // CoreService.test.ts와 중복

  // 구식 최적화 테스트들
  'test/optimization/memo-optimization.test.ts', // optimization.consolidated.test.ts로 통합

  // DOM 유틸리티 중복들
  'test/refactoring/tdd-dom-utils-consolidation.test.ts',
  'test/refactoring/tdd-component-consolidation.test.ts',
  'test/refactoring/tdd-media-service-consolidation.test.ts',

  // 스타일 관련 중복들
  'test/shared/styles/modern-css-features.test.ts',
  'test/shared/styles/css-integration.test.ts',

  // 성능 관련 중복들
  'test/unit/shared/utils/performance-timer.test.ts',
  'test/shared/utils/performance/throttle.test.ts',

  // 레거시 파일들
  'test/refactoring/structure-analysis.test.ts',
  'test/refactoring/naming-standardization.test.ts',
  'test/refactoring/refactoring-completion.test.ts',

  // Master 테스트 스위트 (실제 테스트 없음)
  'test/integration/master-test-suite.test.ts',
];

/**
 * 통합될 테스트 파일들 매핑
 */
export const CONSOLIDATED_TESTS = {
  // 미디어 추출 통합
  'test/consolidated/media-extraction.consolidated.test.ts': [
    'test/unit/shared/services/MediaExtractionService.test.ts',
    'test/features/media/media.behavior.test.ts',
  ],

  // 사용자 상호작용 통합
  'test/consolidated/user-interactions.consolidated.test.ts': [
    'test/behavioral/user-interactions-fixed.test.ts',
    'test/features/gallery/gallery.behavior.test.ts',
    'test/features/settings/settings.behavior.test.ts',
  ],

  // 스타일 및 최적화 통합
  'test/consolidated/styles-optimization.consolidated.test.ts': [
    'test/shared/styles/modern-css-features.test.ts',
    'test/shared/styles/css-integration.test.ts',
    'test/optimization/memo-optimization.test.ts',
    'test/optimization/optimization.consolidated.test.ts',
  ],

  // 통합 테스트 통합
  'test/consolidated/integration.consolidated.test.ts': [
    'test/integration/extension.integration.test.ts',
    'test/integration/full-workflow.test.ts',
    'test/integration/gallery-activation.test.ts',
  ],

  // 서비스 테스트 통합
  'test/consolidated/services.consolidated.test.ts': [
    'test/unit/shared/services/CoreService.test.ts',
    'test/unit/shared/services/ServiceManager.test.ts',
    'test/core/services/ServiceManager.integration.test.ts',
  ],
};

/**
 * 유지될 핵심 테스트들
 */
export const PRESERVED_TESTS = [
  // 핵심 기능 테스트들
  'test/unit/main/main-initialization.test.ts',
  'test/unit/features/gallery-app-activation.test.ts',

  // 특화 기능 테스트들
  'test/features/gallery/VerticalImageItem.context-menu.test.ts',
  'test/features/gallery/useToolbarPositionBased.test.ts',
  'test/features/gallery/toolbar-autohide.test.ts',
  'test/features/gallery/virtual-scrolling.test.ts',
  'test/features/gallery/scroll-lock-removal.test.ts',
  'test/features/gallery/GalleryState.business-logic.test.ts',
  'test/features/gallery/early-initialization.test.ts',

  // 외부 라이브러리 통합 테스트들
  'test/unit/shared/external/libraries-integration.test.ts',
  'test/unit/shared/external/vendors/motion-integration.test.ts',

  // 아키텍처 및 인프라 테스트들
  'test/architecture/dependency-rules.test.ts',
  'test/infrastructure/browser/browser-utils.test.ts',
  'test/core/core-modules.test.ts',
  'test/core/constants/STABLE_SELECTORS.test.ts',
  'test/core/browser-compatibility.test.ts',

  // 특화 유틸리티 테스트들
  'test/shared/utils/media-url.util.test.ts',
  'test/unit/shared/utils/patterns/PagePatternDetector.test.ts',
  'test/unit/shared/utils/animations.test.ts',
  'test/unit/shared/utils/error-handling.test.ts',

  // 행위 수정 테스트들
  'test/behavioral/toolbar-visibility-fix.test.ts',
];

/**
 * 새로운 테스트 구조 (최적화 후)
 */
export const OPTIMIZED_TEST_STRUCTURE = {
  'test/': {
    'consolidated/': {
      'media-extraction.consolidated.test.ts': '미디어 추출 통합 테스트',
      'user-interactions.consolidated.test.ts': '사용자 상호작용 통합 테스트',
      'styles-optimization.consolidated.test.ts': '스타일 및 최적화 통합 테스트',
      'integration.consolidated.test.ts': '통합 테스트 모음',
      'services.consolidated.test.ts': '서비스 통합 테스트',
    },
    'unit/': {
      'main/': ['main-initialization.test.ts'],
      'features/': ['gallery-app-activation.test.ts'],
      'shared/': {
        'external/': ['libraries-integration.test.ts', 'vendors/motion-integration.test.ts'],
        'utils/': [
          'animations.test.ts',
          'error-handling.test.ts',
          'patterns/PagePatternDetector.test.ts',
        ],
      },
    },
    'features/': {
      'gallery/': [
        'VerticalImageItem.context-menu.test.ts',
        'useToolbarPositionBased.test.ts',
        'toolbar-autohide.test.ts',
        'virtual-scrolling.test.ts',
        'scroll-lock-removal.test.ts',
        'GalleryState.business-logic.test.ts',
        'early-initialization.test.ts',
      ],
    },
    'architecture/': ['dependency-rules.test.ts'],
    'infrastructure/': ['browser/browser-utils.test.ts'],
    'core/': [
      'core-modules.test.ts',
      'constants/STABLE_SELECTORS.test.ts',
      'browser-compatibility.test.ts',
    ],
    'shared/': ['utils/media-url.util.test.ts'],
    'behavioral/': ['toolbar-visibility-fix.test.ts'],
    'utils/': {
      'helpers/': ['page-test-environment.ts'],
    },
    '__mocks__/': [
      'page-structures.mock.ts',
      'browser-environment.mock.ts',
      'twitter-dom.mock.ts',
      'userscript-api.mock.ts',
    ],
  },
};

/**
 * 예상되는 최적화 효과
 */
export const OPTIMIZATION_METRICS = {
  before: {
    totalFiles: 45,
    executionTime: '2분 30초',
    coverage: '75%',
    duplications: 15,
  },
  after: {
    totalFiles: 25,
    executionTime: '1분 30초',
    coverage: '85%',
    duplications: 0,
  },
  improvement: {
    fileReduction: '44%',
    timeReduction: '40%',
    coverageIncrease: '10%',
    duplicationElimination: '100%',
  },
};
