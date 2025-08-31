# GitHub Copilot 개발 지침 (X.com Enhanced Gallery 맞춤)

이 파일은 X.com Enhanced Gallery 유저스크립트 프로젝트의 컨텍스트에 맞춰
Copilot/AI 에이전트가 TDD 중심으로 안전하게 코드를 생성·수정하도록 가이드합니다.

## 프로젝트 개요

**프로젝트**: X.com Enhanced Gallery - 미디어 뷰어 및 다운로드 기능 유저스크립트
**기술 스택**: TypeScript + Preact + @preact/signals + fflate + Vite + Vitest
**빌드 환경**: Vite (유저스크립트 번들링), Tampermonkey API **아키텍처**: Clean
Architecture (features/shared 구조)

## 핵심 목표

- **TDD 우선**: RED→GREEN→REFACTOR 사이클 강제
- **TypeScript strict**: 명시적 타입과 엄격한 타입 검사
- **Vendor 시스템**: 외부 라이브러리는 안전한 getter로 래핑
- **네임스페이스 스타일**: `xeg-` 접두사로 스타일 격리
- **유저스크립트 안정성**: 재실행 안전, TDZ 문제 해결

## 적용 범위

- **주 대상**: `src/` 소스 코드, `test/` 테스트, `dist/` 번들 문제
- **특별 관리**: 유저스크립트 전역 부작용, vendor 의존성, 스타일 중복 삽입

## 기본 원칙

### 1. TDD 필수

- 모든 변경은 테스트 먼저 작성 (`test/` 아래)
- RED → GREEN → REFACTOR 순서 준수
- 테스트 카테고리: `unit/`, `integration/`, `refactoring/`, `behavioral/`

### 2. TypeScript 엄격성

- strict 모드 준수, 명시적 타입 선언
- `@/`, `@features/`, `@shared/` 경로 별칭 사용
- `noImplicitAny: false` (테스트 환경에서만 완화)

### 3. Vendor 시스템 (중요)

- 외부 라이브러리 직접 import 금지
- **경로**: `src/shared/external/vendors/`
- **사용**: `vendor-api-safe.ts`의 안전한 getter 함수들
- **예**: preact, @preact/signals, fflate → vendor getter 사용

### 4. 네임스페이스 스타일 시스템

- **전역 부작용 방지**: `initializeNamespacedStyles()` 함수 사용
- **네임스페이스**: `xeg-` 접두사로 스타일 격리
- **위치**: `src/shared/styles/namespaced-styles.ts`
- **재실행 안전**: 중복 생성 방지, 기존 스타일 교체

## 권장 파일 및 패턴

### Vendor 시스템

- **경로**: `src/shared/external/vendors/`
- **주요 파일**: `vendor-api-safe.ts`, `vendor-manager-static.ts`
- **계약**: 각 vendor는 안전한 getter와 TDZ 문제 해결
- **예시**:

  ```typescript
  // ❌ 직접 import 금지
  import { h, render } from 'preact';

  // ✅ vendor getter 사용
  import { getPreactSafe } from '@shared/external/vendors/vendor-api-safe';
  const { h, render } = getPreactSafe();
  ```

### 스타일 초기화

- **파일**: `src/shared/styles/namespaced-styles.ts`
- **함수**: `initializeNamespacedStyles()`
- **동작**:
  - document 없으면 no-op
  - 동일 id 있으면 기존 스타일 교체
  - `xeg-` 네임스페이스 적용
- **디자인 토큰**: `src/shared/styles/design-tokens.css`

### 초기화 서비스

- **파일**: `src/shared/services/service-initialization.ts`
- **역할**: 앱 초기화, vendor 초기화, 스타일 초기화
- **에러 처리**: `src/shared/logging/logger.ts`로 표준화

## TDD 테스트 구조

### 테스트 카테고리 (실제 프로젝트 구조)

- **unit/**: 단위 테스트
- **integration/**: 통합 테스트
- **refactoring/**: 리팩토링 검증
- **behavioral/**: 사용자 행동 시나리오
- **performance/**: 성능 테스트

### 권장 테스트 위치

- **Vendor 시스템**: `test/unit/shared/fix-vendor-initialization.test.ts`
- **스타일 초기화**: `test/refactoring/styles-init.spec.ts`
- **네임스페이스**: `test/unit/shared/namespaced-styles.test.ts`

### Vendor Mocking

- **Mock 시스템**: `test/utils/mocks/vendor-mocks-clean.ts`
- **설정**: `setupVendorMocks()`, `cleanupVendorMocks()`
- **환경**: JSDOM + Vitest

## 작업 계약 (실제 함수 기반)

### initializeNamespacedStyles

```typescript
// 위치: src/shared/styles/namespaced-styles.ts
function initializeNamespacedStyles(): void;
```

- **입력**: 없음
- **출력**: void (부작용으로 스타일 주입)
- **실패**: document 없으면 no-op
- **중복 방지**: 기존 `#xeg-namespaced-styles` 교체

### vendor-api-safe

```typescript
// 위치: src/shared/external/vendors/vendor-api-safe.ts
export function getPreactSafe(): PreactAPI;
export function getFflateSafe(): FflateAPI;
export function getPreactSignalsSafe(): PreactSignalsAPI;
```

- **입력**: 없음
- **출력**: 타입 안전한 API 객체
- **TDZ 해결**: 정적 import 기반 안전한 초기화

## 프로젝트별 규칙

### 1. Clean Architecture 레이어

- `src/features/`: 기능별 모듈 (갤러리, 설정 등)
- `src/shared/`: 공통 기능 (이전 core 포함)
- **의존성 방향**: features → shared (역방향 금지)

### 2. ESLint 강제 규칙

- vendor 직접 import 금지 (`eslint.config.js` 설정)
- 3단계 이상 상대 경로 금지
- 순환 참조 방지 (`dependency-cruiser`)

### 3. 유저스크립트 특성

- **번들링**: Vite로 단일 파일 생성
- **Tampermonkey API**: `GM_*` 함수 사용
- **전역 오염 방지**: 네임스페이스와 격리
- **재실행 안전**: 페이지 새로고침 시 안전

### 4. 성능 고려사항

- **지연 로딩**: 필요시에만 vendor 초기화
- **메모리 관리**: cleanup 함수 제공
- **CSS 최적화**: 디자인 토큰 시스템 활용

## 개발 워크플로우

### 작업 단위 (작은 PR)

1. **기능별 분리**: 하나의 PR은 하나의 책임만
2. **테스트 우선**: RED → GREEN → REFACTOR
3. **타입 체크**: `npx tsc -p tsconfig.json --noEmit`
4. **테스트 실행**: `npm run test -- --run --dir test/refactoring`

### 검증 체크리스트 (머지 전)

- [ ] 관련 테스트 추가/수정, 통과
- [ ] TypeScript 컴파일 에러 없음
- [ ] ESLint 규칙 준수
- [ ] Vendor getter 시스템 사용
- [ ] 네임스페이스 스타일 적용
- [ ] 재실행 안전성 확보

## 에러 처리 및 로깅

### 표준 로깅

- **위치**: `src/shared/logging/logger.ts`
- **사용**: 모든 에러를 표준화된 방식으로 기록
- **테스트**: logger spy/mock 가능

### 초기화 에러

```typescript
// ✅ 권장 패턴
try {
  await initializeVendorsSafe();
  initializeNamespacedStyles();
} catch (error) {
  logger.error('초기화 실패:', error);
  // fallback 로직
}
```

## 특별 주의사항

### TDZ (Temporal Dead Zone) 문제

- **문제**: 동적 import와 번들링 충돌
- **해결**: `vendor-manager-static.ts`의 정적 초기화
- **테스트**: `test/integration/vendor-tdz-resolution.test.ts`

### 스타일 중복 방지

- **문제**: 유저스크립트 재실행 시 스타일 중복
- **해결**: id 기반 중복 검사 및 교체
- **테스트**: 스타일 초기화 테스트 필수

### 의존성 관리

- **도구**: dependency-cruiser로 의존성 그래프 관리
- **규칙**: 순환 참조 금지, 레이어 의존성 준수
- **검증**: `npm run deps:check`

## 마무리

이 프로젝트는 **유저스크립트의 안정성과 재사용성**을 최우선으로 합니다. 위
규칙을 따르는 PR을 우선 검토하며, TDD와 vendor 시스템을 준수하는 코드 변경을
권장합니다.
