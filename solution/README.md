# Dataverse Solution Package

This folder contains the Dataverse managed solution for easy deployment.

## Download

Download the latest managed solution from [GitHub Releases](https://github.com/allandecastro/dataverse-erd-visualizer/releases).

## Installation

### Option 1: Power Apps Portal

1. Go to [make.powerapps.com](https://make.powerapps.com)
2. Select your environment
3. Navigate to **Solutions** → **Import solution**
4. Browse and select `DataverseERDVisualizer_managed.zip`
5. Click **Next** → **Import**

### Option 2: PAC CLI

```bash
pac auth create --environment "https://yourorg.crm.dynamics.com"
pac solution import --path DataverseERDVisualizer_managed.zip
```

## After Import

Add the web resource to your Model-driven app:

1. Open your app in **App Designer**
2. Add a new **Subarea**
3. Set **Content Type** to **Web Resource**
4. Select `adc_/erdvisualizer/adc_erdvisualizer.html`
5. **Save** and **Publish**

## Solution Details

| Property | Value |
|----------|-------|
| Unique Name | `DataverseERDVisualizer` |
| Publisher | Allan De Castro |
| Prefix | `adc_` |
| Type | Managed |
