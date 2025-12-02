// Using vitest globals via types
import * as constants from '@/constants';

describe('constants barrel index', () => {
  it('should export core constants', () => {
    expect(constants.SELECTORS).toBeDefined();
    expect(constants.MEDIA).toBeDefined();
    expect(constants.SERVICE_KEYS).toBeDefined();
  });
});
