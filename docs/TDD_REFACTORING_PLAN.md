# TDD 리팩토링 활성 계획 (경량)

본 문서는 "현재 진행 중이거나 즉시 착수 예정" 작업만 간결하게 유지합니다. 완료된
내용은 항상 `TDD_REFACTORING_PLAN_COMPLETED.md`로 이관하여 히스토리를
분리합니다.

**최근 업데이트**: 2025-10-02 — Epic ARCH-SIMPLIFY-001 완료, 신규 Epic 대기

---

## 1. 운영 원칙(요약/링크)

- 코딩/스타일/입력/벤더 접근/테스트 등의 일반 규칙은
  `docs/CODING_GUIDELINES.md`와 `docs/vendors-safe-api.md`를 단일 소스로
  사용합니다.
- 실행/CI/빌드 파이프라인과 스크립트는 루트 `AGENTS.md`를 참조합니다.
  - 본 문서는 "활성 Epic/작업"과 해당 Acceptance에만 집중합니다.

---

## 활성 Epic 현황

**진행 중**:

- **Epic RED-TEST-001** (Gallery JSDOM) - HIGH 우선순위 (진행 중: 2025-10-02)
  - 상태: JSDOM 인프라 수정 완료 (4/8 테스트 통과)
  - 주요 변경:
    1. `test/setup.ts`: Node.js URL 클래스 활용한 폴리필 개선
    2. `vitest.config.ts`: JSDOM `resources: undefined`로 설정해 외부 리소스
       로딩 차단
    3. 8개 테스트 파일 `describe.skip` 제거
  - 통과 테스트 (4개):
    - `gallery-toolbar-parity.test.ts`
    - `gallery-close-dom-cleanup.test.ts`
    - `gallery-renderer-solid-keyboard-help.test.tsx`
    - `solid-gallery-shell.test.tsx`
  - 잔여 실패 (4개): 설정 모달, 휠 이벤트, 스타일 격리 구현 이슈
  - 커밋: cee209dd "feat(infra): resolve JSDOM URL Constructor issue"

- **Epic RED-TEST-002** (Toast/Signal API) - MEDIUM 우선순위 (진행 중:
  2025-10-02)
  - 상태: Toast API 마이그레이션 완료 (6/7 테스트 파일 통과)
  - 주요 변경:
    - UnifiedToastManager API 변경: `subscribe()` 메서드 → `createEffect` 패턴
    - 패턴: `const unsubscribe = manager.subscribe(callback)` →
      `createRoot(disposer => { createEffect(() => { const toasts = manager.getToasts(); }); })`
    - 7개 테스트 파일 `describe.skip` 제거 및 마이그레이션
  - 통과 테스트 (6개 파일):
    - `unified-toast-manager.solid.test.ts`
    - `toast-routing.policy.test.ts`
    - `bulk-download.progress-toast.test.ts`
    - `announce-routing.test.ts`
    - `unified-toast-manager-native.test.ts` (1 test skipped)
  - 부분 실패 (1개 파일): `toast-system-integration.test.ts` (5/11 테스트, 모킹
    이슈)
  - 커밋: 95340c0f "feat(infra): migrate Toast/Signal API to native pattern"

**최근 완료 Epic**:

- **Epic ARCH-SIMPLIFY-001** (2025-10-02 완료): 아키텍처 복잡도 간소화
  - Phase A/B/C/D 모두 완료
  - 세부 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md` 참조

**후보 Epic** (백로그):

- **CSS-OPTIMIZATION**: CSS 번들 최적화 (94 KiB → 70 KiB 목표)
- **E2E-TESTING**: E2E 테스트 인프라 구축 (Playwright)
- **PERF-OPTIMIZATION**: 갤러리 렌더링 성능 개선 (LCP/FID)
- **EPIC-CLEANUP**: 이전 Epic 미완료 항목 정리
  - NAMING-001 Phase C (boolean 함수 린트 룰)
  - LEGACY-CLEANUP-001 False Positive 개선
  - 완료 Epic 문서 최종 정리

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
