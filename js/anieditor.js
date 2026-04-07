class AniSprite {
    constructor() {
        this.type = "CUSTOM";
        this.index = 0;
        this.left = 0;
        this.top = 0;
        this.width = 32;
        this.height = 32;
        this.rotation = 0.0;
        this.xscale = 1.0;
        this.yscale = 1.0;
        this._zoom = 1.0;
        this.mode = undefined;
        this.colorEffectEnabled = false; 
        this.colorEffect = {r: 255, g: 255, b: 255, a: 255};
        this.comment = "";
        this.customImageName = "";
        this.m_drawIndex = 0;
        this.attachedSprites = [];
        this.boundingBox = {x: 0, y: 0, width: 32, height: 32};
        this.updateBoundingBox();
    }
    duplicate(newIndex) {
        const retval = new AniSprite();
        retval.index = newIndex;
        retval.attachedSprites = [...this.attachedSprites];
        retval.colorEffect = {...this.colorEffect};
        retval.colorEffectEnabled = this.colorEffectEnabled;
        retval.comment = this.comment;
        retval.type = this.type;
        retval.customImageName = this.customImageName;
        retval.left = this.left;
        retval.top = this.top;
        retval.width = this.width;
        retval.height = this.height;
        retval.rotation = this.rotation;
        retval.xscale = this.xscale;
        retval.yscale = this.yscale;
        retval._zoom = this._zoom;
        retval.mode = this.mode;
        retval.updateBoundingBox();
        return retval;
    }
    updateBoundingBox() {
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const rad = this.rotation * Math.PI / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const w = this.width * this.xscale * (this._zoom || 1.0);
        const h = this.height * this.yscale * (this._zoom || 1.0);
        const corners = [
            {x: -w/2, y: -h/2},
            {x: w/2, y: -h/2},
            {x: w/2, y: h/2},
            {x: -w/2, y: h/2}
        ];
        const rotated = corners.map(p => ({
            x: p.x * cos - p.y * sin + centerX,
            y: p.x * sin + p.y * cos + centerY
        }));
        let minX = Math.min(...rotated.map(p => p.x));
        let minY = Math.min(...rotated.map(p => p.y));
        let maxX = Math.max(...rotated.map(p => p.x));
        let maxY = Math.max(...rotated.map(p => p.y));
        this.boundingBox = {x: minX, y: minY, width: maxX - minX, height: maxY - minY};
    }
}

class FramePieceSprite {
    constructor() {
        this.id = Math.random().toString(36).substr(2, 9);
        this.index = 0;
        this.type = "sprite";
        this.xoffset = 0;
        this.yoffset = 0;
        this.spriteIndex = 0;
        this.spriteName = "";
        this.xscale = 1.0;
        this.yscale = 1.0;
        this._zoom = 1.0;
        this.rotation = 0.0;
    }
    toString(ani) {
        const sprite = ani.getAniSprite(this.spriteIndex, this.spriteName);
        return sprite ? sprite.comment : "unknown";
    }
    getSize(ani) {
        const sprite = ani.getAniSprite(this.spriteIndex, this.spriteName);
        if (sprite) return {width: sprite.width, height: sprite.height};
        return {width: 32, height: 32};
    }
    getBoundingBox(ani) {
        const sprite = ani.getAniSprite(this.spriteIndex, this.spriteName);
        if (sprite) {
            const bb = sprite.boundingBox;
            const pz = this._zoom || 1.0, px = this.xscale * pz, py = this.yscale * pz;
            const rot = this.rotation * Math.PI / 180, cos = Math.cos(rot), sin = Math.sin(rot);
            const cx = sprite.width / 2, cy = sprite.height / 2;
            const corners = [{x:bb.x,y:bb.y},{x:bb.x+bb.width,y:bb.y},{x:bb.x+bb.width,y:bb.y+bb.height},{x:bb.x,y:bb.y+bb.height}];
            const t = corners.map(p => { const dx=(p.x-cx)*px, dy=(p.y-cy)*py; return {x:dx*cos-dy*sin+cx, y:dx*sin+dy*cos+cy}; });
            const minX=Math.min(...t.map(p=>p.x)), minY=Math.min(...t.map(p=>p.y));
            const maxX=Math.max(...t.map(p=>p.x)), maxY=Math.max(...t.map(p=>p.y));
            return {x:this.xoffset+minX, y:this.yoffset+minY, width:maxX-minX, height:maxY-minY};
        }
        return {x: this.xoffset, y: this.yoffset, width: 16, height: 16};
    }
    duplicate() {
        const retval = new FramePieceSprite();
        retval.xoffset = this.xoffset;
        retval.yoffset = this.yoffset;
        retval.spriteIndex = this.spriteIndex;
        retval.spriteName = this.spriteName;
        return retval;
    }
}

class FramePieceSound {
    constructor() {
        this.id = Math.random().toString(36).substr(2, 9);
        this.index = 0;
        this.type = "sound";
        this.xoffset = 0;
        this.yoffset = 0;
        this.fileName = "";
    }
    toString() {
        return `Sound: ${this.fileName}`;
    }
    getSize() {
        return {width: 16, height: 16};
    }
    getBoundingBox() {
        return {x: this.xoffset, y: this.yoffset, width: 16, height: 16};
    }
    duplicate() {
        const retval = new FramePieceSound();
        retval.xoffset = this.xoffset;
        retval.yoffset = this.yoffset;
        retval.fileName = this.fileName;
        return retval;
    }
}

class Frame {
    constructor() {
        this.id = Math.random().toString(36).substr(2, 9);
        this.duration = 50;
        this.pieces = [[], [], [], []];
        this.sounds = [];
        this.boundingBox = {x: 0, y: 0, width: 0, height: 0};
    }
    duplicate() {
        const retval = new Frame();
        retval.duration = this.duration;
        for (let dir = 0; dir < 4; dir++) {
            retval.pieces[dir] = this.pieces[dir].map(p => p.duplicate());
        }
        retval.sounds = this.sounds.map(s => s.duplicate());
        retval.boundingBox = {...this.boundingBox};
        return retval;
    }
}

function generateAnimationId(animation) {
    const str = `${animation.fileName || ""}_${Date.now()}_${Math.random()}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
}

class Animation {
    constructor(name = "") {
        this.fileName = name;
        this.script = "";
        this.nextAni = "";
        this.looped = false;
        this.singleDir = false;
        this.continous = false;
        this.speed = 1.0;
        this.sprites = new Map();
        this.frames = [];
        this.defaultImages = new Map();
        this.nextSpriteIndex = 0;
        this.boundingBox = {x: 0, y: 0, width: 0, height: 0};
        this.undoStack = [];
        this.undoIndex = -1;
        this.historyLoggingEnabled = true;
        this.id = generateAnimationId(this);
    }
    getAniSprite(index, name) {
        if (this.sprites.has(index)) return this.sprites.get(index);
        if (name && name !== "") {
            for (const sprite of this.sprites.values()) {
                if (sprite.customImageName === name) return sprite;
            }
        }
        return null;
    }
    addSprite(sprite) {
        this.sprites.set(sprite.index, sprite);
        if (sprite.index >= this.nextSpriteIndex) this.nextSpriteIndex = sprite.index + 1;
    }
    getSpriteConflicts(startIndex, count) {
        const conflicts = [];
        for (let i = 0; i < count; i++) {
            const existing = this.sprites.get(startIndex + i);
            if (existing) {
                conflicts.push({index: startIndex + i, comment: existing.comment});
            }
        }
        return conflicts;
    }
    getFrame(index) {
        return index >= 0 && index < this.frames.length ? this.frames[index] : null;
    }
    setDefaultImage(name, value) {
        this.defaultImages.set(name.toUpperCase(), value);
    }
    getDefaultImageName(name) {
        return this.defaultImages.get(name.toUpperCase()) || "";
    }
}

const SPRITE_INDEX_STRING = -21374783;
const imageLibrary = new Map();
let volumeIconImage = null;
const PNG_SIG = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
const MNG_SIG = new Uint8Array([0x8A, 0x4D, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
function extractFirstFrame(buffer) {
    const data = new Uint8Array(buffer);
    const view = new DataView(buffer);
    let pos = 8;
    let ihdrStart = -1;
    let iendEnd = -1;
    while (pos < data.length) {
        const length = view.getUint32(pos);
        const type = String.fromCharCode(...data.slice(pos + 4, pos + 8));
        if (type === 'IHDR' && ihdrStart === -1) ihdrStart = pos;
        if (type === 'IEND' && ihdrStart !== -1) {
            iendEnd = pos + length + 12;
            break;
        }
        pos += length + 12;
    }
    if (ihdrStart === -1 || iendEnd === -1) throw new Error('No valid PNG frame found');
    const frameData = data.slice(ihdrStart, iendEnd);
    const pngData = new Uint8Array(PNG_SIG.length + frameData.length);
    pngData.set(PNG_SIG);
    pngData.set(frameData, PNG_SIG.length);
    return pngData;
}
const volumeIconImg = new Image();
volumeIconImg.onload = () => { volumeIconImage = volumeIconImg; };
volumeIconImg.src = "icons/volume-high.svg";
const soundLibrary = new Map();
const activeAudioElements = new Set();
const DEBUG_MODE = false;

function stopAllSounds() {
    for (const audio of soundLibrary.values()) {
        if (!audio.paused) {
            audio.pause();
            audio.currentTime = 0;
        }
    }
    for (const audio of activeAudioElements) {
        if (!audio.paused) {
            audio.pause();
            audio.currentTime = 0;
        }
    }
    activeAudioElements.clear();
}
const ENABLE_F12_LOGGING = false;
let animations = [];
let currentTabIndex = 0;
let currentAnimation = null;
let localFileCache = { images: [], ganis: [], sounds: [], ganiFiles: [] };
let workspaceImageKeys = new Set();

const refreshLocalFileCache = async () => {
    localFileCache.images = [];
    localFileCache.ganis = [];
    localFileCache.sounds = [];
    localFileCache.ganiFiles = [];
    workspaceImageKeys.clear();
};
let currentFrame = 0;
let currentDir = 2;
let selectedPieces = new Set();
let selectedPieceDir = null;
let selectedSpritesForDeletion = new Set();
function f12Log(message) {
    if (!ENABLE_F12_LOGGING) return;
    try {
        const stack = new Error().stack;
        const lines = stack.split('\n');
        let funcName = 'unknown';
        let context = 'no-animation';
        for (let i = 2; i < Math.min(lines.length, 10); i++) {
            const line = lines[i] || '';
            if (!line || line.includes('f12Log')) continue;
            const patterns = [
                /at\s+(?:Object\.)?(\w+)\s*\(/,
                /at\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/,
                /at\s+(\w+)\s*\(/,
                /at\s+([^@\s(]+)/,
                /(\w+)\s*@/
            ];
            for (const pattern of patterns) {
                const match = line.match(pattern);
                if (match && match[1] && match[1] !== 'f12Log' && match[1] !== 'Error' && match[1] !== 'console') {
                    funcName = match[1];
                    if (funcName.includes('.')) {
                        funcName = funcName.split('.').pop();
                    }
                    if (funcName.includes('/') || funcName.includes('\\')) {
                        funcName = funcName.split(/[/\\]/).pop() || 'anonymous';
                    }
                    break;
                }
            }
            if (funcName !== 'unknown') break;
        }
        if (currentAnimation) {
            if (currentAnimation.fileName) {
                context = currentAnimation.fileName;
            } else {
                const tabIndex = animations.indexOf(currentAnimation);
                context = tabIndex >= 0 ? `Animation ${tabIndex + 1}` : 'unnamed';
            }
        }
        if (DEBUG_MODE) f12Log(`[${context}:${funcName}] ${message}`);
    } catch (e) {
        let context = 'no-animation';
        if (currentAnimation) {
            if (currentAnimation.fileName) {
                context = currentAnimation.fileName;
            } else {
                const tabIndex = animations.indexOf(currentAnimation);
                context = tabIndex >= 0 ? `Animation ${tabIndex + 1}` : 'unnamed';
            }
        }
        if (DEBUG_MODE) f12Log(`[${context}:unknown] ${message}`);
    }
}
function getDirIndex(comboIndex) {
    if (currentAnimation && currentAnimation.singleDir) return 0;
    const mapping = [0, 1, 2, 3];
    return mapping[comboIndex] || 0;
}
function getComboIndexFromDirIndex(dirIndex) {
    if (currentAnimation && currentAnimation.singleDir) return 0;
    const mapping = [2, 1, 0, 3];
    return mapping.indexOf(dirIndex);
}
const zoomFactors = [0.25, 0.3, 0.35, 0.4, 0.5, 0.75, 1.0, 2, 3, 4, 8, 12, 16, 24, 32, 48, 64];
const dpr = window.devicePixelRatio || 1;

let editingSprite = null;
let zoomLevel = parseInt(localStorage.getItem("mainCanvasZoom")) || 6;
let spritePreviewZoom = 3;
let spritePreviewPanX = 0;
let spritePreviewPanY = 0;
let spritePreviewPanning = false;
let spritePreviewPanStartX = 0;
let spritePreviewPanStartY = 0;
let spritePreviewPanStartPanX = 0;
let spritePreviewPanStartPanY = 0;
let panX = 0;
let panY = 0;
let isPlaying = false;
let playPosition = 0;
let playStartTime = 0;
let keysSwapped = false;
let backgroundColor = "#006400";
let workingDirectory = "";
let lastWorkingDirectory = localStorage.getItem("ganiEditorLastWorkingDir") || "";
let lastOpenDirectory = localStorage.getItem("ganiEditorLastOpenDir") || "";
let onionSkinEnabled = false;
let splitViewEnabled = localStorage.getItem("ganiEditorSplitView") === "true";
let mirroredActionsEnabled = false;
let pixelGridEnabled = false;
let pixelGridSize = 16;
let maxUndo = 50;
let redrawScheduled = false;
let redrawRafId = null;
let soundIconCache = { yellow: null, green: null };
let lastSerializedState = null;
function findMatchingPiecesAcrossDirections(piece, pieceDir) {
    if (!currentAnimation || !piece || piece.type !== "sprite") return [];
    if (pieceDir === undefined || pieceDir < 0 || pieceDir > 3) {
        const frame = currentAnimation.getFrame(currentFrame);
        if (!frame) return [];
        pieceDir = -1;
        for (let dir = 0; dir < 4; dir++) {
            const pieces = frame.pieces[dir] || [];
            if (pieces.includes(piece)) {
                pieceDir = dir;
                break;
            }
        }
        if (pieceDir === -1) return [];
    }
    const frame = currentAnimation.getFrame(currentFrame);
    if (!frame) return [];
    const matches = [];
    const targetSpriteIndex = piece.spriteIndex;
    const targetSpriteName = piece.spriteName || "";
    for (let dir = 0; dir < 4; dir++) {
        if (dir === pieceDir) continue;
        const pieces = frame.pieces[dir] || [];
        for (const p of pieces) {
            if (p.type === "sprite" && p.spriteIndex === targetSpriteIndex && (p.spriteName || "") === targetSpriteName) {
                matches.push(p);
            }
        }
    }
    return matches;
}
function getCurrentUndoStack() {
    if (!currentAnimation) return [];
    if (!currentAnimation.undoStack) currentAnimation.undoStack = [];
    return currentAnimation.undoStack;
}
function getCurrentUndoIndex() {
    if (!currentAnimation) return -1;
    if (currentAnimation.undoIndex === undefined) currentAnimation.undoIndex = -1;
    return currentAnimation.undoIndex;
}
function setCurrentUndoIndex(value) {
    if (currentAnimation) currentAnimation.undoIndex = value;
}
function getCurrentHistoryLoggingEnabled() {
    if (!currentAnimation) return true;
    if (currentAnimation.historyLoggingEnabled === undefined) currentAnimation.historyLoggingEnabled = true;
    return currentAnimation.historyLoggingEnabled;
}
function setCurrentHistoryLoggingEnabled(value) {
    if (currentAnimation) currentAnimation.historyLoggingEnabled = value;
}
let dragStartState = null;
let clipboardFrames = null;
let clipboardSprite = null;
let clipboardPieces = null;
let _spriteClipboard = null;
let dragButton = null;
let dragOffset = null;
let dragStartMousePos = null;
let pieceInitialPositions = new Map();
let _dragMoveIndicator = null;
let isDragging = false;
let insertPiece = null;
let insertPieces = [];
let selectedAttachedSprite = -1;
let attachedSpriteStartMove = null;
let isPlacingAttachment = false;
let lastMouseX = 0;
let lastMouseY = 0;
let boxSelectStart = null;
let boxSelectEnd = null;
let isBoxSelecting = false;
let boxSelectQuadrant = -1;
let spriteSplitterDragging = false;
let leftCenterSplitterDragging = false;
let centerRightSplitterDragging = false;
let canvasTimelineSplitterDragging = false;
let activeContextMenu = null;

function createSliderSync(numberId, sliderId, getter, setter, onChange = () => {}, undoDesc = "") {
    const numberEl = document.getElementById(numberId);
    const sliderEl = document.getElementById(sliderId);
    if (!numberEl || !sliderEl) return;

    const performChange = (val, saveUndo = false) => {
        const oldState = saveUndo ? serializeAnimationState() : null;
        setter(val);
        sliderEl.value = val;
        onChange();
        if (saveUndo) {
            const newState = serializeAnimationState();
            const desc = typeof undoDesc === 'function' ? undoDesc() : (undoDesc || `${numberId}`);
            addUndoCommand({
                description: desc,
                oldState: oldState,
                newState: newState,
                undo: () => restoreAnimationState(oldState),
                redo: () => restoreAnimationState(newState)
            });
        }
    };

    numberEl.onchange = (e) => {
        const val = parseFloat(e.target.value) || 0;
        performChange(val, true);
    };

    numberEl.oninput = (e) => {
        const val = parseFloat(e.target.value) || 0;
        performChange(val, false);
    };

    let sliderPreChangeState = null;
    sliderEl.addEventListener("mousedown", () => { sliderPreChangeState = serializeAnimationState(); });
    sliderEl.addEventListener("touchstart", () => { sliderPreChangeState = serializeAnimationState(); }, {passive: true});

    sliderEl.oninput = (e) => {
        const val = parseFloat(e.target.value) || 0;
        setter(val);
        numberEl.value = val;
        onChange();
    };

    sliderEl.onchange = (e) => {
        const val = parseFloat(e.target.value) || 0;
        setter(val);
        sliderEl.value = val;
        onChange();
        const oldState = sliderPreChangeState || serializeAnimationState();
        sliderPreChangeState = null;
        const newState = serializeAnimationState();
        if (oldState !== newState) {
            const desc = typeof undoDesc === 'function' ? undoDesc() : (undoDesc || `${numberId}`);
            addUndoCommand({ description: desc, oldState, newState, undo: () => restoreAnimationState(oldState), redo: () => restoreAnimationState(newState) });
        }
    };
}

document.addEventListener("contextmenu", (e) => {
    if (activeContextMenu) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
    }
}, true);

const mainCanvas = document.getElementById("mainCanvas");
const mainCtx = mainCanvas.getContext("2d");
let timelineCanvas = document.getElementById("timelineCanvas");
let spritePreviewCanvas = document.getElementById("spritePreviewCanvas");
const ctx = mainCanvas.getContext("2d");
let timelineCtx = timelineCanvas ? timelineCanvas.getContext("2d") : null;
const previewCtx = spritePreviewCanvas.getContext("2d");
let dragFrame = -1;
let dragStartX = 0;
let dragThreshold = 5;
let isDraggingFrame = false;
let dragCurrentX = 0;
let dragTargetIndex = -1;
let selectedFrames = new Set();
const DEFAULT_KEYBINDS = {
    prevFrame: ",", nextFrame: ".", cycleSprite: "Tab", selectAll: "ctrl+a", layerUp: "]", layerDown: "[",
    undo: "ctrl+z", redo: "ctrl+y", save: "ctrl+s", open: "ctrl+o", resetEditor: "ctrl+r",
    infoDialog: "F1", settingsDialog: "F2", togglePanels: "alt+z", play: " ", zoomIn: "+", zoomOut: "-",
    deselect: "Escape", deletePiece: "Delete",
};
let keybinds = {...DEFAULT_KEYBINDS};
try { const _sk = localStorage.getItem("ganiEditorKeybinds"); if (_sk) Object.assign(keybinds, JSON.parse(_sk)); } catch(e) {}
function saveKeybinds() { localStorage.setItem("ganiEditorKeybinds", JSON.stringify(keybinds)); }
function matchesKeybind(e, binding, opts = {}) {
    if (binding === "+" || binding === "-") return e.key === binding;
    const parts = binding.toLowerCase().split("+");
    const needsCtrl = parts.includes("ctrl"), needsShift = parts.includes("shift"), needsAlt = parts.includes("alt");
    const key = parts[parts.length - 1];
    if (!key) return false;
    if (needsCtrl !== e.ctrlKey || needsAlt !== e.altKey) return false;
    if (!opts.ignoreShift && needsShift !== e.shiftKey) return false;
    return e.key.toLowerCase() === key || e.key === key || e.code.toLowerCase() === `key${key}` || e.code.toLowerCase() === key;
}
function formatKeybind(binding) {
    if (binding === "+") return "+";
    if (binding === "-") return "-";
    return binding.split("+").filter(p => p.length > 0).map(p => {
        const lp = p.toLowerCase();
        if (lp === " ") return "Space";
        if (lp === "escape") return "Esc";
        if (lp === "delete") return "Del";
        if (p === "ctrl") return "Ctrl";
        if (p === "shift") return "Shift";
        if (p === "alt") return "Alt";
        if (p.length === 1) return p;
        return p[0].toUpperCase() + p.slice(1);
    }).join("+");
}
let scrollbarDragStartX = 0;
let scrollbarDragStartScrollX = 0;
let timelineScrollX = 0;
let timelineZoom = 1.0;
let timelineTotalWidth = 0;
let dragTab = -1;
let dragTabStartX = 0;
let isDraggingTab = false;
let dragTabCurrentX = 0;
let dragTabTargetIndex = -1;
let tabDragIndicator = null;
let isRightClickPanning = false;
let rightClickPanStartX = 0;
let rightClickPanStartY = 0;
let rightClickPanStartPanX = 0;
let rightClickPanStartPanY = 0;
let rightClickPanMoved = false;
let rightClickJustDragged = false;
const leftPanel = document.querySelector(".left-panel");
const rightPanel = document.querySelector(".right-panel");
const centerPanel = document.querySelector(".center-panel");
function updateSpinnerStates() {
    document.querySelectorAll('input[type="number"]').forEach(input => {
        const wrapper = input.closest('.number-input-wrapper');
        if (!wrapper) return;
        const spinnerContainer = wrapper.querySelector('.number-spinner-container');
        if (!spinnerContainer) return;
        const spinners = spinnerContainer.querySelectorAll('.number-spinner');
        spinners.forEach(spinner => {
            if (input.disabled) {
                spinner.style.pointerEvents = 'none';
                spinner.style.opacity = '0.5';
            } else {
                spinner.style.pointerEvents = 'auto';
                spinner.style.opacity = '1';
            }
        });
    });
}

function resizeCanvas() {
    const container = centerPanel;
    const dpr = window.devicePixelRatio || 1;
    const containerWidth = centerPanel.clientWidth + 4;
    const containerHeight = container.clientHeight || window.innerHeight;

    if (leftPanel && rightPanel) {
        const leftWidth = parseInt(leftPanel.style.width) || 270;
        const rightWidth = parseInt(rightPanel.style.width) || 250;
        const totalFixedWidth = leftWidth + rightWidth;
        const minCenterWidth = 200;
        const defaultLeftWidth = 270;
        const defaultRightWidth = 250;
        const defaultTotalWidth = defaultLeftWidth + defaultRightWidth;

        if (totalFixedWidth + minCenterWidth > containerWidth) {
            const availableWidth = Math.max(containerWidth - minCenterWidth, 400);
            const ratio = availableWidth / defaultTotalWidth;
            const newLeftWidth = Math.max(150, Math.floor(defaultLeftWidth * ratio));
            const newRightWidth = Math.max(150, Math.floor(defaultRightWidth * ratio));
            leftPanel.style.width = newLeftWidth + "px";
            rightPanel.style.width = newRightWidth + "px";
        } else if (containerWidth > defaultTotalWidth + minCenterWidth + 100) {
            leftPanel.style.width = defaultLeftWidth + "px";
            rightPanel.style.width = defaultRightWidth + "px";
        } else {
            const targetTotalWidth = Math.min(defaultTotalWidth, containerWidth - minCenterWidth - 50);
            const ratio = targetTotalWidth / defaultTotalWidth;
            const newLeftWidth = Math.max(150, Math.floor(defaultLeftWidth * ratio));
            const newRightWidth = Math.max(150, Math.floor(defaultRightWidth * ratio));
            leftPanel.style.width = newLeftWidth + "px";
            rightPanel.style.width = newRightWidth + "px";
        }
    }

    const canvasContainer = document.querySelector(".canvas-container");
    if (canvasContainer) {
        canvasContainer.style.width = "100%";
        canvasContainer.style.height = "100%";
    }
    
    const actualWidth = Math.max(containerWidth, centerPanel.clientWidth || containerWidth);
    const actualHeight = Math.max(containerHeight, centerPanel.clientHeight || containerHeight);
    
    mainCanvas.width = actualWidth * dpr;
    mainCanvas.height = actualHeight * dpr;
    mainCanvas.style.width = "100%";
    mainCanvas.style.height = "100%";
    mainCanvas.style.position = "absolute";
    mainCanvas.style.top = "0";
    mainCanvas.style.left = "0";
    mainCanvas.style.zIndex = "1";
    const canvasControls = document.querySelector(".canvas-controls");
    if (canvasControls) {
        canvasControls.style.left = "10px";
    }
    ctx.scale(dpr, dpr);
    const timelineView = timelineCanvas.parentElement;
    if (timelineView && timelineView.clientWidth > 0) {
        timelineCanvas.width = timelineView.clientWidth;
        timelineCanvas.height = timelineView.clientHeight || 60;
    } else {
        const timelineContainer = document.querySelector(".timeline-container");
        if (timelineContainer && timelineContainer.clientWidth > 0) {
            timelineCanvas.width = timelineContainer.clientWidth;
            const containerHeight = timelineContainer.clientHeight || 100;
            timelineCanvas.height = containerHeight - 20;
        } else {
            timelineCanvas.width = window.innerWidth || 800;
            timelineCanvas.height = 60;
        }
    }
    spritePreviewCanvas.width = spritePreviewCanvas.parentElement.clientWidth;
    spritePreviewCanvas.height = spritePreviewCanvas.parentElement.clientHeight;
    redraw();
    if (currentAnimation) {
        setTimeout(() => {
            let timelineVisible = localStorage.getItem("timelineVisible");
            if (timelineVisible === null) {
                timelineVisible = "true";
                localStorage.setItem("timelineVisible", "true");
            }
            timelineVisible = timelineVisible !== "false";
            const timelineContainer = document.querySelector(".timeline-container");
            const timelineView = document.querySelector(".timeline-view");
            const canvas = document.getElementById("timelineCanvas");
            const canvasTimelineSplitter = document.getElementById("canvasTimelineSplitter");
            if (timelineVisible) {
                drawTimeline();
            if (timelineContainer) {
                timelineContainer.style.display = "flex";
                timelineContainer.style.visibility = "visible";
                    timelineContainer.style.opacity = "1";
            }
            if (timelineView) {
                timelineView.style.display = "block";
                timelineView.style.visibility = "visible";
                    timelineView.style.opacity = "1";
            }
            if (canvas) {
                canvas.style.display = "block";
                canvas.style.visibility = "visible";
                    canvas.style.opacity = "1";
                }
                if (canvasTimelineSplitter) {
                    canvasTimelineSplitter.style.display = "block";
                    canvasTimelineSplitter.style.visibility = "visible";
                    canvasTimelineSplitter.style.opacity = "1";
                }
            } else {
                if (timelineContainer) {
                    timelineContainer.style.setProperty("display", "none", "important");
                    timelineContainer.style.setProperty("visibility", "hidden", "important");
                    timelineContainer.style.setProperty("opacity", "0", "important");
                    timelineContainer.style.setProperty("flex", "0 0 0px", "important");
                    timelineContainer.style.setProperty("height", "0px", "important");
                    const _tw = timelineContainer.closest(".timeline-wrapper");
                    if (_tw) _tw.style.setProperty("min-height", "0", "important");
                }
                if (timelineView) {
                    timelineView.style.setProperty("display", "none", "important");
                    timelineView.style.setProperty("visibility", "hidden", "important");
                    timelineView.style.setProperty("opacity", "0", "important");
                }
                if (canvasTimelineSplitter) {
                    canvasTimelineSplitter.style.setProperty("display", "none", "important");
                    canvasTimelineSplitter.style.setProperty("visibility", "hidden", "important");
                    canvasTimelineSplitter.style.setProperty("opacity", "0", "important");
                }
            }
        }, 10);
    }
}

function getFontFamily(font) {
    const customFonts = ["PressStart2P", "Silkscreen", "Tempus Sans ITC", "MesloLGS NF", "chevyray", "chevyrayOeuf"];
    if (customFonts.includes(font)) {
        return `"${font}", monospace`;
    } else if (font === "monospace") {
        return "monospace";
    } else {
        return font;
    }
}
function lightenColor(color, amount) {
    const num = parseInt(color.replace("#", ""), 16);
    const r = Math.min(255, Math.floor((num >> 16) + amount * (255 - (num >> 16))));
    const g = Math.min(255, Math.floor(((num >> 8) & 0x00FF) + amount * (255 - ((num >> 8) & 0x00FF))));
    const b = Math.min(255, Math.floor((num & 0x0000FF) + amount * (255 - (num & 0x0000FF))));
    return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

function drawGrid(ctx) {
    ctx.imageSmoothingEnabled = false;
    const lightColor = getComputedStyle(document.documentElement).getPropertyValue('--canvas-grid').trim() || lightenColor(backgroundColor, 0.4);
    ctx.strokeStyle = lightColor;
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(0.5, -5000);
    ctx.lineTo(0.5, 10000);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-5000, 0.5);
    ctx.lineTo(10000, 0.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0.5 + 48, 1.5);
    ctx.lineTo(0.5 + 48, 0.5 + 48);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0.5 + 1, 0.5 + 48);
    ctx.lineTo(0.5 + 48, 0.5 + 48);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
}

function drawPixelGrid(ctx) {
    const size = pixelGridSize;
    const range = 512;
    const start = -Math.ceil(range / size) * size;
    const end = Math.ceil(range / size) * size;
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 0.5;
    ctx.setLineDash([]);
    ctx.beginPath();
    for (let x = start; x <= end; x += size) { ctx.moveTo(x, start); ctx.lineTo(x, end); }
    for (let y = start; y <= end; y += size) { ctx.moveTo(start, y); ctx.lineTo(end, y); }
    ctx.stroke();
    ctx.restore();
}

function drawSprite(ctx, sprite, x, y, level = 0, drawnSprites = null) {
    if (level > 3) return;
    if (!sprite) return;
    if (drawnSprites === null) drawnSprites = new Set();
    if (level > 0 && drawnSprites.has(sprite.index)) return;
    if (level > 0) drawnSprites.add(sprite.index);
    ctx.imageSmoothingEnabled = false;
    for (let i = 0; i < sprite.m_drawIndex && i < sprite.attachedSprites.length; i++) {
        const attached = sprite.attachedSprites[i];
        const child = currentAnimation.getAniSprite(attached.index, "");
        if (child && level < 10) drawSprite(ctx, child, x + attached.offset.x, y + attached.offset.y, level + 1, drawnSprites);
    }
    const img = getSpriteImage(sprite);
    const _sz = sprite._zoom || 1.0;
    const _sx = sprite.xscale * _sz, _sy = sprite.yscale * _sz;
    if (img) {
        const imageName = sprite.type === "CUSTOM" ? sprite.customImageName.toLowerCase() : (currentAnimation ? currentAnimation.getDefaultImageName(sprite.type) : "").toLowerCase();
        const isLightImage = (sprite.mode === 0) || (sprite.mode === undefined && localStorage.getItem("editorLightEffects") !== "false" && (imageName.includes("light") || sprite.comment.toLowerCase().includes("light")));
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.translate(Math.round(x), Math.round(y));
        if (sprite.rotation !== 0 || _sx !== 1 || _sy !== 1) {
            ctx.translate(sprite.width / 2, sprite.height / 2);
            ctx.scale(_sx, _sy);
            ctx.rotate(sprite.rotation * Math.PI / 180);
            ctx.translate(-sprite.width / 2, -sprite.height / 2);
        }
        if (isLightImage) {
            const colorKey = sprite.colorEffectEnabled && sprite.colorEffect ? `${sprite.colorEffect.r},${sprite.colorEffect.g},${sprite.colorEffect.b},${sprite.colorEffect.a}` : "none";
            const cacheKey = `${img.src}_${colorKey}`;
            if (!sprite._lightCanvas || sprite._lightCacheKey !== cacheKey) {
                const tempCanvas = document.createElement("canvas");
                tempCanvas.width = sprite.width;
                tempCanvas.height = sprite.height;
                const tempCtx = tempCanvas.getContext("2d");
                tempCtx.imageSmoothingEnabled = false;
                tempCtx.drawImage(img, sprite.left, sprite.top, sprite.width, sprite.height, 0, 0, sprite.width, sprite.height);
        if (sprite.colorEffectEnabled && sprite.colorEffect) {
                    tempCtx.globalCompositeOperation = "multiply";
                    tempCtx.fillStyle = `rgb(${sprite.colorEffect.r}, ${sprite.colorEffect.g}, ${sprite.colorEffect.b})`;
                    tempCtx.fillRect(0, 0, sprite.width, sprite.height);
                    tempCtx.globalCompositeOperation = "destination-in";
                    tempCtx.drawImage(img, sprite.left, sprite.top, sprite.width, sprite.height, 0, 0, sprite.width, sprite.height);
                }
                const imageData = tempCtx.getImageData(0, 0, sprite.width, sprite.height);
                const data = imageData.data;
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    const a = data[i + 3];
                    const brightness = (r + g + b) / 3;
                    if (brightness < 30) {
                        data[i + 3] = 0;
                    } else {
                        const alpha = Math.min(255, brightness * 1.2);
                        data[i + 3] = Math.floor(alpha * (a / 255) * 0.7);
                    }
                }
                tempCtx.putImageData(imageData, 0, 0);
                sprite._lightCanvas = tempCanvas;
                sprite._lightCacheKey = cacheKey;
            }
            ctx.globalCompositeOperation = "lighter";
            ctx.globalAlpha = 1.0;
            ctx.drawImage(sprite._lightCanvas, 0, 0, sprite.width, sprite.height);
            ctx.globalCompositeOperation = "source-over";
        } else if (sprite.mode === 1) {
            const colorKey = sprite.colorEffectEnabled && sprite.colorEffect ? `${sprite.colorEffect.r},${sprite.colorEffect.g},${sprite.colorEffect.b},${sprite.colorEffect.a}` : "none";
            if (!sprite._cachedColorCanvas || sprite._cachedColorKey !== colorKey || sprite._cachedImageSrc !== img.src) {
                const tempCanvas = document.createElement("canvas");
                tempCanvas.width = sprite.width;
                tempCanvas.height = sprite.height;
                const tempCtx = tempCanvas.getContext("2d");
                tempCtx.imageSmoothingEnabled = false;
                tempCtx.drawImage(img, sprite.left, sprite.top, sprite.width, sprite.height, 0, 0, sprite.width, sprite.height);
                if (sprite.colorEffectEnabled && sprite.colorEffect) {
                    tempCtx.globalCompositeOperation = "multiply";
                    tempCtx.fillStyle = `rgb(${sprite.colorEffect.r}, ${sprite.colorEffect.g}, ${sprite.colorEffect.b})`;
                    tempCtx.fillRect(0, 0, sprite.width, sprite.height);
                    tempCtx.globalCompositeOperation = "destination-in";
                    tempCtx.drawImage(img, sprite.left, sprite.top, sprite.width, sprite.height, 0, 0, sprite.width, sprite.height);
                }
                sprite._cachedColorCanvas = tempCanvas;
                sprite._cachedColorKey = colorKey;
                sprite._cachedImageSrc = img.src;
            }
            const alpha = sprite.colorEffectEnabled && sprite.colorEffect ? (sprite.colorEffect.a / 255) : 1.0;
            ctx.globalAlpha = alpha;
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(sprite._cachedColorCanvas, 0, 0);
            ctx.globalAlpha = 1.0;
        } else if (sprite.mode === 2) {
            const colorKey = sprite.colorEffectEnabled && sprite.colorEffect ? `${sprite.colorEffect.r},${sprite.colorEffect.g},${sprite.colorEffect.b},${sprite.colorEffect.a}` : "none";
            if (!sprite._cachedColorCanvas || sprite._cachedColorKey !== colorKey || sprite._cachedImageSrc !== img.src) {
                const tempCanvas = document.createElement("canvas");
                tempCanvas.width = sprite.width;
                tempCanvas.height = sprite.height;
                const tempCtx = tempCanvas.getContext("2d");
                tempCtx.imageSmoothingEnabled = false;
                tempCtx.drawImage(img, sprite.left, sprite.top, sprite.width, sprite.height, 0, 0, sprite.width, sprite.height);
                if (sprite.colorEffectEnabled && sprite.colorEffect) {
                    tempCtx.globalCompositeOperation = "multiply";
                    tempCtx.fillStyle = `rgb(${sprite.colorEffect.r}, ${sprite.colorEffect.g}, ${sprite.colorEffect.b})`;
                    tempCtx.fillRect(0, 0, sprite.width, sprite.height);
                    tempCtx.globalCompositeOperation = "destination-in";
                    tempCtx.drawImage(img, sprite.left, sprite.top, sprite.width, sprite.height, 0, 0, sprite.width, sprite.height);
                }
                sprite._cachedColorCanvas = tempCanvas;
                sprite._cachedColorKey = colorKey;
                sprite._cachedImageSrc = img.src;
            }
            ctx.globalCompositeOperation = "destination-out";
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(sprite._cachedColorCanvas, 0, 0);
            ctx.globalCompositeOperation = "source-over";
        } else if (sprite.colorEffectEnabled && sprite.colorEffect) {
            const colorKey = `${sprite.colorEffect.r},${sprite.colorEffect.g},${sprite.colorEffect.b},${sprite.colorEffect.a}`;
            if (!sprite._cachedColorCanvas || sprite._cachedColorKey !== colorKey || sprite._cachedImageSrc !== img.src) {
            const tempCanvas = document.createElement("canvas");
            tempCanvas.width = sprite.width;
            tempCanvas.height = sprite.height;
            const tempCtx = tempCanvas.getContext("2d");
                tempCtx.imageSmoothingEnabled = false;
            tempCtx.drawImage(img, sprite.left, sprite.top, sprite.width, sprite.height, 0, 0, sprite.width, sprite.height);
            tempCtx.globalCompositeOperation = "multiply";
            tempCtx.fillStyle = `rgb(${sprite.colorEffect.r}, ${sprite.colorEffect.g}, ${sprite.colorEffect.b})`;
            tempCtx.fillRect(0, 0, sprite.width, sprite.height);
            tempCtx.globalCompositeOperation = "destination-in";
            tempCtx.drawImage(img, sprite.left, sprite.top, sprite.width, sprite.height, 0, 0, sprite.width, sprite.height);
                sprite._cachedColorCanvas = tempCanvas;
                sprite._cachedColorKey = colorKey;
                sprite._cachedImageSrc = img.src;
            }
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(sprite._cachedColorCanvas, 0, 0);
        } else {
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(img, sprite.left, sprite.top, sprite.width, sprite.height, 0, 0, sprite.width, sprite.height);
        }
        ctx.restore();
    } else {
        ctx.save();
        ctx.translate(x, y);
        if (sprite.rotation !== 0 || _sx !== 1 || _sy !== 1) {
            ctx.translate(sprite.width / 2, sprite.height / 2);
            ctx.scale(_sx, _sy);
            ctx.rotate(sprite.rotation * Math.PI / 180);
            ctx.translate(-sprite.width / 2, -sprite.height / 2);
        }
        ctx.globalAlpha = 0.65;
        const placeholderWidth = sprite.width > 0 ? sprite.width : 32;
        const placeholderHeight = sprite.height > 0 ? sprite.height : 32;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, placeholderWidth, placeholderHeight);
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, placeholderWidth, placeholderHeight);
        ctx.strokeStyle = "#ff0000";
        ctx.beginPath();
        ctx.moveTo(2, 2);
        ctx.lineTo(placeholderWidth - 2, placeholderHeight - 2);
        ctx.moveTo(2, placeholderHeight - 2);
        ctx.lineTo(placeholderWidth - 2, 2);
        ctx.stroke();
        ctx.restore();
    }
    for (let i = sprite.m_drawIndex; i < sprite.attachedSprites.length; i++) {
        const attached = sprite.attachedSprites[i];
        const child = currentAnimation.getAniSprite(attached.index, "");
        if (child && level < 10) drawSprite(ctx, child, x + attached.offset.x, y + attached.offset.y, level + 1, drawnSprites);
    }
}

function getSpriteImage(sprite) {
    let img = null;
    let imageKey = null;
    if (sprite.type === "CUSTOM") {
        imageKey = sprite.customImageName.toLowerCase();
        img = imageLibrary.get(imageKey) || null;
    } else {
    let defaultName = currentAnimation ? currentAnimation.getDefaultImageName(sprite.type) : "";
    if (defaultName && imageLibrary.has(defaultName.toLowerCase())) {
            imageKey = defaultName.toLowerCase();
            img = imageLibrary.get(imageKey);
        } else {
    const fallbackNames = {
        "SHIELD": "shield1.png",
        "SWORD": "sword1.png",
        "HEAD": "head19.png",
        "BODY": "body.png",
        "HORSE": "ride.png",
        "PICS": "pics1.png",
        "SPRITES": "sprites.png"
    };
    if (!defaultName) {
        const fallback = fallbackNames[sprite.type];
        if (fallback && imageLibrary.has(fallback.toLowerCase())) {
                    imageKey = fallback.toLowerCase();
                    img = imageLibrary.get(imageKey);
        }
    }
            if (!img) {
        for (const otherAni of animations) {
            const otherDefault = otherAni.getDefaultImageName(sprite.type);
            if (otherDefault && imageLibrary.has(otherDefault.toLowerCase())) {
                defaultName = otherDefault;
                        imageKey = defaultName.toLowerCase();
                        img = imageLibrary.get(imageKey);
                        break;
            }
        }
    }
            if (!img) {
    const fallback = fallbackNames[sprite.type];
    if (fallback && imageLibrary.has(fallback.toLowerCase())) {
                    imageKey = fallback.toLowerCase();
                    img = imageLibrary.get(imageKey);
                }
            }
        }
    }
    if (!img && _isTauri && imageKey) {
        _tauri.core.invoke('resolve_path', { name: imageKey }).then(filePath => {
            if (filePath) loadImageFromPath(filePath, imageKey).then(() => { imageLibrary.has(imageKey) && requestAnimationFrame(redraw); }).catch(() => {});
        }).catch(() => {});
    }
    return img;
}

async function loadLocalImages(loading) {
    const updateProgress = (current, total) => {
        if (loading) {
            const percent = total > 0 ? Math.round((current / total) * 100) : 0;
            loading.update(`Loading Gani Editor... ${percent}%`);
        }
    };
    const fallbackImages = ["2002_32x32sprites-flame.png","arrowsbox.png","baddyblue.png","baddydragon.png","baddygold.png","baddygray.png","baddyhare.png","baddylizardon.png","baddyninja.png","baddyoctopus.png","baddyred.png","baddytest.png","bcalarmclock.png","bigshield.png","block.png","bluelampani.mng","bluelampani2.mng","blueletters.png","body.png","body2.png","body3.png","body4.png","bomb1.png","bomb2.png","brother1.png","brother2.png","bshield0.png","chest.png","chestopen.png","door.png","door1.png","editorcursor.png","emoticon_AFK_stay.mng","emoticon_BRB_stay.mng","emoticon_conf.png","emoticon_Dgrin.png","emoticon_Eyes.mng","emoticon_Frown.png","emoticon_Grr.png","emoticon_Heart.png","emoticon_Idea.png","emoticon_jpm_stay.mng","emoticon_kitty.png","emoticon_LOL.mng","emoticon_Maybe.png","emoticon_Ncool.png","emoticon_Ohh.png","emoticon_Ptongue.mng","emoticon_Qphone_stay.png","emoticon_ROFL.mng","emoticon_Smile.png","emoticon_Tears.mng","emoticon_Umad.png","emoticon_Vsorry.mng","emoticon_Wink.png","emoticon_XX.png","emoticon_Yummy.png","emoticon_Zzz_stay.mng","emoticonbubbles.png","emoticonmicro.png","emotions_template.png","g4_animation_fire.gif","g4_particle_bluelight.png","g4_particle_bluex.png","g4_particle_bubble.png","g4_particle_cloud.png","g4_particle_halo.png","g4_particle_leaf.png","g4_particle_minus.png","g4_particle_ring.png","g4_particle_sbubble.png","g4_particle_smoke.png","g4_particle_spark.png","g4_particle_sun.png","g4_particle_tornado.png","g4_particle_whitespot.png","g4_particle_x.png","g4_particle_yellowlight.png","gate1.png","gate2.png","ghostanimation.png","ghostshadow.png","graal2002letters.png","gralats.png","hat0.png","hat1.png","hat2.png","haticon.png","head0.png","head19.png","head23.png","headnpc.png","khairs0.png","khead0.png","klegs0.png","kmarms100.png","kmbody100.png","lamps_wood.png","letters.png","light2.png","opps.png","pics1.png","ride.png","ride2.png","ride3.png","shield1.png","shield2.png","shield3.png","skip_icon.png","skip.png","sprites.png","state.png","sword1.png","treeview_foldericons.png","tutorial_arrowdown.png"];
    let imageFiles = [];
    try {
        const response = await fetch('images/');
        if (response.ok) {
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const links = doc.querySelectorAll('a[href]');
            for (const link of links) {
                const href = link.getAttribute('href');
                if (href && !href.endsWith('/') && !href.startsWith('?') && !href.startsWith('#') && !href.startsWith('../')) {
                    const lowerHref = href.toLowerCase();
                    if (lowerHref.endsWith('.png') || lowerHref.endsWith('.gif') || lowerHref.endsWith('.jpg') || lowerHref.endsWith('.jpeg') || lowerHref.endsWith('.bmp') || lowerHref.endsWith('.mng')) {
                        imageFiles.push(href);
                    }
                }
            }
        }
    } catch (e) {
        if (DEBUG_MODE) f12Log('Dynamic image loading failed, using fallback list');
    }
    if (imageFiles.length === 0) imageFiles = fallbackImages;
    const totalFiles = imageFiles.length;
    const chunkSize = 10;
    let loadedCount = 0;
    updateProgress(0, totalFiles);
    for (let i = 0; i < imageFiles.length; i += chunkSize) {
        const chunk = imageFiles.slice(i, i + chunkSize);
        await Promise.all(chunk.map(fileName => {
            if (!imageLibrary.has(fileName.toLowerCase())) {
                return new Promise(resolve => {
                    loadImageFromUrl(`images/${fileName}`, fileName.toLowerCase())
                        .then(() => {
                            loadedCount++;
                            updateProgress(loadedCount, totalFiles);
                        resolve();
                        })
                        .catch(() => {
                            loadedCount++;
                            updateProgress(loadedCount, totalFiles);
                            resolve();
                        });
                });
            } else {
                loadedCount++;
                updateProgress(loadedCount, totalFiles);
            return Promise.resolve();
            }
        }));
        await new Promise(resolve => setTimeout(resolve, 0));
    }
}

function redraw() {
    if (redrawScheduled) return;
    redrawScheduled = true;
    if (redrawRafId !== null) {
        cancelAnimationFrame(redrawRafId);
    }
    redrawRafId = requestAnimationFrame(() => {
        redrawScheduled = false;
        redrawRafId = null;
    const ctx = mainCtx;
        ctx.imageSmoothingEnabled = false;
    const width = mainCanvas.width / dpr;
    const height = mainCanvas.height / dpr;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
    if (!currentAnimation) {
        drawTimeline();
        return;
    }
    const scale = zoomFactors[zoomLevel] || 1.0;
    const frame = currentAnimation.getFrame(currentFrame);
    if (splitViewEnabled && !currentAnimation.singleDir && frame) {
        const quadWidth = width / 2;
        const quadHeight = height / 2;
        const dirNames = ["UP", "LEFT", "DOWN", "RIGHT"];
        for (let i = 0; i < 4; i++) {
            const quadX = (i % 2) * quadWidth;
            const quadY = Math.floor(i / 2) * quadHeight;
            ctx.save();
            ctx.beginPath();
            ctx.rect(quadX, quadY, quadWidth, quadHeight);
            ctx.clip();
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(quadX, quadY, quadWidth, quadHeight);
            ctx.restore();
            ctx.save();
            ctx.beginPath();
            ctx.rect(quadX, quadY, quadWidth, quadHeight);
            ctx.clip();
            drawQuadrant(ctx, frame, i, quadX, quadY, quadWidth, quadHeight, scale, panX, panY);
            ctx.restore();
            ctx.save();
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 14px 'chevyray', monospace";
            ctx.textAlign = "right";
            ctx.textBaseline = "top";
            ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
            ctx.shadowBlur = 3;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            ctx.fillText(dirNames[i], quadX + quadWidth - 8, quadY + 8);
            ctx.restore();
        }
        ctx.save();
        ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--quadrant-divider').trim() || "#404040";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        ctx.restore();
    } else {
    ctx.save();
    ctx.translate(width / 2 + panX, height / 2 + panY);
    ctx.scale(scale, scale);
            const showGrid = localStorage.getItem("editorShowGrid") !== "false";
            if (showGrid) {
    drawGrid(ctx);
            }
    if (pixelGridEnabled) drawPixelGrid(ctx);
    if (frame) {
        if (onionSkinEnabled) {
            if (currentFrame > 0) {
                const prevFrame = currentAnimation.getFrame(currentFrame - 1);
                if (prevFrame) {
                    ctx.globalAlpha = 0.3;
                    drawFrame(ctx, prevFrame, currentDir);
                    ctx.globalAlpha = 1.0;
                }
            }
            drawFrame(ctx, frame, currentDir);
            if (currentFrame < currentAnimation.frames.length - 1) {
                const nextFrame = currentAnimation.getFrame(currentFrame + 1);
                if (nextFrame) {
                    ctx.globalAlpha = 0.3;
                    drawFrame(ctx, nextFrame, currentDir);
                    ctx.globalAlpha = 1.0;
                }
            }
        } else {
            drawFrame(ctx, frame, currentDir);
        }
        }
        ctx.restore();
    }
    if (insertPiece) {
        const sprite = currentAnimation.getAniSprite(insertPiece.spriteIndex, insertPiece.spriteName);
        if (sprite) {
            const rect = mainCanvas.getBoundingClientRect();
            const zoom = zoomFactors[zoomLevel] || 1.0;
            const mouseX = (lastMouseX || 0) - rect.left;
            const mouseY = (lastMouseY || 0) - rect.top;
            if (splitViewEnabled && !currentAnimation.singleDir) {
                const quadWidth = width / 2;
                const quadHeight = height / 2;
                const quadIndex = Math.floor(mouseY / quadHeight) * 2 + Math.floor(mouseX / quadWidth);
                const dir = Math.min(3, Math.max(0, quadIndex));
                const quadX = (quadIndex % 2) * quadWidth;
                const quadY = Math.floor(quadIndex / 2) * quadHeight;
                const worldX = (mouseX - quadX - quadWidth / 2 - panX) / zoom;
                const worldY = (mouseY - quadY - quadHeight / 2 - panY) / zoom;
                insertPiece.xoffset = Math.floor(0.5 + worldX - insertPiece.dragOffset.x);
                insertPiece.yoffset = Math.floor(0.5 + worldY - insertPiece.dragOffset.y);
                ctx.save();
                ctx.beginPath();
                ctx.rect(quadX, quadY, quadWidth, quadHeight);
                ctx.clip();
                ctx.translate(quadX + quadWidth / 2 + panX, quadY + quadHeight / 2 + panY);
                ctx.scale(zoom, zoom);
                drawSprite(ctx, sprite, insertPiece.xoffset, insertPiece.yoffset);
                ctx.restore();
            } else {
            const worldX = (mouseX - panX - width / 2) / zoom;
            const worldY = (mouseY - panY - height / 2) / zoom;
            insertPiece.xoffset = Math.floor(0.5 + worldX - insertPiece.dragOffset.x);
            insertPiece.yoffset = Math.floor(0.5 + worldY - insertPiece.dragOffset.y);
                ctx.save();
                ctx.translate(width / 2 + panX, height / 2 + panY);
                ctx.scale(zoom, zoom);
            drawSprite(ctx, sprite, insertPiece.xoffset, insertPiece.yoffset);
                ctx.restore();
        }
    }
    }
    drawTimeline();
    if (editingSprite) drawSpritePreview();
    if (isBoxSelecting && boxSelectStart && boxSelectEnd) {
        const zoom = zoomFactors[zoomLevel] || 1.0;
        const _boxColor = getComputedStyle(document.documentElement).getPropertyValue("--selection-border-color").trim() || localStorage.getItem("editorSelectionBorderColor") || "#00ff00";
        const _drawBoxSelect = (sx1, sy1, sx2, sy2) => {
            const rx = Math.min(sx1, sx2), ry = Math.min(sy1, sy2), rw = Math.abs(sx2 - sx1), rh = Math.abs(sy2 - sy1);
            ctx.strokeStyle = _boxColor;
            ctx.fillStyle = _boxColor + "22";
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.fillRect(rx, ry, rw, rh);
            ctx.strokeRect(rx, ry, rw, rh);
            ctx.setLineDash([]);
        };
        if (splitViewEnabled && !currentAnimation.singleDir) {
            if (boxSelectQuadrant >= 0 && boxSelectQuadrant < 4) {
                const quadWidth = width / 2, quadHeight = height / 2;
                const quadX = (boxSelectQuadrant % 2) * quadWidth;
                const quadY = Math.floor(boxSelectQuadrant / 2) * quadHeight;
                ctx.save();
                ctx.beginPath();
                ctx.rect(quadX, quadY, quadWidth, quadHeight);
                ctx.clip();
                _drawBoxSelect(boxSelectStart.x * zoom + quadX + quadWidth / 2 + panX, boxSelectStart.y * zoom + quadY + quadHeight / 2 + panY, boxSelectEnd.x * zoom + quadX + quadWidth / 2 + panX, boxSelectEnd.y * zoom + quadY + quadHeight / 2 + panY);
                ctx.restore();
            }
        } else {
            _drawBoxSelect(boxSelectStart.x * zoom + width / 2 + panX, boxSelectStart.y * zoom + height / 2 + panY, boxSelectEnd.x * zoom + width / 2 + panX, boxSelectEnd.y * zoom + height / 2 + panY);
        }
    }
    if (_dragMoveIndicator && isDragging) {
        const zoom = zoomFactors[zoomLevel] || 1.0;
        const _drawDragIndicator = (centerX, centerY) => {
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.scale(zoom, zoom);
            for (const [piece, startPos] of _dragMoveIndicator.startPositions) {
                const bb = piece.getBoundingBox(currentAnimation);
                if (!bb) continue;
                const hw = bb.width / 2, hh = bb.height / 2;
                const sx = startPos.x + hw, sy = startPos.y + hh;
                const cx = piece.xoffset + hw, cy = piece.yoffset + hh;
                ctx.setLineDash([6 / zoom, 6 / zoom]);
                ctx.strokeStyle = "rgba(255,200,0,0.7)";
                ctx.lineWidth = 2.5 / zoom;
                ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(cx, cy); ctx.stroke();
                ctx.setLineDash([]);
                ctx.beginPath(); ctx.arc(sx, sy, 9 / zoom, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(255,200,0,0.35)"; ctx.fill();
                ctx.strokeStyle = "rgba(255,200,0,1)"; ctx.lineWidth = 2.5 / zoom; ctx.stroke();
            }
            ctx.restore();
        };
        if (splitViewEnabled && !currentAnimation.singleDir && selectedPieceDir !== null) {
            const quadWidth = width / 2, quadHeight = height / 2;
            const quadX = (selectedPieceDir % 2) * quadWidth;
            const quadY = Math.floor(selectedPieceDir / 2) * quadHeight;
            _drawDragIndicator(quadX + quadWidth / 2 + panX, quadY + quadHeight / 2 + panY);
        } else {
            _drawDragIndicator(width / 2 + panX, height / 2 + panY);
        }
    }
    if (insertPieces.length > 0 && insertPiece) {
        const rect = mainCanvas.getBoundingClientRect();
        const zoom = zoomFactors[zoomLevel] || 1.0;
        const mouseX = (lastMouseX || 0) - rect.left;
        const mouseY = (lastMouseY || 0) - rect.top;
        const worldX = (mouseX - panX - width / 2) / zoom;
        const worldY = (mouseY - panY - height / 2) / zoom;
        const baseX = Math.floor(0.5 + worldX - insertPiece.dragOffset.x);
        const baseY = Math.floor(0.5 + worldY - insertPiece.dragOffset.y);
        for (const ep of insertPieces) {
            const eSprite = currentAnimation.getAniSprite(ep.spriteIndex, ep.spriteName);
            if (!eSprite) continue;
            ep.xoffset = baseX; ep.yoffset = baseY;
            ctx.save();
            ctx.translate(width / 2 + panX, height / 2 + panY);
            ctx.scale(zoom, zoom);
            drawSprite(ctx, eSprite, ep.xoffset, ep.yoffset);
            ctx.restore();
        }
    }
    if (insertPiece) {
        mainCanvas.style.cursor = "crosshair";
    } else {
        mainCanvas.style.cursor = "default";
    }
    });
}

function drawFrame(ctx, frame, dir) {
    if (!frame) return;
    ctx.imageSmoothingEnabled = false;
    const actualDir = currentAnimation.singleDir ? 0 : (typeof dir === 'number' ? getDirIndex(dir) : getDirIndex(dir));
    const pieces = frame.pieces[actualDir] || [];
    if (pieces.length === 0 && frame.pieces.some(dp => dp.length > 0)) {
        const dirsWithPieces = frame.pieces.map((dp, idx) => dp.length > 0 ? idx : -1).filter(idx => idx >= 0);
        f12Log(`drawFrame: dir=${dir}, actualDir=${actualDir}, pieces.length=${pieces.length}, but frame has pieces in dirs: [${dirsWithPieces.join(', ')}]`);
    }
    for (const piece of pieces) {
        if (piece.type === "sprite") {
            const sprite = currentAnimation.getAniSprite(piece.spriteIndex, piece.spriteName);
            if (sprite) {
                const isSelected = selectedPieces.has(piece);
                if (isSelected) {
                    const _rs2 = getComputedStyle(document.documentElement);
                    const borderColor = _rs2.getPropertyValue('--selection-border-color').trim() || localStorage.getItem("editorSelectionBorderColor") || "#00ff00";
                    const _cssThick = _rs2.getPropertyValue('--selection-border-thickness').trim();
                    const borderThickness = _cssThick ? parseFloat(_cssThick) : (parseInt(localStorage.getItem("editorSelectionBorderThickness")) || 2);
                    const _cssOpacity = _rs2.getPropertyValue('--selection-border-opacity').trim();
                    const borderOpacity = _cssOpacity ? parseFloat(_cssOpacity) : (parseInt(localStorage.getItem("editorSelectionBorderOpacity") ?? "100") / 100);
                    ctx.save();
                    ctx.globalAlpha = borderOpacity;
                    ctx.strokeStyle = borderColor;
                    ctx.lineWidth = borderThickness;
                    const bb = piece.getBoundingBox(currentAnimation);
                    ctx.strokeRect(bb.x - borderThickness, bb.y - borderThickness, bb.width + borderThickness * 2, bb.height + borderThickness * 2);
                    ctx.restore();
                }
                ctx.save();
                ctx.imageSmoothingEnabled = false;
                ctx.translate(Math.round(piece.xoffset), Math.round(piece.yoffset));
                const _pz = piece._zoom || 1.0;
                const _px = piece.xscale * _pz, _py = piece.yscale * _pz;
                if (piece.rotation !== 0 || _px !== 1 || _py !== 1) {
                    const spriteSize = piece.getSize(currentAnimation);
                    ctx.translate(spriteSize.width / 2, spriteSize.height / 2);
                    ctx.scale(_px, _py);
                    ctx.rotate(piece.rotation * Math.PI / 180);
                    ctx.translate(-spriteSize.width / 2, -spriteSize.height / 2);
                }
                drawSprite(ctx, sprite, 0, 0);
                ctx.restore();
            }
        } else if (piece.type === "sound") {
            ctx.fillStyle = "#ffff00";
            ctx.fillRect(piece.xoffset, piece.yoffset, 16, 16);
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 1;
            ctx.strokeRect(piece.xoffset, piece.yoffset, 16, 16);
        }
    }
    if (frame.sounds && frame.sounds.length > 0) {
        for (const sound of frame.sounds) {
            const isSelected = selectedPieces.has(sound);
            if (volumeIconImage) {
                ctx.save();
                ctx.globalAlpha = 1;
                const iconSize = 16;
                const x = sound.xoffset - iconSize / 2;
                const y = sound.yoffset - iconSize / 2;
                const cacheKey = isSelected ? "green" : "yellow";
                let cachedIcon = soundIconCache[cacheKey];
                if (!cachedIcon) {
                    cachedIcon = document.createElement("canvas");
                    cachedIcon.width = iconSize;
                    cachedIcon.height = iconSize;
                    const tempCtx = cachedIcon.getContext("2d");
                    tempCtx.drawImage(volumeIconImage, 0, 0, iconSize, iconSize);
                    const imageData = tempCtx.getImageData(0, 0, iconSize, iconSize);
                    const data = imageData.data;
                    const targetColor = isSelected ? {r: 0, g: 255, b: 0} : {r: 255, g: 204, b: 0};
                    for (let i = 0; i < data.length; i += 4) {
                        if (data[i + 3] > 0) {
                            data[i] = targetColor.r;
                            data[i + 1] = targetColor.g;
                            data[i + 2] = targetColor.b;
                        }
                    }
                    tempCtx.putImageData(imageData, 0, 0);
                    soundIconCache[cacheKey] = cachedIcon;
                }
                ctx.drawImage(cachedIcon, x, y);
                if (isSelected) {
                    const _rs2 = getComputedStyle(document.documentElement);
                    const borderColor = _rs2.getPropertyValue('--selection-border-color').trim() || localStorage.getItem("editorSelectionBorderColor") || "#00ff00";
                    const _cssThick = _rs2.getPropertyValue('--selection-border-thickness').trim();
                    const borderThickness = _cssThick ? parseFloat(_cssThick) : (parseInt(localStorage.getItem("editorSelectionBorderThickness")) || 2);
                    const _cssOpacity = _rs2.getPropertyValue('--selection-border-opacity').trim();
                    const borderOpacity = _cssOpacity ? parseFloat(_cssOpacity) : (parseInt(localStorage.getItem("editorSelectionBorderOpacity") ?? "100") / 100);
                    ctx.save();
                    ctx.globalAlpha = borderOpacity;
                    ctx.strokeStyle = borderColor;
                    ctx.lineWidth = borderThickness;
                    ctx.strokeRect(x - borderThickness, y - borderThickness, iconSize + borderThickness * 2, iconSize + borderThickness * 2);
                    ctx.restore();
                }
                ctx.restore();
            } else {
            ctx.fillStyle = isSelected ? "#00ff00" : "#ffcc00";
            ctx.font = "900 16px 'Font Awesome 6 Free'";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("\uf028", sound.xoffset, sound.yoffset);
            }
        }
    }
}

function drawQuadrant(ctx, frame, dir, quadrantX, quadrantY, quadrantWidth, quadrantHeight, scale, panX, panY) {
    ctx.save();
    ctx.translate(quadrantX + quadrantWidth / 2 + panX, quadrantY + quadrantHeight / 2 + panY);
    ctx.scale(scale, scale);
    const showGrid = localStorage.getItem("editorShowGrid") !== "false";
    if (showGrid) {
        drawGrid(ctx);
    }
    if (pixelGridEnabled) drawPixelGrid(ctx);
    if (onionSkinEnabled) {
        if (currentFrame > 0) {
            const prevFrame = currentAnimation.getFrame(currentFrame - 1);
            if (prevFrame) {
                ctx.globalAlpha = 0.3;
                drawFrame(ctx, prevFrame, dir);
                ctx.globalAlpha = 1.0;
            }
        }
        drawFrame(ctx, frame, dir);
        if (currentFrame < currentAnimation.frames.length - 1) {
            const nextFrame = currentAnimation.getFrame(currentFrame + 1);
            if (nextFrame) {
                ctx.globalAlpha = 0.3;
                drawFrame(ctx, nextFrame, dir);
                ctx.globalAlpha = 1.0;
            }
        }
    } else {
        drawFrame(ctx, frame, dir);
    }
    ctx.restore();
}

function getTimelineBackgroundColor() {
    const cssBg = getComputedStyle(document.documentElement).getPropertyValue('--timeline-bg').trim();
    if (cssBg) return cssBg;
    const scheme = localStorage.getItem("editorColorScheme") || "default";
    if (scheme === "default") return "#2b2b2b";
    const schemes = {
        "fusion-light": { panel: "#ffffff" },
        "fusion-dark": { panel: "#2d2d2d" },
        "dark-style": { panel: "#252525" },
        "dark-orange": { panel: "#3a2f2a" },
        "aqua": { panel: "#1a2a2f" },
        "elegant-dark": { panel: "#2d2d2d" },
        "material-dark": { panel: "#1e1e1e" },
        "light-style": { panel: "#ffffff" },
        "ayu-mirage": { panel: "#232834" },
        "dracula": { panel: "#343746" }
    };
    return schemes[scheme]?.panel || "#2b2b2b";
}
function drawTimeline() {
    if (!timelineCanvas) {
        timelineCanvas = document.getElementById("timelineCanvas");
        if (!timelineCanvas) return;
        timelineCtx = timelineCanvas.getContext("2d");
    }
    if (!currentAnimation) {
        const width = timelineCanvas.width || timelineView.clientWidth || window.innerWidth;
        const height = timelineCanvas.height || timelineView.clientHeight || 116;
        timelineCanvas.width = width;
        timelineCanvas.height = height;
        timelineCtx.fillStyle = getTimelineBackgroundColor();
        timelineCtx.fillRect(0, 0, width, height);
        return;
    }
    if (!timelineCanvas) {
        timelineCanvas = document.getElementById("timelineCanvas");
        if (!timelineCanvas) return;
        timelineCtx = timelineCanvas.getContext("2d");
    }
    if (!timelineCtx) return;
    const timelineView = timelineCanvas.parentElement;
    let canvasWidth = 800;
    if (timelineView && timelineView.clientWidth > 0) {
        canvasWidth = timelineView.clientWidth;
    } else {
        const container = document.querySelector(".timeline-container");
        if (container && container.clientWidth > 0) {
            canvasWidth = container.clientWidth;
        } else {
            canvasWidth = window.innerWidth || 800;
        }
    }
    timelineCanvas.width = canvasWidth;
    const viewHeight = timelineView ? timelineView.clientHeight : 60;
    timelineCanvas.height = viewHeight || 60;
    const width = timelineCanvas.width;
    const height = timelineCanvas.height;
    timelineCtx.clearRect(0, 0, width, height);
    timelineCtx.fillStyle = getTimelineBackgroundColor();
    timelineCtx.fillRect(0, 0, width, height);
    const headerHeight = 20;
    const _rsT = getComputedStyle(document.documentElement);
    const rulerBg = _rsT.getPropertyValue('--timeline-ruler-bg').trim() || "#808080";
    const rulerTick = _rsT.getPropertyValue('--timeline-ruler-tick').trim() || "#e0e0e0";
    const rulerText = _rsT.getPropertyValue('--timeline-ruler-text').trim() || "#ffffff";
    if (currentAnimation.frames.length === 0) {
        timelineCtx.fillStyle = rulerBg;
        timelineCtx.fillRect(-2, 0, width + 4, headerHeight);
        timelineCtx.font = "11px Arial";
        timelineCtx.textAlign = "left";
        timelineCtx.strokeStyle = rulerTick;
        timelineCtx.lineWidth = 1;
        const pixPerMs = 1.5 * timelineZoom;
        const interval = Math.max(50, Math.round(50 / pixPerMs));
        let lastLabelRight = -999;
        for (let t = 0; ; t += interval) {
            const rx = 2 - timelineScrollX + t * pixPerMs;
            if (rx > width + 1) break;
            if (rx >= -1) {
                timelineCtx.beginPath();
                timelineCtx.moveTo(rx, 8);
                timelineCtx.lineTo(rx, headerHeight - 1);
                timelineCtx.stroke();
                const timeStr = (t / 1000.0).toFixed(3) + "s";
                const labelX = rx + 2;
                if (labelX > lastLabelRight) {
                    timelineCtx.fillStyle = rulerText;
                    timelineCtx.fillText(timeStr, labelX, 1);
                    lastLabelRight = labelX + timelineCtx.measureText(timeStr).width + 4;
                }
            }
        }
        return;
    }
    const isTouch = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    const buttonHeight = isTouch ? 96 : 110;
    let totalTime = 0;
    for (const frame of currentAnimation.frames) totalTime += frame.duration;
    let x = 2;
    timelineCtx.font = "12px Arial";
    timelineCtx.textAlign = "center";
    timelineCtx.textBaseline = "top";
    const minFrameWidth = 48 * timelineZoom;
    const getPixelsPerMs = () => (window.matchMedia && window.matchMedia("(pointer: coarse)").matches ? 1 : 1.5) * timelineZoom;
    const pixelsPerMs = getPixelsPerMs();
    let totalTimelineWidth = 2;
    for (let i = 0; i < currentAnimation.frames.length; i++) {
        const frame = currentAnimation.frames[i];
        const frameWidth = Math.max(frame.duration * pixelsPerMs, minFrameWidth);
        totalTimelineWidth += frameWidth;
    }
    timelineTotalWidth = totalTimelineWidth;

    const _rs = getComputedStyle(document.documentElement);
    const frameBg = _rs.getPropertyValue('--timeline-frame-bg').trim() || "#8b0000";
    const frameSelectedBg = _rs.getPropertyValue('--timeline-frame-selected-bg').trim() || "#006400";
    const frameMultiBg = _rs.getPropertyValue('--timeline-frame-multi-bg').trim() || "#00456b";

    const visibleStartX = timelineScrollX;
    const visibleEndX = timelineScrollX + width;

    let currentX = 2 - timelineScrollX;
    for (let i = 0; i < currentAnimation.frames.length; i++) {
        if (isDraggingFrame && selectedFrames.has(i)) continue;
        const frame = currentAnimation.frames[i];
        const frameWidth = Math.max(frame.duration * pixelsPerMs, minFrameWidth);
        const frameStartX = currentX;
        const frameEndX = currentX + frameWidth;

        if (frameEndX < 0) {
            currentX += frameWidth;
            continue;
        }
        if (frameStartX > width) {
            break;
        }

        const x = frameStartX;
        const right = frameEndX;
        const selected = i === currentFrame;
        const actualDir = getDirIndex(currentDir);
        const pieces = frame.pieces[actualDir] || [];
        if (pieces.length === 0 && frame.pieces.some(dp => dp.length > 0)) {
            const dirsWithPieces = frame.pieces.map((dp, idx) => dp.length > 0 ? idx : -1).filter(idx => idx >= 0);
            f12Log(`Frame ${i}: currentDir=${currentDir}, actualDir=${actualDir}, pieces.length=${pieces.length}, but frame has pieces in dirs: [${dirsWithPieces.join(', ')}]`);
        }
        timelineCtx.fillStyle = selected ? frameSelectedBg : selectedFrames.has(i) ? frameMultiBg : frameBg;
        timelineCtx.beginPath();
        const rx = 10, ry = 10;
        const w = frameWidth - 4;
        const h = buttonHeight;
        timelineCtx.moveTo(x + 0.5 + rx, headerHeight + 0.5);
        timelineCtx.lineTo(x + 0.5 + w - rx, headerHeight + 0.5);
        timelineCtx.quadraticCurveTo(x + 0.5 + w, headerHeight + 0.5, x + 0.5 + w, headerHeight + 0.5 + ry);
        timelineCtx.lineTo(x + 0.5 + w, headerHeight + 0.5 + h - ry);
        timelineCtx.quadraticCurveTo(x + 0.5 + w, headerHeight + 0.5 + h, x + 0.5 + w - rx, headerHeight + 0.5 + h);
        timelineCtx.lineTo(x + 0.5 + rx, headerHeight + 0.5 + h);
        timelineCtx.quadraticCurveTo(x + 0.5, headerHeight + 0.5 + h, x + 0.5, headerHeight + 0.5 + h - ry);
        timelineCtx.lineTo(x + 0.5, headerHeight + 0.5 + ry);
        timelineCtx.quadraticCurveTo(x + 0.5, headerHeight + 0.5, x + 0.5 + rx, headerHeight + 0.5);
        timelineCtx.closePath();
        timelineCtx.fill();
        const clipX = x + 0.5 + 2;
        const clipY = headerHeight + 14;
        const clipW = frameWidth - 4;
        const clipH = buttonHeight - 30;
        timelineCtx.save();
        timelineCtx.beginPath();
        timelineCtx.rect(clipX, clipY, clipW, clipH);
        timelineCtx.clip();
        if (pieces.length > 0) {
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (const piece of pieces) {
                if (piece.type === "sprite") {
                    const bb = piece.getBoundingBox(currentAnimation);
                    minX = Math.min(minX, bb.x);
                    minY = Math.min(minY, bb.y);
                    maxX = Math.max(maxX, bb.x + bb.width);
                    maxY = Math.max(maxY, bb.y + bb.height);
                } else if (piece.type === "sound") {
                    minX = Math.min(minX, piece.xoffset);
                    minY = Math.min(minY, piece.yoffset);
                    maxX = Math.max(maxX, piece.xoffset + 16);
                    maxY = Math.max(maxY, piece.yoffset + 16);
                }
            }
            if (minX !== Infinity) {
                const frameWidth2 = maxX - minX;
                const frameHeight2 = maxY - minY;
                const frameCenterX = (minX + maxX) / 2;
                const frameCenterY = (minY + maxY) / 2;
                const previewCenterX = clipX + clipW / 2;
                const previewCenterY = clipY + clipH / 2;
                const scale = Math.min((clipW - 4) / Math.max(frameWidth2, 1), (clipH - 4) / Math.max(frameHeight2, 1), 0.5);
                timelineCtx.save();
                timelineCtx.translate(previewCenterX, previewCenterY);
                timelineCtx.scale(scale, scale);
                timelineCtx.translate(-frameCenterX, -frameCenterY);
                drawFrame(timelineCtx, frame, currentDir);
                timelineCtx.restore();
            }
        }
        timelineCtx.restore();
        timelineCtx.fillStyle = "#ffffff";
        timelineCtx.fillText(String(i), x + frameWidth / 2, headerHeight + 3);
        timelineCtx.fillText(`${frame.duration} ms`, x + frameWidth / 2, headerHeight + buttonHeight - 16);
        currentX += frameWidth;
    }
    if (isDraggingFrame && dragFrame >= 0 && dragFrame < currentAnimation.frames.length) {
        const frame = currentAnimation.frames[dragFrame];
        const frameWidth = Math.max(frame.duration * pixelsPerMs, minFrameWidth);
        const dragX = dragCurrentX - frameWidth / 2;
        const selected = dragFrame === currentFrame;
        const actualDir = getDirIndex(currentDir);
        const pieces = frame.pieces[actualDir] || [];
        timelineCtx.globalAlpha = 0.7;
        timelineCtx.fillStyle = selected ? frameSelectedBg : frameBg;
        timelineCtx.beginPath();
        const rx = 10, ry = 10;
        const w = frameWidth - 4;
        const h = buttonHeight;
        timelineCtx.moveTo(dragX + 0.5 + rx, headerHeight + 0.5);
        timelineCtx.lineTo(dragX + 0.5 + w - rx, headerHeight + 0.5);
        timelineCtx.quadraticCurveTo(dragX + 0.5 + w, headerHeight + 0.5, dragX + 0.5 + w, headerHeight + 0.5 + ry);
        timelineCtx.lineTo(dragX + 0.5 + w, headerHeight + 0.5 + h - ry);
        timelineCtx.quadraticCurveTo(dragX + 0.5 + w, headerHeight + 0.5 + h, dragX + 0.5 + w - rx, headerHeight + 0.5 + h);
        timelineCtx.lineTo(dragX + 0.5 + rx, headerHeight + 0.5 + h);
        timelineCtx.quadraticCurveTo(dragX + 0.5, headerHeight + 0.5 + h, dragX + 0.5, headerHeight + 0.5 + h - ry);
        timelineCtx.lineTo(dragX + 0.5, headerHeight + 0.5 + ry);
        timelineCtx.quadraticCurveTo(dragX + 0.5, headerHeight + 0.5, dragX + 0.5 + rx, headerHeight + 0.5);
        timelineCtx.closePath();
        timelineCtx.fill();
        const clipX = dragX + 0.5 + 2;
        const clipY = headerHeight + 14;
        const clipW = frameWidth - 4;
        const clipH = buttonHeight - 30;
        timelineCtx.save();
        timelineCtx.beginPath();
        timelineCtx.rect(clipX, clipY, clipW, clipH);
        timelineCtx.clip();
        if (pieces.length > 0) {
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (const piece of pieces) {
                if (piece.type === "sprite") {
                    const bb = piece.getBoundingBox(currentAnimation);
                    minX = Math.min(minX, bb.x);
                    minY = Math.min(minY, bb.y);
                    maxX = Math.max(maxX, bb.x + bb.width);
                    maxY = Math.max(maxY, bb.y + bb.height);
                } else if (piece.type === "sound") {
                    minX = Math.min(minX, piece.xoffset);
                    minY = Math.min(minY, piece.yoffset);
                    maxX = Math.max(maxX, piece.xoffset + 16);
                    maxY = Math.max(maxY, piece.yoffset + 16);
                }
            }
            if (minX !== Infinity) {
                const frameWidth2 = maxX - minX;
                const frameHeight2 = maxY - minY;
                const frameCenterX = (minX + maxX) / 2;
                const frameCenterY = (minY + maxY) / 2;
                const previewCenterX = clipX + clipW / 2;
                const previewCenterY = clipY + clipH / 2;
                const scale = Math.min((clipW - 4) / Math.max(frameWidth2, 1), (clipH - 4) / Math.max(frameHeight2, 1), 0.5);
                timelineCtx.save();
                timelineCtx.translate(previewCenterX, previewCenterY);
                timelineCtx.scale(scale, scale);
                timelineCtx.translate(-frameCenterX, -frameCenterY);
                drawFrame(timelineCtx, frame, currentDir);
                timelineCtx.restore();
            }
        }
        timelineCtx.restore();
        timelineCtx.fillStyle = "#ffffff";
        timelineCtx.fillText(String(dragFrame), dragX + frameWidth / 2, headerHeight + 1);
        timelineCtx.fillText(`${frame.duration} ms`, dragX + frameWidth / 2, headerHeight + buttonHeight - 16);
        if (selectedFrames.size > 1) {
            const badge = `×${selectedFrames.size}`;
            timelineCtx.font = "bold 11px sans-serif";
            const bw = timelineCtx.measureText(badge).width + 8;
            const bx = dragX + frameWidth - bw - 2;
            const by = headerHeight + 4;
            timelineCtx.fillStyle = "#00456b";
            timelineCtx.fillRect(bx, by, bw, 14);
            timelineCtx.fillStyle = "#ffffff";
            timelineCtx.fillText(badge, bx + bw / 2, by + 11);
            timelineCtx.font = "11px sans-serif";
        }
        timelineCtx.globalAlpha = 1.0;
    }
    if (isDraggingFrame && dragTargetIndex >= 0 && dragTargetIndex <= currentAnimation.frames.length) {
        let dropX = 2 - timelineScrollX;
        const pixelsPerMs = getPixelsPerMs();
        const multiIndices = selectedFrames.size > 1 ? [...selectedFrames].sort((a, b) => a - b) : null;
        const firstSelected = multiIndices ? multiIndices[0] : dragFrame;
        const lastSelected = multiIndices ? multiIndices[multiIndices.length - 1] : dragFrame;
        for (let i = 0; i < currentAnimation.frames.length; i++) {
            if (multiIndices ? multiIndices.includes(i) : i === dragFrame) continue;
            if (dragTargetIndex <= firstSelected && i >= dragTargetIndex) break;
            if (dragTargetIndex > lastSelected && i > lastSelected && i >= dragTargetIndex) break;
            const frame = currentAnimation.frames[i];
            const frameWidth = Math.max(frame.duration * pixelsPerMs, minFrameWidth);
            dropX += frameWidth;
        }
        if (dropX >= 0 && dropX <= width) {
            timelineCtx.strokeStyle = "#ffff00";
            timelineCtx.lineWidth = 3;
            timelineCtx.beginPath();
            timelineCtx.moveTo(dropX, headerHeight);
            timelineCtx.lineTo(dropX, height);
            timelineCtx.stroke();
        }
    }
    timelineCtx.fillStyle = rulerBg;
    timelineCtx.fillRect(-2, 0, width + 4, headerHeight);
    timelineCtx.font = "11px Arial";
    timelineCtx.textAlign = "left";
    timelineCtx.strokeStyle = rulerTick;
    timelineCtx.lineWidth = 1;
    let rulerX = 2 - timelineScrollX;
    let accTime = 0;
    let lastLabelRight = -999;
    for (let i = 0; i <= currentAnimation.frames.length; i++) {
        if (rulerX >= -1 && rulerX <= width + 1) {
            timelineCtx.beginPath();
            timelineCtx.moveTo(rulerX, 8);
            timelineCtx.lineTo(rulerX, headerHeight - 1);
            timelineCtx.stroke();
            const timeStr = (accTime / 1000.0).toFixed(3) + "s";
            const labelX = rulerX + 2;
            if (labelX > lastLabelRight) {
                timelineCtx.fillStyle = rulerText;
                timelineCtx.fillText(timeStr, labelX, 1);
                lastLabelRight = labelX + timelineCtx.measureText(timeStr).width + 4;
            }
        }
        if (i < currentAnimation.frames.length) {
            const frame = currentAnimation.frames[i];
            rulerX += Math.max(frame.duration * pixelsPerMs, minFrameWidth);
            accTime += frame.duration;
        }
    }
    if (isPlaying) {
        let playX = 2 - timelineScrollX;
        let elapsed = 0;
        for (let i = 0; i < currentAnimation.frames.length; i++) {
            const fw = Math.max(currentAnimation.frames[i].duration * pixelsPerMs, minFrameWidth);
            if (elapsed + currentAnimation.frames[i].duration >= playPosition) {
                const frac = (playPosition - elapsed) / currentAnimation.frames[i].duration;
                playX += fw * frac;
                break;
            }
            elapsed += currentAnimation.frames[i].duration;
            playX += fw;
        }
        timelineCtx.fillStyle = "#0000ff";
        timelineCtx.beginPath();
        timelineCtx.moveTo(playX - 5, 21);
        timelineCtx.lineTo(playX, 11);
        timelineCtx.lineTo(playX + 5, 21);
        timelineCtx.closePath();
        timelineCtx.fill();
    }

    if (timelineTotalWidth > width) {
        const scrollbarHeight = 10;
        const scrollbarY = height - scrollbarHeight - 2;
        const scrollbarWidth = width - 4;
        const thumbWidth = Math.max(20, (width / timelineTotalWidth) * scrollbarWidth);
        const thumbX = 2 + ((timelineScrollX / timelineTotalWidth) * scrollbarWidth);

        timelineCtx.fillStyle = "#555";
        timelineCtx.fillRect(2, scrollbarY, scrollbarWidth, scrollbarHeight);

        timelineCtx.fillStyle = "#888";
        timelineCtx.fillRect(thumbX, scrollbarY, thumbWidth, scrollbarHeight);

        timelineCtx.strokeStyle = "#000";
        timelineCtx.lineWidth = 1;
        timelineCtx.strokeRect(thumbX, scrollbarY, thumbWidth, scrollbarHeight);
    }
    const canvasEl = document.getElementById("timelineCanvas");
    const timelineViewEl = document.querySelector(".timeline-view");
    if (canvasEl) {
        canvasEl.style.display = "block";
        canvasEl.style.visibility = "visible";
        canvasEl.style.opacity = "1";
        canvasEl.style.width = width + "px";
        canvasEl.style.height = height + "px";
    }
    if (timelineViewEl) {
        timelineViewEl.style.display = "block";
        timelineViewEl.style.visibility = "visible";
        timelineViewEl.style.height = "116px";
    }
}

function drawSpritePreview() {
    if (!editingSprite) return;
    const width = spritePreviewCanvas.width;
    const height = spritePreviewCanvas.height;
    previewCtx.clearRect(0, 0, width, height);
    previewCtx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--preview-bg').trim() || "#353535";
    previewCtx.fillRect(0, 0, width, height);
    const scale = Math.pow(1.2, spritePreviewZoom - 3);
    previewCtx.save();
    previewCtx.translate(width / 2, height / 2);
    previewCtx.translate(spritePreviewPanX, spritePreviewPanY);
    previewCtx.scale(scale, scale);
    drawSprite(previewCtx, editingSprite, -editingSprite.width / 2, -editingSprite.height / 2);
    if (selectedAttachedSprite >= 0 && selectedAttachedSprite < editingSprite.attachedSprites.length) {
        const attached = editingSprite.attachedSprites[selectedAttachedSprite];
        const attachedSprite = currentAnimation.getAniSprite(attached.index, "");
        if (attachedSprite) {
            const mainSpriteX = -editingSprite.width / 2;
            const mainSpriteY = -editingSprite.height / 2;
            const attachedDrawX = mainSpriteX + attached.offset.x;
            const attachedDrawY = mainSpriteY + attached.offset.y;
            const bbox = attachedSprite.boundingBox;
            previewCtx.save();
            previewCtx.strokeStyle = "#00ff00";
            previewCtx.lineWidth = 2;
            previewCtx.strokeRect(Math.round(attachedDrawX + bbox.x - 2), Math.round(attachedDrawY + bbox.y - 2), Math.round(bbox.width + 4), Math.round(bbox.height + 4));
            previewCtx.restore();
        }
    }
    if (insertPiece && insertPiece.spriteIndex !== undefined && !isPlacingAttachment) {
        const sprite = currentAnimation.getAniSprite(insertPiece.spriteIndex, insertPiece.spriteName);
        if (sprite) {
            const offsetX = -editingSprite.width / 2 + insertPiece.xoffset;
            const offsetY = -editingSprite.height / 2 + insertPiece.yoffset;
            drawSprite(previewCtx, sprite, offsetX, offsetY);
        }
    }
    previewCtx.restore();
}

function parseGani(text) {
    const lines = text.split("\n");
    const ani = new Animation();
    let left = 0, top = 0, right = 0, bottom = 0;
    let dirCount = 4;
    let i = 0;
    while (i < lines.length) {
        const line = lines[i].trim();
        if (!line) { i++; continue; }
        const words = line.split(/\s+/).filter(w => w);
        if (words.length === 0) { i++; continue; }
        const word1 = words[0];
        if (word1 === "SPRITE" && words.length >= 7) {
            const sprite = new AniSprite();
            sprite.index = parseInt(words[1]) || 0;
            sprite.type = words[2];
            if (sprite.type === "BODY") ani.m_containsBodySprite = true;
            else if (isCustomImageType(sprite.type)) {
                sprite.customImageName = sprite.type;
                sprite.type = "CUSTOM";
            }
            sprite.left = parseInt(words[3]) || 0;
            sprite.top = parseInt(words[4]) || 0;
            sprite.width = parseInt(words[5]) || 32;
            sprite.height = parseInt(words[6]) || 32;
            sprite.comment = words.slice(7).join(" ") || "New Sprite";
            sprite.boundingBox = {x: 0, y: 0, width: sprite.width, height: sprite.height};
            sprite.updateBoundingBox();
            ani.addSprite(sprite);
        } else if (word1 === "STRETCHXEFFECT" && words.length >= 3) {
            const sprite = ani.getAniSprite(parseInt(words[1]), "");
            if (sprite) {
                sprite.xscale = parseFloat(words[2]) || 1.0;
                sprite.updateBoundingBox();
                if (DEBUG_MODE) f12Log(`Loaded STRETCHXEFFECT for sprite ${words[1]}: ${sprite.xscale}`);
            }
        } else if (word1 === "STRETCHYEFFECT" && words.length >= 3) {
            const sprite = ani.getAniSprite(parseInt(words[1]), "");
            if (sprite) {
                sprite.yscale = parseFloat(words[2]) || 1.0;
                sprite.updateBoundingBox();
                if (DEBUG_MODE) f12Log(`Loaded STRETCHYEFFECT for sprite ${words[1]}: ${sprite.yscale}`);
            }
        } else if (word1 === "ROTATEEFFECT" && words.length >= 3) {
            const sprite = ani.getAniSprite(parseInt(words[1]), "");
            if (sprite) {
                sprite.rotation = parseFloat(words[2]) * 180 / Math.PI;
                sprite.updateBoundingBox();
                if (DEBUG_MODE) f12Log(`Loaded ROTATEEFFECT for sprite ${words[1]}: ${sprite.rotation}`);
            }
        } else if ((word1 === "ATTACHSPRITE" || word1 === "ATTACHSPRITE2") && words.length >= 5) {
            const behind = word1 === "ATTACHSPRITE2";
            const parent = ani.getAniSprite(parseInt(words[1]), "");
            if (parent) {
                const attach = {index: parseInt(words[2]), offset: {x: parseFloat(words[3]), y: parseFloat(words[4])}};
                if (behind) {
                    parent.attachedSprites.splice(parent.m_drawIndex, 0, attach);
                    parent.m_drawIndex++;
                } else {
                    parent.attachedSprites.push(attach);
                }
            }
        } else if (word1 === "COLOREFFECT" && words.length >= 6) {
            const sprite = ani.getAniSprite(parseInt(words[1]), "");
            if (sprite) {
                sprite.colorEffectEnabled = true;
                sprite.colorEffect = {
                    r: Math.floor(parseFloat(words[2]) * 255),
                    g: Math.floor(parseFloat(words[3]) * 255),
                    b: Math.floor(parseFloat(words[4]) * 255),
                    a: Math.floor(parseFloat(words[5]) * 255)
                };
            }
        } else if (word1 === "ZOOMEFFECT" && words.length >= 3) {
            const sprite = ani.getAniSprite(parseInt(words[1]), "");
            if (sprite) {
                sprite.xscale = sprite.yscale = parseFloat(words[2]) || 1.0;
                sprite.updateBoundingBox();
                if (DEBUG_MODE) f12Log(`Loaded ZOOMEFFECT for sprite ${words[1]}: ${sprite.xscale}`);
            }
        } else if (word1 === "EFFECTMODE" && words.length >= 3) {
            const sprite = ani.getAniSprite(parseInt(words[1]), "");
            if (sprite) {
                const modeValue = parseInt(words[2]);
                sprite.mode = isNaN(modeValue) ? undefined : modeValue;
                if (DEBUG_MODE) f12Log(`Loaded EFFECTMODE for sprite ${words[1]}: ${sprite.mode}`);
            }
        } else if (word1 === "LOOP") {
            ani.looped = true;
        } else if (word1 === "CONTINUOUS") {
            ani.continous = true;
        } else if (word1 === "SETBACKTO" && words.length >= 2) {
            ani.nextAni = words[1];
        } else if (word1 === "SINGLEDIR" || word1 === "SINGLEDIRECTION") {
            ani.singleDir = true;
            dirCount = 1;
        } else if (word1.startsWith("DEFAULT") && words.length >= 2) {
            const type = word1.substring(7);
            const fileName = words[1];
            f12Log(`Parsing DEFAULT${type} ${fileName}`);
            ani.setDefaultImage(type, fileName);
            f12Log(`Set default for ${type}: ${ani.getDefaultImageName(type)}`);
        } else if (word1 === "ANI") {
            i++;
            const newFrame = [];
            while (i < lines.length && lines[i].trim() !== "ANIEND") {
                const origLine = lines[i];
                const line = origLine.trim();
                if (!line) { i++; continue; }
                if (line.startsWith("WAIT")) {
                    if (ani.frames.length > 0) {
                        const delay = parseFloat(line.substring(4).trim()) || 0;
                        ani.frames[ani.frames.length - 1].duration += delay * 50;
                    }
                    i++;
                    continue;
                }
                if (line.startsWith("PLAYSOUND")) {
                    if (ani.frames.length > 0) {
                        const parts = line.split(/\s+/).filter(p => p);
                        if (parts.length >= 4) {
                            const sound = new FramePieceSound();
                            sound.fileName = parts[1];
                            sound.xoffset = parseFloat(parts[2]) * 16;
                            sound.yoffset = parseFloat(parts[3]) * 16;
                            ani.frames[ani.frames.length - 1].sounds.push(sound);
                        }
                    }
                    i++;
                    continue;
                }
                if (ani.singleDir) {
                    if (!origLine.startsWith(" ")) {
                        i++;
                        continue;
                    }
                    const frame = new Frame();
                    let frameLeft = 0, frameTop = 0, frameRight = 0, frameBottom = 0;
                    const offsets = line.split(",").filter(o => o.trim());
                    for (const offset of offsets) {
                        const parts = offset.trim().split(/\s+/).filter(p => p);
                        if (parts.length >= 3) {
                            const piece = new FramePieceSprite();
                            const spriteNameOrIndex = parts[0];
                            const spriteIndex = parseInt(spriteNameOrIndex);
                            if (isNaN(spriteIndex)) {
                                piece.spriteIndex = SPRITE_INDEX_STRING;
                                piece.spriteName = spriteNameOrIndex;
                            } else {
                                piece.spriteIndex = spriteIndex;
                                piece.spriteName = "";
                            }
                            piece.xoffset = parseFloat(parts[1]) || 0;
                            piece.yoffset = parseFloat(parts[2]) || 0;
                            if (piece.xoffset < left) left = piece.xoffset;
                            if (piece.yoffset < top) top = piece.yoffset;
                            if (piece.xoffset < frameLeft) frameLeft = piece.xoffset;
                            if (piece.yoffset < frameTop) frameTop = piece.yoffset;
                            const sprite = ani.getAniSprite(piece.spriteIndex, piece.spriteName);
                            if (sprite) {
                                if (piece.xoffset + sprite.width > right) right = piece.xoffset + sprite.width;
                                if (piece.yoffset + sprite.height > bottom) bottom = piece.yoffset + sprite.height;
                                if (piece.xoffset + sprite.width > frameRight) frameRight = piece.xoffset + sprite.width;
                                if (piece.yoffset + sprite.height > frameBottom) frameBottom = piece.yoffset + sprite.height;
                            }
                            frame.pieces[0].push(piece);
                        }
                    }
                    frame.boundingBox = {x: frameLeft, y: frameTop, width: frameRight - frameLeft, height: frameBottom - frameTop};
                    frame.duration = 50;
                    if (frame.pieces[0].length > 0) {
                        ani.frames.push(frame);
                    }
                    i++;
                } else {
                    if (!origLine.startsWith(" ") && line) {
                        i++;
                        continue;
                    }
                    const dirPieces = [];
                    let frameLeft = 0, frameTop = 0, frameRight = 0, frameBottom = 0;
                    if (line) {
                        const offsets = line.split(",").filter(o => o.trim());
                        for (const offset of offsets) {
                            const parts = offset.trim().split(/\s+/).filter(p => p);
                            if (parts.length >= 3) {
                                const piece = new FramePieceSprite();
                                const spriteNameOrIndex = parts[0];
                                const spriteIndex = parseInt(spriteNameOrIndex);
                                if (isNaN(spriteIndex)) {
                                    piece.spriteIndex = SPRITE_INDEX_STRING;
                                    piece.spriteName = spriteNameOrIndex;
                                } else {
                                    piece.spriteIndex = spriteIndex;
                                    piece.spriteName = "";
                                }
                                piece.xoffset = parseFloat(parts[1]) || 0;
                                piece.yoffset = parseFloat(parts[2]) || 0;
                                if (piece.xoffset < left) left = piece.xoffset;
                                if (piece.yoffset < top) top = piece.yoffset;
                                if (piece.xoffset < frameLeft) frameLeft = piece.xoffset;
                                if (piece.yoffset < frameTop) frameTop = piece.yoffset;
                                const sprite = ani.getAniSprite(piece.spriteIndex, piece.spriteName);
                                if (sprite) {
                                    if (piece.xoffset + sprite.width > right) right = piece.xoffset + sprite.width;
                                    if (piece.yoffset + sprite.height > bottom) bottom = piece.yoffset + sprite.height;
                                    if (piece.xoffset + sprite.width > frameRight) frameRight = piece.xoffset + sprite.width;
                                    if (piece.yoffset + sprite.height > frameBottom) frameBottom = piece.yoffset + sprite.height;
                                }
                                dirPieces.push(piece);
                            }
                        }
                    }
                    newFrame.push({pieces: dirPieces, boundingBox: {x: frameLeft, y: frameTop, width: frameRight - frameLeft, height: frameBottom - frameTop}});
                    if (newFrame.length >= 4) {
                        const frame = new Frame();
                        let combinedLeft = Infinity, combinedTop = Infinity, combinedRight = -Infinity, combinedBottom = -Infinity;
                        for (let dir = 0; dir < 4; dir++) {
                            if (newFrame[dir]) {
                                frame.pieces[dir] = newFrame[dir].pieces;
                                const bb = newFrame[dir].boundingBox;
                                if (bb.width > 0 || bb.height > 0) {
                                    combinedLeft = Math.min(combinedLeft, bb.x);
                                    combinedTop = Math.min(combinedTop, bb.y);
                                    combinedRight = Math.max(combinedRight, bb.x + bb.width);
                                    combinedBottom = Math.max(combinedBottom, bb.y + bb.height);
                                }
                            }
                        }
                        if (combinedLeft !== Infinity) {
                            frame.boundingBox = {x: combinedLeft, y: combinedTop, width: combinedRight - combinedLeft, height: combinedBottom - combinedTop};
                        }
                        frame.duration = 50;
                        let hasContent = false;
                        for (let d = 0; d < 4; d++) {
                            if (frame.pieces[d] && frame.pieces[d].length > 0) {
                                hasContent = true;
                                break;
                            }
                        }
                        if (hasContent || (frame.sounds && frame.sounds.length > 0)) {
                            ani.frames.push(frame);
                        }
                        newFrame.length = 0;
                    }
                    i++;
                }
            }
            if (newFrame.length > 0 && !ani.singleDir) {
                const frame = new Frame();
                let combinedLeft = Infinity, combinedTop = Infinity, combinedRight = -Infinity, combinedBottom = -Infinity;
                for (let dir = 0; dir < newFrame.length; dir++) {
                    if (newFrame[dir]) {
                        frame.pieces[dir] = newFrame[dir].pieces;
                        const bb = newFrame[dir].boundingBox;
                        if (bb.width > 0 || bb.height > 0) {
                            combinedLeft = Math.min(combinedLeft, bb.x);
                            combinedTop = Math.min(combinedTop, bb.y);
                            combinedRight = Math.max(combinedRight, bb.x + bb.width);
                            combinedBottom = Math.max(combinedBottom, bb.y + bb.height);
                        }
                    }
                }
                for (let dir = newFrame.length; dir < 4; dir++) {
                    frame.pieces[dir] = [];
                }
                if (combinedLeft !== Infinity) {
                    frame.boundingBox = {x: combinedLeft, y: combinedTop, width: combinedRight - combinedLeft, height: combinedBottom - combinedTop};
                }
                frame.duration = 50;
                let hasContent = false;
                for (let d = 0; d < 4; d++) {
                    if (frame.pieces[d] && frame.pieces[d].length > 0) {
                        hasContent = true;
                        break;
                    }
                }
                let hasContent2 = false;
                for (let d = 0; d < 4; d++) {
                    if (frame.pieces[d] && frame.pieces[d].length > 0) {
                        hasContent2 = true;
                        break;
                    }
                }
                if (hasContent2 || (frame.sounds && frame.sounds.length > 0)) {
                    ani.frames.push(frame);
                }
                newFrame.length = 0;
            }
        } else if (word1 === "SCRIPT") {
            i++;
            const scriptLines = [];
            while (i < lines.length && lines[i].trim() !== "SCRIPTEND") {
                scriptLines.push(lines[i]);
                i++;
            }
            ani.script = scriptLines.join("\n");
        }
        i++;
    }
    ani.boundingBox = {x: left, y: top, width: right - left, height: bottom - top};
    return ani;
}

function isCustomImageType(type) {
    const internalTypes = ["HEAD", "BODY", "SWORD", "SHIELD", "SPRITES", "HORSE", "PICS",
        "ATTR1", "ATTR2", "ATTR3", "ATTR4", "ATTR5", "ATTR6", "ATTR7", "ATTR8", "ATTR9", "ATTR10",
        "PARAM1", "PARAM2", "PARAM3", "PARAM4", "PARAM5", "PARAM6", "PARAM7", "PARAM8", "PARAM9", "PARAM10"];
    return !internalTypes.includes(type);
}

function saveGani(ani) {
    let output = "GANI0001\n";
    const otherCommands = [];
    for (const sprite of ani.sprites.values()) {
        output += `SPRITE ${String(sprite.index).padStart(4)} ${(sprite.type === "CUSTOM" ? sprite.customImageName : sprite.type).padEnd(15)} ${String(sprite.left).padStart(4)} ${String(sprite.top).padStart(4)} ${String(sprite.width).padStart(4)} ${String(sprite.height).padStart(4)} ${sprite.comment}\n`;
        let attachIndex = 0;
        for (const attached of sprite.attachedSprites) {
            const cmd = attachIndex < sprite.m_drawIndex ? "ATTACHSPRITE2" : "ATTACHSPRITE";
            otherCommands.push(`${cmd} ${String(sprite.index).padStart(4)} ${String(attached.index).padStart(4)} ${String(Math.floor(attached.offset.x)).padStart(4)} ${String(Math.floor(attached.offset.y)).padStart(4)}`);
            attachIndex++;
        }
        const _sz = sprite._zoom || 1.0;
        const effX = sprite.xscale * _sz, effY = sprite.yscale * _sz;
        if (effX === effY && effX !== 1.0) {
            otherCommands.push(`ZOOMEFFECT ${String(sprite.index).padStart(4)} ${effX}`);
        } else {
            if (effX !== 1.0) otherCommands.push(`STRETCHXEFFECT ${String(sprite.index).padStart(4)} ${effX}`);
            if (effY !== 1.0) otherCommands.push(`STRETCHYEFFECT ${String(sprite.index).padStart(4)} ${effY}`);
        }
        if (sprite.rotation !== 0.0) {
            otherCommands.push(`ROTATEEFFECT ${String(sprite.index).padStart(4)} ${sprite.rotation * Math.PI / 180}`);
            if (DEBUG_MODE) f12Log(`Saving ROTATEEFFECT for sprite ${sprite.index}: ${sprite.rotation}`);
        }
        if (sprite.mode !== undefined && sprite.mode !== null) {
            otherCommands.push(`EFFECTMODE ${String(sprite.index).padStart(4)} ${sprite.mode}`);
            if (DEBUG_MODE) f12Log(`Saving EFFECTMODE for sprite ${sprite.index}: ${sprite.mode}`);
        }
        if (sprite.colorEffectEnabled) {
            otherCommands.push(`COLOREFFECT ${String(sprite.index).padStart(4)} ${sprite.colorEffect.r/255} ${sprite.colorEffect.g/255} ${sprite.colorEffect.b/255} ${sprite.colorEffect.a/255}`);
        }
    }
    for (const [type, value] of ani.defaultImages) {
        output += `DEFAULT${type} ${value}\n`;
    }
    if (ani.looped) output += "LOOP\n";
    if (ani.continous) output += "CONTINUOUS\n";
    if (ani.nextAni) output += `SETBACKTO ${ani.nextAni}\n`;
    if (ani.singleDir) output += "SINGLEDIR\n";
    for (const cmd of otherCommands) output += cmd + "\n";
    output += "ANI\n";
    for (const frame of ani.frames) {
        for (let dir = 0; dir < (ani.singleDir ? 1 : 4); dir++) {
            const pieces = frame.pieces[dir];
            if (pieces.length > 0) {
                const offsets = pieces.map(p => {
                    const name = p.spriteIndex === SPRITE_INDEX_STRING ? p.spriteName : String(p.spriteIndex);
                    return `${name} ${p.xoffset} ${p.yoffset}`;
                });
                if (ani.singleDir) {
                    output += " " + offsets.join(",") + "\n";
                } else {
                    output += " " + offsets.join(",") + "\n";
                }
            } else {
                if (ani.singleDir) {
                    output += " \n";
                } else {
                    output += " \n";
                }
            }
        }
        for (const sound of frame.sounds) {
            output += `PLAYSOUND ${sound.fileName} ${sound.xoffset/16} ${sound.yoffset/16}\n`;
        }
        if (frame.duration !== 50) {
            const waitCount = Math.floor((frame.duration - 50) / 50);
            if (waitCount > 0) output += `WAIT ${waitCount}\n`;
        }
        output += "\n";
    }
    output += "ANIEND\n";
    if (ani.script) {
        output += "SCRIPT\n" + ani.script + "\nSCRIPTEND\n";
    }
    return output;
}


async function loadImageFromUrl(url, key) {
    return new Promise((resolve, reject) => {
        const lowerUrl = url.toLowerCase();
        if (lowerUrl.endsWith('.mng')) {
            fetch(url)
                .then(response => response.arrayBuffer())
                .then(buffer => {
                    try {
                        const pngData = extractFirstFrame(buffer);
                        const blob = new Blob([pngData], {type: 'image/png'});
                        const objectUrl = URL.createObjectURL(blob);
                        const img = new Image();
                        img.onload = () => {
                            if (key) imageLibrary.set(key, img);
                            URL.revokeObjectURL(objectUrl);
                            resolve(img);
                        };
                        img.onerror = () => {
                            URL.revokeObjectURL(objectUrl);
                            reject(new Error(`Failed to load extracted PNG frame from ${url}`));
                        };
                        img.src = objectUrl;
                    } catch (err) {
                        reject(new Error(`Failed to extract MNG frame from ${url}: ${err.message}`));
                    }
                })
                .catch(reject);
        } else {
            const img = new Image();
            img.onload = () => {
                if (key) imageLibrary.set(key, img);
                resolve(img);
            };
            img.onerror = () => reject(new Error(`Failed to load image from ${url}`));
            img.src = url;
        }
    });
}

function loadImage(file) {
    return new Promise((resolve, reject) => {
        const isMng = file.name.toLowerCase().endsWith('.mng');
        if (isMng) {
        const reader = new FileReader();
        reader.onload = (e) => {
                try {
                    const buffer = e.target.result;
                    const data = new Uint8Array(buffer);
                    const header = data.slice(0, 8);
                    let isMngFile = true;
                    for (let i = 0; i < 8; i++) {
                        if (header[i] !== MNG_SIG[i]) {
                            isMngFile = false;
                            break;
                        }
                    }
                    if (!isMngFile) {
                        reject(new Error('Invalid MNG file'));
                        return;
                    }
                    const pngData = extractFirstFrame(buffer);
                    const blob = new Blob([pngData], {type: 'image/png'});
                    const url = URL.createObjectURL(blob);
                    const img = new Image();
                    img.onload = () => {
                        const key = file.name.toLowerCase();
                        imageLibrary.set(key, img);
                        URL.revokeObjectURL(url);
                        resolve(img);
                    };
                    img.onerror = () => {
                        URL.revokeObjectURL(url);
                        reject(new Error('Failed to load extracted PNG frame'));
                    };
                    img.src = url;
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        } else {
            const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const key = file.name.toLowerCase();
                imageLibrary.set(key, img);
                resolve(img);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
        }
    });
}

var _isTauri = window.__TAURI__ != null;
var _tauri = _isTauri ? window.__TAURI__ : null;
let workspacePathIndex = new Map();
async function loadImageFromPath(filePath, name) {
    const data = await _tauri.fs.readFile(filePath);
    const isMng = name.toLowerCase().endsWith('.mng');
    if (isMng) {
        const header = data.slice(0, 8);
        let valid = true;
        for (let i = 0; i < 8; i++) { if (header[i] !== MNG_SIG[i]) { valid = false; break; } }
        if (!valid) throw new Error('Invalid MNG file');
        const pngData = extractFirstFrame(data.buffer);
        const blob = new Blob([pngData], { type: 'image/png' });
        const url = URL.createObjectURL(blob);
        const img = new Image();
        return new Promise((resolve, reject) => {
            img.onload = () => { imageLibrary.set(name.toLowerCase(), img); URL.revokeObjectURL(url); resolve(img); };
            img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load MNG')); };
            img.src = url;
        });
    }
    const ext = name.split('.').pop().toLowerCase();
    const mime = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'webp' ? 'image/webp' : ext === 'bmp' ? 'image/bmp' : 'image/png';
    const blob = new Blob([data], { type: mime });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    return new Promise((resolve, reject) => {
        img.onload = () => { imageLibrary.set(name.toLowerCase(), img); URL.revokeObjectURL(url); resolve(img); };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load ' + name)); };
        img.src = url;
    });
}

async function loadWorkspaceFromDisk(dirPath) {
    const ext = dirPath.split(/[\\/]/).pop();
    workingDirectory = ext;
    lastWorkingDirectory = ext;
    localStorage.setItem("ganiEditorLastWorkingDir", lastWorkingDirectory);
    window._tauriLastDir = dirPath;
    workspaceImageKeys.clear();
    localFileCache = { ganis: [], sounds: [], ganiFiles: [] };
    localFileCache._isTauri = true;

    if (window._workspaceScanUnlisten) {
        window._workspaceScanUnlisten();
        window._workspaceScanUnlisten = null;
    }

    window._workspaceScanUnlisten = await _tauri.event.listen('workspace_chunk', (event) => {
        const chunk = event.payload;
        chunk.image_keys.forEach(n => workspaceImageKeys.add(n));
        chunk.gani_files.forEach(([n]) => workspaceImageKeys.add(n));
        localFileCache.ganis.push(...chunk.gani_files.map(([, p]) => p));
        localFileCache.sounds.push(...chunk.sound_files);
        localFileCache.ganiFiles.push(...chunk.gani_files.map(([n, p]) => ({ name: n, path: p })));

        if (chunk.done) {
            if (window._workspaceScanUnlisten) {
                window._workspaceScanUnlisten();
                window._workspaceScanUnlisten = null;
            }
            console.log(`[TAURI] Workspace indexed: ${chunk.image_count} images, ${chunk.gani_count} ganis (streamed)`);
            refreshAllAnimationsSprites();
            drawSpritePreview();
            updateSpritesList();
            saveSession();
            redraw();
        } else {
            redraw();
        }
    });

    await _tauri.core.invoke('scan_workspace', { dir: dirPath });
}

async function restoreWorkspaceFromCache() {
    const cached = await _tauri.core.invoke('load_workspace_cache').catch(() => null);
    if (!cached) return false;
    const dirPath = cached.dir;
    const ext = dirPath.split(/[\\/]/).pop();
    workingDirectory = ext;
    lastWorkingDirectory = ext;
    localStorage.setItem("ganiEditorLastWorkingDir", lastWorkingDirectory);
    window._tauriLastDir = dirPath;
    workspaceImageKeys.clear();
    workspacePathIndex = new Map();
    localFileCache = { ganis: [], sounds: [], ganiFiles: [] };
    localFileCache._isTauri = true;
    const imageExts = new Set(['png','gif','jpg','jpeg','webp','bmp','mng']);
    const soundExts = new Set(['wav','mp3','ogg','mid','midi']);
    cached.entries.forEach(([name, path, crc]) => {
        workspacePathIndex.set(name, path);
        const dot = name.lastIndexOf('.');
        const e = dot > 0 ? name.slice(dot + 1).toLowerCase() : '';
        if (imageExts.has(e)) workspaceImageKeys.add(name.toLowerCase());
        if (name.endsWith('.gani')) localFileCache.ganiFiles.push({ name, path });
        if (soundExts.has(e)) localFileCache.sounds.push(path);
    });
    localFileCache.ganis = localFileCache.ganiFiles.map(g => g.path);
    console.log(`[TAURI] Workspace restored from cache: ${workspacePathIndex.size} files, dir=${cached.dir}`);
    refreshAllAnimationsSprites();
    drawSpritePreview();
    updateSpritesList();
    saveSession();
    redraw();
    return true;
}

async function tauriOpenDialog(opts) {
    return _tauri.dialog.open(opts);
}

async function tauriReadTextFile(filePath) {
    return _tauri.fs.readTextFile(filePath);
}

function updateSpritesList() {
    const list = document.getElementById("spritesList");
    list.innerHTML = "";
    if (!currentAnimation) return;
    const sortedSprites = Array.from(currentAnimation.sprites.values()).sort((a, b) => a.index - b.index);
    if (sortedSprites.length === 0) {
        editingSprite = null;
        updateSpriteEditor();
        return;
    }
    let spriteFound = false;
    if (editingSprite) {
        for (const sprite of sortedSprites) {
            if (sprite.index === editingSprite.index && sprite.type === editingSprite.type) {
                editingSprite = sprite;
                spriteFound = true;
                break;
            }
        }
    }
    if (!editingSprite || !spriteFound) {
        const savedSpriteIndex = currentAnimation ? localStorage.getItem("ganiEditorSelectedSprite_" + currentAnimation.id) : null;
        if (savedSpriteIndex !== null) {
            const savedIndex = parseInt(savedSpriteIndex);
            for (const sprite of sortedSprites) {
                if (sprite.index === savedIndex) {
                    editingSprite = sprite;
                    spriteFound = true;
                    break;
                }
            }
        }
        if (!spriteFound) {
        editingSprite = sortedSprites[0];
        }
        updateSpriteEditor();
    }
    for (const sprite of sortedSprites) {
        const item = document.createElement("div");
        item.className = "sprite-item";
        item.draggable = false;
        item.style.position = "relative";
        if (editingSprite && editingSprite.index === sprite.index && editingSprite.type === sprite.type) item.classList.add("selected");
        if (selectedSpritesForDeletion.has(sprite)) {
            item.classList.add("multi-selected");
            item.style.border = "2px solid #ff6600";
        }
        let spriteItemDragStart = null;
        let spriteItemDragging = false;
        const spriteItemDragHandler = (e) => {
            if (spriteItemDragStart && !spriteItemDragging) {
                const dx = e.clientX - spriteItemDragStart.x;
                const dy = e.clientY - spriteItemDragStart.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance > 5) {
                    spriteItemDragging = true;
                    e.preventDefault();
                    e.stopPropagation();
                    if (!insertPiece || insertPiece.spriteIndex !== sprite.index) {
                        insertPiece = new FramePieceSprite();
                        insertPiece.spriteIndex = sprite.index;
                        insertPiece.spriteName = String(sprite.index);
                        insertPiece.xoffset = -5000;
                        insertPiece.yoffset = -5000;
                        insertPiece.dragOffset = {x: (sprite.width * sprite.xscale * (sprite._zoom || 1)) / 2, y: (sprite.height * sprite.yscale * (sprite._zoom || 1)) / 2};
                        insertPieces = [];
                        for (const sel of selectedSpritesForDeletion) {
                            if (sel.index === sprite.index) continue;
                            const ep = new FramePieceSprite();
                            ep.spriteIndex = sel.index;
                            ep.spriteName = String(sel.index);
                            ep.xoffset = -5000; ep.yoffset = -5000;
                            ep.dragOffset = {x: 0, y: 0};
                            insertPieces.push(ep);
                        }
                        redraw();
                    }
                }
            }
        };
        const spriteItemMouseUpHandler = (e) => {
            if (e.button === 0 && spriteItemDragStart) {
                document.removeEventListener("mousemove", spriteItemDragHandler);
                document.removeEventListener("mouseup", spriteItemMouseUpHandler);
                if (!spriteItemDragging) {
                    selectedSpritesForDeletion.clear();
                    updateSpritesList();
                    insertPiece = new FramePieceSprite();
                    insertPiece.spriteIndex = sprite.index;
                    insertPiece.spriteName = String(sprite.index);
                    insertPiece.xoffset = -5000;
                    insertPiece.yoffset = -5000;
                    insertPiece.dragOffset = {x: (sprite.width * sprite.xscale * (sprite._zoom || 1)) / 2, y: (sprite.height * sprite.yscale * (sprite._zoom || 1)) / 2};
                    selectSprite(sprite);
                    redraw();
                }
                spriteItemDragStart = null;
                spriteItemDragging = false;
            }
        };
        item.onmousedown = (e) => {
            if (e.button === 0) {
                e.preventDefault();
                e.stopPropagation();
                if (e.ctrlKey || e.metaKey || e.shiftKey) {
                    if (e.shiftKey && selectedSpritesForDeletion.size > 0) {
                        const spriteIndices = sortedSprites.map(s => s.index);
                        const clickedIndex = sprite.index;
                        const selectedIndexArray = Array.from(selectedSpritesForDeletion).map(s => s.index);
                        const minIndex = Math.min(...selectedIndexArray);
                        const maxIndex = Math.max(...selectedIndexArray);
                        const newMinIndex = Math.min(minIndex, clickedIndex);
                        const newMaxIndex = Math.max(maxIndex, clickedIndex);
                        for (let i = newMinIndex; i <= newMaxIndex; i++) {
                            if (spriteIndices.includes(i)) {
                                const spriteAtIndex = sortedSprites.find(s => s.index === i);
                                if (spriteAtIndex && !selectedSpritesForDeletion.has(spriteAtIndex)) {
                                    selectedSpritesForDeletion.add(spriteAtIndex);
                                }
                            }
                        }
                    } else if (selectedSpritesForDeletion.has(sprite)) {
                        selectedSpritesForDeletion.delete(sprite);
                        item.classList.remove("multi-selected");
                        item.style.border = "";
                    } else {
                        selectedSpritesForDeletion.add(sprite);
                        item.classList.add("multi-selected");
                        item.style.border = "2px solid #ff6600";
                    }
                    updateSpritesList();
                    return;
                }
                spriteItemDragStart = {x: e.clientX, y: e.clientY};
                spriteItemDragging = false;
                document.addEventListener("mousemove", spriteItemDragHandler);
                document.addEventListener("mouseup", spriteItemMouseUpHandler);
            }
        };
        item.ondragstart = (e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        };
        item.ondrag = (e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        };
        item.ondblclick = () => editSprite(sprite);
        item.oncontextmenu = (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            showSpriteContextMenu(e, sprite);
        };
        let spriteItemTouchTimer = null;
        let spriteItemTouchMoved = false;
        item.addEventListener("touchstart", (e) => {
            spriteItemTouchMoved = false;
            spriteItemTouchTimer = setTimeout(() => {
                if (!spriteItemTouchMoved) {
                    e.preventDefault();
                    const rect = item.getBoundingClientRect();
                    const fakeEvent = {
                        clientX: rect.left + rect.width / 2,
                        clientY: rect.top + rect.height / 2,
                        preventDefault: () => {},
                        stopPropagation: () => {},
                        stopImmediatePropagation: () => {}
                    };
                    showSpriteContextMenu(fakeEvent, sprite);
                }
            }, 500);
        }, {passive: true});
        item.addEventListener("touchmove", () => {
            spriteItemTouchMoved = true;
            if (spriteItemTouchTimer) {
                clearTimeout(spriteItemTouchTimer);
                spriteItemTouchTimer = null;
            }
        }, {passive: true});
        item.addEventListener("touchend", () => {
            if (spriteItemTouchTimer) {
                clearTimeout(spriteItemTouchTimer);
                spriteItemTouchTimer = null;
            }
        }, {passive: true});
        const canvas = document.createElement("canvas");
        canvas.draggable = false;
        canvas.ondragstart = (e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        };
        const img = getSpriteImage(sprite);
        const maxSize = 64;
        if (img && sprite.width > 0 && sprite.height > 0) {
            const aspect = sprite.width / sprite.height;
            if (aspect > 1) {
                canvas.width = maxSize;
                canvas.height = Math.min(maxSize, maxSize / aspect);
            } else {
                canvas.width = Math.min(maxSize, maxSize * aspect);
                canvas.height = maxSize;
            }
        } else {
            canvas.width = maxSize;
            canvas.height = maxSize;
        }
        canvas.width = maxSize;
        canvas.height = maxSize;
        const itemCtx = canvas.getContext("2d");
        itemCtx.imageSmoothingEnabled = false;
        if (img && sprite.width > 0 && sprite.height > 0) {
            const dispW = Math.max(sprite.width * Math.abs(sprite.xscale) * (sprite._zoom || 1), 1);
            const dispH = Math.max(sprite.height * Math.abs(sprite.yscale) * (sprite._zoom || 1), 1);
            const scale = Math.min(maxSize / dispW, maxSize / dispH);
            itemCtx.save();
            itemCtx.scale(scale, scale);
            drawSprite(itemCtx, sprite, 0, 0);
            itemCtx.restore();
        } else {
            const placeholderWidth = sprite.width > 0 ? sprite.width : 32;
            const placeholderHeight = sprite.height > 0 ? sprite.height : 32;
            const scale = Math.min(maxSize / placeholderWidth, maxSize / placeholderHeight, 1);
            const scaledWidth = placeholderWidth * scale;
            const scaledHeight = placeholderHeight * scale;
            const offsetX = (canvas.width - scaledWidth) / 2;
            const offsetY = (canvas.height - scaledHeight) / 2;
            itemCtx.globalAlpha = 0.65;
            itemCtx.fillStyle = "#ffffff";
            itemCtx.fillRect(offsetX, offsetY, scaledWidth, scaledHeight);
            itemCtx.strokeStyle = "#000000";
            itemCtx.lineWidth = 1;
            itemCtx.strokeRect(offsetX, offsetY, scaledWidth, scaledHeight);
            itemCtx.strokeStyle = "#ff0000";
            itemCtx.beginPath();
            itemCtx.moveTo(offsetX + 2, offsetY + 2);
            itemCtx.lineTo(offsetX + scaledWidth - 2, offsetY + scaledHeight - 2);
            itemCtx.moveTo(offsetX + 2, offsetY + scaledHeight - 2);
            itemCtx.lineTo(offsetX + scaledWidth - 2, offsetY + 2);
            itemCtx.stroke();
            itemCtx.globalAlpha = 1.0;
        }
        item.appendChild(canvas);
        const label = document.createElement("div");
        label.textContent = sprite.index;
        label.style.fontSize = "10px";
        item.appendChild(label);
        list.appendChild(item);
    }
    const spritesList = document.getElementById("spritesList");
    if (spritesList && !spritesList.hasAttribute("data-context-menu-bound")) {
        spritesList.setAttribute("data-context-menu-bound", "true");
        spritesList.setAttribute("tabindex", "0");
        spritesList.onclick = (e) => {
            if (e.target === spritesList) {
                selectedSpritesForDeletion.clear();
                updateSpritesList();
            }
        };
        spritesList.onkeydown = (e) => {
            if (e.key === "Delete" && selectedSpritesForDeletion.size > 0) {
                e.preventDefault();
                e.stopPropagation();
                const oldState = serializeAnimationState();
                for (const spriteToDelete of selectedSpritesForDeletion) {
                    currentAnimation.sprites.delete(spriteToDelete.index);
                }
                if (editingSprite && selectedSpritesForDeletion.has(editingSprite)) {
                    editingSprite = null;
                }
                selectedSpritesForDeletion.clear();
                const newState = serializeAnimationState();
                addUndoCommand({
                    description: `Delete ${selectedSpritesForDeletion.size} Sprite${selectedSpritesForDeletion.size > 1 ? 's' : ''}`,
                    oldState: oldState,
                    newState: newState,
                    undo: () => restoreAnimationState(oldState),
                    redo: () => restoreAnimationState(newState)
                });
                updateSpritesList();
                updateSpriteEditor();
                redraw();
                saveSession();
            }
        };
        spritesList.oncontextmenu = (e) => {
            if (e.target === spritesList || e.target.parentElement === spritesList) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                showSpritesListContextMenu(e);
            }
        };
        let spritesListTouchTimer = null;
        let spritesListTouchMoved = false;
        spritesList.addEventListener("touchstart", (e) => {
            if (e.target === spritesList || e.target.parentElement === spritesList) {
                spritesListTouchMoved = false;
                spritesListTouchTimer = setTimeout(() => {
                    if (!spritesListTouchMoved) {
                        e.preventDefault();
                        const rect = spritesList.getBoundingClientRect();
                        const fakeEvent = {
                            clientX: rect.left + rect.width / 2,
                            clientY: rect.top + rect.height / 2,
                            preventDefault: () => {},
                            stopPropagation: () => {},
                            stopImmediatePropagation: () => {}
                        };
                        showSpritesListContextMenu(fakeEvent);
                    }
                }, 500);
            }
        }, {passive: true});
        spritesList.addEventListener("touchmove", () => {
            spritesListTouchMoved = true;
            if (spritesListTouchTimer) {
                clearTimeout(spritesListTouchTimer);
                spritesListTouchTimer = null;
            }
        }, {passive: true});
        spritesList.addEventListener("touchend", () => {
            if (spritesListTouchTimer) {
                clearTimeout(spritesListTouchTimer);
                spritesListTouchTimer = null;
            }
        }, {passive: true});
    }
}

function selectSprite(sprite) {
    editingSprite = sprite;
    if (currentAnimation && sprite) {
        localStorage.setItem("ganiEditorSelectedSprite_" + currentAnimation.id, sprite.index.toString());
    }
    updateSpritesList();
    updateSpriteEditor();
    drawSpritePreview();
}

function editSprite(sprite) {
    showAddSpriteDialog(sprite);
}

function updateSpriteEditor() {
    if (!editingSprite) {
        document.getElementById("spriteEditPanel").style.display = "none";
        return;
    }
    const spriteEditPanel = document.getElementById("spriteEditPanel");
    const spriteID = document.getElementById("spriteID");
    const spriteSource = document.getElementById("spriteSource");
    const spriteImage = document.getElementById("spriteImage");
    const spriteComment = document.getElementById("spriteComment");
    const xScale = document.getElementById("xScale");
    const xScaleSlider = document.getElementById("xScaleSlider");
    const yScale = document.getElementById("yScale");
    const yScaleSlider = document.getElementById("yScaleSlider");
    const rotationEl = document.getElementById("rotation");
    const rotationSlider = document.getElementById("rotationSlider");
    const zoomEl = document.getElementById("zoom");
    const zoomSlider = document.getElementById("zoomSlider");
    const spriteMode = document.getElementById("spriteMode");
    const spriteLeft = document.getElementById("spriteLeft");
    const spriteTop = document.getElementById("spriteTop");
    const spriteWidth = document.getElementById("spriteWidth");
    const spriteHeight = document.getElementById("spriteHeight");
    const colorSwatch = document.getElementById("colorSwatch");

    spriteEditPanel.style.display = "block";
    spriteID.value = editingSprite.index;
    spriteSource.value = editingSprite.type;
    spriteImage.value = editingSprite.customImageName;
    spriteComment.value = editingSprite.comment;
    const xscale = editingSprite.xscale !== undefined ? editingSprite.xscale : 1.0;
    const yscale = editingSprite.yscale !== undefined ? editingSprite.yscale : 1.0;
    const rotation = editingSprite.rotation !== undefined ? editingSprite.rotation : 0.0;
    const zoom = editingSprite._zoom !== undefined ? editingSprite._zoom : 1.0;
    if (editingSprite.xscale === undefined) editingSprite.xscale = 1.0;
    if (editingSprite.yscale === undefined) editingSprite.yscale = 1.0;
    if (editingSprite._zoom === undefined) editingSprite._zoom = 1.0;
    if (editingSprite.rotation === undefined) editingSprite.rotation = 0.0;
    xScale.value = xscale;
    xScaleSlider.value = xscale;
    yScale.value = yscale;
    yScaleSlider.value = yscale;
    rotationEl.value = rotation;
    rotationSlider.value = rotation;
    if (zoomEl) zoomEl.value = zoom;
    if (zoomSlider) zoomSlider.value = zoom;
    if (spriteMode) {
        if (editingSprite.hasOwnProperty("mode") && editingSprite.mode !== undefined && editingSprite.mode !== null) {
            spriteMode.value = editingSprite.mode.toString();
        } else {
            spriteMode.value = "";
        }
        const spriteModeWrapper = spriteMode.closest("div[style*='position: relative']");
        if (spriteModeWrapper) {
            const buttonText = spriteModeWrapper.querySelector(".custom-dropdown-button span");
            if (buttonText) {
                const selectedOption = spriteMode.options[spriteMode.selectedIndex];
                if (selectedOption) {
                    buttonText.textContent = selectedOption.text;
                }
            }
        }
    }
    spriteLeft.value = editingSprite.left;
    spriteTop.value = editingSprite.top;
    spriteWidth.value = editingSprite.width;
    spriteHeight.value = editingSprite.height;
    const colorEffectCheckbox = document.getElementById("colorEffectCheckbox");
    if (colorEffectCheckbox) colorEffectCheckbox.textContent = editingSprite.colorEffectEnabled ? "✓" : " ";
    if (colorSwatch && editingSprite.colorEffect) {
        const c = editingSprite.colorEffect;
        const hex = `#${[c.r, c.g, c.b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
        colorSwatch.value = hex;
    }
    const colorR = document.getElementById("colorR");
    const colorG = document.getElementById("colorG");
    const colorB = document.getElementById("colorB");
    const colorA = document.getElementById("colorA");
    if (colorR && editingSprite.colorEffect) colorR.value = editingSprite.colorEffect.r || 255;
    if (colorG && editingSprite.colorEffect) colorG.value = editingSprite.colorEffect.g || 255;
    if (colorB && editingSprite.colorEffect) colorB.value = editingSprite.colorEffect.b || 255;
    if (colorA && editingSprite.colorEffect) colorA.value = editingSprite.colorEffect.a || 255;
    editingSprite.updateBoundingBox();
    drawSpritePreview();
}

function updateItemsCombo() {
    const combo = document.getElementById("itemsCombo");
    const frame = currentAnimation ? currentAnimation.getFrame(currentFrame) : null;
    const selectedPiece = selectedPieces.size === 1 ? Array.from(selectedPieces)[0] : null;
    const selectedId = selectedPiece && selectedPiece.id ? selectedPiece.id : (combo ? combo.value : null);
    if (combo) combo.innerHTML = '<option value="">(none)</option>';
    if (frame) {
        const actualDir = (splitViewEnabled && !currentAnimation.singleDir && selectedPieceDir !== null) ? selectedPieceDir : getDirIndex(currentDir);
        const pieces = frame.pieces[actualDir] || [];
        for (const piece of pieces) {
            const option = document.createElement("option");
            option.value = piece.id;
            option.textContent = piece.toString(currentAnimation);
            if (piece.id === selectedId || (selectedPieces.size === 1 && selectedPieces.has(piece))) {
                option.selected = true;
            }
            if (combo) combo.appendChild(option);
        }

        for (const sound of frame.sounds || []) {
            const option = document.createElement("option");
            option.value = sound.id;
            option.textContent = `[SOUND] ${sound.fileName}`;
            if (sound.id === selectedId || (selectedPieces.size === 1 && selectedPieces.has(sound))) {
                option.selected = true;
            }
            if (combo) combo.appendChild(option);
        }
    }
    if (combo && selectedId) {
        combo.value = selectedId;
        const selectedOption = Array.from(combo.options).find(opt => opt.value === selectedId);
        if (selectedOption) {
            selectedOption.selected = true;
            const wrapper = combo.closest("div");
            const button = wrapper ? wrapper.querySelector(".custom-dropdown-button span") : null;
            if (button) {
                button.textContent = selectedOption.textContent;
            }
        }
    }
    updateItemSettings();
}

function updateItemSettings() {
    const combo = document.getElementById("itemsCombo");
    const frame = currentAnimation ? currentAnimation.getFrame(currentFrame) : null;
    const actualDir = (splitViewEnabled && !currentAnimation.singleDir && selectedPieceDir !== null) ? selectedPieceDir : getDirIndex(currentDir);
    const pieces = frame ? frame.pieces[actualDir] || [] : [];
    const sounds = frame ? (frame.sounds || []) : [];
    let piece = null;
    if (selectedPieces.size === 1) {
        const selectedPiece = Array.from(selectedPieces)[0];
        piece = pieces.find(p => p === selectedPiece || p.id === selectedPiece.id || p.id === selectedPiece);
        if (!piece) {
            piece = sounds.find(s => s === selectedPiece || (s.id && s.id === selectedPiece.id) || (s.id && s.id === selectedPiece));
        }
        if (piece && combo) {
            if (piece.id) combo.value = piece.id;
            else if (piece.toString) combo.value = piece.toString();
        }
    } else if (selectedPieces.size === 0) {
        const pieceId = combo ? combo.value : null;
        if (pieceId) {
            piece = pieces.find(p => p.id === pieceId);
            if (!piece) {
                piece = sounds.find(s => (s.id && s.id === pieceId) || s.toString() === pieceId);
            }
            if (piece) {
                selectedPieces.clear();
                selectedPieces.add(piece);
            }
        }
    }
    const itemXScale = document.getElementById("itemXScale");
    const itemYScale = document.getElementById("itemYScale");
    const itemRotation = document.getElementById("itemRotation");
    const itemXScaleSlider = document.getElementById("itemXScaleSlider");
    const itemYScaleSlider = document.getElementById("itemYScaleSlider");
    const itemRotationSlider = document.getElementById("itemRotationSlider");
    const itemX = document.getElementById("itemX");
    const itemY = document.getElementById("itemY");
    const isSound = piece && piece.type === "sound";
    if (!piece) {
        document.getElementById("itemSpriteID").value = "";
        if (itemX) {
            itemX.value = "";
            itemX.disabled = true;
        }
        if (itemY) {
            itemY.value = "";
            itemY.disabled = true;
        }
        if (itemXScale) {
            itemXScale.value = "1.0";
            itemXScale.disabled = true;
        }
        if (itemYScale) {
            itemYScale.value = "1.0";
            itemYScale.disabled = true;
        }
        if (itemRotation) {
            itemRotation.value = "0";
            itemRotation.disabled = true;
        }
        if (itemXScaleSlider) itemXScaleSlider.disabled = true;
        if (itemYScaleSlider) itemYScaleSlider.disabled = true;
        if (itemRotationSlider) itemRotationSlider.disabled = true;
        const itemZoom = document.getElementById("itemZoom");
        const itemZoomSlider = document.getElementById("itemZoomSlider");
        if (itemZoom) {
            itemZoom.value = "1.0";
            itemZoom.disabled = true;
        }
        if (itemZoomSlider) itemZoomSlider.disabled = true;
        const itemLayer = document.getElementById("itemLayer");
        if (itemLayer) {
            itemLayer.value = "";
            itemLayer.disabled = true;
        }
        return;
    }
    if (isSound) {
        document.getElementById("itemSpriteID").value = piece.fileName || "";
        if (itemX) {
            itemX.value = piece.xoffset || 0;
            itemX.disabled = false;
        }
        if (itemY) {
            itemY.value = piece.yoffset || 0;
            itemY.disabled = false;
        }
        if (itemXScale) {
            itemXScale.value = "1.0";
            itemXScale.disabled = true;
        }
        if (itemYScale) {
            itemYScale.value = "1.0";
            itemYScale.disabled = true;
        }
        if (itemRotation) {
            itemRotation.value = "0";
            itemRotation.disabled = true;
        }
        if (itemXScaleSlider) itemXScaleSlider.disabled = true;
        if (itemYScaleSlider) itemYScaleSlider.disabled = true;
        if (itemRotationSlider) itemRotationSlider.disabled = true;
        const itemZoom = document.getElementById("itemZoom");
        const itemZoomSlider = document.getElementById("itemZoomSlider");
        if (itemZoom) {
            itemZoom.value = "1.0";
            itemZoom.disabled = true;
        }
        if (itemZoomSlider) itemZoomSlider.disabled = true;
        const itemLayer = document.getElementById("itemLayer");
        if (itemLayer) {
            itemLayer.value = "0";
            itemLayer.disabled = true;
        }
        updateSpinnerStates();
    } else {
        document.getElementById("itemSpriteID").value = piece.spriteIndex === SPRITE_INDEX_STRING ? piece.spriteName : String(piece.spriteIndex);
        if (itemX) {
            itemX.value = piece.xoffset;
            itemX.disabled = false;
        }
        if (itemY) {
            itemY.value = piece.yoffset;
            itemY.disabled = false;
        }
        const xscale = piece.xscale !== undefined ? piece.xscale : 1.0;
        const yscale = piece.yscale !== undefined ? piece.yscale : 1.0;
        const rotation = piece.rotation !== undefined ? piece.rotation : 0.0;
        const zoom = piece._zoom !== undefined ? piece._zoom : 1.0;
        if (piece.xscale === undefined) piece.xscale = 1.0;
        if (piece.yscale === undefined) piece.yscale = 1.0;
        if (piece._zoom === undefined) piece._zoom = 1.0;
        if (piece.rotation === undefined) piece.rotation = 0.0;
        if (itemXScale) {
            itemXScale.value = xscale;
            itemXScale.disabled = false;
        }
        if (itemXScaleSlider) {
            itemXScaleSlider.value = xscale;
            itemXScaleSlider.disabled = false;
        }
        if (itemYScale) {
            itemYScale.value = yscale;
            itemYScale.disabled = false;
        }
        if (itemYScaleSlider) {
            itemYScaleSlider.value = yscale;
            itemYScaleSlider.disabled = false;
        }
        if (itemRotation) {
            itemRotation.value = rotation;
            itemRotation.disabled = false;
        }
        if (itemRotationSlider) {
            itemRotationSlider.value = rotation;
            itemRotationSlider.disabled = false;
        }
        const itemZoom = document.getElementById("itemZoom");
        const itemZoomSlider = document.getElementById("itemZoomSlider");
        if (itemZoom) {
            itemZoom.value = zoom;
            itemZoom.disabled = false;
        }
        if (itemZoomSlider) {
            itemZoomSlider.value = zoom;
            itemZoomSlider.disabled = false;
        }
        const itemLayer = document.getElementById("itemLayer");
        if (itemLayer) {
            const pieceId = combo ? combo.value : null;
            const pieceIndex = pieceId ? pieces.findIndex(p => p.id === pieceId) : -1;
            itemLayer.value = pieceIndex >= 0 ? pieceIndex : 0;
            itemLayer.disabled = false;
            itemLayer.max = pieces.length - 1;
        }
        updateSpinnerStates();
    }
}

function moveSelectedPieces(dx, dy) {
    if (!currentAnimation || selectedPieces.size === 0) return;
    const frame = currentAnimation.getFrame(currentFrame);
    if (!frame) return;
    const oldState = serializeAnimationState();
    for (const piece of selectedPieces) {
        if (piece.type === "sprite") {
            piece.xoffset += dx;
            piece.yoffset += dy;
        } else if (piece.type === "sound") {
            piece.xoffset += dx;
            piece.yoffset += dy;
        }
    }
    const newState = serializeAnimationState();
    const movedPieces = Array.from(selectedPieces).map(p => {
        if (p.type === "sprite" && currentAnimation) {
            const sprite = currentAnimation.getAniSprite(p.spriteIndex, p.spriteName || "");
            if (sprite && sprite.comment) {
                return `"${sprite.comment}"`;
            }
            return `Sprite ${p.spriteIndex}`;
        }
        return `Sound - ${p.fileName || 'unnamed'}`;
    }).join(", ");
    addUndoCommand({
        description: `Move Piece${selectedPieces.size > 1 ? 's' : ''} (${movedPieces})`,
        oldState: oldState,
        newState: newState,
        undo: () => restoreAnimationState(oldState),
        redo: () => restoreAnimationState(newState)
    });
    redraw();
    updateItemsCombo();
    updateItemSettings();
    saveSession();
}

function updateFrameInfo() {
    if (!currentAnimation) {
        document.getElementById("frameCount").textContent = "0/0";
        document.getElementById("totalDuration").textContent = "0.00s";
        document.getElementById("timelineSlider").max = 0;
        document.getElementById("timelineSlider").value = 0;
        const framePosition = document.getElementById("framePosition");
        if (framePosition) {
            framePosition.value = "0";
            framePosition.disabled = true;
            framePosition.max = 0;
        }
        return;
    }
    document.getElementById("frameCount").textContent = `${currentFrame + 1}/${currentAnimation.frames.length || 1}`;
    const totalDuration = currentAnimation.frames.reduce((sum, f) => sum + f.duration, 0);
    document.getElementById("totalDuration").textContent = (totalDuration / 1000).toFixed(2) + "s";
    document.getElementById("timelineSlider").max = Math.max(0, currentAnimation.frames.length - 1);
    document.getElementById("timelineSlider").value = currentFrame;
    const framePosition = document.getElementById("framePosition");
    if (framePosition) {
        framePosition.value = currentFrame;
        framePosition.max = currentAnimation.frames.length - 1;
        framePosition.disabled = false;
    }
    const frame = currentAnimation.getFrame(currentFrame);
    if (frame) {
        document.getElementById("duration").value = frame.duration;
        updateSoundsList();
    }
    updateItemsCombo();
}

function updateSoundsList() {
    const list = document.getElementById("soundsList");
    list.innerHTML = "";
    const frame = currentAnimation.getFrame(currentFrame);
    if (!frame) return;
    for (const sound of frame.sounds) {
        const li = document.createElement("li");
        li.style.cursor = "pointer";
        li.style.padding = "2px 4px";
        li.style.margin = "1px 0";
        li.style.userSelect = "none";
        if (selectedPieces.has(sound)) {
            li.style.background = "#4472C4";
        } else {
            li.style.background = "transparent";
        }
        let isEditing = false;
        function renderSoundItem() {
            li.innerHTML = "";
            if (isEditing) {
                const input = document.createElement("input");
                input.value = sound.fileName;
                input.style.background = "#2b2b2b";
                input.style.border = "2px solid #4472C4";
                input.style.color = "#ffffff";
                input.style.width = "100%";
                input.style.outline = "none";
                input.style.padding = "2px 4px";
                input.style.fontWeight = "bold";
                input.style.caretColor = "#ffffff";
                input.onkeydown = (e) => {
                    if (e.key === "Enter") {
                        finishEditing();
                    } else if (e.key === "Escape") {
                        cancelEditing();
                    }
                };
                input.onblur = finishEditing;
                input.onclick = (e) => e.stopPropagation();
                li.style.userSelect = "text";
                li.style.background = "#1a4d7a";
                li.style.border = "1px solid #4472C4";
                li.appendChild(input);
                input.focus();
                input.select();
            } else {
                li.textContent = sound.fileName;
            }
        }
        function finishEditing() {
            const input = li.querySelector("input");
            if (input) {
                sound.fileName = input.value;
                redraw();
                saveSession();
            }
            isEditing = false;
            li.style.userSelect = "none";
            li.style.background = selectedPieces.has(sound) ? "#4472C4" : "transparent";
            li.style.border = "none";
            renderSoundItem();
        }

        function cancelEditing() {
            isEditing = false;
            li.style.userSelect = "none";
            li.style.background = selectedPieces.has(sound) ? "#4472C4" : "transparent";
            li.style.border = "none";
            renderSoundItem();
        }
        let clickCount = 0;
        let clickTimer = null;
        let touchTimer = null;
        let touchStartTime = 0;

        li.ontouchstart = (e) => {
            if (isEditing) return;
            e.preventDefault();
            touchStartTime = Date.now();
            touchTimer = setTimeout(() => {
                isEditing = true;
                renderSoundItem();
            }, 500);
        };

        li.ontouchend = (e) => {
            if (touchTimer) {
                clearTimeout(touchTimer);
                touchTimer = null;
            }
            const touchDuration = Date.now() - touchStartTime;
            if (touchDuration < 500) {
                li.onclick(e);
            }
        };

        li.onclick = (e) => {
            if (isEditing) return;
            clickCount++;
            if (clickCount === 1) {
                clickTimer = setTimeout(() => {
                    if (e.shiftKey) {
                        if (selectedPieces.has(sound)) {
                            selectedPieces.delete(sound);
                        } else {
                            selectedPieces.add(sound);
                        }
                    } else {
                        selectedPieces.clear();
                        selectedPieces.add(sound);
                    }
                    updateSoundsList();
                    updateItemSettings();
                    redraw();
                    clickCount = 0;
                }, 300);
            } else if (clickCount === 2) {
                clearTimeout(clickTimer);
                clickCount = 0;
                isEditing = true;
                renderSoundItem();
            }
        };

        renderSoundItem();
        list.appendChild(li);
    }
}

function updateAnimationSettings() {
    if (!currentAnimation) return;
    const singleDirCheckbox = document.getElementById("singleDirCheckbox");
    const loopedCheckbox = document.getElementById("loopedCheckbox");
    const continousCheckbox = document.getElementById("continousCheckbox");
    if (singleDirCheckbox) singleDirCheckbox.textContent = currentAnimation.singleDir ? "✓" : " ";
    if (loopedCheckbox) loopedCheckbox.textContent = currentAnimation.looped ? "✓" : " ";
    if (continousCheckbox) continousCheckbox.textContent = currentAnimation.continous ? "✓" : " ";
    document.getElementById("nextAni").value = currentAnimation.nextAni;
}

function updateDefaultsTable() {
    const tbody = document.querySelector("#defaultsTable tbody");
    if (!tbody) {
        f12Log("updateDefaultsTable: tbody not found");
        return;
    }
    if (!currentAnimation) {
        tbody.innerHTML = "";
        return;
    }
    if (!currentAnimation) {
        f12Log("updateDefaultsTable: no currentAnimation");
        return;
    }
    f12Log("updateDefaultsTable: currentAnimation.defaultImages: " + JSON.stringify(Array.from(currentAnimation.defaultImages.entries())));
    tbody.innerHTML = "";
    const defaults = ["HEAD", "BODY", "SWORD", "SHIELD", "HORSE", "PICS", "SPRITES", "ATTR1", "ATTR2", "ATTR3", "ATTR4", "ATTR5", "ATTR6", "ATTR7", "ATTR8", "ATTR9", "ATTR10", "PARAM1", "PARAM2", "PARAM3", "PARAM4", "PARAM5", "PARAM6", "PARAM7", "PARAM8", "PARAM9", "PARAM10"];
    for (const key of defaults) {
        const defaultValue = currentAnimation.getDefaultImageName(key);
        f12Log(`Default for ${key}: "${defaultValue}"`);
        const tr = document.createElement("tr");
        const td1 = document.createElement("td");
        td1.textContent = key;
        const td2 = document.createElement("td");
        const input = document.createElement("input");
        input.value = defaultValue;
        input.onchange = () => {
            currentAnimation.setDefaultImage(key, input.value);
            f12Log(`User changed default for ${key} to: "${input.value}"`);
            if (key === "SPRITES") {
                ensureShadowSprite(currentAnimation);
                updateSpritesList();
                redraw();
            }
            saveSession();
        };
        td2.appendChild(input);
        tr.appendChild(td1);
        tr.appendChild(td2);
        tbody.appendChild(tr);
    }
}

function updateHistoryMenu() {
    const historyList = document.getElementById("historyList");
    const historyGroup = document.getElementById("historyGroup");
    const btnHistoryUndo = document.getElementById("btnHistoryUndo");
    const btnHistoryRedo = document.getElementById("btnHistoryRedo");
    const btnToolbarUndo = document.getElementById("btnUndo");
    const btnToolbarRedo = document.getElementById("btnRedo");
    if (!historyList || !historyGroup) return;
    if (!currentAnimation) {
        historyGroup.style.display = "none";
        return;
    }
    const undoStack = getCurrentUndoStack();
    const undoIndex = getCurrentUndoIndex();
    historyGroup.style.display = "block";
    historyList.innerHTML = "";
    const currentFont = localStorage.getItem("editorFont") || "chevyray";
    const fontFamily = getFontFamily(currentFont);
    historyList.style.fontFamily = fontFamily;
    for (let i = undoStack.length - 1; i >= 0; i--) {
        const item = document.createElement("div");
        item.style.padding = "2px 4px";
        item.style.cursor = "pointer";
        item.style.opacity = i > undoIndex ? "0.5" : "1";
        item.style.backgroundColor = i === undoIndex ? "#4472C4" : "transparent";
        item.style.fontFamily = fontFamily;
        let displayText = undoStack[i].description;
        if (!displayText && undoStack[i].oldState && undoStack[i].newState) {
            displayText = generateHistoryDescription(undoStack[i].oldState, undoStack[i].newState);
            undoStack[i].description = displayText;
        }
        if (!displayText) {
            displayText = `Action ${i + 1}`;
        }
        if (currentAnimation) {
            displayText = displayText.replace(/Sprite (\d+)/g, (match, indexStr) => {
                const spriteIndex = parseInt(indexStr);
                const sprite = currentAnimation.getAniSprite(spriteIndex, "");
                if (sprite && sprite.comment) {
                    return `Sprite "${sprite.comment}"`;
                }
                return match;
            });
            displayText = displayText.replace(/Piece.*?\((\d+)\)/g, (match, indexStr) => {
                const spriteIndex = parseInt(indexStr);
                const sprite = currentAnimation.getAniSprite(spriteIndex, "");
                if (sprite && sprite.comment) {
                    return match.replace(indexStr, `"${sprite.comment}"`);
                }
                return match;
            });
            displayText = displayText.replace(/\(([a-z0-9]+)\)/g, (match, idStr) => {
                if (idStr.length === 9 && /^[a-z0-9]+$/.test(idStr)) {
                    const frame = currentAnimation ? currentAnimation.getFrame(currentFrame) : null;
                    if (frame) {
                        const actualDir = getDirIndex(currentDir);
                        const pieces = frame.pieces[actualDir] || [];
                        const piece = pieces.find(p => p.id === idStr);
                        if (piece && piece.type === "sprite") {
                            const sprite = currentAnimation.getAniSprite(piece.spriteIndex, piece.spriteName || "");
                            if (sprite && sprite.comment) {
                                return `("${sprite.comment}")`;
                            }
                            return `(Sprite ${piece.spriteIndex})`;
                        }
                    }
                }
                return match;
            });
        }
        item.textContent = displayText;
        item.onclick = () => {
            let currentUndoIndex = getCurrentUndoIndex();
            const currentUndoStack = getCurrentUndoStack();
            while (currentUndoIndex < i && currentUndoIndex < currentUndoStack.length - 1) {
                currentUndoIndex++;
                const cmd = currentUndoStack[currentUndoIndex];
                if (cmd && cmd.redo && typeof cmd.redo === 'function') {
                    cmd.redo();
                } else if (cmd && cmd.newState) {
                    restoreAnimationState(cmd.newState);
                }
            }
            while (currentUndoIndex > i && currentUndoIndex >= 0) {
                const cmd = currentUndoStack[currentUndoIndex];
                if (cmd && cmd.undo && typeof cmd.undo === 'function') {
                    cmd.undo();
                } else if (cmd && cmd.oldState) {
                    restoreAnimationState(cmd.oldState);
                }
                currentUndoIndex--;
            }
            setCurrentUndoIndex(currentUndoIndex);
            redraw();
            updateFrameInfo();
            updateSpritesList();
            updateHistoryMenu();
            saveUndoStack();
        };
        historyList.appendChild(item);
    }
    if (btnHistoryUndo) {
        btnHistoryUndo.disabled = undoIndex < 0;
        btnHistoryUndo.onclick = undoIndex >= 0 ? () => undo() : null;
    }
    if (btnHistoryRedo) {
        btnHistoryRedo.disabled = undoIndex >= undoStack.length - 1;
        btnHistoryRedo.onclick = undoIndex < undoStack.length - 1 ? () => redo() : null;
    }
    if (btnHistoryClear) {
        const currentUndoStack = getCurrentUndoStack();
        btnHistoryClear.disabled = currentUndoStack.length === 0;
        btnHistoryClear.onclick = currentUndoStack.length > 0 ? () => showConfirmDialog("Are you sure you want to clear all undo/redo history? This action cannot be undone.", (confirmed) => {
            if (confirmed && currentAnimation) {
                currentAnimation.undoStack = [];
                currentAnimation.undoIndex = -1;
                updateHistoryMenu();
                saveUndoStack();
            }
        }) : null;
    }
    if (btnToolbarUndo) btnToolbarUndo.disabled = undoIndex < 0;
    if (btnToolbarRedo) btnToolbarRedo.disabled = undoIndex >= undoStack.length - 1;

    const historyLoggingToggleCheckbox = document.getElementById("historyLoggingToggleCheckbox");
    if (historyLoggingToggleCheckbox) {
        const enabled = getCurrentHistoryLoggingEnabled();
        historyLoggingToggleCheckbox.textContent = enabled ? "✓" : " ";
        historyLoggingToggleCheckbox.onclick = () => {
            const newEnabled = !getCurrentHistoryLoggingEnabled();
            setCurrentHistoryLoggingEnabled(newEnabled);
            historyLoggingToggleCheckbox.textContent = newEnabled ? "✓" : " ";
            if (currentAnimation && currentTabIndex >= 0) {
                localStorage.setItem("ganiEditorHistoryLoggingEnabled_" + currentTabIndex, newEnabled);
                currentAnimation.historyLoggingEnabled = newEnabled;
            }
        };
    }
}

function addUndoCommand(command) {
    if (!getCurrentHistoryLoggingEnabled()) return;
    if (!currentAnimation) return;
    if (command.oldState && command.newState) {
        const oldStr = JSON.stringify(command.oldState);
        const newStr = JSON.stringify(command.newState);
        if (oldStr === newStr) return;
    }
    const undoStack = getCurrentUndoStack();
    let undoIndex = getCurrentUndoIndex();
    undoStack.splice(undoIndex + 1);
    undoStack.push(command);
    if (undoStack.length > maxUndo) {
        undoStack.shift();
        undoIndex = maxUndo - 1;
    } else {
        undoIndex++;
    }
    setCurrentUndoIndex(undoIndex);
    if (command.newState) lastSerializedState = command.newState;
    updateHistoryMenu();
    saveUndoStack();
}

function undo() {
    _dragMoveIndicator = null;
    const undoStack = getCurrentUndoStack();
    let undoIndex = getCurrentUndoIndex();
    if (undoIndex >= 0 && undoStack[undoIndex]) {
        const cmd = undoStack[undoIndex];
        f12Log(`Undo: ${cmd.description}, has undo function: ${!!cmd.undo}, has oldState: ${!!cmd.oldState}`);
        if (cmd.oldState) {
            restoreAnimationState(cmd.oldState);
        } else if (cmd.undo && typeof cmd.undo === 'function') {
            cmd.undo();
        }
        undoIndex--;
        setCurrentUndoIndex(undoIndex);
        redraw();
        updateFrameInfo();
        updateSpritesList();
        updateHistoryMenu();
        saveUndoStack();
    }
}

function redo() {
    const undoStack = getCurrentUndoStack();
    let undoIndex = getCurrentUndoIndex();
    if (undoIndex < undoStack.length - 1 && undoStack[undoIndex + 1]) {
        undoIndex++;
        const cmd = undoStack[undoIndex];
        f12Log(`Redo: ${cmd.description}, has redo function: ${!!cmd.redo}, has newState: ${!!cmd.newState}`);
        if (cmd.newState) {
            restoreAnimationState(cmd.newState);
        } else if (cmd.redo && typeof cmd.redo === 'function') {
            cmd.redo();
        }
        setCurrentUndoIndex(undoIndex);
        redraw();
        updateFrameInfo();
        updateSpritesList();
        updateHistoryMenu();
        saveUndoStack();
    }
}

function generateHistoryDescription(oldState, newState) {
        if (!oldState || !newState) return "Action";
    const changes = [];
    const oldFrameCount = oldState.frames?.length || 0;
    const newFrameCount = newState.frames?.length || 0;
    if (oldFrameCount !== newFrameCount) {
        const diff = newFrameCount - oldFrameCount;
        if (diff > 0) changes.push(`Add ${diff} Frame${diff > 1 ? 's' : ''}`);
        else changes.push(`Remove ${Math.abs(diff)} Frame${Math.abs(diff) > 1 ? 's' : ''}`);
    }
    let piecesAdded = 0;
    let piecesRemoved = 0;
    let movedPieces = new Set();
    if (oldState.frames && newState.frames) {
        for (let f = 0; f < Math.min(oldState.frames.length, newState.frames.length); f++) {
            const oldFrame = oldState.frames[f];
            const newFrame = newState.frames[f];
            if (oldFrame?.pieces && newFrame?.pieces) {
                for (let d = 0; d < Math.min(oldFrame.pieces.length, newFrame.pieces.length); d++) {
                    const oldDir = oldFrame.pieces[d] || [];
                    const newDir = newFrame.pieces[d] || [];
                    const oldPieceMap = new Map(oldDir.map(p => [p.id, p]));
                    const newPieceMap = new Map(newDir.map(p => [p.id, p]));
                    
                    for (const [id, newPiece] of newPieceMap) {
                        const oldPiece = oldPieceMap.get(id);
                        if (!oldPiece) {
                            piecesAdded++;
                        } else if (oldPiece.xoffset !== newPiece.xoffset || oldPiece.yoffset !== newPiece.yoffset ||
                                   oldPiece.xscale !== newPiece.xscale || oldPiece.yscale !== newPiece.yscale ||
                                   oldPiece.rotation !== newPiece.rotation) {
                            movedPieces.add(id);
                        }
                    }
                    for (const [id] of oldPieceMap) {
                        if (!newPieceMap.has(id)) {
                            piecesRemoved++;
                        }
                    }
                }
            }
        }
    }
    const oldSpriteCount = oldState.sprites?.length || 0;
    const newSpriteCount = newState.sprites?.length || 0;
    if (oldSpriteCount !== newSpriteCount) {
        const diff = newSpriteCount - oldSpriteCount;
        if (diff > 0) changes.push(`Add ${diff} Sprite${diff > 1 ? 's' : ''}`);
        else changes.push(`Remove ${Math.abs(diff)} Sprite${Math.abs(diff) > 1 ? 's' : ''}`);
    }
    let changedSprites = new Set();
    let attachmentsAdded = 0;
    let attachmentsRemoved = 0;
    let attachmentsMoved = 0;
    if (oldState.sprites && newState.sprites) {
        const oldSpriteMap = new Map((oldState.sprites || []).map(s => [s.index, s]));
        const newSpriteMap = new Map((newState.sprites || []).map(s => [s.index, s]));
        for (const [idx, newSprite] of newSpriteMap) {
            const oldSprite = oldSpriteMap.get(idx);
            if (oldSprite) {
                const oldAttachments = oldSprite.attachedSprites || [];
                const newAttachments = newSprite.attachedSprites || [];
                const oldAttachmentStr = JSON.stringify(oldAttachments);
                const newAttachmentStr = JSON.stringify(newAttachments);
                if (oldAttachmentStr !== newAttachmentStr) {
                    if (newAttachments.length > oldAttachments.length) {
                        attachmentsAdded += newAttachments.length - oldAttachments.length;
                    } else if (newAttachments.length < oldAttachments.length) {
                        attachmentsRemoved += oldAttachments.length - newAttachments.length;
                    } else {
                        attachmentsMoved++;
                    }
                    changedSprites.add(idx);
                }
                if (oldSprite.left !== newSprite.left || oldSprite.top !== newSprite.top ||
                    oldSprite.width !== newSprite.width || oldSprite.height !== newSprite.height ||
                    oldSprite.xscale !== newSprite.xscale || oldSprite.yscale !== newSprite.yscale ||
                    oldSprite.rotation !== newSprite.rotation ||
                    JSON.stringify(oldSprite.colorEffect || {}) !== JSON.stringify(newSprite.colorEffect || {}) ||
                    oldSprite.mode !== newSprite.mode ||
                    oldSprite.comment !== newSprite.comment) {
                    changedSprites.add(idx);
                }
            }
        }
    }
    let scaledPieces = 0;
    let rotatedPieces = 0;
    for (const pieceId of movedPieces) {
        if (oldState.frames && newState.frames) {
            for (let f = 0; f < Math.min(oldState.frames.length, newState.frames.length); f++) {
                const oldFrame = oldState.frames[f];
                const newFrame = newState.frames[f];
                if (oldFrame?.pieces && newFrame?.pieces) {
                    for (let d = 0; d < Math.min(oldFrame.pieces.length, newFrame.pieces.length); d++) {
                        const oldDir = oldFrame.pieces[d] || [];
                        const newDir = newFrame.pieces[d] || [];
                        const oldPiece = oldDir.find(p => p.id === pieceId);
                        const newPiece = newDir.find(p => p.id === pieceId);
                        if (oldPiece && newPiece) {
                            if (oldPiece.xscale !== newPiece.xscale || oldPiece.yscale !== newPiece.yscale) scaledPieces++;
                            if (oldPiece.rotation !== newPiece.rotation) rotatedPieces++;
                        }
                    }
                }
            }
        }
    }
    if (piecesAdded > 0) changes.push(`Add ${piecesAdded} Piece${piecesAdded > 1 ? 's' : ''}`);
    if (piecesRemoved > 0) changes.push(`Remove ${piecesRemoved} Piece${piecesRemoved > 1 ? 's' : ''}`);
    if (attachmentsAdded > 0) changes.push(`Add ${attachmentsAdded} Attachment${attachmentsAdded > 1 ? 's' : ''}`);
    if (attachmentsRemoved > 0) changes.push(`Remove ${attachmentsRemoved} Attachment${attachmentsRemoved > 1 ? 's' : ''}`);
    if (attachmentsMoved > 0) changes.push(`Move ${attachmentsMoved} Attachment${attachmentsMoved > 1 ? 's' : ''}`);
    if (changes.length > 0) {
        return changes.join(", ");
    } else if (movedPieces.size > 0) {
        const pieceInfo = [];
        for (const pieceId of Array.from(movedPieces).slice(0, 3)) {
            if (oldState.frames && newState.frames) {
                for (let f = 0; f < Math.min(oldState.frames.length, newState.frames.length); f++) {
                    const oldFrame = oldState.frames[f];
                    const newFrame = newState.frames[f];
                    if (oldFrame?.pieces && newFrame?.pieces) {
                        for (let d = 0; d < Math.min(oldFrame.pieces.length, newFrame.pieces.length); d++) {
                            const oldDir = oldFrame.pieces[d] || [];
                            const newDir = newFrame.pieces[d] || [];
                            const piece = newDir.find(p => p.id === pieceId) || oldDir.find(p => p.id === pieceId);
                            if (piece && piece.type === "sprite") {
                                if (currentAnimation) {
                                    const sprite = currentAnimation.getAniSprite(piece.spriteIndex, piece.spriteName || "");
                                    if (sprite?.comment) {
                                        pieceInfo.push(`"${sprite.comment}"`);
                                    } else {
                                        pieceInfo.push(`Sprite ${piece.spriteIndex}`);
                                    }
                                } else {
                                    pieceInfo.push(`Sprite ${piece.spriteIndex}`);
                                }
                                break;
                            }
                        }
                    }
                }
            }
        }
        const pieceName = pieceInfo.length > 0 ? ` ${pieceInfo[0]}${pieceInfo.length > 1 ? ` +${pieceInfo.length - 1}` : ''}` : '';
        if (scaledPieces > 0 && rotatedPieces === 0) {
            return `Scale Piece${scaledPieces > 1 ? 's' : ''}${pieceName}`;
        } else if (rotatedPieces > 0 && scaledPieces === 0) {
            return `Rotate Piece${rotatedPieces > 1 ? 's' : ''}${pieceName}`;
        } else {
            return `Move Piece${movedPieces.size > 1 ? 's' : ''}${pieceName}`;
        }
    } else if (changedSprites.size > 0) {
        const spriteNames = [];
        for (const idx of changedSprites) {
            if (currentAnimation) {
                const sprite = currentAnimation.getAniSprite(idx, "");
                if (sprite?.comment) {
                    spriteNames.push(`"${sprite.comment}"`);
                } else {
                    spriteNames.push(`Sprite ${idx}`);
                }
            } else {
                spriteNames.push(`Sprite ${idx}`);
            }
        }
        if (spriteNames.length === 1) {
            return `Change ${spriteNames[0]}`;
        } else if (spriteNames.length <= 3) {
            return `Change ${spriteNames.join(", ")}`;
        } else {
            return `Change ${spriteNames.length} Sprites`;
        }
    } else if (oldState.currentFrame !== newState.currentFrame) {
        return `Change Frame`;
    } else {
        return "Action";
    }
}

function serializeAnimationState() {
    if (!currentAnimation) return null;
    const state = {
        frames: currentAnimation.frames.map(f => ({
        pieces: f.pieces.map(dir => dir.map(p => {
            if (p.type === "sprite") {
                return {
                    type: "sprite",
                    spriteIndex: p.spriteIndex,
                    spriteName: p.spriteName || "",
                    xoffset: p.xoffset || 0,
                    yoffset: p.yoffset || 0,
                    xscale: p.xscale !== undefined ? p.xscale : 1.0,
                    yscale: p.yscale !== undefined ? p.yscale : 1.0,
                    _zoom: p._zoom !== undefined ? p._zoom : 1.0,
                    rotation: p.rotation !== undefined ? p.rotation : 0.0,
                    id: p.id
                };
            } else if (p.type === "sound") {
                return {
                    type: "sound",
                    fileName: p.fileName || "",
                    xoffset: p.xoffset || 0,
                    yoffset: p.yoffset || 0,
                    id: p.id
                };
            }
            return null;
        }).filter(p => p !== null)),
            sounds: (f.sounds || []).map(s => ({
                fileName: s.fileName,
                xoffset: s.xoffset,
                yoffset: s.yoffset
            })),
            duration: f.duration
        })),
        sprites: Array.from(currentAnimation.sprites.entries()).map(([idx, s]) => ({
            index: s.index,
            type: s.type,
            customImageName: s.customImageName,
            comment: s.comment,
            left: s.left,
            top: s.top,
            width: s.width,
            height: s.height,
            xscale: s.xscale,
            yscale: s.yscale,
            _zoom: s._zoom !== undefined ? s._zoom : 1.0,
            rotation: s.rotation,
            colorEffectEnabled: s.colorEffectEnabled,
            colorEffect: s.colorEffect ? {r: s.colorEffect.r, g: s.colorEffect.g, b: s.colorEffect.b, a: s.colorEffect.a} : {r: 255, g: 255, b: 255, a: 255},
            ...(s.hasOwnProperty("mode") && s.mode !== undefined && s.mode !== null ? {mode: s.mode} : {}),
            attachedSprites: (s.attachedSprites || []).map(a => ({
                index: a.index,
                offset: a.offset ? {x: a.offset.x, y: a.offset.y} : {x: 0, y: 0}
            })),
            m_drawIndex: s.m_drawIndex || 0
        })),
        currentFrame: currentFrame,
        selectedPieceIds: Array.from(selectedPieces).map(p => p.id).filter(id => id),
        selectedPieceDir: selectedPieceDir
    };
    return state;
}

function restoreAnimationState(state) {
    if (!currentAnimation || !state) {
        f12Log(`restoreAnimationState: currentAnimation=${!!currentAnimation}, state=${!!state}`);
        return;
    }
    f12Log(`restoreAnimationState: restoring ${state.frames?.length || 0} frames, ${state.sprites?.length || 0} sprites`);
    currentAnimation.frames = state.frames.map(fData => {
        const frame = new Frame();
        frame.duration = fData.duration || 50;
        frame.pieces = fData.pieces.map(dirData => dirData.map(pData => {
            if (pData.type === "sprite") {
                const piece = new FramePieceSprite();
                piece.spriteIndex = pData.spriteIndex || 0;
                piece.spriteName = pData.spriteName || "";
                piece.xoffset = pData.xoffset || 0;
                piece.yoffset = pData.yoffset || 0;
                piece.xscale = pData.xscale !== undefined ? pData.xscale : 1.0;
                piece.yscale = pData.yscale !== undefined ? pData.yscale : 1.0;
                piece._zoom = pData._zoom !== undefined ? pData._zoom : 1.0;
                piece.rotation = pData.rotation !== undefined ? pData.rotation : 0.0;
                piece.id = pData.id || Math.random().toString(36).substr(2, 9);
                return piece;
            } else if (pData.type === "sound") {
                const sound = new FramePieceSound();
                sound.fileName = pData.fileName || "";
                sound.xoffset = pData.xoffset || 0;
                sound.yoffset = pData.yoffset || 0;
                sound.id = pData.id || Math.random().toString(36).substr(2, 9);
                return sound;
            }
            return null;
        }).filter(p => p !== null));
        frame.sounds = (fData.sounds || []).map(sData => {
            const sound = new FramePieceSound();
            sound.fileName = sData.fileName;
            sound.xoffset = sData.xoffset;
            sound.yoffset = sData.yoffset;
            return sound;
        });
        return frame;
    });
    currentAnimation.sprites.clear();
    state.sprites.forEach(sData => {
        const sprite = new AniSprite();
        sprite.index = sData.index;
        sprite.type = sData.type || "CUSTOM";
        sprite.customImageName = sData.customImageName || "";
        sprite.comment = sData.comment || "";
        sprite.left = sData.left || 0;
        sprite.top = sData.top || 0;
        sprite.width = sData.width || 32;
        sprite.height = sData.height || 32;
        sprite.xscale = sData.xscale !== undefined ? sData.xscale : 1.0;
        sprite.yscale = sData.yscale !== undefined ? sData.yscale : 1.0;
        sprite._zoom = sData._zoom !== undefined ? sData._zoom : 1.0;
        sprite.rotation = sData.rotation !== undefined ? sData.rotation : 0.0;
        sprite.colorEffectEnabled = sData.colorEffectEnabled || false;
        sprite.colorEffect = sData.colorEffect ? {...sData.colorEffect} : {r: 255, g: 255, b: 255, a: 255};
        sprite.attachedSprites = sData.attachedSprites || [];
        sprite.m_drawIndex = sData.m_drawIndex || 0;
        if (sData.mode !== undefined && sData.mode !== null) {
            sprite.mode = sData.mode;
        } else {
            delete sprite.mode;
        }
        sprite.updateBoundingBox();
        currentAnimation.sprites.set(sprite.index, sprite);
    });
    currentFrame = Math.min(state.currentFrame || 0, currentAnimation.frames.length - 1);
    const selectedPieceIds = state.selectedPieceIds || [];
    selectedPieces.clear();
    selectedPieceDir = state.selectedPieceDir !== undefined ? state.selectedPieceDir : null;
    selectedSpritesForDeletion.clear();
    if (selectedPieceIds.length > 0) {
        const frame = currentAnimation.getFrame(currentFrame);
        if (frame) {
            const actualDir = (splitViewEnabled && !currentAnimation.singleDir && selectedPieceDir !== null) ? selectedPieceDir : getDirIndex(currentDir);
            const pieces = frame.pieces[actualDir] || [];
            const sounds = frame.sounds || [];
            for (const pieceId of selectedPieceIds) {
                const piece = pieces.find(p => p.id === pieceId);
                if (piece) {
                    selectedPieces.add(piece);
                } else {
                    const sound = sounds.find(s => s.id === pieceId);
                    if (sound) {
                        selectedPieces.add(sound);
                    }
                }
            }
        }
    }
    const previousEditingSpriteIndex = editingSprite ? editingSprite.index : null;
    editingSprite = null;
    if (previousEditingSpriteIndex !== null && currentAnimation.sprites.has(previousEditingSpriteIndex)) {
        editingSprite = currentAnimation.sprites.get(previousEditingSpriteIndex);
    } else if (currentAnimation.sprites.size > 0) {
        editingSprite = Array.from(currentAnimation.sprites.values())[0];
    }
    updateSpritesList();
    updateSpriteEditor();
    updateFrameInfo();
    updateItemsCombo();
    updateAnimationSettings();
    redraw();
}

function saveUndoStack() {
    if (!currentAnimation) return;
    try {
        const undoStack = getCurrentUndoStack();
        const undoIndex = getCurrentUndoIndex();
        const maxSavedUndo = 50;
        const startIndex = Math.max(0, undoStack.length - maxSavedUndo);
        const undoData = {
            animationId: currentAnimation.id,
            undoIndex: undoIndex,
            commands: undoStack.slice(startIndex).map(cmd => ({
                oldState: cmd.oldState || null,
                newState: cmd.newState || null
            }))
        };
        localStorage.setItem("ganiEditorUndoStack_" + currentAnimation.id, JSON.stringify(undoData));
    } catch (e) {
        if (e.name === "QuotaExceededError" || e.message.includes("quota")) {
            f12Log("localStorage quota exceeded, undo history will not persist across sessions");
        } else {
            console.error("Failed to save undo stack:", e);
        }
    }
}

function restoreUndoStack() {
    if (!currentAnimation) return;
    try {
        const undoDataStr = localStorage.getItem("ganiEditorUndoStack_" + currentAnimation.id);
        if (!undoDataStr) {
            if (!currentAnimation.undoStack) currentAnimation.undoStack = [];
            if (currentAnimation.undoIndex === undefined) currentAnimation.undoIndex = -1;
            return;
        }
        const undoData = JSON.parse(undoDataStr);
        if (undoData.animationId && undoData.animationId !== currentAnimation.id) {
            if (!currentAnimation.undoStack) currentAnimation.undoStack = [];
            if (currentAnimation.undoIndex === undefined) currentAnimation.undoIndex = -1;
            return;
        }
        currentAnimation.undoStack = undoData.commands.filter(cmdData => cmdData.oldState && cmdData.newState).map(cmdData => {
            const oldState = cmdData.oldState;
            const newState = cmdData.newState;
            const description = cmdData.description || generateHistoryDescription(oldState, newState);
            return {
                description: description,
                oldState: oldState,
                newState: newState,
                undo: () => {
                    f12Log(`Restore undo: ${description}`);
                    restoreAnimationState(oldState);
                },
                redo: () => {
                    f12Log(`Restore redo: ${description}`);
                    restoreAnimationState(newState);
                }
            };
        });
        currentAnimation.undoIndex = Math.min(undoData.undoIndex || -1, currentAnimation.undoStack.length - 1);
        updateHistoryMenu();
    } catch (e) {
        console.error("Failed to restore undo stack:", e);
        undoStack = [];
        undoIndex = -1;
    }
}

function initNewAnimation() {
    selectedSpritesForDeletion.clear();
    if (animations.length === 0) {
        animations.push(new Animation());
    }
    currentAnimation = animations[0];
    if (currentAnimation.sprites.size === 0 && currentAnimation.frames.length === 0) {
        currentAnimation.setDefaultImage("SPRITES", "sprites.png");
        currentAnimation.setDefaultImage("PICS", "pics1.png");
        currentAnimation.setDefaultImage("HEAD", "head1.png");
        currentAnimation.setDefaultImage("BODY", "body.png");
        currentAnimation.setDefaultImage("SWORD", "sword1.png");
        currentAnimation.setDefaultImage("SHIELD", "shield1.png");
        loadImage("shield1.png").catch(() => {});
        loadImage("sprites.png").catch(() => {});
        const shadow = new AniSprite();
        shadow.type = "SPRITES";
        shadow.left = 0;
        shadow.top = 0;
        shadow.width = 24;
        shadow.height = 12;
        shadow.comment = "shadow";
        shadow.index = currentAnimation.nextSpriteIndex++;
        shadow.updateBoundingBox();
        currentAnimation.addSprite(shadow);
        const frame = new Frame();
        currentAnimation.frames.push(frame);
        for (let dir = 0; dir < 4; dir++) {
            const shadowPiece = new FramePieceSprite();
            shadowPiece.spriteIndex = shadow.index;
            shadowPiece.xoffset = 12;
            shadowPiece.yoffset = dir % 2 === 0 ? 34 : 36;
            frame.pieces[dir].push(shadowPiece);
        }
    }
    currentFrame = 0;
    currentDir = 2;
    selectedPieces.clear();
    editingSprite = null;
    redraw();
    updateFrameInfo();
    updateSpritesList();
    updateAnimationSettings();
    updateDefaultsTable();
}

function saveCurrentFrame() {
    if (currentAnimation) {
        localStorage.setItem("ganiEditorCurrentFrame_" + currentAnimation.id, currentFrame.toString());
    }
}
function restoreCurrentFrame() {
    if (currentAnimation) {
        const savedFrame = localStorage.getItem("ganiEditorCurrentFrame_" + currentAnimation.id);
        if (savedFrame !== null) {
            const frameIndex = parseInt(savedFrame) || 0;
            currentFrame = Math.min(Math.max(0, frameIndex), currentAnimation.frames.length - 1);
        } else {
            currentFrame = 0;
        }
    }
}
function switchTab(index) {
    if (index < 0 || index >= animations.length) return;
    saveUndoStack();
    saveCurrentFrame();
    selectedSpritesForDeletion.clear();
    selectedFrames.clear();
    currentTabIndex = index;
    currentAnimation = animations[index];
    if (!currentAnimation.undoStack) currentAnimation.undoStack = [];
    if (currentAnimation.undoIndex === undefined) currentAnimation.undoIndex = -1;
    if (currentAnimation.historyLoggingEnabled === undefined) {
        const savedValue = localStorage.getItem("ganiEditorHistoryLoggingEnabled_" + currentAnimation.id);
        currentAnimation.historyLoggingEnabled = savedValue !== null ? savedValue === "true" : true;
    } else {
        const savedValue = localStorage.getItem("ganiEditorHistoryLoggingEnabled_" + currentAnimation.id);
        if (savedValue !== null) {
            currentAnimation.historyLoggingEnabled = savedValue === "true";
        }
    }
    restoreUndoStack();
    const historyLoggingToggleCheckbox = document.getElementById("historyLoggingToggleCheckbox");
    if (historyLoggingToggleCheckbox) {
        const enabled = getCurrentHistoryLoggingEnabled();
        historyLoggingToggleCheckbox.textContent = enabled ? "✓" : " ";
        historyLoggingToggleCheckbox.onclick = () => {
            const newEnabled = !getCurrentHistoryLoggingEnabled();
            setCurrentHistoryLoggingEnabled(newEnabled);
            historyLoggingToggleCheckbox.textContent = newEnabled ? "✓" : " ";
            if (currentAnimation && currentTabIndex >= 0) {
                localStorage.setItem("ganiEditorHistoryLoggingEnabled_" + currentTabIndex, newEnabled);
                currentAnimation.historyLoggingEnabled = newEnabled;
            }
        };
    }
    f12Log(`switchTab to index ${index}, animation defaults: ` + JSON.stringify(Array.from(currentAnimation.defaultImages.entries())));
    restoreCurrentFrame();
    selectedPieces.clear();
    updateTabs();
    updateUIVisibility();
    updateHistoryMenu();
    requestAnimationFrame(() => { resizeCanvas(); redraw(); });
    updateFrameInfo();
    updateHistoryMenu();
    updateSpritesList();
    updateAnimationSettings();
    updateDefaultsTable();
    ensureShadowSprite(currentAnimation);
    saveSession();
}

function ensureShadowSprite(ani) {
    let shadowExists = false;
    let shadowSprite = null;
    for (const sprite of ani.sprites.values()) {
        if (sprite.comment === "shadow" && sprite.type === "SPRITES") {
            shadowExists = true;
            shadowSprite = sprite;
                f12Log(`ensureShadowSprite: shadow sprite already exists at index ${sprite.index}`);
            break;
        }
    }
    if (shadowExists) return;
    let spritesDefault = ani.getDefaultImageName("SPRITES");
    if (!spritesDefault) {
        for (const otherAni of animations) {
            const otherDefault = otherAni.getDefaultImageName("SPRITES");
            if (otherDefault && imageLibrary.has(otherDefault.toLowerCase())) {
                spritesDefault = otherDefault;
                f12Log(`ensureShadowSprite: using SPRITES default "${spritesDefault}" from another animation`);
                break;
            }
        }
        if (!spritesDefault && imageLibrary.has("sprites.png")) {
            spritesDefault = "sprites.png";
            f12Log(`ensureShadowSprite: using fallback "sprites.png"`);
        }
    }
    f12Log(`ensureShadowSprite: animation="${ani.fileName}", SPRITES default="${spritesDefault}", imageLibrary has it: ${spritesDefault ? imageLibrary.has(spritesDefault.toLowerCase()) : false}`);
    if (spritesDefault && imageLibrary.has(spritesDefault.toLowerCase())) {
        f12Log(`ensureShadowSprite: creating new shadow sprite`);
        const shadow = new AniSprite();
        shadow.type = "SPRITES";
        shadow.left = 0;
        shadow.top = 0;
        shadow.width = 24;
        shadow.height = 12;
        shadow.comment = "shadow";
        shadow.index = ani.nextSpriteIndex++;
        shadow.updateBoundingBox();
        ani.addSprite(shadow);
        f12Log(`ensureShadowSprite: created shadow sprite at index ${shadow.index}`);
    } else {
        f12Log(`ensureShadowSprite: NOT creating shadow - spritesDefault="${spritesDefault}", hasImage=${spritesDefault ? imageLibrary.has(spritesDefault.toLowerCase()) : false}`);
    }
}

function refreshAllAnimationsSprites() {
    for (const ani of animations) {
        ensureShadowSprite(ani);
    }
    if (currentAnimation) {
        updateSpritesList();
        redraw();
    }
}

function addTab(ani, fileName = "") {
    if (fileName) ani.fileName = fileName;
    f12Log("addTab: animation defaults: " + JSON.stringify(Array.from(ani.defaultImages.entries())));
    ensureShadowSprite(ani);
    animations.push(ani);
    switchTab(animations.length - 1);
    updateUIVisibility();
    saveSession();
}

function closeTab(index) {
    const tabToClose = animations[index];
    if (tabToClose) {
        tabToClose.undoStack = [];
        tabToClose.undoIndex = -1;
        localStorage.removeItem("ganiEditorUndoStack_" + tabToClose.id);
        localStorage.removeItem("ganiEditorSelectedSprite_" + tabToClose.id);
        localStorage.removeItem("ganiEditorHistoryLoggingEnabled_" + tabToClose.id);
        localStorage.removeItem("ganiEditorCurrentFrame_" + tabToClose.id);
        localStorage.removeItem("selectedSpriteIndex_" + tabToClose.id);
        localStorage.removeItem("selectedSpriteType_" + tabToClose.id);
    }
    animations.splice(index, 1);
    if (animations.length === 0) {
        currentAnimation = null;
        currentTabIndex = -1;
        currentFrame = 0;
        selectedPieces.clear();
        selectedSpritesForDeletion.clear();
        updateTabs();
        updateUIVisibility();
        redraw();
        updateFrameInfo();
        updateSpritesList();
        updateAnimationSettings();
        updateDefaultsTable();
        drawTimeline();
    } else {
        if (index < currentTabIndex) currentTabIndex--;
        if (currentTabIndex >= animations.length) currentTabIndex = animations.length - 1;
        if (currentTabIndex < 0) currentTabIndex = 0;
        switchTab(currentTabIndex);
    }
    saveSession();
}

function updateUIVisibility() {
    const hasAnimations = animations.length > 0;
    const tabsContainer = document.getElementById("tabsContainer");
    const contentArea = document.querySelector(".content-area");
    if (tabsContainer) tabsContainer.style.display = hasAnimations ? "flex" : "none";
    if (contentArea) contentArea.style.display = hasAnimations ? "flex" : "none";
}

function updateTabScrollButtons() {
    const tabCont = document.getElementById("tabsContainer");
    const btnL = document.getElementById("tabScrollLeft");
    const btnR = document.getElementById("tabScrollRight");
    if (!tabCont || !btnL || !btnR) return;
    const hasOverflow = tabCont.scrollWidth > tabCont.clientWidth + 2;
    btnL.style.display = hasOverflow && tabCont.scrollLeft > 0 ? "block" : "none";
    btnR.style.display = hasOverflow ? "block" : "none";
}
function updateTabs() {
    const container = document.getElementById("tabsContainer");
    container.innerHTML = "";
    for (let i = 0; i < animations.length; i++) {
        const tab = document.createElement("div");
        tab.className = "tab" + (i === currentTabIndex ? " active" : "");
        const tabLabel = document.createElement("span");
        tabLabel.style.cssText = "flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;";
        tabLabel.textContent = animations[i].fileName || `Animation ${i + 1}`;
        tab.appendChild(tabLabel);
        if (isDraggingTab && dragTab === i) {
            tab.style.opacity = "0.7";
            tab.style.transform = `translateX(${dragTabCurrentX - dragTabStartX}px)`;
        }
        tab.onclick = (e) => {
            if (!isDraggingTab && !rightClickTabMoved && !e.target.classList.contains("tab-close")) {
                switchTab(i);
            }
        };
        tab.addEventListener("mousedown", (e) => {
            if (e.button === 0 && !e.target.classList.contains("tab-close")) {
                dragTab = i;
                dragTabStartX = e.clientX;
                dragTabCurrentX = e.clientX;
                isDraggingTab = false;
            }
        });
        tab.oncontextmenu = (e) => {
            e.preventDefault();
            showTabContextMenu(e, i);
        };
        const close = document.createElement("span");
        close.className = "tab-close";
        close.innerHTML = "×";
        close.onclick = (e) => {
            e.stopPropagation();
            e.preventDefault();
            const name = animations[i].fileName || `Animation ${i + 1}`;
            showConfirmDialog(`Close "${name}"?`, (confirmed) => { if (confirmed) closeTab(i); });
        };
        close.onmousedown = (e) => {
            e.stopPropagation();
        };
        tab.appendChild(close);
        container.appendChild(tab);
    }
    if (isDraggingTab && dragTabTargetIndex >= 0 && dragTabTargetIndex <= animations.length) {
        const tabs = container.querySelectorAll(".tab");
        let indicatorX = 0;
        let indicatorY = container.getBoundingClientRect().top;
        let indicatorHeight = container.getBoundingClientRect().height;
        if (dragTabTargetIndex < tabs.length) {
            const targetTab = tabs[dragTabTargetIndex];
            const rect = targetTab.getBoundingClientRect();
            indicatorX = rect.left;
        } else if (dragTabTargetIndex === tabs.length && tabs.length > 0) {
            const lastTab = tabs[tabs.length - 1];
            const rect = lastTab.getBoundingClientRect();
            indicatorX = rect.right;
        }
        if (indicatorX > 0) {
            if (!tabDragIndicator) {
                tabDragIndicator = document.createElement("div");
                tabDragIndicator.style.position = "fixed";
                tabDragIndicator.style.width = "3px";
                tabDragIndicator.style.background = "#ffff00";
                tabDragIndicator.style.pointerEvents = "none";
                tabDragIndicator.style.zIndex = "1000";
                document.body.appendChild(tabDragIndicator);
            }
            tabDragIndicator.style.left = indicatorX + "px";
            tabDragIndicator.style.top = indicatorY + "px";
            tabDragIndicator.style.height = indicatorHeight + "px";
        }
    } else {
        if (tabDragIndicator) {
            document.body.removeChild(tabDragIndicator);
            tabDragIndicator = null;
        }
    }
    if (!window.tabDragHandlersBound) {
        window.tabDragHandlersBound = true;
        document.addEventListener("mousemove", (e) => {
            if (dragTab >= 0 && e.buttons === 1) {
                const deltaX = Math.abs(e.clientX - dragTabStartX);
                if (deltaX > dragThreshold) {
                    isDraggingTab = true;
                }
                if (isDraggingTab) {
                    dragTabCurrentX = e.clientX;
                    updateTabDragTarget(e.clientX);
                    updateTabs();
                }
            }
        });
        document.addEventListener("mouseup", (e) => {
            if (e.button === 0 && dragTab >= 0) {
                if (isDraggingTab) {
                    handleTabDrop(dragTab);
                } else {
                    switchTab(dragTab);
                }
                dragTab = -1;
                isDraggingTab = false;
                dragTabTargetIndex = -1;
                if (tabDragIndicator) {
                    document.body.removeChild(tabDragIndicator);
                    tabDragIndicator = null;
                }
                updateTabs();
            }
        });
    }
    setTimeout(updateTabScrollButtons, 0);
}

function updateTabDragTarget(clientX) {
    const container = document.getElementById("tabsContainer");
    if (!container) return;
    const tabs = container.querySelectorAll(".tab");
    let closestEdge = null;
    let closestDist = Infinity;
    let targetIndex = dragTab;
    for (let i = 0; i < tabs.length; i++) {
        if (i === dragTab) continue;
        const rect = tabs[i].getBoundingClientRect();
        const leftDist = Math.abs(clientX - rect.left);
        const rightDist = Math.abs(clientX - rect.right);
        if (leftDist < closestDist) {
            closestDist = leftDist;
            closestEdge = "left";
            targetIndex = i;
        }
        if (rightDist < closestDist) {
            closestDist = rightDist;
            closestEdge = "right";
            targetIndex = i + 1;
        }
    }
    if (tabs.length > 0 && dragTab < tabs.length) {
        const lastTab = tabs[tabs.length - 1];
        const rect = lastTab.getBoundingClientRect();
        const rightDist = Math.abs(clientX - rect.right);
        if (rightDist < closestDist) {
            closestDist = rightDist;
            closestEdge = "right";
            targetIndex = tabs.length;
        }
    }
    dragTabTargetIndex = targetIndex;
}

function handleTabDrop(sourceIndex) {
    if (dragTabTargetIndex < 0 || dragTabTargetIndex > animations.length || dragTabTargetIndex === sourceIndex) return;
    if (dragTabTargetIndex === animations.length) dragTabTargetIndex = animations.length - 1;
    const tabToMove = animations[sourceIndex];
    animations.splice(sourceIndex, 1);
    animations.splice(dragTabTargetIndex, 0, tabToMove);
    const oldCurrentTabIndex = currentTabIndex;
    if (currentTabIndex === sourceIndex) {
        currentTabIndex = dragTabTargetIndex;
        currentAnimation = animations[currentTabIndex];
    } else if (currentTabIndex > sourceIndex && currentTabIndex <= dragTabTargetIndex) {
        currentTabIndex--;
    } else if (currentTabIndex < sourceIndex && currentTabIndex >= dragTabTargetIndex) {
        currentTabIndex++;
    }
    updateTabs();
    saveSession();
}

function showTabContextMenu(e, tabIndex) {
    if (activeContextMenu) { document.body.removeChild(activeContextMenu); activeContextMenu = null; }
    const menu = document.createElement("div");
    menu.className = "context-menu";
    menu.style.cssText = `display:block;position:fixed;left:${e.clientX}px;top:${e.clientY}px;background:#2b2b2b;border:1px solid #404040;padding:3px 0;z-index:10000;min-width:160px;box-shadow:0 2px 6px rgba(0,0,0,0.5);font-size:12px;`;
    const dismiss = () => {
        if (activeContextMenu === menu && menu.parentNode) { document.body.removeChild(menu); activeContextMenu = null; }
        document.removeEventListener("mousedown", outsideClick);
    };
    const outsideClick = (ev) => { if (!menu.contains(ev.target)) dismiss(); };
    const item = (label, action, disabled = false) => {
        const d = document.createElement("div");
        d.textContent = label;
        d.style.cssText = `padding:5px 14px;cursor:${disabled?"default":"pointer"};color:${disabled?"#666":"#e0e0e0"};user-select:none;`;
        if (!disabled) { d.onmouseenter = () => d.style.background = "#3d3d3d"; d.onmouseleave = () => d.style.background = ""; }
        if (!disabled) d.onclick = () => { dismiss(); action(); };
        return d;
    };
    const sep = () => { const d = document.createElement("div"); d.style.cssText = "height:1px;background:#404040;margin:3px 0;"; return d; };
    menu.appendChild(item("Rename", () => {
        const ani = animations[tabIndex];
        if (!ani) return;
        const box = document.createElement("div");
        box.style.cssText = "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#2b2b2b;border:1px solid #404040;padding:14px 16px;z-index:99999;min-width:260px;font-size:12px;color:#e0e0e0;box-shadow:0 2px 8px rgba(0,0,0,0.5);";
        const input = document.createElement("input");
        input.value = ani.fileName || `Animation ${tabIndex + 1}`;
        input.style.cssText = "width:100%;box-sizing:border-box;background:#1a1a1a;color:#e0e0e0;border:1px solid #404040;padding:4px 6px;margin:8px 0 10px;font-family:inherit;font-size:12px;";
        const btnRow = document.createElement("div"); btnRow.style.cssText = "display:flex;gap:8px;justify-content:flex-end;";
        const ok = document.createElement("button"); ok.textContent = "Rename"; ok.style.cssText = "padding:4px 12px;background:#1a1a1a;color:#e0e0e0;border:1px solid #404040;cursor:pointer;font-size:12px;";
        const cancel = document.createElement("button"); cancel.textContent = "Cancel"; cancel.style.cssText = "padding:4px 12px;background:#1a1a1a;color:#e0e0e0;border:1px solid #404040;cursor:pointer;font-size:12px;";
        const finish = (save) => { if (save && input.value.trim()) { ani.fileName = input.value.trim(); updateTabs(); saveSession(); } document.body.removeChild(box); };
        ok.onclick = () => finish(true); cancel.onclick = () => finish(false);
        input.onkeydown = (ev) => { if (ev.key === "Enter") finish(true); if (ev.key === "Escape") finish(false); };
        box.appendChild(Object.assign(document.createElement("div"), {textContent:"Rename Tab", style:"font-weight:bold;margin-bottom:4px;"}));
        box.appendChild(input); btnRow.appendChild(ok); btnRow.appendChild(cancel); box.appendChild(btnRow);
        document.body.appendChild(box); setTimeout(() => { input.focus(); input.select(); }, 0);
    }));
    menu.appendChild(sep());
    menu.appendChild(item("Close", () => closeTab(tabIndex)));
    menu.appendChild(item("Close to the Left", () => { const n = tabIndex; showConfirmDialog(`Close ${n} tab${n!==1?"s":""} to the left?`, (ok) => { if (ok) for (let i = tabIndex - 1; i >= 0; i--) closeTab(i); }); }, tabIndex === 0));
    menu.appendChild(item("Close to the Right", () => { const n = animations.length - 1 - tabIndex; showConfirmDialog(`Close ${n} tab${n!==1?"s":""} to the right?`, (ok) => { if (ok) for (let i = animations.length - 1; i > tabIndex; i--) closeTab(i); }); }, tabIndex >= animations.length - 1));
    document.body.appendChild(menu);
    activeContextMenu = menu;
    setTimeout(() => document.addEventListener("mousedown", outsideClick), 0);
}

let saveSessionDebounceTimer = null;
function saveSession(immediate = false) {
    if (DEBUG_MODE) f12Log(`saveSession called with immediate=${immediate}`);
    if (saveSessionDebounceTimer) {
        clearTimeout(saveSessionDebounceTimer);
        saveSessionDebounceTimer = null;
    }
    const doSave = () => {
        try {
            const session = {
                animations: animations.map(ani => {
                    const content = saveGani(ani);
                    f12Log(`Saving animation ${ani.fileName || 'unnamed'}: ${ani.frames.length} frames`);
                    return {
                        fileName: ani.fileName,
                        fullPath: ani.fullPath,
                        modified: ani.modified,
                        id: ani.id,
                        content: content
                    };
                }),
                currentTabIndex: currentTabIndex,
                workingDirectory: workingDirectory,
                backgroundColor: backgroundColor,
                keysSwapped: keysSwapped
            };
            localStorage.setItem("ganiEditorSession", JSON.stringify(session));
        } catch (e) {
            console.error("Failed to save session:", e);
        }
    };
    if (immediate) {
        doSave();
    } else {
        saveSessionDebounceTimer = setTimeout(doSave, 300);
    }
}
async function restoreSession() {
    try {
        const sessionData = localStorage.getItem("ganiEditorSession");
        if (!sessionData) return false;
        const session = JSON.parse(sessionData);
        if (session.workingDirectory) {
            workingDirectory = session.workingDirectory;
        }
        const savedLastOpenDir = localStorage.getItem("ganiEditorLastOpenDir");
        const savedLastWorkingDir = localStorage.getItem("ganiEditorLastWorkingDir");
        if (savedLastOpenDir) lastOpenDirectory = savedLastOpenDir;
        if (savedLastWorkingDir) lastWorkingDirectory = savedLastWorkingDir;
        if (session.backgroundColor) {
            backgroundColor = session.backgroundColor;
        }
        if (session.keysSwapped !== undefined) {
            keysSwapped = session.keysSwapped;
            const _btn = document.getElementById("btnSwapKeys");
            if (_btn) {
                _btn.classList.toggle("active", keysSwapped);
                const tip = keysSwapped ? "Arrows=Direction, WASD=Move — click to restore" : "WASD=Direction, Arrows=Move — click to swap";
                if (_btn.hasAttribute("data-title")) _btn.dataset.title = tip; else _btn.title = tip;
            }
        }
        if (session.animations && session.animations.length > 0) {
            animations = [];
            for (const aniData of session.animations) {
                if (aniData.content) {
                    try {
                        f12Log(`Restoring animation: ${aniData.fileName}`);
                        f12Log(`Content length: ${aniData.content ? aniData.content.length : 0}`);
                        if (aniData.content) {
                            const aniLines = aniData.content.split('\n');
                            const aniStartIdx = aniLines.findIndex(l => l.trim() === 'ANI');
                            const aniEndIdx = aniLines.findIndex(l => l.trim() === 'ANIEND');
                            if (aniStartIdx >= 0 && aniEndIdx >= 0) {
                                f12Log(`Found ANI section: lines ${aniStartIdx} to ${aniEndIdx}, ${aniEndIdx - aniStartIdx - 1} lines of frame data`);
                                const frameLines = aniLines.slice(aniStartIdx + 1, aniEndIdx);
                                const nonEmptyFrameLines = frameLines.filter(l => l.trim() && !l.trim().startsWith('WAIT') && !l.trim().startsWith('PLAYSOUND'));
                                f12Log(`Non-empty frame lines (excluding WAIT/PLAYSOUND): ${nonEmptyFrameLines.length}`);
                            }
                        }
                        const ani = parseGani(aniData.content);
                        f12Log(`Restored animation ${aniData.fileName || 'unnamed'}: ${ani.frames.length} frames`);
                        f12Log("Restored animation defaults: " + JSON.stringify(Array.from(ani.defaultImages.entries())));
                        ani.fileName = aniData.fileName || "";
                        ani.fullPath = aniData.fullPath || "";
                        if (aniData.id) {
                            ani.id = aniData.id;
                        }
                        ensureShadowSprite(ani);
                        animations.push(ani);
                    } catch (e) {
                        console.error(`Failed to restore ${aniData.fileName}:`, e);
                        f12Log(`Error restoring ${aniData.fileName}: ${e.message}`);
                        f12Log(`Stack: ${e.stack}`);
                    }
                }
            }
            if (animations.length === 0) {
                initNewAnimation();
            } else {
                currentTabIndex = Math.min(session.currentTabIndex || 0, animations.length - 1);
                currentAnimation = animations[currentTabIndex];
            }
            for (let i = 0; i < animations.length; i++) {
                const ani = animations[i];
                let savedValue = localStorage.getItem("ganiEditorHistoryLoggingEnabled_" + ani.id);
                if (!savedValue && session.animations[i] && session.animations[i].id) {
                    const oldValue = localStorage.getItem("ganiEditorHistoryLoggingEnabled_" + i);
                    if (oldValue) {
                        localStorage.setItem("ganiEditorHistoryLoggingEnabled_" + ani.id, oldValue);
                        localStorage.removeItem("ganiEditorHistoryLoggingEnabled_" + i);
                        savedValue = oldValue;
                    }
                }
                if (savedValue !== null) {
                    ani.historyLoggingEnabled = savedValue === "true";
                } else if (ani.historyLoggingEnabled === undefined) {
                    ani.historyLoggingEnabled = true;
                }
            }
            if (currentAnimation) {
                const savedValue = localStorage.getItem("ganiEditorHistoryLoggingEnabled_" + currentTabIndex);
                if (savedValue !== null) {
                    currentAnimation.historyLoggingEnabled = savedValue === "true";
                } else if (currentAnimation.historyLoggingEnabled === undefined) {
                    currentAnimation.historyLoggingEnabled = true;
                }
            }
            updateTabs();
            updateUIVisibility();
            updateSpritesList();
            updateDefaultsTable();
            updateSoundsList();
            restoreCurrentFrame();
            drawTimeline();
            updateFrameInfo();
            restoreUndoStack();
            const historyLoggingToggleCheckbox = document.getElementById("historyLoggingToggleCheckbox");
            if (historyLoggingToggleCheckbox && currentAnimation) {
                const enabled = getCurrentHistoryLoggingEnabled();
                historyLoggingToggleCheckbox.textContent = enabled ? "✓" : " ";
            }
            updateHistoryMenu();
            redraw();
            return true;
        }
        return false;
    } catch (e) {
        console.error("Failed to restore session:", e);
        return false;
    }
}
window.addEventListener("beforeunload", () => {
    saveCurrentFrame();
    saveSession(true);
});
setInterval(() => {
    if (animations.length > 0) {
        saveSession(true);
    }
}, 10000);
function showLoadingMessage(message, showOverlay = true) {
    let loadingOverlay = null;
    let loadingDiv = null;
    let loadingText = null;
    loadingOverlay = document.createElement("div");
    loadingOverlay.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:99998;";
    document.body.appendChild(loadingOverlay);
    loadingDiv = document.createElement("div");
    loadingDiv.style.cssText = "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);color:#ffffff;font-family:'chevyray',monospace;user-select:none;z-index:99999;display:flex;align-items:center;justify-content:center;gap:20px;";
    loadingDiv.style.setProperty("font-size", "24px", "important");
    const faviconImg = document.createElement("img");
    faviconImg.src = "favicon.ico";
    faviconImg.className = "loading-favicon";
    faviconImg.style.cssText = "width:32px;height:32px;";
    loadingDiv.appendChild(faviconImg);
    loadingText = document.createElement("span");
    loadingText.style.setProperty("font-size", "24px", "important");
    loadingText.style.fontWeight = "bold";
    loadingText.style.textShadow = "1px 1px 1px rgba(0,0,255,1)";
    loadingText.textContent = message;
    loadingDiv.appendChild(loadingText);
    document.body.appendChild(loadingDiv);
    return {
        update: (newMessage) => {
            if (loadingText) loadingText.textContent = newMessage;
        },
        close: () => {
            if (loadingOverlay && loadingOverlay.parentNode) document.body.removeChild(loadingOverlay);
            if (loadingDiv && loadingDiv.parentNode) document.body.removeChild(loadingDiv);
        }
    };
}
// ── Floating tooltip system ──────────────────────────────────────────────────
const _tooltipEl = document.createElement('div');
_tooltipEl.id = 'floatingTooltip';
document.body.appendChild(_tooltipEl);
let _tooltipTarget = null;

function _positionTooltip(mx, my) {
    _tooltipEl.style.left = '0';
    _tooltipEl.style.top = '0';
    const tw = _tooltipEl.offsetWidth, th = _tooltipEl.offsetHeight;
    const vw = window.innerWidth, vh = window.innerHeight, gap = 12;
    let x = mx - tw / 2;
    let y = my - th - gap;
    if (y < 4) y = my + gap;
    x = Math.max(4, Math.min(x, vw - tw - 4));
    y = Math.max(4, Math.min(y, vh - th - 4));
    _tooltipEl.style.left = x + 'px';
    _tooltipEl.style.top = y + 'px';
}

document.addEventListener('mouseover', e => {
    const btn = e.target.closest('button[title]');
    if (btn) { btn.dataset.title = btn.title; btn.removeAttribute('title'); }
    const target = e.target.closest('button[data-title]');
    if (target) {
        _tooltipTarget = target;
        _tooltipEl.textContent = target.dataset.title;
        _tooltipEl.style.display = 'block';
    }
}, true);

document.addEventListener('mousemove', e => {
    if (_tooltipTarget) {
        const tip = _tooltipTarget.dataset.title;
        if (tip && _tooltipEl.textContent !== tip) _tooltipEl.textContent = tip;
        _positionTooltip(e.clientX, e.clientY);
    }
});

document.addEventListener('mouseout', e => {
    const btn = e.target.closest('button[data-title]');
    if (btn && !btn.hasAttribute('title')) { btn.setAttribute('title', btn.dataset.title); delete btn.dataset.title; }
    if (_tooltipTarget && !_tooltipTarget.contains(e.relatedTarget)) {
        _tooltipTarget = null;
        _tooltipEl.style.display = 'none';
    }
}, true);

// ── Monaco editor ────────────────────────────────────────────────────────────
let monacoReady = null;
if (window.require) {
    window.require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.0/min/vs' } });
    monacoReady = new Promise(resolve => {
        window.require(['vs/editor/editor.main'], () => {
            if (monaco.languages.css) monaco.languages.css.cssDefaults.setOptions({ validate: false });

            monaco.languages.register({ id: 'graalscript' });
            monaco.languages.setMonarchTokensProvider('graalscript', {
                keywords: ['class','extends','implements','import','instanceof','interface','native','package','volatile','throws',
                           'break','case','continue','default','do','else','elseif','for','function','if','in','return','switch','while','with','xor',
                           'public','const','enum'],
                memory: ['new','datablock'],
                tokenizer: {
                    root: [
                        [/\/\/.*$/, 'comment'],
                        [/\/\*/, 'comment', '@blockcomment'],
                        [/"/, 'string', '@string_dq'],
                        [/'/, 'string', '@string_sq'],
                        [/0[xX][0-9a-fA-F]+[Ll]?\b/, 'number'],
                        [/[0-9]*\.[0-9]+([eE][+-]?[0-9]+)?[fFdD]?\b/, 'number.float'],
                        [/[0-9]+[eE][+-]?[0-9]+[fFdD]?\b/, 'number.float'],
                        [/[0-9]+[fFdD]\b/, 'number.float'],
                        [/[0-9]+[Ll]?\b/, 'number'],
                        [/\b(?:true|false|nil|null|pi)\b/i, 'keyword.builtin'],
                        [/\b(?:this|thiso|temp|server|serverr|client|clientr|player)\b/i, 'keyword.extras'],
                        [/[a-zA-Z_]\w*(?=\s*\()/, { cases: { '@keywords': 'keyword', '@memory': 'keyword.memory', '@default': 'function.call' } }],
                        [/[a-zA-Z_]\w*/, { cases: { '@keywords': 'keyword', '@memory': 'keyword.memory', 'name': 'variable.property', '@default': 'identifier' } }],
                        [/[-~^@/%|=+*!?&<>]/, 'operator'],
                        [/[\[\]]/, 'operator'],
                        [/[{}();:,.]/, 'delimiter'],
                    ],
                    blockcomment: [
                        [/[^/*]+/, 'comment'],
                        [/\*\//, 'comment', '@pop'],
                        [/[/*]/, 'comment'],
                    ],
                    string_dq: [
                        [/[^"]+/, 'string'],
                        [/"/, 'string', '@pop'],
                    ],
                    string_sq: [
                        [/[^'\n]+/, 'string'],
                        [/\n/, '', '@pop'],
                        [/'/, 'string', '@pop'],
                    ],
                }
            });

            let _gscriptDefs = null;
            const _loadGScriptDefs = () => {
                if (_gscriptDefs) return Promise.resolve(_gscriptDefs);
                return fetch('https://api.gscript.dev').then(r => r.json()).then(data => { _gscriptDefs = data; return data; }).catch(() => ({}));
            };
            monaco.languages.registerCompletionItemProvider('graalscript', {
                triggerCharacters: ['$', '_'],
                provideCompletionItems: (model, position) => _loadGScriptDefs().then(defs => {
                    const word = model.getWordUntilPosition(position);
                    const range = { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: word.startColumn, endColumn: word.endColumn };
                    const pfx = word.word.toLowerCase();
                    const suggestions = Object.entries(defs)
                        .filter(([name]) => pfx === '' || name.toLowerCase().startsWith(pfx))
                        .map(([name, info]) => {
                            const isVar = name.startsWith('$');
                            const params = info.params?.length ? info.params : [];
                            const snippet = isVar ? name : (params.length ? `${name}(${params.map((p, i) => `\${${i+1}:${p}}`).join(', ')})` : `${name}($0)`);
                            return {
                                label: name,
                                kind: isVar ? monaco.languages.CompletionItemKind.Variable : monaco.languages.CompletionItemKind.Function,
                                insertText: snippet,
                                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                detail: [info.scope, info.returns ? `→ ${info.returns}` : ''].filter(Boolean).join(' '),
                                documentation: info.description || '',
                                range
                            };
                        });
                    return { suggestions };
                })
            });
            monaco.languages.registerHoverProvider('graalscript', {
                provideHover: (model, position) => _loadGScriptDefs().then(defs => {
                    const word = model.getWordAtPosition(position);
                    if (!word) return null;
                    const info = defs[word.word] || defs['$' + word.word];
                    if (!info) return null;
                    const name = info.name || word.word;
                    const params = info.params?.length ? `(${info.params.join(', ')})` : '()';
                    const ret = info.returns ? ` → ${info.returns}` : '';
                    const scope = info.scope ? `*${info.scope}*` : '';
                    const contents = [
                        { value: `**${name}**\`${params}${ret}\` ${scope}`.trim() },
                        ...(info.description ? [{ value: info.description }] : []),
                        ...(info.example ? [{ value: `\`\`\`\n${info.example}\n\`\`\`` }] : [])
                    ];
                    return { contents };
                })
            });

            monaco.editor.defineTheme('graal-default', {
                base: 'vs-dark', inherit: false,
                rules: [
                    { token: '', foreground: 'f8f8f2' },
                    { token: 'comment', foreground: '75715e', fontStyle: 'italic' },
                    { token: 'string', foreground: 'e6db74' },
                    { token: 'number', foreground: 'be84ff' },
                    { token: 'number.float', foreground: 'be84ff' },
                    { token: 'keyword', foreground: 'f92672' },
                    { token: 'keyword.memory', foreground: 'f92672', fontStyle: 'bold' },
                    { token: 'keyword.builtin', foreground: 'be84ff' },
                    { token: 'keyword.extras', foreground: 'f57900' },
                    { token: 'function.call', foreground: 'a6e22b' },
                    { token: 'variable.property', foreground: '3f8c61' },
                    { token: 'operator', foreground: 'f92672' },
                    { token: 'delimiter', foreground: 'ffffff' },
                    { token: 'identifier', foreground: 'f8f8f2' },
                ],
                colors: {
                    'editor.background': '#1e1f1b',
                    'editor.foreground': '#f8f8f2',
                    'editorLineNumber.foreground': '#bebeba',
                    'editorLineNumber.activeForeground': '#f8f8f2',
                    'editorCursor.foreground': '#f8f8f0',
                    'editor.selectionBackground': '#444444',
                    'editor.lineHighlightBackground': '#2a2b27',
                    'editor.lineHighlightBorder': '#2a2b27',
                    'editorIndentGuide.background1': '#3b3a32',
                    'editorIndentGuide.activeBackground1': '#555753',
                }
            });

            monaco.editor.defineTheme('neon-synthwave', {
                base: 'vs-dark', inherit: true,
                rules: [
                    { token: '', foreground: 'e0c0ff' },
                    { token: 'comment', foreground: '660099', fontStyle: 'italic' },
                    { token: 'string', foreground: 'ff44ff' },
                    { token: 'number', foreground: 'ff88ff' },
                    { token: 'number.float', foreground: 'ff88ff' },
                    { token: 'keyword', foreground: 'cc00ff', fontStyle: 'bold' },
                    { token: 'keyword.memory', foreground: 'ff00ff', fontStyle: 'bold' },
                    { token: 'keyword.builtin', foreground: 'dd88ff' },
                    { token: 'keyword.extras', foreground: 'ff8844' },
                    { token: 'function.call', foreground: 'a6e22b' },
                    { token: 'variable.property', foreground: '44ffaa' },
                    { token: 'operator', foreground: 'ff2266' },
                    { token: 'delimiter', foreground: 'aa88ff' },
                    { token: 'identifier', foreground: 'e0c0ff' },
                    { token: 'tag', foreground: 'ff00ff' },
                    { token: 'attribute.name', foreground: 'cc88ff' },
                    { token: 'attribute.value', foreground: 'ff44ff' },
                ],
                colors: {
                    'editor.background': '#0d0025',
                    'editor.foreground': '#e0c0ff',
                    'editorLineNumber.foreground': '#440066',
                    'editorLineNumber.activeForeground': '#cc00ff',
                    'editorCursor.foreground': '#ff00ff',
                    'editor.selectionBackground': '#330066',
                    'editor.lineHighlightBackground': '#1a003500',
                    'editor.lineHighlightBorder': '#1a0035',
                    'editorIndentGuide.background1': '#220044',
                    'editorIndentGuide.activeBackground1': '#550088',
                    'editorWidget.background': '#0d0020',
                    'editorWidget.border': '#660099',
                    'editorSuggestWidget.background': '#0d0020',
                    'editorSuggestWidget.border': '#660099',
                    'editorSuggestWidget.selectedBackground': '#1a0035',
                    'scrollbarSlider.background': '#66009966',
                    'scrollbarSlider.hoverBackground': '#ff00ff88',
                    'scrollbarSlider.activeBackground': '#ff00ffcc',
                }
            });
            resolve(monaco);
        });
    });
} else {
    monacoReady = Promise.resolve(null);
}
function getMonacoTheme() {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--monaco-theme').trim().replace(/['"]/g, '');
    return v || 'graal-default';
}
function createMonacoEditor(container, value, language) {
    return monacoReady ? monacoReady.then(mc => {
        if (!mc) return null;
        container.style.height = '100%';
        const ed = mc.editor.create(container, { value, language, theme: getMonacoTheme(), minimap: { enabled: false }, scrollBeyondLastLine: false, fontSize: 12, fontFamily: 'monospace', automaticLayout: true, wordWrap: 'on', renderValidationDecorations: 'off' });
        return ed;
    }) : Promise.resolve(null);
}

window.addEventListener("load", async () => {
    const loading = showLoadingMessage("Loading Gani Editor...");
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    const criticalImages = ["sprites.png", "body.png", "head19.png", "shield1.png"];
    await Promise.all(criticalImages.filter(f => !imageLibrary.has(f.toLowerCase())).map(f => loadImageFromUrl(`images/${f}`, f.toLowerCase()).catch(() => {})));
    await refreshLocalFileCache();
    if (_isTauri) await restoreWorkspaceFromCache();
    await loadLocalImages(loading);
    loading.close();
    resizeCanvas();
    const restored = await restoreSession();
    if (!restored) {
        if (animations.length === 0) initNewAnimation();
        updateTabs();
        updateUIVisibility();
    } else {
        updateUIVisibility();
        restoreCurrentFrame();
    }
    setupContextMenus();
    if (currentAnimation) {
        restoreCurrentFrame();
        resizeCanvas();
        setTimeout(() => {
            resizeCanvas();
            drawTimeline();
            updateFrameInfo();
            const timelineContainer = document.querySelector(".timeline-container");
            const timelineView = document.querySelector(".timeline-view");
            const canvas = document.getElementById("timelineCanvas");
            let timelineVisible = localStorage.getItem("timelineVisible");
            if (timelineVisible === null) {
                timelineVisible = "true";
                localStorage.setItem("timelineVisible", "true");
            }
            timelineVisible = timelineVisible !== "false";
            const toolbar = document.querySelector(".toolbar");
            let toolbarVisible = localStorage.getItem("toolbarVisible");
            if (toolbarVisible === null) {
                toolbarVisible = "true";
                localStorage.setItem("toolbarVisible", "true");
            }
            toolbarVisible = toolbarVisible !== "false";
            if (toolbar) {
                if (toolbarVisible) {
                    toolbar.style.display = "flex";
                    toolbar.style.visibility = "visible";
                    toolbar.style.opacity = "1";
                } else {
                    toolbar.style.setProperty("display", "none", "important");
                    toolbar.style.setProperty("visibility", "hidden", "important");
                    toolbar.style.setProperty("opacity", "0", "important");
                }
            }
            const leftPanel = document.querySelector(".left-panel");
            const rightPanel = document.querySelector(".right-panel");
            let leftPanelVisible = localStorage.getItem("leftPanelVisible");
            if (leftPanelVisible === null) {
                leftPanelVisible = "true";
                localStorage.setItem("leftPanelVisible", "true");
            }
            leftPanelVisible = leftPanelVisible !== "false";
            let rightPanelVisible = localStorage.getItem("rightPanelVisible");
            if (rightPanelVisible === null) {
                rightPanelVisible = "true";
                localStorage.setItem("rightPanelVisible", "true");
            }
            rightPanelVisible = rightPanelVisible !== "false";
            if (leftPanel) {
                if (leftPanelVisible) {
                    leftPanel.style.display = "flex";
                    leftPanel.style.visibility = "visible";
                } else {
                    leftPanel.style.display = "none";
                    leftPanel.style.visibility = "hidden";
                }
            }
            if (rightPanel) {
                if (rightPanelVisible) {
                    rightPanel.style.display = "flex";
                    rightPanel.style.visibility = "visible";
                } else {
                    rightPanel.style.display = "none";
                    rightPanel.style.visibility = "hidden";
                }
            }
            const mainSplitter = document.getElementById("mainSplitter");
            if (timelineContainer) {
                if (timelineVisible) {
                timelineContainer.style.display = "flex";
                timelineContainer.style.visibility = "visible";
                timelineContainer.style.opacity = "1";
                    timelineContainer.style.removeProperty("flex");
                    timelineContainer.style.removeProperty("height");
                const isTouch = (navigator.maxTouchPoints && navigator.maxTouchPoints > 1) || (window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
                if (isTouch) {
                    timelineContainer.style.height = "250px";
                    timelineContainer.style.flex = "0 0 250px";
                    timelineContainer.style.minHeight = "230px";
                } else {
                    timelineContainer.style.height = "218px";
                    timelineContainer.style.flex = "0 0 218px";
                    timelineContainer.style.minHeight = "180px";
                    }
                    if (mainSplitter) {
                        mainSplitter.style.height = "calc(100% - 222px)";
                        mainSplitter.style.maxHeight = "calc(100% - 222px)";
                    }
                } else {
                    timelineContainer.style.setProperty("display", "none", "important");
                    timelineContainer.style.setProperty("visibility", "hidden", "important");
                    timelineContainer.style.setProperty("opacity", "0", "important");
                    timelineContainer.style.setProperty("flex", "0 0 0px", "important");
                    timelineContainer.style.setProperty("height", "0px", "important");
                    if (mainSplitter) {
                        mainSplitter.style.height = "calc(100% - 0px)";
                        mainSplitter.style.maxHeight = "calc(100% - 0px)";
                    }
                }
            }
            if (timelineView) {
                if (timelineVisible) {
                timelineView.style.display = "block";
                timelineView.style.visibility = "visible";
                timelineView.style.opacity = "1";
                } else {
                    timelineView.style.display = "none";
                    timelineView.style.visibility = "hidden";
                    timelineView.style.opacity = "0";
                }
            }
            const canvasTimelineSplitter = document.getElementById("canvasTimelineSplitter");
            if (canvasTimelineSplitter) {
                if (timelineVisible) {
                    canvasTimelineSplitter.style.display = "block";
                    canvasTimelineSplitter.style.visibility = "visible";
                    canvasTimelineSplitter.style.opacity = "1";
                } else {
                    canvasTimelineSplitter.style.display = "none";
                    canvasTimelineSplitter.style.visibility = "hidden";
                    canvasTimelineSplitter.style.opacity = "0";
                }
            }
            setTimeout(() => {
                const isTouch = (navigator.maxTouchPoints && navigator.maxTouchPoints > 1) || (window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
                if (isTouch && timelineContainer) {
                    timelineContainer.style.height = "250px";
                    timelineContainer.style.flex = "0 0 250px";
                    timelineContainer.style.minHeight = "230px";
                    drawTimeline();
                }
            }, 100);
            if (canvas) {
                canvas.style.display = "block";
                canvas.style.visibility = "visible";
                canvas.style.opacity = "1";
                canvas.style.position = "relative";
                canvas.style.zIndex = "1";
            }
        }, 200);
    }
    if (DEBUG_MODE) f12Log("Background image loading complete");
    const spriteList = document.getElementById("spritesList");
    const spriteEditPanel = document.getElementById("spriteEditPanel");
    const spriteSplitterHandle = document.getElementById("spriteSplitterHandle");
    if (spriteList && spriteEditPanel && spriteSplitterHandle) {
        spriteList.style.height = "300px";
        spriteSplitterHandle.onmousedown = (e) => {
            spriteSplitterDragging = true;
            e.preventDefault();
        };
        spriteSplitterHandle.addEventListener("touchstart", (e) => {
            spriteSplitterDragging = true;
            e.preventDefault();
        }, {passive: false});
        document.addEventListener("mousemove", (e) => {
            if (spriteSplitterDragging) {
                const leftPanel = spriteList.parentElement;
                const rect = leftPanel.getBoundingClientRect();
                const newHeight = e.clientY - rect.top - spriteList.offsetTop;
                if (newHeight >= 200 && newHeight <= 600) {
                    spriteList.style.height = newHeight + "px";
                }
            }
        });
        document.addEventListener("touchmove", (e) => {
            if (spriteSplitterDragging && e.touches.length === 1) {
                const leftPanel = spriteList.parentElement;
                const rect = leftPanel.getBoundingClientRect();
                const newHeight = e.touches[0].clientY - rect.top - spriteList.offsetTop;
                if (newHeight >= 200 && newHeight <= 600) {
                    spriteList.style.height = newHeight + "px";
                }
                e.preventDefault();
            }
        }, {passive: false});
        document.addEventListener("mouseup", () => {
            spriteSplitterDragging = false;
        });
        document.addEventListener("touchend", () => {
            spriteSplitterDragging = false;
        });
    }
    const leftCenterSplitter = document.getElementById("leftCenterSplitter");
    const leftPanel = document.querySelector(".left-panel");
    const centerPanel = document.querySelector(".center-panel");
    if (leftCenterSplitter && leftPanel && centerPanel) {
        leftPanel.style.width = "270px";
        leftCenterSplitter.onmousedown = (e) => {
            leftCenterSplitterDragging = true;
            e.preventDefault();
        };
        leftCenterSplitter.addEventListener("touchstart", (e) => {
            leftCenterSplitterDragging = true;
            e.preventDefault();
        }, {passive: false});
    }
    const centerRightSplitter = document.getElementById("centerRightSplitter");
    const rightPanel = document.querySelector(".right-panel");
    if (centerRightSplitter && centerPanel && rightPanel) {
        rightPanel.style.width = "250px";
        centerRightSplitter.onmousedown = (e) => {
            centerRightSplitterDragging = true;
            e.preventDefault();
        };
        centerRightSplitter.addEventListener("touchstart", (e) => {
            centerRightSplitterDragging = true;
            e.preventDefault();
        }, {passive: false});
    }
    const canvasTimelineSplitter = document.getElementById("canvasTimelineSplitter");
    const timelineContainer = document.querySelector(".timeline-container");
    if (canvasTimelineSplitter && timelineContainer) {
        canvasTimelineSplitter.onmousedown = (e) => {
            canvasTimelineSplitterDragging = true;
            e.preventDefault();
        };
        canvasTimelineSplitter.addEventListener("touchstart", (e) => {
            canvasTimelineSplitterDragging = true;
            e.preventDefault();
        }, {passive: false});
    }
    document.addEventListener("mousemove", (e) => {
        if (leftCenterSplitterDragging && leftPanel && centerPanel) {
            const rect = leftPanel.parentElement.getBoundingClientRect();
            const newWidth = e.clientX - rect.left;
            if (newWidth >= 200 && newWidth <= 800) {
                leftPanel.style.width = newWidth + "px";
                const mainSplitter = document.getElementById("mainSplitter");
                const centerWidth = mainSplitter ? mainSplitter.clientWidth - leftPanel.offsetWidth - rightPanel.offsetWidth : centerPanel.clientWidth;
                const dpr = window.devicePixelRatio || 1;
                const canvasContainer = document.querySelector(".canvas-container");
                if (canvasContainer) {
                    canvasContainer.style.width = "100%";
                }
                const actualWidth = Math.max(centerWidth, centerPanel.clientWidth || centerWidth);
                mainCanvas.width = actualWidth * dpr;
                mainCanvas.style.width = "100%";
                mainCanvas.style.left = "0";
                const canvasControls = document.querySelector(".canvas-controls");
                if (canvasControls) {
                    canvasControls.style.left = "10px";
                }
                ctx.scale(dpr, dpr);
                redraw();
            }
        } else if (centerRightSplitterDragging && centerPanel && rightPanel) {
            const rect = rightPanel.parentElement.getBoundingClientRect();
            const newRightWidth = rect.right - e.clientX;
            if (newRightWidth >= 200 && newRightWidth <= 800) {
                rightPanel.style.width = newRightWidth + "px";
                const mainSplitter = document.getElementById("mainSplitter");
                const centerWidth = mainSplitter ? mainSplitter.clientWidth - leftPanel.offsetWidth - rightPanel.offsetWidth : centerPanel.clientWidth;
                const dpr = window.devicePixelRatio || 1;
                const canvasContainer = document.querySelector(".canvas-container");
                if (canvasContainer) {
                    canvasContainer.style.width = "100%";
                }
                const actualWidth = Math.max(centerWidth, centerPanel.clientWidth || centerWidth);
                mainCanvas.width = actualWidth * dpr;
                mainCanvas.style.width = "100%";
                mainCanvas.style.left = "0";
                const canvasControls = document.querySelector(".canvas-controls");
                if (canvasControls) {
                    canvasControls.style.left = "10px";
                }
                ctx.scale(dpr, dpr);
                redraw();
            }
        } else if (canvasTimelineSplitterDragging && timelineContainer) {
            const contentArea = document.querySelector(".content-area");
            const rect = contentArea.getBoundingClientRect();
            const newTimelineHeight = rect.bottom - e.clientY;
            const isTouch = (navigator.maxTouchPoints && navigator.maxTouchPoints > 1) || (window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
            const minHeight = isTouch ? 230 : 180;
            if (newTimelineHeight >= minHeight && newTimelineHeight <= 400) {
                timelineContainer.style.height = newTimelineHeight + "px";
                timelineContainer.style.flex = `0 0 ${newTimelineHeight}px`;
                const timelineHeader = document.querySelector(".timeline-header");
                const timelineView = document.querySelector(".timeline-view");
                const playbackControls = document.querySelector(".playback-controls");
                if (timelineView && timelineCanvas) {
                    setTimeout(() => {
                        const viewHeight = timelineView.clientHeight;
                        timelineCanvas.height = viewHeight;
                        drawTimeline();
                    }, 10);
                }
            }
        }
    });
    document.addEventListener("touchmove", (e) => {
        if (e.touches.length !== 1) return;
        if (leftCenterSplitterDragging && leftPanel && centerPanel) {
            const rect = leftPanel.parentElement.getBoundingClientRect();
            const newWidth = e.touches[0].clientX - rect.left;
            if (newWidth >= 200 && newWidth <= 800) {
                leftPanel.style.width = newWidth + "px";
                const mainSplitter = document.getElementById("mainSplitter");
                const centerWidth = mainSplitter ? mainSplitter.clientWidth - leftPanel.offsetWidth - rightPanel.offsetWidth : centerPanel.clientWidth;
                const dpr = window.devicePixelRatio || 1;
                const canvasContainer = document.querySelector(".canvas-container");
                if (canvasContainer) {
                    canvasContainer.style.width = "100%";
                }
                const actualWidth = Math.max(centerWidth, centerPanel.clientWidth || centerWidth);
                mainCanvas.width = actualWidth * dpr;
                mainCanvas.style.width = "100%";
                mainCanvas.style.left = "0";
                const canvasControls = document.querySelector(".canvas-controls");
                if (canvasControls) {
                    canvasControls.style.left = "10px";
                }
                ctx.scale(dpr, dpr);
                redraw();
            }
            e.preventDefault();
        } else if (centerRightSplitterDragging && centerPanel && rightPanel) {
            const rect = rightPanel.parentElement.getBoundingClientRect();
            const newRightWidth = rect.right - e.touches[0].clientX;
            if (newRightWidth >= 200 && newRightWidth <= 800) {
                rightPanel.style.width = newRightWidth + "px";
                const mainSplitter = document.getElementById("mainSplitter");
                const centerWidth = mainSplitter ? mainSplitter.clientWidth - leftPanel.offsetWidth - rightPanel.offsetWidth : centerPanel.clientWidth;
                const dpr = window.devicePixelRatio || 1;
                const canvasContainer = document.querySelector(".canvas-container");
                if (canvasContainer) {
                    canvasContainer.style.width = "100%";
                }
                const actualWidth = Math.max(centerWidth, centerPanel.clientWidth || centerWidth);
                mainCanvas.width = actualWidth * dpr;
                mainCanvas.style.width = "100%";
                mainCanvas.style.left = "0";
                const canvasControls = document.querySelector(".canvas-controls");
                if (canvasControls) {
                    canvasControls.style.left = "10px";
                }
                ctx.scale(dpr, dpr);
                redraw();
            }
            e.preventDefault();
        } else if (canvasTimelineSplitterDragging && timelineContainer) {
            const contentArea = document.querySelector(".content-area");
            const rect = contentArea.getBoundingClientRect();
            const newTimelineHeight = rect.bottom - e.touches[0].clientY;
            const isTouch = (navigator.maxTouchPoints && navigator.maxTouchPoints > 1) || (window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
            const minHeight = isTouch ? 230 : 180;
            if (newTimelineHeight >= minHeight && newTimelineHeight <= 400) {
                timelineContainer.style.height = newTimelineHeight + "px";
                timelineContainer.style.flex = `0 0 ${newTimelineHeight}px`;
                const timelineHeader = document.querySelector(".timeline-header");
                const timelineView = document.querySelector(".timeline-view");
                const playbackControls = document.querySelector(".playback-controls");
                if (timelineView && timelineCanvas) {
                    setTimeout(() => {
                        const viewHeight = timelineView.clientHeight;
                        timelineCanvas.height = viewHeight;
                        drawTimeline();
                    }, 10);
                }
            }
            e.preventDefault();
        }
    }, {passive: false});
    document.addEventListener("mouseup", () => {
        leftCenterSplitterDragging = false;
        centerRightSplitterDragging = false;
        canvasTimelineSplitterDragging = false;
        if (isDraggingScrollbar) {
            isDraggingScrollbar = false;
            scrollbarDragStartX = 0;
            scrollbarDragStartScrollX = 0;
        }
    });
    document.addEventListener("touchend", () => {
        leftCenterSplitterDragging = false;
        centerRightSplitterDragging = false;
        canvasTimelineSplitterDragging = false;
    });
    if (currentAnimation) {
        drawTimeline();
        updateFrameInfo();
    }
    document.getElementById("btnNew").onclick = () => {
        const ani = new Animation();
        ani.setDefaultImage("SPRITES", "sprites.png");
        ani.setDefaultImage("PICS", "pics1.png");
        ani.setDefaultImage("HEAD", "head1.png");
        ani.setDefaultImage("BODY", "body.png");
        ani.setDefaultImage("SWORD", "sword1.png");
        ani.setDefaultImage("SHIELD", "shield1.png");
        const shadow = new AniSprite();
        shadow.type = "SPRITES";
        shadow.left = 0;
        shadow.top = 0;
        shadow.width = 24;
        shadow.height = 12;
        shadow.comment = "shadow";
        shadow.index = ani.nextSpriteIndex++;
        shadow.updateBoundingBox();
        ani.addSprite(shadow);
        const frame = new Frame();
        ani.frames.push(frame);
        for (let dir = 0; dir < 4; dir++) {
            const shadowPiece = new FramePieceSprite();
            shadowPiece.spriteIndex = shadow.index;
            shadowPiece.xoffset = 12;
            shadowPiece.yoffset = dir % 2 === 0 ? 34 : 36;
            frame.pieces[dir].push(shadowPiece);
        }
        addTab(ani);
    };
    document.getElementById("btnOpen").onclick = async () => {
        if (_isTauri) {
            const selected = await tauriOpenDialog({ multiple: false, filters: [{ name: 'Gani Files', extensions: ['gani'] }] });
            if (selected) {
                const text = await tauriReadTextFile(selected);
                if (/[\x00-\x08\x0e-\x1f]/.test(text.substring(0, 256))) { showAlertDialog('Not a valid plain-text .gani file'); return; }
                const ani = parseGani(text);
                if (ani) { ani.fileName = selected.split(/[\\/]/).pop(); addTab(ani, ani.fileName); }
            }
            return;
        }
        const fileInput = document.getElementById("fileInput");
        if (lastOpenDirectory && fileInput.setAttribute) {
            try {
                fileInput.setAttribute("webkitdirectory", "");
                fileInput.removeAttribute("webkitdirectory");
            } catch(e) {}
        }
        fileInput.click();
    };
    const defaultGaniDialog = document.getElementById("defaultGaniDialog");
    const btnOpenDefault = document.getElementById("btnOpenDefault");
    let selectedGaniItem = null;
    btnOpenDefault.onclick = async () => {
        const container = document.querySelector("#defaultGaniDialog .dialog-content");
        if (container) {
            container.innerHTML = '<div style="color: #e0e0e0; padding: 20px; text-align: center;">Loading...</div>';

            const fallbackGaniList = [
                "carried.gani", "carry.gani", "carrypeople.gani", "carrystill.gani", "dead.gani", "def.gani",
                "editorcursor.gani", "editorcursor2.gani", "ghostani.gani", "gotgoldball.gani", "grab.gani", "gralats.gani",
                "horse.gani", "horsestill.gani", "hurt.gani", "idle.gani", "kick.gani", "lamps_wood.gani",
                "lava.gani", "lay.gani", "lift.gani", "maps1.gani", "maps2.gani", "maps3.gani",
                "palmtree1.gani", "palmtree2.gani", "pray.gani", "pull.gani", "push.gani", "ride.gani",
                "rideeat.gani", "ridefire.gani", "ridehurt.gani", "ridejump.gani", "ridestill.gani", "ridesword.gani",
                "shoot.gani", "shovel.gani", "shovel2.gani", "sit.gani", "skip.gani", "sleep.gani",
                "spin.gani", "swim.gani", "sword.gani", "tutorial_touch.gani", "walk.gani", "walkslow.gani"
            ];

            try {
                let files = [];

                const response = await fetch('ganis/');
                if (response.ok) {
                    try {
                        const data = await response.json();
                        if (Array.isArray(data)) {
                            files = data.filter(file => file.endsWith('.gani')).map(file => file.replace('.gani', '') + '.gani');
                        } else {
                            files = fallbackGaniList;
                        }
                    } catch (e) {
                        files = fallbackGaniList;
                    }
                } else {
                    files = fallbackGaniList;
                }

                container.innerHTML = "";
                files.forEach(fileName => {
                    const item = document.createElement("div");
                    item.className = "default-gani-item";
                    item.setAttribute("data-gani", fileName);
                    item.style.cssText = "padding: 12px 16px; cursor: pointer; color: #e0e0e0; font-size: 14px; border-bottom: 1px solid #1a1a1a;";
                    item.textContent = fileName;
                    item.onclick = async (e) => {
                        e.stopPropagation();
                        document.querySelectorAll(".default-gani-item").forEach(i => i.classList.remove("selected"));
                        item.classList.add("selected");
                        selectedGaniItem = item;
                        const selectedFileName = item.getAttribute("data-gani");
                        defaultGaniDialog.style.display = "none";
                        selectedGaniItem = null;
                        try {
                            const response = await fetch(`ganis/${selectedFileName}`);
                            if (!response.ok) {
                                showAlertDialog(`Failed to load ${selectedFileName}: ${response.statusText}`);
                                return;
                            }
                            const text = await response.text();
                            const ani = parseGani(text);
                            ani.fileName = selectedFileName;
                            addTab(ani, selectedFileName);
                        } catch (error) {
                            showAlertDialog(`Error loading ${selectedFileName}: ${error.message}`);
                        }
                    };
                    container.appendChild(item);
                });
            } catch (error) {
                container.innerHTML = '<div style="color: #e0e0e0; padding: 20px; text-align: center;">Failed to load gani files</div>';
            }
        }

        defaultGaniDialog.style.display = "flex";
        selectedGaniItem = null;
    };
    document.getElementById("defaultGaniCancel").onclick = () => {
        defaultGaniDialog.style.display = "none";
        selectedGaniItem = null;
    };
    defaultGaniDialog.onclick = (e) => {
        if (e.target === defaultGaniDialog) {
            defaultGaniDialog.style.display = "none";
            selectedGaniItem = null;
        }
    };
    document.getElementById("fileInput").onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.path) {
            const pathParts = file.path.split(/[/\\]/);
            pathParts.pop();
            lastOpenDirectory = pathParts.join("/");
            localStorage.setItem("ganiEditorLastOpenDir", lastOpenDirectory);
        }
        const text = await file.text();
        if (/[\x00-\x08\x0e-\x1f]/.test(text.substring(0, 256))) { showAlertDialog(`${file.name} is not a valid plain-text .gani file (may be encrypted or binary).`); return; }
        f12Log(`Opening file: ${file.name}`);
        const ani = parseGani(text);
        f12Log("Parsed animation, defaults: " + JSON.stringify(Array.from(ani.defaultImages.entries())));
        ani.fileName = file.name;
        addTab(ani);
        f12Log("After addTab, calling updateDefaultsTable");
        updateDefaultsTable();
        f12Log("After updateDefaultsTable, currentAnimation.defaultImages: " + JSON.stringify(Array.from(currentAnimation.defaultImages.entries())));
        e.target.value = "";
    };
    document.addEventListener("dragover", (e) => { e.preventDefault(); });
    document.addEventListener("drop", async (e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files).filter(f => f.name.toLowerCase().endsWith(".gani"));
        let opened = 0;
        for (const file of files) {
            const text = await file.text();
            if (/[\x00-\x08\x0e-\x1f]/.test(text.substring(0, 256))) { showAlertDialog(`${file.name} is not a valid plain-text .gani file (may be encrypted or binary).`); continue; }
            const ani = parseGani(text);
            ani.fileName = file.name;
            addTab(ani);
            opened++;
        }
        if (opened) updateDefaultsTable();
    });
    document.getElementById("btnSave").onclick = async () => {
        if (!currentAnimation) return;
        if (currentAnimation.fileHandle) {
            try {
                const writable = await currentAnimation.fileHandle.createWritable();
                await writable.write(saveGani(currentAnimation));
                await writable.close();
                currentAnimation.modified = false;
                saveSession();
            } catch (err) {
                console.error("Failed to save:", err);
                const blob = new Blob([saveGani(currentAnimation)], {type: "text/plain"});
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = currentAnimation.fileName || "animation.gani";
                a.click();
                URL.revokeObjectURL(url);
            }
        } else {
            document.getElementById("btnSaveAs").click();
        }
    };
    document.getElementById("btnSaveAs").onclick = async () => {
        if (!currentAnimation) return;
        const defaultName = currentAnimation.fileName || "animation.gani";

        if (window.showSaveFilePicker) {
            try {
                const fileHandle = await window.showSaveFilePicker({
                    suggestedName: defaultName,
                    types: [{
                        description: "GANI Animation Files",
                        accept: { "text/plain": [".gani"] }
                    }],
                    excludeAcceptAllOption: false
                });
                const writable = await fileHandle.createWritable();
                await writable.write(saveGani(currentAnimation));
                await writable.close();
                currentAnimation.fileName = fileHandle.name;
                currentAnimation.fullPath = fileHandle.name;
                currentAnimation.fileHandle = fileHandle;
                currentAnimation.modified = false;
                saveSession();
            } catch (err) {
                if (err.name !== "AbortError") {
                    showAlertDialog(`Failed to save file: ${err.message}`);
                }
            }
        } else {
            const blob = new Blob([saveGani(currentAnimation)], {type: "text/plain"});
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = defaultName;
            a.style.display = "none";
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            }, 100);
            currentAnimation.fileName = defaultName;
            currentAnimation.modified = false;
            saveSession();
        }
    };
    document.getElementById("btnSaveAll").onclick = () => {
        const blob = new Blob([saveGani(currentAnimation)], {type: "text/plain"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = currentAnimation.fileName || "animation.gani";
        a.click();
        URL.revokeObjectURL(url);
    };
    document.getElementById("btnCloseAll").onclick = () => {
        showConfirmDialog("Close all animations? Unsaved changes will be lost.", (confirmed) => {
            if (confirmed) {
                animations = [];
                currentAnimation = null;
                currentTabIndex = -1;
                currentFrame = 0;
                selectedPieces.clear();
                updateTabs();
                updateUIVisibility();
                redraw();
                updateFrameInfo();
                updateSpritesList();
                updateDefaultsTable();
                saveSession();
            }
        });
    };
    document.getElementById("btnReset").onclick = () => {
        showConfirmDialog("Reset the editor to default state? This will reset zoom, pan, selections, UI layout, and all settings.", (confirmed, clearStorage) => {
            if (confirmed) {
                if (clearStorage) {
                    localStorage.clear();
                }
                zoomLevel = 6;
                panX = 0;
                panY = 0;
                backgroundColor = "#006400";
                const leftPanel = document.querySelector(".left-panel");
                const rightPanel = document.querySelector(".right-panel");
                const timelineContainer = document.querySelector(".timeline-container");
                const spriteList = document.querySelector(".sprite-list");
                if (leftPanel) leftPanel.style.width = "270px";
                if (rightPanel) rightPanel.style.width = "250px";
                if (timelineContainer) {
                    const timelineVisible = localStorage.getItem("timelineVisible") !== "false";
                    if (timelineVisible) {
                    const isTouch = (navigator.maxTouchPoints && navigator.maxTouchPoints > 1) || (window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
                    timelineContainer.style.height = isTouch ? "240px" : "218px";
                    timelineContainer.style.flex = isTouch ? "0 0 240px" : "0 0 218px";
                    }
                }
                if (spriteList) spriteList.style.height = "300px";
                selectedPieces.clear();
                currentFrame = 0;
                currentDir = 2;
                isPlaying = false;
                undoStack = [];
                undoIndex = -1;
                localStorage.setItem("mainCanvasZoom", zoomLevel);
                const zoomDisplay = document.getElementById("mainCanvasZoomLevel");
                if (zoomDisplay) zoomDisplay.textContent = (zoomFactors[zoomLevel] || 1.0).toFixed(1) + "x";
                localStorage.setItem("editorFont", "chevyray");
                localStorage.setItem("editorFontSize", "12");
                localStorage.setItem("editorFontStyle", "normal");
                localStorage.setItem("editorUIScale", "1");
                localStorage.setItem("editorPixelRendering", "true");
                localStorage.setItem("editorAutoSave", "true");
                localStorage.setItem("editorShowGrid", "true");
                localStorage.setItem("editorColorScheme", "default");
                location.reload();
            }
        }, true);
    };
    document.getElementById("directionCombo").onchange = (e) => {
        currentDir = ["UP", "LEFT", "DOWN", "RIGHT"].indexOf(e.target.value);
        selectedPieces.clear();
        selectedPieceDir = null;
        redraw();
        updateItemsCombo();
    };
    document.getElementById("itemsCombo").onchange = () => { selectedPieces.clear(); updateItemSettings(); redraw(); };
    document.getElementById("itemX").onchange = (e) => {
        const pieceId = document.getElementById("itemsCombo").value;
        const frame = currentAnimation.getFrame(currentFrame);
        if (frame && pieceId) {
            const actualDir = getDirIndex(currentDir);
            const pieces = frame.pieces[actualDir] || [];
            const piece = pieces.find(p => p.id === pieceId);
            if (piece) {
                const oldState = serializeAnimationState();
                piece.xoffset = parseFloat(e.target.value) || 0;
                const newState = serializeAnimationState();
                const sprite = currentAnimation.getAniSprite(piece.spriteIndex, piece.spriteName || "");
                const spriteName = sprite && sprite.comment ? `"${sprite.comment}"` : `Sprite ${piece.spriteIndex}`;
                addUndoCommand({
                    description: `Change ${spriteName} X Position`,
                    oldState: oldState,
                    newState: newState,
                    undo: () => restoreAnimationState(oldState),
                    redo: () => restoreAnimationState(newState)
                });
                redraw();
                saveSession();
            }
        }
    };
    document.getElementById("itemY").onchange = (e) => {
        const pieceId = document.getElementById("itemsCombo").value;
        const frame = currentAnimation.getFrame(currentFrame);
        if (frame && pieceId) {
            const actualDir = getDirIndex(currentDir);
            const pieces = frame.pieces[actualDir] || [];
            const piece = pieces.find(p => p.id === pieceId);
            if (piece) {
                const oldState = serializeAnimationState();
                piece.yoffset = parseFloat(e.target.value) || 0;
                const newState = serializeAnimationState();
                const sprite = currentAnimation.getAniSprite(piece.spriteIndex, piece.spriteName || "");
                const spriteName = sprite && sprite.comment ? `"${sprite.comment}"` : `Sprite ${piece.spriteIndex}`;
                addUndoCommand({
                    description: `Change ${spriteName} Y Position`,
                    oldState: oldState,
                    newState: newState,
                    undo: () => restoreAnimationState(oldState),
                    redo: () => restoreAnimationState(newState)
                });
                redraw();
                saveSession();
            }
        }
    };
    const getCurrentPiece = () => {
        const pieceId = document.getElementById("itemsCombo").value;
        const frame = currentAnimation?.getFrame(currentFrame);
        if (frame && pieceId) {
            const actualDir = getDirIndex(currentDir);
            const pieces = frame.pieces[actualDir] || [];
            return pieces.find(p => p.id === pieceId);
        }
        return null;
    };

    const getSpriteName = (piece) => {
        const sprite = currentAnimation.getAniSprite(piece.spriteIndex, piece.spriteName || "");
        return sprite && sprite.comment ? `"${sprite.comment}"` : `Sprite ${piece.spriteIndex}`;
    };

    createSliderSync("itemXScale", "itemXScaleSlider",
        () => getCurrentPiece()?.xscale || 1.0,
        (val) => { const piece = getCurrentPiece(); if (piece) piece.xscale = val; },
        () => { redraw(); saveSession(); },
        () => {
            const piece = getCurrentPiece();
            return piece ? `Change ${getSpriteName(piece)} X Scale` : "Change Item X Scale";
        }
    );
    createSliderSync("itemYScale", "itemYScaleSlider",
        () => getCurrentPiece()?.yscale || 1.0,
        (val) => { const piece = getCurrentPiece(); if (piece) piece.yscale = val; },
        () => { redraw(); saveSession(); },
        () => {
            const piece = getCurrentPiece();
            return piece ? `Change ${getSpriteName(piece)} Y Scale` : "Change Item Y Scale";
        }
    );
    createSliderSync("itemRotation", "itemRotationSlider",
        () => getCurrentPiece()?.rotation || 0,
        (val) => { const piece = getCurrentPiece(); if (piece) piece.rotation = val; },
        () => { redraw(); saveSession(); },
        () => {
            const piece = getCurrentPiece();
            return piece ? `Change ${getSpriteName(piece)} Rotation` : "Change Item Rotation";
        }
    );
    createSliderSync("itemZoom", "itemZoomSlider",
        () => { const piece = getCurrentPiece(); return piece?._zoom !== undefined ? piece._zoom : 1.0; },
        (val) => { const piece = getCurrentPiece(); if (piece) piece._zoom = val; },
        () => { redraw(); saveSession(); },
        () => {
            const piece = getCurrentPiece();
            return piece ? `Change ${getSpriteName(piece)} Zoom` : "Change Item Zoom";
        }
    );

    document.getElementById("itemLayer").onchange = (e) => {
        const pieceId = document.getElementById("itemsCombo").value;
        const frame = currentAnimation.getFrame(currentFrame);
        if (frame && pieceId) {
            const actualDir = getDirIndex(currentDir);
            const pieces = frame.pieces[actualDir] || [];
            const pieceIndex = pieces.findIndex(p => p.id === pieceId);
            const newLayer = Math.max(0, Math.min(pieces.length - 1, parseInt(e.target.value) || 0));

            if (pieceIndex >= 0 && pieceIndex !== newLayer) {
                const oldState = serializeAnimationState();
                const piece = pieces[pieceIndex];
                pieces.splice(pieceIndex, 1);
                pieces.splice(newLayer, 0, piece);
                const newState = serializeAnimationState();
                const spriteName = getSpriteName(piece);
                addUndoCommand({
                    description: `Change ${spriteName} Layer`,
                    oldState: oldState,
                    newState: newState,
                    undo: () => restoreAnimationState(oldState),
                    redo: () => restoreAnimationState(newState)
                });
                redraw();
                updateItemsCombo();
                updateItemSettings();
                saveSession();
            }
        }
    };
    document.getElementById("duration").onchange = (e) => {
        const frame = currentAnimation.getFrame(currentFrame);
        if (frame) {
            const oldState = serializeAnimationState();
            frame.duration = parseInt(e.target.value) || 50;
            const newState = serializeAnimationState();
            addUndoCommand({
                description: "Change Frame Duration",
                oldState: oldState,
                newState: newState,
                undo: () => restoreAnimationState(oldState),
                redo: () => restoreAnimationState(newState)
            });
            redraw();
            updateFrameInfo();
            saveSession();
        }
    };
    document.getElementById("framePosition").onchange = (e) => {
        const targetPos = parseInt(e.target.value);
        const sourcePos = currentFrame;
        if (isNaN(targetPos) || targetPos < 0 || targetPos >= currentAnimation.frames.length || targetPos === sourcePos) {
            document.getElementById("framePosition").value = sourcePos;
            return;
        }
        const oldState = serializeAnimationState();
        const frameToMove = currentAnimation.frames[sourcePos];
        const targetFrame = currentAnimation.frames[targetPos];
        currentAnimation.frames[sourcePos] = targetFrame;
        currentAnimation.frames[targetPos] = frameToMove;
        currentFrame = targetPos;
        saveCurrentFrame();
        const newState = serializeAnimationState();
        addUndoCommand({
            description: `Swap Frame ${sourcePos} with ${targetPos}`,
            oldState: oldState,
            newState: newState,
            undo: () => restoreAnimationState(oldState),
            redo: () => restoreAnimationState(newState)
        });
        redraw();
        updateFrameInfo();
        drawTimeline();
        saveSession();
    };
    document.getElementById("btnAddSprite").onclick = () => {
        showAddSpriteDialog();
    };
    document.getElementById("btnEditSprite").onclick = () => {
        if (editingSprite) {
            editSprite(editingSprite);
        }
    };
    document.getElementById("spriteSource").onchange = (e) => {
        if (editingSprite) {
            const oldState = serializeAnimationState();
            editingSprite.type = e.target.value;
            if (editingSprite.type !== "CUSTOM") editingSprite.customImageName = "";
            const newState = serializeAnimationState();
            const spriteName = editingSprite.comment ? `"${editingSprite.comment}"` : `Sprite ${editingSprite.index}`;
            addUndoCommand({
                description: `Change ${spriteName} Source`,
                oldState: oldState,
                newState: newState,
                undo: () => restoreAnimationState(oldState),
                redo: () => restoreAnimationState(newState)
            });
            updateSpriteEditor();
            redraw();
            saveSession();
        }
    };
    document.getElementById("spriteImage").onchange = (e) => {
        if (editingSprite) {
            const oldState = serializeAnimationState();
            editingSprite.customImageName = e.target.value;
            const newState = serializeAnimationState();
            const spriteName = editingSprite.comment ? `"${editingSprite.comment}"` : `Sprite ${editingSprite.index}`;
            addUndoCommand({
                description: `Change ${spriteName} Image`,
                oldState: oldState,
                newState: newState,
                undo: () => restoreAnimationState(oldState),
                redo: () => restoreAnimationState(newState)
            });
            redraw();
            drawSpritePreview();
            saveSession(true);
        }
    };
    document.getElementById("spriteComment").onchange = (e) => {
        if (editingSprite) {
            const oldState = serializeAnimationState();
            editingSprite.comment = e.target.value;
            const newState = serializeAnimationState();
            const spriteName = editingSprite.comment ? `"${editingSprite.comment}"` : `Sprite ${editingSprite.index}`;
            addUndoCommand({
                description: `Change ${spriteName} Comment`,
                oldState: oldState,
                newState: newState,
                undo: () => restoreAnimationState(oldState),
                redo: () => restoreAnimationState(newState)
            });
            updateSpritesList();
            saveSession();
        }
    };
    createSliderSync("xScale", "xScaleSlider",
        () => editingSprite?.xscale || 1.0,
        (val) => { if (editingSprite) { editingSprite.xscale = val; editingSprite.updateBoundingBox(); } },
        () => { redraw(); drawSpritePreview(); updateSpritesList(); saveSession(true); },
        `Change ${editingSprite.comment ? `"${editingSprite.comment}"` : `Sprite ${editingSprite.index}`} X Scale`
    );
    createSliderSync("yScale", "yScaleSlider",
        () => editingSprite?.yscale || 1.0,
        (val) => { if (editingSprite) { editingSprite.yscale = val; editingSprite.updateBoundingBox(); } },
        () => { redraw(); drawSpritePreview(); updateSpritesList(); saveSession(true); },
        `Change ${editingSprite.comment ? `"${editingSprite.comment}"` : `Sprite ${editingSprite.index}`} Y Scale`
    );
    createSliderSync("rotation", "rotationSlider",
        () => editingSprite?.rotation || 0,
        (val) => { if (editingSprite) { editingSprite.rotation = val; editingSprite.updateBoundingBox(); } },
        () => { redraw(); drawSpritePreview(); updateSpritesList(); saveSession(true); },
        `Change ${editingSprite.comment ? `"${editingSprite.comment}"` : `Sprite ${editingSprite.index}`} Rotation`
    );
    createSliderSync("zoom", "zoomSlider",
        () => editingSprite?._zoom !== undefined ? editingSprite._zoom : 1.0,
        (val) => {
            if (editingSprite) {
                editingSprite._zoom = val;
                editingSprite.updateBoundingBox();
            }
        },
        () => { redraw(); drawSpritePreview(); updateSpritesList(); saveSession(true); },
        () => `Change ${editingSprite?.comment ? `"${editingSprite.comment}"` : `Sprite ${editingSprite?.index}`} Zoom`
    );
    const spriteModeSelect = document.getElementById("spriteMode");
    if (spriteModeSelect) {
        spriteModeSelect.addEventListener("change", (e) => {
            if (!editingSprite) return;
            const modeDropdown = e.target;
            const modeValue = modeDropdown.value;
            const oldModeValue = editingSprite.hasOwnProperty("mode") && editingSprite.mode !== undefined && editingSprite.mode !== null ? String(editingSprite.mode) : "";
            if (oldModeValue === modeValue) {
                return;
            }
            const oldState = serializeAnimationState();
            if (modeValue === "") {
                delete editingSprite.mode;
            } else {
                const modeNum = parseInt(modeValue);
                if (isNaN(modeNum)) {
                    return;
                }
                editingSprite.mode = modeNum;
            }
            const newState = serializeAnimationState();
            const spriteName = editingSprite.comment ? `"${editingSprite.comment}"` : `Sprite ${editingSprite.index}`;
            addUndoCommand({
                description: `Change ${spriteName} Mode`,
                oldState: oldState,
                newState: newState,
                undo: () => restoreAnimationState(oldState),
                redo: () => restoreAnimationState(newState)
            });
            const spriteModeWrapper = modeDropdown.closest("div[style*='position: relative']");
            if (spriteModeWrapper) {
                const buttonText = spriteModeWrapper.querySelector(".custom-dropdown-button span");
                if (buttonText) {
                    const selectedOption = modeDropdown.options[modeDropdown.selectedIndex];
                    if (selectedOption) {
                        buttonText.textContent = selectedOption.text;
                    }
                }
            }
            redraw();
            drawSpritePreview();
            updateSpritesList();
            saveSession(true);
        });
    }
    document.getElementById("spriteLeft").onchange = (e) => {
        if (editingSprite) {
            const oldState = serializeAnimationState();
            editingSprite.left = parseInt(e.target.value) || 0;
            const newState = serializeAnimationState();
            const spriteName = editingSprite.comment ? `"${editingSprite.comment}"` : `Sprite ${editingSprite.index}`;
            addUndoCommand({
                description: `Change ${spriteName} Left`,
                oldState: oldState,
                newState: newState,
                undo: () => restoreAnimationState(oldState),
                redo: () => restoreAnimationState(newState)
            });
            redraw();
            drawSpritePreview();
            saveSession(true);
        }
    };
    document.getElementById("spriteTop").onchange = (e) => {
        if (editingSprite) {
            const oldState = serializeAnimationState();
            editingSprite.top = parseInt(e.target.value) || 0;
            const newState = serializeAnimationState();
            const spriteName = editingSprite.comment ? `"${editingSprite.comment}"` : `Sprite ${editingSprite.index}`;
            addUndoCommand({
                description: `Change ${spriteName} Top`,
                oldState: oldState,
                newState: newState,
                undo: () => restoreAnimationState(oldState),
                redo: () => restoreAnimationState(newState)
            });
            redraw();
            drawSpritePreview();
            saveSession(true);
        }
    };
    document.getElementById("spriteWidth").onchange = (e) => {
        if (editingSprite) {
            const oldState = serializeAnimationState();
            editingSprite.width = parseInt(e.target.value) || 32;
            editingSprite.updateBoundingBox();
            const newState = serializeAnimationState();
            const spriteName = editingSprite.comment ? `"${editingSprite.comment}"` : `Sprite ${editingSprite.index}`;
            addUndoCommand({
                description: `Change ${spriteName} Width`,
                oldState: oldState,
                newState: newState,
                undo: () => restoreAnimationState(oldState),
                redo: () => restoreAnimationState(newState)
            });
            redraw();
            drawSpritePreview();
            saveSession(true);
        }
    };
    document.getElementById("spriteHeight").onchange = (e) => {
        if (editingSprite) {
            const oldState = serializeAnimationState();
            editingSprite.height = parseInt(e.target.value) || 32;
            editingSprite.updateBoundingBox();
            const newState = serializeAnimationState();
            const spriteName = editingSprite.comment ? `"${editingSprite.comment}"` : `Sprite ${editingSprite.index}`;
            addUndoCommand({
                description: `Change ${spriteName} Height`,
                oldState: oldState,
                newState: newState,
                undo: () => restoreAnimationState(oldState),
                redo: () => restoreAnimationState(newState)
            });
            redraw();
            drawSpritePreview();
            saveSession(true);
        }
    };
    const colorEffectCheckbox = document.getElementById("colorEffectCheckbox");
    if (colorEffectCheckbox) {
        colorEffectCheckbox.onclick = () => {
            if (editingSprite) {
                const oldState = serializeAnimationState();
                editingSprite.colorEffectEnabled = !editingSprite.colorEffectEnabled;
                colorEffectCheckbox.textContent = editingSprite.colorEffectEnabled ? "✓" : " ";
                const newState = serializeAnimationState();
                const spriteName = editingSprite.comment ? `"${editingSprite.comment}"` : `Sprite ${editingSprite.index}`;
                addUndoCommand({
                    description: `Change ${spriteName} Color Effect`,
                    oldState: oldState,
                    newState: newState,
                    undo: () => restoreAnimationState(oldState),
                    redo: () => restoreAnimationState(newState)
                });
                redraw();
                drawSpritePreview();
                saveSession(true);
            }
        };
    }
    document.getElementById("colorSwatch").onchange = (e) => {
        if (!editingSprite) return;
        const oldState = serializeAnimationState();
        const hex = e.target.value;
        const r = parseInt(hex.substr(1,2), 16);
        const g = parseInt(hex.substr(3,2), 16);
        const b = parseInt(hex.substr(5,2), 16);
        editingSprite.colorEffect = {r, g, b, a: editingSprite.colorEffect.a || 255};
        if (!editingSprite.colorEffectEnabled) { editingSprite.colorEffectEnabled = true; const cb = document.getElementById("colorEffectCheckbox"); if (cb) cb.textContent = "✓"; }
        const colorR = document.getElementById("colorR");
        const colorG = document.getElementById("colorG");
        const colorB = document.getElementById("colorB");
        if (colorR) colorR.value = r;
        if (colorG) colorG.value = g;
        if (colorB) colorB.value = b;
        const newState = serializeAnimationState();
        const spriteName = editingSprite.comment ? `"${editingSprite.comment}"` : `Sprite ${editingSprite.index}`;
        addUndoCommand({
            description: `Change ${spriteName} Color`,
            oldState: oldState,
            newState: newState,
            undo: () => restoreAnimationState(oldState),
            redo: () => restoreAnimationState(newState)
        });
        redraw();
        drawSpritePreview();
        saveSession();
    };
    const updateColorFromRGB = () => {
        if (!editingSprite) return;
        const colorR = document.getElementById("colorR");
        const colorG = document.getElementById("colorG");
        const colorB = document.getElementById("colorB");
        const colorA = document.getElementById("colorA");
        const colorSwatch = document.getElementById("colorSwatch");
        if (!colorR || !colorG || !colorB) return;
        const oldState = serializeAnimationState();
        const r = Math.max(0, Math.min(255, parseInt(colorR.value) || 255));
        const g = Math.max(0, Math.min(255, parseInt(colorG.value) || 255));
        const b = Math.max(0, Math.min(255, parseInt(colorB.value) || 255));
        const a = colorA ? Math.max(0, Math.min(255, parseInt(colorA.value) || 255)) : (editingSprite.colorEffect.a || 255);
        editingSprite.colorEffect = {r, g, b, a};
        if (!editingSprite.colorEffectEnabled) { editingSprite.colorEffectEnabled = true; const cb = document.getElementById("colorEffectCheckbox"); if (cb) cb.textContent = "✓"; }
        if (colorSwatch) {
            const hex = `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
            colorSwatch.value = hex;
        }
        const newState = serializeAnimationState();
        const spriteName = editingSprite.comment ? `"${editingSprite.comment}"` : `Sprite ${editingSprite.index}`;
        addUndoCommand({
            description: `Change ${spriteName} Color`,
            oldState: oldState,
            newState: newState,
            undo: () => restoreAnimationState(oldState),
            redo: () => restoreAnimationState(newState)
        });
        redraw();
        drawSpritePreview();
        updateSpritesList();
        saveSession();
    };
    if (document.getElementById("colorR")) document.getElementById("colorR").onchange = updateColorFromRGB;
    if (document.getElementById("colorG")) document.getElementById("colorG").onchange = updateColorFromRGB;
    if (document.getElementById("colorB")) document.getElementById("colorB").onchange = updateColorFromRGB;
    if (document.getElementById("colorA")) document.getElementById("colorA").onchange = updateColorFromRGB;
    document.getElementById("colorSwatch").onclick = (e) => {
        if (e.target.type === "color") {
            e.target.click();
        }
    };
    document.getElementById("btnNewFrame").onclick = () => {
        if (!currentAnimation) return;
        const oldState = serializeAnimationState();
        const frame = new Frame();
        currentAnimation.frames.splice(currentFrame + 1, 0, frame);
        currentFrame++;
        saveCurrentFrame();
        const newState = serializeAnimationState();
        addUndoCommand({
            description: "Add Frame",
            oldState: oldState,
            newState: newState,
            undo: () => restoreAnimationState(oldState),
            redo: () => restoreAnimationState(newState)
        });
        redraw();
    updateFrameInfo();
    saveSession();
};
    document.getElementById("btnDeleteFrame").onclick = () => {
        if (currentAnimation.frames.length <= 1) {
            showAlertDialog("Cannot delete the last frame");
            return;
        }
        showConfirmDialog("Delete current frame?", (confirmed) => {
            if (confirmed) {
                const oldState = serializeAnimationState();
                currentAnimation.frames.splice(currentFrame, 1);
                if (currentFrame >= currentAnimation.frames.length) currentFrame = currentAnimation.frames.length - 1;
                const newState = serializeAnimationState();
                addUndoCommand({
                    description: "Delete Frame",
                    oldState: oldState,
                    newState: newState,
                    undo: () => restoreAnimationState(oldState),
                    redo: () => restoreAnimationState(newState)
                });
                redraw();
                updateFrameInfo();
                saveSession();
            }
        });
    };
    document.getElementById("btnCopyFrame").onclick = () => {
        if (!currentAnimation) return;
        const indices = selectedFrames.size > 1 ? [...selectedFrames].sort((a, b) => a - b) : [currentFrame];
        const frames = indices.map(i => currentAnimation.getFrame(i)).filter(Boolean);
        if (frames.length) clipboardFrames = frames.map(f => f.duplicate());
    };
    document.getElementById("btnPasteBefore").onclick = () => {
        if (!clipboardFrames || !currentAnimation) return;
        const oldState = serializeAnimationState();
        clipboardFrames.forEach((f, i) => currentAnimation.frames.splice(currentFrame + i, 0, f.duplicate()));
        const newState = serializeAnimationState();
        addUndoCommand({ description: `Paste ${clipboardFrames.length} Frame${clipboardFrames.length > 1 ? 's' : ''} Before`, oldState, newState, undo: () => restoreAnimationState(oldState), redo: () => restoreAnimationState(newState) });
        drawTimeline();
        redraw();
        updateFrameInfo();
        saveSession();
    };
    document.getElementById("btnPasteAfter").onclick = () => {
        if (!clipboardFrames || !currentAnimation) return;
        const oldState = serializeAnimationState();
        clipboardFrames.forEach((f, i) => currentAnimation.frames.splice(currentFrame + 1 + i, 0, f.duplicate()));
        currentFrame += clipboardFrames.length;
        saveCurrentFrame();
        const newState = serializeAnimationState();
        addUndoCommand({ description: `Paste ${clipboardFrames.length} Frame${clipboardFrames.length > 1 ? 's' : ''} After`, oldState, newState, undo: () => restoreAnimationState(oldState), redo: () => restoreAnimationState(newState) });
        drawTimeline();
        redraw();
        updateFrameInfo();
        saveSession();
    };
    document.getElementById("btnReverseFrame").onclick = () => {
        const frame = currentAnimation.getFrame(currentFrame);
        if (frame) {
            const actualDir = getDirIndex(currentDir);
            frame.pieces[actualDir].reverse();
            redraw();
        }
    };
    document.getElementById("timelineSlider").oninput = (e) => {
        saveCurrentFrame();
        const actualDir = getDirIndex(currentDir);
        const oldPieces = (currentAnimation.getFrame(currentFrame)?.pieces[actualDir]) || [];
        const prevSelected = Array.from(selectedPieces).filter(p => p.type === "sprite").map(p => ({ spriteIndex: p.spriteIndex, spriteName: p.spriteName || "", arrayIndex: oldPieces.indexOf(p) }));
        currentFrame = parseInt(e.target.value) || 0;
        saveCurrentFrame();
        selectedPieces.clear();
        if (prevSelected.length > 0) {
            const newPieces = (currentAnimation.getFrame(currentFrame)?.pieces[actualDir]) || [];
            for (const sel of prevSelected) {
                const piece = sel.arrayIndex >= 0 ? newPieces[sel.arrayIndex] : null;
                if (piece?.type === "sprite" && piece.spriteIndex === sel.spriteIndex && (piece.spriteName || "") === sel.spriteName) selectedPieces.add(piece);
            }
        }
        redraw();
        updateFrameInfo();
    };
    document.getElementById("btnPlay").onclick = () => {
        if (isPlaying) {
            isPlaying = false;
            stopAllSounds();
            document.getElementById("btnPlay").innerHTML = '<i class="fas fa-play"></i>';
        } else {
            isPlaying = true;
            playPosition = 0;
            playStartTime = Date.now();
            document.getElementById("btnPlay").innerHTML = '<i class="fas fa-pause"></i>';
            playAnimation();
        }
    };
    document.getElementById("btnStop").onclick = () => {
        isPlaying = false;
        playStartTime = 0;
        playPosition = 0;
        currentFrame = 0;
        stopAllSounds();
        document.getElementById("btnPlay").innerHTML = '<i class="fas fa-play"></i>';
        redraw();
        updateFrameInfo();
    };
    document.getElementById("btnOnionSkin").onclick = (e) => {
        onionSkinEnabled = !onionSkinEnabled;
        e.target.closest("button").classList.toggle("active", onionSkinEnabled);
        redraw();
    };
    const btnSplitView = document.getElementById("btnSplitView");
    if (btnSplitView) {
        btnSplitView.classList.toggle("active", splitViewEnabled);
    }
    document.getElementById("btnSplitView").onclick = (e) => {
        if (currentAnimation && currentAnimation.singleDir) return;
        splitViewEnabled = !splitViewEnabled;
        localStorage.setItem("ganiEditorSplitView", splitViewEnabled ? "true" : "false");
        e.target.closest("button").classList.toggle("active", splitViewEnabled);
        if (!splitViewEnabled) selectedPieceDir = null;
        redraw();
    };
    document.getElementById("btnMirroredActions").onclick = (e) => {
        mirroredActionsEnabled = !mirroredActionsEnabled;
        e.target.closest("button").classList.toggle("active", mirroredActionsEnabled);
        redraw();
    };
    document.getElementById("btnUndo").onclick = undo;
    document.getElementById("btnRedo").onclick = redo;
    const btnHistoryUndo = document.getElementById("btnHistoryUndo");
    const btnHistoryRedo = document.getElementById("btnHistoryRedo");
    const btnHistoryClear = document.getElementById("btnHistoryClear");
    if (btnHistoryUndo) btnHistoryUndo.onclick = undo;
    if (btnHistoryRedo) btnHistoryRedo.onclick = redo;
    if (btnHistoryClear) btnHistoryClear.onclick = () => {
        showConfirmDialog("Are you sure you want to clear the history? This cannot be undone.", (confirmed) => {
            if (confirmed && currentAnimation) {
                currentAnimation.undoStack = [];
                currentAnimation.undoIndex = -1;
                updateHistoryMenu();
                saveUndoStack();
            }
        });
    };
    updateHistoryMenu();
    let resizeFrame = -1;
    let resizeStartDuration = 0;
    let resizeOffset = 0;
    let desiredResizeFrame = -1;
    timelineCanvas.onmousemove = (e) => {
        const rect = timelineCanvas.getBoundingClientRect();
        const pos = {x: e.clientX - rect.left, y: e.clientY - rect.top};
        
        if (isDraggingScrollbar && timelineTotalWidth > timelineCanvas.width) {
            if (pos.x < 0 || pos.x > timelineCanvas.width || pos.y < 0 || pos.y > timelineCanvas.height) {
                isDraggingScrollbar = false;
                return;
            }
            const scrollbarWidth = timelineCanvas.width - 4;
            const deltaX = pos.x - scrollbarDragStartX;
            const scrollRatio = deltaX / scrollbarWidth;
            const deltaScroll = scrollRatio * timelineTotalWidth;
            const newScrollX = scrollbarDragStartScrollX + deltaScroll;
            timelineScrollX = Math.max(0, Math.min(timelineTotalWidth - timelineCanvas.width, newScrollX));
            drawTimeline();
            return;
        }
        if (resizeFrame >= 0) {
            const frame = currentAnimation.getFrame(resizeFrame);
            if (frame) {
                const newDurationUnfiltered = resizeStartDuration + (pos.x - resizeOffset);
                const newDuration = Math.max(50, Math.round(newDurationUnfiltered / 50) * 50);
                if (frame.duration !== newDuration) {
                    frame.duration = newDuration;
                    if (resizeFrame === currentFrame) {
                        document.getElementById("duration").value = frame.duration;
                    }
                    redraw();
                    updateFrameInfo();
                }
            }
            return;
        }
        let currentX = 2 - timelineScrollX;
        const pixelsPerMs = (window.matchMedia && window.matchMedia("(pointer: coarse)").matches ? 1 : 1.5) * timelineZoom;
        const minFrameWidth = 48 * timelineZoom;
        for (let i = 0; i < currentAnimation.frames.length; i++) {
            const frame = currentAnimation.frames[i];
            const frameWidth = Math.max(frame.duration * pixelsPerMs, minFrameWidth);
            const frameStartX = currentX;
            const frameEndX = currentX + frameWidth;
            const right = frameEndX - 2;

            if (pos.x >= right && pos.x <= right + 4 && !isDraggingFrame) {
                timelineCanvas.style.cursor = "ew-resize";
                desiredResizeFrame = i;
                return;
            }
            currentX += frameWidth;
        }
        desiredResizeFrame = -1;

        if (dragFrame >= 0 && !isDraggingFrame) {
            if (Math.abs(pos.x - dragStartX) > dragThreshold) {
                isDraggingFrame = true;
                timelineCanvas.style.cursor = "grabbing";
            }
        }

        if (isDraggingFrame && dragFrame >= 0) {
            dragCurrentX = pos.x;
            let targetIndex = dragFrame;
            let x = 2 - timelineScrollX;
            const pixelsPerMs = (window.matchMedia && window.matchMedia("(pointer: coarse)").matches ? 1 : 1.5) * timelineZoom;
            const minFrameWidth = 48 * timelineZoom;
            for (let i = 0; i < currentAnimation.frames.length; i++) {
                const frame = currentAnimation.frames[i];
                const frameWidth = Math.max(frame.duration * pixelsPerMs, minFrameWidth);
                const frameCenter = x + frameWidth / 2;
                if (pos.x < frameCenter) {
                    targetIndex = i;
                    break;
                }
                x += frameWidth;
                if (i === currentAnimation.frames.length - 1) {
                    targetIndex = i + 1;
                }
            }
            dragTargetIndex = targetIndex;
            drawTimeline();
        }

        timelineCanvas.style.cursor = isDraggingFrame ? "grabbing" : "default";
    };
    timelineCanvas.onmousedown = (e) => {
        const rect = timelineCanvas.getBoundingClientRect();
        const pos = {x: e.clientX - rect.left, y: e.clientY - rect.top};
        if (pos.y < 20) return;
        if (e.button === 0) {
            if (timelineTotalWidth > timelineCanvas.width) {
                const scrollbarHeight = 10;
                const scrollbarY = timelineCanvas.height - scrollbarHeight - 2;
                if (pos.y >= scrollbarY && pos.y <= scrollbarY + scrollbarHeight) {
                    const scrollbarWidth = timelineCanvas.width - 4;
                    const thumbWidth = Math.max(20, (timelineCanvas.width / timelineTotalWidth) * scrollbarWidth);
                    const thumbX = 2 + ((timelineScrollX / timelineTotalWidth) * scrollbarWidth);

                    if (pos.x >= thumbX && pos.x <= thumbX + thumbWidth) {
                        isDraggingScrollbar = true;
                        scrollbarDragStartX = pos.x;
                        scrollbarDragStartScrollX = timelineScrollX;
                        return;
                    } else if (pos.x >= 2 && pos.x <= 2 + scrollbarWidth) {
                        const clickRatio = (pos.x - 2) / scrollbarWidth;
                        const newScrollX = clickRatio * timelineTotalWidth;
                        timelineScrollX = Math.max(0, Math.min(timelineTotalWidth - timelineCanvas.width, newScrollX - (timelineCanvas.width / 2)));
                        drawTimeline();
                        return;
                    }
                }
            }

            if (desiredResizeFrame >= 0) {
                resizeFrame = desiredResizeFrame;
                const frame = currentAnimation.getFrame(resizeFrame);
                if (frame) {
                    resizeOffset = pos.x;
                    resizeStartDuration = frame.duration;
                }
                return;
            }
            let currentX = 2 - timelineScrollX;
            const pixelsPerMs = (window.matchMedia && window.matchMedia("(pointer: coarse)").matches ? 1 : 1.5) * timelineZoom;
            const minFrameWidth = 48 * timelineZoom;
            for (let i = 0; i < currentAnimation.frames.length; i++) {
                const frame = currentAnimation.frames[i];
                const frameWidth = Math.max(frame.duration * pixelsPerMs, minFrameWidth);
                const frameStartX = currentX;
                const frameEndX = currentX + frameWidth;

                if (pos.x >= frameStartX + 2 && pos.x <= frameEndX - 4) {
                    if (e.shiftKey || e.ctrlKey) {
                        if (selectedFrames.has(i)) selectedFrames.delete(i);
                        else selectedFrames.add(i);
                        drawTimeline();
                    } else {
                        dragFrame = i;
                        dragStartX = pos.x;
                        isDraggingFrame = false;
                        if (!selectedFrames.has(i)) selectedFrames.clear();
                        if (currentFrame !== i) {
                            const actualDir = getDirIndex(currentDir);
                            const oldPieces = (currentAnimation.getFrame(currentFrame)?.pieces[actualDir]) || [];
                            const prevSelected = Array.from(selectedPieces).filter(p => p.type === "sprite").map(p => ({ spriteIndex: p.spriteIndex, spriteName: p.spriteName || "", arrayIndex: oldPieces.indexOf(p) }));
                            currentFrame = i;
                            saveCurrentFrame();
                            selectedPieces.clear();
                            if (prevSelected.length > 0) {
                                const newPieces = (currentAnimation.getFrame(currentFrame)?.pieces[actualDir]) || [];
                                for (const sel of prevSelected) {
                                    const piece = sel.arrayIndex >= 0 ? newPieces[sel.arrayIndex] : null;
                                    if (piece?.type === "sprite" && piece.spriteIndex === sel.spriteIndex && (piece.spriteName || "") === sel.spriteName) selectedPieces.add(piece);
                                }
                            }
                            redraw();
                            updateFrameInfo();
                            const slider = document.getElementById("timelineSlider");
                            if (slider) slider.value = currentFrame;
                        }
                    }
                    break;
                }
                currentX += frameWidth;
            }
        }
    };
    timelineCanvas.oncontextmenu = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        showTimelineContextMenu(e);
    };

    let timelineTouchStart = null;
    let timelineTouchContextMenuTimer = null;
    let timelineTouchMoved = false;
    let pinchStartDist = null;
    let pinchStartZoom = 1.0;
    let pinchStartScrollX = 0;
    let pinchMidX = 0;

    timelineCanvas.addEventListener("touchstart", (e) => {
        if (e.touches.length === 2) {
            e.preventDefault();
            const dx = e.touches[1].clientX - e.touches[0].clientX;
            const dy = e.touches[1].clientY - e.touches[0].clientY;
            pinchStartDist = Math.sqrt(dx * dx + dy * dy);
            pinchStartZoom = timelineZoom;
            const rect = timelineCanvas.getBoundingClientRect();
            pinchMidX = ((e.touches[0].clientX + e.touches[1].clientX) / 2) - rect.left;
            pinchStartScrollX = timelineScrollX;
            return;
        }
        if (e.touches.length > 1) return;
        e.preventDefault();
        const rect = timelineCanvas.getBoundingClientRect();
        const touch = e.touches[0];
        const pos = {x: touch.clientX - rect.left, y: touch.clientY - rect.top};
        timelineTouchStart = pos;
        timelineTouchMoved = false;

        if (pos.y < 20) return;

        if (timelineTotalWidth > timelineCanvas.width) {
            const scrollbarHeight = 10;
            const scrollbarY = timelineCanvas.height - scrollbarHeight - 2;
            if (pos.y >= scrollbarY && pos.y <= scrollbarY + scrollbarHeight) {
                const scrollbarWidth = timelineCanvas.width - 4;
                const thumbWidth = Math.max(20, (timelineCanvas.width / timelineTotalWidth) * scrollbarWidth);
                const thumbX = 2 + ((timelineScrollX / timelineTotalWidth) * scrollbarWidth);

                    if (pos.x >= thumbX && pos.x <= thumbX + thumbWidth) {
                        isDraggingScrollbar = true;
                        scrollbarDragStartX = pos.x;
                        scrollbarDragStartScrollX = timelineScrollX;
                        return;
                    } else if (pos.x >= 2 && pos.x <= 2 + scrollbarWidth) {
                    const clickRatio = (pos.x - 2) / scrollbarWidth;
                    const newScrollX = clickRatio * timelineTotalWidth;
                    timelineScrollX = Math.max(0, Math.min(timelineTotalWidth - timelineCanvas.width, newScrollX - (timelineCanvas.width / 2)));
                    drawTimeline();
                    return;
                }
            }
        }

        if (desiredResizeFrame >= 0) {
            resizeFrame = desiredResizeFrame;
            const frame = currentAnimation.getFrame(resizeFrame);
            if (frame) {
                resizeOffset = pos.x;
                resizeStartDuration = frame.duration;
            }
            return;
        }

        let currentX = 2 - timelineScrollX;
        for (let i = 0; i < currentAnimation.frames.length; i++) {
            const frame = currentAnimation.frames[i];
            const frameWidth = Math.max(frame.duration * timelineZoom, 48 * timelineZoom);
            const frameStartX = currentX;
            const frameEndX = currentX + frameWidth;

            if (pos.x >= frameStartX + 2 && pos.x <= frameEndX - 4) {
                dragFrame = i;
                dragStartX = pos.x;
                isDraggingFrame = false;
                if (currentFrame !== i) {
                    const actualDir = getDirIndex(currentDir);
                    const oldPieces = (currentAnimation.getFrame(currentFrame)?.pieces[actualDir]) || [];
                    const prevSelected = Array.from(selectedPieces).filter(p => p.type === "sprite").map(p => ({ spriteIndex: p.spriteIndex, spriteName: p.spriteName || "", arrayIndex: oldPieces.indexOf(p) }));
                    currentFrame = i;
                    saveCurrentFrame();
                    selectedPieces.clear();
                    if (prevSelected.length > 0) {
                        const newPieces = (currentAnimation.getFrame(currentFrame)?.pieces[actualDir]) || [];
                        for (const sel of prevSelected) {
                            const piece = sel.arrayIndex >= 0 ? newPieces[sel.arrayIndex] : null;
                            if (piece?.type === "sprite" && piece.spriteIndex === sel.spriteIndex && (piece.spriteName || "") === sel.spriteName) selectedPieces.add(piece);
                        }
                    }
                    redraw();
                    updateFrameInfo();
                    const slider = document.getElementById("timelineSlider");
                    if (slider) slider.value = currentFrame;
                }
                break;
            }
            currentX += frameWidth;
        }

        timelineTouchContextMenuTimer = setTimeout(() => {
            if (!timelineTouchMoved && timelineTouchStart) {
                const fakeEvent = {
                    clientX: rect.left + timelineTouchStart.x,
                    clientY: rect.top + timelineTouchStart.y,
                    preventDefault: () => {},
                    stopPropagation: () => {},
                    stopImmediatePropagation: () => {}
                };
                showTimelineContextMenu(fakeEvent);
            }
        }, 500);
    }, {passive: false});

    timelineCanvas.addEventListener("touchmove", (e) => {
        if (e.touches.length === 2 && pinchStartDist !== null) {
            e.preventDefault();
            const dx = e.touches[1].clientX - e.touches[0].clientX;
            const dy = e.touches[1].clientY - e.touches[0].clientY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            timelineZoom = Math.max(0.25, Math.min(5.0, pinchStartZoom * (dist / pinchStartDist)));
            timelineScrollX = Math.max(0, (pinchStartScrollX + pinchMidX) * (timelineZoom / pinchStartZoom) - pinchMidX);
            drawTimeline();
            return;
        }
        if (e.touches.length > 1) return;
        e.preventDefault();
        const rect = timelineCanvas.getBoundingClientRect();
        const touch = e.touches[0];
        const pos = {x: touch.clientX - rect.left, y: touch.clientY - rect.top};

        if (timelineTouchStart) {
            const dist = Math.sqrt(Math.pow(pos.x - timelineTouchStart.x, 2) + Math.pow(pos.y - timelineTouchStart.y, 2));
            if (dist > 5) {
                timelineTouchMoved = true;
                if (timelineTouchContextMenuTimer) {
                    clearTimeout(timelineTouchContextMenuTimer);
                    timelineTouchContextMenuTimer = null;
                }
            }
        }

        if (pos.y < 20) return;

        if (isDraggingScrollbar && timelineTotalWidth > timelineCanvas.width) {
            if (pos.x < 0 || pos.x > timelineCanvas.width || pos.y < 0 || pos.y > timelineCanvas.height) {
                isDraggingScrollbar = false;
                return;
            }
            const scrollbarWidth = timelineCanvas.width - 4;
            const deltaX = pos.x - scrollbarDragStartX;
            const scrollRatio = deltaX / scrollbarWidth;
            const deltaScroll = scrollRatio * timelineTotalWidth;
            const newScrollX = scrollbarDragStartScrollX + deltaScroll;
            timelineScrollX = Math.max(0, Math.min(timelineTotalWidth - timelineCanvas.width, newScrollX));
            drawTimeline();
            return;
        }

        if (resizeFrame >= 0) {
            const frame = currentAnimation.getFrame(resizeFrame);
            if (frame) {
                const newDurationUnfiltered = resizeStartDuration + (pos.x - resizeOffset);
                const newDuration = Math.max(50, Math.round(newDurationUnfiltered / 50) * 50);
                if (frame.duration !== newDuration) {
                    frame.duration = newDuration;
                    if (resizeFrame === currentFrame) {
                        document.getElementById("duration").value = frame.duration;
                    }
                    redraw();
                    updateFrameInfo();
                }
            }
            return;
        }

        if (dragFrame >= 0 && !isDraggingFrame) {
            if (Math.abs(pos.x - dragStartX) > dragThreshold) {
                isDraggingFrame = true;
            }
        }

        if (isDraggingFrame && dragFrame >= 0) {
            dragCurrentX = pos.x;
            let targetIndex = dragFrame;
            let x = 2 - timelineScrollX;
            const pixelsPerMs = (window.matchMedia && window.matchMedia("(pointer: coarse)").matches ? 1 : 1.5) * timelineZoom;
            const minFrameWidth = 48 * timelineZoom;
            for (let i = 0; i < currentAnimation.frames.length; i++) {
                const frame = currentAnimation.frames[i];
                const frameWidth = Math.max(frame.duration * pixelsPerMs, minFrameWidth);
                const frameCenter = x + frameWidth / 2;
                if (pos.x < frameCenter) {
                    targetIndex = i;
                    break;
                }
                x += frameWidth;
                if (i === currentAnimation.frames.length - 1) {
                    targetIndex = i + 1;
                }
            }
            drawTimeline();
        }
    }, {passive: false});

    timelineCanvas.addEventListener("touchend", (e) => {
        if (e.touches.length < 2) pinchStartDist = null;
        if (timelineTouchContextMenuTimer) {
            clearTimeout(timelineTouchContextMenuTimer);
            timelineTouchContextMenuTimer = null;
        }

        if (isDraggingScrollbar) {
            isDraggingScrollbar = false;
            scrollbarDragStartX = 0;
            scrollbarDragStartScrollX = 0;
            timelineTouchStart = null;
            timelineTouchMoved = false;
            return;
        }

        if (resizeFrame >= 0) {
            const oldState = serializeAnimationState();
            const newState = serializeAnimationState();
            if (JSON.stringify(oldState) !== JSON.stringify(newState)) {
                addUndoCommand({
                    description: "Change Frame Duration",
                    oldState: oldState,
                    newState: newState,
                    undo: () => restoreAnimationState(oldState),
                    redo: () => restoreAnimationState(newState)
                });
            }
            resizeFrame = -1;
            desiredResizeFrame = -1;
            saveSession();
        }

        if (isDraggingFrame && dragFrame >= 0) {
            const rect = timelineCanvas.getBoundingClientRect();
            const touch = e.changedTouches[0];
            const pos = {x: touch.clientX - rect.left, y: touch.clientY - rect.top};

            let targetIndex = dragFrame;
            let x = 2 - timelineScrollX;
            const pixelsPerMs = (window.matchMedia && window.matchMedia("(pointer: coarse)").matches ? 1 : 1.5) * timelineZoom;
            const minFrameWidth = 48 * timelineZoom;
            for (let i = 0; i < currentAnimation.frames.length; i++) {
                const frame = currentAnimation.frames[i];
                const frameWidth = Math.max(frame.duration * pixelsPerMs, minFrameWidth);
                const frameCenter = x + frameWidth / 2;
                if (pos.x < frameCenter) {
                    targetIndex = i;
                    break;
                }
                x += frameWidth;
                if (i === currentAnimation.frames.length - 1) {
                    targetIndex = i + 1;
                }
            }
            dragTargetIndex = targetIndex;

            if (targetIndex >= 0 && targetIndex <= currentAnimation.frames.length) {
                const oldState = serializeAnimationState();
                const _allSel = new Set(selectedFrames); if (dragFrame >= 0) _allSel.add(dragFrame);
                const multiIndices = [..._allSel].sort((a, b) => a - b);
                if (multiIndices.length > 1) {
                    const beforeCount = multiIndices.filter(idx => idx < targetIndex).length;
                    const extracted = multiIndices.map(idx => currentAnimation.frames[idx]);
                    for (let k = multiIndices.length - 1; k >= 0; k--) currentAnimation.frames.splice(multiIndices[k], 1);
                    const insertAt = Math.max(0, Math.min(targetIndex - beforeCount, currentAnimation.frames.length));
                    currentAnimation.frames.splice(insertAt, 0, ...extracted);
                    const _dfIdx = multiIndices.indexOf(dragFrame); currentFrame = insertAt + (_dfIdx >= 0 ? _dfIdx : 0); dragFrame = currentFrame;
                    selectedFrames = new Set(multiIndices.map((_, k) => insertAt + k));
                } else if (targetIndex !== dragFrame) {
                    const frameToMove = currentAnimation.frames.splice(dragFrame, 1)[0];
                    currentAnimation.frames.splice(targetIndex > dragFrame ? targetIndex - 1 : targetIndex, 0, frameToMove);
                    currentFrame = targetIndex > dragFrame ? targetIndex - 1 : targetIndex; dragFrame = currentFrame;
                    selectedFrames.clear();
                }
                if (getCurrentHistoryLoggingEnabled()) {
                    const newState = serializeAnimationState();
                    addUndoCommand({
                        description: "Reorder Frame",
                        oldState: oldState,
                        newState: newState,
                        undo: () => restoreAnimationState(oldState),
                        redo: () => restoreAnimationState(newState)
                    });
                }
                redraw();
                updateFrameInfo();
                saveSession();
            }
        }

        dragFrame = -1;
        isDraggingFrame = false;
        dragCurrentX = 0;
        dragTargetIndex = -1;
        timelineTouchStart = null;
        timelineTouchMoved = false;
        drawTimeline();
        drawTimeline();
    }, {passive: false});
    timelineCanvas.onmouseup = (e) => {
        if (isDraggingScrollbar) {
            isDraggingScrollbar = false;
            scrollbarDragStartX = 0;
            scrollbarDragStartScrollX = 0;
            return;
        }

        if (resizeFrame >= 0 && e.button === 0) {
            resizeFrame = -1;
            desiredResizeFrame = -1;
        }

        if (isDraggingFrame && dragFrame >= 0 && e.button === 0) {
            const rect = timelineCanvas.getBoundingClientRect();
            const pos = {x: e.clientX - rect.left, y: e.clientY - rect.top};
            dragCurrentX = pos.x;

            let targetIndex = dragFrame;
            let x = 2 - timelineScrollX;
            const pixelsPerMs = (window.matchMedia && window.matchMedia("(pointer: coarse)").matches ? 1 : 1.5) * timelineZoom;
            const minFrameWidth = 48 * timelineZoom;
            for (let i = 0; i < currentAnimation.frames.length; i++) {
                const frame = currentAnimation.frames[i];
                const frameWidth = Math.max(frame.duration * pixelsPerMs, minFrameWidth);
                const frameCenter = x + frameWidth / 2;
                if (pos.x < frameCenter) {
                    targetIndex = i;
                    break;
                }
                x += frameWidth;
                if (i === currentAnimation.frames.length - 1) {
                    targetIndex = i + 1;
                }
            }
            dragTargetIndex = targetIndex;

            if (targetIndex >= 0 && targetIndex <= currentAnimation.frames.length) {
                const oldState = serializeAnimationState();
                const _allSel = new Set(selectedFrames); if (dragFrame >= 0) _allSel.add(dragFrame);
                const multiIndices = [..._allSel].sort((a, b) => a - b);
                if (multiIndices.length > 1) {
                    const beforeCount = multiIndices.filter(idx => idx < targetIndex).length;
                    const extracted = multiIndices.map(idx => currentAnimation.frames[idx]);
                    for (let k = multiIndices.length - 1; k >= 0; k--) currentAnimation.frames.splice(multiIndices[k], 1);
                    const insertAt = Math.max(0, Math.min(targetIndex - beforeCount, currentAnimation.frames.length));
                    currentAnimation.frames.splice(insertAt, 0, ...extracted);
                    const _dfIdx2 = multiIndices.indexOf(dragFrame); currentFrame = insertAt + (_dfIdx2 >= 0 ? _dfIdx2 : 0); dragFrame = currentFrame;
                    selectedFrames = new Set(multiIndices.map((_, k) => insertAt + k));
                } else if (targetIndex !== dragFrame) {
                    const frameToMove = currentAnimation.frames.splice(dragFrame, 1)[0];
                    currentAnimation.frames.splice(targetIndex > dragFrame ? targetIndex - 1 : targetIndex, 0, frameToMove);
                    currentFrame = targetIndex > dragFrame ? targetIndex - 1 : targetIndex; dragFrame = currentFrame;
                    selectedFrames.clear();
                }
                if (getCurrentHistoryLoggingEnabled()) {
                    const newState = serializeAnimationState();
                    addUndoCommand({
                        description: "Reorder Frame",
                        oldState: oldState,
                        newState: newState,
                        undo: () => restoreAnimationState(oldState),
                        redo: () => restoreAnimationState(newState)
                    });
                }
                redraw();
                updateFrameInfo();
            }
        }

        dragFrame = -1;
        isDraggingFrame = false;
        dragCurrentX = 0;
        dragTargetIndex = -1;
        timelineCanvas.style.cursor = "default";
        drawTimeline();
    };

    let isDraggingScrollbar = false;

    timelineCanvas.onwheel = (e) => {
        e.preventDefault();
        if (e.ctrlKey) {
            const factor = e.deltaY < 0 ? 1.15 : 0.87;
            const mouseX = e.offsetX;
            const worldX = mouseX + timelineScrollX;
            timelineZoom = Math.max(0.25, Math.min(5.0, timelineZoom * factor));
            timelineScrollX = Math.max(0, worldX - mouseX);
            drawTimeline();
        } else if (timelineTotalWidth > timelineCanvas.width) {
            timelineScrollX += e.deltaY > 0 ? 50 : -50;
            timelineScrollX = Math.max(0, Math.min(timelineTotalWidth - timelineCanvas.width, timelineScrollX));
            drawTimeline();
        }
    };

    window.addEventListener("keydown", (e) => {
        if (e.ctrlKey && (e.key === "w" || e.key === "W")) e.preventDefault();
    }, true);

    document.addEventListener("keydown", (e) => {
        if (matchesKeybind(e, keybinds.save)) {
            e.preventDefault();
            if (currentAnimation) document.getElementById("btnSave").click();
            return;
        }
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA" || activeElement.tagName === "SELECT" || activeElement.contentEditable === "true")) {
            return;
        }
        if (matchesKeybind(e, keybinds.undo)) {
            e.preventDefault();
            undo();
        } else if (matchesKeybind(e, keybinds.redo) || (e.ctrlKey && e.shiftKey && e.key === "z")) {
            e.preventDefault();
            redo();
        } else if (e.ctrlKey && e.key === "c" && !e.shiftKey && selectedPieces.size > 0 && currentAnimation) {
            e.preventDefault();
            clipboardPieces = Array.from(selectedPieces).map(p => p.duplicate());
        } else if (e.ctrlKey && e.key === "x" && !e.shiftKey && selectedPieces.size > 0 && currentAnimation) {
            e.preventDefault();
            const _frame = currentAnimation.getFrame(currentFrame);
            if (_frame) {
                const _dir = getDirIndex(currentDir);
                const _pieces = _frame.pieces[_dir] || [];
                clipboardPieces = Array.from(selectedPieces).map(p => p.duplicate());
                const _oldState = serializeAnimationState();
                const _cut = Array.from(selectedPieces);
                const _cutNames = _cut.map(p => { if (p.type === "sprite") { const s = currentAnimation.getAniSprite(p.spriteIndex, p.spriteName || ""); return s?.comment ? `"${s.comment}"` : `Sprite ${p.spriteIndex}`; } return "Sound"; }).join(", ");
                for (const p of _cut) { const i = _pieces.indexOf(p); if (i >= 0) _pieces.splice(i, 1); }
                selectedPieces.clear();
                const _newState = serializeAnimationState();
                addUndoCommand({ description: `Cut ${_cutNames}`, oldState: _oldState, newState: _newState, undo: () => restoreAnimationState(_oldState), redo: () => restoreAnimationState(_newState) });
                updateItemsCombo(); updateItemSettings(); redraw(); saveSession();
            }
        } else if (e.ctrlKey && e.key === "v" && !e.shiftKey && clipboardPieces && currentAnimation) {
            e.preventDefault();
            const _frame = currentAnimation.getFrame(currentFrame);
            if (_frame) {
                const _dir = getDirIndex(currentDir);
                if (!_frame.pieces[_dir]) _frame.pieces[_dir] = [];
                const _pieces = _frame.pieces[_dir];
                const _oldState = serializeAnimationState();
                const _pasted = clipboardPieces.map(p => { const d = p.duplicate(); d.xoffset += 8; d.yoffset += 8; return d; });
                const _pasteNames = clipboardPieces.map(p => { if (p.type === "sprite") { const s = currentAnimation.getAniSprite(p.spriteIndex, p.spriteName || ""); return s?.comment ? `"${s.comment}"` : `Sprite ${p.spriteIndex}`; } return "Sound"; }).join(", ");
                _pieces.push(..._pasted);
                selectedPieces.clear();
                for (const p of _pasted) selectedPieces.add(p);
                const _newState = serializeAnimationState();
                addUndoCommand({ description: `Paste ${_pasteNames}`, oldState: _oldState, newState: _newState, undo: () => restoreAnimationState(_oldState), redo: () => restoreAnimationState(_newState) });
                updateItemsCombo(); updateItemSettings(); redraw(); saveSession();
            }
        } else if (matchesKeybind(e, keybinds.resetEditor)) {
            e.preventDefault();
            const settingsReset = document.getElementById("settingsReset");
            if (settingsReset && settingsReset.onclick) {
                settingsReset.onclick({ stopPropagation: () => {} });
            }
        } else if (matchesKeybind(e, keybinds.open)) {
            e.preventDefault();
            const btnOpen = document.getElementById("btnOpen");
            if (btnOpen && btnOpen.onclick) btnOpen.onclick();
        } else if (matchesKeybind(e, keybinds.infoDialog)) {
            e.preventDefault();
            window.openInfoDialog?.("about");
        } else if (matchesKeybind(e, keybinds.settingsDialog)) {
            e.preventDefault();
            const btnSettings = document.getElementById("btnSettings");
            if (btnSettings && btnSettings.onclick) btnSettings.onclick();
        } else if (matchesKeybind(e, keybinds.togglePanels)) {
            e.preventDefault();
            const leftPanel = document.querySelector(".left-panel");
            const rightPanel = document.querySelector(".right-panel");
            const timelineContainer = document.querySelector(".timeline-container");
            const timelineView = document.querySelector(".timeline-view");
            const toolbar = document.querySelector(".toolbar");
            const leftVisible = leftPanel && leftPanel.style.display !== "none" && leftPanel.style.visibility !== "hidden";
            const rightVisible = rightPanel && rightPanel.style.display !== "none" && rightPanel.style.visibility !== "hidden";
            let timelineVisible = localStorage.getItem("timelineVisible");
            if (timelineVisible === null) timelineVisible = "true";
            timelineVisible = timelineVisible !== "false";
            let toolbarVisible = localStorage.getItem("toolbarVisible");
            if (toolbarVisible === null) toolbarVisible = "true";
            toolbarVisible = toolbarVisible !== "false";
            const toolbarDisplay = toolbar && toolbar.style.display !== "none" && toolbar.style.visibility !== "hidden";
            const allVisible = (toolbarDisplay && toolbarVisible) && leftVisible && rightVisible && timelineVisible;
            if (toolbar) {
                if (allVisible) {
                    toolbar.style.setProperty("display", "none", "important");
                    toolbar.style.setProperty("visibility", "hidden", "important");
                    toolbar.style.setProperty("opacity", "0", "important");
                    localStorage.setItem("toolbarVisible", "false");
                } else {
                    toolbar.style.display = "flex";
                    toolbar.style.visibility = "visible";
                    toolbar.style.opacity = "1";
                    localStorage.setItem("toolbarVisible", "true");
                }
            }
            if (leftPanel) {
                if (allVisible) {
                    leftPanel.style.display = "none";
                    leftPanel.style.visibility = "hidden";
                    localStorage.setItem("leftPanelVisible", "false");
                } else {
                    leftPanel.style.display = "flex";
                    leftPanel.style.visibility = "visible";
                    localStorage.setItem("leftPanelVisible", "true");
                }
                resizeCanvas();
            }
            if (rightPanel) {
                if (allVisible) {
                    rightPanel.style.display = "none";
                    rightPanel.style.visibility = "hidden";
                    localStorage.setItem("rightPanelVisible", "false");
                } else {
                    rightPanel.style.display = "flex";
                    rightPanel.style.visibility = "visible";
                    localStorage.setItem("rightPanelVisible", "true");
                }
                resizeCanvas();
            }
            if (timelineContainer) {
                const canvasTimelineSplitter = document.getElementById("canvasTimelineSplitter");
                const mainSplitter = document.getElementById("mainSplitter");
                if (allVisible) {
                    timelineContainer.style.setProperty("display", "none", "important");
                    timelineContainer.style.setProperty("visibility", "hidden", "important");
                    timelineContainer.style.setProperty("opacity", "0", "important");
                    timelineContainer.style.setProperty("flex", "0 0 0px", "important");
                    timelineContainer.style.setProperty("height", "0px", "important");
                    const _tw = timelineContainer.closest(".timeline-wrapper");
                    if (_tw) _tw.style.setProperty("min-height", "0", "important");
                    if (timelineView) {
                        timelineView.style.setProperty("display", "none", "important");
                        timelineView.style.setProperty("visibility", "hidden", "important");
                        timelineView.style.setProperty("opacity", "0", "important");
                    }
                    if (canvasTimelineSplitter) {
                        canvasTimelineSplitter.style.setProperty("display", "none", "important");
                        canvasTimelineSplitter.style.setProperty("visibility", "hidden", "important");
                        canvasTimelineSplitter.style.setProperty("opacity", "0", "important");
                    }
                    if (mainSplitter) {
                        mainSplitter.style.height = "calc(100% - 0px)";
                        mainSplitter.style.maxHeight = "calc(100% - 0px)";
                    }
                    localStorage.setItem("timelineVisible", "false");
                    resizeCanvas();
                } else {
                    timelineContainer.style.display = "flex";
                    timelineContainer.style.visibility = "visible";
                    timelineContainer.style.opacity = "1";
                    timelineContainer.style.removeProperty("flex");
                    timelineContainer.style.removeProperty("height");
                    const _tw = timelineContainer.closest(".timeline-wrapper");
                    if (_tw) _tw.style.removeProperty("min-height");
                    if (timelineView) {
                        timelineView.style.display = "block";
                        timelineView.style.visibility = "visible";
                        timelineView.style.opacity = "1";
                    }
                    if (canvasTimelineSplitter) {
                        canvasTimelineSplitter.style.display = "block";
                        canvasTimelineSplitter.style.visibility = "visible";
                        canvasTimelineSplitter.style.opacity = "1";
                    }
                    if (mainSplitter) {
                        mainSplitter.style.height = "calc(100% - 222px)";
                        mainSplitter.style.maxHeight = "calc(100% - 222px)";
                    }
                    localStorage.setItem("timelineVisible", "true");
                    resizeCanvas();
                    setTimeout(() => drawTimeline(), 100);
                }
            }
        } else if (e.ctrlKey && e.shiftKey && e.key === "R" && currentAnimation && currentAnimation.fullPath) {
            e.preventDefault();
                const fileInput = document.createElement("input");
                fileInput.type = "file";
                fileInput.accept = ".gani";
                fileInput.onchange = async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const text = await file.text();
                    if (/[\x00-\x08\x0e-\x1f]/.test(text.substring(0, 256))) { showAlertDialog(`${file.name} is not a valid plain-text .gani file (may be encrypted or binary).`); return; }
                    f12Log(`Reloading file: ${file.name}`);
                    const ani = parseGani(text);
                    f12Log("Reloaded animation, defaults: " + JSON.stringify(Array.from(ani.defaultImages.entries())));
                    ani.fileName = currentAnimation.fileName;
                    ani.fullPath = currentAnimation.fullPath;
                    const tabIndex = currentTabIndex;
                    animations[tabIndex] = ani;
                    currentAnimation = ani;
                    ensureShadowSprite(ani);
                    updateTabs();
                    updateSpritesList();
                    updateDefaultsTable();
                    updateSoundsList();
                    currentFrame = 0;
                    drawTimeline();
                    updateFrameInfo();
                    redraw();
                    saveSession();
                };
                fileInput.click();
        } else if (e.ctrlKey && e.shiftKey && e.key === "R" && currentAnimation && currentAnimation.fileName) {
            e.preventDefault();
                const fileInput = document.getElementById("fileInput");
                if (fileInput) {
                    fileInput.click();
            }
        } else if (matchesKeybind(e, keybinds.deselect)) {
            e.preventDefault();
            selectedPieces.clear();
            editingSprite = null;
            const combo = document.getElementById("itemsCombo");
            if (combo) combo.value = "";
            updateItemsCombo();
            updateItemSettings();
            updateSpritesList();
            redraw();
        } else if ((matchesKeybind(e, keybinds.deletePiece) || e.key === "Backspace") && selectedPieces.size > 0 && !e.ctrlKey && !e.altKey) {
            e.preventDefault();
            const frame = currentAnimation.getFrame(currentFrame);
            if (frame) {
                const actualDir = getDirIndex(currentDir);
                const pieces = frame.pieces[actualDir] || [];
                const oldState = serializeAnimationState();
                const deletedPieces = Array.from(selectedPieces);
                const deletedNames = deletedPieces.map(p => {
                    if (p.type === "sprite" && currentAnimation) {
                        const sprite = currentAnimation.getAniSprite(p.spriteIndex, p.spriteName || "");
                        if (sprite && sprite.comment) {
                            return `"${sprite.comment}"`;
                        }
                        return `Sprite ${p.spriteIndex}`;
                    }
                    return "Sound";
                }).join(", ");
                for (const piece of deletedPieces) {
                    const index = pieces.indexOf(piece);
                    if (index >= 0) {
                        pieces.splice(index, 1);
                    }
                }
                selectedPieces.clear();
                const newState = serializeAnimationState();
                addUndoCommand({
                    description: `Delete Piece${deletedPieces.length > 1 ? 's' : ''} (${deletedNames})`,
                    oldState: oldState,
                    newState: newState,
                    undo: () => restoreAnimationState(oldState),
                    redo: () => restoreAnimationState(newState)
                });
                updateItemsCombo();
                updateItemSettings();
                redraw();
                saveSession();
            }
        } else if (matchesKeybind(e, keybinds.cycleSprite, {ignoreShift: true})) {
            e.preventDefault();
            if (!currentAnimation) return;
            const frame = currentAnimation.getFrame(currentFrame);
            if (frame) {
                const actualDir = getDirIndex(currentDir);
                const allPieces = [...frame.pieces[actualDir], ...frame.sounds];
                if (allPieces.length > 0) {
                    let currentIndex = -1;
                    if (selectedPieces.size >= 1) currentIndex = allPieces.indexOf([...selectedPieces].pop());
                    const nextIndex = (currentIndex + 1) % allPieces.length;
                    if (!e.shiftKey) selectedPieces.clear();
                    selectedPieces.add(allPieces[nextIndex]);
                    updateItemsCombo();
                    redraw();
                }
            }
        } else if (matchesKeybind(e, keybinds.selectAll) && currentAnimation) {
            e.preventDefault();
            const frame = currentAnimation.getFrame(currentFrame);
            if (frame) {
                const actualDir = getDirIndex(currentDir);
                selectedPieces.clear();
                for (const p of (frame.pieces[actualDir] || [])) selectedPieces.add(p);
                updateItemsCombo();
                redraw();
            }
        } else if (matchesKeybind(e, keybinds.layerUp) && currentAnimation) {
            e.preventDefault();
            document.getElementById("btnItemLayerUp").click();
        } else if (matchesKeybind(e, keybinds.layerDown) && currentAnimation) {
            e.preventDefault();
            document.getElementById("btnItemLayerDown").click();
        } else if ((matchesKeybind(e, keybinds.prevFrame) || matchesKeybind(e, keybinds.nextFrame)) && currentAnimation) {
            e.preventDefault();
            const dir = matchesKeybind(e, keybinds.prevFrame) ? -1 : 1;
            const newFrame = Math.max(0, Math.min(currentAnimation.frames.length - 1, currentFrame + dir));
            if (newFrame !== currentFrame) {
                const actualDir = getDirIndex(currentDir);
                const oldPieces = (currentAnimation.getFrame(currentFrame)?.pieces[actualDir]) || [];
                const prevSelected = Array.from(selectedPieces).filter(p => p.type === "sprite").map(p => ({ spriteIndex: p.spriteIndex, spriteName: p.spriteName || "", arrayIndex: oldPieces.indexOf(p) }));
                currentFrame = newFrame;
                saveCurrentFrame();
                selectedPieces.clear();
                if (prevSelected.length > 0) {
                    const newPieces = (currentAnimation.getFrame(currentFrame)?.pieces[actualDir]) || [];
                    for (const sel of prevSelected) {
                        const piece = sel.arrayIndex >= 0 ? newPieces[sel.arrayIndex] : null;
                        if (piece?.type === "sprite" && piece.spriteIndex === sel.spriteIndex && (piece.spriteName || "") === sel.spriteName) selectedPieces.add(piece);
                    }
                }
                redraw();
                updateFrameInfo();
                const slider = document.getElementById("timelineSlider");
                if (slider) slider.value = currentFrame;
            }
        } else if (matchesKeybind(e, keybinds.zoomIn) || e.key === "=") {
            const oldZoom = zoomFactors[zoomLevel] || 1.0;
            zoomLevel++;
            if (zoomLevel >= zoomFactors.length) zoomLevel = zoomFactors.length - 1;
            const newZoom = zoomFactors[zoomLevel] || 1.0;
            panX *= newZoom / oldZoom;
            panY *= newZoom / oldZoom;
            localStorage.setItem("mainCanvasZoom", zoomLevel);
            updateMainCanvasZoomDisplay();
            redraw();
        } else if (matchesKeybind(e, keybinds.zoomOut) || e.key === "_") {
            const oldZoom = zoomFactors[zoomLevel] || 1.0;
            zoomLevel--;
            if (zoomLevel < 0) zoomLevel = 0;
            const newZoom = zoomFactors[zoomLevel] || 1.0;
            panX *= newZoom / oldZoom;
            panY *= newZoom / oldZoom;
            localStorage.setItem("mainCanvasZoom", zoomLevel);
            updateMainCanvasZoomDisplay();
            redraw();
        } else if (matchesKeybind(e, keybinds.play)) {
            e.preventDefault();
            document.getElementById("btnPlay").click();
        } else if (!currentAnimation) {
            return;
        } else if (keysSwapped) {
            if (e.key === "ArrowUp") {
                e.preventDefault();
                if (currentDir !== 0) {
                    document.getElementById("directionCombo").value = "UP";
                    document.getElementById("directionCombo").dispatchEvent(new Event("change"));
                }
            } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                if (currentDir !== 1) {
                    document.getElementById("directionCombo").value = "LEFT";
                    document.getElementById("directionCombo").dispatchEvent(new Event("change"));
                }
            } else if (e.key === "ArrowDown") {
                e.preventDefault();
                if (currentDir !== 2) {
                    document.getElementById("directionCombo").value = "DOWN";
                    document.getElementById("directionCombo").dispatchEvent(new Event("change"));
                }
            } else if (e.key === "ArrowRight") {
                e.preventDefault();
                if (currentDir !== 3) {
                    document.getElementById("directionCombo").value = "RIGHT";
                    document.getElementById("directionCombo").dispatchEvent(new Event("change"));
                }
            } else if (e.key === "w" || e.key === "W") {
                e.preventDefault();
                moveSelectedPieces(0, -1);
            } else if (e.key === "a" || e.key === "A") {
                e.preventDefault();
                moveSelectedPieces(-1, 0);
            } else if (e.key === "s" || e.key === "S") {
                e.preventDefault();
                moveSelectedPieces(0, 1);
            } else if (e.key === "d" || e.key === "D") {
                e.preventDefault();
                moveSelectedPieces(1, 0);
            }
        } else {
            if (e.key === "w" || e.key === "W") {
                e.preventDefault();
                if (currentDir !== 0) {
                    document.getElementById("directionCombo").value = "UP";
                    document.getElementById("directionCombo").dispatchEvent(new Event("change"));
                }
            } else if (e.key === "a" || e.key === "A") {
                e.preventDefault();
                if (currentDir !== 1) {
                    document.getElementById("directionCombo").value = "LEFT";
                    document.getElementById("directionCombo").dispatchEvent(new Event("change"));
                }
            } else if (e.key === "s" || e.key === "S") {
                e.preventDefault();
                if (currentDir !== 2) {
                    document.getElementById("directionCombo").value = "DOWN";
                    document.getElementById("directionCombo").dispatchEvent(new Event("change"));
                }
            } else if (e.key === "d" || e.key === "D") {
                e.preventDefault();
                if (currentDir !== 3) {
                    document.getElementById("directionCombo").value = "RIGHT";
                    document.getElementById("directionCombo").dispatchEvent(new Event("change"));
                }
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                moveSelectedPieces(0, -1);
            } else if (e.key === "ArrowDown") {
                e.preventDefault();
                moveSelectedPieces(0, 1);
            } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                moveSelectedPieces(-1, 0);
            } else if (e.key === "ArrowRight") {
                e.preventDefault();
                moveSelectedPieces(1, 0);
            }
        }
    });
    pixelGridEnabled = localStorage.getItem("editorPixelGrid") === "true";
    document.getElementById("btnPixelGrid").classList.toggle("active", pixelGridEnabled);
    document.getElementById("btnPixelGrid").onclick = () => {
        pixelGridEnabled = !pixelGridEnabled;
        localStorage.setItem("editorPixelGrid", pixelGridEnabled ? "true" : "false");
        document.getElementById("btnPixelGrid").classList.toggle("active", pixelGridEnabled);
        redraw();
    };
    document.getElementById("btnCenterView").onclick = () => {
        panX = 0;
        panY = 0;
        redraw();
    };
    const updateMainCanvasZoomDisplay = () => {
        const zoomFactor = zoomFactors[zoomLevel] || 1.0;
        const zoomDisplay = document.getElementById("mainCanvasZoomLevel");
        if (zoomDisplay) zoomDisplay.textContent = zoomFactor.toFixed(1) + "x";
    };
    document.getElementById("btnZoomOut").onclick = () => {
        const oldZoom = zoomFactors[zoomLevel] || 1.0;
        zoomLevel--;
        if (zoomLevel < 0) zoomLevel = 0;
        const newZoom = zoomFactors[zoomLevel] || 1.0;
        panX *= newZoom / oldZoom;
        panY *= newZoom / oldZoom;
        localStorage.setItem("mainCanvasZoom", zoomLevel);
        updateMainCanvasZoomDisplay();
        redraw();
    };
    document.getElementById("btnZoomIn").onclick = () => {
        const oldZoom = zoomFactors[zoomLevel] || 1.0;
        zoomLevel++;
        if (zoomLevel >= zoomFactors.length) zoomLevel = zoomFactors.length - 1;
        const newZoom = zoomFactors[zoomLevel] || 1.0;
        panX *= newZoom / oldZoom;
        panY *= newZoom / oldZoom;
        localStorage.setItem("mainCanvasZoom", zoomLevel);
        updateMainCanvasZoomDisplay();
        redraw();
    };
    updateMainCanvasZoomDisplay();
    const singleDirCheckbox = document.getElementById("singleDirCheckbox");
    if (singleDirCheckbox) {
        singleDirCheckbox.onclick = () => {
            currentAnimation.singleDir = !currentAnimation.singleDir;
            singleDirCheckbox.textContent = currentAnimation.singleDir ? "✓" : " ";
            if (currentAnimation.singleDir) {
                currentDir = 0;
                splitViewEnabled = false;
                localStorage.setItem("ganiEditorSplitView", "false");
                const btnSplitView = document.getElementById("btnSplitView");
                if (btnSplitView) {
                    btnSplitView.classList.remove("active");
                    btnSplitView.disabled = true;
                }
            } else {
                const btnSplitView = document.getElementById("btnSplitView");
                if (btnSplitView) btnSplitView.disabled = false;
            }
            redraw();
            updateItemsCombo();
            saveSession();
        };
    }
    const loopedCheckbox = document.getElementById("loopedCheckbox");
    if (loopedCheckbox) {
        loopedCheckbox.onclick = () => {
            currentAnimation.looped = !currentAnimation.looped;
            loopedCheckbox.textContent = currentAnimation.looped ? "✓" : " ";
            saveSession(); if (connections.length) broadcastTabs();
        };
    }
    const continousCheckbox = document.getElementById("continousCheckbox");
    if (continousCheckbox) {
        continousCheckbox.onclick = () => {
            currentAnimation.continous = !currentAnimation.continous;
            continousCheckbox.textContent = currentAnimation.continous ? "✓" : " ";
            saveSession();
        };
    }
    document.getElementById("nextAni").onchange = (e) => {
        currentAnimation.nextAni = e.target.value;
        saveSession();
    };
    document.getElementById("btnAddSound").onclick = () => {
        const frame = currentAnimation.getFrame(currentFrame);
        if (frame) {
            const oldState = serializeAnimationState();
            const sound = new FramePieceSound();
            sound.fileName = "new";
            sound.xoffset = 24;
            sound.yoffset = 32;
            frame.sounds.push(sound);
            const newState = serializeAnimationState();
            addUndoCommand({
                description: "Add Sound",
                oldState: oldState,
                newState: newState,
                undo: () => restoreAnimationState(oldState),
                redo: () => restoreAnimationState(newState)
            });
            updateSoundsList();
            redraw();
            saveSession();
        }
    };
    document.getElementById("btnDeleteSound").onclick = () => {
        const frame = currentAnimation.getFrame(currentFrame);
        if (!frame || frame.sounds.length === 0) return;
        const oldState = serializeAnimationState();
        frame.sounds.pop();
        const newState = serializeAnimationState();
        addUndoCommand({
            description: "Delete Sound",
            oldState: oldState,
            newState: newState,
            undo: () => restoreAnimationState(oldState),
            redo: () => restoreAnimationState(newState)
        });
        updateSoundsList();
        redraw();
        saveSession();
    };
    document.getElementById("btnLoadSounds").onclick = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".wav,.mp3,.ogg,.m4a";
        input.multiple = true;
        input.onchange = async (e) => {
            const files = Array.from(e.target.files);
            let loadedCount = 0;
            const promises = [];
            for (const file of files) {
                const key = file.name.toLowerCase();
                const promise = new Promise((resolve) => {
                    try {
                        const audio = new Audio();
                        const url = URL.createObjectURL(file);
                        audio.src = url;
                        audio.oncanplaythrough = () => {
                            soundLibrary.set(key, audio);
                            loadedCount++;
                            resolve();
                        };
                        audio.onloadeddata = () => {
                            if (!soundLibrary.has(key)) {
                                soundLibrary.set(key, audio);
                                loadedCount++;
                            }
                            resolve();
                        };
                        audio.onerror = () => {
                            URL.revokeObjectURL(url);
                            resolve();
                        };
                        audio.load();
                    } catch (err) {
                        console.error(`Failed to load sound ${file.name}:`, err);
                        resolve();
                    }
                });
                promises.push(promise);
            }
            await Promise.all(promises);
            if (DEBUG_MODE) f12Log(`Imported ${loadedCount} sound files`);
        };
        input.click();
    };
    document.getElementById("btnWorkingDir").onclick = async () => {
        if (_isTauri) {
            const selected = await tauriOpenDialog({ directory: true, multiple: false, title: "Select Working Directory" });
            if (selected) await loadWorkspaceFromDisk(selected);
            return;
        }
        const folderInput = document.getElementById("folderInput");
        folderInput.click();
    };
    document.getElementById("imageInput").onchange = async (e) => {
        for (const file of Array.from(e.target.files)) {
            await loadImage(file);
        }
        redraw();
        drawSpritePreview();
    };
    document.getElementById("folderInput").onchange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        const firstFile = files[0];
        if (firstFile.webkitRelativePath) {
            const pathParts = firstFile.webkitRelativePath.split("/");
            if (pathParts.length > 1) {
                workingDirectory = pathParts[0];
                lastWorkingDirectory = workingDirectory;
                localStorage.setItem("ganiEditorLastWorkingDir", lastWorkingDirectory);
            }
        }
        const imageFiles = files.filter(f => f.type.startsWith("image/") || f.name.toLowerCase().endsWith('.mng'));
        const ganiFiles = files.filter(f => f.name.toLowerCase().endsWith('.gani'));
        const soundFiles = files.filter(f => /\.(wav|mp3|ogg|mid|midi)$/i.test(f.name));
        localFileCache.ganis = ganiFiles.map(f => f.webkitRelativePath || f.name);
        localFileCache.sounds = soundFiles.map(f => f.webkitRelativePath || f.name);
        localFileCache.ganiFiles = ganiFiles;
        imageFiles.forEach(f => workspaceImageKeys.add(f.name.toLowerCase()));
        const totalFiles = imageFiles.length;
        let loading = null;
        if (totalFiles > 0) loading = showLoadingMessage("Loading workspace... 0%");
        let loadedCount = 0;
        const BATCH = 20;
        for (let i = 0; i < imageFiles.length; i += BATCH) {
            const batch = imageFiles.slice(i, i + BATCH);
            await Promise.all(batch.map(async file => {
                try { await loadImage(file); } catch (err) { console.error(`Failed to load ${file.name}:`, err); }
                loadedCount++;
                if (loading) loading.update(`Loading workspace... ${Math.round((loadedCount / totalFiles) * 100)}%`);
            }));
        }
        if (loading) loading.close();
        if (DEBUG_MODE) f12Log(`Loaded ${loadedCount} images from workspace`);
        refreshAllAnimationsSprites();
        drawSpritePreview();
        updateSpritesList();
        saveSession();
        redraw();
    };
    document.getElementById("btnImportSprites").onclick = async () => {
        if (_isTauri) {
            const selected = await tauriOpenDialog({ multiple: false, filters: [{ name: 'Gani Files', extensions: ['gani'] }] });
            if (!selected) return;
            const text = await tauriReadTextFile(selected);
            const fname = selected.split(/[\\/]/).pop();
            if (/[\x00-\x08\x0e-\x1f]/.test(text.substring(0, 256))) { showAlertDialog(`${fname} is not a valid plain-text .gani file`); return; }
            await doImportSprites(text, fname);
            return;
        }
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".gani";
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                const text = await file.text();
                if (/[\x00-\x08\x0e-\x1f]/.test(text.substring(0, 256))) { showAlertDialog(`${file.name} is not a valid plain-text .gani file (may be encrypted or binary).`); return; }
                await doImportSprites(text, file.name);
            } catch (err) {
                console.error("Import error:", err);
                showAlertDialog("Failed to import sprites: " + err.message);
            }
        };
        input.click();
    };
    async function doImportSprites(text, fileName) {
        try {
                const importAni = parseGani(text);
                if (!importAni || importAni.sprites.size === 0) {
                    showAlertDialog("No sprites found in .gani file");
                    return;
                }
                for (const [key, value] of importAni.defaultImages) {
                    if (!currentAnimation.getDefaultImageName(key)) {
                        currentAnimation.setDefaultImage(key, value);
                    }
                }
                const oldState = serializeAnimationState();
                let existsOptionAll = null;
                let importedCount = 0;
                for (const sprite of importAni.sprites.values()) {
                    let spriteIndex = sprite.index;
                    let existsOption = existsOptionAll;
                    if (currentAnimation.sprites.has(spriteIndex)) {
                        if (existsOptionAll === null) {
                            showConfirmDialog("This sprite index is already being used.\n\nClick OK to skip this sprite, or Cancel to assign a new index.\n\nApply to all occurrences?", (applyAll) => {
                                existsOption = applyAll ? "skip" : "new";
                                if (applyAll) existsOptionAll = existsOption;
                            });
                        }
                        if (existsOption === "skip") continue;
                        if (existsOption === "new") spriteIndex = currentAnimation.nextSpriteIndex++;
                    }
                    const newSprite = new AniSprite();
                    newSprite.index = spriteIndex;
                    newSprite.comment = sprite.comment || "Imported Sprite";
                    newSprite.type = sprite.type || "CUSTOM";
                    newSprite.customImageName = sprite.customImageName || "";
                    newSprite.left = sprite.left || 0;
                    newSprite.top = sprite.top || 0;
                    newSprite.width = sprite.width || 32;
                    newSprite.height = sprite.height || 32;
                    newSprite.rotation = sprite.rotation || 0.0;
                    newSprite.xscale = sprite.xscale || 1.0;
                    newSprite.yscale = sprite.yscale || 1.0;
                    newSprite.colorEffectEnabled = sprite.colorEffectEnabled || false;
                    newSprite.colorEffect = sprite.colorEffect ? {...sprite.colorEffect} : {r: 255, g: 255, b: 255, a: 255};
                    newSprite.m_drawIndex = sprite.m_drawIndex || 0;
                    newSprite.attachedSprites = (sprite.attachedSprites || []).map(a => ({
                        index: a.index || a,
                        offset: a.offset ? {...a.offset} : (a.x !== undefined ? {x: a.x, y: a.y} : {x: 0, y: 0})
                    }));
                    newSprite.updateBoundingBox();
                    currentAnimation.addSprite(newSprite);
                    importedCount++;
                }
                if (importedCount > 0) {
                    const newState = serializeAnimationState();
                    addUndoCommand({
                        description: `Import ${importedCount} Sprite${importedCount > 1 ? 's' : ''}`,
                        oldState,
                        newState,
                        undo: () => restoreAnimationState(oldState),
                        redo: () => restoreAnimationState(newState)
                    });
                }
                updateSpritesList();
                updateDefaultsTable();
                redraw();
                showAlertDialog(`Imported ${importedCount} sprite(s)`);
            } catch (err) {
                console.error("Import error:", err);
                showAlertDialog("Failed to import sprites: " + err.message);
            }
    }
    document.getElementById("btnCopySprite").onclick = () => {
        if (!editingSprite) return;
        const data = {
            type: "sprite",
            spriteType: editingSprite.type,
            image: editingSprite.customImageName,
            left: editingSprite.left,
            top: editingSprite.top,
            width: editingSprite.width,
            height: editingSprite.height,
            rotation: editingSprite.rotation,
            xscale: editingSprite.xscale,
            yscale: editingSprite.yscale,
            colorEffect: editingSprite.colorEffectEnabled ? `rgba(${editingSprite.colorEffect.r},${editingSprite.colorEffect.g},${editingSprite.colorEffect.b},${editingSprite.colorEffect.a})` : "",
            comment: editingSprite.comment,
            attachments: editingSprite.attachedSprites.map(a => ({index: a.index, x: a.offset.x, y: a.offset.y}))
        };
        _spriteClipboard = data;
        if (navigator.clipboard) navigator.clipboard.writeText(JSON.stringify(data)).catch(() => {});
    };
    document.getElementById("btnPasteSprite").onclick = async () => {
        try {
            let data = _spriteClipboard;
            if (!data && navigator.clipboard) { try { data = JSON.parse(await navigator.clipboard.readText()); } catch {} }
            if (!data) return;
            if (Array.isArray(data)) data = data[0];
            if (!data || data.type !== "sprite") return;
            const sprite = new AniSprite();
            sprite.index = currentAnimation.nextSpriteIndex++;
            sprite.type = data.spriteType || "CUSTOM";
            sprite.customImageName = data.image || "";
            sprite.left = data.left || 0;
            sprite.top = data.top || 0;
            sprite.width = data.width || 32;
            sprite.height = data.height || 32;
            sprite.rotation = data.rotation || 0;
            sprite.xscale = data.xscale || 1.0;
            sprite.yscale = data.yscale || 1.0;
            sprite.colorEffectEnabled = !!data.colorEffect;
            if (data.colorEffect) {
                const match = data.colorEffect.match(/rgba?\((\d+),(\d+),(\d+),?(\d*\.?\d*)?\)/);
                if (match) {
                    sprite.colorEffect = {r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]), a: match[4] ? Math.floor(parseFloat(match[4]) * 255) : 255};
                }
            }
            sprite.comment = data.comment || "New Sprite";
            sprite.m_drawIndex = data.attachments ? data.attachments.filter((a, i) => i < (data.drawIndex || 0)).length : 0;
            if (data.attachments) {
                sprite.attachedSprites = data.attachments.map(a => ({index: a.index, offset: {x: a.x || 0, y: a.y || 0}}));
            }
            sprite.updateBoundingBox();
            currentAnimation.addSprite(sprite);
            selectSprite(sprite);
            updateSpritesList();
            saveSession();
        } catch (e) {
            console.error("Failed to paste sprite:", e);
        }
    };
    document.getElementById("btnDeleteSprite").onclick = () => {
        if (selectedSpritesForDeletion.size > 0) {
            showConfirmDialog(`Delete ${selectedSpritesForDeletion.size} sprite${selectedSpritesForDeletion.size > 1 ? 's' : ''}?`, (confirmed) => {
                if (confirmed) {
                    const oldState = serializeAnimationState();
                    const deletedIndices = Array.from(selectedSpritesForDeletion).map(s => s.index);
                    for (const spriteToDelete of selectedSpritesForDeletion) {
                        currentAnimation.sprites.delete(spriteToDelete.index);
                    }
                    for (const frame of currentAnimation.frames) {
                        for (const dirPieces of frame.pieces) {
                            for (let i = dirPieces.length - 1; i >= 0; i--) {
                                const piece = dirPieces[i];
                                if (piece.type === "sprite" && deletedIndices.includes(piece.spriteIndex)) {
                                    dirPieces.splice(i, 1);
                                }
                            }
                        }
                    }
                    editingSprite = null;
                    selectedSpritesForDeletion.clear();
                    const newState = serializeAnimationState();
                    addUndoCommand({
                        description: `Delete ${deletedIndices.length} Sprite${deletedIndices.length > 1 ? 's' : ''}`,
                        oldState: oldState,
                        newState: newState,
                        undo: () => {
                            restoreAnimationState(oldState);
                        },
                        redo: () => {
                            restoreAnimationState(newState);
                        }
                    });
                    updateSpritesList();
                    updateSpriteEditor();
                    redraw();
                    saveSession();
                }
            });
        } else {
            if (!editingSprite) return;
            showConfirmDialog(`Delete sprite ${editingSprite.index}?`, (confirmed) => {
                if (confirmed) {
                    const oldState = serializeAnimationState();
                    const deletedIndex = editingSprite.index;
                    currentAnimation.sprites.delete(deletedIndex);
                    for (const frame of currentAnimation.frames) {
                        for (const dirPieces of frame.pieces) {
                            for (let i = dirPieces.length - 1; i >= 0; i--) {
                                const piece = dirPieces[i];
                                if (piece.type === "sprite" && piece.spriteIndex === deletedIndex) {
                                    dirPieces.splice(i, 1);
                                }
                            }
                        }
                    }
                    const nextSprite = Array.from(currentAnimation.sprites.values())[0] || null;
                    editingSprite = nextSprite;
                    const newState = serializeAnimationState();
                    addUndoCommand({
                        description: (() => {
                            const sprite = currentAnimation ? currentAnimation.getAniSprite(deletedIndex, "") : null;
                            const spriteName = sprite && sprite.comment ? `"${sprite.comment}"` : `Sprite ${deletedIndex}`;
                            return `Delete ${spriteName}`;
                        })(),
                        oldState: oldState,
                        newState: newState,
                        undo: () => {
                            restoreAnimationState(oldState);
                            editingSprite = currentAnimation.getAniSprite(deletedIndex, "");
                            updateSpriteEditor();
                        },
                        redo: () => {
                            restoreAnimationState(newState);
                            editingSprite = nextSprite;
                            updateSpriteEditor();
                        }
                    });
                    updateSpritesList();
                    updateSpriteEditor();
                    redraw();
                    saveSession();
                }
            });
        }
    };
    document.getElementById("btnBrowseWorkspace").onclick = () => showWorkspaceBrowserDialog();
    const tabCont = document.getElementById("tabsContainer");
    document.getElementById("tabScrollLeft").onclick = () => { tabCont.scrollLeft -= tabCont.clientWidth * 0.8; };
    document.getElementById("tabScrollRight").onclick = () => { tabCont.scrollLeft += tabCont.clientWidth * 0.8; };
    tabCont.addEventListener("scroll", updateTabScrollButtons);
    new ResizeObserver(updateTabScrollButtons).observe(tabCont);
    const btnDuplicateSprite = document.getElementById("btnDuplicateSprite");
    if (btnDuplicateSprite) {
        btnDuplicateSprite.onclick = () => {
            if (!editingSprite) return;
            const newSprite = editingSprite.duplicate(currentAnimation.nextSpriteIndex++);
            currentAnimation.addSprite(newSprite);
            selectSprite(newSprite);
            updateSpritesList();
            redraw();
        };
    }
    const bgColorInput = document.createElement("input");
    bgColorInput.id = "bgColorInput";
    bgColorInput.type = "color";
    bgColorInput.value = backgroundColor;
    bgColorInput.style.width = "60px";
    bgColorInput.style.height = "35px";
    bgColorInput.style.border = "1px solid #0a0a0a";
    bgColorInput.style.borderTop = "1px solid #404040";
    bgColorInput.style.borderLeft = "1px solid #404040";
    bgColorInput.style.cursor = "pointer";
    bgColorInput.style.flexShrink = "0";
    bgColorInput.style.padding = "0";
    bgColorInput.style.boxShadow = "inset 0 1px 0 rgba(0, 0, 0, 0.3)";
    bgColorInput.onchange = (e) => {
        backgroundColor = e.target.value;
        redraw();
        saveSession();
    };
    function applyColorScheme(scheme) {
        if (scheme === "default") {
            const oldStyle = document.getElementById("colorSchemeStyle");
            if (oldStyle) oldStyle.remove();
            document.body.style.background = "";
            document.body.style.color = "";
            const _tb = document.getElementById('tauriBar'); if (_tb) { _tb.style.background = ''; _tb.style.borderColor = ''; }
            ["--timeline-frame-bg","--timeline-frame-selected-bg","--timeline-frame-multi-bg","--quadrant-divider","--timeline-ruler-bg","--timeline-ruler-tick","--timeline-ruler-text"].forEach(v => document.documentElement.style.removeProperty(v));
            const settingsDialog = document.getElementById("settingsDialog");
            const aboutDialog = document.getElementById("infoDialog");
            if (settingsDialog) {
                const settingsContent = settingsDialog.querySelector(".dialog-content");
                if (settingsContent) {
                    settingsContent.style.background = "#2b2b2b";
                    settingsContent.style.borderColor = "#1a1a1a";
                    settingsContent.style.color = "";
                    const h3 = settingsContent.querySelector("h3");
                    if (h3) {
                        h3.style.color = "";
                        h3.style.borderColor = "";
                    }
                    const labels = settingsContent.querySelectorAll("label");
                    labels.forEach(label => label.style.color = "");
                    const buttons = settingsContent.querySelectorAll("button");
                    buttons.forEach(btn => {
                        btn.style.background = "#1a1a1a";
                        btn.style.color = "#ffffff";
                        btn.style.borderColor = "#0a0a0a";
                    });
                    const selects = settingsContent.querySelectorAll("select");
                    selects.forEach(sel => {
                        sel.style.background = "";
                        sel.style.color = "";
                        sel.style.borderColor = "";
                    });
                    const inputs = settingsContent.querySelectorAll("input");
                    inputs.forEach(inp => {
                        if (inp.type !== "checkbox" && inp.type !== "range") {
                            inp.style.background = "";
                            inp.style.color = "";
                            inp.style.borderColor = "";
                        }
                    });
                }
            }
            if (aboutDialog) {
                const aboutContent = aboutDialog.querySelector(".dialog-content");
                if (aboutContent) {
                    aboutContent.style.background = "#2b2b2b";
                    aboutContent.style.borderColor = "#1a1a1a";
                    aboutContent.style.color = "";
                    const h3 = aboutContent.querySelector("h3");
                    if (h3) {
                        h3.style.color = "";
                        h3.style.borderColor = "";
                    }
                    const paragraphs = aboutContent.querySelectorAll("p");
                    paragraphs.forEach(p => {
                        p.style.color = "";
                        p.style.borderColor = "";
                    });
                    const spans = aboutContent.querySelectorAll("span");
                    spans.forEach(span => span.style.color = "");
                    const divs = aboutContent.querySelectorAll("div");
                    divs.forEach(div => {
                        if (div.style.color && div.style.color !== "transparent") div.style.color = "";
                        if (div.style.borderColor) div.style.borderColor = "";
                    });
                    const links = aboutContent.querySelectorAll("a");
                    links.forEach(a => a.style.color = "#4a9eff");
                    const buttons = aboutContent.querySelectorAll("button");
                    buttons.forEach(btn => {
                        btn.style.background = "#1a1a1a";
                        btn.style.color = "#ffffff";
                        btn.style.borderColor = "#0a0a0a";
                    });
                }
            }
            const colorSchemeDropdown = document.getElementById("colorSchemeDropdown");
            if (colorSchemeDropdown) {
                colorSchemeDropdown.style.background = "#2b2b2b";
                colorSchemeDropdown.style.borderColor = "#0a0a0a";
                const schemeItems = colorSchemeDropdown.querySelectorAll(".color-scheme-item");
                schemeItems.forEach(item => {
                    item.style.color = "#e0e0e0";
                    item.style.borderColor = "#0a0a0a";
                });
            }
            const timelineCanvas = document.getElementById("timelineCanvas");
            if (timelineCanvas) {
                timelineCanvas.style.background = "";
            }
            localStorage.setItem("editorColorScheme", scheme);
            return;
        }
        const schemes = {
            "fusion-light": {
                bg: "#f5f5f5", panel: "#ffffff", border: "#d0d0d0", text: "#1a1a1a", hover: "#e8e8e8",
                button: "#ffffff", buttonText: "#1a1a1a", buttonHover: "#f0f0f0", tabActive: "#ffffff", inputBg: "#ffffff",
                frameBg: "#c8a0a0", frameSelected: "#90c090", frameMulti: "#90a8c0", divider: "#d0d0d0"
            },
            "fusion-dark": {
                bg: "#1e1e1e", panel: "#2d2d2d", border: "#0f0f0f", text: "#e8e8e8", hover: "#3d3d3d",
                frameBg: "#5a2020", frameSelected: "#1a4a1a", frameMulti: "#1a2a4a", divider: "#0f0f0f"
            },
            "dark-style": {
                bg: "#1e1e1e", panel: "#252525", border: "#3c3c3c", text: "#cccccc", hover: "#3e3e3e",
                frameBg: "#5a2020", frameSelected: "#1a4a1a", frameMulti: "#1a2a4a", divider: "#3c3c3c"
            },
            "dark-orange": {
                bg: "#2a1f1a", panel: "#3a2f2a", border: "#1a0f0a", text: "#ffaa55", hover: "#4a3f3a",
                frameBg: "#4a2a10", frameSelected: "#2a3a10", frameMulti: "#102a3a", divider: "#2a1a0a"
            },
            "aqua": {
                bg: "#0a1a1f", panel: "#1a2a2f", border: "#0a0a0a", text: "#55ffff", hover: "#2a3a3f",
                frameBg: "#1a3535", frameSelected: "#0a2a1a", frameMulti: "#0a1a38", divider: "#0a1a20"
            },
            "elegant-dark": {
                bg: "#1a1a1a", panel: "#2d2d2d", border: "#404040", text: "#e8e8e8", hover: "#3d3d3d",
                frameBg: "#5a2020", frameSelected: "#1a4a1a", frameMulti: "#1a2a4a", divider: "#404040"
            },
            "material-dark": {
                bg: "#121212", panel: "#1e1e1e", border: "#333333", text: "#ffffff", hover: "#2e2e2e",
                frameBg: "#3a1010", frameSelected: "#103a10", frameMulti: "#10203a", divider: "#333333"
            },
            "light-style": {
                bg: "#ffffff", panel: "#ffffff", border: "#e0e0e0", text: "#000000", hover: "#f5f5f5",
                button: "#ffffff", buttonText: "#000000", buttonHover: "#f0f0f0", tabActive: "#ffffff", inputBg: "#ffffff",
                frameBg: "#e0b0b0", frameSelected: "#b0d0b0", frameMulti: "#b0c0d8", divider: "#e0e0e0"
            },
            "ayu-mirage": {
                bg: "#1f2430", panel: "#232834", border: "#191e2a", text: "#cbccc6", hover: "#2a2f3a",
                frameBg: "#3a1f1f", frameSelected: "#1f3a1f", frameMulti: "#1f2a3a", divider: "#191e2a"
            },
            "dracula": {
                bg: "#282a36", panel: "#343746", border: "#21222c", text: "#f8f8f2", hover: "#44475a",
                frameBg: "#44282a", frameSelected: "#283844", frameMulti: "#2a2844", divider: "#21222c"
            }
        };
        const colors = schemes[scheme];
        if (!colors) return;
        document.body.style.background = colors.bg;
        document.body.style.color = colors.text;
        const style = document.createElement("style");
        style.id = "colorSchemeStyle";
        const oldStyle = document.getElementById("colorSchemeStyle");
        if (oldStyle) oldStyle.remove();
        const buttonBg = colors.button || colors.panel;
        const buttonText = colors.buttonText || colors.text;
        const buttonHover = colors.buttonHover || colors.hover;
        const tabActive = colors.tabActive || colors.panel;
        const inputBg = colors.inputBg || colors.bg;
        style.textContent = `
            :root { --timeline-frame-bg: ${colors.frameBg}; --timeline-frame-selected-bg: ${colors.frameSelected}; --timeline-frame-multi-bg: ${colors.frameMulti}; --quadrant-divider: ${colors.divider}; --timeline-ruler-bg: ${colors.border}; --timeline-ruler-tick: ${colors.text}; --timeline-ruler-text: ${colors.text}; }
            .toolbar, .sprite-toolbar, .playback-controls { background: ${colors.panel} !important; }
            .left-panel, .right-panel, .sprite-edit-panel, .timeline-container, .settings-group { background: ${colors.panel} !important; }
            .sprite-item, .sprite-preview, .timeline-view { background: ${colors.panel} !important; }
            .timeline-header { background: ${colors.panel} !important; }
            #timelineCanvas { background: ${colors.panel} !important; }
            .timeline-header label, .timeline-header span { color: ${colors.text} !important; }
            .timeline-slider { background: ${inputBg} !important; border-color: ${colors.border} !important; }
            .timeline-slider::-webkit-slider-thumb { background: ${buttonBg} !important; border-color: ${colors.border} !important; }
            .timeline-slider::-moz-range-thumb { background: ${buttonBg} !important; border-color: ${colors.border} !important; }
            input[type="range"] { background: transparent !important; border: none !important; }
            input[type="range"]::-webkit-slider-thumb { background: ${buttonBg} !important; border-color: ${colors.border} !important; }
            input[type="range"]::-moz-range-thumb { background: ${buttonBg} !important; border-color: ${colors.border} !important; }
            input[type="range"]::-webkit-slider-runnable-track { background: ${colors.border} !important; border: none !important; box-shadow: none !important; }
            input[type="range"]::-moz-range-track { background: ${colors.border} !important; border: none !important; box-shadow: none !important; }
            .slider-group { border: none !important; border-top: none !important; box-shadow: none !important; background: transparent !important; margin-top: 0 !important; padding-top: 0 !important; }
            .slider-group input[type="range"] { background: transparent !important; border: none !important; }
            .slider-group input[type="range"]::-webkit-slider-thumb { background: ${buttonBg} !important; border-color: ${colors.border} !important; }
            .slider-group input[type="range"]::-moz-range-thumb { background: ${buttonBg} !important; border-color: ${colors.border} !important; }
            .slider-group input[type="range"]::-webkit-slider-runnable-track { background: ${colors.border} !important; border: none !important; box-shadow: none !important; }
            .slider-group input[type="range"]::-moz-range-track { background: ${colors.border} !important; border: none !important; box-shadow: none !important; }
            #settingsUIScale { background: transparent !important; border: none !important; }
            #settingsUIScale::-webkit-slider-thumb { background: ${buttonBg} !important; border-color: ${colors.border} !important; }
            #settingsUIScale::-moz-range-thumb { background: ${buttonBg} !important; border-color: ${colors.border} !important; }
            #settingsUIScale::-webkit-slider-runnable-track { background: ${colors.border} !important; box-shadow: none !important; }
            #settingsUIScale::-moz-range-track { background: ${colors.border} !important; box-shadow: none !important; }
            .toolbar button, .sprite-toolbar button, .playback-controls button, .item-controls button, .settings-group button, .canvas-controls button:not(.active) { background: ${buttonBg} !important; color: ${buttonText} !important; border-color: ${colors.border} !important; }
            .toolbar button:hover, .sprite-toolbar button:hover, .playback-controls button:hover, .item-controls button:hover, .settings-group button:hover, .canvas-controls button:hover:not(.active) { background: ${buttonHover} !important; }
            ${scheme === "fusion-light" || scheme === "light-style" ? `.fas { filter: brightness(0) !important; }` : scheme === "default" ? `.fas { filter: none !important; }` : scheme === "dark-orange" ? `.fas { filter: invert(1) brightness(1.8) sepia(1) saturate(3) hue-rotate(5deg) !important; }` : scheme === "aqua" ? `.fas { filter: invert(1) brightness(1.8) sepia(1) saturate(4) hue-rotate(150deg) !important; }` : `.fas { filter: invert(1) brightness(1.2) !important; }`}
            .tab, .sprite-item, .settings-group, .direction-selector { border-color: ${colors.border} !important; }
            .direction-selector { background: ${colors.panel} !important; }
            .direction-selector label { color: ${colors.text} !important; }
            .direction-selector select { background: ${inputBg} !important; color: ${colors.text} !important; border-color: ${colors.border} !important; }
            .custom-dropdown-button { background: ${inputBg} !important; color: ${colors.text} !important; border-color: ${colors.border} !important; }
            .custom-dropdown-button:hover { background: ${colors.hover} !important; border-color: ${colors.border} !important; }
            .custom-dropdown-button:active { background: ${buttonHover} !important; border-color: ${colors.border} !important; }
            .custom-dropdown { background: ${colors.panel} !important; border-color: ${colors.border} !important; }
            .custom-dropdown-item { color: ${colors.text} !important; border-color: ${colors.border} !important; }
            .custom-dropdown-item:hover { background: ${colors.hover} !important; }
            .direction-selector .custom-dropdown-button { background: ${inputBg} !important; color: ${colors.text} !important; border-color: ${colors.border} !important; }
            .direction-selector .custom-dropdown { background: ${colors.panel} !important; border-color: ${colors.border} !important; }
            .direction-selector .custom-dropdown-item { color: ${colors.text} !important; border-color: ${colors.border} !important; }
            .direction-selector .custom-dropdown-item:hover { background: ${colors.hover} !important; }
            .sprite-item > div, label, h3, span { color: ${colors.text} !important; }
            input, select, textarea { background: ${inputBg} !important; color: ${colors.text} !important; border-color: ${colors.border} !important; }
            #colorSchemeDropdown { background: ${colors.panel} !important; border-color: ${colors.border} !important; }
            .color-scheme-item { color: ${colors.text} !important; border-color: ${colors.border} !important; }
            .color-scheme-item:hover { background: ${colors.hover} !important; }
            .tabs { background: ${colors.panel} !important; }
            .tab { background: transparent !important; color: ${colors.text} !important; opacity: 0.6; }
            .tab:hover { background: ${colors.hover} !important; opacity: 0.8; }
            .tab.active { background: ${tabActive} !important; color: ${colors.text} !important; border-color: ${colors.border} !important; border-bottom: none !important; opacity: 1; }
            .splitter-handle { background: ${colors.border} !important; }
            .defaults-table th { background: ${buttonBg} !important; color: ${buttonText} !important; }
            .defaults-table td { background: ${colors.panel} !important; color: ${colors.text} !important; }
            #historyList { background: ${colors.bg} !important; color: ${colors.text} !important; }
            .sprite-item { background: ${colors.panel} !important; border-color: ${colors.border} !important; }
            .sprite-item.selected { border-color: ${buttonBg} !important; }
            .dialog-content { background: ${colors.panel} !important; border-color: ${colors.border} !important; color: ${colors.text} !important; }
            .dialog-content h3 { color: ${colors.text} !important; border-color: ${colors.border} !important; }
            .dialog-content label { color: ${colors.text} !important; }
            .dialog-content p, .dialog-content span, .dialog-content div { color: ${colors.text} !important; }
            .dialog-content a { color: ${scheme === "fusion-light" || scheme === "light-style" ? "#0066cc" : scheme === "default" ? "#4a9eff" : scheme === "dark-orange" ? "#ffaa55" : scheme === "aqua" ? "#55ffff" : scheme === "ayu-mirage" ? "#5ccfe6" : scheme === "dracula" ? "#bd93f9" : "#4a9eff"} !important; }
            .dialog-content button { background: ${buttonBg} !important; color: ${buttonText} !important; border-color: ${colors.border} !important; }
            .dialog-content button:hover { background: ${buttonHover} !important; }
            .dialog-content select, .dialog-content input { background: ${inputBg} !important; color: ${colors.text} !important; border-color: ${colors.border} !important; }
            .dialog-overlay > div[style*="background: #2b2b2b"] { background: ${colors.panel} !important; border-color: ${colors.border} !important; color: ${colors.text} !important; }
            .dialog-overlay > div[style*="background: #2b2b2b"] > div[style*="display: flex"] > div[style*="background: #2b2b2b"] { background: ${colors.panel} !important; color: ${colors.text} !important; }
            .dialog-overlay > div[style*="background: #2b2b2b"] > div[style*="display: flex"] > div[style*="background: #2b2b2b"] label { color: ${colors.text} !important; }
            .dialog-overlay > div[style*="background: #2b2b2b"] > div[style*="display: flex"] > div[style*="background: #2b2b2b"] input,
            .dialog-overlay > div[style*="background: #2b2b2b"] > div[style*="display: flex"] > div[style*="background: #2b2b2b"] select { background: ${inputBg} !important; color: ${colors.text} !important; border-color: ${colors.border} !important; }
            .dialog-overlay > div[style*="background: #2b2b2b"] > div[style*="display: flex"] > div[style*="background: #2b2b2b"] button { background: ${buttonBg} !important; color: ${buttonText} !important; border-color: ${colors.border} !important; }
            .dialog-overlay > div[style*="background: #2b2b2b"] > div[style*="display: flex"] > div[style*="background: #2b2b2b"] button:hover { background: ${buttonHover} !important; }
            .dialog-overlay > div[style*="background: #2b2b2b"] > div[style*="display: flex"] > div[style*="border: 1px solid #0a0a0a"] { border-color: ${colors.border} !important; background: ${colors.panel} !important; }
            .dialog-overlay > div[style*="background: #2b2b2b"] > div[style*="display: flex"] > div[style*="background: #353535"] { background: ${colors.panel} !important; border-color: ${colors.border} !important; }
            .dialog-overlay > div[style*="background: #2b2b2b"] > div[style*="display: flex"] > div[style*="background: #1a1a1a"] { background: ${inputBg} !important; border-color: ${colors.border} !important; }
            #collabDropdown { background: ${colors.panel} !important; border-color: ${colors.border} !important; color: ${colors.text} !important; }
            #collabDropdown > div { color: ${colors.text} !important; }
            #collabPeers { background: ${colors.bg} !important; border-color: ${colors.border} !important; }
            #collabCopy, #collabJoin { background: ${buttonBg} !important; color: ${buttonText} !important; border-color: ${colors.border} !important; }
            #collabCopy:hover, #collabJoin:hover { background: ${buttonHover} !important; }
            #infoClose, #aboutClose { background: ${buttonBg} !important; color: ${buttonText} !important; border-color: ${colors.border} !important; }
            #infoClose:hover, #aboutClose:hover { background: ${buttonHover} !important; }
            .info-tab-btn { color: ${colors.text} !important; border-color: ${colors.border} !important; }
            .info-tab-btn.active { color: ${colors.text} !important; background: ${colors.panel} !important; }
            #tauriBar { background: ${colors.panel} !important; border-color: ${colors.border} !important; }
            #tauriBar button { background: transparent !important; color: ${colors.text} !important; border-color: transparent !important; }
            #tauriBar button:hover { background: ${colors.hover} !important; }
            #tauriBar .tb-title span { color: ${colors.text} !important; }
            .tool-button.active { background: #4a9eff !important; color: #fff !important; border-color: #2a7eff !important; }
            .tool-button.active:hover { background: #5aaeff !important; }
        `;
        document.head.appendChild(style);
        const settingsDialog = document.getElementById("settingsDialog");
        const aboutDialog = document.getElementById("aboutDialog");
        if (settingsDialog) {
            const settingsContent = settingsDialog.querySelector(".dialog-content");
            if (settingsContent) {
                settingsContent.style.background = colors.panel;
                settingsContent.style.borderColor = colors.border;
                settingsContent.style.color = colors.text;
                const h3 = settingsContent.querySelector("h3");
                if (h3) {
                    h3.style.color = colors.text;
                    h3.style.borderColor = colors.border;
                }
                const labels = settingsContent.querySelectorAll("label");
                labels.forEach(label => label.style.color = colors.text);
                const buttons = settingsContent.querySelectorAll("button");
                buttons.forEach(btn => {
                    btn.style.background = buttonBg;
                    btn.style.color = buttonText;
                    btn.style.borderColor = colors.border;
                });
                const selects = settingsContent.querySelectorAll("select");
                selects.forEach(sel => {
                    sel.style.background = inputBg;
                    sel.style.color = colors.text;
                    sel.style.borderColor = colors.border;
                });
                const inputs = settingsContent.querySelectorAll("input");
                inputs.forEach(inp => {
                    if (inp.type !== "checkbox" && inp.type !== "range") {
                        inp.style.background = inputBg;
                        inp.style.color = colors.text;
                        inp.style.borderColor = colors.border;
                    }
                });
            }
        }
        if (aboutDialog) {
            const aboutContent = aboutDialog.querySelector(".dialog-content");
            if (aboutContent) {
                aboutContent.style.background = colors.panel;
                aboutContent.style.borderColor = colors.border;
                aboutContent.style.color = colors.text;
                const h3 = aboutContent.querySelector("h3");
                if (h3) {
                    h3.style.color = colors.text;
                    h3.style.borderColor = colors.border;
                }
                const paragraphs = aboutContent.querySelectorAll("p");
                paragraphs.forEach(p => {
                    p.style.color = colors.text;
                    p.style.borderColor = colors.border;
                });
                const spans = aboutContent.querySelectorAll("span");
                spans.forEach(span => span.style.color = colors.text);
                const divs = aboutContent.querySelectorAll("div");
                divs.forEach(div => {
                    if (div.style.color && div.style.color !== "transparent") div.style.color = colors.text;
                    if (div.style.borderColor) div.style.borderColor = colors.border;
                });
                const links = aboutContent.querySelectorAll("a");
                links.forEach(a => a.style.color = buttonBg);
                const buttons = aboutContent.querySelectorAll("button");
                buttons.forEach(btn => {
                    btn.style.background = buttonBg;
                    btn.style.color = buttonText;
                    btn.style.borderColor = colors.border;
                });
            }
        }
        const colorSchemeDropdown = document.getElementById("colorSchemeDropdown");
        if (colorSchemeDropdown) {
            colorSchemeDropdown.style.background = colors.panel;
            colorSchemeDropdown.style.borderColor = colors.border;
            const schemeItems = colorSchemeDropdown.querySelectorAll(".color-scheme-item");
            schemeItems.forEach(item => {
                item.style.color = colors.text;
                item.style.borderColor = colors.border;
                const itemScheme = item.getAttribute("data-scheme");
                if (itemScheme === scheme) {
                    item.style.background = colors.hover || "#404040";
                } else {
                    item.style.background = "";
                }
            });
        }
        const timelineCanvas = document.getElementById("timelineCanvas");
        if (timelineCanvas) {
            timelineCanvas.style.background = colors.panel;
        }
        localStorage.setItem("editorColorScheme", scheme);
    }
    const btnColorScheme = document.getElementById("btnColorScheme");
    const colorSchemeDropdown = document.getElementById("colorSchemeDropdown");
    if (btnColorScheme && colorSchemeDropdown) {
        const savedScheme = localStorage.getItem("editorColorScheme") || "default";
        applyColorScheme(savedScheme);
        const updateColorSchemeFont = () => {
            const currentFont = localStorage.getItem("editorFont") || "chevyray";
            const fontFamily = getFontFamily(currentFont);
            const schemeItems = colorSchemeDropdown.querySelectorAll(".color-scheme-item");
            schemeItems.forEach(item => {
                item.style.fontFamily = fontFamily;
            });
        };
        updateColorSchemeFont();
        const schemeItems = colorSchemeDropdown.querySelectorAll(".color-scheme-item");
        btnColorScheme.onclick = (e) => {
            e.stopPropagation();
            updateColorSchemeFont();
            colorSchemeDropdown.style.display = colorSchemeDropdown.style.display === "none" ? "block" : "none";
        };
        schemeItems.forEach(item => {
            item.onclick = (e) => {
                e.stopPropagation();
                const scheme = item.getAttribute("data-scheme");
                const customTag = document.getElementById("customUserCSS");
                if (customTag) customTag.textContent = "";
                localStorage.removeItem("graalsuite_customCSS");
                applyColorScheme(scheme);
                const schemes = {
                    "fusion-light": { hover: "#e8e8e8" },
                    "fusion-dark": { hover: "#3d3d3d" },
                    "dark-style": { hover: "#3e3e3e" },
                    "dark-orange": { hover: "#4a3f3a" },
                    "aqua": { hover: "#2a3a3f" },
                    "elegant-dark": { hover: "#3d3d3d" },
                    "material-dark": { hover: "#2e2e2e" },
                    "light-style": { hover: "#f5f5f5" },
                    "ayu-mirage": { hover: "#2a2f3a" },
                    "dracula": { hover: "#44475a" }
                };
                const schemeColors = schemes[scheme];
                schemeItems.forEach(i => {
                    i.style.background = "";
                    if (i.getAttribute("data-scheme") === scheme) {
                        i.style.background = schemeColors ? schemeColors.hover : "#404040";
                    }
                });
                colorSchemeDropdown.style.display = "none";
            };
        });
        document.addEventListener("click", (e) => {
            if (!btnColorScheme.contains(e.target) && !colorSchemeDropdown.contains(e.target)) {
                colorSchemeDropdown.style.display = "none";
            }
        });
        const btnCustomCSS = document.getElementById("btnCustomCSS");
        if (btnCustomCSS) {
            btnCustomCSS.onmouseenter = () => { btnCustomCSS.style.background = "#252525"; };
            btnCustomCSS.onmouseleave = () => { btnCustomCSS.style.background = ""; };
            btnCustomCSS.onclick = (e) => {
                e.stopPropagation();
                colorSchemeDropdown.style.display = "none";
                openCustomCSSDialog();
            };
        }
    }
    function syncCanvasBgFromCSS() {
        const cssBg = getComputedStyle(document.documentElement).getPropertyValue('--canvas-bg').trim();
        if (cssBg) {
            backgroundColor = cssBg;
            const picker = document.getElementById("bgColorInput");
            if (picker) picker.value = cssBg;
            redraw();
        }
    }
    (function initCustomCSS() {
        const saved = localStorage.getItem("graalsuite_customCSS");
        if (saved) {
            let tag = document.getElementById("customUserCSS");
            if (!tag) { tag = document.createElement("style"); tag.id = "customUserCSS"; document.head.appendChild(tag); }
            tag.textContent = saved;
            requestAnimationFrame(syncCanvasBgFromCSS);
        }
    })();
    function openCustomCSSDialog() {
        const fontFamily = getFontFamily(localStorage.getItem("editorFont") || "chevyray");
        const current = (document.getElementById("customUserCSS") || {}).textContent || "";
        const overlay = document.createElement("div");
        overlay.className = "dialog-overlay";
        overlay.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:10000;display:flex;justify-content:center;align-items:center;";
        overlay.innerHTML = `
            <div class="dialog-content" style="background:#2b2b2b;border:2px solid #1a1a1a;width:660px;max-width:92vw;height:80vh;display:flex;flex-direction:column;box-shadow:0 4px 16px rgba(0,0,0,0.9);">
                <div class="dialog-titlebar" style="background:#1e1e1e;border-bottom:2px solid #0a0a0a;padding:10px 14px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
                    <span style="display:flex;align-items:center;gap:8px;"><i class="fas fa-palette" style="flex-shrink:0;display:block;"></i><span style="font-family:${fontFamily};font-size:13px;color:#c0c0c0;user-select:none;line-height:16px;">Custom CSS</span></span>
                    <span style="font-family:${fontFamily};font-size:11px;color:#666;user-select:none;">injected after all themes — overrides anything</span>
                </div>
                <div id="cssEditorContainer" style="flex:1;min-height:0;position:relative;overflow:hidden;"></div>
                <div style="padding:10px 14px;display:flex;gap:8px;align-items:center;border-top:1px solid #0a0a0a;flex-shrink:0;">
                    <button id="cssApply" style="background:#1a6b1a;color:#fff;border:1px solid #0a0a0a;border-top:1px solid #2a8a2a;padding:7px 14px;cursor:pointer;font-family:${fontFamily};font-size:12px;">Apply</button>
                    <button id="cssImport" style="background:#1a1a1a;color:#e0e0e0;border:1px solid #0a0a0a;border-top:1px solid #404040;padding:7px 14px;cursor:pointer;font-family:${fontFamily};font-size:12px;">Import</button>
                    <button id="cssExport" style="background:#1a1a1a;color:#e0e0e0;border:1px solid #0a0a0a;border-top:1px solid #404040;padding:7px 14px;cursor:pointer;font-family:${fontFamily};font-size:12px;">Export</button>
                    <a id="cssExample" href="example-theme.css" download style="background:#1a1a1a;color:#4a9eff;border:1px solid #0a0a0a;border-top:1px solid #404040;padding:7px 14px;cursor:pointer;font-family:${fontFamily};font-size:12px;text-decoration:none;">Example</a>
                    <div style="flex:1;"></div>
                    <button id="cssClear" style="background:#6b1a1a;color:#fff;border:1px solid #0a0a0a;border-top:1px solid #8a2a2a;padding:7px 14px;cursor:pointer;font-family:${fontFamily};font-size:12px;">Clear</button>
                    <button id="cssClose" style="background:#1a1a1a;color:#e0e0e0;border:1px solid #0a0a0a;border-top:1px solid #404040;padding:7px 14px;cursor:pointer;font-family:${fontFamily};font-size:12px;">Close</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);
        const container = overlay.querySelector("#cssEditorContainer");
        let editorInstance = null;
        let fallbackTextarea = null;
        const getValue = () => editorInstance ? editorInstance.getValue() : (fallbackTextarea ? fallbackTextarea.value : "");
        const setValue = (v) => { if (editorInstance) editorInstance.setValue(v); else if (fallbackTextarea) fallbackTextarea.value = v; };
        createMonacoEditor(container, current, 'css').then(ed => {
            if (ed) { editorInstance = ed; }
            else {
                fallbackTextarea = document.createElement("textarea");
                fallbackTextarea.id = "customCSSTextarea";
                fallbackTextarea.spellcheck = false;
                fallbackTextarea.value = current;
                fallbackTextarea.style.cssText = "width:100%;height:100%;background:#1a1a1a;color:#e0e0e0;border:none;padding:12px;font-family:monospace;font-size:12px;line-height:1.5;resize:none;outline:none;box-sizing:border-box;";
                container.appendChild(fallbackTextarea);
            }
        });
        const applyCSS = () => {
            const css = getValue();
            let tag = document.getElementById("customUserCSS");
            if (!tag) { tag = document.createElement("style"); tag.id = "customUserCSS"; document.head.appendChild(tag); }
            tag.textContent = css;
            localStorage.setItem("graalsuite_customCSS", css);
            requestAnimationFrame(syncCanvasBgFromCSS);
        };
        overlay.querySelector("#cssApply").onclick = applyCSS;
        overlay.querySelector("#cssClose").onclick = () => { if (editorInstance) editorInstance.dispose(); document.body.removeChild(overlay); };
        overlay.onclick = (e) => { if (e.target === overlay) { if (editorInstance) editorInstance.dispose(); document.body.removeChild(overlay); } };
        overlay.querySelector("#cssClear").onclick = () => {
            setValue("");
            const tag = document.getElementById("customUserCSS");
            if (tag) tag.textContent = "";
            localStorage.removeItem("graalsuite_customCSS");
        };
        overlay.querySelector("#cssImport").onclick = () => {
            const input = document.createElement("input");
            input.type = "file"; input.accept = ".css,text/css";
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => { setValue(ev.target.result); applyCSS(); };
                reader.readAsText(file);
            };
            input.click();
        };
        overlay.querySelector("#cssExport").onclick = () => {
            const blob = new Blob([getValue()], {type: "text/css"});
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = "custom-theme.css";
            a.click();
            URL.revokeObjectURL(a.href);
        };
    }
    function createCustomDropdown(selectElement) {
        if (!selectElement || selectElement.dataset.customDropdown) return;
        selectElement.dataset.customDropdown = "true";
        selectElement.style.display = "none";
        const wrapper = document.createElement("div");
        wrapper.style.position = "relative";
        wrapper.style.width = "100%";
        selectElement.parentNode.insertBefore(wrapper, selectElement);
        wrapper.appendChild(selectElement);
        const button = document.createElement("button");
        button.className = "custom-dropdown-button";
        const currentFont = localStorage.getItem("editorFont") || "chevyray";
        let currentFontFamily = currentFont;
        currentFontFamily = getFontFamily(currentFont);
        let buttonFontFamily = currentFontFamily;
        let buttonFontStyle = "normal";
        let buttonFontWeight = "normal";
        if (selectElement.id === "settingsFont") {
            const selectedValue = selectElement.options[selectElement.selectedIndex]?.value || selectElement.options[0]?.value || "";
            if (selectedValue === "PressStart2P") buttonFontFamily = '"PressStart2P", monospace';
            else if (selectedValue === "Silkscreen") buttonFontFamily = '"Silkscreen", monospace';
            else if (selectedValue === "Tempus Sans ITC") buttonFontFamily = '"Tempus Sans ITC", monospace';
            else if (selectedValue === "MesloLGS NF") buttonFontFamily = '"MesloLGS NF", monospace';
            else if (selectedValue === "chevyray") buttonFontFamily = '"chevyray", monospace';
            else if (selectedValue === "chevyrayOeuf") buttonFontFamily = '"chevyrayOeuf", monospace';
            else if (selectedValue === "monospace") buttonFontFamily = "monospace";
            else if (selectedValue.includes(" ")) buttonFontFamily = `"${selectedValue}", sans-serif`;
            else buttonFontFamily = `"${selectedValue}", sans-serif`;
        } else if (selectElement.id === "settingsFontStyle") {
            const selectedValue = selectElement.options[selectElement.selectedIndex]?.value || selectElement.options[0]?.value || "";
            if (selectedValue === "italic") buttonFontStyle = "italic";
            else if (selectedValue === "bold") buttonFontWeight = "bold";
            else if (selectedValue === "bold italic") { buttonFontWeight = "bold"; buttonFontStyle = "italic"; }
        }
        button.style.cssText = `width: 100%; background: #1a1a1a; border: 1px solid #0a0a0a; border-top: 1px solid #404040; border-left: 1px solid #404040; color: #ffffff; padding: 8px 24px 8px 8px; font-family: ${buttonFontFamily}; font-style: ${buttonFontStyle}; font-weight: ${buttonFontWeight}; font-size: 12px; text-align: left; cursor: pointer; box-shadow: inset 0 1px 0 rgba(0, 0, 0, 0.3); position: relative;`;
        const buttonText = document.createElement("span");
        buttonText.textContent = selectElement.options[selectElement.selectedIndex]?.text || selectElement.options[0]?.text || "";
        const buttonArrow = document.createElement("span");
        buttonArrow.style.cssText = "position: absolute; right: 6px; top: 50%; transform: translateY(-50%); font-size: 10px; color: #e0e0e0; pointer-events: none;";
        buttonArrow.innerHTML = '<span style="display: inline-block; transform: scaleX(1.4);">▼</span>';
        button.appendChild(buttonText);
        button.appendChild(buttonArrow);
        const dropdown = document.createElement("div");
        dropdown.className = "custom-dropdown";
        dropdown.style.cssText = "display: none; position: absolute; top: 100%; left: 0; right: 0; background: #2b2b2b; border: 1px solid #0a0a0a; border-top: 1px solid #404040; border-left: 1px solid #404040; z-index: 1000; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5); margin-top: 2px; max-height: 200px; overflow-y: auto;";
        Array.from(selectElement.options).forEach((option, index) => {
            const item = document.createElement("div");
            item.className = "custom-dropdown-item";
            let fontFamily = currentFontFamily;
            let fontStyle = "normal";
            let fontWeight = "normal";
            if (selectElement.id === "settingsFont") {
                const fontValue = option.value;
                if (fontValue === "PressStart2P") fontFamily = '"PressStart2P", monospace';
                else if (fontValue === "Silkscreen") fontFamily = '"Silkscreen", monospace';
                else if (fontValue === "Tempus Sans ITC") fontFamily = '"Tempus Sans ITC", monospace';
                else if (fontValue === "MesloLGS NF") fontFamily = '"MesloLGS NF", monospace';
                else if (fontValue === "chevyray") fontFamily = '"chevyray", monospace';
                else if (fontValue === "chevyrayOeuf") fontFamily = '"chevyrayOeuf", monospace';
                else if (fontValue === "monospace") fontFamily = "monospace";
                else if (fontValue.includes(" ")) fontFamily = `"${fontValue}", sans-serif`;
                else fontFamily = `"${fontValue}", sans-serif`;
            } else if (selectElement.id === "settingsFontStyle") {
                const styleValue = option.value;
                if (styleValue === "italic") fontStyle = "italic";
                else if (styleValue === "bold") fontWeight = "bold";
                else if (styleValue === "bold italic") { fontWeight = "bold"; fontStyle = "italic"; }
            }
            item.style.cssText = `padding: 8px; cursor: pointer; font-style: ${fontStyle}; font-weight: ${fontWeight}; font-size: 12px; color: #e0e0e0; border-bottom: 1px solid #0a0a0a;`;
            if (selectElement.id === "settingsFont") {
                item.style.setProperty("font-family", fontFamily, "important");
            } else {
                item.style.fontFamily = fontFamily;
            }
            item.textContent = option.text;
            item.dataset.value = option.value;
            if (index === selectElement.selectedIndex) {
                item.style.background = "#404040";
            }
            item.onclick = (e) => {
                e.stopPropagation();
                selectElement.selectedIndex = index;
                selectElement.value = option.value;
                buttonText.textContent = option.text;
                if (selectElement.id === "settingsFont") {
                    const fontValue = option.value;
                    let newFontFamily = "'chevyray', monospace";
                    if (fontValue === "PressStart2P") newFontFamily = '"PressStart2P", monospace';
                    else if (fontValue === "Silkscreen") newFontFamily = '"Silkscreen", monospace';
                    else if (fontValue === "Tempus Sans ITC") newFontFamily = '"Tempus Sans ITC", monospace';
                    else if (fontValue === "MesloLGS NF") newFontFamily = '"MesloLGS NF", monospace';
                    else if (fontValue === "chevyray") newFontFamily = '"chevyray", monospace';
                    else if (fontValue === "chevyrayOeuf") newFontFamily = '"chevyrayOeuf", monospace';
                    else if (fontValue === "monospace") newFontFamily = "monospace";
                    else if (fontValue.includes(" ")) newFontFamily = `"${fontValue}", sans-serif`;
                    else newFontFamily = `"${fontValue}", sans-serif`;
                    button.style.fontFamily = newFontFamily;
                } else if (selectElement.id === "settingsFontStyle") {
                    const styleValue = option.value;
                    let newFontStyle = "normal";
                    let newFontWeight = "normal";
                    if (styleValue === "italic") newFontStyle = "italic";
                    else if (styleValue === "bold") newFontWeight = "bold";
                    else if (styleValue === "bold italic") { newFontWeight = "bold"; newFontStyle = "italic"; }
                    button.style.fontStyle = newFontStyle;
                    button.style.fontWeight = newFontWeight;
                }
                dropdown.querySelectorAll(".custom-dropdown-item").forEach(i => i.style.background = "");
                item.style.background = "#404040";
                dropdown.style.display = "none";
                selectElement.dispatchEvent(new Event('change', { bubbles: true }));
            };
            dropdown.appendChild(item);
        });
        wrapper.appendChild(button);
        wrapper.appendChild(dropdown);
        button.onclick = (e) => {
            e.stopPropagation();
            dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";
        };
        document.addEventListener("click", (e) => {
            if (!wrapper.contains(e.target)) {
                dropdown.style.display = "none";
            }
        });
        selectElement.addEventListener("change", () => {
            buttonText.textContent = selectElement.options[selectElement.selectedIndex]?.text || "";
            if (selectElement.id === "settingsFont") {
                const selectedValue = selectElement.options[selectElement.selectedIndex]?.value || "";
                let newFontFamily = "'chevyray', monospace";
                if (selectedValue === "PressStart2P") newFontFamily = '"PressStart2P", monospace';
                else if (selectedValue === "Silkscreen") newFontFamily = '"Silkscreen", monospace';
                else if (selectedValue === "Tempus Sans ITC") newFontFamily = '"Tempus Sans ITC", monospace';
                else if (selectedValue === "MesloLGS NF") newFontFamily = '"MesloLGS NF", monospace';
                else if (selectedValue === "chevyray") newFontFamily = '"chevyray", monospace';
                else if (selectedValue === "chevyrayOeuf") newFontFamily = '"chevyrayOeuf", monospace';
                else if (selectedValue === "monospace") newFontFamily = "monospace";
                else if (selectedValue.includes(" ")) newFontFamily = `"${selectedValue}", sans-serif`;
                else newFontFamily = `"${selectedValue}", sans-serif`;
                button.style.fontFamily = newFontFamily;
            } else if (selectElement.id === "settingsFontStyle") {
                const selectedValue = selectElement.options[selectElement.selectedIndex]?.value || "";
                let newFontStyle = "normal";
                let newFontWeight = "normal";
                if (selectedValue === "italic") newFontStyle = "italic";
                else if (selectedValue === "bold") newFontWeight = "bold";
                else if (selectedValue === "bold italic") { newFontWeight = "bold"; newFontStyle = "italic"; }
                button.style.fontStyle = newFontStyle;
                button.style.fontWeight = newFontWeight;
            }
            dropdown.querySelectorAll(".custom-dropdown-item").forEach((item, idx) => {
                item.style.background = idx === selectElement.selectedIndex ? "#404040" : "";
            });
        });
    }
    const btnSettings = document.getElementById("btnSettings");
    const settingsDialog = document.getElementById("settingsDialog");
    const settingsPixelRendering = document.getElementById("settingsPixelRenderingCheckbox");
    const settingsAutoSave = document.getElementById("settingsAutoSaveCheckbox");
    const settingsShowGrid = document.getElementById("settingsShowGridCheckbox");
    const settingsGifAnimations = document.getElementById("settingsGifAnimationsCheckbox");
        const settingsLightEffects = document.getElementById("settingsLightEffectsCheckbox");
        const settingsSelectionBorderColor = document.getElementById("settingsSelectionBorderColor");
        const settingsSelectionBorderThickness = document.getElementById("settingsSelectionBorderThickness");
        const settingsSelectionBorderThicknessNumber = document.getElementById("settingsSelectionBorderThicknessNumber");
        const settingsSelectionBorderOpacity = document.getElementById("settingsSelectionBorderOpacity");
        const settingsSelectionBorderOpacityLabel = document.getElementById("settingsSelectionBorderOpacityLabel");
    if (btnSettings && settingsDialog) {
        const settingsFont = document.getElementById("settingsFont");
        const settingsFontSize = document.getElementById("settingsFontSize");
        const settingsFontStyle = document.getElementById("settingsFontStyle");
        const settingsUIScale = document.getElementById("settingsUIScale");
        const settingsUIScaleNumber = document.getElementById("settingsUIScaleNumber");
        const settingsUIScaleValue = document.getElementById("settingsUIScaleValue");
        const settingsOK = document.getElementById("settingsOK");
        const settingsCancel = document.getElementById("settingsCancel");
        const settingsDefaults = document.getElementById("settingsDefaults");
        const settingsReset = document.getElementById("settingsReset");
        const _builtinFonts = ["chevyray", "chevyrayOeuf", "MesloLGS NF", "PressStart2P", "Silkscreen"];
        const _fallbackFonts = ["Arial", "Comic Sans MS", "Courier New", "Georgia", "Helvetica", "Impact", "monospace", "Tahoma", "Tempus Sans ITC", "Times New Roman", "Trebuchet MS", "Verdana"];
        const _populateFontList = (fonts) => {
            if (!settingsFont) return;
            settingsFont.innerHTML = "";
            fonts.forEach(font => {
                const option = document.createElement("option");
                option.value = font;
                option.textContent = font === "PressStart2P" ? "Press Start 2P" : font === "monospace" ? "Monospace" : font;
                settingsFont.appendChild(option);
            });
            const savedFont = localStorage.getItem("editorFont") || "chevyray";
            settingsFont.value = savedFont;
            if (!settingsFont.value) { settingsFont.selectedIndex = 0; }
            settingsFont.dispatchEvent(new Event("change", { bubbles: true }));
        };
        (async () => {
            let fonts = [..._builtinFonts];
            if (window.queryLocalFonts && !window.__TAURI__) {
                try {
                    const local = await window.queryLocalFonts();
                    const systemNames = [...new Set(local.map(f => f.family))].filter(n => !_builtinFonts.includes(n)).sort();
                    fonts = [..._builtinFonts, ...systemNames];
                } catch { fonts = [..._builtinFonts, ..._fallbackFonts].sort((a,b) => a.localeCompare(b)); }
            } else {
                fonts = [..._builtinFonts, ..._fallbackFonts].sort((a,b) => a.localeCompare(b));
            }
            _populateFontList(fonts);
        })();
    }
    function initCustomDropdowns() {
        document.querySelectorAll("select:not([data-custom-dropdown])").forEach(select => {
            createCustomDropdown(select);
        });
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCustomDropdowns);
    } else {
        initCustomDropdowns();
    }
    const dropdownObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) {
                    if (node.tagName === 'SELECT' && !node.dataset.customDropdown) {
                        createCustomDropdown(node);
                    } else if (node.querySelectorAll) {
                        node.querySelectorAll('select:not([data-custom-dropdown])').forEach(select => {
                            createCustomDropdown(select);
                        });
                    }
                }
            });
        });
    });
    dropdownObserver.observe(document.body, { childList: true, subtree: true });
    if (btnSettings && settingsDialog) {
        const settingsFont = document.getElementById("settingsFont");
        const savedFont = localStorage.getItem("editorFont") || "chevyray";
        const savedFontSize = localStorage.getItem("editorFontSize") || "12";
        const savedFontStyle = localStorage.getItem("editorFontStyle") || "normal";
        const savedUIScale = localStorage.getItem("editorUIScale") || "1";
        const savedPixelRendering = localStorage.getItem("editorPixelRendering") !== "false";
        const savedAutoSave = localStorage.getItem("editorAutoSave") !== "false";
        const savedShowGrid = localStorage.getItem("editorShowGrid") !== "false";
        const savedGifAnimations = localStorage.getItem("editorGifAnimations") !== "false";
        const savedLightEffects = localStorage.getItem("editorLightEffects") !== "false";
        const savedSelectionBorderColor = localStorage.getItem("editorSelectionBorderColor") || "#00ff00";
        const savedSelectionBorderThickness = parseInt(localStorage.getItem("editorSelectionBorderThickness")) || 2;
        const savedSelectionBorderOpacity = parseInt(localStorage.getItem("editorSelectionBorderOpacity") ?? "100");
        function applyFont(font, save = true) {
            const fontFamily = getFontFamily(font);
            document.body.style.fontFamily = fontFamily;
            const style = document.createElement("style");
            style.id = "fontStyle";
            const existing = document.getElementById("fontStyle");
            if (existing) existing.remove();
            style.textContent = `* { font-family: ${fontFamily} !important; }`;
            document.head.appendChild(style);
            document.querySelectorAll(".custom-dropdown-button").forEach(button => {
                const select = button.parentElement.querySelector("select");
                if (select && select.id !== "settingsFont") {
                    button.style.fontFamily = fontFamily;
                }
            });
            document.querySelectorAll(".custom-dropdown-item").forEach(item => {
                const select = item.closest(".custom-dropdown")?.parentElement?.querySelector("select");
                if (select && select.id !== "settingsFont") {
                    item.style.fontFamily = fontFamily;
                }
            });
            document.querySelectorAll(".color-scheme-item").forEach(item => {
                item.style.fontFamily = fontFamily;
            });
            const aboutDialog = document.getElementById("infoDialog");
            if (aboutDialog) {
                const aboutContent = aboutDialog.querySelector(".dialog-content");
                if (aboutContent) {
                    aboutContent.style.fontFamily = fontFamily;
                    const h3 = aboutContent.querySelector("h3");
                    if (h3) h3.style.fontFamily = fontFamily;
                    aboutContent.querySelectorAll("p, span, div, a").forEach(el => {
                        el.style.fontFamily = fontFamily;
                    });
                }
            }
            const historyList = document.getElementById("historyList");
            if (historyList) {
                historyList.style.fontFamily = fontFamily;
                historyList.querySelectorAll("div").forEach(item => {
                    item.style.fontFamily = fontFamily;
                });
            }
            document.querySelectorAll("h3").forEach(h3 => {
                h3.style.fontFamily = fontFamily;
            });
            const settingsDialog = document.getElementById("settingsDialog");
            if (settingsDialog) {
                const settingsContent = settingsDialog.querySelector(".dialog-content");
                if (settingsContent) {
                    const h3 = settingsContent.querySelector("h3");
                    if (h3) h3.style.fontFamily = fontFamily;
                }
            }
            if (save) localStorage.setItem("editorFont", font);
        }
        function applyFontSize(size, save = true) {
            document.body.style.fontSize = size + "px";
            const style = document.createElement("style");
            style.id = "fontSizeStyle";
            const existing = document.getElementById("fontSizeStyle");
            if (existing) existing.remove();
            style.textContent = `body { font-size: ${size}px !important; } button, input, select, label, span, .tab { font-size: ${size}px !important; }`;
            document.head.appendChild(style);
            if (save) localStorage.setItem("editorFontSize", size);
        }
        function applyFontStyle(style, save = true) {
            const styleElement = document.createElement("style");
            styleElement.id = "fontStyleStyle";
            const existing = document.getElementById("fontStyleStyle");
            if (existing) existing.remove();
            let fontStyle = "normal";
            let fontWeight = "normal";
            if (style === "italic") fontStyle = "italic";
            else if (style === "bold") fontWeight = "bold";
            else if (style === "bold italic") { fontWeight = "bold"; fontStyle = "italic"; }
            styleElement.textContent = `body, button, input, select, label, span, .tab { font-style: ${fontStyle} !important; font-weight: ${fontWeight} !important; }`;
            document.head.appendChild(styleElement);
            if (save) localStorage.setItem("editorFontStyle", style);
        }
        function applyUIScale(scale, save = true) {
            const style = document.createElement("style");
            style.id = "uiScaleStyle";
            const existing = document.getElementById("uiScaleStyle");
            if (existing) existing.remove();
            const baseFontSize = parseFloat(localStorage.getItem("editorFontSize") || "12");
            style.textContent = `
                .main-container {
                    transform: scale(${scale});
                    transform-origin: top left;
                    width: ${100 / scale}%;
                    height: ${100 / scale}%;
                }
                body {
                    font-size: ${baseFontSize * scale}px !important;
                }
            `;
            document.head.appendChild(style);
            if (save) localStorage.setItem("editorUIScale", scale);
        }
        function applyPixelRendering(enabled, save = true) {
            const style = document.createElement("style");
            style.id = "pixelRenderingStyle";
            const existing = document.getElementById("pixelRenderingStyle");
            if (existing) existing.remove();
            if (enabled) {
                style.textContent = `* { image-rendering: pixelated !important; image-rendering: -moz-crisp-edges !important; image-rendering: crisp-edges !important; }`;
            }
            document.head.appendChild(style);
            if (save) localStorage.setItem("editorPixelRendering", enabled);
        }
        function applyShowGrid(enabled, save = true) {
            if (save) localStorage.setItem("editorShowGrid", enabled ? "true" : "false");
            redraw();
        }
        function applyGifAnimations(enabled, save = true) {
            if (save) localStorage.setItem("editorGifAnimations", enabled ? "true" : "false");
            redraw();
        }
        function applyLightEffects(enabled, save = true) {
            if (save) localStorage.setItem("editorLightEffects", enabled ? "true" : "false");
            redraw();
        }
        function applySelectionBorderColor(color, save = true) {
            if (save) localStorage.setItem("editorSelectionBorderColor", color);
            redraw();
        }
        function applySelectionBorderThickness(thickness, save = true) {
            if (save) localStorage.setItem("editorSelectionBorderThickness", thickness.toString());
            redraw();
        }
        function applySelectionBorderOpacity(opacity, save = true) {
            if (save) localStorage.setItem("editorSelectionBorderOpacity", opacity.toString());
            redraw();
        }
        applyFont(savedFont);
        applyFontSize(savedFontSize);
        applyFontStyle(savedFontStyle);
        applyUIScale(savedUIScale);
        applyPixelRendering(savedPixelRendering);
        applyShowGrid(savedShowGrid);
        applyGifAnimations(savedGifAnimations);
        applyLightEffects(savedLightEffects);
        applySelectionBorderColor(savedSelectionBorderColor, false);
        applySelectionBorderThickness(savedSelectionBorderThickness, false);
        const updateUIScaleDisplay = (value) => {
            const percent = Math.round(value * 100);
            if (settingsUIScaleValue) settingsUIScaleValue.textContent = percent + "%";
            if (settingsUIScaleNumber) settingsUIScaleNumber.value = value;
        };
        let originalSettings = {};
        btnSettings.onclick = (e) => {
            e.stopPropagation();
            const currentFont = localStorage.getItem("editorFont") || "chevyray";
            const currentFontSize = localStorage.getItem("editorFontSize") || "12";
            const currentFontStyle = localStorage.getItem("editorFontStyle") || "normal";
            const currentUIScale = parseFloat(localStorage.getItem("editorUIScale") || "1");
            const currentPixelRendering = localStorage.getItem("editorPixelRendering") !== "false";
            const currentAutoSave = localStorage.getItem("editorAutoSave") !== "false";
            const currentShowGrid = localStorage.getItem("editorShowGrid") !== "false";
            const currentGifAnimations = localStorage.getItem("editorGifAnimations") !== "false";
            const currentLightEffects = localStorage.getItem("editorLightEffects") !== "false";
            const _cssColor = getComputedStyle(document.documentElement).getPropertyValue("--selection-border-color").trim();
            const currentSelectionBorderColor = _cssColor || localStorage.getItem("editorSelectionBorderColor") || "#00ff00";
            const currentSelectionBorderThickness = parseInt(localStorage.getItem("editorSelectionBorderThickness")) || 2;
            const currentSelectionBorderOpacity = parseInt(localStorage.getItem("editorSelectionBorderOpacity") ?? "100");
            originalSettings = {
                font: currentFont,
                fontSize: currentFontSize,
                fontStyle: currentFontStyle,
                uiScale: currentUIScale,
                pixelRendering: currentPixelRendering,
                autoSave: currentAutoSave,
                showGrid: currentShowGrid,
                gifAnimations: currentGifAnimations,
                lightEffects: currentLightEffects,
                selectionBorderColor: currentSelectionBorderColor,
                selectionBorderThickness: currentSelectionBorderThickness,
                selectionBorderOpacity: currentSelectionBorderOpacity
            };
            if (settingsFont) settingsFont.value = currentFont;
            if (settingsFontSize) settingsFontSize.value = currentFontSize;
            if (settingsFontStyle) settingsFontStyle.value = currentFontStyle;
            if (settingsUIScale) {
                settingsUIScale.value = currentUIScale;
                updateUIScaleDisplay(currentUIScale);
            }
            if (settingsPixelRendering) settingsPixelRendering.textContent = currentPixelRendering ? "✓" : " ";
            if (settingsAutoSave) settingsAutoSave.textContent = currentAutoSave ? "✓" : " ";
            if (settingsShowGrid) settingsShowGrid.textContent = currentShowGrid ? "✓" : " ";
            if (settingsGifAnimations) settingsGifAnimations.textContent = currentGifAnimations ? "✓" : " ";
            if (settingsLightEffects) settingsLightEffects.textContent = currentLightEffects ? "✓" : " ";
            if (settingsSelectionBorderColor) settingsSelectionBorderColor.value = currentSelectionBorderColor;
            if (settingsSelectionBorderThickness) {
                settingsSelectionBorderThickness.value = currentSelectionBorderThickness;
                if (settingsSelectionBorderThicknessNumber) settingsSelectionBorderThicknessNumber.value = currentSelectionBorderThickness;
            }
            if (settingsSelectionBorderOpacity) { settingsSelectionBorderOpacity.value = currentSelectionBorderOpacity; if (settingsSelectionBorderOpacityLabel) settingsSelectionBorderOpacityLabel.textContent = currentSelectionBorderOpacity + "%"; }
            settingsDialog.style.display = "flex";
            switchSettingsTab("general");
        };
        if (settingsFont) {
            settingsFont.onchange = () => {
                if (settingsFont.value) applyFont(settingsFont.value, false);
            };
        }
        if (settingsFontSize) {
            settingsFontSize.onchange = () => {
                if (settingsFontSize.value) applyFontSize(settingsFontSize.value, false);
            };
        }
        if (settingsFontStyle) {
            settingsFontStyle.onchange = () => {
                if (settingsFontStyle.value) applyFontStyle(settingsFontStyle.value, false);
            };
        }
        if (settingsUIScale) {
            settingsUIScale.oninput = () => {
                const value = parseFloat(settingsUIScale.value);
                updateUIScaleDisplay(value);
                applyUIScale(value, false);
            };
        }
        if (settingsUIScaleNumber) {
            settingsUIScaleNumber.oninput = () => {
                const value = parseFloat(settingsUIScaleNumber.value);
                if (value >= 0.5 && value <= 2) {
                    if (settingsUIScale) settingsUIScale.value = value;
                    updateUIScaleDisplay(value);
                    applyUIScale(value, false);
                }
            };
        }
        if (settingsPixelRendering) {
            settingsPixelRendering.onclick = () => {
                const newValue = settingsPixelRendering.textContent.trim() !== "✓";
                settingsPixelRendering.textContent = newValue ? "✓" : " ";
                applyPixelRendering(newValue, false);
            };
        }
        if (settingsShowGrid) {
            settingsShowGrid.onclick = () => {
                const newValue = settingsShowGrid.textContent.trim() !== "✓";
                settingsShowGrid.textContent = newValue ? "✓" : " ";
                applyShowGrid(newValue, false);
            };
        }
        if (settingsGifAnimations) {
            settingsGifAnimations.onclick = () => {
                const newValue = settingsGifAnimations.textContent.trim() !== "✓";
                settingsGifAnimations.textContent = newValue ? "✓" : " ";
                applyGifAnimations(newValue, false);
            };
        }
        if (settingsLightEffects) {
            settingsLightEffects.onclick = () => {
                const newValue = settingsLightEffects.textContent.trim() !== "✓";
                settingsLightEffects.textContent = newValue ? "✓" : " ";
                applyLightEffects(newValue, false);
            };
        }
        if (settingsAutoSave) {
            settingsAutoSave.onclick = () => {
                const newValue = settingsAutoSave.textContent.trim() !== "✓";
                settingsAutoSave.textContent = newValue ? "✓" : " ";
            };
        }
        if (settingsSelectionBorderColor) {
            settingsSelectionBorderColor.onchange = () => {
                applySelectionBorderColor(settingsSelectionBorderColor.value, false);
            };
        }
        if (settingsSelectionBorderThickness && settingsSelectionBorderThicknessNumber) {
            settingsSelectionBorderThickness.oninput = () => {
                const thickness = parseInt(settingsSelectionBorderThickness.value) || 2;
                settingsSelectionBorderThicknessNumber.value = thickness;
                applySelectionBorderThickness(thickness, false);
            };
            settingsSelectionBorderThickness.onchange = () => {
                const thickness = parseInt(settingsSelectionBorderThickness.value) || 2;
                settingsSelectionBorderThicknessNumber.value = thickness;
                applySelectionBorderThickness(thickness, false);
            };
            settingsSelectionBorderThicknessNumber.oninput = () => {
                const thickness = Math.max(1, Math.min(10, parseInt(settingsSelectionBorderThicknessNumber.value) || 2));
                settingsSelectionBorderThicknessNumber.value = thickness;
                settingsSelectionBorderThickness.value = thickness;
                applySelectionBorderThickness(thickness, false);
            };
            settingsSelectionBorderThicknessNumber.onchange = () => {
                const thickness = Math.max(1, Math.min(10, parseInt(settingsSelectionBorderThicknessNumber.value) || 2));
                settingsSelectionBorderThicknessNumber.value = thickness;
                settingsSelectionBorderThickness.value = thickness;
                applySelectionBorderThickness(thickness, false);
            };
            addWheelHandler("#settingsSelectionBorderThicknessNumber", (e) => {
                const thickness = Math.max(1, Math.min(10, parseInt(settingsSelectionBorderThicknessNumber.value) || 2));
                settingsSelectionBorderThicknessNumber.value = thickness;
                settingsSelectionBorderThickness.value = thickness;
                applySelectionBorderThickness(thickness, false);
            }, 1);
        }
        if (settingsSelectionBorderOpacity) {
            settingsSelectionBorderOpacity.oninput = () => {
                const v = parseInt(settingsSelectionBorderOpacity.value);
                if (settingsSelectionBorderOpacityLabel) settingsSelectionBorderOpacityLabel.textContent = v + "%";
                applySelectionBorderOpacity(v, false);
            };
        }
        if (settingsOK) {
            settingsOK.onclick = () => {
                if (settingsFont) applyFont(settingsFont.value, true);
                if (settingsFontSize) applyFontSize(settingsFontSize.value, true);
                if (settingsFontStyle) applyFontStyle(settingsFontStyle.value, true);
                if (settingsUIScale) applyUIScale(parseFloat(settingsUIScale.value), true);
                if (settingsPixelRendering) applyPixelRendering(settingsPixelRendering.textContent.trim() === "✓", true);
                if (settingsAutoSave) localStorage.setItem("editorAutoSave", settingsAutoSave.textContent.trim() === "✓");
                if (settingsShowGrid) applyShowGrid(settingsShowGrid.textContent.trim() === "✓", true);
                if (settingsGifAnimations) applyGifAnimations(settingsGifAnimations.textContent.trim() === "✓", true);
                if (settingsLightEffects) applyLightEffects(settingsLightEffects.textContent.trim() === "✓", true);
                if (settingsSelectionBorderColor) applySelectionBorderColor(settingsSelectionBorderColor.value, true);
                if (settingsSelectionBorderThickness) applySelectionBorderThickness(parseInt(settingsSelectionBorderThickness.value) || 2, true);
                if (settingsSelectionBorderOpacity) applySelectionBorderOpacity(parseInt(settingsSelectionBorderOpacity.value), true);
                settingsDialog.style.display = "none";
            };
        }
        const revertSettings = () => {
            applyFont(originalSettings.font, false);
            applyFontSize(originalSettings.fontSize, false);
            applyUIScale(originalSettings.uiScale, false);
            applyPixelRendering(originalSettings.pixelRendering, false);
            applyShowGrid(originalSettings.showGrid, false);
            applyGifAnimations(originalSettings.gifAnimations, false);
            applyLightEffects(originalSettings.lightEffects, false);
            applySelectionBorderColor(originalSettings.selectionBorderColor || "#00ff00", false);
            applySelectionBorderThickness(originalSettings.selectionBorderThickness || 2, false);
            applySelectionBorderOpacity(originalSettings.selectionBorderOpacity ?? 100, false);
            if (settingsSelectionBorderColor) settingsSelectionBorderColor.value = originalSettings.selectionBorderColor || "#00ff00";
            if (settingsSelectionBorderThickness) {
                settingsSelectionBorderThickness.value = (originalSettings.selectionBorderThickness || 2).toString();
                if (settingsSelectionBorderThicknessNumber) settingsSelectionBorderThicknessNumber.value = (originalSettings.selectionBorderThickness || 2).toString();
            }
            if (settingsSelectionBorderOpacity) { settingsSelectionBorderOpacity.value = (originalSettings.selectionBorderOpacity ?? 100).toString(); if (settingsSelectionBorderOpacityLabel) settingsSelectionBorderOpacityLabel.textContent = (originalSettings.selectionBorderOpacity ?? 100) + "%"; }
            if (settingsFont) {
                settingsFont.value = originalSettings.font;
                settingsFont.dispatchEvent(new Event('change', { bubbles: true }));
                const fontWrapper = settingsFont.closest("div[style*='position: relative']");
                if (fontWrapper) {
                    const buttonText = fontWrapper.querySelector(".custom-dropdown-button span");
                    if (buttonText) {
                        const selectedOption = settingsFont.options[settingsFont.selectedIndex];
                        if (selectedOption) {
                            buttonText.textContent = selectedOption.text;
                            const button = fontWrapper.querySelector(".custom-dropdown-button");
                            if (button) {
                                const fontValue = selectedOption.value;
                                let newFontFamily = "'chevyray', monospace";
                                if (fontValue === "PressStart2P") newFontFamily = '"PressStart2P", monospace';
                                else if (fontValue === "Silkscreen") newFontFamily = '"Silkscreen", monospace';
                                else if (fontValue === "Tempus Sans ITC") newFontFamily = '"Tempus Sans ITC", monospace';
                                else if (fontValue === "MesloLGS NF") newFontFamily = '"MesloLGS NF", monospace';
                                else if (fontValue === "chevyray") newFontFamily = '"chevyray", monospace';
                                else if (fontValue === "chevyrayOeuf") newFontFamily = '"chevyrayOeuf", monospace';
                                else if (fontValue === "monospace") newFontFamily = "monospace";
                                else newFontFamily = fontValue;
                                button.style.fontFamily = newFontFamily;
                            }
                        }
                    }
                }
            }
            if (settingsFontSize) {
                settingsFontSize.value = originalSettings.fontSize;
                settingsFontSize.dispatchEvent(new Event('change', { bubbles: true }));
                const fontSizeWrapper = settingsFontSize.closest("div[style*='position: relative']");
                if (fontSizeWrapper) {
                    const buttonText = fontSizeWrapper.querySelector(".custom-dropdown-button span");
                    if (buttonText) {
                        const selectedOption = settingsFontSize.options[settingsFontSize.selectedIndex];
                        if (selectedOption) buttonText.textContent = selectedOption.text;
                    }
                }
            }
            if (settingsFontStyle) {
                settingsFontStyle.value = originalSettings.fontStyle;
                settingsFontStyle.dispatchEvent(new Event('change', { bubbles: true }));
                const fontStyleWrapper = settingsFontStyle.closest("div[style*='position: relative']");
                if (fontStyleWrapper) {
                    const buttonText = fontStyleWrapper.querySelector(".custom-dropdown-button span");
                    if (buttonText) {
                        const selectedOption = settingsFontStyle.options[settingsFontStyle.selectedIndex];
                        if (selectedOption) {
                            buttonText.textContent = selectedOption.text;
                            const button = fontStyleWrapper.querySelector(".custom-dropdown-button");
                            if (button) {
                                const styleValue = selectedOption.value;
                                let newFontStyle = "normal";
                                let newFontWeight = "normal";
                                if (styleValue === "italic") newFontStyle = "italic";
                                else if (styleValue === "bold") newFontWeight = "bold";
                                else if (styleValue === "bold italic") { newFontWeight = "bold"; newFontStyle = "italic"; }
                                button.style.fontStyle = newFontStyle;
                                button.style.fontWeight = newFontWeight;
                            }
                        }
                    }
                }
            }
            if (settingsUIScale) {
                settingsUIScale.value = originalSettings.uiScale;
                updateUIScaleDisplay(originalSettings.uiScale);
            }
            if (settingsUIScaleNumber) settingsUIScaleNumber.value = originalSettings.uiScale;
            if (settingsPixelRendering) settingsPixelRendering.textContent = originalSettings.pixelRendering ? "✓" : " ";
            if (settingsAutoSave) settingsAutoSave.textContent = originalSettings.autoSave ? "✓" : " ";
            if (settingsShowGrid) settingsShowGrid.textContent = originalSettings.showGrid ? "✓" : " ";
            if (settingsGifAnimations) settingsGifAnimations.textContent = originalSettings.gifAnimations ? "✓" : " ";
            if (settingsLightEffects) settingsLightEffects.textContent = originalSettings.lightEffects ? "✓" : " ";
            if (settingsSelectionBorderColor) settingsSelectionBorderColor.value = originalSettings.selectionBorderColor || "#00ff00";
            if (settingsSelectionBorderThickness) {
                settingsSelectionBorderThickness.value = (originalSettings.selectionBorderThickness || 2).toString();
                if (settingsSelectionBorderThicknessNumber) settingsSelectionBorderThicknessNumber.value = (originalSettings.selectionBorderThickness || 2).toString();
            }
            settingsDialog.style.display = "none";
        };
        if (settingsCancel) {
            settingsCancel.onclick = () => {
                revertSettings();
            };
        }
        if (settingsDefaults) {
            settingsDefaults.onclick = () => {
                if (settingsFont) {
                    settingsFont.value = "chevyray";
                    settingsFont.dispatchEvent(new Event('change', { bubbles: true }));
                    applyFont("chevyray", false);
                }
                if (settingsFontSize) {
                    settingsFontSize.value = "12";
                    settingsFontSize.dispatchEvent(new Event('change', { bubbles: true }));
                    applyFontSize("12", false);
                }
                if (settingsFontStyle) {
                    settingsFontStyle.value = "normal";
                    settingsFontStyle.dispatchEvent(new Event('change', { bubbles: true }));
                    applyFontStyle("normal", false);
                }
                if (settingsUIScale) {
                    settingsUIScale.value = "1";
                    updateUIScaleDisplay(1);
                    applyUIScale(1, false);
                }
                if (settingsUIScaleNumber) {
                    settingsUIScaleNumber.value = "1";
                }
                if (settingsPixelRendering) {
                    settingsPixelRendering.textContent = "✓";
                    applyPixelRendering(true, false);
                }
                if (settingsAutoSave) {
                    settingsAutoSave.textContent = "✓";
                }
                if (settingsShowGrid) {
                    settingsShowGrid.textContent = "✓";
                    applyShowGrid(true, false);
                }
                if (settingsGifAnimations) {
                    settingsGifAnimations.textContent = "✓";
                    applyGifAnimations(true, false);
                }
                if (settingsLightEffects) {
                    settingsLightEffects.textContent = "✓";
                    applyLightEffects(true, false);
                }
                if (settingsSelectionBorderColor) {
                    settingsSelectionBorderColor.value = "#00ff00";
                    applySelectionBorderColor("#00ff00", false);
                }
                if (settingsSelectionBorderThickness) {
                    settingsSelectionBorderThickness.value = "2";
                    if (settingsSelectionBorderThicknessNumber) settingsSelectionBorderThicknessNumber.value = "2";
                    applySelectionBorderThickness(2, false);
                }
                if (settingsSelectionBorderOpacity) { settingsSelectionBorderOpacity.value = "100"; if (settingsSelectionBorderOpacityLabel) settingsSelectionBorderOpacityLabel.textContent = "100%"; applySelectionBorderOpacity(100, false); }
            };
        }
        const resetEditorToDefaults = () => {
            zoomLevel = 6;
            panX = 0;
            panY = 0;
            backgroundColor = "#006400";
            const leftPanel = document.querySelector(".left-panel");
            const rightPanel = document.querySelector(".right-panel");
            const timelineContainer = document.querySelector(".timeline-container");
            const timelineView = document.querySelector(".timeline-view");
            const canvasTimelineSplitter = document.getElementById("canvasTimelineSplitter");
            const toolbar = document.querySelector(".toolbar");
            const spriteList = document.querySelector(".sprite-list");
            const mainSplitter = document.getElementById("mainSplitter");
            if (toolbar) {
                toolbar.style.display = "flex";
                toolbar.style.visibility = "visible";
                toolbar.style.opacity = "1";
                localStorage.setItem("toolbarVisible", "true");
            }
            if (leftPanel) {
                leftPanel.style.display = "flex";
                leftPanel.style.visibility = "visible";
                leftPanel.style.width = "270px";
                localStorage.setItem("leftPanelVisible", "true");
            }
            if (rightPanel) {
                rightPanel.style.display = "flex";
                rightPanel.style.visibility = "visible";
                rightPanel.style.width = "250px";
                localStorage.setItem("rightPanelVisible", "true");
            }
            if (timelineContainer) {
                timelineContainer.style.setProperty("display", "flex", "important");
                timelineContainer.style.setProperty("visibility", "visible", "important");
                timelineContainer.style.setProperty("opacity", "1", "important");
                timelineContainer.style.removeProperty("flex");
                timelineContainer.style.removeProperty("height");
                const isTouch = (navigator.maxTouchPoints && navigator.maxTouchPoints > 1) || (window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
                timelineContainer.style.height = isTouch ? "250px" : "218px";
                timelineContainer.style.flex = isTouch ? "0 0 250px" : "0 0 218px";
                timelineContainer.style.minHeight = isTouch ? "230px" : "180px";
                localStorage.setItem("timelineVisible", "true");
            }
            if (timelineView) {
                timelineView.style.setProperty("display", "block", "important");
                timelineView.style.setProperty("visibility", "visible", "important");
                timelineView.style.setProperty("opacity", "1", "important");
            }
            if (canvasTimelineSplitter) {
                canvasTimelineSplitter.style.setProperty("display", "block", "important");
                canvasTimelineSplitter.style.setProperty("visibility", "visible", "important");
                canvasTimelineSplitter.style.setProperty("opacity", "1", "important");
            }
            if (mainSplitter) {
                mainSplitter.style.height = "calc(100% - 222px)";
                mainSplitter.style.maxHeight = "calc(100% - 222px)";
            }
            if (spriteList) spriteList.style.height = "300px";
            selectedPieces.clear();
            currentFrame = 0;
            currentDir = 2;
            isPlaying = false;
            undoStack = [];
            undoIndex = -1;
            localStorage.setItem("mainCanvasZoom", zoomLevel);
            applyFont("chevyray", true);
            applyFontSize("12", true);
            applyFontStyle("normal", true);
            applyUIScale(1, true);
            applyPixelRendering(true, true);
            localStorage.setItem("editorAutoSave", "true");
            applyShowGrid(true, true);
            applyGifAnimations(true, true);
            applyLightEffects(true, true);
            applyColorScheme("default");
            const _customTag = document.getElementById("customUserCSS");
            if (_customTag) _customTag.textContent = "";
            localStorage.removeItem("graalsuite_customCSS");
            applySelectionBorderColor("#00ff00", true);
            applySelectionBorderThickness(2, true);
            if (settingsFont) {
                settingsFont.value = "chevyray";
                settingsFont.dispatchEvent(new Event('change', { bubbles: true }));
                const fontWrapper = settingsFont.closest("div[style*='position: relative']");
                if (fontWrapper) {
                    const buttonText = fontWrapper.querySelector(".custom-dropdown-button span");
                    if (buttonText) {
                        const selectedOption = settingsFont.options[settingsFont.selectedIndex];
                        if (selectedOption) {
                            buttonText.textContent = selectedOption.text;
                            const button = fontWrapper.querySelector(".custom-dropdown-button");
                            if (button) button.style.fontFamily = '"chevyray", monospace';
                        }
                    }
                }
            }
            if (settingsFontSize) {
                settingsFontSize.value = "12";
                settingsFontSize.dispatchEvent(new Event('change', { bubbles: true }));
                const fontSizeWrapper = settingsFontSize.closest("div[style*='position: relative']");
                if (fontSizeWrapper) {
                    const buttonText = fontSizeWrapper.querySelector(".custom-dropdown-button span");
                    if (buttonText) {
                        const selectedOption = settingsFontSize.options[settingsFontSize.selectedIndex];
                        if (selectedOption) buttonText.textContent = selectedOption.text;
                    }
                }
            }
            if (settingsFontStyle) {
                settingsFontStyle.value = "normal";
                settingsFontStyle.dispatchEvent(new Event('change', { bubbles: true }));
                const fontStyleWrapper = settingsFontStyle.closest("div[style*='position: relative']");
                if (fontStyleWrapper) {
                    const buttonText = fontStyleWrapper.querySelector(".custom-dropdown-button span");
                    if (buttonText) {
                        const selectedOption = settingsFontStyle.options[settingsFontStyle.selectedIndex];
                        if (selectedOption) {
                            buttonText.textContent = selectedOption.text;
                            const button = fontStyleWrapper.querySelector(".custom-dropdown-button");
                            if (button) {
                                button.style.fontStyle = "normal";
                                button.style.fontWeight = "normal";
                            }
                        }
                    }
                }
            }
            if (settingsUIScale) {
                settingsUIScale.value = "1";
                updateUIScaleDisplay(1);
            }
            if (settingsUIScaleNumber) settingsUIScaleNumber.value = "1";
            if (settingsPixelRendering) settingsPixelRendering.textContent = "✓";
            if (settingsAutoSave) settingsAutoSave.textContent = "✓";
            if (settingsShowGrid) settingsShowGrid.textContent = "✓";
            updateTabs();
            updateItemsCombo();
            updateItemSettings();
            updateSoundsList();
            localStorage.setItem("timelineVisible", "true");
            resizeCanvas();
            setTimeout(() => {
                localStorage.setItem("timelineVisible", "true");
                const timelineContainer = document.querySelector(".timeline-container");
                const timelineView = document.querySelector(".timeline-view");
                const canvasTimelineSplitter = document.getElementById("canvasTimelineSplitter");
                const mainSplitter = document.getElementById("mainSplitter");
                if (timelineContainer) {
                    timelineContainer.style.setProperty("display", "flex", "important");
                    timelineContainer.style.setProperty("visibility", "visible", "important");
                    timelineContainer.style.setProperty("opacity", "1", "important");
                    timelineContainer.style.removeProperty("flex");
                    timelineContainer.style.removeProperty("height");
                    const isTouch = (navigator.maxTouchPoints && navigator.maxTouchPoints > 1) || (window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
                    timelineContainer.style.height = isTouch ? "250px" : "218px";
                    timelineContainer.style.flex = isTouch ? "0 0 250px" : "0 0 218px";
                    timelineContainer.style.minHeight = isTouch ? "230px" : "180px";
                }
                if (timelineView) {
                    timelineView.style.setProperty("display", "block", "important");
                    timelineView.style.setProperty("visibility", "visible", "important");
                    timelineView.style.setProperty("opacity", "1", "important");
                }
                if (canvasTimelineSplitter) {
                    canvasTimelineSplitter.style.setProperty("display", "block", "important");
                    canvasTimelineSplitter.style.setProperty("visibility", "visible", "important");
                    canvasTimelineSplitter.style.setProperty("opacity", "1", "important");
                }
                if (mainSplitter) {
                    mainSplitter.style.height = "calc(100% - 222px)";
                    mainSplitter.style.maxHeight = "calc(100% - 222px)";
                }
                resizeCanvas();
                drawTimeline();
            }, 100);
            redraw();
            updateUIVisibility();
        };
        if (settingsReset) {
            settingsReset.onclick = (e) => {
                e.stopPropagation();
                showConfirmDialog("Reset the editor to default state? This will reset zoom, pan, selections, UI layout, and all settings.", (confirmed, clearStorage) => {
                    if (confirmed) {
                        if (clearStorage) {
                            localStorage.clear();
                        }
                        resetEditorToDefaults();
                        updateFrameInfo();
                        updateSpritesList();
                        updateDefaultsTable();
                        if (!clearStorage) {
                            saveSession();
                        }
                        settingsDialog.style.display = "none";
                        location.reload();
                    }
                }, true);
            };
        }
        settingsDialog.onclick = (e) => {
            const dialogContent = settingsDialog.querySelector(".dialog-content");
            if (e.target === settingsDialog || (dialogContent && !dialogContent.contains(e.target))) {
                revertSettings();
            }
        };
        document.addEventListener("click", (e) => {
            if (settingsDialog.style.display === "flex") {
                if (btnSettings.contains(e.target)) return;
                const confirmDialog = document.querySelector(".dialog-overlay[style*='z-index: 10001']");
                if (confirmDialog && confirmDialog.contains(e.target)) return;
                const dialogContent = settingsDialog.querySelector(".dialog-content");
                if (!settingsDialog.contains(e.target) || (dialogContent && !dialogContent.contains(e.target) && e.target === settingsDialog)) {
                    revertSettings();
                }
            }
        });
    }
    if (btnColorScheme) {
        const wrapperDiv = btnColorScheme.parentElement;
        if (wrapperDiv) {
            wrapperDiv.parentNode.insertBefore(bgColorInput, wrapperDiv.nextSibling);
        }
    }
    function createCustomSpinners() {
        const numberInputs = document.querySelectorAll('input[type="number"]');
        numberInputs.forEach(input => {
            if (input.parentElement.classList.contains('number-input-wrapper')) return;
            const wrapper = document.createElement('div');
            wrapper.className = 'number-input-wrapper';
            input.parentNode.insertBefore(wrapper, input);
            wrapper.appendChild(input);
            const spinnerContainer = document.createElement('div');
            spinnerContainer.className = 'number-spinner-container';
            const spinnerUp = document.createElement('div');
            spinnerUp.className = 'number-spinner number-spinner-up';
            spinnerUp.innerHTML = '<span style="display: inline-block; transform: scaleX(1.4);">▲</span>';
            spinnerUp.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (input.disabled) return;
                const step = parseFloat(input.step) || 1;
                const max = input.max !== '' ? parseFloat(input.max) : null;
                let value = parseFloat(input.value) || 0;
                value += step;
                if (max !== null && value > max) value = max;
                input.value = value;
                input.dispatchEvent(new Event('change', { bubbles: true }));
                input.dispatchEvent(new Event('input', { bubbles: true }));
            };
            const spinnerDown = document.createElement('div');
            spinnerDown.className = 'number-spinner number-spinner-down';
            spinnerDown.innerHTML = '<span style="display: inline-block; transform: scaleX(1.4);">▼</span>';
            spinnerDown.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (input.disabled) return;
                const step = parseFloat(input.step) || 1;
                const min = input.min !== '' ? parseFloat(input.min) : null;
                let value = parseFloat(input.value) || 0;
                value -= step;
                if (min !== null && value < min) value = min;
                input.value = value;
                input.dispatchEvent(new Event('change', { bubbles: true }));
                input.dispatchEvent(new Event('input', { bubbles: true }));
            };
            const updateSpinnerState = () => {
                if (input.disabled) {
                    spinnerUp.style.pointerEvents = 'none';
                    spinnerUp.style.opacity = '0.5';
                    spinnerDown.style.pointerEvents = 'none';
                    spinnerDown.style.opacity = '0.5';
                } else {
                    spinnerUp.style.pointerEvents = 'auto';
                    spinnerUp.style.opacity = '1';
                    spinnerDown.style.pointerEvents = 'auto';
                    spinnerDown.style.opacity = '1';
                }
            };
            updateSpinnerState();
            const inputObserver = new MutationObserver(updateSpinnerState);
            inputObserver.observe(input, { attributes: true, attributeFilter: ['disabled'] });
            spinnerContainer.appendChild(spinnerUp);
            spinnerContainer.appendChild(spinnerDown);
            wrapper.appendChild(spinnerContainer);
        });
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createCustomSpinners);
    } else {
        createCustomSpinners();
    }
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) {
                    if (node.tagName === 'INPUT' && node.type === 'number') {
                        createCustomSpinners();
                    } else if (node.querySelectorAll) {
                        const inputs = node.querySelectorAll('input[type="number"]');
                        if (inputs.length > 0) createCustomSpinners();
                    }
                }
            });
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    const applyLabelShadows = () => {
        document.querySelectorAll("label").forEach(label => {
            if (label.textContent && label.textContent.includes(":")) {
                const sliderGroup = label.nextElementSibling;
                if (sliderGroup && sliderGroup.classList.contains("slider-group")) {
                    label.style.textShadow = "1px 1px 2px rgba(0, 0, 0, 0.8), 0 0 2px rgba(0, 0, 0, 0.5)";
                } else {
                    label.style.textShadow = "1px 1px 2px rgba(0, 0, 0, 0.8), 0 0 4px rgba(0, 0, 0, 0.5)";
                }
            }
        });
    };
    applyLabelShadows();
    const labelObserver = new MutationObserver(() => {
        applyLabelShadows();
    });
    labelObserver.observe(document.body, { childList: true, subtree: true });
    const btnSwapKeys = document.getElementById("btnSwapKeys");
    const updateSwapTooltip = () => {
        const tip = keysSwapped ? "Arrows=Direction, WASD=Move — click to restore" : "WASD=Direction, Arrows=Move — click to swap";
        if (btnSwapKeys.hasAttribute("data-title")) btnSwapKeys.dataset.title = tip;
        else btnSwapKeys.title = tip;
    };
    updateSwapTooltip();
    btnSwapKeys.onclick = () => {
        keysSwapped = !keysSwapped;
        btnSwapKeys.classList.toggle("active", keysSwapped);
        updateSwapTooltip();
        if (_tooltipTarget === btnSwapKeys) _tooltipEl.textContent = btnSwapKeys.dataset.title;
        saveSession();
    };
    const APP_VERSION = "2.1.3";
    const _infoDialog = document.getElementById("infoDialog");
    const _infoClose = document.getElementById("infoClose");
    const _infoContent = document.getElementById("infoContent");
    let _changelogData = null;
    function _getInfoTabHTML(tab) {
        const fontFamily = getFontFamily(localStorage.getItem("editorFont") || "chevyray");
        if (tab === "about") return `
            <p style="margin:0 0 12px 0;"><strong>GraalSuite</strong> <span style="color:#888; font-size:10px;">(alpha) v${APP_VERSION}</span></p>
            <p style="margin:0 0 12px 0;">A web-based suite of tools for Graal Online development — includes a .gani animation editor, .nw/.graal/.zelda level editor, Gmap Generator, and Setshape2 editor.</p>
            <p style="margin:0 0 12px 0;">Part of Preagonal/OpenGraal &mdash; preserving Graal for future generations.</p>
            <p style="margin:0 0 12px 0; border-top:1px solid #0a0a0a; padding-top:12px; font-size:11px; color:#888;">
                <strong>Credits:</strong><br>
                Original C++ TilesEditor by <a href="https://www.xing.com/profile/Stefan_Knorr9" target="_blank" style="color:#4a9eff; text-decoration:none;">Stefan Knorr</a><br>
                Modern C++ TilesEditor by <a href="https://github.com/lukegrahamSydney/TilesEditor" target="_blank" style="color:#4a9eff; text-decoration:none;">39ster/luke graham</a><br>
                GraalSuite by <a href="https://github.com/denveous" target="_blank" style="color:#4a9eff; text-decoration:none;">denveous</a>
            </p>`;
        if (tab === "keybinds") {
            const editableActions = [
                { key: "save", label: "Save" },
                { key: "open", label: "Open" },
                { key: "undo", label: "Undo" },
                { key: "redo", label: "Redo" },
                { key: "play", label: "Play / Pause" },
                { key: "zoomIn", label: "Zoom In" },
                { key: "zoomOut", label: "Zoom Out" },
                { key: "deselect", label: "Deselect / Close" },
                { key: "deletePiece", label: "Delete Piece" },
                { key: "selectAll", label: "Select All Sprites" },
                { key: "cycleSprite", label: "Cycle Sprite (Shift = add)" },
                { key: "layerUp", label: "Layer Up" },
                { key: "layerDown", label: "Layer Down" },
                { key: "prevFrame", label: "Previous Frame" },
                { key: "nextFrame", label: "Next Frame" },
                { key: "togglePanels", label: "Toggle Panels" },
                { key: "resetEditor", label: "Reset Editor" },
                { key: "infoDialog", label: "About / Info" },
                { key: "settingsDialog", label: "Settings" },
            ];
            const kbRow = (label, key) => `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;margin-left:16px;"><span style="color:#c0c0c0;">${label}</span><button class="keybind-edit-btn" data-action="${key}" title="Click to rebind, right-click to reset" style="min-width:72px;text-align:center;cursor:pointer;background:#1a1a1a;border:1px solid #444;color:#e0e0e0;padding:2px 8px;border-radius:3px;font-size:11px;">${formatKeybind(keybinds[key])}</button></div>`;
            return `<div style="margin-bottom:8px;"><strong>Editable Shortcuts</strong> <span style="color:#555;font-size:10px;">click to rebind · right-click to reset</span></div>
${editableActions.map(a => kbRow(a.label, a.key)).join("")}
<div style="margin-top:14px;margin-bottom:8px;"><strong>Fixed Shortcuts</strong></div>
<div style="margin-left:16px;margin-bottom:4px;color:#c0c0c0;">Arrows — Move Selected Piece</div>
<div style="margin-left:16px;margin-bottom:4px;color:#c0c0c0;">Backspace — Delete Piece</div>
<div style="margin-left:16px;margin-bottom:4px;color:#c0c0c0;">Ctrl+C — Copy Selected Pieces</div>
<div style="margin-left:16px;margin-bottom:4px;color:#c0c0c0;">Ctrl+X — Cut Selected Pieces</div>
<div style="margin-left:16px;margin-bottom:4px;color:#c0c0c0;">Ctrl+V — Paste Pieces</div>
<div style="margin-left:16px;margin-bottom:4px;color:#c0c0c0;">Shift+Click Canvas — Add to selection</div>
<div style="margin-top:14px;margin-bottom:8px;"><strong>Timeline</strong></div>
<div style="margin-left:16px;margin-bottom:4px;color:#c0c0c0;">Ctrl+Scroll — Zoom Timeline</div>
<div style="margin-left:16px;margin-bottom:4px;color:#c0c0c0;">Shift/Ctrl+Click Frame — Multi-select frames</div>
<div style="margin-left:16px;margin-bottom:4px;color:#c0c0c0;">Drag selected frame — Move group</div>`;
        }
        return "";
    }
    function _renderChangelog() {
        if (!_changelogData || !_infoContent) return;
        _infoContent.style.fontFamily = getFontFamily(localStorage.getItem("editorFont") || "chevyray");
        const _tagColors = { 'GraalSuite':'#c792ea','Level Editor':'#4a9eff','Gani Editor':'#56d364','Gmap Generator':'#ffa657','Setshape2':'#ff7b72' };
        _infoContent.innerHTML = _changelogData.map(entry => {
            const tc = _tagColors[entry.tag] || '#888';
            return `<div style="margin-bottom:20px;">
                <div style="font-size:13px; color:#569cd6; margin-bottom:8px; border-bottom:1px solid #3a3a3a; padding-bottom:6px;">v${entry.version} <span style="color:${tc};font-size:11px;">(${entry.tag})</span> <span style="color:#666; font-size:11px;">${entry.date}</span></div>
                <ul style="margin:0; padding-left:20px; color:#c0c0c0;">${entry.changes.map(c => `<li style="margin-bottom:4px;">${c}</li>`).join("")}</ul>
            </div>`;
        }).join("");
    }
    function switchInfoTab(tab) {
        if (!_infoContent) return;
        _infoContent.style.fontFamily = getFontFamily(localStorage.getItem("editorFont") || "chevyray");
        document.querySelectorAll(".info-tab-btn").forEach(btn => {
            const active = btn.dataset.tab === tab;
            btn.style.color = active ? "#4a9eff" : "#888";
            btn.style.background = active ? "#252525" : "transparent";
        });
        if (tab === "changelog") {
            if (_changelogData) { _renderChangelog(); return; }
            _infoContent.innerHTML = `<div style="color:#888;">Loading...</div>`;
            fetch("changelog.json").then(r => r.json()).then(data => { _changelogData = data; _renderChangelog(); }).catch(() => { _infoContent.innerHTML = `<div style="color:#888;">Failed to load changelog.</div>`; });
        } else {
            _infoContent.innerHTML = _getInfoTabHTML(tab);
            if (tab === "keybinds") {
                _infoContent.querySelectorAll(".keybind-edit-btn").forEach(btn => {
                    btn.onclick = () => {
                        if (btn.dataset.listening) return;
                        btn.dataset.listening = "1";
                        const orig = btn.textContent;
                        btn.textContent = "…press key…";
                        btn.style.color = "#4a9eff";
                        const capture = (ev) => {
                            if (ev.key === "Escape") { btn.textContent = orig; btn.style.color = "#e0e0e0"; delete btn.dataset.listening; document.removeEventListener("keydown", capture, true); return; }
                            ev.preventDefault(); ev.stopPropagation();
                            const parts = [];
                            if (ev.ctrlKey) parts.push("ctrl");
                            if (ev.shiftKey) parts.push("shift");
                            if (ev.altKey) parts.push("alt");
                            if (!["Control","Shift","Alt","Meta"].includes(ev.key)) parts.push(ev.key);
                            if (parts.length === 0 || (parts.length === 1 && !["ctrl","shift","alt"].includes(parts[0])) || parts[parts.length - 1] !== ev.key) {
                                keybinds[btn.dataset.action] = parts.join("+");
                                saveKeybinds();
                                btn.textContent = formatKeybind(keybinds[btn.dataset.action]);
                                btn.style.color = "#e0e0e0";
                                delete btn.dataset.listening;
                                document.removeEventListener("keydown", capture, true);
                            }
                        };
                        document.addEventListener("keydown", capture, true);
                    };
                    btn.oncontextmenu = (ev) => { ev.preventDefault(); keybinds[btn.dataset.action] = DEFAULT_KEYBINDS[btn.dataset.action]; saveKeybinds(); btn.textContent = formatKeybind(DEFAULT_KEYBINDS[btn.dataset.action]); };
                });
            }
        }
    }
    function openInfoDialog(tab = "about") {
        if (!_infoDialog) return;
        _infoDialog.style.display = "flex";
        switchInfoTab(tab);
    }
    function switchSettingsTab(tab) {
        const generalPanel = document.getElementById("settingsGeneralPanel");
        const canvasPanel = document.getElementById("settingsCanvasPanel");
        const keybindsPanel = document.getElementById("settingsKeybindsPanel");
        const footer = keybindsPanel?.nextElementSibling;
        document.querySelectorAll(".settings-tab-btn").forEach(btn => {
            const active = btn.dataset.tab === tab;
            btn.style.color = active ? "#4a9eff" : "#888";
            btn.style.background = active ? "#252525" : "transparent";
        });
        if (generalPanel) generalPanel.style.display = tab === "general" ? "" : "none";
        if (canvasPanel) canvasPanel.style.display = tab === "canvas" ? "" : "none";
        if (keybindsPanel) {
            keybindsPanel.style.display = tab === "keybinds" ? "block" : "none";
            if (tab === "keybinds") {
                keybindsPanel.style.fontFamily = getFontFamily(localStorage.getItem("editorFont") || "chevyray");
                keybindsPanel.innerHTML = _getInfoTabHTML("keybinds");
                keybindsPanel.querySelectorAll(".keybind-edit-btn").forEach(btn => {
                    btn.onclick = () => {
                        if (btn.dataset.listening) return;
                        btn.dataset.listening = "1";
                        const orig = btn.textContent;
                        btn.textContent = "…press key…";
                        btn.style.color = "#4a9eff";
                        const capture = (ev) => {
                            if (ev.key === "Escape") { btn.textContent = orig; btn.style.color = "#e0e0e0"; delete btn.dataset.listening; document.removeEventListener("keydown", capture, true); return; }
                            ev.preventDefault(); ev.stopPropagation();
                            const parts = [];
                            if (ev.ctrlKey) parts.push("ctrl");
                            if (ev.shiftKey) parts.push("shift");
                            if (ev.altKey) parts.push("alt");
                            if (!["Control","Shift","Alt","Meta"].includes(ev.key)) parts.push(ev.key);
                            if (parts.length === 0 || (parts.length === 1 && !["ctrl","shift","alt"].includes(parts[0])) || parts[parts.length - 1] !== ev.key) {
                                keybinds[btn.dataset.action] = parts.join("+");
                                saveKeybinds();
                                btn.textContent = formatKeybind(keybinds[btn.dataset.action]);
                                btn.style.color = "#e0e0e0";
                                delete btn.dataset.listening;
                                document.removeEventListener("keydown", capture, true);
                            }
                        };
                        document.addEventListener("keydown", capture, true);
                    };
                    btn.oncontextmenu = (ev) => { ev.preventDefault(); keybinds[btn.dataset.action] = DEFAULT_KEYBINDS[btn.dataset.action]; saveKeybinds(); btn.textContent = formatKeybind(DEFAULT_KEYBINDS[btn.dataset.action]); };
                });
            }
        }
        if (footer) footer.style.display = tab === "keybinds" ? "none" : "";
    }
    if (_infoDialog && _infoClose) {
        _infoClose.onclick = () => { _infoDialog.style.display = "none"; };
        _infoDialog.onclick = (e) => { if (e.target === _infoDialog) _infoDialog.style.display = "none"; };
        document.querySelectorAll(".info-tab-btn").forEach(btn => { btn.onclick = () => switchInfoTab(btn.dataset.tab); });
        const btnAbout = document.getElementById("btnAbout");
        if (btnAbout) btnAbout.onclick = () => window.openInfoDialog?.("about");
    }
    document.querySelectorAll(".settings-tab-btn").forEach(btn => { btn.onclick = () => switchSettingsTab(btn.dataset.tab); });
    const updateHistoryFont = () => {
        const fontFamily = getFontFamily(localStorage.getItem("editorFont") || "chevyray");
        const historyList = document.getElementById("historyList");
        if (historyList) {
            historyList.style.fontFamily = fontFamily;
            historyList.querySelectorAll("div").forEach(item => { item.style.fontFamily = fontFamily; });
        }
    };
    updateHistoryFont();
    document.querySelectorAll("h3").forEach(h3 => { h3.style.fontFamily = getFontFamily(localStorage.getItem("editorFont") || "chevyray"); });
    document.getElementById("btnDefaults").onclick = () => {
        const table = document.getElementById("defaultsTable");
        const btn = document.getElementById("btnDefaults");
        if (table.style.visibility === "hidden" || table.style.visibility === "") {
            table.style.visibility = "visible";
            table.style.display = "table";
            btn.textContent = "Defaults ▼";
        } else {
            table.style.visibility = "hidden";
            table.style.display = "none";
            btn.textContent = "Defaults ▶";
        }
    };
    document.getElementById("btnEditScript").onclick = () => {
        const currentFont = localStorage.getItem("editorFont") || "chevyray";
        const fontFamily = getFontFamily(currentFont);
        const dialog = document.createElement("div");
        dialog.className = "dialog-overlay";
        dialog.style.display = "flex";
        dialog.style.justifyContent = "center";
        dialog.style.alignItems = "center";
        dialog.className = "dialog-overlay";
        dialog.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:10000;display:flex;justify-content:center;align-items:center;";
        const content = document.createElement("div");
        content.className = "dialog-content";
        content.style.cssText = "width:660px;max-width:92vw;height:55vh;display:flex;flex-direction:column;background:var(--dialog-bg,#2b2b2b);border:2px solid var(--dialog-border,#1a1a1a);box-shadow:0 4px 16px rgba(0,0,0,0.9);";
        const _btnStyle = `background:#2b2b2b;border:1px solid #0a0a0a;border-top:1px solid #404040;border-left:1px solid #404040;color:#e0e0e0;padding:4px 14px;cursor:pointer;font-family:${fontFamily};font-size:12px;`;
        content.innerHTML = `
            <div class="dialog-titlebar" style="flex-shrink:0;padding:8px 12px;display:flex;align-items:center;gap:8px;">
                <img src="images/npc.png" style="width:16px;height:16px;image-rendering:pixelated;flex-shrink:0;">
                <span style="font-family:${fontFamily};font-size:13px;line-height:16px;">Edit Script</span>
            </div>
            <div id="scriptEditorContainer" style="flex:1;min-height:0;position:relative;overflow:hidden;"></div>
            <div id="scriptTestOutput" style="display:none;max-height:80px;overflow-y:auto;background:#111;border-top:1px solid #333;padding:4px 8px;font-family:monospace;font-size:11px;flex-shrink:0;"></div>
            <div style="padding:8px 12px;background:#353535;border-top:1px solid #0a0a0a;display:flex;justify-content:flex-end;gap:8px;flex-shrink:0;">
                <button id="scriptTest" style="${_btnStyle}margin-right:auto;">&#9654; Test</button>
                <button id="scriptCancel" style="${_btnStyle}">Cancel</button>
                <button id="scriptSave" style="background:#2a6496;border:1px solid #1a4a70;border-top:1px solid #3a74a6;color:#fff;padding:4px 14px;cursor:pointer;font-family:${fontFamily};font-size:12px;">Save</button>
            </div>
        `;
        dialog.appendChild(content);
        document.body.appendChild(dialog);
        const scriptContainer = content.querySelector("#scriptEditorContainer");
        let scriptEditorInstance = null;
        let scriptFallback = null;
        const getScriptValue = () => scriptEditorInstance ? scriptEditorInstance.getValue() : (scriptFallback ? scriptFallback.value : "");
        createMonacoEditor(scriptContainer, currentAnimation.script || "", 'graalscript').then(ed => {
            if (ed) { scriptEditorInstance = ed; ed.focus(); }
            else {
                scriptFallback = document.createElement("textarea");
                scriptFallback.value = currentAnimation.script || "";
                scriptFallback.style.cssText = "width:100%;height:100%;background:#444;color:#eee;border:none;padding:8px;font-family:monospace;font-size:12px;resize:none;outline:none;box-sizing:border-box;";
                scriptContainer.appendChild(scriptFallback);
                scriptFallback.focus();
            }
        });
        content.querySelector("#scriptCancel").onclick = () => { if (scriptEditorInstance) scriptEditorInstance.dispose(); document.body.removeChild(dialog); };
        content.querySelector("#scriptSave").onclick = () => { currentAnimation.script = getScriptValue(); if (scriptEditorInstance) scriptEditorInstance.dispose(); document.body.removeChild(dialog); };
        content.querySelector("#scriptTest").onclick = () => {
            const code = getScriptValue();
            const out = content.querySelector('#scriptTestOutput');
            const errs = (() => {
                const markers = []; let i = 0, len = code.length, line = 1, col = 1;
                const braces = [], parens = [], brackets = [];
                const err = (msg, sl, sc) => markers.push({ message: msg, startLine: sl, startCol: sc });
                const adv = () => { const c = code[i++]; c === '\n' ? (line++, col = 1) : col++; return c; };
                const ws = () => { while (i < len && /[ \t\r]/.test(code[i])) adv(); };
                while (i < len) {
                    const [sl, sc, ch] = [line, col, code[i]];
                    if (ch === '/' && code[i+1] === '*') { adv(); adv(); let ok = false; while (i < len) { if (code[i]==='*'&&code[i+1]==='/') { adv(); adv(); ok=true; break; } adv(); } if (!ok) err('Unclosed block comment', sl, sc); }
                    else if (ch === '/' && code[i+1] === '/') { while (i < len && code[i] !== '\n') adv(); }
                    else if (ch === '"' || ch === "'") { const q = adv(); let ok = false; while (i < len) { if (code[i]==='\\') { adv(); i < len && adv(); continue; } if (code[i]===q) { adv(); ok=true; break; } if (code[i]==='\n') break; adv(); } if (!ok) err('Unclosed string literal', sl, sc); }
                    else if (ch === '{') { braces.push([sl,sc]); adv(); } else if (ch === '}') { braces.length ? braces.pop() : err("Unexpected '}'", sl, sc); adv(); }
                    else if (ch === '(') { parens.push([sl,sc]); adv(); } else if (ch === ')') { parens.length ? parens.pop() : err("Unexpected ')'", sl, sc); adv(); }
                    else if (ch === '[') { brackets.push([sl,sc]); adv(); } else if (ch === ']') { brackets.length ? brackets.pop() : err("Unexpected ']'", sl, sc); adv(); }
                    else if (/[a-zA-Z_$]/.test(ch)) { let w = ''; const [wl,wc] = [sl,sc]; while (i < len && /[\w$]/.test(code[i])) w += adv(); if (['if','while','for'].includes(w)) { ws(); if (i >= len || code[i] !== '(') err(`'${w}' missing '('`, wl, wc); } else if (w === 'function') { ws(); if (i < len && /[a-zA-Z_$]/.test(code[i])) { while (i < len && /[\w$]/.test(code[i])) adv(); ws(); } if (i >= len || code[i] !== '(') err("'function' missing '('", wl, wc); } }
                    else adv();
                }
                braces.forEach(([sl,sc]) => err("Unclosed '{'", sl, sc));
                parens.forEach(([sl,sc]) => err("Unclosed '('", sl, sc));
                brackets.forEach(([sl,sc]) => err("Unclosed '['", sl, sc));
                const blockHeaders = /^\s*(if|else\s*if|elseif|while|for|function|switch|case|default|else|do|try|catch|finally)\b/i;
                code.split('\n').forEach((rawLine, li) => { let ln = rawLine; const ci = ln.indexOf('//'); if (ci >= 0) ln = ln.substring(0, ci); ln = ln.replace(/"(?:[^"\\]|\\.)*"/g, '""').replace(/'(?:[^'\\]|\\.)*'/g, "''"); const tr = ln.trim(); if (!tr || /^[{}]/.test(tr) || /[{};,\\]$/.test(tr) || /^\/\//.test(tr) || blockHeaders.test(tr)) return; if (/\)\s*$/.test(tr)) err("Statement possibly missing ';'", li + 1, ln.trimEnd().length); });
                return markers;
            })();
            out.style.display = 'block';
            if (!errs.length) { out.style.color = '#4c4'; out.textContent = 'No syntax errors found.'; return; }
            out.style.color = '#f88';
            out.innerHTML = errs.map(e => `<div>Line ${e.startLine}: ${e.message}</div>`).join('');
        };
        dialog.onclick = (e) => { if (e.target === dialog) { if (scriptEditorInstance) scriptEditorInstance.dispose(); document.body.removeChild(dialog); } };
    };
    document.getElementById("btnAttachmentBack").onclick = () => {
        if (!editingSprite) return;
        if (selectedAttachedSprite >= 0 && selectedAttachedSprite < editingSprite.attachedSprites.length) {
            const oldState = serializeAnimationState();
            if (selectedAttachedSprite === editingSprite.m_drawIndex) {
                editingSprite.m_drawIndex++;
            } else {
                if (selectedAttachedSprite > 0) {
                    const temp = editingSprite.attachedSprites[selectedAttachedSprite];
                    editingSprite.attachedSprites[selectedAttachedSprite] = editingSprite.attachedSprites[selectedAttachedSprite - 1];
                    editingSprite.attachedSprites[selectedAttachedSprite - 1] = temp;
                    selectedAttachedSprite--;
                }
            }
            const newState = serializeAnimationState();
            addUndoCommand({
                oldState,
                newState,
                description: `Move attachment backward`
            });
            redraw();
            drawSpritePreview();
        }
    };
    document.getElementById("btnAttachmentForward").onclick = () => {
        if (!editingSprite) return;
        if (selectedAttachedSprite >= 0 && selectedAttachedSprite < editingSprite.attachedSprites.length) {
            const oldState = serializeAnimationState();
            if (selectedAttachedSprite + 1 === editingSprite.m_drawIndex) {
                editingSprite.m_drawIndex--;
            } else {
                if (selectedAttachedSprite < editingSprite.attachedSprites.length - 1) {
                    const temp = editingSprite.attachedSprites[selectedAttachedSprite];
                    editingSprite.attachedSprites[selectedAttachedSprite] = editingSprite.attachedSprites[selectedAttachedSprite + 1];
                    editingSprite.attachedSprites[selectedAttachedSprite + 1] = temp;
                    selectedAttachedSprite++;
                }
            }
            const newState = serializeAnimationState();
            addUndoCommand({
                oldState,
                newState,
                description: `Move attachment forward`
            });
            redraw();
            drawSpritePreview();
        }
    };
    function getPreviewCanvasPos(e) {
        const rect = spritePreviewCanvas.getBoundingClientRect();
        const scale = Math.pow(1.2, spritePreviewZoom - 3);
        const canvasX = (e.clientX - rect.left) * (spritePreviewCanvas.width / rect.width);
        const canvasY = (e.clientY - rect.top) * (spritePreviewCanvas.height / rect.height);
        const centerX = spritePreviewCanvas.width / 2;
        const centerY = spritePreviewCanvas.height / 2;
        const previewX = (canvasX - centerX - spritePreviewPanX) / scale;
        const previewY = (canvasY - centerY - spritePreviewPanY) / scale;
        const spriteTopLeftX = -editingSprite.width / 2;
        const spriteTopLeftY = -editingSprite.height / 2;
        return {x: previewX - spriteTopLeftX, y: previewY - spriteTopLeftY};
    }
    function pointInBoundingBox(point, bbox, offset) {
        const x = point.x - offset.x;
        const y = point.y - offset.y;
        return x >= bbox.x && x <= bbox.x + bbox.width && y >= bbox.y && y <= bbox.y + bbox.height;
    }
    spritePreviewCanvas.onmousedown = (e) => {
        if (!editingSprite) return;
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        const pos = getPreviewCanvasPos(e);
        if (e.button === 2) {
            if (insertPiece) {
                insertPiece = null; insertPieces = [];
                drawSpritePreview();
                return;
            }
            spritePreviewPanning = true;
            spritePreviewPanStartX = e.clientX;
            spritePreviewPanStartY = e.clientY;
            spritePreviewPanStartPanX = spritePreviewPanX;
            spritePreviewPanStartPanY = spritePreviewPanY;
            spritePreviewCanvas.style.cursor = "grabbing";
            return;
        }
        if (e.button === 0) {
            if (insertPiece && insertPiece.spriteIndex !== undefined && !isPlacingAttachment) {
                isPlacingAttachment = true;
                const spriteIndex = insertPiece.spriteIndex;
                const insertOffset = {x: Math.floor(0.5 + insertPiece.xoffset), y: Math.floor(0.5 + insertPiece.yoffset)};
                insertPiece = null;
                selectedAttachedSprite = -1;
                const oldState = serializeAnimationState();
                editingSprite.attachedSprites.push({
                    index: spriteIndex,
                    offset: insertOffset
                });
                const newState = serializeAnimationState();
                addUndoCommand({oldState, newState, description: `Add sprite attachment ${spriteIndex}`});
                redraw();
                setTimeout(() => { isPlacingAttachment = false; }, 100);
                return;
            }
            if (editingSprite.attachedSprites.length > 0) {
                for (let i = editingSprite.attachedSprites.length - 1; i >= 0; i--) {
                    const attached = editingSprite.attachedSprites[i];
                    const attachedSprite = currentAnimation.getAniSprite(attached.index, "");
                    if (attachedSprite) {
                        const attachedDrawX = attached.offset.x;
                        const attachedDrawY = attached.offset.y;
                        const bbox = attachedSprite.boundingBox;
                        const x = pos.x - (attachedDrawX + bbox.x);
                        const y = pos.y - (attachedDrawY + bbox.y);
                        if (x >= 0 && x <= bbox.width && y >= 0 && y <= bbox.height) {
                            selectedAttachedSprite = i;
                            attachedSpriteStartMove = {...attached.offset};
                            attachedSprite.dragOffset = {x: pos.x - attached.offset.x, y: pos.y - attached.offset.y};
                            drawSpritePreview();
                            return;
                        }
                    }
                }
            }
            selectedAttachedSprite = -1;
            drawSpritePreview();
        }
    };
    spritePreviewCanvas.onmousemove = (e) => {
        if (!editingSprite) return;
        if (spritePreviewPanning) {
            spritePreviewPanX = spritePreviewPanStartPanX + (e.clientX - spritePreviewPanStartX);
            spritePreviewPanY = spritePreviewPanStartPanY + (e.clientY - spritePreviewPanStartY);
            drawSpritePreview();
            return;
        }
        if (isPlacingAttachment) return;
        const pos = getPreviewCanvasPos(e);
        if (insertPiece && insertPiece.dragOffset) {
            insertPiece.xoffset = pos.x - insertPiece.dragOffset.x;
            insertPiece.yoffset = pos.y - insertPiece.dragOffset.y;
            drawSpritePreview();
            return;
        }
        if (e.buttons === 1 && selectedAttachedSprite >= 0 && selectedAttachedSprite < editingSprite.attachedSprites.length) {
            const attached = editingSprite.attachedSprites[selectedAttachedSprite];
            const attachedSprite = currentAnimation.getAniSprite(attached.index, "");
            if (attachedSprite && attachedSprite.dragOffset) {
                attached.offset = {
                    x: Math.floor(0.5 + pos.x - attachedSprite.dragOffset.x),
                    y: Math.floor(0.5 + pos.y - attachedSprite.dragOffset.y)
                };
                drawSpritePreview();
            }
        }
    };
    spritePreviewCanvas.onmouseup = (e) => {
        if (!editingSprite) return;
        if (e.button === 2 && spritePreviewPanning) {
            spritePreviewPanning = false;
            spritePreviewCanvas.style.cursor = "default";
            return;
        }
        if (e.button === 0 && selectedAttachedSprite >= 0 && selectedAttachedSprite < editingSprite.attachedSprites.length && attachedSpriteStartMove) {
            const attached = editingSprite.attachedSprites[selectedAttachedSprite];
            if (attached.offset.x !== attachedSpriteStartMove.x || attached.offset.y !== attachedSpriteStartMove.y) {
                const oldState = serializeAnimationState();
                attached.offset = {...attached.offset};
                const newState = serializeAnimationState();
                addUndoCommand({
                    oldState,
                    newState,
                    description: `Move sprite attachment ${attached.index}`
                });
                attachedSpriteStartMove = null;
                redraw();
            }
        }
    };
    spritePreviewCanvas.oncontextmenu = (e) => {
        e.preventDefault();
    };
    spritePreviewCanvas.addEventListener("wheel", (e) => {
        if (!editingSprite) return;
        if (spritePreviewPanning) return;
        e.preventDefault();
        e.stopPropagation();
        const width = spritePreviewCanvas.width;
        const height = spritePreviewCanvas.height;
        const rect = spritePreviewCanvas.getBoundingClientRect();
        const canvasX = (e.clientX - rect.left) * (spritePreviewCanvas.width / rect.width);
        const canvasY = (e.clientY - rect.top) * (spritePreviewCanvas.height / rect.height);
        const centerX = width / 2;
        const centerY = height / 2;
        const oldScale = Math.pow(1.2, spritePreviewZoom - 3);
        const oldWorldX = (canvasX - centerX - spritePreviewPanX) / oldScale;
        const oldWorldY = (canvasY - centerY - spritePreviewPanY) / oldScale;
        const delta = e.deltaY > 0 ? -1 : 1;
        spritePreviewZoom = Math.max(0, Math.min(10, spritePreviewZoom + delta));
        const newScale = Math.pow(1.2, spritePreviewZoom - 3);
        const newWorldX = (canvasX - centerX - spritePreviewPanX) / newScale;
        const newWorldY = (canvasY - centerY - spritePreviewPanY) / newScale;
        spritePreviewPanX += (newWorldX - oldWorldX) * newScale;
        spritePreviewPanY += (newWorldY - oldWorldY) * newScale;
        drawSpritePreview();
    });
    spritePreviewCanvas.addEventListener("keydown", (e) => {
        if (!editingSprite) return;
        if (e.key === "Delete" && selectedAttachedSprite >= 0 && selectedAttachedSprite < editingSprite.attachedSprites.length) {
            const oldState = serializeAnimationState();
            const deleted = editingSprite.attachedSprites.splice(selectedAttachedSprite, 1)[0];
            if (selectedAttachedSprite < editingSprite.m_drawIndex) {
                editingSprite.m_drawIndex--;
            }
            selectedAttachedSprite = -1;
            const newState = serializeAnimationState();
            addUndoCommand({
                oldState,
                newState,
                description: `Delete sprite attachment ${deleted.index}`
            });
            redraw();
            drawSpritePreview();
        }
    });
    spritePreviewCanvas.tabIndex = 0;
    document.getElementById("btnItemUp").onclick = () => {
        const frame = currentAnimation.getFrame(currentFrame);
        if (!frame) return;
        const actualDir = getDirIndex(currentDir);
        const pieces = frame.pieces[actualDir] || [];
        const pieceId = document.getElementById("itemsCombo").value;
        const piece = pieces.find(p => p.id === pieceId);
        if (piece) {
            piece.yoffset -= 1;
            document.getElementById("itemY").value = piece.yoffset;
            redraw();
            saveSession();
        }
    };
    document.getElementById("btnItemDown").onclick = () => {
        const frame = currentAnimation.getFrame(currentFrame);
        if (!frame) return;
        const actualDir = getDirIndex(currentDir);
        const pieces = frame.pieces[actualDir] || [];
        const pieceId = document.getElementById("itemsCombo").value;
        const piece = pieces.find(p => p.id === pieceId);
        if (piece) {
            piece.yoffset += 1;
            document.getElementById("itemY").value = piece.yoffset;
            redraw();
            saveSession();
        }
    };
    document.getElementById("btnItemLeft").onclick = () => {
        const frame = currentAnimation.getFrame(currentFrame);
        if (!frame) return;
        const actualDir = getDirIndex(currentDir);
        const pieces = frame.pieces[actualDir] || [];
        const pieceId = document.getElementById("itemsCombo").value;
        const piece = pieces.find(p => p.id === pieceId);
        if (piece) {
            piece.xoffset -= 1;
            document.getElementById("itemX").value = piece.xoffset;
            redraw();
            saveSession();
        }
    };
    document.getElementById("btnItemRight").onclick = () => {
        const frame = currentAnimation.getFrame(currentFrame);
        if (!frame) return;
        const actualDir = getDirIndex(currentDir);
        const pieces = frame.pieces[actualDir] || [];
        const pieceId = document.getElementById("itemsCombo").value;
        const piece = pieces.find(p => p.id === pieceId);
        if (piece) {
            piece.xoffset += 1;
            document.getElementById("itemX").value = piece.xoffset;
            redraw();
            saveSession();
        }
    };
    document.getElementById("btnItemLayerUp").onclick = () => {
        const frame = currentAnimation.getFrame(currentFrame);
        if (!frame) return;
        const actualDir = getDirIndex(currentDir);
        const pieces = frame.pieces[actualDir] || [];
        const pieceId = document.getElementById("itemsCombo").value;
        const pieceIndex = pieces.findIndex(p => p.id === pieceId);
        if (pieceIndex >= 0 && pieceIndex < pieces.length - 1) {
            const piece = pieces[pieceIndex];
            pieces.splice(pieceIndex, 1);
            pieces.splice(pieceIndex + 1, 0, piece);
            redraw();
            updateItemsCombo();
            updateItemSettings();
            saveSession();
        }
    };
    document.getElementById("btnItemLayerDown").onclick = () => {
        const frame = currentAnimation.getFrame(currentFrame);
        if (!frame) return;
        const actualDir = getDirIndex(currentDir);
        const pieces = frame.pieces[actualDir] || [];
        const pieceId = document.getElementById("itemsCombo").value;
        const pieceIndex = pieces.findIndex(p => p.id === pieceId);
        if (pieceIndex > 0) {
            const piece = pieces[pieceIndex];
            pieces.splice(pieceIndex, 1);
            pieces.splice(pieceIndex - 1, 0, piece);
            redraw();
            updateItemsCombo();
            updateItemSettings();
            saveSession();
        }
    };
    document.getElementById("itemSpriteID").onchange = (e) => {
        const pieceId = document.getElementById("itemsCombo").value;
        const frame = currentAnimation.getFrame(currentFrame);
        if (!frame || !pieceId) return;
        const actualDir = getDirIndex(currentDir);
        const pieces = frame.pieces[actualDir] || [];
        const piece = pieces.find(p => p.id === pieceId);
        if (piece && piece.type === "sprite") {
            const value = e.target.value;
            const spriteIndex = parseInt(value);
            if (!isNaN(spriteIndex)) {
                piece.spriteIndex = spriteIndex;
                piece.spriteName = "";
            } else {
                piece.spriteIndex = SPRITE_INDEX_STRING;
                piece.spriteName = value;
            }
            redraw();
            updateItemsCombo();
        }
    };
    mainCanvas.addEventListener("wheel", (e) => {
        if (isPanning) return;
        e.preventDefault();
        e.stopPropagation();
        const width = mainCanvas.width / dpr;
        const height = mainCanvas.height / (window.devicePixelRatio || 1);
        const oldZoom = zoomFactors[zoomLevel] || 1.0;
        const rect = mainCanvas.getBoundingClientRect();
        const adjustedMouseX = adjustCoordinateForUIScale(e.clientX, rect.left, rect, false);
        const adjustedMouseY = adjustCoordinateForUIScale(e.clientY, rect.top, rect, true);
        let oldWorldX, oldWorldY;
        if (splitViewEnabled && !currentAnimation.singleDir) {
            const quadWidth = width / 2;
            const quadHeight = height / 2;
            const quadIndex = Math.floor(adjustedMouseY / quadHeight) * 2 + Math.floor(adjustedMouseX / quadWidth);
            const quadX = (quadIndex % 2) * quadWidth;
            const quadY = Math.floor(quadIndex / 2) * quadHeight;
            oldWorldX = (adjustedMouseX - quadX - quadWidth / 2 - panX) / oldZoom;
            oldWorldY = (adjustedMouseY - quadY - quadHeight / 2 - panY) / oldZoom;
        } else {
            oldWorldX = (adjustedMouseX - width / 2 - panX) / oldZoom;
            oldWorldY = (adjustedMouseY - height / 2 - panY) / oldZoom;
        }
        const delta = e.deltaY > 0 ? -1 : 1;
        zoomLevel = Math.max(0, Math.min(zoomFactors.length - 1, zoomLevel + delta));
        localStorage.setItem("mainCanvasZoom", zoomLevel);
        updateMainCanvasZoomDisplay();
        const newZoom = zoomFactors[zoomLevel] || 1.0;
        let newWorldX, newWorldY;
        if (splitViewEnabled && !currentAnimation.singleDir) {
            const quadWidth = width / 2;
            const quadHeight = height / 2;
            const quadIndex = Math.floor(adjustedMouseY / quadHeight) * 2 + Math.floor(adjustedMouseX / quadWidth);
            const quadX = (quadIndex % 2) * quadWidth;
            const quadY = Math.floor(quadIndex / 2) * quadHeight;
            newWorldX = (adjustedMouseX - quadX - quadWidth / 2 - panX) / newZoom;
            newWorldY = (adjustedMouseY - quadY - quadHeight / 2 - panY) / newZoom;
        } else {
            newWorldX = (adjustedMouseX - width / 2 - panX) / newZoom;
            newWorldY = (adjustedMouseY - height / 2 - panY) / newZoom;
        }
        const deltaX = newWorldX - oldWorldX;
        const deltaY = newWorldY - oldWorldY;
        panX -= deltaX * newZoom;
        panY -= deltaY * newZoom;
        redraw();
    }, { passive: false });

    let initialPinchDistance = null;
    let initialZoomLevel = null;
    let initialPanX = null;
    let initialPanY = null;

    let twoFingerPanStart = null;
    let twoFingerPanInitialPanX = null;
    let twoFingerPanInitialPanY = null;

    mainCanvas.addEventListener("touchstart", (e) => {
        if (e.touches.length === 2) {
            e.preventDefault();
            isBoxSelecting = false;
            boxSelectStart = null;
            boxSelectEnd = null;
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            initialPinchDistance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
            initialZoomLevel = zoomLevel;
            initialPanX = panX;
            initialPanY = panY;
            twoFingerPanStart = {
                x: (touch1.clientX + touch2.clientX) / 2,
                y: (touch1.clientY + touch2.clientY) / 2
            };
            twoFingerPanInitialPanX = panX;
            twoFingerPanInitialPanY = panY;
        }
    }, { passive: false });

    mainCanvas.addEventListener("touchmove", (e) => {
        if (e.touches.length === 2) {
            e.preventDefault();
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const currentCenterX = (touch1.clientX + touch2.clientX) / 2;
            const currentCenterY = (touch1.clientY + touch2.clientY) / 2;
            const currentDistance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
            const rect = mainCanvas.getBoundingClientRect();
            const width = mainCanvas.width / (window.devicePixelRatio || 1);
            const height = mainCanvas.height / (window.devicePixelRatio || 1);

            if (initialPinchDistance !== null && twoFingerPanStart) {
                const oldZoom = zoomFactors[zoomLevel] || 1.0;
                const zoomRatio = currentDistance / initialPinchDistance;
                const newZoomLevel = Math.max(0, Math.min(zoomFactors.length - 1, initialZoomLevel + Math.log2(zoomRatio)));
                zoomLevel = Math.round(newZoomLevel);
                localStorage.setItem("mainCanvasZoom", zoomLevel);
                const newZoom = zoomFactors[zoomLevel] || 1.0;

                const initialCenterScreenX = twoFingerPanStart.x - rect.left;
                const initialCenterScreenY = twoFingerPanStart.y - rect.top;
                const currentCenterScreenX = currentCenterX - rect.left;
                const currentCenterScreenY = currentCenterY - rect.top;

                const worldXAtInitial = (initialCenterScreenX - width / 2 - initialPanX) / oldZoom;
                const worldYAtInitial = (initialCenterScreenY - height / 2 - initialPanY) / oldZoom;

                const centerDeltaX = currentCenterScreenX - initialCenterScreenX;
                const centerDeltaY = currentCenterScreenY - initialCenterScreenY;

                const zoomAdjustedPanX = currentCenterScreenX - width / 2 - worldXAtInitial * newZoom;
                const zoomAdjustedPanY = currentCenterScreenY - height / 2 - worldYAtInitial * newZoom;

                panX = zoomAdjustedPanX;
                panY = zoomAdjustedPanY;
            } else if (twoFingerPanStart && twoFingerPanInitialPanX !== null && twoFingerPanInitialPanY !== null) {
                const deltaX = currentCenterX - twoFingerPanStart.x;
                const deltaY = currentCenterY - twoFingerPanStart.y;
                panX = twoFingerPanInitialPanX + deltaX;
                panY = twoFingerPanInitialPanY + deltaY;
            }

            redraw();
        }
    }, { passive: false });

    mainCanvas.addEventListener("touchend", (e) => {
        if (e.touches.length < 2) {
            initialPinchDistance = null;
            initialZoomLevel = null;
            initialPanX = null;
            initialPanY = null;
            twoFingerPanStart = null;
            twoFingerPanInitialPanX = null;
            twoFingerPanInitialPanY = null;
        }
    }, { passive: false });

    function addWheelHandler(selector, onChange, step = 1) {
        const el = document.querySelector(selector);
        if (!el) return;
        let hoverTimer = null;
        let isHoverActive = false;
        el.addEventListener("mouseenter", () => {
            hoverTimer = setTimeout(() => {
                isHoverActive = true;
                hoverTimer = null;
            }, 350);
        });
        el.addEventListener("mouseleave", () => {
            if (hoverTimer) {
                clearTimeout(hoverTimer);
                hoverTimer = null;
            }
            isHoverActive = false;
        });
        el.addEventListener("wheel", (e) => {
            if (e.target.closest("#mainCanvas") || el.disabled || !isHoverActive) return;
            e.preventDefault();
            e.stopPropagation();
            const delta = e.deltaY < 0 ? step : -step;
            const current = parseFloat(el.value) || 0;
            const min = parseFloat(el.min) || -Infinity;
            const max = parseFloat(el.max) || Infinity;
            const newValue = Math.max(min, Math.min(max, current + delta));
            el.value = newValue;
            if (onChange) onChange({target: el});
        }, {passive: false});
    }
    addWheelHandler("#xScale", (e) => document.getElementById("xScale").onchange(e));
    addWheelHandler("#yScale", (e) => document.getElementById("yScale").onchange(e));
    addWheelHandler("#rotation", (e) => document.getElementById("rotation").onchange(e));
    addWheelHandler("#itemXScale", (e) => document.getElementById("itemXScale").onchange(e));
    addWheelHandler("#itemYScale", (e) => document.getElementById("itemYScale").onchange(e));
    addWheelHandler("#itemRotation", (e) => document.getElementById("itemRotation").onchange(e));
    addWheelHandler("#itemX", (e) => document.getElementById("itemX").onchange(e), 0.1);
    addWheelHandler("#itemY", (e) => document.getElementById("itemY").onchange(e), 0.1);
    addWheelHandler("#duration", (e) => document.getElementById("duration").onchange(e), 10);
    addWheelHandler("#spriteLeft", (e) => document.getElementById("spriteLeft").onchange(e));
    addWheelHandler("#spriteTop", (e) => document.getElementById("spriteTop").onchange(e));
    addWheelHandler("#spriteWidth", (e) => document.getElementById("spriteWidth").onchange(e));
    addWheelHandler("#spriteHeight", (e) => document.getElementById("spriteHeight").onchange(e));
    addWheelHandler("#xScaleSlider", (e) => document.getElementById("xScaleSlider").oninput(e), 0.1);
    addWheelHandler("#yScaleSlider", (e) => document.getElementById("yScaleSlider").oninput(e), 0.1);
    addWheelHandler("#rotationSlider", (e) => document.getElementById("rotationSlider").oninput(e), 1);
    addWheelHandler("#itemXScaleSlider", (e) => document.getElementById("itemXScaleSlider").oninput(e), 0.1);
    addWheelHandler("#itemYScaleSlider", (e) => document.getElementById("itemYScaleSlider").oninput(e), 0.1);
    addWheelHandler("#itemRotationSlider", (e) => document.getElementById("itemRotationSlider").oninput(e), 1);
    addWheelHandler("#itemLayer", (e) => document.getElementById("itemLayer").onchange(e));
    let isPanning = false;
    let panStartX = 0, panStartY = 0;
    const getUIScale = () => {
        return parseFloat(localStorage.getItem("editorUIScale") || "1");
    };
    const adjustCoordinateForUIScale = (clientCoord, rectCoord, rect, isY = false) => {
        const visualCoord = clientCoord - rectCoord;
        const logicalSize = isY ? (mainCanvas.height / (window.devicePixelRatio || 1)) : (mainCanvas.width / (window.devicePixelRatio || 1));
        const visualSize = isY ? rect.height : rect.width;
        return visualCoord * (logicalSize / visualSize);
    };
    const _updateBoxSelection = (x, y) => {
        if (!boxSelectStart || !currentAnimation) return;
        const frame = currentAnimation.getFrame(currentFrame);
        if (!frame) return;
        let dirToUse = currentDir;
        if (splitViewEnabled && !currentAnimation.singleDir && boxSelectQuadrant >= 0) dirToUse = [0,1,2,3][Math.min(3, Math.max(0, boxSelectQuadrant))];
        const actualDir = getDirIndex(dirToUse);
        const pieces = frame.pieces[actualDir] || [];
        const minX = Math.min(boxSelectStart.x, x), maxX = Math.max(boxSelectStart.x, x);
        const minY = Math.min(boxSelectStart.y, y), maxY = Math.max(boxSelectStart.y, y);
        selectedPieces.clear();
        for (const piece of pieces) {
            const bb = piece.getBoundingBox(currentAnimation);
            const cx = bb.x + bb.width / 2, cy = bb.y + bb.height / 2;
            if (cx >= minX && cx <= maxX && cy >= minY && cy <= maxY) selectedPieces.add(piece);
        }
        if (frame.sounds) for (const sound of frame.sounds) {
            if (sound.xoffset >= minX && sound.xoffset <= maxX && sound.yoffset >= minY && sound.yoffset <= maxY) selectedPieces.add(sound);
        }
        updateItemsCombo();
        updateItemSettings();
    };
    let _hitCanvas = null, _hitCtx = null;
    function pieceHitsPoint(piece, wx, wy) {
        const bb = piece.getBoundingBox(currentAnimation);
        if (wx < bb.x || wx >= bb.x + bb.width || wy < bb.y || wy >= bb.y + bb.height) return false;
        if (piece.type !== "sprite") return true;
        const sprite = currentAnimation.getAniSprite(piece.spriteIndex, piece.spriteName || "");
        if (!sprite) return true;
        const img = getSpriteImage(sprite);
        if (!img) return true;
        if (!_hitCanvas) { _hitCanvas = document.createElement("canvas"); _hitCanvas.width = 1; _hitCanvas.height = 1; _hitCtx = _hitCanvas.getContext("2d"); }
        _hitCtx.clearRect(0, 0, 1, 1);
        _hitCtx.save();
        _hitCtx.imageSmoothingEnabled = false;
        _hitCtx.translate(Math.round(piece.xoffset) - wx, Math.round(piece.yoffset) - wy);
        const _pz = piece._zoom || 1.0, _px = piece.xscale * _pz, _py = piece.yscale * _pz;
        if (piece.rotation !== 0 || _px !== 1 || _py !== 1) {
            const sz = piece.getSize(currentAnimation);
            _hitCtx.translate(sz.width / 2, sz.height / 2);
            _hitCtx.scale(_px, _py);
            _hitCtx.rotate(piece.rotation * Math.PI / 180);
            _hitCtx.translate(-sz.width / 2, -sz.height / 2);
        }
        drawSprite(_hitCtx, sprite, 0, 0);
        _hitCtx.restore();
        return _hitCtx.getImageData(0, 0, 1, 1).data[3] > 10;
    }
    mainCanvas.onmousedown = (e) => {
        const rect = mainCanvas.getBoundingClientRect();
        const uiScale = getUIScale();
        const logicalWidth = mainCanvas.width / (window.devicePixelRatio || 1);
        const logicalHeight = mainCanvas.height / (window.devicePixelRatio || 1);
        const visualWidth = rect.width;
        const visualHeight = rect.height;
        const zoom = zoomFactors[zoomLevel] || 1.0;
        const adjustedX = adjustCoordinateForUIScale(e.clientX, rect.left, rect, false);
        const adjustedY = adjustCoordinateForUIScale(e.clientY, rect.top, rect, true);
        let x, y;
        if (splitViewEnabled && !currentAnimation.singleDir) {
            const quadWidth = logicalWidth / 2;
            const quadHeight = logicalHeight / 2;
            const quadIndex = Math.floor(adjustedY / quadHeight) * 2 + Math.floor(adjustedX / quadWidth);
            const quadX = (quadIndex % 2) * quadWidth;
            const quadY = Math.floor(quadIndex / 2) * quadHeight;
            x = (adjustedX - quadX - quadWidth / 2 - panX) / zoom;
            y = (adjustedY - quadY - quadHeight / 2 - panY) / zoom;
        } else {
            x = (adjustedX - logicalWidth / 2 - panX) / zoom;
            y = (adjustedY - logicalHeight / 2 - panY) / zoom;
        }
        if (e.button === 2) {
            let _overSprite = false;
            if (currentAnimation) {
                const frame = currentAnimation.getFrame(currentFrame);
                if (frame) {
                    const actualDir2 = getDirIndex(currentDir);
                    const pieces2 = frame.pieces[actualDir2] || [];
                    for (let i = pieces2.length - 1; i >= 0; i--) {
                        if (pieceHitsPoint(pieces2[i], x, y)) { _overSprite = true; break; }
                    }
                }
            }
            if (!_overSprite) {
                isRightClickPanning = true;
                rightClickPanStartX = e.clientX;
                rightClickPanStartY = e.clientY;
                rightClickPanStartPanX = panX;
                rightClickPanStartPanY = panY;
                mainCanvas.style.cursor = "grabbing";
                e.preventDefault();
            }
        } else if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
            if (e.button === 0 && e.ctrlKey && currentAnimation) {
                const frame = currentAnimation.getFrame(currentFrame);
                if (frame) {
                    let dirToUse = currentDir;
                    if (splitViewEnabled && !currentAnimation.singleDir) {
                        const quadWidth = logicalWidth / 2;
                        const quadHeight = logicalHeight / 2;
                        const quadIndex = Math.floor(adjustedY / quadHeight) * 2 + Math.floor(adjustedX / quadWidth);
                        dirToUse = Math.min(3, Math.max(0, quadIndex));
                    }
                    const actualDir = getDirIndex(dirToUse);
                    const pieces = frame.pieces[actualDir] || [];
                    let hitPiece = null;
                    for (let i = pieces.length - 1; i >= 0; i--) {
                        if (pieceHitsPoint(pieces[i], x, y)) { hitPiece = pieces[i]; break; }
                    }
                    if (hitPiece) {
                        if (selectedPieces.has(hitPiece)) selectedPieces.delete(hitPiece); else { selectedPieces.add(hitPiece); selectedPieceDir = actualDir; }
                        updateItemsCombo(); updateItemSettings(); redraw(); return;
                    }
                }
            }
            isPanning = true;
            panStartX = e.clientX - panX;
            panStartY = e.clientY - panY;
            mainCanvas.style.cursor = "grabbing";
        } else if (e.button === 0) {
            if (insertPiece) {
                const frame = currentAnimation.getFrame(currentFrame);
                if (frame) {
                    let dirToUse = currentDir;
                    if (splitViewEnabled && !currentAnimation.singleDir) {
                        const quadWidth = logicalWidth / 2;
                        const quadHeight = logicalHeight / 2;
                        const quadIndex = Math.floor(adjustedY / quadHeight) * 2 + Math.floor(adjustedX / quadWidth);
                        dirToUse = Math.min(3, Math.max(0, quadIndex));
                    }
                    const actualDir = getDirIndex(dirToUse);
                    const sprite = currentAnimation.getAniSprite(insertPiece.spriteIndex, insertPiece.spriteName);
                    const expectedImage = sprite ? (sprite.type === "CUSTOM" ? sprite.customImageName : currentAnimation.getDefaultImageName(sprite.type)) : "unknown";
                    const actualImage = sprite ? getSpriteImage(sprite) : null;
                    const actualImageName = actualImage ? (sprite.type === "CUSTOM" ? sprite.customImageName : currentAnimation.getDefaultImageName(sprite.type)) : "null";
                    f12Log(`Placing sprite: index=${insertPiece.spriteIndex}, type=${sprite ? sprite.type : "null"}, expectedImage="${expectedImage}", actualImage="${actualImageName}", hasImage=${!!actualImage}`);
                    insertPiece.xoffset = Math.floor(0.5 + x - insertPiece.dragOffset.x);
                    insertPiece.yoffset = Math.floor(0.5 + y - insertPiece.dragOffset.y);
                    const oldState = serializeAnimationState();
                    frame.pieces[actualDir].push(insertPiece);
                    selectedPieces.clear();
                    selectedPieces.add(insertPiece);
                    for (const ep of insertPieces) { ep.xoffset = insertPiece.xoffset; ep.yoffset = insertPiece.yoffset; frame.pieces[actualDir].push(ep); selectedPieces.add(ep); }
                    insertPieces = [];
                    const newState = serializeAnimationState();
                    addUndoCommand({
                        description: (() => {
                            const sprite = currentAnimation ? currentAnimation.getAniSprite(insertPiece.spriteIndex, insertPiece.spriteName || "") : null;
                            const spriteName = sprite && sprite.comment ? `"${sprite.comment}"` : `Sprite ${insertPiece.spriteIndex}`;
                            return `Place ${spriteName}`;
                        })(),
                        oldState: oldState,
                        newState: newState,
                        undo: () => restoreAnimationState(oldState),
                        redo: () => restoreAnimationState(newState)
                    });
                    if (splitViewEnabled && !currentAnimation.singleDir) {
                        selectedPieceDir = actualDir;
                        const dirNames = ["UP", "LEFT", "DOWN", "RIGHT"];
                        const dirCombo = document.getElementById("directionCombo");
                        if (dirCombo && dirNames[actualDir]) {
                            const oldHandler = dirCombo.onchange;
                            dirCombo.onchange = null;
                            dirCombo.value = dirNames[actualDir];
                            currentDir = actualDir;
                            const wrapper = dirCombo.closest("div");
                            const button = wrapper ? wrapper.querySelector(".custom-dropdown-button span") : null;
                            if (button) button.textContent = dirNames[actualDir];
                            setTimeout(() => dirCombo.onchange = oldHandler, 0);
                        }
                    }
                    updateItemsCombo();
                    insertPiece = null;
                    mainCanvas.style.cursor = "default";
                    redraw();
                    saveSession();
                    return;
                }
            }
            const frame = currentAnimation.getFrame(currentFrame);
            if (frame) {
                let dirToUse = currentDir;
                if (splitViewEnabled && !currentAnimation.singleDir) {
                    const quadWidth = logicalWidth / 2;
                    const quadHeight = logicalHeight / 2;
                    const quadIndex = Math.floor(adjustedY / quadHeight) * 2 + Math.floor(adjustedX / quadWidth);
                    const directions = [0, 1, 2, 3];
                    dirToUse = directions[Math.min(3, Math.max(0, quadIndex))];
                }
                const actualDir = getDirIndex(dirToUse);
                const pieces = frame.pieces[actualDir] || [];
                let found = false;
                for (let i = pieces.length - 1; i >= 0; i--) {
                    const piece = pieces[i];
                    if (!pieceHitsPoint(piece, x, y)) continue;
                    {
                        if (e.shiftKey) {
                            if (selectedPieces.has(piece)) {
                                selectedPieces.delete(piece);
                            } else {
                                selectedPieces.add(piece);
                            }
                        } else {
                            if (mirroredActionsEnabled) {
                                if (!selectedPieces.has(piece)) {
                                selectedPieces.add(piece);
                            }
                        } else {
                            if (!selectedPieces.has(piece)) {
                                selectedPieces.clear();
                                selectedPieces.add(piece);
                                }
                            }
                        }
                        dragOffset = {x: x - piece.xoffset, y: y - piece.yoffset};
                        dragStartMousePos = {x, y};
                        dragButton = "left";
                        isDragging = true;
                        dragStartState = serializeAnimationState();
                        pieceInitialPositions.clear();
                        for (const p of selectedPieces) {
                            pieceInitialPositions.set(p, {x: p.xoffset, y: p.yoffset});
                        }
                        _dragMoveIndicator = { startPositions: new Map(pieceInitialPositions), pieces: Array.from(selectedPieces) };
                        found = true;
                        if (splitViewEnabled && !currentAnimation.singleDir) {
                            selectedPieceDir = actualDir;
                            const dirNames = ["UP", "LEFT", "DOWN", "RIGHT"];
                            const dirCombo = document.getElementById("directionCombo");
                            if (dirCombo && dirNames[actualDir]) {
                                const oldHandler = dirCombo.onchange;
                                dirCombo.onchange = null;
                                dirCombo.value = dirNames[actualDir];
                                currentDir = actualDir;
                                const wrapper = dirCombo.closest("div");
                                const button = wrapper ? wrapper.querySelector(".custom-dropdown-button span") : null;
                                if (button) button.textContent = dirNames[actualDir];
                                setTimeout(() => dirCombo.onchange = oldHandler, 0);
                            }
                        } else {
                            selectedPieceDir = null;
                        }
                        if (piece.type === "sprite") {
                            const sprite = currentAnimation.getAniSprite(piece.spriteIndex, piece.spriteName);
                            if (sprite) {
                                selectSprite(sprite);
                            }
                        }
                        updateItemsCombo();
                        break;
                    }
                }
                if (!found) {
                    for (const sound of frame.sounds || []) {
                        const dist = Math.sqrt(Math.pow(x - sound.xoffset, 2) + Math.pow(y - sound.yoffset, 2));
                        if (dist <= 8) {
                            if (e.shiftKey) {
                                if (selectedPieces.has(sound)) {
                                    selectedPieces.delete(sound);
                                } else {
                                    selectedPieces.add(sound);
                                }
                            } else {
                                if (!selectedPieces.has(sound)) {
                                    selectedPieces.clear();
                                    selectedPieces.add(sound);
                                }
                            }
                            dragOffset = {x: x - sound.xoffset, y: y - sound.yoffset};
                            dragStartMousePos = {x, y};
                            dragButton = "left";
                            isDragging = true;
                            dragStartState = serializeAnimationState();
                            pieceInitialPositions.clear();
                            for (const p of selectedPieces) {
                                pieceInitialPositions.set(p, {x: p.xoffset, y: p.yoffset});
                            }
                            _dragMoveIndicator = { startPositions: new Map(pieceInitialPositions), pieces: Array.from(selectedPieces) };
                            found = true;
                            if (splitViewEnabled && !currentAnimation.singleDir) {
                                selectedPieceDir = actualDir;
                                const dirNames = ["UP", "LEFT", "DOWN", "RIGHT"];
                                const dirCombo = document.getElementById("directionCombo");
                                if (dirCombo && dirNames[actualDir]) {
                                    const oldHandler = dirCombo.onchange;
                                    dirCombo.onchange = null;
                                    dirCombo.value = dirNames[actualDir];
                                    currentDir = actualDir;
                                    const wrapper = dirCombo.closest("div");
                                    const button = wrapper ? wrapper.querySelector(".custom-dropdown-button span") : null;
                                    if (button) button.textContent = dirNames[actualDir];
                                    setTimeout(() => dirCombo.onchange = oldHandler, 0);
                                }
                            } else {
                                selectedPieceDir = null;
                            }
                            updateItemsCombo();
                            break;
                        }
                    }
                }
                if (!found) {
                    boxSelectStart = {x, y};
                    boxSelectEnd = {x, y};
                    isBoxSelecting = true;
                    if (splitViewEnabled && !currentAnimation.singleDir) {
                        const quadWidth = logicalWidth / 2;
                        const quadHeight = logicalHeight / 2;
                        boxSelectQuadrant = Math.floor(adjustedY / quadHeight) * 2 + Math.floor(adjustedX / quadWidth);
                        const dirNames = ["UP", "LEFT", "DOWN", "RIGHT"];
                        const dirCombo = document.getElementById("directionCombo");
                        if (dirCombo && dirNames[boxSelectQuadrant]) {
                            const oldHandler = dirCombo.onchange;
                            dirCombo.onchange = null;
                            dirCombo.value = dirNames[boxSelectQuadrant];
                            currentDir = boxSelectQuadrant;
                            const wrapper = dirCombo.closest("div");
                            const button = wrapper ? wrapper.querySelector(".custom-dropdown-button span") : null;
                            if (button) button.textContent = dirNames[boxSelectQuadrant];
                            setTimeout(() => dirCombo.onchange = oldHandler, 0);
                        }
                    } else {
                        boxSelectQuadrant = -1;
                    }
                    if (!e.shiftKey) {
                        selectedPieces.clear();
                        selectedPieceDir = null;
                        const combo = document.getElementById("itemsCombo");
                        if (combo) combo.value = "";
                        updateItemsCombo();
                        updateItemSettings();
                        redraw();
                    }
                }
            }
        } else if (e.button === 2) {
            if (isDragging && _dragMoveIndicator) {
                for (const [piece, startPos] of _dragMoveIndicator.startPositions) { piece.xoffset = startPos.x; piece.yoffset = startPos.y; }
                isDragging = false; dragButton = null; dragOffset = null; dragStartMousePos = null; dragStartState = null; pieceInitialPositions.clear();
                _dragMoveIndicator = null;
                updateItemsCombo(); updateItemSettings(); redraw();
                return;
            }
            let _overSprite = false;
            if (currentAnimation) {
                const frame = currentAnimation.getFrame(currentFrame);
                if (frame) {
                    const rect2 = mainCanvas.getBoundingClientRect();
                    const zoom2 = zoomFactors[zoomLevel] || 1.0;
                    const lw = mainCanvas.width / (window.devicePixelRatio || 1);
                    const lh = mainCanvas.height / (window.devicePixelRatio || 1);
                    const ax2 = (e.clientX - rect2.left) * (lw / rect2.width);
                    const ay2 = (e.clientY - rect2.top) * (lh / rect2.height);
                    const cx2 = (ax2 - lw / 2 - panX) / zoom2;
                    const cy2 = (ay2 - lh / 2 - panY) / zoom2;
                    const actualDir2 = getDirIndex(currentDir);
                    const pieces2 = frame.pieces[actualDir2] || [];
                    for (let i = pieces2.length - 1; i >= 0; i--) {
                        const bb = pieces2[i].getBoundingBox(currentAnimation);
                        if (cx2 >= bb.x && cx2 < bb.x + bb.width && cy2 >= bb.y && cy2 < bb.y + bb.height) { _overSprite = true; break; }
                    }
                }
            }
            if (!_overSprite) {
                isRightClickPanning = true;
                rightClickPanMoved = false;
                rightClickPanStartX = e.clientX;
                rightClickPanStartY = e.clientY;
                rightClickPanStartPanX = panX;
                rightClickPanStartPanY = panY;
                mainCanvas.style.cursor = "grabbing";
                e.preventDefault();
            }
        }
        redraw();
    };
    let mouseMoveThrottle = null;
    mainCanvas.onmousemove = (e) => {
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        if (mouseMoveThrottle) return;
        mouseMoveThrottle = requestAnimationFrame(() => {
            mouseMoveThrottle = null;
        const rect = mainCanvas.getBoundingClientRect();
            const uiScale = getUIScale();
            const logicalWidth = mainCanvas.width / (window.devicePixelRatio || 1);
            const logicalHeight = mainCanvas.height / (window.devicePixelRatio || 1);
        const zoom = zoomFactors[zoomLevel] || 1.0;
            const adjustedX = adjustCoordinateForUIScale(lastMouseX, rect.left, rect, false);
            const adjustedY = adjustCoordinateForUIScale(lastMouseY, rect.top, rect, true);
            let x, y;
            if (splitViewEnabled && !currentAnimation.singleDir && isBoxSelecting && boxSelectQuadrant >= 0) {
                const quadWidth = logicalWidth / 2;
                const quadHeight = logicalHeight / 2;
                const quadX = (boxSelectQuadrant % 2) * quadWidth;
                const quadY = Math.floor(boxSelectQuadrant / 2) * quadHeight;
                x = (adjustedX - quadX - quadWidth / 2 - panX) / zoom;
                y = (adjustedY - quadY - quadHeight / 2 - panY) / zoom;
            } else if (splitViewEnabled && !currentAnimation.singleDir && isDragging) {
                const quadWidth = logicalWidth / 2;
                const quadHeight = logicalHeight / 2;
                const quadIndex = Math.floor(adjustedY / quadHeight) * 2 + Math.floor(adjustedX / quadWidth);
                const quadX = (quadIndex % 2) * quadWidth;
                const quadY = Math.floor(quadIndex / 2) * quadHeight;
                x = (adjustedX - quadX - quadWidth / 2 - panX) / zoom;
                y = (adjustedY - quadY - quadHeight / 2 - panY) / zoom;
            } else {
                x = (adjustedX - logicalWidth / 2 - panX) / zoom;
                y = (adjustedY - logicalHeight / 2 - panY) / zoom;
            }
        if (isRightClickPanning) {
            const deltaX = Math.abs(e.clientX - rightClickPanStartX);
            const deltaY = Math.abs(e.clientY - rightClickPanStartY);
            if (deltaX > dragThreshold || deltaY > dragThreshold) {
                rightClickPanMoved = true;
            }
                panX = rightClickPanStartPanX + (e.clientX - rightClickPanStartX) / uiScale;
                panY = rightClickPanStartPanY + (e.clientY - rightClickPanStartY) / uiScale;
            redraw();
        } else if (isPanning) {
                panX = (e.clientX - panStartX) / uiScale;
                panY = (e.clientY - panStartY) / uiScale;
            redraw();
        } else if (isDragging && dragButton === "left" && dragOffset && dragStartMousePos) {
            const deltaX = x - dragStartMousePos.x;
            const deltaY = y - dragStartMousePos.y;
            for (const piece of selectedPieces) {
                const initialPos = pieceInitialPositions.get(piece);
                if (initialPos) {
                    piece.xoffset = Math.floor(0.5 + initialPos.x + deltaX);
                    piece.yoffset = Math.floor(0.5 + initialPos.y + deltaY);
                } else {
                    piece.xoffset = Math.floor(0.5 + x - dragOffset.x);
                    piece.yoffset = Math.floor(0.5 + y - dragOffset.y);
                }
            }
            redraw();
            updateItemSettings();
        } else if (isBoxSelecting && boxSelectStart) {
            boxSelectEnd = {x, y};
            _updateBoxSelection(x, y);
            redraw();
        } else if (insertPiece) {
            redraw();
        }
        });
    };
    mainCanvas.onmouseup = (e) => {
        if (e.button === 2 && isRightClickPanning) {
            if (rightClickPanMoved) {
                rightClickJustDragged = true;
            } else {
                if (insertPiece) {
                    insertPiece = null; insertPieces = [];
                    mainCanvas.style.cursor = "default";
                    redraw();
                }
            }
            isRightClickPanning = false;
            rightClickPanMoved = false;
            mainCanvas.style.cursor = "default";
        }
        if (isPanning && (e.button === 1 || e.button === 0)) {
            isPanning = false;
            mainCanvas.style.cursor = "default";
        }
        if (isDragging && e.button === 0) {
            isDragging = false;
            if (selectedPieces.size > 0 && dragStartState) {
                const newState = serializeAnimationState();
                const movedPieces = Array.from(selectedPieces).map(p => {
                    if (p.type === "sprite" && currentAnimation) {
                        const sprite = currentAnimation.getAniSprite(p.spriteIndex, p.spriteName || "");
                        if (sprite && sprite.comment) {
                            return `"${sprite.comment}"`;
                        }
                        return `Sprite ${p.spriteIndex}`;
                    }
                    return `Sound - ${p.fileName || 'unnamed'}`;
                }).join(", ");
                const _stripSel = s => { const {selectedPieceIds, selectedPieceDir, ...r} = s; return r; };
                if (JSON.stringify(_stripSel(dragStartState)) !== JSON.stringify(_stripSel(newState))) {
                    addUndoCommand({
                        description: `Move Piece${selectedPieces.size > 1 ? 's' : ''} (${movedPieces})`,
                        oldState: dragStartState,
                        newState: newState,
                        undo: () => restoreAnimationState(dragStartState),
                        redo: () => restoreAnimationState(newState)
                    });
                }
            }
            dragButton = null;
            dragOffset = null;
            dragStartMousePos = null;
            dragStartState = null;
            pieceInitialPositions.clear();
            _dragMoveIndicator = null;
            redraw();
            saveSession();
        }
        if (isBoxSelecting && boxSelectStart && e.button === 0) {
            const rect = mainCanvas.getBoundingClientRect();
            const logicalWidth = mainCanvas.width / (window.devicePixelRatio || 1);
            const logicalHeight = mainCanvas.height / (window.devicePixelRatio || 1);
            const visualWidth = rect.width;
            const visualHeight = rect.height;
            const zoomFactors = [0.25, 0.5, 0.75, 1.0, 2, 3, 4, 8];
            const zoom = zoomFactors[zoomLevel] || 1.0;
            const adjustedX = adjustCoordinateForUIScale(e.clientX, rect.left, rect, false);
            const adjustedY = adjustCoordinateForUIScale(e.clientY, rect.top, rect, true);
            let x, y;
            if (splitViewEnabled && !currentAnimation.singleDir) {
                const quadWidth = logicalWidth / 2;
                const quadHeight = logicalHeight / 2;
                const quadIndex = boxSelectQuadrant >= 0 ? boxSelectQuadrant : (Math.floor(adjustedY / quadHeight) * 2 + Math.floor(adjustedX / quadWidth));
                const quadX = (quadIndex % 2) * quadWidth;
                const quadY = Math.floor(quadIndex / 2) * quadHeight;
                x = (adjustedX - quadX - quadWidth / 2 - panX) / zoom;
                y = (adjustedY - quadY - quadHeight / 2 - panY) / zoom;
            } else {
                x = (adjustedX - logicalWidth / 2 - panX) / zoom;
                y = (adjustedY - logicalHeight / 2 - panY) / zoom;
            }
            const boxWidth = Math.abs(boxSelectStart.x - x);
            const boxHeight = Math.abs(boxSelectStart.y - y);
            const dist = Math.sqrt(Math.pow(boxSelectStart.x - x, 2) + Math.pow(boxSelectStart.y - y, 2));
            if (boxWidth < 5 && boxHeight < 5 && dist < 5) {
                if (!e.shiftKey) {
                    selectedPieces.clear();
                    selectedPieceDir = null;
                    const _combo = document.getElementById("itemsCombo");
                    if (_combo) { _combo.value = ""; const _w = _combo.closest("div"); const _b = _w?.querySelector(".custom-dropdown-button span"); if (_b) _b.textContent = "(none)"; }
                    updateItemSettings();
                    redraw();
                }
            } else {
                if (!e.shiftKey) {
                    selectedPieces.clear();
                    const _c = document.getElementById("itemsCombo");
                    if (_c) { _c.value = ""; const _w = _c.closest("div"); const _b = _w?.querySelector(".custom-dropdown-button span"); if (_b) _b.textContent = "(none)"; }
                }
                const _fx = boxSelectEnd ? boxSelectEnd.x : x, _fy = boxSelectEnd ? boxSelectEnd.y : y;
                _updateBoxSelection(_fx, _fy);
            }
            isBoxSelecting = false;
            boxSelectStart = null;
            boxSelectEnd = null;
            redraw();
            saveSession();
        }
    };
    mainCanvas.onmouseleave = () => {
        isPanning = false;
        isDragging = false;
        _dragMoveIndicator = null;
        mainCanvas.style.cursor = "default";
        redraw();
    };
    document.addEventListener("mouseup", (e) => {
        if (e.button === 0 && isDragging) {
            isDragging = false;
            _dragMoveIndicator = null;
            dragButton = null; dragOffset = null; dragStartMousePos = null; dragStartState = null; pieceInitialPositions.clear();
            redraw();
        }
    });
    mainCanvas.oncontextmenu = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        if (!rightClickJustDragged) {
            showCanvasContextMenu(e);
        }
        rightClickJustDragged = false;
    };

    let touchStartTime = 0;
    let touchStartPos = null;
    let touchMoved = false;
    let lastTouchIdentifier = null;
    let touchContextMenuTimer = null;

    function getTouchCoords(e) {
        const rect = mainCanvas.getBoundingClientRect();
        const logicalWidth = mainCanvas.width / (window.devicePixelRatio || 1);
        const logicalHeight = mainCanvas.height / (window.devicePixelRatio || 1);
        const visualWidth = rect.width;
        const visualHeight = rect.height;
        const zoom = zoomFactors[zoomLevel] || 1.0;
        const touch = e.touches[0] || e.changedTouches[0];
        const adjustedX = adjustCoordinateForUIScale(touch.clientX, rect.left, rect, false);
        const adjustedY = adjustCoordinateForUIScale(touch.clientY, rect.top, rect, true);
        const x = (adjustedX - logicalWidth / 2 - panX) / zoom;
        const y = (adjustedY - logicalHeight / 2 - panY) / zoom;
        return {x, y, clientX: touch.clientX, clientY: touch.clientY};
    }

    mainCanvas.addEventListener("touchstart", (e) => {
        if (e.touches.length > 1) return;
        e.preventDefault();
        const coords = getTouchCoords(e);
        touchStartTime = Date.now();
        touchStartPos = coords;
        touchMoved = false;
        lastTouchIdentifier = e.touches[0].identifier;

        const rect = mainCanvas.getBoundingClientRect();
        const width = mainCanvas.width / (window.devicePixelRatio || 1);
        const height = mainCanvas.height / (window.devicePixelRatio || 1);
        const zoom = zoomFactors[zoomLevel] || 1.0;
        const x = coords.x;
        const y = coords.y;

        if (insertPiece) {
            const frame = currentAnimation.getFrame(currentFrame);
            if (frame) {
                const actualDir = getDirIndex(currentDir);
                const sprite = currentAnimation.getAniSprite(insertPiece.spriteIndex, insertPiece.spriteName);
                insertPiece.xoffset = Math.floor(0.5 + x - insertPiece.dragOffset.x);
                insertPiece.yoffset = Math.floor(0.5 + y - insertPiece.dragOffset.y);
                const oldState = serializeAnimationState();
                frame.pieces[actualDir].push(insertPiece);
                selectedPieces.clear();
                selectedPieces.add(insertPiece);
                const newState = serializeAnimationState();
                const spriteName = sprite && sprite.comment ? `"${sprite.comment}"` : `Sprite ${insertPiece.spriteIndex}`;
                addUndoCommand({
                    description: `Place ${spriteName}`,
                    oldState: oldState,
                    newState: newState,
                    undo: () => restoreAnimationState(oldState),
                    redo: () => restoreAnimationState(newState)
                });
                updateItemsCombo();
                insertPiece = null;
                redraw();
                saveSession();
                return;
            }
        }

        const frame = currentAnimation.getFrame(currentFrame);
        if (frame) {
            const actualDir = getDirIndex(currentDir);
            const pieces = frame.pieces[actualDir] || [];
            let found = false;
            for (let i = pieces.length - 1; i >= 0; i--) {
                const piece = pieces[i];
                const bb = piece.getBoundingBox(currentAnimation);
                if (x >= bb.x && x < bb.x + bb.width && y >= bb.y && y < bb.y + bb.height) {
                    if (selectedPieces.has(piece)) {
                        selectedPieces.clear();
                        selectedPieces.add(piece);
                    } else {
                        selectedPieces.clear();
                        selectedPieces.add(piece);
                    }
                    dragOffset = {x: x - piece.xoffset, y: y - piece.yoffset};
                    dragStartMousePos = {x, y};
                    dragButton = "left";
                    isDragging = true;
                    dragStartState = serializeAnimationState();
                    pieceInitialPositions.clear();
                    for (const p of selectedPieces) {
                        pieceInitialPositions.set(p, {x: p.xoffset, y: p.yoffset});
                    }
                    found = true;
                    if (piece.type === "sprite") {
                        const sprite = currentAnimation.getAniSprite(piece.spriteIndex, piece.spriteName);
                        if (sprite) {
                            selectSprite(sprite);
                        }
                    }
                    updateItemsCombo();
                    break;
                }
            }
            if (!found) {
                for (const sound of frame.sounds || []) {
                    const dist = Math.sqrt(Math.pow(x - sound.xoffset, 2) + Math.pow(y - sound.yoffset, 2));
                    if (dist <= 8) {
                        if (selectedPieces.has(sound)) {
                            selectedPieces.clear();
                            selectedPieces.add(sound);
                        } else {
                            selectedPieces.clear();
                            selectedPieces.add(sound);
                        }
                        dragOffset = {x: x - sound.xoffset, y: y - sound.yoffset};
                        dragStartMousePos = {x, y};
                        dragButton = "left";
                        isDragging = true;
                        dragStartState = serializeAnimationState();
                        pieceInitialPositions.clear();
                        for (const p of selectedPieces) {
                            pieceInitialPositions.set(p, {x: p.xoffset, y: p.yoffset});
                        }
                        found = true;
                        updateItemsCombo();
                        break;
                    }
                }
            }
            if (!found) {
                selectedPieces.clear();
                const combo = document.getElementById("itemsCombo");
                if (combo) combo.value = "";
                updateItemsCombo();
                updateItemSettings();
                redraw();
                boxSelectStart = {x, y};
                boxSelectEnd = {x, y};
                isBoxSelecting = true;
                touchContextMenuTimer = setTimeout(() => {
                    if (!touchMoved && touchStartPos) {
                        const fakeEvent = {
                            clientX: touchStartPos.clientX,
                            clientY: touchStartPos.clientY,
                            preventDefault: () => {},
                            stopPropagation: () => {},
                            stopImmediatePropagation: () => {}
                        };
                        showCanvasContextMenu(fakeEvent);
                    }
                }, 500);
            }
        }
        redraw();
    }, {passive: false});

    mainCanvas.addEventListener("touchmove", (e) => {
        if (e.touches.length > 1) return;
        e.preventDefault();
        const touch = Array.from(e.touches).find(t => t.identifier === lastTouchIdentifier);
        if (!touch) return;

        const coords = getTouchCoords(e);
        if (touchStartPos) {
            const dist = Math.sqrt(Math.pow(coords.x - touchStartPos.x, 2) + Math.pow(coords.y - touchStartPos.y, 2));
            if (dist > 5) {
                touchMoved = true;
                if (touchContextMenuTimer) {
                    clearTimeout(touchContextMenuTimer);
                    touchContextMenuTimer = null;
                }
            }
        }

        const rect = mainCanvas.getBoundingClientRect();
        const width = mainCanvas.width / (window.devicePixelRatio || 1);
        const height = mainCanvas.height / (window.devicePixelRatio || 1);
        const zoom = zoomFactors[zoomLevel] || 1.0;
        const x = coords.x;
        const y = coords.y;

        if (isDragging && dragButton === "left" && dragOffset && dragStartMousePos) {
            const deltaX = x - dragStartMousePos.x;
            const deltaY = y - dragStartMousePos.y;
            for (const piece of selectedPieces) {
                const initialPos = pieceInitialPositions.get(piece);
                if (initialPos) {
                    piece.xoffset = Math.floor(0.5 + initialPos.x + deltaX);
                    piece.yoffset = Math.floor(0.5 + initialPos.y + deltaY);
                } else {
                    piece.xoffset = Math.floor(0.5 + x - dragOffset.x);
                    piece.yoffset = Math.floor(0.5 + y - dragOffset.y);
                }
            }
            redraw();
            updateItemSettings();
        } else if (isBoxSelecting && boxSelectStart) {
            boxSelectEnd = {x, y};
            redraw();
        }
    }, {passive: false});

    mainCanvas.addEventListener("touchend", (e) => {
        if (touchContextMenuTimer) {
            clearTimeout(touchContextMenuTimer);
            touchContextMenuTimer = null;
        }

        if (isDragging) {
            isDragging = false;
            if (selectedPieces.size > 0 && dragStartState) {
                const newState = serializeAnimationState();
                const movedPieces = Array.from(selectedPieces).map(p => {
                    if (p.type === "sprite" && currentAnimation) {
                        const sprite = currentAnimation.getAniSprite(p.spriteIndex, p.spriteName || "");
                        if (sprite && sprite.comment) {
                            return `"${sprite.comment}"`;
                        }
                        return `Sprite ${p.spriteIndex}`;
                    }
                    return `Sound - ${p.fileName || 'unnamed'}`;
                }).join(", ");
                const _stripSel2 = s => { const {selectedPieceIds, selectedPieceDir, ...r} = s; return r; };
                if (JSON.stringify(_stripSel2(dragStartState)) !== JSON.stringify(_stripSel2(newState))) {
                    addUndoCommand({
                        description: `Move Piece${selectedPieces.size > 1 ? 's' : ''} (${movedPieces})`,
                        oldState: dragStartState,
                        newState: newState,
                        undo: () => restoreAnimationState(dragStartState),
                        redo: () => restoreAnimationState(newState)
                    });
                }
            }
            dragButton = null;
            dragOffset = null;
            dragStartMousePos = null;
            dragStartState = null;
            pieceInitialPositions.clear();
            _dragMoveIndicator = null;
            saveSession();
        }

        if (isBoxSelecting && boxSelectStart) {
            const coords = getTouchCoords(e);
            const x = coords.x;
            const y = coords.y;
            const frame = currentAnimation.getFrame(currentFrame);
            if (frame) {
                const actualDir = getDirIndex(currentDir);
                const pieces = frame.pieces[actualDir] || [];
                const minX = Math.min(boxSelectStart.x, x);
                const maxX = Math.max(boxSelectStart.x, x);
                const minY = Math.min(boxSelectStart.y, y);
                const maxY = Math.max(boxSelectStart.y, y);
                const boxWidth = Math.abs(maxX - minX);
                const boxHeight = Math.abs(maxY - minY);
                const dist = Math.sqrt(Math.pow(boxSelectStart.x - x, 2) + Math.pow(boxSelectStart.y - y, 2));
                if (boxWidth < 5 && boxHeight < 5 && dist < 5) {
                    selectedPieces.clear();
                    updateItemsCombo();
                    updateItemSettings();
                } else {
                    for (const piece of pieces) {
                        const bb = piece.getBoundingBox(currentAnimation);
                        const centerX = bb.x + bb.width / 2;
                        const centerY = bb.y + bb.height / 2;
                        if (centerX >= minX && centerX <= maxX && centerY >= minY && centerY <= maxY) {
                            if (!selectedPieces.has(piece)) {
                                selectedPieces.add(piece);
                            }
                        }
                    }
                    if (frame.sounds && frame.sounds.length > 0) {
                        for (const sound of frame.sounds) {
                            const centerX = sound.xoffset;
                            const centerY = sound.yoffset;
                            if (centerX >= minX && centerX <= maxX && centerY >= minY && centerY <= maxY) {
                                if (!selectedPieces.has(sound)) {
                                    selectedPieces.add(sound);
                                }
                            }
                        }
                    }
                    updateItemsCombo();
                    updateItemSettings();
                }
            }
            isBoxSelecting = false;
            boxSelectStart = null;
            boxSelectEnd = null;
            redraw();
            saveSession();
        }

        isPanning = false;
        touchStartPos = null;
        touchMoved = false;
        lastTouchIdentifier = null;
        redraw();
    }, {passive: false});
}, { once: true });

let lastPlayedFrame = -1;
function playAnimation() {
    if (!isPlaying) return;
    const now = Date.now();
    if (!playStartTime) playStartTime = now;
    const delta = now - playStartTime;
    playStartTime = now;
    playPosition += delta;
    let totalDuration = 0;
    for (const frame of currentAnimation.frames) totalDuration += frame.duration;
    if (totalDuration === 0) {
        isPlaying = false;
        document.getElementById("btnPlay").innerHTML = '<i class="fas fa-play"></i>';
        return;
    }
    if (playPosition >= totalDuration) {
        if (currentAnimation.looped) {
            playPosition = playPosition % totalDuration;
        } else {
            isPlaying = false;
            playPosition = 0;
            document.getElementById("btnPlay").innerHTML = '<i class="fas fa-play"></i>';
            redraw();
            return;
        }
    }
    let accumulated = 0;
    let newFrame = currentFrame;
    for (let i = 0; i < currentAnimation.frames.length; i++) {
        if (playPosition < accumulated + currentAnimation.frames[i].duration) {
            newFrame = i;
            break;
        }
        accumulated += currentAnimation.frames[i].duration;
    }
    if (newFrame !== currentFrame) {
        currentFrame = newFrame;
        const frame = currentAnimation.getFrame(currentFrame);
        if (frame && frame.sounds && frame.sounds.length > 0) {
            for (const sound of frame.sounds) {
                try {
                    let soundPath = sound.fileName;
                    const audioExtensions = [".wav", ".mp3", ".ogg", ".m4a"];
                    const commonSubdirs = ["sounds", "sound", "music", "audio", "sfx", "fx"];
                    const baseName = soundPath;
                    const hasExt = /\.\w+$/.test(baseName);
                    const pathsToTry = [];
                    if (soundLibrary.has(baseName.toLowerCase())) {
                        const audio = soundLibrary.get(baseName.toLowerCase());
                        audio.currentTime = 0;
                        activeAudioElements.add(audio);
                        audio.play().catch(() => {});
                        continue;
                    }
                    if (!soundPath.includes("/") && !soundPath.includes("\\")) {
                        pathsToTry.push("sounds/" + baseName);
                        if (!hasExt) {
                            for (const ext of audioExtensions) {
                                pathsToTry.push("sounds/" + baseName + ext);
                            }
                        }
                        if (typeof workingDirectory !== 'undefined' && workingDirectory) {
                            pathsToTry.push(workingDirectory + "/" + baseName);
                            if (!hasExt) {
                                for (const ext of audioExtensions) {
                                    pathsToTry.push(workingDirectory + "/" + baseName + ext);
                                }
                            }
                            for (const subdir of commonSubdirs) {
                                pathsToTry.push(workingDirectory + "/" + subdir + "/" + baseName);
                                if (!hasExt) {
                                    for (const ext of audioExtensions) {
                                        pathsToTry.push(workingDirectory + "/" + subdir + "/" + baseName + ext);
                                    }
                                }
                            }
                        }
                    } else {
                        pathsToTry.push(soundPath);
                    }
                    let audioLoaded = false;
                    let currentIndex = 0;
                    const audio = new Audio();
                    audio.volume = 0.5;
                    activeAudioElements.add(audio);
                    audio.onended = () => {
                        activeAudioElements.delete(audio);
                    };
                    audio.onerror = () => {
                        if (!audioLoaded && currentIndex < pathsToTry.length) {
                            const path = pathsToTry[currentIndex++];
                            audio.src = path;
                            audio.load();
                        }
                    };
                    audio.oncanplaythrough = () => {
                        if (!audioLoaded) {
                            audioLoaded = true;
                            audio.play().catch(() => {});
                        }
                    };
                    audio.onloadeddata = () => {
                        if (!audioLoaded) {
                            audioLoaded = true;
                            audio.play().catch(() => {});
                        }
                    };
                    if (pathsToTry.length > 0) {
                        audio.src = pathsToTry[currentIndex++];
                        audio.load();
                    }
                } catch (e) {}
            }
        }
        redraw();
        updateFrameInfo();
    }
    drawTimeline();
    if (isPlaying) {
        requestAnimationFrame(playAnimation);
    }
}

function positionContextMenu(menu, cx, cy) {
    menu.style.display = "block";
    document.body.appendChild(menu);
    const mw = menu.offsetWidth, mh = menu.offsetHeight;
    const vw = window.innerWidth, vh = window.innerHeight;
    menu.style.left = Math.min(cx, vw - mw - 4) + "px";
    menu.style.top = Math.min(cy, vh - mh - 4) + "px";
}

function showSpriteContextMenu(e, sprite) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    if (activeContextMenu) {
        document.body.removeChild(activeContextMenu);
        activeContextMenu = null;
    }
    const menu = document.createElement("div");
    menu.className = "context-menu";
    menu.style.position = "fixed";
    menu.style.background = "#444";
    menu.style.border = "1px solid #555";
    menu.style.padding = "4px";
    menu.style.zIndex = "10000";
    menu.style.minWidth = "150px";
    activeContextMenu = menu;
    selectSprite(sprite);
    const deleteCount = selectedSpritesForDeletion.size > 1 ? selectedSpritesForDeletion.size : 0;
    const items = [
        {text: "Edit Sprite", action: () => editSprite(sprite)},
        {text: "Copy Sprite", action: () => document.getElementById("btnCopySprite").click()},
        {text: "Duplicate Sprite", action: () => {
            const newSprite = sprite.duplicate(currentAnimation.nextSpriteIndex++);
            currentAnimation.addSprite(newSprite);
            selectSprite(newSprite);
            updateSpritesList();
            redraw();
        }},
        {text: deleteCount > 1 ? `Delete ${deleteCount} Sprites` : "Delete Sprite", action: () => {
            if (deleteCount > 1) {
                const oldState = serializeAnimationState();
                const toDelete = [...selectedSpritesForDeletion];
                const count = toDelete.length;
                for (const s of toDelete) currentAnimation.sprites.delete(s.index);
                if (editingSprite && toDelete.includes(editingSprite)) editingSprite = null;
                selectedSpritesForDeletion.clear();
                const newState = serializeAnimationState();
                addUndoCommand({ description: `Delete ${count} Sprites`, oldState, newState, undo: () => restoreAnimationState(oldState), redo: () => restoreAnimationState(newState) });
                updateSpritesList(); updateSpriteEditor(); redraw(); saveSession();
            } else {
                document.getElementById("btnDeleteSprite").click();
            }
        }}
    ];
    for (const item of items) {
        const div = document.createElement("div");
        div.textContent = item.text;
        div.style.padding = "4px 8px";
        div.style.cursor = "pointer";
        div.style.color = "#fff";
        div.onmouseover = () => div.style.background = "#555";
        div.onmouseout = () => div.style.background = "transparent";
        div.onclick = () => {
            item.action();
            if (activeContextMenu === menu) {
                document.body.removeChild(menu);
                activeContextMenu = null;
            }
        };
        menu.appendChild(div);
    }
    positionContextMenu(menu, e.clientX, e.clientY);
    const closeMenu = (ev) => {
        if (!menu.contains(ev.target)) {
            if (activeContextMenu === menu) { document.body.removeChild(menu); activeContextMenu = null; }
            document.removeEventListener("click", closeMenu);
        }
    };
    setTimeout(() => document.addEventListener("click", closeMenu), 0);
}

function showTimelineContextMenu(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    if (activeContextMenu) {
        document.body.removeChild(activeContextMenu);
        activeContextMenu = null;
    }
    const menu = document.createElement("div");
    menu.className = "context-menu";
    menu.style.position = "fixed";
    menu.style.background = "#444";
    menu.style.border = "1px solid #555";
    menu.style.padding = "4px";
    menu.style.zIndex = "10000";
    menu.style.minWidth = "150px";
    activeContextMenu = menu;
    const items = [];
    items.push({text: "Add Frame", action: () => btnNewFrame.click()});
    items.push({text: "Delete Frame", action: () => btnDeleteFrame.click()});
    items.forEach(item => {
        const div = document.createElement("div");
        div.textContent = item.text;
        div.style.padding = "4px 8px";
        div.style.cursor = "pointer";
        div.style.color = "#fff";
        div.onmouseover = () => div.style.background = "#666";
        div.onmouseout = () => div.style.background = "transparent";
        div.onclick = () => {
            item.action();
            document.body.removeChild(menu);
            activeContextMenu = null;
        };
        menu.appendChild(div);
    });
    positionContextMenu(menu, e.clientX, e.clientY);
    document.addEventListener("click", () => {
        if (activeContextMenu) {
            document.body.removeChild(activeContextMenu);
            activeContextMenu = null;
        }
    }, {once: true});
}

function showCanvasContextMenu(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    if (activeContextMenu) {
        document.body.removeChild(activeContextMenu);
        activeContextMenu = null;
    }
    const menu = document.createElement("div");
    menu.className = "context-menu";
    menu.style.position = "fixed";
    menu.style.background = "#444";
    menu.style.border = "1px solid #555";
    menu.style.padding = "4px";
    menu.style.zIndex = "10000";
    menu.style.minWidth = "150px";
    activeContextMenu = menu;
    const items = [];
    let _hitSprite = null;
    if (currentAnimation) {
        const frame = currentAnimation.getFrame(currentFrame);
        if (frame) {
            const rect = mainCanvas.getBoundingClientRect();
            const zoom = zoomFactors[zoomLevel] || 1.0;
            const logicalWidth = mainCanvas.width / (window.devicePixelRatio || 1);
            const logicalHeight = mainCanvas.height / (window.devicePixelRatio || 1);
            const ax = (e.clientX - rect.left) * (logicalWidth / rect.width);
            const ay = (e.clientY - rect.top) * (logicalHeight / rect.height);
            const cx = (ax - logicalWidth / 2 - panX) / zoom;
            const cy = (ay - logicalHeight / 2 - panY) / zoom;
            const actualDir = getDirIndex(currentDir);
            const pieces = frame.pieces[actualDir] || [];
            for (let i = pieces.length - 1; i >= 0; i--) {
                const piece = pieces[i];
                const bb = piece.getBoundingBox(currentAnimation);
                if (cx >= bb.x && cx < bb.x + bb.width && cy >= bb.y && cy < bb.y + bb.height) {
                    _hitSprite = currentAnimation.getAniSprite(piece.spriteIndex, piece.spriteName || "");
                    if (!selectedPieces.has(piece)) {
                        selectedPieces.clear();
                        selectedPieceDir = actualDir;
                        selectedPieces.add(piece);
                        updateItemsCombo();
                        updateItemSettings();
                        redraw();
                    }
                    break;
                }
            }
        }
    }
    if (_hitSprite) {
        items.push({text: "Edit Sprite", action: () => editSprite(_hitSprite)});
        items.push({text: "---", separator: true});
    }
    if (selectedPieces.size > 0) {
        items.push({text: selectedPieces.size > 1 ? "Copy Sprites" : "Copy Sprite", action: () => { clipboardPieces = Array.from(selectedPieces).map(p => p.duplicate()); }});
        items.push({text: selectedPieces.size > 1 ? "Cut Sprites" : "Cut Sprite", action: () => {
            const frame = currentAnimation.getFrame(currentFrame);
            if (frame) {
                const actualDir = getDirIndex(currentDir);
                const pieces = frame.pieces[actualDir] || [];
                clipboardPieces = Array.from(selectedPieces).map(p => p.duplicate());
                const oldState = serializeAnimationState();
                const cutPieces = Array.from(selectedPieces);
                const cutNames = cutPieces.map(p => { if (p.type === "sprite") { const s = currentAnimation.getAniSprite(p.spriteIndex, p.spriteName || ""); return s?.comment ? `"${s.comment}"` : `Sprite ${p.spriteIndex}`; } return "Sound"; }).join(", ");
                for (const p of cutPieces) { const i = pieces.indexOf(p); if (i >= 0) pieces.splice(i, 1); }
                selectedPieces.clear();
                const newState = serializeAnimationState();
                addUndoCommand({ description: `Cut ${cutNames}`, oldState, newState, undo: () => restoreAnimationState(oldState), redo: () => restoreAnimationState(newState) });
                updateItemsCombo(); updateItemSettings(); redraw(); saveSession();
            }
        }});
        items.push({text: selectedPieces.size > 1 ? "Delete Sprites" : "Delete Sprite", action: () => {
            const frame = currentAnimation.getFrame(currentFrame);
            if (frame) {
                const actualDir = getDirIndex(currentDir);
                const pieces = frame.pieces[actualDir] || [];
                const oldState = serializeAnimationState();
                const deletedPieces = Array.from(selectedPieces);
                const deletedNames = deletedPieces.map(p => {
                    if (p.type === "sprite" && currentAnimation) {
                        const sprite = currentAnimation.getAniSprite(p.spriteIndex, p.spriteName || "");
                        if (sprite && sprite.comment) {
                            return `"${sprite.comment}"`;
                        }
                        return `Sprite ${p.spriteIndex}`;
                    }
                    return "Sound";
                }).join(", ");
                for (const piece of deletedPieces) {
                    const index = pieces.indexOf(piece);
                    if (index >= 0) {
                        pieces.splice(index, 1);
                    }
                }
                selectedPieces.clear();
                const newState = serializeAnimationState();
                addUndoCommand({
                    description: `Delete Piece${deletedPieces.length > 1 ? 's' : ''} (${deletedNames})`,
                    oldState: oldState,
                    newState: newState,
                    undo: () => restoreAnimationState(oldState),
                    redo: () => restoreAnimationState(newState)
                });
                updateItemsCombo();
                updateItemSettings();
                redraw();
                saveSession();
            }
        }});
    }
    items.push(
        {text: "Add Sprite", action: () => document.getElementById("btnAddSprite").click()},
        ...(clipboardPieces ? [{text: `Paste Sprite${clipboardPieces.length > 1 ? "s" : ""}`, action: () => {
            const frame = currentAnimation.getFrame(currentFrame);
            if (frame) {
                const actualDir = getDirIndex(currentDir);
                if (!frame.pieces[actualDir]) frame.pieces[actualDir] = [];
                const pieces = frame.pieces[actualDir];
                const oldState = serializeAnimationState();
                const pasted = clipboardPieces.map(p => { const d = p.duplicate(); d.xoffset += 8; d.yoffset += 8; return d; });
                const pasteNames = clipboardPieces.map(p => { if (p.type === "sprite") { const s = currentAnimation.getAniSprite(p.spriteIndex, p.spriteName || ""); return s?.comment ? `"${s.comment}"` : `Sprite ${p.spriteIndex}`; } return "Sound"; }).join(", ");
                pieces.push(...pasted);
                selectedPieces.clear();
                for (const p of pasted) selectedPieces.add(p);
                const newState = serializeAnimationState();
                addUndoCommand({ description: `Paste ${pasteNames}`, oldState, newState, undo: () => restoreAnimationState(oldState), redo: () => restoreAnimationState(newState) });
                updateItemsCombo(); updateItemSettings(); redraw(); saveSession();
            }
        }}] : [{text: "Paste Sprite", action: () => document.getElementById("btnPasteSprite").click()}]),
        {text: "Center View", action: () => {
            panX = panY = 0;
            redraw();
        }},
        ...(_dragMoveIndicator ? [{separator: true}, {text: "↩ Undo Move", action: () => { undo(); _dragMoveIndicator = null; redraw(); }}] : [])
    );
    for (const item of items) {
        if (item.separator) { const hr = document.createElement("div"); hr.style.cssText = "height:1px;background:#555;margin:3px 4px;"; menu.appendChild(hr); continue; }
        const div = document.createElement("div");
        div.textContent = item.text;
        div.style.padding = "4px 8px";
        div.style.cursor = "pointer";
        div.style.color = "#fff";
        div.onmouseover = () => div.style.background = "#555";
        div.onmouseout = () => div.style.background = "transparent";
        div.onclick = () => {
            item.action();
            if (activeContextMenu === menu) {
                document.body.removeChild(menu);
                activeContextMenu = null;
            }
        };
        menu.appendChild(div);
    }
    positionContextMenu(menu, e.clientX, e.clientY);
    const closeMenu = (e) => {
        if (!menu.contains(e.target)) {
            if (activeContextMenu === menu) {
                document.body.removeChild(menu);
                activeContextMenu = null;
            }
            document.removeEventListener("click", closeMenu);
        }
    };
    setTimeout(() => document.addEventListener("click", closeMenu), 0);
}

function showSpritesListContextMenu(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    if (activeContextMenu) {
        document.body.removeChild(activeContextMenu);
        activeContextMenu = null;
    }
    const menu = document.createElement("div");
    menu.className = "context-menu";
    menu.style.position = "fixed";
    menu.style.background = "#444";
    menu.style.border = "1px solid #555";
    menu.style.padding = "4px";
    menu.style.zIndex = "10000";
    menu.style.minWidth = "150px";
    activeContextMenu = menu;
    const items = [
        {text: "Add Sprite", action: () => document.getElementById("btnAddSprite").click()},
        {text: "Paste Sprite", action: () => document.getElementById("btnPasteSprite").click()},
        ...(selectedSpritesForDeletion.size > 0 ? [{text: `Delete ${selectedSpritesForDeletion.size} Selected`, action: () => {
            if (selectedSpritesForDeletion.size > 0) {
                const oldState = serializeAnimationState();
                for (const spriteToDelete of selectedSpritesForDeletion) {
                    currentAnimation.sprites.delete(spriteToDelete.index);
                }
                if (editingSprite && selectedSpritesForDeletion.has(editingSprite)) {
                    editingSprite = null;
                }
                selectedSpritesForDeletion.clear();
                const newState = serializeAnimationState();
                addUndoCommand({
                    description: `Delete ${selectedSpritesForDeletion.size} Sprite${selectedSpritesForDeletion.size > 1 ? 's' : ''}`,
                    oldState: oldState,
                    newState: newState,
                    undo: () => restoreAnimationState(oldState),
                    redo: () => restoreAnimationState(newState)
                });
                updateSpritesList();
                updateSpriteEditor();
                redraw();
                saveSession();
            }
        }}] : [])
    ];
    for (const item of items) {
        const div = document.createElement("div");
        div.textContent = item.text;
        div.style.padding = "4px 8px";
        div.style.cursor = "pointer";
        div.onmouseover = () => div.style.background = "#555";
        div.onmouseout = () => div.style.background = "transparent";
        div.onclick = () => {
            item.action();
            if (activeContextMenu === menu) {
                document.body.removeChild(menu);
                activeContextMenu = null;
            }
        };
        menu.appendChild(div);
    }
    positionContextMenu(menu, e.clientX, e.clientY);
    const closeMenu = (e) => {
        if (!menu.contains(e.target)) {
            if (activeContextMenu === menu) {
                document.body.removeChild(menu);
                activeContextMenu = null;
            }
            document.removeEventListener("click", closeMenu);
        }
    };
    setTimeout(() => document.addEventListener("click", closeMenu), 0);
}

function getColorSchemeColors() {
    const scheme = localStorage.getItem("editorColorScheme") || "default";
    if (scheme === "default") {
        return {
            panel: "#2b2b2b",
            border: "#1a1a1a",
            text: "#e0e0e0",
            buttonBg: "#1a1a1a",
            buttonText: "#ffffff",
            buttonHover: "#2b2b2b",
            buttonBorder: "#0a0a0a",
            buttonBorderLight: "#404040"
        };
    }
    const schemes = {
        "fusion-light": { panel: "#ffffff", border: "#d0d0d0", text: "#1a1a1a", buttonBg: "#ffffff", buttonText: "#1a1a1a", buttonHover: "#f0f0f0", buttonBorder: "#d0d0d0", buttonBorderLight: "#e0e0e0" },
        "fusion-dark": { panel: "#2d2d2d", border: "#0f0f0f", text: "#e8e8e8", buttonBg: "#2d2d2d", buttonText: "#e8e8e8", buttonHover: "#3d3d3d", buttonBorder: "#0f0f0f", buttonBorderLight: "#404040" },
        "dark-style": { panel: "#252525", border: "#3c3c3c", text: "#cccccc", buttonBg: "#252525", buttonText: "#cccccc", buttonHover: "#3e3e3e", buttonBorder: "#3c3c3c", buttonBorderLight: "#4c4c4c" },
        "dark-orange": { panel: "#3a2f2a", border: "#1a0f0a", text: "#ffaa55", buttonBg: "#3a2f2a", buttonText: "#ffaa55", buttonHover: "#4a3f3a", buttonBorder: "#1a0f0a", buttonBorderLight: "#5a4f4a" },
        "aqua": { panel: "#1a2a2f", border: "#0a0a0a", text: "#55ffff", buttonBg: "#1a2a2f", buttonText: "#55ffff", buttonHover: "#2a3a3f", buttonBorder: "#0a0a0a", buttonBorderLight: "#2a4a4f" },
        "elegant-dark": { panel: "#2d2d2d", border: "#404040", text: "#e8e8e8", buttonBg: "#2d2d2d", buttonText: "#e8e8e8", buttonHover: "#3d3d3d", buttonBorder: "#404040", buttonBorderLight: "#505050" },
        "material-dark": { panel: "#1e1e1e", border: "#333333", text: "#ffffff", buttonBg: "#1e1e1e", buttonText: "#ffffff", buttonHover: "#2e2e2e", buttonBorder: "#333333", buttonBorderLight: "#444444" },
        "light-style": { panel: "#ffffff", border: "#e0e0e0", text: "#000000", buttonBg: "#ffffff", buttonText: "#000000", buttonHover: "#f0f0f0", buttonBorder: "#e0e0e0", buttonBorderLight: "#f0f0f0" },
        "ayu-mirage": { panel: "#232834", border: "#191e2a", text: "#cbccc6", buttonBg: "#232834", buttonText: "#cbccc6", buttonHover: "#2a2f3a", buttonBorder: "#191e2a", buttonBorderLight: "#2a3a4a" },
        "dracula": { panel: "#343746", border: "#21222c", text: "#f8f8f2", buttonBg: "#343746", buttonText: "#f8f8f2", buttonHover: "#44475a", buttonBorder: "#21222c", buttonBorderLight: "#525460" }
    };
    return schemes[scheme] || schemes["default"];
}
function showConfirmDialog(message, callback, showClearStorage = false) {
    const colors = getColorSchemeColors();
    const currentFont = localStorage.getItem("editorFont") || "chevyray";
    const fontFamily = getFontFamily(currentFont);
    const dialog = document.createElement("div");
    dialog.className = "dialog-overlay";
    dialog.style.display = "flex";
    dialog.style.justifyContent = "center";
    dialog.style.alignItems = "center";
    dialog.style.position = "fixed";
    dialog.style.top = "0";
    dialog.style.left = "0";
    dialog.style.width = "100%";
    dialog.style.height = "100%";
    dialog.style.background = "rgba(0,0,0,0.7)";
    dialog.style.zIndex = "10001";
    const content = document.createElement("div");
    content.style.background = colors.panel;
    content.style.padding = "0 20px 20px";
    content.style.borderRadius = "0";
    content.style.border = "2px solid " + colors.border;
    content.style.width = "400px";
    content.style.maxWidth = "90vw";
    content.style.textAlign = "center";
    content.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.8)";
    const messageEl = document.createElement("div");
    messageEl.style.color = colors.text;
    messageEl.style.marginBottom = "20px";
    messageEl.style.fontSize = "12px";
    messageEl.style.fontFamily = fontFamily;
    messageEl.style.whiteSpace = "pre-wrap";
    messageEl.style.userSelect = "none";
    messageEl.style.webkitUserSelect = "none";
    messageEl.style.mozUserSelect = "none";
    messageEl.style.msUserSelect = "none";
    messageEl.textContent = message;
    let clearStorageCheckbox = null;
    let checkboxContainer = null;
    if (showClearStorage) {
        checkboxContainer = document.createElement("div");
        checkboxContainer.style.display = "flex";
        checkboxContainer.style.alignItems = "center";
        checkboxContainer.style.justifyContent = "center";
        checkboxContainer.style.marginTop = "15px";
        checkboxContainer.style.marginBottom = "10px";
        checkboxContainer.style.gap = "8px";
        clearStorageCheckbox = document.createElement("span");
        clearStorageCheckbox.id = "clearStorageCheckbox";
        clearStorageCheckbox.textContent = " ";
        clearStorageCheckbox.style.display = "inline-block";
        clearStorageCheckbox.style.width = "16px";
        clearStorageCheckbox.style.height = "16px";
        clearStorageCheckbox.style.textAlign = "center";
        clearStorageCheckbox.style.border = `1px solid ${colors.border === "#0a0a0a" ? "#555" : colors.border}`;
        clearStorageCheckbox.style.background = colors.inputBg || colors.panel;
        clearStorageCheckbox.style.verticalAlign = "middle";
        clearStorageCheckbox.style.lineHeight = "14px";
        clearStorageCheckbox.style.fontSize = "12px";
        clearStorageCheckbox.style.cursor = "pointer";
        clearStorageCheckbox.style.userSelect = "none";
        clearStorageCheckbox.style.webkitUserSelect = "none";
        clearStorageCheckbox.style.mozUserSelect = "none";
        clearStorageCheckbox.style.msUserSelect = "none";
        clearStorageCheckbox._checked = false;
        const toggleCheckbox = () => {
            clearStorageCheckbox._checked = !clearStorageCheckbox._checked;
            clearStorageCheckbox.textContent = clearStorageCheckbox._checked ? "✓" : " ";
        };
        clearStorageCheckbox.onclick = toggleCheckbox;
        const checkboxLabel = document.createElement("label");
        checkboxLabel.textContent = "Also clear all localStorage data";
        checkboxLabel.style.color = colors.text;
        checkboxLabel.style.fontSize = "11px";
        checkboxLabel.style.fontFamily = fontFamily;
        checkboxLabel.style.cursor = "pointer";
        checkboxLabel.style.userSelect = "none";
        checkboxLabel.style.webkitUserSelect = "none";
        checkboxLabel.style.mozUserSelect = "none";
        checkboxLabel.style.msUserSelect = "none";
        checkboxLabel.onclick = toggleCheckbox;
        checkboxContainer.appendChild(clearStorageCheckbox);
        checkboxContainer.appendChild(checkboxLabel);
    }
    const buttonContainer = document.createElement("div");
    buttonContainer.style.display = "flex";
    buttonContainer.style.gap = "10px";
    buttonContainer.style.justifyContent = "center";
    const yesButton = document.createElement("button");
    yesButton.textContent = "Yes";
    yesButton.style.background = colors.buttonBg;
    yesButton.style.color = colors.buttonText;
    yesButton.style.border = "1px solid " + colors.buttonBorder;
    yesButton.style.borderTop = "1px solid " + colors.buttonBorderLight;
    yesButton.style.borderLeft = "1px solid " + colors.buttonBorderLight;
    yesButton.style.padding = "8px 16px";
    yesButton.style.cursor = "pointer";
    yesButton.style.borderRadius = "0";
    yesButton.style.fontFamily = fontFamily;
    yesButton.style.fontSize = "12px";
    yesButton.style.boxShadow = "inset 0 1px 0 rgba(0, 0, 0, 0.3), 0 1px 0 rgba(255, 255, 255, 0.1)";
    yesButton.onmouseover = () => { yesButton.style.background = colors.buttonHover; yesButton.style.borderColor = colors.buttonBorderLight; };
    yesButton.onmouseout = () => { yesButton.style.background = colors.buttonBg; yesButton.style.borderColor = colors.buttonBorder; yesButton.style.borderTop = "1px solid " + colors.buttonBorderLight; yesButton.style.borderLeft = "1px solid " + colors.buttonBorderLight; };
    yesButton.onclick = (e) => {
        e.stopPropagation();
        const clearStorage = showClearStorage && clearStorageCheckbox && clearStorageCheckbox._checked === true;
        document.body.removeChild(dialog);
        callback(true, clearStorage);
    };
    const noButton = document.createElement("button");
    noButton.textContent = "No";
    noButton.style.background = colors.buttonBg;
    noButton.style.color = colors.buttonText;
    noButton.style.border = "1px solid " + colors.buttonBorder;
    noButton.style.borderTop = "1px solid " + colors.buttonBorderLight;
    noButton.style.borderLeft = "1px solid " + colors.buttonBorderLight;
    noButton.style.padding = "8px 16px";
    noButton.style.cursor = "pointer";
    noButton.style.borderRadius = "0";
    noButton.style.fontFamily = fontFamily;
    noButton.style.fontSize = "12px";
    noButton.style.boxShadow = "inset 0 1px 0 rgba(0, 0, 0, 0.3), 0 1px 0 rgba(255, 255, 255, 0.1)";
    noButton.onmouseover = () => { noButton.style.background = colors.buttonHover; noButton.style.borderColor = colors.buttonBorderLight; };
    noButton.onmouseout = () => { noButton.style.background = colors.buttonBg; noButton.style.borderColor = colors.buttonBorder; noButton.style.borderTop = "1px solid " + colors.buttonBorderLight; noButton.style.borderLeft = "1px solid " + colors.buttonBorderLight; };
    noButton.onclick = (e) => {
        e.stopPropagation();
        document.body.removeChild(dialog);
        callback(false);
    };
    buttonContainer.appendChild(yesButton);
    buttonContainer.appendChild(noButton);
    const confirmTitlebar = document.createElement("div");
    confirmTitlebar.className = "dialog-titlebar";
    confirmTitlebar.style.cssText = `margin:0 -20px 16px;padding:8px 14px;display:flex;align-items:center;gap:8px;`;
    confirmTitlebar.innerHTML = `<i class="fas fa-exclamation-circle" style="flex-shrink:0;"></i><span style="font-family:${fontFamily};font-size:13px;color:${colors.text};user-select:none;">Confirm</span>`;
    content.appendChild(confirmTitlebar);
    content.appendChild(messageEl);
    if (showClearStorage && clearStorageCheckbox) {
        content.appendChild(checkboxContainer);
    }
    content.appendChild(buttonContainer);
    dialog.appendChild(content);
    document.body.appendChild(dialog);
    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            const clearStorage = showClearStorage && clearStorageCheckbox && clearStorageCheckbox._checked === true;
            if (dialog.parentNode) {
                document.body.removeChild(dialog);
            }
            callback(true, clearStorage);
            document.removeEventListener("keydown", handleKeyPress);
        } else if (e.key === "Escape") {
            e.preventDefault();
            if (dialog.parentNode) {
                document.body.removeChild(dialog);
            }
            callback(false);
            document.removeEventListener("keydown", handleKeyPress);
        }
    };
    setTimeout(() => document.addEventListener("keydown", handleKeyPress), 100);
}

function showWorkspaceBrowserDialog() {
    const wsKeys = [...workspaceImageKeys].filter(k => imageLibrary.has(k));
    const localKeys = [...imageLibrary.keys()].filter(k => !workspaceImageKeys.has(k));
    const ganiFiles = localFileCache.ganiFiles || [];
    if (!wsKeys.length && !localKeys.length && !ganiFiles.length) { showAlertDialog("No workspace loaded. Use Set Working Directory to load a workspace first."); return; }
    const currentFont = localStorage.getItem("editorFont") || "chevyray";
    const fontFamily = getFontFamily(currentFont);
    const currentScheme = localStorage.getItem("editorColorScheme") || "default";
    let dc = {panel:"#2b2b2b",border:"#0a0a0a",text:"#e0e0e0",inputBg:"#1a1a1a",buttonBg:"#2b2b2b",buttonText:"#e0e0e0",hover:"#404040"};
    if (currentScheme !== "default") {
        const schemes = {"fusion-light":{panel:"#ffffff",border:"#d0d0d0",text:"#1a1a1a",inputBg:"#ffffff",buttonBg:"#ffffff",buttonText:"#1a1a1a",hover:"#e8e8e8"},"fusion-dark":{panel:"#2d2d2d",border:"#0f0f0f",text:"#e8e8e8",inputBg:"#1e1e1e",buttonBg:"#2d2d2d",buttonText:"#e8e8e8",hover:"#3d3d3d"},"dark-style":{panel:"#252525",border:"#3c3c3c",text:"#cccccc",inputBg:"#1e1e1e",buttonBg:"#252525",buttonText:"#cccccc",hover:"#3e3e3e"},"dark-orange":{panel:"#3a2f2a",border:"#1a0f0a",text:"#ffaa55",inputBg:"#2a1f1a",buttonBg:"#3a2f2a",buttonText:"#ffaa55",hover:"#4a3f3a"},"aqua":{panel:"#1a2a2f",border:"#0a0a0a",text:"#55ffff",inputBg:"#0a1a1f",buttonBg:"#1a2a2f",buttonText:"#55ffff",hover:"#2a3a3f"},"elegant-dark":{panel:"#2d2d2d",border:"#404040",text:"#e8e8e8",inputBg:"#1a1a1a",buttonBg:"#2d2d2d",buttonText:"#e8e8e8",hover:"#3d3d3d"},"material-dark":{panel:"#1e1e1e",border:"#333333",text:"#ffffff",inputBg:"#121212",buttonBg:"#1e1e1e",buttonText:"#ffffff",hover:"#2e2e2e"},"light-style":{panel:"#ffffff",border:"#e0e0e0",text:"#000000",inputBg:"#ffffff",buttonBg:"#ffffff",buttonText:"#000000",hover:"#f5f5f5"},"ayu-mirage":{panel:"#232834",border:"#191e2a",text:"#cbccc6",inputBg:"#1f2430",buttonBg:"#232834",buttonText:"#cbccc6",hover:"#2a2f3a"},"dracula":{panel:"#343746",border:"#21222c",text:"#f8f8f2",inputBg:"#282a36",buttonBg:"#343746",buttonText:"#f8f8f2",hover:"#44475a"}};
        if (schemes[currentScheme]) dc = schemes[currentScheme];
    }
    const _dcs = getComputedStyle(document.documentElement);
    const _dcv = v => _dcs.getPropertyValue(v).trim();
    if (_dcv('--dialog-bg')) dc.panel = _dcv('--dialog-bg');
    if (_dcv('--dialog-text')) dc.text = _dcv('--dialog-text');
    if (_dcv('--dialog-input-bg')) dc.inputBg = _dcv('--dialog-input-bg');
    if (_dcv('--dialog-border')) dc.border = _dcv('--dialog-border');
    if (_dcv('--dialog-button-bg')) dc.buttonBg = _dcv('--dialog-button-bg');
    if (_dcv('--dialog-button-text')) dc.buttonText = _dcv('--dialog-button-text');
    const borderTL = dc.border === "#0a0a0a" ? "#404040" : dc.border;
    const overlay = document.createElement("div");
    overlay.className = "dialog-overlay";
    overlay.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:10000;display:flex;justify-content:center;align-items:center;";
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    const content = document.createElement("div");
    content.className = "dialog-content";
    content.style.cssText = `background:${dc.panel};border:1px solid ${borderTL};box-shadow:inset 0 1px 0 rgba(0,0,0,0.3),0 2px 4px rgba(0,0,0,0.5);width:760px;max-width:93vw;height:580px;max-height:90vh;display:flex;flex-direction:column;overflow:hidden;resize:both;font-family:${fontFamily};color:${dc.text};`;
    const titlebar = document.createElement("div");
    titlebar.className = "dialog-titlebar";
    titlebar.style.cssText = "flex-shrink:0;padding:10px 14px;display:flex;align-items:center;gap:8px;";
    titlebar.innerHTML = `<i class="fas fa-folder-open" style="flex-shrink:0;"></i><span>Workspace Browser</span>`;
    content.appendChild(titlebar);
    const tabRow = document.createElement("div");
    tabRow.style.cssText = `display:flex;flex-shrink:0;align-items:center;border-bottom:1px solid ${dc.border};padding:0 8px;gap:2px;background:${dc.inputBg};`;
    let activeTab = wsKeys.length ? "workspace" : (localKeys.length ? "local" : "ganis");
    const tabs = {};
    const makeTab = (id, label) => {
        const t = document.createElement("button");
        t.textContent = label;
        t.style.cssText = `background:none;border:none;border-bottom:2px solid transparent;padding:8px 14px;cursor:pointer;font-size:12px;font-family:${fontFamily};color:${dc.text};`;
        t.onclick = () => { activeTab = id; navState[id] = null; Object.entries(tabs).forEach(([k,el]) => el.style.borderBottomColor = k===activeTab ? dc.text : "transparent"); render(); };
        tabs[id] = t; tabRow.appendChild(t);
    };
    if (wsKeys.length) makeTab("workspace", `Workspace (${wsKeys.length})`);
    if (localKeys.length) makeTab("local", `Local (${localKeys.length})`);
    makeTab("ganis", `Ganis (${ganiFiles.length})`);
    tabs[activeTab].style.borderBottomColor = dc.text;
    const spacer = document.createElement("div"); spacer.style.flex = "1"; tabRow.appendChild(spacer);
    const searchInput = document.createElement("input");
    searchInput.type = "text"; searchInput.placeholder = "Search...";
    searchInput.style.cssText = `background:${dc.inputBg};color:${dc.text};border:1px solid ${borderTL};padding:3px 7px;font-size:11px;font-family:${fontFamily};border-radius:3px;width:140px;margin:4px 0;`;
    searchInput.oninput = () => render();
    tabRow.appendChild(searchInput);
    const tabPane = document.createElement("div");
    tabPane.style.cssText = "flex:1;overflow:hidden;min-height:0;display:flex;flex-direction:column;";
    const navState = { workspace: null, local: null };
    let activeObserver = null;
    const PAGE = 200;
    const buildPrefixGroups = (keys) => {
        const folders = new Map(), files = [];
        for (const k of keys) { const i = k.indexOf('_'); const p = i>0 ? k.slice(0,i) : null; if (p) { if (!folders.has(p)) folders.set(p,[]); folders.get(p).push(k); } else files.push(k); }
        const result = { folders: new Map(), files: [...files] };
        for (const [p,items] of folders) { if (items.length>=2) result.folders.set(p,items); else result.files.push(...items); }
        return result;
    };
    const fuzzy = (s,q) => { let i=0; for(const c of s) if(i<q.length&&c===q[i]) i++; return i===q.length; };
    const renderImages = (allKeys) => {
        if (activeObserver) { activeObserver.disconnect(); activeObserver = null; }
        const q = searchInput.value.trim().toLowerCase();
        const folder = navState[activeTab];
        const wrap = document.createElement("div"); wrap.style.cssText = "display:flex;flex-direction:column;flex:1;overflow:hidden;min-height:0;";
        const breadcrumb = document.createElement("div");
        breadcrumb.style.cssText = `display:flex;align-items:center;gap:4px;padding:5px 10px;font-size:11px;border-bottom:1px solid ${dc.border};flex-shrink:0;background:${dc.inputBg};`;
        const homeLink = Object.assign(document.createElement("span"), {textContent:"Home"});
        homeLink.style.cssText = `cursor:${folder?"pointer":"default"};opacity:${folder?1:0.5};`;
        if (folder) homeLink.onclick = () => { navState[activeTab]=null; render(); };
        breadcrumb.appendChild(homeLink);
        if (folder) {
            breadcrumb.appendChild(Object.assign(document.createElement("span"),{textContent:" › ",style:"opacity:0.4;"}));
            breadcrumb.appendChild(Object.assign(document.createElement("span"),{textContent:`${folder}`}));
        }
        wrap.appendChild(breadcrumb);
        const scrollArea = document.createElement("div"); scrollArea.style.cssText = "flex:1;overflow:auto;padding:8px;";
        let showFolders = [], displayKeys = [];
        if (folder) {
            displayKeys = allKeys.filter(k => k.startsWith(folder+'_') && (!q || fuzzy(k,q)));
        } else if (q) {
            displayKeys = allKeys.filter(k => fuzzy(k,q));
        } else {
            const groups = buildPrefixGroups(allKeys);
            showFolders = [...groups.folders.entries()].sort(([a],[b])=>a.localeCompare(b));
            displayKeys = [...groups.files].sort();
        }
        let shownCount = PAGE;
        const renderPage = () => {
            scrollArea.innerHTML = "";
            if (activeObserver) activeObserver.disconnect();
            activeObserver = new IntersectionObserver(entries => {
                for (const e of entries) {
                    if (!e.isIntersecting || e.target.dataset.loaded) continue;
                    e.target.dataset.loaded = "1";
                    const img = imageLibrary.get(e.target.dataset.key);
                    const c = e.target.querySelector("canvas");
                    if (img && c) {
                        const ctx = c.getContext("2d");
                        for (let cy=0;cy<80;cy+=8) for (let cx=0;cx<80;cx+=8) { ctx.fillStyle=((cx+cy)/8%2<1)?"#555":"#888"; ctx.fillRect(cx,cy,8,8); }
                        const sc=Math.min(80/img.width,80/img.height,1);
                        ctx.drawImage(img,(80-img.width*sc)/2,(80-img.height*sc)/2,img.width*sc,img.height*sc);
                    }
                    activeObserver.unobserve(e.target);
                }
            }, { root: scrollArea, rootMargin:"200px" });
            if (showFolders.length) {
                const fg = document.createElement("div"); fg.style.cssText = "display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:6px;margin-bottom:8px;";
                for (const [prefix,items] of showFolders) {
                    const fi = document.createElement("div");
                    fi.style.cssText = `display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 4px;cursor:pointer;border:1px solid transparent;border-radius:3px;text-align:center;user-select:none;`;
                    fi.onmouseenter=()=>{fi.style.background=dc.hover;fi.style.borderColor=borderTL;}; fi.onmouseleave=()=>{fi.style.background="";fi.style.borderColor="transparent";};
                    fi.innerHTML=`<i class="fas fa-folder" style="font-size:34px;color:#e8b84b;"></i><div style="font-size:10px;color:${dc.text};max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${prefix}">${prefix}</div><div style="font-size:9px;color:${dc.text};opacity:0.45;">${items.length}</div>`;
                    fi.ondblclick=()=>{navState[activeTab]=prefix;render();}; fi.onclick=()=>{scrollArea.querySelectorAll(".wbi").forEach(d=>{d.style.background="";d.style.borderColor="transparent";});fi.style.background=dc.hover;fi.style.borderColor=dc.text;fi.className="wbi";};
                    fg.appendChild(fi);
                }
                scrollArea.appendChild(fg);
                if (displayKeys.length) { const sep=document.createElement("div"); sep.style.cssText=`border-top:1px solid ${dc.border};margin:4px 0 8px;`; scrollArea.appendChild(sep); }
            }
            const visible = displayKeys.slice(0, shownCount);
            if (visible.length) {
                const grid = document.createElement("div"); grid.style.cssText = "display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:6px;";
                for (const key of visible) {
                    const item = document.createElement("div"); item.className="wbi"; item.dataset.key=key;
                    item.style.cssText=`display:flex;flex-direction:column;align-items:center;gap:4px;padding:6px 4px;cursor:pointer;border:1px solid transparent;border-radius:3px;user-select:none;`;
                    item.onmouseenter=()=>{item.style.background=dc.hover;item.style.borderColor=borderTL;}; item.onmouseleave=()=>{item.style.background="";item.style.borderColor="transparent";};
                    const c=document.createElement("canvas"); c.width=80; c.height=80;
                    const lbl=document.createElement("div"); lbl.style.cssText=`font-size:10px;color:${dc.text};text-align:center;max-width:92px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;`; lbl.textContent=key; lbl.title=key;
                    item.appendChild(c); item.appendChild(lbl);
                    item.ondblclick=()=>{overlay.remove();showAddSpriteDialog(null,key);};
                    item.onclick=()=>{scrollArea.querySelectorAll(".wbi").forEach(d=>{d.style.background="";d.style.borderColor="transparent";});item.style.background=dc.hover;item.style.borderColor=dc.text;};
                    grid.appendChild(item); activeObserver.observe(item);
                }
                scrollArea.appendChild(grid);
            }
            if (shownCount < displayKeys.length) {
                const more=document.createElement("button"); more.style.cssText=`display:block;margin:12px auto;background:${dc.buttonBg};color:${dc.buttonText};border:1px solid ${borderTL};padding:5px 16px;cursor:pointer;font-size:12px;font-family:${fontFamily};border-radius:3px;`;
                more.textContent=`Load more (${displayKeys.length-shownCount} remaining)`; more.onclick=()=>{shownCount+=PAGE;renderPage();}; scrollArea.appendChild(more);
            }
            if (!showFolders.length && !displayKeys.length) {
                const empty=document.createElement("div"); empty.style.cssText=`padding:20px;color:${dc.text};opacity:0.5;text-align:center;`; empty.textContent=q?"No matches.":"No images."; scrollArea.appendChild(empty);
            }
        };
        renderPage(); wrap.appendChild(scrollArea); return wrap;
    };
    const render = () => {
        tabPane.innerHTML = "";
        if (activeTab === "ganis") {
            const q = searchInput.value.trim().toLowerCase();
            const filtered = q ? ganiFiles.filter(f=>fuzzy(f.name.toLowerCase(),q)) : ganiFiles;
            if (!filtered.length) { tabPane.innerHTML=`<div style="padding:20px;color:${dc.text};opacity:0.5;text-align:center;">${ganiFiles.length?"No matches.":"No ganis in workspace."}</div>`; return; }
            const list = document.createElement("div"); list.style.cssText="display:flex;flex-direction:column;gap:1px;padding:8px;overflow:auto;flex:1;";
            for (const file of filtered) {
                const item=document.createElement("div"); item.style.cssText=`padding:7px 10px;cursor:pointer;border-radius:3px;font-size:12px;color:${dc.text};display:flex;align-items:center;gap:8px;font-family:${fontFamily};`;
                item.onmouseenter=()=>item.style.background=dc.hover; item.onmouseleave=()=>item.style.background="";
                item.innerHTML=`<i class="fas fa-file-code" style="opacity:0.55;width:14px;"></i><span>${file.name}</span>`;
                item.onclick=async()=>{
                    overlay.remove();
                    try {
                        const text=await file.text();
                        if (/[\x00-\x08\x0e-\x1f]/.test(text.substring(0, 256))) return;
                        const ani=parseGani(text);
                        ani.fileName=file.name;
                        addTab(ani,file.name);
                    } catch(err){showAlertDialog("Failed to open: "+err.message);}
                };
                list.appendChild(item);
            }
            tabPane.appendChild(list);
        } else {
            tabPane.appendChild(renderImages(activeTab==="workspace" ? wsKeys : localKeys));
        }
    };
    render();
    content.appendChild(tabRow); content.appendChild(tabPane);
    overlay.appendChild(content); document.body.appendChild(overlay);
}
function showAddSpriteDialog(editSprite = null, preSelectImage = null) {
    const currentFont = localStorage.getItem("editorFont") || "chevyray";
    const fontFamily = getFontFamily(currentFont);
    const dialog = document.createElement("div");
    dialog.className = "dialog-overlay";
    dialog.style.display = "flex";
    dialog.style.justifyContent = "center";
    dialog.style.alignItems = "center";
    dialog.style.position = "fixed";
    dialog.style.top = "0";
    dialog.style.left = "0";
    dialog.style.width = "100%";
    dialog.style.height = "100%";
    dialog.style.background = "rgba(0,0,0,0.7)";
    dialog.style.zIndex = "10000";
    const content = document.createElement("div");
    content.className = "add-sprite-dialog-content dialog-content";
    const currentScheme = localStorage.getItem("editorColorScheme") || "default";
    let dialogColors = {panel: "#2b2b2b", border: "#0a0a0a", text: "#e0e0e0", inputBg: "#1a1a1a", buttonBg: "#2b2b2b", buttonText: "#e0e0e0", buttonHover: "#404040"};
    if (currentScheme !== "default") {
        const schemes = {
            "fusion-light": {panel: "#ffffff", border: "#d0d0d0", text: "#1a1a1a", inputBg: "#ffffff", buttonBg: "#ffffff", buttonText: "#1a1a1a", buttonHover: "#f0f0f0"},
            "fusion-dark": {panel: "#2d2d2d", border: "#0f0f0f", text: "#e8e8e8", inputBg: "#1e1e1e", buttonBg: "#2d2d2d", buttonText: "#e8e8e8", buttonHover: "#3d3d3d"},
            "dark-style": {panel: "#252525", border: "#3c3c3c", text: "#cccccc", inputBg: "#1e1e1e", buttonBg: "#252525", buttonText: "#cccccc", buttonHover: "#3e3e3e"},
            "dark-orange": {panel: "#3a2f2a", border: "#1a0f0a", text: "#ffaa55", inputBg: "#2a1f1a", buttonBg: "#3a2f2a", buttonText: "#ffaa55", buttonHover: "#4a3f3a"},
            "aqua": {panel: "#1a2a2f", border: "#0a0a0a", text: "#55ffff", inputBg: "#0a1a1f", buttonBg: "#1a2a2f", buttonText: "#55ffff", buttonHover: "#2a3a3f"},
            "elegant-dark": {panel: "#2d2d2d", border: "#404040", text: "#e8e8e8", inputBg: "#1a1a1a", buttonBg: "#2d2d2d", buttonText: "#e8e8e8", buttonHover: "#3d3d3d"},
            "material-dark": {panel: "#1e1e1e", border: "#333333", text: "#ffffff", inputBg: "#121212", buttonBg: "#1e1e1e", buttonText: "#ffffff", buttonHover: "#2e2e2e"},
            "light-style": {panel: "#ffffff", border: "#e0e0e0", text: "#000000", inputBg: "#ffffff", buttonBg: "#ffffff", buttonText: "#000000", buttonHover: "#f0f0f0"},
            "ayu-mirage": {panel: "#232834", border: "#191e2a", text: "#cbccc6", inputBg: "#1f2430", buttonBg: "#232834", buttonText: "#cbccc6", buttonHover: "#2a2f3a"},
            "dracula": {panel: "#343746", border: "#21222c", text: "#f8f8f2", inputBg: "#282a36", buttonBg: "#343746", buttonText: "#f8f8f2", buttonHover: "#44475a"}
        };
        if (schemes[currentScheme]) dialogColors = schemes[currentScheme];
    }
    const _dcs = getComputedStyle(document.documentElement);
    const _dcv = (v) => _dcs.getPropertyValue(v).trim();
    if (_dcv('--dialog-bg')) dialogColors.panel = _dcv('--dialog-bg');
    if (_dcv('--dialog-text')) dialogColors.text = _dcv('--dialog-text');
    if (_dcv('--dialog-input-bg')) dialogColors.inputBg = _dcv('--dialog-input-bg');
    if (_dcv('--dialog-border')) dialogColors.border = _dcv('--dialog-border');
    if (_dcv('--dialog-button-bg')) dialogColors.buttonBg = _dcv('--dialog-button-bg');
    if (_dcv('--dialog-button-text')) { dialogColors.buttonText = _dcv('--dialog-button-text'); }
    content.style.background = dialogColors.panel;
    content.style.padding = "2px";
    content.style.borderRadius = "0";
    content.style.border = `1px solid ${dialogColors.border}`;
    content.style.borderTop = `1px solid ${dialogColors.border === "#0a0a0a" ? "#404040" : dialogColors.border}`;
    content.style.borderLeft = `1px solid ${dialogColors.border === "#0a0a0a" ? "#404040" : dialogColors.border}`;
    content.style.boxShadow = "inset 0 1px 0 rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.5)";
    content.style.width = "780px";
    content.style.maxWidth = "90vw";
    content.style.height = "875px";
    content.style.maxHeight = "90vh";
    content.style.display = "flex";
    content.style.flexDirection = "column";
    content.style.overflow = "hidden";
    content.style.resize = "both";
    content.style.fontFamily = fontFamily;
    content.style.color = dialogColors.text;
    const titlebar = document.createElement("div");
    titlebar.className = "dialog-titlebar";
    titlebar.style.cssText = "flex-shrink:0;padding:10px 14px;display:flex;align-items:center;gap:8px;";
    const titleIcon = document.createElement("i");
    titleIcon.className = "fas fa-pencil";
    titleIcon.style.cssText = "flex-shrink:0;";
    const titleText = document.createElement("span");
    titleText.textContent = editSprite ? "Edit Sprite" : "Add Sprite";
    titlebar.appendChild(titleIcon);
    titlebar.appendChild(titleText);
    content.appendChild(titlebar);
    const splitter = document.createElement("div");
    splitter.style.display = "flex";
    splitter.style.flex = "1";
    splitter.style.minHeight = "0";
    splitter.style.gap = "2px";
    const leftPanel = document.createElement("div");
    leftPanel.style.display = "flex";
    leftPanel.style.flexDirection = "column";
    leftPanel.style.width = "320px";
    leftPanel.style.minWidth = "280px";
    leftPanel.style.padding = "8px 8px 8px 12px";
    leftPanel.style.overflowY = "auto";
    leftPanel.style.overflowX = "visible";
    leftPanel.style.minHeight = "0";
    leftPanel.style.maxHeight = "100%";
    leftPanel.style.boxSizing = "border-box";
    leftPanel.style.flexShrink = "0";
    leftPanel.style.background = dialogColors.panel;
    leftPanel.style.color = dialogColors.text;
    leftPanel.className = "add-sprite-dialog-left";
    const formLayout = document.createElement("div");
    formLayout.style.display = "flex";
    formLayout.style.flexDirection = "column";
    formLayout.style.gap = "4px";
    formLayout.style.minWidth = "0";
    formLayout.style.width = "100%";
    const row1 = document.createElement("div");
    row1.style.display = "flex";
    row1.style.alignItems = "center";
    row1.style.gap = "4px";
    const borderTopLeft = dialogColors.border === "#0a0a0a" ? "#404040" : dialogColors.border;
    row1.innerHTML = `<label style="width:100px;font-size:12px;flex-shrink:0;color:${dialogColors.text};text-shadow:0 0 2px rgba(0,0,0,0.8);user-select:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;cursor:default;">Image Source:</label><select id="addSpriteSource" style="flex:1;min-width:0;background:${dialogColors.inputBg};color:${dialogColors.text};border:1px solid ${dialogColors.border};border-top:1px solid ${borderTopLeft};border-left:1px solid ${borderTopLeft};padding:4px;font-size:12px;font-family:${fontFamily};box-shadow:inset 0 1px 0 rgba(0,0,0,0.3);"><option>CUSTOM</option><option>SPRITES</option><option>BODY</option><option>HEAD</option><option>SWORD</option><option>SHIELD</option><option>HORSE</option><option>PICS</option><option>ATTR1</option><option>ATTR2</option><option>ATTR3</option><option>ATTR4</option><option>ATTR5</option><option>ATTR6</option><option>ATTR7</option><option>ATTR8</option><option>ATTR9</option><option>ATTR10</option><option>PARAM1</option><option>PARAM2</option><option>PARAM3</option><option>PARAM4</option><option>PARAM5</option><option>PARAM6</option><option>PARAM7</option><option>PARAM8</option><option>PARAM9</option><option>PARAM10</option></select>`;
    const row2 = document.createElement("div");
    row2.style.display = "flex";
    row2.style.alignItems = "center";
    row2.style.gap = "4px";
    row2.innerHTML = `<label style="width:100px;font-size:12px;flex-shrink:0;color:${dialogColors.text};text-shadow:0 0 2px rgba(0,0,0,0.8);user-select:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;cursor:default;">Image File:</label><input type="text" id="addSpriteImageFile" readonly style="flex:1;min-width:0;background:${dialogColors.inputBg};color:${dialogColors.text};border:1px solid ${dialogColors.border};border-top:1px solid ${borderTopLeft};border-left:1px solid ${borderTopLeft};padding:4px;font-size:12px;font-family:${fontFamily};box-shadow:inset 0 1px 0 rgba(0,0,0,0.3);"><button id="addSpriteBrowse" style="background:${dialogColors.buttonBg};color:${dialogColors.buttonText};border:1px solid ${dialogColors.border};border-top:1px solid ${borderTopLeft};border-left:1px solid ${borderTopLeft};padding:4px 8px;cursor:pointer;font-size:12px;font-family:${fontFamily};flex-shrink:0;box-shadow:inset 0 1px 0 rgba(0,0,0,0.3),0 1px 0 rgba(255,255,255,0.1);">Select</button>`;
    const row3 = document.createElement("div");
    row3.style.display = "flex";
    row3.style.alignItems = "center";
    row3.style.gap = "4px";
    row3.innerHTML = `<label style="width:100px;font-size:12px;flex-shrink:0;color:${dialogColors.text};text-shadow:0 0 2px rgba(0,0,0,0.8);user-select:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;cursor:default;">Comment:</label><input type="text" id="addSpriteComment" value="New Sprite" style="flex:1;min-width:0;background:${dialogColors.inputBg};color:${dialogColors.text};border:1px solid ${dialogColors.border};border-top:1px solid ${borderTopLeft};border-left:1px solid ${borderTopLeft};padding:4px;font-size:12px;font-family:${fontFamily};box-shadow:inset 0 1px 0 rgba(0,0,0,0.3);">`;
    const row4 = document.createElement("div");
    row4.style.display = "flex";
    row4.style.alignItems = "center";
    row4.style.gap = "4px";
    row4.innerHTML = `<label style="width:100px;font-size:12px;flex-shrink:0;color:${dialogColors.text};text-shadow:0 0 2px rgba(0,0,0,0.8);user-select:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;cursor:default;">Sprite Index:</label><input type="number" id="addSpriteIndex" value="${currentAnimation.nextSpriteIndex}" style="flex:1;min-width:0;background:${dialogColors.inputBg};color:${dialogColors.text};border:1px solid ${dialogColors.border};border-top:1px solid ${borderTopLeft};border-left:1px solid ${borderTopLeft};padding:4px;font-size:12px;font-family:${fontFamily};box-shadow:inset 0 1px 0 rgba(0,0,0,0.3);">`;
    const spriteSizeGroup = document.createElement("div");
    spriteSizeGroup.style.border = `1px solid ${dialogColors.border}`;
    spriteSizeGroup.style.borderTop = `1px solid ${borderTopLeft}`;
    spriteSizeGroup.style.borderLeft = `1px solid ${borderTopLeft}`;
    spriteSizeGroup.style.padding = "6px 4px 2px 4px";
    spriteSizeGroup.style.marginTop = "8px";
    spriteSizeGroup.style.background = dialogColors.panel;
    spriteSizeGroup.style.boxShadow = "inset 0 1px 0 rgba(0,0,0,0.3)";
    spriteSizeGroup.className = "add-sprite-dialog-group";
    spriteSizeGroup.innerHTML = `<div style="font-weight:bold;font-size:12px;margin-bottom:4px;color:${dialogColors.text};text-shadow:0 0 2px rgba(0,0,0,0.8);user-select:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;">Sprite Size</div>`;
    const sizeGrid = document.createElement("div");
    sizeGrid.style.display = "grid";
    sizeGrid.style.gridTemplateColumns = "auto 1fr";
    sizeGrid.style.gap = "4px 8px";
    sizeGrid.style.alignItems = "center";
    sizeGrid.innerHTML = `<label style="font-size:12px;flex-shrink:0;color:${dialogColors.text};text-shadow:0 0 2px rgba(0,0,0,0.8);user-select:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;cursor:default;">Left:</label><input type="number" id="addSpriteLeft" value="0" style="width:100%;background:${dialogColors.inputBg};color:${dialogColors.text};border:1px solid ${dialogColors.border};border-top:1px solid ${borderTopLeft};border-left:1px solid ${borderTopLeft};padding:4px;font-size:12px;font-family:${fontFamily};box-shadow:inset 0 1px 0 rgba(0,0,0,0.3);"><label style="font-size:12px;flex-shrink:0;color:${dialogColors.text};text-shadow:0 0 2px rgba(0,0,0,0.8);user-select:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;cursor:default;">Top:</label><input type="number" id="addSpriteTop" value="0" style="width:100%;background:${dialogColors.inputBg};color:${dialogColors.text};border:1px solid ${dialogColors.border};border-top:1px solid ${borderTopLeft};border-left:1px solid ${borderTopLeft};padding:4px;font-size:12px;font-family:${fontFamily};box-shadow:inset 0 1px 0 rgba(0,0,0,0.3);"><label style="font-size:12px;flex-shrink:0;color:${dialogColors.text};text-shadow:0 0 2px rgba(0,0,0,0.8);user-select:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;cursor:default;">Width:</label><input type="number" id="addSpriteWidth" value="32" style="width:100%;background:${dialogColors.inputBg};color:${dialogColors.text};border:1px solid ${dialogColors.border};border-top:1px solid ${borderTopLeft};border-left:1px solid ${borderTopLeft};padding:4px;font-size:12px;font-family:${fontFamily};box-shadow:inset 0 1px 0 rgba(0,0,0,0.3);"><label style="font-size:12px;flex-shrink:0;color:${dialogColors.text};text-shadow:0 0 2px rgba(0,0,0,0.8);user-select:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;cursor:default;">Height:</label><input type="number" id="addSpriteHeight" value="32" style="width:100%;background:${dialogColors.inputBg};color:${dialogColors.text};border:1px solid ${dialogColors.border};border-top:1px solid ${borderTopLeft};border-left:1px solid ${borderTopLeft};padding:4px;font-size:12px;font-family:${fontFamily};box-shadow:inset 0 1px 0 rgba(0,0,0,0.3);"><div style="grid-column:1/-1;display:flex;gap:8px;align-items:center;justify-content:flex-end;"><button id="addSpriteAutoDetect" title="Auto Detect Sprite - Click to toggle, then click on image to detect sprite" style="background:${dialogColors.buttonBg};color:${dialogColors.buttonText};border:1px solid ${dialogColors.border};border-top:1px solid ${borderTopLeft};border-left:1px solid ${borderTopLeft};padding:4px 8px;cursor:pointer;font-size:12px;font-family:${fontFamily};box-shadow:inset 0 1px 0 rgba(0,0,0,0.3),0 1px 0 rgba(255,255,255,0.1);"><i class="fas fa-magic"></i> Auto Detect Sprite</button></div>`;
    spriteSizeGroup.appendChild(sizeGrid);
    const gridGroup = document.createElement("div");
    gridGroup.style.border = `1px solid ${dialogColors.border}`;
    gridGroup.style.borderTop = `1px solid ${borderTopLeft}`;
    gridGroup.style.borderLeft = `1px solid ${borderTopLeft}`;
    gridGroup.style.padding = "6px 4px 2px 4px";
    gridGroup.style.marginTop = "8px";
    gridGroup.style.background = dialogColors.panel;
    gridGroup.style.boxShadow = "inset 0 1px 0 rgba(0,0,0,0.3)";
    gridGroup.className = "add-sprite-dialog-group";
    gridGroup.innerHTML = `<div style="font-weight:bold;font-size:12px;margin-bottom:4px;color:${dialogColors.text};text-shadow:0 0 2px rgba(0,0,0,0.8);user-select:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;">Grid Settings</div>`;
    const gridLayout = document.createElement("div");
    gridLayout.style.display = "grid";
    gridLayout.style.gridTemplateColumns = "auto 1fr";
    gridLayout.style.gap = "4px 8px";
    gridLayout.style.alignItems = "center";
    gridLayout.innerHTML = `<label style="font-size:12px;flex-shrink:0;color:${dialogColors.text};text-shadow:0 0 2px rgba(0,0,0,0.8);user-select:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;cursor:default;">Columns:</label><input type="number" id="addSpriteCols" value="1" min="1" style="width:100%;background:${dialogColors.inputBg};color:${dialogColors.text};border:1px solid ${dialogColors.border};border-top:1px solid ${borderTopLeft};border-left:1px solid ${borderTopLeft};padding:4px;font-size:12px;font-family:${fontFamily};box-shadow:inset 0 1px 0 rgba(0,0,0,0.3);"><label style="font-size:12px;flex-shrink:0;color:${dialogColors.text};text-shadow:0 0 2px rgba(0,0,0,0.8);user-select:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;cursor:default;">Column Separation:</label><input type="number" id="addSpriteColSep" value="0" style="width:100%;background:${dialogColors.inputBg};color:${dialogColors.text};border:1px solid ${dialogColors.border};border-top:1px solid ${borderTopLeft};border-left:1px solid ${borderTopLeft};padding:4px;font-size:12px;font-family:${fontFamily};box-shadow:inset 0 1px 0 rgba(0,0,0,0.3);"><label style="font-size:12px;flex-shrink:0;color:${dialogColors.text};text-shadow:0 0 2px rgba(0,0,0,0.8);user-select:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;cursor:default;">Rows:</label><input type="number" id="addSpriteRows" value="1" min="1" style="width:100%;background:${dialogColors.inputBg};color:${dialogColors.text};border:1px solid ${dialogColors.border};border-top:1px solid ${borderTopLeft};border-left:1px solid ${borderTopLeft};padding:4px;font-size:12px;font-family:${fontFamily};box-shadow:inset 0 1px 0 rgba(0,0,0,0.3);"><label style="font-size:12px;flex-shrink:0;color:${dialogColors.text};text-shadow:0 0 2px rgba(0,0,0,0.8);user-select:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;cursor:default;">Row Separation:</label><input type="number" id="addSpriteRowSep" value="0" style="width:100%;background:${dialogColors.inputBg};color:${dialogColors.text};border:1px solid ${dialogColors.border};border-top:1px solid ${borderTopLeft};border-left:1px solid ${borderTopLeft};padding:4px;font-size:12px;font-family:${fontFamily};box-shadow:inset 0 1px 0 rgba(0,0,0,0.3);">`;
    gridGroup.appendChild(gridLayout);
    const effectsGroup = document.createElement("div");
    effectsGroup.style.border = `1px solid ${dialogColors.border}`;
    effectsGroup.style.borderTop = `1px solid ${borderTopLeft}`;
    effectsGroup.style.borderLeft = `1px solid ${borderTopLeft}`;
    effectsGroup.style.padding = "6px 4px 2px 4px";
    effectsGroup.style.marginTop = "8px";
    effectsGroup.style.background = dialogColors.panel;
    effectsGroup.style.boxShadow = "inset 0 1px 0 rgba(0,0,0,0.3)";
    effectsGroup.className = "add-sprite-dialog-group";
    effectsGroup.innerHTML = `<div style="font-weight:bold;font-size:12px;margin-bottom:4px;color:${dialogColors.text};text-shadow:0 0 2px rgba(0,0,0,0.8);user-select:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;">Effects</div>`;
    const effectsGrid = document.createElement("div");
    effectsGrid.style.display = "grid";
    effectsGrid.style.gridTemplateColumns = "auto 1fr";
    effectsGrid.style.gap = "4px 8px";
    effectsGrid.style.alignItems = "center";
    effectsGrid.innerHTML = `<label style="font-size:12px;flex-shrink:0;color:${dialogColors.text};text-shadow:0 0 2px rgba(0,0,0,0.8);user-select:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;cursor:default;">Color Enabled:</label><span id="addSpriteColorEnabledCheckbox" style="display:inline-block;width:16px;height:16px;text-align:center;border:1px solid ${dialogColors.border === "#0a0a0a" ? "#555" : dialogColors.border};background:${dialogColors.inputBg};vertical-align:middle;line-height:14px;font-size:12px;cursor:pointer;user-select:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;"> </span><label style="font-size:12px;flex-shrink:0;color:${dialogColors.text};text-shadow:0 0 2px rgba(0,0,0,0.8);user-select:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;cursor:default;">Color:</label><input type="color" id="addSpriteColorSwatch" style="width:100%;height:32px;background:${dialogColors.inputBg};border:1px solid ${dialogColors.border};border-top:1px solid ${borderTopLeft};border-left:1px solid ${borderTopLeft};cursor:pointer;box-shadow:inset 0 1px 0 rgba(0,0,0,0.3);"><label style="font-size:12px;flex-shrink:0;color:${dialogColors.text};text-shadow:0 0 2px rgba(0,0,0,0.8);user-select:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;cursor:default;">Color R:</label><input type="number" id="addSpriteColorR" min="0" max="255" value="255" style="width:100%;background:${dialogColors.inputBg};color:${dialogColors.text};border:1px solid ${dialogColors.border};border-top:1px solid ${borderTopLeft};border-left:1px solid ${borderTopLeft};padding:4px;font-size:12px;font-family:${fontFamily};box-shadow:inset 0 1px 0 rgba(0,0,0,0.3);"><label style="font-size:12px;flex-shrink:0;color:${dialogColors.text};text-shadow:0 0 2px rgba(0,0,0,0.8);user-select:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;cursor:default;">Color G:</label><input type="number" id="addSpriteColorG" min="0" max="255" value="255" style="width:100%;background:${dialogColors.inputBg};color:${dialogColors.text};border:1px solid ${dialogColors.border};border-top:1px solid ${borderTopLeft};border-left:1px solid ${borderTopLeft};padding:4px;font-size:12px;font-family:${fontFamily};box-shadow:inset 0 1px 0 rgba(0,0,0,0.3);"><label style="font-size:12px;flex-shrink:0;color:${dialogColors.text};text-shadow:0 0 2px rgba(0,0,0,0.8);user-select:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;cursor:default;">Color B:</label><input type="number" id="addSpriteColorB" min="0" max="255" value="255" style="width:100%;background:${dialogColors.inputBg};color:${dialogColors.text};border:1px solid ${dialogColors.border};border-top:1px solid ${borderTopLeft};border-left:1px solid ${borderTopLeft};padding:4px;font-size:12px;font-family:${fontFamily};box-shadow:inset 0 1px 0 rgba(0,0,0,0.3);"><label style="font-size:12px;flex-shrink:0;color:${dialogColors.text};text-shadow:0 0 2px rgba(0,0,0,0.8);user-select:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;cursor:default;">Color A:</label><input type="number" id="addSpriteColorA" min="0" max="255" value="255" style="width:100%;background:${dialogColors.inputBg};color:${dialogColors.text};border:1px solid ${dialogColors.border};border-top:1px solid ${borderTopLeft};border-left:1px solid ${borderTopLeft};padding:4px;font-size:12px;font-family:${fontFamily};box-shadow:inset 0 1px 0 rgba(0,0,0,0.3);"><label style="font-size:12px;flex-shrink:0;color:${dialogColors.text};text-shadow:0 0 2px rgba(0,0,0,0.8);user-select:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;cursor:default;">Zoom:</label><input type="number" id="addSpriteZoom" min="0.1" max="10" step="0.01" value="1" style="width:100%;background:${dialogColors.inputBg};color:${dialogColors.text};border:1px solid ${dialogColors.border};border-top:1px solid ${borderTopLeft};border-left:1px solid ${borderTopLeft};padding:4px;font-size:12px;font-family:${fontFamily};box-shadow:inset 0 1px 0 rgba(0,0,0,0.3);"><label style="font-size:12px;flex-shrink:0;color:${dialogColors.text};text-shadow:0 0 2px rgba(0,0,0,0.8);user-select:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;cursor:default;">Rotate:</label><input type="number" id="addSpriteRotate" min="-360" max="360" step="1" value="0" style="width:100%;background:${dialogColors.inputBg};color:${dialogColors.text};border:1px solid ${dialogColors.border};border-top:1px solid ${borderTopLeft};border-left:1px solid ${borderTopLeft};padding:4px;font-size:12px;font-family:${fontFamily};box-shadow:inset 0 1px 0 rgba(0,0,0,0.3);"><label style="font-size:12px;flex-shrink:0;color:${dialogColors.text};text-shadow:0 0 2px rgba(0,0,0,0.8);user-select:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;cursor:default;">Mode:</label><select id="addSpriteMode" style="width:100%;background:${dialogColors.inputBg};color:${dialogColors.text};border:1px solid ${dialogColors.border};border-top:1px solid ${borderTopLeft};border-left:1px solid ${borderTopLeft};padding:4px;font-size:12px;font-family:${fontFamily};box-shadow:inset 0 1px 0 rgba(0,0,0,0.3);"><option value="">Simple (Off)</option><option value="0">Lights (0)</option><option value="1">Transparency (1)</option><option value="2">Blacklight (2)</option></select><label style="font-size:12px;flex-shrink:0;color:${dialogColors.text};text-shadow:0 0 2px rgba(0,0,0,0.8);user-select:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;cursor:default;">StretchX:</label><input type="number" id="addSpriteStretchX" min="-10" max="10" step="0.01" value="1" style="width:100%;background:${dialogColors.inputBg};color:${dialogColors.text};border:1px solid ${dialogColors.border};border-top:1px solid ${borderTopLeft};border-left:1px solid ${borderTopLeft};padding:4px;font-size:12px;font-family:${fontFamily};box-shadow:inset 0 1px 0 rgba(0,0,0,0.3);"><label style="font-size:12px;flex-shrink:0;color:${dialogColors.text};text-shadow:0 0 2px rgba(0,0,0,0.8);user-select:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;cursor:default;">StretchY:</label><input type="number" id="addSpriteStretchY" min="-10" max="10" step="0.01" value="1" style="width:100%;background:${dialogColors.inputBg};color:${dialogColors.text};border:1px solid ${dialogColors.border};border-top:1px solid ${borderTopLeft};border-left:1px solid ${borderTopLeft};padding:4px;font-size:12px;font-family:${fontFamily};box-shadow:inset 0 1px 0 rgba(0,0,0,0.3);">`;
    effectsGroup.appendChild(effectsGrid);
    formLayout.appendChild(row1);
    formLayout.appendChild(row2);
    formLayout.appendChild(row3);
    formLayout.appendChild(row4);
    formLayout.appendChild(spriteSizeGroup);
    formLayout.appendChild(gridGroup);
    formLayout.appendChild(effectsGroup);
    leftPanel.appendChild(formLayout);
    const rightPanel = document.createElement("div");
    rightPanel.style.display = "flex";
    rightPanel.style.flexDirection = "column";
    rightPanel.style.flex = "1";
    rightPanel.style.padding = "4px";
    rightPanel.style.minWidth = "0";
    rightPanel.style.minHeight = "0";
    rightPanel.style.background = dialogColors.panel;
    rightPanel.style.color = dialogColors.text;
    rightPanel.className = "add-sprite-dialog-right";
    const previewHeader = document.createElement("div");
    previewHeader.style.display = "flex";
    previewHeader.style.justifyContent = "space-between";
    previewHeader.style.alignItems = "center";
    previewHeader.style.marginBottom = "4px";
    previewHeader.innerHTML = `<div style="font-weight:bold;font-size:12px;color:${dialogColors.text};text-shadow:0 0 2px rgba(0,0,0,0.8);">Preview:</div><div style="display:flex;gap:4px;align-items:center;"><button id="addSpriteCenter" style="background:${dialogColors.buttonBg};color:${dialogColors.buttonText};border:1px solid ${dialogColors.border};border-top:1px solid ${borderTopLeft};border-left:1px solid ${borderTopLeft};padding:4px 8px;cursor:pointer;font-size:12px;font-family:${fontFamily};box-shadow:inset 0 1px 0 rgba(0,0,0,0.3),0 1px 0 rgba(255,255,255,0.1);" title="Center View"><i class="fas fa-crosshairs"></i></button><button id="addSpriteZoomOut" style="background:${dialogColors.buttonBg};color:${dialogColors.buttonText};border:1px solid ${dialogColors.border};border-top:1px solid ${borderTopLeft};border-left:1px solid ${borderTopLeft};padding:4px 8px;cursor:pointer;font-size:12px;font-family:${fontFamily};box-shadow:inset 0 1px 0 rgba(0,0,0,0.3),0 1px 0 rgba(255,255,255,0.1);">-</button><span id="addSpriteZoomLevel" style="font-size:12px;min-width:40px;text-align:center;color:${dialogColors.text};text-shadow:0 0 2px rgba(0,0,0,0.8);">100%</span><button id="addSpriteZoomIn" style="background:${dialogColors.buttonBg};color:${dialogColors.buttonText};border:1px solid ${dialogColors.border};border-top:1px solid ${borderTopLeft};border-left:1px solid ${borderTopLeft};padding:4px 8px;cursor:pointer;font-size:12px;font-family:${fontFamily};box-shadow:inset 0 1px 0 rgba(0,0,0,0.3),0 1px 0 rgba(255,255,255,0.1);">+</button></div>`;
    rightPanel.appendChild(previewHeader);
    const previewCanvas = document.createElement("canvas");
    previewCanvas.id = "addSpritePreview";
    previewCanvas.style.flex = "1 1 auto";
    previewCanvas.style.minHeight = "0";
    previewCanvas.style.maxHeight = "none";
    previewCanvas.style.border = `1px solid ${dialogColors.border}`;
    previewCanvas.style.borderTop = `1px solid ${dialogColors.border === "#0a0a0a" ? "#404040" : dialogColors.border}`;
    previewCanvas.style.borderLeft = `1px solid ${dialogColors.border === "#0a0a0a" ? "#404040" : dialogColors.border}`;
    previewCanvas.style.background = dialogColors.inputBg;
    previewCanvas.style.cursor = "default";
    previewCanvas.style.userSelect = "none";
    previewCanvas.style.webkitUserSelect = "none";
    previewCanvas.style.mozUserSelect = "none";
    previewCanvas.style.msUserSelect = "none";
    previewCanvas.style.boxShadow = "inset 0 1px 0 rgba(0,0,0,0.3)";
    previewCanvas.className = "add-sprite-dialog-preview";
    previewCanvas.width = 300;
    previewCanvas.height = 400;
    const updatePreviewCanvasSize = () => {
        const rect = previewCanvas.getBoundingClientRect();
        const containerWidth = rect.width;
        const containerHeight = rect.height;
        if (containerWidth > 0 && containerHeight > 0) {
            previewCanvas.width = containerWidth;
            previewCanvas.height = containerHeight;
            updateAddSpritePreview();
        }
    };
    const resizeObserver = new ResizeObserver(() => {
        updatePreviewCanvasSize();
    });
    resizeObserver.observe(previewCanvas);
    setTimeout(() => updatePreviewCanvasSize(), 100);
    rightPanel.appendChild(previewCanvas);
    splitter.appendChild(leftPanel);
    splitter.appendChild(rightPanel);
    content.appendChild(splitter);
    const buttonBar = document.createElement("div");
    buttonBar.className = "add-sprite-dialog-button-bar";
    buttonBar.style.display = "flex";
    buttonBar.style.justifyContent = "flex-end";
    buttonBar.style.gap = "4px";
    buttonBar.style.padding = "4px 8px";
    buttonBar.innerHTML = `<button id="addSpriteAdd" style="background:${dialogColors.buttonBg};color:${dialogColors.buttonText};border:1px solid ${dialogColors.border};border-top:1px solid ${borderTopLeft};border-left:1px solid ${borderTopLeft};padding:5px 10px;cursor:pointer;font-size:12px;font-family:${fontFamily};box-shadow:inset 0 1px 0 rgba(0,0,0,0.3),0 1px 0 rgba(255,255,255,0.1);">${editSprite ? "Update" : "Add"}</button><button id="addSpriteCancel" style="background:${dialogColors.buttonBg};color:${dialogColors.buttonText};border:1px solid ${dialogColors.border};border-top:1px solid ${borderTopLeft};border-left:1px solid ${borderTopLeft};padding:5px 10px;cursor:pointer;font-size:12px;font-family:${fontFamily};box-shadow:inset 0 1px 0 rgba(0,0,0,0.3),0 1px 0 rgba(255,255,255,0.1);">Close</button>`;
    content.appendChild(buttonBar);
    dialog.appendChild(content);
    document.body.appendChild(dialog);
    const addButton = document.getElementById("addSpriteAdd");
    const cancelButton = document.getElementById("addSpriteCancel");
    const browseButton = document.getElementById("addSpriteBrowse");
    const centerButton = document.getElementById("addSpriteCenter");
    const zoomOutButton = document.getElementById("addSpriteZoomOut");
    const zoomInButton = document.getElementById("addSpriteZoomIn");
    const autoDetectButton = document.getElementById("addSpriteAutoDetect");
    const addHoverEffect = (btn) => {
        btn.onmouseover = () => {
            btn.style.background = dialogColors.buttonHover;
            btn.style.borderColor = dialogColors.border;
        };
        btn.onmouseout = () => {
            btn.style.background = dialogColors.buttonBg;
            btn.style.borderColor = dialogColors.border;
        };
        btn.onmousedown = () => {
            btn.style.background = dialogColors.inputBg;
            btn.style.borderColor = dialogColors.border;
            btn.style.boxShadow = "inset 0 1px 2px rgba(0,0,0,0.5)";
        };
        btn.onmouseup = () => {
            btn.style.background = dialogColors.buttonHover;
            btn.style.borderColor = dialogColors.border;
            btn.style.boxShadow = "inset 0 1px 0 rgba(0,0,0,0.3),0 1px 0 rgba(255,255,255,0.1)";
        };
    };
    if (addButton) addHoverEffect(addButton);
    if (cancelButton) addHoverEffect(cancelButton);
    if (browseButton) addHoverEffect(browseButton);
    if (centerButton) addHoverEffect(centerButton);
    if (zoomOutButton) addHoverEffect(zoomOutButton);
    if (zoomInButton) addHoverEffect(zoomInButton);
    if (autoDetectButton) addHoverEffect(autoDetectButton);
    setTimeout(() => {
        const numberInputs = dialog.querySelectorAll('input[type="number"]');
        numberInputs.forEach(input => {
            if (!input.parentElement.classList.contains('number-input-wrapper')) {
                const wrapper = document.createElement('div');
                wrapper.className = 'number-input-wrapper';
                const parent = input.parentElement;
                const parentDisplay = window.getComputedStyle(parent).display;
                const isGrid = parentDisplay === 'grid';
                const isFlex = parentDisplay === 'flex';
                const isAddSpriteIndex = input.id === 'addSpriteIndex';
                if (isGrid) {
                    wrapper.style.width = '100%';
                } else if (isFlex || isAddSpriteIndex) {
                    wrapper.style.flex = '1';
                    wrapper.style.minWidth = '0';
                } else if (input.style.width === '100%') {
                    wrapper.style.width = '100%';
                } else {
                    wrapper.style.width = '100%';
                }
                input.parentNode.insertBefore(wrapper, input);
                wrapper.appendChild(input);
                input.style.width = '100%';
                const spinnerContainer = document.createElement('div');
                spinnerContainer.className = 'number-spinner-container';
                const spinnerUp = document.createElement('div');
                spinnerUp.className = 'number-spinner number-spinner-up';
                spinnerUp.innerHTML = '<span style="display: inline-block; transform: scaleX(1.4);">▲</span>';
                spinnerUp.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (input.disabled) return;
                    const step = parseFloat(input.step) || 1;
                    const max = input.max !== '' ? parseFloat(input.max) : null;
                    let value = parseFloat(input.value) || 0;
                    value += step;
                    if (max !== null && value > max) value = max;
                    input.value = value;
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                };
                const spinnerDown = document.createElement('div');
                spinnerDown.className = 'number-spinner number-spinner-down';
                spinnerDown.innerHTML = '<span style="display: inline-block; transform: scaleX(1.4);">▼</span>';
                spinnerDown.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (input.disabled) return;
                    const step = parseFloat(input.step) || 1;
                    const min = input.min !== '' ? parseFloat(input.min) : null;
                    let value = parseFloat(input.value) || 0;
                    value -= step;
                    if (min !== null && value < min) value = min;
                    input.value = value;
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                };
                const updateSpinnerState = () => {
                    if (input.disabled) {
                        spinnerUp.style.pointerEvents = 'none';
                        spinnerUp.style.opacity = '0.5';
                        spinnerDown.style.pointerEvents = 'none';
                        spinnerDown.style.opacity = '0.5';
                    } else {
                        spinnerUp.style.pointerEvents = 'auto';
                        spinnerUp.style.opacity = '1';
                        spinnerDown.style.pointerEvents = 'auto';
                        spinnerDown.style.opacity = '1';
                    }
                };
                updateSpinnerState();
                const inputObserver = new MutationObserver(updateSpinnerState);
                inputObserver.observe(input, { attributes: true, attributeFilter: ['disabled'] });
                spinnerContainer.appendChild(spinnerUp);
                spinnerContainer.appendChild(spinnerDown);
                wrapper.appendChild(spinnerContainer);
                input.style.paddingRight = '72px';
            }
        });
    }, 0);
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*,.mng";
    fileInput.style.display = "none";
    document.body.appendChild(fileInput);
    let previewImg = null;
    if (preSelectImage) {
        const _psi = imageLibrary.get(preSelectImage.toLowerCase());
        if (_psi) {
            previewImg = _psi;
            const _psf = document.getElementById("addSpriteImageFile");
            if (_psf) { _psf.value = preSelectImage; document.getElementById("addSpriteSource").value = "CUSTOM"; }
            setTimeout(() => updateAddSpritePreview(), 0);
        }
    }
    document.getElementById("addSpriteBrowse").onclick = async () => {
        if (_isTauri) {
            const selected = await tauriOpenDialog({ multiple: false, filters: [{ name: 'Images', extensions: ['png', 'gif', 'jpg', 'jpeg', 'webp', 'bmp', 'mng'] }] });
            if (selected) {
                const name = selected.split(/[\\/]/).pop();
                document.getElementById("addSpriteImageFile").value = name;
                previewImg = await loadImageFromPath(selected, name);
                if (selectionBox.w === 0 || selectionBox.h === 0) { selectionBox.w = 32; selectionBox.h = 32; }
                updateAddSpritePreview();
            }
            return;
        }
        fileInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                document.getElementById("addSpriteImageFile").value = file.name;
                previewImg = await loadImage(file);
                if (selectionBox.w === 0 || selectionBox.h === 0) {
                    selectionBox.w = 32;
                    selectionBox.h = 32;
                }
                updateAddSpritePreview();
            }
        };
        fileInput.click();
    };
    document.getElementById("addSpriteSource").onchange = async () => {
        const sourceType = document.getElementById("addSpriteSource").value;
        if (sourceType === "CUSTOM") {
            document.getElementById("addSpriteImageFile").value = "";
            previewImg = null;
            updateAddSpritePreview();
            return;
        }
        let defaultName = currentAnimation ? currentAnimation.getDefaultImageName(sourceType) : "";
        if (!defaultName) {
            for (const otherAni of animations) {
                const otherDefault = otherAni.getDefaultImageName(sourceType);
                if (otherDefault && imageLibrary.has(otherDefault.toLowerCase())) {
                    defaultName = otherDefault;
                    break;
                }
            }
        }
        if (!defaultName) {
            const fallbackNames = {
                "SPRITES": "sprites.png",
                "HEAD": "head19.png",
                "BODY": "body.png",
                "SWORD": "sword1.png",
                "SHIELD": "shield1.png",
                "HORSE": "ride.png",
                "PICS": "pics1.png"
            };
            defaultName = fallbackNames[sourceType] || "";
        }
        if (defaultName) {
            document.getElementById("addSpriteImageFile").value = defaultName;
            const imgKey = defaultName.toLowerCase();
            if (imageLibrary.has(imgKey)) {
                previewImg = imageLibrary.get(imgKey);
                if (selectionBox.w === 0 || selectionBox.h === 0) {
                    selectionBox.w = 32;
                    selectionBox.h = 32;
                }
                updateAddSpritePreview();
            } else {
                try {
                    const img = await loadImageFromUrl(`images/${defaultName}`, imgKey);
                    previewImg = img;
                    if (selectionBox.w === 0 || selectionBox.h === 0) {
                        selectionBox.w = 32;
                        selectionBox.h = 32;
                    }
                    updateAddSpritePreview();
                } catch (e) {
                    previewImg = null;
                    updateAddSpritePreview();
                }
            }
        } else {
            document.getElementById("addSpriteImageFile").value = "";
            previewImg = null;
            updateAddSpritePreview();
        }
    };
    let previewZoom = 1.0;
    let previewPanX = 0;
    let previewPanY = 0;
    document.getElementById("addSpriteZoomLevel").textContent = "100%";
    let selectionBox = {x: 0, y: 0, w: 32, h: 32};
    let isSelecting = false;
    let isMoving = false;
    let isResizing = false;
    let resizeHandle = null;
    let dragStart = {x: 0, y: 0};
    let selectionStart = {x: 0, y: 0};
    let isPanning = false;
    let panStart = {x: 0, y: 0};
    let autoDetectActive = false;
    const handleSize = 8;
    function getImageToCanvas() {
        if (!previewImg) return {scale: 1, offsetX: 0, offsetY: 0};
        const rect = previewCanvas.getBoundingClientRect();
        const canvasWidth = previewCanvas.width || rect.width;
        const canvasHeight = previewCanvas.height || rect.height;
        const baseScale = Math.min(canvasWidth / previewImg.width, canvasHeight / previewImg.height, 1);
        const scale = baseScale * previewZoom;
        const offsetX = (canvasWidth - previewImg.width * scale) / 2 + previewPanX;
        const offsetY = (canvasHeight - previewImg.height * scale) / 2 + previewPanY;
        return {scale, offsetX, offsetY};
    }
    function canvasToImage(canvasX, canvasY) {
        const {scale, offsetX, offsetY} = getImageToCanvas();
        const x = (canvasX - offsetX) / scale;
        const y = (canvasY - offsetY) / scale;
        return {x, y};
    }
    function getResizeHandle(mouseX, mouseY) {
        if (!previewImg) return null;
        const {scale, offsetX, offsetY} = getImageToCanvas();
        const boxX = selectionBox.x * scale + offsetX;
        const boxY = selectionBox.y * scale + offsetY;
        const boxW = selectionBox.w * scale;
        const boxH = selectionBox.h * scale;
        const hitSize = 15;
        const handles = [
            {name: "nw", x: boxX, y: boxY},
            {name: "ne", x: boxX + boxW, y: boxY},
            {name: "sw", x: boxX, y: boxY + boxH},
            {name: "se", x: boxX + boxW, y: boxY + boxH},
            {name: "n", x: boxX + boxW / 2, y: boxY},
            {name: "s", x: boxX + boxW / 2, y: boxY + boxH},
            {name: "w", x: boxX, y: boxY + boxH / 2},
            {name: "e", x: boxX + boxW, y: boxY + boxH / 2}
        ];
        for (const handle of handles) {
            if (Math.abs(mouseX - handle.x) <= hitSize && Math.abs(mouseY - handle.y) <= hitSize) {
                return handle.name;
            }
        }
        if (mouseX >= boxX && mouseX <= boxX + boxW && mouseY >= boxY && mouseY <= boxY + boxH) {
            return "move";
        }
        return null;
    }
    function updateAddSpritePreview() {
        const ctx = previewCanvas.getContext("2d");
        ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        ctx.fillStyle = dialogColors.inputBg;
        ctx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
        if (previewImg) {
            const cols = parseInt(document.getElementById("addSpriteCols").value) || 1;
            const rows = parseInt(document.getElementById("addSpriteRows").value) || 1;
            const colSep = parseInt(document.getElementById("addSpriteColSep").value) || 0;
            const rowSep = parseInt(document.getElementById("addSpriteRowSep").value) || 0;
            const spriteW = Math.floor((previewImg.width - (cols - 1) * colSep) / cols);
            const spriteH = Math.floor((previewImg.height - (rows - 1) * rowSep) / rows);
            const {scale, offsetX, offsetY} = getImageToCanvas();
            ctx.save();
            ctx.translate(offsetX, offsetY);
            ctx.scale(scale, scale);
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(previewImg, 0, 0);
            const _pcs = getComputedStyle(document.documentElement);
            const previewGridColor = _pcs.getPropertyValue("--sprite-preview-grid").trim() || "#00ff00";
            const previewSelColor = _pcs.getPropertyValue("--sprite-preview-selection").trim() || "#ffff00";
            ctx.strokeStyle = previewGridColor;
            ctx.lineWidth = 1 / scale;
            for (let row = 0; row <= rows; row++) {
                const y = row * (spriteH + rowSep);
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(previewImg.width, y);
                ctx.stroke();
            }
            for (let col = 0; col <= cols; col++) {
                const x = col * (spriteW + colSep);
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, previewImg.height);
                ctx.stroke();
            }
            ctx.strokeStyle = previewSelColor;
            ctx.lineWidth = 2 / scale;
            ctx.strokeRect(selectionBox.x, selectionBox.y, selectionBox.w, selectionBox.h);
            ctx.globalAlpha = 0.1;
            ctx.fillStyle = previewSelColor;
            ctx.fillRect(selectionBox.x, selectionBox.y, selectionBox.w, selectionBox.h);
            ctx.globalAlpha = 1;
            ctx.restore();
            const boxX = selectionBox.x * scale + offsetX;
            const boxY = selectionBox.y * scale + offsetY;
            const boxW = selectionBox.w * scale;
            const boxH = selectionBox.h * scale;

            ctx.fillStyle = previewSelColor;
            const handles = [
                {x: boxX, y: boxY},
                {x: boxX + boxW, y: boxY},
                {x: boxX, y: boxY + boxH},
                {x: boxX + boxW, y: boxY + boxH},
                {x: boxX + boxW / 2, y: boxY},
                {x: boxX + boxW / 2, y: boxY + boxH},
                {x: boxX, y: boxY + boxH / 2},
                {x: boxX + boxW, y: boxY + boxH / 2}
            ];
            
            for (const handle of handles) {
                ctx.fillRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
            }
        }
    }
    previewCanvas.onmousedown = (e) => {
        if (!previewImg) return;
        const rect = previewCanvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) * (previewCanvas.width / rect.width);
        const mouseY = (e.clientY - rect.top) * (previewCanvas.height / rect.height);
        if (e.button === 1 || e.button === 2) {
            isPanning = true;
            panStart = {x: mouseX, y: mouseY};
            previewCanvas.style.cursor = "grabbing";
            e.preventDefault();
            return;
        }
        if (e.button !== 0) return;
        if (autoDetectActive) {
            
            const imgPos = canvasToImage(mouseX, mouseY);
            const startXInt = Math.round(imgPos.x);
            const startYInt = Math.round(imgPos.y);
            
            if (startXInt >= 0 && startXInt < previewImg.width && startYInt >= 0 && startYInt < previewImg.height) {
                const canvas = document.createElement("canvas");
                canvas.width = previewImg.width;
                canvas.height = previewImg.height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(previewImg, 0, 0);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                const imageWidth = canvas.width;
                const imageHeight = canvas.height;
                const imageSize = imageWidth * imageHeight;
                const marked = new Uint8Array(imageSize);
                let rect = {left: startXInt, top: startYInt, right: startXInt, bottom: startYInt};
                const stack = [];
                const addNode = (x, y) => {
                    const xInt = Math.floor(x);
                    const yInt = Math.floor(y);
                    if (xInt >= 0 && xInt < imageWidth && yInt >= 0 && yInt < imageHeight) {
                        const idx = yInt * imageWidth + xInt;
                        if (!marked[idx]) {
                            const pixelIdx = idx * 4;
                            const alpha = data[pixelIdx + 3];
                            if (alpha > 0) {
                                marked[idx] = 1;
                                stack.push({x: xInt, y: yInt});
                            }
                        }
                    }
                };
                addNode(startXInt, startYInt);
                
                if (stack.length > 0) {
                    while (stack.length > 0) {
                        while (stack.length > 0) {
                            const pos = stack.pop();
                            if (pos.x < rect.left) rect.left = pos.x;
                            if (pos.y < rect.top) rect.top = pos.y;
                            if (pos.x > rect.right) rect.right = pos.x;
                            if (pos.y > rect.bottom) rect.bottom = pos.y;
                            addNode(pos.x, pos.y - 1);
                            addNode(pos.x - 1, pos.y);
                            addNode(pos.x, pos.y + 1);
                            addNode(pos.x + 1, pos.y);
                        }
                        for (let y = rect.top - 1; y <= rect.bottom; y++) {
                            addNode(rect.left - 1, y);
                            addNode(rect.right + 1, y);
                        }
                        for (let x = rect.left - 1; x <= rect.right; x++) {
                            addNode(x, rect.top - 1);
                            addNode(x, rect.bottom + 1);
                        }
                    }
                    
                    selectionBox.x = rect.left;
                    selectionBox.y = rect.top;
                    selectionBox.w = rect.right - rect.left + 1;
                    selectionBox.h = rect.bottom - rect.top + 1;
                    document.getElementById("addSpriteLeft").value = selectionBox.x;
                    document.getElementById("addSpriteTop").value = selectionBox.y;
                    document.getElementById("addSpriteWidth").value = selectionBox.w;
                    document.getElementById("addSpriteHeight").value = selectionBox.h;
                    document.getElementById("addSpriteCols").value = 1;
                    document.getElementById("addSpriteRows").value = 1;
                    updateAddSpritePreview();
                }
            }
            return;
        }
        const handle = getResizeHandle(mouseX, mouseY);
        if (handle === "move") {
            isMoving = true;
            dragStart = {x: mouseX, y: mouseY};
            selectionStart = {x: selectionBox.x, y: selectionBox.y};
            previewCanvas.style.cursor = "move";
        } else if (handle) {
            isResizing = true;
            resizeHandle = handle;
            dragStart = {x: mouseX, y: mouseY};
            selectionStart = {x: selectionBox.x, y: selectionBox.y, w: selectionBox.w, h: selectionBox.h};
            if (handle === "nw" || handle === "se") {
                previewCanvas.style.cursor = "nwse-resize";
            } else if (handle === "ne" || handle === "sw") {
                previewCanvas.style.cursor = "nesw-resize";
            } else if (handle === "n" || handle === "s") {
                previewCanvas.style.cursor = "ns-resize";
            } else if (handle === "w" || handle === "e") {
                previewCanvas.style.cursor = "ew-resize";
            } else {
                previewCanvas.style.cursor = "default";
            }
        }
        updateAddSpritePreview();
    };
    previewCanvas.onmousemove = (e) => {
        if (!previewImg) return;
        const rect = previewCanvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) * (previewCanvas.width / rect.width);
        const mouseY = (e.clientY - rect.top) * (previewCanvas.height / rect.height);
        if (isPanning) {
            previewPanX += mouseX - panStart.x;
            previewPanY += mouseY - panStart.y;
            panStart = {x: mouseX, y: mouseY};
            updateAddSpritePreview();
            return;
        }
        if (!isSelecting && !isMoving && !isResizing && !isPanning) {
            if (previewCanvas._preventCursorChangeUntil && Date.now() < previewCanvas._preventCursorChangeUntil) {
                return;
            }

            if (autoDetectActive) {
                previewCanvas.style.cursor = "crosshair";
            } else {
                const handle = getResizeHandle(mouseX, mouseY);
                if (handle === "move") {
                    previewCanvas.style.cursor = "move";
                } else if (handle === "nw" || handle === "se") {
                    previewCanvas.style.cursor = "nwse-resize";
                } else if (handle === "ne" || handle === "sw") {
                    previewCanvas.style.cursor = "nesw-resize";
                } else if (handle === "n" || handle === "s") {
                    previewCanvas.style.cursor = "ns-resize";
                } else if (handle === "w" || handle === "e") {
                    previewCanvas.style.cursor = "ew-resize";
                } else {
                    previewCanvas.style.cursor = "default";
                }
            }
        }
        if (isMoving && selectionStart) {
            const {scale} = getImageToCanvas();
            const dx = (mouseX - dragStart.x) / scale;
            const dy = (mouseY - dragStart.y) / scale;
            selectionBox.x = Math.max(0, Math.min(previewImg.width - selectionBox.w, Math.round(selectionStart.x + dx)));
            selectionBox.y = Math.max(0, Math.min(previewImg.height - selectionBox.h, Math.round(selectionStart.y + dy)));
            updateAddSpritePreview();
        } else if (isResizing && resizeHandle && selectionStart) {
            const imgPos = canvasToImage(mouseX, mouseY);
            let newX = selectionStart.x, newY = selectionStart.y, newW = selectionStart.w, newH = selectionStart.h;
            if (resizeHandle.includes("e")) {
                newW = Math.max(1, Math.round(imgPos.x - newX));
            }
            if (resizeHandle.includes("w")) {
                const newRight = newX + newW;
                newX = Math.max(0, Math.round(imgPos.x));
                newW = Math.max(1, newRight - newX);
            }
            if (resizeHandle.includes("s")) {
                newH = Math.max(1, Math.round(imgPos.y - newY));
            }
            if (resizeHandle.includes("n")) {
                const newBottom = newY + newH;
                newY = Math.max(0, Math.round(imgPos.y));
                newH = Math.max(1, newBottom - newY);
            }
            if (newX + newW > previewImg.width) newW = previewImg.width - newX;
            if (newY + newH > previewImg.height) newH = previewImg.height - newY;
            if (newX < 0) {
                newW += newX;
                newX = 0;
            }
            if (newY < 0) {
                newH += newY;
                newY = 0;
            }
            selectionBox.x = newX;
            selectionBox.y = newY;
            selectionBox.w = Math.max(1, newW);
            selectionBox.h = Math.max(1, newH);
            document.getElementById("addSpriteLeft").value = selectionBox.x;
            document.getElementById("addSpriteTop").value = selectionBox.y;
            document.getElementById("addSpriteWidth").value = selectionBox.w;
            document.getElementById("addSpriteHeight").value = selectionBox.h;
            updateAddSpritePreview();
        }
    };
    previewCanvas.onmouseup = (e) => {
        if (e.button === 1 || e.button === 2) {
            isPanning = false;
            previewCanvas.style.cursor = "default";
            e.preventDefault();
            return;
        }
        if (isMoving || isResizing) {
            document.getElementById("addSpriteLeft").value = selectionBox.x;
            document.getElementById("addSpriteTop").value = selectionBox.y;
            document.getElementById("addSpriteWidth").value = selectionBox.w;
            document.getElementById("addSpriteHeight").value = selectionBox.h;
        }
        isSelecting = false;
        isMoving = false;
        isResizing = false;
        resizeHandle = null;
        previewCanvas.style.cursor = "default";
        previewCanvas._preventCursorChangeUntil = Date.now() + 100;
    };
    previewCanvas.onmouseleave = () => {
        isSelecting = false;
        isMoving = false;
        isResizing = false;
        isPanning = false;
        resizeHandle = null;
        previewCanvas.style.cursor = "default";
    };
    previewCanvas.oncontextmenu = (e) => {
        e.preventDefault();
    };
    document.getElementById("addSpriteCenter").onclick = () => {
        previewZoom = 1.0;
        previewPanX = 0;
        previewPanY = 0;
        document.getElementById("addSpriteZoomLevel").textContent = "100%";
        updateAddSpritePreview();
    };
    document.getElementById("addSpriteZoomIn").onclick = () => {
        previewZoom = Math.min(8, previewZoom * 1.5);
        document.getElementById("addSpriteZoomLevel").textContent = Math.round(previewZoom * 100) + "%";
        updateAddSpritePreview();
    };
    document.getElementById("addSpriteZoomOut").onclick = () => {
        previewZoom = Math.max(0.25, previewZoom / 1.5);
        document.getElementById("addSpriteZoomLevel").textContent = Math.round(previewZoom * 100) + "%";
        updateAddSpritePreview();
    };
    previewCanvas.onwheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        previewZoom = Math.max(0.25, Math.min(8, previewZoom * delta));
        document.getElementById("addSpriteZoomLevel").textContent = Math.round(previewZoom * 100) + "%";
        updateAddSpritePreview();
    };
    let previewInitialPinchDistance = null;
    let previewInitialZoom = null;
    let previewInitialPanX = null;
    let previewInitialPanY = null;

    previewCanvas.addEventListener("touchstart", (e) => {
        if (e.touches.length === 2) {
            e.preventDefault();
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            previewInitialPinchDistance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
            previewInitialZoom = previewZoom;
            previewInitialPanX = previewPanX;
            previewInitialPanY = previewPanY;
        }
    }, { passive: false });

    previewCanvas.addEventListener("touchmove", (e) => {
        if (e.touches.length === 2 && previewInitialPinchDistance !== null) {
            e.preventDefault();
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const currentDistance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
            const zoomRatio = currentDistance / previewInitialPinchDistance;
            previewZoom = Math.max(0.25, Math.min(8, previewInitialZoom * zoomRatio));
            document.getElementById("addSpriteZoomLevel").textContent = Math.round(previewZoom * 100) + "%";
            const rect = previewCanvas.getBoundingClientRect();
            const centerX = (touch1.clientX + touch2.clientX) / 2 - rect.left;
            const centerY = (touch1.clientY + touch2.clientY) / 2 - rect.top;

            const canvasCenterX = previewCanvas.width / 2;
            const canvasCenterY = previewCanvas.height / 2;
            const canvasX = centerX * (previewCanvas.width / rect.width);
            const canvasY = centerY * (previewCanvas.height / rect.height);
            if (previewImg) {
                const baseScale = Math.min(previewCanvas.width / previewImg.width, previewCanvas.height / previewImg.height, 1);
                const scale = baseScale * previewInitialZoom;
                const worldX = (canvasX - (previewCanvas.width - previewImg.width * scale) / 2 - previewInitialPanX) / scale;
                const worldY = (canvasY - (previewCanvas.height - previewImg.height * scale) / 2 - previewInitialPanY) / scale;
                const newScale = baseScale * previewZoom;
                previewPanX = canvasX - (previewCanvas.width - previewImg.width * newScale) / 2 - worldX * newScale;
                previewPanY = canvasY - (previewCanvas.height - previewImg.height * newScale) / 2 - worldY * newScale;
            }

            updateAddSpritePreview();
        }
    }, { passive: false });

    previewCanvas.addEventListener("touchend", (e) => {
        if (e.touches.length < 2) {
            previewInitialPinchDistance = null;
            previewInitialZoom = null;
            previewInitialPanX = null;
            previewInitialPanY = null;
        }
    }, { passive: false });

    const addWheelHandler = (id, onChange, step = 1, min = null, max = null) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener("wheel", (e) => {
            if (document.activeElement === el && !el.disabled) {
                e.preventDefault();
                const current = parseInt(el.value) || 0;
                const delta = e.deltaY > 0 ? -step : step;
                let newVal = current + delta;
                if (min !== null) newVal = Math.max(min, newVal);
                if (max !== null) newVal = Math.min(max, newVal);
                el.value = newVal;
                onChange();
            }
        }, { passive: false });
    };
    document.getElementById("addSpriteCols").onchange = updateAddSpritePreview;
    addWheelHandler("addSpriteCols", updateAddSpritePreview, 1, 1);
    document.getElementById("addSpriteRows").onchange = updateAddSpritePreview;
    addWheelHandler("addSpriteRows", updateAddSpritePreview, 1, 1);
    document.getElementById("addSpriteColSep").onchange = updateAddSpritePreview;
    addWheelHandler("addSpriteColSep", updateAddSpritePreview);
    document.getElementById("addSpriteRowSep").onchange = updateAddSpritePreview;
    addWheelHandler("addSpriteRowSep", updateAddSpritePreview);
    document.getElementById("addSpriteLeft").onchange = () => {
        selectionBox.x = parseInt(document.getElementById("addSpriteLeft").value) || 0;
        updateAddSpritePreview();
    };
    addWheelHandler("addSpriteLeft", () => {
        selectionBox.x = parseInt(document.getElementById("addSpriteLeft").value) || 0;
        updateAddSpritePreview();
    });
    document.getElementById("addSpriteTop").onchange = () => {
        selectionBox.y = parseInt(document.getElementById("addSpriteTop").value) || 0;
        updateAddSpritePreview();
    };
    addWheelHandler("addSpriteTop", () => {
        selectionBox.y = parseInt(document.getElementById("addSpriteTop").value) || 0;
        updateAddSpritePreview();
    });
    document.getElementById("addSpriteWidth").onchange = () => {
        selectionBox.w = parseInt(document.getElementById("addSpriteWidth").value) || 32;
        updateAddSpritePreview();
    };
    addWheelHandler("addSpriteWidth", () => {
        selectionBox.w = parseInt(document.getElementById("addSpriteWidth").value) || 32;
        updateAddSpritePreview();
    }, 1, 1);
    document.getElementById("addSpriteHeight").onchange = () => {
        selectionBox.h = parseInt(document.getElementById("addSpriteHeight").value) || 32;
        updateAddSpritePreview();
    };
    addWheelHandler("addSpriteHeight", () => {
        selectionBox.h = parseInt(document.getElementById("addSpriteHeight").value) || 32;
        updateAddSpritePreview();
    }, 1, 1);
    addWheelHandler("addSpriteIndex", () => {}, 1, 0);
    const syncAddSpriteColorSwatch = () => {
        const colorSwatch = document.getElementById("addSpriteColorSwatch");
        const colorR = document.getElementById("addSpriteColorR");
        const colorG = document.getElementById("addSpriteColorG");
        const colorB = document.getElementById("addSpriteColorB");
        if (!colorSwatch || !colorR || !colorG || !colorB) return;
        const r = Math.max(0, Math.min(255, parseInt(colorR.value) || 255));
        const g = Math.max(0, Math.min(255, parseInt(colorG.value) || 255));
        const b = Math.max(0, Math.min(255, parseInt(colorB.value) || 255));
        const hex = `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
        colorSwatch.value = hex;
    };
    const syncAddSpriteColorRGB = () => {
        const colorSwatch = document.getElementById("addSpriteColorSwatch");
        const colorR = document.getElementById("addSpriteColorR");
        const colorG = document.getElementById("addSpriteColorG");
        const colorB = document.getElementById("addSpriteColorB");
        if (!colorSwatch || !colorR || !colorG || !colorB) return;
        const hex = colorSwatch.value;
        const r = parseInt(hex.substr(1, 2), 16);
        const g = parseInt(hex.substr(3, 2), 16);
        const b = parseInt(hex.substr(5, 2), 16);
        colorR.value = r;
        colorG.value = g;
        colorB.value = b;
    };
    const addSpriteColorSwatch = document.getElementById("addSpriteColorSwatch");
    const addSpriteColorR = document.getElementById("addSpriteColorR");
    const addSpriteColorG = document.getElementById("addSpriteColorG");
    const addSpriteColorB = document.getElementById("addSpriteColorB");
    if (addSpriteColorSwatch) addSpriteColorSwatch.onchange = syncAddSpriteColorRGB;
    if (addSpriteColorR) addSpriteColorR.onchange = syncAddSpriteColorSwatch;
    if (addSpriteColorG) addSpriteColorG.onchange = syncAddSpriteColorSwatch;
    if (addSpriteColorB) addSpriteColorB.onchange = syncAddSpriteColorSwatch;
    const addSpriteColorEnabledCheckbox = document.getElementById("addSpriteColorEnabledCheckbox");
    if (addSpriteColorEnabledCheckbox) {
        addSpriteColorEnabledCheckbox.onclick = () => {
            const newValue = addSpriteColorEnabledCheckbox.textContent.trim() !== "✓";
            addSpriteColorEnabledCheckbox.textContent = newValue ? "✓" : " ";
        };
    }
    document.getElementById("addSpriteAutoDetect").onclick = () => {
        autoDetectActive = !autoDetectActive;
        const btn = document.getElementById("addSpriteAutoDetect");
        if (autoDetectActive) {
            btn.style.background = "#4a9eff";
            btn.style.borderColor = "#6bb0ff";
            previewCanvas.style.cursor = "crosshair";
        } else {
            btn.style.background = "#2b2b2b";
            btn.style.borderColor = "#0a0a0a";
            previewCanvas.style.cursor = "default";
        }
    };
    document.getElementById("addSpriteCancel").onclick = () => {
        document.body.removeChild(dialog);
        document.body.removeChild(fileInput);
    };
    document.getElementById("addSpriteAdd").onclick = () => {
        if (editSprite) {
            const oldState = serializeAnimationState();
            editSprite.type = document.getElementById("addSpriteSource").value;
            if (editSprite.type === "CUSTOM" && fileInput.files[0]) {
                editSprite.customImageName = fileInput.files[0].name;
            }
            editSprite.comment = document.getElementById("addSpriteComment").value;
            editSprite.left = parseInt(document.getElementById("addSpriteLeft").value) || 0;
            editSprite.top = parseInt(document.getElementById("addSpriteTop").value) || 0;
            editSprite.width = parseInt(document.getElementById("addSpriteWidth").value) || 32;
            editSprite.height = parseInt(document.getElementById("addSpriteHeight").value) || 32;
            const colorEnabledCheckbox = document.getElementById("addSpriteColorEnabledCheckbox");
            const colorEnabled = colorEnabledCheckbox ? colorEnabledCheckbox.textContent.trim() === "✓" : false;
            const colorR = parseInt(document.getElementById("addSpriteColorR").value) || 255;
            const colorG = parseInt(document.getElementById("addSpriteColorG").value) || 255;
            const colorB = parseInt(document.getElementById("addSpriteColorB").value) || 255;
            const colorA = parseInt(document.getElementById("addSpriteColorA").value) || 255;
            editSprite.colorEffectEnabled = colorEnabled;
            editSprite.colorEffect = {r: colorR, g: colorG, b: colorB, a: colorA};
            editSprite.rotation = parseFloat(document.getElementById("addSpriteRotate").value) || 0;
            const modeValue = document.getElementById("addSpriteMode").value;
            editSprite.mode = modeValue === "" ? undefined : parseInt(modeValue);
            const stretchX = parseFloat(document.getElementById("addSpriteStretchX").value) || 1;
            const stretchY = parseFloat(document.getElementById("addSpriteStretchY").value) || 1;
            if (stretchX !== 1 || stretchY !== 1) {
                editSprite.xscale = stretchX;
                editSprite.yscale = stretchY;
            } else {
                const zoom = parseFloat(document.getElementById("addSpriteZoom").value) || 1;
                editSprite.xscale = zoom;
                editSprite.yscale = zoom;
            }
            editSprite.updateBoundingBox();
            const newState = serializeAnimationState();
            addUndoCommand({
                description: "Update Sprite",
                oldState: oldState,
                newState: newState,
                undo: () => restoreAnimationState(oldState),
                redo: () => restoreAnimationState(newState)
            });
            if (previewImg && fileInput.files[0]) {
                loadImage(fileInput.files[0]).then(() => {
                    updateSpritesList();
                    redraw();
                });
            }
            updateSpritesList();
            redraw();
            saveSession();
            document.body.removeChild(dialog);
            document.body.removeChild(fileInput);
            return;
        }
        const spriteIndex = parseInt(document.getElementById("addSpriteIndex").value) || currentAnimation.nextSpriteIndex++;
        const cols = parseInt(document.getElementById("addSpriteCols").value) || 1;
        const rows = parseInt(document.getElementById("addSpriteRows").value) || 1;
        const colSep = parseInt(document.getElementById("addSpriteColSep").value) || 0;
        const rowSep = parseInt(document.getElementById("addSpriteRowSep").value) || 0;
        const left = parseInt(document.getElementById("addSpriteLeft").value) || 0;
        const top = parseInt(document.getElementById("addSpriteTop").value) || 0;
        const width = parseInt(document.getElementById("addSpriteWidth").value) || 32;
        const height = parseInt(document.getElementById("addSpriteHeight").value) || 32;
        const spriteW = previewImg ? Math.floor((selectionBox.w - (cols - 1) * colSep) / cols) : width;
        const spriteH = previewImg ? Math.floor((selectionBox.h - (rows - 1) * rowSep) / rows) : height;
        const totalSprites = rows * cols;
        const conflicts = currentAnimation.getSpriteConflicts(spriteIndex, totalSprites);
        if (conflicts.length > 0) {
            const conflictList = conflicts.map(c => `• Index ${c.index}: ${c.comment}`).join('\n');
            showConfirmDialog(`${conflicts.length} sprite${conflicts.length > 1 ? 's' : ''} with these indices already exist${conflicts.length > 1 ? '' : 's'}:\n\n${conflictList}\n\nDo you want to overwrite ${conflicts.length > 1 ? 'them' : 'it'}?`, (confirmed) => {
                if (!confirmed) return;
                addSpritesAfterConfirmation();
            });
            return;
        }
        addSpritesAfterConfirmation();
        function addSpritesAfterConfirmation() {
            const oldState = serializeAnimationState();
            let index = spriteIndex;
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const sprite = new AniSprite();
                    sprite.index = index++;
                    sprite.type = document.getElementById("addSpriteSource").value;
                    if (sprite.type === "CUSTOM") {
                        sprite.customImageName = fileInput.files[0] ? fileInput.files[0].name : document.getElementById("addSpriteImageFile").value;
                    }
                    sprite.comment = document.getElementById("addSpriteComment").value + (rows * cols > 1 ? ` (${row * cols + col})` : "");
                    sprite.left = selectionBox.x + col * (spriteW + colSep);
                    sprite.top = selectionBox.y + row * (spriteH + rowSep);
                    sprite.width = spriteW;
                    sprite.height = spriteH;
                    const colorEnabledCheckbox = document.getElementById("addSpriteColorEnabledCheckbox");
            const colorEnabled = colorEnabledCheckbox ? colorEnabledCheckbox.textContent.trim() === "✓" : false;
                    const colorR = parseInt(document.getElementById("addSpriteColorR").value) || 255;
                    const colorG = parseInt(document.getElementById("addSpriteColorG").value) || 255;
                    const colorB = parseInt(document.getElementById("addSpriteColorB").value) || 255;
                    const colorA = parseInt(document.getElementById("addSpriteColorA").value) || 255;
                    sprite.colorEffectEnabled = colorEnabled;
                    sprite.colorEffect = {r: colorR, g: colorG, b: colorB, a: colorA};
                    sprite.rotation = parseFloat(document.getElementById("addSpriteRotate").value) || 0;
                    const modeValue = document.getElementById("addSpriteMode").value;
                    sprite.mode = modeValue === "" ? undefined : parseInt(modeValue);
                    const stretchX = parseFloat(document.getElementById("addSpriteStretchX").value) || 1;
                    const stretchY = parseFloat(document.getElementById("addSpriteStretchY").value) || 1;
                    if (stretchX !== 1 || stretchY !== 1) {
                        sprite.xscale = stretchX;
                        sprite.yscale = stretchY;
                    } else {
                        const zoom = parseFloat(document.getElementById("addSpriteZoom").value) || 1;
                        sprite.xscale = zoom;
                        sprite.yscale = zoom;
                    }
                    sprite.updateBoundingBox();
                    currentAnimation.addSprite(sprite);
                }
            }
            const newState = serializeAnimationState();
            const totalSprites = rows * cols;
            addUndoCommand({
                description: `Add ${totalSprites} Sprite${totalSprites > 1 ? 's' : ''}`,
                oldState: oldState,
                newState: newState,
                undo: () => restoreAnimationState(oldState),
                redo: () => restoreAnimationState(newState)
            });
            if (previewImg && fileInput.files[0]) {
            loadImage(fileInput.files[0]).then(() => {
                updateSpritesList();
                redraw();
            });
        }
            updateSpritesList();
            redraw();
            saveSession();
            document.getElementById("addSpriteIndex").value = spriteIndex + totalSprites;
        }
    };
    if (editSprite) {
        document.getElementById("addSpriteSource").value = editSprite.type;
        document.getElementById("addSpriteImageFile").value = editSprite.customImageName || "";
        document.getElementById("addSpriteComment").value = editSprite.comment;
        document.getElementById("addSpriteIndex").value = editSprite.index;
        document.getElementById("addSpriteLeft").value = editSprite.left;
        document.getElementById("addSpriteTop").value = editSprite.top;
        document.getElementById("addSpriteWidth").value = editSprite.width;
        document.getElementById("addSpriteHeight").value = editSprite.height;
        const addSpriteColorEnabledCheckbox = document.getElementById("addSpriteColorEnabledCheckbox");
        if (addSpriteColorEnabledCheckbox) addSpriteColorEnabledCheckbox.textContent = editSprite.colorEffectEnabled ? "✓" : " ";
        const r = editSprite.colorEffect ? editSprite.colorEffect.r : 255;
        const g = editSprite.colorEffect ? editSprite.colorEffect.g : 255;
        const b = editSprite.colorEffect ? editSprite.colorEffect.b : 255;
        document.getElementById("addSpriteColorR").value = r;
        document.getElementById("addSpriteColorG").value = g;
        document.getElementById("addSpriteColorB").value = b;
        document.getElementById("addSpriteColorA").value = editSprite.colorEffect ? editSprite.colorEffect.a : 255;
        const addSpriteColorSwatch = document.getElementById("addSpriteColorSwatch");
        if (addSpriteColorSwatch) {
            const hex = `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
            addSpriteColorSwatch.value = hex;
        }
        document.getElementById("addSpriteRotate").value = editSprite.rotation || 0;
        const addSpriteModeEl = document.getElementById("addSpriteMode");
        if (addSpriteModeEl) {
            addSpriteModeEl.value = editSprite.mode !== undefined && editSprite.mode !== null ? editSprite.mode.toString() : "";
        }
        if (editSprite.xscale === editSprite.yscale) {
            document.getElementById("addSpriteZoom").value = editSprite.xscale || 1;
            document.getElementById("addSpriteStretchX").value = 1;
            document.getElementById("addSpriteStretchY").value = 1;
        } else {
            document.getElementById("addSpriteZoom").value = 1;
            document.getElementById("addSpriteStretchX").value = editSprite.xscale || 1;
            document.getElementById("addSpriteStretchY").value = editSprite.yscale || 1;
        }
        selectionBox.x = editSprite.left;
        selectionBox.y = editSprite.top;
        selectionBox.w = editSprite.width;
        selectionBox.h = editSprite.height;
        if (editSprite.type === "CUSTOM" && editSprite.customImageName) {
            const img = imageLibrary.get(editSprite.customImageName.toLowerCase());
            if (img) {
                previewImg = img;
                setTimeout(() => updateAddSpritePreview(), 10);
            }
        } else if (editSprite.type !== "CUSTOM") {
            const sourceChangeEvent = new Event("change");
            document.getElementById("addSpriteSource").dispatchEvent(sourceChangeEvent);
            setTimeout(() => updateAddSpritePreview(), 50);
        }
    } else {
        const left = parseInt(document.getElementById("addSpriteLeft").value) || 0;
        const top = parseInt(document.getElementById("addSpriteTop").value) || 0;
        const width = parseInt(document.getElementById("addSpriteWidth").value) || 32;
        const height = parseInt(document.getElementById("addSpriteHeight").value) || 32;
        selectionBox.x = left;
        selectionBox.y = top;
        selectionBox.w = width;
        selectionBox.h = height;
        const addSpriteModeEl = document.getElementById("addSpriteMode");
        if (addSpriteModeEl) {
            addSpriteModeEl.value = "";
        }
    }
    if (fileInput.files[0]) updateAddSpritePreview();
}



function showAlertDialog(message, callback) {
    const dialog = document.createElement("div");
    dialog.className = "dialog-overlay";
    dialog.style.display = "flex";
    dialog.style.justifyContent = "center";
    dialog.style.alignItems = "center";
    dialog.style.position = "fixed";
    dialog.style.top = "0";
    dialog.style.left = "0";
    dialog.style.width = "100%";
    dialog.style.height = "100%";
    dialog.style.background = "rgba(0, 0, 0, 0.7)";
    dialog.style.zIndex = "10000";
    const content = document.createElement("div");
    content.style.background = "#2b2b2b";
    content.style.border = "2px solid #555";
    content.style.padding = "0 20px 20px";
    content.style.borderRadius = "4px";
    content.style.width = "400px";
    content.style.maxWidth = "90vw";
    content.innerHTML = `
        <div class="dialog-titlebar" style="margin:0 -20px 16px;padding:8px 14px;display:flex;align-items:center;gap:8px;"><i class="fas fa-info-circle" style="flex-shrink:0;"></i><span style="font-size:13px;color:#c0c0c0;user-select:none;">Alert</span></div>
        <div style="margin-bottom: 20px; color: #e0e0e0; font-size: 14px; white-space: pre-wrap;">${message}</div>
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button id="alertOk" style="background: #4472C4; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px;">OK</button>
        </div>
    `;
    dialog.appendChild(content);
    document.body.appendChild(dialog);
    document.getElementById("alertOk").onclick = () => {
        document.body.removeChild(dialog);
        if (callback) callback();
    };
    dialog.onclick = (e) => {
        if (e.target === dialog) {
            document.body.removeChild(dialog);
            if (callback) callback();
        }
    };
}

function showPromptDialog(message, defaultValue, callback) {
    const dialog = document.createElement("div");
    dialog.className = "dialog-overlay";
    dialog.style.display = "flex";
    dialog.style.justifyContent = "center";
    dialog.style.alignItems = "center";
    dialog.style.position = "fixed";
    dialog.style.top = "0";
    dialog.style.left = "0";
    dialog.style.width = "100%";
    dialog.style.height = "100%";
    dialog.style.background = "rgba(0, 0, 0, 0.7)";
    dialog.style.zIndex = "10000";
    const content = document.createElement("div");
    content.style.background = "#2b2b2b";
    content.style.border = "2px solid #555";
    content.style.padding = "20px";
    content.style.borderRadius = "4px";
    content.style.width = "400px";
    content.style.maxWidth = "90vw";
    const input = document.createElement("input");
    input.type = "text";
    input.value = defaultValue || "";
    input.style.width = "100%";
    input.style.padding = "8px";
    input.style.marginTop = "10px";
    input.style.marginBottom = "20px";
    input.style.background = "#555";
    input.style.color = "#e0e0e0";
    input.style.border = "1px solid #777";
    input.style.borderRadius = "4px";
    input.style.fontSize = "14px";
    input.style.boxSizing = "border-box";
    content.innerHTML = `
        <div style="margin-bottom: 10px; color: #e0e0e0; font-size: 14px; white-space: pre-wrap;">${message}</div>
    `;
    content.appendChild(input);
    const buttonDiv = document.createElement("div");
    buttonDiv.style.display = "flex";
    buttonDiv.style.gap = "10px";
    buttonDiv.style.justifyContent = "flex-end";
    buttonDiv.innerHTML = `
        <button id="promptOk" style="background: #4472C4; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px;">OK</button>
        <button id="promptCancel" style="background: #555; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px;">Cancel</button>
    `;
    content.appendChild(buttonDiv);
    dialog.appendChild(content);
    document.body.appendChild(dialog);
    input.focus();
    input.select();
    const handleOk = () => {
        const value = input.value;
        document.body.removeChild(dialog);
        if (callback) callback(value);
    };
    const handleCancel = () => {
        document.body.removeChild(dialog);
        if (callback) callback(null);
    };
    document.getElementById("promptOk").onclick = handleOk;
    document.getElementById("promptCancel").onclick = handleCancel;
    input.onkeydown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleOk();
        } else if (e.key === "Escape") {
            e.preventDefault();
            handleCancel();
        }
    };
    dialog.onclick = (e) => {
        if (e.target === dialog) {
            handleCancel();
        }
    };
}

function showColorPickerDialog(currentColor, callback) {
    const dialog = document.createElement("div");
    dialog.className = "dialog-overlay";
    dialog.style.display = "flex";
    dialog.style.justifyContent = "center";
    dialog.style.alignItems = "center";
    dialog.style.position = "fixed";
    dialog.style.top = "0";
    dialog.style.left = "0";
    dialog.style.width = "100%";
    dialog.style.height = "100%";
    dialog.style.background = "rgba(0, 0, 0, 0.7)";
    dialog.style.zIndex = "10000";
    const content = document.createElement("div");
    content.style.background = "#2b2b2b";
    content.style.border = "2px solid #555";
    content.style.padding = "20px";
    content.style.borderRadius = "4px";
    content.style.width = "500px";
    content.style.maxHeight = "80vh";
    content.style.overflow = "auto";
    let h = 0, s = 0, v = 255;
    let r = currentColor.r || 255, g = currentColor.g || 255, b = currentColor.b || 255, a = currentColor.a || 255;
    function rgbToHsv(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        const d = max - min;
        let h = 0;
        if (d !== 0) {
            if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
            else if (max === g) h = ((b - r) / d + 2) / 6;
            else h = ((r - g) / d + 4) / 6;
        }
        return {h: h * 360, s: max === 0 ? 0 : d / max, v: max};
    }
    function hsvToRgb(h, s, v) {
        const c = v * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = v - c;
        let r = 0, g = 0, b = 0;
        if (h < 60) { r = c; g = x; b = 0; }
        else if (h < 120) { r = x; g = c; b = 0; }
        else if (h < 180) { r = 0; g = c; b = x; }
        else if (h < 240) { r = 0; g = x; b = c; }
        else if (h < 300) { r = x; g = 0; b = c; }
        else { r = c; g = 0; b = x; }
        return {r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255)};
    }
    const hsv = rgbToHsv(r, g, b);
    h = hsv.h; s = hsv.s * 100; v = hsv.v * 255;
    content.innerHTML = `
        <h3 style="margin-top:0;">Select Color</h3>
        <div style="display:flex;gap:10px;margin:10px 0;">
            <div style="flex:1;">
                <canvas id="colorGradient" width="200" height="200" style="width:100%;height:200px;border:1px solid #555;cursor:crosshair;"></canvas>
            </div>
            <div style="width:30px;">
                <canvas id="colorValueSlider" width="30" height="200" style="width:100%;height:200px;border:1px solid #555;cursor:ns-resize;"></canvas>
            </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0;">
            <div>
                <label>Hue:</label>
                <input type="number" id="colorH" value="${Math.round(h)}" min="0" max="360" style="width:100%;background:#555;color:#eee;border:1px solid #777;padding:4px;">
            </div>
            <div>
                <label>Sat:</label>
                <input type="number" id="colorS" value="${Math.round(s)}" min="0" max="100" style="width:100%;background:#555;color:#eee;border:1px solid #777;padding:4px;">
            </div>
            <div>
                <label>Val:</label>
                <input type="number" id="colorV" value="${Math.round(v)}" min="0" max="255" style="width:100%;background:#555;color:#eee;border:1px solid #777;padding:4px;">
            </div>
            <div>
                <label>Red:</label>
                <input type="number" id="colorR" value="${r}" min="0" max="255" style="width:100%;background:#555;color:#eee;border:1px solid #777;padding:4px;">
            </div>
            <div>
                <label>Green:</label>
                <input type="number" id="colorG" value="${g}" min="0" max="255" style="width:100%;background:#555;color:#eee;border:1px solid #777;padding:4px;">
            </div>
            <div>
                <label>Blue:</label>
                <input type="number" id="colorB" value="${b}" min="0" max="255" style="width:100%;background:#555;color:#eee;border:1px solid #777;padding:4px;">
            </div>
            <div>
                <label>Alpha channel:</label>
                <input type="number" id="colorA" value="${a}" min="0" max="255" style="width:100%;background:#555;color:#eee;border:1px solid #777;padding:4px;">
            </div>
            <div>
                <label>HTML:</label>
                <input type="text" id="colorHTML" value="#${[r,g,b].map(x => x.toString(16).padStart(2,'0')).join('')}" style="width:100%;background:#555;color:#eee;border:1px solid #777;padding:4px;">
            </div>
        </div>
        <div style="text-align:right;margin-top:15px;">
            <button id="colorCancel" style="margin-right:10px;background:#666;color:#eee;border:1px solid #777;padding:5px 10px;cursor:pointer;">Cancel</button>
            <button id="colorOK" style="background:#666;color:#eee;border:1px solid #777;padding:5px 10px;cursor:pointer;">OK</button>
        </div>
    `;
    dialog.appendChild(content);
    document.body.appendChild(dialog);
    const gradientCanvas = document.getElementById("colorGradient");
    const valueSlider = document.getElementById("colorValueSlider");
    const gradCtx = gradientCanvas.getContext("2d");
    const valCtx = valueSlider.getContext("2d");
    function updateGradient() {
        for (let y = 0; y < 200; y++) {
            for (let x = 0; x < 200; x++) {
                const hVal = (x / 200) * 360;
                const sVal = 1 - (y / 200);
                const rgb = hsvToRgb(hVal, sVal, v / 255);
                gradCtx.fillStyle = `rgb(${rgb.r},${rgb.g},${rgb.b})`;
                gradCtx.fillRect(x, y, 1, 1);
            }
        }
    }
    function updateValueSlider() {
        const grad = valCtx.createLinearGradient(0, 0, 0, 200);
        grad.addColorStop(0, `hsl(${h}, 100%, 50%)`);
        grad.addColorStop(1, "#000000");
        valCtx.fillStyle = grad;
        valCtx.fillRect(0, 0, 30, 200);
    }
    function updateColor() {
        const rgb = hsvToRgb(h, s / 100, v / 255);
        r = rgb.r; g = rgb.g; b = rgb.b;
        document.getElementById("colorR").value = r;
        document.getElementById("colorG").value = g;
        document.getElementById("colorB").value = b;
        document.getElementById("colorH").value = Math.round(h);
        document.getElementById("colorS").value = Math.round(s);
        document.getElementById("colorV").value = Math.round(v);
        const hexInput = document.getElementById("colorHTML");
        if (hexInput) hexInput.value = `#${[r,g,b].map(x => x.toString(16).padStart(2,'0')).join('')}`;
        updateGradient();
        updateValueSlider();
    }
    updateGradient();
    updateValueSlider();
    gradientCanvas.onclick = (e) => {
        const rect = gradientCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        h = (x / 200) * 360;
        s = (1 - y / 200) * 100;
        updateColor();
    };
    valueSlider.onclick = (e) => {
        const rect = valueSlider.getBoundingClientRect();
        const y = e.clientY - rect.top;
        v = (1 - y / 200) * 255;
        updateColor();
    };
    document.getElementById("colorOK").onclick = () => {
        callback({r, g, b, a});
        document.body.removeChild(dialog);
    };
    document.getElementById("colorCancel").onclick = () => {
        callback(null);
        document.body.removeChild(dialog);
    };
    ["colorH","colorS","colorV","colorR","colorG","colorB","colorHTML"].forEach(id => {
        document.getElementById(id).onchange = () => {
            if (id === "colorH") h = parseFloat(document.getElementById(id).value) || 0;
            else if (id === "colorS") s = parseFloat(document.getElementById(id).value) || 0;
            else if (id === "colorV") v = parseFloat(document.getElementById(id).value) || 0;
            else if (id === "colorR") r = parseInt(document.getElementById(id).value) || 0;
            else if (id === "colorG") g = parseInt(document.getElementById(id).value) || 0;
            else if (id === "colorB") b = parseInt(document.getElementById(id).value) || 0;
            else if (id === "colorHTML") {
                const hex = document.getElementById(id).value.replace("#", "");
                if (hex.length === 6) {
                    r = parseInt(hex.substr(0,2), 16);
                    g = parseInt(hex.substr(2,2), 16);
                    b = parseInt(hex.substr(4,2), 16);
                }
            }
            if (id.startsWith("colorR") || id.startsWith("colorG") || id.startsWith("colorB")) {
                const hsv = rgbToHsv(r, g, b);
                h = hsv.h; s = hsv.s * 100; v = hsv.v * 255;
            } else {
                const rgb = hsvToRgb(h, s / 100, v / 255);
                r = rgb.r; g = rgb.g; b = rgb.b;
            }
            updateColor();
        };
    });
}
function setupContextMenus() {
    const contextMenu = document.createElement("div");
    contextMenu.className = "context-menu";
    contextMenu.id = "panelContextMenu";
    document.body.appendChild(contextMenu);
    let currentTarget = null;
    function createMenuItem(text, checked, onClick) {
        const item = document.createElement("div");
        item.className = "context-menu-item";
        const checkbox = document.createElement("span");
        checkbox.style.cssText = "display: inline-block; width: 16px; height: 16px; margin-right: 8px; text-align: center; border: 1px solid #555; background: #1a1a1a; vertical-align: middle; line-height: 14px; font-size: 12px;";
        checkbox.textContent = checked ? "✓" : " ";
        const label = document.createElement("span");
        label.textContent = text;
        item.appendChild(checkbox);
        item.appendChild(label);
        item.onclick = () => {
            onClick();
            contextMenu.style.display = "none";
        };
        return item;
    }
    function showContextMenu(e, target) {
        e.preventDefault();
        e.stopPropagation();
        currentTarget = target;
        const leftPanel = document.querySelector(".left-panel");
        const rightPanel = document.querySelector(".right-panel");
        const timelineContainer = document.querySelector(".timeline-container");
        const timelineView = document.querySelector(".timeline-view");
        const toolbar = document.querySelector(".toolbar");
        const leftVisible = leftPanel && leftPanel.style.display !== "none" && leftPanel.style.visibility !== "hidden";
        const rightVisible = rightPanel && rightPanel.style.display !== "none" && rightPanel.style.visibility !== "hidden";
        let timelineVisible = localStorage.getItem("timelineVisible");
        if (timelineVisible === null) {
            timelineVisible = "true";
            localStorage.setItem("timelineVisible", "true");
        }
        timelineVisible = timelineVisible !== "false";
        let toolbarVisible = localStorage.getItem("toolbarVisible");
        if (toolbarVisible === null) {
            toolbarVisible = "true";
            localStorage.setItem("toolbarVisible", "true");
        }
        toolbarVisible = toolbarVisible !== "false";
        const toolbarDisplay = toolbar && toolbar.style.display !== "none" && toolbar.style.visibility !== "hidden";
        contextMenu.innerHTML = "";
        const toolbarItem = createMenuItem("Toolbar", toolbarDisplay && toolbarVisible, () => {
            if (toolbar) {
                const newVisible = !toolbarVisible;
                if (newVisible) {
                    toolbar.style.display = "flex";
                    toolbar.style.visibility = "visible";
                    toolbar.style.opacity = "1";
                    localStorage.setItem("toolbarVisible", "true");
                } else {
                    toolbar.style.setProperty("display", "none", "important");
                    toolbar.style.setProperty("visibility", "hidden", "important");
                    toolbar.style.setProperty("opacity", "0", "important");
                    localStorage.setItem("toolbarVisible", "false");
                }
            }
        });
        contextMenu.appendChild(toolbarItem);
        const leftItem = createMenuItem("Left Panel", leftVisible, () => {
            if (leftPanel) {
                const newVisible = !leftVisible;
                if (newVisible) {
                    leftPanel.style.display = "flex";
                    leftPanel.style.visibility = "visible";
                    localStorage.setItem("leftPanelVisible", "true");
                } else {
                    leftPanel.style.display = "none";
                    leftPanel.style.visibility = "hidden";
                    localStorage.setItem("leftPanelVisible", "false");
                }
                resizeCanvas();
            }
        });
        contextMenu.appendChild(leftItem);
        const rightItem = createMenuItem("Right Panel", rightVisible, () => {
            if (rightPanel) {
                const newVisible = !rightVisible;
                if (newVisible) {
                    rightPanel.style.display = "flex";
                    rightPanel.style.visibility = "visible";
                    localStorage.setItem("rightPanelVisible", "true");
                } else {
                    rightPanel.style.display = "none";
                    rightPanel.style.visibility = "hidden";
                    localStorage.setItem("rightPanelVisible", "false");
                }
                resizeCanvas();
            }
        });
        contextMenu.appendChild(rightItem);
        const timelineItem = createMenuItem("Timeline", timelineVisible, () => {
            if (timelineContainer) {
                const canvasTimelineSplitter = document.getElementById("canvasTimelineSplitter");
                const newVisible = !timelineVisible;
                const mainSplitter = document.getElementById("mainSplitter");
                if (newVisible) {
                    timelineContainer.style.display = "flex";
                    timelineContainer.style.visibility = "visible";
                    timelineContainer.style.opacity = "1";
                    timelineContainer.style.removeProperty("flex");
                    timelineContainer.style.removeProperty("height");
                    const _tw = timelineContainer.closest(".timeline-wrapper");
                    if (_tw) _tw.style.removeProperty("min-height");
                    if (timelineView) {
                        timelineView.style.display = "block";
                        timelineView.style.visibility = "visible";
                        timelineView.style.opacity = "1";
                    }
                    if (canvasTimelineSplitter) {
                        canvasTimelineSplitter.style.display = "block";
                        canvasTimelineSplitter.style.visibility = "visible";
                        canvasTimelineSplitter.style.opacity = "1";
                    }
                    if (mainSplitter) {
                        mainSplitter.style.height = "calc(100% - 222px)";
                        mainSplitter.style.maxHeight = "calc(100% - 222px)";
                    }
                    localStorage.setItem("timelineVisible", "true");
                    resizeCanvas();
                    setTimeout(() => drawTimeline(), 100);
                } else {
                    timelineContainer.style.setProperty("display", "none", "important");
                    timelineContainer.style.setProperty("visibility", "hidden", "important");
                    timelineContainer.style.setProperty("opacity", "0", "important");
                    timelineContainer.style.setProperty("flex", "0 0 0px", "important");
                    timelineContainer.style.setProperty("height", "0px", "important");
                    const _tw = timelineContainer.closest(".timeline-wrapper");
                    if (_tw) _tw.style.setProperty("min-height", "0", "important");
                    if (timelineView) {
                        timelineView.style.setProperty("display", "none", "important");
                        timelineView.style.setProperty("visibility", "hidden", "important");
                        timelineView.style.setProperty("opacity", "0", "important");
                    }
                    if (canvasTimelineSplitter) {
                        canvasTimelineSplitter.style.setProperty("display", "none", "important");
                        canvasTimelineSplitter.style.setProperty("visibility", "hidden", "important");
                        canvasTimelineSplitter.style.setProperty("opacity", "0", "important");
                    }
                    if (mainSplitter) {
                        mainSplitter.style.height = "calc(100% - 0px)";
                        mainSplitter.style.maxHeight = "calc(100% - 0px)";
                    }
                    localStorage.setItem("timelineVisible", "false");
                    resizeCanvas();
                }
            }
        });
        contextMenu.appendChild(timelineItem);
        contextMenu.style.left = e.pageX + "px";
        contextMenu.style.top = e.pageY + "px";
        contextMenu.style.display = "block";
    }
    function hideContextMenu() {
        contextMenu.style.display = "none";
        currentTarget = null;
    }
    const leftPanel = document.querySelector(".left-panel");
    const rightPanel = document.querySelector(".right-panel");
    const timelineContainer = document.querySelector(".timeline-container");
    const toolbar = document.querySelector(".toolbar");
    const tabsContainer = document.getElementById("tabsContainer");
    if (leftPanel) {
        leftPanel.addEventListener("contextmenu", (e) => showContextMenu(e, "left"));
    }
    if (rightPanel) {
        rightPanel.addEventListener("contextmenu", (e) => showContextMenu(e, "right"));
    }
    if (timelineContainer) {
        timelineContainer.addEventListener("contextmenu", (e) => showContextMenu(e, "timeline"));
    }
    if (toolbar) {
        toolbar.addEventListener("contextmenu", (e) => {
            if (!e.target.closest("button") && !e.target.closest("#colorSchemeDropdown")) {
                showContextMenu(e, "toolbar");
            }
        });
    }
    if (tabsContainer) {
        tabsContainer.addEventListener("contextmenu", (e) => {
            if (!e.target.closest(".tab")) {
                showContextMenu(e, "tabs");
            }
        });
    }
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" || e.key === "Esc") {
            const settingsDialog = document.getElementById("settingsDialog");
            const aboutDialog = document.getElementById("infoDialog");
            const hotkeysDialog = document.getElementById("hotkeysDialog");
            const defaultGaniDialog = document.getElementById("defaultGaniDialog");
            const colorSchemeDropdown = document.getElementById("colorSchemeDropdown");
            const contextMenu = document.getElementById("panelContextMenu");
            const contextMenus = document.querySelectorAll(".context-menu");
            if (settingsDialog && settingsDialog.style.display === "flex") {
                const settingsCancel = document.getElementById("settingsCancel");
                if (settingsCancel && settingsCancel.onclick) {
                    settingsCancel.onclick();
                } else {
                    settingsDialog.style.display = "none";
                }
            }
            if (aboutDialog && aboutDialog.style.display === "flex") {
                const aboutOK = document.getElementById("aboutOK");
                if (aboutOK && aboutOK.onclick) {
                    aboutOK.onclick();
                } else {
                    aboutDialog.style.display = "none";
                }
            }
            if (hotkeysDialog && hotkeysDialog.style.display === "flex") {
                const hotkeysOK = document.getElementById("hotkeysOK");
                if (hotkeysOK && hotkeysOK.onclick) {
                    hotkeysOK.onclick();
                } else {
                    hotkeysDialog.style.display = "none";
                }
            }
            if (defaultGaniDialog && defaultGaniDialog.style.display === "flex") {
                defaultGaniDialog.style.display = "none";
            }
            if (colorSchemeDropdown && colorSchemeDropdown.style.display === "block") {
                colorSchemeDropdown.style.display = "none";
            }
            if (contextMenu && contextMenu.style.display === "block") {
                contextMenu.style.display = "none";
            }
            contextMenus.forEach(menu => {
                if (menu.style.display === "block") {
                    menu.style.display = "none";
                }
            });
            const anyDialogOpen = [settingsDialog, aboutDialog, hotkeysDialog, defaultGaniDialog].some(d => d && d.style.display === "flex") || (colorSchemeDropdown && colorSchemeDropdown.style.display === "block");
            if (!anyDialogOpen && isDragging && _dragMoveIndicator) {
                for (const [piece, startPos] of _dragMoveIndicator.startPositions) { piece.xoffset = startPos.x; piece.yoffset = startPos.y; }
                isDragging = false; dragButton = null; dragOffset = null; dragStartMousePos = null; dragStartState = null; pieceInitialPositions.clear();
                _dragMoveIndicator = null;
                updateItemsCombo(); updateItemSettings(); redraw();
            }
        }
    });
    document.addEventListener("click", hideContextMenu);
    document.addEventListener("contextmenu", (e) => {
        if (!leftPanel?.contains(e.target) && !rightPanel?.contains(e.target) && !timelineContainer?.contains(e.target) && !toolbar?.contains(e.target) && !tabsContainer?.contains(e.target)) {
            hideContextMenu();
        }
    });
}

(function initP2PCollab() {
    if (typeof Peer === "undefined") return;
    const collabBtn = document.getElementById("btnCollab");
    const collabDropdown = document.getElementById("collabDropdown");
    const collabMyCode = document.getElementById("collabMyCode");
    const collabStatus = document.getElementById("collabStatus");
    const collabPeers = document.getElementById("collabPeers");
    const collabJoinCode = document.getElementById("collabJoinCode");
    const collabJoinBtn = document.getElementById("collabJoin");
    const collabCopyBtn = document.getElementById("collabCopy");
    const collabDisconnect = document.getElementById("collabDisconnect");
    const collabToggleTrack = document.getElementById("collabToggleTrack");
    const collabToggleThumb = document.getElementById("collabToggleThumb");
    const collabToggleLabel = document.getElementById("collabToggleLabel");
    const collabCodeSection = document.getElementById("collabCodeSection");
    if (!collabBtn || !collabDropdown) return;
    let collabEnabled = true;
    function teardownPeer() { connections.forEach(c => c.conn.close()); connections = []; remoteGhosts.clear(); if (peer) { peer.destroy(); peer = null; } hooksInit = false; }
    function setCollabEnabled(on) {
        collabEnabled = on;
        collabToggleTrack.style.borderColor = on ? "#4a4" : "#404040";
        collabToggleThumb.style.left = on ? "19px" : "1px";
        collabToggleThumb.style.background = on ? "#4a4" : "#555";
        collabCodeSection.style.display = on ? "" : "none";
        if (!on) { teardownPeer(); updatePeerList(); collabStatus.textContent = ""; collabDisconnect.style.display = "none"; }
        else { createPeer(); }
    }
    collabToggleTrack.addEventListener("click", () => setCollabEnabled(!collabEnabled));
    collabDisconnect.addEventListener("click", () => { teardownPeer(); collabDisconnect.style.display = "none"; collabStatus.textContent = "Disconnected"; collabStatus.style.color = "#888"; updatePeerList(); createPeer(); });

    let peer = null, connections = [], suppressBroadcast = false;
    let remoteGhosts = new Map();
    let ghostDirty = false;
    const imgDataCache = new Map();
    const sentImageKeys = new Set();

    const ghostCanvas = document.createElement("canvas");
    ghostCanvas.style.cssText = "position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:99999;pointer-events:none;";
    const ghostCtx = ghostCanvas.getContext("2d");
    document.body.appendChild(ghostCanvas);
    ghostCanvas.width = window.innerWidth * dpr;
    ghostCanvas.height = window.innerHeight * dpr;
    window.addEventListener("resize", () => { ghostCanvas.width = window.innerWidth * dpr; ghostCanvas.height = window.innerHeight * dpr; drawGhosts(); });

    function genCode() {
        const c = "abcdefghijkmnpqrstuvwxyz23456789";
        let r = "";
        for (let i = 0; i < 6; i++) r += c[Math.floor(Math.random() * c.length)];
        return "gani-" + r;
    }

    const ghostColors = ["#00e5ff", "#ff4081", "#76ff03", "#ffab00"];
    let ghostColorIdx = 0, hooksInit = false;
    const myCode = genCode();
    let myLabel = myCode;
    collabMyCode.value = myCode;

    collabBtn.addEventListener("click", () => { collabDropdown.style.display = collabDropdown.style.display === "none" ? "block" : "none"; });
    collabCopyBtn.addEventListener("click", () => {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(myCode).then(() => { collabCopyBtn.textContent = "Copied!"; setTimeout(() => collabCopyBtn.textContent = "Copy", 1500); }).catch(fallbackCopy);
        } else fallbackCopy();
        function fallbackCopy() {
            const ta = document.createElement("textarea");
            ta.value = myCode;
            ta.style.cssText = "position:fixed;opacity:0";
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand("copy"); collabCopyBtn.textContent = "Copied!"; } catch(e) { collabCopyBtn.textContent = "Failed"; }
            setTimeout(() => collabCopyBtn.textContent = "Copy", 1500);
            document.body.removeChild(ta);
        }
    });
    document.addEventListener("click", (e) => { if (!collabBtn.contains(e.target) && !collabDropdown.contains(e.target)) collabDropdown.style.display = "none"; });

    function updatePeerList() {
        collabDisconnect.style.display = (!isHost && connections.length > 0) ? "block" : "none";
        if (connections.length === 0) { collabPeers.style.display = "none"; collabBtn.classList.remove("active"); return; }
        collabPeers.style.display = "block";
        collabPeers.innerHTML = "";
        for (const c of connections) {
            const g = remoteGhosts.get(c.label);
            const col = g ? g.color : "#888";
            const d = document.createElement("div");
            d.style.cssText = `display:flex;align-items:center;gap:6px;margin-bottom:3px;font-size:11px;`;
            d.innerHTML = `<span style="display:flex;align-items:center;gap:4px;flex:1;background:#111;border:1px solid #333;padding:2px 6px;min-width:0;overflow:hidden;"><span style="width:6px;height:6px;border-radius:50%;background:${c.conn.open ? col : '#a44'};flex-shrink:0;"></span><span style="color:${c.conn.open ? col : '#a44'};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${c.label}${c.conn.open ? '' : ' (disconnected)'}</span></span>${isHost ? `<button data-label="${c.label}" style="flex-shrink:0;background:#5a2222;border:1px solid #804040;color:#e0e0e0;padding:2px 8px;cursor:pointer;font-size:10px;margin-left:4px;">Kick</button>` : ''}`;
            if (isHost) { const kb = d.querySelector("button"); if (kb) kb.addEventListener("click", () => { const target = connections.find(x => x.label === kb.dataset.label); if (target) { target.conn.close(); } }); }
            collabPeers.appendChild(d);
        }
        const openCount = connections.filter(c => c.conn.open).length;
        collabStatus.textContent = isHost ? (openCount === 1 ? "1 peer connected" : `${openCount} peers connected`) : "Connected to host";
        collabStatus.style.color = "#4a4";
        collabBtn.classList.add("active");
    }

    function broadcast(msg) {
        if (suppressBroadcast) return;
        for (const c of connections) { if (c.conn.open) try { c.conn.send(msg); } catch (e) {} }
    }

    function broadcastCurrentState() { const s = serializeAnimationState(); if (s) broadcast({ type: "state", tab: currentTabIndex, state: s }); }
    function broadcastTabs() { broadcast({ type: "tabs", tabs: animations.map(a => saveGani(a)), names: animations.map(a => a.fileName || ""), active: currentTabIndex }); }

    function applyIncomingTabs(data) {
        suppressBroadcast = true;
        animations.length = 0;
        for (let i = 0; i < data.tabs.length; i++) { const a = parseGani(data.tabs[i]); a.fileName = data.names[i] || ""; animations.push(a); }
        if (animations.length > 0) switchTab(Math.min(data.active || 0, animations.length - 1));
        suppressBroadcast = false;
    }

    function applyIncomingState(data) {
        suppressBroadcast = true;
        const active = document.activeElement;
        const selStart = active && active.selectionStart;
        const selEnd = active && active.selectionEnd;
        if (data.tab !== undefined && data.tab !== currentTabIndex && data.tab < animations.length) switchTab(data.tab);
        if (data.state) restoreAnimationState(data.state);
        suppressBroadcast = false;
        if (active && active !== document.activeElement) {
            active.focus();
            if (selStart !== undefined) { try { active.setSelectionRange(selStart, selEnd); } catch(e) {} }
        }
    }

    function imgToDataUrl(img) {
        try { const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight; c.getContext("2d").drawImage(img, 0, 0); return c.toDataURL("image/png"); } catch (e) { return null; }
    }

    function cacheImgDataUrl(key) {
        if (imgDataCache.has(key)) return imgDataCache.get(key);
        const img = imageLibrary.get(key);
        if (!img || !img.complete || !img.naturalWidth) return null;
        const d = imgToDataUrl(img);
        if (d) imgDataCache.set(key, d);
        return d;
    }

    function queueImageSend(key) {
        if (connections.length === 0 || sentImageKeys.has(key)) return;
        const img = imageLibrary.get(key);
        if (!img) return;
        sentImageKeys.add(key);
        const doSend = () => {
            if (connections.length === 0) return;
            const d = imgToDataUrl(img);
            if (d) broadcast({ type: "images", images: { [key]: d } });
        };
        if (img.complete && img.naturalWidth) setTimeout(doSend, 50);
        else img.addEventListener("load", () => setTimeout(doSend, 50), { once: true });
    }

    async function sendAllImages(conn) {
        if (!conn.open) return;
        const keys = [...imageLibrary.keys()];
        if (keys.length === 0) { conn.send({ type: "images_end" }); return; }
        collabStatus.textContent = `Sending 0/${keys.length}...`;
        collabStatus.style.color = "#ca4";
        for (let i = 0; i < keys.length; i++) {
            if (!conn.open) break;
            const d = cacheImgDataUrl(keys[i]);
            if (d) { const o = {}; o[keys[i]] = d; conn.send({ type: "images", images: o }); sentImageKeys.add(keys[i]); }
            if (i % 10 === 0) { collabStatus.textContent = `Sending ${i}/${keys.length}...`; await new Promise(r => setTimeout(r, 5)); }
        }
        conn.send({ type: "images_end" });
        collabStatus.textContent = connections.length ? "1 peer connected" : "";
        collabStatus.style.color = "#4a4";
    }

    let applyImgTimer = null;
    function applyImages(imgs) {
        for (const [key, url] of Object.entries(imgs)) {
            if (imageLibrary.has(key)) continue;
            const i = new Image();
            i.onload = () => { imageLibrary.set(key, i); workspaceImageKeys.add(key); };
            i.src = url;
        }
        if (applyImgTimer) clearTimeout(applyImgTimer);
        applyImgTimer = setTimeout(() => { refreshAllAnimationsSprites(); redraw(); applyImgTimer = null; }, 300);
    }

    function hookImageLibrary() {
        const origSet = imageLibrary.set.bind(imageLibrary);
        for (const k of imageLibrary.keys()) sentImageKeys.add(k);
        imageLibrary.set = function(key, img) { origSet(key, img); queueImageSend(key); };
    }

    function hookUndoBroadcast() {
        const orig = window.addUndoCommand;
        window.addUndoCommand = function(cmd) {
            orig(cmd);
            if (cmd.newState) broadcast({ type: "state", tab: currentTabIndex, state: cmd.newState, desc: cmd.description });
        };
    }

    function hookHistorySync() {
        const origUndo = window.undo;
        const origRedo = window.redo;
        window.undo = function() { origUndo(); broadcast({ type: "undo", tab: currentTabIndex }); };
        window.redo = function() { origRedo(); broadcast({ type: "redo", tab: currentTabIndex }); };
    }

    function hookClipboardDetect() {
        collabDropdown.addEventListener("click", async () => {
            if (connections.length > 0) return;
            try {
                const text = await navigator.clipboard.readText();
                if (text && text.startsWith("gani-")) collabJoinCode.value = text;
            } catch (e) {}
        });
    }

    function hookTabOps() {
        const origSwitch = window.switchTab;
        window.switchTab = function(i) { origSwitch(i); broadcast({ type: "switchtab", tab: i }); };
        const origAdd = window.addTab;
        window.addTab = function(a, f) { origAdd(a, f); broadcastTabs(); };
        const origClose = window.closeTab;
        window.closeTab = function(i) { origClose(i); broadcastTabs(); };
    }

    function hookMouseMoveBroadcast() {
        let last = 0;
        document.addEventListener("mousemove", (e) => {
            const now = performance.now();
            if (now - last < 50 || connections.length === 0) return;
            last = now;
            const g = { x: e.clientX, y: e.clientY, frame: currentFrame, tab: currentTabIndex };
            if (isDragging && selectedPieces.size > 0) {
                g.dragging = true;
                g.pieces = [];
                const hasStartPos = pieceInitialPositions.size > 0;
                for (const p of selectedPieces) {
                    const sp = currentAnimation ? currentAnimation.getAniSprite(p.spriteIndex, p.spriteName || "") : null;
                    g.pieces.push({
                        id: p.id, si: p.spriteIndex, sn: p.spriteName,
                        xo: p.xoffset, yo: p.yoffset,
                        xs: p.xscale, ys: p.yscale, r: p.rotation,
                        sl: sp ? sp.left : 0, st: sp ? sp.top : 0, sw: sp ? sp.width : 32, sh: sp ? sp.height : 32
                    });
                    if (hasStartPos && !g.starts) g.starts = [];
                    if (hasStartPos) {
                        const ip = pieceInitialPositions.get(p);
                        g.starts.push({ id: p.id, sx: ip.x, sy: ip.y, sw: sp ? sp.width : 32, sh: sp ? sp.height : 32 });
                    }
                }
            }
            broadcast({ type: "cursor", label: myLabel, g });
        });
    }

    function drawGhosts() {
        const ctx = ghostCtx;
        ctx.clearRect(0, 0, ghostCanvas.width, ghostCanvas.height);
        if (remoteGhosts.size === 0) return;
        const cr = mainCanvas.getBoundingClientRect();
        const z = zoomFactors[zoomLevel] || 1;
        for (const [label, gh] of remoteGhosts) {
            if (label === myLabel) continue;
            ctx.save();
            const cx = gh.x * dpr, cy = gh.y * dpr;
            if (gh.dragging && gh.pieces && currentAnimation) {
                ctx.translate(cr.left * dpr + cr.width * dpr / 2 + panX * dpr, cr.top * dpr + cr.height * dpr / 2 + panY * dpr);
                ctx.scale(z, z);
                ctx.globalAlpha = 0.5;
                for (const gp of gh.pieces) {
                    const sp = currentAnimation.getAniSprite(gp.si, gp.sn || "");
                    if (!sp) continue;
                    const img = getSpriteImage(sp);
                    if (!img) continue;
                    const xs = gp.xs !== undefined ? gp.xs : sp.xscale;
                    const ys = gp.ys !== undefined ? gp.ys : sp.yscale;
                    const r = gp.r !== undefined ? gp.r : sp.rotation;
                    const zm = sp._zoom || 1;
                    const sl = gp.sl !== undefined ? gp.sl : sp.left;
                    const st = gp.st !== undefined ? gp.st : sp.top;
                    const sw = gp.sw !== undefined ? gp.sw : sp.width;
                    const sh = gp.sh !== undefined ? gp.sh : sp.height;
                    ctx.save();
                    ctx.translate(gp.xo, gp.yo);
                    ctx.translate(sw / 2, sh / 2);
                    ctx.scale(xs * zm, ys * zm);
                    ctx.rotate(r * Math.PI / 180);
                    ctx.translate(-sw / 2, -sh / 2);
                    ctx.drawImage(img, sl, st, sw, sh, sl, st, sw, sh);
                    ctx.strokeStyle = gh.color;
                    ctx.lineWidth = 2 / (z * xs * zm);
                    ctx.strokeRect(0, 0, sw, sh);
                    ctx.restore();
                }
                if (gh.starts) {
                    ctx.globalAlpha = 0.7;
                    for (const s of gh.starts) {
                        const hw = (s.sw || 32) / 2, hh = (s.sh || 32) / 2;
                        const matchedPiece = gh.pieces.find(p => p.id === s.id);
                        const ex = matchedPiece ? matchedPiece.xo + hw : s.sx + hw;
                        const ey = matchedPiece ? matchedPiece.yo + hh : s.sy + hh;
                        ctx.setLineDash([6 / z, 6 / z]);
                        ctx.strokeStyle = gh.color;
                        ctx.lineWidth = 2.5 / z;
                        ctx.beginPath(); ctx.moveTo(s.sx + hw, s.sy + hh); ctx.lineTo(ex, ey); ctx.stroke();
                        ctx.setLineDash([]);
                        ctx.beginPath(); ctx.arc(s.sx + hw, s.sy + hh, 9 / z, 0, Math.PI * 2);
                        ctx.fillStyle = gh.color.replace(")", ",0.35)").replace("rgb", "rgba").replace("#", "");
                        if (ctx.fillStyle === gh.color || ctx.fillStyle === "transparent") ctx.fillStyle = gh.color + "59";
                        ctx.fill();
                        ctx.strokeStyle = gh.color;
                        ctx.lineWidth = 2.5 / z;
                        ctx.stroke();
                    }
                }
                ctx.restore();
                ctx.save();
            }
            const displayLabel = label.startsWith("gani-") ? label.slice(5) : label;
            ctx.fillStyle = gh.color;
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + 16 * dpr); ctx.lineTo(cx + 4 * dpr, cy + 13 * dpr); ctx.lineTo(cx + 9 * dpr, cy + 20 * dpr); ctx.lineTo(cx + 11 * dpr, cy + 18 * dpr); ctx.lineTo(cx + 7 * dpr, cy + 11 * dpr); ctx.lineTo(cx + 12 * dpr, cy + 12 * dpr);
            ctx.closePath(); ctx.fill();
            ctx.globalAlpha = 1;
            ctx.font = `bold ${11 * dpr}px 'chevyray',monospace`;
            ctx.textAlign = "left"; ctx.textBaseline = "bottom";
            ctx.strokeStyle = "rgba(0,0,0,0.9)"; ctx.lineWidth = 3 * dpr;
            ctx.lineJoin = "round";
            ctx.strokeText(displayLabel, cx + 15 * dpr, cy + 3 * dpr);
            ctx.fillStyle = gh.color;
            ctx.fillText(displayLabel, cx + 15 * dpr, cy + 3 * dpr);
            ctx.restore();
        }
    }

    let lastSyncedFrame = -1;

    function hookRedrawGhost() {
        const orig = window.redraw;
        window.redraw = function() { orig(); drawGhosts(); };
    }

    function hookFrameSync() {
        const orig = window.redraw;
        window.redraw = function() {
            orig();
            if (connections.length && !suppressBroadcast && currentFrame !== lastSyncedFrame) {
                lastSyncedFrame = currentFrame;
                broadcast({ type: "frame", frame: currentFrame });
            }
        };
    }

    function hookRedrawGhost() {
        const origRedraw = window.redraw;
        window.redraw = function() { origRedraw(); drawGhosts(); };
    }

    function startGhostLoop() {
        (function loop() {
            if (connections.length > 0) drawGhosts();
            requestAnimationFrame(loop);
        })();
    }

    function setupConn(conn, label) {
        const color = ghostColors[ghostColorIdx++ % ghostColors.length];
        remoteGhosts.set(label, { x: -100, y: -100, color, tab: 0, frame: 0 });
        connections.push({ conn, label });
        conn.on("open", () => {
            updatePeerList();
            if (isHost) { conn.send({ type: "fullsync", tabs: animations.map(a => saveGani(a)), names: animations.map(a => a.fileName || ""), active: currentTabIndex }); sendAllImages(conn); }
            else broadcastCurrentState();
        });
        conn.on("data", (data) => {
            switch (data.type) {
                case "state": applyIncomingState(data); break;
                case "undo": suppressBroadcast = true; if (data.tab !== undefined && data.tab !== currentTabIndex) switchTab(data.tab); undo(); suppressBroadcast = false; break;
                case "redo": suppressBroadcast = true; if (data.tab !== undefined && data.tab !== currentTabIndex) switchTab(data.tab); redo(); suppressBroadcast = false; break;
                case "tabs": case "fullsync": applyIncomingTabs(data); break;
                case "images": applyImages(data.images); break;
                case "images_end": collabStatus.textContent = connections.length ? (isHost ? `${connections.filter(c=>c.conn.open).length} peer${connections.filter(c=>c.conn.open).length===1?'':'s'} connected` : "Connected to host") : ""; collabStatus.style.color = "#4a4"; break;
                case "switchtab": suppressBroadcast = true; if (data.tab !== undefined && data.tab !== currentTabIndex) switchTab(data.tab); suppressBroadcast = false; break;
                case "frame": if (data.frame !== undefined && data.frame !== currentFrame && data.frame >= 0 && currentAnimation && data.frame < currentAnimation.frames.length) { suppressBroadcast = true; currentFrame = data.frame; redraw(); suppressBroadcast = false; } break;
                case "cursor": if (data.g) { const gh = Object.assign(remoteGhosts.get(label) || {}, data.g); if (!data.g.dragging) { gh.pieces = null; gh.starts = null; } remoteGhosts.set(label, gh); } break;
            }
        });
        conn.on("close", () => { remoteGhosts.delete(label); connections = connections.filter(c => c.conn !== conn); updatePeerList(); redraw(); });
        conn.on("error", () => { updatePeerList(); });
    }

    function createPeer() {
        peer = new Peer(myCode, { debug: 0 });
        peer.on("open", () => {
            isHost = true;
            myLabel = peer.id || myCode;
            collabStatus.textContent = "Waiting for peers..."; collabStatus.style.color = "#888";
            if (!hooksInit) { hooksInit = true; hookUndoBroadcast(); hookTabOps(); hookMouseMoveBroadcast(); hookRedrawGhost(); hookImageLibrary(); hookFrameSync(); hookHistorySync(); hookClipboardDetect(); startGhostLoop(); }
        });
        peer.on("connection", (conn) => setupConn(conn, conn.peer || "Peer"));
        peer.on("error", (err) => { if (err.type === "unavailable-id") createPeer(); else { collabStatus.textContent = "Error: " + err.type; collabStatus.style.color = "#a44"; } });
    }

    collabJoinBtn.addEventListener("click", () => {
        const code = collabJoinCode.value.trim();
        if (!code || connections.length > 0) return;
        collabStatus.textContent = "Connecting..."; collabStatus.style.color = "#ca4";
        peer = new Peer(undefined, { debug: 0 });
        peer.on("open", () => {
            isHost = false;
            myLabel = peer.id || "Peer";
            const conn = peer.connect(code, { reliable: true });
            setupConn(conn, "Host (" + code + ")");
            if (!hooksInit) { hooksInit = true; hookUndoBroadcast(); hookTabOps(); hookMouseMoveBroadcast(); hookRedrawGhost(); hookImageLibrary(); hookFrameSync(); hookHistorySync(); hookClipboardDetect(); startGhostLoop(); }
        });
        peer.on("error", () => { collabStatus.textContent = "Failed to connect"; collabStatus.style.color = "#a44"; });
    });

    if (collabEnabled) createPeer();
})();