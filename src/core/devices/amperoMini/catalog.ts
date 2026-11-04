// hotone ampero mini model catalog
// source: official ampero mini online manual (firmware v1.0), "effect models list" pages 18-32
import type { BlockCategory } from '../../rig/types';

// ampero mini signal-chain modules (fx1-3 share one pool of models)
export type AmperoModule = 'FX' | 'AMP' | 'NR' | 'CAB' | 'EQ' | 'DLY' | 'RVB';

export interface KnobDef {
  kind: 'knob';
  name: string;
  // range as printed in the manual; absent when the manual gives none (e.g. cab params)
  min?: number;
  max?: number;
  unit?: string;
}

export interface ChoiceDef {
  kind: 'choice';
  name: string;
  options: string[];
}

export type AmperoParamDef = KnobDef | ChoiceDef;

export interface AmperoModel {
  name: string;
  module: AmperoModule;
  category: BlockCategory;
  // "based on" text from the manual, trademarks stripped
  basedOn?: string;
  params: AmperoParamDef[];
}

// param builders to keep the table compact
const k = (name: string, min = 0, max = 100, unit?: string): KnobDef => ({ kind: 'knob', name, min, max, unit });
const sw = (name: string): ChoiceDef => ({ kind: 'choice', name, options: ['Off', 'On'] });
const ch = (name: string, ...options: string[]): ChoiceDef => ({ kind: 'choice', name, options });
const free = (name: string): KnobDef => ({ kind: 'knob', name });

// shared param sets
const AMP_STD = [k('Gain'), k('Presence'), k('Master'), k('Bass'), k('Middle'), k('Treble')];
const AMP_VOL_OUT = [k('Volume'), k('Presence'), k('Output'), k('Bass'), k('Middle'), k('Treble')];
const AMP_GAIN_OUT = [k('Gain'), k('Presence'), k('Output'), k('Bass'), k('Middle'), k('Treble')];
const DRIVE_3 = [k('Gain'), k('Tone'), k('Volume')];
const DELAY_STD = [k('Mix'), k('Feedback'), k('Time', 20, 4000, 'ms'), sw('Sync'), sw('Trail')];
const CAB_STD = [free('Mic Type'), free('Volume'), free('Low Cut'), free('High Cut'), free('Position X'), free('Position Y'), free('Position Z')];
const GTR_EQ = (bands: string[]) => [...bands.map((b) => k(b, -50, 50)), k('Volume')];

// model builders per module
const fx = (name: string, category: BlockCategory, basedOn: string | undefined, params: AmperoParamDef[]): AmperoModel =>
  ({ name, module: 'FX', category, basedOn, params });
const amp = (name: string, basedOn: string, params: AmperoParamDef[] = AMP_STD): AmperoModel =>
  ({ name, module: 'AMP', category: 'amp', basedOn, params });
const cab = (name: string, basedOn: string): AmperoModel =>
  ({ name, module: 'CAB', category: 'cab', basedOn, params: CAB_STD });
const dly = (name: string, basedOn: string, params: AmperoParamDef[] = DELAY_STD): AmperoModel =>
  ({ name, module: 'DLY', category: 'delay', basedOn, params });
const rvb = (name: string, basedOn: string, params: AmperoParamDef[]): AmperoModel =>
  ({ name, module: 'RVB', category: 'reverb', basedOn, params });
const eq = (name: string, basedOn: string, params: AmperoParamDef[]): AmperoModel =>
  ({ name, module: 'EQ', category: 'eq', basedOn, params });

export const AMPERO_MINI_MODELS: AmperoModel[] = [
  // fx: dynamics
  fx('Comprosso', 'dynamics', 'Ross Compressor', [k('Sustain'), k('Output')]),
  fx('Squeezer', 'dynamics', 'Flexible, fully adjustable compressor', [
    k('Threshold'), k('Ratio'), k('Output'), k('Attack'), k('Release'), k('Tone'), k('Blend'),
  ]),
  fx('Affinity Boost', 'boost', 'Xotic AC Booster', [k('Gain'), k('Volume'), k('Bass'), k('Treble')]),
  fx('FET Boost', 'boost', 'Green clip-on FET preamp', [k('Bass'), k('Treble'), k('Volume'), sw('Low Cut')]),
  fx('Enhancer', 'boost', 'Xotic EP Booster', [sw('+3dB'), sw('Bright'), k('Volume')]),
  fx('Smart Gate', 'gate', 'ISP Decimator noise gate', [k('Threshold')]),
  fx('Fast Gate', 'gate', '2-mode noise gate with fast response', [k('Threshold'), ch('Mode', 'I', 'II')]),
  fx('Gated Boost', 'boost', 'Pure boost with built-in noise gate and low cut', [k('Boost'), k('Gate'), k('Low Cut')]),
  fx('Acoustic Refiner', 'other', 'Natural "woody" acoustic sound for acoustic instruments', [
    k('Frequency'), k('Shape'), k('Body'), k('Top'), k('Volume'),
  ]),
  fx('AC Sim', 'other', 'Acoustic guitar simulator', [ch('Mode', 'Standard', 'Jumbo', 'Enhanced', 'Piezo')]),

  // fx: filter / wah
  fx('Toucher', 'filter', 'Touch-sensitive envelope filter (touch wah)', [
    k('Sens'), k('Range'), k('Q'), k('Mix'), ch('Mode', 'Guitar', 'Bass'),
  ]),
  fx('Crier', 'filter', 'Variable auto wah', [k('Depth'), k('Rate'), k('Volume'), k('Low'), k('Q'), k('High'), sw('Sync')]),
  fx('Voxy Wah', 'wah', 'VOX V846 wah', [k('Range'), k('Q'), k('Volume')]),
  fx('Cry Wah', 'wah', 'Dunlop CryBaby wah', [k('Range'), k('Q'), k('Volume')]),
  fx('Bass Press', 'wah', 'Hotone Bass Press (wah mode)', [k('Range'), k('Q'), k('Volume')]),

  // fx: pitch
  fx('Clean Octa', 'pitch', 'Polyphonic octave', [k('Low Oct'), k('High Oct'), k('Dry')]),
  fx('Harmony', 'pitch', 'Hotone Harmony polyphonic harmonizer', [
    k('Hi Pitch', 0, 24), k('Low Pitch', -24, 0), k('Dry'), k('Hi Volume'), k('Low Volume'),
  ]),
  fx('Pitch Shift', 'pitch', 'Polyphonic pitch shifter, max 2 octaves', [k('Pitch', -24, 24), k('Volume'), k('Position'), k('Dry')]),
  fx('Detune', 'pitch', 'Slightly pitch-shifted signal for chorus-like tone', [k('Range', -50, 50, 'cent'), k('Wet'), k('Dry')]),

  // fx: misc
  fx('Telephone Line', 'filter', 'Vintage telephone effect', [k('Noise'), k('Shake')]),
  fx('Satisfaction', 'filter', 'Vintage tape saturation', [k('Saturation'), k('Mix'), k('Output'), k('High Cut')]),
  fx('Path Filter', 'filter', '4-step auto filter', [k('Step 1'), k('Step 2'), k('Step 3'), k('Step 4'), k('Rate'), sw('Sync')]),
  fx('Bit Krusher', 'filter', 'Bitcrusher / sample reducer', [k('Mix'), k('Krush'), k('Bit'), k('Hi Cut'), k('Lo Cut')]),
  fx('Ring Mod', 'filter', 'Ring modulator', [k('Mix'), k('Freq'), k('Fine', -50, 50), k('Tone')]),
  fx('Sweller', 'dynamics', 'Auto swell (violin-like)', [k('Attack'), ch('Curve', 'Line', 'Exp', 'Log')]),

  // fx: overdrive / distortion
  fx('Green Drive', 'drive', 'Ibanez TS-808 Tube Screamer', DRIVE_3),
  fx('Super Drive', 'drive', '3-knob yellow overdrive (asymmetric clipping)', DRIVE_3),
  fx('Screamood', 'drive', 'TS-style overdrive with its most enduring modification', [...DRIVE_3, sw('Fat'), sw('Air')]),
  fx('Zen Garden', 'drive', 'Hermida Zendrive', [...DRIVE_3, k('Voice')]),
  fx('Big Pie', 'drive', 'Electro-Harmonix Big Muff Pi', [k('Sustain'), k('Tone'), k('Volume')]),
  fx('Face Fuzz', 'drive', 'Dallas-Arbiter Fuzz Face', [k('Fuzz'), k('Volume')]),
  fx('Bend Fuzz', 'drive', 'Sola Sound Tone Bender MkII', [k('Fuzz'), k('Volume')]),
  fx('Black Tail', 'drive', 'ProCo The Rat (early LM308 version)', [k('Gain'), k('Filter'), k('Volume')]),
  fx('Smooth Dist', 'drive', '3-knob orange distortion from the late 1970s', DRIVE_3),
  fx('Governor', 'drive', "Marshall Guv'Nor", [k('Gain'), k('Volume'), k('Bass'), k('Middle'), k('Treble')]),
  fx('Crunchist', 'drive', 'MI Audio Crunch Box', DRIVE_3),
  fx('Bass Crusher', 'drive', 'Yellow bass overdrive pedal', [k('Gain'), k('Blend'), k('Volume'), k('Bass'), k('Treble')]),
  fx('Solid Steel', 'drive', 'Bass drive', [k('Gain'), k('Tone'), k('Volume'), ch('Mode', 'Normal', 'Scoop', 'Edge'), k('Blend')]),

  // fx: modulation
  fx('Aozora Chorus', 'mod', 'Arion SCH-1 stereo chorus', [k('Depth'), k('Rate'), k('Tone'), sw('Sync')]),
  fx('Grand Choruium', 'mod', 'Huge late-1970s ensemble chorus (chorus mode)', [k('Depth'), k('Rate'), k('Volume'), sw('Sync')]),
  fx('Liquid C', 'mod', '4-button purple stereo chorus', [ch('Mode', '1', '2', '3', '4')]),
  fx('Choruium B', 'mod', 'Ensemble chorus tuned for bass', [k('Depth'), k('Rate'), k('E.Level'), sw('Sync')]),
  fx('Jetter', 'mod', 'Classic flanger', [k('Depth'), k('Rate'), k('Pre Delay'), k('Feedback'), sw('Sync')]),
  fx('Jetter B', 'mod', 'Classic flanger tuned for bass', [k('Depth'), k('Rate'), k('Pre Delay'), k('Feedback'), sw('Sync')]),
  fx('Jetter N', 'mod', 'Negative-feedback flanger', [k('Depth'), k('Rate'), k('Pre Delay'), k('Feedback'), sw('Sync')]),
  fx('Trem Jet', 'mod', 'Flanger + tremolo', [
    k('Flg Depth'), k('Flg Rate'), k('Feedback'), k('Trm Depth'), k('Trm Rate'), sw('Flg Sync'), sw('Trm Sync'),
  ]),
  fx('Pulser', 'mod', 'BBD blue vibrato pedal', [k('Depth'), k('Rate'), sw('Sync')]),
  fx('Grand Vibrato', 'mod', 'Huge late-1970s ensemble chorus (vibrato mode)', [k('Depth'), k('Rate'), k('E.Level'), sw('Sync')]),
  fx('Shiver T', 'mod', 'Touch-sensitive vibrato', [k('Sens'), k('Rate'), k('Output'), sw('Sync')]),
  fx('90 Phaser', 'mod', 'MXR M101 Phase 90', [k('Rate'), sw('Sync')]),
  fx('Green Phaser', 'mod', '2-knob green phaser', [k('Depth'), k('Rate'), sw('Sync')]),
  fx('Revolver', 'mod', 'Shin-ei Uni-Vibe', [k('Depth'), k('Rate'), k('Volume'), ch('Mode', 'Chorus', 'Vibrato'), sw('Sync')]),
  fx('Helicopter', 'mod', 'Demeter TRM-1 Tremulator', [k('Depth'), k('Rate'), sw('Sync')]),
  fx('Custom Trem', 'mod', 'Tremolo with 4 waveforms', [
    k('Depth'), k('Rate'), k('Volume'), k('Color'), ch('Shape', 'Sine', 'Triangle', 'Square', 'Sawtooth'), k('Bias'), sw('Sync'),
  ]),

  // amp: clean
  amp('Tweed Lux', 'Fender Tweed Deluxe (bright channel, 5E3)', [k('Volume'), k('Tone'), k('Output')]),
  amp('Baseman Norm', "Fender '59 Bassman (normal channel)", AMP_VOL_OUT),
  amp('Black Twin', "Fender '65 Twin Reverb", [k('Gain'), k('Master'), k('Bass'), k('Middle'), k('Treble'), sw('Bright')]),
  amp('Voxy 30HW Norm', 'VOX AC30HW (normal channel)', [k('Volume'), k('Tone Cut'), k('Master'), sw('Bright')]),
  amp('Jazz Clean', 'Roland "Jazz Chorus" solid state combo', [k('Volume'), sw('Bright'), k('Bass'), k('Middle'), k('Treble')]),
  amp('Emperor Clean', 'Matchless Chieftain 212 combo (clean)'),
  amp('Superstar Clean', 'Mesa/Boogie Lone Star (CH1)'),
  amp('Glacian Clean', 'Bogner Shiva 20th Anniversary (Ch1)', [...AMP_STD, sw('Bright')]),

  // amp: drive
  amp('Baseman Bright', "Fender '59 Bassman (bright channel)", AMP_VOL_OUT),
  amp('Voxy 30HW TB', 'VOX AC30HW (Top Boost channel)', [
    k('Volume'), k('Tone Cut'), k('Master'), k('Bass'), k('Treble'), ch('Char', 'Cool', 'Hot'),
  ]),
  amp('Emperor Drive', 'Matchless Chieftain 212 combo (dirty)'),
  amp('Superstar Drive', 'Mesa/Boogie Lone Star (CH2)', [k('Gain'), k('Drive'), k('Master'), k('Bass'), k('Middle'), k('Treble')]),
  amp('Marshell 45', 'Marshall JTM45 (normal channel)', AMP_VOL_OUT),
  amp('Marshell 45+', 'Marshall JTM45 (High Treble channel)', AMP_VOL_OUT),
  amp('Marshell 45 Jump', 'Marshall JTM45 ("Jump" connection)', AMP_GAIN_OUT),
  amp('Marshell 50', 'Marshall JMP50 (normal channel)', [k('Volume'), k('Presence'), k('Master'), k('Bass'), k('Middle'), k('Treble')]),
  amp('Marshell 50+', 'Marshall JMP50 (High Treble channel)', [k('Volume'), k('Presence'), k('Master'), k('Bass'), k('Middle'), k('Treble')]),
  amp('Marshell 50 Jump', 'Marshall JMP50 ("Jump" connection)', AMP_GAIN_OUT),
  amp('Hot Kitty Drive', 'Bad Cat Hot Cat 30 (drive channel)'),
  amp('Messe IIC+ 1', 'Mesa/Boogie Mark II C+ (Lead channel, switch combo 1)'),
  amp('Messe IIC+ 2', 'Mesa/Boogie Mark II C+ (Lead channel, switch combo 2)'),
  amp('Messe IIC+ 3', 'Mesa/Boogie Mark II C+ (Lead channel, switch combo 3)'),
  amp('Soloist 100 Crunch', 'Soldano SLO100 (normal channel, dirty)'),
  amp('Marshell 800', 'Marshall JCM800'),
  amp('Fryman B1', 'Friedman-style "Brown Eye" boutique head (BE channel, combo 1)'),
  amp('Fryman B2', 'Friedman-style "Brown Eye" boutique head (BE channel, combo 2)'),
  amp('Glacian Drive', 'Bogner Shiva 20th Anniversary (Ch2)'),

  // amp: high gain
  amp('Marshell 900', 'Marshall JCM900 (Model 4100, channel B)'),
  amp('Dizzle VH B', 'Diezel VH4 (CH3, blue version)'),
  amp('Dizzle VH S', 'Diezel VH4 (CH3, silver version)'),
  amp('Engle Saga 1', 'ENGL Savage 120 E610 (CH4, contour off)'),
  amp('Engle Saga 2', 'ENGL Savage 120 E610 (CH4, contour on)'),
  amp('Fryman HB', 'Friedman-style "Brown Eye" boutique head (HBE channel, combo 1)'),
  amp('Fryman HB+', 'Friedman-style "Brown Eye" boutique head (HBE channel, combo 2)'),
  amp('Eddie 51', 'Peavey 5150 (LEAD channel)'),
  amp('Soloist 100 Lead', 'Soldano SLO100 (overdrive channel)'),
  amp('Messe IV Lead 1', 'Mesa/Boogie Mark IV (Lead channel, switch combo 1)'),
  amp('Messe IV Lead 2', 'Mesa/Boogie Mark IV (Lead channel, switch combo 2)'),
  amp('Messe IV Lead 3', 'Mesa/Boogie Mark IV (Lead channel, switch combo 3)'),
  amp('Tangerine R100', 'Orange Rockerverb 100 (Dirty channel)', [k('Gain'), k('Master'), k('Bass'), k('Middle'), k('Treble')]),
  amp('Rector Dual V', 'Mesa/Boogie Dual Rectifier (CH3, vintage mode)'),
  amp('Rector Dual M', 'Mesa/Boogie Dual Rectifier (CH3, modern mode)'),
  amp('Dizzle VH+B', 'Diezel VH4 (CH4, blue version)'),
  amp('Dizzle VH+S', 'Diezel VH4 (CH4, silver version)'),
  amp('Boger XT Red M', 'Bogner Ecstasy ("Red" channel, modern mode)'),

  // amp: bass
  amp('Alchemy Pre', 'Alembic F-2B preamp', [k('Volume'), sw('Bright'), k('Bass'), k('Middle'), k('Treble')]),
  amp('Ampage Classic', 'Ampeg SVT bass amp', [
    k('Gain'), k('Bass'), k('Middle'), ch('Midrange', '220Hz', '450Hz', '800Hz', '1.6kHz', '3kHz'), k('Treble'), k('Master'),
  ]),
  amp('Ampage Flip', 'Ampeg B-15 "Flip Top" bass amp', [k('Volume'), k('Bass'), k('Treble')]),
  amp('Voxy Bass', 'VOX AC-100 bass amp', [k('Volume'), k('Bass'), k('Treble')]),
  amp('Messe Bass 400', 'Mesa/Boogie Bass 400', [k('Volume'), k('Master'), k('Bass'), k('Middle'), k('Treble')]),

  // amp: acoustic
  amp('Acoustic Preamp 1', 'AER Colourizer 2 acoustic preamp (EQ 90Hz-1.6kHz)', [
    k('Volume'), k('Tone'), k('Balance'), k('EQ Freq'), k('EQ Q'), free('EQ Gain'),
  ]),
  amp('Acoustic Preamp 2', 'AER Colourizer 2 acoustic preamp (EQ 680Hz-11kHz)', [
    k('Volume'), k('Tone'), k('Balance'), k('EQ Freq'), k('EQ Q'), free('EQ Gain'),
  ]),

  // nr module (same models as the fx gates)
  { name: 'Smart Gate', module: 'NR', category: 'gate', basedOn: 'ISP Decimator noise gate', params: [k('Threshold')] },
  { name: 'Fast Gate', module: 'NR', category: 'gate', basedOn: '2-mode noise gate with fast response', params: [k('Threshold'), ch('Mode', 'I', 'II')] },

  // cab: guitar
  cab('Super Zep 1x6', 'Supro 1x6" cabinet with oval speaker'),
  cab('Tweed Chap 1x8', 'Vintage Fender Champ 1x8" cabinet'),
  cab('Black Lux 1x12', 'Vintage Fender Deluxe 1x12" cabinet'),
  cab('Black Vint 1x12', 'Vintage Fender Vibrolux 1x12" cabinet'),
  cab('Glacian 1x12', 'Bogner Shiva 1x12" cabinet'),
  cab('Bad Kitty 1x12', 'Black Cat Hot Cat 1x12" cabinet'),
  cab('Voxy 1x12', 'Vintage VOX AC15 1x12" cabinet'),
  cab('Tweed Lux 1x12', 'Fender Tweed Deluxe 1x12" cabinet'),
  cab('Ace 20 1x12', 'Morgan AC-20 Deluxe 1x12" cabinet'),
  cab('UK G12M 1x12', 'Marshall 1x12" cabinet'),
  cab('Voxy 2x12', 'Vintage VOX AC30 2x12" cabinet'),
  cab('Emperor 2x12', 'Matchless Chieftain 2x12" cabinet'),
  cab('Jazz Twin 2x12', 'Roland "Jazz Chorus" 2x12" cabinet'),
  cab('Black Twin 2x12', "Vintage Fender '65 Twin Reverb 2x12\" cabinet"),
  cab('Tweed Super 2x10', 'Custom Fender Tweed 2x10" cabinet'),
  cab('Boutique 2x12', 'Unique custom 2x12" cabinet'),
  cab('Baseman 2x12', 'Vintage Fender "Piggyback" Bassman 2x12" cabinet'),
  cab('Superb 2x12', 'Supro 1624T 2x12" cabinet'),
  cab('Superstar 2x12', 'Mesa/Boogie Lonestar 2x12" cabinet'),
  cab('Twin Rock 2x12', 'Two-Rock 2x12" cabinet'),
  cab('Bluesky 2x12', 'Custom 2x12" cabinet with Celestion Alnico Blue speakers'),
  cab('Baseman 4x10', "Fender '59 Bassman 4x10\" cabinet"),
  cab('UK Lead 4x12', 'Marshall 1960AV 4x12" cabinet'),
  cab('UK Trad 2x12', '68 Marshall Basketweave 4x12" cabinet'),
  cab('UK Modern 4x12', 'Custom modified Marshall 4x12" cabinet'),
  cab('UK Green 4x12', 'Vintage Marshall 4x12" cabinet with Celestion Greenback speakers'),
  cab('Eddie 4x12', 'Peavey 6505 4x12" cabinet'),
  cab('Rector 4x12', 'Mesa/Boogie Rectifier 4x12" cabinet'),
  cab('Boger 4x12', 'Bogner 4x12" cabinet'),
  cab('Engle 4x12', 'ENGL 4x12" cabinet'),
  cab('Urban 4x12', 'Bogner Uberkab 4x12" cabinet'),
  cab('Soloist 4x12', 'Soldano 4x12" cabinet'),
  cab('Tang 4x12', 'Orange PPC412 4x12" cabinet'),
  cab('Hiway 4x12', 'Vintage Hiwatt SE4123 4x12" cabinet'),
  cab('UK Black 4x12', '1968 Marshall 4x12" cabinet'),
  cab('The Way 4x12', 'Vintage WEM 4x12" cabinet'),
  cab('Dizzle 4x12', 'Diezel 4x12" cabinet'),
  cab('Triple 4x12', 'Hughes & Kettner Triamp 4x12" cabinet'),
  cab('UK T75 4x12', 'Marshall 4x12" cabinet with Celestion G12T-75 speakers'),
  cab('US King 4x12', 'Mesa/Boogie Road King 4x12" cabinet'),

  // cab: bass
  cab('Adam 1x15', 'David Eden 1x15" bass cabinet'),
  cab('Worker 1x15', 'SWR 1x15" bass cabinet'),
  cab('Flip Top 1x15', 'Ampeg PF-115HE 1x15" bass cabinet'),
  cab('US Bass 2x10', 'Mesa/Boogie 2x10" bass cabinet'),
  cab('Mark 2x10', 'Mark Bass 4x10" bass cabinet'),
  cab('Adam 4x10', 'David Eden 4x10" bass cabinet'),
  cab('Ampage 4x10', 'Ampeg SVT-410HE 4x10" bass cabinet'),
  cab('Worker 4x10', "SWR Workingman's 4x10\" bass cabinet"),
  cab('Hacker 4x12', 'Hartke 4x12" bass cabinet'),
  cab('Ampage 8x10', 'Ampeg SVT-810E 8x10" bass cabinet'),

  // cab: acoustic ir
  cab('Dreadnought 1', 'Dreadnought guitar simulation 1'),
  cab('Dreadnought 2', 'Dreadnought guitar simulation 2'),
  cab('Orchestal', 'OM type acoustic guitar'),
  cab('Jumbo', 'Jumbo acoustic guitar'),
  cab('Hum Bird', 'Iconic "H-Bird" acoustic guitar'),
  cab('Auditorium', 'GA type acoustic guitar'),
  cab('Classical', 'Classical guitar'),
  cab('Mandolin', 'Mandolin'),
  cab('Fretless Bass', 'Fretless acoustic bass'),
  cab('Double Bass', 'Double bass'),
  cab('User IR', 'User IR slot 1-10 (third-party IR file)'),

  // eq
  eq('Guitar EQ 1', 'Guitar EQ (125Hz/400Hz/800Hz/1.6kHz/4kHz)', GTR_EQ(['125Hz', '400Hz', '800Hz', '1.6kHz', '4kHz'])),
  eq('Guitar EQ 2', 'Guitar EQ (100Hz/500Hz/1kHz/3kHz/6kHz)', GTR_EQ(['100Hz', '500Hz', '1kHz', '3kHz', '6kHz'])),
  eq('Bass EQ 1', 'Bass EQ (50Hz/120Hz/400Hz/800Hz/4.5kHz)', GTR_EQ(['50Hz', '120Hz', '400Hz', '800Hz', '4.5kHz'])),
  eq('Bass EQ 2', 'Bass EQ (125Hz/400Hz/800Hz/1.6kHz/4kHz)', GTR_EQ(['125Hz', '400Hz', '800Hz', '1.6kHz', '4kHz'])),
  eq('Para EQ', '4-band parametric EQ with low/high shelving', [
    free('Band 1'), free('Q 1'), k('Gain 1', -12, 12, 'dB'),
    free('Band 2'), free('Q 2'), k('Gain 2', -12, 12, 'dB'),
    free('Band 3'), free('Q 3'), k('Gain 3', -12, 12, 'dB'),
    free('Band 4'), free('Q 4'), k('Gain 4', -12, 12, 'dB'),
    k('Lo Shelf', -12, 12, 'dB'), k('Hi Shelf', -12, 12, 'dB'), free('Volume'),
  ]),
  eq('Graphic EQ', '10-band graphic EQ', [
    ...['31Hz', '63Hz', '125Hz', '250Hz', '500Hz', '1kHz', '2kHz', '4kHz', '8kHz', '16kHz'].map((b) => k(b, -12, 12, 'dB')),
    k('Volume'),
  ]),
  // manual prints the top band as "6.6Hz"; the gp-200 and the device label it 6.6kHz
  eq('V-EQ', 'Mesa/Boogie amps 5-band EQ', ['80Hz', '240Hz', '750Hz', '2.2kHz', '6.6kHz'].map((b) => k(b, -50, 50))),

  // delay
  dly('Sweetie', 'Classic 3-knob BBD analog delay with "REPEAT RATE" control'),
  dly('Recaller', 'Electro-Harmonix Deluxe Memory Man'),
  dly('Pure Eko', 'Pure, precise delay'),
  dly('Analog Eko', 'Warm delay with analog feel'),
  dly('Mag Eko', 'Solid-state tape echo'),
  dly('Tube Eko', 'Tube-driven tape echo'),
  dly('Backmask', 'Delay with reversed feedback'),
  dly('Ping Pong', 'Stereo ping-pong delay'),
  dly('Multi Head', 'Multi-tap delay simulating a 4-head tape echo', [
    k('Mix'), k('Feedback'), k('Time', 20, 4000, 'ms'), k('Tone'), k('Mode', 1, 12), sw('Sync'), sw('Trail'),
  ]),
  dly('Slapback', 'Classic slapback echo', [k('Mix'), k('Feedback'), k('Time', 20, 300, 'ms'), sw('Trail')]),
  dly('Vintage Rack', "Vintage 1980's rack-mount delay", [
    k('Mix'), k('Feedback'), k('Time', 20, 4000, 'ms'), k('Mod'), k('Tone'), sw('Sync'), sw('Trail'),
  ]),
  dly('Sweep Eko', 'Delay with sweeping-filter repeats', [
    k('Mix'), k('Feedback'), k('Time', 20, 4000, 'ms'), k('Sweep Depth'), k('Sweep Rate'), sw('Swp Sync'), sw('Time Sync'), sw('Trail'),
  ]),
  dly('Trem Eko', 'Delay with tremolo repeats', [
    k('Mix'), k('Feedback'), k('Time', 20, 4000, 'ms'), k('Trem Depth'), k('Trem Rate'), sw('Trem Sync'), sw('Time Sync'), sw('Trail'),
  ]),
  dly('Lofi Eko', "Delay with lo-fi'd repeats", [
    k('Mix'), k('Feedback'), k('Time', 20, 4000, 'ms'), k('Bit'), k('Krush'), sw('Sync'), sw('Trail'),
  ]),
  dly('Ring Eko', 'Delay with ring-modulated repeats', [
    k('Dly Mix'), k('Feedback'), k('Time', 20, 4000, 'ms'), k('Ring Mix'), k('Freq'), k('Tone'), sw('Sync'), sw('Trail'),
  ]),
  dly('Ekoverb', 'Delay + reverb in one', [
    k('Dly Mix'), k('Feedback'), k('Time', 20, 4000, 'ms'), k('Rvb Mix'), k('Hi Cut'), k('Decay'), sw('Sync'), sw('Trail'),
  ]),

  // reverb
  rvb('Room', 'Room reverb', [k('Mix'), k('Pre Delay', 0, 100, 'ms'), k('Decay'), sw('Trail')]),
  rvb('Hall', 'Performance hall reverb', [k('Mix'), k('Pre Delay', 0, 100, 'ms'), k('Decay'), sw('Trail')]),
  rvb('Church', 'Church reverb', [k('Mix'), k('Pre Delay', 0, 100, 'ms'), k('Decay'), sw('Trail')]),
  rvb('Plate', 'Vintage plate reverb', [k('Mix'), k('Decay'), k('High Damp'), sw('Trail')]),
  rvb('Spring', 'Vintage spring reverb', [k('Mix'), k('Decay'), k('Tone'), sw('Trail')]),
  rvb('Izumi', 'Liquid-like decays with deep low end', [k('Mix'), k('Decay'), sw('Trail')]),
  rvb('Northstar', 'Lush, bright decays', [k('Mix'), k('Decay'), sw('Trail')]),
  rvb('Oceandeep', 'Huge, deep decays', [k('Mix'), k('Decay'), sw('Trail')]),
  rvb('Sweet Space', 'Lush modulated reverb', [
    k('Mix'), k('Pre Delay', 0, 100, 'ms'), k('Decay'), k('Lo End', -50, 50), k('Hi End', -50, 50), sw('Trail'),
  ]),
  rvb('Shimmer', 'Rich shimmering reverb', [
    k('Mix'), k('Pre Delay', 0, 100, 'ms'), k('Decay'), k('Lo End', -50, 50), k('Hi End', -50, 50), sw('Trail'),
  ]),
];

// look up a model by module + name (names repeat across fx and nr)
export function findAmperoModel(name: string, module?: AmperoModule): AmperoModel | undefined {
  return AMPERO_MINI_MODELS.find((m) => m.name === name && (!module || m.module === module));
}
