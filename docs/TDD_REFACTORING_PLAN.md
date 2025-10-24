# TDD 리팩토링 계획

현재 상태: Phase 170 (비즈니스 로직 최적화) | 마지막 업데이트: 2025-10-24

## 현황 요약

Build (prod): 339.51 KB (제한 420 KB, 여유 80.49 KB) ✅ npm run build: PASS
(전체 검증 통과) ✅ 의존성: 0 violations (dependency-cruiser) ✅ 최근 완료:
Phase 170A-Part1 (타입 추상화 제거, 상태 단순화)

## Phase 170: 비즈니스 로직 최적화

### Phase 170A (Part 1) ✅ 완료 (2025-10-24)

**달성**:

1. ✅ 타입 추상화 제거: `BulkDownloadServiceType` 구체화
2. ✅ 상태 변수 최소화: `cancelToastShown` 플래그 제거
3. ✅ 빌드 크기 유지: 339.51 KB

**커밋**:

- 6096b588: 타입 인터페이스 구체화
- 9ae9835f: BulkDownloadService 상태 단순화

### Phase 170B (Part 2) - 진행 예정

**목표**: 로깅 및 에러 처리 단순화

**계획되는 개선**:

1. MediaService 중복 로깅 제거
2. 비동기 에러 처리 패턴 통일
3. 상태 신호(app-state.ts) 스코프 명확화

**예상 효과**: 코드 명확성 15-25% 향상, 유지보수 비용 10-15% 절감

## Phase 169 (보류) - 번들 최적화

근본 원인: Grep 분석 미흡으로 실제 사용 함수 오식별

- measurePerformance: 실제 사용 중
- measureAsyncPerformance: 실제 사용 중
- scheduleIdle: media-service.ts에서 사용 중

## Phase 168 완료 - 번들 최적화 분석

배럴 파일 분석, 미사용 export 식별, Phase 169 계획 수립

## 참고 문서

AGENTS.md, TESTING_STRATEGY.md, ARCHITECTURE.md, CODING_GUIDELINES.md,
TDD_REFACTORING_PLAN_COMPLETED.md
