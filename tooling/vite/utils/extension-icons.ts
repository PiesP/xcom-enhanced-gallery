import { readFileSync } from 'node:fs';
import { posix } from 'node:path';

export interface ExtensionIconDeclaration {
  readonly path: string;
  readonly size: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function invalidManifest(manifestPath: string, detail: string): Error {
  return new Error(`Extension manifest ${manifestPath} has invalid icons: ${detail}`);
}

export function readExtensionIconDeclarations(
  manifestPath: string
): readonly ExtensionIconDeclaration[] {
  let manifest: unknown;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as unknown;
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Could not read extension manifest ${manifestPath}: ${detail}`, {
      cause: error,
    });
  }

  if (!isRecord(manifest) || !isRecord(manifest.icons)) {
    throw invalidManifest(manifestPath, 'icons must be a non-empty object.');
  }

  const entries = Object.entries(manifest.icons);
  if (entries.length === 0) {
    throw invalidManifest(manifestPath, 'icons must be a non-empty object.');
  }

  return entries.map(([size, path]) => {
    if (!/^[1-9]\d*$/.test(size)) {
      throw invalidManifest(manifestPath, `icon size "${size}" must be a positive integer.`);
    }
    if (typeof path !== 'string' || path.length === 0) {
      throw invalidManifest(manifestPath, `icon ${size} must name a file.`);
    }
    if (
      path.includes('\\') ||
      posix.isAbsolute(path) ||
      posix.normalize(path) !== path ||
      !path.startsWith('icons/') ||
      path.endsWith('/')
    ) {
      throw invalidManifest(
        manifestPath,
        `icon ${size} path "${path}" must be a normalized file path below icons/.`
      );
    }
    return { path, size };
  });
}
