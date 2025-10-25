# test/unit/features/gallery

Gallery 기능에 대한 활성 통합 테스트 및 회귀 테스트 모음

> **업데이트**: 2025-10-25 (Phase 182) - 파일 정리, Phase 아카이브, 정책 테스트
> 이동

## 구조

```
test/unit/features/gallery/
├── README.md (본 파일)
├── GalleryApp.integration.test.ts    (411줄)  - GalleryApp 전체 플로우 통합
├── keyboard-help.aria.test.tsx       (55줄)   - KeyboardHelpOverlay ARIA 정책
├── components/                                 - UI 컴포넌트 회귀 테스트
│   ├── vertical-gallery-view/
│   │   ├── VerticalGalleryView.auto-focus-on-idle.test.tsx  (206줄) - 자동 포커스
│   │   ├── VerticalGalleryView.fit-mode.test.tsx            (154줄) - 이미지 핏 모드
│   │   ├── VerticalGalleryView.focus-tracking.test.tsx      (232줄) - 포커스 추적
│   │   └── VerticalGalleryView.wheel-scroll.test.tsx        (157줄) - 휠 스크롤
│   ├── hooks/
│   │   └── useProgressiveImage.test.ts (151줄) - 점진적 이미지 로드
│   └── __screenshots__/                        - Playwright 스크린샷 아티팩트
├── hooks/
│   ├── conflict-resolution.test.ts                           (152줄) - 포커스 충돌 해결
│   ├── use-gallery-focus-tracker-deduplication.test.ts       (164줄) - 중복 제거
│   ├── use-gallery-focus-tracker-observer-lifecycle.test.ts  (201줄) - 라이프사이클
│   ├── use-gallery-focus-tracker-settling.test.ts           (195줄) - settling 최적화
│   ├── use-gallery-scroll-stability.test.ts                 (194줄) - 스크롤 안정성
│   ├── useGalleryItemScroll.test.ts                         (138줄) - 아이템 스크롤
│   └── __screenshots__/                                      - Playwright 스크린샷
└── (archive로 이동된 파일들)
    - Phase 테스트 8개
    - RED 테스트 1개
    → test/archive/unit/features/gallery/ 참고
```

## 테스트 유형

### 1. 통합 테스트 (Integration)

**GalleryApp.integration.test.ts** (411줄)

- 목적: GalleryApp 전체 플로우 검증
- 범위: 초기화 → 열기 → 네비게이션 → 닫기 전체 사이클
- 환경: JSDOM (실제 DOM 환경)
- 서비스: 실제 인스턴스 사용 (모킹 최소화)
- 상태: ✅ 활성, 지속 유지

### 2. UI 컴포넌트 회귀 테스트

**VerticalGalleryView 및 관련 컴포넌트**

| 파일                                              | 라인 | 목적                                  | 상태              |
| ------------------------------------------------- | ---- | ------------------------------------- | ----------------- |
| `VerticalGalleryView.auto-focus-on-idle.test.tsx` | 206  | 자동 포커스 동기화                    | ✅ Browser 모드\* |
| `VerticalGalleryView.fit-mode.test.tsx`           | 154  | 이미지 핏 모드 검증                   | ✅ 활성           |
| `VerticalGalleryView.focus-tracking.test.tsx`     | 232  | IntersectionObserver 기반 포커스 추적 | ✅ Browser 모드\* |
| `VerticalGalleryView.wheel-scroll.test.tsx`       | 157  | 휠 스크롤 이벤트 처리                 | ✅ 활성           |

\*Browser 모드: Vitest `@vitest/browser` + Chromium로 실행 (JSDOM 제약 우회)

**useProgressiveImage 훅 테스트**

- **파일**: `components/hooks/useProgressiveImage.test.ts` (151줄)
- **목적**: 점진적 이미지 로드 훅 검증
- **상태**: ✅ 활성

### 3. 훅 (Hooks) 테스트

**useGalleryFocusTracker 관련**

| 파일                                                   | 라인 | 목적                              | 상태              |
| ------------------------------------------------------ | ---- | --------------------------------- | ----------------- |
| `conflict-resolution.test.ts`                          | 152  | 포커스 충돌 해결                  | ✅ 활성           |
| `use-gallery-focus-tracker-deduplication.test.ts`      | 164  | RAF 기반 중복 제거                | ✅ RAF 프로젝트\* |
| `use-gallery-focus-tracker-settling.test.ts`           | 195  | settling 기반 최적화              | ✅ RAF 프로젝트\* |
| `use-gallery-focus-tracker-observer-lifecycle.test.ts` | 201  | IntersectionObserver 라이프사이클 | ✅ RAF 프로젝트\* |

\*RAF 프로젝트: `vitest --project raf-timing` (fake timers 격리)

**useGalleryScroll 및 관련**

| 파일                                   | 라인 | 목적                 | 상태    |
| -------------------------------------- | ---- | -------------------- | ------- |
| `use-gallery-scroll-stability.test.ts` | 194  | 스크롤 안정성 감지   | ✅ 활성 |
| `useGalleryItemScroll.test.ts`         | 138  | 아이템별 스크롤 제어 | ✅ 활성 |

### 4. 접근성 테스트

**keyboard-help.aria.test.tsx** (55줄)

- **목적**: KeyboardHelpOverlay ARIA 속성 및 접근성 정책 검증
- **테스트 대상**:
  - `role="dialog"` 및 `aria-modal="true"` 설정
  - 라벨 및 설명 ARIA 속성
- **환경**: JSDOM
- **상태**: ✅ 활성
- **참고**: E2E 접근성 테스트는 `playwright/accessibility/` 참고

## 실행 방법

### 전체 gallery 테스트

```bash
npm run test:unit
# 또는 특정 프로젝트
npm run test:fast
```

### 특정 테스트만 실행

```bash
# 통합 테스트만
npx vitest run test/unit/features/gallery/GalleryApp.integration.test.ts

# 컴포넌트 회귀 테스트
npx vitest run test/unit/features/gallery/components/

# 훅 테스트
npx vitest run test/unit/features/gallery/hooks/

# 특정 훅 테스트 (RAF 모드)
npx vitest --project raf-timing run \
  test/unit/features/gallery/hooks/use-gallery-focus-tracker-deduplication.test.ts
```

### Watch 모드

```bash
npm run test:watch -- -t "gallery"
```

## 주요 정책 및 제약사항

### JSDOM 제약사항

다음 기능들은 JSDOM에서 완전히 작동하지 않으므로 Browser 모드 테스트 사용:

- ❌ Solid.js fine-grained reactivity (signal boundary 미수립)
- ❌ CSS 레이아웃 계산 (`getBoundingClientRect()` 항상 0)
- ✅ IntersectionObserver (부분 모킹)
- ✅ 조건부 렌더링 및 이벤트 핸들러

### Browser 모드 제약사항

Playwright 브라우저 환경에서 Solid.js 반응성은 제한적입니다:

- 🔄 Signal 변경 → DOM 반영: 지원하지만 느림
- ❌ Props 변경에 즉시 반응: 지원 안 함 (Remount 패턴 사용 필요)

**권장 패턴** (`playwright/harness/`):

```typescript
// ❌ 작동하지 않음
await harness.updateToolbar({ currentIndex: 1 });

// ✅ 권장: remount 패턴
await harness.disposeToolbar();
await harness.mountToolbar({ currentIndex: 1 });
```

### PC 전용 이벤트

모든 갤러리 테스트는 PC 이벤트만 사용:

- ✅ `click`, `keydown`, `keyup`, `wheel`, `mouseenter`, `mouseleave`
- ❌ Touch 이벤트 (`touchstart`, `touchmove`, `touchend`)
- ❌ Pointer 이벤트 (`pointerdown`, `pointermove` 등)

### 디자인 토큰

모든 스타일/CSS는 디자인 토큰 사용:

- 크기: `rem` (절대) 또는 `em` (상대)
- 색상: `oklch()` 함수
- 토큰: `--xeg-*`, `--space-*`, `--radius-*` 등

## 이동/정리 이력

**Phase 182 (2025-10-25)**

| 대상                                          | 파일 수 | 이유                            |
| --------------------------------------------- | ------- | ------------------------------- |
| Archive (test/archive/unit/features/gallery/) | 8개     | Phase 완료 테스트 및 RED 테스트 |
| Policies (test/unit/policies/)                | 3개     | 정책 검증 테스트 중앙화         |
| 유지 (현재 디렉토리)                          | 12개    | 활성 통합/회귀 테스트           |

### 아카이브된 파일들

- 7개 Phase 테스트 (101, 14.1.4, 20.1, 20.2, 18, 4, A5.4)
- 1개 RED 테스트 (Phase 21.1)

→ 자세한 내용: `test/archive/unit/features/gallery/README.md`

### 이동된 정책 테스트

- `video-item.cls.test.ts` → `test/unit/policies/`
- `VerticalGalleryView.inline-style.policy.test.ts` → `test/unit/policies/`
- `VerticalImageItem.inline-style.policy.test.ts` → `test/unit/policies/`

→ 자세한 내용: `test/unit/policies/README.md`

## 커버리지 및 성능

**테스트 수**: 51개 파일 (약 3,000줄)

**실행 시간** (npm run test:unit):

- fast 프로젝트: ~1-2분
- raf-timing 프로젝트: ~30-40초
- 총합: ~2-3분

**커버리지**:

- Gallery 기능: ~60-70%
- Hooks: ~70-80%

## 참고 문서

- **아키텍처**: `docs/ARCHITECTURE.md` → Gallery 3계층 구조
- **테스트 전략**: `docs/TESTING_STRATEGY.md` → JSDOM vs Browser 선택 기준
- **E2E 테스트**: `playwright/smoke/` → 사용자 시나리오
- **접근성**: `playwright/accessibility/` → WCAG 2.1 Level AA
- **정책 테스트**: `test/unit/policies/README.md`
- **아카이브**: `test/archive/unit/features/gallery/README.md`
