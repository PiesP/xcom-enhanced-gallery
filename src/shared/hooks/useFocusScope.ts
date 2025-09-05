/**
 * @fileoverview useFocusScope Hook
 * @description 모달에서 포커스 트랩과 배경 요소 비활성화를 관리하는 hook
 */

import { getPreactHooks } from '@shared/external/vendors';

export interface UseFocusScopeOptions {
  /** 모달이 열려있는지 여부 */
  isOpen: boolean;
  /** 모달이 닫힐 때 호출되는 함수 */
  onClose: () => void;
  /** 초기 포커스를 받을 요소의 셀렉터 */
  initialFocusSelector?: string;
  /** 이전 포커스를 복원할지 여부 */
  restoreFocus?: boolean;
}

export interface UseFocusScopeReturn {
  /** 모달 컨테이너에 연결할 ref */
  containerRef: { current: HTMLElement | null };
  /** 키보드 이벤트 핸들러 */
  handleKeyDown: (event: KeyboardEvent) => void;
  /** 클릭 이벤트 핸들러 */
  handleClick: (event: MouseEvent) => void;
}

/**
 * 포커스 관리와 배경 비활성화를 처리하는 Hook
 */
export function useFocusScope(options: UseFocusScopeOptions): UseFocusScopeReturn {
  const { useRef, useEffect, useCallback } = getPreactHooks();
  const {
    isOpen,
    onClose,
    initialFocusSelector = 'button[aria-label="Close"]',
    restoreFocus = true,
  } = options;

  const containerRef = useRef<HTMLElement | null>(null);
  const previouslyFocusedRef = useRef<Element | null>(null);
  const originalBodyOverflowRef = useRef<string>('');
  const backgroundElementsRef = useRef<HTMLElement[]>([]);

  // 모달 열릴 때 설정
  useEffect(() => {
    if (!isOpen) return;

    // 이전 포커스 저장
    if (restoreFocus && typeof document !== 'undefined') {
      previouslyFocusedRef.current = document.activeElement;
    }

    // 스크롤 락
    if (typeof document !== 'undefined') {
      originalBodyOverflowRef.current = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      // 배경 요소들 비활성화
      backgroundElementsRef.current = [];
      const children = Array.from(document.body.children) as HTMLElement[];
      children.forEach(el => {
        if (
          !containerRef.current ||
          containerRef.current === el ||
          containerRef.current.contains(el)
        ) {
          return;
        }
        if (!el.hasAttribute('data-xeg-prev-tabindex')) {
          const prev = el.getAttribute('tabindex');
          if (prev !== null) {
            el.setAttribute('data-xeg-prev-tabindex', prev);
          }
          el.setAttribute('tabindex', '-1');
          backgroundElementsRef.current.push(el);
        }
      });
    }

    return () => {
      // cleanup when dialog unmounts while open
      if (typeof document !== 'undefined') {
        document.body.style.overflow = originalBodyOverflowRef.current;
        backgroundElementsRef.current.forEach(el => {
          const prev = el.getAttribute('data-xeg-prev-tabindex');
          if (prev !== null) {
            el.setAttribute('tabindex', prev);
            el.removeAttribute('data-xeg-prev-tabindex');
          } else {
            el.removeAttribute('tabindex');
          }
        });
      }
    };
  }, [isOpen, restoreFocus]);

  // 초기 포커스 설정
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const initialElement = containerRef.current.querySelector(
      initialFocusSelector
    ) as HTMLElement | null;

    if (initialElement) {
      initialElement.focus();
    }
  }, [isOpen, initialFocusSelector]);

  // 포커스 복원
  useEffect(() => {
    if (isOpen || !restoreFocus) return;

    const prev = previouslyFocusedRef.current as HTMLElement | null;
    if (prev && typeof prev.focus === 'function') {
      prev.focus();
    }
  }, [isOpen, restoreFocus]);

  // 키보드 이벤트 핸들러
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen || !containerRef.current) return;

      if (e.key === 'Escape') {
        // ESC는 이벤트 target이 패널 내부일 때만 처리
        const target = e.target as Node | null;
        if (target && containerRef.current.contains(target)) {
          e.stopPropagation();
          onClose();
          return;
        }
      }

      if (e.key === 'Tab') {
        const focusables = containerRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]),select:not([disabled]),[href],[tabindex]:not([tabindex="-1"])'
        );
        const list = Array.from(focusables).filter(el => !el.hasAttribute('disabled'));

        if (list.length === 0) return;

        const first = list[0];
        const last = list[list.length - 1];

        if (e.shiftKey && document.activeElement === first && last) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last && first) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [isOpen, onClose]
  );

  // 클릭 이벤트 핸들러 (백드롭 클릭)
  const handleClick = useCallback(
    (e: MouseEvent) => {
      if (!containerRef.current) return;

      const target = e.target as Node;
      // 패널 외부 클릭 또는 패널 자체 클릭 (배경 역할) 시 닫기
      if (!containerRef.current.contains(target) || target === containerRef.current) {
        onClose();
      }
    },
    [onClose]
  );

  return {
    containerRef,
    handleKeyDown,
    handleClick,
  };
}
