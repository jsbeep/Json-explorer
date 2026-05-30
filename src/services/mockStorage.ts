import type {
	BsonObjectId,
	Document,
	MockCollectionRecord,
	MockDatabaseRecord,
	MockSnapshot,
} from '../types/explorer';

const STORAGE_KEY = 'mongolive.mock-snapshot.v1';

const oid = (value: string): BsonObjectId => ({ $oid: value });

const ids = {
	eventKickoff: oid('664efb9ea1c0c9b439a5f001'),
	eventRealtime: oid('664efb9ea1c0c9b439a5f002'),
	eventHackathon: oid('664efb9ea1c0c9b439a5f003'),
	userAria: oid('664efb9ea1c0c9b439a5a001'),
	userBen: oid('664efb9ea1c0c9b439a5a002'),
	userMina: oid('664efb9ea1c0c9b439a5a003'),
	userDaniel: oid('664efb9ea1c0c9b439a5a004'),
	clubBuilders: oid('664efb9ea1c0c9b439a5c001'),
	clubDesign: oid('664efb9ea1c0c9b439a5c002'),
	productOrbit: oid('664efb9ea1c0c9b439a5101'),
	productNorth: oid('664efb9ea1c0c9b439a5102'),
	productCanvas: oid('664efb9ea1c0c9b439a5103'),
	orderOne: oid('664efb9ea1c0c9b439a5201'),
	orderTwo: oid('664efb9ea1c0c9b439a5202'),
	ticketOne: oid('664efb9ea1c0c9b439a5301'),
	ticketTwo: oid('664efb9ea1c0c9b439a5302'),
	agentYuri: oid('664efb9ea1c0c9b439a5401'),
	agentHae: oid('664efb9ea1c0c9b439a5402'),
};

const now = () => Date.now();

const createEventDocuments = (): Document[] => [
	{
		_id: ids.eventKickoff,
		title: 'Kickoff update',
		author: 'Jina',
		status: 'live',
		score: 92,
		owner: {
			ref: ids.userAria,
			name: 'Campus Live',
			team: 'growth',
			contacts: {
				lead: { name: 'Aria Lee', userRef: ids.userAria },
				editor: { name: 'Ben Kim', userRef: ids.userBen },
			},
		},
		tags: ['launch', 'frontend', 'dashboard'],
		metrics: {
			views: 1420,
			shares: 28,
			comments: 19,
			relatedDocuments: [ids.eventRealtime, ids.userAria, ids.clubBuilders],
		},
		schedule: {
			start: '2026-05-18T09:10:00.000Z',
			end: '2026-05-18T11:40:00.000Z',
			timezone: 'Asia/Seoul',
		},
		createdAt: '2026-05-18T09:10:00.000Z',
	},
	{
		_id: ids.eventRealtime,
		title: 'Realtime demo',
		author: 'Min',
		status: 'scheduled',
		score: 78,
		owner: {
			ref: ids.userBen,
			name: 'Design Ops',
			team: 'studio',
			contacts: {
				lead: { name: 'Ben Kim', userRef: ids.userBen },
				backup: { name: 'Yuri', userRef: ids.agentYuri },
			},
		},
		tags: ['websocket', 'ux'],
		metrics: {
			views: 880,
			shares: 16,
			comments: 8,
			relatedDocuments: [ids.eventKickoff, ids.ticketOne],
		},
		agenda: {
			topics: [{ title: 'Live syncing', docRef: ids.eventKickoff }, { title: 'Latency tuning', docRef: ids.ticketTwo }],
			location: { building: 'A', room: '301' },
		},
		createdAt: '2026-05-19T04:45:00.000Z',
	},
	{
		_id: ids.eventHackathon,
		title: 'Campus hackathon',
		author: 'Sora',
		status: 'draft',
		score: 64,
		owner: {
			ref: ids.userAria,
			name: 'Engineering',
			team: 'platform',
			lead: { name: 'Aria Lee', userRef: ids.userAria },
		},
		tags: ['mongodb', 'builders', 'students'],
		metrics: { views: 510, shares: 9, comments: 4, relatedDocuments: [ids.clubBuilders, ids.userBen] },
		participants: {
			mentors: [ids.userAria, ids.agentHae],
			clubs: [{ clubRef: ids.clubBuilders }, { clubRef: ids.clubDesign }],
		},
		createdAt: '2026-05-20T16:20:00.000Z',
	},
];

const createUserDocuments = (): Document[] => [
	{
		_id: ids.userAria,
		name: 'Aria Lee',
		email: 'aria@campus.live',
		role: 'admin',
		profile: {
			department: 'growth',
			departmentRef: ids.clubBuilders,
			address: {
				city: 'Seoul',
				country: 'KR',
				zip: '04524',
				geo: { lat: 37.5665, lng: 126.978 },
				building: { campus: 'Main', floor: 4, room: '410' },
			},
			preferences: { theme: 'light', notifications: true, shortcuts: { commandPalette: true, compactRows: false } },
			emergencyContact: { name: 'Ben Kim', userRef: ids.userBen },
		},
		projects: [{ name: 'events', ref: ids.eventKickoff }, { name: 'launches', ref: ids.eventRealtime }],
		team: { clubRef: ids.clubBuilders, mentorRef: ids.agentYuri },
		lastActiveAt: '2026-05-30T12:30:00.000Z',
	},
	{
		_id: ids.userBen,
		name: 'Ben Kim',
		email: 'ben@campus.live',
		role: 'editor',
		profile: {
			department: 'studio',
			departmentRef: ids.clubDesign,
			address: {
				city: 'Busan',
				country: 'KR',
				zip: '48059',
				geo: { lat: 35.1796, lng: 129.0756 },
				building: { campus: 'Harbor', floor: 2, room: '210' },
			},
			preferences: { theme: 'soft', notifications: false, shortcuts: { commandPalette: false, compactRows: true } },
			emergencyContact: { name: 'Aria Lee', userRef: ids.userAria },
		},
		projects: [{ name: 'design-system', ref: ids.productCanvas }, { name: 'motion', ref: ids.eventRealtime }],
		team: { clubRef: ids.clubDesign, mentorRef: ids.agentHae },
		lastActiveAt: '2026-05-30T09:05:00.000Z',
	},
	{
		_id: ids.userMina,
		name: 'Mina Park',
		email: 'mina@campus.live',
		role: 'manager',
		profile: {
			department: 'sales',
			departmentRef: ids.clubBuilders,
			address: { city: 'Incheon', country: 'KR', zip: '22101', geo: { lat: 37.4563, lng: 126.7052 } },
			preferences: { theme: 'light', notifications: true, shortcuts: { commandPalette: true, compactRows: true } },
			assistant: { userRef: ids.userBen, backupRef: ids.userAria },
		},
		projects: [{ name: 'commerce', ref: ids.orderOne }, { name: 'merch', ref: ids.productOrbit }],
		lastActiveAt: '2026-05-29T14:11:00.000Z',
	},
	{
		_id: ids.userDaniel,
		name: 'Daniel Choi',
		email: 'daniel@campus.live',
		role: 'support',
		profile: {
			department: 'operations',
			departmentRef: ids.clubDesign,
			address: { city: 'Daegu', country: 'KR', zip: '41510', geo: { lat: 35.8714, lng: 128.6014 } },
			preferences: { theme: 'soft', notifications: false, shortcuts: { commandPalette: false, compactRows: false } },
			reportsTo: { userRef: ids.userMina },
		},
		projects: [{ name: 'support-queue', ref: ids.ticketOne }],
		lastActiveAt: '2026-05-28T08:00:00.000Z',
	},
];

const createClubDocuments = (): Document[] => [
	{
		_id: ids.clubBuilders,
		name: 'Builders Club',
		type: 'community',
		members: 128,
		meta: { color: 'green', meetingDay: 'friday', locationRef: ids.eventKickoff },
		lead: { userRef: ids.userAria, assistantRef: ids.userBen },
		structure: {
			channels: [{ name: 'general', pinnedDocRef: ids.eventRealtime }],
			resources: { handbook: { docRef: ids.eventHackathon }, FAQ: { docRef: ids.ticketOne } },
		},
	},
	{
		_id: ids.clubDesign,
		name: 'Design Circle',
		type: 'creative',
		members: 84,
		meta: { color: 'amber', meetingDay: 'wednesday', locationRef: ids.eventRealtime },
		lead: { userRef: ids.userBen, assistantRef: ids.userAria },
		structure: {
			channels: [{ name: 'reviews', pinnedDocRef: ids.productCanvas }],
			resources: { handbook: { docRef: ids.eventKickoff }, inspiration: { docRef: ids.eventHackathon } },
		},
	},
];

const createProductDocuments = (): Document[] => [
	{
		_id: ids.productOrbit,
		name: 'Orbit Chair',
		category: 'furniture',
		price: 249,
		inventory: { stock: 34, reserved: 6, warehouse: { hub: 'east', aisle: 'B-14', supervisorRef: ids.userMina } },
		variants: ['sage', 'charcoal', 'sand'],
		attributes: { material: 'mesh', warrantyYears: 3, supplierRef: ids.userDaniel },
		related: { bundleRefs: [ids.productNorth, ids.productCanvas], featuredIn: { docRef: ids.orderOne } },
	},
	{
		_id: ids.productNorth,
		name: 'North Lamp',
		category: 'lighting',
		price: 89,
		inventory: { stock: 102, reserved: 11, warehouse: { hub: 'north', aisle: 'A-04', supervisorRef: ids.userBen } },
		variants: ['warm', 'daylight'],
		attributes: { material: 'aluminum', warrantyYears: 2, supplierRef: ids.userMina },
		related: { bundleRefs: [ids.productOrbit], featuredIn: { docRef: ids.eventRealtime } },
	},
	{
		_id: ids.productCanvas,
		name: 'Canvas Desk',
		category: 'workspace',
		price: 399,
		inventory: { stock: 18, reserved: 2, warehouse: { hub: 'west', aisle: 'D-01', supervisorRef: ids.userAria } },
		variants: ['oak', 'white'],
		attributes: { material: 'birch', warrantyYears: 5, supplierRef: ids.userDaniel },
		related: { bundleRefs: [ids.productOrbit, ids.productNorth], featuredIn: { docRef: ids.orderTwo } },
	},
];

const createOrderDocuments = (): Document[] => [
	{
		_id: ids.orderOne,
		orderNo: 'R-24051',
		customer: { name: 'Mina Park', segment: 'pro', customerRef: ids.userMina, loyaltyRef: ids.clubBuilders },
		status: 'paid',
		items: [
			{ sku: 'orbit-chair', quantity: 2, price: 249, productRef: ids.productOrbit },
			{ sku: 'north-lamp', quantity: 1, price: 89, productRef: ids.productNorth },
		],
		summary: { subtotal: 587, shipping: 20, total: 607, currency: 'KRW' },
		fulfillment: {
			assignedTo: ids.agentYuri,
			shipping: { providerRef: ids.userDaniel, tracking: { currentHub: 'Incheon', lastScanRef: ids.ticketOne } },
		},
		timeline: [{ step: 'created', actorRef: ids.userMina }, { step: 'paid', actorRef: ids.userDaniel }],
	},
	{
		_id: ids.orderTwo,
		orderNo: 'R-24052',
		customer: { name: 'Daniel Choi', segment: 'new', customerRef: ids.userDaniel, loyaltyRef: ids.clubDesign },
		status: 'processing',
		items: [{ sku: 'canvas-desk', quantity: 1, price: 399, productRef: ids.productCanvas }],
		summary: { subtotal: 399, shipping: 35, total: 434, currency: 'KRW' },
		fulfillment: {
			assignedTo: ids.agentHae,
			shipping: { providerRef: ids.userAria, tracking: { currentHub: 'Busan', lastScanRef: ids.ticketTwo } },
		},
		timeline: [{ step: 'created', actorRef: ids.userDaniel }, { step: 'processing', actorRef: ids.agentHae }],
	},
];

const createTicketDocuments = (): Document[] => [
	{
		_id: ids.ticketOne,
		ticketNo: 'SUP-1201',
		title: 'Import stuck on validation',
		priority: 'high',
		assignee: { name: 'Yuri', team: 'support', agentRef: ids.agentYuri },
		requester: { userRef: ids.userMina, orderRef: ids.orderOne },
		status: 'open',
		meta: { channel: 'web', impact: 'high', relatedDocRef: ids.orderOne },
		history: [
			{ actorRef: ids.userDaniel, action: 'opened' },
			{ actorRef: ids.agentYuri, action: 'reviewed' },
		],
	},
	{
		_id: ids.ticketTwo,
		ticketNo: 'SUP-1202',
		title: 'ChangeStream callback not firing',
		priority: 'medium',
		assignee: { name: 'Hae', team: 'platform', agentRef: ids.agentHae },
		requester: { userRef: ids.userAria, orderRef: ids.orderTwo },
		status: 'in-progress',
		meta: { channel: 'email', impact: 'medium', relatedDocRef: ids.eventRealtime },
		history: [
			{ actorRef: ids.userAria, action: 'reported' },
			{ actorRef: ids.agentHae, action: 'investigating' },
		],
	},
];

const createAgentDocuments = (): Document[] => [
	{
		_id: ids.agentYuri,
		name: 'Yuri',
		shift: 'day',
		skills: ['validation', 'ops'],
		metrics: { closedToday: 12, avgHandleMins: 6.8, ticketRefs: [ids.ticketOne, ids.ticketTwo] },
		profile: { managerRef: ids.userMina, teamRef: ids.clubDesign, workspace: { floor: 3, desk: 'D-12' } },
		assignedTicketRefs: [ids.ticketOne],
	},
	{
		_id: ids.agentHae,
		name: 'Hae',
		shift: 'night',
		skills: ['api', 'websocket'],
		metrics: { closedToday: 9, avgHandleMins: 7.4, ticketRefs: [ids.ticketTwo] },
		profile: { managerRef: ids.userDaniel, teamRef: ids.clubBuilders, workspace: { floor: 2, desk: 'B-07' } },
		assignedTicketRefs: [ids.ticketTwo],
	},
];

function createCollection(name: string, label: string, description: string, documents: Document[]): MockCollectionRecord {
	return {
		name,
		label,
		description,
		documents,
		updatedAt: now(),
	};
}

function createDatabase(name: string, label: string, description: string, collections: Record<string, MockCollectionRecord>): MockDatabaseRecord {
	return {
		name,
		label,
		description,
		collections,
		updatedAt: now(),
	};
}

function createSeedSnapshot(): MockSnapshot {
	return {
		version: 2,
		activeDatabase: 'campus-live',
		databases: {
			'campus-live': createDatabase('campus-live', 'Campus Live', 'Realtime campus publishing and events demo', {
				events: createCollection('events', 'Events', 'Live event feed used for dashboard validation', createEventDocuments()),
				users: createCollection('users', 'Users', 'Operator and editor accounts for the demo workspace', createUserDocuments()),
				clubs: createCollection('clubs', 'Clubs', 'Campus clubs and communities', createClubDocuments()),
			}),
			'retail-hub': createDatabase('retail-hub', 'Retail Hub', 'Commerce data set with catalog and orders', {
				products: createCollection('products', 'Products', 'Merchandise catalog', createProductDocuments()),
				orders: createCollection('orders', 'Orders', 'Purchase activity for the catalog', createOrderDocuments()),
				customers: createCollection('customers', 'Customers', 'Buyer profiles and segments', createUserDocuments()),
			}),
			'support-hub': createDatabase('support-hub', 'Support Hub', 'Help desk queue and operations team', {
				tickets: createCollection('tickets', 'Tickets', 'Open support cases', createTicketDocuments()),
				agents: createCollection('agents', 'Agents', 'Support staff roster', createAgentDocuments()),
			}),
		},
		updatedAt: now(),
	};
}

function hasLocalStorage() {
	return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function cloneSnapshot(snapshot: MockSnapshot): MockSnapshot {
	return JSON.parse(JSON.stringify(snapshot)) as MockSnapshot;
}

function normalizeSnapshot(raw: unknown): MockSnapshot | null {
	if (!raw || typeof raw !== 'object') {
		return null;
	}

	const candidate = raw as MockSnapshot;
	if (!candidate.databases || typeof candidate.activeDatabase !== 'string') {
		return null;
	}

	if (candidate.version !== 2) {
		return null;
	}

	return candidate;
}

export function readSnapshot(): MockSnapshot {
	if (!hasLocalStorage()) {
		return cloneSnapshot(createSeedSnapshot());
	}

	const rawValue = window.localStorage.getItem(STORAGE_KEY);
	if (!rawValue) {
		const seed = createSeedSnapshot();
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
		return cloneSnapshot(seed);
	}

	try {
		const parsed = normalizeSnapshot(JSON.parse(rawValue));
		if (parsed) {
			return cloneSnapshot(parsed);
		}
	} catch {
		// fall through to seed snapshot
	}

	const seed = createSeedSnapshot();
	window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
	return cloneSnapshot(seed);
}

export function writeSnapshot(snapshot: MockSnapshot) {
	const nextSnapshot = cloneSnapshot(snapshot);
	nextSnapshot.updatedAt = now();

	if (hasLocalStorage()) {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSnapshot));
	}

	return nextSnapshot;
}

export function exportSnapshotString(): string {
	return JSON.stringify(readSnapshot(), null, 2);
}

export function importSnapshotString(serialized: string): MockSnapshot {
	const parsed = normalizeSnapshot(JSON.parse(serialized));
	if (!parsed) {
		throw new Error('Invalid mock snapshot payload');
	}

	return writeSnapshot(parsed);
}

export function resetSnapshot(): MockSnapshot {
	const seed = createSeedSnapshot();
	return writeSnapshot(seed);
}

export function getDatabaseSummaries(snapshot: MockSnapshot): Array<{ name: string; label: string; description: string; collectionCount: number; documentCount: number; updatedAt: number }> {
	return Object.values(snapshot.databases).map((database) => {
		const collectionValues = Object.values(database.collections);
		const documentCount = collectionValues.reduce((total, collection) => total + collection.documents.length, 0);

		return {
			name: database.name,
			label: database.label,
			description: database.description,
			collectionCount: collectionValues.length,
			documentCount,
			updatedAt: database.updatedAt,
		};
	});
}

export function getCollectionSummaries(snapshot: MockSnapshot, databaseName: string) {
	const database = snapshot.databases[databaseName];
	if (!database) {
		return [];
	}

	return Object.values(database.collections).map((collection) => ({
		name: collection.name,
		label: collection.label,
		description: collection.description,
		documentCount: collection.documents.length,
		sizeMb: Math.max(1, Math.round(collection.documents.length * 0.18)),
		updatedAt: collection.updatedAt,
	}));
}

export function getDocuments(snapshot: MockSnapshot, databaseName: string, collectionName: string): Document[] {
	const database = snapshot.databases[databaseName];
	const collection = database?.collections[collectionName];
	return collection ? cloneSnapshot({ ...snapshot, databases: snapshot.databases }).databases[databaseName].collections[collectionName].documents : [];
}

export function getDocumentSummaries(snapshot: MockSnapshot, databaseName: string, collectionName: string): Array<{ id: string; title: string; preview: string; fieldCount: number; updatedAt: number }> {
	return getDocuments(snapshot, databaseName, collectionName).map((document) => {
		const keys = Object.keys(document);
		const identifier = (document._id as BsonObjectId | undefined)?.$oid ?? 'unknown';
		const title = typeof document.title === 'string' ? document.title : typeof document.name === 'string' ? document.name : identifier.slice(-6);
		const preview = keys
			.filter((key) => key !== '_id')
			.slice(0, 3)
			.map((key) => `${key}: ${formatPreview(document[key])}`)
			.join(' · ');

		return {
			id: identifier,
			title,
			preview,
			fieldCount: keys.length,
			updatedAt: now(),
		};
	});
}

function formatPreview(value: unknown) {
	if (Array.isArray(value)) {
		return `[${value.length}]`;
	}

	if (value && typeof value === 'object') {
		if ('$oid' in (value as Record<string, unknown>)) {
			return 'ObjectId';
		}

		return '{...}';
	}

	if (typeof value === 'string') {
		return value.length > 18 ? `${value.slice(0, 18)}…` : value;
	}

	if (value === null) {
		return 'null';
	}

	return String(value);
}

export function replaceSnapshot(snapshot: MockSnapshot) {
	return writeSnapshot(snapshot);
}
