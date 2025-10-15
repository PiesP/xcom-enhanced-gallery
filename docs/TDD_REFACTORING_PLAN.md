# TDD 리팩토링 활성 계획

> **최종 업데이트**: 2025-10-15 | **상태**: Phase 78.9 완료 ✅

## 프로젝트 현황

- **빌드**: prod **328.78 KB / 335 KB** (6.22 KB 여유, 98.1%) ✅
- **테스트**: **159개 파일**, 987 passing / 0 failed (100% 통과율) ✅✅✅
- **Skipped**: **10개** (8개 E2E 이관 권장 + 2개 기존) ⚠️
- **타입**: TypeScript strict, 0 errors ✅
- **린트**: ESLint 0 warnings ✅
- **CSS 린트**: stylelint **0 warnings** (error 강화 완료) ✅✅✅
- **의존성**: 0 violations (261 modules, 730 dependencies) ✅
- **커버리지**: v8로 통일 완료 ✅
- **디자인 토큰**: px 0개 (Primitive/Semantic), rgba 0개 ✅
- **브라우저 지원**: Safari 14+, Chrome 110+ (OKLCH 폴백 적용) ✅

## 현재 상태: Phase 78.9 완료 (stylelint 설정 재검토 및 최적화) ✅

**완료일**: 2025-10-15 **목표**: Phase 78.8 경고 0개 달성 후 stylelint 설정 강화
**결과**: warning → error 전환, color-no-hex 규칙 추가, 빌드 크기 유지

### 주요 성과

- ✅ **stylelint 경고 0개 유지**: error 강화 완료
- ✅ **규칙 강화**: warning → error 전환 (px, specificity, duplicate, shorthand)
- ✅ **hex 색상 검증 추가**: oklch 강제, primitive 파일만 예외
- ✅ **빌드 크기 유지**: 328.78 KB (동일)
- ✅ **테스트 회귀 없음**: 100% 통과율 유지

### 설정 변경 내용

1. **warning → error 전환**:
   - `unit-disallowed-list` (px 금지)
   - `no-duplicate-selectors`
   - `no-descending-specificity`
   - `declaration-block-no-shorthand-property-overrides`

2. **color-no-hex 규칙 추가**: oklch 강제, primitive 파일만 예외

3. **메시지 개선**: 모든 규칙에 CODING_GUIDELINES.md 참조 추가

---

## Phase 79: 남은 CSS Specificity 문제 완전 해결 ⏭️

**상태**: Phase 78.8 완료로 **목표 달성**, 건너뛰기 권장 **이유**: stylelint
warning 0개 이미 달성 (19→0개)

### Phase 78.8 완료로 목표 달성

- ✅ **Phase 78.8 결과**: stylelint 0 warnings (19개 완전 해결)
- ✅ **Toolbar.module.css**: 6개 specificity 이슈 해결 (통합 `:focus-visible`
  분리)
- ✅ **VerticalGalleryView.module.css**: 6개 specificity 이슈 해결 (선택자 순서
  재정렬)
- ✅ **Button 계층**: 7개 이슈 해결 (Toast.module.css, primitive/Button.css,
  Button.module.css)

### 권장 조치

- **Phase 79 건너뛰기**: 원래 목표였던 specificity 문제 완전 해결이 Phase
  78.8에서 달성됨
- **문서 업데이트**: 완료된 작업 내역은 `TDD_REFACTORING_PLAN_COMPLETED.md`
  Phase 78.8-78.9 참조

---

## 다음 Phase 계획

### Phase 78.7: 대규모 Component CSS 개선 (계획 중)

**상태**: 준비 중 **목표**: gallery-global.css + 주요 Gallery 컴포넌트 CSS 개선
**예상 시간**: 4-5시간 **우선순위**: 중

#### 개선 대상 파일

1. **최우선 대상** (경고 많은 순):
   - `gallery-global.css`: 77개 (가장 많음) - toolbar, counter, fit-buttons
   - `Toolbar.module.css`: 37개 - button sizes, shadows, media queries
   - `VerticalGalleryView.module.css`: 28개 - layout, transitions (+ specificity
     이슈)
   - `Gallery.module.css`: 11개 - viewer, controls

2. **부가 파일**:
   - `VerticalImageItem.module.css`: 10개
   - primitive, settings 등: 각 1-6개

3. **목표**:
   - stylelint warning 196→120개 이하 (39% 감소)
   - CSS specificity 이슈 해결 (VerticalGalleryView)
   - 번들 크기 330 KB 이하 유지
   - 테스트 100% 통과율 유지

---

## 다음 Phase 계획 (기존)---

## 향후 Phase 계획

### Phase 79: CSS 마이그레이션 완료 (진행 중)

**상태**: 진행 중 (121개 warning 남음) **목표**: 남은 CSS Modules 파일들의 px
하드코딩 제거 **예상 시간**: 2-3시간

#### 개선 대상 파일

1. **Global CSS**:
   - design-tokens.component.css (3개)
   - isolated-gallery.css (2개)
   - reset.css (2개)
   - animations.css (1개)

2. **Component Modules**:
   - Gallery.module.css (10개 - viewer, controls)
   - Toolbar.module.css (18개 - buttons, media queries)
   - VerticalGalleryView.module.css (13개 + specificity 이슈)
   - VerticalImageItem.module.css (10개)
   - ToolbarShell.module.css (6개)
   - primitive/Button.css (3개)
   - 기타 작은 파일들 (각 1-2개)

3. **목표**:
   - stylelint warning 121→50개 이하 (58% 추가 감소)
   - 번들 크기 330 KB 이하 유지
   - 테스트 100% 통과율 유지

---

### Phase 80: 번들 최적화 (계획)

**상태**: 대기 (현재 327.98 KB, 97.9% 사용) **트리거**: 빌드 330 KB (98.5%) 도달
시 **목표**: 7-10 KB 절감으로 14-17 KB 여유 확보 **예상 시간**: 5-8시간

#### 최적화 전략

1. **Tree-Shaking** (events.ts, 15.41 KB → 13.5 KB 목표)
   - 미사용 exports 제거
   - MediaClickDetector, gallerySignals 의존성 최소화

2. **Lazy Loading** (twitter-video-extractor.ts, 12.73 KB)
   - 동영상 tweet에서만 필요, 조건부 import() 적용

3. **Code Splitting** (media-service.ts, 17.53 KB)
   - extraction/mapping/control 로직 분리
   - 필요 시에만 로드

---

## 완료된 Phase 기록

자세한 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md` 참조

- **Phase 78.5** (2025-10-15): Component CSS 점진적 개선, warning 28개 감소 ✅
- **Phase 78** (2025-10-15): 디자인 토큰 통일 (Primitive/Semantic) ✅
- **Phase 75** (2025-10-15): test:coverage 실패 4개 수정, E2E 이관 권장 5개 추가
  ✅
- **Phase 74.9** (2025-10-15): 테스트 최신화 및 수정 ✅
- **Phase 74.8** (2025-10-15): 린트 정책 위반 12개 수정 ✅
- **Phase 74.7** (2025-10-15): 실패/스킵 테스트 8개 최신화 ✅
- **Phase 74.6** (2025-10-14): 테스트 구조 개선 ✅
- **Phase 74.5** (2025-10-13): 중복 제거 및 통합 ✅

---

## 모니터링 지표

### 경계 조건

- **번들 크기**: 330 KB (98.5%) 도달 시 Phase 73 활성화
- **테스트 skipped**: 20개 이상 시 즉시 검토 (현재 10개)
- **테스트 통과율**: 95% 미만 시 Phase 74 재활성화
- **빌드 시간**: 60초 초과 시 최적화 검토
- **문서 크기**: 개별 문서 800줄 초과 시 분할 검토

### 주기별 점검

- **주간**: 번들 크기, 테스트 통과율, skipped 수
- **월간**: 의존성 업데이트, 문서 최신성, 보안 취약점
- **분기**: 아키텍처 리뷰, 성능 벤치마크

---

## 참고 문서

- [TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md):
  완료된 Phase 상세 기록
- [AGENTS.md](../AGENTS.md): 개발 워크플로
- [ARCHITECTURE.md](./ARCHITECTURE.md): 3계층 구조
- [CODING_GUIDELINES.md](./CODING_GUIDELINES.md): 코딩 규칙
- [MAINTENANCE.md](./MAINTENANCE.md): 유지보수 체크리스트
