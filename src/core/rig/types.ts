// device-agnostic preset model shared by all decoders and mappers

// functional role of a block, independent of device module names
export type BlockCategory =
  | 'dynamics'
  | 'boost'
  | 'drive'
  | 'wah'
  | 'filter'
  | 'pitch'
  | 'amp'
  | 'gate'
  | 'cab'
  | 'eq'
  | 'mod'
  | 'delay'
  | 'reverb'
  | 'volume'
  | 'other';

// a param value: knob number, switch/combox option label, or null when unreadable
export type ParamValue = number | string | null;

export interface Block {
  category: BlockCategory;
  enabled: boolean;
  // model name as shown on the source device, e.g. "Dark Twin"
  sourceModel: string;
  // source device's own module/family for the model, e.g. "AMP" (disambiguates repeated names)
  sourceModule?: string;
  // real-world gear the model is based on, main key for cross-device matching
  realGear?: string;
  // param name -> value, in the source device's param order
  params: Record<string, ParamValue>;
  // per-block problems found while decoding (bad values, unknown model)
  warnings: string[];
}

export interface Rig {
  name: string;
  sourceDevice: string;
  // blocks in signal-chain order
  blocks: Block[];
  // preset-level problems (checksum mismatch etc.)
  warnings: string[];
}
