// path: src/components/dashboard/Breadcrumbs.tsx
import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Database, Layers, FileText, Braces, ChevronRight } from 'lucide-react';
import { ExplorerPathSegment } from '../../types/explorer';
import { cn } from '../../utils/cn';

const styles = {
  container: 'flex h-12 min-h-12 items-center overflow-hidden rounded-[14px] m-3 mb-0 border border-slate-200/80 bg-white/80 px-3 shadow-soft backdrop-blur',
  track: 'flex w-full items-center gap-0.5 overflow-x-auto whitespace-nowrap scroll-smooth',
  trackScroll: 'scrollbar-hide',
  empty: 'text-[13px] font-medium text-slate-400',
  breadcrumbBase: 'inline-flex h-7 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium transition-colors',
  breadcrumbHover: 'hover:bg-slate-100/30 cursor-pointer text-slate-600 hover:text-slate-800',
  breadcrumbActive: 'bg-slate-100/60 text-slate-900 font-semibold cursor-default',
  icon: 'h-3.5 w-3.5',
  chevron: 'h-3 w-3 shrink-0 text-slate-300',
} as const;

interface BreadcrumbsProps {
  breadcrumbs: ExplorerPathSegment[];
  onNavigate: (index: number) => void;
}

const getIconForKind = (kind: ExplorerPathSegment['kind']) => {
  switch (kind) {
    case 'database':
      return Database;
    case 'collection':
      return Layers;
    case 'document':
      return FileText;
    case 'field':
      return Braces;
    default:
      return null;
  }
};

export function Breadcrumbs({ breadcrumbs, onNavigate }: BreadcrumbsProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to end when breadcrumbs change
  useEffect(() => {
    if (!trackRef.current) return;
    
    // Use setTimeout to ensure DOM has been updated
    const timeoutId = setTimeout(() => {
      const { scrollWidth, clientWidth } = trackRef.current!;
      if (scrollWidth > clientWidth) {
        trackRef.current!.scrollLeft = scrollWidth - clientWidth;
      }
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [breadcrumbs]);

  const handleBreadcrumbClick = (index: number) => {
    if (index !== breadcrumbs.length - 1) {
      onNavigate(index);
    }
  };

  return (
    <section className={styles.container} aria-label="Breadcrumbs">
      <div ref={trackRef} className={cn(styles.track, styles.trackScroll)}>
        {breadcrumbs.length === 0 ? (
          <span className={styles.empty}>Connect to a database to begin exploring.</span>
        ) : (
          <AnimatePresence mode="popLayout">
            {breadcrumbs.map((segment, index) => {
              const isActive = index === breadcrumbs.length - 1;
              const IconComponent = getIconForKind(segment.kind);
              const isReference = segment.chainColor !== undefined;
              const referenceStyle = isReference
                ? { color: segment.chainColor }
                : undefined;
              return (
                <motion.div
                  key={segment.key}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="inline-flex items-center gap-1"
                >
                  <button
                    type="button"
                    disabled={isActive}
                    onClick={() => handleBreadcrumbClick(index)}
                    className={cn(
                      styles.breadcrumbBase,
                      !isActive && styles.breadcrumbHover,
                      isActive && styles.breadcrumbActive,
                    )}
                    style={referenceStyle}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {IconComponent && <IconComponent className={styles.icon} />}
                    <span className="max-w-40 truncate">{segment.label}</span>
                  </button>
                  {index < breadcrumbs.length - 1 && (
                    <ChevronRight className={styles.chevron} aria-hidden="true" strokeWidth={2.5} />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </section>
  );
}
