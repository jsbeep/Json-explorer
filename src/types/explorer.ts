// ── BSON / MongoDB 특수 타입 ──────────────────────────────────────────────────

export interface BsonObjectId {
  $oid: string;
}

export interface DBRef {
  $ref: string;
  $id: BsonObjectId;
  $db: string;
}

// ── JSON 원자 타입 ────────────────────────────────────────────────────────────

export type JsonPrimitive = string | number | boolean | null;
// BsonObjectId, DBRef를 명시적으로 포함해 document 필드 값으로 허용
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[] | BsonObjectId | DBRef;
export interface JsonObject {
  [key: string]: JsonValue;
}

export type Document = JsonObject & { _id: BsonObjectId };

// ── Mock Storage 구조 ─────────────────────────────────────────────────────────

export interface MockCollectionRecord {
  name: string;
  label: string;
  description: string;
  documents: Document[];
  updatedAt: number;
  // DocumentsColumn 목록에 표시할 제목으로 쓸 필드 키 (미지정 시 name → title → OID 순)
  titleKey?: string;
}

export interface MockDatabaseRecord {
  name: string;
  label: string;
  description: string;
  collections: Record<string, MockCollectionRecord>;
  updatedAt: number;
}

export interface MockSnapshot {
  version: number;
  activeDatabase: string;
  databases: Record<string, MockDatabaseRecord>;
  updatedAt: number;
}

// ── API 요청/응답 타입 ────────────────────────────────────────────────────────

export interface ConnectionConfig {
  database?: string;
  latencyMs?: number;
}

export interface DatabaseSummary {
  name: string;
  label: string;
  description: string;
  collectionCount: number;
  documentCount: number;
  updatedAt: number;
}

export interface ConnectionResult {
  status: 'connected';
  connectedAt: number;
  activeDatabase: string;
  databases: DatabaseSummary[];
}

export interface CollectionSummary {
  name: string;
  label: string;
  description: string;
  documentCount: number;
  sizeMb: number;
  updatedAt: number;
  titleKey?: string;
}

export interface DocumentSummary {
  id: string;
  title: string;
  preview: string;
  fieldCount: number;
  updatedAt: number;
}

// ── 변경 이벤트 타입 ──────────────────────────────────────────────────────────

export interface FriendlyPatchEvent {
  field: string;
  op: 'updated' | 'added' | 'removed';
  oldValue?: JsonValue;
  newValue?: JsonValue;
}

export type ChangeResponse =
  | {
      type: 'patch';
      database: string;
      collection: string;
      patch: FriendlyPatchEvent[];
      tracePath: string[];
    }
  | {
      type: 'replace';
      database: string;
      collection: string;
      data: Document[];
      tracePath: string[];
    }
  | {
      type: 'invalidate';
      database: string;
      collection: string;
      tracePath: string[];
    }
  | {
      type: 'system';
      message: string;
      tracePath: string[];
    };

// ── Mutation 요청 타입 ────────────────────────────────────────────────────────

interface MutateFieldSpec {
  path: string[];
  key: string;
  action: 'add' | 'edit' | 'delete';
  value?: JsonValue;
  nextKey?: string;
  containerType?: 'object' | 'array';
}

export type MockMutationRequest =
  | {
      type: 'createDatabase';
      database: {
        name: string;
        label: string;
        description: string;
        collections?: Record<
          string,
          {
            name: string;
            label: string;
            description: string;
            documents: Document[];
          }
        >;
      };
    }
  | {
      type: 'createCollection';
      database: string;
      collection: {
        name: string;
        label: string;
        description: string;
        documents?: Document[];
      };
    }
  | {
      type: 'renameCollection';
      database: string;
      oldName: string;
      newName: string;
      label: string;
    }
  | {
      type: 'deleteCollection';
      database: string;
      collection: string;
    }
  | {
      type: 'upsertDocument';
      database: string;
      collection: string;
      document: Document;
    }
  | {
      type: 'setCollectionTitleKey';
      database: string;
      collection: string;
      titleKey: string;
    }
  | {
      type: 'deleteDocument';
      database: string;
      collection: string;
      documentId: string;
    }
  | {
      type: 'mutateField';
      database: string;
      collection: string;
      documentId: string;
      field: MutateFieldSpec;
    }
  | {
      type: 'replaceSnapshot';
      snapshot: MockSnapshot;
    };

export interface MockMutationResult {
  status: 'ok';
  snapshot: MockSnapshot;
  changedPaths: string[];
  tracePath: string[];
  collectionKey?: string;
}

// ── 탐색 경로 (UI) ────────────────────────────────────────────────────────────

export type ColumnKind = 'collections' | 'documents' | 'json';

export interface ActivePathComp {
  id: number;
  direction: 1 | -1;
}

interface BaseActivePath {
  columnKind: ColumnKind;
  label: string;
  comp: ActivePathComp;
}

export interface NormalActivePath extends BaseActivePath {
  kind: 'normal';
  databaseName?: string;
  collectionName?: string;
  documentOid?: string;
  projectionPath?: string[];
}

export interface ReferenceActivePath extends BaseActivePath {
  kind: 'reference';
  columnKind: 'json';
  refOid: string;
  projectionPath: string[];
  chainColor: string;
  chainIndex: number;
}

export type ActivePath = NormalActivePath | ReferenceActivePath;

// ── Breadcrumb (UI) ───────────────────────────────────────────────────────────

export interface ExplorerPathSegment {
  key: string;
  label: string;
  kind: 'database' | 'collection' | 'document' | 'field';
  chainColor?: string;
}

// ── 연결 상태 ─────────────────────────────────────────────────────────────────

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
