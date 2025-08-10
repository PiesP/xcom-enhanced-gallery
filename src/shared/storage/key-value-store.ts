import type { UserscriptAPI } from '@shared/external/userscript-api';

export interface KeyValueStore {
  getItem<T = unknown>(key: string, defaultValue?: T): T | undefined;
  setItem<T = unknown>(key: string, value: T): void;
}

export class GMKeyValueStore implements KeyValueStore {
  constructor(
    private readonly api: {
      getValue: UserscriptAPI['getValue'];
      setValue: UserscriptAPI['setValue'];
    }
  ) {}
  getItem<T>(key: string, defaultValue?: T): T | undefined {
    return this.api.getValue<T>(key, defaultValue as T);
  }
  setItem<T>(key: string, value: T): void {
    this.api.setValue<T>(key, value);
  }
}

export class LocalStorageKeyValueStore implements KeyValueStore {
  getItem<T>(key: string, defaultValue?: T): T | undefined {
    try {
      const v = localStorage.getItem(key);
      if (v == null) return defaultValue;
      try {
        return JSON.parse(v) as T;
      } catch {
        // not JSON, return as raw string
        return v as unknown as T;
      }
    } catch {
      return defaultValue;
    }
  }
  setItem<T>(key: string, value: T): void {
    try {
      if (typeof value === 'string') {
        localStorage.setItem(key, value);
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch {
      // ignore
    }
  }
}
