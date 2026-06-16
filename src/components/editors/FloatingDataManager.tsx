import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Download, Upload, Plus, Loader2, Check } from 'lucide-react';
import { exportSnapshot } from '../../services/mockStorage';
import type { MockMutationRequest, DatabaseSummary } from '../../types/explorer';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';
import { cn } from '../../utils/cn';

// ── 탭 정의 ──────────────────────────────────────────────────────────────────

type Tab = 'import' | 'export' | 'addDB' | 'addCollection';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'addDB', label: 'DB 생성', icon: <Plus size={14} /> },
  { id: 'addCollection', label: '컬렉션 생성', icon: <Plus size={14} /> },
  { id: 'import', label: 'Import', icon: <Upload size={14} /> },
  { id: 'export', label: 'Export', icon: <Download size={14} /> },
];

// ── 스타일 ────────────────────────────────────────────────────────────────────

const styles = {
  backdrop: 'fixed inset-0 z-[101] flex items-end justify-center p-4 pointer-events-none',
  backdropActive: 'pointer-events-auto',
  overlay: 'absolute inset-0 bg-slate-900/30 backdrop-blur-sm',
  panel: 'relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-[0_-8px_40px_rgba(15,23,42,0.12)] max-h-[70vh] flex flex-col overflow-hidden',
  header: 'flex items-center px-5 py-4 border-b border-slate-100',
  title: 'text-sm font-semibold text-slate-900 flex-1',
  closeBtn: 'p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors',
  tabs: 'flex gap-1 px-5 py-3 border-b border-slate-100 overflow-x-auto',
  tab: 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0',
  tabActive: 'bg-emerald-50 text-emerald-700',
  content: 'flex-1 overflow-y-auto p-5 flex flex-col gap-4',
  input: 'w-full text-sm px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-emerald-400 focus:bg-white transition-colors',
  textarea: 'w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-emerald-400 focus:bg-white transition-colors font-mono resize-none flex-1 min-h-[200px]',
  label: 'text-xs font-semibold text-slate-600 uppercase tracking-wide',
  errorMsg: 'text-xs text-red-500',
  successMsg: 'text-xs text-emerald-600',
  primaryBtn: 'px-4 py-2 rounded-xl text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 transition-colors flex items-center gap-2 disabled:opacity-60',
  secondaryBtn: 'px-4 py-2 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-2',
  row: 'flex gap-2',
} as const;

// ── Props ─────────────────────────────────────────────────────────────────────

interface FloatingDataManagerProps {
  isOpen: boolean;
  onClose: () => void;
  databases: DatabaseSummary[];
  activeDatabase: string | null;
  onMutate: (op: MockMutationRequest) => Promise<unknown>;
}

// ── 컴포넌트 ──────────────────────────────────────────────────────────────────

export function FloatingDataManager({
  isOpen,
  onClose,
  databases,
  activeDatabase,
  onMutate,
}: FloatingDataManagerProps) {
  const [activeTab, setActiveTab] = useState<Tab>('addCollection');
  const [isPending, setIsPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showImportConfirm, setShowImportConfirm] = useState(false);

  // 폼 상태
  const [dbName, setDbName] = useState('');
  const [dbLabel, setDbLabel] = useState('');
  const [colName, setColName] = useState('');
  const [colLabel, setColLabel] = useState('');
  const [importJson, setImportJson] = useState('');
  const [exportText] = useState(() => exportSnapshot());

  const [copied, setCopied] = useState(false);

  const resetMessages = () => { setErrorMsg(''); setSuccessMsg(''); };

  const handleAction = async () => {
    resetMessages();
    setIsPending(true);
    try {
      if (activeTab === 'addDB') {
        if (!dbName.trim()) { setErrorMsg('이름을 입력하세요.'); return; }
        await onMutate({
          type: 'createDatabase',
          database: { name: dbName.trim(), label: dbLabel.trim() || dbName.trim(), description: '' },
        });
        setDbName(''); setDbLabel('');
        setSuccessMsg('DB가 생성되었습니다.');
      } else if (activeTab === 'addCollection') {
        if (!colName.trim()) { setErrorMsg('이름을 입력하세요.'); return; }
        if (!activeDatabase) { setErrorMsg('먼저 데이터베이스를 선택하세요.'); return; }
        await onMutate({
          type: 'createCollection',
          database: activeDatabase,
          collection: { name: colName.trim(), label: colLabel.trim() || colName.trim(), description: '' },
        });
        setColName(''); setColLabel('');
        setSuccessMsg('컬렉션이 생성되었습니다.');
      } else if (activeTab === 'import') {
        setShowImportConfirm(true);
      }
    } catch (e) {
      setErrorMsg(typeof e === 'string' ? e : '오류가 발생했습니다.');
    } finally {
      setIsPending(false);
    }
  };

  const handleImportConfirm = async () => {
    setIsPending(true);
    try {
      const parsed = JSON.parse(importJson);
      await onMutate({ type: 'replaceSnapshot', snapshot: parsed });
      setSuccessMsg('Import 완료.');
      setImportJson('');
    } catch {
      setErrorMsg('유효하지 않은 JSON입니다.');
    } finally {
      setIsPending(false);
      setShowImportConfirm(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={cn(styles.backdrop, styles.backdropActive)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div className={styles.overlay} onClick={onClose} />

          <motion.div
            className={styles.panel}
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* 헤더 */}
            <div className={styles.header}>
              <span className={styles.title}>데이터 매니저</span>
              <button type="button" className={styles.closeBtn} onClick={onClose}>
                <X size={16} />
              </button>
            </div>

            {/* 탭 */}
            <div className={styles.tabs}>
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={cn(styles.tab, activeTab === tab.id && styles.tabActive)}
                  onClick={() => { setActiveTab(tab.id); resetMessages(); }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 콘텐츠 */}
            <div className={styles.content}>
              {activeTab === 'addDB' && (
                <>
                  <label className={styles.label}>데이터베이스 이름</label>
                  <input className={styles.input} placeholder="my-database" value={dbName} onChange={(e) => setDbName(e.target.value)} />
                  <label className={styles.label}>표시 이름 (선택)</label>
                  <input className={styles.input} placeholder="My Database" value={dbLabel} onChange={(e) => setDbLabel(e.target.value)} />
                </>
              )}

              {activeTab === 'addCollection' && (
                <>
                  <label className={styles.label}>
                    대상 DB: <span className="normal-case font-normal text-slate-500">{activeDatabase ?? '없음'}</span>
                  </label>
                  <label className={styles.label}>컬렉션 이름</label>
                  <input className={styles.input} placeholder="my-collection" value={colName} onChange={(e) => setColName(e.target.value)} />
                  <label className={styles.label}>표시 이름 (선택)</label>
                  <input className={styles.input} placeholder="My Collection" value={colLabel} onChange={(e) => setColLabel(e.target.value)} />
                </>
              )}

              {activeTab === 'import' && (
                <>
                  <p className="text-xs text-slate-500">전체 스냅샷 JSON을 붙여넣으세요. 기존 데이터를 모두 덮어씁니다.</p>
                  <textarea
                    className={styles.textarea}
                    placeholder='{ "version": 1, "activeDatabase": "...", "databases": { ... } }'
                    value={importJson}
                    onChange={(e) => setImportJson(e.target.value)}
                  />
                </>
              )}

              {activeTab === 'export' && (
                <>
                  <p className="text-xs text-slate-500">현재 스냅샷 전체가 아래에 출력됩니다.</p>
                  <textarea
                    className={styles.textarea}
                    value={exportText}
                    readOnly
                  />
                  <div className={styles.row}>
                    <button
                      type="button"
                      className={styles.secondaryBtn}
                      onClick={() => {
                        navigator.clipboard.writeText(exportText).then(() => {
                          setCopied(true);
                          setTimeout(() => setCopied(false), 1500);
                        });
                      }}
                    >
                      {copied ? <Check size={14} className="text-emerald-500" /> : <Download size={14} />}
                      클립보드 복사
                    </button>
                  </div>
                </>
              )}

              {/* 메시지 */}
              {errorMsg && <p className={styles.errorMsg}>{errorMsg}</p>}
              {successMsg && <p className={styles.successMsg}>{successMsg}</p>}

              {/* 실행 버튼 */}
              {activeTab !== 'export' && (
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={() => void handleAction()}
                  disabled={isPending}
                >
                  {isPending && <Loader2 size={14} className="animate-spin" />}
                  {activeTab === 'import' ? '가져오기' : '생성'}
                </button>
              )}
            </div>
          </motion.div>

          {/* Import 확인 모달 */}
          {showImportConfirm && (
            <DeleteConfirmModal
              isOpen={showImportConfirm}
              targetType="collection"
              targetLabel="전체 스냅샷"
              onConfirm={handleImportConfirm}
              onCancel={() => setShowImportConfirm(false)}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
