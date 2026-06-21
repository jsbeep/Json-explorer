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
  type MockCollectionRecord,
  type MockMutationRequest,
  type MockMutationResult,
} from '../types/explorer';
import { cloneCollectionMap, cloneDocument } from './mockClone';
import {
  collectionKey,
  estimateCollectionSizeMb,
  findCollection,
  findDocument,
  getDatabaseSummary,
  getDocumentOid,
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
  }));
};

export const getDocuments = async (collectionId: string): Promise<DocumentSummary[]> => {
  const snapshot = getSnapshot();
  const location = findCollection(snapshot, collectionId);
  if (!location) {
    return rejectWith('Collection not found');
  }

  return location.collection.documents.map((document) => summarizeDocument(document, location.collection.updatedAt, location.collection.titleKey));
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
          documents: collection.documents.map((document) => ({
            ...cloneDocument(document),
            _id: { $oid: generateObjectId() },
          })),
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

      database.collections[op.collection.name] = {
        name: op.collection.name,
        label: op.collection.label,
        description: op.collection.description,
        documents: (op.collection.documents ?? []).map((document) => cloneDocument(document)),
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
        documents: source.documents.map((document) => ({
          ...cloneDocument(document),
          _id: { $oid: generateObjectId() },
        })),
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
    case 'upsertDocument': {
      const database = snapshot.databases[op.database];
      if (!database) {
        return rejectWith('DB not found');
      }

      const collection = database.collections[op.collection];
      if (!collection) {
        return rejectWith('Collection not found');
      }

      const documentOid = getDocumentOid(op.document);
      if (!documentOid) {
        return rejectWith('Document _id is required');
      }

      const clonedDocument = cloneDocument(op.document);
      const existingIndex = collection.documents.findIndex((candidate) => getDocumentOid(candidate) === documentOid);
      const oldDocument = existingIndex >= 0 ? cloneDocument(collection.documents[existingIndex]) : undefined;

      // changedPaths/패치 이벤트의 경로는 배열 index가 아니라 문서 oid로 식별한다 —
      // index는 같은 컬렉션 안에서도 추가/삭제로 흔들리는데, 이 경로는 UI에서
      // "정확히 이 문서가 바뀌었는지"를 비교하는 키로 쓰인다(예: 하이라이트).
      const changedPath = `documents.${documentOid}`;
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
        tracePath: [op.database, op.collection, documentOid],
      });

      return {
        status: 'ok',
        snapshot: getSnapshot(),
        changedPaths: [`databases.${op.database}.collections.${op.collection}.${changedPath}`],
        tracePath: [op.database, op.collection, documentOid],
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

      const source = collection.documents.find((candidate) => getDocumentOid(candidate) === op.documentId);
      if (!source) {
        return rejectWith('Document not found');
      }

      const newDocument = { ...cloneDocument(source), _id: { $oid: generateObjectId() } };
      const newOid = getDocumentOid(newDocument) ?? '';
      collection.documents.push(newDocument);

      updateCollectionTimestamps(snapshot, op.database, op.collection, now);
      setSnapshot(snapshot);
      emitChange(op.database, op.collection, {
        type: 'patch',
        database: op.database,
        collection: op.collection,
        patch: [toChangeEvent(`documents.${newOid}`, 'added', undefined, newDocument)],
        tracePath: [op.database, op.collection, newOid],
      });

      return {
        status: 'ok',
        snapshot: getSnapshot(),
        changedPaths: [`databases.${op.database}.collections.${op.collection}.documents.${newOid}`],
        tracePath: [op.database, op.collection, newOid],
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

      const index = collection.documents.findIndex((candidate) => getDocumentOid(candidate) === op.documentId);
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

      const documentIndex = collection.documents.findIndex((candidate) => getDocumentOid(candidate) === op.documentId);
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

// 프로젝션 없이 원본 전체 문서 반환 (로컬 JSON 탐색용)
export const getFullDocumentById = async (oid: string): Promise<Document> => {
  const snapshot = getSnapshot();
  const location = findDocument(snapshot, oid);
  if (!location) {
    return rejectWith('Document not found');
  }
  return cloneDocument(location.document);
};
