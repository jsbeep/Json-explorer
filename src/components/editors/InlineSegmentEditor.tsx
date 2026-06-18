import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, X, Trash2, ChevronRight, ToggleLeft, Hash, Type, Braces, List, Link, KeyRound, Zap, RefreshCw, ClipboardPaste, Upload, Copy, Download } from 'lucide-react';
import { cn } from '../../utils/cn';
import { SPRING_SOFT } from '../../utils/motionPresets';
import type { JsonValue } from '../../types/explorer';
import { getCollections, getDocuments, type ReferenceInfo } from '../../services/mockAPI';
import { generateObjectId } from '../../utils/objectId';
import { copyToClipboard } from '../../utils/clipboard';

// ── 타입 정의 ─────────────────────────────────────────────────────────────────

type FieldType = 'String' | 'Number' | 'Boolean' | 'Object' | 'Array' | 'ObjectID';

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
  ObjectID: { label: 'ObjectID', icon: <KeyRound size={12} /> },
};

const ALL_TYPES: FieldType[] = ['String', 'Number', 'Boolean', 'Object', 'Array', 'ObjectID'];

const isInvalidJson = (text: string): boolean => {
  try { JSON.parse(text); return false; } catch { return true; }
};

// ── Props ─────────────────────────────────────────────────────────────────────

export interface InlineSegmentEditorSubmitData {
  key: string;
  label?: string;
  type?: FieldType;
  value?: JsonValue;
  objectIdMode?: 'generate' | 'pick';
  importedJson?: JsonValue;
}

interface InlineSegmentEditorProps {
  mode: 'add' | 'edit';
  level: 'collection' | 'document' | 'field';
  initialKey?: string;
  initialType?: FieldType;
  initialValue?: JsonValue;
  siblingKeys: string[];
  activeDatabaseName?: string | null;
  currentRefInfo?: ReferenceInfo | null;
  // edit 모드(collection/document)에서 Export 시 내보낼 전체 JSON을 비동기로 가져옴
  onExportRequest?: () => Promise<JsonValue>;
  onSubmit: (data: InlineSegmentEditorSubmitData) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => void;
}

// ── 스타일 ────────────────────────────────────────────────────────────────────

const styles = {
  container: 'mx-1 my-1 z-10 rounded-2xl bg-white ring-1 shadow-[0_4px_20px_rgba(15,23,42,0.08)]',
  containerAdd: 'ring-emerald-200/70 bg-emerald-50/30',
  containerEdit: 'ring-slate-200/70',
  inner: 'p-3 flex flex-col gap-2.5',
  row: 'flex items-center gap-2',
  input: 'flex-1 min-w-0 text-sm px-3 py-2 rounded-xl bg-slate-100/80 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:bg-white transition-all',
  inputError: 'ring-2 ring-red-300 bg-red-50/70',
  errorMsg: 'text-xs text-red-500 px-0.5',
  // 타입 선택기
  typeBtn: 'shrink-0 flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/70 transition-colors font-medium text-slate-600 whitespace-nowrap',
  typeAccordion: 'flex items-center gap-1 overflow-x-auto',
  typeTab: 'shrink-0 flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/70 transition-colors font-medium text-slate-500 cursor-pointer whitespace-nowrap',
  typeTabActive: 'bg-emerald-100 text-emerald-700 font-semibold hover:bg-emerald-100',
  // 값 입력
  valueInput: 'w-full text-sm px-3 py-2 rounded-xl bg-slate-100/80 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:bg-white transition-all',
  oidDisplay: 'flex-1 min-w-0 text-[12px] font-mono text-slate-500 px-3 py-2 rounded-xl bg-slate-100/80 truncate',
  textarea: 'w-full text-sm px-3 py-2 rounded-xl bg-slate-100/80 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:bg-white transition-all font-mono resize-none',
  toggle: 'relative w-10 h-5 rounded-full transition-colors cursor-pointer shrink-0',
  toggleThumb: 'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform',
  // 액션 버튼
  actions: 'flex items-center ml-auto',
  actionBtn: 'p-2 rounded-xl transition-colors',
  deleteBtn: 'hover:bg-red-50 text-slate-400 hover:text-red-500',
  submitBtn: 'text-emerald-500 hover:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none',
  cancelBtn: 'hover:bg-slate-100 text-slate-400 hover:text-slate-600',
} as const;

// ── 컴포넌트 ──────────────────────────────────────────────────────────────────

// 위험 영역(의도적으로 더 쪼개지 않음): 이 컴포넌트는 ObjectID 피커/Import/
// Export/타입 아코디언 4개의 하위 기능을 키 상태 대부분 독립적으로 갖고
// 있어 훅으로 분리하기 쉬워 보이지만, handleSubmit(아래)이 그 4개의 상태를
// 전부 한 번에 읽어 제출 payload를 구성하는 통합 지점이다. 훅으로 쪼개도
// 그 결과값을 결국 handleSubmit까지 다시 끌어올려야 해서 복잡도가 줄지
// 않고, 각 훅의 의존성 배열을 옮기다 하나라도 놓치면 제출 데이터가 조용히
// 빠지는 버그가 생긴다 — 테스트가 없어 타입체커도 못 잡는다. 그래서 그대로
// 두었다. 수정이 꼭 필요하면 Export 쪽(handleExportCopy/Download,
// exportCopied)이 다른 상태에 가장 적게 의존하므로 그 부분부터 볼 것.
export function InlineSegmentEditor({
  mode,
  level,
  initialKey = '',
  initialType = 'String',
  initialValue,
  siblingKeys,
  activeDatabaseName,
  currentRefInfo,
  onExportRequest,
  onSubmit,
  onCancel,
  onDelete,
}: InlineSegmentEditorProps) {
  const [keyValue, setKeyValue] = useState(initialKey);
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
  // ObjectID 타입: 새로 생성 vs 기존 문서 참조 선택
  const [objectIdMode, setObjectIdMode] = useState<'generate' | 'pick'>('generate');
  const [generatedOid, setGeneratedOid] = useState<string>(() => {
    if (initialValue && typeof initialValue === 'object' && !Array.isArray(initialValue) && '$oid' in initialValue) {
      return (initialValue as { $oid: string }).$oid;
    }
    return generateObjectId();
  });
  const [refCollections, setRefCollections] = useState<{ name: string; label: string }[]>([]);
  const [refCollectionName, setRefCollectionName] = useState('');
  const [refDocs, setRefDocs] = useState<{ id: string; title: string }[]>([]);
  const [refDocId, setRefDocId] = useState<string>(() => {
    if (initialValue && typeof initialValue === 'object' && !Array.isArray(initialValue) && '$oid' in initialValue) {
      return (initialValue as { $oid: string }).$oid;
    }
    return '';
  });
  const [isPending, setIsPending] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const refPrefilledRef = useRef(false);

  // Import (collection/document 추가 시 붙여넣기/파일 업로드)
  const [importText, setImportText] = useState('');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export (collection/document 수정 시 복사/다운로드)
  const [exportCopied, setExportCopied] = useState(false);

  // 기존 REF 필드를 수정할 때, 어떤 컬렉션을 참조 중이었는지 한 번만 미리 채워줌
  useEffect(() => {
    if (currentRefInfo && !refPrefilledRef.current) {
      refPrefilledRef.current = true;
      setRefCollectionName(currentRefInfo.collectionName);
    }
  }, [currentRefInfo]);
  const keyInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedType !== 'ObjectID' || objectIdMode !== 'pick' || !activeDatabaseName) return;
    getCollections(activeDatabaseName).then(setRefCollections).catch(() => setRefCollections([]));
  }, [selectedType, objectIdMode, activeDatabaseName]);

  useEffect(() => {
    if (!refCollectionName) { setRefDocs([]); return; }
    getDocuments(refCollectionName)
      .then((docs) => setRefDocs(docs.map((d) => ({ id: d.id, title: d.title }))))
      .catch(() => setRefDocs([]));
  }, [refCollectionName]);

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

  // container(object/array) 수정 모드에서 raw JSON 붙여넣기 검증 — 비어있으면 기존 값 유지로 간주
  const containerJsonError = isContainerEditMode && rawValue.trim() !== '' && isInvalidJson(rawValue);

  // Import 미리보기 textarea의 JSON 유효성 — 비어있으면 import 없이 그냥 제출
  const importJsonError = isImportOpen && importText.trim() !== '' && isInvalidJson(importText);

  const canSubmit =
    keyValue.trim() !== '' &&
    !isDuplicate &&
    !isPending &&
    !containerJsonError &&
    !importJsonError &&
    !(selectedType === 'ObjectID' && objectIdMode === 'pick' && !refDocId);

  // ── Import 헬퍼 ──────────────────────────────────────────────────────────────

  const tryAutoFillKeyFromImport = (text: string) => {
    if (keyValue.trim() !== '') return;
    try {
      const parsed = JSON.parse(text) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const candidate = (parsed as Record<string, unknown>).name ?? (parsed as Record<string, unknown>).title;
        if (typeof candidate === 'string' && candidate.trim()) {
          setKeyValue(candidate);
        }
      }
    } catch {
      // 파싱 실패는 textarea 쪽 에러 메시지로 표시되므로 여기선 무시
    }
  };

  const handlePasteImport = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setImportText(text);
      tryAutoFillKeyFromImport(text);
    } finally {
      setIsImportOpen(true);
    }
  };

  const handleImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      setImportText(text);
      tryAutoFillKeyFromImport(text);
      setIsImportOpen(true);
    };
    reader.readAsText(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImportFile(file);
    e.target.value = '';
  };

  const handleInputDrop = (e: React.DragEvent<HTMLInputElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImportFile(file);
  };

  // ── Export 헬퍼 ──────────────────────────────────────────────────────────────

  const handleExportCopy = async () => {
    if (!onExportRequest) return;
    const json = await onExportRequest();
    await copyToClipboard(JSON.stringify(json, null, 2));
    setExportCopied(true);
    setTimeout(() => setExportCopied(false), 1500);
  };

  const handleExportDownload = async () => {
    if (!onExportRequest) return;
    const json = await onExportRequest();
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(keyValue || initialKey || 'export').trim()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
    if (selectedType === 'ObjectID') {
      return { $oid: objectIdMode === 'pick' ? refDocId : generatedOid };
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
        label: isSimpleLevel ? keyValue.trim() : undefined,
        type: isSimpleLevel ? undefined : selectedType,
        value: isSimpleLevel
          ? undefined
          : isContainerEditMode
            ? (rawValue.trim() !== '' ? (JSON.parse(rawValue) as JsonValue) : undefined)
            : parseValue(),
        objectIdMode: selectedType === 'ObjectID' ? objectIdMode : undefined,
        importedJson: isSimpleLevel && mode === 'add' && importText.trim() !== '' && !importJsonError
          ? (JSON.parse(importText) as JsonValue)
          : undefined,
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <motion.div
      ref={containerRef}
      layout="position"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={SPRING_SOFT}
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
            className={cn(
              styles.input,
              isDuplicate && styles.inputError,
              isDragOver && 'ring-2 ring-emerald-400/60 bg-emerald-50/40',
            )}
            placeholder={level === 'collection' ? '컬렉션 이름 (영문)' : level === 'document' ? '문서 이름' : '키 이름'}
            value={keyValue}
            disabled={mode === 'add' && keyValue.trim() !== '' && !Number.isNaN(Number(keyValue))}
            onChange={(e) => setKeyValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void handleSubmit(); if (e.key === 'Escape') onCancel(); }}
            onDragOver={isSimpleLevel && mode === 'add' ? (e) => { e.preventDefault(); setIsDragOver(true); } : undefined}
            onDragLeave={isSimpleLevel && mode === 'add' ? () => setIsDragOver(false) : undefined}
            onDrop={isSimpleLevel && mode === 'add' ? handleInputDrop : undefined}
          />

          {/* Import: 붙여넣기 / 파일 업로드 */}
          {isSimpleLevel && mode === 'add' && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={handleFileInputChange}
              />
              <button
                type="button"
                className={cn(styles.actionBtn, styles.cancelBtn)}
                title="클립보드에서 붙여넣기"
                onClick={() => void handlePasteImport()}
              >
                <ClipboardPaste size={14} />
              </button>
              <button
                type="button"
                className={cn(styles.actionBtn, styles.cancelBtn)}
                title="파일 업로드"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={14} />
              </button>
            </>
          )}

          {/* Export: 복사 / 다운로드 */}
          {isSimpleLevel && mode === 'edit' && onExportRequest && (
            <>
              <button
                type="button"
                className={cn(styles.actionBtn, styles.cancelBtn)}
                title="JSON 복사"
                onClick={() => void handleExportCopy()}
              >
                {exportCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              </button>
              <button
                type="button"
                className={cn(styles.actionBtn, styles.cancelBtn)}
                title="파일로 다운로드"
                onClick={() => void handleExportDownload()}
              >
                <Download size={14} />
              </button>
            </>
          )}

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
              <Check size={16} />
            </button>
            <button type="button" className={cn(styles.actionBtn, styles.cancelBtn)} onClick={onCancel}>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* 중복 에러 */}
        {isDuplicate && (
          <p className={styles.errorMsg}>이미 존재하는 이름입니다.</p>
        )}

        {/* Import 미리보기 — 붙여넣기/파일 업로드한 JSON 확인 */}
        {isSimpleLevel && mode === 'add' && (
          <AnimatePresence>
            {isImportOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={SPRING_SOFT}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-1">
                  <textarea
                    className={cn(styles.textarea, importJsonError && styles.inputError)}
                    rows={6}
                    placeholder={level === 'collection' ? '{ "name": "...", "documents": [...] }' : '{ "_id": { "$oid": "..." }, "name": "..." }'}
                    value={importText}
                    onChange={(e) => { setImportText(e.target.value); tryAutoFillKeyFromImport(e.target.value); }}
                  />
                  {importJsonError && <p className={styles.errorMsg}>유효한 JSON이 아닙니다.</p>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* 필드 레벨: 타입 선택기 + 값 입력 */}
        {level === 'field' &&  (
          <>
            {/* 타입 선택기 — 아래로 펼쳐지는 Accordion */}
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
            </div>

            <AnimatePresence>
              {typeAccordionOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={SPRING_SOFT}
                  className="flex flex-1 overflow-hidden"
                >
                  <div className="flex flex-wrap gap-1 pb-1">
                    {ALL_TYPES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        className={cn(styles.typeTab, selectedType === t && styles.typeTabActive)}
                        onClick={() => setSelectedType(t)}
                      >
                        {TYPE_META[t].icon}
                        <span>{t}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 값 입력 */}
            {selectedType === 'Boolean' ? (
              <div className={styles.row}>
                <span className="text-xs text-slate-500">값</span>
                <button
                  type="button"
                  className={cn(
                    styles.toggle,
                    boolValue ? 'bg-emerald-500' : 'bg-slate-200',
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
            ) : selectedType === 'ObjectID' ? (
              <div className="flex flex-col gap-1.5">
                {currentRefInfo && (
                  <p className="text-[11px] text-slate-400 px-0.5">
                    현재 참조: <span className="text-slate-600 font-medium">{currentRefInfo.collectionLabel}/{currentRefInfo.documentTitle}</span>
                  </p>
                )}
                <div className="flex gap-1">
                  <button
                    type="button"
                    className={cn(styles.typeTab, objectIdMode === 'generate' && styles.typeTabActive)}
                    onClick={() => setObjectIdMode('generate')}
                  >
                    <Zap size={12} />
                    자동 생성
                  </button>
                  <button
                    type="button"
                    className={cn(styles.typeTab, objectIdMode === 'pick' && styles.typeTabActive)}
                    onClick={() => setObjectIdMode('pick')}
                  >
                    <Link size={12} />
                    참조 선택
                  </button>
                </div>
                {objectIdMode === 'generate' ? (
                  <div className="flex items-center gap-1.5">
                    <span className={styles.oidDisplay}>{generatedOid}</span>
                    <button
                      type="button"
                      className={cn(styles.actionBtn, styles.cancelBtn)}
                      onClick={() => setGeneratedOid(generateObjectId())}
                      title="재생성"
                    >
                      <RefreshCw size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-1.5">
                    <select
                      className={styles.valueInput}
                      value={refCollectionName}
                      onChange={(e) => { setRefCollectionName(e.target.value); setRefDocId(''); }}
                    >
                      <option value="">컬렉션 선택</option>
                      {refCollections.map((c) => (
                        <option key={c.name} value={c.name}>{c.label}</option>
                      ))}
                    </select>
                    <select
                      className={styles.valueInput}
                      value={refDocId}
                      onChange={(e) => setRefDocId(e.target.value)}
                      disabled={!refCollectionName}
                    >
                      <option value="">문서 선택</option>
                      {refDocs.map((d) => (
                        <option key={d.id} value={d.id}>{d.title}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
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
