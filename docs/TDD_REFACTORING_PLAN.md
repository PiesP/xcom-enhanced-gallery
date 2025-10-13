# TDD 리팩토링 활성 계획

> **최종 업데이트**: 2025-10-13 **상태**: Phase 50까지 완료 ✅

## 프로젝트 상태

- **빌드**: dev 725.95 KB / prod **315.54 KB** ✅
- **테스트**: 670 passing, 3 skipped (E2E 연기) ✅
- **타입**: TypeScript strict, 0 errors ✅
- **린트**: ESLint 0 warnings ✅
- **의존성**: 0 violations (263 modules, 717 dependencies) ✅
- **번들 예산**: **315.54 KB / 325 KB** (9.46 KB 여유) ✅ **목표 달성!**

## 참고 문서

- `AGENTS.md`: 개발 환경 및 워크플로
- `TDD_REFACTORING_PLAN_COMPLETED.md`: Phase 1-48.7 완료 기록
- `ARCHITECTURE.md`: 아키텍처 구조
- `CODING_GUIDELINES.md`: 코딩 규칙

---

## 최근 완료

### Phase 44-48.7 완료 ✅ (2025-01-13)

Toolbar Expandable Settings 리팩토링 및 안정성 수정 완료

**주요 성과**:

- ✅ SettingsModal → Toolbar 인라인 패널 전환 (Phase 44-48)
- ✅ 외부 클릭 감지 로직 추가 (Phase 48.5)
- ✅ select 드롭다운 안정성 수정 (Phase 48.6)
- ✅ **포커스 관리 createEffect 안티패턴 제거 (Phase 48.7)** **신규 완료!**
- ✅ 번들 크기: 325.68 KB → **315.54 KB** (-10.14 KB, 3.1% 감소)
- ✅ 325 KB 제한 준수 (9.46 KB 여유)
- ✅ 83+ 신규 테스트, 670 passing
- ✅ ARIA 접근성 강화 (collapse pattern, 키보드 네비게이션)
- ✅ **UX 안정성 대폭 향상** (외부 클릭, select 드롭다운, 포커스 관리 모두 정상
  작동)

세부 내역은 `TDD_REFACTORING_PLAN_COMPLETED.md`를 참조하세요.

---

## 활성 작업 계획

### 우선순위 1: Phase 47 ARIA 테스트 수정 (3 failing tests)

**파일**: `test/unit/toolbar-expandable-a11y.test.tsx`

**실패 테스트**:

1. `설정 패널 확장 시 aria-expanded가 true로 변경되어야 함`
2. `Enter 키로 설정 패널을 토글할 수 있어야 함`
3. `Space 키로 설정 패널을 토글할 수 있어야 함`

**문제**: JSDOM 환경에서 Solid.js Signal 기반 `aria-expanded` 속성 업데이트가
정상 작동하지 않음

**해결 방안**:

- 옵션 A: E2E로 전환 (Playwright에서 실제 브라우저 환경 테스트)
- 옵션 B: 테스트 파일 제거 (Phase 47 E2E 테스트로 충분히 커버)
- 옵션 C: `flushSync()` 또는 `waitFor()`를 사용한 비동기 처리 시도

**완료 조건**:

- ✅ 모든 JSDOM 테스트 passing (0 failing)
- ✅ 실패한 3개 테스트가 E2E로 마이그레이션되거나 수정됨

---

### 우선순위 2: 추적되지 않는 테스트 파일 정리

**파일**: `test/unit/toolbar-expandable-a11y.test.tsx`

**현황**: Git에서 추적되지 않는 파일 (untracked)

**옵션**:

1. **커밋**: Phase 47 테스트로 추가 (현재 3 failing 상태)
2. **제거**: E2E 테스트로 충분하므로 삭제
3. **수정 후 커밋**: 우선순위 1 해결 후 커밋

**권장**: 옵션 2 (제거) - E2E 테스트가 동일 시나리오를 커버하고 있으며, JSDOM
제약으로 인해 유지보수 부담이 큼

---

### 우선순위 3: 번들 최적화 여유분 활용

**현재 상태**: 315.18 KB / 325 KB (9.82 KB 여유)

**목표**: 여유분을 활용하여 UX/기능 개선

**잠재적 추가 기능** (예산 내):

1. 애니메이션 강화: 설정 패널 전환 시 부드러운 트랜지션 (+1-2 KB)
2. 키보드 단축키 힌트: 설정 패널에 단축키 표시 (+1-2 KB)
3. 다크/라이트 모드 미리보기: 테마 변경 전 미리보기 기능 (+2-3 KB)

**평가**: 현재는 안정성 우선, 기능 추가는 신중하게 검토

---

### 백로그 (선택적)

#### 추가 번들 최적화

**현재**: 315.18 KB / 325 KB (9.82 KB 여유) ✅

**잠재적 최적화 (우선순위 낮음)**:

1. CSS 최적화: 미사용 규칙 정리 (예상 1-2 KB)
2. Tree-shaking: barrel export 최소화
3. 이미지/아이콘 최적화: SVG minify

**평가**: 현재 여유분이 충분하므로 즉시 필요 없음

---

## 프로젝트 건강도 지표 (Phase 50 완료 시점)

- **번들 크기**: **315.18 KB / 325 KB** ✅ (9.82 KB 여유)
- **테스트 통과율**: 679 passing (JSDOM), 3 passing + 1 skipped (E2E) ✅
- **타입 안전성**: TypeScript strict mode ✅
- **코드 품질**: ESLint 0 warnings ✅
- **의존성 정책**: 1 info violation (acceptable) ✅
- **모듈 수**: 263 modules ✅

---

## 작업 히스토리

- **2025-10-13**: Phase 44-50 완료, master 병합
  - SettingsModal 제거, Toolbar 확장 패널 전환
  - 번들 크기 -10.50 KB 감소 (3.2%)
  - E2E 테스트 마이그레이션 (0 JSDOM skipped 달성)
  - 11 commits, 682+ tests passing

**목표**: Phase 48에서 skip된 2개 테스트를 Playwright E2E로 검증

**현황**:

- Skipped 테스트 (2개):
  - `toolbar-settings-integration.test.tsx` - 설정 버튼 렌더링 검증
  - `toolbar-settings-integration.test.tsx` - 설정 버튼 접근성 검증
- Skip 이유: JSDOM Solid.js 조건부 렌더링 타이밍 제약

**작업 내용**:

#### Step 1: Playwright Harness 복원

**파일**: `playwright/harness/index.ts`, `types.d.ts`

**작업**:

- Phase 48에서 주석 처리된 SettingsModal 함수 제거
- Toolbar expandable panel 테스트 함수 추가:
  - `mountToolbarWithSettings()`: 설정 버튼이 있는 Toolbar 마운트
  - `clickSettingsButton()`: 설정 버튼 클릭
  - `getSettingsPanelState()`: 패널 확장 상태 확인
  - `selectTheme(theme)`: 테마 변경
  - `selectLanguage(lang)`: 언어 변경

#### Step 2: E2E Smoke 테스트 추가

**파일**: `playwright/smoke/toolbar-settings.spec.ts` (신규)

**테스트 시나리오**:

```typescript
test('설정 버튼 클릭 시 패널 확장', async ({ page }) => {
  await harness.mountToolbarWithSettings();
  await harness.clickSettingsButton();
  const state = await harness.getSettingsPanelState();
  expect(state.isExpanded).toBe(true);
});

test('설정 버튼에 ARIA 속성 존재', async ({ page }) => {
  await harness.mountToolbarWithSettings();
  const button = page.locator('[data-gallery-element="settings"]');
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  await expect(button).toHaveAttribute(
    'aria-controls',
    'toolbar-settings-panel'
  );
});

test('Escape 키로 패널 닫기', async ({ page }) => {
  await harness.mountToolbarWithSettings();
  await harness.clickSettingsButton();
  await page.keyboard.press('Escape');
  const state = await harness.getSettingsPanelState();
  expect(state.isExpanded).toBe(false);
});
```

#### Step 3: JSDOM 테스트 제거

**파일**: `test/unit/components/toolbar-settings-integration.test.tsx`

**작업**:

- Skip된 2개 테스트 완전 제거 (또는 파일 전체 삭제)
- E2E로 충분히 커버되므로 중복 불필요

**완료 조건**:

- ✅ Playwright E2E 3+ 테스트 추가
- ✅ 모든 E2E 테스트 통과
- ✅ Skipped 테스트 0개 (또는 의도적 1개만 유지)

---

### Phase 50: 최종 검증 및 문서 갱신

**목표**: 프로젝트 상태 최종 점검 및 문서 동기화

#### Step 1: 최종 빌드 검증

```bash
Clear-Host && npm run build
node scripts/validate-build.js
```

**검증 항목**:

- ✅ 번들 크기: 315 KB 이하 유지
- ✅ 의존성: 0 violations
- ✅ 테스트: 669+ passing, 0-1 skipped
- ✅ 타입: 0 errors

#### Step 2: 문서 갱신

**업데이트 대상**:

1. **AGENTS.md**
   - Phase 44-48 완료 반영
   - 프로젝트 상태 스냅샷 업데이트
   - 번들 크기 목표 달성 기록

2. **ARCHITECTURE.md**
   - SettingsModal 제거
   - Toolbar expandable settings 구조 추가
   - 컴포넌트 다이어그램 갱신 (선택)

3. **README.md**
   - 기능 목록 업데이트 (설정 → 툴바 인라인 패널)
   - 번들 크기 업데이트

4. **TDD_REFACTORING_PLAN.md**
   - Phase 49-50 완료 후 이 파일 제거 또는 백로그만 유지
   - 활성 계획 없음 상태로 정리

#### Step 3: 의존성 그래프 재생성

```bash
npm run deps:all
```

**검증**:

- 모듈 수: 263개 (Phase 48 이후)
- 그래프 파일: `docs/dependency-graph.*` 갱신

**완료 조건**:

- ✅ 모든 문서가 코드 상태와 일치
- ✅ 번들 크기 325 KB 이하 유지
- ✅ 프로젝트 건강도 100% (테스트/타입/린트)

---

## 백로그 (선택적)

### 추가 번들 최적화

**현재**: 315.18 KB / 325 KB (9.82 KB 여유) ✅

**잠재적 최적화 (우선순위 낮음)**:

1. CSS 최적화: 미사용 규칙 정리 (예상 1-2 KB)
2. Tree-shaking: barrel export 최소화
3. 이미지/아이콘 최적화: SVG minify

**평가**: 현재 여유분이 충분하므로 즉시 필요 없음

---

## 프로젝트 건강도 지표 (Phase 48 완료 시점)

- **번들 크기**: **315.18 KB / 325 KB** ✅ (9.82 KB 여유)
- **테스트 통과율**: 669 passing / 2 skipped (E2E 연기) ✅
- **타입 안전성**: TypeScript strict mode ✅
- **코드 품질**: ESLint 0 warnings ✅
- **의존성 정책**: 0 violations ✅
- **모듈 수**: 263 modules ✅

## 남은 작업 (Phase 48.5-50)

### Phase 48.5: Toolbar 설정 패널 안정성 수정 (긴급)

**문제**: 설정 드롭다운 메뉴를 펼치면 열리는 순간 바로 닫히는 문제

**원인 분석**:

- 설정 버튼 클릭 시 이벤트가 document로 전파되어 외부 클릭으로 감지됨
- 외부 클릭 감지 로직이 없어서 패널이 의도치 않게 닫힐 수 있음
- 설정 패널 내부의 select 요소 클릭 시에도 이벤트 전파 문제 가능

**솔루션**: 외부 클릭 감지 로직 추가 (Option C)

- `isSettingsExpanded` 상태가 true일 때만 document에 mousedown 리스너 등록
- 설정 버튼과 패널 내부 클릭은 무시
- 외부 클릭 시에만 패널 닫기
- `stopImmediatePropagation()` 추가로 이벤트 전파 완전 차단

**작업 내용**:

#### Step 1: RED - 외부 클릭 테스트 작성

파일: `test/unit/components/toolbar-settings-click-outside.test.tsx` (신규)

```typescript
test('설정 패널 외부 클릭 시 패널이 닫혀야 함', () => {
  // 설정 패널 열기
  toggleSettingsExpanded();
  expect(isSettingsExpanded()).toBe(true);

  // 외부 클릭 시뮬레이션
  const outsideElement = document.createElement('div');
  document.body.appendChild(outsideElement);
  fireEvent.mouseDown(outsideElement);

  // 패널이 닫혀야 함
  expect(isSettingsExpanded()).toBe(false);
});

test('설정 버튼 클릭 시 외부 클릭으로 감지되지 않아야 함', () => {
  // 설정 버튼 클릭으로 패널 열기
  const settingsButton = screen.getByTestId('settings-button');
  fireEvent.click(settingsButton);

  // 패널이 열려야 함
  expect(isSettingsExpanded()).toBe(true);
});

test('설정 패널 내부 select 클릭 시 패널이 유지되어야 함', () => {
  toggleSettingsExpanded();
  const themeSelect = screen.getByTestId('theme-select');
  fireEvent.mouseDown(themeSelect);

  // 패널이 계속 열려있어야 함
  expect(isSettingsExpanded()).toBe(true);
});
```

#### Step 2: GREEN - 외부 클릭 감지 로직 구현

파일: `src/shared/components/ui/Toolbar/Toolbar.tsx`

변경 사항:

1. `onSettingsClick`에 `stopImmediatePropagation()` 추가
2. `createEffect`로 외부 클릭 리스너 등록/해제
3. 설정 패널에 ref 추가하여 내부/외부 클릭 구분

```typescript
// Settings panel ref
let settingsPanelRef: HTMLDivElement | undefined;
let settingsButtonRef: HTMLButtonElement | undefined;

// 외부 클릭 감지
createEffect(() => {
  const expanded = isSettingsExpanded();

  if (expanded) {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      // 설정 버튼이나 패널 내부 클릭은 무시
      if (
        settingsButtonRef?.contains(target) ||
        settingsPanelRef?.contains(target)
      ) {
        return;
      }
      // 외부 클릭 시 패널 닫기
      setSettingsExpanded(false);
    };

    document.addEventListener('mousedown', handleOutsideClick, true);

    onCleanup(() => {
      document.removeEventListener('mousedown', handleOutsideClick, true);
    });
  }
});

const onSettingsClick = (event: Event | MouseEvent) => {
  event.stopPropagation();
  event.stopImmediatePropagation(); // ✅ 추가
  const wasExpanded = isSettingsExpanded();
  toggleSettingsExpanded();
  // ... rest of the code
};
```

#### Step 3: REFACTOR - 설정 패널 이벤트 전파 차단

파일: `src/shared/components/ui/Toolbar/Toolbar.tsx`

설정 패널에 mousedown 핸들러 추가:

```typescript
<div
  ref={element => {
    settingsPanelRef = element ?? undefined;
  }}
  id='toolbar-settings-panel'
  class={styles.settingsPanel}
  data-expanded={isSettingsExpanded()}
  onMouseDown={(e) => {
    // 패널 내부 클릭은 전파하지 않음
    e.stopPropagation();
  }}
  role='region'
  aria-label='설정 패널'
>
  <SettingsControls ... />
</div>
```

**완료 조건**:

- ✅ 외부 클릭 테스트 통과 (RED→GREEN)
- ✅ 설정 버튼 클릭 시 패널 정상 토글
- ✅ 설정 패널 내부 클릭 시 패널 유지
- ✅ 외부 클릭 시 패널 닫힘
- ✅ Escape 키 동작 유지 (기존 기능)
- ✅ 빌드 검증 통과

---

### Phase 49: 테스트 마이그레이션

**목표**: SettingsModal 관련 테스트를 Toolbar 확장 패널 테스트로 전환

**제거**:

- `test/features/settings/settings-modal.accessibility.test.tsx` (E2E 커버)
- `test/unit/shared/components/ui/settings-modal-focus.test.tsx` (jsdom 제약)
- `test/refactoring/settings-modal-*.test.ts` (디자인 일관성 → Toolbar 통합)

**변환**:

- `test/unit/shared/components/ui/ToolbarWithSettings.test.tsx` →
  `test/unit/shared/components/ui/Toolbar-expandable.test.tsx`
- 설정 상태 테스트 → `SettingsControls.test.tsx`

**Playwright E2E 추가** (`playwright/smoke/toolbar-expandable.spec.ts`):

```typescript
test('툴바 설정 버튼 클릭 시 패널이 확장되어야 함', async ({ page }) => {
  await harness.mountToolbar({ currentIndex: 0, totalCount: 5 });
  const settingsBtn = page.locator('[data-gallery-element="settings"]');
  await settingsBtn.click();
  await expect(page.locator('.settingsPanel')).toHaveAttribute(
    'data-expanded',
    'true'
  );
});
```

**완료 조건**:

- ⏳ 단위 테스트 전환 완료
- ⏳ E2E 스모크 테스트 추가 (Playwright)
- ⏳ 테스트 통과율 100% 유지
- ⏳ skipped 테스트 추가 없음

---

### Phase 50: 최적화 및 검증

**목표**: 번들 크기 검증, 성능 측정, 문서 갱신

#### 작업 1: 번들 분석

```bash
npm run build:prod
node scripts/validate-build.js
# 예상: ~315 KB (10 KB 여유)
```

#### 작업 2: 성능 벤치마크

파일: `test/performance/toolbar-expandable.bench.ts`

```typescript
bench('설정 패널 토글 애니메이션', async () => {
  const toolbar = document.querySelector('.galleryToolbar');
  await toolbarActions.toggleSettingsExpanded();
  // 16ms 미만 목표 (60fps)
});
```

#### 작업 3: 문서 갱신

- `AGENTS.md`: SettingsModal 제거, Toolbar 확장 패널 추가
- `ARCHITECTURE.md`: 컴포넌트 구조 다이어그램 갱신
- `TDD_REFACTORING_PLAN_COMPLETED.md`: Phase 44-50 기록 추가
- `README.md`: 기능 설명 업데이트

**완료 조건**:

- ⏳ 번들 크기: 315 KB 이하 달성
- ⏳ 성능 벤치: 토글 16ms 미만
- ⏳ 의존성 그래프 재생성 (모듈 감소 반영)
- ⏳ 문서-코드 일치성 검증

---

## 백로그

### 추가 번들 최적화 (Phase 50 이후)

**현재 예상**: 315 KB / 325 KB (10 KB 여유)

**고려 사항**:

1. CSS 최적화: 중복 토큰 제거, 미사용 규칙 정리 (예상 2-3 KB)
2. Tree-shaking: 미사용 export 확인, barrel export 최소화
3. 이미지/아이콘 최적화: SVG minify, 중복 제거

---

## 중기 계획 (향후 1-2주)

1. **성능 모니터링**: 번들 크기 추이 관찰, 빌드 시간 최적화 검토
2. **E2E 테스트 강화**: Playwright 스모크 테스트 확장, 주요 사용자 시나리오
   커버리지
3. **의존성 정리**: 미사용 devDependencies 검토, `depcheck` 실행 후 정리
