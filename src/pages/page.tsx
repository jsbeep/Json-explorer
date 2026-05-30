import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Header } from '../components/layout/Header';
import { Breadcrumbs } from '../components/dashboard/Breadcrumbs';
import { MillerColumns } from '../components/dashboard/MillerColumns';
import { useExplorerState } from '../hooks/useExplorerState';

const styles = {
	root: 'flex h-screen w-screen flex-col overflow-hidden',
	page: 'flex min-h-0 flex-1 flex-col gap-4 px-4 pb-4 pt-4 sm:px-5 lg:px-6',
	main: 'flex min-h-0 flex-1 flex-col gap-4',
	backgroundGlow: 'pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.12),transparent_36%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.08),transparent_30%)]',
};

function useViewportMode() {
	const setViewportMode = useExplorerState((state) => state.setViewportMode);
	const [ready, setReady] = useState(false);

	useEffect(() => {
		const update = () => {
			const width = window.innerWidth;
			if (width >= 1200) {
				setViewportMode('desktop');
			} else if (width >= 768) {
				setViewportMode('tablet');
			} else {
				setViewportMode('mobile');
			}
		};

		update();
		setReady(true);
		window.addEventListener('resize', update);
		return () => window.removeEventListener('resize', update);
	}, [setViewportMode]);

	return ready;
}

export function Page() {
	const bootstrap = useExplorerState((state) => state.bootstrap);
	const isLoading = useExplorerState((state) => state.isLoading);
	const error = useExplorerState((state) => state.error);
	const viewportMode = useExplorerState((state) => state.viewportMode);
	const ready = useViewportMode();

	useEffect(() => {
		void bootstrap();
	}, [bootstrap]);

	if (!ready) {
		return <div className={styles.root} />;
	}

	return (
		<div className={styles.root}>
			<div className={styles.backgroundGlow} />
			<div className={styles.page}>
				<Header />
				<Breadcrumbs />
				<motion.main
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.28 }}
					className={styles.main}
				>
					{error ? (
						<div className="rounded-[16px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 shadow-sm">
							{error}
						</div>
					) : null}
					<div className="relative min-h-0 flex-1 overflow-hidden">
						<MillerColumns viewportMode={viewportMode} />
						{isLoading ? (
							<div className="pointer-events-none absolute inset-0 flex items-start justify-end bg-white/25 p-4">
								<div className="rounded-full border border-emerald-100 bg-white px-4 py-2 text-sm font-medium text-emerald-700 shadow-panel">
									Syncing mock workspace…
								</div>
							</div>
						) : null}
					</div>
				</motion.main>
			</div>
		</div>
	);
}
