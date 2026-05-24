import { useEffect, useState } from 'react';
import { ChevronRight, FileJson } from 'lucide-react';
import InlineSegmentEditor from './InlineSegmentEditor';
import type { Document } from '../types/explorer';
import type { JsonHighlight, JsonPathSegment } from '../types/explorer-ui';
import { pathToKey, ROOT_HIGHLIGHT } from '../utils/jsonPath';
import { cn } from '../utils/cn';

const styles = {
  card: 'flex h-full min-h-0 flex-col rounded-[16px] border border-slate-200 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.08)] transition',
  header: 'flex items-center justify-between gap-2 text-sm font-semibold text-slate-900 p-4',
  empty: 'flex flex-1 items-center justify-center rounded-[12px] border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500',
  list: 'flex flex-1 flex-col space-y-2 overflow-y-auto p-4 pt-1',
  row: 'flex w-full items-center justify-between rounded-[12px] border px-3 py-2 text-left text-sm transition',
  rowActive: 'border-emerald-400/60 bg-emerald-50 shadow-[0_0_0_3px_rgba(34,197,94,0.14)]',
  rowInactive: 'border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-200/60 hover:text-slate-900',
  rowStatic: 'border-slate-200 bg-white',
  itemHover: 'hover:bg-emerald-50/60 hover:border-emerald-200/60',
  meta: 'text-[11px] text-slate-400',
  input: 'w-full rounded-[8px] border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:border-emerald-300/70 focus:outline-none',
  badge: 'inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold',
  highlight: 'ring-2 ring-emerald-200/80',
  skeleton: 'flex w-full items-center justify-between rounded-[12px] border border-dashed border-emerald-200/70 bg-emerald-50/30 px-3 py-3 text-left text-xs text-emerald-700 transition',
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

const resolveTypeStyle = (value: unknown) => {
  if (value === null) return { label: 'null', tone: 'text-slate-500', badge: 'null' };
  if (Array.isArray(value)) return { label: 'array', tone: 'text-amber-600', badge: '[]' };
  if (isPlainObject(value)) return { label: 'object', tone: 'text-indigo-600', badge: '{}' };
  if (typeof value === 'string') return { label: 'string', tone: 'text-emerald-700', badge: 'abc' };
  if (typeof value === 'number') return { label: 'number', tone: 'text-blue-600', badge: '123' };
  if (typeof value === 'boolean') return { label: 'boolean', tone: 'text-rose-600', badge: 'bool' };
  return { label: 'value', tone: 'text-slate-500', badge: 'val' };
};

const getDbRefId = (value: unknown) => {
  if (!isPlainObject(value)) return null;
  const hasRef = typeof value.$ref === 'string';
  const id = value.$id ?? value.$oid;
  return hasRef && typeof id === 'string' ? id : null;
};

interface JsonValueRowProps {
  label: string;
  value: unknown;
  path: JsonPathSegment[];
  segment: JsonPathSegment;
  rootDocumentId: string | null;
  isReference: boolean;
  isExpandable: boolean;
  isHighlighted: boolean;
  columnDepth: number;
  allowPrimitiveClick: boolean;
  onOpenPath: (columnDepth: number, segment: JsonPathSegment) => void;
  onUpdateValue: (rootId: string, path: JsonPathSegment[], value: unknown) => void;
}

function JsonValueRow({
  label,
  value,
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
}: JsonValueRowProps) {
  const [localValue, setLocalValue] = useState(formatValue(value));
  const typeStyle = resolveTypeStyle(value);

  useEffect(() => {
    setLocalValue(formatValue(value));
  }, [value]);

  if (isExpandable || isReference) {
    return (
      <button
        type="button"
        onClick={() => onOpenPath(columnDepth, segment)}
        className={cn(styles.row, styles.rowInactive, styles.itemHover, isHighlighted && styles.rowActive)}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className={cn(styles.badge, typeStyle.tone)}>{typeStyle.badge}</span>
            <span className="font-semibold text-slate-800">{label}</span>
          </div>
          <div className={cn(styles.meta, typeStyle.tone)}>
            {isReference ? 'reference' : Array.isArray(value) ? `array (${value.length})` : 'object'}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {isReference ? 'ref' : Array.isArray(value) ? 'expand' : 'open'}
          <ChevronRight className="h-4 w-4" />
        </div>
      </button>
    );
  }

  if (allowPrimitiveClick) {
    return (
      <button
        type="button"
        onClick={() => onOpenPath(columnDepth, segment)}
        className={cn(styles.row, styles.rowStatic, styles.itemHover, isHighlighted && styles.rowActive)}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={cn(styles.badge, typeStyle.tone)}>{typeStyle.badge}</span>
            <span className="font-semibold text-slate-800">{label}</span>
          </div>
          <div className={cn(styles.meta, typeStyle.tone)}>{value === null ? 'null' : typeof value}</div>
        </div>
        <div className="w-[52%]">
          <input
            value={localValue}
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => setLocalValue(event.target.value)}
            onBlur={() => {
              if (!rootDocumentId) return;
              onUpdateValue(rootDocumentId, [...path, segment], parsePrimitive(localValue));
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.currentTarget.blur();
              }
            }}
            className={styles.input}
          />
        </div>
      </button>
    );
  }

  return (
    <div className={cn(styles.row, styles.rowStatic, isHighlighted && styles.rowActive)}>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className={cn(styles.badge, typeStyle.tone)}>{typeStyle.badge}</span>
          <span className="font-semibold text-slate-800">{label}</span>
        </div>
        <div className={cn(styles.meta, typeStyle.tone)}>{value === null ? 'null' : typeof value}</div>
      </div>
      <div className="w-[52%]">
        <input
          value={localValue}
          onChange={(event) => setLocalValue(event.target.value)}
          onBlur={() => {
            if (!rootDocumentId) return;
            onUpdateValue(rootDocumentId, [...path, segment], parsePrimitive(localValue));
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.currentTarget.blur();
            }
          }}
          className={styles.input}
        />
      </div>
    </div>
  );
}

interface JsonLevelColumnProps {
  title: string;
  value: unknown;
  path: JsonPathSegment[];
  rootDocumentId: string | null;
  documentMap: Map<string, Document>;
  columnDepth: number;
  highlight: JsonHighlight;
  allowPrimitiveClick: boolean;
  onOpenManager: () => void;
  onOpenPath: (columnDepth: number, segment: JsonPathSegment) => void;
  onUpdateValue: (rootId: string, path: JsonPathSegment[], value: unknown) => void;
}

export function JsonLevelColumn({
  title,
  value,
  path,
  rootDocumentId,
  documentMap,
  columnDepth,
  highlight,
  allowPrimitiveClick,
  onOpenManager,
  onOpenPath,
  onUpdateValue,
}: JsonLevelColumnProps) {
  const [expanded, setExpanded] = useState(false);
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

  return (
    <section className={cn(styles.card, columnHighlighted && styles.highlight)}>
      <div className={styles.header}>
        <div className="flex items-center gap-2">
          <FileJson className="h-4 w-4 text-emerald-500" />
          {title}
        </div>
        {rootDocumentId ? (
          <span className="text-xs text-slate-400">{rootDocumentId.slice(-6)}</span>
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
            const hasReferenceKey = entry.label !== '_id';
            const dbRefId = hasReferenceKey ? getDbRefId(entry.value) : null;
            const stringRefId =
              hasReferenceKey && typeof entry.value === 'string' && documentMap.has(entry.value)
                ? entry.value
                : null;
            const resolvedReference = dbRefId ?? stringRefId;
            const isRef = Boolean(resolvedReference);
            const isExpandableValue = isExpandable(entry.value);
            const segment = isRef
              ? ({ type: 'reference', id: resolvedReference } as JsonPathSegment)
              : entry.segment;
            const keyPath = pathToKey([...path, segment]);
            const isHighlighted =
              highlight.rootId === rootDocumentId && highlight.pathKey === keyPath;
            return (
              <JsonValueRow
                key={`${entry.label}-${keyPath}`}
                label={entry.label}
                value={entry.value}
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
              />
            );
          })
        )}
        <div className="w-full">
          <div className={cn('overflow-hidden transition-all duration-300', expanded ? 'max-h-[520px] opacity-100' : 'max-h-0 opacity-0')}>
            <div className={cn('transform transition-all duration-300', expanded ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0')}>
              <InlineSegmentEditor
                mode="field"
                parentPath={path}
                rootDocumentId={rootDocumentId}
                onCancel={() => setExpanded(false)}
                onSubmitField={(rootId, parent, key, value) => {
                  const segment = { type: 'key', key } as JsonPathSegment;
                  onUpdateValue(rootId, [...parent, segment], value);
                }}
              />
            </div>
          </div>

          {!expanded ? (
            <button type="button" onClick={() => setExpanded(true)} className={cn(styles.skeleton, styles.itemHover, 'mt-2')}>
              <span>Add JSON or edit data</span>
              <span className={styles.badge}>+</span>
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
