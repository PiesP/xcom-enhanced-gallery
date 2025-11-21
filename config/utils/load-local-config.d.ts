declare module './config/utils/load-local-config.js' {
  export function loadLocalConfig<T = unknown>(): Promise<T | null>;
}
