# Logo Assets - Download Instructions

The Embark Earthworks logo files need to be downloaded from the company website and placed in this directory.

## Required Files

1. **embark-logo-colored.png**
   - Source: https://images.squarespace-cdn.com/content/v1/68ef2930f12f366ef1ca69e8/5875cadd-d19f-4194-ba65-4672f827713c/Website+Banner+Logo+-+wb+-+transparent+bg.png
   - Description: Colored pattern-based logo with transparent background
   - Usage: Primary branding on light backgrounds

2. **embark-logo-bw.png**
   - Source: Contact Embark Earthworks or extract from website footer
   - Description: Black & white version with transparent background
   - Usage: Dark backgrounds, print materials

3. **embark-icon.png**
   - Source: https://www.embarkearthworks.au/favicon-300x300.png (or similar)
   - Description: Square format icon (300x300px)
   - Usage: Favicons, app icons, social media

## Download Steps

### Option 1: Manual Download
1. Navigate to https://www.embarkearthworks.au
2. Right-click on the logo → "Save Image As..."
3. Save as the appropriate filename in this directory
4. Repeat for each variant

### Option 2: Using wget/curl
```bash
# Colored logo
wget "https://images.squarespace-cdn.com/content/v1/68ef2930f12f366ef1ca69e8/5875cadd-d19f-4194-ba65-4672f827713c/Website+Banner+Logo+-+wb+-+transparent+bg.png" -O embark-logo-colored.png

# Icon/Favicon
wget "https://www.embarkearthworks.au/favicon-300x300.png" -O embark-icon.png
```

### Option 3: Contact Embark Earthworks
If high-resolution versions or vector formats (SVG) are needed:
- Contact: Embark Earthworks
- Website: https://www.embarkearthworks.au
- Request: Logo assets package (PNG, SVG if available)

## File Specifications

- **Format**: PNG with transparent background (recommended)
- **Color space**: sRGB
- **Resolution**: At least 300 DPI for print, 72 DPI for web
- **Transparency**: Alpha channel required
- **File size**: Keep under 500KB per file

## Verification

After downloading, verify:
- [ ] Files are named correctly (embark-logo-colored.png, embark-logo-bw.png, embark-icon.png)
- [ ] Transparent background (not white)
- [ ] High resolution (not pixelated)
- [ ] Correct aspect ratio maintained
- [ ] Files load correctly in Logo component

## Implementation Check

Test the Logo component after downloading files:

```bash
# Start the development server
npm run dev

# The Logo component should display without broken image errors
```

---

**Note**: Logo files are gitignored by default. Each developer should download logos locally. For production deployment, ensure logo files are included in the build process or served from a CDN.
