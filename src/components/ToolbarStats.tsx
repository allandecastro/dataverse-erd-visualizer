/**
 * Toolbar stats display showing table and relationship counts
 */

import { memo } from 'react';
import styles from '@/styles/ToolbarStats.module.css';

export interface ToolbarStatsProps {
  filteredEntitiesCount: number;
  filteredRelationshipsCount: number;
  borderColor: string;
  textSecondary: string;
}

export const ToolbarStats = memo(function ToolbarStats({
  filteredEntitiesCount,
  filteredRelationshipsCount,
  borderColor,
  textSecondary,
}: ToolbarStatsProps) {
  return (
    <div className={styles.container}>
      <div>
        <div className={styles.statLabel} style={{ color: textSecondary }}>
          Tables
        </div>
        <div className={styles.statValue}>{filteredEntitiesCount}</div>
      </div>
      <div className={styles.divider} style={{ background: borderColor }} />
      <div>
        <div className={styles.statLabel} style={{ color: textSecondary }}>
          Relationships
        </div>
        <div className={styles.statValue}>{filteredRelationshipsCount}</div>
      </div>
    </div>
  );
});
