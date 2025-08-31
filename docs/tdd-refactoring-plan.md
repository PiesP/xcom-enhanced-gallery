# TDD 기반 리팩토링 계획

## 개요

본 문서는 제공된 분석 결과를 바탕으로 실제 소스 코드를 검증하여 작성된
TDD(Test-Driven Development) 기반 리팩토링 계획입니다. 각 문제 카테고리별로
테스트 우선 개발 원칙을 준수하여 리팩토링을 진행합니다.

## TDD 개발 원칙

1. **Red-Green-Refactor 사이클 준수**
   - 실패하는 테스트 먼저 작성 (Red)
   - 최소 구현으로 테스트 통과 (Green)
   - 코드 개선 및 리팩토링 (Refactor)

2. **TypeScript Strict 모드 준수**
   - 모든 함수에 명시적 타입 정의
   - 런타임 에러 방지 우선

3. **외부 의존성 격리**
   - getter 함수를 통한 라이브러리 접근
   - 모킹 가능한 구조 설계

## 1. 중복된 구현 (Duplicated Implementations)

### 1.1 로깅 기능 중복 (Logger 유틸리티)

**문제**: `logger.ts`의 `createLogger`와 `createScopedLogger`가 여러 곳에서 중복
사용되며, 일부 모듈에서 별도의 console.log 호출.

**TDD 계획**:

1. **Red**: 로깅 일관성 테스트 작성

   ```typescript
   // test/logging-consistency.test.ts
   describe('Logging Consistency', () => {
     it('should use createScopedLogger for all modules', () => {
       // 모든 모듈이 createScopedLogger를 사용하는지 검증
     });

     it('should not have direct console.log calls', () => {
       // 직접 console.log 사용 금지 검증
     });
   });
   ```

2. **Green**: 모든 로깅을 `createScopedLogger`로 통합
   - `BulkDownloadService.ts`: `createScopedLogger('BulkDownload')` 사용
   - `MediaService.ts`: `createScopedLogger('MediaService')` 사용
   - 직접 console.log 제거

3. **Refactor**: 로깅 인터페이스 개선
   - `logError` 함수를 logger의 error 메서드로 통합
   - 로깅 레벨 일관성 강화

### 1.2 미디어 URL 최적화 중복 (WebPUtils와 MediaService)

**문제**: `WebPUtils.ts`의 `optimizeUrl`이 MediaService.ts에서 재사용되지만,
TwitterVideoExtractor.ts 등에서 중복 로직.

**TDD 계획**:

1. **Red**: URL 최적화 일관성 테스트

   ```typescript
   // test/url-optimization.test.ts
   describe('URL Optimization', () => {
     it('should use WebPUtils for all URL optimizations', () => {
       // 모든 URL 최적화가 WebPUtils를 통하는지 검증
     });
   });
   ```

2. **Green**: 모든 URL 최적화를 WebPUtils로 중앙화
   - `TwitterVideoExtractor.ts`: WebPUtils 사용
   - `FallbackExtractor.ts`: WebPUtils 사용
   - MediaService에서 프록시 메서드 노출

3. **Refactor**: WebPUtils 인터페이스 개선
   - WebP 지원 체크 로직 통합
   - 캐싱 메커니즘 강화

### 1.3 에러 메시지 추출 중복 (getErrorMessage)

**문제**: 여러 모듈에서 `getErrorMessage(error)`가 비슷하게 구현됨.

**TDD 계획**:

1. **Red**: 에러 처리 일관성 테스트

   ```typescript
   // test/error-handling.test.ts
   describe('Error Handling', () => {
     it('should use centralized getErrorMessage', () => {
       // 모든 에러 처리가 error-handling.ts의 함수를 사용하는지 검증
     });
   });
   ```

2. **Green**: error-handling.ts의 함수를 모든 곳에서 재사용
   - `BulkDownloadService.ts`: error-handling.ts import
   - `MediaService.ts`: error-handling.ts import

3. **Refactor**: 에러 처리 유틸리티 강화
   - 타입 안전성 개선
   - 에러 컨텍스트 정보 추가

## 2. 충돌하는 구현 (Conflicting Implementations)

### 2.1 AbortController 관리 충돌

**문제**: BulkDownloadService.ts와 MediaService.ts에서 각각 AbortController를
사용하며 동시에 실행 시 충돌 가능.

**TDD 계획**:

1. **Red**: AbortController 충돌 테스트

   ```typescript
   // test/abort-controller.test.ts
   describe('AbortController Management', () => {
     it('should handle concurrent downloads without conflicts', () => {
       // 동시에 여러 AbortController가 실행되는 시나리오 테스트
     });
   });
   ```

2. **Green**: 중앙 AbortManager 클래스 도입

   ```typescript
   // src/shared/services/AbortManager.ts
   export class AbortManager {
     private controllers = new Map<string, AbortController>();

     createController(id: string): AbortController {
       const controller = new AbortController();
       this.controllers.set(id, controller);
       return controller;
     }

     abort(id: string): void {
       this.controllers.get(id)?.abort();
       this.controllers.delete(id);
     }
   }
   ```

3. **Refactor**: 모든 서비스에서 AbortManager 사용
   - BulkDownloadService: AbortManager 통합
   - MediaService: AbortManager 통합

### 2.2 비디오 제어 상태 충돌

**문제**: VideoControlService.ts와 MediaService.ts에서 비디오 상태를 각각
관리하며 타이밍 충돌 가능.

**TDD 계획**:

1. **Red**: 비디오 상태 일관성 테스트

   ```typescript
   // test/video-state.test.ts
   describe('Video State Management', () => {
     it('should maintain consistent video states', () => {
       // 갤러리 진입/종료 시 상태 일관성 검증
     });
   });
   ```

2. **Green**: Signal 기반 상태 공유

   ```typescript
   // src/shared/stores/VideoStateStore.ts
   import { signal } from '@preact/signals';

   export const videoStates = signal<Map<HTMLVideoElement, VideoState>>(
     new Map()
   );
   ```

3. **Refactor**: 이벤트 리스너 중앙화
   - VideoControlService: Signal 사용
   - MediaService: Signal 사용

### 2.3 테마/스타일 충돌

**문제**: CSS에서 테마 충돌 가능성.

**TDD 계획**:

1. **Red**: 테마 적용 테스트

   ```typescript
   // test/theme-consistency.test.ts
   describe('Theme Consistency', () => {
     it('should apply themes without conflicts', () => {
       // 테마 변경 시 스타일 충돌 검증
     });
   });
   ```

2. **Green**: CSS 변수 기반 테마 시스템

   ```typescript
   // src/styles/theme.css
   :root {
     --theme-bg: #ffffff;
     --theme-text: #000000;
   }

   [data-theme='dark'] {
     --theme-bg: #000000;
     --theme-text: #ffffff;
   }
   ```

3. **Refactor**: ThemeService.ts에서 동적 스타일 적용
   - prefers-contrast 지원
   - prefers-color-scheme 지원

## 3. 불필요한 구현 (Unnecessary Implementations)

### 3.1 구형 브라우저 호환성 코드

**문제**: logger.ts의 timerStorage fallback이 불필요.

**TDD 계획**:

1. **Red**: 브라우저 호환성 테스트

   ```typescript
   // test/browser-compatibility.test.ts
   describe('Browser Compatibility', () => {
     it('should not include unnecessary polyfills', () => {
       // 불필요한 폴리필 코드 검증
     });
   });
   ```

2. **Green**: Vite 빌드 시 제거

   ```typescript
   // vite.config.ts
   export default defineConfig({
     build: {
       target: 'es2020', // 현대 브라우저 타겟팅
     },
   });
   ```

3. **Refactor**: 환경 체크 로직 간소화
   - import.meta.env 체크 제거
   - 프로덕션 빌드에서 불필요 코드 제거

### 3.2 중복 캐시 클리어 메서드

**문제**: MediaService.ts에 여러 clear 메서드가 중복.

**TDD 계획**:

1. **Red**: 캐시 관리 테스트

   ```typescript
   // test/cache-management.test.ts
   describe('Cache Management', () => {
     it('should have single cleanup entry point', () => {
       // 단일 cleanup 메서드 검증
     });
   });
   ```

2. **Green**: cleanup 메서드로 통합

   ```typescript
   // src/shared/services/MediaService.ts
   cleanup(): void {
     this.clearPrefetchCache();
     this.clearExtractionCache();
     this.videoControl.destroy();
   }
   ```

3. **Refactor**: private 메서드로 변경
   - clearPrefetchCache: private
   - clearExtractionCache: private

### 3.3 테스트 환경 체크 중복

**문제**: isTestEnvironment()가 여러 곳에서 호출.

**TDD 계획**:

1. **Red**: 환경 체크 테스트

   ```typescript
   // test/environment-check.test.ts
   describe('Environment Checks', () => {
     it('should minimize test environment checks', () => {
       // 불필요한 환경 체크 검증
     });
   });
   ```

2. **Green**: 단일 플래그로 대체

   ```typescript
   // src/shared/utils/environment.ts
   export const IS_TEST_ENV =
     typeof window !== 'undefined' && window.location.hostname === 'localhost';
   ```

3. **Refactor**: 빌드 시 제거
   - Vite의 define 옵션 사용
   - 트리 쉐이킹으로 불필요 코드 제거

## 4. 버그 가능성이 있는 구현 (Bug-Prone Implementations)

### 4.1 프리페치 캐시 무한 성장

**문제**: evictOldestPrefetchEntry가 FIFO가 아닌 Map 순서 문제.

**TDD 계획**:

1. **Red**: 캐시 관리 테스트

   ```typescript
   // test/prefetch-cache.test.ts
   describe('Prefetch Cache', () => {
     it('should prevent infinite cache growth', () => {
       // 캐시 크기 제한 검증
     });

     it('should properly evict oldest entries', () => {
       // FIFO 방식 제거 검증
     });
   });
   ```

2. **Green**: LRU 캐시 구현

   ```typescript
   // src/shared/services/MediaService.ts
   private evictOldestPrefetchEntry(): void {
     // Map의 iterator 순서를 사용한 FIFO 구현
     const firstKey = this.prefetchCache.keys().next().value;
     if (firstKey) {
       const blob = this.prefetchCache.get(firstKey);
       if (blob) {
         URL.revokeObjectURL(blob.url || ''); // 메모리 해제
       }
       this.prefetchCache.delete(firstKey);
     }
   }
   ```

3. **Refactor**: WeakMap 사용 고려
   - 메모리 누수 방지
   - Blob URL revoke 추가

### 4.2 fetch 에러 핸들링 부족

**문제**: 여러 곳에서 response.ok만 체크하며 AbortError 등 처리 부족.

**TDD 계획**:

1. **Red**: 네트워크 에러 테스트

   ```typescript
   // test/network-error.test.ts
   describe('Network Error Handling', () => {
     it('should handle all fetch error types', () => {
       // CORS, timeout, AbortError 등 처리 검증
     });
   });
   ```

2. **Green**: 중앙 fetchWrapper 함수 도입

   ```typescript
   // src/shared/utils/fetch-wrapper.ts
   export async function fetchWrapper(
     url: string,
     options: RequestInit = {}
   ): Promise<Response> {
     try {
       const response = await fetch(url, {
         ...options,
         signal: options.signal || AbortSignal.timeout(10000), // 기본 timeout
       });

       if (!response.ok) {
         throw new Error(`HTTP ${response.status}: ${response.statusText}`);
       }

       return response;
     } catch (error) {
       if (error instanceof Error) {
         if (error.name === 'AbortError') {
           throw new Error('Request cancelled');
         }
         if (error.message.includes('CORS')) {
           throw new Error('CORS policy blocked the request');
         }
       }
       throw error;
     }
   }
   ```

3. **Refactor**: 모든 fetch 호출에 적용
   - BulkDownloadService: fetchWrapper 사용
   - MediaService: fetchWrapper 사용

### 4.3 이벤트 리스너 누수 가능성

**문제**: MediaService.ts에서 이벤트 리스너 등록 후 제거하지 않음.

**TDD 계획**:

1. **Red**: 메모리 누수 테스트

   ```typescript
   // test/memory-leak.test.ts
   describe('Memory Leak Prevention', () => {
     it('should clean up event listeners', () => {
       // 이벤트 리스너 정리 검증
     });
   });
   ```

2. **Green**: WeakRef와 cleanup 추가

   ```typescript
   // src/shared/services/MediaService.ts
   private eventListeners = new Map<HTMLElement, (() => void)[]>();

   private addEventListener(
     element: HTMLElement,
     event: string,
     handler: EventListener
   ): void {
     element.addEventListener(event, handler);
     const cleanup = () => element.removeEventListener(event, handler);

     if (!this.eventListeners.has(element)) {
       this.eventListeners.set(element, []);
     }
     this.eventListeners.get(element)!.push(cleanup);
   }

   unregisterMediaElement(id: string): void {
     const element = this.mediaElements.get(id);
     if (element) {
       const cleanups = this.eventListeners.get(element);
       if (cleanups) {
         cleanups.forEach(cleanup => cleanup());
         this.eventListeners.delete(element);
       }
       this.mediaElements.delete(id);
     }
   }
   ```

3. **Refactor**: DOMEventManager 도입
   - 이벤트 리스너 중앙 관리
   - 자동 cleanup

### 4.4 인덱스 기반 미디어 접근 버그

**문제**: prefetchNextMedia에서 currentIndex 기반 계산 시 동적 배열 변경으로
인덱스 오버플로우 가능.

**TDD 계획**:

1. **Red**: 인덱스 관리 테스트

   ```typescript
   // test/index-management.test.ts
   describe('Index Management', () => {
     it('should handle dynamic array changes', () => {
       // 배열 변경 시 인덱스 처리 검증
     });
   });
   ```

2. **Green**: Map 기반 미디어 관리

   ```typescript
   // src/shared/services/MediaService.ts
   private mediaItems = new Map<string, MediaItem>();
   private currentMediaId: string | null = null;

   private calculatePrefetchUrls(
     currentId: string,
     prefetchRange: number
   ): string[] {
     const urls: string[] = [];
     const currentIndex = Array.from(this.mediaItems.keys()).indexOf(currentId);

     if (currentIndex === -1) return urls;

     // 다음 N개 미디어들만 프리페치
     for (let i = 1; i <= prefetchRange; i++) {
       const nextIndex = currentIndex + i;
       const keys = Array.from(this.mediaItems.keys());
       if (nextIndex < keys.length) {
         const media = this.mediaItems.get(keys[nextIndex]);
         if (media) {
           urls.push(media.url);
         }
       }
     }

     return urls;
   }
   ```

3. **Refactor**: 범위 체크 강화
   - 배열 길이 검증
   - 유효한 인덱스만 처리

## 5. 구현 우선순위 및 일정

### Phase 1: 핵심 버그 수정 (1-2주)

1. **높은 심각도 버그 우선**:
   - AbortController 충돌 해결
   - 프리페치 캐시 무한 성장 수정
   - fetch 에러 핸들링 강화

2. **테스트 커버리지 확보**:
   - 각 수정사항에 대한 단위 테스트 작성
   - 통합 테스트로 상호작용 검증

### Phase 2: 중복 제거 (2-3주)

1. **로깅 시스템 통합**
2. **URL 최적화 중앙화**
3. **에러 처리 표준화**

### Phase 3: 최적화 및 정리 (1-2주)

1. **불필요한 코드 제거**
2. **성능 최적화**
3. **메모리 누수 방지**

### Phase 4: 검증 및 문서화 (1주)

1. **전체 테스트 실행**
2. **성능 벤치마킹**
3. **문서 업데이트**

## 6. 테스트 전략

### 단위 테스트

- 각 모듈의 독립적 기능 검증
- Mock을 활용한 외부 의존성 격리
- Edge case 및 에러 상황 커버

### 통합 테스트

- 모듈 간 상호작용 검증
- 실제 DOM 환경 시뮬레이션
- E2E 시나리오 커버

### 성능 테스트

- 메모리 사용량 모니터링
- 캐시 효율성 측정
- 로딩 시간 최적화 검증

## 7. 품질 지표

### 코드 품질

- **테스트 커버리지**: 90% 이상
- **TypeScript 엄격 모드**: 100% 준수
- **ESLint 규칙**: 0 에러

### 성능 지표

- **번들 크기**: 현재 대비 10% 감소 목표
- **메모리 사용**: 누수 0건
- **응답 시간**: 100ms 이내

### 유지보수성

- **중복 코드**: 0%
- **순환 의존성**: 0건
- **문서화**: 100%

## 결론

본 리팩토링 계획은 TDD 원칙을 엄격히 준수하며, 분석 결과를 실제 코드와 검증하여
우선순위를 설정했습니다. 각 단계별로 테스트를 먼저 작성하고, 최소 구현으로
통과시키며, 지속적인 리팩토링을 통해 코드 품질을 향상시킬 것입니다.

특히 버그 가능성이 높은 부분들을 우선적으로 수정하여 안정성을 확보하고, 중복된
구현들을 제거하여 유지보수성을 향상시키는 데 중점을 두었습니다.</content>
<parameter name="filePath">c:\git\xcom-enhanced-gallery\docs\refactoring-plan.md
