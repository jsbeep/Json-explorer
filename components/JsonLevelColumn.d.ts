import { Document } from '../types/explorer';
import { JsonHighlight, JsonPathSegment } from '../types/explorer-ui';
interface JsonLevelColumnProps {
    title: string;
    value: unknown;
    path: JsonPathSegment[];
    rootDocumentId: string | null;
    columnDepth: number;
    highlight: JsonHighlight;
    allowPrimitiveClick: boolean;
    isReferenceColumn?: boolean;
    activeSegment?: JsonPathSegment | null;
    checkValidReference: (oid: string) => Document | null;
    onOpenManager: () => void;
    onOpenPath: (columnDepth: number, segment: JsonPathSegment, primitiveValue?: boolean) => void;
    onUpdateValue: (rootId: string, path: JsonPathSegment[], value: unknown) => void;
}
export declare function JsonLevelColumn({ title, value, path, rootDocumentId, columnDepth, highlight, allowPrimitiveClick, isReferenceColumn, activeSegment, checkValidReference, onOpenManager, onOpenPath, onUpdateValue, }: JsonLevelColumnProps): import("react/jsx-runtime").JSX.Element;
export {};
