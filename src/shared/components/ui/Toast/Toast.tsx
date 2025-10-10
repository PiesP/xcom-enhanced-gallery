import { getSolid, type JSXElement } from '@shared/external/vendors';
import { ComponentStandards } from '../StandardProps';
import type { StandardToastProps } from '../StandardProps';
import type { ToastItem as ServiceToastItem } from '@/shared/services/UnifiedToastManager';
import { globalTimerManager } from '@shared/utils/timer-management';
import styles from './Toast.module.css';

// Constants (상태/함수는 서비스에서 관리)

// UI에서는 서비스의 ToastItem 타입만 사용하여 드리프트를 방지합니다.
export interface ToastItem extends ServiceToastItem {}

// 레거시 Props 인터페이스 (하위 호환성)
interface LegacyToastProps {
  toast: ToastItem;
  onRemove: (id: string) => void;
}

// 통합된 Toast Props
export interface ToastProps extends Partial<StandardToastProps>, Partial<LegacyToastProps> {
  // 필수 props
  toast?: ToastItem;
  onRemove?: (id: string) => void;
}

const { createEffect, onCleanup } = getSolid();

// Toast 컴포넌트
export function Toast({
  toast,
  onRemove,
  className,
  'data-testid': testId,
  'aria-label': ariaLabel,
  role = 'alert',
}: ToastProps): JSXElement {
  // 안전성 체크
  if (!toast || !onRemove) {
    throw new Error('Toast component requires both toast and onRemove props');
  }

  // 표준화된 타이머 매니저 사용(누수/정리 용이)
  createEffect(() => {
    if (!toast.duration || toast.duration <= 0) {
      return;
    }

    const timer = globalTimerManager.setTimeout(() => {
      onRemove(toast.id);
    }, toast.duration);

    onCleanup(() => {
      globalTimerManager.clearTimeout(timer);
    });
  });

  const handleClose = (event: Event): void => {
    event.stopPropagation();
    onRemove(toast.id);
  };

  const handleAction = (event: Event): void => {
    event.stopPropagation();
    toast.onAction?.();
    onRemove(toast.id);
  };

  // Toast 타입에 따른 아이콘 선택
  const getToastIcon = (): string => '🔔';

  // 표준화된 클래스명 생성
  const toastClass = ComponentStandards.createClassName(
    styles.toast,
    styles[toast.type],
    className
  );

  // 표준화된 테스트 속성 생성
  const testProps = ComponentStandards.createTestProps(testId);

  return (
    <div
      class={toastClass}
      role={role as 'alert' | 'status' | 'log'}
      aria-label={ariaLabel ?? `${toast.type} 알림: ${toast.title}`}
      {...testProps}
    >
      <div class={styles.content}>
        <div class={styles.header}>
          <span class={styles.icon} aria-hidden='true'>
            {getToastIcon()}
          </span>
          <h4 class={styles.title}>{toast.title}</h4>
          <button
            type='button'
            class={styles.closeButton}
            onClick={handleClose}
            aria-label='알림 닫기'
          >
            ×
          </button>
        </div>
        <p class={styles.message}>{toast.message}</p>
        {toast.actionText && toast.onAction && (
          <div class={styles.actions}>
            <button type='button' class={styles.actionButton} onClick={handleAction}>
              {toast.actionText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// UI 컴포넌트는 상태/함수를 소유하지 않습니다. 상태 제어는 UnifiedToastManager가 담당합니다.
