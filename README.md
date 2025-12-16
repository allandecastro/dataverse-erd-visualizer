# Dataverse ERD Visualizer

**Version:** 1.0.0 BETA  
**Author:** Allan De Castro  
**License:** MIT

Entity Relationship Diagram Visualizer for Microsoft Dataverse / Dynamics 365 Power Platform.

## Features

- 🎨 **Visual ERD** - Interactive force-directed, grid, and auto-arrange layouts
- 🔗 **Precise Relationships** - Connections from Lookup fields to Primary Keys
- 🎯 **Smart Navigation** - Smart Zoom, Minimap, Fit to Screen
- 📤 **Multiple Exports** - PNG (clipboard), SVG (download), Mermaid (clipboard)
- 🌓 **Dark/Light Mode** - Professional themes
- 🎨 **Customizable Colors** - Table and relationship colors
- 🔍 **Field Selector** - Choose which fields to display per table
- 📊 **Dataverse Integration** - Fetch live metadata from your environment

## Project Structure

```
dataverse-erd-visualizer/
├── src/
│   ├── components/          # React components
│   │   ├── ERDCanvas/       # Main canvas component
│   │   ├── Sidebar/         # Left panel with filters
│   │   ├── Toolbar/         # Top toolbar with actions
│   │   └── ...
│   ├── services/            # API services
│   │   └── dataverseApi.ts  # Dataverse Web API client
│   ├── hooks/               # Custom React hooks
│   │   └── useDataverseData.ts
│   ├── types/               # TypeScript definitions
│   │   └── index.ts
│   ├── utils/               # Utility functions
│   ├── constants/           # Constants and configs
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── dist/                    # Build output (dev)
├── dist/webresource/        # Build output (web resource)
├── package.json
├── tsconfig.json
├── vite.config.ts
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

This creates:
- `dist/webresource/cr_erdvisualizer.js` - Main bundle
- `dist/webresource/cr_erdvisualizer.css` - Styles
- `dist/webresource/index.html` - HTML wrapper

### Deployment to Dataverse

#### Option 1: Manual Upload

1. Navigate to **Settings** → **Solutions**
2. Open your solution
3. Add **Web Resource** → **New**
4. Upload `cr_erdvisualizer.js` and `cr_erdvisualizer.css`
5. Create an HTML web resource with:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>ERD Visualizer</title>
    <link rel="stylesheet" href="cr_erdvisualizer.css">
</head>
<body>
    <div id="root"></div>
    <script src="cr_erdvisualizer.js"></script>
</body>
</html>
```

#### Option 2: Using Solution Packager (Recommended)

1. Create a Solution XML structure
2. Include web resources
3. Package and import

```bash
# Example using Microsoft.CrmSdk.CoreTools
pac solution pack --zipfile solution.zip --folder src --packagetype Both
```

### Add to Sitemap

Add the ERD Visualizer to your sitemap:

```xml
<SubArea Id="cr_erdvisualizer" 
         ResourceId="cr_erdvisualizer_html"
         Icon="/_imgs/area/16_visualizations.png"
         Title="ERD Visualizer"
         Url="/WebResources/cr_erdvisualizer.html" />
```

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

- **Lazy loading** of relationship data
- **Debounced** search and filters
- **Canvas virtualization** for large models (100+ tables)
- **Optimized re-renders** with React.memo
- **Tree-shaking** via Vite
- **Code splitting** for web resource builds

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

## Changelog

### v1.0.0 BETA (2025-12-14)

- Initial release
- Dataverse metadata integration
- Force, Grid, Auto-arrange layouts
- Primary Key indicators
- Precise lookup→PK relationships
- Export to PNG, SVG, Mermaid
- Dark/Light themes
- Smart Zoom
- Interactive Minimap
- Field selector per table
- Color customization
