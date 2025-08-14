/**
 * @file ToolbarGroup - 접근성/스타일 일관성을 위한 그룹 래퍼 컴포넌트
 */
import { getPreact } from '@shared/external/vendors';
import styles from '../Toolbar.module.css';

import type { ComponentChildren } from 'preact';

export interface ToolbarGroupProps {
  label: string;
  children?: ComponentChildren;
  'data-testid'?: string;
}

export function ToolbarGroup({ label, children, 'data-testid': testId }: ToolbarGroupProps) {
  const { h } = getPreact();
  return h(
    'div',
    {
      className: styles.groupBox,
      role: 'group',
      'aria-label': label,
      'data-group': label,
      'data-testid': testId,
    },
    children
  );
}

export default ToolbarGroup;
