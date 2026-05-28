import { Layers, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import InlineSegmentEditor from './InlineSegmentEditor';
import type { CatalogEntry } from '../types/explorer';
import { cn } from '../utils/cn';

const styles = {
  card: 'flex h-full min-h-0 min-w-0 flex-col rounded-[16px] border border-slate-200 bg-white overflow-auto shadow-[0_10px_30px_rgba(15,23,42,0.06)]',
  title: 'flex items-center gap-2 text-sm font-semibold text-slate-900 p-4',
  item: 'group flex w-full min-w-0 items-center justify-between gap-3 rounded-[12px] border px-3 py-2 text-left text-sm transition',
  meta: 'text-xs text-slate-500',
  itemHover: 'hover:bg-emerald-50/60 hover:border-emerald-200/60',
  list: 'flex flex-1 flex-col space-y-2 overflow-y-auto p-4 pt-1',
  skeleton: 'flex w-full items-center justify-between rounded-[12px] border border-dashed border-emerald-200/70 bg-emerald-50/30 px-3 py-2 text-left text-xs text-emerald-700 transition sm:py-3',
  empty: 'rounded-[12px] border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-500',
  itemActive: 'border-emerald-400/60 bg-emerald-50 text-slate-900 shadow-[0_0_0_3px_rgba(34,197,94,0.14)]',
  itemInactive: 'border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-200/60 hover:text-slate-900',
  rowMeta: 'shrink-0 text-xs font-semibold text-emerald-700',
  name: 'truncate font-semibold max-w-[180px] sm:max-w-[220px] md:max-w-none group-focus-within:max-w-none group-focus-within:whitespace-normal group-focus-within:overflow-visible',
  inlineWrap: 'w-full',
  actions: 'ml-auto flex items-center gap-2 opacity-0 transition group-hover:opacity-100',
  actionBtn: 'rounded-full p-1 text-slate-400 transition hover:text-emerald-600',
  actionDelete: 'hover:text-rose-500',
  expandedWrap: 'overflow-hidden transition-all duration-300',
  expandedOpen: 'max-h-[420px] opacity-100 sm:max-h-[520px]',
  expandedClosed: 'max-h-0 opacity-0',
  expandedInner: 'transform transition-all duration-300',
  expandedInnerOpen: 'translate-y-0 opacity-100',
  expandedInnerClosed: '-translate-y-2 opacity-0',
  icon: 'h-4 w-4',
  iconAccent: 'h-4 w-4 text-emerald-500',
};

interface CollectionListProps {
  collections: CatalogEntry[];
  activeCollection: string | null;
  onSelectCollection: (collection: string) => void;
  onOpenManager: () => void;
  onAddCollection?: (name: string) => void;
  onRemoveCollection?: (name: string) => void;
  onRenameCollection?: (currentName: string, nextName: string) => void;
}

export function CollectionList({
  collections,
  activeCollection,
  onSelectCollection,
  onOpenManager,
  onAddCollection,
  onRemoveCollection,
  onRenameCollection,
}: CollectionListProps) {
  const [expanded, setExpanded] = useState(false);
  const [editingCollection, setEditingCollection] = useState<string | null>(null);

  useEffect(() => {
    const handleCloseAll = () => setExpanded(false);
    window.addEventListener('inline-editor-close-all', handleCloseAll);
    return () => window.removeEventListener('inline-editor-close-all', handleCloseAll);
  }, []);

  const openEditor = () => {
    window.dispatchEvent(new Event('inline-editor-close-all'));
    setEditingCollection(null);
    setExpanded(true);
  };

  const openEdit = (name: string) => {
    window.dispatchEvent(new Event('inline-editor-close-all'));
    setExpanded(false);
    setEditingCollection(name);
  };

  return (
    <section className={styles.card}>
      <div className={styles.title}>
        <Layers className={styles.iconAccent} />
        Collections
      </div>
      <div className={styles.list}>
        {collections.length === 0 ? (
          <div className={styles.empty}>No collections yet. Add one from the floating manager.</div>
        ) : (
          collections.map((entry) => {
            const isActive = activeCollection === entry.collection.name;
            if (editingCollection === entry.collection.name) {
              return (
                <InlineSegmentEditor
                  key={entry.collection.name}
                  mode="collection"
                  isEdit
                  initialData={{ key: entry.collection.name }}
                  onCancel={() => setEditingCollection(null)}
                  onSubmitCollection={(name) => {
                    onRenameCollection?.(entry.collection.name, name);
                    setEditingCollection(null);
                  }}
                />
              );
            }
            return (
              <button
                key={entry.collection.name}
                type="button"
                onClick={() => onSelectCollection(entry.collection.name)}
                className={cn(
                  styles.item,
                  styles.itemHover,
                  isActive ? styles.itemActive : styles.itemInactive
                )}
              >
                <div>
                  <div className={styles.name}>{entry.collection.name}</div>
                  <div className={styles.meta}>{entry.collection.documentCount} docs</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={styles.rowMeta}>{entry.collection.sizeMb} MB</div>
                  <div className={styles.actions}>
                    {onRenameCollection ? (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(event) => {
                          event.stopPropagation();
                          openEdit(entry.collection.name);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            openEdit(entry.collection.name);
                          }
                        }}
                        className={styles.actionBtn}
                        aria-label="Edit collection"
                      >
                        <Pencil className={styles.icon} />
                      </span>
                    ) : null}
                    {onRemoveCollection ? (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(event) => {
                          event.stopPropagation();
                          onRemoveCollection(entry.collection.name);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            onRemoveCollection(entry.collection.name);
                          }
                        }}
                        className={cn(styles.actionBtn, styles.actionDelete)}
                        aria-label="Delete collection"
                      >
                        <Trash2 className={styles.icon} />
                      </span>
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })
        )}
        <div className={styles.inlineWrap}>
          <div className={cn(styles.expandedWrap, expanded ? styles.expandedOpen : styles.expandedClosed)}>
            <div className={cn(styles.expandedInner, expanded ? styles.expandedInnerOpen : styles.expandedInnerClosed)}>
              <InlineSegmentEditor
                mode="collection"
                onCancel={() => setExpanded(false)}
                onSubmitCollection={(name) => onAddCollection?.(name)}
              />
            </div>
          </div>
        </div>

        {!expanded ? (
          <button type="button" onClick={openEditor} className={cn(styles.skeleton, styles.itemHover)}>
            <span>Add collection</span>
            <Plus className={styles.icon} />
          </button>
        ) : null}
      </div>
    </section>
  );
}
