/**
 * Preinstall guard to ensure this repository is installed with pnpm.
 *
 * Why not `npx only-allow pnpm`?
 * - `npx` may download and execute remote code during install.
 * - This repo uses pnpm-specific supply chain security controls.
 */

const userAgent: string = process.env.npm_config_user_agent ?? '';

if (!userAgent.startsWith('pnpm/')) {
  // Keep the message short and actionable (CI-friendly).
  console.error('This project must be installed with pnpm.');
  console.error('Use: pnpm install');
  process.exit(1);
}
