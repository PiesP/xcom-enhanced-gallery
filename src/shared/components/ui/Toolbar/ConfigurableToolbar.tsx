/**
 * @fileoverview ConfigurableToolbar Component (TDD Phase T3)
 * @description Config 기반으로 렌더링되는 Toolbar 컴포넌트
 */

import { h } from '@shared/external/vendors';
import { Button } from '@shared/components/ui/primitive/Button';
import { useGalleryToolbarLogic, type ActionType } from '@shared/hooks/useGalleryToolbarLogic';
import type { ToolbarConfig } from './toolbarConfig';
import { defaultToolbarConfig } from './toolbarConfig';

interface ConfigurableToolbarProps {
  currentIndex: number;
  totalCount: number;
  isDownloading: boolean;
  disabled: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onDownloadCurrent: () => void;
  onDownloadAll: () => void;
  onClose: () => void;
  onOpenSettings: () => void;
  onFitOriginal: () => void;
  onFitWidth: () => void;
  onFitHeight: () => void;
  onFitContainer: () => void;
  config?: ToolbarConfig;
}

export function ConfigurableToolbar(props: ConfigurableToolbarProps) {
  const config = props.config || defaultToolbarConfig;
  const logic = useGalleryToolbarLogic(props);

  return h(
    'div',
    {
      class: 'configurable-toolbar',
      role: 'toolbar',
      'aria-label': 'Gallery controls',
    },
    config.actionGroups.map(group =>
      h(
        'div',
        {
          key: group.id,
          class: `toolbar-group toolbar-group--${group.id}`,
          role: 'group',
          'aria-label': `${group.id} actions`,
        },
        group.actions.map(action => {
          const buttonProps = logic.getActionProps(action.type as ActionType);

          return h(Button, {
            key: action.type,
            variant: action.variant || 'secondary',
            size: action.size || 'md',
            disabled: buttonProps.disabled,
            selected: buttonProps.selected || false,
            loading: buttonProps.loading || false,
            onClick: buttonProps.onClick,
            'aria-label': action.label,
            'data-action': action.type,
            children: action.icon,
          });
        })
      )
    )
  );
}
