import { describe, it, expect, vi } from 'vitest';
import { MediaExtractionService } from '@/shared/services/media-extraction/MediaExtractionService';
import { TwitterAPI } from '@/shared/services/media/TwitterVideoExtractor';

describe('Phase C: API 추출 재시도/타임아웃 정책', () => {
  it('maxRetries만큼 재시도 후 실패하면 DOM 폴백으로 전환한다', async () => {
    const svc = new MediaExtractionService();

    // API를 항상 실패하도록 모킹
    const spy = vi.spyOn(TwitterAPI, 'getTweetMedias').mockRejectedValueOnce(new Error('network'));
    // 이후 호출도 실패하도록 설정
    spy.mockRejectedValue(new Error('network'));

    // 트윗 컨테이너 구성 (DOM 폴백 대상 이미지 포함)
    const article = document.createElement('article');
    const link = document.createElement('a');
    link.href = 'https://x.com/user/status/1234567890123456789';
    const img = document.createElement('img');
    img.src = 'https://pbs.twimg.com/media/abc123?format=jpg&name=small';
    article.appendChild(link);
    article.appendChild(img);

    const result = await svc.extractFromClickedElement(img, {
      timeoutMs: 20,
      maxRetries: 2,
    });

    // 시도 횟수 = 1 + maxRetries
    expect(spy).toHaveBeenCalledTimes(3);
    expect(result.success).toBe(true); // DOM 폴백 성공 기대
    if (result.success) {
      expect(result.mediaItems.length).toBeGreaterThan(0);
    }

    spy.mockRestore();
  });

  it('요청이 타임아웃되면 재시도하고, 최종 실패 시 DOM 폴백한다', async () => {
    const svc = new MediaExtractionService();

    // 지연되는 Promise로 타임아웃 유도
    const delayed = () =>
      new Promise(() => {
        /* never resolves */
      });

    const spy = vi.spyOn(TwitterAPI, 'getTweetMedias').mockImplementation(() => delayed());

    const article = (globalThis as any).document.createElement('article');
    const link = (globalThis as any).document.createElement('a');
    link.href = 'https://x.com/user/status/9876543210987654321';
    const img = (globalThis as any).document.createElement('img');
    img.src = 'https://pbs.twimg.com/media/def456?format=png&name=medium';
    article.appendChild(link);
    article.appendChild(img);

    const result = await svc.extractFromClickedElement(img, {
      timeoutMs: 10,
      maxRetries: 1,
    });

    // 1 + retries 번 호출
    expect(spy).toHaveBeenCalledTimes(2);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.mediaItems.length).toBeGreaterThan(0);
    }

    spy.mockRestore();
  });
});
