import { getPreact, getPreactHooks } from '@shared/external/vendors';
import styles from './MediaCounter.module.css';

export interface MediaCounterProps {
  current: number; // 1-based index already preferred
  total: number;
  layout?: 'stacked' | 'inline';
  showProgress?: boolean;
  className?: string;
  'data-testid'?: string;
}

export function MediaCounter({
  current,
  total,
  layout = 'stacked',
  showProgress = true,
  className = '',
  'data-testid': testId,
}: MediaCounterProps) {
  const { h } = getPreact();
  const { useMemo } = getPreactHooks();

  const percent = useMemo(() => {
    if (!total || total <= 0) return 0;
    // current는 1-based라 가정
    const ratio = current / total;
    return Math.min(100, Math.max(0, ratio * 100));
  }, [current, total]);

  const wrapperClass = `${styles.mediaCounterWrapper} ${
    layout === 'inline' ? styles.inline : ''
  } ${className}`.trim();

  return h(
    'div',
    {
      className: wrapperClass,
      'data-testid': testId,
      role: 'group',
      'aria-label': '미디어 위치',
      'data-layout': layout,
    },
    [
      h(
        'span',
        {
          className: styles.mediaCounter,
          'aria-live': 'polite',
          'data-gallery-element': 'counter',
        },
        [
          h('span', { className: styles.currentIndex }, String(current)),
          h('span', { className: styles.separator }, '/'),
          h('span', { className: styles.totalCount }, String(total)),
        ]
      ),
      showProgress &&
        h(
          'div',
          {
            className: styles.progressBar,
            role: 'progressbar',
            'aria-valuenow': Math.round(percent),
            'aria-valuemax': total || 0,
            'aria-valuemin': 0,
            'aria-valuetext': `${Math.round(percent)}% (${current}/${total})`,
          },
          h('div', { className: styles.progressFill, style: { width: `${percent}%` } })
        ),
    ]
  );
}

export default MediaCounter;
