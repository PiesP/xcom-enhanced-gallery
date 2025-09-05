/**
 * @fileoverview Lazy Loading Icon Component
 * @description 성능 최적화된 지연 로딩 아이콘 컴포넌트
 */

import { type VNode } from 'preact';
import { getPreact, getPreactHooks } from '@shared/external/vendors';
import { getIconRegistry, type IconName, type IconComponent } from '@shared/services/iconRegistry';

interface LazyIconProps {
  /** 아이콘 이름 */
  name: IconName;
  /** 아이콘 크기 */
  size?: number | string;
  /** 스트로크 굵기 */
  stroke?: number;
  /** 아이콘 색상 */
  color?: string;
  /** 추가 클래스명 */
  className?: string;
  /** 로딩 중 표시할 컴포넌트 */
  fallback?: VNode | null;
  /** 에러 시 표시할 컴포넌트 */
  errorFallback?: VNode | null;
  /** 테스트 ID */
  'data-testid'?: string;
}

/**
 * 성능 최적화된 지연 로딩 아이콘 컴포넌트
 */
export function LazyIcon({
  name,
  size = 20,
  stroke = 2,
  color = 'currentColor',
  className = '',
  fallback = null,
  errorFallback = null,
  'data-testid': testId,
}: LazyIconProps): VNode {
  const { h } = getPreact();
  const { useState, useEffect } = getPreactHooks();

  // 로딩 상태 관리
  const [iconState, setIconState] = useState<{
    status: 'loading' | 'loaded' | 'error';
    component?: IconComponent;
    error?: Error;
  }>({ status: 'loading' });

  // 아이콘 로드
  useEffect(() => {
    let cancelled = false;

    const loadIcon = async () => {
      try {
        const component = await getIconRegistry().loadIcon(name);
        if (!cancelled) {
          setIconState({ status: 'loaded', component });
        }
      } catch (error) {
        if (!cancelled) {
          setIconState({
            status: 'error',
            error: error instanceof Error ? error : new Error('Unknown error'),
          });
        }
      }
    };

    loadIcon();

    return () => {
      cancelled = true;
    };
  }, [name]);

  // 로딩 상태
  if (iconState.status === 'loading') {
    return (
      fallback ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (h as any)('div', {
        className: `lazy-icon-loading ${className}`,
        'aria-label': '아이콘 로딩 중',
        'data-testid': testId ? `${testId}-loading` : undefined,
        style: { width: size, height: size },
      })
    );
  }

  // 에러 상태
  if (iconState.status === 'error') {
    return (
      errorFallback ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (h as any)(
        'div',
        {
          className: `lazy-icon-error ${className}`,
          'aria-label': '아이콘 로드 실패',
          'data-testid': testId ? `${testId}-error` : undefined,
          style: { width: size, height: size },
          title: iconState.error?.message,
        },
        '⚠️'
      )
    );
  }

  // 로드 완료
  if (iconState.status === 'loaded' && iconState.component) {
    const IconComponent = iconState.component;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (h as any)(IconComponent as any, {
      size,
      stroke,
      color,
      className,
      'data-testid': testId,
    });
  }

  // Fallback
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (h as any)('div', {
    className: `lazy-icon-fallback ${className}`,
    'data-testid': testId,
    style: { width: size, height: size },
  });
}
