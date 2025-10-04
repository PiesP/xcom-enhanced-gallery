/**
 * @file NavigationButton component
 * @description Gallery navigation button (left/right) with accessibility support
 * Epic GALLERY-NAV-ENHANCEMENT Phase 2 (GREEN)
 */

import type { Component } from 'solid-js';

import { getSolidCore } from '@shared/external/vendors';

import styles from './NavigationButton.module.css';

const { mergeProps } = getSolidCore();

export interface NavigationButtonProps {
  direction: 'left' | 'right';
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
  'aria-label': string;
  'data-testid'?: string;
}

/**
 * Navigation button for gallery (left/right)
 * PC-only interaction (click, keyboard focus)
 */
export const NavigationButton: Component<NavigationButtonProps> = props => {
  const merged = mergeProps({ disabled: false, loading: false, 'data-testid': undefined }, props);

  const isDisabled = () => merged.disabled || merged.loading;

  const handleClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isDisabled()) {
      merged.onClick();
    }
  };

  return (
    <button
      type='button'
      class={`${styles.navButton} ${styles[merged.direction]}`}
      disabled={isDisabled()}
      aria-label={merged['aria-label']}
      aria-disabled={isDisabled()}
      tabindex={0}
      onClick={handleClick}
      data-testid={merged['data-testid']}
    >
      <span class={styles.icon} aria-hidden='true'>
        {merged.direction === 'left' ? '‹' : '›'}
      </span>
    </button>
  );
};
