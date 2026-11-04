// unit tests for the gp-200 binary decoder and rig normalizer (synthetic buffers only)
import { describe, expect, it } from 'vitest';
import { decodeGp200, Gp200DecodeError, isGp200Preset, rigFromGp200 } from '../src/core';
import { buildGp200 } from './helpers/buildGp200';

// effect codes used below (from the vendored gp-200 tables)
const DARK_TWIN = 0x07000004;
const OCTA = 0x01000021;
const EP_BOOST = 0x0000001a;
const VINTAGE_RACK = 0x0b000014;

describe('decodeGp200', () => {
  // header validation
  it('rejects files that are not gp-200 presets', () => {
    expect(isGp200Preset(new Uint8Array(1224))).toBe(false);
    expect(() => decodeGp200(new Uint8Array(10))).toThrow(Gp200DecodeError);
  });

  // basic field decoding
  it('reads name, enabled flags, effect ids and params', () => {
    const preset = decodeGp200(
      buildGp200({ name: 'my clean', blocks: { 3: { effectId: DARK_TWIN, enabled: true, params: [46, 61] } } }),
    );
    expect(preset.name).toBe('my clean');
    expect(preset.checksum?.ok).toBe(true);
    const amp = preset.blocks.find((b) => b.module === 'AMP')!;
    expect(amp.enabled).toBe(true);
    expect(amp.effectId).toBe(DARK_TWIN);
    expect(amp.params.slice(0, 2)).toEqual([46, 61]);
  });

  // routing bytes define the chain order
  it('orders blocks by the routing bytes', () => {
    const preset = decodeGp200(buildGp200({ routing: [4, 10, 0, 1, 2, 3, 5, 6, 7, 8, 9] }));
    expect(preset.blocks.map((b) => b.module).slice(0, 3)).toEqual(['NR', 'VOL', 'PRE']);
  });

  // broken routing still yields every slot exactly once
  it('repairs duplicated or out-of-range routing bytes', () => {
    const preset = decodeGp200(buildGp200({ routing: [3, 3, 99, 0, 1, 2, 4, 5, 6, 7, 8] }));
    expect(preset.blocks.map((b) => b.slot).sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(preset.warnings.some((w) => /routing/i.test(w))).toBe(true);
  });

  // tampered files still decode, but warn
  it('warns on checksum mismatch instead of failing', () => {
    const bytes = buildGp200({});
    bytes[0x200] = (bytes[0x200]! + 1) & 0xff;
    const preset = decodeGp200(bytes);
    expect(preset.checksum?.ok).toBe(false);
    expect(preset.warnings.some((w) => /checksum/i.test(w))).toBe(true);
  });

  // damaged block marker is flagged
  it('flags a damaged block header', () => {
    const bytes = buildGp200({});
    bytes[0xa0 + 2 * 0x48] = 0xff;
    const preset = decodeGp200(bytes);
    expect(preset.blocks.find((b) => b.slot === 2)!.markerOk).toBe(false);
  });
});

describe('rigFromGp200', () => {
  // knob and switch values get their names
  it('names params and converts switches to labels', () => {
    const rig = rigFromGp200(
      decodeGp200(buildGp200({ blocks: { 3: { effectId: DARK_TWIN, enabled: true, params: [46, 61, 40, 62, 75, 1] } } })),
    );
    const amp = rig.blocks.find((b) => b.category === 'amp')!;
    expect(amp.sourceModel).toBe('Dark Twin');
    expect(amp.realGear).toBe("Fender '65 Twin Reverb");
    expect(amp.params).toEqual({ Gain: 46, Volume: 61, Bass: 40, Middle: 62, Treble: 75, Bright: 'ON' });
  });

  // pre slot category depends on the effect
  it('categorizes flexible pre-slot effects by name', () => {
    const octa = rigFromGp200(decodeGp200(buildGp200({ blocks: { 0: { effectId: OCTA, enabled: true } } })));
    const boost = rigFromGp200(decodeGp200(buildGp200({ blocks: { 0: { effectId: EP_BOOST, enabled: true } } })));
    expect(octa.blocks[0]!.category).toBe('pitch');
    expect(boost.blocks[0]!.category).toBe('boost');
  });

  // garbage floats in used params become null with a warning
  it('nulls out-of-range values in enabled blocks', () => {
    const rig = rigFromGp200(
      decodeGp200(buildGp200({ blocks: { 8: { effectId: VINTAGE_RACK, enabled: true, params: [15, 1e30, 4, 50, 50, 1, 0] } } })),
    );
    const dly = rig.blocks.find((b) => b.category === 'delay')!;
    expect(dly.params.Time).toBeNull();
    expect(dly.params.Sync).toBe('ON');
    expect(dly.warnings).toHaveLength(1);
  });

  // unknown codes don't crash
  it('keeps unknown effect codes with a warning', () => {
    const rig = rigFromGp200(decodeGp200(buildGp200({ blocks: { 7: { effectId: 0x04ffffff, enabled: true } } })));
    const mod = rig.blocks.find((b) => b.category === 'mod')!;
    expect(mod.sourceModel).toMatch(/^Unknown/);
    expect(mod.warnings[0]).toMatch(/Unknown GP-200 effect code/);
  });
});
