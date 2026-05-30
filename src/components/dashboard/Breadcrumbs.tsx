import { ChevronRight, Database, FolderOpen, FileJson2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useExplorerState } from '../../hooks/useExplorerState';

const styles = {
	root: 'flex min-w-0 items-center gap-2 rounded-[16px] border border-slate-200/80 bg-white/95 px-4 py-3 shadow-panel backdrop-blur',
	crumb: 'inline-flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-sm font-medium transition',
	crumbActive: 'bg-emerald-50 text-emerald-700',
	crumbIdle: 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
};

function getIcon(kind: 'database' | 'collection' | 'document' | 'field') {
	switch (kind) {
		case 'database':
			return <Database className="h-4 w-4" />;
		case 'collection':
			return <FolderOpen className="h-4 w-4" />;
		default:
			return <FileJson2 className="h-4 w-4" />;
	}
}

export function Breadcrumbs() {
	const pathSegments = useExplorerState((state) => state.pathSegments);
	const jumpToDepth = useExplorerState((state) => state.jumpToDepth);

	return (
		<nav className={styles.root} aria-label="Breadcrumb">
			<div className="flex min-w-0 items-center gap-2 overflow-x-auto breadcrumbscroll whitespace-nowrap">
				{pathSegments.map((segment, index) => {
					const isLast = index === pathSegments.length - 1;
					return (
						<motion.button
							key={`${segment.kind}-${segment.path.join('.')}`}
							whileTap={{ scale: 0.98 }}
							className={`${styles.crumb} ${isLast ? styles.crumbActive : styles.crumbIdle}`}
							onClick={() => void jumpToDepth(index)}
						>
							{getIcon(segment.kind)}
							<span>{segment.label}</span>
							{!isLast ? <ChevronRight className="h-3.5 w-3.5 text-slate-300" /> : null}
						</motion.button>
					);
				})}
			</div>
		</nav>
	);
}
