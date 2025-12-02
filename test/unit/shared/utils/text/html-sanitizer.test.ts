import { extractPlainText, sanitizeHTML } from '@shared/utils/text/html-sanitizer';

const stripWhitespace = (value: string): string => value.replace(/\s+/g, ' ').trim();

describe('sanitizeHTML', () => {
  describe('Tag Allowlisting', () => {
    it('allows whitelisted tags', () => {
      const input =
        '<span>Text</span><a href="#">Link</a><br><strong>Bold</strong><em>Em</em><img src="x" alt="x">';
      const output = sanitizeHTML(input);
      // DOMParser normalizes HTML, so we expect normalized output
      expect(stripWhitespace(output)).toBe(stripWhitespace(input));
    });

    it('removes disallowed tags but keeps text content', () => {
      const input = '<div><script>alert(1)</script><style>body{}</style><p>Paragraph</p></div>';
      const output = sanitizeHTML(input);
      // The sanitizer implementation uses textContent for disallowed tags.
      // Note: JSDOM/Browser might treat script/style content as text.
      expect(output).toContain('alert(1)');
      expect(output).toContain('body{}');
      expect(output).toContain('Paragraph');
      expect(output).not.toContain('<script>');
      expect(output).not.toContain('<div');
    });

    it('flattens nested disallowed tags to text', () => {
      const input = '<div><span>Allowed</span><p>Disallowed</p></div>';
      const output = sanitizeHTML(input);
      // Since div is disallowed, it takes textContent of the whole tree
      expect(output).toBe('AllowedDisallowed');
    });
  });

  describe('Attribute Allowlisting', () => {
    it('allows whitelisted attributes', () => {
      const input =
        '<a href="https://example.com" title="Title" target="_blank" dir="ltr">Link</a>';
      const output = sanitizeHTML(input);
      expect(output).toContain('href="https://example.com"');
      expect(output).toContain('title="Title"');
      expect(output).toContain('dir="ltr"');
    });

    it('removes disallowed attributes', () => {
      const input = '<span style="color: red" data-foo="bar" class="valid">Text</span>';
      const output = sanitizeHTML(input);
      expect(output).toContain('class="valid"');
      expect(output).not.toContain('style');
      expect(output).not.toContain('data-foo');
    });

    it('removes event handlers (on*)', () => {
      const input = '<a href="#" onclick="alert(1)" onmouseover="evil()">Link</a>';
      const output = sanitizeHTML(input);
      expect(output).not.toContain('onclick');
      expect(output).not.toContain('onmouseover');
    });
  });

  describe('URL Safety', () => {
    it('drops anchor href values that hide javascript via newline injection', () => {
      const dirty = '<a href="java\nscript:alert(1)">exploit</a>';
      const clean = sanitizeHTML(dirty);
      expect(stripWhitespace(clean)).toBe('<a>exploit</a>');
    });

    it('removes percent-encoded javascript URLs from src attributes', () => {
      const dirty = '<img src="javascript%3Aalert(1)" alt="sneaky" />';
      const clean = sanitizeHTML(dirty);
      expect(clean).toContain('<img');
      expect(clean).toContain('alt="sneaky"');
      expect(clean).not.toContain('src=');
    });

    it('allows safe URLs', () => {
      const input =
        '<a href="https://example.com">Link</a><img src="https://example.com/img.jpg" alt="" />';
      const output = sanitizeHTML(input);
      expect(output).toContain('href="https://example.com"');
      expect(output).toContain('src="https://example.com/img.jpg"');
    });
  });

  describe('Special Handling', () => {
    it('adds rel="noopener noreferrer" to target="_blank"', () => {
      const input = '<a href="https://example.com" target="_blank">Link</a>';
      const output = sanitizeHTML(input);
      expect(output).toContain('rel="noopener noreferrer"');
    });

    it('does not add rel if target is not _blank', () => {
      const input = '<a href="https://example.com" target="_self">Link</a>';
      const output = sanitizeHTML(input);
      expect(output).not.toContain('rel="noopener noreferrer"');
    });
  });

  describe('Edge Cases & Mutation Killing', () => {
    it('handles non-string inputs gracefully', () => {
      // @ts-expect-error - Testing runtime safety
      expect(sanitizeHTML(123)).toBe('');
      // @ts-expect-error - Testing runtime safety
      expect(sanitizeHTML(null)).toBe('');
      // @ts-expect-error - Testing runtime safety
      expect(sanitizeHTML({})).toBe('');
    });

    it('removes HTML comments', () => {
      const input = '<span><!-- secret --></span>';
      const output = sanitizeHTML(input);
      // Comments should be removed (nodeType 8)
      expect(output).toBe('<span></span>');
    });

    it("blocks attributes starting with 'on' even if whitelisted", () => {
      const config = {
        allowedTags: ['div'],
        allowedAttributes: {
          div: ['onclick', 'onmouseover', 'data-on'],
        },
      };
      const input = '<div onclick="alert(1)" onmouseover="x" data-on="yes"></div>';
      const output = sanitizeHTML(input, config);

      // onclick/onmouseover start with 'on' -> blocked despite whitelist
      expect(output).not.toContain('onclick');
      expect(output).not.toContain('onmouseover');

      // data-on does not start with 'on' -> allowed
      expect(output).toContain('data-on="yes"');
    });
  });
});

describe('extractPlainText', () => {
  it('extracts text from HTML', () => {
    const input = '<div><p>Hello <strong>World</strong></p></div>';
    expect(extractPlainText(input)).toBe('Hello World');
  });

  it('handles empty input', () => {
    expect(extractPlainText('')).toBe('');
  });

  it('handles non-string input', () => {
    // @ts-expect-error testing runtime safety
    expect(extractPlainText(null)).toBe('');
  });
});
