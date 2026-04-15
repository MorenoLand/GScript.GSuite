class BeautifyTool {
    static _dialog = null;
    static _host = null;
    static _inputEditor = null;
    static _outputEditor = null;
    static _monacoReady = false;
    static _beautifyScriptPromise = null;
    static _tabId = null;

    static async _ensureBeautifyLib() {
        if (typeof window.js_beautify === 'function') return;
        if (BeautifyTool._beautifyScriptPromise) return BeautifyTool._beautifyScriptPromise;
        BeautifyTool._beautifyScriptPromise = new Promise(resolve => {
            const existing = document.querySelector('script[data-gsuite-beautify-lib="1"]');
            if (existing) {
                existing.addEventListener('load', () => resolve(), { once: true });
                existing.addEventListener('error', () => resolve(), { once: true });
                return;
            }
            const s = document.createElement('script');
            s.src = 'https://cdn.jsdelivr.net/npm/js-beautify@1.15.4/js/lib/beautify.js';
            s.dataset.gsuiteBeautifyLib = '1';
            s.onload = () => resolve();
            s.onerror = () => resolve();
            document.head.appendChild(s);
        });
        return BeautifyTool._beautifyScriptPromise;
    }

    static _stripComments(code) {
        const directives = [];
        let processedCode = code.replace(/^\/\/#CLIENTSIDE\s*$/gm, match => {
            directives.push(match);
            return `__DIRECTIVE_${directives.length - 1}__`;
        });
        const lines = processedCode.split('\n');
        const result = [];
        let inMulti = false;
        let inString = false;
        let strDelim = '';
        let escaped = false;
        for (const line of lines) {
            let res = '';
            let j = 0;
            while (j < line.length) {
                if (inMulti) {
                    if (line.substring(j, j + 2) === '*/') {
                        j += 2;
                        inMulti = false;
                    } else {
                        j++;
                    }
                    continue;
                }
                if (inString) {
                    if (line[j] === '\\' && !escaped) {
                        res += line[j];
                        escaped = true;
                        j++;
                        continue;
                    }
                    if (line[j] === strDelim && !escaped) {
                        res += strDelim;
                        j++;
                        inString = false;
                        continue;
                    }
                    res += line[j];
                    if (escaped) escaped = false;
                    j++;
                    continue;
                }
                if (line[j] === '"' || line[j] === "'" || line[j] === '`') {
                    strDelim = line[j];
                    inString = true;
                    res += line[j];
                    j++;
                    continue;
                }
                if (line.substring(j, j + 2) === '/*') {
                    inMulti = true;
                    j += 2;
                    continue;
                }
                if (line.substring(j, j + 2) === '//') {
                    j = line.length;
                    continue;
                }
                res += line[j];
                j++;
            }
            result.push(res);
        }
        processedCode = result.join('\n');
        directives.forEach((dir, i) => {
            processedCode = processedCode.replace(`__DIRECTIVE_${i}__`, dir);
        });
        return processedCode;
    }

    static _simpleBeautify(code, indentSetting) {
        const indentUnit = indentSetting === 'tab' ? '\t' : ' '.repeat(parseInt(indentSetting, 10) || 2);
        let normalized = code
            .replace(/\r\n/g, '\n')
            .replace(/[ \t]+\n/g, '\n')
            .replace(/([{};])/g, '$1\n')
            .replace(/\n+/g, '\n');
        normalized = normalized
            .replace(/\n([;,\]\)])/g, '$1')
            .replace(/([}\]])\n;/g, '$1;')
            .replace(/([}\]])\n,/g, '$1,');
        const lines = normalized.split('\n').map(line => line.trim()).filter(Boolean);
        let depth = 0;
        let result = lines.map(line => {
            if (/^[}\])]/.test(line)) depth = Math.max(0, depth - 1);
            const out = indentUnit.repeat(depth) + line;
            if (/[{[(]$/.test(line)) depth++;
            return out;
        }).join('\n');
        return BeautifyTool._compactSimpleLiterals(result);
    }

    static _compactSimpleLiterals(code) {
        const compactInner = (inner, maxLen = 120) => {
            if (!/^[\s"',.:{}\[\]\w-]+$/.test(inner)) return null;
            const compact = inner.replace(/\s+/g, ' ').trim();
            if (!compact || compact.length > maxLen) return null;
            return compact;
        };
        code = code.replace(/=\s*\[\s*([\s\S]*?)\s*\];/g, (match, inner) => {
            const compact = compactInner(inner);
            return compact ? `= [${compact}];` : match;
        });
        code = code.replace(/=\s*\{\s*([\s\S]*?)\s*\};/g, (match, inner) => {
            const compact = compactInner(inner);
            return compact ? `= { ${compact} };` : match;
        });
        code = code.replace(/\(\s*\{\s*([\s\S]*?)\s*\}\s*\)/g, (match, inner) => {
            const compact = compactInner(inner, 160);
            return compact ? `({${compact}})` : match;
        });
        return code;
    }

    static async _process() {
        if (!BeautifyTool._inputEditor || !BeautifyTool._outputEditor) return;
        let code = BeautifyTool._inputEditor.getValue();
        if (!code.trim()) return;
        const stripComments = document.getElementById('beautifyStripComments')?.checked;
        const stripSpaces = document.getElementById('beautifyStripSpaces')?.checked;
        const beautify = document.getElementById('beautifyEnable')?.checked;
        const indentSize = document.getElementById('beautifyIndent')?.value || '2';
        if (stripComments) code = BeautifyTool._stripComments(code);
        if (stripSpaces) code = code.split('\n').filter(line => line.trim() !== '').map(line => line.trimEnd()).join('\n');
        if (beautify) {
            await BeautifyTool._ensureBeautifyLib();
            if (typeof window.js_beautify === 'function') {
                try {
                    code = window.js_beautify(code, {
                        indent_size: indentSize === 'tab' ? 1 : parseInt(indentSize, 10),
                        indent_char: indentSize === 'tab' ? '\t' : ' ',
                        wrap_line_length: 0,
                        brace_style: 'collapse',
                        preserve_newlines: false,
                        max_preserve_newlines: 0
                    });
                    code = BeautifyTool._compactSimpleLiterals(code);
                } catch (_) {
                    code = BeautifyTool._simpleBeautify(code, indentSize);
                }
            } else {
                code = BeautifyTool._simpleBeautify(code, indentSize);
            }
        }
        BeautifyTool._outputEditor.setValue(code);
    }

    static async _ensureMonaco(container) {
        if (BeautifyTool._monacoReady && BeautifyTool._inputEditor && BeautifyTool._outputEditor) return;
        await (window.initGraalMonaco ? window.initGraalMonaco({ disableCssValidation: true }) : Promise.resolve(null));
        await new Promise(resolve => {
            const start = () => {
                if (typeof require?.config === 'function') {
                    require.config({
                        paths: {
                            vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.0/min/vs'
                        }
                    });
                }
                require(['vs/editor/editor.main'], () => {
                    const languages = monaco.languages.getLanguages().map(l => l.id);
                    if (!languages.includes('graalscript')) {
                        monaco.languages.register({ id: 'graalscript' });
                    }
                    const inputHost = container.querySelector('[data-beautify="inputEditor"]');
                    const outputHost = container.querySelector('[data-beautify="outputEditor"]');
                    BeautifyTool._inputEditor = monaco.editor.create(inputHost, {
                        value: '',
                        language: 'javascript',
                        theme: document.body.classList.contains('tauri-app') ? 'vs-dark' : 'vs-dark',
                        automaticLayout: true,
                        fontSize: 13,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        renderValidationDecorations: 'off'
                    });
                    BeautifyTool._outputEditor = monaco.editor.create(outputHost, {
                        value: '',
                        language: 'javascript',
                        theme: document.body.classList.contains('tauri-app') ? 'vs-dark' : 'vs-dark',
                        automaticLayout: true,
                        fontSize: 13,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        renderValidationDecorations: 'off',
                        readOnly: true
                    });
                    BeautifyTool._monacoReady = true;
                    resolve();
                }, () => {
                    BeautifyTool._monacoReady = false;
                    resolve();
                });
            };
            if (typeof require === 'function') start();
            else window.addEventListener('load', start, { once: true });
        });
    }

    static _setLanguage(value) {
        const lang = value === 'graalscript' ? 'graalscript' : 'javascript';
        if (BeautifyTool._inputEditor) monaco.editor.setModelLanguage(BeautifyTool._inputEditor.getModel(), lang);
        if (BeautifyTool._outputEditor) monaco.editor.setModelLanguage(BeautifyTool._outputEditor.getModel(), lang);
    }

    static _makeButton(iconHtml, title, onclick, extra = '') {
        return `<button style="background:#3a3a3a;color:#ddd;border:1px solid #0a0a0a;border-top:1px solid #555;border-left:1px solid #555;padding:4px 12px;cursor:pointer;font-family:chevyray,monospace;font-size:12px;${extra}" title="${title}" onclick="${onclick}">${iconHtml}</button>`;
    }

    static _indentDropupMarkup() {
        return `<div data-beautify-indent-dropdown style="position:relative;display:inline-flex;">
      <select id="beautifyIndent" style="display:none;">
        <option value="2" selected>2 Spaces</option>
        <option value="4">4 Spaces</option>
        <option value="tab">Tab</option>
      </select>
      <button type="button" id="beautifyIndentBtn" class="custom-dropdown-button" style="background:#1a1a1a;border:1px solid #0a0a0a;border-top:1px solid #404040;border-left:1px solid #404040;color:#e0e0e0;padding:6px 10px;font-family:chevyray,monospace;display:inline-flex;align-items:center;gap:8px;">
        <span id="beautifyIndentLabel">2 Spaces</span>
        <span aria-hidden="true">▲</span>
      </button>
      <div id="beautifyIndentMenu" style="display:none;position:absolute;left:0;bottom:calc(100% + 2px);background:#2b2b2b;border:1px solid #0a0a0a;border-top:1px solid #404040;border-left:1px solid #404040;z-index:1000;min-width:100%;box-shadow:0 2px 8px rgba(0,0,0,0.5);">
        <div class="custom-dropdown-item" data-indent-value="2" style="padding:8px;cursor:pointer;font-family:'chevyray',monospace;font-size:12px;color:#e0e0e0;white-space:nowrap;">2 Spaces</div>
        <div class="custom-dropdown-item" data-indent-value="4" style="padding:8px;cursor:pointer;font-family:'chevyray',monospace;font-size:12px;color:#e0e0e0;white-space:nowrap;">4 Spaces</div>
        <div class="custom-dropdown-item" data-indent-value="tab" style="padding:8px;cursor:pointer;font-family:'chevyray',monospace;font-size:12px;color:#e0e0e0;white-space:nowrap;">Tab</div>
      </div>
    </div>`;
    }

    static _getThemeColors() {
        const scheme = localStorage.getItem('editorColorScheme') || 'default';
        const schemes = {
            'default': { bg: '#1e1e1e', panel: '#2b2b2b', border: '#3a3a3a', text: '#ddd', inputBg: '#1a1a1a', buttonBg: '#353535', buttonText: '#e0e0e0', buttonBorder: '#0a0a0a', buttonBorderLight: '#404040' },
            'fusion-light': { bg: '#f5f5f5', panel: '#ffffff', border: '#d0d0d0', text: '#1a1a1a', inputBg: '#ffffff', buttonBg: '#ffffff', buttonText: '#1a1a1a', buttonBorder: '#d0d0d0', buttonBorderLight: '#e0e0e0' },
            'fusion-dark': { bg: '#1e1e1e', panel: '#2d2d2d', border: '#0f0f0f', text: '#e8e8e8', inputBg: '#1e1e1e', buttonBg: '#2d2d2d', buttonText: '#e8e8e8', buttonBorder: '#0f0f0f', buttonBorderLight: '#404040' },
            'dark-style': { bg: '#1e1e1e', panel: '#252525', border: '#3c3c3c', text: '#cccccc', inputBg: '#1e1e1e', buttonBg: '#252525', buttonText: '#cccccc', buttonBorder: '#3c3c3c', buttonBorderLight: '#4c4c4c' },
            'dark-orange': { bg: '#2a1f1a', panel: '#3a2f2a', border: '#1a0f0a', text: '#ffaa55', inputBg: '#2a1f1a', buttonBg: '#3a2f2a', buttonText: '#ffaa55', buttonBorder: '#1a0f0a', buttonBorderLight: '#5a4f4a' },
            'aqua': { bg: '#0a1a1f', panel: '#1a2a2f', border: '#0a0a0a', text: '#55ffff', inputBg: '#0a1a1f', buttonBg: '#1a2a2f', buttonText: '#55ffff', buttonBorder: '#0a0a0a', buttonBorderLight: '#2a4a4f' },
            'elegant-dark': { bg: '#1a1a1a', panel: '#2d2d2d', border: '#404040', text: '#e8e8e8', inputBg: '#1a1a1a', buttonBg: '#2d2d2d', buttonText: '#e8e8e8', buttonBorder: '#404040', buttonBorderLight: '#505050' },
            'material-dark': { bg: '#121212', panel: '#1e1e1e', border: '#333333', text: '#ffffff', inputBg: '#121212', buttonBg: '#1e1e1e', buttonText: '#ffffff', buttonBorder: '#333333', buttonBorderLight: '#444444' },
            'light-style': { bg: '#ffffff', panel: '#ffffff', border: '#e0e0e0', text: '#000000', inputBg: '#ffffff', buttonBg: '#ffffff', buttonText: '#000000', buttonBorder: '#e0e0e0', buttonBorderLight: '#f0f0f0' },
            'ayu-mirage': { bg: '#1f2430', panel: '#232834', border: '#191e2a', text: '#cbccc6', inputBg: '#1f2430', buttonBg: '#232834', buttonText: '#cbccc6', buttonBorder: '#191e2a', buttonBorderLight: '#2a3a4a' },
            'dracula': { bg: '#282a36', panel: '#343746', border: '#21222c', text: '#f8f8f2', inputBg: '#282a36', buttonBg: '#343746', buttonText: '#f8f8f2', buttonBorder: '#21222c', buttonBorderLight: '#525460' }
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

    static applyTheme(target = BeautifyTool._host || BeautifyTool._dialog) {
        if (!target) return;
        const c = BeautifyTool._getThemeColors();
        const root = target.querySelector ? target : document;
        const frame = target.matches?.('#_beautifyDialog') ? target.firstElementChild : target.firstElementChild || target;
        if (frame) {
            frame.style.background = c.bg;
            frame.style.color = c.text;
            frame.style.borderColor = c.border;
        }
        root.querySelectorAll('[data-beautify="inputEditor"], [data-beautify="outputEditor"]').forEach(el => {
            el.parentElement.style.background = c.inputBg;
            el.parentElement.style.borderColor = c.border;
            const header = el.parentElement.firstElementChild;
            if (header) {
                header.style.background = c.panel;
                header.style.color = c.text;
                header.style.borderColor = c.border;
            }
        });
        root.querySelectorAll('select').forEach(el => {
            el.style.background = c.inputBg;
            el.style.color = c.text;
            el.style.borderColor = c.border;
        });
        root.querySelectorAll('#beautifyIndentMenu').forEach(el => {
            el.style.background = c.bg;
            el.style.borderColor = c.border;
        });
        root.querySelectorAll('#beautifyIndentMenu .custom-dropdown-item').forEach(el => {
            el.style.color = c.text;
        });
        root.querySelectorAll('button').forEach(el => {
            el.style.background = c.buttonBg;
            el.style.color = c.buttonText;
            el.style.border = `1px solid ${c.buttonBorder}`;
            el.style.borderTop = `1px solid ${c.buttonBorderLight}`;
            el.style.borderLeft = `1px solid ${c.buttonBorderLight}`;
            el.style.boxShadow = 'inset 0 1px 0 rgba(0,0,0,0.25)';
        });
        root.querySelectorAll('[data-beautify-check-row]').forEach(row => {
            row.style.color = c.text;
        });
        root.querySelectorAll('.dialog-checkbox').forEach(box => {
            box.style.background = c.inputBg;
            box.style.borderColor = c.border;
            box.style.color = c.buttonText;
        });
        const footer = root.querySelector('[data-beautify-footer]');
        if (footer) {
            footer.style.background = c.bg;
            footer.style.color = c.text;
            footer.style.borderColor = c.border;
        }
        if (window.monaco && BeautifyTool._inputEditor && BeautifyTool._outputEditor) {
            const themeName = getComputedStyle(document.documentElement)
                .getPropertyValue('--monaco-theme')
                .trim()
                .replace(/['"]/g, '') || 'graal-active';
            monaco.editor.setTheme(themeName);
        }
    }

    static async open() {
        if (window.tabManager) {
            const existing = window.tabManager.getTabsByType('beautify')[0];
            if (existing) {
                window.tabManager.switchTo(existing.id);
                return;
            }
            const tab = window.tabManager.addTab('beautify', 'Code Beautify', { kind: 'beautify' });
            BeautifyTool._tabId = tab?.id || null;
            return;
        }
        if (BeautifyTool._dialog) {
            BeautifyTool._dialog.style.display = 'flex';
            await BeautifyTool._ensureMonaco(BeautifyTool._dialog);
            BeautifyTool._inputEditor?.layout();
            BeautifyTool._outputEditor?.layout();
            return;
        }
        const dlg = document.createElement('div');
        dlg.id = '_beautifyDialog';
        dlg.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:9000;pointer-events:none;';
        dlg.innerHTML = `
<div class="dialog-content" style="background:#1e1e1e;border:1px solid #3a3a3a;display:flex;flex-direction:column;width:1100px;height:700px;min-width:760px;min-height:460px;max-width:98vw;max-height:96vh;pointer-events:all;box-shadow:0 8px 32px rgba(0,0,0,0.8);resize:both;overflow:hidden;">
  <div class="dialog-titlebar" style="display:flex;align-items:center;background:#2a2a2a;border-bottom:1px solid #111;padding:4px 8px;gap:6px;cursor:move;" id="_beautifyDrag">
    <span style="color:#ddd;font-family:chevyray,monospace;font-size:13px;flex:1;display:flex;align-items:center;gap:6px;line-height:1;"><i class="fas fa-magic"></i>Code Beautify</span>
    ${BeautifyTool._makeButton('Process', 'Process code', 'BeautifyTool._process()')}
    ${BeautifyTool._makeButton('Clear', 'Clear both panes', 'BeautifyTool._clearBoth()')}
    ${BeautifyTool._makeButton('✕', 'Close', "document.getElementById('_beautifyDialog').style.display='none'")}
  </div>
  <div style="display:flex;gap:12px;flex:1;min-height:0;padding:12px;">
    <div style="flex:1;display:flex;flex-direction:column;min-width:0;border:1px solid #3a3a3a;background:#1a1a1a;">
      <div style="padding:8px 10px;border-bottom:1px solid #3a3a3a;font-family:chevyray,monospace;color:#c0c0c0;">Input</div>
      <div data-beautify="inputEditor" style="flex:1;min-height:0;"></div>
    </div>
    <div style="flex:1;display:flex;flex-direction:column;min-width:0;border:1px solid #3a3a3a;background:#1a1a1a;">
      <div style="padding:8px 10px;border-bottom:1px solid #3a3a3a;font-family:chevyray,monospace;color:#c0c0c0;display:flex;justify-content:space-between;align-items:center;">Output <button id="beautifyCopyBtn" style="background:#353535;border:1px solid #0a0a0a;border-top:1px solid #404040;border-left:1px solid #404040;color:#e0e0e0;padding:4px 10px;cursor:pointer;font-family:chevyray,monospace;font-size:12px;">Copy</button></div>
      <div data-beautify="outputEditor" style="flex:1;min-height:0;"></div>
    </div>
  </div>
  <div data-beautify-footer style="padding:10px 12px;border-top:1px solid #2a2a2a;display:flex;gap:14px;align-items:center;flex-wrap:wrap;font-family:chevyray,monospace;font-size:12px;color:#ddd;">
    <select id="beautifyLanguage" style="background:#1a1a1a;border:1px solid #0a0a0a;border-top:1px solid #404040;border-left:1px solid #404040;color:#e0e0e0;padding:6px 10px;font-family:chevyray,monospace;">
      <option value="graalscript">Graal Script</option>
      <option value="javascript">JavaScript</option>
    </select>
    <label style="display:flex;align-items:center;gap:6px;"><input id="beautifyStripComments" type="checkbox" checked> Strip Comments</label>
    <label style="display:flex;align-items:center;gap:6px;"><input id="beautifyStripSpaces" type="checkbox"> Strip Spaces</label>
    <label style="display:flex;align-items:center;gap:6px;"><input id="beautifyEnable" type="checkbox"> Beautify Code</label>
    ${BeautifyTool._indentDropupMarkup()}
  </div>
</div>`;
        document.body.appendChild(dlg);
        BeautifyTool._dialog = dlg;

        const dragHandle = dlg.querySelector('#_beautifyDrag');
        const inner = dlg.firstElementChild;
        let dx = 0, dy = 0, dragging = false;
        dragHandle.addEventListener('mousedown', e => {
            if (e.target.tagName === 'BUTTON') return;
            dragging = true;
            dx = e.clientX - inner.getBoundingClientRect().left;
            dy = e.clientY - inner.getBoundingClientRect().top;
            e.preventDefault();
        });
        document.addEventListener('mousemove', e => {
            if (!dragging) return;
            inner.style.position = 'fixed';
            inner.style.left = `${e.clientX - dx}px`;
            inner.style.top = `${e.clientY - dy}px`;
            inner.style.margin = '0';
        });
        document.addEventListener('mouseup', () => dragging = false);

        dlg.querySelector('#beautifyLanguage').addEventListener('change', e => BeautifyTool._setLanguage(e.target.value));
        dlg.querySelector('#beautifyCopyBtn').addEventListener('click', async () => {
            const text = BeautifyTool._outputEditor?.getValue() || '';
            if (!text) return;
            await navigator.clipboard.writeText(text).catch(() => {});
        });
        await BeautifyTool._ensureMonaco(dlg);
        BeautifyTool._setLanguage('graalscript');
        BeautifyTool._initIndentDropup(dlg);
        BeautifyTool.applyTheme(dlg);
    }

    static _clearBoth() {
        BeautifyTool._inputEditor?.setValue('');
        BeautifyTool._outputEditor?.setValue('');
    }

    static _initStyledCheckboxes(container) {
        container.querySelectorAll('[data-beautify-check-row]').forEach(row => {
            const input = row.querySelector('input[type="checkbox"]');
            const box = row.querySelector('.dialog-checkbox');
            const sync = () => { if (box) box.textContent = input?.checked ? '✓' : ''; };
            row.onclick = () => {
                if (!input) return;
                input.checked = !input.checked;
                sync();
            };
            sync();
        });
    }

    static _initIndentDropup(container) {
        const select = container.querySelector('#beautifyIndent');
        const button = container.querySelector('#beautifyIndentBtn');
        const label = container.querySelector('#beautifyIndentLabel');
        const menu = container.querySelector('#beautifyIndentMenu');
        if (!select || !button || !label || !menu) return;
        const sync = () => {
            const option = select.options[select.selectedIndex];
            label.textContent = option ? option.textContent : '2 Spaces';
        };
        button.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
        };
        menu.querySelectorAll('[data-indent-value]').forEach(item => {
            item.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                select.value = item.dataset.indentValue || '2';
                sync();
                menu.style.display = 'none';
            };
        });
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) menu.style.display = 'none';
        });
        sync();
    }

    static mountInto(host) {
        if (!host) return;
        BeautifyTool._host = host;
        host.innerHTML = `
<div style="display:flex;flex-direction:column;flex:1;min-height:0;background:#1e1e1e;">
  <div style="display:flex;gap:12px;flex:1;min-height:0;padding:12px;">
    <div style="flex:1;display:flex;flex-direction:column;min-width:0;border:1px solid #3a3a3a;background:#1a1a1a;">
      <div style="padding:8px 10px;border-bottom:1px solid #3a3a3a;font-family:chevyray,monospace;color:#c0c0c0;">Input</div>
      <div data-beautify="inputEditor" style="flex:1;min-height:0;"></div>
    </div>
    <div style="flex:1;display:flex;flex-direction:column;min-width:0;border:1px solid #3a3a3a;background:#1a1a1a;">
      <div style="padding:8px 10px;border-bottom:1px solid #3a3a3a;font-family:chevyray,monospace;color:#c0c0c0;display:flex;justify-content:space-between;align-items:center;">Output <button id="beautifyCopyBtnInline" style="background:#353535;border:1px solid #0a0a0a;border-top:1px solid #404040;border-left:1px solid #404040;color:#e0e0e0;padding:4px 10px;cursor:pointer;font-family:chevyray,monospace;font-size:12px;">Copy</button></div>
      <div data-beautify="outputEditor" style="flex:1;min-height:0;"></div>
    </div>
  </div>
  <div data-beautify-footer style="padding:10px 12px;border-top:1px solid #2a2a2a;display:flex;gap:14px;align-items:center;flex-wrap:wrap;font-family:chevyray,monospace;font-size:12px;color:#ddd;">
    <select id="beautifyLanguage" style="background:#1a1a1a;border:1px solid #0a0a0a;border-top:1px solid #404040;border-left:1px solid #404040;color:#e0e0e0;padding:6px 10px;font-family:chevyray,monospace;">
      <option value="graalscript">Graal Script</option>
      <option value="javascript">JavaScript</option>
    </select>
    <label class="dialog-checkbox-row" data-beautify-check-row style="margin:0;"><span class="dialog-checkbox" aria-hidden="true"></span><input id="beautifyStripComments" type="checkbox" checked style="display:none;"><span>Strip Comments</span></label>
    <label class="dialog-checkbox-row" data-beautify-check-row style="margin:0;"><span class="dialog-checkbox" aria-hidden="true"></span><input id="beautifyStripSpaces" type="checkbox" style="display:none;"><span>Strip Spaces</span></label>
    <label class="dialog-checkbox-row" data-beautify-check-row style="margin:0;"><span class="dialog-checkbox" aria-hidden="true"></span><input id="beautifyEnable" type="checkbox" style="display:none;"><span>Beautify Code</span></label>
    ${BeautifyTool._indentDropupMarkup()}
    <button id="beautifyProcessBtnInline" style="background:#353535;border:1px solid #0a0a0a;border-top:1px solid #404040;border-left:1px solid #404040;color:#e0e0e0;padding:6px 12px;cursor:pointer;font-family:chevyray,monospace;font-size:12px;">Process</button>
    <button id="beautifyClearBtnInline" style="background:#353535;border:1px solid #0a0a0a;border-top:1px solid #404040;border-left:1px solid #404040;color:#e0e0e0;padding:6px 12px;cursor:pointer;font-family:chevyray,monospace;font-size:12px;">Clear</button>
  </div>
</div>`;
        host.querySelector('#beautifyLanguage').addEventListener('change', e => BeautifyTool._setLanguage(e.target.value));
        host.querySelector('#beautifyProcessBtnInline').addEventListener('click', () => BeautifyTool._process());
        host.querySelector('#beautifyClearBtnInline').addEventListener('click', () => BeautifyTool._clearBoth());
        host.querySelector('#beautifyCopyBtnInline').addEventListener('click', async () => {
            const text = BeautifyTool._outputEditor?.getValue() || '';
            if (!text) return;
            await navigator.clipboard.writeText(text).catch(() => {});
        });
        BeautifyTool._initStyledCheckboxes(host);
        BeautifyTool._initIndentDropup(host);
        BeautifyTool._monacoReady = false;
        BeautifyTool._inputEditor?.dispose?.();
        BeautifyTool._outputEditor?.dispose?.();
        BeautifyTool._inputEditor = null;
        BeautifyTool._outputEditor = null;
        BeautifyTool._ensureMonaco(host).then(() => {
            BeautifyTool._setLanguage('graalscript');
            BeautifyTool.applyTheme(host);
        });
        BeautifyTool.applyTheme(host);
    }
}

window.BeautifyTool = BeautifyTool;
window.activateBeautifyTab = function() {
    if (BeautifyTool._host) {
        BeautifyTool._host.style.display = 'flex';
        BeautifyTool.applyTheme(BeautifyTool._host);
        BeautifyTool._inputEditor?.layout();
        BeautifyTool._outputEditor?.layout();
    }
};
window.deactivateBeautifyTab = function() {};
window.closeBeautifyTab = function() {
    if (BeautifyTool._host) BeautifyTool._host.style.display = 'none';
    BeautifyTool._tabId = null;
    return true;
};
