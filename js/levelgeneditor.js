class LevelGenEditor {
    static _host = null;
    static _content = null;
    static _instance = null;
    static _tabId = null;

    constructor(root) {
        this.root = root;
        this.width = 32;
        this.height = 32;
        this.zoom = 1;
        this.zoomLevel = 3;
        this.zoomFactors = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 6, 8];
        this.panX = 20;
        this.panY = 20;
        this.showGrid = true;
        this.bitmapCanvas = document.createElement('canvas');
        this.bitmapDirty = true;
        this.selectedPalette = 0;
        this.palette = [
            ['Grass', 24, 140, 24], ['Trees', 181, 239, 189], ['Water', 0, 0, 255], ['Mountains', 128, 0, 0],
            ['Flowers', 255, 0, 0], ['Sand', 150, 110, 0], ['Sand stones', 113, 82, 0], ['Big sand', 83, 61, 0],
            ['Swamp', 0, 106, 0], ['Bushes', 0, 66, 0], ['Puddle', 0, 255, 255], ['Puddle stone', 0, 179, 179]
        ];
        this.pixels = new Array(this.width * this.height).fill(this._color(0));
        this.painting = false;
        this.panning = false;
        this.panStartX = 0;
        this.panStartY = 0;
        this.panStartPanX = 0;
        this.panStartPanY = 0;
        this.canvas = root.querySelector('[data-lg="canvas"]');
        this.ctx = this.canvas.getContext('2d');
        LevelGenEditor._instance = this;
        this._bind();
        new ResizeObserver(() => this._render()).observe(this._q('viewport'));
        this._renderPalette();
        this._resizeGrid(false);
    }

    _q(name) { return this.root.querySelector(`[data-lg="${name}"]`); }
    _color(index) { const c = this.palette[index]; return `rgb(${c[1]},${c[2]},${c[3]})`; }
    _cellSize() { return Math.max(2, Math.floor(400 / Math.max(this.width, this.height)) * this.zoom); }

    _bind() {
        this._q('newBtn').onclick = () => this._resizeGrid(true);
        this._q('widthDec').onclick = () => this._bumpSize('widthInput', -1);
        this._q('widthInc').onclick = () => this._bumpSize('widthInput', 1);
        this._q('heightDec').onclick = () => this._bumpSize('heightInput', -1);
        this._q('heightInc').onclick = () => this._bumpSize('heightInput', 1);
        this._q('gridBtn').onclick = () => { this.showGrid = !this.showGrid; this._q('gridBtn').style.opacity = this.showGrid ? '1' : '0.55'; this._render(); };
        this._q('loadBtn').onclick = () => this._q('fileInput').click();
        this._q('fileInput').onchange = e => this._loadFile(e.target.files?.[0]);
        this._q('exampleBtn').onclick = () => this._loadImageUrl('images/levelgen.png');
        this._q('docsBtn').onclick = () => this._showDocs();
        this._q('closeDocsBtn').onclick = () => this._q('docsModal').style.display = 'none';
        this._q('saveBtn').onclick = () => this._savePng();
        this._q('zoomOutBtn').onclick = () => this._stepZoom(-1, this.canvas.width / 2, this.canvas.height / 2);
        this._q('zoomInBtn').onclick = () => this._stepZoom(1, this.canvas.width / 2, this.canvas.height / 2);
        this.canvas.addEventListener('contextmenu', e => e.preventDefault());
        this.canvas.addEventListener('mousedown', e => this._onDown(e));
        this.canvas.addEventListener('wheel', e => this._onWheel(e), { passive: false });
        window.addEventListener('mousemove', e => this._onMove(e));
        window.addEventListener('mouseup', () => { this.painting = false; this.panning = false; });
    }

    _renderPalette() {
        const host = this._q('palette');
        host.innerHTML = '';
        this.palette.forEach((p, i) => {
            const b = document.createElement('button');
            b.title = p[0];
            b.style.cssText = `width:28px;height:24px;background:${this._color(i)};border:2px solid ${i === this.selectedPalette ? '#fff' : '#111'};box-shadow:inset 0 0 0 1px #555;cursor:pointer;`;
            b.onclick = () => { this.selectedPalette = i; this._renderPalette(); };
            host.appendChild(b);
        });
    }

    _resizeGrid(resetPixels) {
        this.width = Math.max(8, Math.min(128, parseInt(this._q('widthInput').value, 10) || 32));
        this.height = Math.max(8, Math.min(128, parseInt(this._q('heightInput').value, 10) || 32));
        this._q('widthInput').value = this.width;
        this._q('heightInput').value = this.height;
        if (resetPixels) this.pixels = new Array(this.width * this.height).fill(this._color(0));
        this.bitmapDirty = true;
        this._render();
    }

    _bumpSize(name, delta) {
        const input = this._q(name);
        input.value = Math.max(8, Math.min(128, (parseInt(input.value, 10) || 32) + delta));
    }

    _updateInfo() {
        this._q('levelsLabel').textContent = `Levels: ${Math.ceil(this.width / 64)} x ${Math.ceil(this.height / 64)}`;
        this._q('zoomLabel').textContent = `Zoom: ${Math.round(this.zoom * 100)}%`;
    }

    _render() {
        this._updateInfo();
        this._resizeCanvas();
        const cell = this._cellSize(), ox = Math.round(this.panX), oy = Math.round(this.panY);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this._updateBitmap();
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.drawImage(this.bitmapCanvas, ox, oy, this.width * cell, this.height * cell);
        if (this.showGrid && cell >= 4) {
            this.ctx.strokeStyle = '#777';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            for (let x = 0; x <= this.width; x++) { const px = ox + x * cell + 0.5; this.ctx.moveTo(px, oy); this.ctx.lineTo(px, oy + this.height * cell); }
            for (let y = 0; y <= this.height; y++) { const py = oy + y * cell + 0.5; this.ctx.moveTo(ox, py); this.ctx.lineTo(ox + this.width * cell, py); }
            this.ctx.stroke();
        }
    }

    _updateBitmap() {
        if (!this.bitmapDirty) return;
        this.bitmapCanvas.width = this.width;
        this.bitmapCanvas.height = this.height;
        const ctx = this.bitmapCanvas.getContext('2d');
        const image = ctx.createImageData(this.width, this.height);
        for (let i = 0; i < this.pixels.length; i++) {
            const m = this.pixels[i].match(/\d+/g) || [0, 0, 0];
            image.data[i * 4] = +m[0];
            image.data[i * 4 + 1] = +m[1];
            image.data[i * 4 + 2] = +m[2];
            image.data[i * 4 + 3] = 255;
        }
        ctx.putImageData(image, 0, 0);
        this.bitmapDirty = false;
    }

    _resizeCanvas() {
        const view = this._q('viewport');
        const rect = view.getBoundingClientRect();
        this.canvas.width = Math.max(1, Math.floor(rect.width));
        this.canvas.height = Math.max(1, Math.floor(rect.height));
    }

    _paintAt(clientX, clientY) {
        const r = this.canvas.getBoundingClientRect();
        const cell = this._cellSize();
        const x = Math.floor((clientX - r.left - Math.round(this.panX)) / cell), y = Math.floor((clientY - r.top - Math.round(this.panY)) / cell);
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
        this.pixels[y * this.width + x] = this._color(this.selectedPalette);
        this.bitmapDirty = true;
        this._render();
    }

    _onDown(e) {
        if (e.button === 2 || e.button === 1) {
            this.panning = true;
            this.panStartX = e.clientX;
            this.panStartY = e.clientY;
            this.panStartPanX = this.panX;
            this.panStartPanY = this.panY;
            e.preventDefault();
            return;
        }
        if (e.button !== 0) return;
        this.painting = true;
        this._paintAt(e.clientX, e.clientY);
    }

    _onMove(e) {
        if (this.panning) {
            this.panX = this.panStartPanX + e.clientX - this.panStartX;
            this.panY = this.panStartPanY + e.clientY - this.panStartY;
            this._render();
            return;
        }
        if (this.painting) this._paintAt(e.clientX, e.clientY);
    }

    _onWheel(e) {
        e.preventDefault();
        const r = this.canvas.getBoundingClientRect();
        this._stepZoom(e.deltaY < 0 ? 1 : -1, e.clientX - r.left, e.clientY - r.top);
    }

    _stepZoom(dir, anchorX, anchorY) {
        const oldZoom = this.zoom;
        this.zoomLevel = Math.max(0, Math.min(this.zoomFactors.length - 1, this.zoomLevel + dir));
        this.zoom = this.zoomFactors[this.zoomLevel];
        if (oldZoom !== this.zoom) {
            const ratio = this.zoom / oldZoom;
            this.panX = anchorX - (anchorX - this.panX) * ratio;
            this.panY = anchorY - (anchorY - this.panY) * ratio;
            this._render();
        }
    }

    _loadFile(file) {
        if (!file || !/\.(png|gif)$/i.test(file.name || '')) return;
        const url = URL.createObjectURL(file);
        this._loadImageUrl(url, () => URL.revokeObjectURL(url));
    }

    _loadImageUrl(url, done = null) {
        const img = new Image();
        img.onload = () => {
            done?.();
            if (img.width < 8 || img.height < 8 || img.width > 128 || img.height > 128) return;
            const c = document.createElement('canvas');
            c.width = img.width;
            c.height = img.height;
            const ctx = c.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(img, 0, 0);
            const data = ctx.getImageData(0, 0, img.width, img.height).data;
            this.width = img.width;
            this.height = img.height;
            this._q('widthInput').value = this.width;
            this._q('heightInput').value = this.height;
            this.pixels = new Array(this.width * this.height);
            for (let i = 0; i < this.pixels.length; i++) this.pixels[i] = `rgb(${data[i * 4]},${data[i * 4 + 1]},${data[i * 4 + 2]})`;
            this.bitmapDirty = true;
            this._render();
        };
        img.onerror = () => done?.();
        img.src = url;
    }

    _showDocs() {
        this._q('docsModal').style.display = 'flex';
    }

    _savePng() {
        const c = document.createElement('canvas');
        c.width = this.width;
        c.height = this.height;
        const ctx = c.getContext('2d');
        for (let y = 0; y < this.height; y++) for (let x = 0; x < this.width; x++) {
            ctx.fillStyle = this.pixels[y * this.width + x];
            ctx.fillRect(x, y, 1, 1);
        }
        const a = document.createElement('a');
        a.href = c.toDataURL('image/png');
        a.download = 'map.png';
        a.click();
    }

    static _ensureContent() {
        if (LevelGenEditor._content) return;
        const wrapper = document.createElement('div');
        wrapper.className = 'main-container';
        wrapper.style.cssText = 'display:flex;flex-direction:column;width:100%;height:100%;min-width:0;min-height:0;background:#1e1e1e;color:#ddd;font-family:chevyray,monospace;';
        const btn = 'height:24px;background:#353535;border:1px solid #0a0a0a;border-top-color:#404040;border-left-color:#404040;color:#e0e0e0;padding:3px 10px;font-family:chevyray,monospace;font-size:11px;white-space:nowrap;flex:0 0 auto;';
        const spinBtn = 'width:14px;height:10px;border:0;background:transparent;color:#ddd;font-size:8px;line-height:8px;padding:0;cursor:pointer;';
        const spin = name => `<span style="display:inline-flex;align-items:center;width:52px;height:22px;background:#1a1a1a;border:1px solid #444;box-sizing:border-box;flex:0 0 52px;"><input data-lg="${name}Input" type="text" value="32" style="width:34px;height:20px;background:transparent;color:#ddd;border:0;padding:2px 4px;font-family:monospace;box-sizing:border-box;outline:none;"><span style="display:flex;flex-direction:column;width:14px;height:20px;"><button data-lg="${name}Inc" style="${spinBtn}">▲</button><button data-lg="${name}Dec" style="${spinBtn}">▼</button></span></span>`;
        wrapper.innerHTML = `
        <div style="display:flex;align-items:center;gap:6px;padding:6px 12px;background:#2b2b2b;border-bottom:1px solid #111;flex:0 0 auto;min-width:0;white-space:nowrap;overflow-x:auto;">
            <span style="white-space:nowrap;flex:0 0 auto;">Map size:</span><span style="display:inline-flex;align-items:center;gap:4px;flex:0 0 auto;">${spin('width')}<span>x</span>${spin('height')}</span>
            <button data-lg="newBtn" style="${btn}">New grid</button><button data-lg="exampleBtn" style="${btn}">Example</button><button data-lg="loadBtn" style="${btn}">Load map...</button><button data-lg="saveBtn" style="${btn}">Save map...</button><button data-lg="gridBtn" style="${btn}">Grid</button><button data-lg="docsBtn" style="${btn}">Info</button>
            <span style="flex:1 1 auto;min-width:12px;"></span><span data-lg="levelsLabel" style="color:#aaa;white-space:nowrap;flex:0 0 auto;">Levels: 1 x 1</span>
            <button data-lg="zoomOutBtn" style="${btn}">Zoom -</button><button data-lg="zoomInBtn" style="${btn}">Zoom +</button><span data-lg="zoomLabel" style="color:#aaa;white-space:nowrap;flex:0 0 auto;">Zoom: 100%</span>
            <input data-lg="fileInput" type="file" accept=".png,.gif" style="display:none;">
        </div>
        <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:#252525;border-bottom:1px solid #111;flex-shrink:0;"><span>Palette</span><div data-lg="palette" style="display:flex;gap:4px;"></div></div>
        <div data-lg="viewport" style="flex:1;min-height:0;overflow:hidden;background:#323232;"><canvas data-lg="canvas" style="display:block;width:100%;height:100%;cursor:crosshair;image-rendering:pixelated;"></canvas></div>
        <div data-lg="docsModal" style="display:none;position:fixed;inset:0;background:transparent;z-index:9100;align-items:center;justify-content:center;">
            <div style="width:min(760px,92vw);max-height:82vh;background:#1e1e1e;border:1px solid #3a3a3a;display:flex;flex-direction:column;color:#ddd;box-shadow:0 8px 32px rgba(0,0,0,0.8);">
                <div style="display:flex;align-items:center;justify-content:space-between;background:#2a2a2a;border-bottom:1px solid #111;padding:8px 12px;"><span>Level Generator Info</span><button data-lg="closeDocsBtn" style="${btn}">Close</button></div>
                <div style="padding:14px;overflow:auto;font-family:chevyray,monospace;font-size:12px;line-height:1.5;">
                    <p style="margin:0 0 12px;">Draw a small color map and generate a Graal world outline from it. Each pixel is interpreted as terrain, then expanded into aligned .nw levels and a .gmap by the generator.</p>
                    <div style="text-align:center;margin:0 0 12px;"><img src="images/levelgendoc1.png" style="max-width:100%;image-rendering:auto;border:1px solid #333;"></div>
                    <p style="margin:0 0 12px;">Use image sizes from 8x8 to 128x128. A 64x64 map is one level, 128x64 is two levels wide, and so on.</p>
                    <table style="width:100%;border-collapse:collapse;margin-bottom:12px;">${[
                        ['Grass','rgb(24,140,24)','Normal grass'], ['Trees','rgb(181,239,189)','Forest'], ['Water','rgb(0,0,255)','Sea and rivers'], ['Mountains','rgb(128,0,0)','Mountains'],
                        ['Flowers','rgb(255,0,0)','Flowers'], ['Sand','rgb(150,110,0)','Sand'], ['Sand stones','rgb(113,82,0)','Small sand stones'], ['Big sand','rgb(83,61,0)','Big sand stone'],
                        ['Swamp','rgb(0,106,0)','Swamp'], ['Bushes','rgb(0,66,0)','Bushes'], ['Puddle','rgb(0,255,255)','Puddle'], ['Puddle stone','rgb(0,179,179)','Puddle stone']
                    ].map(row => `<tr><td style="padding:3px 8px 3px 0;color:#aaa;">${row[0]}</td><td style="width:34px;"><span style="display:block;width:28px;height:16px;background:${row[1]};border:1px solid #555;"></span></td><td style="padding:3px 0;">${row[2]}</td></tr>`).join('')}</table>
                    <p style="margin:0 0 12px;">Generated output includes linked levels named from the selected prefix and a matching .gmap. Offline maps can be loaded with <code>if (created) loadmap worldname;</code> or via <code>loadgmaps.txt</code>.</p>
                    <div style="text-align:center;margin:0 0 12px;"><img src="images/levelgendoc2.png" style="max-width:100%;image-rendering:auto;border:1px solid #333;"></div>
                    <p style="margin:0;">Running generation over existing levels adds terrain on top of them instead of replacing the whole level, so multiple passes can layer trees, bushes, sand, and mountains.</p>
                </div>
            </div>
        </div>`;
        LevelGenEditor._content = wrapper;
        new LevelGenEditor(wrapper);
    }

    static mountInto(host) {
        if (!host) return;
        LevelGenEditor._host = host;
        LevelGenEditor._ensureContent();
        host.innerHTML = '';
        host.appendChild(LevelGenEditor._content);
        LevelGenEditor._instance?._render();
    }

    static open() {
        if (window.tabManager) {
            const existing = window.tabManager.getTabsByType('levelgen')[0];
            if (existing) window.tabManager.switchTo(existing.id);
            else {
                const tab = window.tabManager.addTab('levelgen', 'Level Generator', { kind: 'levelgen' });
                LevelGenEditor._tabId = tab?.id || null;
            }
        }
    }
}

window.LevelGenEditor = LevelGenEditor;
window.activateLevelGenTab = function() { LevelGenEditor.mountInto(document.getElementById('levelgenTabHost')); };
window.deactivateLevelGenTab = function() {};
window.closeLevelGenTab = function() {
    if (LevelGenEditor._host) LevelGenEditor._host.innerHTML = '';
    LevelGenEditor._tabId = null;
};
