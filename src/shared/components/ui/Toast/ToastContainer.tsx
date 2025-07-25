import { getPreact, getPreactHooks } from '@shared/external/vendors';
import { toasts, removeToast, Toast } from './Toast';
import styles from './ToastContainer.module.css';
import type { VNode } from '@shared/external/vendors';

/**
 * Toast 컨테이너 컴포넌트
 *
 * 화면 우상단에 고정되어 모든 토스트 알림을 표시합니다.
 */
export function ToastContainer(): VNode {
  const { h } = getPreact();
  const { useEffect, useState } = getPreactHooks();
  const [currentToasts, setCurrentToasts] = useState(toasts.value);

  useEffect(() => {
    // 토스트 상태 변경 구독
    const unsubscribe = toasts.subscribe(setCurrentToasts);
    return unsubscribe;
  }, []);

  return h(
    'div',
    styles.container ? { className: styles.container } : {},
    currentToasts.map(toast =>
      h(Toast, {
        key: toast.id,
        toast,
        onRemove: removeToast,
      })
    )
  );
}
