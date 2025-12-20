import type { BuildModeConfig } from './types';

const BUILD_MODE_CONFIGS: Record<'development' | 'production', BuildModeConfig> = {
  development: {
    cssCompress: false,
    cssRemoveComments: false,
    cssVariableShortening: false,
    cssValueMinify: false,
    cssClassNamePattern: '[name]__[local]__[hash:base64:5]',
    sourceMap: true as const,
  },
  production: {
    cssCompress: true,
    cssRemoveComments: true,
    cssVariableShortening: true,
    cssValueMinify: true,
    cssClassNamePattern: 'xeg_[hash:base64:6]',
    sourceMap: false as const,
  },
};

export function getBuildModeConfig(mode: string): BuildModeConfig {
  return BUILD_MODE_CONFIGS[mode === 'development' ? 'development' : 'production'];
}
