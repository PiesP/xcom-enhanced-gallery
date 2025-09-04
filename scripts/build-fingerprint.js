/**
 * @fileoverview Build Fingerprint Script - Phase 6 Build & Release Hardening
 * @description 빌드 환경과 결과물의 재현성을 확인하는 스크립트
 */

/* eslint-env node */
import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';
import { execSync } from 'child_process';

const REPORTS_DIR = join(process.cwd(), 'reports');
const OUTPUT_PATH = join(REPORTS_DIR, 'build-meta.json');

function getEnvironmentFingerprint() {
  const fingerprint = {
    node: {
      version: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    npm: {
      version: getNpmVersion(),
    },
    git: {
      commit: getGitCommit(),
      branch: getGitBranch(),
      dirty: isGitDirty(),
    },
    dependencies: getDependencyVersions(),
    buildTime: new Date().toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };

  // 환경 해시 생성
  const envHash = createHash('sha256')
    .update(JSON.stringify(fingerprint, null, 0))
    .digest('hex')
    .substring(0, 16);

  return {
    ...fingerprint,
    envHash,
  };
}

function getNpmVersion() {
  try {
    return execSync('npm --version', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

function getGitCommit() {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

function getGitBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

function isGitDirty() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    return status.trim().length > 0;
  } catch {
    return true;
  }
}

function getDependencyVersions() {
  try {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    return {
      dependencies: packageJson.dependencies || {},
      devDependencies: packageJson.devDependencies || {},
    };
  } catch {
    return { dependencies: {}, devDependencies: {} };
  }
}

function analyzeBuildArtifacts() {
  const artifacts = {
    files: [],
    totalSize: 0,
    hashes: {},
  };

  try {
    const distPaths = ['dist/dev', 'dist/prod'];

    for (const distPath of distPaths) {
      try {
        const files = require('fs').readdirSync(distPath);

        for (const file of files) {
          if (file.endsWith('.js')) {
            const filePath = join(distPath, file);
            const content = readFileSync(filePath);
            const hash = createHash('sha256').update(content).digest('hex').substring(0, 16);
            const size = content.length;

            artifacts.files.push({
              path: `${distPath}/${file}`,
              size,
              hash,
            });
            artifacts.totalSize += size;
            artifacts.hashes[`${distPath}/${file}`] = hash;
          }
        }
      } catch {
        // 디렉토리 없으면 건너뛰기
      }
    }
  } catch (error) {
    artifacts.error = error.message;
  }

  return artifacts;
}

function main() {
  try {
    mkdirSync(REPORTS_DIR, { recursive: true });
  } catch {
    // ignore mkdir errors
  }

  const fingerprint = getEnvironmentFingerprint();
  const artifacts = analyzeBuildArtifacts();

  const buildMeta = {
    timestamp: new Date().toISOString(),
    environment: fingerprint,
    artifacts,
    reproducibility: {
      deterministic: !fingerprint.git.dirty && artifacts.files.length > 0,
      notes: fingerprint.git.dirty ? 'Git working directory is dirty' : 'Clean build environment',
    },
  };

  // 전체 빌드 해시 생성 (재현성 확인용)
  const buildHash = createHash('sha256')
    .update(
      JSON.stringify({
        envHash: fingerprint.envHash,
        artifactHashes: artifacts.hashes,
      })
    )
    .digest('hex')
    .substring(0, 16);

  buildMeta.buildHash = buildHash;

  // 리포트 저장
  writeFileSync(OUTPUT_PATH, JSON.stringify(buildMeta, null, 2));

  // 콘솔 출력
  console.log(JSON.stringify(buildMeta, null, 2));

  // 재현성 체크
  if (buildMeta.reproducibility.deterministic) {
    console.log(`\n✅ Build is deterministic (hash: ${buildHash})`);
  } else {
    console.log(`\n⚠️  Build may not be reproducible: ${buildMeta.reproducibility.notes}`);
  }
}

main();
