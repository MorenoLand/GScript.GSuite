window.__particleEmuTemplate = {"body":"\n\u003cdiv class=\"container\"\u003e\n\u003cdiv class=\"left\"\u003e\n\u003cdiv class=\"topbar\"\u003e\n\u003cbutton id=\"btnRawMode\" class=\"active\" onclick=\"ParticleEmuRuntime.setEditorMode(\u0027raw\u0027)\"\u003eRaw GS2\u003c/button\u003e\n\u003cbutton class=\"arrowbtn\" title=\"Load current raw GS2 into the visual editor\" onclick=\"ParticleEmuRuntime.syncVisualFromCode()\"\u003e-\u0026gt;\u003c/button\u003e\n\u003cbutton id=\"btnVisualMode\" onclick=\"ParticleEmuRuntime.setEditorMode(\u0027visual\u0027)\"\u003eVisual Editor\u003c/button\u003e\n\u003cbutton id=\"btnPlayPause\" class=\"iconbtn\" title=\"Play/Pause particles\" onclick=\"ParticleEmuRuntime.togglePlayPause()\"\u003ePlay\u003c/button\u003e\n\u003cbutton class=\"iconbtn\" title=\"Stop particles\" onclick=\"ParticleEmuRuntime.stopParticles()\"\u003eStop\u003c/button\u003e\n\u003c/div\u003e\n\u003cdiv id=\"codeEditor\"\u003e\u003c/div\u003e\n\u003ctextarea id=\"codeInput\" placeholder=\"Paste GS2 particle code here...\"\u003ewith (findimg(200)) {\n  emitter.delaymin = 0.05;\n  emitter.delaymax = 0.15;\n  emitter.nrofparticles = 3;\n  emitter.particletypes = 1;\n  emitter.maxparticles = 200;\n  emitter.emissionoffset = {0, 0, 0};\n  \n  with (emitter.particles[0]) {\n    lifetime = 3;\n    speed = 2;\n    angle = 0;\n    zangle = 0;\n    image = \"g4_particle_smoke.png\";\n    zoom = 1.5;\n    alpha = 0.8;\n    red = 1;\n    green = 0.8;\n    blue = 0.6;\n    mode = 0;\n  }\n  \n  emitter.addLocalModifier(\"once\", 0, 0, \"angle\", \"replace\", 0, 6.28);\n  emitter.addLocalModifier(\"once\", 0, 0, \"speed\", \"replace\", 2, 4);\n  emitter.addLocalModifier(\"range\", 0, 0.5, \"alpha\", \"replace\", 0.8, 1);\n  emitter.addLocalModifier(\"range\", 0.5, 3, \"alpha\", \"replace\", 1, 0);\n  emitter.addLocalModifier(\"range\", 0, 3, \"zoom\", \"replace\", 1.5, 0.5);\n  emitter.emitautomatically = true;\n}\u003c/textarea\u003e\n\u003cdiv id=\"visualEditor\" class=\"editor-shell\"\u003e\n\u003cdiv class=\"toolbar\"\u003e\n\u003cselect id=\"presetSelect\"\u003e\u003c/select\u003e\n\u003cbutton onclick=\"ParticleEmuRuntime.loadEditorPreset()\"\u003eLoad Preset\u003c/button\u003e\n\u003cbutton onclick=\"ParticleEmuRuntime.applyVisualEditor()\"\u003ePreview Editor\u003c/button\u003e\n\u003c/div\u003e\n\u003cdiv class=\"editor-grid\"\u003e\n\u003cdiv class=\"editor-section\"\u003e\n\u003ch3\u003eEmitter\u003c/h3\u003e\n\u003cdiv id=\"emitterFields\"\u003e\u003c/div\u003e\n\u003c/div\u003e\n\u003cdiv class=\"editor-section\"\u003e\n\u003ch3\u003eParticle Types\u003c/h3\u003e\n\u003cdiv class=\"tabs\" id=\"particleTabs\"\u003e\u003c/div\u003e\n\u003cdiv class=\"listbar\"\u003e\u003cbutton onclick=\"ParticleEmuRuntime.addEditorParticle()\"\u003eAdd Particle\u003c/button\u003e\u003cbutton onclick=\"ParticleEmuRuntime.removeEditorParticle()\"\u003eRemove Particle\u003c/button\u003e\u003c/div\u003e\n\u003cdiv id=\"particleFields\"\u003e\u003c/div\u003e\n\u003c/div\u003e\n\u003cdiv class=\"editor-section\" style=\"grid-column: 1 / -1;\"\u003e\n\u003ch3\u003eModifiers\u003c/h3\u003e\n\u003cdiv class=\"modifier-layout\"\u003e\n\u003cdiv\u003e\n\u003cdiv class=\"modifier-list\" id=\"modifierTabs\"\u003e\u003c/div\u003e\n\u003cdiv class=\"listbar\"\u003e\u003cbutton onclick=\"ParticleEmuRuntime.addEditorModifier()\"\u003eAdd\u003c/button\u003e\u003cbutton onclick=\"ParticleEmuRuntime.removeEditorModifier()\"\u003eRemove\u003c/button\u003e\u003c/div\u003e\n\u003c/div\u003e\n\u003cdiv id=\"modifierFields\" class=\"modifier-detail\"\u003e\u003c/div\u003e\n\u003c/div\u003e\n\u003c/div\u003e\n\u003c/div\u003e\n\u003c/div\u003e\n\u003c/div\u003e\n\u003cdiv class=\"right\"\u003e\n\u003cdiv class=\"viewport-wrap\"\u003e\n\u003ccanvas id=\"viewport\" width=\"800\" height=\"600\" style=\"cursor: grab;\"\u003e\u003c/canvas\u003e\n\u003cdiv class=\"viewport-hint\"\u003eScroll to zoom, drag to pan\u003c/div\u003e\n\u003cdiv class=\"canvas-controls\" style=\"position: absolute; top: 4px; left: 4px; display: flex; gap: 4px; z-index: 10;\"\u003e\n\u003cbutton id=\"btnResetView\" title=\"Reset View\" style=\"background: #353535; border: 1px solid #0a0a0a; border-top: 1px solid #404040; border-left: 1px solid #404040; color: #e0e0e0; padding: 8px; cursor: pointer; font-family: monospace; font-size: 12px; box-shadow: inset 0 1px 0 rgba(0, 0, 0, 0.3), 0 1px 0 rgba(255, 255, 255, 0.1);\"\u003eReset View\u003c/button\u003e\n\u003c/div\u003e\n\u003c/div\u003e\n\u003cdiv id=\"outputPanel\"\u003e\u003c/div\u003e\n\u003c/div\u003e\n\u003c/div\u003e\n\n\n\n\n","style":"\n* { box-sizing: border-box; }\nhtml, body { margin: 0; width: 100%; height: 100%; overflow: hidden; }\nbody { padding: 20px; background: #2a2a2a; color: #e0e0e0; font-family: monospace; }\n.container { display: flex; gap: 20px; width: 100%; height: calc(100dvh - 40px); min-width: 0; min-height: 0; overflow: hidden; }\n.left { flex: 1 1 0; display: flex; flex-direction: column; min-width: 0; min-height: 0; }\n.right { flex: 1 1 0; display: flex; flex-direction: column; min-width: 0; min-height: 0; }\ntextarea { flex: 1; background: #1a1a1a; color: #e0e0e0; border: 1px solid #444; padding: 10px; font-family: monospace; font-size: 12px; resize: none; }\n#codeEditor { flex: 1; min-height: 0; border: 1px solid #444; display: none; }\n.editor-shell { flex: 1; min-height: 0; display: none; overflow: auto; border: 1px solid #444; background: #181818; padding: 10px; }\n.visual-mode #codeEditor, .visual-mode #codeInput { display: none !important; }\n.visual-mode .editor-shell { display: block; }\n.monaco-ready #codeEditor { display: block; }\n.monaco-ready #codeInput { display: none; }\nbutton { padding: 10px 20px; background: #444; color: #e0e0e0; border: 1px solid #666; cursor: pointer; font-size: 14px; font-family: inherit; line-height: 1; }\nbutton:hover { background: #555; }\n.toolbar { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; align-items: center; }\n.toolbar button, .toolbar select { height: 32px; padding: 0 10px; font-size: 12px; background: #333; color: #e0e0e0; border: 1px solid #666; font-family: inherit; }\n.toolbar button.active { background: #666; border-color: #999; }\n.editor-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }\n.editor-section { border: 1px solid #333; padding: 8px; background: #202020; }\n.editor-section h3 { margin: 0 0 8px; font-size: 13px; color: #f0f0f0; }\n.field { display: grid; grid-template-columns: 115px minmax(0, 1fr); gap: 6px; align-items: center; margin: 5px 0; font-size: 12px; }\n.field input, .field select { min-width: 0; width: 100%; background: #111; color: #e0e0e0; border: 1px solid #444; padding: 5px; font-family: monospace; }\n.field input[type=\"checkbox\"] { width: auto; justify-self: start; }\n.listbar { display: flex; gap: 5px; margin: 6px 0; flex-wrap: wrap; }\n.listbar button { height: 28px; padding: 0 9px; font-size: 12px; }\n.tabs { display: flex; gap: 4px; flex-wrap: wrap; margin: 6px 0; }\n.tabs button { height: 28px; padding: 0 9px; font-size: 12px; }\n.tabs button.active { background: #666; }\n.topbar { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; align-items: center; }\n.topbar button { height: 32px; padding: 0 11px; font-size: 12px; min-width: 0; background: #333; border-color: #666; }\n.topbar button.active { background: #666; border-color: #999; }\n.iconbtn { min-width: 58px !important; padding: 0 11px !important; }\n.arrowbtn { min-width: 36px !important; padding: 0 8px !important; }\n.modifier-layout { display: grid; grid-template-columns: minmax(190px, 260px) minmax(0, 1fr); gap: 10px; align-items: start; }\n.modifier-list { border: 1px solid #333; background: #151515; max-height: 260px; overflow: auto; }\n.modifier-row { display: grid; grid-template-columns: 44px 1fr; gap: 6px; width: 100%; padding: 6px 8px; border: 0; border-bottom: 1px solid #2b2b2b; background: transparent; color: #ddd; text-align: left; font: 12px Consolas, monospace; cursor: pointer; }\n.modifier-row:hover { background: #282828; }\n.modifier-row.active { background: #3f3f3f; }\n.modifier-row span:first-child { color: #9ad; }\n.modifier-detail { min-width: 0; }\n.modifier-detail .field { grid-template-columns: 90px minmax(0, 1fr); }\n.modifier-empty { color: #999; padding: 8px; }\n.viewport-wrap { position: relative; flex: 0 0 55%; min-height: 280px; }\n.viewport-hint { position: absolute; left: 10px; bottom: 8px; z-index: 10; color: rgba(230, 230, 230, 0.72); font-size: 12px; pointer-events: none; text-shadow: 0 1px 4px rgba(0, 0, 0, 0.9), 0 0 10px rgba(0, 0, 0, 0.55); }\ncanvas { border: 1px solid #444; background: #1a1a1a; display: block; width: 100%; height: 100%; box-sizing: border-box; }\nh2 { margin: 0 0 10px 0; color: #e0e0e0; }\n#outputPanel { margin-top: 10px; flex: 1; min-height: 180px; overflow: auto; background: #181818; border: 1px solid #444; color: #d6d6d6; font: 14px/1.4 Consolas, monospace; padding: 10px; white-space: pre-wrap; }\n#outputPanel .warn { color: #ffd27a; }\n#outputPanel .error { color: #ff8a8a; }\n#outputPanel .ok { color: #8cff9a; }\n"};

class ParticleEmuEditor {
    static _loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) return resolve();
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Unable to load ${src}`));
            document.head.appendChild(script);
        });
    }
    static async _ensureContent() {
        if (ParticleEmuEditor._content) return;
        const wrapper = document.createElement('div');
        wrapper.className = 'particleemu-tab-content';
        wrapper.style.cssText = 'display:flex;flex:1;min-width:0;min-height:0;overflow:hidden;';
        const style = document.createElement('style');
        let css = window.__particleEmuTemplate.style.replace('html, body', '.particleemu-tab-content').replace(/\nbody\s*\{/g, '\n.particleemu-tab-content {');
        css = css.replace(/(^|\n)([^\n{}]+)(?=\s*\{)/g, (_, lineStart, selectors) => {
            const scoped = selectors.split(',').map(selector => {
                const value = selector.trim();
                return value.startsWith('.particleemu-tab-content') ? value : '.particleemu-tab-content ' + value;
            }).join(', ');
            return lineStart + scoped;
        });
        css = css.replace(/\.particleemu-tab-content \.((?:visual-mode|monaco-ready))/g, '.particleemu-tab-content.$1');
        css += '\n.particleemu-tab-content{padding:0!important;}\n.particleemu-tab-content .container{height:100%!important;flex-direction:column!important;gap:0!important;}\n.particleemu-tab-content .particleemu-workspace{display:flex;gap:20px;flex:1;min-width:0;min-height:0;}\n.particleemu-tab-content .topbar{display:flex;flex:0 0 48px;align-items:center;gap:8px;margin:0;padding:8px 12px;background:#3a3a3a;border-top:1px solid #464646;border-bottom:1px solid #111;position:relative;z-index:5;}\n.particleemu-tab-content .left,.particleemu-tab-content .right{min-height:0;}\n.particleemu-tab-content .viewport-wrap{flex:1 1 auto!important;min-height:0;}\n.particleemu-tab-content button{background:#353535!important;border:1px solid #0a0a0a!important;border-top-color:#404040!important;border-left-color:#404040!important;color:#e0e0e0!important;box-shadow:inset 0 1px 0 rgba(0,0,0,.3),0 1px 0 rgba(255,255,255,.1)!important;font-family:"chevyray",monospace!important;font-size:12px!important;}\n.particleemu-tab-content button:hover{background:#404040!important;border-color:#555!important;}\n.particleemu-tab-content button:active{background:#1a1a1a!important;border-color:#0a0a0a!important;box-shadow:inset 0 1px 2px rgba(0,0,0,.5)!important;}\n.particleemu-tab-content button.active{background:#4472C4!important;border-color:#6fa8dc!important;}\n.particleemu-tab-content .topbar button,.particleemu-tab-content .toolbar button{height:32px!important;padding:0 10px!important;}\n.particleemu-tab-content .listbar button,.particleemu-tab-content .tabs button{height:28px!important;padding:0 9px!important;}\n.particleemu-tab-content .canvas-controls button{padding:8px 10px!important;}\n.particleemu-tab-content #visualEditor.graph-mode{display:flex!important;flex-direction:column;overflow:hidden;}\n.particleemu-tab-content #visualEditor.graph-mode .editor-grid{display:none;}\n.particleemu-tab-content #particleGraph{display:none;position:relative;flex:1;min-height:0;overflow:hidden;background-color:#1d222b;background-image:linear-gradient(#2f3744 1px,transparent 1px),linear-gradient(90deg,#2f3744 1px,transparent 1px);background-size:20px 20px;border:1px solid #0a0a0a;cursor:grab;}\n.particleemu-tab-content #particleGraph:active{cursor:grabbing;}\n.particleemu-tab-content #visualEditor.graph-mode #particleGraph{display:block;}\n.particleemu-tab-content #particleGraph svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible;transform-origin:0 0;}\n.particleemu-tab-content .particle-graph-node{position:absolute;min-width:184px;max-width:240px;background:#292d35;border:1px solid #111820;box-shadow:0 2px 8px rgba(0,0,0,.45);color:#e7e7e7;cursor:move;user-select:none;transform-origin:0 0;}\n.particleemu-tab-content .particle-graph-node .graph-title{height:27px;padding:6px 8px;background:#3d5269;border-bottom:1px solid #111820;font-size:12px;font-weight:bold;display:flex;align-items:center;gap:6px;}\n.particleemu-tab-content .particle-graph-node.graph-particle .graph-title{background:#3d6958;}\n.particleemu-tab-content .particle-graph-node.graph-modifier .graph-title{background:#654c70;}\n.particleemu-tab-content .particle-graph-node .graph-body{padding:7px 8px;font:11px/1.45 "chevyray",monospace;color:#c9d0d8;white-space:pre-line;}\n.particleemu-tab-content .particle-graph-node .graph-port{position:absolute;width:10px;height:10px;border:1px solid #101820;border-radius:50%;background:#7de1e8;top:9px;}\n.particleemu-tab-content .particle-graph-node .graph-port.in{left:-6px;}\n.particleemu-tab-content .particle-graph-node .graph-port.out{right:-6px;}\n.particleemu-tab-content .particle-graph-node .graph-remove{margin-left:auto;width:18px!important;height:18px!important;padding:0!important;line-height:1!important;}\n.particleemu-tab-content .particle-graph-note{position:absolute;right:10px;bottom:8px;color:#9da9b7;font-size:11px;pointer-events:none;}\n.particleemu-tab-content .particle-graph-controls{position:absolute;top:8px;left:8px;z-index:2;display:flex;gap:4px;align-items:center;}\n.particleemu-tab-content .particle-graph-controls button{width:28px!important;height:28px!important;padding:0!important;}\n.particleemu-tab-content .particle-graph-controls span{min-width:42px;text-align:center;color:#d7dde5;font-size:11px;}\n.particleemu-tab-content .particle-graph-editor{position:absolute;z-index:4;min-width:250px;max-width:300px;padding:10px;background:#20242b;border:1px solid #0a0a0a;box-shadow:0 5px 20px rgba(0,0,0,.65);cursor:default;}\n.particleemu-tab-content .particle-graph-editor h3{margin:0 0 8px;font-size:13px;}\n.particleemu-tab-content .particle-graph-editor label{display:grid;grid-template-columns:92px minmax(0,1fr);gap:6px;align-items:center;margin:5px 0;font-size:11px;}\n.particleemu-tab-content .particle-graph-editor input,.particleemu-tab-content .particle-graph-editor select{width:100%;min-width:0;background:#111820;border:1px solid #46505d;color:#e7e7e7;padding:4px;font:11px "chevyray",monospace;}\n.particleemu-tab-content .particle-graph-editor input[type="checkbox"]{width:auto;}\n.particleemu-tab-content .particle-graph-editor .graph-editor-actions{display:flex;justify-content:flex-end;margin-top:8px;}';
        css = css.replace('height: calc(100dvh - 40px);', 'height: 100%;');
        style.textContent = css;
        wrapper.appendChild(style);
        const content = document.createElement('div');
        content.innerHTML = window.__particleEmuTemplate.body;
        const container = content.firstElementChild;
        const topbar = container.querySelector('.topbar'), left = container.querySelector('.left'), right = container.querySelector('.right'), workspace = document.createElement('div');
        workspace.className = 'particleemu-workspace';
        topbar.remove(); left.remove(); right.remove(); right.querySelector('#outputPanel')?.remove(); workspace.append(left, right); container.append(topbar, workspace);
        container.style.height = '100%';
        container.style.padding = '8px';
        const visual = container.querySelector('#visualEditor');
        const presetSelect = visual?.querySelector('#presetSelect');
        if (presetSelect && !presetSelect.options.length) ['Default Smoke', 'Soft Light Stream', 'Glow Burst', 'Magic Ring'].forEach(name => presetSelect.add(new Option(name, name)));
        const toolbar = visual?.querySelector('.toolbar');
        if (toolbar) {
            const graphButton = document.createElement('button'); graphButton.id = 'btnGraphMode'; graphButton.textContent = 'Node Graph (Alpha)'; graphButton.onclick = () => window.ParticleEmuRuntime?.setVisualEditorMode('graph'); toolbar.appendChild(graphButton);
            const formButton = document.createElement('button'); formButton.id = 'btnFormMode'; formButton.textContent = 'Form'; formButton.style.display = 'none'; formButton.onclick = () => window.ParticleEmuRuntime?.setVisualEditorMode('form'); toolbar.appendChild(formButton);
            const addParticle = document.createElement('button'); addParticle.id = 'btnGraphAddParticle'; addParticle.textContent = '+ Particle'; addParticle.style.display = 'none'; addParticle.onclick = () => window.ParticleEmuRuntime?.addEditorParticle(); toolbar.appendChild(addParticle);
            const addModifier = document.createElement('button'); addModifier.id = 'btnGraphAddModifier'; addModifier.textContent = '+ Modifier'; addModifier.style.display = 'none'; addModifier.onclick = () => window.ParticleEmuRuntime?.addEditorModifier(); toolbar.appendChild(addModifier);
            const addValue = document.createElement('button'); addValue.id = 'btnGraphAddValue'; addValue.textContent = '+ Value'; addValue.style.display = 'none'; addValue.onclick = () => window.ParticleEmuRuntime?.addGraphValueNode(); toolbar.appendChild(addValue);
            const undo = document.createElement('button'); undo.id = 'btnGraphUndo'; undo.textContent = 'Undo'; undo.style.display = 'none'; undo.onclick = () => window.ParticleEmuRuntime?.undoParticleGraph(); toolbar.appendChild(undo);
            const redo = document.createElement('button'); redo.id = 'btnGraphRedo'; redo.textContent = 'Redo'; redo.style.display = 'none'; redo.onclick = () => window.ParticleEmuRuntime?.redoParticleGraph(); toolbar.appendChild(redo);
        }
        if (visual) { const graph = document.createElement('div'); graph.id = 'particleGraph'; graph.innerHTML = '<svg aria-hidden="true"></svg><div class="particle-graph-controls"><button title="Zoom out" onclick="ParticleEmuRuntime.zoomParticleGraph(-1)">-</button><span id="particleGraphZoom">100%</span><button title="Zoom in" onclick="ParticleEmuRuntime.zoomParticleGraph(1)">+</button><button title="Reset graph view" onclick="ParticleEmuRuntime.resetParticleGraphView()">&#8634;</button></div><div class="particle-graph-note">Scroll to zoom, drag the background to pan. Double-click a node to edit.</div>'; visual.appendChild(graph); }
        wrapper.appendChild(container);
        ParticleEmuEditor._content = wrapper;
        await ParticleEmuEditor._loadScript('js/particleengine.js');
    }
    static async _ensureRuntime() {
        if (ParticleEmuEditor._runtimeReady) return;
        ParticleEmuEditor._runtimeReady = true;
    }
    static async mountInto(host) {
        ParticleEmuEditor._host = host;
        await ParticleEmuEditor._ensureContent();
        if (!host) return;
        if (!host.contains(ParticleEmuEditor._content)) host.replaceChildren(ParticleEmuEditor._content);
        await ParticleEmuEditor._ensureRuntime();
        window.ParticleEmuRuntime?.activate?.();
        window.ParticleEmuRuntime?.resizeViewport?.();
        window.switchToTab?.('particleemu');
    }
    static open() {
        const existing = window.tabManager?.getTabsByType?.('particleemu')[0];
        if (existing) return window.tabManager.switchTo(existing.id);
        const tab = window.tabManager?.addTab('particleemu', 'ParticleEmu', { kind: 'particleemu' });
        ParticleEmuEditor._tabId = tab?.id || null;
        return tab;
    }
}
window.ParticleEmuEditor = ParticleEmuEditor;
window.activateParticleEmuTab = function() { ParticleEmuEditor.mountInto(document.getElementById('particleemuTabHost')); };
window.deactivateParticleEmuTab = function() { window.ParticleEmuRuntime?.pauseForTab?.(); };
window.closeParticleEmuTab = function() {
    window.ParticleEmuRuntime?.saveSession?.();
    window.ParticleEmuRuntime?.stopParticles?.();
    if (ParticleEmuEditor._host) ParticleEmuEditor._host.replaceChildren();
    ParticleEmuEditor._tabId = null;
};

window.ParticleEmuRuntime = (() => {

function waitForGraalMonaco(attempts = 20) {
  const init = window.initGraalMonaco;
  if (!init) return Promise.resolve(null);
  return init({ disableCssValidation: true }).then(monaco => {
    if (monaco || attempts <= 0) return monaco;
    return new Promise(resolve => setTimeout(resolve, 100)).then(() => waitForGraalMonaco(attempts - 1));
  });
}
const monacoReady = waitForGraalMonaco();

let bgColor = localStorage.getItem('gsuiteParticleViewportBgColor') || "#006400";
let viewportZoom = parseFloat(localStorage.getItem('gsuiteParticleViewportZoom')) || 1.0;
let viewportPanX = parseFloat(localStorage.getItem('gsuiteParticleViewportPanX')) || 0;
let viewportPanY = parseFloat(localStorage.getItem('gsuiteParticleViewportPanY')) || 0;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let dragStartPanX = 0;
let dragStartPanY = 0;
let particleGraphLinkRedrawFrame = 0;

let particleSystem = null;
let animId = null;
let isPaused = false;
let livePreviewTimer = null;
let drawViewport;
let codeEditor = null;
let codeEditorInit = null;
let outputPanel = null;
let editorMode = 'raw';
let visualEditorMode = 'form';
let selectedParticle = 0;
let selectedModifier = 0;
const graphNodePositions = {};
const particleGraphView = { x:0, y:0, zoom:1 };
const particleGraphConnections = {};
const graphValueNodes = {};
const graphSelectedNodes = new Set();
const particleGraphHistory = [];
let particleGraphHistoryIndex = -1;
let particleGraphLinkDrag = null;
let particleGraphRenderVersion = 0;
function graphSnapshot() { return structuredClone({ editorState, positions:graphNodePositions, connections:particleGraphConnections, values:graphValueNodes }); }
function restoreGraphSnapshot(snapshot) { editorState = structuredClone(snapshot.editorState); [graphNodePositions, particleGraphConnections, graphValueNodes].forEach((target, index) => { Object.keys(target).forEach(key => delete target[key]); Object.assign(target, structuredClone([snapshot.positions, snapshot.connections, snapshot.values][index])); }); graphSelectedNodes.clear(); syncCodeFromVisual(false); scheduleLivePreview(); renderVisualEditor(); }
function recordParticleGraphHistory() { const snapshot = graphSnapshot(), current = particleGraphHistory[particleGraphHistoryIndex]; if (current && JSON.stringify(current) === JSON.stringify(snapshot)) return; particleGraphHistory.splice(particleGraphHistoryIndex + 1); particleGraphHistory.push(snapshot); particleGraphHistoryIndex = particleGraphHistory.length - 1; updateParticleGraphHistoryButtons(); queueParticleSessionSave(); }
function ensureParticleGraphHistory() { if (particleGraphHistoryIndex < 0) recordParticleGraphHistory(); else updateParticleGraphHistoryButtons(); }
function updateParticleGraphHistoryButtons() { const root = editorRoot(); const undo = root.querySelector('#btnGraphUndo'), redo = root.querySelector('#btnGraphRedo'); if (undo) undo.disabled = particleGraphHistoryIndex <= 0; if (redo) redo.disabled = particleGraphHistoryIndex >= particleGraphHistory.length - 1; }
function undoParticleGraph() { if (particleGraphHistoryIndex <= 0) return; particleGraphHistoryIndex--; restoreGraphSnapshot(particleGraphHistory[particleGraphHistoryIndex]); updateParticleGraphHistoryButtons(); }
function redoParticleGraph() { if (particleGraphHistoryIndex >= particleGraphHistory.length - 1) return; particleGraphHistoryIndex++; restoreGraphSnapshot(particleGraphHistory[particleGraphHistoryIndex]); updateParticleGraphHistoryButtons(); }
function defaultGraphPosition(type, index) { if (type === 'particle') return { x:330 + Math.floor(index / 3) * 275, y:54 + index % 3 * 205 }; if (type === 'modifier') return { x:625 + Math.floor(index / 5) * 265, y:42 + index % 5 * 142 }; return { x:50 + Math.floor(index / 4) * 210, y:42 + index % 4 * 116 }; }
function addGraphValueNode() { const id = `value-${Date.now()}`; graphValueNodes[id] = { label:'Value', value:0 }; graphNodePositions[id] = defaultGraphPosition('value', Object.keys(graphValueNodes).length - 1); recordParticleGraphHistory(); renderParticleGraph(); }
function editorRoot() { return window.ParticleEmuEditor?._content?.isConnected ? window.ParticleEmuEditor._content : document; }
function editorElement(id) { return editorRoot().querySelector(`#${id}`) || document.getElementById(id); }
const particleImages = ["aincrad_effect-smoke.gif","delt_aciddrop.png","delt_honeydrop.png","delt_overhead_dragon_particle2.png","era_kozzy-circle-2.png","fire.gif","g4_animation_fire.gif","g4_particle_bluelight.png","g4_particle_bluex.png","g4_particle_bubble.png","g4_particle_cloud.png","g4_particle_halo.png","g4_particle_leaf.png","g4_particle_minus.png","g4_particle_ring.png","g4_particle_sbubble.png","g4_particle_smoke.png","g4_particle_spark.png","g4_particle_spark3.png","g4_particle_spark3a.png","g4_particle_sun.png","g4_particle_tornado.png","g4_particle_whitespot.png","g4_particle_x.png","g4_particle_yellowlight.png","light2.png","light2s.png","light4.png","ol_whom-effect26-heartup4.gif","smoke.gif","smoke.png","smoke2.png","smoke3.png","tig-raindrop.gif"];
function workspaceParticleImage(name) {
  const cache = window.levelEditor?.fileCache?.images;
  if (!(cache instanceof Map)) return null;
  const key = String(name).split(/[\\/]/).pop().toLowerCase();
  const entry = cache.get(key) || [...cache.entries()].find(([entryName]) => entryName.toLowerCase() === key)?.[1];
  return typeof entry === 'string' ? entry : entry?.url || entry?.src || entry?.image?.src || null;
}
async function resolveWorkspaceParticleImage(name) {
  let source = workspaceParticleImage(name);
  if (source) return source;
  const editor = window.levelEditor;
  const tauri = window._tauri;
  if (!editor?.loadImageFromPath || !tauri?.core?.invoke) return null;
  const key = String(name).split(/[\\/]/).pop().toLowerCase();
  const path = editor._tauriPathIndex?.get(key) || await tauri.core.invoke('resolve_path', { name:key });
  if (!path) return null;
  await editor.loadImageFromPath(path, key);
  return workspaceParticleImage(key);
}
function installParticleImageResolver(system) {
  const loadImage = system.loadImage.bind(system);
  system.loadImage = async name => {
    if (system.imageCache[name]) return system.imageCache[name];
    const source = await resolveWorkspaceParticleImage(name);
    if (source) {
      const image = await new Promise(resolve => { const img = new Image(); img.onload = () => resolve(img); img.onerror = () => resolve(null); img.src = source; });
      if (image) { system.imageCache[name] = image; return image; }
    }
    const assetBaseUrl = system.assetBaseUrl;
    try { system.assetBaseUrl = 'images/'; const image = await loadImage(name); if (image) return image; } finally { system.assetBaseUrl = assetBaseUrl; }
    return loadImage(name);
  };
}
const particleEditorPresets = {
  "Default Smoke": {
    emitter: {delaymin: 0.05, delaymax: 0.15, nrofparticles: 3, maxparticles: 200, particletypes: 1, emitautomatically: true, firstinfront: false, emissionoffset: "{0, 0, 0}", layer: 0},
    particles: [{image: "g4_particle_smoke.png", zoom: 1.5, red: 1, green: 0.8, blue: 0.6, alpha: 0.8, mode: 0, lifetime: 3, angle: 0, zangle: 0, speed: 2, rotation: 0, spin: 0, stretchx: 1, stretchy: 1, layer: 0}],
    modifiers: [
      {scope: "local", type: "once", minTime: 0, maxTime: 0, attribute: "angle", operation: "replace", minVal: 0, maxVal: 6.28},
      {scope: "local", type: "once", minTime: 0, maxTime: 0, attribute: "speed", operation: "replace", minVal: 2, maxVal: 4},
      {scope: "local", type: "range", minTime: 0, maxTime: 0.5, attribute: "alpha", operation: "replace", minVal: 0.8, maxVal: 1},
      {scope: "local", type: "range", minTime: 0.5, maxTime: 3, attribute: "alpha", operation: "replace", minVal: 1, maxVal: 0},
      {scope: "local", type: "range", minTime: 0, maxTime: 3, attribute: "zoom", operation: "replace", minVal: 1.5, maxVal: 0.5}
    ]
  },
  "Soft Light Stream": {
    emitter: {delaymin: 0.05, delaymax: 0.05, nrofparticles: 9, maxparticles: 500, particletypes: 1, emitautomatically: true, firstinfront: true, emissionoffset: "{0, 0, 0}", layer: 2},
    particles: [{image: "light2s.png", zoom: 2, red: 0.35, green: 0.51, blue: 0.78, alpha: 0.2, mode: 0, lifetime: 4, angle: "pi / 2", zangle: 0, speed: 2, rotation: 0, spin: 0, stretchx: 1, stretchy: 1, layer: 2}],
    modifiers: [
      {scope: "local", type: "impulse", minTime: 0, maxTime: 0, attribute: "angle", operation: "add", minVal: -0.04, maxVal: 0.04},
      {scope: "local", type: "once", minTime: 0, maxTime: 0, attribute: "x", operation: "add", minVal: 0, maxVal: 5},
      {scope: "local", type: "range", minTime: 0.5, maxTime: 4, attribute: "alpha", operation: "replace", minVal: 0.66, maxVal: 0},
      {scope: "local", type: "range", minTime: 0.4, maxTime: 4, attribute: "zoom", operation: "replace", minVal: 0.6, maxVal: 0},
      {scope: "local", type: "range", minTime: 0.2, maxTime: 1, attribute: "speed", operation: "replace", minVal: 0.5, maxVal: 3}
    ]
  },
  "Glow Burst": {
    emitter: {delaymin: 0.05, delaymax: 0.08, nrofparticles: 1, maxparticles: 120, particletypes: 1, emitautomatically: true, firstinfront: false, emissionoffset: "{-2.5, -2, 0}", layer: 3},
    particles: [{image: "light4.png", zoom: 0.3, red: 1, green: 0.5, blue: 0.8, alpha: 0.3, mode: 0.2, lifetime: 0.8, angle: 1.57, zangle: 0, speed: 2.5, rotation: 0, spin: 0, stretchx: 1, stretchy: 1, layer: 3}],
    modifiers: [
      {scope: "local", type: "once", minTime: 0, maxTime: 0, attribute: "angle", operation: "replace", minVal: 0.97, maxVal: 2.17},
      {scope: "local", type: "once", minTime: 0, maxTime: 0, attribute: "x", operation: "replace", minVal: 21, maxVal: 22},
      {scope: "local", type: "once", minTime: 0, maxTime: 0, attribute: "speed", operation: "replace", minVal: 2.5, maxVal: 10},
      {scope: "local", type: "range", minTime: 0, maxTime: 0.5, attribute: "alpha", operation: "replace", minVal: 0.4, maxVal: 0.15},
      {scope: "local", type: "range", minTime: 0, maxTime: 0.5, attribute: "zoom", operation: "replace", minVal: 1, maxVal: 0.1}
    ]
  },
  "Magic Ring": {
    emitter: {delaymin: 0.65, delaymax: 0.65, nrofparticles: 2, maxparticles: 3, particletypes: 1, emitautomatically: true, firstinfront: true, emissionoffset: "{-1, 1.5, 0}", layer: 0},
    particles: [{image: "era_kozzy-circle-2.png", zoom: 1.1, red: 1, green: 1, blue: 1, alpha: 0.8, mode: 0, lifetime: 1.1, angle: "degtorad(32)", zangle: 0, speed: 0, rotation: 0, spin: 0, stretchx: 2.5, stretchy: 1.4, layer: 0}],
    modifiers: [
      {scope: "local", type: "range", minTime: 0, maxTime: 0.4, attribute: "green", operation: "replace", minVal: 1, maxVal: 0.25},
      {scope: "local", type: "range", minTime: 0, maxTime: 0.4, attribute: "blue", operation: "replace", minVal: 1, maxVal: 0.7},
      {scope: "local", type: "range", minTime: 0, maxTime: 0.5, attribute: "zoom", operation: "replace", minVal: 0, maxVal: 2},
      {scope: "local", type: "range", minTime: 0.5, maxTime: 1.2, attribute: "alpha", operation: "replace", minVal: 1, maxVal: 0.5},
      {scope: "local", type: "range", minTime: 0.8, maxTime: 1, attribute: "zoom", operation: "replace", minVal: 2, maxVal: 0}
    ]
  }
};
let editorState = structuredClone(particleEditorPresets["Soft Light Stream"]);
const particleSessionKey = 'gsuite.particleemu.session';
let particleSessionRestored = false;
let particleSessionRestoring = false;
let particleSessionSaveTimer = 0;

function getParticleCode() {
  return codeEditor ? codeEditor.getValue() : document.getElementById('codeInput').value;
}

function setParticleCode(code) {
  document.getElementById('codeInput').value = code;
  if (codeEditor) codeEditor.setValue(code);
  queueParticleSessionSave();
}

function particleSessionState() {
  return { version:1, code:getParticleCode(), editorState:structuredClone(editorState), editorMode, visualEditorMode, selectedParticle, selectedModifier, positions:structuredClone(graphNodePositions), connections:structuredClone(particleGraphConnections), values:structuredClone(graphValueNodes), graphView:{...particleGraphView}, viewport:{bgColor, zoom:viewportZoom, panX:viewportPanX, panY:viewportPanY} };
}

function saveParticleSession() {
  clearTimeout(particleSessionSaveTimer);
  if (particleSessionRestoring) return;
  try { localStorage.setItem(particleSessionKey, JSON.stringify(particleSessionState())); } catch {}
}

function queueParticleSessionSave() {
  if (particleSessionRestoring) return;
  clearTimeout(particleSessionSaveTimer);
  particleSessionSaveTimer = setTimeout(saveParticleSession, 200);
}

function restoreParticleSession() {
  if (particleSessionRestored) return;
  particleSessionRestored = true;
  try {
    const state = JSON.parse(localStorage.getItem(particleSessionKey) || 'null');
    if (!state || !state.editorState?.emitter || !Array.isArray(state.editorState.particles) || !Array.isArray(state.editorState.modifiers)) return;
    particleSessionRestoring = true;
    editorState = structuredClone(state.editorState);
    selectedParticle = Math.max(0, Math.min(editorState.particles.length - 1, Number.isInteger(state.selectedParticle) ? state.selectedParticle : 0));
    selectedModifier = Math.max(0, Math.min(Math.max(0, editorState.modifiers.length - 1), Number.isInteger(state.selectedModifier) ? state.selectedModifier : 0));
    editorMode = state.editorMode === 'visual' ? 'visual' : 'raw'; visualEditorMode = state.visualEditorMode === 'graph' ? 'graph' : 'form';
    [graphNodePositions, particleGraphConnections, graphValueNodes].forEach((target, index) => { Object.keys(target).forEach(key => delete target[key]); Object.assign(target, structuredClone([state.positions || {}, state.connections || {}, state.values || {}][index])); });
    if (state.graphView && Number.isFinite(state.graphView.zoom)) Object.assign(particleGraphView, { x:Number(state.graphView.x) || 0, y:Number(state.graphView.y) || 0, zoom:Math.max(0.3, Math.min(2.5, state.graphView.zoom)) });
    if (state.viewport) { bgColor = typeof state.viewport.bgColor === 'string' ? state.viewport.bgColor : bgColor; viewportZoom = Number.isFinite(state.viewport.zoom) ? state.viewport.zoom : viewportZoom; viewportPanX = Number.isFinite(state.viewport.panX) ? state.viewport.panX : viewportPanX; viewportPanY = Number.isFinite(state.viewport.panY) ? state.viewport.panY : viewportPanY; }
    if (typeof state.code === 'string') setParticleCode(state.code);
  } catch {} finally { particleSessionRestoring = false; }
}

window.addEventListener('beforeunload', saveParticleSession);

function resizeCanvasToDisplay(canvas) {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}

function formatOutputValue(value) {
  if (typeof value === 'string') return value;
  try { return JSON.stringify(value, null, 2); } catch { return String(value); }
}

function writeOutput(message, type = 'log') {
  if (!outputPanel) outputPanel = document.getElementById('outputPanel');
  if (!outputPanel) return;
  const line = document.createElement('div');
  line.className = type;
  line.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  outputPanel.appendChild(line);
  outputPanel.scrollTop = outputPanel.scrollHeight;
}

function clearOutput() {
  if (!outputPanel) outputPanel = document.getElementById('outputPanel');
  if (outputPanel) outputPanel.textContent = '';
}

function updatePlaybackButton() {
  const btn = document.getElementById('btnPlayPause');
  if (btn) btn.textContent = particleSystem && !isPaused ? 'Pause' : 'Play';
}

function scheduleLivePreview() {
  if (!particleSystem) return;
  clearTimeout(livePreviewTimer);
  livePreviewTimer = setTimeout(() => runParticles({silent: true, preserveOutput: true}), 150);
}

function setEditorMode(mode) {
  editorMode = mode;
  const rawHost = editorElement('codeEditor');
  const rawInput = editorElement('codeInput');
  const visual = editorElement('visualEditor');
  rawHost?.closest('.particleemu-tab-content')?.classList.toggle('visual-mode', mode === 'visual');
  if (rawHost) rawHost.style.display = mode === 'raw' && codeEditor ? 'block' : 'none';
  if (rawInput) rawInput.style.display = mode === 'raw' && !codeEditor ? 'block' : 'none';
  if (visual) visual.style.display = mode === 'visual' ? 'block' : 'none';
  editorElement('btnRawMode')?.classList.toggle('active', mode === 'raw');
  editorElement('btnVisualMode')?.classList.toggle('active', mode === 'visual');
  if (mode === 'visual') renderVisualEditor();
  else ensureCodeEditor().then(() => requestAnimationFrame(() => codeEditor?.layout()));
  queueParticleSessionSave();
}

function setVisualEditorMode(mode) {
  visualEditorMode = mode === 'graph' ? 'graph' : 'form';
  renderVisualEditor();
  queueParticleSessionSave();
}

function fieldHtml(path, label, value, type = 'text', choices = null) {
  const escaped = String(value ?? '').replace(/"/g, '&quot;');
  if (choices) return `<label class="field"><span>${label}</span><select data-path="${path}">${choices.map(v => `<option value="${v}"${String(value) === String(v) ? ' selected' : ''}>${v}</option>`).join('')}</select></label>`;
  if (type === 'checkbox') return `<label class="field"><span>${label}</span><input type="checkbox" data-path="${path}"${value ? ' checked' : ''}></label>`;
  return `<label class="field"><span>${label}</span><input type="${type}" data-path="${path}" value="${escaped}"></label>`;
}

function imageSelectHtml(path, label, value) {
  const images = particleImages;
  const custom = images.includes(value) ? '' : value;
  return `<label class="field"><span>${label}</span><select data-path="${path}">${images.map(v => `<option value="${v}"${value === v ? ' selected' : ''}>${v}</option>`).join('')}</select></label><label class="field"><span>custom image</span><input type="text" data-custom-image-path="${path}" value="${String(custom).replace(/"/g, '&quot;')}"></label>`;
}

function readPath(path) {
  const parts = path.split('.');
  let obj = editorState;
  for (const part of parts) obj = obj[part];
  return obj;
}

function writePath(path, value) {
  const parts = path.split('.');
  let obj = editorState;
  for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
  const key = parts[parts.length - 1];
  const old = obj[key];
  if (typeof old === 'boolean') obj[key] = !!value;
  else if (typeof old === 'number') obj[key] = Number(value);
  else obj[key] = value;
  queueParticleSessionSave();
}

function bindNumberWheel(input) {
  if (input.type !== 'number' || input.dataset.wheelBound) return;
  input.dataset.wheelBound = 'true';
  input.addEventListener('wheel', event => {
    const value = Number(input.value); if (!Number.isFinite(value)) return;
    event.preventDefault();
    const step = Number.isInteger(value) ? 1 : 0.01;
    input.value = String(Math.round((value + (event.deltaY < 0 ? step : -step)) * 1000000) / 1000000);
    input.oninput?.(); input.onchange?.();
  }, { passive:false });
}

function bindEditorInputs() {
  editorRoot().querySelectorAll('#visualEditor [data-path], #visualEditor [data-custom-image-path]').forEach(el => {
    el.oninput = el.onchange = () => {
      const path = el.dataset.customImagePath || el.dataset.path;
      writePath(path, el.type === 'checkbox' ? el.checked : el.value);
      if (path.endsWith('.image') && el.tagName === 'INPUT' && !el.value) return;
      syncCodeFromVisual(false);
      scheduleLivePreview();
    };
    bindNumberWheel(el);
  });
}

function renderVisualEditor() {
  const root = editorRoot(), presetSelect = root.querySelector('#presetSelect');
  if (!presetSelect) return;
  const visual = root.querySelector('#visualEditor');
  visual?.classList.toggle('graph-mode', visualEditorMode === 'graph');
  const graphButton = root.querySelector('#btnGraphMode'), formButton = root.querySelector('#btnFormMode');
  const addParticle = root.querySelector('#btnGraphAddParticle'), addModifier = root.querySelector('#btnGraphAddModifier'), addValue = root.querySelector('#btnGraphAddValue'), undo = root.querySelector('#btnGraphUndo'), redo = root.querySelector('#btnGraphRedo');
  if (graphButton) { graphButton.classList.toggle('active', visualEditorMode === 'graph'); graphButton.style.display = visualEditorMode === 'graph' ? 'none' : ''; }
  if (formButton) { formButton.classList.toggle('active', visualEditorMode === 'form'); formButton.style.display = visualEditorMode === 'graph' ? '' : 'none'; }
  if (addParticle) addParticle.style.display = visualEditorMode === 'graph' ? '' : 'none';
  if (addModifier) addModifier.style.display = visualEditorMode === 'graph' ? '' : 'none';
  if (addValue) addValue.style.display = visualEditorMode === 'graph' ? '' : 'none';
  if (undo) undo.style.display = visualEditorMode === 'graph' ? '' : 'none';
  if (redo) redo.style.display = visualEditorMode === 'graph' ? '' : 'none';
  const presetNames = Object.keys(particleEditorPresets);
  const selectedPreset = presetSelect.value;
  presetSelect.replaceChildren(...presetNames.map(name => { const option = new Option(name, name); return option; }));
  presetSelect.value = presetNames.includes(selectedPreset) ? selectedPreset : presetNames[0] || '';
  presetSelect.onchange = () => loadEditorPreset();
  const e = editorState.emitter;
  root.querySelector('#emitterFields').innerHTML = [
    fieldHtml('emitter.delaymin', 'delay min', e.delaymin, 'number'),
    fieldHtml('emitter.delaymax', 'delay max', e.delaymax, 'number'),
    fieldHtml('emitter.nrofparticles', 'particles/tick', e.nrofparticles, 'number'),
    fieldHtml('emitter.maxparticles', 'max particles', e.maxparticles, 'number'),
    fieldHtml('emitter.layer', 'layer', e.layer, 'number'),
    fieldHtml('emitter.emissionoffset', 'emission offset', e.emissionoffset),
    fieldHtml('emitter.emitautomatically', 'auto emit', e.emitautomatically, 'checkbox'),
    fieldHtml('emitter.firstinfront', 'first in front', e.firstinfront, 'checkbox')
  ].join('');
  selectedParticle = Math.min(selectedParticle, editorState.particles.length - 1);
  selectedModifier = Math.min(selectedModifier, Math.max(0, editorState.modifiers.length - 1));
  const particleTabs = root.querySelector('#particleTabs');
  particleTabs.replaceChildren(...editorState.particles.length > 1 ? editorState.particles.map((p, i) => {
    const button = document.createElement('button');
    button.className = i === selectedParticle ? 'active' : '';
    button.textContent = `Particle ${i + 1}`;
    button.onclick = () => { selectedParticle = i; renderVisualEditor(); };
    return button;
  }) : []);
  particleTabs.style.display = editorState.particles.length > 1 ? '' : 'none';
  const p = editorState.particles[selectedParticle];
  root.querySelector('#particleFields').innerHTML = [
    imageSelectHtml(`particles.${selectedParticle}.image`, 'image', p.image),
    fieldHtml(`particles.${selectedParticle}.lifetime`, 'lifetime', p.lifetime, 'number'),
    fieldHtml(`particles.${selectedParticle}.speed`, 'speed', p.speed, 'number'),
    fieldHtml(`particles.${selectedParticle}.angle`, 'angle', p.angle),
    fieldHtml(`particles.${selectedParticle}.zangle`, 'zangle', p.zangle, 'number'),
    fieldHtml(`particles.${selectedParticle}.zoom`, 'zoom', p.zoom, 'number'),
    fieldHtml(`particles.${selectedParticle}.alpha`, 'alpha', p.alpha, 'number'),
    fieldHtml(`particles.${selectedParticle}.mode`, 'mode', p.mode, 'number'),
    fieldHtml(`particles.${selectedParticle}.red`, 'red', p.red, 'number'),
    fieldHtml(`particles.${selectedParticle}.green`, 'green', p.green, 'number'),
    fieldHtml(`particles.${selectedParticle}.blue`, 'blue', p.blue, 'number'),
    fieldHtml(`particles.${selectedParticle}.stretchx`, 'stretch x', p.stretchx, 'number'),
    fieldHtml(`particles.${selectedParticle}.stretchy`, 'stretch y', p.stretchy, 'number'),
    fieldHtml(`particles.${selectedParticle}.rotation`, 'rotation', p.rotation),
    fieldHtml(`particles.${selectedParticle}.spin`, 'spin', p.spin),
    fieldHtml(`particles.${selectedParticle}.layer`, 'layer', p.layer, 'number')
  ].join('');
  root.querySelector('#modifierTabs').innerHTML = editorState.modifiers.length ? editorState.modifiers.map((m, i) => `<button class="modifier-row ${i === selectedModifier ? 'active' : ''}" onclick="selectedModifier=${i};ParticleEmuRuntime.renderVisualEditor()"><span>M${i}</span><span>${m.scope} ${m.type} ${m.attribute} ${m.operation}</span></button>`).join('') : '<div class="modifier-empty">No modifiers.</div>';
  const m = editorState.modifiers[selectedModifier];
  root.querySelector('#modifierFields').innerHTML = m ? [
    fieldHtml(`modifiers.${selectedModifier}.scope`, 'scope', m.scope, 'text', ['local', 'global', 'emit']),
    fieldHtml(`modifiers.${selectedModifier}.type`, 'time type', m.type, 'text', ['once', 'range', 'impulse']),
    fieldHtml(`modifiers.${selectedModifier}.minTime`, 'range min', m.minTime, 'number'),
    fieldHtml(`modifiers.${selectedModifier}.maxTime`, 'range max', m.maxTime, 'number'),
    fieldHtml(`modifiers.${selectedModifier}.attribute`, 'variable', m.attribute, 'text', ['x', 'y', 'z', 'movex', 'movey', 'movez', 'angle', 'zangle', 'speed', 'rotation', 'spin', 'stretchx', 'stretchy', 'red', 'green', 'blue', 'alpha', 'zoom']),
    fieldHtml(`modifiers.${selectedModifier}.operation`, 'operator', m.operation, 'text', ['replace', 'add', 'multiply']),
    fieldHtml(`modifiers.${selectedModifier}.minVal`, 'value min', m.minVal),
    fieldHtml(`modifiers.${selectedModifier}.maxVal`, 'value max', m.maxVal)
  ].join('') : '<div class="modifier-empty">Add a modifier to edit it.</div>';
  bindEditorInputs();
  if (visualEditorMode === 'graph') renderParticleGraph();
}

function renderParticleGraph() {
  const graph = editorRoot().querySelector('#particleGraph');
  if (!graph) return;
  const renderVersion = ++particleGraphRenderVersion;
  ensureParticleGraphHistory();
  setupParticleGraphNavigation(graph);
  const svg = graph.querySelector('svg');
  svg.replaceChildren();
  graph.querySelectorAll('.particle-graph-node').forEach(node => node.remove());
  const nodes = [{ id:'emitter', type:'emitter', title:'Emitter', x:48, y:150, lines:[`delay ${editorState.emitter.delaymin} - ${editorState.emitter.delaymax}`, `${editorState.emitter.nrofparticles} particles/tick`, `max ${editorState.emitter.maxparticles}`, editorState.emitter.emitautomatically ? 'auto emit' : 'manual emit'] }];
  editorState.particles.forEach((particle, index) => { const pos = defaultGraphPosition('particle', index); nodes.push({ id:`particle-${index}`, type:'particle', index, title:`Particle ${index + 1}`, ...pos, lines:[particle.image, `life ${particle.lifetime}   speed ${particle.speed}`, `zoom ${particle.zoom}   alpha ${particle.alpha}`, `rgb ${particle.red}, ${particle.green}, ${particle.blue}`] }); });
  editorState.modifiers.forEach((modifier, index) => { const pos = defaultGraphPosition('modifier', index); nodes.push({ id:`modifier-${index}`, type:'modifier', index, title:`Modifier ${index + 1}`, ...pos, lines:[`${modifier.scope} ${modifier.type}`, `${modifier.attribute} ${modifier.operation}`, `${modifier.minTime} - ${modifier.maxTime}`, `${modifier.minVal} -> ${modifier.maxVal}`] }); });
  Object.entries(graphValueNodes).forEach(([id, value], index) => { const pos = defaultGraphPosition('value', index); nodes.push({ id, type:'value', index, title:value.label || 'Value', ...pos, lines:[`value ${value.value}`] }); });
  nodes.filter(info => info.type === 'particle').forEach(info => { if (!(info.id in particleGraphConnections)) particleGraphConnections[info.id] = { from:'emitter', property:null }; });
  nodes.filter(info => info.type === 'modifier').forEach(info => { if (!(info.id in particleGraphConnections)) particleGraphConnections[info.id] = { from:'particle-0', property:'out' }; });
  const nodeElements = new Map();
  for (const info of nodes) {
    const pos = graphNodePositions[info.id] || { x:info.x, y:info.y };
    graphNodePositions[info.id] = pos;
    const node = document.createElement('div'); node.className = `particle-graph-node graph-${info.type}${graphSelectedNodes.has(info.id) ? ' selected' : ''}`; node.dataset.id = info.id; node.style.left = `${pos.x}px`; node.style.top = `${pos.y}px`;
    const title = document.createElement('div'); title.className = 'graph-title'; title.textContent = info.title;
    const input = document.createElement('span'); input.className = 'graph-port in'; input.dataset.nodeId = info.id; input.dataset.port = 'in';
    const output = document.createElement('span'); output.className = 'graph-port out'; output.dataset.nodeId = info.id; output.dataset.port = 'out'; if (info.type !== 'emitter' && info.type !== 'value') title.appendChild(input); title.appendChild(output);
    if (info.type !== 'emitter') {
      const remove = document.createElement('button'); remove.className = 'graph-remove'; remove.textContent = 'x'; remove.title = `Remove ${info.title}`;
      remove.style.marginRight = '10px'; remove.onclick = event => { event.stopPropagation(); if (info.type === 'particle') { if (editorState.particles.length <= 1) return; editorState.particles.splice(info.index, 1); editorState.emitter.particletypes = editorState.particles.length; selectedParticle = Math.min(selectedParticle, editorState.particles.length - 1); } else if (info.type === 'modifier') { editorState.modifiers.splice(info.index, 1); selectedModifier = Math.max(0, Math.min(selectedModifier, editorState.modifiers.length - 1)); } else { delete graphValueNodes[info.id]; } delete graphNodePositions[info.id]; delete particleGraphConnections[info.id]; graphSelectedNodes.delete(info.id); syncCodeFromVisual(false); scheduleLivePreview(); recordParticleGraphHistory(); renderVisualEditor(); };
      title.appendChild(remove);
    }
    const body = document.createElement('div'); body.className = 'graph-body'; body.textContent = info.lines.join('\n'); node.append(title, body);
    if (info.type === 'particle') {
      const sockets = document.createElement('div'); sockets.style.cssText = 'display:grid;grid-template-columns:1fr;gap:2px;padding:0 7px 7px;';
      ['speed', 'angle', 'zoom', 'alpha', 'color', 'lifetime'].forEach(property => { const socket = document.createElement('span'); socket.textContent = property; socket.style.cssText = 'position:relative;padding:3px 11px 3px 11px;border:1px solid #404856;background:#20242b;font-size:10px;color:#aebccd;'; const inputPort = document.createElement('span'); inputPort.className = 'graph-port in'; inputPort.dataset.nodeId = info.id; inputPort.dataset.port = property; inputPort.dataset.target = `${info.id}:${property}`; inputPort.style.cssText = 'top:50%;left:-6px;transform:translateY(-50%);'; const outputPort = document.createElement('span'); outputPort.className = 'graph-port out'; outputPort.dataset.nodeId = info.id; outputPort.dataset.port = property; outputPort.style.cssText = 'top:50%;right:-6px;transform:translateY(-50%);'; socket.append(inputPort, outputPort); sockets.appendChild(socket); });
      node.appendChild(sockets);
    }
    input.onpointerdown = event => startParticleGraphLink(graph, event, { target:info.id });
    node.querySelectorAll('.graph-port.in').forEach(port => { port.onpointerdown = event => startParticleGraphLink(graph, event, { target:port.dataset.target || info.id }); });
    node.querySelectorAll('.graph-port.out').forEach(port => { port.onpointerdown = event => startParticleGraphLink(graph, event, { from:info.id, property:port.dataset.port }); });
    node.ondblclick = event => { event.stopPropagation(); openParticleGraphEditor(graph, info, node); };
    node.onpointerdown = event => {
      if (event.button !== 0 || event.target.closest('button, .graph-port')) return;
      if (event.ctrlKey) { graphSelectedNodes.has(info.id) ? graphSelectedNodes.delete(info.id) : graphSelectedNodes.add(info.id); node.classList.toggle('selected', graphSelectedNodes.has(info.id)); event.preventDefault(); event.stopPropagation(); return; }
      if (!graphSelectedNodes.has(info.id)) { graphSelectedNodes.clear(); graphSelectedNodes.add(info.id); graph.querySelectorAll('.particle-graph-node').forEach(item => item.classList.toggle('selected', item.dataset.id === info.id)); }
      const startX = event.clientX, startY = event.clientY, origins = new Map(Array.from(graphSelectedNodes).map(id => [id, { ...graphNodePositions[id] }])); let moved = false;
      node.setPointerCapture(event.pointerId); event.preventDefault(); event.stopPropagation();
      node.onpointermove = move => { if (!node.hasPointerCapture(move.pointerId)) return; const dx = (move.clientX - startX) / particleGraphView.zoom, dy = (move.clientY - startY) / particleGraphView.zoom; moved ||= Math.abs(dx) > 1 || Math.abs(dy) > 1; origins.forEach((origin, id) => { const target = graphNodePositions[id], element = nodeElements.get(id); target.x = Math.max(0, origin.x + dx); target.y = Math.max(0, origin.y + dy); if (element) { element.style.left = `${target.x}px`; element.style.top = `${target.y}px`; } }); applyParticleGraphView(graph); };
      node.onpointerup = up => { if (node.hasPointerCapture(up.pointerId)) node.releasePointerCapture(up.pointerId); node.onpointermove = null; node.onpointerup = null; if (moved) recordParticleGraphHistory(); };
    };
    graph.appendChild(node); nodeElements.set(info.id, node);
  }
  requestAnimationFrame(() => { if (renderVersion !== particleGraphRenderVersion || !graph.isConnected) return; drawParticleGraphLinks(graph, svg, nodeElements); applyParticleGraphView(graph); });
}

function setupParticleGraphNavigation(graph) {
  if (graph.dataset.navigationReady) return;
  graph.dataset.navigationReady = 'true';
  graph.tabIndex = 0;
  graph.addEventListener('keydown', event => { if (!event.ctrlKey || visualEditorMode !== 'graph') return; if (event.key.toLowerCase() === 'z') { event.preventDefault(); event.shiftKey ? redoParticleGraph() : undoParticleGraph(); } else if (event.key.toLowerCase() === 'y') { event.preventDefault(); redoParticleGraph(); } });
  graph.addEventListener('wheel', event => {
    event.preventDefault();
    const rect = graph.getBoundingClientRect(), x = event.clientX - rect.left, y = event.clientY - rect.top;
    setParticleGraphZoom(particleGraphView.zoom * (event.deltaY < 0 ? 1.12 : 1 / 1.12), x, y);
  }, { passive:false });
  graph.onpointerdown = event => {
    if (event.button !== 0 || event.target.closest('.particle-graph-node, .particle-graph-controls')) return;
    graph.focus({ preventScroll:true });
    if (event.shiftKey) {
      const rect = graph.getBoundingClientRect(), startX = event.clientX, startY = event.clientY, box = document.createElement('div'); box.className = 'particle-graph-selection'; graph.appendChild(box); graph.setPointerCapture(event.pointerId); event.preventDefault();
      const update = move => { const left = Math.min(startX, move.clientX) - rect.left, top = Math.min(startY, move.clientY) - rect.top; box.style.left = `${left}px`; box.style.top = `${top}px`; box.style.width = `${Math.abs(move.clientX - startX)}px`; box.style.height = `${Math.abs(move.clientY - startY)}px`; };
      graph.onpointermove = update;
      graph.onpointerup = up => { if (graph.hasPointerCapture(up.pointerId)) graph.releasePointerCapture(up.pointerId); const selectRect = box.getBoundingClientRect(); if (!up.ctrlKey) graphSelectedNodes.clear(); graph.querySelectorAll('.particle-graph-node').forEach(node => { const nodeRect = node.getBoundingClientRect(); if (nodeRect.right >= selectRect.left && nodeRect.left <= selectRect.right && nodeRect.bottom >= selectRect.top && nodeRect.top <= selectRect.bottom) graphSelectedNodes.add(node.dataset.id); node.classList.toggle('selected', graphSelectedNodes.has(node.dataset.id)); }); box.remove(); graph.onpointermove = null; graph.onpointerup = null; };
      return;
    }
    if (!event.ctrlKey) { graphSelectedNodes.clear(); graph.querySelectorAll('.particle-graph-node').forEach(node => node.classList.remove('selected')); }
    const startX = event.clientX, startY = event.clientY, originX = particleGraphView.x, originY = particleGraphView.y;
    graph.setPointerCapture(event.pointerId); event.preventDefault();
    graph.onpointermove = move => { if (!graph.hasPointerCapture(move.pointerId)) return; particleGraphView.x = originX + move.clientX - startX; particleGraphView.y = originY + move.clientY - startY; applyParticleGraphView(graph); };
    graph.onpointerup = up => { if (graph.hasPointerCapture(up.pointerId)) graph.releasePointerCapture(up.pointerId); graph.onpointermove = null; graph.onpointerup = null; };
  };
}

function applyParticleGraphView(graph = editorRoot().querySelector('#particleGraph')) {
  if (!graph) return;
  graph.querySelector('svg').style.transform = 'none';
  graph.querySelectorAll('.particle-graph-node').forEach(node => {
    const x = particleGraphView.x + node.offsetLeft * (particleGraphView.zoom - 1);
    const y = particleGraphView.y + node.offsetTop * (particleGraphView.zoom - 1);
    node.style.transform = `translate(${x}px, ${y}px) scale(${particleGraphView.zoom})`;
  });
  const editor = graph.querySelector('.particle-graph-editor'); if (editor) editor.style.transform = `scale(${particleGraphView.zoom})`;
  const label = graph.querySelector('#particleGraphZoom'); if (label) label.textContent = `${Math.round(particleGraphView.zoom * 100)}%`;
  scheduleParticleGraphLinkRedraw(graph);
  queueParticleSessionSave();
}

function scheduleParticleGraphLinkRedraw(graph) {
  if (particleGraphLinkRedrawFrame) return;
  particleGraphLinkRedrawFrame = requestAnimationFrame(() => {
    particleGraphLinkRedrawFrame = 0;
    if (!graph?.isConnected) return;
    drawParticleGraphLinks(graph, graph.querySelector('svg'), new Map(Array.from(graph.querySelectorAll('.particle-graph-node')).map(node => [node.dataset.id, node])));
  });
}

function setParticleGraphZoom(zoom, anchorX, anchorY) {
  const graph = editorRoot().querySelector('#particleGraph'); if (!graph) return;
  const previous = particleGraphView.zoom, next = Math.max(0.3, Math.min(2.5, zoom));
  const x = anchorX ?? graph.clientWidth / 2, y = anchorY ?? graph.clientHeight / 2;
  particleGraphView.x = x - (x - particleGraphView.x) * next / previous;
  particleGraphView.y = y - (y - particleGraphView.y) * next / previous;
  particleGraphView.zoom = next;
  applyParticleGraphView(graph);
}

function zoomParticleGraph(direction) { setParticleGraphZoom(particleGraphView.zoom * (direction > 0 ? 1.2 : 1 / 1.2)); }

function resetParticleGraphView() {
  particleGraphView.x = 0; particleGraphView.y = 0; particleGraphView.zoom = 1;
  applyParticleGraphView();
}

function openParticleGraphEditor(graph, info, node) {
  graph.querySelector('.particle-graph-editor')?.remove();
  const fields = info.type === 'emitter'
    ? [['delay min', 'delaymin', 'number'], ['delay max', 'delaymax', 'number'], ['particles/tick', 'nrofparticles', 'number'], ['max particles', 'maxparticles', 'number'], ['auto emit', 'emitautomatically', 'checkbox'], ['in front', 'firstinfront', 'checkbox'], ['emission offset', 'emissionoffset', 'text'], ['layer', 'layer', 'number']]
    : info.type === 'particle'
      ? [['image', 'image', 'select'], ['lifetime', 'lifetime', 'number'], ['speed', 'speed', 'number'], ['angle', 'angle', 'text'], ['zangle', 'zangle', 'text'], ['zoom', 'zoom', 'number'], ['alpha', 'alpha', 'number'], ['red', 'red', 'number'], ['green', 'green', 'number'], ['blue', 'blue', 'number'], ['mode', 'mode', 'number'], ['rotation', 'rotation', 'number'], ['spin', 'spin', 'number'], ['layer', 'layer', 'number']]
      : info.type === 'value' ? [['label', 'label', 'text'], ['value', 'value', 'number']]
        : [['scope', 'scope', 'select', ['local', 'global', 'emit']], ['time type', 'type', 'select', ['once', 'range', 'impulse']], ['range min', 'minTime', 'number'], ['range max', 'maxTime', 'number'], ['variable', 'attribute', 'select', ['x', 'y', 'z', 'movex', 'movey', 'movez', 'angle', 'zangle', 'speed', 'rotation', 'spin', 'stretchx', 'stretchy', 'red', 'green', 'blue', 'alpha', 'zoom']], ['operation', 'operation', 'select', ['replace', 'add', 'multiply']], ['value min', 'minVal', 'number'], ['value max', 'maxVal', 'number']];
  const target = info.type === 'emitter' ? editorState.emitter : (info.type === 'particle' ? editorState.particles[info.index] : (info.type === 'value' ? graphValueNodes[info.id] : editorState.modifiers[info.index]));
  const panel = document.createElement('div'); panel.className = 'particle-graph-editor';
  const rect = graph.getBoundingClientRect(), nodeRect = node.getBoundingClientRect();
  panel.style.left = `${Math.min(graph.clientWidth - 308, Math.max(8, nodeRect.right - rect.left + 10))}px`;
  panel.style.top = `${Math.min(graph.clientHeight - 64, Math.max(8, nodeRect.top - rect.top))}px`;
  panel.style.transformOrigin = 'top left';
  panel.style.transform = `scale(${particleGraphView.zoom})`;
  const title = document.createElement('h3'); title.textContent = `Edit ${info.title}`; panel.appendChild(title);
  fields.forEach(([label, key, type, choices]) => {
    const row = document.createElement('label'); const name = document.createElement('span'); name.textContent = label;
    let input;
    if (type === 'select') { input = document.createElement('select'); (choices || particleImages).forEach(value => input.add(new Option(value, value))); }
    else { input = document.createElement('input'); input.type = type; }
    if (type === 'checkbox') input.checked = !!target[key]; else input.value = target[key] ?? '';
    input.onchange = () => { target[key] = type === 'checkbox' ? input.checked : (type === 'number' ? Number(input.value) : input.value); syncCodeFromVisual(false); scheduleLivePreview(); recordParticleGraphHistory(); renderParticleGraph(); };
    bindNumberWheel(input);
    row.append(name, input); panel.appendChild(row);
  });
  const actions = document.createElement('div'); actions.className = 'graph-editor-actions'; const close = document.createElement('button'); close.textContent = 'Close'; close.onclick = () => panel.remove(); actions.appendChild(close); panel.appendChild(actions);
  panel.onpointerdown = event => event.stopPropagation(); graph.appendChild(panel);
}

function startParticleGraphLink(graph, event, link) {
  if (event.button !== 0) return;
  event.preventDefault(); event.stopPropagation();
  particleGraphLinkDrag = link;
  graph.setPointerCapture(event.pointerId);
  const finish = release => {
    if (!graph.hasPointerCapture(release.pointerId)) return;
    graph.releasePointerCapture(release.pointerId);
    const port = document.elementFromPoint(release.clientX, release.clientY)?.closest('.graph-port');
    const nodeId = port?.dataset.nodeId, targetId = port?.dataset.target || nodeId;
    let changed = false;
    if (particleGraphLinkDrag?.from && port?.classList.contains('in') && nodeId !== particleGraphLinkDrag.from) {
      particleGraphConnections[targetId] = { from:particleGraphLinkDrag.from, property:particleGraphLinkDrag.property };
      changed = true;
      if (nodeId.startsWith('modifier-') && particleGraphLinkDrag.property && particleGraphLinkDrag.property !== 'out') editorState.modifiers[Number(nodeId.slice(9))].attribute = particleGraphLinkDrag.property === 'color' ? 'alpha' : particleGraphLinkDrag.property;
      if (targetId.includes(':') && particleGraphLinkDrag.from.startsWith('value-')) { const [particleId, property] = targetId.split(':'); const value = graphValueNodes[particleGraphLinkDrag.from]?.value; if (editorState.particles[Number(particleId.slice(9))]) editorState.particles[Number(particleId.slice(9))][property] = value; }
    } else if (particleGraphLinkDrag?.target && port?.classList.contains('out') && nodeId !== particleGraphLinkDrag.target) {
      particleGraphConnections[particleGraphLinkDrag.target] = { from:nodeId, property:port.dataset.port };
      changed = true;
    }
    particleGraphLinkDrag = null;
    graph.onpointermove = null; graph.onpointerup = null;
    if (changed) { syncCodeFromVisual(false); scheduleLivePreview(); recordParticleGraphHistory(); renderParticleGraph(); }
    else drawParticleGraphLinks(graph, graph.querySelector('svg'), new Map(Array.from(graph.querySelectorAll('.particle-graph-node')).map(node => [node.dataset.id, node])));
  };
  graph.onpointermove = move => { if (!particleGraphLinkDrag) return; drawParticleGraphLinks(graph, graph.querySelector('svg'), new Map(Array.from(graph.querySelectorAll('.particle-graph-node')).map(node => [node.dataset.id, node])), { x:move.clientX, y:move.clientY, link:particleGraphLinkDrag }); };
  graph.onpointerup = finish;
}

function drawParticleGraphLinks(graph, svg, nodes, preview = null) {
  const width = graph.clientWidth, height = graph.clientHeight;
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`); svg.replaceChildren();
  const point = (node, selector) => {
    const port = node.querySelector(selector) || node.querySelector('.graph-port.out');
    if (!port) return null;
    const rect = port.getBoundingClientRect(), graphRect = graph.getBoundingClientRect();
    const point = { x:rect.left + rect.width / 2 - graphRect.left, y:rect.top + rect.height / 2 - graphRect.top };
    return Number.isFinite(point.x) && Number.isFinite(point.y) ? point : null;
  };
  const nodeBox = node => { const rect = node.getBoundingClientRect(), graphRect = graph.getBoundingClientRect(); return { left:rect.left - graphRect.left - 8, right:rect.right - graphRect.left + 8, top:rect.top - graphRect.top - 8, bottom:rect.bottom - graphRect.top + 8 }; };
  const pathFor = (a, b, from, to) => {
    if (a.x >= b.x - 28) return `M ${a.x} ${a.y} C ${a.x + 55} ${a.y}, ${b.x - 55} ${b.y}, ${b.x} ${b.y}`;
    const boxes = Array.from(nodes.entries()).filter(([id]) => id !== from && id !== to).map(([, node]) => nodeBox(node));
    const hits = (x1, y1, x2, y2) => boxes.some(box => x1 === x2 ? x1 >= box.left && x1 <= box.right && Math.max(y1, y2) >= box.top && Math.min(y1, y2) <= box.bottom : y1 >= box.top && y1 <= box.bottom && Math.max(x1, x2) >= box.left && Math.min(x1, x2) <= box.right);
    for (let lane = a.x + 24; lane < b.x - 24; lane += 18) if (!hits(a.x, a.y, lane, a.y) && !hits(lane, a.y, lane, b.y) && !hits(lane, b.y, b.x, b.y)) return `M ${a.x} ${a.y} H ${lane} V ${b.y} H ${b.x}`;
    return `M ${a.x} ${a.y} C ${a.x + 45} ${a.y}, ${b.x - 45} ${b.y}, ${b.x} ${b.y}`;
  };
  const connect = (from, to, property, color, detachable = true) => {
    const targetNodeId = to.split(':')[0], a = nodes.get(from), b = nodes.get(targetNodeId); if (!a || !b) return;
    const targetSelector = to.includes(':') ? `.graph-port.in[data-target="${to}"]` : '.graph-port.in';
    const aPoint = point(a, `.graph-port.out[data-port="${property || 'out'}"]`), bPoint = point(b, targetSelector); if (!aPoint || !bPoint) return;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path'); path.setAttribute('d', pathFor(aPoint, bPoint, from, targetNodeId)); path.setAttribute('fill', 'none'); path.setAttribute('stroke', color); path.setAttribute('stroke-width', '2'); path.setAttribute('stroke-linejoin', 'round'); path.style.pointerEvents = 'stroke'; path.classList.add('graph-link');
    if (detachable) path.onpointerdown = event => { event.preventDefault(); event.stopPropagation(); particleGraphConnections[to] = null; recordParticleGraphHistory(); renderParticleGraph(); };
    svg.appendChild(path);
  };
  Object.entries(particleGraphConnections).forEach(([to, connection]) => { if (connection?.from) connect(connection.from, to, connection.property, to.startsWith('modifier-') ? '#cb9ee0' : (to.includes(':') ? '#f1d878' : '#78d8df')); });
  if (preview?.link?.from) {
    const source = nodes.get(preview.link.from); if (!source) return;
    const aPoint = point(source, `.graph-port.out[data-port="${preview.link.property || 'out'}"]`), graphRect = graph.getBoundingClientRect();
    if (!aPoint) return;
    const x = preview.x - graphRect.left, y = preview.y - graphRect.top;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path'); path.setAttribute('d', `M ${aPoint.x} ${aPoint.y} C ${aPoint.x + 45} ${aPoint.y}, ${x - 45} ${y}, ${x} ${y}`); path.setAttribute('fill', 'none'); path.setAttribute('stroke', '#f1d878'); path.setAttribute('stroke-width', '2'); path.setAttribute('stroke-dasharray', '5 4'); svg.appendChild(path);
  }
}

function addEditorParticle() {
  editorState.particles.push({...editorState.particles[selectedParticle], image: 'g4_particle_spark.png'});
  editorState.emitter.particletypes = editorState.particles.length;
  selectedParticle = editorState.particles.length - 1;
  recordParticleGraphHistory();
  renderVisualEditor();
  syncCodeFromVisual(false);
  scheduleLivePreview();
}

function removeEditorParticle() {
  if (editorState.particles.length <= 1) return;
  editorState.particles.splice(selectedParticle, 1);
  editorState.emitter.particletypes = editorState.particles.length;
  selectedParticle = Math.max(0, selectedParticle - 1);
  recordParticleGraphHistory();
  renderVisualEditor();
  syncCodeFromVisual(false);
  scheduleLivePreview();
}

function addEditorModifier() {
  editorState.modifiers.push({scope: 'local', type: 'once', minTime: 0, maxTime: 0, attribute: 'angle', operation: 'replace', minVal: 0, maxVal: 0});
  selectedModifier = editorState.modifiers.length - 1;
  recordParticleGraphHistory();
  renderVisualEditor();
  syncCodeFromVisual(false);
  scheduleLivePreview();
}

function removeEditorModifier() {
  if (!editorState.modifiers.length) return;
  editorState.modifiers.splice(selectedModifier, 1);
  selectedModifier = Math.max(0, selectedModifier - 1);
  recordParticleGraphHistory();
  renderVisualEditor();
  syncCodeFromVisual(false);
  scheduleLivePreview();
}

function loadEditorPreset() {
  editorState = structuredClone(particleEditorPresets[editorElement('presetSelect').value]);
  selectedParticle = 0;
  selectedModifier = 0;
  renderVisualEditor();
  applyVisualEditor();
}

function modifierFunction(scope) {
  if (scope === 'global') return 'addglobalmodifier';
  if (scope === 'emit') return 'addemitmodifier';
  return 'addlocalmodifier';
}

function editorValue(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '0';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}

function buildEditorCode() {
  const e = editorState.emitter;
  const lines = ['//#CLIENTSIDE', 'function onCreated() {', '  with (findimg(200)) {', `    layer = ${editorValue(e.layer)};`, '    x = thiso.x;', '    y = thiso.y;', '    with (emitter) {'];
  ['delaymin', 'delaymax', 'nrofparticles', 'maxparticles', 'emitautomatically', 'firstinfront'].forEach(k => lines.push(`      ${k} = ${editorValue(e[k])};`));
  lines.push(`      particletypes = ${editorState.particles.length};`);
  lines.push(`      emissionoffset = ${e.emissionoffset || '{0, 0, 0}'};`);
  editorState.particles.forEach((p, i) => {
    lines.push(`      with (particles[${i}]) {`);
    lines.push(`        image = "${p.image}";`);
    ['zoom', 'red', 'green', 'blue', 'alpha', 'mode', 'lifetime', 'angle', 'zangle', 'speed', 'rotation', 'spin', 'stretchx', 'stretchy', 'layer'].forEach(k => lines.push(`        ${k} = ${editorValue(p[k])};`));
    lines.push('      }');
  });
  editorState.modifiers.forEach(m => lines.push(`      ${modifierFunction(m.scope)}("${m.type}", ${editorValue(m.minTime)}, ${editorValue(m.maxTime)}, "${m.attribute}", "${m.operation}", ${editorValue(m.minVal)}, ${editorValue(m.maxVal)});`));
  lines.push('    }', '  }', '}');
  return lines.join('\n');
}

function syncCodeFromVisual(switchToRaw = false) {
  const code = buildEditorCode();
  setParticleCode(code);
  if (switchToRaw) setEditorMode('raw');
  return code;
}

function applyVisualEditor() {
  syncCodeFromVisual(false);
  runParticles();
}

function syncVisualFromCode() {
  const config = parseGS2ParticleCode(getParticleCode(), {x: 24, y: 24});
  const first = Array.isArray(config.emitters) ? config.emitters[0] : config;
  if (!first || !first.particles?.length) {
    writeOutput('could not find an editable emitter in the current code', 'warn');
    return;
  }
  editorState = {
    emitter: {
      delaymin: first.delaymin ?? 1,
      delaymax: first.delaymax ?? 1,
      nrofparticles: first.nrofparticles ?? 0,
      maxparticles: first.maxparticles ?? 100000,
      particletypes: first.particletypes ?? first.particles.length,
      emitautomatically: first.emitautomatically !== false,
      firstinfront: first.firstinfront !== false,
      emissionoffset: `{${first.emissionoffset?.x ?? 0}, ${first.emissionoffset?.y ?? 0}, ${first.emissionoffset?.z ?? 0}}`,
      layer: first.layer ?? 0
    },
    particles: first.particles.filter(p => p?.image).map(p => ({
      image: p.image || 'block.png', zoom: p.zoom ?? 1, red: p.red ?? 1, green: p.green ?? 1, blue: p.blue ?? 1, alpha: p.alpha ?? 1, mode: p.mode ?? 0, lifetime: p.lifetime ?? 1, angle: p.angle ?? 0, zangle: p.zangle ?? 0, speed: p.speed ?? 0, rotation: p.rotation ?? 0, spin: p.spin ?? 0, stretchx: p.stretchx ?? 1, stretchy: p.stretchy ?? 1, layer: p.layer ?? 0
    })),
    modifiers: (first.modifiers || []).map(m => ({scope: m.isGlobal ? 'global' : 'local', type: m.type, minTime: m.minTime, maxTime: m.maxTime, attribute: m.attribute, operation: m.operation, minVal: m.minVal, maxVal: m.maxVal}))
  };
  if (!editorState.particles.length) editorState.particles.push(structuredClone(particleEditorPresets["Soft Light Stream"].particles[0]));
  selectedParticle = 0;
  selectedModifier = 0;
  setEditorMode('visual');
  renderVisualEditor();
}

['log', 'warn', 'error'].forEach(type => {
  const original = console[type].bind(console);
  console[type] = (...args) => {
    original(...args);
    if (args.some(arg => typeof arg === 'string' && /Failed to load|Particle template|Missing image|error|warn/i.test(arg))) {
      writeOutput(args.map(formatOutputValue).join(' '), type === 'log' ? 'ok' : type);
    }
  };
});

function ensureCodeEditor() {
  if (codeEditor) return Promise.resolve(true);
  if (codeEditorInit) return codeEditorInit;
  codeEditorInit = (async () => {
    const monaco = await monacoReady;
    if (!monaco?.editor) return false;
    const input = document.getElementById('codeInput');
    const host = document.getElementById('codeEditor');
    if (!input || !host) return false;
    codeEditor = monaco.editor.create(host, {
    value: input.value,
    language: 'graalscript',
    theme: 'graal-default',
    automaticLayout: true,
    minimap: { enabled: false },
    fontSize: 12,
    fontFamily: 'Consolas, monospace',
    cursorStyle: 'line',
    cursorWidth: 3,
    cursorBlinking: 'blink',
    tabSize: 2,
    insertSpaces: true,
    scrollBeyondLastLine: false,
    folding: false,
    foldingHighlight: false,
    showFoldingControls: 'never',
    foldingStrategy: 'indentation',
    glyphMargin: false,
    renderLineHighlight: 'none',
    stickyScroll: { enabled: false },
    wordWrap: 'off',
    suggestOnTriggerCharacters: true,
    quickSuggestions: { other: true, comments: false, strings: false }
    });
    codeEditor.onDidChangeModelContent(() => {
      input.value = codeEditor.getValue();
      codeEditor.getAction('editor.unfoldAll')?.run();
      if (editorMode === 'raw') scheduleLivePreview();
      queueParticleSessionSave();
    });
    codeEditor.getAction('editor.unfoldAll')?.run();
    host.closest('.particleemu-tab-content')?.classList.add('monaco-ready');
    setEditorMode(editorMode);
    requestAnimationFrame(() => codeEditor.layout());
    window.addEventListener('resize', () => requestAnimationFrame(() => codeEditor.layout()));
    return true;
  })().finally(() => { if (!codeEditor) codeEditorInit = null; });
  return codeEditorInit;
}
let viewportInitialized = false;
let codeInputInitialized = false;

function initializeViewport() {
  if (viewportInitialized) return;
  const canvas = document.getElementById('viewport');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  viewportInitialized = true;
  
  drawViewport = function() {
    resizeCanvasToDisplay(canvas);
    const width = canvas.width;
    const height = canvas.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
    
    ctx.save();
    const centerX = width / 2;
    const centerY = height / 2;
    ctx.translate(centerX + viewportPanX, centerY + viewportPanY);
    ctx.scale(viewportZoom, viewportZoom);
    
    drawGrid(ctx, width, height, viewportZoom, viewportPanX, viewportPanY);
    
    if (particleSystem) {
      particleSystem.draw(ctx);
    }
    ctx.restore();
  };
  
  drawViewport();
  
  document.getElementById('btnResetView').onclick = () => {
    viewportZoom = 1.0;
    viewportPanX = 0;
    viewportPanY = 0;
    bgColor = '#006400';
    colorPicker.value = bgColor;
    localStorage.setItem('gsuiteParticleViewportZoom', viewportZoom);
    localStorage.setItem('gsuiteParticleViewportPanX', viewportPanX);
    localStorage.setItem('gsuiteParticleViewportPanY', viewportPanY);
    localStorage.setItem('gsuiteParticleViewportBgColor', bgColor);
    queueParticleSessionSave();
    drawViewport();
  };
  
  const colorPicker = document.createElement('input');
  colorPicker.type = 'color';
  colorPicker.value = bgColor;
  colorPicker.style.display = 'none';
  document.body.appendChild(colorPicker);
  
  canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();
    colorPicker.value = bgColor;
    colorPicker.onchange = (event) => {
      bgColor = event.target.value;
      localStorage.setItem('gsuiteParticleViewportBgColor', bgColor);
      queueParticleSessionSave();
      drawViewport();
    };
    colorPicker.click();
    return false;
  });
  
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    resizeCanvasToDisplay(canvas);
    const rect = canvas.getBoundingClientRect();
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const worldX = (mouseX - centerX - viewportPanX) / viewportZoom;
    const worldY = (mouseY - centerY - viewportPanY) / viewportZoom;
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(10, viewportZoom * zoomFactor));
    viewportZoom = newZoom;
    viewportPanX = mouseX - centerX - worldX * viewportZoom;
    viewportPanY = mouseY - centerY - worldY * viewportZoom;
    localStorage.setItem('gsuiteParticleViewportZoom', viewportZoom);
    localStorage.setItem('gsuiteParticleViewportPanX', viewportPanX);
    localStorage.setItem('gsuiteParticleViewportPanY', viewportPanY);
    queueParticleSessionSave();
    drawViewport();
  });
  
  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
      isDragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      dragStartPanX = viewportPanX;
      dragStartPanY = viewportPanY;
      canvas.style.cursor = 'grabbing';
    }
  });
  
  canvas.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const rect = canvas.getBoundingClientRect();
      viewportPanX = dragStartPanX + (e.clientX - dragStartX);
      viewportPanY = dragStartPanY + (e.clientY - dragStartY);
      localStorage.setItem('gsuiteParticleViewportPanX', viewportPanX);
      localStorage.setItem('gsuiteParticleViewportPanY', viewportPanY);
      queueParticleSessionSave();
      drawViewport();
    }
  });
  
  canvas.addEventListener('mouseup', (e) => {
    if (e.button === 0) {
      isDragging = false;
      canvas.style.cursor = 'default';
    }
  });
  
  canvas.addEventListener('mouseleave', () => {
    isDragging = false;
    canvas.style.cursor = 'default';
  });
  window.addEventListener('resize', () => requestAnimationFrame(drawViewport));
  if (window.visualViewport) window.visualViewport.addEventListener('resize', () => requestAnimationFrame(drawViewport));
  new ResizeObserver(() => requestAnimationFrame(drawViewport)).observe(canvas.parentElement);
  window.addEventListener('focus', () => particleSystem?.resetClock());
  document.addEventListener('visibilitychange', () => { if (!document.hidden) particleSystem?.resetClock(); });
}

function initializeCodeInput() {
  if (codeInputInitialized) return;
  const input = document.getElementById('codeInput');
  if (!input) return;
  codeInputInitialized = true;
  input.addEventListener('input', () => {
    if (editorMode === 'raw') scheduleLivePreview();
    queueParticleSessionSave();
  });
}

function lightenColor(color, amount) {
  const num = parseInt(color.replace("#", ""), 16);
  const r = Math.min(255, Math.floor((num >> 16) + amount * (255 - (num >> 16))));
  const g = Math.min(255, Math.floor(((num >> 8) & 0x00FF) + amount * (255 - ((num >> 8) & 0x00FF))));
  const b = Math.min(255, Math.floor((num & 0x0000FF) + amount * (255 - (num & 0x0000FF))));
  return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

function drawGrid(ctx, width, height, zoom, panX, panY) {
  ctx.imageSmoothingEnabled = false;
  const levelSize = 64 * 16;
  const lightColor = lightenColor(bgColor, 0.4);
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
  ctx.moveTo(0.5 + levelSize, 1.5);
  ctx.lineTo(0.5 + levelSize, 0.5 + levelSize);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(0.5 + 1, 0.5 + levelSize);
  ctx.lineTo(0.5 + levelSize, 0.5 + levelSize);
  ctx.stroke();
  
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}

async function runParticles(options = {}) {
  if (animId) cancelAnimationFrame(animId);
  if (!options.preserveOutput) clearOutput();
  try {
    const code = getParticleCode();
    const canvas = document.getElementById('viewport');
    const ctx = canvas.getContext('2d');
    particleSystem = new ParticleSystem(canvas, ctx, { assetBaseUrl: "images/particleemu/" });
    installParticleImageResolver(particleSystem);
    const config = parseGS2ParticleCode(code);
    const configs = Array.isArray(config.emitters) ? config.emitters : [config];
    const imageList = [...(config.staticImages || []).map(item => item?.image).filter(Boolean), ...configs.flatMap(c => (c.particles || []).map(p => p?.image).filter(Boolean))];
    if (!options.silent) {
      writeOutput(`parsed emitter${configs.length === 1 ? '' : 's'}: count=${configs.length}, images=${imageList.length}`, 'ok');
      if (imageList.length) writeOutput(`images: ${imageList.join(', ')}`, 'ok');
      if (!imageList.length) writeOutput('no particle image parsed from script', 'warn');
    }
    await particleSystem.createEmitter(config);
    const emitter = particleSystem.emitters[0];
    isPaused = false;
    updatePlaybackButton();
    if (!options.silent) writeOutput(`emitter ready: active=${emitter?.activeParticles.length || 0}, auto=${emitter?.emitautomatically}, next delay=${emitter?.currentDelay?.toFixed?.(3) ?? emitter?.currentDelay}s`, 'ok');
    animate();
  } catch (error) {
    writeOutput(error && error.stack ? error.stack : String(error), 'error');
  }
}

function togglePlayPause() {
  if (!particleSystem) {
    runParticles();
    return;
  }
  isPaused = !isPaused;
  if (!isPaused) {
    particleSystem.resetClock();
    if (!animId) animate();
  }
  updatePlaybackButton();
  if (drawViewport) drawViewport();
}

function stopParticles() {
  if (animId) cancelAnimationFrame(animId);
  animId = null;
  isPaused = false;
  if (particleSystem) particleSystem.clear();
  particleSystem = null;
  updatePlaybackButton();
  writeOutput('stopped', 'warn');
  if (drawViewport) {
    drawViewport();
  }
}

function animate() {
  const canvas = document.getElementById('viewport');
  const ctx = canvas.getContext('2d');
  resizeCanvasToDisplay(canvas);
  const width = canvas.width;
  const height = canvas.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);
  
  ctx.save();
  const centerX = width / 2;
  const centerY = height / 2;
  ctx.translate(centerX + viewportPanX, centerY + viewportPanY);
  ctx.scale(viewportZoom, viewportZoom);
  
  drawGrid(ctx, width, height, viewportZoom, viewportPanX, viewportPanY);
  
  if (particleSystem) {
    if (!isPaused) particleSystem.update();
    particleSystem.draw(ctx);
  }
  ctx.restore();
  
  animId = isPaused ? null : requestAnimationFrame(animate);
}

function activate() {
  initializeViewport();
  initializeCodeInput();
  restoreParticleSession();
  renderVisualEditor();
  setEditorMode(editorMode);
  ensureCodeEditor();
  if (!particleSystem) runParticles({silent: true});
}

return { getParticleCode: getParticleCode, setParticleCode: setParticleCode, saveSession: saveParticleSession, resizeCanvasToDisplay: resizeCanvasToDisplay, formatOutputValue: formatOutputValue, writeOutput: writeOutput, clearOutput: clearOutput, updatePlaybackButton: updatePlaybackButton, scheduleLivePreview: scheduleLivePreview, setEditorMode: setEditorMode, setVisualEditorMode: setVisualEditorMode, zoomParticleGraph: zoomParticleGraph, resetParticleGraphView: resetParticleGraphView, undoParticleGraph: undoParticleGraph, redoParticleGraph: redoParticleGraph, addGraphValueNode: addGraphValueNode, fieldHtml: fieldHtml, imageSelectHtml: imageSelectHtml, readPath: readPath, writePath: writePath, bindEditorInputs: bindEditorInputs, renderVisualEditor: renderVisualEditor, addEditorParticle: addEditorParticle, removeEditorParticle: removeEditorParticle, addEditorModifier: addEditorModifier, removeEditorModifier: removeEditorModifier, loadEditorPreset: loadEditorPreset, modifierFunction: modifierFunction, editorValue: editorValue, buildEditorCode: buildEditorCode, syncCodeFromVisual: syncCodeFromVisual, applyVisualEditor: applyVisualEditor, syncVisualFromCode: syncVisualFromCode, lightenColor: lightenColor, drawGrid: drawGrid, togglePlayPause: togglePlayPause, stopParticles: stopParticles, animate: animate, activate: activate, resizeViewport: () => { const canvas = document.getElementById('viewport'); if (canvas) resizeCanvasToDisplay(canvas); }, pauseForTab: () => { isPaused = true; if (animId) cancelAnimationFrame(animId); animId = null; updatePlaybackButton(); } };
})();
