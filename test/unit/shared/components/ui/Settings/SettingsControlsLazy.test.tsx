import { render, screen, waitFor, fireEvent } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";

describe("SettingsControlsLazy", () => {
  it("should render fallback element with correct style", async () => {
    vi.resetModules();
    const { SettingsControlsFallback } = await import("@shared/components/ui/Settings/SettingsControlsLazy");
    const { container } = render(() => <SettingsControlsFallback />);
    const div = container.querySelector("div");
    expect(div).not.toBeNull();
    expect(div?.getAttribute("style")?.includes("7.5rem")).toBeTruthy();
  });
  // Note: Testing Suspense fallback with a deterministic delayed "lazy" behavior is fragile in this environment.
  // We focus instead on ensuring the lazy component receives props and handlers correctly (props/tests below).

  it("should forward props and accessors to the lazily loaded component", async () => {
    vi.resetModules();

    vi.doMock("@shared/components/ui/Settings/SettingsControls", () => {
      const SettingsControls = (props: any) => {
        const themeVal = typeof props.currentTheme === "function" ? props.currentTheme() : props.currentTheme;
        const langVal = typeof props.currentLanguage === "function" ? props.currentLanguage() : props.currentLanguage;
        const compact = !!props.compact;
        return (
          <div data-testid="settings-controls" data-theme={themeVal} data-lang={langVal} data-compact={String(compact)} />
        );
      };
      return { SettingsControls };
    });

    const { SettingsControlsLazy } = await import("@shared/components/ui/Settings/SettingsControlsLazy");

    const props = {
      currentTheme: () => "light",
      currentLanguage: "ja",
      onThemeChange: () => {},
      onLanguageChange: () => {},
      compact: true,
      "data-testid": "settings-controls",
    } as any;

    render(() => <SettingsControlsLazy {...props} />);

    await waitFor(() => expect(screen.getByTestId("settings-controls")).toBeInTheDocument());
    const el = screen.getByTestId("settings-controls");
    expect(el.getAttribute("data-theme")).toBe("light");
    expect(el.getAttribute("data-lang")).toBe("ja");
    expect(el.getAttribute("data-compact")).toBe("true");
  });

  it("should forward event handlers to the lazily loaded component", async () => {
    vi.resetModules();

    const onThemeChange = vi.fn();
    const onLanguageChange = vi.fn();

    vi.doMock("@shared/components/ui/Settings/SettingsControls", () => {
      const SettingsControls = (props: any) => {
        return (
          <div>
            <button data-testid="theme-button" onClick={() => props.onThemeChange?.(new Event("change"))} />
            <button data-testid="language-button" onClick={() => props.onLanguageChange?.(new Event("change"))} />
          </div>
        );
      };
      return { SettingsControls };
    });

    const { SettingsControlsLazy } = await import("@shared/components/ui/Settings/SettingsControlsLazy");

    const props = {
      currentTheme: "auto" as const,
      currentLanguage: "en" as const,
      onThemeChange,
      onLanguageChange,
    };

    render(() => <SettingsControlsLazy {...props} />);

    await waitFor(() => expect(screen.getByTestId("theme-button")).toBeInTheDocument());
    fireEvent.click(screen.getByTestId("theme-button"));
    fireEvent.click(screen.getByTestId("language-button"));
    expect(onThemeChange).toHaveBeenCalled();
    expect(onLanguageChange).toHaveBeenCalled();
  });
});
