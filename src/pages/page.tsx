import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Database } from 'lucide-react';
import { useExplorerState } from '../hooks/useExplorerState';
import { Header } from '../components/layout/Header';
import { Breadcrumbs } from '../components/dashboard/Breadcrumbs';
import { MillerColumns } from '../components/dashboard/MillerColumns';
import { FloatingDataManager } from '../components/editors/FloatingDataManager';

// ── 스타일 ────────────────────────────────────────────────────────────────────

const styles = {
  root: 'h-screen w-screen overflow-hidden flex flex-col gap-2 p-4 bg-slate-100',
  fab: 'fixed bottom-5 left-5 z-[101] w-11 h-11 rounded-full bg-[#22c55e] text-white shadow-[0_4px_16px_rgba(34,197,94,0.4)] flex items-center justify-center hover:bg-emerald-600 transition-colors',
  toastPositioner: 'fixed bottom-20 left-1/2 z-[101] -translate-x-1/2 flex items-center gap-3',
  toast: 'flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-medium shadow-lg backdrop-blur',
  toastSuccess: 'bg-white border border-slate-200 text-slate-800',
  toastError: 'bg-red-500 text-white',
  undoBtn: 'text-emerald-600 font-semibold underline underline-offset-2 hover:text-emerald-700 ml-1',
} as const;

// ── 컴포넌트 ──────────────────────────────────────────────────────────────────

export default function ExplorerPage() {
  const state = useExplorerState();
  const [dataManagerOpen, setDataManagerOpen] = useState(false);

  // 초기 연결
  useEffect(() => {
    void state.initialize();
  }, []);

  const {
    connectionStatus,
    activeDatabase,
    activePaths,
    databases,
    collections,
    documents,
    openDocument,
    isLoading,
    changedPaths,
    editingId,
    toast,
    uniqueOids,
    visibleColumns,
    breadcrumbs,
    selectDatabase,
    selectCollection,
    selectDocument,
    pushJsonPath,
    popToIndex,
    pushReference,
    navigateToReference,
    mutate,
    registerUniqueOid,
    unregisterUniqueOid,
    setEditingId,
    clearChangedPaths,
    dismissToast,
    undo,
    refresh,
  } = state;

  return (
    <div className={styles.root}>
      {/* 헤더 */}
      <Header
        activeDatabase={activeDatabase}
        connectionStatus={connectionStatus}
        databases={databases}
        selectDatabase={selectDatabase}
        onRefresh={() => void refresh()}
      />


      {/* Miller Columns */}
      <div className="flex-1 min-h-0 flex flex-col h-full w-full overflow-hidden rounded-2xl bg-white">
        {/* 브레드크럼 */}
        <Breadcrumbs
          breadcrumbs={breadcrumbs}
          onNavigate={(index) => popToIndex(index)}
        />
        <MillerColumns
          visibleColumns={visibleColumns}
          collections={collections}
          documents={documents}
          openDocument={openDocument}
          isLoading={isLoading}
          changedPaths={changedPaths}
          editingId={editingId}
          activePaths={activePaths}
          selectCollection={selectCollection}
          selectDocument={selectDocument}
          pushJsonPath={pushJsonPath}
          pushReference={pushReference}
          navigateToReference={navigateToReference}
          popToIndex={popToIndex}
          mutate={mutate}
          uniqueOids={uniqueOids}
          registerUniqueOid={registerUniqueOid}
          unregisterUniqueOid={unregisterUniqueOid}
          setEditingId={setEditingId}
          clearChangedPaths={clearChangedPaths}
        />
      </div>

      {/* FAB: 데이터 매니저 */}
      <button
        type="button"
        className={styles.fab}
        onClick={() => setDataManagerOpen(true)}
        aria-label="데이터 매니저 열기"
      >
        <Database size={18} />
      </button>

      {/* 데이터 매니저 패널 */}
      <FloatingDataManager
        isOpen={dataManagerOpen}
        onClose={() => setDataManagerOpen(false)}
        databases={databases}
        activeDatabase={activeDatabase}
        onMutate={mutate}
      />
      <div className={styles.toastPositioner} aria-live="assertive">
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast.id}
              className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : styles.toastSuccess}`}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            >
              <span>{toast.message}</span>
              {toast.undoable && (
                <button
                  type="button"
                  className={styles.undoBtn}
                  onClick={() => { void undo(); dismissToast(); }}
                >
                  실행 취소
                </button>
              )}
              <button
                type="button"
                className="ml-1 opacity-60 hover:opacity-100"
                onClick={dismissToast}
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
