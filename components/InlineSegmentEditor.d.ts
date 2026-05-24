import { Document } from '../types/explorer';
import { JsonPathSegment } from '../types/explorer-ui';
interface InlineSegmentEditorProps {
    mode: 'collection' | 'document' | 'field';
    parentPath?: JsonPathSegment[];
    parentIsArray?: boolean;
    nextArrayIndex?: number;
    rootDocumentId?: string | null;
    onCancel: () => void;
    onSubmitField?: (rootId: string, path: JsonPathSegment[], segment: JsonPathSegment, value: unknown) => void;
    onSubmitDocument?: (doc: Document) => void;
    onSubmitCollection?: (name: string) => void;
}
export declare function InlineSegmentEditor({ mode, parentPath, parentIsArray, nextArrayIndex, rootDocumentId, onCancel, onSubmitField, onSubmitDocument, onSubmitCollection, }: InlineSegmentEditorProps): import("react/jsx-runtime").JSX.Element;
export default InlineSegmentEditor;
