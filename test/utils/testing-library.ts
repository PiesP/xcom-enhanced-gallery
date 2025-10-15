/**
 * Solid.js Testing Library 래퍼
 *
 * 디렉터리 구조 재정리로 인해 test/utils에 복구
 * @testing-library/dom과 solid-testing-library를 re-export
 */

// Solid Testing Library re-exports
export {
  render,
  cleanup,
  fireEvent,
  waitFor,
  screen,
  within,
  renderHook,
} from '@solidjs/testing-library';

// h (hyperscript) helper for JSX-free component creation
import { getSolid } from '../../src/shared/external/vendors/index.js';

const solid = getSolid();
export const h = solid.h;

// Act helper - wrap async operations
export async function act<T>(fn: () => T | Promise<T>): Promise<T> {
  return await Promise.resolve(fn());
}
