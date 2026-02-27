import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const publicDir = join(__dirname, '../public');
const logoPath = join(publicDir, 'assets/restoran/images/LogoSteakKenangan.png');

async function generateFavicons() {
  try {
    // Generate PNG in multiple sizes from the logo
    const sizes = [16, 32, 48, 64, 128, 180, 192, 256];

    for (const size of sizes) {
      await sharp(logoPath)
        .resize(size, size, { fit: 'cover', position: 'center' })
        .png()
        .toFile(join(publicDir, `favicon-${size}x${size}.png`));
      console.log(`Generated favicon-${size}x${size}.png`);
    }

    // Generate apple-touch-icon (180x180)
    await sharp(logoPath)
      .resize(180, 180, { fit: 'cover', position: 'center' })
      .png()
      .toFile(join(publicDir, 'apple-touch-icon.png'));
    console.log('Generated apple-touch-icon.png');

    // Generate ICO file from multiple PNG sizes
    const pngBuffers = await Promise.all([
      sharp(logoPath).resize(16, 16, { fit: 'cover', position: 'center' }).png().toBuffer(),
      sharp(logoPath).resize(32, 32, { fit: 'cover', position: 'center' }).png().toBuffer(),
      sharp(logoPath).resize(48, 48, { fit: 'cover', position: 'center' }).png().toBuffer(),
    ]);

    const icoBuffer = await pngToIco(pngBuffers);
    writeFileSync(join(publicDir, 'favicon.ico'), icoBuffer);
    console.log('Generated favicon.ico');

    console.log('All favicon files generated successfully!');
  } catch (error) {
    console.error('Error generating favicons:', error);
    process.exit(1);
  }
}

generateFavicons();
