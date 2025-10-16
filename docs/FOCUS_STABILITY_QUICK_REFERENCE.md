# Focus Stability Quick Reference

## Problem Summary (문제 요약)

```
사용자 스크롤 중
┌─────────────────────────────────────┐
│ 스크롤 이벤트 발생                   │
└──────────────┬──────────────────────┘
               │
       ┌───────▼────────┐
       │ IntersectionObserver
       │ entries 감지
       └───────┬────────┘
               │
    ┌──────────▼──────────┐
    │ recomputeFocus()    │ ← 포커스 재계산
    │ (debounce 50ms)     │
    └──────────┬──────────┘
               │
    ┌──────────▼────────────────────┐
    │ autoFocusIndex 업데이트 발생   │ ← 인디케이터 깜빡임!
    └───────────────────────────────┘
               │
    ┌──────────▼─────────────────────┐
    │ 새로운 스크롤 이벤트 발생       │
    │ 단계 1로 돌아감...              │
    └───────────────────────────────┘
```

**결과**: 포커스 계속 변함 → 인디케이터 불안정

---

## Solutions at a Glance (솔루션 한눈에)

### ⭐ BEST: 솔루션 4 + 솔루션 2 조합

| 우선순위 | 솔루션   | 난이도    | 구현 시간 | 효과        |
| -------- | -------- | --------- | --------- | ----------- |
| 1️⃣       | 솔루션 4 | 매우 낮음 | 15분      | 즉시 개선   |
| 2️⃣       | 솔루션 2 | 낮음      | 2-3시간   | 근본 해결   |
| 3️⃣       | 솔루션 1 | 중간      | 4-5시간   | 완전 안정화 |

---

## 🟢 솔루션 4: 타임아웃 조정 (즉시 적용)

### 현재 문제

```typescript
SCROLL_IDLE_TIMEOUT = 150ms  // 너무 짧음!
```

### 개선 방안

```typescript
// useGalleryScroll.ts
export const SCROLL_SETTLING_CONFIG = {
  userManualScroll: 200, // 사용자 휠: 충분한 이벤트 수집 시간
  programmaticScroll: 300, // 자동 스크롤: 애니메이션 완료 대기
  focusUpdateDelay: 100, // 포커스 안정성 마진
  minimumStableWindow: 150, // 진정한 "안정" 판정
};
```

### 효과

```
Before:  scroll 150ms idle → 포커스 바뀜 (아직 스크롤 중!)
After:   scroll 200-300ms idle → 포커스 안정화 (진정한 끝)
```

---

## 🟠 솔루션 2: 포커스 갱신 큐 (근본 해결)

### 문제

스크롤 중 빠른 연속 포커스 변경 요청:

```
intersection 이벤트 1 → 포커스 업데이트 1 (불필요)
intersection 이벤트 2 → 포커스 업데이트 2 (불필요)
intersection 이벤트 3 → 포커스 업데이트 3 (필요!)
↑↑↑ 모두 UI에 반영됨 (깜빡거림)
```

### 개선

```typescript
// 포커스 변경 요청 큐
lastRequest = null;

// 요청 발생 시
focusUpdateQueue.enqueue(newIndex); // 이전 요청 제거됨
lastRequest = newIndex;

// Settling 감지 후
if (isStable) {
  applyFocus(lastRequest); // 최신 1개만 적용!
}
```

### 효과

```
Before: 포커스 변경 3번, 인디케이터 깜빡임 3번
After:  포커스 변경 1번, 인디케이터 깜빡임 0번
```

---

## 🔵 솔루션 1: 완전 안정화 (장기)

### 개념

```
Activity Events
├─ scroll wheel
├─ focus change
├─ layout change
└─ programmatic scroll
       │
       ▼
┌─────────────────────┐
│ StabilityDetector   │
│ (Activity 모니터링) │
└────────┬────────────┘
         │
    ┌────▼────┐
    │ isStable │ 신호
    └────┬────┘
         │
  ┌──────▼──────────┐
  │ Focus Updates   │ ← Settling 중에만 발생
  │ (드물게 발생)   │
  └─────────────────┘
```

### 구현

```typescript
// src/shared/services/stability-detector.ts
export class StabilityDetector {
  private activityEvents: ActivityEvent[] = [];
  private isStable = false;
  private settlingTime = 0;

  recordActivity(type: 'scroll' | 'focus' | 'layout') {
    this.activityEvents.push({ type, time: Date.now() });
    this.isStable = false; // 재활동 감지
  }

  checkStability(threshold = 300): boolean {
    const timeSinceLastActivity = Date.now() - this.getLastActivityTime();
    return timeSinceLastActivity >= threshold;
  }
}
```

---

## 📋 구현 체크리스트

### Phase 1: 솔루션 4 (15분)

```
☐ SCROLL_SETTLING_CONFIG 상수 정의
  - useGalleryScroll.ts에 추가
  - useGalleryFocusTracker.ts에서 import

☐ autoFocusDelayAccessor 값 조정
  - autoFocusDebounce → 100ms (현재대로)
  - 애니메이션 완료 대기 → +100ms 추가

☐ 테스트 실행
  npm run test -- -t "scroll"

☐ 수동 테스트
  - 사용자 휠 스크롤 중 인디케이터 안정성 확인
  - 자동 스크롤 완료 후 포커스 갱신 시간 관찰
```

### Phase 2: 솔루션 2 (2-3시간)

```
☐ useGalleryFocusTracker.ts 개선
  - isScrolling 신호 추가 import
  - recomputeFocus() 호출 조건에 guard 추가
  - 포커스 갱신 큐 메커니즘 구현

☐ 테스트 작성 (TDD)
  - "스크롤 중 recomputeFocus 호출 안됨" 테스트
  - "settling 후 최신 요청만 적용" 테스트

☐ 디버깅
  - logger.debug로 호출 빈도 확인
  - MutationObserver로 속성 변경 모니터링
```

### Phase 3: 솔루션 1 (4-5시간)

```
☐ stability-detector.ts 작성
  - Activity 이벤트 추적
  - Settling 상태 계산

☐ useGalleryFocusTracker 통합
  - StabilityDetector 인스턴스 생성
  - focus 업데이트를 stable 신호에만 연결

☐ useGalleryScroll 통합
  - Activity 이벤트 기록
  - isStable 신호 제공
```

---

## 🎯 Success Criteria (성공 기준)

구현 후 다음을 확인하세요:

```
✅ 포커스 변경 빈도
   Before: 스크롤 중 5-10회
   After:  스크롤 중 0-1회

✅ 인디케이터 안정성
   Before: 깜빡거림 눈에 띔
   After:  스크롤 중 불변, settling 후 안정 전환

✅ 사용자 경험
   Before: "인디케이터가 계속 변해요"
   After:  "안정적이네요!"
```

---

## 📈 타임라인

```
Day 1 (짧음)
├─ 09:00 ~ 09:15: 솔루션 4 구현
├─ 09:15 ~ 09:30: 기본 테스트
└─ 09:30 ~ 10:00: 유저 피드백

Day 2-3 (중간)
├─ 솔루션 2 구현 (TDD)
├─ 통합 테스트 작성
└─ 성능 모니터링

Day 4+ (장기)
├─ 솔루션 1 (StabilityDetector)
├─ 완전 리팩토링
└─ 프로덕션 배포
```

---

## 💡 Key Insight (핵심 인사이트)

> "안정성 상태를 명시적으로 감지하고, 그 상태에서만 포커스를 갱신하라"

- 현재: 계속 변하는 상황에서 포커스 업데이트 시도
- 개선: 안정된 상황에서 최종 포커스만 적용

이것이 모든 솔루션의 핵심!
