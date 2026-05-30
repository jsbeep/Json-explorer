import type {
	ChangeResponse,
	CollectionSummary,
	ConnectionConfig,
	ConnectionResult,
	Document,
	DocumentSummary,
	MockMutationRequest,
	MockMutationResult,
	MockSnapshot,
	JsonValue,
	PermissionContext,
} from '../types/explorer';
import {
	exportSnapshotString,
	getCollectionSummaries,
	getDatabaseSummaries,
	getDocumentSummaries,
	getDocuments,
	importSnapshotString,
	readSnapshot,
	replaceSnapshot,
	resetSnapshot,
	writeSnapshot,
} from './mockStorage';

type ChangeListener = (event: ChangeResponse) => void;

const listeners = new Map<string, Set<ChangeListener>>();

function createPermissionContext(database: string, collection?: string): PermissionContext {
	return {
		database,
		collection,
		role: 'admin',
		canRead: true,
		canWrite: true,
		canDelete: true,
	};
}

function randomLatency() {
	return 100 + Math.round(Math.random() * 100);
}

function wait(duration = randomLatency()) {
	return new Promise((resolve) => {
		window.setTimeout(resolve, duration);
	});
}

function clone<T>(value: T): T {
	return JSON.parse(JSON.stringify(value)) as T;
}

function collectionKey(database: string, collection: string) {
	return `${database}:${collection}`;
}

function emit(database: string, collection: string, event: ChangeResponse) {
	const key = collectionKey(database, collection);
	const subscribers = listeners.get(key);
	if (!subscribers) {
		return;
	}

	for (const subscriber of subscribers) {
		subscriber(event);
	}
}

function getDocumentTitle(document: Document) {
	if (typeof document.title === 'string') {
		return document.title;
	}

	if (typeof document.name === 'string') {
		return document.name;
	}

	if (typeof document.orderNo === 'string') {
		return document.orderNo;
	}

	if (typeof document.ticketNo === 'string') {
		return document.ticketNo;
	}

	return 'Untitled';
}

function getDocumentId(document: Document) {
	const maybeId = document._id as { $oid?: string } | undefined;
	return maybeId?.$oid ?? `${Date.now()}`;
}

function updateCollectionSnapshot(snapshot: MockSnapshot, databaseName: string, collectionName: string, documents: Document[]) {
	const nextSnapshot = clone(snapshot);
	const database = nextSnapshot.databases[databaseName];
	if (!database || !database.collections[collectionName]) {
		throw new Error(`Collection not found: ${databaseName}.${collectionName}`);
	}

	database.collections[collectionName].documents = documents;
	database.collections[collectionName].updatedAt = Date.now();
	database.updatedAt = Date.now();
	nextSnapshot.updatedAt = Date.now();
	return writeSnapshot(nextSnapshot);
}

type MutateFieldRequest = Extract<MockMutationRequest, { type: 'mutateField' }>;

function cloneDocument(document: Document): Document {
	return JSON.parse(JSON.stringify(document)) as Document;
}

function isObjectLike(value: unknown): value is Record<string, JsonValue> {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value) && !('$oid' in (value as Record<string, unknown>));
}

function getContainerRoot(document: Document, path: string[]) {
	let current: any = document;
	for (const segment of path) {
		if (current == null) {
			return undefined;
		}

		if (Array.isArray(current)) {
			current = current[Number(segment)];
			continue;
		}

		current = current[segment];
	}

	return current;
}

function setAtPath(document: Document, path: string[], key: string | undefined, value: JsonValue) {
	const nextDocument = cloneDocument(document);
	const container = getContainerRoot(nextDocument, path);
	if (Array.isArray(container)) {
		if (key === undefined || key === '') {
			container.push(value);
		} else {
			const index = Number(key);
			if (Number.isNaN(index) || index < 0 || index > container.length) {
				throw new Error('Invalid array index');
			}

			if (index === container.length) {
				container.push(value);
			} else {
				container[index] = value;
			}
		}

		return nextDocument;
	}

	if (!isObjectLike(container)) {
		throw new Error('Target container is not mutable');
	}

	if (!key) {
		throw new Error('Missing field key');
	}

	container[key] = value;
	return nextDocument;
}

function renameAtPath(document: Document, path: string[], key: string, nextKey: string, value?: JsonValue) {
	const nextDocument = cloneDocument(document);
	const container = getContainerRoot(nextDocument, path);
	if (!isObjectLike(container)) {
		throw new Error('Can only rename keys on object containers');
	}

	if (!(key in container)) {
		throw new Error('Field not found');
	}

	container[nextKey] = container[key];
	delete container[key];
	if (value !== undefined) {
		container[nextKey] = value;
	}
	return nextDocument;
}

function deleteAtPath(document: Document, path: string[], key: string) {
	const nextDocument = cloneDocument(document);
	const container = getContainerRoot(nextDocument, path);
	if (Array.isArray(container)) {
		const index = Number(key);
		if (Number.isNaN(index) || index < 0 || index >= container.length) {
			throw new Error('Invalid array index');
		}

		container.splice(index, 1);
		return nextDocument;
	}

	if (!isObjectLike(container)) {
		throw new Error('Target container is not mutable');
	}

	delete container[key];
	return nextDocument;
}

export const mockAPI = {
	async connect(config: ConnectionConfig = {}): Promise<ConnectionResult> {
		await wait(config.latencyMs);
		const snapshot = readSnapshot();
		const summaries = getDatabaseSummaries(snapshot);
		const activeDatabase = config.database && snapshot.databases[config.database] ? config.database : snapshot.activeDatabase;
		return {
			status: 'connected',
			connectedAt: Date.now(),
			activeDatabase,
			databases: summaries,
		};
	},

	async getCollections(database: string): Promise<CollectionSummary[]> {
		await wait();
		return getCollectionSummaries(readSnapshot(), database);
	},

	async getDocuments(database: string, collection: string): Promise<Document[]> {
		await wait();
		return clone(getDocuments(readSnapshot(), database, collection));
	},

	async getDocumentSummaries(database: string, collection: string): Promise<DocumentSummary[]> {
		await wait();
		return clone(getDocumentSummaries(readSnapshot(), database, collection));
	},

	async getPermissionContext(database: string, collection?: string): Promise<PermissionContext> {
		await wait(120);
		return createPermissionContext(database, collection);
	},

	async mutateData(request: MockMutationRequest): Promise<MockMutationResult> {
		await wait();
		const snapshot = readSnapshot();

		if (request.type === 'replaceSnapshot') {
			const nextSnapshot = replaceSnapshot(request.snapshot);
			return {
				status: 'ok',
				snapshot: nextSnapshot,
				tracePath: [],
			};
		}

		if (request.type === 'createDatabase') {
			const nextSnapshot = clone(snapshot);
			nextSnapshot.databases[request.database.name] = {
				name: request.database.name,
				label: request.database.label,
				description: request.database.description,
				collections: request.database.collections ?? {},
				updatedAt: Date.now(),
			};
			nextSnapshot.activeDatabase = request.database.name;
			return {
				status: 'ok',
				snapshot: writeSnapshot(nextSnapshot),
				tracePath: [request.database.name],
			};
		}

		if (request.type === 'createCollection') {
			const nextSnapshot = clone(snapshot);
			const database = nextSnapshot.databases[request.database];
			if (!database) {
				throw new Error(`Database not found: ${request.database}`);
			}

			database.collections[request.collection.name] = {
				name: request.collection.name,
				label: request.collection.label,
				description: request.collection.description,
				documents: request.collection.documents ?? [],
				updatedAt: Date.now(),
			};
			database.updatedAt = Date.now();
			return {
				status: 'ok',
				snapshot: writeSnapshot(nextSnapshot),
				tracePath: [request.database, request.collection.name],
				collectionKey: collectionKey(request.database, request.collection.name),
			};
		}

		if (request.type === 'upsertDocument') {
			const database = snapshot.databases[request.database];
			const collection = database?.collections[request.collection];
			if (!database || !collection) {
				throw new Error(`Collection not found: ${request.database}.${request.collection}`);
			}

			const nextDocuments = [...collection.documents];
			const documentId = getDocumentId(request.document);
			const index = nextDocuments.findIndex((document) => getDocumentId(document) === documentId);
			if (index >= 0) {
				nextDocuments[index] = { ...nextDocuments[index], ...request.document };
			} else {
				nextDocuments.unshift(request.document);
			}

			const nextSnapshot = updateCollectionSnapshot(snapshot, request.database, request.collection, nextDocuments);
			emit(request.database, request.collection, {
				type: 'replace',
				database: request.database,
				collection: request.collection,
				data: nextDocuments,
				tracePath: [request.database, request.collection, documentId],
			});

			return {
				status: 'ok',
				snapshot: nextSnapshot,
				tracePath: [request.database, request.collection, documentId],
				collectionKey: collectionKey(request.database, request.collection),
			};
		}

		if (request.type === 'mutateField') {
			const fieldRequest: MutateFieldRequest = request;
			const database = snapshot.databases[fieldRequest.database];
			const collection = database?.collections[fieldRequest.collection];
			if (!database || !collection) {
				throw new Error(`Collection not found: ${fieldRequest.database}.${fieldRequest.collection}`);
			}

			const nextDocuments = [...collection.documents];
			const documentIndex = nextDocuments.findIndex((document) => getDocumentId(document) === fieldRequest.documentId);
			if (documentIndex < 0) {
				throw new Error('Document not found');
			}

			const currentDocument = nextDocuments[documentIndex];
			let nextDocument: Document;
			let tracePath = [fieldRequest.database, fieldRequest.collection, fieldRequest.documentId, ...fieldRequest.field.path];

			if (fieldRequest.field.action === 'delete') {
				if (!fieldRequest.field.key) {
					throw new Error('Missing field key');
				}

				nextDocument = deleteAtPath(currentDocument, fieldRequest.field.path, fieldRequest.field.key);
				tracePath = [...tracePath, fieldRequest.field.key];
			} else if (fieldRequest.field.action === 'add') {
				if (fieldRequest.field.value === undefined) {
					throw new Error('Missing field value');
				}

				nextDocument = setAtPath(
					currentDocument,
					fieldRequest.field.path,
					fieldRequest.field.containerType === 'array' ? undefined : fieldRequest.field.key,
					fieldRequest.field.value,
				);
				if (fieldRequest.field.containerType === 'array') {
					const nextContainer = getContainerRoot(nextDocument, fieldRequest.field.path);
					const appendedIndex = Array.isArray(nextContainer) ? String(nextContainer.length - 1) : '0';
					tracePath = [...tracePath, appendedIndex];
				} else {
					tracePath = [...tracePath, fieldRequest.field.key ?? ''];
				}
			} else {
				if (fieldRequest.field.value === undefined) {
					throw new Error('Missing field value');
				}

				if (fieldRequest.field.nextKey && fieldRequest.field.key && fieldRequest.field.nextKey !== fieldRequest.field.key) {
					nextDocument = renameAtPath(currentDocument, fieldRequest.field.path, fieldRequest.field.key, fieldRequest.field.nextKey, fieldRequest.field.value);
					tracePath = [...tracePath, fieldRequest.field.nextKey];
				} else {
					nextDocument = setAtPath(currentDocument, fieldRequest.field.path, fieldRequest.field.key, fieldRequest.field.value);
					tracePath = [...tracePath, fieldRequest.field.key ?? ''];
				}
			}

			nextDocuments[documentIndex] = nextDocument;
			const nextSnapshot = updateCollectionSnapshot(snapshot, fieldRequest.database, fieldRequest.collection, nextDocuments);
			emit(fieldRequest.database, fieldRequest.collection, {
				type: 'replace',
				database: fieldRequest.database,
				collection: fieldRequest.collection,
				data: nextDocuments,
				tracePath,
			});

			return {
				status: 'ok',
				snapshot: nextSnapshot,
				tracePath,
				collectionKey: collectionKey(fieldRequest.database, fieldRequest.collection),
			};
		}

		const database = snapshot.databases[request.database];
		const collection = database?.collections[request.collection];
		if (!database || !collection) {
			throw new Error(`Collection not found: ${request.database}.${request.collection}`);
		}

		const nextDocuments = collection.documents.filter((document) => getDocumentId(document) !== request.documentId);
		const nextSnapshot = updateCollectionSnapshot(snapshot, request.database, request.collection, nextDocuments);
		emit(request.database, request.collection, {
			type: 'invalidate',
			reason: 'collection-dropped',
			database: request.database,
			collection: request.collection,
		});

		return {
			status: 'ok',
			snapshot: nextSnapshot,
			tracePath: [request.database, request.collection, request.documentId],
			collectionKey: collectionKey(request.database, request.collection),
		};
	},

	subscribeToChanges(database: string, collection: string, callback: ChangeListener) {
		const key = collectionKey(database, collection);
		const existing = listeners.get(key) ?? new Set<ChangeListener>();
		existing.add(callback);
		listeners.set(key, existing);

		return () => {
			const current = listeners.get(key);
			if (!current) {
				return;
			}

			current.delete(callback);
			if (current.size === 0) {
				listeners.delete(key);
			}
		};
	},

	exportSnapshot: exportSnapshotString,
	importSnapshot: importSnapshotString,
	resetSnapshot,
};
