# External API Layer (Shared)

This directory provides a **stable public interface** for external APIs and vendor adapters.
It maintains runtime code consistency and ensures predictable test/mock behavior.

## Rules

- ✅ Import from `@shared/external/vendors`, `@shared/external/userscript`, or `@shared/external/zip`
- ✅ Prefer service-layer abstractions in production code (storage, downloads, HTTP, notifications)
- ❌ Do not import internal implementation files directly
- ❌ Do not call `GM_*` APIs directly in runtime code
- ❌ Do not use barrel imports (no `index.*` re-exports)

## Directory Structure

```text
src/shared/external/
├── README.md        # This document
├── vendors/         # Compatibility types and vendor helpers
├── userscript/      # Userscript adapter + environment detection
├── zip/             # Zip utilities
└── test/            # Internal test helpers (test-only)
```

## Usage

### Solid.js

Prefer direct imports from Solid.js.

```ts
import { createEffect, createMemo, createSignal, onCleanup } from "solid-js";
import { render } from "solid-js/web";
import type { JSX } from "solid-js";
```

Optional compatibility type aliases:

```ts
import type { ComponentChildren, JSXElement } from "@shared/external/vendors";
```

### Userscript APIs

Prefer service-layer abstractions:

```ts
import { NotificationService, PersistentStorage } from "@shared/services";

const storage = PersistentStorage.getInstance();
await storage.set("user-theme", "dark");

const notif = NotificationService.getInstance();
notif.success("Settings saved");
```

Advanced/debug/test-only use:

```ts
import { detectEnvironment, getUserscript } from "@shared/external/userscript";

const env = detectEnvironment();
if (env.isGMAvailable) {
  const us = getUserscript();
  await us.setValue("key", "value");
}
```

**Forbidden** in application code:

```ts
// ❌ Do not call GM_* APIs directly
GM_setValue("key", "value");
```

### Zip Utilities

```ts
import { createZipBytesFromFileMap } from "@shared/external/zip";
import { DownloadService } from "@shared/services";

const zipBytes = await createZipBytesFromFileMap(
  {
    "photo1.jpg": buffer1,
    "photo2.jpg": buffer2,
  },
  { compressionLevel: 0 }
);

const downloadService = DownloadService.getInstance();
await downloadService.downloadBlob({
  blob: new Blob([zipBytes], { type: "application/zip" }),
  name: "media.zip",
});
```

## Related Documentation

- [AGENTS.md](../../../AGENTS.md) - AI coding guidance including service patterns
- [CONTRIBUTING.md](../../../CONTRIBUTING.md) - Contributing guidelines and coding rules

---

Last updated: 2025-12-24
