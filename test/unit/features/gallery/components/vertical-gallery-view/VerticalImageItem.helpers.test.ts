import { cleanFilename, isVideoMedia } from '@/features/gallery/components/vertical-gallery-view/VerticalImageItem.helpers';
import type { MediaInfo } from '@/shared/types/media.types';

describe('VerticalImageItem.helpers', () => {
  describe('cleanFilename', () => {
    it('returns Untitled for undefined or empty filenames', () => {
      expect(cleanFilename(undefined)).toBe('Untitled');
      expect(cleanFilename('')).toBe('Untitled');
    });

    it('removes twitter media prefix and preserves extension', () => {
      const filename = 'twitter_media_20240115T143022_987654321.jpg';
      expect(cleanFilename(filename)).toBe('987654321.jpg');
    });

    it('removes /media/ prefix and relative path prefixes', () => {
      expect(cleanFilename('/media/path/to/photo.png')).toBe('photo.png');
      expect(cleanFilename('./path/to/photo.png')).toBe('photo.png');
    });

    it('extracts last path segment for nested paths', () => {
      expect(cleanFilename('a/b/c.jpg')).toBe('c.jpg');
      expect(cleanFilename('a\\b\\c.jpg')).toBe('c.jpg');
    });

    it('truncates long filenames to last segment', () => {
      const longPath = 'a/'.repeat(50) + 'final_image_name.png';
      expect(cleanFilename(longPath).endsWith('final_image_name.png')).toBe(true);
    });
  });

  describe('isVideoMedia', () => {
    it('detects video by extension in URL', () => {
      const media: MediaInfo = { id: '1', url: 'https://example.com/video.mp4', type: 'video', originalUrl: 'https://example.com/video.mp4', thumbnailUrl: '' };
      expect(isVideoMedia(media)).toBe(true);
    });

    it('detects video by extension in filename', () => {
      const media: MediaInfo = { id: '2', url: 'https://example.com/file', filename: 'clip.webm', type: 'video', originalUrl: 'https://example.com/file', thumbnailUrl: '' } as unknown as MediaInfo;
      expect(isVideoMedia(media)).toBe(true);
    });

    it('detects twitter video hostname', () => {
      const media: MediaInfo = { id: '3', url: 'https://video.twimg.com/somevideo', type: 'video', originalUrl: 'https://video.twimg.com/somevideo', thumbnailUrl: '' } as unknown as MediaInfo;
      expect(isVideoMedia(media)).toBe(true);
    });

    it('returns false for non-video urls', () => {
      const media: MediaInfo = { id: '4', url: 'https://pbs.twimg.com/image.jpg', type: 'image', originalUrl: 'https://pbs.twimg.com/image.jpg', thumbnailUrl: '' } as unknown as MediaInfo;
      expect(isVideoMedia(media)).toBe(false);
    });

    it('handles relative paths with video extension', () => {
      const media: MediaInfo = { id: '5', url: 'relative/path/video.webm', type: 'video', originalUrl: 'relative/path/video.webm', thumbnailUrl: '' } as unknown as MediaInfo;
      expect(isVideoMedia(media)).toBe(true);
    });

    it('returns false on data: URLs or invalid urls without video extension', () => {
      const media: MediaInfo = { id: '6', url: 'data:image/png;base64,abcd', type: 'image', originalUrl: 'data:image/png;base64,abcd', thumbnailUrl: '' } as unknown as MediaInfo;
      expect(isVideoMedia(media)).toBe(false);
    });
  });
});
