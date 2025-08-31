/**
 * Phase 1.3: Fetch Error Handling Enhancement
 *
 * 네트워크 요청의 에러 처리를 개선하는 fetchWrapper 유틸리티
 */

export interface FetchWrapperOptions extends RequestInit {
  timeout?: number;
  retries?: number;
}

/**
 * 향상된 에러 처리를 제공하는 fetch 래퍼
 *
 * @param url - 요청할 URL
 * @param options - fetch 옵션과 추가 설정
 * @returns Promise<Response>
 */
export async function fetchWrapper(
  url: string,
  options: FetchWrapperOptions = {}
): Promise<Response> {
  const { timeout = 30000, retries = 0, ...fetchOptions } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // 타임아웃 설정
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // HTTP 상태 에러 처리
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      if (error instanceof Error) {
        // AbortError는 재시도하지 않음
        if (error.name === 'AbortError') {
          if (error.message.includes('timeout')) {
            throw new Error('요청 시간이 초과되었습니다. 나중에 다시 시도해주세요.');
          }
          throw error; // 사용자 취소는 그대로 전달
        }

        // 네트워크 에러 처리
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
          lastError = new Error(
            '네트워크 연결을 확인해주세요. CORS 정책이나 연결 문제가 있을 수 있습니다.'
          );
        } else {
          lastError = error;
        }
      } else {
        lastError = new Error('알 수 없는 에러가 발생했습니다.');
      }

      // 마지막 시도가 아니면 재시도
      if (attempt < retries) {
        // 지수 백오프로 재시도 간격 증가
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        continue;
      }
    }
  }

  // 모든 재시도 실패 시 마지막 에러 던지기
  throw lastError!;
}
