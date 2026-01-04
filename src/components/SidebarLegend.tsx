/**
 * Sidebar legend showing color meanings
 */

import { Link2 } from 'lucide-react';
import type { ColorSettings } from '@/types/erdTypes';

export interface SidebarLegendProps {
  colorSettings: ColorSettings;
  borderColor: string;
}

export function SidebarLegend({ colorSettings, borderColor }: SidebarLegendProps) {
  const { customTableColor, standardTableColor, lookupColor } = colorSettings;

  return (
    <div style={{ padding: '16px', borderTop: `1px solid ${borderColor}` }}>
      <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Legend</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '16px',
              height: '12px',
              background: customTableColor,
              borderRadius: '2px',
            }}
          />
          <span>Custom Table</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '16px',
              height: '12px',
              background: standardTableColor,
              borderRadius: '2px',
            }}
          />
          <span>Standard Table</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link2 size={14} color={lookupColor} />
          <span>Has Lookup Fields</span>
        </div>
      </div>
    </div>
  );
}
