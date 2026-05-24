import { DbCatalog, Document } from '../types/explorer';
interface FloatingDataManagerProps {
    isOpen: boolean;
    onToggle: () => void;
    catalogs: DbCatalog[];
    activeDatabase: string | null;
    activeCollection: string | null;
    activeDocument: Document | null;
    documents: Document[];
    onSelectDatabase: (database: string) => void;
    onSelectCollection: (collection: string) => void;
    onAddDatabase: (name: string) => void;
    onRemoveDatabase: (name: string) => void;
    onAddCollection: (database: string, name: string) => void;
    onRemoveCollection: (database: string, name: string) => void;
    onImportJson: (text: string, targetDocumentId?: string | null) => void;
}
export declare function FloatingDataManager({ isOpen, onToggle, catalogs, activeDatabase, activeCollection, activeDocument, onSelectDatabase, onSelectCollection, onAddDatabase, onRemoveDatabase, onAddCollection, onRemoveCollection, documents, onImportJson, }: FloatingDataManagerProps): import("react/jsx-runtime").JSX.Element;
export {};
