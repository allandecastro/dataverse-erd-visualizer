# Dataverse Solution Package

This folder contains the unpacked Dataverse solution that gets automatically packaged by the CD pipeline.

## For Users

### Download

Download the latest solution from [GitHub Releases](https://github.com/allandecastro/dataverse-erd-visualizer/releases):

| File | Description |
|------|-------------|
| `DataverseERDVisualizer_x.x.x_managed.zip` | **Managed Solution** - Recommended for production |
| `DataverseERDVisualizer_x.x.x_unmanaged.zip` | Unmanaged Solution - For development |

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

Simply tag and push to create a new release:

```bash
git tag v0.2.0
git push origin v0.2.0
```

The CD pipeline will automatically:

```
┌─────────────────────────────────────────────────────────────┐
│  git tag v0.2.0 && git push origin v0.2.0                   │
│                         ↓                                    │
│  GitHub Actions:                                             │
│  ├─ Build web resources (npm run build:webresource)         │
│  ├─ Update solution version to 0.2.0.0                      │
│  ├─ Copy web resources to solution/src/WebResources/        │
│  ├─ Pack managed solution (pac solution pack --Managed)     │
│  ├─ Pack unmanaged solution (pac solution pack --Unmanaged) │
│  └─ Create GitHub Release with versioned zips               │
│                         ↓                                    │
│  Release: DataverseERDVisualizer_0.2.0_managed.zip          │
└─────────────────────────────────────────────────────────────┘
```

### Folder Structure

The `solution/src/` folder contains the unpacked solution:

```
solution/src/
├── AppModules/
│   └── adc_DataverseERDVisualizerApp/
│       └── AppModule.xml
├── AppModuleSiteMaps/
│   └── adc_DataverseERDVisualizerApp/
│       └── AppModuleSiteMap.xml
├── Other/
│   ├── Customizations.xml
│   └── Solution.xml          # Version updated by CD
└── WebResources/
    ├── adc_dataverseerdvisualizer.css
    ├── adc_dataverseerdvisualizer.css.data.xml
    ├── adc_dataverseerdvisualizer.html      # Updated by CD
    ├── adc_dataverseerdvisualizer.html.data.xml
    ├── adc_dataverseerdvisualizer.js        # Updated by CD
    ├── adc_dataverseerdvisualizer.js.data.xml
    ├── adc_dataverseerdvisualizerlogo.svg   # Updated by CD
    └── adc_dataverseerdvisualizerlogo.svg.data.xml
```

### Adding New Components

If you need to add new components to the solution (new web resources, apps, etc.):

1. Make changes in Dataverse
2. Export the unmanaged solution
3. Unpack: `pac solution unpack --zipfile <solution.zip> --folder solution/src --packagetype Unmanaged`
4. Commit the changes
5. Create a new release tag

**Note:** For code-only changes, just commit your code and create a release tag. The CD handles everything automatically.

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
