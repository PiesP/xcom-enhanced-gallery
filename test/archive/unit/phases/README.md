# Archive: Phase Validation Tests (`test/archive/unit/phases/`)

> Phase 완료 후 검증 및 리팩토링 가드 테스트

**업데이트**: 2025-10-25 (Phase 189 준비)

## 개요

이 디렉토리는 프로젝트의 **Phase 완료 검증 테스트**와 **리팩토링 가드 테스트**를 보관합니다.

- **PHASE**: 각 Phase 완료 시점에 작성된 통합/커버리지 검증 테스트 (14개)
- **REFACTOR_GUARD**: Phase B3.3 리팩토링 진행 중 작성된 가드 테스트 (5개)

모두 **CI에서 제외**되며, 로컬에서만 필요시 참고할 수 있습니다.

---

## 파일 목록 (22개)

### PHASE Validation Tests (14개)

| 파일 | Phase | 검증 대상 | 상태 |
|------|-------|----------|------|
| `integration-phase-140.3-media-extraction-flow.test.ts` | 140.3 | 미디어 추출 플로우 통합 | Archive |
| `phase-125.1-gallery-app.test.ts` | 125.1 | GalleryApp 핵심 기능 | Archive |
| `phase-125.2-initialize-theme.test.ts` | 125.2 | 테마 초기화 | Archive |
| `phase-125.2-main.test.ts` | 125.2 | main.ts 부트스트랩 | Archive |
| `phase-125.3-error-handling.test.ts` | 125.3 | 에러 처리 | Archive |
| `phase-125.4-base-service-impl.test.ts` | 125.4 | 기본 서비스 구현 | Archive |
| `phase-125.5-fallback-extractor.test.ts` | 125.5 | Fallback 추출기 | Archive |
| `phase-125.5-media-extraction-service.test.ts` | 125.5 | 미디어 추출 서비스 | Archive |
| `phase-125.6-video-control-service.test.ts` | 125.6 | 비디오 제어 서비스 | Archive |
| `phase-132-compatibility-aliases.test.ts` | 132 | 호환성 별칭 | Archive |
| `phase-133-toast-api-standardization.test.ts` | 133 | Toast API 표준화 | Archive |
| `phase-134-performance-memory-validation.test.ts` | 134 | 성능/메모리 검증 | Archive |
| `phase-136-type-guards-advanced.test.ts` | 136 | 타입 가드 | Archive |
| `phase-140.1-gallery-renderer.test.ts` | 140.1 | 갤러리 렌더러 | Archive |

### REFACTOR_GUARD Tests (5개 - Phase B3.3)

| 파일 | 검증 대상 | 상태 |
|------|----------|------|
| `phase-140.1-use-gallery-cleanup.test.ts` | 갤러리 정리 훅 | Archive |
| `phase-145-1-scroll-retry.test.ts` | 스크롤 재시도 | Archive |
| `phase-145-2-render-ready.test.ts` | 렌더 준비 | Archive |
| `phase-b3-3-e2e-scenarios.test.ts` | E2E 시나리오 | Archive |
| `phase-b3-3-event-routing.test.ts` | 이벤트 라우팅 | Archive |
| `phase-b3-3-gallery-initialization.test.ts` | 갤러리 초기화 | Archive |
| `phase-b3-3-media-extraction-download.test.ts` | 미디어 추출/다운로드 | Archive |
| `phase-b3-3-settings-config.test.ts` | 설정 구성 | Archive |

---

## 용도

### 활성 개발 중 참고

```bash
# 특정 Phase 테스트 실행 (로컬에서만)
npx vitest run test/archive/unit/phases/phase-125.3-error-handling.test.ts

# 모든 Phase 테스트 실행
npx vitest run test/archive/unit/phases/
```

### 리팩토링 검증

- **Phase B3.3** 진행 중 리팩토링 변경사항의 안정성 검증
- 기존 동작이 유지되는지 확인하는 보험 역할

### 마이그레이션 기록

- Phase별 진행 상황과 검증 내용 추적
- 이후 Phase에서 재사용할 수 있는 패턴 참고

---

## 아키텍처 배경

이 테스트들은 프로젝트의 **점진적 리팩토링 과정**을 기록합니다:

- **Phase 125** (~130): 초기 구조 정리 (GalleryApp, Theme, Services)
- **Phase 132~136** (~140): 호환성, 표준화, 성능 개선
- **Phase 140~145** (~B3.3): E2E 리팩토링, 이벤트 라우팅
- **Phase B3** (현재): 최종 안정화 및 통합

각 Phase의 검증 내용은 해당 파일의 첫 주석과 `describe()` 블록을 참고하세요.

---

## 현재 상태

- **상태**: Archive (CI 제외, 로컬 참고용)
- **커버리지**: 15-70% (Phase별 다이)
- **유지보수**: 점진적 개선 (필요시에만)
- **다음 Phase**: 189 (예정)

---

## 참고 문서

- [`docs/TDD_REFACTORING_PLAN.md`](../../../../docs/TDD_REFACTORING_PLAN.md): Phase별 진행 상황
- [`docs/TESTING_STRATEGY.md`](../../../../docs/TESTING_STRATEGY.md): 테스트 전략
- [`test/README.md`](../../README.md): 테스트 구조 개요
