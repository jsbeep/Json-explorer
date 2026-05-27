import { useMemo, useState } from 'react';
import type { DbCatalog, Document, QueryResult } from '../types/explorer';
import { Header } from '../components/Header';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { MillerColumns } from '../components/MillerColumns';
import { FloatingDataManager } from '../components/FloatingDataManager';
import { useExplorerState } from '../hooks/useExplorerState';
import { cn } from '../utils/cn';
import { extractOid } from '../utils/oid';

const styles = {
  page: 'h-screen w-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.16),_transparent_45%),linear-gradient(180deg,#f8fafc_0%,#ffffff_45%,#f1f5f9_100%)] text-slate-900',
  container: 'flex h-full flex-col gap-4 px-4 py-4 sm:px-6 sm:py-6',
  viewport: 'flex-1 overflow-hidden rounded-[18px] border border-slate-200 bg-white/80 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur',
  viewportInner: 'flex h-full flex-col gap-3 sm:gap-4',
};

const mockCatalogs: DbCatalog[] = [
  {
    database: 'campus-live',
    status: { state: 'primary', oplogSizeMb: 512, lagMs: 0 },
    fetchedAt: Date.now(),
    collections: [
      {
        collection: {
          name: 'events',
          documentCount: 156,
          sizeMb: 38,
          indexCount: 2,
          hasChangeStreamSupport: true,
        },
        indexes: [],
      },
      {
        collection: {
          name: 'users',
          documentCount: 84,
          sizeMb: 14,
          indexCount: 2,
          hasChangeStreamSupport: true,
        },
        indexes: [],
      },
      {
        collection: {
          name: 'clubs',
          documentCount: 52,
          sizeMb: 9,
          indexCount: 3,
          hasChangeStreamSupport: true,
        },
        indexes: [],
      },
    ],
  },
  {
    database: 'side-hustle',
    status: { state: 'secondary', oplogSizeMb: 256, lagMs: 124 },
    fetchedAt: Date.now(),
    collections: [
      {
        collection: {
          name: 'ideas',
          documentCount: 18,
          sizeMb: 3,
          indexCount: 1,
          hasChangeStreamSupport: true,
        },
        indexes: [],
      },
      {
        collection: {
          name: 'orders',
          documentCount: 32,
          sizeMb: 6,
          indexCount: 2,
          hasChangeStreamSupport: true,
        },
        indexes: [],
      },
      {
        collection: {
          name: 'products',
          documentCount: 18,
          sizeMb: 4,
          indexCount: 1,
          hasChangeStreamSupport: true,
        },
        indexes: [],
      },
    ],
  },
];

const mockQueryByCollection: Record<string, QueryResult<Document>> = {
  'campus-live::events': {
    status: 'ok',
    data: [
      {
        _id: { $oid: '664efb9ea1c0c9b439a5f001' },
        title: 'Kickoff update',
        author: 'Jina',
        status: 'live',
        score: 92,
        owner: { id: 'u-102', name: 'Jina Kim', profile: { major: 'CS', year: 3 } },
        tags: ['campus', 'stream', 'realtime'],
        metrics: { engagement: { day: 3, week: 12 } },
      },
      {
        _id: { $oid: '664efb9ea1c0c9b439a5f002' },
        title: 'Realtime demo',
        author: 'Marco',
        status: 'draft',
        score: 76,
        draft: {
          sections: [
            { title: 'overview', blocks: [{ type: 'text', value: 'First draft notes.' }] },
            { title: 'metrics', blocks: [{ type: 'chart', value: { kind: 'line', points: [1, 4, 9, 7] } }] },
          ],
        },
        refs: { primary: { $oid: '664efb9ea1c0c9b439a5f003' }, siblings: [{ $oid: '664efb9ea1c0c9b439a5f001' }] },
      },
      {
        _id: { $oid: '664efb9ea1c0c9b439a5f003' },
        title: 'Campus hackathon',
        author: 'Yuna',
        status: 'hot',
        score: 88,
        schedule: {
          stages: [
            { label: 'Registration', slots: 120 },
            { label: 'Mentoring', slots: 20 },
            { label: 'Pitch', slots: 10 },
          ],
          window: { from: 1716450000000, to: 1716536400000 },
        },
      },
    ],
    meta: {
      collection: 'events',
      range: { type: 'all' },
      executedAt: Date.now(),
      durationMs: 42,
    },
    total: 3,
  },
  'campus-live::clubs': {
    status: 'ok',
    data: [
      {
        _id: { $oid: '664efb9ea1c0c9b439a6c201' },
        name: 'Robotics Lab',
        lead: { name: 'Hana', year: 4 },
        members: 28,
        focus: ['automation', 'hardware'],
        socials: { instagram: '@robotlab', discord: 'robotics-lab' },
      },
      {
        _id: { $oid: '664efb9ea1c0c9b439a6c202' },
        name: 'Fintech Society',
        lead: { name: 'Minho', year: 3 },
        members: 42,
        activeProjects: ['ledger', 'analytics'],
        contacts: { email: 'fintech@campus.live', office: 'B-402' },
      },
    ],
    meta: {
      collection: 'clubs',
      range: { type: 'all' },
      executedAt: Date.now(),
      durationMs: 33,
    },
    total: 2,
  },
  'campus-live::users': {
    status: 'ok',
    data: [
      {
        _id: { $oid: '664efb9ea1c0c9b439a7d501' },
        name: 'Sora Park',
        role: 'organizer',
        profile: { major: 'Design', year: 2, timezone: 'Asia/Seoul' },
        socials: { github: 'sora-park', twitter: '@sora' },
      },
      {
        _id: { $oid: '664efb9ea1c0c9b439a7d502' },
        name: 'Leo Kang',
        role: 'mentor',
        profile: { major: 'Robotics', year: 4, timezone: 'Asia/Seoul' },
        stats: { sessions: 12, rating: 4.8 },
      },
    ],
    meta: {
      collection: 'users',
      range: { type: 'all' },
      executedAt: Date.now(),
      durationMs: 31,
    },
    total: 2,
  },
  'side-hustle::ideas': {
    status: 'ok',
    data: [
      {
        _id: { $oid: '664efb9ea1c0c9b439b1d301' },
        title: 'AI tutor micro-saas',
        stage: 'validate',
        target: { region: 'apac', segment: 'students' },
        pricing: { monthly: 9, yearly: 90 },
        owners: ['u-201', 'u-204'],
      },
      {
        _id: { $oid: '664efb9ea1c0c9b439b1d302' },
        title: 'Local events radar',
        stage: 'prototype',
        target: { region: 'us', segment: 'creators' },
        traction: { waitlist: 140, newsletters: 3 },
        owners: ['u-203'],
      },
    ],
    meta: {
      collection: 'ideas',
      range: { type: 'all' },
      executedAt: Date.now(),
      durationMs: 27,
    },
    total: 2,
  },
  'side-hustle::orders': {
    status: 'ok',
    data: [
      {
        _id: { $oid: '664efb9ea1c0c9b439b2e401' },
        customer: { id: 'u-301', name: 'Alex' },
        items: [
          { sku: 'wireless-mic', qty: 1, price: 129 },
          { sku: 'audio-kit', qty: 2, price: 49 },
        ],
        status: 'packing',
        delivery: { etaDays: 2, carrier: 'FastShip' },
        productRefs: [{ $oid: '664efb9ea1c0c9b439b3f501' }],
      },
      {
        _id: { $oid: '664efb9ea1c0c9b439b2e402' },
        customer: { id: 'u-309', name: 'Chloe' },
        items: [{ sku: 'studio-light', qty: 1, price: 89 }],
        status: 'delivered',
        delivery: { etaDays: 0, carrier: 'FastShip' },
        productRefs: [{ $oid: '664efb9ea1c0c9b439b3f502' }],
      },
    ],
    meta: {
      collection: 'orders',
      range: { type: 'all' },
      executedAt: Date.now(),
      durationMs: 29,
    },
    total: 2,
  },
  'side-hustle::products': {
    status: 'ok',
    data: [
      {
        _id: { $oid: '664efb9ea1c0c9b439b3f501' },
        name: 'Wireless Mic',
        category: 'audio',
        price: 129,
        stock: { available: 52, reserved: 4 },
        tags: ['creator', 'portable'],
      },
      {
        _id: { $oid: '664efb9ea1c0c9b439b3f502' },
        name: 'Studio Light',
        category: 'lighting',
        price: 89,
        stock: { available: 18, reserved: 1 },
        tags: ['studio', 'budget'],
      },
    ],
    meta: {
      collection: 'products',
      range: { type: 'all' },
      executedAt: Date.now(),
      durationMs: 26,
    },
    total: 2,
  },
};

export interface ExplorerPageProps {
  catalogs?: DbCatalog[];
  queryResult?: QueryResult<Document>;
  className?: string;
}

const normalizeDocumentId = (doc: Document | null) => (doc ? extractOid(doc._id) : null);

export function ExplorerPage({ catalogs = mockCatalogs, queryResult, className }: ExplorerPageProps) {
  const explorer = useExplorerState({ catalogs, queryResult, seedQueryByCollection: mockQueryByCollection });
  const [managerOpen, setManagerOpen] = useState(true);

  const collections = useMemo(
    () => explorer.catalogs.find((entry) => entry.database === explorer.activeDatabase)?.collections ?? [],
    [explorer.catalogs, explorer.activeDatabase]
  );

  const activeDocumentId = normalizeDocumentId(explorer.activeDocument);

  return (
    <div className={cn(styles.page, className)}>
      <div className={styles.container}>
        <Header
          catalogs={explorer.catalogs}
          activeDatabase={explorer.activeDatabase}
          onSelectDatabase={explorer.selectDatabase}
        />
        <main className={styles.viewport}>
          <div className={styles.viewportInner}>
            <Breadcrumbs
              activeDatabase={explorer.activeDatabase}
              activeCollection={explorer.activeCollection}
              activeDocumentId={activeDocumentId}
              pathSegments={explorer.breadcrumbSegments}
              onSelectPathDepth={explorer.setJsonPathDepth}
            />
            <div className="flex-1 overflow-hidden">
              <MillerColumns
                columns={explorer.columns}
                collections={collections}
                activeCollection={explorer.activeCollection}
                documents={explorer.documents}
                activeDocumentId={activeDocumentId}
                highlight={explorer.highlight}
                checkValidReference={explorer.checkValidReference}
                onSelectCollection={explorer.selectCollection}
                onSelectDocument={explorer.selectDocument}
                onRemoveDocument={explorer.removeDocumentById}
                onOpenJsonPath={explorer.openJsonPath}
                onUpdateJsonValue={explorer.updateJsonValue}
                onAddDocument={explorer.addDocument}
                onAddCollection={(name) => {
                  if (!explorer.activeDatabase) return;
                  explorer.addCollection(explorer.activeDatabase, name);
                }}
                onOpenManager={() => setManagerOpen(true)}
              />
            </div>
          </div>
        </main>
      </div>

      <FloatingDataManager
        isOpen={managerOpen}
        onToggle={() => setManagerOpen((prev) => !prev)}
        catalogs={explorer.catalogs}
        activeDatabase={explorer.activeDatabase}
        activeCollection={explorer.activeCollection}
        activeDocument={explorer.activeDocument}
        documents={explorer.documents}
        onSelectDatabase={explorer.selectDatabase}
        onSelectCollection={explorer.selectCollection}
        onAddDatabase={explorer.addDatabase}
        onRemoveDatabase={explorer.removeDatabase}
        onAddCollection={explorer.addCollection}
        onRemoveCollection={explorer.removeCollection}
        onImportJson={explorer.importJsonText}
      />
    </div>
  );
}
