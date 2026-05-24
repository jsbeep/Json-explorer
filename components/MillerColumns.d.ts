import { CatalogEntry, Document } from '../types/explorer';
import { ExplorerColumn, JsonHighlight, JsonPathSegment } from '../types/explorer-ui';
interface MillerColumnsProps {
    columns: ExplorerColumn[];
    collections: CatalogEntry[];
    activeCollection: string | null;
    documents: Document[];
    activeDocumentId: string | null;
    highlight: JsonHighlight;
    checkValidReference: (oid: string) => Document | null;
    onSelectCollection: (collection: string) => void;
    onSelectDocument: (doc: Document) => void;
    onRemoveDocument: (id: string) => void;
    onOpenJsonPath: (columnDepth: number, segment: JsonPathSegment, primitiveValue?: boolean) => void;
    onUpdateJsonValue: (rootDocumentId: string, path: JsonPathSegment[], value: unknown) => void;
    onAddDocument?: (doc: Document) => void;
    onAddCollection?: (name: string) => void;
    onOpenManager: () => void;
}
export declare function MillerColumns({ columns, collections, activeCollection, documents, activeDocumentId, highlight, checkValidReference, onSelectCollection, onSelectDocument, onRemoveDocument, onOpenJsonPath, onUpdateJsonValue, onAddDocument, onAddCollection, onOpenManager, }: MillerColumnsProps): import("react/jsx-runtime").JSX.Element;
export {};
