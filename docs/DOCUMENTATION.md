# 📚 문서 가이드

> xcom-enhanced-gallery 프로젝트의 모든 문서를 한눈에 파악할 수 있는 통합 가이드

**최종 업데이트**: 2025-10-16

---

## 🎯 빠른 시작

| 역할               | 시작 문서                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------- |
| 👨‍💻 **신규 개발자** | [AGENTS.md](../AGENTS.md) → [CODING_GUIDELINES.md](./CODING_GUIDELINES.md)                    |
| 🤖 **AI 에이전트** | [.github/copilot-instructions.md](../.github/copilot-instructions.md)                         |
| 👤 **사용자**      | [README.md](../README.md)                                                                     |
| 🤝 **기여자**      | [CONTRIBUTING.md](../.github/CONTRIBUTING.md)                                                 |
| 🏗️ **아키텍트**    | [ARCHITECTURE.md](./ARCHITECTURE.md) → [DEPENDENCY-GOVERNANCE.md](./DEPENDENCY-GOVERNANCE.md) |

---

## 📖 문서 계층 구조

### 레벨 1: 프로젝트 진입점 (루트)

#### [README.md](../README.md)

- **대상**: 일반 사용자
- **내용**: 기능 소개, 설치 방법, 사용법, 키보드 단축키
- **관련 문서**: [RELEASE_NOTES.md](../release/RELEASE_NOTES.md),
  [LICENSE](../LICENSE)

#### [AGENTS.md](../AGENTS.md)

- **대상**: 개발자 (Human/AI)
- **내용**: 개발 환경 설정, 스크립트 실행, 테스트 전략, 빌드 플로우
- **관련 문서**: 모든 `docs/` 하위 문서

#### [LICENSE](../LICENSE)

- **대상**: 법적 정보 확인이 필요한 모든 사용자
- **내용**: MIT 라이선스 전문

---

### 레벨 2: 핵심 개발 가이드 (docs/)

#### [CODING_GUIDELINES.md](./CODING_GUIDELINES.md)

- **대상**: 모든 개발자
- **내용**: 3대 핵심 원칙 (Vendor Getter, PC 전용 이벤트, 디자인 토큰)
- **참조 빈도**: ⭐⭐⭐⭐⭐ (가장 높음)
- **관련 문서**: [ARCHITECTURE.md](./ARCHITECTURE.md),
  [CODE_QUALITY.md](./CODE_QUALITY.md)

#### [ARCHITECTURE.md](./ARCHITECTURE.md)

- **대상**: 시스템 구조를 이해해야 하는 개발자
- **내용**: 3계층 구조 (Features → Shared → External), 단방향 의존성 규칙
- **참조 빈도**: ⭐⭐⭐⭐
- **관련 문서**: [DEPENDENCY-GOVERNANCE.md](./DEPENDENCY-GOVERNANCE.md),
  [CODING_GUIDELINES.md](./CODING_GUIDELINES.md)

#### [TESTING_STRATEGY.md](./TESTING_STRATEGY.md)

- **대상**: 테스트 작성자
- **내용**: Testing Trophy 모델, JSDOM 제약사항, E2E 하네스 패턴
- **참조 빈도**: ⭐⭐⭐⭐
- **관련 문서**: [AGENTS.md](../AGENTS.md), [test/README.md](../test/README.md),
  [SOLID_REACTIVITY_LESSONS.md](./SOLID_REACTIVITY_LESSONS.md)

---

### 레벨 3: 전문 영역 가이드 (docs/)

#### [DEPENDENCY-GOVERNANCE.md](./DEPENDENCY-GOVERNANCE.md)

- **대상**: 의존성 관리자, CI 유지보수자
- **내용**: dependency-cruiser 규칙, 위반 수정 가이드
- **참조 빈도**: ⭐⭐⭐
- **관련 문서**: [ARCHITECTURE.md](./ARCHITECTURE.md)

#### [CODE_QUALITY.md](./CODE_QUALITY.md)

- **대상**: 코드 품질 유지보수자
- **내용**: CodeQL, ESLint, stylelint 도구별 책임 분리
- **참조 빈도**: ⭐⭐⭐
- **관련 문서**: [CODING_GUIDELINES.md](./CODING_GUIDELINES.md),
  [codeql-custom-queries-javascript/README.md](../codeql-custom-queries-javascript/README.md)

#### [MAINTENANCE.md](./MAINTENANCE.md)

- **대상**: 프로젝트 유지보수자
- **내용**: 월간/분기별 체크리스트, 의존성 업데이트, 빌드 크기 모니터링
- **참조 빈도**: ⭐⭐⭐
- **관련 문서**: [AGENTS.md](../AGENTS.md),
  [TDD_REFACTORING_PLAN.md](./TDD_REFACTORING_PLAN.md)

---

### 레벨 4: 리팩토링 및 교훈 (docs/)

#### [TDD_REFACTORING_PLAN.md](./TDD_REFACTORING_PLAN.md)

- **대상**: 현재 진행 중인 리팩토링 작업자
- **내용**: 활성 Phase 계획, 남은 백로그
- **참조 빈도**: ⭐⭐⭐
- **관련 문서**:
  [TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md),
  [AGENTS.md](../AGENTS.md)

#### [TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md)

- **대상**: 과거 리팩토링 이력 참조자
- **내용**: 완료된 Phase 기록 보관소
- **참조 빈도**: ⭐
- **관련 문서**: [TDD_REFACTORING_PLAN.md](./TDD_REFACTORING_PLAN.md)

#### [SOLID_REACTIVITY_LESSONS.md](./SOLID_REACTIVITY_LESSONS.md)

- **대상**: Solid.js 반응성 시스템 학습자
- **내용**: Phase 80.1 경험 기반 교훈, Signal 사용 패턴
- **참조 빈도**: ⭐⭐
- **관련 문서**: [TESTING_STRATEGY.md](./TESTING_STRATEGY.md),
  [AGENTS.md](../AGENTS.md)

---

## 🔧 GitHub 특화 문서 (.github/)

### 기여 및 커뮤니티

#### [CONTRIBUTING.md](../.github/CONTRIBUTING.md)

- **대상**: 오픈소스 기여자
- **내용**: 브랜치 전략, 커밋 규칙, PR 가이드
- **관련 문서**: [CODING_GUIDELINES.md](./CODING_GUIDELINES.md),
  [AGENTS.md](../AGENTS.md)

#### [CODE_OF_CONDUCT.md](../.github/CODE_OF_CONDUCT.md)

- **대상**: 커뮤니티 참여자
- **내용**: 행동 강령, 신고 절차

#### [SECURITY.md](../.github/SECURITY.md)

- **대상**: 보안 취약점 발견자
- **내용**: 보고 방법, 대응 프로세스, 보안 체크리스트

### AI 협업

#### [copilot-instructions.md](../.github/copilot-instructions.md)

- **대상**: GitHub Copilot, AI 에이전트
- **내용**: 프로젝트 특화 AI 코딩 가이드, 토큰 최적화 전략
- **관련 문서**: [AGENTS.md](../AGENTS.md),
  [CODING_GUIDELINES.md](./CODING_GUIDELINES.md)

### 템플릿

#### [ISSUE_TEMPLATE/](../.github/ISSUE_TEMPLATE/)

- `bug_report.md`: 버그 리포트 템플릿
- `feature_request.md`: 기능 요청 템플릿

#### [PULL_REQUEST_TEMPLATE/default.md](../.github/PULL_REQUEST_TEMPLATE/default.md)

- PR 설명 템플릿

---

## 🧪 테스트 관련 문서

### [test/README.md](../test/README.md)

- **대상**: 테스트 작성자
- **내용**: Vitest 사용법, DOM 시뮬레이션, Mock 구조
- **관련 문서**: [TESTING_STRATEGY.md](./TESTING_STRATEGY.md),
  [AGENTS.md](../AGENTS.md)

### [test/unit/shared/services/README.md](../test/unit/shared/services/README.md)

- **대상**: 서비스 계층 테스트 작성자
- **내용**: 서비스별 테스트 패턴

---

## 🔍 CodeQL 문서

### [codeql-custom-queries-javascript/README.md](../codeql-custom-queries-javascript/README.md)

- **대상**: 정적 분석 도구 사용자
- **내용**: 커스텀 쿼리 목록, 위반 예시, 수정 방법
- **관련 문서**: [CODE_QUALITY.md](./CODE_QUALITY.md),
  [CODING_GUIDELINES.md](./CODING_GUIDELINES.md)

---

## 📦 릴리즈 문서

### [release/RELEASE_NOTES.md](../release/RELEASE_NOTES.md)

- **대상**: 사용자, 릴리즈 관리자
- **내용**: 버전별 변경사항, 버그 수정, 알려진 이슈
- **관련 문서**: [README.md](../README.md)

---

## 📊 문서 연결 맵

```
README.md (사용자)
    ├─→ RELEASE_NOTES.md
    └─→ LICENSE

AGENTS.md (개발자 허브) ⭐
    ├─→ CODING_GUIDELINES.md ⭐⭐⭐
    ├─→ ARCHITECTURE.md ⭐⭐
    ├─→ TESTING_STRATEGY.md ⭐⭐
    ├─→ DEPENDENCY-GOVERNANCE.md
    ├─→ TDD_REFACTORING_PLAN.md
    ├─→ SOLID_REACTIVITY_LESSONS.md
    └─→ MAINTENANCE.md

.github/copilot-instructions.md (AI 허브)
    ├─→ AGENTS.md
    └─→ CODING_GUIDELINES.md

CONTRIBUTING.md (기여자)
    ├─→ AGENTS.md
    └─→ CODING_GUIDELINES.md

CODE_QUALITY.md
    ├─→ ARCHITECTURE.md
    ├─→ CODING_GUIDELINES.md
    ├─→ TESTING_STRATEGY.md
    └─→ codeql-custom-queries-javascript/README.md

TESTING_STRATEGY.md
    ├─→ AGENTS.md
    ├─→ test/README.md
    └─→ SOLID_REACTIVITY_LESSONS.md

TDD_REFACTORING_PLAN.md
    ├─→ TDD_REFACTORING_PLAN_COMPLETED.md
    ├─→ AGENTS.md
    ├─→ ARCHITECTURE.md
    ├─→ CODING_GUIDELINES.md
    └─→ MAINTENANCE.md
```

---

## 🔄 문서 업데이트 가이드

### 신규 문서 추가 시

1. 이 문서(DOCUMENTATION.md)에 항목 추가
2. 적절한 레벨과 카테고리에 배치
3. 관련 문서에 상호 참조 링크 추가
4. 참조 빈도 평가 (⭐~⭐⭐⭐⭐⭐)

### 기존 문서 수정 시

1. 문서 하단의 "최종 업데이트" 날짜 갱신
2. 관련 문서 목록이 최신 상태인지 확인
3. 이 문서의 설명이 여전히 정확한지 검토

### 문서 연결 원칙

- **상향 참조**: 하위 문서는 상위 문서를 참조 (예: 모든 docs/ → AGENTS.md)
- **횡적 참조**: 같은 레벨 문서는 필요시에만 참조
- **순환 방지**: A → B → A 순환 참조 금지

---

## 📝 문서 작성 규칙

### Markdown 스타일

- **제목**: `#`, `##`, `###` 계층 구조 명확히
- **링크**: 상대 경로 사용 (예: `[AGENTS.md](../AGENTS.md)`)
- **코드 블록**: 언어 명시 (```typescript`, ``bash``)
- **이모지**: 섹션 구분용으로 일관성 있게 사용

### 내용 원칙

- **간결성**: 한 문서는 하나의 주제에 집중
- **완전성**: 외부 참조 없이 독립적으로 이해 가능해야 함
- **최신성**: 코드 변경 시 관련 문서 동시 업데이트
- **예시**: 추상적 설명보다 구체적 예시 우선

---

## 🎓 학습 경로 추천

### 🆕 신규 개발자

1. [README.md](../README.md) - 프로젝트 이해
2. [AGENTS.md](../AGENTS.md) - 개발 환경 설정
3. [CODING_GUIDELINES.md](./CODING_GUIDELINES.md) - 핵심 규칙 습득
4. [ARCHITECTURE.md](./ARCHITECTURE.md) - 구조 이해
5. [TESTING_STRATEGY.md](./TESTING_STRATEGY.md) - 테스트 작성법

### 🏗️ 아키텍처 리뷰

1. [ARCHITECTURE.md](./ARCHITECTURE.md)
2. [DEPENDENCY-GOVERNANCE.md](./DEPENDENCY-GOVERNANCE.md)
3. [CODE_QUALITY.md](./CODE_QUALITY.md)

### 🧪 테스트 전문가

1. [TESTING_STRATEGY.md](./TESTING_STRATEGY.md)
2. [test/README.md](../test/README.md)
3. [SOLID_REACTIVITY_LESSONS.md](./SOLID_REACTIVITY_LESSONS.md)
4. [AGENTS.md](../AGENTS.md) - E2E 하네스 패턴 섹션

### 🤖 AI 에이전트 온보딩

1. [.github/copilot-instructions.md](../.github/copilot-instructions.md)
2. [AGENTS.md](../AGENTS.md)
3. [CODING_GUIDELINES.md](./CODING_GUIDELINES.md)

---

## 📞 도움말

- **개발 관련 질문**: [AGENTS.md](../AGENTS.md)의 "트러블슈팅 팁" 섹션
- **기여 방법**: [CONTRIBUTING.md](../.github/CONTRIBUTING.md)
- **보안 이슈**: [SECURITY.md](../.github/SECURITY.md)
- **버그 리포트**:
  [GitHub Issues](https://github.com/PiesP/xcom-enhanced-gallery/issues)

---

**유지보수**: 이 문서는 신규 문서 추가 또는 프로젝트 구조 변경 시 즉시
업데이트되어야 합니다.
