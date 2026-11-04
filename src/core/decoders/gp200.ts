// binary decoder for valeton gp-200 / gp-200lt .prst preset files
// layout reverse engineered by preset forge (github.com/phash/gp200editor)

// file layout constants
const USER_PRESET_SIZE = 1224;
const FACTORY_PRESET_SIZE = 1176;
const MAGIC = 'TSRP';
const DEVICE_ID = '2-PG';
const OFFSET_DEVICE_ID = 0x10;
const OFFSET_NAME = 0x44;
const OFFSET_AUTHOR = 0x54;
const TEXT_FIELD_SIZE = 16;
const OFFSET_ROUTING = 0x94;
const OFFSET_CHECKSUM = 0x4c6;

// effect block layout constants
const BLOCK_COUNT = 11;
const BLOCK_START = 0xa0;
const BLOCK_SIZE = 0x48;
const BLOCK_MARKER = [0x14, 0x00, 0x44, 0x00] as const;
const PARAM_COUNT = 15;

// fixed module per physical slot on the gp-200
export const GP200_SLOT_MODULES = [
  'PRE', 'WAH', 'DST', 'AMP', 'NR', 'CAB', 'EQ', 'MOD', 'DLY', 'RVB', 'VOL',
] as const;
export type Gp200SlotModule = (typeof GP200_SLOT_MODULES)[number];

export interface Gp200Block {
  // physical slot index (0-10), determines the module
  slot: number;
  module: Gp200SlotModule;
  enabled: boolean;
  // uint32 effect code, high byte = module family
  effectId: number;
  // raw float32 params; non-finite values are kept as NaN for the caller to flag
  params: number[];
  // false when the block marker is missing (corrupt block)
  markerOk: boolean;
}

export interface Gp200Preset {
  name: string;
  author?: string;
  factory: boolean;
  // blocks in playback (signal-chain) order
  blocks: Gp200Block[];
  checksum: { stored: number; computed: number; ok: boolean } | null;
  warnings: string[];
}

export class Gp200DecodeError extends Error {}

// read a null-terminated ascii field, dropping non-printable junk
function readText(bytes: Uint8Array, offset: number, size: number): string {
  let out = '';
  for (let i = offset; i < offset + size; i++) {
    const c = bytes[i]!;
    if (c === 0) break;
    out += c >= 0x20 && c < 0x7f ? String.fromCharCode(c) : '';
  }
  return out.trim();
}

// check whether the buffer looks like a gp-200 preset
export function isGp200Preset(bytes: Uint8Array): boolean {
  return (
    (bytes.length === USER_PRESET_SIZE || bytes.length === FACTORY_PRESET_SIZE) &&
    readText(bytes, 0, 4) === MAGIC &&
    readText(bytes, OFFSET_DEVICE_ID, 4) === DEVICE_ID
  );
}

// compute the file checksum: byte sum of everything before the checksum field
export function gp200Checksum(bytes: Uint8Array): number {
  let sum = 0;
  for (let i = 0; i < OFFSET_CHECKSUM; i++) sum += bytes[i]!;
  return sum & 0xffff;
}

// rebuild the playback order from the routing bytes, tolerating bad bytes
function readRouting(bytes: Uint8Array, warnings: string[]): number[] {
  const order: number[] = [];
  const seen = new Set<number>();
  for (let i = 0; i < BLOCK_COUNT; i++) {
    const v = bytes[OFFSET_ROUTING + i]!;
    if (v < BLOCK_COUNT && !seen.has(v)) {
      order.push(v);
      seen.add(v);
    }
  }
  // append slots the routing left out so every block appears exactly once
  if (order.length < BLOCK_COUNT) {
    warnings.push('Routing data is incomplete; missing slots were appended in default order.');
    for (let s = 0; s < BLOCK_COUNT; s++) if (!seen.has(s)) order.push(s);
  }
  return order;
}

// decode a .prst buffer into a structured preset
export function decodeGp200(bytes: Uint8Array): Gp200Preset {
  // validate header
  if (!isGp200Preset(bytes)) {
    throw new Gp200DecodeError(
      `Not a GP-200 preset (expected ${USER_PRESET_SIZE} or ${FACTORY_PRESET_SIZE} bytes with TSRP/2-PG header, got ${bytes.length} bytes).`,
    );
  }
  const warnings: string[] = [];
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const factory = bytes.length === FACTORY_PRESET_SIZE;

  // read the 11 blocks in physical order
  const bySlot: Gp200Block[] = [];
  for (let i = 0; i < BLOCK_COUNT; i++) {
    const base = BLOCK_START + i * BLOCK_SIZE;
    const markerOk = BLOCK_MARKER.every((b, k) => bytes[base + k] === b);
    if (!markerOk) warnings.push(`Block ${i} has a damaged header; its data may be wrong.`);
    const params: number[] = [];
    for (let p = 0; p < PARAM_COUNT; p++) params.push(view.getFloat32(base + 12 + p * 4, true));
    bySlot.push({
      slot: i,
      module: GP200_SLOT_MODULES[i]!,
      enabled: bytes[base + 5] === 1,
      effectId: view.getUint32(base + 8, true),
      params,
      markerOk,
    });
  }

  // verify checksum (user presets only; factory presets have no footer)
  let checksum: Gp200Preset['checksum'] = null;
  if (!factory) {
    const stored = view.getUint16(OFFSET_CHECKSUM, false);
    const computed = gp200Checksum(bytes);
    checksum = { stored, computed, ok: stored === computed };
    if (!checksum.ok) {
      warnings.push('Checksum mismatch: the file was modified or damaged after it was saved. Values were still read.');
    }
  }

  // reorder blocks into signal-chain order
  const blocks = readRouting(bytes, warnings).map((s) => bySlot[s]!);

  const author = readText(bytes, OFFSET_AUTHOR, TEXT_FIELD_SIZE);
  return {
    name: readText(bytes, OFFSET_NAME, TEXT_FIELD_SIZE),
    author: author || undefined,
    factory,
    blocks,
    checksum,
    warnings,
  };
}
