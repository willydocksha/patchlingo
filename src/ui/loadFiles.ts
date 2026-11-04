// read dropped or picked files (and folders) into translated presets, entirely in the browser
import { decodeGp200, Gp200DecodeError, gp200ToAmperoMini, rigFromGp200, type AmperoPatch, type Rig } from '../core';

export interface LoadedPreset {
  id: string;
  fileName: string;
  rig?: Rig;
  patch?: AmperoPatch;
  error?: string;
}

// unique id per loaded file
let counter = 0;
const nextId = () => `p${++counter}`;

// decode + translate one file; errors are kept per file instead of thrown
export async function loadPreset(file: File): Promise<LoadedPreset> {
  const id = nextId();
  try {
    const rig = rigFromGp200(decodeGp200(new Uint8Array(await file.arrayBuffer())));
    return { id, fileName: file.name, rig, patch: gp200ToAmperoMini(rig) };
  } catch (err) {
    // friendly message for files that aren't gp-200 presets
    const error =
      err instanceof Gp200DecodeError
        ? `Ini bukan file preset GP-200 yang valid (ukurannya ${file.size} byte; preset GP-200 berukuran 1224 byte).`
        : `Gagal membaca file: ${err instanceof Error ? err.message : String(err)}`;
    return { id, fileName: file.name, error };
  }
}

// only .prst files are presets
const isPreset = (name: string) => name.toLowerCase().endsWith('.prst');

// walk a dropped directory entry recursively
async function filesFromEntry(entry: FileSystemEntry): Promise<File[]> {
  if (entry.isFile) {
    return new Promise((resolve) => (entry as FileSystemFileEntry).file((f) => resolve([f]), () => resolve([])));
  }
  if (!entry.isDirectory) return [];
  const reader = (entry as FileSystemDirectoryEntry).createReader();
  const children: FileSystemEntry[] = [];
  // readEntries returns results in batches until empty
  for (;;) {
    const batch = await new Promise<FileSystemEntry[]>((resolve) => reader.readEntries(resolve, () => resolve([])));
    if (!batch.length) break;
    children.push(...batch);
  }
  return (await Promise.all(children.map(filesFromEntry))).flat();
}

// collect files from a drop event, expanding folders
export async function filesFromDrop(dt: DataTransfer): Promise<File[]> {
  const entries = Array.from(dt.items)
    .map((item) => item.webkitGetAsEntry?.())
    .filter((e): e is FileSystemEntry => !!e);
  const files = entries.length ? (await Promise.all(entries.map(filesFromEntry))).flat() : Array.from(dt.files);
  return files.filter((f) => isPreset(f.name));
}

// filter a picked file list
export function filesFromList(list: FileList | null): File[] {
  return Array.from(list ?? []).filter((f) => isPreset(f.name));
}

// natural sort so "2-A" comes before "10-A"
export function sortByName<T extends { fileName: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.fileName.localeCompare(b.fileName, undefined, { numeric: true }));
}
