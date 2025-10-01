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

### Epic: NAMING-001 Phase B — Boolean 함수 명명 규칙 적용 📝 **활성**

**목표**: Phase A에서 발견한 boolean 반환 함수들의 명명 규칙 적용 (적절한 접두사
추가)

**Phase A 결과 분석**:

- 초기 검출: 46건 (HIGH priority)
- False Positive 제거 (void 반환): 32건
- **실제 리네이밍 대상**: 4-6건

**실제 대상 함수**:

1. `prefersReducedMotion` → `doesUserPreferReducedMotion`
2. `getDebugMode` → `isDebugModeEnabled`
3. `matchesMediaQuery` (미검출, 수동 확인) → `doesMediaQueryMatch`
4. `detectLightBackground` (미검출, 수동 확인) → `isLightBackground`
5. `triggerGarbageCollection` → 검토 후 결정 (성공 여부 반환)
6. `areGallerySignalsReady` → 유지 (이미 적절한 접두사)

**현재 상태**: Phase B-1 시작 (명확한 개선 대상 2건)

**최근 완료**:

- Epic NAMING-001 Phase A (2025-01-22) - 명명 규칙 스캐너 개발 및 전수 스캔 완료
- 스캐너 개선 (false positive 필터링) - void 반환 함수 제외 로직 추가
- Epic LEGACY-CLEANUP-001 (2025-10-01) - 레거시 패턴 정리 완료

**백로그 후보**:

- Epic NAMING-001 Phase C: 린트 룰 추가 및 문서화
- CSS-OPTIMIZATION: CSS 번들 최적화
- E2E 테스트 인프라 구축

---

## Phase B-1: 명확한 개선 대상 리네이밍 (2건)

**목표**: 명확하게 개선이 필요한 2개 함수 리네이밍

**작업 항목**:

1. **prefersReducedMotion → doesUserPreferReducedMotion**
   - 파일: `src/shared/browser/utils/browser-utils.ts`
   - 이유: 사용자 선호도 조회 함수는 `does` 동사가 더 적절
   - 영향 범위: 사용처 모두 업데이트 필요

2. **getDebugMode → isDebugModeEnabled**
   - 파일: `src/shared/utils/signalSelector.ts`
   - 이유: boolean 반환 함수는 `is/has/can` 접두사가 표준
   - 영향 범위: 사용처 모두 업데이트 필요

**Acceptance Criteria**:

- [ ] prefersReducedMotion 리네이밍 완료 (TDD: RED → GREEN → REFACTOR)
- [ ] getDebugMode 리네이밍 완료 (TDD: RED → GREEN → REFACTOR)
- [ ] 모든 참조 업데이트 완료 (grep 검색으로 확인)
- [ ] 품질 게이트: typecheck/lint/test ALL GREEN
- [ ] 커밋: Phase B-1 완료

**추정 소요**: 2-3시간

---

## 다음 사이클 준비

- 현재 Epic: **NAMING-001 Phase B** (진행 중)
- 완료 Epic: NAMING-001 Phase A, LEGACY-CLEANUP-001, SOLID-NATIVE-002, UX-001,
  UX-002 (`TDD_REFACTORING_PLAN_COMPLETED.md` 참조)
- 다음 후보:
  - Epic NAMING-001 Phase B: HIGH priority 46건 리네이밍
  - CSS-OPTIMIZATION: CSS 번들 최적화
  - E2E 테스트 인프라 구축

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
