import { AlertTriangle, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

type DeleteConfirmModalProps = {
	open: boolean;
	title?: string;
	description?: string;
	confirmLabel?: string;
	onCancel: () => void;
	onConfirm: () => void | Promise<void>;
};

const styles = {
	overlay: 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-sm',
	modal: 'w-full max-w-md rounded-[20px] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.18)]',
	icon: 'flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600',
	buttonBase: 'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition',
	confirm: 'bg-rose-600 text-white hover:bg-rose-700',
	cancel: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
};

export function DeleteConfirmModal({
	open,
	title = 'Delete item?',
	description = '하위 데이터가 모두 삭제됩니다. 계속하시겠습니까?',
	confirmLabel = 'Delete',
	onCancel,
	onConfirm,
}: DeleteConfirmModalProps) {
	return (
		<AnimatePresence>
			{open ? (
				<motion.div
					className={styles.overlay}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					onClick={onCancel}
				>
					<motion.div
						className={styles.modal}
						initial={{ opacity: 0, y: 18, scale: 0.98 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 18, scale: 0.98 }}
						transition={{ duration: 0.18 }}
						onClick={(event) => event.stopPropagation()}
					>
						<div className="flex items-start gap-4">
							<div className={styles.icon}>
								<AlertTriangle className="h-5 w-5" />
							</div>
							<div className="min-w-0 flex-1">
								<h3 className="text-base font-semibold text-slate-900">{title}</h3>
								<p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
							</div>
						</div>

						<div className="mt-5 flex items-center justify-end gap-2">
							<button className={styles.buttonBase + ' ' + styles.cancel} onClick={onCancel}>
								Cancel
							</button>
							<button className={styles.buttonBase + ' ' + styles.confirm} onClick={() => void onConfirm()}>
								<Trash2 className="mr-2 h-4 w-4" />
								{confirmLabel}
							</button>
						</div>
					</motion.div>
				</motion.div>
			) : null}
		</AnimatePresence>
	);
}
