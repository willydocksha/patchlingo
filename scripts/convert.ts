// cli helper: print the ampero mini setting guide for gp-200 .prst files
// usage: npm run convert -- path/to/a.prst [more.prst]
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { decodeGp200, gp200ToAmperoMini, rigFromGp200 } from '../src/core';

// convert and print each file given on the command line
for (const file of process.argv.slice(2)) {
  const patch = gp200ToAmperoMini(rigFromGp200(decodeGp200(new Uint8Array(readFileSync(file)))));
  console.log(`\n=== ${basename(file)} → ${patch.device}: ${patch.name}`);
  for (const b of patch.blocks) {
    const auto = b.auto ? ' (auto)' : '';
    console.log(`  [${(b.module ?? '-').padEnd(3)}] ${b.source.sourceModel} → ${b.model ?? '—'}  <${b.match}${auto}>`);
    const set = b.params.filter((p) => p.from !== 'default');
    if (set.length) console.log(`        ${set.map((p) => `${p.name} ${p.display}${p.note ? ` (${p.note})` : ''}`).join(', ')}`);
    for (const n of b.notes) console.log(`        · ${n}`);
  }
  for (const n of patch.notes) console.log(`  ! ${n}`);
}
