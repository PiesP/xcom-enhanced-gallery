# 🗂️ TDD 리팩토링 백로그

> 활성화되지 않은 향후 후보 아이디어 저장소 (선정 전까지 여기서만 유지)
>
> 사용 방법:
>
> - 새 사이클 시작 시 이 목록에서 1~3개를 선택하여 `TDD_REFACTORING_PLAN.md`의
>   "활성 스코프"로 승격
> - 선택 기준: 가치(Impact) / 구현 난이도(Effort) / 가드 필요성(Risk of
>   Regression)
> - 승격 후 RED 테스트부터 작성, 완료되면 COMPLETED 로그로 이관
>
> 코멘트 규칙: `상태 | 식별자 | 요약 | 기대 효과 | 난이도(T/S/M/H) | 비고`
>
> 상태 태그: `IDEA`(순수 아이디어), `READY`(바로 착수 가능), `HOLD`(외부 의존),
> `REVIEW`(설계 검토 필요)

---

## Candidate List

<!-- MEM_PROFILE 승격 및 완료 (2025-09-12): 경량 메모리 프로파일러 유틸 추가, 문서/테스트 포함 -->

READY | RED-TEST-001 | SolidJS Gallery JSDOM URL Constructor Fix | Gallery
테스트 환경 안정화 | M | 8개 테스트 파일 skip 중 READY | RED-TEST-002 |
Toast/Signal API Native Pattern Migration | UnifiedToastManager API 통합 완료 |
M | 7개 테스트 파일 skip 중  
READY | RED-TEST-003 | Service Diagnostics Unification |
CoreService/BrowserService 진단 기능 통합 | S | 3개 테스트 파일 skip 중 READY |
RED-TEST-004 | Signal Selector Performance Utilities |
createSelector/useSelector 최적화 도구 구현 | M | 1개 테스트 파일 skip 중 READY
| RED-TEST-005 | Style/CSS Consolidation & Token Compliance | 스타일 통합 및
디자인 토큰 정책 준수 | M | 4개 테스트 파일 skip 중 READY | RED-TEST-006 | Test
Infrastructure Improvements | 테스트 구조/통합/도구 개선 | S | 5개 테스트 파일
skip 중 READY | A11Y_LAYER_TOKENS | 레이어(z-index)/포커스 링/대비 토큰 재점검
및 회귀 테스트 | 접근성/스타일 회귀 방지 | M | READY | CONNECT_SYNC_AUTOMATION |
실행 시 접근 호스트 수집→@connect 동기화 스크립트 | 퍼미션 미스 방지/릴리즈
안정성 | M | READY | SOURCEMAP_VALIDATOR | prod 주석 정책/릴리즈 .map 포함 여부
검사 스크립트 | 빌드 노이즈(404) 제거 | S | READY | SPA_IDEMPOTENT_MOUNT |
라우트/DOM 교체 시 단일 마운트/클린업 가드 테스트 | 중복 마운트/누수 방지 | M |
READY | REF-LITE-V4 | 서비스 워ーム업 다이어트 및 벤더 export 정리(Stages B~C) |
Solid 전환 병행 시 런타임 회귀 방지 | M | Solid Stage C 이후 재승격 후보 READY |
BUILD-ALT-001 | esbuild 기반 userscript 빌드 전환 파일럿 | Solid 빌드 호환성
확보 및 빌드 시간 단축 | M | Solid Stage A에서 충돌 발생 시 즉시 재승격

---

## Parking Lot (미보류)

(현재 없음)

---

## Detailed Plan Proposal — RED Test Recovery Epics (2025-10-02 Skip 처리)

### Epic RED-TEST-001: SolidJS Gallery JSDOM URL Constructor Fix

**상태**: READY  
**우선순위**: HIGH  
**식별자**: RED-TEST-001

**배경**:

- JSDOM 환경에서 `URL is not a constructor` 오류 발생
- SolidJS 기반 Gallery 테스트들이 환경 문제로 실패
- 8개 테스트 파일 임시 skip 처리됨

**Skip된 테스트들**:

1. `test/accessibility/gallery-toolbar-parity.test.ts` - Gallery toolbar 접근성
2. `test/features/gallery/gallery-close-dom-cleanup.test.ts` - DOM 정리 검증
3. `test/features/gallery/gallery-renderer-solid-keyboard-help.test.tsx` -
   키보드 도움말
4. `test/features/gallery/solid-gallery-shell-wheel.test.tsx` - Wheel 이벤트
   처리
5. `test/features/gallery/solid-gallery-shell.test.tsx` - Gallery shell 통합
6. `test/features/gallery/solid-shell-ui.test.tsx` - Shell UI 패리티
7. `test/unit/shared/components/isolation/GalleryContainer.shadow-style.isolation.red.test.tsx` -
   Shadow DOM 스타일 격리
8. `test/unit/shared/components/ui/ToolbarWithSettings-close-behavior.test.tsx` -
   설정 모달 닫기 동작

**목표**:

- [ ] JSDOM URL 폴리필 추가 또는 URL 사용 회피
- [ ] Gallery 테스트 환경 안정화
- [ ] 8개 테스트 파일 GREEN 전환

**예상 난이도**: M (Medium)  
**예상 소요**: 1-2 days

---

### Epic RED-TEST-002: Toast/Signal API Native Pattern Migration

**상태**: READY  
**우선순위**: MEDIUM  
**식별자**: RED-TEST-002

**배경**:

- UnifiedToastManager의 SolidJS Native 패턴 전환 진행 중
- `subscribe()` 메서드가 제거되고 Solid Accessor 패턴으로 변경됨
- 7개 테스트 파일이 구 API 사용으로 실패

**Skip된 테스트들**:

1. `test/refactoring/toast-system-integration.test.ts` - Toast 시스템 통합
2. `test/shared/services/unified-toast-manager-native.test.ts` - Native 패턴
   마이그레이션
3. `test/unit/a11y/announce-routing.test.ts` - 접근성 알림 라우팅
4. `test/unit/shared/services/bulk-download.progress-toast.test.ts` - 진행 상황
   토스트
5. `test/unit/shared/services/toast-routing.policy.test.ts` - 토스트 라우팅 정책
6. `test/unit/shared/services/unified-toast-manager.solid.test.ts` - Solid 통합
7. `test/unit/shared/services/error-toast.standardization.red.test.ts` - 에러
   토스트 표준화

**목표**:

- [ ] `subscribe()` → Solid Accessor 패턴 전환 완료
- [ ] Toast API 계약 문서화
- [ ] 7개 테스트 파일 GREEN 전환

**예상 난이도**: M (Medium)  
**예상 소요**: 2-3 days

---

### Epic RED-TEST-003: Service Diagnostics Unification

**상태**: READY  
**우선순위**: LOW  
**식별자**: RED-TEST-003

**배경**:

- CoreService, BrowserService, ServiceManager의 진단 기능 중복
- UnifiedServiceDiagnostics 인터페이스 설계 필요
- `getDiagnostics()` 메서드 통합 미완료

**Skip된 테스트들**:

1. `test/refactoring/service-diagnostics-integration.test.ts` - 진단 통합
2. `test/unit/shared/services/CoreService.test.ts` - CoreService 진단
3. `test/unit/shared/services/ServiceManager.test.ts` - ServiceManager 진단

**목표**:

- [ ] UnifiedServiceDiagnostics 인터페이스 구현
- [ ] 기존 서비스에 통합
- [ ] 3개 테스트 파일 GREEN 전환

**예상 난이도**: S (Small)  
**예상 소요**: 1 day

---

### Epic RED-TEST-004: Signal Selector Performance Utilities

**상태**: READY  
**우선순위**: MEDIUM  
**식별자**: RED-TEST-004

**배경**:

- SolidJS 최적화를 위한 signal selector 유틸리티 필요
- `createSelector`, `useSelector`, `useCombinedSelector` 등 미구현
- Performance monitoring 기능 필요

**Skip된 테스트들**:

1. `test/unit/performance/signal-optimization.test.tsx` - Signal 최적화 (17개
   테스트)

**목표**:

- [ ] `createSelector()` 구현 (메모이제이션)
- [ ] `useSelector()` Hook 구현
- [ ] `useCombinedSelector()` Hook 구현
- [ ] `useAsyncSelector()` Hook 구현
- [ ] Performance metrics 수집
- [ ] 17개 테스트 GREEN 전환

**예상 난이도**: M (Medium)  
**예상 소요**: 2-3 days

---

### Epic RED-TEST-005: Style/CSS Consolidation & Token Compliance

**상태**: READY  
**우선순위**: MEDIUM  
**식별자**: RED-TEST-005

**배경**:

- CSS 중복 제거 및 통합 필요
- 디자인 토큰 정책 위반 항목들 정리
- 전역/모듈 CSS 혼용 정리

**Skip된 테스트들**:

1. `test/refactoring/css-global-prune.duplication-expanded.test.ts` - CSS 중복
   제거
2. `test/refactoring/design-tokens.alias-deprecation.test.ts` - 토큰 별칭
   deprecation
3. `test/styles/style-consolidation.test.ts` - 스타일 통합
4. `test/components/performance-optimization.test.ts` - 성능 최적화 (일부)

**목표**:

- [ ] CSS 중복 코드 제거
- [ ] 금지된 alias 토큰 제거
- [ ] CSS Module vs Global 정책 명확화
- [ ] 4개 테스트 파일 GREEN 전환

**예상 난이도**: M (Medium)  
**예상 소요**: 2-3 days

---

### Epic RED-TEST-006: Test Infrastructure Improvements

**상태**: READY  
**우선순위**: LOW  
**식별자**: RED-TEST-006

**배경**:

- 테스트 구조 개선 및 통합 필요
- 테스트 도구/스캔 유틸리티 보완
- Legacy 계약 검증

**Skip된 테스트들**:

1. `test/cleanup/test-consolidation.test.ts` - 테스트 통합
2. `test/refactoring/container/core/container-legacy-contract.test.ts` - Legacy
   계약
3. `test/tooling/no-preact-testing-library.gallery-solid.scan.test.ts` - Import
   스캔
4. `test/unit/shared/services/bulk-download.result-error-codes.contract.test.ts` -
   에러 코드 계약
5. `test/unit/shared/services/http-error-format.test.ts` - HTTP 에러 포맷

**목표**:

- [ ] 테스트 파일 구조 정리
- [ ] Legacy 계약 검증 완료
- [ ] 스캔 도구 개선
- [ ] 5개 테스트 파일 GREEN 전환

**예상 난이도**: S (Small)  
**예상 소요**: 1-2 days

---

## Detailed Plan Proposal — 코드 경량화 v2 (중복/충돌/불필요 코드 제거)

상태: PROMOTED | 식별자: REF-LITE-V2 | 비고: 활성 계획으로 승격됨 — 상세 내용은
`docs/TDD_REFACTORING_PLAN.md`의 EPIC-REF — REF-LITE-V2 섹션을 참조하세요.

---

## Template

```text
IDEA | IDENTIFIER | 간단 요약 | 기대 효과 | 난이도(S/M/H) | 비고
```

필요 시 항목을 재정렬(우선순위 높을수록 위) 하며, 제거는 commit 메시지에 사유
명시.
