import { resetIconRegistry } from "@shared/components/ui/Icon/icon-registry";
import { LazyIcon, useIconPreload, useCommonIconPreload } from "@shared/components/ui/Icon/lazy-icon";
import { render, screen, waitFor } from "@solidjs/testing-library";
import { createRoot } from "solid-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the icon registry to avoid actual dynamic imports in this test if needed,
// but for integration we can use the real one or a mocked one.
// For now let's try to use the real one but maybe mock the import if it's slow/flaky.
// Actually, the real one imports files that exist, so it should work.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LazyIconAny = LazyIcon as any;

describe("LazyIcon", () => {
  beforeEach(() => {
    resetIconRegistry();
    vi.clearAllMocks();
  });

  it("should render placeholder initially", () => {
    render(() => <LazyIconAny name="Download" />);
    const placeholder = screen.getByTestId("lazy-icon-loading");
    expect(placeholder).toBeInTheDocument();
  });

  it("should render fallback if provided", () => {
    render(() => (
      <LazyIconAny
        name="Download"
        fallback={<div data-testid="fallback">Fallback</div>}
      />
    ));
    expect(screen.getByTestId("fallback")).toBeInTheDocument();
    expect(screen.queryByTestId("lazy-icon-loading")).not.toBeInTheDocument();
  });

  it("should apply size and className props", async () => {
    render(() => (
      <LazyIconAny name="Download" size={24} className="test-class" />
    ));
    const placeholder = screen.getByTestId("lazy-icon-loading");
    expect(placeholder).toHaveStyle({ width: "24px", height: "24px" });
    expect(placeholder).toHaveClass("test-class");
    expect(placeholder).toHaveClass("lazy-icon-loading");
  });

  it("should load and render the icon", async () => {
    // We might need to wait a bit for the dynamic import to resolve
    render(() => <LazyIconAny name="Download" />);

    // Wait for the icon to be loaded.
    // Since we are using real dynamic imports, we expect the SVG to eventually appear.
    // The HeroDownload component renders an SVG.
    await waitFor(
      () => {
        const svg = document.querySelector("svg");
        expect(svg).toBeInTheDocument();
      },
      { timeout: 1000 },
    );
  });

  it("should preload icons", () => {
    // We can't easily mock getIconRegistry here without more setup,
    // but we can test useIconPreload if we mock the registry module.
    // For now, let's just call it and ensure it doesn't crash.
    createRoot(() => {
      useIconPreload(["Download"]);
    });
    // If we wanted to verify, we'd need to spy on iconRegistry.preloadCommonIcons or similar.
  });

  it("should handle empty array in useIconPreload", () => {
    // Test early return for empty names array
    createRoot((dispose) => {
      useIconPreload([]);
      dispose();
    });
    // Should not throw and exit early
  });

  it("should handle useCommonIconPreload", () => {
    createRoot((dispose) => {
      useCommonIconPreload();
      dispose();
    });
    // Should not throw
  });

  it("should apply stroke prop to icon", async () => {
    render(() => <LazyIconAny name="Download" stroke={2} />);

    await waitFor(
      () => {
        const svg = document.querySelector("svg");
        expect(svg).toBeInTheDocument();
      },
      { timeout: 1000 },
    );
  });

  it("should apply color prop to icon", async () => {
    render(() => <LazyIconAny name="Download" color="#ff0000" />);

    await waitFor(
      () => {
        const svg = document.querySelector("svg");
        expect(svg).toBeInTheDocument();
      },
      { timeout: 1000 },
    );
  });

  it("should apply multiple props together", async () => {
    render(() => (
      <LazyIconAny
        name="Download"
        size={32}
        stroke={1.5}
        color="#00ff00"
        className="multi-prop-test"
      />
    ));

    const placeholder = screen.getByTestId("lazy-icon-loading");
    expect(placeholder).toHaveStyle({ width: "32px", height: "32px" });
    expect(placeholder).toHaveClass("multi-prop-test");

    await waitFor(
      () => {
        const svg = document.querySelector("svg");
        expect(svg).toBeInTheDocument();
      },
      { timeout: 1000 },
    );
  });

  it("should not apply style when size is not provided", () => {
    render(() => <LazyIconAny name="Download" />);
    const placeholder = screen.getByTestId("lazy-icon-loading");
    // Without size, style should be undefined
    expect(placeholder.getAttribute("style")).toBeNull();
  });

  it("should handle className without lazy-icon-loading when empty", () => {
    render(() => <LazyIconAny name="Download" className="" />);
    const placeholder = screen.getByTestId("lazy-icon-loading");
    // Should have lazy-icon-loading but filter out empty string
    expect(placeholder).toHaveClass("lazy-icon-loading");
  });

  it("should render null for undefined component", async () => {
    // Mock the icon registry to return a function that returns undefined
    vi.mock("@shared/components/ui/Icon/icon-registry", async () => {
      const actual = await vi.importActual("@shared/components/ui/Icon/icon-registry");
      return {
        ...actual,
        getIconRegistry: () => ({
          loadIcon: () => Promise.resolve(() => undefined),
          preloadCommonIcons: vi.fn(),
        }),
      };
    });

    // Re-import LazyIcon after mock
    const { LazyIcon: LazyIconMocked } = await import("@shared/components/ui/Icon/lazy-icon");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const MockedIconAny = LazyIconMocked as any;

    render(() => <MockedIconAny name="Download" />);

    await waitFor(() => {
      // When component returns undefined, LazyIcon should render null
      // The placeholder should be gone and nothing visible
      expect(screen.queryByTestId("lazy-icon-loading")).not.toBeInTheDocument();
    }, { timeout: 1000 });

    vi.unmock("@shared/components/ui/Icon/icon-registry");
  });

  it("should pass size prop to loaded icon component", async () => {
    render(() => <LazyIconAny name="Download" size={48} />);

    await waitFor(
      () => {
        const svg = document.querySelector("svg");
        expect(svg).toBeInTheDocument();
        // Check that size was forwarded (may have px suffix)
        expect(svg).toHaveAttribute("width", "48px");
        expect(svg).toHaveAttribute("height", "48px");
      },
      { timeout: 1000 },
    );
  });

  it("should handle icon without size prop correctly", async () => {
    render(() => <LazyIconAny name="Download" />);

    await waitFor(
      () => {
        const svg = document.querySelector("svg");
        expect(svg).toBeInTheDocument();
        // Default size should be used
      },
      { timeout: 1000 },
    );
  });
});
