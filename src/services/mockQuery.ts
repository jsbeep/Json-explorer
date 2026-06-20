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

export const summarizeDocument = (document: Document, updatedAt: number, titleKey?: string): DocumentSummary => {
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

export const getDocumentOid = (document: Document): string | undefined => (isBsonObjectId(document._id) ? document._id.$oid : undefined);

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
