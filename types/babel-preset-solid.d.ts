/**
 * @file babel-preset-solid type declarations
 * @description The babel-preset-solid package doesn't provide type definitions, so this is a temporary declaration
 */

declare module 'babel-preset-solid' {
  import type { PluginItem } from '@babel/core';

  const solidPreset: PluginItem;
  export default solidPreset;
}
