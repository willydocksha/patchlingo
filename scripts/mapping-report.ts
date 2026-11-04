// dev report: check every curated gp-200 -> ampero mapping for unmapped params
// usage: npm run report:mapping
import { EFFECT_MAP } from '../src/core/vendor/gp200/effectNames';
import { EFFECT_PARAMS } from '../src/core/vendor/gp200/effectParams';
import { findAmperoModel } from '../src/core/devices/amperoMini/catalog';
import { GP200_TO_AMPERO_MINI } from '../src/core/mappers/gp200ToAmperoMini.table';
import { gp200ToAmperoMini } from '../src/core/mappers/gp200ToAmperoMini';
import type { Block, BlockCategory } from '../src/core/rig/types';

// rough category per gp-200 module, enough for this report
const CATEGORY: Record<string, BlockCategory> = {
  PRE: 'other', WAH: 'wah', DST: 'drive', AMP: 'amp', NR: 'gate', CAB: 'cab',
  EQ: 'eq', MOD: 'mod', DLY: 'delay', RVB: 'reverb', VOL: 'volume',
};

let problems = 0;
const seen = new Set<string>();

// walk every gp-200 effect once per table key
for (const [id, info] of Object.entries(EFFECT_MAP)) {
  const key = `${info.module}/${info.name}`;
  if (seen.has(key)) continue;
  seen.add(key);
  const entry = GP200_TO_AMPERO_MINI[key];

  // report effects missing from the table (they fall back to auto matching)
  if (!entry) {
    if (info.module !== 'VOL') console.log(`NO ENTRY   ${key}`);
    continue;
  }
  if (entry.to && !findAmperoModel(entry.to)) {
    console.log(`BAD TARGET ${key} -> ${entry.to}`);
    problems++;
    continue;
  }
  if (!entry.to) continue;

  // build a block holding the effect's default params
  const params = Object.fromEntries(
    (EFFECT_PARAMS[Number(id)] ?? []).map((d) => [d.name.trim(), d.type === 'knob' ? d.default : d.options.find((o) => o.id === d.default)?.name ?? null]),
  );
  const block: Block = {
    category: info.module === 'NR' ? 'gate' : CATEGORY[info.module] ?? 'other',
    enabled: true, sourceModel: info.name, sourceModule: info.module, params, warnings: [],
  };
  const out = gp200ToAmperoMini({ name: 't', sourceDevice: 'x', blocks: [block], warnings: [] }).blocks[0]!;

  // list leftovers on both sides
  const unusedNote = out.notes.find((n) => n.startsWith('Tidak ada knob'));
  // cab mic/position have no gp-200 counterpart, so they are expected to stay default
  const empty = out.params
    .filter((p) => p.from === 'default' && !(out.module === 'CAB' && /^(Mic Type|Position)/.test(p.name)))
    .map((p) => p.name);
  if (unusedNote || empty.length) {
    console.log(`${key} -> ${entry.to}\n    src left: ${unusedNote ?? '-'}\n    tgt empty: ${empty.join(', ') || '-'}`);
  }
}
console.log(`\nbad targets: ${problems}`);
