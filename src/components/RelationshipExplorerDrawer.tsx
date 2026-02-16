/**
 * Relationship Explorer Drawer — right-side panel for discovering and adding
 * entities connected to a source entity (or set of entities) via relationships.
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import type { Entity, EntityRelationship } from '@/types';
import { useTheme } from '@/context';
import {
  findRelatedEntities,
  filterRelatedEntities,
  countRelatedEntities,
} from '../utils/relationshipExplorer';
import type { RelationshipDirection } from '../utils/relationshipExplorer';
import { RelationshipExplorerHeader } from './RelationshipExplorerHeader';
import { RelationshipExplorerList } from './RelationshipExplorerList';
import { RelationshipExplorerFooter } from './RelationshipExplorerFooter';

export interface RelationshipExplorerDrawerProps {
  sourceEntityNames: string[];
  entities: Entity[];
  relationships: EntityRelationship[];
  selectedEntities: Set<string>;
  onAddEntities: (
    entityNames: string[],
    fieldsToAdd: { entityName: string; fieldName: string }[]
  ) => void;
  onClose: () => void;
}

export function RelationshipExplorerDrawer({
  sourceEntityNames,
  entities,
  relationships,
  selectedEntities,
  onAddEntities,
  onClose,
}: RelationshipExplorerDrawerProps) {
  // Local filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [hideSystemEntities, setHideSystemEntities] = useState(true);
  const [hideActivityEntities, setHideActivityEntities] = useState(true);
  const [customOnly, setCustomOnly] = useState(false);

  // Selection state — compound keys: `logicalName::direction` for independent checkboxes per section
  const [checkedKeys, setCheckedKeys] = useState<Set<string>>(new Set());
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const { isDarkMode, themeColors, colors } = useTheme();
  const { panelBg, borderColor, textColor, textSecondary } = themeColors;
  const { inputBg, inputBorder, hoverBg } = colors;

  // Escape to close (state resets via key prop on parent remount)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Step 1: Find all related entities
  const allRelated = useMemo(
    () => findRelatedEntities(sourceEntityNames, entities, relationships, selectedEntities),
    [sourceEntityNames, entities, relationships, selectedEntities]
  );

  // Step 2: Apply filters
  const filteredRelated = useMemo(
    () =>
      filterRelatedEntities(allRelated, {
        searchQuery,
        hideSystemEntities,
        hideActivityEntities,
        customOnly,
      }),
    [allRelated, searchQuery, hideSystemEntities, hideActivityEntities, customOnly]
  );

  // Step 3: Counts
  const allCounts = useMemo(() => countRelatedEntities(allRelated), [allRelated]);
  const filteredCounts = useMemo(() => countRelatedEntities(filteredRelated), [filteredRelated]);

  // Derive title
  const entityMap = useMemo(() => new Map(entities.map((e) => [e.logicalName, e])), [entities]);

  const title = 'Explore Relationships';
  const subtitle =
    sourceEntityNames.length === 1
      ? (entityMap.get(sourceEntityNames[0])?.displayName ?? sourceEntityNames[0])
      : `${sourceEntityNames.length} tables`;

  // Handlers — use compound key `logicalName::direction` for independent per-section checkboxes
  const handleToggleEntity = useCallback((compoundKey: string) => {
    setCheckedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(compoundKey)) {
        next.delete(compoundKey);
      } else {
        next.add(compoundKey);
      }
      return next;
    });
  }, []);

  const handleToggleSection = useCallback((section: RelationshipDirection) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  }, []);

  const handleSelectAllVisible = useCallback(() => {
    const visibleKeys = [
      ...filteredRelated.outgoing.map((e) => `${e.logicalName}::${e.direction}`),
      ...filteredRelated.incoming.map((e) => `${e.logicalName}::${e.direction}`),
      ...filteredRelated.manyToMany.map((e) => `${e.logicalName}::${e.direction}`),
    ].filter((key) => {
      const name = key.split('::')[0];
      return !selectedEntities.has(name);
    });
    setCheckedKeys(new Set(visibleKeys));
  }, [filteredRelated, selectedEntities]);

  const handleClearAll = useCallback(() => {
    setCheckedKeys(new Set());
  }, []);

  const handleAddToCanvas = useCallback(() => {
    if (checkedKeys.size === 0) return;

    // Extract unique entity names from compound keys
    const entityNames = [...new Set([...checkedKeys].map((k) => k.split('::')[0]))];

    // Collect lookup fields to auto-add from the relationships of checked entries
    const fieldsToAdd: { entityName: string; fieldName: string }[] = [];
    const seen = new Set<string>(); // deduplicate field additions
    const allEntries = [...allRelated.outgoing, ...allRelated.incoming, ...allRelated.manyToMany];
    for (const entry of allEntries) {
      const compoundKey = `${entry.logicalName}::${entry.direction}`;
      if (!checkedKeys.has(compoundKey)) continue;
      for (const rel of entry.relationships) {
        if (rel.referencingAttribute) {
          const fieldKey = `${rel.fromEntity}::${rel.referencingAttribute}`;
          if (!seen.has(fieldKey)) {
            seen.add(fieldKey);
            fieldsToAdd.push({ entityName: rel.fromEntity, fieldName: rel.referencingAttribute });
          }
        }
      }
    }

    onAddEntities(entityNames, fieldsToAdd);
    setCheckedKeys(new Set());
  }, [checkedKeys, allRelated, onAddEntities]);

  // Unique entity count from compound keys (memoized to avoid allocating in JSX)
  const checkedEntityCount = useMemo(() => {
    const names = new Set<string>();
    for (const key of checkedKeys) {
      names.add(key.split('::')[0]);
    }
    return names.size;
  }, [checkedKeys]);

  const drawerId = 'relationship-explorer';
  const drawerTitleId = 'relationship-explorer-title';

  return (
    <aside
      id={drawerId}
      role="dialog"
      aria-modal="true"
      aria-labelledby={drawerTitleId}
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '320px',
        height: '100vh',
        background: panelBg,
        borderLeft: `1px solid ${borderColor}`,
        boxShadow: isDarkMode ? '-4px 0 20px rgba(0, 0, 0, 0.5)' : '-4px 0 20px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
      }}
    >
      <RelationshipExplorerHeader
        title={title}
        subtitle={subtitle}
        titleId={drawerTitleId}
        searchQuery={searchQuery}
        hideSystemEntities={hideSystemEntities}
        hideActivityEntities={hideActivityEntities}
        customOnly={customOnly}
        headerBg={panelBg}
        borderColor={borderColor}
        textColor={textColor}
        textSecondary={textSecondary}
        inputBg={inputBg}
        inputBorder={inputBorder}
        onSearchChange={setSearchQuery}
        onToggleHideSystem={() => setHideSystemEntities((v) => !v)}
        onToggleHideActivity={() => setHideActivityEntities((v) => !v)}
        onToggleCustomOnly={() => setCustomOnly((v) => !v)}
        onClose={onClose}
      />

      {/* Count summary */}
      <div
        className="countSummary"
        style={{
          padding: '8px 16px',
          fontSize: '11px',
          color: textSecondary,
          borderBottom: `1px solid ${borderColor}`,
        }}
      >
        {filteredCounts.total} related {filteredCounts.total === 1 ? 'table' : 'tables'}
        {filteredCounts.total !== allCounts.total && ` (${allCounts.total} total)`}
        {allCounts.onCanvas > 0 && ` · ${allCounts.onCanvas} already on canvas`}
      </div>

      <RelationshipExplorerList
        grouped={filteredRelated}
        checkedKeys={checkedKeys}
        collapsedSections={collapsedSections}
        isDarkMode={isDarkMode}
        textColor={textColor}
        textSecondary={textSecondary}
        hoverBg={hoverBg}
        borderColor={borderColor}
        onToggleEntity={handleToggleEntity}
        onToggleSection={handleToggleSection}
      />

      <RelationshipExplorerFooter
        checkedCount={checkedEntityCount}
        isDarkMode={isDarkMode}
        borderColor={borderColor}
        textColor={textColor}
        onSelectAllVisible={handleSelectAllVisible}
        onClearAll={handleClearAll}
        onAddToCanvas={handleAddToCanvas}
      />
    </aside>
  );
}
