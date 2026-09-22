const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'frontend', 'dist', 'frontend', 'browser');
const destDir = path.join(__dirname, '..', 'public');

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

if (fs.existsSync(srcDir)) {
  console.log(`Copying built frontend from ${srcDir} to ${destDir}...`);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  copyRecursiveSync(srcDir, destDir);
  console.log('Frontend assets copied successfully to public/');
} else {
  console.warn(`Source directory does not exist: ${srcDir}`);
}
