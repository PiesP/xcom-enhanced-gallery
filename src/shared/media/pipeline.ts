/**
 * @fileoverview MediaProcessor Pipeline Functions
 * @description 단계별 미디어 처리 함수들
 */

import type { MediaDescriptor, RawMediaCandidate, Result } from './types';
import { logger } from '@shared/logging';

/**
 * 1단계: DOM에서 미디어 요소 수집
 */
export function collectNodes(root: HTMLElement): Element[] {
  const mediaSelectors = [
    'img[src]',
    'video[src]',
    'source[src]',
    'picture img',
    '[data-testid*="media"]',
    '[data-src]',
  ];

  const elements: Element[] = [];

  for (const selector of mediaSelectors) {
    try {
      const found = root.querySelectorAll(selector);
      elements.push(...Array.from(found));
    } catch (error) {
      logger.warn(`collectNodes: selector ${selector} 실패:`, error);
    }
  }

  // 중복 제거 (같은 요소가 여러 선택자에 매칭될 수 있음)
  return Array.from(new Set(elements));
}

/**
 * 2단계: 요소에서 원시 데이터 추출
 */
export function extractRawData(element: Element): RawMediaCandidate | null {
  try {
    const tagName = element.tagName.toLowerCase();
    let url = '';
    let type = 'unknown';

    // URL 추출
    if (element.hasAttribute('src')) {
      url = element.getAttribute('src') || '';
    } else if (element.hasAttribute('data-src')) {
      url = element.getAttribute('data-src') || '';
    }

    // 타입 결정
    if (tagName === 'img') {
      type = 'image';
    } else if (tagName === 'video') {
      type = 'video';
    } else if (tagName === 'source') {
      const parent = element.parentElement;
      type = parent?.tagName.toLowerCase() === 'video' ? 'video' : 'image';
    }

    // URL이 없으면 무시
    if (!url || url.trim() === '') {
      return null;
    }

    // 속성 수집
    const attributes: Record<string, string> = {};
    for (const attr of element.attributes) {
      attributes[attr.name] = attr.value;
    }

    return {
      element,
      url: url.trim(),
      type,
      attributes,
    };
  } catch (error) {
    logger.warn('extractRawData 실패:', error);
    return null;
  }
}

/**
 * 3단계: 원시 데이터를 MediaDescriptor로 정규화
 */
export function normalize(rawCandidates: RawMediaCandidate[]): MediaDescriptor[] {
  const descriptors: MediaDescriptor[] = [];

  for (const candidate of rawCandidates) {
    try {
      const id = generateMediaId(candidate.url);
      const mediaType = normalizeMediaType(candidate.type);

      if (!mediaType) {
        continue; // 지원하지 않는 타입
      }

      const width = parseNumber(candidate.attributes.width);
      const height = parseNumber(candidate.attributes.height);
      const alt = candidate.attributes.alt;

      const descriptor: MediaDescriptor = {
        id,
        type: mediaType,
        url: candidate.url,
        ...(width !== undefined && { width }),
        ...(height !== undefined && { height }),
        ...(alt && { alt }),
      };

      descriptors.push(descriptor);
    } catch (error) {
      logger.warn('normalize 실패:', error);
    }
  }

  return descriptors;
}

/**
 * 4단계: 중복 제거
 */
export function dedupe(descriptors: MediaDescriptor[]): MediaDescriptor[] {
  const seen = new Set<string>();
  const unique: MediaDescriptor[] = [];

  for (const desc of descriptors) {
    const key = `${desc.id}-${desc.url}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(desc);
    }
  }

  return unique;
}

/**
 * 5단계: 최종 검증
 */
export function validate(descriptors: MediaDescriptor[]): Result<MediaDescriptor[]> {
  try {
    // 유효한 URL인지 검사
    for (const desc of descriptors) {
      if (!isValidUrl(desc.url)) {
        logger.warn(`유효하지 않은 URL 발견: ${desc.url}`);
      }
    }

    return { success: true, data: descriptors };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

// ==============================
// 헬퍼 함수들
// ==============================

function generateMediaId(url: string): string {
  // URL에서 간단한 해시 생성
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // 32bit integer로 변환
  }
  return `media-${Math.abs(hash).toString(36)}`;
}

function normalizeMediaType(type: string): MediaDescriptor['type'] | null {
  const lower = type.toLowerCase();
  if (lower === 'image' || lower === 'img') return 'image';
  if (lower === 'video') return 'video';
  if (lower.includes('gif')) return 'gif';
  return null;
}

function parseNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const num = parseInt(value, 10);
  return isNaN(num) ? undefined : num;
}

function isValidUrl(url: string): boolean {
  try {
    // 상대 URL도 허용
    if (url.startsWith('/') || url.startsWith('data:')) {
      return true;
    }
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
