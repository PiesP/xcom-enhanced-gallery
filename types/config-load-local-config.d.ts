type LoadLocalConfig = <T = unknown>() => Promise<T | null>;

export type { LoadLocalConfig };

declare module './config/utils/load-local-config' {
  const loadLocalConfig: LoadLocalConfig;
  export { loadLocalConfig };
}

declare module './config/utils/load-local-config.js' {
  const loadLocalConfig: LoadLocalConfig;
  export { loadLocalConfig };
}
