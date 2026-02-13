<p align="center">
  <img src="public/logo.svg" alt="Dataverse ERD Visualizer" width="180" height="180">
</p>

<h1 align="center">Dataverse ERD Visualizer</h1>

<p align="center">
  <strong>Interactive Entity Relationship Diagram Visualizer for Microsoft Dataverse / Dynamics 365 </strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-0.1.9.0_BETA-blue?style=for-the-badge" alt="Version" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge" alt="License" />
  <a href="https://github.com/allandecastro/dataverse-erd-visualizer/actions/workflows/ci.yml"><img src="https://github.com/allandecastro/dataverse-erd-visualizer/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://github.com/allandecastro/dataverse-erd-visualizer/actions/workflows/release.yml"><img src="https://github.com/allandecastro/dataverse-erd-visualizer/actions/workflows/release.yml/badge.svg" alt="CD" /></a>
</p>

<p align="center">
<img src="https://img.shields.io/badge/Dataverse-00C853?style=for-the-badge&logo=microsoft-azure&logoColor=white" alt="Dataverse" />
  <img src="https://img.shields.io/badge/Dynamics_365-0078D4?style=for-the-badge&logo=microsoft&logoColor=white" alt="Dynamics 365" />
  <img src="https://img.shields.io/badge/Power_Platform-742774?style=for-the-badge&logo=powerapps&logoColor=white" alt="Power Platform" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#features">Features</a> •
  <a href="#development">Development</a> •
  <a href="#documentation">Documentation</a> •
  <a href="#contributing">Contributing</a>
</p>

---

## Preview

<p align="center">
  <img src="docs/screenshot.png" alt="Dataverse ERD Visualizer Screenshot" width="100%">
</p>

<p align="center">
  <em>Visualize your Dataverse schema with interactive entity relationship diagrams</em>
</p>

---

## Features

### Core Visualization

| Feature                   | Description                                                              |
| ------------------------- | ------------------------------------------------------------------------ |
| **Visual ERD**            | Interactive layouts: Force-Directed, Grid, Auto-Arrange, NICOLAS, Manual |
| **Precise Relationships** | Connections from Lookup fields to Primary Keys                           |
| **Alternate Keys**        | Display entity alternate keys with composite key support                 |
| **Smart Navigation**      | Smart Zoom, Minimap, Fit to Screen                                       |
| **NICOLAS Layout**        | Community-aware hierarchical layout using Leiden detection + Sugiyama    |
| **Dataverse Integration** | Fetch live metadata from your environment                                |

### Performance

| Feature                 | Description                                                              |
| ----------------------- | ------------------------------------------------------------------------ |
| **Viewport Culling**    | Only renders visible entities for smooth performance                     |
| **Canvas Mode**         | High-performance HTML5 Canvas rendering for large diagrams (100+ tables) |
| **Optimized Rendering** | Efficient React.memo and lazy loading                                    |

### User Experience

| Feature                | Description                                                                                                                               |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Search & Filter**    | Quick search by table name, filter by publisher/solution, filter-aware Select All/None                                                    |
| **Field Selector**     | Choose which fields to display per table with badge-type filtering                                                                        |
| **Primary Name Badge** | Cyan "PN" badge identifies each entity's primary name column ([#48](https://github.com/allandecastro/dataverse-erd-visualizer/issues/48)) |
| **Snapshots**          | Save/restore complete diagram states with auto-save, export/import                                                                        |
| **Share URL**          | Generate shareable URLs with one-click clipboard copy, automatic state restoration                                                        |
| **Keyboard Shortcuts** | Ctrl+S (save), Ctrl+Shift+S (snapshots), Ctrl+Shift+C (share), / (search), Esc (deselect)                                                 |
| **Feature Guide**      | Interactive onboarding for new users                                                                                                      |

### Export & Customization

| Feature                           | Description                                                                                        |
| --------------------------------- | -------------------------------------------------------------------------------------------------- |
| **Multiple Exports**              | PNG (clipboard), SVG (download), Mermaid (clipboard)                                               |
| **Draw.io Export**                | Full diagram export compatible with Draw.io and Microsoft Visio                                    |
| **Dark/Light Mode**               | Professional themes with automatic persistence                                                     |
| **Custom Colors**                 | Global table colors + per-entity color overrides with palette picker                               |
| **Entity Grouping**               | Auto-derived groups from shared colors, collapsible sidebar sections, group filter, inline rename  |
| **Relationship Line Styles**      | Choose between Crow's Foot notation, UML style, or simple arrows                                   |
| **Line Appearance**               | Solid/dashed/dotted strokes, adjustable thickness (1-5px), color by relationship type (1:N vs N:N) |
| **Advanced Relationship Visuals** | Professional database notation for technical documentation and presentations                       |

---

## Installation

Choose your preferred installation method:

### Option 1: Quick Install (Recommended)

Download and import the pre-built managed solution directly into your Dataverse environment.

<p align="center">
  <a href="https://github.com/allandecastro/dataverse-erd-visualizer/releases/latest">
    <img src="https://img.shields.io/badge/Download-Managed_Solution-00A4EF?style=for-the-badge&logo=microsoft&logoColor=white" alt="Download Managed Solution" />
  </a>
</p>

1. Download `DataverseERDVisualizer_x.x.x_managed.zip` from [Releases](https://github.com/allandecastro/dataverse-erd-visualizer/releases)
2. Go to [make.powerapps.com](https://make.powerapps.com) → Select your environment
3. Navigate to **Solutions** → Click **Import solution**
4. Browse and select the downloaded `.zip` file
5. Click **Next** → **Import**

**Using PAC CLI:**

```bash
pac auth create --environment "https://yourorg.crm.dynamics.com"
pac solution import --path DataverseERDVisualizer_x.x.x_managed.zip
```

### Option 2: Build from Source

Build the solution yourself from source code.

#### Prerequisites

- Node.js 18+
- npm or yarn
- (Optional) [Power Platform CLI](https://learn.microsoft.com/en-us/power-platform/developer/cli/introduction)

#### Build Steps

```bash
# Clone the repository
git clone https://github.com/allandecastro/dataverse-erd-visualizer.git
cd dataverse-erd-visualizer

# Install dependencies
npm install

# Build for Dataverse web resource
npm run build:webresource
```

Output files in `dist/webresource/`:
| File | Description |
|------|-------------|
| `adc_dataverseerdvisualizer.html` | HTML entry point |
| `adc_dataverseerdvisualizer.js` | Main bundle (~274 KB, gzipped: ~77 KB) |
| `adc_dataverseerdvisualizer.css` | Stylesheet |
| `adc_dataverseerdvisualizerlogo.svg` | Application logo |

#### Manual Deployment

1. Go to [make.powerapps.com](https://make.powerapps.com) → **Solutions** → Your solution
2. Click **+ New** → **More** → **Web resource**
3. Upload each file with the appropriate type:
   - `adc_dataverseerdvisualizer.js` → Type: **Script (JS)**
   - `adc_dataverseerdvisualizer.css` → Type: **Style Sheet (CSS)**
   - `adc_dataverseerdvisualizerlogo.svg` → Type: **Image (SVG)**
   - `adc_dataverseerdvisualizer.html` → Type: **Web Page (HTML)**
4. **Save** and **Publish All Customizations**

#### Package as Solution

See [`solution/README.md`](solution/README.md) for instructions on packaging your build as a Dataverse solution.

---

### Add to Model-Driven App

After importing or deploying the web resources:

1. Open your app in **App Designer**
2. Add a new **Subarea** (or Page)
3. Configure:
   - **Content Type:** Web Resource
   - **Web Resource:** `adc_dataverseerdvisualizer.html`
4. **Save** and **Publish**

> **Detailed Instructions:** See [DEPLOYMENT.md](DEPLOYMENT.md) for additional deployment options and troubleshooting.

---

## Development

Run the application locally with mock data for development and testing.

```bash
# Clone the repository
git clone https://github.com/allandecastro/dataverse-erd-visualizer.git
cd dataverse-erd-visualizer

# Install dependencies
npm install

# Start development server
npm run dev
```

The app opens at `http://localhost:3000` with **mock data** - no Dataverse connection required!

You'll see a **"MOCK MODE"** banner indicating you're using simulated data.

> **Tip:** Force mock mode via URL parameter: `?mock=true`

### Testing

The project includes comprehensive test coverage for critical functionality.

```bash
# Run tests in watch mode
npm run test

# Run tests once (CI mode)
npm run test:run

# Run with coverage report
npm run test:coverage

# Open visual test UI
npm run test:ui
```

**Test Coverage:**

- **380 tests** across 16 test suites
- Unit tests for utilities (URL codec, Draw.io export, badges, serialization, edge markers, NICOLAS layout)
- Integration tests for hooks (useERDState, useSnapshots, useLayoutAlgorithms, useKeyboardShortcuts)
- Component tests (EdgeMarkerDefinitions, Toast)
- Algorithm tests (Leiden community detection, Sugiyama layout, strip-packing)
- Security tests (XML injection prevention, URL safety validation)

**Pre-commit Hooks:**

- Automatically format and lint staged files
- Run full test suite before commit
- Prevents committing broken code
- Bypass with `git commit --no-verify` if needed

**Viewing Coverage Reports:**

```bash
npm run test:coverage
# Open coverage/index.html in your browser
```

---

## Documentation

### Keyboard Shortcuts

| Shortcut               | Action                             |
| ---------------------- | ---------------------------------- |
| `Ctrl/Cmd + S`         | Save new snapshot                  |
| `Ctrl/Cmd + Shift + S` | Open Snapshot Manager              |
| `Ctrl/Cmd + Shift + C` | Generate and copy shareable URL    |
| `Ctrl/Cmd + A`         | Select all tables                  |
| `/`                    | Focus search box                   |
| `Escape`               | Deselect entity / Close dialogs    |
| `+` / `=`              | Zoom in                            |
| `-`                    | Zoom out                           |
| Mouse wheel            | Zoom in/out                        |
| Click + Drag           | Pan canvas                         |
| Click entity           | Select and highlight relationships |

### Relationship Line Customization

Visualize relationships with professional database notation styles:

**Line Notation Styles:**

- **Simple Arrows** (default) - Clean, minimalist arrows
- **Crow's Foot Notation** - Standard database ERD notation showing cardinality (one/many)
- **UML Style** - Unified Modeling Language with composition (filled diamond) and aggregation (hollow diamond)

**Line Appearance:**

- **Stroke Style** - Solid, dashed, or dotted lines
- **Thickness** - Adjustable from 1px to 5px
- **Color by Type** - Distinct colors for single relationships (1:N) vs many-to-many (N:N)

**How to access:**

1. Open **Settings** panel in the sidebar (⚙️ icon)
2. Scroll to **Color Settings** section
3. Adjust **Line Notation Style**, **Line Stroke Style**, and **Line Thickness**
4. Enable **Color by Relationship Type** for type-specific colors

All settings are automatically saved in snapshots and shareable URLs.

### Many-to-Many (N:N) Relationships

**Understanding N:N Relationships in Dataverse:**

Many-to-many relationships work differently from single relationships (1:N, N:1):

**Key Differences:**

- ❌ **Not represented as fields** - No lookup field exists on either table
- ✅ **Use intersection tables** - Dataverse creates a hidden table (e.g., `accountleads`)
- ✅ **Bidirectional** - Associates entities in both directions
- ✅ **Automatically detected** - Fetched from Dataverse metadata

**How They Appear in the ERD:**

- **Label Format:** `[N:N] intersection_table_name`
- **Visual Distinction:**
  - Purple color by default (when "Color by Relationship Type" is enabled)
  - Shows intersection table name in the edge label
  - UML notation uses hollow diamond (aggregation)
  - Crow's Foot notation shows fork on both ends

**Example:**

```
Account ←[N:N] accountleads→ Lead
```

**How to Create N:N Relationships:**

1. Open **Dataverse** (make.powerapps.com)
2. Navigate to **Tables** → Select your table
3. Go to **Relationships** tab
4. Click **+ Add relationship** → **Many-to-many**
5. Select the related table and save
6. Return to ERD and click **Refresh (↻)** to see the new relationship

**Why N:N Can't Be Created in the ERD:**

- Requires Dataverse API write permissions
- Needs intersection table configuration
- Complex validation rules
- Best managed through Dataverse UI

**Viewing N:N Relationships:**

- All existing N:N relationships automatically appear in the ERD
- Use the search to find specific entities
- Filter by solution to see solution-specific N:N relationships
- Hover over the edge label to see full intersection table name

### Project Structure

```
dataverse-erd-visualizer/
├── public/
│   └── logo.svg                       # Application logo
├── src/
│   ├── components/                    # React components
│   │   ├── ReactFlowERD.tsx              # Main React Flow canvas
│   │   ├── TableNode.tsx                 # Custom entity table node
│   │   ├── DraggableEdge.tsx             # Adjustable relationship edge
│   │   ├── SelfReferenceEdge.tsx         # Self-referencing edge (loops)
│   │   ├── RelationshipEdge.tsx          # Standard relationship edge
│   │   ├── EdgeMarkerDefinitions.tsx     # SVG marker definitions for crow's foot/UML
│   │   ├── Sidebar.tsx                   # Left panel with filters
│   │   ├── SidebarHeader.tsx             # Logo, theme toggle, settings
│   │   ├── SidebarFilters.tsx            # Search, publisher, solution filters
│   │   ├── SidebarSettings.tsx           # Color & line customization panel
│   │   ├── SidebarLegend.tsx             # Color legend
│   │   ├── Toolbar.tsx                   # Top bar with stats & exports
│   │   ├── ToolbarStats.tsx              # Entity/relationship counts
│   │   ├── ToolbarExportButtons.tsx      # Export action buttons
│   │   ├── EntitySearch.tsx              # Entity search dialog
│   │   ├── FeatureGuide.tsx              # Onboarding modal
│   │   ├── FieldDrawer.tsx               # Field selection drawer
│   │   ├── FieldSelector.tsx             # In-node field picker
│   │   ├── Toast.tsx                     # Notification toasts
│   │   ├── VirtualEntityList.tsx         # Virtualized entity list
│   │   ├── AddRelatedTableDialog.tsx     # Lookup field confirmation
│   │   ├── KeyboardShortcutsPopup.tsx    # Shortcuts reference
│   │   ├── ErrorBoundary.tsx             # Error handling wrapper
│   │   └── index.ts                      # Component exports
│   ├── context/                       # React Context
│   │   ├── ThemeContext.tsx              # Theme provider (dark/light)
│   │   ├── useThemeHooks.ts              # useTheme() hook
│   │   └── index.ts                      # Context exports
│   ├── hooks/                         # Custom React hooks
│   │   ├── __tests__/                    # Hook integration tests
│   │   │   ├── useERDState.test.tsx         # useERDState hook tests
│   │   │   ├── useSnapshots.test.tsx        # Snapshot CRUD tests
│   │   │   ├── useLayoutAlgorithms.test.tsx # Layout algorithm tests
│   │   │   └── useKeyboardShortcuts.test.ts # Keyboard event tests
│   │   ├── useDataverseData.ts           # Dataverse API data fetching
│   │   ├── useERDState.ts                # Main ERD state management
│   │   ├── useKeyboardShortcuts.ts       # Keyboard event handling
│   │   ├── useLayoutAlgorithms.ts        # Force/Grid/Auto/NICOLAS layouts
│   │   ├── useSnapshots.ts               # Snapshot management
│   │   ├── useVirtualScroll.ts           # Virtual scroll logic
│   │   └── index.ts                      # Hook exports
│   ├── services/                      # API services
│   │   ├── dataverseApi.ts               # Dataverse Web API client
│   │   └── mockData.ts                   # Mock data for development
│   ├── test/                          # Test infrastructure
│   │   ├── __tests__/                    # Setup tests
│   │   │   └── setup.test.ts                # Test setup verification
│   │   └── setup.ts                      # Global test setup & mocks
│   ├── styles/                        # CSS Modules
│   │   ├── Sidebar.module.css            # Sidebar styles
│   │   ├── Toolbar.module.css            # Toolbar styles
│   │   ├── EntitySearch.module.css       # Search dialog styles
│   │   ├── FeatureGuide.module.css       # Guide modal styles
│   │   ├── TableNode.module.css          # Entity card styles
│   │   ├── Toast.module.css              # Notification styles
│   │   └── ...                           # Additional CSS modules
│   ├── types/                         # TypeScript definitions
│   │   ├── index.ts                      # Core types (Entity, etc.)
│   │   └── erdTypes.ts                   # ERD-specific types
│   ├── utils/                         # Utility functions
│   │   ├── __tests__/                    # Utility tests
│   │   │   ├── urlStateCodec.test.ts        # URL state codec tests
│   │   │   ├── drawioExport.test.ts         # Draw.io export tests
│   │   │   ├── badges.test.ts               # Badge classification tests
│   │   │   ├── snapshotSerializer.test.ts   # Snapshot serialization tests
│   │   │   ├── edgeMarkers.test.ts          # Edge marker utility tests
│   │   │   ├── exportUtils.test.ts          # Export utility tests
│   │   │   ├── entityUtils.test.ts          # Entity utility tests
│   │   │   └── nicolasLayout.test.ts        # NICOLAS layout algorithm tests
│   │   ├── badges.ts                     # Field type badges
│   │   ├── drawioExport.ts               # Draw.io/Visio export
│   │   ├── exportUtils.ts                # PNG/SVG/Mermaid export
│   │   ├── edgeMarkers.ts                # Edge marker selection & styling
│   │   ├── entityUtils.ts                # Entity metadata utilities
│   │   └── nicolasLayout.ts              # NICOLAS community-aware layout algorithm
│   ├── App.tsx                        # Main application component
│   ├── Root.tsx                       # Root with providers
│   ├── main.tsx                       # Entry point
│   ├── constants.ts                   # App constants (logo, etc.)
│   └── index.css                      # Global styles
├── solution/                          # Dataverse solution package
├── docs/                              # Documentation assets
├── dist/                              # Build output
│   └── webresource/                      # Dataverse web resource build
├── .husky/                            # Git hooks
│   └── pre-commit                        # Pre-commit hook script
├── index.html                         # HTML template
├── vite.config.ts                     # Vite configuration
├── vitest.config.ts                   # Vitest test configuration
├── tsconfig.json                      # TypeScript configuration
├── eslint.config.js                   # ESLint configuration
├── .lintstagedrc.json                 # lint-staged configuration
├── package.json                       # Dependencies & scripts
├── TODO.md                            # Development task tracking
├── DEPLOYMENT.md                      # Detailed deployment guide
├── CONTRIBUTING.md                    # Contribution guidelines
├── LICENSE                            # MIT License
└── README.md                          # This file
```

### Architecture

**Visualization Engine**

- Built on [React Flow](https://reactflow.dev/) for node-based diagram rendering
- Custom `TableNode` for entity cards with field-level handles
- Custom edge types: `DraggableEdge` (adjustable paths), `SelfReferenceEdge` (loops)
- Precise field-to-field connections (Lookup → Primary Key)
- Professional notation styles: Crow's Foot, UML, Simple Arrows
- SVG marker system with reusable definitions for optimal performance

**Dataverse Integration**

- Uses Dataverse Web API for metadata fetching
- Automatic authentication via Xrm.WebApi context
- Fetches entities, attributes, relationships, and alternate keys

**State Management**

- React Context for theme state (`ThemeContext`)
- Custom hooks for feature-specific state (`useERDState`, `useLayoutAlgorithms`)
- Custom `useDataverseData` hook for API data
- No external state library (keeps bundle small)

**Performance**

- `React.memo` on all frequently-rendered components
- Virtual scrolling for entity list (`useVirtualScroll`)
- Lazy loading for modals (FeatureGuide, FieldDrawer)
- CSS Modules for scoped, optimized styles
- Tree-shaking via Vite

**Quality Gates**

- Comprehensive test suite with 380 tests (Vitest + React Testing Library)
- Unit tests for critical utilities (URL codec, Draw.io export, badges, NICOLAS layout)
- Integration tests for core hooks (useERDState, useSnapshots, useLayoutAlgorithms)
- Algorithm tests (Leiden community detection, Sugiyama layout, strip-packing)
- Security tests (XML injection prevention, URL safety)
- Pre-commit hooks with Husky and lint-staged
- Automated CI/CD pipeline with test → build workflow
- Code coverage reporting with Istanbul

---

## Browser Support

| Browser     | Version |
| ----------- | ------- |
| Chrome/Edge | 90+     |
| Firefox     | 88+     |
| Safari      | 14+     |

---

## Troubleshooting

<details>
<summary><strong>"Failed to fetch entity metadata"</strong></summary>

- Check Dataverse URL is correct
- Ensure you have read permissions on Entity Metadata
- Verify CORS settings if testing locally
</details>

<details>
<summary><strong>"Xrm is not defined"</strong></summary>

- Ensure the web resource is loaded within Dataverse context
- Check that it's not being loaded in a standalone browser
</details>

<details>
<summary><strong>New lookup field doesn't show relationship</strong></summary>

**Important:** Relationships are **not inferred from field names**. They are fetched from Dataverse metadata.

When you add a lookup field (e.g., `new_accountmanagerid` on `account` table):

1. The lookup field **automatically creates a relationship** in Dataverse
2. **Option A (Automatic):** Switch back to the ERD tab - the app auto-refreshes when you return
3. **Option B (Manual):** Click the **Refresh** button (↻) in the ERD toolbar to reload metadata
4. The relationship will appear if both tables are visible in the diagram

**Auto-Refresh Feature (v0.1.7+):**

- The ERD automatically reloads metadata when you return to the tab after 5+ seconds
- Perfect for development workflow: Create field in Dataverse → Return to ERD → Relationship appears
- Only works in real Dataverse mode (not mock mode)
- Console logs: `[Auto-refresh] Window focused after being away. Reloading metadata...`

**Why this design:**

- The ERD uses Dataverse's authoritative relationship metadata
- Prevents incorrect assumptions based on naming conventions
- Ensures accurate representation of your actual data model

**API Query:**

```
EntityDefinitions?$expand=OneToManyRelationships,ManyToOneRelationships,ManyToManyRelationships
```

</details>

<details>
<summary><strong>Build fails</strong></summary>

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

</details>

---

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on:

- Code of Conduct
- Development setup
- Submitting pull requests
- Coding standards

Quick start:

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/dataverse-erd-visualizer.git

# Create feature branch
git checkout -b feature/amazing-feature

# Make changes and test
npm run test:run
npm run lint
npm run format:check

# Commit (pre-commit hooks will run automatically)
git commit -m 'Add amazing feature'

# Push and create PR
git push origin feature/amazing-feature
```

> **Note:** Pre-commit hooks will automatically run tests, linting, and formatting before allowing commits. All tests must pass in CI before PRs can be merged.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Made with ❤️ for the Power Platform Community
</p>
