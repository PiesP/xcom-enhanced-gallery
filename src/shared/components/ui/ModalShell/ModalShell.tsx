import {
  type ComponentChildren,
  type JSXElement,
} from "@shared/external/vendors";
import styles from "./ModalShell.module.css";

const css = styles as Record<string, string>;

export interface ModalShellProps {
  children: ComponentChildren;
  isOpen: boolean;
  onClose?: () => void;
  size?: "sm" | "md" | "lg" | "xl";
  surfaceVariant?: "glass" | "solid" | "elevated";
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  "data-testid"?: string;
  "aria-label"?: string;
}

const sizeClassMap: Record<"sm" | "md" | "lg" | "xl", string> = {
  sm: css.sizeSm!,
  md: css.sizeMd!,
  lg: css.sizeLg!,
  xl: css.sizeXl!,
};

const surfaceClassMap: Record<"glass" | "solid" | "elevated", string> = {
  glass: css.surfaceGlass!,
  solid: css.surfaceSolid!,
  elevated: css.surfaceElevated!,
};

export function ModalShell({
  children,
  isOpen,
  onClose,
  size = "md",
  surfaceVariant = "glass",
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className,
  "data-testid": testId,
  "aria-label": ariaLabel,
  ...rest
}: ModalShellProps): JSXElement | null {
  const handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Escape" && closeOnEscape && onClose) {
      onClose();
    }
  };

  const handleBackdropClick = (event: Event): void => {
    if (
      event.target === event.currentTarget &&
      closeOnBackdropClick &&
      onClose
    ) {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  const backdropClass = `${css.backdrop} ${css.backdropOpen}`;
  const shellClass = [
    css.shell,
    css.open,
    sizeClassMap[size],
    surfaceClassMap[surfaceVariant],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      class={backdropClass}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      data-testid={testId ? `${testId}-backdrop` : undefined}
    >
      <div
        class={shellClass}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? "Modal"}
        data-testid={testId}
        {...rest}
      >
        {children}
      </div>
    </div>
  );
}
