# TDD 리팩토링 활성 계획

> **현재 상태**: Phase 9 UX 개선 작업 계획 수립
>
> **최종 업데이트**: 2025-10-12

---

## Phase 9: UX 개선 - 툴바 인디케이터 자동 갱신 및 스크롤 속도 증가 🆕 계획 중

> 사용자 경험을 개선하기 위한 두 가지 핵심 기능 개선

### 현황 분석

#### 1. 툴바 숫자 인디케이터 자동 갱신 문제

**현재 구현 상태**:

- `useGalleryFocusTracker` 훅이 IntersectionObserver로 실제 뷰포트에 보이는
  아이템을 추적 (`focusedIndex`)
- `VerticalGalleryView`에서 `currentIndex`와 `focusedIndex`를 모두 관리
- 하지만 `focusedIndex`가 툴바 표시에 **반영되지 않음** - `currentIndex`만 사용
  중
- **충돌**: 사용자가 스크롤로 다른 이미지를 보고 있어도 툴바는 이전 인덱스 표시

**SolidJS 베스트 프랙티스 위반**:

- 반응형 값(`focusedIndex`)이 생성되지만 UI에 연결되지 않음
- `createEffect`를 통한 자동 동기화가 없어 불필요한 중복 상태 존재

#### 2. 마우스 휠 스크롤 속도 문제

**현재 구현 상태**:

- `VerticalGalleryView`의 휠 핸들러: `delta * 0.5` 배율 (속도 **감소**)
- 상수명: `WHEEL_SCROLL_MULTIPLIER = 0.5`
- 위치:
  `src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.tsx:228`

**문제점**:

- 기본 스크롤보다 느려서 답답한 UX
- 사용자 조정 불가능한 고정값

---

### 우선순위 1: 툴바 인디케이터 자동 갱신 구현 🔴 높음

#### 솔루션 옵션 비교

| 옵션  | 접근 방식                                                          | 장점                                                                    | 단점                                                | 선택         |
| ----- | ------------------------------------------------------------------ | ----------------------------------------------------------------------- | --------------------------------------------------- | ------------ |
| **A** | `focusedIndex`를 `currentIndex`에 동기화<br/>(`createEffect` 사용) | - 기존 구조 유지<br/>- 최소 변경                                        | - 상태 업데이트 오버헤드<br/>- 중복 상태 유지       | ❌           |
| **B** | 툴바가 `focusedIndex`를 직접 사용<br/>(fallback: `currentIndex`)   | - **SolidJS 반응성 최대 활용**<br/>- 중복 상태 제거<br/>- 자동 업데이트 | - Toolbar props 소폭 변경<br/>- 기존 로직 검토 필요 | ✅ **선택**  |
| **C** | 설정으로 자동/수동 모드 선택                                       | - 사용자 선택권 제공<br/>- 유연성                                       | - 복잡도 증가<br/>- 설정 UI 추가 필요               | 🔵 장기 검토 |

**선택 솔루션**: **옵션 B** - `focusedIndex ?? currentIndex`로 툴바에 전달

**근거**:

- SolidJS의 반응형 시스템을 정확히 활용
- `focusedIndex`가 null일 때 `currentIndex`로 안전하게 폴백
- 추가 `createEffect` 없이 자동 업데이트 달성
- 코드 간결성 및 유지보수성 향상

#### TDD 구현 계획

**1단계: RED - 실패 테스트 작성**

- [ ] 테스트 파일: `test/unit/features/gallery/toolbar-focused-index.test.tsx`
      (신규)
- [ ] 시나리오 1: 스크롤 시 `focusedIndex` 변경 감지
- [ ] 시나리오 2: 툴바 표시가 `focusedIndex` 반영 확인
- [ ] 시나리오 3: `focusedIndex === null`일 때 `currentIndex` 폴백
- [ ] 예상 결과: 모든 테스트 **FAIL** (현재 구현은 `currentIndex`만 사용)

**2단계: GREEN - 최소 구현**

- [ ] `VerticalGalleryView.tsx` 수정:

  ```tsx
  // 변경 전 (라인 477)
  currentIndex={currentIndex()}

  // 변경 후
  currentIndex={focusedIndex() ?? currentIndex()}
  ```

- [ ] `createMemo`로 표시 인덱스 메모이제이션 (선택사항):
  ```tsx
  const displayIndex = createMemo(() => focusedIndex() ?? currentIndex());
  ```
- [ ] 로깅 추가: 인덱스 변경 시 디버그 로그 출력
- [ ] 예상 결과: 모든 테스트 **PASS**

**3단계: REFACTOR - 코드 정리**

- [ ] 주석 추가: "자동 감지된 focusedIndex 우선 사용, fallback으로 currentIndex"
- [ ] 타입 안전성 검증: Toolbar props가 올바른 타입 수용 확인
- [ ] 중복 로직 제거: 불필요한 상태 동기화 코드 정리

---

### 우선순위 2: 마우스 휠 스크롤 속도 증가 🟡 중간

#### 솔루션 옵션 비교

| 옵션  | 접근 방식                          | 장점                                 | 단점                             | 선택         |
| ----- | ---------------------------------- | ------------------------------------ | -------------------------------- | ------------ |
| **A** | 배율을 **1.0**으로 증가 (현재 0.5) | - 즉시 적용 가능<br/>- 구현 단순     | - 고정값, 조정 불가              | ✅ **1단계** |
| **B** | 배율을 **1.5**로 설정 (더 빠름)    | - 더 민첩한 스크롤<br/>- 단순        | - 과도하게 빠를 수 있음          | 🔵 검토      |
| **C** | 설정으로 속도 조정 가능            | - 사용자 선호 반영<br/>- 유연성 최대 | - 설정 UI 필요<br/>- 복잡도 증가 | 🔵 장기      |
| **D** | 휠 델타에 따라 동적 조정           | - 자연스러운 UX<br/>- 직관적         | - 튜닝 필요<br/>- 테스트 복잡    | 🔵 장기      |

**선택 솔루션**: **옵션 A (즉시)** + **옵션 C (장기 검토)**

**근거**:

- 1.0 배율은 브라우저 기본 스크롤과 동일한 속도 제공
- 현재 0.5는 명백히 너무 느림 (사용자 피드백)
- 추후 설정 UI에서 0.5 ~ 2.0 범위 조정 가능하도록 확장 고려

#### TDD 구현 계획

**1단계: RED - 실패 테스트 작성**

- [ ] 테스트 파일: `test/unit/features/gallery/wheel-scroll-speed.test.tsx`
      (신규)
- [ ] 시나리오 1: 휠 이벤트 `deltaY = 100` 발생 시 스크롤 거리 검증
- [ ] 시나리오 2: 배율 1.0 적용 시 `scrollBy` 호출 인자 확인
- [ ] 예상 결과: 현재 0.5 배율로 **FAIL**

**2단계: GREEN - 최소 구현**

- [ ] `VerticalGalleryView.tsx` 수정:

  ```tsx
  // 변경 전 (상단 상수)
  const WHEEL_SCROLL_MULTIPLIER = 0.5;

  // 변경 후
  const WHEEL_SCROLL_MULTIPLIER = 1.0; // 브라우저 기본 속도
  ```

- [ ] 로깅 업데이트: 적용된 배율을 디버그 로그에 포함
- [ ] 예상 결과: 테스트 **PASS**

**3단계: REFACTOR - 확장성 고려**

- [ ] 상수를 파일 상단으로 이동 (향후 설정 연동 준비)
- [ ] 주석 추가: "// TODO: 향후 사용자 설정으로 조정 가능하도록 확장"
- [ ] 설정 스키마에 `scrollSpeedMultiplier` 필드 예약 (주석 처리)

---

## Phase 8 후속: Gallery 통합 테스트 안정화 🟡 보류

> **현재 상태**: 10개 테스트 실패 (Fast 테스트 97.8% 통과율)
>
> **보류 사유**: Phase 9 UX 개선이 우선순위 높음. 통합 테스트는 Phase 9 완료 후
> 재개

#### 간략 솔루션 (참고용)

- 테스트에 `waitFor` + `flush` 추가로 타이밍 조정
- 장기적으로 `createEffect`로 이벤트 등록 시점 명확화 검토

---

## 작업 우선순위 정리

### 즉시 착수 (P0)

1. 🔴 **툴바 인디케이터 자동 갱신** — SolidJS 베스트 프랙티스, 사용자 혼란 해소
   (예상 1시간)
2. � **마우스 휠 스크롤 속도 증가** — 답답한 UX 개선 (예상 30분)

### 2순위 (P1)

1. 🟡 **Gallery 통합 테스트 안정화** — 10개 테스트 (예상 1-2시간)
2. Phase 5-5: 테스트 타입 안정화 (1,383개 오류) — 장기 작업

### 이후 작업 (P2)

- 스크롤 속도 설정 UI 추가 (옵션 C)
- 툴바 인디케이터 자동/수동 모드 토글 (옵션 C)
- 성능 최적화 및 번들 크기 감소 검토

---

## 현재 작업 중인 Phase

> **Phase 9 계획 수립 완료** (2025-10-12): UX 개선 - 툴바 자동 갱신 및 스크롤
> 속도
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

- ✅ **Phase 1-8**: Solid.js 전환, 테스트 인프라, Import/ARIA 수정 완료
- ✅ **빌드**: dev 723.60 KB / prod 성공
- ✅ **소스 코드**: 0 타입 오류 (TypeScript strict)
- ✅ **린트**: 0 warnings, 0 errors
- ✅ **의존성 그래프**: 1개 정보 메시지 (비크리티컬)

### 현재 테스트 상황

- ✅ **Smoke 테스트**: 15/15 통과 (100%)
- 🟡 **Fast 테스트**: 541/553 통과 (97.8%, +4개 개선)
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
- [ ] Fast 테스트: 95% 이상 통과
- [ ] 빌드: dev/prod 성공
- [ ] TDD: RED → GREEN → REFACTOR 사이클 준수
- [ ] 코딩 규칙: `docs/CODING_GUIDELINES.md` 준수
- [ ] 문서화: 변경 사항을 이 계획 또는 완료 로그에 반영

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
