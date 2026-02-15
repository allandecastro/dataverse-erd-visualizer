/**
 * Feature Guide Modal - Explains all available features to users
 */

import { useState } from 'react';
import {
  X,
  MousePointer2,
  Download,
  Move,
  Eye,
  Palette,
  LayoutGrid,
  HelpCircle,
  ChevronRight,
  Bookmark,
  Share2,
} from 'lucide-react';
import { LOGO_DATA_URL } from '@/constants';
import { useTheme } from '@/context';
import styles from '@/styles/FeatureGuide.module.css';

export interface FeatureGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onDontShowAgain: () => void;
}

interface FeatureCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  features: Feature[];
}

interface Feature {
  title: string;
  description: string;
  shortcut?: string;
  tip?: string;
}

const FEATURE_CATEGORIES: FeatureCategory[] = [
  {
    id: 'navigation',
    title: 'Navigation',
    icon: <Move size={20} />,
    features: [
      {
        title: 'Pan the Canvas',
        description: 'Click and drag on empty space to pan around the diagram.',
        tip: 'Hold and drag for smooth navigation',
      },
      {
        title: 'Zoom In/Out',
        description: 'Use mouse wheel or the zoom controls in the top-left corner.',
        tip: 'Scroll to zoom, click controls for precise adjustment',
      },
      {
        title: 'Fit to Screen',
        description:
          'Click the fit view button to automatically fit all entities in the visible area.',
      },
      {
        title: 'Search & Navigate',
        description:
          'Use the search icon in the header to find entities by name and jump directly to them.',
        shortcut: '/',
      },
    ],
  },
  {
    id: 'entities',
    title: 'Entity Management',
    icon: <LayoutGrid size={20} />,
    features: [
      {
        title: 'Drag Entities',
        description:
          'Click and drag any entity card to reposition it on the canvas. Positions are saved automatically.',
      },
      {
        title: 'Expand/Collapse Fields',
        description:
          'Click the chevron button (↑/↓) in the table header to expand or collapse fields.',
        tip: 'Collapsed tables show only the Primary Key. Use Expand All / Collapse All in sidebar for bulk actions',
      },
      {
        title: 'Add Fields',
        description:
          'Click the + button on an entity header to open the field drawer and choose which fields to display.',
        tip: 'Click + again or on another table to switch/close the drawer',
      },
      {
        title: 'Primary Name Badge',
        description:
          'Each entity\'s primary name column (e.g., "name" for Account, "fullname" for Contact) is identified by a cyan "PN" badge.',
        tip: 'PN fields sort after PK and can be toggled on/off unlike the locked PK field',
      },
      {
        title: 'Badge-Type Filtering',
        description:
          'In the field drawer, use the badge chips (PK, PN, LKP, TXT, INT, etc.) to filter fields by type. Each chip shows the count of matching fields.',
        tip: 'Click a badge chip to filter, click again to clear. Combine with Selected or Custom filters',
      },
      {
        title: 'Remove Fields',
        description:
          'Click the X button next to any field (except Primary Key) to remove it from display.',
      },
      {
        title: 'Select Entities',
        description: 'Use the sidebar checkboxes to show/hide entities on the canvas.',
        shortcut: 'Ctrl+A / Esc',
      },
    ],
  },
  {
    id: 'views',
    title: 'Views & Layouts',
    icon: <Eye size={20} />,
    features: [
      {
        title: 'Layout Modes',
        description:
          'Choose between Force-Directed (organic), Grid (structured), Auto (hybrid), NICOLAS (Nested Intelligent COmmunity Layout & Alignment System), or Manual (free positioning) layouts.',
        tip: 'Use the layout dropdown in the sidebar to switch between modes',
      },
      {
        title: 'Minimap',
        description: 'Toggle the minimap using the map button below the zoom controls.',
        tip: 'Click on the minimap to navigate quickly to that area',
      },
      {
        title: 'Dark/Light Mode',
        description:
          'Switch between dark and light themes using the sun/moon icon in the sidebar header.',
      },
    ],
  },
  {
    id: 'export',
    title: 'Export Options',
    icon: <Download size={20} />,
    features: [
      {
        title: 'Copy as PNG',
        description: 'Copy the current diagram to clipboard as a transparent PNG image.',
        tip: 'Perfect for pasting into documents, presentations, or chat apps',
      },
      {
        title: 'Export SVG',
        description:
          'Download the diagram as a scalable SVG file. Ideal for further editing or high-quality prints.',
      },
      {
        title: 'Mermaid Code',
        description: 'Copy Mermaid.js code to embed diagrams in markdown documentation or wikis.',
      },
      {
        title: 'Draw.io Export',
        description:
          'Export to Draw.io (.drawio) format with proper connectors and editable elements.',
        tip: 'Open in draw.io (free) or import into Microsoft Visio',
      },
    ],
  },
  {
    id: 'snapshots',
    title: 'Snapshots',
    icon: <Bookmark size={20} />,
    features: [
      {
        title: 'Save Your Work',
        description:
          'Save complete diagram states with custom names. Includes entities, positions, zoom, filters, and all visual settings.',
        shortcut: 'Ctrl+S',
        tip: 'Create snapshots before major changes to easily revert',
      },
      {
        title: 'Load Snapshots',
        description: 'Restore any saved snapshot to instantly return to a previous diagram state.',
        tip: 'Click the Load button in the Snapshot Manager to restore',
      },
      {
        title: 'Auto-Save',
        description:
          'Automatically save your work every 2 seconds. Toggle on/off in the Snapshot Manager header.',
        tip: "Auto-save uses a separate slot and doesn't count toward the 10-snapshot limit",
      },
      {
        title: 'Export & Import',
        description:
          'Export snapshots as JSON files for backup or sharing. Import them on any device or environment.',
        tip: 'Use "Export All" to backup all snapshots at once',
      },
      {
        title: 'Snapshot Manager',
        description:
          'Manage all snapshots in one place: create, rename, delete, export, and import.',
        shortcut: 'Ctrl+Shift+S',
        tip: 'Click the Snapshots button in the toolbar to open',
      },
      {
        title: 'Schema Validation',
        description:
          'Snapshots automatically detect missing entities/fields and filter them out when loading.',
        tip: 'Perfect for loading snapshots from different environments',
      },
    ],
  },
  {
    id: 'sharing',
    title: 'Share URL',
    icon: <Share2 size={20} />,
    features: [
      {
        title: 'Generate Shareable URL',
        description:
          'Create a shareable URL that encodes your current diagram state (entities, positions, zoom, layout, filters).',
        shortcut: 'Ctrl+Shift+C',
        tip: 'Click the Share button in the toolbar to copy URL to clipboard',
      },
      {
        title: 'Quick Collaboration',
        description:
          'Share URLs with colleagues to instantly show them the exact same diagram view.',
        tip: 'URL works with both real Dataverse data and mock data mode',
      },
      {
        title: 'Automatic State Restoration',
        description:
          'When someone opens your shared URL, the diagram automatically restores to your exact configuration.',
        tip: 'Refresh the page and the shared state persists from the URL',
      },
      {
        title: 'Schema Validation',
        description:
          "If shared entities don't exist in the recipient's environment, they'll see a warning and the diagram loads with available entities.",
        tip: 'Perfect for sharing between dev, test, and prod environments',
      },
      {
        title: 'Minimal & Compressed',
        description:
          'URLs use LZ-String compression (60-70% reduction) to keep links short and browser-friendly.',
        tip: 'Most diagrams fit within 2KB URL size',
      },
      {
        title: 'URL vs Snapshots',
        description:
          'Share URLs for quick collaboration (minimal state). Use Snapshots for complete archival (includes fields, colors, all settings).',
        tip: 'Both features complement each other perfectly',
      },
    ],
  },
  {
    id: 'customization',
    title: 'Customization',
    icon: <Palette size={20} />,
    features: [
      {
        title: 'Table Colors',
        description:
          'Customize colors for custom tables (your entities) and standard tables (Microsoft entities).',
        tip: 'Click the gear icon in the sidebar to access settings',
      },
      {
        title: 'Per-Table Colors',
        description:
          'Assign unique header colors to individual tables using the palette icon on each table header. Choose from 10 preset colors or pick a custom color.',
        tip: 'Per-table colors override global settings and are saved with snapshots and shared URLs. Use "Reset All Table Colors" in Settings to clear all overrides',
      },
      {
        title: 'Relationship Line Notation',
        description:
          "Choose between Crow's Foot notation (database ERD standard), UML style (composition/aggregation diamonds), or Simple arrows.",
        tip: "Crow's Foot shows cardinality markers (one/many), UML shows relationship semantics",
      },
      {
        title: 'Line Appearance',
        description:
          'Customize stroke style (solid/dashed/dotted), thickness (1-5px), and enable color coding by relationship type (1:N vs N:N).',
        tip: 'Use dashed lines for optional relationships, color coding to distinguish relationship types',
      },
      {
        title: 'Edge Routing Style',
        description:
          'Choose between Smooth Step (default), Bezier Curve, or Straight lines for relationship routing.',
        tip: 'Smooth Step is recommended for readability with complex diagrams',
      },
      {
        title: 'Field Label Display',
        description:
          'Choose how field names are displayed on entity cards: Display Name only, Schema Name only, or Both (display name with schema name below).',
        tip: 'Use "Both" mode to see the friendly name alongside the logical name — helpful when customizing or debugging fields',
      },
      {
        title: 'Filter by Publisher',
        description:
          'Filter entities by their publisher prefix to focus on specific customizations.',
      },
      {
        title: 'Filter by Solution',
        description: 'Show only entities from a specific solution for targeted analysis.',
      },
    ],
  },
  {
    id: 'relationships',
    title: 'Relationships',
    icon: <MousePointer2 size={20} />,
    features: [
      {
        title: 'Relationship Lines',
        description:
          'Lines connect related entities, showing lookup relationships between tables with customizable notation styles.',
        tip: "Choose from Crow's Foot, UML, or Simple arrow notation in settings",
      },
      {
        title: 'Cardinality Markers',
        description:
          "Visual markers show relationship cardinality: one (single line), many (crow's foot), or optional (circle).",
        tip: "Crow's Foot notation provides the most detailed cardinality information",
      },
      {
        title: 'Field-to-Field Connections',
        description:
          'When lookup and primary key fields are visible, lines connect directly between them.',
        tip: 'Add the lookup field and primary key to see precise connections',
      },
      {
        title: 'Auto-Refresh',
        description:
          'In Dataverse mode, relationships are automatically detected when you return to the tab after 5+ seconds. Perfect for detecting new lookup fields.',
        tip: 'Silent refresh preserves your diagram layout and shows a toast notification for new relationships',
      },
      {
        title: 'Self-Reference Loops',
        description:
          'Entities that reference themselves (like parent-child hierarchies) show a loop on the right side.',
      },
    ],
  },
];

export function FeatureGuide({ isOpen, onClose, onDontShowAgain }: FeatureGuideProps) {
  const [activeCategory, setActiveCategory] = useState('navigation');
  const { isDarkMode, themeColors } = useTheme();
  const { panelBg, borderColor, textColor, textSecondary } = themeColors;

  if (!isOpen) return null;

  const activeCategoryData = FEATURE_CATEGORIES.find((c) => c.id === activeCategory);
  const dialogTitleId = 'feature-guide-title';
  const dialogDescId = 'feature-guide-description';

  return (
    <div
      role="presentation"
      aria-hidden="true"
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogTitleId}
        aria-describedby={dialogDescId}
        className={styles.dialog}
        style={{
          background: panelBg,
          border: `1px solid ${borderColor}`,
        }}
      >
        {/* Header */}
        <div
          className={`${styles.header} ${isDarkMode ? styles.headerDark : styles.headerLight}`}
          style={{ borderBottom: `1px solid ${borderColor}` }}
        >
          <div className={styles.headerContent}>
            <img src={LOGO_DATA_URL} alt="Dataverse ERD Visualizer" className={styles.logo} />
            <div>
              <h2 id={dialogTitleId} className={styles.headerTitle} style={{ color: textColor }}>
                Welcome to Dataverse ERD Visualizer
              </h2>
              <p
                id={dialogDescId}
                className={styles.headerSubtitle}
                style={{ color: textSecondary }}
              >
                Discover all the features to visualize your Dataverse schema
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close feature guide"
            className={styles.closeButton}
            style={{
              background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              color: textSecondary,
            }}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {/* Category Sidebar */}
          <nav
            role="tablist"
            aria-label="Feature categories"
            className={`${styles.categorySidebar} ${isDarkMode ? styles.categorySidebarDark : styles.categorySidebarLight}`}
            style={{ borderRight: `1px solid ${borderColor}` }}
          >
            {FEATURE_CATEGORIES.map((category) => {
              const isActive = activeCategory === category.id;
              const buttonClasses = [
                styles.categoryButton,
                isActive ? styles.categoryButtonActive : styles.categoryButtonInactive,
                isActive
                  ? isDarkMode
                    ? styles.categoryButtonActiveDark
                    : styles.categoryButtonActiveLight
                  : '',
              ].join(' ');

              return (
                <button
                  key={category.id}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`tabpanel-${category.id}`}
                  id={`tab-${category.id}`}
                  onClick={() => setActiveCategory(category.id)}
                  className={buttonClasses}
                  style={{ color: isActive ? undefined : textColor }}
                >
                  <span aria-hidden="true">{category.icon}</span>
                  {category.title}
                  {isActive && (
                    <ChevronRight size={16} style={{ marginLeft: 'auto' }} aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Feature Details */}
          <div
            role="tabpanel"
            id={`tabpanel-${activeCategory}`}
            aria-labelledby={`tab-${activeCategory}`}
            className={styles.featurePanel}
          >
            {activeCategoryData && (
              <>
                <div className={styles.featureCategoryHeader}>
                  <span
                    aria-hidden="true"
                    className={
                      isDarkMode ? styles.featureCategoryIconDark : styles.featureCategoryIconLight
                    }
                  >
                    {activeCategoryData.icon}
                  </span>
                  <h3 className={styles.featureCategoryTitle} style={{ color: textColor }}>
                    {activeCategoryData.title}
                  </h3>
                </div>

                <div className={styles.featureList}>
                  {activeCategoryData.features.map((feature, index) => (
                    <div
                      key={index}
                      className={`${styles.featureCard} ${isDarkMode ? styles.featureCardDark : styles.featureCardLight}`}
                      style={{ border: `1px solid ${borderColor}` }}
                    >
                      <div className={styles.featureCardContent}>
                        <div className={styles.featureCardText}>
                          <h4 className={styles.featureTitle} style={{ color: textColor }}>
                            {feature.title}
                          </h4>
                          <p className={styles.featureDescription} style={{ color: textSecondary }}>
                            {feature.description}
                          </p>
                          {feature.tip && (
                            <p
                              className={`${styles.featureTip} ${isDarkMode ? styles.featureTipDark : styles.featureTipLight}`}
                            >
                              <HelpCircle size={12} aria-hidden="true" />
                              Tip: {feature.tip}
                            </p>
                          )}
                        </div>
                        {feature.shortcut && (
                          <kbd
                            className={`${styles.featureShortcut} ${isDarkMode ? styles.featureShortcutDark : styles.featureShortcutLight}`}
                            style={{
                              color: textColor,
                              border: `1px solid ${borderColor}`,
                            }}
                          >
                            {feature.shortcut}
                          </kbd>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className={`${styles.footer} ${isDarkMode ? styles.footerDark : styles.footerLight}`}
          style={{ borderTop: `1px solid ${borderColor}` }}
        >
          <label className={styles.checkboxLabel} style={{ color: textSecondary }}>
            <input
              type="checkbox"
              className={styles.checkbox}
              onChange={(e) => {
                if (e.target.checked) {
                  onDontShowAgain();
                }
              }}
            />
            Don't show this again
          </label>

          <div className={styles.footerActions}>
            <button
              onClick={onClose}
              aria-label="Close guide and get started"
              className={styles.getStartedButton}
            >
              Get Started
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
