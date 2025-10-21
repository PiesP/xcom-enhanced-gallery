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

## 다음 단계

새로운 개선 과제가 필요한 경우 아래 영역에서 선정하세요:

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

4. **아키텍처 개선**
   - ARCHITECTURE.md 기반 경계 점검
   - 의존성 그래프 최적화 (dependency-cruiser)
   - 서비스 레이어 리팩토링

---

## 참고 문서

- 완료 기록: `docs/TDD_REFACTORING_PLAN_COMPLETED.md`
- 개발 워크플로: `AGENTS.md`
- 아키텍처: `docs/ARCHITECTURE.md`
- 코딩 규칙/디자인 토큰: `docs/CODING_GUIDELINES.md`
- 테스트 전략: `docs/TESTING_STRATEGY.md`
