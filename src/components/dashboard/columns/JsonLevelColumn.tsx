import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { nextPathId } from '../../../hooks/useExplorerState';
import { Link, Hash, ToggleLeft, KeyRound } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import {
  isBsonObjectId as isBsonOid,
  type ActivePath,
  type Document,
  type JsonValue,
  type MockMutationRequest,
  type NormalActivePath,
  type ReferenceActivePath,
} from '../../../types/explorer';
import { getFullDocumentById, getReferenceInfo, type ReferenceInfo } from '../../../services/mockAPI';
import { InlineSegmentEditor } from '../../editors/InlineSegmentEditor';
import { DeleteConfirmModal } from '../../common/DeleteConfirmModal';
import { AddItemButton } from './AddItemButton';
import { CopyBtn } from './CopyBtn';
import { FieldItem } from './FieldItem';
import { HeaderIcon } from './HeaderIcon';
import { DropOverlay } from './DropOverlay';
import { getFieldType, resolveAtPath, getEntries } from '../../../utils/jsonTree';
import { isPathChanged } from '../../../utils/changedPaths';
import { useFileDrop } from '../../../hooks/useFileDrop';

// 필드/배열 요소가 이 개수를 넘으면 한 번에 다 그리지 않고 일부만 렌더링한다
const ENTRY_RENDER_CAP = 100;

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
  reduceMotion?: boolean;
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
  reduceMotion,
}: JsonLevelColumnProps) {
  // 위험 영역(의도적으로 더 쪼개지 않음): 아래부터 renderField까지는 refOid/myIndex
  // 파생값, 두 개의 참조-문서 fetch effect, handlePushChild, deleteTarget/
  // docOidForMutate 등이 같은 클로저 안에서 서로를 참조한다. 훅으로 뽑아내려면
  // 이 변수들의 의존성 배열을 전부 정확히 복제해야 하는데, 이 프로젝트엔
  // 테스트가 없어 의존성 배열 하나라도 빠뜨리면(stale closure) 타입체커도
  // 잡아내지 못하고 런타임에서만 드러난다. 그래서 이번 리팩토링에서는
  // 순수 유틸(jsonTree.ts)과 이미 독립적인 서브컴포넌트(CopyBtn/FieldItem/
  // HeaderIcon)만 분리하고, 이 블록은 파일 경계를 넘기지 않았다.
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

  // REF 컬럼은 refFullDoc을 refOid가 바뀔 때만 다시 가져온다. 그런데 REF
  // 컬럼 자체에서 필드를 수정해도 refOid는 그대로이므로 위 effect가 다시
  // 실행되지 않아 화면이 갱신되지 않는다 — mutate가 성공한 직후 이 컬럼이
  // 직접 refFullDoc을 다시 가져와서 즉시 반영한다.
  const refreshRefDocument = useCallback(() => {
    if (!refOid) return;
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

  // 노드를 옮길 때마다 "더 보기" 상태 초기화
  const [showAllEntries, setShowAllEntries] = useState(false);
  useEffect(() => { setShowAllEntries(false); }, [displayDoc, projectionPath.join('.')]);

  const hasMoreEntries = entries.length > ENTRY_RENDER_CAP && !showAllEntries;
  const visibleEntries = hasMoreEntries ? entries.slice(0, ENTRY_RENDER_CAP) : entries;

  // ── 탐색 — goSibling 패턴 ─────────────────────────────────────────────────

  // 위험: myIndex는 의존성 배열에 직접 없고 slotIndex+activePaths.length로 매
  // 렌더마다 다시 계산된다 — 의존성 배열의 slotIndex/activePaths가 myIndex의
  // 실질적인 소스이므로 지금은 정확하지만, myIndex 계산식을 건드리면서
  // 의존성 배열을 같이 안 고치면 stale closure가 생긴다(타입체커는 못 잡음).
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

  // REF 컬럼(refOid가 있는 경우)은 "현재 선택된 컬렉션/DB"가 아니라 참조 대상
  // 문서가 실제로 속한 컬렉션/DB로 mutate해야 한다. activeDatabaseName/
  // activeCollectionName 그대로 쓰면 참조 대상이 다른 컬렉션(혹은 다른 DB)에
  // 있을 때 거기서 docOidForMutate를 찾지 못해 "Document not found"가 뜬다.
  // refInfo는 getReferenceInfo(refOid)로 이미 가져온 참조 대상의 실제 위치.
  const mutateDatabaseName = refOid ? (refInfo?.databaseName ?? null) : activeDatabaseName;
  const mutateCollectionName = refOid ? (refInfo?.collectionName ?? null) : activeCollectionName;

  const isObjectNode = currentNode !== null && typeof currentNode === 'object' &&
    !Array.isArray(currentNode) && !isBsonOid(currentNode);
  const isArrayNode = Array.isArray(currentNode);
  const canAddField = !!displayDoc && (isObjectNode || isArrayNode);
  // path.comp.id를 포함해야 한다 — 그렇지 않으면 동일한 projectionPath를 가진
  // 다른 컬럼(예: 부모 문서와 그 안의 REF 문서가 둘 다 루트에서 "필드 추가"를
  // 누를 때)이 editingId 문자열이 우연히 같아져서 두 컬럼의 InlineSegmentEditor가
  // 동시에 열린다. editingId는 전역(useExplorerState)에서 하나만 관리되므로
  // 컬럼별로 구분 가능한 값이어야 한다.
  const addFieldEditingId = `field:${path.comp.id}:__new__:${projectionPath.join('.')}`;

  // 컬럼 전체에 파일을 드롭하면 "필드 추가" 에디터를 열고 그 파일을 업로드한 것처럼 처리
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const { isDragOver: isColumnDragOver, dragHandlers } = useFileDrop((file) => {
    if (!canAddField) return;
    onSetEditingId(addFieldEditingId);
    setPendingImportFile(file);
  });

  // 현재 편집 중인 필드가 REF oid라면, InlineSegmentEditor에 어떤 문서를 참조 중인지 전달
  const [editingRefInfo, setEditingRefInfo] = useState<ReferenceInfo | null>(null);
  useEffect(() => {
    if (!editingId) { setEditingRefInfo(null); return; }
    const entry = entries.find(({ key }) => `field:${path.comp.id}:${[...projectionPath, key].join('.')}` === editingId);
    if (!entry || !isBsonOid(entry.value)) { setEditingRefInfo(null); return; }
    const oid = entry.value.$oid;
    let cancelled = false;
    getReferenceInfo(oid).then((info) => { if (!cancelled) setEditingRefInfo(info); });
    return () => { cancelled = true; };
  }, [editingId]);

  // ── 필드 렌더러 ────────────────────────────────────────────────────────────

  // 위험: 이 함수 하나가 ① 타입 분류 ② 편집 모드 분기(InlineSegmentEditor
  // onSubmit 안에서 mutation payload까지 구성) ③ 값 표시 switch ④ 클릭 시
  // 탐색/pop 결정 트리를 한 클로저에서 다 처리한다. 위쪽의 entries/
  // projectionPath/editingId/uniqueOids/onMutate/handlePushChild 등 거의
  // 모든 컴포넌트 상태를 읽으므로, 부분만 떼어내도 결국 이 상태를 거의
  // 다 다시 전달해야 해서 분리 이득이 거의 없고 실수할 표면만 늘어난다.
  // 그래서 그대로 두었다 — 수정할 땐 위 4개 책임 중 어디를 건드리는지
  // 먼저 명확히 하고 시작할 것.
  const renderField = (fieldKey: string, value: JsonValue) => {
    const type = getFieldType(value);
    const isId = fieldKey === '_id';
    const editorId = `field:${path.comp.id}:${[...projectionPath, fieldKey].join('.')}`;
    const isEditing = editingId === editorId;
    // 이 필드가 실제로 속한 DB/컬렉션/문서까지 포함한 전체 경로로 정확히 비교한다 —
    // fieldKey만으로 비교하면 다른 문서/컬렉션의 동명 필드(예: 모든 문서의 "name")가
    // 전부 하이라이트되는 버그가 생긴다.
    const fullFieldPath = mutateDatabaseName && mutateCollectionName && docOidForMutate
      ? `databases.${mutateDatabaseName}.collections.${mutateCollectionName}.documents.${docOidForMutate}.${[...projectionPath, fieldKey].join('.')}`
      : null;
    const isHighlighted = fullFieldPath ? isPathChanged(changedPaths, fullFieldPath) : false;
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
          activeDatabaseName={mutateDatabaseName}
          currentRefInfo={editingRefInfo}
          onSubmit={async (data) => {
            if (!mutateCollectionName || !mutateDatabaseName) return;
            await onMutate({
              type: 'mutateField',
              database: mutateDatabaseName,
              collection: mutateCollectionName,
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
                // 부모 컨테이너가 array면 'array'를 보내야 한다 — 항상 'object'로
                // 보내면 array 항목을 수정할 때 mockMutate가 "Invalid mutate
                // path"를 던진다(add 액션은 이미 isArrayNode로 분기하고 있었음).
                containerType: isArrayNode ? 'array' : 'object',
              },
            });
            // oid 값 자체가 실제로 바뀐 경우에만 고유 oid 레지스트리 갱신
            // (키 이름만 바꾸거나 그대로 제출한 경우 REF/owned 분류를 건드리지 않음)
            const nextValue = data.value;
            if (isBsonOid(value) && nextValue !== undefined && isBsonOid(nextValue) && value.$oid !== nextValue.$oid) {
              if (uniqueOids.has(value.$oid)) onUnregisterUniqueOid(value.$oid);
              if (data.objectIdMode === 'generate') onRegisterUniqueOid(nextValue.$oid);
            }
            refreshRefDocument();
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
        reduceMotion={reduceMotion}
        onEdit={() => onSetEditingId(editorId)}
        onClick={handleClick}
      >
        {valueContent}
      </FieldItem>
    );
  };

  // ── 렌더 ──────────────────────────────────────────────────────────────────

  return (
    <div className="relative flex flex-col min-h-0 flex-1" {...dragHandlers}>
      <DropOverlay visible={isColumnDragOver} label={canAddField ? 'Drop a file to import as a field' : 'Fields cannot be added here'} />

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
            title={refInfo ? `Go to ${refInfo.collectionLabel}/${refInfo.documentTitle}` : undefined}
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
          <p className="flex-1 flex items-center justify-center text-sm text-slate-400 py-10">Loading…</p>
        ) : !displayDoc ? (
          <p className="flex-1 flex items-center justify-center text-sm text-slate-400 py-10">Select a document</p>
        ) : (
          <AnimatePresence>
            {visibleEntries.map(({ key, value }) => renderField(key, value))}
          </AnimatePresence>
        )}

        {hasMoreEntries && (
          <button
            type="button"
            className="mx-1 my-1 px-3 py-2.5 rounded-2xl text-sm font-medium text-slate-500 bg-slate-50 hover:bg-slate-100 transition-colors"
            onClick={() => setShowAllEntries(true)}
          >
            Showing {ENTRY_RENDER_CAP.toLocaleString()} of {entries.length.toLocaleString()} · Show more
          </button>
        )}

        {/* 필드 추가 — object/array 노드면 depth 무관하게 항상 표시 */}
        {canAddField && (
          editingId === addFieldEditingId ? (
            <InlineSegmentEditor
              mode="add"
              level="field"
              siblingKeys={entries.map((e) => e.key)}
              initialKey={isArrayNode ? String(entries.length) : undefined}
              activeDatabaseName={mutateDatabaseName}
              onSubmit={async (data) => {
                if (!mutateCollectionName || !mutateDatabaseName) return;
                // array는 key를 현재 length로 고정 (next index)
                const addKey = isArrayNode ? String(entries.length) : data.key;
                await onMutate({
                  type: 'mutateField',
                  database: mutateDatabaseName,
                  collection: mutateCollectionName,
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
                refreshRefDocument();
                onSetEditingId(null);
              }}
              onCancel={() => onSetEditingId(null)}
              pendingImportFile={pendingImportFile}
              onPendingImportFileConsumed={() => setPendingImportFile(null)}
            />
          ) : (
            <AddItemButton
              label={isArrayNode ? 'Add Item' : 'Add Field'}
              onClick={() => onSetEditingId(addFieldEditingId)}
              buttonClassName="group flex items-center gap-3 px-4 py-3.5 rounded-2xl cursor-pointer hover:bg-slate-50/80 active:bg-slate-100/50 transition-colors"
              iconClassName="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center border border-dashed border-slate-300 text-slate-400 group-hover:border-emerald-300 group-hover:text-emerald-500 transition-colors"
              textClassName="text-sm font-medium text-slate-400 group-hover:text-emerald-600 transition-colors"
              reduceMotion={reduceMotion}
            />
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
            if (!mutateCollectionName || !mutateDatabaseName) return;
            await onMutate({
              type: 'mutateField',
              database: mutateDatabaseName,
              collection: mutateCollectionName,
              documentId: docOidForMutate,
              field: { path: projectionPath, key: deleteTarget.fieldKey, action: 'delete', containerType: isArrayNode ? 'array' : 'object' },
            });
            // 삭제되는 필드가 이 앱이 만든 고유 oid였다면 레지스트리에서 함께 제거
            if (isBsonOid(deleteTarget.value) && uniqueOids.has(deleteTarget.value.$oid)) {
              onUnregisterUniqueOid(deleteTarget.value.$oid);
            }
            refreshRefDocument();
            setDeleteTarget(null);
          }}
          onCancel={() => setDeleteTarget(null)}
        />,
        document.body,
      )}
    </div>
  );
}
