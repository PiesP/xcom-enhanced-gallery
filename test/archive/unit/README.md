# test/archive/unit README

## 개요

`test/archive/unit/`은 **완료된 Phase의 유닛 테스트 파일**을 보관하는
디렉터리입니다.

## 🗂️ 보관된 Phase 테스트 (27개)

### Phase 117

- `phase-117-language-persistence.test.ts` (언어 설정 유지)

### Phase 125 (큰 규모 리팩토링)

- `phase-125.1-gallery-app.test.ts` (갤러리 앱 초기화)
- `phase-125.2-main.test.ts` (메인 초기화)
- `phase-125.2-initialize-theme.test.ts` (테마 초기화)
- `phase-125.3-error-handling.test.ts` (에러 핸들링)
- `phase-125.4-base-service-impl.test.ts` (기본 서비스 구현)
- `phase-125.5-media-extraction-service.test.ts` (미디어 추출 서비스)
- `phase-125.5-fallback-extractor.test.ts` (폴백 추출기)
- `phase-125.6-video-control-service.test.ts` (비디오 컨트롤 서비스)

### Phase 132-136 (호환성/표준화)

- `phase-132-compatibility-aliases.test.ts` (경로 별칭 호환성)
- `phase-133-toast-api-standardization.test.ts` (토스트 API 표준화)
- `phase-134-performance-memory-validation.test.ts` (성능/메모리 검증)
- `phase-136-type-guards-advanced.test.ts` (고급 타입 가드)

### Phase 140 (갤러리 렌더링)

- `phase-140.1-gallery-renderer.test.ts` (갤러리 렌더러)
- `phase-140.1-use-gallery-cleanup.test.ts` (정리 훅)

### Phase 145 (스크롤/렌더 최적화)

- `phase-145-1-scroll-retry.test.ts` (스크롤 재시도)
- `phase-145-2-render-ready.test.ts` (렌더 준비)

### Phase B3 (통합/커버리지)

- `phase-b3-2-gallery-app-coverage.test.ts` (갤러리 앱 커버리지)
- `phase-b3-2-2-media-service-coverage.test.ts` (미디어 서비스 커버리지)
- `phase-b3-2-3-bulk-download-service-coverage.test.ts` (다운로드 서비스
  커버리지)
- `phase-b3-2-4-unified-toast-manager-coverage.test.ts` (토스트 매니저 커버리지)
- `phase-b3-3-e2e-scenarios.test.ts` (E2E 시나리오)
- `phase-b3-3-event-routing.test.ts` (이벤트 라우팅)
- `phase-b3-3-gallery-initialization.test.ts` (갤러리 초기화)
- `phase-b3-3-media-extraction-download.test.ts` (미디어 추출 다운로드)
- `phase-b3-3-settings-config.test.ts` (설정 구성)
- `phase-b3-4-performance-red.test.ts` (성능 RED 테스트)

---

## 📝 정책

### CI/로컬 테스트 제외

아카이브된 Phase 테스트는:

- ✅ Git으로 추적됨 (삭제되지 않음)
- ❌ CI 파이프라인에서 실행되지 않음
- ❌ `npm test` 등 로컬 테스트에서 실행되지 않음
- 📚 참고용 및 역사 기록 목적으로만 보관

### Vitest 제외 설정

`vitest.config.ts`의 `exclude` 필드에 `test/archive/**`가 포함되어 있으므로,
Vitest는 자동으로 이 디렉터리를 무시합니다.

---

## 🔄 파일 복원 방법

특정 Phase의 테스트를 다시 활성화하려면:

```bash
# 1. 아카이브에서 원래 위치로 이동
mv test/archive/unit/phase-XXX-*.test.ts test/unit/<appropriate-dir>/

# 2. vitest.config.ts에서 필요시 exclude 조정

# 3. 테스트 실행
npm test
```

---

## 📊 통계

- **보관 기간**: Phase 117 ~ Phase 175 (진행 중)
- **총 파일**: 27개
- **파일명 패턴**: `phase-<number>-<description>.test.ts`

---

## 관련 문서

- **[docs/TDD_REFACTORING_PLAN.md](../../docs/TDD_REFACTORING_PLAN.md)**: 각
  Phase의 상세 설명
- **[docs/TESTING_STRATEGY.md](../../docs/TESTING_STRATEGY.md)**: 테스트 전략
- **[test/README.md](../README.md)**: 활성 테스트 구조

---

## Phase 176 (2025-10-25): alias 모던화 및 아카이브

### 아카이브 파일

- `alias/alias-static-import.test.ts`: 플랫폼별 `/@fs/` 프리픽스 검증 (SKIPPED)

### 아카이브 정책

**이유**: 개발 서버 전용 기능

- `/@fs/` 프리픽스: Vite dev server에서만 유효 (빌드 시 alias로 해석됨)
- 플랫폼별 하드코딩 경로: 유지보수 부담 > 가치
- 충분한 대체 검증: `test/unit/alias/alias-resolution.test.ts`

### 활성 테스트

- `test/unit/alias/alias-resolution.test.ts`: Vite 경로 별칭 동적 import 검증
  (유지보수됨)

---

## 유지보수

Phase 작업이 완료되면:

1. Phase 테스트 파일을 `test/unit/`에서 이동
2. 이 디렉터리에 정렬하여 보관
3. 원본 Phase 문서를 `docs/archive/` 또는
   `docs/TDD_REFACTORING_PLAN_COMPLETED.md`에 기록
