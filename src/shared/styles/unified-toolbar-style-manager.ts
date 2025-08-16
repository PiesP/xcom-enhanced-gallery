/*
 * Unified Toolbar Style Manager
 * TDD Phase: initial GREEN target scaffold
 */
export interface ToolbarButtonSizeConfig {
  width: number;
  height: number;
  icon: number;
}
export type ToolbarButtonSizeKey = 'sm' | 'md' | 'lg';
export interface ToolbarVariantConfig {
  background: string;
  color: string;
  padding: string;
  border?: string;
}
export interface UnifiedToolbarStyleConfig {
  sizes: Record<ToolbarButtonSizeKey, { width: number; height: number; icon: number }>;
  variants: Record<'primary' | 'secondary' | 'danger', ToolbarVariantConfig>;
  spacing: { paddingSm: string; paddingMd: string };
  accessibility: { minTouchTarget: number };
}
export interface ConsistencyValidationResult {
  isConsistent: boolean;
  issues: string[];
}
export class UnifiedToolbarStyleManager {
  private static instance: UnifiedToolbarStyleManager | null = null;
  private readonly config: UnifiedToolbarStyleConfig;
  private constructor() {
    this.config = {
      sizes: {
        sm: { width: 32, height: 32, icon: 16 },
        md: { width: 44, height: 44, icon: 20 },
        lg: { width: 48, height: 48, icon: 24 },
      },
      variants: {
        primary: {
          background: 'var(--xeg-color-primary)',
          color: 'var(--xeg-color-white)',
          padding: 'var(--xeg-spacing-sm)',
        },
        secondary: {
          background: 'var(--xeg-button-bg)',
          color: 'var(--xeg-toolbar-text)',
          padding: 'var(--xeg-spacing-sm)',
        },
        danger: {
          background: 'var(--xeg-color-error-alpha-20)',
          color: 'var(--xeg-color-error)',
          padding: 'var(--xeg-spacing-sm)',
          border: '1px solid var(--xeg-color-error-alpha-40)',
        },
      },
      spacing: { paddingSm: 'var(--xeg-spacing-xs)', paddingMd: 'var(--xeg-spacing-sm)' },
      accessibility: { minTouchTarget: 44 },
    };
  }
  static getInstance(): UnifiedToolbarStyleManager {
    return this.instance ?? (this.instance = new UnifiedToolbarStyleManager());
  }
  getConfig(): UnifiedToolbarStyleConfig {
    return this.config;
  }
  getButtonStyle(variant: keyof UnifiedToolbarStyleConfig['variants'], size: ToolbarButtonSizeKey) {
    const v = this.config.variants[variant];
    const s = this.config.sizes[size];
    return {
      width: `${s.width}px`,
      height: `${s.height}px`,
      background: v.background,
      color: v.color,
      padding: v.padding,
    };
  }
  generateCSSCustomProperties(): Record<string, string> {
    const props: Record<string, string> = {};
    for (const [k, v] of Object.entries(this.config.sizes)) {
      props[`--xeg-toolbar-button-width-${k}`] = `${v.width}px`;
      props[`--xeg-toolbar-button-height-${k}`] = `${v.height}px`;
      props[`--xeg-toolbar-button-icon-${k}`] = `${v.icon}px`;
    }
    props['--xeg-toolbar-button-bg-primary'] = this.config.variants.primary.background;
    props['--xeg-toolbar-button-bg-secondary'] = this.config.variants.secondary.background;
    props['--xeg-toolbar-button-bg-danger'] = this.config.variants.danger.background;
    props['--xeg-toolbar-button-min-touch-target'] =
      `${this.config.accessibility.minTouchTarget}px`;

    return props;
  }
  validateConsistency(): ConsistencyValidationResult {
    const issues: string[] = [];
    const { sizes, accessibility } = this.config;
    const MIN_SIZE = 32; // smallest acceptable square dimension (sm allowed below minTouchTarget)
    for (const [k, s] of Object.entries(sizes)) {
      if (s.height !== s.width) issues.push(`Non-square size: ${k}`);
      if (s.width < MIN_SIZE) issues.push(`Too small: ${k}`);
      if (k !== 'sm' && s.width < accessibility.minTouchTarget)
        issues.push(`Below touch target: ${k}`);
    }
    return { isConsistent: issues.length === 0, issues };
  }
}
