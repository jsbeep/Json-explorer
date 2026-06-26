// path: src/services/mockQuery.ts
import {
  isBsonObjectId,
  isPlainObject,
  type DatabaseSummary,
  type Document,
  type DocumentSummary,
  type JsonObject,
  type JsonValue,
  type MockCollectionRecord,
  type MockDatabaseRecord,
  type MockSnapshot,
} from '../types/explorer';
import { isJsonObject } from './mockClone';

export type CollectionLocation = {
  databaseName: string;
  collectionName: string;
  collection: MockCollectionRecord;
};

export type DocumentLocation = CollectionLocation & {
  documentIndex: number;
  document: Document;
};

export const collectionKey = (databaseName: string, collectionName: string): string => `${databaseName}.${collectionName}`;

export const getDatabaseSummary = (databaseName: string, database: MockDatabaseRecord): DatabaseSummary => {
  let documentCount = 0;
  for (const collection of Object.values(database.collections)) {
    documentCount += collection.documents.length;
  }

  return {
    name: databaseName,
    label: database.label,
    description: database.description,
    collectionCount: Object.keys(database.collections).length,
    documentCount,
    updatedAt: database.updatedAt,
  };
};

export const estimateCollectionSizeMb = (
  documents: Document[],
): number =>
  Number(
    Math.max(
      0.01,
      new Blob([JSON.stringify(documents)]).size / 1_000_000,
    ).toFixed(2),
  );

const summarizePreviewValue = (value: JsonValue): string => {
  if (value === null) {
    return 'null';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    return `[${value.length}]`;
  }

  if (isBsonObjectId(value)) {
    return `ObjectId(${value.$oid.slice(-8)})`;
  }

  if (isPlainObject(value) && typeof value.$ref === 'string' && isBsonObjectId(value.$id)) {
    return `DBRef(${value.$ref}:${value.$id.$oid.slice(-8)})`;
  }

  return '{...}';
};

export const summarizeDocument = (
  document: Document,
  updatedAt: number,
  titleKey?: string,
  primaryKey?: string,
  index?: number,
): DocumentSummary => {
  const id = getDocumentId(document, primaryKey, index);
  // 인덱스 fallback 토큰은 사용자에게 보여줄 의미가 없으니 표시용으로는 없는 셈 취급
  const displayableId = id && !id.startsWith(INDEX_FALLBACK_PREFIX) ? id : undefined;
  let title = displayableId ? (isBsonObjectId(document._id) ? displayableId.slice(-8) : displayableId) : '[document]';

  if (titleKey) {
    const candidate = document[titleKey];
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      title = candidate;
    }
  } else {
    const nameCandidate = document.name;
    const titleCandidate = document.title;
    if (typeof nameCandidate === 'string' && nameCandidate.trim().length > 0) {
      title = nameCandidate;
    } else if (typeof titleCandidate === 'string' && titleCandidate.trim().length > 0) {
      title = titleCandidate;
    }
  }

  const previewParts: string[] = [];
  for (const [key, value] of Object.entries(document).slice(0, 2)) {
    previewParts.push(`${key}: ${summarizePreviewValue(value as JsonValue)}`);
  }

  return {
    id: id ?? '',
    title,
    preview: previewParts.join(', '),
    fieldCount: Object.keys(document).length,
    updatedAt,
  };
};

export const findCollection = (snapshot: MockSnapshot, targetCollectionId: string): CollectionLocation | undefined => {
  for (const [databaseName, database] of Object.entries(snapshot.databases)) {
    for (const [collectionName, collection] of Object.entries(database.collections)) {
      if (targetCollectionId === collectionName || targetCollectionId === collectionKey(databaseName, collectionName)) {
        return {
          databaseName,
          collectionName,
          collection,
        };
      }
    }
  }

  return undefined;
};

export const findDocument = (snapshot: MockSnapshot, oid: string): DocumentLocation | undefined => {
  for (const [databaseName, database] of Object.entries(snapshot.databases)) {
    for (const [collectionName, collection] of Object.entries(database.collections)) {
      for (let documentIndex = 0; documentIndex < collection.documents.length; documentIndex += 1) {
        const document = collection.documents[documentIndex];
        if (isBsonObjectId(document._id) && document._id.$oid === oid) {
          return {
            databaseName,
            collectionName,
            collection,
            documentIndex,
            document,
          };
        }
      }
    }
  }

  return undefined;
};

// 문서 identity — plain string/number _id도 식별자로 인정한다(전역 $oid REF 시스템인
// findDocument/checkReference는 oid만 보도록 별도로 inline 비교를 쓰고 이 함수에 의존하지 않는다).
// mutate/delete/duplicate/upsert 같은 "문서 자체를 가리키는" 경로에서 쓴다.
//
// _id가 없으면 컬렉션에 선언된 primaryKey 필드의 값을 식별자로 쓰고, 그 값도 없으면
// (식별자가 정말 하나도 없는 raw plain 문서) 배열 인덱스로 fallback한다 — plain JSON을
// 그대로 두고 싶다는 게 이 앱의 목표라, _id/PK가 없다고 강제로 뭔가를 채워 넣지 않는다.
export const INDEX_FALLBACK_PREFIX = '__idx_';

export const getDocumentId = (document: Document, primaryKey?: string, fallbackIndex?: number): string | undefined => {
  if (isBsonObjectId(document._id)) return document._id.$oid;
  if (typeof document._id === 'string' || typeof document._id === 'number') return String(document._id);
  if (primaryKey) {
    const candidate = document[primaryKey];
    if (typeof candidate === 'string' || typeof candidate === 'number') return String(candidate);
  }
  if (fallbackIndex !== undefined) return `${INDEX_FALLBACK_PREFIX}${fallbackIndex}`;
  return undefined;
};

export const findDocumentById = (
  snapshot: MockSnapshot,
  databaseName: string,
  collectionName: string,
  documentId: string,
): DocumentLocation | undefined => {
  const collection = snapshot.databases[databaseName]?.collections[collectionName];
  if (!collection) {
    return undefined;
  }

  for (let documentIndex = 0; documentIndex < collection.documents.length; documentIndex += 1) {
    const document = collection.documents[documentIndex];
    if (getDocumentId(document, collection.primaryKey, documentIndex) === documentId) {
      return { databaseName, collectionName, collection, documentIndex, document };
    }
  }

  return undefined;
};

// FK 값 입력 보조용 — 타겟 컬렉션의 targetKey 필드가 가질 수 있는 값 후보 목록
// (key가 '_id'면 oid든 plain이든 getDocumentId로, 그 외엔 그 필드의 원시값으로)
export const findFieldValueCandidates = (
  snapshot: MockSnapshot,
  databaseName: string,
  collectionName: string,
  key: string,
): { value: JsonValue; title: string }[] => {
  const collection = snapshot.databases[databaseName]?.collections[collectionName];
  if (!collection) {
    return [];
  }

  const candidates: { value: JsonValue; title: string }[] = [];
  for (let index = 0; index < collection.documents.length; index += 1) {
    const document = collection.documents[index];
    const value = key === '_id' ? (getDocumentId(document, collection.primaryKey, index) ?? null) : document[key];
    if (value === undefined || value === null || value === '') continue;
    const summary = summarizeDocument(document, collection.updatedAt, collection.titleKey, collection.primaryKey, index);
    candidates.push({ value: value as JsonValue, title: summary.title });
  }
  return candidates;
};

// 필드 기반 참조(FK) 조회 — findDocument(oid 전역 검색)와 달리 DB/컬렉션이 이미 선언으로
// 고정돼 있고, PK 유니크를 강제하지 않으므로 매치를 전부 모아 반환한다(중복 시 후보로 노출).
export const findDocumentsByField = (
  snapshot: MockSnapshot,
  databaseName: string,
  collectionName: string,
  key: string,
  value: JsonValue,
): DocumentLocation[] => {
  const collection = snapshot.databases[databaseName]?.collections[collectionName];
  if (!collection) {
    return [];
  }

  const matches: DocumentLocation[] = [];
  for (let documentIndex = 0; documentIndex < collection.documents.length; documentIndex += 1) {
    const document = collection.documents[documentIndex];
    const candidate = key === '_id' ? getDocumentId(document, collection.primaryKey, documentIndex) : document[key];
    if (candidate === value) {
      matches.push({ databaseName, collectionName, collection, documentIndex, document });
    }
  }

  return matches;
};

const previewValue = (value: JsonValue): JsonValue => {
  if (value === null) {
    return null;
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    return [];
  }

  return {};
};

const shallowDocument = (document: Document): Document => {
  const preview: JsonObject = {};
  for (const [key, value] of Object.entries(document)) {
    preview[key] = previewValue(value as JsonValue);
  }
  return preview as Document;
};

const projectValue = (value: JsonValue, path: string[]): JsonValue => {
  if (path.length === 0) {
    return previewValue(value);
  }

  const [segment, ...rest] = path;

  if (Array.isArray(value)) {
    const index = Number(segment);
    if (!Number.isInteger(index) || index < 0 || index >= value.length) {
      throw new Error('Projection path not found');
    }

    return [projectValue(value[index], rest)];
  }

  if (!isJsonObject(value)) {
    throw new Error('Projection path not found');
  }

  const objectValue: JsonObject = value;
  if (!(segment in objectValue)) {
    throw new Error('Projection path not found');
  }

  const nextValue = objectValue[segment];
  const projected: JsonObject = {
    [segment]: projectValue(nextValue, rest),
  };

  return projected;
};

export const projectDocument = (document: Document, projectionPath?: string[]): Document => {
  if (!projectionPath || projectionPath.length === 0) {
    return shallowDocument(document);
  }

  return projectValue(document, projectionPath) as Document;
};
