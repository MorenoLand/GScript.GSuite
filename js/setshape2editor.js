class SetshapeEditor {
    static _instance = null;
    static _content = null;
    static _dialog = null;
    static _host = null;
    static _tabId = null;
    static _outputEditor = null;
    static _setimgpartEditor = null;
    static _monacoInitPromise = null;

    constructor(root) {
        this.root = root;
        this.tileSize = 16;
        this.gridWidth = 64;
        this.gridHeight = 64;
        this.tileMap = new Array(this.gridWidth * this.gridHeight).fill(0);
        this.history = [{ tiles: this.tileMap.slice(), width: this.gridWidth, height: this.gridHeight }]; this.historyIndex = 0;
        this.selectedBrush = 22;
        this.cutMode = false;
        this.backgroundImage = null;
        this.currentImageFile = null;
        this.offsetX = 0; this.offsetY = 0;
        this.isDragging = false; this.lastDragX = 0; this.lastDragY = 0;
        this.zoomLevel = 1.0;
        this.selectionStart = null; this.selectionEnd = null; this.currentSelection = null;
        this.selectionInteraction = null;
        this.selectionInteractionStart = null;
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
        this.maxZoomLevel = 32;
        window.__setshapeEditorInstance = this;
        SetshapeEditor._instance = this;
        this._init();
    }

    static _getThemeColors() {
        const scheme = localStorage.getItem('editorColorScheme') || 'default';
        const schemes = {
            'default': { bg: '#1e1e1e', panel: '#2b2b2b', border: '#3a3a3a', text: '#ddd', inputBg: '#323232', buttonBg: '#353535', buttonText: '#e0e0e0', buttonBorder: '#0a0a0a', buttonBorderLight: '#404040' },
            'fusion-light': { bg: '#f5f5f5', panel: '#ffffff', border: '#d0d0d0', text: '#1a1a1a', inputBg: '#ececec', buttonBg: '#ffffff', buttonText: '#1a1a1a', buttonBorder: '#d0d0d0', buttonBorderLight: '#e0e0e0' },
            'fusion-dark': { bg: '#1e1e1e', panel: '#2d2d2d', border: '#0f0f0f', text: '#e8e8e8', inputBg: '#323232', buttonBg: '#2d2d2d', buttonText: '#e8e8e8', buttonBorder: '#0f0f0f', buttonBorderLight: '#404040' },
            'dark-style': { bg: '#1e1e1e', panel: '#252525', border: '#3c3c3c', text: '#cccccc', inputBg: '#323232', buttonBg: '#252525', buttonText: '#cccccc', buttonBorder: '#3c3c3c', buttonBorderLight: '#4c4c4c' },
            'dark-orange': { bg: '#2a1f1a', panel: '#3a2f2a', border: '#1a0f0a', text: '#ffaa55', inputBg: '#332923', buttonBg: '#3a2f2a', buttonText: '#ffaa55', buttonBorder: '#1a0f0a', buttonBorderLight: '#5a4f4a' },
            'aqua': { bg: '#0a1a1f', panel: '#1a2a2f', border: '#0a0a0a', text: '#55ffff', inputBg: '#163038', buttonBg: '#1a2a2f', buttonText: '#55ffff', buttonBorder: '#0a0a0a', buttonBorderLight: '#2a4a4f' },
            'elegant-dark': { bg: '#1a1a1a', panel: '#2d2d2d', border: '#404040', text: '#e8e8e8', inputBg: '#323232', buttonBg: '#2d2d2d', buttonText: '#e8e8e8', buttonBorder: '#404040', buttonBorderLight: '#505050' },
            'material-dark': { bg: '#121212', panel: '#1e1e1e', border: '#333333', text: '#ffffff', inputBg: '#2a2a2a', buttonBg: '#1e1e1e', buttonText: '#ffffff', buttonBorder: '#333333', buttonBorderLight: '#444444' },
            'light-style': { bg: '#ffffff', panel: '#ffffff', border: '#e0e0e0', text: '#000000', inputBg: '#ececec', buttonBg: '#ffffff', buttonText: '#000000', buttonBorder: '#e0e0e0', buttonBorderLight: '#f0f0f0' },
            'ayu-mirage': { bg: '#1f2430', panel: '#232834', border: '#191e2a', text: '#cbccc6', inputBg: '#2a3242', buttonBg: '#232834', buttonText: '#cbccc6', buttonBorder: '#191e2a', buttonBorderLight: '#2a3a4a' },
            'dracula': { bg: '#282a36', panel: '#343746', border: '#21222c', text: '#f8f8f2', inputBg: '#3a3d4d', buttonBg: '#343746', buttonText: '#f8f8f2', buttonBorder: '#21222c', buttonBorderLight: '#525460' }
        };
        const c = schemes[scheme] || schemes.default;
        const css = getComputedStyle(document.documentElement);
        const readVar = (name, fallback) => css.getPropertyValue(name).trim() || fallback;
        return {
            bg: readVar('--dialog-bg', c.bg),
            panel: c.panel,
            border: readVar('--dialog-border', c.border),
            text: readVar('--dialog-text', c.text),
            inputBg: readVar('--dialog-input-bg', c.inputBg),
            buttonBg: readVar('--dialog-button-bg', c.buttonBg),
            buttonText: readVar('--dialog-button-text', c.buttonText),
            buttonBorder: c.buttonBorder,
            buttonBorderLight: c.buttonBorderLight
        };
    }

    static _hexToRgb(hex) {
        const clean = (hex || '').replace('#', '').trim();
        if (clean.length !== 6) return { r: 50, g: 50, b: 50 };
        return {
            r: parseInt(clean.slice(0, 2), 16),
            g: parseInt(clean.slice(2, 4), 16),
            b: parseInt(clean.slice(4, 6), 16)
        };
    }

    static _mixColor(a, b, ratio) {
        const ca = SetshapeEditor._hexToRgb(a);
        const cb = SetshapeEditor._hexToRgb(b);
        const mix = (x, y) => Math.round(x + (y - x) * ratio);
        return `rgb(${mix(ca.r, cb.r)},${mix(ca.g, cb.g)},${mix(ca.b, cb.b)})`;
    }

    static _getRenderColors() {
        const c = SetshapeEditor._getThemeColors();
        const bg = c.inputBg || '#323232';
        const rgb = SetshapeEditor._hexToRgb(bg);
        const luminance = ((rgb.r * 299) + (rgb.g * 587) + (rgb.b * 114)) / 1000;
        const darkTheme = luminance < 128;
        return {
            canvasBg: bg,
            grid: darkTheme
                ? SetshapeEditor._mixColor(bg, '#ffffff', 0.28)
                : SetshapeEditor._mixColor(bg, '#000000', 0.18)
        };
    }

    static applyTheme(target = SetshapeEditor._content || SetshapeEditor._dialog) {
        const root = target?.querySelector ? target : SetshapeEditor._content;
        if (!root) return;
        const c = SetshapeEditor._getThemeColors();
        root.style.background = c.bg;
        root.style.color = c.text;
        root.style.borderColor = c.border;
        const dragHandle = root.querySelector('[data-ss2="dragHandle"]');
        if (dragHandle) {
            dragHandle.style.background = c.panel;
            dragHandle.style.borderColor = c.border;
            dragHandle.style.color = c.text;
        }
        const picker = root.querySelector('[data-ss2="picker"]');
        if (picker) {
            picker.style.background = c.panel;
            picker.style.borderColor = c.border;
        }
        const container = root.querySelector('[data-ss2="container"]');
        if (container) {
            container.style.background = c.inputBg;
            container.style.borderColor = c.border;
        }
        const zoomLabel = root.querySelector('[data-ss2="zoomLabel"]');
        if (zoomLabel) zoomLabel.style.color = c.text;
        root.querySelectorAll('button').forEach(el => {
            el.style.background = c.buttonBg;
            el.style.color = c.buttonText;
            el.style.border = `1px solid ${c.buttonBorder}`;
            el.style.borderTop = `1px solid ${c.buttonBorderLight}`;
            el.style.borderLeft = `1px solid ${c.buttonBorderLight}`;
            el.style.boxShadow = 'inset 0 1px 0 rgba(0,0,0,0.25)';
        });
        root.querySelectorAll('textarea, input[type="text"], input[type="range"]').forEach(el => {
            if (el.type === 'range') return;
            el.style.background = c.inputBg;
            el.style.color = c.text;
            el.style.borderColor = c.border;
        });
        root.querySelectorAll('[data-ss2="outputModal"] > div, [data-ss2="setimgpartModal"] > div, [data-ss2="importModal"] > div').forEach(el => {
            el.style.background = c.bg;
            el.style.borderColor = c.border;
            el.style.color = c.text;
        });
        root.querySelectorAll('[data-ss2="outputModal"] > div > div:first-child, [data-ss2="setimgpartModal"] > div > div:first-child, [data-ss2="importModal"] > div > div:first-child').forEach(el => {
            el.style.background = c.panel;
            el.style.color = c.text;
        });
        root.querySelectorAll('[data-ss2="outputModal"] textarea, [data-ss2="setimgpartModal"] textarea, [data-ss2="importModal"] textarea').forEach(el => {
            el.style.background = c.inputBg;
            el.style.color = c.text;
            el.style.borderColor = c.border;
        });
        root.querySelectorAll('[data-ss2="outputEditor"], [data-ss2="setimgpartEditor"]').forEach(el => {
            el.style.background = c.inputBg;
            el.style.border = `1px solid ${c.border}`;
        });
        if (window.monaco?.editor) {
            const themeName = getComputedStyle(document.documentElement)
                .getPropertyValue('--monaco-theme')
                .trim()
                .replace(/['"]/g, '') || 'graal-active';
            monaco.editor.setTheme(themeName);
        }
    }

    _q(id) { return this.root.querySelector(`[data-ss2="${id}"]`); }

    async _ensureOutputEditors() {
        if (SetshapeEditor._outputEditor && SetshapeEditor._setimgpartEditor) return true;
        if (SetshapeEditor._monacoInitPromise) return SetshapeEditor._monacoInitPromise;
        SetshapeEditor._monacoInitPromise = (async () => {
            if (!window.initGraalMonaco) return false;
            await window.initGraalMonaco({ disableCssValidation: true });
            if (!window.monaco?.editor) return false;
            const themeName = getComputedStyle(document.documentElement)
                .getPropertyValue('--monaco-theme')
                .trim()
                .replace(/['"]/g, '') || 'graal-active';
            const outputHost = this._q('outputEditor');
            const setimgpartHost = this._q('setimgpartEditor');
            if (outputHost && !SetshapeEditor._outputEditor) {
                SetshapeEditor._outputEditor = monaco.editor.create(outputHost, {
                    value: '',
                    language: 'graalscript',
                    theme: themeName,
                    automaticLayout: true,
                    readOnly: true,
                    minimap: { enabled: false },
                    lineNumbers: 'off',
                    glyphMargin: false,
                    folding: false,
                    lineDecorationsWidth: 0,
                    lineNumbersMinChars: 0,
                    scrollBeyondLastLine: false,
                    renderLineHighlight: 'none',
                    fontSize: 12,
                    fontFamily: 'monospace',
                    wordWrap: 'on',
                    renderValidationDecorations: 'off'
                });
            }
            if (setimgpartHost && !SetshapeEditor._setimgpartEditor) {
                SetshapeEditor._setimgpartEditor = monaco.editor.create(setimgpartHost, {
                    value: '',
                    language: 'graalscript',
                    theme: themeName,
                    automaticLayout: true,
                    readOnly: true,
                    minimap: { enabled: false },
                    lineNumbers: 'off',
                    glyphMargin: false,
                    folding: false,
                    lineDecorationsWidth: 0,
                    lineNumbersMinChars: 0,
                    scrollBeyondLastLine: false,
                    renderLineHighlight: 'none',
                    fontSize: 12,
                    fontFamily: 'monospace',
                    wordWrap: 'on',
                    renderValidationDecorations: 'off'
                });
            }
            return !!(SetshapeEditor._outputEditor && SetshapeEditor._setimgpartEditor);
        })();
        try {
            return await SetshapeEditor._monacoInitPromise;
        } finally {
            SetshapeEditor._monacoInitPromise = null;
        }
    }

    _setOutputValue(kind, value) {
        if (kind === 'output') {
            if (SetshapeEditor._outputEditor) SetshapeEditor._outputEditor.setValue(value);
            const fallback = this._q('outputText');
            if (fallback) fallback.value = value;
            return;
        }
        if (SetshapeEditor._setimgpartEditor) SetshapeEditor._setimgpartEditor.setValue(value);
        const fallback = this._q('setimgpartText');
        if (fallback) fallback.value = value;
    }

    _getOutputValue(kind) {
        if (kind === 'output') {
            return SetshapeEditor._outputEditor?.getValue() ?? this._q('outputText')?.value ?? '';
        }
        return SetshapeEditor._setimgpartEditor?.getValue() ?? this._q('setimgpartText')?.value ?? '';
    }

    _layoutOutputEditors() {
        SetshapeEditor._outputEditor?.layout();
        SetshapeEditor._setimgpartEditor?.layout();
    }

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
        this._q('generateBtn').onclick = () => this.cutMode ? this._showSetimgpart() : this._generate();
        this._q('clearBtn').onclick = () => { this._pushHistory(); this.tileMap.fill(0); this._render(); };
        this._q('importBtn').onclick = () => this._showImport();
        this._q('cutBtn').onclick = () => this._toggleCut();
        this._q('snapBtn').onclick = () => this._toggleSnap();
        const fi = this._q('fileInput');
        this._q('loadImageBtn').onclick = () => fi.click();
        const closeBtn = this._q('closeBtn') || this.root.querySelector('#_ss2Close');
        if (closeBtn) closeBtn.onclick = () => SetshapeEditor.close();
        fi.onchange = e => this._loadImage(e);

        const container = this._q('container');
        container.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
        container.addEventListener('drop', e => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            this._importImageFile(file);
        });
        document.addEventListener('dragover', e => {
            if (!this._isActive()) return;
            const file = e.dataTransfer?.files?.[0];
            if (!file || !this._isImageFile(file)) return;
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation?.();
            e.dataTransfer.dropEffect = 'copy';
        }, true);
        document.addEventListener('drop', e => {
            if (!this._isActive()) return;
            const file = e.dataTransfer?.files?.[0];
            if (!file || !this._isImageFile(file)) return;
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation?.();
            this._importImageFile(file);
        }, true);
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
        this._q('copyOutputBtn').onclick = () => this._copy(this._getOutputValue('output'), this._q('copyOutputBtn'));
        this._q('indentSlider').oninput = () => { this._q('indentValue').textContent = this._q('indentSlider').value; this._updateOutput(); };
        this._q('gs1Checkbox').onchange = () => this._updateOutput();
        this._q('closeSetimgpartBtn').onclick = () => this._q('setimgpartModal').style.display = 'none';
        this._q('copySetimgpartBtn').onclick = () => this._copy(this._getOutputValue('setimgpart'), this._q('copySetimgpartBtn'));
        this._q('closeImportBtn').onclick = () => this._q('importModal').style.display = 'none';
        this._q('importConfirmBtn').onclick = () => this._importSetshape();

        new ResizeObserver(() => { this._resizeCanvas(); this._render(); }).observe(container);
        document.addEventListener('keydown', e => {
            if (!this._isActive()) return;
            if (e.ctrlKey && !e.shiftKey && e.key === 'z') { e.preventDefault(); this._undo(); }
            else if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) { e.preventDefault(); this._redo(); }
        });
    }

    _isImageFile(file) {
        return (!!file?.type && file.type.startsWith('image/')) || /\.(png|gif|mng|webp|jpg|jpeg|bmp)$/i.test(file?.name || '');
    }

    _isActive() {
        const dialogOpen = !!(SetshapeEditor._dialog && SetshapeEditor._dialog.style.display !== 'none');
        const tabOpen = !!(SetshapeEditor._host && SetshapeEditor._host.isConnected && window.tabManager?.getActiveTab?.()?.type === 'setshape');
        return dialogOpen || tabOpen;
    }

    _copy(source, btn) {
        const text = typeof source === 'string'
            ? source
            : (source?.tagName === 'TEXTAREA' ? source.value : (source?.textContent || ''));
        if (navigator.clipboard) { navigator.clipboard.writeText(text); }
        else { const ta = Object.assign(document.createElement('textarea'), {value:text}); ta.style.cssText='position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); }
        const orig = btn.textContent; btn.textContent = 'Copied!'; setTimeout(() => btn.textContent = orig, 1500);
    }

    _pushHistory() {
        this.history = this.history.slice(0, this.historyIndex + 1);
        this.history.push({ tiles: this.tileMap.slice(), width: this.gridWidth, height: this.gridHeight });
        this.historyIndex = this.history.length - 1;
        if (this.history.length > 50) { this.history.shift(); this.historyIndex--; }
    }
    _undo() {
        if (this.historyIndex <= 0) return;
        this.historyIndex--;
        const state = this.history[this.historyIndex];
        this.gridWidth = state.width;
        this.gridHeight = state.height;
        this.tileMap = state.tiles.slice();
        this._render();
    }
    _redo() {
        if (this.historyIndex >= this.history.length - 1) return;
        this.historyIndex++;
        const state = this.history[this.historyIndex];
        this.gridWidth = state.width;
        this.gridHeight = state.height;
        this.tileMap = state.tiles.slice();
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

    _clampZoom(zoom) {
        return Math.max(0.25, Math.min(this.maxZoomLevel, zoom));
    }

    _updateZoomLabel() {
        this._q('zoomLabel').textContent = `Zoom: ${Math.round(this.zoomLevel * 100)}%`;
    }

    _resizeGrid(nextWidth, nextHeight) {
        const width = Math.max(64, nextWidth | 0);
        const height = Math.max(64, nextHeight | 0);
        if (width === this.gridWidth && height === this.gridHeight) return;
        const next = new Array(width * height).fill(0);
        const copyWidth = Math.min(this.gridWidth, width);
        const copyHeight = Math.min(this.gridHeight, height);
        for (let y = 0; y < copyHeight; y++) {
            for (let x = 0; x < copyWidth; x++) {
                next[x + y * width] = this.tileMap[x + y * this.gridWidth];
            }
        }
        this.gridWidth = width;
        this.gridHeight = height;
        this.tileMap = next;
    }

    _ensureGridFitsImage(img) {
        if (!img) return;
        this._resizeGrid(Math.ceil(img.width / this.tileSize), Math.ceil(img.height / this.tileSize));
    }

    _snap(wx, wy, force = false) { return (this.snapToGrid || force) ? { x: Math.floor(wx / this.tileSize) * this.tileSize, y: Math.floor(wy / this.tileSize) * this.tileSize } : { x: wx, y: wy }; }

    _getSelectionHandles() {
        const s = this.currentSelection; if (!s) return [];
        const hs = 8 / this.zoomLevel;
        const x1 = s.x, y1 = s.y, x2 = s.x + s.width, y2 = s.y + s.height;
        const mx = x1 + s.width / 2, my = y1 + s.height / 2;
        return [
            { name: 'nw', x: x1, y: y1, size: hs },
            { name: 'ne', x: x2, y: y1, size: hs },
            { name: 'sw', x: x1, y: y2, size: hs },
            { name: 'se', x: x2, y: y2, size: hs },
            { name: 'n', x: mx, y: y1, size: hs },
            { name: 's', x: mx, y: y2, size: hs },
            { name: 'w', x: x1, y: my, size: hs },
            { name: 'e', x: x2, y: my, size: hs }
        ];
    }

    _getSelectionHandleAt(wx, wy) {
        for (const h of this._getSelectionHandles()) {
            const half = h.size / 2;
            if (wx >= h.x - half && wx <= h.x + half && wy >= h.y - half && wy <= h.y + half) return h.name;
        }
        return null;
    }

    _pointInSelection(wx, wy) {
        const s = this.currentSelection; if (!s) return false;
        return wx >= s.x && wx <= s.x + s.width && wy >= s.y && wy <= s.y + s.height;
    }

    _updateCursor(wx = null, wy = null) {
        if (this.selectionInteraction) {
            this.canvas.style.cursor = 'grabbing';
            return;
        }
        if (this.cutMode && this.currentSelection && wx !== null && wy !== null) {
            if (this._getSelectionHandleAt(wx, wy) || this._pointInSelection(wx, wy)) {
                this.canvas.style.cursor = 'grab';
                return;
            }
        }
        if (this.cutMode) {
            this.canvas.style.cursor = 'crosshair';
            return;
        }
        this.canvas.style.cursor = this.toolMode === 'eraser' ? 'cell' : 'crosshair';
    }

    _onDown(e) {
        const r = this.canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
        if (e.button === 1) { this.isDragging = true; this.lastDragX = x; this.lastDragY = y; e.preventDefault(); return; }
        if (this.cutMode && (e.button === 0 || e.button === 2)) {
            const wx = (x - this.offsetX) / this.zoomLevel, wy = (y - this.offsetY) / this.zoomLevel;
            if (e.button === 0 && this.currentSelection) {
                const handle = this._getSelectionHandleAt(wx, wy);
                if (handle || this._pointInSelection(wx, wy)) {
                    this.selectionInteraction = handle ? { type: 'resize', handle } : { type: 'move' };
                    this.selectionInteractionStart = {
                        mouseX: wx,
                        mouseY: wy,
                        x: this.currentSelection.x,
                        y: this.currentSelection.y,
                        width: this.currentSelection.width,
                        height: this.currentSelection.height
                    };
                    this._updateCursor();
                    e.preventDefault();
                    return;
                }
            }
            this.selectionStart = (e.shiftKey || e.button === 2 || this.snapToGrid) ? this._snap(wx, wy) : { x: wx, y: wy };
            this.selectionEnd = { ...this.selectionStart }; this.currentSelection = null;
        } else { this._pushHistory(); this.isDrawing = true; this.drawMode = this.toolMode === 'eraser' ? 2 : (e.button === 0 ? 1 : 2); this._act(x, y); }
    }

    _onMove(e) {
        const r = this.canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
        if (this.isDragging && e.buttons & 4) { this.offsetX += x - this.lastDragX; this.offsetY += y - this.lastDragY; this.lastDragX = x; this.lastDragY = y; this._render(); return; }
        const wx = (x - this.offsetX) / this.zoomLevel, wy = (y - this.offsetY) / this.zoomLevel;
        if (this.cutMode && this.selectionInteraction && this.currentSelection && (e.buttons & 1)) {
            const start = this.selectionInteractionStart;
            const shouldSnap = this.snapToGrid || e.shiftKey;
            if (this.selectionInteraction.type === 'move') {
                let nx = start.x + (wx - start.mouseX);
                let ny = start.y + (wy - start.mouseY);
                if (shouldSnap) ({ x: nx, y: ny } = this._snap(nx, ny, true));
                this.currentSelection.x = nx;
                this.currentSelection.y = ny;
            } else {
                let x1 = start.x, y1 = start.y, x2 = start.x + start.width, y2 = start.y + start.height;
                const p = shouldSnap ? this._snap(wx, wy, true) : { x: wx, y: wy };
                if (this.selectionInteraction.handle.includes('w')) x1 = p.x;
                if (this.selectionInteraction.handle.includes('e')) x2 = p.x;
                if (this.selectionInteraction.handle.includes('n')) y1 = p.y;
                if (this.selectionInteraction.handle.includes('s')) y2 = p.y;
                this.currentSelection.x = Math.min(x1, x2);
                this.currentSelection.y = Math.min(y1, y2);
                this.currentSelection.width = Math.max(1, Math.abs(x2 - x1));
                this.currentSelection.height = Math.max(1, Math.abs(y2 - y1));
            }
            this._render();
            return;
        }
        if (this.cutMode && (e.buttons & 1 || e.buttons & 2) && this.selectionStart) {
            this.selectionEnd = (e.shiftKey || e.buttons & 2 || this.snapToGrid) ? this._snap(wx, wy) : { x: wx, y: wy };
            this._render();
        } else if (this.isDrawing) { this._act(x, y); }
        this._updateCursor(wx, wy);
    }

    _onUp(e) {
        if (e.button === 1) { this.isDragging = false; return; }
        if (this.selectionInteraction) {
            this.selectionInteraction = null;
            this.selectionInteractionStart = null;
            const r = this.canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
            const wx = (x - this.offsetX) / this.zoomLevel, wy = (y - this.offsetY) / this.zoomLevel;
            this._updateCursor(wx, wy);
            this._render();
            return;
        }
        if (this.cutMode && (e.button === 0 || e.button === 2) && this.selectionStart && this.selectionEnd) {
            const sx = Math.min(this.selectionStart.x, this.selectionEnd.x), sy = Math.min(this.selectionStart.y, this.selectionEnd.y);
            const w = Math.abs(this.selectionEnd.x - this.selectionStart.x), h = Math.abs(this.selectionEnd.y - this.selectionStart.y);
            if (w > 0 && h > 0) { this.currentSelection = { x: sx, y: sy, width: w, height: h }; }
            this.selectionStart = null; this.selectionEnd = null;
            const r = this.canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
            const wx = (x - this.offsetX) / this.zoomLevel, wy = (y - this.offsetY) / this.zoomLevel;
            this._updateCursor(wx, wy);
            this._render();
        } else { this.isDrawing = false; this.drawMode = 0; this._updateCursor(); }
    }

    _onWheel(e) {
        e.preventDefault();
        const r = this.canvas.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
        const oldZ = this.zoomLevel, delta = e.deltaY < 0 ? 1.1 : 0.9;
        this.zoomLevel = this._clampZoom(this.zoomLevel * delta);
        const zr = this.zoomLevel / oldZ;
        this.offsetX = mx - (mx - this.offsetX) * zr; this.offsetY = my - (my - this.offsetY) * zr;
        this._updateZoomLabel();
        this._render();
    }

    _act(mx, my) {
        const tx = Math.floor((mx - this.offsetX) / this.zoomLevel / this.tileSize);
        const ty = Math.floor((my - this.offsetY) / this.zoomLevel / this.tileSize);
        if (tx >= 0 && tx < this.gridWidth && ty >= 0 && ty < this.gridHeight) { this.tileMap[tx + ty * this.gridWidth] = this.drawMode === 1 ? this.selectedBrush : 0; this._render(); }
    }

    _toggleCut() {
        this.cutMode = !this.cutMode;
        this._q('cutBtn').textContent = this.cutMode ? 'Setshape2' : 'Setimgpart';
        this._q('snapBtn').style.display = this.cutMode ? '' : 'none';
        this._q('picker').style.display = this.cutMode ? 'none' : 'flex';
        const toolBtns = this._q('toolBtns');
        if (toolBtns) {
            toolBtns.style.display = this.cutMode ? 'none' : 'flex';
        } else {
            const pencilBtn = this._q('pencilBtn');
            const eraserBtn = this._q('eraserBtn');
            if (pencilBtn) pencilBtn.style.display = this.cutMode ? 'none' : '';
            if (eraserBtn) eraserBtn.style.display = this.cutMode ? 'none' : 'inline-flex';
        }
        this._updateCursor();
        this._render();
    }

    _toggleSnap() {
        this.snapToGrid = !this.snapToGrid;
        const b = this._q('snapBtn');
        b.style.background = this.snapToGrid ? '#4a9eff' : '#3a3a3a';
        b.style.color = this.snapToGrid ? '#fff' : '#ddd';
        this._updateCursor();
        this._render();
    }

    _updateToolBtns() {
        const pBtn = this._q('pencilBtn'), eBtn = this._q('eraserBtn');
        if (pBtn) pBtn.style.background = this.toolMode === 'pencil' ? '#4a9eff' : '#3a3a3a';
        if (eBtn) eBtn.style.background = this.toolMode === 'eraser' ? '#4a9eff' : '#3a3a3a';
        this._q('pencilBtn').onclick = () => { this.toolMode = 'pencil'; this._updateToolBtns(); this._updateCursor(); };
        this._q('eraserBtn').onclick = () => { this.toolMode = 'eraser'; this._updateToolBtns(); this._updateCursor(); };
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
            this.zoomLevel = this._clampZoom(this.zoomLevel * (dist / this._pinchDist));
            const zr = this.zoomLevel / oldZ;
            this.offsetX = mx - (mx - this.offsetX) * zr; this.offsetY = my - (my - this.offsetY) * zr;
            this._pinchDist = dist;
            this._updateZoomLabel();
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
            if (w > 0 && h > 0) { this.currentSelection = { x: sx, y: sy, width: w, height: h }; }
            this.selectionStart = null; this.selectionEnd = null;
            this._render();
        }
        this.isDrawing = false; this.drawMode = 0;
    }

    _loadImage(e) {
        const file = e.target.files[0]; if (!file) return;
        this._importImageFile(file);
    }

    _importImageFile(file) {
        if (!file) return;
        const isImageType = !!file.type && file.type.startsWith('image/');
        const isImageName = /\.(png|gif|mng|webp|jpg|jpeg|bmp)$/i.test(file.name || '');
        if (!isImageType && !isImageName) return;
        this.currentImageFile = file;
        const r = new FileReader();
        r.onload = ev => {
            const img = new Image();
            img.onload = () => { this.backgroundImage = img; this._ensureGridFitsImage(img); this._render(); };
            img.src = ev.target.result;
        };
        r.readAsDataURL(file);
    }

    async _importImagePath(fp) {
        if (!fp || !/\.(png|gif|mng|webp|jpg|jpeg|bmp)$/i.test(fp)) return;
        const bytes = await window.__TAURI__?.fs?.readFile(fp).catch(() => null);
        if (!bytes) return;
        const ext = (fp.split('.').pop() || '').toLowerCase();
        const mimeMap = {
            png: 'image/png',
            gif: 'image/gif',
            webp: 'image/webp',
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            bmp: 'image/bmp',
            mng: 'image/x-mng'
        };
        const blob = new Blob([bytes], { type: mimeMap[ext] || 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        this.currentImageFile = { name: fp.replace(/\\/g, '/').split('/').pop() };
        const img = new Image();
        img.onload = () => {
            this.backgroundImage = img;
            this._ensureGridFitsImage(img);
            this._render();
            URL.revokeObjectURL(url);
        };
        img.onerror = () => URL.revokeObjectURL(url);
        img.src = url;
    }

    _generate() {
        let maxW = 0, maxH = 0;
        for (let i = 0; i < this.tileMap.length; i++) { if (this.tileMap[i] > 0) { const x = i % this.gridWidth, y = Math.floor(i / this.gridWidth); if (x > maxW) maxW = x; if (y > maxH) maxH = y; } }
        maxW++; maxH++;
        const tiles = [];
        for (let i = 0; i < maxW * maxH; i++) { const x = i % maxW, y = Math.floor(i / maxW) * this.gridWidth; tiles.push(this.tileMap[x + y]); }
        this.currentTiles = tiles; this.currentWidth = maxW; this.currentHeight = maxH;
        this._q('outputModal').style.display = 'flex';
        this._updateOutput();
        this._ensureOutputEditors().then(() => {
            this._updateOutput();
            this._layoutOutputEditors();
        });
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
        this._setOutputValue('output', out);
    }

    _showSetimgpart() {
        const s = this.currentSelection; if (!s) return;
        const name = this.currentImageFile ? this.currentImageFile.name : 'imagename.png';
        this._setOutputValue('setimgpart', `setimgpart(${name}, ${Math.floor(s.x)}, ${Math.floor(s.y)}, ${Math.floor(s.width)}, ${Math.floor(s.height)});`);
        this._q('setimgpartModal').style.display = 'flex';
        this._ensureOutputEditors().then(() => {
            this._layoutOutputEditors();
        });
    }

    _showImport() { this._q('importModal').style.display = 'flex'; this._q('importText').value = ''; this._q('importText').focus(); }

    _importSetshape() {
        const code = this._q('importText').value.trim(); if (!code) return;
        const gs1 = code.match(/setshape2\s*(\d+)\s*,\s*(\d+)\s*,\s*\{([\s\S]*?)\}\s*;/);
        const gs2 = code.match(/setshape2\s*\(\s*["']?(\d+)["']?\s*,\s*(\d+)\s*,\s*\{([\s\S]*?)\}\s*\)\s*;/);
        const m = gs1 || gs2; if (!m) return;
        const w = parseInt(m[1]), h = parseInt(m[2]);
        const nums = m[3].match(/\d+/g); if (!nums || nums.length !== w * h) return;
        this._pushHistory();
        this.gridWidth = Math.max(64, w);
        this.gridHeight = Math.max(64, h);
        this.tileMap = new Array(this.gridWidth * this.gridHeight).fill(0);
        nums.forEach((n, i) => { const x = i % w, y = Math.floor(i / w); if (x < this.gridWidth && y < this.gridHeight) this.tileMap[x + y * this.gridWidth] = parseInt(n); });
        this.offsetX = 0; this.offsetY = 0; this.zoomLevel = 1;
        this._updateZoomLabel();
        this._q('importModal').style.display = 'none';
        this._render();
    }

    _render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const rc = SetshapeEditor._getRenderColors();
        ctx.fillStyle = rc.canvasBg;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.save(); ctx.translate(this.offsetX, this.offsetY); ctx.scale(this.zoomLevel, this.zoomLevel);
        ctx.imageSmoothingEnabled = false;
        const contentWidth = Math.max(this.gridWidth * this.tileSize, this.backgroundImage?.width || 0);
        const contentHeight = Math.max(this.gridHeight * this.tileSize, this.backgroundImage?.height || 0);
        if (this.backgroundImage) {
            ctx.globalAlpha = 0.9;
            ctx.drawImage(this.backgroundImage, 0, 0);
            ctx.globalAlpha = 1;
        }

        const pxOnScreen = this.zoomLevel;
        const tileOnScreen = this.tileSize * this.zoomLevel;
        const minorGrid = rc.canvasBg.startsWith('rgb(')
            ? rc.grid.replace('rgb(', 'rgba(').replace(')', ',0.28)')
            : rc.grid;
        const microGrid = rc.canvasBg.startsWith('rgb(')
            ? rc.grid.replace('rgb(', 'rgba(').replace(')', ',0.18)')
            : rc.grid;

        if (this.cutMode) {
            if (pxOnScreen >= 10) {
                ctx.beginPath();
                ctx.strokeStyle = microGrid;
                ctx.lineWidth = 1 / this.zoomLevel;
                for (let x = 0; x <= contentWidth; x += 1) {
                    ctx.moveTo(x + 0.5 / this.zoomLevel, 0);
                    ctx.lineTo(x + 0.5 / this.zoomLevel, contentHeight);
                }
                for (let y = 0; y <= contentHeight; y += 1) {
                    ctx.moveTo(0, y + 0.5 / this.zoomLevel);
                    ctx.lineTo(contentWidth, y + 0.5 / this.zoomLevel);
                }
                ctx.stroke();
            } else if (pxOnScreen >= 4) {
                ctx.beginPath();
                ctx.strokeStyle = minorGrid;
                ctx.lineWidth = 1 / this.zoomLevel;
                for (let x = 0; x <= contentWidth; x += 4) {
                    ctx.moveTo(x + 0.5 / this.zoomLevel, 0);
                    ctx.lineTo(x + 0.5 / this.zoomLevel, contentHeight);
                }
                for (let y = 0; y <= contentHeight; y += 4) {
                    ctx.moveTo(0, y + 0.5 / this.zoomLevel);
                    ctx.lineTo(contentWidth, y + 0.5 / this.zoomLevel);
                }
                ctx.stroke();
            }
        }

        if (tileOnScreen >= 6) {
            ctx.beginPath();
            ctx.strokeStyle = rc.grid;
            ctx.lineWidth = Math.max(1 / this.zoomLevel, (tileOnScreen >= 20 ? 1.5 : 1) / this.zoomLevel);
            for (let x = 0; x <= this.gridWidth; x++) {
                const px = x * this.tileSize + 0.5 / this.zoomLevel;
                ctx.moveTo(px, 0);
                ctx.lineTo(px, this.gridHeight * this.tileSize);
            }
            for (let y = 0; y <= this.gridHeight; y++) {
                const py = y * this.tileSize + 0.5 / this.zoomLevel;
                ctx.moveTo(0, py);
                ctx.lineTo(this.gridWidth * this.tileSize, py);
            }
            ctx.stroke();
        }

        for (let i = 0; i < this.tileMap.length; i++) {
            const id = this.tileMap[i]; if (!id) continue;
            const t = this.tileTypes[id]; if (!t) continue;
            const x = i % this.gridWidth, y = Math.floor(i / this.gridWidth);
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
                ctx.fillStyle = 'rgba(255,255,0,0.22)'; ctx.fillRect(s.x, s.y, s.width, s.height);
                ctx.strokeStyle = 'yellow'; ctx.strokeRect(s.x, s.y, s.width, s.height);
                ctx.fillStyle = '#ffffff';
                for (const h of this._getSelectionHandles()) {
                    const half = h.size / 2;
                    ctx.fillRect(h.x - half, h.y - half, h.size, h.size);
                    ctx.strokeStyle = '#111';
                    ctx.strokeRect(h.x - half, h.y - half, h.size, h.size);
                    ctx.strokeStyle = 'yellow';
                }
            }
        }
        ctx.restore();
    }

    static open() {
        if (window.tabManager) {
            const existing = window.tabManager.getTabsByType('setshape')[0];
            if (existing) {
                window.tabManager.switchTo(existing.id);
                return;
            }
            const tab = window.tabManager.addTab('setshape', 'Setshape2', { kind: 'setshape' });
            SetshapeEditor._tabId = tab?.id || null;
            return;
        }
        if (SetshapeEditor._dialog) {
            SetshapeEditor._dialog.style.display = 'flex';
            SetshapeEditor._ensureContent();
            SetshapeEditor._dialog.appendChild(SetshapeEditor._content);
            SetshapeEditor._instance?._resizeCanvas();
            SetshapeEditor._instance?._render();
            return;
        }
        const btnStyle = 'background:#3a3a3a;color:#ddd;border:1px solid #0a0a0a;border-top:1px solid #555;border-left:1px solid #555;padding:4px 12px;cursor:pointer;font-family:chevyray,monospace;font-size:12px;';
        const taStyle = 'width:100%;height:260px;background:#1a1a1a;color:#ddd;border:1px solid #3a3a3a;font-family:"Courier New",monospace;font-size:12px;padding:8px;resize:vertical;box-sizing:border-box;white-space:pre;overflow-x:auto;';
        const preStyle = 'width:100%;height:260px;background:#1a1a1a;color:#ddd;border:1px solid #3a3a3a;font-family:"Courier New",monospace;font-size:12px;padding:8px;box-sizing:border-box;white-space:pre-wrap;overflow:auto;margin:0;max-width:100%;word-break:break-all;';
        const dlg = document.createElement('div');
        dlg.id = '_ss2Dialog';
        dlg.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:9000;pointer-events:none;';
        dlg.innerHTML = `<div class="dialog-content" style="display:none;"></div>`;
        document.body.appendChild(dlg);
        SetshapeEditor._dialog = dlg;
        SetshapeEditor._ensureContent(btnStyle, taStyle, preStyle);
        dlg.appendChild(SetshapeEditor._content);
        dlg.style.display = 'flex';

        const dragHandle = SetshapeEditor._content.querySelector('[data-ss2="dragHandle"]');
        const inner = SetshapeEditor._content;
        let _dx = 0, _dy = 0, _dragging = false;
        if (dragHandle) dragHandle.style.cursor = 'move';
        dragHandle?.addEventListener('mousedown', e => {
            if (e.target.tagName === 'BUTTON') return;
            _dragging = true;
            _dx = e.clientX - inner.getBoundingClientRect().left;
            _dy = e.clientY - inner.getBoundingClientRect().top;
            e.preventDefault();
        });
        document.addEventListener('mousemove', e => { if (!_dragging || SetshapeEditor._dialog?.style.display === 'none') return; inner.style.position = 'fixed'; inner.style.left = (e.clientX - _dx) + 'px'; inner.style.top = (e.clientY - _dy) + 'px'; inner.style.margin = '0'; });
        document.addEventListener('mouseup', () => _dragging = false);
        SetshapeEditor._instance?._resizeCanvas();
        SetshapeEditor._instance?._render();
    }

    static _ensureContent(btnStyle = 'background:#3a3a3a;color:#ddd;border:1px solid #0a0a0a;border-top:1px solid #555;border-left:1px solid #555;padding:4px 12px;cursor:pointer;font-family:chevyray,monospace;font-size:12px;', taStyle = 'width:100%;height:260px;background:#1a1a1a;color:#ddd;border:1px solid #3a3a3a;font-family:"Courier New",monospace;font-size:12px;padding:8px;resize:vertical;box-sizing:border-box;white-space:pre;overflow-x:auto;', preStyle = 'width:100%;height:260px;background:#1a1a1a;color:#ddd;border:1px solid #3a3a3a;font-family:"Courier New",monospace;font-size:12px;padding:8px;box-sizing:border-box;white-space:pre-wrap;overflow:auto;margin:0;max-width:100%;word-break:break-all;') {
        if (SetshapeEditor._content) return;
        const wrapper = document.createElement('div');
        wrapper.className = 'dialog-content';
        wrapper.style.cssText = 'background:#1e1e1e;border:1px solid #3a3a3a;display:flex;flex-direction:column;width:980px;height:580px;min-width:720px;min-height:420px;max-width:98vw;max-height:96vh;pointer-events:all;box-shadow:0 8px 32px rgba(0,0,0,0.8);resize:both;overflow:hidden;';
        wrapper.innerHTML = `
<div class="dialog-titlebar" style="display:flex;align-items:center;justify-content:flex-start;background:#2a2a2a;border-bottom:1px solid #111;padding:4px 8px;gap:6px;cursor:move;" data-ss2="dragHandle">
    <button style="${btnStyle}" data-ss2="generateBtn">Generate</button>
    <button style="${btnStyle}" data-ss2="clearBtn">Clear</button>
    <button style="${btnStyle}" data-ss2="importBtn">Import</button>
    <button style="${btnStyle}" data-ss2="loadImageBtn">Load Image</button>
    <button style="${btnStyle}" data-ss2="cutBtn">Setimgpart</button>
    <button style="${btnStyle};display:none;" data-ss2="snapBtn" title="Snap to grid">&#128204; Snap</button>
    <span style="width:1px;height:20px;background:#555;margin:0 2px;"></span>
    <button style="${btnStyle}" data-ss2="pencilBtn" title="Pencil (draw)">&#9998;</button>
    <button style="${btnStyle};display:inline-flex;align-items:center;justify-content:center;" data-ss2="eraserBtn" title="Eraser (clear tiles)"><i class="fas fa-eraser" style="font-size:11px;"></i></button>
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
  <div data-ss2="outputModal" style="display:none;position:fixed;inset:0;background:transparent;z-index:9100;align-items:center;justify-content:center;">
    <div style="background:#1e1e1e;border:1px solid #3a3a3a;width:min(700px,90vw);display:flex;flex-direction:column;overflow:hidden;">
      <div style="background:#2a2a2a;padding:8px 12px;color:#ddd;font-family:chevyray,monospace;">Setshape2 Output</div>
      <div style="padding:14px;display:flex;flex-direction:column;gap:8px;overflow:hidden;">
        <textarea data-ss2="outputText" readonly style="display:none;"></textarea>
        <div data-ss2="outputEditor" style="${preStyle}padding:0;overflow:hidden;resize:none;"></div>
        <div style="color:#aaa;font-size:12px;">Indent: <input type="range" data-ss2="indentSlider" min="0" max="20" value="1" style="width:90px;vertical-align:middle;"> <span data-ss2="indentValue">1</span>&nbsp;&nbsp;<label style="color:#aaa;"><input type="checkbox" data-ss2="gs1Checkbox"> GS1</label></div>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:8px;padding:8px 12px;border-top:1px solid #2a2a2a;">
        <button style="${btnStyle}" data-ss2="copyOutputBtn">Copy</button>
        <button style="${btnStyle}" data-ss2="closeOutputBtn">Close</button>
      </div>
    </div>
  </div>
  <!-- setimgpart modal -->
  <div data-ss2="setimgpartModal" style="display:none;position:fixed;inset:0;background:transparent;z-index:9100;align-items:center;justify-content:center;">
    <div style="background:#1e1e1e;border:1px solid #3a3a3a;min-width:420px;display:flex;flex-direction:column;">
      <div style="background:#2a2a2a;padding:8px 12px;color:#ddd;font-family:chevyray,monospace;">Setimgpart Output</div>
      <div style="padding:14px;">
        <textarea data-ss2="setimgpartText" readonly style="display:none;"></textarea>
        <div data-ss2="setimgpartEditor" style="${preStyle}height:80px;padding:0;overflow:hidden;resize:none;"></div>
      </div>
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
        wrapper.querySelectorAll('[data-ss2$="Modal"]').forEach(m => {
            Object.defineProperty(m.style, '_ss2show', { get() {}, set(v) { m.style.display = v ? 'flex' : 'none'; } });
        });
        SetshapeEditor._content = wrapper;
        new SetshapeEditor(wrapper);
        SetshapeEditor.applyTheme(wrapper);
    }

    static mountInto(host) {
        if (!host) return;
        SetshapeEditor._host = host;
        SetshapeEditor._ensureContent();
        host.innerHTML = '';
        host.appendChild(SetshapeEditor._content);
        const dragHandle = SetshapeEditor._content.querySelector('[data-ss2="dragHandle"]');
        if (dragHandle) dragHandle.style.cursor = 'default';
        const closeBtn = SetshapeEditor._content.querySelector('#_ss2Close');
        if (closeBtn) closeBtn.style.display = 'none';
        SetshapeEditor._content.style.position = '';
        SetshapeEditor._content.style.left = '';
        SetshapeEditor._content.style.top = '';
        SetshapeEditor._content.style.margin = '0';
        SetshapeEditor._content.style.width = '100%';
        SetshapeEditor._content.style.height = '100%';
        SetshapeEditor._content.style.maxWidth = '100%';
        SetshapeEditor._content.style.maxHeight = '100%';
        SetshapeEditor.applyTheme(SetshapeEditor._content);
        SetshapeEditor._instance?._resizeCanvas();
        SetshapeEditor._instance?._render();
    }

    static close() {
        if (window.tabManager) {
            const existing = window.tabManager.getTabsByType('setshape')[0];
            if (existing) {
                window.tabManager.removeTab(existing.id);
                return;
            }
        }
        if (SetshapeEditor._dialog) SetshapeEditor._dialog.style.display = 'none';
    }
}

window.SetshapeEditor = SetshapeEditor;
window.activateSetshapeTab = function() {
    SetshapeEditor.mountInto(document.getElementById('setshapeTabHost'));
    SetshapeEditor.applyTheme();
};
window.deactivateSetshapeTab = function() {};
window.closeSetshapeTab = function() {
    if (SetshapeEditor._host) SetshapeEditor._host.innerHTML = '';
    SetshapeEditor._tabId = null;
    return true;
};
