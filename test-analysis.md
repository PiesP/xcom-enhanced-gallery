# Vitest 타임아웃 vs 무한 루프 분석

## 🔍 문제 분석

### 1. Vitest 타임아웃의 한계

**설정된 타임아웃**:

```typescript
test: {
  testTimeout: 20000,  // 20초
  hookTimeout: 25000,  // 25초
}
```

**실제 동작**:

- `testTimeout`: 테스트 함수의 **전체 실행 시간**을 제한
- `hookTimeout`: beforeEach/afterEach 등 **훅의 실행 시간**을 제한

### 2. 무한 루프가 타임아웃을 우회하는 이유

#### A. 동기적 렌더링 루프

```javascript
// 문제가 되는 패턴
const observe = element => {
  // 즉시 콜백 실행 (동기적)
  callback([{ target: element, isIntersecting: true }]);
  // → 컴포넌트 리렌더링
  // → useEffect 재실행
  // → 새로운 IntersectionObserver 생성
  // → observe() 다시 호출
  // → 무한 루프!
};
```

#### B. JavaScript 이벤트 루프 차단

```javascript
// 타임아웃 체크가 실행될 수 없는 상황
while (true) {
  // 동기적 작업이 계속 실행됨
  render(); // React/Preact 렌더링
  // 이벤트 루프가 차단되어 타임아웃 체크 불가
}
```

### 3. jsdom 환경의 특수성

#### A. 제한된 타이머 동작

- `setTimeout`/`setInterval`이 실제 브라우저와 다르게 동작
- `requestAnimationFrame` 지원 제한
- 비동기 작업의 스케줄링이 불완전

#### B. DOM 이벤트 처리 차이

- 실제 브라우저의 렌더링 파이프라인 부재
- 무한 DOM 업데이트 시 중단 메커니즘 없음

### 4. 해결된 방법의 작동 원리

#### A. 비동기 콜백 실행

```javascript
setTimeout(() => {
  callback([{ target: element, isIntersecting: true }]);
}, 0);
```

#### B. 상태 추적으로 중복 방지

```javascript
this._isDisconnected = false;
if (!this._isDisconnected && this._observing.has(element)) {
  // 안전한 실행
}
```

#### C. 에러 처리로 안정성 확보

```javascript
try {
  this.callback(...);
} catch (error) {
  console.warn('IntersectionObserver 콜백 에러 (무시됨):', error);
}
```

## 🎯 결론

**Vitest 타임아웃은 비동기 작업에만 유효**하며, **동기적 무한 루프는 JavaScript
엔진 수준에서 이벤트 루프를 차단**하여 타임아웃 메커니즘이 작동할 수 없게
만듭니다.

이는 Vitest만의 문제가 아니라 **모든 JavaScript 테스트 프레임워크**에서 발생할
수 있는 근본적인 한계입니다.

### 해결 전략

1. **동기적 무한 루프 방지**: 콜백을 비동기로 실행
2. **상태 추적**: 중복 실행 방지 메커니즘
3. **에러 격리**: 안전한 실행 환경 구축
4. **테스트 단순화**: 복잡한 렌더링 대신 모듈 검증
