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
        shortcut: 'Arrow Keys',
        tip: 'Hold and drag for smooth navigation',
      },
      {
        title: 'Zoom In/Out',
        description:
          'Use mouse wheel or zoom buttons to zoom. Smart zoom adjusts based on entity density.',
        shortcut: '+ / -',
      },
      {
        title: 'Fit to Screen',
        description: 'Automatically fits all entities in the visible area.',
        shortcut: 'F',
      },
      {
        title: 'Search & Navigate',
        description: 'Search for entities by name and jump directly to them.',
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
        description: 'Click and drag any entity card to reposition it on the canvas.',
      },
      {
        title: 'Expand/Collapse',
        description: 'Click the chevron on entity cards to show/hide field details.',
        tip: 'Use Expand All / Collapse All in sidebar for bulk actions',
      },
      {
        title: 'Field Selection',
        description: 'Click the settings icon on an entity to choose which fields to display.',
      },
      {
        title: 'Select Entities',
        description: 'Use the sidebar checkboxes to show/hide entities on the canvas.',
        shortcut: 'Ctrl+A / Ctrl+D',
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
        description: 'Choose between Grid, Hierarchical, or Force-Directed layouts in the sidebar.',
      },
      {
        title: 'Minimap',
        description: 'Toggle the minimap for an overview of your entire diagram.',
        tip: 'Click on minimap to navigate quickly',
      },
      {
        title: 'Dark/Light Mode',
        description: 'Switch between dark and light themes for comfortable viewing.',
      },
      {
        title: 'Canvas Mode',
        description:
          'Toggle Canvas Mode for better performance with large diagrams (100+ entities).',
        tip: 'Look for the toggle in the bottom-right corner',
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
        description: 'Copy the current diagram to clipboard as a high-quality PNG image.',
        tip: 'Perfect for pasting into documents or presentations',
      },
      {
        title: 'Export SVG',
        description: 'Download the diagram as a scalable SVG file for further editing.',
      },
      {
        title: 'Mermaid Code',
        description: 'Generate Mermaid.js code to embed diagrams in markdown documentation.',
      },
      {
        title: 'Draw.io Export',
        description: 'Export to Draw.io format with proper connectors between tables.',
        tip: 'Open in draw.io (free) or import into Microsoft Visio',
      },
    ],
  },
  {
    id: 'customization',
    title: 'Customization',
    icon: <Palette size={20} />,
    features: [
      {
        title: 'Color Settings',
        description: 'Customize colors for custom tables, standard tables, and lookup fields.',
        tip: 'Click the settings icon in the sidebar to access color options',
      },
      {
        title: 'Filter by Publisher',
        description: 'Filter entities by their publisher prefix to focus on specific solutions.',
      },
      {
        title: 'Filter by Solution',
        description: 'Show only entities from a specific solution.',
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
        description: 'Lines connect related entities showing lookup relationships.',
        tip: 'Hover over lines to highlight them',
      },
      {
        title: 'Cardinality Markers',
        description: "Crow's foot notation shows relationship types: 1:N, N:1, N:N.",
      },
      {
        title: 'Field Connections',
        description: 'Lines connect from lookup fields to primary keys when fields are visible.',
      },
    ],
  },
];

export function FeatureGuide({
  isOpen,
  onClose,
  onDontShowAgain,
}: FeatureGuideProps) {
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
            <img
              src={LOGO_DATA_URL}
              alt="Dataverse ERD Visualizer"
              className={styles.logo}
            />
            <div>
              <h2 id={dialogTitleId} className={styles.headerTitle} style={{ color: textColor }}>
                Welcome to Dataverse ERD Visualizer
              </h2>
              <p id={dialogDescId} className={styles.headerSubtitle} style={{ color: textSecondary }}>
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
                    className={isDarkMode ? styles.featureCategoryIconDark : styles.featureCategoryIconLight}
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
                            <p className={`${styles.featureTip} ${isDarkMode ? styles.featureTipDark : styles.featureTipLight}`}>
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
