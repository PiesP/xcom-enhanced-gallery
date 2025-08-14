// Compatibility wrapper reintroduced for legacy tests.
// Delegates to ToolbarButton while preserving previous API surface expected by tests.
import { ToolbarButton } from './ToolbarButton';
import type { IconName } from '@shared/services/icon-service';

export interface ToolbarIconButtonProps {
  icon: IconName; // icon name used by new ToolbarButton
  label?: string; // used for aria-label
  title?: string; // tooltip
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: (ev: MouseEvent) => void;
  'data-testid'?: string;
  className?: string; // deprecated
  'aria-label'?: string; // explicit override
}

export function ToolbarIconButton({
  icon,
  label,
  title,
  variant = 'secondary',
  size = 'md',
  disabled,
  loading,
  onClick = () => {},
  'data-testid': testId,
  'aria-label': ariaLabelProp,
}: ToolbarIconButtonProps) {
  const buttonProps: {
    icon: IconName;
    variant: 'primary' | 'secondary' | 'ghost' | 'danger';
    size: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    loading?: boolean;
    onClick: () => void;
    'aria-label': string;
    title?: string;
    'data-testid'?: string;
  } = {
    icon,
    variant,
    size,
    onClick: () => onClick(new MouseEvent('click')),
    'aria-label': ariaLabelProp || label || title || icon,
  };

  // Only add optional props if they have defined values
  if (disabled !== undefined) {
    buttonProps.disabled = disabled;
  }
  if (loading !== undefined) {
    buttonProps.loading = loading;
  }
  const titleValue = title || label;
  if (titleValue) {
    buttonProps.title = titleValue;
  }
  if (testId !== undefined) {
    buttonProps['data-testid'] = testId;
  }

  return <ToolbarButton {...buttonProps} />;
}

export default ToolbarIconButton;
