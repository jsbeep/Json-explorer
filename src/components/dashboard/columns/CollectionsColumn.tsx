import { useState } from 'react';
import { motion } from 'framer-motion';
import { Layers, Plus } from 'lucide-react';
import { createPortal } from 'react-dom';
import type { ActivePath, CollectionSummary, Document, JsonValue, MockMutationRequest } from '../../../types/explorer';
import { ColumnItem, ColumnSkeletonList } from './ColumnItem';
import { InlineSegmentEditor } from '../../editors/InlineSegmentEditor';
import { DeleteConfirmModal } from '../../common/DeleteConfirmModal';
import { getSnapshot } from '../../../services/mockStorage';

// ── 스타일 ────────────────────────────────────────────────────────────────────

const styles = {
  container: 'flex flex-col min-h-0 flex-1',
  header: 'shrink-0 flex items-center gap-2 px-4 h-11 border-b border-slate-100',
  headerIcon: 'text-slate-400',
  headerTitle: 'text-[13px] font-semibold text-slate-700 truncate flex-1',
  headerCount: 'text-xs text-slate-400 font-mono',
  list: 'flex-1 overflow-y-auto min-h-0 p-2 flex flex-col gap-0.5',
  addCard: 'group flex items-center gap-3 px-4 py-3.5 rounded-2xl cursor-pointer hover:bg-slate-50/80 active:bg-slate-100/50 transition-colors disabled:opacity-40 disabled:cursor-default',
  addCardIcon: 'shrink-0 w-9 h-9 rounded-xl flex items-center justify-center border border-dashed border-slate-300 text-slate-400 group-hover:border-emerald-300 group-hover:text-emerald-500 transition-colors',
  addCardText: 'text-sm font-medium text-slate-400 group-hover:text-emerald-600 transition-colors',
  empty: 'flex flex-col items-center justify-center flex-1 gap-2 text-slate-400 text-sm pb-20',
} as const;

// ── Props ─────────────────────────────────────────────────────────────────────

interface CollectionsColumnProps {
  path: ActivePath;
  collections: CollectionSummary[];
  activeCollectionName: string | null;
  isLoading: boolean;
  changedPaths: string[];
  editingId: string | null;
  onSelectCollection: (name: string, label: string) => Promise<void>;
  onMutate: (op: MockMutationRequest) => Promise<unknown>;
  onSetEditingId: (id: string | null) => void;
}

// ── 컴포넌트 ──────────────────────────────────────────────────────────────────

export function CollectionsColumn({
  path,
  collections,
  activeCollectionName,
  isLoading,
  changedPaths,
  editingId,
  onSelectCollection,
  onMutate,
  onSetEditingId,
}: CollectionsColumnProps) {
  const [deleteTarget, setDeleteTarget] = useState<CollectionSummary | null>(null);
  const databaseName = path.kind === 'normal' ? (path.databaseName ?? '') : '';

  const handleAddCollection = async (name: string, label: string, description: string) => {
    await onMutate({
      type: 'createCollection',
      database: databaseName,
      collection: { name, label, description },
    });
    onSetEditingId(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await onMutate({
      type: 'deleteCollection',
      database: databaseName,
      collection: deleteTarget.name,
    });
    setDeleteTarget(null);
  };

  return (
    <div className={styles.container}>
      {/* 헤더 */}
      <div className={styles.header}>
        <Layers size={14} className={styles.headerIcon} />
        <span className={styles.headerTitle}>Collections</span>
        <span className={styles.headerCount}>{collections.length}</span>
      </div>

      {/* 목록 */}
      <div className={styles.list}>
        {isLoading && !collections.length ? (
          <ColumnSkeletonList count={4} />
        ) : (
          collections.map((col) => {
            const isEditing = editingId === `collection:${col.name}`;
            const isHighlighted = changedPaths.some((p) => p.includes(col.name));

            if (isEditing) {
              return (
                <InlineSegmentEditor
                  key={col.name}
                  mode="edit"
                  level="collection"
                  initialKey={col.name}
                  siblingKeys={collections.map((c) => c.name).filter((n) => n !== col.name)}
                  onExportRequest={async () => {
                    const snapshot = getSnapshot();
                    const record = snapshot.databases[databaseName]?.collections[col.name];
                    if (!record) return {};
                    return {
                      name: record.name,
                      label: record.label,
                      description: record.description,
                      documents: record.documents,
                    } as JsonValue;
                  }}
                  onSubmit={async (data) => {
                    await onMutate({
                      type: 'renameCollection',
                      database: databaseName,
                      oldName: col.name,
                      newName: data.key,
                      label: data.label ?? data.key,
                    });
                    onSetEditingId(null);
                  }}
                  onCancel={() => onSetEditingId(null)}
                  onDelete={() => setDeleteTarget(col)}
                />
              );
            }

            return (
              <ColumnItem
                key={col.name}
                id={col.name}
                label={col.label}
                meta={`${col.documentCount}개 문서 · ${col.sizeMb}MB`}
                isActive={activeCollectionName === col.name}
                isHighlighted={isHighlighted}
                variant="collection"
                onSelect={() => void onSelectCollection(col.name, col.label)}
                onEdit={() => onSetEditingId(`collection:${col.name}`)}
                onDelete={() => setDeleteTarget(col)}
              />
            );
          })
        )}

        {/* 추가 카드 */}
        {editingId === 'collection:__new__' ? (
          <InlineSegmentEditor
            mode="add"
            level="collection"
            siblingKeys={collections.map((c) => c.name)}
            onSubmit={async (data) => {
              if (data.importedJson && typeof data.importedJson === 'object' && !Array.isArray(data.importedJson)) {
                const imported = data.importedJson as { name?: string; label?: string; description?: string; documents?: Document[] };
                await onMutate({
                  type: 'createCollection',
                  database: databaseName,
                  collection: {
                    name: imported.name ?? data.key,
                    label: imported.label ?? data.label ?? data.key,
                    description: imported.description ?? '',
                    documents: Array.isArray(imported.documents) ? imported.documents : [],
                  },
                });
                onSetEditingId(null);
                return;
              }
              await handleAddCollection(data.key, data.label ?? data.key, '');
            }}
            onCancel={() => onSetEditingId(null)}
          />
        ) : (
          <motion.button
            type="button"
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className={styles.addCard}
            onClick={() => onSetEditingId('collection:__new__')}
          >
            <span className={styles.addCardIcon}>
              <Plus size={16} />
            </span>
            <span className={styles.addCardText}>컬렉션 추가</span>
          </motion.button>
        )}
        {!collections.length && (
          <div className={styles.empty}>
            <Layers size={28} className="opacity-30" />
            <span>컬렉션 없음</span>
          </div>
        )}
      </div>

      {/* 삭제 확인 모달 */}
      {deleteTarget && createPortal(
        <DeleteConfirmModal
          isOpen={!!deleteTarget}
          targetType="collection"
          targetLabel={deleteTarget.label}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />,
        document.body
      )}
    </div>
  );
}
