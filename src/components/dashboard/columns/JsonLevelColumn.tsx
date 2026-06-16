import { useEffect, useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronRight, Copy, Check, Braces, List, Link, Plus, Pencil, Hash, ToggleLeft,
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
import { getFullDocumentById, checkReference } from '../../../services/mockAPI';
import { InlineSegmentEditor } from '../../editors/InlineSegmentEditor';
import { DeleteConfirmModal } from '../../common/DeleteConfirmModal';
import { cn } from '../../../utils/cn';

// ── 타입 헬퍼 ─────────────────────────────────────────────────────────────────

const isBsonOid = (v: JsonValue): v is { $oid: string } =>
  typeof v === 'object' && v !== null && !Array.isArray(v) &&
  Object.keys(v as object).length === 1 &&
  typeof (v as Record<string, unknown>)['$oid'] === 'string';

const isDBRef = (v: JsonValue): v is { $ref: string; $id: { $oid: string }; $db: string } =>
  typeof v === 'object' && v !== null && !Array.isArray(v) &&
  typeof (v as Record<string, unknown>)['$ref'] === 'string' &&
  isBsonOid((v as Record<string, unknown>)['$id'] as JsonValue);

type JsonFieldType = 'string' | 'number' | 'boolean' | 'null' | 'array' | 'object' | 'oid' | 'dbref';

const getFieldType = (v: JsonValue): JsonFieldType => {
  if (v === null) return 'null';
  if (isDBRef(v)) return 'dbref';
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
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied
          ? <motion.span key="c" initial={{ scale: 0.5 }} animate={{ scale: 1 }} exit={{ scale: 0.5 }} className="block">
              <Check size={13} className="text-emerald-500" />
            </motion.span>
          : <motion.span key="d" initial={{ scale: 0.5 }} animate={{ scale: 1 }} exit={{ scale: 0.5 }} className="block">
              <Copy size={13} />
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
    <div
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
        'text-[13px] py-1.5 font-mono font-medium shrink-0 w-[36%] truncate',
        isId ? 'text-slate-400' : 'text-slate-500',
      )}>
        {fieldKey}
      </span>

      <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
        {children}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {isEditable && (
          <AnimatePresence>
            {hovered && (
              <motion.div
                className="flex items-center gap-1 overflow-hidden"
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
                  <Pencil size={18} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        )}
        {isExpandable && (
          <motion.span
            animate={{ x: hovered && isEditable ? 2 : 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <ChevronRight size={15} className="text-slate-300" />
          </motion.span>
        )}
      </div>
    </div>
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
  onPushReference: (oid: string, fieldKey: string) => Promise<void>;
  onPopToIndex: (index: number) => void;
  onMutate: (op: MockMutationRequest) => Promise<unknown>;
  onSetEditingId: (id: string | null) => void;
}

// ── 컴포넌트 ──────────────────────────────────────────────────────────────────

export function JsonLevelColumn({
  path,
  openDocument,
  isLoading,
  changedPaths,
  editingId,
  activePaths,
  activeCollectionName,
  activeDatabaseName,
  onPushJsonPath,
  onPushReference,
  onPopToIndex,
  onMutate,
  onSetEditingId,
}: JsonLevelColumnProps) {
  const refOid     = path.kind === 'reference' ? path.refOid     : null;
  const chainColor = path.kind === 'reference' ? path.chainColor : undefined;
  const chainIndex = path.kind === 'reference' ? path.chainIndex : 0;
  const projectionPath: string[] = path.kind === 'normal'
    ? (path.projectionPath ?? [])
    : path.projectionPath;

  // 현재 컬럼의 activePaths 인덱스 — goSibling 패턴에서 position 판단에 사용
  const myIndex = useMemo(
    () => activePaths.findIndex((p) => p.comp.id === path.comp.id),
    [activePaths, path],
  );
  const hasPathsAfter = myIndex >= 0 && myIndex < activePaths.length - 1;

  const [refFullDoc, setRefFullDoc] = useState<Document | null>(null);
  useEffect(() => {
    if (!refOid) { setRefFullDoc(null); return; }
    setRefFullDoc(null);
    getFullDocumentById(refOid).then(setRefFullDoc).catch(() => setRefFullDoc(null));
  }, [refOid]);

  const displayDoc = refOid ? refFullDoc : openDocument;

  const currentNode: JsonValue = displayDoc ? resolveAtPath(displayDoc, projectionPath) : null;
  const entries = getEntries(currentNode);

  // OID → 실제 참조 여부 비동기 캐시
  const [refCache, setRefCache] = useState<Map<string, boolean>>(new Map());
  const oidCacheKey = entries
    .filter(({ key, value }) => key !== '_id' && isBsonOid(value))
    .map(({ value }) => (value as { $oid: string }).$oid)
    .join(',');

  useEffect(() => {
    if (!oidCacheKey) return;
    const todo = oidCacheKey.split(',').filter((id) => !refCache.has(id));
    if (!todo.length) return;
    void Promise.all(todo.map(async (id) => [id, await checkReference(id)] as [string, boolean]))
      .then((res) => setRefCache((prev) => {
        const next = new Map(prev);
        res.forEach(([id, ok]) => next.set(id, ok));
        return next;
      }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oidCacheKey]);

  // ── 탐색 — goSibling 패턴 ─────────────────────────────────────────────────

  const handlePushChild = useCallback((key: string) => {
    const nextProj = [...projectionPath, key];
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
        comp: { id: `${refOid}-${nextProj.join('.')}`, direction: 1 },
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
        comp: { id: `${docOid}-${nextProj.join('.')}`, direction: 1 },
      };
      onPushJsonPath(child);
    }
  }, [myIndex, path, refOid, chainColor, chainIndex, projectionPath, onPopToIndex, onPushJsonPath]);

  const [deleteTarget, setDeleteTarget] = useState<{ fieldKey: string } | null>(null);

  const docOidForMutate = refOid
    ? (displayDoc?._id?.$oid ?? '')
    : (path.kind === 'normal' ? (openDocument?._id?.$oid ?? '') : '');

  const isObjectNode = currentNode !== null && typeof currentNode === 'object' &&
    !Array.isArray(currentNode) && !isBsonOid(currentNode) && !isDBRef(currentNode);
  const isArrayNode = Array.isArray(currentNode);
  const canAddField = !!displayDoc && (isObjectNode || isArrayNode);
  const addFieldEditingId = `field:__new__:${projectionPath.join('.')}`;

  // ── 필드 렌더러 ────────────────────────────────────────────────────────────

  const renderField = (fieldKey: string, value: JsonValue) => {
    const type = getFieldType(value);
    const isId = fieldKey === '_id';
    const editorId = `field:${[...projectionPath, fieldKey].join('.')}`;
    const isEditing = editingId === editorId;
    const isHighlighted = changedPaths.some((p) => p.includes(fieldKey));
    const isExpandable = type === 'object' || type === 'array' || type === 'dbref';
    const isOidRef = type === 'oid' && !isId && refCache.get((value as { $oid: string }).$oid) === true;
    const isEditable = !isId && !isOidRef;
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
            : 'String'
          }
          initialValue={!isContainer ? value : undefined}
          siblingKeys={entries.map((e) => e.key).filter((k) => k !== fieldKey)}
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
                // object/array 유지 또는 타입 변경 시 유효하지 않은 값에 {}·[] 기본값 적용
                value: (() => {
                  const v = isContainer ? value : data.value;
                  if (v === null || v === undefined) {
                    if (data.type === 'Object') return {} as JsonValue;
                    if (data.type === 'Array') return [] as JsonValue;
                  }
                  return v ?? null;
                })(),
                nextKey: data.key !== fieldKey ? data.key : undefined,
                containerType: 'object',
              },
            });
            onSetEditingId(null);
          }}
          onCancel={() => onSetEditingId(null)}
          onDelete={() => setDeleteTarget({ fieldKey })}
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
          return (
            <>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-amber-50 text-amber-600 font-semibold shrink-0">
                OID
              </span>
              <span className="text-[12px] font-mono text-amber-700 truncate" title={oid}>
                …{oid.slice(-8)}
              </span>
              <CopyBtn text={oid} />
            </>
          );
        }
        case 'dbref': {
          const dbref = value as { $ref: string; $id: { $oid: string }; $db: string };
          return (
            <>
              <Link size={12} className="text-blue-400 shrink-0" />
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-blue-50 text-blue-600 font-semibold shrink-0">
                REF
              </span>
              <span className="text-[12px] font-mono text-blue-500 truncate">
                {dbref.$ref}
              </span>
            </>
          );
        }
      }
    })();

    // expandable/ref → 탐색 (ref는 중복 방지), 비확장 + hasPathsAfter → pop
    const handleClick: (() => void) | null = (() => {
      if (isExpandable || isOidRef) {
        return () => {
          if (type === 'dbref') {
            const dbref = value as { $ref: string; $id: { $oid: string }; $db: string };
            const oid = dbref.$id.$oid;
            if (myIndex >= 0) onPopToIndex(myIndex);
            void onPushReference(oid, fieldKey);
          } else if (isOidRef) {
            const oid = (value as { $oid: string }).$oid;
            if (myIndex >= 0) onPopToIndex(myIndex);
            void onPushReference(oid, fieldKey);
          } else {
            handlePushChild(fieldKey);
          }
        };
      }
      // 비확장 필드 클릭 시 하위 컬럼이 열려있으면 닫기
      if (hasPathsAfter) return () => onPopToIndex(myIndex);
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
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-md text-white shrink-0 tracking-wide"
            style={{ backgroundColor: chainColor }}
          >
            REF
          </span>
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
          <AnimatePresence initial={false}>
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
                onSetEditingId(null);
              }}
              onCancel={() => onSetEditingId(null)}
            />
          ) : (
            <button
              type="button"
              className="flex items-center gap-2.5 px-4 py-3 rounded-2xl border border-dashed border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 transition-colors mt-1 cursor-pointer disabled:opacity-40"
              onClick={() => onSetEditingId(addFieldEditingId)}
              disabled={!!editingId}
            >
              <Plus size={14} className="text-slate-400" />
              <span className="text-sm text-slate-400">
                {isArrayNode ? '항목 추가' : '필드 추가'}
              </span>
            </button>
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
