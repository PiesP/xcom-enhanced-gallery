/**
 * @fileoverview Type Safety Helper Functions
 * @description exactOptionalPropertyTypes와 strict type checking을 위한 헬퍼 함수들
 */

/**
 * 안전한 parseInt 함수 - undefined 값 처리
 */
export function safeParseInt(value: string | undefined, radix: number = 10): number {
  if (value === undefined || value === null) {
    return 0;
  }
  const result = parseInt(value, radix);
  return isNaN(result) ? 0 : result;
}

/**
 * 정규식 매치 결과에서 안전하게 값 추출
 */
export function safeMatchExtract(match: RegExpMatchArray | null, index: number): string | null {
  if (!match?.[index]) {
    return null;
  }
  return match[index];
}

/**
 * 정규식 매치 결과에서 안전하게 문자열 추출 (기본값 포함)
 */
export function safeMatchExtractWithDefault(
  match: RegExpMatchArray | null,
  index: number,
  defaultValue: string = ''
): string {
  if (!match?.[index]) {
    return defaultValue;
  }
  return match[index];
}

/**
 * 배열 요소 안전 접근
 */
export function safeArrayAccess<T>(array: T[], index: number): T | undefined {
  if (index < 0 || index >= array.length) {
    return undefined;
  }
  return array[index];
}

/**
 * 함수 배열에서 안전한 함수 호출
 */
export function safeArrayFunction<T>(functions: Array<() => T>, index: number): T | null {
  const fn = safeArrayAccess(functions, index);
  if (!fn) {
    return null;
  }
  return fn();
}

/**
 * 안전한 NodeList/배열 요소 접근
 */
export function safeNodeListAccess<T extends Node>(
  nodeList: NodeListOf<T> | T[],
  index: number
): T | undefined {
  if (index < 0 || index >= nodeList.length) {
    return undefined;
  }
  return nodeList[index];
}

/**
 * Optional property를 undefined와 호환되게 변환
 */
export function makeOptionalCompatible<T>(value: T | undefined): T | undefined {
  return value;
}

/**
 * Config 객체에서 undefined 속성 제거 (exactOptionalPropertyTypes 대응)
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
 * 객체의 optional properties를 exactOptionalPropertyTypes와 호환되게 변환
 */
export function makeExactOptionalCompatible<T extends Record<string, unknown>>(obj: T): T {
  return { ...obj };
}

/**
 * string | undefined 를 string으로 안전하게 변환 (기본값 포함)
 */
export function stringWithDefault(value: string | undefined, defaultValue: string = ''): string {
  return value ?? defaultValue;
}

/**
 * 안전한 배열 요소 접근 with null check
 */
export function safeArrayGet<T>(array: T[] | undefined, index: number): T | undefined {
  if (!array || index < 0 || index >= array.length) {
    return undefined;
  }
  return array[index];
}

/**
 * HTMLElement가 undefined인지 확인하고 안전하게 접근
 */
export function safeElementCheck<T extends Element>(element: T | undefined | null): element is T {
  return element != null;
}

/**
 * 안전한 함수 호출 - undefined 함수 처리
 */
export function safeCall<T extends unknown[], R>(
  fn: ((...args: T) => R) | undefined,
  ...args: T
): R | undefined {
  return fn ? fn(...args) : undefined;
}

/**
 * 이벤트 핸들러가 undefined인 경우를 위한 안전한 wrapper
 */
export function safeEventHandler<T extends Event>(
  handler: ((event: T) => void) | undefined
): (event: T) => void {
  return handler ?? ((): void => {});
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

/**
 * exactOptionalPropertyTypes를 위한 안전한 객체 생성
 */
export function createSafeObject<T extends Record<string, unknown>>(obj: Partial<T>): Partial<T> {
  const result: Partial<T> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      (result as Record<string, unknown>)[key] = value;
    }
  }
  return result;
}

/**
 * 안전한 배열 요소 접근 with validation
 */
export function safeAt<T>(array: T[], index: number): T | undefined {
  if (index < 0 || index >= array.length || !array) {
    return undefined;
  }
  return array[index];
}

/**
 * exactOptionalPropertyTypes용 - undefined 필드가 있는 객체를 안전하게 생성
 */
export function safeAssign<T>(obj: T, updates: Partial<T>): T {
  const result = { ...obj };
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      (result as Record<string, unknown>)[key] = value;
    }
  }
  return result;
}

/**
 * 옵셔널 문자열 속성을 안전하게 처리
 */
export function optionalString(value: string | undefined): string | undefined {
  return value;
}

/**
 * 옵셔널 숫자 속성을 안전하게 처리
 */
export function optionalNumber(value: number | undefined): number | undefined {
  return value;
}

/**
 * exactOptionalPropertyTypes 호환 객체 생성 헬퍼
 */
export function buildSafeObject<T>(builder: (b: SafeObjectBuilder<T>) => void): Partial<T> {
  const result: Partial<T> = {};
  const builderObj = new SafeObjectBuilder(result);
  builder(builderObj);
  return result;
}

class SafeObjectBuilder<T> {
  constructor(private result: Partial<T>) {}

  set<K extends keyof T>(key: K, value: T[K] | undefined): this {
    if (value !== undefined) {
      this.result[key] = value;
    }
    return this;
  }
}

/**
 * 배열에서 안전한 요소 찾기
 */
export function safeFindInArray<T>(
  array: T[] | undefined,
  predicate: (item: T) => boolean
): T | undefined {
  if (!array) return undefined;
  return array.find(predicate);
}

/**
 * 배열에서 안전한 인덱스 찾기
 */
export function safeFindIndex<T>(array: T[] | undefined, predicate: (item: T) => boolean): number {
  if (!array) return -1;
  return array.findIndex(predicate);
}

/**
 * RegExp match 결과에서 안전한 그룹 추출
 */
export function safeMatchGroup(match: RegExpMatchArray | null, index: number): string | undefined {
  return match?.[index];
}

/**
 * 안전한 DOM 요소 접근
 */
export function safeDOMAccess<T extends Element>(
  element: T | null | undefined,
  accessor: (el: T) => unknown
): unknown {
  return element ? accessor(element) : undefined;
}

/**
 * 객체의 속성을 조건부로 설정
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
 * 안전한 tweetId 추출 헬퍼
 */
export function safeTweetId(value: string | undefined): string {
  if (!value || value.trim() === '') {
    return `generated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  return value;
}

/**
 * 안전한 username 추출 헬퍼
 */
export function safeUsername(value: string | undefined): string {
  if (!value || value.trim() === '') {
    return 'unknown_user';
  }
  return value.startsWith('@') ? value.slice(1) : value;
}

/**
 * ClickedIndex가 undefined인 경우를 처리
 */
export function safeClickedIndex(index: number | undefined): number | undefined {
  return index;
}

/**
 * exactOptionalPropertyTypes 호환을 위한 조건부 속성 할당
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
 * exactOptionalPropertyTypes 호환을 위한 조건부 객체 생성
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
 * 타입 안전한 객체 병합 (undefined 속성 제외)
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
