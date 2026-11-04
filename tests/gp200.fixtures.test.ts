// regression tests against real presets in fixtures/private (gitignored; skipped when absent)
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { decodeGp200, rigFromGp200, type Rig } from '../src/core';

const DIR = join(__dirname, '..', 'fixtures', 'private');

// load a fixture as a rig
function load(file: string): Rig {
  return rigFromGp200(decodeGp200(new Uint8Array(readFileSync(join(DIR, file)))));
}

// compact view of the enabled blocks: "model:param=value,..."
function enabledChain(rig: Rig): string[] {
  return rig.blocks.filter((b) => b.enabled).map((b) => b.sourceModel);
}

describe.skipIf(!existsSync(join(DIR, '28-A clean delay aja.prst')))('danny rico presets', () => {
  // all files decode cleanly with valid checksums
  it.each([
    '28-A clean delay aja.prst',
    '28-B crunch .prst',
    '28-C lead delay.prst',
    '28-D shimmer tekiwir .prst',
    '29-A octavianti.prst',
  ])('%s decodes without warnings', (file) => {
    const rig = load(file);
    expect(rig.warnings).toEqual([]);
    for (const b of rig.blocks.filter((x) => x.enabled)) expect(b.warnings).toEqual([]);
  });

  // 28-a: clean twin with analog delay and spring
  it('28-A clean delay aja', () => {
    const rig = load('28-A clean delay aja.prst');
    expect(rig.name).toBe('clean delay aja');
    expect(enabledChain(rig)).toEqual(['Gate 1', 'Volume', 'COMP', 'Dark Twin', 'TWD CP', 'Analog', 'Spring']);
    expect(rig.blocks.find((b) => b.sourceModel === 'Dark Twin')!.params).toEqual({
      Gain: 46, Volume: 61, Bass: 40, Middle: 62, Treble: 75, Bright: 'ON',
    });
    expect(rig.blocks.find((b) => b.sourceModel === 'Analog')!.params).toMatchObject({ Mix: 20, Time: 500, Feedback: 32 });
  });

  // 28-b: ts9 into jcm800
  it('28-B crunch', () => {
    const rig = load('28-B crunch .prst');
    expect(enabledChain(rig)).toEqual(['Gate 1', 'Volume', 'OD 9', 'UK 800', 'UK LD', 'Vintage Rack', 'Plate']);
    expect(rig.blocks.find((b) => b.sourceModel === 'OD 9')!.params).toEqual({ Gain: 0, Tone: 70, Volume: 50 });
  });

  // 28-c: boosted rectifier lead with mesa eq
  it('28-C lead delay', () => {
    const rig = load('28-C lead delay.prst');
    expect(enabledChain(rig)).toEqual([
      'Gate 1', 'Volume', 'Boost', 'Scream OD', 'Mess DualV', 'Mess', 'Mess EQ', 'Vintage Rack', 'Plate',
    ]);
    expect(rig.blocks.find((b) => b.sourceModel === 'Mess EQ')!.params).toEqual({
      '80Hz': -4, '240Hz': -7, '750Hz': 6, '2.2kHz': 15, '6.6kHz': 22,
    });
  });

  // 28-d: no actual shimmer, it's multi-tap delay + arena reverb
  it('28-D shimmer tekiwir', () => {
    const rig = load('28-D shimmer tekiwir .prst');
    expect(enabledChain(rig)).toEqual(['Gate 1', 'Volume', 'COMP', 'Dark Twin', 'TWD CP', 'Ambience 1', 'Arena']);
    expect(rig.blocks.find((b) => b.sourceModel === 'Arena')!.params).toMatchObject({ Mix: 44, 'Pre Delay': 100, Decay: 70 });
  });

  // 29-a: octaver into the lead rig, no time effects
  it('29-A octavianti', () => {
    const rig = load('29-A octavianti.prst');
    expect(enabledChain(rig)).toEqual(['Gate 1', 'Volume', 'OCTA', 'Scream OD', 'Mess DualV', 'Mess', 'Mess EQ']);
    const octa = rig.blocks.find((b) => b.sourceModel === 'OCTA')!;
    expect(octa.category).toBe('pitch');
    expect(octa.params).toEqual({ 'Low Oct': 30, 'High Oct': 0, Dry: 50 });
  });
});
