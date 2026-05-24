import { Layers, Plus } from 'lucide-react';
import { useState } from 'react';
import InlineSegmentEditor from './InlineSegmentEditor';
import type { CatalogEntry, Document } from '../types/explorer';
import { cn } from '../utils/cn';

const styles = {
  card: 'flex h-full min-h-0 flex-col rounded-[16px] border border-slate-200 bg-white overflow-auto shadow-[0_10px_30px_rgba(15,23,42,0.06)]',
  title: 'flex items-center gap-2 text-sm font-semibold text-slate-900 p-4',
  item: 'flex w-full items-center justify-between rounded-[12px] border px-3 py-2 text-left text-sm transition',
  meta: 'text-xs text-slate-500',
  itemHover: 'hover:bg-emerald-50/60 hover:border-emerald-200/60',
  list: 'flex flex-1 flex-col space-y-2 overflow-y-auto p-4 pt-1',
  skeleton: 'flex w-full items-center justify-between rounded-[12px] border border-dashed border-emerald-200/70 bg-emerald-50/30 px-3 py-3 text-left text-xs text-emerald-700 transition',
};

interface CollectionListProps {
  collections: CatalogEntry[];
  activeCollection: string | null;
  onSelectCollection: (collection: string) => void;
  onOpenManager: () => void;
  onAddDocument?: (doc: Document) => void;
}

export function CollectionList({
  collections,
  activeCollection,
  onSelectCollection,
  onOpenManager,
  onAddDocument,
}: CollectionListProps) {
  const [expanded, setExpanded] = useState(false);
  return (
    <section className={styles.card}>
      <div className={styles.title}>
        <Layers className="h-4 w-4 text-emerald-500" />
        Collections
      </div>
      <div className={styles.list}>
        {collections.length === 0 ? (
          <div className="rounded-[12px] border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
            No collections yet. Add one from the floating manager.
          </div>
        ) : (
          collections.map((entry) => {
            const isActive = activeCollection === entry.collection.name;
            return (
              <button
                key={entry.collection.name}
                type="button"
                onClick={() => onSelectCollection(entry.collection.name)}
                className={cn(
                  styles.item,
                  styles.itemHover,
                  isActive
                    ? 'border-emerald-400/60 bg-emerald-50 text-slate-900 shadow-[0_0_0_3px_rgba(34,197,94,0.14)]'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-200/60 hover:text-slate-900'
                )}
              >
                <div>
                  <div className="font-semibold">{entry.collection.name}</div>
                  <div className={styles.meta}>{entry.collection.documentCount} docs</div>
                </div>
                <div className="text-xs font-semibold text-emerald-700">{entry.collection.sizeMb} MB</div>
              </button>
            );
          })
        )}
        <div className="w-full">
          <div className={cn('overflow-hidden transition-all duration-300', expanded ? 'max-h-[520px] opacity-100' : 'max-h-0 opacity-0')}>
            <div className={cn('transform transition-all duration-300', expanded ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0')}>
              <InlineSegmentEditor
                mode="document"
                onCancel={() => setExpanded(false)}
                onSubmitDocument={(doc) => onAddDocument?.(doc)}
              />
            </div>
          </div>
        </div>

        {!expanded ? (
          <button type="button" onClick={() => setExpanded(true)} className={cn(styles.skeleton, styles.itemHover)}>
            <span>Add collection or data</span>
            <Plus className="h-4 w-4" />
          </button>
        ) :  null }
      </div>
    </section>
  );
}
