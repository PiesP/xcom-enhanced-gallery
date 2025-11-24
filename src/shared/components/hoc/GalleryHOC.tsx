/**
 * Minimal gallery higher-order component used across the gallery surface.
 * Provides consistent data attributes and lightweight event guards while
 * avoiding legacy validation/utilities that were never consumed.
 */

import { getSolid } from "@shared/external/vendors";
import type {
  ComponentType,
  GalleryComponentProps as SharedGalleryComponentProps,
} from "@shared/types";
import { createClassName } from "@shared/utils/text/formatting";

const { mergeProps } = getSolid();

export type GalleryComponentProps = SharedGalleryComponentProps;

export type GalleryType =
  | "container"
  | "item"
  | "control"
  | "overlay"
  | "viewer";

export interface GalleryOptions {
  readonly type: GalleryType;
  readonly className?: string;
  readonly events?: {
    readonly preventClick?: boolean;
    readonly preventKeyboard?: boolean;
    readonly blockTwitterNative?: boolean;
  };
  readonly customData?: Record<string, string>;
  readonly accessibility?: {
    readonly role?: string;
    readonly ariaLabel?: string;
    readonly tabIndex?: number;
  };
}

type NormalizedOptions = {
  readonly type: GalleryType;
  readonly className?: string;
  readonly events: {
    readonly preventClick: boolean;
    readonly preventKeyboard: boolean;
    readonly blockTwitterNative: boolean;
  };
  readonly customData: Record<string, string>;
  readonly accessibility: {
    readonly role?: string;
    readonly ariaLabel?: string;
    readonly tabIndex?: number;
  };
};

const EVENT_DEFAULTS = Object.freeze({
  preventClick: false,
  preventKeyboard: false,
  blockTwitterNative: true,
} as const);

const ACCESSIBILITY_DEFAULTS = Object.freeze({
  role: "button",
  tabIndex: 0,
} as const);

const TYPE_DEFAULTS: Record<GalleryType, Partial<GalleryOptions>> = {
  container: {
    accessibility: { role: "dialog", tabIndex: 0 },
  },
  item: {
    events: { preventClick: true },
  },
  control: {
    events: { blockTwitterNative: false },
  },
  overlay: {
    events: { preventKeyboard: true },
    accessibility: { role: "dialog", tabIndex: -1 },
  },
  viewer: {
    accessibility: { role: "img", tabIndex: 0 },
  },
};

const BLOCKED_KEYS = new Set(["Space", "Enter", "ArrowLeft", "ArrowRight"]);

export function withGallery<P extends GalleryComponentProps>(
  Component: ComponentType<P>,
  options: GalleryOptions,
): ComponentType<P> {
  const normalized = normalizeOptions(options);
  const markerAttributes = createMarkerAttributes(normalized);
  const accessibilityAttributes = createAccessibilityAttributes(
    normalized.accessibility,
  );
  const baseClassName = createClassName(
    "xeg-gallery",
    `xeg-gallery-${normalized.type}`,
    normalized.className,
  );

  const GalleryComponent: ComponentType<P> = (props) => {
    const className = createClassName(baseClassName, props.className);
    const eventHandlers = createEventHandlers(props, normalized.events);

    const finalProps = mergeProps(
      props,
      markerAttributes,
      accessibilityAttributes,
      eventHandlers,
      className ? { className } : {},
    ) as P;

    return Component(finalProps);
  };

  const componentName = getComponentName(Component);
  (GalleryComponent as { displayName?: string }).displayName =
    `withGallery(${componentName})`;

  return GalleryComponent;
}

function normalizeOptions(options: GalleryOptions): NormalizedOptions {
  const typeDefaults = TYPE_DEFAULTS[options.type] ?? {};

  const events = {
    ...EVENT_DEFAULTS,
    ...(typeDefaults.events ?? {}),
    ...(options.events ?? {}),
  };

  const accessibility = {
    ...ACCESSIBILITY_DEFAULTS,
    ...(typeDefaults.accessibility ?? {}),
    ...(options.accessibility ?? {}),
  };

  const sanitizedClassName = options.className?.trim();

  return {
    type: options.type,
    ...(sanitizedClassName ? { className: sanitizedClassName } : {}),
    events,
    customData: sanitizeCustomData(options.customData),
    accessibility,
  };
}

function sanitizeCustomData(
  customData?: Record<string, string>,
): Record<string, string> {
  if (!customData) {
    return {};
  }

  const sanitized: Record<string, string> = {};

  Object.entries(customData).forEach(([key, value]) => {
    const trimmedKey = key.trim();
    const trimmedValue = value?.trim();

    if (!trimmedKey || !trimmedValue) {
      return;
    }

    sanitized[trimmedKey] = trimmedValue;
  });

  return sanitized;
}

function createMarkerAttributes(
  options: NormalizedOptions,
): Record<string, string> {
  const attributes: Record<string, string> = {
    "data-xeg-gallery": "true",
    "data-xeg-gallery-type": options.type,
    "data-xeg-gallery-version": "2.0",
  };

  if (options.events.preventClick) {
    attributes["data-xeg-prevent-click"] = "true";
  }

  if (options.events.preventKeyboard) {
    attributes["data-xeg-prevent-keyboard"] = "true";
  }

  if (options.events.blockTwitterNative) {
    attributes["data-xeg-block-twitter"] = "true";
  }

  Object.entries(options.customData).forEach(([key, value]) => {
    attributes[`data-xeg-${key}`] = value;
  });

  return attributes;
}

function createAccessibilityAttributes(
  accessibility: NormalizedOptions["accessibility"],
): Record<string, string | number> {
  const attributes: Record<string, string | number> = {};

  if (accessibility.role) {
    attributes.role = accessibility.role;
  }

  if (accessibility.ariaLabel) {
    attributes["aria-label"] = accessibility.ariaLabel;
  }

  if (typeof accessibility.tabIndex === "number") {
    attributes.tabIndex = accessibility.tabIndex;
  }

  return attributes;
}

function createEventHandlers<P extends GalleryComponentProps>(
  props: P,
  events: NormalizedOptions["events"],
): Partial<Pick<GalleryComponentProps, "onClick" | "onKeyDown">> {
  const handlers: Partial<
    Pick<GalleryComponentProps, "onClick" | "onKeyDown">
  > = {};

  if (
    events.blockTwitterNative ||
    events.preventClick ||
    typeof props.onClick === "function"
  ) {
    handlers.onClick = (event) => {
      if (!event) {
        return;
      }

      props.onClick?.(event);

      if (events.blockTwitterNative) {
        event.stopImmediatePropagation?.();
      }

      if (events.preventClick) {
        event.stopPropagation?.();
        event.preventDefault?.();
      }
    };
  }

  if (events.preventKeyboard || typeof props.onKeyDown === "function") {
    handlers.onKeyDown = (event) => {
      if (!event) {
        return;
      }

      props.onKeyDown?.(event);

      if (!events.preventKeyboard) {
        return;
      }

      if (event.code && BLOCKED_KEYS.has(event.code)) {
        event.stopPropagation?.();
        event.preventDefault?.();
      }
    };
  }

  return handlers;
}

function getComponentName<T>(Component: ComponentType<T>): string {
  return (
    (Component as { displayName?: string; name?: string }).displayName ??
    (Component as { displayName?: string; name?: string }).name ??
    "Component"
  );
}
