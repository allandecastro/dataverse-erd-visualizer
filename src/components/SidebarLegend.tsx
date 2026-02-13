/**
 * Sidebar legend showing color meanings
 */

import { memo } from 'react';
import { Link2 } from 'lucide-react';
import type { ColorSettings, DerivedGroup } from '@/types/erdTypes';
import styles from '@/styles/Sidebar.module.css';

export interface SidebarLegendProps {
  colorSettings: ColorSettings;
  borderColor: string;
  derivedGroups: DerivedGroup[];
}

export const SidebarLegend = memo(function SidebarLegend({
  colorSettings,
  borderColor,
  derivedGroups,
}: SidebarLegendProps) {
  const { customTableColor, standardTableColor, lookupColor } = colorSettings;

  return (
    <div className={styles.legend} style={{ borderTop: `1px solid ${borderColor}` }}>
      <div className={styles.legendTitle}>Legend</div>
      <div className={styles.legendItems}>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ background: customTableColor }} />
          <span>Custom Table</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ background: standardTableColor }} />
          <span>Standard Table</span>
        </div>
        <div className={styles.legendItem}>
          <Link2 size={14} color={lookupColor} />
          <span>Has Lookup Fields</span>
        </div>
        {derivedGroups.map((group) => (
          <div key={group.color} className={styles.legendItem}>
            <div className={styles.legendColor} style={{ background: group.color }} />
            <span>
              {group.name} ({group.entityNames.length})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});
