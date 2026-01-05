/**
 * Custom Table Node for ERD - matches database table visualization style
 */

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import type { Entity, EntityAttribute, AlternateKey } from '@/types';
import { getAttributeBadge, isLookupType } from '../utils/badges';
import styles from '@/styles/TableNode.module.css';

export interface TableNodeData extends Record<string, unknown> {
  entity: Entity;
  color: string;
  isDarkMode?: boolean;
  orderedFields?: string[]; // Fields to display in order (PK first, then FIFO)
  onOpenFieldDrawer?: (entityName: string) => void;
  onRemoveField?: (entityName: string, fieldName: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: (entityName: string) => void;
}

interface TableNodeProps {
  data: TableNodeData;
  selected?: boolean;
}

// Get type label (using Dataverse/Power Apps terminology)
function getTypeLabel(attr: EntityAttribute): string {
  if (attr.isPrimaryKey) return 'Unique Identifier';
  switch (attr.type) {
    case 'Lookup':
      return 'Lookup';
    case 'Owner':
      return 'Owner';
    case 'Customer':
      return 'Customer';
    case 'String':
      return 'Text';
    case 'Memo':
      return 'Multiline Text';
    case 'Integer':
      return 'Whole Number';
    case 'BigInt':
      return 'Big Integer';
    case 'Decimal':
      return 'Decimal Number';
    case 'Double':
      return 'Floating Point';
    case 'Money':
      return 'Currency';
    case 'DateTime':
      return 'Date and Time';
    case 'Boolean':
      return 'Yes/No';
    case 'Picklist':
      return 'Choice';
    case 'State':
      return 'Status';
    case 'Status':
      return 'Status Reason';
    case 'UniqueIdentifier':
      return 'Unique Identifier';
    default:
      return attr.type;
  }
}

// Layout constants for handle positioning
const HEADER_HEIGHT = 36; // Header with entity name
const SUBHEADER_HEIGHT = 24; // Logical name row
const FIELD_ROW_HEIGHT = 28; // Each field row height
const FIELD_PADDING_TOP = 4; // Padding at top of fields section

// Calculate the Y position for a field's handle
function getFieldHandleTop(fieldIndex: number): number {
  return (
    HEADER_HEIGHT +
    SUBHEADER_HEIGHT +
    FIELD_PADDING_TOP +
    fieldIndex * FIELD_ROW_HEIGHT +
    FIELD_ROW_HEIGHT / 2
  );
}

export const TableNode = memo(function TableNode({ data, selected }: TableNodeProps) {
  const {
    entity,
    color,
    isDarkMode = false,
    orderedFields,
    onOpenFieldDrawer,
    onRemoveField,
    isCollapsed = false,
    onToggleCollapse,
  } = data;

  // Get attributes to display based on orderedFields or just PK
  const displayAttributes =
    orderedFields && orderedFields.length > 0
      ? orderedFields
          .map((fieldName) => entity.attributes.find((a) => a.name === fieldName))
          .filter((attr): attr is EntityAttribute => attr !== undefined)
      : entity.attributes.filter((attr) => attr.isPrimaryKey);

  // Get alternate keys
  const alternateKeys = entity.alternateKeys || [];

  // Find primary key for default handle position
  const pkAttr = displayAttributes.find((a) => a.isPrimaryKey);
  const pkIndex = pkAttr ? displayAttributes.findIndex((a) => a.isPrimaryKey) : 0;
  const defaultHandleTop = getFieldHandleTop(pkIndex);

  const nodeClasses = [
    styles.tableNode,
    isDarkMode ? styles.tableNodeDark : styles.tableNodeLight,
    selected ? styles.tableNodeSelected : '',
  ].join(' ');

  return (
    <div className={nodeClasses}>
      {/* Per-field handles for precise edge connections */}
      {displayAttributes.map((attr, index) => {
        const handleTop = getFieldHandleTop(index);
        const isPK = attr.isPrimaryKey;
        const isLookup = isLookupType(attr);

        return (
          <div key={`handles-${attr.name}`}>
            {/* Target handle on left - for PK fields (incoming edges) */}
            {isPK && (
              <Handle
                type="target"
                position={Position.Left}
                id={attr.name}
                style={{
                  background: color,
                  width: 8,
                  height: 8,
                  top: handleTop,
                }}
              />
            )}
            {/* Source handle on right - for lookup fields (outgoing edges) */}
            {isLookup && (
              <Handle
                type="source"
                position={Position.Right}
                id={attr.name}
                style={{
                  background: '#f97316', // Orange for lookup connections
                  width: 8,
                  height: 8,
                  top: handleTop,
                }}
              />
            )}
          </div>
        );
      })}
      {/* Default handles for fallback (when field-specific handles aren't available) */}
      <Handle
        type="target"
        position={Position.Left}
        id="default-target"
        style={{
          background: color,
          width: 8,
          height: 8,
          top: defaultHandleTop,
          opacity: 0, // Hidden, used as fallback
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="default-source"
        style={{
          background: color,
          width: 8,
          height: 8,
          top: defaultHandleTop,
          opacity: 0, // Hidden, used as fallback
        }}
      />

      {/* Header */}
      <div className={styles.header} style={{ background: color, height: HEADER_HEIGHT }}>
        <span className={styles.headerTitle}>{entity.displayName}</span>
        <div className={styles.headerButtons}>
          {onToggleCollapse && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleCollapse(entity.logicalName);
              }}
              className={styles.collapseButton}
              title={isCollapsed ? 'Expand fields' : 'Collapse fields'}
              aria-expanded={!isCollapsed}
              aria-label={isCollapsed ? 'Expand fields' : 'Collapse fields'}
            >
              {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
          )}
          {onOpenFieldDrawer && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenFieldDrawer(entity.logicalName);
              }}
              className={styles.addFieldButton}
              title="Add fields"
            >
              <Plus size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Logical name */}
      <div
        className={`${styles.subheader} ${isDarkMode ? styles.subheaderDark : styles.subheaderLight}`}
        style={{ height: SUBHEADER_HEIGHT }}
      >
        {entity.logicalName}
      </div>

      {/* Fields */}
      <div className={styles.fieldsContainer}>
        {displayAttributes.map((attr) => {
          const badge = getAttributeBadge(attr);
          const typeLabel = getTypeLabel(attr);
          const canRemove = !attr.isPrimaryKey && onRemoveField;

          return (
            <div
              key={attr.name}
              className={`${styles.fieldRow} ${isDarkMode ? styles.fieldRowDark : styles.fieldRowLight}`}
              style={{ height: FIELD_ROW_HEIGHT }}
            >
              {/* Badge */}
              <span className={styles.fieldBadge} style={{ background: badge.color }}>
                {badge.label}
              </span>

              {/* Field name */}
              <span className={`${styles.fieldName} ${isDarkMode ? styles.fieldNameDark : styles.fieldNameLight}`}>
                {attr.displayName || attr.name}
              </span>

              {/* Type */}
              <span className={`${styles.fieldType} ${isDarkMode ? styles.fieldTypeDark : styles.fieldTypeLight}`}>
                {typeLabel}
              </span>

              {/* Remove button (only for non-PK fields) */}
              {canRemove && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveField(entity.logicalName, attr.name);
                  }}
                  className={`${styles.removeFieldButton} ${isDarkMode ? styles.removeFieldButtonDark : styles.removeFieldButtonLight}`}
                  title="Remove field"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          );
        })}

        {displayAttributes.length === 0 && (
          <div className={`${styles.emptyState} ${isDarkMode ? styles.emptyStateDark : styles.emptyStateLight}`}>
            No fields selected
          </div>
        )}
      </div>

      {/* Alternate Keys Section */}
      {alternateKeys.length > 0 && (
        <>
          {/* Separator */}
          <div className={`${styles.akHeader} ${isDarkMode ? styles.akHeaderDark : styles.akHeaderLight}`}>
            <span className={styles.akBadge}>AK</span>
            <span className={`${styles.akTitle} ${isDarkMode ? styles.akTitleDark : styles.akTitleLight}`}>
              Alternate Keys
            </span>
          </div>

          {/* Alternate Key List */}
          <div className={styles.akList}>
            {alternateKeys.map((ak: AlternateKey) => (
              <div
                key={ak.logicalName}
                className={`${styles.akRow} ${isDarkMode ? styles.fieldRowDark : styles.fieldRowLight}`}
              >
                {/* Key icon/badge */}
                <span className={styles.akIcon}>🔑</span>

                {/* Key name */}
                <span className={`${styles.akName} ${isDarkMode ? styles.akNameDark : styles.akNameLight}`}>
                  {ak.displayName}
                </span>

                {/* Key attributes - with tooltip for composite keys */}
                <span
                  className={`${styles.akAttributes} ${isDarkMode ? styles.akAttributesDark : styles.akAttributesLight}`}
                  style={{ cursor: ak.keyAttributes.length > 1 ? 'help' : 'default' }}
                  title={ak.keyAttributes.length > 1 ? ak.keyAttributes.join(', ') : undefined}
                >
                  {ak.keyAttributes.length === 1
                    ? ak.keyAttributes[0]
                    : `${ak.keyAttributes.length} fields`}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
});
