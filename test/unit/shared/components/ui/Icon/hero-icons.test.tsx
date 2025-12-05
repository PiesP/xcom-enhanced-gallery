import {
  ArrowDownOnSquareStack,
  ArrowDownTray,
  ArrowLeftOnRectangle,
  ArrowSmallLeft,
  ArrowSmallRight,
  ArrowsPointingIn,
  ArrowsPointingOut,
  ArrowsRightLeft,
  ArrowsUpDown,
  ChatBubbleLeftRight,
  Cog6Tooth,
  Download,
} from "@shared/components/ui/Icon";
import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";

/**
 * Essential icons currently in use by the application.
 * Removed unused icons: X, ChevronLeft/Right, DocumentText, FileZip, Settings, ZoomIn
 * @version 2.0.0 - Bundle optimization phase
 */
const HERO_ICON_MAP = {
  Download,
  ArrowDownTray,
  ArrowDownOnSquareStack,
  Cog6Tooth,
  ArrowLeftOnRectangle,
  ArrowSmallLeft,
  ArrowSmallRight,
  ChatBubbleLeftRight,
  ArrowsPointingIn,
  ArrowsRightLeft,
  ArrowsUpDown,
  ArrowsPointingOut,
} as const;

describe("Hero Icons", () => {
  Object.entries(HERO_ICON_MAP).forEach(([iconName, IconComponent]) => {
    it(`should render ${iconName} icon`, () => {
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
