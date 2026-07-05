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

function cpFiltered(from, to, skip) {
    const s = path.join(root, from);
    const d = path.join(dist, to || from);
    if (!fs.existsSync(s) || skip(from)) return;
    const stat = fs.statSync(s);
    if (stat.isDirectory()) {
        fs.mkdirSync(d, { recursive: true });
        for (const f of fs.readdirSync(s)) cpFiltered(path.join(from, f), path.join(to || from, f), skip);
    } else {
        fs.mkdirSync(path.dirname(d), { recursive: true });
        fs.copyFileSync(s, d);
    }
}

rm(dist);

['index.html', 'favicon.ico', 'example-theme.css', 'changelog.json'].forEach(f => cp(f));
['ganis', 'icons', 'images', 'sounds', 'vendor', 'js', 'css', 'levels', 'objects'].forEach(d => cp(d));
cpFiltered('fonts', 'fonts', f => /MesloLGS/i.test(f));
cpFiltered('node_modules/monaco-editor/min/vs', 'monaco-editor/min/vs', f => /nls\.messages\..*\.js$/i.test(f));

const levelsDir = path.join(root, 'levels');
const levelFiles = fs.readdirSync(levelsDir).filter(f => /\.(nw|zelda|graal|gmap)$/i.test(f));
const levelsIndex = JSON.stringify(levelFiles);
fs.writeFileSync(path.join(root, 'levels', 'index.json'), levelsIndex);
fs.writeFileSync(path.join(dist, 'levels', 'index.json'), levelsIndex);

const ganisDir = path.join(root, 'ganis');
const ganiFiles = fs.readdirSync(ganisDir).filter(f => f.endsWith('.gani'));
const ganisIndex = JSON.stringify(ganiFiles);
fs.writeFileSync(path.join(root, 'ganis', 'index.json'), ganisIndex);
fs.writeFileSync(path.join(dist, 'ganis', 'index.json'), ganisIndex);

const objectsDir = path.join(root, 'objects');
const objectFiles = fs.readdirSync(objectsDir).filter(f => f.endsWith('.npc'));
const objectsIndex = JSON.stringify(objectFiles);
fs.writeFileSync(path.join(root, 'objects', 'index.json'), objectsIndex);
fs.writeFileSync(path.join(dist, 'objects', 'index.json'), objectsIndex);

console.log('Build complete: dist/');
