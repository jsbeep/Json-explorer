export type Document = Record<string, unknown>;
export type DbStatus = {
    state: "primary";
    oplogSizeMb: number;
    lagMs: 0;
} | {
    state: "secondary";
    oplogSizeMb: number;
    lagMs: number;
} | {
    state: "arbiter";
} | {
    state: "startup";
} | {
    state: "unknown";
    reason: string;
};
export type CollectionStat = {
    name: string;
    documentCount: number;
    sizeMb: number;
    indexCount: number;
    hasChangeStreamSupport: boolean;
};
export type IndexInfo = {
    name: string;
    keys: Record<string, 1 | -1 | "text" | "2dsphere">;
    unique: boolean;
    sparse: boolean;
    ttlSecs?: number;
};
export type CatalogEntry = {
    collection: CollectionStat;
    indexes: IndexInfo[];
    validator?: Document;
};
export type DbCatalog = {
    database: string;
    status: DbStatus;
    collections: CatalogEntry[];
    fetchedAt: number;
};
export type QueryRange = {
    type: "all";
} | {
    type: "paginated";
    page: number;
    pageSize: number;
} | {
    type: "time";
    from: number;
    to: number;
} | {
    type: "cursor";
    afterId: string;
    limit: number;
};
export type QueryMeta = {
    collection: string;
    range: QueryRange;
    executedAt: number;
    durationMs: number;
};
export type QueryResult<T = Document> = {
    status: "ok";
    data: T[];
    meta: QueryMeta;
    total?: number;
} | {
    status: "empty";
    meta: QueryMeta;
} | {
    status: "partial";
    data: T[];
    meta: QueryMeta;
    reason: "timeout" | "size-limit";
} | {
    status: "no-permission";
    collection: string;
} | {
    status: "invalid-range";
    error: string;
};
export type TimeWindow = {
    type: "last";
    amount: number;
    unit: "minutes" | "hours" | "days";
} | {
    type: "fixed";
    from: number;
    to: number;
} | {
    type: "open";
    from: number;
};
export type FieldFilter = {
    op: "eq";
    field: string;
    value: unknown;
} | {
    op: "in";
    field: string;
    values: unknown[];
} | {
    op: "range";
    field: string;
    gte?: unknown;
    lte?: unknown;
} | {
    op: "exists";
    field: string;
    exists: boolean;
} | {
    op: "and";
    filters: FieldFilter[];
} | {
    op: "or";
    filters: FieldFilter[];
};
export type ViewScope = {
    collection: string;
    timeWindow: TimeWindow;
    filters: FieldFilter[];
    fields?: string[];
    sortBy?: {
        field: string;
        dir: "asc" | "desc";
    };
};
export type WatchRequest = {
    sessionId: string;
    collection: string;
    pipeline?: Document[];
    scope: ViewScope;
    resumeAfter?: string;
    throttleMs?: number;
};
export type FriendlyPatchEvent = {
    field: string;
    op: "updated" | "added" | "removed";
    oldValue?: unknown;
    newValue?: unknown;
};
export type ChangeResponse = {
    type: "patch";
    patch: FriendlyPatchEvent[];
} | {
    type: "replace";
    data: Document[];
} | {
    type: "invalidate";
    reason: "collection-dropped" | "collection-renamed";
} | {
    type: "system";
    action: "permission-revoked" | "force-disconnect";
};
