import { useState } from 'react';
import { Layers } from 'lucide-react';
import { createPortal } from 'react-dom';
import type { ActivePath, CollectionSummary, Document, JsonValue, MockMutationRequest } from '../../../types/explorer';
import { ColumnItem, ColumnSkeletonList } from './ColumnItem';
import { AddItemButton } from './AddItemButton';
import { InlineSegmentEditor } from '../../editors/InlineSegmentEditor';
import { DeleteConfirmModal } from '../../common/DeleteConfirmModal';
import { getSnapshot } from '../../../services/mockStorage';
import { columnListStyles as styles } from './columnListStyles';
import { isPathChanged } from '../../../utils/changedPaths';

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
            const isHighlighted = isPathChanged(changedPaths, `databases.${databaseName}.collections.${col.name}`);

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
          <AddItemButton
            label="컬렉션 추가"
            onClick={() => onSetEditingId('collection:__new__')}
            buttonClassName={styles.addCard}
            iconClassName={styles.addCardIcon}
            textClassName={styles.addCardText}
          />
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
