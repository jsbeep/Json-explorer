import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { UseExplorerStateResult } from '../../hooks/useExplorerState';
import { CollectionsColumn } from './columns/CollectionsColumn';
import { DocumentsColumn } from './columns/DocumentsColumn';
import { JsonLevelColumn } from './columns/JsonLevelColumn';
import { PlaceholderColumn } from './columns/PlaceholderColumn';
import type { ActivePath } from '../../types/explorer';

// ── 상수 ──────────────────────────────────────────────────────────────────────

const FLEX_RATIOS = [3, 3, 4] as const;

// 컬렉션 용량이 이 값(MB)을 넘으면 layout 애니메이션 비용을 줄이기 위해 애니메이션을 끈다
const ANIMATION_DISABLE_THRESHOLD_MB = 0.5;

// ── 애니메이션 variants ────────────────────────────────────────────────────────

const colVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? '60%' : '-60%',
    opacity: 0,
    scale: 0.96,
  }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: {
    opacity: 0,
    scale: 0.94,
  },
};

const spring = { type: 'spring' as const, stiffness: 260, damping: 28 };

const placeholderVariants = {
  enter: { opacity: 0, scale: 0.9 },
  center: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.85 },
};

// ── Props 타입 ────────────────────────────────────────────────────────────────

type MillerColumnsProps = Pick<
  UseExplorerStateResult,
  | 'visibleColumns'
  | 'collections'
  | 'documents'
  | 'openDocument'
  | 'isLoading'
  | 'changedPaths'
  | 'editingId'
  | 'activePaths'
  | 'selectCollection'
  | 'selectDocument'
  | 'pushJsonPath'
  | 'pushReference'
  | 'navigateToReference'
  | 'popToIndex'
  | 'mutate'
  | 'uniqueOids'
  | 'registerUniqueOid'
  | 'unregisterUniqueOid'
  | 'setEditingId'
  | 'clearChangedPaths'
>;

// ── 컴포넌트 ──────────────────────────────────────────────────────────────────

export function MillerColumns({
  visibleColumns,
  collections,
  documents,
  openDocument,
  isLoading,
  changedPaths,
  editingId,
  activePaths,
  selectCollection,
  selectDocument,
  pushJsonPath,
  pushReference,
  navigateToReference,
  popToIndex,
  mutate,
  uniqueOids,
  registerUniqueOid,
  unregisterUniqueOid,
  setEditingId,
  clearChangedPaths,
}: MillerColumnsProps) {
  // 마지막 push 방향 (visibleColumns의 마지막 non-null 컬럼 방향)
  const direction = useMemo(() => {
    for (let i = visibleColumns.length - 1; i >= 0; i--) {
      const col = visibleColumns[i];
      if (col) return col.comp.direction;
    }
    return 1;
  }, [visibleColumns]);

  // activePaths 전체에서 현재 선택된 collection/document 식별
  const activeCollectionName = useMemo(() => {
    const docPath = activePaths.find((p) => p.columnKind === 'documents' && p.kind === 'normal');
    return docPath?.kind === 'normal' ? docPath.collectionName ?? null : null;
  }, [activePaths]);

  const activeDocumentOid = useMemo(() => {
    const jsonPath = activePaths.find((p) => p.columnKind === 'json' && p.kind === 'normal' && !p.projectionPath?.length);
    return jsonPath?.kind === 'normal' ? jsonPath.documentOid ?? null : null;
  }, [activePaths]);

  const activeDatabaseName = useMemo(() => {
    const cp = activePaths.find((p) => p.columnKind === 'collections');
    return cp?.kind === 'normal' ? (cp.databaseName ?? null) : null;
  }, [activePaths]);

  // 조회 중인 컬렉션이 무거우면 layout 애니메이션을 끈다 (FLIP 재계산 비용 절감)
  const reduceMotion = useMemo(() => {
    const sizeMb = collections.find((c) => c.name === activeCollectionName)?.sizeMb ?? 0;
    return sizeMb > ANIMATION_DISABLE_THRESHOLD_MB;
  }, [collections, activeCollectionName]);

  return (
    <div className="relative flex h-full w-full gap-3 overflow-hidden rounded-2xl p-3">
      <AnimatePresence initial={false} mode="popLayout" custom={direction}>
        {visibleColumns.map((col, slotIndex) => {
          const flex = FLEX_RATIOS[slotIndex];
          const isPlaceholder = col === null;
          const key = isPlaceholder ? `ph-${slotIndex}` : `col-${col.comp.id}`;

          return (
            <motion.div
              key={key}
              custom={direction}
              variants={isPlaceholder ? placeholderVariants : colVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={reduceMotion ? { duration: 0 } : spring}
              layout={!reduceMotion}
              style={{ flex, zIndex: 99 - slotIndex }} // 뒤에 나올수록 zIndex 낮게
              className={[
                'min-w-0 h-full flex flex-col rounded-2xl overflow-hidden',
                isPlaceholder
                  ? 'border border-dashed border-slate-200 opacity-40'
                  : 'bg-white border border-slate-200/80 shadow-panel',
              ].join(' ')}
            >
              {isPlaceholder ? (
                <PlaceholderColumn slotIndex={slotIndex} />
              ) : (
                <ColumnContent
                  col={col}
                  slotIndex={slotIndex}
                  reduceMotion={reduceMotion}
                  collections={collections}
                  documents={documents}
                  openDocument={openDocument}
                  isLoading={isLoading}
                  changedPaths={changedPaths}
                  editingId={editingId}
                  activePaths={activePaths}
                  activeCollectionName={activeCollectionName}
                  activeDocumentOid={activeDocumentOid}
                  activeDatabaseName={activeDatabaseName}
                  selectCollection={selectCollection}
                  selectDocument={selectDocument}
                  pushJsonPath={pushJsonPath}
                  pushReference={pushReference}
                  navigateToReference={navigateToReference}
                  popToIndex={popToIndex}
                  mutate={mutate}
                  uniqueOids={uniqueOids}
                  registerUniqueOid={registerUniqueOid}
                  unregisterUniqueOid={unregisterUniqueOid}
                  setEditingId={setEditingId}
                  clearChangedPaths={clearChangedPaths}
                />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// ── 컬럼 내용 분기 ────────────────────────────────────────────────────────────

interface ColumnContentProps extends Omit<MillerColumnsProps, 'visibleColumns'> {
  col: ActivePath;
  slotIndex: number;
  activeCollectionName: string | null;
  activeDocumentOid: string | null;
  activeDatabaseName: string | null;
  reduceMotion: boolean;
}

function ColumnContent({ col, slotIndex, ...rest }: ColumnContentProps) {
  if (col.columnKind === 'collections') {
    return (
      <CollectionsColumn
        path={col}
        collections={rest.collections}
        activeCollectionName={rest.activeCollectionName}
        isLoading={rest.isLoading}
        changedPaths={rest.changedPaths}
        editingId={rest.editingId}
        reduceMotion={rest.reduceMotion}
        onSelectCollection={rest.selectCollection}
        onMutate={rest.mutate}
        onSetEditingId={rest.setEditingId}
      />
    );
  }

  if (col.columnKind === 'documents') {
    return (
      <DocumentsColumn
        path={col}
        documents={rest.documents}
        collections={rest.collections}
        activeDocumentOid={rest.activeDocumentOid}
        isLoading={rest.isLoading}
        changedPaths={rest.changedPaths}
        editingId={rest.editingId}
        activeCollectionName={rest.activeCollectionName}
        activeDatabaseName={rest.activeDatabaseName}
        reduceMotion={rest.reduceMotion}
        onSelectDocument={rest.selectDocument}
        onMutate={rest.mutate}
        onSetEditingId={rest.setEditingId}
      />
    );
  }

  return (
    <JsonLevelColumn
      path={col}
      openDocument={rest.openDocument}
      slotIndex={slotIndex}
      isLoading={rest.isLoading}
      changedPaths={rest.changedPaths}
      editingId={rest.editingId}
      activePaths={rest.activePaths}
      activeCollectionName={rest.activeCollectionName}
      activeDatabaseName={rest.activeDatabaseName}
      reduceMotion={rest.reduceMotion}
      onPushJsonPath={rest.pushJsonPath}
      onPushReference={rest.pushReference}
      onNavigateToReference={rest.navigateToReference}
      onPopToIndex={rest.popToIndex}
      onMutate={rest.mutate}
      uniqueOids={rest.uniqueOids}
      onRegisterUniqueOid={rest.registerUniqueOid}
      onUnregisterUniqueOid={rest.unregisterUniqueOid}
      onSetEditingId={rest.setEditingId}
    />
  );
}
