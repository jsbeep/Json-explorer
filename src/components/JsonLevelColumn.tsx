import { useEffect, useRef, useState } from 'react';
import { ChevronRight, Copy, FileJson, Pencil, Trash2 } from 'lucide-react';
import InlineSegmentEditor from './InlineSegmentEditor';
import type { Document } from '../types/explorer';
import type { JsonHighlight, JsonPathSegment } from '../types/explorer-ui';
import { pathToKey, ROOT_HIGHLIGHT } from '../utils/jsonPath';
import { cn } from '../utils/cn';
import { isOidObject } from '../utils/oid';

const styles = {
  card: 'flex h-full min-h-0 min-w-0 flex-col rounded-[16px] border border-slate-200 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.08)] transition',
  cardRef: 'border-emerald-200/70 bg-emerald-50/40',
  header: 'flex items-center justify-between gap-2 text-sm font-semibold text-slate-900 p-4',
  headerRef: 'text-emerald-800',
  headerLeft: 'flex items-center gap-2',
  headerId: 'text-xs text-slate-400',
  icon: 'h-4 w-4 text-emerald-500',
  iconRef: 'text-emerald-600',
  empty: 'flex flex-1 items-center justify-center rounded-[12px] border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500 px-4',
  list: 'flex flex-1 flex-col space-y-2 overflow-y-auto p-4 pt-1',
  row: 'group flex w-full flex-col items-start justify-between gap-2 rounded-[12px] border px-3 py-2 text-left text-sm transition sm:flex-row sm:items-center',
  rowActive: 'border-emerald-400/60 bg-emerald-50 shadow-[0_0_0_3px_rgba(34,197,94,0.14)]',
  rowInactive: 'border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-200/60 hover:text-slate-900',
  rowStatic: 'border-slate-200 bg-white',
  itemHover: 'hover:bg-emerald-50/60 hover:border-emerald-200/60',
  badge: 'inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold',
  highlight: 'ring-2 ring-emerald-200/80',
  skeleton: 'flex w-full items-center justify-between rounded-[12px] border border-dashed border-emerald-200/70 bg-emerald-50/30 px-3 py-2 text-left text-xs text-emerald-700 transition sm:py-3',
  rowLeft: 'flex items-center gap-2',
  rowLabel: 'font-semibold text-slate-800 truncate max-w-[100%] group-focus-within:max-w-none group-focus-within:whitespace-normal group-focus-within:overflow-visible',
  rowRight: 'flex items-center gap-2 text-xs text-slate-500 sm:shrink-0',
  rowMeta: 'text-[11px] text-slate-400 truncate max-w-[220px] sm:max-w-none',
  rowPrevious: 'border-emerald-400/60 bg-emerald-50 text-slate-900 shadow-[0_0_0_3px_rgba(34,197,94,0.14)]',
  rowLeftGroup: 'w-full min-w-0 sm:w-[45%] sm:pr-3',
  rowRightGroup: 'flex w-full min-w-0 items-center gap-2 sm:w-[100%] sm:justify-end',
  inputWrap: 'w-full sm:ml-auto sm:min-w-[48%] sm:max-w-[70%]',
  inlineInput: 'w-full truncate rounded-[8px] border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:border-emerald-300/70 focus:outline-none',
  rowActions: 'flex max-w-0 items-center gap-2 overflow-hidden opacity-0 transition-all duration-200 translate-x-2 group-hover:max-w-[96px] group-hover:opacity-100 group-hover:translate-x-0',
  rowActionBtn: 'rounded-full p-1 text-slate-400 transition hover:text-emerald-600',
  rowActionDelete: 'hover:text-rose-500',
  editorWrap: 'w-full flex-shrink-0 overflow-hidden transition-all duration-300',
  editorOpen: 'max-h-[420px] min-h-[140px] opacity-100 sm:max-h-[520px]',
  editorClosed: 'max-h-0 min-h-[65px] opacity-0',
  editorInner: 'w-full transform transition-all duration-300',
  editorInnerOpen: 'translate-y-0 opacity-100',
  editorInnerClosed: '-translate-y-2 opacity-0',
  skeletonBadge: 'inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold',
  iconSmall: 'h-4 w-4',
  flexOne: 'flex-1',
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const isExpandable = (value: unknown) => Array.isArray(value) || isPlainObject(value);

const formatValue = (value: unknown) => {
  if (value === null) return 'null';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
};

const parsePrimitive = (raw: string) => {
  const trimmed = raw.trim();
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return null;
  if (trimmed !== '' && !Number.isNaN(Number(trimmed))) return Number(trimmed);
  return raw;
};

const resolveTypeStyle = (value: unknown, isObjectId = false) => {
  if (isObjectId) return { label: 'objectId', tone: 'text-slate-600', badge: 'OID' };
  if (value === null) return { label: 'null', tone: 'text-slate-500', badge: 'null' };
  if (Array.isArray(value)) return { label: 'array', tone: 'text-amber-600', badge: '[ ]' };
  if (isPlainObject(value)) return { label: 'object', tone: 'text-indigo-600', badge: '{ }' };
  if (typeof value === 'string') return { label: 'string', tone: 'text-emerald-700', badge: 'abc' };
  if (typeof value === 'number') return { label: 'number', tone: 'text-blue-600', badge: '123' };
  if (typeof value === 'boolean') return { label: 'boolean', tone: 'text-rose-600', badge: 'bool' };
  return { label: 'value', tone: 'text-slate-500', badge: 'val' };
};


interface JsonValueRowProps {
  label: string;
  value: unknown;
  isObjectId?: boolean;
  isPreviousPath?: boolean;
  path: JsonPathSegment[];
  segment: JsonPathSegment;
  rootDocumentId: string | null;
  isReference: boolean;
  isExpandable: boolean;
  isHighlighted: boolean;
  columnDepth: number;
  allowPrimitiveClick: boolean;
  onOpenPath: (columnDepth: number, segment: JsonPathSegment, primitiveValue?: boolean) => void;
  onUpdateValue: (rootId: string, path: JsonPathSegment[], value: unknown, nextKey?: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onCopy?: () => void;
}

function JsonValueRow({
  label,
  value,
  isObjectId = false,
  isPreviousPath = false,
  path,
  segment,
  rootDocumentId,
  isReference,
  isExpandable,
  isHighlighted,
  columnDepth,
  allowPrimitiveClick,
  onOpenPath,
  onUpdateValue,
  onEdit,
  onDelete,
  onCopy,
}: JsonValueRowProps) {
  const [localValue, setLocalValue] = useState(formatValue(value));
  const typeStyle = resolveTypeStyle(value, isObjectId);

  useEffect(() => {
    setLocalValue(formatValue(value));
  }, [value]);

  if (isExpandable || isReference) {
    return (
      <button
        type="button"
        onClick={() => onOpenPath(columnDepth, segment)}
        className={cn(
          styles.row,
          styles.itemHover,
          isHighlighted && styles.rowActive,
          isPreviousPath ? styles.rowPrevious : styles.rowInactive,
        )}
      >
        <div className={styles.rowLeftGroup}>
          <div className={styles.rowLeft}>
            <span className={cn(styles.badge, typeStyle.tone)}>{typeStyle.badge}</span>
            <span className={styles.rowLabel}>{label}</span>
          </div>
          <div className={cn(styles.rowMeta, typeStyle.tone)}>
            {isReference ? 'reference' : Array.isArray(value) ? `array (${value.length})` : 'object'}
          </div>
        </div>
        <div className={styles.rowRightGroup}>
          {(onEdit || onDelete || onCopy) ? (
            <div className={styles.rowActions}>
              {onCopy ? (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(event) => {
                    event.stopPropagation();
                    onCopy();
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onCopy();
                    }
                  }}
                  className={styles.rowActionBtn}
                  aria-label="Copy value"
                >
                  <Copy className={styles.iconSmall} />
                </span>
              ) : null}
              {onEdit ? (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(event) => {
                    event.stopPropagation();
                    onEdit();
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onEdit();
                    }
                  }}
                  className={styles.rowActionBtn}
                  aria-label="Edit field"
                >
                  <Pencil className={styles.iconSmall} />
                </span>
              ) : null}
              {onDelete ? (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete();
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onDelete();
                    }
                  }}
                  className={cn(styles.rowActionBtn, styles.rowActionDelete)}
                  aria-label="Delete field"
                >
                  <Trash2 className={styles.iconSmall} />
                </span>
              ) : null}
            </div>
          ) : null}
          <div className={styles.rowRight}>
            <ChevronRight className={styles.iconSmall} />
          </div>
        </div>
      </button>
    );
  }

  if (allowPrimitiveClick) {
    return (
      <button
        type="button"
        onClick={() => onOpenPath(columnDepth, segment, true)}
        className={cn(
          styles.row,
          styles.rowStatic,
          styles.itemHover,
          isHighlighted && styles.rowActive,
          isPreviousPath && styles.rowPrevious
        )}
      >
        <div className={styles.rowLeftGroup}>
          <div className={styles.rowLeft}>
            <span className={cn(styles.badge, typeStyle.tone)}>{typeStyle.badge}</span>
            <span className={styles.rowLabel}>{label}</span>
          </div>
          <div className={cn(styles.rowMeta, typeStyle.tone)}>{value === null ? 'null' : typeof value}</div>
        </div>
        <div className={styles.rowRightGroup}>
          <div className={styles.inputWrap}>
            <div className={styles.inlineInput}>{localValue}</div>
          </div>
          {(onEdit || onDelete || onCopy) ? (
            <div className={styles.rowActions}>
              {onCopy ? (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(event) => {
                    event.stopPropagation();
                    onCopy();
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onCopy();
                    }
                  }}
                  className={styles.rowActionBtn}
                  aria-label="Copy value"
                >
                  <Copy className={styles.iconSmall} />
                </span>
              ) : null}
              {onEdit ? (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(event) => {
                    event.stopPropagation();
                    onEdit();
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onEdit();
                    }
                  }}
                  className={styles.rowActionBtn}
                  aria-label="Edit field"
                >
                  <Pencil className={styles.iconSmall} />
                </span>
              ) : null}
              {onDelete ? (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete();
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onDelete();
                    }
                  }}
                  className={cn(styles.rowActionBtn, styles.rowActionDelete)}
                  aria-label="Delete field"
                >
                  <Trash2 className={styles.iconSmall} />
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </button>
    );
  }

  return (
    <div
      className={cn(
        styles.row,
        styles.rowStatic,
        isHighlighted && styles.rowActive,
        isPreviousPath && styles.rowPrevious,
      )}
    >
      <div className={styles.rowLeftGroup}>
        <div className={styles.rowLeft}>
          <span className={cn(styles.badge, typeStyle.tone)}>{typeStyle.badge}</span>
          <span className={styles.rowLabel}>{label}</span>
        </div>
        <div className={cn(styles.rowMeta, typeStyle.tone)}>{value === null ? 'null' : isObjectId ? 'objectId' : typeof value}</div>
      </div>
      <div className={styles.rowRightGroup}>
        <div className={styles.inputWrap}>
          <div className={styles.inlineInput}>{localValue}</div>
        </div>
        {(onEdit || onDelete || onCopy) ? (
          <div className={styles.rowActions}>
            {onCopy ? (
              <button
                type="button"
                onClick={onCopy}
                className={styles.rowActionBtn}
                aria-label="Copy value"
              >
                <Copy className={styles.iconSmall} />
              </button>
            ) : null}
            {onEdit ? (
              <button
                type="button"
                onClick={onEdit}
                className={styles.rowActionBtn}
                aria-label="Edit field"
              >
                <Pencil className={styles.iconSmall} />
              </button>
            ) : null}
            {onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                className={cn(styles.rowActionBtn, styles.rowActionDelete)}
                aria-label="Delete field"
              >
                <Trash2 className={styles.iconSmall} />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

interface JsonLevelColumnProps {
  title: string;
  value: unknown;
  path: JsonPathSegment[];
  rootDocumentId: string | null;
  columnDepth: number;
  highlight: JsonHighlight;
  allowPrimitiveClick: boolean;
  isReferenceColumn?: boolean;
  activeSegment?: JsonPathSegment | null;
  checkValidReference: (oid: string) => Document | null;
  onOpenManager: () => void;
  onOpenPath: (columnDepth: number, segment: JsonPathSegment, primitiveValue?: boolean) => void;
  onUpdateValue: (rootId: string, path: JsonPathSegment[], value: unknown, nextKey?: string) => void;
  onRemoveValue: (rootId: string, path: JsonPathSegment[], segment: JsonPathSegment) => void;
}

export function JsonLevelColumn({
  title,
  value,
  path,
  rootDocumentId,
  columnDepth,
  highlight,
  allowPrimitiveClick,
  isReferenceColumn = false,
  activeSegment = null,
  checkValidReference,
  onOpenManager,
  onOpenPath,
  onUpdateValue,
  onRemoveValue,
}: JsonLevelColumnProps) {
  const [expanded, setExpanded] = useState(false);
  const [editingPathKey, setEditingPathKey] = useState<string | null>(null);
  const [editExpanded, setEditExpanded] = useState(false);
  const editCloseTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const handleCloseAll = () => setExpanded(false);
    window.addEventListener('inline-editor-close-all', handleCloseAll);
    return () => window.removeEventListener('inline-editor-close-all', handleCloseAll);
  }, []);

  useEffect(() => {
    return () => {
      if (editCloseTimerRef.current) {
        window.clearTimeout(editCloseTimerRef.current);
      }
    };
  }, []);

  const openEditor = () => {
    window.dispatchEvent(new Event('inline-editor-close-all'));
    setEditingPathKey(null);
    setEditExpanded(false);
    setExpanded(true);
  };

  const openEdit = (pathKey: string) => {
    window.dispatchEvent(new Event('inline-editor-close-all'));
    setExpanded(false);
    if (editCloseTimerRef.current) {
      window.clearTimeout(editCloseTimerRef.current);
      editCloseTimerRef.current = null;
    }
    setEditingPathKey(pathKey);
    setEditExpanded(false);
    window.requestAnimationFrame(() => setEditExpanded(true));
  };

  const closeEdit = () => {
    setEditExpanded(false);
    if (editCloseTimerRef.current) {
      window.clearTimeout(editCloseTimerRef.current);
    }
    editCloseTimerRef.current = window.setTimeout(() => {
      setEditingPathKey(null);
    }, 300);
  };

  const isArray = Array.isArray(value);
  const nextArrayIndex = isArray ? value.length : 0;
  const existingKeys = isPlainObject(value) ? Object.keys(value) : undefined;
  const entries = Array.isArray(value)
    ? value.map((entry, index) => ({
      label: `[${index}]`,
      segment: { type: 'index', index } as JsonPathSegment,
      value: entry,
    }))
    : isPlainObject(value)
      ? Object.entries(value).map(([key, entry]) => ({
        label: key,
        segment: { type: 'key', key } as JsonPathSegment,
        value: entry,
      }))
      : [];

  const columnHighlighted =
    highlight.rootId === rootDocumentId && highlight.pathKey === ROOT_HIGHLIGHT;
  const canMutate = Boolean(rootDocumentId);

  return (
    <section className={cn(styles.card, isReferenceColumn && styles.cardRef, columnHighlighted && styles.highlight)}>
      <div className={cn(styles.header, isReferenceColumn && styles.headerRef)}>
        <div className={styles.headerLeft}>
          <FileJson className={cn(styles.icon, isReferenceColumn && styles.iconRef)} />
          {title}
        </div>
        {rootDocumentId ? (
          <span className={styles.headerId}>{rootDocumentId.slice(-6)}</span>
        ) : null}
      </div>
      <div className={styles.list}>
        {entries.length === 0 ? (
          <div className={styles.empty}>
            {value === null || value === undefined
              ? 'Select a document to explore JSON.'
              : 'No nested fields at this level.'}
          </div>
        ) : (
          entries.map((entry) => {
            const oid = isOidObject(entry.value) ? entry.value.$oid : null;
            const isIdKey = entry.label === '_id';
            const isObjectIdValue = Boolean(oid);
            const resolved = !isIdKey && oid ? checkValidReference(oid) : null;
            const isRef = Boolean(resolved);
            const segment = isRef
              ? ({ type: 'reference', id: oid as string } as JsonPathSegment)
              : entry.segment;
            const editSegment = isRef ? entry.segment : segment;
            const rowValue = isIdKey && oid ? oid : oid && !resolved ? oid : entry.value;
            const isExpandableValue = isIdKey ? false : isExpandable(rowValue);
            const keyPath = pathToKey([...path, segment]);
            const isPreviousPath =
              activeSegment && pathToKey([segment]) === pathToKey([activeSegment]);
            const isHighlighted =
              highlight.rootId === rootDocumentId && highlight.pathKey === keyPath;

            if (editingPathKey === keyPath) {
              return (
                <div className={cn(styles.editorWrap, editExpanded ? styles.editorOpen : styles.editorClosed)}>
                  <div className={cn(styles.editorInner, editExpanded ? styles.editorInnerOpen : styles.editorInnerClosed)}>
                    <InlineSegmentEditor
                      key={`edit-${keyPath}`}
                      mode="field"
                      isEdit
                      parentPath={path}
                      parentIsArray={editSegment.type === 'index'}
                      rootDocumentId={rootDocumentId}
                      editSegment={editSegment}
                      existingKeys={existingKeys}
                      initialData={{
                        key: editSegment.type === 'key' ? editSegment.key : entry.label,
                        value: entry.value,
                        type: isObjectIdValue ? 'objectId' : isRef ? 'reference' : isExpandableValue ? 'object' : undefined,
                      }}
                      onCancel={closeEdit}
                      onSubmitField={(rootId, parent, editTarget, nextValue, nextKey) => {
                        onUpdateValue(rootId, [...parent, editTarget], nextValue, nextKey);
                      }}
                    />
                  </div>
                </div>
              );
            }

            return (
              <JsonValueRow
                key={`${entry.label}-${keyPath}`}
                label={entry.label}
                value={rowValue}
                isObjectId={isObjectIdValue}
                isPreviousPath={Boolean(isPreviousPath)}
                path={path}
                segment={segment}
                rootDocumentId={rootDocumentId}
                isReference={isRef}
                isExpandable={isExpandableValue}
                isHighlighted={isHighlighted}
                columnDepth={columnDepth}
                allowPrimitiveClick={allowPrimitiveClick}
                onOpenPath={onOpenPath}
                onUpdateValue={onUpdateValue}
                onEdit={canMutate && !isIdKey ? () => openEdit(keyPath) : undefined}
                onDelete={canMutate && !isIdKey ? () => {
                  if (isExpandableValue || isRef) {
                    const confirmed = window.confirm('하위 데이터가 모두 삭제됩니다. 계속하시겠습니까?');
                    if (!confirmed) return;
                  }
                  onRemoveValue(rootDocumentId as string, path, editSegment);
                } : undefined}
                onCopy={isIdKey ? () => {
                  const text = typeof rowValue === 'string' ? rowValue : String(rowValue ?? '');
                  console.log('Copying to clipboard:', rowValue);
                  if (navigator.clipboard?.writeText) {
                    void navigator.clipboard.writeText(text);
                  }
                } : undefined}
              />
            );
          })
        )}
        <div className="w-full">
          <div className={cn('overflow-hidden transition-all duration-300', expanded ? 'max-h-[420px] opacity-100 sm:max-h-[520px]' : 'max-h-0 opacity-0')}>
            <div className={cn('transform transition-all duration-300', expanded ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0')}>
              <InlineSegmentEditor
                mode="field"
                parentPath={path}
                rootDocumentId={rootDocumentId}
                existingKeys={existingKeys}
                onCancel={() => setExpanded(false)}

                onSubmitField={(rootId, parent, segment, value) => {
                  onUpdateValue(rootId, [...parent, segment], value);
                }}
              />
            </div>
          </div>

          {!expanded ? (
            <button type="button" onClick={openEditor} className={cn(styles.skeleton, styles.itemHover, 'mt-2')}>
              <span>Add JSON or edit data</span>
              <span className={styles.badge}>+</span>
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
