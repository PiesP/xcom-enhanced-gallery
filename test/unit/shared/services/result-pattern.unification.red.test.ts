/**
 * @fileoverview RED: 서비스 Result 패턴 통일 사전 실패 테스트
 * 목표: BulkDownloadService / MediaService / SettingsService 이벤트 또는 반환값이
 * 공통 BaseResult 형태({ status: 'success'|'partial'|'error'|'cancelled'; failures?:[]; error?: string })를 노출
 */
import { describe, it, expect } from 'vitest';
import { BulkDownloadService } from '../../../../src/shared/services/BulkDownloadService';
import { mediaService } from '../../../../src/shared/services/MediaService';
import { SettingsService } from '../../../../src/features/settings/services/settings-service';

describe('RED: 공통 Result 패턴 통일', () => {
  it('BulkDownloadService.downloadMultiple 가 status 필드를 제공해야 한다 (현재 없음)', async () => {
    const svc = new BulkDownloadService();
    const result: any = await svc.downloadMultiple([] as any); // 빈 배열로 실패 유도
    // 현재 구현에는 status가 없으므로 이 테스트는 실패(RED)해야 한다.
    expect(result.status).toBeDefined();
  });

  it('MediaService.downloadMultiple (존재 시) 또는 downloadSingle 결과에 status 필드가 있어야 한다 (현재 없음)', async () => {
    // 단일 다운로드 시도 (간단한 더미 MediaInfo)
    const single: any = await mediaService.downloadSingle({
      id: 'x',
      url: 'https://example.com/x.jpg',
      type: 'image',
      filename: 'x.jpg',
    } as any);
    expect(single.status).toBeDefined();
  });

  it('SettingsService 이벤트가 BaseResult 형태가 아니므로 어댑터 도입 후 status 기대 (현재 없음)', async () => {
    const svc = new SettingsService();
    await svc.initialize();
    const events: any[] = [];
    svc.subscribe(e => events.push(e));
    await svc.set('gallery.preloadCount' as any, 4); // 숫자 범위 내 유효 값 (0-20)
    // 첫 이벤트를 BaseResult 형태로 변환할 어댑터가 없으므로 현재 실패 (RED)
    const first = events[0];
    expect(first.status).toBeDefined();
  });
});
