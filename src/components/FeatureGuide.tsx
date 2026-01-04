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
import type { ThemeColors } from '@/types/erdTypes';
import { LOGO_DATA_URL } from '@/constants';

export interface FeatureGuideProps {
  isOpen: boolean;
  isDarkMode: boolean;
  themeColors: ThemeColors;
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
  isDarkMode,
  themeColors,
  onClose,
  onDontShowAgain,
}: FeatureGuideProps) {
  const [activeCategory, setActiveCategory] = useState('navigation');
  const { panelBg, borderColor, textColor, textSecondary } = themeColors;

  if (!isOpen) return null;

  const activeCategoryData = FEATURE_CATEGORIES.find((c) => c.id === activeCategory);
  const dialogTitleId = 'feature-guide-title';
  const dialogDescId = 'feature-guide-description';

  return (
    <div
      role="presentation"
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogTitleId}
        aria-describedby={dialogDescId}
        style={{
          background: panelBg,
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
          width: '100%',
          maxWidth: '800px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: `1px solid ${borderColor}`,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${borderColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: isDarkMode
              ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.1), rgba(139, 92, 246, 0.1))'
              : 'linear-gradient(135deg, rgba(96, 165, 250, 0.15), rgba(139, 92, 246, 0.15))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src={LOGO_DATA_URL}
              alt="Dataverse ERD Visualizer"
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
              }}
            />
            <div>
              <h2
                id={dialogTitleId}
                style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: textColor }}
              >
                Welcome to Dataverse ERD Visualizer
              </h2>
              <p
                id={dialogDescId}
                style={{ margin: '4px 0 0', fontSize: '14px', color: textSecondary }}
              >
                Discover all the features to visualize your Dataverse schema
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close feature guide"
            style={{
              background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: textSecondary,
              transition: 'background 0.2s',
            }}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Category Sidebar */}
          <nav
            role="tablist"
            aria-label="Feature categories"
            style={{
              width: '220px',
              borderRight: `1px solid ${borderColor}`,
              padding: '12px',
              overflowY: 'auto',
              background: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
            }}
          >
            {FEATURE_CATEGORIES.map((category) => (
              <button
                key={category.id}
                role="tab"
                aria-selected={activeCategory === category.id}
                aria-controls={`tabpanel-${category.id}`}
                id={`tab-${category.id}`}
                onClick={() => setActiveCategory(category.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 14px',
                  background:
                    activeCategory === category.id
                      ? isDarkMode
                        ? 'rgba(96, 165, 250, 0.2)'
                        : 'rgba(37, 99, 235, 0.1)'
                      : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color:
                    activeCategory === category.id
                      ? isDarkMode
                        ? '#60a5fa'
                        : '#2563eb'
                      : textColor,
                  fontSize: '14px',
                  fontWeight: activeCategory === category.id ? '600' : '500',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  marginBottom: '4px',
                }}
              >
                <span aria-hidden="true">{category.icon}</span>
                {category.title}
                {activeCategory === category.id && (
                  <ChevronRight size={16} style={{ marginLeft: 'auto' }} aria-hidden="true" />
                )}
              </button>
            ))}
          </nav>

          {/* Feature Details */}
          <div
            role="tabpanel"
            id={`tabpanel-${activeCategory}`}
            aria-labelledby={`tab-${activeCategory}`}
            style={{ flex: 1, padding: '20px 24px', overflowY: 'auto' }}
          >
            {activeCategoryData && (
              <>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '20px',
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      color: isDarkMode ? '#60a5fa' : '#2563eb',
                    }}
                  >
                    {activeCategoryData.icon}
                  </span>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: textColor }}>
                    {activeCategoryData.title}
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {activeCategoryData.features.map((feature, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '16px',
                        background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                        borderRadius: '10px',
                        border: `1px solid ${borderColor}`,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: '12px',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <h4
                            style={{
                              margin: '0 0 6px',
                              fontSize: '15px',
                              fontWeight: '600',
                              color: textColor,
                            }}
                          >
                            {feature.title}
                          </h4>
                          <p
                            style={{
                              margin: 0,
                              fontSize: '13px',
                              color: textSecondary,
                              lineHeight: '1.5',
                            }}
                          >
                            {feature.description}
                          </p>
                          {feature.tip && (
                            <p
                              style={{
                                margin: '8px 0 0',
                                fontSize: '12px',
                                color: isDarkMode ? '#a78bfa' : '#7c3aed',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              <HelpCircle size={12} aria-hidden="true" />
                              Tip: {feature.tip}
                            </p>
                          )}
                        </div>
                        {feature.shortcut && (
                          <kbd
                            style={{
                              padding: '6px 10px',
                              background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontFamily: 'system-ui',
                              fontWeight: '600',
                              color: textColor,
                              whiteSpace: 'nowrap',
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
          style={{
            padding: '16px 24px',
            borderTop: `1px solid ${borderColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              color: textSecondary,
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              onChange={(e) => {
                if (e.target.checked) {
                  onDontShowAgain();
                }
              }}
              style={{
                width: '16px',
                height: '16px',
                cursor: 'pointer',
              }}
            />
            Don't show this again
          </label>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onClose}
              aria-label="Close guide and get started"
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #60a5fa, #8b5cf6)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(96, 165, 250, 0.3)',
              }}
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
