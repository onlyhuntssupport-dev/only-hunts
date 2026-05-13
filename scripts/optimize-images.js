const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');

// Supported formats
const extensions = ['.png', '.jpg', '.jpeg'];

async function optimizeImages() {
  const files = fs.readdirSync(publicDir);

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    
    if (extensions.includes(ext)) {
      const inputPath = path.join(publicDir, file);
      const fileName = path.parse(file).name;
      const outputPath = path.join(publicDir, `${fileName}.webp`);

      try {
        await sharp(inputPath)
          // RESIZE: Enforce max width of 1200px for desktop/mobile balance
          // withoutEnlargement: true prevents upscaling small icons
          .resize({ width: 1200, withoutEnlargement: true })
          // WEBP: Aggressive but high-quality compression
          .webp({ quality: 75, effort: 6 }) 
          .toFile(outputPath);

        console.log(`✅ Optimized & Resized: ${file} -> ${fileName}.webp`);
      } catch (err) {
        console.error(`❌ Error processing ${file}:`, err);
      }
    }
  }
}

optimizeImages();