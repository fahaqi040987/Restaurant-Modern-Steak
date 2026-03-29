#!/usr/bin/env node

/**
 * Favicon Generation Script
 * Generates optimized favicon sizes from the restaurant logo
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pngToIco from 'png-to-ico';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SOURCE_LOGO = path.join(__dirname, '../public/assets/restoran/images/LogoSteakKenangan.png');
const OUTPUT_DIR = path.join(__dirname, '../public');

// Favicon sizes to generate
const FAVICON_SIZES = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'favicon-48x48.png', size: 48 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-192x192.png', size: 192 },
  { name: 'favicon-512x512.png', size: 512 },
];

async function generateFavicons() {
  console.log('🎨 Generating favicons from restaurant logo...\n');

  try {
    // Check if source logo exists
    if (!fs.existsSync(SOURCE_LOGO)) {
      throw new Error(`Source logo not found: ${SOURCE_LOGO}`);
    }

    console.log(`📸 Source logo: ${SOURCE_LOGO}`);

    // Get source image metadata
    const metadata = await sharp(SOURCE_LOGO).metadata();
    console.log(`   Original size: ${metadata.width}x${metadata.height}\n`);

    // Generate each favicon size
    for (const { name, size } of FAVICON_SIZES) {
      const outputPath = path.join(OUTPUT_DIR, name);

      await sharp(SOURCE_LOGO)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png({ quality: 90, compressionLevel: 9 })
        .toFile(outputPath);

      const stats = fs.statSync(outputPath);
      console.log(`✅ Generated ${name} (${size}x${size}) - ${(stats.size / 1024).toFixed(1)} KB`);
    }

    // Generate ICO file with multiple sizes
    console.log('\n📦 Generating favicon.ico with multiple sizes...');
    const sizesForIco = [16, 32, 48];

    // Create temporary PNG files for ICO generation
    const tempFiles = [];
    for (const size of sizesForIco) {
      const tempPath = path.join(OUTPUT_DIR, `temp-${size}.png`);
      await sharp(SOURCE_LOGO)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(tempPath);
      tempFiles.push(tempPath);
    }

    // Generate ICO from temp files
    const icoPath = path.join(OUTPUT_DIR, 'favicon.ico');
    const icoBuffer = await pngToIco(tempFiles);
    fs.writeFileSync(icoPath, icoBuffer);

    // Clean up temp files
    tempFiles.forEach(file => fs.unlinkSync(file));

    const icoStats = fs.statSync(icoPath);
    console.log(`✅ Generated favicon.ico - ${(icoStats.size / 1024).toFixed(1)} KB`);

    console.log('\n🎉 All favicons generated successfully!\n');
    console.log('Generated files:');
    console.log('  • favicon.ico (multi-size)');
    console.log('  • favicon-16x16.png');
    console.log('  • favicon-32x32.png');
    console.log('  • favicon-48x48.png');
    console.log('  • apple-touch-icon.png');
    console.log('  • favicon-192x192.png');
    console.log('  • favicon-512x512.png');
    console.log('\n💡 Next steps:');
    console.log('  1. Restart your dev server (if running)');
    console.log('  2. Hard refresh browser (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)');
    console.log('  3. Check browser tab for the new favicon\n');

  } catch (error) {
    console.error('\n❌ Error generating favicons:', error.message);
    process.exit(1);
  }
}

// Run the script
generateFavicons();
