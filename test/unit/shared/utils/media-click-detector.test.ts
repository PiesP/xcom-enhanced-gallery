import { afterEach, describe, expect, it } from 'vitest';

import {
  detectMediaFromClick,
  shouldBlockMediaTrigger,
} from '@shared/utils/media/media-click-detector';

const TWITTER_IMAGE_URL = 'https://pbs.twimg.com/media/sample-image.jpg';

describe('media-click-detector functional API', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('detects a direct twitter image element', () => {
    const image = document.createElement('img');
    image.src = TWITTER_IMAGE_URL;
    document.body.appendChild(image);

    const result = detectMediaFromClick(image);

    expect(result.type).toBe('image');
    expect(result.mediaUrl).toBe(TWITTER_IMAGE_URL);
    expect(result.method).toBe('direct_element');
  });

  it('blocks pure status links outside media containers', () => {
    const link = document.createElement('a');
    link.href = 'https://x.com/example/status/1234567890';
    link.textContent = 'open tweet';
    document.body.appendChild(link);

    expect(shouldBlockMediaTrigger(link)).toBe(true);
  });

  it('blocks link preview images (does not trigger gallery)', () => {
    // 링크 미리보기 카드 구조:
    // <a href="https://example.com">
    //   <img src="https://pbs.twimg.com/..." />  <- 링크 프리뷰 이미지
    // </a>
    const link = document.createElement('a');
    link.href = 'https://example.com/some-article';
    link.setAttribute('data-testid', 'card');

    const previewImage = document.createElement('img');
    previewImage.src = 'https://pbs.twimg.com/card/preview.jpg';
    previewImage.setAttribute('alt', 'Card preview');
    link.appendChild(previewImage);

    document.body.appendChild(link);

    // 링크 프리뷰 이미지 클릭 시 갤러리가 열려서는 안 됨 (true = 차단)
    expect(shouldBlockMediaTrigger(previewImage)).toBe(true);
  });

  it('allows tweet media images inside tweet containers', () => {
    // 트윗 내 미디어 구조:
    // <article data-testid="tweet">
    //   <div class="css-1dbjc4n">
    //     <img src="https://pbs.twimg.com/media/..." />  <- 트윗 미디어
    //   </div>
    // </article>
    const tweetContainer = document.createElement('article');
    tweetContainer.setAttribute('data-testid', 'tweet');

    const mediaContainer = document.createElement('div');
    mediaContainer.className = 'css-1dbjc4n'; // Twitter media container class

    const tweetMedia = document.createElement('img');
    tweetMedia.src = 'https://pbs.twimg.com/media/tweet-media.jpg';

    mediaContainer.appendChild(tweetMedia);
    tweetContainer.appendChild(mediaContainer);
    document.body.appendChild(tweetContainer);

    // 트윗 내 미디어는 갤러리 허용 (false = 차단 안 함)
    expect(shouldBlockMediaTrigger(tweetMedia)).toBe(false);
  });
});
