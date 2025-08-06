# TDD 기반 코드베이스 클린업 계획서

> **현재 프로젝트는 유저스크립트 개발이라는 목적에 맞춰 소스/테스트 코드에 있는
> 중복된 구현을 통합, 사용하지 않는 기능 제거, 이름을 간략하고 일관되게 변경하는
> 작업**

## 📊 중복 분석 완료 보고서

### 🔍 Phase 1: 중복 현황 분석 결과

#### 1. Performance Utilities 중복 (최우선)

**영향도: HIGH** - 전체 애플리케이션 성능에 직접적 영향

```typescript
// 중복 위치들:
- src/shared/utils/performance/performance-utils-enhanced.ts
- src/shared/utils/performance/scroll-utils.ts
- src/shared/utils/performance/core-utils.ts
- src/core/utils/performance.ts
- test/tdd/* (여러 TDD 테스트 파일들)

// 중복 기능들:
- throttle 함수 (4개 이상의 서로 다른 구현)
- debounce 함수 (3개 이상의 서로 다른 구현)
- rafThrottle 함수 (2개 이상의 구현)
- performance measurement utilities
```

#### 2. Service Management 중복 (중요)

**영향도: MEDIUM** - 서비스 아키텍처 일관성

```typescript
// 중복 위치들:
- src/shared/services/service-manager.ts (CoreService)
- src/shared/services/core-services.ts (ServiceDiagnostics)
- src/shared/components/component-manager.ts (UnifiedComponentManagerImpl)
- src/shared/services/service-initialization.ts
- test/core/services/* (테스트 중복)

// 중복 기능들:
- 싱글톤 패턴 구현
- 서비스 등록/조회 로직
- 진단 기능
- 초기화/정리 로직
```

#### 3. DOM Service 중복 (이미 일부 통합됨)

**영향도: LOW** - 이미 UnifiedDOMService로 통합 진행중

```typescript
// 통합 완료 위치:
- src/shared/dom/unified-dom-service.ts (통합 완료)

// 잔여 중복들:
- 일부 component-manager의 DOM 관련 메서드들
- 테스트 파일들의 중복된 DOM 유틸리티들
```

#### 4. Style Management 중복

**영향도: MEDIUM** - UI 일관성

```typescript
// 중복 위치들:
- src/shared/styles/style-service.ts (StyleManager)
- src/shared/styles/style-manager.ts
- src/core/styles/index.ts (CoreStyleManager - deprecated)

// 중복 기능들:
- CSS Variable 설정/조회
- 클래스 조합 로직
- 컴포넌트 상태 업데이트
```

## 🎯 TDD 기반 클린업 전략

### Phase 2: RED-GREEN-REFACTOR 사이클

#### 🔴 RED Phase: 실패하는 통합 테스트 작성

```typescript
// test/cleanup/phase2-red-performance-utils.test.ts
describe('Performance Utils 통합 테스트 (RED)', () => {
  it('단일 throttle 함수만 존재해야 함', () => {
    // 현재는 실패 - 여러 throttle 구현이 존재
    expect(getThrottleImplementations()).toHaveLength(1);
  });

  it('모든 throttle 사용처가 동일한 함수를 참조해야 함', () => {
    // 현재는 실패 - 서로 다른 구현을 사용
    expect(getAllThrottleReferences()).toAllReferencesSame();
  });
});
```

#### 🟢 GREEN Phase: 최소 구현으로 테스트 통과

```typescript
// src/shared/utils/performance/unified-performance-utils.ts
export const throttle = /* 가장 안정적인 구현 선택 */;
export const debounce = /* 가장 안정적인 구현 선택 */;
export const rafThrottle = /* 가장 안정적인 구현 선택 */;
```

#### 🔄 REFACTOR Phase: 최적화 및 완성

```typescript
// 1. 성능 최적화
// 2. 타입 안전성 개선
// 3. 메모리 누수 방지
// 4. 문서화 완성
```

## 📋 단계별 실행 계획

### Priority 1: Performance Utils 통합 (Week 1)

#### Step 1.1: 분석 및 테스트 작성

- [ ] 모든 throttle/debounce 구현체 분석
- [ ] 기존 테스트 케이스 통합
- [ ] RED 테스트 작성

#### Step 1.2: 구현 통합

- [ ] 최적의 구현 선택
- [ ] 단일 파일로 통합
- [ ] 기존 코드 마이그레이션

#### Step 1.3: 검증 및 정리

- [ ] 모든 테스트 통과 확인
- [ ] 중복 파일 제거
- [ ] 문서 업데이트

### Priority 2: Service Management 정리 (Week 2)

#### Step 2.1: Service Manager 단순화

- [ ] CoreService vs ServiceDiagnostics 중복 제거
- [ ] 단일 서비스 관리자로 통합
- [ ] 불필요한 추상화 제거

#### Step 2.2: Component Manager 정리

- [ ] UnifiedComponentManagerImpl 기능 검토
- [ ] DOM 관련 기능을 UnifiedDOMService로 위임
- [ ] 순수한 컴포넌트 관리 기능만 유지

### Priority 3: Style Management 통합 (Week 2)

#### Step 3.1: Style Service 통합

- [ ] StyleManager vs style-service.ts 중복 해결
- [ ] 단일 스타일 API로 통합
- [ ] CoreStyleManager deprecated 제거

### Priority 4: Test Files 정리 (Week 3)

#### Step 4.1: TDD Test Files 통합

- [ ] test/tdd/\* 파일들을 적절한 위치로 이동
- [ ] test/unit/* 및 test/integration/*로 통합
- [ ] 중복된 테스트 케이스 제거

#### Step 4.2: Mock Objects 통합

- [ ] test/**mocks**/\* 정리
- [ ] 중복된 mock 구현 제거
- [ ] 재사용 가능한 mock utilities 생성

## 🔧 TDD 워크플로우

### 각 단계별 TDD 사이클

```bash
# 1. RED: 실패하는 테스트 작성
npm run test -- test/cleanup/phase2-red-*.test.ts

# 2. GREEN: 최소 구현
npm run test -- test/cleanup/phase3-green-*.test.ts

# 3. REFACTOR: 최적화
npm run test -- test/cleanup/phase4-refactor-*.test.ts

# 4. 전체 테스트 실행
npm run test:all
```

### 품질 기준

- ✅ 모든 기존 테스트 통과 유지
- ✅ TypeScript strict 모드 100% 준수
- ✅ ESLint/Prettier 규칙 준수
- ✅ 빌드 크기 개선 (현재: 266.41 KB → 목표: 250 KB 이하)
- ✅ 테스트 커버리지 90% 이상 유지

## 📈 예상 효과

### 코드 품질 개선

- **중복 제거**: 30-40% 코드 중복 감소
- **성능 향상**: 통합된 performance utils로 일관된 최적화
- **유지보수성**: 단일 진실 공급원(Single Source of Truth) 확립

### 프로젝트 구조 개선

- **파일 수 감소**: ~20개 중복 파일 제거
- **의존성 명확화**: 순환 의존성 제거
- **테스트 정리**: TDD 테스트 파일의 적절한 위치 배치

### 유저스크립트 최적화

- **번들 크기 감소**: 중복 코드 제거로 최종 크기 축소
- **런타임 성능**: 일관된 performance utilities 사용
- **메모리 사용량**: 중복 인스턴스 제거로 메모리 효율성 개선

## 🚀 다음 단계

1. **Phase 2 시작**: Performance Utils 중복 제거부터 시작
2. **TDD 테스트 작성**: RED 단계 테스트 먼저 구현
3. **지속적 검증**: 각 단계마다 전체 테스트 실행으로 회귀 방지

이 계획서를 바탕으로 체계적이고 안전한 코드베이스 정리를 진행하겠습니다.
