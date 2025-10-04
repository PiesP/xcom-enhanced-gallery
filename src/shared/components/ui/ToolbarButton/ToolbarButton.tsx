/**
 * ToolbarButton Primitive (TBAR-R P2)
 * - 툴바 내 모든 아이콘성 버튼을 위한 단일 추상화
 * - IconButton 대비: toolbar 전용 사이즈/상태 data-* 속성 표준화
 * - Phase 4: 커스텀 Tooltip 통합 (title prop deprecated)
 */

import type { JSX } from 'solid-js';
import { getSolidCore } from '@shared/external/vendors';
import { LazyIcon } from '@shared/components/LazyIcon';
import type { IconName } from '@shared/services/iconRegistry';
import { Tooltip } from '@shared/components/ui/Tooltip';
import { parseShortcutText } from '@shared/utils/shortcut-parser';
import styles from './ToolbarButton.module.css';
import primitiveStyles from '@shared/styles/primitives.module.css';

function classnames(...classes: Array<string | null | undefined | false>): string {
  return classes.filter(Boolean).join(' ');
}

export interface ToolbarButtonProps {
  readonly icon?: IconName;
  readonly 'aria-label': string;
  /** @deprecated Use tooltipText for custom Tooltip. title prop is no longer supported. */
  readonly title?: string;
  readonly tooltipText?: string;
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
  const [showTooltip, setShowTooltip] = createSignal(false);

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

  // Tooltip content 생성: tooltipText가 있으면 단축키 파싱하여 <kbd> 마크업 포함
  const tooltipContent = createMemo(() => {
    const text = props.tooltipText;
    if (!text) {
      return null;
    }

    const parsed = parseShortcutText(text);
    if (parsed.shortcuts.length === 0) {
      // 단축키가 없으면 일반 텍스트
      return parsed.text.trim();
    }

    // JSX 생성: 텍스트 + <kbd> 요소들
    const { Show } = getSolidCore();
    return (
      <>
        {parsed.text}
        <Show when={parsed.shortcuts.length > 0}>
          {parsed.shortcuts.map((key, index) => (
            <>
              {index > 0 ? '+' : ''}
              <kbd>{key}</kbd>
            </>
          ))}
        </Show>
      </>
    );
  });

  // 툴팁 이벤트 핸들러
  createEffect(() => {
    const node = buttonEl();
    if (!node || !tooltipContent()) {
      return;
    }

    const handleMouseEnter = () => {
      setShowTooltip(true);
    };
    const handleMouseLeave = () => {
      setShowTooltip(false);
    };
    const handleFocus = () => {
      setShowTooltip(true);
    };
    const handleBlur = () => {
      setShowTooltip(false);
    };

    node.addEventListener('mouseenter', handleMouseEnter);
    node.addEventListener('mouseleave', handleMouseLeave);
    node.addEventListener('focus', handleFocus);
    node.addEventListener('blur', handleBlur);

    onCleanup(() => {
      node.removeEventListener('mouseenter', handleMouseEnter);
      node.removeEventListener('mouseleave', handleMouseLeave);
      node.removeEventListener('focus', handleFocus);
      node.removeEventListener('blur', handleBlur);
    });
  });

  const buttonElement = (
    <button
      type='button'
      {...(restProps() as Record<string, unknown>)}
      ref={node => {
        setButtonEl(node ?? undefined);
      }}
      class={buttonClass()}
      aria-label={props['aria-label']}
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

  // Tooltip이 있으면 래핑, 없으면 버튼만 반환
  return tooltipContent() ? (
    <Tooltip content={tooltipContent()!} show={showTooltip()} placement='top' delay={500}>
      {buttonElement}
    </Tooltip>
  ) : (
    buttonElement
  );
};

export default ToolbarButton;
