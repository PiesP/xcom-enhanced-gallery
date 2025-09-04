/**
 * @fileoverview Toolbar Configuration (TDD Phase T3)
 * @description Config 기반 Toolbar 렌더링을 위한 설정
 */

export interface ToolbarActionConfig {
  type: string;
  icon: string;
  label: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export interface ToolbarActionGroup {
  id: string;
  actions: ToolbarActionConfig[];
}

export interface ToolbarConfig {
  actionGroups: ToolbarActionGroup[];
}

export const defaultToolbarConfig: ToolbarConfig = {
  actionGroups: [
    {
      id: 'navigation',
      actions: [
        {
          type: 'previous',
          icon: 'chevron-left',
          label: 'Previous image',
          variant: 'secondary',
        },
        {
          type: 'next',
          icon: 'chevron-right',
          label: 'Next image',
          variant: 'secondary',
        },
      ],
    },
    {
      id: 'fitModes',
      actions: [
        {
          type: 'fitOriginal',
          icon: 'aspect-ratio',
          label: 'Fit to original size',
          variant: 'outline',
        },
        {
          type: 'fitWidth',
          icon: 'arrows-horizontal',
          label: 'Fit to width',
          variant: 'outline',
        },
        {
          type: 'fitHeight',
          icon: 'arrows-vertical',
          label: 'Fit to height',
          variant: 'outline',
        },
        {
          type: 'fitContainer',
          icon: 'maximize',
          label: 'Fit to container',
          variant: 'outline',
        },
      ],
    },
    {
      id: 'downloads',
      actions: [
        {
          type: 'downloadCurrent',
          icon: 'download',
          label: 'Download current',
          variant: 'primary',
        },
        {
          type: 'downloadAll',
          icon: 'downloads',
          label: 'Download all',
          variant: 'secondary',
        },
      ],
    },
    {
      id: 'controls',
      actions: [
        {
          type: 'settings',
          icon: 'settings',
          label: 'Settings',
          variant: 'secondary',
        },
        {
          type: 'close',
          icon: 'x',
          label: 'Close gallery',
          variant: 'secondary',
        },
      ],
    },
  ],
};
