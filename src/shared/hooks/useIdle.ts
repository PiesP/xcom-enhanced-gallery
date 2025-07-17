import { useState, useEffect, useRef, useCallback } from 'preact/hooks';

/**
 * 사용자가 지정된 시간 동안 활동이 없으면 유휴 상태로 전환하는 Preact 훅.
 *
 * @param timeout 유휴 상태로 전환되기까지의 시간 (밀리초 단위). 기본값은 3000ms.
 * @returns 현재 유휴 상태인지 여부를 나타내는 boolean 값 (true: 유휴, false: 활성).
 */
export const useIdle = (timeout: number = 3000): boolean => {
  const [isIdle, setIsIdle] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);

  // 사용자의 활동을 감지하여 타이머를 리셋하고 앱 상태를 '활성'으로 변경하는 함수.
  // useCallback을 사용하여 이 함수의 참조가 불필요하게 변경되는 것을 방지합니다.
  const resetIdleTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // 상태를 '활성'으로 변경
    if (isIdle) {
      setIsIdle(false);
    }

    // 새로운 타이머 설정. timeout 이후 '유휴' 상태로 변경됩니다.
    timerRef.current = window.setTimeout(() => {
      setIsIdle(true);
    }, timeout);
  }, [timeout, isIdle]);

  useEffect(() => {
    // 사용자의 활동으로 간주할 이벤트 목록 (마우스 움직임 제거)
    // 'wheel'(스크롤) 이벤트를 명시적으로 포함하여 스크롤 시 유휴 상태 방지
    const activityEvents: (keyof WindowEventMap)[] = [
      // 'mousemove', // 제거됨 - 순수 CSS 호버로 대체
      'wheel', // 스크롤 이벤트 - 갤러리 스크롤 시 UI 숨김 방지
      'keydown',
      'mousedown',
    ];

    // 컴포넌트 마운트 시 타이머를 시작하고 이벤트 리스너를 등록합니다.
    resetIdleTimer();
    activityEvents.forEach(event =>
      window.addEventListener(event, resetIdleTimer, { passive: true })
    );

    // 컴포넌트 언마운트 시 이벤트 리스너와 타이머를 정리하여 메모리 누수를 방지합니다.
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      activityEvents.forEach(event => window.removeEventListener(event, resetIdleTimer));
    };
  }, [resetIdleTimer]);

  return isIdle;
};
