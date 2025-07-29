/**
 * @fileoverview Vendor API 타입 정의
 * @description Phase C: vendor-api.ts의 any 타입 대체를 위한 구체적인 타입들
 */

/**
 * Preact 컴포넌트 타입 (범용)
 */
export type PreactComponent<P = Record<string, unknown>> = (props: P) => unknown;

/**
 * Memo 비교 함수 타입
 */
export type MemoCompareFunction<P = Record<string, unknown>> = (
  prevProps: P,
  nextProps: P
) => boolean;

/**
 * ForwardRef 컴포넌트 타입 (범용)
 */
export type ForwardRefComponent<P = Record<string, unknown>> = (props: P, ref: unknown) => unknown;

/**
 * Vendor 초기화 상태
 */
export interface VendorInitState {
  preact: boolean;
  fflate: boolean;
  motion: boolean;
  motionOne: boolean;
}

/**
 * Vendor API 에러 타입
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
