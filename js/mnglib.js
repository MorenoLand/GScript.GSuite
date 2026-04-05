const MNG = (() => {
    const PNG_SIG = new Uint8Array([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]);
    const MNG_SIG = new Uint8Array([0x8A,0x4D,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]);
    function readChunks(buf) {
        const data = new Uint8Array(buf), view = new DataView(buf);
        for (let i = 0; i < 8; i++) if (data[i] !== MNG_SIG[i]) {
            throw new Error(`Not MNG (sig: ${Array.from(data.slice(0,8)).map(b=>b.toString(16).padStart(2,'0')).join(' ')})`);
        }
        const chunks = []; let pos = 8;
        while (pos < data.length - 12) {
            const len = view.getUint32(pos), type = String.fromCharCode(data[pos+4],data[pos+5],data[pos+6],data[pos+7]);
            chunks.push({ type, len, data: data.slice(pos+8, pos+8+len), offset: pos });
            pos += len + 12;
        }
        return chunks;
    }
    function parseFRAM(d) {
        let pos = 1;
        while (pos < d.length && d[pos]) pos++;
        pos++;
        if (pos >= d.length) return null;
        const hasDelay = d[pos++]; pos += 3;
        if (!hasDelay || pos + 4 > d.length) return null;
        return new DataView(d.buffer, d.byteOffset + pos).getUint32(0);
    }
    async function parse(src) {
        const buf = src instanceof ArrayBuffer ? src : await src.arrayBuffer();
        const raw = new Uint8Array(buf), chunks = readChunks(buf);
        let ticksPerSec = 100, pendingDelay = null, frameParts = [], inPNG = false;
        const frames = [];
        for (const c of chunks) {
            if (c.type === 'MHDR') { const t = new DataView(c.data.buffer, c.data.byteOffset).getUint32(8); if (t > 0) ticksPerSec = t; }
            else if (c.type === 'FRAM') { const t = parseFRAM(c.data); if (t != null) pendingDelay = Math.round(t / ticksPerSec * 1000); }
            else if (c.type === 'IHDR') { frameParts = [c]; inPNG = true; }
            else if (inPNG) {
                frameParts.push(c);
                if (c.type === 'IEND') {
                    inPNG = false;
                    const png = new Uint8Array(8 + frameParts.reduce((s,x) => s + x.len + 12, 0));
                    png.set(PNG_SIG); let p = 8;
                    for (const f of frameParts) { png.set(raw.slice(f.offset, f.offset + f.len + 12), p); p += f.len + 12; }
                    frames.push({ png, delay: pendingDelay || 100 }); pendingDelay = null;
                }
            }
        }
        return frames;
    }
    function loadImages(frames) {
        return Promise.all(frames.map(f => new Promise((res, rej) => {
            const img = new Image(), url = URL.createObjectURL(new Blob([f.png], { type: 'image/png' }));
            img.onload = () => { URL.revokeObjectURL(url); res({ img, delay: f.delay }); };
            img.onerror = rej; img.src = url;
        })));
    }
    function makeCanvas(frames) {
        const canvas = document.createElement('canvas');
        canvas.width = frames[0].img.width; canvas.height = frames[0].img.height;
        const ctx = canvas.getContext('2d');
        let idx = 0, timer = null, running = false;
        const draw = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(frames[idx].img, 0, 0); };
        const tick = () => { draw(); timer = setTimeout(() => { idx = (idx + 1) % frames.length; tick(); }, frames[idx].delay); };
        canvas.play  = () => { if (!running) { running = true; tick(); } };
        canvas.pause = () => { clearTimeout(timer); running = false; };
        canvas.stop  = () => { canvas.pause(); idx = 0; draw(); };
        draw(); return canvas;
    }
    async function play(src, autoplay = true) {
        const frames = await parse(src);
        if (!frames.length) throw new Error('No frames');
        const loaded = await loadImages(frames);
        const canvas = makeCanvas(loaded);
        if (autoplay && loaded.length > 1) canvas.play();
        return canvas;
    }
    async function toBlob(src) {
        const frames = await parse(src);
        return new Blob([frames[0].png], { type: 'image/png' });
    }
    return { play, parse, toBlob };
})();
