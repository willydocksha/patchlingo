// cli helper: print the rig of one or more gp-200 .prst files
// usage: npm run decode -- path/to/a.prst [more.prst]
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { decodeGp200, rigFromGp200 } from '../src/core';

// decode and print each file given on the command line
for (const file of process.argv.slice(2)) {
  const rig = rigFromGp200(decodeGp200(new Uint8Array(readFileSync(file))));
  console.log(`\n=== ${basename(file)} | ${rig.name}`);
  for (const w of rig.warnings) console.log(`  ! ${w}`);
  for (const b of rig.blocks) {
    console.log(`  ${b.enabled ? 'ON ' : 'off'} ${b.category.padEnd(8)} ${b.sourceModel}${b.realGear ? ` (${b.realGear})` : ''}`);
    if (b.enabled) {
      const params = Object.entries(b.params).map(([k, v]) => `${k}=${v ?? '?'}`);
      if (params.length) console.log(`        ${params.join(', ')}`);
      for (const w of b.warnings) console.log(`        ! ${w}`);
    }
  }
}
