import { h } from 'preact';
import { render, screen } from '@testing-library/preact';
import { getPreactHooks } from '@shared/external/vendors';
import { galleryState } from '@shared/state/signals/gallery.signals';
import { useGalleryScroll } from '@features/gallery/hooks/useGalleryScroll';

const { useRef, useEffect } = getPreactHooks();

function TestComponent() {
  const containerRef = useRef<any>(null);

  useGalleryScroll({
    container: containerRef.current,
    enabled: true,
    blockTwitterScroll: true,
  });

  // 갤러리 오픈 상태 강제
  useEffect(() => {
    galleryState.value = {
      ...galleryState.value,
      isOpen: true,
      mediaItems: galleryState.value.mediaItems || [],
    } as typeof galleryState.value;
  }, []);

  return (
    <div>
      <div data-testid='outside'>outside</div>
      <div data-testid='gallery-container' ref={el => (containerRef.current = el)}>
        <div data-testid='inner'>inner</div>
      </div>
    </div>
  );
}

describe('useGalleryScroll wheel consumption', () => {
  test('internal wheel is not consumed (defaultPrevented=false)', async () => {
    render(h(TestComponent, {}));

    const inner = await screen.findByTestId('inner');

    const ev = new (window as any).Event('wheel', { bubbles: true, cancelable: true });
    inner.dispatchEvent(ev);

    expect(ev.defaultPrevented).toBe(false);
  });

  test('external wheel is consumed (defaultPrevented=true)', async () => {
    render(h(TestComponent, {}));

    const outside = await screen.findByTestId('outside');

    const ev = new (window as any).Event('wheel', { bubbles: true, cancelable: true });
    outside.dispatchEvent(ev);

    expect(ev.defaultPrevented).toBe(true);
  });
});
