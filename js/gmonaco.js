(function() {
    if (window.initGraalMonaco) return;

    function ensureRequireReady() {
        if (typeof window.require === 'function' && typeof window.require.config === 'function') {
            const usingHttpHost = /^https?:/i.test(window.location.protocol || '');
            const isTauriBundled = !!window.__TAURI__ && !usingHttpHost;
            window.require.config({
                paths: {
                    vs: isTauriBundled ? 'monaco-editor/min/vs' : 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.0/min/vs'
                }
            });
        }
        if (typeof window.require === 'function') return true;
        return false;
    }

    function createTokenizer() {
        return {
            keywords: [
                'class', 'extends', 'implements', 'import', 'instanceof', 'interface', 'native', 'package', 'volatile', 'throws',
                'break', 'case', 'continue', 'default', 'do', 'else', 'elseif', 'for', 'function', 'if', 'in', 'return', 'switch', 'while', 'with', 'xor',
                'public', 'const', 'enum'
            ],
            memory: ['new', 'datablock'],
            builtins: ['true', 'false', 'nil', 'null', 'pi'],
            extras: ['this', 'thiso', 'temp', 'server', 'serverr', 'client', 'clientr', 'player'],
            objectProperties: ['name'],
            tokenizer: {
                root: [
                    [/\/\/.*$/, 'comment'],
                    [/\/\*/, 'comment', '@blockcomment'],
                    [/"/, 'string', '@string_dq'],
                    [/'/, 'string', '@string_sq'],
                    [/0[xX][0-9a-fA-F]+[Ll]?\b/, 'number'],
                    [/[0-9]*\.[0-9]+([eE][-+]?[0-9]+)?[fFdD]?\b/, 'number.float'],
                    [/[0-9]+[eE][-+]?[0-9]+[fFdD]?\b/, 'number.float'],
                    [/[0-9]+[fFdD]\b/, 'number.float'],
                    [/[0-9]+[Ll]?\b/, 'number'],
                    [/\b(?:true|false|nil|null|pi)\b/i, 'keyword.builtin'],
                    [/\b(?:this|thiso|temp|server|serverr|client|clientr|player)\b/i, 'keyword.extras'],
                    [/[a-zA-Z_]\w*(?=\s*\()/, {
                        cases: {
                            '@keywords': 'keyword',
                            '@memory': 'keyword.memory',
                            '@default': 'function.call'
                        }
                    }],
                    [/[a-zA-Z_]\w*/, {
                        cases: {
                            '@keywords': 'keyword',
                            '@memory': 'keyword.memory',
                            '@objectProperties': 'variable.property',
                            '@default': 'identifier'
                        }
                    }],
                    [/[-~^@/%|=+*!?&<>]/, 'operator'],
                    [/[\[\]]/, 'operator'],
                    [/[{}();:,.]/, 'delimiter']
                ],
                blockcomment: [
                    [/[^/*]+/, 'comment'],
                    [/\*\//, 'comment', '@pop'],
                    [/[/*]/, 'comment']
                ],
                string_dq: [
                    [/[^"]+/, 'string'],
                    [/"/, 'string', '@pop']
                ],
                string_sq: [
                    [/[^'\n]+/, 'string'],
                    [/\n/, '', '@pop'],
                    [/'/, 'string', '@pop']
                ]
            }
        };
    }

    function defineThemes(monaco) {
        if (window.__gsuiteGraalMonacoThemesReady) return;
        monaco.editor.defineTheme('graal-default', {
            base: 'vs-dark',
            inherit: false,
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
                { token: 'identifier', foreground: 'f8f8f2' }
            ],
            colors: {
                'editor.background': '#33322b',
                'editor.foreground': '#f8f8f2',
                'editorLineNumber.foreground': '#bebeba',
                'editorLineNumber.activeForeground': '#f8f8f2',
                'editorCursor.foreground': '#f8f8f0',
                'editor.selectionBackground': '#444444',
                'editor.lineHighlightBackground': '#333333',
                'editor.lineHighlightBorder': '#333333',
                'editorIndentGuide.background1': '#3b3a32',
                'editorIndentGuide.activeBackground1': '#555753',
                'editorWidget.background': '#33322b',
                'editorWidget.border': '#555753',
                'editorSuggestWidget.background': '#33322b',
                'editorSuggestWidget.border': '#555753',
                'editorSuggestWidget.selectedBackground': '#444444'
            }
        });
        monaco.editor.defineTheme('graal-active', {
            base: 'vs-dark',
            inherit: false,
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
                { token: 'identifier', foreground: 'f8f8f2' }
            ],
            colors: {
                'editor.background': '#33322b',
                'editor.foreground': '#f8f8f2',
                'editorLineNumber.foreground': '#bebeba',
                'editorLineNumber.activeForeground': '#f8f8f2',
                'editorCursor.foreground': '#f8f8f0',
                'editor.selectionBackground': '#444444',
                'editor.lineHighlightBackground': '#333333',
                'editor.lineHighlightBorder': '#333333',
                'editorIndentGuide.background1': '#3b3a32',
                'editorIndentGuide.activeBackground1': '#555753',
                'editorWidget.background': '#33322b',
                'editorWidget.border': '#555753',
                'editorSuggestWidget.background': '#33322b',
                'editorSuggestWidget.border': '#555753',
                'editorSuggestWidget.selectedBackground': '#444444'
            }
        });
        monaco.editor.defineTheme('neon-synthwave', {
            base: 'vs-dark',
            inherit: true,
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
                { token: 'identifier', foreground: 'e0c0ff' }
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
                'scrollbarSlider.activeBackground': '#ff00ffcc'
            }
        });
        window.__gsuiteGraalMonacoThemesReady = true;
    }

    function registerLanguage(monaco) {
        if (window.__gsuiteGraalMonacoLanguageReady) return;
        if (!monaco.languages.getLanguages().some(lang => lang.id === 'graalscript')) {
            monaco.languages.register({ id: 'graalscript' });
        }
        monaco.languages.setMonarchTokensProvider('graalscript', createTokenizer());
        window.__gsuiteGraalMonacoLanguageReady = true;
    }

    function registerDocs(monaco) {
        if (window.__gsuiteGraalMonacoDocsReady) return;
        let defsPromise = null;
        const loadDefs = () => {
            if (defsPromise) return defsPromise;
            defsPromise = fetch('https://api.gscript.dev')
                .then(r => r.json())
                .catch(() => ({}));
            return defsPromise;
        };
        monaco.languages.registerCompletionItemProvider('graalscript', {
            triggerCharacters: ['$', '_'],
            provideCompletionItems: (model, position) => loadDefs().then(defs => {
                const word = model.getWordUntilPosition(position);
                const range = {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: word.startColumn,
                    endColumn: word.endColumn
                };
                const prefix = word.word.toLowerCase();
                const suggestions = Object.entries(defs)
                    .filter(([name]) => prefix === '' || name.toLowerCase().startsWith(prefix))
                    .map(([name, info]) => {
                        const isVar = name.startsWith('$');
                        const params = info.params?.length ? info.params : [];
                        const snippet = isVar
                            ? name
                            : (params.length
                                ? `${name}(${params.map((p, i) => `\${${i + 1}:${p}}`).join(', ')})`
                                : `${name}($0)`);
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
            provideHover: (model, position) => loadDefs().then(defs => {
                const word = model.getWordAtPosition(position);
                if (!word) return null;
                const info = defs[word.word] || defs[`$${word.word}`];
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
        window.__gsuiteGraalMonacoDocsReady = true;
    }

    window.initGraalMonaco = function(options = {}) {
        if (!ensureRequireReady()) {
            return Promise.resolve(null);
        }
        if (window.__gsuiteGraalMonacoReady) {
            return window.__gsuiteGraalMonacoReady.then(monaco => {
                if (options.disableCssValidation && monaco?.languages?.css) {
                    monaco.languages.css.cssDefaults.setOptions({ validate: false });
                }
                return monaco;
            });
        }
        window.__gsuiteGraalMonacoReady = new Promise(resolve => {
            window.require(['vs/editor/editor.main'], () => {
                if (options.disableCssValidation && monaco.languages.css) {
                    monaco.languages.css.cssDefaults.setOptions({ validate: false });
                }
                registerLanguage(monaco);
                registerDocs(monaco);
                defineThemes(monaco);
                resolve(monaco);
            }, () => resolve(null));
        });
        return window.__gsuiteGraalMonacoReady;
    };
})();
