// path: src/services/mockStorage.ts
import type { Document, JsonObject, JsonValue, MockCollectionRecord, MockDatabaseRecord, MockSnapshot } from '../types/explorer';
import { createSeedSnapshot } from '../data/sampleData';

const STORAGE_KEY = 'mongolive_snapshot';
const SNAPSHOT_VERSION = 1;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isJsonValue = (value: unknown): value is JsonValue => {
  if (value === null) {
    return true;
  }

  const valueType = typeof value;
  if (valueType === 'string' || valueType === 'number' || valueType === 'boolean') {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every((item) => isJsonValue(item));
  }

  if (isPlainObject(value)) {
    return Object.values(value).every((item) => isJsonValue(item));
  }

  return false;
};

const cloneValue = (value: JsonValue): JsonValue => {
  if (Array.isArray(value)) {
    return value.map((item) => cloneValue(item));
  }

  if (isPlainObject(value)) {
    const cloned: JsonObject = {};
    for (const [key, nextValue] of Object.entries(value)) {
      cloned[key] = cloneValue(nextValue as JsonValue);
    }
    return cloned;
  }

  return value;
};

const cloneDocument = (document: Document): Document => cloneValue(document) as Document;

const cloneCollection = (collection: MockCollectionRecord): MockCollectionRecord => ({
  ...collection,
  documents: collection.documents.map((document) => cloneDocument(document)),
});

const cloneDatabase = (database: MockDatabaseRecord): MockDatabaseRecord => {
  const collections: Record<string, MockCollectionRecord> = {};
  for (const [name, collection] of Object.entries(database.collections)) {
    collections[name] = cloneCollection(collection);
  }

  return {
    ...database,
    collections,
  };
};

const cloneSnapshot = (snapshot: MockSnapshot): MockSnapshot => {
  const databases: Record<string, MockDatabaseRecord> = {};
  for (const [name, database] of Object.entries(snapshot.databases)) {
    databases[name] = cloneDatabase(database);
  }

  return {
    version: snapshot.version,
    activeDatabase: snapshot.activeDatabase,
    databases,
    updatedAt: snapshot.updatedAt,
  };
};

const validateSnapshot = (candidate: unknown): MockSnapshot => {
  if (!isPlainObject(candidate)) {
    throw new Error('Invalid snapshot');
  }

  const { version, activeDatabase, databases, updatedAt } = candidate;
  if (version !== SNAPSHOT_VERSION || typeof activeDatabase !== 'string' || !isPlainObject(databases) || typeof updatedAt !== 'number') {
    throw new Error('Invalid snapshot');
  }

  const normalizedDatabases: Record<string, MockDatabaseRecord> = {};
  for (const [databaseName, databaseValue] of Object.entries(databases)) {
    if (!isPlainObject(databaseValue)) {
      throw new Error('Invalid snapshot');
    }

    const { name, label, description, collections: rawCollections, updatedAt: databaseUpdatedAt } = databaseValue;
    if (
      typeof name !== 'string' ||
      typeof label !== 'string' ||
      typeof description !== 'string' ||
      !isPlainObject(rawCollections) ||
      typeof databaseUpdatedAt !== 'number'
    ) {
      throw new Error('Invalid snapshot');
    }

    const normalizedCollections: Record<string, MockCollectionRecord> = {};
    for (const [collectionName, collectionValue] of Object.entries(rawCollections)) {
      if (!isPlainObject(collectionValue)) {
        throw new Error('Invalid snapshot');
      }

      const { name: collectionLabelName, label: collectionLabel, description: collectionDescription, documents, updatedAt: collectionUpdatedAt, titleKey } = collectionValue;
      if (
        typeof collectionLabelName !== 'string' ||
        typeof collectionLabel !== 'string' ||
        typeof collectionDescription !== 'string' ||
        !Array.isArray(documents) ||
        typeof collectionUpdatedAt !== 'number'
      ) {
        throw new Error('Invalid snapshot');
      }

      const normalizedDocuments = documents.map((document) => {
        if (!isPlainObject(document) || !isJsonValue(document)) {
          throw new Error('Invalid snapshot');
        }
        return document as Document;
      });

      normalizedCollections[collectionName] = {
        name: collectionLabelName,
        label: collectionLabel,
        description: collectionDescription,
        documents: normalizedDocuments,
        updatedAt: collectionUpdatedAt,
        titleKey: typeof titleKey === 'string' ? titleKey : undefined,
      };
    }

    normalizedDatabases[databaseName] = {
      name,
      label,
      description,
      collections: normalizedCollections,
      updatedAt: databaseUpdatedAt,
    };
  }

  if (!(activeDatabase in normalizedDatabases)) {
    throw new Error('Invalid snapshot');
  }

  return {
    version: SNAPSHOT_VERSION,
    activeDatabase,
    databases: normalizedDatabases,
    updatedAt,
  };
};

const readStorage = (): Storage | undefined => {
  if (typeof globalThis === 'undefined') {
    return undefined;
  }

  const candidate = globalThis.localStorage;
  return candidate ?? undefined;
};

const writeSnapshot = (snapshot: MockSnapshot): void => {
  const storage = readStorage();
  if (storage) {
    storage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  }
};

const loadInitialSnapshot = (): MockSnapshot => {
  const storage = readStorage();
  if (storage) {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        return validateSnapshot(JSON.parse(raw) as unknown);
      } catch {
        const seed = createSeedSnapshot();
        storage.setItem(STORAGE_KEY, JSON.stringify(seed));
        return seed;
      }
    }
  }

  const seed = createSeedSnapshot();
  writeSnapshot(seed);
  return seed;
};

let currentSnapshot = cloneSnapshot(loadInitialSnapshot());

export const getSnapshot = (): MockSnapshot => cloneSnapshot(currentSnapshot);

export const setSnapshot = (snapshot: MockSnapshot): void => {
  const nextSnapshot = validateSnapshot(snapshot);
  currentSnapshot = cloneSnapshot(nextSnapshot);
  writeSnapshot(currentSnapshot);
};

export const importSnapshot = (raw: string): MockSnapshot => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Invalid snapshot');
  }
  const nextSnapshot = validateSnapshot(parsed);
  setSnapshot(nextSnapshot);
  return getSnapshot();
};

export const exportSnapshot = (): string => JSON.stringify(currentSnapshot);

// ── '고유 oid' 레지스트리 ─────────────────────────────────────────────────────
// 새로고침 후에도 ObjectID 필드의 owned/REF 분류가 유지되도록 localStorage에 별도 저장

const UNIQUE_OIDS_KEY = 'mongolive_unique_oids';

export const getUniqueOids = (): string[] => {
  const storage = readStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(UNIQUE_OIDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
};

export const setUniqueOids = (oids: string[]): void => {
  const storage = readStorage();
  if (storage) {
    storage.setItem(UNIQUE_OIDS_KEY, JSON.stringify(oids));
  }
};
