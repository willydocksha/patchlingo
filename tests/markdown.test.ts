// tests for the markdown export
import { describe, expect, it } from 'vitest';
import { gp200ToAmperoMini, patchesToMarkdown, patchToMarkdown, type Block } from '../src/core';

// small rig with an amp, a synced delay and an effect without equivalent
const blocks: Block[] = [
  {
    category: 'amp', enabled: true, sourceModel: 'Dark Twin', sourceModule: 'AMP', realGear: "Fender '65 Twin Reverb",
    params: { Gain: 46, Volume: 61, Bass: 40, Middle: 62, Treble: 75, Bright: 'ON' }, warnings: [],
  },
  {
    category: 'delay', enabled: true, sourceModel: 'Vintage Rack', sourceModule: 'DLY',
    params: { Mix: 15, Time: 30, Feedback: 4, Mod: 50, Tone: 50, Sync: 'ON', Trail: 'OFF' }, warnings: [],
  },
  { category: 'other', enabled: true, sourceModel: 'Freeze', sourceModule: 'PRE', params: {}, warnings: [] },
];
const patch = gp200ToAmperoMini({ name: 'my | preset', sourceDevice: 'Valeton GP-200', blocks, warnings: [] });

describe('patchToMarkdown', () => {
  const md = patchToMarkdown(patch, 'a.prst');

  // table rows carry model, match label and settings
  it('renders a row per block', () => {
    expect(md).toContain("| AMP | Dark Twin (Fender '65 Twin Reverb) | **Black Twin** | Sama | Gain 46, Master 61, Bass 40, Middle 62, Treble 75, Bright On |");
    expect(md).toContain('Time ikut tap tempo');
    expect(md).toContain('| — | Freeze | — | Tidak ada |');
  });

  // pipes in names must not break the table
  it('escapes table separators', () => {
    expect(md.split('\n')[0]).toBe('## my | preset');
    expect(md).toContain('File: `a.prst`');
  });
});

describe('patchesToMarkdown', () => {
  // multi-preset document has one title and one section per patch
  it('joins several patches under one title', () => {
    const md = patchesToMarkdown([{ patch }, { patch, fileName: 'b.prst' }]);
    expect(md.match(/^# /gm)).toHaveLength(1);
    expect(md.match(/^## /gm)).toHaveLength(2);
  });
});
