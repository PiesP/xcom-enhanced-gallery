/** Minimal typings for the babel-preset-solid dynamic import used in tooling. */
declare module 'babel-preset-solid' {
  import type { PluginItem } from '@babel/core';

  const solidPreset: PluginItem;
  export default solidPreset;
}
