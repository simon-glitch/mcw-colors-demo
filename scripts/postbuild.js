const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const src = path.join(root, 'src');
const out = path.join(root, 'compiled');

if (!fs.existsSync(out)) fs.mkdirSync(out, { recursive: true });

// copy and patch index.html: change module import to use compiled main.js
const indexSrc = path.join(src, 'index.html');
if (fs.existsSync(indexSrc)){
  let html = fs.readFileSync(indexSrc, 'utf8');
  // If the index references a TS module (dev), replace with compiled main.js for production
  html = html.replace(/<script[^>]*src=["'].*main\.js["'][^>]*><\/script>/i, '<script src="main.js"></script>');
  // If it uses a module import to /main.ts, replace with compiled main.js
  html = html.replace(/<script[^>]*type=["']module["'][^>]*src=["']\/?main\.ts["'][^>]*><\/script>/i, '<script src="main.js"></script>');
  fs.writeFileSync(path.join(out, 'index.html'), html, 'utf8');
}

// copy styles
const styleSrc = path.join(src, 'styles.css');
const styleRoot = path.join(root, 'styles.css');
if (fs.existsSync(styleSrc)){
  fs.copyFileSync(styleSrc, path.join(out, 'styles.css'));
} else if (fs.existsSync(styleRoot)){
  fs.copyFileSync(styleRoot, path.join(out, 'styles.css'));
}

console.log('postbuild: copied index.html and styles to compiled/');
