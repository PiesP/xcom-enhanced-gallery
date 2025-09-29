/** @jsxImportSource solid-js */
/**
 * @fileoverview Button / IconButton / ToolbarButton wrapper compatibility tests (RED - v4.1)
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@solidjs/testing-library';
import { Button } from '../../../../../src/shared/components/ui/Button/Button';
import { IconButton } from '../../../../../src/shared/components/ui/Button/IconButton';
import { ToolbarButton } from '../../../../../src/shared/components/ui/ToolbarButton/ToolbarButton';

afterEach(() => {
  cleanup();
});

describe('Wrapper Compatibility (v4.1 - RED)', () => {
  describe('Current Implementation Baseline', () => {
    it('should render Button with expected structure', () => {
      const { container } = render(() => <Button data-testid='current-button'>Test</Button>);

      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('data-testid', 'current-button');
      expect(button?.textContent).toBe('Test');
    });

    it('should render IconButton with expected structure', () => {
      const { container } = render(() => (
        <IconButton aria-label='Test Icon' data-testid='current-icon-button'>
          ⚙
        </IconButton>
      ));

      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-label', 'Test Icon');
      expect(button?.textContent).toBe('⚙');
    });

    it('should render ToolbarButton with expected structure', () => {
      const { container } = render(() => (
        <ToolbarButton data-testid='current-toolbar-button' label='Toolbar' />
      ));

      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('data-testid', 'current-toolbar-button');
    });
  });

  describe('DOM Structure Comparison', () => {
    it('should produce consistent DOM structure across button types', () => {
      const buttonRender = render(() => <Button data-testid='compare-button'>Button</Button>);
      const toolbarRender = render(() => (
        <ToolbarButton data-testid='compare-toolbar-button' label='Toolbar Button' />
      ));

      const button = buttonRender.container.querySelector('button');
      const toolbarButton = toolbarRender.container.querySelector('button');

      expect(button?.tagName).toBe('BUTTON');
      expect(toolbarButton?.tagName).toBe('BUTTON');
      expect(button?.getAttribute('role')).toBe(toolbarButton?.getAttribute('role'));
    });

    it('should maintain ARIA compatibility', () => {
      const buttonRender = render(() => (
        <Button aria-pressed data-testid='aria-button'>
          Button
        </Button>
      ));
      const toolbarRender = render(() => (
        <ToolbarButton aria-pressed data-testid='aria-toolbar-button' label='Toolbar Button' />
      ));

      const button = buttonRender.container.querySelector('button');
      const toolbarButton = toolbarRender.container.querySelector('button');

      expect(button).toHaveAttribute('aria-pressed', 'true');
      expect(toolbarButton).toHaveAttribute('aria-pressed', 'true');
    });
  });
});
