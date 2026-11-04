// shared human-readable labels (bahasa indonesia) for ui and exports
import type { MatchLevel } from '../mappers/gp200ToAmperoMini.table';

// short label per match level
export const MATCH_LABEL: Record<MatchLevel, string> = {
  exact: 'Sama',
  close: 'Mirip',
  substitute: 'Pengganti',
  none: 'Tidak ada',
};

// one-line explanation per match level
export const MATCH_HINT: Record<MatchLevel, string> = {
  exact: 'Gear asli dan knob-nya sama.',
  close: 'Gear asli sama, tapi knob atau voicing beda.',
  substitute: 'Tidak ada padanan; dipakai model paling mirip.',
  none: 'Tidak ada padanan di Ampero Mini.',
};
