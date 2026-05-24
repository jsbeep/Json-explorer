import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  CatalogEntry,
  ChangeResponse,
  DbCatalog,
  Document,
  QueryResult,
  ViewScope,
  WatchRequest,
} from '../types/explorer';
import type { ExplorerColumn, JsonHighlight, JsonPathSegment } from '../types/explorer-ui';
import { pathSegmentLabel, pathToKey, ROOT_HIGHLIGHT } from '../utils/jsonPath';
import { createObjectId } from '../utils/objectId';

type ExplorerPanel = 0 | 1 | 2;

export interface ExplorerStateOptions {
  catalogs?: DbCatalog[];
  queryResult?: QueryResult<Document>;
  seedQueryByCollection?: Record<string, QueryResult<Document>>;
  defaultDatabase?: string;
  defaultCollection?: string;
  defaultDocumentId?: string;
  onWatch?: (request: WatchRequest) => void;
  onInsertDocuments?: (collection: string, docs: Document[]) => Promise<void> | void;
}

export interface ExplorerState {
  catalogs: DbCatalog[];
  activeDatabase: string | null;
  activeCollection: string | null;
  activeCollectionEntry: CatalogEntry | null;
  queryResult: QueryResult<Document> | null;
  documents: Document[];
  documentMap: Map<string, Document>;
  activeDocument: Document | null;
  activePanel: ExplorerPanel;
  viewScope: ViewScope | null;
  columns: ExplorerColumn[];
  jsonPath: JsonPathSegment[];
  breadcrumbSegments: string[];
  highlight: JsonHighlight;
  jsonInputs: string[];
  jsonErrors: string[];
  selectDatabase: (database: string) => void;
  selectCollection: (collection: string) => void;
  selectDocument: (document: Document) => void;
  setActivePanel: (panel: ExplorerPanel) => void;
  openJsonPath: (columnDepth: number, segment: JsonPathSegment, primitiveValue?: boolean) => void;
  setJsonPathDepth: (depth: number) => void;
  updateJsonValue: (rootDocumentId: string, path: JsonPathSegment[], value: unknown) => void;
  addDatabase: (name: string) => void;
  removeDatabase: (name: string) => void;
  addCollection: (database: string, name: string) => void;
  removeCollection: (database: string, name: string) => void;
  removeDocumentById: (id: string) => void;
  addJsonInput: () => void;
  updateJsonInput: (index: number, value: string) => void;
  removeJsonInput: (index: number) => void;
  submitJsonInputs: () => Promise<void>;
  applyChangeResponse: (change: ChangeResponse) => void;
  setQueryResult: (next: QueryResult<Document>) => void;
  addDocument: (doc: Document) => void;
  importJsonText: (text: string) => void;
}

const DEFAULT_JSON_INPUT = `{
  "title": "new document"
}`;

const normalizeDocumentId = (doc: Document) => {
  const raw = doc._id;
  if (typeof raw === 'string' || typeof raw === 'number') return String(raw);
  if (raw && typeof raw === 'object' && 'toString' in raw) return String(raw);
  return '';
};

const ensureDocumentId = (doc: Document) => {
  if ('_id' in doc && doc._id) return doc;
  return { ...doc, _id: createObjectId() };
};

const buildOkResult = (collection: string, data: Document[], total?: number): QueryResult<Document> => ({
  status: 'ok',
  data,
  meta: {
    collection,
    range: { type: 'all' },
    executedAt: Date.now(),
    durationMs: 0,
  },
  total,
});

const collectionKey = (database: string | null, collection: string | null) =>
  database && collection ? `${database}::${collection}` : null;

const isPlainObject = (value: unknown) =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const getValueAtPath = (value: unknown, path: JsonPathSegment[]) => {
  let current = value;
  for (const segment of path) {
    if (segment.type === 'reference') return current;
    if (segment.type === 'key') {
      if (!isPlainObject(current)) return undefined;
      current = (current as Record<string, unknown>)[segment.key];
    }
    if (segment.type === 'index') {
      if (!Array.isArray(current)) return undefined;
      current = (current as unknown[])[segment.index];
    }
  }
  return current;
};

const setValueAtPath = (value: unknown, path: JsonPathSegment[], nextValue: unknown): unknown => {
  if (path.length === 0) return nextValue;
  const [head, ...tail] = path;
  if (head.type === 'reference') return value;
  if (head.type === 'key') {
    const base = isPlainObject(value) ? { ...(value as Record<string, unknown>) } : {};
    base[head.key] = tail.length === 0 ? nextValue : setValueAtPath(base[head.key], tail, nextValue);
    return base;
  }
  const base = Array.isArray(value) ? [...value] : [];
  base[head.index] = tail.length === 0 ? nextValue : setValueAtPath(base[head.index], tail, nextValue);
  return base;
};

export function useExplorerState(options: ExplorerStateOptions = {}): ExplorerState {
  const initialCollection =
    options.defaultCollection ??
    (options.queryResult && 'meta' in options.queryResult ? options.queryResult.meta.collection : null);

  const initialDatabase =
    options.defaultDatabase ?? options.catalogs?.[0]?.database ?? null;

  const [catalogs, setCatalogs] = useState<DbCatalog[]>(options.catalogs ?? []);
  const [queryResult, setQueryResult] = useState<QueryResult<Document> | null>(
    options.queryResult ?? null
  );
  const [collectionSnapshots, setCollectionSnapshots] = useState<Record<string, QueryResult<Document>>>(
    options.seedQueryByCollection ?? {}
  );
  const [activeDatabase, setActiveDatabase] = useState<string | null>(initialDatabase);
  const [activeCollection, setActiveCollection] = useState<string | null>(initialCollection);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(
    options.defaultDocumentId ?? null
  );
  const [activePanel, setActivePanel] = useState<ExplorerPanel>(0);
  const [jsonInputs, setJsonInputs] = useState<string[]>([DEFAULT_JSON_INPUT]);
  const [jsonErrors, setJsonErrors] = useState<string[]>([]);
  const [jsonPath, setJsonPath] = useState<JsonPathSegment[]>([]);
  const [highlight, setHighlight] = useState<JsonHighlight>({
    rootId: null,
    pathKey: null,
    timestamp: 0,
  });

  useEffect(() => {
    if (!activeDatabase && catalogs.length > 0) {
      setActiveDatabase(catalogs[0].database);
    }
  }, [activeDatabase, catalogs]);

  useEffect(() => {
    const key = collectionKey(activeDatabase, activeCollection);
    if (!key) return;
    if (collectionSnapshots[key]) {
      setQueryResult(collectionSnapshots[key]);
    }
  }, [activeCollection, activeDatabase, collectionSnapshots]);

  const activeCollectionEntry = useMemo(() => {
    if (!activeCollection) return null;
    const databaseEntry = catalogs.find((entry) => entry.database === activeDatabase) ?? catalogs[0];
    return databaseEntry?.collections.find((entry) => entry.collection.name === activeCollection) ?? null;
  }, [activeCollection, activeDatabase, catalogs]);

  const documents = useMemo(() => {
    if (!queryResult || queryResult.status === 'empty') return [];
    if (queryResult.status === 'ok' || queryResult.status === 'partial') return queryResult.data;
    return [];
  }, [queryResult]);

  const documentMap = useMemo(() => {
    const map = new Map<string, Document>();
    documents.forEach((doc) => {
      const id = normalizeDocumentId(doc);
      if (id) map.set(id, doc);
    });
    return map;
  }, [documents]);

  const activeDocument = useMemo(() => {
    if (!activeDocumentId) return null;
    return documents.find((doc) => normalizeDocumentId(doc) === activeDocumentId) ?? null;
  }, [activeDocumentId, documents]);

  const viewScope = useMemo<ViewScope | null>(() => {
    if (!activeCollection) return null;
    return {
      collection: activeCollection,
      timeWindow: { type: 'last', amount: 6, unit: 'hours' },
      filters: [],
    };
  }, [activeCollection]);

  useEffect(() => {
    if (!viewScope || !options.onWatch) return;
    options.onWatch({
      sessionId: 'explorer-preview',
      collection: viewScope.collection,
      scope: viewScope,
      throttleMs: 250,
    });
  }, [options, viewScope]);

  useEffect(() => {
    if (!highlight.timestamp) return undefined;
    const timer = window.setTimeout(() => {
      setHighlight({ rootId: null, pathKey: null, timestamp: 0 });
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [highlight.timestamp]);

  useEffect(() => {
    if (!activeDocumentId) setJsonPath([]);
  }, [activeDocumentId]);

  const selectDatabase = useCallback((database: string) => {
    setActiveDatabase(database);
    setActiveCollection(null);
    setActiveDocumentId(null);
    setActivePanel(0);
    setJsonPath([]);
    setQueryResult(null);
  }, []);

  const selectCollection = useCallback(
    (collection: string) => {
      setActiveCollection(collection);
      setActiveDocumentId(null);
      setActivePanel(1);
      setJsonPath([]);
      const key = collectionKey(activeDatabase, collection);
      if (key && collectionSnapshots[key]) {
        setQueryResult(collectionSnapshots[key]);
      } else {
        setQueryResult(null);
      }
    },
    [activeDatabase, collectionSnapshots]
  );

  const selectDocument = useCallback((document: Document) => {
    const nextId = normalizeDocumentId(document);
    setActiveDocumentId(nextId || null);
    setActivePanel(2);
    setJsonPath([]);
  }, []);

  const openJsonPath = useCallback((columnDepth: number, segment: JsonPathSegment, primitiveValue?: boolean) => {
    setJsonPath((prev) => [...prev.slice(0, columnDepth), primitiveValue ? prev[columnDepth] : segment]);
  }, []);

  const setJsonPathDepth = useCallback((depth: number) => {
    setJsonPath((prev) => prev.slice(0, Math.max(0, depth)));
  }, []);

  const addDatabase = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setCatalogs((prev) => {
      if (prev.some((entry) => entry.database === trimmed)) return prev;
      return [
        ...prev,
        {
          database: trimmed,
          status: { state: 'unknown', reason: 'local' },
          collections: [],
          fetchedAt: Date.now(),
        },
      ];
    });
  }, []);

  const removeDatabase = useCallback(
    (name: string) => {
      setCatalogs((prev) => {
        const nextCatalogs = prev.filter((entry) => entry.database !== name);
        if (activeDatabase === name) {
          setActiveDatabase(nextCatalogs[0]?.database ?? null);
          setActiveCollection(null);
          setActiveDocumentId(null);
        }
        return nextCatalogs;
      });
    },
    [activeDatabase]
  );

  const addCollection = useCallback((database: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setCatalogs((prev) =>
      prev.map((entry) => {
        if (entry.database !== database) return entry;
        if (entry.collections.some((col) => col.collection.name === trimmed)) return entry;
        return {
          ...entry,
          collections: [
            ...entry.collections,
            {
              collection: {
                name: trimmed,
                documentCount: 0,
                sizeMb: 0,
                indexCount: 0,
                hasChangeStreamSupport: true,
              },
              indexes: [],
            },
          ],
        };
      })
    );
  }, []);

  const removeCollection = useCallback(
    (database: string, name: string) => {
      setCatalogs((prev) =>
        prev.map((entry) =>
          entry.database !== database
            ? entry
            : { ...entry, collections: entry.collections.filter((col) => col.collection.name !== name) }
        )
      );
      if (activeCollection === name) {
        setActiveCollection(null);
        setActiveDocumentId(null);
        setActivePanel(0);
      }
    },
    [activeCollection]
  );

  const removeDocumentById = useCallback(
    (id: string) => {
      setQueryResult((prev) => {
        if (!prev || (prev.status !== 'ok' && prev.status !== 'partial')) return prev;
        const nextData = prev.data.filter((doc) => normalizeDocumentId(doc) !== id);
        const nextTotal =
          'total' in prev && typeof prev.total === 'number'
            ? Math.max(prev.total - 1, 0)
            : nextData.length;
        const next: QueryResult<Document> = prev.status === 'partial'
          ? { ...prev, data: nextData }
          : { ...prev, data: nextData, total: nextTotal };
        const key = collectionKey(activeDatabase, activeCollection);
        if (key) {
          setCollectionSnapshots((prevSnapshots) => ({ ...prevSnapshots, [key]: next }));
        }
        return next;
      });
      if (activeDocumentId === id) setActiveDocumentId(null);
    },
    [activeCollection, activeDatabase, activeDocumentId]
  );

  const addJsonInput = useCallback(() => {
    setJsonInputs((prev) => [...prev, DEFAULT_JSON_INPUT]);
  }, []);

  const updateJsonInput = useCallback((index: number, value: string) => {
    setJsonInputs((prev) => prev.map((entry, idx) => (idx === index ? value : entry)));
  }, []);

  const removeJsonInput = useCallback((index: number) => {
    setJsonInputs((prev) => prev.filter((_, idx) => idx !== index));
    setJsonErrors((prev) => prev.filter((_, idx) => idx !== index));
  }, []);

  const submitJsonInputs = useCallback(async () => {
    if (!activeCollection) return;
    const nextDocuments: Document[] = [];
    const nextErrors: string[] = [];

    jsonInputs.forEach((value, index) => {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          parsed.forEach((item) => {
            if (item && typeof item === 'object') nextDocuments.push(ensureDocumentId(item));
          });
        } else if (parsed && typeof parsed === 'object') {
          nextDocuments.push(ensureDocumentId(parsed));
        }
        nextErrors[index] = '';
      } catch (error) {
        nextErrors[index] = error instanceof Error ? error.message : 'Invalid JSON';
      }
    });

    setJsonErrors(nextErrors);
    if (nextDocuments.length === 0) return;

    setQueryResult((prev) => {
      if (!prev || prev.status === 'empty') {
        const next = buildOkResult(activeCollection, nextDocuments, nextDocuments.length);
        const key = collectionKey(activeDatabase, activeCollection);
        if (key) {
          setCollectionSnapshots((prevSnapshots) => ({ ...prevSnapshots, [key]: next }));
        }
        return next;
      }
      if (prev.status === 'ok' || prev.status === 'partial') {
        const existing = [...prev.data];
        let addedCount = 0;
        nextDocuments.forEach((doc) => {
          const id = normalizeDocumentId(doc);
          const index = existing.findIndex((item) => normalizeDocumentId(item) === id);
          if (index >= 0) existing[index] = doc;
          else {
            existing.unshift(doc);
            addedCount += 1;
          }
        });
        const nextTotal =
          'total' in prev && typeof prev.total === 'number'
            ? prev.total + addedCount
            : existing.length;
        const next: QueryResult<Document> = prev.status === 'partial'
          ? { ...prev, data: existing }
          : { ...prev, data: existing, total: nextTotal };
        const key = collectionKey(activeDatabase, activeCollection);
        if (key) {
          setCollectionSnapshots((prevSnapshots) => ({ ...prevSnapshots, [key]: next }));
        }
        return next;
      }
      return prev;
    });

    const updatedIds = nextDocuments.map(normalizeDocumentId).filter(Boolean);
    if (activeDocumentId && updatedIds.includes(activeDocumentId)) {
      setHighlight({
        rootId: activeDocumentId,
        pathKey: ROOT_HIGHLIGHT,
        timestamp: Date.now(),
      });
    }

    await options.onInsertDocuments?.(activeCollection, nextDocuments);
  }, [activeCollection, jsonInputs, options]);

  const addDocument = useCallback((doc: Document) => {
    const nextDoc = ensureDocumentId(doc);
    setQueryResult((prev) => {
      if (!prev || prev.status === 'empty') {
        const next = buildOkResult(activeCollection ?? 'unknown', [nextDoc], 1);
        const key = collectionKey(activeDatabase, activeCollection);
        if (key) setCollectionSnapshots((prevSnapshots) => ({ ...prevSnapshots, [key]: next }));
        return next;
      }
      if (prev.status === 'ok' || prev.status === 'partial') {
        const existing = [...prev.data];
        const id = normalizeDocumentId(nextDoc);
        const idx = existing.findIndex((d) => normalizeDocumentId(d) === id);
        if (idx >= 0) existing[idx] = nextDoc; else existing.unshift(nextDoc);
        const nextTotal = 'total' in prev && typeof prev.total === 'number' ? prev.total + (idx >= 0 ? 0 : 1) : existing.length;
        const next: QueryResult<Document> = prev.status === 'partial' ? { ...prev, data: existing } : { ...prev, data: existing, total: nextTotal };
        const key = collectionKey(activeDatabase, activeCollection);
        if (key) setCollectionSnapshots((prevSnapshots) => ({ ...prevSnapshots, [key]: next }));
        return next;
      }
      return prev;
    });
  }, [activeCollection, activeDatabase]);

  const importJsonText = useCallback((text: string) => {
    if (!activeCollection) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      return;
    }
    const docs: Document[] = [];
    if (Array.isArray(parsed)) {
      parsed.forEach((item) => { if (item && typeof item === 'object') docs.push(ensureDocumentId(item as Document)); });
    } else if (parsed && typeof parsed === 'object') {
      docs.push(ensureDocumentId(parsed as Document));
    }
    if (docs.length === 0) return;
    setQueryResult((prev) => {
      if (!prev || prev.status === 'empty') {
        const next = buildOkResult(activeCollection, docs, docs.length);
        const key = collectionKey(activeDatabase, activeCollection);
        if (key) setCollectionSnapshots((prevSnapshots) => ({ ...prevSnapshots, [key]: next }));
        return next;
      }
      if (prev.status === 'ok' || prev.status === 'partial') {
        const existing = [...prev.data];
        let addedCount = 0;
        docs.forEach((doc) => {
          const id = normalizeDocumentId(doc);
          const index = existing.findIndex((item) => normalizeDocumentId(item) === id);
          if (index >= 0) existing[index] = doc; else { existing.unshift(doc); addedCount += 1; }
        });
        const nextTotal = 'total' in prev && typeof prev.total === 'number' ? prev.total + addedCount : existing.length;
        const next: QueryResult<Document> = prev.status === 'partial' ? { ...prev, data: existing } : { ...prev, data: existing, total: nextTotal };
        const key = collectionKey(activeDatabase, activeCollection);
        if (key) setCollectionSnapshots((prevSnapshots) => ({ ...prevSnapshots, [key]: next }));
        return next;
      }
      return prev;
    });
  }, [activeCollection, activeDatabase]);

  const applyChangeResponse = useCallback(
    (change: ChangeResponse) => {
      setQueryResult((prev) => {
        if (change.type === 'replace') {
          const next = buildOkResult(activeCollection ?? 'unknown', change.data, change.data.length);
          const key = collectionKey(activeDatabase, activeCollection ?? null);
          if (key) {
            setCollectionSnapshots((prevSnapshots) => ({ ...prevSnapshots, [key]: next }));
          }
          return next;
        }

        if (!prev || prev.status === 'empty') return prev;
        if (change.type === 'patch' && (prev.status === 'ok' || prev.status === 'partial')) {
          const patched = prev.data.map((doc) => {
            if (normalizeDocumentId(doc) !== activeDocumentId) return doc;
            const nextDoc = { ...doc } as Document;
            change.patch.forEach((patch) => {
              if (patch.op === 'removed') delete nextDoc[patch.field];
              if (patch.op === 'added' || patch.op === 'updated') nextDoc[patch.field] = patch.newValue;
            });
            return nextDoc;
          });
          const next: QueryResult<Document> = { ...prev, data: patched };
          const key = collectionKey(activeDatabase, activeCollection);
          if (key) {
            setCollectionSnapshots((prevSnapshots) => ({ ...prevSnapshots, [key]: next }));
          }
          return next;
        }

        return prev;
      });

      if (activeDocumentId) {
        setHighlight({
          rootId: activeDocumentId,
          pathKey: ROOT_HIGHLIGHT,
          timestamp: Date.now(),
        });
      }
    },
    [activeCollection, activeDatabase, activeDocumentId]
  );

  const updateJsonValue = useCallback((rootDocumentId: string, path: JsonPathSegment[], value: unknown) => {
    const cleanPath = path.filter((segment) => segment.type !== 'reference');
    if (!rootDocumentId || cleanPath.length === 0) return;
    setQueryResult((prev) => {
      if (!prev || (prev.status !== 'ok' && prev.status !== 'partial')) return prev;
      const nextData = prev.data.map((doc) => {
        const id = normalizeDocumentId(doc);
        if (id !== rootDocumentId) return doc;
        const updated = setValueAtPath(doc, cleanPath, value);
        return isPlainObject(updated) ? (updated as Document) : doc;
      });
      const next: QueryResult<Document> = prev.status === 'partial'
        ? { ...prev, data: nextData }
        : { ...prev, data: nextData, total: prev.total ?? nextData.length };
      const key = collectionKey(activeDatabase, activeCollection);
      if (key) {
        setCollectionSnapshots((prevSnapshots) => ({ ...prevSnapshots, [key]: next }));
      }
      return next;
    });
    setHighlight({ rootId: rootDocumentId, pathKey: pathToKey(cleanPath), timestamp: Date.now() });
  }, [activeCollection, activeDatabase]);

  const columns = useMemo<ExplorerColumn[]>(() => {
    const baseColumns: ExplorerColumn[] = [
      { id: 'collections', type: 'collections', title: 'Collections' },
      { id: 'documents', type: 'documents', title: 'Documents' },
      {
        id: `json-root-${activeDocumentId ?? 'empty'}`,
        type: 'json',
        title: 'Document Root',
        value: activeDocument,
        path: [],
        rootDocumentId: activeDocumentId,
        depth: 0,
      },
    ];

    if (!activeDocument) return baseColumns;

    let currentValue: unknown = activeDocument;
    let currentRootId = activeDocumentId;
    let currentPath: JsonPathSegment[] = [];
    let depth = 0;
    const jsonColumns: ExplorerColumn[] = [];

    jsonPath.forEach((segment) => {
      depth += 1;
      if (segment.type === 'reference') {
        currentRootId = segment.id;
        currentValue = documentMap.get(segment.id) ?? null;
        currentPath = [];
        jsonColumns.push({
          id: `json-ref-${segment.id}-${depth}`,
          type: 'json',
          title: `Document ${segment.id.slice(-4)}`,
          value: currentValue,
          path: currentPath,
          rootDocumentId: currentRootId,
          depth,
        });
        return;
      }

      currentPath = [...currentPath, segment];
      currentValue = getValueAtPath(currentValue, [segment]);
      const title = segment.type === 'key' ? segment.key : `[${segment.index}]`;
      jsonColumns.push({
        id: `json-${pathToKey(currentPath)}-${depth}`,
        type: 'json',
        title,
        value: currentValue,
        path: currentPath,
        rootDocumentId: currentRootId,
        depth,
      });
    });

    return [...baseColumns, ...jsonColumns];
  }, [activeDocument, activeDocumentId, documentMap, jsonPath]);

  const breadcrumbSegments = useMemo(() => jsonPath.map(pathSegmentLabel), [jsonPath]);

  return {
    catalogs,
    activeDatabase,
    activeCollection,
    activeCollectionEntry,
    queryResult,
    documents,
    documentMap,
    activeDocument,
    activePanel,
    viewScope,
    columns,
    jsonPath,
    breadcrumbSegments,
    highlight,
    jsonInputs,
    jsonErrors,
    selectDatabase,
    selectCollection,
    selectDocument,
    setActivePanel,
    openJsonPath,
    setJsonPathDepth,
    updateJsonValue,
    addDatabase,
    removeDatabase,
    addCollection,
    removeCollection,
    removeDocumentById,
    addJsonInput,
    updateJsonInput,
    removeJsonInput,
    submitJsonInputs,
    applyChangeResponse,
    setQueryResult,
    addDocument,
    importJsonText,
  };
}
