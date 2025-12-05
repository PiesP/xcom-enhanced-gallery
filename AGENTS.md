# AGENTS.md

AI coding guidance for X.com Enhanced Gallery userscript (PC-only).

## Stack

Solid.js 1.9 | TypeScript 5.9 | Vite 7 | Node 22+

## Commands

- `npm run build` - Full pipeline
- `npm run build:fast` - Skip mutation tests
- `npm test` - All tests
- `npm run test:ct` - Playwright component tests

## Structure

- `src/bootstrap/` - Initialization
- `src/features/` - Feature modules
- `src/shared/services/` - Singletons
- `src/shared/services/singletons/` - ES Module singleton exports
- `src/shared/container/` - Service accessors and test harness
- `src/shared/external/` - Vendor adapters (GM_*, Solid.js)
- `src/shared/state/` - Reactive signals
- `src/styles/` - Design tokens

## Required Patterns

### Service Access (Preferred: ES Module Singletons)

```typescript
// ✅ PREFERRED: Use typed accessors (backed by ES Module singletons)
import { getThemeService, getLanguageService } from '@shared/container/service-accessors';
const theme = getThemeService();
const lang = getLanguageService();

// ✅ Direct singleton access for advanced use cases
import { getThemeServiceInstance } from '@shared/services/singletons';
const theme = getThemeServiceInstance();

// ⚠️ LEGACY: CoreService lookup (still supported for dynamic services)
import { CoreService } from '@shared/services/service-manager';
const renderer = CoreService.getInstance().get<GalleryRenderer>(SERVICE_KEYS.GALLERY_RENDERER);

// ❌ CoreServiceRegistry is deprecated (ESLint error)
import { CoreServiceRegistry } from '@shared/container/core-service-registry';
```

### Service Patterns

| Pattern | When to Use | Examples |
|---------|-------------|----------|
| `BaseServiceImpl` | Lifecycle management needed (init/cleanup) | ThemeService, EventManager, MediaService |
| ES Module Singleton | Core services with typed accessors | ThemeService, LanguageService, MediaService |
| CoreService Registry | Dynamic services registered at runtime | GalleryRenderer, Settings |

See `docs/SERVICE_PATTERN_GUIDE.md` for the full decision tree, registration steps, and accessor requirements.

### Imports

```typescript
// ✅ Always use path aliases
import { x } from '@shared/services/media';

// ❌ Relative paths fail ESLint
import { x } from '../../shared/services';
```

### External APIs

```typescript
// GM_* and Solid.js only through adapters
import { getUserscript } from '@shared/external/userscript';
import { getSolid } from '@shared/external/vendors';
```

### Styling

- Tokens: `--xeg-*` prefix, `oklch()`, `rem/em`
- CSS Modules for scoping
- No hardcoded colors/sizes
- No `!important`

## Strict Rules

- Path aliases required
- No direct GM_* calls
- No touch/pointer events (PC-only)
- English source code only
- Target: Chrome 117+, Edge 117+, Firefox 119+, Safari 17+ (esnext)

## Testing

Component tests in `playwright/components/`. Services mocked via `CoreService.getInstance()` in `playwright/index.tsx`. Visual tests use `@visual` tag.

### Event Listeners

```typescript
// ✅ Use EventManager for managed event handling
import { EventManager } from '@shared/services/event-manager';
const em = new EventManager();
em.addEventListener(element, 'click', handler, { context: 'my-component' });
em.cleanup(); // Auto-removes all listeners

// ❌ listener-manager is @internal (implementation detail)
import { addListener } from '@shared/utils/events/core/listener-manager';
```

## Output

- Dev: `dist/xcom-enhanced-gallery.dev.user.js`
- Prod: `dist/xcom-enhanced-gallery.user.js` (~275KB)
