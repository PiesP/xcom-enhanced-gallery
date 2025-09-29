/**
 * ToolbarButton Primitive (TBAR-R P2)
 * - 툴바 내 모든 아이콘성 버튼을 위한 단일 추상화
 * - IconButton 대비: toolbar 전용 사이즈/상태 data-* 속성 표준화
 */

import type { JSX } from 'solid-js';
import { getSolidCore } from '@shared/external/vendors';
import { LazyIcon } from '@shared/components/LazyIcon';
import type { IconName } from '@shared/services/iconRegistry';
import styles from './ToolbarButton.module.css';
import primitiveStyles from '@shared/styles/primitives.module.css';

function classnames(...classes: Array<string | null | undefined | false>): string {
  return classes.filter(Boolean).join(' ');
}

export interface ToolbarButtonProps {
  readonly icon?: IconName;
  readonly 'aria-label': string;
  readonly title?: string;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly selected?: boolean;
  readonly intent?: 'default' | 'danger';
  readonly onClick?: (event: MouseEvent) => void;
  readonly 'data-gallery-element'?: string;
  readonly 'data-testid'?: string;
  readonly key?: string;
  readonly [key: string]: unknown;
}

export const ToolbarButton = (props: ToolbarButtonProps): JSX.Element => {
  const { createMemo, createSignal, createEffect, onCleanup } = getSolidCore();

  const [buttonEl, setButtonEl] = createSignal<HTMLButtonElement | undefined>(undefined);

  const buttonClass = createMemo(() =>
    classnames(
      primitiveStyles.controlSurface,
      styles.toolbarButton,
      props.intent === 'danger' ? styles['intent-danger'] : ''
    )
  );

  const isDisabled = createMemo(() => Boolean(props.disabled || props.loading));

  const restProps = createMemo(() => {
    const keysToExclude = new Set([
      'icon',
      'aria-label',
      'title',
      'disabled',
      'loading',
      'selected',
      'intent',
      'onClick',
      'data-gallery-element',
      'data-testid',
      'key',
    ]);

    const extracted: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(props)) {
      if (!keysToExclude.has(key)) {
        extracted[key] = value;
      }
    }
    return extracted;
  });

  type ToolbarButtonMouseEvent = MouseEvent & {
    readonly currentTarget: HTMLButtonElement;
    readonly target: EventTarget & Element;
  };

  const handleClick = (event: ToolbarButtonMouseEvent) => {
    if (isDisabled() && event.isTrusted !== false) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    props.onClick?.(event);
  };

  createEffect(() => {
    const node = buttonEl();
    if (!node) {
      return;
    }
    const listener = (event: MouseEvent) => {
      handleClick(event as ToolbarButtonMouseEvent);
    };
    node.addEventListener('click', listener);
    onCleanup(() => {
      try {
        node.removeEventListener('click', listener);
      } catch {
        /* noop */
      }
    });
  });

  return (
    <button
      type='button'
      {...(restProps() as Record<string, unknown>)}
      ref={node => {
        setButtonEl(node ?? undefined);
      }}
      class={buttonClass()}
      aria-label={props['aria-label']}
      title={props.title ?? props['aria-label']}
      disabled={isDisabled()}
      aria-disabled={isDisabled() ? 'true' : 'false'}
      data-disabled={isDisabled() ? 'true' : undefined}
      data-loading={props.loading ? 'true' : undefined}
      data-selected={props.selected ? 'true' : undefined}
      data-gallery-element={props['data-gallery-element']}
      data-toolbar-button='true'
      data-testid={props['data-testid']}
    >
      {props.icon ? <LazyIcon name={props.icon} /> : null}
    </button>
  );
};

export default ToolbarButton;
