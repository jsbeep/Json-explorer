import { FileText, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import AddInlineSegmentEditor from './AddInlineSegmentEditor';
import type { Document } from '../types/explorer';
import { cn } from '../utils/cn';
import { extractOid } from '../utils/oid';

const styles = {
  card: 'flex h-full min-h-0 min-w-0 flex-col rounded-[16px] border border-slate-200 bg-white overflow-auto shadow-[0_10px_30px_rgba(15,23,42,0.06)]',
  title: 'flex items-center gap-2 text-sm font-semibold text-slate-900 p-4',
  item: 'group flex w-full flex-col gap-1 rounded-[12px] border px-3 py-2 text-left text-sm transition',
  meta: 'text-xs text-slate-500',
  remove: 'inline-flex items-center gap-1 text-xs text-rose-500 transition hover:text-rose-600',
  itemHover: 'hover:bg-emerald-50/60 hover:border-emerald-200/60',
  itemActive: 'border-emerald-400/60 bg-emerald-50 text-slate-900 shadow-[0_0_0_3px_rgba(34,197,94,0.14)]',
  itemInactive: 'border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-200/60 hover:text-slate-900',
  list: 'flex flex-1 flex-col space-y-2 overflow-y-auto p-4 pt-1',
  skeleton: 'flex w-full items-center justify-between rounded-[12px] border border-dashed border-emerald-200/70 bg-emerald-50/30 px-3 py-2 text-left text-xs text-emerald-700 transition sm:py-3',
  empty: 'rounded-[12px] border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-500',
  rowTop: 'flex flex-wrap items-center justify-between gap-2',
  rowBottom: 'flex flex-wrap items-center justify-between gap-2',
  idBadge: 'text-xs text-slate-500 truncate max-w-[120px] sm:max-w-none group-focus-within:max-w-none group-focus-within:whitespace-normal group-focus-within:overflow-visible',
  expandedWrap: 'overflow-hidden transition-all duration-300',
  expandedOpen: 'max-h-[420px] opacity-100 sm:max-h-[520px]',
  expandedClosed: 'max-h-0 opacity-0',
  expandedInner: 'transform transition-all duration-300',
  expandedInnerOpen: 'translate-y-0 opacity-100',
  expandedInnerClosed: '-translate-y-2 opacity-0',
  inlineWrap: 'w-full',
  icon: 'h-4 w-4',
  iconSmall: 'h-3 w-3',
  titleText: 'font-semibold truncate max-w-[220px] sm:max-w-none group-focus-within:max-w-none group-focus-within:whitespace-normal group-focus-within:overflow-visible',
  iconAccent: 'h-4 w-4 text-emerald-500',
};

const getDocId = (doc: Document) => extractOid(doc._id) ?? '';

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

  useEffect(() => {
    const handleCloseAll = () => setExpanded(false);
    window.addEventListener('inline-editor-close-all', handleCloseAll);
    return () => window.removeEventListener('inline-editor-close-all', handleCloseAll);
  }, []);

  const openEditor = () => {
    window.dispatchEvent(new Event('inline-editor-close-all'));
    setExpanded(true);
  };

  return (
    <section className={styles.card}>
      <div className={styles.title}>
        <FileText className={styles.iconAccent} />
        Documents
      </div>
      <div className={styles.list}>
        {documents.length === 0 ? (
          <div className={styles.empty}>Select a collection to load documents.</div>
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
                  isActive ? styles.itemActive : styles.itemInactive
                )}
              >
                <div className={styles.rowTop}>
                  <div className={styles.titleText}>{getDocLabel(doc, id || 'Document')}</div>
                  {id ? (
                    <span className={styles.idBadge}>{id.slice(0, 6)}...</span>
                  ) : (
                    <span className={styles.meta}>no id</span>
                  )}
                </div>
                <div className={styles.rowBottom}>
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
                      <Trash2 className={styles.iconSmall} />
                      Remove
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })
        )}
        <div className={styles.inlineWrap}>
          <div className={cn(styles.expandedWrap, expanded ? styles.expandedOpen : styles.expandedClosed)}>
            <div className={cn(styles.expandedInner, expanded ? styles.expandedInnerOpen : styles.expandedInnerClosed)}>
              <AddInlineSegmentEditor
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
          <button type="button" onClick={openEditor} className={cn(styles.skeleton, styles.itemHover)}>
            <span>Add document or JSON</span>
            <Plus className={styles.icon} />
          </button>
        ) : null}
      </div>
    </section>
  );
}
