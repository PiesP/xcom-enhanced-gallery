/**
 * @fileoverview Component common utilities
 * @description Phase 2-3A: Common utility functions separated from StandardProps
 * @version 1.0.0
 */

import type { BaseComponentProps } from "@shared/types/app.types";

/**
 * Create standard class names
 */
export function createClassName(
  ...classes: (string | undefined | null)[]
): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Create standard ARIA properties
 */
export function createAriaProps(
  props: Partial<BaseComponentProps>,
): Record<string, string | boolean | number | undefined> {
  const ariaProps: Record<string, string | boolean | number | undefined> = {};

  if (props["aria-label"]) ariaProps["aria-label"] = props["aria-label"];
  if (props["aria-describedby"])
    ariaProps["aria-describedby"] = props["aria-describedby"];
  if (props["aria-expanded"] !== undefined)
    ariaProps["aria-expanded"] = props["aria-expanded"];
  if (props["aria-hidden"] !== undefined)
    ariaProps["aria-hidden"] = props["aria-hidden"];
  if (props["aria-disabled"])
    ariaProps["aria-disabled"] = props["aria-disabled"];
  if (props["aria-busy"]) ariaProps["aria-busy"] = props["aria-busy"];
  if (props["aria-pressed"]) ariaProps["aria-pressed"] = props["aria-pressed"];
  if (props["aria-haspopup"])
    ariaProps["aria-haspopup"] = props["aria-haspopup"];
  if (props.role) ariaProps.role = props.role;
  if (props.tabIndex !== undefined) ariaProps.tabIndex = props.tabIndex;

  return ariaProps;
}

/**
 * Create standard test properties
 */
export function createTestProps(
  testId?: string,
): Record<string, string | undefined> {
  return testId ? { "data-testid": testId } : {};
}

/**
 * Props merge utility
 */
export function mergeProps<T extends BaseComponentProps>(
  baseProps: T,
  overrideProps: Partial<T>,
): T {
  // Merge class names
  const mergedClassName = createClassName(
    baseProps.className,
    overrideProps.className,
  );

  // Merge event handlers
  const mergedEventHandlers: Partial<T> = {};

  // Common event handlers
  const eventHandlers = [
    "onClick",
    "onFocus",
    "onBlur",
    "onKeyDown",
    "onMouseEnter",
    "onMouseLeave",
  ] as const;

  eventHandlers.forEach((handler) => {
    const baseHandler = baseProps[handler as keyof T] as unknown;
    const overrideHandler = overrideProps[handler as keyof T] as unknown;

    if (
      typeof baseHandler === "function" &&
      typeof overrideHandler === "function"
    ) {
      mergedEventHandlers[handler as keyof T] = ((event: Event) => {
        (baseHandler as (event: Event) => void)(event);
        (overrideHandler as (event: Event) => void)(event);
      }) as T[keyof T];
    } else {
      mergedEventHandlers[handler as keyof T] = (overrideHandler ||
        baseHandler) as T[keyof T];
    }
  });

  return {
    ...baseProps,
    ...overrideProps,
    ...mergedEventHandlers,
    className: mergedClassName || undefined,
  };
}
