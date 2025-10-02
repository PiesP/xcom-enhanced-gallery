# TDD 리팩토링 활성 계획

본 문서는 복잡한 구현/구조를 간결하고 현대적으로 재구축하기 위한 리팩토링
Epic들을 관리합니다. 완료된 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md`로
이관하여 히스토리를 분리합니다.

**최근 업데이트**: 2025-01-23 — Epic CSS-TOKEN-UNIFY-001 완료, 활성 Epic 3개

---

## 1. 운영 원칙

- 코딩/스타일/입력/벤더 접근/테스트 규칙: `docs/CODING_GUIDELINES.md`,
  `docs/vendors-safe-api.md`
- 실행/CI/빌드 파이프라인: `AGENTS.md`
- 아키텍처 설계: `docs/ARCHITECTURE.md`
- 본 문서: 활성 Epic/작업과 Acceptance 중심

---

## 2. 활성 Epic 현황

### 🟡 MEDIUM 우선순위

#### **Epic SOLID-NATIVE-002**: SolidJS 네이티브 패턴 완전 마이그레이션

**배경**: `createGlobalSignal` 레거시 패턴이 20+ 파일에서 사용 중

- `.value` 속성 접근
- `.subscribe()` 메서드 호출
- Preact Signals 스타일 API

**목표**: SolidJS 네이티브 패턴으로 완전 전환

- `createSignal()` 함수 호출 방식
- `createEffect()` 구독 패턴
- `createMemo()` 파생값 계산

**전략**: 점진적 마이그레이션 (파일별)

**Phase A: External 계층** (1-2 days)

- [ ] `vendors` 모듈 내 레거시 패턴 제거
- [ ] Userscript adapter 마이그레이션
- [ ] 테스트 유틸리티 업데이트

**Phase B: Shared Services** (2-3 days)

- [ ] MediaService, BulkDownloadService 마이그레이션
- [ ] ThemeService, AnimationService 마이그레이션
- [ ] UnifiedToastManager 완전 전환

**Phase C: Shared State** (2-3 days)

- [ ] `gallery.signals` 마이그레이션
- [ ] `settings.signals` 마이그레이션
- [ ] Signal selector 유틸리티 추가

**Phase D: Features 계층** (3-4 days)

- [ ] Gallery 컴포넌트 마이그레이션
- [ ] Settings 컴포넌트 마이그레이션
- [ ] 레거시 호환 레이어 제거

**예상 난이도**: H (High) **예상 소요**: 8-12 days

---

---

### 🟢 LOW 우선순위

#### **Epic SERVICE-SIMPLIFY-001**: 서비스 아키텍처 간소화

**배경**: 서비스 관리 계층이 과도하게 복잡

- ServiceManager/CoreService: 싱글톤 + 팩토리 + 레지스트리 혼재
- AppContainer, ServiceDiagnostics, UnifiedServiceDiagnostics 중복
- Features 계층에서 액세서/브리지 경유 필수

**전략**: 단계적 간소화 (현재 구조 유지 → 단일 Container)

**Phase A: 중복 제거** (1-2 days)

- [ ] CoreService/ServiceManager 통합
- [ ] 중복 진단 로직 제거 (ServiceDiagnostics 통합)
- [ ] 서비스 초기화 경로 정리

**Phase B: 액세서 패턴 정리** (2-3 days)

- [ ] AppContainer 간소화
- [ ] Service accessor 패턴 재설계
- [ ] 타입 안정성 개선

**Phase C: 개발자 경험 개선** (1-2 days)

- [ ] 진단 도구 통합 (단일 API)
- [ ] 서비스 등록 가이드 문서화
- [ ] 테스트 헬퍼 개선

**예상 난이도**: M (Medium) **예상 소요**: 4-7 days

---

#### **Epic RED-TEST-003~006**: 나머지 RED 테스트 해결

**후보 작업** (백로그에서 승격 예정):

- RED-TEST-003: Service Diagnostics 통합 (3개 파일)
- RED-TEST-004: Signal Selector 최적화 유틸리티 (1개 파일, 17개 테스트)
- RED-TEST-005: CSS 통합 및 토큰 정책 (4개 파일)
- RED-TEST-006: 테스트 인프라 개선 (5개 파일)

**예상 난이도**: S-M (Small to Medium) **예상 소요**: 3-5 days (total)

---

## 3. 최근 완료 Epic

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

### SolidJS 마이그레이션 (SOLID-NATIVE-002) - **MEDIUM**

**선택 이유**:

- 20+ 파일 레거시 패턴은 기술 부채
- 호환 레이어 유지 비용 증가
- 점진적 마이그레이션으로 위험 최소화

**트레이드오프**:

- ⚠️ 장기간 소요 (8-12 days)
- ⚠️ 혼재된 패턴으로 혼란 가능성
- ✅ 안정성 우선, 단계별 검증

---

### 서비스 간소화 (SERVICE-SIMPLIFY-001) - **LOW**

**선택 이유**:

- 현재 구조로도 동작 가능
- 점진적 개선으로 충분
- 다른 Epic 완료 후 착수

**트레이드오프**:

- ⚠️ 근본적 해결은 아님
- ✅ 최소 위험, 기존 테스트 유지
- ✅ 단계적 전환 가능

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
