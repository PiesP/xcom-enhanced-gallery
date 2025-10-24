# TDD 리팩토링 계획

현재 상태: Phase 170A 실행 (비즈니스 로직 단순화) | 마지막 업데이트: 2025-10-24

## 현황 요약

Build (prod): 339.65 KB (제한 420 KB, 여유 80.35 KB) ✅ npm run build: PASS
(전체 검증 통과) ✅ 의존성: 0 violations (dependency-cruiser) ✅ 현재 Phase:
Phase 170A (진행 중)

## Phase 170A: 비즈니스 로직 단순화

목표: 복잡한 구현 제거로 코드 명확성 향상

### 식별된 개선 사항

1. BulkDownloadService 단순화 (상태 관리 최소화)
2. 서비스 간 중복 로깅 제거
3. 비동기 에러 처리 패턴 통일
4. TypeScript 타입 추상화 제거
5. 상태 신호 스코프 명확화

예상 효과: 명확성 25-35% 향상, 유지보수 비용 15-20% 절감

## Phase 169 (보류) - 번들 최적화

근본 원인: Grep 분석 미흡으로 실제 사용 함수 오식별

- measurePerformance: 실제 사용 중
- measureAsyncPerformance: 실제 사용 중
- scheduleIdle: media-service.ts에서 사용 중

## Phase 168 완료 - 번들 최적화 분석

배럴 파일 분석, 미사용 export 식별, Phase 169 계획 수립

## 참고 문서

AGENTS.md, TESTING_STRATEGY.md, ARCHITECTURE.md, CODING_GUIDELINES.md
