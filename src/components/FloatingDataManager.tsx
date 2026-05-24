import { useMemo, useState } from 'react';
import {
  Braces,
  Database,
  Edit3,
  Plus,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import type { DbCatalog, Document } from '../types/explorer';
import { cn } from '../utils/cn';

const styles = {
  wrapper: 'fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3',
  toggle: 'rounded-full border border-emerald-500/50 bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(16,185,129,0.2)] transition hover:scale-[1.02]',
  panel: 'w-[360px] max-w-[90vw] rounded-[16px] border border-slate-200 bg-white/95 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.14)] backdrop-blur',
  section: 'rounded-[12px] border border-slate-200 bg-slate-50 p-3',
  sectionTitle: 'text-xs font-semibold uppercase tracking-[0.2em] text-slate-500',
  input: 'flex-1 rounded-[10px] border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-400/60 focus:outline-none',
  chip: 'rounded-full border px-3 py-1 text-xs transition',
  chipActive: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700',
  chipInactive: 'border-slate-200 bg-white text-slate-600 hover:border-emerald-400/40 hover:text-emerald-700',
  action: 'rounded-[10px] border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 transition hover:scale-[1.02]',
  ghost: 'text-xs text-slate-500 hover:text-rose-500',
};

interface FloatingDataManagerProps {
  isOpen: boolean;
  onToggle: () => void;
  catalogs: DbCatalog[];
  activeDatabase: string | null;
  activeCollection: string | null;
  documents: Document[];
  onSelectDatabase: (database: string) => void;
  onSelectCollection: (collection: string) => void;
  onAddDatabase: (name: string) => void;
  onRemoveDatabase: (name: string) => void;
  onAddCollection: (database: string, name: string) => void;
  onRemoveCollection: (database: string, name: string) => void;
  onImportJson: (text: string) => void;
}

const getDocId = (doc: Document) => {
  const raw = doc._id;
  if (typeof raw === 'string' || typeof raw === 'number') return String(raw);
  if (raw && typeof raw === 'object' && 'toString' in raw) return String(raw);
  return '';
};

export function FloatingDataManager({
  isOpen,
  onToggle,
  catalogs,
  activeDatabase,
  activeCollection,
  onSelectDatabase,
  onSelectCollection,
  onAddDatabase,
  onRemoveDatabase,
  onAddCollection,
  onRemoveCollection,
  documents,
  onImportJson,
}: FloatingDataManagerProps) {
  const [localDatabase, setLocalDatabase] = useState('');
  const [localCollection, setLocalCollection] = useState('');
  const [importText, setImportText] = useState('');

  const activeDbEntry = useMemo(
    () => catalogs.find((entry) => entry.database === activeDatabase),
    [catalogs, activeDatabase]
  );

  const handleLoadActiveDocument = () => {
    // keep placeholder compatibility (no-op)
    return;
  };

  return (
    <div className={styles.wrapper}>
      <button type="button" onClick={onToggle} className={styles.toggle}>
        {isOpen ? 'Hide manager' : 'Open manager'}
      </button>
      {isOpen ? (
        <div className={styles.panel}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-900">Floating Data Manager</div>
              <div className="text-xs text-slate-500">Inject JSON and edit mock documents.</div>
            </div>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              Live
            </span>
          </div>

          <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Database</div>
              <div className="mt-2 flex flex-wrap gap-1">
                {catalogs.map((catalog) => (
                  <div key={catalog.database} className="flex">
                    <button
                      type="button"
                      onClick={() => onSelectDatabase(catalog.database)}
                      className={cn(
                        styles.chip,
                        'rounded-l-full',
                        activeDatabase === catalog.database ? styles.chipActive : styles.chipInactive
                      )}
                    >
                      <Database className="mr-1 inline h-3 w-3" />
                      {catalog.database}
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveDatabase(catalog.database)}
                      className="rounded-r-full border border-slate-200 bg-white px-2 text-xs text-slate-600 transition hover:border-emerald-400/40 hover:text-emerald-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  value={localDatabase}
                  onChange={(event) => setLocalDatabase(event.target.value)}
                  placeholder="new-database"
                  className={styles.input}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      onAddDatabase(localDatabase);
                      setLocalDatabase('');
                    }
                  }}
                />
                <button
                  type="button"
                  className={styles.action}
                  onClick={() => {
                    onAddDatabase(localDatabase);
                    setLocalDatabase('');
                  }}
                >
                  <Plus className="mr-1 inline h-3 w-3" />
                  Add
                </button>
              </div>
            </div>
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Collections</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {activeDbEntry?.collections.map((entry) => (
                  <button
                    key={entry.collection.name}
                    type="button"
                    onClick={() => onSelectCollection(entry.collection.name)}
                    className={cn(
                      styles.chip,
                      activeCollection === entry.collection.name ? styles.chipActive : styles.chipInactive
                    )}
                  >
                    {entry.collection.name}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {activeDbEntry?.collections.map((entry) => (
                  <button
                    key={`${entry.collection.name}-remove`}
                    type="button"
                    onClick={() => onRemoveCollection(activeDatabase ?? '', entry.collection.name)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 transition hover:border-emerald-400/40 hover:text-emerald-700"
                  >
                    Remove {entry.collection.name}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  value={localCollection}
                  onChange={(event) => setLocalCollection(event.target.value)}
                  placeholder="new-collection"
                  className={styles.input}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && activeDatabase) {
                      onAddCollection(activeDatabase, localCollection);
                      setLocalCollection('');
                    }
                  }}
                />
                <button
                  type="button"
                  className={styles.action}
                  onClick={() => {
                    if (!activeDatabase) return;
                    onAddCollection(activeDatabase, localCollection);
                    setLocalCollection('');
                  }}
                >
                  <Plus className="mr-1 inline h-3 w-3" />
                  Add
                </button>
              </div>
            </div>
            <div className={styles.section}>
              <div className="flex items-center justify-between">
                <div className={styles.sectionTitle}>Import / Export</div>
                <div className="text-xs text-slate-500">Paste large JSON here</div>
              </div>
              <div className="mt-2">
                <textarea value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="Paste JSON array or object here" className="h-48 w-full resize-y rounded-[8px] border border-slate-200 bg-white px-3 py-2 text-xs font-mono" />
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={() => { onImportJson(importText); }} className={styles.action}>
                    Import JSON
                  </button>
                  <button type="button" onClick={() => setImportText(JSON.stringify(documents ?? [], null, 2))} className="rounded-[10px] border border-slate-200 bg-white px-3 py-2 text-xs">
                    Export current
                  </button>
                </div>
                <div className="mt-2 text-[11px] text-slate-400">Tip: Importing an array will add multiple documents.</div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
