/**
 * 커스텀 render 유틸리티 - vendor manager의 Preact 인스턴스를 사용
 *
 * @testing-library/preact는 내부적으로 preact를 직접 import하기 때문에
 * vendor manager와 다른 인스턴스를 사용할 수 있습니다.
 * 이 유틸리티는 vendor manager의 Preact 인스턴스로 직접 렌더링하여
 * hooks 컨텍스트 문제를 해결합니다.
 */

import type { JSX } from 'preact';
import type { RenderResult } from '@testing-library/preact';
import { getPreact } from '@shared/external/vendors';
import { cleanup } from '@testing-library/preact';

interface RenderOptions {
  container?: HTMLElement;
  baseElement?: HTMLElement;
}

/**
 * vendor manager의 Preact를 사용하여 컴포넌트를 렌더링합니다.
 *
 * @param ui - 렌더링할 Preact 컴포넌트
 * @param options - 렌더링 옵션
 * @returns RenderResult와 유사한 객체
 */
export function renderWithVendorPreact(ui: JSX.Element, options: RenderOptions = {}): RenderResult {
  const { render } = getPreact();

  // container 설정
  const container = options.container || document.body.appendChild(document.createElement('div'));
  const baseElement = options.baseElement || container;

  // vendor manager의 Preact로 렌더링
  render(ui, container);

  // @testing-library 호환 인터페이스 반환
  return {
    container,
    baseElement,
    debug: (element?: HTMLElement) => {
      console.log((element || container).innerHTML);
    },
    rerender: (rerenderUi: JSX.Element) => {
      render(rerenderUi, container);
    },
    unmount: () => {
      render(null, container);
    },
    asFragment: () => {
      const fragment = document.createDocumentFragment();
      Array.from(container.childNodes).forEach(node => {
        fragment.appendChild(node.cloneNode(true));
      });
      return fragment;
    },
  } as RenderResult;
}

/**
 * afterEach에서 사용할 cleanup 함수를 재export
 */
export { cleanup };
