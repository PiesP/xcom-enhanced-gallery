# TDD 리팩토링 완료 기록

> **최종 업데이트**: 2025-01-27
>
> **상태**: Phase 1-33 (Step 1) 완료 ✅

## 프로젝트 상태 스냅샷 (2025-01-27)

- **빌드**: dev 831.69 KB / prod 320.73 KB (gzip 87.40 KB) ✅
- **테스트**: Vitest 634/659 (24 skipped, 1 todo), Playwright 8/8 ✅
- **타입**: TypeScript strict, 0 errors ✅
- **린트**: ESLint 0 warnings / 0 errors ✅
- **의존성**: dependency-cruiser violations 0 ✅

## 최근 완료 Phase

### Phase 33 Step 1: Bundle Analysis Infrastructure (2025-01-27)

**목표**: JavaScript 번들 구성 분석 및 최적화 전략 수립 (Step 2 구현 준비)

**배경**: Phase 32에서 CSS 최적화로는 번들 크기 절감이 어렵다는 것을 확인.
JavaScript 레벨 접근이 필요하므로 번들 구성 분석 인프라 구축.

**구현 내역**:

1. **번들 분석 도구 통합**
   - `rollup-plugin-visualizer` 설치 (6개 패키지 추가)
   - `vite.config.ts`에 visualizer 플러그인 추가 (프로덕션 빌드 전용)
   - 인터랙티브 HTML 트리맵 리포트 생성 (`docs/bundle-analysis.html`)
   - Python 분석 스크립트 작성 (`scripts/analyze-bundle.py`)

2. **번들 구성 분석**
   - 전체 번들: 320.73 KB (gzip 87.40 KB)
   - Top 20 모듈 분석: 266.25 KB
   - **Solid.js 런타임**: 62.78 KB (23.6%)
     - solid-js/dist/solid.js: 33.72 KB
     - solid-js/web/dist/web.js: 21.08 KB
     - solid-js/store/dist/store.js: 7.98 KB
   - **애플리케이션 코드**: 203.47 KB (76.4%)
     - media-service.ts: 21.58 KB
     - events.ts: 19.28 KB
     - Toolbar.tsx: 14.99 KB
     - VerticalImageItem.tsx: 13.80 KB
     - twitter-video-extractor.ts: 13.87 KB
     - SettingsModal.tsx: 12.73 KB
     - bulk-download-service.ts: 11.87 KB

3. **최적화 전략 수립** (Step 2 구현 계획)
   - **이벤트 핸들링**: 19.28 KB → 15 KB (4 KB 절감)
   - **컴포넌트**: 41.52 KB → 35 KB (6.5 KB 절감)
   - **서비스**: 59.11 KB → 50 KB (9 KB 절감)
   - **총 목표**: 320.73 KB → 301 KB (19.5 KB 절감)

**성과**:

- ✅ 번들 구성 완전 가시화 (treemap + JSON 데이터)
- ✅ 최적화 대상 우선순위 선정 (Top 10 모듈 식별)
- ✅ 구체적 절감 목표 수립 (19.5 KB)
- ✅ TDD 기반 구현 계획 수립 (RED → GREEN → REFACTOR)

**핵심 발견**:

- Solid.js 런타임(23.6%)은 프레임워크 필수 요소로 최적화 불가
- 애플리케이션 코드(76.4%)에서 실질적 절감 가능
- 이벤트 유틸리티, 컴포넌트, 서비스 레이어가 주요 최적화 대상
- TDD 접근: 각 영역별 크기 가드 테스트 → 최적화 구현 → 리팩터링

**결론**: Step 1에서 번들 분석 인프라와 최적화 전략 수립 완료. Step 2에서는 TDD
기반으로 events.ts, 컴포넌트, 서비스 레이어를 단계적으로 최적화하여 19.5 KB 절감
목표 달성 예정.

---

### Phase 32: CSS Optimization Analysis (2025-01-27)

**초기 목표**: 320.73 KB → 290-300 KB (CSS 중복 제거로 20-30 KB 절감)

**배경**: Phase 31에서 325 KB 예산 준수는 달성했으나, 추가 기능을 위한 여유
공간이 필요. CSS 중복을 제거하면 추가 절감이 가능할 것으로 예상.

**실행 내역**:

1. **RED 단계**: CSS 중복 검증 테스트 작성
   (`test/styles/css-optimization.test.ts`)
   - prefers-reduced-motion: 19개 중복 발견 (목표 ≤2)
   - prefers-contrast: 15개 중복 발견 (목표 ≤2)
   - prefers-color-scheme: 12개 중복 발견 (목표 ≤3)
   - 레거시 token alias: 101개 발견 (목표 <10)
   - transition 패턴 중복: 1개 파일
   - backdrop-filter 중복: 6개 파일
   - CSS 소스 전체 크기: 187.38 KB (26개 파일)

2. **GREEN 시도 1**: 접근성 media query 통합
   - `src/shared/styles/a11y-media-queries.css` 생성
   - 결과: 321.80 KB로 **1.07 KB 증가** ❌
   - 롤백 완료

3. **GREEN 시도 2**: 레거시 keyframes 제거
   - `slideInFromRight`, `fadeSlideIn` 제거
   - 결과: **320.73 KB 유지 (변화 없음)** ⚠️

**핵심 발견**:

- **PostCSS + Terser가 이미 aggressive minification 수행**
  - CSS 중복은 빌드 시점에 자동으로 제거됨
  - 소스 레벨 중복 제거 → 최종 빌드 크기에 영향 없음
- **실제 번들 크기의 주범은 JavaScript**
  - Solid.js 런타임 + 애플리케이션 코드가 주 용량
  - CSS는 minified 후 매우 작은 비중
- **현재 320.73 KB는 이미 최적화된 상태**
  - 추가 CSS 최적화로는 20-30 KB 절감 불가능

**성과**:

- ✅ CSS 중복 분석 도구 확보 (`test/styles/css-optimization.test.ts`)
  - 향후 유지보수 시 중복 방지 가드로 활용 가능
- ✅ 빌드 최적화 메커니즘 이해
  - PostCSS/Terser의 동작 방식 파악
  - JavaScript가 실제 크기 결정 요인임을 검증
- ✅ Phase 33 방향성 도출
  - Rollup Visualizer로 JavaScript 번들 분석 필요
  - Tree-shaking 및 미사용 기능 제거 검토

**결론**: CSS 최적화는 유지보수 품질 향상에 기여하나, 번들 크기 절감 목표는
JavaScript 레벨 접근이 필요. Phase 32는 "분석 완료" 단계로 종료하며, 실질적인
크기 절감은 Phase 33에서 진행.

---

### Phase 31: Prod Bundle Budget Recovery (2025-10-12)

**배경**: `npm run maintenance:check` 결과 prod 번들 원본 크기 334.68 KB로 팀
예산(325 KB)을 초과. 향후 기능 추가 전 안전 여유 확보 필요.

**목표**: prod userscript 원본 ≤ 325 KB, gzip ≤ 95 KB 유지, 기능/테스트 회귀
없음.

**구현 내역**:

1. **Logger dev/prod 분기 강화**: `src/shared/logging/logger.ts`가
   `import.meta.env.DEV` 신호로 프로덕션에서 `debug/time/timeEnd`를 완전 NOOP
   처리하도록 재구성.
2. **Babel transform 추가**: `vite.config.ts`에 `stripLoggerDebugPlugin` 도입,
   프로덕션 빌드 전 Babel AST 방문으로 `.debug(...)` 호출을 제거해 문자열/브랜치
   제거.
3. **빌드 검증**: `scripts/validate-build.js`의 raw size guard(325 KB hard
   limit, 320 KB soft warning) 통과 확인, prod 320.73 KB (gzip 87.39 KB) 달성.
4. **테스트 회귀 확인**: `test/unit/shared/logging/logger.test.ts`로 dev 풍부한
   로깅 / prod squelch 동작 검증, Vitest 2/2 ✅.
5. **유지보수 점검**: `npm run maintenance:check` 모든 항목 정상, 프로덕션 빌드
   예산 준수.

**결과**: prod raw 크기 334.68 KB → 320.73 KB (~13.95 KB 절감, 4.2% 감소), gzip
91 KB → 87.39 KB. 325 KB 예산 대비 4.27 KB 여유 확보, 향후 기능 추가 공간 확보.

### Phase 30: Toolbar Focus Preview Rollback (2025-10-12)

- `Toolbar`·`ToolbarWithSettings`에서 프리뷰 props와 memoized 상태를 제거하고,
  CSS 모듈의 프리뷰 클래스와 타입 정의를 정리하여 UI를 Phase 28 이전 구성으로
  복원.
- `VerticalGalleryView`에서 프리뷰 메모 및 설정 구독 로직을 삭제하고 언어 서비스
  번역 항목을 정리하여 포커스 카운터만 남도록 단순화.
- `test/features/gallery/toolbar-focus-indicator.test.tsx`를 RED→GREEN 흐름으로
  갱신해 프리뷰 DOM 미노출과 카운터 aria-live 유지, 포커스 인덱스 동기화를 단언.
- `npx vitest run test/features/gallery/toolbar-focus-indicator.test.tsx`와
  `Clear-Host && npm run build`로 변경 사항을 검증.

### Phase 29: Toolbar Focus Indicator Preview (2025-10-12)

- 갤러리에서 포커스된 미디어 썸네일/설명을 메모이제이션하고 설정 구독으로
  `focusIndicatorsEnabled` 상태를 동기화.
- `Toolbar`에 프리뷰 `<figure>`를 추가해 이미지, 캡션, `aria-live="polite"`
  안내를 제공하고 skeleton 스타일을 적용.
- 언어 서비스 및 CSS 모듈을 확장하고, feature/fast 테스트 프로젝트에 프리뷰 검증
  스위트를 추가.

### Phase 28: 자동/수동 스크롤 충돌 방지 (2025-01-15)

- 사용자 스크롤 감지 후 자동 스크롤을 일시 차단하고, 500ms idle 이후 복구.
- `VerticalGalleryView` 스크롤 effect를 정리하고 회귀 테스트를 확장.

### Phase 27: Storage Adapter 패턴 (2025-01-15)

- Userscript/브라우저 겸용 StorageAdapter를 도입하고 서비스 계층을 주입 가능
  구조로 리팩토링.
- Vitest 20건 추가로 저장소 경계 테스트를 보강.

## Phase 하이라이트

- **Phase 1-6**: Solid.js 전환, 테스트 인프라(Vitest/Playwright) 구축, ARIA
  접근성 기본 가드 확립.
- **Phase 7-12**: 갤러리 UX 개선, 키보드 내비게이션 강화, E2E 회귀 커버리지
  추가.
- **Phase 13-20**: 정책/최적화(아이콘 규칙, 애니메이션/휠 이벤트 정비, 콘솔
  가드), 성능 튜닝.
- **Phase 21**: IntersectionObserver 무한 루프 제거, fine-grained signals로
  갤러리 상태 재구성, 부수 효과 최적화.
- **Phase 22**: `constants.ts` 리팩토링으로 상수/타입 일원화 및 코드 37% 감소.
- **Phase 23**: DOMCache 아키텍처 재설계, selector registry 중앙화.
- **Phase 24**: 파일명 kebab-case 일괄 전환 및 lint/test 가드 신설.
- **Phase 25**: 휠 스크롤 배율 제거로 브라우저 기본 동작 위임, 번들 -3 KB.
- **Phase 26**: 파일명 정책을 문서+테스트로 강제, phase별 naming guard 확장.
- **Phase 27**: StorageAdapter 패턴 도입, 서비스/테스트 격리 완성.
- **Phase 28**: 사용자 스크롤과 자동 스크롤 충돌 방지 로직 도입.
- **Phase 29**: Toolbar 포커스 프리뷰와 접근성 안내 추가, 설정/테스트 연동.
- **Phase 30**: Toolbar 포커스 프리뷰 롤백, Phase 28 이전 심플 디자인 복원.
- **Phase 31**: Logger dev/prod 분기 + Babel transform으로 prod 번들 13.95 KB
  절감 (334.68 → 320.73 KB).

## 참고 문서

- `AGENTS.md`
- `docs/ARCHITECTURE.md`
- `docs/CODING_GUIDELINES.md`
- `docs/EVALUATION_TOOLBAR_INDICATOR.md`
- Git 기록 및 Vitest/Playwright 보고서
