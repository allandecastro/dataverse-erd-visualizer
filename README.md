# Dataverse ERD Visualizer

**Version:** 1.0.0 BETA
**Author:** Allan De Castro
**License:** MIT

Entity Relationship Diagram Visualizer for Microsoft Dataverse / Dynamics 365 Power Platform.

## Features

### Core Visualization
- 🎨 **Visual ERD** - Interactive force-directed, grid, and auto-arrange layouts
- 🔗 **Precise Relationships** - Connections from Lookup fields to Primary Keys
- 🎯 **Smart Navigation** - Smart Zoom, Minimap, Fit to Screen
- 📊 **Dataverse Integration** - Fetch live metadata from your environment

### Performance
- ⚡ **Viewport Culling** - Only renders visible entities for smooth performance
- 🖼️ **Canvas Mode** - High-performance HTML5 Canvas rendering for large diagrams (100+ tables)
- 🚀 **Optimized Rendering** - Efficient React.memo and lazy loading

### User Experience
- 🔍 **Search & Filter** - Quick search by table name, filter by publisher
- 📋 **Field Selector** - Choose which fields to display per table
- ⌨️ **Keyboard Shortcuts** - Ctrl+F (search), Escape (deselect), +/- (zoom)
- 📖 **Built-in Feature Guide** - Interactive onboarding for new users

### Export & Customization
- 📤 **Multiple Exports** - PNG (clipboard), SVG (download), Mermaid (clipboard)
- 🌓 **Dark/Light Mode** - Professional themes
- 🎨 **Customizable Colors** - Table and relationship colors

## Project Structure

```
dataverse-erd-visualizer/
├── src/
│   ├── components/
│   │   └── ERDVisualizer/        # Main ERD component
│   │       ├── ERDVisualizer.tsx # Root component with state management
│   │       ├── components/       # Sub-components
│   │       │   ├── EntityCard.tsx      # Table card rendering
│   │       │   ├── RelationshipLines.tsx # SVG relationship lines
│   │       │   ├── CanvasERD.tsx       # Canvas mode renderer
│   │       │   ├── Toolbar.tsx         # Top action bar
│   │       │   ├── Sidebar.tsx         # Filter panel
│   │       │   ├── Minimap.tsx         # Navigation minimap
│   │       │   ├── FeatureGuide.tsx    # Onboarding modal
│   │       │   └── ...
│   │       ├── hooks/            # Custom hooks
│   │       │   ├── useDataverseData.ts # API data fetching
│   │       │   └── useViewport.ts      # Viewport culling logic
│   │       ├── utils/            # Utility functions
│   │       │   └── layoutUtils.ts
│   │       └── constants/        # Configuration
│   ├── services/
│   │   └── dataverseApi.ts       # Dataverse Web API client
│   ├── types/
│   │   └── index.ts              # TypeScript definitions
│   ├── App.tsx                   # App wrapper
│   ├── main.tsx                  # Entry point
│   └── index.css                 # Global styles
├── dist/                         # Build output (dev)
├── dist/webresource/             # Build output (Dataverse)
│   ├── adc_erdvisualizer.js      # Main bundle
│   ├── adc_erdvisualizer.css     # Styles
│   └── index.html                # HTML wrapper
├── package.json
├── tsconfig.json
├── vite.config.ts
├── DEPLOYMENT.md                 # Dataverse deployment guide
└── README.md
```

## Development

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Access to a Dataverse environment (for testing)

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:3000`

### Environment Variables

Create a `.env` file for local development:

```env
VITE_DATAVERSE_URL=https://your-org.crm.dynamics.com
```

## Building for Dataverse Web Resource

### Build

```bash
# Build optimized bundle for web resource
npm run build:webresource
```

This creates optimized files in `dist/webresource/`:
- `adc_erdvisualizer.js` - Main JavaScript bundle (~266 KB, ~76 KB gzipped)
- `adc_erdvisualizer.css` - Styles (~0.6 KB)
- `index.html` - HTML wrapper (ready to use)

### Quick Deployment

1. Navigate to https://make.powerapps.com
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

📖 **See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions**, including:
- PAC CLI deployment
- Solution packaging
- Required permissions
- Troubleshooting guide

## Architecture

### Dataverse API Integration

The app uses the Dataverse Web API to fetch:

- **Entity Metadata** - All tables with attributes
- **Relationship Metadata** - N:1, 1:N, N:N relationships
- **Publisher Information** - For filtering

#### API Calls

```typescript
// Fetch all entity metadata
GET /api/data/v9.2/EntityDefinitions
  ?$select=LogicalName,DisplayName,...
  &$expand=Attributes,OneToManyRelationships,...
  
// Results are cached and transformed to internal format
```

### Authentication

When deployed as a Web Resource:
- Uses **Xrm.WebApi** context
- Automatic authentication via Dataverse session
- No additional auth required

For local development:
- Set `VITE_DATAVERSE_URL` in `.env`
- Authentication handled by browser session

### State Management

- React hooks for local state
- Custom `useDataverseData` hook for API data
- No external state management library (keeps bundle small)

## Performance Optimizations

### Viewport Culling
- Only entities visible in the current viewport are rendered
- Entities outside the view are automatically excluded from the DOM
- Provides smooth performance even with 100+ tables

### Canvas Mode
- Toggle Canvas Mode for ultimate performance with large diagrams
- Uses HTML5 Canvas API instead of DOM elements
- Significantly reduces browser memory usage

### Other Optimizations
- **Lazy loading** of relationship data
- **Debounced** search and filters
- **Optimized re-renders** with React.memo
- **Tree-shaking** via Vite
- **Single bundle** for web resource deployment

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Troubleshooting

### "Failed to fetch entity metadata"

- Check Dataverse URL is correct
- Ensure you have read permissions on Entity Metadata
- Verify CORS settings if testing locally

### "Xrm is not defined"

- Ensure the web resource is loaded within Dataverse context
- Check that it's not being loaded in a standalone browser

### Build fails

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Author

**Allan De Castro**  
Microsoft MVP | FastTrack Ready Solutions Architect  
Blog: Allan's Tech Forge

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + F` | Focus search box |
| `Escape` | Deselect entity / Close dialogs |
| `+` / `=` | Zoom in |
| `-` | Zoom out |
| Mouse wheel | Zoom in/out |
| Click + Drag | Pan canvas |
| Click entity | Select and highlight relationships |

## Changelog

### v1.0.0 BETA (2025-12-16)

**Initial Release**
- Dataverse metadata integration via Web API
- Force-directed, Grid, and Auto-arrange layouts
- Primary Key indicators on entity cards
- Precise lookup→PK relationship visualization
- Export to PNG (clipboard), SVG (download), Mermaid (clipboard)
- Dark/Light themes with localStorage persistence
- Smart Zoom with fit-to-screen
- Interactive Minimap for navigation
- Field selector per table
- Color customization for tables and relationships

**Performance Features**
- Viewport Culling - Only render visible entities
- Canvas Mode - High-performance HTML5 Canvas rendering
- Optimized for environments with 100+ tables

**User Experience**
- Built-in Feature Guide with onboarding modal
- Keyboard shortcuts for common actions
- Search and filter by publisher
- Collapsible entity cards
