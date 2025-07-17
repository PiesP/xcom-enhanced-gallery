/**
 * @fileoverview CSS Modules 타입 정의
 * @description CSS 모듈과 디자인 토큰에 대한 타입 안전성 제공
 * @version 2.0.0
 */

declare module '*.module.css' {
  const classes: Readonly<Record<string, string>>;
  export default classes;
}

declare module '*.module.scss' {
  const classes: Readonly<Record<string, string>>;
  export default classes;
}

declare module '*.module.sass' {
  const classes: Readonly<Record<string, string>>;
  export default classes;
}

// CSS 변수 전용 모듈
declare module '*.css' {
  const content: string;
  export default content;
}

// 디자인 토큰 타입 정의
export interface DesignTokens {
  readonly colors: {
    readonly primary: Record<string, string>;
    readonly neutral: Record<string, string>;
    readonly semantic: Record<string, string>;
    readonly overlay: Record<string, string>;
  };
  readonly spacing: Record<string, string>;
  readonly typography: Record<string, string>;
  readonly radius: Record<string, string>;
  readonly shadow: Record<string, string>;
  readonly zIndex: Record<string, number>;
  readonly animation: Record<string, string>;
}

// CSS 변수 접근 타입
export interface CSSVariables {
  // 색상 변수
  '--xeg-color-primary': string;
  '--xeg-color-surface': string;
  '--xeg-color-overlay-strong': string;
  '--xeg-color-text-primary': string;
  '--xeg-color-text-secondary': string;

  // 간격 변수
  '--xeg-spacing-xs': string;
  '--xeg-spacing-sm': string;
  '--xeg-spacing-md': string;
  '--xeg-spacing-lg': string;
  '--xeg-spacing-xl': string;

  // 타이포그래피 변수
  '--xeg-font-size-xs': string;
  '--xeg-font-size-sm': string;
  '--xeg-font-size-base': string;
  '--xeg-font-size-lg': string;
  '--xeg-font-size-xl': string;

  // z-index 변수
  '--xeg-z-modal': string;
  '--xeg-z-gallery': string;
  '--xeg-z-toast': string;

  // 애니메이션 변수
  '--xeg-duration-fast': string;
  '--xeg-duration-normal': string;
  '--xeg-duration-slow': string;
  '--xeg-easing-easeOut': string;
  '--xeg-easing-easeInOut': string;
}

// 컴포넌트 스타일 Props 타입
export interface ComponentStyleProps {
  className?: string;
  style?: React.CSSProperties;
  'data-theme'?: 'light' | 'dark' | 'auto';
  'data-state'?: string;
  'data-variant'?: string;
}

// 갤러리 전용 클래스명 타입
export type GalleryClassNames =
  | 'xeg-gallery-container'
  | 'xeg-gallery-overlay'
  | 'xeg-gallery-toolbar'
  | 'xeg-gallery-viewer'
  | 'xeg-gallery-nav-left'
  | 'xeg-gallery-nav-right'
  | 'xeg-gallery-counter'
  | 'xeg-gallery-thumbnails';

// BEM 방법론을 위한 유틸리티 타입
export type BEMElement<B extends string, E extends string> = `${B}__${E}`;
export type BEMModifier<B extends string, M extends string> = `${B}--${M}`;
export type BEMClass<B extends string, E extends string = never, M extends string = never> =
  | B
  | ([E] extends [never] ? never : BEMElement<B, E>)
  | ([M] extends [never] ? never : BEMModifier<B, M>);
