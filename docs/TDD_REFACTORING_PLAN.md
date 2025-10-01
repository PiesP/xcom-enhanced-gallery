# TDD 리팩토링 활성 계획 (경량)

본 문서는 "현재 진행 중이거나 즉시 착수 예정" 작업만 간결하게 유지합니다. 완료된
내용은 항상 `TDD_REFACTORING_PLAN_COMPLETED.md`로 이관하여 히스토리를
분리합니다.

**최근 업데이트**: 2025-10-01 — Epic LEGACY-CLEANUP-001 완료 및 종료

---

## 1. 운영 원칙(요약/링크)

- 코딩/스타일/입력/벤더 접근/테스트 등의 일반 규칙은
  `docs/CODING_GUIDELINES.md`와 `docs/vendors-safe-api.md`를 단일 소스로
  사용합니다.
- 실행/CI/빌드 파이프라인과 스크립트는 루트 `AGENTS.md`를 참조합니다.
  - 본 문서는 "활성 Epic/작업"과 해당 Acceptance에만 집중합니다.

---

## 활성 Epic 현황

### Epic: NAMING-001 — 명명 규칙 표준화 및 일관성 강화 📝 **활성**

**목표**: 코드베이스 전반의 명명 규칙을 표준화하고 일관성을 강화하여 가독성과
유지보수성 향상

**배경**:

- 프로젝트 초기 단계에서 "simple", "unified", "optimized" 등의 불필요한 수식어
  남용
- boolean 반환 함수의 접두사 불일치 (is/has/can/should 패턴 미준수)
- 유틸리티 함수의 동사 패턴 비일관성
- 도메인 특화 용어 사용 부족 (갤러리, 접근성 등)

**현재 상태** (기준: `test/cleanup/naming-standardization.test.ts`):

- 불필요한 수식어 함수명: 검출 대상 존재 (예외: enhanced, advanced, unified)
- 동사 패턴 비일관성: ~150건 미만 (validPrefixes 기준)
- boolean 함수 접두사: ~150건 미만 위반
- 도메인 용어 사용률: 갤러리 60%, 접근성 60% (목표 대비 낮음)

**Epic 구조**: 3 Phases (Phase A → B → C)

- **Phase A**: 자동화 도구 개발 및 스캔 (현재)
- **Phase B**: 우선순위 높은 항목 리네이밍 (수동)
- **Phase C**: 문서화 및 린트 룰 추가

**최근 완료**: Epic LEGACY-CLEANUP-001 (2025-10-01)

**백로그 후보**:

- CSS-OPTIMIZATION: CSS 번들 최적화
- E2E 테스트 인프라 구축

---

## 다음 사이클 준비

- 현재 Epic: **NAMING-001** (Phase A 진행 중)
- 완료 Epic: LEGACY-CLEANUP-001, SOLID-NATIVE-002, UX-001, UX-002
  (`TDD_REFACTORING_PLAN_COMPLETED.md` 참조)
- 백로그 후보:
  - CSS-OPTIMIZATION: CSS 번들 최적화
  - E2E 테스트 인프라 구축

---

## Phase A: 자동화 스캔 도구 개발 및 명명 규칙 위반 전수조사 🔍

**목표**: 명명 규칙 위반 항목을 자동으로 검출하는 스크립트 개발 및 전수 스캔
실행

**작업 항목**:

1. **명명 규칙 스캐너 스크립트 개발** (`scripts/scan-naming-violations.mjs`)
   - Acceptance:
     - 불필요한 수식어 검출 (simple, optimized, basic, improved 등)
     - boolean 함수 접두사 검증 (is, has, can, should 패턴)
     - 동사 패턴 일관성 검증 (create, get, set, handle 등 25개 표준 동사)
     - 도메인 용어 사용률 측정 (gallery, media, image, aria, focus 등)
     - JSON 리포트 생성 (`docs/naming-violations-map.json`)
   - Test: `test/infrastructure/naming-scanner.test.ts` (12/12 GREEN)
   - 추정 소요: 6시간

2. **전수 스캔 실행 및 리포트 생성**
   - Acceptance:
     - src/ 디렉터리 전체 스캔 완료
     - 위반 항목 우선순위 분류 (HIGH/MEDIUM/LOW)
     - 영향 범위 분석 (export 여부, 사용 빈도)
   - 산출물:
     - `docs/naming-violations-map.json` (전체 위반 항목 맵)
     - `docs/naming-cleanup-phase-a-report.md` (스캔 결과 요약)
   - 추정 소요: 2시간

3. **우선순위 결정 및 Phase B 계획 수립**
   - Acceptance:
     - HIGH: public API, 핵심 도메인 로직 (우선 처리)
     - MEDIUM: 내부 유틸리티, 헬퍼 함수
     - LOW: deprecated 예정 코드, 테스트 전용
     - Phase B 대상 항목 선정 (상위 30-50개)
   - 산출물: Phase B 작업 계획 (이 문서에 추가)
   - 추정 소요: 2시간

**Acceptance Criteria**:

- [ ] 명명 규칙 스캐너 스크립트 개발 완료 (`scripts/scan-naming-violations.mjs`)
- [ ] 스캐너 테스트 12/12 GREEN (`test/infrastructure/naming-scanner.test.ts`)
- [ ] 전수 스캔 실행 완료 (src/ 전체)
- [ ] JSON 리포트 생성 (`docs/naming-violations-map.json`)
- [ ] Phase A 실행 리포트 작성 (`docs/naming-cleanup-phase-a-report.md`)
- [ ] 품질 게이트: typecheck/lint/test ALL GREEN
- [ ] Phase B 계획 수립 (우선순위 항목 30-50개 선정)

**추정 총 소요**: 10시간

---

### Epic: NAMING-001 — 명명 규칙 표준화 및 일관성 강화 📝 **백로그 이동**

(상세 계획은 `TDD_REFACTORING_BACKLOG.md`로 이관)

---

## TDD 워크플로 (Reminder)

1. RED: 실패 테스트(또는 TODO) 추가 — 최소 명세만 표현
2. GREEN: 가장 작은 변경으로 통과 (과도한 범위 확대 금지)
3. REFACTOR: 중복 제거 / 구조 개선 (동일 테스트 GREEN 유지)
4. Rename: `.red.` 파일명 제거 → 가드 전환
5. 이동: 완료 항목 본 문서에서 제거 & Completed 로그에 1줄 요약

**품질 게이트 (각 Phase별)**:

- 타입: `npm run typecheck` — strict 오류 0
- 린트/포맷: `npm run lint:fix` / `npm run format` — 자동 수정 적용
- 테스트: `npm test` — 해당 Phase 테스트 GREEN
- 빌드: `npm run build:dev` — 산출물 검증 통과

---

## 참고 문서

| 문서        | 위치                                     |
| ----------- | ---------------------------------------- |
| 완료 로그   | `docs/TDD_REFACTORING_PLAN_COMPLETED.md` |
| 백로그      | `docs/TDD_REFACTORING_BACKLOG.md`        |
| 설계        | `docs/ARCHITECTURE.md`                   |
| 코딩 규칙   | `docs/CODING_GUIDELINES.md`              |
| 실행 가이드 | `AGENTS.md`                              |
