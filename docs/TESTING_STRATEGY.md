# 테스트 전략 가이드 (Testing Strategy)

> xcom-enhanced-gallery 프로젝트의 테스트 책임 분리 및 실행 전략

**최종 업데이트**: 2025-10-20

---

## 📊 테스트 피라미드 (Testing Trophy)

Kent C. Dodds의 Testing Trophy 모델 기반 테스트 분포:

```
          /\
         /A11y\        ← 최소: 접근성 자동 검증
        /------\
       /  E2E  \       ← 적음: 핵심 사용자 시나리오
      /----------\
     / Browser    \    ← 소량: Solid.js 반응성, 실제 API
    /--------------\
   /  Integration  \   ← 중간: 서비스 간 상호작용
  /------------------\
 /    Unit Tests     \ ← 많음: 순수 로직, 유틸리티
/----------------------\
/  Static Analysis     \  ← 가장 많음: TypeScript, ESLint, stylelint
```

**원칙**: 낮은 계층에서 빠르게 많이 테스트하고, 높은 계층에서 느리지만 신뢰도
높은 테스트를 선별적으로 실행합니다.

---

## 🎯 테스트 타입별 책임 분리

### 1. Static Analysis (가장 빠름, 수초)

- **도구**: TypeScript strict, ESLint, stylelint, CodeQL
- **책임**: 타입 안정성, 코딩 규칙 위반 감지, 보안 취약점 탐지
- **실행**: `npm run validate` (typecheck + lint + format 일괄)
- **장점**: 즉각적 피드백, CI/pre-commit 자동화 가능
- **단점**: 런타임 동작 검증 불가

### 2. Unit Tests (JSDOM, 1-2분)

- **환경**: Vitest + JSDOM, `test/unit/**`
- **책임**: 순수 함수, 서비스 로직, 컴포넌트 렌더링 (모킹 기반)
- **실행**: `npm run test:unit` (1389 passing)
- **장점**: 빠른 실행, 정확한 원인 파악, 신속한 피드백
- **단점**: JSDOM 제약 (CSS 레이아웃, Solid.js 반응성 제한)

**JSDOM 주요 제약사항**:

- ❌ Solid.js fine-grained reactivity (signal boundary 미수립)
- ❌ 레이아웃 계산 (`getBoundingClientRect()` 항상 0)
- ❌ IntersectionObserver, ResizeObserver (부분 모킹 필요)
- ✅ 적합: 순수 함수, 데이터 변환, 조건부 렌더링, 이벤트 핸들러

### 3. Browser Tests (Vitest + Chromium, 2-5분)

- **환경**: `@vitest/browser` + Playwright Chromium, `test/browser/**`
- **테스트 수**: **60 tests** (Store 반응성 5, 레이아웃 8, 포커스 8, 애니메이션
  9, 이벤트 8 등)
- **책임**: Solid.js 반응성 완전 검증, 실제 브라우저 API, 시각적 동작
- **실행**: `npm run test:browser`
- **장점**: JSDOM 제약 없음, 실제 브라우저 환경, E2E보다 빠름
- **단점**: JSDOM보다 느림, 리소스 사용량 증가

### 4. Integration Tests (JSDOM + 모킹, 2-5분)

- **환경**: Vitest + JSDOM, `test/integration/**`
- **책임**: 다중 서비스 협업, 상태 동기화, API 모킹 기반 데이터 흐름
- **실행**: `npm run test:unit` (통합 포함)
- **장점**: 서비스 경계 검증, 높은 신뢰도, E2E보다 빠름
- **단점**: 복잡한 설정, JSDOM 제약 동일 적용

### 5. E2E Tests (Playwright, 5-15분)

- **환경**: Playwright + Chromium, `playwright/smoke/**`
- **테스트 수**: **44 passed / 1 skipped** (97.8% 통과율)
- **책임**: 핵심 사용자 시나리오, Solid.js 실제 동작, 브라우저 전용 API
- **실행**: `npm run e2e:smoke`
- **장점**: 실제 브라우저 신뢰도, JSDOM 제약 없음, 전체 흐름 검증
- **단점**: 느린 실행, 디버깅 어려움, 복잡한 인프라

**E2E Harness Pattern**:

`playwright/harness/` API로 컴포넌트 마운트/언마운트. Solid.js 반응성 제약으로
Remount 패턴 사용 (자세한 내용: `AGENTS.md` E2E 가이드)

### 6. Accessibility Tests (Playwright + axe-core, 3-8분)

- **환경**: Playwright + `@axe-core/playwright`, `playwright/accessibility/**`
- **테스트 수**: **14 tests** (Gallery 4, Toolbar 6, KeyboardHelpOverlay 4,
  Toast 4)
- **책임**: WCAG 2.1 Level AA 준수, 색상 대비, 키보드 탐색, ARIA 레이블
- **실행**: `npm run e2e:a11y`
- **장점**: 자동화된 접근성 검증, WCAG 준수 보장, CI 통합 가능
- **단점**: 자동 검증 한계 (57% 이슈만 감지), 수동 테스트 필요

**axe-core 주요 태그**: `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`,
`best-practice`

---

## 🚀 실행 전략

### 개발 중 (로컬)

| 단계 | 명령어                                | 소요 시간 | 목적               |
| ---- | ------------------------------------- | --------- | ------------------ |
| 1    | `npm run typecheck`                   | 수초      | 타입 검증          |
| 2    | `npm run test:watch -- -t "테스트명"` | 즉시      | 관련 테스트만 워치 |
| 3    | `npm run test:unit`                   | 1-2분     | 전체 단위+통합     |
| 4    | `npm run test:fast`                   | 30초      | 빠른 단위+스모크   |

### Pre-Push (Git Hook)

```pwsh
# Husky 자동 실행 (기본: smoke 프로젝트, 10-20초)
git push

# 전체 스위트 (5-10분)
 = 'full'
git push
```

### CI (GitHub Actions)

1. `npm run typecheck` → 타입 체크
2. `npm run lint` → ESLint 검증
3. `npm test` → 전체 JSDOM 테스트 (커버리지 포함, Node 22)
4. `npm run test:browser` → 브라우저 테스트 (2개 샤드 병렬)
5. `npm run e2e:smoke` → E2E 스모크 테스트
6. `npm run e2e:a11y` → 접근성 테스트
7. `npm run build` → dev + prod 빌드 검증

**CI 최적화**:

- Node 22 단일 환경 (10-15분 절약)
- 브라우저 테스트 샤딩 (5분 절약)
- Playwright 브라우저 캐싱 (30-60초 절약)
- 예상 총 시간: ~8-10분

---

## 📦 Vitest Projects

`vitest.config.ts`에서 projects로 테스트 분할:

| Project         | 범위                      | 실행 시간 | 명령어                  |
| --------------- | ------------------------- | --------- | ----------------------- |
| **smoke**       | 구성/토큰 가드            | 10-20초   | `npm run test:smoke`    |
| **fast**        | 빠른 단위 (RED/벤치 제외) | 30-60초   | `npm run test:fast`     |
| **unit**        | 전체 단위                 | 1-2분     | `npm run test:unit`     |
| **browser**     | 브라우저 모드             | 2-5분     | `npm run test:browser`  |
| **styles**      | 스타일/토큰/정책          | 20-40초   | `npm run test:styles`   |
| **performance** | 성능/벤치마크             | 40-80초   | `npm run test:perf`     |
| **phases**      | 단계별(phase-\*)          | 1-2분     | `npm run test:phases`   |
| **refactor**    | 리팩토링 가드             | 1-2분     | `npm run test:refactor` |

---

## 🔍 테스트 선택 기준

### JSDOM 단위 테스트 사용

- ✅ 순수 함수 (`utils/`, `helpers/`)
- ✅ 서비스 로직 (API 모킹)
- ✅ 조건부 렌더링 (props → JSX)
- ✅ 이벤트 핸들러 호출 검증

### Browser 테스트 사용

- ✅ Solid.js 반응성 (Signal/Store → DOM)
- ✅ 레이아웃 계산 (크기, 위치)
- ✅ 브라우저 API (IntersectionObserver, ResizeObserver)
- ✅ 애니메이션/트랜지션

### E2E 테스트 사용

- ✅ 핵심 사용자 여정
- ✅ 다중 페이지/컴포넌트 상호작용
- ✅ 실제 네트워크 요청 (필요 시)
- ✅ 브라우저 간 호환성

### 접근성 테스트 사용

- ✅ 모든 사용자 대면 컴포넌트
- ✅ 인터랙티브 요소 (버튼, 링크, 폼)
- ✅ 동적 콘텐츠 (Toast, Modal, Dropdown)
- ⚠️ 수동 검증 병행 (스크린 리더, 고대비 모드)

---

## 📚 참고 문서

- **[AGENTS.md](../AGENTS.md)**: E2E 하네스 패턴, Solid.js 반응성 제약사항
- **[SOLID_REACTIVITY_LESSONS.md](./SOLID_REACTIVITY_LESSONS.md)**: Solid.js
  반응성 시스템 교훈
- **[ARCHITECTURE.md](./ARCHITECTURE.md)**: 3계층 구조 (Features → Shared →
  External)
- **[test/README.md](../test/README.md)**: Vitest 사용법, DOM 시뮬레이션

---

> **테스트 정책**: 새 기능은 반드시 테스트와 함께 제출. TDD 권장 (RED → GREEN →
> REFACTOR).  
> **현재 상태**: 1389 단위 테스트, 60 브라우저 테스트, 44 E2E 테스트, 14 접근성
> 테스트 (100% 통과율) ✅
