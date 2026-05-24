import type { CatalogEntry, Document } from '../types/explorer';
import type { ExplorerColumn, JsonHighlight, JsonPathSegment } from '../types/explorer-ui';
import { CollectionList } from './CollectionList';
import { DocumentList } from './DocumentList';
import { JsonLevelColumn } from './JsonLevelColumn';

const styles = {
  wrapper: 'grid h-full min-h-0 grid-cols-[3fr_3fr_4fr] gap-4 overflow-x-hidden',
  column: 'h-full min-h-0 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] animate-[columnIn_240ms_ease]',
};

interface MillerColumnsProps {
  columns: ExplorerColumn[];
  collections: CatalogEntry[];
  activeCollection: string | null;
  documents: Document[];
  activeDocumentId: string | null;
  documentMap: Map<string, Document>;
  highlight: JsonHighlight;
  onSelectCollection: (collection: string) => void;
  onSelectDocument: (doc: Document) => void;
  onRemoveDocument: (id: string) => void;
  onOpenJsonPath: (columnDepth: number, segment: JsonPathSegment) => void;
  onUpdateJsonValue: (rootDocumentId: string, path: JsonPathSegment[], value: unknown) => void;
  onAddDocument?: (doc: Document) => void;
  onOpenManager: () => void;
}

export function MillerColumns({
  columns,
  collections,
  activeCollection,
  documents,
  activeDocumentId,
  documentMap,
  highlight,
  onSelectCollection,
  onSelectDocument,
  onRemoveDocument,
  onOpenJsonPath,
  onUpdateJsonValue,
  onAddDocument,
  onOpenManager,
}: MillerColumnsProps) {
  const visibleColumns = columns.slice(-3);

  return (
    <div className={styles.wrapper}>
      {visibleColumns.map((column, index) => {
        const allowPrimitiveClick = index === 0;
        if (column.type === 'collections') {
          return (
            <div key={column.id} className={styles.column}>
              <CollectionList
                collections={collections}
                activeCollection={activeCollection}
                onSelectCollection={onSelectCollection}
                onOpenManager={onOpenManager}
                onAddDocument={onAddDocument}
              />
            </div>
          );
        }
        if (column.type === 'documents') {
          return (
            <div key={column.id} className={styles.column}>
              <DocumentList
                documents={documents}
                activeDocumentId={activeDocumentId}
                onSelectDocument={onSelectDocument}
                onRemoveDocument={onRemoveDocument}
                onOpenManager={onOpenManager}
                onAddDocument={onAddDocument}
              />
            </div>
          );
        }
        return (
          <div key={column.id} className={styles.column}>
            <JsonLevelColumn
              title={column.title}
              value={column.value}
              path={column.path}
              rootDocumentId={column.rootDocumentId}
              documentMap={documentMap}
              columnDepth={column.depth}
              highlight={highlight}
              allowPrimitiveClick={allowPrimitiveClick}
              onOpenManager={onOpenManager}
              onOpenPath={onOpenJsonPath}
              onUpdateValue={onUpdateJsonValue}
            />
          </div>
        );
      })}
    </div>
  );
}
