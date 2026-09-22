import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

function crc32(bytes) {
  let value = 0xffffffff;
  for (const byte of bytes) {
    value ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0);
    }
  }
  return (value ^ 0xffffffff) >>> 0;
}

function zipEntry(entry, central, offset) {
  const name = Buffer.from(entry.name, 'utf8');
  const data = Buffer.from(entry.data, 'utf8');
  const checksum = crc32(data);
  const mode = entry.mode ?? 0o100644;
  const local = Buffer.alloc(30 + name.length + data.length);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt32LE(0, 6);
  local.writeUInt16LE(0, 8);
  local.writeUInt16LE(0, 10);
  local.writeUInt16LE(0, 12);
  local.writeUInt32LE(checksum, 14);
  local.writeUInt32LE(data.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(name.length, 26);
  local.writeUInt16LE(0, 28);
  name.copy(local, 30);
  data.copy(local, 30 + name.length);

  const directory = Buffer.alloc(46 + name.length);
  directory.writeUInt32LE(0x02014b50, 0);
  directory.writeUInt16LE((3 << 8) | 20, 4);
  directory.writeUInt16LE(20, 6);
  directory.writeUInt32LE(0, 8);
  directory.writeUInt16LE(0, 12);
  directory.writeUInt16LE(0, 14);
  directory.writeUInt32LE(checksum, 16);
  directory.writeUInt32LE(data.length, 20);
  directory.writeUInt32LE(data.length, 24);
  directory.writeUInt16LE(name.length, 28);
  directory.writeUInt16LE(0, 30);
  directory.writeUInt16LE(0, 32);
  directory.writeUInt16LE(0, 34);
  directory.writeUInt16LE(0, 36);
  directory.writeUInt32LE((mode << 16) >>> 0, 38);
  directory.writeUInt32LE(offset, 42);
  name.copy(directory, 46);

  central.push(directory);
  return local;
}

function createZip(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  for (const entry of entries) {
    const local = zipEntry(entry, centralParts, offset);
    localParts.push(local);
    offset += local.length;
  }

  const centralOffset = offset;
  const central = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(central.length, 12);
  end.writeUInt32LE(centralOffset, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([...localParts, central, end]);
}

function pluginManifest() {
  return JSON.stringify({ name: 'codex-security', version: 'guard-probe' });
}

async function assertRejected(extractPluginZip, archive, destination, outsidePath) {
  await assert.rejects(
    extractPluginZip(archive, destination),
    /unsafe path/i,
    `the ZIP guard must reject ${archive}`
  );
  assert.equal(await readFile(outsidePath, 'utf8'), 'outside sentinel\n');
  await assert.rejects(readFile(destination), /ENOENT/);
}

async function main() {
  const packageRoot = resolve(process.argv[2] ?? '');
  if (!process.argv[2])
    throw new Error('usage: verify-codex-security-zip-guard.mjs <package-root>');

  const { extractPluginZip } = await import(pathToFileURL(join(packageRoot, 'dist/index.js')).href);
  const root = await mkdtemp(join(tmpdir(), 'codex-security-zip-guard-'));
  const outsideDirectory = join(root, 'outside');
  const outsidePath = join(outsideDirectory, 'escaped.txt');
  await mkdir(outsideDirectory, { recursive: true, mode: 0o700 });
  await writeFile(outsidePath, 'outside sentinel\n', { mode: 0o600 });

  try {
    const normalArchive = join(root, 'normal.zip');
    await writeFile(
      normalArchive,
      createZip([
        { name: '.codex-plugin/plugin.json', data: pluginManifest() },
        { name: 'payload.txt', data: 'normal payload\n' },
      ])
    );
    const normalDestination = join(root, 'normal');
    await extractPluginZip(normalArchive, normalDestination);
    assert.equal(
      await readFile(join(normalDestination, 'payload.txt'), 'utf8'),
      'normal payload\n'
    );

    const symlinkArchive = join(root, 'symlink.zip');
    await writeFile(
      symlinkArchive,
      createZip([
        { name: '.codex-plugin/plugin.json', data: pluginManifest() },
        { name: 'payload.txt', data: '../outside/escaped.txt', mode: 0o120777 },
      ])
    );
    await assertRejected(extractPluginZip, symlinkArchive, join(root, 'symlink'), outsidePath);

    const replacementArchive = join(root, 'symlink-replacement.zip');
    await writeFile(
      replacementArchive,
      createZip([
        { name: '.codex-plugin/plugin.json', data: pluginManifest() },
        { name: 'payload.txt', data: '../outside/escaped.txt', mode: 0o120777 },
        { name: 'payload.txt', data: 'replacement payload\n' },
      ])
    );
    await assertRejected(
      extractPluginZip,
      replacementArchive,
      join(root, 'symlink-replacement'),
      outsidePath
    );
  } finally {
    await rm(root, { force: true, recursive: true });
  }
}

try {
  await main();
  console.log('Codex Security ZIP guard probe passed.');
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
