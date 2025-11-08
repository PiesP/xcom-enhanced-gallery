import { describe, it, expect, afterEach } from 'vitest';
import { setupGlobalTestIsolation } from '../../../shared/global-cleanup-hooks';
import {
  detectMediaFromClick,
  isProcessableMedia,
  shouldBlockMediaTrigger,
} from '@shared/utils/media/media-click-detector';

/**
 * Phase 156: Link preview clicks must keep Twitter's default behaviour.
 *
 * Regression log `x.com-1761206868982.log` shows the gallery intercepting
 * link-preview card images, attempting extraction, and finally surfacing the
 * "미디어 로드 실패" toast while blocking navigation. The guard added in
 * Phase 153 (`isTwitterMediaElement` -> accepts all IMG) allowed detection but
 * the event pipeline never consulted `isProcessableMedia`, so
 * `shouldBlockMediaTrigger` could not short-circuit.
 *
 * These tests focus on the two critical expectations:
 * 1. Real tweet media must remain processable.
 * 2. Link-preview cards (external anchors) must be blocked before the gallery
 *    intercepts the click.
 */
describe('link preview image click handling (Phase 156)', () => {
  setupGlobalTestIsolation();

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('tweet media remains processable', () => {
    it('allows tweet photos inside media containers', () => {
      const container = document.createElement('div');
      container.setAttribute('data-testid', 'tweetPhoto');

      const img = document.createElement('img');
      img.src = 'https://pbs.twimg.com/media/GD6VJzYXQAAqmqQ.jpg';

      container.appendChild(img);
      document.body.appendChild(container);

      expect(isProcessableMedia(img)).toBe(true);

      const result = detectMediaFromClick(img);
      expect(result.type).toBe('image');
      expect(result.element).toBe(img);
    });

    it('allows tweet videos inside media players', () => {
      const container = document.createElement('div');
      container.setAttribute('data-testid', 'videoPlayer');

      const video = document.createElement('video');
      video.src = 'https://video.twimg.com/test.mp4';

      container.appendChild(video);
      document.body.appendChild(container);

      expect(isProcessableMedia(container)).toBe(true);

      const result = detectMediaFromClick(container);
      expect(result.type).toBe('video');
      expect(result.element).toBe(video);
    });
  });

  describe('link preview cards are blocked', () => {
    function buildLinkPreviewCard(): HTMLImageElement {
      const tweet = document.createElement('div');
      tweet.setAttribute('data-testid', 'tweet');

      const externalLink = document.createElement('a');
      externalLink.href = 'https://t.co/SjG5kAWBnh';

      const card = document.createElement('div');
      card.className = 'css-175oi2r r-1adg3ll r-1udh08x';

      const img = document.createElement('img');
      img.src = './link_post_files/Mg7HR__v';
      img.className = 'css-9pa8cd';
      img.draggable = true;

      card.appendChild(img);
      externalLink.appendChild(card);
      tweet.appendChild(externalLink);
      document.body.appendChild(tweet);

      return img;
    }

    it('marks link preview IMG as non-processable media', () => {
      const img = buildLinkPreviewCard();

      expect(isProcessableMedia(img)).toBe(false);
    });

    it('triggers shouldBlockMediaTrigger for external link previews', () => {
      const img = buildLinkPreviewCard();

      expect(shouldBlockMediaTrigger(img)).toBe(true);
    });
  });
});
