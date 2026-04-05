class GmapGenerator {
    static async _getJSZip() {
        if (window.JSZip) return window.JSZip;
        const { default: Z } = await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm');
        return Z;
    }

    static _coords(x, y, cx, cy, fmt) {
        if (fmt === 'lettered') {
            const xi = x - 1, yi = y - 1;
            const xs = String.fromCharCode(97 + Math.floor(xi / 26)) + String.fromCharCode(97 + (xi % 26));
            const ys = String.fromCharCode(97 + Math.floor(yi / 26)) + String.fromCharCode(97 + (yi % 26));
            return `${xs}-${ys}`;
        }
        const xs = x >= cx ? (x - cx).toString().padStart(2, '0') : (cx - x - 1).toString().padStart(2, '0');
        const ys = y >= cy ? (y - cy).toString().padStart(2, '0') : (cy - y - 1).toString().padStart(2, '0');
        return `${xs}-${ys}`;
    }

    static _levelContent(x, y, w, h, prefix, cx, cy, addLinks, fmt, template) {
        const fVals = 'f/'.repeat(64).slice(0, -1);
        let content = 'GLEVNW01\n';
        if (template) { content += template; }
        else { for (let i = 0; i < 64; i++) content += `BOARD 0 ${i} 64 0 ${fVals}\n`; }
        if (addLinks) {
            const c = (dx, dy) => `${prefix}_${GmapGenerator._coords(x + dx, y + dy, cx, cy, fmt)}.nw`;
            if (x > 1)  content += `LINK ${c(-1,0)} 0 0 1 64 61 playery\n`;
            if (x < w)  content += `LINK ${c(1,0)} 63 0 1 64 0 playery\n`;
            if (y > 1)  content += `LINK ${c(0,-1)} 0 0 64 1 playerx 61\n`;
            if (y < h)  content += `LINK ${c(0,1)} 0 63 64 1 playerx 0\n`;
        }
        return content;
    }

    static open() {
        if (document.getElementById('_gmgDialog')) { document.getElementById('_gmgDialog').style.display = 'flex'; return; }
        const btnStyle = 'background:#3a3a3a;color:#ddd;border:1px solid #0a0a0a;border-top:1px solid #555;border-left:1px solid #555;padding:4px 14px;cursor:pointer;font-family:chevyray,monospace;font-size:12px;';
        const inpStyle = 'background:#1a1a1a;color:#ddd;border:1px solid #3a3a3a;padding:4px 8px;font-family:chevyray,monospace;font-size:12px;width:100%;box-sizing:border-box;';
        const lblStyle = 'color:#aaa;font-family:chevyray,monospace;font-size:12px;display:block;margin-bottom:3px;';
        const rowStyle = 'display:flex;gap:12px;margin-bottom:10px;';
        const cellStyle = 'display:flex;flex-direction:column;flex:1;';
        const mapIcon = `<img src="icons/gmapgen.ico" style="width:16px;height:16px;image-rendering:pixelated;flex-shrink:0;">`;

        const dlg = document.createElement('div');
        dlg.id = '_gmgDialog';
        dlg.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:9000;pointer-events:none;';
        dlg.innerHTML = `
<div id="_gmgInner" style="background:#252525;border:1px solid #3a3a3a;display:flex;flex-direction:column;width:420px;pointer-events:all;box-shadow:0 8px 32px rgba(0,0,0,0.8);">
  <div id="_gmgDrag" style="display:flex;align-items:center;background:#2a2a2a;border-bottom:1px solid #111;padding:6px 10px;gap:8px;cursor:move;">
    <span style="color:#ddd;font-family:chevyray,monospace;font-size:13px;flex:1;display:flex;align-items:center;gap:6px;line-height:1;">${mapIcon}Gmap Generator</span>
    <button id="_gmgClose" style="${btnStyle}padding:2px 8px;">✕</button>
  </div>
  <div style="padding:14px;display:flex;flex-direction:column;gap:0;">
    <div style="${rowStyle}">
      <div style="${cellStyle}flex:2;"><label style="${lblStyle}">Prefix</label><input id="_gmgPrefix" style="${inpStyle}" placeholder="mymap"></div>
    </div>
    <div style="${rowStyle}">
      <div style="${cellStyle}"><label style="${lblStyle}">Width</label><input id="_gmgW" type="number" value="2" min="1" style="${inpStyle}width:80px;"></div>
      <div style="${cellStyle}"><label style="${lblStyle}">Height</label><input id="_gmgH" type="number" value="2" min="1" style="${inpStyle}width:80px;"></div>
      <div style="${cellStyle}"><label style="${lblStyle}">Center X</label><input id="_gmgCX" type="number" value="1" min="1" style="${inpStyle}width:80px;"></div>
      <div style="${cellStyle}"><label style="${lblStyle}">Center Y</label><input id="_gmgCY" type="number" value="1" min="1" style="${inpStyle}width:80px;"></div>
    </div>
    <div style="margin-bottom:10px;display:flex;gap:16px;align-items:center;">
      <label style="${lblStyle}margin:0;display:flex;align-items:center;gap:6px;cursor:pointer;"><input type="checkbox" id="_gmgLinks"> Add level links</label>
    </div>
    <div style="margin-bottom:10px;display:flex;gap:16px;align-items:center;">
      <label style="${lblStyle}margin:0;display:flex;align-items:center;gap:6px;cursor:pointer;"><input type="radio" name="_gmgFmt" value="numbered" checked> Numbered (00-01)</label>
      <label style="${lblStyle}margin:0;display:flex;align-items:center;gap:6px;cursor:pointer;"><input type="radio" name="_gmgFmt" value="lettered"> Lettered (aa-aa)</label>
    </div>
    <div style="margin-bottom:10px;">
      <label style="${lblStyle}">Template .nw (optional)</label>
      <div style="display:flex;gap:6px;">
        <input id="_gmgTplName" style="${inpStyle}flex:1;color:#666;" readonly placeholder="no template">
        <button id="_gmgTplBtn" style="${btnStyle}">Browse</button>
        <button id="_gmgTplClear" style="${btnStyle}">Clear</button>
        <input type="file" id="_gmgTplFile" accept=".nw" style="display:none;">
      </div>
    </div>
    <div style="margin-bottom:10px;display:flex;gap:16px;align-items:center;">
      <label style="${lblStyle}margin:0;display:flex;align-items:center;gap:6px;cursor:pointer;"><input type="checkbox" id="_gmgOpenAfter"> Open in editor after generating</label>
    </div>
    <div id="_gmgStatus" style="font-family:chevyray,monospace;font-size:12px;color:#6c6;min-height:18px;margin-bottom:8px;"></div>
    <div style="display:flex;justify-content:flex-end;gap:8px;border-top:1px solid #2a2a2a;padding-top:10px;">
      <button id="_gmgGen" style="${btnStyle}">Generate</button>
      <button id="_gmgCancel" style="${btnStyle}">Close</button>
    </div>
  </div>
</div>`;
        document.body.appendChild(dlg);

        let templateContent = '';
        const $ = id => document.getElementById(id);
        $('_gmgClose').onclick = $('_gmgCancel').onclick = () => dlg.style.display = 'none';
        $('_gmgTplBtn').onclick = () => $('_gmgTplFile').click();
        $('_gmgTplClear').onclick = () => { templateContent = ''; $('_gmgTplName').value = ''; };
        $('_gmgTplFile').onchange = e => {
            const f = e.target.files[0]; if (!f) return;
            const r = new FileReader(); r.onload = ev => { templateContent = ev.target.result; $('_gmgTplName').value = f.name; }; r.readAsText(f);
        };

        $('_gmgGen').onclick = async () => {
            const prefix = $('_gmgPrefix').value.trim();
            const w = parseInt($('_gmgW').value), h = parseInt($('_gmgH').value);
            const cx = parseInt($('_gmgCX').value), cy = parseInt($('_gmgCY').value);
            const addLinks = $('_gmgLinks').checked;
            const fmt = document.querySelector('input[name="_gmgFmt"]:checked').value;
            const openAfter = $('_gmgOpenAfter').checked;
            const status = $('_gmgStatus');
            if (!prefix || isNaN(w) || isNaN(h) || isNaN(cx) || isNaN(cy) || w < 1 || h < 1 || cx < 1 || cy < 1) { status.style.color='#f66'; status.textContent='Please fill in all fields with valid values.'; return; }
            status.style.color='#aaa'; status.textContent='Generating...';

            const files = new Map();
            let gmapContent = `GRMAP001\nWIDTH ${w}\nHEIGHT ${h}\nLEVELNAMES\n`;
            for (let y = 1; y <= h; y++) {
                for (let x = 1; x <= w; x++) {
                    const name = `${prefix}_${GmapGenerator._coords(x, y, cx, cy, fmt)}.nw`;
                    gmapContent += `"${name}"${x < w ? ',' : ''}`;
                    files.set(name, GmapGenerator._levelContent(x, y, w, h, prefix, cx, cy, addLinks, fmt, templateContent));
                }
                gmapContent += '\n';
            }
            gmapContent += 'LEVELNAMESEND\n';
            const gmapName = `${prefix}.gmap`;
            files.set(gmapName, gmapContent);

            if (typeof _isTauri !== 'undefined' && _isTauri) {
                const dir = await _tauri.dialog.open({ directory: true, multiple: false, title: 'Save Gmap Files To' }).catch(() => null);
                if (!dir) { status.textContent = ''; return; }
                let saved = 0;
                for (const [name, content] of files) {
                    await _tauri.fs.writeTextFile(`${dir}/${name}`, content).catch(() => {});
                    saved++;
                }
                status.style.color = '#6c6'; status.textContent = `Saved ${saved} files to folder.`;
            } else {
                const JSZip = await GmapGenerator._getJSZip();
                const zip = new JSZip();
                for (const [name, content] of files) zip.file(name, content);
                const blob = await zip.generateAsync({ type: 'blob' });
                const url = URL.createObjectURL(blob);
                const a = Object.assign(document.createElement('a'), { href: url, download: `${prefix}.zip` });
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
                URL.revokeObjectURL(url);
                status.style.color = '#6c6'; status.textContent = `Downloaded ${prefix}.zip (${files.size} files).`;
            }

            if (openAfter && window.levelEditor?.openGmapText) {
                const nwFiles = new Map([...files].filter(([n]) => n.endsWith('.nw')));
                dlg.style.display = 'none';
                await window.levelEditor.openGmapText(gmapContent, gmapName, nwFiles);
            }
        };

        const inner = $('_gmgInner');
        let _dx = 0, _dy = 0, _drag = false;
        $('_gmgDrag').addEventListener('mousedown', e => { if (e.target.tagName === 'BUTTON') return; _drag = true; _dx = e.clientX - inner.getBoundingClientRect().left; _dy = e.clientY - inner.getBoundingClientRect().top; e.preventDefault(); });
        document.addEventListener('mousemove', e => { if (!_drag) return; inner.style.position = 'fixed'; inner.style.left = (e.clientX - _dx) + 'px'; inner.style.top = (e.clientY - _dy) + 'px'; inner.style.margin = '0'; });
        document.addEventListener('mouseup', () => _drag = false);
    }
}
