const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 13772;
const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.ogg': 'audio/ogg'
};

const server = http.createServer((req, res) => {
    const urlPath = req.url.split('?')[0];
    let filePath = '.' + urlPath;
    if (filePath === './') {
        filePath = './index.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.stat(filePath, (statError, stats) => {
        if (statError) {
            if (statError.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Server error: ' + statError.code);
            }
            return;
        }
        if (stats.isDirectory()) {
            fs.readdir(filePath, (err, files) => {
                if (err) {
                    res.writeHead(500);
                    res.end('Server error: ' + err.code);
                    return;
                }
                let html = '<!DOCTYPE html><html><head><title>Directory Listing</title><base href="' + req.url + '"></head><body><ul>';
                for (const file of files) {
                    const ext = path.extname(file).toLowerCase();
                    if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.bmp'].includes(ext)) {
                        html += `<li><a href="${file}">${file}</a></li>`;
                    }
                }
                html += '</ul></body></html>';
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(html);
            });
            return;
        }
        fs.readFile(filePath, (error, content) => {
            if (error) {
                res.writeHead(500);
                res.end('Server error: ' + error.code);
            } else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content, 'utf-8');
            }
        });
    });
});

server.listen(PORT, '0.0.0.0', () => {
    const os = require('os');
    const networkInterfaces = os.networkInterfaces();
    let localIP = 'localhost';
    for (const name of Object.keys(networkInterfaces)) {
        for (const iface of networkInterfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                localIP = iface.address;
                break;
            }
        }
        if (localIP !== 'localhost') break;
    }
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`Server accessible on LAN at http://${localIP}:${PORT}/`);
    console.log('Press Ctrl+C to stop the server');
});

