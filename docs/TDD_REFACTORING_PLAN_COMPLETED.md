# TDD 리팩토링 완료 기록

**최종 업데이트**: 2025-10-29 | **최근 완료**: Phase 247

**목적**: 완료된 Phase의 요약 기록 (상세 내역은 필요 시 git 히스토리 참고)

---

## 📊 완료된 Phase 요약 (Phase 197-246)

| Phase       | 날짜       | 제목                                       | 핵심 내용                                         |
| ----------- | ---------- | ------------------------------------------ | ------------------------------------------------- |
| **247**     | 2025-10-29 | Fit 모드 × Intrinsic 연동                  | CSS 변수로 툴바 크기 조절과 자리 예약을 동기화    |
| **246**     | 2025-10-29 | 갤러리 초기 스크롤 레이아웃 안정화         | 메타데이터 기반 자리 확보 + 자동 스크롤 순서 보정 |
| **245**     | 2025-10-29 | 갤러리 스크롤 체이닝 가드 보완             | 내부 이벤트 가드 추가, 체이닝 회귀 테스트 강화    |
| **244**     | 2025-10-29 | 갤러리 스크롤 체이닝 점검                  | 스크롤 가드/overscroll 보강, Playwright 회귀      |
| **243**     | 2025-10-29 | 포인터 정책 로직 간결화 및 재발 방지 강화  | 헬퍼 함수 분리, 상수 추출, 문서화                 |
| **242**     | 2025-10-29 | 설정 드롭다운 포인터 정책 조정             | 폼 컨트롤 허용, 비-HTMLElement 가드 추가          |
| **241**     | 2025-10-29 | event.target 타입 가드 강화                | isHTMLElement 활용, Document/Window 안전처리      |
| **240**     | 2025-10-29 | 설정 드롭다운 펼침 수정                    | CSS 상속 문제 수정, 오버라이드 추가               |
| **239**     | 2025-10-29 | 문서 정리 및 중복 제거                     | CODE_QUALITY.md 삭제, temp/ 정리                  |
| **238**     | 2025-10-29 | 린터 ignore 설정 개선                      | 임시/생성/아카이브 파일 일관 제외                 |
| **237**     | 2025-10-29 | 서비스 등록 require 제거 및 타입 가드 강화 | require → static import, element.matches 체크     |
| **236**     | 2025-10-29 | DOMContentLoaded 리스너 제거               | @run-at document-idle 활용, 격리 완성             |
| **235**     | 2025-10-29 | Toast 알림 GalleryRenderer 격리            | main.ts → GalleryRenderer, 책임 분리 명확화       |
| **234**     | 2025-10-29 | TESTING_STRATEGY 간소화 (48% 감소)         | 517줄→271줄, 테이블 재구성, 링크 대체             |
| **233**     | 2025-10-29 | 문서 간소화 및 정리 (90% 감소)             | 3개 문서 4667줄→444줄, 개발자 온보딩 개선         |
| **232**     | 2025-10-29 | CodeQL 보안 경고 해결 (6/6)                | URL 검증, Prototype Pollution, 빌드 안전성        |
| **231**     | 2025-10-29 | Phase 199 중단 흔적 제거                   | 테스트 정리, 문서 정리                            |
| **230**     | 2025-10-28 | BaseService 초기화 실패 수정               | ThemeService singleton export 추가                |
| **229**     | 2025-10-28 | PC-only 정책 부작용 수정                   | 텍스트 선택 복원, Pointer 이벤트 조정             |
| **228**     | 2025-10-28 | 이벤트 캡처 최적화                         | 미디어 컨테이너 fast-path 체크                    |
| **227**     | 2025-10-27 | Testability 테스트 정리                    | Phase 80.1 테스트 재구성 및 이관                  |
| **226**     | 2025-10-27 | Container Module 리팩토링                  | service-harness 제거, 구조 최적화                 |
| **225**     | 2025-10-27 | Shared Constants 최적화                    | i18n 모듈 재구성                                  |
| **224**     | 2025-10-27 | Phase 80.1 의존성 피드백 적용              | 상태 동기화 개선                                  |
| **223**     | 2025-10-27 | Focus 서비스 TDD 완료                      | ObserverManager, Applicator, StateManager         |
| **222**     | 2025-10-27 | Focus 프레임워크 Phase 3 완료              | 서비스 통합 검증                                  |
| **221**     | 2025-10-27 | Focus 프레임워크 Phase 2 완료              | Applicator/StateManager 통합                      |
| **220**     | 2025-10-27 | Focus 프레임워크 Phase 1 완료              | ObserverManager 추출                              |
| **219**     | 2025-10-27 | Phase 80.1 최종 검증                       | 테스트 통과, 문서화 완료                          |
| **218**     | 2025-10-27 | Phase 80.1 E2E 검증                        | Playwright 테스트 추가                            |
| **217**     | 2025-10-27 | Theme Initialization 최적화                | 매직 문자열 상수화, JSDoc 강화                    |
| **216**     | 2025-10-27 | Gallery Hooks 점검                         | JSDoc, import 경로 정규화                         |
| **215**     | 2025-10-27 | KeyboardHelpOverlay 재구성                 | 컴포넌트 최적화                                   |
| **214**     | 2025-10-27 | VerticalGalleryView 현대화                 | 29개 import 정규화                                |
| **213**     | 2025-10-27 | Vertical Gallery View Hooks 정리           | 494줄 데드코드 제거                               |
| **212**     | 2025-10-27 | KeyboardHelpOverlay 컴포넌트 현대화        | JSDoc, import 경로 정규화                         |
| **211**     | 2025-10-27 | Bootstrap 최적화                           | 부트스트랩 구조 정리                              |
| **210**     | 2025-10-27 | Global Style Tokens 현대화                 | CSS 토큰 체계 정리                                |
| **209**     | 2025-10-27 | dependency-cruiser 설정 최적화             | 의존성 규칙 강화                                  |
| **208**     | 2025-10-27 | Scripts 디렉터리 현대화                    | JSDoc 표준화, 에러 처리 개선                      |
| **207**     | 2025-10-27 | 문서 체계 현대화                           | 문서 구조 정리                                    |
| **206**     | 2025-10-27 | Playwright 테스트 통합                     | E2E 스모크 테스트 추가                            |
| **205**     | 2025-10-27 | Playwright Accessibility 통합              | WCAG 2.1 AA 자동 검증                             |
| **200-204** | 2025-10-27 | 빌드 및 문서 최적화                        | 빌드 병렬화, 메모리 최적화                        |
| **197-199** | 2025-10-27 | Settings 드롭다운 수정                     | PC-only 정책 적용                                 |

---

## 📋 Phase 247 상세 (Fit 모드 × Intrinsic Sizing 연동)

- **문제 인식**: 메타데이터로 예약한 자리와 툴바 Fit
  모드(원본/가로맞춤/세로맞춤/창맞춤) 전환 후 실제 표시 크기가 어긋나면서
  일시적인 빈 공간·폭 변경이 발생.
- **핵심 조치**:
  - `VerticalImageItem`에서 폭·높이를 `--xeg-gallery-item-intrinsic-*` 커스텀
    프로퍼티로 주입하고 `data-has-intrinsic-size`를 기준으로 CSS가 조건부로 자리
    계산을 수행하도록 변경.
  - `VerticalImageItem.module.css`를 `data-fit-mode` 기반 규칙으로 재구성하여
    원본/세로/창 맞춤 모드가 뷰포트 제약(`--xeg-viewport-height-constrained`)
    하에서 동일한 자리 예약 로직을 공유하도록 조정.
  - Intrinsic/fit 모드 테스트를 확장하고 CLS 레드 가드 테스트에 새 커스텀
    프로퍼티를 검증하도록 업데이트.
- **검증**:
  - `npx vitest run test/unit/features/gallery/components/VerticalImageItem.intrinsic-size.test.tsx`
  - `npx vitest run test/unit/features/gallery/components/VerticalGalleryView.fit-mode.test.tsx`
  - `npx vitest run test/unit/styles/layout-stability.cls.red.test.ts`
- **결과**: Fit 모드 전환 시에도 예약 폭·높이가 즉시 재계산되어 레이아웃 점프가
  사라지고, 툴바 이미지 크기 조절과 실제 표시 영역이 일관성 있게 유지됨.
  메타데이터가 없는 항목은 기존 토큰 기반 동작을 그대로 유지.

## 📋 Phase 246 상세 (갤러리 초기 스크롤 레이아웃 안정화)

- **문제 인식**: 클릭 직후 갤러리를 여는 시점에 이미지가 아직 로드되지 않아
  아이템 높이가 축소되고, 자동 스크롤이 끝난 뒤 이미지가 로드되면서 뷰가 다시
  이동하는 시각적 점프가 발생.
- **핵심 조치**:
  - `VerticalImageItem`에 미디어 메타데이터(폭·높이)를 활용하는 커스텀 CSS
    변수를 주입해 렌더 직후 자리 확보 및 레이아웃 안정화.
  - 기본 디자인 토큰에 종횡비 기본값을 정의하고, CSS 모듈이 `aspect-ratio`를
    토큰 기반으로 적용하도록 갱신.
  - `useGalleryItemScroll`이 예약된 프레임 이후에 자동 스크롤을 수행하도록
    `requestAnimationFrame` 대기 로직을 추가하고, 폴링 경로도 동일한 순서를
    사용하도록 정비.
- **검증**:
  - `npx vitest run test/unit/styles/layout-stability.cls.red.test.ts`
  - `npx vitest run test/unit/features/gallery/components/VerticalImageItem.intrinsic-size.test.tsx`
  - `npx vitest run test/unit/features/gallery/hooks/useGalleryItemScroll.test.ts`
- **결과**: 초기 렌더 단계에서 갤러리 아이템 높이가 안정적으로 예약되어 클릭
  원본과 갤러리 초점 간 시각적 불일치가 제거되었고, 자동 스크롤은 예약된
  레이아웃이 적용된 이후에만 실행되어 연속적인 스크롤 체험을 제공.

## 📋 Phase 245 상세 (갤러리 스크롤 체이닝 가드 보완)

- **문제 인식**: 갤러리 휠 이벤트를 수집하는 캡처 단계 핸들러가 내부 요소 여부를
  확인하지 않아, 갤러리 상호작용 이전에도 `isScrolling`이 활성화되면서 외부
  스크롤이 조기에 차단될 위험을 발견.
- **핵심 조치**:
  - `useGalleryScroll`의 `handleGalleryWheel`에 `isGalleryInternalEvent` 가드를
    추가해 갤러리 영역 외 이벤트는 무시.
  - `test/unit/features/gallery/hooks/use-gallery-scroll-chain.test.ts`에 외부
    휠 이벤트가 상호작용 이전에는 차단되지 않는지 검증하는 회귀 테스트 추가.
- **검증**:
  - `npx vitest run test/unit/features/gallery/hooks/use-gallery-scroll-chain.test.ts`
- **결과**: 갤러리 내부 상호작용 이후에만 체이닝 차단이 동작하며, 외부 표면의
  스크롤은 정상적으로 유지. 관련 텔레메트리(`lastPrevented*`)도 회귀 없이
  갱신됨.

## 📋 Phase 244 상세 (갤러리 스크롤 체이닝 점검)

- **문제 인식**: 본문 폴백 시 `preventTwitterScroll`이 갤러리 내부 휠 이벤트까지
  차단할 위험과, CSS `overscroll-behavior` 누락으로 체이닝이 완전히 억제되지
  않는 문제를 확인.
- **핵심 조치**:
  - `useGalleryScroll`에 갤러리 내부 이벤트 가드와 Twitter 컨테이너 재연결
    감시(MutationObserver) 추가, 마지막 차단 이벤트 텔레메트리(`lastPrevented*`)
    저장.
  - `VerticalGalleryView`, `VerticalImageItem`, `gallery-global.css`에
    `overscroll-behavior` 값을 명시해 CSS 계층에서 체이닝 차단.
  - Playwright 스모크 `scroll-chaining.spec.ts`를 수동 하네스 기반으로
    재작성하여 내부 스크롤 허용·외부 차단·텔레메트리 기록을 실 브라우저에서
    검증.
- **검증**:
  - `npx playwright test playwright/smoke/scroll-chaining.spec.ts`
  - 기존 Vitest 체이닝 스위트 유지
    (`test/unit/features/gallery/hooks/use-gallery-scroll-chain.test.ts`).
- **결과**: 갤러리 내부 스크롤은 정상 동작하고, 배경 체이닝은 확실히 차단되며,
  회귀 테스트 모두 성공.

---

## 📋 Phase 243 상세 (포인터 정책 로직 간결화 및 재발 방지 강화)

**목표**: Phase 242 완료 후 코드 가독성 향상 및 재발 방지 조치 강화

**배경**:

- Phase 242에서 설정 드롭다운 문제를 해결했지만, 포인터 이벤트 차단 로직이
  복잡하고 재발 가능성 존재
- 폼 컨트롤 판별 로직이 인라인으로 중복되어 유지보수 어려움
- 정책 결정 로직이 여러 if문으로 산재되어 의도 파악 어려움

**솔루션**:

1. **상수 추출**: `FORM_CONTROL_SELECTORS` 상수로 셀렉터 중복 제거
2. **함수 분리**:
   - `isFormControlElement(element)`: 폼 컨트롤 판별 로직 명시적 함수화
   - `getPointerEventPolicy(target, pointerType)`: 정책 결정 로직을 명확한
     3단계로 정리
3. **문서화**: CODING_GUIDELINES.md에 포인터 정책 및 재발 방지 전략 명시
4. **Git 추적**: test/global-teardown.ts를 추적에 추가 (Phase 241에서 생성됨)

**구현 내용**:

- `src/shared/utils/events.ts`
  - `FORM_CONTROL_SELECTORS` 상수 추출
  - `isFormControlElement()` 함수 추가 (재사용 가능)
  - `getPointerEventPolicy()` 함수 추가 (정책 결정 로직 분리)
  - `blockTouchAndPointerEvents()` 내 포인터 이벤트 처리 로직 switch문으로 개선
- `docs/CODING_GUIDELINES.md`
  - "PC 전용 이벤트" 섹션에 포인터 정책 상세 설명 추가
  - 재발 방지 전략 명시 (명시적 함수, 테스트 커버리지)

**검증 결과**:

```bash
npm run build
# ✅ 타입 체크, 린트, 의존성, 브라우저 테스트, E2E, 접근성 모두 통과
# ✅ 빌드 크기: 342.44 KB (Phase 242: 342.41 KB, 변화 +0.03 KB)
```

**효과**:

- 코드 가독성 대폭 향상 (정책 결정 로직이 switch문으로 명확히 표현)
- 유지보수성 개선 (폼 컨트롤 셀렉터 변경 시 한 곳만 수정)
- 재발 방지 (명시적 함수 + 문서화로 향후 유사 이슈 예방)
- 테스트 안정성 유지 (기존 테스트 모두 통과)

---

## 📋 Phase 242 상세 (설정 드롭다운 포인터 정책 조정)

**목표**: 설정 패널의 테마/언어 드롭다운이 클릭으로 열리지 않는 회귀 해결 및
관련 경고 제거

**문제 분석** (로그: `x.com-1761727066991.log`):

```log
[XEG] [WARN] Invalid element: matches is not a function #document (https://x.com/home)
```

**근본 원인**:

1. PC-only 포인터 정책(`blockTouchAndPointerEvents`)이 갤러리 내부 포인터
   이벤트를 일괄 차단하면서 `<select>` 기본 동작까지 억제
2. `isGalleryInternalElement`가 `Document` 등 비-HTMLElement 대상에도 `matches`
   호출을 시도해 경고 발생

**솔루션**:

- 마우스 기반 폼 컨트롤(`select`, `input`, `textarea`, `button`,
  listbox/combobox role)을 포인터 차단 예외로 허용
- `isGalleryInternalElement` 앞단에 `HTMLElement` 인스턴스 가드 추가로 `matches`
  호출 안전화
- 포인터 정책 유닛 테스트에 회귀 케이스 추가 (폼 컨트롤 허용, 일반 요소 차단
  지속)

**구현 내용**:

- `src/shared/utils/utils.ts`
  - `isGalleryInternalElement`에 `instanceof HTMLElement` 검사 추가
- `src/shared/utils/events.ts`
  - 포인터 이벤트 차단 로직에 폼 컨트롤 허용 조건 및 포인터 타입 로깅 추가
  - 비-HTMLElement 대상은 로깅 후 조기 반환
- `test/unit/shared/utils/events-pointer-policy.test.ts`
  - 비-HTMLElement 입력 시 경고가 발생하지 않는지 검증
  - 폼 컨트롤의 포인터 이벤트는 허용, 일반 갤러리 요소는 계속 차단되는지 검증

**검증 결과**:

```bash
npx vitest run test/unit/shared/utils/events-pointer-policy.test.ts
npm run test:cleanup
```

- Vitest dual project(`unit`, `fast`)에서 총 26개 테스트 통과 (13/13 × 2)
- `npm run test:cleanup`으로 Vitest 워커 정리 완료

**효과**:

- 설정 패널 드롭다운이 정상적으로 펼쳐짐
- `Invalid element: matches is not a function` 경고 제거
- PC-only 정책은 유지하면서 폼 컨트롤 사용성 확보

---

## 📋 Phase 241 상세 (event.target 타입 가드 강화)

**목표**: `event.target`이 `Document` 객체일 때 발생하는
`matches is not a function` 경고 제거

**문제 분석** (로그: `x.com-1761725447858.log`):

```log
[XEG] [WARN] Invalid element: matches is not a function #document (https://x.com/home)
```

**근본 원인**:

1. `event.target`을 `HTMLElement`로 강제 타입 캐스팅
2. `Document`, `Window` 등 다른 `EventTarget` 타입 처리 미흡
3. Phase 237의 `element.matches` 타입 가드가 타입 캐스팅 이후에만 동작

**솔루션**: 기존 `isHTMLElement` 타입 가드 활용

- 위치: `src/shared/utils/type-guards.ts` (Phase 135에서 이미 구현됨)
- 타입: `(element: unknown): element is HTMLElement`
- TypeScript narrowing 지원

**구현 내용**:

1. **타입 가드 적용** (`src/shared/utils/utils.ts`):

   ```typescript
   export function isGalleryInternalEvent(event: Event): boolean {
     const target = event.target;
     if (!isHTMLElement(target)) return false; // Phase 241
     return isGalleryInternalElement(target);
   }
   ```

2. **이벤트 핸들러 수정** (`src/shared/utils/events.ts`):

   ```typescript
   async function handleMediaClick(event: MouseEvent, ...): Promise<EventHandlingResult> {
     const target = event.target;
     if (!isHTMLElement(target)) {
       return { handled: false, reason: 'Invalid target (not HTMLElement)' };
     }
     // target은 이제 HTMLElement로 타입 좁혀짐
   }

   async function detectMediaFromEvent(event: MouseEvent): Promise<MediaInfo | null> {
     const target = event.target;
     if (!target || !isHTMLElement(target)) return null;
     // instanceof HTMLElement → isHTMLElement로 교체
   }
   ```

3. **코어 유틸리티 수정** (`src/shared/utils/core-utils.ts`):

   ```typescript
   export function isGalleryInternalEvent(event: Event): boolean {
     const target = event.target;
     if (!isHTMLElement(target)) return false;
     return isInsideGallery(target);
   }
   ```

4. **테스트 추가** (`test/unit/shared/utils/element-type-guard.test.ts`):
   - `isHTMLElement` 타입 가드 검증 (7개 테스트)
   - `Document` 객체 → `false`
   - `Window` 객체 → `false`
   - `null`/`undefined` → `false`
   - 일반 객체 → `false`
   - 유효한 `HTMLElement` → `true`

**검증 결과**:

```bash
# 테스트
npx vitest --project fast run test/unit/shared/utils/element-type-guard.test.ts
✓ Phase 237, 241: Element Type Guard (13 tests) 38ms
  ✓ isHTMLElement (7 tests)
  ✓ isGalleryInternalElement (6 tests)

# 타입 체크
npm run typecheck  # ✅ 통과

# 전체 빌드
npm run build  # ✅ 성공
  - E2E: 82/82 통과
  - Browser: 111/111 통과
  - 번들 크기: 342.08 KB (↑0.3 KB, 목표 ≤420 KB)
```

**효과**:

- ❌ `Invalid element: matches is not a function` 경고 제거
- ✅ 타입 안전성 향상 (TypeScript narrowing)
- ✅ 코드 가독성 개선 (의도 명확화)
- ✅ 향후 유사 문제 예방 (`isHTMLElement` 재사용)

**영향 범위**:

- `src/shared/utils/utils.ts`: `isGalleryInternalEvent` 수정
- `src/shared/utils/events.ts`: `handleMediaClick`, `detectMediaFromEvent` 수정
- `src/shared/utils/core-utils.ts`: `isGalleryInternalEvent` 수정
- `test/unit/shared/utils/element-type-guard.test.ts`: 테스트 7개 추가

**참고**: Phase 135에서 이미 구현된 `isHTMLElement`를 활용하여 중복 코드 없이
문제 해결

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
