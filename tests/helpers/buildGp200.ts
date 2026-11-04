// builds synthetic gp-200 .prst buffers for tests, so tests don't need private fixtures
import { gp200Checksum } from '../../src/core';

export interface SyntheticBlock {
  effectId: number;
  enabled?: boolean;
  params?: number[];
}

// write a complete 1224-byte user preset; blocks default to an empty bypassed slot
export function buildGp200(opts: {
  name?: string;
  blocks?: Partial<Record<number, SyntheticBlock>>;
  routing?: number[];
}): Uint8Array {
  const bytes = new Uint8Array(1224);
  const view = new DataView(bytes.buffer);
  const ascii = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) bytes[offset + i] = text.charCodeAt(i);
  };

  // header and name
  ascii(0x00, 'TSRP');
  ascii(0x10, '2-PG');
  ascii(0x28, 'MRAP');
  ascii(0x44, opts.name ?? 'test');

  // routing: identity order unless given
  const routing = opts.routing ?? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  routing.forEach((slot, i) => (bytes[0x94 + i] = slot));

  // effect blocks
  for (let slot = 0; slot < 11; slot++) {
    const base = 0xa0 + slot * 0x48;
    const block = opts.blocks?.[slot];
    bytes.set([0x14, 0x00, 0x44, 0x00, slot, block?.enabled ? 1 : 0, 0x0f, 0x00], base);
    view.setUint32(base + 8, block?.effectId ?? 0, true);
    (block?.params ?? []).forEach((v, p) => view.setFloat32(base + 12 + p * 4, v, true));
  }

  // checksum footer (big-endian)
  view.setUint16(0x4c6, gp200Checksum(bytes), false);
  return bytes;
}
