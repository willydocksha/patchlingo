// translate a gp-200 rig into an ampero mini setting guide
import type { Block, BlockCategory, ParamValue, Rig } from '../rig/types';
import {
  AMPERO_MINI_MODELS,
  findAmperoModel,
  type AmperoModel,
  type AmperoModule,
  type AmperoParamDef,
} from '../devices/amperoMini/catalog';
import { GP200_TO_AMPERO_MINI, type MapEntry, type MatchLevel } from './gp200ToAmperoMini.table';

export interface TargetParam {
  name: string;
  // value to dial in; null = leave at default / unknown
  value: number | string | null;
  // human-readable value, e.g. "500 ms", "On", "default"
  display: string;
  // where the value came from
  from: 'source' | 'fixed' | 'default';
  // source param name when it differs from the target name (e.g. "Volume" for Master)
  sourceParam?: string;
  // something the player should know about this value
  note?: string;
}

export interface TargetBlock {
  module: AmperoModule | null;
  model: string | null;
  match: MatchLevel;
  // true when the model came from automatic matching, not the curated table
  auto: boolean;
  source: Block;
  params: TargetParam[];
  notes: string[];
}

export interface AmperoPatch {
  name: string;
  device: 'Hotone Ampero Mini';
  // enabled source blocks, in chain order
  blocks: TargetBlock[];
  // source blocks that were off (shown only for reference)
  bypassed: Block[];
  notes: string[];
}

// ampero mini has three fx slots for pre-amp effects
const AMPERO_FX_SLOTS = 3;

// param name synonyms, tried when no exact name match exists (target -> source candidates)
const SYNONYMS: Record<string, string[]> = {
  Master: ['Volume', 'Output', 'Level'],
  Output: ['Volume', 'Master', 'Level'],
  Volume: ['Output', 'Level', 'Master'],
  'E.Level': ['Volume', 'Level', 'Output'],
  'Dly Mix': ['Mix'],
  Sustain: ['Gain', 'Fuzz'],
  Fuzz: ['Gain', 'Sustain', 'Fuzz'],
  'High Damp': ['Hi Damp', 'High Damp'],
};

// case-insensitive key lookup
function findKey(obj: Record<string, unknown>, name: string): string | undefined {
  const lower = name.toLowerCase();
  return Object.keys(obj).find((k) => k.toLowerCase() === lower);
}

// pick the curated table entry for a block
function lookupEntry(block: Block): MapEntry | undefined {
  return block.sourceModule ? GP200_TO_AMPERO_MINI[`${block.sourceModule}/${block.sourceModel}`] : undefined;
}

// word set for fuzzy gear comparison
function gearTokens(text: string | undefined): Set<string> {
  return new Set(
    (text ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9+ ]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 1 && !['the', 'and', 'with', 'based', 'on', 'of', 'for', 'channel', 'amp', 'pedal'].includes(w)),
  );
}

// automatic fallback: best gear-text overlap within the same category, else the first model of that category
function autoMatch(block: Block): { model: AmperoModel; match: MatchLevel } | undefined {
  const candidates = AMPERO_MINI_MODELS.filter((m) => m.category === block.category && m.module !== 'NR');
  if (!candidates.length) return undefined;
  const src = gearTokens(block.realGear);
  let best = candidates[0]!;
  let bestScore = 0;
  for (const m of candidates) {
    const tgt = gearTokens(m.basedOn);
    const shared = [...src].filter((w) => tgt.has(w)).length;
    const score = shared / Math.max(1, Math.min(src.size, tgt.size));
    if (score > bestScore) [best, bestScore] = [m, score];
  }
  return { model: best, match: bestScore >= 0.5 ? 'close' : 'substitute' };
}

// convert a source value to the target param's format
function convertValue(def: AmperoParamDef, value: ParamValue): { value: number | string | null; note?: string } {
  if (value === null) return { value: null, note: 'nilai asli tidak terbaca' };
  if (def.kind === 'choice') {
    const option = def.options.find((o) => o.toLowerCase() === String(value).toLowerCase());
    return option ? { value: option } : { value: String(value), note: `pilihan "${value}" tidak ada di Ampero` };
  }
  if (typeof value !== 'number') return { value, note: 'tipe nilai berbeda' };
  // clamp to the ampero range when the manual gives one
  if (def.min !== undefined && value < def.min) return { value: def.min, note: `asli ${value}, dibatasi ke minimum` };
  if (def.max !== undefined && value > def.max) return { value: def.max, note: `asli ${value}, dibatasi ke maksimum` };
  return { value };
}

// format a value for display
function display(def: AmperoParamDef, value: number | string | null): string {
  if (value === null) return 'default';
  if (typeof value === 'number' && def.kind === 'knob' && def.unit) return `${value} ${def.unit}`;
  return String(value);
}

// category-specific display tweaks (cab filters, synced delay time)
function specialDisplay(category: BlockCategory, param: TargetParam, source: Block): void {
  if (category === 'cab' && typeof param.value === 'number') {
    if (param.name === 'High Cut' && param.value >= 20000) param.display = 'off (buka penuh)';
    else if (param.name === 'Low Cut' && param.value <= 20) param.display = 'off (minimum)';
    else if (param.name === 'Low Cut' || param.name === 'High Cut') {
      param.display = `±${param.value} Hz`;
      param.note = 'skala filter di Ampero bisa beda; cocokkan pakai telinga';
    }
  }
  const synced = String(source.params.Sync ?? source.params['Time Sync'] ?? '').toUpperCase() === 'ON';
  if (category === 'delay' && param.name === 'Time' && synced) {
    param.display = 'ikut tap tempo';
    param.note = 'Sync ON di preset asli; nyalakan Sync dan set tempo patch';
  }
}

// fill target params from the source block
function mapParams(block: Block, model: AmperoModel, entry: MapEntry | undefined): { params: TargetParam[]; unused: string[] } {
  const used = new Set<string>();
  const renames = entry?.params ?? {};
  // explicit renames: target name -> source name
  const explicit = new Map<string, string>();
  for (const [src, tgt] of Object.entries(renames)) {
    if (tgt) explicit.set(tgt, src);
    else used.add(src);
  }

  // a source param only feeds a synonym when the target has no param of its own name
  const targetNames = new Set(model.params.map((p) => p.name.toLowerCase()));
  const isFree = (key: string) =>
    !used.has(key) && !Object.prototype.hasOwnProperty.call(renames, key);

  const params = model.params.map((def): TargetParam => {
    // fixed values from the table win
    const fixed = entry?.set && def.name in entry.set ? entry.set[def.name]! : undefined;
    if (fixed !== undefined) return { name: def.name, value: fixed, display: display(def, fixed), from: 'fixed' };

    // explicit rename, then same name, then synonyms
    let srcKey = explicit.get(def.name);
    if (!srcKey) {
      const same = findKey(block.params, def.name);
      if (same && isFree(same)) srcKey = same;
    }
    if (!srcKey) {
      for (const syn of SYNONYMS[def.name] ?? []) {
        const key = findKey(block.params, syn);
        if (key && isFree(key) && !targetNames.has(key.toLowerCase())) {
          srcKey = key;
          break;
        }
      }
    }
    if (!srcKey || !(srcKey in block.params)) return { name: def.name, value: null, display: 'default', from: 'default' };

    used.add(srcKey);
    const { value, note } = convertValue(def, block.params[srcKey]!);
    const param: TargetParam = { name: def.name, value, display: display(def, value), from: 'source', note };
    if (srcKey !== def.name) param.sourceParam = srcKey;
    specialDisplay(block.category, param, block);
    return param;
  });

  // source params that found no home
  const unused = Object.keys(block.params).filter((k) => !used.has(k) && block.params[k] !== null);
  return { params, unused };
}

// translate one enabled block
function mapBlock(block: Block): TargetBlock {
  const entry = lookupEntry(block);
  const notes: string[] = [];

  // curated entry with no equivalent
  if (entry && entry.match === 'none') {
    return { module: null, model: null, match: 'none', auto: false, source: block, params: [], notes: [entry.note ?? 'Tidak ada padanan.'] };
  }

  // resolve target model: curated table first, then automatic
  let model: AmperoModel | undefined;
  let match: MatchLevel;
  let auto = false;
  if (entry?.to) {
    // gates go to the dedicated nr module
    model = findAmperoModel(entry.to, block.category === 'gate' ? 'NR' : undefined) ?? findAmperoModel(entry.to);
    match = entry.match;
    if (entry.note) notes.push(entry.note);
  } else {
    const found = autoMatch(block);
    model = found?.model;
    match = found?.match ?? 'none';
    auto = true;
    if (model) notes.push('Padanan dipilih otomatis; belum dikurasi.');
  }
  if (!model) {
    return { module: null, model: null, match: 'none', auto, source: block, params: [], notes: ['Tidak ada padanan di Ampero Mini.'] };
  }

  const { params, unused } = mapParams(block, model, entry);
  if (unused.length) {
    notes.push(`Tidak ada knob untuk: ${unused.map((k) => `${k}=${block.params[k]}`).join(', ')}.`);
  }
  return { module: model.module, model: model.name, match, auto, source: block, params, notes };
}

// translate a whole rig
export function gp200ToAmperoMini(rig: Rig): AmperoPatch {
  const notes: string[] = [];
  const blocks: TargetBlock[] = [];
  const bypassed: Block[] = [];

  for (const block of rig.blocks) {
    if (!block.enabled) {
      bypassed.push(block);
      continue;
    }
    // the gp-200 volume block is just a level trim; handle it as a patch note
    if (block.category === 'volume') {
      const v = block.params.Volume;
      if (typeof v === 'number' && v < 100) notes.push(`Volume block GP-200 = ${v}. Turunkan patch volume di Ampero secukupnya.`);
      continue;
    }
    blocks.push(mapBlock(block));
  }

  // fx slot limit
  const fxCount = blocks.filter((b) => b.module === 'FX').length;
  if (fxCount > AMPERO_FX_SLOTS) {
    notes.push(`Butuh ${fxCount} slot FX, tapi Ampero Mini cuma punya ${AMPERO_FX_SLOTS}. Pilih yang paling penting.`);
  }
  // gate position hint when the source chain starts with the gate
  if (rig.blocks.find((b) => b.enabled && b.category !== 'volume')?.category === 'gate') {
    notes.push('Di preset asli, noise gate ada paling depan (sebelum efek lain).');
  }

  return { name: rig.name, device: 'Hotone Ampero Mini', blocks, bypassed, notes };
}
