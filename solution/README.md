# Dataverse Solution Package

This folder contains the Dataverse solution files for distribution.

## For Users

### Download

Download the latest solution from [GitHub Releases](https://github.com/allandecastro/dataverse-erd-visualizer/releases):

| File | Description |
|------|-------------|
| `DataverseERDVisualizer_x.x.x.x_managed.zip` | **Managed Solution** - Import to your environment |
| `webresources_x.x.x.x.zip` | Web resources only (for manual deployment) |

### Installation

1. Go to [make.powerapps.com](https://make.powerapps.com)
2. Select your environment
3. Navigate to **Solutions** → **Import solution**
4. Upload the managed solution zip
5. Click **Next** → **Import**
6. The **Dataverse ERD Visualizer** app will be available in your environment

---

## For Maintainers

### Creating a Release

Follow these steps to create a new release:

```
┌─────────────────────────────────────────────────────────────┐
│  1. Build web resources locally                             │
│     npm run build:webresource                               │
│                         ↓                                   │
│  2. Import web resources to Dataverse                       │
│     (via make.powerapps.com or PAC CLI)                     │
│                         ↓                                   │
│  3. Update solution version in Dataverse                    │
│                         ↓                                   │
│  4. Export MANAGED solution from Dataverse                  │
│                         ↓                                   │
│  5. Place ZIP in solution/ folder                           │
│     solution/DataverseERDVisualizer_x.x.x.x_managed.zip     │
│                         ↓                                   │
│  6. Create GitHub Release                                   │
│     - Tag: vX.X.X.X                                         │
│     - Attach: managed.zip + webresources.zip                │
│                         ↓                                   │
│  7. CD auto-updates README version badge                    │
└─────────────────────────────────────────────────────────────┘
```

### Step-by-Step Guide

#### 1. Build Web Resources

```bash
# Update version in package.json first
npm version 0.1.0.1 --no-git-tag-version

# Build for Dataverse
npm run build:webresource
```

Output files in `dist/webresource/`:
- `adc_dataverseerdvisualizer.html`
- `adc_dataverseerdvisualizer.js`
- `adc_dataverseerdvisualizer.css`
- `adc_dataverseerdvisualizerlogo.svg`

#### 2. Import to Dataverse

Upload the built files to your Dataverse solution:
- Go to **Solutions** → **Dataverse ERD Visualizer** → **Web Resources**
- Update each web resource with the new built file
- **Save** and **Publish All Customizations**

Or use PAC CLI:
```bash
pac auth create --environment "https://yourorg.crm.dynamics.com"
# Update each web resource...
```

#### 3. Update Solution Version

In Dataverse:
1. Open your solution
2. Click **Settings** (gear icon)
3. Update **Version** to match your release (e.g., `0.1.0.1`)
4. Save

#### 4. Export Managed Solution

1. Go to **Solutions**
2. Select **Dataverse ERD Visualizer**
3. Click **Export solution**
4. Choose **Managed**
5. Download the ZIP

#### 5. Place in Solution Folder

Copy the exported ZIP to:
```
solution/DataverseERDVisualizer_0.1.0.1_managed.zip
```

#### 6. Create GitHub Release

1. Go to **Releases** → **Create a new release**
2. Create tag: `v0.1.0.1`
3. Title: `Dataverse ERD Visualizer v0.1.0.1`
4. Attach files:
   - `solution/DataverseERDVisualizer_0.1.0.1_managed.zip`
   - `dist/webresource/*` (zip as `webresources_0.1.0.1.zip`)
5. Add release notes
6. Publish release

#### 7. Automatic README Update

The CD workflow automatically updates the README version badge after you publish the release.

---

### Folder Structure

```
solution/
├── README.md                                    # This file
├── DataverseERDVisualizer_x.x.x.x_managed.zip   # Latest managed solution
└── src/                                         # Unpacked solution (reference only)
    ├── AppModules/
    ├── AppModuleSiteMaps/
    ├── Other/
    │   ├── Customizations.xml
    │   └── Solution.xml
    └── WebResources/
        ├── adc_dataverseerdvisualizer.css
        ├── adc_dataverseerdvisualizer.html
        ├── adc_dataverseerdvisualizer.js
        └── adc_dataverseerdvisualizerlogo.svg
```

### Solution Properties

| Property | Value |
|----------|-------|
| Unique Name | `DataverseERDVisualizer` |
| Display Name | Dataverse ERD Visualizer |
| Publisher | Allan De Castro |
| Prefix | `adc_` |

### Web Resources

| Name | Type | Description |
|------|------|-------------|
| `adc_dataverseerdvisualizer.html` | Web Page (HTML) | Main entry point |
| `adc_dataverseerdvisualizer.js` | Script (JS) | Application bundle |
| `adc_dataverseerdvisualizer.css` | Style Sheet (CSS) | Styles |
| `adc_dataverseerdvisualizerlogo.svg` | Image (SVG) | Application logo |
