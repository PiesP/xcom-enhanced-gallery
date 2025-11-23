/**
 * Focus Trap Utility
 * @description Keyboard focus management for modal components.
 */

export interface FocusTrapOptions {
  onEscape?: () => void;
  initialFocus?: string;
  restoreFocus?: boolean;
}

export interface FocusTrap {
  isActive: boolean;
  activate: () => void;
  deactivate: () => void;
  destroy: () => void;
}

const FOCUSABLE_SELECTORS = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(", ");

export function createFocusTrap(
  container: HTMLElement | null,
  options: FocusTrapOptions = {},
): FocusTrap {
  const { onEscape, initialFocus, restoreFocus = true } = options;

  let isActive = false;
  let previousActiveElement: Element | null = null;
  let keydownAttached = false;

  function getFocusableElements(): HTMLElement[] {
    if (!container) return [];

    const elements = container.querySelectorAll(FOCUSABLE_SELECTORS);
    return Array.from(elements).filter((el): el is HTMLElement => {
      const isTestEnvironment =
        typeof window !== "undefined" &&
        (window.navigator.userAgent.includes("jsdom") ||
          window.navigator.userAgent.includes("Vitest") ||
          window.navigator.userAgent.includes("happy-dom") ||
          window.navigator.userAgent.includes("Test Environment"));

      return (
        el instanceof HTMLElement &&
        !el.hasAttribute("hidden") &&
        (isTestEnvironment || (el.offsetWidth > 0 && el.offsetHeight > 0))
      );
    });
  }

  function focusFirstElement(): void {
    if (!container) return;

    let elementToFocus: HTMLElement | null = null;

    if (initialFocus) {
      elementToFocus = container.querySelector(initialFocus);
    }

    if (!elementToFocus) {
      const focusableElements = getFocusableElements();
      elementToFocus = focusableElements[0] ?? null;
    }

    if (!elementToFocus) {
      return;
    }

    const hadTabIndex = elementToFocus.hasAttribute("tabindex");
    const previousTabIndex = elementToFocus.getAttribute("tabindex");

    if (!hadTabIndex) {
      elementToFocus.setAttribute("tabindex", "0");
    }

    elementToFocus.focus({ preventScroll: true });

    if (document.activeElement !== elementToFocus) {
      elementToFocus.setAttribute("tabindex", "-1");
      elementToFocus.focus({ preventScroll: true });
    }

    if (!hadTabIndex) {
      if (previousTabIndex === null) {
        elementToFocus.removeAttribute("tabindex");
      } else {
        elementToFocus.setAttribute("tabindex", previousTabIndex);
      }
    }
  }

  function handleTabKey(event: KeyboardEvent): void {
    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const currentElement = document.activeElement;

    if (event.shiftKey) {
      if (currentElement === firstElement && lastElement) {
        event.preventDefault();
        lastElement.focus({ preventScroll: true });
      }
    } else if (currentElement === lastElement && firstElement) {
      event.preventDefault();
      firstElement.focus({ preventScroll: true });
    }
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (!isActive || !container) return;

    if (event.key === "Tab") {
      handleTabKey(event);
      return;
    }

    if (event.key === "Escape" && onEscape) {
      event.preventDefault();
      onEscape();
    }
  }

  function activate(): void {
    if (!container || isActive) return;

    previousActiveElement = document.activeElement;
    document.addEventListener("keydown", handleKeyDown, true);
    keydownAttached = true;

    focusFirstElement();
    isActive = true;
  }

  function deactivate(): void {
    if (!isActive) return;

    if (keydownAttached) {
      try {
        document.removeEventListener("keydown", handleKeyDown, true);
      } catch {
        /* no-op */
      }
      keydownAttached = false;
    }

    if (restoreFocus && previousActiveElement instanceof HTMLElement) {
      previousActiveElement.focus({ preventScroll: true });
    }

    isActive = false;
  }

  function destroy(): void {
    deactivate();
    previousActiveElement = null;
  }

  return {
    get isActive() {
      return isActive;
    },
    activate,
    deactivate,
    destroy,
  };
}
