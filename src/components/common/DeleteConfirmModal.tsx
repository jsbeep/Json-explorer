import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Loader2 } from 'lucide-react';

// ── 타겟 타입별 경고 문구 ─────────────────────────────────────────────────────

const TARGET_MESSAGES: Record<string, string> = {
  database: '이 데이터베이스와 하위 모든 컬렉션·문서가 삭제됩니다.',
  collection: '이 컬렉션과 하위 모든 문서가 삭제됩니다.',
  document: '이 문서가 영구적으로 삭제됩니다.',
  field: '이 필드와 하위 데이터가 모두 삭제됩니다.',
};

// ── 스타일 ────────────────────────────────────────────────────────────────────

const styles = {
  backdrop: 'fixed inset-0 flex items-center justify-center p-4 inherit',
  overlay: 'absolute inset-0 bg-slate-900/40 backdrop-blur-sm',
  card: 'relative z-[10] w-full max-w-sm bg-white rounded-2xl shadow-elevated p-6 flex flex-col gap-5',
  iconWrap: 'w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center',
  title: 'text-base font-semibold text-slate-900',
  targetName: 'font-mono text-sm bg-slate-100 rounded-lg px-2 py-1 text-slate-700 mt-1 block truncate',
  message: 'text-sm text-slate-500 leading-relaxed',
  actions: 'flex gap-2 justify-end',
  cancelBtn: 'px-4 py-2 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors',
  confirmBtn: 'px-4 py-2 rounded-xl text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors flex items-center gap-2 disabled:opacity-60',
} as const;

// ── Props ─────────────────────────────────────────────────────────────────────

interface DeleteConfirmModalProps {
  isOpen: boolean;
  targetType: 'database' | 'collection' | 'document' | 'field';
  targetLabel: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

// ── 컴포넌트 ──────────────────────────────────────────────────────────────────

export function DeleteConfirmModal({
  isOpen,
  targetType,
  targetLabel,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  const [isPending, setIsPending] = useState(false);
  const message = TARGET_MESSAGES[targetType] ?? TARGET_MESSAGES.field;

  const handleConfirm = async () => {
    setIsPending(true);
    try {
      await onConfirm();
    } finally {
      setIsPending(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.backdrop}
          style={{ zIndex: 1000 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {/* 오버레이 */}
          <div className={styles.overlay} onClick={onCancel} />

          {/* 카드 */}
          <motion.div
            className={styles.card}
            initial={{ scale: 0.94, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 8 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
          >
            <div className={styles.iconWrap}>
              <AlertTriangle size={22} className="text-red-500" />
            </div>

            <div>
              <p className={styles.title}>삭제하시겠습니까?</p>
              <code className={styles.targetName}>{targetLabel}</code>
            </div>

            <p className={styles.message}>{message} 이 작업은 되돌릴 수 없습니다.</p>

            <div className={styles.actions}>
              <button type="button" className={styles.cancelBtn} onClick={onCancel} disabled={isPending}>
                취소
              </button>
              <button
                type="button"
                className={styles.confirmBtn}
                onClick={handleConfirm}
                disabled={isPending}
              >
                {isPending && <Loader2 size={14} className="animate-spin" />}
                삭제
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
