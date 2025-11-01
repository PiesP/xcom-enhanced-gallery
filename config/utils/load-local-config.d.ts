export interface LoadLocalConfigOptions {
  searchDir?: string;
  allowInCI?: boolean;
}

export function loadLocalConfig<T = unknown>(
  baseRef: string | URL,
  basename: string,
  options?: LoadLocalConfigOptions
): Promise<T | null>;
