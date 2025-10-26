# types/ — 전역 타입 정의

> TypeScript 전역 환경 및 공유 타입 선언

## 개요

`types/` 루트 디렉토리는 **전역 빌드 환경 변수**와 **제3자 라이브러리 타입
보강**을 담당합니다. 도메인별 비즈니스 타입은 `src/shared/types/`에서
관리합니다.

## 파일 구조

```
types/
├── env.d.ts        # 빌드 타임 전역 변수 (__DEV__, __PROD__, __VERSION__)
└── README.md       # 이 문서
```

## env.d.ts

**용도**: Vite define 플러그인으로 주입되는 전역 변수 선언

**변수**:

- `__DEV__: boolean` — 개발 모드 (npm run build:dev)
- `__PROD__: boolean` — 프로덕션 모드 (npm run build:prod)
- `__VERSION__: string` — 프로젝트 버전 (package.json)

**사용 예**:

```typescript
// src/shared/logging/logger.ts
const isDev = __DEV__; // Tree-shaking 최적화를 위해 import.meta.env 대신 사용

if (__DEV__) {
  console.log(`App v${__VERSION__} running in development`);
}
```

**특징**:

- **Tree-shaking 최적화**: `import.meta.env`보다 정적 분석에 유리
- **타입 안정성**: TypeScript의 정적 검증 지원
- **빌드 주입**: `vite.config.ts`의 `define` 플러그인에서 자동 주입

### 정의 위치

`vite.config.ts`의 `define` 옵션:

```typescript
define: {
  __DEV__: JSON.stringify(isDev),
  __PROD__: JSON.stringify(isProd),
  __VERSION__: JSON.stringify(pkg.version),
}
```

## 타입 관리 정책

### ✅ types/ 루트에 배치하는 경우

- 전역 빌드 환경 변수 (env.d.ts)
- 제3자 라이브러리 타입 보강 (필요시)

### ✅ src/shared/types/ 에 배치하는 경우

- 도메인 비즈니스 타입 (app.types.ts, media.types.ts)
- 핵심 타입 (core/extraction.types.ts, core/media.types.ts)
- Features 특화 타입 (settings/types/, gallery/types/)

### 자세한 내용

- 타입 정의 가이드: [`docs/CODING_GUIDELINES.md`](../docs/CODING_GUIDELINES.md)
- 아키텍처: [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md)

## TypeScript 설정

`tsconfig.json`에서 `types/` 포함:

```jsonc
{
  "include": ["src/**/*", "types/**/*", "playwright/**/*", ...]
}
```

---

**최종 업데이트**: 2025-10-26 (Phase 190: types/ 정리 및 현대화)
