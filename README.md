<p align="center">
  <img src="public/logo.svg" alt="Dataverse ERD Visualizer" width="180" height="180">
</p>

<h1 align="center">Dataverse ERD Visualizer</h1>

<p align="center">
  <strong>Interactive Entity Relationship Diagram Visualizer for Microsoft Dataverse / Dynamics 365 </strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-0.1.0.0_BETA-blue?style=for-the-badge" alt="Version" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge" alt="License" />
  <a href="https://github.com/allandecastro/dataverse-erd-visualizer/actions/workflows/ci.yml"><img src="https://github.com/allandecastro/dataverse-erd-visualizer/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://github.com/allandecastro/dataverse-erd-visualizer/actions/workflows/release.yml"><img src="https://github.com/allandecastro/dataverse-erd-visualizer/actions/workflows/release.yml/badge.svg" alt="CD" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Dataverse-0B556A?style=for-the-badge&logo=microsoft-azure&logoColor=white" alt="Dataverse" />
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

<!--
  Add your screenshot or video here!

  For a screenshot:
  ![Dataverse ERD Visualizer Screenshot](docs/screenshot.png)

  For a video/GIF:
  ![Dataverse ERD Visualizer Demo](docs/demo.gif)

  For an embedded video (GitHub supports this):
  https://user-images.githubusercontent.com/YOUR_ID/VIDEO_ID.mp4
-->

<p align="center">
  <img src="docs/screenshot.png" alt="Dataverse ERD Visualizer Screenshot" width="100%">
</p>

<p align="center">
  <em>Visualize your Dataverse schema with interactive entity relationship diagrams</em>
</p>

---

## Features

### Core Visualization
| Feature | Description |
|---------|-------------|
| **Visual ERD** | Interactive force-directed, grid, and auto-arrange layouts |
| **Precise Relationships** | Connections from Lookup fields to Primary Keys |
| **Alternate Keys** | Display entity alternate keys with composite key support |
| **Smart Navigation** | Smart Zoom, Minimap, Fit to Screen |
| **Dataverse Integration** | Fetch live metadata from your environment |

### Performance
| Feature | Description |
|---------|-------------|
| **Viewport Culling** | Only renders visible entities for smooth performance |
| **Canvas Mode** | High-performance HTML5 Canvas rendering for large diagrams (100+ tables) |
| **Optimized Rendering** | Efficient React.memo and lazy loading |

### User Experience
| Feature | Description |
|---------|-------------|
| **Search & Filter** | Quick search by table name, filter by publisher/solution |
| **Field Selector** | Choose which fields to display per table |
| **Keyboard Shortcuts** | Ctrl+F (search), Escape (deselect), +/- (zoom) |
| **Feature Guide** | Interactive onboarding for new users |

### Export & Customization
| Feature | Description |
|---------|-------------|
| **Multiple Exports** | PNG (clipboard), SVG (download), Mermaid (clipboard) |
| **Draw.io Export** | Full diagram export compatible with Draw.io and Microsoft Visio |
| **Dark/Light Mode** | Professional themes with automatic persistence |
| **Custom Colors** | Table and relationship color customization |

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

---

## Documentation

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + F` | Focus search box |
| `Escape` | Deselect entity / Close dialogs |
| `+` / `=` | Zoom in |
| `-` | Zoom out |
| Mouse wheel | Zoom in/out |
| Click + Drag | Pan canvas |
| Click entity | Select and highlight relationships |

### Project Structure

```
dataverse-erd-visualizer/
├── public/
│   └── logo.svg                    # Application logo
├── src/
│   ├── components/
│   │   └── ERDVisualizer/          # Main ERD component
│   │       ├── components/         # UI sub-components
│   │       │   ├── CanvasERD.tsx       # Canvas rendering mode
│   │       │   ├── EntityCard.tsx      # Entity table card
│   │       │   ├── EntitySearch.tsx    # Search component
│   │       │   ├── FeatureGuide.tsx    # Onboarding modal
│   │       │   ├── FieldSelector.tsx   # Field visibility picker
│   │       │   ├── Minimap.tsx         # Navigation minimap
│   │       │   ├── RelationshipLines.tsx # SVG relationship arrows
│   │       │   ├── Sidebar.tsx         # Filter sidebar
│   │       │   ├── Toast.tsx           # Notification toasts
│   │       │   ├── Toolbar.tsx         # Top action bar
│   │       │   └── VirtualEntityList.tsx # Virtual scrolling
│   │       ├── hooks/              # Custom React hooks
│   │       │   ├── useERDState.ts      # Main state management
│   │       │   ├── useKeyboardShortcuts.ts # Keyboard handling
│   │       │   ├── useLayoutAlgorithms.ts  # Layout engines
│   │       │   ├── useViewport.ts      # Viewport culling
│   │       │   └── useVirtualScroll.ts # Virtual scroll logic
│   │       ├── utils/              # Utility functions
│   │       │   ├── drawioExport.ts     # Draw.io/Visio export
│   │       │   └── exportUtils.ts      # PNG/SVG/Mermaid export
│   │       ├── ERDVisualizer.tsx   # Root ERD component
│   │       └── types.ts            # Component-specific types
│   ├── hooks/
│   │   └── useDataverseData.ts     # Dataverse API hook
│   ├── services/
│   │   ├── dataverseApi.ts         # Dataverse Web API client
│   │   └── mockData.ts             # Mock data for development
│   ├── types/
│   │   └── index.ts                # TypeScript definitions
│   ├── App.tsx                     # App wrapper
│   ├── main.tsx                    # Entry point
│   └── index.css                   # Global styles
├── solution/                       # Dataverse solution package
├── docs/                           # Documentation assets
├── dist/                           # Build output
│   └── webresource/                # Dataverse web resource build
├── index.html                      # HTML template
├── vite.config.ts                  # Vite configuration
├── tsconfig.json                   # TypeScript configuration
├── package.json                    # Dependencies & scripts
├── DEPLOYMENT.md                   # Detailed deployment guide
├── CONTRIBUTING.md                 # Contribution guidelines
├── LICENSE                         # MIT License
└── README.md                       # This file
```

### Architecture

**Dataverse Integration**
- Uses Dataverse Web API for metadata fetching
- Automatic authentication via Xrm.WebApi context
- Fetches entities, attributes, relationships, and alternate keys

**State Management**
- React hooks for local state
- Custom `useDataverseData` hook for API data
- No external state library (keeps bundle small)

**Performance**
- Viewport culling for large schemas
- Canvas mode for 100+ entities
- Debounced search and filters
- Tree-shaking via Vite

---

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome/Edge | 90+ |
| Firefox | 88+ |
| Safari | 14+ |

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

# Make changes and commit
git commit -m 'Add amazing feature'

# Push and create PR
git push origin feature/amazing-feature
```

---

## Changelog

### v0.1.0.0 BETA (December 2025)

**New Features**
- Draw.io Export - Compatible with Draw.io and Microsoft Visio
- Solution Filter - Filter entities by Dataverse solution
- Alternate Keys - Display entity alternate keys with composite key support

**Core Features**
- Dataverse metadata integration via Web API
- Force-directed, Grid, and Auto-arrange layouts
- Primary Key indicators on entity cards
- Precise lookup→PK relationship visualization
- Export to PNG, SVG, Mermaid, Draw.io
- Dark/Light themes with persistence
- Smart Zoom with fit-to-screen
- Interactive Minimap
- Field selector per table
- Viewport Culling & Canvas Mode for performance

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Made with ❤️ for the Power Platform Community
</p>
