# Local Validation Guide

This document explains the local validation pipeline and how it ensures code quality before pushing to GitHub.

## Overview

The local validation pipeline (`npm run build` and `npm run build:fast`) runs the same checks as CI, but fails fast to catch issues early. This saves time and prevents failed CI runs.

## Build Commands

### `npm run build:fast`

**Recommended for development**: Runs validation and build steps only (skips tests).

```bash
npm run build:fast
```

**What it checks:**
1. **Dependency Check** - Validates import rules and circular dependencies
2. **Type Check** - TypeScript strict mode validation
3. **Biome Check** - Linting and code style (matches CI exactly)
4. **Styles Guard** - CSS token usage validation
5. **Security Check** - Security surface analysis
6. **CodeQL Analysis** - Security/quality static analysis (if CLI installed)
7. **Build** - Production and development builds
8. **Bundle Size** - Ensures bundle stays under 350KB

**Behavior:**
- ✅ **Fail Fast**: Stops immediately on first validation failure
- ✅ **Clear Errors**: Shows exactly what failed and where
- ✅ **No Build on Error**: Build phase only runs if all validation passes

### `npm run build`

**For comprehensive validation**: Runs everything including full test suite.

```bash
npm run build
```

**Additional checks:**
- Unit tests with coverage
- Component tests (Playwright CT)
- Visual regression tests
- Accessibility tests
- E2E tests
- Mutation tests

## Validation Strictness

### Local ≥ CI

Local validation is **equal to or stricter than CI** to ensure:

1. **No Surprises**: What passes locally will pass CI
2. **Fast Feedback**: Errors found before push, not after
3. **Clean History**: No "fix CI" commits

### Critical Validation Steps

All validation steps are marked as **critical** and will stop the build:

| Step | Local | CI | Description |
|------|-------|----|----|
| Dependency Check | ✅ Critical | ✅ Blocks | Import rules enforcement |
| Type Check | ✅ Critical | ✅ Blocks | TypeScript errors |
| Biome Check | ✅ Critical | ✅ Blocks | Lint/format errors |
| Styles Guard | ✅ Critical | ✅ Blocks | CSS token violations |
| Security Check | ✅ Critical | ✅ Blocks | Security surface issues |
| CodeQL | ✅ Critical | ✅ Blocks | Security/quality findings |
| Build | ✅ Critical | ✅ Blocks | Build failures |
| Bundle Size | ✅ Critical | ✅ Blocks | Size > 350KB |

## Example: Failed Validation

When validation fails, you'll see:

```
============================================================
❌ VALIDATION FAILED - STOPPING PIPELINE
============================================================

🔴 Type Check failed:
  src/bootstrap/utils.ts(33,9): error TS1155: 'const' declarations must be initialized.
  src/bootstrap/utils.ts(33,9): error TS6133: 'test_syntax_error' is declared but its value is never read.

🔴 Biome Check failed:
  src/bootstrap/utils.ts:33:9 parse ━━━━━━━━━━━━━━━━━━━━━━━━
    × Const declarations must have an initialized value.

============================================================
```

**Build phase is skipped** - fix validation errors first.

## CodeQL Local Analysis

CodeQL provides security and code quality analysis. If the CLI is installed, it runs automatically.

### Installing CodeQL CLI (Optional)

Download from: https://github.com/github/codeql-cli-binaries/releases

```bash
# Extract to /usr/local/bin or add to PATH
# Verify installation
codeql version
```

### CodeQL Behavior

- **First Run**: Creates database (~30s)
- **Subsequent Runs**: Reuses database if sources unchanged (~5s)
- **Auto-rebuild**: Detects source changes and rebuilds when needed
- **Critical**: Blocks build if security/quality issues found

### Skipping CodeQL (if CLI not installed)

If CodeQL CLI is not installed, the step is automatically skipped with a warning. CI will still run CodeQL analysis.

## Workflow

### Before Every Push

```bash
# Quick validation (recommended)
npm run build:fast

# If you modified critical code
npm run build
```

### Pre-commit Hook (Optional)

Add to `.git/hooks/pre-commit`:

```bash
#!/bin/bash
npm run build:fast
```

### Integration with CI

Local validation matches CI workflows:

- `.github/workflows/ci.yaml` - Lint, Type Check, Build
- `.github/workflows/security.yaml` - Security, CodeQL

**Result**: If local validation passes, CI will pass.

## Troubleshooting

### "Pipeline failed" but no clear error

Check the full output above the summary. Error details appear immediately when validation fails.

### CodeQL takes too long

- First run is slow (database creation)
- Subsequent runs are fast (incremental)
- Skip by uninstalling CLI (CI still runs it)

### Build succeeds locally but fails in CI

This should not happen. If it does:

1. Check you're on latest `master`
2. Run `npm ci` to clean node_modules
3. Report as a bug - local should be ≥ CI strictness

## Performance

Typical times on modern hardware:

| Command | Time | Use Case |
|---------|------|----------|
| `build:fast` | ~15-20s | Daily development |
| `build` | ~2-5min | Pre-push, major changes |

**Tip**: Use `build:fast` during development, `build` before important pushes.
