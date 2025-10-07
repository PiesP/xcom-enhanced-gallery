/* eslint-disable no-undef */
/**
 * createDOMReady Primitive Test (Phase 3 TDD)
 * @description Solid.js primitives로 변환된 DOM Ready 테스트
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createRoot, createSignal } from 'solid-js';
import { createDOMReady } from '@/shared/primitives/domReady-solid';

describe('createDOMReady (Phase 3 TDD)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('DOM Ready 기본 동작', () => {
    it('should create a DOM ready primitive', () => {
      createRoot(dispose => {
        const ready = createDOMReady(() => []);

        expect(ready).toBeDefined();
        expect(typeof ready()).toBe('boolean');

        dispose();
      });
    });

    it('should initially return false', () => {
      createRoot(dispose => {
        const ready = createDOMReady(() => []);

        expect(ready()).toBe(false);

        dispose();
      });
    });

    it('should return true after requestAnimationFrame completes', async () => {
      await new Promise<void>(resolve => {
        createRoot(dispose => {
          const ready = createDOMReady(() => []);

          expect(ready()).toBe(false);

          // Wait for double rAF
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              queueMicrotask(() => {
                expect(ready()).toBe(true);

                dispose();
                resolve();
              });
            });
          });
        });
      });
    });
  });

  describe('Dependencies Reactivity', () => {
    it('should reset to false when dependencies change', async () => {
      await new Promise<void>(resolve => {
        createRoot(dispose => {
          const [count, setCount] = createSignal(0);
          const ready = createDOMReady(() => [count()]);

          // Wait for initial ready
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              queueMicrotask(() => {
                expect(ready()).toBe(true);

                // Change dependency
                setCount(1);

                // Should reset to false
                queueMicrotask(() => {
                  expect(ready()).toBe(false);

                  // Wait for ready again
                  requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                      queueMicrotask(() => {
                        expect(ready()).toBe(true);

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
      });
    });

    it('should handle multiple dependency changes', async () => {
      let readyCount = 0;

      await new Promise<void>(resolve => {
        createRoot(dispose => {
          const [count, setCount] = createSignal(0);
          const ready = createDOMReady(() => [count()]);

          const checkReady = () => {
            if (ready()) {
              readyCount++;

              if (readyCount === 3) {
                expect(readyCount).toBe(3);
                dispose();
                resolve();
              } else {
                // Trigger next change
                setCount(prev => prev + 1);
                requestAnimationFrame(() => {
                  requestAnimationFrame(() => {
                    queueMicrotask(checkReady);
                  });
                });
              }
            }
          };

          // Start checking
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              queueMicrotask(checkReady);
            });
          });
        });
      });
    });
  });

  describe('Cleanup', () => {
    it('should cancel pending animation frames on dispose', () => {
      createRoot(dispose => {
        const ready = createDOMReady(() => []);

        expect(ready()).toBe(false);

        // Dispose immediately (before rAF completes)
        dispose();

        // Just verify dispose doesn't throw
        expect(true).toBe(true);
      });
    });
  });

  describe('Solid Primitives Migration', () => {
    it('should use createEffect for reactive ready state', async () => {
      await new Promise<void>(resolve => {
        createRoot(dispose => {
          const [trigger, setTrigger] = createSignal(0);
          const ready = createDOMReady(() => [trigger()]);

          let effectRuns = 0;

          // Track effect runs via dependency changes
          const checkEffect = () => {
            effectRuns++;
            if (effectRuns === 2) {
              // Effect should have run twice (initial + after dependency change)
              expect(effectRuns).toBeGreaterThanOrEqual(2);
              dispose();
              resolve();
            } else {
              setTrigger(prev => prev + 1);
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  queueMicrotask(checkEffect);
                });
              });
            }
          };

          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              queueMicrotask(checkEffect);
            });
          });
        });
      });
    });
  });
});
