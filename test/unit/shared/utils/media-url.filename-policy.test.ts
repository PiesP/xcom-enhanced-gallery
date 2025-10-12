import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createMediaInfoFromImage,
  createMediaInfoFromVideo,
} from '@shared/utils/media/media-url.util';
import { isValidMediaFilename } from '@shared/media/filename-service';

vi.mock('@shared/services/media/UsernameExtractionService', () => ({
  parseUsernameFast: () => 'alice',
}));

function makeImage(src: string, width = 800, height = 600): any {
  return { src, width, height } as any;
}

function makeVideo(src: string, poster: string, vw = 1280, vh = 720): any {
  return { src, poster, videoWidth: vw, videoHeight: vh } as any;
}

describe('Filename single-source policy (FilenameService)', () => {
  const tweetId = '1234567890';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createMediaInfoFromImage should produce service-standard filename when tweetId/username are known (RED → GREEN)', () => {
    const src = 'https://pbs.twimg.com/media/AbCdEf123.jpg?format=jpg&name=large';
    const img = makeImage(src);

    const info = createMediaInfoFromImage(img, tweetId, 0);
    expect(info).not.toBeNull();
    if (!info) return;

    // Should follow {username}_{tweetId}_{index}.ext
    expect(isValidMediaFilename(info.filename)).toBe(true);
    expect(info.filename).toMatch(/^alice_1234567890_1\.(jpg|jpeg|png|gif|webp)$/);
  });

  it('createMediaInfoFromVideo should produce service-standard filename when tweetId/username are known (RED → GREEN)', () => {
    const poster = 'https://pbs.twimg.com/media/VidPoster123.jpg?format=jpg&name=large';
    const src = 'https://video.twimg.com/ext_tw_video/1234567890/pu/vid/720x1280/video.mp4?tag=12';
    const video = makeVideo(src, poster);

    const info = createMediaInfoFromVideo(video, tweetId, 1);
    expect(info).not.toBeNull();
    if (!info) return;

    // Should follow {username}_{tweetId}_{index}.ext (index is 2 here)
    expect(isValidMediaFilename(info.filename)).toBe(true);
    expect(info.filename).toMatch(/^alice_1234567890_2\.(mp4|mov|avi|gif)$/);
  });
});
