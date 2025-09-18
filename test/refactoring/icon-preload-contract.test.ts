import { describe, it, expect, beforeEach } from 'vitest';
import {
  preloadCommonIcons,
  resetIconRegistry,
  getIconRegistry,
  type IconName,
} from '@shared/services/iconRegistry';
import { CORE_ICONS } from '@shared/services/iconRegistry';

// ICN-R5: 프리로드 후 synchronously getLoadedIconSync 가능해야 함

describe('icon preload contract (ICN-R5)', () => {
  beforeEach(() => {
    resetIconRegistry();
  });

  it('preloadCommonIcons loads core icons into synchronous cache', async () => {
    await preloadCommonIcons();
    const registry = getIconRegistry();
    const missing: IconName[] = CORE_ICONS.filter(
      n => !registry.getLoadedIconSync(n as IconName)
    ) as IconName[];
    expect(missing).toEqual([]);
  });
});
