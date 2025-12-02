import { queryWithFallback, queryAllWithFallback } from '@/constants/selectors';

describe('selectors utilities', () => {
  it('queryWithFallback returns primary when present', () => {
    const container = document.createElement('div');
    container.innerHTML = `<div class="primary">match</div><div class="fallback">fallback</div>`;

    const el = queryWithFallback(container, '.primary', ['.fallback']);
    expect(el).not.toBeNull();
    expect(el?.classList.contains('primary')).toBe(true);
  });

  it('queryWithFallback returns fallback when primary absent', () => {
    const container = document.createElement('div');
    container.innerHTML = `<div class="fallback">fallback</div>`;

    const el = queryWithFallback(container, '.primary', ['.fallback']);
    expect(el).not.toBeNull();
    expect(el?.classList.contains('fallback')).toBe(true);
  });

  it('queryWithFallback returns null when none found', () => {
    const container = document.createElement('div');
    const el = queryWithFallback(container, '.does-not-exist', ['.also-missing']);
    expect(el).toBeNull();
  });

  it('queryAllWithFallback returns unique elements across selectors and ignores invalid selectors', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div id="a" class="foo bar"></div>
      <div id="b" class="bar"></div>
      <div id="c" class="baz"></div>
    `;

    const results = queryAllWithFallback(container, ['.foo', '.bar', '.baz', 'invalid[']);
    // We expect unique ids: a, b, c (order may follow selector order)
    const ids = results.map((el) => el.getAttribute('id'));
    expect(ids.sort()).toEqual(['a', 'b', 'c']);
  });
});
