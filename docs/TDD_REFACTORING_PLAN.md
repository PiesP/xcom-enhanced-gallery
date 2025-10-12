# TDD 리팩토링 활성 계획

> **최종 업데이트**: 2025-01-27
>
> **브랜치**: feature/phase-32-bundle-optimization
>
> **상태**: Phase 32 계획 수립 중 🚧

## 프로젝트 상태

- **빌드**: dev 831.69 KB / prod 320.73 KB (gzip 87.39 KB) ✅
- **테스트**: 634/659 passing (24 skipped, 1 todo) ✅
- **타입**: 0 errors (TypeScript strict) ✅
- **린트**: 0 warnings ✅
- **의존성**: 0 violations (266 modules, 732 dependencies) ✅

## 참고 문서

- `AGENTS.md`: 개발 환경 및 워크플로
- `docs/TDD_REFACTORING_PLAN_COMPLETED.md`: 완료된 Phase 1-31 기록
- `docs/ARCHITECTURE.md`: 아키텍처 구조
- `docs/CODING_GUIDELINES.md`: 코딩 규칙

---

## 활성 작업

### Phase 32: CSS Optimization & Bundle Size Reduction 🚧

**목표**: 320.73 KB → 290-300 KB (20-30 KB 절감, 6-9%)

**배경**:

- Phase 31에서 logger 최적화로 13.95 KB 절감 완료
- CSS 소스 파일 26개, 총 187.38 KB (minified 후 실제 크기는 더 작음)
- 중복 패턴 발견: transition 정의, 레거시 alias, media query 반복

**지연 로딩 평가 결과**: ❌ 실효성 없음

- Userscript 제약: `inlineDynamicImports: true` (단일 번들 필수)
- 동적 import는 빌드 시점에 모두 인라인됨
- KeyboardHelpOverlay/Settings는 이미 조건부 렌더링으로 최적화됨

**실행 전략** (TDD 우선):

1. **CSS 중복 제거** (예상 10-15 KB)
   - [ ] 테스트: CSS 중복 검증 테스트 작성
   - [ ] 구현: 공통 transition을 유틸리티 클래스로 통합
   - [ ] 구현: Media query를 전역 레이어로 통합
   - [ ] 리팩토링: 레거시 토큰 alias 제거

2. **디자인 토큰 정리** (예상 5-8 KB)
   - [ ] 테스트: unused alias 검증 테스트
   - [ ] 구현: semantic 토큰 중복 정리
   - [ ] 리팩토링: 토큰 계층 단순화

3. **Component CSS 최적화** (예상 5-7 KB)
   - [ ] 테스트: 선택자 복잡도 검증
   - [ ] 구현: 공통 패턴 추출
   - [ ] 리팩토링: 선택자 단순화

**주요 파일** (큰 순서):

- Gallery.module.css (24.18 KB)
- Toolbar.module.css (18.93 KB)
- VerticalGalleryView.module.css (17.77 KB)
- Button.module.css (16.37 KB)
- gallery-global.css (13.61 KB)
- design-tokens.semantic.css (12.57 KB)

**검증 기준**:

- [ ] Prod bundle < 300 KB (raw)
- [ ] 모든 기존 테스트 통과 (634/659)
- [ ] 시각적 회귀 없음 (E2E 스모크 테스트)
- [ ] 접근성 유지 (contrast, reduced-motion 등)

---

## 최근 완료 Phase

### Phase 31: Prod Bundle Budget Recovery (2025-10-12) ✅

**구현 내역**:

1. Logger dev/prod 분기를 `import.meta.env.DEV` 기반으로 강화하여 프로덕션에서
   `debug/time` 계열을 완전 NOOP 처리.
2. Vite에 Babel 기반 `stripLoggerDebugPlugin` 추가, 프로덕션 빌드 시
   `.debug(...)` 호출을 AST 레벨에서 제거.
3. 빌드 검증 및 테스트 회귀 확인 (logger.test.ts 2/2 ✅).
4. 유지보수 점검으로 프로덕션 빌드 예산 준수 확인.

**결과**: prod raw 334.68 KB → 320.73 KB (~13.95 KB 절감), gzip 91 KB → 87.39
KB. 325 KB 예산 대비 4.27 KB 여유 확보.

---

## 작업 시작 체크리스트

새로운 Phase 시작 시:

1. 현재 상태 확인: `npm run validate && npm test`
2. 관련 문서 검토 (AGENTS.md, CODING_GUIDELINES.md, ARCHITECTURE.md)
3. 작업 브랜치 생성: `git checkout -b feature/phase-xx-...`
4. TDD_REFACTORING_PLAN.md에 계획 작성
5. RED → GREEN → REFACTOR 흐름 준수
6. 빌드 검증: `Clear-Host && npm run build`
7. 문서 업데이트 (완료 시 TDD_REFACTORING_PLAN_COMPLETED.md로 이동)
8. 유지보수 점검: `npm run maintenance:check`

---

**현재 프로젝트는 안정 상태입니다. 모든 Phase가 완료되었으며, 다음 작업이
필요하면 새로운 Phase를 계획하세요.**
