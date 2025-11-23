# src/types/ — Global Type Definitions

> Ambient declarations that the entire workspace relies on during builds and tests.

## Overview

This directory contains global type definitions that are not specific to any single feature or module.

## File Guide

### env.d.ts

- Declares build flags injected via `vite.config.ts` (`__DEV__`, `__IS_DEV__`, `__VERSION__`, `__FEATURE_MEDIA_EXTRACTION__`) plus the optional `__XEG_DEBUG__` surface for dev/test tracing.
- Prefer these symbols over `import.meta.env` for tree-shakable conditionals.

### css-modules.d.ts

- Returns a readonly class map for `*.module.css` imports.
- Treats plain `*.css` imports as strings so both side-effect and inline consumption stay type-safe.

### babel-preset-solid.d.ts

- Stub for babel-preset-solid dynamic import.
