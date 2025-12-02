import { describe, it, expect } from 'vitest';
import { mountGallery, unmountGallery } from '@shared/components/isolation/GalleryContainer';

describe('mountGallery / unmountGallery', () => {
  it('mountGallery attaches element to container and returns container', () => {
    const container = document.createElement('div');

    const element = () => <div data-testid="gallery-unit">Hello Mounted</div>;

    const result = mountGallery(container, element);
    expect(result).toBe(container);
    expect(container.querySelector('[data-testid="gallery-unit"]')).not.toBeNull();

    // Cleanup
    unmountGallery(container);
  });

  it('unmountGallery removes children', () => {
    const container = document.createElement('div');
    const element = () => <div data-testid="gallery-unit">To be removed</div>;

    mountGallery(container, element);
    expect(container.children.length).toBeGreaterThan(0);

    unmountGallery(container);
    expect(container.children.length).toBe(0);
  });

  it('mountGallery disposes previous mount when remounting', () => {
    const container = document.createElement('div');
    const first = () => <div data-testid="first">first</div>;
    const second = () => <div data-testid="second">second</div>;

    mountGallery(container, first);
    expect(container.querySelector('[data-testid="first"]')).not.toBeNull();

    mountGallery(container, second);
    expect(container.querySelector('[data-testid="first"]')).toBeNull();
    expect(container.querySelector('[data-testid="second"]')).not.toBeNull();

    unmountGallery(container);
  });
});
