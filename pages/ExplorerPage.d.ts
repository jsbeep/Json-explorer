import { DbCatalog, Document, QueryResult } from '../types/explorer';
export interface ExplorerPageProps {
    catalogs?: DbCatalog[];
    queryResult?: QueryResult<Document>;
    className?: string;
}
export declare function ExplorerPage({ catalogs, queryResult, className }: ExplorerPageProps): import("react/jsx-runtime").JSX.Element;
