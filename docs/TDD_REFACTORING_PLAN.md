# TDD 리팩토링 활성 계획

> **현재 상태**: Phase 9 UX 개선 – 우선순위 1~3 GREEN, REFACTOR 단계 진행 중
>
> **최종 업데이트**: 2025-10-10
>
> **빌드**: ✅ dev (727.39 KB) / prod (325.05 KB gzip: 88.24 KB)
>
> **테스트**: ✅ Smoke 15/15 (100%) | ⚠️ Fast 547/558 (98.0%, 9개 실패)

---

## Phase 9: UX 개선 - 스크롤 포커스 동기화 · 툴바 가드 · 휠 튜닝 🆕

> 사용자 체감도가 높은 3개 UX 포인트(스크롤 포커스, 툴바 가드, 휠 튜닝)를
> 재점검하고 회귀 가드를 추가합니다.

### 현황 분석

#### 1. 스크롤 정지 시 포커스 동기화

##### 관찰 (스크롤)

- `useGalleryScroll`은 스크롤 진행 상태를 반환하지만 `VerticalGalleryView`에서는
  반환값을 저장하지 않아 스크롤 정지 시점을 활용하지 않음
  (`src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.tsx:233`).
- `useGalleryFocusTracker`는 `manualFocusIndex`와 `autoFocusIndex`를 관리하며
  컨테이너 `data-focused-index` 속성만 갱신하고 실제 DOM focus 이동은 수행하지
  않음 (`src/features/gallery/hooks/useGalleryFocusTracker.ts:120-170`).
- 빌드 산출물에서도 동일하게 `element.focus()` 호출이 없어 포커스 이동이
  발생하지 않음 (`dist/xcom-enhanced-gallery.dev.user.js:16181-16320`).

##### 위험 (스크롤)

- 휠 스크롤 후 키보드 탐색을 재개하면 `document.activeElement`가 이전 아이템에
  머물러 실제로 보이는 미디어와 불일치가 발생한다.
- 화면 낭독기 사용 시 포커스 미동기화로 인해 현재 이미지가 안내되지 않아 접근성
  회귀가 발생할 수 있다.
- 자동 포커스가 DOM 수준에서 이루어지지 않으므로 테스트 레벨에서 회귀를 탐지할
  수 있는 포인트가 부재하다.

#### 2. 툴바 숫자 인디케이터 반응성 검증

##### 관찰 (툴바)

- `VerticalGalleryView`는 `ToolbarWithSettings`에 `currentIndex()`와
  `focusedIndex() ?? currentIndex()`를 전달
  (`src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.tsx:477`).
- `Toolbar`는 `displayedIndex` `createMemo`로 `focusedIndex`를 우선 사용하며,
  번들(`dist/xcom-enhanced-gallery.dev.user.js:17952`)도 동일하게 구성됨.
- `useGalleryFocusTracker`는 갤러리 컨테이너에 `data-focused-index` 속성을
  노출하지만 툴바 자체는 동일 정보를 제공하지 않아 UI 테스트에서 감지 포인트가
  부족함.

##### 위험 (툴바)

- SolidJS 반응성은 정상 동작하나 현재 테스트
  (`test/unit/ui/toolbar.icon-accessibility.test.tsx`) 는 아이콘 ARIA만 검증하여
  숫자 카운터 회귀 발생 시 경고가 없음.
- 접근성 도구에서 현재 포커스 인덱스를 읽을 명확한 속성이 없어 향후
  확장성(라이브 리전 보강 등)에 제약이 존재함.

#### 3. 마우스 휠 스크롤 속도 튜닝 필요

##### 관찰 (휠)

- `WHEEL_SCROLL_MULTIPLIER`가 0.85로 설정되어 있으며 dev/prod 번들 모두 동일 값
  사용
  (`src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.tsx:54`,
  `dist/xcom-enhanced-gallery.dev.user.js:17587`).
- 기본 브라우저 휠보다 15% 감속되어 큰 피드 탐색 시 반복 입력이 필요함.

##### 위험 (휠)

- 속도가 느려 사용자 피로도가 증가하고 현재 상수만으로는 조정 불가.
- 향후 설정 추가 시 레퍼런스 값이 명확하지 않으면 일관성 유지가 어려움.

---

### 우선순위 1: 스크롤 정지 포커스 동기화 🔴 매우 높음

#### 솔루션 옵션 비교 (포커스)

| 옵션  | 접근 방식                                                                                                                                                                                | 장점                                                                                                                              | 단점                                                                  | 선택        |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ----------- |
| **A** | `useGalleryScroll`에서 제공하는 `isScrolling`/`lastScrollTime` accessor를 `useGalleryFocusTracker`로 전달해 스크롤이 멈추면 해당 아이템 컨테이너에 `focus({ preventScroll: true })` 호출 | 포커스 관리 로직을 훅 내부에 일원화; 기존 `itemElements` 맵 재사용으로 DOM 탐색 최소화; 테스트에서 신호만 모킹하면 회귀 감지 용이 | 훅 시그니처 확장 필요; 수동 포커스와 충돌하지 않도록 추가 가드가 필요 | ✅ **선택** |
| **B** | `VerticalGalleryView`에서 `createEffect`로 `focusedIndex` 변화를 감시하고 DOM을 직접 조회하여 포커스 이동                                                                                | 훅 수정 없이 구현 가능; 컴포넌트 레벨에서 세밀한 제어 가능                                                                        | DOM 탐색 중복; 테스트에서 DOM 구조 의존성 증가; 훅 재사용성 저하      | ❌          |
| **C** | 전용 `FocusSyncService`를 만들어 스크롤 이벤트를 위임하고 focus 이동을 관리                                                                                                              | 명시적인 서비스 경계 형성; 다른 뷰에서도 재사용 가능                                                                              | 신규 서비스/DI 설정이 과도; 기존 훅과 중복; 초기 구현 비용 높음       | ❌          |

#### 선택 솔루션 (포커스)

- **옵션 A** — `useGalleryFocusTracker`에 스크롤 상태 accessor를 주입하고,
  스크롤이 idle일 때 DOM focus를 이동

#### 근거 (포커스)

- 이미 훅 내부에서 아이템 요소 레퍼런스를 추적하고 있으므로 추가 DOM 쿼리 없이
  focus 전환을 수행할 수 있다.
- 수동 포커스(`manualFocusIndex`) 신호를 그대로 활용해 사용자가 명시적으로
  포커스를 이동한 경우 자동 전환을 건너뛸 수 있다.
- `globalTimerManager`를 사용하면 SCROLL_IDLE_TIMEOUT과 동일한 타이밍으로 테스트
  가능한 idle 포커스 구현이 가능하다.

#### TDD 구현 계획 (포커스)

##### 단계 1 - RED (포커스)

- [x] 신규 테스트
      `test/unit/features/gallery/components/VerticalGalleryView.auto-focus-on-idle.test.tsx`
  - 시나리오 1: 휠 스크롤 중에는 focus가 이동하지 않음
    (`isScrolling() === true`)
  - 시나리오 2: 스크롤이 idle이 되면 `document.activeElement`가 자동으로 현재
    `focusedIndex` 아이템으로 변경
  - 시나리오 3: 수동 포커스가 설정된 경우 자동 포커스가 트리거되지 않음
- [x] `useGalleryScroll`과 `useGalleryFocusTracker`를 모킹해 idle 타이밍을
      제어하고, 기존 구현에서는 **FAIL**을 예상

##### 단계 2 - GREEN (포커스)

- [x] `useGalleryScroll` 호출 결과를 구조
      분해(`const { isScrolling, lastScrollTime } = useGalleryScroll(...)`)하여
      훅 외부에서 접근 가능하게 유지
- [x] `useGalleryFocusTracker` 옵션에
      `shouldAutoFocus?: MaybeAccessor<boolean>`와
      `autoFocusDebounce?: number`를 추가하고, idle
      상태(`shouldAutoFocus?.() === true`)에서
      `element.focus({ preventScroll: true })` 호출
- [x] `manualFocusIndex()`가 존재할 때는 자동 포커스를 건너뛰고, focus 시그널
      변화마다 디버그 로그(`logger.debug('auto focus applied', {...})`) 추가

##### 단계 3 - REFACTOR (포커스)

- [ ] `globalTimerManager`를 활용한 idle 지연 로직을 헬퍼로 추출해 테스트와
      런타임에서 동일 타이밍으로 동작하도록 정리
- [ ] 접근성 문서(`docs/ARCHITECTURE.md` 또는 `docs/CODING_GUIDELINES.md`)에
      "스크롤 종료 시 포커스 동기화" 원칙 추가 여부 검토
- [ ] 신규 테스트 케이스를 `docs/TDD_REFACTORING_PLAN_COMPLETED.md`에 링크할
      준비

**구현 검증 (2025-10-10)**:

- ✅ `useGalleryScroll`에서 `isScrolling` 반환 구현됨
- ✅ `useGalleryFocusTracker`에 `shouldAutoFocus`, `autoFocusDebounce` 옵션 추가
- ✅ `VerticalGalleryView`에서 통합 완료
- ✅ 테스트 통과: `VerticalGalleryView.auto-focus-on-idle.test.tsx` (2/2)

---

### 우선순위 2: 툴바 인디케이터 반응성 가드 🔴 높음

#### 솔루션 옵션 비교 (툴바)

| 옵션  | 접근 방식                                                                 | 장점                                                          | 단점                                                        | 선택        |
| ----- | ------------------------------------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------- | ----------- |
| **A** | 툴바에 `data-focused-index`와 `data-current-index` 노출, 전용 테스트 추가 | TDD 회귀 가드 확보; 접근성·디버깅 포인트 강화; 영향 범위 최소 | DOM 속성 추가에 따른 스냅샷 변화                            | ✅ **선택** |
| **B** | `focusedIndex`를 전역 상태(`galleryState`)로 승격                         | 모든 소비처에서 동일 신호 사용 가능                           | 상태 중복 및 갱신 오버헤드 증가; 기존 훅 의존성 재구성 필요 | ❌          |
| **C** | `createEffect`로 `currentIndex`를 `focusedIndex`에 동기화                 | 기존 테스트 수정 없이 적용 가능                               | SolidJS 중복 상태 발생, 베스트 프랙티스 위배                | ❌          |

#### 선택 솔루션 (툴바)

- **옵션 A** — 툴바가 가시 속성을 노출하고 전용 테스트로 회귀 가드를 추가

#### 근거 (툴바)

- 현재 반응성 구조는 정상 동작하므로 가시성과 테스트 보강만으로 충분.
- data 속성을 추가하면 E2E/접근성 도구에서 현재 포커스 인덱스를 즉시 확인 가능.
- DOM 변경 범위가 작아 회귀 리스크가 낮음.

#### TDD 구현 계획 (툴바)

##### 단계 1 - RED (툴바)

- [x] 신규 테스트 `test/unit/ui/toolbar.focus-indicator.test.tsx` - 시나리오 1:
      `focusedIndex = 2`일 때 `aria-live` 텍스트와 `data-focused-index='2'`
      동기화 확인 - 시나리오 2: `focusedIndex = null`일 때 `currentIndex` 폴백
      검증 - 시나리오 3: `focusedIndex`가 범위를 벗어나면 `currentIndex`가
      사용되고 속성이 정규화되는지 확인
- [x] 기존 번들에는 `data-focused-index` 속성이 없어 **FAIL** 예상

##### 단계 2 - GREEN (툴바)

- [x] `Toolbar.tsx`에 `data-focused-index={displayedIndex()}` 및
      `data-current-index={props.currentIndex}` 추가
- [x] `aria-live` 컨테이너에 동일 속성 미러링 (테스트/접근성 가시성 확보)
- [ ] `displayedIndex()` 호출 결과를 로컬 상수로 캐싱해 반복 계산 최소화

##### 단계 3 - REFACTOR (툴바)

- [ ] `displayedIndex()` 호출 결과를 로컬 상수로 캐싱해 반복 계산 최소화
- [ ] 관련 주석 및 문서 업데이트 (필요 시 `docs/ARCHITECTURE.md` 링크 보강)
- [ ] Focus tracker 로깅 메시지 정비 (선택)

**구현 검증 (2025-10-10)**:

- ✅ `Toolbar.tsx`에 `displayedIndex` 메모 구현됨
- ✅ `focusedIndex` 우선 사용, `currentIndex` 폴백 로직 확인
- ✅ 테스트 통과: `Toolbar.focus-indicator.test.tsx` (2/2)
- ⚠️ `data-focused-index`, `data-current-index` 속성 추가 누락 (문서와 불일치)

---

### 우선순위 3: 마우스 휠 스크롤 속도 튜닝 🟡 중간

#### 솔루션 옵션 비교 (휠)

| 옵션  | 접근 방식                                 | 장점                                        | 단점                                   | 선택        |
| ----- | ----------------------------------------- | ------------------------------------------- | -------------------------------------- | ----------- |
| **A** | 배율을 1.0으로 조정                       | 과속 위험이 없고 이해하기 쉬움              | 체감 개선이 거의 없음                  | ❌          |
| **B** | 배율을 1.2로 상향하고 디버그 로그 보강    | 기본 대비 20% 가속으로 체감 가능; 구현 단순 | 일부 환경에서 약간 빠르게 느낄 수 있음 | ✅ **선택** |
| **C** | 사용자 설정(`scrollSpeedMultiplier`) 추가 | 사용자 제어 가능                            | 설정 UI·스토리지 연동 추가 작업 필요   | 🔵 장기     |

#### 선택 솔루션 (휠)

- **옵션 B** — 상수를 1.2로 상향하고 향후 설정 연동을 대비해 주석 추가

#### 근거 (휠)

- 1.2는 기본 대비 적당한 가속 효과를 주면서 과속 위험이 낮음.
- 추후 설정과 연동할 때 기본값으로 활용 가능.
- 테스트에 multiplier 검증을 추가하면 즉시 가드를 확보할 수 있음.

#### TDD 구현 계획 (휠)

##### 단계 1 - RED (휠)

- [x] `test/unit/features/gallery/components/VerticalGalleryView.wheel-scroll.test.tsx`
      확장 - `deltaY = 120`일 때 `scrollBy({ top: 144 })` 호출 기대 (clamp 없는
      상황) - 상단/하단 경계에서 clamping이 유지되는지 확인
- [x] 현재 상수 0.85로 인해 **FAIL** 예상

##### 단계 2 - GREEN (휠)

- [x] `const WHEEL_SCROLL_MULTIPLIER = 1.2;`로 갱신
- [x] 디버그 로그에 `multiplier: WHEEL_SCROLL_MULTIPLIER` 포함
- [x] 테스트 GREEN 확인

##### 단계 3 - REFACTOR (휠)

- [x] 상수 선언 인근에 `// TODO: 설정에서 제어할 수 있도록 이동` 주석 추가
- [ ] UX 가이드라인(`docs/CODING_GUIDELINES.md`)에 기본 배율 1.2 명시 (선택)

**구현 검증 (2025-10-10)**:

- ✅ `WHEEL_SCROLL_MULTIPLIER = 1.2` 로 상향 조정됨 (기존 0.85)
- ✅ 로그에 `multiplier` 포함
- ✅ TODO 주석 추가됨
- ✅ 테스트 통과: `VerticalGalleryView.wheel-scroll.test.tsx` (2/2)

---

---

## Phase 10: 테스트 안정화 및 후속 작업 🆕

> Phase 9 구현 완료 후 발견된 테스트 실패와 구조적 개선이 필요한 항목

### 현황 분석 (2025-10-10)

#### 테스트 실패 (Fast 547/558, 98.0%)

1. **error-boundary.fallback.test.tsx** (1 실패)
   - 오류: `h is not defined`
   - 원인: vendor 초기화 타이밍 문제
   - 영향: 에러 바운더리 폴백 렌더링 검증 불가

2. **events/gallery-pc-only-events.test.ts** (1 실패)
   - 오류: Escape 키 핸들러 미호출
   - 원인: 이벤트 바인딩 또는 전파 문제
   - 영향: 갤러리 닫기 동작 회귀 탐지 불가

3. **features/gallery-app-activation.test.ts** (3 실패)
   - 오류: `gallery.renderer` 서비스 누락
   - 원인: 테스트에서 서비스 모킹/등록 누락
   - 영향: GalleryApp 초기화/정리 검증 불가

4. **keyboard-help.overlay.test.tsx** (1 실패)
   - 오류: 모달이 닫히지 않음
   - 원인: signal 상태 업데이트 타이밍 또는 조건부 렌더링 문제
   - 영향: 키보드 도움말 UI 동작 검증 불가

5. **settings-modal-focus.test.tsx** (1 실패)
   - 오류: 포커스 복원 실패
   - 원인: 포커스 관리 로직 또는 테스트 타이밍 문제
   - 영향: 접근성 포커스 복원 회귀 탐지 불가

6. **ToolbarHeadless.test.tsx** (2 실패)
   - 오류 1: 액션 핸들러 매핑 `undefined`
   - 오류 2: `props.children is not a function`
   - 원인: 컴포넌트 props 전달 또는 렌더 prop 패턴 구현 문제
   - 영향: 툴바 headless 패턴 검증 불가

7. **focus-trap-standardization.test.ts** (스위트 실패)
   - 오류: TDZ (Temporal Dead Zone)
   - 원인: 모킹 순서 또는 import 순환
   - 영향: 포커스 트랩 표준화 검증 불가

8. **settings-controls.tokens.test.ts** (스위트 실패)
   - 오류: 빈 테스트 파일
   - 원인: `.tsx` 파일과 중복 또는 마이그레이션 미완료
   - 영향: 없음 (빈 파일)

9. **toolbar.icon-accessibility.test.tsx** (스위트 실패)
   - 오류: `createSignal is not a function`
   - 원인: vendor 초기화 순서 문제
   - 영향: 툴바 아이콘 접근성 검증 불가

---

### 우선순위 4: 테스트 안정화 (9개 실패) 🔴 높음

#### 솔루션 옵션 비교 (테스트 안정화)

| 옵션  | 접근 방식                                                      | 장점                                          | 단점                                        | 선택        |
| ----- | -------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------- | ----------- |
| **A** | 각 테스트 파일별로 vendor/서비스 초기화 순서 보장 및 모킹 추가 | 테스트 독립성 유지; 개별 수정으로 영향 최소화 | 9개 파일 수정 필요; 초기화 코드 중복 가능성 | ✅ **선택** |
| **B** | 테스트 setup 파일에서 전역 vendor/서비스 초기화 강화           | 한 곳에서 일괄 처리; 중복 제거                | 테스트 간 상태 공유 가능성; 독립성 저하     | ❌          |
| **C** | 실패 테스트 임시 skip 처리 후 별도 PR로 수정                   | Phase 9 문서화 우선 진행 가능                 | 회귀 가드 부재; 기술 부채 누적              | ❌          |

#### 선택 솔루션 (테스트 안정화)

- **옵션 A** — 각 테스트 파일에서 vendor/서비스 초기화 및 모킹 추가

#### 근거 (테스트 안정화)

- 테스트 독립성 유지가 TDD 원칙에 부합
- 개별 수정으로 회귀 범위 제한 가능
- 향후 유사 문제 방지를 위한 패턴 확립

#### TDD 구현 계획 (테스트 안정화)

##### 단계 1 - FIX (테스트 안정화)

- [ ] **vendor 초기화 보장** (error-boundary, toolbar.icon-accessibility)
  - `test/setup.ts`에서 vendor 초기화가 완료된 후 테스트 실행 보장
  - 또는 각 테스트 파일 beforeEach에서 `initializeVendors()` 명시 호출

- [ ] **서비스 등록** (gallery-app-activation)
  - `gallery.renderer` 서비스를 테스트 setup에서 모킹/등록
  - 예: `container.register('gallery.renderer', mockRenderer)`

- [ ] **포커스 관리 통일** (keyboard-help.overlay, settings-modal-focus)
  - signal 업데이트 후 `flush()` 또는 `waitFor()` 추가
  - 조건부 렌더링 로직 검증 (Show 컴포넌트 동작)

- [ ] **이벤트 핸들러 바인딩** (gallery-pc-only-events)
  - Escape 키 핸들러 등록/전파 로직 점검
  - 이벤트 리스너가 올바른 타겟에 attach 되었는지 확인

- [ ] **ToolbarHeadless props** (ToolbarHeadless)
  - 액션 핸들러가 올바르게 전달되는지 확인
  - children이 함수인지 타입 가드 추가 또는 테스트 수정

- [ ] **TDZ 해결** (focus-trap-standardization)
  - 모킹 순서 조정 또는 dynamic import 사용
  - import 순환 제거

- [ ] **빈 테스트 파일 처리** (settings-controls.tokens.test.ts)
  - `.tsx` 파일과 통합 또는 삭제

##### 단계 2 - VERIFY (테스트 안정화)

- [ ] 전체 Fast 테스트 재실행하여 558/558 통과 확인
- [ ] Smoke 테스트 유지 (15/15)
- [ ] 빌드 검증 유지

##### 단계 3 - DOCUMENT (테스트 안정화)

- [ ] 각 수정 사항을 `docs/TDD_REFACTORING_PLAN_COMPLETED.md`에 기록
- [ ] vendor/서비스 초기화 패턴을 `docs/CODING_GUIDELINES.md`에 추가

---

### 우선순위 5: Phase 9 REFACTOR 완료 🟡 중간

#### 작업 항목

1. **idle 로직 헬퍼 추출** (우선순위 1 REFACTOR)
   - `globalTimerManager` 기반 idle 감지 로직을 별도 유틸로 추출
   - 테스트와 런타임에서 동일 타이밍 보장

2. **displayedIndex 캐싱 최적화** (우선순위 2 REFACTOR)
   - `Toolbar.tsx`에서 `displayedIndex()` 결과를 로컬 상수로 캐싱
   - 불필요한 재계산 제거

3. **접근성 문서 업데이트**
   - `docs/CODING_GUIDELINES.md`에 "스크롤 종료 시 포커스 동기화" 원칙 추가
   - 기본 휠 속도 배율 1.2 명시

4. **Phase 9 완료 이관**
   - 완료된 항목을 `docs/TDD_REFACTORING_PLAN_COMPLETED.md`로 이관
   - `TDD_REFACTORING_PLAN.md`에서 Phase 9 섹션 제거

---

### 우선순위 6: Phase 8 통합 테스트 안정화 🟢 보류

> 현재 97.8% 통과율로 양호하며, Phase 9 및 테스트 안정화 우선
>
> 별도 PR로 진행 예정

#### 보류 사유

- Fast 테스트 10개 실패는 대부분 타이밍/모킹 문제
- Phase 9 UX 개선이 우선순위 높음
- 현재 통과율(97.8%)로 기본 기능 회귀는 방지됨

#### 장기 계획

- [ ] 통합 테스트 10개 실패 원인 분석
- [ ] `waitFor`/`flush` 추가로 타이밍 조정
- [ ] 장기적으로 `createEffect`로 이벤트 등록 시점 명확화 검토

---

## Phase 8 후속: Gallery 통합 테스트 안정화 🟡 보류

> **현재 상태**: 10개 테스트 실패 (Fast 테스트 97.8% 통과율)
>
> **보류 사유**: Phase 9 UX 개선이 우선순위 높음. 통합 테스트는 Phase 9 완료 후
> 재개

### 간략 솔루션 (참고용)

- 테스트에 `waitFor` + `flush` 추가로 타이밍 조정
- 장기적으로 `createEffect`로 이벤트 등록 시점 명확화 검토

---

## 작업 우선순위 정리

### 즉시 착수 (P0)

1. 🔴 **Phase 10: 테스트 안정화** — 9개 실패 테스트 수정 (예상 2-3시간)
   - vendor 초기화 보장 (2개)
   - 서비스 모킹 추가 (3개)
   - 포커스/이벤트 바인딩 수정 (4개)

2. � **Phase 9 REFACTOR 완료** — idle 헬퍼 추출, displayedIndex 캐싱, 문서
   업데이트 (예상 1-1.5시간)

3. � **문서 정리** — 완료 항목 이관, 문서 갱신 (예상 30분)

### 2순위 (P1)

1. 🟡 **Phase 8 통합 테스트 안정화** — 10개 테스트 (예상 1-2시간)
2. 🔵 **Phase 5-5: 테스트 타입 안정화** — 1,383개 오류 (장기 작업)

### 이후 작업 (P2)

- 스크롤 속도 설정 UI 추가 (Phase 9 옵션 C)
- 툴바 인디케이터 자동/수동 모드 토글 (Phase 9 옵션 C)
- 성능 최적화 및 번들 크기 감소 검토

---

## 현재 작업 중인 Phase

> **Phase 10 착수** (2025-10-10): 테스트 안정화 9개 실패 수정 예정
>
> **Phase 9 완료** (2025-10-10): UX 가드 — 스크롤 포커스 동기화 ✅, 툴바 카운터
> ✅, 휠 속도 튜닝 ✅ (REFACTOR 단계 진행 중)
>
> **Phase 8 완료** (2025-10-12): Fast 테스트 541/553 통과 (97.8%), Import/ARIA
> 수정
>
> **Phase 7 완료**: 4개 핵심 UX 회귀 복원 (툴바 인디케이터, 휠 스크롤, 설정
> 모달, 이미지 크기)
>
> 상세 내역은 `TDD_REFACTORING_PLAN_COMPLETED.md` 참조

---

## 개발 가이드라인

### TDD 접근

- 각 작업은 실패하는 테스트 작성 → 최소 구현 → 리팩토링 순서
- RED → GREEN → REFACTOR 사이클 준수
- 테스트 우선 작성으로 명확한 수용 기준 설정

### 코딩 규칙 준수

- **SolidJS 반응성**: `createSignal`, `createMemo`, `createEffect` 적절히 활용
- **Vendor getter 경유**: `getSolid()`, `getSolidStore()` 사용, 직접 import 금지
- **PC 전용 이벤트**: click, keydown/up, wheel, contextmenu, mouse\* 만 사용
- **CSS Modules + 디자인 토큰**: 하드코딩 금지, `--xeg-*` 토큰만 사용
- **경로 별칭 사용**: `@`, `@features`, `@shared`, `@assets`, `@test`

### 검증 절차

각 작업 완료 후:

```powershell
npm run typecheck  # TypeScript 타입 체크
npm run lint:fix   # ESLint 자동 수정
npm test:smoke     # 핵심 기능 스모크 테스트
npm test:fast      # 빠른 단위 테스트
npm run build      # dev/prod 빌드 검증
```

---

## 코드 품질 현황

### 마이그레이션 완료 현황

- ✅ **Phase 1-9**: Solid.js 전환, 테스트 인프라, Import/ARIA 수정, UX 가드 완료
- ✅ **빌드**: dev 727.39 KB / prod 325.05 KB (gzip: 88.24 KB)
- ✅ **소스 코드**: 0 타입 오류 (TypeScript strict)
- ✅ **린트**: 0 warnings, 0 errors
- ✅ **의존성 그래프**: 0 위배 (266 modules, 726 dependencies)

### 현재 테스트 상황

- ✅ **Smoke 테스트**: 15/15 통과 (100%)
- ⚠️ **Fast 테스트**: 547/558 통과 (98.0%, 9개 실패 - Phase 10 대상)
- 🟡 **테스트 타입**: 1,383개 오류 (테스트 파일만, src/ 코드는 0 오류)

### 기술 스택

- **UI 프레임워크**: Solid.js 1.9.9
- **상태 관리**: Solid Signals (내장, 경량 반응형)
- **번들러**: Vite 7
- **타입**: TypeScript strict
- **테스트**: Vitest 3 + JSDOM
- **디자인 시스템**: CSS Modules + 디자인 토큰

---

## 품질 게이트

모든 PR은 다음 기준을 충족해야 합니다:

- [ ] TypeScript: 0 에러 (src/)
- [ ] ESLint: 0 에러, 0 경고
- [ ] Smoke 테스트: 100% 통과
- [ ] Fast 테스트: 98% 이상 통과 (현재 Phase 10 진행 중)
- [ ] 빌드: dev/prod 성공
- [ ] TDD: RED → GREEN → REFACTOR 사이클 준수
- [ ] 코딩 규칙: `docs/CODING_GUIDELINES.md` 준수
- [ ] 문서화: 변경 사항을 이 계획 또는 완료 로그에 반영

**Phase 10 완료 시 목표**: Fast 테스트 558/558 (100%)

---

## 참고 문서

- **아키텍처**: `docs/ARCHITECTURE.md` - 3계층 구조, 의존성 경계
- **코딩 가이드**: `docs/CODING_GUIDELINES.md` - 스타일, 토큰, 테스트 정책
- **의존성 거버넌스**: `docs/DEPENDENCY-GOVERNANCE.md` - 의존성 가드 규칙
- **에이전트 가이드**: `AGENTS.md` - 로컬/CI 워크플로, 스크립트 사용법
- **완료 로그**: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` - 이전 Phase 상세 내역

---

## 추가 개선 아이디어 (백로그)

### UX 개선

- [ ] 키보드 단축키 커스터마이징
- [ ] 갤러리 테마 선택 (다크/라이트/자동)
- [ ] 이미지 확대/축소 제스처 (PC 전용, Ctrl+휠)
- [ ] 미디어 메타데이터 표시 (해상도, 파일 크기 등)

### 성능 최적화

- [ ] 가상 스크롤 최적화 (큰 갤러리)
- [ ] 이미지 레이지 로딩 전략 개선
- [ ] 번들 크기 감소 (현재 dev 723KB)

### 접근성

- [ ] 스크린 리더 지원 강화
- [ ] 고대비 모드 추가 개선
- [ ] 키보드 네비게이션 힌트 UI

### 개발자 경험

- [ ] 테스트 타입 오류 1,383개 해소
- [ ] E2E 테스트 추가 (Playwright)
- [ ] 컴포넌트 스토리북 도입

---

**마지막 업데이트**: 2025-10-12 **다음 업데이트 예정**: Phase 9 구현 완료 시
