// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

/** Only a basename crosses back to the content script; native paths stay privileged. */
export function observeDownloadFilename(
  requested: string,
  nativePath: string | undefined
): {
  requestedFilename: string;
  observedFilename?: string;
  filenameConforms?: boolean;
} {
  const observed = nativePath?.split(/[\\/]/u).at(-1);
  if (
    !observed ||
    observed.length > 255 ||
    observed.split('').some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)
  ) {
    return { requestedFilename: requested };
  }
  const desired = requested.split(/[\\/]/u).at(-1) ?? requested;
  const dot = desired.lastIndexOf('.');
  const stem = dot > 0 ? desired.slice(0, dot) : desired;
  const extension = dot > 0 ? desired.slice(dot) : '';
  const suffix =
    observed.startsWith(`${stem} (`) && observed.endsWith(`)${extension}`)
      ? observed.slice(stem.length + 2, observed.length - extension.length - 1)
      : '';
  return {
    requestedFilename: requested,
    observedFilename: observed,
    filenameConforms: observed === desired || /^[1-9][0-9]*$/u.test(suffix),
  };
}
