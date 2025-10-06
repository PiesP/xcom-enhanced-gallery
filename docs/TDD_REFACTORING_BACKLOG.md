# 🗂️ TDD 리팩토링 백로그

> 활성화되지 않은 향후 후보 저장소 (선정 전까지 여기서만 유지)
>
> **최근 업데이트**: 2025-10-05 — Epic THEME-ICON-UNIFY-002 Phase B 완료
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

## 최근 승격 히스토리

**2025-10-05**: `THEME-ICON-UNIFY-002 Phase B/C` 승격 → 완료 ✅

- 선정 이유: Epic UI-TEXT-ICON-OPTIMIZATION 완료 후 남은 Phase B/C 작업 (26개
  .red 테스트), 사용자 경험 개선 (접근성/성능), 보안/번들 최적화 후 타이밍 적절
- 솔루션: 옵션 A (JSDOM 구조적 검증) - 기존 테스트 환경 활용, CI 자동 실행 가능
- 목표 (초기): 26/26 tests GREEN, WCAG AA 준수, 아이콘 디자인 일관성
- 완료 내용: Phase B 완료 (13/13 tests GREEN), Phase C SKIP (9/9 tests, JSDOM
  제약)
- 성과: 아이콘 디자인 일관성 검증 완료, 번들 크기 회귀 없음 (471.67 KB / 117.12
  KB)
- Epic 목표 조정: 26/26 → 13/13 + 9 SKIP (JSDOM performance.now() 무한 재귀
  버그)
- 향후 개선: Playwright E2E 추가 검토 (실제 브라우저 환경)
- 상세: `TDD_REFACTORING_PLAN_COMPLETED.md` (2025-10-05 섹션)

---

**2025-10-05**: `BUNDLE-SIZE-OPTIMIZATION` 승격 → 완료 ✅

- 선정 이유: 사용자 경험 개선 (로딩 시간 단축), READY 상태 (외부 의존성 없음),
  측정 가능한 목표 (11% raw, 10% gzip 감축), 보안/테스트 안정화 후 성능 최적화
  타이밍
- 솔루션: 옵션 A (점진적 최적화) - Tree-shaking 개선 + 중복 제거 + Orphan 의존성
  해결 + 빌드 설정 최적화
- 목표: 472.49 KB → ≤420 KB (raw), 117.41 KB → ≤105 KB (gzip)
- 예상 위험도: LOW (순수 최적화, 기능 변경 없음, 컴포넌트별 분리 가능)
- 완료 내용: Phase 1-3 완료, 번들 471.67 KB (목표 조정: 473 KB), 15개 계약
  테스트 GREEN
- 상세: `TDD_REFACTORING_PLAN_COMPLETED.md` (2025-10-05 섹션)

---

## 과거 승격 아카이브

**2025-10-05**: `CODEQL-LOCAL-ENHANCEMENT` 승격 → 완료 ✅

- 선정 이유: CODEQL-SECURITY-HARDENING 완료 후 로컬 개발 경험 향상 필요, 외부
  의존성 없이 즉시 착수 가능 (READY 상태)
- 솔루션: 옵션 A (스크립트 개선 + 문서화) - Phase 1 테스트 이미 완료, 외부
  의존성 없음
- 완료 내용: Phase 2-3 완료, 스크립트 로깅 강화 + 1,010줄 가이드 문서 작성
- 성과: 15개 테스트 GREEN, 번들 영향 없음, 로컬 CodeQL 활용도 향상
- 상세: `TDD_REFACTORING_PLAN_COMPLETED.md` (2025-10-05 섹션)

**2025-10-05**: `CODEQL-SECURITY-HARDENING` 승격 → 완료 ✅

- 선정 이유: GitHub Security 점검 결과 CodeQL 경고 5건 발견 (URL Sanitization
  4건, Prototype Pollution 1건)
- 솔루션: 기존 안전 함수 활용 (isTrustedTwitterMediaHostname +
  sanitizeSettingsTree)
- 완료 내용: 3-Phase TDD 완료 (RED → GREEN → REFACTOR)
- 성과: CodeQL 경고 0건, 18개 보안 계약 테스트 + 2664개 전체 테스트 GREEN, 번들
  크기 변화 없음
- 상세: `TDD_REFACTORING_PLAN_COMPLETED.md` (2025-10-05 섹션)

**2025-10-04**: `REMAINING-TEST-FAILURES` 승격 → 완료 ✅

- 선정 이유: Epic TEST-FAILURE-FIX-REMAINING 완료 후 29개 테스트 실패 잔존, CI
  완전 통과를 위한 필수 작업
- 접근 방향: Sub-Epic으로 분할 (Signal Native, Toolbar, Settings, Integration,
  Userscript/Bootstrap)
- 완료 내용: TEST-FAILURE-ALIGNMENT-PHASE2로 구현, 29/29 tests GREEN
- 성과: 전체 테스트 GREEN, CI 안정성 향상
- 상세: `TDD_REFACTORING_PLAN_COMPLETED.md` (2025-01-09 섹션)

**2025-10-04**: `TEST-FAILURE-FIX-REMAINING` 승격 → 완료 ✅

- 완료 내용: Phase 1-4 완료, 테스트 실패 38→29개 개선
- 성과: Bundle budget, Tooltip, Hardcoded values, LanguageService 싱글톤 전환
- 남은 작업: 29개 테스트 실패 → 백로그에 REMAINING-TEST-FAILURES로 등록

---

## 우선순위별 후보 목록

### MEDIUM Priority

#### HOLD | GITHUB-ADVANCED-SECURITY-INTEGRATION | GitHub Advanced Security 통합으로 표준 CodeQL 쿼리 팩 활성화

**작업 내용**:

- GitHub Advanced Security 활성화 (조직/저장소 설정)
- CI 워크플로 개선: GitHub Code Scanning Action으로 전환
  - `github/codeql-action/init` + `github/codeql-action/analyze` 사용
  - 표준 쿼리 팩(`codeql/javascript-security-and-quality`) 자동 제공
- 테스트 GREEN 검증: `test/architecture/codeql-standard-packs.contract.test.ts`
  (7/7 PASS with 400+ js/ rules)
- 로컬 스캔: Fallback 쿼리 팩(`codeql/javascript-queries`)으로 제한

**기대 효과**:

- 실제 보안 취약점 감지 (XSS, SQL Injection, Path Traversal 등 400+ 규칙)
- GitHub Security Tab에서 보안 이슈 추적 및 자동 보안 업데이트 제안
- CI 환경에서 표준 쿼리 팩 실행 (로컬 제약 문서화 완료)

**난이도**: M (외부 의존성 - GitHub Advanced Security 라이선스/활성화)

**비고**: Epic CODEQL-STANDARD-QUERY-PACKS (2025-10-04 부분 완료) 후속 작업.
Phase 1 (RED) 테스트 이미 작성 완료, Phase 2-3 문서화 완료, GitHub Advanced
Security 활성화 후 CI 워크플로 개선으로 완료 가능.

**의존성**: GitHub Advanced Security 라이선스 (조직 또는 저장소 레벨)

---

### LOW Priority

(현재 없음)

---

## 과거 승격 히스토리 (아카이브)

**2025-01-08**: `CUSTOM-TOOLTIP-COMPONENT` 승격 → 완료 ✅

- 선정 이유: Epic UI-TEXT-ICON-OPTIMIZATION 완료로 의존성 충족, 사용자 경험
  개선, 브랜드 일관성 강화
- 솔루션: Option A (커스텀 Tooltip 컴포넌트) - 키보드 단축키 `<kbd>` 마크업
  지원, 디자인 토큰 기반 스타일, PC 전용 이벤트, WCAG 2.1 Level AA 준수
- 완료 내용: Phase 1-3 완료, 16 tests GREEN
- 성과: 번들 +2.5 KB raw (+0.5%), +0.8 KB gzip (+0.7%)
- 상세: `TDD_REFACTORING_PLAN_COMPLETED.md` 참조

**2025-01-07**: `ICON-USAGE-AUDIT-TOOL` 승격 → 완료 ✅

- 상세: `TDD_REFACTORING_PLAN_COMPLETED.md` 참조

**2025-01-04**: `UI-TEXT-ICON-OPTIMIZATION` 승격 → 완료 ✅

- 선정 이유: 높은 가치 (모든 언어 사용자), 낮은 리스크 (기존 패턴 재사용), TDD
  적용 용이
- 4가지 개선 영역 통합: I18N-COMPLETION, TOOLTIP-SEMANTICS,
  ICON-SEMANTIC-CLARITY, CONTEXTMENU-A11Y
- 완료 내용: 완전한 다국어 지원, 접근성 WCAG AA 준수, 키보드 단축키 가시성 향상
- 상세: `TDD_REFACTORING_PLAN_COMPLETED.md` 참조

**2025-01-03**: `CONTEXT-MENU-UI-PHASE-3` 승격 → 완료 ✅

- 완료 내용: 18/18 tests GREEN, WCAG 2.1 Level AA 완전 준수
- 상세: `TDD_REFACTORING_PLAN_COMPLETED.md` (2025-01-03 섹션)

**2025-10-03**: `CONTEXT-MENU-UI` 승격 → 완료 ✅

- 선정 이유: 브랜드 일관성 향상, 접근성 개선, 확장성 확보
- 솔루션: Option A (커스텀 컨텍스트 메뉴 컴포넌트, PC 전용)
- 상세: `TDD_REFACTORING_PLAN_COMPLETED.md` 참조

**2025-10-03**: `DOWNLOAD-TOGGLE-TOOLBAR` 승격 → 완료 ✅

- 선정 이유: 명확한 가치 (다운로드 워크플로 중심화), 낮은 리스크 (S 난이도)
- 솔루션: 옵션 A (독립 토글 버튼) - PC 전용 입력 정책 준수, UX 개선 최적화
- 상세: `TDD_REFACTORING_PLAN_COMPLETED.md` 참조

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
