import { describe, it, expect, beforeAll } from 'vitest';
import { JSDOM } from 'jsdom';
import { MediaExtractionService } from '@shared/services/media-extraction/MediaExtractionService';
import type { ExtractedMediaItem } from '@shared/types/core/core-types'; // 실제 타입 경로 확인 필요

function createService(): MediaExtractionService {
  // 필요 시 의존 주입 구성
  // @ts-expect-error (설계상 생성자 인자 추후 리팩토링)
  return new MediaExtractionService();
}

describe('Feature: Media Extraction (Behavior)', () => {
  let service: MediaExtractionService;
  let root: HTMLElement;

  beforeAll(() => {
    service = createService();
    const dom = new JSDOM(
      `<article>
         <img src="https://pbs.twimg.com/media/IMG_AAA123?format=jpg&name=large" />
         <video>
           <source src="https://video.twimg.com/ext_tw_video/VID_456/mp4/720.mp4" type="video/mp4" />
         </video>
       </article>`
    );
    root = dom.window.document.body;
  });

  it('이미지와 비디오 URL을 모두 추출해야 한다', async () => {
    const result = await service.extractFromRoot(root);
    const urls = (result as ExtractedMediaItem[]).map(i => i.url).sort();

    expect(urls).toContain('https://pbs.twimg.com/media/IMG_AAA123?format=jpg&name=large');
    expect(urls.some(u => u.includes('video.twimg.com'))).toBe(true);
  });

  it('DOM에 미디어가 없으면 빈 배열', async () => {
    const dom = new JSDOM(`<div class="empty"></div>`);
    const extracted = await service.extractFromRoot(dom.window.document.body);
    expect(extracted).toEqual([]);
  });

  it('중복 이미지가 있을 경우 dedupe 된 결과', async () => {
    const dom = new JSDOM(
      `<div>
        <img src="https://pbs.twimg.com/media/IMG_DUP?format=jpg&name=small" />
        <img src="https://pbs.twimg.com/media/IMG_DUP?format=jpg&name=small" />
      </div>`
    );
    const extracted = await service.extractFromRoot(dom.window.document.body);
    expect(extracted.length).toBe(1);
  });
});
