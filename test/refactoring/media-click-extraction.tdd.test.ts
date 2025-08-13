import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { FallbackStrategy } from '@/shared/services/media-extraction/strategies/fallback/FallbackStrategy';

function loadSampleHtml(name: string): string {
  return readFileSync(join(process.cwd(), 'sample_pages', name), 'utf-8');
}

function setDocumentHtml(html: string): void {
  // Replace body content to avoid duplicating <html> tag structures
  document.body.innerHTML = html;
}

describe('Media Click Extraction (TDD) - synthetic minimal DOM', () => {
  it('extracts all image URLs in the same tweet container when clicking one image (srcset -> largest -> orig)', async () => {
    const html = `
      <article role="article" data-testid="tweet">
        <div class="gallery">
          <img src="https://pbs.twimg.com/media/A.jpg?name=small" />
          <img
            src="https://pbs.twimg.com/media/B.jpg?name=small"
            srcset="https://pbs.twimg.com/media/B.jpg?name=small 300w, https://pbs.twimg.com/media/B.jpg?name=large 1200w"
          />
        </div>
      </article>
    `;
    setDocumentHtml(html);
    const clicked = document.querySelector('img') as HTMLElement;

    const strategy = new FallbackStrategy();
    const container =
      (clicked.closest('[data-testid="tweet"], article') as HTMLElement) || document.body;
    const result = await strategy.extract(container, clicked);

    expect(result.success).toBe(true);
    const urls = result.mediaItems.map(m => m.url);
    // Dedup and upgrade to orig
    expect(urls).toContain('https://pbs.twimg.com/media/A.jpg?name=orig');
    expect(urls).toContain('https://pbs.twimg.com/media/B.jpg?name=orig');
  });

  it('extracts video sources (mp4) within the tweet container', async () => {
    const html = `
      <article role="article" data-testid="tweet">
        <div class="player">
          <video controls poster="https://pbs.twimg.com/media/D.jpg?name=large">
            <source src="https://video.twimg.com/ext_tw_video/vid/480x480/D_low.mp4" type="video/mp4" />
            <source src="https://video.twimg.com/ext_tw_video/vid/720x720/D.mp4" type="video/mp4" />
          </video>
        </div>
      </article>
    `;
    setDocumentHtml(html);
    const clicked = document.querySelector('video') as HTMLElement;

    const strategy = new FallbackStrategy();
    const container =
      (clicked.closest('[data-testid="tweet"], article') as HTMLElement) || document.body;
    const result = await strategy.extract(container, clicked);

    const urls = result.mediaItems.map(m => m.url);
    expect(urls).toContain('https://video.twimg.com/ext_tw_video/vid/720x720/D.mp4');
    expect(urls).toContain('https://video.twimg.com/ext_tw_video/vid/480x480/D_low.mp4');
  });

  it('extracts from background-image styles and upgrades to orig', async () => {
    const html = `
      <article role="article" data-testid="tweet">
        <div class="thumb" style="background-image:url('https://pbs.twimg.com/media/E.jpg?name=large'); width:100px;height:100px"></div>
      </article>
    `;
    setDocumentHtml(html);
    const clicked = document.querySelector('.thumb') as HTMLElement;

    const strategy = new FallbackStrategy();
    const container =
      (clicked.closest('[data-testid="tweet"], article') as HTMLElement) || document.body;
    const result = await strategy.extract(container, clicked);

    const urls = result.mediaItems.map(m => m.url);
    expect(urls).toContain('https://pbs.twimg.com/media/E.jpg?name=orig');
  });

  it('accepts anchor-wrapped media URLs and upgrades to orig', async () => {
    const html = `
      <article role="article" data-testid="tweet">
        <a href="https://pbs.twimg.com/media/F.png?name=small">
          <img alt="thumb" />
        </a>
      </article>
    `;
    setDocumentHtml(html);
    const clicked = document.querySelector('img') as HTMLElement;

    const strategy = new FallbackStrategy();
    const container =
      (clicked.closest('[data-testid="tweet"], article') as HTMLElement) || document.body;
    const result = await strategy.extract(container, clicked);

    const urls = result.mediaItems.map(m => m.url);
    expect(urls).toContain('https://pbs.twimg.com/media/F.png?name=orig');
  });
});

describe('Media Click Extraction (integration) - sample_pages smoke', () => {
  const sampleFiles = [
    'bookmark_page.html',
    'media_page.html',
    'my_timeline_page.html',
    'post_page_2.html',
    'post_page_3.html',
    'post_page.html',
    'user_timeline_page.html',
  ];

  for (const name of sampleFiles) {
    it(`extracts at least one media from ${name} when clicking the first media-like element`, async () => {
      const html = loadSampleHtml(name);
      setDocumentHtml(html);

      const candidate = document.querySelector(
        'img, video, source, a[href*="twimg.com"], [style*="background-image"]'
      ) as HTMLElement | null;
      expect(candidate, `No media-like element in ${name}`).not.toBeNull();

      const strategy = new FallbackStrategy();
      const container =
        (candidate!.closest('[data-testid="tweet"], article, main') as HTMLElement) ||
        document.body;
      const result = await strategy.extract(container, candidate!);

      expect(result.mediaItems.length).toBeGreaterThan(0);
      expect(result.mediaItems.every(m => /^https?:\/\//i.test(m.url))).toBe(true);
    });
  }
});
