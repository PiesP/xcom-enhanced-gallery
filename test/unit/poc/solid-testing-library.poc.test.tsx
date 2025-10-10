/**
 * POC: Solid Testing Library 통합 테스트
 *
 * @solidjs/testing-library를 사용하여 Solid.js 컴포넌트의 반응성을
 * 올바르게 테스트할 수 있는지 검증합니다.
 */

import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { getSolid } from '@shared/external/vendors';

describe('POC: Solid Testing Library Integration', () => {
  const { createSignal, Show } = getSolid();

  describe('Basic Reactivity', () => {
    it('should handle signal changes correctly', async () => {
      const [count, setCount] = createSignal(0);

      const Counter = () => (
        <div>
          <span data-testid='count'>{count()}</span>
          <button data-testid='increment' onClick={() => setCount(c => c + 1)}>
            Increment
          </button>
        </div>
      );

      render(() => <Counter />);

      expect(screen.getByTestId('count')).toHaveTextContent('0');

      const button = screen.getByTestId('increment');
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByTestId('count')).toHaveTextContent('1');
      });
    });

    it('should handle conditional rendering with Show', async () => {
      const [visible, setVisible] = createSignal(false);

      const ConditionalComponent = () => (
        <div>
          <button data-testid='toggle' onClick={() => setVisible(v => !v)}>
            Toggle
          </button>
          <Show when={visible()}>
            <div data-testid='content'>Visible Content</div>
          </Show>
        </div>
      );

      render(() => <ConditionalComponent />);

      expect(screen.queryByTestId('content')).not.toBeInTheDocument();

      const button = screen.getByTestId('toggle');
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByTestId('content')).toBeInTheDocument();
        expect(screen.getByTestId('content')).toHaveTextContent('Visible Content');
      });
    });
  });

  describe('Props Reactivity', () => {
    it('should update when props change through signals', async () => {
      const [text, setText] = createSignal('Initial');

      const DisplayComponent = (props: { text: string }) => (
        <div data-testid='display'>{props.text}</div>
      );

      const ParentComponent = () => {
        return (
          <div>
            <DisplayComponent text={text()} />
            <button data-testid='change' onClick={() => setText('Updated')}>
              Change
            </button>
          </div>
        );
      };

      render(() => <ParentComponent />);

      expect(screen.getByTestId('display')).toHaveTextContent('Initial');

      await userEvent.click(screen.getByTestId('change'));

      await waitFor(() => {
        expect(screen.getByTestId('display')).toHaveTextContent('Updated');
      });
    });
  });

  describe('Event Handling', () => {
    it('should handle keyboard events', async () => {
      const onEscape = vi.fn();

      const KeyboardComponent = () => {
        const handleKeyDown = (e: globalThis.KeyboardEvent) => {
          if (e.key === 'Escape') {
            onEscape();
          }
        };

        return (
          <div data-testid='keyboard-target' onKeyDown={handleKeyDown} tabIndex={0}>
            Press Escape
          </div>
        );
      };

      render(() => <KeyboardComponent />);

      const target = screen.getByTestId('keyboard-target');
      target.focus();

      await userEvent.keyboard('{Escape}');

      expect(onEscape).toHaveBeenCalledTimes(1);
    });

    it('should handle click events with callbacks', async () => {
      const onClick = vi.fn();

      const ClickableComponent = () => (
        <button data-testid='clickable' onClick={onClick}>
          Click Me
        </button>
      );

      render(() => <ClickableComponent />);

      await userEvent.click(screen.getByTestId('clickable'));

      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Modal Pattern', () => {
    it('should handle modal open/close state', async () => {
      const [isOpen, setIsOpen] = createSignal(false);

      const SimpleModal = () => (
        <div>
          <button data-testid='open-modal' onClick={() => setIsOpen(true)}>
            Open
          </button>
          <Show when={isOpen()}>
            <div role='dialog' data-testid='modal'>
              <div>Modal Content</div>
              <button data-testid='close-modal' onClick={() => setIsOpen(false)}>
                Close
              </button>
            </div>
          </Show>
        </div>
      );

      render(() => <SimpleModal />);

      // Initially closed
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      // Open modal
      await userEvent.click(screen.getByTestId('open-modal'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Close modal
      await userEvent.click(screen.getByTestId('close-modal'));

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });
});
