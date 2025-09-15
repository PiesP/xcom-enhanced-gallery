import styles from './Toast.module.css';
import {
  getPreact,
  getPreactHooks,
  getPreactCompat,
  getPreactSignals,
  type VNode,
} from '../../../external/vendors';
import { ComponentStandards } from '../StandardProps';
import type { StandardToastProps } from '../StandardProps';

// Constants
const DEFAULT_TOAST_DURATION = 5000; // 5 seconds

export interface ToastItem {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  duration?: number;
  actionText?: string;
  onAction?: () => void;
}

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

function ToastComponent({
  toast,
  onRemove,
  className,
  'data-testid': testId,
  'aria-label': ariaLabel,
  role = 'alert',
}: ToastProps): VNode {
  const { useEffect } = getPreactHooks();
  // 표준화된 타이머 매니저 사용(누수/정리 용이)
  const { globalTimerManager } = require('../../../utils/timer-management');

  // 안전성 체크
  if (!toast || !onRemove) {
    throw new Error('Toast component requires both toast and onRemove props');
  }

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = globalTimerManager.setTimeout(() => {
        onRemove(toast.id);
      }, toast.duration);

      return (): void => globalTimerManager.clearTimeout(timer);
    }

    // duration이 없거나 0일 때도 cleanup 함수 반환
    return (): void => {
      // 정리할 것이 없지만 일관성을 위해 빈 함수 반환
    };
  }, [toast.id, toast.duration, onRemove]);

  const handleClose = (event: Event): void => {
    event.stopPropagation();
    onRemove(toast.id);
  };

  const handleAction = (event: Event): void => {
    event.stopPropagation();
    if (toast.onAction) {
      toast.onAction();
    }
    onRemove(toast.id);
  };

  // Toast 타입에 따른 아이콘 선택
  const getToastIcon = () => {
    // 임시로 간단한 아이콘 반환
    return '🔔';
  };

  // 표준화된 클래스명 생성
  const toastClass = ComponentStandards.createClassName(
    styles.toast,
    styles[toast.type],
    className
  );

  // 표준화된 테스트 속성 생성
  const testProps = ComponentStandards.createTestProps(testId);

  const { h } = getPreact();

  return h(
    'div',
    {
      className: toastClass,
      role: role as 'alert' | 'status' | 'log',
      'aria-label': ariaLabel || `${toast.type} 알림: ${toast.title}`,
      ...testProps,
    } as Record<string, unknown>,
    h('div', { className: styles.content }, [
      h('div', { className: styles.header, key: 'header' }, [
        getToastIcon(),
        h('h4', { className: styles.title, key: 'title' }, toast.title),
        h(
          'button',
          {
            className: styles.closeButton,
            onClick: handleClose,
            'aria-label': '알림 닫기',
            key: 'close',
          },
          '×'
        ),
      ]),
      h('p', { className: styles.message, key: 'message' }, toast.message),
      toast.actionText &&
        toast.onAction &&
        h(
          'div',
          { className: styles.actions, key: 'actions' },
          h('button', { className: styles.actionButton, onClick: handleAction }, toast.actionText)
        ),
    ])
  );
}

// Toast props 비교 함수 - 효율적인 메모이제이션을 위함
const areToastPropsEqual = (prevProps: ToastProps, nextProps: ToastProps): boolean => {
  // toast 객체가 변경되었는지 확인
  if (prevProps.toast?.id !== nextProps.toast?.id) return false;
  if (prevProps.toast?.type !== nextProps.toast?.type) return false;
  if (prevProps.toast?.title !== nextProps.toast?.title) return false;
  if (prevProps.toast?.message !== nextProps.toast?.message) return false;
  if (prevProps.toast?.duration !== nextProps.toast?.duration) return false;
  if (prevProps.toast?.actionText !== nextProps.toast?.actionText) return false;

  // onRemove 함수 비교 (참조 비교)
  if (prevProps.onRemove !== nextProps.onRemove) return false;

  // 기타 props 비교
  if (prevProps.className !== nextProps.className) return false;
  if (prevProps['data-testid'] !== nextProps['data-testid']) return false;
  if (prevProps['aria-label'] !== nextProps['aria-label']) return false;
  if (prevProps.role !== nextProps.role) return false;

  return true;
};

// memo를 적용한 최적화된 Toast 컴포넌트 (안전한 지연 접근)
const MemoizedToast = (() => {
  try {
    const compat = getPreactCompat();
    if (compat && typeof compat.memo === 'function') {
      return compat.memo(ToastComponent, areToastPropsEqual);
    }
  } catch {
    // noop
  }
  // Fallback: memo 미적용 (테스트 환경에서 getPreactCompat 모킹 누락 시에도 모듈 로드 보장)
  return (props: ToastProps) => ToastComponent(props);
})();

// displayName 설정
Object.defineProperty(MemoizedToast, 'displayName', {
  value: 'Toast',
  writable: false,
  configurable: true,
});

// 메모이제이션된 컴포넌트를 Toast로 export
export const Toast = MemoizedToast;

// Global toast state - lazy initialization
type Signal<T> = { value: T; subscribe?: (cb: (v: T) => void) => () => void };
let _toasts: Signal<ToastItem[]> | null = null;
export const toasts = {
  get value(): ToastItem[] {
    if (!_toasts) {
      const { signal } = getPreactSignals();
      _toasts = signal<ToastItem[]>([]) as unknown as Signal<ToastItem[]>;
    }
    return _toasts.value || [];
  },
  set value(newValue: ToastItem[]) {
    if (!_toasts) {
      const { signal } = getPreactSignals();
      _toasts = signal<ToastItem[]>([]) as unknown as Signal<ToastItem[]>;
    }
    _toasts.value = newValue;
  },
  subscribe(callback: (value: ToastItem[]) => void) {
    if (!_toasts) {
      const { signal } = getPreactSignals();
      _toasts = signal<ToastItem[]>([]) as unknown as Signal<ToastItem[]>;
    }
    return _toasts.subscribe?.(value => callback(value || [])) || (() => {});
  },
};

let toastIdCounter = 0;

export function addToast(toast: Omit<ToastItem, 'id'>): string {
  const id = `toast_${++toastIdCounter}_${Date.now()}`;
  const newToast: ToastItem = {
    ...toast,
    id,
    duration: toast.duration ?? DEFAULT_TOAST_DURATION,
  };

  toasts.value = [...toasts.value, newToast];
  return id;
}

export function removeToast(id: string): void {
  toasts.value = toasts.value.filter(toast => toast.id !== id);
}

export function clearAllToasts(): void {
  toasts.value = [];
}
