/**
 * @fileoverview Type Safety Helper Functions
 * @version 4.0.0 - Optimized: Only actively used functions (Phase 326.5 Quick Wins)
 * @description exactOptionalPropertyTypes와 strict type checking을 위한 헬퍼 함수들
 */

// ========== 숫자/문자열 파싱 유틸리티 ==========

/**
 * 안전한 parseInt 함수
 * @param value - 파싱할 문자열 (null/undefined 허용)
 * @param radix - 진법 (기본값: 10)
 * @returns 파싱된 정수 또는 0 (파싱 실패 시)
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

// ========== 타입 변환 유틸리티 ==========

/**
 * undefined를 null로 변환
 */
export function undefinedToNull<T>(value: T | undefined): T | null {
  return value ?? null;
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

// ========== 도메인 특화 유틸리티 ==========

/**
 * 안전한 트윗 ID 생성 - crypto.randomUUID() 우선 사용
 */
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
    const random = Math.random().toString(36).substring(2, 9);
    return `generated_${timestamp}_${random}`;
  }
  return value;
}

// ========== DOM/Event 타입 가드 ==========

/**
 * EventListener 호환 함수 래퍼 (TypeScript strict 모드용)
 */
export function createEventListener<T extends Event = Event>(
  handler: (this: EventTarget, event: T) => void
): EventListener {
  return handler as unknown as EventListener;
}

/**
 * 글로벌 객체가 필요한 속성을 가지고 있는지 검증
 */
export function isGlobalLike(obj: unknown): obj is typeof globalThis {
  if (obj === null || typeof obj !== 'object') {
    return false;
  }

  const objRecord = obj as Record<string, unknown>;
  return (
    typeof objRecord.requestIdleCallback === 'function' ||
    typeof objRecord.setTimeout === 'function'
  );
}

/**
 * GM_info 객체가 유효한 스크립트 정보를 가지고 있는지 확인
 */
export function isGMUserScriptInfo(obj: unknown): obj is { scriptHandler?: string } {
  if (obj === null || typeof obj !== 'object') {
    return false;
  }

  const objRecord = obj as Record<string, unknown>;
  return 'scriptHandler' in objRecord || Object.keys(objRecord).length > 0;
}

// ========== 서비스/객체 타입 가드 ==========

/**
 * MediaService 호환 객체인지 확인
 */
export function isMediaServiceLike(obj: unknown): obj is {
  togglePlayPauseCurrent: () => void;
  volumeUpCurrent: () => void;
  volumeDownCurrent: () => void;
  toggleMuteCurrent: () => void;
} {
  if (obj === null || typeof obj !== 'object') {
    return false;
  }

  const objRecord = obj as Record<string, unknown>;
  return (
    typeof objRecord.togglePlayPauseCurrent === 'function' &&
    typeof objRecord.volumeUpCurrent === 'function' &&
    typeof objRecord.volumeDownCurrent === 'function' &&
    typeof objRecord.toggleMuteCurrent === 'function'
  );
}
