/**
 * @fileoverview Type Safety Helper Functions
 * @version 3.0.0 - 완전히 재작성, 중복 제거
 * @description exactOptionalPropertyTypes와 strict type checking을 위한 헬퍼 함수들
 */

// ========== 숫자/문자열 파싱 유틸리티 ==========

/**
 * 안전한 parseInt 함수
 * @param value - 파싱할 문자열 (null/undefined 허용)
 * @param radix - 진법 (기본값: 10)
 * @returns 파싱된 정수 또는 0 (파싱 실패 시)
 * @example
 * ```typescript
 * const num = safeParseInt('123'); // 123
 * const num2 = safeParseInt('abc'); // 0
 * const num3 = safeParseInt(null); // 0
 * ```
 */
export function safeParseInt(value: string | undefined | null, radix: number = 10): number {
  if (value === undefined || value === null || value === '') {
    return 0;
  }
  const result = parseInt(value, radix);
  return isNaN(result) ? 0 : result;
}

/**
 * 안전한 parseFloat 함수
 */
export function safeParseFloat(value: string | undefined | null): number {
  if (value === undefined || value === null || value === '') {
    return 0;
  }
  const result = parseFloat(value);
  return isNaN(result) ? 0 : result;
}

// ========== 배열 접근 유틸리티 ==========

/**
 * 배열 요소 안전 접근
 * @param array - 접근할 배열 (null/undefined 허용)
 * @param index - 배열 인덱스
 * @returns 배열의 요소 또는 undefined (인덱스가 범위를 벗어나거나 배열이 null인 경우)
 * @example
 * ```typescript
 * const arr = [1, 2, 3];
 * const item = safeArrayGet(arr, 1); // 2
 * const item2 = safeArrayGet(arr, 10); // undefined
 * const item3 = safeArrayGet(null, 0); // undefined
 * ```
 */
export function safeArrayGet<T>(array: T[] | undefined | null, index: number): T | undefined {
  if (!array || index < 0 || index >= array.length) {
    return undefined;
  }
  return array[index];
}

/**
 * NodeList 안전 접근
 */
export function safeNodeListAccess<T extends Node>(
  nodeList:
    | { length: number; [n: number]: T; item?: (index: number) => T | null }
    | NodeListOf<T>
    | ArrayLike<T>
    | undefined
    | null,
  index: number
): T | undefined {
  type ArrayLikeWithItem = ArrayLike<T> & { item?: (i: number) => T | null };
  const list = nodeList as ArrayLikeWithItem;
  if (!list || typeof list.length !== 'number') return undefined;
  if (index < 0 || index >= list.length) return undefined;

  // 1) NodeList/HTMLCollection 우선: item(index)
  try {
    const itemFn = list.item as ((i: number) => T | null) | undefined;
    if (typeof itemFn === 'function') {
      const item = itemFn.call(list, index);
      if (item != null) return item as T;
    }
  } catch {
    // ignore
  }

  // 2) 직접 인덱스 접근 (배열/유사배열)
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const byIndex = (list as any)[index] as T | undefined;
    if (byIndex !== undefined) return byIndex;
  } catch {
    // ignore
  }

  // 3) 이터러블이면 Array.from으로 접근
  try {
    const iteratorFn = (list as unknown as { [Symbol.iterator]?: () => Iterator<T> })[
      Symbol.iterator
    ];
    if (typeof iteratorFn === 'function') {
      const arr = Array.from(list as unknown as Iterable<T>) as T[];
      if (index < arr.length) return arr[index];
    }
  } catch {
    // ignore
  }

  // 4) array-like을 강제 슬라이스로 변환하여 접근
  try {
    const asArray = Array.prototype.slice.call(list as unknown as { length: number }) as T[];
    if (index < asArray.length) return asArray[index];
  } catch {
    // ignore
  }

  // 5) 최후: length 기반 수동 순회 (item 또는 인덱스)
  try {
    const len = list.length;
    if (index < len) {
      // 재시도: item → 인덱스
      const itemFn = list.item as ((i: number) => T | null) | undefined;
      if (typeof itemFn === 'function') {
        const v = itemFn.call(list, index);
        if (v != null) return v as T;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const v2 = (list as any)[index] as T | undefined;
      if (v2 !== undefined) return v2;
    }
  } catch {
    // ignore
  }

  return undefined;
}

// ========== 정규식 매치 유틸리티 ==========

/**
 * 정규식 매치 결과에서 안전하게 값 추출
 */
export function safeMatchExtract(
  match: RegExpMatchArray | null,
  index: number,
  defaultValue: string | null = null
): string | null {
  if (!match?.[index]) {
    return defaultValue;
  }
  return match[index];
}

// ========== 함수 호출 유틸리티 ==========

/**
 * 안전한 함수 호출
 */
export function safeCall<T extends unknown[], R>(
  fn: ((...args: T) => R) | undefined | null,
  ...args: T
): R | undefined {
  return fn ? fn(...args) : undefined;
}

/**
 * 이벤트 핸들러 안전 wrapper
 */
export function safeEventHandler<T extends Event>(
  handler: ((event?: T) => void) | undefined | null
): (event?: T) => void {
  return handler ?? ((): void => {});
}

// ========== 타입 변환 유틸리티 ==========

/**
 * undefined를 null로 변환
 */
export function undefinedToNull<T>(value: T | undefined): T | null {
  return value ?? null;
}

/**
 * null을 undefined로 변환
 */
export function nullToUndefined<T>(value: T | null): T | undefined {
  return value ?? undefined;
}

/**
 * string 기본값 적용
 */
export function stringWithDefault(value: string | undefined, defaultValue: string = ''): string {
  return value ?? defaultValue;
}

// ========== 요소 검증 유틸리티 ==========

/**
 * HTMLElement 안전 검증
 */
export function safeElementCheck<T extends Element>(element: T | undefined | null): element is T {
  return element != null;
}

/**
 * 객체 속성 안전 접근
 */
export function safeProp<T, K extends keyof T>(
  obj: T | undefined | null,
  key: K
): T[K] | undefined {
  return obj?.[key];
}

// ========== 도메인 특화 유틸리티 ==========

/**
 * 안전한 트윗 ID 생성 - crypto.randomUUID() 우선 사용
 */
import { IDENTIFIER_CONSTANTS, NUMBER_BASES } from '@/constants';

export function safeTweetId(value: string | undefined): string {
  if (!value || value.trim() === '') {
    try {
      // crypto.randomUUID() 사용 (Node.js 16+, 모던 브라우저)
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return `generated_${crypto.randomUUID()}`;
      }
    } catch {
      // crypto.randomUUID() 실패 시 폴백
    }

    // 폴백: 강화된 랜덤 생성
    const timestamp = Date.now();
    const random = Math.random()
      .toString(NUMBER_BASES.BASE36)
      .substring(
        IDENTIFIER_CONSTANTS.RANDOM_SUBSTR_START_INDEX,
        IDENTIFIER_CONSTANTS.RANDOM_ID_LENGTH_MEDIUM
      );
    return `generated_${timestamp}_${random}`;
  }
  return value;
}

/**
 * 안전한 username 추출
 */
export function safeUsername(value: string | undefined): string {
  if (!value || value.trim() === '') {
    return 'unknown_user';
  }
  return value.startsWith('@') ? value.slice(1) : value;
}

/**
 * ClickedIndex 안전 처리
 */
export function safeClickedIndex(index: number | undefined): number | undefined {
  return index;
}

// ========== 객체 빌더 유틸리티 ==========

/**
 * 안전한 객체 빌더
 */
export function buildSafeObject<T extends Record<string, unknown>>(
  builderFn: (builder: {
    set<K extends keyof T>(
      key: K,
      value: T[K]
    ): { set<K extends keyof T>(key: K, value: T[K]): unknown };
  }) => void
): Partial<T> {
  const result: Partial<T> = {};
  const builder = {
    set<K extends keyof T>(key: K, value: T[K]) {
      if (value !== undefined) {
        result[key] = value;
      }
      return builder;
    },
  };

  builderFn(builder);
  return result;
}

// ========== 객체 조작 유틸리티 ==========

/**
 * 조건부 속성 할당
 */
export function assignOptionalProperty<T, K extends keyof T>(
  obj: T,
  key: K,
  value: T[K] | undefined
): void {
  if (value !== undefined) {
    obj[key] = value;
  }
}

/**
 * 조건부 객체 병합
 */
export function conditionalAssign<T extends Record<string, unknown>>(
  target: T,
  key: keyof T,
  value: unknown,
  condition: boolean = true
): T {
  if (condition && value !== undefined) {
    target[key] = value as T[keyof T];
  }
  return target;
}

/**
 * undefined 속성 제거한 객체 병합
 */
export function mergeWithoutUndefined<T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>
): T {
  const result = { ...target };

  for (const [key, value] of Object.entries(source)) {
    if (value !== undefined) {
      (result as Record<string, unknown>)[key] = value;
    }
  }

  return result;
}

/**
 * 선택적 속성을 가진 객체 생성
 */
export function createWithOptionalProperties<T extends Record<string, unknown>>(
  baseObj: T,
  optionalProps: Partial<Record<keyof T, unknown>>
): T {
  const result = { ...baseObj };

  for (const [key, value] of Object.entries(optionalProps)) {
    if (value !== undefined) {
      (result as Record<string, unknown>)[key] = value;
    }
  }

  return result;
}

/**
 * Config 객체에서 undefined 속성 제거
 */
export function removeUndefinedProperties<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result;
}
