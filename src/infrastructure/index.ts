/**
 * Infrastructure Layer Barrel Export
 *
 * Infrastructure는 외부 시스템과의 인터페이스를 담당합니다.
 * 브라우저 API, 외부 라이브러리, 로깅 등의 기능을 제공합니다.
 */

// 브라우저 유틸리티
export * from './browser';

// DOM management utilities
export * from './dom';

// External dependencies
export * from './external';

// Logging infrastructure
export * from './logging';

// Error handling
export * from './error';

// 매니저들 (통합된 리소스 매니저)
export * from './managers';

// Media utilities
export * from './media';

// 유틸리티
export * from './utils';

// Infrastructure types
export * from './types/media.types';
export * from './types/lifecycle.types';
