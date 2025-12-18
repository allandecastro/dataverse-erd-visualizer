<p align="center">
  <img src="public/logo.svg" alt="Dataverse ERD Visualizer" width="180" height="180">
</p>

<h1 align="center">Dataverse ERD Visualizer</h1>

<p align="center">
  <strong>Interactive Entity Relationship Diagram Visualizer for Microsoft Dataverse / Dynamics 365 Power Platform</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-0.1.0_BETA-blue?style=for-the-badge" alt="Version" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge" alt="License" />
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
  <a href="#quick-start">Quick Start</a> •
  <a href="#features">Features</a> •
  <a href="#deployment">Deployment</a> •
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

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Development

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

### Build for Dataverse

```bash
# Build optimized bundle for web resource
npm run build:webresource
```

Output in `dist/webresource/`:
- `adc_erdvisualizer.js` - Main bundle (~266 KB gzipped: ~76 KB)
- `adc_erdvisualizer.css` - Styles
- `index.html` - Ready-to-use HTML wrapper

---

## Deployment

### Quick Deploy to Dataverse

1. Navigate to [make.powerapps.com](https://make.powerapps.com)
2. Select your environment → **Solutions** → Your solution
3. Click **+ New** → **More** → **Web resource**
4. Upload each file:
   - `adc_erdvisualizer.js` (Type: Script)
   - `adc_erdvisualizer.css` (Type: Style Sheet)
   - `index.html` as `adc_erdvisualizer.html` (Type: Web Page)
5. **Save** and **Publish All Customizations**

### Add to Model-Driven App

1. Open your app in **App Designer**
2. Add a **Subarea** with:
   - **Content Type:** Web Resource
   - **Web Resource:** `adc_erdvisualizer.html`
3. **Save** and **Publish**

> **Detailed Instructions:** See [DEPLOYMENT.md](DEPLOYMENT.md) for PAC CLI deployment, solution packaging, permissions, and troubleshooting.

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
├── src/
│   ├── components/
│   │   └── ERDVisualizer/          # Main ERD component
│   │       ├── components/         # UI components
│   │       ├── hooks/              # Custom React hooks
│   │       └── utils/              # Utility functions
│   ├── services/
│   │   └── dataverseApi.ts         # Dataverse Web API client
│   └── types/
│       └── index.ts                # TypeScript definitions
├── dist/webresource/               # Dataverse build output
├── DEPLOYMENT.md                   # Deployment guide
└── README.md
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

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## Changelog

### v0.1.0 BETA (December 2025)

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

## Author

<p>
  <strong>Allan De Castro</strong><br>
  Microsoft MVP | FastTrack Ready Solutions Architect
</p>

<p>
  <a href="https://github.com/allandecastro"><img src="https://img.shields.io/badge/GitHub-allandecastro-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"></a>
  <a href="https://www.linkedin.com/in/allandecastro/"><img src="https://img.shields.io/badge/LinkedIn-allandecastro-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn"></a>
</p>

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Made with ❤️ for the Power Platform Community
</p>
