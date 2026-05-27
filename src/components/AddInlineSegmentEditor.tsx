import { useEffect, useMemo, useState } from 'react';
import { Check, Code, Link2, List, Square, ToggleLeft, Type, Zap } from 'lucide-react';
import type { Document } from '../types/explorer';
import type { JsonPathSegment } from '../types/explorer-ui';
import { cn } from '../utils/cn';
import { createObjectId } from '../utils/objectId';
import { extractOid, wrapOid } from '../utils/oid';

const styles = {
  container: 'mt-3 rounded-[10px] border border-slate-200 bg-white p-2 sm:p-3',
  headerRow: 'flex flex-col gap-2 sm:flex-row sm:items-center',
  keyInput: 'w-full rounded-[8px] border border-slate-200 px-2 py-1 text-sm sm:flex-1',
  title: 'text-sm font-semibold text-slate-900',
  badge: 'rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600',
  typeButton: 'w-full rounded-[8px] border border-slate-200 px-2 py-1 text-xs flex items-center gap-1 sm:w-auto',
  typeButtonDisabled: 'opacity-60',
  typeButtonLabel: 'font-semibold text-sm',
  icon: 'h-4 w-4',
  typePanel: 'mt-3 overflow-hidden transition-all',
  typePanelOpen: 'max-h-40',
  typePanelClosed: 'max-h-0',
  typeList: 'flex flex-wrap gap-2 py-2 w-full',
  typeItem: 'rounded-md border px-2 py-1 text-sm flex items-center gap-1',
  typeItemActive: 'border-emerald-400 bg-emerald-50',
  typeItemInactive: 'border-slate-200 bg-white',
  valueBlock: 'mt-3',
  select: 'rounded-[8px] border border-slate-200 px-2 py-1 text-sm',
  input: 'w-full rounded-[8px] border border-slate-200 px-2 py-1 text-sm',
  textarea: 'w-full h-24 rounded-[8px] border border-slate-200 px-2 py-2 text-sm font-mono sm:h-28',
  error: 'mt-2 text-xs text-rose-600',
  actions: 'mt-3 flex flex-wrap items-center justify-end gap-2',
  cancel: 'w-full rounded-[8px] border border-slate-200 px-3 py-1 text-sm sm:w-auto',
  submit: 'w-full rounded-[8px] bg-emerald-500 px-3 py-1 text-sm text-white flex items-center gap-2 sm:w-auto',
  expandWrap: 'overflow-hidden transition-all duration-300',
  expandOpen: 'max-h-[520px] opacity-100',
  expandClosed: 'max-h-0 opacity-0',
  expandInner: 'transform transition-all duration-300',
  expandInnerOpen: 'translate-y-0 opacity-100',
  expandInnerClosed: '-translate-y-2 opacity-0',
};

const typeOptions = [
  { key: 'string', label: 'String', icon: Type, tone: 'text-emerald-700' },
  { key: 'number', label: 'Number', icon: Zap, tone: 'text-blue-600' },
  { key: 'boolean', label: 'Boolean', icon: ToggleLeft, tone: 'text-rose-600' },
  { key: 'object', label: 'Object', icon: Square, tone: 'text-indigo-600' },
  { key: 'array', label: 'Array', icon: List, tone: 'text-amber-600' },
  { key: 'objectId', label: 'ObjectId', icon: Zap, tone: 'text-slate-600' },
  { key: 'reference', label: 'Reference', icon: Link2, tone: 'text-slate-600' },
  { key: 'json', label: 'JSON', icon: Code, tone: 'text-slate-700' },
];

interface InlineSegmentEditorProps {
  mode: 'collection' | 'document' | 'field';
  parentPath?: JsonPathSegment[];
  parentIsArray?: boolean;
  nextArrayIndex?: number;
  rootDocumentId?: string | null;
  onCancel: () => void;
  onSubmitField?: (rootId: string, path: JsonPathSegment[], segment: JsonPathSegment, value: unknown) => void;
  onSubmitDocument?: (doc: Document) => void;
  onSubmitCollection?: (name: string) => void;
}

const DEFAULT_DOC_JSON = '{\n  "title": ""\n}';

export function AddInlineSegmentEditor({
  mode,
  parentPath = [],
  parentIsArray = false,
  nextArrayIndex = 0,
  rootDocumentId = null,
  onCancel,
  onSubmitField,
  onSubmitDocument,
  onSubmitCollection,
}: InlineSegmentEditorProps) {
  const forcedType = mode === 'collection' ? 'string' : mode === 'document' ? 'json' : null;
  const availableTypes = mode === 'field' ? typeOptions : typeOptions.filter((item) => item.key === forcedType);

  const [keyName, setKeyName] = useState('');
  const [selectedType, setSelectedType] = useState(forcedType ?? 'string');
  const [showTypePanel, setShowTypePanel] = useState(false);
  const [textValue, setTextValue] = useState('');
  const [boolValue, setBoolValue] = useState(true);
  const [numValue, setNumValue] = useState<number | ''>('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [docTitle, setDocTitle] = useState('');
  const [docJson, setDocJson] = useState(DEFAULT_DOC_JSON);
  const [keyError, setKeyError] = useState<string | null>(null);

  const selected = useMemo(() => availableTypes.find((t) => t.key === selectedType) ?? availableTypes[0], [selectedType, availableTypes]);

  useEffect(() => {
    if (forcedType) setSelectedType(forcedType);
  }, [forcedType]);

  useEffect(() => {
    if (mode !== 'document') return;
    try {
      const parsed = JSON.parse(docJson);
      if (parsed && typeof parsed === 'object') {
        const title = (parsed as Record<string, unknown>).title;
        if (typeof title === 'string') setDocTitle(title);
      }
    } catch {
      // ignore invalid JSON
    }
  }, [docJson, mode]);

  const reset = () => {
    setKeyName('');
    setSelectedType(forcedType ?? 'string');
    setTextValue('');
    setBoolValue(true);
    setNumValue('');
    setJsonError(null);
    setDocTitle('');
    setDocJson(DEFAULT_DOC_JSON);
    setKeyError(null);
  };

  const handleSubmit = () => {
    setJsonError(null);
    setKeyError(null);

    if (mode === 'collection') {
      const name = keyName.trim();
      if (!name) {
        setKeyError('Collection name is required');
        return;
      }
      onSubmitCollection?.(name);
      reset();
      onCancel();
      return;
    }

    if (mode === 'document') {
      if (!onSubmitDocument) return;
      try {
        const parsed = JSON.parse(docJson || '{}');
        const next = parsed && typeof parsed === 'object' ? { ...parsed } as Record<string, unknown> : {};
        if (docTitle) next.title = docTitle;
        onSubmitDocument(next as Document);
        reset();
        onCancel();
        return;
      } catch (err) {
        setJsonError(err instanceof Error ? err.message : 'Invalid JSON');
        return;
      }
    }

    if (!onSubmitField || !rootDocumentId) return;

    if (!parentIsArray) {
      const name = keyName.trim();
      if (!name) {
        setKeyError('Key is required');
        return;
      }
    }

    let value: unknown = null;
    if (selectedType === 'string') value = textValue;
    else if (selectedType === 'number') value = numValue === '' ? 0 : Number(numValue);
    else if (selectedType === 'boolean') value = boolValue;
    else if (selectedType === 'objectId') value = wrapOid(createObjectId());
    else if (selectedType === 'reference') {
      const trimmed = textValue.trim();
      let oid = extractOid(trimmed);
      if (!oid) {
        try {
          const parsed = JSON.parse(trimmed);
          oid = extractOid(parsed);
        } catch {
          oid = null;
        }
      }
      value = wrapOid(oid ?? createObjectId());
    } else if (selectedType === 'object' || selectedType === 'array' || selectedType === 'json') {
      try {
        if (!textValue.trim()) {
          value = selectedType === 'array' ? [] : {};
        } else {
          value = JSON.parse(textValue);
        }
      } catch (err) {
        setJsonError(err instanceof Error ? err.message : 'Invalid JSON');
        return;
      }
    }

    const segment = parentIsArray
      ? ({ type: 'index', index: nextArrayIndex } as JsonPathSegment)
      : ({ type: 'key', key: keyName.trim() } as JsonPathSegment);

    onSubmitField(rootDocumentId, parentPath, segment, value);
    reset();
    onCancel();
  };

  const renderKeyInput = () => {
    if (mode === 'document') {
      return (
        <input
            value={docTitle}
            onChange={(e) => {
              const nextTitle = e.target.value;
              setDocTitle(nextTitle);
              try {
                const parsed = JSON.parse(docJson || '{}');
                if (parsed && typeof parsed === 'object') {
                  (parsed as Record<string, unknown>).title = nextTitle;
                  setDocJson(JSON.stringify(parsed, null, 2));
                }
              } catch {
                // ignore invalid JSON while typing
              }
            }}
            placeholder="document title"
            className={styles.input}
          />
      );
    }
    if (mode === 'collection') {
      return (
        <input
          value={keyName}
          onChange={(e) => setKeyName(e.target.value)}
          placeholder="collection name"
          className={styles.keyInput}
        />
      );
    }
    if (parentIsArray) return <span className={styles.badge}>Index: {nextArrayIndex}</span>;
    return (
      <input
        value={keyName}
        onChange={(e) => setKeyName(e.target.value)}
        placeholder="key name"
        className={styles.keyInput}
      />
    );
  };

  const renderTypeSelector = () => (
    <button
      type="button"
      onClick={() => setShowTypePanel((s) => !s)}
      className={cn(styles.typeButton, forcedType && styles.typeButtonDisabled)}
      disabled={Boolean(forcedType)}
    >
      <selected.icon className={cn(styles.icon, selected.tone)} />
      <span className={styles.typeButtonLabel}>{selected.label}</span>
    </button>
  );

  const renderValueInput = () => {
    if (mode === 'document') {
      return (
        <div className={styles.valueBlock}>
          <textarea
            value={docJson}
            onChange={(e) => setDocJson(e.target.value)}
            className={styles.textarea}
          />
        </div>
      );
    }

    if (selectedType === 'boolean') {
      return (
        <div className={styles.valueBlock}>
          <select value={String(boolValue)} onChange={(e) => setBoolValue(e.target.value === 'true')} className={styles.select}>
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        </div>
      );
    }
    if (selectedType === 'number') {
      return (
        <div className={styles.valueBlock}>
          <input type="number" value={numValue as any} onChange={(e) => setNumValue(e.target.value === '' ? '' : Number(e.target.value))} className={styles.input} />
        </div>
      );
    }
    if (selectedType === 'object' || selectedType === 'array' || selectedType === 'json' || selectedType === 'reference') {
      return (
        <div className={styles.valueBlock}>
          <textarea
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            className={styles.textarea}
            placeholder={selectedType === 'reference' ? 'Paste target ObjectId or JSON {"$oid": "..."}' : 'Paste JSON here, or leave empty for {} / []'}
          />
        </div>
      );
    }
    if (selectedType === 'objectId') {
      return (
        <div className={styles.valueBlock}>
          <div className={styles.badge}>ObjectId will be generated automatically</div>
        </div>
      );
    }
    return (
      <div className={styles.valueBlock}>
        <input value={textValue} onChange={(e) => setTextValue(e.target.value)} className={styles.input} />
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        {renderTypeSelector()}
        {renderKeyInput()}
      </div>

      {mode === 'field' ? (
        <div className={cn(styles.typePanel, showTypePanel ? styles.typePanelOpen : styles.typePanelClosed)}>
          <div className={styles.typeList}>
            {availableTypes.map((opt) => {
              const Icon = opt.icon;
              const active = opt.key === selectedType;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    setSelectedType(opt.key);
                    setShowTypePanel(false);
                  }}
                  className={cn(styles.typeItem, active ? styles.typeItemActive : styles.typeItemInactive)}
                >
                  <Icon className={cn(styles.icon, opt.tone)} />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {renderValueInput()}
      {keyError ? <div className={styles.error}>{keyError}</div> : null}
      {jsonError ? <div className={styles.error}>{jsonError}</div> : null}

      <div className={styles.actions}>
        <button type="button" onClick={onCancel} className={styles.cancel}>Cancel</button>
        <button type="button" onClick={handleSubmit} className={styles.submit}>
          <Check className={styles.icon} />
          Add
        </button>
      </div>
    </div>
  );
}

export default AddInlineSegmentEditor;
