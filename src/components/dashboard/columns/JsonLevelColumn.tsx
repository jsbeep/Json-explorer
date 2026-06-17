import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { nextPathId } from '../../../hooks/useExplorerState';
import {
  ChevronRight, Copy, Check, Braces, List, Link, Plus, Pencil, Hash, ToggleLeft, KeyRound
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  ActivePath,
  Document,
  JsonValue,
  MockMutationRequest,
  NormalActivePath,
  ReferenceActivePath,
} from '../../../types/explorer';
import { getFullDocumentById, getReferenceInfo, type ReferenceInfo } from '../../../services/mockAPI';
import { InlineSegmentEditor } from '../../editors/InlineSegmentEditor';
import { DeleteConfirmModal } from '../../common/DeleteConfirmModal';
import { cn } from '../../../utils/cn';
import { copyToClipboard } from '../../../utils/clipboard';

// ── 타입 헬퍼 ─────────────────────────────────────────────────────────────────

const isBsonOid = (v: JsonValue): v is { $oid: string } =>
  typeof v === 'object' && v !== null && !Array.isArray(v) &&
  Object.keys(v as object).length === 1 &&
  typeof (v as Record<string, unknown>)['$oid'] === 'string';

type JsonFieldType = 'string' | 'number' | 'boolean' | 'null' | 'array' | 'object' | 'oid';

const getFieldType = (v: JsonValue): JsonFieldType => {
  if (v === null) return 'null';
  if (isBsonOid(v)) return 'oid';
  if (Array.isArray(v)) return 'array';
  if (typeof v === 'object') return 'object';
  return typeof v as 'string' | 'number' | 'boolean';
};

const resolveAtPath = (doc: Document, path: string[]): JsonValue => {
  let node: JsonValue = doc;
  for (const seg of path) {
    if (node === null || typeof node !== 'object') return null;
    if (Array.isArray(node)) {
      node = (node as JsonValue[])[Number(seg)] ?? null;
    } else {
      node = (node as Record<string, JsonValue>)[seg] ?? null;
    }
  }
  return node;
};

const getEntries = (node: JsonValue): { key: string; value: JsonValue }[] => {
  if (node === null || typeof node !== 'object') return [];
  if (Array.isArray(node)) {
    return (node as JsonValue[]).map((v, i) => ({ key: String(i), value: v }));
  }
  return Object.entries(node as Record<string, JsonValue>).map(([k, v]) => ({ key: k, value: v }));
};

// ── 복사 버튼 ─────────────────────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
      onClick={(e) => {
        e.stopPropagation();
        copyToClipboard(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied
          ? <motion.span key="c" initial={{ scale: 0.5 }} animate={{ scale: 1 }} exit={{ scale: 0.5 }} className="block">
              <Check size={16} className="text-emerald-500" />
            </motion.span>
          : <motion.span key="d" initial={{ scale: 0.5 }} animate={{ scale: 1 }} exit={{ scale: 0.5 }} className="block">
              <Copy size={16} />
            </motion.span>
        }
      </AnimatePresence>
    </button>
  );
}

// ── FieldItem ─────────────────────────────────────────────────────────────────

interface FieldItemProps {
  fieldKey: string;
  isId: boolean;
  isExpandable: boolean;
  isEditable: boolean;
  isHighlighted: boolean;
  onEdit: () => void;
  onClick: (() => void) | null;
  children: React.ReactNode;
}

function FieldItem({
  fieldKey, isId, isExpandable, isEditable, isHighlighted,
  onEdit, onClick, children,
}: FieldItemProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
      className={cn(
        'relative flex items-center gap-3 px-4 py-3.5 rounded-2xl',
        onClick ? 'cursor-pointer hover:bg-slate-50/80 active:bg-slate-100/60' : 'cursor-default',
        isHighlighted ? 'bg-emerald-50/40' : '',
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
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
          <motion.span
            animate={{ x: hovered && isEditable ? 2 : 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="mr-1"
          >
            <ChevronRight size={15} className="text-slate-300" />
          </motion.span>
        )}
        {isEditable && (
          <AnimatePresence>
            {hovered && (
              <motion.div
                className="flex items-center overflow-hidden"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 'auto', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                  onClick={onEdit}
                >
                  <Pencil size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface JsonLevelColumnProps {
  path: ActivePath;
  openDocument: Document | null;
  slotIndex: number;
  isLoading: boolean;
  changedPaths: string[];
  editingId: string | null;
  activePaths: ActivePath[];
  activeCollectionName: string | null;
  activeDatabaseName: string | null;
  onPushJsonPath: (path: ActivePath) => void;
  onPushReference: (oid: string, fieldKey: string, popIndex?: number) => Promise<void>;
  onNavigateToReference: (oid: string) => Promise<void>;
  onPopToIndex: (index: number) => void;
  onMutate: (op: MockMutationRequest) => Promise<unknown>;
  uniqueOids: Set<string>;
  onRegisterUniqueOid: (oid: string) => void;
  onUnregisterUniqueOid: (oid: string) => void;
  onSetEditingId: (id: string | null) => void;
}

// ── 컴포넌트 ──────────────────────────────────────────────────────────────────

export function JsonLevelColumn({
  path,
  openDocument,
  slotIndex,
  isLoading,
  changedPaths,
  editingId,
  activePaths,
  activeCollectionName,
  activeDatabaseName,
  onPushJsonPath,
  onPushReference,
  onNavigateToReference,
  onPopToIndex,
  onMutate,
  uniqueOids,
  onRegisterUniqueOid,
  onUnregisterUniqueOid,
  onSetEditingId,
}: JsonLevelColumnProps) {
  const refOid     = path.kind === 'reference' ? path.refOid     : null;
  const chainColor = path.kind === 'reference' ? path.chainColor : undefined;
  const chainIndex = path.kind === 'reference' ? path.chainIndex : 0;
  const projectionPath: string[] = path.kind === 'normal'
    ? (path.projectionPath ?? [])
    : path.projectionPath;

  // visibleColumns는 activePaths.slice(-3) 왼쪽 정렬 → slotIndex로 실제 index 역산
  const myIndex = Math.max(0, activePaths.length - 3) + slotIndex;
  const hasPathsAfter = myIndex < activePaths.length - 1;

  const [refFullDoc, setRefFullDoc] = useState<Document | null>(null);
  useEffect(() => {
    if (!refOid) { setRefFullDoc(null); return; }
    setRefFullDoc(null);
    getFullDocumentById(refOid).then(setRefFullDoc).catch(() => setRefFullDoc(null));
  }, [refOid]);

  // 컬럼 헤더 REF 배지에 '{컬렉션}/{문서}' 표시용
  const [refInfo, setRefInfo] = useState<ReferenceInfo | null>(null);
  useEffect(() => {
    if (!refOid) { setRefInfo(null); return; }
    setRefInfo(null);
    getReferenceInfo(refOid).then(setRefInfo).catch(() => setRefInfo(null));
  }, [refOid]);

  const displayDoc = refOid ? refFullDoc : openDocument;

  const currentNode: JsonValue = displayDoc ? resolveAtPath(displayDoc, projectionPath) : null;
  const entries = getEntries(currentNode);

  // ── 탐색 — goSibling 패턴 ─────────────────────────────────────────────────

  const handlePushChild = useCallback((key: string) => {
    const nextProj = [...projectionPath, key];
    const nextActivePath = activePaths[myIndex + 1];
    const isSamePath =
      nextActivePath &&
      JSON.stringify(nextActivePath.projectionPath) === JSON.stringify(nextProj) &&
      (refOid ? nextActivePath.kind === 'reference' : nextActivePath.kind === 'normal');
    if (isSamePath) {
      if (activePaths.length - myIndex === 3)
        onPopToIndex(myIndex + 1);
      return;
    }
    if (myIndex >= 0) onPopToIndex(myIndex);

    if (refOid) {
      const child: ReferenceActivePath = {
        kind: 'reference',
        columnKind: 'json',
        label: key,
        refOid,
        projectionPath: nextProj,
        chainColor: chainColor ?? '#f59e0b',
        chainIndex,
        comp: { id: nextPathId(), direction: -1 },
      };
      onPushJsonPath(child);
    } else {
      const docOid = path.kind === 'normal' ? (path.documentOid ?? '') : '';
      const child: NormalActivePath = {
        kind: 'normal',
        columnKind: 'json',
        label: key,
        documentOid: docOid,
        projectionPath: nextProj,
        comp: { id: nextPathId(), direction: -1 },
      };
      onPushJsonPath(child);
    }
  }, [activePaths, slotIndex, path, refOid, chainColor, chainIndex, projectionPath, onPopToIndex, onPushJsonPath]);

  const [deleteTarget, setDeleteTarget] = useState<{ fieldKey: string; value: JsonValue } | null>(null);

  const docOidForMutate = refOid
    ? (displayDoc?._id?.$oid ?? '')
    : (path.kind === 'normal' ? (openDocument?._id?.$oid ?? '') : '');

  const isObjectNode = currentNode !== null && typeof currentNode === 'object' &&
    !Array.isArray(currentNode) && !isBsonOid(currentNode);
  const isArrayNode = Array.isArray(currentNode);
  const canAddField = !!displayDoc && (isObjectNode || isArrayNode);
  const addFieldEditingId = `field:__new__:${projectionPath.join('.')}`;

  // 현재 편집 중인 필드가 REF oid라면, InlineSegmentEditor에 어떤 문서를 참조 중인지 전달
  const [editingRefInfo, setEditingRefInfo] = useState<ReferenceInfo | null>(null);
  useEffect(() => {
    if (!editingId) { setEditingRefInfo(null); return; }
    const entry = entries.find(({ key }) => `field:${[...projectionPath, key].join('.')}` === editingId);
    if (!entry || !isBsonOid(entry.value)) { setEditingRefInfo(null); return; }
    const oid = entry.value.$oid;
    let cancelled = false;
    getReferenceInfo(oid).then((info) => { if (!cancelled) setEditingRefInfo(info); });
    return () => { cancelled = true; };
  }, [editingId]);

  // ── 필드 렌더러 ────────────────────────────────────────────────────────────

  const renderField = (fieldKey: string, value: JsonValue) => {
    const type = getFieldType(value);
    const isId = fieldKey === '_id';
    const editorId = `field:${[...projectionPath, fieldKey].join('.')}`;
    const isEditing = editingId === editorId;
    const isHighlighted = changedPaths.some((p) => p.includes(fieldKey));
    const isExpandable = type === 'object' || type === 'array';
    // _id가 아닌 단일 {$oid} 필드는, 이 앱이 직접 만든 '고유 oid' 레지스트리에 없으면 DBRef(참조)로 간주
    const isOidRef = type === 'oid' && !isId && !uniqueOids.has((value as { $oid: string }).$oid);
    // _id만 수정 불가, REF로 분류된 oid도 키 이름/참조 대상을 수정할 수 있어야 함
    const isEditable = !isId;
    const isContainer = type === 'object' || type === 'array';

    if (isEditing) {
      return (
        <InlineSegmentEditor
          key={fieldKey}
          mode="edit"
          level="field"
          initialKey={fieldKey}
          initialType={
            type === 'array' ? 'Array'
            : type === 'object' ? 'Object'
            : type === 'number' ? 'Number'
            : type === 'boolean' ? 'Boolean'
            : type === 'oid' ? 'ObjectID'
            : 'String'
          }
          initialValue={value}
          siblingKeys={entries.map((e) => e.key).filter((k) => k !== fieldKey)}
          activeDatabaseName={activeDatabaseName}
          currentRefInfo={editingRefInfo}
          onSubmit={async (data) => {
            if (!activeCollectionName || !activeDatabaseName) return;
            await onMutate({
              type: 'mutateField',
              database: activeDatabaseName,
              collection: activeCollectionName,
              documentId: docOidForMutate,
              field: {
                path: projectionPath,
                key: fieldKey,
                action: 'edit',
                // 명시적으로 제출된 값(raw 붙여넣기 포함) 우선, container는 미입력 시 기존 값 유지
                value: (() => {
                  if (data.value !== undefined) return data.value;
                  if (isContainer) return value;
                  if (data.type === 'Object') return {} as JsonValue;
                  if (data.type === 'Array') return [] as JsonValue;
                  return null;
                })(),
                nextKey: data.key !== fieldKey ? data.key : undefined,
                containerType: 'object',
              },
            });
            // oid 값 자체가 실제로 바뀐 경우에만 고유 oid 레지스트리 갱신
            // (키 이름만 바꾸거나 그대로 제출한 경우 REF/owned 분류를 건드리지 않음)
            const nextValue = data.value;
            if (isBsonOid(value) && nextValue !== undefined && isBsonOid(nextValue) && value.$oid !== nextValue.$oid) {
              if (uniqueOids.has(value.$oid)) onUnregisterUniqueOid(value.$oid);
              if (data.objectIdMode === 'generate') onRegisterUniqueOid(nextValue.$oid);
            }
            onSetEditingId(null);
          }}
          onCancel={() => onSetEditingId(null)}
          onDelete={() => setDeleteTarget({ fieldKey, value })}
        />
      );
    }

    const valueContent = (() => {
      switch (type) {
        case 'string':
          return <span className="text-sm font-mono text-emerald-600 truncate">&ldquo;{String(value)}&rdquo;</span>;
        case 'number':
          return (
            <>
              <Hash size={12} className="text-sky-400 shrink-0" />
              <span className="text-sm font-mono text-sky-600 truncate">{String(value)}</span>
            </>
          );
        case 'boolean':
          return (
            <>
              <ToggleLeft size={12} className="text-violet-400 shrink-0" />
              <span className="text-sm font-mono text-violet-600 truncate">{String(value)}</span>
            </>
          );
        case 'null':
          return <span className="text-sm font-mono text-slate-400 italic">null</span>;
        case 'object':
          return (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-slate-100 text-slate-400 font-medium">
              &#123; object &#125;
            </span>
          );
        case 'array':
          return (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-slate-100 text-slate-400 font-medium">
              [ {(value as JsonValue[]).length} ]
            </span>
          );
        case 'oid': {
          const oid = (value as { $oid: string }).$oid;
          if (isOidRef) {
            return (
              <>
                <span className="flex items-center justify-center gap-1 text-[11px] font-mono pl-1.5 pr-2 py-0.5 rounded-lg bg-blue-50 text-blue-600 font-semibold shrink-0">
                <Link size={11} className="text-blue-400 shrink-0" />
                  REF
                </span>
                <span className="text-[12px] font-mono text-blue-500 truncate" title={oid}>
                  {oid}
                </span>
                <CopyBtn text={oid} />
              </>
            );
          }
          return (
            <>
              <span className="flex items-center justify-center gap-1 text-[11px] font-mono pl-1.5 pr-2 py-0.5 rounded-lg bg-amber-50 text-amber-600 font-semibold shrink-0">
              <KeyRound size={11} className="text-amber-500 shrink-0" />
                OID
              </span>
              <span className="text-[12px] font-mono text-amber-700 truncate" title={oid}>
                {oid}
              </span>
              <CopyBtn text={oid} />
            </>
          );
        }
      }
    })();

    // expandable/ref → 탐색 (ref는 중복 방지), 비확장 + hasPathsAfter → pop
    const handleClick: (() => void) | null = (() => {
      if (isExpandable || isOidRef) {
        return () => {
          const refOidToPush = isOidRef ? (value as { $oid: string }).$oid : null;

          if (refOidToPush) {
            const next = activePaths[myIndex + 1];
            if (next?.kind === 'reference' && (next as ReferenceActivePath).refOid === refOidToPush) return;
            // 실제로 참조가 존재함이 확인된 후에만 하위 컬럼을 닫음 (오인된 REF 클릭 시 아무 변화 없도록)
            void onPushReference(refOidToPush, fieldKey, myIndex >= 0 ? myIndex : undefined);
            return;
          }
          handlePushChild(fieldKey);
        };
      }
      // 비확장 필드 클릭 시 하위 컬럼이 열려있으면 닫기
      if (hasPathsAfter) return () => onPopToIndex(myIndex + 1);
      return null;
    })();

    return (
      <FieldItem
        key={fieldKey}
        fieldKey={fieldKey}
        isId={isId}
        isExpandable={isExpandable || isOidRef}
        isEditable={isEditable}
        isHighlighted={isHighlighted}
        onEdit={() => onSetEditingId(editorId)}
        onClick={handleClick}
      >
        {valueContent}
      </FieldItem>
    );
  };

  // ── 렌더 ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-0 flex-1">
      {/* Ref 강조 — 상단 컬러 바 */}
      {chainColor && (
        <div
          className="h-[3px] w-full shrink-0"
          style={{ background: `linear-gradient(90deg, ${chainColor} 0%, ${chainColor}40 100%)` }}
        />
      )}

      {/* 헤더 */}
      <div className="shrink-0 flex items-center gap-2.5 px-4 h-12 border-b border-slate-100/80">
        <HeaderIcon node={currentNode} />
        <span className="text-sm font-semibold text-slate-700 truncate flex-1">{path.label}</span>
        {chainColor && (
          <button
            type="button"
            className="text-[10px] font-bold px-2 py-0.5 rounded-md text-white shrink-0 tracking-wide truncate max-w-[160px] cursor-pointer hover:opacity-80 transition-opacity"
            style={{ backgroundColor: chainColor }}
            title={refInfo ? `${refInfo.collectionLabel}/${refInfo.documentTitle} 로 이동` : undefined}
            onClick={() => refOid && void onNavigateToReference(refOid)}
          >
            {refInfo ? `${refInfo.collectionLabel}/${refInfo.documentTitle}` : 'REF'}
          </button>
        )}
        <span className="text-xs font-mono text-slate-400 tabular-nums">{entries.length}</span>
      </div>

      {/* 목록 */}
      <div className="flex-1 overflow-y-auto min-h-0 px-2 py-2 flex flex-col gap-0.5">
        {isLoading && !entries.length ? (
          <p className="flex-1 flex items-center justify-center text-sm text-slate-400 py-10">불러오는 중…</p>
        ) : !displayDoc ? (
          <p className="flex-1 flex items-center justify-center text-sm text-slate-400 py-10">문서를 선택하세요</p>
        ) : (
          <AnimatePresence>
            {entries.map(({ key, value }) => renderField(key, value))}
          </AnimatePresence>
        )}

        {/* 필드 추가 — object/array 노드면 depth 무관하게 항상 표시 */}
        {canAddField && (
          editingId === addFieldEditingId ? (
            <InlineSegmentEditor
              mode="add"
              level="field"
              siblingKeys={entries.map((e) => e.key)}
              initialKey={isArrayNode ? String(entries.length) : undefined}
              activeDatabaseName={activeDatabaseName}
              onSubmit={async (data) => {
                if (!activeCollectionName || !activeDatabaseName) return;
                // array는 key를 현재 length로 고정 (next index)
                const addKey = isArrayNode ? String(entries.length) : data.key;
                await onMutate({
                  type: 'mutateField',
                  database: activeDatabaseName,
                  collection: activeCollectionName,
                  documentId: docOidForMutate,
                  field: {
                    path: projectionPath,
                    key: addKey,
                    action: 'add',
                    value: data.value ?? null,
                    containerType: isArrayNode ? 'array' : 'object',
                  },
                });
                // 새로 생성된 고유 oid는 레지스트리에 등록 (DBRef로 오인되지 않도록)
                if (data.objectIdMode === 'generate' && data.value !== undefined && isBsonOid(data.value)) {
                  onRegisterUniqueOid(data.value.$oid);
                }
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
              className="group flex items-center gap-3 px-4 py-3.5 rounded-2xl cursor-pointer hover:bg-slate-50/80 active:bg-slate-100/50 transition-colors"
              onClick={() => onSetEditingId(addFieldEditingId)}
            >
              <span className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center border border-dashed border-slate-300 text-slate-400 group-hover:border-emerald-300 group-hover:text-emerald-500 transition-colors">
                <Plus size={16} />
              </span>
              <span className="text-sm font-medium text-slate-400 group-hover:text-emerald-600 transition-colors">
                {isArrayNode ? '항목 추가' : '필드 추가'}
              </span>
            </motion.button>
          )
        )}
      </div>

      {/* 삭제 확인 모달 — createPortal로 최상위에 렌더 */}
      {deleteTarget && createPortal(
        <DeleteConfirmModal
          isOpen
          targetType="field"
          targetLabel={deleteTarget.fieldKey}
          onConfirm={async () => {
            if (!activeCollectionName || !activeDatabaseName) return;
            await onMutate({
              type: 'mutateField',
              database: activeDatabaseName,
              collection: activeCollectionName,
              documentId: docOidForMutate,
              field: { path: projectionPath, key: deleteTarget.fieldKey, action: 'delete', containerType: 'object' },
            });
            // 삭제되는 필드가 이 앱이 만든 고유 oid였다면 레지스트리에서 함께 제거
            if (isBsonOid(deleteTarget.value) && uniqueOids.has(deleteTarget.value.$oid)) {
              onUnregisterUniqueOid(deleteTarget.value.$oid);
            }
            setDeleteTarget(null);
          }}
          onCancel={() => setDeleteTarget(null)}
        />,
        document.body,
      )}
    </div>
  );
}

// ── 헤더 아이콘 ───────────────────────────────────────────────────────────────

function HeaderIcon({ node }: { node: JsonValue }) {
  if (node === null || typeof node !== 'object') return null;
  if (Array.isArray(node)) return <List size={14} className="text-slate-400 shrink-0" />;
  return <Braces size={14} className="text-slate-400 shrink-0" />;
}
