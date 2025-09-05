# Button Component

통합된 버튼 컴포넌트로, 모든 버튼 관련 UI 요소를 단일 인터페이스로 제공합니다.

## 개요

Button 컴포넌트는 이전의 `ToolbarButton`, `IconButton`, `Button-legacy` 등을 통합하여 일관된 디자인 시스템을 제공합니다.

## API

### Props

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  iconOnly?: boolean;
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  children: ComponentChildren;
  onClick?: (event: MouseEvent) => void;
  'aria-label'?: string;
  'data-testid'?: string;
}
```

### Variants

| Variant | 설명 | 사용 사례 |
|---------|------|-----------|
| `primary` | 주요 액션 | 저장, 확인, 제출 |
| `secondary` | 보조 액션 | 취소, 뒤로가기 |
| `outline` | 경계선 스타일 | 선택적 액션 |
| `ghost` | 배경 없는 스타일 | 텍스트 버튼, 링크 스타일 |
| `danger` | 위험한 액션 | 삭제, 제거 |

### Sizes

| Size | 설명 | 높이 | 패딩 |
|------|------|------|------|
| `sm` | 작은 크기 | 32px | 8px 12px |
| `md` | 기본 크기 | 40px | 12px 16px |
| `lg` | 큰 크기 | 48px | 16px 20px |

## 사용 예제

### 기본 사용법

```tsx
import { Button } from '@shared/components/ui/Button';

// 기본 버튼
<Button>클릭하세요</Button>

// Primary 버튼
<Button variant="primary">저장</Button>

// 큰 크기 버튼
<Button size="lg" variant="primary">큰 버튼</Button>
```

### 아이콘 전용 버튼

```tsx
import { Button } from '@shared/components/ui/Button';
import { Settings } from '@shared/components/ui/icon';

// 아이콘 전용 버튼 (이전 IconButton 대체)
<Button iconOnly aria-label="설정 열기">
  <Settings size={16} />
</Button>
```

### 로딩 상태

```tsx
<Button loading variant="primary">
  저장 중...
</Button>
```

### 비활성화 상태

```tsx
<Button disabled>
  비활성화된 버튼
</Button>
```

## 마이그레이션 가이드

### ToolbarButton → Button

**이전:**
```tsx
import { ToolbarButton } from '@shared/components/ui/Toolbar/ToolbarButton';

<ToolbarButton variant="primary" size="md">
  클릭
</ToolbarButton>
```

**이후:**
```tsx
import { Button } from '@shared/components/ui/Button';

<Button variant="primary" size="md">
  클릭
</Button>
```

### IconButton → Button

**이전:**
```tsx
import { IconButton } from '@shared/components/ui/primitive/IconButton';

<IconButton aria-label="설정">
  <Settings />
</IconButton>
```

**이후:**
```tsx
import { Button } from '@shared/components/ui/Button';

<Button iconOnly aria-label="설정">
  <Settings />
</Button>
```

### Button-legacy → Button

**이전:**
```tsx
import { Button } from '@shared/components/ui/Button-legacy/Button';

<Button variant="primary">저장</Button>
```

**이후:**
```tsx
import { Button } from '@shared/components/ui/Button';

<Button variant="primary">저장</Button>
```

## 디자인 토큰

Button 컴포넌트는 semantic design token을 사용합니다:

### 색상 토큰

```typescript
// src/shared/styles/tokens/button.ts
export const buttonTokens = {
  // Primary variant
  primary: {
    background: '--xeg-color-primary',
    color: '--xeg-color-primary-foreground',
    backgroundHover: '--xeg-color-primary-hover',
  },
  
  // Secondary variant
  secondary: {
    background: '--xeg-color-secondary',
    color: '--xeg-color-secondary-foreground',
    backgroundHover: '--xeg-color-secondary-hover',
  },
  
  // ... 기타 variants
};
```

### 크기 토큰

```typescript
export const buttonSizeTokens = {
  sm: {
    height: '32px',
    padding: '8px 12px',
    fontSize: '14px',
  },
  md: {
    height: '40px',
    padding: '12px 16px',
    fontSize: '16px',
  },
  lg: {
    height: '48px',
    padding: '16px 20px',
    fontSize: '18px',
  },
};
```

## 접근성

### 필수 속성

- `iconOnly` 버튼은 반드시 `aria-label`을 제공해야 합니다
- 로딩 상태에서는 `aria-busy="true"`가 자동으로 설정됩니다
- 비활성화 상태에서는 `aria-disabled="true"`가 자동으로 설정됩니다

### 키보드 지원

- `Enter` 키: 버튼 활성화
- `Space` 키: 버튼 활성화
- `Tab` 키: 포커스 이동

### 색상 대비

모든 variant는 WCAG 2.1 AA 기준을 충족합니다:

- Primary: 4.5:1 이상
- Secondary: 4.5:1 이상
- Outline: 3:1 이상 (border)
- Ghost: 4.5:1 이상
- Danger: 4.5:1 이상

## 성능

### CSS 번들 크기

Button 컴포넌트 통합으로 인한 성능 개선:

- **이전**: 여러 CSS 파일 (ToolbarButton, IconButton, Button-legacy)
- **이후**: 단일 CSS 파일 (Button.module.css)
- **개선**: ~15% CSS 번들 크기 감소

### 런타임 성능

- 토큰 기반 스타일링으로 CSS-in-JS 오버헤드 제거
- 단일 컴포넌트로 번들 크기 최적화
- 일관된 렌더링 성능

## 테스트

### 단위 테스트

```tsx
import { render, fireEvent } from '@testing-library/preact';
import { Button } from '@shared/components/ui/Button';

test('버튼 클릭 이벤트', () => {
  const handleClick = vi.fn();
  const { getByRole } = render(
    <Button onClick={handleClick}>클릭</Button>
  );
  
  fireEvent.click(getByRole('button'));
  expect(handleClick).toHaveBeenCalled();
});
```

### 접근성 테스트

```tsx
test('iconOnly 버튼은 aria-label이 필요', () => {
  const { getByRole } = render(
    <Button iconOnly aria-label="설정">
      <Settings />
    </Button>
  );
  
  expect(getByRole('button')).toHaveAttribute('aria-label', '설정');
});
```

## 기여 가이드

### 새로운 variant 추가

1. `ButtonProps` 타입에 variant 추가
2. `buttonTokens`에 색상 토큰 정의
3. CSS Module에 스타일 추가
4. 테스트 작성
5. 문서 업데이트

### 디자인 토큰 변경

1. `src/shared/styles/tokens/button.ts` 수정
2. CSS 변수 매핑 확인
3. 시각적 회귀 테스트 실행
4. 접근성 대비 검증

## 변경 내역

### v0.2.4 (현재)

- 🎉 **Breaking Change**: ToolbarButton, IconButton, Button-legacy 통합
- ✨ iconOnly prop 추가
- 🔧 semantic design token 도입
- 📦 CSS 번들 크기 15% 감소
- ♿ 접근성 개선

### 마이그레이션 도구

자동 마이그레이션을 위해 제공된 codemod를 사용하세요:

```bash
node scripts/button-wrapper-codemod.cjs --apply
```

## 관련 링크

- [디자인 토큰 가이드](../design-tokens.md)
- [접근성 가이드](../accessibility.md)
- [컴포넌트 테스트 가이드](../testing.md)
