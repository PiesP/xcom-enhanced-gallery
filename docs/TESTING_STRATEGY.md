# 테스트 전략 가이드 (Testing Strategy)

> xcom-enhanced-gallery 프로젝트의 테스트 책임 분리 및 실행 전략

**최종 업데이트**: 2025-10-29 (Phase 234 간소화)

---

## 📊 테스트 피라미드 (Testing Trophy)

Kent C. Dodds의 Testing Trophy 모델 기반:

```text
          /\
         /A11y\        ← 최소: 접근성 자동 검증 (WCAG 2.1 AA)
        /------\
       /  E2E  \       ← 적음: 핵심 사용자 시나리오 (Playwright)
      /----------\
     / Browser    \    ← 소량: Solid.js 반응성, 실제 API (Vitest + Chromium)
    /--------------\
   /  Integration  \   ← 중간: 서비스 간 상호작용 (JSDOM + 모킹)
  /------------------\
 /    Unit Tests     \ ← 많음: 순수 로직, 유틸리티 (JSDOM)
/----------------------\
/  Static Analysis     \  ← 가장 많음: TypeScript, ESLint, stylelint
/------------------------\
/  Security Analysis    \  ← 기반: CodeQL (보안 취약점 검증)
```

**원칙**: 낮은 계층에서 빠르게 많이 테스트, 높은 계층에서 느리지만 신뢰도 높은
테스트를 선별적으로 실행

---

## 🎯 테스트 타입별 책임 분리

| 타입                    | 환경                  | 책임                                           | 실행 시간 | 명령어                              |
| ----------------------- | --------------------- | ---------------------------------------------- | --------- | ----------------------------------- |
| **Security Analysis**   | CodeQL                | 보안 취약점 (XSS, 인젝션, prototype pollution) | 수초      | `npm run codeql:check` (로컬, 선택) |
| **Static Analysis**     | TS, ESLint            | 타입 안정성, 코딩 규칙 위반                    | 수초      | `npm run validate`                  |
| **Unit Tests**          | JSDOM                 | 순수 함수, 서비스, 컴포넌트 렌더링             | 1-2분     | `npm run test:unit`                 |
| **Browser Tests**       | Vitest + Chromium     | Solid.js 반응성, 레이아웃, Observers, 포커스   | 8-10초    | `npm run test:browser`              |
| **Integration Tests**   | JSDOM + 모킹          | 다중 서비스 협업, 상태 동기화                  | 2-5분     | `npm run test:unit` (포함)          |
| **E2E Tests**           | Playwright            | 핵심 사용자 시나리오, 브라우저 전용 API        | 5-15분    | `npm run e2e:smoke`                 |
| **Accessibility Tests** | Playwright + axe-core | WCAG 2.1 AA 준수, 색상 대비, 키보드 탐색       | 3-8분     | `npm run e2e:a11y`                  |

### 주요 특징 및 제약사항

**JSDOM 제약**:

- ❌ Solid.js fine-grained reactivity (signal boundary 미수립)
- ❌ 레이아웃 계산 (`getBoundingClientRect()` 항상 0)
- ❌ IntersectionObserver, ResizeObserver (부분 모킹 필요)
- ✅ 적합: 순수 함수, 데이터 변환, 조건부 렌더링, 이벤트 핸들러

**Browser Tests 현황** (111 tests):

- Solid.js Reactivity: 16 tests (Signal + Store + Advanced)
- Events: 8 tests (click, keyboard, delegation, preventDefault)
- Focus Management: 8 tests
- Layout APIs: 8 tests
- Animations: 9 tests
- Observers: 16 tests (MutationObserver 9 + ResizeObserver 7)
- Scroll Chaining: 43 tests
- Gallery Features: 3 tests

**E2E Tests 현황**: 82 passed / 5 skipped (94.3% 통과율)

**Accessibility Tests 현황**: 14 tests (Gallery, Toolbar, KeyboardHelpOverlay,
Toast)

---

## 🔍 테스트 선택 기준

| 상황                                 | 추천 테스트 타입        |
| ------------------------------------ | ----------------------- |
| 순수 함수, 유틸리티, 서비스 로직     | **Unit (JSDOM)**        |
| Solid.js 반응성 (Signal/Store → DOM) | **Browser**             |
| 레이아웃 계산, 크기, 위치            | **Browser**             |
| 브라우저 API (Observers, 포커스)     | **Browser**             |
| 애니메이션/트랜지션                  | **Browser**             |
| 다중 서비스 협업, 상태 동기화        | **Integration (JSDOM)** |
| 핵심 사용자 여정                     | **E2E**                 |
| 브라우저 간 호환성                   | **E2E**                 |
| 접근성 (ARIA, 대비, 키보드)          | **Accessibility**       |

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

```bash
# Husky 자동 실행 (기본: smoke 프로젝트, 10-20초)
git push

# 전체 스위트 (5-10분)
export XEG_PREPUSH_SCOPE='full'
git push
```

**범위 선택**:

| 범위    | 용도                | 시간    |
| ------- | ------------------- | ------- |
| `smoke` | 기본값, 빠른 검증   | 20-30초 |
| `fast`  | 주요 단위 테스트    | 30-60초 |
| `unit`  | 전체 단위 테스트    | 1-2분   |
| `full`  | 모든 검증 (PR 권장) | 5-10분  |

### CI (GitHub Actions)

1. `npm run typecheck` → 타입 체크
2. `npm run lint` → ESLint, stylelint, markdownlint 검증
3. `npm test` → 전체 JSDOM 테스트 (커버리지 포함)
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

## 🎯 npm run build vs npm test

| 항목          | npm run build (권장 ⭐)                           | npm test (개발용)          |
| ------------- | ------------------------------------------------- | -------------------------- |
| **실행 범위** | 전체 검증 파이프라인                              | vitest projects 분리       |
| **포함 내용** | typecheck, lint, deps, CodeQL, browser, E2E, a11y | fast + raf-timing projects |
| **신뢰도**    | ✅ 높음 (프로덕션 준비)                           | ⚠️ 낮음 (프로젝트 격리)    |
| **실행 시간** | ~8-10분                                           | ~1-2분                     |
| **용도**      | CI, 릴리즈 검증                                   | 로컬 개발 피드백           |

### 권장 워크플로우

**일반 개발**:

```bash
# 1단계: 기능 개발 중
npm run test:watch -- -t "기능명"  # 1-2초 피드백

# 2단계: PR/리뷰 전 최종 검증
npm run build  # 8-10분, 모든 검증 포함

# 3단계: 커밋 준비
git push  # pre-push hook 자동 실행
```

**버그 수정**:

```bash
npm run test:fast  # 30-60초
npm run build      # 최종 확인
```

**주요 기능 추가**:

```bash
npm run build    # 반드시 통과해야 함
```

---

## 🧩 유저 스크립트 특화 가이드

### 권장 분포 (가이드라인)

```text
           ┌─────────────┐
           │   E2E (5%)   │  ← 실제 X.com 환경 (Playwright 스모크)
           └─────────────┘
         ┌───────────────────┐
         │ Integration (15%) │  ← 브라우저/DOM 상호작용 (브라우저 모드 포함)
         └───────────────────┘
       ┌───────────────────────┐
       │    Unit (60%)         │  ← 순수 로직/서비스/유틸리티
       └───────────────────────┘
     ┌─────────────────────────────┐
     │  Static Analysis (20%)      │  ← 타입/린트/보안
     └─────────────────────────────┘
```

### 유저 스크립트 Do & Don't

✅ **Do**:

- 선택자 상수화: `src/constants.ts`의 `SELECTORS`/`STABLE_SELECTORS` 사용
- 브라우저/GM API 추상화: `@shared/external/vendors`,
  `@shared/external/userscript/adapter` getter 사용
- Fail-fast: 외부 DOM 변경 감지 시 조기 예외 + 폴백 경로
- PC 전용 이벤트만 사용: click, keydown/keyup, wheel, contextmenu (Touch/Pointer
  금지)

❌ **Don't**:

- X.com DOM 셀렉터를 테스트에 하드코딩 (중복)
- GM\_\* 직접 호출 → `getUserscript()` 경유
- E2E 범위 불필요하게 확장 → 스모크로 핵심만 유지
- 실제 다운로드 테스트 → Blob/ZIP 생성까지만

---

## 📚 참고 문서

- **[AGENTS.md](../AGENTS.md)**: E2E 하네스 패턴, Solid.js 반응성 제약사항,
  Pre-push hook 범위 설정
- **[SOLID_REACTIVITY_LESSONS.md](./SOLID_REACTIVITY_LESSONS.md)**: Solid.js
  반응성 시스템 교훈
- **[ARCHITECTURE.md](./ARCHITECTURE.md)**: 3계층 구조 (Features → Shared →
  External)
- **[test/README.md](../test/README.md)**: Vitest 사용법, DOM 시뮬레이션
- **[test/archive/README.md](../test/archive/README.md)**: 아카이브 정책 및 과거
  Phase 기록

---

## 🛡️ 프로젝트 상태 검증

**가드 테스트** (`test/guards/project-health.test.ts`):

프로젝트 상태를 검증하는 최소 가드 테스트:

- 빌드 상태: 번들 크기 339.55 KB (제한 420 KB) ✅
- 아키텍처: 3계층 구조 ✅
- 코딩 규칙: Vendor getter, PC 이벤트, 디자인 토큰 ✅
- 테스트 구조: 필수 폴더 및 파일 ✅
- 서비스 표준화: 로깅 접두사 [ServiceName] ✅
- 회귀 방지: 갑작스러운 번들 크기 증가 감지 ✅

**테스트 아카이브** (`test/archive/`):

완료된 Phase 및 과거 개발 단계의 테스트 보관:

- cleanup-phases/: Phase 1~7 정리 테스트
- integration-behavioral/: 과거 행위 검증 테스트
- integration/: test/integration 아카이브 (Phase 171B)

상세: [test/archive/README.md](../test/archive/README.md)

---

> **테스트 정책**: 새 기능은 반드시 테스트와 함께 제출. TDD 권장 (RED → GREEN →
> REFACTOR).
>
> **현재 상태**: 1389 단위 테스트, 111 브라우저 테스트, 82 E2E 테스트, 14 접근성
> 테스트 (100% 통과율) ✅
>
> **마지막 업데이트**: 2025-10-29 (Phase 234 간소화: 517줄 → 192줄, 63% 감소)
