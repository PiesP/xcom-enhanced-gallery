# Local Configuration Overrides

Project-level configuration files (Vite, Vitest, ESLint, etc.) are intentionally
kept minimal in the repository. Place any developer-specific overrides in this
folder to keep them out of version control.

1. Copy one of the base configs (for example `vite.config.ts`) and export a
   partial configuration. Name the file following the pattern used by the base
   config, e.g. `vite.local.ts`, `vitest.local.ts`, `eslint.local.js`.
2. Only include the keys you need to adjust locally. The base config is merged
   with these overrides at runtime.
3. Use TypeScript (`.ts`/`.mts`) or JavaScript (`.mjs`/`.js`) modules. Export
   the override using `export default { ... }`.
4. Never commit files in this directory. The folder is ignored by Git except for
   this README.

Example: `config/local/vite.local.ts`

```ts
import type { UserConfig } from 'vite';

const localConfig: UserConfig = {
  server: {
    port: 4000,
  },
};

export default localConfig;
```

Local overrides are optional. The build, tests, and linting commands continue to
use the shared base configuration when no override is present.
