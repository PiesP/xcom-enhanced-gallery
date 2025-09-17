/**
 * @fileoverview MediaProcessor Pipeline Functions
 * @description 단계별 미디어 처리 함수들
 */

import type { MediaDescriptor, MediaVariant, RawMediaCandidate, Result } from './types';
import { logger } from '@shared/logging';
import {
  extractOriginalImageUrl,
  getHighQualityMediaUrl,
  isValidMediaUrl as isTwitterMediaUrl,
} from '@shared/utils/media/media-url.util';

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
      // URL Sanitization (Phase 8): 허용되지 않은 스킴 필터링
      if (!isSafeMediaUrl(candidate.url)) {
        continue; // unsafe URL 제거
      }
      const originalUrl = candidate.url.trim();
      // URL 기반 GIF 유사 패턴 감지: tweet_video_thumb, ext_tw_video_thumb, video_thumb
      const gifLike = isGifLikeUrl(originalUrl);

      // 기본 타입을 정규화하되, GIF 유사 패턴이면 우선 gif로 분류
      const mediaType = gifLike
        ? ('gif' as MediaDescriptor['type'])
        : normalizeMediaType(candidate.type);

      if (!mediaType) {
        continue; // 지원하지 않는 타입
      }

      const width = parseNumber(candidate.attributes.width);
      const height = parseNumber(candidate.attributes.height);
      const alt = candidate.attributes.alt;

      // 이미지인 경우: 트위터 CDN(media/video_thumb)만 정규화(canonical) 및 variants 생성
      if (mediaType === 'image') {
        const isTwitter = isTwitterMediaUrl(originalUrl);
        const canonicalUrl = isTwitter ? extractOriginalImageUrl(originalUrl) : originalUrl;
        const id = generateMediaId(canonicalUrl);

        const descriptor: MediaDescriptor = {
          id,
          type: mediaType,
          url: canonicalUrl,
          ...(width !== undefined && { width }),
          ...(height !== undefined && { height }),
          ...(alt && { alt }),
          ...(isTwitter && {
            variants: [
              {
                quality: 'small',
                url: getHighQualityMediaUrl(canonicalUrl, 'small'),
                ...(width !== undefined && { width }),
                ...(height !== undefined && { height }),
              },
              {
                quality: 'large',
                url: getHighQualityMediaUrl(canonicalUrl, 'large'),
                ...(width !== undefined && { width }),
                ...(height !== undefined && { height }),
              },
              {
                quality: 'orig',
                url: extractOriginalImageUrl(canonicalUrl),
                ...(width !== undefined && { width }),
                ...(height !== undefined && { height }),
              },
            ] as ReadonlyArray<MediaVariant>,
          }),
        };
        descriptors.push(descriptor);
        continue;
      }

      // 이미지가 아닌 경우는 원본 URL 기반으로 ID 생성 및 그대로 사용
      const id = generateMediaId(originalUrl);
      const descriptor: MediaDescriptor = {
        id,
        type: mediaType,
        url: originalUrl,
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

// (Note) 간단한 트위터 이미지 URL 판별 유틸은 현재 미사용

// GIF 유사 트위터 썸네일 URL인지 확인
function isGifLikeUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const path = u.pathname;
    return (
      path.includes('/tweet_video_thumb/') ||
      path.includes('/ext_tw_video_thumb/') ||
      path.includes('/video_thumb/')
    );
  } catch {
    // fallback 문자열 검사
    return (
      url.includes('/tweet_video_thumb/') ||
      url.includes('/ext_tw_video_thumb/') ||
      url.includes('/video_thumb/')
    );
  }
}

// ==============================
// URL Sanitization Helpers (Phase 8)
// ==============================

function isSafeMediaUrl(url: string): boolean {
  const trimmed = url.trim();
  const lower = trimmed.toLowerCase();

  // Allow root-relative / relative paths
  if (lower.startsWith('/') || lower.startsWith('./') || lower.startsWith('../')) {
    return true;
  }

  // Allow protocol-relative
  if (lower.startsWith('//')) {
    return true;
  }

  // Block explicit dangerous schemes
  const blockedSchemes = [
    'javascript:',
    'vbscript:',
    'file:',
    'ftp:',
    'chrome-extension:',
    'about:',
    'mailto:',
    'tel:',
  ];
  for (const scheme of blockedSchemes) {
    if (lower.startsWith(scheme)) return false;
  }

  // data: 정책 — 이미지 MIME 만 허용
  if (lower.startsWith('data:')) {
    // e.g. data:image/png;base64,... 허용
    if (/^data:image\//i.test(lower)) return true;
    return false; // 그 외 (text/html, application/javascript 등) 차단
  }

  // blob: 허용
  if (lower.startsWith('blob:')) return true;

  // http / https 허용
  if (lower.startsWith('http://') || lower.startsWith('https://')) return true;

  // No explicit scheme (relative like images/foo.png) — 허용
  if (!/^[a-z0-9+.-]+:/.test(lower)) return true;

  // 나머지 스킴은 기본 차단
  return false;
}
