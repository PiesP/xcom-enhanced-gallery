# 컴포넌트 테스트 (Shared/Components)

> UI 컴포넌트 및 UI primitive 테스트 최종 업데이트: 2025-10-25 (Phase 188)

## 📋 테스트 목록

### UI Primitive

- `ui-primitive.test.tsx`: 기본 UI 기본 요소 렌더링 및 동작
- `button-primitive-enhancement.test.ts`: Button primitive 확장 기능 (intent,
  selected, loading)

### Toolbar Components

- `toolbar-expandable-aria.test.tsx`: 툴바 확장 가능 ARIA 접근성
- `toolbar-layout-stability.test.tsx`: 툴바 레이아웃 안정성 (설정 패널 드롭다운)
- `toolbar-settings-toggle.test.tsx`: 툴바 설정 토글 기능
- `toolbar.separator-contrast.test.tsx`: 툴바 구분선 고대비 검증

### Settings Components

- `settings-controls.test.tsx`: 설정 컨트롤 렌더링 및 상태 관리

### Accessibility

- `button-event-types.test.tsx`: 버튼 이벤트 타입 검증
- Phase 187에서 `test/unit/accessibility/` 파일들이 여기로 이동됨

**상태**: 모두 활성 (유지) **용도**: 컴포넌트 렌더링, 상호작용, 접근성 검증
**범위**: Solid.js 컴포넌트 단위 테스트

## 🏗️ 구조

```
test/unit/shared/components/
├── README.md                                    ← 이 파일
├── ui-primitive.test.tsx
├── button-primitive-enhancement.test.ts
├── toolbar-expandable-aria.test.tsx
├── toolbar-layout-stability.test.tsx
├── toolbar-settings-toggle.test.tsx
├── toolbar.separator-contrast.test.tsx
├── settings-controls.test.tsx
├── button-event-types.test.tsx
└── accessibility/                              ← Phase 187에서 추가됨
    ├── README.md
    ├── gallery-accessibility-markup.test.tsx
    ├── toolbar-accessibility-live-region.test.tsx
    └── toast-accessibility-announcement.test.tsx
```

## 🎯 테스트 패턴

### Component Rendering

```typescript
import { render, screen } from '@test/utils/testing-library';
import { Button } from '@shared/components/ui/Button';

describe('Button', () => {
  it('should render', () => {
    render(() => <Button>Click</Button>);
    expect(screen.getByRole('button')).toBeTruthy();
  });
});
```

### Props Testing

```typescript
it('should apply intent styles', () => {
  const { container } = render(() => <Button intent="primary">Test</Button>);
  expect(container.querySelector('.xeg-button--primary')).toBeTruthy();
});
```

### Accessibility

```typescript
it('should have proper ARIA labels', () => {
  render(() => <Toolbar aria-label="Image Gallery Toolbar" />);
  expect(screen.getByRole('toolbar')).toHaveAttribute('aria-label');
});
```

## ⚠️ 주의사항

- JSDOM 환경: CSS 레이아웃 계산 불가능 (`getBoundingClientRect()` 항상 0)
- Solid.js 반응성: 신호 업데이트 후 DOM 변경 자동 반영
- 이벤트: PC 전용 (click, keydown, etc.)

## ✅ 개선 계획

1. **테스트 확대**: 더 많은 컴포넌트 커버리지
2. **E2E 검증**: Playwright로 실제 레이아웃 테스트
3. **접근성**: axe-core를 통한 자동 검증

---

**참고**: Phase 188에서 `test/unit/components/` 파일들이 여기로 이동했습니다.
