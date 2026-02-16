/**
 * Relationship Explorer scrollable list with collapsible direction groups
 */

import { memo, useCallback } from 'react';
import type React from 'react';
import { ChevronDown, CheckCircle } from 'lucide-react';
import type {
  RelatedEntityInfo,
  GroupedRelatedEntities,
  RelationshipDirection,
} from '../utils/relationshipExplorer';
import styles from '@/styles/RelationshipExplorerDrawer.module.css';

export interface RelationshipExplorerListProps {
  grouped: GroupedRelatedEntities;
  checkedKeys: Set<string>;
  collapsedSections: Set<string>;
  isDarkMode: boolean;
  textColor: string;
  textSecondary: string;
  hoverBg: string;
  borderColor: string;
  onToggleEntity: (compoundKey: string) => void;
  onToggleSection: (section: RelationshipDirection) => void;
}

const SECTION_CONFIG: {
  key: RelationshipDirection;
  label: string;
  description: string;
}[] = [
  { key: 'outgoing', label: 'This table looks up to', description: 'N:1 — lookup fields' },
  { key: 'incoming', label: 'Tables looking up to this', description: '1:N — reverse lookups' },
  { key: 'many-to-many', label: 'Many-to-Many', description: 'N:N relationships' },
];

const SECTION_GROUP_KEY: Record<RelationshipDirection, keyof GroupedRelatedEntities> = {
  outgoing: 'outgoing',
  incoming: 'incoming',
  'many-to-many': 'manyToMany',
};

const EntityRow = memo(function EntityRow({
  entity,
  compoundKey,
  isChecked,
  isDarkMode,
  textColor,
  textSecondary,
  hoverBg,
  borderColor,
  onToggle,
}: {
  entity: RelatedEntityInfo;
  compoundKey: string;
  isChecked: boolean;
  isDarkMode: boolean;
  textColor: string;
  textSecondary: string;
  hoverBg: string;
  borderColor: string;
  onToggle: (compoundKey: string) => void;
}) {
  const handleChange = useCallback(() => onToggle(compoundKey), [onToggle, compoundKey]);

  const relSchemaNames = entity.relationships.map((r) => r.schemaName).join(', ');
  const onCanvasBg = entity.isOnCanvas
    ? isDarkMode
      ? 'rgba(34, 197, 94, 0.08)'
      : 'rgba(34, 197, 94, 0.05)'
    : undefined;

  return (
    <label
      className={`${styles.entityRow} ${entity.isOnCanvas ? styles.entityRowOnCanvas : ''}`}
      style={
        {
          '--row-bg': onCanvasBg ?? 'transparent',
          '--row-hover-bg': entity.isOnCanvas ? (onCanvasBg ?? 'transparent') : hoverBg,
          color: textColor,
          cursor: entity.isOnCanvas ? 'default' : 'pointer',
        } as React.CSSProperties
      }
      title={relSchemaNames}
    >
      <input
        type="checkbox"
        className={styles.entityCheckbox}
        checked={isChecked || entity.isOnCanvas}
        disabled={entity.isOnCanvas}
        onChange={handleChange}
        aria-label={`Add ${entity.displayName} to canvas`}
      />

      <div className={styles.entityInfo}>
        <div className={styles.entityDisplayName}>{entity.displayName}</div>
        <div className={styles.entityLogicalName} style={{ color: textSecondary }}>
          {entity.logicalName}
        </div>
      </div>

      <div className={styles.entityBadges}>
        {entity.isCustomEntity && (
          <span
            className={styles.customBadge}
            style={{
              background: isDarkMode ? '#1e40af' : '#dbeafe',
              color: isDarkMode ? '#93c5fd' : '#1e40af',
            }}
          >
            Custom
          </span>
        )}
        {entity.relationships.length > 1 && (
          <span
            className={styles.relCountBadge}
            style={{
              background: isDarkMode ? borderColor : '#f3f4f6',
              color: textSecondary,
            }}
          >
            {entity.relationships.length} rels
          </span>
        )}
        {entity.isOnCanvas && (
          <CheckCircle
            size={14}
            className={styles.onCanvasIcon}
            style={{ color: '#22c55e' }}
            aria-label="Already on canvas"
          />
        )}
      </div>
    </label>
  );
});

export const RelationshipExplorerList = memo(function RelationshipExplorerList({
  grouped,
  checkedKeys,
  collapsedSections,
  isDarkMode,
  textColor,
  textSecondary,
  hoverBg,
  borderColor,
  onToggleEntity,
  onToggleSection,
}: RelationshipExplorerListProps) {
  const totalCount = grouped.outgoing.length + grouped.incoming.length + grouped.manyToMany.length;

  if (totalCount === 0) {
    return (
      <div className={styles.emptyState} style={{ color: textSecondary }}>
        No related tables found matching the current filters.
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      {SECTION_CONFIG.map(({ key, label, description }) => {
        const sectionEntities = grouped[SECTION_GROUP_KEY[key]];
        if (sectionEntities.length === 0) return null;

        const isCollapsed = collapsedSections.has(key);

        return (
          <div key={key}>
            <button
              className={styles.sectionHeader}
              style={{
                color: textSecondary,
                borderBottom: `1px solid ${borderColor}`,
                background: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
              }}
              onClick={() => onToggleSection(key)}
              aria-expanded={!isCollapsed}
              title={description}
            >
              <span>
                {label}
                <span className={styles.sectionCount}>({sectionEntities.length})</span>
              </span>
              <ChevronDown
                size={14}
                className={`${styles.sectionChevron} ${isCollapsed ? styles.sectionChevronCollapsed : ''}`}
                aria-hidden="true"
              />
            </button>

            {!isCollapsed &&
              sectionEntities.map((entity) => {
                const compoundKey = `${entity.logicalName}::${entity.direction}`;
                return (
                  <EntityRow
                    key={compoundKey}
                    entity={entity}
                    compoundKey={compoundKey}
                    isChecked={checkedKeys.has(compoundKey)}
                    isDarkMode={isDarkMode}
                    textColor={textColor}
                    textSecondary={textSecondary}
                    hoverBg={hoverBg}
                    borderColor={borderColor}
                    onToggle={onToggleEntity}
                  />
                );
              })}
          </div>
        );
      })}
    </div>
  );
});
