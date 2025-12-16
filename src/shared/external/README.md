# External API Layer (Shared)

This directory exposes a **stable public surface** for external APIs and vendor adapters.
It exists to prevent deep imports, keep runtime code consistent, and make tests/mocks predictable.

## Rules

- ✅ Use barrel exports (`@shared/external`, `@shared/external/vendors`, `@shared/external/userscript`, `@shared/external/zip`)
- ✅ Prefer service-layer abstractions in production code (storage, downloads, HTTP, notifications)
- ❌ Do not import internal implementation files directly
- ❌ Do not call GM\_\* APIs directly in runtime code

## Directory structure

```text
src/shared/external/
├── index.ts         # Top-level public barrel
├── README.md        # This document
├── vendors/         # Compatibility types and vendor helpers
├── userscript/      # Userscript adapter + environment detection
├── zip/             # Zip utilities
└── test/            # Internal test helpers
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

Prefer service-layer abstractions.

```ts
import { NotificationService, PersistentStorage } from "@shared/services";

const storage = PersistentStorage.getInstance();
await storage.set("user-theme", "dark");

const notif = NotificationService.getInstance();
notif.success("Settings saved");
```

Advanced/debug/test-only:

```ts
import { detectEnvironment, getUserscript } from "@shared/external/userscript";

const env = detectEnvironment();
if (env.isGMAvailable) {
  const us = getUserscript();
  await us.setValue("key", "value");
}
```

Forbidden in app code:

```ts
// ❌ Do not call GM_* APIs directly
GM_setValue("key", "value");
```

### Zip utilities

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

## Related docs

- `docs/ARCHITECTURE.md` - Architecture and service layer overview
- `docs/CODING_GUIDELINES.md` - Coding rules and patterns

---

Last updated: 2025-12-16
