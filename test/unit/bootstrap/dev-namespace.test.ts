import type { IGalleryApp } from '@shared/container/app-container';
import { setupDevNamespace } from '@/bootstrap/dev-namespace';
import { mutateDevNamespace, type DevNamespace } from '@shared/devtools/dev-namespace';

vi.mock('@shared/devtools/dev-namespace', () => ({
  mutateDevNamespace: vi.fn(),
}));

describe('setupDevNamespace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates or updates the main namespace with provided actions', () => {
    const namespace: DevNamespace = {};
    (mutateDevNamespace as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(
      (mutator: (ns: DevNamespace) => void) => {
        mutator(namespace);
      },
    );

    const galleryApp = { id: 'gallery-app' } as unknown as IGalleryApp;
    const actions = {
      start: vi.fn(),
      createConfig: vi.fn(),
      cleanup: vi.fn(),
    };

    setupDevNamespace(galleryApp, actions);

    const mainNamespace = namespace.main as Record<string, unknown>;
    expect(mainNamespace.start).toBe(actions.start);
    expect(mainNamespace.createConfig).toBe(actions.createConfig);
    expect(mainNamespace.cleanup).toBe(actions.cleanup);
    expect(mainNamespace.galleryApp).toBe(galleryApp);
  });

  it('keeps existing gallery app reference when instance is undefined', () => {
    const existingGalleryApp = { id: 'existing' } as unknown as IGalleryApp;
    const namespace: DevNamespace = {
      main: {
        galleryApp: existingGalleryApp,
      },
    };

    (mutateDevNamespace as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(
      (mutator: (ns: DevNamespace) => void) => {
        mutator(namespace);
      },
    );

    const actions = {
      start: vi.fn(),
      createConfig: vi.fn(),
      cleanup: vi.fn(),
    };

    setupDevNamespace(undefined, actions);

    const mainNamespace = namespace.main as Record<string, unknown>;
    expect(mainNamespace.galleryApp).toBe(existingGalleryApp);
  });

  it('removes gallery app when null is provided', () => {
    const namespace: DevNamespace = {
      main: {
        galleryApp: { id: 'stale' } as unknown as IGalleryApp,
      },
    };

    (mutateDevNamespace as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(
      (mutator: (ns: DevNamespace) => void) => {
        mutator(namespace);
      },
    );

    const actions = {
      start: vi.fn(),
      createConfig: vi.fn(),
      cleanup: vi.fn(),
    };

    setupDevNamespace(null, actions);

    const mainNamespace = namespace.main as Record<string, unknown>;
    expect('galleryApp' in mainNamespace).toBe(false);
  });
});
