# TDD 리팩토링 활성 계획

최종 업데이트: 2025-10-21

---

## 현황 요약 (읽기 전 10초 요약)

- Build: prod 326.71 KB / 335 KB (여유 8.29 KB), gzip 88.08 KB
- 최적화: 프로덕션 소스맵 제거 완료 (파일 크기 최소화)
- Tests: 2443 passed + 6 skipped (unit+browser+E2E+a11y) GREEN
- 정적 분석: Typecheck/ESLint/Stylelint/CodeQL 모두 PASS
- 의존성: 266 modules, 747 deps, 순환 0
- 완료 이력은 `docs/TDD_REFACTORING_PLAN_COMPLETED.md` 참조 (B1/B2/A1 등)

---

## 활성 Phase C1: 번들 최적화 (Userscript 전용)

목표: 안전 가드를 유지하면서 프로덕션 번들을 작게, 단순하게. Userscript 특성상
코드 스플릿 이점이 없으므로 “삭제/배제/조건부 주입” 전략을 우선.

수용 기준(AC):

- AC1: prod 번들 ≤ 320 KB (stretch: 300 KB)
- AC2: 기능 회귀 없음 (Browser/E2E/a11y GREEN 유지)
- AC3: dependency-cruiser violations 0 유지, CodeQL 위반 0
- AC4: 유지보수성 향상: 불필요 배럴/중복 vendor 레이어 제거로 의존성 그래프
  단순화

우선순위(P0→P2):

- P0. Dead code/배럴 정리 (삭제)
  - 근거: `metrics/potentially-unused-modules.json`의 `unused` 목록 다수는
    배럴(index.ts)·d.ts·미사용 프리미티브 컴포넌트
  - 후보(발췌):
    - shared/external/vendors/{vendor-api.ts,vendor-manager.ts,vendor-types.ts},
      external/{index.ts}, zip/index.ts
    - shared/components/ui/primitive/**, features/**/index.ts,
      shared/\*\*/index.ts (사용 경로 확인 후 제거)
    - types/solid-js-client.d.ts (타입 전용·미사용, 제거 가능성 검토)
  - 방법: 사용 참조 없는 파일 제거 → `deps:json`으로 그래프 확인 → build 검증
  - 리스크/보완: 나중에 필요 시 Git 히스토리 복구, Public API였는지 체크리스트로
    검증

- P1. Hero 아이콘/컴포넌트 트리셰이킹 강화 (직접 import만 유지)
  - 현상: 내부 Hero 아이콘 컴포넌트가 다수 존재, 배럴 경유 시 tree-shake 저해
    소지
  - 방법: 사용처에서 개별 파일 직접 import, 불필요 re-export 제거
  - 효과: 수 KB 절감 예상, 사용성/명시성 향상

- P1. Vendor 레이어 단순화 (중복 제거)
  - 현상: static manager 중심 사용. metrics 상 `vendor-api.ts`,
    `vendor-manager.ts` 미사용
  - 방법: 미사용 vendor 레이어 파일 제거 및 문서/주석 갱신(“static manager만
    유지”)
  - 정책 준수: “벤더는 getter 경유” 원칙 유지 (직접 import 금지)

- P2. CSS 토큰 방출 최적화(보수적)
  - 현상: PostCSS custom-properties가 preserve:true (폴백 유지). 런타임 CSS 변수
    의존으로 필요
  - 선택지: 현상 유지(안전) vs. 특정 유틸 CSS의 폴백 축소 실험
  - 결론: 안전 우선. Phase C1에선 변경하지 않음. C1.2 실험 항목으로 별도 브랜치
    검증 시도 가능

대안 비교(요약):

- Lazy-load: 단일 번들(userscript) 특성상 이점 미미, 복잡도 증가 → 보류
- 조건부 컴파일(define 플래그): 수익성 제한적. 차후 실험(FEATURE\_\*) 후보로
  문서화만
- “삭제/배제” 전략: 즉각 효과, 리스크 통제 용이 → 선정

작업 순서(RED→GREEN→REFACTOR):

1. 측정 RED: 현재 번들/그래프 스냅샷 고정 (`npm run deps:json`, build)
2. P0 제거 1차: 확실한 미사용 배럴/외부 레이어 파일 제거 → GREEN 확인
3. P1 트리셰이킹: hero 아이콘/배럴 정리 → GREEN 확인, 사이즈 측정
4. 문서/가드 업데이트: ARCHITECTURE의 vendor 섹션 정리, 완성 후 COMPLETED에 이동

리스크/롤백:

- 삭제로 인한 사일런트 회귀 방지: Browser/E2E/a11y 스위트로 즉시 탐지
- 모든 변경은 개별 커밋(작은 단위) + CI 통과 후 축적

측정/보고:

- `docs/bundle-analysis.html` (prod) 업데이트 확인
- `docs/dependency-graph.(json|svg)` 재생성 시간 단축 여부(간접 지표)

참고/근거:

- metrics: `metrics/potentially-unused-modules.json`
- 정책: `docs/CODING_GUIDELINES.md`(Vendor getter/PC 전용 이벤트/토큰)
- 구조: `docs/ARCHITECTURE.md`(3계층/벤더 위치)

---

## 백로그 (후순위 제안)

- C1.2 실험: FEATURE 플래그 기반 조건부 주입(사용자 도움말/진단 로깅)
- B3(커버리지 잔여 13개): 사용 빈도 높은 util 3개부터 상향

---

## 완료 이관 규칙

- 완료된 항목은 요약 후 `docs/TDD_REFACTORING_PLAN_COMPLETED.md`로 이동, 본
  문서에선 제거
- 문서가 길어질 경우 핵심만 유지하고 재작성

참고: 완료된 상세 내역은 `docs/TDD_REFACTORING_PLAN_COMPLETED.md`에만
유지합니다.

**다음 우선순위 후보**:

1. **Phase B3: 나머지 13개 파일 커버리지 개선**
   - 80% 미만 파일: 13개 남음 (Phase B2에서 7개 개선)
   - 예상 테스트: 300-400개 추가
   - 우선순위: 사용 빈도/중요도 기반

2. **테스트 개선**
   - Browser 테스트 확장 (Solid.js 반응성 검증)
   - E2E 시나리오 추가 (하네스 패턴 활용)
   - Performance 테스트 강화

3. **성능 최적화**
   - Lazy loading 전략 검토
   - CSS Containment 적용 확대
   - 렌더링 성능 프로파일링
   - 번들 크기 최적화 (326.73 KB → 300 KB)

4. **접근성 강화**
   - ARIA 패턴 검증 확대
   - 스크린 리더 테스트
   - WCAG 2.1 Level AA 완전 준수
   - 키보드 내비게이션 개선

5. **아키텍처 개선**
   - Service Layer 리팩토링 검토
   - State Management 패턴 정리
   - Error Handling 전략 통일

---

## 참고 문서

- **완료 기록**: `docs/TDD_REFACTORING_PLAN_COMPLETED.md`
- **코딩 규칙**: `docs/CODING_GUIDELINES.md`
- **아키텍처**: `docs/ARCHITECTURE.md`
- **테스트 전략**: `docs/TESTING_STRATEGY.md`
- **의존성 관리**: `docs/DEPENDENCY-GOVERNANCE.md`
