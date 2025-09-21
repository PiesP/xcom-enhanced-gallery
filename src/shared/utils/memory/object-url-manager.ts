/**
 * @fileoverview Object URL Manager
 * @description URL.createObjectURL / URL.revokeObjectURL의 생성-해제 순서를 보장하는 경량 유틸
 */

import { logger } from '@shared/logging/logger';
import { registerResource, releaseResource } from './ResourceManager';

// 이미 해제(revoked)된 URL을 추적하여 중복 revoke 호출을 방지
const revokedUrls = new Set<string>();

/**
 * 안전한 Object URL 생성
 * - 생성 시 ResourceManager에 등록하여 파기 시점에 revokeObjectURL 보장
 */
export function createManagedObjectURL(blob: Blob, idHint?: string): string {
  let url = '';
  try {
    url = URL.createObjectURL(blob);
  } catch (e) {
    logger.warn('createObjectURL failed:', e);
    throw e;
  }

  const id = `objecturl:${idHint ?? ''}:${url}`;
  registerResource(id, () => {
    try {
      URL.revokeObjectURL(url);
      revokedUrls.add(url);
    } catch (e) {
      logger.warn('revokeObjectURL failed:', e);
    }
  });

  return url;
}

/**
 * 안전한 Object URL 해제
 * - 등록된 경우 revokeObjectURL을 1회만 호출
 */
export function revokeManagedObjectURL(url: string, idHint?: string): boolean {
  const id = `objecturl:${idHint ?? ''}:${url}`;
  const released = releaseResource(id);
  if (released) {
    revokedUrls.add(url);
    return true;
  }
  // 등록이 안 되어 있어도 안전하게 직접 revoke 시도하되,
  // 반환값은 false로 유지해 "리소스 해제됨" 시그널은 1회만 참이 되도록 한다.
  if (!revokedUrls.has(url)) {
    try {
      URL.revokeObjectURL(url);
    } catch (e) {
      logger.warn('direct revokeObjectURL failed:', e);
    }
    revokedUrls.add(url);
  }
  return false;
}
