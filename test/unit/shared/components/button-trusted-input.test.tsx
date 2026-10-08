// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { IconButton } from '@shared/components/ui/Button/IconButton';
import { render } from 'solid-js/web';
import { describe, expect, it, vi } from 'vitest';

describe('icon-button DOM input', () => {
  it('rejects synthetic delegated clicks even after a page reparents the button', () => {
    const host = document.createElement('div');
    document.body.append(host);
    const onClick = vi.fn();
    const dispose = render(() => <IconButton aria-label="Download" onClick={onClick} />, host);
    const button = host.querySelector('button');
    if (!button) throw new Error('Missing icon button');
    try {
      button.click();
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      document.body.append(button);
      button.click();
      expect(onClick).not.toHaveBeenCalled();
    } finally {
      dispose();
      button.remove();
      host.remove();
    }
  });
});
