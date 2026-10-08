// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/** Admit browser-dispatched input at DOM callbacks; private lifecycle calls stay direct. */
export function withTrustedEvent<E extends Event, R>(
  handler: (event: E) => R
): (event: E) => R | undefined {
  return (event) => {
    if (event.isTrusted) return handler(event);
    return undefined;
  };
}
