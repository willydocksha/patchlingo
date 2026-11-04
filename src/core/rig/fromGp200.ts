// normalize a decoded gp-200 preset into the device-agnostic rig model
import type { Gp200Block, Gp200Preset } from '../decoders/gp200';
import { EFFECT_MAP } from '../vendor/gp200/effectNames';
import { EFFECT_PARAMS, type EffectParam } from '../vendor/gp200/effectParams';
import { EFFECT_DESCRIPTIONS } from '../vendor/gp200/effectDescriptions';
import type { Block, BlockCategory, ParamValue, Rig } from './types';

// default category for each fixed gp-200 module slot
const SLOT_CATEGORY: Record<Gp200Block['module'], BlockCategory> = {
  PRE: 'other',
  WAH: 'wah',
  DST: 'drive',
  AMP: 'amp',
  NR: 'gate',
  CAB: 'cab',
  EQ: 'eq',
  MOD: 'mod',
  DLY: 'delay',
  RVB: 'reverb',
  VOL: 'volume',
};

// name patterns that refine the category of flexible slots (pre, dst)
const NAME_CATEGORY: [RegExp, BlockCategory][] = [
  [/comp/i, 'dynamics'],
  [/boost|\bBB\b/i, 'boost'],
  [/octa|pitch|p-bend|harmon|detune/i, 'pitch'],
  [/wah/i, 'wah'],
  [/filter|ring mod|saturate/i, 'filter'],
];

// pick a category from the slot, refined by the effect name for pre/dst slots
function categorize(block: Gp200Block, name: string): BlockCategory {
  if (block.module === 'PRE' || block.module === 'DST') {
    for (const [re, cat] of NAME_CATEGORY) if (re.test(name)) return cat;
  }
  return SLOT_CATEGORY[block.module];
}

// strip trademark marks from the vendored "based on" descriptions
function cleanDescription(text: string | undefined): string | undefined {
  return text?.replace(/[®™*]/g, '').replace(/\s+/g, ' ').trim() || undefined;
}

// convert one raw float into a named param value, or null with a reason
function readParam(def: EffectParam, raw: number): { value: ParamValue; problem?: string } {
  if (!Number.isFinite(raw)) return { value: null, problem: `${def.name} is unreadable` };
  if (def.type === 'knob') {
    // allow tiny float error at the range edges
    if (raw < def.min - 0.01 || raw > def.max + 0.01) {
      return { value: null, problem: `${def.name}=${raw} is outside ${def.min}..${def.max}` };
    }
    const step = def.step > 0 ? def.step : 1;
    return { value: Math.round(raw / step) * step };
  }
  // switch and combox store the option id
  const option = def.options.find((o) => o.id === Math.round(raw));
  return option ? { value: option.name } : { value: null, problem: `${def.name}=${raw} is not a valid option` };
}

// convert one gp-200 block into a rig block
function toBlock(block: Gp200Block): Block {
  const warnings: string[] = [];
  const info = EFFECT_MAP[block.effectId];
  const name = info?.name ?? `Unknown (0x${block.effectId.toString(16).padStart(8, '0')})`;
  if (!info) warnings.push(`Unknown GP-200 effect code 0x${block.effectId.toString(16)}.`);
  if (!block.markerOk) warnings.push('Block header is damaged.');

  // decode the params that the effect actually defines; unused slots are ignored
  const params: Record<string, ParamValue> = {};
  for (const def of EFFECT_PARAMS[block.effectId] ?? []) {
    const { value, problem } = readParam(def, block.params[def.idx] ?? NaN);
    // vendored names sometimes carry trailing spaces ("Volume ")
    params[def.name.trim()] = value;
    // only bother the user about problems in blocks that are actually on
    if (problem && block.enabled) warnings.push(problem);
  }

  return {
    category: categorize(block, name),
    enabled: block.enabled,
    sourceModel: name,
    sourceModule: info?.module,
    realGear: info ? cleanDescription(EFFECT_DESCRIPTIONS[info.name]) : undefined,
    params,
    warnings,
  };
}

// build a rig from a decoded gp-200 preset
export function rigFromGp200(preset: Gp200Preset): Rig {
  return {
    name: preset.name,
    sourceDevice: 'Valeton GP-200',
    blocks: preset.blocks.map(toBlock),
    warnings: [...preset.warnings],
  };
}
