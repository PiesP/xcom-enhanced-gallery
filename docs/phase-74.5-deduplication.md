# Phase 74.5: Deduplication 테스트 구조 개선

> **작성일**: 2025-10-15 | **상태**: 진행 중 🔄

## 목표

Phase 74에서 이관된 6개 deduplication 테스트를 재활성화하여 테스트 커버리지 향상

## 배경

### Phase 74 결과

- **성공**: 10개 skipped → 8개 (2개 재활성화)
- **이관**: 6개 deduplication 테스트를 Phase 74.5로 분리
- **원인**: Promise 기반 코드에서 fake timers 미작동 (10초 타임아웃)

### 문제 정의

```typescript
// 현재 패턴 (타임아웃 발생)
it.skip('테스트 이름', async () => {
  const result = await new Promise(resolve => {
    setTimeout(() => resolve(data), 200); // fake timers에서 해결 안 됨
  });
  expect(result).toBeDefined();
});
```

**증상**:

- `vi.useFakeTimers()` + `vi.advanceTimersByTimeAsync()` 적용 시 타임아웃
- Promise 내부의 setTimeout이 fake timers에 의해 제어되지 않음
- 테스트가 10초 타임아웃으로 실패

## 해결 전략

### 패턴 전환

```typescript
// 기존: Promise + setTimeout (미작동)
await new Promise(resolve => setTimeout(() => resolve(data), 200));

// 새로운: async/await + vi.runAllTimers()
setTimeout(() => {
  // 비동기 작업
}, 200);
vi.runAllTimers(); // 모든 타이머 즉시 실행
await vi.waitFor(() => expect(condition).toBe(true));
```

### 핵심 변경

1. **타이머 제어 방식**
   - `vi.advanceTimersByTimeAsync()` → `vi.runAllTimers()`
   - Promise 래핑 제거
   - 직접 타이머 실행 후 상태 검증

2. **비동기 대기 방식**
   - `await new Promise()` → `await vi.waitFor()`
   - 조건 기반 대기로 변경
   - 타임아웃 제어 가능

## 대상 테스트

### 파일

`test/unit/features/gallery/hooks/use-gallery-focus-tracker-deduplication.test.ts`

### 6개 Skipped 테스트

1. **L52**: handleItemFocus 중복 호출 배칭
2. **L95**: handleItemFocus RAF 배칭 (추가 테스트)
3. **L148**: entries 중복 처리 배칭
4. **L187**: handleItemBlur → handleItemFocus 빠른 전환 배칭
5. **L236**: 여러 entries 동시 진입 시 RAF 배칭
6. **L318**: 스크롤 중 동일 인덱스 반복 entries 1회 처리

## 구현 계획

### Step 1: 첫 번째 테스트 (L52) 리팩토링

**현재 코드**:

```typescript
it.skip('handleItemFocus가 짧은 시간 내 여러 번 호출되면...', async () => {
  const result = await new Promise(resolve => {
    setTimeout(() => {
      resolve({ count: setFocusedIndexSpy.mock.calls.length });
    }, 200);
  });
  expect(result.count).toBe(1);
});
```

**목표 코드**:

```typescript
it('handleItemFocus가 짧은 시간 내 여러 번 호출되면...', async () => {
  // 여러 번 호출
  handleItemFocus(0);
  handleItemFocus(0);
  handleItemFocus(0);

  // 타이머 실행
  vi.runAllTimers();

  // 상태 검증
  await vi.waitFor(() => {
    expect(setFocusedIndexSpy).toHaveBeenCalledTimes(1);
  });
});
```

### Step 2-6: 나머지 테스트 순차 적용

동일한 패턴을 L95, L148, L187, L236, L318에 적용

## 검증 기준

### RED → GREEN 확인

- [ ] L52 테스트 재활성화 → GREEN
- [ ] L95 테스트 재활성화 → GREEN
- [ ] L148 테스트 재활성화 → GREEN
- [ ] L187 테스트 재활성화 → GREEN
- [ ] L236 테스트 재활성화 → GREEN
- [ ] L318 테스트 재활성화 → GREEN

### 전체 테스트 통과

- [ ] `npm test` 실행 → 8 skipped → 2 skipped (6개 재활성화)
- [ ] 프로덕션 빌드 크기 유지 (321 KB 이하)
- [ ] 타입 체크 0 errors

## 예상 결과

### 메트릭 변화

| 항목           | 시작 | 목표 | 개선       |
| -------------- | ---- | ---- | ---------- |
| Skipped 테스트 | 8개  | 2개  | -6개 (75%) |
| 테스트 통과    | 984  | 990  | +6개       |
| 통과율         | 98.5 | 99.2 | +0.7%p     |

### 부가 효과

- ✅ Promise 기반 테스트 패턴 개선
- ✅ fake timers 올바른 사용법 확립
- ✅ 다른 테스트에도 적용 가능한 패턴 확립

## 리스크 및 대응

### 리스크 1: 비동기 타이밍 문제

**증상**: vi.runAllTimers() 후에도 상태 변경 안 됨 **대응**: vi.waitFor()
타임아웃 증가, 또는 vi.advanceTimersByTime() 사용

### 리스크 2: 테스트 실패 지속

**증상**: 패턴 변경 후에도 테스트 실패 **대응**: 구현 로직 분석, 필요 시 skip
유지

### 리스크 3: 다른 테스트에 영향

**증상**: 다른 테스트가 실패하기 시작 **대응**: beforeEach/afterEach에서 타이머
정리 확인

## 체크리스트

- [ ] Phase 74.5 브랜치 생성
- [ ] 이 계획 문서 작성
- [ ] L52 테스트 분석 및 리팩토링
- [ ] L52 GREEN 확인
- [ ] 나머지 5개 테스트 순차 적용
- [ ] 전체 테스트 실행 및 검증
- [ ] 빌드 크기 확인
- [ ] Phase 74.5 완료 및 문서 이관

## 참고

- [Phase 74 계획 문서](./phase-74-skipped-tests.md)
- [TDD_REFACTORING_PLAN.md](./TDD_REFACTORING_PLAN.md)
- [Vitest Fake Timers 문서](https://vitest.dev/api/vi.html#vi-usefaketimers)
