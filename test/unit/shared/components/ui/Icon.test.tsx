/**
 * @fileoverview Icon 컴포넌트 테스트
 */

import { describe, it, expect, vi } from 'vitest';
import { Download } from 'lucide-preact';
import { Icon } from '@shared/components/ui/Icon/Icon';

// Mock the external dependencies
let mockH = vi.fn();
vi.mock('@shared/external/vendors', () => ({
  getPreact: () => ({
    h: mockH,
  }),
}));

describe('Icon 컴포넌트', () => {
  it('기본 props로 아이콘을 렌더링한다', () => {
    mockH = vi.fn((tag, props) => ({ tag, props }));
    vi.doMock('@shared/external/vendors', () => ({
      getPreact: () => ({
        h: mockH,
      }),
    }));

    Icon({ icon: Download });

    expect(mockH).toHaveBeenCalledWith(Download, {
      size: 20,
      color: 'currentColor',
      className: '',
      strokeWidth: 2,
    });
  });

  it('커스텀 props를 적용한다', () => {
    mockH = vi.fn((tag, props) => ({ tag, props }));
    vi.doMock('@shared/external/vendors', () => ({
      getPreact: () => ({
        h: mockH,
      }),
    }));

    Icon({
      icon: Download,
      size: 24,
      color: 'blue',
      className: 'custom-class',
    });

    expect(mockH).toHaveBeenCalledWith(Download, {
      size: 24,
      color: 'blue',
      className: 'custom-class',
      strokeWidth: 2,
    });
  });

  it('LucideProps를 올바르게 전달한다', () => {
    mockH = vi.fn((tag, props) => ({ tag, props }));
    vi.doMock('@shared/external/vendors', () => ({
      getPreact: () => ({
        h: mockH,
      }),
    }));

    const customProps = {
      icon: Download,
      strokeWidth: 1.5,
      absoluteStrokeWidth: true,
    };

    Icon(customProps);

    expect(mockH).toHaveBeenCalledWith(
      Download,
      expect.objectContaining({
        strokeWidth: 1.5,
        absoluteStrokeWidth: true,
      })
    );
  });
});
