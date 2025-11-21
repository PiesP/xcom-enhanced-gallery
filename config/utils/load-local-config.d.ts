// A light, CI-safe type declaration for the local config loader.
// Save as a top-level module so TypeScript treats this file as a module
// and the types are available for `import('./config/utils/load-local-config.js')`.
export function loadLocalConfig<T = unknown>(): Promise<T | null>;

// Provide alternate module specifier declarations to support both
// './config/utils/load-local-config' and './config/utils/load-local-config.js'
declare module './config/utils/load-local-config' {
  export { loadLocalConfig };
}
declare module './config/utils/load-local-config.js' {
  export { loadLocalConfig };
}
