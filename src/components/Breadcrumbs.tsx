import { useEffect, useRef } from 'react';
import { ChevronRight, Database, Folder, FileJson } from 'lucide-react';
import { cn } from '../utils/cn';

const styles = {
  wrapper: 'flex items-center justify-start rounded-[16px] border border-slate-200 bg-white/80 px-2 py-1 m-4 mb-0 shadow-sm',
  container: 'breadcrumbscroll w-full p-2 overflow-x-auto text-sm text-slate-600',
  breadcrumbs: 'flex flex-nowrap items-center gap-2 text-sm text-slate-600 min-w-max',
  crumb: 'group flex min-w-0 items-center gap-2 font-medium text-slate-700',
  muted: 'text-slate-400',
};

interface BreadcrumbsProps {
  activeDatabase: string | null;
  activeCollection: string | null;
  activeDocumentId: string | null;
  pathSegments: string[];
  onSelectPathDepth?: (depth: number) => void;
}

export function Breadcrumbs({
  activeDatabase,
  activeCollection,
  activeDocumentId,
  pathSegments,
  onSelectPathDepth,
}: BreadcrumbsProps) {
  const breadcrumbRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = breadcrumbRef.current;
    if (!container) return;
    container.scrollTo({ left: container.scrollWidth - container.clientWidth, behavior: 'smooth' });
  }, [activeDatabase, activeCollection, activeDocumentId, pathSegments.length]);

  return (
    <div className={styles.wrapper}>
      <div ref={breadcrumbRef} className={styles.container}>
        <div className={styles.breadcrumbs}>
          <div className={styles.crumb}>
            <Database className="h-4 w-4 text-emerald-500" />
            <span className="truncate max-w-[180px] sm:max-w-none group-focus-within:max-w-none group-focus-within:whitespace-normal group-focus-within:overflow-visible">
              {activeDatabase ?? 'Select database'}
            </span>
          </div>
          <ChevronRight className={styles.muted} />
          <div className={styles.crumb}>
            <Folder className="h-4 w-4 text-emerald-500" />
            <span className="truncate max-w-[180px] sm:max-w-none group-focus-within:max-w-none group-focus-within:whitespace-normal group-focus-within:overflow-visible">
              {activeCollection ?? 'Select collection'}
            </span>
          </div>
          <ChevronRight className={styles.muted} />
          <button
            type="button"
            onClick={() => onSelectPathDepth?.(0)}
            className={cn(styles.crumb, !activeDocumentId && styles.muted)}
          >
            <FileJson className="h-4 w-4" />
            <span className="truncate max-w-[180px] sm:max-w-none group-focus-within:max-w-none group-focus-within:whitespace-normal group-focus-within:overflow-visible">
              {activeDocumentId ?? 'Select document'}
            </span>
          </button>
          {pathSegments.map((segment, index) => (
            <div key={`${segment}-${index}`} className="flex items-center gap-2">
              <ChevronRight className={styles.muted} />
              <button
                type="button"
                className={styles.crumb}
                onClick={() => onSelectPathDepth?.(index + 1)}
              >
                <span className="truncate max-w-[180px] sm:max-w-none group-focus-within:max-w-none group-focus-within:whitespace-normal group-focus-within:overflow-visible">{segment}</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
