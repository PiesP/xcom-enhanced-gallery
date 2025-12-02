import { isVideoControlElement } from '@shared/dom/utils';
import { gallerySignals } from '@shared/state/signals/gallery.signals';
import { isProcessableMedia, shouldBlockMediaTrigger } from '@shared/utils/media/media-click-detector';
// Use vitest globals and import only types
import type { Mock } from 'vitest';
import { CSS } from '@/constants/css';

// Mock dependencies
vi.mock('@shared/state/signals/gallery.signals', () => ({
  gallerySignals: {
    isOpen: { value: false },
  },
}));

vi.mock('@shared/dom/utils', () => ({
  isVideoControlElement: vi.fn(),
}));

vi.mock('@shared/logging', () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe('media-click-detector mutation tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gallerySignals.isOpen.value = false;
    (isVideoControlElement as Mock).mockReturnValue(false);
  });

  describe('isProcessableMedia', () => {
    it('should return false for IMG with invalid src', () => {
      const img = document.createElement('img');
      img.src = 'invalid-url';
      expect(isProcessableMedia(img)).toBe(false);
    });

    it('should return false for VIDEO with invalid src', () => {
      const video = document.createElement('video');
      video.src = 'invalid-url';
      expect(isProcessableMedia(video)).toBe(false);
    });

    it('should return true if only inside tweet photo container (not video)', () => {
      const container = document.createElement('div');
      container.setAttribute('data-testid', 'tweetPhoto');
      const inner = document.createElement('div');
      container.appendChild(inner);
      expect(isProcessableMedia(inner)).toBe(true);
    });

    it('should return true if only inside video player container (not photo)', () => {
      const container = document.createElement('div');
      container.setAttribute('data-testid', 'videoPlayer');
      const inner = document.createElement('div');
      container.appendChild(inner);
      expect(isProcessableMedia(inner)).toBe(true);
    });
  });

  describe('shouldBlockMediaTrigger', () => {
    it('should block if inside CSS.SELECTORS.ROOT', () => {
      const root = document.createElement('div');
      // CSS.SELECTORS.ROOT is a class selector (starts with .)
      root.classList.add(CSS.SELECTORS.ROOT.substring(1));
      const target = document.createElement('div');
      root.appendChild(target);
      expect(shouldBlockMediaTrigger(target)).toBe(true);
    });

    it('should block if inside CSS.SELECTORS.OVERLAY', () => {
      const overlay = document.createElement('div');
      // CSS.SELECTORS.OVERLAY is a class selector (starts with .)
      overlay.classList.add(CSS.SELECTORS.OVERLAY.substring(1));
      const target = document.createElement('div');
      overlay.appendChild(target);
      expect(shouldBlockMediaTrigger(target)).toBe(true);
    });

    it('should not block if interactive element matches MEDIA_LINK selector', () => {
      const link = document.createElement('a');
      link.href = '/user/status/123/photo/1'; // Matches a[href*="/status/"]
      expect(shouldBlockMediaTrigger(link)).toBe(false);
    });

    it('should not block if interactive element contains TWEET_PHOTO', () => {
      const btn = document.createElement('button');
      const photo = document.createElement('div');
      photo.setAttribute('data-testid', 'tweetPhoto');
      btn.appendChild(photo);
      expect(shouldBlockMediaTrigger(btn)).toBe(false);
    });

    it('should not block if interactive element contains VIDEO_PLAYER', () => {
      const btn = document.createElement('button');
      const video = document.createElement('div');
      video.setAttribute('data-testid', 'videoPlayer');
      btn.appendChild(video);
      expect(shouldBlockMediaTrigger(btn)).toBe(false);
    });
  });

});
