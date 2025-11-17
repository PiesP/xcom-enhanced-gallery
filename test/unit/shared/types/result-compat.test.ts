/**
 * Result compatibility placeholder tests
 * Ensures the legacy module remains intentionally empty.
 */

import { describe, it, expect } from 'vitest';
import * as resultCompat from '../../../../src/shared/types/result-compat';

describe('result-compat placeholder', () => {
  it('exposes no runtime exports', () => {
    expect(Object.keys(resultCompat)).toHaveLength(0);
  });
});
