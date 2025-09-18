# TDD 리팩토링 활성 계획 (경량)

본 문서는 "현재 진행 중이거나 즉시 착수 예정" 작업만 간결하게 유지합니다. 완료된
내용은 항상 `TDD_REFACTORING_PLAN_COMPLETED.md`로 이관하여 히스토리를
분리합니다.

업데이트: 2025-09-18 — 활성 Epic: TBAR-O (직전: ICN-R 완료)

---

## 1. 불변 운영 원칙

| 영역        | 규칙 요약                                                                   |
| ----------- | --------------------------------------------------------------------------- |
| TypeScript  | strict 100%, 공개 API 명시적 반환 타입                                      |
| 외부 의존성 | preact / signals / fflate / GM\_\* 모두 전용 getter 경유 (직접 import 금지) |
| 입력 이벤트 | PC 전용(click, keydown, keyup, wheel, contextmenu) — 터치/포인터 금지       |
| 스타일      | 색/치수/모션/층(z-index) 모두 토큰 기반 (raw hex/px/ms 직접값 금지)         |
| Result 모델 | 'success' · 'partial' · 'error' · 'cancelled' 고정                          |

테스트 스위트는 위 규칙 위반 시 RED 가드를 유지합니다.

---

## 2. 활성 Epic 현황

### TBAR-O — 툴바 아이콘 & 인디케이터 최적화 (ACTIVE)

Baseline: commit `c05afa54` (2025-09-18) — ICN-R4~R6 아이콘 일관성 완료 직후

문제 요약:

1. 아이콘 사이즈 토큰 다중 선언으로 드리프트 위험
2. `IconButton size="toolbar"` vs 실제 SVG 크기 분리 관리 → 불일치 가능성
3. 진행 카운터(현재/전체 + progress) 인라인/즉흥 구조 → 재사용/테스트 한계
4. legacy `.controls` DOM 잔존 vs 신규 Toolbar 공존 → 중복 & 회귀 리스크
5. icon-only 버튼 ARIA(label) 가드 불충분 / progressbar role/value 검증 부족

목표 (Outcomes):

- 툴바 아이콘 사이즈 단일 선언 (component layer) & 중복 alias 폐기
- `--xeg-size-toolbar-button` 도입: 버튼 높이 ↔ 내부 아이콘 비율 정의
- `<MediaCounter>` 컴포넌트 추출 (stacked / inline 변형, aria-live="polite")
- legacy `.controls` 제거 & 회귀 가드 테스트 추가
- a11y: icon-only aria-label 누락 0, progressbar value/now/percent 불일치 0
- 번들 gzip 영향 +1% 이내 (삭제 코드로 상쇄/동등 유지)

측정 지표 (Metrics):

- Bundle gzip delta ≤ +1% (prod vs Baseline)
- Icon-only aria-label 누락 0 (스캔 테스트)
- Progressbar role/value/text mismatch 0
- Legacy `.controls` 선택자 노출 0
- 중복 아이콘 사이즈 토큰 선언 0

Phase (TDD RED → GREEN → REFACTOR):

| Phase | 코드/테스트 초점                                | 목적                 | 상태        |
| ----- | ----------------------------------------------- | -------------------- | ----------- |
| P1    | 사이즈 토큰 중복 RED 스캔 테스트                | 드리프트 가시화      | DONE        |
| P2    | 단일 canonical 토큰 + 매핑                      | 사이즈 단일화        | DONE        |
| P3    | `<MediaCounter>` 추출 + 기본 a11y               | 재사용 & 접근성 토대 | DONE        |
| P4    | legacy `.controls` 제거 + 회귀 테스트           | 중복 소스 제거       | DONE        |
| P5    | icon-only aria-label & progressbar value 테스트 | 접근성 보증          | DONE        |
| P6    | 번들 사이즈 가드 + preload 최적화               | 성능 영향 최소화     | DONE        |
| P7    | alias/주석 최종 정리 & 문서화                   | 마이그레이션 마무리  | IN-PROGRESS |

Acceptance Criteria:

- PROD 빌드 gzip 증가 ≤ +1% vs Baseline
- Icon-only 버튼 aria-label 누락 0개
- Progressbar role="progressbar" 요소에 aria-valuenow/value/max 정합성 100%
- legacy `.controls` 관련 CSS/DOM/테스트 참조 제거 (회귀 가드 GREEN)
- 중복 사이즈 토큰/alias 제거 및 통합 토큰 1개만 노출
- 완료 후 README/PLAN/백로그에 1줄 요약 반영

위험 & 완화:

- 토큰 통합 시 기존 스타일 회귀 → 단계별 P1 RED 테스트로 탐지
- a11y 속성 누락 → 전수 스캔 테스트 + icon-only 변형 snapshot 비교
- 번들 증량 → P6에서 size regression 테스트로 즉시 감지
- 컴포넌트 추출 후 사용처 미반영 → 타입 오류 & usage 테스트로 검출

Roll-back 전략:

- 각 Phase 독립 커밋 유지 → 문제 발생 Phase 단위 revert 가능
- P3 컴포넌트 추출 전후 API 변경 최소화 (prop 이름 보존)로 빠른 복귀
- 사이즈 토큰 통합 이전 값은 주석으로 1 commit 보존 후 제거

---

## 3. 제안 / 대기 Epic

현재 제안/대기 Epic 없음. 새 Epic은 백로그에 초안 후 승격.

---

## 4. Epic 실행 템플릿 (복사하여 사용)

```markdown
### <EPIC-CODE> — <Epic 간단 설명>

Baseline: commit `<hash>` (YYYY-MM-DD)

문제 요약:

1. <항목>
2. <항목>

목표 (Outcomes):

- <정량/정성 목표>
- <정량/정성 목표>

측정 지표 (Metrics):

- (예) 번들 gzip ≤ +5% vs baseline
- (예) a11y ARIA missing rate 0

Phase (TDD RED → GREEN → REFACTOR): | Phase | 코드 | 목적 | 상태 | | ----- |
---- | ---- | ---- | | P1 | ... | ... | (RED/GREEN/REF) |

Acceptance Criteria:

- <AC1>
- <AC2>

위험 & 완화:

- 위험: <내용> / 완화: <전략>

Roll-back 전략:

- Feature flag `<flag>` 제거 시 이전 동작 복원 (분리 커밋 보존)
```

---

## 5. TDD 워크플로 (Reminder)

1. RED: 실패 테스트(또는 TODO) 추가 — 최소 명세만 표현
2. GREEN: 가장 작은 변경으로 통과 (과도한 범위 확대 금지)
3. REFACTOR: 중복 제거 / 구조 개선 (동일 테스트 GREEN 유지)
4. Rename: `.red.` 파일명 제거 → 가드 전환
5. 이동: 완료 항목 본 문서에서 제거 & Completed 로그에 1줄 요약

Gate 체크리스트 (병합 전):

- `npm run typecheck`
- `npm run lint`
- `npm test` (selective RED 허용)
- `npm run build:prod` + 산출물 validator

---

## 6. 참고 문서

| 문서                   | 위치                                     |
| ---------------------- | ---------------------------------------- |
| 완료 로그              | `docs/TDD_REFACTORING_PLAN_COMPLETED.md` |
| 백로그                 | `docs/TDD_REFACTORING_BACKLOG.md`        |
| 코딩 규칙              | `docs/CODING_GUIDELINES.md`              |
| 계획 아카이브(축약 전) | `docs/archive/`                          |

필요 시 새 Epic 제안은 백로그에 초안(Problem/Outcome/Metrics) 형태로 먼저 추가
후 합의되면 본 문서 Epic 템플릿 섹션에 승격합니다.
