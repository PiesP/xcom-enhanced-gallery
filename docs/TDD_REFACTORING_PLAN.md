# TDD 리팩토링 활성 계획 (경량)

본 문서는 "현재 진행 중이거나 즉시 착수 예정" 작업만 간결하게 유지합니다. 완료된
내용은 항상 `TDD_REFACTORING_PLAN_COMPLETED.md`로 이관하여 히스토리를
분리합니다.

업데이트: 2025-09-25 — Epic "REF-LITE-V3 (Userscript 번들 경량화)" Stage 3까지
완료되어 현재 활성 작업 없음. 직전 Epic "VP-Focus-Indicator-001"은 Completed
로그로 이관되었습니다. 세부 히스토리는 `TDD_REFACTORING_PLAN_COMPLETED.md`를
참조하세요.

---

## 1. 운영 원칙(요약/링크)

- 코딩/스타일/입력/벤더 접근/테스트 등의 일반 규칙은
  `docs/CODING_GUIDELINES.md`와 `docs/vendors-safe-api.md`를 단일 소스로
  사용합니다.
- 실행/CI/빌드 파이프라인과 스크립트는 루트 `AGENTS.md`를 참조합니다.
  - 본 문서는 “활성 Epic/작업”과 해당 Acceptance에만 집중합니다.

---

## 2. 활성 Epic 현황

### EPIC — SETTINGS-FORM-CONTROL-CONSISTENCY (진행 중)

- **문제 정의**: 설정 패널의 `select`와 `checkbox`가 UA 기본 스타일에 의존해
  라이트/다크 테마 간 배경·경계·선택 색상이 불일치합니다.
  `--xeg-color-neutral-0` 등의 토큰이 정의되지 않아 토큰 스캔 테스트에서도 잠재
  경고가 누적되고, 고대비/감소된 모션 시각 대비 기준을 만족하지 못합니다.
- **제약 조건**:
  - 디자인 토큰(`design-tokens.*.css`)을 단일 소스로 유지하고, 모듈 CSS에서는
    토큰만 참조합니다.
  - PC 전용 입력/포커스 링 정책(`CODING_GUIDELINES.md`)을 준수합니다.
  - 기존 `controlSurface` 프리미티브와 SettingsModal 테스트 스위트와의 호환성을
    보존합니다.

#### 솔루션 옵션 비교

1. **옵션 A — SettingsModal 모듈 내부에서 select/checkbox에 직접 토큰 적용**
   - 장점: 변경 범위가 좁고 구현이 빠릅니다.
   - 단점: 토큰이 중복 정의되어 다른 폼 컨트롤에서 재사용하기 어렵고, 다크
     모드에 맞춘 명시적 오버라이드가 누락될 위험이 큽니다.
2. **옵션 B — 공용 Form Control 토큰과 프리미티브 확장(선택)**
   - 장점: `design-tokens.semantic.css`/`component.css`에 폼 컨트롤 전용 토큰을
     추가해 라이트/다크를 일관되게 제어하고, `primitives.module.css`의
     `controlSurface` 변형으로 재사용이 가능합니다.
   - 단점: 토큰 계층을 건드리므로 회귀 테스트를 모두 통과시켜야 하고, 초기
     정의가 과도하면 유지보수 비용이 증가할 수 있습니다.
3. **옵션 C — 전용 Checkbox/Select UI 컴포넌트 신설**
   - 장점: 향후 설정 화면 확장 시 재사용성과 접근성 가드를 컴포넌트 레벨에서
     강제할 수 있습니다.
   - 단점: 신규 컴포넌트 도입 및 마이그레이션 비용이 높고, 현 시점 스코프를
     벗어납니다.

→ **결정**: 옵션 B를 채택합니다. 토큰 계층을 보강해 라이트/다크 및 고대비 모드
일관성을 확보하고, SettingsModal과 향후 폼 컨트롤이 동일한 프리미티브를
공유하도록 합니다.

#### Acceptance Criteria

1. `SettingsModal`의 `select`와 `checkbox`에 적용된 배경/경계/호버/선택/disabled
   색상이 라이트/다크 모드 모두에서 새 `--xeg-form-control-*` 토큰을 사용해
   정의된다.
2. 포커스 링, 고대비(`prefers-contrast: high`), 모션
   감소(`prefers-reduced-motion`) 가 기존 가이드라인과 동일하게 유지된다.
3. `dist/xcom-enhanced-gallery*.user.js` 빌드에서 UA 기본 색상 대비 문제 없이
   신규 토큰이 출력되며, 관련 Vitest 스위트가 GREEN 상태를 유지한다.

#### TDD Plan (RED → GREEN → REFACTOR)

1. **RED**
   - `test/unit/features/settings/settings-controls.tokens.test.ts`에 form
     control 토큰 사용을 검증하는 케이스를 추가한다(`--xeg-form-control-bg` 등
     문자열 존재 여부, checkbox 클래스 포함 여부).
   - 새 통합 테스트
     `test/features/settings/settings-modal.form-controls.theme.test.tsx` 를
     작성해 라이트/다크 테마 전환 시 select/checkbox에 form-control 클래스가
     적용되고 프리미티브 조합이 유지되는지 검증한다.
2. **GREEN**
   - `design-tokens.semantic.css`/`design-tokens.component.css`에
     `--xeg-form-control-*` 토큰을 추가하고 다크/고대비 오버라이드를 정의한다.
   - `primitives.module.css`에 form-control 변형을 추가하거나 SettingsModal용
     유틸리티 클래스를 만들어 `controlSurface`와 결합한다.
   - `SettingsModal.module.css`와 `SettingsModal.tsx`(및
     `RefactoredSettingsModal.tsx`)에서 select/checkbox에 새 클래스를 부여하고,
     `appearance: none` 기반 커스텀 체크 UI를 토큰으로 구성한다.
3. **REFACTOR**
   - 중복 토큰/스타일을 제거하고, 드롭다운/체크박스가 동일한 form-control
     프리미티브를 사용하도록 정리한다.
   - Tests/Docs를 최신 상태로 유지하고 Completed 로그로 이관할 준비를 한다.

#### 품질 게이트

- `npm run typecheck`, `npm run lint`, `npm test` (신규/갱신 테스트 포함).
- `npm run build:dev` 후 `scripts/validate-build.js`로 dist 산출물 검사.
- 필요 시 `npm run test -- --runInBand settings-modal`로 집중 스위트 점검.

## 3. 다음 사이클 준비 메모(Placeholder)

- 신규 Epic 제안은 백로그에 초안 등록 후 합의되면 본 문서의 활성 Epic으로
  승격합니다.

---

## 5. TDD 워크플로 (Reminder)

1. RED: 실패 테스트(또는 TODO) 추가 — 최소 명세만 표현
2. GREEN: 가장 작은 변경으로 통과 (과도한 범위 확대 금지)
3. REFACTOR: 중복 제거 / 구조 개선 (동일 테스트 GREEN 유지)
4. Rename: `.red.` 파일명 제거 → 가드 전환
5. 이동: 완료 항목 본 문서에서 제거 & Completed 로그에 1줄 요약

Gate 체크리스트(요지):

- 타입/린트/테스트/빌드 검증은 `AGENTS.md`와 `CODING_GUIDELINES.md`의 품질
  게이트를 따릅니다.

---

## 6. 참고 문서

| 문서                   | 위치                                     |
| ---------------------- | ---------------------------------------- |
| 완료 로그              | `docs/TDD_REFACTORING_PLAN_COMPLETED.md` |
| 백로그                 | `docs/TDD_REFACTORING_BACKLOG.md`        |
| 설계                   | `docs/ARCHITECTURE.md`                   |
| 코딩 규칙              | `docs/CODING_GUIDELINES.md`              |
| 계획 아카이브(축약 전) | `docs/archive/`                          |

필요 시 새 Epic 제안은 백로그에 초안(Problem/Outcome/Metrics) 형태로 먼저 추가
후 합의되면 본 문서 Epic 템플릿 섹션에 승격합니다.

---

## 7. 품질 게이트 및 검증 방법

모든 Epic/Task는 다음 게이트를 통과해야 합니다.

- 타입: `npm run typecheck` — strict 오류 0
- 린트/포맷: `npm run lint` / `npm run format` — 수정 사항 없거나 자동 수정 적용
- 테스트: `npm test` — 신규/갱신 테스트 GREEN, 리팩터링 임시 RED만 허용 주석
  필수
- 빌드: `npm run build:dev`/`prod` — 산출물 검증 스크립트 통과

추가로, 접근성 전용 스모크:

- Tab/Shift+Tab 네비게이션 스모크, Escape 복귀 스모크, aria-live 공지 스냅샷

메모리 전용 스모크:

- 타이머/리스너 카운트 0, revoke 큐 0, 대량 로딩 후 회복 확인(모킹)

---

## Change Notes (Active Session)

- 2025-09-25: REF-LITE-V3 Stage 3 Heroicons 정리 완료. Epic 전체가 Completed
  로그로 이관되었으며, 신규 경량화 착수 전까지 활성 작업 없음.
- 2025-09-26: Settings 폼 컨트롤 Epic 선행 작업으로 중간 톤 중립 색상 토큰과
  `--xeg-color-border-hover` alias를 토큰 계층에 추가하고, 이에 대한 TDD 가드
  `test/styles/design-tokens.neutral-scale.test.ts`를 도입했습니다.
