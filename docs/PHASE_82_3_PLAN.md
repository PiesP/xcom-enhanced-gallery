# Phase 82.3: 키보드 이벤트 & 성능 E2E 테스트 마이그레이션

> **시작**: 2025-10-16 | **상태**: 활성화 🚀 **목표**: 스킵된 JSDOM 키보드/성능
> 테스트 8-10개 → E2E(Playwright) 전환 **예상 시간**: 5-6시간

---

## 1. 마이그레이션 대상 분류

### 1.1 키보드 네비게이션 (5개 테스트)

#### Test K1: ArrowLeft 네비게이션

- **대상**: `use-gallery-keyboard-navigation.test.ts`
- **목적**: 왼쪽 화살표 키 입력 시 이전 아이템으로 이동
- **검증**:
  - currentIndex 감소
  - data-focused 속성 업데이트
  - 포커스 요소 변경

#### Test K2: ArrowRight 네비게이션

- **대상**: `use-gallery-keyboard-navigation.test.ts`
- **목적**: 오른쪽 화살표 키 입력 시 다음 아이템으로 이동
- **검증**: currentIndex 증가, 포커스 요소 변경

#### Test K3: Home/End 키 점프

- **대상**: `use-gallery-keyboard-navigation.test.ts`
- **목적**: Home/End 키로 첫/마지막 아이템으로 점프
- **검증**: currentIndex가 0 또는 totalCount-1로 변경

#### Test K4: Space 키 (다운로드/액션)

- **대상**: `use-gallery-keyboard-interaction.test.ts` (예상)
- **목적**: Space 키로 다운로드 트리거
- **검증**: onDownloadCurrent 핸들러 호출

#### Test K5: M 키 (음소거/토글)

- **대상**: `use-gallery-keyboard-interaction.test.ts` (예상)
- **목적**: M 키로 토글 기능 실행
- **검증**: 상태 토글 확인

#### Test K6: Escape 키 (갤러리 닫기)

- **대상**: `use-gallery-keyboard-interaction.test.ts` (예상)
- **목적**: Escape 키로 갤러리 패널 닫기
- **검증**: onClose 핸들러 호출, 갤러리 숨김

### 1.2 성능 최적화 (3개 테스트)

#### Test P1: 렌더링 성능

- **목적**: 각 키보드 입력 후 렌더링 시간 측정
- **기준**: 첫 렌더링 < 50ms, 이후 < 16ms (60fps)
- **검증**: performance.measureUserAgentSpecificMemory() 활용

#### Test P2: 스크롤 성능

- **목적**: 스크롤 중 프레임 드롭 측정
- **기준**: 스크롤 중 프레임 유지율 > 95%
- **검증**: requestAnimationFrame 콜 수 추적

#### Test P3: 메모리 사용량

- **목적**: 장시간 네비게이션 시 메모리 누수 확인
- **기준**: 메모리 증가 < 10MB (1000 네비게이션)
- **검증**: 종료 후 메모리 확인

---

## 2. Harness API 확장 (필요시)

### 2.1 키보드 이벤트 시뮬레이션

```typescript
// playwright/harness/index.ts - 추가 메서드
async function simulateKeyboardEventHarness(
  key: 'ArrowLeft' | 'ArrowRight' | 'Home' | 'End' | 'Space' | 'Escape' | 'm',
  options?: { shiftKey?: boolean; ctrlKey?: boolean }
): Promise<void> {
  // 실제 키보드 입력 시뮬레이션
  await page.keyboard.press(key);
  await page.waitForTimeout(16); // 1프레임 대기
}

async function getKeyboardNavigationStateHarness(): Promise<{
  currentIndex: number;
  totalCount: number;
  isNavigating: boolean;
}> {
  // 현재 네비게이션 상태 조회
}
```

### 2.2 성능 메트릭 수집

```typescript
async function measureKeyboardPerformanceHarness(): Promise<{
  renderTime: number;
  memory: number;
  frameDrops: number;
}> {
  // performance API 활용한 메트릭 수집
}
```

---

## 3. 구현 순서 (TDD 방식)

### Phase 1: 기본 키보드 네비게이션 (2시간)

1. **Test K1-K3 실패 테스트 작성** (RED)
   - `playwright/smoke/keyboard-navigation.spec.ts` 생성
   - ArrowLeft/Right/Home/End 키 입력 후 동작 검증
   - 스켈레톤: `expect(true).toBeTruthy()`

2. **Harness API 최소 구현** (GREEN)
   - `simulateKeyboardEventHarness()` 구현
   - `getKeyboardNavigationStateHarness()` 구현
   - 키 입력 후 상태 조회 기능

3. **테스트 상세 구현**
   - 각 키 입력 후 currentIndex 변경 검증
   - data-focused 속성 동기화 검증
   - 리팩토링: 반복 코드 추출

### Phase 2: 특수 키 & 상호작용 (1.5시간)

1. **Test K4-K6 구현**
   - Space/M/Escape 키 핸들러
   - 이벤트 핸들러 호출 검증
   - 토글 상태 검증

### Phase 3: 성능 메트릭 (1.5시간)

1. **Test P1-P3 구현**
   - Performance API 활용한 렌더링 시간 측정
   - 메모리 누수 검증
   - 프레임 드롭 추적

### Phase 4: 검증 & 정리 (1시간)

1. **빌드 & 검증**
   - `npm run build` (328.46 KB 유지 확인)
   - `npm test` (모든 테스트 GREEN 확인)
   - `npm run typecheck` (0 errors)
   - ESLint (0 warnings)

2. **문서 업데이트**
   - TDD_REFACTORING_PLAN.md: Phase 82.3 완료 표시
   - TDD_REFACTORING_PLAN_COMPLETED.md: Phase 82.3 기록 추가

---

## 4. 테스트 파일 구조

```
playwright/smoke/
├── keyboard-navigation.spec.ts (Tests K1-K3)
│   ├─ describe('Keyboard Navigation')
│   │  ├─ test('ArrowLeft navigates to previous item')
│   │  ├─ test('ArrowRight navigates to next item')
│   │  └─ test('Home/End jumps to first/last item')
│
└── keyboard-interaction.spec.ts (Tests K4-K6)
    └─ describe('Keyboard Interaction & Performance')
       ├─ test('Space key triggers download')
       ├─ test('M key toggles feature')
       ├─ test('Escape key closes gallery')
       ├─ test('Rendering performance < 50ms')
       ├─ test('Scroll maintains 95%+ frame rate')
       └─ test('Memory stable after 1000 navigations')
```

---

## 5. 검증 기준

### 테스트

- ✅ 8-10개 E2E 테스트 모두 GREEN
- ✅ 스킵 테스트 0개 (모두 E2E로 이관)
- ✅ 전체 테스트 통과율 100% 유지

### 빌드

- ✅ 번들 크기 328.46 KB 유지 (±1%)
- ✅ TypeScript 0 errors
- ✅ ESLint 0 warnings
- ✅ 모든 검증 PASS

### 성능

- ✅ 키보드 반응성 < 50ms
- ✅ 스크롤 프레임 > 95%
- ✅ 메모리 안정성 확인

### 문서

- ✅ TDD_REFACTORING_PLAN.md 업데이트
- ✅ COMPLETED 파일에 Phase 82.3 기록

---

## 6. 위험 요소 및 완화 전략

| 위험                           | 영향 | 완화 전략                          |
| ------------------------------ | ---- | ---------------------------------- |
| 성능 메트릭 불안정             | 중간 | 여러 실행 평균값 사용, 환경 제어   |
| Playwright 키 입력 이벤트 전파 | 중간 | 실제 핸들러 검증으로 보완          |
| 메모리 측정 정확도             | 낮음 | 기본 수준만 검증, 엄격한 기준 회피 |

---

## 7. 다음 단계

- **Phase 82.3 완료 후**:
  - 문서 업데이트 및 정리
  - 마스터로 병합
  - **Phase 81 (번들 최적화)** 또는 **Phase 83** 평가

---

**상태**: 준비 완료 ✅ | **시작 시간**: 2025-10-16 09:30 KST
