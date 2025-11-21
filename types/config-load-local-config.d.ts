// Type declaration for CI-safe local config loader
// Declares the module when importing with either './config/utils/load-local-config' or './config/utils/load-local-config.js'
export function loadLocalConfig<T = unknown>(): Promise<T | null>;

declare module './config/utils/load-local-config' {
  export { loadLocalConfig };
}

declare module './config/utils/load-local-config.js' {
  export { loadLocalConfig };
}
