import type { CatalogEntry, Document } from '../types/explorer';
import type { ExplorerColumn, JsonHighlight, JsonPathSegment } from '../types/explorer-ui';
import { CollectionList } from './CollectionList';
import { DocumentList } from './DocumentList';
import { JsonLevelColumn } from './JsonLevelColumn';
import { cn } from '../utils/cn';

const styles = {
  wrapper: 'flex h-full min-h-0 md:gap-4 overflow-x-auto overflow-y-hidden snap-x snap-mandatory p-4 pt-0 md:grid md:grid-cols-[3fr_3fr_4fr] md:overflow-x-hidden',
  column: 'h-full min-h-0 min-w-[85%] snap-start transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] animate-[columnIn_240ms_ease] pl-4 md:pl-0 md:min-w-0 md:snap-none',
  columnNav: 'md:sticky md:top-6 md:self-start xl:static',
};

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

export function MillerColumns({
  columns,
  collections,
  activeCollection,
  documents,
  activeDocumentId,
  highlight,
  checkValidReference,
  onSelectCollection,
  onSelectDocument,
  onRemoveDocument,
  onOpenJsonPath,
  onUpdateJsonValue,
  onAddDocument,
  onAddCollection,
  onOpenManager,
}: MillerColumnsProps) {
  const visibleColumns = columns.slice(-3);

  return (
    <div className={styles.wrapper}>
      {visibleColumns.map((column, index) => {
        const allowPrimitiveClick = index === 0;
        if (column.type === 'collections') {
          return (
            <div key={column.id} className={cn(styles.column, styles.columnNav)}>
              <CollectionList
                collections={collections}
                activeCollection={activeCollection}
                onSelectCollection={onSelectCollection}
                onOpenManager={onOpenManager}
                onAddCollection={onAddCollection}
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
              columnDepth={column.depth}
              highlight={highlight}
              allowPrimitiveClick={allowPrimitiveClick}
              isReferenceColumn={column.isReferenceColumn}
              activeSegment={column.activeSegment ?? null}
              checkValidReference={checkValidReference}
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
