/**
 * @fileoverview 설정 기본값
 */

export const DEFAULT_SETTINGS = {
  gallery: {
    autoScrollSpeed: 5,
    infiniteScroll: true,
    preloadCount: 3,
    imageFitMode: 'fitWidth' as const,
    theme: 'auto' as const,
    animations: true,
    enableKeyboardNav: false,
  },
  toolbar: {
    /** Phase 268: 런타임 경고 제거 - toolbar 설정 스키마 */
    autoHideDelay: 3000, // ms, 툴바 자동 숨김 지연 시간 (기본 3초)
  },
  download: {
    filenamePattern: 'original' as const,
    imageQuality: 'original' as const,
    maxConcurrentDownloads: 3,
    autoZip: false,
    folderStructure: 'flat' as const,
  },
  tokens: {
    autoRefresh: true,
    expirationMinutes: 60,
  },
  performance: {
    domCaching: true,
    cacheTTL: 3000,
    memoryMonitoring: true,
    performanceLogging: false,
    debugMode: false,
  },
  accessibility: {
    highContrast: false,
    reduceMotion: false,
    screenReaderSupport: true,
    focusIndicators: true,
  },
  /** Phase 326.4: Conditional Feature Loading */
  features: {
    gallery: true, // 갤러리 기능 활성화 (필수)
    settings: true, // 설정 UI 활성화
    download: true, // 다운로드 기능 활성화
    mediaExtraction: true, // 미디어 추출 활성화
    advancedFilters: true, // 고급 필터 활성화 (선택사항)
    accessibility: true, // 접근성 기능 활성화
  },
  version: '1.0.0',
  lastModified: Date.now(),
} as const;
