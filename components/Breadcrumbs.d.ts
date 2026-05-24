interface BreadcrumbsProps {
    activeDatabase: string | null;
    activeCollection: string | null;
    activeDocumentId: string | null;
    pathSegments: string[];
    onSelectPathDepth?: (depth: number) => void;
}
export declare function Breadcrumbs({ activeDatabase, activeCollection, activeDocumentId, pathSegments, onSelectPathDepth, }: BreadcrumbsProps): import("react/jsx-runtime").JSX.Element;
export {};
