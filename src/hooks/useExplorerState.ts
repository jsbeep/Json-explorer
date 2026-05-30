import { create } from 'zustand';
import type {
	CollectionSummary,
	DatabaseSummary,
	Document,
	ExplorerMobileTab,
	ExplorerPathSegment,
	ExplorerViewportMode,
	JsonValue,
	MockSnapshot,
} from '../types/explorer';
import { mockAPI } from '../services/mockAPI';

type ExplorerState = {
	isLoading: boolean;
	error: string | null;
	flashPath: string[] | null;
	viewportMode: ExplorerViewportMode;
	activeTab: ExplorerMobileTab;
	databases: DatabaseSummary[];
	selectedDatabase: string;
	collections: CollectionSummary[];
	selectedCollection: string | null;
	documents: Document[];
	selectedDocumentId: string | null;
	selectedDocument: Document | null;
	fieldPath: string[];
	pathSegments: ExplorerPathSegment[];
	lastSnapshot: MockSnapshot | null;
	bootstrap: () => Promise<void>;
	setViewportMode: (mode: ExplorerViewportMode) => void;
	setActiveTab: (tab: ExplorerMobileTab) => void;
	selectDatabase: (database: string) => Promise<void>;
	selectCollection: (collection: string) => Promise<void>;
	selectDocument: (documentId: string) => Promise<void>;
	navigateIntoField: (key: string, value: JsonValue) => void;
	setFieldPath: (fieldPath: string[]) => void;
	flashTracePath: (tracePath: string[]) => void;
	jumpToDepth: (depth: number) => Promise<void>;
	refreshCurrentView: () => Promise<void>;
};

const initialState = {
	isLoading: true,
	error: null,
	flashPath: null,
	viewportMode: 'desktop' as ExplorerViewportMode,
	activeTab: 'collections' as ExplorerMobileTab,
	databases: [],
	selectedDatabase: 'campus-live',
	collections: [],
	selectedCollection: null,
	documents: [],
	selectedDocumentId: null,
	selectedDocument: null,
	fieldPath: [],
	pathSegments: [],
	lastSnapshot: null,
};

function formatLabel(value: unknown) {
	if (typeof value === 'string') {
		return value;
	}

	if (typeof value === 'number' || typeof value === 'boolean') {
		return String(value);
	}

	if (value === null) {
		return 'null';
	}

	if (Array.isArray(value)) {
		return `Array(${value.length})`;
	}

	if (value && typeof value === 'object') {
		if ('$oid' in value) {
			return `ObjectId ${(value as { $oid: string }).$oid.slice(-6)}`;
		}

		return 'Object';
	}

	return 'Value';
}

function buildPathSegments(database: string, collection: string | null, document: Document | null, fieldPath: string[]) {
	const segments: ExplorerPathSegment[] = [
		{ key: database, label: database, kind: 'database', path: [database] },
	];

	if (collection) {
		segments.push({ key: collection, label: collection, kind: 'collection', path: [database, collection] });
	}

	if (document) {
		const identifier = typeof document._id === 'object' && document._id && '$oid' in document._id ? (document._id as { $oid: string }).$oid : 'document';
		segments.push({ key: identifier, label: formatLabel(identifier), kind: 'document', path: [database, collection ?? '', identifier].filter(Boolean) });
	}

	fieldPath.forEach((key, index) => {
		segments.push({
			key,
			label: key,
			kind: 'field',
			path: [database, collection ?? '', document ? 'document' : '', ...fieldPath.slice(0, index + 1)].filter(Boolean),
		});
	});

	return segments;
}

function determineActiveTab(collection: string | null, document: Document | null, fieldPath: string[]): ExplorerMobileTab {
	if (fieldPath.length > 0 || document) {
		return 'json';
	}

	if (collection) {
		return 'documents';
	}

	return 'collections';
}

function getDocumentIdentifier(document: Document | null) {
	if (!document) {
		return null;
	}

	const maybeId = document._id as { $oid?: string } | undefined;
	return maybeId?.$oid ?? null;
}

function findDocument(documents: Document[], documentId: string) {
	return documents.find((document) => getDocumentIdentifier(document) === documentId) ?? null;
}

async function loadView(database: string, collection: string | null, documentId?: string | null, fieldPath: string[] = []) {
	const collections = await mockAPI.getCollections(database);
	let documents: Document[] = [];
	let selectedDocument: Document | null = null;

	if (collection) {
		documents = await mockAPI.getDocuments(database, collection);
		if (documentId) {
			selectedDocument = findDocument(documents, documentId);
		} else {
			selectedDocument = documents[0] ?? null;
		}
	}

	return {
		collections,
		documents,
		selectedDocument,
		pathSegments: buildPathSegments(database, collection, selectedDocument, fieldPath),
		activeTab: determineActiveTab(collection, selectedDocument, fieldPath),
	};
}

const useExplorerStore = create<ExplorerState>((set, get) => ({
	...initialState,
	bootstrap: async () => {
		set({ isLoading: true, error: null });
		try {
			const connection = await mockAPI.connect();
			const activeDatabase = connection.activeDatabase;
			const view = await loadView(activeDatabase, null);
			set({
				databases: connection.databases,
				selectedDatabase: activeDatabase,
				collections: view.collections,
				documents: [],
				selectedCollection: null,
				selectedDocumentId: null,
				selectedDocument: null,
				fieldPath: [],
				pathSegments: view.pathSegments,
				activeTab: view.activeTab,
				lastSnapshot: null,
			});
		} catch (error) {
			set({ error: error instanceof Error ? error.message : 'Failed to bootstrap explorer' });
		} finally {
			set({ isLoading: false });
		}
	},
	setViewportMode: (mode) => {
		set({ viewportMode: mode });
	},
	setActiveTab: (tab) => {
		set({ activeTab: tab });
	},
	selectDatabase: async (database) => {
		set({ isLoading: true, error: null });
		try {
			const view = await loadView(database, null);
			const connection = await mockAPI.connect({ database });
			set({
				databases: connection.databases,
				selectedDatabase: database,
				collections: view.collections,
				documents: [],
				selectedCollection: null,
				selectedDocumentId: null,
				selectedDocument: null,
				fieldPath: [],
				pathSegments: view.pathSegments,
				activeTab: view.activeTab,
			});
		} catch (error) {
			set({ error: error instanceof Error ? error.message : 'Failed to switch database' });
		} finally {
			set({ isLoading: false });
		}
	},
	selectCollection: async (collection) => {
		const { selectedDatabase } = get();
		set({ isLoading: true, error: null });
		try {
			const view = await loadView(selectedDatabase, collection);
			set({
				collections: await mockAPI.getCollections(selectedDatabase),
				selectedCollection: collection,
				documents: view.documents,
				selectedDocumentId: getDocumentIdentifier(view.selectedDocument),
				selectedDocument: view.selectedDocument,
				fieldPath: [],
				pathSegments: view.pathSegments,
				activeTab: view.activeTab,
			});
		} catch (error) {
			set({ error: error instanceof Error ? error.message : 'Failed to select collection' });
		} finally {
			set({ isLoading: false });
		}
	},
	selectDocument: async (documentId) => {
		const { selectedDatabase, selectedCollection } = get();
		if (!selectedCollection) {
			return;
		}

		set({ isLoading: true, error: null });
		try {
			const view = await loadView(selectedDatabase, selectedCollection, documentId);
			set({
				documents: view.documents,
				selectedDocumentId: documentId,
				selectedDocument: view.selectedDocument,
				fieldPath: [],
				pathSegments: view.pathSegments,
				activeTab: 'json',
			});
		} catch (error) {
			set({ error: error instanceof Error ? error.message : 'Failed to load document' });
		} finally {
			set({ isLoading: false });
		}
	},
	navigateIntoField: (key, value) => {
		const { selectedDatabase, selectedCollection, selectedDocument, fieldPath } = get();
		const nextFieldPath = [...fieldPath, key];
		set({
			fieldPath: nextFieldPath,
			pathSegments: buildPathSegments(selectedDatabase, selectedCollection, selectedDocument, nextFieldPath),
			activeTab: 'json',
		});
	},
	setFieldPath: (fieldPath) => {
		const { selectedDatabase, selectedCollection, selectedDocument } = get();
		set({
			fieldPath,
			pathSegments: buildPathSegments(selectedDatabase, selectedCollection, selectedDocument, fieldPath),
			activeTab: 'json',
		});
	},
	flashTracePath: (tracePath) => {
		set({ flashPath: tracePath });
		window.setTimeout(() => {
			set((state) => (state.flashPath === tracePath ? { flashPath: null } : state));
		}, 900);
	},
	jumpToDepth: async (depth) => {
		const { selectedDatabase, selectedCollection, selectedDocumentId, fieldPath } = get();
		const nextDepth = Math.max(0, depth);

		if (nextDepth === 0) {
			const view = await loadView(selectedDatabase, null);
			set({
				collections: view.collections,
				documents: [],
				selectedCollection: null,
				selectedDocumentId: null,
				selectedDocument: null,
				fieldPath: [],
				pathSegments: view.pathSegments,
				activeTab: view.activeTab,
			});
			return;
		}

		if (nextDepth === 1 && selectedCollection) {
			const view = await loadView(selectedDatabase, selectedCollection);
			set({
				collections: view.collections,
				documents: view.documents,
				selectedDocumentId: null,
				selectedDocument: null,
				fieldPath: [],
				pathSegments: view.pathSegments,
				activeTab: view.activeTab,
			});
			return;
		}

		if (nextDepth === 2 && selectedCollection && selectedDocumentId) {
			const view = await loadView(selectedDatabase, selectedCollection, selectedDocumentId);
			set({
				documents: view.documents,
				selectedDocument: view.selectedDocument,
				fieldPath: [],
				pathSegments: view.pathSegments,
				activeTab: 'json',
			});
			return;
		}

		if (nextDepth > 2) {
			const nextFieldPath = fieldPath.slice(0, nextDepth - 2);
			set({
				fieldPath: nextFieldPath,
				pathSegments: buildPathSegments(selectedDatabase, selectedCollection, get().selectedDocument, nextFieldPath),
				activeTab: 'json',
			});
		}
	},
	refreshCurrentView: async () => {
		const { selectedDatabase, selectedCollection, selectedDocumentId, fieldPath } = get();
		set({ isLoading: true, error: null });
		try {
			const view = await loadView(selectedDatabase, selectedCollection, selectedDocumentId, fieldPath);
			set({
				collections: await mockAPI.getCollections(selectedDatabase),
				documents: view.documents,
				selectedDocument: view.selectedDocument,
				pathSegments: view.pathSegments,
				activeTab: view.activeTab,
			});
		} catch (error) {
			set({ error: error instanceof Error ? error.message : 'Failed to refresh view' });
		} finally {
			set({ isLoading: false });
		}
	},
}));

export function useExplorerState<T>(selector: (state: ExplorerState) => T): T {
	return useExplorerStore(selector);
}

export type { ExplorerState };
