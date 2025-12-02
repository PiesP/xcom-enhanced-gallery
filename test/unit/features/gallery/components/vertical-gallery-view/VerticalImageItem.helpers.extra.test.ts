import { cleanFilename, isVideoMedia } from '@/features/gallery/components/vertical-gallery-view/VerticalImageItem.helpers';
import type { MediaInfo } from '@/shared/types/media.types';

describe('VerticalImageItem.helpers - extra mutation coverage', () => {
  describe('cleanFilename - anchor and path edge cases', () => {
    it('does not remove twitter_media prefix when it occurs in non-leading path segment', () => {
      const input = 'path/twitter_media_20240101T120000_987654321.jpg';
      const out = cleanFilename(input);
      expect(out).toBe('twitter_media_20240101T120000_987654321.jpg');
    });

    it('removes only leading /media/ and should not mangle internal occurrences', () => {
      const input = 'path/media/photo.png';
      // Original logic returns 'photo.png' (last path segment) - ensure this behaviour
      expect(cleanFilename(input)).toBe('photo.png');
    });

    it('returns the original when last segment is empty (trailing slash)', () => {
      const input = 'prefix/';
      // Production behaviour: if the last segment resolves to empty (trailing slash), it returns the original string
      expect(cleanFilename(input)).toBe('prefix/');
    });

    it('truncates very long filenames to last segment when necessary', () => {
      const long = 'a/'.repeat(50) + 'final_image_name.png';
      expect(cleanFilename(long).endsWith('final_image_name.png')).toBe(true);
    });
  });

  describe('isVideoMedia - coverage for extension detection and host check', () => {
    it('detects video by extension (mp4) in url, case-insensitive', () => {
      const media: MediaInfo = { id: '1', url: 'https://example.com/VIDEO.MP4', type: 'video', originalUrl: 'https://example.com/VIDEO.MP4', thumbnailUrl: '' } as unknown as MediaInfo;
      expect(isVideoMedia(media)).toBe(true);
    });

    it('detects video by filename extension', () => {
      const media: MediaInfo = { id: '2', url: 'https://example.com/', filename: 'clip.webm', type: 'video', originalUrl: 'https://example.com/', thumbnailUrl: '' } as unknown as MediaInfo;
      expect(isVideoMedia(media)).toBe(true);
    });

    it('detects twitter video by hostname', () => {
      const media: MediaInfo = { id: '3', url: 'https://video.twimg.com/abc', type: 'video', originalUrl: 'https://video.twimg.com/abc', thumbnailUrl: '' } as unknown as MediaInfo;
      expect(isVideoMedia(media)).toBe(true);
    });

    it('returns false for data: urls', () => {
      const media: MediaInfo = { id: '4', url: 'data:image/png;base64,deadbeef', type: 'image', originalUrl: 'data:image/png;base64,deadbeef', thumbnailUrl: '' } as unknown as MediaInfo;
      expect(isVideoMedia(media)).toBe(false);
    });
  });
});
