const fs = require('fs');
const path = require('path');

// Target the exact variable font file name in your public directory
const fontPath = path.join(__dirname, 'public', 'Oswald-VariableFont_wght.ttf');
const outputPath = path.join(__dirname, 'src', 'components', 'ui', 'fontBase64.ts');

try {
  const font = fs.readFileSync(fontPath);
  const base64String = font.toString('base64');
  
  // Write the exported string to a new TypeScript file
  const fileContent = `export const oswaldBase64 = "${base64String}";\n`;
  fs.writeFileSync(outputPath, fileContent);
  
  console.log('✅ Base64 font file generated successfully at src/components/ui/fontBase64.ts');
} catch (error) {
  console.error('❌ Error generating Base64 string:', error.message);
}