/**
 * @fileoverview RED: 서비스 Result 패턴 통일 사전 실패 테스트
 * 목표: BulkDownloadService / MediaService / SettingsService 이벤트 또는 반환값이
 * 공통 BaseResult 형태({ status: 'success'|'partial'|'error'|'cancelled'; failures?:[]; error?: string })를 노출
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { setupGlobalTestIsolation } from '../../../shared/global-cleanup-hooks';
import { UnifiedDownloadService } from '../../../../src/shared/services/unified-download-service';
import { mediaService } from '../../../../src/shared/services/media-service';
import { SettingsService } from '../../../../src/features/settings/services/settings-service';

describe('RED: 공통 Result 패턴 통일', () => {
  setupGlobalTestIsolation();

  it('UnifiedDownloadService.downloadBulk 결과는 status 필드를 포함해야 한다', async () => {
    const svc = UnifiedDownloadService.getInstance();
    const result: any = await svc.downloadBulk([] as any); // 빈 배열로 즉시 에러 반환

    expect(result).toBeDefined();
    expect(result.status).toBe('error');
  });

  it(
    'MediaService.downloadMultiple (존재 시) 또는 downloadSingle 결과에 status 필드가 있어야 한다 (현재 없음)',
    { skip: true },
    async () => {
      // FIXME(Phase A1 회귀): getBulkDownloadServiceFromContainer()가 올바른 서비스를 반환하지 못함
      // 향후 Result 패턴 통일 시 수정 필요
      // 단일 다운로드 시도 (간단한 더미 MediaInfo)
      const single: any = await mediaService.downloadSingle({
        id: 'x',
        url: 'https://example.com/x.jpg',
        type: 'image',
        filename: 'x.jpg',
      } as any);
      expect(single.status).toBeDefined();
    }
  );

  it('SettingsService 이벤트가 BaseResult 형태의 status 필드를 노출해야 한다', async () => {
    const svc = new SettingsService();
    await svc.initialize();
    const events: any[] = [];
    svc.subscribe(e => events.push(e));
    await svc.set('gallery.preloadCount' as any, 4); // 숫자 범위 내 유효 값 (0-20)
    const first = events[0];
    expect(first.status).toBe('success');
  });
});
