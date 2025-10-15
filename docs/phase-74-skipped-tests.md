# Phase 74: Skipped 테스트 재활성화

> **목표**: 기술 부채 해소 및 테스트 커버리지 개선 **시작일**: 2025-10-15 **예상
> 시간**: 2-3시간

---

## 현황 분석

### Skipped 테스트 목록 (10개)

#### 1. use-gallery-focus-tracker-global-sync.test.ts (4개)

**파일 경로**: `test/unit/hooks/use-gallery-focus-tracker-global-sync.test.ts`

1. `autoFocusIndex가 null로 변경되면 setFocusedIndex(null)을 호출해야 함` (L108)
   - **이유**: debounce 타이밍 이슈
   - **대응**: fake timers 사용

2. `handleItemFocus로 manualFocusIndex 설정 시 전역 setFocusedIndex 호출 안 함`
   (L179)
   - **이유**: debounce 타이밍 이슈
   - **대응**: fake timers 사용

3. `컨테이너 accessor가 일시적으로 null이어도 focusedIndex를 null로 초기화하지 않음`
   (L214)
   - **이유**: debounce 타이밍 이슈
   - **대응**: fake timers 사용

4. `짧은 시간 내 여러 번 autoFocusIndex 변경 시 debounce로 한 번만 호출` (L275)
   - **이유**: debounce 타이밍 이슈
   - **대응**: fake timers 사용

#### 2. use-gallery-focus-tracker-events.test.ts (3개)

**파일 경로**: `test/unit/hooks/use-gallery-focus-tracker-events.test.ts`

1. `should not override manualFocusIndex with navigation events` (L181)
   - **이유**: debounce 타이밍 이슈
   - **대응**: fake timers 사용

2. `should synchronize immediately without waiting for IntersectionObserver`
   (L219)
   - **이유**: debounce 타이밍 이슈
   - **대응**: fake timers 사용

3. `should schedule auto focus with delay after navigation` (L270)
   - **이유**: debounce 타이밍 이슈
   - **대응**: fake timers 사용

#### 3. use-gallery-focus-tracker-deduplication.test.ts (1개)

**파일 경로**:
`test/unit/features/gallery/hooks/use-gallery-focus-tracker-deduplication.test.ts`

1. `다른 인덱스로 변경 시에는 autoFocus 재적용` (L98)
   - **이유**: debounce 타이밍 이슈
   - **대응**: fake timers 사용

#### 4. toolbar-focus-indicator.test.tsx (1개)

**파일 경로**: `test/unit/features/toolbar-focus-indicator.test.tsx`

1. `syncs counter and progress with focused index even when it diverges from current index`
   (L65)
   - **이유**: Solid.js rerender 패턴 미지원
   - **대응**: 제거 또는 다른 방식으로 재작성

#### 5. toolbar-layout-stability.test.tsx (1개)

**파일 경로**: `test/unit/components/toolbar-layout-stability.test.tsx`

1. `설정 패널 확장/축소 상태를 data-expanded로 추적해야 함 (E2E 이관)` (L80)
   - **이유**: E2E 테스트로 이관 (정당한 skip)
   - **대응**: skip 유지 (제거하지 않음)

---

## 구현 계획

### 단계 1: 분석 및 전략 수립 (30분)

- [x] Skipped 테스트 목록 파악
- [ ] 각 테스트의 skip 이유 확인
- [ ] 해결 전략 수립

### 단계 2: debounce 타이밍 이슈 해결 (1.5시간)

**대상**: 8개 테스트 (파일 3개)

**전략**: Vitest fake timers 사용

```typescript
import { vi, beforeEach, afterEach } from 'vitest';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

// 테스트 내부
await vi.advanceTimersByTimeAsync(300); // debounce 대기 시간
```

**작업 순서**:

1. `use-gallery-focus-tracker-global-sync.test.ts` (4개)
2. `use-gallery-focus-tracker-events.test.ts` (3개)
3. `use-gallery-focus-tracker-deduplication.test.ts` (1개)

### 단계 3: Solid.js rerender 패턴 대응 (30분)

**대상**: `toolbar-focus-indicator.test.tsx` (1개)

**전략**: 2가지 옵션

**옵션 A**: 테스트 제거

- 장점: 빠름
- 단점: 커버리지 손실

**옵션 B**: 다른 방식으로 재작성 (권장)

- 장점: 커버리지 유지
- 단점: 시간 소요
- 방법: remount 패턴 사용 (dispose → mount)

**선택**: 옵션 B (remount 패턴)

### 단계 4: E2E 이관 테스트 정리 (10분)

**대상**: `toolbar-layout-stability.test.tsx` (1개)

**전략**: skip 유지 (정당한 이유)

- E2E 테스트로 이미 이관됨 (Playwright)
- skip 주석 명확화

### 단계 5: 검증 (30분)

- [ ] 전체 테스트 실행: `npm test`
- [ ] 통과율 확인: 985 passing → 993+ passing (목표: 99%+)
- [ ] 빌드 검증: `npm run build`
- [ ] 타입 체크: `npm run typecheck`

---

## 예상 결과

### Before

| 항목          | 값    |
| ------------- | ----- |
| **총 테스트** | 997개 |
| **Passing**   | 985개 |
| **Failed**    | 2개   |
| **Skipped**   | 10개  |
| **통과율**    | 98.7% |

### After (목표)

| 항목          | 값     |
| ------------- | ------ |
| **총 테스트** | 997개  |
| **Passing**   | 993+개 |
| **Failed**    | 2개    |
| **Skipped**   | 1-2개  |
| **통과율**    | 99.5%+ |

---

## 리스크 및 대응

### 리스크 1: fake timers 부작용

**증상**: 다른 테스트에 영향 **대응**: `beforeEach`/`afterEach`에서 명확히
setup/cleanup

### 리스크 2: debounce 시간 부정확

**증상**: `advanceTimersByTimeAsync` 시간이 실제와 다름 **대응**: 실제 debounce
시간 확인 후 조정

### 리스크 3: remount 패턴 복잡도

**증상**: Solid.js remount가 예상대로 작동하지 않음 **대응**: 옵션 A (제거)로
전환

---

## 참고 자료

### 내부 문서

- [AGENTS.md](../AGENTS.md): Vitest 설정 및 가이드
- [TDD_REFACTORING_PLAN.md](./TDD_REFACTORING_PLAN.md): Phase 계획

### 코드 참고

- `test/setup.ts`: Vitest 설정
- `test/utils/testing-library.ts`: 테스트 유틸리티
- `src/features/gallery/hooks/useGalleryFocusTracker.ts`: debounce 로직

### 외부 참고

- [Vitest Fake Timers](https://vitest.dev/api/vi.html#vi-usefaketimers)
- [Solid.js Testing](https://www.solidjs.com/guides/how-to-guides/testing)

---

## 체크리스트

### 준비

- [x] Phase 74 브랜치 생성: `feature/phase-74-skipped-tests`
- [x] 계획 문서 작성: `docs/phase-74-skipped-tests.md`
- [ ] Skipped 테스트 파일 3개 읽기

### 구현

- [ ] `use-gallery-focus-tracker-global-sync.test.ts` (4개) - fake timers
- [ ] `use-gallery-focus-tracker-events.test.ts` (3개) - fake timers
- [ ] `use-gallery-focus-tracker-deduplication.test.ts` (1개) - fake timers
- [ ] `toolbar-focus-indicator.test.tsx` (1개) - remount 패턴 또는 제거
- [ ] `toolbar-layout-stability.test.tsx` (1개) - 주석 명확화

### 검증

- [ ] `npm test` - 993+ passing 확인
- [ ] `npm run build` - 빌드 성공 확인
- [ ] `npm run typecheck` - 타입 에러 없음
- [ ] 커버리지 확인 (선택)

### 문서

- [ ] PLAN.md 업데이트 (Phase 74 완료)
- [ ] COMPLETED.md에 Phase 74 추가
- [ ] 커밋 및 master 병합
