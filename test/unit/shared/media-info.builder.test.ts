import { expect, describe, test, beforeEach } from 'vitest';
import { MediaInfoBuilder } from '@shared/utils/media/MediaInfoBuilder';

/* global document */

describe('MediaInfoBuilder', () => {
  beforeEach(() => {
    // nothing for now; rely on real DOM where available
  });

  test('createMediaInfo normalizes pbs.twimg.com URLs and extracts filename', () => {
    const id = 'id1';
    const url = 'https://pbs.twimg.com/media/IMG123.jpg?name=small';

    const info = MediaInfoBuilder.createMediaInfo(id, url);

    expect(info).toBeDefined();
    expect(info.id).toBe(id);
    // MediaValidationUtils.normalizeMediaUrl should force name=orig for pbs URLs
    expect(info.url).toContain('name=orig');
    // filename should be extractable from the normalized path
    expect(info.filename).toContain('IMG123');
  });

  test('createFromElement extracts dimensions and alt from an image element', () => {
    const img = typeof document !== 'undefined' ? document.createElement('img') : null;
    if (!img) return;

    img.setAttribute('width', '320');
    img.setAttribute('height', '180');
    img.setAttribute('alt', 'Sample Image');

    const info = MediaInfoBuilder.createFromElement(
      img,
      'elem1',
      'https://pbs.twimg.com/media/IMG999.jpg'
    );

    expect(info).toBeDefined();
    expect(info.width).toBe(320);
    expect(info.height).toBe(180);
    // filename should incorporate alt when present
    expect(info.filename).toContain('Sample_Image');
  });
});
