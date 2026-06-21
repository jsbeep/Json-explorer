import { useCallback, useMemo, useRef, useState } from 'react';
import {
  connect,
  getCollections,
  getDocumentById,
  getFullDocumentById,
  getDocuments,
  getReferenceInfo,
  listDatabases,
  mutateData,
  checkReference,
  subscribeToChanges,
} from '../services/mockAPI';
import { getSnapshot } from '../services/mockStorage';
import { useToast, type ToastMessage } from './useToast';
import { useUniqueOidRegistry } from './useUniqueOidRegistry';
import type {
  ActivePath,
  CollectionSummary,
  ConnectionStatus,
  DatabaseSummary,
  Document,
  DocumentSummary,
  ExplorerPathSegment,
  MockMutationRequest,
  MockMutationResult,
  MockSnapshot,
  NormalActivePath,
  ReferenceActivePath,
} from '../types/explorer';

export type { ToastMessage };

// ── 상수 ──────────────────────────────────────────────────────────────────────

const CHAIN_COLORS = ['#f59e0b', '#8b5cf6', '#3b82f6', '#ec4899', '#14b8a6'] as const;

let pathIdCounter = 0;
export const nextPathId = () => ++pathIdCounter;

// ── UseExplorerStateResult 타입 (Header 등 외부 컴포넌트에서 Pick 가능) ────────

export interface UseExplorerStateResult {
  // 상태
  connectionStatus: ConnectionStatus;
  activeDatabase: string | null;
  activePaths: ActivePath[];
  databases: DatabaseSummary[];
  collections: CollectionSummary[];
  documents: DocumentSummary[];
  openDocument: Document | null;
  editingId: string | null;
  isLoading: boolean;
  changedPaths: string[];
  toast: ToastMessage | null;
  uniqueOids: Set<string>;

  // 파생값
  visibleColumns: (ActivePath | null)[];
  breadcrumbs: ExplorerPathSegment[];

  // 액션
  initialize: () => Promise<void>;
  selectDatabase: (name: string) => Promise<void>;
  selectCollection: (name: string, label: string) => Promise<void>;
  selectDocument: (oid: string, title: string) => Promise<void>;
  pushJsonPath: (path: ActivePath) => void;
  popToIndex: (index: number) => void;
  pushReference: (oid: string, fieldKey: string, popIndex?: number) => Promise<void>;
  navigateToReference: (oid: string) => Promise<void>;
  mutate: (op: MockMutationRequest) => Promise<MockMutationResult>;
  registerUniqueOid: (oid: string) => void;
  unregisterUniqueOid: (oid: string) => void;
  setEditingId: (id: string | null) => void;
  clearChangedPaths: () => void;
  dismissToast: () => void;
  undo: () => Promise<void>;
  refresh: () => Promise<void>;
  subscribe: (collectionId: string) => () => void;
}

// ── 훅 ───────────────────────────────────────────────────────────────────────

export function useExplorerState(): UseExplorerStateResult {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [activeDatabase, setActiveDatabase] = useState<string | null>(null);
  const [activePaths, setActivePaths] = useState<ActivePath[]>([]);
  const [databases, setDatabases] = useState<DatabaseSummary[]>([]);
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [openDocument, setOpenDocument] = useState<Document | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [changedPaths, setChangedPaths] = useState<string[]>([]);

  const { toast, showToast, dismissToast } = useToast();
  const { uniqueOids, registerUniqueOid, unregisterUniqueOid } = useUniqueOidRegistry();

  const undoSnapshotRef = useRef<MockSnapshot | null>(null);
  const activeDatabaseRef = useRef<string | null>(null);
  const activeCollectionRef = useRef<string | null>(null);
  const activeDocumentOidRef = useRef<string | null>(null);
  const changedPathsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 위험 영역(의도적으로 더 쪼개지 않음): 아래의 activePaths state + 3개의 ref
  // (activeDatabaseRef/activeCollectionRef/activeDocumentOidRef)는 탐색 액션
  // 거의 전부가 2~4개씩 같이 읽고 쓰는 이 훅의 진짜 엔진이다. mutate/undo도
  // 이 ref들을 보고 "뭘 다시 불러올지" 결정하므로 탐색 로직과 강하게 결합돼
  // 있다. 테스트 코드가 없는 상태에서 이 부분을 훅으로 더 쪼개면, setState
  // 호출 순서나 ref 갱신 시점이 한 군데라도 어긋나면 비동기 경쟁 상태(race
  // condition) 버그가 생기기 쉽고 타입체커로는 잡히지 않는다. 그래서 toast/
  // uniqueOids처럼 완전히 독립적인 부분만 훅으로 뽑고, 이 블록은 그대로 뒀다.

  // ── 파생값 ──────────────────────────────────────────────────────────────────

  const visibleColumns = useMemo<(ActivePath | null)[]>(() => {
    const last3 = activePaths.slice(-3);
    const padding = Array(Math.max(0, 3 - last3.length)).fill(null) as null[];
    return [...last3, ...padding]; // 왼쪽 정렬: 실제 컬럼 먼저, placeholder 오른쪽
  }, [activePaths]);

  const breadcrumbs = useMemo<ExplorerPathSegment[]>(() => {
    const segs: ExplorerPathSegment[] = [];
    for (const ap of activePaths) {
      if (ap.columnKind === 'collections') {
        if (ap.databaseName) {
          segs.push({ key: ap.databaseName, label: ap.databaseName, kind: 'database' });
        }
      } else if (ap.columnKind === 'documents' && ap.kind === 'normal') {
        if (ap.collectionName) {
          segs.push({ key: ap.collectionName, label: ap.label, kind: 'collection' });
        }
      } else if (ap.columnKind === 'json') {
        if (ap.kind === 'reference') {
          segs.push({
            // refOid만으로 key를 만들면 같은 문서를 참조하는 두 경로가 동시에
            // activePaths에 있을 때(순환 참조 등) key가 충돌한다 — comp.id는
            // push마다 고유하므로 이를 사용한다.
            key: `ref-${ap.comp.id}`,
            label: ap.label,
            kind: 'document',
            chainColor: ap.chainColor,
          });
        } else if (ap.kind === 'normal') {
          const kind = ap.projectionPath && ap.projectionPath.length > 0 ? 'field' : 'document';
          segs.push({ key: String(ap.comp.id), label: ap.label, kind });
        }
      }
    }
    return segs;
  }, [activePaths]);

  // ── 액션 ────────────────────────────────────────────────────────────────────

  const initialize = useCallback(async () => {
    setConnectionStatus('connecting');
    setIsLoading(true);
    try {
      const result = await connect({ latencyMs: 80 });
      setDatabases(result.databases);
      setConnectionStatus('connected');
      activeDatabaseRef.current = result.activeDatabase;
      setActiveDatabase(result.activeDatabase);

      const cols = await getCollections(result.activeDatabase);
      setCollections(cols);
      setActivePaths([
        {
          kind: 'normal',
          columnKind: 'collections',
          label: result.activeDatabase,
          databaseName: result.activeDatabase,
          comp: { id: nextPathId(), direction: 1 },
        },
      ]);
      setEditingId(null);
    } catch {
      setConnectionStatus('error');
      showToast('Failed to connect to DB.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  const selectDatabase = useCallback(async (name: string) => {
    if (activeDatabaseRef.current === name) return;
    setIsLoading(true);
    try {
      const cols = await getCollections(name);
      activeDatabaseRef.current = name;
      activeCollectionRef.current = null;
      activeDocumentOidRef.current = null;
      setActiveDatabase(name);
      setCollections(cols);
      setDocuments([]);
      setOpenDocument(null);
      setActivePaths([
        {
          kind: 'normal',
          columnKind: 'collections',
          label: name,
          databaseName: name,
          comp: { id: nextPathId(), direction: -1 },
        },
      ]);
      setEditingId(null);
    } catch {
      showToast('Could not load database.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  const selectCollection = useCallback(async (name: string, label: string) => {
    if (activeCollectionRef.current === name && activePaths.length > 1) {
      if (activePaths.length === 3)
        popToIndex(1); // 이미 선택된 컬렉션 클릭 시 문서/필드 경로 팝
      return;
    }
    setIsLoading(true);
    try {
      const docs = await getDocuments(name);
      activeCollectionRef.current = name;
      activeDocumentOidRef.current = null;
      setDocuments(docs);
      setOpenDocument(null);
      setActivePaths((prev) => {
        const base: NormalActivePath = {
          kind: 'normal',
          columnKind: 'collections',
          label: activeDatabaseRef.current ?? '',
          databaseName: activeDatabaseRef.current ?? undefined,
          comp: { id: prev[0]?.comp.id ?? nextPathId(), direction: 1 },
        };
        const next: NormalActivePath = {
          kind: 'normal',
          columnKind: 'documents',
          label,
          collectionName: name,
          comp: { id: nextPathId(), direction: -1 },
        };
        return [base, next];
      });
      setEditingId(null);
    } catch {
      showToast('Could not load collection.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast, activePaths, activeCollectionRef]);

  const selectDocument = useCallback(async (oid: string, title: string) => {
    if (activeDocumentOidRef.current === oid && activePaths.length > 2) {
      if (activePaths.length === 4)
        popToIndex(2); // 이미 선택된 컬렉션 클릭 시 문서/필드 경로 팝
      return;
    }
    setIsLoading(true);
    try {
      const doc = await getFullDocumentById(oid); // 전체 문서 — 로컬 JSON 탐색용
      activeDocumentOidRef.current = oid;
      setOpenDocument(doc);
      setActivePaths((prev) => {
        const jsonPath: NormalActivePath = {
          kind: 'normal',
          columnKind: 'json',
          label: title,
          documentOid: oid,
          projectionPath: [],
          comp: { id: nextPathId(), direction: -1 },
        };
        return [...prev.slice(0, 2), jsonPath];
      });
      setEditingId(null);
    } catch {
      showToast('Could not load document.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast, activePaths]);

  const pushJsonPath = useCallback((path: ActivePath) => {
    setActivePaths((prev) => [...prev, path]);
    // 컬럼이 슬라이딩 윈도우 밖으로 밀려나면서 InlineSegmentEditor가 보이지 않게 되어도
    // editingId가 남아있으면 다른 컬럼의 추가/수정이 막히므로 탐색 시 항상 정리
    setEditingId(null);
  }, []);

  const popToIndex = useCallback((index: number) => {
    setActivePaths((prev) => prev.slice(0, index + 1));
    // json depth 이하로 pop 시 openDocument 상태 유지 (컬럼이 재사용)
    setEditingId(null);
  }, []);

  const pushReference = useCallback(async (oid: string, fieldKey: string, popIndex?: number) => {
    setIsLoading(true);
    try {
      const isRef = await checkReference(oid);
      // 참조가 실제로 존재하지 않으면 아무 것도 하지 않음 — 열려있던 하위 컬럼도 그대로 유지
      if (!isRef) return;

      const doc = await getDocumentById(oid);
      setActivePaths((prev) => {
        const base = popIndex !== undefined ? prev.slice(0, popIndex + 1) : prev;
        const chainIndex = base.filter((p) => p.kind === 'reference').length;
        const chainColor = CHAIN_COLORS[chainIndex % CHAIN_COLORS.length];
        const refPath: ReferenceActivePath = {
          kind: 'reference',
          columnKind: 'json',
          label: fieldKey,
          refOid: oid,
          projectionPath: [],
          chainColor,
          chainIndex,
          comp: { id: nextPathId(), direction: 1 },
        };
        // refDoc는 참조된 문서로 openDocument를 교체하지 않고 별도 처리
        // JsonLevelColumn에서 refOid를 직접 사용해 getDocumentById 호출
        void doc; // 참조 확인용, 실제 렌더는 컬럼에서 처리
        return [...base, refPath];
      });
      setEditingId(null);
    } catch {
      showToast('Could not load reference.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // 참조 배지(REF) 클릭 시 — 체인을 따라가지 않고 Path를 초기화한 후 참조 대상 컬렉션/문서로 바로 이동
  const navigateToReference = useCallback(async (oid: string) => {
    setIsLoading(true);
    try {
      const info = await getReferenceInfo(oid);
      if (!info) {
        showToast('Could not find the referenced document.', 'error');
        return;
      }
      const { databaseName, collectionName, collectionLabel, documentTitle } = info;
      const [cols, docs, doc] = await Promise.all([
        getCollections(databaseName),
        getDocuments(collectionName),
        getFullDocumentById(oid),
      ]);

      activeDatabaseRef.current = databaseName;
      activeCollectionRef.current = collectionName;
      activeDocumentOidRef.current = oid;

      setActiveDatabase(databaseName);
      setCollections(cols);
      setDocuments(docs);
      setOpenDocument(doc);
      setActivePaths([
        {
          kind: 'normal',
          columnKind: 'collections',
          label: databaseName,
          databaseName,
          comp: { id: nextPathId(), direction: 1 },
        },
        {
          kind: 'normal',
          columnKind: 'documents',
          label: collectionLabel,
          collectionName,
          comp: { id: nextPathId(), direction: 1 },
        },
        {
          kind: 'normal',
          columnKind: 'json',
          label: documentTitle,
          documentOid: oid,
          projectionPath: [],
          comp: { id: nextPathId(), direction: 1 },
        },
      ]);
      setEditingId(null);
    } catch {
      showToast('Failed to navigate.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  const mutate = useCallback(async (op: MockMutationRequest): Promise<MockMutationResult> => {
    undoSnapshotRef.current = getSnapshot();
    setIsLoading(true);
    try {
      const result = await mutateData(op);
      setChangedPaths(result.changedPaths);
      // 하이라이트를 2초 후 자동으로 해제 — 그 전에 다른 mutate가 일어나면
      // 타이머를 새로 잡아 다시 2초간 보여준다.
      if (changedPathsTimerRef.current) clearTimeout(changedPathsTimerRef.current);
      changedPathsTimerRef.current = setTimeout(() => setChangedPaths([]), 2000);

      // 관련 캐시 갱신
      if (op.type === 'deleteCollection' && activeCollectionRef.current === op.collection) {
        // 현재 보고 있던 컬렉션 자체가 삭제됨 — 문서/탐색 상태 초기화 (getDocuments 호출 시 실패하므로 분기)
        activeCollectionRef.current = null;
        activeDocumentOidRef.current = null;
        setDocuments([]);
        setOpenDocument(null);
        setActivePaths((prev) => prev.slice(0, 1));
        setEditingId(null);
      } else if ('collection' in op && typeof op.collection === 'string' && activeCollectionRef.current === op.collection) {
        const docs = await getDocuments(op.collection);
        setDocuments(docs);
        // 문서 추가/삭제/수정으로 컬렉션 용량(sizeMb)·문서 수가 바뀌므로 컬렉션 메타도 같이 갱신
        if ('database' in op && typeof op.database === 'string') {
          const cols = await getCollections(op.database);
          setCollections(cols);
        }
        // 열린 문서 갱신
        if (activeDocumentOidRef.current && op.type === 'mutateField') {
          const doc = await getFullDocumentById(activeDocumentOidRef.current);
          setOpenDocument(doc);
        }
      }
      // 컬렉션 메타데이터(이름/타이틀 키 등) 변경 시 collections 캐시도 갱신
      if (
        (op.type === 'createCollection' || op.type === 'renameCollection' || op.type === 'setCollectionTitleKey' || op.type === 'deleteCollection' || op.type === 'duplicateCollection') &&
        op.database === activeDatabaseRef.current
      ) {
        const cols = await getCollections(op.database);
        setCollections(cols);
      }
      if (op.type === 'replaceSnapshot') {
        // 전체 갱신
        if (activeDatabaseRef.current) {
          const cols = await getCollections(activeDatabaseRef.current);
          setCollections(cols);
          if (activeCollectionRef.current) {
            const docs = await getDocuments(activeCollectionRef.current);
            setDocuments(docs);
          }
        }
      }

      // 헤더 DB 드롭다운 목록 갱신
      if (
        op.type === 'createDatabase' ||
        op.type === 'renameDatabase' ||
        op.type === 'duplicateDatabase' ||
        op.type === 'deleteDatabase'
      ) {
        setDatabases(await listDatabases());
      }

      if (op.type === 'createDatabase' || op.type === 'duplicateDatabase') {
        // 새로 생성/복제된 DB로 포커스 이동 (mockAPI가 activeDatabase를 이미 그쪽으로 옮겨둠)
        const nextDb = result.snapshot.activeDatabase;
        activeDatabaseRef.current = nextDb;
        activeCollectionRef.current = null;
        activeDocumentOidRef.current = null;
        setActiveDatabase(nextDb);
        setDocuments([]);
        setOpenDocument(null);
        const cols = await getCollections(nextDb);
        setCollections(cols);
        setActivePaths([
          {
            kind: 'normal',
            columnKind: 'collections',
            label: nextDb,
            databaseName: nextDb,
            comp: { id: nextPathId(), direction: -1 },
          },
        ]);
        setEditingId(null);
      } else if (op.type === 'renameDatabase' && activeDatabaseRef.current === op.oldName) {
        // 보고 있던 DB 자체의 이름(키)이 바뀜 — ref/경로의 databaseName을 새 이름으로 맞춰준다
        activeDatabaseRef.current = op.newName;
        setActiveDatabase(op.newName);
        setActivePaths((prev) =>
          prev.map((p) =>
            p.kind === 'normal' && p.databaseName === op.oldName
              ? { ...p, databaseName: op.newName, label: op.newName }
              : p,
          ),
        );
      } else if (op.type === 'deleteDatabase' && activeDatabaseRef.current === op.database) {
        // 보고 있던 DB가 삭제됨 — mockAPI가 골라준 다음 DB로 이동하거나(없으면 빈 상태로)
        const nextDb = result.snapshot.activeDatabase || null;
        activeDatabaseRef.current = nextDb;
        activeCollectionRef.current = null;
        activeDocumentOidRef.current = null;
        setActiveDatabase(nextDb);
        setDocuments([]);
        setOpenDocument(null);
        if (nextDb) {
          const cols = await getCollections(nextDb);
          setCollections(cols);
          setActivePaths([
            {
              kind: 'normal',
              columnKind: 'collections',
              label: nextDb,
              databaseName: nextDb,
              comp: { id: nextPathId(), direction: -1 },
            },
          ]);
        } else {
          setCollections([]);
          setActivePaths([]);
        }
        setEditingId(null);
      }

      showToast('Saved', 'success', true);
      return result;
    } catch (e) {
      const msg = typeof e === 'string' ? e : 'Failed to save.';
      showToast(msg, 'error');
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  const clearChangedPaths = useCallback(() => {
    if (changedPathsTimerRef.current) clearTimeout(changedPathsTimerRef.current);
    setChangedPaths([]);
  }, []);

  const undo = useCallback(async () => {
    const snapshot = undoSnapshotRef.current;
    if (!snapshot) return;
    await mutate({ type: 'replaceSnapshot', snapshot });
    undoSnapshotRef.current = null;
    showToast('Undone', 'success');
  }, [mutate, showToast]);

  const refresh = useCallback(async () => {
    if (!activeDatabaseRef.current) return;
    setIsLoading(true);
    try {
      const cols = await getCollections(activeDatabaseRef.current);
      setCollections(cols);
      if (activeCollectionRef.current) {
        const docs = await getDocuments(activeCollectionRef.current);
        setDocuments(docs);
        if (activeDocumentOidRef.current) {
          const doc = await getFullDocumentById(activeDocumentOidRef.current);
          setOpenDocument(doc);
        }
      }
    } catch {
      showToast('Failed to refresh.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  const subscribe = useCallback((collectionId: string) => {
    return subscribeToChanges(collectionId, () => {
      // ChangeStream 수신 시 자동 갱신
      if (activeCollectionRef.current === collectionId) {
        void getDocuments(collectionId).then(setDocuments);
      }
    });
  }, []);

  return {
    connectionStatus,
    activeDatabase,
    activePaths,
    databases,
    collections,
    documents,
    openDocument,
    editingId,
    isLoading,
    changedPaths,
    toast,
    uniqueOids,
    visibleColumns,
    breadcrumbs,
    initialize,
    selectDatabase,
    selectCollection,
    selectDocument,
    pushJsonPath,
    popToIndex,
    pushReference,
    navigateToReference,
    mutate,
    registerUniqueOid,
    unregisterUniqueOid,
    setEditingId,
    clearChangedPaths,
    dismissToast,
    undo,
    refresh,
    subscribe,
  };
}
