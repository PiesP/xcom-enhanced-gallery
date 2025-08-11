import type { ComponentType } from 'preact';
import { logger } from '@shared/logging';

/**
 * 지원되는 아이콘 이름 목록
 * lucide-preact에서 제공하는 아이콘들 중 필요한 것들만 선별
 */
export type IconName =
  | 'download'
  | 'settings'
  | 'close'
  | 'chevron-left'
  | 'chevron-right'
  | 'zoom-in'
  | 'zoom-out'
  | 'maximize'
  | 'minimize'
  | 'rotate-cw'
  | 'play'
  | 'pause'
  | 'volume-2'
  | 'volume-x'
  | 'grid'
  | 'list'
  | 'eye'
  | 'eye-off'
  | 'trash-2'
  | 'copy'
  | 'check'
  | 'x'
  | 'user'
  | 'hash'
  | 'image'
  | 'file-text'
  | 'save'
  | 'info'
  | 'refresh-cw'
  | 'calendar'
  | 'file'
  | 'help-circle';

/**
 * 아이콘 컴포넌트 속성 인터페이스
 */
export interface IconProps {
  size?: number | string;
  color?: string;
  strokeWidth?: number;
  className?: string;
  'aria-hidden'?: boolean;
}

/**
 * 아이콘 컴포넌트 타입
 */
export type IconComponent = ComponentType<IconProps>;

/**
 * 아이콘 캐시 - 성능 최적화를 위한 메모리 캐시
 */
const iconCache = new Map<IconName, IconComponent>();

/**
 * lucide-preact 아이콘명과 실제 export명 매핑
 * 트리쉐이킹을 위해 필요한 아이콘만 명시적으로 매핑
 */
const iconImportMap: Record<IconName, string> = {
  download: 'Download',
  settings: 'Settings',
  close: 'X',
  x: 'X',
  'chevron-left': 'ChevronLeft',
  'chevron-right': 'ChevronRight',
  'zoom-in': 'ZoomIn',
  'zoom-out': 'ZoomOut',
  maximize: 'Maximize',
  minimize: 'Minimize',
  'rotate-cw': 'RotateCw',
  play: 'Play',
  pause: 'Pause',
  'volume-2': 'Volume2',
  'volume-x': 'VolumeX',
  grid: 'Grid',
  list: 'List',
  eye: 'Eye',
  'eye-off': 'EyeOff',
  'trash-2': 'Trash2',
  copy: 'Copy',
  check: 'Check',
  user: 'User',
  hash: 'Hash',
  image: 'Image',
  'file-text': 'FileText',
  save: 'Save',
  info: 'Info',
  'refresh-cw': 'RefreshCw',
  calendar: 'Calendar',
  file: 'File',
  'help-circle': 'HelpCircle',
};

/**
 * getter 함수를 통한 lucide-preact 동적 import
 * 외부 의존성 격리 및 모킹 가능한 구조
 */
const getLucideIcon = async (iconName: IconName): Promise<IconComponent | null> => {
  try {
    const lucideExportName = iconImportMap[iconName];
    if (!lucideExportName) {
      logger.warn(`Unknown icon mapping: ${iconName}`);
      return null;
    }

    // 트리쉐이킹을 위한 개별 아이콘 import
    const lucideModule = await import('lucide-preact');
    const IconComponent = (lucideModule as unknown as Record<string, IconComponent>)[
      lucideExportName
    ];

    if (!IconComponent) {
      logger.warn(`Icon not found in lucide-preact: ${lucideExportName}`);
      return null;
    }

    return IconComponent;
  } catch (error) {
    logger.warn('Failed to load lucide icon:', error);
    return null;
  }
};

/**
 * 기본 폴백 아이콘 컴포넌트
 * lucide 아이콘 로딩 실패 시 사용
 */
const DefaultIcon: IconComponent = ({
  size = 24,
  className = '',
  'aria-hidden': ariaHidden = true,
  ...props
}) => {
  // 기본 SVG 아이콘 (간단한 사각형)
  const sizeValue = typeof size === 'number' ? `${size}px` : size;

  return {
    type: 'svg',
    props: {
      width: sizeValue,
      height: sizeValue,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 2,
      strokeLinecap: 'round' as const,
      strokeLinejoin: 'round' as const,
      className,
      'aria-hidden': ariaHidden,
      ...props,
      children: {
        type: 'rect',
        props: {
          x: 3,
          y: 3,
          width: 18,
          height: 18,
          rx: 2,
          ry: 2,
        },
      },
    },
  } as unknown as IconComponent;
};

/**
 * 아이콘 로딩 함수 - 캐싱 및 폴백 지원
 *
 * @param name 아이콘 이름
 * @returns Promise<IconComponent> 아이콘 컴포넌트
 */
export async function getIcon(name: IconName): Promise<IconComponent> {
  // 캐시 확인
  if (iconCache.has(name)) {
    return iconCache.get(name)!;
  }

  try {
    // lucide 아이콘 로딩 시도
    const icon = await getLucideIcon(name);
    const finalIcon = icon || DefaultIcon;

    // 캐시에 저장
    iconCache.set(name, finalIcon);

    return finalIcon;
  } catch (error) {
    logger.warn(`Failed to get icon ${name}:`, error);

    // 폴백 아이콘 캐싱
    iconCache.set(name, DefaultIcon);
    return DefaultIcon;
  }
}

/**
 * 여러 아이콘을 미리 로딩하는 함수
 * 성능 최적화를 위한 프리로딩 지원
 *
 * @param icons 프리로드할 아이콘 목록
 */
export async function preloadIcons(icons: IconName[]): Promise<void> {
  try {
    await Promise.all(icons.map(name => getIcon(name)));
    logger.debug(`Preloaded ${icons.length} icons:`, icons);
  } catch (error) {
    logger.warn('Failed to preload some icons:', error);
  }
}

/**
 * 아이콘 캐시 관리 클래스
 * 테스트 및 메모리 관리를 위한 유틸리티
 */
export class IconCache {
  /**
   * 캐시에서 아이콘 가져오기 (캐시 우선)
   */
  static async get(name: IconName): Promise<IconComponent> {
    return getIcon(name);
  }

  /**
   * 여러 아이콘 프리로드
   */
  static async preload(icons: IconName[]): Promise<void> {
    await preloadIcons(icons);
  }

  /**
   * 캐시 초기화 (테스트용)
   */
  static clearCache(): void {
    iconCache.clear();
  }

  /**
   * 캐시 상태 확인 (디버깅용)
   */
  static getCacheInfo(): { size: number; keys: string[] } {
    return {
      size: iconCache.size,
      keys: Array.from(iconCache.keys()),
    };
  }
}

export default {
  getIcon,
  preloadIcons,
  IconCache,
};
