# Phase 9.5 진단 보고서 (업데이트)

**날짜**: 2025-10-08 **상태**: 진행 중 - JSX Transform 문제 해결 필요

## 발견된 문제

### 1. Import 경로 문제 (✅ 해결됨)

- **문제**: 22개 테스트 파일이 `.solid` 확장자로 파일을 import
- **해결**: PowerShell 스크립트로 일괄 변경
- **결과**: 실패 테스트 파일 51개 → 50개

### 2. JSX Transform 문제 (🔴 진행 중)

- **문제**: "React is not defined" 오류 발생
- **근본 원인**: Vitest가 JSX를 처리할 때 Solid의 JSX transform을 사용하지 않고
  React JSX transform을 사용
- **영향**: 407개 테스트 실패 (전체 1290개 중)

## 시도한 해결 방법

### 시도 1: @jsxImportSource 주석 제거

- **근거**: vite-plugin-solid가 자동으로 처리해야 함
- **결과**: 실패 (여전히 React is not defined)

### 시도 2: esbuild 설정 추가

```typescript
esbuild: {
  jsx: 'automatic',
  jsxImportSource: 'solid-js',
}
```

- **결과**: 실패 (esbuild는 Solid JSX를 제대로 지원하지 않음)

### 시도 3: solid 플러그인 옵션 조정

```typescript
solid({
  extensions: ['.tsx', '.ts', '.jsx', '.js'],
  hot: false,
  ssr: false,
});
```

- **결과**: 실패 (플러그인이 테스트 파일에 적용되지 않음)

### 시도 4: @jsxImportSource pragma 추가

```typescript
/** @jsxImportSource solid-js */
```

- **결과**: 실패

## 현재 상황 분석

1. **tsconfig.json**에는 `"jsxImportSource": "solid-js"` 설정됨
2. **vite-plugin-solid**는 vitest.config.ts에 포함됨
3. **babel-preset-solid**는 vite-plugin-solid의 dependency로 설치됨
4. 그럼에도 Vitest가 JSX를 변환할 때 React를 찾음

### 가능한 원인

1. Vitest의 변환 파이프라인이 vite-plugin-solid를 거치지 않음
2. esbuild가 기본 transformer로 사용되어 babel을 우회함
3. 플러그인 적용 순서 또는 조건 문제

## 다음 시도 방안

### 방안 A: @vitejs/plugin-react 제거 확인

- React 플러그인이 잔재로 남아있을 가능성 확인

### 방안 B: vitest transform 설정 명시

```typescript
test: {
  transformMode: {
    web: [/\.[jt]sx?$/],
  },
}
```

### 방안 C: babel.config.js 추가

```javascript
module.exports = {
  presets: ['babel-preset-solid'],
};
```

### 방안 D: 실제 작동하는 Solid + Vitest 프로젝트 참조

- solid-start의 vitest 설정 확인
- solidjs/solid-testing-library 예제 참조

### 방안 E: Manual JSX (h 함수) 사용

- JSX를 h() 함수 호출로 수동 변환
- 가장 확실하지만 가장 노동 집약적

## 권장 다음 단계

1. ✅ **즉시**: package.json에서 React 관련 의존성 완전 제거 확인
2. ⏭️ **단기**: babel.config.js 추가 (방안 C)
3. ⏭️ **중기**: 만약 B-C가 실패하면, solidjs/templates의 vitest 설정을 그대로
   복사
4. ⏭️ **최후**: Manual JSX 변환 도구 작성

## 참고 링크

- [Solid Testing Library](https://github.com/solidjs/solid-testing-library)
- [vite-plugin-solid](https://github.com/solidjs/vite-plugin-solid)
- [Vitest JSX/TSX support](https://vitest.dev/guide/common-errors.html)

## 현재 통계

- 전체 테스트: 1290개
- 통과: 843개 (65.3%)
- 실패: 407개 (31.6%)
- 건너뜀: 39개
- 실패 주요 원인: React is not defined

## 시간 소요

- Import 경로 수정: ~30분
- JSX Transform 문제 해결 시도: ~2시간 (진행 중)
