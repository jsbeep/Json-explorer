import { useEffect, useMemo, useState } from 'react';
import { Check, Code, Link2, List, Square, ToggleLeft, Type, Zap } from 'lucide-react';
import type { Document } from '../types/explorer';
import type { JsonPathSegment } from '../types/explorer-ui';
import { cn } from '../utils/cn';
import { createObjectId } from '../utils/objectId';
import { extractOid, wrapOid } from '../utils/oid';

type EditorValueType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'objectId' | 'reference' | 'json';

type InitialEditorData = {
  key?: string;
  value?: unknown;
  type?: EditorValueType;
  document?: Document;
};

const styles = {
  containerBase: 'containerBase rounded-[10px] border p-2 transition sm:p-3',
  containerAdd: 'border-dashed border-emerald-200/70 bg-emerald-50/20',
  containerEdit: 'border-emerald-200/80 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.08)]',
  headerRow: 'flex flex-col gap-2 sm:flex-row sm:items-center',
  keyInput: 'w-full rounded-[8px] border border-slate-200 px-2 py-1 text-sm sm:flex-1',
  keyInputDisabled: 'cursor-not-allowed bg-slate-100 text-slate-500',
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
  keyError: 'mt-2 text-xs text-red-500',
  actions: 'mt-3 flex flex-wrap items-center justify-end gap-2',
  cancel: 'w-full rounded-[8px] border border-slate-200 px-3 py-1 text-sm sm:w-auto',
  submit: 'w-full rounded-[8px] bg-emerald-500 px-3 py-1 text-sm text-white flex items-center gap-2 sm:w-auto',
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
] as const;

interface InlineSegmentEditorProps {
  mode: 'collection' | 'document' | 'field';
  parentPath?: JsonPathSegment[];
  parentIsArray?: boolean;
  nextArrayIndex?: number;
  rootDocumentId?: string | null;
  editSegment?: JsonPathSegment | null;
  isEdit?: boolean;
  lockKey?: boolean;
  initialData?: InitialEditorData;
  existingKeys?: string[];
  onCancel: () => void;
  onSubmitField?: (
    rootId: string,
    path: JsonPathSegment[],
    segment: JsonPathSegment,
    value: unknown,
    nextKey?: string
  ) => void;
  onSubmitDocument?: (doc: Document) => void;
  onSubmitCollection?: (name: string) => void;
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const inferValueType = (value: unknown): EditorValueType => {
  if (value === null || value === undefined) return 'string';
  if (Array.isArray(value)) return 'array';
  if (isPlainObject(value)) {
    const oid = extractOid(value);
    if (oid) return 'objectId';
    return 'object';
  }
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  return 'string';
};

export function InlineSegmentEditor({
  mode,
  parentPath = [],
  parentIsArray = false,
  nextArrayIndex = 0,
  rootDocumentId = null,
  editSegment = null,
  isEdit = false,
  lockKey = false,
  initialData,
  existingKeys,
  onCancel,
  onSubmitField,
  onSubmitDocument,
  onSubmitCollection,
}: InlineSegmentEditorProps) {
  const forcedType = mode === 'collection' ? 'string' : mode === 'document' ? 'json' : null;
  const availableTypes = mode === 'field' ? typeOptions : typeOptions.filter((item) => item.key === forcedType);

  const [keyName, setKeyName] = useState('');
  const [selectedType, setSelectedType] = useState<EditorValueType>(forcedType ?? 'string');
  const [showTypePanel, setShowTypePanel] = useState(false);
  const [textValue, setTextValue] = useState('');
  const [boolValue, setBoolValue] = useState(true);
  const [numValue, setNumValue] = useState<number | ''>('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [docTitle, setDocTitle] = useState('');
  const [keyError, setKeyError] = useState<string | null>(null);
  const [baseDocument, setBaseDocument] = useState<Document | null>(null);
  const [baseValue, setBaseValue] = useState<unknown>(undefined);

  const selected = useMemo(
    () => availableTypes.find((t) => t.key === selectedType) ?? availableTypes[0],
    [selectedType, availableTypes]
  );

  useEffect(() => {
    if (forcedType) setSelectedType(forcedType);
  }, [forcedType]);

  useEffect(() => {
    if (!initialData) return;
    if (mode === 'collection') {
      setKeyName(initialData.key ?? '');
      return;
    }
    if (mode === 'document') {
      const doc = initialData.document;
      setBaseDocument(doc ?? null);
      if (doc) {
        const title = typeof doc.title === 'string' ? doc.title : '';
        setDocTitle(title);
      }
      return;
    }

    const nextKey = initialData.key ?? '';
    const nextType = initialData.type ?? inferValueType(initialData.value);
    setKeyName(nextKey);
    setSelectedType(nextType);
    setShowTypePanel(false);
    setBaseValue(initialData.value);

    if (nextType === 'boolean') {
      setBoolValue(Boolean(initialData.value));
      return;
    }
    if (nextType === 'number') {
      const numberValue = typeof initialData.value === 'number' ? initialData.value : Number(initialData.value ?? 0);
      setNumValue(Number.isNaN(numberValue) ? 0 : numberValue);
      return;
    }
    if (nextType === 'objectId') {
      const oid = extractOid(initialData.value) ?? '';
      setTextValue(oid);
      return;
    }
    if (nextType === 'reference') {
      const oid = extractOid(initialData.value) ?? (typeof initialData.value === 'string' ? initialData.value : '');
      setTextValue(oid);
      return;
    }
    if (nextType === 'object' || nextType === 'array' || nextType === 'json') {
      if (initialData.value === undefined) {
        setTextValue('');
        return;
      }
      if (typeof initialData.value === 'string') {
        setTextValue(initialData.value);
        return;
      }
      try {
        setTextValue(JSON.stringify(initialData.value, null, 2));
      } catch {
        setTextValue('');
      }
      return;
    }
    setTextValue(typeof initialData.value === 'string' ? initialData.value : String(initialData.value ?? ''));
  }, [initialData, mode]);

  useEffect(() => {
    if (mode !== 'document' || initialData?.document) return;
    setBaseDocument(null);
  }, [initialData, mode]);

  const reset = () => {
    if (isEdit) return;
    setKeyName('');
    setSelectedType(forcedType ?? 'string');
    setTextValue('');
    setBoolValue(true);
    setNumValue('');
    setJsonError(null);
    setDocTitle('');
    setKeyError(null);
    setBaseDocument(null);
    setBaseValue(undefined);
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
      const nextDoc = {
        ...(baseDocument ?? {}),
        title: docTitle,
      } as Document;
      onSubmitDocument(nextDoc);
      reset();
      onCancel();
      return;
    }

    if (!onSubmitField || !rootDocumentId) return;

    if (!parentIsArray) {
      const name = keyName.trim();
      if (!name) {
        setKeyError('Key is required');
        return;
      }
      const originalKey = editSegment?.type === 'key' ? editSegment.key : null;
      if (existingKeys?.includes(name) && name !== originalKey) {
        setKeyError('Key already exists at this level');
        return;
      }
    }

    const keyOnlyEdit = isEdit && (selectedType === 'object' || selectedType === 'array' || selectedType === 'reference');
    let value: unknown = null;
    if (keyOnlyEdit) {
      value = baseValue;
    } else if (selectedType === 'string') value = textValue;
    else if (selectedType === 'number') value = numValue === '' ? 0 : Number(numValue);
    else if (selectedType === 'boolean') value = boolValue;
    else if (selectedType === 'objectId') {
      const oid = extractOid(textValue.trim());
      value = wrapOid(oid ?? createObjectId());
    }
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

    const segment = editSegment ?? (
      parentIsArray
        ? ({ type: 'index', index: nextArrayIndex } as JsonPathSegment)
        : ({ type: 'key', key: keyName.trim() } as JsonPathSegment)
    );

    const nextKey = !parentIsArray && segment.type === 'key' ? keyName.trim() : undefined;
    onSubmitField(rootDocumentId, parentPath, segment, value, nextKey);
    reset();
    onCancel();
  };

  const renderKeyInput = () => {
    if (mode === 'document') {
      return (
        <input
          value={docTitle}
          onChange={(e) => {
            setDocTitle(e.target.value);
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
          className={cn(styles.keyInput, lockKey && styles.keyInputDisabled)}
          disabled={lockKey}
        />
      );
    }
    if (parentIsArray) return <span className={styles.badge}>Index: {nextArrayIndex}</span>;
    return (
      <input
        value={keyName}
        onChange={(e) => setKeyName(e.target.value)}
        placeholder="key name"
        className={cn(styles.keyInput, lockKey && styles.keyInputDisabled)}
        disabled={lockKey}
      />
    );
  };

  const renderTypeSelector = () => (
    <button
      type="button"
      onClick={() => setShowTypePanel((s) => !s)}
      className={cn(
        styles.typeButton,
        (forcedType || (isEdit && (selectedType === 'object' || selectedType === 'array' || selectedType === 'reference'))) && styles.typeButtonDisabled
      )}
      disabled={Boolean(forcedType) || (isEdit && (selectedType === 'object' || selectedType === 'array' || selectedType === 'reference'))}
    >
      <selected.icon className={cn(styles.icon, selected.tone)} />
      <span className={styles.typeButtonLabel}>{selected.label}</span>
    </button>
  );

  const renderValueInput = () => {
    if (mode === 'document') {
      return null;
    }

    if (isEdit && (selectedType === 'object' || selectedType === 'array' || selectedType === 'reference')) {
      return null;
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
    <div className={cn(styles.containerBase, isEdit ? styles.containerEdit : styles.containerAdd)}>
      <div className={styles.headerRow}>
        {mode === 'field' ? renderTypeSelector() : null}
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
      {keyError ? <div className={styles.keyError}>{keyError}</div> : null}
      {jsonError ? <div className={styles.error}>{jsonError}</div> : null}

      <div className={styles.actions}>
        <button type="button" onClick={onCancel} className={styles.cancel}>Cancel</button>
        <button type="button" onClick={handleSubmit} className={styles.submit}>
          <Check className={styles.icon} />
          {isEdit ? 'Save' : 'Add'}
        </button>
      </div>
    </div>
  );
}

export default InlineSegmentEditor;
