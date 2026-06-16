import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, X, Trash2, ChevronRight, ToggleLeft, Hash, Type, Braces, List, Link } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { JsonValue } from '../../types/explorer';

// ── 타입 정의 ─────────────────────────────────────────────────────────────────

type FieldType = 'String' | 'Number' | 'Boolean' | 'Object' | 'Array' | 'DBRef';

interface TypeMeta {
  label: string;
  icon: React.ReactNode;
}

const TYPE_META: Record<FieldType, TypeMeta> = {
  String: { label: 'String', icon: <Type size={12} /> },
  Number: { label: 'Number', icon: <Hash size={12} /> },
  Boolean: { label: 'Boolean', icon: <ToggleLeft size={12} /> },
  Object: { label: 'Object', icon: <Braces size={12} /> },
  Array: { label: 'Array', icon: <List size={12} /> },
  DBRef: { label: 'DBRef', icon: <Link size={12} /> },
};

const ALL_TYPES: FieldType[] = ['String', 'Number', 'Boolean', 'Object', 'Array', 'DBRef'];

// ── Props ─────────────────────────────────────────────────────────────────────

export interface InlineSegmentEditorSubmitData {
  key: string;
  label?: string;
  type?: FieldType;
  value?: JsonValue;
}

interface InlineSegmentEditorProps {
  mode: 'add' | 'edit';
  level: 'collection' | 'document' | 'field';
  initialKey?: string;
  initialLabel?: string;
  initialType?: FieldType;
  initialValue?: JsonValue;
  siblingKeys: string[];
  onSubmit: (data: InlineSegmentEditorSubmitData) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => void;
}

// ── 스타일 ────────────────────────────────────────────────────────────────────

const styles = {
  container: 'z-10 rounded-xl border bg-white overflow-hidden',
  containerAdd: 'border-dashed border-emerald-300 shadow-none',
  containerEdit: 'border-slate-200 shadow-sm',
  inner: 'p-2.5 flex flex-col gap-2',
  row: 'flex items-center gap-2',
  input: 'flex-1 min-w-0 text-sm px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:border-emerald-400 focus:bg-white transition-colors',
  inputError: 'border-red-400 bg-red-50',
  errorMsg: 'text-xs text-red-500',
  // 타입 선택기
  typeBtn: 'shrink-0 flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50 transition-colors font-medium text-slate-600 whitespace-nowrap',
  typeAccordion: 'flex items-center gap-1 overflow-x-auto',
  typeTab: 'shrink-0 flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-colors font-medium text-slate-500 cursor-pointer whitespace-nowrap',
  typeTabActive: 'border-emerald-400 bg-emerald-50 text-emerald-700',
  // 값 입력
  valueInput: 'w-full text-sm px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:border-emerald-400 focus:bg-white transition-colors',
  textarea: 'w-full text-sm px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:border-emerald-400 focus:bg-white transition-colors font-mono resize-none',
  toggle: 'relative w-10 h-5 rounded-full border transition-colors cursor-pointer shrink-0',
  toggleThumb: 'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
  // 액션 버튼
  actions: 'flex items-center gap-1 ml-auto',
  actionBtn: 'p-1.5 rounded-lg transition-colors',
  deleteBtn: 'hover:bg-red-50 text-slate-400 hover:text-red-500',
  submitBtn: 'bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50',
  cancelBtn: 'hover:bg-slate-100 text-slate-400 hover:text-slate-600',
} as const;

// ── 컴포넌트 ──────────────────────────────────────────────────────────────────

export function InlineSegmentEditor({
  mode,
  level,
  initialKey = '',
  initialLabel = '',
  initialType = 'String',
  initialValue,
  siblingKeys,
  onSubmit,
  onCancel,
  onDelete,
}: InlineSegmentEditorProps) {
  const [keyValue, setKeyValue] = useState(initialKey);
  const [labelValue, setLabelValue] = useState(initialLabel || initialKey);
  const [selectedType, setSelectedType] = useState<FieldType>(initialType);
  const [typeAccordionOpen, setTypeAccordionOpen] = useState(false);
  const [rawValue, setRawValue] = useState(() => {
    if (initialValue === undefined) return '';
    if (typeof initialValue === 'boolean') return String(initialValue);
    if (typeof initialValue === 'string') return initialValue;
    if (typeof initialValue === 'number') return String(initialValue);
    return JSON.stringify(initialValue, null, 2);
  });
  const [boolValue, setBoolValue] = useState(
    typeof initialValue === 'boolean' ? initialValue : false,
  );
  const [isPending, setIsPending] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const keyInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    keyInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (mode === 'add') {
      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [mode]);

  // ── 유효성 검사 ──────────────────────────────────────────────────────────────

  const isDuplicate =
    keyValue.trim() !== '' &&
    keyValue.trim() !== initialKey &&
    siblingKeys.includes(keyValue.trim());

  const isObjectOrArray = selectedType === 'Object' || selectedType === 'Array';
  const isContainerEditMode = mode === 'edit' && isObjectOrArray;

  // collection/document 레벨은 key+label만 있음
  const isSimpleLevel = level === 'collection' || level === 'document';

  const canSubmit =
    keyValue.trim() !== '' &&
    !isDuplicate &&
    !isPending;

  // ── 값 파싱 ──────────────────────────────────────────────────────────────────

  const parseValue = (): JsonValue => {
    if (selectedType === 'Boolean') return boolValue;
    if (selectedType === 'Number') return Number(rawValue) || 0;
    if (selectedType === 'Object') {
      try { return JSON.parse(rawValue) as JsonValue; } catch { return {}; }
    }
    if (selectedType === 'Array') {
      try { return JSON.parse(rawValue) as JsonValue; } catch { return []; }
    }
    return rawValue;
  };

  // ── 제출 ─────────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsPending(true);
    try {
      await onSubmit({
        key: keyValue.trim(),
        label: isSimpleLevel ? labelValue.trim() || keyValue.trim() : undefined,
        type: isSimpleLevel ? undefined : selectedType,
        value: isSimpleLevel || isContainerEditMode ? undefined : parseValue(),
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <motion.div
      ref={containerRef}
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className={cn(
        styles.container,
        mode === 'add' ? styles.containerAdd : styles.containerEdit,
      )}
    >
      <div className={styles.inner}>
        {/* Key 입력 */}
        <div className={styles.row}>
          <input
            ref={keyInputRef}
            type="text"
            className={cn(styles.input, isDuplicate && styles.inputError)}
            placeholder={level === 'collection' ? '컬렉션 이름 (영문)' : level === 'document' ? '문서 ID' : '키 이름'}
            value={keyValue}
            onChange={(e) => setKeyValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void handleSubmit(); if (e.key === 'Escape') onCancel(); }}
          />

          {/* 액션 버튼 */}
          <div className={styles.actions}>
            {onDelete && (
              <button type="button" className={cn(styles.actionBtn, styles.deleteBtn)} onClick={onDelete}>
                <Trash2 size={14} />
              </button>
            )}
            <button
              type="button"
              className={cn(styles.actionBtn, styles.submitBtn)}
              onClick={() => void handleSubmit()}
              disabled={!canSubmit}
            >
              <Check size={14} />
            </button>
            <button type="button" className={cn(styles.actionBtn, styles.cancelBtn)} onClick={onCancel}>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Label 입력 (collection/document 레벨) */}
        {isSimpleLevel && (
          <input
            type="text"
            className={styles.input}
            placeholder="표시 이름 (선택)"
            value={labelValue}
            onChange={(e) => setLabelValue(e.target.value)}
          />
        )}

        {/* 중복 에러 */}
        {isDuplicate && (
          <p className={styles.errorMsg}>이미 존재하는 이름입니다.</p>
        )}

        {/* 필드 레벨: 타입 선택기 + 값 입력 */}
        {level === 'field' && !isContainerEditMode && (
          <>
            {/* Horizontal Accordion 타입 선택기 */}
            <div className={styles.row}>
              <button
                type="button"
                className={styles.typeBtn}
                onClick={() => setTypeAccordionOpen((v) => !v)}
              >
                {TYPE_META[selectedType].icon}
                <span>{selectedType}</span>
                <ChevronRight
                  size={12}
                  className={cn('transition-transform', typeAccordionOpen && 'rotate-90')}
                />
              </button>

              <AnimatePresence>
                {typeAccordionOpen && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 'auto', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                    className={styles.typeAccordion}
                  >
                    {ALL_TYPES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        className={cn(styles.typeTab, selectedType === t && styles.typeTabActive)}
                        onClick={() => {
                          setSelectedType(t);
                          setTypeAccordionOpen(false);
                        }}
                      >
                        {TYPE_META[t].icon}
                        <span>{t}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 값 입력 */}
            {selectedType === 'Boolean' ? (
              <div className={styles.row}>
                <span className="text-xs text-slate-500">값</span>
                <button
                  type="button"
                  className={cn(
                    styles.toggle,
                    boolValue ? 'bg-emerald-500 border-emerald-500' : 'bg-slate-200 border-slate-200',
                  )}
                  onClick={() => setBoolValue((v) => !v)}
                  role="switch"
                  aria-checked={boolValue}
                >
                  <span
                    className={cn(styles.toggleThumb, boolValue && 'translate-x-5')}
                  />
                </button>
                <span className="text-xs text-slate-500">{boolValue ? 'true' : 'false'}</span>
              </div>
            ) : selectedType === 'Object' || selectedType === 'Array' ? (
              <textarea
                className={styles.textarea}
                rows={4}
                placeholder={selectedType === 'Object' ? '{ "key": "value" }' : '[ "item1", "item2" ]'}
                value={rawValue}
                onChange={(e) => setRawValue(e.target.value)}
              />
            ) : (
              <input
                type={selectedType === 'Number' ? 'number' : 'text'}
                className={styles.valueInput}
                placeholder="값"
                value={rawValue}
                onChange={(e) => setRawValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') void handleSubmit(); if (e.key === 'Escape') onCancel(); }}
              />
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
