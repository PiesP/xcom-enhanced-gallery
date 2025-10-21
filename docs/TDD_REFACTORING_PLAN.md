# TDD 리팩토링 활성 계획

최종 업데이트: 2025-10-21

---

## 🎉 모든 활성 과제 완료

> P0, P1, P2, Phase A1 과제가 모두 완료되었습니다. 상세 기록은
> `docs/TDD_REFACTORING_PLAN_COMPLETED.md`를 참고하세요.

### 완료 요약 (2025-10-21)

- **Phase A1: 의존성 그래프 최적화** ✅
  - 순환 참조 제거 (service-factories ↔ service-accessors)
  - 고아 모듈 3개 제거 (memoization, progressive-loader, button)
  - 모듈: 269 → 266, 의존성: 748 → 747
  - dependency-cruiser: 0 violations

- **P0: PostCSS 상대 색상 경고 제거** ✅
  - color-mix 대체, OKLCH 플러그인만 유지
  - prod/dev 빌드 경고 0

- **P1: 레거시 토큰 alias 단계적 제거** ✅
  - `src/features/**` 전범위 canonical tokens로 통일
  - 정책 테스트로 회귀 방지

- **P2: 번들 여유 확보 ≥ 3 KB** ✅
  - 현재: 326.73 KB / 335 KB (**8.27 KB 여유**)
  - 토큰 통일 과정에서 자연스럽게 달성

### 현재 상태

- **Build**: prod 326.73 KB / 335 KB, gzip 88.11 KB (검증 스크립트 PASS)
- **Tests**: unit(~1733) + browser(103) + E2E(60) + a11y(34) 전체 GREEN
- **정적 분석**: Typecheck / ESLint / Stylelint / CodeQL(5개) 모두 PASS
- **의존성**: 266 modules, 747 dependencies, 0 circular violations

---

## 활성 Phase

### 다음 Phase 계획 중 (2025-10-21)

**Phase B1 상태**: ✅ **옵션 1 완료** (GalleryApp 통합 테스트 작성)

- ✅ logger.ts: 87.21% 달성
- ✅ **GalleryApp.ts: 통합 테스트 15개 작성 완료** (100% 통과)
  - 테스트 파일: `test/unit/features/gallery/GalleryApp.integration.test.ts`
  - 커버리지: 초기화, open/close, config, diagnostics, cleanup, errors, signals
  - 서비스 등록 패턴 확립 (GalleryRenderer)
  - fast + unit 프로젝트에서 총 30회 실행 (15개 × 2)
- ✅ media-extraction: 기존 테스트 존재
- ✅ 전체 테스트: 208/208 files (100%), 1748 tests (100%)
- ✅ Browser/E2E/a11y 테스트: 모두 PASS

**현재 상태**:

- Build: prod 326.73 KB / 335 KB (8.27 KB 여유), gzip 88.11 KB
- Tests: unit(~1748) + browser(103) + E2E(60) + a11y(34) 전체 GREEN
- 정적 분석: TypeScript + ESLint + Stylelint + CodeQL 모두 PASS
- 의존성: 266 modules, 747 dependencies, 0 circular violations

**백로그 우선순위 검토**:

1. 테스트 개선 (GalleryApp 통합 테스트, Browser 확장)
2. 성능 최적화 (Lazy loading, CSS Containment)
3. 접근성 강화 (ARIA, 스크린 리더, 키보드)
4. 아키텍처 개선 (Service Layer, State Management)

---

## 백로그 (우선순위 낮음)

1. **테스트 개선**
   - TESTING_STRATEGY.md에 따른 테스트 커버리지 분석
   - Browser 테스트 확장 (Solid.js 반응성 검증)
   - E2E 시나리오 추가 (하네스 패턴 활용)

2. **성능 최적화**
   - Lazy loading 전략 검토
   - CSS Containment 적용 확대
   - 렌더링 성능 프로파일링

3. **접근성 강화**
   - ARIA 패턴 검증 확대
   - 스크린 리더 테스트
   - 키보드 내비게이션 개선

4. **아키텍처 개선**
   - Service Layer 리팩토링 검토
   - State Management 패턴 정리
   - Error Handling 전략 통일

---

## 참고 문서

- **완료 기록**: `docs/TDD_REFACTORING_PLAN_COMPLETED.md`
- **코딩 규칙**: `docs/CODING_GUIDELINES.md`
- **아키텍처**: `docs/ARCHITECTURE.md`
- **테스트 전략**: `docs/TESTING_STRATEGY.md`
- **의존성 관리**: `docs/DEPENDENCY-GOVERNANCE.md`
