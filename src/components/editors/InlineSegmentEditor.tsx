import { Check, PencilLine, Plus, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { mockAPI } from '../../services/mockAPI';
import type { JsonValue } from '../../types/explorer';

export type InlineSegmentEditorMode = 'add' | 'edit';
export type InlineSegmentContainerType = 'object' | 'array';

type InlineSegmentEditorProps = {
	mode: InlineSegmentEditorMode;
	containerType: InlineSegmentContainerType;
	database: string;
	collection: string;
	documentId: string;
	parentPath: string[];
	existingKeys: string[];
	initialKey?: string;
	initialValue?: JsonValue;
	onCancel: () => void;
	onSaved: (tracePath: string[]) => void;
};

type ValueKind = 'string' | 'number' | 'boolean' | 'json';

const styles = {
	root: 'rounded-[16px] border border-dashed border-emerald-200 bg-emerald-50/40 p-3',
	card: 'rounded-[14px] border border-slate-200 bg-white p-4 shadow-sm',
	header: 'flex items-center justify-between gap-3',
	title: 'text-sm font-semibold text-slate-900',
	subtitle: 'text-xs text-slate-500',
	pill: 'inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700',
	label: 'text-xs font-semibold uppercase tracking-[0.16em] text-slate-400',
	input: 'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100',
	textarea: 'mt-1 min-h-[96px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100',	
	error: 'mt-2 text-sm text-red-500',
	buttonBase: 'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
	primary: 'bg-emerald-600 text-white hover:bg-emerald-700',
	ghost: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
	typeTab: 'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition',
	typeTabActive: 'border-emerald-200 bg-emerald-50 text-emerald-700',
	typeTabIdle: 'border-slate-200 bg-white text-slate-500 hover:border-emerald-200 hover:text-emerald-700',
};

function determineKind(value: JsonValue | undefined): ValueKind {
	if (typeof value === 'boolean') return 'boolean';
	if (typeof value === 'number') return 'number';
	if (typeof value === 'string') return 'string';
	return 'json';
}

function serializeValue(value: JsonValue | undefined) {
	if (value === undefined) return '';
	if (typeof value === 'string') return value;
	if (typeof value === 'number' || typeof value === 'boolean') return String(value);
	return JSON.stringify(value, null, 2);
}

function parseValue(kind: ValueKind, raw: string) {
	if (kind === 'string') return raw;
	if (kind === 'number') return raw.trim() === '' ? 0 : Number(raw);
	if (kind === 'boolean') return raw === 'true';
	if (raw.trim() === '') return null;
	return JSON.parse(raw);
}

function inferKindFromTypeLabel(value: JsonValue | undefined): ValueKind {
	if (Array.isArray(value)) return 'json';
	if (value !== null && typeof value === 'object') return 'json';
	return determineKind(value);
}

export function InlineSegmentEditor({
	mode,
	containerType,
	database,
	collection,
	documentId,
	parentPath,
	existingKeys,
	initialKey = '',
	initialValue,
	onCancel,
	onSaved,
}: InlineSegmentEditorProps) {
	const [keyName, setKeyName] = useState(initialKey);
	const [valueKind, setValueKind] = useState<ValueKind>(inferKindFromTypeLabel(initialValue));
	const [rawValue, setRawValue] = useState(serializeValue(initialValue));
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const isObjectMode = containerType === 'object';
	const isEdit = mode === 'edit';
	const availableKinds: ValueKind[] = useMemo(() => ['string', 'number', 'boolean', 'json'], []);

	const duplicateExists = useMemo(() => {
		if (!isObjectMode || keyName.trim() === '') {
			return false;
		}

		return existingKeys.some((existingKey) => existingKey === keyName.trim() && existingKey !== initialKey);
	}, [existingKeys, initialKey, isObjectMode, keyName]);

	const canSave = !isSaving && !duplicateExists && (isObjectMode ? keyName.trim().length > 0 : true);

	async function handleSave() {
		setError(null);

		try {
			if (isObjectMode && keyName.trim() === '') {
				setError('Key 이름을 입력해 주세요.');
				return;
			}

			const parsedValue = parseValue(valueKind, rawValue);
			const result = await mockAPI.mutateData({
				type: 'mutateField',
				database,
				collection,
				documentId,
				field: {
					action: isEdit ? 'edit' : 'add',
					containerType,
					path: parentPath,
					key: isEdit ? initialKey : isObjectMode ? keyName.trim() : initialKey,
					nextKey: isEdit && isObjectMode ? keyName.trim() : undefined,
					value: parsedValue as JsonValue,
				},
			});

			onSaved(result.tracePath);
		} catch (mutationError) {
			setError(mutationError instanceof Error ? mutationError.message : 'Failed to save segment');
		} finally {
			setIsSaving(false);
		}
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 6, scale: 0.99 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			transition={{ duration: 0.18 }}
			className={styles.root}
		>
			<div className={styles.card}>
				<div className={styles.header}>
					<div>
						<div className={styles.title}>{isEdit ? 'Edit segment' : 'Add segment'}</div>
						<div className={styles.subtitle}>{isObjectMode ? 'Object container' : 'Array container'}</div>
					</div>
					<span className={styles.pill}>{isEdit ? <PencilLine className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />} {mode}</span>
				</div>

				<div className="mt-4 space-y-3">
					<AnimatePresence>
						{isObjectMode ? (
							<motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}>
								<label className={styles.label}>Key</label>
								<input
									className={styles.input}
									value={keyName}
									onChange={(event) => setKeyName(event.target.value)}
									placeholder="fieldName"
								/>
								{duplicateExists ? <div className={styles.error}>동일한 Key 이름이 이미 존재합니다.</div> : null}
							</motion.div>
						) : null}
					</AnimatePresence>

					<div>
						<label className={styles.label}>Type</label>
						<div className="mt-2 flex flex-wrap gap-2">
							{availableKinds.map((kind) => (
								<button
									key={kind}
									className={`${styles.typeTab} ${valueKind === kind ? styles.typeTabActive : styles.typeTabIdle}`}
									onClick={() => {
										setValueKind(kind);
										if (kind !== 'json') {
											setRawValue(kind === 'boolean' ? 'false' : kind === 'number' ? '0' : '');
										}
									}}
								>
									{kind}
								</button>
							))}
						</div>
					</div>

					<div>
						<label className={styles.label}>Value</label>
						{valueKind === 'boolean' ? (
							<button
								className={`${styles.buttonBase} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}
								onClick={() => setRawValue(rawValue === 'true' ? 'false' : 'true')}
							>
								{rawValue === 'true' ? 'true' : 'false'}
							</button>
						) : valueKind === 'number' ? (
							<input
								className={styles.input}
								type="number"
								value={rawValue}
								onChange={(event) => setRawValue(event.target.value)}
							/>
						) : valueKind === 'string' ? (
							<input
								className={styles.input}
								type="text"
								value={rawValue}
								onChange={(event) => setRawValue(event.target.value)}
							/>
						) : (
							<textarea
								className={styles.textarea}
								value={rawValue}
								onChange={(event) => setRawValue(event.target.value)}
								placeholder={`{\n  "foo": "bar"\n}`}
							/>
						)}
					</div>
				</div>

				{error ? <div className={styles.error}>{error}</div> : null}

				<div className="mt-4 flex items-center justify-end gap-2">
					<button className={`${styles.buttonBase} ${styles.ghost}`} onClick={onCancel}>
						<X className="mr-2 h-4 w-4" />
						Cancel
					</button>
					<button
						className={`${styles.buttonBase} ${styles.primary}`}
						disabled={!canSave}
						onClick={() => {
							setIsSaving(true);
							void handleSave();
						}}
					>
						<Check className="mr-2 h-4 w-4" />
						Save
					</button>
				</div>
			</div>
		</motion.div>
	);
}
