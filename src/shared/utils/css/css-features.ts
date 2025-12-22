export interface CSSFeatures {
  readonly hasSelector: boolean;
  readonly colorMix: boolean;
  readonly oklch: boolean;
  readonly containerQueries: boolean;
  readonly allModern: boolean;
}

const safeSupports = (check: () => boolean): boolean => {
  try {
    return check();
  } catch {
    return false;
  }
};

export function detectCSSFeatures(): CSSFeatures {
  const hasCSSSupports = typeof CSS !== 'undefined' && typeof CSS.supports === 'function';

  const hasSelector = safeSupports(() =>
    hasCSSSupports ? CSS.supports('selector(:has(*))') : false
  );

  const colorMix = safeSupports(() =>
    hasCSSSupports ? CSS.supports('color', 'color-mix(in srgb, currentColor, transparent)') : false
  );

  const oklch = safeSupports(() =>
    hasCSSSupports ? CSS.supports('color', 'oklch(50% 0.1 180)') : false
  );

  const containerQueries = safeSupports(() =>
    hasCSSSupports ? CSS.supports('container-type', 'inline-size') : false
  );

  const allModern = hasSelector && colorMix && oklch && containerQueries;

  return {
    hasSelector,
    colorMix,
    oklch,
    containerQueries,
    allModern,
  };
}
