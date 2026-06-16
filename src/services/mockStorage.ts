// path: src/services/mockStorage.ts
import type { BsonObjectId, Document, JsonObject, JsonValue, MockCollectionRecord, MockDatabaseRecord, MockSnapshot } from '../types/explorer';

const STORAGE_KEY = 'mongolive_snapshot';
const SNAPSHOT_VERSION = 1;
const ACTIVE_DATABASE = 'mongolive-dev';

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

const makeOid = (seed: string): BsonObjectId => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  const first = (hash >>> 0).toString(16).padStart(8, '0');
  const second = (Math.imul(hash ^ 0x9e3779b9, 0x85ebca6b) >>> 0).toString(16).padStart(8, '0');
  const third = (Math.imul(hash ^ 0xc2b2ae35, 0x27d4eb2f) >>> 0).toString(16).padStart(8, '0');

  return {
    $oid: `${first}${second}${third}`.slice(0, 24),
  };
};

const formatDate = (timestamp: number): string => new Date(timestamp).toISOString();

const createSeedSnapshot = (): MockSnapshot => {
  const now = Date.now();
  const userSeeds = [
    { name: 'Ava Kim', role: 'admin' },
    { name: 'Minjun Park', role: 'editor' },
    { name: 'Sora Lee', role: 'viewer' },
    { name: 'Jisoo Choi', role: 'editor' },
    { name: 'Hana Yoon', role: 'viewer' },
    { name: 'Jun Seo', role: 'admin' },
    { name: 'Mina Jung', role: 'viewer' },
    { name: 'Taeyang Han', role: 'editor' },
    { name: 'Yuna Shin', role: 'viewer' },
    { name: 'Dohyun Lim', role: 'editor' },
  ] as const;

  const users = userSeeds.map((seed, index) => {
    const createdAt = formatDate(now - index * 86_400_000);
    return {
      _id: makeOid(`users-${index + 1}`),
      name: seed.name,
      email: `${seed.name.toLowerCase().replace(/\s+/g, '.')}@mongolive.dev`,
      role: seed.role,
      createdAt,
    };
  });

  const productSeeds = [
    { name: 'Cloud Mug', price: 18, stock: 120, tags: ['home', 'desk'] },
    { name: 'Orbit Lamp', price: 72, stock: 45, tags: ['lighting', 'office'] },
    { name: 'Focus Pad', price: 24, stock: 90, tags: ['stationery', 'productivity'] },
    { name: 'Halo Keyboard', price: 128, stock: 28, tags: ['hardware', 'premium'] },
    { name: 'Pulse Bottle', price: 29, stock: 150, tags: ['travel', 'fitness'] },
    { name: 'Frame Stand', price: 34, stock: 64, tags: ['accessory', 'home'] },
  ] as const;

  const products = productSeeds.map((seed, index) => ({
    _id: makeOid(`products-${index + 1}`),
    name: seed.name,
    price: seed.price,
    stock: seed.stock,
    tags: [...seed.tags],
  }));

  const orderStatuses = ['paid', 'pending', 'shipped', 'cancelled'] as const;
  const orders = Array.from({ length: 8 }, (_, index) => {
    const user = users[index % users.length];
    const primaryProduct = products[index % products.length];
    const secondaryProduct = products[(index + 2) % products.length];
    const itemCount = index % 3 === 0 ? 1 : 2;
    const items = [
      {
        sku: `ORD-${index + 1}-A`,
        productId: primaryProduct._id,
        name: primaryProduct.name,
        quantity: itemCount,
        price: primaryProduct.price,
      },
    ];

    if (itemCount > 1) {
      items.push({
        sku: `ORD-${index + 1}-B`,
        productId: secondaryProduct._id,
        name: secondaryProduct.name,
        quantity: 1,
        price: secondaryProduct.price,
      });
    }

    return {
      _id: makeOid(`orders-${index + 1}`),
      userId: {
        $ref: 'users',
        $id: user._id,
        $db: ACTIVE_DATABASE,
      },
      amount: items.reduce((total, item) => total + item.price * item.quantity, 0),
      status: orderStatuses[index % orderStatuses.length],
      items,
    };
  });

  const collections: Record<string, MockCollectionRecord> = {
    users: {
      name: 'users',
      label: 'Users',
      description: 'Registered demo users for the explorer',
      documents: users,
      updatedAt: now - 3_600_000,
    },
    orders: {
      name: 'orders',
      label: 'Orders',
      description: 'Purchase records linked to users by DBRef',
      documents: orders,
      updatedAt: now - 2_400_000,
    },
    products: {
      name: 'products',
      label: 'Products',
      description: 'Product catalog with pricing and inventory',
      documents: products,
      updatedAt: now - 1_800_000,
    },
  };

  return {
    version: SNAPSHOT_VERSION,
    activeDatabase: ACTIVE_DATABASE,
    databases: {
      [ACTIVE_DATABASE]: {
        name: ACTIVE_DATABASE,
        label: 'Mongolive Dev',
        description: 'Seed database used by the local explorer mock API',
        collections,
        updatedAt: now - 1_200_000,
      },
    },
    updatedAt: now,
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

      const { name: collectionLabelName, label: collectionLabel, description: collectionDescription, documents, updatedAt: collectionUpdatedAt } = collectionValue;
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
