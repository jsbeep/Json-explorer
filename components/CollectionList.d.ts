import { CatalogEntry } from '../types/explorer';
interface CollectionListProps {
    collections: CatalogEntry[];
    activeCollection: string | null;
    onSelectCollection: (collection: string) => void;
    onOpenManager: () => void;
    onAddCollection?: (name: string) => void;
}
export declare function CollectionList({ collections, activeCollection, onSelectCollection, onOpenManager, onAddCollection, }: CollectionListProps): import("react/jsx-runtime").JSX.Element;
export {};
