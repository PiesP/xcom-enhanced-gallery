# TDD 리팩토링 완료 기록

**최종 업데이트**: 2025-10-29 | **최근 완료**: Phase 243

**목적**: 완료된 Phase의 요약 기록 (상세 내역은 필요 시 git 히스토리 참고)

---

## 📊 완료된 Phase 요약 (Phase 197-242)

| Phase       | 날짜       | 제목                                           | 핵심 내용                                     |
| ----------- | ---------- | ---------------------------------------------- | --------------------------------------------- |
| **243**     | 2025-10-29 | 설정 드롭다운 클릭 이슈 해결                   | hover zone 클릭 차단, 패널 상호작용 복원      |
| **242**     | 2025-10-29 | StaticVendorManager 자동 초기화 로그 레벨 조정 | WARN → DEBUG, 콘솔 노이즈 제거                |
| **241**     | 2025-10-29 | 로그 레벨 조정                                 | Element instanceof DEBUG, 스키마 해시 INFO    |
| **240**     | 2025-10-29 | 로그 분석 및 경고 해결                         | Element instanceof 체크, toolbar 설정 추가    |
| **239**     | 2025-10-29 | 문서 정리 및 중복 제거                         | CODE_QUALITY.md 삭제, temp/ 정리              |
| **238**     | 2025-10-29 | 린터 ignore 설정 개선                          | 임시/생성/아카이브 파일 일관 제외             |
| **237**     | 2025-10-29 | 서비스 등록 require 제거 및 타입 가드 강화     | require → static import, element.matches 체크 |
| **236**     | 2025-10-29 | DOMContentLoaded 리스너 제거                   | @run-at document-idle 활용, 격리 완성         |
| **235**     | 2025-10-29 | Toast 알림 GalleryRenderer 격리                | main.ts → GalleryRenderer, 책임 분리 명확화   |
| **234**     | 2025-10-29 | TESTING_STRATEGY 간소화 (48% 감소)             | 517줄→271줄, 테이블 재구성, 링크 대체         |
| **233**     | 2025-10-29 | 문서 간소화 및 정리 (90% 감소)                 | 3개 문서 4667줄→444줄, 개발자 온보딩 개선     |
| **232**     | 2025-10-29 | CodeQL 보안 경고 해결 (6/6)                    | URL 검증, Prototype Pollution, 빌드 안전성    |
| **231**     | 2025-10-29 | Phase 199 중단 흔적 제거                       | 테스트 정리, 문서 정리                        |
| **230**     | 2025-10-28 | BaseService 초기化 실패 수정                   | ThemeService singleton export 추가            |
| **229**     | 2025-10-28 | PC-only 정책 부작용 수정                       | 텍스트 선택 복원, Pointer 이벤트 조정         |
| **228**     | 2025-10-28 | 이벤트 캡처 최적화                             | 미디어 컨테이너 fast-path 체크                |
| **227**     | 2025-10-27 | Testability 테스트 정리                        | Phase 80.1 테스트 재구성 및 이관              |
| **226**     | 2025-10-27 | Container Module 리팩토링                      | service-harness 제거, 구조 최적화             |
| **225**     | 2025-10-27 | Shared Constants 최적화                        | i18n 모듈 재구성                              |
| **224**     | 2025-10-27 | Phase 80.1 의존성 피드백 적용                  | 상태 동기화 개선                              |
| **223**     | 2025-10-27 | Focus 서비스 TDD 완료                          | ObserverManager, Applicator, StateManager     |
| **222**     | 2025-10-27 | Focus 프레임워크 Phase 3 완료                  | 서비스 통합 검증                              |
| **221**     | 2025-10-27 | Focus 프레임워크 Phase 2 완료                  | Applicator/StateManager 통합                  |
| **220**     | 2025-10-27 | Focus 프레임워크 Phase 1 완료                  | ObserverManager 추출                          |
| **219**     | 2025-10-27 | Phase 80.1 최종 검증                           | 테스트 통과, 문서화 완료                      |
| **218**     | 2025-10-27 | Phase 80.1 E2E 검증                            | Playwright 테스트 추가                        |
| **217**     | 2025-10-27 | Theme Initialization 최적화                    | 매직 문자열 상수화, JSDoc 강화                |
| **216**     | 2025-10-27 | Gallery Hooks 점검                             | JSDoc, import 경로 정규화                     |
| **215**     | 2025-10-27 | KeyboardHelpOverlay 재구성                     | 컴포넌트 최적화                               |
| **214**     | 2025-10-27 | VerticalGalleryView 현대화                     | 29개 import 정규화                            |
| **213**     | 2025-10-27 | Vertical Gallery View Hooks 정리               | 494줄 데드코드 제거                           |
| **212**     | 2025-10-27 | KeyboardHelpOverlay 컴포넌트 현대화            | JSDoc, import 경로 정규화                     |
| **211**     | 2025-10-27 | Bootstrap 최적화                               | 부트스트랩 구조 정리                          |
| **210**     | 2025-10-27 | Global Style Tokens 현대화                     | CSS 토큰 체계 정리                            |
| **209**     | 2025-10-27 | dependency-cruiser 설정 최적화                 | 의존성 규칙 강화                              |
| **208**     | 2025-10-27 | Scripts 디렉터리 현대화                        | JSDoc 표준화, 에러 처리 개선                  |
| **207**     | 2025-10-27 | 문서 체계 현대화                               | 문서 구조 정리                                |
| **206**     | 2025-10-27 | Playwright 테스트 통합                         | E2E 스모크 테스트 추가                        |
| **205**     | 2025-10-27 | Playwright Accessibility 통합                  | WCAG 2.1 AA 자동 검증                         |
| **200-204** | 2025-10-27 | 빌드 및 문서 최적화                            | 빌드 병렬화, 메모리 최적화                    |
| **197-199** | 2025-10-27 | Settings 드롭다운 수정                         | PC-only 정책 적용                             |

---

## 📋 Phase 242 상세 (StaticVendorManager 자동 초기화 로그 레벨 조정)

**목표**: 브라우저 로그에서 StaticVendorManager 자동 초기화 WARN 로그 제거

**배경**:

로그 파일(`x.com-1761716035071.log`) 분석 결과:

- ⚠️ "StaticVendorManager가 초기화되지 않았습니다. 자동 초기화를 시도합니다."
  WARN 로그 발생
- vendor getter(`getSolid()`, `getSolidStore()`)가 호출될 때 자동 초기화 실행
- 자동 초기화는 의도된 동작이며 정상 작동 중이지만, WARN 레벨로 콘솔 노이즈 유발

**문제 분석**:

1. **자동 초기화는 의도된 동작**:
   - `initializeEnvironment()`에서 명시적 초기화를 호출하지만,
   - getter가 먼저 호출될 경우 자동 초기화가 동작 (fallback)
   - 이는 안전성을 위한 방어 코드로 정상 동작

2. **로그 레벨이 부적절**:
   - 테스트 모드에서는 DEBUG, 프로덕션에서는 WARN으로 분기
   - 정상 동작이므로 모든 환경에서 DEBUG가 적절

3. **Phase 241과 유사한 패턴**:
   - Phase 241: Element instanceof 경고 → DEBUG로 변경
   - Phase 242: StaticVendorManager 자동 초기화 경고 → DEBUG로 변경

**해결 방안**:

**`getSolid()`, `getSolidStore()` 메서드의 로그 레벨을 DEBUG로 통일**:

```typescript
// src/shared/external/vendors/vendor-manager-static.ts (Phase 242)
public getSolid(): SolidAPI {
  if (!this.isInitialized) {
    logger.debug('StaticVendorManager가 초기화되지 않았습니다. 자동 초기화를 시도합니다.');
    this.validateStaticImports();
    this.cacheAPIs();
    this.isInitialized = true;
  }

  const api = this.apiCache.get('solid') as SolidAPI;
  if (!api) {
    throw new Error('Solid.js API를 찾을 수 없습니다.');
  }
  return api;
}

public getSolidStore(): SolidStoreAPI {
  if (!this.isInitialized) {
    logger.debug('StaticVendorManager가 초기化되지 않았습니다. 자동 초기화를 시도합니다.');
    this.validateStaticImports();
    this.cacheAPIs();
    this.isInitialized = true;
  }
  // ...
}
```

**변경 사항**:

- ❌ 제거: `if (import.meta.env.MODE === 'test')` 분기
- ❌ 제거: `logger.warn(...)` 호출
- ✅ 추가: 모든 환경에서 `logger.debug(...)` 사용

**효과**:

- ✅ 브라우저 콘솔에서 WARN 로그 제거
- ✅ 디버깅 시에는 DEBUG 레벨로 추적 가능
- ✅ 프로덕션 빌드에서 콘솔 노이즈 감소
- ✅ 번들 크기 0.16 KB 감소 (341.78 KB → 341.62 KB)

**테스트 결과**:

- ✅ 기존 테스트 모두 통과
- ✅ E2E 스모크 테스트 82/82 통과
- ✅ 빌드 검증 성공

**관련 Phase**:

- Phase 241: 유사한 로그 레벨 조정 (Element instanceof, 설정 스키마 해시)
- Phase 240: 로그 분석 및 경고 해결의 후속 조치

---

## 📋 Phase 241 상세 (로그 레벨 조정)

**목표**: Phase 240 이후 로그 분석 결과에 따른 로그 레벨 최적화

**배경**:

Phase 240의 수정사항들이 모두 정상적으로 작동하고 있으나, 새로운 로그
파일(`x.com-1761715518483.log`) 분석 결과:

- ✅ "matches is not a function" 경고 제거됨 (Phase 240 성공)
- ✅ "toolbar.autoHideDelay" 설정 키 경고 제거됨 (Phase 240 성공)
- ✅ "toast.controller" 덮어쓰기 경고 제거됨 (Phase 240 성공)
- ⚠️ "Invalid element: not an Element instance" 경고 6회 발생
- ⚠️ "설정 스키마 해시 불일치" 경고 1회 발생

**문제 분석**:

1. **Element instanceof 경고 (6회)**:
   - Phase 240의 수정이 **정상 작동 중**: Document 노드를 안전하게 필터링
   - 하지만 WARN 레벨로 인해 콘솔에 과도한 노이즈 발생
   - 이는 정상적인 필터링 동작이므로 DEBUG 레벨이 적절

2. **설정 스키마 해시 불일치 (1회)**:
   - Phase 240에서 `toolbar.autoHideDelay` 추가로 스키마 변경됨
   - 기존 사용자의 첫 실행 시 마이그레이션이 정상적으로 실행됨
   - 이는 예상된 동작이므로 WARN보다 INFO가 적절

**해결 방안**:

**1. Element instanceof 경고를 DEBUG로 변경**:

```typescript
// src/shared/utils/utils.ts (Phase 241)
export function isGalleryInternalElement(element: HTMLElement | null): boolean {
  if (!element) return false;

  // Phase 241: 정상적인 필터링 동작이므로 DEBUG 레벨로 변경
  if (!(element instanceof Element)) {
    logger.debug('Invalid element: not an Element instance', element);
    return false;
  }
  // ...
}
```

**2. 설정 스키마 해시 불일치를 INFO로 변경**:

```typescript
// src/features/settings/services/settings-service.ts (Phase 241)
if (!storedHash || storedHash !== currentHash) {
  // Phase 241: 정상적인 마이그레이션 동작이므로 INFO 레벨로 변경
  logger.info('설정 스키마 해시 불일치 감지 — 마이그레이션 실행');
  this.settings = runMigration(parsedSettings);
  await this.saveSettings();
}
```

**검증**:

```bash
npm run typecheck  # ✅ 통과
npm run build      # ✅ 빌드 성공
```

**효과**:

- ✅ 브라우저 콘솔 경고 대폭 감소 (WARN → DEBUG/INFO)
- ✅ 디버깅 효율성 향상 (중요한 경고만 표시)
- ✅ 정상 동작에 대한 불필요한 경고 제거
- ✅ 번들 크기 유지: 341.82 KB

**파일 변경**:

- `src/shared/utils/utils.ts`: Element instanceof 경고 DEBUG로 변경
- `src/features/settings/services/settings-service.ts`: 스키마 해시 불일치
  INFO로 변경

---

## 📋 Phase 240 상세 (로그 분석 및 경고 해결)

**목표**: 브라우저 콘솔에서 발견된 경고 및 오류 해결

**배경**:

- 실제 브라우저 로그(`x.com-1761714613795.log`)에서 반복적인 경고 발견:
  1. "Invalid element: matches is not a function" (5회)
  2. "설정 키를 찾을 수 없음: toolbar.autoHideDelay" (2회)
  3. "[ServiceRegistry] 서비스 덮어쓰기: toast.controller" (1회)

**문제 분석**:

1. **isGalleryInternalElement 타입 가드 불완전**:
   - Phase 237에서 `typeof element.matches !== 'function'` 체크 추가
   - 하지만 `#document` 노드는 `Element`가 아니므로 `matches` 속성 자체가 없음
   - `typeof element.matches`가 `undefined`를 반환하여 체크를 통과하지만 이후
     호출 시 실패

2. **toolbar.autoHideDelay 설정 누락**:
   - `VerticalGalleryView.tsx`에서 `getSetting('toolbar.autoHideDelay', 3000)`
     사용
   - `DEFAULT_SETTINGS`에 `toolbar` 섹션이 없어 경고 발생
   - 기본값은 작동하지만 설정 시스템이 경고 출력

3. **toast.controller 중복 등록**:
   - `service-initialization.ts`에서 의도적인 중복 등록 (테스트 호환성)
   - `ServiceRegistry`가 덮어쓰기 경고를 무조건 출력

**해결 방안**:

**1. Element instanceof 체크 추가**:

```typescript
// src/shared/utils/utils.ts (Phase 240)
export function isGalleryInternalElement(element: HTMLElement | null): boolean {
  if (!element) return false;

  // Phase 240: Element 인스턴스인지 확인 (Document, Window 등 제외)
  if (!(element instanceof Element)) {
    logger.warn('Invalid element: not an Element instance', element);
    return false;
  }

  // Phase 237: matches 메서드 존재 여부 확인
  if (typeof element.matches !== 'function') {
    logger.warn('Invalid element: matches is not a function', element);
    return false;
  }

  return GALLERY_SELECTORS.some(selector => {
    try {
      return element.matches(selector) || element.closest(selector) !== null;
    } catch (error) {
      logger.warn('Invalid selector:', selector, error);
      return false;
    }
  });
}
```

**2. toolbar.autoHideDelay 설정 추가**:

```typescript
// src/constants.ts (Phase 240)
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
    autoHideDelay: 3000, // 툴바 자동 숨김 지연 시간 (밀리초), 0이면 비활성화
  },
  download: {
    // ...
  },
  // ...
};
```

**3. ServiceRegistry allowOverwrite 옵션 추가**:

```typescript
// src/shared/services/core/service-registry.ts (Phase 240)
public register<T>(
  key: string,
  instance: T,
  options?: { allowOverwrite?: boolean }
): void {
  if (this.services.has(key)) {
    if (!options?.allowOverwrite) {
      logger.warn(`[ServiceRegistry] 서비스 덮어쓰기: ${key}`);
    }
    // ... 기존 인스턴스 정리 로직
  }
  this.services.set(key, instance);
  logger.debug(`[ServiceRegistry] 서비스 등록: ${key}`);
}

// src/shared/services/service-initialization.ts (Phase 240)
serviceManager.register('theme.service', themeService, { allowOverwrite: true });
serviceManager.register('toast.controller', toastController, { allowOverwrite: true });
```

**검증**:

```bash
npm run typecheck  # ✅ 통과
npm test           # ✅ 모든 테스트 통과
npm run build      # ✅ 빌드 성공
```

**효과**:

- ✅ 브라우저 콘솔 경고 5건 → 0건
- ✅ Element 타입 가드 강화 (Document/Window 노드 제외)
- ✅ 설정 시스템 완전성 향상 (toolbar 섹션 추가)
- ✅ 의도적인 서비스 중복 등록 시 경고 억제
- ✅ 번들 크기 유지: 341.95 KB

**파일 변경**:

- `src/shared/utils/utils.ts`: Element instanceof 체크 추가
- `src/constants.ts`: toolbar 섹션 및 autoHideDelay 설정 추가
- `src/shared/services/core/service-registry.ts`: allowOverwrite 옵션 추가
- `src/shared/services/core/service-manager.ts`: register 시그니처 업데이트
- `src/shared/services/service-initialization.ts`: allowOverwrite 사용

---

## 📋 Phase 239 상세 (문서 정리 및 중복 제거)

**목표**: 중복 문서 제거 및 임시 디렉터리 정리로 문서 유지보수 부담 감소

**배경**:

- CODE_QUALITY.md의 내용이 AGENTS.md에 대부분 포함되어 중복 발생
- docs/temp/에 Phase 227 관련 작업 완료 문서 잔존
- 빈 파일(PHASE_210_ANALYSIS.md) 존재

**변경사항**:

1. **CODE_QUALITY.md 삭제**:
   - 이유: AGENTS.md의 "CodeQL 설정 및 사용" 섹션에 동일 내용 포함
   - 효과: 문서 중복 제거, 단일 진실 공급원(AGENTS.md) 확립

2. **DOCUMENTATION.md 업데이트**:
   - "품질 및 유지보수" 섹션에서 CODE_QUALITY.md 참조 제거
   - AGENTS.md 참조로 대체
   - "학습 경로" 섹션에서 CODE_QUALITY.md 항목 제거

3. **docs/temp/ 정리**:
   - PHASE_210_ANALYSIS.md 삭제 (빈 파일)
   - phase-227-completion-report.md → docs/archive/ 이동
   - phase-227-dom-analysis.md → docs/archive/ 이동

4. **TDD_REFACTORING_PLAN.md 업데이트**:
   - Phase 239 완료 내역 추가
   - "다음 작업 후보" 섹션 상세화

**검증**:

```bash
npm run validate  # 모든 검증 통과
npm run build     # 빌드 성공 (341.78 KB)
```

**효과**:

- ✅ 문서 중복 제거 (CODE_QUALITY.md)
- ✅ 임시 디렉터리 정리 (temp/ 비움)
- ✅ 완료된 Phase 문서 아카이브
- ✅ 문서 탐색 간소화

---

## 📋 Phase 238 상세 (린터 ignore 설정 개선)

**목표**: 임시/생성/아카이브 파일을 모든 린터에서 일관성 있게 제외하여 성능 개선
및 false positive 방지

**배경**: 이전에 markdownlint에서 test-results/, dist/ 제외 설정을 추가했으나,
다른 린터들(ESLint, Stylelint, Prettier)에는 유사한 패턴이 누락되어 있었음

**변경사항**:

1. **ESLint** (`eslint.config.js`):
   - 추가된 ignore 패턴:
     - `codeql-reports/**`
     - `codeql-results/**`
     - `docs/temp/**`
     - `docs/archive/**`
     - `scripts/temp/**`

2. **Stylelint** (`.stylelintrc.json`):
   - 추가된 ignoreFiles 패턴:
     - `test-results/**`
     - `codeql-reports/**`
     - `codeql-results/**`
     - `docs/temp/**`
     - `docs/archive/**`
     - `scripts/temp/**`

3. **Prettier** (`.prettierignore`):
   - 추가된 패턴:
     - `test-results/`
     - `codeql-reports/`
     - `codeql-results/`
     - `docs/temp/`
     - `docs/archive/`
     - `scripts/temp/`
   - 섹션 재구성 (Generated & Archive 구분)

4. **Markdownlint** (`.markdownlintignore`):
   - 추가된 패턴:
     - `codeql-results/`
     - `docs/temp/`
     - `docs/archive/`
     - `scripts/temp/`
   - `package.json` 스크립트에도 동일 패턴 추가

**검증**:

```bash
npm run lint:all      # 모든 린터 정상 실행 (0 errors)
npm run typecheck     # 타입 체크 통과
npm run build         # 빌드 성공 (341.78 KB)
```

**효과**:

- ✅ 모든 린터가 임시/생성/아카이브 파일을 일관되게 무시
- ✅ 린터 실행 속도 개선 (불필요한 파일 스캔 방지)
- ✅ false positive 방지 (생성된 파일에 대한 오류 보고 제거)
- ✅ 개발자 경험 개선 (일관된 ignore 규칙)

**커밋**:

- `chore: improve linter ignore configurations`
- 브랜치: `chore/improve-linter-ignores`

---

## 📋 Phase 237 상세 (서비스 등록 require 제거 및 타입 가드 강화)

**목표**: 브라우저 환경에서 서비스 등록 실패 문제 해결 및 런타임 안정성 개선

**문제 분석** (로그 파일 기반):

1. `ReferenceError: require is not defined` - 브라우저 환경에서 CommonJS require
   사용
2. AnimationService, ThemeService, LanguageService 등록 실패
3. `element.matches is not a function` - 타입 가드 부재

**해결**:

1. **require → static import 변경**:
   - `src/shared/container/service-accessors.ts`:

     ```typescript
     // AS-IS (제거됨)
     const { AnimationService } = require('../services/animation-service');
     const { themeService } = require('../services/theme-service');
     const { languageService } = require('../services/language-service');

     // TO-BE
     import { AnimationService } from '../services/animation-service';
     import { themeService } from '../services/theme-service';
     import { languageService } from '../services/language-service';
     ```

2. **타입 가드 강화**:
   - `src/shared/utils/utils.ts` - `isGalleryInternalElement`:

     ```typescript
     // 추가됨
     if (typeof element.matches !== 'function') {
       logger.warn('Invalid element: matches is not a function', element);
       return false;
     }
     ```

**테스트**:

- Phase 237 회귀 방지 테스트 9개 추가:
  - `test/unit/shared/container/service-registration.test.ts` (3개)
  - `test/unit/shared/utils/element-type-guard.test.ts` (6개)
- 모든 테스트 통과 (18/18)

**효과**:

- ✅ 브라우저 환경에서 서비스 등록 성공
- ✅ 설정 패널 (드롭다운) 정상 작동
- ✅ 타입 안전성 향상
- ✅ 런타임 오류 방지

**검증**:

- ✅ 타입/린트: 0 errors
- ✅ 단위 테스트: 91/91 통과 (9개 추가)
- ✅ 빌드: dev + prod 성공
- ✅ 번들 크기: 341.78 KB

---

## 📋 Phase 236 상세 (DOMContentLoaded 리스너 제거)

**목표**: 클릭 이벤트 이외의 모든 유저스크립트 요소를 갤러리 앱 내부로 격리

**문제**: main.ts에 DOMContentLoaded 리스너가 잔존하여 트위터 네이티브 페이지에
간섭

**해결**:

1. **핵심 인사이트**: @run-at document-idle 활용
   - 유저스크립트 엔진(Tampermonkey/Greasemonkey)이 DOM 준비 완료 후 실행 보장
   - DOMContentLoaded 리스너 불필요

2. **변경 사항**:
   - main.ts: DOMContentLoaded 리스너 제거 (line 422-426)
   - main.ts: cleanup 함수에서 리스너 제거 로직 제거 (line 207-211)
   - main.ts: 즉시 startApplication 호출 (line 422)

3. **코드 변경**:

```typescript
// AS-IS (제거됨)
if (document.readyState === 'loading') {
  if (import.meta.env.MODE !== 'test') {
    document.addEventListener('DOMContentLoaded', startApplication);
  }
} else {
  startApplication();
}

// TO-BE
/**
 * @run-at document-idle 보장:
 * 유저스크립트 엔진이 DOM 준비 완료 후 실행하므로
 * DOMContentLoaded 리스너가 불필요합니다.
 */
startApplication();
```

**효과**:

- ✅ 트위터 네이티브 페이지 간섭 최소화 (DOMContentLoaded 리스너 제거)
- ✅ main.ts 역할 명확화 (설정 + cleanup만 담당)
- ✅ 코드 단순화 (조건 분기 제거)
- ✅ 테스트 안정성 향상 (리스너 누수 방지)

**검증**:

- ✅ 타입/린트: 0 errors
- ✅ 단위 테스트: 82/82 통과
- ✅ 브라우저 테스트: 111/111 통과
- ✅ E2E 스모크: 87 통과 (5 skipped)
- ✅ 번들 크기: 339.05 KB (변화 없음)

**완료 조건 달성**:

- [x] DOMContentLoaded 리스너 제거
- [x] @run-at document-idle 주석 추가
- [x] cleanup 로직 정리
- [x] 모든 테스트 통과
- [x] 빌드 검증 완료

---

## 📋 Phase 235 상세 (Toast 알림 격리)

```

```
