# TDD 리팩토링 활성 계획 (경량)

본 문서는 "현재 진행 중이거나 즉시 착수 예정" 작업만 간결하게 유지합니다. 완료된
내용은 항상 `TDD_REFACTORING_PLAN_COMPLETED.md`로 이관하여 히스토리를
분리합니다.

업데이트: 2025-09-18 — 활성 Epic: TBAR-R (Toolbar Refinement) (직전: TBAR-O
완료)

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

### TBAR-R — Toolbar Button/Indicator Refinement & Consolidation

Baseline: commit `<CURRENT_HEAD>` (2025-09-18)

문제 요약:

1. 툴바 버튼 사이즈 2.5em 하드코딩이 여러 CSS 모듈(Button.module.css /
   Toolbar.module.css / SettingsModal.module.css 등)에 중복 존재 — 단일
   토큰(`--xeg-size-toolbar-button`) 선언에도 불구하고 재정의로 유지보수 비용
   증가
2. `.toolbarButton` / `.xeg-toolbar-button` / IconButton 변형 등 스타일 책임이
   복수 파일에 분산되어 상태(data-\* attrs)별 시각 일관성 테스트가 어려움 (중복
   정의로 회귀 위험)
3. MediaCounter 레이아웃/스타일 일부가 Toolbar.module.css에 포워딩 중복
   (.mediaCounter / .mediaCounterWrapper) — 단일 책임 원칙 위배 및 양쪽 수정 시
   동기화 리스크
4. Indicator(현재/전체)와 아이콘 버튼 수직/수평 배치 규칙이 명시적
   추상화(primitive)가 없어 향후 기능(즐겨찾기, 북마크 등) 버튼 추가 시
   정렬/간격 회귀 가능성
5. 접근성(a11y) 관점에서 툴바 내 영역 순서(Navigation → Status/Indicator →
   Actions)가 암묵적 DOM 순서에 의존, 회귀 방지 테스트 부재

목표 (Outcomes):

- 단일 ToolbarButton Primitive 도입으로 툴바 버튼 크기/상태/의도(intent) 스타일
  정의를 1곳으로 축소
- 토큰 기반 사이즈 적용: 하드코딩된 2.5em 제거율 100% (허용 위치:
  design-tokens.component.css 단 1회)
- MediaCounter 이중 스타일 제거 및 자체 모듈만 유지 (forward duplication 0건)
- a11y 구조 고정: Navigation(Group) → Status(MediaCounter group role) →
  Actions(group) 순서 테스트 가드 추가
- CSS 중복 감소: 관련 선택자/규칙 줄 수 최소 25% 감소 (Toolbar/Button 관련 diff
  측정)
- 회귀 방지 테스트 5종(P1 RED) 추가 후 GREEN 유지

측정 지표 (Metrics):

- `scripts/build-metrics.js` 기반 toolbar/button 관련 CSS gzip 사이즈 감소 ≥ 5%
  (baseline 대비)
- grep "2.5em" 결과: design-tokens.component.css 1회 이외 0회
- Toolbar 렌더된 버튼 노드 개수 대비 data-\* 상태(classless override) 충돌 0건
- a11y DOM 순서 테스트 통과율 100%
- PR 커버리지: 새/수정 테스트 100% GREEN

Phase (TDD RED → GREEN → REFACTOR) — 활성(남은) 항목만:

| Phase | 코드(식별자)                  | 목적                                                  | 상태   |
| ----- | ----------------------------- | ----------------------------------------------------- | ------ |
| P5    | Focus order navigation test   | 실제 키보드(Arrow/Tab/Home/End) 순서 심층 검증        | ACTIVE |
| P6    | Cleanup & Docs                | 레거시 `.toolbarButton` 선택자/주석 제거 & 문서 정리  | TODO   |
| P7    | Metrics & CSS size validation | CSS gzip 감소 ≥5% 측정 및 build-metrics 스크립트 보강 | TODO   |

Acceptance Criteria (Remaining / In-Scope):

- [ ] `.toolbarButton` (legacy) 잔여 선택자 정리 및 단일화 (필요 시 구조 리팩터)
- [ ] 키보드 포커스 실제 순서 확증: Prev → Next → (Counter skip 허용) → Fit
      모드들 → 다운로드 관련 → Settings(조건부) → Close
- [ ] CSS gzip 감소 ≥ 5% (baseline metrics 대비) — metrics 계산 및 리포트 추가
- [ ] Focus navigation test: ArrowLeft/Right, Home/End, Escape 시나리오 회귀
      가드
- [ ] 문서/코드: data-toolbar-group / data-group-first 규약 설명
      CODING_GUIDELINES 반영

이미 충족된 항목(P1–P4 관련 토큰/Primitive/Grouping)은 Completed 로그로 이관됨.

위험 & 완화:

- 위험: 테스트 스냅샷 대량 변경 → 완화: 구조적 테스트(쿼리/role 기반)로 전환,
  snapshot 최소화
- 위험: 다국어/문자열 회귀 (aria-label) → 완화: role/label 정규화 테스트 추가
- 위험: 외부 의존 배포 중 스타일 누락 → 완화: build 산출물 validate-build.js
  확장 (선택자 존재 검증 추가 가능)

Roll-back 전략:

- 새 Primitive 도입 커밋 revert 시 기존 IconButton 기반 구조로 즉시 복구 가능
  (CSS 중복 복원)
- 테스트는 revert 후에도 GREEN (단, RED 가드는 제거 필요하므로 revert 시 RED
  테스트 동반 삭제)

Notes:

- Epic 코드: TBAR-R (Toolbar Refinement) — TBAR-O 후속 유지보수
- Feature flag 불필요 (구조/스타일 단순화로 기능 토글 가치 낮음)

---

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
