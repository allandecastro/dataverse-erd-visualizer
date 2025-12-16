# Deployment Guide - Dataverse Web Resource

## Quick Deployment Steps

### 1. Build the Web Resource

```bash
npm run build:webresource
```

This creates optimized files in `dist/webresource/`:
- `cr_erdvisualizer.js` - Main JavaScript bundle
- `cr_erdvisualizer.css` - Styles
- `index.html` - HTML wrapper (optional)

### 2. Upload to Dataverse

#### Using Power Apps Portal

1. Navigate to https://make.powerapps.com
2. Select your environment
3. Go to **Solutions** → Select your solution (or create new)
4. Click **+ New** → **More** → **Web resource**

**Upload JavaScript:**
- Name: `cr_erdvisualizer.js`
- Display Name: `ERD Visualizer Script`
- Type: **Script (JScript)**
- Upload: `dist/webresource/cr_erdvisualizer.js`

**Upload CSS:**
- Name: `cr_erdvisualizer.css`
- Display Name: `ERD Visualizer Styles`
- Type: **Style Sheet (CSS)**
- Upload: `dist/webresource/cr_erdvisualizer.css`

**Upload HTML:**
- Name: `cr_erdvisualizer.html`
- Display Name: `ERD Visualizer`
- Type: **Web Page (HTML)**
- Content: See below

5. **Save** and **Publish**

### 3. HTML Web Resource Content

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ERD Visualizer</title>
    <link rel="stylesheet" href="cr_erdvisualizer.css">
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
    <script src="cr_erdvisualizer.js"></script>
</body>
</html>
```

### 4. Add to Sitemap (App Navigation)

#### Using App Designer

1. Open your Model-Driven App in **App Designer**
2. Click **Navigation** → **+ Add** → **Group**
3. Add **Subarea**:
   - **Title:** ERD Visualizer
   - **Icon:** Choose visualization icon
   - **URL:** `/main.aspx?pagetype=webresource&webresourceName=cr_erdvisualizer.html`
   - **Open in:** Main Window

4. **Save** and **Publish**

#### Using Sitemap XML (Advanced)

Add to your sitemap:

```xml
<Area Id="cr_Tools" ResourceId="Area_Tools">
  <Group Id="cr_DataTools" ResourceId="Group_DataTools">
    <SubArea 
      Id="cr_ERDVisualizer" 
      ResourceId="SubArea_ERDVisualizer"
      Title="ERD Visualizer"
      Url="/main.aspx?pagetype=webresource&amp;webresourceName=cr_erdvisualizer.html"
      Icon="/_imgs/area/visualizations.png">
    </SubArea>
  </Group>
</Area>
```

### 5. Grant Permissions

Users need:
- **Read** permission on **Entity Definitions**
- **Read** permission on **Relationship Definitions**
- **Read** permission on the Web Resource

Add to security role:
1. **Customization** tab
2. Enable **Entity** → **Read**
3. Enable **Relationship** → **Read**

## Alternative: Standalone Page

For a standalone page (not in navigation):

1. Upload web resources as above
2. Access directly via URL:
   ```
   https://[org].crm.dynamics.com/WebResources/cr_erdvisualizer.html
   ```

## Solution XML Structure (for PAC CLI)

Create `solution.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<ImportExportXml xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <SolutionManifest>
    <UniqueName>ERDVisualizer</UniqueName>
    <LocalizedNames>
      <LocalizedName description="ERD Visualizer" languagecode="1033"/>
    </LocalizedNames>
    <Descriptions>
      <Description description="Entity Relationship Diagram Visualizer" languagecode="1033"/>
    </Descriptions>
    <Version>1.0.0.0</Version>
    <Managed>0</Managed>
    <Publisher>
      <UniqueName>contoso</UniqueName>
      <LocalizedNames>
        <LocalizedName description="Contoso" languagecode="1033"/>
      </LocalizedNames>
    </Publisher>
  </SolutionManifest>
</ImportExportXml>
```

## Using PAC CLI (Power Platform CLI)

```bash
# Login
pac auth create --url https://[org].crm.dynamics.com

# Create solution
pac solution init --publisher-name contoso --publisher-prefix cr

# Add web resources
pac solution add-reference --path "dist/webresource/cr_erdvisualizer.js"
pac solution add-reference --path "dist/webresource/cr_erdvisualizer.css"
pac solution add-reference --path "dist/webresource/cr_erdvisualizer.html"

# Pack solution
pac solution pack --zipfile ERDVisualizer.zip --folder src --packagetype Both

# Import to environment
pac solution import --path ERDVisualizer.zip
```

## Troubleshooting

### Issue: "Xrm is not defined"

**Cause:** Web resource loaded outside Dataverse context

**Solution:** 
- Ensure accessing via Dataverse URL
- Check HTML wrapper includes proper Xrm initialization

### Issue: "Failed to fetch entity metadata"

**Cause:** Insufficient permissions or API error

**Solutions:**
1. Verify user has read permissions on Entity Definitions
2. Check browser console for detailed error
3. Verify Web API is enabled

### Issue: Blank screen

**Causes:**
1. JavaScript not loaded
2. CSS not loaded
3. Root div missing

**Solutions:**
1. Check browser console for errors
2. Verify web resource names match
3. Clear browser cache and republish

### Issue: CORS errors in development

**Solution:** Use Dataverse environment URL in `.env`:
```
VITE_DATAVERSE_URL=https://your-org.crm.dynamics.com
```

## Best Practices

1. **Versioning:** Include version in web resource names
   - `cr_erdvisualizer_v1_0_0.js`
   
2. **Managed Solutions:** Deploy as managed for production

3. **Dependencies:** Document in solution description

4. **Testing:** Test in Sandbox before Production

5. **Backup:** Export solution before updates

## Updates

To update the web resource:

1. Build new version: `npm run build:webresource`
2. Upload new files (overwrite existing)
3. **Increment version** in web resource properties
4. **Publish** all customizations
5. Clear browser cache
6. Test in Incognito/Private mode

## Performance Tips

- Enable **CDN** for web resources (if available)
- Use **Gzip compression** on web server
- Monitor with browser DevTools
- Consider lazy loading for large environments (1000+ tables)

## Security Considerations

- Web resource uses **Dataverse session authentication**
- No credentials stored in code
- Read-only access to metadata
- Respects Dataverse security roles
- All API calls via HTTPS

## Support

For issues:
1. Check browser console
2. Verify permissions
3. Test with System Administrator role
4. Review Dataverse logs
