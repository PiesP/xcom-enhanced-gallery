import type { BuildModeConfig } from './types';

const BUILD_MODE_CONFIGS: Record<'development' | 'production', BuildModeConfig> = {
  development: {
    cssCompress: false,
    cssRemoveComments: false,
    cssVariableShortening: false,
    cssPruneUnusedCustomProperties: false,
    cssValueMinify: false,
    cssClassNamePattern: '[name]__[local]__[hash:base64:5]',
    sourceMap: true as const,
  },
  production: {
    cssCompress: true,
    cssRemoveComments: true,
    cssVariableShortening: true,
    cssPruneUnusedCustomProperties: true,
    cssValueMinify: true,
    // Bundle-size optimization: keep the hashed CSS Module names extremely short.
    // Note: Code should never depend on this prefix (CSS Modules exports are used instead).
    cssClassNamePattern: 'xg-[hash:base64:4]',
    sourceMap: false as const,
  },
};

export function getBuildModeConfig(mode: string): BuildModeConfig {
  return BUILD_MODE_CONFIGS[mode === 'development' ? 'development' : 'production'];
}
