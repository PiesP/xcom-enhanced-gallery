# 🏗️ 아키텍처 개요 (xcom-enhanced-gallery)

> Solid.js 기반 Userscript의 3계층 구조와 의존성 경계 최종 업데이트: 2025-10-26
> 코딩 규칙/스타일/토큰/테스트 정책은 `docs/CODING_GUIDELINES.md`를 단일
> 기준으로 참조하세요.

이 문서는 코드 작성 가이드(CODING_GUIDELINES)와 별개로, 상위 수준의 시스템
구조와 계층 간 경계를 설명합니다. 구현 규칙/토큰/스타일은
`docs/CODING_GUIDELINES.md`를 참고하세요.

## 프로젝트 현황 (2025-10-26)

- **빌드**: prod 339.55 KB / 420 KB (80.45 KB 여유) ✅
- **테스트**: Browser 111, E2E 60/61(1 skipped), a11y 34, 단위 전체 GREEN ✅
- **아키텍처**: 3계층 구조, 0 dependency violations ✅
- **번들러**: Vite 7 + Solid.js 1.9.9 + TypeScript strict
- **최근 개선**: Phase 191 Gallery 레이어 개선 완료 (GalleryApp 371→264줄,
  GalleryRenderer 295→178줄)

## 계층 구조와 단방향 의존

- **Features** → **Shared**(services/state/utils/logging) →
  **External**(adapter/vendors)
- 단방향 의존만 허용: Features는 Shared까지만, Shared는 External까지만
  접근합니다.
- Vendors/Userscript는 반드시 안전 getter 경유:
  - Vendors: `@shared/external/vendors`의 `getSolid()`/`getSolidStore()`
  - Userscript: `@shared/external/userscript/adapter`의 `getUserscript()`

## 디렉터리 지도(요약)

- `src/features/*`: UI/도메인 기능, 신호 구독과 사용자 인터랙션 처리
  - `gallery/`: 갤러리 UI 시스템 - 렌더러 + 조율기 + 컴포넌트 아키텍처
    - **GalleryApp** (264줄): 갤러리 앱 조율기 - 초기화, 이벤트 연결, 생명주기
      관리
      - 책임: 초기화 오케스트레이션, 이벤트 핸들러 등록, 미디어 서비스 지연
        초기화
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
- `src/bootstrap/*`: 애플리케이션 초기화 (동적 임포트, 트리셰이킹 최적화)
  - `environment.ts`: Vendor 라이브러리 초기화
  - `events.ts`: 전역 이벤트 (beforeunload/pagehide) 핸들러
  - `features.ts`: Features 레이어 서비스 지연 등록
  - `initialize-theme.ts`: 테마 초기화 (시스템/localStorage/DOM)
- `src/shared/services/*`: 순수 로직 API
  - 미디어: `MediaService`, `BulkDownloadService`, `media-extraction/`,
    `media-mapping/`
  - UX: `UnifiedToastManager`, `ThemeService`, `AnimationService`
  - 토큰: `token-extraction/` (Phase 192: TwitterTokenExtractor 이동)
    - **TwitterTokenExtractor** (520줄): Twitter Bearer 토큰 추출 유틸리티
      - 책임: 네트워크/스크립트/설정에서 토큰 추출, 유효성 검증
      - Phase 192: features/settings/services → shared/services로 이동 (공유
        유틸)
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
- `src/shared/state/*`: Signals 상태 및 파생값(`signalSelector`)
- `src/shared/types/*`: 도메인 비즈니스 타입 정의 (**.types.ts 패턴**)
  - `app.types.ts`, `media.types.ts`, `result.types.ts`
  - `core/`: 핵심 타입 (extraction.types.ts, media.types.ts)
- `src/shared/utils/*`: 순수 유틸리티, DOM 헬퍼(서비스 직접 참조 금지)
- `src/shared/external/*`: 벤더/Userscript 어댑터, ZIP 생성기 등 외부 연동
- `src/assets/*`: 정적 자원, CSS Modules, 디자인 토큰(3계층)
  - `styles/`
    - `base/`: 리셋 (reset.css)
    - `tokens/`: 디자인 토큰 (animation-tokens.css — duration/easing/delay)
    - `utilities/`: 유틸 클래스 (animations.css, layout.css)
  - 임포트 진입점: `src/styles/globals.ts`
- `src/shared/styles/*`: 통합 토큰 및 글래스모피즘 (design-tokens.\*.css,
  modern-features.css 등)
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

**문서 역할 분리**: 이 파일은 구조/경계/지도에 집중합니다. 세부 코딩 규칙,
디자인 토큰, 테스트 정책은 `CODING_GUIDELINES.md`와 `TESTING_STRATEGY.md`로
분리되어 있습니다.
