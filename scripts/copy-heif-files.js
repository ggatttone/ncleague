const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '..', 'node_modules', 'libheif-wasm');
const targetDir = path.join(__dirname, '..', 'public', 'libheif');

// Crea la directory di destinazione se non esiste
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// File da copiare
const filesToCopy = [
  'libheif.wasm',
  'libheif.js'
];

filesToCopy.forEach(file => {
  const sourcePath = path.join(sourceDir, file);
  const targetPath = path.join(targetDir, file);
  
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`Copied ${file} to public/libheif/`);
  } else {
    console.warn(`Warning: ${file} not found in libheif-wasm package`);
  }
});

console.log('HEIF files copy completed');