import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Plus, Tag, Check, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import type { ActivePath, CollectionSummary, Document, DocumentSummary, MockMutationRequest } from '../../../types/explorer';
import { ColumnItem, ColumnSkeletonList } from './ColumnItem';
import { InlineSegmentEditor } from '../../editors/InlineSegmentEditor';
import { DeleteConfirmModal } from '../../common/DeleteConfirmModal';
import { generateObjectId } from '../../../utils/objectId';
import { cn } from '../../../utils/cn';
import { getFullDocumentById } from '../../../services/mockAPI';

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

interface DocumentsColumnProps {
  path: ActivePath;
  documents: DocumentSummary[];
  collections: CollectionSummary[];
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
  collections,
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
  const currentTitleKey = collections.find((c) => c.name === activeCollectionName)?.titleKey;

  const [isEditingTitleKey, setIsEditingTitleKey] = useState(false);
  const [titleKeyInput, setTitleKeyInput] = useState('');

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

  const handleSaveTitleKey = async () => {
    if (!activeCollectionName || !activeDatabaseName) return;
    await onMutate({
      type: 'setCollectionTitleKey',
      database: activeDatabaseName,
      collection: activeCollectionName,
      titleKey: titleKeyInput.trim(),
    });
    setIsEditingTitleKey(false);
  };

  return (
    <div className={styles.container}>
      {/* 헤더 */}
      <div className={styles.header}>
        {isEditingTitleKey ? (
          <>
            <input
              autoFocus
              type="text"
              className="flex-1 min-w-0 text-xs px-2 py-1 rounded-lg bg-slate-100/80 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:bg-white transition-all"
              placeholder="제목으로 쓸 필드 키 (예: name)"
              value={titleKeyInput}
              onChange={(e) => setTitleKeyInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleSaveTitleKey();
                if (e.key === 'Escape') setIsEditingTitleKey(false);
              }}
            />
            <button
              type="button"
              className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 transition-colors shrink-0"
              onClick={() => void handleSaveTitleKey()}
            >
              <Check size={14} />
            </button>
            <button
              type="button"
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors shrink-0"
              onClick={() => setIsEditingTitleKey(false)}
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <>
            <FileText size={14} className={styles.headerIcon} />
            <span className={styles.headerTitle}>{collectionLabel}</span>
            <button
              type="button"
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200/70 text-slate-500 hover:text-slate-700 transition-colors shrink-0',
                !activeCollectionName && 'opacity-40 pointer-events-none',
              )}
              title="제목으로 표시할 필드 선택"
              onClick={() => {
                setTitleKeyInput(currentTitleKey ?? 'name');
                setIsEditingTitleKey(true);
              }}
            >
              <Tag size={12} />
              <span className="text-[11px] font-mono">{currentTitleKey ?? 'name'}</span>
            </button>
            <span className={styles.headerCount}>{documents.length}</span>
          </>
        )}
      </div>

      {/* 목록 */}
      <div className={styles.list}>
        {isLoading && !documents.length ? (
          <ColumnSkeletonList count={5} />
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
                  onExportRequest={() => getFullDocumentById(doc.id)}
                  onSubmit={async (data) => {
                    if (!activeCollectionName || !activeDatabaseName) return;
                    await onMutate({
                      type: 'mutateField',
                      database: activeDatabaseName,
                      collection: activeCollectionName,
                      documentId: doc.id,
                      field: { path: [], key: currentTitleKey ?? 'name', action: 'edit', value: data.key, containerType: 'object' },
                    });
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
            onSubmit={async (data) => {
              if (!activeCollectionName || !activeDatabaseName) return;
              let newDoc: Document;
              if (data.importedJson && typeof data.importedJson === 'object' && !Array.isArray(data.importedJson)) {
                const imported = data.importedJson as Record<string, unknown>;
                const hasValidOid = imported._id && typeof imported._id === 'object' && !Array.isArray(imported._id) &&
                  typeof (imported._id as Record<string, unknown>).$oid === 'string';
                newDoc = {
                  ...(imported as Document),
                  _id: hasValidOid ? (imported._id as Document['_id']) : { $oid: generateObjectId() },
                };
              } else {
                newDoc = {
                  _id: { $oid: generateObjectId() },
                  [currentTitleKey ?? 'name']: data.key,
                };
              }
              await onMutate({
                type: 'upsertDocument',
                database: activeDatabaseName,
                collection: activeCollectionName,
                document: newDoc,
              });
              onSetEditingId(null);
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
            onClick={() => onSetEditingId('document:__new__')}
          >
            <span className={styles.addCardIcon}>
              <Plus size={16} />
            </span>
            <span className={styles.addCardText}>문서 추가</span>
          </motion.button>
        )}
        {!documents.length && (
          <div className={styles.empty}>
            <FileText size={28} className="opacity-30" />
            <span>문서 없음</span>
          </div>
        )}
      </div>

      {/* 삭제 확인 모달 */}
      {deleteTarget && createPortal(
        <DeleteConfirmModal
          isOpen={!!deleteTarget}
          targetType="document"
          targetLabel={deleteTarget.title}
          onConfirm={handleDeleteDocument}
          onCancel={() => setDeleteTarget(null)}
        />,
        document.body,
      )}
    </div>
  );
}
