// CI-friendly type declaration for the local config loader (adjacent to the JS stub)
export function loadLocalConfig<T = unknown>(): Promise<T | null>;
