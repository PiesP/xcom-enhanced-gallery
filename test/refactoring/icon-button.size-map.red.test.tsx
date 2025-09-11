/**
 * @file RED: IconButton 사이즈 맵/일관성 테스트
 * 목표: IconButton 이 내부적으로 정의된 사이즈 맵(SM/MD/LG/TOOLBAR)과 매핑이 일치하고
 * 버튼에 해당 size-* 클래스가 항상 존재함을 가드. 구현 이전엔 실패 가능.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { h } from 'preact';
import { IconButton } from '../../src/shared/components/ui/Button/IconButton';

// 기대 사이즈 키
const EXPECTED_SIZES = ['sm', 'md', 'lg', 'toolbar'] as const;

describe('RED: IconButton size map 일관성', () => {
  it('정의된 EXPECTED_SIZES 각각에 대해 size-* 클래스가 적용되어야 한다', () => {
    for (const size of EXPECTED_SIZES) {
      render(
        h(
          IconButton,
          {
            size,
            'aria-label': `${size} icon`,
            'data-testid': `icon-${size}`,
          },
          '★'
        )
      );
      const btn = screen.getByTestId(`icon-${size}`);
      // CSS Module className에 _size-<size>_ 패턴 존재 기대
      expect(
        btn.className,
        `IconButton size='${size}' 에 대응하는 클래스가 없습니다: ${btn.className}`
      ).toMatch(new RegExp(`size-${size}`));
    }
  });
});
