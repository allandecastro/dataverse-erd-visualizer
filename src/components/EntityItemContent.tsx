/**
 * Shared presentational content for entity items in both
 * VirtualEntityList (flat) and GroupedEntityList (grouped)
 */

import { memo } from 'react';
import { Link2 } from 'lucide-react';
import type { Entity } from '@/types';

export interface EntityItemContentProps {
  entity: Entity;
  isSelected: boolean;
  customTableColor: string;
  standardTableColor: string;
  lookupColor: string;
  textSecondary: string;
}

export const EntityItemContent = memo(function EntityItemContent({
  entity,
  isSelected,
  customTableColor,
  standardTableColor,
  lookupColor,
  textSecondary,
}: EntityItemContentProps) {
  const hasLookups = entity.attributes.some((a) => a.type === 'Lookup' || a.type === 'Owner');

  return (
    <>
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => {}}
        tabIndex={-1}
        aria-hidden="true"
        style={{ cursor: 'pointer', accentColor: customTableColor }}
      />
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '2px',
          background: entity.isCustomEntity ? customTableColor : standardTableColor,
          flexShrink: 0,
        }}
        aria-hidden="true"
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '13px',
            fontWeight: '500',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {entity.displayName}
        </div>
        <div
          style={{
            fontSize: '11px',
            color: textSecondary,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {entity.logicalName}
        </div>
      </div>
      {hasLookups && (
        <Link2
          size={14}
          color={lookupColor}
          style={{ flexShrink: 0 }}
          aria-label="Has lookup relationships"
        />
      )}
    </>
  );
});
