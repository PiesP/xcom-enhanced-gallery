# 🏗️ 아키텍처 개요 (xcom-enhanced-gallery)

> Solid.js 기반 Userscript의 3계층 구조와 의존성 경계 최종 업데이트: 2025-10-27
> 코딩 규칙/스타일/토큰/테스트 정책은 `docs/CODING_GUIDELINES.md`를 단일
> 기준으로 참조하세요.

이 문서는 코드 작성 가이드(CODING_GUIDELINES)와 별개로, 상위 수준의 시스템
구조와 계층 간 경계를 설명합니다. 구현 규칙/토큰/스타일은
`docs/CODING_GUIDELINES.md`를 참고하세요.

## 프로젝트 현황 (2025-10-27)

- **빌드**: prod 340.04 KB / 420 KB (79.96 KB 여유) ✅
- **테스트**: Browser 111, E2E 60/61(1 skipped), a11y 34, 단위 전체 GREEN ✅
- **아키텍처**: 3계층 구조, 0 dependency violations ✅
- **번들러**: Vite 7 + Solid.js 1.9.9 + TypeScript strict
- **최근 개선**: Phase 214 VerticalGalleryView 모던화 (import 정규화 + JSDoc
  강화) useProgressiveImage 제거)

## 계층 구조와 단방향 의존

- **Features** → **Shared**(services/state/utils/logging) →
  **External**(adapter/vendors)
- 단방향 의존만 허용: Features는 Shared까지만, Shared는 External까지만
  접근합니다.
- Vendors/Userscript는 반드시 안전 getter 경유:
  - Vendors: `@shared/external/vendors`의 `getSolid()`/`getSolidStore()`
  - Userscript: `@shared/external/userscript/adapter`의 `getUserscript()`

## 디렉터리 지도(요약)

### Root Layer (`src/` 계층) — 애플리케이션 진입점 및 전역 설정

| 파일/폴더               | 책임                                                 |    현황     |
| :---------------------- | :--------------------------------------------------- | :---------: |
| `src/main.ts`           | 7단계 부트스트랩 + 생명주기 조율                     |  ✅ 체계적  |
| `src/constants.ts`      | 전역 상수 (APP/TIMING/DOM/MEDIA/EVENTS/SERVICE_KEYS) |   ✅ 통합   |
| `src/styles/globals.ts` | CSS import 배럴 (토큰/리셋/유틸리티)                 |   ✅ 간결   |
| `src/types/index.ts`    | 타입 배럴 export → shared/types/core                 |  ✅ 미니멀  |
| `src/utils/index.ts`    | 경량 재export (CoreService/logger)                   | ✅ 성능최적 |
| `src/bootstrap/*`       | 초기화 로직 (environment/events/features)            |  ✅ 분리됨  |

**설계 원칙:**

- `main.ts`: 7단계 명확 분리 + 각 단계별 외부 파일 참조 (src/bootstrap/_,
  src/shared/_)
- `constants.ts`: 도메인별 상수
  (APP/TIMING/SELECTORS/MEDIA/CSS/HOTKEYS/EVENTS/SERVICE_KEYS)
  - ⚠️ 과거 URL_PATTERNS 중복 제거됨 (Phase 2025-10-27)
  - 📝 STABLE_SELECTORS/VIDEO_CONTROL_SELECTORS는 분산되었지만 명확한 도메인
    구분
- `styles/globals.ts`: CSS import만 관리 (사이드이펙트 안전성)
- `types/index.ts`: shared/types/core 재export (배럴 패턴)
- `utils/index.ts`: 최소 표면적 (CoreService/logger만) — 과거
  `export * from '../shared'` 제거로 성능 최적화

- `src/features/*`: UI/도메인 기능, 신호 구독과 사용자 인터랙션 처리
  - **GalleryApp** (264줄): 갤러리 앱 조율기 - 초기화, 이벤트 연결, 생명주기
    관리
    - 책임: 초기화 오케스트레이션, 이벤트 핸들러 등록, 미디어 서비스 지연 초기화
    - 상태 관리는 shared/state 신호에 위임
  - **GalleryRenderer** (178줄): 갤러리 렌더러 - DOM 렌더링 및 생명주기
    - 책임: Solid.js 컴포넌트 렌더링, signal 구독으로 자동 업데이트, 컨테이너
      관리
    - Signal 기반 반응형 아키텍처 (gallerySignals.isOpen 구독)
  - `components/`:
    - **VerticalGalleryView** (517줄): 메인 갤러리 뷰 컴포넌트
    - **VerticalImageItem** (419줄): 이미지 항목 컴포넌트 (FitMode 로직)
    - **KeyboardHelpOverlay**: 키보드 도움말 오버레이
  - `hooks/`: 상태 관리 및 이벤트 처리
    - **useGalleryScroll** (259줄): 휠 이벤트 기반 갤러리 스크롤 처리 ✅ 양호
    - **useGalleryFocusTracker** (680줄): 자동 포커스 추적 및
      IntersectionObserver 관리 (Phase 19A 정리)
    - **useGalleryItemScroll** (438줄): 특정 item으로의 스크롤 조율 (Phase 19A
      정리)
  - `types/`: 갤러리 특화 타입 (현재 미사용 - index.ts barrel만 export)
  - `styles/`: 갤러리 스타일
    - **gallery-global.css**: 갤러리 전역 스타일 (558줄)
    - **Gallery.module.css**: CSS Modules (878줄, WIP/TEST TARGET)
  - `settings/`: 설정 UI, 스토리지 어댑터 (Phase 193: 타입-값 분리 강화)
    - **SettingsService** (524줄): 설정 상태 관리 및 지속성 ✅ 간결화
      - 책임: 설정 로드/저장, 마이그레이션, 스키마 해싱
      - Phase 192: setNestedValue 헬퍼로 중복 제거 (-31줄)
    - **settings-migration.ts** (94줄): 설정 업그레이드 로직 ✅ 최적화
      - 책임: 버전 관리, 카테고리별 기본값 병합, 유효성 검증
      - Phase 192: 루프 기반 일반화로 간결화 (-24줄)
      - Phase 193: DEFAULT_SETTINGS import 경로 @/constants로 정규화
    - **settings-schema.ts** (42줄): 스키마 해싱 및 버전 관리 ✅ 현대화
      - 책임: 스키마 변경 감지, JSON 기반 해시 (DJB2 → 간단 해시)
      - Phase 192: 해시 알고리즘 단순화 (-21줄)
      - Phase 193: DEFAULT_SETTINGS import 경로 @/constants로 정규화
    - **settings.types.ts** (151줄): Settings 도메인 타입 정의 ✅ 타입-값 분리
      - 책임: AppSettings, GallerySettings, DownloadSettings 등 타입 정의
      - Phase 193: DEFAULT_SETTINGS 재익스포트 제거 (타입 파일 역할 강화)
      - 기본값은 @/constants에서 직접 import
  - `services/`: 갤러리 기능 서비스 (Phase 211: 구조 정리)
    - **theme-initialization.ts** (170줄): 테마 초기화 서비스 ✅ 현대화
      - 책임: 시스템 감지 → localStorage 복원 → DOM 적용
      - 함수: `initializeTheme()`, `detectSystemTheme()`,
        `getSavedThemeSetting()`, `applyThemeToDOM()`, `resolveAndApplyTheme()`,
        `setupThemeChangeListener()`
      - Phase 211: bootstrap/initialize-theme.ts에서 이동 (계층 준수)
- `src/bootstrap/*`: 애플리케이션 초기화 (동적 임포트, 트리셰이킹 최적화)
  - `environment.ts` (24줄): Vendor 라이브러리 초기화 (Solid.js 등) ✅ 현대화
  - `events.ts` (33줄): 전역 이벤트 (beforeunload/pagehide) 핸들러 ✅ 현대화
  - `features.ts` (52줄): Features 레이어 서비스 지연 등록 ✅ 현대화
- `src/shared/services/*`: 순수 로직 API (Phase 2025-10-27: 구조 최적화)
  - **핵심 서비스**:
    - `MediaService`, `BulkDownloadService`: 미디어 추출/다운로드
    - `media-extraction/`, `media-mapping/`: 미디어 처리 전략
    - `UnifiedToastManager`, `ToastController`: 토스트 알림
    - `ThemeService`, `LanguageService`: 테마/언어 관리
    - `AnimationService`: 애니메이션 관리
    - `EventManager`: DOM 이벤트 관리
  - **토큰 추출**: `token-extraction/` (Phase 192)
    - **TwitterTokenExtractor** (520줄): Twitter Bearer 토큰 추출
      - 책임: 네트워크/스크립트/설정에서 토큰 추출, 유효성 검증
      - Phase 192: features/settings/services → shared/services로 이동
  - **재배치 완료** (Phase 2025-10-27):
    - HighContrastDetection → `@shared/utils/high-contrast` (순수 함수)
    - StabilityDetector → `@shared/utils/stability` (Signal 기반 유틸)
    - IconRegistry → `@shared/components/ui/Icon/icon-registry` (컴포넌트 관련)
- `src/shared/utils/*`: 순수 유틸리티 함수 (Phase 2025-10-27: 확장)
  - **UI 유틸리티**: `high-contrast.ts`, `stability.ts` (services에서 이동)
  - **브라우저 환경**: `browser.ts` (안전한 window/document 접근)
  - **성능**: `timer-management.ts`, `performance/`
  - **타입 안전**: `type-guards.ts`, `type-safety-helpers.ts`
- `src/shared/hooks/*`: Solid.js 반응성 기반 재사용 로직 (Phase 2025-10-26 정리)
  - **목적**: Signal/effect 활용한 UI 상태 관리 및 이벤트 조율
  - **구조**:
    - `use-toolbar-state.ts` (189줄): 툴바 상태 관리 훅
      - 책임: 다운로드/로딩/에러/고대비 상태 관리
      - 내보내기: `useToolbarState()` 훅, `ToolbarState`/`ToolbarActions` 타입
      - 헬퍼 함수 분리됨 (→ `toolbar-utils.ts`)
    - `toolbar/use-toolbar-settings-controller.ts` (376줄): 설정 패널 제어 훅
      - 책임: 설정 패널 토글, outside-click 감지, 테마/언어 선택, 고대비 감지
      - Phase 2025-10-27: 고대비 감지 유틸 import 경로 변경 (→
        `@shared/utils/high-contrast`)
    - `use-focus-trap.ts` (119줄): 포커스 트래핑 훅
      - 책임: 모달/오버레이의 포커스 제한 관리
      - 사용: KeyboardHelpOverlay 컴포넌트
      - 통합: `shared/utils/focus-trap` 유틸에 위임
  - **제거됨**:
    - `use-gallery-toolbar-logic.ts` (Phase 140.2 미사용 코드 정리, 2025-10-26
      제거)
    - 컴포넌트 레벨 훅 (Phase 213: 2025-10-27)
      - `VerticalGalleryView/hooks/useGalleryCleanup.ts` (174줄) → 제거
        (불필요한 추상화)
      - `VerticalGalleryView/hooks/useProgressiveImage.ts` (300줄) → 제거
        (미사용, 0 import)
- `src/shared/container/*`: **의존성 주입 및 서비스 접근 제어** (Phase 194 정리
  완료)
  - **목적**: Features 레이어의 ServiceManager 직접 import 금지 정책 강제
  - **구조**:
    - `core-service-registry.ts` (180줄): 중앙화된 서비스 레지스트리 + 캐싱
      - 내부 전용 (`@internal`), 접근자를 통해서만 사용
      - 메서드: `get<T>(key)`, `tryGet<T>(key)`, `register<T>(key, instance)`
    - `service-accessors.ts` (250줄): 타입 안전 접근자 (공개 API)
      - Getter: `getToastController()`, `getThemeService()`,
        `getMediaFilenameService()` 등
      - Registrations: `registerGalleryRenderer()`, `registerSettingsManager()`
        등
      - Optional: `tryGetSettingsManager()` (null 반환)
      - BaseService: `initializeBaseServices()`, `registerBaseService()` 등
      - Warmup: `warmupCriticalServices()`, `warmupNonCriticalServices()` (lazy
        초기화)
    - `service-bridge.ts` (120줄): Features ← ServiceManager 접근 경계
      - 내부 전용, service-accessors 내부에서만 사용
      - 메서드: `bridgeGetService()`, `bridgeTryGet()`, `bridgeRegister()` 등
    - `harness.ts` (70줄): 테스트 하네스 (테스트 전용)
      - 클래스: `TestHarness` (서비스 초기화/접근/리셋)
      - 팩토리: `createTestHarness()`
      - 호환성: 레거시 이름 `ServiceHarness`, `createServiceHarness()` 유지
    - `settings-access.ts` (120줄): 설정 서비스 추상화
      - 함수: `getSetting<T>(key, defaultValue)`, `setSetting<T>(key, value)`
      - Optional: `tryGetSettingsService()` (null 반환)
      - 특징: 서비스 미사용 시 안전 처리, 순환 의존성 회피
    - `index.ts` (배럴 export): 공개 API 통합
      - 공개: service-accessors, settings-access, harness, service-bridge
      - 비공개: CoreServiceRegistry (내부용)
  - **사용 패턴**:

    ```typescript
    // ✅ Features에서 (접근자 사용)
    import { getToastController, getSetting } from '@shared/container';
    const toast = getToastController();
    const autoDownload = getSetting('autoDownload', false);

    // ✅ 테스트에서
    import { createTestHarness } from '@shared/container';
    const harness = createTestHarness();
    await harness.initCoreServices();

    // ❌ 금지: ServiceManager 직접 import
    import { CoreService } from '@shared/services/service-manager'; // ❌
    ```

  - **정책**: SERVICE_KEYS를 features 레이어로부터 숨기고, 명확한 타입 안전
    접근자만 제공

- `src/shared/browser/*`: DOM/CSS 관리 서비스 (Core 계층)
  - **BrowserService**: DOM 조작, CSS 주입/제거, 파일 다운로드, 페이지 가시성
    확인
    - 책임: 브라우저 기본 기능 제공 (DOM 레벨 작업)
    - 내보내기: `@shared/browser`에서 `BrowserService` + `browserAPI` (편의
      함수)
  - **관련 호환성**: 원본 경로 `@shared/browser/utils/browser-utils` 계속 작동
    (재내보내기)
- `src/shared/utils/browser/*`: 타입 안전 브라우저 글로벌 접근 (Infrastructure
  계층, Phase 194 추가)
  - **safe-browser.ts** (329줄): Window, Location, Navigator 타입 안전 접근
    - 함수: `isBrowserEnvironment()`, `safeWindow()`, `safeLocation()`,
      `safeNavigator()`, `isTwitterSite()`, `getCurrentUrlInfo()`,
      `setScrollPosition()`, `safeSetTimeout()`/`safeClearTimeout()`,
      `getViewportSize()`, `getDevicePixelRatio()`, `matchesMediaQuery()`,
      `isDarkMode()`, `prefersReducedMotion()`, `getBrowserInfo()`,
      `isExtensionContext()`, `isExtensionEnvironment()`
    - 책임: 서버사이드/테스트 환경에서도 안전한 글로벌 객체 접근 제공
    - import:
      `import { isTwitterSite, safeWindow, ... } from '@shared/utils/browser'`
  - **배럴 export**: `src/shared/utils/index.ts`에서 17개 함수 재익스포트
- `src/shared/dom/*`: DOM 쿼리 캐싱, 선택자 추상화, 기본 DOM 유틸리티
  (Infrastructure 계층, Phase 195 정규화)
  - **dom-cache.ts** (452줄): DOM 쿼리 캐싱 시스템
    - 클래스: `DOMCache` (TTL 기반 캐시, 적응형 정리)
    - 전역 인스턴스: `globalDOMCache` (기본값: TTL 20s, size 150)
    - 헬퍼: `cachedQuerySelector()`, `cachedQuerySelectorAll()`,
      `cachedStableQuery()`
    - 책임: 반복 DOM 쿼리 최적화, 성능 메트릭 수집
  - **selector-registry.ts** (109줄): STABLE_SELECTORS 기반 DOM 접근 추상화
    - 인터페이스: `ISelectorRegistry`
    - 클래스: `SelectorRegistry` (findFirst, findAll, findClosest, 도메인
      메서드)
    - 팩토리: `createSelectorRegistry()`
    - 책임: 선택자 우선순위 관리, TDD 친화적 설계
    - 사용처: `dom-direct-extractor.ts` (미디어 추출)
  - **dom-event-manager.ts** (150줄): 이벤트 리스너 관리 (내부용)
    - 클래스: `DomEventManager` (등록, 정리 자동화)
    - 책임: 이벤트 리스너 생명주기 관리
    - 정책: 외부 노출 제외 (barrel export에 미포함), 상대 경로로만 import
  - **utils/dom-utils.ts** (292줄): 기본 DOM 함수형 유틸리티
    - 함수: `querySelector()`, `querySelectorAll()`, `elementExists()`
    - 함수: `createElement()`, `removeElement()`
    - 가드: `isElement()`, `isHTMLElement()`
    - 상태: `isElementVisible()`, `isElementInViewport()`
    - 디버그: `getDebugInfo()`
    - 책임: DOM 조작 기본 작업
    - 정책: 이벤트 관리 함수는 제거됨 (BrowserService/DomEventManager로 위임)
  - **배럴 export**: `src/shared/dom/index.ts`에서 캐싱/선택자/기본 유틸
    재익스포트
- `src/shared/constants/*`: 정적 데이터 및 설정 (2025-10-26 정규화)
  - **목적**: 불변 데이터, 설정값, 열거형 모음 (서비스가 아닌 데이터만)
  - **구조**:
    - `i18n/` (3파일, 380줄): 다국어 시스템
      - **language-types.ts** (55줄): 타입 정의 및 런타임 검증
        - 타입: `BaseLanguageCode` ('en'|'ko'|'ja'), `SupportedLanguage`
          ('auto'|기본)
        - 인터페이스: `LanguageStrings` (toolbar/settings/messages 스키마)
        - 함수: `isBaseLanguageCode()` (타입 가드)
        - 상수: `LANGUAGE_CODES` readonly 튜플
      - **translation-registry.ts** (24줄): 중앙 번역 레지스트리
        - 상수: `TRANSLATION_REGISTRY` (en/ko/ja 객체 맵)
        - 상수: `DEFAULT_LANGUAGE` ('en')
        - 함수: `getLanguageStrings()`, `listBaseLanguages()`
      - **languages/\*.ts** (en.ts/ko.ts/ja.ts, 각 50줄): 언어별 번역
        - 내보내기: `export const {lang}: LanguageStrings`
        - 특징: 모두 readonly, 스키마 구속 (타입 체크)
    - **index.ts** (배럴): constants 계층 공개 API
      - 내보내기: `export * from './i18n'`
    - **정책**:
      - 데이터/설정값만 포함 (logic 제외)
      - 모든 상수는 readonly/frozen (불변성)
      - 언어 파일은 TypeScript 스키마 기반 (type safety)
  - **사용 패턴**:

    ```typescript
    // ✅ 권장: constants에서 import
    import {
      TRANSLATION_REGISTRY,
      getLanguageStrings,
    } from '@shared/constants';
    const strings = getLanguageStrings('ko');

    // ✅ 개별 import 가능
    import { en, ko, ja } from '@shared/constants/i18n/languages';
    ```

  - **특징**:
    - 번들 포함: 모든 언어 파일이 기본 번들에 포함 (다운로드/런타임 선택 미지원)
    - 정합성: LanguageService의 `getIntegrityReport()`로 누락/중복 검증

- `src/shared/state/*`: Signals 상태 및 파생값
  - **계층 분류**:
    1. **Signal Factory** (기반 인프라):
       - `signals/signal-factory.ts`: Solid.js 안전 팩토리 (150줄)
         - `createSignalSafe<T>()`: Signal 생성 + 폴백 지원 (테스트/Node 환경)
         - `effectSafe()`: Effect 생성 + 폴백 처리
         - `computedSafe<T>()`: Computed 생성 + 폴백 처리
         - 특징: Solid.js 미사용 환경에서도 안전하게 동작
    2. **Domain Signals** (도메인별 상태):
       - `signals/gallery.signals.ts` (334줄): 갤러리 상태 + 네비게이션 로직
         - 세밀한 신호: isOpen, mediaItems, currentIndex, isLoading, error,
           viewMode, focusedIndex
         - 후방 호환성: galleryState (gallerySignals 조합)
         - 액션: openGallery, closeGallery, navigateToItem,
           navigatePrevious/Next, setFocusedIndex
         - 선택자: getCurrentMediaItem, hasMediaItems, isGalleryOpen,
           getCurrentIndex 등
         - 네비게이션 이벤트: galleryIndexEvents (navigate:start/complete)
       - `signals/download.signals.ts` (411줄): 다운로드 상태 + 작업 관리
         - 타입: DownloadTask, DownloadState, DownloadStatus
         - downloadState 액세서 (구독 지원)
         - 액션: createDownloadTask, startDownload, updateDownloadProgress,
           completeDownload, failDownload, removeTask, clearCompletedTasks
         - 선택자: getDownloadTask, getDownloadInfo
         - 이벤트: download:started/progress/completed/failed/queue-updated
       - `signals/toolbar.signals.ts` (215줄): 툴바 상태 + 설정 패널
         - 타입: ToolbarState, ToolbarExpandableState, ToolbarEvents
         - 신호: toolbarStateSignal, expandableStateSignal
         - 액션: updateToolbarMode, setHighContrast, toggleSettingsExpanded,
           setSettingsExpanded
         - 선택자: getCurrentToolbarMode, getToolbarInfo,
           getToolbarExpandableState, getSettingsExpanded
         - 이벤트 리스너 API: addEventListener
       - `signals/scroll.signals.ts` (20줄): 스크롤 상태 타입만 정의
         - ScrollState 인터페이스, ScrollDirection 타입, INITIAL_SCROLL_STATE
           상수
         - 주의: 실제 ScrollState Signal은 useGalleryScroll Hook에서 로컬 생성
         - 용도: 타입 공유 및 상수 정의
    3. **Domain Modules** (통합 상태 관리):
       - `focus/` (Phase 150.2): 포커스 추적 상태
         - focus-types.ts, focus-state.ts, focus-tracking.ts, focus-cache.ts,
           focus-timer-manager.ts
       - `item-scroll/` (Phase 150.2): 아이템 스크롤 상태
         - item-scroll-state.ts, item-scroll-signal.ts
    4. **State Machines** (상태 전환):
       - `machines/` 폴더 (Phase 2025-10-27 ✅):
         - navigation-state-machine.ts, settings-state-machine.ts,
           download-state-machine.ts, toast-state-machine.ts
         - 순수 함수 기반 (transition 메서드는 side-effect 없음)
         - 상태는 불변 객체, 명확한 액션 타입 정의
    5. **기타**:
       - `types/`: 공유 상태 타입
  - **개선 사항** (Phase 2025-10-27 상태 계층 현대화 ✅):
    - **구조 정렬** (명확한 계층 분리):
      - ✅ `signals/` 폴더: 신호 기반 상태 + 중앙화 export
      - ✅ `machines/` 폴더 (NEW): 상태 머신 + 중앙화 export
      - ✅ `focus/`, `item-scroll/`: 전문화 모듈 (이미 분리됨)
    - **제거된 파일**:
      - ❌ app-state.ts (중복: root index.ts가 모든 export 담당)
      - ❌ gallery-store.ts (미사용, 과거 구현 방식)
      - ✅ 백업: docs/temp/state-refactor-backup/
    - **코드 간결화**:
      - Phase 정보 제거 (프로젝트 추적 완료)
      - Decorator 주석 정리 (필수만 유지)
      - 신호 파일들: 이미 현대적 스타일
    - **Export 정책** (충돌 방지):
      - `signals/index.ts`: 도메인 신호 중앙화
      - `machines/index.ts`: 상태 머신 + 타입 별칭 (DownloadState 타입 →
        MachineDownloadState)
      - Root `state/index.ts`: 4계층 통합 export
    - **Import 변경**:
      - Before: `from '../navigation-state-machine'`
      - After: `from '../machines'` (배럴 export 사용)

- `src/shared/services/focus/*` (Phase 150.3 ✅): 포커스 추적 서비스 계층 분리
  - **목적**: useGalleryFocusTracker(651줄) → 515줄(21% 감소)로 단순화
  - **아키텍처**: DI 기반 서비스 패턴, 순수 비즈니스 로직 외부화
  - **주요 서비스**:
    - `focus-observer-manager.ts` (204줄): **FocusObserverManager**
      - 책임: IntersectionObserver 생명주기 관리
      - 메서드: setupObserver(), handleEntries(), observeItem(),
        unobserveItem(), cleanupObserver()
      - 특징: 후보 점수 계산(centerDistance, intersectionRatio 기반)
    - `focus-applicator-service.ts` (195줄): **FocusApplicatorService**
      - 책임: 자동 포커스 적용 및 평가 로직
      - 메서드: applyAutoFocus(), evaluateAndScheduleAutoFocus(),
        clearAutoFocusTimer()
      - 특징: 중복 방지, 요소 연결 확인, preventScroll 폴백
    - `focus-state-manager-service.ts` (145줄): **FocusStateManagerService**
      - 책임: 상태 동기화 및 debouncer 관리
      - 메서드: setupAutoFocusSync(), setupContainerSync(), handleScrollState(),
        deferSync()
      - 특징: 2개 debouncer(autoFocus, container) 중앙화, scroll settling 처리
  - **의존성 흐름**: Hook(조율) → 3 Services(비즈니스) → State/Utils(순수)
  - **테스트 용이성**: 각 서비스 독립 테스트 가능, Mock 주입 간편
  - **메트릭스**:
    - Hook 크기: 651줄 → 515줄 (-21%)
    - 직접 구현: 100% → ~30% (70% 외부화)
    - 서비스 책임: 단일 역할 (observer/applicator/state-sync)
- `src/shared/types/*`: 공유 도메인 타입 정의 (**.types.ts 패턴**)
  - **구조** (Phase 197 개선):

    ```
    types/
    ├── index.ts (배럴 export) - 단일 import 지점
    ├── app.types.ts (205줄) - 앱 전역 타입 + 재-export 허브
    ├── ui.types.ts - UI/테마 관련
    ├── component.types.ts - 컴포넌트 Props/이벤트
    ├── media.types.ts (558줄) - 미디어 추출 & 도메인
    ├── result.types.ts - Result 패턴 & ErrorCode
    ├── navigation.types.ts - 네비게이션 타입
    └── core/
        ├── core-types.ts (617줄) - Result/Service/갤러리/미디어전략
        ├── base-service.types.ts - BaseService (순환 의존성 방지)
        ├── extraction.types.ts - 추출 타입 (backward compat)
        ├── userscript.d.ts (205줄) - UserScript API
        └── index.ts - core 배럴
    ```

  - **app.types.ts** (Phase 197):
    - 역할: 앱 레벨 타입 정의 + 하위 파일들의 재-export 허브
    - 변경: 350줄 → 205줄 (-41% 감소)
    - 개선: Brand 타입, 유틸리티 타입 명확화
  - **Phase 195-197 통합 완료**:
    - media.types.ts (core/) → media.types.ts (root) ✓
    - BaseService 중복 제거 (core-types에서 base-service.types 재-export) ✓
    - extraction.types.ts는 backward compatibility만 유지 ✓

- `src/shared/interfaces/*`: Features 계층 계약 정의 (Phase 201 정리 완료)
  - `gallery.interfaces.ts`: GalleryRenderer 인터페이스 + GalleryRenderOptions
    re-export
    - 책임: Features의 GalleryRenderer 구현체 계약 정의
    - 의존성: @shared/types/media.types에서 GalleryRenderOptions import
    - 정책: 실제 타입 정의는 @shared/types가 기준, interfaces는 계약만 정의
  - **Phase 201**: service-interfaces.ts 제거 완료 (사용처 0건, 안전 제거)
  - **경고**: @shared의 코드가 @features/gallery/types를 import하는 것은 의존성
    역행 (현재 toolbar.types 관련 - Phase 197.1에서 해결 예정)
- `src/shared/utils/*`: 순pure 유틸리티, DOM 헬퍼(서비스 직접 참조 금지)
  - **error-handling.ts** (376줄): 애플리케이션 로직 에러 처리 유틸
    - 함수: `standardizeError()`, `getErrorMessage()`, `isRetryableError()`,
      `isFatalError()`, `serializeError()`
    - 헬퍼: `withRetry()`, `withFallback()` (에러 복구 패턴)
    - 팩토리: `ErrorFactory` (network, validation, processing, system 도메인별
      표준화)
    - 책임: 에러를 일관성 있는 StandardError 인터페이스로 정규화, 복구 전략 제공
    - 사용처: 미디어 추출, 토큰 추출, 다운로드 등 로직 계층
    - 정책: 이 유틸리티는 **애플리케이션 로직에서의 에러** 처리 전담
- `src/shared/error/*`: 브라우저 전역 에러 핸들러 (140줄, Phase 196)
  - **GlobalErrorHandler** (버전 2.1.0): 전역 윈도우 에러 핸들러
    - 책임: 예상치 못한 런타임 에러와 프로미스 거부 캡처
    - 기능: 에러 표준화, 토스트 알림, 디버그 로깅 (개발 모드)
- `src/shared/logging/*`: 중앙화된 로깅 시스템 (Infrastructure 계층)
  - **목적**: 일관된 로깅 인터페이스, 환경별 최적화, 상관관계 추적
  - **파일 구조** (2파일):
    - `logger.ts` (주요 구현, ~290줄):
      - **타입**: `LogLevel` (debug/info/warn/error), `LoggableData`, `Logger`
        인터페이스
      - **상수**: `LOG_LEVELS`, `LOG_LEVEL_PRIORITY`, `BASE_PREFIX` ('[XEG]')
      - **팩토리 함수**:
        - `createLogger(config?)`: 설정 가능한 로거 생성
        - `createScopedLogger(scope, config?)`: 범위별 로거 (prefix에 scope
          추가)
        - `createScopedLoggerWithCorrelation(scope, cid, config?)`: 상관관계 ID
          포함
      - **API**:
        - `logger`: 전역 기본 인스턴스 (자동 구성: dev=debug, prod=warn)
        - `createCorrelationId()`: 고유 상관관계 ID 생성 (crypto 기반, fallback
          포함)
        - `measurePerformance<T>(label, fn)`: 성능 측정 유틸 (dev 모드만)
        - `logError(error, context, source)`: 구조화된 에러 로깅
      - **동작**:
        - **개발 모드** (**DEV**=true): 상세 로깅 (타임스탬프, 스택 트레이스,
          타이머)
        - **프로덕션** (**DEV**=false): 최소 로깅 (warn 이상만, prefix만)
        - tree-shaking: debug 코드는 프로덕션 빌드에서 완전히 제거됨
    - `index.ts` (배럴 export):
      - 공개 API: logger, createLogger, createScopedLogger, createCorrelationId,
        measurePerformance, logError + 타입
  - **사용 패턴**:

    ```typescript
    // ✅ 기본 사용
    import { logger } from '@shared/logging';
    logger.info('User action:', { userId: 123 });
    logger.error('Failed to download', { code: 500 });

    // ✅ 범위별 로거
    import { createScopedLogger } from '@shared/logging';
    const slog = createScopedLogger('MediaExtractor');
    slog.debug('Extracting media...');

    // ✅ 상관관계 ID로 요청 추적
    import {
      createScopedLoggerWithCorrelation,
      createCorrelationId,
    } from '@shared/logging';
    const cid = createCorrelationId();
    const slog = createScopedLoggerWithCorrelation('BulkDownload', cid);
    slog.info('Starting bulk download');

    // ✅ 성능 측정
    import { measurePerformance } from '@shared/logging';
    const data = await measurePerformance('extract-media', async () => {
      return await extractMediaData();
    });

    // ✅ 구조화된 에러 로깅
    import { logError } from '@shared/logging';
    try {
      await downloadFile();
    } catch (error) {
      logError(error, { fileId: '123', retryCount: 2 }, 'Downloader');
    }
    ```

  - **특징**:
    - **모드 최적화**: 개발/프로덕션 모드 자동 분기 (**DEV** 플래그)
    - **Tree-shaking**: debug 함수는 프로덕션에서 완전 제거 (noop로 변경)
    - **상관관계 추적**: cid로 여러 서비스 간 로그 연결 (BulkDownload 등에서
      사용)
    - **타이머**: 시간 측정 자동화 (micro-benchmark 용이)
    - **에러 표준화**: Error 객체와 문자열 모두 지원, 자동 스택 트레이스 포함
  - **정책**:
    - 모든 로거는 @shared/logging 도 축약으로 import (직접 경로 금지)
    - 타입과 API: logger.ts에서 일원화 (분리 불필요)
    - 프로덕션 빌드는 자동으로 debug 호출 제거 (성능 영향 0)
    - 메서드: `initialize()` (uncaught error/unhandled rejection 리스너 등록),
      `destroy()` (리스너 제거)
    - 책임: 사용자가 처리하지 않은 예외와 거부된 Promise를 브라우저 레벨에서
      인터셉트
    - 사용처: main.ts에서 앱 생명주기 시작/종료 시 호출
    - 정책: **전역 브라우저 이벤트만 처리**, 애플리케이션 로직 에러는 Result
      타입 기반으로 처리
  - **AppErrorHandler** (`@deprecated`): GlobalErrorHandler 호환성 래퍼
    - 역할: 기존 코드 호환성 유지
    - 권장: 신규 코드는 GlobalErrorHandler 직접 사용
  - 배럴 export: `src/shared/error/index.ts` (명시적 export)

- `src/shared/external/*`: 외부 라이브러리 어댑터 계층 (Phase 200 최적화)
  - **목적**: 외부 의존성(Solid.js, Userscript GM_API, fflate 등)을 캡슐화하고
    getter 패턴으로 제공
  - **구조**:
    - `vendors/`: Solid.js 및 기타 라이브러리 어댑터 (TDZ-safe 정적 API)
      - `index.ts`: 공개 API 진입점 - getSolid(), getSolidStore() getter 및 타입
        내보내기
      - `vendor-api-safe.ts` (245줄): TDZ 안전 wrapper, 초기화 로직, 정리 기능
      - `vendor-manager-static.ts` (500+줄): 정적 싱글톤 매니저, 캐싱, 검증
      - `vendor-types.ts` (50줄): 타입 정의 (SolidAPI, SolidStoreAPI,
        NativeDownloadAPI 등)
      - 패턴: 모든 vendor는 static import 기반, TDZ 회피 보장
    - `userscript/adapter.ts` (325줄): Userscript API (GM\_\*) 어댑터
      - 함수: `getUserscript()` getter - 외부 Userscript 의존성 캡슐화
      - 기능: download, xhr (XMLHttpRequest), storage (setValue/getValue),
        스크립트 info
      - Fallback: GM_API 미지원 환경(Node/Vitest)에서 localStorage/fetch 기반
        fallback 제공
      - 특징: 비브라우저 환경 안전성, 에러 처리 강화
    - `zip/`: ZIP 생성 유틸리티
      - `zip-creator.ts` (79줄): 메모리 파일 맵으로부터 ZIP Uint8Array 생성
      - `store-zip-writer.ts`: STORE method (압축 미적용) 구현, 의존성 없음
      - `index.ts`: 공개 API (createZipBytesFromFileMap)
  - **사용 패턴** (getter 반드시 사용):

    ```typescript
    // ✅ 권장: getter 경유
    import { getSolid, getUserscript } from '@shared/external/vendors';
    const { createSignal } = getSolid();
    const us = getUserscript();

    // ❌ 금지: 직접 import
    import solid from 'solid-js'; // ❌
    const GM_info = window.GM_info; // ❌
    ```

  - **타입 외보내기**:
    - `JSXElement`, `SolidAPI`, `SolidStoreAPI`, `NativeDownloadAPI` 등은 공개
      타입
    - 내부 구현 타입(예: 'Safe' suffix)은 비공개
  - **정책**: 외부 라이브러리 버전 업그레이드/변경은 이 계층에서만 처리

## 🎨 스타일 계층 구조

프로젝트의 스타일 시스템은 **3계층 CSS 토큰 체계 (Primitive → Semantic →
Component)** 를 따릅니다.

### 디렉터리 구조

```
src/
├─ shared/styles/              # 전역 스타일 및 토큰 SSOT
│  ├─ base/reset.css           # 브라우저 리셋 (design token fallback 포함)
│  ├─ tokens/
│  │  └─ animation.css        # 지속 시간/이징/지연 토큰 확장
│  ├─ utilities/
│  │  ├─ animations.css       # 전역 애니메이션 유틸리티
│  │  └─ layout.css           # 정렬/간격/접근성 유틸리티
│  ├─ design-tokens.css       # 3계층 토큰 통합 진입점
│  ├─ design-tokens.primitive.css
│  ├─ design-tokens.semantic.css
│  ├─ design-tokens.component.css
│  ├─ isolated-gallery.css     # 갤러리 격리 스타일
│  ├─ modern-features.css      # OKLCH, Grid Subgrid 등
│  ├─ tokens.ts               # JS 토큰 (IDE 지원용)
│  ├─ theme-utils.ts          # CSS 변수 헬퍼
│  └─ index.ts                # Export 중앙화
├─ styles/
│  └─ globals.ts               # 임포트 진입점 & 오케스트레이션
└─ features/gallery/styles/   # 갤러리 컴포넌트 스타일
  ├─ gallery-global.css
  └─ Gallery.module.css
```

### 계층별 역할

**1. Primitive (기본 토큰)**

- CSS 변수 정의: `--color-*`, `--space-*`, `--radius-*`
- 색상은 oklch, 크기는 rem/em만 사용
- 파일: `design-tokens.primitive.css`

**2. Semantic (의미 토큰)**

- 역할 기반 이름: `--xeg-color-primary`, `--xeg-spacing-md`
- Primitive 토큰에 대한 래퍼
- 테마/모드별 변경 가능 (light/dark)
- 파일: `design-tokens.semantic.css`

**3. Component (컴포넌트 토큰)**

- 컴포넌트 특화: `--button-bg`, `--modal-padding`
- Semantic 토큰 참조
- 파일: `design-tokens.component.css` + 컴포넌트 내부

### SSOT (Single Source of Truth)

**CSS 변수가 최고 권한입니다:**

- 모든 토큰은 CSS 변수로 정의 (`--xeg-*`, `--space-*`)
- JS 토큰(`tokens.ts`)은 IDE 자동완성/타입 체크용 보조 역할
- **반드시 동기화 필수**: CSS 변수와 JS 토큰 값 일치

### 임포트 순서 (src/styles/globals.ts)

```typescript
// 1. 3계층 토큰 (SSOT)
import '@shared/styles/design-tokens.css';

// 2. 애니메이션 토큰 확장
import '@shared/styles/tokens/animation.css';

// 3. 전역 기본 스타일
import '@shared/styles/base/reset.css';

// 4. 유틸리티 클래스
import '@shared/styles/utilities/layout.css';
import '@shared/styles/utilities/animations.css';

// 5. 모던 CSS 기능
import '@shared/styles/modern-features.css';

// 6. 격리된 갤러리 스타일
import '@shared/styles/isolated-gallery.css';
```

이 순서는 **우선순위 (Cascade)** 를 결정합니다: 나중에 로드된 스타일이 우선.

### 사용 원칙

| 시나리오     | 사용처                                            |
| ------------ | ------------------------------------------------- |
| 새 토큰 추가 | `design-tokens.primitive.css` 또는 `semantic.css` |
| 색상 변경    | Primitive 또는 Semantic 레벨 (한 곳만 수정)       |
| 테마 전환    | Semantic 토큰 미디어 쿼리 사용                    |
| JS에서 접근  | `tokens.ts` 헬퍼 또는 `theme-utils.ts`            |

### 참고

- **상세 가이드**: `src/shared/styles/README.md`
- **코딩 규칙**: `docs/CODING_GUIDELINES.md` "디자인 토큰 체계" 섹션
- **추가 정보**: `docs/CODING_GUIDELINES.md` "📂 스타일 파일 구조" 섹션
- `src/assets/*`: 정적 자원 (아이콘, 이미지 등) 저장소
- `src/shared/styles/*`: 통합 토큰/전역 CSS (design-tokens.\*.css,
  base/reset.css, tokens/animation.css, utilities/animations.css 등)
- 임포트 진입점: `src/styles/globals.ts`
- `types/`: 전역 빌드 환경 변수 (env.d.ts) — 상세: `types/README.md`

## 컴포넌트/서비스 경계 원칙

- **UI는 가능한 얇게**: wiring+presentational 분리, 상태는 shared/state 신호로
  이동
- **서비스는 테스트 친화**: 외부 의존은 adapter getter로 주입 가능해야 함
- **이벤트는 PC 전용**: 세부 사항은 `docs/CODING_GUIDELINES.md` 참조

## 타입 관리 정책

프로젝트의 TypeScript 타입은 다음과 같이 분리됩니다:

### 타입 정의 위치

| 위치                       | 용도                        | 예시                         |
| -------------------------- | --------------------------- | ---------------------------- |
| **types/env.d.ts**         | 빌드 환경 전역 변수         | `__DEV__`, `__VERSION__`     |
| **src/shared/types/**      | 도메인 비즈니스 타입        | app.types.ts, media.types.ts |
| **src/shared/types/core/** | 핵심 로직 타입              | extraction.types.ts          |
| **src/features/\*/types**  | Features 특화 타입 (필요시) | settings.types.ts            |

### 타입 정의 원칙

- **공유 타입 → src/shared/types/**: 여러 모듈에서 사용하는 도메인 타입
- **전역 환경 → types/env.d.ts**: 빌드 타임 상수 (Vite define 플러그인)
- **Features 특화 타입 → src/features/\*/types/**: Feature 내부 도메인 타입 (예:
  AppSettings)
- **명시적 export**: 배럴 export 최소화, 명확한 타입 이름과 책임
- **타입-값 분리**: 타입 파일에서는 순수 타입만 정의, 상수값은 @/constants에서
  import

#### Settings 타입 정책 (Phase 193)

**settings.types.ts**:

- 역할: AppSettings, GallerySettings 등 Settings 도메인 타입 정의만
- 타입-값 분리: DEFAULT_SETTINGS 재익스포트 제거 ✅
- 기본값 사용: `import { DEFAULT_SETTINGS } from '@/constants'` (필요한 곳에서)

**서비스 import**:

- settings-service.ts, settings-migration.ts, settings-schema.ts
  - Phase 193: `DEFAULT_SETTINGS`를 `@/constants`에서 직접 import

### 참고

자세한 타입 정의 가이드와 예제: `docs/CODING_GUIDELINES.md`의 "📝 타입 정의"
섹션

## 디자인 토큰

프로젝트는 3계층 디자인 토큰 시스템을 사용합니다 (Primitive → Semantic →
Component). **상세 규칙**: `docs/CODING_GUIDELINES.md`의 "디자인 토큰 체계" 섹션
참조

## 테스트 전략 개요

**레이어**:

- **Static Analysis**: TypeScript, ESLint, stylelint, CodeQL
- **Unit Tests**: Vitest + JSDOM (순수 함수, 서비스 로직)
- **Browser Tests**: Vitest + Chromium (Solid.js 반응성, 실제 DOM)
- **E2E Tests**: Playwright (사용자 시나리오, 하네스 패턴)
- **Guards**: test/guards/project-health.test.ts (현재 상태 검증)

**원칙**:

- **Vitest + JSDOM**, 기본 URL <https://x.com>
- **외부 의존은 getter를 통해 모킹** 가능해야 함
- **TDD 원칙**: 실패 테스트 → 최소 구현 → 리팩토링(RED→GREEN→REFACTOR)
- **커버리지**: 단위/통합/E2E(Playwright)/접근성(axe-core) 포함

**아카이브 정책**:

- 완료된 Phase 및 비효율적 패턴의 테스트는 `test/archive/`로 이동
- CI/로컬 테스트에서 제외, 참고용 보관
- 상세: `test/archive/README.md` / `docs/TESTING_STRATEGY.md`

## 의존성 정책과 가드(개요)

- direct vendor import 금지, 순환 의존 금지, 내부 배럴 역참조 금지
- 모든 정책은 **dependency-cruiser**와 정적 테스트로 강제됩니다.
- 상세 정책은 `docs/DEPENDENCY-GOVERNANCE.md`를 참고하세요.

---

## 타입/인터페이스 계층 정책 (Phase 196-201)

### 타입 계층 구조 (Phase 196 최신화)

```
External (어댑터 타입, 의존성 제거)
    ↑
Shared (공유 도메인 타입)
    ├─ @shared/types/ (외부 공유)
    ├─ @shared/interfaces/ (Features 계약)
    └─ @shared/types/core/ (핵심 기초 타입)
    ↑
Features (기능 특화 타입)
    └─ @features/{name}/types/ (기능 고유 타입)
```

### 계층별 역할 명확화 (Phase 196 갱신)

| 계층           | 위치                      | 역할                                | 예시                                             |
| -------------- | ------------------------- | ----------------------------------- | ------------------------------------------------ |
| **External**   | `src/shared/external/`    | 벤더/외부 어댑터 타입 (의존성 역전) | Solid JSXElement                                 |
| **Shared**     | `src/shared/types/`       | 앱 전역 도메인 타입 (8개 파일)      | MediaItem, AppConfig, GalleryState, UITheme      |
| **Core Types** | `src/shared/types/core/`  | 기초 인터페이스 (추상화 객체)       | BaseService, Cleanupable, Result pattern         |
| **Interfaces** | `src/shared/interfaces/`  | Features 계약 정의                  | GalleryRenderer                                  |
| **Feature**    | `@features/{name}/types/` | 기능 고유 타입 (Phase 196 신규)     | ToolbarState, ToolbarActions (gallery/types/)    |
| **Services**   | `src/shared/services/`    | 계약 구현                           | MediaExtractionService implements MediaExtractor |

### Best Practices

✅ **권장 패턴**:

```typescript
// 1. 명확한 계약이 있는 경우 (media.types.ts)
export interface MediaExtractor {
  extractFromClickedElement(...): Promise<MediaExtractionResult>;
  extractAllFromContainer(...): Promise<MediaExtractionResult>;
}

// 구현체 (media-extraction-service.ts)
export class MediaExtractionService implements MediaExtractor { }
```

```typescript
// 2. 단순 유틸리티의 경우 (filename-service.ts)
export class FilenameService {
  generateFilename(...): string { }
}
```

❌ **피해야 할 패턴**:

```typescript
// 1. 불명확한 레거시 타입 (core-types.ts 제거 대상)
export interface MediaExtractionServiceType extends BaseService {
  extractMediaFromElement?(element: Element): Promise<unknown>; // unknown ❌
  getInstance?(): MediaExtractionServiceType; // 싱글톤 관례 ❌
}

// 2. types 정의가 services에만 있는 경우
// services/my-service.ts
export interface MyInterface {} // 검색 어려움 ❌
```

### 타입 검색 가이드

타입이 필요할 때:

1. **Features 계약**: `@shared/interfaces/` 확인
2. **비즈니스 타입**: `@shared/types/` 확인 (media.types, app.types 등)
3. **서비스 계약**: `@shared/types/media.types` 확인

---

**문서 역할 분리**: 이 파일은 구조/경계/지도에 집중합니다. 세부 코딩 규칙,
디자인 토큰, 테스트 정책은 `CODING_GUIDELINES.md`와 `TESTING_STRATEGY.md`로
분리되어 있습니다.
