// Test-only typings: allow indexing CSSStyleDeclaration in mocks
export {};

declare global {
  interface CSSStyleDeclaration {
    [key: string]: string | number | undefined;
  }
}
