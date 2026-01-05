/**
 * Field Drawer - Side panel for adding/removing fields from table cards
 */

import { useState, useMemo } from 'react';
import type { Entity, EntityAttribute } from '@/types';
import { getAttributeBadge, isLookupType } from '../utils/badges';
import { useTheme } from '@/context';
import { FieldDrawerHeader } from './FieldDrawerHeader';
import { FieldDrawerList } from './FieldDrawerList';
import { FieldDrawerFooter } from './FieldDrawerFooter';

export interface FieldDrawerProps {
  entity: Entity;
  selectedFields: Set<string>;
  onAddField: (fieldName: string) => void;
  onRemoveField: (fieldName: string) => void;
  onClose: () => void;
  onLookupFieldAdd?: (fieldName: string, targetEntity: string) => void;
}

export function FieldDrawer({
  entity,
  selectedFields,
  onAddField,
  onRemoveField,
  onClose,
  onLookupFieldAdd,
}: FieldDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [showLookupsOnly, setShowLookupsOnly] = useState(false);

  const { isDarkMode } = useTheme();

  // Theme colors
  const bgColor = isDarkMode ? '#1f2937' : '#ffffff';
  const headerBg = isDarkMode ? '#111827' : '#f3f4f6';
  const borderColor = isDarkMode ? '#374151' : '#e5e7eb';
  const textColor = isDarkMode ? '#f3f4f6' : '#1f2937';
  const textSecondary = isDarkMode ? '#9ca3af' : '#6b7280';
  const hoverBg = isDarkMode ? '#374151' : '#f9fafb';
  const inputBg = isDarkMode ? '#374151' : '#ffffff';
  const inputBorder = isDarkMode ? '#4b5563' : '#d1d5db';

  // Filter attributes
  const filteredAttributes = useMemo(() => {
    let attrs = [...entity.attributes];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      attrs = attrs.filter(
        (attr) =>
          attr.name.toLowerCase().includes(query) || attr.displayName.toLowerCase().includes(query)
      );
    }

    // Selected only filter
    if (showSelectedOnly) {
      attrs = attrs.filter((attr) => selectedFields.has(attr.name) || attr.isPrimaryKey);
    }

    // Lookups only filter
    if (showLookupsOnly) {
      attrs = attrs.filter((attr) => isLookupType(attr));
    }

    // Sort: PK first, then alphabetically
    attrs.sort((a, b) => {
      if (a.isPrimaryKey && !b.isPrimaryKey) return -1;
      if (!a.isPrimaryKey && b.isPrimaryKey) return 1;
      return a.displayName.localeCompare(b.displayName);
    });

    return attrs;
  }, [entity.attributes, searchQuery, showSelectedOnly, showLookupsOnly, selectedFields]);

  const handleFieldToggle = (attr: EntityAttribute) => {
    if (attr.isPrimaryKey) return;

    if (selectedFields.has(attr.name)) {
      onRemoveField(attr.name);
    } else {
      if (isLookupType(attr) && attr.lookupTarget && onLookupFieldAdd) {
        onLookupFieldAdd(attr.name, attr.lookupTarget);
      } else {
        onAddField(attr.name);
      }
    }
  };

  const handleSelectAll = () => {
    entity.attributes.forEach((attr) => {
      if (!attr.isPrimaryKey && !selectedFields.has(attr.name)) {
        onAddField(attr.name);
      }
    });
  };

  const handleClearAll = () => {
    entity.attributes.forEach((attr) => {
      if (!attr.isPrimaryKey && selectedFields.has(attr.name)) {
        onRemoveField(attr.name);
      }
    });
  };

  const selectedCount = Array.from(selectedFields).filter((f) =>
    entity.attributes.some((a) => a.name === f)
  ).length;
  const totalCount = entity.attributes.length;

  const drawerId = 'field-drawer';
  const drawerTitleId = 'field-drawer-title';

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
        background: bgColor,
        borderLeft: `1px solid ${borderColor}`,
        boxShadow: isDarkMode ? '-4px 0 20px rgba(0, 0, 0, 0.5)' : '-4px 0 20px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
      }}
    >
      <FieldDrawerHeader
        entityDisplayName={entity.displayName}
        titleId={drawerTitleId}
        searchQuery={searchQuery}
        showSelectedOnly={showSelectedOnly}
        showLookupsOnly={showLookupsOnly}
        isDarkMode={isDarkMode}
        headerBg={headerBg}
        borderColor={borderColor}
        textColor={textColor}
        textSecondary={textSecondary}
        inputBg={inputBg}
        inputBorder={inputBorder}
        onSearchChange={setSearchQuery}
        onToggleSelectedOnly={() => setShowSelectedOnly(!showSelectedOnly)}
        onToggleLookupsOnly={() => setShowLookupsOnly(!showLookupsOnly)}
        onClose={onClose}
      />

      {/* Field count */}
      <div
        style={{
          padding: '8px 16px',
          fontSize: '11px',
          color: textSecondary,
          borderBottom: `1px solid ${borderColor}`,
        }}
      >
        {selectedCount} of {totalCount} fields selected
      </div>

      <FieldDrawerList
        filteredAttributes={filteredAttributes}
        selectedFields={selectedFields}
        isDarkMode={isDarkMode}
        textColor={textColor}
        textSecondary={textSecondary}
        hoverBg={hoverBg}
        getBadge={getAttributeBadge}
        isLookup={isLookupType}
        onFieldToggle={handleFieldToggle}
      />

      <FieldDrawerFooter
        isDarkMode={isDarkMode}
        borderColor={borderColor}
        textColor={textColor}
        onSelectAll={handleSelectAll}
        onClearAll={handleClearAll}
      />
    </aside>
  );
}
