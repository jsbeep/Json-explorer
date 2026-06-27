// path: src/services/mockAPI.ts
//
// 이 파일은 mock 백엔드의 공개 API 표면(barrel)이다. 실제 구현은
// mockClone/mockQuery/mockMutate/mockEventBus로 나뉘어 있고, 여기서는
// 그것들을 조합해 기존과 동일한 8개 함수만 노출한다 — 외부 호출부는
// 전부 '../services/mockAPI'에서 이름으로 import하므로, 이 파일이
// export하는 이름/시그니처가 바뀌지 않는 한 호출부 수정은 필요 없다.
import { getSnapshot, setSnapshot } from './mockStorage';
import {
  isBsonObjectId,
  type CollectionSummary,
  type ConnectionConfig,
  type ConnectionResult,
  type DatabaseSummary,
  type Document,
  type DocumentSummary,
  type FriendlyPatchEvent,
  type JsonValue,
  type MockCollectionRecord,
  type MockMutationRequest,
  type MockMutationResult,
} from '../types/explorer';
import { cloneCollectionMap, cloneDocument, ensureDocumentId } from './mockClone';
import {
  collectionKey,
  estimateCollectionSizeMb,
  findCollection,
  findDocument,
  findDocumentById,
  findDocumentsByField,
  findFieldValueCandidates,
  getDatabaseSummary,
  getDocumentId,
  projectDocument,
  summarizeDocument,
} from './mockQuery';
import { mutateDocumentField, toChangeEvent, updateCollectionTimestamps } from './mockMutate';
import {
  emitChange,
  emitCollectionReplace,
  emitDatabaseCollections,
  emitDatabaseSnapshot,
} from './mockEventBus';
import { generateObjectId } from '../utils/objectId';

export { subscribeToChanges } from './mockEventBus';

const rejectWith = <T>(message: string): Promise<T> => Promise.reject(message);

// base가 비어있으면 그대로, 충돌하면 "base-copy", "base-copy-2", ... 중 첫 후보를 반환
const generateUniqueKey = (base: string, existing: Set<string>): string => {
  if (!existing.has(base)) return base;
  let candidate = `${base}-copy`;
  let i = 2;
  while (existing.has(candidate)) {
    candidate = `${base}-copy-${i}`;
    i += 1;
  }
  return candidate;
};

export const listDatabases = async (): Promise<DatabaseSummary[]> => {
  const snapshot = getSnapshot();
  return Object.entries(snapshot.databases).map(([name, database]) => getDatabaseSummary(name, database));
};

export const connect = async (config: ConnectionConfig): Promise<ConnectionResult> => {
  const snapshot = getSnapshot();
  const databases = Object.entries(snapshot.databases).map(([databaseName, database]) => getDatabaseSummary(databaseName, database));
  const activeDatabase = config.database && snapshot.databases[config.database] ? config.database : snapshot.activeDatabase;

  return {
    status: 'connected',
    connectedAt: Date.now(),
    activeDatabase,
    databases,
  };
};

export const getCollections = async (dbId: string): Promise<CollectionSummary[]> => {
  if (!dbId) {
    return rejectWith('DB not found');
  }

  const snapshot = getSnapshot();
  const database = snapshot.databases[dbId];
  if (!database) {
    return rejectWith('DB not found');
  }

  return Object.entries(database.collections).map(([, collection]) => ({
    name: collection.name,
    label: collection.label,
    description: collection.description,
    documentCount: collection.documents.length,
    sizeMb: estimateCollectionSizeMb(collection.documents),
    updatedAt: collection.updatedAt,
    titleKey: collection.titleKey,
    primaryKey: collection.primaryKey,
    referenceFields: collection.referenceFields,
    hasOidIds: collection.documents.some((d) => isBsonObjectId(d._id)),
    // (선언된 PK가 있으면 그 필드, 없으면 기본값 _id 기준) 식별값이 없는 문서가 하나라도 있는지
    hasPrimaryKeyGaps: collection.documents.some((d) => getDocumentId(d, collection.primaryKey) === undefined),
  }));
};

export const getDocuments = async (collectionId: string): Promise<DocumentSummary[]> => {
  const snapshot = getSnapshot();
  const location = findCollection(snapshot, collectionId);
  if (!location) {
    return rejectWith('Collection not found');
  }

  return location.collection.documents.map((document, index) =>
    summarizeDocument(document, location.collection.updatedAt, location.collection.titleKey, location.collection.primaryKey, index),
  );
};

export const mutateData = async (op: MockMutationRequest): Promise<MockMutationResult> => {
  const snapshot = cloneCollectionMap(getSnapshot());
  const now = Date.now();

  switch (op.type) {
    case 'createDatabase': {
      const collections: Record<string, MockCollectionRecord> = {};
      for (const [collectionName, collection] of Object.entries(op.database.collections ?? {})) {
        collections[collectionName] = {
          ...collection,
          documents: collection.documents.map((document) => cloneDocument(document)),
          updatedAt: now,
        };
      }

      snapshot.databases[op.database.name] = {
        name: op.database.name,
        label: op.database.label,
        description: op.database.description,
        collections,
        updatedAt: now,
      };
      snapshot.activeDatabase = op.database.name;
      snapshot.updatedAt = now;
      setSnapshot(snapshot);
      emitDatabaseCollections(op.database.name, snapshot.databases[op.database.name]);

      return {
        status: 'ok',
        snapshot: getSnapshot(),
        changedPaths: [`databases.${op.database.name}`],
        tracePath: [op.database.name],
      };
    }
    case 'renameDatabase': {
      const database = snapshot.databases[op.oldName];
      if (!database) {
        return rejectWith('DB not found');
      }

      if (op.newName !== op.oldName && snapshot.databases[op.newName]) {
        return rejectWith('Database name already exists');
      }

      delete snapshot.databases[op.oldName];
      snapshot.databases[op.newName] = {
        ...database,
        name: op.newName,
        label: op.label,
        updatedAt: now,
      };
      if (snapshot.activeDatabase === op.oldName) {
        snapshot.activeDatabase = op.newName;
      }
      snapshot.updatedAt = now;
      setSnapshot(snapshot);
      emitDatabaseCollections(op.newName, snapshot.databases[op.newName]);

      return {
        status: 'ok',
        snapshot: getSnapshot(),
        changedPaths: [`databases.${op.newName}`],
        tracePath: [op.newName],
      };
    }
    case 'duplicateDatabase': {
      const source = snapshot.databases[op.database];
      if (!source) {
        return rejectWith('DB not found');
      }

      const existingDbNames = new Set(Object.keys(snapshot.databases));
      const newDbName = generateUniqueKey(op.database, existingDbNames);

      const existingCollectionNames = new Set(
        Object.values(snapshot.databases).flatMap((db) => Object.keys(db.collections)),
      );
      const collections: Record<string, MockCollectionRecord> = {};
      for (const [collectionName, collection] of Object.entries(source.collections)) {
        const newCollectionName = generateUniqueKey(collectionName, existingCollectionNames);
        existingCollectionNames.add(newCollectionName);
        collections[newCollectionName] = {
          ...collection,
          name: newCollectionName,
          // oid는 전역에서 유니크해야 하므로 새로 생성 — plain _id(또는 없음)는 그대로 둔다
          // (FK 매칭은 컬렉션 단위라 충돌 걱정 없음)
          documents: collection.documents.map((document) => {
            const cloned = cloneDocument(document);
            if (isBsonObjectId(cloned._id)) cloned._id = { $oid: generateObjectId() };
            return cloned;
          }),
          updatedAt: now,
        };
      }

      snapshot.databases[newDbName] = {
        name: newDbName,
        label: `${source.label} Copy`,
        description: source.description,
        collections,
        updatedAt: now,
      };
      snapshot.activeDatabase = newDbName;
      snapshot.updatedAt = now;
      setSnapshot(snapshot);
      emitDatabaseCollections(newDbName, snapshot.databases[newDbName]);

      return {
        status: 'ok',
        snapshot: getSnapshot(),
        changedPaths: [`databases.${newDbName}`],
        tracePath: [newDbName],
      };
    }
    case 'deleteDatabase': {
      const database = snapshot.databases[op.database];
      if (!database) {
        return rejectWith('DB not found');
      }

      for (const collectionName of Object.keys(database.collections)) {
        emitChange(op.database, collectionName, {
          type: 'invalidate',
          database: op.database,
          collection: collectionName,
          tracePath: [op.database, collectionName],
        });
      }

      delete snapshot.databases[op.database];
      if (snapshot.activeDatabase === op.database) {
        snapshot.activeDatabase = Object.keys(snapshot.databases)[0] ?? '';
      }
      snapshot.updatedAt = now;
      setSnapshot(snapshot);

      return {
        status: 'ok',
        snapshot: getSnapshot(),
        changedPaths: [`databases.${op.database}`],
        tracePath: [op.database],
      };
    }
    case 'createCollection': {
      const database = snapshot.databases[op.database];
      if (!database) {
        return rejectWith('DB not found');
      }

      // 배치 안에 유효한 oid _id가 하나라도 있으면 누락된 문서는 oid로 통일하고,
      // 전부 없으면(진짜 plain JSON일 신호) 그대로 _id 없이 둔다
      const importedDocs = (op.collection.documents ?? []).map((document) => cloneDocument(document));
      const batchHasOid = importedDocs.some((d) => isBsonObjectId(d._id));
      database.collections[op.collection.name] = {
        name: op.collection.name,
        label: op.collection.label,
        description: op.collection.description,
        documents: importedDocs.map((document) => ensureDocumentId(document, batchHasOid)),
        updatedAt: now,
      };

      updateCollectionTimestamps(snapshot, op.database, op.collection.name, now);
      setSnapshot(snapshot);
      emitCollectionReplace(op.database, op.collection.name, database.collections[op.collection.name].documents);

      return {
        status: 'ok',
        snapshot: getSnapshot(),
        changedPaths: [`databases.${op.database}.collections.${op.collection.name}`],
        tracePath: [op.database, op.collection.name],
        collectionKey: collectionKey(op.database, op.collection.name),
      };
    }
    case 'renameCollection': {
      const database = snapshot.databases[op.database];
      if (!database) {
        return rejectWith('DB not found');
      }

      const collection = database.collections[op.oldName];
      if (!collection) {
        return rejectWith('Collection not found');
      }

      if (op.newName !== op.oldName && database.collections[op.newName]) {
        return rejectWith('Collection name already exists');
      }

      delete database.collections[op.oldName];
      database.collections[op.newName] = {
        ...collection,
        name: op.newName,
        label: op.label,
        updatedAt: now,
      };

      updateCollectionTimestamps(snapshot, op.database, op.newName, now);
      setSnapshot(snapshot);
      emitCollectionReplace(op.database, op.newName, database.collections[op.newName].documents);

      return {
        status: 'ok',
        snapshot: getSnapshot(),
        changedPaths: [`databases.${op.database}.collections.${op.newName}`],
        tracePath: [op.database, op.newName],
        collectionKey: collectionKey(op.database, op.newName),
      };
    }
    case 'duplicateCollection': {
      const database = snapshot.databases[op.database];
      if (!database) {
        return rejectWith('DB not found');
      }

      const source = database.collections[op.collection];
      if (!source) {
        return rejectWith('Collection not found');
      }

      const existingCollectionNames = new Set(
        Object.values(snapshot.databases).flatMap((db) => Object.keys(db.collections)),
      );
      const newCollectionName = generateUniqueKey(op.collection, existingCollectionNames);

      database.collections[newCollectionName] = {
        ...source,
        name: newCollectionName,
        label: `${source.label} Copy`,
        documents: source.documents.map((document) => {
          const cloned = cloneDocument(document);
          if (isBsonObjectId(cloned._id)) cloned._id = { $oid: generateObjectId() };
          return cloned;
        }),
        updatedAt: now,
      };

      updateCollectionTimestamps(snapshot, op.database, newCollectionName, now);
      setSnapshot(snapshot);
      emitCollectionReplace(op.database, newCollectionName, database.collections[newCollectionName].documents);

      return {
        status: 'ok',
        snapshot: getSnapshot(),
        changedPaths: [`databases.${op.database}.collections.${newCollectionName}`],
        tracePath: [op.database, newCollectionName],
        collectionKey: collectionKey(op.database, newCollectionName),
      };
    }
    case 'deleteCollection': {
      const database = snapshot.databases[op.database];
      if (!database) {
        return rejectWith('DB not found');
      }

      if (!database.collections[op.collection]) {
        return rejectWith('Collection not found');
      }

      delete database.collections[op.collection];
      database.updatedAt = now;
      snapshot.updatedAt = now;
      setSnapshot(snapshot);
      emitChange(op.database, op.collection, {
        type: 'invalidate',
        database: op.database,
        collection: op.collection,
        tracePath: [op.database, op.collection],
      });

      return {
        status: 'ok',
        snapshot: getSnapshot(),
        changedPaths: [`databases.${op.database}.collections`],
        tracePath: [op.database],
        collectionKey: collectionKey(op.database, op.collection),
      };
    }
    case 'setCollectionTitleKey': {
      const database = snapshot.databases[op.database];
      if (!database) {
        return rejectWith('DB not found');
      }

      const collection = database.collections[op.collection];
      if (!collection) {
        return rejectWith('Collection not found');
      }

      collection.titleKey = op.titleKey.trim() === '' ? undefined : op.titleKey.trim();
      updateCollectionTimestamps(snapshot, op.database, op.collection, now);
      setSnapshot(snapshot);
      emitCollectionReplace(op.database, op.collection, collection.documents);

      return {
        status: 'ok',
        snapshot: getSnapshot(),
        changedPaths: [`databases.${op.database}.collections.${op.collection}`],
        tracePath: [op.database, op.collection],
        collectionKey: collectionKey(op.database, op.collection),
      };
    }
    case 'setCollectionPrimaryKey': {
      const database = snapshot.databases[op.database];
      if (!database) {
        return rejectWith('DB not found');
      }

      const collection = database.collections[op.collection];
      if (!collection) {
        return rejectWith('Collection not found');
      }

      // oid 컬렉션 잠금은 UI에서만 막는다(titleKey와 동일한 신뢰 수준) — 핸들러는 검증하지 않음
      collection.primaryKey = op.primaryKey.trim() === '' ? undefined : op.primaryKey.trim();
      updateCollectionTimestamps(snapshot, op.database, op.collection, now);
      setSnapshot(snapshot);
      emitCollectionReplace(op.database, op.collection, collection.documents);

      return {
        status: 'ok',
        snapshot: getSnapshot(),
        changedPaths: [`databases.${op.database}.collections.${op.collection}`],
        tracePath: [op.database, op.collection],
        collectionKey: collectionKey(op.database, op.collection),
      };
    }
    case 'setCollectionReferenceField': {
      const database = snapshot.databases[op.database];
      if (!database) {
        return rejectWith('DB not found');
      }

      const collection = database.collections[op.collection];
      if (!collection) {
        return rejectWith('Collection not found');
      }

      if (!op.targetCollection || !op.targetKey) {
        if (collection.referenceFields) {
          delete collection.referenceFields[op.field];
        }
      } else {
        collection.referenceFields = {
          ...collection.referenceFields,
          [op.field]: { targetCollection: op.targetCollection, targetKey: op.targetKey },
        };
      }

      updateCollectionTimestamps(snapshot, op.database, op.collection, now);
      setSnapshot(snapshot);
      emitCollectionReplace(op.database, op.collection, collection.documents);

      return {
        status: 'ok',
        snapshot: getSnapshot(),
        changedPaths: [`databases.${op.database}.collections.${op.collection}`],
        tracePath: [op.database, op.collection],
        collectionKey: collectionKey(op.database, op.collection),
      };
    }
    case 'upsertDocument': {
      const database = snapshot.databases[op.database];
      if (!database) {
        return rejectWith('DB not found');
      }

      const collection = database.collections[op.collection];
      if (!collection) {
        return rejectWith('Collection not found');
      }

      const hasOidSibling = collection.documents.some((d) => isBsonObjectId(d._id));
      const clonedDocument = cloneDocument(ensureDocumentId(op.document, hasOidSibling));
      // 새 문서면 push될 자리(현재 길이)를 잠정 인덱스로 써서 id를 미리 구한다 —
      // _id/PK가 둘 다 없을 때만 의미 있고(인덱스 fallback), 그 외엔 무관하다
      const provisionalIndex = collection.documents.length;
      const documentId = getDocumentId(clonedDocument, collection.primaryKey, provisionalIndex) ?? '';
      const existingIndex = collection.documents.findIndex((candidate, i) => getDocumentId(candidate, collection.primaryKey, i) === documentId);
      const oldDocument = existingIndex >= 0 ? cloneDocument(collection.documents[existingIndex]) : undefined;

      // changedPaths/패치 이벤트의 경로는 배열 index가 아니라 문서 id로 식별한다 —
      // index는 같은 컬렉션 안에서도 추가/삭제로 흔들리는데, 이 경로는 UI에서
      // "정확히 이 문서가 바뀌었는지"를 비교하는 키로 쓰인다(예: 하이라이트).
      const changedPath = `documents.${documentId}`;
      let changeEvent: FriendlyPatchEvent;
      if (existingIndex >= 0) {
        collection.documents[existingIndex] = clonedDocument;
        changeEvent = toChangeEvent(changedPath, 'updated', oldDocument, clonedDocument);
      } else {
        collection.documents.push(clonedDocument);
        changeEvent = toChangeEvent(changedPath, 'added', undefined, clonedDocument);
      }

      updateCollectionTimestamps(snapshot, op.database, op.collection, now);
      setSnapshot(snapshot);
      emitChange(op.database, op.collection, {
        type: 'patch',
        database: op.database,
        collection: op.collection,
        patch: [changeEvent],
        tracePath: [op.database, op.collection, documentId],
      });

      return {
        status: 'ok',
        snapshot: getSnapshot(),
        changedPaths: [`databases.${op.database}.collections.${op.collection}.${changedPath}`],
        tracePath: [op.database, op.collection, documentId],
        collectionKey: collectionKey(op.database, op.collection),
      };
    }
    case 'duplicateDocument': {
      const database = snapshot.databases[op.database];
      if (!database) {
        return rejectWith('DB not found');
      }

      const collection = database.collections[op.collection];
      if (!collection) {
        return rejectWith('Collection not found');
      }

      const source = collection.documents.find((candidate, i) => getDocumentId(candidate, collection.primaryKey, i) === op.documentId);
      if (!source) {
        return rejectWith('Document not found');
      }

      // _id 모양을 보존한다 — oid면 새 oid, plain string/number면 그 컬렉션 안에서
      // 유니크한 변형("u1" → "u1-copy")을 생성한다(컬렉션/DB 이름 충돌 회피와 같은 패턴).
      // 원본에 _id가 통째로 없었으면(plain raw 문서) 복제본도 그대로 둔다 — 인덱스
      // fallback으로 식별이 계속 가능하다.
      const newDocument = cloneDocument(source);
      if (isBsonObjectId(source._id)) {
        newDocument._id = { $oid: generateObjectId() };
      } else if (typeof source._id === 'string' || typeof source._id === 'number') {
        const existingIds = new Set(collection.documents.map((d, i) => getDocumentId(d, collection.primaryKey, i) ?? ''));
        newDocument._id = generateUniqueKey(String(source._id), existingIds);
      }

      // 화면에 표시되는 이름(titleKey 우선, 없으면 name/title, 그것도 없으면 PK 필드)
      // 뒤에 "copy"를 붙여 목록에서 원본과 복제본을 구분할 수 있게 한다 —
      // summarizeDocument의 title 결정 순서(titleKey → name/title → PK)와 동일하게 맞춤.
      const titleField = collection.titleKey && typeof source[collection.titleKey] === 'string' && (source[collection.titleKey] as string).trim()
        ? collection.titleKey
        : typeof source.name === 'string' && (source.name as string).trim()
        ? 'name'
        : typeof source.title === 'string' && (source.title as string).trim()
        ? 'title'
        : collection.primaryKey && typeof source[collection.primaryKey] === 'string' && (source[collection.primaryKey] as string).trim()
        ? collection.primaryKey
        : undefined;

      if (titleField) {
        newDocument[titleField] = `${newDocument[titleField] as string} copy`;
      }

      const provisionalIndex = collection.documents.length;
      const newDocId = getDocumentId(newDocument, collection.primaryKey, provisionalIndex) ?? '';
      collection.documents.push(newDocument);

      updateCollectionTimestamps(snapshot, op.database, op.collection, now);
      setSnapshot(snapshot);
      emitChange(op.database, op.collection, {
        type: 'patch',
        database: op.database,
        collection: op.collection,
        patch: [toChangeEvent(`documents.${newDocId}`, 'added', undefined, newDocument)],
        tracePath: [op.database, op.collection, newDocId],
      });

      return {
        status: 'ok',
        snapshot: getSnapshot(),
        changedPaths: [`databases.${op.database}.collections.${op.collection}.documents.${newDocId}`],
        tracePath: [op.database, op.collection, newDocId],
        collectionKey: collectionKey(op.database, op.collection),
      };
    }
    case 'deleteDocument': {
      const database = snapshot.databases[op.database];
      if (!database) {
        return rejectWith('DB not found');
      }

      const collection = database.collections[op.collection];
      if (!collection) {
        return rejectWith('Collection not found');
      }

      const index = collection.documents.findIndex((candidate, i) => getDocumentId(candidate, collection.primaryKey, i) === op.documentId);
      if (index < 0) {
        return rejectWith('Document not found');
      }

      const [removedDocument] = collection.documents.splice(index, 1);
      updateCollectionTimestamps(snapshot, op.database, op.collection, now);
      setSnapshot(snapshot);
      emitChange(op.database, op.collection, {
        type: 'patch',
        database: op.database,
        collection: op.collection,
        patch: [toChangeEvent(`documents.${op.documentId}`, 'removed', removedDocument, undefined)],
        tracePath: [op.database, op.collection, op.documentId],
      });

      return {
        status: 'ok',
        snapshot: getSnapshot(),
        changedPaths: [`databases.${op.database}.collections.${op.collection}.documents.${op.documentId}`],
        tracePath: [op.database, op.collection, op.documentId],
        collectionKey: collectionKey(op.database, op.collection),
      };
    }
    case 'mutateField': {
      const database = snapshot.databases[op.database];
      if (!database) {
        return rejectWith('DB not found');
      }

      const collection = database.collections[op.collection];
      if (!collection) {
        return rejectWith('Collection not found');
      }

      const documentIndex = collection.documents.findIndex((candidate, i) => getDocumentId(candidate, collection.primaryKey, i) === op.documentId);
      if (documentIndex < 0) {
        return rejectWith('Document not found');
      }

      const clonedDocument = cloneDocument(collection.documents[documentIndex]);
      const mutation = mutateDocumentField(clonedDocument, op.field);
      collection.documents[documentIndex] = clonedDocument;
      updateCollectionTimestamps(snapshot, op.database, op.collection, now);
      setSnapshot(snapshot);
      emitChange(op.database, op.collection, {
        type: 'patch',
        database: op.database,
        collection: op.collection,
        patch: mutation.patch,
        tracePath: [op.database, op.collection, op.documentId, ...op.field.path, op.field.key],
      });

      return {
        status: 'ok',
        snapshot: getSnapshot(),
        changedPaths: mutation.changedPaths.map((path) => `databases.${op.database}.collections.${op.collection}.documents.${op.documentId}.${path}`),
        tracePath: [op.database, op.collection, op.documentId, ...op.field.path, op.field.key],
        collectionKey: collectionKey(op.database, op.collection),
      };
    }
    case 'replaceSnapshot': {
      setSnapshot(op.snapshot);
      emitDatabaseSnapshot(op.snapshot);

      return {
        status: 'ok',
        snapshot: getSnapshot(),
        changedPaths: ['snapshot'],
        tracePath: [op.snapshot.activeDatabase],
      };
    }
    default: {
      return rejectWith('Unsupported mutation');
    }
  }
};

export const checkReference = async (oid: string): Promise<boolean> => {
  const snapshot = getSnapshot();
  for (const database of Object.values(snapshot.databases)) {
    for (const collection of Object.values(database.collections)) {
      for (const document of collection.documents) {
        if (isBsonObjectId(document._id) && document._id.$oid === oid) {
          return true;
        }
      }
    }
  }

  return false;
};

export interface ReferenceInfo {
  databaseName: string;
  collectionName: string;
  collectionLabel: string;
  documentTitle: string;
}

export const getReferenceInfo = async (oid: string): Promise<ReferenceInfo | null> => {
  const snapshot = getSnapshot();
  const location = findDocument(snapshot, oid);
  if (!location) {
    return null;
  }

  const summary = summarizeDocument(location.document, location.collection.updatedAt);
  return {
    databaseName: location.databaseName,
    collectionName: location.collectionName,
    collectionLabel: location.collection.label,
    documentTitle: summary.title,
  };
};

export interface FieldReferenceCandidate {
  database: string;
  collection: string;
  documentId: string;
  documentTitle: string;
}

// 필드 기반 참조(FK) — 타겟 컬렉션이 이미 선언으로 고정돼 있으므로 그 안에서만 찾고,
// PK 유니크를 강제하지 않으므로 매치를 전부 후보로 반환한다(숨기지 않음 — 호출부가
// 1개면 바로 이동, 여러 개면 사용자에게 골라달라고 보여준다).
export const getReferenceCandidatesByField = async (
  database: string,
  collection: string,
  key: string,
  value: JsonValue,
): Promise<FieldReferenceCandidate[]> => {
  const snapshot = getSnapshot();
  const locations = findDocumentsByField(snapshot, database, collection, key, value);
  return locations.map((location) => {
    const summary = summarizeDocument(location.document, location.collection.updatedAt, location.collection.titleKey, location.collection.primaryKey, location.documentIndex);
    return {
      database: location.databaseName,
      collection: location.collectionName,
      documentId: getDocumentId(location.document, location.collection.primaryKey, location.documentIndex) ?? '',
      documentTitle: summary.title,
    };
  });
};

// FK 값 입력 보조용(InlineSegmentEditor 자동완성) — 타겟 컬렉션의 targetKey 필드가
// 가질 수 있는 값 후보 목록
export const getFieldValueCandidates = async (
  database: string,
  collection: string,
  key: string,
): Promise<{ value: JsonValue; title: string }[]> => {
  const snapshot = getSnapshot();
  return findFieldValueCandidates(snapshot, database, collection, key);
};

export const getDocumentById = async (oid: string, projectionPath?: string[]): Promise<Document> => {
  const snapshot = getSnapshot();
  const location = findDocument(snapshot, oid);
  if (!location) {
    return rejectWith('Document not found');
  }

  if (!projectionPath || projectionPath.length === 0) {
    return projectDocument(location.document);
  }

  return projectDocument(location.document, projectionPath);
};

// 프로젝션 없이 원본 전체 문서 반환 (로컬 JSON 탐색용) — 전역 $oid REF 전용, oid 없이는 못 찾음
export const getFullDocumentById = async (oid: string): Promise<Document> => {
  const snapshot = getSnapshot();
  const location = findDocument(snapshot, oid);
  if (!location) {
    return rejectWith('Document not found');
  }
  return cloneDocument(location.document);
};

// 컬렉션이 이미 정해진 상태(현재 보고 있는 문서 열기/새로고침)에서 쓰는 일반화 버전 —
// _id가 oid든 plain string/number든 그 컬렉션 안에서 찾는다
export const getFullDocumentByIdInCollection = async (database: string, collection: string, documentId: string): Promise<Document> => {
  const snapshot = getSnapshot();
  const location = findDocumentById(snapshot, database, collection, documentId);
  if (!location) {
    return rejectWith('Document not found');
  }
  return cloneDocument(location.document);
};
