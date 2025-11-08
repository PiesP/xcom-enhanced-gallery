# test/unit/components

UI 컴포넌트 기능 테스트 모음

## 개요

이 폴더는 프로젝트의 UI 컴포넌트 렌더링 및 기능을 테스트합니다. 렌더링 검증,
props 처리, 상태 표시 등을 포함합니다.

## 파일 목록

### 기본 컴포넌트

#### button-primitive-enhancement.test.ts

**대상**: Button primitive 컴포넌트

**내용**:

- Intent 지원 (primary, success, danger, neutral)
- Selected 상태 검증
- Loading 상태 및 비활성화
- 기존 기능 유지 (variant, size)
- 키보드 접근성

**크기**: 4.5 KB | **테스트**: 13개

---

#### ui-primitive.test.tsx

**대상**: UI 기본 컴포넌트 (Button, Panel)

**내용**:

- Button 렌더링 및 접근성
- Button role과 클래스 네이밍 검증
- Panel 컴포넌트 렌더링
- 인덱스 export 검증

**크기**: 4.1 KB | **테스트**: 10개

---

### 설정 컴포넌트

#### settings-controls.test.tsx

**대상**: SettingsControls 컴포넌트

**상태**: Phase 45 - GREEN (개선됨)

**개선 사항** (Phase 178B):

- 팩토리 패턴 도입: `createProps()`, `renderComponent()`
- 코드 크기: 9.1 KB → 5.9 KB (35% 축소)
- 중복 제거: 명확한 props 관리
- 벤더 getter 적용: `getSolid()` 사용

**내용**:

- Theme/Language select 렌더링
- 현재 값 표시 검증
- Compact 모드 지원
- 타입 안정성 검증

**크기**: 5.9 KB | **테스트**: 11개

---

### 툴바 컴포넌트

#### toolbar-expandable-aria.test.tsx

**대상**: Toolbar 확장 가능 패널 (ARIA)

**상태**: Phase 47 - E2E 마이그레이션 중

**내용** (정적 구조 검증):

- ARIA collapse 패턴 검증
- aria-expanded, aria-controls 속성
- aria-labelledby 참조 관계
- Screen reader 지원

**마이그레이션**:

- 동적 테스트: `playwright/smoke/toolbar-aria-e2e.spec.ts` (3 tests)
- 현재: 정적 ARIA 속성만 검증

**크기**: 6.3 KB | **테스트**: 7개

---

#### toolbar-layout-stability.test.tsx

**대상**: Toolbar 레이아웃 안정성

**상태**: Phase 49 - 검증 중

**내용**:

- 설정 패널 확장 시 height 고정 확인
- Absolute positioning 구조
- JSDOM 제약사항 주석

**참고**: 실제 높이 계산은 E2E 테스트에서 검증

**크기**: 2.9 KB | **테스트**: 2개

---

#### toolbar-settings-toggle.test.tsx

**대상**: Toolbar 설정 토글

**상태**: Phase 80.1 - 부분 마이그레이션

**내용** (구조 검증):

- Settings 버튼 렌더링
- Settings 패널 렌더링
- ARIA 속성 검증

**마이그레이션 상태**:

- E2E로 마이그레이션됨: `playwright/smoke/toolbar-settings-toggle-e2e.spec.ts`
  (4 tests)
- JSDOM 제약: Solid.js 반응성 제한

**크기**: 3.1 KB | **테스트**: 2개

---

#### toolbar.separator-contrast.test.tsx

**대상**: Toolbar separator 색상 대비

**내용**:

- 텍스트 색상 토큰 사용 검증
- 분리자 클래스 적용
- Contrast 정책 확인

**크기**: 1.2 KB | **테스트**: 1개

---

## 아키텍처 패턴

### 팩토리 패턴

큰 파일이나 중복이 많은 테스트는 팩토리 함수를 사용합니다:

```typescript
// Factory: Default props 생성
function createProps(overrides = {}) {
  return {
    defaultValue: 'auto',
    onChange: vi.fn(),
    ...overrides,
  };
}

// Factory: Component 렌더링 및 요소 추출
function renderComponent(props = {}) {
  const finalProps = createProps(props);
  const { container } = render(h(Component, finalProps));
  return { container, element, props: finalProps };
}

// 사용
describe('Component', () => {
  it('should work', () => {
    const { element, props } = renderComponent({ value: 'custom' });
    expect(element).toBeTruthy();
  });
});
```

### 벤더 Getter

모든 파일은 벤더 getter를 사용합니다:

```typescript
import { getSolid } from '../../../src/shared/external/vendors';

const { h } = getSolid();
```

### 파일 이동 및 분류

**Phase 178 개선** (2025-10-25):

- 정책 검증 테스트 → `test/unit/policies/`로 이동 (5개)
- RED 테스트 → `test/archive/unit/components/`로 이동 (2개)
- 결과: 7개 파일만 남음 (UI 컴포넌트 기능 테스트)

**이동된 파일**:

- `lazy-icon-memo.test.tsx` → `policies/reactive-evaluation.test.ts`
- `toolbar-memo.test.tsx` → `policies/direct-comparison.test.ts`
- `toast-container-selector.test.tsx` →
  `policies/signal-selector-validation.test.ts` (통합)
- `toolbar-selector.test.tsx` → `policies/signal-selector-validation.test.ts`
  (통합)
- `vertical-image-item-selector.test.tsx` →
  `policies/signal-selector-validation.test.ts` (통합)
- `toolbar-circular-navigation.test.tsx` → `archive/unit/components/`
- `toolbar-focused-index-display.test.tsx` → `archive/unit/components/`

---

## 실행 방법

```bash
# 모든 컴포넌트 테스트
npm run test:unit test/unit/components

# 특정 파일 테스트
npm run test:unit -- test/unit/components/settings-controls.test.tsx

# 린트 포함 전체 테스트
npm run test:lint
```

## JSDOM 제약사항

이 폴더의 테스트는 JSDOM 기반이므로, 다음 제약이 있습니다:

- ❌ Solid.js fine-grained reactivity (signal boundary 미확립)
- ❌ 레이아웃 계산 (`getBoundingClientRect()` 항상 0)
- ❌ CSS 스타일 계산
- ✅ DOM 구조 및 속성 검증
- ✅ 렌더링 및 조건부 표시

**E2E 테스트** 필요한 기능:

- 실제 레이아웃 검증: `playwright/smoke/`
- 반응성 테스트: `test/browser/`
- 상호작용 검증: `playwright/smoke/`

---

## 참고

- `TESTING_STRATEGY.md`: 테스트 전략 및 JSDOM 제약사항
- `CODING_GUIDELINES.md`: 코딩 규칙
- 정책 검증: `test/unit/policies/README.md`
- 아카이브: `test/archive/unit/components/README.md`
