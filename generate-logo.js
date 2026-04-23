const fs = require('fs');
const path = require('path');

// Target the new kudu skull image in your public directory
const imagePath = path.join(__dirname, 'public', 'kudu-skull.png');
const outputPath = path.join(__dirname, 'src', 'components', 'ui', 'logoBase64.ts');

try {
  const image = fs.readFileSync(imagePath);
  const base64String = image.toString('base64');
  
  // Write the exported string to a new TypeScript file
  const fileContent = `export const kuduLogoBase64 = "${base64String}";\n`;
  fs.writeFileSync(outputPath, fileContent);
  
  console.log('✅ Base64 logo file generated successfully at src/components/ui/logoBase64.ts');
} catch (error) {
  console.error('❌ Error generating Base64 string:', error.message);
}