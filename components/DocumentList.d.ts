import { Document } from '../types/explorer';
interface DocumentListProps {
    documents: Document[];
    activeDocumentId: string | null;
    onSelectDocument: (doc: Document) => void;
    onRemoveDocument: (id: string) => void;
    onOpenManager: () => void;
    onAddDocument?: (doc: Document) => void;
}
export declare function DocumentList({ documents, activeDocumentId, onSelectDocument, onRemoveDocument, onOpenManager, onAddDocument, }: DocumentListProps): import("react/jsx-runtime").JSX.Element;
export {};
