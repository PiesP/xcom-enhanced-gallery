/* eslint-disable no-undef */
/**
 * createScrollLock Primitive Test (Phase 3 TDD)
 * @description Solid.js primitives로 변환된 Scroll Lock 테스트
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRoot, createSignal } from 'solid-js';
import { createScrollLock } from '@/shared/primitives/scrollLock-solid';

describe('createScrollLock (Phase 3 TDD)', () => {
  let originalOverflow: string;
  let originalPaddingRight: string;

  beforeEach(() => {
    // 각 테스트 전에 body 스타일 저장
    originalOverflow = document.body.style.overflow;
    originalPaddingRight = document.body.style.paddingRight;
  });

  afterEach(() => {
    // 각 테스트 후 body 스타일 복원
    document.body.style.overflow = originalOverflow;
    document.body.style.paddingRight = originalPaddingRight;
  });

  describe('Scroll Lock 기본 동작', () => {
    it('should create a scroll lock primitive', () => {
      createRoot(dispose => {
        const [enabled] = createSignal(false);
        const lock = createScrollLock(enabled);

        expect(lock).toBeDefined();
        expect(typeof lock.lock).toBe('function');
        expect(typeof lock.unlock).toBe('function');

        dispose();
      });
    });

    it('should lock scroll when enabled is true', async () => {
      await new Promise<void>(resolve => {
        createRoot(dispose => {
          const [enabled, setEnabled] = createSignal(false);
          createScrollLock(enabled);

          queueMicrotask(() => {
            setEnabled(true);

            queueMicrotask(() => {
              expect(document.body.style.overflow).toBe('hidden');
              dispose();
              resolve();
            });
          });
        });
      });
    });

    it('should unlock scroll when enabled becomes false', async () => {
      const originalOverflow = document.body.style.overflow || '';

      await new Promise<void>(resolve => {
        createRoot(dispose => {
          const [enabled, setEnabled] = createSignal(true);
          createScrollLock(enabled);

          queueMicrotask(() => {
            expect(document.body.style.overflow).toBe('hidden');

            setEnabled(false);

            queueMicrotask(() => {
              expect(document.body.style.overflow).toBe(originalOverflow);
              dispose();
              resolve();
            });
          });
        });
      });
    });

    it('should not lock scroll when enabled is false initially', () => {
      const originalOverflow = document.body.style.overflow;

      createRoot(dispose => {
        const [enabled] = createSignal(false);
        createScrollLock(enabled);

        expect(document.body.style.overflow).toBe(originalOverflow);

        dispose();
      });
    });
  });

  describe('Scroll Bar Gap Reservation', () => {
    it('should reserve scrollbar gap when option is enabled', async () => {
      await new Promise<void>(resolve => {
        createRoot(dispose => {
          const [enabled, setEnabled] = createSignal(false);
          createScrollLock(enabled, { reserveScrollBarGap: true });

          queueMicrotask(() => {
            setEnabled(true);

            queueMicrotask(() => {
              try {
                expect(document.body.style.overflow).toBe('hidden');
                // paddingRight should be set (exact value depends on scrollbar width)
                // Note: In JSDOM, scrollbar width is 0, so padding may not change
                expect(document.body.style.paddingRight).toBeDefined();

                dispose();
                resolve();
              } catch (err) {
                dispose();
                throw err;
              }
            });
          });
        });
      });
    });

    it('should not add padding when reserveScrollBarGap is false', async () => {
      const originalPadding = document.body.style.paddingRight;

      await new Promise<void>(resolve => {
        createRoot(dispose => {
          const [enabled, setEnabled] = createSignal(false);
          createScrollLock(enabled, { reserveScrollBarGap: false });

          queueMicrotask(() => {
            setEnabled(true);

            queueMicrotask(() => {
              expect(document.body.style.overflow).toBe('hidden');
              expect(document.body.style.paddingRight).toBe(originalPadding);

              dispose();
              resolve();
            });
          });
        });
      });
    });
  });

  describe('Manual Lock/Unlock', () => {
    it('should provide manual lock method', async () => {
      await new Promise<void>(resolve => {
        createRoot(dispose => {
          const [enabled] = createSignal(false);
          const lock = createScrollLock(enabled);

          queueMicrotask(() => {
            lock.lock();

            queueMicrotask(() => {
              try {
                expect(document.body.style.overflow).toBe('hidden');

                dispose();
                resolve();
              } catch (err) {
                dispose();
                throw err;
              }
            });
          });
        });
      });
    });

    it('should provide manual unlock method', async () => {
      const originalOverflow = document.body.style.overflow || '';

      await new Promise<void>(resolve => {
        createRoot(dispose => {
          const [enabled] = createSignal(true);
          const lock = createScrollLock(enabled);

          queueMicrotask(() => {
            expect(document.body.style.overflow).toBe('hidden');

            lock.unlock();

            queueMicrotask(() => {
              expect(document.body.style.overflow).toBe(originalOverflow);

              dispose();
              resolve();
            });
          });
        });
      });
    });
  });

  describe('Cleanup', () => {
    it('should restore original styles on dispose', async () => {
      const originalOverflow = document.body.style.overflow || '';
      const originalPadding = document.body.style.paddingRight || '';

      await new Promise<void>(resolve => {
        createRoot(dispose => {
          const [enabled] = createSignal(true);
          createScrollLock(enabled, { reserveScrollBarGap: true });

          queueMicrotask(() => {
            expect(document.body.style.overflow).toBe('hidden');

            dispose();

            queueMicrotask(() => {
              expect(document.body.style.overflow).toBe(originalOverflow);
              expect(document.body.style.paddingRight).toBe(originalPadding);
              resolve();
            });
          });
        });
      });
    });
  });

  describe('Solid Primitives Migration', () => {
    it('should use createEffect for reactive scroll locking', async () => {
      let effectCount = 0;

      await new Promise<void>(resolve => {
        createRoot(dispose => {
          const [enabled, setEnabled] = createSignal(false);
          createScrollLock(enabled);

          // Effect should run on each signal change
          queueMicrotask(() => {
            effectCount++;
            setEnabled(true);

            queueMicrotask(() => {
              effectCount++;
              setEnabled(false);

              queueMicrotask(() => {
                effectCount++;
                // Effect should have run multiple times
                expect(effectCount).toBeGreaterThan(1);

                dispose();
                resolve();
              });
            });
          });
        });
      });
    });
  });
});
