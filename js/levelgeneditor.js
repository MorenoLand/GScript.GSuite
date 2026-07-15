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
        this.tool = 'draw';
        this.palette = [
            ['Grass', 24, 140, 24], ['Trees', 181, 239, 189], ['Water', 0, 0, 255], ['Mountains', 128, 0, 0],
            ['Flowers', 255, 0, 0], ['Sand', 150, 110, 0], ['Sand stones', 113, 82, 0], ['Big Sand Stone', 83, 61, 0],
            ['Swamp', 0, 106, 0], ['Bushes', 0, 66, 0], ['Puddle', 0, 255, 255], ['Puddle stone', 0, 179, 179]
        ];
        this.pixels = new Array(this.width * this.height).fill(this._color(0));
        this.undoStack = [];
        this.redoStack = [];
        this.painting = false;
        this.panning = false;
        this.panStartX = 0;
        this.panStartY = 0;
        this.panStartPanX = 0;
        this.panStartPanY = 0;
        this.canvas = root.querySelector('[data-lg="canvas"]');
        this.ctx = this.canvas.getContext('2d');
        this._sessionHydrating = true;
        this._sessionUpdatedAt = 0;
        this._restoreSession();
        LevelGenEditor._instance = this;
        this._bind();
        new ResizeObserver(() => this._render()).observe(this._q('viewport'));
        this._renderPalette();
        this._resizeGrid(false);
        this._restoreSessionDatabase();
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
        this._q('generateBtn').onclick = () => this._showGenerate();
        this._q('closeGenerateBtn').onclick = () => this._q('generateModal').style.display = 'none';
        this._q('browseOutputBtn').onclick = () => this._chooseOutputFolder();
        this._q('confirmGenerateBtn').onclick = () => this._generateWorld();
        this._q('drawBtn').onclick = () => this._setTool('draw');
        this._q('fillBtn').onclick = () => this._setTool('fill');
        this._q('zoomOutBtn').onclick = () => this._stepZoom(-1, this.canvas.width / 2, this.canvas.height / 2);
        this._q('zoomInBtn').onclick = () => this._stepZoom(1, this.canvas.width / 2, this.canvas.height / 2);
        this.canvas.addEventListener('contextmenu', e => e.preventDefault());
        this.canvas.addEventListener('mousedown', e => this._onDown(e));
        this.canvas.addEventListener('wheel', e => this._onWheel(e), { passive: false });
        window.addEventListener('mousemove', e => this._onMove(e));
        window.addEventListener('mouseup', () => { this.painting = false; this.panning = false; });
        window.addEventListener('beforeunload', () => this._saveSessionNow());
        window.addEventListener('keydown', e => {
            if (!e.ctrlKey || e.altKey || e.metaKey || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName || '')) return;
            const key = e.key.toLowerCase();
            if (key === 'z') { e.preventDefault(); this._undo(); }
            if (key === 'y') { e.preventDefault(); this._redo(); }
        });
        this._setTool(this.tool);
    }

    _snapshot() { return { width: this.width, height: this.height, pixels: this.pixels.slice() }; }
    _sessionState() { return { version:2, updatedAt:Date.now(), width:this.width, height:this.height, pixels:this.pixels.slice(), zoomLevel:this.zoomLevel, panX:this.panX, panY:this.panY, showGrid:this.showGrid, selectedPalette:this.selectedPalette, tool:this.tool }; }
    _queueSessionSave() { if (this._sessionHydrating) return; clearTimeout(this._sessionSaveTimer); this._sessionSaveTimer = setTimeout(() => this._saveSessionNow(), 250); }
    _saveSessionNow(force = false) {
        if (this._sessionHydrating) { if (force) this._sessionDirty = true; return; }
        clearTimeout(this._sessionSaveTimer);
        const state = this._sessionState();
        this._sessionUpdatedAt = state.updatedAt;
        try { localStorage.setItem('gsuite.levelgen.session', JSON.stringify(state)); } catch {}
        this._saveSessionDatabase(state);
    }
    _applySession(state) {
        if (!state || !Number.isInteger(state.width) || !Number.isInteger(state.height) || state.width < 8 || state.width > 128 || state.height < 8 || state.height > 128) return false;
        const size = state.width * state.height;
        if (!Array.isArray(state.pixels) || state.pixels.length !== size || !state.pixels.every(color => typeof color === 'string' && /^rgb\(\d+,\d+,\d+\)$/.test(color))) return false;
        this.width = state.width; this.height = state.height; this.pixels = state.pixels.slice(); this._sessionUpdatedAt = Number.isFinite(state.updatedAt) ? state.updatedAt : 0;
        this.zoomLevel = Math.max(0, Math.min(this.zoomFactors.length - 1, Number.isInteger(state.zoomLevel) ? state.zoomLevel : 3)); this.zoom = this.zoomFactors[this.zoomLevel];
        this.panX = Number.isFinite(state.panX) ? state.panX : 20; this.panY = Number.isFinite(state.panY) ? state.panY : 20;
        this.showGrid = state.showGrid !== false; this.selectedPalette = Math.max(0, Math.min(this.palette.length - 1, Number.isInteger(state.selectedPalette) ? state.selectedPalette : 0)); this.tool = state.tool === 'fill' ? 'fill' : 'draw';
        this._q('widthInput').value = this.width; this._q('heightInput').value = this.height; this._q('gridBtn').style.opacity = this.showGrid ? '1' : '0.55'; this.bitmapDirty = true;
        return true;
    }
    _restoreSession() { try { return this._applySession(JSON.parse(localStorage.getItem('gsuite.levelgen.session') || 'null')); } catch { return false; } }
    _openSessionDatabase() {
        return new Promise(resolve => {
            if (!window.indexedDB) return resolve(null);
            const request = indexedDB.open('graalSuiteLevelGen', 1);
            request.onupgradeneeded = () => request.result.createObjectStore('sessions');
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => resolve(null);
        });
    }
    async _saveSessionDatabase(state) {
        const database = await this._openSessionDatabase();
        if (!database) return;
        try { const transaction = database.transaction('sessions', 'readwrite'); transaction.objectStore('sessions').put(state, 'active'); transaction.oncomplete = () => database.close(); transaction.onerror = () => database.close(); } catch { database.close(); }
    }
    async _restoreSessionDatabase() {
        const database = await this._openSessionDatabase();
        if (!database) { this._sessionHydrating = false; this._render(); return; }
        try {
            const request = database.transaction('sessions', 'readonly').objectStore('sessions').get('active');
            request.onsuccess = () => {
                if (!this._sessionDirty && request.result && (!this._sessionUpdatedAt || request.result.updatedAt >= this._sessionUpdatedAt)) this._applySession(request.result);
                database.close(); this._sessionHydrating = false; this._renderPalette(); this._setTool(this.tool); this._render(); if (this._sessionDirty) this._saveSessionNow();
            };
            request.onerror = () => { database.close(); this._sessionHydrating = false; this._render(); };
        } catch { database.close(); this._sessionHydrating = false; this._render(); }
    }
    _remember() { this.undoStack.push(this._snapshot()); if (this.undoStack.length > 100) this.undoStack.shift(); this.redoStack = []; }
    _restore(snapshot) { this.width = snapshot.width; this.height = snapshot.height; this.pixels = snapshot.pixels.slice(); this._q('widthInput').value = this.width; this._q('heightInput').value = this.height; this.bitmapDirty = true; this._render(); }
    _undo() { const snapshot = this.undoStack.pop(); if (!snapshot) return; this.redoStack.push(this._snapshot()); this._restore(snapshot); }
    _redo() { const snapshot = this.redoStack.pop(); if (!snapshot) return; this.undoStack.push(this._snapshot()); this._restore(snapshot); }

    _renderPalette() {
        const host = this._q('palette');
        host.innerHTML = '';
        this.palette.forEach((p, i) => {
            const b = document.createElement('button');
            b.title = p[0];
            b.style.cssText = `--levelgen-palette-color:${this._color(i)};width:28px;height:24px;background:var(--levelgen-palette-color);border:2px solid ${i === this.selectedPalette ? '#fff' : '#111'};box-shadow:inset 0 0 0 1px #555;cursor:pointer;`;
            b.onclick = () => { this.selectedPalette = i; this._renderPalette(); };
            host.appendChild(b);
        });
    }

    _resizeGrid(resetPixels) {
        if (resetPixels) this._remember();
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
        this._queueSessionSave();
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

    _fillAt(clientX, clientY) {
        const r = this.canvas.getBoundingClientRect(), cell = this._cellSize();
        const x = Math.floor((clientX - r.left - Math.round(this.panX)) / cell), y = Math.floor((clientY - r.top - Math.round(this.panY)) / cell);
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
        const replacement = this._color(this.selectedPalette), target = this.pixels[y * this.width + x];
        if (target === replacement) return;
        const stack = [y * this.width + x];
        while (stack.length) {
            const index = stack.pop();
            if (this.pixels[index] !== target) continue;
            this.pixels[index] = replacement;
            const px = index % this.width, py = Math.floor(index / this.width);
            if (px > 0) stack.push(index - 1);
            if (px + 1 < this.width) stack.push(index + 1);
            if (py > 0) stack.push(index - this.width);
            if (py + 1 < this.height) stack.push(index + this.width);
        }
        this.bitmapDirty = true;
        this._render();
    }

    _setTool(tool) {
        this.tool = tool;
        ['draw', 'fill'].forEach(name => {
            const button = this._q(`${name}Btn`);
            if (button) button.style.background = name === tool ? '#4169a8' : '#353535';
        });
        this.canvas.style.cursor = tool === 'fill' ? 'cell' : 'crosshair';
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
        this._remember();
        if (this.tool === 'fill') { this._fillAt(e.clientX, e.clientY); return; }
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
            this._remember();
            this.width = img.width;
            this.height = img.height;
            this._q('widthInput').value = this.width;
            this._q('heightInput').value = this.height;
            this.pixels = new Array(this.width * this.height);
            for (let i = 0; i < this.pixels.length; i++) this.pixels[i] = `rgb(${data[i * 4]},${data[i * 4 + 1]},${data[i * 4 + 2]})`;
            this.bitmapDirty = true;
            this._render();
            this._saveSessionNow(true);
        };
        img.onerror = () => done?.();
        img.src = url;
    }

    _showDocs() {
        this._q('docsModal').style.display = 'flex';
    }

    async _savePng() {
        const c = document.createElement('canvas');
        c.width = this.width;
        c.height = this.height;
        const ctx = c.getContext('2d');
        for (let y = 0; y < this.height; y++) for (let x = 0; x < this.width; x++) {
            ctx.fillStyle = this.pixels[y * this.width + x];
            ctx.fillRect(x, y, 1, 1);
        }
        const blob = await new Promise(resolve => c.toBlob(resolve, 'image/png'));
        if (!blob) return;
        if (typeof _isTauri !== 'undefined' && _isTauri && _tauri?.dialog?.save && _tauri?.fs?.writeFile) {
            try {
                const path = await _tauri.dialog.save({ defaultPath: 'map.png', title: 'Save Map Image', filters: [{ name: 'PNG Image', extensions: ['png'] }] });
                if (path) await _tauri.fs.writeFile(path, new Uint8Array(await blob.arrayBuffer()));
            } catch (error) {
                if (typeof showAlertDialog === 'function') showAlertDialog(`Could not save the map image: ${error.message}`);
                else console.error('Could not save the map image:', error);
            }
            return;
        }
        const a = document.createElement('a');
        const url = URL.createObjectURL(blob);
        a.href = url;
        a.download = 'map.png';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 0);
    }

    _showGenerate() {
        this._q('generateModal').style.display = 'flex';
        this._q('generateStatus').textContent = `${this.width} x ${this.height} map: ${Math.ceil(this.width / 64)} x ${Math.ceil(this.height / 64)} levels`;
    }

    async _chooseOutputFolder() {
        if (!(typeof _isTauri !== 'undefined' && _isTauri && _tauri?.dialog?.open)) return;
        const path = await _tauri.dialog.open({ directory: true, multiple: false, title: 'Generate World To' }).catch(() => null);
        if (path) this._q('outputFolderInput').value = path;
    }

    _levelName(col, row, cols, rows) {
        let letters = String.fromCharCode(97 + col % 26);
        if (cols > 26) letters = String.fromCharCode(97 + Math.floor(col / 26) % 26) + letters;
        return letters + String(row + 1).padStart(rows > 99 ? 3 : rows > 9 ? 2 : 1, '0');
    }

    _levelStem(prefix, name) { return prefix.endsWith('_') || prefix.endsWith('-') ? prefix + name : `${prefix}_${name}`; }

    _writeGeneratedLevel(tiles, links) {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        const lines = ['GLEVNW01'];
        for (let y = 0; y < 64; y++) {
            let row = `BOARD 0 ${y} 64 0 `;
            for (let x = 0; x < 64; x++) { const tile = tiles[y * 64 + x] || 0x7ff; row += alphabet[(tile >> 6) & 63] + alphabet[tile & 63]; }
            lines.push(row);
        }
        return lines.concat(links).join('\n') + '\n';
    }

    _paintTerrain() {
        const w = this.width, h = this.height, skip = 0xffff, grass = [24, 140, 24], mountain = [128, 0, 0], water = [0, 0, 255], trees = [181, 239, 189], sandOverlay = [196, 0, 0];
        const source = this.pixels.map(value => (value.match(/\d+/g) || [0, 0, 0]).map(Number));
        const working = source.map(c => c.slice());
        const world = new Array(w * h).fill(0x7ff);
        function nearColor(c, r, g, b) { return Math.abs(c[0] - r) + Math.abs(c[1] - g) + Math.abs(c[2] - b) < 32; }
        const near = nearColor;
        const is = (x, y, color) => x >= 0 && y >= 0 && x < w && y < h && near(source[y * w + x], ...color);
        const get = (x, y) => x >= 0 && y >= 0 && x < w && y < h ? world[y * w + x] : skip;
        const set = (x, y, tile) => { if (x >= 0 && y >= 0 && x < w && y < h && tile !== skip) world[y * w + x] = tile; };
        const pat = (width, tiles) => [width, tiles];
        const blit = ([pw, tiles], x, y) => { for (let i = 0; i < tiles.length; i++) set(x + i % pw, y + Math.floor(i / pw), tiles[i]); };
        const stampGrass = ([pw, tiles], x, y) => { for (let i = 0; i < tiles.length; i++) { if (tiles[i] === skip || get(x + i % pw, y + Math.floor(i / pw)) !== 0x7ff) return false; } blit([pw, tiles], x, y); return true; };
        const buildMask = target => {
            const mw = Math.floor((w + 5) / 6), mh = Math.floor((h + 5) / 6), mask = Array.from({ length: mh }, () => new Array(mw).fill(false));
            const cliffPass = target === mountain, valid = c => near(c, ...grass) || near(c, ...target) || cliffPass && near(c, 0, 106, 0);
            for (let x = 0; x < mw; x++) for (let y = 0; y < mh; y++) {
                const x0 = Math.min(x * 6 + 2, w - 1), x1 = Math.min(x * 6 + 7, w - 1), y0 = y * 6, y1 = Math.min(y * 6 + 5, h - 1);
                const a = working[y0 * w + x0], b = working[y0 * w + x1], c = working[y1 * w + x0], d = working[y1 * w + x1];
                mask[y][x] = (near(a, ...target) || near(b, ...target) || near(c, ...target) || near(d, ...target)) && valid(a) && valid(b) && valid(c) && valid(d);
                if (mask[y][x]) {
                    let fill = a; if (!near(a, ...target) && !near(b, ...target) && near(c, ...target)) fill = c;
                    const sx = cliffPass ? x0 : x * 6, ex = cliffPass ? x1 : Math.min(x * 6 + 5, w - 1);
                    for (let py = y * 6; py <= y1; py++) for (let px = sx; px <= ex; px++) working[py * w + px] = fill.slice();
                }
            }
            return mask;
        };
        const edge = (mask, patterns) => {
            const at = (x, y) => !!mask[y]?.[x];
            const mw = mask[0].length, mh = mask.length;
            for (let x = 0; x < mw; x++) for (let y = 0; y < mh; y++) {
                if (!at(x, y)) continue;
                let l = x > 0 && !at(x - 1, y), r = x + 1 < mw && !at(x + 1, y), nw = x > 0 && y > 0 && !at(x - 1, y - 1), n = y > 0 && !at(x, y - 1), ne = x + 1 < mw && y > 0 && !at(x + 1, y - 1), sw = x > 0 && y + 1 < mh && !at(x - 1, y + 1), s = y + 1 < mh && !at(x, y + 1), se = x + 1 < mw && y + 1 < mh && !at(x + 1, y + 1);
                if (nw && ne) n = true; if (nw && sw) l = true; if (sw && se) s = true; if (ne && se) r = true;
                const c = +l + +n + +s + +r, put = index => blit(patterns[index], x * 6, y * 6);
                if ((s && n) || (r && l) || l + n + se === 3 || s + l + ne === 3 || s + r + nw === 3 || r + n + sw === 3) put(0);
                else if (c === 2) put(l && n ? 5 : l && s ? 6 : s && r ? 7 : 8);
                else if (c === 1) put((se && n) || (r && nw) ? 8 : (sw && n) || (ne && l) ? 5 : (nw && s) || (se && l) ? 6 : (ne && s) || (r && sw) ? 7 : n ? 1 : l ? 2 : s ? 3 : 4);
                else { const d = +nw + +ne + +sw + +se; if (d === 2) { if (nw && se) put(13); else if (ne && sw) put(14); } else if (d === 1) put(nw ? 9 : sw ? 10 : se ? 11 : 12); else put(15); }
            }
        };
        const mountainEdges = [pat(1, [skip]), pat(6, [0x9e,0x9f,0x9e,0x9f,0x9e,0x9f,0x8f,0x8f,0x8f,0x8f,0x8f,0x8f,0xaf,0xae,0xaf,0xae,0xaf,0xae,0x12e,0x12f,0x12e,0x12f,0x12e,0x12f,0xbf,0xbe,0xbf,0xbe,0xbf,0xbe,0xa8,0xa8,0xa8,0xa8,0xa8,0xa8]), pat(6, [0xac0,0x8f,0xd2,0xe3,0xd4,0xd5,0xac0,0x8f,0xe2,0xd3,0xe4,0xd5,0xac0,0x8f,0xd2,0xe3,0xd4,0xd5,0xac0,0x8f,0xe2,0xd3,0xe4,0xd5,0xac0,0x8f,0xd2,0xe3,0xd4,0xd5,0xac0,0x8f,0xe2,0xd3,0xe4,0xd5]), pat(6, [0xa9,0xa9,0xa9,0xa9,0xa9,0xa9,0xb9,0xba,0xb9,0xba,0xb9,0xba,0xc9,0xca,0xc9,0xca,0xc9,0xca,0xf9,0xfa,0xf9,0xfa,0xf9,0xfa,0x8f,0x8f,0x8f,0x8f,0x8f,0x8f,0xad1,0xad0,0xad1,0xad0,0xad1,0xad0]), pat(6, [0x110,0x111,0x122,0x113,0x8f,0x82,0x110,0x121,0x112,0x123,0x8f,0x82,0x110,0x111,0x122,0x113,0x8f,0x82,0x110,0x121,0x112,0x123,0x8f,0x82,0x110,0x111,0x122,0x113,0x8f,0x82,0x110,0x121,0x112,0x123,0x8f,0x82]), pat(1, [skip]), pat(1, [skip]), pat(1, [skip]), pat(1, [skip]), pat(1, [skip]), pat(1, [skip]), pat(1, [skip]), pat(1, [skip]), pat(1, [skip]), pat(1, [skip])];
        const waterEdges = [pat(1, [skip]), pat(6, [0xa9,0xa9,0xa9,0xa9,0xa9,0xa9,0xb9,0xba,0xb9,0xba,0xb9,0xba,0xc9,0xca,0xc9,0xca,0xc9,0xca,0x22e,0x22f,0x22e,0x22f,0x22e,0x22f,0x23e,0x23f,0x23e,0x23f,0x23e,0x23f,0x24e,0x24f,0x24e,0x24f,0x24e,0x24f]), pat(6, [0x110,0x111,0x122,0x107,0x108,0x109,0x110,0x121,0x112,0x117,0x118,0x119,0x110,0x111,0x122,0x107,0x108,0x109,0x110,0x121,0x112,0x117,0x118,0x119,0x110,0x111,0x122,0x107,0x108,0x109,0x110,0x121,0x112,0x117,0x118,0x119]), pat(6, [0x10e,0x10f,0x10e,0x10f,0x10e,0x10f,0x11e,0x11f,0x11e,0x11f,0x11e,0x11f,0x98,0x99,0x98,0x99,0x98,0x99,0x12f,0x12e,0x12f,0x12e,0x12f,0x12e,0xbf,0xbe,0xbf,0xbe,0xbf,0xbe,0xa8,0xa8,0xa8,0xa8,0xa8,0xa8]), pat(6, [0x1cd,0x1ce,0x1cf,0x242,0x233,0xd5,0x1dd,0x1de,0x1df,0x232,0x243,0xd5,0x1cd,0x1ce,0x1cf,0x242,0x233,0xd5,0x1dd,0x1de,0x1df,0x232,0x243,0xd5,0x1cd,0x1ce,0x1cf,0x242,0x233,0xd5,0x1dd,0x1de,0x1df,0x232,0x243,0xd5]), pat(1, [skip]), pat(1, [skip]), pat(1, [skip]), pat(1, [skip]), pat(1, [skip]), pat(1, [skip]), pat(1, [skip]), pat(1, [skip]), pat(1, [skip]), pat(1, [skip])];
        mountainEdges[5] = pat(6, [skip,skip,skip,skip,skip,0xc6,skip,skip,skip,skip,0xf0,0x8f,skip,skip,skip,0xf0,0x8f,0xf1,skip,skip,0xf0,0x8f,0xf1,0xf2,skip,0xf0,0x8f,0xf1,0xf2,0xf3,0xf0,0x8f,0xf1,0xf2,0xf3,0xf4]);
        mountainEdges[6] = pat(6, [0xac1,0x8f,0xac2,0x180,0xb8,0xf7,skip,0xac1,0x8f,0xac2,0x191,0xb8,skip,skip,0xac1,0x8f,0xac2,0x180,skip,skip,skip,0xac1,0x8f,0xac2,skip,skip,skip,skip,0xac1,0x8f,skip,skip,skip,skip,skip,0xac1]);
        mountainEdges[7] = pat(6, [0xfc,0xbb,0xef,0xac3,0x8f,0x92,0xbb,0xfe,0xac3,0x8f,0x92,skip,0xef,0xac3,0x8f,0x92,skip,skip,0xac3,0x8f,0x92,skip,skip,skip,0x8f,0x92,skip,skip,skip,skip,0x92,skip,skip,skip,skip,skip]);
        mountainEdges[8] = pat(6, [0xcd,skip,skip,skip,skip,skip,0x8f,0x105,skip,skip,skip,skip,0x104,0x8f,0x105,skip,skip,skip,0x103,0x104,0x8f,0x105,skip,skip,0x102,0x103,0x104,0x8f,0x105,skip,0x101,0x102,0x103,0x104,0x8f,0x105]);
        waterEdges[5] = pat(6, [skip,skip,skip,skip,skip,0xec,skip,skip,skip,skip,0xec,0xfc,skip,skip,skip,0xec,0xfc,0xbb,skip,skip,0xec,0xfc,0xbb,0xfe,skip,0xec,0xfc,0xbb,0xef,0x126,0xec,0xfc,0xbb,0xfe,0x126,0x127]);
        waterEdges[6] = pat(6, [0x100,0x101,0x102,0x103,0x131,0x132,skip,0x100,0x101,0x102,0x103,0x131,skip,skip,0x100,0x101,0x102,0x103,skip,skip,skip,0x100,0x101,0x102,skip,skip,skip,skip,0x100,0x101,skip,skip,skip,skip,skip,0x100]);
        waterEdges[7] = pat(6, [0x3cd,0x3bd,0xf2,0xf3,0xf4,0xf5,0x3bd,0xf2,0xf3,0xf4,0xf5,skip,0xf2,0xf3,0xf4,0xf5,skip,skip,0xf3,0xf4,0xf5,skip,skip,skip,0xf4,0xf5,skip,skip,skip,skip,0xf5,skip,skip,skip,skip,skip]);
        waterEdges[8] = pat(6, [0xe7,skip,skip,skip,skip,skip,0xf7,0xe7,skip,skip,skip,skip,0xb8,0xf7,0xe7,skip,skip,skip,0x191,0xb8,0xf7,0xe7,skip,skip,0x236,0x180,0xb8,0xf7,0xe7,skip,0x235,0x236,0x191,0xb8,0xf7,0xe7]);
        waterEdges[15] = pat(6, new Array(36).fill(0x142));
        mountainEdges[9] = pat(6, [0x8f,0xf1,0xf2,0xf3,0xf4,0xf5,0xf1,0xf2,0xf3,0xf4,0xf5,skip,0xf2,0xf3,0xf4,0xf5,skip,skip,0xf3,0xf4,0xf5,skip,skip,skip,0xf4,0xf5,skip,skip,skip,skip,0xf5,skip,skip,skip,skip,skip]);
        mountainEdges[10] = pat(6, [0xe7,skip,skip,skip,skip,skip,0xf7,0xe7,skip,skip,skip,skip,0xb8,0xf7,0xe7,skip,skip,skip,0x191,0xb8,0xf7,0xe7,skip,skip,0xac2,0x180,0xb8,0xf7,0xe7,skip,0x8f,0xac2,0x191,0xb8,0xf7,0xe7]);
        mountainEdges[11] = pat(6, [skip,skip,skip,skip,skip,0xec,skip,skip,skip,skip,0xec,0xfc,skip,skip,skip,0xec,0xfc,0xbb,skip,skip,0xec,0xfc,0xbb,0xfe,skip,0xec,0xfc,0xbb,0xef,0xac3,0xec,0xfc,0xbb,0xfe,0xac3,0x8f]);
        mountainEdges[12] = pat(6, [0x100,0x101,0x102,0x103,0x104,0x8f,skip,0x100,0x101,0x102,0x103,0x104,skip,skip,0x100,0x101,0x102,0x103,skip,skip,skip,0x100,0x101,0x102,skip,skip,skip,skip,0x100,0x101,skip,skip,skip,skip,skip,0x100]);
        mountainEdges[13] = pat(6, [0x8f,0xf1,0xf2,0xf3,0xf4,0xae0,0xf1,0xf2,0xf3,0xf4,0xae0,0xfc,0xf2,0xf3,0xf4,0xae0,0xfc,0xbb,0xf3,0xf4,0xae0,0xfc,0xbb,0xfe,0xf4,0xae0,0xfc,0xbb,0xef,0xac3,0xae0,0xfc,0xbb,0xfe,0xac3,0x8f]);
        mountainEdges[14] = pat(6, [0xae1,0x101,0x102,0x103,0x104,0x8f,0xf7,0xae1,0x101,0x102,0x103,0x104,0xb8,0xf7,0xae1,0x101,0x102,0x103,0x191,0xb8,0xf7,0xae1,0x101,0x102,0xac2,0x180,0xb8,0xf7,0xae1,0x101,0x8f,0xac2,0x191,0xb8,0xf7,0xae1]);
        mountainEdges[15] = pat(1, [skip]);
        waterEdges[9] = pat(6, [0xfc,0xbb,0xfe,0x126,0x127,0x128,0xbb,0xfe,0x126,0x127,0x128,0x142,0xfe,0x126,0x127,0x128,0x142,0x142,0x126,0x127,0x128,0x142,0x142,0x142,0x127,0x128,0x142,0x142,0x142,0x142,0x128,0x142,0x142,0x142,0x142,0x142]);
        waterEdges[10] = pat(6, [0x133,0x142,0x142,0x142,0x142,0x142,0x132,0x133,0x142,0x142,0x142,0x142,0x131,0x132,0x133,0x142,0x142,0x142,0x103,0x131,0x132,0x133,0x142,0x142,0x102,0x103,0x131,0x132,0x133,0x142,0x101,0x102,0x103,0x131,0x132,0x133]);
        waterEdges[11] = pat(6, [0x142,0x142,0x142,0x142,0x142,0x3cc,0x142,0x142,0x142,0x142,0x3cc,0x3cd,0x142,0x142,0x142,0x3cc,0x3cd,0x3bd,0x142,0x142,0x3cc,0x3cd,0x3bd,0xf2,0x142,0x3cc,0x3cd,0x3bd,0xf2,0xf3,0x3cc,0x3cd,0x3bd,0xf2,0xf3,0xf4]);
        waterEdges[12] = pat(6, [0x234,0x235,0x236,0x191,0xb8,0xf7,0x142,0x234,0x235,0x236,0x191,0xb8,0x142,0x142,0x234,0x235,0x236,0x191,0x142,0x142,0x142,0x234,0x235,0x236,0x142,0x142,0x142,0x142,0x234,0x235,0x142,0x142,0x142,0x142,0x142,0x234]);
        waterEdges[13] = pat(6, [0xfc,0xbb,0xfe,0x126,0x127,0x721,0xbb,0xfe,0x126,0x127,0x721,0x3cd,0xfe,0x126,0x127,0x721,0x3cd,0x3bd,0x126,0x127,0x721,0x3cd,0x3bd,0xf2,0x127,0x721,0x3cd,0x3bd,0xf2,0xf3,0x721,0x3cd,0x3bd,0xf2,0xf3,0xf4]);
        waterEdges[14] = pat(6, [0x720,0x235,0x236,0x191,0xb8,0xf7,0x132,0x720,0x235,0x236,0x191,0xb8,0x131,0x132,0x720,0x235,0x236,0x191,0x103,0x131,0x132,0x720,0x235,0x236,0x102,0x103,0x131,0x132,0x720,0x235,0x101,0x102,0x103,0x131,0x132,0x720]);
         edge(buildMask(mountain), mountainEdges);
        const renderDetail = (matches, patterns, interior) => {
            const missing = (x, y) => x >= 0 && y >= 0 && x < w && y < h && !matches(source[y * w + x]);
            for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) {
                const c = source[y * w + x]; if (!matches(c)) continue;
                const stamp = index => set(x - 2, y, patterns[index]);
                let l = +missing(x - 1, y), r = +missing(x + 1, y), nw = +missing(x - 1, y - 1), n = +missing(x, y - 1), ne = +missing(x + 1, y - 1), sw = +missing(x - 1, y + 1), s = +missing(x, y + 1), se = +missing(x + 1, y + 1);
                if (nw && ne) n = 1; if (nw && sw) l = 1; if (sw && se) s = 1; if (ne && se) r = 1;
                const count = l + n + s + r;
                if ((n && s) || (l && r) || l + n + se === 3 || l + s + ne === 3 || r + s + nw === 3 || r + n + sw === 3) stamp(0);
                else if (count === 2) stamp(l && n ? 1 : l && s ? 2 : s && r ? 3 : 4);
                else if (count === 1) {
                    if ((n && se) || (r && nw)) stamp(4); else if ((n && sw) || (l && ne)) stamp(1); else if ((s && nw) || (l && se)) stamp(2); else if ((s && ne) || (r && sw)) stamp(3);
                    else if (n) stamp(typeof interior === 'function' ? interior(c, x, y, 5, 6) : 5); else if (l) stamp(7); else if (s) stamp(typeof interior === 'function' ? interior(c, x, y, 8, 9) : 8); else stamp(10);
                } else {
                    const diagonal = nw + ne + sw + se;
                    if (diagonal === 2) { if (nw && se) stamp(15); else if (ne && sw) stamp(16); }
                    else if (diagonal === 1) stamp(nw ? 11 : sw ? 12 : se ? 13 : 14);
                    else stamp(typeof interior === 'function' ? interior(c, x, y) : interior);
                }
            }
        };
        const sand = [skip,0x176,0x188,0x169,0x177,0x166,0x167,0x1a7,0x178,0x179,0x197,0x186,0x189,0x168,0x187,0xfe9,0xff9,0xf,0x8,0x12d,0xaa,0xab,0x12d];
        const puddle = [skip,0x176,0x188,0x169,0x177,0x1c4,0x1c5,0x1d4,0x1f6,0x1f7,0x1bb,0x1c6,0x196,0x1b7,0x1e7,0xfe9,0xff9,0x1f4,0x18e];
        for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) if (near(source[y * w + x], 255, 0, 0)) set(x - 2, y, 0x10);
        renderDetail(c => near(c, 150, 110, 0) || near(c, 113, 82, 0) || near(c, 83, 61, 0), sand, (c, x, y, a, b) => a === undefined ? near(c, 150, 110, 0) ? 19 + (x & 1) + ((y & 1) << 1) : near(c, 113, 82, 0) ? 18 : 17 : (x & 1) ? b : a);
        renderDetail(c => near(c, 0, 255, 255) || near(c, 0, 179, 179), puddle, (c, x, y, a, b) => a === undefined ? near(c, 0, 255, 255) ? 18 : 17 : (x & 1) ? b : a);
        for (let x = 0; x + 1 < w; x += 2) for (let y = 0; y + 1 < h; y += 2) {
            const c = source[y * w + x], type = near(c, 0, 106, 0) ? [0,106,0,[0x1a4,0x1a5,0x1b4,0x1b5]] : near(c, 0, 66, 0) ? [0,66,0,[0x2,0x3,0x12,0x13]] : null;
            if (!type) continue;
            let valid = true;
            for (let py = 0; py < 2; py++) for (let px = 0; px < 2; px++) { const q = source[(y + py) * w + x + px]; if (!near(q, ...grass) && !near(q, type[0], type[1], type[2])) valid = false; }
            if (valid) stampGrass(pat(2, type[3]), x - 2, y);
        }
         edge(buildMask(water), waterEdges);
        const overlay = target => {
            const mw = Math.floor((w + 5) / 6), mh = Math.floor((h + 5) / 6), mask = Array.from({ length: mh }, () => new Array(mw).fill(false));
            for (let x = 0; x < mw; x++) for (let y = 0; y < mh; y++) {
                const half = y & 1 ? -1 : 0, bx = x * 6 - 1 + half * 3, by = y * 6;
                const cx = bx + 6, cy = by + 2;
                if (cx < 0 || cx >= w || cy < 0 || cy >= h || !near(working[cy * w + cx], ...target)) continue;
                let foreign = false;
                for (let py = 0; py < 10 && !foreign; py++) for (let px = 0; px < 8; px++) { const sx = bx + px + 2, sy = by + py; if (sx < 0 || sx >= w || sy < 0 || sy >= h) continue; const c = working[sy * w + sx]; if (!near(c, ...grass) && !near(c, ...target)) { foreign = true; break; } }
                mask[y][x] = !foreign;
            }
            return mask;
        };
        const renderTrees = mask => {
            const at = (x, y) => !!mask[y]?.[x], base = pat(6, [0x19,0x1a,0x1b,0x1c,0x1d,0x1e,0x29,0x2a,0x2b,0x2c,0x2d,0x2e,0x39,0x3a,0x3b,0x3c,0x3d,0x3e,0x49,0x4a,0x4b,0x4c,0x4d,0x4e,0x59,0x5a,0x5b,0x5c,0x5d,0x5e]);
            const urJoined = pat(3, [0x0c,0xc2,0xc3]), urOpen = pat(3, [0x0c,0x0d,0x0e]), urCorner = pat(1, [0xd1,0xe1]), urGap = pat(1, [0x1f,0x2f]), rightEdge = pat(1, [0x3f,0x4f,0x5f]), rightCorner = pat(1, [0x6f,0x7f]), rightWall = pat(2, [0x6d,0x6e,0x7d,0x7e,0x8d,0x8e,0x9d,skip]), rightJoin = pat(1, [0x6c]);
            const ulJoined = pat(3, [0xc0,0xc1,0x0b]), ulOpen = pat(3, [0x09,0x0a,0x0b]), ulCorner = pat(1, [0xd0,0xe0]), ulGap = pat(1, [0x18,0x28]), leftEdge = pat(1, [0x38,0x48,0x58]), leftCorner = pat(1, [0x68,0x78]), leftWall = pat(2, [0x69,0x6a,0x79,0x7a,0x89,0x8a,skip,0x9a]), leftJoin = pat(1, [0x6b]), centerWall = pat(2, [0x6b,0x6c,0x7b,0x7c,0x8b,0x8c,0x9b,0x9c]);
            for (let x = 0; x < mask[0].length; x++) for (let y = 0; y < mask.length; y++) {
                if (!at(x, y)) continue;
                const half = y & 1 ? -1 : 0, left = at(x - 1, y), right = at(x + 1, y), ul = at(x + half, y - 1), ur = at(x + half + 1, y - 1), dl = at(x + half, y + 1), dr = at(x + half + 1, y + 1), bx = x * 6 - 1 + half * 3, by = y * 6;
                blit(base, bx + 1, by + 1); blit(ur ? urJoined : urOpen, bx + 4, by);
                if (ur && !right) blit(urCorner, bx + 7, by + 1); if (!ur && !right) blit(urGap, bx + 7, by + 1);
                if (!right) { blit(rightEdge, bx + 7, by + 3); if (!dr) blit(rightCorner, bx + 7, by + 6); }
                if (!dr) blit(rightWall, bx + 5, by + 6); if (dl && !dr) blit(rightJoin, bx + 4, by + 6);
                blit(ul ? ulJoined : ulOpen, bx + 1, by);
                if (ul && !left) blit(ulCorner, bx, by + 1); if (!ul && !left) blit(ulGap, bx, by + 1);
                if (!left) { blit(leftEdge, bx, by + 3); if (!dl) blit(leftCorner, bx, by + 6); }
                if (!dl) blit(leftWall, bx + 1, by + 6); if (!dl && dr) blit(leftJoin, bx + 3, by + 6); if (!dl && !dr) blit(centerWall, bx + 3, by + 6);
            }
        };
        renderTrees(overlay(trees));
        const renderSandOverlay = mask => {
            const at = (x, y) => !!mask[y]?.[x], base = pat(6, [0x491,0x492,0x493,0x494,0x495,0x496,0x4a1,0x4a2,0x4a3,0x4a4,0x4a5,0x4a6,0x4b1,0x4b2,0x4b3,0x4b4,0x4b5,0x4b6,0x4c1,0x4c2,0x4c3,0x4c4,0x4c5,0x4c6,0x4d1,0x4d2,0x4d3,0x4d4,0x4d5,0x4d6]);
            const urJoined = pat(3, [0x484,0xe0e,0xe0f]), urOpen = pat(3, [0x484,0x485,0x486]), urCorner = pat(1, [0xe1f,0xe2f]), urGap = pat(1, [0x497,0x4a7]), rightEdge = pat(1, [0x4b7,0x4c7,0x4d7]), rightCorner = pat(1, [0x6f,0x7f]), rightWall = pat(2, [0x4e5,0x4e6,0x7d,0x7e,0x8d,0x8e,0x9d,skip]), rightJoin = pat(1, [0x4e4]);
            const ulJoined = pat(3, [0xe0c,0xe0d,0x483]), ulOpen = pat(3, [0x481,0x482,0x483]), ulCorner = pat(1, [0xe1e,0xe2e]), ulGap = pat(1, [0x490,0x4a0]), leftEdge = pat(1, [0x4b0,0x4c0,0x4d0]), leftCorner = pat(1, [0x68,0x78]), leftWall = pat(2, [0x4e1,0x4e2,0x79,0x7a,0x89,0x8a,skip,0x9a]), leftJoin = pat(1, [0x4e3]), centerWall = pat(2, [0x4e3,0x4e4,0x5b5,0x5b6,0x8b,0x8c,0x9b,0x9c]);
            for (let x = 0; x < mask[0].length; x++) for (let y = 0; y < mask.length; y++) {
                if (!at(x, y)) continue;
                const half = y & 1 ? -1 : 0, left = at(x - 1, y), right = at(x + 1, y), ul = at(x + half, y - 1), ur = at(x + half + 1, y - 1), dl = at(x + half, y + 1), dr = at(x + half + 1, y + 1), bx = x * 6 - 1 + half * 3, by = y * 6;
                blit(base, bx + 1, by + 1); blit(ur ? urJoined : urOpen, bx + 4, by);
                if (ur && !right) blit(urCorner, bx + 7, by + 1); if (!ur && !right) blit(urGap, bx + 7, by + 1);
                if (!right) { blit(rightEdge, bx + 7, by + 3); if (!dr) blit(rightCorner, bx + 7, by + 6); }
                if (!dr) blit(rightWall, bx + 5, by + 6); if (dl && !dr) blit(rightJoin, bx + 4, by + 6);
                blit(ul ? ulJoined : ulOpen, bx + 1, by);
                if (ul && !left) blit(ulCorner, bx, by + 1); if (!ul && !left) blit(ulGap, bx, by + 1);
                if (!left) { blit(leftEdge, bx, by + 3); if (!dl) blit(leftCorner, bx, by + 6); }
                if (!dl) blit(leftWall, bx + 1, by + 6); if (!dl && dr) blit(leftJoin, bx + 3, by + 6); if (!dl && !dr) blit(centerWall, bx + 3, by + 6);
            }
        };
        renderSandOverlay(overlay(sandOverlay));
        const cols = w / 64, rows = h / 64, levels = Array.from({ length: cols * rows }, () => new Array(4096).fill(0x7ff));
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) levels[Math.floor(y / 64) * cols + Math.floor(x / 64)][(y % 64) * 64 + x % 64] = world[y * w + x];
        return levels;
    }

    async _generateWorld() {
        const status = this._q('generateStatus');
        if (!(typeof _isTauri !== 'undefined' && _isTauri && _tauri?.fs?.writeTextFile)) { status.textContent = 'World generation requires the desktop app.'; return; }
        if (this.width % 64 || this.height % 64) { status.textContent = 'Map width and height must both be multiples of 64.'; return; }
        const output = this._q('outputFolderInput').value.trim(), prefix = this._q('prefixInput').value.trim();
        if (!output || !prefix) { status.textContent = 'Choose an output folder and filename prefix.'; return; }
        const cols = this.width / 64, rows = this.height / 64, linksEnabled = this._q('linksInput').checked, button = this._q('confirmGenerateBtn');
        button.disabled = true; status.textContent = 'Generating world...';
        try {
            const levels = this._paintTerrain();
            for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
                const name = this._levelName(col, row, cols, rows), links = [];
                if (linksEnabled) {
                    if (col > 0) links.push(`LINK ${this._levelStem(prefix, this._levelName(col - 1, row, cols, rows))}.nw 0 0 1 64 61 playery`);
                    if (col + 1 < cols) links.push(`LINK ${this._levelStem(prefix, this._levelName(col + 1, row, cols, rows))}.nw 63 0 1 64 0 playery`);
                    if (row > 0) links.push(`LINK ${this._levelStem(prefix, this._levelName(col, row - 1, cols, rows))}.nw 0 0 64 1 playerx 61`);
                    if (row + 1 < rows) links.push(`LINK ${this._levelStem(prefix, this._levelName(col, row + 1, cols, rows))}.nw 0 63 64 1 playerx 0`);
                }
                await _tauri.fs.writeTextFile(`${output}/${this._levelStem(prefix, name)}.nw`, this._writeGeneratedLevel(levels[row * cols + col], links));
            }
            const gmapName = [...prefix].filter(c => /[a-z0-9]/i.test(c)).join('') || 'world';
            const names = Array.from({ length: rows }, (_, row) => Array.from({ length: cols }, (_, col) => `"${this._levelStem(prefix, this._levelName(col, row, cols, rows))}.nw"`).join(','));
            await _tauri.fs.writeTextFile(`${output}/${gmapName}.gmap`, `GRMAP001\r\nWIDTH ${cols}\r\nHEIGHT ${rows}\r\nLEVELNAMES\r\n${names.join('\r\n')}\r\nLEVELNAMESEND\r\n`);
            status.textContent = `Generated ${cols * rows} level${cols * rows === 1 ? '' : 's'} and ${gmapName}.gmap.`;
        } catch (error) { status.textContent = `Could not generate world: ${error.message || error}`; }
        finally { button.disabled = false; }
    }

    static _ensureContent() {
        if (LevelGenEditor._content) return;
        const wrapper = document.createElement('div');
        wrapper.className = 'main-container';
        wrapper.style.cssText = 'display:flex;flex-direction:column;width:100%;height:100%;min-width:0;min-height:0;background:#1e1e1e;color:#ddd;font-family:chevyray,monospace;';
        const btn = 'height:24px;background:#353535;border:1px solid #0a0a0a;border-top-color:#404040;border-left-color:#404040;color:#e0e0e0;padding:3px 10px;font-family:chevyray,monospace;font-size:11px;white-space:nowrap;flex:0 0 auto;';
        const spinBtn = 'width:14px;height:10px;border:0;background:transparent;color:#ddd;font-size:8px;line-height:8px;padding:0;cursor:pointer;';
        const spin = name => `<span style="display:inline-flex;align-items:center;width:52px;height:22px;background:#1a1a1a;border:1px solid #444;box-sizing:border-box;flex:0 0 52px;"><input data-lg="${name}Input" type="text" value="32" style="width:34px;height:20px;background:transparent;color:#ddd;border:0;padding:2px 4px;font-family:monospace;box-sizing:border-box;outline:none;"><span style="display:flex;flex-direction:column;width:14px;height:20px;"><button data-lg="${name}Inc" style="${spinBtn}">&#9652;</button><button data-lg="${name}Dec" style="${spinBtn}">&#9662;</button></span></span>`;
        wrapper.innerHTML = `
        <div style="display:flex;align-items:center;gap:6px;padding:6px 12px;background:#2b2b2b;border-bottom:1px solid #111;flex:0 0 auto;min-width:0;white-space:nowrap;overflow-x:auto;">
            <span style="white-space:nowrap;flex:0 0 auto;">Map size:</span><span style="display:inline-flex;align-items:center;gap:4px;flex:0 0 auto;">${spin('width')}<span>x</span>${spin('height')}</span>
            <button data-lg="newBtn" style="${btn}">New grid</button><button data-lg="exampleBtn" style="${btn}">Example</button><button data-lg="loadBtn" style="${btn}">Load map...</button><button data-lg="saveBtn" style="${btn}">Save map...</button><button data-lg="generateBtn" style="${btn}">Generate World</button><button data-lg="gridBtn" style="${btn}">Grid</button><button data-lg="docsBtn" style="${btn}">Info</button>
            <span style="flex:1 1 auto;min-width:12px;"></span><span data-lg="levelsLabel" style="color:#aaa;white-space:nowrap;flex:0 0 auto;">Levels: 1 x 1</span>
            <button data-lg="zoomOutBtn" style="${btn}">Zoom -</button><button data-lg="zoomInBtn" style="${btn}">Zoom +</button><span data-lg="zoomLabel" style="color:#aaa;white-space:nowrap;flex:0 0 auto;">Zoom: 100%</span>
            <input data-lg="fileInput" type="file" accept=".png,.gif" style="display:none;">
        </div>
        <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:#252525;border-bottom:1px solid #111;flex-shrink:0;"><span>Palette</span><div data-lg="palette" style="display:flex;gap:4px;"></div><span style="height:22px;border-left:1px solid #111;"></span><button data-lg="drawBtn" title="Draw" style="${btn};width:28px;padding:0;"><i class="fas fa-pencil"></i></button><button data-lg="fillBtn" title="Flood Fill" style="${btn};width:28px;padding:0;"><i class="fas fa-fill"></i></button></div>
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
        </div>
        <div data-lg="generateModal" style="display:none;position:fixed;inset:0;background:transparent;z-index:9100;align-items:center;justify-content:center;">
            <div style="width:min(520px,92vw);background:#1e1e1e;border:1px solid #3a3a3a;color:#ddd;box-shadow:0 8px 32px rgba(0,0,0,0.8);">
                <div style="display:flex;align-items:center;justify-content:space-between;background:#2a2a2a;border-bottom:1px solid #111;padding:8px 12px;"><span>Generate World</span><button data-lg="closeGenerateBtn" style="${btn}">Close</button></div>
                <div style="padding:12px;display:grid;gap:10px;font-family:chevyray,monospace;font-size:12px;">
                    <label style="display:grid;grid-template-columns:92px minmax(0,1fr) auto;gap:6px;align-items:center;"><span>Output folder:</span><input data-lg="outputFolderInput" style="min-width:0;background:#111;color:#ddd;border:1px solid #444;padding:5px;font:inherit;"><button data-lg="browseOutputBtn" style="${btn}">Browse</button></label>
                    <label style="display:grid;grid-template-columns:92px minmax(0,1fr);gap:6px;align-items:center;"><span>Filename prefix:</span><input data-lg="prefixInput" value="myworld_" style="min-width:0;background:#111;color:#ddd;border:1px solid #444;padding:5px;font:inherit;"></label>
                    <label style="display:flex;align-items:center;gap:6px;"><input data-lg="linksInput" type="checkbox" checked> Create level links</label>
                    <div data-lg="generateStatus" style="color:#aaa;min-height:16px;"></div>
                    <div style="display:flex;justify-content:flex-end;"><button data-lg="confirmGenerateBtn" style="${btn}">Generate World</button></div>
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
