import { DbCatalog } from '../types/explorer';
interface HeaderProps {
    catalogs: DbCatalog[];
    activeDatabase: string | null;
    onSelectDatabase: (database: string) => void;
}
export declare function Header({ catalogs, activeDatabase, onSelectDatabase }: HeaderProps): import("react/jsx-runtime").JSX.Element;
export {};
