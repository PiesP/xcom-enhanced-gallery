import { describe, it, expect } from 'vitest';
import {
  preloadCommonIcons,
  resetIconRegistry,
  getIconRegistry,
} from '@shared/services/iconRegistry';

// [ICN-R3][RED] preloadCommonIcons 계약 테스트 (기본 계약 문서화)
// 목적: preloadCommonIcons 호출 이전에는 getLoadedIconSync 가 null을 반환하고,
// 호출 이후에는 CORE 아이콘 중 하나 이상이 동기 반환 가능해야 한다.
// 현 구현은 이미 GREEN 상태이지만, 역사적 RED 스캐폴드로 유지하며 추후 이름 변경 예정.

describe('[ICN-R3][RED] icon preload contract (scaffold)', () => {
  it('preloadCommonIcons 호출 전후 getLoadedIconSync 상태 차이를 보여준다', async () => {
    resetIconRegistry();
    const registry = getIconRegistry();
    const before = registry.getLoadedIconSync('ChevronLeft');
    expect(before).toBeNull();
    await preloadCommonIcons();
    const after = registry.getLoadedIconSync('ChevronLeft');
    expect(after).not.toBeNull();
  });
});
