/**
 * 빌드 타임 전역 변수 — vite.config.ts에서 정의됨
 * Vite의 define 플러그인으로 주입되며, tree-shaking 최적화를 위해
 * import.meta.env 대신 직접 전역 변수로 사용됨.
 */

/** 개발 모드 여부 (true: npm run build:dev, false: npm run build:prod) */
declare const __DEV__: boolean;

/** 프로덕션 모드 여부 (__DEV__의 역) */
declare const __PROD__: boolean;

/** 프로젝트 버전 (package.json에서 읽음) */
declare const __VERSION__: string;
