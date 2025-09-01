/**
 * @fileoverview Body Scroll Lock Hook (보조) - iOS Safari 등에서 overscroll-behavior 미지원/부분 지원 상황 안정성 확보
 * @description 작은 콘텐츠로 인해 갤러리 내부에서 delta가 소비되지 않을 때 문서(body/html) 스크롤을 잠가 배경 스크롤 누수를 방지한다.
 * 참고: 중복 호출 안전 / 중첩 모달 대비 refCount 방식.
 */
import { getPreactHooks } from '@shared/external/vendors';
import { logger } from '@shared/logging/logger';

interface BodyScrollLockOptions {
  enabled?: boolean; // 외부에서 동적으로 on/off 제어
  lockTargetSelector?: string; // 특정 컨테이너 영역 내에 있을 때만 적용 (미사용 시 전체)
  debugLabel?: string; // 로깅 라벨
}

// 전역 refCount (갤러리 외 다른 컴포넌트 확장 대비)
let globalLockCount = 0;
let savedScrollY = 0;
let savedScrollX = 0;
let prevBodyOverflow = '';
let prevHtmlOverflow = '';
let prevBodyPosition = '';
let prevBodyTop = '';
let prevBodyWidth = '';

function applyLock(label: string) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (globalLockCount === 0) {
    try {
      savedScrollY = window.scrollY || window.pageYOffset || 0;
      savedScrollX = window.scrollX || window.pageXOffset || 0;
      prevBodyOverflow = document.body.style.overflow;
      prevHtmlOverflow = document.documentElement.style.overflow;
      prevBodyPosition = document.body.style.position;
      prevBodyTop = document.body.style.top;
      prevBodyWidth = document.body.style.width;

      // width를 고정해야 스크롤바 제거로 인한 레이아웃 시프트 방지
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      if (scrollBarWidth > 0) {
        document.body.style.width = `calc(100% - ${scrollBarWidth}px)`;
      }

      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${savedScrollY}px`;
      document.body.style.left = `-${savedScrollX}px`;
      document.body.style.right = '0';

      logger.debug(`[BodyScrollLock] applied (label=${label})`, { savedScrollY, savedScrollX });
    } catch (error) {
      logger.warn('[BodyScrollLock] apply failed', error);
    }
  }
  globalLockCount += 1;
}

function releaseLock(label: string) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (globalLockCount === 0) return;
  globalLockCount -= 1;
  if (globalLockCount === 0) {
    try {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.position = prevBodyPosition;
      document.body.style.top = prevBodyTop;
      document.body.style.width = prevBodyWidth;

      // jsdom 등 일부 테스트 환경에서 scrollTo 미구현 → 방어 가드
      try {
        if (typeof window.scrollTo === 'function') {
          window.scrollTo(savedScrollX, savedScrollY);
        }
      } catch {
        // noop
      }
      logger.debug(`[BodyScrollLock] released (label=${label})`);
    } catch (error) {
      logger.warn('[BodyScrollLock] release failed', error);
    }
  }
}

export function useBodyScrollLock(options: BodyScrollLockOptions = {}) {
  // 레이아웃 시프트를 최소화하기 위해 mount 직후 동기 실행이 필요한 스타일 변경이므로 useLayoutEffect 사용
  const { useLayoutEffect, useRef } = getPreactHooks();
  const { enabled = true, lockTargetSelector, debugLabel = 'gallery' } = options;
  const isLockedRef = useRef(false);

  useLayoutEffect(() => {
    if (!enabled) return;

    // 특정 영역 안에서만 필요한 경우 selector 검증 (있다면)
    if (lockTargetSelector) {
      const el = document.querySelector(lockTargetSelector);
      if (!el) {
        logger.debug('[BodyScrollLock] target selector not found, skipping');
        return;
      }
    }

    if (!isLockedRef.current) {
      applyLock(debugLabel);
      isLockedRef.current = true;
    }
    return () => {
      if (isLockedRef.current) {
        releaseLock(debugLabel);
        isLockedRef.current = false;
      }
    };
  }, [enabled, lockTargetSelector, debugLabel]);

  return {
    isLocked: () => isLockedRef.current,
  } as const;
}
