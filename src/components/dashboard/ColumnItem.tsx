import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import React from 'react';

type ColumnItemProps = {
	label: string;
	subtitle?: string;
	meta?: string;
	selected?: boolean;
	disabled?: boolean;
	leading?: React.ReactNode;
	onClick?: () => void | Promise<void>;
};

const styles = {
	base: 'group flex w-full items-center justify-between gap-3 rounded-[14px] border px-4 py-3 text-left transition duration-200',
	selected: 'border-emerald-200 bg-emerald-50/80 shadow-[0_8px_24px_rgba(34,197,94,0.06)]',
	unselected: 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-sm',
	content: 'min-w-0 flex-1',
	label: 'truncate text-sm font-semibold text-slate-900',
	subtitle: 'mt-0.5 truncate text-xs text-slate-500',
	meta: 'shrink-0 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400',
};

export function ColumnItem({ label, subtitle, meta, selected, disabled, leading, onClick }: ColumnItemProps) {
	const Component: any = onClick ? motion.button : 'div';
	const isExpandable: boolean = !!meta && (meta === 'Object' || meta.split('(')[0] === 'Array');
    const motionProps = { ...(onClick && { whileTap: { scale: 0.985 } }),
        onClick: onClick,
        disabled: disabled,
        className: `${!selected && isExpandable ? 'bg-gray-100/50' : ''} ${styles.base} ${selected ? styles.selected : styles.unselected} ${disabled ? 'cursor-not-allowed opacity-60' : ''}}` };

	return (
		<Component
			{...motionProps}
		>
			<div className="flex min-w-0 items-start gap-3">
				{leading ? <div className="mt-0.5 text-emerald-600">{leading}</div> : null}
				<div className={styles.content}>
					<div className={styles.label}>{label}</div>
					{subtitle ? <div className={styles.subtitle}>{subtitle}</div> : null}
				</div>
			</div>
			<div className="flex items-center gap-2">
				{meta ? <div className={styles.meta}>{meta}</div> : null}
				{onClick ? <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:text-emerald-500" /> : null}
			</div>
		</Component>
	);
}

export default ColumnItem;

