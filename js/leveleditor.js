
const APP_VERSION = '1.0.92';
var _isTauri = window.__TAURI__ != null;
var _tauri = _isTauri ? window.__TAURI__ : null;

const _DEFAULT_KB = {
    undo:'ctrl+z', redo:'ctrl+y', save:'ctrl+s', copy:'ctrl+c', cut:'ctrl+x', paste:'ctrl+v',
    delete:'Delete', playMode:'F4', about:'F1', settings:'F2',
    openChat:'Enter', debugInfo:'1', debugOverlay:'2', editBypass:'3', grab:'e',
};
function _matchKB(e, b) {
    if (!b) return false;
    if (b === '+' || b === '-') return e.key === b;
    const p = b.split('+'), nc = p.includes('ctrl'), ns = p.includes('shift'), na = p.includes('alt'), key = p[p.length-1];
    if (!key) return false;
    if (nc !== e.ctrlKey || ns !== e.shiftKey || na !== e.altKey) return false;
    return e.key === key || e.key.toLowerCase() === key.toLowerCase();
}
function _fmtKB(b) {
    if (!b) return '—';
    return b.split('+').map(p => p===' '?'Space':p.toLowerCase()==='escape'?'Esc':p.toLowerCase()==='delete'?'Del':p==='ctrl'?'Ctrl':p==='shift'?'Shift':p==='alt'?'Alt':p.length===1?p:p[0].toUpperCase()+p.slice(1)).join('+');
}
const _CNAMES = ['white','yellow','orange','pink','red','darkred','lightgreen','green','darkgreen','lightblue','blue','darkblue','brown','cynober','purple','darkpurple','lightgray','gray','black','transparent'];
const _CRGB = [[255,255,255],[255,255,0],[255,173,107],[255,192,203],[255,0,0],[139,0,0],[144,238,144],[0,128,0],[0,100,0],[173,216,230],[0,0,255],[0,0,139],[139,69,19],[255,215,0],[128,0,128],[64,0,64],[211,211,211],[128,128,128],[0,0,0],[0,0,0]];
const _BODY_PALETTE = [{r:255,g:255,b:255,slot:1},{r:255,g:173,b:107,slot:0},{r:255,g:0,b:0,slot:2},{r:206,g:24,b:41,slot:3},{r:0,g:0,b:255,slot:4},{r:0,g:132,b:0,slot:-1},{r:0,g:0,b:0,slot:-1}];
function parseNPCScript(script) {
    const r = {};
    script = script.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
    const aniM = script.match(/(?:setcharani\s*(?:\(\s*["']([^"']+)["']|([a-z0-9_\-\.]+))|this\.ani\s*=\s*["']([^"']+)["'])/i);
    if (aniM) { let g = (aniM[1] || aniM[2] || aniM[3] || '').trim(); if (g && g !== 'null') r.gani = g.includes('.') ? g : g + '.gani'; }
    const hM = script.match(/this\.(?:head|headimg)\s*=\s*["']([^"']+)["']/i); if (hM) r.HEAD = hM[1];
    const bM = script.match(/this\.(?:body|bodyimg)\s*=\s*["']([^"']+)["']/i); if (bM) r.BODY = bM[1];
    const shM = script.match(/this\.shield\s*=\s*["']([^"']+)["']/i); if (shM) r.SHIELD = shM[1];
    for (const m of script.matchAll(/this\.attr\s*\[(\d+)\]\s*=\s*["']([^"']*)["']/gi)) r[`ATTR${m[1]}`] = m[2];
    const dM = script.match(/this\.dir\s*=\s*(\d+)/i); if (dM) r.dir = +dM[1];
    const colorMs = [...script.matchAll(/this\.colors\[(\d)\]\s*=\s*["']([^"']+)["']/gi)];
    if (colorMs.length) {
        r.colors = {};
        for (const m of colorMs) { const ci = _CNAMES.indexOf(m[2].toLowerCase()); if (ci >= 0 && +m[1] < 5) r.colors[+m[1]] = ci; }
    }
    const tdMs = [...script.matchAll(/addtiledef\s*(?:\(\s*["']([^"']+)["']\s*,\s*|([^\s,(]+)\s*,\s*)([^,);]+)\s*,\s*(\d+)/gi)];
    if (tdMs.length) r.tiledefs = tdMs.map(m => ({ img: (m[1] || m[2]).trim(), levelstart: m[3].trim().replace(/['"]/g, ''), type: +m[4] }));
    const td2Ms = [...script.matchAll(/addtiledef2\s*\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*,\s*(\d+)\s*,\s*(\d+)/gi)];
    if (td2Ms.length) r.tiledefs2 = td2Ms.map(m => ({ img: m[1].trim(), levelstart: m[2].trim(), x: +m[3], y: +m[4] }));
    const nM = script.match(/this\.nick(?:name)?\s*=\s*["']([^"']*)["']/i); if (nM) r.nick = nM[1];
    const sipM = script.match(/set(?:img|gif)part\s*\(\s*["']([^"']+)["']\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    if (sipM) r.imgpart = { img: sipM[1], x: +sipM[2], y: +sipM[3], w: +sipM[4], h: +sipM[5] };
    const szM = script.match(/setzoomeffect\s*[(]?\s*(-?[\d.]+)/i); if (szM) r.zoom = parseFloat(szM[1]);
    const sxM = script.match(/this\.stretchx\s*=\s*(-?[\d.]+)/i); if (sxM) r.stretchx = parseFloat(sxM[1]);
    const syM = script.match(/this\.stretchy\s*=\s*(-?[\d.]+)/i); if (syM) r.stretchy = parseFloat(syM[1]);
    const ss1M = script.match(/setshape\s*\(\s*1\s*,\s*(\d+)\s*,\s*(\d+)/i); if (ss1M) r.setshape = { w: +ss1M[1], h: +ss1M[2] };
    const ss2M = script.match(/setshape2\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*\{([^}]*)\}/is); if (ss2M) { const tiles = ss2M[3].split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v)); r.setshape2 = { w: +ss2M[1], h: +ss2M[2], tiles }; }
    const ceM = script.match(/setcoloreffect\s*[(]?\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)/i);
    if (ceM) r.coloreffect = [parseFloat(ceM[1]), parseFloat(ceM[2]), parseFloat(ceM[3]), parseFloat(ceM[4])];
    for (const m of script.matchAll(/this\.(x|y)\s*(\+|-)=\s*(-?[\d.]+)/gi)) { const ax=m[1]==='x',sg=m[2]==='-'?-1:1,v=parseFloat(m[3]); if(ax)r.xOff=(r.xOff||0)+sg*v; else r.yOff=(r.yOff||0)+sg*v; }
    for (const m of script.matchAll(/this\.(x|y)\s*=\s*\(\s*this\.\1\s*(\+|-)\s*([\d.]+)\s*\)/gi)) { const ax=m[1]==='x',sg=m[2]==='-'?-1:1,v=parseFloat(m[3]); if(ax)r.xOff=(r.xOff||0)+sg*v; else r.yOff=(r.yOff||0)+sg*v; }
    for (const m of script.matchAll(/setcharprop\s+([^,;]+)\s*,\s*([^;]+)\s*;/gi)) {
        const prop = m[1].trim(), val = m[2].trim().replace(/^["']|["']$/g, '');
        if (prop === '#3') r.HEAD = val;
        else if (prop === '#8') r.BODY = val;
        else if (prop === '#2') r.SHIELD = val;
        else if (prop === '#1') r.ATTR1 = val;
        else if (prop === '#m') { r.gani = val.includes('.') ? val : val + '.gani'; }
        else if (prop === '#c') r.chat = val;
        else if (prop === '#n') r.nick = val;
        else if (prop === '#g') r.guild = val;
        else if (/^#P(\d+)$/i.test(prop)) { const pi = +prop.slice(2); r[`ATTR${pi}`] = val; }
        else if (/^#C(\d)$/i.test(prop)) { const ci = +prop[2]; if (!r.colors) r.colors = {}; const cidx = _CNAMES.indexOf(val.toLowerCase()); if (cidx >= 0) r.colors[ci] = cidx; else if (!isNaN(+val)) r.colors[ci] = +val; }
    }
    return r;
}
function parseGaniLE(txt) {
    const lines = txt.split('\n'), sprites = {}, rawFrames = [];
    const defs = { SPRITES: 'sprites.png', HEAD: 'head19.png', BODY: 'body.png', SHIELD: 'shield1.png', SWORD: 'sword1.png', HORSE: 'ride.png', PICS: 'pics1.png' };
    let inAni = false, pendingSound = null, loop = false, setbackto = null, rawWaits = [];
    for (const raw of lines) {
        const t = raw.trim();
        if (!t || t.startsWith('GANI') || t === 'CONTINUOUS') continue;
        if (t === 'LOOP') { loop = true; continue; }
        if (t.startsWith('SETBACKTO')) { const _sb = t.split(/\s+/)[1] || null; setbackto = _sb ? (_sb.includes('.') ? _sb : _sb.toLowerCase() + '.gani') : null; continue; }
        if (t.startsWith('WAIT')) { const gi = Math.floor(rawFrames.length / 4) - 1; if (gi >= 0) rawWaits[gi] = parseInt(t.split(/\s+/)[1]) || 1; continue; }
        if (t.startsWith('PLAYSOUND')) { if (inAni) pendingSound = t.substring(9).trim().split(/\s+/)[0]; continue; }
        if (t === 'ANI') { inAni = true; continue; }
        if (t === 'ANIEND') break;
        if (t.startsWith('SPRITE ')) { const p = t.split(/\s+/); sprites[+p[1]] = { type: p[2], sx: +p[3], sy: +p[4], w: +p[5], h: +p[6] }; continue; }
        if (t.startsWith('DEFAULT')) { const sp = t.indexOf(' '); if (sp > 7) defs[t.substring(7, sp)] = t.substring(sp + 1).trim(); continue; }
        if (!inAni) continue;
        const parts = t.split(',');
        const hdr = parts[0].trim().split(/\s+/);
        if (hdr.length < 3) continue;
        const sprlist = [{ idx: +hdr[0], ox: +hdr[1], oy: +hdr[2] }];
        for (let i = 1; i < parts.length; i++) { const p = parts[i].trim().split(/\s+/); if (p.length >= 3) sprlist.push({ idx: +p[0], ox: +p[1], oy: +p[2] }); }
        rawFrames.push({ spr: sprlist, sound: pendingSound }); pendingSound = null;
    }
    const frames = [];
    for (let i = 0; i < rawFrames.length; i += 4) {
        const f = rawFrames[i];
        const fr = [f, rawFrames[i+1] || f, rawFrames[i+2] || f, rawFrames[i+3] || f];
        if (f.sound) fr.sound = f.sound;
        fr.wait = rawWaits[i/4] || 1;
        frames.push(fr);
    }
    return { sprites, defs, frames, loop, setbackto };
}

const CHEST_ITEMS = ['greenrupee','bluerupee','redrupee','bombs','darts','heart','glove1','bow','bomb','shield','sword','fullheart','superbomb','battleaxe','goldensword','mirrorshield','glove2','lizardshield','lizardsword','goldrupee','fireball','fireblast','nukeshot','joltbomb','spinattack'];

const BADDY_CROPS = [
    [0, 0, 44, 66], [44, 0, 44, 66], [88, 0, 44, 64], [132, 0, 44, 50],
    [0, 66, 52, 66], [52, 66, 24, 26], [52, 92, 32, 34],
    [84, 64, 44, 66], [132, 50, 44, 65], [132, 115, 44, 56]
];

const _SIGN_TEXT = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!?-.,#>()#####"\':/~&### <####;\n';
const _SIGN_SYMS = 'ABXYudlrhxyz#4.';
const _SIGN_CTAB = [91,92,93,94,77,78,79,80,74,75,71,72,73,86,86,87,88,67];
const _SIGN_CTABI = [0,1,2,3,4,5,6,7,8,10,11,12,13,15,17];
const _SIGN_CTABL = [1,1,1,1,1,1,1,1,2,1,1,1,2,2,1];
function _decodeSign(enc) {
    let r = '';
    for (let i = 0; i < enc.length; i++) { const ch = enc.charCodeAt(i) - 32; const ci = _SIGN_CTAB.indexOf(ch); if (ci !== -1) { const si = _SIGN_CTABI.indexOf(ci); if (si !== -1) r += '#' + _SIGN_SYMS[si]; } else r += _SIGN_TEXT[ch] || ''; }
    return r;
}
function _encodeSign(text) {
    let r = '';
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '#' && i + 1 < text.length) { const sym = _SIGN_SYMS.indexOf(text[i+1]); if (sym !== -1) { for (let j = 0; j < _SIGN_CTABL[sym]; j++) r += String.fromCharCode(32 + _SIGN_CTAB[_SIGN_CTABI[sym] + j]); i++; continue; } }
        const code = _SIGN_TEXT.indexOf(text[i]); if (code !== -1) r += String.fromCharCode(32 + code);
    }
    return r;
}

class LevelObject {
    constructor(x = 0, y = 0, type = 'chest') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.id = Math.random().toString(36).substr(2, 9);
        this.properties = {};
    }
}

class Level {
    constructor(width = 64, height = 64) {
        this.width = width;
        this.height = height;
        this.layers = [];
        this.objects = [];
        this.tilesetImage = null;
        this.tilesetName = 'pics1.png';
        this.tileWidth = 16;
        this.tileHeight = 16;

        this.layers.push(this.createEmptyLayer());
    }

    createEmptyLayer() {
        const tiles = new Array(this.width * this.height).fill(-1);
        return {
            tiles: tiles,
            visible: true
        };
    }

    getTile(layer, x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height || layer < 0 || layer >= this.layers.length) {
            return -1;
        }
        return this.layers[layer].tiles[y * this.width + x];
    }

    setTile(layer, x, y, tileIndex) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height || layer < 0 || layer >= this.layers.length) return;
        this.layers[layer].tiles[y * this.width + x] = tileIndex;
    }

    clearLayer(layer) {
        if (layer < 0 || layer >= this.layers.length) return;
        this.layers[layer].tiles.fill(-1);
    }

    resize(newWidth, newHeight) {
        if (newWidth === this.width && newHeight === this.height) return;

        const oldWidth = this.width;
        const oldHeight = this.height;

        this.width = newWidth;
        this.height = newHeight;

        for (let layer = 0; layer < this.layers.length; layer++) {
            const newTiles = new Array(newWidth * newHeight).fill(-1);
            const oldTiles = this.layers[layer].tiles;

            for (let y = 0; y < Math.min(oldHeight, newHeight); y++) {
                for (let x = 0; x < Math.min(oldWidth, newWidth); x++) {
                    newTiles[y * newWidth + x] = oldTiles[y * oldWidth + x];
                }
            }

            this.layers[layer].tiles = newTiles;
        }
    }

    getTilesetCoords(tileIndex) {
        if (!this.tilesetImage) return { x: 0, y: 0 };
        const tilesPerRow = Math.floor(this.tilesetImage.width / this.tileWidth);
        const x = (tileIndex % tilesPerRow) * this.tileWidth;
        const y = Math.floor(tileIndex / tilesPerRow) * this.tileHeight;
        return { x, y };
    }

    addObject(obj) {
        this.objects.push(obj);
    }

    removeObject(obj) {
        const index = this.objects.indexOf(obj);
        if (index > -1) {
            this.objects.splice(index, 1);
        }
    }

    getObjectAt(x, y, pixelCheckFn = null) {
        const pri = { npc: 0, baddy: 1, chest: 2, sign: 3, link: 4 };
        const hits = this.objects.filter(obj => {
            const ox = Math.floor(obj.x), oy = Math.floor(obj.y);
            if (obj.type === 'npc') {
                const sc = obj._shapeCache;
                if (sc?.type === 2) {
                    for (let ty2 = 0; ty2 < sc.h; ty2++) for (let tx2 = 0; tx2 < sc.w; tx2++) {
                        if (sc.tiles[ty2 * sc.w + tx2] && x >= ox+tx2 && x < ox+tx2+1 && y >= oy+ty2 && y < oy+ty2+1) return true;
                    }
                    return false;
                }
                if (sc?.type === 1) return x >= ox && x < ox + sc.w/16 && y >= oy && y < oy + sc.h/16;
                const nw = obj._imgW ? obj._imgW/16 : (obj.properties?.width || 3);
                const nh = obj._imgH ? obj._imgH/16 : (obj.properties?.height || 3);
                const gox = (obj._ganiOX ?? 0) / 16, goy = (obj._ganiOY ?? 0) / 16;
                const inBox = x >= ox+gox && x < ox+gox+nw && y >= oy+goy && y < oy+goy+nh;
                if (!inBox) return false;
                return pixelCheckFn ? pixelCheckFn(obj, x, y) : true;
            }
            const bc = obj.type === 'baddy' ? BADDY_CROPS[Math.max(0, Math.min(9, obj.properties?.baddyType ?? 0))] : null;
            const ow = bc ? bc[2]/16 : (obj.properties?.width || (obj.type === 'chest' ? 2 : obj.type === 'sign' ? 2 : obj.type === 'link' ? 2 : 1));
            const oh = bc ? bc[3]/16 : (obj.properties?.height || (obj.type === 'chest' ? 2 : obj.type === 'link' ? 2 : 1));
            return x >= ox && x < ox+ow && y >= oy && y < oy+oh;
        });
        return hits.sort((a, b) => (pri[a.type] ?? 5) - (pri[b.type] ?? 5))[0] ?? null;
    }

    saveToNW() {
        const base64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        const tilesPerRow = this.tilesetImage ? Math.floor(this.tilesetImage.width / this.tileWidth) : 128;
        let out = 'GLEVNW01\n';
        const encTile = (idx) => { const ttx = idx % tilesPerRow, tty = Math.floor(idx / tilesPerRow); const g = Math.floor(ttx / 16) * 512 + (ttx % 16) + tty * 16; return base64[g >> 6] + base64[g & 0x3F]; };
        for (let li = 0; li < this.layers.length; li++) {
            const layer = this.layers[li];
            if (li > 0 && !layer.tiles.some(t => t >= 0)) continue;
            for (let ty = 0; ty < this.height; ty++) {
                if (li === 0) {
                    out += `BOARD 0 ${ty} ${this.width} 0 `;
                    for (let tx = 0; tx < this.width; tx++) { const idx = layer.tiles[ty * this.width + tx]; out += encTile(idx < 0 ? 0 : idx); }
                    out += '\n';
                } else {
                    let tx = 0;
                    while (tx < this.width) {
                        if (layer.tiles[ty * this.width + tx] < 0) { tx++; continue; }
                        let rx = tx;
                        while (rx < this.width && layer.tiles[ty * this.width + rx] >= 0) rx++;
                        out += `BOARD ${tx} ${ty} ${rx - tx} ${li} `;
                        for (let x = tx; x < rx; x++) out += encTile(layer.tiles[ty * this.width + x]);
                        out += '\n';
                        tx = rx;
                    }
                }
            }
            out += '\n';
        }
        for (const obj of this.objects) {
            const p = obj.properties || {};
            if (obj.type === 'link') {
                out += `LINK ${p.nextLevel || '-'} ${obj.x} ${obj.y} ${p.width || 1} ${p.height || 1} ${p.nextX || '0'} ${p.nextY || '0'}`;
                if (p.nextLayer || p.layerIndex) out += ` ${p.nextLayer || 0} ${p.layerIndex || 0}`;
                out += '\n';
            } else if (obj.type === 'sign') {
                out += `SIGN ${obj.x} ${obj.y}${p.layerIndex ? ' ' + p.layerIndex : ''}\n`;
                out += (p.text || '') + '\nSIGNEND\n\n';
            } else if (obj.type === 'chest') {
                out += `CHEST ${obj.x} ${obj.y} ${p.itemName || 'greenrupee'} ${p.signIndex || 0}${p.layerIndex ? ' ' + p.layerIndex : ''}\n`;
            } else if (obj.type === 'baddy') {
                out += `BADDY ${obj.x} ${obj.y} ${p.baddyType || 0}${p.layerIndex ? ' ' + p.layerIndex : ''}\n`;
                const v = p.verses || ['', '', ''];
                for (let i = 0; i < 3; i++) out += (v[i] || '') + '\n';
                out += 'BADDYEND\n\n';
            } else if (obj.type === 'npc') {
                out += `NPC ${p.image || '-'} ${obj.x} ${obj.y}${p.layerIndex ? ' ' + p.layerIndex : ''}\n`;
                const npcCode = (p.code || '').replace(/\n+$/, '');
                out += (npcCode ? npcCode + '\n' : '') + 'NPCEND\n\n';
            }
        }
        if (this.tilesetName) out += `TILESET ${this.tilesetName}\n`;
        return out;
    }

    static loadFromNW(text) {
        const base64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        const lines = text.split('\n').map(l => l.trimEnd());
        if (!lines[0] || lines[0].trim() !== 'GLEVNW01') return new Level();
        const level = new Level(64, 64);
        const tilesPerRow = 128;
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line) continue;
            const words = line.split(' ');
            const cmd = words[0];
            if (cmd === 'BOARD' && words.length >= 6) {
                const bx = parseInt(words[1]), by = parseInt(words[2]), bw = parseInt(words[3]), blayer = parseInt(words[4]);
                const td = words[5];
                if (blayer < 0) continue;
                while (blayer >= level.layers.length) level.layers.push(level.createEmptyLayer());
                for (let ii = 0; ii < bw && ii * 2 + 1 < td.length; ii++) {
                    const b1 = base64.indexOf(td[ii * 2]), b2 = base64.indexOf(td[ii * 2 + 1]);
                    if (b1 < 0 || b2 < 0) continue;
                    const g = (b1 << 6) + b2;
                    const tx = (g & 0xF) + 16 * Math.floor((g >> 4) / 32);
                    const ty = (g >> 4) % 32;
                    level.setTile(blayer, bx + ii, by, ty * tilesPerRow + tx);
                }
            } else if (cmd === 'TILESET' && words.length >= 2) {
                level.tilesetName = words[1];
            } else if (cmd === 'CHEST' && words.length >= 5) {
                const obj = new LevelObject(parseInt(words[1]), parseInt(words[2]), 'chest');
                obj.properties = { itemName: words[3], signIndex: parseInt(words[4]), layerIndex: words[5] ? parseInt(words[5]) : 0 };
                level.addObject(obj);
            } else if (cmd === 'BADDY' && words.length >= 4) {
                const obj = new LevelObject(parseInt(words[1]), parseInt(words[2]), 'baddy');
                const verses = [];
                for (++i; i < lines.length && lines[i] !== 'BADDYEND'; ++i) verses.push(lines[i]);
                obj.properties = { baddyType: parseInt(words[3]), layerIndex: words[4] ? parseInt(words[4]) : 0, verses };
                level.addObject(obj);
            } else if (cmd === 'SIGN' && words.length >= 3) {
                const obj = new LevelObject(parseInt(words[1]), parseInt(words[2]), 'sign');
                let text = '';
                for (++i; i < lines.length && lines[i] !== 'SIGNEND'; ++i) text += lines[i] + '\n';
                obj.properties = { layerIndex: words[3] ? parseInt(words[3]) : 0, text };
                level.addObject(obj);
            } else if (cmd === 'LINK' && words.length >= 8) {
                let _lni = 1;
                while (_lni < words.length && !/^-?\d+(\.\d+)?$/.test(words[_lni])) _lni++;
                const _lnv = words.slice(1, _lni).join(' ');
                const obj = new LevelObject(parseInt(words[_lni]), parseInt(words[_lni+1]), 'link');
                obj.properties = { nextLevel: _lnv === '-' ? '' : _lnv, width: parseInt(words[_lni+2]), height: parseInt(words[_lni+3]), nextX: words[_lni+4]||'0', nextY: words[_lni+5]||'0', nextLayer: words[_lni+6] ? parseInt(words[_lni+6]) : 0, layerIndex: words[_lni+7] ? parseInt(words[_lni+7]) : 0 };
                level.addObject(obj);
            } else if (cmd === 'NPC' && words.length >= 4) {
                const obj = new LevelObject(parseFloat(words[2]), parseFloat(words[3]), 'npc');
                let code = '';
                for (++i; i < lines.length && lines[i] !== 'NPCEND'; ++i) code += lines[i] + '\n';
                code = code.replace(/\n+$/, '');
                obj.properties = { image: words[1] === '-' ? '' : words[1], layerIndex: words[4] ? parseInt(words[4]) : 0, code };
                level.addObject(obj);
            }
        }
        return level;
    }

    static loadFromGraal(buffer) {
        const data = new Uint8Array(buffer);
        if (data.length < 9) return null;
        const header = String.fromCharCode(...data.slice(0, 8));
        const isZelda = header.startsWith('Z3'), isGraal = header.startsWith('GR');
        if (!isZelda && !isGraal) return null;
        const bits = (header === 'GR-V1.02' || header === 'GR-V1.03') ? 13 : 12;
        const controlBit = bits === 12 ? 0x800 : 0x1000;
        const hasNPCs = isGraal, hasChests = header === 'GR-V1.02' || header === 'GR-V1.03';
        const level = new Level(64, 64);
        level._sourceFormat = isZelda ? 'zelda' : 'graal';
        const TROW = 128;
        const cvt = g => { const tx = (g & 0xF) + 16 * Math.floor((g >> 4) / 32); return ((g >> 4) % 32) * TROW + tx; };
        const board = [];
        let pos = 8, buf = 0, read = 0, count = 1, doubleMode = false, tileA;
        while (board.length < 4096 && pos < data.length) {
            while (read < bits && pos < data.length) { buf += data[pos++] << read; read += 8; }
            if (read < bits) break;
            const code = buf & ((1 << bits) - 1); buf >>>= bits; read -= bits;
            if (code & controlBit) { if (code & 0x100) doubleMode = true; count = code & 0xFF; continue; }
            if (count === 1) { board.push(cvt(code)); }
            else if (doubleMode) {
                if (tileA === undefined) { tileA = code; continue; }
                for (let i = 0; i < count && board.length < 4095; i++) { board.push(cvt(tileA)); board.push(cvt(code)); }
                tileA = undefined; doubleMode = false; count = 1;
            } else { for (let i = 0; i < count && board.length < 4096; i++) board.push(cvt(code)); count = 1; }
        }
        for (let i = 0; i < 4096; i++) level.layers[0].tiles[i] = board[i] ?? 0;
        const readLine = () => { let s = ''; while (pos < data.length && data[pos] !== 0x0A) s += String.fromCharCode(data[pos++]); if (pos < data.length) pos++; return s.replace(/\r$/, ''); };
        while (pos < data.length) {
            const line = readLine(); if (line.trim() === '#') break;
            const p = line.split(' ');
            if (p.length >= 7) { let _lni = 0; while (_lni < p.length && !/^-?\d+(\.\d+)?$/.test(p[_lni])) _lni++; const _lnv = p.slice(0, _lni).join(' '); const obj = new LevelObject(parseFloat(p[_lni]), parseFloat(p[_lni+1]), 'link'); obj.properties = { nextLevel: _lnv === '-' ? '' : _lnv, width: parseFloat(p[_lni+2]), height: parseFloat(p[_lni+3]), nextX: p[_lni+4]||'0', nextY: p[_lni+5]||'0' }; level.addObject(obj); }
        }
        while (pos + 2 < data.length) {
            const x = data[pos] > 127 ? data[pos] - 256 : data[pos]; pos++;
            const y = data[pos] > 127 ? data[pos] - 256 : data[pos]; pos++;
            const t = data[pos] > 127 ? data[pos] - 256 : data[pos]; pos++;
            const vl = readLine(); if (x === -1 && y === -1 && t === -1) break;
            const v = vl.split('\\'); const obj = new LevelObject(x, y, 'baddy');
            obj.properties = { baddyType: t, verses: [v[0]||'', v[1]||'', v[2]||''] }; level.addObject(obj);
        }
        if (hasNPCs) {
            while (pos < data.length) {
                const line = readLine(); if (!line || line.trim() === '#') break;
                if (line.length < 2) continue;
                const nx = line.charCodeAt(0) - 32, ny = line.charCodeAt(1) - 32;
                const hi = line.indexOf('#', 2);
                const image = hi > 2 ? line.substring(2, hi) : '';
                const code = (hi >= 0 ? line.substring(hi + 1) : '').replace(/\xA7/g, '\n');
                const obj = new LevelObject(nx, ny, 'npc'); obj.properties = { image, code }; level.addObject(obj);
            }
        }
        if (hasChests) {
            while (pos < data.length) {
                const line = readLine(); if (!line || line.trim() === '#') break;
                if (line.length < 4) continue;
                const obj = new LevelObject(line.charCodeAt(0) - 32, line.charCodeAt(1) - 32, 'chest');
                obj.properties = { itemName: CHEST_ITEMS[line.charCodeAt(2) - 32] || 'greenrupee', signIndex: line.charCodeAt(3) - 32 }; level.addObject(obj);
            }
        }
        while (pos < data.length) {
            const line = readLine(); if (!line || line.length < 2) continue;
            const obj = new LevelObject(line.charCodeAt(0) - 32, line.charCodeAt(1) - 32, 'sign');
            obj.properties = { text: _decodeSign(line.substring(2)) }; level.addObject(obj);
        }
        return level;
    }

    saveToGraal(isZelda = false) {
        const header = isZelda ? 'Z3-V1.04' : 'GR-V1.03';
        const bits = isZelda ? 12 : 13, hasNPCs = !isZelda, hasChests = !isZelda;
        const TROW = this.tilesetImage ? Math.floor(this.tilesetImage.width / this.tileWidth) : 128;
        const result = [...header].map(c => c.charCodeAt(0));
        let buf = 0, bc = 0;
        const flush = () => { while (bc >= 8) { result.push(buf & 0xFF); buf >>>= 8; bc -= 8; } };
        for (let i = 0; i < 4096; i++) {
            const idx = Math.max(0, this.layers[0].tiles[i] ?? 0);
            const tx = idx % TROW, ty = Math.floor(idx / TROW);
            buf |= (Math.floor(tx / 16) * 512 + (tx % 16) + ty * 16) << bc; bc += bits; flush();
        }
        if (bc > 0) { result.push(buf & 0xFF); }
        const pushStr = s => { for (let i = 0; i < s.length; i++) result.push(s.charCodeAt(i)); };
        for (const obj of this.objects.filter(o => o.type === 'link')) { const p = obj.properties; pushStr(`${p.nextLevel||'-'} ${obj.x} ${obj.y} ${p.width||1} ${p.height||1} ${p.nextX||0} ${p.nextY||0}\n`); }
        result.push(0x23, 0x0A);
        for (const obj of this.objects.filter(o => o.type === 'baddy')) { result.push(obj.x & 0xFF, obj.y & 0xFF, (obj.properties?.baddyType||0) & 0xFF); const v = obj.properties?.verses||['','','']; pushStr(`${v[0]}\\${v[1]}\\${v[2]}\n`); }
        result.push(0xFF, 0xFF, 0xFF, 0x0A);
        if (hasNPCs) {
            for (const obj of this.objects.filter(o => o.type === 'npc')) { const img = obj.properties?.image||''; const code = (obj.properties?.code||'').replace(/\n/g, '\xA7'); pushStr(`${String.fromCharCode(32+Math.max(0,Math.floor(obj.x)))}${String.fromCharCode(32+Math.max(0,Math.floor(obj.y)))}${img}#${code}\n`); }
            result.push(0x23, 0x0A);
        }
        if (hasChests) {
            for (const obj of this.objects.filter(o => o.type === 'chest')) { const ii = CHEST_ITEMS.indexOf(obj.properties?.itemName||'greenrupee'); if (ii < 0) continue; pushStr(`${String.fromCharCode(32+Math.floor(obj.x))}${String.fromCharCode(32+Math.floor(obj.y))}${String.fromCharCode(32+ii)}${String.fromCharCode(32+(obj.properties?.signIndex||0))}\n`); }
            result.push(0x23, 0x0A);
        }
        for (const obj of this.objects.filter(o => o.type === 'sign')) { pushStr(`${String.fromCharCode(32+Math.floor(obj.x))}${String.fromCharCode(32+Math.floor(obj.y))}${_encodeSign(obj.properties?.text||'')}\n`); }
        return new Uint8Array(result);
    }
}

class LevelEditor {
    constructor() {
        this.levels = [];
        this.currentLevelIndex = -1;
        this.level = new Level();
        this.selectedTile = -1;
        this.defaultTile = 0;
        this.currentLayer = 0;
        this.floodFillEnabled = false;
        this.linkEditMode = false;
        this.signEditMode = false;
        this.zoom = 1.0;
        this.zoomLevel = 5;
        this.panX = 0;
        this.panY = 0;
        this.showGrid = localStorage.getItem('levelEditor_showGrid') !== 'false';
        this.snapGrid = true;
        this.fadeInactiveLayers = true;
        this.isDrawing = false;
        this.lastDrawX = -1;
        this.lastDrawY = -1;
        this.isResizingSelection = false;
        this.resizeHandle = null;
        this.resizeStartX = 0;
        this.resizeStartY = 0;
        this.resizeStartSelectionX = 0;
        this.resizeStartSelectionY = 0;
        this.resizeStartSelectionEndX = 0;
        this.resizeStartSelectionEndY = 0;
        this.panAnimationFrame = null;
        this.canvas = document.getElementById('mainCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.tilesetCanvas = null;

        this.objectMode = false;
        this.selectedObjectType = 'chest';
        this.selectedObject = null;
        this._clipboardTiles = null;
        this.resizingLink = null;
        this.resizingLinkHandle = null;
        this.resizingLinkStartX = 0;
        this.resizingLinkStartY = 0;
        this.resizingLinkStartW = 0;
        this.resizingLinkStartH = 0;
        this._marchOffset = 0;

        this.brushWidth = 1;
        this.brushHeight = 1;
        this.tileTranslucency = 0;
        this.currentTool = 'select';
        this.selectionStartX = -1;
        this.selectionStartY = -1;
        this.selectionEndX = -1;
        this.selectionEndY = -1;
        this.isSelecting = false;
        this.isMovingSelection = false;
        this.selectionOffsetX = 0;
        this.selectionOffsetY = 0;
        this.selectionTiles = null;
        this.originalSelectionX = -1;
        this.originalSelectionY = -1;
        this._stampTilesLifted = false;
        this.workingDirectory = '';
        this.fileCache = { images: new Map(), ganis: new Map(), ganiTexts: new Map(), sounds: new Map(), levels: new Map() };
        this._tauriPathIndex = new Map();
        this.isDraggingFromTileset = false;
        this.draggedTileIndex = -1;
        this.dragMouseX = 0;
        this.dragMouseY = 0;
        this.isSelectingTileset = false;
        this.tilesetSelectionStartX = -1;
        this.tilesetSelectionStartY = -1;
        this.tilesetSelectionEndX = -1;
        this.tilesetSelectionEndY = -1;
        this.selectedTilesetTiles = null;
        this.isDraggingTileSelection = false;
        this.tileSelectionDragStartX = 0;
        this.tileSelectionDragStartY = 0;
        this.tileSelectionDragX = 0;
        this.tileSelectionDragY = 0;
        this.tilesetZoom = parseFloat(localStorage.getItem('levelEditor_tilesetZoom') || '2');
        this.tilesetZoomLevel = 1;
        this.isPanning = false;
        this.panStartX = 0;
        this.panStartY = 0;
        this.panStartPanX = 0;
        this.panStartPanY = 0;
        this.isPanningTileset = false;
        this.tilesetPanStartX = 0;
        this.tilesetPanStartY = 0;
        this.tilesetPanStartScrollLeft = 0;
        this.tilesetPanStartScrollTop = 0;
        this.undoStack = [];
        this.redoStack = [];
        this.draggingObject = null;
        this.draggingObjectOffsetX = 0;
        this.draggingObjectOffsetY = 0;
        this.draggingNewObjectType = null;
        this.draggingNewObjectX = 0;
        this.draggingNewObjectY = 0;
        this.newTabCounter = 0;

        this.init();
    }

    init() {
        this._initLoader = this.showLoadingMessage('Loading Level Editor...');
        this.initMonaco();
        document.addEventListener('contextmenu', (e) => e.preventDefault());
        this.setupCanvas();
        this.setupEventListeners();
        this.updateZoomFromLevel();
        this.updateUI();
        this.initTileObjects();
        this.objectImages = {};
        ['npc','sign','chest','baddy','opps'].forEach(t => { const img = new Image(); img.src = `images/${t}.png`; this.objectImages[t] = img; });
        this.setTool(this.currentTool);
        this.loadDefaultTileset();
        this.initColorScheme();
        if (_isTauri) this.restoreWorkspaceFromCache().catch(() => {});
        this._applyUISettings(this._getSettings());
        this.loadDefaultObjects().catch(() => {});
    }

    requestRender() {
        if (this._renderPending) return;
        this._renderPending = true;
        requestAnimationFrame(() => { this._renderPending = false; this.render(); });
    }

    setupCanvas() {
        this.resizeCanvas();
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.updateTilesetDisplay();
        });
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        if (container) {
            const rect = container.getBoundingClientRect();
            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
        }
        this.render();
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        document.querySelectorAll('.splitter-handle').forEach(handle => {
            handle.addEventListener('mousedown', (e) => {
                e.preventDefault();
                const prev = handle.previousElementSibling;
                const next = handle.nextElementSibling;
                if (!prev || !next) return;
                const prevIsFlex = getComputedStyle(prev).flexGrow > 0;
                const nextIsFlex = getComputedStyle(next).flexGrow > 0;
                const target = prevIsFlex ? next : prev;
                const targetMin = parseInt(getComputedStyle(target).minWidth) || 50;
                const targetMax = parseInt(target.style.maxWidth) || 800;
                const startX = e.clientX;
                const startW = target.getBoundingClientRect().width;
                const sign = prevIsFlex ? -1 : 1;
                const onMove = (ev) => {
                    let newW = startW + (ev.clientX - startX) * sign;
                    newW = Math.max(targetMin, Math.min(targetMax, newW));
                    target.style.width = newW + 'px';
                    target.style.flex = 'none';
                    this.resizeCanvas();
                    this.updateTilesetDisplay();
                };
                const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); document.body.style.cursor = ''; document.body.style.userSelect = ''; };
                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onUp);
                document.body.style.cursor = 'col-resize';
                document.body.style.userSelect = 'none';
            });
        });
        this.canvas.addEventListener('auxclick', (e) => { if (e.button === 2) e.preventDefault(); });

        document.getElementById('btnNew').addEventListener('click', () => this.newLevel());
        document.getElementById('btnOpen').addEventListener('click', () => this.openLevel());
        document.getElementById('btnOpenDefault')?.addEventListener('click', () => this.openDefaultLevelDialog());
        document.getElementById('btnSave').addEventListener('click', () => this.saveLevel());
        document.getElementById('btnSaveAs').addEventListener('click', () => this.saveLevelAs());
        document.getElementById('btnTilesetOrder').addEventListener('click', () => { this.tilesetOrder(); });
        document.getElementById('tilesetsCombo').addEventListener('change', (e) => this.selectTileset(e.target.value));
        try { const tc = JSON.parse(localStorage.getItem('levelEditor_tilesetCache')||'{}'); if (tc && typeof tc === 'object') { this._tilesetDataCache = tc; const combo = document.getElementById('tilesetsCombo'); for (const name of Object.keys(tc)) { if (combo && ![...combo.options].some(o => o.value === name)) { const o = document.createElement('option'); o.value = o.textContent = name; combo.appendChild(o); } } } } catch(e) {}
        document.getElementById('btnRefreshTileset').addEventListener('click', () => this.refreshTileset());
        document.getElementById('btnNewTileset').addEventListener('click', () => this.newTileset());
        document.getElementById('btnLoadTileset').addEventListener('click', () => this.loadTileset());
        document.getElementById('btnDeleteTileset').addEventListener('click', () => this.deleteTileset());
        document.getElementById('btnEditTileset').addEventListener('click', () => this.editTileset());
        const tzSlider = document.getElementById('tilesetZoomSlider');
        const tzLabel = document.getElementById('tilesetZoomLabel');
        if (tzSlider) { tzSlider.value = this.tilesetZoom; if (tzLabel) tzLabel.textContent = this.tilesetZoom + 'x'; tzSlider.addEventListener('input', () => { this.tilesetZoom = parseFloat(tzSlider.value); if (tzLabel) tzLabel.textContent = this.tilesetZoom + 'x'; localStorage.setItem('levelEditor_tilesetZoom', this.tilesetZoom); this.updateTilesetDisplay(); }); }
        document.getElementById('selectedTileCanvas').addEventListener('dblclick', () => this.clearSelectedTile());

        document.getElementById('btnGrid').addEventListener('click', () => this.toggleGrid());
        document.getElementById('btnCenterView').addEventListener('click', () => this.centerView());
        document.getElementById('btnSnapGrid').addEventListener('click', () => this.toggleSnapGrid());
        const btnUndo = document.getElementById('btnUndo');
        if (btnUndo) btnUndo.addEventListener('click', () => this.undo());
        const btnRedo = document.getElementById('btnRedo');
        if (btnRedo) btnRedo.addEventListener('click', () => this.redo());
        const btnCut = document.getElementById('btnCut');
        if (btnCut) btnCut.addEventListener('click', () => this._doCut());
        const btnCopy = document.getElementById('btnCopy');
        if (btnCopy) btnCopy.addEventListener('click', () => this._doCopy());
        const btnPaste = document.getElementById('btnPaste');
        if (btnPaste) btnPaste.addEventListener('click', () => this._doPaste());
        const btnDelete = document.getElementById('btnDelete');
        if (btnDelete) btnDelete.addEventListener('click', () => this._doDelete());
        const btnDraw = document.getElementById('btnDraw');
        if (btnDraw) btnDraw.addEventListener('click', () => this.setTool('draw'));
        const btnFill = document.getElementById('btnFillTool');
        if (btnFill) btnFill.addEventListener('click', () => { this.floodFillEnabled = !this.floodFillEnabled; if (this.floodFillEnabled) this.setTool('draw'); btnFill.classList.toggle('active', this.floodFillEnabled); });
        const btnEraser = document.getElementById('btnEraserTool');
        if (btnEraser) btnEraser.addEventListener('click', () => this.setTool('eraser'));
        const btnSelect = document.getElementById('btnSelect');
        if (btnSelect) btnSelect.addEventListener('click', () => { this.objectMode = false; this.setTool('select'); });
        const btnCloseAll = document.getElementById('btnCloseAll');
        if (btnCloseAll) btnCloseAll.addEventListener('click', () => this.closeAllTabs());
        const btnResetEditor = document.getElementById('btnResetEditor');
        if (btnResetEditor) btnResetEditor.addEventListener('click', () => this.resetEditor());

        const setupDragPlace = (id, type) => {
            const btn = document.getElementById(id);
            if (!btn) return;
            btn.addEventListener('mousedown', (e) => {
                if (e.button !== 0) return;
                if (this._currentLevelIsZelda() && (type === 'npc' || type === 'chest')) return;
                this.draggingNewObjectType = type;
                this.setObjectMode(type);
                e.preventDefault();
            });
        };
        setupDragPlace('btnPlaceBaddy', 'baddy');
        setupDragPlace('btnPlaceNPC', 'npc');
        setupDragPlace('btnPlaceChest', 'chest');
        setupDragPlace('btnPlaceSign', 'sign');
        setupDragPlace('btnPlaceLink', 'link');
        document.getElementById('btnDeleteObject')?.addEventListener('click', () => this.setObjectMode('delete'));
        const btnTileMode = document.getElementById('btnTileMode');
        if (btnTileMode) btnTileMode.addEventListener('click', () => { this.draggingNewObjectType = null; this.setObjectMode(null); });

        document.addEventListener('mousemove', (e) => {
            if (!this.draggingNewObjectType || !this.level) return;
            const { rect, scaleX, scaleY } = this._canvasRect();
            const tw = this.level.tileWidth || 16;
            const th = this.level.tileHeight || 16;
            this.draggingNewObjectX = Math.floor(((e.clientX - rect.left) * scaleX - Math.floor(this.panX)) / (tw * this.zoom));
            this.draggingNewObjectY = Math.floor(((e.clientY - rect.top) * scaleY - Math.floor(this.panY)) / (th * this.zoom));
            this.dragMouseX = e.clientX;
            this.dragMouseY = e.clientY;
            this.requestRender();
        });
        document.addEventListener('mouseup', (e) => {
            if (!this.draggingNewObjectType || e.button !== 0) return;
            const rect = this.canvas.getBoundingClientRect();
            if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
                const tw = this.level?.tileWidth || 16;
                const th = this.level?.tileHeight || 16;
                const { scaleX: sx, scaleY: sy } = this._canvasRect();
                const tx = Math.floor(((e.clientX - rect.left) * sx - Math.floor(this.panX)) / (tw * this.zoom));
                const ty = Math.floor(((e.clientY - rect.top) * sy - Math.floor(this.panY)) / (th * this.zoom));
                const type = this.draggingNewObjectType;
                this.draggingNewObjectType = null;
                this.selectedObjectType = type;
                this.placeObjectAt(tx, ty);
            } else {
                this.draggingNewObjectType = null;
                this._pendingCloneObj = null;
                this._dragObjectLibItem = null;
            }
            this.setObjectMode(null);
            this.requestRender();
        });

        this.initRightTabs();

        document.getElementById('btnResizeLevel')?.addEventListener('click', () => this.resizeLevel());
        document.getElementById('btnRefreshNPCList')?.addEventListener('click', () => this.refreshNPCList());

        const btnWorkingDir = document.getElementById('btnWorkingDir');
        if (btnWorkingDir) btnWorkingDir.addEventListener('click', () => this.setWorkingDirectory());
        const btnBrowseObjectsDir = document.getElementById('btnBrowseObjectsDir');
        if (btnBrowseObjectsDir) btnBrowseObjectsDir.addEventListener('click', () => this.setWorkingDirectory());
        document.getElementById('btnBrowseObjectsLib')?.addEventListener('click', () => this.loadObjectsLibrary());
        document.getElementById('btnExportNPC')?.addEventListener('click', () => this.exportSelectedNPC());
        document.getElementById('btnExportNPC2')?.addEventListener('click', () => this.exportSelectedNPC());
        document.querySelectorAll('.left-tab').forEach(tab => tab.addEventListener('click', () => {
            document.querySelectorAll('.left-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const panel = tab.dataset.panel;
            document.getElementById('leftPanelWorkdir').style.display = panel === 'workdir' ? 'flex' : 'none';
            document.getElementById('leftPanelObjects').style.display = panel === 'objects' ? 'flex' : 'none';
        }));
        const _resizeSel = (axis, delta) => {
            if (!this.hasSelection()) return;
            const sx = Math.min(this.selectionStartX, this.selectionEndX);
            const sy = Math.min(this.selectionStartY, this.selectionEndY);
            const ex = Math.max(this.selectionStartX, this.selectionEndX);
            const ey = Math.max(this.selectionStartY, this.selectionEndY);
            if (axis === 'w') { const nw = (ex - sx + 1) + delta; if (nw < 1) return; this.selectionEndX = this.selectionStartX >= this.selectionEndX ? sx : sx + nw - 1; }
            else { const nh = (ey - sy + 1) + delta; if (nh < 1) return; this.selectionEndY = this.selectionStartY >= this.selectionEndY ? sy : sy + nh - 1; }
            this.updateSelectionInfo();
            this.render();
        };
        const btnWidthUp = document.getElementById('btnWidthUp');
        if (btnWidthUp) btnWidthUp.addEventListener('click', () => _resizeSel('w', 1));
        const btnWidthDown = document.getElementById('btnWidthDown');
        if (btnWidthDown) btnWidthDown.addEventListener('click', () => _resizeSel('w', -1));
        const btnHeightUp = document.getElementById('btnHeightUp');
        if (btnHeightUp) btnHeightUp.addEventListener('click', () => _resizeSel('h', 1));
        const btnHeightDown = document.getElementById('btnHeightDown');
        if (btnHeightDown) btnHeightDown.addEventListener('click', () => _resizeSel('h', -1));
        const brushWidth = document.getElementById('brushWidth');
        if (brushWidth) brushWidth.addEventListener('change', (e) => { const v = parseInt(e.target.value); if (v > 0 && this.hasSelection()) { const sx = Math.min(this.selectionStartX, this.selectionEndX); const cw = Math.abs(this.selectionEndX - this.selectionStartX) + 1; _resizeSel('w', v - cw); } });
        const brushHeight = document.getElementById('brushHeight');
        if (brushHeight) brushHeight.addEventListener('change', (e) => { const v = parseInt(e.target.value); if (v > 0 && this.hasSelection()) { const ch = Math.abs(this.selectionEndY - this.selectionStartY) + 1; _resizeSel('h', v - ch); } });
        const zoomSlider = document.getElementById('zoomSlider');
        if (zoomSlider) {
            zoomSlider.addEventListener('input', (e) => {
                this.zoomLevel = parseInt(e.target.value);
                this.updateZoomFromLevel();
            });
        }
        const tileTranslucencyValue = document.getElementById('tileTranslucencyValue');
        if (tileTranslucencyValue) {
            tileTranslucencyValue.addEventListener('change', (e) => {
                this.tileTranslucency = Math.max(0, Math.min(15, parseInt(e.target.value) || 0));
            });
        }
        const btnTileTranslucencyUp = document.getElementById('btnTileTranslucencyUp');
        if (btnTileTranslucencyUp) {
            btnTileTranslucencyUp.addEventListener('click', () => {
                this.tileTranslucency = Math.min(15, this.tileTranslucency + 1);
                if (tileTranslucencyValue) tileTranslucencyValue.value = this.tileTranslucency;
            });
        }
        const btnTileTranslucencyDown = document.getElementById('btnTileTranslucencyDown');
        if (btnTileTranslucencyDown) {
            btnTileTranslucencyDown.addEventListener('click', () => {
                this.tileTranslucency = Math.max(0, this.tileTranslucency - 1);
                if (tileTranslucencyValue) tileTranslucencyValue.value = this.tileTranslucency;
            });
        }

        this.canvas.addEventListener('dblclick', (e) => this.handleCanvasDblClick(e));
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.getElementById('btnEditLinks')?.addEventListener('click', () => this.openEditLinksDialog());
        document.getElementById('btnNewLink')?.addEventListener('click', () => {
            if (!this.hasSelection()) return;
            const sx = Math.min(this.selectionStartX, this.selectionEndX);
            const sy = Math.min(this.selectionStartY, this.selectionEndY);
            const sw = Math.abs(this.selectionEndX - this.selectionStartX) + 1;
            const sh = Math.abs(this.selectionEndY - this.selectionStartY) + 1;
            this.pushUndo();
            const obj = new LevelObject(sx, sy, 'link');
            obj.properties = { nextLevel: '', width: sw, height: sh, nextX: '0', nextY: '0', nextLayer: 0, layerIndex: 0 };
            this.level.addObject(obj);
            this.render(); this.saveSessionDebounced();
            this.openLinkEditor(obj);
        });
        document.getElementById('btnEditSigns')?.addEventListener('click', () => this.openEditSignsDialog());
        document.getElementById('btnNewSign')?.addEventListener('click', () => {
            if (!this.hasSelection()) return;
            const sx = Math.min(this.selectionStartX, this.selectionEndX);
            const sy = Math.min(this.selectionStartY, this.selectionEndY);
            this.pushUndo();
            const obj = new LevelObject(sx, sy, 'sign');
            obj.properties = { text: '', layerIndex: 0 };
            this.level.addObject(obj);
            this.render(); this.saveSessionDebounced();
            this.openSignEditor(obj);
        });
        const btnScreenshot = document.getElementById('btnScreenshot');
        if (btnScreenshot) btnScreenshot.addEventListener('click', () => this.generateScreenshot());
        ['visNPCs','visCharacters','visLinks','visSigns'].forEach(id => {
            const cb = document.getElementById(id);
            if (cb) cb.addEventListener('change', () => this.render());
        });
        [0,1,2].forEach(i => {
            const cb = document.getElementById(`visLayer${i}`);
            if (cb) cb.addEventListener('change', () => { if (this.level.layers[i]) { this.level.layers[i].visible = cb.checked; this.render(); } });
        });
        const layerSpin = document.getElementById('layerSpinbox');
        if (layerSpin) {
            const setLayer = (v) => { this.setCurrentLayer(v); layerSpin.value = this.currentLayer; this.updateUI(); };
            layerSpin.addEventListener('change', () => setLayer(parseInt(layerSpin.value) || 0));
            document.getElementById('btnLayerUp')?.addEventListener('click', () => setLayer(this.currentLayer + 1));
            document.getElementById('btnLayerDown')?.addEventListener('click', () => setLayer(this.currentLayer - 1));
            const fadeBtn = document.getElementById('btnFadeLayers');
            if (fadeBtn) fadeBtn.addEventListener('click', () => { this.fadeInactiveLayers = !this.fadeInactiveLayers; fadeBtn.classList.toggle('active', this.fadeInactiveLayers); this.render(); });
        }
        document.getElementById('btnAddLayer')?.addEventListener('click', () => this.addLayer());
        document.getElementById('btnDeleteLayer')?.addEventListener('click', () => this.deleteLayer());
        const btnAbout = document.getElementById('btnAbout');
        if (btnAbout) btnAbout.addEventListener('click', () => window.openInfoDialog?.('about'));
        if (_isTauri) {
            document.querySelectorAll('.btn-check-update').forEach(btn => {
                btn.style.display = '';
                btn.addEventListener('click', async () => {
                    if (document.getElementById('_updateDlg')) return;
                    btn.disabled = true;
                    const showUpdateDlg = (msg, isError = false) => {
                        const existing = document.getElementById('_updateDlg');
                        if (existing) existing.remove();
                        const box = document.createElement('div');
                        box.id = '_updateDlg';
                        box.style.cssText = 'position:fixed;top:80px;left:calc(50% - 180px);width:360px;z-index:10000;display:flex;flex-direction:column;background:#2b2b2b;border:2px solid #1a1a1a;';
                        box.classList.add('ed-dialog-box');
                        box.innerHTML = `
                            <div style="padding:8px 12px;font-size:13px;display:flex;align-items:center;justify-content:space-between;user-select:none;background:#353535;flex-shrink:0;" class="_udlg-title">
                                <span>Check for Updates</span>
                                <button id="_updateDlgClose" style="background:none;border:none;cursor:pointer;font-size:16px;line-height:1;">×</button>
                            </div>
                            <div style="padding:16px;font-size:13px;${isError?'color:#ff6b6b;':''}font-family:chevyray,monospace;">${msg}</div>
                        `;
                        document.body.appendChild(box);
                        box.querySelector('#_updateDlgClose').addEventListener('click', () => { box.remove(); btn.disabled = false; });
                    };
                    showUpdateDlg('Checking for updates...');
                    _tauri.core.invoke('check_for_update').then(() => {
                        showUpdateDlg('Update found! Downloading and installing...');
                    }).catch(e => {
                        if (e === 'up_to_date') showUpdateDlg('You\'re up to date!');
                        else showUpdateDlg(`Update check failed:\n${e}`, true);
                        btn.disabled = false;
                    });
                });
            });
        }
        document.getElementById('btnSettings')?.addEventListener('click', () => this.openSettingsDialog());
        document.getElementById('btnPlay')?.addEventListener('click', () => this.togglePlayMode());
        document.getElementById('btnPlayerSetup')?.addEventListener('click', () => this.openPlayerCustomizeDialog());
    }

    handleMouseDown(e) {
        if (!this.level) return;
        if (this._playMode && !this._editBypass) return;
        const coords = this.getCanvasCoords(e);
        if (this._linkPickMode && e.button === 0) {
            const tw = this.level.tileWidth || 16, th = this.level.tileHeight || 16;
            const hitLink = this.level.objects?.find(o => {
                if (o.type !== 'link') return false;
                const p2 = o.properties || {};
                return coords.x >= o.x * tw && coords.x < (o.x + (p2.width||2)) * tw && coords.y >= o.y * th && coords.y < (o.y + (p2.height||2)) * th;
            });
            if (hitLink) {
                const lp = hitLink.properties || {}, tw2 = this.level.tileWidth||16, th2 = this.level.tileHeight||16;
                const x1 = hitLink.x, y1 = hitLink.y, x2 = hitLink.x + (lp.width||2) - 1, y2 = hitLink.y + (lp.height||2) - 1;
                this._showLinkPickConfirm({ nextLevel: lp.nextLevel||'', nextX: lp.nextX||'0', nextY: lp.nextY||'0', x1, y1, x2, y2, existingLink: true });
            } else {
                const tx = Math.floor(coords.x / tw), ty = Math.floor(coords.y / th);
                this._linkPickDrag = { sx: tx, sy: ty, ex: tx, ey: ty };
                this.requestRender();
            }
            e.preventDefault(); e.stopPropagation(); return;
        }

        if (e.button === 2) {
            const rObj = this.level.getObjectAt(coords.x, coords.y, (o, wx, wy) => this._npcPixelHit(o, wx, wy));
            if (rObj) {
                if (rObj.type === 'npc' && !this._currentLevelIsZelda()) {
                    this.draggingNewObjectType = 'npc';
                    this._pendingCloneObj = JSON.parse(JSON.stringify(rObj.properties));
                    this.setObjectMode('npc');
                    e.preventDefault(); return;
                }
                this.handleCanvasDblClick(e); e.preventDefault(); return;
            }
            if (this.selectedTilesetTiles) {
                this.selectedTilesetTiles = null;
                this.isDraggingTileSelection = false;
                this.updateSelectedTileDisplay();
                this.requestRender();
                e.preventDefault();
                return;
            }
            if (this.hasSelection()) {
                if (this.isPointInSelection(coords.x, coords.y)) {
                    this.selectedTilesetTiles = this._captureSelectionAsStamp();
                    this.updateSelectedTileDisplay();
                    e.preventDefault();
                    return;
                }
                this.selectionStartX = -1; this.selectionStartY = -1; this.selectionEndX = -1; this.selectionEndY = -1;
                this.selectionTiles = null; this.resizeOrigTiles = null; this._floatingStamp = false; this._floatingStampCanvas = false; this._stampTilesLifted = false;
                this.requestRender();
            }
            this.isPanning = true;
            this.panStartX = e.clientX;
            this.panStartY = e.clientY;
            this.panStartPanX = this.panX;
            this.panStartPanY = this.panY;
            e.preventDefault();
        }
        if (e.button === 1) {
            this.isPanning = true;
            this.panStartX = e.clientX;
            this.panStartY = e.clientY;
            this.panStartPanX = this.panX;
            this.panStartPanY = this.panY;
            e.preventDefault();
        } else if (e.button === 0) {
            if (this.currentTool === 'pick' || this.currentTool === 'equal') {
                if (coords.x >= 0 && coords.x < this.level.width && coords.y >= 0 && coords.y < this.level.height) {
                    const tileIndex = this.level.getTile(this.currentLayer, coords.x, coords.y);
                    if (tileIndex >= 0) this.selectTile(tileIndex);
                }
                e.preventDefault();
                return;
            }
            const linkHandle = this.getLinkResizeHandle(e.clientX, e.clientY);
            if (linkHandle) {
                const obj = this.selectedObject;
                this.pushUndo();
                this.resizingLink = obj;
                this.resizingLinkHandle = linkHandle;
                this.resizingLinkStartX = coords.x;
                this.resizingLinkStartY = coords.y;
                this.resizingLinkStartW = obj.properties?.width || 2;
                this.resizingLinkStartH = obj.properties?.height || 2;
                this.resizingLinkObjX = obj.x;
                this.resizingLinkObjY = obj.y;
                e.preventDefault();
                return;
            }
            const filterNPCs = document.getElementById('filterNPCs')?.checked !== false;
            const filterLinks = document.getElementById('filterLinks')?.checked !== false;
            const filterSigns = document.getElementById('filterSigns')?.checked !== false;
            let hitObj = this.level.getObjectAt(coords.x, coords.y, (o, wx, wy) => this._npcPixelHit(o, wx, wy));
            if (hitObj && ((hitObj.type === 'npc' || hitObj.type === 'baddy') && !filterNPCs)) hitObj = null;
            if (hitObj && hitObj.type === 'link' && !filterLinks) hitObj = null;
            if (hitObj && hitObj.type === 'sign' && !filterSigns) hitObj = null;
            if (hitObj && this.selectedObjectType !== 'delete') {
                this.pushUndo();
                this.selectedObject = hitObj;
                this.draggingObject = hitObj;
                const dragOrigin = this.snapGrid ? coords : this.getCanvasCoordsRaw(e);
                this.draggingObjectOffsetX = dragOrigin.x - hitObj.x;
                this.draggingObjectOffsetY = dragOrigin.y - hitObj.y;
                this.render();
                e.preventDefault();
                return;
            }
            if (!hitObj && this.selectedObject) { this.selectedObject = null; this.render(); }
            if (this.selectedObjectType === 'delete') {
                this.deleteObjectAt(coords.x, coords.y);
            } else if (this.hasSelection() && this.currentTool === 'select') {
                const handle = this.getSelectionHandleAt(e.clientX, e.clientY);
                if (handle) {
                    if (!this.selectionTiles) this.captureSelectionTiles();
                    this.isResizingSelection = true;
                    this.resizeHandle = handle;
                    this.resizeStartX = coords.x;
                    this.resizeStartY = coords.y;
                    this.resizeStartSelectionX = this.selectionStartX;
                    this.resizeStartSelectionY = this.selectionStartY;
                    this.resizeStartSelectionEndX = this.selectionEndX;
                    this.resizeStartSelectionEndY = this.selectionEndY;
                    if (!this.resizeOrigTiles && this.selectionTiles) this.resizeOrigTiles = this.selectionTiles.map(r => [...r]);
                } else if (this.isPointInSelection(coords.x, coords.y)) {
                    this.isMovingSelection = true;
                    const startX = Math.min(this.selectionStartX, this.selectionEndX);
                    const startY = Math.min(this.selectionStartY, this.selectionEndY);
                    this.originalSelectionX = startX;
                    this.originalSelectionY = startY;
                    this.selectionOffsetX = coords.x - startX;
                    this.selectionOffsetY = coords.y - startY;
                    if (!this._floatingStamp) this.captureSelectionTiles();
                } else {
                    if (this._floatingStamp && this.selectionTiles) this._commitFloatingStamp();
                    this.selectionStartX = -1;
                    this.selectionStartY = -1;
                    this.selectionEndX = -1;
                    this.selectionEndY = -1;
                    this.selectionTiles = null;
                    this.resizeOrigTiles = null;
                    this._floatingStamp = false; this._floatingStampCanvas = false; this._stampTilesLifted = false;
                    this.updateSelectionInfo();
                    if (this.selectedTilesetTiles) {
                        this._createFloatingStamp(coords.x, coords.y);
                        this.selectedTilesetTiles = null;
                        this.updateSelectedTileDisplay();
                        e.preventDefault(); e.stopPropagation(); return;
                    }
                    this.render();
                }
            } else if (this.selectedTilesetTiles && this.currentTool === 'select') {
                this._createFloatingStamp(coords.x, coords.y);
                this.selectedTilesetTiles = null;
                this.updateSelectedTileDisplay();
                e.preventDefault(); e.stopPropagation(); return;
            } else if (this.selectedTilesetTiles) {
                this.isDraggingTileSelection = true;
                this._tileUndoPushed = false;
                this.tileSelectionDragX = e.clientX;
                this.tileSelectionDragY = e.clientY;
                this._placeTileStamp(coords.x, coords.y);
                e.preventDefault();
                e.stopPropagation();
                return;
            } else if (this.currentTool === 'draw' && this.floodFillEnabled) {
                this.pushUndo();
                this.floodFill(coords.x, coords.y);
                this.render();
            } else if (this.currentTool === 'draw' || this.currentTool === 'eraser') {
                this.pushUndo();
                this.isDrawing = true;
                this.drawAt(coords.x, coords.y);
                this.render();
            } else {
                this.isSelecting = true;
                this.selectionStartX = coords.x;
                this.selectionStartY = coords.y;
                this.selectionEndX = coords.x;
                this.selectionEndY = coords.y;
                this.isDrawing = false;
                this.isMovingSelection = false;
                this.selectionTiles = null;
                this.render();
            }
        }
    }

    handleCanvasDblClick(e) {
        if (this._playMode && !this._editBypass) return;
        const coords = this.getCanvasCoords(e);
        const tw = this.level.tileWidth || 16;
        const th = this.level.tileHeight || 16;
        const pri = { npc: 0, baddy: 1, chest: 2, sign: 3, link: 4 };
        const obj = this.level.objects.filter(o => {
            const bc = o.type === 'baddy' ? BADDY_CROPS[Math.max(0, Math.min(9, o.properties?.baddyType ?? 0))] : null;
            const defW = o.type === 'npc' ? 3 : o.type === 'chest' ? 2 : o.type === 'sign' ? 2 : o.type === 'link' ? 2 : 1;
            const defH = o.type === 'npc' ? 3 : o.type === 'chest' ? 2 : o.type === 'link' ? 2 : 1;
            const ow = bc ? bc[2] / 16 : ((o.type === 'npc' && o._imgW ? o._imgW / 16 : null) || o.properties?.width || defW);
            const oh = bc ? bc[3] / 16 : ((o.type === 'npc' && o._imgH ? o._imgH / 16 : null) || o.properties?.height || defH);
            const ox = Math.floor(o.x), oy = Math.floor(o.y);
            return coords.x >= ox && coords.x < ox + ow && coords.y >= oy && coords.y < oy + oh;
        }).sort((a, b) => {
            if (a === this.selectedObject) return -1;
            if (b === this.selectedObject) return 1;
            return (pri[a.type] ?? 5) - (pri[b.type] ?? 5);
        })[0] ?? null;
        if (!obj) {
            if (!this.hasSelection() && coords.x >= 0 && coords.x < this.level.width && coords.y >= 0 && coords.y < this.level.height) {
                this.defaultTile = this.level.getTile(this.currentLayer, coords.x, coords.y);
                this.updateSelectedTileCanvas();
            }
            return;
        }
        this.selectedObject = obj;
        this.render();
        if (obj.type === 'npc') this.openNPCEditor(obj);
        else if (obj.type === 'sign') this.openSignEditor(obj);
        else if (obj.type === 'link') {
            let nextLevel = obj.properties?.nextLevel;
            if (nextLevel && !/\.nw$/i.test(nextLevel)) nextLevel += '.nw';
            const nwText = nextLevel && this.fileCache?.levels?.get(nextLevel);
            if (nwText) {
                const existing = this.levels.findIndex(l => l.name === nextLevel);
                if (existing >= 0) { this.switchLevel(existing); return; }
                const level = Level.loadFromNW(nwText);
                if (this.level?.tilesetImage) { level.tilesetImage = this.level.tilesetImage; level.tilesetName = this.level.tilesetName; }
                this.levels.push({ level, name: nextLevel, modified: false });
                this.currentLevelIndex = this.levels.length - 1;
                this.level = level;
                this.addLevelTab(this.currentLevelIndex);
                this.render();
                this.saveSessionDebounced();
            } else this.openLinkEditor(obj);
        }
        else if (obj.type === 'chest') this.openChestEditor(obj);
        else if (obj.type === 'baddy') this.openBaddyEditor(obj);
    }

    handleMouseMove(e) {
        if (!this.level) return;
        if (this._linkPickMode && this._linkPickDrag) {
            const coords = this.getCanvasCoords(e);
            const tw = this.level.tileWidth || 16, th = this.level.tileHeight || 16;
            this._linkPickDrag.ex = Math.floor(coords.x / tw);
            this._linkPickDrag.ey = Math.floor(coords.y / th);
            this._linkPickDrag.cx = e.clientX; this._linkPickDrag.cy = e.clientY;
            this.requestRender(); return;
        }
        if (this.isPanning) {
            const deltaX = e.clientX - this.panStartX;
            const deltaY = e.clientY - this.panStartY;
            this.panX = this.panStartPanX + deltaX;
            this.panY = this.panStartPanY + deltaY;
            if (this.panAnimationFrame) {
                cancelAnimationFrame(this.panAnimationFrame);
            }
            this.panAnimationFrame = requestAnimationFrame(() => {
                this.render();
                this.panAnimationFrame = null;
            });
            return;
        }

        const coords = this.getCanvasCoords(e);
        this.updateMouseCoords(coords.x, coords.y, 'canvas');
        this.dragMouseX = e.clientX;
        this.dragMouseY = e.clientY;
        this._lastMouseTileX = coords.x;
        this._lastMouseTileY = coords.y;
        if (this.selectedTilesetTiles && !this.isDraggingTileSelection && !this.isDrawing && !this.isSelecting && !this.draggingObject) {
            this.requestRender();
        }
        if (!this.resizingLink) {
            const cursors = { n:'ns-resize', s:'ns-resize', e:'ew-resize', w:'ew-resize', nw:'nwse-resize', se:'nwse-resize', ne:'nesw-resize', sw:'nesw-resize' };
            const lh = this.getLinkResizeHandle(e.clientX, e.clientY);
            if (lh) { this.canvas.style.cursor = cursors[lh] || 'pointer'; }
            else if (this.currentTool === 'select' && this.hasSelection()) {
                const sh = this.getSelectionHandleAt(e.clientX, e.clientY);
                this.canvas.style.cursor = sh ? (cursors[sh] || 'pointer') : (this.isPointInSelection(coords.x, coords.y) ? 'move' : '');
            } else { this.canvas.style.cursor = ''; }
        }
        if (this.resizingLink) {
            const obj = this.resizingLink;
            const dx = coords.x - this.resizingLinkStartX;
            const dy = coords.y - this.resizingLinkStartY;
            const h = this.resizingLinkHandle;
            let w = this.resizingLinkStartW, ht = this.resizingLinkStartH;
            let ox = this.resizingLinkObjX, oy = this.resizingLinkObjY;
            if (h.includes('e')) w = Math.max(1, this.resizingLinkStartW + dx);
            if (h.includes('s')) ht = Math.max(1, this.resizingLinkStartH + dy);
            if (h.includes('w')) { const nw = Math.max(1, this.resizingLinkStartW - dx); ox = this.resizingLinkObjX + (this.resizingLinkStartW - nw); w = nw; }
            if (h.includes('n')) { const nh = Math.max(1, this.resizingLinkStartH - dy); oy = this.resizingLinkObjY + (this.resizingLinkStartH - nh); ht = nh; }
            obj.x = ox; obj.y = oy;
            if (!obj.properties) obj.properties = {};
            obj.properties.width = w; obj.properties.height = ht;
            this.render();
            return;
        }
        if (this.draggingObject) {
            const raw = this.snapGrid ? coords : this.getCanvasCoordsRaw(e);
            let nx = raw.x - this.draggingObjectOffsetX;
            let ny = raw.y - this.draggingObjectOffsetY;
            if (this.snapGrid) { nx = Math.round(nx); ny = Math.round(ny); }
            nx = Math.max(0, Math.min(this.level.width - 1, nx));
            ny = Math.max(0, Math.min(this.level.height - 1, ny));
            if (nx !== this.draggingObject.x || ny !== this.draggingObject.y) {
                this.draggingObject.x = nx;
                this.draggingObject.y = ny;
                this.render();
            }
            return;
        }
        if (this.isDraggingTileSelection && this.selectedTilesetTiles) {
            this.tileSelectionDragX = e.clientX;
            this.tileSelectionDragY = e.clientY;
            if (e.buttons & 1) {
                if (!this._tileUndoPushed) { this.pushUndo(); this._tileUndoPushed = true; }
                this.isDrawing = true;
                const selWidth = this.selectedTilesetTiles[0].length;
                const selHeight = this.selectedTilesetTiles.length;
                let tilesPlaced = 0;
                for (let y = 0; y < selHeight; y++) {
                    for (let x = 0; x < selWidth; x++) {
                        if (this.selectedTilesetTiles[y] && this.selectedTilesetTiles[y][x] !== undefined) {
                            const tx = coords.x + x;
                            const ty = coords.y + y;
                            if (tx >= 0 && tx < this.level.width && ty >= 0 && ty < this.level.height) {
                                const tileIndex = this.selectedTilesetTiles[y][x];
                                this.level.setTile(this.currentLayer, tx, ty, tileIndex);
                                tilesPlaced++;
                            }
                        }
                    }
                }
                this.isDraggingTileSelection = true;
            } else {
                this.isDrawing = false;
            }
            this.requestRender();
        }

        if (this.isResizingSelection && this.resizeHandle && this.selectionTiles) {
            const deltaX = coords.x - this.resizeStartX;
            const deltaY = coords.y - this.resizeStartY;
            let newStartX = this.resizeStartSelectionX;
            let newStartY = this.resizeStartSelectionY;
            let newEndX = this.resizeStartSelectionEndX;
            let newEndY = this.resizeStartSelectionEndY;
            if (this.resizeHandle.includes('n')) {
                newStartY = Math.min(this.resizeStartSelectionY, this.resizeStartSelectionEndY) + deltaY;
            }
            if (this.resizeHandle.includes('s')) {
                newEndY = Math.max(this.resizeStartSelectionY, this.resizeStartSelectionEndY) + deltaY;
            }
            if (this.resizeHandle.includes('w')) {
                newStartX = Math.min(this.resizeStartSelectionX, this.resizeStartSelectionEndX) + deltaX;
            }
            if (this.resizeHandle.includes('e')) {
                newEndX = Math.max(this.resizeStartSelectionX, this.resizeStartSelectionEndX) + deltaX;
            }
            const minX = Math.min(newStartX, newEndX);
            const maxX = Math.max(newStartX, newEndX);
            const minY = Math.min(newStartY, newEndY);
            const maxY = Math.max(newStartY, newEndY);
            const width = maxX - minX + 1;
            const height = maxY - minY + 1;
            if (width > 0 && height > 0) {
                const origWidth = Math.abs(this.resizeStartSelectionEndX - this.resizeStartSelectionX) + 1;
                const origHeight = Math.abs(this.resizeStartSelectionEndY - this.resizeStartSelectionY) + 1;
                const srcTiles = this.resizeOrigTiles || this.selectionTiles;
                const newTiles = [];
                for (let y = 0; y < height; y++) {
                    newTiles[y] = [];
                    for (let x = 0; x < width; x++) {
                        const srcX = x % origWidth;
                        const srcY = y % origHeight;
                        newTiles[y][x] = (srcTiles[srcY] && srcTiles[srcY][srcX] !== undefined) ? srcTiles[srcY][srcX] : this.defaultTile;
                    }
                }
                this.selectionTiles = newTiles;
                this.selectionStartX = minX;
                this.selectionStartY = minY;
                this.selectionEndX = maxX;
                this.selectionEndY = maxY;
                this.updateSelectionInfo();
                this.render();
            }
        } else if (this.isMovingSelection && this.selectionTiles) {
            const startX = Math.min(this.selectionStartX, this.selectionEndX);
            const startY = Math.min(this.selectionStartY, this.selectionEndY);
            const newStartX = coords.x - this.selectionOffsetX;
            const newStartY = coords.y - this.selectionOffsetY;
            const width = Math.abs(this.selectionEndX - this.selectionStartX) + 1;
            const height = Math.abs(this.selectionEndY - this.selectionStartY) + 1;
            this.selectionStartX = newStartX;
            this.selectionStartY = newStartY;
            this.selectionEndX = newStartX + width - 1;
            this.selectionEndY = newStartY + height - 1;
            this.render();
        } else if (this.isSelecting && this.selectionStartX >= 0) {
            this.selectionEndX = coords.x;
            this.selectionEndY = coords.y;
            this.updateSelectionInfo();
            this.render();
        } else if (this.isDraggingFromTileset) {
        } else if (this.isDrawing && !this.isSelecting) {
            this.drawAt(coords.x, coords.y);
            this.dragMouseX = e.clientX;
            this.dragMouseY = e.clientY;
            this.requestRender();
        }
    }

    handleMouseUp(e) {
        if (!this.level) return;
        if (this._linkPickMode && this._linkPickDrag && e.button === 0) {
            const d = this._linkPickDrag;
            this._linkPickDrag = null;
            const levelName = this.levels[this.currentLevelIndex]?.name || '';
            const x1 = Math.min(d.sx, d.ex), y1 = Math.min(d.sy, d.ey);
            const x2 = Math.max(d.sx, d.ex), y2 = Math.max(d.sy, d.ey);
            this._showLinkPickConfirm({ nextLevel: levelName, nextX: String(x1), nextY: String(y1), x1, y1, x2, y2 });
            this.requestRender(); return;
        }
        if ((e.button === 1 || e.button === 2) && this.isPanning) {
            this.isPanning = false;
            return;
        }

        if (e.button === 0 && this.isDraggingFromTileset && this.isDrawing) {
            this.isDrawing = false;
        }
        
        this.isDrawing = false;
        if (this.resizingLink) {
            this.resizingLink = null;
            this.resizingLinkHandle = null;
            this.saveSessionDebounced();
            this.render();
            return;
        }
        if (this.isResizingSelection) {
            this.isResizingSelection = false;
            this.resizeHandle = null;
            if (this.selectionTiles && !this._floatingStamp) { this._floatingStamp = true; this._floatingStampCanvas = true; this._stampTilesLifted = false; }
            this.render();
        } else if (this.isMovingSelection && this.selectionTiles) {
            if (!this._floatingStamp || this._floatingStampCanvas) this.finalizeSelectionMove();
            this.isMovingSelection = false;
            this.render();
        } else if (this.isDraggingFromTileset) {
            const coords = this.getCanvasCoords(e);
            const tileWidth = this.level.tileWidth || 16;
            const tileHeight = this.level.tileHeight || 16;
            if (coords.x >= 0 && coords.x < this.level.width && coords.y >= 0 && coords.y < this.level.height) {
                if (this.selectedTilesetTiles && this.selectedTilesetTiles.length > 0) {
                    const selWidth = this.selectedTilesetTiles[0].length;
                    const selHeight = this.selectedTilesetTiles.length;
                    for (let dy = 0; dy < selHeight && coords.y + dy < this.level.height; dy++) {
                        for (let dx = 0; dx < selWidth && coords.x + dx < this.level.width; dx++) {
                            if (this.selectedTilesetTiles[dy] && this.selectedTilesetTiles[dy][dx] !== undefined) {
                                this.level.setTile(this.currentLayer, coords.x + dx, coords.y + dy, this.selectedTilesetTiles[dy][dx]);
                            }
                        }
                    }
                } else if (this.draggedTileIndex >= 0) {
                    this.level.setTile(this.currentLayer, coords.x, coords.y, this.draggedTileIndex);
                }
            }
            this.isDraggingFromTileset = false;
            this.isDraggingTileSelection = false;
            this.draggedTileIndex = -1;
            this.render();
        } else if (this.isDraggingTileSelection) {
            this.isDraggingTileSelection = false;
            this.isDrawing = false;
            this.render();
        } else if (this.isSelecting) {
            this.isSelecting = false;
            if (this.selectionStartX >= 0 && this.selectionEndX >= 0) {
                if (this.selectionStartX === this.selectionEndX && this.selectionStartY === this.selectionEndY) {
                    this.selectionStartX = -1;
                    this.selectionStartY = -1;
                    this.selectionEndX = -1;
                    this.selectionEndY = -1;
                    this.selectionTiles = null;
                    this.updateSelectionInfo();
                } else {
                    const sx = Math.min(this.selectionStartX, this.selectionEndX), sy = Math.min(this.selectionStartY, this.selectionEndY);
                    const w = Math.abs(this.selectionEndX - this.selectionStartX) + 1, h = Math.abs(this.selectionEndY - this.selectionStartY) + 1;
                    this.selectionTiles = [];
                    for (let y = 0; y < h; y++) {
                        this.selectionTiles[y] = [];
                        for (let x = 0; x < w; x++) this.selectionTiles[y][x] = this.level.getTile(this.currentLayer, sx + x, sy + y);
                    }
                }
            }
            this.render();
        }
        this.lastDrawX = -1;
        this.lastDrawY = -1;
        if (this.draggingObject) {
            this.draggingObject = null;
            this.saveSessionDebounced();
        } else {
            this.saveSessionDebounced();
        }
    }

    handleWheel(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const mx = (e.clientX - rect.left) * scaleX;
        const my = (e.clientY - rect.top) * scaleY;
        if (e.deltaY > 0) {
            this.zoomLevel = Math.max(0, this.zoomLevel - 1);
        } else {
            this.zoomLevel = Math.min(9, this.zoomLevel + 1);
        }
        this.updateZoomFromLevel(mx, my);
    }

    updateZoomFromLevel(anchorX, anchorY) {
        const zoomFactors = [0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 3.0, 4.0, 6.0, 8.0];
        const oldZoom = this.zoom;
        this.zoom = zoomFactors[this.zoomLevel];
        if (anchorX !== undefined && oldZoom !== this.zoom) {
            this.panX = anchorX - (anchorX - this.panX) * (this.zoom / oldZoom);
            this.panY = anchorY - (anchorY - this.panY) * (this.zoom / oldZoom);
        }
        const zoomSlider = document.getElementById('zoomSlider');
        if (zoomSlider) zoomSlider.value = this.zoomLevel;
        this.updateZoomDisplay();
        this.render();
    }

    _createFloatingStamp(cx, cy) {
        if (!this.selectedTilesetTiles?.length) return;
        const tiles = this.selectedTilesetTiles;
        const sw = tiles[0]?.length || 0, sh = tiles.length;
        this.selectionStartX = cx;
        this.selectionStartY = cy;
        this.selectionEndX = cx + sw - 1;
        this.selectionEndY = cy + sh - 1;
        this.selectionTiles = tiles.map(r => [...r]);
        this.resizeOrigTiles = tiles.map(r => [...r]);
        this._floatingStamp = true; this._floatingStampCanvas = false;
        this.updateSelectionInfo();
        this.render();
    }

    _commitFloatingStamp() {
        if (!this.selectionTiles?.length) return;
        this.pushUndo();
        const sx = Math.min(this.selectionStartX, this.selectionEndX);
        const sy = Math.min(this.selectionStartY, this.selectionEndY);
        for (let y = 0; y < this.selectionTiles.length; y++) for (let x = 0; x < (this.selectionTiles[y]?.length || 0); x++) {
            const t = this.selectionTiles[y][x];
            if (t !== undefined && t >= 0) {
                const tx = sx + x, ty = sy + y;
                if (tx >= 0 && tx < this.level.width && ty >= 0 && ty < this.level.height)
                    this.level.setTile(this.currentLayer, tx, ty, t);
            }
        }
        this.saveSessionDebounced();
    }

    _placeTileStamp(cx, cy) {
        if (!this.selectedTilesetTiles?.length) return;
        if (!this._tileUndoPushed) { this.pushUndo(); this._tileUndoPushed = true; }
        const sw = this.selectedTilesetTiles[0]?.length || 0, sh = this.selectedTilesetTiles.length;
        for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
            const t = this.selectedTilesetTiles[y]?.[x];
            if (t !== undefined && t >= 0) {
                const tx = cx + x, ty = cy + y;
                if (tx >= 0 && tx < this.level.width && ty >= 0 && ty < this.level.height)
                    this.level.setTile(this.currentLayer, tx, ty, t);
            }
        }
        this.render();
    }

    _captureSnapshot() {
        return {
            layers: this.level.layers.map(l => [...l.tiles]),
            objects: this.level.objects.map(o => ({ x: o.x, y: o.y, type: o.type, id: o.id, properties: JSON.parse(JSON.stringify(o.properties)) }))
        };
    }

    _restoreSnapshot(snap) {
        this.invalidateLayerCache();
        for (let i = 0; i < snap.layers.length; i++) this.level.layers[i].tiles = snap.layers[i];
        this.level.objects = snap.objects.map(d => { const o = new LevelObject(d.x, d.y, d.type); o.id = d.id; o.properties = d.properties; return o; });
        if (this.selectedObject && !this.level.objects.find(o => o.id === this.selectedObject?.id)) this.selectedObject = null;
    }

    pushUndo() {
        this.undoStack.push(this._captureSnapshot());
        if (this.undoStack.length > 50) this.undoStack.shift();
        this.redoStack = [];
        this.invalidateLayerCache();
    }

    undo() {
        if (!this.undoStack.length) return;
        this.redoStack.push(this._captureSnapshot());
        this._restoreSnapshot(this.undoStack.pop());
        this.render();
    }

    redo() {
        if (!this.redoStack.length) return;
        this.undoStack.push(this._captureSnapshot());
        this._restoreSnapshot(this.redoStack.pop());
        this.render();
    }

    handleKeyDown(e) {
        if (e.key === 'Escape') {
            const modals = Array.from(document.body.children).filter(el => el._closeModal);
            if (modals.length) { modals[modals.length - 1]._closeModal(); return; }
            const about = document.getElementById('infoDialog');
            if (about?.style.display === 'flex') { about.style.display = 'none'; return; }
        }
        const _kb = this._getKeybinds();
        if (_matchKB(e, _kb.about)) { e.preventDefault(); window.openInfoDialog?.('about'); return; }
        if (_matchKB(e, _kb.settings)) { e.preventDefault(); this.openSettingsDialog(); return; }
        if (_matchKB(e, _kb.playMode)) { e.preventDefault(); this.togglePlayMode(); return; }
        if (_matchKB(e, _kb.delete)) {
            if (this.selectedObject) {
                this.pushUndo();
                this.level.removeObject(this.selectedObject);
                this.selectedObject = null;
                this.render();
                this.saveSessionDebounced();
            } else if (this.hasSelection()) {
                this.pushUndo();
                const sx = Math.min(this.selectionStartX, this.selectionEndX);
                const sy = Math.min(this.selectionStartY, this.selectionEndY);
                const ex = Math.max(this.selectionStartX, this.selectionEndX);
                const ey = Math.max(this.selectionStartY, this.selectionEndY);
                for (let y = sy; y <= ey; y++) for (let x = sx; x <= ex; x++) this.level.setTile(this.currentLayer, x, y, -1);
                this.render();
                this.saveSessionDebounced();
            }
            return;
        }
        if (_matchKB(e, _kb.undo)) { e.preventDefault(); this.undo(); return; }
        if (_matchKB(e, _kb.redo)) { e.preventDefault(); this.redo(); return; }
        if (_matchKB(e, _kb.save)) { e.preventDefault(); this.saveLevel(); return; }
        if (_matchKB(e, _kb.copy) && this.hasSelection()) { e.preventDefault(); this._doCopy(); return; }
        if (_matchKB(e, _kb.cut) && this.hasSelection()) { e.preventDefault(); this._doCut(); return; }
        if (_matchKB(e, _kb.paste) && this._clipboardTiles) { e.preventDefault(); this._doPaste(); return; }
    }

    _canvasRect() {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        return { rect, scaleX, scaleY };
    }

    getCanvasCoords(e) {
        const { rect, scaleX, scaleY } = this._canvasRect();
        const tileWidth = this.level.tileWidth || 16;
        const tileHeight = this.level.tileHeight || 16;
        const px = (e.clientX - rect.left) * scaleX;
        const py = (e.clientY - rect.top) * scaleY;
        return { x: Math.floor((px - Math.floor(this.panX)) / (tileWidth * this.zoom)), y: Math.floor((py - Math.floor(this.panY)) / (tileHeight * this.zoom)) };
    }

    getCanvasCoordsRaw(e) {
        const { rect, scaleX, scaleY } = this._canvasRect();
        const tileWidth = this.level.tileWidth || 16;
        const tileHeight = this.level.tileHeight || 16;
        const px = (e.clientX - rect.left) * scaleX;
        const py = (e.clientY - rect.top) * scaleY;
        return { x: (px - Math.floor(this.panX)) / (tileWidth * this.zoom), y: (py - Math.floor(this.panY)) / (tileHeight * this.zoom) };
    }

    floodFill(x, y) {
        if (this.defaultTile < 0) return;
        if (x < 0 || x >= this.level.width || y < 0 || y >= this.level.height) return;
        const targetTile = this.level.getTile(this.currentLayer, x, y);
        const fillTile = this.defaultTile;
        if (targetTile === fillTile) return;
        const stack = [[x, y]];
        const visited = new Uint8Array(this.level.width * this.level.height);
        while (stack.length) {
            const [cx, cy] = stack.pop();
            if (cx < 0 || cx >= this.level.width || cy < 0 || cy >= this.level.height) continue;
            const idx = cy * this.level.width + cx;
            if (visited[idx]) continue;
            visited[idx] = 1;
            if (this.level.getTile(this.currentLayer, cx, cy) !== targetTile) continue;
            this.level.setTile(this.currentLayer, cx, cy, fillTile);
            stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
        }
    }

    drawAt(x, y) {
        if (this.currentTool !== 'eraser' && this.defaultTile < 0) return;
        if (x === this.lastDrawX && y === this.lastDrawY) return;

        this.lastDrawX = x;
        this.lastDrawY = y;

        if (x >= 0 && x < this.level.width && y >= 0 && y < this.level.height) {
            const tileVal = this.currentTool === 'eraser' ? -1 : this.defaultTile;
            for (let dy = 0; dy < this.brushHeight; dy++) {
                for (let dx = 0; dx < this.brushWidth; dx++) {
                    const tx = x + dx;
                    const ty = y + dy;
                    if (tx >= 0 && tx < this.level.width && ty >= 0 && ty < this.level.height)
                        this.level.setTile(this.currentLayer, tx, ty, tileVal);
                }
            }
            this.render();
        }
    }

    render() {
        if (!this.level || !this.level.tilesetImage || this.level.tilesetImage.complete === false) { console.warn('[render bail]', 'level:', !!this.level, 'tilesetImage:', this.level?.tilesetImage, 'complete:', this.level?.tilesetImage?.complete); return; }
        const isNPCSel = this.selectedObject?.type === 'npc';
        ['btnExportNPC','btnExportNPC2'].forEach(id => { const b = document.getElementById(id); if (b) b.disabled = !isNPCSel; });

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.imageSmoothingEnabled = false;
        this.ctx.save();
        const snapPanX = Math.floor(this.panX);
        const snapPanY = Math.floor(this.panY);
        this.ctx.translate(snapPanX, snapPanY);
        this.ctx.scale(this.zoom, this.zoom);

        for (let layer = 0; layer < this.level.layers.length; layer++) {
            if (!this.level.layers[layer].visible) continue;
            if (this.fadeInactiveLayers && layer !== this.currentLayer) this.ctx.globalAlpha = 0.33;
            this.drawLayer(layer);
            this.ctx.globalAlpha = 1.0;
        }

        if (this.showGrid && this.zoom > 0.5) {
            this.drawGrid();
        } else if (this.showGrid && (this.level.width > 64 || this.level.height > 64)) {
            this.drawGmapDividers();
        }

        this.drawObjects();

        if (this.selectionStartX >= 0 && this.selectionEndX >= 0) {
            this.drawSelection();
        }

        if ((this.isMovingSelection || this.isResizingSelection || this._floatingStamp) && this.selectionTiles) {
            this.drawMovingSelection();
        }

        if (this.selectedTilesetTiles && this.dragMouseX > 0) {
            this.drawDraggedTile();
        }

        if (this.draggingNewObjectType) {
            const tw = this.level.tileWidth || 16;
            const th = this.level.tileHeight || 16;
            const gx = this.draggingNewObjectX * tw;
            const gy = this.draggingNewObjectY * th;
            this.ctx.globalAlpha = 0.6;
            switch (this.draggingNewObjectType) {
                case 'npc': this.drawNPC(gx, gy, tw, th, this._pendingCloneObj ? { properties: this._pendingCloneObj } : {}); break;
                case 'baddy': this.drawBaddy(gx, gy, tw, th, null); break;
                case 'sign': this.drawSign(gx, gy, tw, th, {}); break;
                case 'link': this.drawLink(gx, gy, tw, th, {}); break;
                case 'chest': this.drawChest(gx, gy, tw, th); break;
            }
            this.ctx.globalAlpha = 1.0;
        }

        this.ctx.restore();
        if (this._linkPickMode && this._linkPickDrag) {
            const d = this._linkPickDrag;
            const tw = this.level.tileWidth || 16, th = this.level.tileHeight || 16;
            this.ctx.save();
            this.ctx.translate(this.panX, this.panY);
            this.ctx.scale(this.zoom, this.zoom);
            const rx1 = Math.min(d.sx, d.ex) * tw, ry1 = Math.min(d.sy, d.ey) * th;
            const rx2 = (Math.max(d.sx, d.ex) + 1) * tw, ry2 = (Math.max(d.sy, d.ey) + 1) * th;
            this.ctx.fillStyle = 'rgba(255,220,0,0.18)';
            this.ctx.fillRect(rx1, ry1, rx2 - rx1, ry2 - ry1);
            this.ctx.strokeStyle = 'rgba(255,220,0,0.95)';
            this.ctx.lineWidth = 2 / this.zoom;
            this.ctx.strokeRect(rx1, ry1, rx2 - rx1, ry2 - ry1);
            this.ctx.restore();
            if (d.cx != null) {
                const rect = this.canvas.getBoundingClientRect();
                const lx = d.cx - rect.left + 14, ly = d.cy - rect.top - 10;
                const label = `${Math.min(d.sx,d.ex)},${Math.min(d.sy,d.ey)} → ${Math.max(d.sx,d.ex)},${Math.max(d.sy,d.ey)}`;
                this.ctx.font = 'bold 12px monospace';
                this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
                this.ctx.fillText(label, lx + 1, ly + 1);
                this.ctx.fillStyle = '#ffd700';
                this.ctx.fillText(label, lx, ly);
            }
        }
        if (this._playMode && this._player) {
            const p = this._player;
            this.ctx.save();
            this.ctx.translate(this.panX, this.panY);
            this.ctx.scale(this.zoom, this.zoom);
            const _sprCX = (p._ganiOX ?? 0) + (p._imgW ?? 0) / 2;
            const _chatHeadY = p.y + (p._ganiOY ?? 0);
            const _chatFeetY = p.y + (p._ganiOY ?? 0) + (p._imgH ?? 48);
            if (this._showColDebug) {
                const _tw2 = this.level.tileWidth || 16, _th2 = this.level.tileHeight || 16;
                const tilesPerRow = Math.floor((this.level.tilesetImage?.width || 512) / _tw2);
                const visX0 = Math.floor((-this.panX / this.zoom) / _tw2) - 1;
                const visY0 = Math.floor((-this.panY / this.zoom) / _th2) - 1;
                const visX1 = visX0 + Math.ceil(this.canvas.width / this.zoom / _tw2) + 2;
                const visY1 = visY0 + Math.ceil(this.canvas.height / this.zoom / _th2) + 2;
                const _ttColors = { 22:[255,0,0], 20:[255,140,0], 21:[180,255,0], 2:[255,0,200], 3:[0,180,255], 4:[0,220,220], 5:[0,180,180], 6:[0,160,60], 7:[200,80,0], 8:[80,160,255], 9:[0,80,180], 10:[0,80,180], 11:[0,100,220], 12:[255,80,0] };
                this.ctx.lineWidth = 0.5 / this.zoom;
                this.ctx.font = `bold ${Math.max(6, _tw2 * 0.55)}px monospace`;
                this.ctx.textAlign = 'center'; this.ctx.textBaseline = 'middle';
                const _ttCS = {};
                for (const [k, [r2,g2,b2]] of Object.entries(_ttColors)) _ttCS[k] = [`rgba(${r2},${g2},${b2},0.25)`, `rgba(${r2},${g2},${b2},0.8)`];
                const _byType = {};
                for (let ty2 = visY0; ty2 <= visY1; ty2++) {
                    for (let tx2 = visX0; tx2 <= visX1; tx2++) {
                        let tType = 0;
                        for (let layer = 0; layer < this.level.layers.length && !tType; layer++) {
                            const idx = this.level.getTile(layer, tx2, ty2);
                            if (idx < 0) continue;
                            const col = idx % tilesPerRow, row = Math.floor(idx / tilesPerRow);
                            const typeId = Math.floor(col / 16) * 512 + (col % 16) + row * 16;
                            tType = TILE_TYPES.TYPE0[typeId] || 0;
                        }
                        if (!tType) continue;
                        (_byType[tType] || (_byType[tType] = [])).push(tx2, ty2);
                    }
                }
                for (const [tType, coords] of Object.entries(_byType)) {
                    const [fc, sc] = _ttCS[tType] || ['rgba(200,200,200,0.25)', 'rgba(200,200,200,0.8)'];
                    this.ctx.fillStyle = fc; this.ctx.beginPath();
                    for (let i = 0; i < coords.length; i += 2) this.ctx.rect(coords[i]*_tw2, coords[i+1]*_th2, _tw2, _th2);
                    this.ctx.fill();
                    this.ctx.strokeStyle = sc; this.ctx.beginPath();
                    for (let i = 0; i < coords.length; i += 2) this.ctx.rect(coords[i]*_tw2, coords[i+1]*_th2, _tw2, _th2);
                    this.ctx.stroke();
                    if (_tw2 >= 10) {
                        this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
                        for (let i = 0; i < coords.length; i += 2) this.ctx.fillText(tType, coords[i]*_tw2 + _tw2/2 + 1, coords[i+1]*_th2 + _th2/2 + 1);
                        this.ctx.fillStyle = '#fff';
                        for (let i = 0; i < coords.length; i += 2) this.ctx.fillText(tType, coords[i]*_tw2 + _tw2/2, coords[i+1]*_th2 + _th2/2);
                    }
                }
                for (const obj of (this.level.objects || [])) {
                    const ox = obj.x * _tw2, oy = obj.y * _th2;
                    if (obj.type === 'npc' || obj.type === 'chest') {
                        this.ctx.fillStyle = 'rgba(160,0,255,0.2)'; this.ctx.strokeStyle = 'rgba(160,0,255,0.9)'; this.ctx.lineWidth = 1 / this.zoom;
                        if (obj.type === 'chest') {
                            this.ctx.fillRect(ox, oy, _tw2*2, _th2*2); this.ctx.strokeRect(ox, oy, _tw2*2, _th2*2);
                        } else {
                            if (!obj._shapeCache) {
                                const sp = parseNPCScript(obj.properties?.code || '');
                                obj._shapeCache = sp.setshape2 ? { type: 2, w: sp.setshape2.w, h: sp.setshape2.h, tiles: sp.setshape2.tiles }
                                                : sp.setshape  ? { type: 1, w: sp.setshape.w, h: sp.setshape.h }
                                                : { type: 0 };
                            }
                            const sc = obj._shapeCache;
                            if (sc.type === 2) {
                                for (let ty2 = 0; ty2 < sc.h; ty2++) for (let tx2 = 0; tx2 < sc.w; tx2++) {
                                    if (!sc.tiles[ty2 * sc.w + tx2]) continue;
                                    this.ctx.fillRect(ox+tx2*_tw2, oy+ty2*_th2, _tw2, _th2); this.ctx.strokeRect(ox+tx2*_tw2, oy+ty2*_th2, _tw2, _th2);
                                }
                            } else {
                                let bx, by, bw, bh;
                                if (sc.type === 1) { bx = ox; by = oy; bw = sc.w; bh = sc.h; }
                                else if (/showcharacter/i.test(obj.properties?.code || '')) { const _cx = ox + (obj._ganiOX ?? 0) + (obj._imgW ?? _tw2) / 2; bx = _cx - (this._colHW ?? 15); by = oy + (obj._imgH ?? 48) - (this._colHH ?? 15)*2; bw = (this._colHW ?? 15)*2; bh = (this._colHH ?? 15)*2; }
                                else { const _tb2 = this._getTightBounds(obj); if (_tb2) { const _sx2 = obj._stretchx ?? 1; bx = ox + (_sx2 < 0 ? _tb2.srcW - _tb2.bx - _tb2.bw : _tb2.bx); by = oy + _tb2.by; bw = _tb2.bw; bh = _tb2.bh; } else { bx = ox + (obj._ganiOX ?? 0); by = oy + (obj._ganiOY ?? 0); bw = obj._imgW ?? _tw2; bh = obj._imgH ?? 48; } }
                                this.ctx.fillRect(bx, by, bw, bh); this.ctx.strokeRect(bx, by, bw, bh);
                            }
                        }
                    } else if (obj.type === 'link') {
                        const p2 = obj.properties || {};
                        const lw = (p2.width || 2) * _tw2, lh = (p2.height || 2) * _th2;
                        this.ctx.fillStyle = 'rgba(255,220,0,0.15)'; this.ctx.strokeStyle = 'rgba(255,220,0,0.9)'; this.ctx.lineWidth = 1 / this.zoom;
                        this.ctx.fillRect(ox, oy, lw, lh);
                        this.ctx.strokeRect(ox, oy, lw, lh);
                    }
                }
                const p2 = this._player;
                const _chw = this._colHW ?? 8, _chh = this._colHH ?? 7;
                const _psprCX = p2.x + (p2._ganiOX ?? 0) + (p2._imgW ?? 16) / 2;
                const _pbodyCY = p2.y + (p2._ganiOY ?? 0) + (p2._imgH ?? 48) - 16;
                this.ctx.strokeStyle = 'rgba(0,255,0,0.9)'; this.ctx.lineWidth = 1 / this.zoom;
                this.ctx.strokeRect(_psprCX - _chw, _pbodyCY - _chh, _chw * 2, _chh * 2);
            }
            if (this._showMouseTile && this._playMouseWorld) {
                const _tw2 = this.level.tileWidth || 16, _th2 = this.level.tileHeight || 16;
                const tx = Math.floor(this._playMouseWorld.x / _tw2) * _tw2;
                const ty = Math.floor(this._playMouseWorld.y / _th2) * _th2;
                this.ctx.strokeStyle = '#ff0'; this.ctx.lineWidth = 1 / this.zoom;
                this.ctx.strokeRect(tx, ty, _tw2, _th2);
            }
            this.ctx.restore();
            const _gs = this._getSettings();
            const _nickSz = Math.max(_gs.nickFontSize * this.zoom, 8), _chatSz = Math.max(_gs.chatFontSize * this.zoom, 8);
            const _cx = (p.x + _sprCX) * this.zoom + this.panX;
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = 'rgba(20,40,200,1)'; this.ctx.shadowOffsetX = 2; this.ctx.shadowOffsetY = 2; this.ctx.shadowBlur = 0;
            if (this._playerChat) {
                this.ctx.font = `bold ${_chatSz}px 'TempusSansITC','Tempus Sans ITC',sans-serif`;
                this.ctx.fillStyle = '#fff'; this.ctx.fillText(this._playerChat, _cx, _chatHeadY * this.zoom + this.panY - 16);
            }
            if (p.nick && p.nickTimer > 0) {
                this.ctx.font = `bold ${_nickSz}px 'TempusSansITC','Tempus Sans ITC',sans-serif`;
                this.ctx.fillStyle = '#fff'; this.ctx.fillText(p.nick + (p.guild ? ` (${p.guild})` : ''), _cx, _chatFeetY * this.zoom + this.panY + _nickSz + 4);
            }
            this.ctx.shadowColor = 'transparent'; this.ctx.shadowOffsetX = 0; this.ctx.shadowOffsetY = 0; this.ctx.textAlign = 'left';
            const _tw = this.level.tileWidth || 16, _th = this.level.tileHeight || 16;
            const _facing = [[0,-1],[-1,0],[0,1],[1,0]][p.dir];
            const _fx = p.x + _facing[0] * _tw, _fy = p.y + _facing[1] * _th;
            const tileType = this._getTileType(_fx, _fy);
            const _tx = (p.x / _tw).toFixed(2), _ty = (p.y / _th).toFixed(2);
            const _pcx = p.x + (p._ganiOX ?? 0) + (p._imgW ?? _tw) / 2;
            const _pcy = p.y + (p._ganiOY ?? 0) + (p._imgH ?? 48) - 16;
            const _chw = this._colHW ?? 12, _chh = this._colHH ?? 12;
            let _onLink = null;
            for (const _lo of (this.level.objects || [])) {
                if (_lo.type !== 'link') continue;
                const _lp = _lo.properties || {};
                const _lx = _lo.x * _tw, _ly = _lo.y * _th, _lw = (_lp.width||2) * _tw, _lh = (_lp.height||2) * _th;
                if (_pcx + _chw > _lx && _pcx - _chw < _lx + _lw && _pcy + _chh > _ly && _pcy - _chh < _ly + _lh) { _onLink = _lp.nextLevel || '?'; break; }
            }
            let dbg = `tile:${tileType} x:${_tx} y:${_ty} noclip:${this._playNoclip?'ON':'OFF'}${this._editBypass?' EDIT':''}${_onLink ? `  LINK:${_onLink}` : ''}`;
            if (this._showMouseTile && this._playMouseWorld) {
                const mtx = (this._playMouseWorld.x / _tw).toFixed(2), mty = (this._playMouseWorld.y / _th).toFixed(2);
                const mt = this._getTileType(this._playMouseWorld.x, this._playMouseWorld.y);
                dbg += `  mouse tile:${mt} (${mtx},${mty})`;
            }
            this.ctx.font = '13px monospace'; this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
            this.ctx.fillRect(6, this.canvas.height - 22, this.ctx.measureText(dbg).width + 8, 16);
            this.ctx.fillStyle = '#aef'; this.ctx.fillText(dbg, 10, this.canvas.height - 9);
        }
        if (this._editBypass) {
            const _em = 'EDIT MODE'; this.ctx.font = 'bold 12px monospace';
            const _ew = this.ctx.measureText(_em).width;
            this.ctx.fillStyle = 'rgba(0,0,0,0.55)'; this.ctx.fillRect(this.canvas.width - _ew - 14, 6, _ew + 8, 18);
            this.ctx.fillStyle = '#ffcc44'; this.ctx.fillText(_em, this.canvas.width - _ew - 10, 19);
        }
    }

    _doCopy() {
        if (!this.hasSelection()) return;
        this._clipboardTiles = this._captureSelectionAsStamp();
        this._clipboardOriginX = Math.min(this.selectionStartX, this.selectionEndX);
        this._clipboardOriginY = Math.min(this.selectionStartY, this.selectionEndY);
    }
    _doPaste() {
        if (!this._clipboardTiles) return;
        this.selectedTilesetTiles = this._clipboardTiles.map(r => [...r]);
        this.updateSelectedTileDisplay();
        const px = this._lastMouseTileX ?? this._clipboardOriginX ?? 0;
        const py = this._lastMouseTileY ?? this._clipboardOriginY ?? 0;
        this._createFloatingStamp(px, py);
        this.selectedTilesetTiles = null;
        this.updateSelectedTileDisplay();
    }
    _doCut() {
        if (!this.hasSelection()) return;
        this._clipboardTiles = this._captureSelectionAsStamp();
        this.pushUndo();
        const sx = Math.min(this.selectionStartX, this.selectionEndX), sy = Math.min(this.selectionStartY, this.selectionEndY);
        const ex = Math.max(this.selectionStartX, this.selectionEndX), ey = Math.max(this.selectionStartY, this.selectionEndY);
        for (let y = sy; y <= ey; y++) for (let x = sx; x <= ex; x++) this.level.setTile(this.currentLayer, x, y, -1);
        this.render(); this.saveSessionDebounced();
    }
    _doDelete() {
        if (this.selectedObject) { this.pushUndo(); this.level.removeObject(this.selectedObject); this.selectedObject = null; this.render(); this.saveSessionDebounced(); }
        else if (this.hasSelection()) { this.pushUndo(); const sx = Math.min(this.selectionStartX, this.selectionEndX), sy = Math.min(this.selectionStartY, this.selectionEndY); const ex = Math.max(this.selectionStartX, this.selectionEndX), ey = Math.max(this.selectionStartY, this.selectionEndY); for (let y = sy; y <= ey; y++) for (let x = sx; x <= ex; x++) this.level.setTile(this.currentLayer, x, y, -1); this.render(); this.saveSessionDebounced(); }
    }

    hasSelection() {
        if (this.selectionStartX < 0 || this.selectionEndX < 0) return false;
        if (this._floatingStamp) return true;
        return this.selectionStartX !== this.selectionEndX || this.selectionStartY !== this.selectionEndY;
    }

    _getTightBounds(obj) {
        if (obj._tightBounds !== undefined) return obj._tightBounds;
        const imgName = obj._imgpart?.img || obj.properties?.image;
        if (!imgName) { obj._tightBounds = null; return null; }
        let cached = this._objImgCache?.get(imgName);
        if ((!cached || !cached.complete || !cached.naturalWidth) && imgName.toLowerCase().endsWith('.mng')) {
            const mngC = this._mngAnimCache?.get(imgName) || this._mngAnimCache?.get(imgName.toLowerCase());
            if (mngC && mngC.width > 1) cached = mngC;
        }
        if (!cached || (!(cached instanceof HTMLCanvasElement) && (!cached.complete || !cached.naturalWidth))) { return null; }
        const ip = obj._imgpart;
        const srcX = ip ? ip.x : 0, srcY = ip ? ip.y : 0;
        const srcW = ip ? ip.w : (cached.naturalWidth || cached.width), srcH = ip ? ip.h : (cached.naturalHeight || cached.height);
        const tc = document.createElement('canvas'); tc.width = srcW; tc.height = srcH;
        const tx = tc.getContext('2d', { willReadFrequently: true });
        tx.drawImage(cached, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);
        const data = tx.getImageData(0, 0, srcW, srcH).data;
        let minX = srcW, minY = srcH, maxX = -1, maxY = -1;
        const mask = new Uint8Array(srcW * srcH);
        for (let cy = 0; cy < srcH; cy++) for (let cx = 0; cx < srcW; cx++) {
            if (data[(cy * srcW + cx) * 4 + 3] > 10) {
                mask[cy * srcW + cx] = 1;
                if (cx < minX) minX = cx; if (cx > maxX) maxX = cx;
                if (cy < minY) minY = cy; if (cy > maxY) maxY = cy;
            }
        }
        if (maxX < 0) return null;
        obj._tightBounds = { bx: minX, by: minY, bw: maxX - minX + 1, bh: maxY - minY + 1, srcW, srcH, mask };
        return obj._tightBounds;
    }

    _npcPixelHit(obj, wx, wy) {
        const imgName = obj._imgpart?.img || obj.properties?.image;
        if (!imgName) return true;
        const cached = this._objImgCache?.get(imgName);
        if (!cached || !cached.complete || !cached.naturalWidth) return true;
        const tw = this.level.tileWidth || 16, th = this.level.tileHeight || 16;
        const ox = Math.floor(obj.x), oy = Math.floor(obj.y);
        const gox = (obj._ganiOX ?? 0) / tw, goy = (obj._ganiOY ?? 0) / th;
        const ip = obj._imgpart;
        const ipW = ip ? ip.w : cached.naturalWidth, ipH = ip ? ip.h : cached.naturalHeight;
        const _sx = obj._stretchx ?? 1, _sy = obj._stretchy ?? 1;
        let relPx = Math.floor((wx - ox - gox) * tw), relPy = Math.floor((wy - oy - goy) * th);
        if (_sx < 0) relPx = ipW - 1 - relPx;
        if (_sy < 0) relPy = ipH - 1 - relPy;
        const px = relPx + (ip ? ip.x : 0), py = relPy + (ip ? ip.y : 0);
        if (px < 0 || py < 0 || px >= cached.naturalWidth || py >= cached.naturalHeight) return false;
        if (!this._hitCanvas) { this._hitCanvas = document.createElement('canvas'); this._hitCanvas.width = 1; this._hitCanvas.height = 1; this._hitCtx = this._hitCanvas.getContext('2d', { willReadFrequently: true }); }
        this._hitCtx.clearRect(0, 0, 1, 1);
        this._hitCtx.drawImage(cached, px, py, 1, 1, 0, 0, 1, 1);
        return this._hitCtx.getImageData(0, 0, 1, 1).data[3] > 10;
    }

    _getLightCanvas(imgName, img, sx, sy, sw, sh) {
        if (!imgName) return null;
        if (!this._lightMapCache) this._lightMapCache = new Map();
        const cacheKey = `${imgName}_${sx}_${sy}_${sw}_${sh}`;
        if (this._lightMapCache.has(cacheKey)) return this._lightMapCache.get(cacheKey);
        const tc = document.createElement('canvas'); tc.width = sw; tc.height = sh;
        const tx = tc.getContext('2d', { willReadFrequently: true });
        tx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
        const imageData = tx.getImageData(0, 0, sw, sh);
        const data = imageData.data;
        let dark = 0, opaque = 0, brightGray = 0; const totalPx = data.length / 4;
        for (let i = 0; i < data.length; i += 4) {
            if (data[i+3] < 10) continue;
            opaque++;
            const sat = Math.max(data[i], data[i+1], data[i+2]) - Math.min(data[i], data[i+1], data[i+2]);
            const br = (data[i]+data[i+1]+data[i+2])/3;
            if (sat < 20 && br < 60) dark++;
            if (sat < 40 && br > 100) brightGray++;
        }
        const solidDark = opaque > 50 && dark / opaque > 0.45;
        const transLight = opaque > 10 && opaque / totalPx < 0.6 && brightGray / opaque > 0.5;
        if (!solidDark && !transLight) { this._lightMapCache.set(cacheKey, null); return null; }
        for (let i = 0; i < data.length; i += 4) {
            const brightness = (data[i] + data[i+1] + data[i+2]) / 3;
            data[i+3] = brightness < 30 ? 0 : Math.floor(Math.min(255, brightness * 1.2) * (data[i+3] / 255) * 0.7);
        }
        tx.putImageData(imageData, 0, 0);
        this._lightMapCache.set(cacheKey, tc);
        return tc;
    }

    isPointInSelection(x, y) {
        if (!this.hasSelection()) return false;
        const startX = Math.min(this.selectionStartX, this.selectionEndX);
        const startY = Math.min(this.selectionStartY, this.selectionEndY);
        const endX = Math.max(this.selectionStartX, this.selectionEndX);
        const endY = Math.max(this.selectionStartY, this.selectionEndY);
        return x >= startX && x <= endX && y >= startY && y <= endY;
    }

    getSelectionHandleAt(x, y) {
        if (!this.hasSelection()) return null;
        const startX = Math.min(this.selectionStartX, this.selectionEndX);
        const startY = Math.min(this.selectionStartY, this.selectionEndY);
        const endX = Math.max(this.selectionStartX, this.selectionEndX);
        const endY = Math.max(this.selectionStartY, this.selectionEndY);
        const tileWidth = this.level.tileWidth || 16;
        const tileHeight = this.level.tileHeight || 16;
        const handleSize = Math.max(10, 12 / this.zoom);
        const rect = this.canvas.getBoundingClientRect();
        const ex1 = endX + 1, ey1 = endY + 1;
        const mx = (startX + ex1) / 2, my = (startY + ey1) / 2;
        const handles = [
            { x: startX, y: startY, type: 'nw' },
            { x: ex1,    y: startY, type: 'ne' },
            { x: startX, y: ey1,    type: 'sw' },
            { x: ex1,    y: ey1,    type: 'se' },
            { x: mx,     y: startY, type: 'n' },
            { x: mx,     y: ey1,    type: 's' },
            { x: startX, y: my,     type: 'w' },
            { x: ex1,    y: my,     type: 'e' }
        ];
        for (const handle of handles) {
            const handleCanvasX = handle.x * tileWidth * this.zoom + this.panX;
            const handleCanvasY = handle.y * tileHeight * this.zoom + this.panY;
            const mouseCanvasX = (x - rect.left) * (this.canvas.width / rect.width);
            const mouseCanvasY = (y - rect.top) * (this.canvas.height / rect.height);
            const distX = Math.abs(mouseCanvasX - handleCanvasX);
            const distY = Math.abs(mouseCanvasY - handleCanvasY);
            if (distX <= handleSize && distY <= handleSize) {
                return handle.type;
            }
        }
        return null;
    }

    _captureSelectionAsStamp() {
        if (!this.hasSelection()) return null;
        const sx = Math.min(this.selectionStartX, this.selectionEndX);
        const sy = Math.min(this.selectionStartY, this.selectionEndY);
        const ex = Math.max(this.selectionStartX, this.selectionEndX);
        const ey = Math.max(this.selectionStartY, this.selectionEndY);
        const layer = this.level.layers[this.currentLayer];
        if (!layer) return null;
        const stamp = [];
        for (let y = sy; y <= ey; y++) { const row = []; for (let x = sx; x <= ex; x++) row.push(layer.tiles[y * this.level.width + x] ?? -1); stamp.push(row); }
        return stamp;
    }

    captureSelectionTiles() {
        if (!this.hasSelection()) return;
        this._stampTilesLifted = true;
        const startX = Math.min(this.selectionStartX, this.selectionEndX);
        const startY = Math.min(this.selectionStartY, this.selectionEndY);
        const endX = Math.max(this.selectionStartX, this.selectionEndX);
        const endY = Math.max(this.selectionStartY, this.selectionEndY);
        const width = endX - startX + 1;
        const height = endY - startY + 1;
        const layer = this.level.layers[this.currentLayer];
        if (!layer || !layer.tiles) return;
        this.selectionTiles = [];
        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                const tx = startX + x;
                const ty = startY + y;
                if (tx >= 0 && tx < this.level.width && ty >= 0 && ty < this.level.height) {
                    const idx = ty * this.level.width + tx;
                    row.push(layer.tiles[idx] || 0);
                } else {
                    row.push(0);
                }
            }
            this.selectionTiles.push(row);
        }
    }

    finalizeSelectionMove() {
        if (!this.selectionTiles || !this.hasSelection() || this.originalSelectionX < 0) return;
        this.pushUndo();
        const newSX = Math.min(this.selectionStartX, this.selectionEndX);
        const newSY = Math.min(this.selectionStartY, this.selectionEndY);
        const newEX = Math.max(this.selectionStartX, this.selectionEndX);
        const newEY = Math.max(this.selectionStartY, this.selectionEndY);
        const width = newEX - newSX + 1, height = newEY - newSY + 1;
        const oldSX = this.originalSelectionX, oldSY = this.originalSelectionY;
        const layer = this.level.layers[this.currentLayer];
        if (!layer || !layer.tiles) return;
        // Pass 1: erase old positions that don't overlap with new selection (only if tiles were actually lifted)
        if (this._stampTilesLifted) {
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const ox = oldSX + x, oy = oldSY + y;
                    if (ox < 0 || ox >= this.level.width || oy < 0 || oy >= this.level.height) continue;
                    if (ox < newSX || ox > newEX || oy < newSY || oy > newEY)
                        layer.tiles[oy * this.level.width + ox] = this.defaultTile;
                }
            }
        }
        // Pass 2: write new positions from snapshot
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const nx = newSX + x, ny = newSY + y;
                if (nx < 0 || nx >= this.level.width || ny < 0 || ny >= this.level.height) continue;
                if (this.selectionTiles[y]?.[x] !== undefined)
                    layer.tiles[ny * this.level.width + nx] = this.selectionTiles[y][x];
            }
        }
        this.originalSelectionX = -1;
        this.originalSelectionY = -1;
    }

    drawSelection() {
        if (this.selectionStartX < 0 || this.selectionEndX < 0) return;
        const startX = Math.min(this.selectionStartX, this.selectionEndX);
        const startY = Math.min(this.selectionStartY, this.selectionEndY);
        const endX = Math.max(this.selectionStartX, this.selectionEndX);
        const endY = Math.max(this.selectionStartY, this.selectionEndY);
        const tw = this.level.tileWidth || 16, th = this.level.tileHeight || 16;
        const x = startX * tw, y = startY * th;
        const w = (endX - startX + 1) * tw, h = (endY - startY + 1) * th;
        this.ctx.fillStyle = 'rgba(255, 105, 180, 0.25)';
        this.ctx.fillRect(x, y, w, h);
        this.ctx.strokeStyle = 'rgb(255, 105, 180)';
        this.ctx.lineWidth = 1.5 / this.zoom;
        this.ctx.strokeRect(x, y, w, h);
        if (this.currentTool === 'select' || this._floatingStamp) {
            const hs = Math.max(3, 5 / this.zoom);
            const mx = (startX + endX + 1) / 2 * tw, my = (startY + endY + 1) / 2 * th;
            const rx = (endX + 1) * tw, ry = (endY + 1) * th;
            const pts = [[x,y],[mx,y],[rx,y],[rx,my],[rx,ry],[mx,ry],[x,ry],[x,my]];
            this.ctx.fillStyle = '#ffffff';
            this.ctx.strokeStyle = 'rgb(255,105,180)';
            this.ctx.lineWidth = 1 / this.zoom;
            for (const [px,py] of pts) { this.ctx.fillRect(px-hs/2,py-hs/2,hs,hs); this.ctx.strokeRect(px-hs/2,py-hs/2,hs,hs); }
        }
    }

    drawMovingSelection() {
        if (!this.selectionTiles || !this.level.tilesetImage) return;
        const startX = Math.min(this.selectionStartX, this.selectionEndX);
        const startY = Math.min(this.selectionStartY, this.selectionEndY);
        const tileWidth = this.level.tileWidth || 16;
        const tileHeight = this.level.tileHeight || 16;
        const tilesPerRow = Math.floor(this.level.tilesetImage.width / tileWidth);
        this.ctx.globalAlpha = 0.7;
        for (let y = 0; y < this.selectionTiles.length; y++) {
            for (let x = 0; x < this.selectionTiles[y].length; x++) {
                const tileIndex = this.selectionTiles[y][x];
                if (tileIndex >= 0) {
                    const tileX = (tileIndex % tilesPerRow) * tileWidth;
                    const tileY = Math.floor(tileIndex / tilesPerRow) * tileHeight;
                    const destX = (startX + x) * tileWidth;
                    const destY = (startY + y) * tileHeight;
                    this.ctx.drawImage(
                        this.level.tilesetImage,
                        tileX, tileY, tileWidth, tileHeight,
                        destX, destY, tileWidth, tileHeight
                    );
                }
            }
        }
        this.ctx.globalAlpha = 1.0;
    }

    drawDraggedTile() {
        if (!this.level.tilesetImage) return;
        const rect = this.canvas.getBoundingClientRect();
        const tileWidth = this.level.tileWidth || 16;
        const tileHeight = this.level.tileHeight || 16;
        this.ctx.save();
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.globalAlpha = 0.7;
        const snapPanX = Math.floor(this.panX);
        const snapPanY = Math.floor(this.panY);

        if (this.selectedTilesetTiles && this.selectedTilesetTiles.length > 0) {
            const tilesPerRow = Math.floor(this.level.tilesetImage.width / tileWidth);
            const selWidth = this.selectedTilesetTiles[0].length;
            const selHeight = this.selectedTilesetTiles.length;
            const mouseX = (this.isDraggingTileSelection ? this.tileSelectionDragX : this.dragMouseX) - rect.left;
            const mouseY = (this.isDraggingTileSelection ? this.tileSelectionDragY : this.dragMouseY) - rect.top;
            if (mouseX < 0 || mouseX > rect.width || mouseY < 0 || mouseY > rect.height) { this.ctx.restore(); return; }
            const worldX = (mouseX - snapPanX) / this.zoom;
            const worldY = (mouseY - snapPanY) / this.zoom;
            const tileDrawX = Math.floor(worldX / tileWidth) * tileWidth;
            const tileDrawY = Math.floor(worldY / tileHeight) * tileHeight;
            for (let y = 0; y < selHeight; y++) {
                for (let x = 0; x < selWidth; x++) {
                    if (this.selectedTilesetTiles[y] && this.selectedTilesetTiles[y][x] !== undefined && this.selectedTilesetTiles[y][x] >= 0) {
                        const tileIndex = this.selectedTilesetTiles[y][x];
                        const tileX = (tileIndex % tilesPerRow) * tileWidth;
                        const tileY = Math.floor(tileIndex / tilesPerRow) * tileHeight;
                        const destX = tileDrawX + x * tileWidth;
                        const destY = tileDrawY + y * tileHeight;
                        this.ctx.drawImage(
                            this.level.tilesetImage,
                            tileX, tileY, tileWidth, tileHeight,
                            destX, destY,
                            tileWidth,
                            tileHeight
                        );
                    }
                }
            }
        } else if (this.draggedTileIndex >= 0) {
            const tilesPerRow = Math.floor(this.level.tilesetImage.width / tileWidth);
            const tileX = (this.draggedTileIndex % tilesPerRow) * tileWidth;
            const tileY = Math.floor(this.draggedTileIndex / tilesPerRow) * tileHeight;
            const drawX = this.dragMouseX - rect.left - (tileWidth * this.zoom) / 2;
            const drawY = this.dragMouseY - rect.top - (tileHeight * this.zoom) / 2;
            this.ctx.drawImage(
                this.level.tilesetImage,
                tileX, tileY, tileWidth, tileHeight,
                drawX, drawY,
                tileWidth * this.zoom,
                tileHeight * this.zoom
            );
        }

        this.ctx.globalAlpha = 1.0;
        this.ctx.restore();
    }

    invalidateLayerCache() {
        this._layerCache = null;
    }

    _getLayerCache(layerIndex) {
        if (!this._layerCache) this._layerCache = new Map();
        if (this._layerCache.has(layerIndex)) return this._layerCache.get(layerIndex);
        const tw = this.level.tileWidth || 16, th = this.level.tileHeight || 16;
        const tilesPerRow = Math.floor(this.level.tilesetImage.width / tw);
        const layer = this.level.layers[layerIndex];
        const maxDim = 8192;
        const mapW = Math.min(this.level.width * tw, maxDim);
        const mapH = Math.min(this.level.height * th, maxDim);
        const oc = new OffscreenCanvas(mapW, mapH);
        const octx = oc.getContext('2d');
        const maxTileX = Math.floor(mapW / tw), maxTileY = Math.floor(mapH / th);
        for (let y = 0; y < maxTileY; y++) {
            for (let x = 0; x < maxTileX; x++) {
                const tileIndex = layer.tiles[y * this.level.width + x];
                const drawIndex = tileIndex < 0 ? (layerIndex === 0 ? 0 : -1) : tileIndex;
                if (drawIndex < 0) continue;
                const tileX = (drawIndex % tilesPerRow) * tw;
                const tileY = Math.floor(drawIndex / tilesPerRow) * th;
                octx.drawImage(this.level.tilesetImage, tileX, tileY, tw, th, x * tw, y * th, tw, th);
            }
        }
        this._layerCache.set(layerIndex, oc);
        return oc;
    }

    drawLayer(layerIndex) {
        if (!this.level || !this.level.tilesetImage || this.level.tilesetImage.complete === false) return;
        if (!this.level.width || !this.level.height) return;
        const layer = this.level.layers[layerIndex];
        if (!layer || !layer.tiles) return;
        const tw = this.level.tileWidth || 16, th = this.level.tileHeight || 16;
        const tilePixelSize = tw * this.zoom;
        if (tilePixelSize < 4 && (this.level.width > 64 || this.level.height > 64)) {
            const cached = this._getLayerCache(layerIndex);
            this.ctx.drawImage(cached, 0, 0, cached.width, cached.height, 0, 0, this.level.width * tw, this.level.height * th);
            return;
        }
        const tilesPerRow = Math.floor(this.level.tilesetImage.width / tw);
        const snapPanX = Math.floor(this.panX), snapPanY = Math.floor(this.panY);
        const startX = Math.max(0, Math.floor(-snapPanX / (tw * this.zoom)));
        const startY = Math.max(0, Math.floor(-snapPanY / (th * this.zoom)));
        const endX = Math.min(this.level.width, Math.ceil((this.canvas.width - snapPanX) / (tw * this.zoom)));
        const endY = Math.min(this.level.height, Math.ceil((this.canvas.height - snapPanY) / (th * this.zoom)));
        const skip = tilePixelSize < 1 ? 8 : tilePixelSize < 2 ? 4 : tilePixelSize < 4 ? 2 : 1;
        for (let y = startY; y < endY; y += skip) {
            for (let x = startX; x < endX; x += skip) {
                const tileIndex = layer.tiles[y * this.level.width + x];
                const drawIndex = tileIndex < 0 ? (layerIndex === 0 ? 0 : -1) : tileIndex;
                if (drawIndex < 0) continue;
                const tileX = (drawIndex % tilesPerRow) * tw;
                const tileY = Math.floor(drawIndex / tilesPerRow) * th;
                this.ctx.drawImage(this.level.tilesetImage, tileX, tileY, tw, th, x * tw, y * th, tw * skip, th * skip);
            }
        }
    }

    drawGrid() {
        const tw = this.level.tileWidth || 16;
        const th = this.level.tileHeight || 16;
        this.ctx.strokeStyle = 'rgba(220, 220, 255, 0.6)';
        this.ctx.lineWidth = 1 / this.zoom;
        for (let x = 0; x <= this.level.width; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * tw, 0);
            this.ctx.lineTo(x * tw, this.level.height * th);
            this.ctx.stroke();
        }
        for (let y = 0; y <= this.level.height; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * th);
            this.ctx.lineTo(this.level.width * tw, y * th);
            this.ctx.stroke();
        }
        if (this.level.width > 64 || this.level.height > 64) {
            this.drawGmapDividers();
        } else {
            const name = this.levels[this.currentLevelIndex]?.name;
            if (name) {
                const fs = Math.max(10, 13 / this.zoom);
                this.ctx.font = `bold ${fs}px monospace`;
                this.ctx.textBaseline = 'top';
                this.ctx.lineJoin = 'round';
                this.ctx.strokeStyle = 'rgba(0,0,0,0.95)';
                this.ctx.lineWidth = 4 / this.zoom;
                this.ctx.fillStyle = '#ffffff';
                const px = 5 / this.zoom, py = 5 / this.zoom;
                this.ctx.strokeText(name, px, py);
                this.ctx.fillText(name, px, py);
            }
        }
    }

    drawGmapDividers() {
        const tw = this.level.tileWidth || 16, th = this.level.tileHeight || 16;
        const cw = 64 * tw, ch = 64 * th;
        this.ctx.strokeStyle = 'rgba(255, 100, 100, 0.9)';
        this.ctx.lineWidth = 2 / this.zoom;
        for (let x = 0; x <= this.level.width; x += 64) {
            this.ctx.beginPath(); this.ctx.moveTo(x * tw, 0); this.ctx.lineTo(x * tw, this.level.height * th); this.ctx.stroke();
        }
        for (let y = 0; y <= this.level.height; y += 64) {
            this.ctx.beginPath(); this.ctx.moveTo(0, y * th); this.ctx.lineTo(this.level.width * tw, y * th); this.ctx.stroke();
        }
        const entry = this.levels[this.currentLevelIndex];
        const grid = entry?.gmapGrid;
        if (!grid) return;
        const fs = Math.max(10, 13 / this.zoom);
        this.ctx.font = `bold ${fs}px monospace`;
        this.ctx.textBaseline = 'top';
        this.ctx.lineJoin = 'round';
        this.ctx.strokeStyle = 'rgba(0,0,0,0.95)';
        this.ctx.lineWidth = 4 / this.zoom;
        this.ctx.fillStyle = '#ffffff';
        for (let cellY = 0; cellY < grid.length; cellY++) {
            for (let cellX = 0; cellX < (grid[cellY]?.length || 0); cellX++) {
                const name = grid[cellY][cellX];
                if (!name) continue;
                const px = cellX * cw + 5 / this.zoom;
                const py = cellY * ch + 5 / this.zoom;
                this.ctx.strokeText(name, px, py);
                this.ctx.fillText(name, px, py);
            }
        }
    }

    loadDefaultTileset() {
        const img = new Image();
        img.onload = () => {
            console.log('[loadDefaultTileset] pics1.png loaded, complete:', img.complete, 'levels:', this.levels.length);
            if (this.levels.length === 0) {
                const sessionRaw = localStorage.getItem('levelEditorSession');
                let restored = false;
                if (sessionRaw) {
                    try {
                        const data = JSON.parse(sessionRaw);
                        if (!data.formatVersion) { localStorage.removeItem('levelEditorSession'); throw new Error('stale'); }
                        if (data.zoom !== undefined) { this.zoomLevel = data.zoom; this.updateZoomFromLevel(); }
                        if (data.panX !== undefined) this.panX = data.panX;
                        if (data.panY !== undefined) this.panY = data.panY;
                        if (data.showGrid !== undefined) this.showGrid = data.showGrid;
                        if (data.levels && data.levels.length) {
                            for (const ld of data.levels) {
                                if (ld.gmap) {
                                    const entry = this._buildGmapEntry(ld.gmap, ld.name, ld.gmapLevels);
                                    if (entry) { entry.level.tilesetImage = img; this.levels.push(entry); }
                                    continue;
                                }
                                if (ld.graalBinary) {
                                    const level = Level.loadFromGraal(this._fromB64(ld.graalBinary));
                                    if (level) { level.tilesetImage = img; level.tilesetName = ld.tilesetName || 'pics1.png'; if (ld.tiledefs) level._tiledefs = ld.tiledefs; this.levels.push({ level, name: ld.name || 'level', modified: ld.modified || false }); }
                                } else {
                                    const level = Level.loadFromNW(ld.nw);
                                    if (level) {
                                        level.tilesetImage = img;
                                        level.tilesetName = ld.tilesetName || 'pics1.png';
                                        if (ld.sourceFormat) level._sourceFormat = ld.sourceFormat;
                                        if (ld.tiledefs) level._tiledefs = ld.tiledefs;
                                        this.levels.push({ level, name: ld.name || 'level', modified: ld.modified || false });
                                    }
                                }
                            }
                            if (this.levels.length) {
                                this.currentLevelIndex = Math.min(data.currentLevelIndex || 0, this.levels.length - 1);
                                this.level = this.levels[this.currentLevelIndex].level;
                                this.newTabCounter = this.levels.reduce((m, l) => { const n = parseInt(l.name?.replace('new ','')); return isNaN(n) ? m : Math.max(m, n); }, 0);
                                this.levels.forEach((_, i) => this.addLevelTab(i));
                                const _combo = document.getElementById('tilesetsCombo');
                                if (_combo && this.level?.tilesetName && this.level.tilesetName !== 'pics1.png') {
                                    const _ts = this.level.tilesetName;
                                    if (![..._combo.options].some(o => o.value === _ts)) { const _o = document.createElement('option'); _o.value = _o.textContent = _ts; _combo.appendChild(_o); }
                                    _combo.value = _ts;
                                    setTimeout(() => this.loadTilesetImage(_ts), 0);
                                }
                                restored = true;
                            }
                        } else if (data.level) {
                            const level = Level.loadFromNW(data.level);
                            if (level) {
                                level.tilesetImage = img;
                                level.tilesetName = data.tilesetName || 'pics1.png';
                                this.levels.push({ level, name: data.name || 'level', modified: false });
                                this.currentLevelIndex = 0;
                                this.level = level;
                                this.addLevelTab(0);
                                restored = true;
                            }
                        }
                    } catch(e) {}
                }
                if (!restored) {
                    const wEl = document.getElementById('levelWidth');
                    const hEl = document.getElementById('levelHeight');
                    const w = wEl ? parseInt(wEl.value) || 64 : 64;
                    const h = hEl ? parseInt(hEl.value) || 64 : 64;
                    const level = new Level(w, h);
                    level.tilesetImage = img;
                    level.tilesetName = 'pics1.png';
                    this.levels.push({ level, name: `new ${++this.newTabCounter}`, modified: false });
                    this.currentLevelIndex = 0;
                    this.level = level;
                    this.addLevelTab(0);
                }
            } else {
                for (let i = 0; i < this.levels.length; i++) {
                    if (!this.levels[i].level.tilesetName || this.levels[i].level.tilesetName === 'pics1.png') this.levels[i].level.tilesetImage = img;
                }
                if (!this.level.tilesetName || this.level.tilesetName === 'pics1.png') { this.level.tilesetImage = img; this.level.tilesetName = 'pics1.png'; }
            }
            this.updateTilesetDisplay();
            this.defaultTile = 0;
            this.updateSelectedTileCanvas();
            console.log('[loadDefaultTileset] before setTimeout: level.tilesetImage=', this.level?.tilesetImage, 'levels.length=', this.levels.length, 'currentLevelIndex=', this.currentLevelIndex);
            setTimeout(() => { console.log('[render timeout] canvas:', this.canvas?.width, 'x', this.canvas?.height, 'zoom:', this.zoom, 'tilesetW:', this.level?.tilesetImage?.width, 'levelW:', this.level?.width, 'levelH:', this.level?.height, 'tile0:', this.level?.layers?.[0]?.tiles?.[0]); this.render(); if (this._initLoader) { this._initLoader.close(); this._initLoader = null; } }, 0);
        };
        img.onerror = () => {
            console.warn('[loadDefaultTileset] pics1.png FAILED, using fallback canvas');
            if (this._initLoader) { this._initLoader.close(); this._initLoader = null; }
            this.createFallbackTileset();
        };
        img.src = 'images/pics1.png';
    }

    createFallbackTileset() {
        this.tilesetCanvas = document.createElement('canvas');
        this.tilesetCanvas.width = 256;
        this.tilesetCanvas.height = 256;
        const ctx = this.tilesetCanvas.getContext('2d');

        for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
                const color = ((x + y) % 2 === 0) ? '#4a4a4a' : '#6a6a6a';
                ctx.fillStyle = color;
                ctx.fillRect(x * 16, y * 16, 16, 16);
            }
        }

        this.level.tilesetImage = this.tilesetCanvas;
        this.updateTilesetDisplay();
        this.defaultTile = 0;
        this.updateSelectedTileCanvas();
        this.render();
    }

    loadTileset() {
        const input = document.getElementById('imageInput');
        input.click();

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        if (!this._tilesetDataCache) this._tilesetDataCache = {};
                        this._tilesetDataCache[file.name] = event.target.result;
                        try { localStorage.setItem('levelEditor_tilesetCache', JSON.stringify(this._tilesetDataCache)); } catch(e) {}
                        this.level.tilesetImage = img;
                        this.level.tilesetName = file.name;
                        const combo = document.getElementById('tilesetsCombo');
                        if (combo && ![...combo.options].some(o => o.value === file.name)) {
                            const opt = document.createElement('option');
                            opt.value = opt.textContent = file.name;
                            combo.appendChild(opt);
                        }
                        if (combo) combo.value = file.name;
                        this.updateTilesetDisplay();
                        if (this.defaultTile < 0) this.defaultTile = 0;
                        this.updateSelectedTileCanvas();
                        this.render();
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        };
    }

    updateTilesetDisplay() {
        const tilesetCanvas = document.getElementById('tilesetCanvas');
        if (!tilesetCanvas) return;
        
        if (this.level.tilesetImage && this.level.tilesetImage.complete) {
            tilesetCanvas.width = this.level.tilesetImage.width;
            tilesetCanvas.height = this.level.tilesetImage.height;
            tilesetCanvas.style.width = (this.level.tilesetImage.width * this.tilesetZoom) + 'px';
            tilesetCanvas.style.height = (this.level.tilesetImage.height * this.tilesetZoom) + 'px';

            const ctx = tilesetCanvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;

            ctx.clearRect(0, 0, tilesetCanvas.width, tilesetCanvas.height);
            ctx.drawImage(this.level.tilesetImage, 0, 0);

            if (this.tilesetSelectionStartX >= 0 && this.tilesetSelectionEndX >= 0) {
                const tileWidth = this.level.tileWidth || 16;
                const tileHeight = this.level.tileHeight || 16;
                const startX = Math.min(this.tilesetSelectionStartX, this.tilesetSelectionEndX);
                const startY = Math.min(this.tilesetSelectionStartY, this.tilesetSelectionEndY);
                const endX = Math.max(this.tilesetSelectionStartX, this.tilesetSelectionEndX);
                const endY = Math.max(this.tilesetSelectionStartY, this.tilesetSelectionEndY);
                const width = (endX - startX + 1) * tileWidth;
                const height = (endY - startY + 1) * tileHeight;
                const x = startX * tileWidth;
                const y = startY * tileHeight;

                ctx.fillStyle = 'rgba(255, 255, 255, 0.235)';
                ctx.fillRect(x, y, width, height);

                ctx.strokeStyle = 'rgba(255, 255, 255, 1.0)';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, width, height);
            } else if (this.selectedTile >= 0) {
                const tileWidth = this.level.tileWidth || 16;
                const tileHeight = this.level.tileHeight || 16;
                const tilesPerRow = Math.floor(this.level.tilesetImage.width / tileWidth);
                const selectedX = (this.selectedTile % tilesPerRow) * tileWidth;
                const selectedY = Math.floor(this.selectedTile / tilesPerRow) * tileHeight;

                ctx.fillStyle = 'rgba(255, 255, 255, 0.235)';
                ctx.fillRect(selectedX, selectedY, tileWidth, tileHeight);

                ctx.strokeStyle = 'rgba(255, 255, 255, 1.0)';
                ctx.lineWidth = 1;
                ctx.strokeRect(selectedX, selectedY, tileWidth, tileHeight);
            }

            if (!tilesetCanvas._handlersSet) {
                let tilesetDragStart = false;

                tilesetCanvas.addEventListener('mousedown', (e) => {
                    if (!this.level.tilesetImage) return;
                    
                    if (e.button === 1) {
                        const tilesetDisplay = tilesetCanvas.parentElement;
                        if (tilesetDisplay) {
                            this.isPanningTileset = true;
                            this.tilesetPanStartX = e.clientX;
                            this.tilesetPanStartY = e.clientY;
                            this.tilesetPanStartScrollLeft = tilesetDisplay.scrollLeft;
                            this.tilesetPanStartScrollTop = tilesetDisplay.scrollTop;
                            e.preventDefault();
                        }
                        return;
                    }

                    if (e.button !== 0) return;

                    const tileWidth = this.level.tileWidth || 16;
                    const tileHeight = this.level.tileHeight || 16;
                    const rect = tilesetCanvas.getBoundingClientRect();
                    const scaleX = tilesetCanvas.width / rect.width;
                    const scaleY = tilesetCanvas.height / rect.height;
                    const canvasX = (e.clientX - rect.left) * scaleX;
                    const canvasY = (e.clientY - rect.top) * scaleY;
                    const x = Math.floor(canvasX / tileWidth);
                    const y = Math.floor(canvasY / tileHeight);
                    const tilesPerRow = Math.floor(this.level.tilesetImage.width / tileWidth);
                    const maxY = Math.floor(this.level.tilesetImage.height / tileHeight);

                    if (x >= 0 && y >= 0 && x < tilesPerRow && y < maxY) {
                        const isInSelection = this.tilesetSelectionStartX >= 0 && 
                            x >= Math.min(this.tilesetSelectionStartX, this.tilesetSelectionEndX) &&
                            x <= Math.max(this.tilesetSelectionStartX, this.tilesetSelectionEndX) &&
                            y >= Math.min(this.tilesetSelectionStartY, this.tilesetSelectionEndY) &&
                            y <= Math.max(this.tilesetSelectionStartY, this.tilesetSelectionEndY);

                        if (isInSelection) {
                            if (!this.selectedTilesetTiles) this.captureTilesetSelection();
                            this.isDraggingTileSelection = true;
                            this.tileSelectionDragX = e.clientX;
                            this.tileSelectionDragY = e.clientY;
                            this.render();
                            tilesetDragStart = false;
                        } else {
                            this.tilesetSelectionStartX = -1;
                            this.tilesetSelectionEndX = -1;
                            this.tilesetSelectionStartY = -1;
                            this.tilesetSelectionEndY = -1;
                            this.selectedTilesetTiles = null;
                            this.updateSelectedTileDisplay();
                            this.isSelectingTileset = true;
                            this.tilesetSelectionStartX = x;
                            this.tilesetSelectionStartY = y;
                            this.tilesetSelectionEndX = x;
                            this.tilesetSelectionEndY = y;
                            this.updateTilesetDisplay();
                        }
                        e.preventDefault();
                        e.stopPropagation();
                    }
                });

                tilesetCanvas.addEventListener('click', (e) => {
                    if (tilesetDragStart) {
                        tilesetDragStart = false;
                        if (this.selectedTilesetTiles && this.tilesetSelectionStartX >= 0) {
                            this.isDraggingFromTileset = true;
                            this.dragMouseX = e.clientX;
                            this.dragMouseY = e.clientY;
                        }
                        return;
                    }
                    if (this.selectedTilesetTiles && this.tilesetSelectionStartX >= 0) {
                        const tileWidth = this.level.tileWidth || 16;
                        const tileHeight = this.level.tileHeight || 16;
                        const rect = tilesetCanvas.getBoundingClientRect();
                        const scaleX = tilesetCanvas.width / rect.width;
                        const scaleY = tilesetCanvas.height / rect.height;
                        const canvasX = (e.clientX - rect.left) * scaleX;
                        const canvasY = (e.clientY - rect.top) * scaleY;
                        const x = Math.floor(canvasX / tileWidth);
                        const y = Math.floor(canvasY / tileHeight);
                        const tilesPerRow = Math.floor(this.level.tilesetImage.width / tileWidth);
                        const maxY = Math.floor(this.level.tilesetImage.height / tileHeight);
                        if (x >= 0 && y >= 0 && x < tilesPerRow && y < maxY) {
                            const isInSelection = x >= Math.min(this.tilesetSelectionStartX, this.tilesetSelectionEndX) &&
                                x <= Math.max(this.tilesetSelectionStartX, this.tilesetSelectionEndX) &&
                                y >= Math.min(this.tilesetSelectionStartY, this.tilesetSelectionEndY) &&
                                y <= Math.max(this.tilesetSelectionStartY, this.tilesetSelectionEndY);
                            if (isInSelection) {
                                if (!this.selectedTilesetTiles) this.captureTilesetSelection();
                                this.isDraggingFromTileset = true;
                                this.dragMouseX = e.clientX;
                                this.dragMouseY = e.clientY;
                            } else {
                                this.tilesetSelectionStartX = -1;
                                this.tilesetSelectionEndX = -1;
                                this.tilesetSelectionStartY = -1;
                                this.tilesetSelectionEndY = -1;
                                this.selectedTilesetTiles = null;
                                this.updateSelectedTileDisplay();
                                this.updateTilesetDisplay();
                            }
                        }
                    }
                });

                tilesetCanvas.addEventListener('dblclick', (e) => {
                    if (!this.level.tilesetImage) return;
                    const tileWidth = this.level.tileWidth || 16;
                    const tileHeight = this.level.tileHeight || 16;
                    const rect = tilesetCanvas.getBoundingClientRect();
                    const scaleX = tilesetCanvas.width / rect.width;
                    const scaleY = tilesetCanvas.height / rect.height;
                    const canvasX = (e.clientX - rect.left) * scaleX;
                    const canvasY = (e.clientY - rect.top) * scaleY;
                    const x = Math.floor(canvasX / tileWidth);
                    const y = Math.floor(canvasY / tileHeight);
                    const tilesPerRow = Math.floor(this.level.tilesetImage.width / tileWidth);

                    if (x >= 0 && y >= 0 && x < tilesPerRow && y < Math.floor(this.level.tilesetImage.height / tileHeight)) {
                        const tileIndex = y * tilesPerRow + x;
                        this.defaultTile = tileIndex;
                        this.updateSelectedTileCanvas();
                        this.updateTilesetDisplay();
                    }
                });

                tilesetCanvas.addEventListener('wheel', (e) => {
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        const zoomFactors = [1.0, 2.0, 3.0, 4.0, 6.0, 8.0];
                        if (e.deltaY > 0) {
                            this.tilesetZoomLevel = Math.max(0, this.tilesetZoomLevel - 1);
                        } else {
                            this.tilesetZoomLevel = Math.min(zoomFactors.length - 1, this.tilesetZoomLevel + 1);
                        }
                        this.tilesetZoom = zoomFactors[this.tilesetZoomLevel];
                        localStorage.setItem('levelEditor_tilesetZoom', this.tilesetZoom);
                        const tzs = document.getElementById('tilesetZoomSlider'); if (tzs) { tzs.value = this.tilesetZoom; const tzl = document.getElementById('tilesetZoomLabel'); if (tzl) tzl.textContent = this.tilesetZoom + 'x'; }
                        this.updateTilesetDisplay();
                    } else {
                        e.preventDefault();
                        const tilesetDisplay = tilesetCanvas.parentElement;
                        if (tilesetDisplay) {
                            if (e.shiftKey || e.altKey) {
                                tilesetDisplay.scrollTop += e.deltaY;
                            } else {
                                tilesetDisplay.scrollLeft += e.deltaY;
                            }
                        }
                    }
                });
                tilesetCanvas.addEventListener('auxclick', (e) => {
                    if (e.button === 2) {
                        if (!this.level.tilesetImage) return;
                        const tileWidth = this.level.tileWidth || 16;
                        const tileHeight = this.level.tileHeight || 16;
                        const rect = tilesetCanvas.getBoundingClientRect();
                        const scaleX = tilesetCanvas.width / rect.width;
                        const scaleY = tilesetCanvas.height / rect.height;
                        const canvasX = (e.clientX - rect.left) * scaleX;
                        const canvasY = (e.clientY - rect.top) * scaleY;
                        const x = Math.floor(canvasX / tileWidth);
                        const y = Math.floor(canvasY / tileHeight);
                        const tilesPerRow = Math.floor(this.level.tilesetImage.width / tileWidth);
                        const maxY = Math.floor(this.level.tilesetImage.height / tileHeight);
                        if (x >= 0 && y >= 0 && x < tilesPerRow && y < maxY) {
                            const tileIndex = y * tilesPerRow + x;
                            this.defaultTile = tileIndex;
                            this.updateSelectedTileCanvas();
                            e.preventDefault();
                        }
                        if (this.tilesetSelectionStartX >= 0) {
                            this.tilesetSelectionStartX = -1;
                            this.tilesetSelectionStartY = -1;
                            this.tilesetSelectionEndX = -1;
                            this.tilesetSelectionEndY = -1;
                            this.selectedTilesetTiles = null;
                            this.updateTilesetDisplay();
                            e.preventDefault();
                        }
                    }
                });
                tilesetCanvas.addEventListener('contextmenu', (e) => e.preventDefault());

                tilesetCanvas.addEventListener('mousemove', (e) => {
                    if (this.isPanningTileset) {
                        const tilesetDisplay = tilesetCanvas.parentElement;
                        if (tilesetDisplay) {
                            const deltaX = this.tilesetPanStartX - e.clientX;
                            const deltaY = this.tilesetPanStartY - e.clientY;
                            tilesetDisplay.scrollLeft = this.tilesetPanStartScrollLeft + deltaX;
                            tilesetDisplay.scrollTop = this.tilesetPanStartScrollTop + deltaY;
                        }
                    } else {
                        const tileWidth = this.level.tileWidth || 16;
                        const tileHeight = this.level.tileHeight || 16;
                        const rect = tilesetCanvas.getBoundingClientRect();
                        const scaleX = tilesetCanvas.width / rect.width;
                        const scaleY = tilesetCanvas.height / rect.height;
                        const canvasX = (e.clientX - rect.left) * scaleX;
                        const canvasY = (e.clientY - rect.top) * scaleY;
                        const x = Math.floor(canvasX / tileWidth);
                        const y = Math.floor(canvasY / tileHeight);
                        if (!this.level?.tilesetImage) return;
                        const tilesPerRow = Math.floor(this.level.tilesetImage.width / tileWidth);
                        const maxY = Math.floor(this.level.tilesetImage.height / tileHeight);
                        if (x >= 0 && y >= 0 && x < tilesPerRow && y < maxY) {
                            this.updateMouseCoords(x, y, 'tileset');
                            if (this.isSelectingTileset) {
                                this.tilesetSelectionEndX = x;
                                this.tilesetSelectionEndY = y;
                                this.updateTilesetDisplay();
                            }
                        }
                        if (this.isDraggingFromTileset) {
                            this.dragMouseX = e.clientX;
                            this.dragMouseY = e.clientY;
                            this.render();
                        }
                    }
                });

                const handleTilesetMouseUp = (e) => {
                    if (e.button === 1 && this.isPanningTileset) {
                        const tilesetDisplay = tilesetCanvas.parentElement;
                        if (tilesetDisplay) {
                        }
                        this.isPanningTileset = false;
                        return;
                    }

                    if (this.isSelectingTileset) {
                        this.captureTilesetSelection();
                        this.isSelectingTileset = false;
                        tilesetDragStart = false;
                    } else if (this.isDraggingFromTileset) {
                        const rect = this.canvas.getBoundingClientRect();
                        const tileWidth = this.level.tileWidth || 16;
                        const tileHeight = this.level.tileHeight || 16;
                        const canvasX = Math.floor((e.clientX - rect.left - this.panX) / (tileWidth * this.zoom));
                        const canvasY = Math.floor((e.clientY - rect.top - this.panY) / (tileHeight * this.zoom));
                        if (canvasX >= 0 && canvasX < this.level.width && canvasY >= 0 && canvasY < this.level.height) {
                            if (this.selectedTilesetTiles && this.selectedTilesetTiles.length > 0) {
                                const startX = Math.min(this.tilesetSelectionStartX, this.tilesetSelectionEndX);
                                const startY = Math.min(this.tilesetSelectionStartY, this.tilesetSelectionEndY);
                                const selWidth = Math.abs(this.tilesetSelectionEndX - this.tilesetSelectionStartX) + 1;
                                const selHeight = Math.abs(this.tilesetSelectionEndY - this.tilesetSelectionStartY) + 1;
                                const tilesPerRow = Math.floor(this.level.tilesetImage.width / tileWidth);
                                for (let dy = 0; dy < selHeight && canvasY + dy < this.level.height; dy++) {
                                    for (let dx = 0; dx < selWidth && canvasX + dx < this.level.width; dx++) {
                                        if (this.selectedTilesetTiles[dy] && this.selectedTilesetTiles[dy][dx] !== undefined) {
                                            this.level.setTile(this.currentLayer, canvasX + dx, canvasY + dy, this.selectedTilesetTiles[dy][dx]);
                                        }
                                    }
                                }
                            } else {
                                this.level.setTile(this.currentLayer, canvasX, canvasY, this.draggedTileIndex);
                            }
                        }
                        this.isDraggingFromTileset = false;
                        this.draggedTileIndex = -1;
                        tilesetDragStart = false;
                        this.render();
                    }
                };

                tilesetCanvas.addEventListener('mouseup', handleTilesetMouseUp);
                document.addEventListener('mouseup', handleTilesetMouseUp);

                tilesetCanvas._handlersSet = true;
            }
        } else {
            tilesetCanvas.width = 256;
            tilesetCanvas.height = 256;
            const ctx = tilesetCanvas.getContext('2d');
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, tilesetCanvas.width, tilesetCanvas.height);
        }
    }

    updateTilesList() {
        const tilesList = document.getElementById('tilesList');
        tilesList.innerHTML = '';

        if (!this.level.tilesetImage) return;

        const tw = this.level.tileWidth || 16;
        const th = this.level.tileHeight || 16;
        const tilesPerRow = Math.floor(this.level.tilesetImage.width / tw);
        const tilesPerCol = Math.floor(this.level.tilesetImage.height / th);
        const totalTiles = tilesPerRow * tilesPerCol;

        for (let i = 0; i < totalTiles; i++) {
            const tileDiv = document.createElement('div');
            tileDiv.className = 'tile-item';
            if (i === this.selectedTile) tileDiv.classList.add('selected');

            const canvas = document.createElement('canvas');
            canvas.width = tw;
            canvas.height = th;

            const ctx = canvas.getContext('2d');
            const tilesetCoords = this.level.getTilesetCoords(i);
            ctx.drawImage(
                this.level.tilesetImage,
                tilesetCoords.x, tilesetCoords.y, tw, th,
                0, 0, tw, th
            );

            tileDiv.appendChild(canvas);
            tileDiv.onclick = () => this.selectTile(i);
            tilesList.appendChild(tileDiv);
        }
    }

    selectTile(tileIndex) {
        if (tileIndex < 0) return;
        this.selectedTile = tileIndex;
        if (!this.level.tilesetImage) return;
        const tw = this.level.tileWidth || 16;
        const tilesPerRow = Math.floor(this.level.tilesetImage.width / tw);
        const tx = tileIndex % tilesPerRow;
        const ty = Math.floor(tileIndex / tilesPerRow);
        this.selectedTilesetTiles = [[tileIndex]];
        this.tilesetSelectionStartX = tx;
        this.tilesetSelectionStartY = ty;
        this.tilesetSelectionEndX = tx;
        this.tilesetSelectionEndY = ty;
        this.updateTilesetDisplay();
        this.updateSelectedTileDisplay();
        this.updateSelectedTileCanvas();
    }

    newLevel() {
        const wEl = document.getElementById('levelWidth');
        const hEl = document.getElementById('levelHeight');
        const width = wEl ? parseInt(wEl.value) || 64 : 64;
        const height = hEl ? parseInt(hEl.value) || 64 : 64;
        const dlg = document.createElement('div');
        dlg.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:99999;display:flex;align-items:center;justify-content:center;';
        const _bs = 'background:#2b2b2b;border:1px solid #0a0a0a;border-top:1px solid #404040;border-left:1px solid #404040;color:#e0e0e0;padding:6px 12px;cursor:pointer;font-family:chevyray,monospace;font-size:12px;';
        dlg.innerHTML = `<div class="ed-dialog-box" style="background:var(--dialog-bg,#2b2b2b);border:2px solid #404040;padding:24px 28px;max-width:300px;font-family:chevyray,monospace;font-size:12px;line-height:1.7;color:#e0e0e0;">
            <div class="ed-dlg-title">New Level</div>
            <div style="margin-bottom:14px;">
                <button class="newlvl-btn" data-fmt="nw" style="${_bs}display:block;width:100%;text-align:left;margin-bottom:6px;">.nw — Graal Level (text)</button>
                <button class="newlvl-btn" data-fmt="graal" style="${_bs}display:block;width:100%;text-align:left;margin-bottom:6px;">.graal — Classic Binary</button>
                <button class="newlvl-btn" data-fmt="zelda" style="${_bs}display:block;width:100%;text-align:left;margin-bottom:6px;">.zelda — Zelda Binary</button>
            </div>
            <div style="text-align:right;"><button id="newlvlCancel" style="${_bs}">Cancel</button></div>
        </div>`;
        const close = () => document.body.removeChild(dlg);
        dlg.querySelector('#newlvlCancel').onclick = close;
        dlg.addEventListener('click', e => { if (e.target === dlg) close(); });
        dlg.querySelectorAll('.newlvl-btn').forEach(btn => {
            btn.onclick = () => {
                close();
                const fmt = btn.dataset.fmt;
                const level = new Level(width, height);
                const existingImg = this.level?.tilesetImage || this.levels.find(e => e.level.tilesetImage)?.level.tilesetImage;
                if (existingImg) { level.tilesetImage = existingImg; level.tilesetName = this.level?.tilesetName || 'pics1.png'; }
                if (fmt === 'graal' || fmt === 'zelda') level._sourceFormat = fmt;
                const ext = fmt === 'nw' ? '.nw' : `.${fmt}`;
                this.levels.push({ level, name: `new ${++this.newTabCounter}${ext}`, modified: false });
                this.currentLevelIndex = this.levels.length - 1;
                this.level = level;
                this.addLevelTab(this.currentLevelIndex);
                if (level.tilesetImage) { this.render(); } else { this.loadDefaultTileset(); }
                this.updateLevelTabs();
                this.saveSessionDebounced();
            };
        });
        document.body.appendChild(dlg);
    }

    addLevelTab(index) {
        this._setEditorVisible(true);
        const tabsContainer = document.getElementById('levelTabs');
        const tab = document.createElement('div');
        tab.className = 'tab active';
        tab.dataset.levelIndex = index;
        tab.draggable = true;
        const nameSpan = document.createElement('span');
        nameSpan.className = 'tab-name';
        nameSpan.textContent = this.levels[index].name;
        tab.appendChild(nameSpan);
        const close = document.createElement('span');
        close.className = 'tab-close';
        close.innerHTML = '×';
        close.onclick = (e) => { e.stopPropagation(); this.closeLevelTab(index); };
        tab.appendChild(close);
        tab.onclick = () => this.switchLevel(index);
        tab.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); this._showTabContextMenu(e, index); });
        tab.addEventListener('dragstart', (e) => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(index)); setTimeout(() => tab.style.opacity = '0.4', 0); });
        tab.addEventListener('dragend', () => { tab.style.opacity = ''; this._removeTabDragIndicator(); });
        tab.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            const rect = tab.getBoundingClientRect();
            const mid = rect.left + rect.width / 2;
            const indicatorX = e.clientX < mid ? rect.left : rect.right;
            this._showTabDragIndicator(indicatorX, rect.top, rect.height);
        });
        tab.addEventListener('dragleave', () => this._removeTabDragIndicator());
        tab.addEventListener('drop', (e) => {
            e.preventDefault();
            this._removeTabDragIndicator();
            const fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
            const toIdx = parseInt(tab.dataset.levelIndex);
            if (isNaN(fromIdx) || isNaN(toIdx) || fromIdx === toIdx) return;
            const rect = tab.getBoundingClientRect();
            const mid = rect.left + rect.width / 2;
            const insertBefore = e.clientX < mid;
            const actualTo = insertBefore ? toIdx : toIdx + 1;
            const moved = this.levels.splice(fromIdx, 1)[0];
            const finalTo = actualTo > fromIdx ? actualTo - 1 : actualTo;
            this.levels.splice(finalTo, 0, moved);
            if (this.currentLevelIndex === fromIdx) this.currentLevelIndex = finalTo;
            else if (fromIdx < this.currentLevelIndex && finalTo >= this.currentLevelIndex) this.currentLevelIndex--;
            else if (fromIdx > this.currentLevelIndex && finalTo <= this.currentLevelIndex) this.currentLevelIndex++;
            tabsContainer.innerHTML = '';
            this.levels.forEach((_, i) => this.addLevelTab(i));
            this.saveSessionDebounced();
        });
        tabsContainer.appendChild(tab);
        this.updateLevelTabs();
    }

    _showTabDragIndicator(x, y, h) {
        if (!this._tabDragIndicator) {
            const el = document.createElement('div');
            el.style.cssText = 'position:fixed;width:3px;background:#ffff00;pointer-events:none;z-index:1000;';
            document.body.appendChild(el);
            this._tabDragIndicator = el;
        }
        this._tabDragIndicator.style.left = x + 'px';
        this._tabDragIndicator.style.top = y + 'px';
        this._tabDragIndicator.style.height = h + 'px';
    }

    _removeTabDragIndicator() {
        if (this._tabDragIndicator) { document.body.removeChild(this._tabDragIndicator); this._tabDragIndicator = null; }
    }

    switchLevel(index) {
        if (index < 0 || index >= this.levels.length) return;
        if (this.levels[this.currentLevelIndex]) this.levels[this.currentLevelIndex].currentLayer = this.currentLayer;
        const entry = this.levels[index];
        const prevWasGmap = !!this.levels[this.currentLevelIndex]?.gmapGrid;
        if (entry.currentLayer !== undefined) this.currentLayer = entry.currentLayer;
        else this.currentLayer = 0;
        this.currentLevelIndex = index;
        this.level = this.levels[index].level;
        if (this.level._sourceFormat === 'graal' || this.level._sourceFormat === 'zelda') this.currentLayer = 0;
        this.updateLevelTabs();
        this.updateUI();
        const combo = document.getElementById('tilesetsCombo');
        if (combo) {
            const ts = this.level.tilesetName;
            const exists = [...combo.options].some(o => o.value === ts);
            if (exists) combo.value = ts;
            else combo.value = 'pics1.png';
        }
        this.loadTilesetImage(this.level.tilesetName);
        this.applyTiledefFromNPCs();
        this.render(); if (prevWasGmap && !entry.gmapGrid) this.centerView();
        if (prevWasGmap && !entry.gmapGrid) this.centerView();
    }
    _confirm(msg, fn) {
        const box = document.createElement('div');
        box.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:99999;display:flex;align-items:center;justify-content:center;';
        const bs = 'background:#2b2b2b;border:1px solid #0a0a0a;border-top:1px solid #404040;border-left:1px solid #404040;color:#e0e0e0;padding:6px 18px;cursor:pointer;font-family:chevyray,monospace;font-size:12px;';
        box.innerHTML = `<div class="ed-dialog-box" style="background:var(--dialog-bg,#2b2b2b);border:2px solid #404040;padding:20px 24px;max-width:340px;font-family:chevyray,monospace;font-size:12px;line-height:1.6;text-align:center;color:#e0e0e0;">
            <div style="margin-bottom:16px;white-space:pre-wrap;">${msg}</div>
            <div style="display:flex;gap:10px;justify-content:center;">
                <button id="_cfmYes" style="${bs}">Yes</button>
                <button id="_cfmNo" style="${bs}">No</button>
            </div></div>`;
        document.body.appendChild(box);
        box.querySelector('#_cfmNo').onclick = () => box.remove();
        box.querySelector('#_cfmYes').onclick = () => { box.remove(); fn(); };
    }

    _setEditorVisible(visible) {
        const ids = ['levelToolbar', 'levelArea'];
        ids.forEach(id => { const el = document.getElementById(id); if (el) el.style.visibility = visible ? '' : 'hidden'; });
        const sb = document.querySelector('.status-bar'); if (sb) sb.style.visibility = visible ? '' : 'hidden';
        ['btnPlay','btnPlayerSetup'].forEach(id => { const el = document.getElementById(id); if (el) el.disabled = !visible; });
    }

    closeLevelTab(index) {
        const name = this.levels[index]?.name || 'this level';
        this._confirm(`Close "${name}"?`, () => {
        this.levels.splice(index, 1);
        if (this.levels.length === 0) {
            this.currentLevelIndex = -1;
            this.level = null;
            document.getElementById('levelTabs').innerHTML = '';
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this._setEditorVisible(false);
            this.saveSession();
            return;
        }
        if (this.currentLevelIndex >= this.levels.length) this.currentLevelIndex = this.levels.length - 1;
        this.level = this.levels[this.currentLevelIndex].level;
        if (!this.level.tilesetImage) {
            const donor = this.levels.find(e => e.level.tilesetImage);
            if (donor) this.level.tilesetImage = donor.level.tilesetImage;
        }
        const tabsContainer = document.getElementById('levelTabs');
        tabsContainer.innerHTML = '';
        this.levels.forEach((_, i) => this.addLevelTab(i));
        this.updateUI();
        this.render();
        });
    }

    updateLevelTabs() {
        const tabs = document.querySelectorAll('#levelTabs .tab');
        tabs.forEach((tab, i) => {
            tab.classList.toggle('active', i === this.currentLevelIndex);
            const ns = tab.querySelector('.tab-name');
            if (ns && this.levels[i]) ns.textContent = this.levels[i].name;
        });
        const isZelda = this._currentLevelIsZelda();
        ['btnPlaceNPC', 'btnPlaceChest'].forEach(id => { const btn = document.getElementById(id); if (btn) { btn.disabled = isZelda; btn.style.opacity = isZelda ? '0.35' : ''; } });
    }

    async loadImageFromPath(filePath, name) {
        const data = await _tauri.fs.readFile(filePath);
        const isMng = name.toLowerCase().endsWith('.mng');
        if (isMng) {
            try {
                const blob = await MNG.toBlob(data.buffer);
                const url = URL.createObjectURL(blob);
                this.fileCache.images.set(name, url);
                this.fileCache.mngs = this.fileCache.mngs || new Map();
                this.fileCache.mngs.set(name, URL.createObjectURL(new Blob([data])));
                return url;
            } catch(e) {}
        }
        const ext = name.split('.').pop().toLowerCase();
        const mime = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'webp' ? 'image/webp' : ext === 'bmp' ? 'image/bmp' : 'image/png';
        const url = URL.createObjectURL(new Blob([data], { type: mime }));
        this.fileCache.images.set(name, url);
        return url;
    }

    async loadWorkspaceFromDisk(dirPath) {
        const dirName = dirPath.split(/[\\/]/).pop();
        this.workingDirectory = dirName;
        localStorage.setItem('levelEditorLastWorkingDir', dirName);
        window._tauriLastDir = dirPath;
        this._tauriPathIndex = new Map();
        this._fcLower = null;
        this._objImgCache = new Map();
        this._ganiCache = new Map();
        this._ganiImgCache = new Map();
        this.fileCache = { images: new Map(), ganis: new Map(), ganiTexts: new Map(), sounds: new Map(), levels: new Map() };
        if (window._workspaceScanUnlisten) { window._workspaceScanUnlisten(); window._workspaceScanUnlisten = null; }
        const loader = this.showLoadingMessage('Scanning...');
        const _yield = () => new Promise(r => setTimeout(r, 0));
        window._workspaceScanUnlisten = await _tauri.event.listen('workspace_chunk', async (event) => {
            const chunk = event.payload;
            const ganiEntries = chunk.gani_files || [];
            for (let i = 0; i < ganiEntries.length; i += 12) {
                await Promise.all(ganiEntries.slice(i, i + 12).map(async ([name, path]) => {
                    this._tauriPathIndex.set(name, path);
                    try {
                        const text = await _tauri.fs.readTextFile(path);
                        if (!/[\x00-\x08\x0e-\x1f]/.test(text.substring(0, 256))) {
                            this.fileCache.ganiTexts.set(name, text);
                            this.fileCache.ganis.set(name, URL.createObjectURL(new Blob([text])));
                        }
                    } catch(e) {}
                }));
                await _yield();
            }
            for (const path of (chunk.sound_files || [])) {
                const sname = path.split(/[\\/]/).pop();
                this._tauriPathIndex.set(sname, path);
                this.fileCache.sounds.set(sname, path);
            }
            for (const [name, path] of (chunk.level_files || [])) this._tauriPathIndex.set(name, path);
            if (chunk.done) {
                if (window._workspaceScanUnlisten) { window._workspaceScanUnlisten(); window._workspaceScanUnlisten = null; }
                loader.close();
                this._workspaceCount = (this._workspaceCount || 0) + 1;
                const el = document.getElementById('objectsDir');
                if (el) el.value = this._workspaceCount === 1 ? dirName : `${this._workspaceCount} workspaces`;
                this.applyTiledefFromNPCs();
                this._refillGmapEntries().catch(() => {});
                this.render();
                this.refreshNPCList();
            }
        });
        await _tauri.core.invoke('scan_workspace', { dir: dirPath });
    }

    async restoreWorkspaceFromCache() {
        const cached = await _tauri.core.invoke('load_workspace_cache').catch(() => null);
        if (!cached) return false;
        const dirPath = cached.dir;
        const dirName = dirPath.split(/[\\/]/).pop();
        this.workingDirectory = dirName;
        localStorage.setItem('levelEditorLastWorkingDir', dirName);
        window._tauriLastDir = dirPath;
        this._tauriPathIndex = new Map();
        this._fcLower = null;
        const soundExts = new Set(['wav','mp3','ogg','mid','midi']);
        const ganiPaths = [];
        cached.entries.forEach(([name, path]) => {
            this._tauriPathIndex.set(name, path);
            const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : '';
            if (soundExts.has(ext)) this.fileCache.sounds.set(name, path);
            if (name.endsWith('.gani')) ganiPaths.push([name, path]);
        });
        const _yield = () => new Promise(r => setTimeout(r, 0));
        for (let i = 0; i < ganiPaths.length; i += 12) {
            await Promise.all(ganiPaths.slice(i, i + 12).map(([n, p]) =>
                _tauri.fs.readTextFile(p).then(text => {
                    if (!/[\x00-\x08\x0e-\x1f]/.test(text.substring(0, 256))) {
                        this.fileCache.ganiTexts.set(n, text);
                        this.fileCache.ganis.set(n, URL.createObjectURL(new Blob([text])));
                    }
                }).catch(() => {})
            ));
            await _yield();
        }
        console.log(`[TAURI] Level workspace restored: ${this._tauriPathIndex.size} files, dir=${dirPath}`);
        this._workspaceCount = 1;
        const el = document.getElementById('objectsDir');
        if (el) el.value = dirName;
        this.applyTiledefFromNPCs();
        this._refillGmapEntries().catch(() => {});
        this.render();
        this.refreshNPCList();
        return true;
    }

    async setWorkingDirectory() {
        const imageExts = new Set(['png','gif','bmp','jpg','jpeg','mng']);
        const finishScan = (loader, dirName) => {
            this.populateFileCache();
            this._objImgCache = new Map();
            this._ganiCache = new Map();
            this._fcLower = null;
            loader.close();
            this._workspaceCount = (this._workspaceCount || 0) + 1;
            const el = document.getElementById('objectsDir');
            if (el) el.value = this._workspaceCount === 1 ? dirName : `${this._workspaceCount} workspaces`;
            this.applyTiledefFromNPCs();
            this.render();
            this.refreshNPCList();
        };
        const processFile = async (name, file) => {
            const ext = name.split('.').pop().toLowerCase();
            if (ext === 'mng') { try { this.fileCache.images.set(name, URL.createObjectURL(await MNG.toBlob(file))); } catch(e) {} this.fileCache.mngs = this.fileCache.mngs || new Map(); this.fileCache.mngs.set(name, URL.createObjectURL(file)); }
            else if (imageExts.has(ext)) this.fileCache.images.set(name, URL.createObjectURL(file));
            else if (ext === 'gani') { const t = await file.text(); if (/[\x00-\x08\x0e-\x1f]/.test(t.substring(0, 256))) return; this.fileCache.ganiTexts.set(name, t); this.fileCache.ganis.set(name, URL.createObjectURL(new Blob([t]))); }
            else if (ext === 'wav') this.fileCache.sounds.set(name, URL.createObjectURL(file));
            else if (ext === 'nw') this.fileCache.levels.set(name, await file.text());
            else if (ext === 'graal' || ext === 'zelda') { try { const lvl = Level.loadFromGraal(await file.arrayBuffer()); if (lvl) { this.fileCache.levelObjects = this.fileCache.levelObjects || new Map(); this.fileCache.levelObjects.set(name, lvl); } } catch(e) {} }
        };
        const scanDir = async (dir, loader) => {
            const allFiles = [];
            const collect = async (d) => { for await (const [name, handle] of d.entries()) handle.kind === 'directory' ? await collect(handle) : allFiles.push([name, handle]); };
            loader.update('Scanning... 0%');
            await collect(dir);
            const total = allFiles.length, BATCH = 64;
            let done = 0;
            for (let i = 0; i < total; i += BATCH) {
                await Promise.all(allFiles.slice(i, i + BATCH).map(async ([name, handle]) => { await processFile(name, await handle.getFile()); loader.update(`Scanning... ${Math.round((++done / total) * 100)}%`); }));
                await new Promise(r => setTimeout(r, 0));
            }
        };
        const scanFolderInput = async (files, loader) => {
            const total = files.length, BATCH = 64;
            let done = 0;
            for (let i = 0; i < total; i += BATCH) {
                await Promise.all(Array.from(files).slice(i, i + BATCH).map(async file => { await processFile(file.name, file); loader.update(`Scanning... ${Math.round((++done / total) * 100)}%`); }));
                await new Promise(r => setTimeout(r, 0));
            }
        };
        if (_isTauri) {
            const selected = await _tauri.dialog.open({ directory: true, multiple: false, title: 'Select Working Directory' });
            if (!selected) return;
            await this.loadWorkspaceFromDisk(selected);
            return;
        }
        if (window.showDirectoryPicker) {
            try {
                const dirHandle = await window.showDirectoryPicker();
                const loader = this.showLoadingMessage('Scanning...');
                this.workingDirectory = dirHandle.name;
                await scanDir(dirHandle, loader);
                finishScan(loader, this.workingDirectory);
            } catch (e) {}
        } else {
            const input = document.getElementById('folderInput');
            input.click();
            input.onchange = async (e) => {
                if (!e.target.files.length) return;
                const loader = this.showLoadingMessage('Scanning...');
                const path = e.target.files[0].webkitRelativePath;
                this.workingDirectory = path.split('/')[0];
                await scanFolderInput(e.target.files, loader);
                finishScan(loader, this.workingDirectory);
            };
        }
    }

    async loadObjectsLibrary() {
        const parseNPC = text => {
            const lines = text.split('\n');
            let image = '', code = '', inCode = false;
            for (const l of lines) {
                const t = l.trim();
                if (t.startsWith('IMAGE ')) image = t.slice(6).trim();
                else if (t === 'SERVERCODE') inCode = true;
                else if (t === 'SERVERCODEEND') inCode = false;
                else if (inCode) code += l + '\n';
            }
            return { image, code: code.trim() };
        };
        const render = (npcs, dirName, append = false) => {
            const el = document.getElementById('objectsLibDir');
            if (el && dirName) el.value = dirName;
            const list = document.getElementById('objectsList');
            if (!list) return;
            if (!npcs.length) return;
            if (!append) list.innerHTML = '';
            list.style.cssText = 'display:flex;flex-direction:column;gap:2px;';
            for (const { name, image, code } of npcs) {
                const row = document.createElement('div');
                row.style.cssText = 'display:flex;align-items:center;gap:6px;padding:4px 6px;cursor:grab;background:#1a1a1a;border:1px solid #333;user-select:none;';
                row.title = name;
                if (!this._fcLower && this.fileCache?.images?.size) this._fcLower = new Map([...this.fileCache.images.keys()].map(k => [k.toLowerCase(), k]));
                const resolvedImg = this.fileCache?.images?.has(image) ? image : (this._fcLower?.get(image.toLowerCase()) || null);
                const imgSrc = (resolvedImg ? this.fileCache.images.get(resolvedImg) : null) || `images/${image}`;
                const thumb = document.createElement('img');
                thumb.src = imgSrc; thumb.style.cssText = 'width:24px;height:24px;object-fit:contain;image-rendering:pixelated;flex-shrink:0;';
                thumb.onerror = () => { thumb.style.display = 'none'; };
                const lbl = document.createElement('span');
                lbl.textContent = name.replace(/\.npc$/i, '');
                lbl.style.cssText = 'font-size:11px;color:#e0e0e0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;user-select:none;pointer-events:none;';
                row.appendChild(thumb); row.appendChild(lbl);
                row.addEventListener('mouseenter', () => row.style.background = '#2a2a3a');
                row.addEventListener('mouseleave', () => row.style.background = '#1a1a1a');
                row.addEventListener('mousedown', e => {
                    if (e.button !== 0) return;
                    this._dragObjectLibItem = { image, code };
                    this.draggingNewObjectType = 'npc';
                    this.setObjectMode('npc');
                    e.preventDefault();
                });
                list.appendChild(row);
            }
        };
        const collect = async files => {
            const npcs = [];
            for (const file of files) {
                if (!file.name.toLowerCase().endsWith('.npc')) continue;
                const text = await file.text();
                if (!text.startsWith('NPC')) continue;
                const { image, code } = parseNPC(text);
                npcs.push({ name: file.name, image, code });
            }
            return npcs;
        };
        if (window.showDirectoryPicker) {
            try {
                const dir = await window.showDirectoryPicker();
                const files = [];
                for await (const [, h] of dir.entries()) if (h.kind === 'file') files.push(await h.getFile());
                render(await collect(files), dir.name, true);
            } catch(e) {}
        } else {
            const input = document.createElement('input');
            input.type = 'file'; input.accept = '.npc'; input.multiple = true;
            input.onchange = async e => { if (!e.target.files.length) return; render(await collect([...e.target.files]), 'Objects', true); };
            input.click();
        }
    }

    async loadDefaultObjects() {
        const parseNPC = text => {
            const lines = text.split('\n');
            let image = '', code = '', inCode = false;
            for (const l of lines) {
                const t = l.trim();
                if (t.startsWith('IMAGE ')) image = t.slice(6).trim();
                else if (t === 'SERVERCODE') inCode = true;
                else if (t === 'SERVERCODEEND') inCode = false;
                else if (inCode) code += l + '\n';
            }
            return { image, code: code.trim() };
        };
        const res = await fetch('objects/index.json');
        if (!res.ok) return;
        const files = await res.json();
        const npcs = [];
        for (const name of files) {
            if (!name.toLowerCase().endsWith('.npc')) continue;
            const r = await fetch(`objects/${name}`);
            if (!r.ok) continue;
            const text = await r.text();
            if (!text.startsWith('NPC')) continue;
            const { image, code } = parseNPC(text);
            npcs.push({ name, image, code });
        }
        if (!npcs.length) return;
        const list = document.getElementById('objectsList');
        if (!list) return;
        list.innerHTML = '';
        list.style.cssText = 'display:flex;flex-direction:column;gap:2px;';
        for (const { name, image, code } of npcs) {
            const row = document.createElement('div');
            row.style.cssText = 'display:flex;align-items:center;gap:6px;padding:4px 6px;cursor:grab;background:#1a1a1a;border:1px solid #333;user-select:none;';
            row.title = name;
            if (!this._fcLower && this.fileCache?.images?.size) this._fcLower = new Map([...this.fileCache.images.keys()].map(k => [k.toLowerCase(), k]));
            const resolvedImg = this.fileCache?.images?.has(image) ? image : (this._fcLower?.get(image.toLowerCase()) || null);
            const imgSrc = (resolvedImg ? this.fileCache.images.get(resolvedImg) : null) || `images/${image}`;
            const thumb = document.createElement('img');
            thumb.src = imgSrc; thumb.style.cssText = 'width:24px;height:24px;object-fit:contain;image-rendering:pixelated;flex-shrink:0;';
            thumb.onerror = () => { thumb.style.display = 'none'; };
            const lbl = document.createElement('span');
            lbl.textContent = name.replace(/\.npc$/i, '');
            lbl.style.cssText = 'font-size:11px;color:#e0e0e0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;user-select:none;pointer-events:none;';
            row.appendChild(thumb); row.appendChild(lbl);
            row.addEventListener('mouseenter', () => row.style.background = '#2a2a3a');
            row.addEventListener('mouseleave', () => row.style.background = '#1a1a1a');
            row.addEventListener('mousedown', e => {
                if (e.button !== 0) return;
                this._dragObjectLibItem = { image, code };
                this.draggingNewObjectType = 'npc';
                this.setObjectMode('npc');
                e.preventDefault();
            });
            list.appendChild(row);
        }
    }

    exportSelectedNPC() {
        const obj = this.selectedObject;
        if (!obj || obj.type !== 'npc') return;
        const image = obj.properties?.image || '';
        const code = obj.properties?.code || '';
        let text = 'NPC001\n';
        if (image) text += `IMAGE ${image}\n`;
        text += 'SCRIPTINGLANGUAGE GScript\n\nSERVERCODE\n';
        text += code ? code + '\n' : '';
        text += 'SERVERCODEEND\n';
        const name = (image.replace(/\.[^.]+$/, '') || 'npc') + '.npc';
        this._downloadFile(name, text);
    }

    _createPlayChatUI() {
        const bar = document.createElement('div');
        bar.id = '_playChatBar';
        bar.style.cssText = "display:none;position:fixed;bottom:16px;left:50%;transform:translateX(-50%);width:380px;background:rgba(0,0,0,0.55);border:1px solid rgba(180,180,220,0.35);border-radius:3px;padding:4px 10px;z-index:9999;";
        this._chatInput = document.createElement('input');
        this._chatInput.type = 'text';
        this._chatInput.placeholder = 'Say:';
        this._chatInput.style.cssText = "width:100%;background:transparent;border:none;outline:none;color:#fff;font-family:'TempusSansITC','Tempus Sans ITC',sans-serif;font-size:15px;caret-color:#fff;text-shadow:1px 1px 0 rgba(20,40,200,0.9);";
        bar.appendChild(this._chatInput);
        document.body.appendChild(bar);
        this._chatBar = bar;
        this._chatCanvasClick = () => { if (this._chatOpen) this._closePlayChat(); };
        this.canvas.addEventListener('mousedown', this._chatCanvasClick);
        this._showMouseTile = false; this._playMouseWorld = null;
        this._playMouseMove = (e) => {
            const r = this.canvas.getBoundingClientRect();
            const cx = (e.clientX - r.left) * (this.canvas.width / r.width);
            const cy = (e.clientY - r.top) * (this.canvas.height / r.height);
            this._playMouseWorld = { x: (cx - this.panX) / this.zoom, y: (cy - this.panY) / this.zoom };
        };
        this.canvas.addEventListener('mousemove', this._playMouseMove);
        new FontFace('TempusSansITC', 'url(fonts/tempus-sans-itc.ttf)').load().then(f => document.fonts.add(f)).catch(() => {});
    }

    _openPlayChat() {
        if (this._chatOpen) return;
        this._chatOpen = true; this._chatHistoryIdx = -1;
        this._playKeys = {};
        this._chatBar.style.display = 'block';
        this._chatInput.value = ''; this._chatInput.focus();
    }

    _closePlayChat() {
        this._chatOpen = false;
        this._chatBar.style.display = 'none';
        this._chatInput.value = '';
        this._playKeys = {};
    }

    _submitPlayChat() {
        const msg = this._chatInput.value.trim();
        this._closePlayChat();
        if (!msg) return;
        if (this._chatHistory[0] !== msg) this._chatHistory.unshift(msg);
        if (this._chatHistory.length > 30) this._chatHistory.pop();
        const p = this._player;
        if (/^setnick\s+(.+)/i.test(msg)) { p.nick = msg.match(/^setnick\s+(.*)/i)[1].replace(/\(.*\)/g, '').trim().slice(0, 30); p.nickTimer = 4; return; }
        if (/^showname$/i.test(msg)) { p.nickTimer = 4; return; }
        this._playerChat = msg; this._playerChatTimer = 5;
    }

    togglePlayMode() { this._playMode ? this.exitPlayMode() : this.enterPlayMode(); }

    _getSettings() {
        if (!this._editorSettings) { try { this._editorSettings = JSON.parse(localStorage.getItem('graal_editorSettings') || 'null'); } catch(e) {} }
        if (!this._editorSettings) this._editorSettings = {};
        const d = this._editorSettings;
        return { nickFontSize: d.nickFontSize ?? 24, chatFontSize: d.chatFontSize ?? 28, uiFont: d.uiFont ?? 'chevyray', uiFontSize: d.uiFontSize ?? 12, uiFontStyle: d.uiFontStyle ?? 'normal', uiScale: d.uiScale ?? 1 };
    }
    _saveSettings(s) { this._editorSettings = s; localStorage.setItem('graal_editorSettings', JSON.stringify(s)); }
    _applyUISettings(s) {
        const _fonts = { chevyray:'"chevyray",monospace', chevyrayOeuf:'"chevyrayOeuf",monospace', Silkscreen:'"Silkscreen",monospace', PressStart2P:'"PressStart2P",monospace', monospace:'monospace' };
        const ff = _fonts[s.uiFont] || '"chevyray",monospace';
        const fw = (s.uiFontStyle||'normal').includes('bold') ? 'bold' : 'normal';
        const fi = (s.uiFontStyle||'normal').includes('italic') ? 'italic' : 'normal';
        const sz = (s.uiFontSize||12) + 'px';
        let tag = document.getElementById('_lvUIStyle');
        if (!tag) { tag = document.createElement('style'); tag.id = '_lvUIStyle'; document.head.appendChild(tag); }
        tag.textContent = `#editorContainer button,#editorContainer .left-tab,#editorContainer select,#editorContainer label,#editorContainer .combo-label,#editorContainer .panel-section-title{font-family:${ff}!important;font-size:${sz}!important;font-weight:${fw}!important;font-style:${fi}!important;}`;
        const ec = document.getElementById('editorContainer');
        if (ec) ec.style.zoom = String(s.uiScale ?? 1);
    }
    _getKeybinds() {
        if (!this._keybinds) { this._keybinds = { ..._DEFAULT_KB }; try { const k = localStorage.getItem('graal_editorKeybinds'); if (k) Object.assign(this._keybinds, JSON.parse(k)); } catch(e) {} }
        return this._keybinds;
    }
    _saveKeybinds(kb) { this._keybinds = kb; localStorage.setItem('graal_editorKeybinds', JSON.stringify(kb)); }

    openSettingsDialog() {
        if (document.getElementById('_settingsDlg')) return;
        const s = this._getSettings(), kb = this._getKeybinds();
        const _snapSettings = { ...s }, _snapKB = { ...kb };
        const box = document.createElement('div');
        box.id = '_settingsDlg';
        box.style.cssText = 'position:fixed;top:80px;left:calc(50% - 240px);width:480px;max-width:96vw;background:#2b2b2b;border:2px solid #1a1a1a;z-index:10000;display:flex;flex-direction:column;max-height:88vh;';
        box.classList.add('ed-dialog-box');
        const _btnStyle = (a) => `padding:6px 16px;cursor:pointer;background:${a?'#252525':'transparent'};color:${a?'#4a9eff':'#888'};border:none;border-bottom:2px solid ${a?'#4a9eff':'transparent'};font-family:chevyray,monospace;font-size:12px;`;
        const _numStyle = 'width:55px;background:#1a1a1a;color:#e0e0e0;border:1px solid #555;padding:3px 6px;font-family:chevyray,monospace;font-size:12px;text-align:center;';
        const _lblStyle = 'min-width:130px;flex-shrink:0;font-size:13px;color:#aaa;';
        const sliderRow = (lbl,id,val,mn,mx) => `<label style="display:flex;align-items:center;gap:8px;"><span style="${_lblStyle}">${lbl}</span><input type="range" id="${id}_r" min="${mn}" max="${mx}" value="${val}" style="flex:1;accent-color:#4472C4;"><input type="number" id="${id}_n" value="${val}" min="${mn}" max="${mx}" style="${_numStyle}"></label>`;
        const _kbActions = [
            { section: 'Editor' },
            { key:'undo', label:'Undo' }, { key:'redo', label:'Redo' }, { key:'save', label:'Save' },
            { key:'copy', label:'Copy' }, { key:'cut', label:'Cut' }, { key:'paste', label:'Paste' },
            { key:'delete', label:'Delete' }, { key:'playMode', label:'Play Mode' },
            { key:'about', label:'About' }, { key:'settings', label:'Settings' },
            { section: 'Play Mode' },
            { key:'openChat', label:'Open Chat' }, { key:'debugInfo', label:'Debug Info' },
            { key:'debugOverlay', label:'Debug Overlay' }, { key:'editBypass', label:'Edit Bypass' },
            { key:'grab', label:'Grab/Interact' },
        ];
        const kbRows = _kbActions.map(a => a.section
            ? `<div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;margin:10px 0 4px;">${a.section}</div>`
            : `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;"><span style="color:#c0c0c0;font-size:12px;">${a.label}</span><button class="_kbBtn" data-action="${a.key}" title="Click to rebind · right-click to reset" style="min-width:76px;text-align:center;cursor:pointer;background:#1a1a1a;border:1px solid #444;color:#e0e0e0;padding:2px 8px;font-size:11px;font-family:chevyray,monospace;">${_fmtKB(kb[a.key])}</button></div>`
        ).join('');
        box.innerHTML = `
            <div id="_stTitlebar" style="padding:8px 12px;background:#353535;font-size:13px;display:flex;align-items:center;justify-content:space-between;user-select:none;cursor:grab;flex-shrink:0;">
                <span><i class="fas fa-cog" style="color:#ffd700;margin-right:6px;"></i>Settings</span>
                <button id="_stClose" style="background:none;border:none;color:#888;font-size:16px;cursor:pointer;">&#10005;</button>
            </div>
            <div style="display:flex;background:#303030;border-bottom:1px solid #1a1a1a;flex-shrink:0;">
                <button class="_stTab active" data-tab="general" style="${_btnStyle(true)}">General</button>
                <button class="_stTab" data-tab="keybinds" style="${_btnStyle(false)}">Keybinds</button>
            </div>
            <div id="_stGeneral" style="padding:14px 16px;display:flex;flex-direction:column;gap:10px;overflow-y:auto;">
                <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;">UI</div>
                <label style="display:flex;align-items:center;gap:8px;"><span style="${_lblStyle}">Font</span><select id="_stUIFont" style="flex:1;background:#1a1a1a;color:#e0e0e0;border:1px solid #555;padding:3px 6px;font-family:chevyray,monospace;font-size:12px;"><option value="chevyray">Chevyray</option><option value="chevyrayOeuf">Chevyray Oeuf</option><option value="Silkscreen">Silkscreen</option><option value="PressStart2P">Press Start 2P</option><option value="monospace">Monospace</option></select></label>
                <label style="display:flex;align-items:center;gap:8px;"><span style="${_lblStyle}">Font Style</span><select id="_stUIFontStyle" style="flex:1;background:#1a1a1a;color:#e0e0e0;border:1px solid #555;padding:3px 6px;font-family:chevyray,monospace;font-size:12px;"><option value="normal">Normal</option><option value="bold">Bold</option><option value="italic">Italic</option><option value="bold italic">Bold Italic</option></select></label>
                ${sliderRow('Font Size','_stUIFontSize',s.uiFontSize??12,8,24)}
                ${sliderRow('UI Scale %','_stUIScale',Math.round((s.uiScale??1)*100),50,200)}
                <div style="border-top:1px solid #1a1a1a;padding-top:10px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;">Play Mode — Labels</div>
                ${sliderRow('Nick font size','_stNick',s.nickFontSize,8,48)}
                ${sliderRow('Chat font size','_stChat',s.chatFontSize,8,48)}
                ${_isTauri ? `<div style="border-top:1px solid #1a1a1a;padding-top:10px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;">System</div><div style="display:flex;align-items:center;gap:10px;"><button id="_stRegAssoc" style="padding:4px 14px;cursor:pointer;background:#353535;color:#ddd;border:1px solid #0a0a0a;border-top:1px solid #555;border-left:1px solid #555;font-family:chevyray,monospace;font-size:12px;">Register File Associations</button><span id="_stRegAssocStatus" style="font-size:11px;color:#6c6;"></span></div>` : ''}
            </div>
            <div id="_stKeybinds" style="display:none;padding:12px 16px;overflow-y:auto;font-family:chevyray,monospace;">
                <div style="color:#666;font-size:10px;margin-bottom:8px;">click to rebind &nbsp;·&nbsp; right-click to reset</div>
                ${kbRows}
            </div>
            <div style="padding:8px 12px;background:#353535;border-top:1px solid #1a1a1a;display:flex;gap:8px;justify-content:flex-end;flex-shrink:0;">
                <button id="_stOk" style="padding:4px 16px;cursor:pointer;background:#4472C4;color:#fff;border:1px solid #3060a0;font-family:chevyray,monospace;font-size:13px;">OK</button>
                <button id="_stCancel" style="padding:4px 12px;cursor:pointer;background:#444;color:#e0e0e0;border:1px solid #555;font-family:chevyray,monospace;font-size:13px;">Cancel</button>
            </div>`;
        document.body.appendChild(box);
        box.querySelector('#_stUIFont').value = s.uiFont ?? 'chevyray';
        box.querySelector('#_stUIFontStyle').value = s.uiFontStyle ?? 'normal';
        const readSettings = () => ({ nickFontSize: parseInt(box.querySelector('#_stNick_n').value)||24, chatFontSize: parseInt(box.querySelector('#_stChat_n').value)||28, uiFont: box.querySelector('#_stUIFont').value, uiFontSize: parseInt(box.querySelector('#_stUIFontSize_n').value)||12, uiFontStyle: box.querySelector('#_stUIFontStyle').value, uiScale: Math.round(parseInt(box.querySelector('#_stUIScale_n').value)||100) / 100 });
        const syncSlider = (id) => {
            const r = box.querySelector(`#${id}_r`), n = box.querySelector(`#${id}_n`);
            r.addEventListener('input', () => { n.value = r.value; const ns = readSettings(); this._saveSettings(ns); this._applyUISettings(ns); this.requestRender(); });
            n.addEventListener('input', () => { r.value = n.value; const ns = readSettings(); this._saveSettings(ns); this._applyUISettings(ns); this.requestRender(); });
        };
        syncSlider('_stNick'); syncSlider('_stChat'); syncSlider('_stUIFontSize'); syncSlider('_stUIScale');
        ['#_stUIFont','#_stUIFontStyle'].forEach(sel => box.querySelector(sel).addEventListener('change', () => { const ns = readSettings(); this._saveSettings(ns); this._applyUISettings(ns); }));
        if (_isTauri) { const regBtn = box.querySelector('#_stRegAssoc'); if (regBtn) regBtn.onclick = async () => { regBtn.disabled = true; const st = box.querySelector('#_stRegAssocStatus'); st.style.color = '#aaa'; st.textContent = 'Registering...'; try { const msg = await _tauri.core.invoke('register_file_associations'); st.style.color = '#6c6'; st.textContent = msg; } catch(e) { st.style.color = '#f66'; st.textContent = String(e); } regBtn.disabled = false; }; }
        box.querySelectorAll('._stTab').forEach(btn => btn.addEventListener('click', () => {
            box.querySelectorAll('._stTab').forEach((b,_i,arr) => { const a = b===btn; b.style.cssText = _btnStyle(a); });
            box.querySelector('#_stGeneral').style.display = btn.dataset.tab==='general' ? '' : 'none';
            box.querySelector('#_stKeybinds').style.display = btn.dataset.tab==='keybinds' ? '' : 'none';
        }));
        box.querySelectorAll('._kbBtn').forEach(btn => {
            btn.onclick = () => {
                if (btn.dataset.listening) return;
                btn.dataset.listening = '1';
                const orig = btn.textContent;
                btn.textContent = 'press a key…'; btn.style.color = '#4a9eff';
                const capture = (ev) => {
                    if (ev.key === 'Escape') { btn.textContent = orig; btn.style.color = '#e0e0e0'; delete btn.dataset.listening; document.removeEventListener('keydown', capture, true); return; }
                    ev.preventDefault(); ev.stopPropagation();
                    if (['Control','Shift','Alt','Meta'].includes(ev.key)) return;
                    const parts = [];
                    if (ev.ctrlKey) parts.push('ctrl');
                    if (ev.shiftKey) parts.push('shift');
                    if (ev.altKey) parts.push('alt');
                    parts.push(ev.key);
                    const binding = parts.join('+');
                    const cur = this._getKeybinds();
                    cur[btn.dataset.action] = binding;
                    this._saveKeybinds({ ...cur });
                    btn.textContent = _fmtKB(binding); btn.style.color = '#e0e0e0';
                    delete btn.dataset.listening;
                    document.removeEventListener('keydown', capture, true);
                };
                document.addEventListener('keydown', capture, true);
            };
            btn.oncontextmenu = (ev) => { ev.preventDefault(); const cur = this._getKeybinds(); cur[btn.dataset.action] = _DEFAULT_KB[btn.dataset.action]; this._saveKeybinds({ ...cur }); btn.textContent = _fmtKB(_DEFAULT_KB[btn.dataset.action]); };
        });
        const close = () => { if (box.parentNode) box.parentNode.removeChild(box); };
        box.querySelector('#_stClose').onclick = () => { this._saveSettings(_snapSettings); this._saveKeybinds({ ..._snapKB }); this.requestRender(); close(); };
        box.querySelector('#_stCancel').onclick = () => { this._saveSettings(_snapSettings); this._saveKeybinds({ ..._snapKB }); this.requestRender(); close(); };
        box.querySelector('#_stOk').onclick = () => { this._saveSettings(readSettings()); close(); };
        const tb = box.querySelector('#_stTitlebar');
        let _dx = 0, _dy = 0, _drag = false;
        tb.addEventListener('mousedown', e => { _drag = true; _dx = e.clientX - box.offsetLeft; _dy = e.clientY - box.offsetTop; tb.style.cursor = 'grabbing'; e.preventDefault(); });
        document.addEventListener('mousemove', e => { if (!_drag) return; box.style.left = (e.clientX-_dx)+'px'; box.style.top = (e.clientY-_dy)+'px'; });
        document.addEventListener('mouseup', () => { _drag = false; tb.style.cursor = 'grab'; });
    }

    _defaultPlayerSettings() {
        return { HEAD: 'head0.png', BODY: 'body.png', SHIELD: 'no-shield.png', SWORD: 'sword1.png', ATTR1: '', nick: 'unknown', colors: [null, null, null, null, null], ganis: { idle: 'idle.gani', walk: 'walk.gani', sit: 'sit.gani', push: 'push.gani', pull: 'pull.gani', grab: 'grab.gani', sword: 'sword.gani', sleep: 'sleep.gani' } };
    }

    openPlayerCustomizeDialog() {
        if (document.getElementById('_playerDlg')) return;
        if (!this._playerSettings) { try { this._playerSettings = JSON.parse(localStorage.getItem('graal_playerSettings') || 'null'); } catch(e) {} }
        if (!this._playerSettings) this._playerSettings = this._defaultPlayerSettings();
        const s = this._playerSettings;
        const box = document.createElement('div');
        box.id = '_playerDlg';
        box.style.cssText = 'position:fixed;top:80px;left:calc(50% - 280px);width:560px;max-width:96vw;display:flex;flex-direction:column;background:#2b2b2b;border:2px solid #1a1a1a;max-height:88vh;overflow:hidden;z-index:10000;';
        box.classList.add('ed-dialog-box');
        const colorOpts = _CNAMES.map((n,i) => `<option value="${i}">${n}</option>`).join('');
        const colorSel = idx => `<select id="pc_color${idx}" style="background:#1a1a1a;color:#e0e0e0;border:1px solid #555;padding:2px 4px;width:120px;font-family:chevyray,monospace;font-size:12px;"><option value="">—</option>${colorOpts}</select>`;
        const _inpStyle = 'flex:1;min-width:0;background:#1a1a1a;color:#e0e0e0;border:1px solid #555;padding:3px 6px;font-family:chevyray,monospace;font-size:12px;';
        const _lblStyle = 'min-width:52px;flex-shrink:0;font-size:13px;color:#aaa;';
        const field = (lbl, id, val, ph='') => `<label style="display:flex;align-items:center;gap:6px;"><span style="${_lblStyle}">${lbl}</span><input id="${id}" value="${val||''}" placeholder="${ph}" style="${_inpStyle}"></label>`;
        const btn = (id, lbl, style='') => `<button id="${id}" style="padding:4px 12px;cursor:pointer;background:#444;color:#e0e0e0;border:1px solid #555;font-family:chevyray,monospace;font-size:13px;${style}">${lbl}</button>`;
        const gfield = (lbl, key) => `<label style="display:flex;align-items:center;gap:6px;"><span style="${_lblStyle}">${lbl}</span><input id="pg_${key}" value="${s.ganis?.[key]||''}" placeholder="${key}.gani" style="${_inpStyle}"><button data-play="${key}" style="padding:2px 8px;cursor:pointer;background:#2a3a2a;color:#7fff7f;border:1px solid #3a6a3a;font-size:11px;flex-shrink:0;">&#9654;</button></label>`;
        const colorLabels = ['Skin','Coat','Sleeves','Shoes','Belt'];
        box.innerHTML = `
            <div id="_pcTitlebar" class="dialog-titlebar" style="padding:8px 12px;background:#353535;font-size:13px;display:flex;align-items:center;justify-content:space-between;user-select:none;flex-shrink:0;cursor:grab;">
                <span><i class="fas fa-user" style="color:#ffd700;margin-right:6px;"></i>Player Settings</span>
                <button id="pcClose" style="background:none;border:none;color:#888;font-size:16px;cursor:pointer;line-height:1;">&#10005;</button>
            </div>
            <div style="display:flex;gap:0;flex:1;overflow:hidden;">
                <div style="width:200px;flex-shrink:0;padding:10px;display:flex;flex-direction:column;gap:7px;overflow-y:auto;border-right:1px solid #1a1a1a;">
                    <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;">Appearance</div>
                    ${field('HEAD','pc_head',s.HEAD,'head.png')}
                    ${field('BODY','pc_body',s.BODY,'body.png')}
                    ${field('SHIELD','pc_shield',s.SHIELD,'shield.png')}
                    ${field('SWORD','pc_sword',s.SWORD,'sword.png')}
                    ${field('HAT','pc_attr1',s.ATTR1,'')}
                    ${field('Nick','pc_nick',s.nick||'','Nickname')}
                    <div style="font-size:11px;color:#888;margin-top:4px;text-transform:uppercase;letter-spacing:1px;">Colors</div>
                    ${colorLabels.map((l,i) => `<label style="display:flex;align-items:center;gap:6px;"><span style="${_lblStyle}">${l}</span>${colorSel(i)}</label>`).join('')}
                </div>
                <div style="flex:1;padding:10px;display:flex;flex-direction:column;gap:7px;overflow-y:auto;border-right:1px solid #1a1a1a;">
                    <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;">Ganis</div>
                    ${gfield('Idle','idle')}${gfield('Walk','walk')}${gfield('Sit','sit')}${gfield('Push','push')}${gfield('Pull','pull')}${gfield('Grab','grab')}${gfield('Sword','sword')}${gfield('Sleep','sleep')}
                </div>
                <div style="width:172px;flex-shrink:0;padding:10px;display:flex;flex-direction:column;align-items:center;gap:6px;background:#1e1e1e;">
                    <div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:1px;align-self:flex-start;">Preview</div>
                    <canvas id="_pcPreview" width="148" height="148" style="image-rendering:pixelated;border:1px solid #333;background:#111;width:148px;height:148px;cursor:grab;"></canvas>
                    <div id="_pcPreviewLabel" style="font-size:11px;color:#888;text-align:center;">idle.gani</div>
                    <div style="display:flex;gap:5px;align-items:center;justify-content:center;">
                        <button id="_pcZoomOut" style="width:22px;height:22px;cursor:pointer;background:#333;color:#ccc;border:1px solid #555;font-size:14px;line-height:1;padding:0;">&#8722;</button>
                        <span style="font-size:10px;color:#666;min-width:28px;text-align:center;">zoom</span>
                        <button id="_pcZoomIn" style="width:22px;height:22px;cursor:pointer;background:#333;color:#ccc;border:1px solid #555;font-size:14px;line-height:1;padding:0;">+</button>
                    </div>
                    <div style="display:grid;grid-template-columns:repeat(3,26px);grid-template-rows:repeat(2,26px);gap:3px;">
                        <div></div>
                        <button id="_pcDirU" style="cursor:pointer;background:#333;color:#ccc;border:1px solid #555;font-size:13px;padding:0;">&#8593;</button>
                        <div></div>
                        <button id="_pcDirL" style="cursor:pointer;background:#333;color:#ccc;border:1px solid #555;font-size:13px;padding:0;">&#8592;</button>
                        <button id="_pcDirD" style="cursor:pointer;background:#333;color:#ccc;border:1px solid #555;font-size:13px;padding:0;">&#8595;</button>
                        <button id="_pcDirR" style="cursor:pointer;background:#333;color:#ccc;border:1px solid #555;font-size:13px;padding:0;">&#8594;</button>
                    </div>
                </div>
            </div>
            <div class="dialog-toolbar" style="padding:8px 12px;background:#353535;border-top:1px solid #1a1a1a;display:flex;gap:8px;align-items:center;flex-shrink:0;">
                ${btn('pcReset','Reset','margin-right:auto;')}
                ${btn('pcApply','Apply')}
                ${btn('pcOk','OK','background:#4472C4;color:#fff;border-color:#3060a0;')}
                ${btn('pcCancel','Cancel')}
            </div>`;
        document.body.appendChild(box);
        colorLabels.forEach((l, i) => { const sel = box.querySelector(`#pc_color${i}`); const v = s.colors?.[i]; sel.value = v != null ? String(v) : ''; });
        let _pvMM, _pvMU;
        const close = () => {
            if (_pvRAF) cancelAnimationFrame(_pvRAF);
            document.removeEventListener('mousemove', _pvMM);
            document.removeEventListener('mouseup', _pvMU);
            if (box.parentNode) box.parentNode.removeChild(box);
        };
        const readSettings = () => {
            const g = k => box.querySelector(`#pg_${k}`)?.value.trim()||`${k}.gani`;
            return { HEAD: box.querySelector('#pc_head').value.trim()||'head.png', BODY: box.querySelector('#pc_body').value.trim()||'body.png', SHIELD: box.querySelector('#pc_shield').value.trim()||'no-shield.png', SWORD: box.querySelector('#pc_sword').value.trim()||'sword1.png', ATTR1: box.querySelector('#pc_attr1').value.trim(), nick: box.querySelector('#pc_nick').value.trim(), colors: colorLabels.map((l,i) => { const v = box.querySelector(`#pc_color${i}`).value; return v !== '' ? parseInt(v) : null; }), ganis: { idle: g('idle'), walk: g('walk'), sit: g('sit'), push: g('push'), pull: g('pull'), grab: g('grab'), sword: g('sword'), sleep: g('sleep') } };
        };
        const applySettings = ns => {
            this._playerSettings = ns;
            if (this._playMode) { this._playerOverrides = { ATTR1: ns.ATTR1||'', SHIELD: ns.SHIELD, SWORD: ns.SWORD, HEAD: ns.HEAD, BODY: ns.BODY, colors: ns.colors }; if (this._player) { this._player._boundsLocked = false; this._player.frame = 0; this._player.nick = ns.nick || null; this._player.nickTimer = ns.nick ? 999999 : 0; } }
        };
        const fillFields = ns => {
            box.querySelector('#pc_head').value = ns.HEAD||''; box.querySelector('#pc_body').value = ns.BODY||''; box.querySelector('#pc_shield').value = ns.SHIELD||''; box.querySelector('#pc_sword').value = ns.SWORD||''; box.querySelector('#pc_attr1').value = ns.ATTR1||''; box.querySelector('#pc_nick').value = ns.nick||'';
            colorLabels.forEach((l,i) => { const v = ns.colors?.[i]; box.querySelector(`#pc_color${i}`).value = v != null ? String(v) : ''; });
            const gk = ['idle','walk','sit','push','pull','grab','sword','sleep'];
            gk.forEach(k => { box.querySelector(`#pg_${k}`).value = ns.ganis?.[k]||''; });
        };
        const pvCanvas = box.querySelector('#_pcPreview');
        const pvCtx = pvCanvas.getContext('2d');
        const PVC = 148;
        let _pvGani = s.ganis?.idle || 'idle.gani', _pvDir = 2, _pvFrame = 0, _pvFrameTimer = 0, _pvRAF = null, _pvLast = 0;
        let _pvZoom = 3, _pvPanX = PVC / 2 - 48, _pvPanY = PVC / 2 - 72, _pvCentered = false;
        let _pvDragging = false, _pvDragLx = 0, _pvDragLy = 0;
        const pvLabel = box.querySelector('#_pcPreviewLabel');
        const renderPreview = (ts) => {
            if (!box.isConnected) return;
            _pvRAF = requestAnimationFrame(renderPreview);
            const dt = Math.min((ts - _pvLast) / 1000, 0.1); _pvLast = ts;
            const ns = readSettings();
            const ganiData = this._ganiCache?.get(_pvGani);
            const totalFrames = ganiData?.frames?.length || 4;
            const frameWait = ganiData?.frames?.[_pvFrame]?.wait || 1;
            _pvFrameTimer += dt;
            if (_pvFrameTimer >= frameWait / 22) { _pvFrameTimer = 0; _pvFrame = (_pvFrame + 1) % totalFrames; }
            const savedCtx = this.ctx;
            pvCtx.clearRect(0, 0, PVC, PVC);
            pvCtx.save(); pvCtx.imageSmoothingEnabled = false;
            pvCtx.setTransform(_pvZoom, 0, 0, _pvZoom, _pvPanX, _pvPanY);
            this.ctx = pvCtx;
            const _pb = {};
            this._drawGaniNPC(0, 0, _pvGani, _pvDir, _pvFrame, _pb, { HEAD: ns.HEAD, BODY: ns.BODY, SHIELD: ns.SHIELD, SWORD: ns.SWORD, ATTR1: ns.ATTR1, colors: ns.colors });
            pvCtx.restore();
            this.ctx = savedCtx;
            if (!_pvCentered) {
                const ox = _pb._ganiOX ?? 0, oy = _pb._ganiOY ?? 0;
                const iw = _pb._imgW ?? 32, ih = _pb._imgH ?? 48;
                _pvPanX = PVC / 2 - (ox + iw / 2) * _pvZoom;
                _pvPanY = PVC / 2 - (oy + ih / 2) * _pvZoom;
                if (_pb._imgW != null) _pvCentered = true;
            }
        };
        pvCanvas.style.cursor = 'grab';
        const _pvDoZoom = (f) => { const cx = PVC/2, cy = PVC/2; _pvPanX = cx + (_pvPanX - cx) * f; _pvPanY = cy + (_pvPanY - cy) * f; _pvZoom *= f; };
        pvCanvas.addEventListener('wheel', e => { e.preventDefault(); e.stopPropagation(); _pvCentered = true; _pvDoZoom(e.deltaY < 0 ? 1.2 : 1/1.2); }, { passive: false });
        pvCanvas.addEventListener('dblclick', () => { _pvCentered = false; _pvZoom = 3; });
        pvCanvas.addEventListener('mousedown', e => { _pvDragging = true; _pvDragLx = e.clientX; _pvDragLy = e.clientY; pvCanvas.style.cursor = 'grabbing'; e.preventDefault(); });
        _pvMM = e => { if (!_pvDragging) return; _pvCentered = true; _pvPanX += e.clientX - _pvDragLx; _pvPanY += e.clientY - _pvDragLy; _pvDragLx = e.clientX; _pvDragLy = e.clientY; };
        _pvMU = () => { _pvDragging = false; pvCanvas.style.cursor = 'grab'; };
        document.addEventListener('mousemove', _pvMM);
        document.addEventListener('mouseup', _pvMU);
        _pvRAF = requestAnimationFrame(renderPreview);
        box.querySelectorAll('[data-play]').forEach(b => b.addEventListener('click', () => {
            const key = b.dataset.play;
            _pvGani = box.querySelector(`#pg_${key}`)?.value.trim() || `${key}.gani`;
            _pvFrame = 0; _pvFrameTimer = 0; _pvCentered = false;
            if (pvLabel) pvLabel.textContent = _pvGani;
        }));
        box.querySelector('#_pcZoomIn').onclick = () => { _pvCentered = true; _pvDoZoom(1.25); };
        box.querySelector('#_pcZoomOut').onclick = () => { _pvCentered = true; _pvDoZoom(0.8); };
        box.querySelector('#_pcDirU').onclick = () => { _pvDir = 0; _pvFrame = 0; };
        box.querySelector('#_pcDirL').onclick = () => { _pvDir = 1; _pvFrame = 0; };
        box.querySelector('#_pcDirD').onclick = () => { _pvDir = 2; _pvFrame = 0; };
        box.querySelector('#_pcDirR').onclick = () => { _pvDir = 3; _pvFrame = 0; };
        box.querySelector('#pcClose').onclick = close;
        box.querySelector('#pcCancel').onclick = close;
        box.querySelector('#pcApply').onclick = () => applySettings(readSettings());
        box.querySelector('#pcReset').onclick = () => { fillFields(this._defaultPlayerSettings()); applySettings(this._defaultPlayerSettings()); };
        box.querySelector('#pcOk').onclick = () => { const ns = readSettings(); applySettings(ns); localStorage.setItem('graal_playerSettings', JSON.stringify(ns)); close(); };
        const tb = box.querySelector('#_pcTitlebar');
        let _dx = 0, _dy = 0, _dragging = false;
        tb.addEventListener('mousedown', e => { _dragging = true; _dx = e.clientX - box.offsetLeft; _dy = e.clientY - box.offsetTop; tb.style.cursor = 'grabbing'; e.preventDefault(); });
        document.addEventListener('mousemove', e => { if (!_dragging) return; box.style.left = (e.clientX - _dx) + 'px'; box.style.top = (e.clientY - _dy) + 'px'; });
        document.addEventListener('mouseup', () => { _dragging = false; tb.style.cursor = 'grab'; });
    }


    enterPlayMode() {
        this._colHW = 15; this._colHH = 15;
        this._playMode = true;
        this.selectedObject = null; this.selectionStartX = -1; this.selectionEndX = -1;
        const btn = document.getElementById('btnPlay');
        if (btn) btn.innerHTML = '&#9632; Stop';
        const hide = ['#levelToolbar','.object-library-panel','.right-tabs','.splitter-handle','.status-bar','.canvas-controls-bar','#btnCenterView'];
        this._hiddenEls = [];
        hide.forEach(sel => document.querySelectorAll(sel).forEach(el => { this._hiddenEls.push([el, el.style.display]); el.style.display = 'none'; }));
        this.resizeCanvas();
        const tw = this.level.tileWidth || 16;
        const spawnX = (this.canvas.width / 2 - this.panX) / this.zoom;
        const spawnY = (this.canvas.height / 2 - this.panY) / this.zoom;
        this._player = { x: spawnX, y: spawnY, dir: 2, gani: 'idle.gani', frame: 0, frameTimer: 0, speed: tw * 12, nick: null, nickTimer: 0 };
        if (!this._playerSettings) { try { this._playerSettings = JSON.parse(localStorage.getItem('graal_playerSettings') || 'null'); } catch(e) {} }
        if (!this._playerSettings) this._playerSettings = this._defaultPlayerSettings();
        const _ps = this._playerSettings, _pG = _ps.ganis || {};
        const _preloadGanis = [...new Set(['idle.gani','walk.gani','push.gani','pull.gani','grab.gani','sword.gani','sit.gani',_pG.idle,_pG.walk,_pG.push,_pG.pull,_pG.grab,_pG.sword,_pG.sit,_pG.sleep].filter(Boolean))];
        for (const g of _preloadGanis) this._drawGaniNPC(-9999, -9999, g, 0, 0, {}, {});
        this._playerOverrides = { ATTR1: _ps.ATTR1||'', SHIELD: _ps.SHIELD||'no-shield.png', SWORD: _ps.SWORD||'sword1.png', HEAD: _ps.HEAD||'moondeath-head.png', BODY: _ps.BODY||'suit32.png', colors: _ps.colors||[12,null,null,null,null] };
        if (_ps.nick) { this._player.nick = _ps.nick; this._player.nickTimer = 5; }
        this._playKeys = {};
        this._chatOpen = false; this._chatMsg = ''; this._chatHistory = []; this._chatHistoryIdx = -1;
        this._playerChat = null; this._playerChatTimer = 0;
        this._createPlayChatUI();
        this._playKeyDown = (e) => {
            const _ae = document.activeElement;
            if (this._chatOpen) {
                if (e.key === 'Escape' || e.key === 'Tab') { e.preventDefault(); this._closePlayChat(); return; }
                if (e.key === 'Enter') { this._submitPlayChat(); return; }
                if (e.key === 'ArrowUp') { this._chatHistoryIdx = Math.min(this._chatHistoryIdx + 1, this._chatHistory.length - 1); if (this._chatInput) this._chatInput.value = this._chatHistory[this._chatHistoryIdx] || ''; e.preventDefault(); return; }
                if (e.key === 'ArrowDown') { this._chatHistoryIdx = Math.max(this._chatHistoryIdx - 1, -1); if (this._chatInput) this._chatInput.value = this._chatHistoryIdx < 0 ? '' : this._chatHistory[this._chatHistoryIdx]; e.preventDefault(); return; }
                return;
            }
            if (_ae && (_ae.tagName === 'INPUT' || _ae.tagName === 'TEXTAREA' || _ae.tagName === 'SELECT' || _ae.isContentEditable)) return;
            const _pkb = this._getKeybinds();
            if (e.key === 'Tab' || _matchKB(e, _pkb.openChat)) { e.preventDefault(); this._openPlayChat(); return; }
            if (_matchKB(e, _pkb.debugInfo)) { this._showMouseTile = !this._showMouseTile; return; }
            if (_matchKB(e, _pkb.debugOverlay)) { this._showColDebug = !this._showColDebug; return; }
            if (_matchKB(e, _pkb.grab)) { this._tryGrab(); }
            if (_matchKB(e, _pkb.editBypass)) { this._editBypass = !this._editBypass; if (this._editBypass) { (this._hiddenEls || []).forEach(([el, disp]) => el.style.display = disp || ''); this.resizeCanvas(); } else { (this._hiddenEls || []).forEach(([el]) => el.style.display = 'none'); this.resizeCanvas(); } return; }
            if (e.key === ' ' && this._linkPickMode) {
                e.preventDefault();
                const tw = this.level.tileWidth || 16, th = this.level.tileHeight || 16;
                const p = this._player;
                const pcx = p.x + (p._ganiOX ?? 0) + (p._imgW ?? tw) / 2;
                const pcy = p.y + (p._ganiOY ?? 0) + (p._imgH ?? 48) - 16;
                const tx = Math.floor(pcx / tw), ty = Math.floor(pcy / th);
                const levelName = this.levels[this.currentLevelIndex]?.name || '';
                this._showLinkPickConfirm({ nextLevel: levelName, nextX: String(tx), nextY: String(ty), x1: tx, y1: ty, x2: tx, y2: ty, fromPlayMode: true });
                return;
            }
            this._playKeys[e.key] = true; e.preventDefault();
        };
        this._playKeyUp = (e) => { if (!this._chatOpen) this._playKeys[e.key] = false; };
        window.addEventListener('keydown', this._playKeyDown);
        window.addEventListener('keyup', this._playKeyUp);
        let last = 0;
        this._playRAF = (ts) => {
            if (!this._playMode) return;
            const dt = Math.min((ts - last) / 1000, 0.05); last = ts;
            this._updatePlayer(dt);
            this.render();
            requestAnimationFrame(this._playRAF);
        };
        requestAnimationFrame(this._playRAF);
    }

    exitPlayMode() {
        this._playMode = false;
        const btn = document.getElementById('btnPlay');
        if (btn) btn.innerHTML = '&#9654; Play';
        (this._hiddenEls || []).forEach(([el, disp]) => el.style.display = disp);
        this._hiddenEls = null; this._player = null; this._playKeys = {}; this._playNoclip = false; this._mngAnimCache = null;
        this._chatOpen = false; this._playerChat = null;
        document.getElementById('_playChatBar')?.remove();
        if (this._chatCanvasClick) this.canvas.removeEventListener('mousedown', this._chatCanvasClick);
        if (this._playMouseMove) this.canvas.removeEventListener('mousemove', this._playMouseMove);
        this.resizeCanvas();
        window.removeEventListener('keydown', this._playKeyDown);
        window.removeEventListener('keyup', this._playKeyUp);
        this.requestRender();
    }

    _getTileType(wx, wy) {
        if (!this.level || typeof TILE_TYPES === 'undefined') return 0;
        const tw = this.level.tileWidth || 16, th = this.level.tileHeight || 16;
        const tx = Math.floor(wx / tw), ty = Math.floor(wy / th);
        if (tx < 0 || ty < 0 || tx >= this.level.width || ty >= this.level.height) return 22;
        const tilesPerRow = Math.floor((this.level.tilesetImage?.width || 512) / tw);
        for (let layer = 0; layer < this.level.layers.length; layer++) {
            const idx = this.level.getTile(layer, tx, ty);
            if (idx < 0) continue;
            const col = idx % tilesPerRow, row = Math.floor(idx / tilesPerRow);
            const typeId = Math.floor(col / 16) * 512 + (col % 16) + row * 16;
            const t = TILE_TYPES.TYPE0[typeId] || 0;
            if (t !== 0) return t;
        }
        return 0;
    }

    _tryGrab() {
        const p = this._player; if (!p || p._attacking) return;
        const tw = this.level.tileWidth || 16, th = this.level.tileHeight || 16;
        const facing = [[0,-1],[-1,0],[0,1],[1,0]][p.dir];
        const reach = tw * 2;
        const cx = p.x + (p._ganiOX ?? 0) + (p._imgW ?? tw) / 2;
        const cy = p.y + (p._ganiOY ?? 0) + (p._imgH ?? 48) - 16;
        const fx = cx + facing[0] * reach, fy = cy + facing[1] * reach;
        const tileBlocking = this._getTileType(fx, fy) === 22;
        const nearby = (this.level.objects || []).find(obj => {
            if (obj.type !== 'npc' && obj.type !== 'chest' && obj.type !== 'sign') return false;
            const ox = obj.x * tw, oy = obj.y * th;
            return Math.abs(fx - ox) < reach && Math.abs(fy - oy) < reach;
        });
        if (tileBlocking || nearby) { this._setani(this._playerSettings?.ganis?.grab||'grab.gani'); p._grabbing = true; p._grabDir = p.dir; }
    }

    _canMoveTo(nx, ny) {
        if (this._playNoclip) return true;
        const tw = this.level.tileWidth || 16, th = this.level.tileHeight || 16;
        const p = this._player;
        const hw = this._colHW ?? 8, hh = this._colHH ?? 7;
        const pcx = nx + (p?._ganiOX ?? 0) + (p?._imgW ?? tw) / 2;
        const pcy = ny + (p?._ganiOY ?? 0) + (p?._imgH ?? 48) - 16;
        const pts = [
            [pcx - hw, pcy - hh], [pcx, pcy - hh], [pcx + hw, pcy - hh],
            [pcx - hw, pcy],                        [pcx + hw, pcy],
            [pcx - hw, pcy + hh], [pcx, pcy + hh], [pcx + hw, pcy + hh],
        ];
        for (const [px, py] of pts) { const _tt = this._getTileType(px, py); if (_tt === 22 || _tt === 20) return false; }
        for (const obj of (this.level.objects || [])) {
            if (obj.type !== 'npc' && obj.type !== 'chest') continue;
            if (obj.type === 'npc' && (!obj.properties?.image || !obj._imgW) && !/showcharacter/i.test(obj.properties?.code || '')) continue;
            const ox = obj.x * tw, oy = obj.y * th;
            if (obj.type === 'chest') {
                if (pcx+hw > ox && pcx-hw < ox+tw*2 && pcy+hh > oy && pcy-hh < oy+th*2) return false;
                continue;
            }
            if (!obj._shapeCache) {
                const sp = parseNPCScript(obj.properties?.code || '');
                obj._shapeCache = sp.setshape2 ? { type: 2, w: sp.setshape2.w, h: sp.setshape2.h, tiles: sp.setshape2.tiles }
                                : sp.setshape  ? { type: 1, w: sp.setshape.w, h: sp.setshape.h }
                                : { type: 0 };
            }
            const sc = obj._shapeCache;
            if (sc.type === 2) {
                for (let ty2 = 0; ty2 < sc.h; ty2++) for (let tx2 = 0; tx2 < sc.w; tx2++) {
                    if (!sc.tiles[ty2 * sc.w + tx2]) continue;
                    if (pcx+hw > ox+tx2*tw && pcx-hw < ox+(tx2+1)*tw && pcy+hh > oy+ty2*th && pcy-hh < oy+(ty2+1)*th) return false;
                }
            } else {
                let bx, by, bw, bh;
                if (sc.type === 1) { bx = ox; by = oy; bw = sc.w; bh = sc.h; }
                else if (/showcharacter/i.test(obj.properties?.code || '')) { const _cx = ox + (obj._ganiOX ?? 0) + (obj._imgW ?? tw) / 2; bx = _cx - (this._colHW ?? 15); by = oy + (obj._imgH ?? 48) - (this._colHH ?? 15)*2; bw = (this._colHW ?? 15)*2; bh = (this._colHH ?? 15)*2; }
                else {
                    const tb = this._getTightBounds(obj);
                    if (!tb) continue;
                    const _sx = obj._stretchx ?? 1;
                    const tbx2 = _sx < 0 ? tb.srcW - tb.bx - tb.bw : tb.bx;
                    if (pcx+hw <= ox+tbx2 || pcx-hw >= ox+tbx2+tb.bw || pcy+hh <= oy+tb.by || pcy-hh >= oy+tb.by+tb.bh) continue;
                    let hit = false;
                    for (const [ppx, ppy] of pts) {
                        let rx = Math.round(ppx - ox), ry = Math.round(ppy - oy);
                        if (_sx < 0) rx = tb.srcW - 1 - rx;
                        if (rx >= 0 && ry >= 0 && rx < tb.srcW && ry < tb.srcH && tb.mask[ry * tb.srcW + rx]) { hit = true; break; }
                    }
                    if (hit) return false;
                    continue;
                }
                if (pcx+hw > bx && pcx-hw < bx+bw && pcy+hh > by && pcy-hh < by+bh) return false;
            }
        }
        return true;
    }

    _playSound(filename) {
        if (!filename) return;
        if (!this._audioCache) this._audioCache = new Map();
        let src = this._audioCache.get(filename);
        if (!src) { src = filename.includes('.') ? `sounds/${filename}` : `sounds/${filename}.wav`; this._audioCache.set(filename, src); }
        const a = new Audio(src); a.volume = 0.5; a.play().catch(() => {});
    }

    _setani(name) {
        const p = this._player; if (!p || p.gani === name) return;
        p.gani = name; p.frame = 0; p.frameTimer = 0;
    }
    _updatePlayer(dt) {
        const p = this._player, k = this._playKeys;
        if (k['Shift'] && !p._shiftWas) { this._playNoclip = !this._playNoclip; delete this._playKeys['Shift']; }
        p._shiftWas = k['Shift'];
        const tw = this.level.tileWidth || 16, th = this.level.tileHeight || 16;
        const up = k['ArrowUp'] || k['w'], down = k['ArrowDown'] || k['s'];
        const left = k['ArrowLeft'] || k['a'], right = k['ArrowRight'] || k['d'];
        let dx = 0, dy = 0;
        let _pulling = false;
        if (p._grabbing) {
            if (k['e'] || k['E']) {
                p.dir = p._grabDir;
                const pullKeys = [down, right, up, left];
                if (pullKeys[p._grabDir]) { _pulling = true; }
                else { p.gani = this._playerSettings?.ganis?.grab||'grab.gani'; return; }
            } else { p._grabbing = false; }
        }
        if (k[' '] && !p._spaceWas) { this._setani(this._playerSettings?.ganis?.sword||'sword.gani'); p._attacking = true; p._attackDir = p.dir; p._freezeTimer = 0.15; p._attackFrameCount = 0; }
        p._spaceWas = k[' '];
        if (p._freezeTimer > 0) { p._freezeTimer -= dt; }
        if (!_pulling) {
            if (!p._attacking) {
                if (up) { dy = -1; p.dir = 0; } else if (down) { dy = 1; p.dir = 2; }
                if (left) { dx = -1; p.dir = 1; } else if (right) { dx = 1; p.dir = 3; }
            } else { p.dir = p._attackDir; }
        }
        const moving = dx !== 0 || dy !== 0;
        let walkedIntoSomething = false;
        if (moving && !p._attacking && !(p._freezeTimer > 0)) {
            const len = Math.sqrt(dx*dx + dy*dy);
            const mx = (dx/len) * p.speed * dt, my = (dy/len) * p.speed * dt;
            const nudge = 1;
            const nudgeTest = (this._colHH ?? 12) + 4;
            const px0 = p.x, py0 = p.y;
            if (mx !== 0) {
                if (this._canMoveTo(p.x + mx, p.y)) { p.x += mx; }
                else {
                    const cUp = this._canMoveTo(p.x + mx, p.y - nudgeTest);
                    const cDn = this._canMoveTo(p.x + mx, p.y + nudgeTest);
                    if (cUp && !cDn) { p.x += mx; p.y -= nudge; }
                    else if (cDn && !cUp) { p.x += mx; p.y += nudge; }
                    else if (!cUp && !cDn) {
                        for (let d = 1; d < nudgeTest; d++) {
                            if (this._canMoveTo(p.x + mx, p.y - d)) { p.y -= nudge; break; }
                            if (this._canMoveTo(p.x + mx, p.y + d)) { p.y += nudge; break; }
                        }
                    }
                }
            }
            if (my !== 0) {
                if (this._canMoveTo(p.x, p.y + my)) { p.y += my; }
                else {
                    const cLt = this._canMoveTo(p.x - nudgeTest, p.y + my);
                    const cRt = this._canMoveTo(p.x + nudgeTest, p.y + my);
                    if (cLt && !cRt) { p.y += my; p.x -= nudge; }
                    else if (cRt && !cLt) { p.y += my; p.x += nudge; }
                    else if (!cLt && !cRt) {
                        for (let d = 1; d < nudgeTest; d++) {
                            if (this._canMoveTo(p.x + d, p.y + my)) { p.x += nudge; break; }
                            if (this._canMoveTo(p.x - d, p.y + my)) { p.x -= nudge; break; }
                        }
                    }
                }
            }
            const _ox = p._ganiOX ?? 0, _oy = p._ganiOY ?? 0, _iw = p._imgW ?? tw, _ih = p._imgH ?? th;
            p.x = Math.max(-_ox, Math.min(p.x, this.level.width * tw - _ox - _iw));
            p.y = Math.max(-_oy, Math.min(p.y, this.level.height * th - _oy - _ih));
            if (p.x === px0 && p.y === py0) walkedIntoSomething = true;
        }
        if (!_pulling) {
            if (walkedIntoSomething) {
                p._pushTimer = (p._pushTimer || 0) + dt;
                p._pushHold = 0.15;
                if (p._pushTimer > 1.0) p._pushActive = true;
            } else if (p._pushActive) {
                p._pushHold = Math.max(0, (p._pushHold || 0) - dt);
                if (p._pushHold === 0) { p._pushActive = false; p._pushTimer = 0; }
            } else { p._pushTimer = 0; }
        } else { p._pushTimer = 0; p._pushActive = false; p._pushHold = 0; }
        const pushing = !!p._pushActive;
        const _scx = p.x + (p._ganiOX ?? 0) + (p._imgW ?? 32) / 2, _scy = p.y + (p._ganiOY ?? 0) + (p._imgH ?? 48) - 16;
        const sitting = this._getTileType(_scx, _scy) === 3;
        if (!p._attacking) {
            const _pG2 = this._playerSettings?.ganis||{};
            const nextGani = _pulling ? (_pG2.pull||'pull.gani') : (sitting ? (_pG2.sit||'sit.gani') : pushing ? (_pG2.push||'push.gani') : (moving ? (_pG2.walk||'walk.gani') : (_pG2.idle||'idle.gani')));
            this._setani(nextGani);
        }
        const ganiData = this._ganiCache?.get(p.gani);
        const totalFrames = ganiData?.frames?.length || 4;
        const frameWait = ganiData?.frames?.[p.frame]?.wait || 1;
        p.frameTimer += dt;
        if (p.frameTimer >= frameWait / 22) {
            p.frameTimer = 0;
            const nextFrame = p.frame + 1;
            if (nextFrame >= totalFrames) {
                if (ganiData?.setbackto) { this._setani(ganiData.setbackto); }
                else if (ganiData?.loop || !ganiData) { p.frame = 0; }
            } else { p.frame = nextFrame; }
            const frameData = ganiData?.frames?.[p.frame];
            if (frameData?.sound) this._playSound(frameData.sound);
            if (p._attacking && p.frame === 0 && p._attackFrameCount > 0) { p._attacking = false; p._grabbing = false; p._attackFrameCount = 0; }
            if (p._attacking) p._attackFrameCount = (p._attackFrameCount || 0) + 1;
        }
        if (!moving && !sitting && !p._attacking && !_pulling && !p._grabbing) { p.frame = 0; p.frameTimer = 0; }
        if (this._playerChatTimer > 0) { this._playerChatTimer -= dt; if (this._playerChatTimer <= 0) this._playerChat = null; }
        if (p.nickTimer > 0) p.nickTimer -= dt;
        if (this._warpCooldown > 0) { this._warpCooldown -= dt; }
        else if (!this._linkPickMode) {
            const tw = this.level.tileWidth || 16, th = this.level.tileHeight || 16;
            const pcx = p.x + (p._ganiOX ?? 0) + (p._imgW ?? tw) / 2;
            const pcy = p.y + (p._ganiOY ?? 0) + (p._imgH ?? 48) - 16;
            const _lhw = this._colHW ?? 12, _lhh = this._colHH ?? 12;
            if (!this._activeLinkObjs) this._activeLinkObjs = new Set();
            const _nextActive = new Set();
            for (const obj of (this.level.objects || [])) {
                if (obj.type !== 'link') continue;
                const pr = obj.properties || {};
                const lx = obj.x * tw, ly = obj.y * th;
                const lw = (pr.width || 2) * tw, lh = (pr.height || 2) * th;
                if (pcx + _lhw + 1 > lx && pcx - _lhw - 1 < lx + lw && pcy + _lhh + 1 > ly && pcy - _lhh - 1 < ly + lh) {
                    _nextActive.add(obj);
                    if (!this._activeLinkObjs.has(obj) && moving) { this._triggerLink(pr); break; }
                }
            }
            this._activeLinkObjs = _nextActive;
        }
        const _camCX = p.x + (p._ganiOX ?? 0) + (p._imgW ?? 32) / 2;
        const _camCY = p.y + (p._ganiOY ?? 0) + (p._imgH ?? 48) / 2;
        this.panX = this.canvas.width / 2 - _camCX * this.zoom;
        this.panY = this.canvas.height / 2 - _camCY * this.zoom;
    }

    _triggerLink(props) {
        const raw = (props.nextLevel || '').trim();
        if (!raw) return;
        const base = raw.replace(/\.(nw|graal|zelda)$/i, '');
        const variants = [raw, base + '.nw', base + '.graal', base + '.zelda'];
        const existing = this.levels.findIndex(l => variants.some(v => v.toLowerCase() === (l.name||'').toLowerCase()));
        if (existing >= 0) {
            this.switchLevel(existing);
            this._warpCooldown = 0.5;
            this._activeLinkObjs = new Set();
        } else {
            let level = null, usedName = null;
            for (const n of variants) {
                const txt = this.fileCache?.levels?.get(n);
                if (txt) { level = Level.loadFromNW(txt); usedName = n; break; }
                const obj = this.fileCache?.levelObjects?.get(n);
                if (obj) { level = obj; usedName = n; break; }
            }
            if (!level) return;
            if (this.level?.tilesetImage) { level.tilesetImage = this.level.tilesetImage; level.tilesetName = this.level.tilesetName; }
            this.levels.push({ level, name: usedName, modified: false });
            this.currentLevelIndex = this.levels.length - 1;
            this.level = level;
            this.addLevelTab(this.currentLevelIndex);
        }
        const tw = this.level.tileWidth || 16, th = this.level.tileHeight || 16;
        const p = this._player;
        p.x = parseFloat(props.nextX || 0) * tw;
        p.y = parseFloat(props.nextY || 0) * th;
        p._boundsLocked = false;
        this._warpCooldown = 0.5;
        this._activeLinkObjs = new Set();
        this.render();
        this.saveSessionDebounced();
    }

    populateFileCache() {
        const tree = document.getElementById('objectTree');
        if (!tree) return;
        tree.innerHTML = '';
        tree.style.display = 'grid';
        tree.style.gridTemplateColumns = 'repeat(auto-fill, minmax(48px, 1fr))';
        tree.style.gap = '4px';
        tree.style.padding = '4px';
        for (const [name, url] of this.fileCache.images) {
            const wrap = document.createElement('div');
            wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;cursor:default;padding:2px;';
            const img = document.createElement('img');
            img.src = url;
            img.style.cssText = 'width:32px;height:32px;object-fit:contain;image-rendering:pixelated;background:#111;border:1px solid #444;';
            img.title = name;
            const lbl = document.createElement('div');
            lbl.textContent = name.length > 8 ? name.substring(0, 7) + '…' : name;
            lbl.style.cssText = 'font-size:9px;color:#aaa;text-align:center;max-width:48px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
            wrap.appendChild(img);
            wrap.appendChild(lbl);
            tree.appendChild(wrap);
        }
        if (!this.fileCache.images.size) {
            tree.style.display = 'block';
            tree.textContent = 'No images found.';
            tree.style.color = '#666';
        }
    }

    applyTiledefFromNPCs() {
        if (!this.level) return;
        const levelName = (this.levels[this.currentLevelIndex]?.name || '').toLowerCase().replace(/\.nw$/i, '');
        let baseName = null;
        const overlays = [];
        const imgSrc = name => this.fileCache?.images?.get(name) || this._tilesetDataCache?.[name] || `images/${name}`;
        for (const td of (this.level._tiledefs || [])) {
            if (td.visible === false) continue;
            if (td.type === 2) overlays.push({ img: td.img, x: td.x, y: td.y });
            else if (!baseName) baseName = td.img;
        }
        for (const obj of this.level.objects) {
            if (obj.type !== 'npc') continue;
            const sp = parseNPCScript(obj.properties?.code || '');
            if (sp.tiledefs && !baseName) {
                for (const td of sp.tiledefs) {
                    const ls = td.levelstart.toLowerCase().replace(/\.nw$/i, '');
                    const isSelf = ['this.level','this.level.name','this.gmap','this.gmap.name'].includes(ls);
                    if (!isSelf && !levelName.startsWith(ls)) continue;
                    baseName = td.img; break;
                }
            }
            if (sp.tiledefs2) {
                for (const td of sp.tiledefs2) {
                    const ls = td.levelstart.toLowerCase().replace(/\.nw$/i, '');
                    const isSelf2 = ['this.level','this.level.name','this.gmap','this.gmap.name'].includes(ls);
                    if (!isSelf2 && ls && !levelName.startsWith(ls)) continue;
                    overlays.push({ img: td.img, x: td.x, y: td.y });
                }
            }
        }
        if (!baseName && !overlays.length) return;
        const baseSrc = baseName ? imgSrc(baseName) : (this._tilesetDataCache?.[this.level.tilesetName] || this.fileCache?.images?.get(this.level.tilesetName) || `images/${this.level.tilesetName}`);
        const applyOverlays = (baseImg) => {
            if (!overlays.length) {
                this.level.tilesetImage = baseImg;
                if (baseName) this.level.tilesetName = baseName;
                this.updateTilesetDisplay(); this.render(); return;
            }
            const cv = document.createElement('canvas');
            cv.width = baseImg.width; cv.height = baseImg.height;
            const ctx = cv.getContext('2d');
            ctx.drawImage(baseImg, 0, 0);
            let rem = overlays.length;
            const done = () => { const r = new Image(); r.onload = () => { this.level.tilesetImage = r; if (baseName) this.level.tilesetName = baseName; this.updateTilesetDisplay(); this.render(); }; r.src = cv.toDataURL(); };
            for (const ov of overlays) {
                const img = new Image();
                img.onload = () => { ctx.drawImage(img, 0, 0, img.width, img.height, ov.x, ov.y, img.width, img.height); if (!--rem) done(); };
                img.onerror = () => { if (!--rem) done(); };
                img.src = imgSrc(ov.img);
            }
        };
        const base = new Image();
        base.onload = () => applyOverlays(base);
        base.src = baseSrc;
    }

    parseGmap(text) {
        const lines = text.split('\n').map(l => l.trim());
        let tilesetName = 'pics1.png', width = 0, height = 0;
        const grid = [];
        for (let i = 1; i < lines.length; i++) {
            const words = lines[i].split(' ');
            if (words[0] === 'TILESET' && words[1]) tilesetName = words[1];
            else if (words[0] === 'WIDTH') width = parseInt(words[1]);
            else if (words[0] === 'HEIGHT') height = parseInt(words[1]);
            else if (words[0] === 'LEVELNAMES') {
                for (++i; i < lines.length && lines[i] !== 'LEVELNAMESEND'; ++i)
                    grid.push(lines[i].split(',').map(s => s.trim().replace(/^"|"$/g, '')));
            }
        }
        return { tilesetName, width, height, grid };
    }

    _buildGmapEntry(text, filename, levelsOverride) {
        const { tilesetName, grid } = this.parseGmap(text);
        if (!grid.length) return null;
        const gridH = grid.length, gridW = Math.max(...grid.map(r => r.length));
        const merged = new Level(gridW * 64, gridH * 64);
        merged.tilesetName = tilesetName;
        merged.tilesetImage = this.level?.tilesetImage || null;
        const usedLevels = {};
        const _lvlByBasename = name => { const bn = name.toLowerCase(); for (const [k, v] of this.fileCache.levels) { if (k.toLowerCase().endsWith('\\' + bn) || k.toLowerCase().endsWith('/' + bn)) return v; } return null; };
        const getLevel = name => levelsOverride ? (typeof levelsOverride.get === 'function' ? levelsOverride.get(name) : (levelsOverride[name] ?? levelsOverride[`"${name}"`])) : (this.fileCache.levels.get(name) || this.fileCache.levels.get(name.toLowerCase()) || _lvlByBasename(name));
        for (let cellY = 0; cellY < gridH; cellY++) {
            for (let cellX = 0; cellX < (grid[cellY]?.length || 0); cellX++) {
                const levelName = grid[cellY][cellX];
                if (!levelName) continue;
                const nwText = getLevel(levelName);
                if (!nwText) continue;
                usedLevels[levelName] = nwText;
                const sub = Level.loadFromNW(nwText);
                for (let layer = 0; layer < 3; layer++)
                    for (let ty = 0; ty < 64; ty++)
                        for (let tx = 0; tx < 64; tx++) {
                            const tile = sub.getTile(layer, tx, ty);
                            if (tile >= 0) merged.setTile(layer, cellX * 64 + tx, cellY * 64 + ty, tile);
                        }
                for (const obj of sub.objects) {
                    const clone = new LevelObject(obj.x + cellX * 64, obj.y + cellY * 64, obj.type);
                    clone.properties = JSON.parse(JSON.stringify(obj.properties));
                    merged.addObject(clone);
                }
            }
        }
        return { level: merged, name: filename, modified: false, gmapText: text, gmapLevels: usedLevels, gmapGrid: grid };
    }

    async _refillGmapEntries() {
        console.log('[refill] called, tauriPathIndex size:', this._tauriPathIndex?.size, 'levels:', this.levels.length);
        if (!this._tauriPathIndex?.size) return;
        let anyFilled = false;
        for (const entry of this.levels) {
            if (!entry.gmapGrid) continue;
            const grid = entry.gmapGrid;
            const missing = [];
            for (const row of grid) for (const name of row) {
                if (!name || entry.gmapLevels?.[name]) continue;
                const key = name.toLowerCase().endsWith('.nw') ? name.toLowerCase() : name.toLowerCase() + '.nw';
                const inFileCache = this.fileCache.levels.has(key);
                const inPathIndex = this._tauriPathIndex.has(key);
                console.log(`[refill] cell "${name}" key="${key}" inFileCache=${inFileCache} inPathIndex=${inPathIndex} gmapLevelsHas=${!!entry.gmapLevels?.[name]}`);
                if (!inFileCache && inPathIndex) missing.push([name, key]);
            }
            console.log('[refill] entry:', entry.name, 'missing:', missing.map(m => m[0]));
            if (!missing.length) continue;
            await Promise.all(missing.map(([, key]) =>
                _tauri.fs.readTextFile(this._tauriPathIndex.get(key)).then(t => this.fileCache.levels.set(key, t)).catch(() => {})
            ));
            for (let cy = 0; cy < grid.length; cy++) {
                for (let cx = 0; cx < (grid[cy]?.length || 0); cx++) {
                    const name = grid[cy][cx];
                    if (!name || entry.gmapLevels?.[name]) continue;
                    const key = name.toLowerCase().endsWith('.nw') ? name.toLowerCase() : name.toLowerCase() + '.nw';
                    const nwText = this.fileCache.levels.get(key);
                    if (!nwText) continue;
                    if (!entry.gmapLevels) entry.gmapLevels = {};
                    entry.gmapLevels[name] = nwText;
                    const sub = Level.loadFromNW(nwText);
                    const lv = entry.level;
                    for (let layer = 0; layer < 3; layer++)
                        for (let ty = 0; ty < 64; ty++)
                            for (let tx = 0; tx < 64; tx++) { const tile = sub.getTile(layer, tx, ty); if (tile >= 0) lv.setTile(layer, cx * 64 + tx, cy * 64 + ty, tile); }
                    for (const obj of sub.objects) {
                        const clone = new LevelObject(obj.x + cx * 64, obj.y + cy * 64, obj.type);
                        clone.properties = JSON.parse(JSON.stringify(obj.properties));
                        lv.addObject(clone);
                    }
                    anyFilled = true;
                }
            }
        }
        if (anyFilled) this.render();
    }

    _serializeGmapEntry(entry) {
        const updatedLevels = {};
        const grid = entry.gmapGrid;
        const lv = entry.level;
        for (let cellY = 0; cellY < grid.length; cellY++) {
            for (let cellX = 0; cellX < (grid[cellY]?.length || 0); cellX++) {
                const name = grid[cellY][cellX].replace(/^"|"$/g, '');
                if (!name) continue;
                const sub = new Level(64, 64);
                sub.tilesetName = lv.tilesetName;
                sub.tilesetImage = lv.tilesetImage;
                for (let layer = 0; layer < 3; layer++)
                    for (let ty = 0; ty < 64; ty++)
                        for (let tx = 0; tx < 64; tx++)
                            sub.setTile(layer, tx, ty, lv.getTile(layer, cellX * 64 + tx, cellY * 64 + ty));
                for (const obj of lv.objects) {
                    const cx = Math.floor(obj.x / 64), cy = Math.floor(obj.y / 64);
                    if (cx === cellX && cy === cellY) {
                        const clone = new LevelObject(obj.x - cellX * 64, obj.y - cellY * 64, obj.type);
                        clone.properties = JSON.parse(JSON.stringify(obj.properties));
                        sub.addObject(clone);
                    }
                }
                updatedLevels[name] = sub.saveToNW();
            }
        }
        return { gmap: entry.gmapText, gmapLevels: updatedLevels, gmapGrid: entry.gmapGrid, name: entry.name, tilesetName: lv.tilesetName || 'pics1.png', modified: entry.modified };
    }

    async openGmapText(text, filename, levelsOverride) {
        console.log('[openGmapText]', filename, 'tauriPathIndex size:', this._tauriPathIndex?.size, 'levelsOverride:', !!levelsOverride, 'fileCache.levels size:', this.fileCache?.levels?.size);
        if (!levelsOverride && _isTauri && this._tauriPathIndex?.size) {
            const { grid } = this.parseGmap(text);
            const toLoad = [];
            for (const row of grid) for (const rawName of row) {
                if (!rawName) continue;
                const key = rawName.toLowerCase().endsWith('.nw') ? rawName.toLowerCase() : rawName.toLowerCase() + '.nw';
                const alreadyLoaded = this.fileCache.levels.has(key) || this.fileCache.levels.has(rawName.toLowerCase()) || [...this.fileCache.levels.keys()].some(k => k.toLowerCase().endsWith('\\' + key) || k.toLowerCase().endsWith('/' + key));
                const path = alreadyLoaded ? null : (this._tauriPathIndex.get(key) || this._tauriPathIndex.get(rawName.toLowerCase()) || [...this._tauriPathIndex.entries()].find(([k]) => k.toLowerCase().endsWith('\\' + key) || k.toLowerCase().endsWith('/' + key))?.[1]);
                console.log(`[openGmapText cell] "${rawName}" key="${key}" alreadyLoaded=${alreadyLoaded} path=${path}`);
                if (!alreadyLoaded && path) toLoad.push([key, path]);
            }
            await Promise.all(toLoad.map(([name, path]) =>
                _tauri.fs.readTextFile(path).then(t => { console.log(`[openGmapText load] "${name}" bytes=${t.length} preview="${t.substring(0,80).replace(/\n/g,'\\n')}"`); this.fileCache.levels.set(name, t); }).catch(e => console.warn('[openGmapText load err]', name, e))
            ));
        }
        const entry = this._buildGmapEntry(text, filename, levelsOverride);
        if (!entry) return;
        this.levels.push(entry);
        this.currentLevelIndex = this.levels.length - 1;
        this.level = entry.level;
        this.undoStack = []; this.redoStack = [];
        this.addLevelTab(this.currentLevelIndex);
        this.loadDefaultTileset();
        this.updateUI();
        this.render();
        this.saveSessionDebounced();
    }

    openFromText(text, name, filePath = null) {
        const ext = name.split('.').pop().toLowerCase();
        if (ext === 'gmap') { this.openGmapText(text, name); return; }
        let level;
        if (ext === 'graal' || ext === 'zelda') { const buf = new TextEncoder().encode(text).buffer; level = Level.loadFromGraal(buf); }
        else level = Level.loadFromNW(text);
        if (!level) return;
        level.tilesetImage = this.level?.tilesetImage || null;
        level.tilesetName = level.tilesetName || 'pics1.png';
        this.levels.push({ level, name, modified: false, filePath });
        this.currentLevelIndex = this.levels.length - 1;
        this.level = level;
        this.undoStack = []; this.redoStack = [];
        this.loadDefaultTileset(); this.addLevelTab(this.currentLevelIndex); this.updateLevelTabs(); this.updateUI(); this.render(); this.saveSessionDebounced();
    }

    openFromBuffer(buffer, name, filePath = null) {
        const level = Level.loadFromGraal(buffer);
        if (!level) return;
        level.tilesetImage = this.level?.tilesetImage || null;
        level.tilesetName = 'pics1.png';
        this.levels.push({ level, name, modified: false, filePath });
        this.currentLevelIndex = this.levels.length - 1;
        this.level = level;
        this.undoStack = []; this.redoStack = [];
        this.loadDefaultTileset(); this.addLevelTab(this.currentLevelIndex); this.updateLevelTabs(); this.updateUI(); this.render(); this.saveSessionDebounced();
    }

    async openDefaultLevelDialog() {
        const dlg = document.getElementById('defaultGaniDialog');
        const container = dlg?.querySelector('.dialog-content');
        if (!dlg || !container) return;
        container.innerHTML = `<div style="color:#888;padding:20px;text-align:center;font-family:chevyray,monospace;font-size:12px;">Loading...</div>`;
        dlg.style.display = 'flex';
        const fallback = ['cave1.zelda','house1.graal','house1.zelda','onlinestartlocal.nw'];
        let files = fallback;
        try {
            if (_isTauri) {
                const entries = await _tauri.fs.readDir('levels').catch(() => null);
                if (entries) files = entries.map(e => e.name).filter(n => n && /\.(nw|zelda|graal|gmap)$/i.test(n));
            } else {
                let r = await fetch('levels/index.json').catch(() => null);
                if (!r?.ok) r = await fetch('levels/').catch(() => null);
                if (r?.ok) { const d = await r.json().catch(() => null); if (Array.isArray(d)) files = d; }
            }
        } catch(e) {}
        container.innerHTML = '';
        files.forEach(fileName => {
            const item = document.createElement('div');
            item.style.cssText = 'padding:12px 16px;cursor:pointer;color:#e0e0e0;font-size:12px;font-family:chevyray,monospace;border-bottom:1px solid #1a1a1a;';
            item.textContent = fileName;
            item.onmouseenter = () => item.style.background = '#353535';
            item.onmouseleave = () => item.style.background = '';
            item.onclick = async () => {
                dlg.style.display = 'none';
                const ext = fileName.split('.').pop().toLowerCase();
                try {
                    if (ext === 'graal' || ext === 'zelda') {
                        const buf = await fetch(`levels/${fileName}`).then(r => r.arrayBuffer());
                        const lvl = Level.loadFromGraal(buf);
                        if (lvl) { lvl.tilesetImage = this.level?.tilesetImage||null; lvl.tilesetName='pics1.png'; this.levels.push({level:lvl,name:fileName,modified:false}); this.currentLevelIndex=this.levels.length-1; this.level=lvl; this.undoStack=[]; this.redoStack=[]; this.loadDefaultTileset(); this.addLevelTab(this.currentLevelIndex); this.updateLevelTabs(); this.updateUI(); this.render(); this.saveSessionDebounced(); }
                    } else {
                        const text = await fetch(`levels/${fileName}`).then(r => r.text());
                        this.openFromText(text, fileName);
                    }
                } catch(e) {}
            };
            container.appendChild(item);
        });
        if (!files.length) container.innerHTML = `<div style="color:#666;padding:20px;text-align:center;font-family:chevyray,monospace;font-size:12px;">No levels found</div>`;
        document.getElementById('defaultGaniCancel').onclick = () => { dlg.style.display = 'none'; };
        dlg.onclick = e => { if (e.target === dlg) dlg.style.display = 'none'; };
    }

    openLevel() {
        const input = document.getElementById('fileInput');
        input.value = '';
        input.click();
        input.onchange = (e) => {
            const files = [...e.target.files];
            if (!files.length) return;
            let loaded = 0;
            const finish = () => { if (++loaded < files.length) return; this.currentLevelIndex = this.levels.length - 1; this.level = this.levels[this.currentLevelIndex].level; this.undoStack = []; this.redoStack = []; this.loadDefaultTileset(); this.updateLevelTabs(); this.updateUI(); this.render(); this.saveSessionDebounced(); };
            files.forEach(file => {
                const ext = file.name.split('.').pop().toLowerCase();
                const reader = new FileReader();
                reader.onload = (event) => {
                    if (ext === 'gmap') {
                        this.openGmapText(event.target.result, file.name);
                    } else if (ext === 'graal' || ext === 'zelda') {
                        const level = Level.loadFromGraal(event.target.result);
                        if (level) { level.tilesetImage = this.level?.tilesetImage || null; level.tilesetName = 'pics1.png'; this.levels.push({ level, name: file.name, modified: false }); this.addLevelTab(this.levels.length - 1); }
                    } else {
                        const level = Level.loadFromNW(event.target.result);
                        level.tilesetImage = this.level?.tilesetImage || null;
                        level.tilesetName = level.tilesetName || 'pics1.png';
                        this.levels.push({ level, name: file.name, modified: false });
                        this.addLevelTab(this.levels.length - 1);
                    }
                    finish();
                };
                if (ext === 'graal' || ext === 'zelda') reader.readAsArrayBuffer(file); else reader.readAsText(file);
            });
        };
    }

    async _downloadFile(filename, content, mime = 'text/plain') {
        if (_isTauri) {
            const path = await _tauri.dialog.save({ defaultPath: filename, title: 'Save File' }).catch(() => null);
            if (!path) return null;
            await this._writeTauriFile(path, content);
            return path;
        }
        const url = URL.createObjectURL(new Blob([content], { type: mime }));
        const a = Object.assign(document.createElement('a'), { href: url, download: filename });
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return null;
    }

    async _writeTauriFile(path, content) {
        if (content instanceof Blob) { const buf = await content.arrayBuffer(); await _tauri.fs.writeBinaryFile(path, new Uint8Array(buf)).catch(() => {}); }
        else if (content instanceof ArrayBuffer) { await _tauri.fs.writeBinaryFile(path, new Uint8Array(content)).catch(() => {}); }
        else { await _tauri.fs.writeTextFile(path, content).catch(() => {}); }
    }

    async saveLevel() {
        const entry = this.levels[this.currentLevelIndex];
        if (entry?.gmapGrid) { this._saveGmap(entry); return; }
        const name = entry?.name || 'level';
        const ext = name.split('.').pop().toLowerCase();
        const isBin = ext === 'graal' || ext === 'zelda';
        if (_isTauri && entry?.filePath) {
            await this._writeTauriFile(entry.filePath, isBin ? this.level.saveToGraal(ext === 'zelda') : this.level.saveToNW());
            if (entry) { entry.modified = false; this.updateLevelTabs(); }
            this.saveSessionDebounced();
            return;
        }
        if (isBin) { const p = await this._downloadFile(name, this.level.saveToGraal(ext === 'zelda'), 'application/octet-stream'); if (p && entry) entry.filePath = p; this.saveSessionDebounced(); return; }
        const filename = name.endsWith('.nw') ? name : name.startsWith('new ') ? null : name + '.nw';
        if (!filename) { this.saveLevelAs(); return; }
        const p = await this._downloadFile(filename, this.level.saveToNW());
        if (p && entry) entry.filePath = p;
        this.saveSessionDebounced();
    }

    async saveLevelAs() {
        const entry = this.levels[this.currentLevelIndex];
        if (entry?.gmapGrid) { this._saveGmap(entry); return; }
        const current = entry?.name || '';
        if (_isTauri) {
            const ext = current.split('.').pop().toLowerCase();
            const isBin = ext === 'graal' || ext === 'zelda';
            const suggested = current || 'level.nw';
            const path = await _tauri.dialog.save({ defaultPath: suggested, title: 'Save As' }).catch(() => null);
            if (!path) return;
            await this._writeTauriFile(path, isBin ? this.level.saveToGraal(ext === 'zelda') : this.level.saveToNW());
            if (entry) { entry.filePath = path; entry.name = path.replace(/\\/g,'/').split('/').pop(); entry.modified = false; this.updateLevelTabs(); }
            this.saveSessionDebounced();
            return;
        }
        const suggested = current.endsWith('.nw') ? current : current.startsWith('new ') ? 'level.nw' : current + '.nw';
        this._promptRename(this.currentLevelIndex, suggested, true);
    }

    _saveGmap(entry) {
        const serialized = this._serializeGmapEntry(entry);
        const changed = Object.entries(serialized.gmapLevels).filter(([k]) => {
            const orig = entry.gmapLevels?.[k];
            return !orig || orig !== serialized.gmapLevels[k];
        });
        const all = Object.entries(serialized.gmapLevels);
        if (!all.length) return;
        const gmapName = entry.name.endsWith('.gmap') ? entry.name : entry.name + '.gmap';

        const box = document.createElement('div');
        box.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#2b2b2b;border:1px solid #404040;padding:16px 20px;z-index:99999;min-width:280px;font-size:13px;color:#e0e0e0;'; box.classList.add('ed-dialog-box');
        box.innerHTML = `<div class="ed-dlg-title">Save GMAP: ${gmapName}</div>
            <div style="margin-bottom:12px;">${changed.length} level(s) changed of ${all.length} total.</div>
            <div style="display:flex;gap:8px;justify-content:flex-end;">
              <button id="_gmSaveAll" style="padding:4px 10px;">Save All (ZIP)</button>
              <button id="_gmSaveChanged" style="padding:4px 10px;"${changed.length ? '' : ' disabled'}>Save Changed (ZIP)</button>
              <button id="_gmCancel" style="padding:4px 10px;">Cancel</button>
            </div>`;
        document.body.appendChild(box);
        const close = () => box.remove();
        box._closeModal = close;
        document.getElementById('_gmCancel').onclick = close;
        const doSave = async (subset) => {
            close();
            const { default: JSZip } = await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm');
            const zip = new JSZip();
            for (const [name, text] of subset) zip.file(name, text);
            zip.file(gmapName, entry.gmapText);
            const blob = await zip.generateAsync({ type: 'blob' });
            this._downloadFile(gmapName.replace('.gmap', '.zip'), blob, 'application/zip');
            this.saveSessionDebounced();
        };
        document.getElementById('_gmSaveAll').onclick = () => doSave(all);
        document.getElementById('_gmSaveChanged').onclick = () => doSave(changed);
    }

    _promptRename(index, currentName, andSave = false) {
        const entry = this.levels[index];
        if (!entry) return;
        const box = document.createElement('div');
        box.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#2b2b2b;border:1px solid #404040;padding:14px 18px;z-index:99999;min-width:260px;font-size:13px;color:#e0e0e0;'; box.classList.add('ed-dialog-box');
        box.innerHTML = `<div class="ed-dlg-title">${andSave ? 'Save As' : 'Rename Level'}</div>
            <input id="_renameInput" value="${currentName}" style="width:100%;box-sizing:border-box;background:#1a1a1a;color:#e0e0e0;border:1px solid #404040;padding:4px 6px;margin-bottom:10px;font-family:inherit;">
            <div style="display:flex;gap:8px;justify-content:flex-end;">
              <button id="_renameOk" style="padding:4px 10px;">${andSave ? 'Save' : 'Rename'}</button>
              <button id="_renameCancel" style="padding:4px 10px;">Cancel</button>
            </div>`;
        document.body.appendChild(box);
        const inp = document.getElementById('_renameInput');
        inp.focus(); inp.select();
        const close = () => box.remove();
        box._closeModal = close;
        document.getElementById('_renameCancel').onclick = close;
        const confirm = () => {
            let name = inp.value.trim();
            if (!name) return;
            if (andSave && !name.endsWith('.nw') && !name.endsWith('.gmap') && !name.endsWith('.graal') && !name.endsWith('.zelda')) name += '.nw';
            entry.name = name;
            this.updateLevelTabs();
            close();
            if (andSave) { const _ext = name.split('.').pop().toLowerCase(); if (_ext === 'graal' || _ext === 'zelda') { this._downloadFile(name, entry.level.saveToGraal(_ext === 'zelda'), 'application/octet-stream'); } else { this._downloadFile(name, entry.level.saveToNW()); } this.saveSessionDebounced(); }
        };
        document.getElementById('_renameOk').onclick = confirm;
        inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') confirm(); if (e.key === 'Escape') close(); });
    }

    _showTabContextMenu(e, index) {
        document.querySelectorAll('._tabCtx').forEach(el => el.remove());
        const menu = document.createElement('div');
        menu.className = '_tabCtx ed-dialog-box';
        menu.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;background:#2b2b2b;border:1px solid #404040;z-index:99999;min-width:140px;font-size:13px;`;
        const item = (label, fn) => {
            const d = document.createElement('div');
            d.textContent = label;
            d.style.cssText = 'padding:6px 12px;cursor:pointer;color:#e0e0e0;';
            d.onmouseenter = () => d.style.background = '#404040';
            d.onmouseleave = () => d.style.background = '';
            d.onclick = () => { menu.remove(); fn(); };
            menu.appendChild(d);
        };
        item('Rename', () => this._promptRename(index, this.levels[index].name, false));
        item('Save As...', () => this._promptRename(index, this.levels[index].name, true));
        item('Close', () => this.closeLevelTab(index));
        if (index > 0) item('Close tabs to the left', () => this._closeTabsRange(0, index));
        if (index < this.levels.length - 1) item('Close tabs to the right', () => this._closeTabsRange(index + 1, this.levels.length));
        document.body.appendChild(menu);
        const dismiss = (ev) => { if (!menu.contains(ev.target)) { menu.remove(); document.removeEventListener('mousedown', dismiss); } };
        setTimeout(() => document.addEventListener('mousedown', dismiss), 0);
    }

    resizeLevel() {
        const width = parseInt(document.getElementById('levelWidth').value);
        const height = parseInt(document.getElementById('levelHeight').value);
        if (width > 0 && height > 0) {
            this.level.resize(width, height);
            this.render();
        }
    }

    clearCurrentLayer() {
        this.pushUndo();
        this.level.clearLayer(this.currentLayer);
        this.render();
    }

    refreshLayerPanel() {
        const list = document.getElementById('layersList');
        if (!list || !this.level) return;
        const isBinary = this.level._sourceFormat === 'graal' || this.level._sourceFormat === 'zelda';
        const addBtn = document.getElementById('btnAddLayer'), delBtn = document.getElementById('btnDeleteLayer');
        if (addBtn) addBtn.disabled = isBinary;
        if (delBtn) delBtn.disabled = isBinary;
        if (isBinary) { list.innerHTML = ''; return; }
        const layers = this.level.layers;
        list.innerHTML = '';
        const _sc = this._schemeColors;
        const _rowBg = _sc ? _sc.panel : '#2b2b2b', _rowBorder = _sc ? _sc.border : '#1a1a1a';
        const _activeBg = _sc ? (_sc.bg || '#1e3a5f') : '#1e3a5f';
        const _btnBg = _sc ? (_sc.button || _sc.hover || '#353535') : '#353535';
        const _txt = _sc ? _sc.text : '#e0e0e0';
        layers.forEach((layer, i) => {
            const isActive = i === this.currentLayer;
            const row = document.createElement('div');
            row.dataset.layerIdx = i;
            row.draggable = true;
            row.style.cssText = `display:flex;align-items:center;gap:6px;padding:5px 6px;background:${isActive?'#1e3a5f':_rowBg};border:1px solid ${isActive?'#4472C4':_rowBorder};cursor:pointer;user-select:none;border-radius:2px;`;
            const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = layer.visible !== false; cb.style.cssText = 'cursor:pointer;flex-shrink:0;'; cb.addEventListener('change', e => { e.stopPropagation(); layer.visible = cb.checked; this.render(); });
            const thumb = document.createElement('canvas'); thumb.width = 56; thumb.height = 56; thumb.style.cssText = `flex-shrink:0;image-rendering:pixelated;background:${_rowBg};border:1px solid ${_rowBorder};`;
            this._renderLayerThumb(thumb, i);
            const name = document.createElement('span'); name.style.cssText = `flex:1;font-size:12px;font-family:chevyray,monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:${_txt};`; name.textContent = `Layer ${i}`;
            const btnWrap = document.createElement('div'); btnWrap.style.cssText = 'display:flex;flex-direction:column;gap:2px;flex-shrink:0;';
            const mkBtn = (icon, title, fn) => { const b = document.createElement('button'); b.innerHTML = `<i class="fas ${icon}"></i>`; b.title = title; b.style.cssText = `background:${_btnBg};border:1px solid ${_rowBorder};color:${_txt};padding:0;cursor:pointer;width:22px;height:20px;display:flex;align-items:center;justify-content:center;font-size:10px;`; b.addEventListener('click', e => { e.stopPropagation(); fn(); }); return b; };
            const btnUp = mkBtn('fa-chevron-up', 'Move Up', () => this.moveLayer(i, i - 1));
            const btnDown = mkBtn('fa-chevron-down', 'Move Down', () => this.moveLayer(i, i + 1));
            if (i === 0) btnUp.disabled = true;
            if (i === layers.length - 1) btnDown.disabled = true;
            btnWrap.append(btnUp, btnDown);
            row.append(cb, thumb, name, btnWrap);
            row.addEventListener('click', () => { this.setCurrentLayer(i); this.refreshLayerPanel(); const ls = document.getElementById('layerSpinbox'); if (ls) ls.value = this.currentLayer; });
            row.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', String(i)); row.style.opacity = '0.4'; });
            row.addEventListener('dragend', () => { row.style.opacity = '1'; list.querySelectorAll('[data-layer-idx]').forEach(r => r.style.outline = ''); });
            row.addEventListener('dragover', e => { e.preventDefault(); row.style.outline = '2px solid #4a9eff'; });
            row.addEventListener('dragleave', () => { row.style.outline = ''; });
            row.addEventListener('drop', e => { e.preventDefault(); row.style.outline = ''; const from = parseInt(e.dataTransfer.getData('text/plain')); if (!isNaN(from) && from !== i) this.moveLayer(from, i); });
            list.appendChild(row);
        });
    }

    _renderLayerThumb(canvas, layerIndex) {
        if (!this.level?.tilesetImage?.complete || !this.level.tilesetImage.naturalWidth) return;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#1a1a1a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        const layer = this.level.layers[layerIndex];
        if (!layer) return;
        const tw = this.level.tileWidth || 16, th = this.level.tileHeight || 16;
        const scale = Math.min(canvas.width / (this.level.width * tw), canvas.height / (this.level.height * th));
        const tilesPerRow = Math.floor(this.level.tilesetImage.width / tw);
        for (let y = 0; y < this.level.height; y++) {
            for (let x = 0; x < this.level.width; x++) {
                const ti = layer.tiles[y * this.level.width + x];
                const di = ti < 0 ? (layerIndex === 0 ? 0 : -1) : ti;
                if (di < 0) continue;
                ctx.drawImage(this.level.tilesetImage, (di % tilesPerRow) * tw, Math.floor(di / tilesPerRow) * th, tw, th, x * tw * scale, y * th * scale, tw * scale, th * scale);
            }
        }
    }

    addLayer() {
        if (!this.level || this.level.layers.length >= 8) return;
        this.level.layers.push(this.level.createEmptyLayer());
        const ls = document.getElementById('layerSpinbox'); if (ls) ls.max = this.level.layers.length - 1;
        this.refreshLayerPanel();
        this.saveSessionDebounced?.();
    }

    deleteLayer(idx) {
        if (!this.level || this.level.layers.length <= 1) return;
        if (idx == null) idx = this.currentLayer;
        this.level.layers.splice(idx, 1);
        if (this.currentLayer >= this.level.layers.length) this.currentLayer = this.level.layers.length - 1;
        const ls = document.getElementById('layerSpinbox'); if (ls) { ls.max = this.level.layers.length - 1; ls.value = this.currentLayer; }
        this.refreshLayerPanel();
        this.render();
        this.saveSessionDebounced?.();
    }

    moveLayer(from, to) {
        if (!this.level) return;
        const layers = this.level.layers;
        if (to < 0 || to >= layers.length || from === to) return;
        const moved = layers.splice(from, 1)[0];
        layers.splice(to, 0, moved);
        if (this.currentLayer === from) this.currentLayer = to;
        else if (from < this.currentLayer && to >= this.currentLayer) this.currentLayer--;
        else if (from > this.currentLayer && to <= this.currentLayer) this.currentLayer++;
        const ls = document.getElementById('layerSpinbox'); if (ls) ls.value = this.currentLayer;
        this.refreshLayerPanel();
        this.render();
        this.saveSessionDebounced?.();
    }

    setCurrentLayer(layer) {
        this.currentLayer = Math.max(0, Math.min((this.level?.layers.length ?? 3) - 1, layer));
        this.selectionStartX = this.selectionStartY = this.selectionEndX = this.selectionEndY = -1;
        this.selectedObject = null;
        this.render();
    }

    showLoadingMessage(message) {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:99998;';
        const div = document.createElement('div');
        div.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;user-select:none;z-index:99999;display:flex;align-items:center;justify-content:center;gap:20px;font-size:24px;font-weight:bold;text-shadow:1px 1px 1px rgba(0,0,255,1);';
        const img = document.createElement('img');
        img.src = 'favicon.ico'; img.className = 'loading-favicon'; img.style.cssText = 'width:32px;height:32px;';
        const span = document.createElement('span');
        span.textContent = message;
        div.appendChild(img); div.appendChild(span);
        document.body.appendChild(overlay); document.body.appendChild(div);
        return { update: (m) => { span.textContent = m; }, close: () => { overlay.remove(); div.remove(); } };
    }

    toggleGrid() {
        this.showGrid = !this.showGrid;
        localStorage.setItem('levelEditor_showGrid', this.showGrid);
        this.render();
    }

    toggleSnapGrid() {
        this.snapGrid = !this.snapGrid;
        const btn = document.getElementById('btnSnapGrid');
        if (btn) btn.classList.toggle('active', this.snapGrid);
    }

    loadChangelog() {
        const el = document.getElementById('changelogContent');
        if (!el || el.dataset.loaded) return;
        fetch('changelog.json').then(r => r.json()).then(data => {
            el.dataset.loaded = '1';
            const tagColors = { 'GraalSuite':'#c792ea','Level Editor':'#4a9eff','Gani Editor':'#56d364','Gmap Generator':'#ffa657','Setshape2':'#ff7b72' };
            el.innerHTML = data.map(entry => {
                const tc = tagColors[entry.tag] || '#888';
                return `<p style="color:#569cd6;font-weight:bold;margin:0 0 4px">${entry.version} <span style="color:${tc};font-size:11px;">(${entry.tag})</span> <span style="color:#666;font-weight:normal;font-size:11px;">&mdash; ${entry.date}</span></p>
                <ul style="margin:0 0 14px 16px;padding:0;">${entry.changes.map(c => `<li>${c}</li>`).join('')}</ul>`;
            }).join('');
        }).catch(() => { el.textContent = 'Failed to load changelog.'; });
    }

    getViewCenterTile() {
        const tw = this.level.tileWidth || 16, th = this.level.tileHeight || 16;
        const cx = (this.canvas.width / 2 - Math.floor(this.panX)) / (tw * this.zoom);
        const cy = (this.canvas.height / 2 - Math.floor(this.panY)) / (th * this.zoom);
        return { x: Math.max(0, Math.min(this.level.width - 1, Math.floor(cx))), y: Math.max(0, Math.min(this.level.height - 1, Math.floor(cy))) };
    }

    centerView() {
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        const levelWidth = this.level.width * (this.level.tileWidth || 16) * this.zoom;
        const levelHeight = this.level.height * (this.level.tileHeight || 16) * this.zoom;

        this.panX = (canvasWidth - levelWidth) / 2;
        this.panY = (canvasHeight - levelHeight) / 2;
        this.render();
    }

    setTool(tool) {
        this.currentTool = tool;
        const map = { select:'btnSelect', draw:'btnDraw', eraser:'btnEraserTool' };
        document.querySelectorAll('.tool-button:not(#btnFillTool)').forEach(b => b.classList.remove('active'));
        const btn = document.getElementById(map[tool]);
        if (btn) btn.classList.add('active');
        if (tool !== 'draw') {
            this.floodFillEnabled = false;
            const fill = document.getElementById('btnFillTool');
            if (fill) fill.classList.remove('active');
        }
        if (tool === 'draw' || tool === 'eraser') {
            if (this._floatingStamp && this.selectionTiles) this._commitFloatingStamp();
            this.selectionStartX = -1; this.selectionStartY = -1;
            this.selectionEndX = -1; this.selectionEndY = -1;
            this.selectionTiles = null; this.resizeOrigTiles = null; this._floatingStamp = false; this._floatingStampCanvas = false; this._stampTilesLifted = false;
            this.isMovingSelection = false; this.isResizingSelection = false;
            this.requestRender();
        }
    }

    updateUI() {
        if (!this.level) return;
        const lw = document.getElementById('levelWidth'); if (lw) lw.value = this.level.width;
        const lh = document.getElementById('levelHeight'); if (lh) lh.value = this.level.height;
        const tn = document.getElementById('tilesetName'); if (tn) tn.value = this.level.tilesetName;
        [0,1,2].forEach(i => { const cb = document.getElementById(`visLayer${i}`); if (cb && this.level.layers[i]) cb.checked = this.level.layers[i].visible !== false; });
        const ls = document.getElementById('layerSpinbox');
        if (ls) ls.value = this.currentLayer;
        const isNw = !this.level._sourceFormat || this.level._sourceFormat === 'nw';
        ['layerSpinbox','btnLayerUp','btnLayerDown','btnFadeLayers'].forEach(id => { const el = document.getElementById(id); if (el) el.disabled = !isNw; });
        ['visLayer1','visLayer2'].forEach(id => { const el = document.getElementById(id); if (el) el.disabled = !isNw; });
        const layersTabEl = document.querySelector('.right-tabs .tab[data-tab="layers"]');
        if (layersTabEl) { layersTabEl.style.opacity = isNw ? '' : '0.4'; layersTabEl.style.pointerEvents = isNw ? '' : 'none'; layersTabEl.title = isNw ? '' : 'Layers not supported for this format'; }
        this.updateSelectedTileDisplay();
        this.updateZoomDisplay();
        const ls2 = document.getElementById('layerSpinbox');
        if (ls2) ls2.max = this.level.layers.length - 1;
        this.refreshLayerPanel();
    }

    updateMouseCoords(x, y, source = 'canvas') {
        const coordsSpan = document.getElementById('mouseCoords');
        coordsSpan.textContent = `Mouse: ${x}, ${y}`;
        const tileSpan = document.getElementById('selectedTile');
        if (source === 'canvas' && x >= 0 && x < this.level.width && y >= 0 && y < this.level.height) {
            const rawIndex = this.level.getTile(this.currentLayer, x, y);
            const tileIndex = rawIndex < 0 ? 0 : rawIndex;
            if (tileIndex < 0) {
                tileSpan.textContent = 'Tile: empty';
            } else {
                const tilesPerRow = this.level.tilesetImage ? Math.floor(this.level.tilesetImage.width / (this.level.tileWidth || 16)) : 128;
                const tx = tileIndex % tilesPerRow, ty = Math.floor(tileIndex / tilesPerRow);
                tileSpan.textContent = `Tile: ${tileIndex} (${tx},${ty})`;
            }
        } else if (source === 'tileset' && x >= 0 && y >= 0) {
            const tilesPerRow = Math.floor(this.level.tilesetImage.width / (this.level.tileWidth || 16));
            const tileIndex = y * tilesPerRow + x;
            tileSpan.textContent = `Tile: ${tileIndex} (${x},${y})`;
        }
    }

    updateSelectionInfo() {
        const hasSel = this.hasSelection();
        document.getElementById('btnNewLink').disabled = !hasSel;
        document.getElementById('btnNewSign').disabled = !hasSel;
        const wEl = document.getElementById('brushWidth');
        const hEl = document.getElementById('brushHeight');
        if (this.selectionStartX < 0 || this.selectionEndX < 0) {
            if (wEl) { wEl.value = ''; wEl.disabled = true; }
            if (hEl) { hEl.value = ''; hEl.disabled = true; }
            return;
        }
        const startX = Math.min(this.selectionStartX, this.selectionEndX);
        const startY = Math.min(this.selectionStartY, this.selectionEndY);
        const endX = Math.max(this.selectionStartX, this.selectionEndX);
        const endY = Math.max(this.selectionStartY, this.selectionEndY);
        const width = endX - startX + 1, height = endY - startY + 1;
        if (wEl) { wEl.value = width; wEl.disabled = false; }
        if (hEl) { hEl.value = height; hEl.disabled = false; }
        const selectionSpan = document.getElementById('selectionInfo');
        selectionSpan.textContent = `Selection: (${startX}, ${startY}) -> (${endX}, ${endY}) = (${width}, ${height})`;
    }

    updateSelectedTileDisplay() {
    }


    updateSelectedTileCanvas() {
        const canvas = document.getElementById('selectedTileCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = false;

        if (!this.level || !this.level.tilesetImage) {
            this.updateTilesetDisplay();
            return;
        }

        if (this.defaultTile < 0) this.defaultTile = 0;

        const isImageLoaded = this.level.tilesetImage.complete !== undefined ? this.level.tilesetImage.complete : true;
        if (isImageLoaded) {
            try {
                const tileWidth = this.level.tileWidth || 16;
                const tileHeight = this.level.tileHeight || 16;
                const coords = this.level.getTilesetCoords(this.defaultTile);
                if (coords && this.level.tilesetImage.width > 0 && this.level.tilesetImage.height > 0) {
                    ctx.drawImage(
                        this.level.tilesetImage,
                        coords.x, coords.y, tileWidth, tileHeight,
                        0, 0, canvas.width, canvas.height
                    );
                }
            } catch (e) {
                console.error('Error drawing default tile:', e);
            }
        }

        this.updateTilesetDisplay();
    }

    captureTilesetSelection() {
        if (this.tilesetSelectionStartX < 0 || this.tilesetSelectionEndX < 0) {
            this.selectedTilesetTiles = null;
            return;
        }
        const startX = Math.min(this.tilesetSelectionStartX, this.tilesetSelectionEndX);
        const startY = Math.min(this.tilesetSelectionStartY, this.tilesetSelectionEndY);
        const endX = Math.max(this.tilesetSelectionStartX, this.tilesetSelectionEndX);
        const endY = Math.max(this.tilesetSelectionStartY, this.tilesetSelectionEndY);
        const width = endX - startX + 1;
        const height = endY - startY + 1;
        const tilesPerRow = Math.floor(this.level.tilesetImage.width / (this.level.tileWidth || 16));
        this.selectedTilesetTiles = [];
        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                const tx = startX + x;
                const ty = startY + y;
                const tileIndex = ty * tilesPerRow + tx;
                row.push(tileIndex);
            }
            this.selectedTilesetTiles.push(row);
        }
        this.updateSelectedTileDisplay();
    }

    tilesetOrder() {
        const dlg = document.getElementById('tilesetOrderDialog');
        if (!dlg) return;
        dlg.style.display = 'flex';
        this._refreshTilesetOrderList();
        this._makeDialogDraggable(dlg, dlg.querySelector('div'), document.getElementById('tilesetOrderTitlebar'));
    }

    _refreshTilesetOrderList() {
        const list = document.getElementById('tilesetOrderListBox');
        const combo = document.getElementById('tilesetsCombo');
        if (!list || !combo) return;
        const options = [...combo.options].map(o => o.value);
        const selected = combo.value;
        list.innerHTML = options.map(name =>
            `<div data-ts="${name}" style="padding:4px 10px;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background:${name === selected ? '#2a4a6a' : 'transparent'};color:${name === selected ? '#fff' : '#ccc'};" onclick="document.getElementById('tilesetsCombo').value='${name}';window._editor.selectTileset('${name}');window._editor._refreshTilesetOrderList();">${name}</div>`
        ).join('');
    }

    tilesetMoveUp() {
        const combo = document.getElementById('tilesetsCombo');
        if (!combo) return;
        const idx = combo.selectedIndex;
        if (idx <= 0) return;
        const opts = [...combo.options];
        combo.insertBefore(opts[idx], opts[idx - 1]);
        combo.selectedIndex = idx - 1;
        this._refreshTilesetOrderList();
    }

    tilesetMoveDown() {
        const combo = document.getElementById('tilesetsCombo');
        if (!combo) return;
        const idx = combo.selectedIndex;
        if (idx < 0 || idx >= combo.options.length - 1) return;
        const opts = [...combo.options];
        combo.insertBefore(opts[idx + 1], opts[idx]);
        combo.selectedIndex = idx + 1;
        this._refreshTilesetOrderList();
    }

    deleteEdgeLinks() {
        this.pushUndo();
        const w = this.level.width - 1, h = this.level.height - 1;
        this.level.objects = this.level.objects.filter(o => {
            if (o.type !== 'link') return true;
            return o.x > 0 && o.y > 0 && o.x < w && o.y < h;
        });
        this.render();
        this.saveSessionDebounced();
    }

    trimScriptEndings() {
        this.pushUndo();
        this.level.objects.forEach(o => { if (o.properties?.code) o.properties.code = o.properties.code.replace(/\s+$/, ''); });
        this.saveSessionDebounced();
    }

    trimSignEndings() {
        this.pushUndo();
        this.level.objects.forEach(o => { if (o.type === 'sign' && o.properties?.text) o.properties.text = o.properties.text.replace(/\s+$/, ''); });
        this.saveSessionDebounced();
    }

    generateScreenshot() {
        const box = document.createElement('div');
        box.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;';
        const opts = [
            ['ssNPCs',      'Show NPCs / Baddies', true],
            ['ssChars',     'Show Characters',      true],
            ['ssSigns',     'Show Signs',           false],
            ['ssLinks',     'Show Links',           false],
            ['ssChests',    'Show Chests',          true],
        ];
        box.innerHTML = `<div class="ed-dialog-box" style="background:var(--dialog-bg,#2b2b2b);border:2px solid #555;padding:20px 24px;min-width:240px;font-family:chevyray,monospace;font-size:12px;color:#e0e0e0;">
            <div class="ed-dlg-title">Screenshot Options</div>
            <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">
                ${opts.map(([id,lbl,def]) => `<label style="display:flex;align-items:center;gap:8px;cursor:pointer;"><input type="checkbox" id="${id}" ${def?'checked':''}> ${lbl}</label>`).join('')}
            </div>
            <div style="display:flex;gap:10px;justify-content:flex-end;">
                <button id="_ssOk" style="padding:6px 18px;cursor:pointer;font-family:chevyray,monospace;font-size:12px;">Save</button>
                <button id="_ssCancel" style="padding:6px 18px;cursor:pointer;font-family:chevyray,monospace;font-size:12px;">Cancel</button>
            </div></div>`;
        document.body.appendChild(box);
        box.querySelector('#_ssCancel').onclick = () => box.remove();
        box.querySelector('#_ssOk').onclick = () => {
            const o = {};
            opts.forEach(([id]) => o[id] = box.querySelector(`#${id}`).checked);
            box.remove();
            this._doScreenshot(o);
        };
    }

    _doScreenshot(o) {
        const tmpCanvas = document.createElement('canvas');
        tmpCanvas.width = this.level.width * (this.level.tileWidth || 16);
        tmpCanvas.height = this.level.height * (this.level.tileHeight || 16);
        const tmpCtx = tmpCanvas.getContext('2d');
        tmpCtx.imageSmoothingEnabled = false;
        const savedCtx = this.ctx, savedCanvas = this.canvas, savedPanX = this.panX, savedPanY = this.panY, savedZoom = this.zoom;
        this.ctx = tmpCtx; this.canvas = tmpCanvas; this.panX = 0; this.panY = 0; this.zoom = 1;
        tmpCtx.fillStyle = '#000'; tmpCtx.fillRect(0, 0, tmpCanvas.width, tmpCanvas.height);
        for (let layer = 0; layer < this.level.layers.length; layer++) this.drawLayer(layer);
        this._screenshotMode = true; this._ssOpts = o; this.drawObjects(); this._screenshotMode = false; this._ssOpts = null;
        this.ctx = savedCtx; this.canvas = savedCanvas; this.panX = savedPanX; this.panY = savedPanY; this.zoom = savedZoom;
        const filename = (this.levels[this.currentLevelIndex]?.name || 'level') + '.png';
        if (_isTauri) {
            tmpCanvas.toBlob(async blob => {
                const buf = await blob.arrayBuffer();
                const path = await _tauri.dialog.save({ defaultPath: filename, filters: [{ name: 'PNG', extensions: ['png'] }] });
                if (path) await _tauri.fs.writeBinaryFile(path, new Uint8Array(buf));
            }, 'image/png');
        } else {
            const a = document.createElement('a');
            a.href = tmpCanvas.toDataURL('image/png');
            a.download = filename;
            a.click();
        }
    }

    selectTileset(tilesetName) {
        this.level.tilesetName = tilesetName;
        this.loadTilesetImage(tilesetName);
    }

    refreshTileset() {
        this.loadTilesetImage(this.level.tilesetName);
    }

    newTileset() {
        console.log('New tileset clicked');
    }

    deleteTileset() {
        const combo = document.getElementById('tilesetsCombo');
        if (!combo || !combo.value) return;
        const name = combo.value;
        if (/^(pics1|zlttp)\.(png|gif)$/i.test(name)) return;
        if (this._tilesetDataCache) { delete this._tilesetDataCache[name]; try { localStorage.setItem('levelEditor_tilesetCache', JSON.stringify(this._tilesetDataCache)); } catch(e) {} }
        const opt = [...combo.options].find(o => o.value === name);
        if (opt) opt.remove();
        if (combo.options.length > 0) { combo.value = combo.options[0].value; this.selectTileset(combo.options[0].value); }
        this._refreshTilesetOrderList?.();
    }

    editTileset() {
        if (!this.level) return;
        if (!this.level._tiledefs) this.level._tiledefs = [];
        let sel = -1, selNpc = -1;
        const bs = 'background:#2b2b2b;border:1px solid #0a0a0a;border-top:1px solid #404040;border-left:1px solid #404040;color:#e0e0e0;padding:4px 14px;cursor:pointer;font-family:chevyray,monospace;font-size:12px;';
        const inS = 'background:#1a1a1a;border:1px solid #404040;color:#e0e0e0;padding:3px 6px;font-family:chevyray,monospace;font-size:12px;box-sizing:border-box;';
        const dialog = document.createElement('div');
        dialog.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:99999;display:flex;align-items:center;justify-content:center;';
        const box = document.createElement('div');
        box.className = 'ed-dialog-box';
        box.style.cssText = 'width:560px;max-width:95vw;background:var(--dialog-bg,#2b2b2b);border:2px solid #1a1a1a;color:#e0e0e0;font-family:chevyray,monospace;font-size:12px;display:flex;flex-direction:column;';
        box.innerHTML = `<div class="dialog-titlebar" style="padding:8px 12px;display:flex;align-items:center;gap:8px;flex-shrink:0;"><i class="fas fa-th" style="font-size:13px;"></i><span style="font-size:13px;">Tile Definitions</span></div>
            <table style="width:100%;border-collapse:collapse;font-size:11px;flex-shrink:0;"><thead><tr style="background:#222;color:#888;"><th style="padding:4px 8px;text-align:center;border-bottom:1px solid #1a1a1a;width:48px;">Visible</th><th style="padding:4px 8px;text-align:left;border-bottom:1px solid #1a1a1a;">Image</th><th style="padding:4px 8px;text-align:left;border-bottom:1px solid #1a1a1a;">Prefix</th><th style="padding:4px 8px;text-align:left;border-bottom:1px solid #1a1a1a;width:70px;">Type</th><th style="padding:4px 8px;text-align:center;border-bottom:1px solid #1a1a1a;width:36px;">X</th><th style="padding:4px 8px;text-align:center;border-bottom:1px solid #1a1a1a;width:36px;">Y</th></tr></thead></table>
            <div id="_tdBody" style="height:220px;overflow-y:auto;border-bottom:1px solid #1a1a1a;"></div>
            <div style="padding:8px 12px;background:#353535;border-top:1px solid #0a0a0a;display:flex;gap:6px;flex-shrink:0;">
                <button id="_tdAdd" style="${bs}">Add</button><button id="_tdEdit" style="${bs}">Edit</button><button id="_tdImport" style="${bs}">Import</button><button id="_tdExport" style="${bs}">Export</button><button id="_tdDelete" style="${bs}">Delete</button>
                <button id="_tdClose" style="${bs}margin-left:auto;">Close</button>
            </div>`;
        dialog.appendChild(box);
        document.body.appendChild(dialog);

        const getNpcDefs = () => {
            const levelName = (this.levels[this.currentLevelIndex]?.name || '').toLowerCase().replace(/\.nw$/i, '');
            const out = [];
            for (const obj of this.level.objects) {
                if (obj.type !== 'npc') continue;
                const sp = parseNPCScript(obj.properties?.code || '');
                for (const td of (sp.tiledefs || [])) { const ls = td.levelstart.toLowerCase().replace(/\.nw$/i,''); const isSelf=['this.level','this.level.name','this.gmap','this.gmap.name'].includes(ls); if (isSelf||levelName.startsWith(ls)) out.push({img:td.img,levelstart:td.levelstart,type:0,x:'-',y:'-'}); }
                for (const td of (sp.tiledefs2 || [])) { const ls = td.levelstart.toLowerCase().replace(/\.nw$/i,''); if (!ls||levelName.startsWith(ls)) out.push({img:td.img,levelstart:td.levelstart,type:2,x:td.x,y:td.y}); }
            }
            return out;
        };
        const render = () => {
            const tbody = box.querySelector('#_tdBody');
            const managed = this.level._tiledefs;
            const npc = getNpcDefs();
            if (!managed.length && !npc.length) { tbody.innerHTML = '<div style="padding:12px;color:#555;text-align:center;font-size:11px;">No tile definitions. Click Add to create one.</div>'; return; }
            const t = document.createElement('table');
            t.style.cssText = 'width:100%;border-collapse:collapse;font-size:11px;';
            managed.forEach((td, i) => {
                const tr = document.createElement('tr');
                tr.style.cssText = `border-bottom:1px solid #1a1a1a;cursor:pointer;${i===sel?'background:#3a4a5a;':''}`;
                tr.innerHTML = `<td style="padding:3px 8px;text-align:center;width:48px;"><input type="checkbox" ${td.visible!==false?'checked':''}></td><td style="padding:3px 8px;">${td.img}</td><td style="padding:3px 8px;color:#aaa;">${td.levelstart||''}</td><td style="padding:3px 8px;width:70px;">${td.type===2?'Overlay':'Default'}</td><td style="padding:3px 8px;text-align:center;width:36px;">${td.type===2?td.x:'-'}</td><td style="padding:3px 8px;text-align:center;width:36px;">${td.type===2?td.y:'-'}</td>`;
                tr.querySelector('input').onchange = e => { td.visible = e.target.checked; this.applyTiledefFromNPCs(); };
                tr.onclick = e => { if (e.target.type==='checkbox') return; sel = i; selNpc = -1; render(); };
                tr.ondblclick = () => { sel = i; selNpc = -1; openEdit(i); };
                t.appendChild(tr);
            });
            npc.forEach((td, i) => {
                const tr = document.createElement('tr');
                tr.style.cssText = `border-bottom:1px solid #1a1a1a;cursor:pointer;opacity:${i===selNpc?1:0.65};${i===selNpc?'background:#3a4a5a;':''}`;
                tr.title = 'Defined in NPC script — double-click to create managed copy';
                tr.innerHTML = `<td style="padding:3px 8px;text-align:center;width:48px;color:#888;">NPC</td><td style="padding:3px 8px;">${td.img}</td><td style="padding:3px 8px;color:#aaa;">${td.levelstart||''}</td><td style="padding:3px 8px;width:70px;">${td.type===2?'Overlay':'Default'}</td><td style="padding:3px 8px;text-align:center;width:36px;">${td.type===2?td.x:'-'}</td><td style="padding:3px 8px;text-align:center;width:36px;">${td.type===2?td.y:'-'}</td>`;
                tr.onclick = () => { selNpc = i; sel = -1; render(); };
                tr.ondblclick = () => { selNpc = i; sel = -1; openEdit(-1, td); };
                t.appendChild(tr);
            });
            tbody.innerHTML = ''; tbody.appendChild(t);
        };

        const openEdit = (idx, prefill) => {
            const existing = idx >= 0 ? this.level._tiledefs[idx] : null;
            const td = existing ? { ...existing } : (prefill ? { ...prefill, visible: true } : { img: '', levelstart: '', type: 0, x: 0, y: 0, visible: true });
            const ed = document.createElement('div');
            ed.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:100000;display:flex;align-items:center;justify-content:center;';
            const eb = document.createElement('div');
            eb.className = 'ed-dialog-box';
            eb.style.cssText = 'width:440px;background:var(--dialog-bg,#2b2b2b);border:2px solid #1a1a1a;color:#e0e0e0;font-family:chevyray,monospace;font-size:12px;padding:16px;';
            eb.innerHTML = `<div style="font-size:13px;margin-bottom:14px;padding-bottom:8px;border-bottom:1px solid #404040;">Edit Tile Definition</div>
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;"><span style="min-width:52px;color:#aaa;">Image:</span><input id="_edImg" value="${td.img}" style="${inS}flex:1;"><button id="_edBrowse" style="${bs}padding:3px 8px;">Browse</button></div>
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;"><span style="min-width:52px;color:#aaa;">Prefix:</span><input id="_edPfx" value="${td.levelstart||''}" style="${inS}flex:1;"></div>
                <fieldset style="border:1px solid #404040;padding:10px;margin-bottom:14px;">
                    <legend style="color:#888;font-size:11px;padding:0 4px;">Definition Attributes</legend>
                    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                        <span style="color:#aaa;">Type:</span>
                        <select id="_edType" style="${inS}"><option value="0" ${td.type===0?'selected':''}>0 - Default Style</option><option value="2" ${td.type===2?'selected':''}>2 - Overlay</option></select>
                        <span style="color:#aaa;">X:</span><input id="_edX" type="number" value="${td.x||0}" style="${inS}width:50px;">
                        <span style="color:#aaa;">Y:</span><input id="_edY" type="number" value="${td.y||0}" style="${inS}width:50px;">
                    </div>
                </fieldset>
                <div style="display:flex;justify-content:flex-end;gap:8px;"><button id="_edOk" style="${bs}">OK</button><button id="_edCancel" style="${bs}">Cancel</button></div>`;
            ed.appendChild(eb); document.body.appendChild(ed);
            const closeEd = () => document.body.removeChild(ed);
            eb.querySelector('#_edCancel').onclick = closeEd;
            eb.querySelector('#_edBrowse').onclick = () => {
                const imgs = [...(this.fileCache?.images?.keys() || [])].filter(k => /\.(png|gif|bmp|jpg|jpeg|mng)$/i.test(k)).sort();
                if (!imgs.length) return;
                const pk = document.createElement('div');
                pk.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:100001;display:flex;align-items:center;justify-content:center;';
                pk.innerHTML = `<div style="width:320px;background:#2b2b2b;border:2px solid #1a1a1a;color:#e0e0e0;font-family:chevyray,monospace;font-size:12px;display:flex;flex-direction:column;max-height:70vh;">
                    <div style="padding:8px 10px;border-bottom:1px solid #1a1a1a;font-size:11px;color:#aaa;">Pick Image</div>
                    <input id="_pkFilter" placeholder="Filter..." style="${inS}margin:6px 8px;width:calc(100% - 16px);box-sizing:border-box;">
                    <div id="_pkList" style="overflow-y:auto;flex:1;"></div>
                </div>`;
                document.body.appendChild(pk);
                const imgInput = eb.querySelector('#_edImg');
                const listEl = pk.querySelector('#_pkList');
                const filterEl = pk.querySelector('#_pkFilter');
                const fillList = (q) => {
                    const rows = imgs.filter(n => !q || n.toLowerCase().includes(q.toLowerCase()));
                    listEl.innerHTML = '';
                    rows.forEach(n => {
                        const item = document.createElement('div');
                        item.textContent = n;
                        item.style.cssText = 'padding:5px 10px;cursor:pointer;border-bottom:1px solid #1a1a1a;';
                        item.onmouseenter = () => item.style.background = '#3a4a5a';
                        item.onmouseleave = () => item.style.background = '';
                        item.onclick = () => { imgInput.value = n; document.body.removeChild(pk); };
                        listEl.appendChild(item);
                    });
                };
                fillList('');
                filterEl.oninput = () => fillList(filterEl.value);
                filterEl.focus();
                pk.onclick = e => { if (e.target === pk) document.body.removeChild(pk); };
            };
            eb.querySelector('#_edOk').onclick = () => {
                const img = eb.querySelector('#_edImg').value.trim(); if (!img) { closeEd(); return; }
                const entry = { img, levelstart: eb.querySelector('#_edPfx').value.trim(), type: +eb.querySelector('#_edType').value, x: +eb.querySelector('#_edX').value||0, y: +eb.querySelector('#_edY').value||0, visible: td.visible!==false };
                if (idx >= 0) this.level._tiledefs[idx] = entry; else this.level._tiledefs.push(entry);
                closeEd(); render(); this.applyTiledefFromNPCs(); this.saveSessionDebounced();
            };
        };

        box.querySelector('#_tdAdd').onclick = () => openEdit(-1);
        box.querySelector('#_tdEdit').onclick = () => { if (sel >= 0) openEdit(sel); };
        box.querySelector('#_tdDelete').onclick = () => { if (sel < 0) return; this.level._tiledefs.splice(sel, 1); sel = Math.min(sel, this.level._tiledefs.length - 1); render(); this.applyTiledefFromNPCs(); this.saveSessionDebounced(); };
        box.querySelector('#_tdImport').onclick = () => { const inp = document.createElement('input'); inp.type='file'; inp.accept='.json'; inp.onchange=()=>{ const f=inp.files[0]; if(!f) return; const r=new FileReader(); r.onload=e=>{try{const d=JSON.parse(e.target.result); if(Array.isArray(d)){this.level._tiledefs=d;sel=-1;render();this.applyTiledefFromNPCs();}}catch(e){}}; r.readAsText(f); }; inp.click(); };
        box.querySelector('#_tdExport').onclick = () => this._downloadFile('tiledefs.json', JSON.stringify(this.level._tiledefs, null, 2));
        const close = () => document.body.removeChild(dialog);
        box.querySelector('#_tdClose').onclick = close;
        dialog.onclick = e => { if (e.target === dialog) close(); };
        this._makeDialogDraggable(dialog, box, box.querySelector('.dialog-titlebar'));
        render();
    }

    clearSelectedTile() {
        this.selectTile(0);
    }

    loadTilesetImage(tilesetName) {
        if (!tilesetName) return;
        if (_isTauri && !this._tilesetDataCache?.[tilesetName] && !this.fileCache?.images?.has(tilesetName)) {
            _tauri.core.invoke('resolve_path', { name: tilesetName }).then(fp => {
                if (fp) this.loadImageFromPath(fp, tilesetName).then(() => this.loadTilesetImage(tilesetName)).catch(() => {});
            }).catch(() => {});
        }
        const src = this._tilesetDataCache?.[tilesetName] || this.fileCache?.images?.get(tilesetName) || `images/${tilesetName}`;
        if (!this.fileCache?.images?.has(tilesetName) && tilesetName.toLowerCase().endsWith('.mng')) {
            const img = new Image();
            img.onload = () => {
                this.level.tilesetImage = img; this.invalidateLayerCache(); this.updateTilesetDisplay();
                if (this.defaultTile < 0) this.defaultTile = 0;
                this.updateSelectedTileCanvas(); this.render();
            };
            fetch(src).then(r => r.arrayBuffer()).then(buf => MNG.toBlob(buf)).then(blob => {
                img.src = URL.createObjectURL(blob);
            }).catch(() => { img.src = src; });
            return;
        }
        const img = new Image();
        img.onload = () => {
            this.level.tilesetImage = img;
            this.invalidateLayerCache();
            this.updateTilesetDisplay();
            if (this.defaultTile < 0) this.defaultTile = 0;
            this.updateSelectedTileCanvas();
            this.render();
        };
        img.src = src;
    }

    initRightTabs() {
        const tabs = document.querySelectorAll('.right-tabs .tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                this.switchRightTab(tabName);
            });
        });
    }

    switchRightTab(tabName) {
        const tabs = document.querySelectorAll('.right-tabs .tab');
        const panels = document.querySelectorAll('.right-tabs .tab-panel');

        tabs.forEach(tab => {
            tab.classList.remove('active');
        });

        panels.forEach(panel => {
            panel.classList.remove('active');
            panel.style.display = 'none';
        });

        const activeTab = document.querySelector(`.right-tabs .tab[data-tab="${tabName}"]`);
        let activePanel = null;
        if (tabName === 'tileset') {
            activePanel = document.getElementById('tileset-tab');
        } else if (tabName === 'tileobjects') {
            activePanel = document.getElementById('tileobjects-tab');
        } else if (tabName === 'objects') {
            activePanel = document.getElementById('objects-tab');
        } else if (tabName === 'layers') {
            activePanel = document.getElementById('layers-tab');
            this.refreshLayerPanel();
        }
        
        if (activeTab) activeTab.classList.add('active');
        if (activePanel) {
            activePanel.classList.add('active');
            activePanel.style.display = 'flex';
        }
    }

    refreshNPCList() {
        const tbody = document.getElementById('npcListBody');
        if (!tbody || !this.level) return;
        const npcs = this.level.objects.filter(o => o.type === 'npc');
        const selId = this.selectedObject?.type === 'npc' ? this.selectedObject.id : null;
        tbody.innerHTML = npcs.map(o =>
            `<tr data-npcid="${o.id}" style="cursor:pointer;user-select:none;${o.id===selId?'background:#2a4a6a;':''}" onclick="(()=>{const e=window._editor,n=e.level.objects.find(x=>x.id==='${o.id}');if(!n)return;e.selectedObject=n;const tw=e.level.tileWidth||16,th=e.level.tileHeight||16;e.panX=e.canvas.width/2-n.x*tw*e.zoom;e.panY=e.canvas.height/2-n.y*th*e.zoom;e.render();document.querySelectorAll('#npcListBody tr').forEach(r=>r.style.background=r.dataset.npcid==='${o.id}'?'#2a4a6a':'');})()" ondblclick="event.preventDefault();(()=>{const n=window._editor.level.objects.find(x=>x.id==='${o.id}');if(n)window._editor.openNPCEditor(n);})();">
                <td style="padding:2px 6px;">${o.x}</td>
                <td style="padding:2px 6px;">${o.y}</td>
                <td style="padding:2px 6px;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${o.properties?.image||''}">${o.properties?.image||''}</td>
            </tr>`
        ).join('') || `<tr><td colspan="3" style="padding:4px 6px;color:#666;">No NPCs</td></tr>`;
    }

    updateZoomDisplay() {
        const zoomSpan = document.getElementById('zoomLevel');
        if (zoomSpan) {
            zoomSpan.textContent = `Zoom: ${Math.round(this.zoom * 100)}%`;
        }
        const zoomDisplay = document.getElementById('zoomDisplay');
        if (zoomDisplay) {
            if (this.zoom >= 1.0) {
                zoomDisplay.textContent = `${Math.round(this.zoom)}x`;
            } else {
                zoomDisplay.textContent = `${Math.round(1 / this.zoom)}x`;
            }
        }
    }

    _currentLevelIsZelda() {
        if (this.level?._sourceFormat === 'zelda') return true;
        const name = (this.levels[this.currentLevelIndex]?.name || '').toLowerCase();
        return name.endsWith('.zelda');
    }

    placeObjectAt(x, y) {
        if (this._currentLevelIsZelda() && (this.selectedObjectType === 'npc' || this.selectedObjectType === 'chest')) return;
        this.pushUndo();
        const existingObj = this.level.getObjectAt(x, y);
        if (existingObj) {
            this.level.removeObject(existingObj);
        }

        const obj = new LevelObject(x, y, this.selectedObjectType);
        const cloneProps = this._pendingCloneObj;
        this._pendingCloneObj = null;
        if (cloneProps) { obj.properties = { ...cloneProps }; }
        else if (this.selectedObjectType === 'npc') { const lib = this._dragObjectLibItem; this._dragObjectLibItem = null; obj.properties = lib ? { image: lib.image, code: lib.code, layerIndex: 0 } : { image: '', code: '', layerIndex: 0 }; }
        else if (this.selectedObjectType === 'sign') obj.properties = { text: '', layerIndex: 0 };
        else if (this.selectedObjectType === 'link') obj.properties = { nextLevel: '', width: 2, height: 2, nextX: '0', nextY: '0', nextLayer: 0, layerIndex: 0 };
        else if (this.selectedObjectType === 'chest') obj.properties = { itemName: 'greenrupee', signIndex: 0, layerIndex: 0 };
        this.level.addObject(obj);
        this.render();
        this.saveSessionDebounced();
        if (!cloneProps) {
            if (this.selectedObjectType === 'npc') this.openNPCEditor(obj);
            else if (this.selectedObjectType === 'sign') this.openSignEditor(obj);
            else if (this.selectedObjectType === 'link') this.openLinkEditor(obj);
            else if (this.selectedObjectType === 'chest') this.openChestEditor(obj);
            else if (this.selectedObjectType === 'baddy') this.openBaddyEditor(obj);
        }
    }

    getLinkResizeHandle(screenX, screenY) {
        if (!this.selectedObject || this.selectedObject.type !== 'link') return null;
        const obj = this.selectedObject;
        const tw = this.level.tileWidth || 16, th = this.level.tileHeight || 16;
        const x = obj.x * tw, y = obj.y * th;
        const ow = (obj.properties?.width || 2) * tw, oh = (obj.properties?.height || 2) * th;
        const rect = this.canvas.getBoundingClientRect();
        const snapPanX = Math.floor(this.panX), snapPanY = Math.floor(this.panY);
        const worldX = (screenX - rect.left - snapPanX) / this.zoom;
        const worldY = (screenY - rect.top - snapPanY) / this.zoom;
        const thresh = Math.min(8 / this.zoom, ow / 4, oh / 4);
        const pts = [
            [x, y,'nw'], [x+ow/2, y,'n'], [x+ow, y,'ne'],
            [x+ow, y+oh/2,'e'], [x+ow, y+oh,'se'],
            [x+ow/2, y+oh,'s'], [x, y+oh,'sw'], [x, y+oh/2,'w']
        ];
        for (const [wx, wy, dir] of pts) {
            if (Math.abs(worldX - wx) <= thresh && Math.abs(worldY - wy) <= thresh) return dir;
        }
        return null;
    }

    deleteObjectAt(x, y) {
        const obj = this.level.getObjectAt(x, y);
        if (obj) {
            this.pushUndo();
            this.level.removeObject(obj);
            this.render();
            this.saveSessionDebounced();
        }
    }

    drawObjects() {
        const tw = this.level.tileWidth || 16;
        const th = this.level.tileHeight || 16;
        const ss = this._screenshotMode && this._ssOpts;
        const visNPCs = ss ? this._ssOpts.ssNPCs : document.getElementById('visNPCs')?.checked !== false;
        const visChars = ss ? this._ssOpts.ssChars : document.getElementById('visCharacters')?.checked !== false;
        const visLinks = ss ? this._ssOpts.ssLinks : (!this._playMode && document.getElementById('visLinks')?.checked !== false);
        const visSigns = ss ? this._ssOpts.ssSigns : (!this._playMode && document.getElementById('visSigns')?.checked !== false);
        const visChests = ss ? this._ssOpts.ssChests : true;
        const _drawItems = [];
        this.level.objects.forEach(obj => {
            if ((obj.type === 'npc' || obj.type === 'baddy') && !visNPCs) return;
            if (obj.type === 'link' && !visLinks) return;
            if (obj.type === 'sign' && !visSigns) return;
            if (obj.type === 'chest' && !visChests) return;
            const sortY = (obj.type === 'npc' || obj.type === 'baddy')
                ? obj.y * th + (obj._ganiOY ?? 0) + (obj._imgH ?? 48)
                : obj.y * th + th;
            _drawItems.push({ obj, sortY });
        });
        if (this._playMode && this._player) {
            const _p = this._player;
            _drawItems.push({ isPlayer: true, sortY: _p.y + (_p._ganiOY ?? 0) + (_p._imgH ?? 48) });
            _drawItems.sort((a, b) => a.sortY - b.sortY);
        }
        for (const _item of _drawItems) {
            if (_item.isPlayer) {
                const _p = this._player, _pb = {};
                this._drawGaniNPC(_p.x, _p.y, _p.gani, _p.dir, _p.frame, _pb, this._playerOverrides || {});
                if (!_p._boundsLocked && _pb._imgW != null) {
                    Object.assign(_p, { _ganiOX: _pb._ganiOX, _ganiOY: _pb._ganiOY, _imgW: _pb._imgW, _imgH: _pb._imgH });
                    _p._boundsLocked = true;
                }
                continue;
            }
            const obj = _item.obj;
            const x = obj.x * tw;
            const y = obj.y * th;
            switch (obj.type) {
                case 'baddy': this.drawBaddy(x, y, tw, th, obj); break;
                case 'npc': this.drawNPC(x, y, tw, th, obj, visChars); break;
                case 'chest': this.drawChest(x, y, tw, th); break;
                case 'sign': this.drawSign(x, y, tw, th, obj); break;
                case 'link': this.drawLink(x, y, tw, th, obj); break;
                default: this.drawGenericObject(x, y, tw, th, obj.type);
            }
            if (!this._screenshotMode && this.selectedObject === obj) {
                const _bc = obj.type === 'baddy' ? BADDY_CROPS[Math.max(0, Math.min(9, obj.properties?.baddyType ?? 0))] : null;
                const sc2 = obj.type === 'sign' ? 'rgb(255,0,0)' : obj.type === 'link' ? 'rgb(255,215,0)' : 'rgb(255,105,180)';
                const fc2 = obj.type === 'sign' ? 'rgba(255,0,0,0.25)' : obj.type === 'link' ? 'rgba(255,215,0,0.25)' : 'rgba(255,105,180,0.35)';
                this.ctx.fillStyle = fc2; this.ctx.strokeStyle = sc2; this.ctx.lineWidth = 2 / this.zoom;
                const shp = obj._shapeCache;
                let ow, oh, ox = 0, oy = 0;
                if (obj.type === 'npc' && shp?.type === 2) {
                    for (let ty2 = 0; ty2 < shp.h; ty2++) for (let tx2 = 0; tx2 < shp.w; tx2++) {
                        if (!shp.tiles[ty2 * shp.w + tx2]) continue;
                        this.ctx.fillRect(x + tx2*tw, y + ty2*th, tw, th); this.ctx.strokeRect(x + tx2*tw, y + ty2*th, tw, th);
                    }
                } else {
                    if (obj.type === 'npc' && shp?.type === 1) { ow = shp.w; oh = shp.h; }
                    else if (_bc) { ow = _bc[2]; oh = _bc[3]; }
                    else if (obj.type === 'npc') {
                        const _tb = this._getTightBounds(obj);
                        const _gox = obj._ganiOX ?? 0, _goy = obj._ganiOY ?? 0;
                        const _sx2 = obj._stretchx ?? 1, _sy2 = obj._stretchy ?? 1;
                        if (_tb) {
                            ow = _tb.bw; oh = _tb.bh;
                            ox = _gox + (_sx2 < 0 ? _tb.srcW - _tb.bx - _tb.bw : _tb.bx);
                            oy = _goy + (_sy2 < 0 ? _tb.srcH - _tb.by - _tb.bh : _tb.by);
                        } else {
                            ow = obj._imgW || (obj.properties?.width||3)*tw; oh = obj._imgH || (obj.properties?.height||3)*th;
                            ox = _gox; oy = _goy;
                        }
                    }
                    else { ow = (obj.properties?.width || (obj.type==='chest'?2:obj.type==='sign'?2:obj.type==='link'?2:1))*tw; oh = (obj.properties?.height || (obj.type==='chest'?2:obj.type==='link'?2:1))*th; }
                    this.ctx.fillRect(x + ox, y + oy, ow, oh); this.ctx.strokeRect(x + ox, y + oy, ow, oh);
                }
                if (obj.type === 'link' && ow != null) {
                    const hs = Math.max(6, 6 / this.zoom);
                    const pts = [[x,y],[x+ow/2,y],[x+ow,y],[x+ow,y+oh/2],[x+ow,y+oh],[x+ow/2,y+oh],[x,y+oh],[x,y+oh/2]];
                    this.ctx.fillStyle = '#fff'; this.ctx.strokeStyle = 'rgb(255,215,0)'; this.ctx.lineWidth = 1/this.zoom;
                    pts.forEach(([px,py]) => { this.ctx.fillRect(px-hs/2,py-hs/2,hs,hs); this.ctx.strokeRect(px-hs/2,py-hs/2,hs,hs); });
                }
            }
        };
    }

    drawBaddy(x, y, tw, th, obj) {
        const typeIdx = Math.max(0, Math.min(9, obj?.properties?.baddyType ?? 0));
        const [sx, sy, sw, sh] = BADDY_CROPS[typeIdx];
        const img = this.objectImages?.opps;
        if (img?.complete && img.naturalWidth > 0) {
            this.ctx.drawImage(img, sx, sy, sw, sh, x, y, sw, sh);
        } else {
            this.ctx.strokeStyle = 'rgb(255, 50, 50)';
            this.ctx.lineWidth = 1 / this.zoom;
            this.ctx.strokeRect(x, y, sw, sh);
        }
    }

    _getGaniImage(name) {
        if (!this._ganiImgCache) this._ganiImgCache = new Map();
        if (this._playMode && name.toLowerCase().endsWith('.mng')) {
            if (!this._mngAnimCache) this._mngAnimCache = new Map();
            if (this._mngAnimCache.has(name)) return this._mngAnimCache.get(name);
            const placeholder = document.createElement('canvas'); placeholder.width = 1; placeholder.height = 1;
            this._mngAnimCache.set(name, placeholder);
            const mngBlob = this.fileCache?.mngs?.get(name);
            const _mngLoad2 = buf => MNG.play(buf).then(c => { this._mngAnimCache.set(name, c); this.requestRender(); }).catch(() => {});
            if (mngBlob) { fetch(mngBlob).then(r => r.arrayBuffer()).then(_mngLoad2).catch(() => {}); }
            else if (_isTauri && this._tauriPathIndex?.has(name.toLowerCase())) { _tauri.fs.readFile(this._tauriPathIndex.get(name.toLowerCase())).then(d => _mngLoad2(d.buffer)).catch(() => {}); }
            else { fetch(`images/${name}`).then(r => r.arrayBuffer()).then(_mngLoad2).catch(() => {}); }
            return placeholder;
        }
        if (this._ganiImgCache.has(name)) return this._ganiImgCache.get(name);
        if (!this._fcLower && this.fileCache?.images?.size) this._fcLower = new Map([...this.fileCache.images.keys()].map(k => [k.toLowerCase(), k]));
        const _resolvedName = this.fileCache?.images?.has(name) ? name : (this._fcLower?.get(name.toLowerCase()) || name);
        const cached = this.fileCache?.images?.get(_resolvedName);
        if (!cached && _isTauri && name) {
            _tauri.core.invoke('resolve_path', { name }).then(fp => {
                if (fp) this.loadImageFromPath(fp, name).then(() => { this._fcLower = null; this._ganiImgCache.delete(name); this.requestRender(); }).catch(() => {});
            }).catch(() => {});
        }
        const fallbackSrc = cached || `images/${name}`;
        if (!cached && name.toLowerCase().endsWith('.mng')) {
            const img = new Image(); img._mngFetching = true;
            this._ganiImgCache.set(name, img);
            fetch(fallbackSrc).then(r => r.arrayBuffer()).then(buf => MNG.toBlob(buf)).then(blob => {
                const url = URL.createObjectURL(blob);
                const rpl = new Image(); rpl._mngDone = true;
                rpl.onload = () => { this._ganiImgCache.set(name, rpl); this.requestRender(); };
                rpl.src = url;
            }).catch(() => {});
            return img;
        }
        const img = new Image(); img.src = fallbackSrc;
        this._ganiImgCache.set(name, img);
        return img;
    }

    _recolorSprite(img, sx, sy, w, h, colors) {
        if (!this._recolorCache) this._recolorCache = new Map();
        const key = img.src + sx + ',' + sy + ',' + JSON.stringify(colors);
        if (this._recolorCache.has(key)) return this._recolorCache.get(key);
        const tc = document.createElement('canvas'); tc.width = w; tc.height = h;
        const tx = tc.getContext('2d'); tx.drawImage(img, sx, sy, w, h, 0, 0, w, h);
        const id = tx.getImageData(0, 0, w, h); const d = id.data;
        for (let i = 0; i < d.length; i += 4) {
            if (d[i+3] < 10) continue;
            for (const p of _BODY_PALETTE) {
                if (p.slot < 0) continue;
                if (colors[p.slot] == null) continue;
                if (Math.abs(d[i]-p.r)+Math.abs(d[i+1]-p.g)+Math.abs(d[i+2]-p.b) < 40) { const c = _CRGB[colors[p.slot]]; d[i]=c[0]; d[i+1]=c[1]; d[i+2]=c[2]; break; }
            }
        }
        tx.putImageData(id, 0, 0); this._recolorCache.set(key, tc); return tc;
    }
    _drawGaniNPC(x, y, ganiName = 'idle.gani', dir = 2, frameIdx = 0, obj = null, overrides = {}) {
        if (!this._ganiCache) this._ganiCache = new Map();
        if (!this._ganiCache.has(ganiName)) {
            this._ganiCache.set(ganiName, null);
            const _gt = this.fileCache?.ganiTexts;
            const text = _gt?.get(ganiName) || _gt?.get(ganiName.toLowerCase()) || ((() => { if (!_gt) return null; for (const [k,v] of _gt) if (k.toLowerCase() === ganiName.toLowerCase()) return v; return null; })());
            if (text) { this._ganiCache.set(ganiName, parseGaniLE(text)); }
            else { fetch(`/ganis/${ganiName}`).then(r => r.text()).then(t => { this._ganiCache.set(ganiName, parseGaniLE(t)); this.requestRender(); }).catch(() => { this._ganiCache.set(ganiName, 'notfound'); this.requestRender(); }); return; }
        }
        const ganiData = this._ganiCache.get(ganiName);
        if (!ganiData?.frames?.length) {
            if (ganiName !== 'idle.gani') { this._drawGaniNPC(x, y, 'idle.gani', dir, frameIdx, obj, overrides); }
            return;
        }
        const gani = ganiData;
        const frame = gani.frames[Math.min(frameIdx, gani.frames.length - 1)];
        if (!frame) return;
        const dirFrame = frame[Math.min(dir, frame.length - 1)];
        if (!dirFrame?.spr) return;
        this.ctx.imageSmoothingEnabled = false;
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const s of dirFrame.spr) {
            const def = gani.sprites[s.idx];
            if (!def) continue;
            const overrideFile = overrides[def.type];
            if (overrideFile && /^no-(shield|head|body)\.png$/i.test(overrideFile)) continue;
            if (!this._fcLower && this.fileCache?.images?.size) { this._fcLower = new Map([...this.fileCache.images.keys()].map(k => [k.toLowerCase(), k])); }
            const resolvedOverride = overrideFile ? (this.fileCache?.images?.has(overrideFile) ? overrideFile : (this._fcLower?.get(overrideFile.toLowerCase()) || null)) : null;
            if (/^ATTR/.test(def.type) && (!overrideFile || overrideFile === '' || (overrideFile && !resolvedOverride)) && (def.type === 'ATTR1' || !gani.defs[def.type])) continue;
            let imgFile = (/^(HEAD|BODY|SHIELD|SWORD)$/.test(def.type) && overrideFile ? overrideFile : resolvedOverride) || gani.defs[def.type] || (def.type.includes('.') ? def.type : null) || (def.type === 'BODY' ? 'body.png' : null);
            if (!imgFile) continue;
            let img = this._getGaniImage(imgFile);
            if (!img.complete || !img.naturalWidth) {
                if (def.type === 'BODY' && imgFile !== 'body.png') { imgFile = 'body.png'; img = this._getGaniImage(imgFile); }
                if (def.type === 'HEAD' && imgFile !== 'head0.png') { imgFile = 'head0.png'; img = this._getGaniImage(imgFile); }
                if (!img.complete || !img.naturalWidth) { if (!img._rl) { img._rl = true; img.onload = () => this.requestRender(); } continue; }
            }
            if (def.type === 'BODY' && overrides.colors) {
                const rc = this._recolorSprite(img, def.sx, def.sy, def.w, def.h, overrides.colors);
                this.ctx.drawImage(rc, 0, 0, def.w, def.h, x + s.ox, y + s.oy, def.w, def.h);
            } else { this.ctx.drawImage(img, def.sx, def.sy, def.w, def.h, x + s.ox, y + s.oy, def.w, def.h); }
            if (/^(BODY|HEAD|SHIELD)$/.test(def.type)) {
                if (s.ox < minX) minX = s.ox;
                if (s.oy < minY) minY = s.oy;
                if (s.ox + def.w > maxX) maxX = s.ox + def.w;
                if (s.oy + def.h > maxY) maxY = s.oy + def.h;
            }
        }
        if (obj && minX !== Infinity) { obj._ganiOX = minX; obj._ganiOY = minY; obj._imgW = maxX - minX; obj._imgH = maxY - minY; }
    }

    drawNPC(x, y, tw, th, obj, showChars = true) {
        if (!obj._shapeCache) { const sp = parseNPCScript(obj.properties?.code || ''); obj._shapeCache = sp.setshape2 ? { type: 2, w: sp.setshape2.w, h: sp.setshape2.h, tiles: sp.setshape2.tiles } : sp.setshape ? { type: 1, w: sp.setshape.w, h: sp.setshape.h } : { type: 0 }; if (sp.imgpart) obj._imgpart = sp.imgpart; if (sp.stretchx !== undefined) obj._stretchx = sp.stretchx; if (sp.stretchy !== undefined) obj._stretchy = sp.stretchy; if (sp.coloreffect) obj._coloreffect = sp.coloreffect; else obj._coloreffect = null; if (sp.zoom !== undefined) obj._npcZoom = sp.zoom; obj._xOff = sp.xOff || 0; obj._yOff = sp.yOff || 0; }
        const _ox = x + (obj._xOff||0) * tw, _oy = y + (obj._yOff||0) * th;
        const imgName = obj?._imgpart?.img || obj?.properties?.image;
        if (imgName) {
            if (!this._fcLower && this.fileCache?.images?.size) this._fcLower = new Map([...this.fileCache.images.keys()].map(k => [k.toLowerCase(), k]));
            const resolved = this.fileCache?.images?.has(imgName) ? imgName : (this._fcLower?.get(imgName.toLowerCase()) || null);
            if (!resolved && _isTauri && imgName) {
                const _lname = imgName.toLowerCase();
                if (!this._tauriLoadingImgs) this._tauriLoadingImgs = new Set();
                if (!this._tauriLoadingImgs.has(_lname)) {
                    this._tauriLoadingImgs.add(_lname);
                    _tauri.core.invoke('resolve_path', { name: _lname }).then(fp => {
                        if (fp) this.loadImageFromPath(fp, _lname).then(() => { this._fcLower = null; if (this._objImgCache) this._objImgCache.delete(imgName); this._tauriLoadingImgs.delete(_lname); this.requestRender(); }).catch(() => { this._tauriLoadingImgs.delete(_lname); });
                        else this._tauriLoadingImgs.delete(_lname);
                    }).catch(() => { this._tauriLoadingImgs.delete(_lname); });
                }
            }
            const src = (resolved ? this.fileCache.images.get(resolved) : null) || `images/${imgName}`;
            if (!this._objImgCache) this._objImgCache = new Map();
            if (this._playMode && imgName.toLowerCase().endsWith('.mng')) {
                if (!this._mngAnimCache) this._mngAnimCache = new Map();
                if (!this._mngAnimCache.has(imgName)) {
                    const placeholder = document.createElement('canvas'); placeholder.width = 1; placeholder.height = 1;
                    this._mngAnimCache.set(imgName, placeholder);
                    const mngBlob = this.fileCache?.mngs?.get(imgName);
                    const _mngLoad = buf => MNG.play(buf).then(c => { this._mngAnimCache.set(imgName, c); obj._imgW = c.width; obj._imgH = c.height; this.requestRender(); }).catch(() => {});
                    if (mngBlob) { fetch(mngBlob).then(r => r.arrayBuffer()).then(_mngLoad).catch(() => {}); }
                    else if (_isTauri && this._tauriPathIndex?.has(imgName.toLowerCase())) { _tauri.fs.readFile(this._tauriPathIndex.get(imgName.toLowerCase())).then(d => _mngLoad(d.buffer)).catch(() => {}); }
                    else { fetch(`images/${imgName}`).then(r => r.arrayBuffer()).then(_mngLoad).catch(() => {}); }
                }
                const c = this._mngAnimCache.get(imgName);
                if (c.width > 1) {
                    obj._imgW = c.width; obj._imgH = c.height;
                    const _sx = obj._stretchx ?? 1, _sy = obj._stretchy ?? 1;
                    if (_sx < 0 || _sy < 0) {
                        this.ctx.save();
                        this.ctx.translate(x + (_sx < 0 ? c.width : 0), y + (_sy < 0 ? c.height : 0));
                        this.ctx.scale(_sx < 0 ? -1 : 1, _sy < 0 ? -1 : 1);
                        this.ctx.drawImage(c, 0, 0, c.width, c.height);
                        this.ctx.restore();
                    } else { this.ctx.drawImage(c, x, y, c.width, c.height); }
                    return;
                }
                return;
            }
            let cached = this._objImgCache.get(imgName);
            if (src.toLowerCase().endsWith('.mng') && !cached?._mngDone) {
                if (!cached) { cached = new Image(); cached._src = src; this._objImgCache.set(imgName, cached); }
                if (!cached._mngFetching) {
                    cached._mngFetching = true;
                    fetch(src).then(r => r.arrayBuffer()).then(buf => MNG.toBlob(buf)).then(blob => {
                        const url = URL.createObjectURL(blob);
                        const img = new Image(); img._src = url; img._mngDone = true;
                        img.onload = () => { this._objImgCache.set(imgName, img); this.requestRender(); };
                        img.src = url;
                    }).catch(() => {});
                }
                return;
            }
            const _ip = obj._imgpart;
            const _drawImg = (img, sx, sy, sw, sh, dx, dy) => {
                const _sx = obj._stretchx ?? 1, _sy = obj._stretchy ?? 1;
                const _ce = obj._coloreffect;
                const _lc = this._getLightCanvas(imgName, img, sx, sy, sw, sh);
                this.ctx.save();
                if (_ce?.[3] != null && _ce[3] < 1) this.ctx.globalAlpha = Math.max(0, _ce[3]);
                if (_lc) this.ctx.globalCompositeOperation = 'lighter';
                const _nz = obj._npcZoom ?? 1;
                const _dw = sw * _nz, _dh = sh * _nz;
                if (_sx < 0 || _sy < 0 || _nz !== 1) {
                    this.ctx.translate(dx + (_sx < 0 ? _dw : 0), dy + (_sy < 0 ? _dh : 0));
                    this.ctx.scale((_sx < 0 ? -1 : 1) * _nz, (_sy < 0 ? -1 : 1) * _nz);
                    this.ctx.drawImage(_lc || img, _lc ? 0 : sx, _lc ? 0 : sy, sw, sh, 0, 0, sw, sh);
                } else { this.ctx.drawImage(_lc || img, _lc ? 0 : sx, _lc ? 0 : sy, sw, sh, dx, dy, _dw, _dh); }
                this.ctx.restore();
            };
            if (cached?._mngDone && cached.complete && cached.naturalWidth > 0) { obj._imgW = _ip ? _ip.w : cached.naturalWidth; obj._imgH = _ip ? _ip.h : cached.naturalHeight; _drawImg(cached, _ip ? _ip.x : 0, _ip ? _ip.y : 0, obj._imgW, obj._imgH, _ox, _oy); return; }
            if (!cached || cached._src !== src) { cached = new Image(); cached._src = src; cached.src = src; cached.onload = () => this.requestRender(); this._objImgCache.set(imgName, cached); }
            if (cached.complete && cached.naturalWidth > 0) { obj._imgW = _ip ? _ip.w : cached.naturalWidth; obj._imgH = _ip ? _ip.h : cached.naturalHeight; _drawImg(cached, _ip ? _ip.x : 0, _ip ? _ip.y : 0, obj._imgW, obj._imgH, _ox, _oy); return; }
        }
        const script = obj?.properties?.code || '';
        if (showChars && /showcharacter\s*\(\s*\)|showcharacter\s*;/i.test(script)) {
            const sp = parseNPCScript(script);
            this._drawGaniNPC(_ox, _oy, sp.gani || 'idle.gani', sp.dir ?? 2, 0, obj, sp);
            if (sp.nick || sp.chat) {
                const _gs2 = this._getSettings();
                const _nSz = Math.max(_gs2.nickFontSize * this.zoom, 8), _cSz = Math.max(_gs2.chatFontSize * this.zoom, 8);
                const _wcx = x + tw;
                const _wHeadY = y + (obj._ganiOY ?? 0);
                const _wFeetY = y + (obj._ganiOY ?? 0) + (obj._imgH ?? 48);
                const _scx = _wcx * this.zoom + this.panX;
                this.ctx.save(); this.ctx.setTransform(1, 0, 0, 1, 0, 0);
                this.ctx.textAlign = 'center';
                this.ctx.shadowColor = 'rgba(20,40,200,1)'; this.ctx.shadowOffsetX = 2; this.ctx.shadowOffsetY = 2; this.ctx.shadowBlur = 0;
                if (sp.chat) { this.ctx.font = `bold ${_cSz}px 'TempusSansITC','Tempus Sans ITC',sans-serif`; this.ctx.fillStyle = '#fff'; this.ctx.fillText(sp.chat, _scx, _wHeadY * this.zoom + this.panY - 16); }
                if (sp.nick) { this.ctx.font = `bold ${_nSz}px 'TempusSansITC','Tempus Sans ITC',sans-serif`; this.ctx.fillStyle = '#fff'; this.ctx.fillText(sp.nick + (sp.guild ? ` (${sp.guild})` : ''), _scx, _wFeetY * this.zoom + this.panY + _nSz + 4); }
                this.ctx.shadowColor = 'transparent'; this.ctx.shadowOffsetX = 0; this.ctx.shadowOffsetY = 0; this.ctx.textAlign = 'left'; this.ctx.restore();
            }
            return;
        }
        if (this._screenshotMode || (this._playMode && !this._editBypass)) return;
        const placeholder = this.objectImages?.npc;
        if (placeholder?.complete && placeholder.naturalWidth > 0) this.ctx.drawImage(placeholder, x, y, tw * 3, th * 3);
        else { this.ctx.strokeStyle = 'rgb(255, 200, 100)'; this.ctx.lineWidth = 1/this.zoom; this.ctx.strokeRect(x, y, tw*3, th*3); }
    }

    drawChest(x, y, tw, th) {
        const cachedSrc = this.fileCache?.images?.get('chest.png');
        const img = cachedSrc ? (() => { const i = new Image(); i.src = cachedSrc; return i; })() : this.objectImages?.chest;
        if (img?.complete && img.naturalWidth > 0) this.ctx.drawImage(img, x, y, tw * 2, th * 2);
        else if (!this._screenshotMode) { this.ctx.strokeStyle = 'rgb(255, 215, 0)'; this.ctx.lineWidth = 1/this.zoom; this.ctx.strokeRect(x, y, tw*2, th*2); }
    }

    drawSign(x, y, tw, th, obj) {
        const w = (obj?.properties?.width || 2) * tw;
        const h = (obj?.properties?.height || 1) * th;
        this.ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
        this.ctx.fillRect(x, y, w, h);
        this.ctx.strokeStyle = 'rgb(255, 0, 0)';
        this.ctx.lineWidth = 2 / this.zoom;
        this.ctx.strokeRect(x, y, w, h);
    }

    drawLink(x, y, tw, th, obj) {
        const w = (obj?.properties?.width || 2) * tw;
        const h = (obj?.properties?.height || 2) * th;
        this.ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
        this.ctx.fillRect(x, y, w, h);
        this.ctx.strokeStyle = 'rgb(255, 215, 0)';
        this.ctx.lineWidth = 2 / this.zoom;
        this.ctx.strokeRect(x, y, w, h);
    }

    drawGenericObject(x, y, w, h, type) {
        this.ctx.fillStyle = '#95A5A6';
        this.ctx.fillRect(x, y, w, h);

        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 2 / this.zoom;
        this.ctx.strokeRect(x, y, w, h);

        if (this.zoom > 0.8) {
            this.ctx.fillStyle = '#000000';
            this.ctx.font = `${10 / this.zoom}px Arial`;
            this.ctx.fillText(type.charAt(0).toUpperCase(), x + 2, y + h - 2);
        }
    }


    setObjectMode(objectType) {
        this.objectMode = (objectType !== null && objectType !== 'delete');
        this.selectedObjectType = objectType;

        const buttons = ['btnPlaceBaddy', 'btnPlaceNPC', 'btnPlaceChest', 'btnPlaceSign', 'btnPlaceLink', 'btnTileMode'];
        buttons.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                if ((id === 'btnTileMode' && !this.objectMode && objectType !== 'delete') ||
                    (id !== 'btnTileMode' && this.objectMode && id.toLowerCase().includes(objectType))) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            }
        });

        if (objectType === 'delete') {
        } else if (this.objectMode) {
        } else {
        }
    }

    closeAllTabs() {
        this.levels = [];
        this.currentLevelIndex = -1;
        this.level = new Level();
        const tabsContainer = document.getElementById('levelTabs');
        if (tabsContainer) tabsContainer.innerHTML = '';
        this.undoStack = [];
        this.redoStack = [];
        this.loadDefaultTileset();
        this.updateUI();
        this.render();
        this.saveSessionDebounced();
    }

    resetEditor() {
        const box = document.createElement('div');
        box.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#2b2b2b;border:1px solid #404040;padding:16px 20px;z-index:99999;min-width:280px;font-size:13px;color:#e0e0e0;'; box.classList.add('ed-dialog-box');
        box.innerHTML = `<div class="ed-dlg-title">Reset Editor</div>
            <div style="margin-bottom:12px;">Reset editor to defaults? This clears all saved state.</div>
            <div style="display:flex;gap:8px;justify-content:flex-end;">
              <button id="_resetOk" style="padding:4px 10px;">Reset</button>
              <button id="_resetCancel" style="padding:4px 10px;">Cancel</button>
            </div>`;
        document.body.appendChild(box);
        const close = () => box.remove();
        box._closeModal = close;
        document.getElementById('_resetCancel').onclick = close;
        document.getElementById('_resetOk').onclick = () => {
            close();
            this._doReset();
        };
        return;
    }

    _doReset() {
        localStorage.removeItem('levelEditorSession');
        localStorage.removeItem('editorColorScheme');
        const left = document.querySelector('.object-library-panel');
        const right = document.querySelector('.right-tabs');
        if (left) { left.style.width = '250px'; left.style.flex = ''; }
        if (right) { right.style.width = '300px'; right.style.flex = ''; }
        this.panX = 0;
        this.panY = 0;
        this.zoomLevel = 5;
        this.showGrid = localStorage.getItem('levelEditor_showGrid') !== 'false';
        this.fadeInactiveLayers = true;
        this.selectedTile = -1;
        this.defaultTile = 0;
        this.currentTool = 'tile';
        this.selectionStartX = -1;
        this.selectionEndX = -1;
        this.selectionStartY = -1;
        this.selectionEndY = -1;
        this.selectionTiles = null;
        this.closeAllTabs();
        this.updateZoomFromLevel();
        this.resizeCanvas();
        const oldStyle = document.getElementById('colorSchemeStyle');
        if (oldStyle) oldStyle.remove();
        document.body.style.background = '';
        document.body.style.color = '';
        this._updateSchemeDropdown('default');
        this.render();
    }

    _closeTabsRange(from, to) {
        const unsaved = this.levels.slice(from, to).filter(l => l.modified).map(l => l.name);
        const doClose = () => {
            this.levels.splice(from, to - from);
            this.currentLevelIndex = Math.min(this.currentLevelIndex, this.levels.length - 1);
            if (this.currentLevelIndex < 0) this.currentLevelIndex = 0;
            this.level = this.levels[this.currentLevelIndex]?.level || new Level();
            const tabsContainer = document.getElementById('levelTabs');
            tabsContainer.innerHTML = '';
            this.levels.forEach((_, i) => this.addLevelTab(i));
            this.updateUI();
            this.render();
            this.saveSessionDebounced();
        };
        if (unsaved.length) {
            const names = unsaved.slice(0, 3).join(', ') + (unsaved.length > 3 ? ` +${unsaved.length - 3} more` : '');
            this._confirm(`Close ${to - from} tab(s)?\n${unsaved.length} unsaved: ${names}`, doClose);
        } else doClose();
    }

    _gsLint(code) {
        const markers = [];
        let i = 0, len = code.length, line = 1, col = 1;
        const braces = [], parens = [], brackets = [];
        const err = (msg, sl, sc, el, ec, sev = 8) => markers.push({ message: msg, severity: sev, startLineNumber: sl, startColumn: sc, endLineNumber: el ?? sl, endColumn: ec ?? sc + 1 });
        const adv = () => { const c = code[i++]; c === '\n' ? (line++, col = 1) : col++; return c; };
        const ws = () => { while (i < len && /[ \t\r]/.test(code[i])) adv(); };
        while (i < len) {
            const [sl, sc, ch] = [line, col, code[i]];
            if (ch === '/' && code[i+1] === '*') {
                adv(); adv(); let ok = false;
                while (i < len) { if (code[i]==='*'&&code[i+1]==='/') { adv(); adv(); ok=true; break; } adv(); }
                if (!ok) err('Unclosed block comment', sl, sc, line, col);
            } else if (ch === '/' && code[i+1] === '/') {
                while (i < len && code[i] !== '\n') adv();
            } else if (ch === '"' || ch === "'") {
                const q = adv(); let ok = false;
                while (i < len) {
                    if (code[i]==='\\') { adv(); i < len && adv(); continue; }
                    if (code[i]===q) { adv(); ok=true; break; }
                    if (code[i]==='\n') break;
                    adv();
                }
                if (!ok) err('Unclosed string literal', sl, sc, line, col);
            } else if (ch === '{') { braces.push([sl,sc]); adv(); }
              else if (ch === '}') { braces.length ? braces.pop() : err("Unexpected '}'", sl, sc, sl, sc+1); adv(); }
              else if (ch === '(') { parens.push([sl,sc]); adv(); }
              else if (ch === ')') { parens.length ? parens.pop() : err("Unexpected ')'", sl, sc, sl, sc+1); adv(); }
              else if (ch === '[') { brackets.push([sl,sc]); adv(); }
              else if (ch === ']') { brackets.length ? brackets.pop() : err("Unexpected ']'", sl, sc, sl, sc+1); adv(); }
              else if (/[a-zA-Z_$]/.test(ch)) {
                let w = ''; const [wl,wc] = [sl,sc];
                while (i < len && /[\w$]/.test(code[i])) w += adv();
                if (['if','while','for'].includes(w)) { ws(); if (i >= len || code[i] !== '(') err(`'${w}' missing '('`, wl, wc, wl, wc+w.length); }
                else if (w === 'function') {
                    ws(); if (i < len && /[a-zA-Z_$]/.test(code[i])) { while (i < len && /[\w$]/.test(code[i])) adv(); ws(); }
                    if (i >= len || code[i] !== '(') err("'function' missing '('", wl, wc, wl, wc+8);
                } else if (w === 'else') {
                    ws(); if (i < len && /[a-zA-Z]/.test(code[i])) {
                        let nw = ''; const np = i;
                        while (i < len && /[a-zA-Z]/.test(code[i])) nw += adv();
                        if (nw !== 'if' && code[i] !== '{' && code[i] !== '\n') { i = np; }
                    } else if (i < len && code[i] !== '{' && code[i] !== '\n' && code[i] !== '/') {
                        err("'else' should be followed by '{' or 'if'", wl, wc, wl, wc+4, 4);
                    }
                }
            } else adv();
        }
        braces.forEach(([sl,sc]) => err("Unclosed '{'", sl, sc, sl, sc+1));
        parens.forEach(([sl,sc]) => err("Unclosed '('", sl, sc, sl, sc+1));
        brackets.forEach(([sl,sc]) => err("Unclosed '['", sl, sc, sl, sc+1));
        const blockHeaders = /^\s*(if|else\s*if|elseif|while|for|function|switch|case|default|else|do|try|catch|finally)\b/i;
        code.split('\n').forEach((rawLine, li) => {
            let ln = rawLine; const ci = ln.indexOf('//'); if (ci >= 0) ln = ln.substring(0, ci);
            ln = ln.replace(/"(?:[^"\\]|\\.)*"/g, '""').replace(/'(?:[^'\\]|\\.)*'/g, "''");
            const tr = ln.trim();
            if (!tr || /^[{}]/.test(tr) || /[{};,\\]$/.test(tr) || /^\/\//.test(tr) || blockHeaders.test(tr)) return;
            if (/\)\s*$/.test(tr)) err("Statement possibly missing ';'", li + 1, ln.trimEnd().length, li + 1, ln.trimEnd().length + 1, 4);
        });
        return markers;
    }

    initMonaco() {
        if (!window.require) { window.monacoReady = Promise.resolve(null); return; }
        window.require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.0/min/vs' } });
        window.monacoReady = new Promise(resolve => {
            window.require(['vs/editor/editor.main'], () => {
                monaco.languages.register({ id: 'graalscript' });
                monaco.languages.setMonarchTokensProvider('graalscript', {
                    keywords: ['if','else','elseif','for','while','do','return','function','break','continue','switch','case','default','new','const','var'],
                    tokenizer: {
                        root: [
                            [/\/\/.*$/, 'comment'],
                            [/\/\*/, 'comment', '@block'],
                            [/"[^"]*"/, 'string'],
                            [/'[^']*'/, 'string'],
                            [/\b\d+(\.\d+)?\b/, 'number'],
                            [/\b(true|false|null|nil|pi|this|thiso|temp|player|server|client)\b/, 'keyword.builtin'],
                            [/[a-zA-Z_]\w*(?=\s*\()/, 'function.call'],
                            [/[a-zA-Z_$]\w*/, { cases: { '@keywords': 'keyword', '@default': 'identifier' } }],
                            [/[=<>!+\-*\/%&|^~?]/, 'operator'],
                        ],
                        block: [[/[^/*]+/, 'comment'], [/\*\//, 'comment', '@pop'], [/[/*]/, 'comment']],
                    }
                });
                monaco.editor.defineTheme('graal-default', {
                    base: 'vs-dark', inherit: true,
                    rules: [
                        { token: 'comment', foreground: '75715e', fontStyle: 'italic' },
                        { token: 'string', foreground: 'e6db74' },
                        { token: 'number', foreground: 'be84ff' },
                        { token: 'keyword', foreground: 'f92672' },
                        { token: 'keyword.builtin', foreground: 'be84ff' },
                        { token: 'function.call', foreground: 'a6e22b' },
                    ],
                    colors: { 'editor.background': '#1e1f1b' }
                });
                monaco.editor.defineTheme('graal-active', {
                    base: 'vs-dark', inherit: true,
                    rules: [
                        { token: 'comment', foreground: '75715e', fontStyle: 'italic' },
                        { token: 'string', foreground: 'e6db74' },
                        { token: 'number', foreground: 'be84ff' },
                        { token: 'keyword', foreground: 'f92672' },
                        { token: 'keyword.builtin', foreground: 'be84ff' },
                        { token: 'function.call', foreground: 'a6e22b' },
                    ],
                    colors: { 'editor.background': '#1e1f1b' }
                });
                let _defs = null;
                const _loadDefs = () => {
                    if (_defs) return Promise.resolve(_defs);
                    return fetch('https://api.gscript.dev').then(r => r.json()).then(d => { _defs = d; return d; }).catch(() => ({}));
                };
                monaco.languages.registerCompletionItemProvider('graalscript', {
                    triggerCharacters: ['$', '_'],
                    provideCompletionItems: (model, position) => _loadDefs().then(defs => {
                        const word = model.getWordUntilPosition(position);
                        const range = { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: word.startColumn, endColumn: word.endColumn };
                        const pfx = word.word.toLowerCase();
                        const suggestions = Object.entries(defs)
                            .filter(([name]) => pfx === '' || name.toLowerCase().startsWith(pfx))
                            .map(([name, info]) => {
                                const isVar = name.startsWith('$');
                                const params = info.params?.length ? info.params : [];
                                const snippet = isVar ? name : (params.length ? `${name}(${params.map((p,i) => `\${${i+1}:${p}}`).join(', ')})` : `${name}($0)`);
                                return { label: name, kind: isVar ? monaco.languages.CompletionItemKind.Variable : monaco.languages.CompletionItemKind.Function, insertText: snippet, insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: [info.scope, info.returns ? `→ ${info.returns}` : ''].filter(Boolean).join(' '), documentation: info.description || '', range };
                            });
                        return { suggestions };
                    })
                });
                monaco.languages.registerHoverProvider('graalscript', {
                    provideHover: (model, position) => _loadDefs().then(defs => {
                        const word = model.getWordAtPosition(position);
                        if (!word) return null;
                        const info = defs[word.word] || defs['$' + word.word];
                        if (!info) return null;
                        const params = info.params?.length ? `(${info.params.join(', ')})` : '()';
                        const ret = info.returns ? ` → ${info.returns}` : '';
                        const contents = [{ value: `**${word.word}**\`${params}${ret}\`` }, ...(info.description ? [{ value: info.description }] : [])];
                        return { contents };
                    })
                });
                resolve(monaco);
            });
        });
    }

    saveSessionDebounced() {
        if (this._saveTimer) clearTimeout(this._saveTimer);
        this._saveTimer = setTimeout(() => this.saveSession(), 400);
    }

    _b64(buf) { let b = ''; for (let i = 0; i < buf.length; i++) b += String.fromCharCode(buf[i]); return btoa(b); }
    _fromB64(b64) { const s = atob(b64); const a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a.buffer; }
    saveSession() {
        try {
            if (!this.levels.length) return;
            const data = {
                formatVersion: 3,
                levels: this.levels.map(l => l.gmapText
                    ? { ...this._serializeGmapEntry(l), tiledefs: l.level._tiledefs || [] }
                    : (l.level._sourceFormat === 'graal' || l.level._sourceFormat === 'zelda')
                        ? { graalBinary: this._b64(l.level.saveToGraal(l.level._sourceFormat === 'zelda')), name: l.name, tilesetName: l.level.tilesetName || 'pics1.png', modified: l.modified, sourceFormat: l.level._sourceFormat, tiledefs: l.level._tiledefs || [] }
                        : { nw: l.level.saveToNW(), name: l.name, tilesetName: l.level.tilesetName || 'pics1.png', modified: l.modified, sourceFormat: l.level._sourceFormat || null, tiledefs: l.level._tiledefs || [] }),
                currentLevelIndex: this.currentLevelIndex,
                zoom: this.zoomLevel,
                panX: this.panX,
                panY: this.panY,
                currentLayer: this.currentLayer,
                showGrid: this.showGrid,
                currentTool: this.currentTool
            };
            localStorage.setItem('levelEditorSession', JSON.stringify(data));
        } catch(e) {}
    }

    restoreSession() {
        try {
            const raw = localStorage.getItem('levelEditorSession');
            if (!raw) return false;
            const data = JSON.parse(raw);
            if (data.level) {
                const level = Level.loadFromNW(data.level);
                if (level) {
                    this.level = level;
                    this.level.tilesetName = data.tilesetName || 'pics1.png';
                }
            }
            if (data.zoom !== undefined) { this.zoomLevel = data.zoom; this.updateZoomFromLevel(); }
            if (data.panX !== undefined) this.panX = data.panX;
            if (data.panY !== undefined) this.panY = data.panY;
            if (data.currentLayer !== undefined) this.currentLayer = data.currentLayer;
            if (data.showGrid !== undefined) this.showGrid = data.showGrid;
            return true;
        } catch(e) { return false; }
    }

    _makeDialogDraggable(overlay, box, titleEl) {
        titleEl.style.cursor = 'move';
        let ox = 0, oy = 0, dragging = false;
        titleEl.addEventListener('mousedown', e => {
            if (e.target.closest('button,input,label,select')) return;
            dragging = true;
            const r = box.getBoundingClientRect();
            ox = e.clientX - r.left; oy = e.clientY - r.top;
            box.style.position = 'fixed'; box.style.margin = '0';
            box.style.left = r.left + 'px'; box.style.top = r.top + 'px';
            overlay.style.justifyContent = 'unset'; overlay.style.alignItems = 'unset';
            e.preventDefault();
        });
        const onMove = e => { if (!dragging) return; box.style.left = (e.clientX - ox) + 'px'; box.style.top = (e.clientY - oy) + 'px'; };
        const onUp = () => dragging = false;
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    }

    openNPCEditor(obj) {
        const p = obj.properties || (obj.properties = {});
        const dialog = document.createElement('div');
        dialog.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:transparent;z-index:10000;display:flex;justify-content:center;align-items:center;';
        const box = document.createElement('div');
        box.style.cssText = 'width:680px;max-width:95vw;height:55vh;display:flex;flex-direction:column;background:#2b2b2b;border:2px solid #1a1a1a;'; box.classList.add('ed-dialog-box');
        box.innerHTML = `
            <div id="npcTitlebar" style="padding:8px 12px;background:#353535;display:flex;align-items:center;gap:8px;flex-shrink:0;user-select:none;">
                <img src="images/npc.png" style="width:16px;height:16px;image-rendering:pixelated;flex-shrink:0;">
                <span style="flex:1;font-size:13px;">NPC Script Editor</span>
                <label style="font-size:11px;">Image: <input id="npcImageInput" value="${p.image||''}" style="width:120px;background:#1a1a1a;color:#e0e0e0;border:1px solid #555;padding:2px 4px;"></label>
            </div>
            <div id="npcMonacoContainer" style="flex:1;min-height:0;position:relative;overflow:hidden;"></div>
            <div id="npcTestOutput" style="display:none;max-height:90px;overflow-y:auto;background:#111;border-top:1px solid #333;padding:4px 8px;font-family:monospace;font-size:11px;flex-shrink:0;"></div>
            <div style="padding:8px 12px;background:#353535;text-align:right;flex-shrink:0;gap:8px;display:flex;justify-content:flex-end;">
                <button id="npcTest" style="padding:4px 14px;cursor:pointer;background:#333;color:#e0e0e0;border:1px solid #555;margin-right:auto;">&#9654; Test</button>
                <button id="npcCancel" style="padding:4px 14px;cursor:pointer;background:#444;color:#e0e0e0;border:1px solid #555;">Cancel</button>
                <button id="npcSave" style="padding:4px 14px;cursor:pointer;background:#4472C4;color:#fff;border:1px solid #3060a0;">Save</button>
            </div>`;
        dialog.appendChild(box);
        document.body.appendChild(dialog);
        const container = box.querySelector('#npcMonacoContainer');
        let ed = null;
        if (window.monacoReady) {
            window.monacoReady.then(mc => {
                if (!mc) { fallback(); return; }
                ed = mc.editor.create(container, { value: p.code || '', language: 'graalscript', theme: 'graal-active', minimap:{enabled:false}, scrollBeyondLastLine:false, fontSize:12, fontFamily:'monospace', automaticLayout:true, wordWrap:'on' });
            });
        } else { fallback(); }
        function fallback() {
            const ta = document.createElement('textarea');
            ta.value = p.code || '';
            ta.style.cssText = 'width:100%;height:100%;background:#1e1e1e;color:#e0e0e0;border:none;padding:8px;font-family:monospace;font-size:12px;resize:none;outline:none;box-sizing:border-box;';
            container.appendChild(ta);
            ed = { getValue: () => ta.value, dispose: () => {} };
        }
        const removeDrag = this._makeDialogDraggable(dialog, box, box.querySelector('#npcTitlebar'));
        const close = () => { removeDrag(); if (ed) ed.dispose(); document.body.removeChild(dialog); };
        dialog._closeModal = close;
        box.querySelector('#npcCancel').onclick = close;
        box.querySelector('#npcTest').onclick = () => {
            const code = ed ? ed.getValue() : '';
            const out = box.querySelector('#npcTestOutput');
            const errs = this._gsLint(code);
            out.style.display = 'block';
            if (!errs.length) { out.style.color = '#4c4'; out.textContent = 'No syntax errors found.'; return; }
            out.style.color = '';
            out.innerHTML = errs.map(e => `<div style="color:${e.severity===8?'#f66':'#fa4'};">[line ${e.startLineNumber}:${e.startColumn}] ${e.message}</div>`).join('');
        };
        box.querySelector('#npcSave').onclick = () => {
            p.code = ed ? ed.getValue() : '';
            p.image = box.querySelector('#npcImageInput').value;
            delete obj._ganiOX; delete obj._ganiOY; delete obj._imgW; delete obj._imgH; delete obj._shapeCache; delete obj._imgpart; delete obj._stretchx; delete obj._stretchy; delete obj._tightBounds; delete obj._xOff; delete obj._yOff;
            close();
            this.applyTiledefFromNPCs();
            this.render();
            this.saveSessionDebounced();
        };
        dialog.onclick = e => { if (e.target === dialog) close(); };
        const npcImgInput = box.querySelector('#npcImageInput');
        npcImgInput.addEventListener('focus', () => {
            if (!this.fileCache.images.size) return;
            const existing = box.querySelector('#npcImgDropdown');
            if (existing) return;
            const dd = document.createElement('div');
            dd.id = 'npcImgDropdown';
            dd.style.cssText = 'position:absolute;background:#1a1a1a;border:1px solid #555;z-index:10001;max-height:150px;overflow-y:auto;min-width:160px;';
            const inputRect = npcImgInput.getBoundingClientRect();
            dd.style.top = (inputRect.bottom + window.scrollY) + 'px';
            dd.style.left = (inputRect.left + window.scrollX) + 'px';
            for (const name of this.fileCache.images.keys()) {
                const item = document.createElement('div');
                item.textContent = name;
                item.style.cssText = 'padding:4px 8px;cursor:pointer;font-size:11px;color:#e0e0e0;';
                item.onmouseover = () => item.style.background = '#404040';
                item.onmouseout = () => item.style.background = '';
                item.onmousedown = (ev) => { ev.preventDefault(); npcImgInput.value = name; dd.remove(); };
                dd.appendChild(item);
            }
            document.body.appendChild(dd);
            npcImgInput.addEventListener('blur', () => setTimeout(() => dd.remove(), 150), { once: true });
        });
    }

    openEditLinksDialog() {
        const dlg = document.createElement('div');
        dlg.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:transparent;z-index:10000;display:flex;justify-content:center;align-items:center;';
        const box = document.createElement('div');
        box.style.cssText = 'width:580px;max-width:98vw;display:flex;flex-direction:column;background:#2b2b2b;border:2px solid #1a1a1a;max-height:80vh;'; box.classList.add('ed-dialog-box');
        const thStyle = 'padding:4px 8px;text-align:left;border-bottom:1px solid #1a1a1a;color:#aaa;font-size:12px;';
        const tdStyle = 'padding:3px 8px;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:120px;';
        let selectedLink = null;
        const buildRows = () => {
            const links = this.level.objects.filter(o => o.type === 'link');
            return links.map((o, i) => {
                const p = o.properties || {};
                return `<tr data-idx="${i}" style="cursor:pointer;" onclick="this.closest('table').querySelectorAll('tr').forEach(r=>r.style.background='');this.style.background='#2a4a6a';window._editLinksSel=${i};" ondblclick="window._editLinksEdit&&window._editLinksEdit(${i});">
                    <td style="${tdStyle}">${o.x}</td><td style="${tdStyle}">${o.y}</td>
                    <td style="${tdStyle}">${p.width||1}</td><td style="${tdStyle}">${p.height||1}</td>
                    <td style="${tdStyle}">${p.nextX||0}</td><td style="${tdStyle}">${p.nextY||0}</td>
                    <td style="${tdStyle};max-width:160px;">${p.nextLevel||''}</td>
                </tr>`;
            }).join('') || `<tr><td colspan="7" style="padding:8px;color:#666;font-size:12px;">No links</td></tr>`;
        };
        box.innerHTML = `
            <div id="elTitlebar" class="dialog-titlebar" style="padding:8px 12px;background:#353535;font-size:13px;display:flex;align-items:center;gap:8px;user-select:none;flex-shrink:0;">
                <i class="fas fa-link" style="display:inline-block;width:16px;height:16px;background-image:url('icons/link.svg');background-size:contain;background-repeat:no-repeat;filter:brightness(0) invert(1);"></i>
                <span>Edit Links:</span>
            </div>
            <div style="overflow:auto;flex:1;">
                <table id="elTable" style="width:100%;border-collapse:collapse;">
                    <thead><tr>
                        <th style="${thStyle}">X</th><th style="${thStyle}">Y</th>
                        <th style="${thStyle}">Width</th><th style="${thStyle}">Height</th>
                        <th style="${thStyle}">New X</th><th style="${thStyle}">New Y</th>
                        <th style="${thStyle}">Destination</th>
                    </tr></thead>
                    <tbody id="elBody">${buildRows()}</tbody>
                </table>
            </div>
            <div class="dialog-toolbar" style="padding:8px 12px;background:#353535;display:flex;gap:8px;align-items:center;">
                <button id="elEdit" style="padding:4px 12px;cursor:pointer;background:#4472C4;color:#fff;border:1px solid #3060a0;font-size:12px;">&#x270F; Edit</button>
                <button id="elDelete" style="padding:4px 12px;cursor:pointer;background:#333;color:#e0e0e0;border:1px solid #555;font-size:12px;">&#x1F5D1; Delete</button>
                <span style="flex:1;"></span>
                <button id="elClose" style="padding:4px 14px;cursor:pointer;background:#444;color:#e0e0e0;border:1px solid #555;font-size:12px;">Close</button>
            </div>`;
        dlg.appendChild(box);
        document.body.appendChild(dlg);
        window._editLinksSel = -1;
        const refresh = () => { box.querySelector('#elBody').innerHTML = buildRows(); window._editLinksSel = -1; this.render(); };
        const getLink = (idx) => { const links = this.level.objects.filter(o => o.type === 'link'); return links[idx ?? window._editLinksSel] || null; };
        window._editLinksEdit = (idx) => { const o = getLink(idx); if (o) { window._editLinksSel = idx; this.openLinkEditor(o); refresh(); } };
        box.querySelector('#elEdit').onclick = () => window._editLinksEdit(window._editLinksSel);
        box.querySelector('#elDelete').onclick = () => { const o = getLink(); if (o) { this.pushUndo(); this.level.removeObject(o); refresh(); this.saveSessionDebounced(); } };
        const removeDrag = this._makeDialogDraggable(dlg, box, box.querySelector('#elTitlebar'));
        const close = () => { delete window._editLinksEdit; removeDrag(); document.body.removeChild(dlg); };
        box.querySelector('#elClose').onclick = close;
        dlg.onclick = e => { if (e.target === dlg) close(); };
    }

    openEditSignsDialog() {
        const dlg = document.createElement('div');
        dlg.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:transparent;z-index:10000;display:flex;justify-content:center;align-items:center;';
        const box = document.createElement('div');
        box.style.cssText = 'width:460px;max-width:98vw;display:flex;flex-direction:column;background:#2b2b2b;border:2px solid #1a1a1a;max-height:80vh;'; box.classList.add('ed-dialog-box');
        const thStyle = 'padding:4px 8px;text-align:left;border-bottom:1px solid #1a1a1a;color:#aaa;font-size:12px;';
        const tdStyle = 'padding:3px 8px;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
        const buildRows = () => {
            const signs = this.level.objects.filter(o => o.type === 'sign');
            return signs.map((o, i) => {
                const text = (o.properties?.text || '').replace(/\n/g, ' ').substring(0, 60);
                return `<tr data-idx="${i}" style="cursor:pointer;" onclick="this.closest('table').querySelectorAll('tr').forEach(r=>r.style.background='');this.style.background='#2a4a6a';window._editSignsSel=${i};" ondblclick="window._editSignsEdit&&window._editSignsEdit(${i});">
                    <td style="${tdStyle}">${o.x}</td><td style="${tdStyle}">${o.y}</td>
                    <td style="${tdStyle};max-width:200px;">${text}</td>
                </tr>`;
            }).join('') || `<tr><td colspan="3" style="padding:8px;color:#666;font-size:12px;">No signs</td></tr>`;
        };
        box.innerHTML = `
            <div id="esTitlebar" class="dialog-titlebar" style="padding:8px 12px;background:#353535;font-size:13px;display:flex;align-items:center;gap:8px;user-select:none;flex-shrink:0;">
                <i class="fas fa-sign" style="display:inline-block;width:16px;height:16px;background-image:url('icons/sign.svg');background-size:contain;background-repeat:no-repeat;filter:brightness(0) invert(1);"></i>
                <span>Edit Signs:</span>
            </div>
            <div style="overflow:auto;flex:1;">
                <table id="esTable" style="width:100%;border-collapse:collapse;">
                    <thead><tr>
                        <th style="${thStyle}">X</th><th style="${thStyle}">Y</th><th style="${thStyle}">Text</th>
                    </tr></thead>
                    <tbody id="esBody">${buildRows()}</tbody>
                </table>
            </div>
            <div class="dialog-toolbar" style="padding:8px 12px;background:#353535;display:flex;gap:8px;align-items:center;">
                <button id="esCreate" style="padding:4px 12px;cursor:pointer;background:#4472C4;color:#fff;border:1px solid #3060a0;font-size:12px;">Create</button>
                <span style="font-size:12px;color:#aaa;">X:</span>
                <input id="esX" type="number" value="0" style="width:50px;background:#1a1a1a;color:#e0e0e0;border:1px solid #555;padding:2px 4px;font-size:12px;">
                <span style="font-size:12px;color:#aaa;">Y:</span>
                <input id="esY" type="number" value="0" style="width:50px;background:#1a1a1a;color:#e0e0e0;border:1px solid #555;padding:2px 4px;font-size:12px;">
                <span style="flex:1;"></span>
            </div>
            <div class="dialog-toolbar" style="padding:8px 12px;background:#353535;border-top:1px solid #1a1a1a;display:flex;gap:8px;align-items:center;">
                <button id="esDelete" style="padding:4px 12px;cursor:pointer;background:#333;color:#e0e0e0;border:1px solid #555;font-size:12px;">&#x1F5D1; Delete</button>
                <span style="flex:1;"></span>
                <button id="esOk" style="padding:4px 14px;cursor:pointer;background:#444;color:#e0e0e0;border:1px solid #555;font-size:12px;">Ok</button>
            </div>`;
        dlg.appendChild(box);
        document.body.appendChild(dlg);
        window._editSignsSel = -1;
        const refresh = () => { box.querySelector('#esBody').innerHTML = buildRows(); window._editSignsSel = -1; this.render(); };
        const getSign = (idx) => { const signs = this.level.objects.filter(o => o.type === 'sign'); return signs[idx ?? window._editSignsSel] || null; };
        window._editSignsEdit = (idx) => { const o = getSign(idx); if (o) { window._editSignsSel = idx; this.openSignEditor(o); refresh(); } };
        box.querySelector('#esCreate').onclick = () => {
            const x = parseInt(box.querySelector('#esX').value) || 0;
            const y = parseInt(box.querySelector('#esY').value) || 0;
            this.pushUndo();
            const o = new LevelObject(x, y, 'sign');
            o.properties = { text: '', layerIndex: 0 };
            this.level.addObject(o);
            refresh(); this.saveSessionDebounced();
            this.openSignEditor(o);
        };
        box.querySelector('#esDelete').onclick = () => { const o = getSign(); if (o) { this.pushUndo(); this.level.removeObject(o); refresh(); this.saveSessionDebounced(); } };
        const removeDrag = this._makeDialogDraggable(dlg, box, box.querySelector('#esTitlebar'));
        const close = () => { delete window._editSignsEdit; removeDrag(); document.body.removeChild(dlg); };
        box.querySelector('#esOk').onclick = close;
        dlg.onclick = e => { if (e.target === dlg) close(); };
    }

    openSignEditor(obj) {
        const p = obj.properties || (obj.properties = {});
        const dialog = document.createElement('div');
        dialog.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:transparent;z-index:10000;display:flex;justify-content:center;align-items:center;';
        const box = document.createElement('div');
        box.style.cssText = 'width:500px;max-width:95vw;display:flex;flex-direction:column;background:#2b2b2b;border:2px solid #1a1a1a;'; box.classList.add('ed-dialog-box');
        box.innerHTML = `
            <div id="signTitlebar" style="padding:8px 12px;background:#353535;font-size:13px;flex-shrink:0;display:flex;align-items:center;gap:8px;user-select:none;">
                <img src="images/sign.png" style="width:16px;height:16px;image-rendering:pixelated;flex-shrink:0;">
                <span>Sign Text</span>
            </div>
            <textarea id="signText" style="flex:1;min-height:200px;background:#1e1e1e;color:#e0e0e0;border:none;padding:8px;font-family:monospace;font-size:12px;resize:vertical;outline:none;box-sizing:border-box;">${(p.text||'').replace(/</g,'&lt;')}</textarea>
            <div style="padding:8px 12px;background:#353535;text-align:right;gap:8px;display:flex;justify-content:flex-end;">
                <button id="signCancel" style="padding:4px 14px;cursor:pointer;background:#444;color:#e0e0e0;border:1px solid #555;">Cancel</button>
                <button id="signSave" style="padding:4px 14px;cursor:pointer;background:#4472C4;color:#fff;border:1px solid #3060a0;">Save</button>
            </div>`;
        dialog.appendChild(box);
        document.body.appendChild(dialog);
        const ta = box.querySelector('#signText');
        ta.value = p.text || '';
        const removeDrag = this._makeDialogDraggable(dialog, box, box.querySelector('#signTitlebar'));
        const close = () => { removeDrag(); document.body.removeChild(dialog); };
        box.querySelector('#signCancel').onclick = close;
        box.querySelector('#signSave').onclick = () => { p.text = ta.value; close(); this.saveSessionDebounced(); };
        dialog.onclick = e => { if (e.target === dialog) close(); };
    }

    openLinkEditor(obj) {
        const p = obj.properties || (obj.properties = {});
        const dialog = document.createElement('div');
        dialog.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:transparent;z-index:10000;display:flex;justify-content:center;align-items:center;';
        const box = document.createElement('div');
        box.style.cssText = 'width:420px;max-width:95vw;display:flex;flex-direction:column;background:#2b2b2b;border:2px solid #1a1a1a;'; box.classList.add('ed-dialog-box');
        const field = (label, id, val) => `<label style="display:flex;align-items:center;gap:8px;padding:4px 12px;font-size:12px;">${label}<input id="${id}" value="${val||''}" style="flex:1;background:#1a1a1a;color:#e0e0e0;border:1px solid #555;padding:3px 6px;"></label>`;
        box.innerHTML = `
            <div id="lkTitlebar" style="padding:8px 12px;background:#353535;font-size:13px;display:flex;align-items:center;gap:8px;user-select:none;"><i class="fas fa-arrow-right" style="color:#ffd700;"></i><span>Link Properties</span></div>
            ${field('Next Level', 'lkNext', p.nextLevel)}
            ${field('Next X', 'lkNextX', p.nextX)}
            ${field('Next Y', 'lkNextY', p.nextY)}
            ${field('Width (tiles)', 'lkW', p.width||1)}
            ${field('Height (tiles)', 'lkH', p.height||1)}
            <div style="padding:8px 12px;background:#353535;gap:8px;display:flex;align-items:center;">
                <button id="lkHelper" style="padding:4px 12px;cursor:pointer;background:#3a3a3a;color:#ffd700;border:1px solid #555;font-size:12px;">&#128279; Link Helper</button>
                <span style="flex:1;"></span>
                <button id="lkCancel" style="padding:4px 14px;cursor:pointer;background:#444;color:#e0e0e0;border:1px solid #555;">Cancel</button>
                <button id="lkSave" style="padding:4px 14px;cursor:pointer;background:#4472C4;color:#fff;border:1px solid #3060a0;">Save</button>
            </div>`;
        dialog.appendChild(box);
        document.body.appendChild(dialog);
        const removeDrag = this._makeDialogDraggable(dialog, box, box.querySelector('#lkTitlebar'));
        const close = () => { removeDrag(); document.body.removeChild(dialog); };
        box.querySelector('#lkCancel').onclick = close;
        box.querySelector('#lkSave').onclick = () => {
            p.nextLevel = box.querySelector('#lkNext').value;
            p.nextX = box.querySelector('#lkNextX').value;
            p.nextY = box.querySelector('#lkNextY').value;
            p.width = parseInt(box.querySelector('#lkW').value) || 1;
            p.height = parseInt(box.querySelector('#lkH').value) || 1;
            close(); this.render(); this.saveSessionDebounced();
        };
        box.querySelector('#lkHelper').onclick = () => this._openLinkHelper(box, p, this.currentLevelIndex);
        dialog.onclick = e => { if (e.target === dialog) close(); };
    }

    _showLinkPickConfirm(result) {
        const existing = document.getElementById('_linkPickConfirm');
        if (existing) existing.parentNode?.removeChild(existing);
        const panel = document.createElement('div');
        panel.id = '_linkPickConfirm';
        const w = result.x2 - result.x1 + 1, h = result.y2 - result.y1 + 1;
        const typeLabel = result.existingLink ? '&#128279; Existing Link' : result.fromPlayMode ? '&#127938; Play Mode Pin' : '&#9632; New Destination';
        panel.style.cssText = 'position:fixed;bottom:54px;left:50%;transform:translateX(-50%);z-index:10003;background:#1e1e1e;border:2px solid #ffd700;padding:0;font-family:chevyray,monospace;font-size:12px;color:#e0e0e0;display:flex;flex-direction:column;min-width:300px;max-width:440px;user-select:none;';
        panel.innerHTML = `
            <div id="_lhcTitlebar" style="padding:8px 14px;background:#2a2a2a;border-bottom:1px solid #444;color:#ffd700;font-size:13px;font-weight:bold;cursor:grab;display:flex;align-items:center;gap:8px;">${typeLabel}<span style="font-size:10px;color:#666;margin-left:auto;">drag to move</span></div>
            <div style="padding:10px 14px;display:grid;grid-template-columns:auto 1fr;gap:4px 12px;align-items:center;">
                <span style="color:#888;">Level</span>
                <input id="_lhcLevel" value="${result.nextLevel||''}" style="background:#111;color:#fff;border:1px solid #555;padding:3px 6px;font-family:inherit;font-size:12px;">
                <span style="color:#888;">X</span>
                <input id="_lhcX" value="${result.nextX||'0'}" style="background:#111;color:#fff;border:1px solid #555;padding:3px 6px;font-family:inherit;font-size:12px;">
                <span style="color:#888;">Y</span>
                <input id="_lhcY" value="${result.nextY||'0'}" style="background:#111;color:#fff;border:1px solid #555;padding:3px 6px;font-family:inherit;font-size:12px;">
                ${!result.existingLink && !result.fromPlayMode ? `<span style="color:#888;">Size</span><span style="color:#aaa;">${w} × ${h} tiles</span>` : ''}
            </div>
            <div style="padding:8px 14px;border-top:1px solid #333;display:flex;gap:8px;justify-content:flex-end;">
                <button id="_lhcRetry" style="padding:4px 12px;cursor:pointer;background:#444;color:#e0e0e0;border:1px solid #555;">Retry</button>
                <button id="_lhcCancel" style="padding:4px 12px;cursor:pointer;background:#444;color:#e0e0e0;border:1px solid #555;">Cancel</button>
                <button id="_lhcAccept" style="padding:4px 14px;cursor:pointer;background:#4472C4;color:#fff;border:1px solid #3060a0;font-weight:bold;">Accept</button>
            </div>`;
        document.body.appendChild(panel);
        this._makeDialogDraggable(panel, panel, panel.querySelector('#_lhcTitlebar'));
        const remove = () => panel.parentNode?.removeChild(panel);
        panel.querySelector('#_lhcAccept').onclick = () => {
            result.nextLevel = panel.querySelector('#_lhcLevel').value;
            result.nextX = panel.querySelector('#_lhcX').value;
            result.nextY = panel.querySelector('#_lhcY').value;
            remove(); this._linkPickCallback(result);
        };
        panel.querySelector('#_lhcCancel').onclick = () => { remove(); this._linkPickMode = false; document.getElementById('_linkPickBanner')?.parentNode?.removeChild(document.getElementById('_linkPickBanner')); };
        panel.querySelector('#_lhcRetry').onclick = () => { remove(); this.requestRender(); };
    }

    _openLinkHelper(linkBox, linkProps, originLevelIdx) {
        if (this._linkPickMode) return;
        const originLevelIndex = originLevelIdx ?? this.currentLevelIndex;
        const originLevel = this.levels[originLevelIndex]?.name || '';
        const banner = document.createElement('div');
        banner.id = '_linkPickBanner';
        banner.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:10002;background:rgba(20,20,20,0.92);border-top:2px solid #ffd700;padding:10px 18px;display:flex;align-items:center;gap:14px;font-family:chevyray,monospace;font-size:12px;';
        banner.innerHTML = `
            <span style="color:#ffd700;font-size:14px;">&#128279;</span>
            <span style="color:#e0e0e0;">Link Helper — <b>drag tiles</b> or <b>click a link</b> to set destination. Or enter play mode and press <b style="color:#ffd700;">Space</b> to pin your position.</span>
            <span style="color:#888;margin-left:6px;">From: <b style="color:#aaa;">${originLevel}</b></span>
            <button id="_lhPlayMode" style="padding:4px 12px;cursor:pointer;background:#2a5a2a;color:#7fff7f;border:1px solid #3a8a3a;font-size:12px;margin-left:auto;">&#9654; Play Mode</button>
            <button id="_lhPickCancel" style="padding:4px 14px;cursor:pointer;background:#444;color:#e0e0e0;border:1px solid #555;font-size:12px;">Cancel</button>`;
        document.body.appendChild(banner);
        const linkDialog = linkBox?.parentElement;
        if (linkDialog) linkDialog.style.display = 'none';
        this._linkPickMode = true;
        const cancel = () => {
            this._linkPickMode = false;
            if (linkDialog) linkDialog.style.display = '';
            banner.parentNode?.removeChild(banner);
        };
        banner.querySelector('#_lhPickCancel').onclick = cancel;
        banner.querySelector('#_lhPlayMode').onclick = () => { if (!this._playMode) this.enterPlayMode(); };
        this._linkPickCallback = (result) => {
            this._linkPickMode = false;
            banner.parentNode?.removeChild(banner);
            if (linkDialog) linkDialog.style.display = '';
            if (linkBox.isConnected) {
                linkBox.querySelector('#lkNext').value = result.nextLevel;
                linkBox.querySelector('#lkNextX').value = result.nextX;
                linkBox.querySelector('#lkNextY').value = result.nextY;
            }
            if (linkProps) {
                linkProps.nextLevel = result.nextLevel;
                linkProps.nextX = result.nextX;
                linkProps.nextY = result.nextY;
            }
            if (originLevelIndex !== this.currentLevelIndex) this.switchLevel(originLevelIndex);
            this.saveSessionDebounced();
        };
    }

    openChestEditor(obj) {
        const p = obj.properties || (obj.properties = {});
        const dialog = document.createElement('div');
        dialog.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:transparent;z-index:10000;display:flex;justify-content:center;align-items:center;';
        const box = document.createElement('div');
        box.style.cssText = 'width:380px;max-width:95vw;display:flex;flex-direction:column;background:#2b2b2b;border:2px solid #1a1a1a;'; box.classList.add('ed-dialog-box');
        const field = (label, id, val) => `<label style="display:flex;align-items:center;gap:8px;padding:4px 12px;font-size:12px;">${label}<input id="${id}" value="${val||''}" style="flex:1;background:#1a1a1a;color:#e0e0e0;border:1px solid #555;padding:3px 6px;"></label>`;
        const itemOpts = CHEST_ITEMS
            .map(i => `<option value="${i}"${i===(p.itemName||'greenrupee')?' selected':''}>${i}</option>`).join('');
        box.innerHTML = `
            <div id="chTitlebar" style="padding:8px 12px;background:#353535;font-size:13px;display:flex;align-items:center;gap:8px;user-select:none;"><img src="images/chest.png" style="width:16px;height:16px;image-rendering:pixelated;flex-shrink:0;"><span>Chest Properties</span></div>
            <label style="display:flex;align-items:center;gap:8px;padding:4px 12px;font-size:12px;">Item<select id="chItem" style="flex:1;background:#1a1a1a;color:#e0e0e0;border:1px solid #555;padding:3px 6px;">${itemOpts}</select></label>
            ${field('Sign Index', 'chSign', p.signIndex||0)}
            <div style="padding:8px 12px;background:#353535;text-align:right;gap:8px;display:flex;justify-content:flex-end;">
                <button id="chCancel" style="padding:4px 14px;cursor:pointer;background:#444;color:#e0e0e0;border:1px solid #555;">Cancel</button>
                <button id="chSave" style="padding:4px 14px;cursor:pointer;background:#4472C4;color:#fff;border:1px solid #3060a0;">Save</button>
            </div>`;
        dialog.appendChild(box);
        document.body.appendChild(dialog);
        const removeDrag = this._makeDialogDraggable(dialog, box, box.querySelector('#chTitlebar'));
        const close = () => { removeDrag(); document.body.removeChild(dialog); };
        box.querySelector('#chCancel').onclick = close;
        box.querySelector('#chSave').onclick = () => {
            p.itemName = box.querySelector('#chItem').value;
            p.signIndex = parseInt(box.querySelector('#chSign').value) || 0;
            close(); this.saveSessionDebounced();
        };
        dialog.onclick = e => { if (e.target === dialog) close(); };
    }
    openBaddyEditor(obj) {
        const p = obj.properties || (obj.properties = {});
        const types = ['Gray Soldier','Blue Soldier','Red Soldier','Shooting Soldier','Swamp Soldier','Frog','Spider','Golden Warrior','Lizardon','Dragon'];
        const typeMap = ['baddygray','baddyblue','baddyred','baddy','baddyoctopus','baddyhare','baddyninja','baddygold','baddylizardon','baddydragon'];
        const v = p.verses || ['','',''];
        const typeOpts = types.map((t,i) => `<option value="${i}"${i===(p.baddyType||0)?' selected':''}>${t}</option>`).join('');
        const field = (label, id, val) => `<label style="display:flex;align-items:center;gap:8px;padding:4px 12px;font-size:12px;"><span style="width:110px;flex-shrink:0;">${label}</span><input id="${id}" value="${(val||'').replace(/"/g,'&quot;')}" style="flex:1;background:#1a1a1a;color:#e0e0e0;border:1px solid #555;padding:3px 6px;"></label>`;
        const dialog = document.createElement('div');
        dialog.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:transparent;z-index:10000;display:flex;justify-content:center;align-items:center;';
        const box = document.createElement('div');
        box.style.cssText = 'width:420px;max-width:95vw;display:flex;flex-direction:column;background:#2b2b2b;border:2px solid #1a1a1a;'; box.classList.add('ed-dialog-box');
        box.innerHTML = `
            <div id="bdTitlebar" style="padding:8px 12px;background:#353535;font-size:13px;display:flex;align-items:center;gap:8px;user-select:none;">
                <img src="images/baddy.png" style="width:16px;height:24px;image-rendering:pixelated;flex-shrink:0;">
                <span>Edit Baddy</span>
            </div>
            <div style="padding:8px 12px;font-size:12px;color:#aaa;">Baddy options</div>
            <div style="padding:2px 12px;font-size:11px;color:#888;margin-bottom:4px;">Change the baddy type and baddy verses.</div>
            <label style="display:flex;align-items:center;gap:8px;padding:4px 12px;font-size:12px;"><span style="width:110px;flex-shrink:0;">Type:</span><select id="bdType" style="flex:1;background:#1a1a1a;color:#e0e0e0;border:1px solid #555;padding:3px 6px;">${typeOpts}</select><canvas id="bdPreviewCanvas" width="44" height="66" style="image-rendering:pixelated;flex-shrink:0;"></canvas></label>
            ${field('Attack verse:', 'bdAtk', v[0])}
            ${field('Hurt verse:', 'bdHurt', v[1])}
            ${field('Player hurt verse:', 'bdPHurt', v[2])}
            <div style="padding:8px 12px;background:#353535;gap:8px;display:flex;justify-content:flex-end;">
                <button id="bdDelete" style="padding:4px 14px;cursor:pointer;background:#8b0000;color:#fff;border:1px solid #600;"><i class="fas fa-trash" style="margin-right:4px;"></i>Delete</button>
                <button id="bdClose" style="padding:4px 14px;cursor:pointer;background:#444;color:#e0e0e0;border:1px solid #555;">Close</button>
            </div>`;
        dialog.appendChild(box);
        document.body.appendChild(dialog);
        const removeDrag = this._makeDialogDraggable(dialog, box, box.querySelector('#bdTitlebar'));
        const close = () => { removeDrag(); document.body.removeChild(dialog); };
        const crops = BADDY_CROPS;
        const drawPreview = idx => {
            const canvas = box.querySelector('#bdPreviewCanvas');
            if (!canvas) return;
            const [sx, sy, sw, sh] = crops[idx];
            canvas.width = sw; canvas.height = sh;
            const pctx = canvas.getContext('2d');
            const img = this.objectImages?.opps;
            if (img?.complete && img.naturalWidth > 0) pctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
            else { img.onload = () => pctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh); }
        };
        drawPreview(p.baddyType || 0);
        box.querySelector('#bdType').addEventListener('change', e => {
            const idx = parseInt(e.target.value);
            p.baddyType = idx;
            drawPreview(idx);
            this.render();
        });
        box.querySelector('#bdClose').onclick = () => {
            p.baddyType = parseInt(box.querySelector('#bdType').value);
            p.verses = [box.querySelector('#bdAtk').value, box.querySelector('#bdHurt').value, box.querySelector('#bdPHurt').value];
            close(); this.saveSessionDebounced();
        };
        box.querySelector('#bdDelete').onclick = () => {
            this.pushUndo(); this.level.removeObject(obj); close(); this.render(); this.saveSessionDebounced();
        };
        dialog.onclick = e => { if (e.target === dialog) close(); };
    }

    _parseGOBJSET(text) {
        const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        const decode = (a, b) => {
            const g = alpha.indexOf(a) * 64 + alpha.indexOf(b);
            if (g === 2047) return -1;
            const strip = Math.floor(g / 512), within = g % 512;
            const ttx = strip * 16 + (within % 16), tty = Math.floor(within / 16);
            return tty * 128 + ttx;
        };
        const groups = {};
        let curGroup = 'Standard', obj = null;
        for (const raw of text.split('\n')) {
            const line = raw.trim();
            if (line.startsWith('#GROUP ')) { curGroup = line.slice(7).trim(); continue; }
            if (!groups[curGroup]) groups[curGroup] = {};
            if (line.startsWith('OBJECT ')) {
                const p = line.split(' ');
                obj = { tiles: [], width: parseInt(p[1]), height: parseInt(p[2]) };
                groups[curGroup][p.slice(3).join(' ')] = obj;
            } else if (line === 'OBJECTEND') {
                obj = null;
            } else if (obj && line && !line.startsWith('GOBJSET')) {
                const row = [];
                for (let i = 0; i + 1 < line.length; i += 2) row.push(decode(line[i], line[i+1]));
                obj.tiles.push(row);
            }
        }
        return groups;
    }

    initTileObjects() {
        const raw = localStorage.getItem('levelEditorTileObjects');
        this.tileObjects = raw ? JSON.parse(raw) : { Default: {} };
        if (!this.tileObjects.Default) this.tileObjects.Default = {};
        this._builtinKeys = new Set();
        if (typeof BUILTIN_TILE_OBJECTS !== 'undefined') {
            const builtIn = this._parseGOBJSET(BUILTIN_TILE_OBJECTS);
            for (const [g, objs] of Object.entries(builtIn)) {
                if (!this.tileObjects[g]) this.tileObjects[g] = {};
                for (const [name, obj] of Object.entries(objs)) {
                    this.tileObjects[g][name] = obj;
                    this._builtinKeys.add(`${g}/${name}`);
                }
            }
        }
        this._toGroup = () => document.getElementById('tileObjectGroup')?.value || 'Default';
        this._toName = () => document.getElementById('tileObjectName')?.value || '';
        this._saveTileObjects = () => localStorage.setItem('levelEditorTileObjects', JSON.stringify(this.tileObjects));

        const fillGroups = () => {
            const sel = document.getElementById('tileObjectGroup');
            const cur = sel.value;
            sel.innerHTML = Object.keys(this.tileObjects).map(g => `<option${g===cur?' selected':''}>${g}</option>`).join('');
            fillObjects();
        };
        const updateDeleteBtn = () => {
            const btn = document.getElementById('btnDeleteTileObject');
            if (!btn) return;
            const isBuiltin = this._builtinKeys.has(`${this._toGroup()}/${this._toName()}`);
            btn.style.display = isBuiltin ? 'none' : '';
        };
        const fillObjects = () => {
            const sel = document.getElementById('tileObjectName');
            const group = this.tileObjects[this._toGroup()] || {};
            const cur = sel.value;
            const keys = Object.keys(group);
            sel.innerHTML = keys.length ? keys.map(k => `<option${k===cur?' selected':''}>${k}</option>`).join('') : '<option value="">— empty —</option>';
            this._renderTileObjectPreview();
            updateDeleteBtn();
        };

        document.getElementById('tileObjectGroup').addEventListener('change', fillObjects);
        document.getElementById('tileObjectName').addEventListener('change', () => { this._renderTileObjectPreview(); updateDeleteBtn(); });

        document.getElementById('btnNewTileObjectGroup').onclick = () => {
            const box = document.createElement('div');
            box.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#2b2b2b;border:1px solid #404040;padding:14px 18px;z-index:99999;min-width:260px;font-size:13px;color:#e0e0e0;'; box.classList.add('ed-dialog-box');
            box.innerHTML = `<div class="ed-dlg-title">New Group</div>
                <div style="margin-bottom:10px;"><input id="_grpNameInp" style="width:100%;padding:4px 6px;" placeholder="Group name"></div>
                <div style="display:flex;gap:8px;justify-content:flex-end;">
                  <button id="_grpOk" style="padding:4px 10px;">OK</button>
                  <button id="_grpCancel" style="padding:4px 10px;">Cancel</button>
                </div>`;
            document.body.appendChild(box);
            const close = () => box.remove();
            box._closeModal = close;
            document.getElementById('_grpCancel').onclick = close;
            const inp = document.getElementById('_grpNameInp');
            inp.focus();
            document.getElementById('_grpOk').onclick = () => {
                const name = inp.value.trim();
                if (!name || this.tileObjects[name]) return;
                this.tileObjects[name] = {};
                this._saveTileObjects();
                fillGroups();
                document.getElementById('tileObjectGroup').value = name;
                fillObjects();
                close();
            };
            inp.addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('_grpOk').click(); if (e.key === 'Escape') close(); });
        };
        document.getElementById('btnDeleteTileObjectGroup').onclick = () => {
            const g = this._toGroup();
            if (g === 'Default') return;
            const box = document.createElement('div');
            box.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#2b2b2b;border:1px solid #404040;padding:16px 20px;z-index:99999;min-width:280px;font-size:13px;color:#e0e0e0;'; box.classList.add('ed-dialog-box');
            box.innerHTML = `<div class="ed-dlg-title">Delete Group</div>
                <div style="margin-bottom:12px;">Delete group "${g}"?</div>
                <div style="display:flex;gap:8px;justify-content:flex-end;">
                  <button id="_delGrpOk" style="padding:4px 10px;">Delete</button>
                  <button id="_delGrpCancel" style="padding:4px 10px;">Cancel</button>
                </div>`;
            document.body.appendChild(box);
            const close = () => box.remove();
            box._closeModal = close;
            document.getElementById('_delGrpCancel').onclick = close;
            document.getElementById('_delGrpOk').onclick = () => {
                delete this.tileObjects[g];
                this._saveTileObjects();
                fillGroups();
                close();
            };
        };
        document.getElementById('btnNewTileObject').onclick = () => {
            if (!this.selectionStartX < 0 && !this.hasSelection()) {
                const box = document.createElement('div');
                box.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#2b2b2b;border:1px solid #404040;padding:16px 20px;z-index:99999;min-width:280px;font-size:13px;color:#e0e0e0;'; box.classList.add('ed-dialog-box');
                box.innerHTML = `<div class="ed-dlg-title">No Selection</div>
                    <div style="margin-bottom:12px;">Make a tile selection first.</div>
                    <div style="display:flex;gap:8px;justify-content:flex-end;">
                      <button id="_noSelOk" style="padding:4px 10px;">OK</button>
                    </div>`;
                document.body.appendChild(box);
                const close = () => box.remove();
                box._closeModal = close;
                document.getElementById('_noSelOk').onclick = close;
                return;
            }
            const box = document.createElement('div');
            box.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#2b2b2b;border:1px solid #404040;padding:14px 18px;z-index:99999;min-width:260px;font-size:13px;color:#e0e0e0;'; box.classList.add('ed-dialog-box');
            box.innerHTML = `<div class="ed-dlg-title">New Tile Object</div>
                <div style="margin-bottom:10px;"><input id="_objNameInp" style="width:100%;padding:4px 6px;" placeholder="Object name"></div>
                <div style="display:flex;gap:8px;justify-content:flex-end;">
                  <button id="_objOk" style="padding:4px 10px;">OK</button>
                  <button id="_objCancel" style="padding:4px 10px;">Cancel</button>
                </div>`;
            document.body.appendChild(box);
            const close = () => box.remove();
            box._closeModal = close;
            document.getElementById('_objCancel').onclick = close;
            const inp = document.getElementById('_objNameInp');
            inp.focus();
            document.getElementById('_objOk').onclick = () => {
                const name = inp.value.trim();
                if (!name) return;
                close();
                const startX = Math.min(this.selectionStartX, this.selectionEndX);
                const startY = Math.min(this.selectionStartY, this.selectionEndY);
                const endX = Math.max(this.selectionStartX, this.selectionEndX);
                const endY = Math.max(this.selectionStartY, this.selectionEndY);
                const tiles = [];
                for (let y = startY; y <= endY; y++) {
                    const row = [];
                    for (let x = startX; x <= endX; x++) row.push(this.level.getTile(this.currentLayer, x, y));
                    tiles.push(row);
                }
                const g = this._toGroup();
                this.tileObjects[g][name] = { tiles, width: endX - startX + 1, height: endY - startY + 1 };
                this._saveTileObjects();
                fillObjects();
                document.getElementById('tileObjectName').value = name;
                this._renderTileObjectPreview();
            };
            inp.addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('_objOk').click(); if (e.key === 'Escape') close(); });
        };
        document.getElementById('btnDeleteTileObject').onclick = () => {
            const g = this._toGroup(), n = this._toName();
            if (!n || !this.tileObjects[g]?.[n]) return;
            delete this.tileObjects[g][n];
            this._saveTileObjects();
            fillObjects();
        };
        document.getElementById('btnUseTileObject').onclick = () => {
            const obj = this.tileObjects[this._toGroup()]?.[this._toName()];
            if (!obj) return;
            this.selectedTilesetTiles = obj.tiles;
            this.updateSelectedTileDisplay();
            this.setTool('draw');
        };

        document.getElementById('btnExportTileObjects').onclick = () => {
            const data = {};
            for (const [g, objs] of Object.entries(this.tileObjects)) {
                const filtered = {};
                for (const [n, obj] of Object.entries(objs)) { if (!this._builtinKeys.has(`${g}/${n}`)) filtered[n] = obj; }
                if (Object.keys(filtered).length) data[g] = filtered;
            }
            this._downloadFile('tile-objects.json', JSON.stringify(data, null, 2), 'application/json');
        };

        const importInput = document.getElementById('tileObjectsImportInput');
        document.getElementById('btnImportTileObjects').onclick = () => importInput.click();
        importInput.onchange = e => {
            const file = e.target.files[0]; if (!file) return;
            const r = new FileReader();
            r.onload = ev => {
                try {
                    const imported = JSON.parse(ev.target.result);
                    for (const [g, objs] of Object.entries(imported)) {
                        if (!this.tileObjects[g]) this.tileObjects[g] = {};
                        for (const [n, obj] of Object.entries(objs)) this.tileObjects[g][n] = obj;
                    }
                    this._saveTileObjects();
                    fillGroups();
                } catch(err) { console.error('Import failed:', err); }
            };
            r.readAsText(file);
            importInput.value = '';
        };

        fillGroups();
    }

    applyColorScheme(scheme) {
        const oldStyle = document.getElementById('colorSchemeStyle');
        if (oldStyle) oldStyle.remove();
        const tag = document.getElementById('levelEditorCustomUserCSS');
        if (tag) tag.textContent = '';
        localStorage.removeItem('levelEditorCustomCSS');
        const schemes = {
            'fusion-light': { bg:'#f5f5f5', panel:'#ffffff', border:'#d0d0d0', text:'#1a1a1a', hover:'#e8e8e8', button:'#ffffff', buttonText:'#1a1a1a', buttonHover:'#f0f0f0', tabActive:'#ffffff', inputBg:'#ffffff' },
            'fusion-dark':  { bg:'#1e1e1e', panel:'#2d2d2d', border:'#0f0f0f', text:'#e8e8e8', hover:'#3d3d3d' },
            'dark-style':   { bg:'#1e1e1e', panel:'#252525', border:'#3c3c3c', text:'#cccccc', hover:'#3e3e3e' },
            'dark-orange':  { bg:'#2a1f1a', panel:'#3a2f2a', border:'#1a0f0a', text:'#ffaa55', hover:'#4a3f3a' },
            'aqua':         { bg:'#0a1a1f', panel:'#1a2a2f', border:'#0a0a0a', text:'#55ffff', hover:'#2a3a3f' },
            'elegant-dark': { bg:'#1a1a1a', panel:'#2d2d2d', border:'#404040', text:'#e8e8e8', hover:'#3d3d3d' },
            'material-dark':{ bg:'#121212', panel:'#1e1e1e', border:'#333333', text:'#ffffff', hover:'#2e2e2e' },
            'light-style':  { bg:'#ffffff', panel:'#ffffff', border:'#e0e0e0', text:'#000000', hover:'#f5f5f5', button:'#ffffff', buttonText:'#000000', buttonHover:'#f0f0f0', tabActive:'#ffffff', inputBg:'#ffffff' },
            'ayu-mirage':   { bg:'#1f2430', panel:'#232834', border:'#191e2a', text:'#cbccc6', hover:'#2a2f3a' },
            'dracula':      { bg:'#282a36', panel:'#343746', border:'#21222c', text:'#f8f8f2', hover:'#44475a' }
        };
        if (scheme === 'default') {
            if (window.monaco) monaco.editor.setTheme('graal-default');
            document.body.style.background = ''; document.body.style.color = '';
            const tb = document.getElementById('tauriBar'); if (tb) { tb.style.background = ''; tb.style.borderColor = ''; }
            this._schemeColors = null;
            localStorage.setItem('editorColorScheme', scheme); this._updateSchemeDropdown(scheme); return;
        }
        const c = schemes[scheme];
        if (!c) return;
        document.body.style.background = c.bg;
        document.body.style.color = c.text;
        const bBg = c.button || c.panel, bTxt = c.buttonText || c.text, bHov = c.buttonHover || c.hover, tabAct = c.tabActive || c.panel, inp = c.inputBg || c.bg;
        const iconFilter = (scheme === 'fusion-light' || scheme === 'light-style') ? 'brightness(0)' : scheme === 'dark-orange' ? 'invert(1) brightness(1.8) sepia(1) saturate(3) hue-rotate(5deg)' : scheme === 'aqua' ? 'invert(1) brightness(1.8) sepia(1) saturate(4) hue-rotate(150deg)' : 'invert(1) brightness(1.2)';
        const s = document.createElement('style');
        s.id = 'colorSchemeStyle';
        s.textContent = `
            body, .main-container, .content-area { background: ${c.bg} !important; color: ${c.text} !important; }
            .toolbar, .level-toolbar, .tileset-toolbar, .tile-selection-toolbar, .canvas-controls-bar { background: ${c.panel} !important; border-color: ${c.border} !important; }
            .left-panel, .right-panel { background: ${c.panel} !important; }
            .tabs { background: ${c.panel} !important; }
            .tab { background: transparent !important; color: ${c.text} !important; opacity: 0.6; }
            .tab:hover { background: ${c.hover} !important; opacity: 0.8; }
            .tab.active { background: ${tabAct} !important; color: ${c.text} !important; border-color: ${c.border} !important; border-bottom: none !important; opacity: 1; }
            .splitter-handle { background: ${c.border} !important; }
            .toolbar button, .level-toolbar button, .tileset-toolbar button, .tile-selection-toolbar button, .canvas-controls button:not(.active), .canvas-controls-bar button:not(.active) { background: ${bBg} !important; color: ${bTxt} !important; border-color: ${c.border} !important; }
            .toolbar button:hover, .level-toolbar button:hover, .tileset-toolbar button:hover, .canvas-controls button:hover:not(.active), .canvas-controls-bar button:hover { background: ${bHov} !important; }
            .fas { filter: ${iconFilter} !important; }
            input, select, textarea { background: ${inp} !important; color: ${c.text} !important; border-color: ${c.border} !important; }
            .tool-dropdown-menu { background: ${c.panel} !important; border-color: ${c.border} !important; }
            .tool-dropdown-menu label { color: ${c.text} !important; }
            .tool-dropdown-menu label:hover { background: ${c.hover} !important; }
            .tileset-display, .tiles-list { background: ${c.bg} !important; border-color: ${c.border} !important; }
            .tile-item { background: ${c.panel} !important; border-color: ${c.border} !important; color: ${c.text} !important; }
            .tile-item:hover { background: ${c.hover} !important; }
            .tile-edit-panel, .sprite-settings { background: ${c.panel} !important; border-color: ${c.border} !important; color: ${c.text} !important; }
            .object-button { background: ${c.panel} !important; color: ${c.text} !important; border-color: ${c.border} !important; }
            .object-button:hover { background: ${c.hover} !important; }
            #npcListBody tr:hover td { background: ${c.hover} !important; }
            #npcListBody td { border-color: ${c.border} !important; color: ${c.text} !important; }
            .dialog-content { background: ${c.panel} !important; border-color: ${c.border} !important; color: ${c.text} !important; }
            .dialog-content h3 { color: ${c.text} !important; border-color: ${c.border} !important; }
            .dialog-content label, .dialog-content p, .dialog-content span { color: ${c.text} !important; }
            .dialog-content button { background: ${bBg} !important; color: ${bTxt} !important; border-color: ${c.border} !important; }
            .dialog-content button:hover { background: ${bHov} !important; }
            .dialog-content select, .dialog-content input, .dialog-content textarea { background: ${inp} !important; color: ${c.text} !important; border-color: ${c.border} !important; }
            .tab-bar { background: ${c.panel} !important; border-color: ${c.border} !important; }
            .tab { background: ${c.hover} !important; color: ${c.text} !important; border-color: ${c.border} !important; }
            .object-library-panel { background: ${c.bg} !important; border-color: ${c.border} !important; }
            .left-panel-tabs { background: ${c.bg} !important; border-color: ${c.border} !important; }
            .left-tab { background: transparent !important; color: ${c.text} !important; opacity: 0.6; border-color: ${c.border} !important; }
            .left-tab:hover { background: ${c.hover} !important; opacity: 0.8; }
            .left-tab.active { background: ${c.panel} !important; color: ${c.text} !important; opacity: 1; border-bottom-color: #4a9eff !important; }
            .object-library-header { background: ${c.panel} !important; border-color: ${c.border} !important; color: ${c.text} !important; }
            .object-library-header label { color: ${c.text} !important; }
            .object-library-header button { background: ${bBg} !important; color: ${bTxt} !important; border-color: ${c.border} !important; }
            .object-library-header button:hover { background: ${bHov} !important; }
            .object-library-header input { background: ${inp} !important; color: ${c.text} !important; border-color: ${c.border} !important; }
            .object-library-content { background: ${c.bg} !important; }
            #objectTree { background: ${c.bg} !important; border-color: ${c.border} !important; color: ${c.text} !important; }
            #objectsList > div { background: ${c.panel} !important; border-color: ${c.border} !important; color: ${c.text} !important; }
            #objectsList > div:hover { background: ${c.hover} !important; }
            .status-bar, .status-info { background: ${c.panel} !important; border-color: ${c.border} !important; color: ${c.text} !important; }
            .status-info span { color: ${c.text} !important; }
            .panel-tabs { background: ${c.panel} !important; border-color: ${c.border} !important; }
            .panel-tab { background: ${c.hover} !important; color: ${c.text} !important; border-color: ${c.border} !important; }
            .panel-tab.active { background: ${c.bg} !important; color: ${c.text} !important; }
            .panel-content { background: ${c.bg} !important; }
            .panel-section { color: ${c.text} !important; }
            .layer-selector { background: ${c.panel} !important; color: ${c.text} !important; }
            .ed-dialog-box { background: ${c.panel} !important; border-color: ${c.border} !important; color: ${c.text} !important; }
            .ed-dialog-box input, .ed-dialog-box select, .ed-dialog-box textarea { background: ${c.bg} !important; color: ${c.text} !important; border-color: ${c.border} !important; }
            .ed-dialog-box button:not(#npcSave) { background: ${bBg} !important; color: ${bTxt} !important; border-color: ${c.border} !important; }
            .ed-dialog-box button:not(#npcSave):hover { background: ${bHov} !important; }
            .ed-dialog-box div[style*="background:#353535"], .ed-dialog-box div[style*="background: #353535"] { background: ${c.hover} !important; color: ${c.text} !important; }
            .ed-dlg-title, ._udlg-title { background: ${c.hover} !important; color: ${c.text} !important; }
            .ed-dialog-box .ed-dlg-title { padding: 8px 12px !important; margin: -16px -20px 12px -20px !important; font-weight: bold !important; font-size: 13px !important; }
            .ed-dialog-box div[style*="background:#1e1e1e"] { background: ${c.bg} !important; }
            .ed-dialog-box div[style*="background:#111"] { background: ${c.bg} !important; }
            #npcTitlebar > span { color: ${c.text} !important; }
            .ed-dialog-box div[style*="color:#aaa"], .ed-dialog-box th[style*="color:#aaa"] { color: ${c.text} !important; opacity: 0.6; }
            .ed-dialog-box td, .ed-dialog-box th { border-color: ${c.border} !important; color: ${c.text} !important; }
            .ed-dialog-box table { border-color: ${c.border} !important; }
            .ed-dialog-box thead tr { background: ${c.hover} !important; }
            .ed-dialog-box thead th { background: ${c.hover} !important; color: ${c.text} !important; border-color: ${c.border} !important; }
            .ed-dialog-box tbody tr:nth-child(even) { background: ${c.bg} !important; }
            .ed-dialog-box tbody tr:nth-child(odd) { background: ${c.panel} !important; }
            .ed-dialog-box tbody td { background: transparent !important; }
            #npcTestOutput { background: ${c.bg} !important; border-color: ${c.border} !important; }
            #npcImgDropdown { background: ${c.panel} !important; border-color: ${c.border} !important; }
            #npcImgDropdown div { color: ${c.text} !important; }
            #npcImgDropdown div:hover { background: ${c.hover} !important; }
            .tab-panel { background: ${c.bg} !important; }
            #infoDialog > div { background: ${c.panel} !important; border-color: ${c.border} !important; }
            #infoDialog { color: ${c.text} !important; }
            #aboutTabAbout, #aboutTabChangelog { background: ${c.bg} !important; color: ${c.text} !important; }
            #aboutTabAbout a, #aboutTabChangelog a { color: #4a9eff !important; }
            #aboutClose { background: ${bBg} !important; color: ${bTxt} !important; border-color: ${c.border} !important; }
            #aboutClose:hover { background: ${bHov} !important; }
            .info-tab-btn { color: ${c.text} !important; border-color: ${c.border} !important; }
            .info-tab-btn.active { color: ${c.text} !important; background: ${c.panel} !important; }
            #colorSchemeDropdown { background: ${c.panel} !important; border-color: ${c.border} !important; }
            .color-scheme-item { color: ${c.text} !important; border-color: ${c.border} !important; }
            .color-scheme-item:hover { background: ${c.hover} !important; }
            .settings-group { background: ${c.panel} !important; border-color: ${c.border} !important; }
            .settings-group h3 { color: ${c.text} !important; }
            .settings-group label { color: ${c.text} !important; }
            .settings-group button { background: ${bBg} !important; color: ${bTxt} !important; border-color: ${c.border} !important; }
            .settings-group button:hover { background: ${bHov} !important; }
            .settings-group input, .settings-group select { background: ${inp} !important; color: ${c.text} !important; border-color: ${c.border} !important; }
            .settings-group div[style*="background:#1e1e1e"] { background: ${c.bg} !important; border-color: ${c.border} !important; }
            .settings-group thead tr { background: ${c.hover} !important; }
            .settings-group thead th { color: ${c.text} !important; opacity: 0.7; }
            #btnNewTileObjectGroup, #btnDeleteTileObjectGroup, #btnNewTileObject, #btnDeleteTileObject, #btnExportTileObjects, #btnImportTileObjects { background: ${bBg} !important; color: ${bTxt} !important; border-color: ${c.border} !important; }
            #btnNewTileObjectGroup:hover, #btnDeleteTileObjectGroup:hover, #btnNewTileObject:hover, #btnDeleteTileObject:hover, #btnExportTileObjects:hover, #btnImportTileObjects:hover { background: ${bHov} !important; }
            #tileObjectGroup, #tileObjectName { background: ${inp} !important; color: ${c.text} !important; border-color: ${c.border} !important; }
            #tileObjectPreview { border-color: ${c.border} !important; background: ${c.bg} !important; }
            .tab-panel { background: ${c.bg} !important; border-color: ${c.border} !important; }
            #npcTitlebar { background: ${c.hover} !important; }
            #npcMonacoContainer, .monaco-editor, .monaco-editor-background, .monaco-editor .margin { background: ${c.bg} !important; }
            #elTitlebar, #esTitlebar, #signTitlebar, #lkTitlebar, #chTitlebar, #bdTitlebar { background: ${c.hover} !important; color: ${c.text} !important; }
            #tauriBar { background: ${c.panel} !important; border-color: ${c.border} !important; }
            #tauriBar button { background: transparent !important; color: ${c.text} !important; border-color: transparent !important; }
            #tauriBar button:hover { background: ${c.hover} !important; }
            #tauriBar .tb-title span { color: ${c.text} !important; }
            .tool-button.active { background: #4a9eff !important; color: #fff !important; border-color: #2a7eff !important; }
            .tool-button.active:hover { background: #5aaeff !important; }
            #layers-tab > div:first-child { background: ${c.hover} !important; border-color: ${c.border} !important; }
            #btnAddLayer, #btnDeleteLayer { background: ${bBg} !important; color: ${bTxt} !important; border-color: ${c.border} !important; }
            #btnAddLayer:hover, #btnDeleteLayer:hover { background: ${bHov} !important; }
            #zoomSlider { accent-color: #4a9eff !important; }
            #zoomSlider::-webkit-slider-runnable-track { background: ${c.border} !important; box-shadow: none !important; }
            #zoomSlider::-moz-range-track { background: ${c.border} !important; box-shadow: none !important; }
            #zoomSlider::-webkit-slider-thumb { background: ${c.panel} !important; box-shadow: 0 1px 3px rgba(0,0,0,0.4) !important; border: 1px solid ${c.border} !important; }
            #zoomSlider::-moz-range-thumb { background: ${c.panel} !important; box-shadow: 0 1px 3px rgba(0,0,0,0.4) !important; border: 1px solid ${c.border} !important; }
            #tilesetZoomSlider::-webkit-slider-runnable-track { background: ${c.border} !important; box-shadow: none !important; }
            #tilesetZoomSlider::-moz-range-track { background: ${c.border} !important; box-shadow: none !important; }
            #tilesetZoomSlider::-webkit-slider-thumb { background: ${c.panel} !important; box-shadow: 0 1px 3px rgba(0,0,0,0.4) !important; border: 1px solid ${c.border} !important; }
            #tilesetZoomSlider::-moz-range-thumb { background: ${c.panel} !important; box-shadow: 0 1px 3px rgba(0,0,0,0.4) !important; border: 1px solid ${c.border} !important; }
            .tileset-display { background: ${c.bg} !important; scrollbar-color: ${c.hover} ${c.bg} !important; }
            .tileset-display::-webkit-scrollbar-track { background: ${c.bg} !important; }
            .tileset-display::-webkit-scrollbar-thumb { background: ${c.hover} !important; }
            .tileset-display::-webkit-scrollbar-thumb:hover { background: ${bBg} !important; }
            #_ss2Dialog > div { background: ${c.bg} !important; border-color: ${c.border} !important; }
            #_ss2Drag { background: ${c.hover} !important; border-color: ${c.border} !important; }
            #_ss2Drag span, #_ss2Drag button { color: ${c.text} !important; }
            #_ss2Dialog button { background: ${bBg} !important; color: ${bTxt} !important; border-color: ${c.border} !important; }
            #_ss2Dialog button:hover { background: ${bHov} !important; }
            #_ss2Dialog textarea { background: ${c.bg} !important; color: ${c.text} !important; border-color: ${c.border} !important; }
            #_ss2Dialog [data-ss2="picker"] { background: ${c.panel} !important; }
            #_gmgInner { background: ${c.panel} !important; border-color: ${c.border} !important; }
            #_gmgDrag { background: ${c.hover} !important; border-color: ${c.border} !important; }
            #_gmgDrag span, #_gmgDrag button { color: ${c.text} !important; }
            #_gmgDialog button { background: ${bBg} !important; color: ${bTxt} !important; border-color: ${c.border} !important; }
            #_gmgDialog button:hover { background: ${bHov} !important; }
            #_gmgDialog input, #_gmgDialog select { background: ${c.bg} !important; color: ${c.text} !important; border-color: ${c.border} !important; }
            #_gmgDialog label { color: ${c.text} !important; }
            #_gmgDialog div[style*="background:#1e1e1e"], #_gmgDialog div[style*="background: #1e1e1e"] { background: ${c.bg} !important; }
        `;
        document.head.appendChild(s);
        if (window.monaco) {
            monaco.editor.defineTheme('graal-active', {
                base: 'vs-dark', inherit: true,
                rules: [
                    { token: 'comment', foreground: '75715e', fontStyle: 'italic' },
                    { token: 'string', foreground: 'e6db74' },
                    { token: 'number', foreground: 'be84ff' },
                    { token: 'keyword', foreground: 'f92672' },
                    { token: 'keyword.builtin', foreground: 'be84ff' },
                    { token: 'function.call', foreground: 'a6e22b' },
                ],
                colors: {
                    'editor.background': c.bg, 'editor.foreground': c.text,
                    'editorSuggestWidget.background': c.panel, 'editorSuggestWidget.border': c.border,
                    'editorSuggestWidget.foreground': c.text, 'editorSuggestWidget.selectedBackground': c.hover,
                    'editorSuggestWidget.highlightForeground': '#4a9eff',
                    'editorHoverWidget.background': c.panel, 'editorHoverWidget.border': c.border,
                    'editorWidget.background': c.panel, 'editorWidget.border': c.border,
                    'list.hoverBackground': c.hover, 'list.activeSelectionBackground': c.hover,
                    'list.activeSelectionForeground': c.text, 'list.focusBackground': c.hover
                }
            });
            monaco.editor.setTheme('graal-active');
        }
        this._schemeColors = c;
        localStorage.setItem('editorColorScheme', scheme);
        this._updateSchemeDropdown(scheme);
    }

    _updateSchemeDropdown(scheme) {
        const drop = document.getElementById('colorSchemeDropdown');
        if (!drop) return;
        drop.querySelectorAll('.color-scheme-item').forEach(item => {
            item.style.background = item.dataset.scheme === scheme ? '#404040' : '';
        });
    }

    initColorScheme() {
        const saved = localStorage.getItem('editorColorScheme') || 'default';
        this.applyColorScheme(saved);
        const btn = document.getElementById('btnColorScheme');
        const drop = document.getElementById('colorSchemeDropdown');
        if (!btn || !drop) return;
        btn.onclick = (e) => { e.stopPropagation(); drop.style.display = drop.style.display === 'none' ? 'block' : 'none'; };
        drop.querySelectorAll('.color-scheme-item').forEach(item => {
            item.onclick = (e) => { e.stopPropagation(); this.applyColorScheme(item.dataset.scheme); drop.style.display = 'none'; };
        });
        const btnCustomCSS = document.getElementById('btnCustomCSS');
        if (btnCustomCSS) {
            btnCustomCSS.onmouseenter = () => { btnCustomCSS.style.background = '#252525'; };
            btnCustomCSS.onmouseleave = () => { btnCustomCSS.style.background = ''; };
            btnCustomCSS.onclick = e => { e.stopPropagation(); drop.style.display = 'none'; this.openCustomCSSDialog(); };
        }
        document.addEventListener('click', (e) => { if (!btn.contains(e.target) && !drop.contains(e.target)) drop.style.display = 'none'; });
        this.initCustomCSS();
    }

    initCustomCSS() {
        const saved = localStorage.getItem('levelEditorCustomCSS');
        if (!saved) return;
        let tag = document.getElementById('levelEditorCustomUserCSS');
        if (!tag) { tag = document.createElement('style'); tag.id = 'levelEditorCustomUserCSS'; document.head.appendChild(tag); }
        tag.textContent = saved;
    }

    openCustomCSSDialog() {
        const current = (document.getElementById('levelEditorCustomUserCSS') || {}).textContent || '';
        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:10000;display:flex;justify-content:center;align-items:center;';
        overlay.innerHTML = `
            <div class="dialog-content" style="background:#2b2b2b;border:2px solid #1a1a1a;width:660px;max-width:92vw;height:80vh;display:flex;flex-direction:column;box-shadow:0 4px 16px rgba(0,0,0,0.9);">
                <div class="dialog-titlebar" style="background:#1e1e1e;border-bottom:2px solid #0a0a0a;padding:10px 14px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
                    <span style="display:flex;align-items:center;gap:8px;"><i class="fas fa-palette" style="flex-shrink:0;display:block;"></i><span style="font-family:'chevyray',monospace;font-size:13px;color:#c0c0c0;user-select:none;line-height:16px;">Custom CSS</span></span>
                    <span style="font-family:'chevyray',monospace;font-size:11px;color:#666;user-select:none;">injected after all themes — overrides anything</span>
                </div>
                <div id="levelCssEditorContainer" style="flex:1;min-height:0;position:relative;overflow:hidden;"></div>
                <div style="padding:10px 14px;display:flex;gap:8px;align-items:center;border-top:1px solid #0a0a0a;flex-shrink:0;">
                    <button id="levelCssApply" style="background:#1a6b1a;color:#fff;border:1px solid #0a0a0a;border-top:1px solid #2a8a2a;padding:7px 14px;cursor:pointer;font-family:'chevyray',monospace;font-size:12px;">Apply</button>
                    <button id="levelCssImport" style="background:#1a1a1a;color:#e0e0e0;border:1px solid #0a0a0a;border-top:1px solid #404040;padding:7px 14px;cursor:pointer;font-family:'chevyray',monospace;font-size:12px;">Import</button>
                    <button id="levelCssExport" style="background:#1a1a1a;color:#e0e0e0;border:1px solid #0a0a0a;border-top:1px solid #404040;padding:7px 14px;cursor:pointer;font-family:'chevyray',monospace;font-size:12px;">Export</button>
                    <a id="levelCssExample" href="example-theme.css" download style="background:#1a1a1a;color:#4a9eff;border:1px solid #0a0a0a;border-top:1px solid #404040;padding:7px 14px;cursor:pointer;font-family:'chevyray',monospace;font-size:12px;text-decoration:none;">Example</a>
                    <div style="flex:1;"></div>
                    <button id="levelCssClear" style="background:#6b1a1a;color:#fff;border:1px solid #0a0a0a;border-top:1px solid #8a2a2a;padding:7px 14px;cursor:pointer;font-family:'chevyray',monospace;font-size:12px;">Clear</button>
                    <button id="levelCssClose" style="background:#1a1a1a;color:#e0e0e0;border:1px solid #0a0a0a;border-top:1px solid #404040;padding:7px 14px;cursor:pointer;font-family:'chevyray',monospace;font-size:12px;">Close</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);
        const container = overlay.querySelector('#levelCssEditorContainer');
        let ed = null, fb = null;
        const getValue = () => ed ? ed.getValue() : (fb ? fb.value : '');
        const setValue = v => { if (ed) ed.setValue(v); else if (fb) fb.value = v; };
        const mkFallback = () => {
            fb = document.createElement('textarea');
            fb.spellcheck = false; fb.value = current;
            fb.style.cssText = 'width:100%;height:100%;background:#1a1a1a;color:#e0e0e0;border:none;padding:12px;font-family:monospace;font-size:12px;line-height:1.5;resize:none;outline:none;box-sizing:border-box;';
            container.appendChild(fb);
        };
        if (window.monacoReady) {
            window.monacoReady.then(mc => {
                if (!mc) { mkFallback(); return; }
                const monacoTheme = getComputedStyle(document.documentElement).getPropertyValue('--monaco-theme').trim() || 'graal-active';
                ed = mc.editor.create(container, { value: current, language: 'css', theme: monacoTheme, minimap:{enabled:false}, scrollBeyondLastLine:false, fontSize:12, fontFamily:'monospace', automaticLayout:true });
            });
        } else { mkFallback(); }
        const applyCSS = () => {
            const css = getValue();
            let tag = document.getElementById('levelEditorCustomUserCSS');
            if (!tag) { tag = document.createElement('style'); tag.id = 'levelEditorCustomUserCSS'; document.head.appendChild(tag); }
            tag.textContent = css;
            localStorage.setItem('levelEditorCustomCSS', css);
        };
        overlay.querySelector('#levelCssApply').onclick = applyCSS;
        overlay.querySelector('#levelCssClose').onclick = () => { if (ed) ed.dispose(); document.body.removeChild(overlay); };
        overlay.onclick = e => { if (e.target === overlay) { if (ed) ed.dispose(); document.body.removeChild(overlay); } };
        overlay.querySelector('#levelCssClear').onclick = () => {
            setValue('');
            const tag = document.getElementById('levelEditorCustomUserCSS');
            if (tag) tag.textContent = '';
            localStorage.removeItem('levelEditorCustomCSS');
        };
        overlay.querySelector('#levelCssImport').onclick = () => {
            const inp = document.createElement('input');
            inp.type = 'file'; inp.accept = '.css,text/css';
            inp.onchange = e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = ev => { setValue(ev.target.result); applyCSS(); }; r.readAsText(f); };
            inp.click();
        };
        overlay.querySelector('#levelCssExport').onclick = () => {
            const blob = new Blob([getValue()], {type:'text/css'});
            const a = Object.assign(document.createElement('a'), {href:URL.createObjectURL(blob), download:'level-custom-theme.css'});
            a.click(); URL.revokeObjectURL(a.href);
        };
    }

    _renderTileObjectPreview() {
        const canvas = document.getElementById('tileObjectPreview');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const obj = this.tileObjects?.[this._toGroup?.()]?.[this._toName?.()];
        if (!obj || !this.level?.tilesetImage?.complete) { canvas.width = 64; canvas.height = 32; ctx.clearRect(0, 0, 64, 32); return; }
        const tw = this.level.tileWidth || 16, th = this.level.tileHeight || 16;
        canvas.width = obj.width * tw; canvas.height = obj.height * th;
        const tilesPerRow = Math.floor(this.level.tilesetImage.width / tw);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let y = 0; y < obj.tiles.length; y++) {
            for (let x = 0; x < (obj.tiles[y]?.length || 0); x++) {
                const idx = obj.tiles[y][x] < 0 ? 0 : obj.tiles[y][x];
                ctx.drawImage(this.level.tilesetImage, (idx % tilesPerRow) * tw, Math.floor(idx / tilesPerRow) * th, tw, th, x * tw, y * th, tw, th);
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window._editor = window.levelEditor = new LevelEditor();
});

