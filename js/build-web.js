const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');

function rm(p) { if (fs.existsSync(p)) fs.rmSync(p, { recursive: true }); }

function cp(from, to) {
    const s = path.join(root, from);
    const d = path.join(dist, to || from);
    if (!fs.existsSync(s)) return;
    const stat = fs.statSync(s);
    if (stat.isDirectory()) {
        fs.mkdirSync(d, { recursive: true });
        for (const f of fs.readdirSync(s)) cp(path.join(from, f), path.join(to || from, f));
    } else {
        fs.mkdirSync(path.dirname(d), { recursive: true });
        fs.copyFileSync(s, d);
    }
}

rm(dist);

['index.html', 'favicon.ico', 'example-theme.css', 'changelog.json'].forEach(f => cp(f));
['ganis', 'fonts', 'icons', 'images', 'sounds', 'vendor', 'js', 'css'].forEach(d => cp(d));
cp('node_modules/monaco-editor/min/vs', 'monaco-editor/min/vs');

console.log('Build complete: dist/');
