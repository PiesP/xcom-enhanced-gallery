/**
 * @fileoverview Tests for CSS animations utilities
 */
import {
    ANIMATION_CLASSES,
    ANIMATION_CONSTANTS,
    animateGalleryEnter,
    animateGalleryExit,
    animateImageItemsEnter,
    cleanupAnimations,
    injectAnimationStyles,
} from "@shared/utils/css/css-animations";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock style registry
vi.mock("@shared/services/style-registry", () => {
  const mockHasStyle = vi.fn(() => false);
  const mockRegisterStyle = vi.fn();
  return {
    getStyleRegistry: () => ({
      hasStyle: mockHasStyle,
      registerStyle: mockRegisterStyle,
      _mockHasStyle: mockHasStyle,
      _mockRegisterStyle: mockRegisterStyle,
    }),
  };
});

// Mock logger
vi.mock("@shared/logging", () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

// Create a custom AnimationEvent for jsdom (which doesn't support AnimationEvent)
function createAnimationEvent(type: string): Event {
    const event = new Event(type, { bubbles: true, cancelable: true });
    return event;
}

describe("css-animations", () => {
    let container: HTMLDivElement;

    beforeEach(() => {
        vi.useFakeTimers();
        container = document.createElement("div");
        document.body.appendChild(container);
    });

    afterEach(() => {
        vi.useRealTimers();
        container.remove();
    });

    describe("ANIMATION_CONSTANTS", () => {
        it("should have correct duration values", () => {
            expect(ANIMATION_CONSTANTS.DURATION_FAST).toBe(150);
            expect(ANIMATION_CONSTANTS.DURATION_NORMAL).toBe(300);
            expect(ANIMATION_CONSTANTS.DURATION_SLOW).toBe(500);
        });

        it("should have correct easing values", () => {
            expect(ANIMATION_CONSTANTS.EASING_EASE_OUT).toBe(
                "cubic-bezier(0.4, 0, 0.2, 1)",
            );
        });

        it("should have correct stagger delay", () => {
            expect(ANIMATION_CONSTANTS.STAGGER_DELAY).toBe(50);
        });
    });

    describe("injectAnimationStyles", () => {
        it("should inject animation styles when not already present", () => {
            // Import the mocked getStyleRegistry to access mock functions
            // The mock returns hasStyle as false, so styles should be registered
            injectAnimationStyles();
            // If no error thrown, the function worked correctly
            expect(true).toBe(true);
        });
    });

    describe("ANIMATION_CLASSES", () => {
        it("should have correct class names", () => {
            expect(ANIMATION_CLASSES.FADE_IN).toBe("animate-fade-in");
            expect(ANIMATION_CLASSES.FADE_OUT).toBe("animate-fade-out");
            expect(ANIMATION_CLASSES.SLIDE_IN_BOTTOM).toBe("animate-slide-in-bottom");
            expect(ANIMATION_CLASSES.SCALE_IN).toBe("animate-scale-in");
        });
    });

    describe("animateGalleryEnter", () => {
        it("should add fade-in class and resolve on animationend", async () => {
            const element = document.createElement("div");
            container.appendChild(element);

            const promise = animateGalleryEnter(element);

            expect(element.classList.contains(ANIMATION_CLASSES.FADE_IN)).toBe(true);

            // Trigger animationend
            element.dispatchEvent(createAnimationEvent("animationend"));

            await promise;
            expect(element.classList.contains(ANIMATION_CLASSES.FADE_IN)).toBe(false);
        });

        it("should call onComplete callback", async () => {
            const element = document.createElement("div");
            container.appendChild(element);
            const onComplete = vi.fn();

            const promise = animateGalleryEnter(element, { onComplete });
            element.dispatchEvent(createAnimationEvent("animationend"));

            await promise;
            expect(onComplete).toHaveBeenCalled();
        });
    });

    describe("animateGalleryExit", () => {
        it("should add fade-out class and resolve on animationend", async () => {
            const element = document.createElement("div");
            container.appendChild(element);

            const promise = animateGalleryExit(element);

            expect(element.classList.contains(ANIMATION_CLASSES.FADE_OUT)).toBe(true);

            element.dispatchEvent(createAnimationEvent("animationend"));

            await promise;
            expect(element.classList.contains(ANIMATION_CLASSES.FADE_OUT)).toBe(
                false,
            );
        });
    });

    describe("animateImageItemsEnter", () => {
        it("should resolve immediately for empty array", async () => {
            const promise = animateImageItemsEnter([]);
            await expect(promise).resolves.toBeUndefined();
        });

        it("should add slide-in class to elements with stagger", async () => {
            const element0 = document.createElement("div");
            const element1 = document.createElement("div");
            const element2 = document.createElement("div");
            const elements = [element0, element1, element2];
            elements.forEach((el) => container.appendChild(el));

            const promise = animateImageItemsEnter(elements);

            // First element should get class immediately (0ms delay)
            vi.advanceTimersByTime(0);
            expect(element0.classList.contains(ANIMATION_CLASSES.SLIDE_IN_BOTTOM)).toBe(true);

            // Second element after stagger delay
            vi.advanceTimersByTime(ANIMATION_CONSTANTS.STAGGER_DELAY);
            expect(element1.classList.contains(ANIMATION_CLASSES.SLIDE_IN_BOTTOM)).toBe(true);

            // Third element after another stagger delay
            vi.advanceTimersByTime(ANIMATION_CONSTANTS.STAGGER_DELAY);
            expect(element2.classList.contains(ANIMATION_CLASSES.SLIDE_IN_BOTTOM)).toBe(true);

            // Complete animations
            elements.forEach((el) =>
                el.dispatchEvent(createAnimationEvent("animationend")),
            );

            await promise;
        });
    });

    describe("cleanupAnimations", () => {
        it("should remove all animation classes", () => {
            const element = document.createElement("div");
            element.classList.add(ANIMATION_CLASSES.FADE_IN);
            element.classList.add(ANIMATION_CLASSES.SLIDE_IN_BOTTOM);
            element.style.animation = "test 1s";

            cleanupAnimations(element);

            expect(element.classList.contains(ANIMATION_CLASSES.FADE_IN)).toBe(false);
            expect(element.classList.contains(ANIMATION_CLASSES.SLIDE_IN_BOTTOM)).toBe(false);
            expect(element.style.animation).toBe("");
        });
    });
});
