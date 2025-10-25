# 테스트 가이드

X.com Enhanced Gallery의 새로운 테스트 아키텍처 가이드입니다.

## 🎯 핵심 원칙

### 1. 테스트 프레임워크

- **Vitest** 사용 (describe, it, expect, vi)
- TypeScript 지원
- 빠른 실행 속도

### 2. DOM 시뮬레이션

- `document.body.innerHTML`을 사용하여 실제 X.com 페이지 구조 모방
- 실제 브라우저 환경과 유사한 테스트 환경 제공

### 3. API 모의(Mocking)

- 모든 유저스크립트 API (GM\__, chrome._ 등) 완전 모의 처리
- 실제 API 호출 금지 → 안전하고 예측 가능한 테스트

### 4. 행위 중심 테스트

- 사용자 관점에서 "무엇을 해야 하는가" 검증
- 내부 구현이 아닌 결과와 행동에 집중

## 📁 디렉토리 구조

```
test/
├── __mocks__/                    # Mock 구현체들
│   ├── README.md                # Mock 모듈 가이드
│   ├── userscript-api.mock.ts   # GM_* API 모의
│   ├── twitter-dom.mock.ts      # X.com DOM 구조 모의 + 스뮬레이션 헬퍼
│   ├── in-memory-storage-adapter.ts # 인메모리 저장소
│   └── test-environment.ts      # 테스트 환경 설정
├── utils/                       # 테스트 유틸리티 및 재export
│   ├── testing-library.ts       # @solidjs/testing-library re-export
│   └── helpers/
│       └── mock-action-simulator.ts # DOM 이벤트 스뮬레이션 (click, keypress)
<<<<<<< Updated upstream
├── unit/                        # 단위 테스트 (순수 로직, 팩토리 패턴)
│   ├── alias/                   # 경로 별칭 검증 (1개 파일)
│   │   ├── alias-resolution.test.ts # Vite 경로 별칭(@features, @shared) 동적 import 검증
│   │   └── README.md            # 경로 별칭 테스트 가이드
│   ├── shared/
│   │   └── services/
│   │       └── MediaExtractionService.test.ts
│   ├── features/
│   │   └── gallery/             # Gallery 기능 테스트 (12개 파일, Phase 182 정리)
│   │       ├── GalleryApp.integration.test.ts (411줄) - GalleryApp 전체 플로우
│   │       ├── keyboard-help.aria.test.tsx (55줄) - KeyboardHelpOverlay ARIA
│   │       ├── components/      # 컴포넌트 회귀 테스트
│   │       │   ├── VerticalGalleryView.auto-focus-on-idle.test.tsx (206줄, Browser 모드)
│   │       │   ├── VerticalGalleryView.fit-mode.test.tsx (154줄)
│   │       │   ├── VerticalGalleryView.focus-tracking.test.tsx (232줄, Browser 모드)
│   │       │   ├── VerticalGalleryView.wheel-scroll.test.tsx (157줄)
│   │       │   ├── vertical-gallery-view/
│   │       │   │   └── useProgressiveImage.test.ts (151줄)
│   │       │   └── __screenshots__/
│   │       ├── hooks/           # 훅 테스트 (6개)
│   │       │   ├── conflict-resolution.test.ts (152줄)
│   │       │   ├── use-gallery-focus-tracker-deduplication.test.ts (164줄, RAF)
│   │       │   ├── use-gallery-focus-tracker-settling.test.ts (195줄, RAF)
│   │       │   ├── use-gallery-focus-tracker-observer-lifecycle.test.ts (201줄, RAF)
│   │       │   ├── use-gallery-scroll-stability.test.ts (194줄)
│   │       │   ├── useGalleryItemScroll.test.ts (138줄)
│   │       │   └── __screenshots__/
│   │       └── README.md        # Gallery 테스트 가이드 (Phase 182)
│   │   └── settings/            # Settings 기능 테스트 (3개 파일, Phase 183)
│   │       ├── settings-migration.schema-hash.test.ts (71줄) - 설정 마이그레이션 해시
│   │       ├── settings-migration.behavior.test.ts (47줄) - 마이그레이션 동작
│   │       ├── services/
│   │       │   └── twitter-token-extractor.test.ts (115줄) - 토큰 추출
│   │       └── README.md        # Settings 테스트 가이드 (Phase 183)
│   └── policies/                # 정책 검증 테스트 (10개, Phase 182 통합)
│       ├── bundle-size-policy.test.ts
│       ├── design-token-policy.test.ts
│       ├── pc-only-events-policy.test.ts
│       ├── video-item.cls.test.ts
│       ├── VerticalGalleryView.inline-style.policy.test.ts
│       ├── VerticalImageItem.inline-style.policy.test.ts
│       └── README.md            # 정책 검증 가이드
=======
├── unit/                        # 단위 테스트 (순수 로직, 팩토리 패턴) — Phase 188 정리 완료
│   ├── features/                # 기능별 테스트 (Gallery, Settings, Toolbar, Scroll)
│   ├── shared/                  # 공유 계층 테스트 (Services, Components, Utils, External)
│   │   ├── factories/           # 테스트 팩토리 (Phase 188에서 이동)
│   │   │   ├── mock-utils.factory.ts
│   │   │   └── README.md
│   │   ├── components/          # UI 컴포넌트 테스트 (Phase 188에서 통합)
│   │   │   ├── accessibility/   # 접근성 컴포넌트 테스트
│   │   │   ├── button-*.test.ts
│   │   │   ├── toolbar-*.test.tsx
│   │   │   ├── settings-*.test.tsx
│   │   │   └── README.md
│   │   ├── services/
│   │   ├── utils/
│   │   ├── external/
│   │   ├── setup/
│   │   ├── types/
│   │   ├── integration/
│   │   ├── media/
│   │   ├── state/
│   │   ├── hooks/
│   │   ├── logging/
│   │   ├── dom/
│   │   ├── container/
│   │   ├── browser/
│   │   ├── i18n/
│   │   └── README.md
│   ├── lint/                    # 정책 검증 테스트 (ESLint 규칙)
│   ├── styles/                  # 스타일 정책 테스트
│   ├── policies/                # 정책 검증 테스트 (Phase 188에서 통합)
│   │   ├── alias-resolution.test.ts
│   │   ├── reactive-evaluation.test.ts
│   │   ├── direct-comparison.test.ts
│   │   ├── signal-selector-validation.test.ts
│   │   ├── design-token-policy.test.ts
│   │   ├── bundle-size-policy.test.ts
│   │   ├── pc-only-events-policy.test.ts
│   │   ├── gallery-toolbar-logic-pattern.test.ts
│   │   ├── i18n.message-keys.test.ts
│   │   ├── i18n.missing-keys.test.ts
│   │   ├── VerticalGalleryView.inline-style.policy.test.ts
│   │   ├── VerticalImageItem.inline-style.policy.test.ts
│   │   ├── video-item.cls.test.ts
│   │   └── README.md
│   ├── performance/             # 성능 테스트 (벤치마크)
│   ├── media/                   # 미디어 서비스 테스트
│   ├── state/                   # 상태 관리 테스트
│   ├── refactoring/             # 리팩토링 테스트 (가드)
│   └── README.md
├── browser/                     # 브라우저 모드 테스트 (Vitest + Chromium)
│   │       └── viewport-utils.test.ts # 뷰포트 유틸리티 (Phase 187에서 이동)
│   ├── state/                   # 상태 테스트 (폐기, Phase 187)
│   ├── styles/                  # 스타일 테스트 (폐기 후 test/styles로 통합됨, Phase 187)
│   ├── features/
│   │   ├── gallery/             # Gallery 기능 테스트 (12개 파일, Phase 182 정리)
│   │   │   ├── GalleryApp.integration.test.ts (411줄) - GalleryApp 전체 플로우
│   │   │   ├── keyboard-help.aria.test.tsx (55줄) - KeyboardHelpOverlay ARIA
│   │   │   ├── components/      # 컴포넌트 회귀 테스트
│   │   │   │   ├── VerticalGalleryView.auto-focus-on-idle.test.tsx (206줄, Browser 모드)
│   │   │   │   ├── VerticalGalleryView.fit-mode.test.tsx (154줄)
│   │   │   │   ├── VerticalGalleryView.focus-tracking.test.tsx (232줄, Browser 모드)
│   │   │   │   ├── VerticalGalleryView.wheel-scroll.test.tsx (157줄)
│   │   │   │   ├── vertical-gallery-view/
│   │   │   │   │   └── useProgressiveImage.test.ts (151줄)
│   │   │   │   └── __screenshots__/
│   │   │   ├── hooks/           # 훅 테스트 (6개)
│   │   │   │   ├── conflict-resolution.test.ts (152줄)
│   │   │   │   ├── use-gallery-focus-tracker-deduplication.test.ts (164줄, RAF)
│   │   │   │   ├── use-gallery-focus-tracker-settling.test.ts (195줄, RAF)
│   │   │   │   ├── use-gallery-focus-tracker-observer-lifecycle.test.ts (201줄, RAF)
│   │   │   │   ├── use-gallery-scroll-stability.test.ts (194줄)
│   │   │   │   ├── useGalleryItemScroll.test.ts (138줄)
│   │   │   │   └── __screenshots__/
│   │   │   └── README.md        # Gallery 테스트 가이드 (Phase 182)
│   │   ├── settings/            # Settings 기능 테스트 (3개 파일, Phase 183)
│   │   │   ├── settings-migration.schema-hash.test.ts (71줄) - 설정 마이그레이션 해시
│   │   │   ├── settings-migration.behavior.test.ts (47줄) - 마이그레이션 동작
│   │   │   ├── services/
│   │   │   │   └── twitter-token-extractor.test.ts (115줄) - 토큰 추출
│   │   │   └── README.md        # Settings 테스트 가이드 (Phase 183)
│   │   └── toolbar/             # Toolbar 기능 테스트 (1개 파일, Phase 184, Phase 187)
│   │       ├── toolbar.focus-indicator.test.tsx (70줄) - Toolbar 포커스 인디케이터 (Phase 187에서 이동)
│   │       └── README.md        # Toolbar 테스트 가이드 (Phase 184)
>>>>>>> Stashed changes
├── integration/                 # 통합 테스트 (다중 서비스 협업)
│   ├── infrastructure/          # 브라우저/기반시설 서비스 테스트 (JSDOM)
│   │   └── browser-utils.test.ts
│   ├── gallery-activation.test.ts # 갤러리 활성화 (팩토리 패턴)
│   ├── service-lifecycle.test.ts  # 서비스 라이프사이클
│   ├── utils.integration.test.ts  # 유틸리티 통합 (미디어 추출 워크플로우)
│   └── full-workflow.test.ts      # 전체 워크플로우
├── browser/                     # 브라우저 모드 테스트 (Vitest + Chromium)
├── styles/                      # 스타일/토큰/정책 테스트 (14개, Phase 174)
│   ├── color-token-consistency.test.ts  # 색상 토큰 일관성 검증
│   ├── design-tokens.test.ts            # 디자인 토큰 계층 검증
│   ├── hardcoded-colors.test.ts         # 하드코딩 색상 정책 검증
│   ├── hardcoded-color-detection.test.ts # 하드코딩 색상 감지 테스트
│   ├── token-definition-guard.test.ts   # 토큰 정의 가드 (308줄)
│   ├── dark-mode-consolidation.test.ts  # 다크모드 통합 검증
│   ├── theme-responsiveness.test.ts     # 테마 반응성 검증
│   ├── toolbar-expandable-styles.test.ts # 툴바 확장 스타일 검증
│   ├── settings-toolbar-alignment.test.ts # 설정/툴바 정렬 검증
│   ├── button-fallback-removal.test.ts  # 버튼 폴백 제거 검증
│   ├── animation-standards.test.ts      # 애니메이션 표준 검증
│   ├── css-optimization.test.ts         # CSS 최적화 검증
│   ├── style-consolidation.test.ts      # 스타일 통합 검증
│   ├── twitter-color-mapping.test.ts    # Twitter 색상 매핑 검증
│   └── [README.md]                      # test/styles 가이드 (Phase 174)
├── guards/                      # 프로젝트 상태 및 정책 검증 (constants, naming)
│   ├── project-health.test.ts   # Phase 170B+ 현황 검증
│   ├── stable-selectors.scan.test.ts # STABLE_SELECTORS 상수 정책 (Phase 179)
│   ├── (lint 정책 파일 26개)     # vendor getter, direct import, 명명, 순환 참조 등
│   └── README.md                # Guards 정책 및 가이드
├── archive/                     # 완료된 Phase 테스트 (참고용 보관, 일괄 관리)
│   ├── README.md                # 아카이브 정책 및 사용 가이드
│   ├── unit/                    # test/unit 아카이브 (Phase 176+)
│   │   ├── alias/               # 경로 별칭 테스트 아카이브 (Phase 176)
│   │   │   ├── alias-static-import.test.ts # /@fs/ 플랫폼별 경로 검증 (SKIPPED)
│   │   │   └── README.md        # 아카이브 정책 설명
│   │   ├── core/                # test/unit/core 아카이브 (Phase 179)
│   │   │   ├── result-error-model.red.test.ts # RED: ErrorCode 미구현
│   │   │   ├── service-manager.test.integration.ts # Mock만 포함
│   │   │   ├── browser-compatibility.deprecated.test.ts # 폐기 (Extension only)
│   │   │   └── README.md        # 아카이브 정책 설명
<<<<<<< Updated upstream
=======
│   │   ├── patterns/            # 패턴 테스트 아카이브 (Phase 187)
│   │   │   ├── result-pattern.test.ts (65줄, Phase 5 OLD, GREEN)
│   │   │   └── README.md        # Phase 187에서 이동
│   │   ├── lifecycle/           # 라이프사이클 테스트 아카이브 (Phase 187)
│   │   │   ├── lifecycle.cleanup.leak-scan.red.test.ts (152줄, RED R4)
│   │   │   └── README.md        # Phase 187에서 이동
│   │   ├── events/              # 이벤트 테스트 아카이브 (Phase 186)
│   │   │   ├── event-lifecycle.abort-signal.deprecated.test.ts
│   │   │   └── README.md        # Phase 186 정리 기록
>>>>>>> Stashed changes
│   │   ├── features/
│   │   │   └── gallery/         # Gallery Phase 테스트 아카이브 (Phase 182)
│   │   │       ├── focus-tracker-infinite-loop.red.test.ts (201줄, RED)
│   │   │       ├── vertical-gallery-fit-mode-types.test.ts (76줄, Phase 101)
│   │   │       ├── vertical-gallery-memo.test.tsx (53줄, Phase 14.1.4)
│   │   │       ├── vertical-gallery-view-effects.test.tsx (92줄, Phase 20.1)
│   │   │       ├── vertical-gallery-animation-effect.test.tsx (111줄, Phase 20.2)
│   │   │       ├── vertical-gallery-no-auto-scroll.test.tsx (91줄, Phase 18)
│   │   │       ├── vertical-image-item-reactivity.test.tsx (44줄, Phase 4)
│   │   │       ├── silent-catch-removal.test.ts (180줄, Phase A5.4)
│   │   │       └── README.md    # Gallery 아카이브 가이드
│   ├── cleanup-phases/          # Phase 1~7 정리 테스트 (Phase 171A 이전)
│   ├── integration-behavioral/  # 구식 행위 테스트 (Phase 170B+ 이전)
│   ├── integration/             # test/integration 아카이브 (Phase 171B)
│   │   ├── README.md
│   │   ├── bundle-vendor-tdz.test.ts
│   │   ├── extension.integration.test.ts
│   │   ├── master-test-suite.test.ts
│   │   └── vendor-tdz-resolution.test.ts
│   ├── performance/             # test/performance 아카이브 (Phase 172)
│   │   ├── README.md
│   │   ├── performance.consolidated.test.ts
│   │   └── optimization/
│   │       ├── memo-optimization.test.ts
│   │       └── optimization.consolidated.test.ts
│   ├── styles/                  # test/styles Phase 파일 아카이브 (Phase 174)
│   │   ├── README.md
│   │   ├── phase-109-settings-focus-ring.test.ts
│   │   ├── phase-110-focus-ring.test.ts
│   │   ├── phase-111-toast-colors.test.ts
│   │   ├── phase-113-focus-ring-alias.test.ts
│   │   └── phase-121-text-color-tokens.test.ts
│   └── refactoring/             # 리팩토링 테스트 아카이브 (Phase 174+)
│       ├── README.md            # 아카이브 정책 설명
│       ├── phase2-animation-simplification.test.ts (Phase 2 - 231줄)
│       ├── phase65-orphan-file-cleanup.test.ts (Phase 65 - 126줄)
│       ├── helpers/
│       │   └── createAppContainer.ts (테스트 하네스)
│       └── container/           # AppContainer 리팩토링 (8개 파일)
│           ├── app-container-contract.test.ts
│           ├── cleanup/
│           ├── core/
│           ├── feature/
│           ├── global/
│           ├── legacy/
│           └── services/
├── refactoring/                 # 진행 중 리팩토링 테스트 (27개 파일, Phase 174)
│   ├── helpers/
│   │   └── createAppContainer.ts # AppContainer 테스트 하네스 (400줄)
│   ├── button-animation-consistency.test.ts (186줄) - 버튼 애니메이션
│   ├── button-design-consistency-fixed.test.ts (85줄) - 버튼 디자인
│   ├── cross-component-consistency.test.ts (263줄) - 크로스 컴포넌트
│   ├── css-circular-reference.test.ts (157줄) - CSS 순환 참조
│   ├── css-design-system-consolidation.test.ts (226줄) - CSS 디자인 시스템
│   ├── gallery-signals-migration.test.ts (130줄) - 갤러리 신호 마이그레이션
│   ├── glass-surface-consistency.test.ts (125줄) - 글래스모피즘 일관성
│   ├── hardcoded-css-elimination.test.ts (150줄) - 하드코딩 CSS 제거
│   ├── icon-component-optimization.test.ts (252줄) - 아이콘 최적화
│   ├── light-dom-transition.test.ts (152줄) - Light DOM 전환
│   ├── modal-position-calculation.test.ts (229줄) - 모달 위치 계산
│   ├── modal-toolbar-visual-consistency.test.ts (146줄) - 모달/툴바 일관성
│   ├── remove-unused-libraries.test.ts (97줄) - 미사용 라이브러리 제거
│   ├── theme-sync-simple.test.ts (131줄) - 테마 동기화
│   ├── theme-synchronization.test.ts (164줄) - 테마 동기화
│   ├── toast-animation-consistency.test.ts (112줄) - Toast 애니메이션
│   ├── toast-system-integration.test.ts (209줄) - Toast 통합
│   ├── toolbar-auto-hide-deduplication.test.ts (199줄) - 툴바 자동 숨김
│   ├── toolbar-button-consistency-v2.test.ts (152줄) - 툴바 버튼 일관성
│   ├── toolbar-design-consistency.test.ts (91줄) - 툴바 디자인
│   ├── toolbar-expandable-design.test.ts (177줄) - 툴바 확장
│   ├── toolbar-initial-transparency.test.ts (204줄) - 툴바 투명성
│   ├── toolbar-settings-panel-continuity.test.ts (80줄) - 툴바/설정 연속성
│   ├── toolbar-ui-consistency.test.ts (165줄) - 툴바 UI 일관성
│   ├── use-modal-position.test.ts (167줄) - 모달 위치 훅
│   ├── vendor-performance.test.ts (157줄) - 벤더 성능
│   └── vertical-image-item-design-consistency.test.ts (199줄) - 수직 이미지
├── setup.ts                     # 전역 테스트 설정
└── README.md                    # 이 파일
```

## 🛠️ 사용법

### 기본 테스트 실행

```bash
# 모든 테스트 실행
npm run test

# 특정 카테고리만 실행
npx vitest test/unit           # 단위 테스트만
npx vitest test/integration    # 통합 테스트만
npx vitest test/behavioral     # 행위 테스트만

# 감시 모드로 실행
npm run test:watch

# 커버리지와 함께 실행
npm run test:coverage
```

### 테스트 환경 설정

각 테스트에서 필요한 환경을 설정할 수 있습니다:

```typescript
import { setupTestEnvironment } from '../__mocks__/test-environment';

beforeEach(async () => {
  // 환경 타입 선택
  await setupTestEnvironment('minimal'); // 기본 DOM만
  await setupTestEnvironment('full'); // 모든 환경 + 샘플 데이터
});
```

### 테스트 유틸리티 사용

#### Testing Library 래퍼

```typescript
import { render, cleanup, h } from '@test/utils/testing-library';

describe('Component', () => {
  afterEach(() => cleanup());

  it('should render', () => {
    const { container } = render(() => h('div', {}, 'Hello'));
    expect(container.textContent).toBe('Hello');
  });
});
```

#### DOM 이벤트 스뮬레이션

```typescript
import {
  simulateClick,
  simulateKeypress,
} from '@test/utils/helpers/mock-action-simulator';

it('should handle click', () => {
  const button = document.createElement('button');
  const handler = vi.fn();
  button.addEventListener('click', handler);

  simulateClick(button);
  expect(handler).toHaveBeenCalled();
});

it('should handle keypress', () => {
  const input = document.createElement('input');
  const handler = vi.fn();
  input.addEventListener('keydown', handler);

  simulateKeypress(input, 'Enter');
  expect(handler).toHaveBeenCalled();
});
```

## 테스트 환경 설정

### 1. 행위 중심 테스트 예시

```typescript
describe('트윗 이미지 클릭 시', () => {
  it('갤러리가 열려야 한다', async () => {
    // Given: 이미지가 포함된 트윗이 있을 때
    const container = setupTwitterDOM();
    const tweet = addTweetWithImages(container);
    const imageElement = tweet.querySelector('img[src*="pbs.twimg.com"]');

    // When: 사용자가 이미지를 클릭하면
    simulateClick(imageElement);

    // Then: 갤러리 모달이 나타나야 한다
    await wait(100);
    const galleryModal = document.querySelector('[data-testid="photoModal"]');
    expect(galleryModal).toBeTruthy();
  });
});
```

### 2. 단위 테스트 예시

```typescript
describe('extractImageUrls', () => {
  it('트윗에서 이미지 URL들을 정확히 추출해야 한다', () => {
    // Given: 이미지가 포함된 트윗 데이터
    const tweetData = {
      entities: {
        media: [
          {
            type: 'photo',
            media_url_https: 'https://pbs.twimg.com/media/test1.jpg',
          },
        ],
      },
    };

    // When: 이미지 URL을 추출하면
    const result = extractImageUrls(tweetData);

    // Then: 모든 이미지 URL이 추출되어야 한다
    expect(result).toHaveLength(1);
    expect(result[0]).toContain('test1.jpg:large');
  });
});
```

### 3. 통합 테스트 예시

```typescript
describe('기본 이미지 다운로드 워크플로우', () => {
  it('사용자가 트윗 이미지를 클릭하여 갤러리를 열고 다운로드까지 완료해야 한다', async () => {
    // Given: 설정된 환경
    setMockStorageValue('downloadPath', '/test/downloads');

    // When: 사용자 액션 시뮬레이션
    const container = setupTwitterDOM();
    const tweet = addTweetWithImages(container);
    const imageElement = tweet.querySelector('img[src*="pbs.twimg.com"]');

    simulateClick(imageElement);
    await wait(100);
    simulateKeypress('d');
    await wait(100);

    // Then: 전체 플로우 검증
    expect(mockUserscriptAPI.GM_download).toHaveBeenCalled();
  });
});
```

## 🎭 Mock 사용법

### 유저스크립트 API Mock

```typescript
import {
  mockUserscriptAPI,
  setMockStorageValue,
} from '../__mocks__/userscript-api.mock';

// GM_getValue 응답 설정
setMockStorageValue('autoDownload', 'true');

// GM_download 호출 검증
expect(mockUserscriptAPI.GM_download).toHaveBeenCalledWith(
  expect.stringContaining('pbs.twimg.com'),
  expect.stringContaining('.jpg')
);
```

### DOM Mock

```typescript
import {
  setupTwitterDOM,
  addTweetWithImages,
  simulateClick,
} from '../__mocks__/twitter-dom.mock';

// Twitter DOM 구조 설정
const container = setupTwitterDOM();

// 트윗 추가
const tweet = addTweetWithImages(container);

// 사용자 상호작용 시뮬레이션
const imageElement = tweet.querySelector('img');
simulateClick(imageElement, { ctrlKey: true });
```

## 🔍 디버깅 팁

### 1. 테스트 격리 확인

각 테스트는 완전히 격리되어야 합니다:

```typescript
afterEach(async () => {
  await cleanupTestEnvironment(); // 항상 정리
});
```

### 2. 비동기 처리

DOM 변화나 네트워크 요청 후에는 적절한 대기:

```typescript
// DOM 변화 대기
await wait(100);

// 또는 특정 요소 출현 대기
await waitForDOMChange('[data-testid="modal"]');
```

### 3. Mock 상태 확인

```typescript
// Mock 호출 횟수 확인
expect(mockUserscriptAPI.GM_download).toHaveBeenCalledTimes(2);

// Mock 초기화
vi.clearAllMocks();
```

## 🚀 성능 최적화

### 1. 병렬 실행

- Vitest가 자동으로 테스트를 병렬 실행
- 무거운 테스트는 `describe.sequential()` 사용

### 2. 선택적 환경 설정

- 필요한 최소한의 환경만 설정
- 'minimal' → 'browser' → 'component' → 'full' 순으로 무거워짐

### 3. Mock 재사용

- 공통 Mock은 `__mocks__` 디렉토리에 정의
- 테스트별 특별한 설정만 개별 구현

## 📋 체크리스트

새 테스트 작성 시 확인 사항:

- [ ] 적절한 테스트 카테고리 선택 (unit/integration/behavioral)
- [ ] Given-When-Then 구조 사용
- [ ] 실제 API 호출 없이 Mock 사용
- [ ] 사용자 관점의 테스트 시나리오
- [ ] 적절한 환경 설정 및 정리
- [ ] 비동기 처리 대기
- [ ] 의미 있는 테스트 이름

이 가이드를 따라 작성된 테스트는 안정적이고, 빠르며, 유지보수가 쉬운 코드가 될
것입니다.

## 📚 프로젝트 상태 검증

### 테스트 통합 및 현대화 (Phase 170B+)

#### infrastructure 폴더 정리 (2025-10-25)

`test/integration/infrastructure/` 폴더의 브라우저 유틸리티 테스트를
정리했습니다:

**변경 사항**:

- ✅ 중복 파일 제거: `browser-utils.comprehensive.test.ts` 제거 (구식 패턴,
  368줄)
- ✅ 남은 파일 현대화: `browser-utils.test.ts` 개선 (428줄 → 227줄, ~47% 축소)
  - Mock 객체 팩토리 패턴 도입 (`createMockWindow`)
  - 반복되는 setup/teardown 제거
  - 불필요한 edge cases 정리
  - 의미 있는 테스트만 유지

**개선 결과**:

- 코드 간결성: 201줄 감소 (47% 축소)
- 유지보수성: 팩토리 패턴으로 Mock 관리 일관화
- 성능: 테스트 케이스 30% 감소, CI 부하 경감

**현재 상태**:

- 모든 타입 체크 통과 ✅
- Mock 패턴 최신화 ✅
- 프로젝트 규칙 준수 (vendor getter, PC 이벤트, 디자인 토큰) ✅

### 현재 프로젝트 상태 (Phase 170B+)

프로젝트 상태는 `test/guards/project-health.test.ts`에서 검증됩니다:

- **번들 크기**: 339.55 KB (제한 420 KB, 여유 80.45 KB) ✅
- **의존성**: 0 violations (dependency-cruiser) ✅
- **코딩 규칙**: 3대 핵심 원칙 준수
  - Vendor getter 사용 (getSolid, getUserscript)
  - PC 전용 이벤트만 사용
  - 디자인 토큰 사용
- **로깅 표준화**: [ServiceName] 접두사 사용 ✅

### 가드 테스트 실행

```bash
# 프로젝트 상태 가드 테스트만 실행
npx vitest run test/guards/

# 또는 npm 스크립트
npm run test:guards  # (설정되어 있으면)
```

## 🗂️ 테스트 아카이브

### archive/ 폴더의 역할

`test/archive/` 디렉터리는 완료된 리팩토링 Phase와 과거 개발 단계의 테스트를
참고용으로 보관합니다:

- **cleanup-phases/**: Phase 1~7 정리 테스트 (2025-10-25 이동)
  - Phase 1: 사용하지 않는 코드 제거
  - Phase 2: 네이밍 정리
  - Phase 3: 테스트 코드 정리
  - Phase 4: 네이밍 표준화
  - Phase 6-7: 의존성 격리 및 레거시 정리

- **integration-behavioral/**: 과거 개발 단계의 행위 검증 테스트 (2025-10-25
  이동)
  - `user-interactions-fixed.test.ts`: Mock 기반 사용자 상호작용 검증
  - `toolbar-visibility-fix.test.ts`: 도구모음 가시성 수정 검증
  - 현재: Phase 170B+ 상태에 비효율적 (참고용 보관)

- **integration/**: Phase 171A 아카이브 (2025-10-25 이동)
  - `bundle-vendor-tdz.test.ts`: TDD RED 단계 (Phase 170B+에서 해결)
  - `extension.integration.test.ts`: 모두 placeholder 테스트
  - `master-test-suite.test.ts`: Phase 4 완료 마커
  - `vendor-tdz-resolution.test.ts`: TDD GREEN 검증 (해결됨)

- **styles/**: Phase 174 아카이브 (2025 이동)
  - `phase-109-settings-focus-ring.test.ts`: Settings focus ring 색상 일관성
    검증
  - `phase-110-focus-ring.test.ts`: --xeg-focus-ring 토큰 색상 수정 테스트
  - `phase-111-toast-colors.test.ts`: Toast 색상 토큰 흑백 통일 검증
  - `phase-113-focus-ring-alias.test.ts`: Focus ring alias 모노크롬 강제 검증
  - `phase-121-text-color-tokens.test.ts`: 텍스트 색상 토큰 정의 및 테마 검증

### 아카이브 정책

- **언제**: Phase 완료 후 검증이 끝나거나, 현재 프로젝트 상태에 비해 구식
  테스트일 때
- **왜**: 유지보수 부담 감소, 프로젝트 구조 간결화, CI 부하 최소화
- **어떻게**: CI/로컬 테스트 실행에서 제외, 문서와 함께 참고용 보관

**세부 정책**:

- 각 아카이브 폴더에 `README.md` 포함 (용도, 이유, 복원 방법)
- 아카이브 시점: 깔끔한 커밋 메시지 함께 기록
- 필요시 `test/archive/README.md` 마스터 파일에서 전체 아카이브 목록 관리

자세한 내용은 `test/archive/README.md`를 참고하세요.

## 🎨 test/styles 가이드 (Phase 174)

### 목적

`test/styles` 디렉토리는 **디자인 토큰, CSS 정책, 스타일링 규칙**을 검증하는
테스트를 보관합니다.

### 파일 구성 (14개, Phase 174)

#### 색상 토큰 검증

| 파일                                | 목적                                | 라인 수 |
| ----------------------------------- | ----------------------------------- | ------- |
| `color-token-consistency.test.ts`   | 색상 토큰 일관성 (oklch 형식, 범위) | 97      |
| `hardcoded-colors.test.ts`          | 하드코딩 색상 정책 검증             | 53      |
| `hardcoded-color-detection.test.ts` | 하드코딩 색상 감지 및 제거          | 163     |
| `twitter-color-mapping.test.ts`     | Twitter 색상 매핑                   | 71      |

#### 디자인 토큰 시스템

| 파일                             | 목적                                                     | 라인 수 |
| -------------------------------- | -------------------------------------------------------- | ------- |
| `design-tokens.test.ts`          | 디자인 토큰 계층 검증 (Primitive → Semantic → Component) | 181     |
| `token-definition-guard.test.ts` | 토큰 정의 가드 (모든 토큰 존재 여부, 명명 규칙)          | **308** |

#### 테마 & 모드

| 파일                              | 목적               | 라인 수 |
| --------------------------------- | ------------------ | ------- |
| `dark-mode-consolidation.test.ts` | 다크모드 통합 검증 | 89      |
| `theme-responsiveness.test.ts`    | 테마 반응성 검증   | 105     |

#### UI 구성요소 스타일

| 파일                                 | 목적             | 라인 수 |
| ------------------------------------ | ---------------- | ------- |
| `toolbar-expandable-styles.test.ts`  | 툴바 확장 스타일 | 76      |
| `settings-toolbar-alignment.test.ts` | 설정/툴바 정렬   | 68      |
| `button-fallback-removal.test.ts`    | 버튼 폴백 제거   | 72      |

#### 기타

| 파일                          | 목적            | 라인 수 |
| ----------------------------- | --------------- | ------- |
| `animation-standards.test.ts` | 애니메이션 표준 | 64      |
| `css-optimization.test.ts`    | CSS 최적화      | 87      |
| `style-consolidation.test.ts` | 스타일 통합     | 92      |

### 테스트 실행

```bash
# test/styles 전체 테스트
npm run test:styles

# 또는 Vitest 직접 실행
npx vitest run test/styles/

# 감시 모드
npx vitest test/styles/ --watch
```

### 테스트 작성 패턴

#### 1. 색상 토큰 검증

```typescript
import { readFileSync } from 'node:fs';

describe('Color Token Consistency', () => {
  const cssContent = readFileSync(
    'src/shared/styles/design-tokens.css',
    'utf-8'
  );

  it('should use oklch format for all colors', () => {
    // Pattern: --xeg-color-*: oklch(L C H / alpha)
    const oklchPattern =
      /oklch\(\s*[\d.]+\s+[\d.]+\s+[\d.]+\s*(?:\/\s*[\d.]+)?\s*\)/g;
    expect(cssContent).toMatch(oklchPattern);
  });

  it('should not have hardcoded hex or rgb colors', () => {
    expect(cssContent).not.toMatch(/#[0-9a-fA-F]{3,6}/);
    expect(cssContent).not.toMatch(/rgba?\(/);
  });
});
```

#### 2. 토큰 정의 검증 (JSDOM)

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Token Definitions', () => {
  let styleElement: HTMLStyleElement;

  beforeEach(() => {
    styleElement = document.createElement('style');
    styleElement.textContent = `
      :root {
        --xeg-color-text-primary: oklch(0 0 0);
        --xeg-color-text-secondary: oklch(0.627 0.013 285.9);
      }
    `;
    document.head.appendChild(styleElement);
  });

  afterEach(() => {
    styleElement.remove();
  });

  it('should compute text color tokens correctly', () => {
    const style = window.getComputedStyle(document.documentElement);
    const primary = style.getPropertyValue('--xeg-color-text-primary').trim();

    expect(primary).not.toBe('');
    expect(primary).toContain('oklch');
  });
});
```

### 설계 원칙

#### ✅ 허용되는 패턴

- **oklch 색상**: `oklch(0.676 0.151 237.8)` 또는 `oklch(L C H / alpha)`
- **색상 토큰 참조**: `var(--color-gray-500)`, `var(--xeg-color-primary)`
- **상대 단위**: `rem`, `em`
- **디자인 토큰 사용**: `--xeg-*`, `--space-*` 등 정의된 토큰만

#### ❌ 금지되는 패턴

- **하드코딩 색상**: `#1d9bf0`, `rgb(29, 155, 240)`, `rgba(0, 0, 0, 0.5)`
- **절대 단위**: `px` (반응성 제한)
- **매직 넘버**: 의미 없는 숫자 상수

### 참고 문서

- `CODING_GUIDELINES.md`: 디자인 토큰 3계층 시스템
- `TESTING_STRATEGY.md`: 테스트 타워 전략
- `docs/dependency-graph.svg`: 의존성 시각화

자세한 내용은 `test/archive/README.md`를 참고하세요.

---

## 🔧 test/refactoring 가이드 (Phase 174)

`test/refactoring` 디렉토리는 **진행 중인 리팩토링 테스트 모음**입니다. 27개의
유지보수 대상 파일이 포함되어 있습니다.

### 상태 (Phase 174)

- **아카이브 완료**: Phase 파일(2개) + Container(8개) → test/archive/refactoring
- **정리 완료**: 중복 파일(3개) 제거 + 극단적 파일(8개) 제거
- **현재 유지 중**: 27개 파일 (스타일/디자인 중심 리팩토링)
- **vitest.config.ts**: refactor 프로젝트에서 exclude 처리 (CI에서 제외)

### 파일 분류

**버튼 & 도구 모음 (일관성 & 최적화)**:

- `button-animation-consistency.test.ts` (186줄)
- `button-design-consistency-fixed.test.ts` (85줄)
- `toolbar-auto-hide-deduplication.test.ts` (199줄)
- `toolbar-button-consistency-v2.test.ts` (152줄)
- `toolbar-design-consistency.test.ts` (91줄)
- `toolbar-expandable-design.test.ts` (177줄)
- `toolbar-initial-transparency.test.ts` (204줄)
- `toolbar-settings-panel-continuity.test.ts` (80줄)
- `toolbar-ui-consistency.test.ts` (165줄)

**CSS & 스타일 (시스템 통합)**:

- `css-circular-reference.test.ts` (157줄)
- `css-design-system-consolidation.test.ts` (226줄)
- `hardcoded-css-elimination.test.ts` (150줄)
- `light-dom-transition.test.ts` (152줄)

**컴포넌트 (렌더링 & 최적화)**:

- `cross-component-consistency.test.ts` (263줄)
- `gallery-signals-migration.test.ts` (130줄)
- `icon-component-optimization.test.ts` (252줄)
- `modal-position-calculation.test.ts` (229줄)
- `modal-toolbar-visual-consistency.test.ts` (146줄)
- `vertical-image-item-design-consistency.test.ts` (199줄)

**테마 & 유틸 (시스템 정책)**:

- `glass-surface-consistency.test.ts` (125줄)
- `remove-unused-libraries.test.ts` (97줄)
- `theme-sync-simple.test.ts` (131줄)
- `theme-synchronization.test.ts` (164줄)
- `toast-animation-consistency.test.ts` (112줄)
- `toast-system-integration.test.ts` (209줄)
- `use-modal-position.test.ts` (167줄)
- `vendor-performance.test.ts` (157줄)

### 실행 방법

```bash
# 모든 리팩토링 테스트 (현재 CI/로컬에서 제외)
# 복원하려면 vitest.config.ts의 refactor exclude 수정

# 개별 파일 수동 실행 (테스트용)
npx vitest run test/refactoring/button-animation-consistency.test.ts

# 감시 모드
npx vitest test/refactoring/button-animation-consistency.test.ts --watch
```

### 아카이브 정책

**완료된 파일들**:

- Phase 2, Phase 65 (TDD 히스토리): → test/archive/refactoring/
- Container 리팩토링 (8개 파일): → test/archive/refactoring/container/

**제거된 파일들** (극단적으로 짧음 또는 중복):

- 중복: button-design-consistency, toolbar-button-consistency,
  toolbar-button-consistency-fixed
- 극단적 (19-69줄): gallery-dom-depth-cap, gallery-design-uniformity,
  settings-header-alignment 등 8개

자세한 내용은 `test/archive/refactoring/README.md`를 참고하세요.

```

```
