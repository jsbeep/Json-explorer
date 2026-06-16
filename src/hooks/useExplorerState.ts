import { useCallback, useMemo, useRef, useState } from 'react';
import {
  connect,
  getCollections,
  getDocumentById,
  getFullDocumentById,
  getDocuments,
  mutateData,
  checkReference,
  subscribeToChanges,
} from '../services/mockAPI';
import { getSnapshot } from '../services/mockStorage';
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

// ── 상수 ──────────────────────────────────────────────────────────────────────

const CHAIN_COLORS = ['#f59e0b', '#8b5cf6', '#3b82f6', '#ec4899', '#14b8a6'] as const;

let pathIdCounter = 0;
const nextId = () => String(++pathIdCounter);

// ── Toast 타입 ────────────────────────────────────────────────────────────────

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error';
  undoable?: boolean;
}

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
  pushReference: (oid: string, fieldKey: string) => Promise<void>;
  mutate: (op: MockMutationRequest) => Promise<MockMutationResult>;
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
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const undoSnapshotRef = useRef<MockSnapshot | null>(null);
  const activeDatabaseRef = useRef<string | null>(null);
  const activeCollectionRef = useRef<string | null>(null);
  const activeDocumentOidRef = useRef<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── 내부 헬퍼 ──────────────────────────────────────────────────────────────

  const showToast = useCallback((message: string, type: ToastMessage['type'], undoable = false) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    const id = nextId();
    setToast({ id, message, type, undoable });
    toastTimerRef.current = setTimeout(() => setToast(null), type === 'error' ? 3000 : 5000);
  }, []);

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(null);
  }, []);

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
            key: `ref-${ap.refOid}`,
            label: ap.label,
            kind: 'document',
            chainColor: ap.chainColor,
          });
        } else if (ap.kind === 'normal') {
          const kind = ap.projectionPath && ap.projectionPath.length > 0 ? 'field' : 'document';
          segs.push({ key: ap.comp.id, label: ap.label, kind });
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
          comp: { id: nextId(), direction: 1 },
        },
      ]);
    } catch {
      setConnectionStatus('error');
      showToast('DB 연결에 실패했습니다.', 'error');
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
          comp: { id: nextId(), direction: -1 },
        },
      ]);
    } catch {
      showToast('데이터베이스를 불러올 수 없습니다.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  const selectCollection = useCallback(async (name: string, label: string) => {
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
          comp: { id: prev[0]?.comp.id ?? nextId(), direction: 1 },
        };
        const next: NormalActivePath = {
          kind: 'normal',
          columnKind: 'documents',
          label,
          collectionName: name,
          comp: { id: nextId(), direction: -1 },
        };
        return [base, next];
      });
    } catch {
      showToast('컬렉션을 불러올 수 없습니다.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  const selectDocument = useCallback(async (oid: string, title: string) => {
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
          comp: { id: nextId(), direction: -1 },
        };
        return [...prev.slice(0, 2), jsonPath];
      });
    } catch {
      showToast('문서를 불러올 수 없습니다.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  const pushJsonPath = useCallback((path: ActivePath) => {
    setActivePaths((prev) => [...prev, path]);
  }, []);

  const popToIndex = useCallback((index: number) => {
    setActivePaths((prev) => prev.slice(0, index + 1));
    // json depth 이하로 pop 시 openDocument 상태 유지 (컬럼이 재사용)
  }, []);

  const pushReference = useCallback(async (oid: string, fieldKey: string) => {
    setIsLoading(true);
    try {
      const isRef = await checkReference(oid);
      if (!isRef) return;

      const doc = await getDocumentById(oid);
      setActivePaths((prev) => {
        const chainIndex = prev.filter((p) => p.kind === 'reference').length;
        const chainColor = CHAIN_COLORS[chainIndex % CHAIN_COLORS.length];
        const refPath: ReferenceActivePath = {
          kind: 'reference',
          columnKind: 'json',
          label: fieldKey,
          refOid: oid,
          projectionPath: [],
          chainColor,
          chainIndex,
          comp: { id: nextId(), direction: 1 },
        };
        // refDoc는 참조된 문서로 openDocument를 교체하지 않고 별도 처리
        // JsonLevelColumn에서 refOid를 직접 사용해 getDocumentById 호출
        void doc; // 참조 확인용, 실제 렌더는 컬럼에서 처리
        return [...prev, refPath];
      });
    } catch {
      showToast('레퍼런스를 불러올 수 없습니다.', 'error');
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

      // 관련 캐시 갱신
      if ('collection' in op && typeof op.collection === 'string' && activeCollectionRef.current === op.collection) {
        const docs = await getDocuments(op.collection);
        setDocuments(docs);
        // 열린 문서 갱신
        if (activeDocumentOidRef.current && op.type === 'mutateField') {
          const doc = await getFullDocumentById(activeDocumentOidRef.current);
          setOpenDocument(doc);
        }
      }
      if (op.type === 'createCollection' && op.database === activeDatabaseRef.current) {
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

      showToast('저장 완료', 'success', true);
      return result;
    } catch (e) {
      const msg = typeof e === 'string' ? e : '저장에 실패했습니다.';
      showToast(msg, 'error');
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  const clearChangedPaths = useCallback(() => setChangedPaths([]), []);

  const undo = useCallback(async () => {
    const snapshot = undoSnapshotRef.current;
    if (!snapshot) return;
    await mutate({ type: 'replaceSnapshot', snapshot });
    undoSnapshotRef.current = null;
    showToast('실행 취소됨', 'success');
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
          const doc = await getDocumentById(activeDocumentOidRef.current);
          setOpenDocument(doc);
        }
      }
    } catch {
      showToast('새로고침에 실패했습니다.', 'error');
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
    visibleColumns,
    breadcrumbs,
    initialize,
    selectDatabase,
    selectCollection,
    selectDocument,
    pushJsonPath,
    popToIndex,
    pushReference,
    mutate,
    setEditingId,
    clearChangedPaths,
    dismissToast,
    undo,
    refresh,
    subscribe,
  };
}
