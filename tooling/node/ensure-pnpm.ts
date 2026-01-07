/**
 * Preinstall guard to ensure this repository is installed with pnpm.
 *
 * This script runs automatically via the `preinstall` hook in package.json.
 * It prevents installation with npm or yarn, which could bypass
 * pnpm-specific supply chain security controls.
 *
 * Why not use `npx only-allow pnpm`?
 * - `npx` may download and execute remote code during installation
 * - This repo uses pnpm-specific supply chain security settings
 *
 * Exit codes:
 * - 0: pnpm detected, installation allowed
 * - 1: non-pnpm package manager detected, installation blocked
 */

const PNPM_PREFIX = 'pnpm/';
const userAgent = process.env.npm_config_user_agent ?? '';

// Verify the package manager is pnpm
if (!userAgent.startsWith(PNPM_PREFIX)) {
  // Keep error message short and actionable (CI/log-friendly)
  console.error('Error: This project must be installed with pnpm.');
  console.error('Installation blocked: npm and yarn are not supported.');
  console.error('');
  console.error('To proceed, use:');
  console.error('  pnpm install');
  process.exit(1);
}
