// ── BSON / MongoDB 특수 타입 ──────────────────────────────────────────────────

export interface BsonObjectId {
  $oid: string;
}

export interface DBRef {
  $ref: string;
  $id: BsonObjectId;
  $db: string;
}

// Relaxed EJSON wrapper 형태 — canonical(예: {"$date":{"$numberLong":"..."}}) 대신
// 사람이 읽고 편집하기 쉬운 단일 문자열 값으로 둔다(이 앱은 spec-perfect BSON 툴이 아니라
// JSON 탐색기에 EJSON 시야를 곁들이는 뷰어이므로).
export interface BsonDate { $date: string }
export interface BsonDecimal128 { $numberDecimal: string }
export interface BsonLong { $numberLong: string }

export const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const isBsonObjectId = (value: unknown): value is BsonObjectId =>
  isPlainObject(value) &&
  Object.keys(value).length === 1 &&
  typeof value.$oid === 'string';

export const isBsonDate = (value: unknown): value is BsonDate =>
  isPlainObject(value) &&
  Object.keys(value).length === 1 &&
  typeof value.$date === 'string';

export const isBsonDecimal128 = (value: unknown): value is BsonDecimal128 =>
  isPlainObject(value) &&
  Object.keys(value).length === 1 &&
  typeof value.$numberDecimal === 'string';

export const isBsonLong = (value: unknown): value is BsonLong =>
  isPlainObject(value) &&
  Object.keys(value).length === 1 &&
  typeof value.$numberLong === 'string';

// ── JSON 원자 타입 ────────────────────────────────────────────────────────────

export type JsonPrimitive = string | number | boolean | null;
// BsonObjectId, DBRef, EJSON 확장 타입 wrapper를 명시적으로 포함해 document 필드 값으로 허용
export type JsonValue =
  | JsonPrimitive
  | JsonObject
  | JsonValue[]
  | BsonObjectId
  | DBRef
  | BsonDate
  | BsonDecimal128
  | BsonLong;
export interface JsonObject {
  [key: string]: JsonValue;
}

// _id는 옵션 — plain JSON 문서는 _id가 통째로 없을 수 있다(처음엔 그냥 raw JSON으로
// 두고, PK를 선언하면 그 필드 값이 식별자 역할을 한다. 둘 다 없으면 배열 인덱스로 fallback)
export type Document = JsonObject & { _id?: BsonObjectId | string | number };

// ── Mock Storage 구조 ─────────────────────────────────────────────────────────

export interface MockCollectionRecord {
  name: string;
  label: string;
  description: string;
  documents: Document[];
  updatedAt: number;
  // DocumentsColumn 목록에 표시할 제목으로 쓸 필드 키 (미지정 시 name → title → OID 순)
  titleKey?: string;
  // 이 컬렉션의 기본 키 필드 (문서에 _id.$oid가 있으면 UI에서 '_id'로 잠김)
  primaryKey?: string;
  // 필드 단위 참조(FK) 선언: 필드 키 → 가리키는 컬렉션/키
  referenceFields?: Record<string, { targetCollection: string; targetKey: string }>;
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
  primaryKey?: string;
  referenceFields?: Record<string, { targetCollection: string; targetKey: string }>;
  // 문서 중 하나라도 _id가 $oid 모양이면 true — PK 버튼 잠금(=_id) 판정에 사용
  hasOidIds?: boolean;
  // 문서 중 하나라도 (선언된 PK 또는 기본값 _id) 필드가 없으면 true — PK 버튼 경고 표시에 사용
  hasPrimaryKeyGaps?: boolean;
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
            // 샘플 DB는 제목 필드/PK/참조 선언까지 미리 갖춘 상태로 들어온다 —
            // 특히 JSON 샘플은 referenceFields가 없으면 스레드가 이어지지 않는다
            titleKey?: string;
            primaryKey?: string;
            referenceFields?: Record<string, { targetCollection: string; targetKey: string }>;
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
      type: 'renameDatabase';
      oldName: string;
      newName: string;
      label: string;
    }
  | {
      type: 'duplicateDatabase';
      database: string;
    }
  | {
      type: 'deleteDatabase';
      database: string;
    }
  | {
      type: 'duplicateCollection';
      database: string;
      collection: string;
    }
  | {
      type: 'duplicateDocument';
      database: string;
      collection: string;
      documentId: string;
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
      // _id 없이 들어와도 됨 — 핸들러가 ensureDocumentId로 채워준다
      document: JsonObject;
    }
  | {
      type: 'setCollectionTitleKey';
      database: string;
      collection: string;
      titleKey: string;
    }
  | {
      type: 'setCollectionPrimaryKey';
      database: string;
      collection: string;
      primaryKey: string;
    }
  | {
      type: 'setCollectionReferenceField';
      database: string;
      collection: string;
      field: string;
      targetCollection?: string;
      targetKey?: string;
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

export type RefLocator =
  | { kind: 'oid'; oid: string }
  | { kind: 'field'; database: string; collection: string; key: string; value: JsonValue };

export interface ReferenceActivePath extends BaseActivePath {
  kind: 'reference';
  columnKind: 'json';
  ref: RefLocator;
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
