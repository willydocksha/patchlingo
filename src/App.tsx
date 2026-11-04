// app shell: load presets, pick one, view and export the ampero mini guide
import { useMemo, useState } from 'react';
import { patchesToMarkdown } from './core';
import { DropZone } from './ui/DropZone';
import { loadPreset, sortByName, type LoadedPreset } from './ui/loadFiles';
import { PresetView } from './ui/PresetView';
import { ThemeToggle } from './ui/ThemeToggle';
import './styles.css';

// trigger a browser download of text content
function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown;charset=utf-8' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  a.click();
  URL.revokeObjectURL(url);
}

export function App() {
  const [presets, setPresets] = useState<LoadedPreset[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDefaults, setShowDefaults] = useState(false);
  const [showBypassed, setShowBypassed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  // decode new files, replacing earlier copies of the same file name
  const addFiles = async (files: File[]) => {
    setLoading(true);
    const loaded = await Promise.all(files.map(loadPreset));
    setPresets((prev) => {
      const names = new Set(loaded.map((p) => p.fileName));
      return sortByName([...prev.filter((p) => !names.has(p.fileName)), ...loaded]);
    });
    setSelectedId((cur) => cur ?? sortByName(loaded)[0]?.id ?? null);
    setLoading(false);
  };

  // remove one preset and keep a sensible selection
  const remove = (id: string) => {
    setPresets((prev) => {
      const next = prev.filter((p) => p.id !== id);
      if (selectedId === id) setSelectedId(next[0]?.id ?? null);
      return next;
    });
  };

  const selected = presets.find((p) => p.id === selectedId) ?? presets[0];
  const readable = useMemo(() => presets.filter((p) => p.patch), [presets]);

  // markdown for every readable preset
  const markdown = useMemo(
    () => patchesToMarkdown(readable.map((p) => ({ patch: p.patch!, fileName: p.fileName }))),
    [readable],
  );

  // copy markdown to the clipboard with brief feedback
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      download('patchlingo-ampero-mini.md', markdown);
    }
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-name">Patchlingo</span>
          <span className="brand-sub">Valeton GP-200 → Hotone Ampero Mini</span>
        </div>
        <div className="topbar-actions">
          <ThemeToggle />
          {readable.length > 0 && (
            <>
            <button type="button" className="btn" onClick={copy}>
              {copied ? 'Tersalin ✓' : 'Salin Markdown'}
            </button>
            <button type="button" className="btn" onClick={() => download('patchlingo-ampero-mini.md', markdown)}>
              Unduh .md
            </button>
            <button type="button" className="btn" onClick={() => window.print()}>
              Print
            </button>
            </>
          )}
        </div>
      </header>

      {presets.length === 0 ? (
        // empty state
        <main className="empty">
          <DropZone onFiles={addFiles} />
          {loading && <p className="muted">Membaca file…</p>}
          <section className="explain">
            <h2>Cara kerjanya</h2>
            <ol>
              <li>Patchlingo membaca blok efek dan nilai knob dari file preset GP-200.</li>
              <li>Tiap blok dicarikan model Ampero Mini yang meniru gear asli yang sama.</li>
              <li>Hasilnya panduan setting untuk dimasukkan manual di Ampero Mini.</li>
            </ol>
            <p className="legend">
              <span className="badge badge-exact">Sama</span> gear dan knob sama ·{' '}
              <span className="badge badge-close">Mirip</span> gear sama, knob/voicing beda ·{' '}
              <span className="badge badge-substitute">Pengganti</span> model paling mirip ·{' '}
              <span className="badge badge-none">Tidak ada</span> tidak ada padanan
            </p>
          </section>
        </main>
      ) : (
        <div className="workspace">
          {/* preset list */}
          <aside className="sidebar">
            <DropZone onFiles={addFiles} compact />
            <ul className="preset-list">
              {presets.map((p) => (
                <li key={p.id} className={p.id === selected?.id ? 'is-active' : ''}>
                  <button type="button" className="preset-pick" onClick={() => setSelectedId(p.id)}>
                    <span className="preset-pick-name">{p.patch?.name || p.fileName}</span>
                    <span className="preset-pick-file">{p.error ? 'tidak terbaca' : p.fileName}</span>
                  </button>
                  <button type="button" className="icon-btn" aria-label={`Hapus ${p.fileName}`} onClick={() => remove(p.id)}>
                    ×
                  </button>
                </li>
              ))}
            </ul>
            <div className="toggles">
              <label>
                <input type="checkbox" checked={showDefaults} onChange={(e) => setShowDefaults(e.target.checked)} /> Tampilkan knob default
              </label>
              <label>
                <input type="checkbox" checked={showBypassed} onChange={(e) => setShowBypassed(e.target.checked)} /> Tampilkan blok yang off
              </label>
              <button type="button" className="btn btn-ghost" onClick={() => setPresets([])}>
                Hapus semua
              </button>
            </div>
          </aside>

          {/* selected preset on screen */}
          <main className="detail screen-only">
            {selected && <PresetView preset={selected} showDefaults={showDefaults} showBypassed={showBypassed} />}
          </main>

          {/* every preset when printing */}
          <div className="print-only">
            {presets.map((p) => (
              <PresetView key={p.id} preset={p} showDefaults={false} showBypassed={false} />
            ))}
          </div>
        </div>
      )}

      <footer className="footer">
        Nilai adalah titik awal: sesuaikan level dan EQ pakai telinga. Data efek GP-200 dari{' '}
        <a href="https://github.com/phash/gp200editor" target="_blank" rel="noreferrer">Preset Forge</a> (GPL-3.0).
      </footer>
    </div>
  );
}
