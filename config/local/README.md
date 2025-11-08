# Local Configuration

This directory contains local development configuration files that may not be
committed to version control.

## Files

- `load-local-config.js` - Configuration loader for development environment

## Notes

- These files are **development-only** and not used in CI/production
- Loaded via dynamic import (skipped if CI environment detected)
- Safe to modify for local customization without affecting git
