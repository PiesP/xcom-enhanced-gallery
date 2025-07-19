/**
 * Button Component for X.com Gallery
 * @version 3.0.0 - Button Component
 */

import type { ComponentChildren } from '@core/external/vendors';
import { getPreactCompat } from '@core/external/vendors';
import styles from './Button.module.css';

interface ButtonProps {
  children: ComponentChildren;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: ((event?: Event) => void) | (() => void) | undefined;
  'aria-label'?: string;
  className?: string | undefined;
}

export type { ButtonProps };

export const Button = (() => {
  const { forwardRef } = getPreactCompat();
  return forwardRef<HTMLButtonElement, ButtonProps>(
    (
      {
        children,
        variant = 'primary',
        size = 'md',
        disabled,
        loading,
        onClick,
        className,
        ...props
      },
      ref
    ) => {
      const buttonClass = [styles.button, styles[variant], styles[size], className]
        .filter(Boolean)
        .join(' ');

      return (
        <button
          ref={ref}
          className={buttonClass}
          disabled={disabled || loading}
          onClick={onClick}
          {...props}
        >
          {loading && <span className={styles.spinner} aria-hidden='true' />}
          {children}
        </button>
      );
    }
  );
})();

export default Button;
