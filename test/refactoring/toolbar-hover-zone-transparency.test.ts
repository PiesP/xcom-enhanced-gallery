import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '..', '..');

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf8');
}

function findRuleBlocks(css: string, selector: string): string[] {
  // 단순 블록 매처: 중첩 규칙이나 중첩 셀렉터 깊이는 고려하지 않음
  // 공백은 [\t\r\n\f ]*, 중괄호는 문자 클래스로 [{], [}] 처리해 린트 경고 회피
  const re = new RegExp(`${selector}[\\t\\r\\n\\f ]*[{][^}]*[}]`, 'g');
  return css.match(re) ?? [];
}

describe('상단 호버 영역 배경 제거(이미지 방해 최소화)', () => {
  it('RED: VerticalGalleryView .toolbarContainer에는 background 선언이 없어야 한다', () => {
    const css = read(
      'src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.module.css'
    );
    const blocks = findRuleBlocks(css, '\\.toolbarContainer');
    expect(blocks.length).toBeGreaterThan(0);
    const hasBackground = blocks.some(b => /\n\s*background\s*:/.test(b));
    expect(hasBackground).toBe(false);
  });

  it('RED: VerticalGalleryView .toolbarContainer:hover에서도 background 선언이 없어야 한다', () => {
    const css = read(
      'src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.module.css'
    );
    const hoverBlocks = findRuleBlocks(css, '\\.toolbarContainer:hover');
    if (hoverBlocks.length === 0) {
      // :hover 블록이 없다면 배경이 생길 여지가 없음
      expect(true).toBe(true);
      return;
    }
    const hasBackgroundOnHover = hoverBlocks.some(b => /\n\s*background\s*:/.test(b));
    expect(hasBackgroundOnHover).toBe(false);
  });

  it('RED: VerticalGalleryView .toolbarContainer에는 blur(backdrop-filter) 선언이 없어야 한다', () => {
    const css = read(
      'src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.module.css'
    );
    const blocks = findRuleBlocks(css, '\\.toolbarContainer');
    expect(blocks.length).toBeGreaterThan(0);
    const hasBackdropFilter = blocks.some(b =>
      /\bbackdrop-filter\s*:|\b-webkit-backdrop-filter\s*:/.test(b)
    );
    expect(hasBackdropFilter).toBe(false);
  });

  it('RED: VerticalGalleryView .toolbarContainer:hover에도 blur(backdrop-filter) 선언이 없어야 한다', () => {
    const css = read(
      'src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.module.css'
    );
    const hoverBlocks = findRuleBlocks(css, '\\.toolbarContainer:hover');
    const hasBackdropFilterOnHover = hoverBlocks.some(b =>
      /\bbackdrop-filter\s*:|\b-webkit-backdrop-filter\s*:/.test(b)
    );
    expect(hasBackdropFilterOnHover).toBe(false);
  });

  it('GREEN 가드: 디자인 토큰은 계속 존재해야 한다 (다른 컴포넌트용)', () => {
    const tokens = read('src/shared/styles/design-tokens.css');
    expect(tokens).toMatch(/--xeg-toolbar-overlay-gradient\s*:/);
    expect(tokens).toMatch(/--xeg-toolbar-overlay-gradient-strong\s*:/);
  });
});
