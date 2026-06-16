import { useState } from 'react';
import { Layers, Plus } from 'lucide-react';
import type { ActivePath, CollectionSummary, MockMutationRequest } from '../../../types/explorer';
import { ColumnItem, ColumnSkeletonList } from './ColumnItem';
import { InlineSegmentEditor } from '../../editors/InlineSegmentEditor';
import { DeleteConfirmModal } from '../../common/DeleteConfirmModal';

// ── 스타일 ────────────────────────────────────────────────────────────────────

const styles = {
  container: 'flex flex-col min-h-0 flex-1',
  header: 'shrink-0 flex items-center gap-2 px-4 h-11 border-b border-slate-100',
  headerIcon: 'text-slate-400',
  headerTitle: 'text-[13px] font-semibold text-slate-700 truncate flex-1',
  headerCount: 'text-xs text-slate-400 font-mono',
  list: 'flex-1 overflow-y-auto min-h-0 p-2 flex flex-col gap-0.5',
  addCard: 'flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-slate-200 cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/50 transition-colors mt-1',
  addCardText: 'text-xs text-slate-400 hover:text-emerald-600',
  empty: 'flex flex-col items-center justify-center flex-1 gap-2 text-slate-400 text-sm py-8',
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
    // 실제 삭제 API 없음 — placeholder (deleteCollection이 mockAPI에 없음)
    // 향후 deleteCollection op 추가 시 연결
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
        ) : collections.length === 0 ? (
          <div className={styles.empty}>
            <Layers size={28} className="opacity-30" />
            <span>컬렉션 없음</span>
          </div>
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
                  initialLabel={col.label}
                  siblingKeys={collections.map((c) => c.name).filter((n) => n !== col.name)}
                  onSubmit={async (data) => {
                    // createCollection으로 upsert (name 변경 포함)
                    await onMutate({
                      type: 'createCollection',
                      database: databaseName,
                      collection: { name: data.key, label: data.label ?? data.key, description: col.description },
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
            onSubmit={async (data) => handleAddCollection(data.key, data.label ?? data.key, '')}
            onCancel={() => onSetEditingId(null)}
          />
        ) : (
          <button
            type="button"
            className={styles.addCard}
            onClick={() => onSetEditingId('collection:__new__')}
            disabled={!!editingId}
          >
            <Plus size={14} className="text-slate-400" />
            <span className={styles.addCardText}>컬렉션 추가</span>
          </button>
        )}
      </div>

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <DeleteConfirmModal
          isOpen={!!deleteTarget}
          targetType="collection"
          targetLabel={deleteTarget.label}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
