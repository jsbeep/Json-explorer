import { Check, Copy, PencilLine, FolderPlus, Layers3, Plus, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useExplorerState } from '../../hooks/useExplorerState';
import type { JsonObject, JsonValue } from '../../types/explorer';
import { ColumnItem } from './ColumnItem';
import { InlineSegmentEditor } from '../editors/InlineSegmentEditor';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';
import { mockAPI } from '../../services/mockAPI';

type JsonLevelColumnProps = {
	title: string;
	value: JsonValue;
	path: string[];
	depth: number;
	columnIndex: number;
	isTerminal: boolean;
	isLeadingVisibleColumn?: boolean;
};

const styles = {
	column: 'flex h-full min-h-0 flex-col rounded-[18px] border border-slate-200/80 bg-white shadow-sm',
	header: 'flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3',
	headerLabel: 'text-sm font-semibold text-slate-900',
	headerMeta: 'text-xs font-semibold uppercase tracking-[0.18em] text-slate-400',
	body: 'min-h-0 flex-1 overflow-y-auto p-3',
	empty: 'flex p-5 mb-2 flex-1 items-center justify-center rounded-[14px] border border-dashed border-slate-200 bg-slate-50/80 text-sm text-slate-400',
	groupLabel: 'mb-2 mt-4 px-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400',
	addCard: 'group flex cursor-pointer items-center justify-center rounded-[14px] border border-dashed border-emerald-200 bg-emerald-50/30 mt-2 px-4 py-3 text-sm font-medium text-emerald-700 transition hover:-translate-y-0.5 hover:bg-emerald-50',
	rowWrap: 'group relative',
	actions: 'absolute right-2 top-1/2 z-10 flex -translate-y-1/2 items-center gap-1 rounded-full border border-slate-200 bg-white px-1.5 py-1 opacity-0 shadow-sm transition group-hover:opacity-100',
	actionButton: 'inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-emerald-700',
	flashRing: 'ring-2 ring-emerald-200 ring-offset-2 ring-offset-white',
};

function getTypeLabel(value: JsonValue) {
	if (Array.isArray(value)) {
		return `Array(${value.length})`;
	}

	if (value && typeof value === 'object') {
		if ('$oid' in value) {
			return 'ObjectId';
		}

		return 'Object';
	}

	if (typeof value === 'string') {
		return 'String';
	}

	if (typeof value === 'number') {
		return 'Number';
	}

	if (typeof value === 'boolean') {
		return 'Boolean';
	}

	return 'Null';
}

function isNavigable(value: JsonValue) {
	return Array.isArray(value) || (value !== null && typeof value === 'object' && !('$oid' in value));
}

function describeValue(value: JsonValue) {
	if (Array.isArray(value)) {
		return `${value.length} item${value.length === 1 ? '' : 's'}`;
	}

	if (value && typeof value === 'object') {
		return Object.keys(value).length === 0 ? 'empty object' : `${Object.keys(value).length} fields`;
	}

	if (typeof value === 'string') {
		return value;
	}

	return String(value);
}

function getBadge(value: JsonValue) {
	if (Array.isArray(value)) {
		return <FolderPlus className="h-4 w-4" />;
	}

	if (value && typeof value === 'object') {
		return <Layers3 className="h-4 w-4" />;
	}

	return <span className="text-[11px] font-semibold uppercase tracking-[0.15em]">abc</span>;
}

function getDocumentIdFromValue(value: JsonValue | null) {
	if (value && typeof value === 'object' && !Array.isArray(value) && '$oid' in value) {
		return (value as { $oid: string }).$oid;
	}

	return null;
}

function resolveColumnValue(rootValue: JsonValue, path: string[]) {
	let current: any = rootValue;
	for (const segment of path) {
		if (current == null) {
			return undefined;
		}

		if (Array.isArray(current)) {
			current = current[Number(segment)];
			continue;
		}

		current = current[segment];
	}

	return current;
}

function pathKey(path: string[]) {
	return path.join('.');
}

export function JsonLevelColumn({ title, value, path, depth, columnIndex, isTerminal, isLeadingVisibleColumn }: JsonLevelColumnProps) {
	const setFieldPath = useExplorerState((state) => state.setFieldPath);
	const jumpToDepth = useExplorerState((state) => state.jumpToDepth);
	const activeFieldPath = useExplorerState((state) => state.fieldPath);
	const flashPath = useExplorerState((state) => state.flashPath);
	const flashTracePath = useExplorerState((state) => state.flashTracePath);
	const refreshCurrentView = useExplorerState((state) => state.refreshCurrentView);
	const selectedDatabase = useExplorerState((state) => state.selectedDatabase);
	const selectedCollection = useExplorerState((state) => state.selectedCollection);
	const selectedDocument = useExplorerState((state) => state.selectedDocument);
	const currentPath = path.join('.');
	const [editingKey, setEditingKey] = useState<string | null>(null);
	const [adding, setAdding] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState<{ key: string; label: string; value: JsonValue } | null>(null);
	const [copiedKey, setCopiedKey] = useState<string | null>(null);

	const documentId = useMemo(() => getDocumentIdFromValue(selectedDocument?._id ?? null), [selectedDocument]);
	const parentValue = resolveColumnValue(value, []);
	const isArrayColumn = Array.isArray(parentValue);
	const isObjectColumn = parentValue !== null && typeof parentValue === 'object' && !Array.isArray(parentValue) && !('$oid' in (parentValue as Record<string, unknown>));
	const entries = useMemo(() => {
		if (Array.isArray(parentValue)) {
			return parentValue.map((item, index) => [String(index), item] as const);
		}

		if (isObjectColumn) {
			return Object.entries(parentValue as JsonObject);
		}

		return [] as Array<readonly [string, JsonValue]>;
	}, [isObjectColumn, parentValue]);

	const traceBase = useMemo(() => [selectedDatabase, selectedCollection ?? '', documentId ?? '', ...path].filter(Boolean), [documentId, path, selectedCollection, selectedDatabase]);

	function isSelectedPath(nextPath: string[]) {
		if (nextPath.length === 0 || activeFieldPath.length < nextPath.length) {
			return false;
		}

		return activeFieldPath.slice(0, nextPath.length).join('.') === nextPath.join('.');
	}

	function isObjectIdValue(nextValue: JsonValue) {
		return Boolean(nextValue && typeof nextValue === 'object' && !Array.isArray(nextValue) && '$oid' in nextValue);
	}

	function popOnceFromCurrentDepth() {
		void jumpToDepth(Math.max(0, activeFieldPath.length + 1));
	}

	async function copyObjectId(key: string, nextValue: JsonValue) {
		if (!isObjectIdValue(nextValue)) {
			return;
		}

		const objectId = (nextValue as { $oid: string }).$oid;
		await navigator.clipboard.writeText(objectId);
		setCopiedKey(key);
		window.setTimeout(() => {
			setCopiedKey((current) => (current === key ? null : current));
		}, 1200);
	}

	function isFlashedPath(nextPath: string[]) {
		const activeFlash = flashPath?.slice(3);
		if (!activeFlash || activeFlash.length === 0) {
			return false;
		}

		if (nextPath.length > activeFlash.length) {
			return false;
		}

		return activeFlash.slice(0, nextPath.length).join('.') === nextPath.join('.');
	}

	async function handleMutation(tracePath: string[]) {
		flashTracePath(tracePath);
		setEditingKey(null);
		setAdding(false);
		setDeleteTarget(null);
		await refreshCurrentView();
	}

	if (Array.isArray(parentValue)) {
		return (
			<section className={styles.column}>
				<header className={styles.header}>
					<div>
						<div className={styles.headerLabel}>{title}</div>
						<div className={styles.headerMeta}>{currentPath || 'array'}</div>
					</div>
					<div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
						{parentValue.length} items
					</div>
				</header>
				<div className={styles.body}>
					{parentValue.length === 0 ? <div className={styles.empty}>Empty array</div> : null}
					<div className="space-y-2">
						{entries.map(([key, item]) => {
							const index = Number(key);
							const nextPath = [...path, String(index)];
							const navigable = isNavigable(item);
							const isObjectId = isObjectIdValue(item);
							const shouldPopOnClick = !navigable && isLeadingVisibleColumn && !isObjectId;

							return (
								<div key={`${pathKey(nextPath)}-${index}`} className={`${styles.rowWrap} ${isFlashedPath(nextPath) ? styles.flashRing : ''}`}>
									{editingKey === key ? (
										<InlineSegmentEditor
											mode="edit"
											containerType="array"
											database={selectedDatabase}
											collection={selectedCollection ?? ''}
											documentId={documentId ?? ''}
											parentPath={path}
											existingKeys={[]}
											initialKey={key}
											initialValue={item}
											onCancel={() => setEditingKey(null)}
											onSaved={(tracePath) => void handleMutation(tracePath)}
										/>
									) : (
										<>
											<ColumnItem
												label={`[${index}]`}
												subtitle={describeValue(item)}
												meta={getTypeLabel(item)}
												leading={getBadge(item)}
												selected={isSelectedPath(nextPath)}
												onClick={navigable ? () => setFieldPath(nextPath) : shouldPopOnClick ? popOnceFromCurrentDepth : undefined}
											/>
											<div className={styles.actions}>
												{isObjectId ? (
													<button className={styles.actionButton} onClick={() => void copyObjectId(key, item)} aria-label="Copy id">
														{copiedKey === key ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
													</button>
												) : (
													<>
														<button className={styles.actionButton} onClick={() => setEditingKey(key)} aria-label="Edit item">
															<PencilLine className="h-4 w-4" />
														</button>
														<button className={styles.actionButton} onClick={() => setDeleteTarget({ key, label: `[${index}]`, value: item })} aria-label="Delete item">
															<Trash2 className="h-4 w-4" />
														</button>
													</>
												)}
											</div>
										</>
									)}
								</div>
							);
						})}
						{adding ? (
							<InlineSegmentEditor
								mode="add"
								containerType="array"
								database={selectedDatabase}
								collection={selectedCollection ?? ''}
								documentId={documentId ?? ''}
								parentPath={path}
								existingKeys={[]}
								onCancel={() => setAdding(false)}
								onSaved={(tracePath) => void handleMutation(tracePath)}
							/>
						) : null}
					</div>
					<button className={styles.addCard} onClick={() => setAdding(true)}>
						<Plus className="mr-2 h-4 w-4" />
						Add segment
					</button>
				</div>

				<DeleteConfirmModal
					open={Boolean(deleteTarget)}
					title={deleteTarget ? `Delete ${deleteTarget.label}?` : 'Delete item?'}
					description="하위 데이터가 모두 삭제됩니다. 계속하시겠습니까?"
					onCancel={() => setDeleteTarget(null)}
					onConfirm={async () => {
						if (!deleteTarget || !documentId) {
							return;
						}

						const result = await mockAPI.mutateData({
							type: 'mutateField',
							database: selectedDatabase,
							collection: selectedCollection ?? '',
							documentId,
							field: {
								action: 'delete',
								containerType: 'array',
								path,
								key: deleteTarget.key,
							},
						});

						await handleMutation(result.tracePath);
					}}
				/>
			</section>
		);
	}

	if (value === null || typeof value !== 'object' || '$oid' in value) {
		return (
			<section className={styles.column}>
				<header className={styles.header}>
					<div>
						<div className={styles.headerLabel}>{title}</div>
						<div className={styles.headerMeta}>{currentPath || 'value'}</div>
					</div>
					<div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
						{getTypeLabel(value)}
					</div>
				</header>
				<div className={styles.body}>
					<div className={styles.empty}>{describeValue(value)}</div>
				</div>
			</section>
		);
	}

	const objectValue = value as JsonObject;
	const objectEntries = Object.entries(objectValue);
	const objectKeys = objectEntries.map(([key]) => key);

	return (
		<motion.section
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.22 }}
			className={styles.column}
		>
			<header className={styles.header}>
				<div>
					<div className={styles.headerLabel}>{title}</div>
					<div className={styles.headerMeta}>{currentPath || 'object'}</div>
				</div>
				<div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
					{objectEntries.length} fields
				</div>
			</header>
			<div className={styles.body}>
				{objectEntries.length === 0 ? <div className={styles.empty}>Empty object</div> : null}
				<div className="space-y-2">
					{objectEntries.map(([key, fieldValue]) => {
						const nextPath = [...path, key];
						const navigable = isNavigable(fieldValue);
						const isObjectId = key === '_id' && isObjectIdValue(fieldValue);
						const shouldPopOnClick = !navigable && isLeadingVisibleColumn && !isObjectId;

						return (
							<div key={`${pathKey(nextPath)}-${key}`} className={`${styles.rowWrap} ${isFlashedPath(nextPath) ? styles.flashRing : ''}`}>
								{editingKey === key ? (
									<InlineSegmentEditor
										mode="edit"
										containerType="object"
										database={selectedDatabase}
										collection={selectedCollection ?? ''}
										documentId={documentId ?? ''}
										parentPath={path}
										existingKeys={objectKeys}
										initialKey={key}
										initialValue={fieldValue}
										onCancel={() => setEditingKey(null)}
										onSaved={(tracePath) => void handleMutation(tracePath)}
									/>
								) : (
									<>
										<ColumnItem
											label={key}
											subtitle={describeValue(fieldValue)}
											meta={getTypeLabel(fieldValue)}
											leading={getBadge(fieldValue)}
											selected={isSelectedPath(nextPath)}
											onClick={navigable ? () => setFieldPath(nextPath) : shouldPopOnClick ? popOnceFromCurrentDepth : undefined}
										/>
										<div className={styles.actions}>
											{isObjectId ? (
												<button className={styles.actionButton} onClick={() => void copyObjectId(key, fieldValue)} aria-label="Copy id">
													{copiedKey === key ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
												</button>
											) : (
												<>
													<button className={styles.actionButton} onClick={() => setEditingKey(key)} aria-label="Edit item">
														<PencilLine className="h-4 w-4" />
													</button>
													<button className={styles.actionButton} onClick={() => setDeleteTarget({ key, label: key, value: fieldValue })} aria-label="Delete item">
														<Trash2 className="h-4 w-4" />
													</button>
												</>
											)}
										</div>
									</>
								)}
							</div>
						);
					})}
					{adding ? (
						<InlineSegmentEditor
							mode="add"
							containerType="object"
							database={selectedDatabase}
							collection={selectedCollection ?? ''}
							documentId={documentId ?? ''}
							parentPath={path}
							existingKeys={objectKeys}
							onCancel={() => setAdding(false)}
							onSaved={(tracePath) => void handleMutation(tracePath)}
						/>
					) : null}
				</div>
				<button className={styles.addCard} onClick={() => setAdding(true)}>
					<Plus className="mr-2 h-4 w-4" />
					Add segment
				</button>
			</div>

			<DeleteConfirmModal
				open={Boolean(deleteTarget)}
				title={deleteTarget ? `Delete ${deleteTarget.label}?` : 'Delete item?'}
				description="하위 데이터가 모두 삭제됩니다. 계속하시겠습니까?"
				onCancel={() => setDeleteTarget(null)}
				onConfirm={async () => {
					if (!deleteTarget || !documentId) {
						return;
					}

					const result = await mockAPI.mutateData({
						type: 'mutateField',
						database: selectedDatabase,
						collection: selectedCollection ?? '',
						documentId,
						field: {
							action: 'delete',
							containerType: 'object',
							path,
							key: deleteTarget.key,
						},
					});

					await handleMutation(result.tracePath);
				}}
			/>
		</motion.section>
	);
}
