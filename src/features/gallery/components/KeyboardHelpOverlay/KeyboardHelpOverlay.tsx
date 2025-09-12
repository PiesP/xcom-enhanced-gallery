import { getPreact, getPreactHooks } from '@shared/external/vendors';
import { IconButton } from '@shared/components/ui';
import styles from './KeyboardHelpOverlay.module.css';

export interface KeyboardHelpOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function KeyboardHelpOverlay({ open, onClose }: KeyboardHelpOverlayProps) {
  const { h } = getPreact();
  const { useEffect, useRef, useCallback } = getPreactHooks();

  const dialogRef = useRef<HTMLDivElement | null>(null);
  const titleId = 'xeg-kbd-help-title';
  const descId = 'xeg-kbd-help-desc';

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    },
    [open, onClose]
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [open, onKeyDown]);

  if (!open) return null;

  return h(
    'div',
    {
      className: styles.backdrop,
      role: 'presentation',
      onClick: (e: MouseEvent) => {
        if (e.target === e.currentTarget) onClose();
      },
    },
    h(
      'div',
      {
        ref: dialogRef,
        className: styles.dialog,
        role: 'dialog',
        'aria-modal': 'true',
        'aria-labelledby': titleId,
        'aria-describedby': descId,
      },
      [
        h(IconButton, {
          key: 'close',
          className: styles.closeButton || '',
          size: 'md',
          // 닫기는 파괴적 액션이 아니므로 intent 생략(중립)
          onClick: () => onClose(),
          'aria-label': 'Close',
        }),
        h('h2', { id: titleId, className: styles.title }, 'Keyboard shortcuts'),
        h(
          'div',
          { id: descId, className: styles.content },
          (() => {
            const items = [
              h('li', { key: 'nav-left' }, 'ArrowLeft: Previous media'),
              h('li', { key: 'nav-right' }, 'ArrowRight: Next media'),
              h('li', { key: 'close' }, 'Escape: Close gallery'),
              h('li', { key: 'toggle' }, '?: Show this help'),
            ];
            return h('ul', { className: styles.shortcutList }, items);
          })()
        ),
      ]
    )
  );
}

export default KeyboardHelpOverlay;
