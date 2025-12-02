
import { sanitizeHTML } from '@shared/utils/text/html-sanitizer';

describe('Alias Check', () => {
  it('should resolve @shared alias', () => {
    expect(sanitizeHTML).toBeDefined();
  });
});
