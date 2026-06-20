// path: src/components/dashboard/columns/FieldItem.tsx
import type { ReactNode } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { ChevronRight, Pencil } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { SPRING_SNAPPY, SPRING_HOVER } from '../../../utils/motionPresets';
import { useHover } from '../../../hooks/useHover';

export interface FieldItemProps {
  fieldKey: string;
  isId: boolean;
  isExpandable: boolean;
  isEditable: boolean;
  isHighlighted: boolean;
  reduceMotion?: boolean;
  onEdit: () => void;
  onClick: (() => void) | null;
  children: ReactNode;
}

export function FieldItem({
  fieldKey, isId, isExpandable, isEditable, isHighlighted, reduceMotion = false,
  onEdit, onClick, children,
}: FieldItemProps) {
  const { hovered, hoverHandlers } = useHover();

  return (
    <m.div
      layout={!reduceMotion}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={SPRING_SNAPPY}
      className={cn(
        'relative flex items-center gap-3 px-4 py-3.5 rounded-2xl',
        onClick ? 'cursor-pointer hover:bg-slate-50/80 active:bg-slate-100/60' : 'cursor-default',
        isHighlighted ? 'bg-emerald-50/40' : '',
      )}
      {...hoverHandlers}
      onClick={onClick ?? undefined}
    >
      <span className={cn(
        'text-[13px] py-1.5 font-mono font-medium shrink-0 w-[20%] truncate',
        isId ? 'text-slate-400' : 'text-slate-500',
      )}>
        {fieldKey}
      </span>

      <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
        {children}
      </div>

      <div className="flex items-center shrink-0">
        {isExpandable && (
          <m.span
            animate={{ x: hovered && isEditable ? 2 : 0 }}
            transition={SPRING_HOVER}
            className="mr-1"
          >
            <ChevronRight size={15} className="text-slate-300" />
          </m.span>
        )}
        {isEditable && (
          <AnimatePresence>
            {hovered && (
              <m.div
                className="flex items-center overflow-hidden"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 'auto', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={SPRING_HOVER}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                  onClick={onEdit}
                >
                  <Pencil size={16} />
                </button>
              </m.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </m.div>
  );
}
