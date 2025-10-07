/**
 * @fileoverview Vendor-based Testing Library
 * @description @testing-library/preact의 래퍼로, vendor system을 통해 Preact를 사용
 */

import { getPreact } from '@shared/external/vendors';
import * as testingLibrary from '@testing-library/preact';

// @testing-library/preact의 모든 기능을 re-export
export * from '@testing-library/preact';

// render 함수만 vendor system을 사용하도록 오버라이드
export { render as renderOriginal } from '@testing-library/preact';

/**
 * Vendor system을 통한 render
 * 이 함수는 vendor manager가 제공하는 Preact를 사용하여
 * hooks context가 제대로 초기화되도록 보장합니다.
 */
export async function render(
  ui: Parameters<typeof testingLibrary.render>[0],
  options?: Parameters<typeof testingLibrary.render>[1]
) {
  // Vendor manager 초기화 확인
  const { render: preactRender, h } = getPreact();

  // @testing-library/preact의 render를 그대로 사용
  // (vendor의 preact가 이미 전역으로 초기화되어 있으므로)
  return testingLibrary.render(ui, options);
}
