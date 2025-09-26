import { describe, it } from 'vitest';
import { getPreact } from '@shared/external/vendors';
import { Icon } from '@shared/components/ui/Icon/Icon';
import { getXegIconComponent } from '@shared/components/ui/Icon/icons';

const { h, render } = getPreact();

describe('SvgIcon integration smoke test', () => {
  it('renders Close icon inside Icon wrapper without crashing', () => {
    const container = globalThis.document.createElement('div');
    const CloseIcon = getXegIconComponent('Close');
    render(h(Icon, { size: 18 }, h(CloseIcon, {})), container);
  });

  it('renders raw SVG icon component without crashing', () => {
    const container = globalThis.document.createElement('div');
    const CloseIcon = getXegIconComponent('Close');
    const vnode = h(CloseIcon, { size: 18 });
    render(vnode, container);
  });
});
