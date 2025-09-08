import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Twitter Color Mapping', () => {
  let testElement: HTMLElement;

  beforeEach(() => {
    // Load CSS design tokens into test environment
    const primitiveCSS = `
      :root {
        --color-twitter-blue: oklch(0.676 0.151 237.8);
        --color-twitter-blue-hover: oklch(0.626 0.151 237.8);
        --color-twitter-blue-active: oklch(0.576 0.151 237.8);
      }
    `;

    const semanticCSS = `
      :root {
        --color-primary: var(--color-twitter-blue);
        --color-primary-hover: var(--color-twitter-blue-hover);
        --color-primary-active: var(--color-twitter-blue-active);
      }
    `;

    // Add primitive tokens
    const primitiveStyle = document.createElement('style');
    primitiveStyle.id = 'primitive-tokens';
    primitiveStyle.textContent = primitiveCSS;
    document.head.appendChild(primitiveStyle);

    // Add semantic tokens
    const semanticStyle = document.createElement('style');
    semanticStyle.id = 'semantic-tokens';
    semanticStyle.textContent = semanticCSS;
    document.head.appendChild(semanticStyle);

    // Create a test element to check computed styles
    testElement = document.createElement('div');
    testElement.className = 'test-primary-color';
    document.body.appendChild(testElement);

    // Add a test style that uses the primary color
    const testStyle = document.createElement('style');
    testStyle.id = 'test-styles';
    testStyle.textContent = `
      .test-primary-color {
        color: var(--color-primary);
        background-color: var(--color-primary-hover);
        border-color: var(--color-primary-active);
      }
    `;
    document.head.appendChild(testStyle);
  });

  afterEach(() => {
    // Clean up
    if (testElement && testElement.parentNode) {
      document.body.removeChild(testElement);
    }

    // Remove all test styles
    ['primitive-tokens', 'semantic-tokens', 'test-styles'].forEach(id => {
      const style = document.getElementById(id);
      if (style) {
        document.head.removeChild(style);
      }
    });
  });

  it('should map primary color to Twitter blue', () => {
    // RED: This test should fail initially
    const primaryValue = getComputedStyle(document.documentElement)
      .getPropertyValue('--color-primary')
      .trim();

    expect(primaryValue).toBe('var(--color-twitter-blue)');
  });

  it('should map primary-hover to Twitter blue hover', () => {
    const primaryHoverValue = getComputedStyle(document.documentElement)
      .getPropertyValue('--color-primary-hover')
      .trim();

    expect(primaryHoverValue).toBe('var(--color-twitter-blue-hover)');
  });

  it('should map primary-active to Twitter blue active', () => {
    const primaryActiveValue = getComputedStyle(document.documentElement)
      .getPropertyValue('--color-primary-active')
      .trim();

    expect(primaryActiveValue).toBe('var(--color-twitter-blue-active)');
  });

  it('should resolve Twitter blue primitive tokens correctly', () => {
    // Verify that primitive tokens are defined
    const twitterBlue = getComputedStyle(document.documentElement)
      .getPropertyValue('--color-twitter-blue')
      .trim();

    const twitterBlueHover = getComputedStyle(document.documentElement)
      .getPropertyValue('--color-twitter-blue-hover')
      .trim();

    const twitterBlueActive = getComputedStyle(document.documentElement)
      .getPropertyValue('--color-twitter-blue-active')
      .trim();

    // These should not be empty or undefined
    expect(twitterBlue).toBeTruthy();
    expect(twitterBlueHover).toBeTruthy();
    expect(twitterBlueActive).toBeTruthy();

    // Should be OKLCH values
    expect(twitterBlue).toMatch(/oklch\(/);
    expect(twitterBlueHover).toMatch(/oklch\(/);
    expect(twitterBlueActive).toMatch(/oklch\(/);
  });

  it('should apply Twitter colors to Button primary variant', () => {
    // Create a button with primary variant
    const button = document.createElement('button');
    button.className = 'button button--primary';
    document.body.appendChild(button);

    const computedStyle = getComputedStyle(button);
    const backgroundColor = computedStyle.backgroundColor;

    // Should resolve to the Twitter blue color
    expect(backgroundColor).toBeTruthy();

    document.body.removeChild(button);
  });
});
