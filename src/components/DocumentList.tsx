import { FileText, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import InlineSegmentEditor from './InlineSegmentEditor';
import type { Document } from '../types/explorer';
import { cn } from '../utils/cn';

const styles = {
  card: 'flex h-full min-h-0 flex-col rounded-[16px] border border-slate-200 bg-white overflow-auto shadow-[0_10px_30px_rgba(15,23,42,0.06)]',
  title: 'flex items-center gap-2 text-sm font-semibold text-slate-900 p-4',
  item: 'flex w-full flex-col gap-1 rounded-[12px] border px-3 py-2 text-left text-sm transition',
  meta: 'text-xs text-slate-500',
  remove: 'inline-flex items-center gap-1 text-xs text-rose-500 transition hover:text-rose-600',
  itemHover: 'hover:bg-emerald-50/60 hover:border-emerald-200/60',
  list: 'flex flex-1 flex-col space-y-2 overflow-y-auto p-4 pt-1',
  skeleton: 'flex w-full items-center justify-between rounded-[12px] border border-dashed border-emerald-200/70 bg-emerald-50/30 px-3 py-3 text-left text-xs text-emerald-700 transition',
};

const getDocId = (doc: Document) => {
  const raw = doc._id;
  if (typeof raw === 'string' || typeof raw === 'number') return String(raw);
  if (raw && typeof raw === 'object' && 'toString' in raw) return String(raw);
  return '';
};

const getDocLabel = (doc: Document, fallback: string) => {
  const title = doc.title;
  if (typeof title === 'string' || typeof title === 'number') return String(title);
  return fallback;
};

interface DocumentListProps {
  documents: Document[];
  activeDocumentId: string | null;
  onSelectDocument: (doc: Document) => void;
  onRemoveDocument: (id: string) => void;
  onOpenManager: () => void;
  onAddDocument?: (doc: Document) => void;
}

export function DocumentList({
  documents,
  activeDocumentId,
  onSelectDocument,
  onRemoveDocument,
  onOpenManager,
  onAddDocument,
}: DocumentListProps) {
  const [expanded, setExpanded] = useState(false);
  return (
    <section className={styles.card}>
      <div className={styles.title}>
        <FileText className="h-4 w-4 text-emerald-500" />
        Documents
      </div>
      <div className={styles.list}>
        {documents.length === 0 ? (
          <div className="rounded-[12px] border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
            Select a collection to load documents.
          </div>
        ) : (
          documents.map((doc, index) => {
            const id = getDocId(doc);
            const isActive = activeDocumentId === id;
            return (
              <button
                key={id || `doc-${index}`}
                type="button"
                onClick={() => onSelectDocument(doc)}
                className={cn(
                  styles.item,
                  styles.itemHover,
                  isActive
                    ? 'border-emerald-400/60 bg-emerald-50 text-slate-900 shadow-[0_0_0_3px_rgba(34,197,94,0.14)]'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-200/60 hover:text-slate-900'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{getDocLabel(doc, id || 'Document')}</div>
                  {id ? (
                    <span className={styles.meta}>{id.slice(0, 6)}...</span>
                  ) : (
                    <span className={styles.meta}>no id</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className={styles.meta}>Fields: {Object.keys(doc).length}</div>
                  {id ? (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(event) => {
                        event.stopPropagation();
                        onRemoveDocument(id);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          onRemoveDocument(id);
                        }
                      }}
                      className={styles.remove}
                    >
                      <Trash2 className="h-3 w-3" />
                      Remove
                    </span>
                  ) : null}
                </div>
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
                onSubmitDocument={(doc) => {
                  onAddDocument?.(doc);
                }}
              />
            </div>
          </div>
        </div>
        {!expanded ? (
          <button type="button" onClick={() => setExpanded(true)} className={cn(styles.skeleton, styles.itemHover)}>
            <span>Add document or JSON</span>
            <Plus className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </section>
  );
}
