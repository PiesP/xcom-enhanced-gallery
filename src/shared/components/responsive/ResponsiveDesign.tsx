/**
 * @fileoverview ResponsiveDesign - 반응형 디자인 컴포넌트
 * @description 다양한 디바이스에서 최적화된 사용자 경험 제공
 */

import { useState, useEffect, useMemo } from 'preact/hooks';
import type { ComponentChildren } from 'preact';

/**
 * 브레이크포인트 정의
 */
export const BREAKPOINTS = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
  wide: 1440,
} as const;

/**
 * 디바이스 타입
 */
export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'wide';

/**
 * 화면 정보 인터페이스 (PC 전용)
 */
export interface ScreenInfo {
  width: number;
  height: number;
  deviceType: DeviceType;
  orientation: 'portrait' | 'landscape';
  pixelRatio: number;
}

/**
 * 반응형 컨테이너 Props
 */
export interface ResponsiveContainerProps {
  children: ComponentChildren;
  className?: string;
  mobileFirst?: boolean;
  fluid?: boolean;
  maxWidth?: number;
}

/**
 * 반응형 그리드 Props
 */
export interface ResponsiveGridProps {
  children: ComponentChildren;
  columns: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
    wide?: number;
  };
  gap?: number;
  className?: string;
}

/**
 * 반응형 이미지 Props
 */
export interface ResponsiveImageProps {
  src: string;
  alt: string;
  srcSet?: string;
  sizes?: string;
  loading?: 'lazy' | 'eager';
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * 미디어 쿼리 훅
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/**
 * 화면 정보 훅
 */
export function useScreenInfo(): ScreenInfo {
  const [screenInfo, setScreenInfo] = useState<ScreenInfo>(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
    deviceType: 'desktop',
    orientation: 'landscape',
    pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
  }));

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateScreenInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      let deviceType: DeviceType = 'desktop';
      if (width < BREAKPOINTS.mobile) {
        deviceType = 'mobile';
      } else if (width < BREAKPOINTS.tablet) {
        deviceType = 'mobile';
      } else if (width < BREAKPOINTS.desktop) {
        deviceType = 'tablet';
      } else if (width < BREAKPOINTS.wide) {
        deviceType = 'desktop';
      } else {
        deviceType = 'wide';
      }

      setScreenInfo({
        width,
        height,
        deviceType,
        orientation: width > height ? 'landscape' : 'portrait',
        pixelRatio: window.devicePixelRatio || 1,
      });
    };

    updateScreenInfo();

    const handleResize = () => {
      requestAnimationFrame(updateScreenInfo);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return screenInfo;
}

/**
 * 반응형 컨테이너 컴포넌트
 */
export function ResponsiveContainer({
  children,
  className = '',
  mobileFirst = true,
  fluid = false,
  maxWidth,
}: ResponsiveContainerProps) {
  const screenInfo = useScreenInfo();

  const containerStyle = useMemo(() => {
    const styles: Record<string, string | number> = {
      width: '100%',
      margin: '0 auto',
      padding: '0 16px',
    };

    if (!fluid) {
      if (maxWidth) {
        styles.maxWidth = `${maxWidth}px`;
      } else {
        switch (screenInfo.deviceType) {
          case 'mobile':
            styles.maxWidth = '100%';
            styles.padding = '0 12px';
            break;
          case 'tablet':
            styles.maxWidth = `${BREAKPOINTS.tablet - 32}px`;
            styles.padding = '0 16px';
            break;
          case 'desktop':
            styles.maxWidth = `${BREAKPOINTS.desktop - 64}px`;
            styles.padding = '0 24px';
            break;
          case 'wide':
            styles.maxWidth = `${BREAKPOINTS.wide - 96}px`;
            styles.padding = '0 32px';
            break;
        }
      }
    }

    return styles;
  }, [screenInfo.deviceType, fluid, maxWidth]);

  const containerClass = useMemo(() => {
    const classes = ['xeg-responsive-container'];

    if (className) {
      classes.push(className);
    }

    classes.push(`xeg-device-${screenInfo.deviceType}`);
    classes.push(`xeg-orientation-${screenInfo.orientation}`);

    if (mobileFirst) {
      classes.push('xeg-mobile-first');
    }

    return classes.join(' ');
  }, [className, screenInfo, mobileFirst]);

  return (
    <div className={containerClass} style={containerStyle}>
      {children}
    </div>
  );
}

/**
 * 반응형 그리드 컴포넌트
 */
export function ResponsiveGrid({
  children,
  columns,
  gap = 16,
  className = '',
}: ResponsiveGridProps) {
  const screenInfo = useScreenInfo();

  const gridStyle = useMemo(() => {
    let columnCount = columns.desktop || 3;

    switch (screenInfo.deviceType) {
      case 'mobile':
        columnCount = columns.mobile || 1;
        break;
      case 'tablet':
        columnCount = columns.tablet || 2;
        break;
      case 'desktop':
        columnCount = columns.desktop || 3;
        break;
      case 'wide':
        columnCount = columns.wide || 4;
        break;
    }

    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
      gap: `${gap}px`,
      width: '100%',
    };
  }, [columns, gap, screenInfo.deviceType]);

  const gridClass = useMemo(() => {
    const classes = ['xeg-responsive-grid'];

    if (className) {
      classes.push(className);
    }

    classes.push(`xeg-grid-${screenInfo.deviceType}`);

    return classes.join(' ');
  }, [className, screenInfo.deviceType]);

  return (
    <div className={gridClass} style={gridStyle}>
      {children}
    </div>
  );
}

/**
 * 반응형 이미지 컴포넌트
 */
export function ResponsiveImage({
  src,
  alt,
  srcSet,
  sizes,
  loading = 'lazy',
  className = '',
  onLoad,
  onError,
}: ResponsiveImageProps) {
  const screenInfo = useScreenInfo();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleLoad = () => {
    setImageLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setImageError(true);
    onError?.();
  };

  const imageSizes = useMemo(() => {
    if (sizes) return sizes;

    // 디바이스별 기본 sizes 설정
    switch (screenInfo.deviceType) {
      case 'mobile':
        return '(max-width: 480px) 100vw';
      case 'tablet':
        return '(max-width: 768px) 50vw';
      case 'desktop':
        return '(max-width: 1024px) 33vw';
      case 'wide':
        return '25vw';
      default:
        return '100vw';
    }
  }, [sizes, screenInfo.deviceType]);

  const imageClass = useMemo(() => {
    const classes = ['xeg-responsive-image'];

    if (className) {
      classes.push(className);
    }

    if (imageLoaded) {
      classes.push('xeg-image-loaded');
    }

    if (imageError) {
      classes.push('xeg-image-error');
    }

    classes.push(`xeg-image-${screenInfo.deviceType}`);

    return classes.join(' ');
  }, [className, imageLoaded, imageError, screenInfo.deviceType]);

  const imageStyle = useMemo(
    () => ({
      maxWidth: '100%',
      height: 'auto',
      transition: 'opacity 0.3s ease',
      opacity: imageLoaded ? 1 : 0,
    }),
    [imageLoaded]
  );

  return (
    <img
      src={src}
      alt={alt}
      srcSet={srcSet}
      sizes={imageSizes}
      loading={loading}
      className={imageClass}
      style={imageStyle}
      onLoad={handleLoad}
      onError={handleError}
      decoding='async'
    />
  );
}

/**
 * 브레이크포인트 유틸리티 함수들
 */
export const breakpointUtils = {
  /**
   * 현재 화면이 모바일인지 확인
   */
  isMobile: (width: number): boolean => width < BREAKPOINTS.tablet,

  /**
   * 현재 화면이 태블릿인지 확인
   */
  isTablet: (width: number): boolean => width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop,

  /**
   * 현재 화면이 데스크탑인지 확인
   */
  isDesktop: (width: number): boolean => width >= BREAKPOINTS.desktop && width < BREAKPOINTS.wide,

  /**
   * 현재 화면이 와이드스크린인지 확인
   */
  isWide: (width: number): boolean => width >= BREAKPOINTS.wide,

  /**
   * 디바이스 타입 반환
   */
  getDeviceType: (width: number): DeviceType => {
    if (width < BREAKPOINTS.tablet) return 'mobile';
    if (width < BREAKPOINTS.desktop) return 'tablet';
    if (width < BREAKPOINTS.wide) return 'desktop';
    return 'wide';
  },

  /**
   * CSS 미디어 쿼리 생성
   */
  createMediaQuery: (minWidth?: number, maxWidth?: number): string => {
    const conditions = [];
    if (minWidth) conditions.push(`(min-width: ${minWidth}px)`);
    if (maxWidth) conditions.push(`(max-width: ${maxWidth}px)`);
    return conditions.join(' and ');
  },
};

/**
 * 반응형 디자인 관련 CSS 클래스 생성
 */
export function generateResponsiveClasses(): string {
  return `
    /* 반응형 컨테이너 */
    .xeg-responsive-container {
      box-sizing: border-box;
    }

    /* 디바이스별 스타일 */
    .xeg-device-mobile {
      font-size: 14px;
      line-height: 1.4;
    }

    .xeg-device-tablet {
      font-size: 15px;
      line-height: 1.5;
    }

    .xeg-device-desktop {
      font-size: 16px;
      line-height: 1.6;
    }

    .xeg-device-wide {
      font-size: 17px;
      line-height: 1.7;
    }

    /* 반응형 그리드 */
    .xeg-responsive-grid {
      container-type: inline-size;
    }

    /* 반응형 이미지 */
    .xeg-responsive-image {
      display: block;
      transition: opacity 0.3s ease;
    }

    .xeg-image-loaded {
      opacity: 1;
    }

    .xeg-image-error {
      opacity: 0.5;
      background-color: #f0f0f0;
    }

    /* 모바일 우선 최적화 */
    .xeg-mobile-first {
      /* 모바일 우선 스타일 */
    }

    /* 미디어 쿼리 */
    @media (max-width: 479px) {
      .xeg-responsive-container {
        padding: 0 8px;
      }
    }

    @media (min-width: 480px) and (max-width: 767px) {
      .xeg-responsive-container {
        padding: 0 12px;
      }
    }

    @media (min-width: 768px) and (max-width: 1023px) {
      .xeg-responsive-container {
        padding: 0 16px;
      }
    }

    @media (min-width: 1024px) {
      .xeg-responsive-container {
        padding: 0 24px;
      }
    }

    /* 고해상도 디스플레이 최적화 */
    @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
      .xeg-responsive-image {
        image-rendering: -webkit-optimize-contrast;
      }
    }

    /* 다크 모드 지원 */
    @media (prefers-color-scheme: dark) {
      .xeg-image-error {
        background-color: #2a2a2a;
      }
    }

    /* 애니메이션 감소 모드 */
    @media (prefers-reduced-motion: reduce) {
      .xeg-responsive-image {
        transition: none;
      }
    }
  `;
}
