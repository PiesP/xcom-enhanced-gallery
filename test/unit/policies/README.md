<<<<<<< Updated upstream

# test/unit/policies

정책 검증 테스트 모음
=======

# Policies Tests (test/unit/policies)

정책 검증 및 코딩 규칙 테스트 모음

> 최종 업데이트: 2025-10-25 (Phase 188)
> 이 디렉토리는 단순 테스트가 아니라 코드베이스 정책/규칙 검증에 초점을 맞춥니다.
>>>>>>> Stashed changes

## 목적

코드베이스 내 일관된 패턴과 정책 준수를 자동으로 검증합니다. 파일 내용을
분석하여 anti-pattern을 감지하고 권장 패턴 준수 여부를 검증합니다.

<<<<<<< Updated upstream

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

=======

## 📋 파일 구성

### 경로 & 별칭

- `alias-resolution.test.ts`: Vite 경로 별칭 (@features, @shared, @assets) 해석 검증
  - **정책**: 경로 별칭을 일관되게 사용하고, 정확히 해석되는지 확인

### Solid.js 반응성 & 최적화

1. **reactive-evaluation.test.ts**: Solid.js 반응성 정책 검증
   - LazyIcon 컴포넌트가 getter 함수로 props 기반 값 동적 평가
   - 정적 평가 anti-pattern 감지
   - **정책**: Props는 시간에 따라 변할 수 있으므로 getter 사용 강제

2. **direct-comparison.test.ts**: Solid.js 최적화 정책
   - Toolbar가 간단한 비교식을 JSX에서 직접 사용하는지 확인
   - 불필요한 `createMemo` 사용 감지
   - **정책**: 간단한 비교식(`props.x > 0`)은 `createMemo` 없이 JSX에서 직접 사용 가능

3. **signal-selector-validation.test.ts**: 신호 선택자 메모이제이션 (통합)
   - Toast, Toolbar, VerticalImageItem의 selector 사용 패턴 검증
   - **정책**: 파생값은 `useSelector`를 사용한 메모이제이션으로 성능 최적화

### 스타일 & 디자인

- **design-token-policy.test.ts**: 디자인 토큰 (색상/크기) 사용 검증
- **bundle-size-policy.test.ts**: 번들 크기 제한 검증 (420 KB 제한)
- **video-item.cls.test.ts**: CSS 모듈 import 유형 검증
- **VerticalGalleryView.inline-style.policy.test.ts**: 인라인 스타일 금지 검증
- **VerticalImageItem.inline-style.policy.test.ts**: 인라인 스타일 금지 검증
- **정책**: CSS는 CSS Modules 또는 디자인 토큰으로만 사용, 인라인 스타일 금지

### 입력 이벤트

- **pc-only-events-policy.test.ts**: PC 전용 이벤트 정책 검증
- **정책**: Touch/Pointer 이벤트 금지, PC 이벤트만 사용 (click, keydown, wheel 등)

### Toolbar 로직 & i18n

- **gallery-toolbar-logic-pattern.test.ts**: Toolbar 로직 패턴 검증 (props 전달 방식)
- **i18n.message-keys.test.ts**: i18n 메시지 키 사용 검증
- **i18n.missing-keys.test.ts**: i18n 누락 키 감지 검증
- **정책**: 모든 사용자 대면 텍스트는 i18n 키로 관리, 하드코딩 금지

## 🔄 Phase 188에서 추가됨

### 새로운 파일들

이 파일들은 Phase 188에서 다른 디렉토리에서 이동되었습니다:

1. **alias-resolution.test.ts** ← `test/unit/alias/`
2. **i18n.message-keys.test.ts** ← `test/unit/i18n/`
3. **i18n.missing-keys.test.ts** ← `test/unit/i18n/`
4. **gallery-toolbar-logic-pattern.test.ts** ← `test/unit/hooks/` (통합)

**이유**:

- 경로 및 구성 검증 테스트 중앙화
- i18n 정책 테스트 통합
- 활성 파일과 정책 테스트의 명확한 구분

## ✅ 실행 방법
>>>>>>>
>>>>>>> Stashed changes

```bash
# 개별 정책 테스트 실행
npm run test:unit -- test/unit/policies/reactive-evaluation.test.ts
<<<<<<< Updated upstream
npm run test:unit -- test/unit/policies/direct-comparison.test.ts
npm run test:unit -- test/unit/policies/signal-selector-validation.test.ts
=======
>>>>>>> Stashed changes

# 모든 정책 테스트
npm run test:unit test/unit/policies

<<<<<<< Updated upstream
# 린트 프로젝트에 포함
npm run test:lint
```

## 추가 정책 테스트 작성 가이드

새로운 정책 검증 테스트를 추가할 때
=======

# 스타일/정책 프로젝트

npm run test:styles

# lint 프로젝트에 포함

npm run test:lint

```

## 📖 새로운 정책 테스트 작성 가이드
>>>>>>> Stashed changes

1. **파일명**: `<policy-name>.test.ts` (kebab-case)
2. **위치**: `test/unit/policies/`
3. **구조**:

<<<<<<< Updated upstream
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
=======

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

## 📚 참고

- `docs/CODING_GUIDELINES.md`: 일반 코딩 규칙
- `docs/ARCHITECTURE.md`: 구조 및 계층 규칙
- `docs/TESTING_STRATEGY.md`: 테스트 전략
- `docs/TDD_REFACTORING_PLAN.md`: Phase 188 기록

---

**최종 상태**: Phase 188 완료, 모든 정책 테스트 통합 및 중앙화
>>>>>>> Stashed changes
