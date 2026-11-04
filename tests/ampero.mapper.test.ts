// tests for the ampero mini catalog, the curated table and the gp-200 -> ampero mapper
import { describe, expect, it } from 'vitest';
import {
  AMPERO_MINI_MODELS,
  findAmperoModel,
  GP200_TO_AMPERO_MINI,
  gp200ToAmperoMini,
  type Block,
  type Rig,
} from '../src/core';
import { EFFECT_MAP } from '../src/core/vendor/gp200/effectNames';

// build a one-off rig from blocks
function rig(...blocks: Block[]): Rig {
  return { name: 't', sourceDevice: 'Valeton GP-200', blocks, warnings: [] };
}

// build an enabled block
function block(sourceModule: string, sourceModel: string, category: Block['category'], params: Block['params'] = {}, realGear?: string): Block {
  return { category, enabled: true, sourceModel, sourceModule, realGear, params, warnings: [] };
}

describe('ampero mini catalog', () => {
  // names must be unique within a module
  it('has no duplicate model names per module', () => {
    const keys = AMPERO_MINI_MODELS.map((m) => `${m.module}/${m.name}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  // spot-check a few entries against the manual
  it('contains known models with manual param names', () => {
    expect(findAmperoModel('Black Twin', 'AMP')?.params.map((p) => p.name)).toEqual(['Gain', 'Master', 'Bass', 'Middle', 'Treble', 'Bright']);
    expect(findAmperoModel('Smart Gate', 'NR')).toBeDefined();
    expect(findAmperoModel('V-EQ')?.params).toHaveLength(5);
  });
});

describe('gp-200 -> ampero table', () => {
  const gpKeys = new Set(Object.values(EFFECT_MAP).map((e) => `${e.module}/${e.name}`));

  // every key refers to a real gp-200 effect
  it('only uses existing gp-200 effect keys', () => {
    const unknown = Object.keys(GP200_TO_AMPERO_MINI).filter((k) => !gpKeys.has(k));
    expect(unknown).toEqual([]);
  });

  // every target exists in the catalog, and 'none' entries have no target
  it('only points at catalog models', () => {
    for (const [key, entry] of Object.entries(GP200_TO_AMPERO_MINI)) {
      if (entry.match === 'none') expect(entry.to, key).toBeNull();
      else expect(findAmperoModel(entry.to!), `${key} -> ${entry.to}`).toBeDefined();
    }
  });

  // renames and fixed values point at real target params
  it('renames into existing target params', () => {
    for (const [key, entry] of Object.entries(GP200_TO_AMPERO_MINI)) {
      if (!entry.to) continue;
      const names = new Set(findAmperoModel(entry.to)!.params.map((p) => p.name));
      for (const tgt of Object.values(entry.params ?? {})) if (tgt) expect(names.has(tgt), `${key}: ${tgt}`).toBe(true);
      for (const tgt of Object.keys(entry.set ?? {})) expect(names.has(tgt), `${key}: ${tgt}`).toBe(true);
    }
  });

  // most real gp-200 effects are curated (the rest use auto matching)
  it('covers nearly all gp-200 effects', () => {
    const missing = [...gpKeys].filter((k) => !GP200_TO_AMPERO_MINI[k] && !k.startsWith('VOL/'));
    expect(missing.length).toBeLessThanOrEqual(5);
  });
});

describe('gp200ToAmperoMini', () => {
  // renames, synonyms and switch labels
  it('maps an amp with renamed params', () => {
    const out = gp200ToAmperoMini(
      rig(block('AMP', 'Dark Twin', 'amp', { Gain: 46, Volume: 61, Bass: 40, Middle: 62, Treble: 75, Bright: 'ON' })),
    );
    const amp = out.blocks[0]!;
    expect(amp.model).toBe('Black Twin');
    expect(amp.match).toBe('exact');
    expect(Object.fromEntries(amp.params.map((p) => [p.name, p.value]))).toEqual({
      Gain: 46, Master: 61, Bass: 40, Middle: 62, Treble: 75, Bright: 'On',
    });
  });

  // explicit table renames win over same-name matching
  it('follows explicit renames (Tweedy: Gain->Volume, Volume->Output)', () => {
    const out = gp200ToAmperoMini(rig(block('AMP', 'Tweedy', 'amp', { Gain: 30, Tone: 50, Volume: 70 })));
    expect(Object.fromEntries(out.blocks[0]!.params.map((p) => [p.name, p.value]))).toEqual({ Volume: 30, Tone: 50, Output: 70 });
  });

  // gates land in the nr module
  it('puts gates in the nr module', () => {
    const out = gp200ToAmperoMini(rig(block('NR', 'Gate 1', 'gate', { Threshold: 30 })));
    expect(out.blocks[0]!.module).toBe('NR');
  });

  // cab filter extremes read as "off"
  it('shows cab filters at their extremes as off', () => {
    const out = gp200ToAmperoMini(rig(block('CAB', 'UK LD', 'cab', { Volume: 70, 'Low Cut': 19, 'High Cut': 20001 })));
    const p = Object.fromEntries(out.blocks[0]!.params.map((x) => [x.name, x.display]));
    expect(p['Low Cut']).toMatch(/^off/);
    expect(p['High Cut']).toMatch(/^off/);
  });

  // synced delay shows tap tempo instead of a time
  it('shows synced delay time as tap tempo', () => {
    const out = gp200ToAmperoMini(
      rig(block('DLY', 'Vintage Rack', 'delay', { Mix: 15, Time: 30, Feedback: 4, Mod: 50, Tone: 50, Sync: 'ON', Trail: 'OFF' })),
    );
    expect(out.blocks[0]!.params.find((p) => p.name === 'Time')!.display).toBe('ikut tap tempo');
  });

  // out-of-range values are clamped with a note
  it('clamps values outside the ampero range', () => {
    const out = gp200ToAmperoMini(rig(block('RVB', 'Arena', 'reverb', { Mix: 44, 'Pre Delay': 250, Decay: 70 })));
    const pre = out.blocks[0]!.params.find((p) => p.name === 'Pre Delay')!;
    expect(pre.value).toBe(100);
    expect(pre.note).toMatch(/maksimum/);
  });

  // no-equivalent entries are reported, not guessed
  it('marks effects without an equivalent', () => {
    const out = gp200ToAmperoMini(rig(block('PRE', 'Freeze', 'other')));
    expect(out.blocks[0]!.match).toBe('none');
    expect(out.blocks[0]!.model).toBeNull();
  });

  // uncurated effects fall back to gear matching
  it('auto-matches uncurated effects by real gear', () => {
    const out = gp200ToAmperoMini(rig(block('AMP', 'Mystery Amp', 'amp', { Gain: 50 }, 'Marshall JCM800 clone')));
    expect(out.blocks[0]!.auto).toBe(true);
    expect(out.blocks[0]!.model).toBe('Marshell 800');
  });

  // volume block, bypassed blocks and fx slot limit
  it('handles volume, bypassed blocks and the fx slot limit', () => {
    const off: Block = { ...block('MOD', 'G-Chorus', 'mod'), enabled: false };
    const out = gp200ToAmperoMini(
      rig(
        block('VOL', 'Volume', 'volume', { Volume: 80 }),
        block('PRE', 'COMP', 'dynamics'),
        block('PRE', 'Boost', 'boost'),
        block('PRE', 'OCTA', 'pitch'),
        block('DST', 'Green OD', 'drive'),
        off,
      ),
    );
    expect(out.blocks).toHaveLength(4);
    expect(out.bypassed).toEqual([off]);
    expect(out.notes.some((n) => n.includes('80'))).toBe(true);
    expect(out.notes.some((n) => n.includes('slot FX'))).toBe(true);
  });
});
