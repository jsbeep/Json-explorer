export type BsonObjectId = {
  $oid: string;
};

export type JsonPrimitive = string | number | boolean | null;

export type JsonObject = {
  [key: string]: JsonValue;
};

export type JsonArray = JsonValue[];

export type JsonValue = JsonPrimitive | JsonObject | JsonArray | BsonObjectId;

export type Document = JsonObject;

export type DbStatus =
  | { state: 'primary'; oplogSizeMb: number; lagMs: 0 }
  | { state: 'secondary'; oplogSizeMb: number; lagMs: number }
  | { state: 'arbiter' }
  | { state: 'startup' }
  | { state: 'unknown'; reason: string };

export type CollectionStat = {
  name: string;
  documentCount: number;
  sizeMb: number;
  indexCount: number;
  hasChangeStreamSupport: boolean;
};

export type IndexInfo = {
  name: string;
  keys: Record<string, 1 | -1 | 'text' | '2dsphere'>;
  unique: boolean;
  sparse: boolean;
  ttlSecs?: number;
};

export type CatalogEntry = {
  collection: CollectionStat;
  indexes: IndexInfo[];
  validator?: Document;
};

export type DbCatalog = {
  database: string;
  status: DbStatus;
  collections: CatalogEntry[];
  fetchedAt: number;
};

export type QueryRange =
  | { type: 'all' }
  | { type: 'paginated'; page: number; pageSize: number }
  | { type: 'time'; from: number; to: number }
  | { type: 'cursor'; afterId: string; limit: number };

export type QueryMeta = {
  database: string;
  collection: string;
  range: QueryRange;
  executedAt: number;
  durationMs: number;
};

export type QueryResult<T = Document> =
  | { status: 'ok'; data: T[]; meta: QueryMeta; total?: number }
  | { status: 'empty'; meta: QueryMeta }
  | { status: 'partial'; data: T[]; meta: QueryMeta; reason: 'timeout' | 'size-limit' }
  | { status: 'no-permission'; collection: string }
  | { status: 'invalid-range'; error: string };

export type TimeWindow =
  | { type: 'last'; amount: number; unit: 'minutes' | 'hours' | 'days' }
  | { type: 'fixed'; from: number; to: number }
  | { type: 'open'; from: number };

export type FieldFilter =
  | { op: 'eq'; field: string; value: unknown }
  | { op: 'in'; field: string; values: unknown[] }
  | { op: 'range'; field: string; gte?: unknown; lte?: unknown }
  | { op: 'exists'; field: string; exists: boolean }
  | { op: 'and'; filters: FieldFilter[] }
  | { op: 'or'; filters: FieldFilter[] };

export type ViewScope = {
  collection: string;
  timeWindow: TimeWindow;
  filters: FieldFilter[];
  fields?: string[];
  sortBy?: { field: string; dir: 'asc' | 'desc' };
};

export type WatchRequest = {
  sessionId: string;
  database: string;
  collection: string;
  pipeline?: Document[];
  scope: ViewScope;
  resumeAfter?: string;
  throttleMs?: number;
};

export type FriendlyPatchEvent = {
  field: string;
  op: 'updated' | 'added' | 'removed';
  oldValue?: unknown;
  newValue?: unknown;
};

export type ChangeResponse =
  | { type: 'patch'; database: string; collection: string; patch: FriendlyPatchEvent[]; tracePath: string[] }
  | { type: 'replace'; database: string; collection: string; data: Document[]; tracePath: string[] }
  | { type: 'invalidate'; reason: 'collection-dropped' | 'collection-renamed'; database: string; collection: string }
  | { type: 'system'; action: 'permission-revoked' | 'force-disconnect' };

export type ConnectionConfig = {
  database?: string;
  latencyMs?: number;
  readonly?: boolean;
};

export type CollectionPermission = 'read' | 'write' | 'admin';

export type PermissionContext = {
  database: string;
  collection?: string;
  role: CollectionPermission;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
};

export type ConnectionResult = {
  status: 'connected';
  connectedAt: number;
  activeDatabase: string;
  databases: DatabaseSummary[];
};

export type DatabaseSummary = {
  name: string;
  label: string;
  description: string;
  collectionCount: number;
  documentCount: number;
  updatedAt: number;
};

export type CollectionSummary = {
  name: string;
  label: string;
  description: string;
  documentCount: number;
  sizeMb: number;
  updatedAt: number;
};

export type DocumentSummary = {
  id: string;
  title: string;
  preview: string;
  fieldCount: number;
  updatedAt: number;
};

// ActivePath: 탐색 스택 엔트리 (비즈니스 로직용)
export type ActivePathBase = {
  id: string;                          // AnimatePresence key용 고유 ID
  columnKind: ExplorerColumnKind;      // 'collections' | 'documents' | 'json'
  label: string;                       // 컬럼 헤더 표시용
};

export type NormalActivePath = ActivePathBase & {
  segmentType: 'normal';
  database: string;
  collection?: string;
  documentId?: string;
  fieldPath?: string[];                // json depth 탐색 경로
};

export type ReferenceActivePath = ActivePathBase & {
  segmentType: 'reference';
  refOid: string;
  projectionPath: string[];            // 누적 projection 경로
  chainIndex: number;                  // 5색 팔레트 인덱스 (% 5)
};

export type ActivePath = NormalActivePath | ReferenceActivePath;

// ExplorerPathSegment: breadcrumb 단일 조각 (렌더링용)
export type ExplorerPathSegment = {
  key: string;                         // React key
  label: string;                       // 표시 텍스트
  kind: 'database' | 'collection' | 'document' | 'field';
  path: string[];                      // 이 조각까지의 전체 경로 (롤백 기준점)
  valueType?: 'object' | 'array' | 'primitive' | 'reference';
  chainColor?: string;                 // 레퍼런스 체인 hex, 일반 경로는 undefined
};

export type ExplorerViewportMode = 'desktop' | 'tablet' | 'mobile';

export type ExplorerMobileTab = 'collections' | 'documents' | 'json';

export type ExplorerColumnKind = 'collections' | 'documents' | 'json';

export type MockCollectionRecord = {
  name: string;
  label: string;
  description: string;
  documents: Document[];
  updatedAt: number;
};

export type MockDatabaseRecord = {
  name: string;
  label: string;
  description: string;
  collections: Record<string, MockCollectionRecord>;
  updatedAt: number;
};

export type MockSnapshot = {
  version: number;
  activeDatabase: string;
  databases: Record<string, MockDatabaseRecord>;
  updatedAt: number;
};

export type MutateFieldOp =
  | { action: 'add'; key: string; value: JsonValue; containerType: 'object' | 'array'; path: string[] }
  | { action: 'edit'; key: string; nextKey?: string; value: JsonValue; containerType: 'object' | 'array'; path: string[] }
  | { action: 'delete'; key: string; containerType: 'object' | 'array'; path: string[] };

export type MockMutationRequest =
  | { type: 'createDatabase'; database: Omit<MockDatabaseRecord, 'collections' | 'updatedAt'> & { collections?: Record<string, MockCollectionRecord> } }
  | { type: 'createCollection'; database: string; collection: Omit<MockCollectionRecord, 'documents' | 'updatedAt'> & { documents?: Document[] } }
  | { type: 'upsertDocument'; database: string; collection: string; document: Document }
  | { type: 'deleteDocument'; database: string; collection: string; documentId: string }
  | {
      type: 'mutateField';
      database: string;
      collection: string;
      documentId: string;
      field: MutateFieldOp;
    }
  | { type: 'replaceSnapshot'; snapshot: MockSnapshot };

export type changedPaths = {
  status: 'ok';
  snapshot: MockSnapshot;
  tracePath: string[];
  collectionKey?: string;
};