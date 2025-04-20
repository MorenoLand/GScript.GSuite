const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

async function build() {
    console.log('Building AniEditor...');

    const distDir = path.join(__dirname, 'dist');
    if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir);
        console.log('Created dist/ directory');
    }

    const indexSrc = path.join(__dirname, 'index.html');
    const indexDest = path.join(distDir, 'index.html');

    if (fs.existsSync(indexSrc)) {
        fs.copyFileSync(indexSrc, indexDest);
        console.log('Copied index.html to dist/');
    } else {
        console.error('index.html not found');
        process.exit(1);
    }

    const jsSrc = path.join(__dirname, 'anieditor.js');
    const jsDest = path.join(distDir, 'anieditor.js');

    if (fs.existsSync(jsSrc)) {
        console.log('Reading anieditor.js...');
        const code = fs.readFileSync(jsSrc, 'utf8');

        console.log('Kekfuscating anieditor.js...');
        const result = await minify(code, {
            compress: {
                drop_console: false,
                drop_debugger: true,
                pure_funcs: []
            },
            mangle: {
                toplevel: false,
                properties: false
            },
            format: {
                comments: false
            }
        });

        if (result.error) {
            console.error('Obfuscation error:', result.error);
            process.exit(1);
        }

        fs.writeFileSync(jsDest, result.code);
        console.log('Obfuscated anieditor.js saved to dist/');

        const originalSize = Buffer.byteLength(code, 'utf8');
        const compressedSize = Buffer.byteLength(result.code, 'utf8');
        const ratio = ((originalSize - compressedSize) / originalSize * 100).toFixed(2);

        console.log(`Original size: ${(originalSize / 1024).toFixed(2)} KB`);
        console.log(`Compressed size: ${(compressedSize / 1024).toFixed(2)} KB`);
        console.log(`Compression ratio: ${ratio}%`);

    } else {
        console.error('anieditor.js not found');
        process.exit(1);
    }

    console.log('Build completed successfully!');
    console.log('Output files in dist/ directory:');
    console.log('  - index.html');
    console.log('  - anieditor.js (obfuscated)');
}

build().catch(err => {
    console.error('Build failed:', err);
    process.exit(1);
});
