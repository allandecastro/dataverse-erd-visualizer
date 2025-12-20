# Dataverse Solution Package

This folder contains the Dataverse solution source files for automated CI/CD.

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

### How It Works

The CD pipeline automatically builds and packages the managed solution:

```
┌─────────────────────────────────────────────────────────────┐
│  Push tag (e.g., v0.1.0.1)                                  │
│                         ↓                                   │
│  CD Workflow runs:                                          │
│  ├─ Build web resources (npm run build:webresource)         │
│  ├─ Update Solution.xml version                             │
│  ├─ Copy built web resources to solution/src/WebResources/  │
│  ├─ Pack managed solution (--packagetype Managed)           │
│  ├─ Create GitHub Release with .zip files                   │
│  └─ Update README version badge                             │
└─────────────────────────────────────────────────────────────┘
```

### Creating a Release

Simply push a version tag:

```bash
git tag v0.1.0.1
git push origin v0.1.0.1
```

The CD workflow handles everything else automatically.

### Updating Solution Structure

When you need to add new components (new web resources, apps, etc.):

1. Make changes in Dataverse
2. Export the solution as **MANAGED**
3. Unpack:
   ```bash
   pac solution unpack --zipfile DataverseERDVisualizer_managed.zip --folder solution/src --allowDelete --allowWrite
   ```
4. Commit the updated source files
5. Create a new release tag

> **Important:** The source must have `<Managed>1</Managed>` in Solution.xml for the CD to pack it as managed.

---

### Folder Structure

```
solution/
├── README.md              # This file
└── src/                   # Unpacked managed solution source
    ├── AppModules/
    ├── AppModuleSiteMaps/
    ├── Other/
    │   ├── Customizations.xml
    │   └── Solution.xml   # <Managed>1</Managed>
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
