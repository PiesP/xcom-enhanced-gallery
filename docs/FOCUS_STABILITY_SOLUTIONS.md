# 포커스 불안정성 문제 분석 및 솔루션 제안# 포커스 불안정성 문제 분석 및 솔루션 제안

## 📋 현재 문제점 분석## 📋 현재 문제점 분석

### 문제 증상### 문제 증상

사용자 스크롤과 유저스크립트 자동 스크롤 중 포커스가 계속 변하며,
인디케이터(`data-focused` 속성) 표시가 불안정하여 사용자 경험이 저해됨- 사용자
스크롤과 유저스크립트 자동 스크롤 중 포커스가 계속 변함

- 인디케이터(`data-focused` 속성) 표시가 불안정함

### 근본 원인- 사용자 경험 저하

#### 1. 포커스 트래킹의 빈번한 재계산### 근본 원인

IntersectionObserver 이벤트 발생 시마다 `recomputeFocus()` 호출되며, 스크롤
중에도 계속 교차 감지 이벤트가 발생합니다.#### 1. 포커스 트래킹의 빈번한 재계산

`debouncedScheduleSync(100ms)` 에도 불구하고 여전히 많은 업데이트가 발생합니다.

```typescript

#### 2. 스크롤 상태 감지 로직의 미흡성// useGalleryFocusTracker.ts의 문제

// - IntersectionObserver entries 발생 시마다 recomputeFocus() 호출

현재 `SCROLL_IDLE_TIMEOUT = 150ms`는 상대적으로 짧으며, 빠른 연속 스크롤 이벤트에서 idle 상태를 제때 인식할 수 없습니다.// - 스크롤 중에도 계속 교차 감지 이벤트 발생

자동 스크롤 중 포커스 갱신이 즉시 시작됩니다.// - debouncedScheduleSync(100ms)도 여전히 많은 업데이트

```

#### 3. 여러 포커스 변경 소스의 경쟁 상태

#### 2. 스크롤 상태 감지 로직의 미흡성

- IntersectionObserver (자동 감지)

- 사용자 클릭/키보드 (수동)```typescript

- 자동 스크롤 네비게이션 (프로그래매틱)// useGalleryScroll.ts 분석

// - SCROLL_IDLE_TIMEOUT = 150ms (상대적으로 짧음)

이들이 동시에 포커스 변경을 요청할 수 있습니다.// - 빠른 연속 스크롤 이벤트에서
idle 상태 인식 불가

// - 자동 스크롤 중 포커스 갱신이 즉시 시작됨

#### 4. 포커스 적용 타이밍의 불확실성```

현재 단계:#### 3. 여러 포커스 변경 소스의 경쟁 상태

1. `recomputeFocus()` → autoFocusIndex 업데이트 (debounce 50ms)-
   IntersectionObserver (자동 감지)

2. `updateContainerFocusAttribute()` → DOM 속성 업데이트 (debounce 50ms)- 사용자
   클릭/키보드 (수동)

3. `evaluateAutoFocus()` → 최종 포커스 적용 (150ms 후)- 자동 스크롤 네비게이션
   (프로그래매틱)

- 이들이 동시에 포커스 변경을 요청할 수 있음

단계 2와 3 사이에 새로운 스크롤 이벤트 발생 가능

#### 4. 포커스 적용 타이밍의 불확실성

---

````typescript

## 🎯 제안하는 솔루션 아키텍처// 현재 단계:

// 1. recomputeFocus() → autoFocusIndex 업데이트 (debounce 50ms)

### 솔루션 1: 안정성 상태 감지 (Stability State Detector) ⭐ 추천// 2. updateContainerFocusAttribute() → DOM 속성 업데이트 (debounce 50ms)

// 3. evaluateAutoFocus() → 최종 포커스 적용 (150ms 후)

**핵심**: 스크롤/포커스 변경이 안정적인 상태(`settling`)에만 포커스를 갱신//

// 문제: 단계 2와 3 사이에 새로운 스크롤 이벤트 발생 가능

```typescript```

export interface StabilityState {

  isStable: boolean;           // 현재 안정 상태 여부---

  settlingTime: number;        // ms - 안정 상태 지속 시간

  lastActivityTime: number;    // 마지막 변경 시각## 🎯 제안하는 솔루션 아키텍처

  activityCount: number;       // 활동 횟수

}### 솔루션 1: 안정성 상태 감지 (Stability State Detector) ⭐ 추천

````

**핵심 개념**: 스크롤/포커스 변경이 안정적인 상태(`settling`)에만 포커스를 갱신

감지 항목:

- 스크롤 활동 (wheel, programmatic scroll)```typescript

- 포커스 변경 (focus, blur 이벤트)export interface StabilityState {

- 레이아웃 변경 (resize, DOM mutation) isStable: boolean; // 현재 안정 상태 여부

- 자동 스크롤 애니메이션 진행 중 여부 settlingTime: number; // ms - 얼마나 오래
  안정 상태가 지속되었는가

  lastActivityTime: number; // 마지막 변경 시각

**특징**: activityCount: number; // 활동 횟수

- 최소 N ms 동안 활동이 없어야 "안정" 상태로 인정}

- 포커스 업데이트는 안정 상태에만 적용

// 감지 항목:

**구현 난이도**: 중간 (새 서비스/훅 추가)// 1. 스크롤 활동 (wheel, programmatic
scroll)

// 2. 포커스 변경 (focus, blur 이벤트)

---// 3. 레이아웃 변경 (resize, DOM mutation)

// 4. 자동 스크롤 애니메이션 진행 중 여부

### 솔루션 2: 포커스 갱신 지연 큐 (Focus Update Queue)```

**핵심**: 포커스 변경 요청을 큐에 모았다가, 안정 상태에서 최신 하나만
적용**특징**:

```typescript- 최소 N ms 동안 활동이 없어야 "안정" 상태로 인정

interface FocusUpdateRequest {- 활동 전후로 상태 변화 감시

  index: number | null;- 포커스 업데이트는 안정 상태에만 적용

  source: 'intersection' | 'manual' | 'navigation' | 'scroll';

  timestamp: number;**구현 난이도**: 중간 (새 서비스/훅 추가)

  priority: number;

}---

```

### 솔루션 2: 포커스 갱신 지연 큐 (Focus Update Queue)

로직:

1. 포커스 변경 요청 → 큐에 추가 (기존 요청은 제거)**핵심 개념**: 포커스 변경
   요청을 큐에 모았다가, 안정 상태에서 최신 하나만 적용

2. 안정 상태 감지 → 큐의 최신 요청만 처리

3. 나머지 요청은 폐기```typescript

interface FocusUpdateRequest {

**장점**: index: number | null;

- 불필요한 중간 상태 업데이트 제거 source: 'intersection' | 'manual' |
  'navigation' | 'scroll';

- 최종 상태만 UI에 반영 timestamp: number;

- 적용 순서 제어 가능 priority: number; // 높을수록 우선 적용

}

**구현 난이도**: 낮음 (기존 debouncer 개선)

// 로직:

---// 1. 모든 포커스 변경 요청 → 큐에 추가 (기존 요청은 제거)

// 2. 안정 상태 감지 → 큐의 최신 요청만 처리

### 솔루션 3: 포커스 갱신 엄격한 모드 (Focus Strict Mode)// 3. 나머지 요청은 폐기

````

**핵심**: IntersectionObserver 재계산을 명시적 트리거에만 제한

**장점**:

Triggers (포커스 재계산을 수행):

- 사용자 직접 조작 (click, keyboard navigation) → 즉시- 불필요한 중간 상태 업데이트 제거

- 자동 스크롤 완료 후 (settling 감지 후) → 지연- 최종 상태만 UI에 반영

- 명시적 forceSync() 호출 → 즉시- 적용 순서 제어 가능

- IntersectionObserver 초기화 이후 첫 batch → 지연

**구현 난이도**: 낮음 (기존 debouncer 개선)

Suppress (포커스 재계산 억제):

- 스크롤 중 (isScrolling === true)---

- 자동 스크롤 애니메이션 진행 중

- 수동 포커스가 활성 상태### 솔루션 3: 포커스 갱신 엄격한 모드 (Focus Strict Mode)



**특징**:**핵심 개념**: IntersectionObserver 재계산을 명시적 트리거에만 제한

- 현존하는 debounce 메커니즘과 호환

- 추가 신호/상태 최소화```typescript

// 현재: 매 intersection 이벤트마다 recomputeFocus()

**구현 난이도**: 낮음~중간// 개선: 다음 이벤트에만 recomputeFocus() 호출



---// Triggers (포커스 재계산을 수행하는 경우):

// 1. 사용자 직접 조작 (click, keyboard navigation) - 즉시

### 솔루션 4: 스크롤 안정성 임계값 상향 (Scroll Idle Timeout Tuning)// 2. 자동 스크롤 완료 후 (settling 감지 후) - 지연

// 3. 명시적 forceSync() 호출 - 즉시

**현재**:// 4. IntersectionObserver 초기화 이후 첫 batch - 지연



```typescript// Suppress (포커스 재계산 억제):

export const SCROLL_IDLE_TIMEOUT = 150;  // ms// - 스크롤 중 (isScrolling === true)

```// - 자동 스크롤 애니메이션 진행 중

// - 수동 포커스가 활성 상태

**제안**:```



```typescript**특징**:

export const SCROLL_SETTLING_CONFIG = {

  userManualScroll: 200,        // 사용자 마우스휠- 현존하는 debounce 메커니즘과 호환

  programmaticScroll: 300,      // 자동 스크롤(애니메이션)- 추가 신호/상태 최소화

  focusUpdateDelay: 100,        // 포커스 업데이트 최소 지연- 명확한 제어 흐름

  minimumStableWindow: 150,     // 안정 상태 최소 유지 시간

};**구현 난이도**: 낮음~중간

````

---

**이유**:

- 사용자 마우스휠 스크롤 중 연속 이벤트 감시### 솔루션 4: 스크롤 안정성 임계값
  상향 (Scroll Idle Timeout Tuning)

- 애니메이션 스크롤 완료까지의 실제 시간 고려

- OS/브라우저 이벤트 배칭 특성 반영**현재 설정**:

**구현 난이도**: 매우 낮음 (상수 조정만)```typescript

export const SCROLL_IDLE_TIMEOUT = 150; // ms

---```

## 📊 솔루션 비교 매트릭스**제안**

| 항목 | 솔루션 1 | 솔루션 2 | 솔루션 3 | 솔루션 4 |```typescript

|------|---------|---------|---------|---------|// 상황별 타임아웃 차등 적용

| 효과 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |export const
SCROLL_SETTLING_CONFIG = {

| 구현 난이도 | 중간 | 낮음 | 낮음~중간 | 매우 낮음 | userManualScroll: 200, //
사용자 마우스휠: 200ms

| 성능 영향 | 양호 | 우수 | 우수 | 중립 | programmaticScroll: 300, // 자동
스크롤(애니메이션): 300ms

| 기존 코드 변경 | 중간 | 낮음 | 낮음 | 매우 낮음 | focusUpdateDelay: 100, //
포커스 업데이트 최소 지연

| 유지보수성 | 양호 | 우수 | 우수 | 우수 | minimumStableWindow: 150, // 안정
상태 최소 유지 시간

| 버그 위험 | 중간 | 낮음 | 낮음 | 매우 낮음 |};

````

---

**이유**:

## 🚀 권장 실행 계획

- 사용자 마우스휠 스크롤 중 연속 이벤트 감시

### Phase 1: 즉시 적용 (위험도 낮음)- 애니메이션 스크롤 완료까지의 실제 시간 고려

- OS/브라우저의 이벤트 배칭 특성 반영

**솔루션 4 적용**: `SCROLL_SETTLING_CONFIG` 도입

**구현 난이도**: 매우 낮음 (상수 조정만)

파일:

- `src/features/gallery/hooks/useGalleryScroll.ts`---

- `useGalleryFocusTracker.ts`

## 📊 솔루션 비교 매트릭스

변경: 상수 조정

검증: 기존 테스트 통과, 유저 테스트 피드백| 항목 | 솔루션 1 | 솔루션 2 | 솔루션 3 | 솔루션 4 |

|------|---------|---------|---------|---------|

### Phase 2: 핵심 개선 (위험도 중간)| **효과** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |

| **구현 난이도** | 중간 | 낮음 | 낮음~중간 | 매우 낮음 |

**솔루션 2 + 3 조합 적용**: 포커스 갱신 지연 큐 + 엄격한 모드| **성능 영향** | 양호 | 우수 | 우수 | 중립 |

| **기존 코드 변경** | 중간 | 낮음 | 낮음 | 매우 낮음 |

파일: `useGalleryFocusTracker.ts` 내 `recomputeFocus()` 로직 개선| **유지보수성** | 양호 | 우수 | 우수 | 우수 |

| **버그 위험** | 중간 | 낮음 | 낮음 | 매우 낮음 |

변경:

- 스크롤 중(`isScrolling === true`)에는 `recomputeFocus()` 호출 보류---

- 포커스 업데이트 요청을 큐에 모아 settling 감지 후 처리

## 🚀 권장 실행 계획

구현: 50~100줄의 추가 로직

### Phase 1: 즉시 적용 (위험도 낮음)

### Phase 3: 완전 솔루션 (위험도 낮음, 이후 마이그레이션)

1. **솔루션 4 적용**: `SCROLL_SETTLING_CONFIG` 도입

**솔루션 1 도입**: `StabilityDetector` 서비스 작성   - 파일: `src/features/gallery/hooks/useGalleryScroll.ts`, `useGalleryFocusTracker.ts`

   - 변경: 상수 조정

파일: `src/shared/services/stability-detector.ts`   - 검증: 기존 테스트 통과, 유저 테스트 피드백



특징:### Phase 2: 핵심 개선 (위험도 중간)

- 독립적인 서비스

- 다른 컴포넌트에서도 재사용 가능2. **솔루션 2 + 3 조합 적용**: 포커스 갱신 지연 큐 + 엄격한 모드

- `useGalleryFocusTracker`, `useGalleryScroll` 통합   - 파일: `useGalleryFocusTracker.ts` 내 `recomputeFocus()` 로직 개선

   - 변경:

---     - 스크롤 중(`isScrolling === true`)에는 `recomputeFocus()` 호출 보류

     - 포커스 업데이트 요청을 큐에 모아 settling 감지 후 처리

## 💡 최초 구현 로드맵 (TDD 기반)   - 구현: 50~100줄의 추가 로직



### Step 1: 스크롤 상태 센서 개선### Phase 3: 완전 솔루션 (위험도 낮음, 이후 마이그레이션)



```typescript3. **솔루션 1 도입**: `StabilityDetector` 서비스 작성

// test/features/gallery/hooks/useGalleryScroll.test.ts   - 파일: `src/shared/services/stability-detector.ts`

describe('useGalleryScroll - Settling Detection', () => {   - 특징: 독립적인 서비스, 다른 컴포넌트에서도 재사용 가능

  it('should detect stable state after 300ms without scroll events', () => {   - 적용: `useGalleryFocusTracker`, `useGalleryScroll` 통합

    // 300ms 동안 scroll 이벤트 없음 → isStable = true

  });---



  it('should reset stability timer on new wheel event', () => {## 💡 최초 구현 로드맵 (TDD 기반)

    // scroll 이벤트 발생 → isStable = false 리셋

  });### Step 1: 스크롤 상태 센서 개선

});```typescript

```// test/features/gallery/hooks/useGalleryScroll.test.ts

describe('useGalleryScroll - Settling Detection', () => {

### Step 2: 포커스 갱신 최적화  it('should detect stable state after 300ms without scroll events', () => {

    // 300ms 동안 scroll 이벤트 없음 → isStable = true

```typescript  });

// test/features/gallery/hooks/useGalleryFocusTracker.test.ts

describe('useGalleryFocusTracker - Stability Mode', () => {  it('should reset stability timer on new wheel event', () => {

  it('should defer focus recompute until scroll settles', () => {    // scroll 이벤트 발생 → isStable = false 리셋

    // isScrolling = true → recomputeFocus 호출 없음  });

    // isScrolling = false (300ms 후) → recomputeFocus 호출});

  });```



  it('should apply only latest focus request when settled', () => {### Step 2: 포커스 갱신 최적화

    // 빠른 연속 포커스 요청 3개 → 마지막 1개만 적용```typescript

  });// test/features/gallery/hooks/useGalleryFocusTracker.test.ts

});describe('useGalleryFocusTracker - Stability Mode', () => {

```  it('should defer focus recompute until scroll settles', () => {

    // isScrolling = true → recomputeFocus 호출 없음

### Step 3: 통합 테스트    // isScrolling = false (300ms 후) → recomputeFocus 호출

  });

```typescript

// test/integration/focus-stability-integration.test.ts  it('should apply only latest focus request when settled', () => {

describe('Focus Stability Integration', () => {    // 빠른 연속 포커스 요청 3개 → 마지막 1개만 적용

  it('should maintain stable focus indicator during auto-scroll', () => {  });

    // 자동 스크롤 중 포커스 인디케이터 불변성 검증});

  });```



  it('should smoothly transition focus after user manual scroll', () => {### Step 3: 통합 테스트

    // 사용자 스크롤 종료 후 안정적인 포커스 전환```typescript

  });// test/integration/focus-stability-integration.test.ts

});describe('Focus Stability Integration', () => {

```  it('should maintain stable focus indicator during auto-scroll', () => {

    // 자동 스크롤 중 포커스 인디케이터 불변성 검증

---  });



## 🔍 검증 기준  it('should smoothly transition focus after user manual scroll', () => {

    // 사용자 스크롤 종료 후 안정적인 포커스 전환

구현 후 확인할 항목:  });

});

**포커스 변경 빈도 감소**```

- 목표: 스크롤 중 포커스 변경 0회 (현재: 5~10회)

- 측정: `logger.debug('useGalleryFocusTracker: auto focus applied')` 호출 횟수---



**인디케이터 안정성**## 🔍 검증 기준

- 목표: 스크롤 중 `data-focused` 속성 불변

- 측정: MutationObserver로 속성 변경 감지구현 후 확인할 항목:



**성능 개선**1. **포커스 변경 빈도 감소**

- 목표: CPU 사용률 감소, 렌더링 프레임 안정화   - 목표: 스크롤 중 포커스 변경 0회 (현재: 5~10회)

- 측정: Performance 탭 프로파일링   - 측정: `logger.debug('useGalleryFocusTracker: auto focus applied')` 호출 횟수



**사용자 경험**2. **인디케이터 안정성**

- 목표: 인디케이터 깜빡임 없음, 부자연스러운 포커스 이동 없음   - 목표: 스크롤 중 `data-focused` 속성 불변

- 검증: 사용자 피드백 수집   - 측정: MutationObserver로 속성 변경 감지



---3. **성능 개선**

   - 목표: CPU 사용률 감소, 렌더링 프레임 안정화

## 📌 참고: 기존 코드 분석 결과   - 측정: Performance 탭 프로파일링



### useGalleryFocusTracker.ts의 debounce 구조4. **사용자 경험**

   - 목표: 인디케이터 깜빡임 없음, 부자연스러운 포커스 이동 없음

```typescript   - 검증: 사용자 피드백 수집

// 현재 설정

debouncedSetAutoFocusIndex: 50ms debounce---

debouncedUpdateContainerFocusAttribute: 50ms debounce

debouncedScheduleSync: 100ms debounce## 📌 참고: 기존 코드 분석 결과



// 문제점### useGalleryFocusTracker.ts의 debounce 구조

// - debounce 만으로는 스크롤 활동 중 계속 호출됨```typescript

// - 50ms 타이밍에 여러 업데이트 겹침// 현재 설정

```debouncedSetAutoFocusIndex: 50ms debounce

debouncedUpdateContainerFocusAttribute: 50ms debounce

### useGalleryScroll.ts의 현황debouncedScheduleSync: 100ms debounce



```typescript// 문제점

// 기존 설정- debounce 만으로는 스크롤 활동 중 계속 호출됨

SCROLL_IDLE_TIMEOUT = 150ms- 50ms 타이밍에 여러 업데이트 겹침

````

// 개선 필요 사항

// - 사용자 스크롤 vs 프로그래매틱 스크롤 구분 필요### useGalleryScroll.ts의
현황

// - isScrolling 플래그 활용 불충분```typescript

// - settling 상태 명시적 신호 부재// 기존 설정

````SCROLL_IDLE_TIMEOUT = 150ms



---// 개선 필요 사항

- 사용자 스크롤 vs 프로그래매틱 스크롤 구분 필요

## 🎓 결론- isScrolling 플래그 활용 불충분

- settling 상태 명시적 신호 부재

**권장 접근**:```



1. 즉시: 솔루션 4 적용 (타임아웃 값 조정)---

2. Phase 1: 솔루션 2 적용 (포커스 갱신 큐)

3. Phase 2: 솔루션 3 통합 (스크롤 중 recompute 억제)## 🎓 결론



이 단계적 접근으로:**권장 접근**:

- 위험을 최소화하면서

- 사용자 경험을 즉시 개선하고1. **즉시**: 솔루션 4 적용 (타임아웃 값 조정)

- 장기적으로 안정적인 아키텍처 구축 가능2. **Phase 1**: 솔루션 2 적용 (포커스 갱신 큐)

3. **Phase 2**: 솔루션 3 통합 (스크롤 중 recompute 억제)

**다음 단계**: 솔루션 1, 2, 3 중 적용할 우선순위를 결정하고, Phase 1부터 구현을 시작하시겠습니까?

이 단계적 접근으로:
- 위험을 최소화하면서
- 사용자 경험을 즉시 개선하고
- 장기적으로 안정적인 아키텍처 구축

가능합니다.

---

**다음 단계**: 솔루션 1, 2, 3 중 적용할 우선순위를 결정하고, Phase 1부터 구현을 시작하시겠습니까?
````
