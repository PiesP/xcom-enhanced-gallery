# Phase G-4-1: 컴포넌트 반응성 최적화 분석 보고서

**작성일**: 2025-09-30  
**Epic**: SOLID-NATIVE-001  
**Phase**: G-4-1 (컴포넌트 분석 및 최적화 대상 선정)

---

## 1. 컴포넌트 파일 인벤토리

총 **6개 SolidJS 컴포넌트** 파일 확인:

1. `src/features/gallery/solid/SolidGalleryShell.solid.tsx` (430 lines)
2. `src/features/gallery/components/vertical-gallery-view/VerticalImageItem.solid.tsx`
   (286 lines)
3. `src/features/notifications/solid/SolidToastHost.solid.tsx` (82 lines)
4. `src/shared/components/ui/Toast/SolidToast.solid.tsx` (87 lines)
5. `src/shared/components/ui/ModalShell/ModalShell.solid.tsx` (247 lines)
6. `src/features/settings/solid/SolidSettingsPanel.solid.tsx` (245 lines)

---

## 2. 최적화 대상 분석

### 2.1. SolidGalleryShell.solid.tsx (430 lines)

**현재 상태**:

- ✅ 이미 `createMemo` 사용: `totalCount`, `currentPositionLabel`, `renderItems`
  (3개)
- ✅ 이미 `createEffect` 사용: signal 구독, 스크롤 처리, 키보드 이벤트 (3개)
- ✅ Native signal 전환 완료 (Phase G-3-3에서 완료)

**최적화 기회**:

- `ensureSettingsModule()` 비동기 로직을 `createResource`로 전환 가능
- `getToolbarSettingsRendererFactory()` 로직 복잡도 개선
- 키보드 이벤트 리스너 중복 (document + window 모두 등록)

**우선순위**: Medium  
**리스크**: Low-Medium (설정 모듈 로딩 로직 복잡)

---

### 2.2. VerticalImageItem.solid.tsx (286 lines)

**현재 상태**:

- ✅ `createSignal` 사용: `isLoaded`, `hasError`, `containerEl` (3개)
- ✅ `createMemo` 사용: `mediaIsVideo`, `filename`, `containerClass`,
  `imageClass`, `videoClass` (5개)
- ✅ `createEffect` 사용: URL 변경 감지, 로드 감지, 컨테이너 클릭 리스너 (3개)

**최적화 기회**:

- **불필요한 Effect**: 컨테이너 클릭 리스너를 Effect로 등록하지 않고 직접 JSX에
  바인딩 가능
- **파생 상태 최적화**: `ariaProps`, `testProps`를 memo로 전환 가능
- **조건부 렌더링 최적화**: `<Show>` 컴포넌트 사용 가능

**우선순위**: High  
**리스크**: Low (비교적 독립적인 컴포넌트)

---

### 2.3. SolidToastHost.solid.tsx (82 lines)

**현재 상태**:

- ✅ `createSignal` 사용: `managedToasts` (1개)
- ✅ `toastManager.subscribe()` 사용하여 외부 상태 구독
- ✅ `onCleanup` 사용

**최적화 기회**:

- **조건부 렌더링 최적화**: `<For>` 컴포넌트 사용하여 리스트 렌더링 최적화
- **Memo 추가**: `containerClass` 계산을 memo로 전환

**우선순위**: Medium  
**리스크**: Low (단순한 구조)

---

### 2.4. SolidToast.solid.tsx (87 lines)

**현재 상태**:

- ✅ `createEffect` 사용: 타이머 기반 자동 닫기 (1개)
- ❌ Memo 사용 없음

**최적화 기회**:

- **Memo 추가**: `toastClass`, `resolveIcon(props.toast.type)` 계산을 memo로
  전환
- **조건부 렌더링 최적화**: `<Show>` 컴포넌트로 액션 버튼 조건부 렌더링

**우선순위**: Low  
**리스크**: Low (매우 단순한 컴포넌트)

---

### 2.5. ModalShell.solid.tsx (247 lines)

**현재 상태**:

- ✅ `createSignal` 사용: `trapActive` (1개)
- ✅ `createEffect` 사용: open/close 시 focus 관리 (1개)
- ✅ `mergeProps`, `splitProps` 사용 (props 최적화)
- ❌ Memo 사용 없음

**최적화 기회**:

- **Memo 추가**: `backdropTestId`, `ariaLabel` 계산을 memo로 전환
- **조건부 렌더링 최적화**: Early return 대신 `<Show>` 컴포넌트 사용 고려
- **Focus 관리 로직 개선**: `getFocusableElements` 계산을 memo로 캐싱

**우선순위**: Medium  
**리스크**: Medium (Focus trap 로직이 복잡하고 접근성 중요)

---

### 2.6. SolidSettingsPanel.solid.tsx (245 lines)

**현재 상태**:

- ✅ `createSignal` 사용: `currentTheme`, `currentLanguage`, `showProgressToast`
  (3개)
- ✅ `createMemo` 사용: `localizedStrings` (1개)
- ✅ `createEffect` 사용: body 속성 설정 (1개)

**최적화 기회**:

- **Memo 추가**: `selectClass`, `getPositionClass()`, `testProps` 계산을 memo로
  전환
- **조건부 렌더링 최적화**: `<Show>` 컴포넌트로 hidden 처리 대신 조건부 렌더링
- **리스트 렌더링 최적화**: `<For>` 컴포넌트로 select options 렌더링

**우선순위**: Medium  
**리스크**: Low-Medium (설정 UI, 자주 변경되지 않음)

---

## 3. 최적화 우선순위 매트릭스

| 컴포넌트              | 우선순위 | 리스크     | 예상 효과                     | 예상 소요 |
| --------------------- | -------- | ---------- | ----------------------------- | --------- |
| **VerticalImageItem** | **High** | Low        | High (리스트 렌더링)          | 2-3h      |
| SolidGalleryShell     | Medium   | Low-Medium | Medium (핵심 shell)           | 3-4h      |
| ModalShell            | Medium   | Medium     | Low (모달은 자주 열리지 않음) | 2-3h      |
| SolidSettingsPanel    | Medium   | Low-Medium | Low (설정은 자주 열리지 않음) | 2h        |
| SolidToastHost        | Medium   | Low        | Medium (토스트는 자주 표시)   | 1-2h      |
| SolidToast            | Low      | Low        | Low (단순 컴포넌트)           | 1h        |

---

## 4. 최적화 패턴 카탈로그

### 4.1. createMemo 적용 대상

**기준**: 계산된 값이 의존성이 있고 재사용되는 경우

**적용 예시**:

```tsx
// Before
const selectClass = [
  primitiveStyles.controlSurface,
  styles.formControl,
  styles.select,
]
  .filter(Boolean)
  .join(' ');

// After
const selectClass = createMemo(() =>
  [primitiveStyles.controlSurface, styles.formControl, styles.select]
    .filter(Boolean)
    .join(' ')
);
```

**대상**:

- VerticalImageItem: `ariaProps`, `testProps`
- SolidToast: `toastClass`, `icon`
- ModalShell: `backdropTestId`, `ariaLabel`, `focusableElements`
- SolidSettingsPanel: `selectClass`, `positionClass`, `testProps`
- SolidToastHost: `containerClass`

---

### 4.2. Show 컴포넌트 적용 대상

**기준**: 조건부 렌더링이 명확한 경우

**적용 예시**:

```tsx
// Before
{
  errorText() ? (
    <div class={styles.statusBanner} data-variant='error' role='status'>
      {errorText()}
    </div>
  ) : null;
}

// After
<Show when={errorText()}>
  {text => (
    <div class={styles.statusBanner} data-variant='error' role='status'>
      {text}
    </div>
  )}
</Show>;
```

**대상**:

- SolidGalleryShell: error banner, placeholder, settings host
- VerticalImageItem: placeholder, video/image, error, download button
- SolidToast: action button
- ModalShell: early return → `<Show when={local.isOpen}>` 전환
- SolidSettingsPanel: hidden attribute → `<Show>` 전환

---

### 4.3. For 컴포넌트 적용 대상

**기준**: 배열을 map으로 렌더링하는 경우

**적용 예시**:

```tsx
// Before
{
  managedToasts().map(toast => (
    <SolidToast toast={toast} onClose={closeToast} />
  ));
}

// After
<For each={managedToasts()}>
  {toast => <SolidToast toast={toast} onClose={closeToast} />}
</For>;
```

**대상**:

- SolidGalleryShell: `renderItems` (mediaItems 렌더링)
- SolidToastHost: toast 리스트 렌더링
- SolidSettingsPanel: theme options, language options

---

### 4.4. Effect 정리 대상

**기준**: 불필요한 Effect 제거, 직접 바인딩 가능한 경우

**적용 예시**:

```tsx
// Before
solid.createEffect(() => {
  const node = containerEl();
  if (!node) return;
  const listener = (event: MouseEvent) => { ... };
  node.addEventListener('click', listener);
  solid.onCleanup(() => {
    node.removeEventListener('click', listener);
  });
});

// After
<div onClick={handleContainerClick}>
  {/* ... */}
</div>
```

**대상**:

- VerticalImageItem: 컨테이너 클릭 리스너 (JSX 바인딩으로 전환)
- SolidGalleryShell: 키보드 이벤트 중복 제거 (document와 window 중 하나만)

---

## 5. 권장 작업 순서 (Phase G-4-2 ~ G-4-N)

### Phase G-4-2: VerticalImageItem 최적화 ⚡ **High Priority**

**목표**: 리스트 렌더링 성능 개선 (갤러리 아이템 다수 렌더링)

**작업**:

1. RED: 최적화 효과 측정 테스트 작성
2. GREEN: createMemo 추가, Show 컴포넌트 전환, Effect 정리
3. REFACTOR: 성능 벤치마크 및 검증

**예상 소요**: 2-3시간

---

### Phase G-4-3: SolidToastHost + SolidToast 최적화

**목표**: 토스트 렌더링 최적화

**작업**:

1. SolidToastHost: For 컴포넌트 전환, containerClass memo화
2. SolidToast: toastClass memo화, Show 컴포넌트 전환

**예상 소요**: 2-3시간

---

### Phase G-4-4: SolidGalleryShell 최적화

**목표**: 핵심 갤러리 shell 반응성 개선

**작업**:

1. createResource로 설정 모듈 비동기 로딩 개선
2. Show 컴포넌트 전환 (error banner, settings host)
3. 키보드 이벤트 리스너 중복 제거

**예상 소요**: 3-4시간

---

### Phase G-4-5: ModalShell 최적화

**목표**: 모달 focus trap 로직 최적화

**작업**:

1. focusableElements memo화
2. Show 컴포넌트 전환 (early return 제거)
3. 접근성 검증 강화

**예상 소요**: 2-3시간

---

### Phase G-4-6: SolidSettingsPanel 최적화

**목표**: 설정 UI 반응성 개선

**작업**:

1. selectClass, positionClass memo화
2. For 컴포넌트로 select options 렌더링
3. Show 컴포넌트로 조건부 렌더링 전환

**예상 소요**: 2시간

---

## 6. 예상 메트릭 개선

| 항목                | 현재     | 목표        | 개선 방법            |
| ------------------- | -------- | ----------- | -------------------- |
| **Memo 사용**       | 15개     | 25-30개     | 파생 상태 memo화     |
| **Show 사용**       | 0개      | 10-15개     | 조건부 렌더링 최적화 |
| **For 사용**        | 0개      | 3-5개       | 리스트 렌더링 최적화 |
| **불필요한 Effect** | 2-3개    | 0개         | JSX 직접 바인딩      |
| **번들 크기**       | 443 KB   | 440-445 KB  | ±5 KB 허용           |
| **렌더링 성능**     | Baseline | 10-20% 개선 | DevTools 프로파일링  |

---

## 7. 리스크 및 완화 전략

### 리스크 1: 접근성 회귀 (ModalShell focus trap)

**완화**:

- Focus trap 로직 변경 전 단위 테스트 작성
- 실제 브라우저 검증 (Tab/Shift+Tab 동작 확인)
- 접근성 자동화 테스트 추가

---

### 리스크 2: 비동기 로딩 로직 변경 (SolidGalleryShell)

**완화**:

- createResource 전환 전 현재 동작 테스트 작성
- 단계별 전환 (fallback → loading state → error handling)
- 롤백 경로 준비

---

### 리스크 3: 리스트 렌더링 키 관리 (For 컴포넌트)

**완화**:

- For 컴포넌트 사용 시 안정적인 key 설정
- 성능 벤치마크로 실제 개선 효과 측정
- map → For 전환 전후 동작 동일성 검증

---

## 8. 다음 단계

1. **Phase G-4-2 착수**: VerticalImageItem 최적화 (High Priority)
   - RED: 성능 측정 테스트 작성
   - GREEN: createMemo/Show 적용
   - REFACTOR: 벤치마크 검증

2. **문서 업데이트**: TDD_REFACTORING_PLAN.md에 Phase G-4-2 계획 추가

3. **품질 게이트 준비**: 각 Phase 완료 시 typecheck/lint/test/build 검증

---

## 9. Acceptance Criteria (Phase G-4 전체)

- [ ] 모든 컴포넌트에 createMemo 최적화 적용 (목표: 25-30개)
- [ ] Show/For 컴포넌트로 조건부/리스트 렌더링 최적화 (목표: 10-15개 Show, 3-5개
      For)
- [ ] 불필요한 Effect 제거 (목표: 0개 불필요 Effect)
- [ ] 렌더링 성능 10-20% 개선 (DevTools 프로파일링 기준)
- [ ] 메모리 누수 없음 (대량 데이터 시나리오 검증)
- [ ] 접근성 회귀 없음 (focus trap, keyboard navigation 검증)
- [ ] 품질 게이트 ALL GREEN (typecheck/lint/test/build)
- [ ] 번들 크기 ±5 KB 이내 유지 (440-450 KB)

---

**보고서 종료**
