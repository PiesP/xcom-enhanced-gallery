/**
 * @fileoverview Type declarations for vendor libraries
 */

declare module 'fflate' {
  export function zipSync(
    files: { [filename: string]: Uint8Array },
    options?: { level?: number }
  ): Uint8Array;

  export function zip(
    files: { [filename: string]: Uint8Array },
    options: { level?: number },
    callback: (error: Error | null, data: Uint8Array) => void
  ): void;
}
