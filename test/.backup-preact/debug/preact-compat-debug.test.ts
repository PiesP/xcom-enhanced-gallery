/**
 * @fileoverview Preact Compat ForwardRef Debug Test
 */

import { describe, it, expect, vi } from 'vitest';
import { getPreactCompat } from '@shared/external/vendors';

describe('Debug: Preact Compat ForwardRef', () => {
  it('should have forwardRef function available', () => {
    try {
      console.log('🔍 Testing getPreactCompat...');
      const compatAPI = getPreactCompat();

      console.log('✅ getPreactCompat() returned:', compatAPI);
      console.log('🔍 Keys in compatAPI:', Object.keys(compatAPI));
      console.log('🔍 forwardRef value:', compatAPI.forwardRef);
      console.log('🔍 forwardRef type:', typeof compatAPI.forwardRef);
      console.log('🔍 memo value:', compatAPI.memo);
      console.log('🔍 memo type:', typeof compatAPI.memo);

      // 실제 값들 확인
      if (compatAPI.forwardRef) {
        console.log('🔍 forwardRef.toString():', compatAPI.forwardRef.toString().substring(0, 100));
      }
      if (compatAPI.memo) {
        console.log('🔍 memo.toString():', compatAPI.memo.toString().substring(0, 100));
      }

      expect(typeof compatAPI.forwardRef).toBe('function');
      expect(typeof compatAPI.memo).toBe('function');

      console.log('✅ All checks passed');
    } catch (error) {
      console.error('❌ Error in getPreactCompat:', error);
      throw error;
    }
  });
});
