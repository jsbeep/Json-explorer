import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';
import { useExplorerState } from '../../hooks/useExplorerState';
import type { ExplorerViewportMode } from '../../types/explorer';
import { ColumnItem } from './ColumnItem';
import { JsonLevelColumn } from './JsonLevelColumn';

type MillerColumnsProps = {
	viewportMode: ExplorerViewportMode;
};

const styles = {
	root: '_root flex min-h-0 h-full overflow-hidden rounded-[20px] border border-slate-200/70 bg-white/70 shadow-[0_24px_60px_rgba(15,23,42,0.06)] backdrop-blur',
	desktop: '_desktop grid min-h-0 h-full w-full grid-cols-[3fr_3fr_4fr] gap-4 overflow-hidden px-3 py-3',
	tablet: 'flex h-full min-h-0 w-full gap-4 overflow-x-auto overflow-y-hidden px-1 pb-1',
	mobileTabs: 'grid grid-cols-3 gap-2 rounded-[16px] border border-slate-200 bg-white p-2 shadow-panel',
	mobileTab: 'rounded-[12px] px-3 py-2 text-sm font-semibold transition',
	mobileTabActive: 'bg-emerald-50 text-emerald-700 shadow-sm',
	mobileTabIdle: 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
	panelWrapper: '_panelWrapper flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-sm',
	columnScroll: '_columnScroll min-h-0 flex-1 overflow-y-auto p-3',
	placeholder: 'flex h-full items-center justify-center rounded-[16px] border border-dashed border-slate-200 bg-slate-50/70 text-sm text-slate-400',
};

function DatabaseColumn() {
	const databases = useExplorerState((state) => state.databases);
	const selectedDatabase = useExplorerState((state) => state.selectedDatabase);
	const selectDatabase = useExplorerState((state) => state.selectDatabase);
	const isLoading = useExplorerState((state) => state.isLoading);

	return (
		<div className={styles.panelWrapper}>
			<div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
				<div>
					<div className="text-sm font-semibold text-slate-900">Databases</div>
					<div className="text-xs text-slate-400">Select the workspace to inspect</div>
				</div>
				<div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{databases.length} total</div>
			</div>
			<div className={styles.columnScroll}>
				<div className="space-y-2">
					{databases.map((database) => (
						<ColumnItem
							key={database.name}
							label={database.label}
							subtitle={database.description}
							meta={`${database.collectionCount} collections`}
							selected={database.name === selectedDatabase}
							disabled={isLoading}
							onClick={async () => {
								await selectDatabase(database.name);
							}}
						/>
					))}
				</div>
			</div>
		</div>
	);
}

function CollectionColumn() {
	const collections = useExplorerState((state) => state.collections);
	const selectedCollection = useExplorerState((state) => state.selectedCollection);
	const selectCollection = useExplorerState((state) => state.selectCollection);
	const isLoading = useExplorerState((state) => state.isLoading);

	return (
		<div className={styles.panelWrapper}>
			<div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
				<div>
					<div className="text-sm font-semibold text-slate-900">Collections</div>
					<div className="text-xs text-slate-400">Collection-level navigation</div>
				</div>
				<div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{collections.length} visible</div>
			</div>
			<div className={styles.columnScroll}>
				<div className="space-y-2">
					{collections.map((collection) => (
						<ColumnItem
							key={collection.name}
							label={collection.label}
							subtitle={collection.description}
							meta={`${collection.documentCount} docs`}
							selected={collection.name === selectedCollection}
							disabled={isLoading}
							onClick={async () => {
								await selectCollection(collection.name);
							}}
						/>
					))}
				</div>
			</div>
		</div>
	);
}

function DocumentColumn() {
	const documents = useExplorerState((state) => state.documents);
	const selectedDocumentId = useExplorerState((state) => state.selectedDocumentId);
	const selectDocument = useExplorerState((state) => state.selectDocument);
	const isLoading = useExplorerState((state) => state.isLoading);

	return (
		<div className={styles.panelWrapper}>
			<div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
				<div>
					<div className="text-sm font-semibold text-slate-900">Documents</div>
					<div className="text-xs text-slate-400">Document-level navigation</div>
				</div>
				<div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{documents.length} visible</div>
			</div>
			<div className={styles.columnScroll}>
				<div className="space-y-2">
					{documents.length === 0 ? <div className={styles.placeholder}>Select a collection to inspect documents</div> : null}
					{documents.map((document) => {
						const id = typeof document._id === 'object' && document._id && '$oid' in document._id ? String(document._id.$oid) : `document-${documents.indexOf(document)}`;
						const label = typeof document.title === 'string' ? document.title : typeof document.name === 'string' ? document.name : id.slice(-6);
						const preview = Object.entries(document)
							.filter(([key]) => key !== '_id')
							.slice(0, 3)
							.map(([key, value]) => `${key}: ${Array.isArray(value) ? `Array(${value.length})` : typeof value}`)
							.join(' · ');

						return (
							<ColumnItem
								key={id}
								label={label}
								subtitle={preview}
								meta={id.slice(-6)}
								selected={id === selectedDocumentId}
								disabled={isLoading}
								onClick={async () => {
									await selectDocument(id);
								}}
							/>
						);
					})}
				</div>
			</div>
		</div>
	);
}

function JsonColumn() {
	const selectedDocument = useExplorerState((state) => state.selectedDocument);
	const fieldPath = useExplorerState((state) => state.fieldPath);
	const selectedCollection = useExplorerState((state) => state.selectedCollection);

	if (!selectedCollection || !selectedDocument) {
		return (
			<div className={styles.panelWrapper}>
				<div className="flex h-full items-center justify-center p-6 text-sm text-slate-400">Select a document to inspect its JSON structure</div>
			</div>
		);
	}

	let currentValue: any = selectedDocument;
	for (const key of fieldPath) {
		if (Array.isArray(currentValue)) {
			currentValue = currentValue[Number(key)];
		} else if (currentValue && typeof currentValue === 'object') {
			currentValue = currentValue[key];
		}
	}

	return <JsonLevelColumn title="Document Root" value={currentValue} path={fieldPath} depth={fieldPath.length} columnIndex={2} isTerminal={fieldPath.length === 0} />;
}

export function MillerColumns({ viewportMode }: MillerColumnsProps) {
	const activeTab = useExplorerState((state) => state.activeTab);
	const setActiveTab = useExplorerState((state) => state.setActiveTab);
	const selectedCollection = useExplorerState((state) => state.selectedCollection);
	const selectedDocument = useExplorerState((state) => state.selectedDocument);
	const fieldPath = useExplorerState((state) => state.fieldPath);
	const collections = useExplorerState((s) => s.collections);
	const documents = useExplorerState((s) => s.documents);
	const selectedDatabase = useExplorerState((s) => s.selectedDatabase);

	// Build the full column sequence: collections (index1), documents (2), json root (2), then json levels
	const fullColumns: Array<{ key: string; el: React.ReactNode }> = [];

	// collections column - segment index 1
	fullColumns.push({ key: 'collections', el: <CollectionColumn /> });

	// documents column - segment index 2
	fullColumns.push({ key: 'documents', el: <DocumentColumn /> });

	// json root and recursive levels
	// start from document root (segment index 2)
	if (selectedCollection && selectedDocument) {
		// helper to traverse selectedDocument along path prefix
		const traverse = (prefix: string[]) => {
			let current: any = selectedDocument;
			for (const key of prefix) {
				if (current == null) return undefined;
				if (Array.isArray(current)) {
					const idx = Number(key);
					current = current[idx];
				} else if (typeof current === 'object') {
					current = (current as Record<string, any>)[key];
				} else {
					return undefined;
				}
			}
			return current;
		};

		// document root column - global segment index 2
		const rootValue = traverse([]) as any;
		fullColumns.push({
			key: `json-root`,
			el: <JsonLevelColumn title="Document Root" value={rootValue} path={[]} depth={0} columnIndex={2} isTerminal={fieldPath.length === 0} />,
		});

		// for each fieldPath element, create columns for the value at that path
		for (let i = 0; i < fieldPath.length; i++) {
			const prefix = fieldPath.slice(0, i + 1);
			const value = traverse(prefix);
			const segmentIndex = 3 + i; // since root is 2, first field becomes 3
			fullColumns.push({ key: `json-${prefix.join('.')}`, el: <JsonLevelColumn title={prefix[prefix.length - 1]} value={value as any} path={prefix} depth={i + 1} columnIndex={segmentIndex} isTerminal={i === fieldPath.length - 1} /> });
		}
	} else {
		// show placeholder root when no document selected
		fullColumns.push({ key: 'json-empty', el: <div className="flex h-full items-center justify-center p-6 text-sm text-slate-400">Select a document to inspect its JSON</div> });
	}

	// Only show the latest 3 columns in the viewport
	const visible = fullColumns.slice(-3);

	if (viewportMode === 'mobile') {
		return (
			<div className={styles.root}>
				<div className="flex h-full min-h-0 w-full flex-col gap-3 p-2">
					<div className={styles.mobileTabs}>
						{['collections', 'documents', 'json'].map((key) => (
							<button
								key={key}
								className={`${styles.mobileTab} ${activeTab === key ? styles.mobileTabActive : styles.mobileTabIdle}`}
								onClick={() => setActiveTab(key as typeof activeTab)}
							>
								{key}
							</button>
						))}
					</div>
					<div className="min-h-0 flex-1 overflow-hidden rounded-[18px]">
						<AnimatePresence mode="wait">
							<motion.div
								key={activeTab}
								initial={{ opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -12 }}
								transition={{ duration: 0.22 }}
								className="h-full min-h-0"
							>
								{activeTab === 'collections' ? <CollectionColumn /> : activeTab === 'documents' ? <DocumentColumn /> : <JsonColumn />}
							</motion.div>
						</AnimatePresence>
					</div>
				</div>
			</div>
		);
	}

	if (viewportMode === 'tablet') {
		return (
			<div className={styles.root}>
				<div className={styles.tablet}>
					{fullColumns.map((column) => (
						<div key={column.key} className="h-full min-h-0 w-[24rem] shrink-0 p-2">
							{column.el}
						</div>
					))}
				</div>
			</div>
		);
	}

	// desktop: render visible columns (latest 3) with fixed ratio 3:3:4
	return (
		<div className={styles.root}>
			<div className="h-full w-full min-h-0">
				<div className="h-full min-h-0">
					<AnimatePresence mode="popLayout">
						<motion.div
							key={visible.map((c) => c.key).join('|')}
							initial={{ opacity: 0, x: 18 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -18 }}
							transition={{ duration: 0.22 }}
							className="h-full min-h-0"
						>
							{visible.length === 3 ? (
								<div className={styles.desktop}>
									{visible.map((c, i) => {
										const content =
											i === 0 && React.isValidElement(c.el) && c.key.startsWith('json')
												? React.cloneElement(c.el as React.ReactElement<{ isLeadingVisibleColumn?: boolean }>, {
													isLeadingVisibleColumn: true,
												})
												: c.el;

										return (
											<div key={c.key} className="min-h-0 min-w-0 overflow-hidden">
												{content}
											</div>
										);
									})}
								</div>
							) : visible.length === 2 ? (
								<div className="grid h-full min-h-0 grid-cols-2 gap-4 px-3 py-3">
									{visible.map((c) => (
										<div key={c.key} className="min-h-0 min-w-0 overflow-hidden">
											{c.el}
										</div>
									))}
								</div>
							) : (
								<div className="h-full min-h-0 p-3">{visible[0]?.el}</div>
							)}
						</motion.div>
					</AnimatePresence>
				</div>
			</div>
		</div>
	);
}
