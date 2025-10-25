# test/unit/policies

정책 검증 테스트 모음

## 목적

코드베이스 내 일관된 패턴과 정책 준수를 자동으로 검증합니다. 파일 내용을
분석하여 anti-pattern을 감지하고 권장 패턴 준수 여부를 검증합니다.

## 파일 구성

### 1. reactive-evaluation.test.ts

**목적**: Solid.js 반응성 정책 검증

- LazyIcon 컴포넌트가 getter 함수를 사용하여 props 기반 값을 동적으로 평가하는지
  확인
- 정적 평가(static evaluation) anti-pattern 감지
- 반응성 유지를 위한 getter 함수 강제

**정책**: Props는 시간에 따라 변할 수 있으므로, 정적으로 평가하지 말고 getter
함수를 사용하여 fine-grained reactivity 유지

### 2. direct-comparison.test.ts

**목적**: Solid.js 최적화 정책 검증

- Toolbar 컴포넌트가 간단한 비교식을 JSX에서 직접 사용하는지 확인
- 불필요한 `createMemo` 사용 감지
- 복잡한 계산은 memoization 허용

**정책**: 간단한 비교식(`props.x > 0`)은 `createMemo` 없이 JSX에서 직접 사용
가능 (Solid.js가 자동으로 의존성 추적)

### 3. signal-selector-validation.test.ts

**목적**: 신호 선택자 메모이제이션 정책 검증 (통합)

- `useSelector`를 통한 일관된 파생값 메모이제이션 확인
- Toast, Toolbar, VerticalImageItem의 selector 사용 패턴 검증
- 의존성 추적 및 캐싱 동작 확인

**포함 테스트**:

- Toast Container: `limitedToasts` selector
- Toolbar: `toolbarDataState`, `enhancedToolbarState` selectors
- VerticalImageItem: `fitModeClass`, `containerClasses` selectors

**정책**: 파생값은 `useSelector`를 사용한 메모이제이션으로 성능 최적화

## 통합 배경

이전 파일 구조:

- `test/unit/components/lazy-icon-memo.test.tsx`
- `test/unit/components/toolbar-memo.test.tsx`
- `test/unit/components/toast-container-selector.test.tsx`
- `test/unit/components/toolbar-selector.test.tsx`
- `test/unit/components/vertical-image-item-selector.test.tsx`

**이동 이유**:

- UI 컴포넌트 테스트와 정책 검증의 명확한 구분
- 정책 검증 테스트가 렌더링 테스트가 아님
- readFileSync를 통한 코드 분석 기반 테스트

**통합 이유**:

- `signal-selector` 3개 파일: 동일한 정책 검증 (메모이제이션)
- 불필요한 파일 분산 제거
- 관련 정책을 한 곳에서 관리

## 실행 방법

```bash
# 개별 정책 테스트 실행
npm run test:unit -- test/unit/policies/reactive-evaluation.test.ts
npm run test:unit -- test/unit/policies/direct-comparison.test.ts
npm run test:unit -- test/unit/policies/signal-selector-validation.test.ts

# 모든 정책 테스트
npm run test:unit test/unit/policies

# 린트 프로젝트에 포함
npm run test:lint
```

## 추가 정책 테스트 작성 가이드

새로운 정책 검증 테스트를 추가할 때:

1. **파일명**: `<policy-name>.test.ts` (kebab-case)
2. **위치**: `test/unit/policies/`
3. **구조**:

   ```typescript
   import { describe, it, expect } from 'vitest';
   import { readFileSync } from 'node:fs';
   import { join } from 'node:path';

   describe('<Policy Name> Policy', () => {
     it('should follow policy rule', () => {
       const filePath = join(process.cwd(), 'src/path/to/file.tsx');
       const content = readFileSync(filePath, 'utf-8');
       // 정책 검증 로직
     });
   });
   ```

## 참고

- `CODING_GUIDELINES.md`: 일반 코딩 규칙
- `ARCHITECTURE.md`: 구조 및 계층 규칙
- `TESTING_STRATEGY.md`: 테스트 전략
