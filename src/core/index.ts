// public api of the core library
export * from './rig/types';
export { decodeGp200, isGp200Preset, gp200Checksum, Gp200DecodeError } from './decoders/gp200';
export type { Gp200Preset, Gp200Block } from './decoders/gp200';
export { rigFromGp200 } from './rig/fromGp200';
export { AMPERO_MINI_MODELS, findAmperoModel } from './devices/amperoMini/catalog';
export type { AmperoModel, AmperoModule, AmperoParamDef } from './devices/amperoMini/catalog';
export { gp200ToAmperoMini } from './mappers/gp200ToAmperoMini';
export type { AmperoPatch, TargetBlock, TargetParam } from './mappers/gp200ToAmperoMini';
export { GP200_TO_AMPERO_MINI } from './mappers/gp200ToAmperoMini.table';
export type { MapEntry, MatchLevel } from './mappers/gp200ToAmperoMini.table';
