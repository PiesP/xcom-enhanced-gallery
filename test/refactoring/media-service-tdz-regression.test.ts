/**
 * @fileoverview MediaService TDZ 회귀 테스트
 * 목적: Critical Path 초기화에서 MediaService 등록/조회가 TDZ나 순환 의존성 없이 안전하게 동작함을 보장
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CoreService } from '@shared/services/service-manager';
import { SERVICE_KEYS } from '@/constants';

describe('Refactoring: MediaService TDZ/Cycle Regression', () => {
  beforeEach(() => {
    CoreService.resetInstance();
  });

  afterEach(() => {
    CoreService.resetInstance();
  });

  it('registerCoreServices 이후 MEDIA_SERVICE와 호환 키들이 모두 동일 인스턴스를 가리켜야 한다', async () => {
    const { registerCoreServices } = await import('@shared/services/core-services');
    await expect(registerCoreServices()).resolves.toBeUndefined();

    const serviceManager = CoreService.getInstance();

    const mediaSvc = serviceManager.get(SERVICE_KEYS.MEDIA_SERVICE);
    const mediaExtractionSvc = serviceManager.get(SERVICE_KEYS.MEDIA_EXTRACTION);
    const videoControlSvc = serviceManager.get(SERVICE_KEYS.VIDEO_CONTROL);
    const videoStateSvc = serviceManager.get(SERVICE_KEYS.VIDEO_STATE);
    const bulkDownloadSvc = serviceManager.get(SERVICE_KEYS.BULK_DOWNLOAD);
    const galleryDownloadSvc = serviceManager.get(SERVICE_KEYS.GALLERY_DOWNLOAD);

    expect(mediaSvc).toBe(mediaExtractionSvc);
    expect(mediaSvc).toBe(videoControlSvc);
    expect(mediaSvc).toBe(videoStateSvc);
    expect(mediaSvc).toBe(bulkDownloadSvc);
    expect(mediaSvc).toBe(galleryDownloadSvc);
  });

  it('registerCoreServices는 중복 호출되어도 예외 없이 안전해야 한다 (중복 등록은 무시)', async () => {
    const { registerCoreServices } = await import('@shared/services/core-services');
    await registerCoreServices();
    await expect(registerCoreServices()).resolves.toBeUndefined();

    const serviceManager = CoreService.getInstance();
    // 핵심 키들이 여전히 존재해야 함
    expect(serviceManager.has(SERVICE_KEYS.MEDIA_SERVICE)).toBe(true);
    expect(serviceManager.has(SERVICE_KEYS.MEDIA_EXTRACTION)).toBe(true);
    expect(serviceManager.has(SERVICE_KEYS.VIDEO_CONTROL)).toBe(true);
    expect(serviceManager.has(SERVICE_KEYS.VIDEO_STATE)).toBe(true);
  });

  it('media-service 모듈은 service-initialization을 import하지 않아야 한다 (순환 의존성 방지)', async () => {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');

    const filePath = join(process.cwd(), 'src', 'shared', 'services', 'media-service.ts');
    const content = readFileSync(filePath, 'utf8');

    // 간단한 문자열 포함 여부로 확인 (정규식 이스케이프 문제 회피)
    expect(content.includes("from './service-initialization'")).toBe(false);
  });
});
