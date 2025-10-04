# 🗂️ TDD 리팩토링 백로그

> 활성화되지 않은 향후 후보 저장소 (선정 전까지 여기서만 유지)

> **최근 업데이트**: 2025-10-04 — Epic CODEQL-SECURITY-HARDENING 승격
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

**2025-10-04**: `CODEQL-SECURITY-HARDENING` 승격 → `TDD_REFACTORING_PLAN.md`의
Epic CODEQL-SECURITY-HARDENING으로 이동

- 선정 이유: CodeQL 분석 5건 경고 (URL Sanitization, Prototype Pollution), 보안
  등급 향상 필수
- 접근 방향: 기존 `isTrustedTwitterMediaHostname()` 활용 강화 +
  `sanitizeSettingsTree()` 가드 강화
- 예상 영향: CodeQL 경고 0건, 보안 등급 A, 번들 영향 최소 (+150 bytes raw)

**2025-10-04**: `REMAINING-TEST-FAILURES` 승격 → `TDD_REFACTORING_PLAN.md`의
Epic TEST-FAILURE-ALIGNMENT-PHASE2로 이동

- 선정 이유: Epic TEST-FAILURE-FIX-REMAINING 완료 후 29개 테스트 실패 잔존, CI
  완전 통과를 위한 필수 작업
- 접근 방향: Sub-Epic으로 분할 (Signal Native, Toolbar, Settings, Integration,
  Userscript/Bootstrap)
- 예상 영향: 전체 테스트 GREEN, CI 안정성 향상

**2025-10-04**: `TEST-FAILURE-FIX-REMAINING` 완료 ✅

- 완료 내용: Phase 1-4 완료, 테스트 실패 38→29개 개선
- 성과: Bundle budget, Tooltip, Hardcoded values, LanguageService 싱글톤 전환
- 남은 작업: 29개 테스트 실패 → 백로그에 REMAINING-TEST-FAILURES로 등록

---

## 우선순위별 후보 목록

### MEDIUM Priority

#### READY | CODEQL-LOCAL-ENHANCEMENT | 로컬 CodeQL 워크플로 개선 (Fallback 쿼리 팩 활용)

**작업 내용**:

- 로컬 스캔 스크립트 개선 (`scripts/run-codeql.mjs`)
  - Fallback 쿼리 팩(`codeql/javascript-queries`) 명시적 사용
  - 스캔 결과 상세 로깅 (쿼리 팩 종류, 규칙 수, SARIF 통계)
  - 에러 처리 개선 (표준 쿼리 팩 실패 시 graceful fallback)
- 테스트 조건부 수정
  - Advanced Security 감지 함수 구현 (`hasAdvancedSecurity()`)
  - 감지 시 엄격 모드 (400+ js/ 규칙 요구)
  - 미감지 시 relaxed 모드 (Fallback 쿼리 팩 허용)
- 문서화 강화
  - 로컬 CodeQL 활용 가이드 (`docs/CODEQL_LOCAL_GUIDE.md`)
  - 쿼리 팩 차이 설명 (표준 vs Fallback)
  - `AGENTS.md`, `ARCHITECTURE.md` 업데이트

**기대 효과**:

- 로컬 개발 경험 개선 (명확한 제약 이해)
- 기본 보안 규칙 적용 (Fallback 쿼리 팩 50+ 규칙)
- Advanced Security 없이도 CodeQL 활용 가능
- 문서화로 팀 전체 활용도 증가

**난이도**: S (외부 의존성 없음, 기존 스크립트 개선)

**비고**: Epic GITHUB-ADVANCED-SECURITY-INTEGRATION (HOLD)과 분리된 독립 작업.
표준 쿼리 팩 활성화 전까지 로컬 환경 개선에 집중.

---

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

**2025-01-08**: `CUSTOM-TOOLTIP-COMPONENT` 승격 → `TDD_REFACTORING_PLAN.md` 활성
Epic으로 이동

- 선정 이유: Epic UI-TEXT-ICON-OPTIMIZATION 완료로 의존성 충족, 사용자 경험
  개선, 브랜드 일관성 강화
- 솔루션: Option A (커스텀 Tooltip 컴포넌트) 선택
  - 키보드 단축키 `<kbd>` 마크업 지원
  - 디자인 토큰 기반 스타일
  - PC 전용 이벤트 (`mouseenter`, `focus` / `mouseleave`, `blur`)
  - WCAG 2.1 Level AA 준수
- 예상 영향: 번들 +2.5 KB raw (+0.5%), +0.8 KB gzip (+0.7%)
- TDD Phase: Phase 1 (RED, 12-15 tests) → Phase 2 (GREEN) → Phase 3 (REFACTOR)

**2025-01-07**: `ICON-USAGE-AUDIT-TOOL` 구현 완료 →
`TDD_REFACTORING_PLAN_COMPLETED.md`로 이동

**2025-01-04**: `UI-TEXT-ICON-OPTIMIZATION` 승격 → `TDD_REFACTORING_PLAN.md`
활성 Epic으로 이동

- 선정 이유: 높은 가치 (모든 언어 사용자), 낮은 리스크 (기존 패턴 재사용), TDD
  적용 용이
- 4가지 개선 영역 통합: I18N-COMPLETION, TOOLTIP-SEMANTICS,
  ICON-SEMANTIC-CLARITY, CONTEXTMENU-A11Y
- 예상 영향: 완전한 다국어 지원, 접근성 WCAG AA 준수, 키보드 단축키 가시성 향상

**2025-01-03**: `CONTEXT-MENU-UI-PHASE-3` 완료 ✅

- 결과: 18/18 tests GREEN, WCAG 2.1 Level AA 완전 준수, Epic 완전 종료
- 상세: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` (2025-01-03 섹션)

**2025-10-03**: `CONTEXT-MENU-UI` 승격 → `TDD_REFACTORING_PLAN.md` 활성 Epic으로
이동 (Phase 2 완료)

- 선정 이유: 브랜드 일관성 향상, 접근성 개선, 확장성 확보
- 솔루션: Option A (커스텀 컨텍스트 메뉴 컴포넌트, PC 전용) - Epic 목적 충족, UX
  통일성, PC 전용 정책 준수
- PC 전용 정책 충돌 해결: "터치 디바이스 대응 가능" 문구 제거, contextmenu
  이벤트만 사용

**2025-10-03**: `DOWNLOAD-TOGGLE-TOOLBAR` 승격 → `TDD_REFACTORING_PLAN.md` 활성
Epic으로 이동 (완료됨)

- 선정 이유: 명확한 가치 (다운로드 워크플로 중심화), 낮은 리스크 (S 난이도),
  빠른 완료 가능
- 솔루션: 옵션 A (독립 토글 버튼) - PC 전용 입력 정책 준수, UX 개선 최적화

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
