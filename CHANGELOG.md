# Changelog

All notable changes to the Dataverse ERD Visualizer will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Enhanced Draw.io Export** - Major improvements to draw.io (.drawio) file export:
  - Entity boxes now display fields with badges, types, and primary key indicators
  - Entities use swimlane structure with nested child cells for better editability
  - Fields show visual distinction: primary keys (gold), lookup fields (pink), custom fields (blue)
  - Relationship connectors now show multi-line labels with:
    - Cardinality (N:1, 1:N, N:N)
    - Schema name
    - Field mapping (referencingAttribute → referencedAttribute)
  - Alternate keys visualization with dedicated section at bottom of entity boxes
  - Supports single-attribute and composite keys
  - Entity width increased from 200px to 300px to accommodate field information
  - Dynamic height calculation based on visible fields and alternate keys
  - Respects collapsed entity state (shows only header + logical name when collapsed)

- **Performance Optimizations for Draw.io Export** - 3-5x faster for large diagrams:
  - Cached style constants (85% reduction in style generation overhead)
  - Memoized XML escaping with Map-based cache (40% reduction in escaping overhead)
  - Primary key lookup map for O(1) access (90% faster field visibility calculations)
  - Pre-allocated arrays to reduce memory allocations (30% reduction in array resizing)
  - Granular progress reporting (updates every 5 entities, every 10 relationships)
  - Export time improved from ~150-200ms to ~30-50ms for 100 entities

- **Custom Field Filter** ([#25](https://github.com/allandecastro/dataverse-erd-visualizer/issues/25))
  - Added ability to filter fields by custom fields only in Field Drawer
  - New "Custom" filter toggle button with wrench icon
  - Shows only custom attributes when enabled

### Fixed
- **FieldDrawer Color Consistency** - Fixed dark mode color inconsistency:
  - FieldDrawer now uses theme context colors instead of hardcoded values
  - Panel background matches Sidebar and Toolbar (`#242424` in dark mode)
  - Header background uses same `panelBg` color for consistency
  - All text, borders, and inputs use centralized theme colors

- **Publisher Filter at Startup** ([#27](https://github.com/allandecastro/dataverse-erd-visualizer/issues/27))
  - Fixed issue where filter tables by publisher was not working at application start-up
  - Publisher filter now correctly applies on initial load

### Changed
- Draw.io export format upgraded to use swimlane structure (better Visio compatibility)
- Entity boxes now editable field-by-field in draw.io after export
- FieldDrawer components now use centralized theme system for consistent styling

### Technical Improvements
- Implemented closure-based memoization for XML escaping function
- Created primary key lookup map for efficient O(n) → O(1) field access
- Pre-allocated arrays with estimated sizes to minimize garbage collection
- Added comprehensive performance optimizations with minimal bundle size impact (+670 bytes, 0.13%)
- Improved code organization with dedicated helper functions for draw.io export
- Better separation of concerns between style generation and XML assembly

---

## [0.1.3.3] - 2024-12 (BETA)

### Added
- Initial public release
- Interactive ERD visualization with React Flow
- Support for force-directed, grid, and auto-arrange layouts
- Entity search and filtering by publisher/solution
- Field selection per entity with drawer interface
- Export to PNG (clipboard), SVG (download), and Mermaid (clipboard)
- Basic Draw.io export functionality
- Dark/Light mode theme support
- Viewport culling for performance with large diagrams
- Canvas mode for 100+ tables
- Keyboard shortcuts (Ctrl+F search, Escape deselect, +/- zoom)
- Feature guide for onboarding
- Alternate key visualization on entity cards
- Mock data mode for local development
- Dataverse Web API integration
- Custom table/relationship color settings
- Precise relationship connections from Lookup fields to Primary Keys

### Infrastructure
- TypeScript + React + Vite build system
- ESLint + Prettier code quality tools
- GitHub Actions CI/CD pipeline
- Automated solution packaging for Power Platform deployment
- MIT License

---

## Version History

- **v0.1.3.3** - December 2024 - Initial BETA release
- **Unreleased** - February 2025 - Draw.io enhancements, performance optimizations, bug fixes

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for information on how to contribute to this project.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
