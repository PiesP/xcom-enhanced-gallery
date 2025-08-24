/**
 * @fileoverview ToolbarWithSettings 컴포넌트 테스트 (단순화)
 */

import { describe, it, expect } from 'vitest';

describe('ToolbarWithSettings', () => {
  it('컴포넌트가 정의되어야 함', async () => {
    const { ToolbarWithSettings } = await import('@shared/components/ui');
    expect(ToolbarWithSettings).toBeDefined();
    expect(typeof ToolbarWithSettings).toBe('function');
  });

  it('컴포넌트가 export되어야 함', async () => {
    const ui = await import('@shared/components/ui');
    expect(ui.ToolbarWithSettings).toBeDefined();
  });

  it('컴포넌트 타입이 함수여야 함', async () => {
    const { ToolbarWithSettings } = await import('@shared/components/ui');
    expect(typeof ToolbarWithSettings).toBe('function');
  });
});
