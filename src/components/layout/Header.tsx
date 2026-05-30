import { ChevronDown, Database, RefreshCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useExplorerState } from '../../hooks/useExplorerState';

const styles = {
	root: '_root flex items-center justify-between gap-4 rounded-[16px] border border-slate-200/80 bg-white/95 px-4 py-3 shadow-panel backdrop-blur z-10',
	brand: 'flex min-w-0 items-center gap-3',
	brandMark: 'flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600 shadow-sm',
	brandTitle: 'truncate text-[15px] font-semibold tracking-tight text-slate-900',
	brandSubtitle: 'truncate text-[12px] text-slate-500',
	menuButton: 'inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50/70 hover:text-emerald-700',
	menuPanel: 'absolute right-0 top-[calc(100%+0.75rem)] z-20 w-[18rem] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-panel',
	menuItem: 'flex w-full items-center justify-between px-4 py-3 text-left text-sm transition hover:bg-emerald-50/70',
	menuItemActive: 'bg-emerald-50 text-emerald-700',
	refreshButton: 'inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700',
};

export function Header() {
	const databases = useExplorerState((state) => state.databases);
	const selectedDatabase = useExplorerState((state) => state.selectedDatabase);
	const isLoading = useExplorerState((state) => state.isLoading);
	const selectDatabase = useExplorerState((state) => state.selectDatabase);
	const refreshCurrentView = useExplorerState((state) => state.refreshCurrentView);
	const [isOpen, setIsOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const activeDatabase = databases.find((database) => database.name === selectedDatabase);

	return (
		<header className={styles.root}>
			<div className={styles.brand}>
				<div className={styles.brandMark}>
					<Database className="h-5 w-5" />
				</div>
				<div className="min-w-0">
					<h1 className={styles.brandTitle}>MongoLive</h1>
					<p className={styles.brandSubtitle}>{activeDatabase?.description ?? 'Realtime mock client for dashboard validation'}</p>
				</div>
			</div>

			<div className="flex items-center gap-2" ref={menuRef}>
				<button className={styles.refreshButton} onClick={() => void refreshCurrentView()} aria-label="Refresh data">
					<RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
				</button>
				<div className="relative">
					<button className={styles.menuButton} onClick={() => setIsOpen((value) => !value)}>
						<span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Database</span>
						<span className="max-w-[10rem] truncate">{activeDatabase?.label ?? selectedDatabase}</span>
						<ChevronDown className={`h-4 w-4 transition ${isOpen ? 'rotate-180' : ''}`} />
					</button>
					<AnimatePresence>
						{isOpen ? (
							<motion.div
								initial={{ opacity: 0, y: -8, scale: 0.98 }}
								animate={{ opacity: 1, y: 0, scale: 1 }}
								exit={{ opacity: 0, y: -8, scale: 0.98 }}
								transition={{ duration: 0.16 }}
								className={styles.menuPanel}
							>
								<div className="border-b border-slate-100 px-4 py-3">
									<p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Workspace databases</p>
								</div>
								<div className="max-h-[19rem] overflow-y-auto">
									{databases.map((database) => (
										<button
											key={database.name}
											className={`${styles.menuItem} ${database.name === selectedDatabase ? styles.menuItemActive : ''}`}
											onClick={async () => {
												setIsOpen(false);
												await selectDatabase(database.name);
											}}
										>
											<div>
												<div className="font-medium">{database.label}</div>
												<div className="text-xs text-slate-400">{database.collectionCount} collections · {database.documentCount} docs</div>
											</div>
											<span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-600">{database.name}</span>
										</button>
									))}
								</div>
							</motion.div>
						) : null}
					</AnimatePresence>
				</div>
			</div>
		</header>
	);
}
