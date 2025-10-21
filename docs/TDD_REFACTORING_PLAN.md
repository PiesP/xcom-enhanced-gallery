# TDD 리팩토링 활성 계획

최종 업데이트: 2025-10-21

---

## 🎉 모든 활성 과제 완료

> P0, P1, P2 과제가 모두 완료되었습니다. 상세 기록은
> `docs/TDD_REFACTORING_PLAN_COMPLETED.md`를 참고하세요.

### 완료 요약 (2025-10-21)

- **P0: PostCSS 상대 색상 경고 제거** ✅
  - color-mix 대체, OKLCH 플러그인만 유지
  - prod/dev 빌드 경고 0

- **P1: 레거시 토큰 alias 단계적 제거** ✅
  - `src/features/**` 전범위 canonical tokens로 통일
  - 정책 테스트로 회귀 방지

- **P2: 번들 여유 확보 ≥ 3 KB** ✅
  - 현재: 326.98 KB / 335 KB (**8.02 KB 여유**)
  - 토큰 통일 과정에서 자연스럽게 달성

### 현재 상태

- **Build**: prod 326.98 KB / 335 KB, gzip 88.17 KB (검증 스크립트 PASS)
- **Tests**: unit(~1389) + browser(103) + E2E(60) + a11y(34) 전체 GREEN
- **정적 분석**: Typecheck / ESLint / Stylelint / CodeQL(5개) 모두 PASS

---

## 활성 Phase

### Phase A1: 의존성 그래프 최적화 (아키텍처 개선)

**목표**: 순환 참조 제거 및 고아 모듈 정리

**배경**:

- dependency-cruiser 분석 결과, 3-way 순환 참조 발견
- 고아 모듈(orphan) 5개 발견 (1개는 valid: false)
- 0 errors이지만 구조적 개선 필요

**발견된 문제**:

1. **순환 참조** (HIGH Priority)

   ```
   service-factories.ts ↔ media-service.ts ↔ service-accessors.ts
   ```

   - `service-accessors.ts:33` - `getBulkDownloadServiceFromContainer()`에서
     동적 import로 `service-factories` 호출
   - 이는 DI 컨테이너 패턴의 설계 문제
   - 해결: Factory를 컨테이너에서 분리하거나, Lazy Registration 패턴 적용

2. **고아 모듈** (MEDIUM Priority)
   - `src/shared/utils/performance/memoization.ts` (**valid: false**, 사용되지
     않음)
   - `src/shared/loader/progressive-loader.ts` (미사용)
   - `src/shared/styles/tokens/button.ts` (미사용, 토큰 통일 과정에서 제거됨)
   - `src/shared/i18n/module.autoupdate.d.ts` (타입 정의, OK)
   - `src/types/solid-js-client.d.ts` (타입 정의, OK)

**작업 계획**:

1. **순환 참조 해결**
   - [ ] RED: 순환 참조 감지 테스트 추가
         (`test/refactoring/circular-dependency.test.ts`)
   - [ ] GREEN: `service-accessors.ts`의 fallback 로직을 제거하고 컨테이너
         등록을 명시적으로 bootstrap에서 수행
   - [ ] REFACTOR: Factory와 Accessor 역할 명확히 분리

2. **고아 모듈 제거**
   - [ ] `memoization.ts` 삭제 (Solid.js는 자체 반응성 최적화 제공)
   - [ ] `progressive-loader.ts` 삭제 또는 실제 사용처 추가
   - [ ] `button.ts` 삭제 (디자인 토큰 통일 완료로 불필요)

3. **검증**
   - [ ] `npm run deps:check` 0 violations 확인
   - [ ] `npm run build` 성공
   - [ ] 전체 테스트 통과

**수용 기준**:

- ✅ dependency-cruiser에서 circular dependency 0건
- ✅ orphan 모듈 중 valid: false 제거
- ✅ 전체 테스트 GREEN
- ✅ 빌드 크기 유지 또는 감소

---

## 백로그 (우선순위 낮음)

1. **테스트 개선**
   - TESTING_STRATEGY.md에 따른 테스트 커버리지 분석
   - Browser 테스트 확장 (Solid.js 반응성 검증)
   - E2E 시나리오 추가 (하네스 패턴 활용)

2. **성능 최적화**
   - 번들 분석 (rollup-plugin-visualizer)
   - lazy loading 전략
   - 메모이제이션 최적화

3. **접근성 강화**
   - WCAG 2.1 Level AA 수동 검증
   - 키보드 네비게이션 개선
   - 스크린 리더 호환성

---

## 참고 문서

- 완료 기록: `docs/TDD_REFACTORING_PLAN_COMPLETED.md`
- 개발 워크플로: `AGENTS.md`
- 아키텍처: `docs/ARCHITECTURE.md`
- 코딩 규칙/디자인 토큰: `docs/CODING_GUIDELINES.md`
- 테스트 전략: `docs/TESTING_STRATEGY.md`
