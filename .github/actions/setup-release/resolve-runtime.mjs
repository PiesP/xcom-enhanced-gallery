import { appendFileSync, readFileSync } from 'node:fs';

// Release setup stays locally reviewable and always uses the official pin.
const manifest = JSON.parse(readFileSync('package.json', 'utf8'));
const version = manifest.volta?.node;
if (typeof version !== 'string' || !/^\d+\.\d+\.\d+$/.test(version)) {
  throw new Error('Expected an exact package.json volta.node pin');
}
if (process.env.REQUESTED_NODE_VERSION && process.env.REQUESTED_NODE_VERSION !== version) {
  throw new Error('Release workflow runtime differs from the checked-out manifest pin');
}
if (!process.env.GITHUB_OUTPUT) throw new Error('GITHUB_OUTPUT is required');
appendFileSync(process.env.GITHUB_OUTPUT, `version=${version}\n`);
