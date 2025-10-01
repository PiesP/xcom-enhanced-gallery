# Legacy Codemod 변환 리포트

- **실행 시간**: 2025. 10. 1. 오후 7:20:22
- **모드**: 실제 변환 (False Positive 수동 수정 완료)

## 요약

- 전체 파일: 263개
- 초기 변경: 11개 (4개 파일)
- False Positive: 11개 (모두 되돌림)
- 실제 레거시 패턴: 0개
- 건너뛴 파일: 259개

## False Positive 분석

Codemod가 다음과 같은 false positive를 생성했으며, 모두 수동으로 수정되었습니다:

### 1. **DOM 속성 `.value`를 함수 호출로 변환**

- `src\features\settings\solid\SolidSettingsPanel.solid.tsx`
  - `target.value` → `target()` (HTMLSelectElement)
  - `option.value` → `option()` (일반 객체)
  - 수정: DOM 속성은 `.value` 그대로 유지

### 2. **일반 객체 속성 `.value`를 함수 호출로 변환**

- `src\shared\loader\progressive-loader.ts`
  - `entry.value` → `entry()` (RegisteredFeature 객체)
  - 수정: 일반 객체 속성은 `.value` 그대로 유지

### 3. **DOM Attr 객체 `.value`를 함수 호출로 변환**

- `src\shared\media\pipeline.ts`
  - `attr.value` → `attr()` (Attr 인터페이스)
  - 수정: DOM Attr는 `.value` 그대로 유지

### 4. **기존 Preact Signal 컴포넌트의 `.value`를 함수 호출로 변환**

- `src\shared\components\ui\SettingsModal\SettingsModal.tsx`
  - `element.value` → `element()` (HTMLSelectElement)
  - 수정: DOM 요소는 `.value` 그대로 유지

## 결론

현재 Codemod의 false positive 필터링이 다음과 같은 경우를 제대로 처리하지
못합니다:

1. **DOM 요소의 `.value` 속성** (HTMLInputElement, HTMLSelectElement 등)
2. **일반 TypeScript 객체의 `.value` 속성**
3. **DOM API의 `.value` 속성** (Attr 등)

### 개선 필요 사항

`scripts/legacy-codemod.ts`의 `shouldSkipTransform()` 함수에 다음 로직을
추가해야 합니다:

1. **타입 체크**: 표현식의 타입이 HTML 요소인지 확인
2. **DOM API 체크**: Attr, Node 등 DOM 인터페이스인지 확인
3. **객체 리터럴 체크**: Signal이 아닌 일반 객체의 속성인지 확인

### 현재 상태

- 128개 AUTO 패턴 중 실제로 변환 가능한 패턴: **0개**
- 대부분의 `.value` 사용이 DOM 속성이거나 일반 객체 속성
- **SOLID-NATIVE-001** Epic에서 이미 대부분의 Signal → 네이티브 변환이 완료됨
