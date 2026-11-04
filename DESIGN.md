# Patchlingo — Design v0.1

Web app untuk menerjemahkan preset multi-efek dari satu device ke device lain.
Versi pertama: **Valeton GP-200 (`.prst`) → panduan setting Hotone Ampero Mini**.

## Keputusan yang sudah diambil

| Topik | Keputusan |
|---|---|
| Bentuk | Web app statis. Semua proses jalan di browser, file preset tidak di-upload ke server mana pun. |
| Output | Panduan setting: tabel blok + nilai knob, untuk dimasukkan manual di Ampero. |
| Scope awal | Satu arah: GP-200 → Ampero Mini. |
| Lisensi | GPL-3.0. Tabel ID efek GP-200 diambil dari [Preset Forge](https://github.com/phash/gp200editor), dengan kredit. |

## Alur pengguna

1. Drag-drop satu atau beberapa file `.prst` (bisa sekaligus satu folder).
2. App langsung menampilkan, untuk tiap preset:
   - signal chain asli GP-200 (blok aktif saja, blok off bisa ditampilkan dengan toggle);
   - padanan di Ampero Mini: nama model + nilai tiap knob;
   - badge kualitas padanan: **exact** (model sama), **close** (gear asli sama, algoritma beda), **substitute** (tidak ada padanan, diganti yang paling mirip), lengkap dengan catatan.
3. Export: copy sebagai teks, download Markdown, atau print/PDF untuk ditaruh di samping pedalboard.

## Arsitektur

```
.prst bytes
   │  decoders/gp200.ts         parse biner → GP200Preset
   ▼
GP200Preset
   │  toRig()                   normalisasi ke model netral
   ▼
Rig  (device-agnostic)
   │  mappers/gp200-ampero.ts   cari padanan + transformasi nilai
   ▼
TargetPatch (Ampero Mini)
   │  render/                   tabel UI, Markdown, print
   ▼
Panduan setting
```

Dibuat berlapis seperti ini supaya nanti, kalau mau tambah device lain, cukup menambah decoder baru atau mapper baru. Bagian lainnya tidak perlu diubah.

### 1. Decoder GP-200

Format file yang sudah dipastikan dari 5 preset Danny Rico:

- Ukuran 1224 byte. Magic `TSRP`, device `2-PG`.
- Nama preset ada di offset `0x44`, panjang 16 byte.
- Mulai offset `0xA0` ada 11 blok efek, masing-masing 72 byte, dengan isi:
  - marker `14 00 44 00`
  - slot (1 byte), aktif (1 byte)
  - effect code: uint32 LE, high byte = modul
  - 15 parameter float32
- Checksum ada di 2 byte terakhir: `sum(bytes[0:0x4C6]) & 0xFFFF`, disimpan BE16.

**Toleransi file rusak.** Slot parameter yang tidak dipakai bisa berisi sisa byte acak, seperti teks `valeton.net/download.html` di preset Danny Rico. Checksum-nya valid, jadi teks itu memang ikut tersimpan dari device. Decoder hanya membaca parameter yang didefinisikan efeknya, dan tetap jalan selama marker blok utuh. Kalau checksum tidak cocok, tampilkan peringatan dan jangan gagalkan prosesnya. Parameter di luar range definisinya diabaikan dan ditandai.

### 2. Model netral (`Rig`)

```ts
// device-agnostic representation of a preset
type Rig = {
  name: string;
  blocks: Block[];        // urut sesuai signal chain
  warnings: string[];
};

type Block = {
  category: 'dynamics' | 'boost' | 'drive' | 'wah' | 'amp' | 'gate' | 'cab'
          | 'eq' | 'pitch' | 'mod' | 'delay' | 'reverb' | 'volume';
  enabled: boolean;
  sourceModel: string;    // "Dark Twin"
  realGear?: string;      // "Fender '65 Twin Reverb", kunci utama pencocokan
  params: Record<string, number | boolean | string>;
};
```

### 3. Mapping GP-200 → Ampero Mini

Data mapping disimpan sebagai **file data**, bukan logika di kode, supaya gampang dikoreksi:

```ts
// one entry per gp-200 effect code
{
  from: 0x07000004,               // Dark Twin
  to: 'Black Twin',
  match: 'close',
  params: {
    Gain: 'Gain',
    Volume: 'Master',             // rename
    Bass: 'Bass', Middle: 'Middle', Treble: 'Treble', Bright: 'Bright',
  },
  notes?: string,
}
```

Untuk efek GP-200 yang belum punya entri mapping, ada fallback otomatis:

1. Cari model Ampero dengan `realGear` yang sama.
2. Kalau tidak ada, ambil model pertama di kategori yang sama, tandai **substitute**, lalu salin nilai parameter yang namanya sama.

**Transformasi nilai** yang sudah ketahuan perlu:

- Amp: `Volume` → `Master`.
- Cab: High Cut 20001 → "off". Low Cut perlu skala ke Hz Ampero (masih diteliti).
- Delay dengan Sync ON → tampilkan "ikut tap tempo", bukan angka ms.
- Boost EP: `Gain` di GP-200 → `Volume` di Enhancer.

### 4. Data yang perlu dikumpulkan

| Data | Sumber | Status |
|---|---|---|
| ID efek + definisi parameter GP-200 (305 efek) | Preset Forge `effectNames.ts`, `effectParams.ts`, `effectDescriptions.ts` | ada, tinggal di-vendor |
| Daftar model Ampero Mini + parameter + gear asli | Manual resmi Hotone (PDF, firmware V1.0) | ada: `src/core/devices/amperoMini/catalog.ts` |
| Tabel mapping | Dikurasi manual dari deskripsi gear kedua device | ada: `src/core/mappers/gp200ToAmperoMini.table.ts`, hampir semua efek GP-200 |

## Stack

- **Vite + React + TypeScript**: build statis, bisa di-host gratis (GitHub Pages / Cloudflare Pages).
- **Vitest** untuk unit test.
- Tanpa backend, tanpa database.

## Testing

- Unit test decoder pakai 5 file preset Danny Rico sebagai fixture. Hasil yang diharapkan = tabel di `preset-danny-rico-ampero-mini.md`.
- Test toleransi: file dengan checksum salah, file terpotong, dan file berisi teks nyasar.
- Snapshot test hasil render Markdown.

> Sebelum fixture preset Danny Rico di-commit ke repo publik, pastikan boleh dibagikan. Kalau tidak boleh, simpan di folder yang di-gitignore.

## Milestone

1. ✅ **M1 — Core**: decoder GP-200 + model `Rig` + test pakai 5 fixture.
2. ✅ **M2 — Mapping**: ekstrak daftar model Ampero dari manual, isi tabel mapping untuk efek-efek yang umum dipakai (amp, cab, drive, delay, reverb), lalu fallback otomatis.
3. ✅ **M3 — Web UI**: drag-drop, tampilan per preset, badge kualitas padanan, export Markdown/print.
4. ✅ **M4 — Polish**: dark mode, tampilan mobile (buat dibuka di HP di samping pedalboard), workflow deploy GitHub Pages. Tinggal publish repo-nya.

## Di luar scope v1

- Generate file preset Ampero Mini secara langsung (format filenya belum diketahui).
- Arah sebaliknya (Ampero → GP-200) dan device lain.
- Kirim preset langsung ke device lewat USB/MIDI.
