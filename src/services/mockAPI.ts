// path: src/services/mockAPI.ts
import { getSnapshot, setSnapshot } from './mockStorage';
import type {
  ChangeResponse,
  CollectionSummary,
  ConnectionConfig,
  ConnectionResult,
  MockCollectionRecord,
  MockDatabaseRecord,
  DatabaseSummary,
  Document,
  DocumentSummary,
  FriendlyPatchEvent,
  JsonObject,
  JsonValue,
  MockMutationRequest,
  MockMutationResult,
  MockSnapshot,
} from '../types/explorer';

const delay = (ms?: number): Promise<void> =>
  new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms ?? 50 + Math.random() * 50);
  });

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isBsonObjectId = (value: unknown): value is { $oid: string } =>
  isPlainObject(value) && Object.keys(value).length === 1 && typeof value.$oid === 'string';

const isJsonObject = (value: unknown): value is JsonObject => isPlainObject(value) && !isBsonObjectId(value);

const cloneValue = (value: JsonValue): JsonValue => {
  if (Array.isArray(value)) {
    return value.map((item) => cloneValue(item));
  }

  if (isJsonObject(value)) {
    const next: JsonObject = {};
    for (const [key, child] of Object.entries(value)) {
      next[key] = cloneValue(child as JsonValue);
    }
    return next;
  }

  return value;
};

const cloneDocument = (document: Document): Document => cloneValue(document) as Document;

const cloneCollectionMap = (snapshot: MockSnapshot): MockSnapshot => {
  const databases: Record<string, MockDatabaseRecord> = {};
  for (const [databaseName, database] of Object.entries(snapshot.databases)) {
    const collections: Record<string, MockCollectionRecord> = {};
    for (const [collectionName, collection] of Object.entries(database.collections)) {
      collections[collectionName] = {
        ...collection,
        documents: collection.documents.map((document) => cloneDocument(document)),
      };
    }

    databases[databaseName] = {
      ...database,
      collections,
    };
  }

  return {
    ...snapshot,
    databases,
  };
};

type CollectionLocation = {
  databaseName: string;
  collectionName: string;
  collection: MockCollectionRecord;
};

type DocumentLocation = CollectionLocation & {
  documentIndex: number;
  document: Document;
};

type ChangeListener = (change: ChangeResponse) => void;

const listeners = new Map<string, Set<ChangeListener>>();

const rejectWith = <T>(message: string): Promise<T> => Promise.reject(message);

const collectionKey = (databaseName: string, collectionName: string): string => `${databaseName}.${collectionName}`;

const uniqueStrings = (values: string[]): string[] => [...new Set(values)];

const getDatabaseSummary = (databaseName: string, database: MockDatabaseRecord): DatabaseSummary => {
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

const estimateCollectionSizeMb = (documents: Document[]): number =>
  Number(Math.max(0.01, JSON.stringify(documents).length / 15_000).toFixed(2));

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

const summarizeDocument = (document: Document, updatedAt: number, titleKey?: string): DocumentSummary => {
  const oid = isBsonObjectId(document._id) ? document._id.$oid : undefined;
  let title = oid ? oid.slice(-8) : '[document]';

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
    id: oid ?? '',
    title,
    preview: previewParts.join(', '),
    fieldCount: Object.keys(document).length,
    updatedAt,
  };
};

const findCollection = (snapshot: MockSnapshot, targetCollectionId: string): CollectionLocation | undefined => {
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

const findDocument = (snapshot: MockSnapshot, oid: string): DocumentLocation | undefined => {
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

const getDocumentOid = (document: Document): string | undefined => (isBsonObjectId(document._id) ? document._id.$oid : undefined);

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

const projectDocument = (document: Document, projectionPath?: string[]): Document => {
  if (!projectionPath || projectionPath.length === 0) {
    return shallowDocument(document);
  }

  return projectValue(document, projectionPath) as Document;
};

const normalizePath = (path: string[]): string => path.filter((segment) => segment.length > 0).join('.');

const emitChange = (databaseName: string, collectionName: string, change: ChangeResponse): void => {
  for (const key of uniqueStrings([collectionName, collectionKey(databaseName, collectionName)])) {
    const registered = listeners.get(key);
    if (!registered) {
      continue;
    }

    for (const listener of [...registered]) {
      try {
        listener(change);
      } catch {
        // Subscriber errors should not break the mock bus.
      }
    }
  }
};

const emitCollectionReplace = (databaseName: string, collectionName: string, documents: Document[]): void => {
  emitChange(databaseName, collectionName, {
    type: 'replace',
    database: databaseName,
    collection: collectionName,
    data: documents.map((document) => cloneDocument(document)),
    tracePath: [databaseName, collectionName],
  });
};

const emitDatabaseSnapshot = (snapshot: MockSnapshot): void => {
  for (const [databaseName, database] of Object.entries(snapshot.databases)) {
    for (const [collectionName, collection] of Object.entries(database.collections)) {
      emitCollectionReplace(databaseName, collectionName, collection.documents);
    }
  }
};

const emitDatabaseCollections = (databaseName: string, database: MockDatabaseRecord): void => {
  for (const [collectionName, collection] of Object.entries(database.collections)) {
    emitCollectionReplace(databaseName, collectionName, collection.documents);
  }
};

const resolveMutableContainer = (document: Document, path: string[]): JsonValue | undefined => {
  let current: JsonValue = document;
  for (const segment of path) {
    if (Array.isArray(current)) {
      const index = Number(segment);
      if (!Number.isInteger(index) || index < 0 || index >= current.length) {
        return undefined;
      }
      current = current[index];
      continue;
    }

    if (!isJsonObject(current) || !(segment in current)) {
      return undefined;
    }

    const objectCurrent: JsonObject = current;
    current = objectCurrent[segment];
  }

  return current;
};

const getMutationPath = (basePath: string[], key: string): string => normalizePath([...basePath, key]);

const toChangeEvent = (
  fieldPath: string,
  op: FriendlyPatchEvent['op'],
  oldValue: JsonValue | undefined,
  newValue: JsonValue | undefined,
): FriendlyPatchEvent => ({
  field: fieldPath,
  op,
  oldValue,
  newValue,
});

const mutateObjectField = (
  document: Document,
  field: Extract<MockMutationRequest, { type: 'mutateField' }>['field'],
): { document: Document; changedPaths: string[]; patch: FriendlyPatchEvent[] } => {
  const target = resolveMutableContainer(document, field.path);
  if (!isJsonObject(target)) {
    throw new Error('Invalid mutate path');
  }

  const targetObject: JsonObject = target;

  const fieldPath = getMutationPath(field.path, field.key);
  const patch: FriendlyPatchEvent[] = [];

  switch (field.action) {
    case 'add': {
      const nextValue = cloneValue(field.value ?? null);
      targetObject[field.key] = nextValue;
      patch.push(toChangeEvent(fieldPath, 'added', undefined, nextValue));
      return {
        document,
        changedPaths: [fieldPath],
        patch,
      };
    }
    case 'edit': {
      const nextValue = cloneValue(field.value ?? null);
      const oldValue = typeof targetObject[field.key] === 'undefined' ? undefined : targetObject[field.key];
      if (field.nextKey && field.nextKey !== field.key) {
        delete targetObject[field.key];
        targetObject[field.nextKey] = nextValue;
        patch.push(toChangeEvent(getMutationPath(field.path, field.nextKey), 'updated', oldValue, nextValue));
        return {
          document,
          changedPaths: [fieldPath, getMutationPath(field.path, field.nextKey)],
          patch,
        };
      }

      targetObject[field.key] = nextValue;
      patch.push(toChangeEvent(fieldPath, 'updated', oldValue, nextValue));
      return {
        document,
        changedPaths: [fieldPath],
        patch,
      };
    }
    case 'delete': {
      const oldValue = typeof targetObject[field.key] === 'undefined' ? undefined : targetObject[field.key];
      delete targetObject[field.key];
      patch.push(toChangeEvent(fieldPath, 'removed', oldValue, undefined));
      return {
        document,
        changedPaths: [fieldPath],
        patch,
      };
    }
    default:
      return {
        document,
        changedPaths: [],
        patch,
      };
  }
};

const mutateArrayField = (
  document: Document,
  field: Extract<MockMutationRequest, { type: 'mutateField' }>['field'],
): { document: Document; changedPaths: string[]; patch: FriendlyPatchEvent[] } => {
  const target = resolveMutableContainer(document, field.path);
  if (!Array.isArray(target)) {
    throw new Error('Invalid mutate path');
  }

  const index = Number(field.key);
  if (!Number.isInteger(index) || index < 0) {
    throw new Error('Invalid array index');
  }

  const pathAtIndex = getMutationPath(field.path, String(index));
  const oldValue = index < target.length ? (target[index] as JsonValue) : undefined;
  const patch: FriendlyPatchEvent[] = [];

  switch (field.action) {
    case 'add': {
      const insertIndex = Math.min(index, target.length);
      const nextValue = cloneValue(field.value ?? null);
      target.splice(insertIndex, 0, nextValue);
      patch.push(toChangeEvent(getMutationPath(field.path, String(insertIndex)), 'added', undefined, nextValue));
      return {
        document,
        changedPaths: [getMutationPath(field.path, String(insertIndex))],
        patch,
      };
    }
    case 'edit': {
      const nextValue = cloneValue(field.value ?? null);
      if (index >= target.length) {
        target.push(nextValue);
      } else {
        target[index] = nextValue;
      }
      patch.push(toChangeEvent(pathAtIndex, 'updated', oldValue, nextValue));
      return {
        document,
        changedPaths: [pathAtIndex],
        patch,
      };
    }
    case 'delete': {
      if (index >= target.length) {
        throw new Error('Array index not found');
      }
      target.splice(index, 1);
      patch.push(toChangeEvent(pathAtIndex, 'removed', oldValue, undefined));
      return {
        document,
        changedPaths: [pathAtIndex],
        patch,
      };
    }
    default:
      return {
        document,
        changedPaths: [],
        patch,
      };
  }
};

const mutateDocumentField = (
  document: Document,
  field: Extract<MockMutationRequest, { type: 'mutateField' }>['field'],
): { document: Document; changedPaths: string[]; patch: FriendlyPatchEvent[] } => {
  const target = resolveMutableContainer(document, field.path);
  if (field.containerType === 'array') {
    if (!Array.isArray(target)) {
      throw new Error('Invalid mutate path');
    }
    return mutateArrayField(document, field);
  }

  if (!isPlainObject(target)) {
    throw new Error('Invalid mutate path');
  }

  return mutateObjectField(document, field);
};

const updateCollectionTimestamps = (
  snapshot: MockSnapshot,
  databaseName: string,
  collectionName: string,
  timestamp: number,
): void => {
  snapshot.databases[databaseName].collections[collectionName].updatedAt = timestamp;
  snapshot.databases[databaseName].updatedAt = timestamp;
  snapshot.updatedAt = timestamp;
};

export const connect = async (config: ConnectionConfig): Promise<ConnectionResult> => {
  // await delay(config.latencyMs);

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
  // await delay();

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
  // await delay();

  const snapshot = getSnapshot();
  const location = findCollection(snapshot, collectionId);
  if (!location) {
    return rejectWith('Collection not found');
  }

  return location.collection.documents.map((document) => summarizeDocument(document, location.collection.updatedAt, location.collection.titleKey));
};

export const mutateData = async (op: MockMutationRequest): Promise<MockMutationResult> => {
  // await delay();

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

      let changedPath: string;
      let changeEvent: FriendlyPatchEvent;
      if (existingIndex >= 0) {
        collection.documents[existingIndex] = clonedDocument;
        changedPath = `documents.${existingIndex}`;
        changeEvent = toChangeEvent(changedPath, 'updated', oldDocument, clonedDocument);
      } else {
        collection.documents.push(clonedDocument);
        changedPath = `documents.${collection.documents.length - 1}`;
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
        patch: [toChangeEvent(`documents.${index}`, 'removed', removedDocument, undefined)],
        tracePath: [op.database, op.collection, op.documentId],
      });

      return {
        status: 'ok',
        snapshot: getSnapshot(),
        changedPaths: [`databases.${op.database}.collections.${op.collection}.documents.${index}`],
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
        changedPaths: mutation.changedPaths.map((path) => `databases.${op.database}.collections.${op.collection}.documents.${documentIndex}.${path}`),
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
  // await delay();

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
  // await delay();

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

export const subscribeToChanges = (collectionId: string, callback: (change: ChangeResponse) => void): (() => void) => {
  const currentListeners = listeners.get(collectionId) ?? new Set<ChangeListener>();
  currentListeners.add(callback);
  listeners.set(collectionId, currentListeners);

  return () => {
    const registered = listeners.get(collectionId);
    if (!registered) {
      return;
    }

    registered.delete(callback);
    if (registered.size === 0) {
      listeners.delete(collectionId);
    }
  };
};

export const getDocumentById = async (oid: string, projectionPath?: string[]): Promise<Document> => {
  // await delay();

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
  // await delay();
  const snapshot = getSnapshot();
  const location = findDocument(snapshot, oid);
  if (!location) {
    return rejectWith('Document not found');
  }
  return cloneDocument(location.document);
};

export const mockAPI = {
  getSnapshot,
  connect,
  getCollections,
  getDocuments,
  mutateData,
  checkReference,
  getReferenceInfo,
  subscribeToChanges,
  getDocumentById,
  getFullDocumentById,
};
