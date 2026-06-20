// path: src/components/layout/Header.tsx
import { Circle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import type { UseExplorerStateResult } from '../../hooks/useExplorerState';
import { cn } from '../../utils/cn';
import { DatabaseDropdown } from './DatabaseDropdown';

type HeaderProps = Pick<
  UseExplorerStateResult,
  'activeDatabase' | 'connectionStatus' | 'databases' | 'selectDatabase' | 'mutate'
> & {
  onRefresh: () => void;
};

const styles = {
  header:
    'flex min-h-14 w-full items-center border-b border-slate-200/80 bg-white/85 px-3 backdrop-blur-md rounded-[14px] shadow-soft',
  inner: 'flex w-full min-w-0 items-center gap-3',
  left: 'flex min-w-0 items-center gap-2.5',
  logoMark:
    'flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] border border-emerald-200 bg-emerald-50 text-sm font-bold text-emerald-700',
  wordmark: 'min-w-0',
  titleRow: 'flex items-center gap-2',
  title: 'text-sm font-semibold tracking-tight text-slate-900',
  mockBadge:
    'inline-flex items-center rounded-full bg-orange-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-700',
  subtitle: 'mt-0.5 text-xs text-slate-500',
  right: 'ml-auto flex min-w-0 items-center gap-2',
  refreshWrap: 'relative shrink-0 overflow-visible',
  refreshButton:
    'relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 focus-visible:border-emerald-300 focus-visible:ring-2 focus-visible:ring-emerald-500/20',
  refreshBadge:
    'absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border border-white bg-white shadow-[0_0_0_1px_rgba(255,255,255,1)]',
  refreshBadgeDot: 'h-2.5 w-2.5',
} as const;

const STATUS_STYLES: Record<UseExplorerStateResult['connectionStatus'], { color: string; label: string }> = {
  disconnected: {
    color: 'text-slate-400',
    label: 'Disconnected',
  },
  connecting: {
    color: 'text-amber-500',
    label: 'Connecting',
  },
  connected: {
    color: 'text-emerald-500',
    label: 'Connected',
  },
  error: {
    color: 'text-rose-500',
    label: 'Error',
  },
};

export function Header({
  activeDatabase,
  connectionStatus,
  databases,
  selectDatabase,
  mutate,
  onRefresh,
}: HeaderProps) {
  const status = STATUS_STYLES[connectionStatus];

  return (
    <motion.header
      className={styles.header}
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
    >
      <div className={styles.inner}>
        <div className={styles.left}>
          <div className={styles.logoMark} aria-hidden="true">
            ML
          </div>
          <div className={styles.wordmark}>
            <div className={styles.titleRow}>
              <span className={styles.title}>MongoLive - JSON Explorer & Editor</span>
            </div>
            <p className={styles.subtitle}>Miller Column-based JSON viewer & inline editor</p>
          </div>
        </div>

        <div className={styles.right}>
          <div className={styles.refreshWrap}>
            <motion.button
              type="button"
              className={styles.refreshButton}
              onClick={onRefresh}
              whileTap={{ scale: 0.98 }}
              aria-label="Refresh current database view"
            >
              <RefreshCw size={16} aria-hidden="true" />
            </motion.button>
            <span className={styles.refreshBadge} aria-hidden="true">
              <Circle className={cn(styles.refreshBadgeDot, status.color)} fill="currentColor" stroke="none" />
            </span>
          </div>

          <DatabaseDropdown
            activeDatabase={activeDatabase}
            databases={databases}
            selectDatabase={selectDatabase}
            onMutate={mutate}
          />
        </div>
      </div>
    </motion.header>
  );
}
