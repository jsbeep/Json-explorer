export type JsonPathSegment = {
    type: 'key';
    key: string;
} | {
    type: 'index';
    index: number;
} | {
    type: 'reference';
    id: string;
};
export type ExplorerColumn = {
    id: string;
    type: 'collections';
    title: string;
} | {
    id: string;
    type: 'documents';
    title: string;
} | {
    id: string;
    type: 'json';
    title: string;
    value: unknown;
    path: JsonPathSegment[];
    rootDocumentId: string | null;
    depth: number;
    isReferenceColumn?: boolean;
    activeSegment?: JsonPathSegment | null;
};
export type JsonHighlight = {
    rootId: string | null;
    pathKey: string | null;
    timestamp: number;
};
