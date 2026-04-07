class SetshapeEditor {
    constructor(root) {
        this.root = root;
        this.tileSize = 16;
        this.tileMap = new Array(64 * 64).fill(0);
        this.history = [new Array(64 * 64).fill(0)]; this.historyIndex = 0;
        this.selectedBrush = 22;
        this.cutMode = false;
        this.backgroundImage = null;
        this.currentImageFile = null;
        this.offsetX = 0; this.offsetY = 0;
        this.isDragging = false; this.lastDragX = 0; this.lastDragY = 0;
        this.zoomLevel = 1.0;
        this.selectionStart = null; this.selectionEnd = null; this.currentSelection = null;
        this.isDrawing = false; this.drawMode = 0;
        this.toolMode = 'pencil';
        this.snapToGrid = false;
        this._pinchDist = 0;
        this.tileTypes = [
            {id:0,color:'rgb(0,0,0)',desc:''},{id:1,color:'rgb(0,0,0)',desc:''},{id:2,color:'rgb(194,35,35)',desc:'Hurt'},
            {id:3,color:'rgb(156,107,66)',desc:'Chair'},{id:4,color:'rgb(189,189,255)',desc:'Bed Upper'},{id:5,color:'rgb(223,223,255)',desc:'Bed Lower'},
            {id:6,color:'rgb(41,123,57)',desc:'Swamp'},{id:7,color:'rgb(99,0,0)',desc:'Lava Swamp'},{id:8,color:'rgb(90,132,198)',desc:'Shallow Water'},
            {id:9,color:'rgb(0,0,0)',desc:''},{id:10,color:'rgb(0,0,0)',desc:''},{id:11,color:'rgb(57,99,165)',desc:'Water'},
            {id:12,color:'rgb(255,0,0)',desc:'Lava'},{id:13,color:'rgb(0,0,0)',desc:''},{id:14,color:'rgb(0,0,0)',desc:''},
            {id:15,color:'rgb(0,0,0)',desc:''},{id:16,color:'rgb(0,0,0)',desc:''},{id:17,color:'rgb(0,0,0)',desc:''},
            {id:18,color:'rgb(0,0,0)',desc:''},{id:19,color:'rgb(0,0,0)',desc:''},{id:20,color:'rgb(99,82,49)',desc:'Throw-through'},
            {id:21,color:'rgb(123,189,148)',desc:'Jumping'},{id:22,color:'rgb(128,0,128)',desc:'Blocking'}
        ];
        this.canvas = root.querySelector('._ss2canvas');
        this.ctx = this.canvas.getContext('2d');
        this._init();
    }

    _q(id) { return this.root.querySelector(`[data-ss2="${id}"]`); }

    _init() {
        const picker = this._q('picker');
        this.tileTypes.forEach(t => {
            if (!t.desc) return;
            const sw = document.createElement('div');
            sw.style.cssText = `width:28px;height:28px;border:1px solid #000;display:flex;align-items:center;justify-content:center;color:white;font-family:'Courier New',monospace;font-weight:bold;font-size:11px;cursor:pointer;background:${t.color};`;
            sw.textContent = t.id; sw.title = t.desc; sw.dataset.tid = t.id;
            sw.onclick = () => this._selectBrush(t.id);
            picker.appendChild(sw);
        });
        this._selectBrush(22);
        this._bindEvents();
        this._updateToolBtns();
        this._resizeCanvas();
        this._render();
    }

    _selectBrush(id) {
        this.selectedBrush = id;
        this._q('picker').querySelectorAll('div[data-tid]').forEach(s => s.style.outline = parseInt(s.dataset.tid) === id ? '2px solid #fff' : '');
    }

    _bindEvents() {
        this._q('generateBtn').onclick = () => this._generate();
        this._q('clearBtn').onclick = () => { this._pushHistory(); this.tileMap.fill(0); this._render(); };
        this._q('importBtn').onclick = () => this._showImport();
        this._q('cutBtn').onclick = () => this._toggleCut();
        this._q('snapBtn').onclick = () => this._toggleSnap();
        const fi = this._q('fileInput');
        this._q('loadImageBtn').onclick = () => fi.click();
        fi.onchange = e => this._loadImage(e);

        const container = this._q('container');
        container.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
        container.addEventListener('drop', e => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) { this.currentImageFile = file; const r = new FileReader(); r.onload = ev => { const img = new Image(); img.onload = () => { this.backgroundImage = img; this._render(); }; img.src = ev.target.result; }; r.readAsDataURL(file); }
        });
        this.canvas.addEventListener('mousedown', e => this._onDown(e));
        this.canvas.addEventListener('mousemove', e => this._onMove(e));
        this.canvas.addEventListener('mouseup', e => this._onUp(e));
        this.canvas.addEventListener('mouseleave', () => { this.isDrawing = false; this.drawMode = 0; this.isDragging = false; });
        this.canvas.addEventListener('wheel', e => this._onWheel(e), { passive: false });
        this.canvas.addEventListener('contextmenu', e => e.preventDefault());
        this.canvas.addEventListener('touchstart', e => this._onTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', e => this._onTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', e => this._onTouchEnd(e), { passive: false });
        this.canvas.style.touchAction = 'none';

        this._q('closeOutputBtn').onclick = () => this._q('outputModal').style.display = 'none';
        this._q('copyOutputBtn').onclick = () => this._copy(this._q('outputText'), this._q('copyOutputBtn'));
        this._q('indentSlider').oninput = () => { this._q('indentValue').textContent = this._q('indentSlider').value; this._updateOutput(); };
        this._q('gs1Checkbox').onchange = () => this._updateOutput();
        this._q('closeSetimgpartBtn').onclick = () => this._q('setimgpartModal').style.display = 'none';
        this._q('copySetimgpartBtn').onclick = () => this._copy(this._q('setimgpartText'), this._q('copySetimgpartBtn'));
        this._q('closeImportBtn').onclick = () => this._q('importModal').style.display = 'none';
        this._q('importConfirmBtn').onclick = () => this._importSetshape();

        new ResizeObserver(() => { this._resizeCanvas(); this._render(); }).observe(container);
        document.addEventListener('keydown', e => {
            const dlg = document.getElementById('_ss2Dialog');
            if (!dlg || dlg.style.display === 'none') return;
            if (e.ctrlKey && !e.shiftKey && e.key === 'z') { e.preventDefault(); this._undo(); }
            else if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) { e.preventDefault(); this._redo(); }
        });
    }

    _copy(el, btn) {
        const text = el.tagName === 'TEXTAREA' ? el.value : el.textContent;
        if (navigator.clipboard) { navigator.clipboard.writeText(text); }
        else { const ta = Object.assign(document.createElement('textarea'), {value:text}); ta.style.cssText='position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); }
        const orig = btn.textContent; btn.textContent = 'Copied!'; setTimeout(() => btn.textContent = orig, 1500);
    }

    _pushHistory() {
        this.history = this.history.slice(0, this.historyIndex + 1);
        this.history.push(this.tileMap.slice());
        this.historyIndex = this.history.length - 1;
        if (this.history.length > 50) { this.history.shift(); this.historyIndex--; }
    }
    _undo() {
        if (this.historyIndex <= 0) return;
        this.historyIndex--;
        this.tileMap = this.history[this.historyIndex].slice();
        this._render();
    }
    _redo() {
        if (this.historyIndex >= this.history.length - 1) return;
        this.historyIndex++;
        this.tileMap = this.history[this.historyIndex].slice();
        this._render();
    }
    _highlight(code) {
        return code
            .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
            .replace(/(".*?")/g, '<span style="color:#ce9178">$1</span>')
            .replace(/\b(setshape2|setimgpart)\b/g, '<span style="color:#4ec9b0">$1</span>')
            .replace(/\b(\d+)\b/g, '<span style="color:#b5cea8">$1</span>');
    }

    _resizeCanvas() {
        const c = this._q('container');
        this.canvas.width = c.clientWidth; this.canvas.height = c.clientHeight;
    }

    _snap(wx, wy) { return this.snapToGrid ? { x: Math.floor(wx / this.tileSize) * this.tileSize, y: Math.floor(wy / this.tileSize) * this.tileSize } : { x: wx, y: wy }; }

    _onDown(e) {
        const r = this.canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
        if (e.button === 1) { this.isDragging = true; this.lastDragX = x; this.lastDragY = y; e.preventDefault(); return; }
        if (this.cutMode && (e.button === 0 || e.button === 2)) {
            const wx = (x - this.offsetX) / this.zoomLevel, wy = (y - this.offsetY) / this.zoomLevel;
            this.selectionStart = (e.shiftKey || e.button === 2 || this.snapToGrid) ? this._snap(wx, wy) : { x: wx, y: wy };
            this.selectionEnd = { ...this.selectionStart }; this.currentSelection = null;
        } else { this._pushHistory(); this.isDrawing = true; this.drawMode = this.toolMode === 'eraser' ? 2 : (e.button === 0 ? 1 : 2); this._act(x, y); }
    }

    _onMove(e) {
        const r = this.canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
        if (this.isDragging && e.buttons & 4) { this.offsetX += x - this.lastDragX; this.offsetY += y - this.lastDragY; this.lastDragX = x; this.lastDragY = y; this._render(); return; }
        if (this.cutMode && (e.buttons & 1 || e.buttons & 2) && this.selectionStart) {
            const wx = (x - this.offsetX) / this.zoomLevel, wy = (y - this.offsetY) / this.zoomLevel;
            this.selectionEnd = (e.shiftKey || e.buttons & 2 || this.snapToGrid) ? this._snap(wx, wy) : { x: wx, y: wy };
            this._render();
        } else if (this.isDrawing) { this._act(x, y); }
    }

    _onUp(e) {
        if (e.button === 1) { this.isDragging = false; return; }
        if (this.cutMode && (e.button === 0 || e.button === 2) && this.selectionStart && this.selectionEnd) {
            const sx = Math.min(this.selectionStart.x, this.selectionEnd.x), sy = Math.min(this.selectionStart.y, this.selectionEnd.y);
            const w = Math.abs(this.selectionEnd.x - this.selectionStart.x), h = Math.abs(this.selectionEnd.y - this.selectionStart.y);
            if (w > 0 && h > 0) { this.currentSelection = { x: sx, y: sy, width: w, height: h }; this._showSetimgpart(); }
            this.selectionStart = null; this.selectionEnd = null;
        } else { this.isDrawing = false; this.drawMode = 0; }
    }

    _onWheel(e) {
        e.preventDefault();
        const r = this.canvas.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
        const oldZ = this.zoomLevel, delta = e.deltaY < 0 ? 1.1 : 0.9;
        this.zoomLevel = Math.max(0.25, Math.min(5, this.zoomLevel * delta));
        const zr = this.zoomLevel / oldZ;
        this.offsetX = mx - (mx - this.offsetX) * zr; this.offsetY = my - (my - this.offsetY) * zr;
        this._q('zoomLabel').textContent = `Zoom: ${Math.round(this.zoomLevel * 100)}%`;
        this._render();
    }

    _act(mx, my) {
        const tx = Math.floor((mx - this.offsetX) / this.zoomLevel / this.tileSize);
        const ty = Math.floor((my - this.offsetY) / this.zoomLevel / this.tileSize);
        if (tx >= 0 && tx < 64 && ty >= 0 && ty < 64) { this.tileMap[tx + ty * 64] = this.drawMode === 1 ? this.selectedBrush : 0; this._render(); }
    }

    _toggleCut() {
        this.cutMode = !this.cutMode;
        this._q('cutBtn').textContent = this.cutMode ? 'Cancel' : 'Setimgpart';
        this._q('snapBtn').style.display = this.cutMode ? '' : 'none';
        this._q('picker').style.display = this.cutMode ? 'none' : 'flex';
        this._q('toolBtns').style.display = this.cutMode ? 'none' : 'flex';
        this._render();
    }

    _toggleSnap() {
        this.snapToGrid = !this.snapToGrid;
        const b = this._q('snapBtn');
        b.style.background = this.snapToGrid ? '#4a9eff' : '#3a3a3a';
        b.style.color = this.snapToGrid ? '#fff' : '#ddd';
        this._render();
    }

    _updateToolBtns() {
        const pBtn = this._q('pencilBtn'), eBtn = this._q('eraserBtn');
        if (pBtn) pBtn.style.background = this.toolMode === 'pencil' ? '#4a9eff' : '#3a3a3a';
        if (eBtn) eBtn.style.background = this.toolMode === 'eraser' ? '#4a9eff' : '#3a3a3a';
        this._q('pencilBtn').onclick = () => { this.toolMode = 'pencil'; this._updateToolBtns(); this.canvas.style.cursor = 'crosshair'; };
        this._q('eraserBtn').onclick = () => { this.toolMode = 'eraser'; this._updateToolBtns(); this.canvas.style.cursor = 'cell'; };
    }

    _onTouchStart(e) {
        e.preventDefault();
        if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX, dy = e.touches[0].clientY - e.touches[1].clientY;
            this._pinchDist = Math.sqrt(dx * dx + dy * dy);
            this.isDrawing = false; this.isDragging = false;
            if (this.cutMode && this.selectionStart) { this.selectionStart = null; this.selectionEnd = null; this._render(); }
            return;
        }
        if (e.touches.length !== 1) return;
        const t = e.touches[0], r = this.canvas.getBoundingClientRect();
        const x = t.clientX - r.left, y = t.clientY - r.top;
        if (this.cutMode) {
            const wx = (x - this.offsetX) / this.zoomLevel, wy = (y - this.offsetY) / this.zoomLevel;
            this.selectionStart = this.snapToGrid ? this._snap(wx, wy) : { x: wx, y: wy };
            this.selectionEnd = { ...this.selectionStart }; this.currentSelection = null;
        } else {
            this._pushHistory(); this.isDrawing = true;
            this.drawMode = this.toolMode === 'eraser' ? 2 : 1;
            this._act(x, y);
        }
    }

    _onTouchMove(e) {
        e.preventDefault();
        if (e.touches.length === 2 && this._pinchDist > 0) {
            const dx = e.touches[0].clientX - e.touches[1].clientX, dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const r = this.canvas.getBoundingClientRect();
            const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - r.left, my = (e.touches[0].clientY + e.touches[1].clientY) / 2 - r.top;
            const oldZ = this.zoomLevel;
            this.zoomLevel = Math.max(0.25, Math.min(5, this.zoomLevel * (dist / this._pinchDist)));
            const zr = this.zoomLevel / oldZ;
            this.offsetX = mx - (mx - this.offsetX) * zr; this.offsetY = my - (my - this.offsetY) * zr;
            this._pinchDist = dist;
            this._q('zoomLabel').textContent = `Zoom: ${Math.round(this.zoomLevel * 100)}%`;
            this._render(); return;
        }
        if (e.touches.length !== 1 || !this.isDrawing) return;
        const t = e.touches[0], r = this.canvas.getBoundingClientRect();
        const x = t.clientX - r.left, y = t.clientY - r.top;
        if (this.cutMode && this.selectionStart) {
            const wx = (x - this.offsetX) / this.zoomLevel, wy = (y - this.offsetY) / this.zoomLevel;
            this.selectionEnd = this.snapToGrid ? this._snap(wx, wy) : { x: wx, y: wy };
            this._render();
        } else { this._act(x, y); }
    }

    _onTouchEnd(e) {
        e.preventDefault();
        if (e.touches.length < 2) this._pinchDist = 0;
        if (e.touches.length > 0) return;
        if (this.cutMode && this.selectionStart && this.selectionEnd) {
            const sx = Math.min(this.selectionStart.x, this.selectionEnd.x), sy = Math.min(this.selectionStart.y, this.selectionEnd.y);
            const w = Math.abs(this.selectionEnd.x - this.selectionStart.x), h = Math.abs(this.selectionEnd.y - this.selectionStart.y);
            if (w > 0 && h > 0) { this.currentSelection = { x: sx, y: sy, width: w, height: h }; this._showSetimgpart(); }
            this.selectionStart = null; this.selectionEnd = null;
        }
        this.isDrawing = false; this.drawMode = 0;
    }

    _loadImage(e) {
        const file = e.target.files[0]; if (!file) return;
        this.currentImageFile = file;
        const r = new FileReader(); r.onload = ev => { const img = new Image(); img.onload = () => { this.backgroundImage = img; this._render(); }; img.src = ev.target.result; }; r.readAsDataURL(file);
    }

    _generate() {
        let maxW = 0, maxH = 0;
        for (let i = 0; i < this.tileMap.length; i++) { if (this.tileMap[i] > 0) { const x = i % 64, y = Math.floor(i / 64); if (x > maxW) maxW = x; if (y > maxH) maxH = y; } }
        maxW++; maxH++;
        const tiles = [];
        for (let i = 0; i < maxW * maxH; i++) { const x = i % maxW, y = Math.floor(i / maxW) * 64; tiles.push(this.tileMap[x + y]); }
        this.currentTiles = tiles; this.currentWidth = maxW; this.currentHeight = maxH;
        this._q('outputModal').style.display = 'flex'; this._updateOutput();
    }

    _updateOutput() {
        const indent = parseInt(this._q('indentSlider').value), gs1 = this._q('gs1Checkbox').checked;
        const ind = ' '.repeat(indent * 2);
        let out = gs1 ? `${ind}setshape2 ${this.currentWidth},${this.currentHeight},{\n` : `${ind}setshape2(${this.currentWidth},${this.currentHeight},{\n`;
        for (let i = 0; i < this.currentTiles.length; i++) {
            if (i % this.currentWidth === 0) out += `${ind}  `;
            out += `${this.currentTiles[i]}${this.currentTiles[i].toString().length === 1 ? ' ' : ''},`;
            if ((i + 1) % this.currentWidth === 0) out += '\n';
        }
        out += gs1 ? `${ind}};` : `${ind}});`;
        this._q('outputText').value = out;
    }

    _showSetimgpart() {
        const s = this.currentSelection; if (!s) return;
        const name = this.currentImageFile ? this.currentImageFile.name : 'imagename.png';
        this._q('setimgpartText').value = `setimgpart(${name}, ${Math.floor(s.x)}, ${Math.floor(s.y)}, ${Math.floor(s.width)}, ${Math.floor(s.height)});`;
        this._q('setimgpartModal').style.display = 'flex';
    }

    _showImport() { this._q('importModal').style.display = 'flex'; this._q('importText').value = ''; this._q('importText').focus(); }

    _importSetshape() {
        const code = this._q('importText').value.trim(); if (!code) return;
        const gs1 = code.match(/setshape2\s*(\d+)\s*,\s*(\d+)\s*,\s*\{([\s\S]*?)\}\s*;/);
        const gs2 = code.match(/setshape2\s*\(\s*["']?(\d+)["']?\s*,\s*(\d+)\s*,\s*\{([\s\S]*?)\}\s*\)\s*;/);
        const m = gs1 || gs2; if (!m) return;
        const w = parseInt(m[1]), h = parseInt(m[2]);
        const nums = m[3].match(/\d+/g); if (!nums || nums.length !== w * h) return;
        this._pushHistory(); this.tileMap.fill(0);
        nums.forEach((n, i) => { const x = i % w, y = Math.floor(i / w); if (x < 64 && y < 64) this.tileMap[x + y * 64] = parseInt(n); });
        this.offsetX = 0; this.offsetY = 0; this.zoomLevel = 1;
        this._q('zoomLabel').textContent = 'Zoom: 100%';
        this._q('importModal').style.display = 'none';
        this._render();
    }

    _render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.save(); ctx.translate(this.offsetX, this.offsetY); ctx.scale(this.zoomLevel, this.zoomLevel);
        if (this.backgroundImage) { ctx.globalAlpha = 0.6; ctx.drawImage(this.backgroundImage, 0, 0); ctx.globalAlpha = 1; }
        ctx.strokeStyle = '#3c3c3c'; ctx.lineWidth = 1 / this.zoomLevel;
        for (let x = 0; x < 64; x++) for (let y = 0; y < 64; y++) ctx.strokeRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
        for (let i = 0; i < this.tileMap.length; i++) {
            const id = this.tileMap[i]; if (!id) continue;
            const t = this.tileTypes[id]; if (!t) continue;
            const x = i % 64, y = Math.floor(i / 64);
            ctx.fillStyle = t.color; ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
            const rgb = t.color.match(/\d+/g).map(Number);
            ctx.strokeStyle = `rgb(${Math.max(0,rgb[0]-50)},${Math.max(0,rgb[1]-50)},${Math.max(0,rgb[2]-50)})`;
            ctx.strokeRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
        }
        if (this.cutMode) {
            if (this.selectionStart && this.selectionEnd) {
                const sx = Math.min(this.selectionStart.x, this.selectionEnd.x), sy = Math.min(this.selectionStart.y, this.selectionEnd.y);
                const sw = Math.abs(this.selectionEnd.x - this.selectionStart.x), sh = Math.abs(this.selectionEnd.y - this.selectionStart.y);
                ctx.fillStyle = 'rgba(255,255,0,0.5)'; ctx.fillRect(sx, sy, sw, sh);
                ctx.strokeStyle = 'yellow'; ctx.strokeRect(sx, sy, sw, sh);
                ctx.fillStyle = 'white'; ctx.font = `${12 / this.zoomLevel}px Arial`;
                ctx.fillText(`${Math.floor(sw)} x ${Math.floor(sh)}`, sx + 5, sy - 5);
            }
            if (this.currentSelection) {
                const s = this.currentSelection;
                ctx.fillStyle = 'rgba(0,255,0,0.25)'; ctx.fillRect(s.x, s.y, s.width, s.height);
                ctx.strokeStyle = 'lime'; ctx.strokeRect(s.x, s.y, s.width, s.height);
            }
        }
        ctx.restore();
    }

    static open() {
        if (document.getElementById('_ss2Dialog')) { document.getElementById('_ss2Dialog').style.display = 'flex'; return; }
        const btnStyle = 'background:#3a3a3a;color:#ddd;border:1px solid #0a0a0a;border-top:1px solid #555;border-left:1px solid #555;padding:4px 12px;cursor:pointer;font-family:chevyray,monospace;font-size:12px;';
        const taStyle = 'width:100%;height:260px;background:#1a1a1a;color:#ddd;border:1px solid #3a3a3a;font-family:"Courier New",monospace;font-size:12px;padding:8px;resize:vertical;box-sizing:border-box;white-space:pre;overflow-x:auto;';
        const preStyle = 'width:100%;height:260px;background:#1a1a1a;color:#ddd;border:1px solid #3a3a3a;font-family:"Courier New",monospace;font-size:12px;padding:8px;box-sizing:border-box;white-space:pre-wrap;overflow:auto;margin:0;max-width:100%;word-break:break-all;';
        const dlg = document.createElement('div');
        dlg.id = '_ss2Dialog';
        dlg.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:9000;pointer-events:none;';
        dlg.innerHTML = `
<div class="dialog-content" style="background:#1e1e1e;border:1px solid #3a3a3a;display:flex;flex-direction:column;width:860px;height:580px;max-width:98vw;max-height:96vh;pointer-events:all;box-shadow:0 8px 32px rgba(0,0,0,0.8);">
  <div class="dialog-titlebar" style="display:flex;align-items:center;background:#2a2a2a;border-bottom:1px solid #111;padding:4px 8px;gap:6px;cursor:move;" id="_ss2Drag">
    <span style="color:#ddd;font-family:chevyray,monospace;font-size:13px;flex:1;display:flex;align-items:center;gap:5px;line-height:1;"><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACbUlEQVQ4y52P20uTcRzGn9972MEdHBvOw1JZZk4dTjyXhGEGUgkWFJH1P3QTQXgVne6UThCEFxVBYWVgWCCBQ6IM0cBkouLxTbc5NJzv67b39/66SG2pQfXcfPnC83y/n4fgP1RZd8JAeJ4nIDH+X8OFpQdyKE2063T6S5QmwgIAVNUdE0yWVCMhAGMbTgYQAjAAK5FwS2Zm5sGhgf6LvCC0rq4s3fBV13Z+HRwAceXuE1PtzisAvAD5/R0BwBisNkfxKbfsGdHcseHRQF35oYbHfW9ePZweH2kTIqEFc15Rme/chTOKOz+/eiMFgDCAEQBsKbzk6H/WQWrNU3pDZUW3v7fnqiJH72mUMmHzGdVojijq8vCrAQAgHoth/EMv0uk3+OfNpMwxnDbrSi9YNJrIwuwk45KJ2bYZi63jXVcXrMHPWLSWYH/jWfi/u+LrTGyKhCQOAITtlTcnpRSTYxNw5XkgGS1objyCGSmMZUXt9fe8OOnM2KPuOJAsjufg8RZCmplDia8IgigCAHhB0ADEQ4vzP327hdkGB8fxyHbnQhBFKLKMdUUBRzh9fVOLbtO7KwHZtklzEtpv3eyU12QZYLA50i+X1tRfH/74XtuVIJkkGo3iwe07jxi0+0Vl5a8bmk+vBr586jNZbW1bBIQQHiA81bQdB1SVQlW1YNXho63dTzuOuwuK07wVNXaAtwOAoFFKOY7kTEwHfRPTwR0UaiIBg8nsefv8ybW9Hm+9McWUPTo0GLLY7IGtunpDSkaK2VL4pyrOrNzzdmeWh+O4OGOANDX2UllbvRtamGUEfyczCDEk7ctgjALAD3gS6nZ20OQgAAAAAElFTkSuQmCC" width="14" height="14" style="image-rendering:pixelated;">Setshape2/setimgpart Editor</span>
    <button style="${btnStyle}" data-ss2="generateBtn">Generate</button>
    <button style="${btnStyle}" data-ss2="clearBtn">Clear</button>
    <button style="${btnStyle}" data-ss2="importBtn">Import</button>
    <button style="${btnStyle}" data-ss2="loadImageBtn">Load Image</button>
    <button style="${btnStyle}" data-ss2="cutBtn">Setimgpart</button>
    <button style="${btnStyle};display:none;" data-ss2="snapBtn" title="Snap to grid">&#128204; Snap</button>
    <span style="width:1px;height:20px;background:#555;margin:0 2px;"></span>
    <button style="${btnStyle}" data-ss2="pencilBtn" title="Pencil (draw)">&#9998; Pencil</button>
    <button style="${btnStyle};display:inline-flex;align-items:center;gap:4px;" data-ss2="eraserBtn" title="Eraser (clear tiles)"><i class="fas fa-eraser" style="font-size:11px;"></i> Eraser</button>
    <input type="file" data-ss2="fileInput" accept=".png,.jpg,.jpeg,.gif,.mng" style="display:none;">
    <button style="${btnStyle}" id="_ss2Close">✕</button>
  </div>
  <div style="display:flex;flex:1;overflow:hidden;">
    <div data-ss2="picker" style="width:36px;background:#252525;display:flex;flex-direction:column;padding:3px;gap:2px;overflow-y:auto;"></div>
    <div data-ss2="container" style="flex:1;background:#323232;position:relative;overflow:hidden;">
      <canvas class="_ss2canvas" style="position:absolute;cursor:crosshair;"></canvas>
      <span data-ss2="zoomLabel" style="position:absolute;bottom:8px;left:8px;color:#aaa;font-size:11px;font-family:monospace;">Zoom: 100%</span>
    </div>
  </div>
  <!-- output modal -->
  <div data-ss2="outputModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9100;align-items:center;justify-content:center;">
    <div style="background:#1e1e1e;border:1px solid #3a3a3a;width:min(700px,90vw);display:flex;flex-direction:column;overflow:hidden;">
      <div style="background:#2a2a2a;padding:8px 12px;color:#ddd;font-family:chevyray,monospace;">Setshape2 Output</div>
      <div style="padding:14px;display:flex;flex-direction:column;gap:8px;overflow:hidden;">
        <textarea data-ss2="outputText" readonly style="${preStyle}resize:none;"></textarea>
        <div style="color:#aaa;font-size:12px;">Indent: <input type="range" data-ss2="indentSlider" min="0" max="20" value="1" style="width:90px;vertical-align:middle;"> <span data-ss2="indentValue">1</span>&nbsp;&nbsp;<label style="color:#aaa;"><input type="checkbox" data-ss2="gs1Checkbox"> GS1</label></div>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:8px;padding:8px 12px;border-top:1px solid #2a2a2a;">
        <button style="${btnStyle}" data-ss2="copyOutputBtn">Copy</button>
        <button style="${btnStyle}" data-ss2="closeOutputBtn">Close</button>
      </div>
    </div>
  </div>
  <!-- setimgpart modal -->
  <div data-ss2="setimgpartModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9100;align-items:center;justify-content:center;">
    <div style="background:#1e1e1e;border:1px solid #3a3a3a;min-width:420px;display:flex;flex-direction:column;">
      <div style="background:#2a2a2a;padding:8px 12px;color:#ddd;font-family:chevyray,monospace;">Setimgpart Output</div>
      <div style="padding:14px;"><textarea data-ss2="setimgpartText" readonly style="${preStyle}height:80px;resize:none;"></textarea></div>
      <div style="display:flex;justify-content:flex-end;gap:8px;padding:8px 12px;border-top:1px solid #2a2a2a;">
        <button style="${btnStyle}" data-ss2="copySetimgpartBtn">Copy</button>
        <button style="${btnStyle}" data-ss2="closeSetimgpartBtn">Close</button>
      </div>
    </div>
  </div>
  <!-- import modal -->
  <div data-ss2="importModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9100;align-items:center;justify-content:center;">
    <div style="background:#1e1e1e;border:1px solid #3a3a3a;min-width:500px;display:flex;flex-direction:column;">
      <div style="background:#2a2a2a;padding:8px 12px;color:#ddd;font-family:chevyray,monospace;">Import Setshape2</div>
      <div style="padding:14px;"><textarea data-ss2="importText" style="${taStyle}height:200px;resize:vertical;" placeholder="Paste setshape2 code here (GS1 or GS2)..."></textarea></div>
      <div style="display:flex;justify-content:flex-end;gap:8px;padding:8px 12px;border-top:1px solid #2a2a2a;">
        <button style="${btnStyle}" data-ss2="importConfirmBtn">Import</button>
        <button style="${btnStyle}" data-ss2="closeImportBtn">Cancel</button>
      </div>
    </div>
  </div>
</div>`;
        document.body.appendChild(dlg);
        document.getElementById('_ss2Close').onclick = () => dlg.style.display = 'none';

        // make inner modals show as flex
        dlg.querySelectorAll('[data-ss2$="Modal"]').forEach(m => {
            const origDisplay = m.style.display;
            Object.defineProperty(m.style, '_ss2show', { get() {}, set(v) { m.style.display = v ? 'flex' : 'none'; } });
        });

        // drag titlebar
        const dragHandle = document.getElementById('_ss2Drag');
        const inner = dlg.firstElementChild;
        let _dx = 0, _dy = 0, _dragging = false;
        dragHandle.addEventListener('mousedown', e => { if (e.target.tagName === 'BUTTON') return; _dragging = true; _dx = e.clientX - inner.getBoundingClientRect().left; _dy = e.clientY - inner.getBoundingClientRect().top; e.preventDefault(); });
        document.addEventListener('mousemove', e => { if (!_dragging) return; inner.style.position = 'fixed'; inner.style.left = (e.clientX - _dx) + 'px'; inner.style.top = (e.clientY - _dy) + 'px'; inner.style.margin = '0'; });
        document.addEventListener('mouseup', () => _dragging = false);

        new SetshapeEditor(dlg.firstElementChild);
    }
}
