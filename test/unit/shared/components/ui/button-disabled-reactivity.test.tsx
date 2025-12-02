import { Button } from "@shared/components/ui/Button/Button";
import { fireEvent, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it, vi } from "vitest";

describe("Button disabled prop reactivity", () => {
  it("updates the DOM disabled state when the prop signal changes", async () => {
    const handleClick = vi.fn();
    let setDisabled: ((value: boolean) => void) | undefined;

    const Harness = () => {
      const [disabled, updateDisabled] = createSignal(true);
      setDisabled = updateDisabled;

      return Button({
        get disabled() {
          return disabled();
        },
        get children() {
          return "Control";
        },
        "aria-label": "toolbar control",
        onClick: handleClick,
      });
    };

    const { getByRole } = render(() => Harness());

    const button = getByRole("button", {
      name: "toolbar control",
    }) as HTMLButtonElement;

    expect(button.disabled).toBe(true);
    expect(button.getAttribute("aria-disabled")).toBe("true");

    await fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();

    setDisabled?.(false);
    await Promise.resolve();

    expect(button.disabled).toBe(false);
    expect(button.getAttribute("aria-disabled")).toBe("false");

    await fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
