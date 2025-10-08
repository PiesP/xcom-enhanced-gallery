# Phase 9.5 진단 및 분석 보고서

## 날짜

2025-10-08

## 현황

- **빌드 상태**: ✅ 정상 (Dev 1,031.79 KB, Prod 331.86 KB)
- **테스트 상태**: ⚠️ 부분 실패 (106개 통과, 51개 실패)
- **실패 원인**: JSX 변환 시 "React is not defined" 에러

## 문제 진단

### 초기 가설 (부정확)

- ❌ "테스트 파일이 React 기반으로 작성되어 Solid.js로 마이그레이션 필요"
- 실제로 실패한 테스트 파일들은 이미 `@solidjs/testing-library`를 사용 중

### 실제 문제

- ✅ **Vitest 환경에서 JSX 변환이 React를 찾고 있음**
- 원인: `vite-plugin-solid`가 Vitest 3.x 환경에서 제대로 작동하지 않음
- 빌드는 정상 작동하나 테스트만 실패

### 시도한 해결책들

1. **vitest.config.ts - Solid 플러그인 설정 조정**
   - `solid()` 옵션: `dev: false`, `generate: 'dom'`, `hydratable: false`
   - `include`, `extensions` 추가
   - 결과: ❌ 실패

2. **ts config.json - jsxImportSource 수정**
   - `"jsxImportSource": "solid-js"` 제거/복원
   - 결과: ❌ 실패 (경고만 사라짐, 에러는 동일)

3. **esbuild 설정 조정**
   - `esbuild: false` (완전 비활성화)
   - `esbuild: { jsx: 'preserve' }`
   - `optimizeDeps.esbuildOptions.jsx: 'preserve'`
   - 결과: ❌ 실패

4. **플러그인 순서 조정**
   - `solid()` 플러그인을 최우선으로 배치
   - `xeg-log-config`를 post로 변경
   - 결과: ❌ 실패

5. **테스트 파일 pragma 추가/제거**
   - `/** @jsxImportSource solid-js */` 추가
   - 결과: ❌ 실패 (동일한 경고 발생)

### 근본 원인 분석

**Vitest 3.x + vite-plugin-solid 2.x 통합 문제**

1. **Vite의 플러그인 처리**:
   - 빌드 시: vite.config.ts의 `solid()` 플러그인이 Babel을 통해 JSX를
     Solid.js로 변환
   - 정상 작동 ✅

2. **Vitest의 플러그인 처리**:
   - 테스트 시: vitest.config.ts의 `solid()` 플러그인이 제대로 작동하지 않음
   - tsconfig.json의 `jsxImportSource`를 보고 React의 automatic JSX transform
     시도
   - Solid 플러그인의 Babel 변환이 적용되지 않음
   - 실패 ❌

3. **경고 메시지**:
   ```
   [vite] (client) warning: The JSX import source cannot be set without also enabling React's "automatic" JSX transform
   ```

## 해결 방안 (미구현)

### 옵션 A: Vitest transform 직접 설정

**복잡도**: 중간 **리스크**: 중간

1. `@swc/core` 설치 및 vitest.config.ts에 transform 설정:

   ```typescript
   test: {
     transform: {
       '^.+\\.(ts|tsx)$': ['@swc/core', {
         jsc: {
           parser: { syntax: 'typescript', tsx: true },
           transform: {
             react: { runtime: 'automatic', importSource: 'solid-js' }
           }
         }
       }]
     }
   }
   ```

2. 또는 `@babel/core` + `babel-preset-solid` 사용

**장점**: 명시적이고 제어 가능 **단점**: 추가 의존성, 설정 복잡도 증가

### 옵션 B: Vitest 버전 다운그레이드

**복잡도**: 낮음 **리스크**: 높음

- Vitest 2.x로 다운그레이드하여 vite-plugin-solid 호환성 확인
- 단점: 최신 기능 및 버그 수정 포기

### 옵션 C: Solid-Start 테스트 설정 참고

**복잡도**: 중간 **리스크**: 낮음

- Solid-Start 프로젝트의 vitest 설정 방식 참고
- 커뮤니티에서 검증된 방법 사용

### 옵션 D: Browser 모드 사용

**복잡도**: 높음 **리스크**: 중간

- Vitest의 browser 모드로 전환
- 실제 브라우저 환경에서 테스트 (Playwright/WebDriver)
- 단점: 테스트 속도 저하, 설정 복잡도 대폭 증가

## 현재 상태 (106개 통과 분석 필요)

**의문점**: 106개의 테스트 파일이 통과하는데, 이들은 어떻게 작동하는가?

**가설**:

1. JSX를 사용하지 않는 순수 TypeScript 테스트
2. JSX를 사용하지만 다른 방식으로 작성 (h() 함수 등)
3. 특정 조건에서만 JSX 변환이 실패

**필요 작업**:

- 통과한 테스트 파일 중 JSX 사용 여부 확인
- 실패한 테스트와 통과한 테스트의 차이점 분석

## 권장 사항

### 단기 (Phase 9.5)

1. **Phase 9.5 목표 재정의**:
   - 변경 전: "React 기반 테스트 마이그레이션"
   - 변경 후: "Vitest JSX Transform 설정 수정"

2. **옵션 A (Vitest transform) 구현**:
   - 가장 명확하고 제어 가능한 방법
   - @swc/core 또는 Babel 사용

3. **통과한 테스트 분석**:
   - 106개 통과 테스트의 패턴 파악
   - 동일한 패턴을 다른 테스트에 적용 가능한지 확인

### 중기

1. **Vite/Vitest 업그레이드 추적**:
   - vite-plugin-solid + Vitest 호환성 이슈 추적
   - 커뮤니티 해결책 모니터링

2. **테스트 전략 재평가**:
   - JSX 사용 테스트와 JSX 없는 테스트 분리
   - 컴포넌트 테스트 vs 로직 테스트 전략

## 변경 사항 롤백

현재 vitest.config.ts와 tsconfig.json은 **원래 상태로 복원됨**:

- Solid 플러그인: 간단한 `solid({ dev: false })` 유지
- tsconfig.json: `jsxImportSource: "solid-js"` 유지
- esbuild: 기본 설정 유지

## 다음 단계

1. **Phase 9.5 문서 업데이트**:
   - TDD_REFACTORING_PLAN.md에 올바른 문제 진단 반영
   - 해결 방안 옵션 추가

2. **옵션 A 구현 시도**:
   - @swc/core 또는 Babel transform 설정
   - 단일 테스트 파일로 검증

3. **통과 테스트 분석**:
   - 106개 파일 중 JSX 사용 파일 식별
   - 패턴 분석 및 적용 가능성 평가
