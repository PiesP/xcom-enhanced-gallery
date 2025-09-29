import type { JSX } from 'solid-js';
import { getSolidCore } from '@shared/external/vendors';
import styles from './MediaCounter.module.css';

export interface MediaCounterProps {
  current: number;
  total: number;
  layout?: 'stacked' | 'inline';
  showProgress?: boolean;
  className?: string;
  'data-testid'?: string;
  readonly [key: string]: unknown;
}

export const MediaCounter = (props: MediaCounterProps): JSX.Element => {
  const { createMemo } = getSolidCore();

  const layout = () => props.layout ?? 'stacked';
  const showProgress = () => props.showProgress ?? true;
  const className = () => props.className ?? '';

  const restProps = createMemo(() => {
    const keysToExclude = new Set([
      'current',
      'total',
      'layout',
      'showProgress',
      'className',
      'data-testid',
    ]);
    const extracted: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(props)) {
      if (!keysToExclude.has(key)) {
        extracted[key] = value;
      }
    }
    return extracted;
  });

  const percent = createMemo(() => {
    if (!props.total || props.total <= 0) {
      return 0;
    }
    const ratio = props.current / props.total;
    return Math.min(100, Math.max(0, ratio * 100));
  });

  const wrapperClass = createMemo(() =>
    [styles.mediaCounterWrapper, layout() === 'inline' ? styles.inline : '', className()]
      .filter(Boolean)
      .join(' ')
      .trim()
  );

  return (
    <div
      {...(restProps() as Record<string, unknown>)}
      class={wrapperClass()}
      data-testid={props['data-testid']}
      role='group'
      aria-label='미디어 위치'
      data-layout={layout()}
    >
      <span class={styles.mediaCounter} aria-live='polite' data-gallery-element='counter'>
        <span class={styles.currentIndex}>{props.current}</span>
        <span class={styles.separator}>/</span>
        <span class={styles.totalCount}>{props.total}</span>
      </span>
      {showProgress() ? (
        <div
          class={styles.progressBar}
          role='progressbar'
          aria-valuenow={Math.round(percent())}
          aria-valuemax={props.total || 0}
          aria-valuemin={0}
          aria-valuetext={`${Math.round(percent())}% (${props.current}/${props.total})`}
        >
          <div class={styles.progressFill} style={{ width: `${percent()}%` }} />
        </div>
      ) : null}
    </div>
  );
};

export default MediaCounter;
