import { Database, ChevronDown } from 'lucide-react';
import type { DbCatalog } from '../types/explorer';
import { cn } from '../utils/cn';

const styles = {
  wrapper: 'flex flex-wrap items-center justify-between gap-4 rounded-[16px] border border-slate-200 bg-white/90 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur',
  title: 'text-lg font-semibold text-slate-900',
  subtitle: 'hidden md:block text-xs text-slate-500',
  select: 'flex w-full items-center justify-between gap-2 rounded-[12px] border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition hover:border-emerald-300/60 focus:outline-none',
};

interface HeaderProps {
  catalogs: DbCatalog[];
  activeDatabase: string | null;
  onSelectDatabase: (database: string) => void;
}

export function Header({ catalogs, activeDatabase, onSelectDatabase }: HeaderProps) {
  return (
    <header className={styles.wrapper}>
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-emerald-200/70 bg-emerald-50">
          <Database className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <div className={styles.title}>Json Explorer</div>
          <div className={styles.subtitle}>Realtime mock client for dashboard validation</div>
        </div>
      </div>
      <div className="flex-1 sm:max-w-[220px]">
        <label className="mb-1 hidden md:block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Database
        </label>
        <div className="relative">
          <select
            className={cn(styles.select, 'appearance-none pr-8')}
            value={activeDatabase ?? ''}
            onChange={(event) => onSelectDatabase(event.target.value)}
          >
            {catalogs.map((catalog) => (
              <option key={catalog.database} value={catalog.database}>
                {catalog.database}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>
      </div>
    </header>
  );
}
