import { type ComponentChildren, type JSXElement } from '@shared/external/vendors';
import { createClassName } from '@shared/utils/component-utils';
import styles from './ToolbarShell.module.css';

const css = styles as Record<string, string>;

const elevationClassMap: Record<'low' | 'medium' | 'high', string> = {
  low: css.elevationLow!,
  medium: css.elevationMedium!,
  high: css.elevationHigh!,
};

const surfaceClassMap: Record<'glass' | 'solid' | 'overlay', string> = {
  glass: css.surfaceGlass!,
  solid: css.surfaceSolid!,
  overlay: css.surfaceOverlay!,
};

const positionClassMap: Record<'fixed' | 'sticky' | 'relative', string> = {
  fixed: css.positionFixed!,
  sticky: css.positionSticky!,
  relative: css.positionRelative!,
};

export interface ToolbarShellProps {
  children: ComponentChildren;
  elevation?: 'low' | 'medium' | 'high';
  surfaceVariant?: 'glass' | 'solid' | 'overlay';
  position?: 'fixed' | 'sticky' | 'relative';
  className?: string;
  'data-testid'?: string;
  'aria-label'?: string;
}

export function ToolbarShell({
  children,
  elevation = 'medium',
  surfaceVariant = 'glass',
  position = 'fixed',
  className,
  'data-testid': testId,
  'aria-label': ariaLabel,
  ...rest
}: ToolbarShellProps): JSXElement {
  const shellClass = createClassName(
    css.shell,
    elevationClassMap[elevation],
    surfaceClassMap[surfaceVariant],
    positionClassMap[position],
    className
  );

  return (
    <div
      class={shellClass}
      role='toolbar'
      aria-label={ariaLabel ?? 'Toolbar'}
      data-testid={testId}
      {...rest}
    >
      {children}
    </div>
  );
}
