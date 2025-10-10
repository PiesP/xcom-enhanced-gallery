declare module 'jsdom' {
  export interface JSDOMInstance {
    readonly window: Window & typeof globalThis;
  }

  export const JSDOM: {
    new (html: string, options?: Record<string, unknown>): JSDOMInstance;
  };
}
