import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readExtensionManifestVersion } from '../../tooling/vite/utils/extension-icons.ts';
import {
  generateMetaOnlyHeader,
  generateUserscriptHeader,
  OUTPUT_FILE_NAMES,
  USERSCRIPT_CONFIG,
} from '../../tooling/vite/utils/userscript.ts';

type MetadataField = 'name' | 'namespace' | 'version' | 'downloadURL' | 'updateURL';
const requiredFields: readonly MetadataField[] = [
  'name',
  'namespace',
  'version',
  'downloadURL',
  'updateURL',
];

function metadataFields(text: string, artifact: string): Record<MetadataField, string> {
  const starts = [...text.matchAll(/^\/\/ ==UserScript==\r?$/gm)];
  const ends = [...text.matchAll(/^\/\/ ==\/UserScript==\r?$/gm)];
  if (
    starts.length !== 1 ||
    ends.length !== 1 ||
    starts[0]!.index !== 0 ||
    ends[0]!.index! <= starts[0]!.index!
  ) {
    throw new Error(`${artifact}: expected exactly one complete UserScript metadata block.`);
  }
  const block = text.slice(starts[0]!.index! + starts[0]![0].length, ends[0]!.index!);
  const result = {} as Record<MetadataField, string>;
  for (const field of requiredFields) {
    const lines = [
      ...block.matchAll(new RegExp(`^// @${field}(?:[ \\t]+([^\\r\\n]*))?\\r?$`, 'gm')),
    ];
    if (lines.length !== 1 || !lines[0]?.[1]?.trim()) {
      throw new Error(`${artifact}: expected exactly one valid @${field} in its metadata block.`);
    }
    result[field] = lines[0][1].trim();
  }
  if (!/^\d+\.\d+\.\d+$/.test(result.version)) {
    throw new Error(`${artifact}: invalid @version ${result.version}.`);
  }
  return result;
}

function verifyMetadata(artifact: string, actual: string, expected: string, version: string): void {
  const found = metadataFields(actual, artifact);
  const canonical = metadataFields(expected, artifact);
  for (const field of requiredFields) {
    if (found[field] !== canonical[field]) {
      throw new Error(
        `${artifact}: @${field} ${JSON.stringify(found[field])} does not match the production ${version} contract ${JSON.stringify(canonical[field])}.`
      );
    }
  }
}

/** Check built inputs without modifying dist or the existing prepared bundle. */
export function preflightReleaseArtifacts(root: string, version: string): void {
  const inputs = [
    {
      path: join('dist', OUTPUT_FILE_NAMES.prod),
      expected: generateUserscriptHeader({ baseConfig: USERSCRIPT_CONFIG, isDev: false, version }),
    },
    {
      path: join('dist', OUTPUT_FILE_NAMES.meta),
      expected: generateMetaOnlyHeader(version, USERSCRIPT_CONFIG),
    },
  ];
  for (const input of inputs) {
    let bytes: string;
    try {
      bytes = readFileSync(join(root, input.path), 'utf8');
    } catch (error: unknown) {
      throw new Error(
        `${input.path}: cannot read production artifact. Run the production build first.`,
        {
          cause: error,
        }
      );
    }
    verifyMetadata(input.path, bytes, input.expected, version);
  }

  for (const dir of ['dist-extension', 'dist-extension-firefox']) {
    const artifact = join(dir, 'manifest.json');
    const found = readExtensionManifestVersion(join(root, artifact));
    if (found !== version) {
      throw new Error(`${artifact}: version ${found} does not match release version ${version}.`);
    }
  }
}
