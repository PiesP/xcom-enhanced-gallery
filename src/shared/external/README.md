# External adapters

This directory contains low-level integrations that isolate external APIs from
the gallery feature code.

## Contents

- `userscript/adapter.ts`: typed access to userscript manager APIs, including
  storage, requests, notifications, cookies, and download fallbacks
- `zip/streaming-zip-writer.ts`: uncompressed Zip32 assembly used by bulk
  downloads

## Boundaries

- Feature code should use the platform adapters in `src/platform/` and the
  established download, storage, and notification services.
- Do not call `GM_*` APIs outside the userscript adapter.
- Import the implementation file directly; this directory has no barrel API.
- Keep extension-specific behavior in the extension/platform layer rather than
  adding browser branching here.
- The ZIP writer is Zip32-only. Preserve its size and entry-count guards when
  changing archive behavior.

See the root [contributing guide](../../../CONTRIBUTING.md) for validation and
cross-platform requirements.
