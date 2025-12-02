import { getIconRegistry } from "@shared/components/ui/Icon/icon-registry";
import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";

const ICONS = [
  "Download",
  "ArrowDownTray",
  "ArrowDownOnSquareStack",
  "Settings",
  "Cog6Tooth",
  "X",
  "ArrowLeftOnRectangle",
  "ChevronLeft",
  "ChevronRight",
  "ArrowSmallLeft",
  "ArrowSmallRight",
  "ChatBubbleLeftRight",
  "ArrowsPointingIn",
  "ArrowsRightLeft",
  "ArrowsUpDown",
  "ArrowsPointingOut",
  "DocumentText",
  "FileZip",
  "ZoomIn",
] as const;

describe("Hero Icons", () => {
  const registry = getIconRegistry();

  ICONS.forEach((iconName) => {
    it(`should render ${iconName} icon`, async () => {
      const IconComponent = await registry.loadIcon(iconName);
      expect(IconComponent).toBeDefined();

      const { container } = render(() => <IconComponent class="w-6 h-6" />);
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass("w-6 h-6");
      expect(svg).toHaveAttribute("fill", "none");
      expect(svg).toHaveAttribute(
        "stroke",
        "var(--xeg-icon-color, currentColor)",
      );
      expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
    });
  });
});
