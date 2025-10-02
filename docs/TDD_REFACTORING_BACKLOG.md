# 🗂️ TDD 리팩토링 백로그

> 활성화되지 않은 향후 후보 아이디어 저장소 (선정 전까지 여기서만 유지)
>
> **최근 업데이트**: 2025-01-13 — RED-TEST-001을 활성 Epic으로 승격
>
> 사용 방법:
>
> - 새 사이클 시작 시 이 목록에서 1~3개를 선택하여 `TDD_REFACTORING_PLAN.md`의
>   "활성 스코프"로 승격
> - 선택 기준: 가치(Impact) / 구현 난이도(Effort) / 가드 필요성(Risk of
>   Regression)
> - 승격 후 RED 테스트부터 작성, 완료되면 COMPLETED 로그로 이관
>
> 코멘트 규칙: `상태 | 식별자 | 요약 | 기대 효과 | 난이도(S/M/H) | 비고`
>
> 상태 태그: `IDEA`(순수 아이디어), `READY`(바로 착수 가능), `HOLD`(외부 의존),
> `REVIEW`(설계 검토 필요)

---

## 우선순위별 후보 목록

### HIGH Priority

READY | RED-TEST-002 | Toast/Signal API Native Pattern Migration |
UnifiedToastManager API 통합 완료 | M | 7개 테스트 파일 skip 중

### MEDIUM Priority

READY | THEME-ICON-UNIFY-002 | 아이콘 디자인 개선 및 통합 검증 | Toolbar 아이콘
시각적 통일 + 전체 접근성/성능 검증 | M | Phase A 완료 후 분리 (2025-01-13)
READY | RED-TEST-004 | Signal Selector Performance Utilities |
createSelector/useSelector 최적화 도구 구현 | M | 1개 테스트 파일 (17 tests)
skip 중 READY | RED-TEST-005 | Style/CSS Consolidation & Token Compliance |
스타일 통합 및 디자인 토큰 정책 준수 | M | 4개 테스트 파일 skip 중 READY |
A11Y_LAYER_TOKENS | 레이어(z-index)/포커스 링/대비 토큰 재점검 및 회귀 테스트 |
접근성/스타일 회귀 방지 | M | READY | CONNECT_SYNC_AUTOMATION | 실행 시 접근
호스트 수집→@connect 동기화 스크립트 | 퍼미션 미스 방지/릴리즈 안정성 | M |
READY | SPA_IDEMPOTENT_MOUNT | 라우트/DOM 교체 시 단일 마운트/클린업 가드 테스트
| 중복 마운트/누수 방지 | M | READY | REF-LITE-V4 | 서비스 워ーム업 다이어트 및
벤더 export 정리 (Stages B~C) | Solid 전환 병행 시 런타임 회귀 방지 | M | Solid
Stage C 이후 재승격 후보 READY | BUILD-ALT-001 | esbuild 기반 userscript 빌드
전환 파일럿 | Solid 빌드 호환성 확보 및 빌드 시간 단축 | M | Solid Stage A에서
충돌 발생 시 즉시 재승격

### LOW Priority

READY | RED-TEST-003 | Service Diagnostics Unification |
CoreService/BrowserService 진단 기능 통합 | S | 3개 테스트 파일 skip 중 READY |
RED-TEST-006 | Test Infrastructure Improvements | 테스트 구조/통합/도구 개선 | S
| 5개 테스트 파일 skip 중 READY | SOURCEMAP_VALIDATOR | prod 주석 정책/릴리즈
.map 포함 여부 검사 스크립트 | 빌드 노이즈(404) 제거 | S |

---

## 상세 계획 (승격 전 참고용)

### Epic THEME-ICON-UNIFY-002: 아이콘 디자인 개선 및 통합 검증

**배경**: Epic THEME-ICON-UNIFY-001의 Phase A 완료 후 시간 효율을 위해 Phase
B/C를 별도 Epic으로 분리 (2025-01-13)

**목표**:

- Phase B: 툴바 아이콘 디자인 개선 (2 days)
  - [ ] 아이콘 stroke-width 통일 (디자인 토큰 기반)
  - [ ] 24x24 viewBox 표준화
  - [ ] 시각적 밸런스 조정 (ChevronLeft/Right, Download, Settings)
- Phase C: 통합 검증 및 최적화 (1.5 days)
  - [ ] 테마 전환 성능 테스트 (50ms 이내)
  - [ ] WCAG AA 대비율 검증 (라이트/다크 테마)
  - [ ] 고대비 모드 지원 확인

**예상 난이도**: M (Medium) **예상 소요**: 3-4 days

**전제조건**: Phase A 완료 (14개 테마 토큰 추가, 하드코딩 색상 0개)

---

### Epic RED-TEST-001: SolidJS Gallery JSDOM URL Constructor Fix

**배경**: JSDOM 환경에서 `URL is not a constructor` 오류로 8개 Gallery 테스트
파일 skip 처리됨

**목표**:

- [ ] JSDOM URL 폴리필 추가 또는 URL 사용 회피
- [ ] Gallery 테스트 환경 안정화
- [ ] 8개 테스트 파일 GREEN 전환

**예상 난이도**: M (Medium) **예상 소요**: 1-2 days

**영향 범위**: Gallery/Toolbar 접근성, DOM 정리, Wheel 이벤트, Shadow DOM 격리

### Epic RED-TEST-002: Toast/Signal API Native Pattern Migration

**배경**: UnifiedToastManager의 SolidJS Native 패턴 전환으로 `subscribe()`
메서드가 Solid Accessor 패턴으로 변경됨 (7개 테스트 파일 영향)

**목표**:

- [ ] `subscribe()` → Solid Accessor 패턴 전환 완료
- [ ] Toast API 계약 문서화
- [ ] 7개 테스트 파일 GREEN 전환

**예상 난이도**: M (Medium) **예상 소요**: 2-3 days

**영향 범위**: Toast 시스템, 접근성 알림, Bulk 다운로드 진행 상황

### Epic RED-TEST-003~006: 나머지 RED 테스트 해결

**RED-TEST-003**: Service Diagnostics Unification (S, 1 day)

- CoreService/BrowserService/ServiceManager 진단 기능 통합
- 3개 테스트 파일 영향

**RED-TEST-004**: Signal Selector Performance Utilities (M, 2-3 days)

- createSelector/useSelector/useCombinedSelector 구현
- 1개 테스트 파일 (17 tests) 영향

**RED-TEST-005**: Style/CSS Consolidation & Token Compliance (M, 2-3 days)

- CSS 중복 제거, 디자인 토큰 정책 위반 정리
- 4개 테스트 파일 영향

**RED-TEST-006**: Test Infrastructure Improvements (S, 1-2 days)

- 테스트 구조 정리, Legacy 계약 검증
- 5개 테스트 파일 영향

---

## Parking Lot (보류 중)

(현재 없음)

---

## 참고 문서

| 문서        | 위치                                     |
| ----------- | ---------------------------------------- |
| 활성 계획   | `docs/TDD_REFACTORING_PLAN.md`           |
| 완료 로그   | `docs/TDD_REFACTORING_PLAN_COMPLETED.md` |
| 설계        | `docs/ARCHITECTURE.md`                   |
| 코딩 규칙   | `docs/CODING_GUIDELINES.md`              |
| 실행 가이드 | `AGENTS.md`                              |

---

## Template

```text
READY | IDENTIFIER | 간단 요약 | 기대 효과 | 난이도(S/M/H) | 비고
```

새 항목 추가 시 우선순위에 맞게 HIGH/MEDIUM/LOW 섹션에 배치하며, 제거는 commit
메시지에 사유 명시.
