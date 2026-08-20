import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { arch, platform } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { packageExtensions } from './package-extension.ts';

const root = resolve(import.meta.dirname, '..', '..');
const distDir = join(root, 'dist');
const bundleDir = join(root, 'release-bundle');
const releaseDir = join(bundleDir, 'release');

const version = process.env.RELEASE_VERSION;
if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
  throw new Error('RELEASE_VERSION must be a semantic version in X.Y.Z form.');
}

const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
  version?: string;
};
if (packageJson.version !== version) {
  throw new Error(
    `Release version ${version} does not match package.json ${packageJson.version ?? '(missing)'}.`
  );
}

const checkedOutCommit = execFileSync('git', ['rev-parse', 'HEAD'], {
  cwd: root,
  encoding: 'utf8',
}).trim();
const expectedCommit = process.env.RELEASE_SHA;
if (expectedCommit !== undefined && !/^[0-9a-f]{40}$/.test(expectedCommit)) {
  throw new Error('RELEASE_SHA must be a lowercase 40-character commit ID.');
}
if (expectedCommit !== undefined && expectedCommit !== checkedOutCommit) {
  throw new Error(
    `Release source ${expectedCommit} does not match checked out commit ${checkedOutCommit}.`
  );
}
const releaseCommit = expectedCommit ?? checkedOutCommit;

const userscriptFile = 'xcom-enhanced-gallery.user.js';
const metadataFile = 'xcom-enhanced-gallery.meta.js';
for (const file of [userscriptFile, metadataFile]) {
  if (!existsSync(join(distDir, file))) {
    throw new Error(`dist/${file} does not exist. Run the production build first.`);
  }
}

function changelogEntry(markdown: string, releaseVersion: string): string {
  const lines = markdown.split(/\r?\n/);
  const heading = new RegExp(`^## \\[${releaseVersion.replaceAll('.', '\\.')}\\](?:\\s|$)`);
  const start = lines.findIndex((line) => heading.test(line));
  if (start < 0) {
    throw new Error(`CHANGELOG.md has no entry for version ${releaseVersion}.`);
  }
  const next = lines.findIndex((line, index) => index > start && /^## \[/.test(line));
  const entry = lines
    .slice(start + 1, next < 0 ? undefined : next)
    .join('\n')
    .trim();
  if (!entry) {
    throw new Error(`CHANGELOG.md entry for version ${releaseVersion} is empty.`);
  }
  return entry;
}

function compareVersions(left: string, right: string): number {
  const leftParts = left.split('.').map(Number);
  const rightParts = right.split('.').map(Number);
  for (let index = 0; index < 3; index++) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

function previousVersion(currentVersion: string): string | undefined {
  try {
    return execFileSync('git', ['tag', '--list', 'v*'], { cwd: root, encoding: 'utf8' })
      .split(/\r?\n/)
      .map((tag) => tag.replace(/^v/, ''))
      .filter((tag) => /^\d+\.\d+\.\d+$/.test(tag) && compareVersions(tag, currentVersion) < 0)
      .sort(compareVersions)
      .at(-1);
  } catch {
    return undefined;
  }
}

rmSync(bundleDir, { force: true, recursive: true });
mkdirSync(releaseDir, { recursive: true });
cpSync(distDir, join(bundleDir, 'deploy', 'dist'), { recursive: true });
copyFileSync(join(distDir, userscriptFile), join(releaseDir, userscriptFile));
copyFileSync(join(distDir, metadataFile), join(releaseDir, metadataFile));

const archives = packageExtensions({
  outputDir: releaseDir,
  fileName: (browser) => `xcom-enhanced-gallery-${browser}.zip`,
});
const releaseFiles = [
  join(releaseDir, userscriptFile),
  join(releaseDir, metadataFile),
  ...archives,
];
const checksums = releaseFiles.map((path) => {
  const digest = createHash('sha256').update(readFileSync(path)).digest('hex');
  return `${digest}  ${basename(path)}`;
});
writeFileSync(join(releaseDir, 'checksums.txt'), `${checksums.join('\n')}\n`);

const buildDate = new Date().toISOString();
const commit = releaseCommit;
const nodeVersion = process.env.NODE_VERSION ?? 'unknown';
const runnerOs = process.env.RUNNER_OS ?? platform();
const runnerArch = process.env.RUNNER_ARCH ?? arch();
const runnerImage = process.env.ImageOS ?? 'unknown';
const runnerImageVersion = process.env.ImageVersion ?? 'unknown';
writeFileSync(
  join(releaseDir, 'metadata.json'),
  `${JSON.stringify(
    {
      version,
      build_date: buildDate,
      commit,
      node_version: nodeVersion,
      runner_os: runnerOs,
      runner_arch: runnerArch,
      runner_image: runnerImage,
      runner_image_version: runnerImageVersion,
    },
    null,
    2
  )}\n`
);

const repository = process.env.GITHUB_REPOSITORY ?? 'PiesP/xcom-enhanced-gallery';
const previous = previousVersion(version);
const compareUrl = previous
  ? `https://github.com/${repository}/compare/v${previous}...v${version}`
  : `https://github.com/${repository}/releases/tag/v${version}`;
const changes = changelogEntry(readFileSync(join(root, 'CHANGELOG.md'), 'utf8'), version);
const releaseNotes = `# Release v${version}

## Installation

### Userscript

**[Install the userscript](https://github.com/${repository}/releases/download/v${version}/${userscriptFile})**

Requires [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/).

### Chrome / Edge / Brave Extension

1. Download \`xcom-enhanced-gallery-chrome.zip\`.
2. Extract the archive to a permanent directory.
3. Navigate to \`chrome://extensions\` and enable Developer mode.
4. Select Load unpacked and choose the extracted directory.

This developer installation does not update automatically.

### Firefox Extension

1. Download \`xcom-enhanced-gallery-firefox.zip\`.
2. Navigate to \`about:debugging#/runtime/this-firefox\`.
3. Select the ZIP with Load Temporary Add-on.

This development installation is removed when Firefox restarts.

## What's changed

${changes}

**[Full changelog](${compareUrl})**

## Build details

- **Commit**: \`${commit}\`
- **Built**: ${buildDate.replace('T', ' ').replace(/\.\d{3}Z$/, ' UTC')}
- **Node.js**: \`${nodeVersion}\`
- **Runner**: \`${runnerOs}/${runnerArch}\` (\`${runnerImage} ${runnerImageVersion}\`)
`;
writeFileSync(join(bundleDir, 'RELEASE_NOTES.md'), releaseNotes);

console.log(`Prepared release-bundle/ for v${version} (${releaseFiles.length} assets).`);
