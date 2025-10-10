import { describe, it } from 'vitest';
import { getSolid } from '@/shared/external/vendors';
import { HeroX } from '@/shared/components/ui/Icon/hero/HeroX';
import { getHeroiconsOutline } from '@/shared/external/vendors/heroicons-react';

const { h, render } = getSolid();

describe('Heroicons Adapter Smoke', () => {
  // Instrument attribute setters to debug invalid QName
  const win = globalThis as any;
  const ElementProto = (win.document?.createElement('div') as Element).constructor
    .prototype as Element;
  const origSetAttrNS = ElementProto.setAttributeNS;
  const origSetAttr = ElementProto.setAttribute;
  const DocProto = win.Document.prototype as any;
  const origCreateElementNS = DocProto.createElementNS;
  beforeAll(() => {
    ElementProto.setAttributeNS = function (namespaceURI: any, qualifiedName: any, value: any) {
      if (String(qualifiedName) === '[object Object]' || typeof qualifiedName !== 'string') {
        // eslint-disable-next-line no-console
        console.error(
          'setAttributeNS invalid name:',
          qualifiedName,
          'value:',
          value,
          'ns:',
          namespaceURI
        );
      }
      return origSetAttrNS.call(this, namespaceURI, qualifiedName, value);
    } as any;
    ElementProto.setAttribute = function (qualifiedName: any, value: any) {
      if (String(qualifiedName) === '[object Object]' || typeof qualifiedName !== 'string') {
        // eslint-disable-next-line no-console
        console.error('setAttribute invalid name:', qualifiedName, 'value:', value);
      }
      return origSetAttr.call(this, qualifiedName, value);
    } as any;
    DocProto.createElementNS = function (ns: any, name: any, ...rest: any[]) {
      if (typeof name !== 'string') {
        // eslint-disable-next-line no-console
        console.error('createElementNS invalid name:', name, 'ns:', ns);
      }
      return origCreateElementNS.call(this, ns, name, ...rest);
    };
  });
  afterAll(() => {
    ElementProto.setAttributeNS = origSetAttrNS as any;
    ElementProto.setAttribute = origSetAttr as any;
    DocProto.createElementNS = origCreateElementNS;
  });
  it('renders HeroX inside Icon wrapper without crashing', () => {
    const container = (globalThis as any).document.createElement('div');
    render(h(HeroX, { size: 18 }), container);
  });

  it('renders raw Heroicons XMarkIcon without crashing', () => {
    const container = (globalThis as any).document.createElement('div');
    const { XMarkIcon } = getHeroiconsOutline();
    // Debug: ensure we imported a function component
    // eslint-disable-next-line no-console
    console.log('XMarkIcon typeof =', typeof XMarkIcon);
    try {
      console.log('XMarkIcon keys =', Object.keys(XMarkIcon as any));
    } catch {}
    try {
      console.log('XMarkIcon toString =', String(XMarkIcon));
    } catch {}
    const vnode = h(XMarkIcon as any, { width: 18, height: 18 });
    try {
      // eslint-disable-next-line no-console
      console.log('vnode.type typeof =', typeof (vnode as any).type);
      // eslint-disable-next-line no-console
      console.log('vnode.type keys =', Object.keys((vnode as any).type || {}));
    } catch {}
    render(vnode, container);
  });
});
