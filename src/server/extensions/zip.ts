import path from 'path';
import fs from 'fs/promises';
import { inflateRawSync } from 'zlib';

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const LOCAL_SIGNATURE = 0x04034b50;

export interface ZipEntry {
  name: string;
  isDirectory: boolean;
  compressionMethod: number;
  compressedSize: number;
  uncompressedSize: number;
  localHeaderOffset: number;
  externalAttributes: number;
}

export interface ExtractZipOptions {
  maxEntries?: number;
  maxTotalUncompressedBytes?: number;
  maxSingleFileBytes?: number;
}

const normalizeZipPath = (input: string): string => {
  const value = input.replace(/\\/g, '/').replace(/^\.\//, '');
  if (!value || value.includes('\0') || value.startsWith('/') || /^[A-Za-z]:\//.test(value)) {
    throw new Error('ZIP_PATH_INVALID');
  }
  const normalized = path.posix.normalize(value);
  if (normalized === '..' || normalized.startsWith('../') || normalized.includes('/../')) {
    throw new Error('ZIP_PATH_TRAVERSAL');
  }
  return normalized.replace(/\/$/, '');
};

const findEndOfCentralDirectory = (buffer: Buffer): number => {
  const minOffset = Math.max(0, buffer.length - 0xffff - 22);
  for (let offset = buffer.length - 22; offset >= minOffset; offset -= 1) {
    if (buffer.readUInt32LE(offset) === EOCD_SIGNATURE) return offset;
  }
  throw new Error('ZIP_EOCD_NOT_FOUND');
};

const isSymlink = (entry: ZipEntry): boolean => {
  const unixMode = (entry.externalAttributes >>> 16) & 0xffff;
  return (unixMode & 0xf000) === 0xa000;
};

export const readZipEntries = (buffer: Buffer, options: ExtractZipOptions = {}): ZipEntry[] => {
  const maxEntries = options.maxEntries ?? 300;
  const maxTotal = options.maxTotalUncompressedBytes ?? 64 * 1024 * 1024;
  const maxSingle = options.maxSingleFileBytes ?? 16 * 1024 * 1024;

  if (buffer.length < 22) throw new Error('ZIP_TOO_SMALL');
  const eocd = findEndOfCentralDirectory(buffer);
  const entryCount = buffer.readUInt16LE(eocd + 10);
  const centralOffset = buffer.readUInt32LE(eocd + 16);

  if (entryCount > maxEntries) throw new Error('ZIP_TOO_MANY_ENTRIES');
  if (centralOffset >= buffer.length) throw new Error('ZIP_CENTRAL_DIRECTORY_INVALID');

  const entries: ZipEntry[] = [];
  let offset = centralOffset;
  let totalUncompressed = 0;

  for (let index = 0; index < entryCount; index += 1) {
    if (offset + 46 > buffer.length || buffer.readUInt32LE(offset) !== CENTRAL_SIGNATURE) {
      throw new Error('ZIP_CENTRAL_ENTRY_INVALID');
    }

    const flags = buffer.readUInt16LE(offset + 8);
    const compressionMethod = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const uncompressedSize = buffer.readUInt32LE(offset + 24);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const externalAttributes = buffer.readUInt32LE(offset + 38);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);

    if (flags & 0x1) throw new Error('ZIP_ENCRYPTED_NOT_SUPPORTED');
    if (![0, 8].includes(compressionMethod)) throw new Error('ZIP_COMPRESSION_NOT_SUPPORTED');
    if (uncompressedSize > maxSingle) throw new Error('ZIP_FILE_TOO_LARGE');

    const nameStart = offset + 46;
    const nameEnd = nameStart + nameLength;
    if (nameEnd > buffer.length) throw new Error('ZIP_FILENAME_INVALID');

    const rawName = buffer.subarray(nameStart, nameEnd).toString('utf8');
    const hasTrailingSlash = /[\\/]$/.test(rawName);
    const name = normalizeZipPath(rawName);
    const isDirectory = hasTrailingSlash;

    totalUncompressed += uncompressedSize;
    if (totalUncompressed > maxTotal) throw new Error('ZIP_UNCOMPRESSED_LIMIT_EXCEEDED');

    const entry: ZipEntry = {
      name,
      isDirectory,
      compressionMethod,
      compressedSize,
      uncompressedSize,
      localHeaderOffset,
      externalAttributes
    };
    if (isSymlink(entry)) throw new Error('ZIP_SYMLINK_NOT_ALLOWED');
    entries.push(entry);

    offset = nameEnd + extraLength + commentLength;
  }

  return entries;
};

const extractEntryBuffer = (archive: Buffer, entry: ZipEntry): Buffer => {
  const offset = entry.localHeaderOffset;
  if (offset + 30 > archive.length || archive.readUInt32LE(offset) !== LOCAL_SIGNATURE) {
    throw new Error('ZIP_LOCAL_HEADER_INVALID');
  }
  const nameLength = archive.readUInt16LE(offset + 26);
  const extraLength = archive.readUInt16LE(offset + 28);
  const dataStart = offset + 30 + nameLength + extraLength;
  const dataEnd = dataStart + entry.compressedSize;
  if (dataEnd > archive.length) throw new Error('ZIP_ENTRY_DATA_INVALID');

  const compressed = archive.subarray(dataStart, dataEnd);
  const output = entry.compressionMethod === 0 ? Buffer.from(compressed) : inflateRawSync(compressed);
  if (output.length !== entry.uncompressedSize) throw new Error('ZIP_ENTRY_SIZE_MISMATCH');
  return output;
};

export const extractZipBuffer = async (
  archive: Buffer,
  destination: string,
  options: ExtractZipOptions = {}
): Promise<string[]> => {
  const entries = readZipEntries(archive, options);
  const root = path.resolve(destination);
  await fs.mkdir(root, { recursive: true });

  const extracted: string[] = [];
  for (const entry of entries) {
    const target = path.resolve(root, ...entry.name.split('/'));
    if (target !== root && !target.startsWith(`${root}${path.sep}`)) {
      throw new Error('ZIP_PATH_TRAVERSAL');
    }

    if (entry.isDirectory) {
      await fs.mkdir(target, { recursive: true });
      continue;
    }

    await fs.mkdir(path.dirname(target), { recursive: true });
    const content = extractEntryBuffer(archive, entry);
    await fs.writeFile(target, content, { flag: 'wx', mode: 0o644 });
    extracted.push(entry.name);
  }

  return extracted;
};
