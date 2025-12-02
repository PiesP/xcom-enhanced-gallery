// Using vitest globals via types (do not import describe/it/expect)

describe('styles globals import', () => {
  it('should import globals without error', async () => {
    await import('@/styles/globals');
    expect(true).toBeTruthy();
  });
});
