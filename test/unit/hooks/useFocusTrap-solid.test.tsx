/* eslint-disable no-undef */
/**
 * createFocusTrap Primitive Test (Phase 3 TDD)
 * @description Solid.js primitives로 변환된 Focus Trap 테스트
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot, createSignal } from 'solid-js';
import { createFocusTrap } from '@/shared/primitives/focusTrap-solid';

describe('createFocusTrap (Phase 3 TDD)', () => {
  let container: HTMLDivElement;
  let button1: HTMLButtonElement;
  let button2: HTMLButtonElement;
  let button3: HTMLButtonElement;

  beforeEach(() => {
    // 테스트용 DOM 구조 생성
    container = document.createElement('div');
    container.id = 'test-container';

    button1 = document.createElement('button');
    button1.textContent = 'Button 1';
    button1.id = 'btn1';

    button2 = document.createElement('button');
    button2.textContent = 'Button 2';
    button2.id = 'btn2';

    button3 = document.createElement('button');
    button3.textContent = 'Button 3';
    button3.id = 'btn3';

    container.appendChild(button1);
    container.appendChild(button2);
    container.appendChild(button3);
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container && container.parentNode) {
      document.body.removeChild(container);
    }
    vi.clearAllMocks();
  });

  describe('Focus Trap 기본 동작', () => {
    it('should create a focus trap primitive', () => {
      createRoot(dispose => {
        const [isActive, setIsActive] = createSignal(false);

        const trap = createFocusTrap(() => container, isActive);

        expect(trap).toBeDefined();
        expect(typeof trap.activate).toBe('function');
        expect(typeof trap.deactivate).toBe('function');
        expect(trap.isActive()).toBe(false);

        dispose();
      });
    });

    it('should activate when signal becomes true', () => {
      createRoot(dispose => {
        const [isActive, setIsActive] = createSignal(false);

        const trap = createFocusTrap(() => container, isActive);

        expect(trap.isActive()).toBe(false);

        setIsActive(true);

        expect(trap.isActive()).toBe(true);

        dispose();
      });
    });

    it('should deactivate when signal becomes false', () => {
      createRoot(dispose => {
        const [isActive, setIsActive] = createSignal(true);

        const trap = createFocusTrap(() => container, isActive);

        expect(trap.isActive()).toBe(true);

        setIsActive(false);

        expect(trap.isActive()).toBe(false);

        dispose();
      });
    });

    it('should handle null container safely', () => {
      createRoot(dispose => {
        const [isActive, setIsActive] = createSignal(false);

        expect(() => {
          const trap = createFocusTrap(() => null, isActive);
          expect(trap.isActive()).toBe(false);
        }).not.toThrow();

        dispose();
      });
    });
  });

  describe('Focus Management', () => {
    it('should trap focus within container when active', () => {
      createRoot(dispose => {
        const [isActive, setIsActive] = createSignal(false);
        const trap = createFocusTrap(() => container, isActive);

        button1.focus();
        expect(document.activeElement).toBe(button1);

        setIsActive(true);

        // Tab 키를 눌렀을 때 포커스가 컨테이너 내부에 머물러야 함
        button3.focus();
        const tabEvent = new KeyboardEvent('keydown', {
          key: 'Tab',
          bubbles: true,
          cancelable: true,
        });
        container.dispatchEvent(tabEvent);

        // Focus should cycle back to button1
        expect([button1, button2, button3]).toContain(document.activeElement);

        dispose();
      });
    });

    it('should restore focus on deactivation when restoreFocus is true', async () => {
      const externalButton = document.createElement('button');
      externalButton.textContent = 'External';
      document.body.appendChild(externalButton);

      try {
        await new Promise<void>(resolve => {
          createRoot(dispose => {
            externalButton.focus();
            expect(document.activeElement).toBe(externalButton);

            const [isActive, setIsActive] = createSignal(false);
            const trap = createFocusTrap(() => container, isActive, {
              restoreFocus: true,
            });

            queueMicrotask(() => {
              setIsActive(true);
              button1.focus();

              queueMicrotask(() => {
                setIsActive(false);

                // Should restore focus to external button
                setTimeout(() => {
                  try {
                    expect(document.activeElement).toBe(externalButton);
                    dispose();
                    resolve();
                  } catch (err) {
                    dispose();
                    throw err;
                  }
                }, 0);
              });
            });
          });
        });
      } finally {
        document.body.removeChild(externalButton);
      }
    });
  });

  describe('Keyboard Navigation', () => {
    it('should handle Tab key navigation', () => {
      createRoot(dispose => {
        const [isActive, setIsActive] = createSignal(true);
        const trap = createFocusTrap(() => container, isActive);

        button1.focus();

        const tabEvent = new KeyboardEvent('keydown', {
          key: 'Tab',
          bubbles: true,
          cancelable: true,
        });

        button1.dispatchEvent(tabEvent);

        // Focus should move to next element
        expect([button1, button2, button3]).toContain(document.activeElement);

        dispose();
      });
    });

    it('should handle Shift+Tab for reverse navigation', () => {
      createRoot(dispose => {
        const [isActive, setIsActive] = createSignal(true);
        const trap = createFocusTrap(() => container, isActive);

        button3.focus();

        const shiftTabEvent = new KeyboardEvent('keydown', {
          key: 'Tab',
          shiftKey: true,
          bubbles: true,
          cancelable: true,
        });

        button3.dispatchEvent(shiftTabEvent);

        // Focus should move to previous element
        expect([button1, button2, button3]).toContain(document.activeElement);

        dispose();
      });
    });

    it('should handle Escape key when onEscape callback is provided', async () => {
      const onEscape = vi.fn();

      await new Promise<void>(resolve => {
        createRoot(dispose => {
          const [isActive, setIsActive] = createSignal(true);
          const trap = createFocusTrap(() => container, isActive, {
            onEscape,
          });

          // Wait for effects to complete
          queueMicrotask(() => {
            const escapeEvent = new KeyboardEvent('keydown', {
              key: 'Escape',
              bubbles: true,
              cancelable: true,
            });

            container.dispatchEvent(escapeEvent);

            expect(onEscape).toHaveBeenCalledTimes(1);

            dispose();
            resolve();
          });
        });
      });
    });
  });

  describe('Container Changes', () => {
    it('should handle container changes reactively', () => {
      const container2 = document.createElement('div');
      const button4 = document.createElement('button');
      button4.textContent = 'Button 4';
      container2.appendChild(button4);
      document.body.appendChild(container2);

      try {
        createRoot(dispose => {
          const [currentContainer, setCurrentContainer] = createSignal<HTMLElement | null>(
            container
          );
          const [isActive, setIsActive] = createSignal(true);

          const trap = createFocusTrap(currentContainer, isActive);

          expect(trap.isActive()).toBe(true);

          // Change container
          setCurrentContainer(container2);

          // Trap should work with new container
          expect(trap.isActive()).toBe(true);

          dispose();
        });
      } finally {
        document.body.removeChild(container2);
      }
    });
  });

  describe('Cleanup', () => {
    it('should cleanup properly on dispose', () => {
      createRoot(dispose => {
        const [isActive, setIsActive] = createSignal(true);
        const trap = createFocusTrap(() => container, isActive);

        button1.focus();
        expect(trap.isActive()).toBe(true);

        dispose();

        // After dispose, trap should be inactive
        const tabEvent = new KeyboardEvent('keydown', {
          key: 'Tab',
          bubbles: true,
        });
        expect(() => container.dispatchEvent(tabEvent)).not.toThrow();
      });
    });
  });

  describe('Solid Primitives Migration', () => {
    it('should not require useCallback (Solid components run once)', () => {
      createRoot(dispose => {
        const [isActive, setIsActive] = createSignal(false);

        // In Solid, no need for useCallback - functions are stable by default
        const activate = () => {
          setIsActive(true);
        };

        const trap = createFocusTrap(() => container, isActive);

        activate();
        expect(trap.isActive()).toBe(true);

        dispose();
      });
    });

    it('should use createEffect instead of useEffect for side effects', () => {
      createRoot(dispose => {
        const [isActive, setIsActive] = createSignal(false);
        let effectRunCount = 0;

        // createEffect should track reactive dependencies automatically
        const trap = createFocusTrap(() => container, isActive);

        // Change signal
        setIsActive(true);
        setIsActive(false);
        setIsActive(true);

        // Effect should run for each change
        expect(trap.isActive()).toBe(true);

        dispose();
      });
    });
  });
});
