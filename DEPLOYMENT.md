# Deployment Guide - Dataverse Web Resource

## Overview

This guide explains how to deploy the Dataverse ERD Visualizer as a web resource in Microsoft Dataverse / Dynamics 365 / Power Platform.

## Quick Deployment Steps

### 1. Build the Web Resource

```bash
npm run build:webresource
```

This creates optimized files in `dist/webresource/`:
- `adc_dataverseerdvisualizer.js` - Main JavaScript bundle (~266 KB, ~76 KB gzipped)
- `adc_dataverseerdvisualizer.css` - Styles (~0.6 KB)
- `adc_dataverseerdvisualizerlogo.svg` - Application logo
- `index.html` - HTML wrapper (ready to use)

### 2. Upload to Dataverse

#### Using Power Apps Maker Portal

1. Navigate to https://make.powerapps.com
2. Select your environment
3. Go to **Solutions** → Select your solution (or create new)
4. Click **+ New** → **More** → **Web resource**

**Upload JavaScript:**
- Name: `adc_dataverseerdvisualizer.js`
- Display Name: `Dataverse ERD Visualizer Script`
- Type: **Script (JScript)**
- Upload: `dist/webresource/adc_dataverseerdvisualizer.js`

**Upload CSS:**
- Name: `adc_dataverseerdvisualizer.css`
- Display Name: `Dataverse ERD Visualizer Styles`
- Type: **Style Sheet (CSS)**
- Upload: `dist/webresource/adc_dataverseerdvisualizer.css`

**Upload Logo:**
- Name: `adc_dataverseerdvisualizerlogo.svg`
- Display Name: `Dataverse ERD Visualizer Logo`
- Type: **Image (SVG)**
- Upload: `dist/webresource/adc_dataverseerdvisualizerlogo.svg`

**Upload HTML:**
- Name: `adc_dataverseerdvisualizer.html`
- Display Name: `Dataverse ERD Visualizer`
- Type: **Web Page (HTML)**
- Upload: `dist/webresource/index.html`

5. **Save** and **Publish All Customizations**

### 3. HTML Web Resource Content

If you need to create the HTML manually:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Dataverse ERD Visualizer</title>
    <script src="adc_dataverseerdvisualizer.js"></script>
    <link rel="stylesheet" href="adc_dataverseerdvisualizer.css">
    <style>
      body, html {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }
      #root {
        width: 100%;
        height: 100%;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

### 4. Add to Model-Driven App Navigation

#### Using App Designer

1. Open your Model-Driven App in **App Designer**
2. Click **Navigation** → **+ Add** → **Group** (or use existing)
3. Add **Subarea**:
   - **Title:** Dataverse ERD Visualizer
   - **Icon:** Choose a visualization icon (e.g., `/_imgs/area/16_visualizations.png`)
   - **Content Type:** Web Resource
   - **Web Resource:** Select `adc_dataverseerdvisualizer.html`

4. **Save** and **Publish**

#### Using URL (Alternative)

You can also add as a URL subarea:
- **URL:** `$webresource:adc_dataverseerdvisualizer.html`


### 5. Grant Permissions

Users need these permissions to use the Dataverse ERD Visualizer:

**Required Security Role Privileges:**

| Privilege | Entity | Access Level |
|-----------|--------|--------------|
| Read | Entity (Table) | Organization |
| Read | Attribute (Column) | Organization |
| Read | Relationship | Organization |
| Read | Web Resource | Organization |

**Quick Setup:**
1. Go to **Settings** → **Security** → **Security Roles**
2. Open the role to modify
3. **Customization** tab:
   - **Entity** → Read: Organization
   - **Attribute** → Read: Organization
   - **Relationship** → Read: Organization

## Alternative: Standalone Access

For a standalone page (not in navigation):

1. Upload web resources as above
2. Access directly via URL:
   ```
   https://[org].crm.dynamics.com/WebResources/adc_dataverseerdvisualizer.html
   ```

## Using Power Platform CLI (PAC CLI)

### Prerequisites

Install Power Platform CLI:
```bash
# Using npm
npm install -g @microsoft/power-platform-cli

# Or download from Microsoft
# https://aka.ms/PowerAppsCLI
```

### Deployment Steps

```bash
# 1. Authenticate
pac auth create --url https://[org].crm.dynamics.com

# 2. Create a new solution (if needed)
pac solution init --publisher-name "YourPublisher" --publisher-prefix "adc"

# 3. Add web resources to solution
pac solution add-reference --path "./dist/webresource/adc_dataverseerdvisualizer.js"
pac solution add-reference --path "./dist/webresource/adc_dataverseerdvisualizer.css"
pac solution add-reference --path "./dist/webresource/adc_dataverseerdvisualizerlogo.svg"
pac solution add-reference --path "./dist/webresource/index.html"

# 4. Build the solution
pac solution pack --zipfile DataverseERDVisualizer_1_0_0_managed.zip --folder . --packagetype Managed

# 5. Import to environment
pac solution import --path DataverseERDVisualizer_1_0_0_managed.zip --publish-changes
```

## Solution Structure for Manual Packaging

```
DataverseERDVisualizer/
├── solution.xml
├── [Content_Types].xml
├── customizations.xml
└── WebResources/
    ├── adc_dataverseerdvisualizer.html
    ├── adc_dataverseerdvisualizer.js
    ├── adc_dataverseerdvisualizer.css
    └── adc_dataverseerdvisualizerlogo.svg
```

### Sample solution.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<ImportExportXml xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <SolutionManifest>
    <UniqueName>DataverseERDVisualizer</UniqueName>
    <LocalizedNames>
      <LocalizedName description="Dataverse ERD Visualizer" languagecode="1033"/>
    </LocalizedNames>
    <Descriptions>
      <Description description="Entity Relationship Diagram Visualizer for Dataverse" languagecode="1033"/>
    </Descriptions>
    <Version>1.0.0.0</Version>
    <Managed>0</Managed>
    <Publisher>
      <UniqueName>AllanDeCastro</UniqueName>
      <LocalizedNames>
        <LocalizedName description="Allan De Castro" languagecode="1033"/>
      </LocalizedNames>
      <CustomizationPrefix>adc</CustomizationPrefix>
    </Publisher>
  </SolutionManifest>
</ImportExportXml>
```

## Troubleshooting

### Issue: "Xrm is not defined"

**Cause:** Web resource loaded outside Dataverse context

**Solutions:**
1. Ensure accessing via Dataverse URL (not localhost)
2. Access through Model-Driven App navigation
3. Use the full URL: `https://[org].crm.dynamics.com/WebResources/adc_dataverseerdvisualizer.html`

### Issue: "Failed to fetch entity metadata"

**Cause:** Insufficient permissions or API error

**Solutions:**
1. Verify user has read permissions on Entity Definitions (see permissions section)
2. Check browser console (F12) for detailed error messages
3. Verify Web API is enabled for the environment
4. Try with System Administrator role to confirm it's a permissions issue

### Issue: Blank screen

**Causes:**
1. JavaScript not loaded correctly
2. CSS not loaded
3. Web resource names don't match references

**Solutions:**
1. Check browser console (F12) for JavaScript errors
2. Verify web resource names match exactly (case-sensitive)
3. Clear browser cache: Ctrl+Shift+Delete
4. Republish all customizations
5. Try in Incognito/Private mode

### Issue: "Cross-origin" / CORS errors

**Cause:** Trying to access from wrong domain or localhost

**Solutions:**
1. Only access via Dataverse domain
2. For local development, use mock data (see Development section in README)

### Issue: Performance issues with large environments

**Cause:** Too many tables/relationships to render

**Solutions:**
1. Use the Filter by Publisher feature to reduce visible tables
2. Enable Canvas Mode for better performance (toggle in bottom-right)
3. Collapse tables you're not actively viewing
4. Use the Search feature to navigate directly to specific tables

## Best Practices

### Naming Convention
- Use publisher prefix: `adc_dataverseerdvisualizer`
- Include version for major updates: `adc_dataverseerdvisualizer_v2`

### Managed vs Unmanaged Solutions
- **Development:** Use unmanaged solutions
- **Production:** Deploy as managed solutions for cleaner upgrades

### Version Control
1. Keep source code in Git
2. Tag releases with version numbers
3. Export solution before updates as backup

### Testing Checklist
- [ ] Build completes without errors
- [ ] Test in Sandbox environment first
- [ ] Verify with non-admin user
- [ ] Test all export functions (PNG, SVG, Mermaid)
- [ ] Test with different browsers (Edge, Chrome)
- [ ] Test performance with your actual data volume

## Updating the Web Resource

To deploy a new version:

1. **Build new version:**
   ```bash
   npm run build:webresource
   ```

2. **Upload updated files:**
   - Open each web resource in the solution
   - Click "Upload File" and select the new file
   - Save

3. **Publish:**
   - Click "Publish All Customizations"

4. **Clear caches:**
   - Users should clear browser cache
   - Or test in Incognito/Private mode

5. **Verify:**
   - Open the app and confirm new version loads
   - Check for any console errors

## Performance Tips

- **Viewport Culling:** The app automatically only renders visible entities
- **Canvas Mode:** Toggle for better performance with 100+ tables
- **Filter by Publisher:** Reduce visible tables to those you need
- **Collapse Tables:** Hide field details for tables you're not examining

## Security Considerations

- Web resource uses **Dataverse session authentication** - no credentials stored
- **Read-only access** to metadata only - cannot modify data
- Respects Dataverse security roles
- All API calls via HTTPS
- No external network requests - all data stays within your environment

## Support

For issues:
1. Check browser console (F12) for errors
2. Verify user permissions
3. Test with System Administrator role
4. Review Dataverse audit logs if available
5. Open an issue on the project repository
