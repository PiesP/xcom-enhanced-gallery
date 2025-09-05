/**
 * @fileoverview Icon Preload Hooks
 * @description 아이콘 프리로딩을 위한 성능 최적화 훅들
 */

import { getPreactHooks } from '@shared/external/vendors';
import { getIconRegistry, type IconName } from '@shared/services/iconRegistry';

/**
 * 지정된 아이콘들을 프리로드하는 훅
 */
export function useIconPreload(icons: IconName[]): void {
  const { useEffect } = getPreactHooks();

  useEffect(() => {
    // 백그라운드에서 프리로드
    icons.forEach(iconName => {
      getIconRegistry()
        .loadIcon(iconName)
        .catch(() => {
          // 에러 무시 (실제 사용 시점에 다시 시도)
        });
    });
  }, [icons.join(',')]);
}

/**
 * 공통 아이콘들을 프리로드하는 훅
 */
export function useCommonIconPreload(): void {
  const commonIcons: IconName[] = ['Download', 'Settings', 'X', 'ChevronLeft', 'ChevronRight'];

  useIconPreload(commonIcons);
}
