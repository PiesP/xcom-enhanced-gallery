# 테스트 전략 가이드 (Testing Strategy)

> xcom-enhanced-gallery 프로젝트의 테스트 책임 분리 및 실행 전략

**최종 업데이트**: 2025-10-25 (Phase 170B+ 테스트 통합)

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

## 🧩 유저 스크립트 특화 테스트 피라미드 (X.com)

> 유저 스크립트는 일반 웹앱과 달리 “외부 DOM/브라우저 API 의존 + 실제 환경
> 중요성”이 크므로, 아래 가이드를 기본 테스트 전략 위에 얹어 적용합니다.

### 고려사항

- 외부 DOM 의존성: X.com DOM 구조 변경에 취약 → 선택자 추상화와 Fail-fast 필요
- 브라우저 API 의존성: GM\_\*, localStorage, fetch 등 → Userscript/Vendor
  getter로 주입
- 사용자 인터랙션 중심: 클릭, 키보드 입력 위주 → PC 전용 이벤트 정책 준수
- 실제 환경 중요성: 프로덕션에서만 드러나는 이슈 존재 → 최소한의 E2E 스모크 유지

### 권장 분포(가이드라인)

```
           ┌─────────────┐
           │   E2E (5%)   │  ← 실제 X.com 환경 (Playwright 스모크)
           └─────────────┘
         ┌───────────────────┐
         │ Integration (15%) │  ← 브라우저/DOM 상호작용 중심(브라우저 모드 포함)
         └───────────────────┘
       ┌───────────────────────┐
       │    Unit (60%)         │  ← 순수 로직/서비스/유틸리티
       └───────────────────────┘
     ┌─────────────────────────────┐
     │  Static Analysis (20%)      │  ← 타입/린트/보안
     └─────────────────────────────┘
```

이 분포는 “테스트 비용/신뢰도/유지보수성” 균형을 위한 목표치입니다. 실제 비율은
시점별로 달라질 수 있으나, 상위 레이어(E2E) 의존도 증가는 가급적 피하고 하위
레이어(Unit/Static)을 두텁게 유지합니다.

### 레이어별 메모(유저 스크립트 관점)

- Static Analysis: `npm run typecheck` / `npm run lint` / `npm run codeql:check`
  - DOM/벤더/GM API를 직접 import하지 않고 getter 경유하는지 규칙 검증(CodeQL
    포함)
- Unit: `npm run test:unit` (JSDOM)
  - 서비스/유틸/파일명/파서 등 순수 로직에 집중, 브라우저/GM API는 반드시 모킹
- Integration: `npm run test:browser`(브라우저 모드) 또는 JSDOM 통합
  - Solid 반응성·레이아웃·포커스·애니메이션 등 JSDOM 한계를 브라우저 모드로 보완
- E2E: `npm run e2e:smoke` (+ 접근성: `npm run e2e:a11y`)
  - 핵심 경로만 유지, X.com DOM 변경에 취약하므로 스모크 수준으로 관리

### 유저 스크립트 특화 Do & Don’t

✅ Do

- 선택자 상수화/추상화: `src/constants.ts`의 `SELECTORS`/`STABLE_SELECTORS` 사용
- 브라우저/GM API 추상화:
  `@shared/external/vendors`/`@shared/external/userscript/adapter`의 getter 사용
  - 예: `const us = getUserscript(); await us.download(url, name)`
- Fail-fast: 외부 DOM 변경 감지 시 조기 예외 + 폴백 경로, 로깅/토스트로 가시화
- PC 전용 이벤트만 사용: 키다운/클릭/휠 등 허용 목록 준수 (Touch/Pointer 금지)

❌ Don’t

- X.com 내부 DOM 셀렉터를 테스트 전반에 하드코딩(중복)하지 말 것 → 상수/헬퍼
  경유
- GM\_\*를 코드/테스트에서 직접 호출하지 말 것 → `getUserscript()` 경유
- E2E 범위를 불필요하게 확장하지 말 것 → 스모크로 핵심 경로만 유지
- 실제 다운로드를 테스트에서 수행하지 말 것 → Blob 생성/ZIP 작성까지로 한정

### 참고: 테스트 예시 매핑

- 파일명/정규화/파서/CRC/포맷팅 → Unit (모킹 100%)
- 미디어 추출 플로우/컴포넌트 렌더링/키 이벤트 → Integration(JSDOM) 또는 Browser
  모드
- 갤러리 오픈/네비게이션/툴바 표시 → E2E 스모크(실제 X.com 환경, 하네스 API
  참조)
- 접근성(ARIA/대비/포커스) → Playwright + axe-core (`e2e:a11y`)

> 자세한 하네스/반응성 제한/Remount 패턴은 `AGENTS.md`의 E2E 테스트 가이드와
> `playwright/harness/*`를 참고하세요.

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

### 3. Browser Tests (Vitest + Chromium, 5-10분)

- **환경**: `@vitest/browser` + Playwright Chromium, `test/browser/**`
- **테스트 수**: **111 tests** (현재 상태)
  - Solid.js Reactivity: 16 tests (Signal + Store + Advanced)
  - Events: 8 tests (click, keyboard, delegation, preventDefault)
  - Focus Management: 8 tests (포커스 이동, 트래핑, 복원)
  - Layout APIs: 8 tests (getBoundingClientRect, 크기, 가시성)
  - Animations: 9 tests (CSS 트랜지션, 애니메이션, RAF)
  - Observers: 16 tests (MutationObserver 9 + ResizeObserver 7)
  - Scroll Chaining: 43 tests (체이닝 방지, 동시 입력, 리사이즈, 애니메이션)
  - Gallery Features: 3 tests (이미지 핏 모드)

- **책임**:
  - Solid.js fine-grained reactivity 완전 검증
  - 실제 브라우저 API 동작 (레이아웃, Observers, 포커스)
  - PC 전용 이벤트 정책 검증 (click, keydown, wheel만 사용)
  - 브라우저 특화 기능 (스크롤, 애니메이션, 포커스 관리)

- **실행**:

  ```bash
  npm run test:browser        # 전체 (111 tests, ~8-10초)
  npm run test:browser:ui     # 디버깅 UI
  ```

- **장점**:
  - JSDOM 제약 없음 (완전한 Solid.js 반응성)
  - 실제 브라우저 환경 (레이아웃, 이벤트, 포커스)
  - E2E보다 빠르고 유지보수 용이

- **단점**:
  - JSDOM보다 느림 (~8-10초 vs ~1-2초)
  - 시스템 리소스 사용

- **파일 구조**: `test/browser/` 참고

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

```bash
# Husky 자동 실행 (기본: smoke 프로젝트, 10-20초)
git push

# 전체 스위트 (5-10분)
export XEG_PREPUSH_SCOPE='full'
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

## 🎯 npm run build vs npm test: 우선순위 가이드 (2025-10-24 추가)

### 📌 개요

프로젝트는 **2가지 검증 방식**을 제공합니다:

1. **`npm run build`** (권장 ⭐): 프로덕션 검증 파이프라인
2. **`npm test`** (개발 편의용): Vitest projects 분리 실행

### 📊 상세 비교

| 항목          | npm run build                                     | npm test                   | 권장 상황 |
| ------------- | ------------------------------------------------- | -------------------------- | --------- |
| **실행 범위** | 전체 검증 파이프라인                              | vitest projects 분리       |           |
| **포함 내용** | typecheck, lint, deps, CodeQL, browser, E2E, a11y | fast + raf-timing projects |           |
| **신뢰도**    | ✅ 높음 (프로덕션 준비)                           | ⚠️ 낮음 (프로젝트 격리)    |           |
| **실행 시간** | ~8-10분                                           | ~1-2분 (fast만 시)         |           |
| **용도**      | CI, 릴리즈 검증                                   | 로컬 개발 피드백           |           |
| **실패 영향** | 배포 차단                                         | 개발 속도 영향             |           |

### 🔍 상세 설명

#### **npm run build** (권장 - 신뢰도 최우선)

**포함 검증**:

- ✅ TypeScript strict mode (`npm run typecheck`)
- ✅ ESLint, stylelint (`npm run lint`)
- ✅ 의존성 검증 (`dependency-cruiser` - 0 violations)
- ✅ 보안 분석 (`CodeQL` - 5개 custom queries)
- ✅ 브라우저 테스트 (Vitest + Chromium, 14 파일 111 테스트)
- ✅ E2E 스모크 테스트 (Playwright, 97 테스트 중 89 통과 권장)
- ✅ 접근성 테스트 (axe-core, 34 테스트)

**결과**:

- 빌드 크기 검증: 339.65 KB (제한: 420 KB)
- 산출물 무결성 검증
- 프로덕션 준비 완료 판정

**사용 시나리오**:

- ✅ CI/CD 파이프라인 (GitHub Actions)
- ✅ 배포 전 최종 검증
- ✅ 주요 기능 완료 후 품질 보장
- ✅ 빌드 크기 추적

#### **npm test** (개발 편의 - 빠른 피드백)

**실행 방식**:

```bash
npm test  # = vitest --project fast run && npm run test:raf
```

**특징**:

- fast 프로젝트: 주요 단위 테스트 (빠름, ~30-60초)
- raf-timing 프로젝트: RAF/포커스 테스트 (격리)
- vitest projects 분리로 인한 환경 단편화

**제약사항**:

- ⚠️ 프로덕션 E2E 검증 미포함 (하네스 기반만)
- ⚠️ 접근성 자동 검증 미포함
- ⚠️ 빌드 크기 검증 미포함
- ⚠️ 일부 테스트는 프로젝트 격리로 인해 상태 이상 가능

**사용 시나리오**:

- ✅ 개발 중 신속한 피드백 (단위 테스트만)
- ✅ 특정 기능 검증 (빠른 반복)
- ✅ 로컬 개발 사이클

### 💡 개발자 가이드 (추천 워크플로우)

#### **일반적인 개발**

```bash
# 1단계: 기능 개발 중 신속한 피드백
npm run test:watch -- -t "기능명"  # 1-2초 피드백

# 2단계: PR/리뷰 전 최종 검증
npm run build  # 8-10분, 모든 검증 포함

# 3단계: 커밋 준비
git push  # pre-push hook: npm run test:smoke만 자동 실행
```

#### **버그 수정**

```bash
# 빠른 검증 → 전체 검증
npm run test:fast  # 30-60초
npm run build      # 최종 확인
```

#### **주요 기능 추가**

```bash
# 철저한 검증 필요
npm run build    # 반드시 통과해야 함
git push -u origin feature/...
```

### ⚠️ 주의사항

1. **npm test 실패 ≠ 배포 불가**
   - npm run build 통과면 프로덕션 준비 완료
   - npm test는 개발 편의용으로만 취급

2. **CI 정책**
   - CI에서는 `npm run build` 통과 필수
   - 모든 검증(E2E, a11y)을 자동화

3. **로컬 개발**
   - npm test로 빠른 피드백
   - 최종 커밋 전 `npm run build` 확인 권장

---

## 📚 참고 문서

- **[AGENTS.md](../AGENTS.md)**: E2E 하네스 패턴, Solid.js 반응성 제약사항
- **[SOLID_REACTIVITY_LESSONS.md](./SOLID_REACTIVITY_LESSONS.md)**: Solid.js
  반응성 시스템 교훈
- **[ARCHITECTURE.md](./ARCHITECTURE.md)**: 3계층 구조 (Features → Shared →
  External)
- **[test/README.md](../test/README.md)**: Vitest 사용법, DOM 시뮬레이션
- **[test/archive/README.md](../test/archive/README.md)**: 아카이브 정책 및 과거
  Phase 기록

---

## 🛡️ 프로젝트 상태 검증 (Phase 170B+)

### 가드 테스트 (test/guards/project-health.test.ts)

현재 프로젝트 상태를 검증하는 최소 가드 테스트입니다:

```bash
# 실행 방법
npx vitest run test/guards/

# 또는 전체 테스트의 일부로
npm test
```

**검증 항목**:

1. **빌드 상태**: 번들 크기 339.55 KB (제한 420 KB) ✅
2. **아키텍처**: 3계층 구조 (Features → Shared → External) ✅
3. **코딩 규칙**: Vendor getter, PC 이벤트, 디자인 토큰 ✅
4. **테스트 구조**: 필수 폴더 및 파일 존재 확인 ✅
5. **서비스 표준화**: 로깅 접두사 [ServiceName] ✅
6. **회귀 방지**: 갑작스러운 번들 크기 증가 감지 ✅

### 테스트 아카이브 (test/archive/)

**정책**: 완료된 Phase 및 과거 개발 단계의 테스트는 test/archive에서 일괄 관리

**폴더 구조**:

```
test/archive/
  ├── cleanup-phases/           # Phase 1~7 정리 테스트
  ├── integration-behavioral/   # 과거 행위 검증 테스트
  └── integration/              # test/integration 아카이브 (Phase 171B)
```

**포함 항목**:

- **cleanup-phases/**: Phase 1~7 정리 테스트
  - 사용하지 않는 코드 제거, 네이밍 정리 등 과거 단계
- **integration-behavioral/**: 과거 행위 검증 테스트
  - `user-interactions-fixed.test.ts`: Mock 기반 사용자 상호작용 (비효율적 패턴)
  - `toolbar-visibility-fix.test.ts`: 문자열 기반 CSS 검증 (실제 적용 미검증)
- **integration/**: test/integration 구식 테스트 (Phase 171B 이동)
  - `bundle-vendor-tdz.test.ts`: TDD RED 단계 (Phase 170B+ 해결)
  - `extension.integration.test.ts`: Placeholder 테스트
  - `master-test-suite.test.ts`: Phase 4 완료 마커
  - `vendor-tdz-resolution.test.ts`: TDD GREEN 단계 (Phase 170B 해결)

**이유**:

- 현재 Phase 170B+ 상태에 비효율적 또는 불필요함
- 유지보수 부담 감소, 프로젝트 구조 간결화
- CI 부하 최소화 (불필요한 테스트 제외)
- 참고용 자료로 활용 (과거 이슈 추적, 테스트 패턴 개선 영감)

**상태**: CI/로컬 테스트에서 제외, 각 폴더 README.md와 함께 참고용 보관

**복원**: 필요시 [test/archive/README.md](../test/archive/README.md) 참고

---

> **테스트 정책**: 새 기능은 반드시 테스트와 함께 제출. TDD 권장 (RED → GREEN →
> REFACTOR). **현재 상태**: 1389 단위 테스트, 60 브라우저 테스트, 44 E2E 테스트,
> 14 접근성 테스트 (100% 통과율) ✅ **마지막 업데이트**: 2025-10-25 (가드
> 테스트, 아카이브 정책, 행위 테스트 아카이브화, performance 아카이브 추가)

```

```
