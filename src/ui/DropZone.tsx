// drag-and-drop area plus file/folder pickers for .prst presets
import { useRef, useState, type DragEvent } from 'react';
import { filesFromDrop, filesFromList } from './loadFiles';

interface Props {
  onFiles: (files: File[]) => void;
  compact?: boolean;
}

export function DropZone({ onFiles, compact }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [skipped, setSkipped] = useState(false);

  // hand matching files to the parent, flag drops that had none
  const deliver = (files: File[]) => {
    setSkipped(files.length === 0);
    if (files.length) onFiles(files);
  };

  // drop handler expands folders
  const onDrop = async (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    deliver(await filesFromDrop(e.dataTransfer));
  };

  return (
    <div
      className={`dropzone${over ? ' is-over' : ''}${compact ? ' is-compact' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
    >
      {!compact && (
        <>
          <p className="dropzone-title">Taruh file .prst GP-200 di sini</p>
          <p className="dropzone-sub">Bisa banyak file sekaligus, atau satu folder. File diproses di browser ini saja, tidak di-upload.</p>
        </>
      )}
      <div className="dropzone-actions">
        <button type="button" className="btn btn-primary" onClick={() => fileInput.current?.click()}>
          {compact ? 'Tambah file' : 'Pilih file'}
        </button>
        <button type="button" className="btn" onClick={() => folderInput.current?.click()}>
          Pilih folder
        </button>
      </div>
      {skipped && <p className="dropzone-warn">Tidak ada file .prst di situ.</p>}

      {/* hidden native pickers */}
      <input
        ref={fileInput}
        type="file"
        accept=".prst"
        multiple
        hidden
        onChange={(e) => {
          deliver(filesFromList(e.target.files));
          e.target.value = '';
        }}
      />
      <input
        ref={folderInput}
        type="file"
        hidden
        // non-standard attribute for folder picking
        {...{ webkitdirectory: '' }}
        onChange={(e) => {
          deliver(filesFromList(e.target.files));
          e.target.value = '';
        }}
      />
    </div>
  );
}
