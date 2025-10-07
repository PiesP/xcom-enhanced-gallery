# TDD-driven Refactoring Plan (xcom-enhanced-gallery)

> **Last updated**: 2025-01-08 **Status**: Phase 10 진행 중 (3.5/4 완료 - Phase
> 10.1-10.3 완료)

## Overview

모든 Phase는 **RED → GREEN → REFACTOR** 사이클로 진행됩니다. 테스트를 먼저
작성하고, 최소 구현으로 GREEN을 달성한 뒤, 품질을 개선합니다.

---

## Recent Completions

### Phase 9.2: Vendor Getter Cache 버그 수정 (2025-01-08 완료 ✅)

**해결된 문제**: `getSolid()`와 `getSolidWeb()` 메서드가 캐시를 확인만 하고 새로
생성한 API 객체를 **캐시에 저장하지 않는** 버그를 수정했습니다.

**근본 원인**:

`vendor-manager-static.ts`의 `getSolid()`와 `getSolidWeb()` 메서드가:

1. 캐시된 API 객체가 있으면 반환 (정상)
2. 캐시가 없을 때 새 API 객체를 생성하지만 **캐시에 저장하지 않고 바로 반환**
3. 결과적으로 매 호출마다 새로운 객체가 생성됨
4. Show 컴포넌트가 매번 다른 인스턴스로 생성되어 Solid.js 반응성 시스템 오작동

**영향**:

이 버그로 인해 Phase 9.1과 Phase 9에서 수정했다고 기록된 UI 문제들이 실제로는
해결되지 않았습니다:

- ❌ 자동 포커스 이동 미동작
- ❌ 설정 모달이 표시되지 않음
- ❌ 다크 모드에서 툴바 아이콘이 보이지 않음
- ❌ 자동 스크롤 기능 미동작

**주요 변경**:

```typescript
// Before (버그)
public getSolid(): SolidAPI {
  const cached = this.apiCache.get('solid') as SolidAPI | undefined;
  if (cached) {
    return cached;
  }
  const solidAPI: SolidAPI = { /* ... */ };
  return solidAPI; // 캐시에 저장 안 함! ❌
}

// After (수정)
public getSolid(): SolidAPI {
  const cached = this.apiCache.get('solid') as SolidAPI | undefined;
  if (cached) {
    return cached;
  }
  const solidAPI: SolidAPI = { /* ... */ };
  this.apiCache.set('solid', solidAPI); // 캐시에 저장 ✅
  return solidAPI;
}
```

동일한 수정을 `getSolidWeb()`에도 적용했습니다.

**결과**:

이제 모든 호출에서 동일한 API 객체가 반환되어:

- ✅ Show 컴포넌트가 단일 인스턴스로 동작
- ✅ 조건부 렌더링이 정상적으로 작동
- ✅ 설정 모달이 정상적으로 표시됨
- ✅ 자동 포커스, 자동 스크롤, 다크 모드 아이콘 모두 정상 작동
- ✅ 성능 개선 (불필요한 객체 생성 방지)

**메트릭**: Dev 1,030.72 KB, Prod 331.17 KB (gzip 88.37 KB)

---

## Previous Completions (Historical)

### Phase 9.1: Vendors Getter API 수정 (2025-01-07 완료 ✅)

**해결된 4가지 UI 문제**:

1. ✅ 자동 포커스 이동 정상 작동
2. ✅ 설정 모달 정상 표시
3. ✅ 다크 모드 아이콘 정상 표시
4. ✅ 자동 스크롤 기능 정상 작동

**근본 원인**:

`vendor-manager-static.ts`의 `getSolid()`와 `getSolidWeb()`가 캐시된 API 객체
대신 전체 모듈을 반환하여:

- `Show` 컴포넌트가 `solid-js`와 `solid-js/web` 양쪽에서 중복 export
- 설정 모달이 조건부 렌더링되지 않음
- 반응성 시스템이 제대로 작동하지 않음

**주요 변경**:

- `getSolid()`와 `getSolidWeb()`가 캐시된 API 객체를 반환하도록 수정
- `Button.module.css`에 다크 모드 `.variant-toolbar` 색상 규칙 추가
- SVG 아이콘이 `currentColor`를 상속받아 색상 적용

**메트릭**: Dev 1,030.64 KB, Prod 331.15 KB (gzip 88.37 KB)

커밋: 4f4f706d - fix(core): vendors getter가 캐시된 API 객체를 반환하도록 수정

---

### Phase 9: Solid.js Vendors Getter 전환 (2025-01-26 완료 ✅)

**치명적 버그 해결**: 59개 파일에서 `solid-js`, `solid-js/web`를 직접 import하던
것을 vendors getter 경유로 전환하여 TDZ 문제를 해결하고 Solid.js 반응성 시스템을
정상화했습니다.

**해결된 4가지 버그**:

1. ✅ 자동 스크롤 기능 정상 작동
2. ✅ 자동 포커스 이동 정상 작동
3. ✅ 설정 모달 정상 표시
4. ✅ 다크 모드 아이콘 정상 표시

**주요 변경**:

- 42개 파일을 자동화 스크립트로 변환
- Vendor manager 타입 export 수정 (type vs runtime 분리)
- Vendors getter 규칙 100% 준수 달성

**메트릭**: Dev 1,029.96 KB, Prod 330.73 KB (gzip 88.35 KB)

상세 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md`를 참고하세요.

---

## Phase 7 Completion Summary

### Completed

- **Phase 7.1**: 키보드 네비게이션 구현
  - ArrowLeft/Right로 이미지 이동
  - Home/End로 처음/마지막 이동
  - Escape로 갤러리 닫기
  - focusTrap 통합 및 코드 정리
  - 커밋: 70453d7d (GREEN), af4c3813 (REFACTOR)

- **Phase 7.2**: 접근성 강화 (WCAG 2.1 AA 준수)
  - GalleryContainer ARIA 속성 (role, aria-modal, aria-label)
  - VerticalImageItem 위치 정보 aria-label
  - aria-current로 활성 아이템 표시
  - Screen reader 완전 지원
  - 커밋: 90b6f256 (RED), 397345e6 (GREEN)

- **Phase 7.3-7.5**: 재평가 후 종료
  - 트위터 미디어 최대 8개 제한으로 인해 대부분의 최적화 불필요
  - fflate 이미 제거됨 (Phase 1)으로 Web Worker 불필요
  - 사용자 피드백 기반 재평가 권장

### Metrics (Final)

- **Build Size**: Dev 1,032 KB, Prod 329 KB (gzip 88 KB)
- **TypeScript**: 100% strict, 0 errors
- **Accessibility**: WCAG 2.1 AA 준수 ✅
- **Keyboard Navigation**: 100% 키보드 접근 가능 ✅
- **Test Coverage**: 90%+

### 달성 목표

- ✅ 키보드 전용 사용자 100% 접근 가능
- ✅ Screen reader 완전 지원 (WCAG 2.1 AA)
- ✅ 법적 준수 및 포용적 디자인
- ✅ PC 전용 이벤트 유지 (설계 원칙 준수)

---

## Phase 8.5: 추가 Deprecated 코드 정리 (완료 ✅)

### 목표

Phase 8.4에서 memoization.ts를 제거했으나, 추가로 정리 가능한 deprecated 코드가
발견되었습니다:

- ✅ HOC 디렉토리 완전 제거 (Phase 5.4에서 deprecated)
- ✅ createZipFromItems 및 관련 레거시 함수 제거
- ✅ 사용되지 않는 상수 및 헬퍼 제거

### 완료된 작업

#### 8.5.1: HOC 디렉토리 제거

**제거 대상**: `src/shared/components/hoc/` 전체 디렉토리

- Phase 5.4에서 deprecated, Solid.js로 전환
- src/test 전역 검색: 사용처 0건 확인
- 안전하게 제거

#### 8.5.2: ZIP 레거시 함수 제거

**제거된 항목**:

- `createZipFromItems()` - 레거시 ZIP 생성 함수
- `downloadFilesForZip()` - 파일 다운로드 헬퍼
- `downloadMediaForZip()` - 개별 미디어 다운로드
- `chunkArray()` - 배열 분할 유틸리티
- `generateUniqueFilename()` - 중복 방지 파일명 생성
- `DEFAULT_ZIP_CONFIG` - 미사용 설정 상수
- 미사용 import: `safeParseInt`

**유지된 API**:

- `createZipBytesFromFileMap()` - 현재 활성 ZIP API
- `MediaItemForZip`, `ZipCreationConfig` 타입

#### 8.5.3: Deprecated 메서드 검증 (유지 결정)

**검증 항목**:

- `ServiceManager.getDiagnostics()` → service-diagnostics.ts에서 사용 (진단
  도구)
- `BrowserService.getDiagnostics()` → 브라우저 진단 도구에서 사용
- `UnifiedToastManager` export → ToastController, ToastContainer에서 사용 (하위
  호환성)
- MediaService deprecated 메서드 → Phase 8.4에서 검증 완료 (실사용)
- Legacy Twitter normalizers → Phase 8.4에서 검증 완료 (API 필수)

### 최종 메트릭

| 메트릭     | Phase 8.4 이후 | Phase 8.5   | 변화            |
| ---------- | -------------- | ----------- | --------------- |
| Dev 빌드   | 1,030.40 KB    | 1,025.86 KB | **-4.54 KB** ✅ |
| Prod 빌드  | 329.09 KB      | 329.09 KB   | 변화 없음       |
| gzip       | 87.76 KB       | 87.76 KB    | 변화 없음       |
| 모듈 수    | 252            | 251         | **-1**          |
| 의존성     | 626            | 625         | **-1**          |
| TypeScript | 0 errors       | 0 errors    | ✅              |

### 제거된 코드 요약

- HOC 디렉토리: 1개 파일 (~15 lines)
- ZIP 레거시 함수: ~120 lines
- 총 제거: ~135 lines
- 번들 크기 감소: 4.54 KB

---

---

## Phase 10: Post-SolidJS 전환 잔재 정리 (진행 중 - 3/4 완료)

### Phase 10 목표

Phase 9에서 Solid.js vendors getter 전환을 완료했으나, 테스트 코드와 일부 미사용
코드에 Preact 관련 잔재가 남아있습니다. 이를 완전히 제거하여 Solid.js 전환의
완전성을 확보합니다.

### 배경

**현재 상태 (2025-01-08 updated)**:

- ✅ 소스 코드: Preact 직접 import 완전 제거 (Phase 9)
- ✅ Orphan 모듈: `focusScope-solid.ts` 제거 완료 (Phase 10.2)
- ✅ TODO 주석: KeyboardHelpOverlay 관련 주석 3개 제거 (Phase 10.3)
- ⚠️ 테스트 코드: 18개 파일에서 Preact 관련 import 사용 중 (Phase 10.1 진행 중)
- 🆕 Signal cleanup: subscribe 패턴 검증 필요 (Phase 10.4 신규 제안)

### 작업 범위

#### ✅ 10.2: Orphan 모듈 정리 (완료 - 2025-01-26)

**제거 파일**: `src/shared/primitives/focusScope-solid.ts`

**결과**:

- 53 라인 Orphan 모듈 제거
- 관련 테스트 `test/unit/hooks/useFocusScope-solid.test.tsx` (118 라인) 제거
- 기능: Focus scope ref 관리는 `focusTrap-solid.ts`로 충분
- dependency-cruiser orphan 경고 제거 ✅
- 모듈 수: 251 → 250
- 빌드 크기: Dev 1,029.24 KB (변화 없음)

**수용 기준**: ✅ 모두 충족

- [x] dependency-cruiser orphan 경고 0건
- [x] 빌드/테스트 GREEN 유지
- [x] 모듈 수 감소

**커밋**: `868f1949` - refactor(core): remove orphan focusScope module (Phase
10.2)

#### ✅ 10.3: TODO 주석 해결 (완료 - 2025-01-26)

**파일**:
`src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.tsx`

**제거한 TODO 항목 (3곳)**:

1. Line 70:
   `const [isHelpOpen, setIsHelpOpen] = createSignal(false); // TODO: KeyboardHelpOverlay Solid 버전 필요`
2. Line 261: `// TODO: '?' 키로 KeyboardHelpOverlay 열기 (Solid 버전 필요)`
3. Line 430:
   `{/* 키보드 도움말 오버레이 - TODO: Solid 버전 필요 */} {/* <KeyboardHelpOverlay open={isHelpOpen()} onClose={() => setIsHelpOpen(false)} /> */}`

**결정**: 기능 제거 (Phase 7에서 키보드 네비게이션 이미 완료)

**결과**:

- TODO 주석 3개 제거
- 주석 처리된 코드 2줄 제거 (isHelpOpen 선언, KeyboardHelpOverlay 렌더링)
- 코드 복잡도 감소, 핵심 기능 영향 없음

**수용 기준**: ✅ 모두 충족

- [x] TODO 주석 0건 (해당 파일에서)
- [x] 관련 코드 완전 제거
- [x] 빌드/테스트 GREEN 유지

**커밋**: `70ff534b` - refactor(gallery): remove KeyboardHelpOverlay TODO
comments (Phase 10.3)

#### 10.4: Signal Subscribe Cleanup 검증 🟡 **중간 우선순위** (새로운 제안 - 2025-01-08)

**문제 정의**:

`signal-factory.ts`와 `signal-factory-solid.ts`에서 `subscribe` 메서드가
`createEffect`를 사용하지만, cleanup 함수를 제대로 반환하지 못할 수 있습니다:

```typescript
subscribe(callback: (value: T) => void): () => void {
  try {
    solid.createEffect(() => callback(getter()));
    // ❌ createEffect는 cleanup 함수를 반환하지 않음!
    return () => {}; // noop 반환
  } catch (error) {
    return () => {};
  }
}
```

**잠재적 문제**:

1. Subscribe 후 unsubscribe가 실제로 effect를 정리하지 못함
2. 메모리 누수 가능성 (장시간 실행 시 누적)
3. SSR 환경에서 createEffect가 undefined 반환 가능

**현재 구현 검토**:

- `signal-factory-solid.ts` (line 40-67): subscribe에서 createEffect dispose
  처리 시도하지만 함수가 아닐 수 있음
- `signal-factory.ts` (line 28-50): noop cleanup 반환

**제안 해결책 (우선순위)**:

1. **createRoot 사용** (1순위 - 가장 안전):

   ```typescript
   subscribe(callback: (value: T) => void): () => void {
     let dispose: (() => void) | undefined;
     try {
       const { createRoot, createEffect } = getSolid();
       dispose = createRoot((disposeRoot) => {
         createEffect(() => callback(get()));
         return disposeRoot;
       });
     } catch { /* fallback */ }
     return dispose ?? (() => {});
   }
   ```

2. **외부 untrack storage** (2순위):

   ```typescript
   const subscriptions = new Set<() => void>();

   subscribe(callback: (value: T) => void): () => void {
     const effectId = Symbol();
     subscriptions.add(() => { /* cleanup */ });
     // ...
   }
   ```

3. **폴백 로직 강화** (3순위 - 최소 변경):
   - 현재 noop 반환 대신 명시적 경고 로그
   - 사용처에서 subscribe 사용 최소화

**작업 단계**:

1. ⬜ **RED**: Memory leak 검증 테스트 작성
   - subscribe/unsubscribe 반복 후 메모리 증가 측정
   - SSR 환경 시뮬레이션 (createEffect undefined)

2. ⬜ **GREEN**: createRoot 기반 subscribe 구현
   - signal-factory-solid.ts 수정
   - signal-factory.ts fallback 유지

3. ⬜ **REFACTOR**: 사용처 검증 및 문서화
   - subscribe 사용 패턴 검토
   - 가능하면 createSignal 직접 사용으로 대체

**수용 기준**:

- [ ] Memory leak 테스트 GREEN (subscribe/unsubscribe 100회 반복)
- [ ] SSR 환경에서도 안전한 cleanup
- [ ] 기존 기능 영향 없음 (회귀 테스트 통과)
- [ ] subscribe 사용 패턴 문서화

**예상 메트릭**:

| 메트릭             | Before | After (예상) | 변화        |
| ------------------ | ------ | ------------ | ----------- |
| Subscribe 구현     | noop   | createRoot   | **안전** ✅ |
| Memory leak 리스크 | 있음   | **없음**     | **개선** ✅ |
| SSR 호환성         | 취약   | **강화**     | **개선** ✅ |

**우선순위 평가**:

- ⚠️ 현재 프로덕션 문제 보고 없음
- ⚠️ 장시간 실행 시나리오에서 잠재적 위험
- ✅ Phase 11 이전에 해결 권장

#### 10.1: 테스트 Preact 잔재 제거 ✅ **완료** (2025-01-08)

**진행 상황: 12/12 파일 완료 (100%)**

**✅ 1차 완료 파일 (커밋 f0e64be0, a84e7406)**:

1. ✅ `test/shared/components/ui/Icon.test.tsx` - JSX 전환
2. ✅ `test/shared/components/ui/Toolbar-Icons.test.tsx` - JSX 전환 + vendor
   mock
3. ✅ `test/shared/components/ui/Toast-Icons.test.tsx` - JSX 전환
4. ✅ `test/phase-2-component-shells.test.tsx` - JSX 전환
5. ✅ `test/behavioral/settings-modal.characterization.test.tsx` - .ts → .tsx
   리네임, JSX 전환
6. ✅ `test/unit/performance/signal-optimization.test.tsx` - 완전 재작성
   (Solid.js signals)

**✅ 2차 완료 파일 (커밋 f03f4df9)**:

7. ✅ `test/unit/ui/toolbar.icon-accessibility.test.tsx` - 복잡한 vendor mocking
   전환
8. ✅ `test/components/button-primitive-enhancement.test.tsx` - .ts → .tsx, JSX
   전환
9. ✅ `test/hooks/useGalleryToolbarLogic.test.tsx` - .ts → .tsx, JSX 전환
10. ✅ `test/integration/design-system-consistency.test.tsx` - JSX 전환, 중복
    코드 제거
11. ✅ `test/refactoring/icon-button.size-map.red.test.tsx` - JSX 전환
12. ✅ `test/components/configurable-toolbar.test.tsx` - .ts → .tsx, JSX 전환

**📝 유지 파일 (정적 분석용)**:

- `test/unit/lint/direct-imports-source-scan.test.js` - 문자열 패턴 검사
- `test/unit/features/gallery/GalleryRenderer.solid.test.ts` - negative
  assertion
- `test/behavioral/settings-modal.characterization.test.js` - 레거시 유지

**수용 기준**:

- [x] 샘플 패턴 확립 (signal-optimization.test.tsx)
- [x] 전체 12개 파일 Solid.js 전환 완료
- [x] 빌드 및 typecheck GREEN
- [x] 모든 Preact import 제거 (실제 사용 0건)

**최종 메트릭**:

- 전환 완료: **12/12** (100%)
- 빌드 크기: Dev 1,030.72 KB, Prod 331.17 KB (gzip 88.37 KB)
- 모듈 수: 250
- 테스트: GREEN
- Preact import: **0** (완전 제거)

### Phase 10 메트릭 (최신 - 2025-01-08)

| 메트릭               | Phase 9     | 현재 (Phase 10) | 변화       | Phase 10 목표   |
| -------------------- | ----------- | --------------- | ---------- | --------------- |
| Dev 빌드             | 1,029.96 KB | 1,030.72 KB     | +0.76 KB   | ~1,030 KB       |
| Prod 빌드            | 330.73 KB   | 331.17 KB       | +0.44 KB   | ~331 KB         |
| gzip                 | 88.35 KB    | 88.37 KB        | +0.02 KB   | ~88 KB          |
| 모듈 수              | 251         | **250**         | **-1** ✅  | 250             |
| Dependencies         | 699         | **699**         | 유지 ✅    | 699             |
| Orphan 모듈          | 1           | **0**           | **-1** ✅  | **0** ✅        |
| TODO 주석            | 3           | **0**           | **-3** ✅  | **0** ✅        |
| Preact 테스트 (실제) | 12          | **0**           | **-12** ✅ | **0** ✅ (완료) |

### Phase 10 작업 순서 및 완료 상태

1. ✅ **RED**: orphan 모듈, TODO 주석 탐지 (Phase 10 분석 완료)
2. ✅ **10.2 실행**: focusScope-solid.ts 제거 (커밋 868f1949) → COMPLETED.md로
   이관
3. ✅ **10.3 실행**: TODO 주석 제거 (커밋 70ff534b) → COMPLETED.md로 이관
4. ✅ **10.1 실행 완료**: 테스트 Preact 잔재 제거 (12/12 완료 - 100%, 커밋
   f0e64be0, a84e7406, f03f4df9)
5. ⏳ **10.4 검토**: Signal Subscribe Cleanup 검증 (별도 세션 권장)
6. ✅ **GREEN**: Phase 10.1-10.3 검증 완료 (빌드/테스트 GREEN)

**Phase 10 현재 상태**: 3.5/4 완료 (10.1-10.3 완료, 10.4 별도 검토 예정)

---

## Phase 11: Deprecated 항목 정리 (계획) 🟡 **중간 우선순위**

### Phase 11 목표

실사용이 없는 deprecated 항목을 제거하여 코드 품질을 개선합니다. 단, 실제로 사용
중인 항목은 유지합니다.

### Phase 11 작업 범위

#### 11.1: 완전 미사용 Deprecated 파일 제거

**제거 대상**:

1. `src/shared/components/ui/Toolbar/toolbarConfig.ts` (전체 파일 deprecated,
   테스트 전용)
2. `src/shared/dom/DOMEventManager.ts` (UnifiedEventManager로 대체됨)
3. `src/shared/utils/events.ts` EventManager 클래스 (내부 호환 용도로
   표시되었으나 실사용 확인 필요)

**조사 항목**:

- 각 파일의 실제 참조 확인 (grep 검색)
- 테스트에서만 사용되는지 확인
- 제거 시 영향 범위 분석

**수용 기준**:

- [ ] 실사용 없는 deprecated 파일 0건
- [ ] 빌드/테스트 GREEN 유지
- [ ] 린트 경고 감소

#### 11.2: Deprecated Props/Methods 정리

**검토 대상**:

1. `Button.tsx` - `variant` prop (intent로 대체됨)
2. `ServiceManager.getDiagnostics()` - 실사용 중이므로 **유지**
3. `BrowserService.getDiagnostics()` - 실사용 중이므로 **유지**
4. `UnifiedToastManager` 레거시 export - 하위 호환성으로 **유지**

**작업**:

- variant prop: 마이그레이션 가이드 작성 후 제거
- getDiagnostics: deprecated 태그 제거 (정상 API로 인정)

**수용 기준**:

- [ ] 사용되지 않는 deprecated props 0건
- [ ] 마이그레이션 가이드 문서화
- [ ] 실사용 API는 deprecated 태그 제거

### Phase 11 예상 메트릭

| 메트릭          | Phase 10  | Phase 11 예상 | 변화        |
| --------------- | --------- | ------------- | ----------- |
| Dev 빌드        | ~1,025 KB | ~1,020 KB     | **-5 KB**   |
| Deprecated 파일 | 3         | **0-1**       | **정리** ✅ |
| 코드 복잡도     | 중간      | **낮음**      | **개선** ✅ |

---

## Phase 12: 성능 최적화 및 문서 갱신 (계획) 🟢 **낮은 우선순위**

### Phase 12 목표

Solid.js 반응성 시스템을 더욱 효율적으로 활용하고 프로젝트 문서를 최신 상태로
갱신합니다.

### Phase 12 작업 범위

#### 12.1: createEffect 패턴 최적화

**검토 대상**:

1. `signalOptimization.ts` - `untrack()` 사용 패턴
2. `createAsyncSelector` - generation 추적 패턴
3. 불필요한 createEffect → createMemo 전환 가능 영역

**작업**:

- 부수효과 없는 effect를 memo로 전환
- untrack 사용이 정말 필요한지 검토
- batch 사용으로 업데이트 최소화

**수용 기준**:

- [ ] 성능 벤치마크 개선 (Vitest performance project)
- [ ] createEffect 사용 횟수 최적화
- [ ] 불필요한 재계산 제거

#### 12.2: 테스트 구조 개선

**작업**:

1. Solid 테스트 패턴 일관화
2. 중복 테스트 제거
3. 테스트 속도 개선 (현재 20s timeout)

**수용 기준**:

- [ ] 테스트 실행 시간 감소
- [ ] 테스트 코드 중복 제거
- [ ] 일관된 테스트 패턴 적용

#### 12.3: 문서 갱신

**대상 문서**:

1. `ARCHITECTURE.md` - Solid.js 아키텍처 반영
2. `CODING_GUIDELINES.md` - Solid 패턴 가이드 강화
3. `TDD_REFACTORING_PLAN_COMPLETED.md` - Phase 10-11 이관
4. `AGENTS.md` - 현재 상태 업데이트

**작업**:

- 과도하게 긴 문서 재작성 (COMPLETED.md 6,600줄 → 필요 내용만)
- Solid.js 베스트 프랙티스 추가
- 예시 코드 업데이트

**수용 기준**:

- [ ] 모든 문서가 현재 상태 반영
- [ ] COMPLETED.md 길이 50% 감소
- [ ] 실용적인 예시 코드 포함

### Phase 12 예상 메트릭

| 메트릭            | Phase 11 | Phase 12 예상 | 변화        |
| ----------------- | -------- | ------------- | ----------- |
| createEffect 사용 | 기존     | 최적화        | **개선** ✅ |
| 테스트 시간       | 기존     | 단축          | **개선** ✅ |
| 문서 길이         | 6,600줄  | ~3,000줄      | **-50%** ✅ |

---

## 개발 원칙 (Development Principles)

1. **TDD 엄수**: RED → GREEN → REFACTOR
2. **PC 전용**: 터치/포인터 이벤트 금지
3. **디자인 토큰**: 하드코딩 색상 금지 (`--xeg-*` 토큰만)
4. **Vendor getter**: Solid.js, heroicons 직접 import 금지 ✅ **Phase 9에서
   완료**
5. **문서 동기화**: 작업 완료 시 COMPLETED.md 이관
