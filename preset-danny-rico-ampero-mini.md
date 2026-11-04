# Preset Danny Rico: GP-200LT → Ampero Mini

Nilai di bawah ini hasil decode langsung dari file `.prst`. Nama model Ampero Mini diambil dari manual resmi Hotone (firmware V1.0).
Blok yang **off** di preset GP-200 tidak dimasukkan. Volume module GP-200 = 100 di semua preset, jadi diabaikan saja.

Catatan umum:
- Knob "Volume" di amp GP-200 = **Master** di Ampero.
- Skala Low Cut / High Cut di cab beda unit. High Cut di GP-200 = 20001, artinya **off** (buka penuh).
- Setelah dimasukkan, samakan level antar-preset pakai Master atau patch volume. Algoritma kedua device beda, jadi loudness pasti nggak sama persis.

---

## 28-A — clean delay aja

| Urutan | GP-200 | Ampero Mini | Setting |
|---|---|---|---|
| FX1 | COMP (Ross) | **Comprosso** | Sustain 0, Output 80 |
| AMP | Dark Twin ('65 Twin) | **Black Twin** | Gain 46, Master 61, Bass 40, Middle 62, Treble 75, Bright ON |
| NR | Gate 1 (Decimator) | **Smart Gate** | Threshold 20 |
| CAB | TWD CP (Champ 1x8) | **Tweed Chap 1x8** | Volume 90, Low Cut minimum, High Cut off |
| DLY | Analog | **Analog Eko** | Mix 20, Time 500 ms, Feedback 32, Sync OFF, Trail OFF |
| RVB | Spring | **Spring** | Mix 30, Decay 50, Tone 50, Trail OFF |

## 28-B — crunch

| Urutan | GP-200 | Ampero Mini | Setting |
|---|---|---|---|
| DRV | OD 9 (TS9) | **Green Drive** (TS-808) | Gain 0, Tone 70, Volume 50 |
| AMP | UK 800 (JCM800) | **Marshell 800** | Gain 50, Presence 50, Master 80, Bass 60, Middle 60, Treble 50 |
| NR | Gate 1 | **Smart Gate** | Threshold 30 |
| CAB | UK LD (1960AV 4x12) | **UK Lead 4x12** | Volume 70, Low Cut ±80 Hz, High Cut off |
| DLY | Vintage Rack | **Vintage Rack** | Mix 15, Feedback 4, Mod 50, Tone 50, **Sync ON** (time ikut tap tempo), Trail OFF |
| RVB | Plate | **Plate** | Mix 20, Decay 50, High Damp 50, Trail OFF |

> OD-nya dipakai sebagai "tightener" (Gain 0). Ini trik klasik TS + Marshall.

## 28-C — lead delay

| Urutan | GP-200 | Ampero Mini | Setting |
|---|---|---|---|
| FX1 | Boost (EP Booster) | **Enhancer** | Volume 20, +3dB ON, Bright ON |
| DRV | Scream OD | **Screamood** | Gain 10, Tone 55, Volume 50, Fat ON, Air ON |
| AMP | Mess DualV (Rectifier vintage) | **Rector Dual V** | Gain 50, Presence 70, Master 70, Bass 50, Middle 50, Treble 50 |
| NR | Gate 1 | **Smart Gate** | Threshold 35 |
| CAB | Mess (Rectifier 4x12) | **Rector 4x12** | Volume 100, Low Cut ±80 Hz, High Cut off |
| EQ | Mess EQ | **V-EQ** (skala sama, -50~+50) | 80Hz -4, 240Hz -7, 750Hz +6, 2.2kHz +15, 6.6kHz +22 |
| DLY | Vintage Rack | **Vintage Rack** | Mix 15, Feedback 4, Mod 50, Tone 50, **Sync ON**, Trail OFF |
| RVB | Plate | **Plate** | Mix 30, Decay 25, High Damp 50, Trail OFF |

## 28-D — shimmer tekiwir

Base-nya sama dengan 28-A (Comprosso → Black Twin → Smart Gate 20 → Tweed Chap 1x8), bedanya di amp, delay, dan reverb.

| Urutan | GP-200 | Ampero Mini | Setting |
|---|---|---|---|
| FX1 | COMP | **Comprosso** | Sustain 0, Output 80 |
| AMP | Dark Twin | **Black Twin** | Gain 59, Master 49, Bass 40, Middle 62, Treble 75, Bright ON |
| NR | Gate 1 | **Smart Gate** | Threshold 20 |
| CAB | TWD CP | **Tweed Chap 1x8** | Volume 90, Low Cut minimum, High Cut off |
| DLY | Ambience 1 (multi-tap) | **Pure Eko** *(pengganti, multi-tap nggak ada)* | Mix 14, Time 500 ms, Feedback 50, Sync OFF |
| RVB | Arena | **Hall** *(atau Church)* | Mix 44, Pre Delay 100 ms, Decay 70, Trail OFF |

> Walaupun namanya "shimmer", preset aslinya **nggak pakai shimmer**. Isinya multi-tap delay + reverb Arena dengan pre-delay panjang.
> Kalau mau shimmer beneran, Ampero punya reverb **Shimmer**: coba Mix ±35, Decay ±70.

## 29-A — octavianti

Rig-nya sama dengan 28-C (Screamood → Rector Dual V → Rector 4x12 → V-EQ), ditambah octaver. Delay dan reverb **off**, Boost diganti OCTA.

| Urutan | GP-200 | Ampero Mini | Setting |
|---|---|---|---|
| FX1 | OCTA | **Clean Octa** | Low Oct 30, High Oct 0, Dry 50 |
| DRV | Scream OD | **Screamood** | Gain 10, Tone 55, Volume 50, Fat ON, Air ON |
| AMP | Mess DualV | **Rector Dual V** | Gain 50, Presence 70, Master 70, Bass 50, Middle 50, Treble 50 |
| NR | Gate 1 | **Smart Gate** | Threshold 35 |
| CAB | Mess | **Rector 4x12** | Volume 100, Low Cut ±80 Hz, High Cut off |
| EQ | Mess EQ | **V-EQ** | 80Hz -4, 240Hz -7, 750Hz +6, 2.2kHz +15, 6.6kHz +22 |
