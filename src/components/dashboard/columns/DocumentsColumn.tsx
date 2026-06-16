import { useState } from 'react';
import { FileText, Plus } from 'lucide-react';
import type { ActivePath, DocumentSummary, MockMutationRequest } from '../../../types/explorer';
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
  addCardText: 'text-xs text-slate-400',
  empty: 'flex flex-col items-center justify-center flex-1 gap-2 text-slate-400 text-sm py-8',
} as const;

// ── Props ─────────────────────────────────────────────────────────────────────

interface DocumentsColumnProps {
  path: ActivePath;
  documents: DocumentSummary[];
  activeDocumentOid: string | null;
  isLoading: boolean;
  changedPaths: string[];
  editingId: string | null;
  activeCollectionName: string | null;
  activeDatabaseName: string | null;
  onSelectDocument: (oid: string, title: string) => Promise<void>;
  onMutate: (op: MockMutationRequest) => Promise<unknown>;
  onSetEditingId: (id: string | null) => void;
}

// ── 컴포넌트 ──────────────────────────────────────────────────────────────────

export function DocumentsColumn({
  path,
  documents,
  activeDocumentOid,
  isLoading,
  changedPaths,
  editingId,
  activeCollectionName,
  activeDatabaseName,
  onSelectDocument,
  onMutate,
  onSetEditingId,
}: DocumentsColumnProps) {
  const [deleteTarget, setDeleteTarget] = useState<DocumentSummary | null>(null);
  const collectionLabel = path.kind === 'normal' ? path.label : '';

  const handleDeleteDocument = async () => {
    if (!deleteTarget || !activeCollectionName || !activeDatabaseName) return;
    await onMutate({
      type: 'deleteDocument',
      database: activeDatabaseName,
      collection: activeCollectionName,
      documentId: deleteTarget.id,
    });
    setDeleteTarget(null);
  };

  return (
    <div className={styles.container}>
      {/* 헤더 */}
      <div className={styles.header}>
        <FileText size={14} className={styles.headerIcon} />
        <span className={styles.headerTitle}>{collectionLabel}</span>
        <span className={styles.headerCount}>{documents.length}</span>
      </div>

      {/* 목록 */}
      <div className={styles.list}>
        {isLoading && !documents.length ? (
          <ColumnSkeletonList count={5} />
        ) : documents.length === 0 ? (
          <div className={styles.empty}>
            <FileText size={28} className="opacity-30" />
            <span>문서 없음</span>
          </div>
        ) : (
          documents.map((doc) => {
            const isEditing = editingId === `document:${doc.id}`;
            const isHighlighted = changedPaths.some((p) => p.includes(doc.id));

            if (isEditing) {
              return (
                <InlineSegmentEditor
                  key={doc.id}
                  mode="edit"
                  level="document"
                  initialKey={doc.title}
                  siblingKeys={[]}
                  onSubmit={async () => {
                    // 문서 자체 이름 변경은 field mutate로 처리
                    onSetEditingId(null);
                  }}
                  onCancel={() => onSetEditingId(null)}
                  onDelete={() => setDeleteTarget(doc)}
                />
              );
            }

            return (
              <ColumnItem
                key={doc.id}
                id={doc.id}
                label={doc.title}
                meta={doc.preview}
                isActive={activeDocumentOid === doc.id}
                isHighlighted={isHighlighted}
                variant="document"
                onSelect={() => void onSelectDocument(doc.id, doc.title)}
                onEdit={() => onSetEditingId(`document:${doc.id}`)}
                onDelete={() => setDeleteTarget(doc)}
              />
            );
          })
        )}

        {/* 추가 카드 */}
        {editingId === 'document:__new__' ? (
          <InlineSegmentEditor
            mode="add"
            level="document"
            siblingKeys={[]}
            onSubmit={async () => {
              // 빈 문서 upsert — _id는 클라이언트에서 생성
              onSetEditingId(null);
            }}
            onCancel={() => onSetEditingId(null)}
          />
        ) : (
          <button
            type="button"
            className={styles.addCard}
            onClick={() => onSetEditingId('document:__new__')}
            disabled={!!editingId}
          >
            <Plus size={14} className="text-slate-400" />
            <span className={styles.addCardText}>문서 추가</span>
          </button>
        )}
      </div>

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <DeleteConfirmModal
          isOpen={!!deleteTarget}
          targetType="document"
          targetLabel={deleteTarget.title}
          onConfirm={handleDeleteDocument}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
