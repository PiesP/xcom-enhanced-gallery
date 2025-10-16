# 포커스 안정성 개선 - 문제 분석 및 솔루션 (Phase 83)# 포커스 안정성 개선 - 문제 분석 및 솔루션 (Phase 83)

## 📋 문제점## 📋 문제점

**증상**: 스크롤 중 포커스가 계속 변하며 인디케이터(`data-focused` 속성)가
깜빡거림**증상**: 스크롤 중 포커스가 계속 변하며 인디케이터(`data-focused`
속성)가 깜빡거림

**근본 원인**:**근본 원인**:

1. IntersectionObserver 이벤트마다 `recomputeFocus()` 호출1.
   IntersectionObserver 이벤트마다 `recomputeFocus()` 호출

2. 스크롤 중에도 계속 포커스 갱신 시도 (settling 상태 미감지)2. 스크롤 중에도
   계속 포커스 갱신 시도 (settling 상태 미감지)

3. 여러 포커스 변경 소스의 경쟁: 자동 감지, 사용자 입력, 프로그래매틱 스크롤3.
   여러 포커스 변경 소스의 경쟁: 자동 감지, 사용자 입력, 프로그래매틱 스크롤

## 💡 솔루션 아키텍처## 💡 솔루션 아키텍처

### Phase 83.1: StabilityDetector 서비스 (✅ 완료)### Phase 83.1: StabilityDetector 서비스 (✅ 완료)

**목표**: Activity 기반 settling 상태 감지**목표**: Activity 기반 settling 상태
감지

- Activity 기록: 'scroll', 'focus', 'layout', 'programmatic'- Activity 기록:
  'scroll', 'focus', 'layout', 'programmatic'

- Settling 판정: 300ms idle → stable 상태- Settling 판정: 300ms idle → stable
  상태

- 콜백 시스템: 상태 변화 시만 listener 호출- 콜백 시스템: 상태 변화 시만
  listener 호출

- **구현**: `src/shared/services/stability-detector.ts` (171줄)- **구현**:
  `src/shared/services/stability-detector.ts` (171줄)

- **테스트**: 22개 테스트 케이스 (100% 통과)- **테스트**: 22개 테스트 케이스
  (100% 통과)

### Phase 83.2: useGalleryScroll 통합 (✅ 완료)

**목표**: 스크롤 활동을 StabilityDetector에 기록

- wheel 이벤트 → `recordActivity('scroll')`
- settling 신호 → `onStabilityChange` 콜백
- **구현**: `useGalleryScroll` 옵션 추가, wheel 핸들러 개선
- **테스트**: 11개 통합 테스트 (100% 통과)

### Phase 83.3: useGalleryFocusTracker 최적화 (🔄 진행 중)

**목표**: Settling 상태에서만 포커스 갱신

- recomputeFocus() 호출 조건: `isScrolling === true` → 보류
- 포커스 갱신 큐: IntersectionObserver 이벤트 → 큐에 추가 (최신만)
- settling 감지 후: 큐의 최신 요청만 적용
- **효과**: 스크롤 중 포커스 변경 0회, Settling 후 1회만 적용

## 📊 예상 성과

| 항목                    | 개선 전 | 개선 후              |
| ----------------------- | ------- | -------------------- |
| 스크롤 중 포커스 갱신   | 5-10회  | 0회                  |
| Settling 후 포커스 갱신 | 1-3회   | 1회                  |
| 인디케이터 깜빡거림     | 있음    | 제거됨               |
| 테스트 커버리지         | 기존    | +33개 (Phase 83.1-3) |

## 🔧 기술 스택

- **Solid.js Signal**: 반응성 상태 관리
- **TDD**: Red → Green → Refactor 순서로 개발
- **Vitest + JSDOM**: 단위/통합 테스트
- **TypeScript strict**: 타입 안전성 보장

## 📚 참고 문서

- `FOCUS_STABILITY_QUICK_REFERENCE.md`: 빠른 참조
- `TDD_REFACTORING_PLAN.md`: Phase 83 계획 상세
- `docs/ARCHITECTURE.md`: 3계층 아키텍처
