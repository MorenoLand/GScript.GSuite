(function() {
  function root() { return window.ParticleEmuEditor?._content?.isConnected ? window.ParticleEmuEditor._content : document; }
  function buttonStyle(button) { button.style.cssText = 'height:28px;padding:0 9px;background:#353535;border:1px solid #0a0a0a;border-top-color:#404040;border-left-color:#404040;color:#e0e0e0;cursor:pointer;font-family:"chevyray",monospace;font-size:12px;'; }
  function mimeType() { return ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find(type => MediaRecorder.isTypeSupported(type)) || 'video/webm'; }
  function drawFrame(ctx, system, width, height, step, time, background) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.clearRect(0, 0, width, height);
    if (background) { ctx.fillStyle = background; ctx.fillRect(0, 0, width, height); }
    system.emitters.forEach(emitter => emitter.update(step, time));
    ctx.save(); ctx.translate(width / 2, height / 2); system.draw(ctx); ctx.restore();
  }
  async function save(blob, format) {
    const filename = `particle-effect.${format}`, tauri = window.__TAURI__;
    if (tauri?.dialog?.save && tauri?.fs?.writeFile) {
      const path = await tauri.dialog.save({ defaultPath:filename, title:'Export Particle Animation', filters:[{name:format === 'gif' ? 'GIF Image' : 'WebM Video', extensions:[format]}] });
      if (path) await tauri.fs.writeFile(path, new Uint8Array(await blob.arrayBuffer()));
      return;
    }
    const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = filename; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function gifLzw(indices, minCodeSize) {
    const clear = 1 << minCodeSize, eof = clear + 1, bytes = []; let buffer = 0, bits = 0, size = minCodeSize + 1, next = eof + 1, table = new Map();
    const emit = code => { buffer |= code << bits; bits += size; while (bits >= 8) { bytes.push(buffer & 255); buffer >>>= 8; bits -= 8; } };
    const reset = () => { table.clear(); size = minCodeSize + 1; next = eof + 1; };
    emit(clear); reset(); let prefix = indices[0];
    for (let i = 1; i < indices.length; i++) { const value = indices[i], key = (prefix << 8) | value; if (table.has(key)) prefix = table.get(key); else { emit(prefix); if (next < 4096) { table.set(key, next++); if (next > (1 << size) && size < 12) size++; } else { emit(clear); reset(); } prefix = value; } }
    emit(prefix); emit(eof); if (bits) bytes.push(buffer & 255); return bytes;
  }
  function gifFrame(imageData) {
    const colors = new Map(), palette = [[0, 0, 0]], data = imageData.data;
    const colorOf = (r, g, b, alpha) => alpha && r <= alpha && g <= alpha && b <= alpha ? [Math.min(255, Math.round(r * 255 / alpha)), Math.min(255, Math.round(g * 255 / alpha)), Math.min(255, Math.round(b * 255 / alpha))] : [r, g, b];
    for (let i = 0; i < data.length; i += 4) if (data[i + 3] >= 8) { const [r, g, b] = colorOf(data[i], data[i + 1], data[i + 2], data[i + 3]), key = (r << 16) | (g << 8) | b; colors.set(key, (colors.get(key) || 0) + 1); }
    [...colors.entries()].sort((a, b) => b[1] - a[1]).slice(0, 255).forEach(([color]) => palette.push([(color >> 16) & 255, (color >> 8) & 255, color & 255]));
    const lookup = new Map(palette.slice(1).map((color, index) => [(color[0] << 16) | (color[1] << 8) | color[2], index + 1]));
    const nearest = (r, g, b) => { let best = 1, distance = Infinity; for (let i = 1; i < palette.length; i++) { const color = palette[i], next = (r - color[0]) ** 2 + (g - color[1]) ** 2 + (b - color[2]) ** 2; if (next < distance) { distance = next; best = i; } } return best; };
    const indexed = new Uint8Array(imageData.width * imageData.height);
    for (let i = 0, pixel = 0; i < data.length; i += 4, pixel++) { if (data[i + 3] < 32) continue; const [r, g, b] = colorOf(data[i], data[i + 1], data[i + 2], data[i + 3]), key = (r << 16) | (g << 8) | b; indexed[pixel] = lookup.get(key) || nearest(r, g, b); }
    return {palette, indexed};
  }
  async function buildGif(width, height, frames, fps, status) {
    const bytes = [], push = (...values) => bytes.push(...values), word = value => push(value & 255, value >> 8), text = value => { for (let i = 0; i < value.length; i++) push(value.charCodeAt(i)); };
    text('GIF89a'); word(width); word(height); push(0x70, 0, 0, 0x21, 0xFF, 0x0B); text('NETSCAPE2.0'); push(3, 1, 0, 0, 0);
    for (let index = 0; index < frames.length; index++) {
      status.textContent = `Encoding GIF frame ${index + 1}/${frames.length}`;
      const frame = gifFrame(frames[index]), bits = Math.max(1, Math.ceil(Math.log2(Math.max(frame.palette.length, 2)))), count = 1 << bits;
      push(0x21, 0xF9, 4, 9); word(Math.max(2, Math.round(100 / fps))); push(0, 0, 0x2C); word(0); word(0); word(width); word(height); push(0x80 | (bits - 1));
      for (let i = 0; i < count; i++) push(...(frame.palette[i] || [0, 0, 0]));
      const lzw = gifLzw(frame.indexed, Math.max(2, bits)); push(Math.max(2, bits));
      for (let i = 0; i < lzw.length;) { const length = Math.min(255, lzw.length - i); push(length, ...lzw.slice(i, i + length)); i += length; }
      push(0); if ((index & 1) === 1) await new Promise(resolve => requestAnimationFrame(resolve));
    }
    push(0x3B); return new Blob([Uint8Array.from(bytes)], {type:'image/gif'});
  }
  function alphaBounds(imageData) {
    const {data, width, height} = imageData; let left = width, top = height, right = -1, bottom = -1;
    for (let y = 0, pixel = 0; y < height; y++) for (let x = 0; x < width; x++, pixel++) if (data[pixel * 4 + 3] > 8) { left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y); }
    return right < left ? null : {left, top, right, bottom};
  }
  async function renderFrames(options, status) {
    const width = Math.max(32, Math.min(3840, Math.round(options.width))), height = Math.max(32, Math.min(2160, Math.round(options.height))), fps = Math.max(1, Math.min(60, Math.round(options.fps))), duration = Math.max(.1, Math.min(120, Number(options.duration)));
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d', {alpha:true}), system = new ParticleSystem(canvas, ctx, {assetBaseUrl:'images/particleemu/'}), config = parseGS2ParticleCode(window.ParticleEmuRuntime.getParticleCode());
    config.x = 0; config.y = 0;
    await system.createEmitter(config);
    const frames = Math.max(1, Math.round(duration * fps)), step = 1 / fps;
    if (!options.crop && frames * width * height > 150000000) throw new Error('This uncropped export is too large to render in memory. Enable Frame to particles or lower the length, frame rate, or output size.');
    const rendered = [], frameBounds = [];
    for (let frame = 0; frame < frames; frame++) {
      drawFrame(ctx, system, width, height, step, (frame + 1) * step, null);
      const imageData = ctx.getImageData(0, 0, width, height), nextBounds = alphaBounds(imageData);
      frameBounds.push(nextBounds);
      rendered.push(nextBounds ? ctx.getImageData(nextBounds.left, nextBounds.top, nextBounds.right - nextBounds.left + 1, nextBounds.bottom - nextBounds.top + 1) : null);
      status.textContent = `Rendering frame ${frame + 1}/${frames}`;
      if ((frame & 3) === 3) await new Promise(resolve => requestAnimationFrame(resolve));
    }
    const visibleBounds = frameBounds.filter(Boolean), padding = options.crop ? 8 : 0;
    const union = visibleBounds.length ? visibleBounds.reduce((bounds, current) => ({left:Math.min(bounds.left, current.left), top:Math.min(bounds.top, current.top), right:Math.max(bounds.right, current.right), bottom:Math.max(bounds.bottom, current.bottom)})) : null;
    const crop = options.crop && visibleBounds.length ? (() => { const x = Math.max(0, union.left - padding), y = Math.max(0, union.top - padding), right = Math.min(width, union.right + padding + 1), bottom = Math.min(height, union.bottom + padding + 1); return {x, y, width:right - x, height:bottom - y}; })() : {x:0, y:0, width, height};
    return {rendered, crop, frameBounds, fps};
  }
  function composeFrames(rendered, crop, background, frameBounds) {
    const canvas = document.createElement('canvas'); canvas.width = crop.width; canvas.height = crop.height; const ctx = canvas.getContext('2d');
    return rendered.map((imageData, index) => { ctx.clearRect(0, 0, crop.width, crop.height); if (background) { ctx.fillStyle = background; ctx.fillRect(0, 0, crop.width, crop.height); } const bounds = frameBounds[index]; if (imageData && bounds) ctx.putImageData(imageData, bounds.left - crop.x, bounds.top - crop.y); return ctx.getImageData(0, 0, crop.width, crop.height); });
  }
  async function exportAnimation(options, status) {
    if (options.format === 'webm' && (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream)) throw new Error('WebM export is not supported by this runtime.');
    const result = await renderFrames(options, status), frames = composeFrames(result.rendered, result.crop, options.background, result.frameBounds);
    if (options.format === 'gif') { const blob = await buildGif(result.crop.width, result.crop.height, frames, result.fps, status); status.textContent = 'Saving export...'; await save(blob, 'gif'); return; }
    const canvas = document.createElement('canvas'); canvas.width = result.crop.width; canvas.height = result.crop.height; const ctx = canvas.getContext('2d'), stream = canvas.captureStream(0), track = stream.getVideoTracks()[0], chunks = [], recorder = new MediaRecorder(stream, {mimeType:mimeType()});
    recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
    const saved = new Promise((resolve, reject) => { recorder.onerror = () => reject(recorder.error || new Error('The video recorder failed.')); recorder.onstop = () => resolve(new Blob(chunks, {type:recorder.mimeType})); });
    recorder.start();
    for (let index = 0; index < frames.length; index++) { ctx.putImageData(frames[index], 0, 0); track.requestFrame?.(); status.textContent = `Encoding WebM frame ${index + 1}/${frames.length}`; await new Promise(resolve => setTimeout(resolve, 1000 / result.fps)); }
    recorder.stop(); const blob = await saved; status.textContent = 'Saving export...'; await save(blob, 'webm');
  }
  function showDialog() {
    if (document.getElementById('particleExportDialog')) return;
    const overlay = document.createElement('div'); overlay.id = 'particleExportDialog'; overlay.style.cssText = 'position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.58);display:flex;align-items:center;justify-content:center;font-family:"chevyray",monospace;color:#e0e0e0;';
    const box = document.createElement('div'); box.style.cssText = 'width:390px;background:#242424;border:1px solid #0a0a0a;border-top-color:#404040;border-left-color:#404040;box-shadow:0 12px 32px rgba(0,0,0,.65);';
    box.innerHTML = '<div style="padding:9px 12px;background:#353535;border-bottom:1px solid #111;font-size:13px;"><i class="fas fa-file-export"></i> Export Particle Animation</div><div style="padding:14px;display:grid;grid-template-columns:116px minmax(0,1fr);gap:9px;align-items:center;font-size:12px;"><label for="particleExportFormat">Format</label><select id="particleExportFormat"><option value="webm">WebM video</option><option value="gif">Animated GIF</option></select><label for="particleExportDuration">Length (seconds)</label><input id="particleExportDuration" type="number" min="0.1" max="120" step="0.1" value="3"><label for="particleExportFps">Frame rate</label><select id="particleExportFps"><option value="24">24 FPS</option><option value="30" selected>30 FPS</option><option value="60">60 FPS</option></select><label for="particleExportWidth">Width</label><input id="particleExportWidth" type="number" min="32" max="3840" step="1" value="800"><label for="particleExportHeight">Height</label><input id="particleExportHeight" type="number" min="32" max="2160" step="1" value="600"><label for="particleExportBackground">Background</label><select id="particleExportBackground"><option value="transparent">Transparent</option><option value="canvas">Canvas color</option></select><label for="particleExportCrop">Frame to particles</label><input id="particleExportCrop" type="checkbox" checked></div><div id="particleExportStatus" style="min-height:18px;padding:0 14px 10px;color:#9ad;font-size:12px;"></div><div style="padding:10px 14px;display:flex;justify-content:flex-end;gap:7px;border-top:1px solid #111;"><button id="particleExportCancel">Cancel</button><button id="particleExportStart">Export</button></div>';
    const fieldStyle = 'width:100%;min-width:0;background:#111;border:1px solid #404040;color:#e0e0e0;padding:5px;font-family:"chevyray",monospace;font-size:12px;';
    box.querySelectorAll('input,select').forEach(input => input.style.cssText = fieldStyle); box.querySelectorAll('button').forEach(buttonStyle);
    const status = box.querySelector('#particleExportStatus'), cancel = box.querySelector('#particleExportCancel'), start = box.querySelector('#particleExportStart');
    cancel.onclick = () => overlay.remove();
    start.onclick = async () => {
      const background = box.querySelector('#particleExportBackground').value === 'canvas' ? (localStorage.getItem('gsuiteParticleViewportBgColor') || '#006400') : null;
      const options = {format:box.querySelector('#particleExportFormat').value, duration:Number(box.querySelector('#particleExportDuration').value), fps:Number(box.querySelector('#particleExportFps').value), width:Number(box.querySelector('#particleExportWidth').value), height:Number(box.querySelector('#particleExportHeight').value), background, crop:box.querySelector('#particleExportCrop').checked};
      if (!Number.isFinite(options.duration) || !Number.isFinite(options.width) || !Number.isFinite(options.height)) { status.textContent = 'Enter valid export values.'; return; }
      start.disabled = true; cancel.disabled = true;
      try { await exportAnimation(options, status); overlay.remove(); } catch (error) { status.textContent = error?.message || String(error); start.disabled = false; cancel.disabled = false; }
    };
    overlay.appendChild(box); document.body.appendChild(overlay);
  }
  let observer;
  function install() {
    const addButton = () => {
      const toolbar = root().querySelector('.topbar');
      if (!toolbar || toolbar.querySelector('#btnParticleExport')) return;
      const button = document.createElement('button'); button.id = 'btnParticleExport'; button.title = 'Export particle animation'; button.textContent = 'Export'; buttonStyle(button); button.onclick = showDialog;
      const stop = toolbar.querySelector('[onclick*="stopParticles"]'); toolbar.insertBefore(button, stop || null);
    };
    addButton(); requestAnimationFrame(addButton); setTimeout(addButton, 80); setTimeout(addButton, 250);
    const host = document.getElementById('particleemuRoot');
    if (host && observer?.host !== host) { observer?.disconnect(); observer = new MutationObserver(addButton); observer.host = host; observer.observe(host, {childList:true, subtree:true}); }
  }
  function applyTheme() { const scheme = localStorage.getItem('editorColorScheme'); window.monaco?.editor?.setTheme?.(scheme === 'fusion-light' || scheme === 'light-style' ? 'graal-light' : scheme === 'default' || !scheme ? 'graal-default' : 'graal-active'); }
  window.ParticleEmuExport = {install, showDialog, applyTheme};
})();
