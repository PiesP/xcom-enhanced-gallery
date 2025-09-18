# TDD 리팩토링 활성 계획 (경량)

본 문서는 "현재 진행 중이거나 즉시 착수 예정" 작업만 간결하게 유지합니다. 완료된
내용은 항상 `TDD_REFACTORING_PLAN_COMPLETED.md`로 이관하여 히스토리를
분리합니다.

업데이트: 2025-09-18 — 활성 Epic: DEPS-GOV (Dependency Governance 개선 진행 중)

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

### DEPS-GOV — dependency-cruiser 정확도 & 실행 효율 개선

Baseline: commit `<latest>` (2025-09-18)

문제 요약:

1. `deps:all` 스크립트가 dependency-cruiser 프로세스를 4회 기동 → 중복 초기화
   비용
2. `no-orphans` 규칙이 실제 참조되는 bootstrap/loader 모듈을 6건 info로 노이즈
   출력
3. TS path alias(`@`, `@shared`, `@features`) 해석 누락 가능성으로 edge 미인식
   추정
4. 빈 placeholder(`icon-types.ts`) 및 미래 확장 포인트(`progressive-loader.ts`)
   구분 불명확

목표 (Outcomes):

- Orphan info 노이즈 6 → ≤2 (실제 미사용/placeholder만 남김)
- deps 보고/검증 실행 시간(로컬) 체감 감소(프로세스 수 4 → 1)
- 구성 명확성: path alias 해석 TS 기반으로 일관 적용
- 아키텍처 테스트: orphan 최소화 및 vendor 직접 import 위반 지속 보호

측정 지표 (Metrics):

- Orphan info count (현재: 6)
- deps:all 대체 스크립트 wall time (초, 3회 평균)
- Config 복잡도(외부 스크립트 수) 4 → 1 (Node API 통합)

Phase (TDD RED → GREEN → REFACTOR): | Phase | 코드 | 목적 | 상태 | | ----- |
---- | ---- | ---- | | P1 | config-resolution.red.test.ts | TS path alias 미해결
상태 RED 재현 | RED | | P2 | .dependency-cruiser.cjs 조정 | tsConfig 지정 +
orphan whitelist 축소 | PENDING | | P3 | deps:all 통합 스크립트(Node API) | 4회
실행 → 단일 실행 통합 | PENDING | | P4 | orphan-accuracy.test.ts | Orphan ≤2
검증 및 시간 측정 가드 | PENDING | | P5 | 문서/Completed 로그 이동 | 계획 섹션
정리 & 결과 기록 | PENDING |

Acceptance Criteria:

- P4 시점 orphan info ≤2
- 신규 통합 스크립트로 json + dot + svg + validate 모두 산출
- 기존 테스트 스위트 GREEN (새 RED 테스트는 GREEN 전환 후 `.red.` 제거)
- 문서에 before/after orphan & runtime 요약 추가

위험 & 완화:

- 위험: alias 해석 추가 후 edge 급증 → dot 그래프 복잡도 증가 / 완화:
  collapsePattern 재도입 고려(후속)
- 위험: Node API 마이그레이션 회귀 / 완화: 기존 스크립트 일시 보존(feat flag) →
  성공 후 제거

Roll-back 전략:

- 실패 시 통합 스크립트 미사용 및 기존 `deps:all` 재사용 (커밋 revert). Config
  변경은 주석 통해 원복 경로 명시.

---

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
