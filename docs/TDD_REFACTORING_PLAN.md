# TDD 리팩토링 활성 계획

> **최종 업데이트**: 2025-01-27
>
> **브랜치**: feature/phase-33-bundle-analysis
>
> **상태**: Phase 33 진행 중 🚧

## 프로젝트 상태

- **빌드**: dev 831.69 KB / prod 320.73 KB (gzip 87.39 KB) ✅
- **테스트**: 634/659 passing (24 skipped, 1 todo) ✅
- **타입**: 0 errors (TypeScript strict) ✅
- **린트**: 0 warnings ✅
- **의존성**: 0 violations (266 modules, 732 dependencies) ✅

## 참고 문서

- `AGENTS.md`: 개발 환경 및 워크플로
- `docs/TDD_REFACTORING_PLAN_COMPLETED.md`: 완료된 Phase 1-32 기록
- `docs/ARCHITECTURE.md`: 아키텍처 구조
- `docs/CODING_GUIDELINES.md`: 코딩 규칙

---

## 활성 작업

### Phase 33: JavaScript Bundle Analysis 🚧

**목표**: JavaScript 번들 분석 및 최적화로 310 KB 이하 달성 (10 KB 절감)

**배경**: Phase 32에서 CSS 최적화는 이미 한계에 도달. 실제 번들 크기는
JavaScript 코드(Solid.js 런타임 + 애플리케이션)에 의해 결정됨.

**1단계: 번들 분석 도구 통합** ✅

1. ✅ rollup-plugin-visualizer 설치
2. ✅ vite.config.ts에 플러그인 추가 (prod 빌드만)
3. ✅ 번들 구성 시각화 (docs/bundle-analysis.html)
4. ✅ Python 분석 스크립트 작성 (scripts/analyze-bundle.py)

**번들 분석 결과** (Top 20 모듈):

- **전체 크기**: 266.25 KB (Top 20 합계)
  - Solid.js 런타임: 62.78 KB (23.6%)
  - 애플리케이션 코드: 203.47 KB (76.4%)

**주요 최적화 대상**:

1. **solid-js/dist/solid.js** (33.72 KB) - Solid.js 핵심 런타임
2. **media-service.ts** (21.58 KB) - 미디어 추출/처리 로직
3. **solid-js/web/dist/web.js** (21.08 KB) - Solid DOM 렌더러
4. **events.ts** (19.28 KB) - 이벤트 핸들링 유틸리티
5. **Toolbar.tsx** (14.99 KB) - 툴바 컴포넌트
6. **twitter-video-extractor.ts** (13.87 KB) - 트위터 비디오 추출
7. **VerticalImageItem.tsx** (13.80 KB) - 이미지 아이템 컴포넌트
8. **SettingsModal.tsx** (12.73 KB) - 설정 모달
9. **bulk-download-service.ts** (11.87 KB) - 벌크 다운로드
10. **settings-service.ts** (11.63 KB) - 설정 관리

**2단계: 최적화 전략 수립** (진행 예정)

**A. 이벤트 핸들링 최적화** (19.28 KB → 목표 15 KB)

- events.ts의 과도한 추상화 제거
- 사용하지 않는 이벤트 유틸리티 제거
- 인라인 가능한 단순 함수 인라인화

**B. 컴포넌트 코드 최적화** (41.52 KB → 목표 35 KB)

- Toolbar.tsx, VerticalImageItem.tsx, SettingsModal.tsx
- 중복 로직 통합
- Props 전달 패턴 단순화
- 불필요한 memo/effect 제거

**C. 서비스 레이어 최적화** (59.11 KB → 목표 50 KB)

- media-service.ts, twitter-video-extractor.ts, bulk-download-service.ts
- 전략 패턴 과다 사용 재검토
- 팩토리 함수 인라인화
- 미사용 추출 전략 제거

**D. Solid.js 런타임 최적화** (62.78 KB - 현재 유지)

- 현재 필요 최소 수준
- createSignal, createStore, createMemo만 사용
- 추가 최적화 불가

**예상 효과**:

- 이벤트 4 KB + 컴포넌트 6.5 KB + 서비스 9 KB = **19.5 KB 절감**
- 목표: 320.73 KB → **301 KB 이하** (19.5 KB 절감)

---

## 최근 완료 Phase

### Phase 32: CSS Optimization Analysis (2025-01-27) ✅

**초기 목표**: 320.73 KB → 290-300 KB (CSS 중복 제거)

**핵심 발견**:

- PostCSS + Terser가 이미 aggressive minification 수행
- CSS 중복은 빌드 시점에 자동 제거됨
- 실제 번들 크기는 **JavaScript 코드**가 결정

**성과**:

- ✅ CSS 중복 분석 도구 확보 (`test/styles/css-optimization.test.ts`)
- ✅ 빌드 최적화 메커니즘 이해
- ✅ Phase 33 방향성 도출 (JavaScript 레벨 접근 필요)

**결론**: CSS 최적화는 유지보수 품질 향상에 기여하나, 번들 크기 절감은
JavaScript 레벨 접근 필요.

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

**현재 프로젝트는 안정 상태입니다. Phase 1-32 모두 완료되었으며, 다음 작업이
필요하면 새로운 Phase를 계획하세요.**
