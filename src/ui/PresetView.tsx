// one translated preset: chain of ampero blocks with settings, badges and notes
import { MATCH_HINT, MATCH_LABEL, type MatchLevel, type TargetBlock } from '../core';
import type { LoadedPreset } from './loadFiles';

// colored match badge
export function MatchBadge({ match, auto }: { match: MatchLevel; auto?: boolean }) {
  return (
    <span className={`badge badge-${match}`} title={MATCH_HINT[match]}>
      {MATCH_LABEL[match]}
      {auto ? ' · otomatis' : ''}
    </span>
  );
}

// a single block card
function BlockCard({ block, showDefaults }: { block: TargetBlock; showDefaults: boolean }) {
  const params = block.params.filter((p) => showDefaults || p.from !== 'default');
  const paramNotes = block.params.filter((p) => p.from !== 'default' && p.note);
  return (
    <li className={`block block-${block.match}`}>
      <div className="block-module">{block.module ?? '—'}</div>
      <div className="block-body">
        <div className="block-head">
          <span className="block-target">{block.model ?? 'Tidak ada padanan'}</span>
          <MatchBadge match={block.match} auto={block.auto} />
        </div>
        <div className="block-source">
          dari <strong>{block.source.sourceModel}</strong>
          {block.source.realGear ? ` · ${block.source.realGear}` : ''}
        </div>

        {/* knob values */}
        {params.length > 0 && (
          <ul className="params">
            {params.map((p) => (
              <li
                key={p.name}
                className={`param param-${p.from}`}
                title={p.sourceParam ? `Dari knob "${p.sourceParam}" di GP-200` : undefined}
              >
                <span className="param-name">{p.name}</span>
                <span className="param-value">{p.display}</span>
              </li>
            ))}
          </ul>
        )}

        {/* notes from the mapping and per-param conversions */}
        {(block.notes.length > 0 || paramNotes.length > 0) && (
          <ul className="notes">
            {paramNotes.map((p) => (
              <li key={p.name}>
                <strong>{p.name}:</strong> {p.note}
              </li>
            ))}
            {block.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

interface Props {
  preset: LoadedPreset;
  showDefaults: boolean;
  showBypassed: boolean;
}

export function PresetView({ preset, showDefaults, showBypassed }: Props) {
  // unreadable file
  if (!preset.patch || !preset.rig) {
    return (
      <section className="preset">
        <h2 className="preset-title">{preset.fileName}</h2>
        <p className="alert alert-error">File ini tidak bisa dibaca: {preset.error}</p>
      </section>
    );
  }

  const { patch, rig } = preset;
  const counts = patch.blocks.reduce<Record<string, number>>((acc, b) => ({ ...acc, [b.match]: (acc[b.match] ?? 0) + 1 }), {});

  return (
    <section className="preset">
      <header className="preset-header">
        <div>
          <h2 className="preset-title">{patch.name || preset.fileName}</h2>
          <p className="preset-file">{preset.fileName} · GP-200 → Ampero Mini</p>
        </div>
        <div className="preset-summary">
          {(['exact', 'close', 'substitute', 'none'] as const)
            .filter((m) => counts[m])
            .map((m) => (
              <span key={m} className={`badge badge-${m}`}>
                {counts[m]} {MATCH_LABEL[m]}
              </span>
            ))}
        </div>
      </header>

      {/* file-level warnings and patch-level notes */}
      {rig.warnings.map((w) => (
        <p key={w} className="alert alert-warn">{w}</p>
      ))}
      {patch.notes.map((n) => (
        <p key={n} className="alert alert-info">{n}</p>
      ))}

      <ol className="chain">
        {patch.blocks.map((b, i) => (
          <BlockCard key={`${i}-${b.source.sourceModel}`} block={b} showDefaults={showDefaults} />
        ))}
      </ol>

      {/* blocks that were off in the original preset */}
      {showBypassed && patch.bypassed.length > 0 && (
        <div className="bypassed">
          <h3>Blok yang off di preset asli</h3>
          <p>{patch.bypassed.map((b) => b.sourceModel).join(' · ')}</p>
        </div>
      )}
    </section>
  );
}
