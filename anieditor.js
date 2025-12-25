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
        retval.updateBoundingBox();
        return retval;
    }
    updateBoundingBox() {
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const rad = this.rotation * Math.PI / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const w = this.width * this.xscale;
        const h = this.height * this.yscale;
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
            return {
                x: this.xoffset + sprite.boundingBox.x,
                y: this.yoffset + sprite.boundingBox.y,
                width: sprite.boundingBox.width,
                height: sprite.boundingBox.height
            };
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
const soundLibrary = new Map();
const ENABLE_F12_LOGGING = false;
let animations = [];
let currentTabIndex = 0;
let currentAnimation = null;
let localFileCache = { images: [], ganis: [], sounds: [] };

const refreshLocalFileCache = async () => {
    localFileCache.images = [];
    localFileCache.ganis = [];
    localFileCache.sounds = [];
};
let currentFrame = 0;
let currentDir = 2;
let selectedPieces = new Set();
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
        console.log(`[${context}:${funcName}] ${message}`);
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
        console.log(`[${context}:unknown] ${message}`);
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
const zoomFactors = [0.25, 0.5, 0.75, 1.0, 2, 3, 4, 8];
const dpr = window.devicePixelRatio || 1;

let editingSprite = null;
let zoomLevel = parseInt(localStorage.getItem("mainCanvasZoom")) || 3;
let spritePreviewZoom = 3;
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
let undoStack = [];
let undoIndex = -1;
let maxUndo = 50;
let dragStartState = null;
let clipboardFrame = null;
let clipboardSprite = null;
let dragButton = null;
let dragOffset = null;
let dragStartMousePos = null;
let pieceInitialPositions = new Map();
let isDragging = false;
let insertPiece = null;
let lastMouseX = 0;
let lastMouseY = 0;
let boxSelectStart = null;
let isBoxSelecting = false;
let spriteSplitterDragging = false;
let leftCenterSplitterDragging = false;
let centerRightSplitterDragging = false;
let canvasTimelineSplitterDragging = false;
let activeContextMenu = null;
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
let timelineScrollX = 0;
let timelineTotalWidth = 0;
const leftPanel = document.querySelector(".left-panel");
const rightPanel = document.querySelector(".right-panel");
const centerPanel = document.querySelector(".center-panel");

function resizeCanvas() {
    const container = centerPanel;
    const dpr = window.devicePixelRatio || 1;
    const containerWidth = centerPanel.clientWidth + 4;
    const containerHeight = container.clientHeight || window.innerHeight;

    if (leftPanel && rightPanel) {
        const leftWidth = parseInt(leftPanel.style.width) || 300;
        const rightWidth = parseInt(rightPanel.style.width) || 250;
        const totalFixedWidth = leftWidth + rightWidth;
        const minCenterWidth = 200;
        const defaultLeftWidth = 300;
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

    mainCanvas.width = containerWidth * dpr;
    mainCanvas.height = containerHeight * dpr;
    mainCanvas.style.width = containerWidth + "px";
    mainCanvas.style.height = containerHeight + "px";
    mainCanvas.style.position = "absolute";
    mainCanvas.style.top = "0";
    mainCanvas.style.left = leftPanel.offsetWidth + "px";
    mainCanvas.style.zIndex = "-2";
    const canvasControls = document.querySelector(".canvas-controls");
    if (canvasControls) {
        canvasControls.style.left = leftPanel.offsetWidth + 10 + "px";
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
            drawTimeline();
            const timelineContainer = document.querySelector(".timeline-container");
            const timelineView = document.querySelector(".timeline-view");
            const canvas = document.getElementById("timelineCanvas");
            if (timelineContainer) {
                timelineContainer.style.display = "flex";
                timelineContainer.style.visibility = "visible";
            }
            if (timelineView) {
                timelineView.style.display = "block";
                timelineView.style.visibility = "visible";
            }
            if (canvas) {
                canvas.style.display = "block";
                canvas.style.visibility = "visible";
            }
        }, 10);
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
    const lightColor = lightenColor(backgroundColor, 0.4);
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

function drawSprite(ctx, sprite, x, y, level = 0) {
    if (level > 3) return;
    if (!sprite) return;
    for (let i = 0; i < sprite.m_drawIndex && i < sprite.attachedSprites.length; i++) {
        const attached = sprite.attachedSprites[i];
        const child = currentAnimation.getAniSprite(attached.index, "");
        if (child) drawSprite(ctx, child, x + attached.offset.x, y + attached.offset.y, level + 1);
    }
    const img = getSpriteImage(sprite);
    if (img) {
        ctx.save();
        ctx.translate(x, y);
        if (sprite.rotation !== 0 || sprite.xscale !== 1 || sprite.yscale !== 1) {
            ctx.translate(sprite.width / 2, sprite.height / 2);
            ctx.scale(sprite.xscale, sprite.yscale);
            ctx.rotate(sprite.rotation * Math.PI / 180);
            ctx.translate(-sprite.width / 2, -sprite.height / 2);
        }
        if (sprite.colorEffectEnabled && sprite.colorEffect) {
            const tempCanvas = document.createElement("canvas");
            tempCanvas.width = sprite.width;
            tempCanvas.height = sprite.height;
            const tempCtx = tempCanvas.getContext("2d");
            tempCtx.drawImage(img, sprite.left, sprite.top, sprite.width, sprite.height, 0, 0, sprite.width, sprite.height);
            tempCtx.globalCompositeOperation = "multiply";
            tempCtx.fillStyle = `rgb(${sprite.colorEffect.r}, ${sprite.colorEffect.g}, ${sprite.colorEffect.b})`;
            tempCtx.fillRect(0, 0, sprite.width, sprite.height);
            tempCtx.globalCompositeOperation = "destination-in";
            tempCtx.drawImage(img, sprite.left, sprite.top, sprite.width, sprite.height, 0, 0, sprite.width, sprite.height);
            ctx.drawImage(tempCanvas, 0, 0);
        } else {
            ctx.drawImage(img, sprite.left, sprite.top, sprite.width, sprite.height, 0, 0, sprite.width, sprite.height);
        }
        ctx.restore();
    } else {
        ctx.save();
        ctx.translate(x, y);
        if (sprite.rotation !== 0 || sprite.xscale !== 1 || sprite.yscale !== 1) {
            ctx.translate(sprite.width / 2, sprite.height / 2);
            ctx.scale(sprite.xscale, sprite.yscale);
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
        if (child) drawSprite(ctx, child, x + attached.offset.x, y + attached.offset.y, level + 1);
    }
}

function getSpriteImage(sprite) {
    if (sprite.type === "CUSTOM") {
        return imageLibrary.get(sprite.customImageName.toLowerCase()) || null;
    }
    let defaultName = currentAnimation ? currentAnimation.getDefaultImageName(sprite.type) : "";
    if (defaultName && imageLibrary.has(defaultName.toLowerCase())) {
        return imageLibrary.get(defaultName.toLowerCase());
    }
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
            return imageLibrary.get(fallback.toLowerCase());
        }
    }
    if (!defaultName || !imageLibrary.has(defaultName.toLowerCase())) {
        for (const otherAni of animations) {
            const otherDefault = otherAni.getDefaultImageName(sprite.type);
            if (otherDefault && imageLibrary.has(otherDefault.toLowerCase())) {
                defaultName = otherDefault;
                return imageLibrary.get(defaultName.toLowerCase());
            }
        }
    }
    const fallback = fallbackNames[sprite.type];
    if (fallback && imageLibrary.has(fallback.toLowerCase())) {
        return imageLibrary.get(fallback.toLowerCase());
    }
    return null;
}

async function loadLocalImages() {
    const fallbackImages = [
        "2002_32x32sprites-flame.png",
        "arrowsbox.png",
        "baddyblue.png",
        "baddydragon.png",
        "baddygold.png",
        "baddygray.png",
        "baddyhare.png",
        "baddylizardon.png",
        "baddyninja.png",
        "baddyoctopus.png",
        "baddyred.png",
        "baddytest.png",
        "bcalarmclock.png",
        "bigshield.png",
        "block.png",
        "bluelampani.mng",
        "bluelampani2.mng",
        "blueletters.png",
        "body.png",
        "body2.png",
        "body3.png",
        "body4.png",
        "bomb1.png",
        "bomb2.png",
        "brother1.png",
        "brother2.png",
        "bshield0.png",
        "chest.png",
        "chestopen.png",
        "door.png",
        "door1.png",
        "editorcursor.png",
        "emoticon_AFK_stay.mng",
        "emoticon_BRB_stay.mng",
        "emoticon_conf.png",
        "emoticon_Dgrin.png",
        "emoticon_Eyes.mng",
        "emoticon_Frown.png",
        "emoticon_Grr.png",
        "emoticon_Heart.png",
        "emoticon_Idea.png",
        "emoticon_jpm_stay.mng",
        "emoticon_kitty.png",
        "emoticon_LOL.mng",
        "emoticon_Maybe.png",
        "emoticon_Ncool.png",
        "emoticon_Ohh.png",
        "emoticon_Ptongue.mng",
        "emoticon_Qphone_stay.png",
        "emoticon_ROFL.mng",
        "emoticon_Smile.png",
        "emoticon_Tears.mng",
        "emoticon_Umad.png",
        "emoticon_Vsorry.mng",
        "emoticon_Wink.png",
        "emoticon_XX.png",
        "emoticon_Yummy.png",
        "emoticon_Zzz_stay.mng",
        "emoticonbubbles.png",
        "emoticonmicro.png",
        "emotions_template.png",
        "g4_animation_fire.gif",
        "g4_particle_bluelight.png",
        "g4_particle_bluex.png",
        "g4_particle_bubble.png",
        "g4_particle_cloud.png",
        "g4_particle_halo.png",
        "g4_particle_leaf.png",
        "g4_particle_minus.png",
        "g4_particle_ring.png",
        "g4_particle_sbubble.png",
        "g4_particle_smoke.png",
        "g4_particle_spark.png",
        "g4_particle_sun.png",
        "g4_particle_tornado.png",
        "g4_particle_whitespot.png",
        "g4_particle_x.png",
        "g4_particle_yellowlight.png",
        "gate1.png",
        "gate2.png",
        "ghostanimation.png",
        "ghostshadow.png",
        "graal2002letters.png",
        "gralats.png",
        "hat0.png",
        "hat1.png",
        "hat2.png",
        "haticon.png",
        "head0.png",
        "head19.png",
        "head23.png",
        "headnpc.png",
        "khairs0.png",
        "khead0.png",
        "klegs0.png",
        "kmarms100.png",
        "kmbody100.png",
        "lamps_wood.png",
        "letters.png",
        "light2.png",
        "opps.png",
        "pics1.png",
        "ride.png",
        "ride2.png",
        "ride3.png",
        "shield1.png",
        "shield2.png",
        "shield3.png",
        "skip_icon.png",
        "skip.png",
        "sprites.png",
        "state.png",
        "sword1.png",
        "treeview_foldericons.png",
        "tutorial_arrowdown.png"
    ];

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
                    if (lowerHref.endsWith('.png') || lowerHref.endsWith('.gif') || lowerHref.endsWith('.jpg') || lowerHref.endsWith('.jpeg') || lowerHref.endsWith('.bmp')) {
                        imageFiles.push(href);
                    }
                }
            }
        }
    } catch (e) {
        console.warn('Dynamic image loading failed, using fallback list');
    }

    if (imageFiles.length === 0) {
        imageFiles = fallbackImages;
    }

    for (const fileName of imageFiles) {
        if (!imageLibrary.has(fileName.toLowerCase())) {
            try {
                const img = new Image();
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = () => reject(new Error(`Image ${fileName} not found`));
                    img.src = `images/${fileName}`;
                });
                imageLibrary.set(fileName.toLowerCase(), img);
            } catch (e) {
            }
        }
    }
}

function redraw() {
    const ctx = mainCtx;
    const width = mainCanvas.width / dpr;
    const height = mainCanvas.height / dpr;
    ctx.clearRect(0, 0, mainCanvas.width / dpr, mainCanvas.height / dpr);
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
    if (!currentAnimation) {
        drawTimeline();
        return;
    }
    const scale = zoomFactors[zoomLevel] || 1.0;
    ctx.save();
    ctx.translate(width / 2 + panX, height / 2 + panY);
    ctx.scale(scale, scale);
    drawGrid(ctx);
    const frame = currentAnimation.getFrame(currentFrame);
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
    if (insertPiece) {
        const sprite = currentAnimation.getAniSprite(insertPiece.spriteIndex, insertPiece.spriteName);
        if (sprite) {
            const rect = mainCanvas.getBoundingClientRect();
            const zoom = zoomFactors[zoomLevel] || 1.0;
            const mouseX = (lastMouseX || 0) - rect.left;
            const mouseY = (lastMouseY || 0) - rect.top;
            const worldX = (mouseX - panX - width / 2) / zoom;
            const worldY = (mouseY - panY - height / 2) / zoom;
            insertPiece.xoffset = Math.floor(0.5 + worldX - insertPiece.dragOffset.x);
            insertPiece.yoffset = Math.floor(0.5 + worldY - insertPiece.dragOffset.y);
            drawSprite(ctx, sprite, insertPiece.xoffset, insertPiece.yoffset);
        }
    }
    ctx.restore();
    drawTimeline();
    if (editingSprite) drawSpritePreview();
    if (isBoxSelecting && boxSelectStart) {
        const rect = mainCanvas.getBoundingClientRect();
        const zoom = zoomFactors[zoomLevel] || 1.0;
        const mouseX = (lastMouseX || 0) - rect.left;
        const mouseY = (lastMouseY || 0) - rect.top;
        const screenX1 = boxSelectStart.x * zoom + width / 2 + panX;
        const screenY1 = boxSelectStart.y * zoom + height / 2 + panY;
        const screenX2 = mouseX;
        const screenY2 = mouseY;
        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(Math.min(screenX1, screenX2), Math.min(screenY1, screenY2), Math.abs(screenX2 - screenX1), Math.abs(screenY2 - screenY1));
        ctx.setLineDash([]);
    }
    if (insertPiece) {
        mainCanvas.style.cursor = "crosshair";
    } else {
        mainCanvas.style.cursor = "default";
    }
}

function drawFrame(ctx, frame, dir) {
    if (!frame) return;
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
                    ctx.strokeStyle = "#00ff00";
                    ctx.lineWidth = 2;
                    const bb = piece.getBoundingBox(currentAnimation);
                    ctx.strokeRect(bb.x - 2, bb.y - 2, bb.width + 4, bb.height + 4);
                }
                ctx.save();
                ctx.translate(piece.xoffset, piece.yoffset);
                if (piece.rotation !== 0 || piece.xscale !== 1 || piece.yscale !== 1) {
                    const spriteSize = piece.getSize(currentAnimation);
                    ctx.translate(spriteSize.width / 2, spriteSize.height / 2);
                    ctx.scale(piece.xscale, piece.yscale);
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
            ctx.fillStyle = isSelected ? "#00ff00" : "#ffcc00";
            ctx.font = "900 16px 'Font Awesome 6 Free'";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("\uf028", sound.xoffset, sound.yoffset);
        }
    }
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
        timelineCtx.fillStyle = "#353535";
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
    timelineCtx.fillStyle = "#353535";
    timelineCtx.fillRect(0, 0, width, height);
    if (currentAnimation.frames.length === 0) return;
    const headerHeight = 20;
    const buttonHeight = 96;
    let totalTime = 0;
    for (const frame of currentAnimation.frames) totalTime += frame.duration;
    let x = 2;
    timelineCtx.font = "12px Arial";
    timelineCtx.textAlign = "center";
    timelineCtx.textBaseline = "top";
    const minFrameWidth = 48;
    const pixelsPerMs = 1;
    let totalTimelineWidth = 2;
    for (let i = 0; i < currentAnimation.frames.length; i++) {
        const frame = currentAnimation.frames[i];
        const frameWidth = Math.max(frame.duration * pixelsPerMs, minFrameWidth);
        totalTimelineWidth += frameWidth;
    }
    timelineTotalWidth = totalTimelineWidth;

    const visibleStartX = timelineScrollX;
    const visibleEndX = timelineScrollX + width;

    let currentX = 2 - timelineScrollX;
    for (let i = 0; i < currentAnimation.frames.length; i++) {
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
        timelineCtx.fillStyle = selected ? "#006400" : "#8b0000";
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
        timelineCtx.strokeStyle = "#000000";
        timelineCtx.lineWidth = 1;
        timelineCtx.stroke();
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
        timelineCtx.fillText(String(i), x + frameWidth / 2, headerHeight + 1);
        timelineCtx.fillText(`${frame.duration} ms`, x + frameWidth / 2, headerHeight + buttonHeight - 16);
        if (selected) {
            timelineCtx.strokeStyle = "#000000";
            timelineCtx.lineWidth = 1;
            timelineCtx.strokeRect(x, headerHeight + 0.5, frameWidth, buttonHeight);
        }
        currentX += frameWidth;
    }
    const startX = Math.floor(-2 / 50) * 50;
    timelineCtx.fillStyle = "#808080";
    timelineCtx.fillRect(-2, 0, width + 4, headerHeight);
    for (let time = startX; time <= width + 100; time += 50) {
        const timeStr = (time / 1000.0).toFixed(3);
        const textWidth = timelineCtx.measureText(timeStr).width;
        timelineCtx.strokeStyle = "#e0e0e0";
        timelineCtx.lineWidth = 1;
        timelineCtx.beginPath();
        timelineCtx.moveTo(time, 11);
        timelineCtx.lineTo(time, headerHeight - 1);
        timelineCtx.stroke();
        timelineCtx.fillStyle = "#ffffff";
        timelineCtx.font = "11px Arial";
        if (time + textWidth / 2 <= width) {
            timelineCtx.fillText(timeStr, time, 1);
        }
    }
    if (isPlaying) {
        const pos = Math.min(playPosition, totalTime);
        timelineCtx.fillStyle = "#0000ff";
        timelineCtx.beginPath();
        timelineCtx.moveTo(pos - 5, 21);
        timelineCtx.lineTo(pos, 11);
        timelineCtx.lineTo(pos + 5, 21);
        timelineCtx.closePath();
        timelineCtx.fill();
    }

    if (timelineTotalWidth > width) {
        const scrollbarHeight = 8;
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
    previewCtx.fillStyle = "#353535";
    previewCtx.fillRect(0, 0, width, height);
    const scale = Math.pow(1.2, spritePreviewZoom - 3);
    previewCtx.save();
    previewCtx.translate(width / 2, height / 2);
    previewCtx.scale(scale, scale);
    drawSprite(previewCtx, editingSprite, -editingSprite.width / 2, -editingSprite.height / 2);
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
                console.log(`Loaded STRETCHXEFFECT for sprite ${words[1]}: ${sprite.xscale}`);
            }
        } else if (word1 === "STRETCHYEFFECT" && words.length >= 3) {
            const sprite = ani.getAniSprite(parseInt(words[1]), "");
            if (sprite) {
                sprite.yscale = parseFloat(words[2]) || 1.0;
                sprite.updateBoundingBox();
                console.log(`Loaded STRETCHYEFFECT for sprite ${words[1]}: ${sprite.yscale}`);
            }
        } else if (word1 === "ROTATEEFFECT" && words.length >= 3) {
            const sprite = ani.getAniSprite(parseInt(words[1]), "");
            if (sprite) {
                sprite.rotation = parseFloat(words[2]) * 180 / Math.PI;
                sprite.updateBoundingBox();
                console.log(`Loaded ROTATEEFFECT for sprite ${words[1]}: ${sprite.rotation}`);
            }
        } else if ((word1 === "ATTACHSPRITE" || word1 === "ATTACHSPRITE2") && words.length >= 5) {
            const behind = word1 === "ATTACHSPRITE2";
            const parent = ani.getAniSprite(parseInt(words[1]), "");
            if (parent) {
                const attach = {index: parseInt(words[2]), offset: {x: parseFloat(words[3]), y: parseFloat(words[4])}};
            if (behind) {
                parent.attachedSprites.splice(parent.m_drawIndex, 0, attach);
                parent.m_drawIndex++;
            } else parent.attachedSprites.push(attach);
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
                console.log(`Loaded ZOOMEFFECT for sprite ${words[1]}: ${sprite.xscale}`);
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
        if (sprite.xscale === sprite.yscale && sprite.xscale !== 1.0) {
            otherCommands.push(`ZOOMEFFECT ${String(sprite.index).padStart(4)} ${sprite.xscale}`);
            console.log(`Saving ZOOMEFFECT for sprite ${sprite.index}: ${sprite.xscale}`);
        } else {
            if (sprite.xscale !== 1.0) {
                otherCommands.push(`STRETCHXEFFECT ${String(sprite.index).padStart(4)} ${sprite.xscale}`);
                console.log(`Saving STRETCHXEFFECT for sprite ${sprite.index}: ${sprite.xscale}`);
            }
            if (sprite.yscale !== 1.0) {
                otherCommands.push(`STRETCHYEFFECT ${String(sprite.index).padStart(4)} ${sprite.yscale}`);
                console.log(`Saving STRETCHYEFFECT for sprite ${sprite.index}: ${sprite.yscale}`);
            }
        }
        if (sprite.rotation !== 0.0) {
            otherCommands.push(`ROTATEEFFECT ${String(sprite.index).padStart(4)} ${sprite.rotation * Math.PI / 180}`);
            console.log(`Saving ROTATEEFFECT for sprite ${sprite.index}: ${sprite.rotation}`);
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

function loadImage(file) {
    return new Promise((resolve, reject) => {
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
    });
}

function updateSpritesList() {
    const list = document.getElementById("spritesList");
    list.innerHTML = "";
    if (!currentAnimation) return;
    const sortedSprites = Array.from(currentAnimation.sprites.values()).sort((a, b) => a.index - b.index);
    if (!editingSprite && sortedSprites.length > 0) {
        editingSprite = sortedSprites[0];
        updateSpriteEditor();
    }
    for (const sprite of sortedSprites) {
        const item = document.createElement("div");
        item.className = "sprite-item";
        if (editingSprite === sprite) item.classList.add("selected");
        item.onclick = () => {
            selectSprite(sprite);
            insertPiece = new FramePieceSprite();
            insertPiece.spriteIndex = sprite.index;
            insertPiece.spriteName = String(sprite.index);
            insertPiece.xoffset = -5000;
            insertPiece.yoffset = -5000;
            insertPiece.dragOffset = {x: (sprite.width * sprite.xscale) / 2, y: (sprite.height * sprite.yscale) / 2};
            redraw();
        };
        item.ondblclick = () => editSprite(sprite);
        item.oncontextmenu = (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            showSpriteContextMenu(e, sprite);
        };
        item.draggable = true;
        item.ondragstart = (e) => {
            e.dataTransfer.setData("spriteIndex", sprite.index);
        };
        const canvas = document.createElement("canvas");
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
        const itemCtx = canvas.getContext("2d");
        itemCtx.imageSmoothingEnabled = false;
        if (img && sprite.width > 0 && sprite.height > 0) {
            itemCtx.drawImage(img, sprite.left, sprite.top, sprite.width, sprite.height, 0, 0, canvas.width, canvas.height);
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
        spritesList.oncontextmenu = (e) => {
            if (e.target === spritesList || e.target.parentElement === spritesList) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                showSpritesListContextMenu(e);
            }
        };
    }
}

function selectSprite(sprite) {
    editingSprite = sprite;
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
    const spriteLeft = document.getElementById("spriteLeft");
    const spriteTop = document.getElementById("spriteTop");
    const spriteWidth = document.getElementById("spriteWidth");
    const spriteHeight = document.getElementById("spriteHeight");
    const colorEffect = document.getElementById("colorEffect");
    const colorSwatch = document.getElementById("colorSwatch");

    spriteEditPanel.style.display = "block";
    spriteID.value = editingSprite.index;
    spriteSource.value = editingSprite.type;
    spriteImage.value = editingSprite.customImageName;
    spriteComment.value = editingSprite.comment;
    const xscale = editingSprite.xscale !== undefined ? editingSprite.xscale : 1.0;
    const yscale = editingSprite.yscale !== undefined ? editingSprite.yscale : 1.0;
    const rotation = editingSprite.rotation !== undefined ? editingSprite.rotation : 0.0;
    if (editingSprite.xscale === undefined) editingSprite.xscale = 1.0;
    if (editingSprite.yscale === undefined) editingSprite.yscale = 1.0;
    if (editingSprite.rotation === undefined) editingSprite.rotation = 0.0;
    xScale.value = xscale;
    xScaleSlider.value = xscale;
    yScale.value = yscale;
    yScaleSlider.value = yscale;
    rotationEl.value = rotation;
    rotationSlider.value = rotation;
    spriteLeft.value = editingSprite.left;
    spriteTop.value = editingSprite.top;
    spriteWidth.value = editingSprite.width;
    spriteHeight.value = editingSprite.height;
    colorEffect.checked = editingSprite.colorEffectEnabled;
    if (colorSwatch && editingSprite.colorEffect) {
        const c = editingSprite.colorEffect;
        const hex = `#${[c.r, c.g, c.b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
        colorSwatch.value = hex;
    }
    editingSprite.updateBoundingBox();
}

function updateItemsCombo() {
    const combo = document.getElementById("itemsCombo");
    const frame = currentAnimation ? currentAnimation.getFrame(currentFrame) : null;
    const selectedId = selectedPieces.size === 1 ? Array.from(selectedPieces)[0] : combo ? combo.value : null;
    if (combo) combo.innerHTML = '<option value="">(none)</option>';
    if (frame) {
        const actualDir = getDirIndex(currentDir);
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
    updateItemSettings();
}

function updateItemSettings() {
    const combo = document.getElementById("itemsCombo");
    const frame = currentAnimation ? currentAnimation.getFrame(currentFrame) : null;
    const actualDir = getDirIndex(currentDir);
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
    } else {
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
        if (piece.xscale === undefined) piece.xscale = 1.0;
        if (piece.yscale === undefined) piece.yscale = 1.0;
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
        return;
    }
    document.getElementById("frameCount").textContent = `${currentFrame + 1}/${currentAnimation.frames.length || 1}`;
    const totalDuration = currentAnimation.frames.reduce((sum, f) => sum + f.duration, 0);
    document.getElementById("totalDuration").textContent = (totalDuration / 1000).toFixed(2) + "s";
    document.getElementById("timelineSlider").max = Math.max(0, currentAnimation.frames.length - 1);
    document.getElementById("timelineSlider").value = currentFrame;
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
                input.style.background = "transparent";
                input.style.border = "1px solid #777";
                input.style.color = "#e0e0e0";
                input.style.width = "100%";
                input.style.outline = "none";
                input.onkeydown = (e) => {
                    if (e.key === "Enter") {
                        finishEditing();
                    } else if (e.key === "Escape") {
                        cancelEditing();
                    }
                };
                input.onblur = finishEditing;
                input.onclick = (e) => e.stopPropagation();
                input.focus();
                input.select();
                li.style.userSelect = "text";
                li.appendChild(input);
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
            renderSoundItem();
        }

        function cancelEditing() {
            isEditing = false;
            li.style.userSelect = "none";
            renderSoundItem();
        }
        let clickCount = 0;
        let clickTimer = null;
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
    document.getElementById("singleDir").checked = currentAnimation.singleDir;
    document.getElementById("looped").checked = currentAnimation.looped;
    document.getElementById("continous").checked = currentAnimation.continous;
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
    historyGroup.style.display = "block";
    historyList.innerHTML = "";
    for (let i = undoStack.length - 1; i >= 0; i--) {
        const item = document.createElement("div");
        item.style.padding = "2px 4px";
        item.style.cursor = "pointer";
        item.style.opacity = i > undoIndex ? "0.5" : "1";
        item.style.backgroundColor = i === undoIndex ? "#4472C4" : "transparent";
        let displayText = undoStack[i].description || `Action ${i + 1}`;
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
            while (undoIndex < i && undoIndex < undoStack.length - 1) {
                undoIndex++;
                const cmd = undoStack[undoIndex];
                if (cmd && cmd.redo && typeof cmd.redo === 'function') {
                    cmd.redo();
                } else if (cmd && cmd.newState) {
                    restoreAnimationState(cmd.newState);
                }
            }
            while (undoIndex > i && undoIndex >= 0) {
                const cmd = undoStack[undoIndex];
                if (cmd && cmd.undo && typeof cmd.undo === 'function') {
                    cmd.undo();
                } else if (cmd && cmd.oldState) {
                    restoreAnimationState(cmd.oldState);
                }
                undoIndex--;
            }
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
        btnHistoryClear.disabled = undoStack.length === 0;
        btnHistoryClear.onclick = undoStack.length > 0 ? () => showConfirmDialog("Are you sure you want to clear all undo/redo history? This action cannot be undone.", (confirmed) => {
            if (confirmed) {
                undoStack = [];
                undoIndex = -1;
                updateHistoryMenu();
                saveUndoStack();
            }
        }) : null;
    }
    if (btnToolbarUndo) btnToolbarUndo.disabled = undoIndex < 0;
    if (btnToolbarRedo) btnToolbarRedo.disabled = undoIndex >= undoStack.length - 1;
}

function addUndoCommand(command) {
    undoStack = undoStack.slice(0, undoIndex + 1);
    undoStack.push(command);
    if (undoStack.length > maxUndo) {
        undoStack.shift();
    } else {
        undoIndex++;
    }
    updateHistoryMenu();
    saveUndoStack();
}

function undo() {
    if (undoIndex >= 0 && undoStack[undoIndex]) {
        const cmd = undoStack[undoIndex];
        f12Log(`Undo: ${cmd.description}, has undo function: ${!!cmd.undo}, has oldState: ${!!cmd.oldState}`);
        if (cmd.oldState) {
            restoreAnimationState(cmd.oldState);
        } else if (cmd.undo && typeof cmd.undo === 'function') {
            cmd.undo();
        }
        undoIndex--;
        redraw();
        updateFrameInfo();
        updateSpritesList();
        updateHistoryMenu();
        saveUndoStack();
    }
}

function redo() {
    if (undoIndex < undoStack.length - 1 && undoStack[undoIndex + 1]) {
        undoIndex++;
        const cmd = undoStack[undoIndex];
        f12Log(`Redo: ${cmd.description}, has redo function: ${!!cmd.redo}, has newState: ${!!cmd.newState}`);
        if (cmd.newState) {
            restoreAnimationState(cmd.newState);
        } else if (cmd.redo && typeof cmd.redo === 'function') {
            cmd.redo();
        }
        redraw();
        updateFrameInfo();
        updateSpritesList();
        updateHistoryMenu();
        saveUndoStack();
    }
}

function serializeAnimationState() {
    if (!currentAnimation) return null;
    return JSON.parse(JSON.stringify({
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
            rotation: s.rotation,
            colorEffectEnabled: s.colorEffectEnabled,
            colorEffect: s.colorEffect ? {...s.colorEffect} : {r: 255, g: 255, b: 255, a: 255},
            attachedSprites: (s.attachedSprites || []).map(a => ({
                index: a.index,
                offset: a.offset ? {...a.offset} : {x: 0, y: 0}
            })),
            m_drawIndex: s.m_drawIndex || 0
        })),
        currentFrame: currentFrame
    }));
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
        sprite.rotation = sData.rotation !== undefined ? sData.rotation : 0.0;
        sprite.colorEffectEnabled = sData.colorEffectEnabled || false;
        sprite.colorEffect = sData.colorEffect ? {...sData.colorEffect} : {r: 255, g: 255, b: 255, a: 255};
        sprite.attachedSprites = sData.attachedSprites || [];
        sprite.m_drawIndex = sData.m_drawIndex || 0;
        sprite.updateBoundingBox();
        currentAnimation.sprites.set(sprite.index, sprite);
    });
    currentFrame = Math.min(state.currentFrame || 0, currentAnimation.frames.length - 1);
    const selectedPieceIds = Array.from(selectedPieces).map(p => p.id).filter(id => id);
    selectedPieces.clear();
    if (selectedPieceIds.length > 0) {
        const frame = currentAnimation.getFrame(currentFrame);
        if (frame) {
            const actualDir = getDirIndex(currentDir);
            const pieces = frame.pieces[actualDir] || [];
            for (const pieceId of selectedPieceIds) {
                const piece = pieces.find(p => p.id === pieceId);
                if (piece) {
                    selectedPieces.add(piece);
                }
            }
        }
    }
    editingSprite = null;
    if (currentAnimation.sprites.size > 0) {
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
        const undoData = {
            animationIndex: animations.indexOf(currentAnimation),
            undoIndex: undoIndex,
            commands: undoStack.map(cmd => ({
                description: cmd.description,
                oldState: cmd.oldState || null,
                newState: cmd.newState || null
            }))
        };
        localStorage.setItem("ganiEditorUndoStack", JSON.stringify(undoData));
    } catch (e) {
        console.error("Failed to save undo stack:", e);
    }
}

function restoreUndoStack() {
    if (!currentAnimation) return;
    try {
        const undoDataStr = localStorage.getItem("ganiEditorUndoStack");
        if (!undoDataStr) return;
        const undoData = JSON.parse(undoDataStr);
        if (undoData.animationIndex !== animations.indexOf(currentAnimation)) {
            undoStack = [];
            undoIndex = -1;
            return;
        }
        undoStack = undoData.commands.filter(cmdData => cmdData.oldState && cmdData.newState).map(cmdData => {
            const oldState = cmdData.oldState;
            const newState = cmdData.newState;
            return {
                description: cmdData.description,
                oldState: oldState,
                newState: newState,
                undo: () => {
                    f12Log(`Restore undo: ${cmdData.description}`);
                    restoreAnimationState(oldState);
                },
                redo: () => {
                    f12Log(`Restore redo: ${cmdData.description}`);
                    restoreAnimationState(newState);
                }
            };
        });
        undoIndex = Math.min(undoData.undoIndex || -1, undoStack.length - 1);
        updateHistoryMenu();
    } catch (e) {
        console.error("Failed to restore undo stack:", e);
        undoStack = [];
        undoIndex = -1;
    }
}

function initNewAnimation() {
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

function switchTab(index) {
    if (index < 0 || index >= animations.length) return;
    currentTabIndex = index;
    currentAnimation = animations[index];
    f12Log(`switchTab to index ${index}, animation defaults: ` + JSON.stringify(Array.from(currentAnimation.defaultImages.entries())));
    currentFrame = 0;
    selectedPieces.clear();
    updateTabs();
    updateUIVisibility();
    updateHistoryMenu();
    redraw();
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
    animations.splice(index, 1);
    if (animations.length === 0) {
        currentAnimation = null;
        currentTabIndex = -1;
        currentFrame = 0;
        selectedPieces.clear();
        updateTabs();
        updateUIVisibility();
        redraw();
        updateFrameInfo();
        updateSpritesList();
        updateAnimationSettings();
        updateDefaultsTable();
        drawTimeline();
    } else {
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

function updateTabs() {
    const container = document.getElementById("tabsContainer");
    container.innerHTML = "";
    for (let i = 0; i < animations.length; i++) {
        const tab = document.createElement("div");
        tab.className = "tab" + (i === currentTabIndex ? " active" : "");
        tab.textContent = animations[i].fileName || `Animation ${i + 1}`;
        tab.onclick = () => switchTab(i);
        const close = document.createElement("span");
        close.className = "tab-close";
        close.innerHTML = "×";
        close.onclick = (e) => {
            e.stopPropagation();
            closeTab(i);
        };
        tab.appendChild(close);
        container.appendChild(tab);
    }
}

let saveSessionDebounceTimer = null;
function saveSession(immediate = false) {
    console.log(`saveSession called with immediate=${immediate}`);
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
            if (document.getElementById("btnSwapKeys")) {
                document.getElementById("btnSwapKeys").classList.toggle("active", keysSwapped);
            }
        }
        undoStack = session.undoStack || [];
        undoIndex = session.undoIndex !== undefined ? session.undoIndex : -1;
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
            updateTabs();
            updateUIVisibility();
            updateSpritesList();
            updateDefaultsTable();
            updateSoundsList();
            drawTimeline();
            updateFrameInfo();
            restoreUndoStack();
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
    saveSession(true);
});
setInterval(() => {
    if (animations.length > 0) {
        saveSession(true);
    }
}, 10000);
window.addEventListener("load", async () => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    await loadLocalImages();
    await refreshLocalFileCache();
    resizeCanvas();
    const restored = await restoreSession();
    if (!restored) {
        if (animations.length === 0) {
            initNewAnimation();
        }
        updateTabs();
        updateUIVisibility();
    } else {
        updateUIVisibility();
    }
    if (currentAnimation) {
        resizeCanvas();
        setTimeout(() => {
            resizeCanvas();
            drawTimeline();
            updateFrameInfo();
            const timelineContainer = document.querySelector(".timeline-container");
            const timelineView = document.querySelector(".timeline-view");
            const canvas = document.getElementById("timelineCanvas");
            if (timelineContainer) {
                timelineContainer.style.display = "flex";
                timelineContainer.style.visibility = "visible";
                timelineContainer.style.opacity = "1";
                timelineContainer.style.height = "192px";
                timelineContainer.style.flex = "0 0 192px";
                timelineContainer.style.minHeight = "100px";
                const timelineHeader = document.querySelector(".timeline-header");
                const playbackControls = document.querySelector(".playback-controls");
                setTimeout(() => {
                }, 100);
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
                canvas.style.position = "relative";
                canvas.style.zIndex = "1";
            }
        }, 200);
    }
    const spriteList = document.getElementById("spritesList");
    const spriteEditPanel = document.getElementById("spriteEditPanel");
    const spriteSplitterHandle = document.getElementById("spriteSplitterHandle");
    if (spriteList && spriteEditPanel && spriteSplitterHandle) {
        spriteList.style.height = "300px";
        spriteSplitterHandle.onmousedown = (e) => {
            spriteSplitterDragging = true;
            e.preventDefault();
        };
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
        document.addEventListener("mouseup", () => {
            spriteSplitterDragging = false;
        });
    }
    const leftCenterSplitter = document.getElementById("leftCenterSplitter");
    const leftPanel = document.querySelector(".left-panel");
    const centerPanel = document.querySelector(".center-panel");
    if (leftCenterSplitter && leftPanel && centerPanel) {
        leftPanel.style.width = "300px";
        leftCenterSplitter.onmousedown = (e) => {
            leftCenterSplitterDragging = true;
            e.preventDefault();
        };
    }
    const centerRightSplitter = document.getElementById("centerRightSplitter");
    const rightPanel = document.querySelector(".right-panel");
    if (centerRightSplitter && centerPanel && rightPanel) {
        rightPanel.style.width = "250px";
        centerRightSplitter.onmousedown = (e) => {
            centerRightSplitterDragging = true;
            e.preventDefault();
        };
    }
    const canvasTimelineSplitter = document.getElementById("canvasTimelineSplitter");
    const timelineContainer = document.querySelector(".timeline-container");
    if (canvasTimelineSplitter && timelineContainer) {
        canvasTimelineSplitter.onmousedown = (e) => {
            canvasTimelineSplitterDragging = true;
            e.preventDefault();
        };
    }
    document.addEventListener("mousemove", (e) => {
        if (leftCenterSplitterDragging && leftPanel && centerPanel) {
            const rect = leftPanel.parentElement.getBoundingClientRect();
            const newWidth = e.clientX - rect.left;
            if (newWidth >= 200 && newWidth <= 800) {
                leftPanel.style.width = newWidth + "px";
                const centerWidth = mainSplitter.clientWidth - leftPanel.offsetWidth - rightPanel.offsetWidth;
                const dpr = window.devicePixelRatio || 1;
                mainCanvas.width = centerWidth * dpr;
                mainCanvas.style.width = centerWidth + "px";
                mainCanvas.style.left = leftPanel.offsetWidth + "px";
                const canvasControls = document.querySelector(".canvas-controls");
                if (canvasControls) {
                    canvasControls.style.left = leftPanel.offsetWidth + 10 + "px";
                }
                ctx.scale(dpr, dpr);
                redraw();
            }
        } else if (centerRightSplitterDragging && centerPanel && rightPanel) {
            const rect = rightPanel.parentElement.getBoundingClientRect();
            const newRightWidth = rect.right - e.clientX;
            if (newRightWidth >= 200 && newRightWidth <= 800) {
                rightPanel.style.width = newRightWidth + "px";
                const centerWidth = mainSplitter.clientWidth - leftPanel.offsetWidth - rightPanel.offsetWidth;
                const dpr = window.devicePixelRatio || 1;
                mainCanvas.width = centerWidth * dpr;
                mainCanvas.style.width = centerWidth + "px";
                mainCanvas.style.left = leftPanel.offsetWidth + "px";
                const canvasControls = document.querySelector(".canvas-controls");
                if (canvasControls) {
                    canvasControls.style.left = leftPanel.offsetWidth + 10 + "px";
                }
                ctx.scale(dpr, dpr);
                redraw();
            }
        } else if (canvasTimelineSplitterDragging && timelineContainer) {
            const contentArea = document.querySelector(".content-area");
            const rect = contentArea.getBoundingClientRect();
            const newTimelineHeight = rect.bottom - e.clientY;
            if (newTimelineHeight >= 100 && newTimelineHeight <= 400) {
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
    document.addEventListener("mouseup", () => {
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
    document.getElementById("btnOpen").onclick = () => {
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

                if (localFileCache.ganis && localFileCache.ganis.length > 0) {
                    files = localFileCache.ganis.filter(file => file.endsWith('.gani')).map(file => file.split('/').pop());
                } else {
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
                    }]
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
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
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
        showConfirmDialog("Reset the editor to default state? This will reset zoom, pan, selections, and UI layout.", (confirmed) => {
            if (confirmed) {
                zoomLevel = 3;
                panX = 0;
                panY = 0;
                backgroundColor = "#006400";
                const leftPanel = document.querySelector(".left-panel");
                const rightPanel = document.querySelector(".right-panel");
                const timelineContainer = document.querySelector(".timeline-container");
                const spriteList = document.querySelector(".sprite-list");
                if (leftPanel) leftPanel.style.width = "300px";
                if (rightPanel) rightPanel.style.width = "250px";
                if (timelineContainer) timelineContainer.style.height = "192px";
                if (spriteList) spriteList.style.height = "300px";
                selectedPieces.clear();
                currentFrame = 0;
                currentDir = 2;
                isPlaying = false;
                undoStack = [];
                undoIndex = -1;
                localStorage.setItem("mainCanvasZoom", zoomLevel);
                updateTabs();
                updateItemsCombo();
                updateItemSettings();
                updateSoundsList();
                redraw();
                updateUIVisibility();
                updateFrameInfo();
                updateSpritesList();
                updateDefaultsTable();
                saveSession();
            }
        });
    };
    document.getElementById("directionCombo").onchange = (e) => {
        currentDir = ["UP", "LEFT", "DOWN", "RIGHT"].indexOf(e.target.value);
        selectedPieces.clear();
        redraw();
        updateItemsCombo();
    };
    document.getElementById("itemsCombo").onchange = () => updateItemSettings();
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
    const itemXScaleEl = document.getElementById("itemXScale");
    const itemXScaleSliderEl = document.getElementById("itemXScaleSlider");
    if (itemXScaleEl) {
        itemXScaleEl.onchange = (e) => {
            const pieceId = document.getElementById("itemsCombo").value;
            const frame = currentAnimation.getFrame(currentFrame);
            if (frame && pieceId) {
                const actualDir = getDirIndex(currentDir);
                const pieces = frame.pieces[actualDir] || [];
                const piece = pieces.find(p => p.id === pieceId);
                if (piece) {
                    const oldState = serializeAnimationState();
                    piece.xscale = parseFloat(e.target.value) || 1.0;
                    if (itemXScaleSliderEl) itemXScaleSliderEl.value = piece.xscale;
                    const newState = serializeAnimationState();
                    const sprite = currentAnimation.getAniSprite(piece.spriteIndex, piece.spriteName || "");
                    const spriteName = sprite && sprite.comment ? `"${sprite.comment}"` : `Sprite ${piece.spriteIndex}`;
                    addUndoCommand({
                        description: `Change ${spriteName} X Scale`,
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
    }
    if (itemXScaleSliderEl) {
        itemXScaleSliderEl.oninput = (e) => {
            const pieceId = document.getElementById("itemsCombo").value;
            const frame = currentAnimation.getFrame(currentFrame);
            if (frame && pieceId) {
                const actualDir = getDirIndex(currentDir);
                const pieces = frame.pieces[actualDir] || [];
                const piece = pieces.find(p => p.id === pieceId);
                if (piece) {
                    piece.xscale = parseFloat(e.target.value) || 1.0;
                    if (itemXScaleEl) itemXScaleEl.value = piece.xscale;
                    redraw();
                    saveSession();
                }
            }
        };
        itemXScaleSliderEl.onchange = (e) => {
            const pieceId = document.getElementById("itemsCombo").value;
            const frame = currentAnimation.getFrame(currentFrame);
            if (frame && pieceId) {
                const actualDir = getDirIndex(currentDir);
                const pieces = frame.pieces[actualDir] || [];
                const piece = pieces.find(p => p.id === pieceId);
                if (piece) {
                    const oldState = serializeAnimationState();
                    piece.xscale = parseFloat(e.target.value) || 1.0;
                    if (itemXScaleEl) itemXScaleEl.value = piece.xscale;
                    const newState = serializeAnimationState();
                    const sprite = currentAnimation.getAniSprite(piece.spriteIndex, piece.spriteName || "");
                    const spriteName = sprite && sprite.comment ? `"${sprite.comment}"` : `Sprite ${piece.spriteIndex}`;
                    addUndoCommand({
                        description: `Change ${spriteName} X Scale`,
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
    }
    const itemYScaleEl = document.getElementById("itemYScale");
    const itemYScaleSliderEl = document.getElementById("itemYScaleSlider");
    if (itemYScaleEl) {
        itemYScaleEl.onchange = (e) => {
            const pieceId = document.getElementById("itemsCombo").value;
            const frame = currentAnimation.getFrame(currentFrame);
            if (frame && pieceId) {
                const actualDir = getDirIndex(currentDir);
                const pieces = frame.pieces[actualDir] || [];
                const piece = pieces.find(p => p.id === pieceId);
                if (piece) {
                    const oldState = serializeAnimationState();
                    piece.yscale = parseFloat(e.target.value) || 1.0;
                    if (itemYScaleSliderEl) itemYScaleSliderEl.value = piece.yscale;
                    const newState = serializeAnimationState();
                    const sprite = currentAnimation.getAniSprite(piece.spriteIndex, piece.spriteName || "");
                    const spriteName = sprite && sprite.comment ? `"${sprite.comment}"` : `Sprite ${piece.spriteIndex}`;
                    addUndoCommand({
                        description: `Change ${spriteName} Y Scale`,
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
    }
    if (itemYScaleSliderEl) {
        itemYScaleSliderEl.oninput = (e) => {
            const val = parseFloat(e.target.value) || 1.0;
            if (itemYScaleEl) itemYScaleEl.value = val;
            const pieceId = document.getElementById("itemsCombo").value;
            const frame = currentAnimation.getFrame(currentFrame);
            if (frame && pieceId) {
                const actualDir = getDirIndex(currentDir);
                const pieces = frame.pieces[actualDir] || [];
                const piece = pieces.find(p => p.id === pieceId);
                if (piece) {
                    piece.yscale = val;
                    redraw();
                    saveSession();
                }
            }
        };
        itemYScaleSliderEl.onchange = (e) => {
            const val = parseFloat(e.target.value) || 1.0;
            if (itemYScaleEl) itemYScaleEl.value = val;
            const pieceId = document.getElementById("itemsCombo").value;
            const frame = currentAnimation.getFrame(currentFrame);
            if (frame && pieceId) {
                const actualDir = getDirIndex(currentDir);
                const pieces = frame.pieces[actualDir] || [];
                const piece = pieces.find(p => p.id === pieceId);
                if (piece) {
                    const oldState = serializeAnimationState();
                    piece.yscale = val;
                    const newState = serializeAnimationState();
                    const sprite = currentAnimation.getAniSprite(piece.spriteIndex, piece.spriteName || "");
                    const spriteName = sprite && sprite.comment ? `"${sprite.comment}"` : `Sprite ${piece.spriteIndex}`;
                    addUndoCommand({
                        description: `Change ${spriteName} Y Scale`,
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
    }
    const itemRotationEl = document.getElementById("itemRotation");
    const itemRotationSliderEl = document.getElementById("itemRotationSlider");
    if (itemRotationEl) {
        itemRotationEl.onchange = (e) => {
            const pieceId = document.getElementById("itemsCombo").value;
            const frame = currentAnimation.getFrame(currentFrame);
            if (frame && pieceId) {
                const actualDir = getDirIndex(currentDir);
                const pieces = frame.pieces[actualDir] || [];
                const piece = pieces.find(p => p.id === pieceId);
                if (piece) {
                    const oldState = serializeAnimationState();
                    piece.rotation = parseFloat(e.target.value) || 0.0;
                    if (itemRotationSliderEl) itemRotationSliderEl.value = piece.rotation;
                    const newState = serializeAnimationState();
                    const sprite = currentAnimation.getAniSprite(piece.spriteIndex, piece.spriteName || "");
                    const spriteName = sprite && sprite.comment ? `"${sprite.comment}"` : `Sprite ${piece.spriteIndex}`;
                    addUndoCommand({
                        description: `Change ${spriteName} Rotation`,
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
    }
    if (itemRotationSliderEl) {
        itemRotationSliderEl.oninput = (e) => {
            const val = parseFloat(e.target.value) || 0.0;
            if (itemRotationEl) itemRotationEl.value = val;
            const pieceId = document.getElementById("itemsCombo").value;
            const frame = currentAnimation.getFrame(currentFrame);
            if (frame && pieceId) {
                const actualDir = getDirIndex(currentDir);
                const pieces = frame.pieces[actualDir] || [];
                const piece = pieces.find(p => p.id === pieceId);
                if (piece) {
                    piece.rotation = val;
                    redraw();
                    saveSession();
                }
            }
        };
        itemRotationSliderEl.onchange = (e) => {
            const val = parseFloat(e.target.value) || 0.0;
            if (itemRotationEl) itemRotationEl.value = val;
            const pieceId = document.getElementById("itemsCombo").value;
            const frame = currentAnimation.getFrame(currentFrame);
            if (frame && pieceId) {
                const actualDir = getDirIndex(currentDir);
                const pieces = frame.pieces[actualDir] || [];
                const piece = pieces.find(p => p.id === pieceId);
                if (piece) {
                    const oldState = serializeAnimationState();
                    piece.rotation = val;
                    const newState = serializeAnimationState();
                    const sprite = currentAnimation.getAniSprite(piece.spriteIndex, piece.spriteName || "");
                    const spriteName = sprite && sprite.comment ? `"${sprite.comment}"` : `Sprite ${piece.spriteIndex}`;
                    addUndoCommand({
                        description: `Change ${spriteName} Rotation`,
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
    }
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
    document.getElementById("btnAddSprite").onclick = () => {
        showAddSpriteDialog();
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
    document.getElementById("xScale").onchange = (e) => {
        if (editingSprite) {
            console.log("xScale onchange triggered, saving session...");
            const oldState = serializeAnimationState();
            editingSprite.xscale = parseFloat(e.target.value) || 1.0;
            document.getElementById("xScaleSlider").value = editingSprite.xscale;
            editingSprite.updateBoundingBox();
            const newState = serializeAnimationState();
            const spriteName = editingSprite.comment ? `"${editingSprite.comment}"` : `Sprite ${editingSprite.index}`;
            addUndoCommand({
                description: `Change ${spriteName} X Scale`,
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
    document.getElementById("xScale").oninput = (e) => {
        if (editingSprite) {
            editingSprite.xscale = parseFloat(e.target.value) || 1.0;
            document.getElementById("xScaleSlider").value = editingSprite.xscale;
            editingSprite.updateBoundingBox();
            redraw();
            drawSpritePreview();
        }
    };
    document.getElementById("xScaleSlider").oninput = (e) => {
        if (editingSprite) {
            editingSprite.xscale = parseFloat(e.target.value) || 1.0;
            document.getElementById("xScale").value = editingSprite.xscale;
            editingSprite.updateBoundingBox();
            redraw();
            drawSpritePreview();
            saveSession(true);
        }
    };
    document.getElementById("xScaleSlider").onchange = (e) => {
        if (editingSprite) {
            const oldState = serializeAnimationState();
            editingSprite.xscale = parseFloat(e.target.value) || 1.0;
            document.getElementById("xScale").value = editingSprite.xscale;
            editingSprite.updateBoundingBox();
            const newState = serializeAnimationState();
            const spriteName = editingSprite.comment ? `"${editingSprite.comment}"` : `Sprite ${editingSprite.index}`;
            addUndoCommand({
                description: `Change ${spriteName} X Scale`,
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
    document.getElementById("yScale").onchange = (e) => {
        if (editingSprite) {
            const oldState = serializeAnimationState();
            editingSprite.yscale = parseFloat(e.target.value) || 1.0;
            document.getElementById("yScaleSlider").value = editingSprite.yscale;
            editingSprite.updateBoundingBox();
            const newState = serializeAnimationState();
            const spriteName = editingSprite.comment ? `"${editingSprite.comment}"` : `Sprite ${editingSprite.index}`;
            addUndoCommand({
                description: `Change ${spriteName} Y Scale`,
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
    document.getElementById("yScale").oninput = (e) => {
        if (editingSprite) {
            editingSprite.yscale = parseFloat(e.target.value) || 1.0;
            document.getElementById("yScaleSlider").value = editingSprite.yscale;
            editingSprite.updateBoundingBox();
            redraw();
            drawSpritePreview();
        }
    };
    document.getElementById("yScaleSlider").oninput = (e) => {
        if (editingSprite) {
            const val = parseFloat(e.target.value) || 1.0;
            editingSprite.yscale = val;
            const yScaleInput = document.getElementById("yScale");
            if (yScaleInput) yScaleInput.value = val;
            editingSprite.updateBoundingBox();
            redraw();
            drawSpritePreview();
            saveSession(true);
        }
    };
    document.getElementById("yScaleSlider").onchange = (e) => {
        if (editingSprite) {
            const oldState = serializeAnimationState();
            const val = parseFloat(e.target.value) || 1.0;
            editingSprite.yscale = val;
            const yScaleInput = document.getElementById("yScale");
            if (yScaleInput) yScaleInput.value = val;
            editingSprite.updateBoundingBox();
            const newState = serializeAnimationState();
            const spriteName = editingSprite.comment ? `"${editingSprite.comment}"` : `Sprite ${editingSprite.index}`;
            addUndoCommand({
                description: `Change ${spriteName} Y Scale`,
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
    document.getElementById("rotation").onchange = (e) => {
        if (editingSprite) {
            const oldState = serializeAnimationState();
            editingSprite.rotation = parseFloat(e.target.value) || 0;
            document.getElementById("rotationSlider").value = editingSprite.rotation;
            editingSprite.updateBoundingBox();
            const newState = serializeAnimationState();
            const spriteName = editingSprite.comment ? `"${editingSprite.comment}"` : `Sprite ${editingSprite.index}`;
            addUndoCommand({
                description: `Change ${spriteName} Rotation`,
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
    document.getElementById("rotation").oninput = (e) => {
        if (editingSprite) {
            editingSprite.rotation = parseFloat(e.target.value) || 0;
            document.getElementById("rotationSlider").value = editingSprite.rotation;
            editingSprite.updateBoundingBox();
            redraw();
            drawSpritePreview();
        }
    };
    document.getElementById("rotationSlider").oninput = (e) => {
        if (editingSprite) {
            const val = parseFloat(e.target.value) || 0;
            editingSprite.rotation = val;
            const rotationInput = document.getElementById("rotation");
            if (rotationInput) rotationInput.value = val;
            editingSprite.updateBoundingBox();
            redraw();
            drawSpritePreview();
            saveSession(true);
        }
    };
    document.getElementById("rotationSlider").onchange = (e) => {
        if (editingSprite) {
            const oldState = serializeAnimationState();
            const val = parseFloat(e.target.value) || 0;
            editingSprite.rotation = val;
            const rotationInput = document.getElementById("rotation");
            if (rotationInput) rotationInput.value = val;
            editingSprite.updateBoundingBox();
            const newState = serializeAnimationState();
            const spriteName = editingSprite.comment ? `"${editingSprite.comment}"` : `Sprite ${editingSprite.index}`;
            addUndoCommand({
                description: `Change ${spriteName} Rotation`,
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
    document.getElementById("colorEffect").onchange = (e) => {
        if (editingSprite) {
            const oldState = serializeAnimationState();
            editingSprite.colorEffectEnabled = e.target.checked;
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
    document.getElementById("colorSwatch").onchange = (e) => {
        if (!editingSprite) return;
        const oldState = serializeAnimationState();
        const hex = e.target.value;
        const r = parseInt(hex.substr(1,2), 16);
        const g = parseInt(hex.substr(3,2), 16);
        const b = parseInt(hex.substr(5,2), 16);
        editingSprite.colorEffect = {r, g, b, a: editingSprite.colorEffect.a || 255};
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
        const frame = currentAnimation.getFrame(currentFrame);
        if (frame) clipboardFrame = frame.duplicate();
    };
    document.getElementById("btnPasteBefore").onclick = () => {
        if (clipboardFrame) {
            currentAnimation.frames.splice(currentFrame, 0, clipboardFrame.duplicate());
            redraw();
            updateFrameInfo();
            saveSession();
        }
    };
    document.getElementById("btnPasteAfter").onclick = () => {
        if (clipboardFrame) {
            currentAnimation.frames.splice(currentFrame + 1, 0, clipboardFrame.duplicate());
            currentFrame++;
            redraw();
            updateFrameInfo();
            saveSession();
        }
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
        currentFrame = parseInt(e.target.value) || 0;
        selectedPieces.clear();
        redraw();
        updateFrameInfo();
    };
    document.getElementById("btnPlay").onclick = () => {
        if (isPlaying) {
            isPlaying = false;
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
        document.getElementById("btnPlay").innerHTML = '<i class="fas fa-play"></i>';
        redraw();
        updateFrameInfo();
    };
    document.getElementById("btnOnionSkin").onclick = (e) => {
        onionSkinEnabled = !onionSkinEnabled;
        e.target.closest("button").classList.toggle("active", onionSkinEnabled);
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
            if (confirmed) {
                undoStack = [];
                undoIndex = -1;
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
    let dragFrame = -1;
    let dragStartX = 0;
    let dragThreshold = 5;
    let isDraggingFrame = false;
    timelineCanvas.onmousemove = (e) => {
        const rect = timelineCanvas.getBoundingClientRect();
        const pos = {x: e.clientX - rect.left, y: e.clientY - rect.top};
        if (pos.y < 20) return;

        if (isDraggingScrollbar && timelineTotalWidth > timelineCanvas.width) {
            const scrollbarWidth = timelineCanvas.width - 4;
            const newScrollX = ((pos.x - 2) / scrollbarWidth) * timelineTotalWidth;
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
        for (let i = 0; i < currentAnimation.frames.length; i++) {
            const frame = currentAnimation.frames[i];
            const frameWidth = Math.max(frame.duration * 1, 48);
            const frameStartX = currentX;
            const frameEndX = currentX + frameWidth;
            const right = frameEndX - 2;

            if (pos.x >= right && pos.x <= right + 4) {
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

        timelineCanvas.style.cursor = isDraggingFrame ? "grabbing" : "default";
    };
    timelineCanvas.onmousedown = (e) => {
        const rect = timelineCanvas.getBoundingClientRect();
        const pos = {x: e.clientX - rect.left, y: e.clientY - rect.top};
        if (pos.y < 20) return;
        if (e.button === 0) {
            if (timelineTotalWidth > timelineCanvas.width) {
                const scrollbarHeight = 8;
                const scrollbarY = timelineCanvas.height - scrollbarHeight - 2;
                if (pos.y >= scrollbarY && pos.y <= scrollbarY + scrollbarHeight) {
                    const scrollbarWidth = timelineCanvas.width - 4;
                    const thumbWidth = Math.max(20, (timelineCanvas.width / timelineTotalWidth) * scrollbarWidth);
                    const thumbX = 2 + ((timelineScrollX / timelineTotalWidth) * scrollbarWidth);

                    if (pos.x >= thumbX && pos.x <= thumbX + thumbWidth) {
                        isDraggingScrollbar = true;
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
                const frameWidth = Math.max(frame.duration * 1, 48);
                const frameStartX = currentX;
                const frameEndX = currentX + frameWidth;

                if (pos.x >= frameStartX + 2 && pos.x <= frameEndX - 4) {
                    dragFrame = i;
                    dragStartX = pos.x;
                    isDraggingFrame = false;
                    if (currentFrame !== i) {
                        currentFrame = i;
                        selectedPieces.clear();
                        redraw();
                        updateFrameInfo();
                        const slider = document.getElementById("timelineSlider");
                        if (slider) slider.value = currentFrame;
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
    timelineCanvas.onmouseup = (e) => {
        if (isDraggingScrollbar) {
            isDraggingScrollbar = false;
            return;
        }

        if (resizeFrame >= 0 && e.button === 0) {
            resizeFrame = -1;
            desiredResizeFrame = -1;
        }

        if (isDraggingFrame && dragFrame >= 0 && e.button === 0) {
            const rect = timelineCanvas.getBoundingClientRect();
            const pos = {x: e.clientX - rect.left, y: e.clientY - rect.top};

            let targetIndex = dragFrame;
            let x = 2;
            for (let i = 0; i < currentAnimation.frames.length; i++) {
                const frame = currentAnimation.frames[i];
                const frameWidth = frame.duration;
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

            if (targetIndex !== dragFrame && targetIndex >= 0 && targetIndex <= currentAnimation.frames.length) {
                const oldState = serializeAnimationState();
                const frameToMove = currentAnimation.frames.splice(dragFrame, 1)[0];
                currentAnimation.frames.splice(targetIndex > dragFrame ? targetIndex - 1 : targetIndex, 0, frameToMove);
                currentFrame = targetIndex > dragFrame ? targetIndex - 1 : targetIndex;

                const newState = serializeAnimationState();
                addUndoCommand({
                    description: "Reorder Frame",
                    oldState: oldState,
                    newState: newState,
                    undo: () => restoreAnimationState(oldState),
                    redo: () => restoreAnimationState(newState)
                });

                redraw();
                updateFrameInfo();
            }
        }

        dragFrame = -1;
        isDraggingFrame = false;
        timelineCanvas.style.cursor = "default";
    };

    let isDraggingScrollbar = false;

    timelineCanvas.onwheel = (e) => {
        e.preventDefault();
        if (timelineTotalWidth > timelineCanvas.width) {
            const scrollSpeed = 50;
            timelineScrollX += e.deltaY > 0 ? scrollSpeed : -scrollSpeed;
            timelineScrollX = Math.max(0, Math.min(timelineTotalWidth - timelineCanvas.width, timelineScrollX));
            drawTimeline();
        }
    };

    document.addEventListener("keydown", (e) => {
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA" || activeElement.tagName === "SELECT" || activeElement.contentEditable === "true")) {
            return;
        }
        if (e.ctrlKey && e.key === "z" && !e.shiftKey) {
            e.preventDefault();
            undo();
        } else if ((e.ctrlKey && e.key === "y") || (e.ctrlKey && e.shiftKey && e.key === "z")) {
            e.preventDefault();
            redo();
        } else if (e.ctrlKey && e.key === "s") {
            e.preventDefault();
            if (currentAnimation) {
                document.getElementById("btnSave").click();
            }
        } else if (e.ctrlKey && e.key === "r") {
            e.preventDefault();
            if (currentAnimation && currentAnimation.fullPath) {
                const fileInput = document.createElement("input");
                fileInput.type = "file";
                fileInput.accept = ".gani";
                fileInput.onchange = async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const text = await file.text();
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
            } else if (currentAnimation && currentAnimation.fileName) {
                const fileInput = document.getElementById("fileInput");
                if (fileInput) {
                    fileInput.click();
                }
            }
        } else if (e.key === "Escape" || e.key === "Esc") {
            e.preventDefault();
            selectedPieces.clear();
            editingSprite = null;
            const combo = document.getElementById("itemsCombo");
            if (combo) combo.value = "";
            updateItemsCombo();
            updateItemSettings();
            updateSpritesList();
            redraw();
        } else if ((e.key === "Delete" || e.key === "Backspace") && selectedPieces.size > 0 && !e.ctrlKey && !e.altKey) {
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
        } else if (e.key === "Tab") {
            e.preventDefault();
            if (!currentAnimation) return;
            const frame = currentAnimation.getFrame(currentFrame);
            if (frame) {
                const actualDir = getDirIndex(currentDir);
                const allPieces = [...frame.pieces[actualDir], ...frame.sounds];
                if (allPieces.length > 0) {
                    let currentIndex = -1;
                    if (selectedPieces.size === 1) {
                        const selected = Array.from(selectedPieces)[0];
                        currentIndex = allPieces.indexOf(selected);
                    }
                    const nextIndex = (currentIndex + 1) % allPieces.length;
                    selectedPieces.clear();
                    selectedPieces.add(allPieces[nextIndex]);
                    updateItemsCombo();
                    redraw();
                }
            }
        } else if (e.key === "Delete") {
            if (!currentAnimation) return;
            const frame = currentAnimation.getFrame(currentFrame);
            if (frame && selectedPieces.size > 0) {
                const actualDir = getDirIndex(currentDir);
                frame.pieces[actualDir] = frame.pieces[actualDir].filter(p => !selectedPieces.has(p));
                selectedPieces.clear();
                redraw();
                updateItemsCombo();
                saveSession();
            }
        } else if (e.key === "+" || e.key === "=") {
            zoomLevel++;
            if (zoomLevel > 10) zoomLevel = 10;
            localStorage.setItem("mainCanvasZoom", zoomLevel);
            redraw();
        } else if (e.key === "-" || e.key === "_") {
            zoomLevel--;
            if (zoomLevel < 0) zoomLevel = 0;
            localStorage.setItem("mainCanvasZoom", zoomLevel);
            redraw();
        } else if (e.key === " ") {
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
    document.getElementById("btnCenterView").onclick = () => {
        panX = 0;
        panY = 0;
        redraw();
    };
    document.getElementById("singleDir").onchange = (e) => {
        currentAnimation.singleDir = e.target.checked;
        if (currentAnimation.singleDir) currentDir = 0;
        redraw();
        updateItemsCombo();
        saveSession();
    };
    document.getElementById("looped").onchange = (e) => {
        currentAnimation.looped = e.target.checked;
        saveSession();
    };
    document.getElementById("continous").onchange = (e) => {
        currentAnimation.continous = e.target.checked;
        saveSession();
    };
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
            console.log(`Imported ${loadedCount} sound files`);
        };
        input.click();
    };
    document.getElementById("btnWorkingDir").onclick = () => {
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
        let loadedCount = 0;
        for (const file of files) {
            if (file.type.startsWith("image/")) {
                try {
                    await loadImage(file);
                    loadedCount++;
                } catch (err) {
                    console.error(`Failed to load ${file.name}:`, err);
                }
            }
        }
        console.log(`Loaded ${loadedCount} images from workspace`);
        refreshAllAnimationsSprites();
        drawSpritePreview();
        redraw();
        updateSpritesList();
        saveSession();
    };
    document.getElementById("btnImportSprites").onclick = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".gani";
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                const text = await file.text();
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
                updateSpritesList();
                updateDefaultsTable();
                redraw();
                showAlertDialog(`Imported ${importedCount} sprite(s)`);
            } catch (err) {
                console.error("Import error:", err);
                showAlertDialog("Failed to import sprites: " + err.message);
            }
        };
        input.click();
    };
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
        navigator.clipboard.writeText(JSON.stringify(data));
    };
    document.getElementById("btnPasteSprite").onclick = async () => {
        try {
            const text = await navigator.clipboard.readText();
            const data = JSON.parse(text);
            if (data.type !== "sprite") return;
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
    };
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
    bgColorInput.type = "color";
    bgColorInput.value = backgroundColor;
    bgColorInput.style.width = "60px";
    bgColorInput.style.height = "24px";
    bgColorInput.style.border = "1px solid #777";
    bgColorInput.style.cursor = "pointer";
    bgColorInput.style.flexShrink = "0";
    bgColorInput.style.padding = "0";
    bgColorInput.onchange = (e) => {
        backgroundColor = e.target.value;
        redraw();
        saveSession();
    };
    document.getElementById("btnBgColor").parentNode.insertBefore(bgColorInput, document.getElementById("btnBgColor").nextSibling);
    document.getElementById("btnBgColor").onclick = () => {
        bgColorInput.click();
    };
    document.getElementById("btnSwapKeys").onclick = (e) => {
        keysSwapped = !keysSwapped;
        e.target.classList.toggle("active", keysSwapped);
        saveSession();
    };
    document.getElementById("btnDefaults").onclick = () => {
        const table = document.getElementById("defaultsTable");
        if (table.style.visibility === "hidden" || table.style.visibility === "") {
            table.style.visibility = "visible";
            table.style.display = "table";
        } else {
            table.style.visibility = "hidden";
            table.style.display = "none";
        }
    };
    document.getElementById("btnEditScript").onclick = () => {
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
        content.style.background = "#444";
        content.style.padding = "20px";
        content.style.borderRadius = "5px";
        content.style.width = "600px";
        content.style.maxHeight = "80vh";
        content.style.display = "flex";
        content.style.flexDirection = "column";
        content.innerHTML = `
            <h3 style="margin-top:0;margin-bottom:10px;">Edit Script</h3>
            <textarea id="scriptTextArea" style="flex:1;min-height:300px;background:#555;color:#eee;border:1px solid #777;padding:8px;font-family:monospace;font-size:12px;resize:none;">${currentAnimation.script || ""}</textarea>
            <div style="text-align:right;margin-top:10px;">
                <button id="scriptCancel" style="background:#666;color:#eee;border:1px solid #777;padding:4px 12px;cursor:pointer;margin-right:5px;">Cancel</button>
                <button id="scriptSave" style="background:#666;color:#eee;border:1px solid #777;padding:4px 12px;cursor:pointer;">Save</button>
            </div>
        `;
        dialog.appendChild(content);
        document.body.appendChild(dialog);
        const textArea = document.getElementById("scriptTextArea");
        textArea.focus();
        document.getElementById("scriptCancel").onclick = () => {
            document.body.removeChild(dialog);
        };
        document.getElementById("scriptSave").onclick = () => {
            currentAnimation.script = textArea.value;
            document.body.removeChild(dialog);
        };
        dialog.onclick = (e) => {
            if (e.target === dialog) {
                document.body.removeChild(dialog);
            }
        };
    };
    document.getElementById("btnAttachmentBack").onclick = () => {
        if (!editingSprite) return;
        if (editingSprite.m_drawIndex > 0) {
            editingSprite.m_drawIndex--;
            redraw();
            drawSpritePreview();
        }
    };
    document.getElementById("btnAttachmentForward").onclick = () => {
        if (!editingSprite) return;
        if (editingSprite.m_drawIndex < editingSprite.attachedSprites.length) {
            editingSprite.m_drawIndex++;
            redraw();
            drawSpritePreview();
        }
    };
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
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const oldWorldX = (mouseX - width / 2 - panX) / oldZoom;
        const oldWorldY = (mouseY - height / 2 - panY) / oldZoom;
        const delta = e.deltaY > 0 ? -1 : 1;
        zoomLevel = Math.max(0, Math.min(7, zoomLevel + delta));
        localStorage.setItem("mainCanvasZoom", zoomLevel);
        const newZoom = zoomFactors[zoomLevel] || 1.0;
        const newWorldX = (mouseX - width / 2 - panX) / newZoom;
        const newWorldY = (mouseY - height / 2 - panY) / newZoom;
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

    mainCanvas.addEventListener("touchstart", (e) => {
        if (e.touches.length === 2) {
            e.preventDefault();
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            initialPinchDistance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
            initialZoomLevel = zoomLevel;
            initialPanX = panX;
            initialPanY = panY;
        }
    }, { passive: false });

    mainCanvas.addEventListener("touchmove", (e) => {
        if (e.touches.length === 2 && initialPinchDistance !== null) {
            e.preventDefault();
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const currentDistance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
            const oldZoom = zoomFactors[zoomLevel] || 1.0;
            const zoomRatio = currentDistance / initialPinchDistance;
            const newZoomLevel = Math.max(0, Math.min(7, initialZoomLevel + Math.log2(zoomRatio)));
            zoomLevel = Math.round(newZoomLevel);
            localStorage.setItem("mainCanvasZoom", zoomLevel);
            const rect = mainCanvas.getBoundingClientRect();
            const centerX = (touch1.clientX + touch2.clientX) / 2 - rect.left;
            const centerY = (touch1.clientY + touch2.clientY) / 2 - rect.top;
            const width = mainCanvas.width / (window.devicePixelRatio || 1);
            const height = mainCanvas.height / (window.devicePixelRatio || 1);
            const newZoom = zoomFactors[zoomLevel] || 1.0;

            const worldX = (centerX - width / 2 - initialPanX) / oldZoom;
            const worldY = (centerY - height / 2 - initialPanY) / oldZoom;

            panX = centerX - width / 2 - worldX * newZoom;
            panY = centerY - height / 2 - worldY * newZoom;

            redraw();
        }
    }, { passive: false });

    mainCanvas.addEventListener("touchend", (e) => {
        if (e.touches.length < 2) {
            initialPinchDistance = null;
            initialZoomLevel = null;
            initialPanX = null;
            initialPanY = null;
        }
    }, { passive: false });

    function addWheelHandler(selector, onChange, step = 1) {
        const el = document.querySelector(selector);
        if (!el) return;
        el.addEventListener("wheel", (e) => {
            if (e.target.closest("#mainCanvas") || el.disabled) return;
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
    let isPanning = false;
    let panStartX = 0, panStartY = 0;
    mainCanvas.onmousedown = (e) => {
        const rect = mainCanvas.getBoundingClientRect();
        const width = mainCanvas.width / (window.devicePixelRatio || 1);
        const height = mainCanvas.height / (window.devicePixelRatio || 1);
        const zoomFactors = [0.25, 0.5, 0.75, 1.0, 2, 3, 4, 8];
        const zoom = zoomFactors[zoomLevel] || 1.0;
        const x = (e.clientX - rect.left - width / 2 - panX) / zoom;
        const y = (e.clientY - rect.top - height / 2 - panY) / zoom;
        if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
            isPanning = true;
            panStartX = e.clientX - panX;
            panStartY = e.clientY - panY;
            mainCanvas.style.cursor = "grabbing";
        } else if (e.button === 0) {
            if (insertPiece) {
                const frame = currentAnimation.getFrame(currentFrame);
                if (frame) {
                    const actualDir = getDirIndex(currentDir);
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
                const actualDir = getDirIndex(currentDir);
                const pieces = frame.pieces[actualDir] || [];
                let found = false;
                for (let i = pieces.length - 1; i >= 0; i--) {
                    const piece = pieces[i];
                    const bb = piece.getBoundingBox(currentAnimation);
                    if (x >= bb.x && x < bb.x + bb.width && y >= bb.y && y < bb.y + bb.height) {
                        if (e.shiftKey) {
                            if (selectedPieces.has(piece)) {
                                selectedPieces.delete(piece);
                            } else {
                                selectedPieces.add(piece);
                            }
                        } else {
                            if (!selectedPieces.has(piece)) {
                                selectedPieces.clear();
                                selectedPieces.add(piece);
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
                            found = true;
                            updateItemsCombo();
                            break;
                        }
                    }
                }
                if (!found) {
                    if (!e.shiftKey) {
                        selectedPieces.clear();
                        const combo = document.getElementById("itemsCombo");
                        if (combo) combo.value = "";
                        updateItemsCombo();
                        updateItemSettings();
                        redraw();
                    }
                    boxSelectStart = {x, y};
                    isBoxSelecting = true;
                }
            }
        } else if (e.button === 2) {
            if (insertPiece) {
                insertPiece = null;
                mainCanvas.style.cursor = "default";
                redraw();
                return;
            }
            if (selectedPieces.size > 0) {
                selectedPieces.clear();
                updateItemsCombo();
                redraw();
            } else {
                e.preventDefault();
                showCanvasContextMenu(e);
            }
        }
        redraw();
    };
    mainCanvas.onmousemove = (e) => {
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        const rect = mainCanvas.getBoundingClientRect();
        const width = mainCanvas.width / (window.devicePixelRatio || 1);
        const height = mainCanvas.height / (window.devicePixelRatio || 1);
        const zoomFactors = [0.25, 0.5, 0.75, 1.0, 2, 3, 4, 8];
        const zoom = zoomFactors[zoomLevel] || 1.0;
        const x = (e.clientX - rect.left - width / 2 - panX) / zoom;
        const y = (e.clientY - rect.top - height / 2 - panY) / zoom;
        if (isPanning) {
            panX = e.clientX - panStartX;
            panY = e.clientY - panStartY;
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
            const boxSelectEnd = {x, y};
            if (boxSelectEnd) {
                redraw();
            }
        } else if (insertPiece) {
            redraw();
        }
    };
    mainCanvas.onmouseup = (e) => {
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
                if (JSON.stringify(dragStartState) !== JSON.stringify(newState)) {
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
            saveSession();
        }
        if (isBoxSelecting && boxSelectStart && e.button === 0) {
            const rect = mainCanvas.getBoundingClientRect();
            const width = mainCanvas.width / (window.devicePixelRatio || 1);
            const height = mainCanvas.height / (window.devicePixelRatio || 1);
            const zoomFactors = [0.25, 0.5, 0.75, 1.0, 2, 3, 4, 8];
            const zoom = zoomFactors[zoomLevel] || 1.0;
            const x = (e.clientX - rect.left - width / 2 - panX) / zoom;
            const y = (e.clientY - rect.top - height / 2 - panY) / zoom;
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
                    if (!e.shiftKey) {
                        selectedPieces.clear();
                        const combo = document.getElementById("itemsCombo");
                        if (combo) combo.value = "";
                        updateItemsCombo();
                        updateItemSettings();
                    }
                } else {
                    if (!e.shiftKey) {
                        selectedPieces.clear();
                    }
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
                    updateItemsCombo();
                    updateItemSettings();
                }
            }
            isBoxSelecting = false;
            boxSelectStart = null;
            redraw();
            saveSession();
        }
    };
    mainCanvas.onmouseleave = () => {
        isPanning = false;
        isDragging = false;
        mainCanvas.style.cursor = "default";
    };
    mainCanvas.oncontextmenu = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        showCanvasContextMenu(e);
    };
});

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
    requestAnimationFrame(playAnimation);
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
    menu.style.left = e.pageX + "px";
    menu.style.top = e.pageY + "px";
    menu.style.background = "#444";
    menu.style.border = "1px solid #555";
    menu.style.padding = "4px";
    menu.style.zIndex = "10000";
    menu.style.minWidth = "150px";
    activeContextMenu = menu;
    const items = [
        {text: "Edit Sprite", action: () => {
            editSprite(sprite);
            if (activeContextMenu) {
                document.body.removeChild(activeContextMenu);
                activeContextMenu = null;
            }
        }},
        {text: "Copy Sprite", action: () => {
            editingSprite = sprite;
            document.getElementById("btnCopySprite").click();
        }},
        {text: "Duplicate Sprite", action: () => {
            if (!editingSprite) return;
            const newSprite = editingSprite.duplicate(currentAnimation.nextSpriteIndex++);
            currentAnimation.addSprite(newSprite);
            selectSprite(newSprite);
            updateSpritesList();
            redraw();
        }},
        {text: "Delete Sprite", action: () => {
            editingSprite = sprite;
            document.getElementById("btnDeleteSprite").click();
        }}
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
    document.body.appendChild(menu);
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
    menu.style.left = e.pageX + "px";
    menu.style.top = e.pageY + "px";
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
    document.body.appendChild(menu);
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
    menu.style.left = e.pageX + "px";
    menu.style.top = e.pageY + "px";
    menu.style.background = "#444";
    menu.style.border = "1px solid #555";
    menu.style.padding = "4px";
    menu.style.zIndex = "10000";
    menu.style.minWidth = "150px";
    activeContextMenu = menu;
    const items = [];
    if (selectedPieces.size > 0) {
        items.push({text: `Delete Piece${selectedPieces.size > 1 ? 's' : ''}`, action: () => {
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
        {text: "Paste Sprite", action: () => document.getElementById("btnPasteSprite").click()},
        {text: "Center View", action: () => {
            panX = panY = 0;
            redraw();
        }}
    );
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
    document.body.appendChild(menu);
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
    menu.style.left = e.pageX + "px";
    menu.style.top = e.pageY + "px";
    menu.style.background = "#444";
    menu.style.border = "1px solid #555";
    menu.style.padding = "4px";
    menu.style.zIndex = "10000";
    menu.style.minWidth = "150px";
    activeContextMenu = menu;
    const items = [
        {text: "Add Sprite", action: () => document.getElementById("btnAddSprite").click()},
        {text: "Paste Sprite", action: () => document.getElementById("btnPasteSprite").click()}
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
    document.body.appendChild(menu);
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

function showConfirmDialog(message, callback) {
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
    content.style.background = "#444";
    content.style.padding = "20px";
    content.style.borderRadius = "5px";
    content.style.width = "400px";
    content.style.maxWidth = "90vw";
    content.style.textAlign = "center";
    const messageEl = document.createElement("div");
    messageEl.style.color = "#eee";
    messageEl.style.marginBottom = "20px";
    messageEl.style.fontSize = "14px";
    messageEl.style.whiteSpace = "pre-wrap";
    messageEl.textContent = message;
    const buttonContainer = document.createElement("div");
    buttonContainer.style.display = "flex";
    buttonContainer.style.gap = "10px";
    buttonContainer.style.justifyContent = "center";
    const yesButton = document.createElement("button");
    yesButton.textContent = "Yes";
    yesButton.style.background = "#666";
    yesButton.style.color = "#eee";
    yesButton.style.border = "1px solid #777";
    yesButton.style.padding = "8px 16px";
    yesButton.style.cursor = "pointer";
    yesButton.style.borderRadius = "3px";
    yesButton.onclick = () => {
        document.body.removeChild(dialog);
        callback(true);
    };
    const noButton = document.createElement("button");
    noButton.textContent = "No";
    noButton.style.background = "#666";
    noButton.style.color = "#eee";
    noButton.style.border = "1px solid #777";
    noButton.style.padding = "8px 16px";
    noButton.style.cursor = "pointer";
    noButton.style.borderRadius = "3px";
    noButton.onclick = () => {
        document.body.removeChild(dialog);
        callback(false);
    };
    buttonContainer.appendChild(yesButton);
    buttonContainer.appendChild(noButton);
    content.appendChild(messageEl);
    content.appendChild(buttonContainer);
    dialog.appendChild(content);
    document.body.appendChild(dialog);
}

function showAddSpriteDialog(editSprite = null) {
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
    content.style.background = "#444";
    content.style.padding = "2px";
    content.style.borderRadius = "5px";
    content.style.width = "700px";
    content.style.maxWidth = "90vw";
    content.style.height = "600px";
    content.style.maxHeight = "90vh";
    content.style.display = "flex";
    content.style.flexDirection = "column";
    content.style.overflow = "hidden";
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
    leftPanel.style.padding = "8px";
    leftPanel.style.overflowY = "auto";
    leftPanel.style.overflowX = "visible";
    leftPanel.style.minHeight = "0";
    leftPanel.style.maxHeight = "100%";
    leftPanel.style.boxSizing = "border-box";
    leftPanel.style.flexShrink = "0";
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
    row1.innerHTML = `<label style="width:100px;font-size:15px;flex-shrink:0;">Image Source:</label><select id="addSpriteSource" style="flex:1;min-width:0;background:#555;color:#eee;border:1px solid #777;padding:2px;font-size:15px;"><option>CUSTOM</option><option>SPRITES</option><option>BODY</option><option>HEAD</option><option>SWORD</option><option>SHIELD</option><option>HORSE</option><option>PICS</option><option>ATTR1</option><option>ATTR2</option><option>ATTR3</option><option>ATTR4</option><option>ATTR5</option><option>ATTR6</option><option>ATTR7</option><option>ATTR8</option><option>ATTR9</option><option>ATTR10</option><option>PARAM1</option><option>PARAM2</option><option>PARAM3</option><option>PARAM4</option><option>PARAM5</option><option>PARAM6</option><option>PARAM7</option><option>PARAM8</option><option>PARAM9</option><option>PARAM10</option></select>`;
    const row2 = document.createElement("div");
    row2.style.display = "flex";
    row2.style.alignItems = "center";
    row2.style.gap = "4px";
    row2.innerHTML = `<label style="width:100px;font-size:15px;flex-shrink:0;">Image File:</label><input type="text" id="addSpriteImageFile" readonly style="flex:1;min-width:0;background:#555;color:#eee;border:1px solid #777;padding:2px;font-size:15px;"><button id="addSpriteBrowse" style="background:#666;color:#eee;border:1px solid #777;padding:2px 8px;cursor:pointer;font-size:15px;flex-shrink:0;">Select</button>`;
    const row3 = document.createElement("div");
    row3.style.display = "flex";
    row3.style.alignItems = "center";
    row3.style.gap = "4px";
    row3.innerHTML = `<label style="width:100px;font-size:15px;flex-shrink:0;">Comment:</label><input type="text" id="addSpriteComment" value="New Sprite" style="flex:1;min-width:0;background:#555;color:#eee;border:1px solid #777;padding:2px;font-size:15px;">`;
    const row4 = document.createElement("div");
    row4.style.display = "flex";
    row4.style.alignItems = "center";
    row4.style.gap = "4px";
    row4.innerHTML = `<label style="width:100px;font-size:15px;flex-shrink:0;">Sprite Index:</label><input type="number" id="addSpriteIndex" value="${currentAnimation.nextSpriteIndex}" style="flex:1;min-width:0;background:#555;color:#eee;border:1px solid #777;padding:2px;font-size:15px;">`;
    const spriteSizeGroup = document.createElement("div");
    spriteSizeGroup.style.border = "1px solid #555";
    spriteSizeGroup.style.padding = "6px 2px 2px 2px";
    spriteSizeGroup.style.marginTop = "8px";
    spriteSizeGroup.innerHTML = `<div style="font-weight:bold;font-size:15px;margin-bottom:4px;">Sprite Size</div>`;
    const sizeGrid = document.createElement("div");
    sizeGrid.style.display = "grid";
    sizeGrid.style.gridTemplateColumns = "auto 1fr";
    sizeGrid.style.gap = "4px 8px";
    sizeGrid.style.alignItems = "center";
    sizeGrid.innerHTML = `<label style="font-size:15px;flex-shrink:0;">Left:</label><input type="number" id="addSpriteLeft" value="0" style="flex:1;min-width:0;background:#555;color:#eee;border:1px solid #777;padding:2px;font-size:15px;"><label style="font-size:15px;flex-shrink:0;">Top:</label><input type="number" id="addSpriteTop" value="0" style="flex:1;min-width:0;background:#555;color:#eee;border:1px solid #777;padding:2px;font-size:15px;"><label style="font-size:15px;flex-shrink:0;">Width:</label><input type="number" id="addSpriteWidth" value="32" style="flex:1;min-width:0;background:#555;color:#eee;border:1px solid #777;padding:2px;font-size:15px;"><label style="font-size:15px;flex-shrink:0;">Height:</label><input type="number" id="addSpriteHeight" value="32" style="flex:1;min-width:0;background:#555;color:#eee;border:1px solid #777;padding:2px;font-size:15px;"><div style="grid-column:1/-1;display:flex;gap:8px;align-items:center;justify-content:flex-end;"><button id="addSpriteAutoDetect" title="Auto Detect Sprite - Click to toggle, then click on image to detect sprite" style="background:#666;color:#eee;border:1px solid #777;padding:2px 6px;cursor:pointer;font-size:13px;"><i class="fas fa-magic"></i> Auto Detect Sprite</button></div>`;
    spriteSizeGroup.appendChild(sizeGrid);
    const gridGroup = document.createElement("div");
    gridGroup.style.border = "1px solid #555";
    gridGroup.style.padding = "6px 2px 2px 2px";
    gridGroup.style.marginTop = "8px";
    gridGroup.innerHTML = `<div style="font-weight:bold;font-size:15px;margin-bottom:4px;">Grid Settings</div>`;
    const gridLayout = document.createElement("div");
    gridLayout.style.display = "grid";
    gridLayout.style.gridTemplateColumns = "auto 1fr";
    gridLayout.style.gap = "4px 8px";
    gridLayout.style.alignItems = "center";
    gridLayout.innerHTML = `<label style="font-size:15px;flex-shrink:0;">Columns:</label><input type="number" id="addSpriteCols" value="1" min="1" style="flex:1;min-width:0;background:#555;color:#eee;border:1px solid #777;padding:2px;font-size:15px;"><label style="font-size:15px;flex-shrink:0;">Column Separation:</label><input type="number" id="addSpriteColSep" value="0" style="flex:1;min-width:0;background:#555;color:#eee;border:1px solid #777;padding:2px;font-size:15px;"><label style="font-size:15px;flex-shrink:0;">Rows:</label><input type="number" id="addSpriteRows" value="1" min="1" style="flex:1;min-width:0;background:#555;color:#eee;border:1px solid #777;padding:2px;font-size:15px;"><label style="font-size:15px;flex-shrink:0;">Row Separation:</label><input type="number" id="addSpriteRowSep" value="0" style="flex:1;min-width:0;background:#555;color:#eee;border:1px solid #777;padding:2px;font-size:15px;">`;
    gridGroup.appendChild(gridLayout);
    formLayout.appendChild(row1);
    formLayout.appendChild(row2);
    formLayout.appendChild(row3);
    formLayout.appendChild(row4);
    formLayout.appendChild(spriteSizeGroup);
    formLayout.appendChild(gridGroup);
    leftPanel.appendChild(formLayout);
    const splitterHandle = document.createElement("div");
    splitterHandle.style.width = "2px";
    splitterHandle.style.background = "#555";
    splitterHandle.style.cursor = "ew-resize";
    const rightPanel = document.createElement("div");
    rightPanel.style.display = "flex";
    rightPanel.style.flexDirection = "column";
    rightPanel.style.flex = "1";
    rightPanel.style.padding = "4px";
    rightPanel.style.minWidth = "0";
    const previewHeader = document.createElement("div");
    previewHeader.style.display = "flex";
    previewHeader.style.justifyContent = "space-between";
    previewHeader.style.alignItems = "center";
    previewHeader.style.marginBottom = "4px";
    previewHeader.innerHTML = `<div style="font-weight:bold;font-size:15px;">Preview:</div><div style="display:flex;gap:4px;align-items:center;"><button id="addSpriteCenter" style="background:#666;color:#eee;border:1px solid #777;padding:2px 6px;cursor:pointer;font-size:15px;" title="Center View"><i class="fas fa-crosshairs"></i></button><button id="addSpriteZoomOut" style="background:#666;color:#eee;border:1px solid #777;padding:2px 6px;cursor:pointer;font-size:15px;">-</button><span id="addSpriteZoomLevel" style="font-size:15px;min-width:40px;text-align:center;">100%</span><button id="addSpriteZoomIn" style="background:#666;color:#eee;border:1px solid #777;padding:2px 6px;cursor:pointer;font-size:15px;">+</button></div>`;
    rightPanel.appendChild(previewHeader);
    const previewCanvas = document.createElement("canvas");
    previewCanvas.id = "addSpritePreview";
    previewCanvas.style.flex = "1";
    previewCanvas.style.border = "1px solid #555";
    previewCanvas.style.background = "#222";
    previewCanvas.style.cursor = "default";
    previewCanvas.width = 300;
    previewCanvas.height = 400;
    rightPanel.appendChild(previewCanvas);
    splitter.appendChild(leftPanel);
    splitter.appendChild(splitterHandle);
    splitter.appendChild(rightPanel);
    content.appendChild(splitter);
    const buttonBar = document.createElement("div");
    buttonBar.style.display = "flex";
    buttonBar.style.justifyContent = "flex-end";
    buttonBar.style.gap = "4px";
    buttonBar.style.padding = "4px 8px";
    buttonBar.innerHTML = `<button id="addSpriteAdd" style="background:#666;color:#eee;border:1px solid #777;padding:5px 10px;cursor:pointer;">Add</button><button id="addSpriteCancel" style="background:#666;color:#eee;border:1px solid #777;padding:5px 10px;cursor:pointer;">Close</button>`;
    content.appendChild(buttonBar);
    dialog.appendChild(content);
    document.body.appendChild(dialog);
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.style.display = "none";
    document.body.appendChild(fileInput);
    let previewImg = null;
    document.getElementById("addSpriteBrowse").onclick = () => {
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
                    const img = new Image();
                    await new Promise((resolve, reject) => {
                        img.onload = resolve;
                    img.onerror = () => {
                        reject(new Error(`Image ${defaultName} not found`));
                    };
                        img.src = `images/${defaultName}`;
                    });
                    imageLibrary.set(imgKey, img);
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
        const baseScale = Math.min(previewCanvas.width / previewImg.width, previewCanvas.height / previewImg.height, 1);
        const scale = baseScale * previewZoom;
        const offsetX = (previewCanvas.width - previewImg.width * scale) / 2 + previewPanX;
        const offsetY = (previewCanvas.height - previewImg.height * scale) / 2 + previewPanY;
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
        ctx.fillStyle = "#222";
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
            ctx.strokeStyle = "#00ff00";
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
            ctx.strokeStyle = "#ffff00";
            ctx.lineWidth = 2 / scale;
            ctx.strokeRect(selectionBox.x, selectionBox.y, selectionBox.w, selectionBox.h);
            ctx.fillStyle = "rgba(255, 255, 0, 0.1)";
            ctx.fillRect(selectionBox.x, selectionBox.y, selectionBox.w, selectionBox.h);
            ctx.restore();
            const boxX = selectionBox.x * scale + offsetX;
            const boxY = selectionBox.y * scale + offsetY;
            const boxW = selectionBox.w * scale;
            const boxH = selectionBox.h * scale;
            
            ctx.fillStyle = "#ffff00";
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
    document.getElementById("addSpriteAutoDetect").onclick = () => {
        autoDetectActive = !autoDetectActive;
        const btn = document.getElementById("addSpriteAutoDetect");
        if (autoDetectActive) {
            btn.style.background = "#4a9eff";
            btn.style.borderColor = "#6bb0ff";
            previewCanvas.style.cursor = "crosshair";
        } else {
            btn.style.background = "#666";
            btn.style.borderColor = "#777";
            previewCanvas.style.cursor = "default";
        }
    };
    document.getElementById("addSpriteCancel").onclick = () => {
        document.body.removeChild(dialog);
        document.body.removeChild(fileInput);
    };
    document.getElementById("addSpriteAdd").onclick = () => {
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
                    if (sprite.type === "CUSTOM" && fileInput.files[0]) {
                        sprite.customImageName = fileInput.files[0].name;
                    }
                    sprite.comment = document.getElementById("addSpriteComment").value + (rows * cols > 1 ? ` (${row * cols + col})` : "");
                    sprite.left = selectionBox.x + col * (spriteW + colSep);
                    sprite.top = selectionBox.y + row * (spriteH + rowSep);
                    sprite.width = spriteW;
                    sprite.height = spriteH;
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
            document.body.removeChild(dialog);
            document.body.removeChild(fileInput);
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
    content.style.padding = "20px";
    content.style.borderRadius = "4px";
    content.style.width = "400px";
    content.style.maxWidth = "90vw";
    content.innerHTML = `
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



