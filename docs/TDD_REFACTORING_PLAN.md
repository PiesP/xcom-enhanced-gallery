# TDD 리팩토링 계획

현재 상태: 안정 단계 (다음 Phase 대기) | 마지막 업데이트: 2025-10-24

## 현황 요약

Build (prod): 339.55 KB (제한 420 KB, 여유 80.45 KB) ✅ npm run build: PASS
(전체 검증 통과) ✅ 의존성: 0 violations (dependency-cruiser) ✅ 최근 완료:
Phase 170B (로깅 표준화)

## 진행 중인 작업

**없음** - 현재 프로젝트는 안정 단계입니다.

## 완료된 Phase (Phase 170)

**Phase 170A** ✅ (2025-10-24):

- 타입 추상화 제거 (BulkDownloadServiceType 구체화)
- BulkDownloadService 상태 단순화 (cancelToastShown 제거)
- 빌드 크기: 339.51 KB

**Phase 170B** ✅ (2025-10-24):

- 로깅 접두사 표준화 ([BulkDownloadService], [MediaService])
- 에러 처리 일관성 검증 (getErrorMessage 일관성 확인)
- 상태 신호 스코프 검증 (app-state.ts 구조 확인)
- 빌드 크기: 339.55 KB

## 향후 계획 (우선순위 대기 목록)

### Phase 171 (제안) - 다음 작업 식별 대기

**선택사항**:

1. 번들 크기 최적화 추진 (현재 339.55 KB → 320 KB 목표 평가)
2. 성능 최적화 분석 (프리페칭, 캐싱, 메모리 관리)
3. 접근성 개선 (WCAG Level AAA 추진 검토)
4. E2E 테스트 확대 (현재 smoke 수준 → 통합 시나리오)

### Phase 169 (보류) - 번들 최적화 재검토

근본 원인: Grep 분석 미흡으로 실제 사용 함수 오식별

- measurePerformance: 실제 사용 중
- measureAsyncPerformance: 실제 사용 중
- scheduleIdle: media-service.ts에서 사용 중

## 참고 문서

- AGENTS.md: 개발 환경 및 테스트 가이드
- TESTING_STRATEGY.md: 테스트 전략
- ARCHITECTURE.md: 시스템 구조
- CODING_GUIDELINES.md: 코딩 규칙
- TDD_REFACTORING_PLAN_COMPLETED.md: 완료 Phase 기록
