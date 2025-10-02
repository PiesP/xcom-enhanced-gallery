# TDD 리팩토링 활성 계획

본 문서는 복잡한 구현/구조를 간결하고 현대적으로 재구축하기 위한 리팩토링
Epic들을 관리합니다. 완료된 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md`로
이관하여 히스토리를 분리합니다.

**최근 업데이트**: 2025-10-02 — Epic THEME-ICON-UNIFY-001 추가 (라이트/다크 테마
통일 + 툴바 아이콘 개선)

---

## 1. 운영 원칙

- 코딩/스타일/입력/벤더 접근/테스트 규칙: `docs/CODING_GUIDELINES.md`,
  `docs/vendors-safe-api.md`
- 실행/CI/빌드 파이프라인: `AGENTS.md`
- 아키텍처 설계: `docs/ARCHITECTURE.md`
- 본 문서: 활성 Epic/작업과 Acceptance 중심

---

## 2. 활성 Epic 현황

### **Epic THEME-ICON-UNIFY-001**: 테마 색상 통일 및 툴바 아이콘 개선

**우선순위**: HIGH **난이도**: M (Medium) **예상 소요**: 4-6 days

**목표**:

1. 라이트/다크 테마 간 색상 일관성 확보 (Toolbar, Settings, Toast, Gallery)
2. 툴바 아이콘의 시각적 개선 및 디자인 토큰 기반 통일

**배경**:

- 현재 3계층 토큰 시스템(Primitive → Semantic → Component)은 구축되어 있으나,
  일부 컴포넌트에서 테마별 색상 정의가 불완전함
- 툴바 아이콘(10개 CORE 아이콘)이 Tabler Icons 기반이지만, 시각적 일관성 및
  stroke-width/크기 최적화 여지 있음
- 기존 테스트 커버리지를 유지하면서 점진적 개선 필요

---

### Phase A: 테마 토큰 완전성 검증 및 확장

**목표**: 모든 UI 컴포넌트가 라이트/다크 테마에서 디자인 토큰만 사용하도록 보장

#### A-1: 테마별 색상 토큰 검증 테스트 (RED)

**파일**: `test/design/theme-token-completeness.red.test.ts`

```typescript
describe('Theme Token Completeness', () => {
  it('모든 semantic 색상 토큰이 라이트/다크 테마에서 정의되어야 함', () => {
    // primitive, semantic 토큰 파싱
    // data-theme="light", data-theme="dark", prefers-color-scheme: dark 확인
    // 누락된 토큰 리포트
  });

  it('Toolbar 컴포넌트가 하드코딩 색상을 사용하지 않아야 함', () => {
    // Toolbar.module.css 스캔
    // rgb(), rgba(), #hex 패턴 검출
  });

  it('SettingsModal 컴포넌트가 하드코딩 색상을 사용하지 않아야 함', () => {
    // SettingsModal.module.css 스캔
  });

  it('Toast 컴포넌트가 하드코딩 색상을 사용하지 않아야 함', () => {
    // Toast.module.css 스캔
  });
});
```

**Acceptance**:

- ✅ 테스트 실패 (누락 토큰/하드코딩 검출)
- ✅ 타입 체크 통과
- ✅ 린트 통과

#### A-2: 누락된 테마 토큰 정의 (GREEN)

**파일**: `src/shared/styles/design-tokens.semantic.css`

```css
/* [data-theme="light"] 블록 확장 */
[data-theme='light'] {
  --color-bg-primary: var(--color-base-white);
  --color-bg-secondary: var(--color-gray-50);
  --color-text-primary: var(--color-base-black);
  --color-border-primary: var(--color-gray-200);
  --xeg-bg-toolbar: var(--color-base-white);
  /* Toolbar 전용 토큰 */
  --xeg-toolbar-bg: var(--color-base-white);
  --xeg-toolbar-border: var(--color-gray-200);
  --xeg-toolbar-shadow: var(--shadow-md);
  /* Settings 전용 토큰 */
  --xeg-settings-bg: var(--color-base-white);
  --xeg-settings-border: var(--color-gray-200);
  /* Toast 전용 토큰 */
  --xeg-toast-bg-info: var(--color-blue-50);
  --xeg-toast-bg-success: var(--color-green-50);
  --xeg-toast-bg-warning: var(--color-yellow-50);
  --xeg-toast-bg-error: var(--color-red-50);
}

/* [data-theme="dark"] 블록 확장 */
[data-theme='dark'] {
  --color-bg-primary: var(--color-gray-900);
  --color-bg-secondary: var(--color-gray-800);
  --color-text-primary: var(--color-base-white);
  --color-border-primary: var(--color-gray-700);
  --xeg-bg-toolbar: var(--color-gray-800);
  /* Toolbar 전용 토큰 (다크) */
  --xeg-toolbar-bg: var(--color-gray-800);
  --xeg-toolbar-border: var(--color-gray-700);
  --xeg-toolbar-shadow: 0 4px 12px var(--color-black-alpha-30);
  /* Settings 전용 토큰 (다크) */
  --xeg-settings-bg: var(--color-gray-800);
  --xeg-settings-border: var(--color-gray-700);
  /* Toast 전용 토큰 (다크) */
  --xeg-toast-bg-info: var(--color-gray-700);
  --xeg-toast-bg-success: var(--color-gray-700);
  --xeg-toast-bg-warning: var(--color-gray-700);
  --xeg-toast-bg-error: var(--color-gray-700);
}

/* prefers-color-scheme: dark 지원 */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    --color-bg-primary: var(--color-gray-900);
    --color-bg-secondary: var(--color-gray-800);
    --color-text-primary: var(--color-base-white);
    --color-border-primary: var(--color-gray-700);
    --xeg-bg-toolbar: var(--color-gray-800);
    --xeg-toolbar-bg: var(--color-gray-800);
    --xeg-toolbar-border: var(--color-gray-700);
    --xeg-toolbar-shadow: 0 4px 12px var(--color-black-alpha-30);
    /* 이하 동일 패턴 적용 */
  }
}
```

**Acceptance**:

- ✅ A-1 테스트 통과
- ✅ 타입 체크 통과
- ✅ 빌드 성공

#### A-3: 하드코딩 색상 제거 및 토큰 사용 (REFACTOR)

**대상 파일**:

- `src/shared/components/ui/Toolbar/Toolbar.module.css`
- `src/shared/components/ui/SettingsModal/SettingsModal.module.css`
- `src/shared/components/ui/Toast/Toast.module.css`

**변경 예시** (Toolbar.module.css):

```css
/* Before */
.galleryToolbar {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* After */
.galleryToolbar {
  background: var(--xeg-toolbar-bg);
  border: 1px solid var(--xeg-toolbar-border);
  box-shadow: var(--xeg-toolbar-shadow);
}
```

**Acceptance**:

- ✅ A-1 테스트 100% 통과
- ✅ 기존 컴포넌트 테스트 회귀 없음
- ✅ 빌드 검증 통과

#### A-4: Graduation 및 시각적 검증 (DOCUMENT)

**작업**:

- `theme-token-completeness.red.test.ts` → `theme-token-completeness.test.ts`
  리네임
- 스크린샷 또는 시각적 회귀 테스트 추가 (선택 사항)

**Acceptance**:

- ✅ RED 파일 제거
- ✅ 전체 테스트 스위트 GREEN
- ✅ Completed 로그 업데이트

---

### Phase B: 툴바 아이콘 디자인 개선

**목표**: 툴바 아이콘의 시각적 일관성 향상 및 디자인 토큰 기반 크기/stroke
표준화

#### B-1: 아이콘 디자인 명세 테스트 (RED)

**파일**: `test/design/icon-design-consistency.red.test.ts`

```typescript
describe('Icon Design Consistency', () => {
  it('모든 CORE 아이콘이 동일한 stroke-width를 사용해야 함', () => {
    // iconRegistry CORE_ICONS 순회
    // 각 아이콘 SVG의 stroke-width 속성 확인
    // var(--xeg-icon-stroke-width) 또는 일관된 값 검증
  });

  it('모든 CORE 아이콘이 24x24 viewBox를 사용해야 함', () => {
    // SVG viewBox="0 0 24 24" 검증
  });

  it('아이콘 크기 토큰이 semantic layer에 정의되어야 함', () => {
    // --size-icon-sm, --size-icon-md, --size-icon-lg 존재 확인
  });

  it('Toolbar에서 사용하는 아이콘이 --size-icon-md를 사용해야 함', () => {
    // Toolbar.module.css 또는 Icon.module.css 스캔
  });
});
```

**Acceptance**:

- ✅ 테스트 실패 (불일치 검출)
- ✅ 타입 체크 통과

#### B-2: 아이콘 디자인 토큰 통일 (GREEN)

**파일**: `src/shared/styles/design-tokens.semantic.css`

```css
:root {
  /* 아이콘 크기 토큰 (이미 존재, 확인 및 보강) */
  --size-icon-sm: 16px;
  --size-icon-md: 20px;
  --size-icon-lg: 24px;

  /* 아이콘 stroke-width 토큰 */
  --xeg-icon-stroke-width: 2;
  --xeg-icon-stroke-width-light: 1.5;
  --xeg-icon-stroke-width-bold: 2.5;

  /* 아이콘 색상 토큰 (semantic) */
  --xeg-icon-color: currentColor;
  --xeg-icon-color-hover: var(--color-primary);
  --xeg-icon-color-disabled: var(--color-gray-400);
}
```

**파일**: `src/shared/components/ui/Icon/Icon.tsx`

```typescript
// stroke-width 속성이 토큰을 사용하도록 확인
<svg
  stroke-width="var(--xeg-icon-stroke-width)"
  // ...
>
```

**Acceptance**:

- ✅ B-1 테스트 통과
- ✅ 기존 아이콘 렌더링 회귀 없음

#### B-3: 아이콘 시각적 개선 (REFACTOR)

**대상**: `src/shared/components/ui/Icon/icons/`

**작업**:

1. 각 CORE 아이콘의 SVG path 최적화
   - stroke-linecap="round", stroke-linejoin="round" 일관성 확인
   - 불필요한 path 제거
2. 아이콘별 시각적 밸런스 조정
   - ChevronLeft/Right: 화살표 각도 통일
   - Download: 아이콘 크기/위치 조정
   - Settings: 톱니바퀴 치밀도 균일화

**Acceptance**:

- ✅ B-1 테스트 100% 통과
- ✅ 시각적 일관성 확인 (수동 또는 스크린샷)
- ✅ 빌드 검증 통과

#### B-4: Graduation 및 문서화 (DOCUMENT)

**작업**:

- `icon-design-consistency.red.test.ts` → `icon-design-consistency.test.ts`
  리네임
- 아이콘 디자인 가이드라인 문서 추가 (선택 사항)

**Acceptance**:

- ✅ RED 파일 제거
- ✅ 전체 테스트 스위트 GREEN
- ✅ Completed 로그 업데이트

---

### Phase C: 통합 검증 및 최적화

**목표**: 테마 전환 성능 최적화 및 전체 시스템 통합 테스트

#### C-1: 테마 전환 성능 테스트 (RED)

**파일**: `test/integration/theme-switching-performance.red.test.ts`

```typescript
describe('Theme Switching Performance', () => {
  it('테마 전환 시 50ms 이내에 완료되어야 함', () => {
    // data-theme="light" → "dark" 전환
    // requestAnimationFrame 타이밍 측정
    // 성능 기준 검증
  });

  it('테마 전환 시 레이아웃 리플로우가 최소화되어야 함', () => {
    // Performance Observer 사용
    // layout thrashing 검출
  });

  it('모든 컴포넌트가 테마 전환에 반응해야 함', () => {
    // Toolbar, Settings, Toast, Gallery 렌더링 확인
  });
});
```

**Acceptance**:

- ✅ 테스트 실패 (성능 기준 미달 또는 문제 검출)

#### C-2: CSS 변수 최적화 (GREEN)

**파일**: `src/shared/styles/design-tokens.semantic.css`

**작업**:

1. 중복 토큰 제거
2. 계층 간 참조 최적화 (primitive → semantic → component)
3. 불필요한 계산 제거

**Acceptance**:

- ✅ C-1 테스트 통과
- ✅ 빌드 크기 증가 없음 (<5% 허용)

#### C-3: 접근성 검증 (REFACTOR)

**파일**: `test/accessibility/theme-contrast.red.test.ts`

```typescript
describe('Theme Contrast Accessibility', () => {
  it('라이트 테마의 모든 텍스트가 WCAG AA 대비율을 만족해야 함', () => {
    // 토큰 기반 대비율 계산
    // 4.5:1 이상 검증
  });

  it('다크 테마의 모든 텍스트가 WCAG AA 대비율을 만족해야 함', () => {
    // 동일 검증
  });

  it('고대비 모드에서 추가 토큰이 정의되어야 함', () => {
    // @media (prefers-contrast: high) 검증
  });
});
```

**Acceptance**:

- ✅ 테스트 통과
- ✅ WCAG 2.1 AA 준수

#### C-4: Epic 완료 및 문서화 (DOCUMENT)

**작업**:

- 모든 RED 파일 Graduation
- Phase A/B/C 요약을 `TDD_REFACTORING_PLAN_COMPLETED.md`로 이관
- 메트릭 수집 (변경 파일 수, 토큰 개수, 테스트 커버리지)

**Acceptance**:

- ✅ 전체 테스트 스위트 GREEN
- ✅ `npm run validate` 통과
- ✅ 빌드 검증 통과
- ✅ Completed 로그 1줄 요약: "Epic THEME-ICON-UNIFY-001 — 테마 토큰 완성 +
  아이콘 디자인 개선 (4 phases, X files changed)"

---

### 솔루션 선택 근거 및 트레이드오프

#### 선택: Option 2 (테마 토큰 확장 + 아이콘 디자인 개선)

**장점**:

1. ✅ **TDD 가능성**: 각 Phase가 RED→GREEN→REFACTOR 사이클을 따름
2. ✅ **점진적 개선**: 기존 시스템을 깨뜨리지 않고 확장
3. ✅ **테스트 커버리지 유지**: 기존 테스트 유지하면서 새 가드 추가
4. ✅ **재사용성**: 3계층 토큰 시스템을 최대한 활용
5. ✅ **낮은 리스크**: 토큰 추가/확장만으로 구현 가능

**단점**:

1. ⚠️ **아이콘 재설계 시간**: 10개 CORE 아이콘 시각적 조정 필요 (2-3일 예상)
2. ⚠️ **회귀 테스트**: 테마 전환 관련 기존 테스트 업데이트 필요
3. ⚠️ **성능 측정**: Phase C의 성능 테스트 구현이 복잡할 수 있음

**비교**:

- **Option 1** (토큰만 확장): 아이콘 개선 없이 빠르게 완료 가능하지만, 사용자
  체감 개선 제한적
- **Option 3** (전면 재설계): 완전한 리뉴얼이지만 리스크가 높고 6주+ 소요 예상

---

### 예상 일정

| Phase                 | 예상 소요 | 누적   |
| --------------------- | --------- | ------ |
| A-1~A-4 (테마 토큰)   | 2 days    | 2d     |
| B-1~B-4 (아이콘 개선) | 2 days    | 4d     |
| C-1~C-4 (통합 검증)   | 1.5 days  | 5.5d   |
| 버퍼 (리뷰/수정)      | 0.5 days  | **6d** |

---

### 의존성 및 전제조건

**전제조건**:

- ✅ 3계층 토큰 시스템 구축 완료 (Epic CSS-TOKEN-UNIFY-001)
- ✅ SolidJS 네이티브 패턴 마이그레이션 완료 (Epic SOLID-NATIVE-002)
- ✅ iconRegistry + 프리로드 시스템 구현 완료 (ICN-R5)

**차단 요소**:

- ❌ 없음 (독립적 Epic)

**병행 가능**:

- ✅ Epic RED-TEST-003~006 (테스트 안정화)
- ✅ Epic SECURITY-HARDENING-001 (보안 강화) — 다른 레이어

---

### LOW 우선순위 (백로그)

#### **Epic RED-TEST-003~006**: 나머지 RED 테스트 해결

**후보 작업** (백로그에서 승격 예정):

- RED-TEST-003: Service Diagnostics 통합 (3개 파일)
- RED-TEST-004: Signal Selector 최적화 유틸리티 (1개 파일, 17개 테스트)
- RED-TEST-005: CSS 통합 및 토큰 정책 (4개 파일)
- RED-TEST-006: 테스트 인프라 개선 (5개 파일)

**예상 난이도**: S-M (Small to Medium) **예상 소요**: 3-5 days (total)

---

## 3. 최근 완료 Epic

- **Epic SERVICE-SIMPLIFY-001** (2025-10-02): 서비스 아키텍처 간소화
  - Phase 1-5 완료 (CoreService 단순화, AppContainer DI, 진단 도구 통합)
  - 세부 내용: `TDD_REFACTORING_PLAN_COMPLETED.md`
- **Epic SOLID-NATIVE-002** (2025-10-02): SolidJS 네이티브 패턴 완전
  마이그레이션
  - Phase G-3-1~3 완료 (toolbar/download/gallery signals)
  - 세부 내용: `TDD_REFACTORING_PLAN_COMPLETED.md`
- **Epic DESIGN-MODERN-001** (2025-10-02): 디자인 시스템 현대화
  - Phase A (Animation 통합), Phases B-D (기구현 확인) 완료
  - 세부 내용: `TDD_REFACTORING_PLAN_COMPLETED.md`
- **Epic CSS-TOKEN-UNIFY-001** (2025-01-23): CSS 토큰 시스템 정리
  - Phase A/B/C 완료 (하드코딩 값 제거, 3-layer 토큰 시스템)
  - 세부 내용: `TDD_REFACTORING_PLAN_COMPLETED.md`
- **Epic ARCH-SIMPLIFY-001** (2025-10-02): 아키텍처 복잡도 간소화
  - Phase A/B/C/D 완료
  - 세부 내용: `TDD_REFACTORING_PLAN_COMPLETED.md`

---

## 4. TDD 워크플로

1. **RED**: 실패 테스트 추가 (최소 명세)
2. **GREEN**: 최소 변경으로 통과
3. **REFACTOR**: 중복 제거/구조 개선
4. **Rename**: `.red.` 파일명 제거 → 가드 전환
5. **Document**: Completed 로그에 1줄 요약

**품질 게이트**:

- ✅ `npm run typecheck` (strict 오류 0)
- ✅ `npm run lint:fix` (자동 수정 적용)
- ✅ `npm test` (해당 Phase GREEN)
- ✅ `npm run build:dev` (산출물 검증 통과)

---

## 5. 추론 기반 우선순위 산정

### 보안 (SECURITY-HARDENING-001) - **HIGH**

**선택 이유**:

- CodeQL 29건 이슈는 실제 보안 위협
- Prototype pollution은 사용자 설정 공격 가능
- URL sanitization 부족은 XSS 가능성
- 빠른 수정 가능 (2-3 days)

**트레이드오프**:

- ⚠️ 유틸리티 계층 도입으로 기존 코드 수정 필요
- ✅ 재사용 가능한 가드로 장기적 이득

---

### 테스트 안정화 (RED-TEST-001, 002) - **HIGH**

**선택 이유**:

- 테스트 실패는 CI 차단 및 개발 속도 저하
- 50-86% 통과 상태로 완료 가능성 높음
- 다른 Epic 작업의 전제 조건

**트레이드오프**:

- ⚠️ JSDOM 환경 이슈는 근본 원인 파악 필요
- ✅ 테스트 안정성 확보로 리팩토링 신뢰도 향상

---

## 6. 참고 문서

| 문서        | 위치                                     |
| ----------- | ---------------------------------------- |
| 완료 로그   | `docs/TDD_REFACTORING_PLAN_COMPLETED.md` |
| 백로그      | `docs/TDD_REFACTORING_BACKLOG.md`        |
| 설계        | `docs/ARCHITECTURE.md`                   |
| 코딩 규칙   | `docs/CODING_GUIDELINES.md`              |
| 실행 가이드 | `AGENTS.md`                              |
| 벤더 API    | `docs/vendors-safe-api.md`               |
