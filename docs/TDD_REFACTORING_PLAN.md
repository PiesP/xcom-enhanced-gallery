# TDD 리팩토링 활성 계획

> **최종 업데이트**: 2025-01-27
>
> **브랜치**: main
>
> **상태**: 모든 Phase 완료 ✅

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

현재 진행 중인 Phase가 없습니다.

---

## 다음 Phase 제안

### Phase 33: JavaScript Bundle Analysis (제안)

**목표**: Rollup Visualizer로 JavaScript 번들 분석 및 최적화 기회 탐색

**배경**: Phase 32에서 CSS 최적화만으로는 추가 크기 절감이 불가능함을 발견. 실제
번들 크기는 JavaScript 코드(Solid.js 런타임 + 애플리케이션 코드)에 의해 결정됨.

**제안 작업**:

1. Rollup Visualizer 통합 (`rollup-plugin-visualizer`)
   - 번들 구성 요소별 크기 분석
   - Solid.js 런타임 vs 애플리케이션 코드 비율 파악

2. Tree-shaking 최적화
   - 사용하지 않는 Solid.js 기능 제거
   - 미사용 유틸리티 함수 정리

3. 코드 인라인화
   - 불필요한 추상화 계층 제거
   - 단일 사용 헬퍼 함수 인라인화

4. 동적 import 검토
   - 현재 `inlineDynamicImports: true` 제약 하에서의 최적화 전략
   - Userscript 단일 파일 제약 유지하며 최적화

**예상 효과**: 10-20 KB 추가 절감 가능성 (310 KB 이하 목표)

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
