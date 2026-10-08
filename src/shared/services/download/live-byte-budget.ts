// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/** Application-owned binary storage and reserved copy capacity, per page realm. */
export const DOWNLOAD_LIVE_BYTE_LIMIT = 512 * 1024 * 1024;

export class DownloadResourceLimitError extends Error {
  override readonly name = 'DownloadResourceLimitError';

  constructor() {
    super(
      'Download memory limit reached. Wait for active downloads to finish. If none are active and the limit remains, reload this page. Then retry with fewer files.'
    );
  }
}

export interface LiveByteLease {
  readonly bytes: number;
  /** Another owner of the same backing storage; does not charge it twice. */
  fork(): LiveByteLease;
  /** Return unused capacity only after materialization has finished. */
  shrink(bytes: number): void;
  release(): void;
}

export interface OwnedBinary<T extends Blob | Uint8Array | ArrayBuffer> {
  readonly value: T;
  readonly lease: LiveByteLease;
}

export type OwnedBlob = OwnedBinary<Blob>;

export class LiveByteBudget {
  private used = 0;

  constructor(
    readonly limitBytes = DOWNLOAD_LIVE_BYTE_LIMIT,
    private readonly onUsage?: (bytes: number) => void
  ) {
    if (!Number.isSafeInteger(limitBytes) || limitBytes <= 0) {
      throw new RangeError('limitBytes must be a positive safe integer');
    }
  }

  get usedBytes(): number {
    return this.used;
  }

  get availableBytes(): number {
    return this.limitBytes - this.used;
  }

  reserve(bytes: number): LiveByteLease {
    if (!Number.isSafeInteger(bytes) || bytes < 0) {
      throw new RangeError('bytes must be a non-negative safe integer');
    }
    if (bytes > this.availableBytes) throw new DownloadResourceLimitError();
    this.used += bytes;
    this.onUsage?.(this.used);
    let chargedBytes = bytes;
    let references = 0;
    const newOwner = (): LiveByteLease => {
      references++;
      let released = false;
      return {
        get bytes() {
          return released ? 0 : chargedBytes;
        },
        fork: () => {
          if (released) throw new Error('Binary owner has been released');
          return newOwner();
        },
        shrink: (nextBytes) => {
          if (released) throw new Error('Binary owner has been released');
          if (!Number.isSafeInteger(nextBytes) || nextBytes < 0 || nextBytes > chargedBytes) {
            throw new RangeError('A binary reservation may only shrink');
          }
          this.used -= chargedBytes - nextBytes;
          chargedBytes = nextBytes;
          this.onUsage?.(this.used);
        },
        release: () => {
          if (released) return;
          released = true;
          references--;
          if (references === 0) {
            this.used -= chargedBytes;
            chargedBytes = 0;
            this.onUsage?.(this.used);
          }
        },
      };
    };
    return newOwner();
  }
}

/** Deliberately outlives orchestrator cancellation, cache eviction and reinitialization. */
export const downloadLiveByteBudget = new LiveByteBudget();

/** Transfer several independently reserved allocations to one lifetime owner. */
export function combineLiveByteLeases(leases: readonly LiveByteLease[]): LiveByteLease {
  let released = false;
  return {
    get bytes() {
      return released ? 0 : leases.reduce((sum, lease) => sum + lease.bytes, 0);
    },
    fork: () => {
      if (released) throw new Error('Binary owner has been released');
      return combineLiveByteLeases(leases.map((lease) => lease.fork()));
    },
    shrink: (bytes) => {
      const current = leases.reduce((sum, lease) => sum + lease.bytes, 0);
      if (released || !Number.isSafeInteger(bytes) || bytes < 0 || bytes > current) {
        throw new RangeError('A binary reservation may only shrink');
      }
      let remaining = current - bytes;
      for (const lease of leases) {
        const returned = Math.min(remaining, lease.bytes);
        lease.shrink(lease.bytes - returned);
        remaining -= returned;
      }
    },
    release: () => {
      if (released) return;
      released = true;
      for (const lease of leases) lease.release();
    },
  };
}

/** Reserve chunks and their output copy before starting an opaque whole-body transport. */
export function reserveBinaryResponse(
  budget: LiveByteBudget,
  requestedMaxBytes: number
): { maxBytes: number; lease: LiveByteLease } {
  if (!Number.isSafeInteger(requestedMaxBytes) || requestedMaxBytes < 0) {
    throw new RangeError('requestedMaxBytes must be a non-negative safe integer');
  }
  const maxBytes = Math.min(requestedMaxBytes, Math.floor(budget.availableBytes / 2));
  if (requestedMaxBytes > 0 && maxBytes === 0) throw new DownloadResourceLimitError();
  return { maxBytes, lease: budget.reserve(maxBytes * 2) };
}
