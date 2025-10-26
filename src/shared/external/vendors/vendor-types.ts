/**
 * @fileoverview Vendor API 타입 정의
 * @description 외부 라이브러리(Solid.js, fflate 등)의 타입 안전성 정의
 * @version 11.0.0 - Phase 200: 주석 명확화, 불필요한 타입 제거
 */

type SolidJSXElement = import('solid-js').JSX.Element;

/**
 * 제네릭 컴포넌트 타입 (범용)
 */
export type PreactComponent<P = Record<string, unknown>> = ((
  props: P
) => SolidJSXElement | null) & {
  displayName?: string;
};

/**
 * Memo 비교 함수: 이전 props와 다음 props를 비교하여 재렌더링 필요 여부 결정
 */
export type MemoCompareFunction<P = Record<string, unknown>> = (
  prevProps: P,
  nextProps: P
) => boolean;

/**
 * ForwardRef 컴포넌트: ref 전달을 지원하는 컴포넌트 타입
 */
export type ForwardRefComponent<P = Record<string, unknown>> = (
  props: P,
  ref: unknown
) => SolidJSXElement | null;

/**
 * Vendor 초기화 상태 추적
 */
export interface VendorInitState {
  preact: boolean;
  fflate: boolean;
  motion: boolean;
  motionOne: boolean;
}

/**
 * Vendor 초기화 오류 정보
 */
export interface VendorError {
  vendor: keyof VendorInitState;
  message: string;
  originalError?: Error;
}

/**
 * 안전한 vendor 함수 래퍼
 */
export type SafeVendorFunction<T extends (...args: unknown[]) => unknown> = (
  ...args: Parameters<T>
) => ReturnType<T> | null;

/**
 * Preact compat 타입 정의
 */
export interface PreactCompat {
  memo: <P = Record<string, unknown>>(
    Component: PreactComponent<P>,
    compare?: MemoCompareFunction<P>
  ) => PreactComponent<P>;

  forwardRef: <P = Record<string, unknown>>(
    Component: ForwardRefComponent<P>
  ) => PreactComponent<P>;
}
