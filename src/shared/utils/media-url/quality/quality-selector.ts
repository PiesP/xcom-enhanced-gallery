/**
 * Copyright (c) 2024 X.com Gallery
 * Licensed under the MIT License
 *
 * Quality Selector
 *
 * Phase 351.6: Quality Layer - 고품질 미디어 URL 선택
 */

/**
 * 미디어 URL에서 고품질 버전 생성
 *
 * @param url - 원본 URL
 * @param quality - 품질 설정 ('large' | 'medium' | 'small')
 * @returns 고품질 URL
 *
 * @example
 * getHighQualityMediaUrl('https://pbs.twimg.com/media/ABC?format=jpg', 'large')
 * // Returns: 'https://pbs.twimg.com/media/ABC?format=jpg&name=large'
 */
export function getHighQualityMediaUrl(
  url: string,
  quality: 'large' | 'medium' | 'small' = 'large'
): string {
  // 입력값 검증 - null/undefined 처리
  if (!url || typeof url !== 'string') {
    return url || '';
  }

  try {
    // URL 생성자를 안전하게 시도
    let URLConstructor: typeof URL | undefined;

    if (typeof globalThis !== 'undefined' && typeof globalThis.URL === 'function') {
      URLConstructor = globalThis.URL;
    } else if (typeof window !== 'undefined' && typeof window.URL === 'function') {
      URLConstructor = window.URL;
    }

    if (!URLConstructor) {
      return getHighQualityMediaUrlFallback(url, quality);
    }

    const urlObj = new URLConstructor(url);
    urlObj.searchParams.set('name', quality);
    if (!urlObj.searchParams.has('format')) {
      urlObj.searchParams.set('format', 'jpg');
    }
    return urlObj.toString();
  } catch {
    return getHighQualityMediaUrlFallback(url, quality);
  }
}

/**
 * URL 생성자 없이 품질 변환하는 fallback 함수
 *
 * @internal
 */
function getHighQualityMediaUrlFallback(
  url: string,
  quality: 'large' | 'medium' | 'small' = 'large'
): string {
  // 입력값 검증
  if (!url || typeof url !== 'string') {
    return url;
  }

  // 기본적인 URL 유효성 검사 - 프로토콜이 있어야 함
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return url;
  }

  // 기존 name 파라미터 제거 및 새 품질로 교체
  const processedUrl = url.replace(/[?&]name=[^&]*/, '');

  // 쿼리 파라미터 파싱을 위한 기본 처리
  const hasQuery = processedUrl.includes('?');
  const baseUrl = hasQuery ? processedUrl.split('?')[0] : processedUrl;
  const existingParams = hasQuery ? processedUrl.split('?')[1] : '';

  // 새로운 파라미터 배열 구성
  const params: string[] = [];

  // name 파라미터 먼저 추가 (테스트 기대값과 일치)
  params.push(`name=${quality}`);

  // 기존 파라미터들 중 name이 아닌 것들 추가
  if (existingParams) {
    const existingParamPairs = existingParams
      .split('&')
      .filter(param => param && !param.startsWith('name='));
    params.push(...existingParamPairs);
  }

  // format 파라미터가 없으면 추가
  if (!params.some(p => p.startsWith('format='))) {
    params.push('format=jpg');
  }

  return `${baseUrl}?${params.join('&')}`;
}
