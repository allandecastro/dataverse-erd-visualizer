# Dataverse Solution Package

This folder is for the **Managed Solution** that can be imported directly into Dataverse environments.

## For Users

### Download

Download the latest managed solution from [GitHub Releases](https://github.com/allandecastro/dataverse-erd-visualizer/releases):

- `DataverseERDVisualizer_x_x_x_managed.zip` - Full managed solution with Model-driven App

### Installation

1. Go to [make.powerapps.com](https://make.powerapps.com)
2. Select your environment
3. Navigate to **Solutions** → **Import solution**
4. Upload `DataverseERDVisualizer_x_x_x_managed.zip`
5. Click **Next** → **Import**
6. Once imported, the **ERD Visualizer** app will be available in your environment

### Using PAC CLI

```bash
pac auth create --environment "https://yourorg.crm.dynamics.com"
pac solution import --path DataverseERDVisualizer_x_x_x_managed.zip
```

---

## For Maintainers

### Release Process

The managed solution is created manually since it includes a Model-driven App which cannot be easily automated.

#### Step 1: Build Web Resources

The CI/CD pipeline automatically builds web resources when you create a tag:

```bash
git tag v0.1.0
git push origin v0.1.0
```

Or trigger manually from GitHub Actions → Release → Run workflow.

#### Step 2: Update Web Resources in Dataverse

1. Download `webresources_x.x.x.zip` from the GitHub Release (draft)
2. Go to your development environment in [make.powerapps.com](https://make.powerapps.com)
3. Open the **Dataverse ERD Visualizer** solution
4. Update the web resources with the new files:
   - `adc_/erdvisualizer/adc_erdvisualizer.html`
   - `adc_/erdvisualizer/adc_erdvisualizer.js`
   - `adc_/erdvisualizer/adc_erdvisualizer.css`
5. **Publish All Customizations**

#### Step 3: Export Managed Solution

1. In [make.powerapps.com](https://make.powerapps.com), go to **Solutions**
2. Select **Dataverse ERD Visualizer**
3. Click **Export solution**
4. Choose **Managed** → **Export**
5. Download the zip file
6. Rename to `DataverseERDVisualizer_x_x_x_managed.zip`

#### Step 4: Upload to GitHub Release

1. Go to the draft release on GitHub
2. Upload `DataverseERDVisualizer_x_x_x_managed.zip`
3. Review the release notes
4. **Publish release**

### Solution Contents

| Component | Name | Description |
|-----------|------|-------------|
| Web Resource | `adc_/erdvisualizer/adc_erdvisualizer.html` | Main HTML page |
| Web Resource | `adc_/erdvisualizer/adc_erdvisualizer.js` | Application bundle |
| Web Resource | `adc_/erdvisualizer/adc_erdvisualizer.css` | Styles |
| Model-driven App | `ERD Visualizer` | Standalone app for the visualizer |

### Solution Properties

| Property | Value |
|----------|-------|
| Unique Name | `DataverseERDVisualizer` |
| Display Name | Dataverse ERD Visualizer |
| Publisher | Allan De Castro (`adc_`) |
| Type | Managed |
