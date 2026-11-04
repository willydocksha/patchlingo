// render translated patches as a markdown setting guide
import type { AmperoPatch, TargetBlock } from '../mappers/gp200ToAmperoMini';
import { MATCH_LABEL } from './labels';

// escape characters that would break a markdown table cell
function cell(text: string): string {
  return text.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

// "Name value" list of the params that carry a value
export function settingText(block: TargetBlock): string {
  const set = block.params.filter((p) => p.from !== 'default');
  return set.map((p) => `${p.name} ${p.display}`).join(', ') || '(default)';
}

// one table row per block
function row(block: TargetBlock): string {
  const source = `${block.source.sourceModel}${block.source.realGear ? ` (${block.source.realGear})` : ''}`;
  const target = block.model ? `**${block.model}**` : '—';
  const match = `${MATCH_LABEL[block.match]}${block.auto ? ' (otomatis)' : ''}`;
  const notes = [
    ...block.params.filter((p) => p.from !== 'default' && p.note).map((p) => `${p.name}: ${p.note}`),
    ...block.notes,
  ];
  return `| ${block.module ?? '—'} | ${cell(source)} | ${target} | ${match} | ${cell(block.model ? settingText(block) : '')} | ${cell(notes.join(' · '))} |`;
}

// render one patch
export function patchToMarkdown(patch: AmperoPatch, fileName?: string): string {
  const lines = [`## ${patch.name || fileName || 'Preset'}`, ''];
  if (fileName) lines.push(`File: \`${fileName}\``, '');
  lines.push(
    '| Modul | GP-200 | Ampero Mini | Padanan | Setting | Catatan |',
    '|---|---|---|---|---|---|',
    ...patch.blocks.map(row),
  );
  if (patch.notes.length) lines.push('', ...patch.notes.map((n) => `> ${n}`));
  return lines.join('\n');
}

// render several patches into one document
export function patchesToMarkdown(items: { patch: AmperoPatch; fileName?: string }[]): string {
  return [
    '# Panduan setting Ampero Mini',
    '',
    'Dibuat dengan Patchlingo dari preset Valeton GP-200. Nilai adalah titik awal; sesuaikan level dan EQ pakai telinga.',
    '',
    ...items.map(({ patch, fileName }) => patchToMarkdown(patch, fileName) + '\n'),
  ].join('\n');
}
