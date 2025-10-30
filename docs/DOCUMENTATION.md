# 📚 문서 가이드

> xcom-enhanced-gallery 프로젝트의 문서 구조와 네비게이션

**최종 업데이트**: 2025-10-30 | **상태**: 모든 문서 최신화 ✅

---

## 📖 문서 목록

### 프로젝트 진입점

- **[README.md](../README.md)**: 사용자 가이드 (기능, 설치, 사용법)
- **[AGENTS.md](../AGENTS.md)**: 개발 환경 설정 및 워크플로우
- **[LICENSE](../LICENSE)**: MIT 라이선스

### 개발 가이드

- **[CODING_GUIDELINES.md](./CODING_GUIDELINES.md)**: 코딩 규칙 (Vendor Getter,
  PC 전용 이벤트, 디자인 토큰)
- **[ARCHITECTURE.md](./ARCHITECTURE.md)**: 3계층 구조, 의존성 규칙
- **[TESTING_STRATEGY.md](./TESTING_STRATEGY.md)**: Testing Trophy, JSDOM, E2E
  하네스 패턴
- **[HOOKS_GUIDELINES.md](./HOOKS_GUIDELINES.md)**: Solid.js 훅 작성 규칙 및
  패턴

### 품질 및 유지보수

- **[DEPENDENCY-GOVERNANCE.md](./DEPENDENCY-GOVERNANCE.md)**: dependency-cruiser
  규칙, 의존성 정책
- **[MAINTENANCE.md](./MAINTENANCE.md)**: 유지보수 체크리스트
- **[ACCESSIBILITY_CHECKLIST.md](./ACCESSIBILITY_CHECKLIST.md)**: WCAG 2.1 Level
  AA 준수 체크리스트

**참고**: 점검 도구 가이드 (CodeQL, ESLint, Vitest 등)는
[AGENTS.md](../AGENTS.md)의 해당 섹션 참조

### 리팩토링 및 계획

- **[TDD_REFACTORING_PLAN.md](./TDD_REFACTORING_PLAN.md)**: 활성 Phase 계획
  (현재: Phase 258 분석 완료)
- **[TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md)**:
  완료된 Phase 기록 (Phase 197-257)

### 특수 디렉터리

- **[archive/](./archive/)**: 완료된 Phase 상세 보고서 (Git 추적 안 함)
- **[temp/](./temp/)**: 임시 작업 문서 (Git 추적 안 함)

---

## 🔧 GitHub 특화 문서

- **[.github/copilot-instructions.md](../.github/copilot-instructions.md)**: AI
  코딩 가이드 (필수 읽기)
- **[.github/SECURITY.md](../.github/SECURITY.md)**: 보안 취약점 보고 방법

---

## 🧪 테스트 관련 문서

- **[test/README.md](../test/README.md)**: Vitest 사용법, DOM 시뮬레이션
- **[test/unit/shared/services/README.md](../test/unit/shared/services/README.md)**:
  서비스 계층 테스트 패턴

---

## � 보안 분석 문서

**CodeQL (보안 취약점 정적 분석)**:

- **목적**: XSS, 코드 인젝션, Prototype pollution 등 보안 취약점 탐지
- **실행 환경**:
  - CI (필수): GitHub Actions에서 `github/codeql-action` 자동 실행
  - 로컬 (선택): `scripts/check-codeql.js` (CI와 동일한 security-extended 쿼리)
- **책임**: CI에서 전체 보안 검증, 로컬은 빠른 피드백용
- **사용법**: `npm run codeql:check` (옵션: --json, --report, --force,
  --verbose)
- **결과**: SARIF 결과 (`codeql-results/`), 마크다운 리포트 (`codeql-reports/`)
- **상세 가이드**: [AGENTS.md](../AGENTS.md) "CodeQL 설정 및 사용" 섹션

---

## 📦 릴리즈 문서

- **[release/RELEASE_NOTES.md](../release/RELEASE_NOTES.md)**: 버전별 변경사항

---

## 🔄 문서 관리 지침

### 신규 문서 추가

1. `docs/temp/`에서 초안 작성
2. 확정 후 `docs/` 루트로 이동
3. DOCUMENTATION.md에 항목 추가

### 문서 아카이브

1. Phase/작업 완료 후 `docs/archive/`로 이동
2. 관련 문서에서 참조 링크 업데이트

---

## 📝 문서 작성 규칙

- 제목 계층 구조 명확히 (`#`, `##`, `###`)
- 목차 자동 생성 지원 (마크다운 형식)
- 코드 예시는 마크다운 코드 블록 사용
- 상태 배지 활용: ✅ 완료, 📋 계획 중, 🔄 진행 중, ⚠️ 검토 필요
- 상대 경로 링크 사용
- 코드 블록에 언어 명시
- **이모지**: 섹션 구분용으로 일관성 있게 사용

### 내용 원칙

- **간결성**: 한 문서는 하나의 주제에 집중
- **완전성**: 외부 참조 없이 독립적으로 이해 가능해야 함
- **최신성**: 코드 변경 시 관련 문서 동시 업데이트
- **예시**: 추상적 설명보다 구체적 예시 우선

---

## 🎓 학습 경로

1. [README.md](../README.md) - 프로젝트 이해
2. [AGENTS.md](../AGENTS.md) - 개발 환경 설정
3. [CODING_GUIDELINES.md](./CODING_GUIDELINES.md) - 핵심 규칙
4. [ARCHITECTURE.md](./ARCHITECTURE.md) - 구조 이해
5. [TESTING_STRATEGY.md](./TESTING_STRATEGY.md) - 테스트 작성법
6. [DEPENDENCY-GOVERNANCE.md](./DEPENDENCY-GOVERNANCE.md) - 의존성 규칙

---

## 📞 도움말

- **개발 관련 질문**: [AGENTS.md](../AGENTS.md)의 "트러블슈팅 팁" 섹션
- **보안 이슈**: [SECURITY.md](../.github/SECURITY.md)
- **버그 리포트**:
  [GitHub Issues](https://github.com/PiesP/xcom-enhanced-gallery/issues)

---

**유지보수**: 이 문서는 신규 문서 추가 또는 프로젝트 구조 변경 시 즉시
업데이트되어야 합니다.
