import type { LucideIcon } from 'lucide-preact';
import { logger } from '@shared/logging';

/**
 * 지원되는 아이콘 이름 목록
 * lucide-preact에서 제공하는 아이콘들 중 필요한 것들만 선별
 */
export type IconName =
  | 'download'
  | 'settings'
  | 'close'
  | 'arrow-left'
  | 'arrow-right'
  | 'chevron-left'
  | 'chevron-right'
  | 'step-back'
  | 'step-forward'
  | 'zoom-in'
  | 'zoom-out'
  | 'maximize'
  | 'maximize-2'
  | 'minimize'
  | 'minimize-2'
  | 'square'
  | 'move'
  | 'move-horizontal'
  | 'move-vertical'
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
  | 'file-down'
  | 'folder-down'
  | 'save'
  | 'info'
  | 'refresh-cw'
  | 'calendar'
  | 'file'
  | 'help-circle';

/**
 * 아이콘 컴포넌트 속성 인터페이스
 * lucide-preact의 LucideProps와 호환
 */
export interface IconProps {
  size?: number | string;
  color?: string;
  strokeWidth?: string | number;
  fill?: string;
  className?: string;
  'aria-hidden'?: boolean;
}

/**
 * 아이콘 컴포넌트 타입
 * lucide-preact의 LucideIcon과 호환
 */
export type IconComponent = LucideIcon;

/**
 * 아이콘 캐시 - 성능 최적화를 위한 메모리 캐시
 */
const iconCache = new Map<IconName, IconComponent>();

/**
 * getter 함수를 통한 lucide-preact 개별 아이콘 import
 * 트리 쉐이킹을 위해 각 아이콘을 개별적으로 import
 */
import {
  Download,
  Settings,
  X,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  StepBack,
  StepForward,
  ZoomIn,
  ZoomOut,
  Maximize,
  Maximize2,
  Minimize,
  Minimize2,
  Square,
  Move,
  MoveHorizontal,
  MoveVertical,
  RotateCw,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Grid,
  List,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  Check,
  User,
  Hash,
  Image,
  FileText,
  FileDown,
  FolderDown,
  Save,
  Info,
  RefreshCw,
  Calendar,
  File,
  HelpCircle,
} from 'lucide-preact';

/**
 * 트리 쉐이킹 최적화된 아이콘 매핑
 * 개별 import된 아이콘들을 매핑
 */
const iconComponentMap: Record<IconName, IconComponent> = {
  download: Download,
  settings: Settings,
  close: X,
  x: X,
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'step-back': StepBack,
  'step-forward': StepForward,
  'zoom-in': ZoomIn,
  'zoom-out': ZoomOut,
  maximize: Maximize,
  'maximize-2': Maximize2,
  minimize: Minimize,
  'minimize-2': Minimize2,
  square: Square,
  move: Move,
  'move-horizontal': MoveHorizontal,
  'move-vertical': MoveVertical,
  'rotate-cw': RotateCw,
  play: Play,
  pause: Pause,
  'volume-2': Volume2,
  'volume-x': VolumeX,
  grid: Grid,
  list: List,
  eye: Eye,
  'eye-off': EyeOff,
  'trash-2': Trash2,
  copy: Copy,
  check: Check,
  user: User,
  hash: Hash,
  image: Image,
  'file-text': FileText,
  'file-down': FileDown,
  'folder-down': FolderDown,
  save: Save,
  info: Info,
  'refresh-cw': RefreshCw,
  calendar: Calendar,
  file: File,
  'help-circle': HelpCircle,
};

/**
 * getter 함수를 통한 lucide-preact 아이콘 접근
 * 외부 의존성 격리 및 모킹 가능한 구조 유지
 */
const getLucideIcon = (iconName: IconName): IconComponent | null => {
  const IconComponent = iconComponentMap[iconName];

  if (!IconComponent) {
    logger.warn(`Icon not found: ${iconName}`);
    return null;
  }

  return IconComponent;
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
 * 동기 방식으로 변경하여 트리 쉐이킹 최적화
 *
 * @param name 아이콘 이름
 * @returns IconComponent 아이콘 컴포넌트
 */
export function getIcon(name: IconName): IconComponent {
  // 캐시 확인
  if (iconCache.has(name)) {
    return iconCache.get(name)!;
  }

  try {
    // lucide 아이콘 로딩 시도 (동기 방식)
    const icon = getLucideIcon(name);
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
 * 동기 방식으로 변경
 *
 * @param icons 프리로드할 아이콘 목록
 */
export function preloadIcons(icons: IconName[]): void {
  try {
    icons.forEach(name => getIcon(name));
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
   * 동기 방식으로 변경
   */
  static get(name: IconName): IconComponent {
    return getIcon(name);
  }

  /**
   * 여러 아이콘 프리로드
   * 동기 방식으로 변경
   */
  static preload(icons: IconName[]): void {
    preloadIcons(icons);
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
