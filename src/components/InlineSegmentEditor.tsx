import { useMemo, useState } from 'react';
import { Check, Code, List, MoreHorizontal, Square, ToggleLeft, Type, Zap } from 'lucide-react';
import type { Document } from '../types/explorer';
import type { JsonPathSegment } from '../types/explorer-ui';
import { cn } from '../utils/cn';

const typeOptions = [
  { key: 'string', label: 'String', icon: Type, tone: 'text-emerald-700' },
  { key: 'number', label: 'Number', icon: Zap, tone: 'text-blue-600' },
  { key: 'boolean', label: 'Boolean', icon: ToggleLeft, tone: 'text-rose-600' },
  { key: 'object', label: 'Object', icon: Square, tone: 'text-indigo-600' },
  { key: 'array', label: 'Array', icon: List, tone: 'text-amber-600' },
  { key: 'reference', label: 'Reference', icon: MoreHorizontal, tone: 'text-slate-600' },
  { key: 'json', label: 'JSON', icon: Code, tone: 'text-slate-700' },
];

interface InlineSegmentEditorProps {
  mode: 'field' | 'document';
  parentPath?: JsonPathSegment[];
  rootDocumentId?: string | null;
  onCancel: () => void;
  onSubmitField?: (rootId: string, path: JsonPathSegment[], key: string, value: unknown) => void;
  onSubmitDocument?: (doc: Document) => void;
}

export function InlineSegmentEditor({
  mode,
  parentPath = [],
  rootDocumentId = null,
  onCancel,
  onSubmitField,
  onSubmitDocument,
}: InlineSegmentEditorProps) {
  const [keyName, setKeyName] = useState('');
  const [selectedType, setSelectedType] = useState('string');
  const [showTypePanel, setShowTypePanel] = useState(false);
  const [textValue, setTextValue] = useState('');
  const [boolValue, setBoolValue] = useState(true);
  const [numValue, setNumValue] = useState<number | ''>('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  const selected = useMemo(() => typeOptions.find((t) => t.key === selectedType) ?? typeOptions[0], [selectedType]);

  const reset = () => {
    setKeyName('');
    setSelectedType('string');
    setTextValue('');
    setBoolValue(true);
    setNumValue('');
    setJsonError(null);
  };

  const handleSubmit = () => {
    if (mode === 'field') {
      if (!onSubmitField || !rootDocumentId) return;
      let value: unknown = null;
      if (selectedType === 'string') value = textValue;
      else if (selectedType === 'number') value = numValue === '' ? 0 : Number(numValue);
      else if (selectedType === 'boolean') value = boolValue;
      else if (selectedType === 'object' || selectedType === 'array' || selectedType === 'json') {
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
      } else if (selectedType === 'reference') {
        value = String(textValue || '');
      }
      onSubmitField(rootDocumentId, parentPath, keyName, value);
      reset();
      onCancel();
      return;
    }

    if (mode === 'document') {
      if (!onSubmitDocument) return;
      if (selectedType === 'json') {
        try {
          const parsed = JSON.parse(textValue || '{}');
          onSubmitDocument(parsed as Document);
          reset();
          onCancel();
          return;
        } catch (err) {
          setJsonError(err instanceof Error ? err.message : 'Invalid JSON');
          return;
        }
      }
      // For non-JSON document mode, create a minimal doc
      const doc: Document = { _id: undefined as unknown as string } as Document;
      if (keyName) {
        if (selectedType === 'string') (doc as any)[keyName] = textValue;
        if (selectedType === 'number') (doc as any)[keyName] = numValue === '' ? 0 : Number(numValue);
        if (selectedType === 'boolean') (doc as any)[keyName] = boolValue;
        if (selectedType === 'reference') (doc as any)[keyName] = String(textValue || '');
      }
      onSubmitDocument(doc);
      reset();
      onCancel();
    }
  };

  return (
    <div className="mt-3 rounded-[10px] border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-2">
        {mode === 'field' ? (
          <input value={keyName} onChange={(e) => setKeyName(e.target.value)} placeholder="key name" className="flex-1 rounded-[8px] border border-slate-200 px-2 py-1 text-sm" />
        ) : (
          <div className="text-sm font-semibold">New document</div>
        )}

        <button type="button" onClick={() => setShowTypePanel((s) => !s)} className="rounded-[8px] border border-slate-200 px-3 py-1 text-xs flex items-center gap-2">
          <selected.icon className={cn('h-4 w-4', (selected as any).tone)} />
          <span className="font-semibold text-sm">{selected.label}</span>
        </button>
      </div>

      <div className={cn('mt-3 overflow-hidden transition-all w-full', showTypePanel ? 'max-h-40' : 'max-h-0')}>
        <div className="flex flex-wrap gap-2 py-2 w-full">
          {typeOptions.map((opt) => {
            const Icon = opt.icon;
            const active = opt.key === selectedType;
            return (
              <button key={opt.key} type="button" onClick={() => { setSelectedType(opt.key); setShowTypePanel(false); }} className={cn('rounded-md border px-3 py-1 text-sm flex items-center gap-2', active ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-white') }>
                <Icon className={cn('h-4 w-4', opt.tone)} />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3">
        {selectedType === 'boolean' ? (
          <select value={String(boolValue)} onChange={(e) => setBoolValue(e.target.value === 'true')} className="rounded-[8px] border border-slate-200 px-2 py-1 text-sm">
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        ) : selectedType === 'number' ? (
          <input type="number" value={numValue as any} onChange={(e) => setNumValue(e.target.value === '' ? '' : Number(e.target.value))} className="w-full rounded-[8px] border border-slate-200 px-2 py-1 text-sm" />
        ) : (selectedType === 'object' || selectedType === 'array' || selectedType === 'json') ? (
          <textarea value={textValue} onChange={(e) => setTextValue(e.target.value)} className="w-full h-28 rounded-[8px] border border-slate-200 px-2 py-2 text-sm font-mono" placeholder='Paste JSON here, or leave empty for {} / []'/>
        ) : (
          <input value={textValue} onChange={(e) => setTextValue(e.target.value)} className="w-full rounded-[8px] border border-slate-200 px-2 py-1 text-sm" />
        )}
        {jsonError ? <div className="mt-2 text-xs text-rose-600">{jsonError}</div> : null}
      </div>

      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-[8px] border border-slate-200 px-3 py-1 text-sm">Cancel</button>
        <button type="button" onClick={handleSubmit} className="rounded-[8px] bg-emerald-500 px-3 py-1 text-sm text-white flex items-center gap-2">
          <Check className="h-4 w-4" />
          Add
        </button>
      </div>
    </div>
  );
}

export default InlineSegmentEditor;
