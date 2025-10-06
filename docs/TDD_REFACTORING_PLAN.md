# TDD 리팩토링 활성 계획

> 프로젝트 개선을 위한 TDD 기반 리팩토링 작업 관리

**최근 업데이트**: 2025-10-06 **현재 상태**: Production 환경 검증 필요 ⚠️

완료된 내용은
[`TDD_REFACTORING_PLAN_COMPLETED.md`](TDD_REFACTORING_PLAN_COMPLETED.md)에서
확인하실 수 있습니다.

---

## 프로젝트 현황

### 테스트 상태

- **전체 테스트**: 2954 passed | 110 skipped | 1 todo (3065 total)
- **상태**: ✅ GREEN (테스트 환경)
- **Production 상태**: ⚠️ 실제 X.com 환경에서 일부 기능 미작동 보고됨

### 번들 크기 (2025-10-06)

- **Raw**: 495.86 KB (목표: ≤473 KB, **22.86 KB 초과** ⚠️)
- **Gzip**: 123.95 KB (목표: ≤118 KB, **5.95 KB 초과** ⚠️)
- **이상적 목표**: Raw 420 KB, Gzip 105 KB

### 최근 완료 (2025-10-06)

- ✅ **Epic GALLERY-ENHANCEMENT-001**: 갤러리 UX 개선
  - Sub-Epic 1: 타임라인 스크롤 위치 복원 (scrollAnchorManager)
  - Sub-Epic 2: 비디오 미디어 렌더링 검증
  - Sub-Epic 3: 자동 포커스 동기화 (자동 스크롤 없이)

---

## 현재 활성 작업

현재 진행 중인 Epic이 없습니다. 다음 우선순위 작업은 **향후 Epic 후보** 섹션을
참조하세요.

---

## 향후 Epic 후보

### Epic BUNDLE-ANALYZER-INTEGRATION

**우선순위**: Low **난이도**: S **예상 기간**: 1-2일

**목표**: 실제 번들 구성 시각화 및 추가 최적화 기회 발견

**작업 대상**:

- `rollup-plugin-visualizer` 통합
- 큰 모듈 식별
- Dynamic import 검토

---

## TDD 워크플로

1. **RED**: 실패 테스트 추가 (최소 명세)
2. **GREEN**: 최소 변경으로 통과
3. **REFACTOR**: 중복 제거/구조 개선
4. **Document**: Completed 로그에 이관

**품질 게이트**:

- ✅ `npm run typecheck` (strict 오류 0)
- ✅ `npm run lint:fix` (자동 수정 적용)
- ✅ `npm test` (해당 Phase GREEN)
- ✅ `npm run build` (산출물 검증 통과)

---

## 참조 문서

- 아키텍처: [`ARCHITECTURE.md`](ARCHITECTURE.md)
- 코딩 가이드: [`CODING_GUIDELINES.md`](CODING_GUIDELINES.md)
- 벤더 API: [`vendors-safe-api.md`](vendors-safe-api.md)
- 실행/CI: [`../AGENTS.md`](../AGENTS.md)
- 백로그: [`TDD_REFACTORING_BACKLOG.md`](TDD_REFACTORING_BACKLOG.md)
