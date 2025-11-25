import type { JSXElement } from '@shared/external/vendors';
import type { IconProps } from './Icon';

type IconComponent = (props: IconProps) => JSXElement;

const iconLoaders = {
  Download: () => import('./hero/HeroDownload.tsx').then(m => m.HeroDownload),
  ArrowDownTray: () => import('./hero/HeroDownload.tsx').then(m => m.HeroDownload),
  ArrowDownOnSquareStack: () =>
    import('./hero/HeroArrowDownOnSquareStack.tsx').then(m => m.HeroArrowDownOnSquareStack),
  Settings: () => import('./hero/HeroSettings.tsx').then(m => m.HeroSettings),
  Cog6Tooth: () => import('./hero/HeroCog6Tooth.tsx').then(m => m.HeroCog6Tooth),
  X: () => import('./hero/HeroX.tsx').then(m => m.HeroX),
  ArrowLeftOnRectangle: () =>
    import('./hero/HeroArrowLeftOnRectangle.tsx').then(m => m.HeroArrowLeftOnRectangle),
  ChevronLeft: () => import('./hero/HeroChevronLeft.tsx').then(m => m.HeroChevronLeft),
  ChevronRight: () => import('./hero/HeroChevronRight.tsx').then(m => m.HeroChevronRight),
  ArrowSmallLeft: () => import('./hero/HeroArrowSmallLeft.tsx').then(m => m.HeroArrowSmallLeft),
  ArrowSmallRight: () => import('./hero/HeroArrowSmallRight.tsx').then(m => m.HeroArrowSmallRight),
  ChatBubbleLeftRight: () =>
    import('./hero/HeroChatBubbleLeftRight.tsx').then(m => m.HeroChatBubbleLeftRight),
  ArrowsPointingIn: () =>
    import('./hero/HeroArrowsPointingIn.tsx').then(m => m.HeroArrowsPointingIn),
  ArrowsRightLeft: () => import('./hero/HeroArrowsRightLeft.tsx').then(m => m.HeroArrowsRightLeft),
  ArrowsUpDown: () => import('./hero/HeroArrowsUpDown.tsx').then(m => m.HeroArrowsUpDown),
  ArrowsPointingOut: () =>
    import('./hero/HeroArrowsPointingOut.tsx').then(m => m.HeroArrowsPointingOut),
  DocumentText: () => import('./hero/HeroDocumentText.tsx').then(m => m.HeroDocumentText),
  FileZip: () => import('./hero/HeroFileZip.tsx').then(m => m.HeroFileZip),
  ZoomIn: () => import('./hero/HeroZoomIn.tsx').then(m => m.HeroZoomIn),
} as const;

export type IconName = keyof typeof iconLoaders;

export interface IconRegistry {
  loadIcon(name: IconName): Promise<IconComponent>;
  getDebugInfo(): { loadingCount: number; loadingIcons: IconName[] };
}

let registry: IconRegistry | null = null;
const loadingMap = new Map<IconName, Promise<IconComponent>>();

function ensureRegistry(): IconRegistry {
  if (registry) return registry;

  registry = {
    loadIcon(name) {
      const active = loadingMap.get(name);
      if (active) return active;

      const loader = iconLoaders[name];
      if (!loader) {
        // Return a rejected promise instead of throwing synchronously
        // to match the async behavior expected by callers
        return Promise.reject(new Error(`Unsupported icon: ${name}`));
      }

      const promise = loader().finally(() => loadingMap.delete(name));
      loadingMap.set(name, promise);
      return promise;
    },

    getDebugInfo() {
      return {
        loadingCount: loadingMap.size,
        loadingIcons: Array.from(loadingMap.keys()),
      };
    },
  };

  return registry;
}

export function getIconRegistry(): IconRegistry {
  return ensureRegistry();
}

export function resetIconRegistry(): void {
  registry = null;
  loadingMap.clear();
}

const COMMON_ICONS: IconName[] = ['Download', 'Settings', 'X', 'ChevronLeft', 'ChevronRight'];

export async function preloadCommonIcons(): Promise<void> {
  const current = ensureRegistry();
  await Promise.all(COMMON_ICONS.map(name => current.loadIcon(name).catch(() => undefined)));
}
