# TDD 리팩토링 활성 계획

본 문서는 복잡한 구현/구조를 간결하고 현대적으로 재구축하기 위한 리팩토링
Epic들을 관리합니다. 완료된 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md`로
이관하여 히스토리를 분리합니다.

**최근 업데이트**: 2025-01-13 — Epic THEME-ICON-UNIFY-001 Phase A 완료, Phase
B/C는 별도 Epic으로 백로그 이동

---

## 1. 운영 원칙

- 코딩/스타일/입력/벤더 접근/테스트 규칙: `docs/CODING_GUIDELINES.md`,
  `docs/vendors-safe-api.md`
- 실행/CI/빌드 파이프라인: `AGENTS.md`
- 아키텍처 설계: `docs/ARCHITECTURE.md`
- 본 문서: 활성 Epic/작업과 Acceptance 중심

---

## 2. 활성 Epic 현황

(현재 활성 Epic 없음. 백로그에서 선정 대기 중)

---

### LOW 우선순위 (백로그)

#### **Epic RED-TEST-003~006**: 나머지 RED 테스트 해결

**후보 작업** (백로그에서 승격 예정):

- RED-TEST-003: Service Diagnostics 통합 (3개 파일)
- RED-TEST-004: Signal Selector 최적화 유틸리티 (1개 파일, 17개 테스트)
- RED-TEST-005: CSS 통합 및 토큰 정책 (4개 파일)
- RED-TEST-006: 테스트 인프라 개선 (5개 파일)

**예상 난이도**: S-M (Small to Medium) **예상 소요**: 3-5 days (total)

---

## 3. 최근 완료 Epic

- **Epic SERVICE-SIMPLIFY-001** (2025-10-02): 서비스 아키텍처 간소화
  - Phase 1-5 완료 (CoreService 단순화, AppContainer DI, 진단 도구 통합)
  - 세부 내용: `TDD_REFACTORING_PLAN_COMPLETED.md`
- **Epic SOLID-NATIVE-002** (2025-10-02): SolidJS 네이티브 패턴 완전
  마이그레이션
  - Phase G-3-1~3 완료 (toolbar/download/gallery signals)
  - 세부 내용: `TDD_REFACTORING_PLAN_COMPLETED.md`
- **Epic DESIGN-MODERN-001** (2025-10-02): 디자인 시스템 현대화
  - Phase A (Animation 통합), Phases B-D (기구현 확인) 완료
  - 세부 내용: `TDD_REFACTORING_PLAN_COMPLETED.md`
- **Epic CSS-TOKEN-UNIFY-001** (2025-01-23): CSS 토큰 시스템 정리
  - Phase A/B/C 완료 (하드코딩 값 제거, 3-layer 토큰 시스템)
  - 세부 내용: `TDD_REFACTORING_PLAN_COMPLETED.md`
- **Epic ARCH-SIMPLIFY-001** (2025-10-02): 아키텍처 복잡도 간소화
  - Phase A/B/C/D 완료
  - 세부 내용: `TDD_REFACTORING_PLAN_COMPLETED.md`

---

## 4. TDD 워크플로

1. **RED**: 실패 테스트 추가 (최소 명세)
2. **GREEN**: 최소 변경으로 통과
3. **REFACTOR**: 중복 제거/구조 개선
4. **Rename**: `.red.` 파일명 제거 → 가드 전환
5. **Document**: Completed 로그에 1줄 요약

**품질 게이트**:

- ✅ `npm run typecheck` (strict 오류 0)
- ✅ `npm run lint:fix` (자동 수정 적용)
- ✅ `npm test` (해당 Phase GREEN)
- ✅ `npm run build:dev` (산출물 검증 통과)

---

## 5. 추론 기반 우선순위 산정

### 보안 (SECURITY-HARDENING-001) - **HIGH**

**선택 이유**:

- CodeQL 29건 이슈는 실제 보안 위협
- Prototype pollution은 사용자 설정 공격 가능
- URL sanitization 부족은 XSS 가능성
- 빠른 수정 가능 (2-3 days)

**트레이드오프**:

- ⚠️ 유틸리티 계층 도입으로 기존 코드 수정 필요
- ✅ 재사용 가능한 가드로 장기적 이득

---

### 테스트 안정화 (RED-TEST-001, 002) - **HIGH**

**선택 이유**:

- 테스트 실패는 CI 차단 및 개발 속도 저하
- 50-86% 통과 상태로 완료 가능성 높음
- 다른 Epic 작업의 전제 조건

**트레이드오프**:

- ⚠️ JSDOM 환경 이슈는 근본 원인 파악 필요
- ✅ 테스트 안정성 확보로 리팩토링 신뢰도 향상

---

## 6. 참고 문서

| 문서        | 위치                                     |
| ----------- | ---------------------------------------- |
| 완료 로그   | `docs/TDD_REFACTORING_PLAN_COMPLETED.md` |
| 백로그      | `docs/TDD_REFACTORING_BACKLOG.md`        |
| 설계        | `docs/ARCHITECTURE.md`                   |
| 코딩 규칙   | `docs/CODING_GUIDELINES.md`              |
| 실행 가이드 | `AGENTS.md`                              |
| 벤더 API    | `docs/vendors-safe-api.md`               |
