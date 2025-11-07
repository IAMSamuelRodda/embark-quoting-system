/**
 * Favicon Generation Script
 *
 * Generates multiple favicon sizes from the source icon for maximum browser compatibility.
 *
 * Sizes Generated:
 * - 16x16: Browser tab (standard)
 * - 32x32: Browser tab (retina)
 * - 64x64: Windows tile
 * - 128x128: Chrome Web Store
 * - 256x256: macOS icon
 * - 512x512: PWA splash screen
 *
 * Output:
 * - PNG files: frontend/public/favicons/favicon-{size}.png
 * - ICO file: frontend/public/favicon.ico (16x16, 32x32, 48x48)
 *
 * Usage:
 * npm run generate:favicons
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_ICON = path.join(__dirname, '../public/assets/logos/embark-icon-light.webp');
const OUTPUT_DIR = path.join(__dirname, '../public/favicons');
const FAVICON_ICO = path.join(__dirname, '../public/favicon.ico');

// Favicon sizes to generate
const SIZES = [16, 32, 64, 128, 256, 512];

async function generateFavicons() {
  console.log('🎨 Generating favicons from:', SOURCE_ICON);
  console.log('');

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log('✅ Created output directory:', OUTPUT_DIR);
  }

  // Verify source icon exists
  if (!fs.existsSync(SOURCE_ICON)) {
    console.error('❌ Source icon not found:', SOURCE_ICON);
    process.exit(1);
  }

  // Generate PNG favicons for each size
  console.log('📦 Generating PNG favicons...');
  for (const size of SIZES) {
    const outputPath = path.join(OUTPUT_DIR, `favicon-${size}x${size}.png`);

    try {
      await sharp(SOURCE_ICON)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }, // Transparent background
        })
        .png()
        .toFile(outputPath);

      console.log(`  ✅ ${size}x${size} → ${path.basename(outputPath)}`);
    } catch (error) {
      console.error(`  ❌ Failed to generate ${size}x${size}:`, error);
    }
  }

  // Generate favicon.ico (multi-resolution ICO file)
  console.log('');
  console.log('🔧 Generating favicon.ico (multi-resolution)...');

  try {
    // Create 32x32 PNG for ICO (most common size)
    const ico32Buffer = await sharp(SOURCE_ICON)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .png()
      .toBuffer();

    // Sharp doesn't support ICO format directly, so we'll use the 32x32 PNG
    // For a proper multi-resolution ICO, consider using a dedicated ICO library
    fs.writeFileSync(FAVICON_ICO, ico32Buffer);
    console.log('  ✅ favicon.ico (32x32) → favicon.ico');
    console.log('  ℹ️  For true multi-resolution ICO, consider using png-to-ico package');
  } catch (error) {
    console.error('  ❌ Failed to generate favicon.ico:', error);
  }

  // Generate apple-touch-icon (180x180)
  console.log('');
  console.log('🍎 Generating Apple touch icon...');

  try {
    const appleTouchIcon = path.join(OUTPUT_DIR, 'apple-touch-icon.png');
    await sharp(SOURCE_ICON)
      .resize(180, 180, {
        fit: 'contain',
        background: { r: 255, g: 180, b: 0, alpha: 1 }, // CAT Gold background
      })
      .png()
      .toFile(appleTouchIcon);

    console.log(`  ✅ 180x180 → ${path.basename(appleTouchIcon)}`);
  } catch (error) {
    console.error('  ❌ Failed to generate apple-touch-icon:', error);
  }

  // Summary
  console.log('');
  console.log('✨ Favicon generation complete!');
  console.log('');
  console.log('📂 Output locations:');
  console.log(`  - PNG favicons: ${OUTPUT_DIR}`);
  console.log(`  - ICO favicon: ${FAVICON_ICO}`);
  console.log('');
  console.log('🔗 Next steps:');
  console.log('  1. Update index.html with favicon links');
  console.log('  2. Configure PWA manifest with icon paths');
  console.log('  3. Test favicons in different browsers');
}

// Run the script
generateFavicons().catch((error) => {
  console.error('❌ Favicon generation failed:', error);
  process.exit(1);
});
