// Constants
const API_ENDPOINTS = {
    local: 'http://localhost:1234/v1',
    mistral: 'https://codestral.mistral.ai/v1',
    openai: 'https://api.openai.com/v1',
    newModel: 'https://api.newmodel.ai/v1'
};

const DEFAULT_FILES = {
    'main.html': `<!DOCTYPE html>\n<html>\n<head>\n    <title>TORBES Demo</title>\n    <link rel="stylesheet" href="style.css">\n</head>\n<body>\n    <h1>Welcome to TORBES</h1>\n    <p>AI-powered coding!</p>\n</body>\n</html>`,
    'style.css': `body {\n    margin: 0;\n    padding: 20px;\n    background: #212529;\n    color: #e9ecef;\n    font-family: 'Segoe UI', sans-serif;\n}\nh1 {\n    color: #007bff;\n}\n`
};

// State Management
class EditorState {
    constructor() {
        this.darkMode = localStorage.getItem('darkMode') === 'true' || true;
        this.currentModel = localStorage.getItem('currentModel') || 'local';
        this.currentTab = 'main.html';
        this.isProcessing = false;
        this.files = JSON.parse(localStorage.getItem('files')) || DEFAULT_FILES;
        this.user = null;
        this.projects = JSON.parse(localStorage.getItem('projects')) || { 'Default': this.files };
        this.currentProject = 'Default';
        this.settings = JSON.parse(localStorage.getItem('settings')) || { theme: 'vscode-dark', fontSize: 14 };
        this.collabSession = null;
        this.breakpoints = new Set();
    }

    save() {
        localStorage.setItem('darkMode', this.darkMode);
        localStorage.setItem('currentModel', this.currentModel);
        localStorage.setItem('files', JSON.stringify(this.files));
        localStorage.setItem('projects', JSON.stringify(this.projects));
        localStorage.setItem('settings', JSON.stringify(this.settings));
    }
}

const state = new EditorState();

// Utility Functions
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

function updateStatus(status) {
    const statusElement = $('#status');
    if (statusElement) {
        statusElement.textContent = status;
        console.log(`Status updated to: ${status}, Caller: ${new Error().stack.split('\n')[2]}`);
    }
}

function showMessage(message, type = 'success') {
    const panel = $('#messagePanel');
    if (panel) {
        const msg = document.createElement('div');
        msg.className = `message ${type}`;
        msg.textContent = `${new Date().toLocaleTimeString()} - ${message}`;
        panel.appendChild(msg);
        panel.scrollTop = panel.scrollHeight;
    } else {
        console.log(`${type}: ${message}`);
    }
}

function showLoader(show, progress = '') {
  const loader = $('#aiLoader');
  if (loader) {
    if (!loader.hidden && !show) {
      // Loader is already shown, so just update the progress text
      const progressElement = $('#aiProgress');
      if (progressElement) progressElement.textContent = progress;
    } else {
      // Loader is not shown or needs to be shown, so update both the visibility and progress text
      loader.hidden = !show;
      const progressElement = $('#aiProgress');
      if (progressElement) progressElement.textContent = progress;
    }
  }
}


function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

// Editor Module
class CodeEditor {
    constructor() {
        this.editor = null;
        this.collabSocket = null;
    }

    async initialize() {
        await this.waitForDependencies();
        this.setupEditor();
        this.setupEventListeners();
        this.setupTabs();
        this.setupContextMenu();
        this.setupAutocomplete();
        this.updatePreview(state.files[state.currentTab] || '');
        this.applySettings();
        showMessage('Willkommen beim TORBES AI Code Editor!');
        console.log('Editor initialized successfully');
        updateStatus('Bereit');
    }

    async waitForDependencies() {
        const dependencies = ['CodeMirror', 'prettier', 'marked'];
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                const loaded = dependencies.map(dep => ({
                    name: dep,
                    available: !!window[dep]
                }));
                const allLoaded = loaded.every(dep => dep.available);
                if (allLoaded) {
                    clearInterval(checkInterval);
                    resolve();
                } else {
                    const missing = loaded.filter(dep => !dep.available).map(dep => dep.name);
                    console.warn(`Missing dependencies: ${missing.join(', ')}`);
                }
            }, 100);

            setTimeout(() => {
                clearInterval(checkInterval);
                const missing = dependencies.filter(dep => !window[dep]);
                if (missing.length) {
                    missing.forEach(dep => showMessage(`${dep} konnte nicht geladen werden!`, 'error'));
                }
                resolve();
            }, 5000);
        });
    }

    setupEditor() {
        const editorElement = $('#codeEditor');
        if (!editorElement) {
            showMessage('Editor-Element nicht gefunden!', 'error');
            return;
        }

        if (!window.CodeMirror) {
            showMessage('CodeMirror nicht verfügbar. Editor wird im einfachen Modus gestartet.', 'error');
            editorElement.removeAttribute('hidden');
            return;
        }

        this.editor = CodeMirror.fromTextArea(editorElement, {
            mode: 'htmlmixed',
            theme: state.settings.theme,
            lineNumbers: true,
            lineWrapping: true,
            tabSize: 2,
            value: state.files[state.currentTab] || '',
            gutters: ['CodeMirror-lint-markers', 'breakpoints'],
            extraKeys: {
                'Ctrl-G': () => this.processUpdates(),
                'Ctrl-R': () => this.runCode(),
                'Ctrl-D': () => this.debugCode(),
                'Ctrl-F': () => this.formatCode(),
                'Ctrl-C': () => this.copyCode(),
                'Ctrl-D': () => this.downloadProject(),
                'Ctrl-T': () => this.toggleDarkMode(),
                'Ctrl-Space': 'autocomplete',
                'Ctrl-Z': () => this.undoChange(),
                'Ctrl-Y': () => this.redoChange(),
                'Ctrl-S': () => this.searchCode()
            }
        });

        this.editor.initializing = true;
        this.editor.setValue(state.files[state.currentTab] || '');
        this.editor.initializing = false;

        if (state.darkMode) document.body.classList.add('dark-mode');
        this.editor.getWrapperElement().style.fontSize = `${state.settings.fontSize}px`;

        this.editor.on('gutterClick', (cm, n) => {
            const info = cm.lineInfo(n);
            if (info.gutterMarkers && info.gutterMarkers.breakpoints) {
                cm.setGutterMarker(n, 'breakpoints', null);
                state.breakpoints.delete(n);
            } else {
                const marker = document.createElement('div');
                marker.style.color = '#ff0000';
                marker.innerHTML = '●';
                cm.setGutterMarker(n, 'breakpoints', marker);
                state.breakpoints.add(n);
            }
        });
    }

    setupEventListeners() {
        const modelSelection = $('#modelSelection');
        if (modelSelection) {
            modelSelection.addEventListener('change', (e) => {
                state.currentModel = e.target.value;
                state.save();
                updateStatus(`Model: ${e.target.value}`);
            });
        }

        const languageSelection = $('#languageSelection');
        if (languageSelection) {
            languageSelection.addEventListener('change', (e) => {
                const modeMap = {
                    javascript: 'javascript',
                    html: 'htmlmixed',
                    css: 'css',
                    python: 'python',
                    markdown: 'markdown'
                };
                const mode = modeMap[e.target.value];
                if (mode && this.editor) {
                    this.editor.setOption('mode', mode);
                    this.updatePreview(this.editor.getValue());
                    updateStatus(`Language: ${e.target.value}`);
                } else {
                    showMessage(`Mode for ${e.target.value} not supported!`, 'error');
                }
            });
        }

        if (this.editor) {
            this.editor.on('cursorActivity', debounce(() => {
                const pos = this.editor.getCursor();
                const lang = languageSelection ? languageSelection.value.toUpperCase() : 'HTML';
                const statusInfo = $('#status-info');
                if (statusInfo) statusInfo.textContent = `Ln ${pos.line + 1}, Col ${pos.ch + 1} | UTF-8 | ${lang}`;
            }, 300));

            this.editor.on('change', (cm, change) => {
                if (cm.initializing) return;
                state.files[state.currentTab] = cm.getValue();
                state.save();
                this.scrollToBottom();
                if (this.collabSocket && change.origin !== 'remote') {
                    this.collabSocket.send(JSON.stringify({
                        type: 'update',
                        file: state.currentTab,
                        content: cm.getValue(),
                        change
                    }));
                }
            });
        }
    }

    setupTabs() {
        const tabs = $('#editorTabs');
        if (!tabs) return;
        tabs.innerHTML = '';
        Object.keys(state.files).forEach(file => {
            const tab = document.createElement('div');
            tab.className = `tab${file === state.currentTab ? ' active' : ''}`;
            tab.dataset.file = file;
            tab.setAttribute('role', 'tab');
            tab.setAttribute('aria-label', `Switch to ${file}`);

            const tabText = document.createElement('span');
            tabText.textContent = file;
            tabText.addEventListener('click', () => this.switchTab(file));

            const closeBtn = document.createElement('span');
            closeBtn.className = 'tab-close';
            closeBtn.innerHTML = '×';
            closeBtn.setAttribute('aria-label', `Close ${file}`);
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeTab(file);
            });

            tab.appendChild(tabText);
            tab.appendChild(closeBtn);
            tabs.appendChild(tab);
        });
    }

    switchTab(file) {
        if (!this.editor) return;
        state.currentTab = file;
        this.editor.setValue(state.files[file] || '');
        $$('.tab').forEach(t => t.classList.remove('active'));
        const tabElement = $(`[data-file="${file}"]`);
        if (tabElement) tabElement.classList.add('active');
        updateStatus(`Editing ${file}`);
        this.updatePreview(state.files[file] || '');
        state.save();
        this.scrollToBottom();
    }

    closeTab(file) {
        if (Object.keys(state.files).length === 1) {
            showMessage('Cannot close the last file!', 'error');
            return;
        }
        delete state.files[file];
        if (state.currentTab === file) {
            const remainingFiles = Object.keys(state.files);
            state.currentTab = remainingFiles[0];
            if (this.editor) this.editor.setValue(state.files[state.currentTab] || '');
        }
        this.setupTabs();
        updateStatus(`Closed ${file}, editing ${state.currentTab}`);
        this.updatePreview(state.files[state.currentTab] || '');
        state.save();
    }

    updatePreview = debounce((code) => {
        const lang = $('#languageSelection') ? $('#languageSelection').value : 'html';
        const previewFrame = $('#previewFrame');
        if (!previewFrame) return;

        try {
            // Create a blob URL instead of directly accessing the iframe document
            let htmlContent = '';
            
            if (!code) {
                htmlContent = '<pre>No content to preview</pre>';
            } else if (lang === 'html') {
                htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>${code}</body></html>`;
            } else if (lang === 'css') {
                htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${code}</style></head><body><h1>Test Heading</h1><p>Test Paragraph</p></body></html>`;
            } else if (lang === 'javascript') {
                const escapedCode = code.replace(/<\/script>/g, '<\\/script>');
                htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><script>${escapedCode}<\/script></body></html>`;
            } else if (lang === 'markdown' && window.marked) {
                htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><article class="markdown-body">${window.marked.parse(code)}</article></body></html>`;
            } else {
                htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><pre style="color: #e9ecef; padding: 20px; margin: 0;">${code}</pre></body></html>`;
            }
            
			
			 // Add event listener for refresh preview button
        const refreshPreviewBtn = $('#refreshPreviewBtn');
        if (refreshPreviewBtn) {
            refreshPreviewBtn.addEventListener('click', () => {
                if (this.editor) {
                    this.updatePreview(this.editor.getValue());
                    showMessage('Preview refreshed');
                    updateStatus('Preview refreshed');
                }
            });
        }
            // Create a blob URL
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            
            // Set the iframe src to the blob URL
            previewFrame.src = url;
            
            // Clean up the URL when the iframe loads
            previewFrame.onload = () => {
                setTimeout(() => URL.revokeObjectURL(url), 100);
            };
        } catch (error) {
            console.error('Preview Error:', error);
            // Fallback to a simple error message
            const blob = new Blob([`<html><body><pre style="color: #ff0000;">Preview Error: ${error.message}</pre></body></html>`], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            previewFrame.src = url;
        }
    }, 300);

    setupContextMenu() {
        if (!this.editor) return;
        this.editor.getWrapperElement().addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const menu = $('#contextMenu');
            if (menu) {
                menu.style.top = `${e.clientY}px`;
                menu.style.left = `${e.clientX}px`;
                menu.hidden = false;
            }
        });
        document.addEventListener('click', () => {
            const menu = $('#contextMenu');
            if (menu) menu.hidden = true;
        });
    }

    setupAutocomplete() {
        if (!this.editor || !window.CodeMirror) return;
        CodeMirror.registerHelper('hint', 'aiHint', async (editor) => {
            const cur = editor.getCursor();
            const token = editor.getTokenAt(cur);
            const word = token.string.trim();
            const context = editor.getLine(cur.line).slice(0, cur.ch);
            const suggestions = await this.getAISuggestions(context, editor.getOption('mode'));
            return {
                list: suggestions.length ? suggestions : [],
                from: CodeMirror.Pos(cur.line, token.start),
                to: CodeMirror.Pos(cur.line, token.end)
            };
        });
        this.editor.setOption('extraKeys', { ...this.editor.getOption('extraKeys'), 'Ctrl-Space': 'autocomplete' });
    }

    async getAISuggestions(context, mode) {
        const staticSuggestions = {
            htmlmixed: ['div', 'span', 'p', 'h1', 'body', 'head', 'script', 'link', 'style'],
            css: ['color', 'background', 'margin', 'padding', 'font-size', 'display', 'position'],
            javascript: ['function', 'let', 'const', 'var', 'if', 'else', 'return', 'class', 'import'],
            python: ['def', 'class', 'if', 'elif', 'else', 'for', 'while', 'import', 'with'],
            markdown: ['#', '##', '###', '**', '*', '`', '```', '[]', '()', '---']
        };
        const base = staticSuggestions[mode] || [];
        try {
            const response = await fetch(`${API_ENDPOINTS[state.currentModel]}/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(state.currentModel !== 'local' && { 'Authorization': `Bearer ${$('#apiKey') ? $('#apiKey').value : ''}` })
                },
                body: JSON.stringify({ prompt: context, max_tokens: 50 })
            });
            const data = await response.json();
            return [...base, ...(data.choices?.map(c => c.text.trim()) || [])].filter(t => t.startsWith(context.split(/\s+/).pop()));
        } catch {
            return base;
        }
    }

    async processUpdates() {
        if (state.isProcessing || !this.editor || !$('#instructionsInput')?.value.trim()) {
            console.log('processUpdates skipped: No instructions or already processing');
            updateStatus('Bereit'); // Status zurücksetzen, falls fälschlicherweise ausgelöst
            return;
        }
        console.log('processUpdates started, Caller:', new Error().stack);
        state.isProcessing = true;
        updateStatus('Processing...');
        showLoader(true, 'Verarbeiten...');

        const apiKey = $('#apiKey') ? $('#apiKey').value : '';
        const instructions = $('#instructionsInput') ? $('#instructionsInput').value : '';
        const code = this.editor.getValue();
        const temperature = parseFloat($('#temperatureInput') ? $('#temperatureInput').value : 0.3) || 0.3;
        const maxTokens = parseInt($('#maxTokensInput') ? $('#maxTokensInput').value : 4096) || 4096;

        if (state.currentModel !== 'local' && !apiKey) {
            showMessage('API Key erforderlich für Remote-Modelle!', 'error');
            state.isProcessing = false;
            updateStatus('Error');
            showLoader(false);
            return;
        }

        if (!instructions.trim() || !code.trim()) {
            showMessage('Anweisungen und Code sind erforderlich!', 'error');
            state.isProcessing = false;
            updateStatus('Error');
            showLoader(false);
            return;
        }

        try {
            await this.executeAIRequest(instructions, code, temperature, maxTokens);
            state.files[state.currentTab] = this.editor.getValue();
            state.save();
            showMessage('Code erfolgreich aktualisiert!');
            updateStatus('Bereit');
        } catch (error) {
            showMessage(`AI-Fehler: ${error.message}`, 'error');
            updateStatus('Error');
        } finally {
            state.isProcessing = false;
            showLoader(false);
        }
    }

    async executeAIRequest(instructions, code, temperature, maxTokens) {
        const payload = {
            model: state.currentModel === 'mistral' ? 'codestral-latest' : 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'Return only the modified code without explanations.' },
                { role: 'user', content: `Original code:\n${code}\n\nInstructions:\n${instructions}` }
            ],
            temperature,
            max_tokens: maxTokens,
            stream: true
        };

        const response = await fetch(`${API_ENDPOINTS[state.currentModel]}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(state.currentModel !== 'local' && { 'Authorization': `Bearer ${$('#apiKey') ? $('#apiKey').value : ''}` })
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(response.status === 401 ? 'Unauthorized: Check your API key.' : `API Error: ${response.statusText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let result = '';
        let buffer = '';
        let tokenCount = 0;
        const timeout = setTimeout(() => {
            throw new Error('Request timed out after 30 seconds');
        }, 30000); // Timeout nach 30 Sekunden

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    if (buffer) this.editor.setValue(result);
                    break;
                }

                const chunk = decoder.decode(value);
                buffer += chunk;
                const lines = buffer.split('\n');
                buffer = lines.pop();

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;
                        try {
                            const json = JSON.parse(data);
                            const content = json.choices[0].delta.content;
                            if (content) {
                                result += content;
                                tokenCount += content.split(/\s+/).length;
                                showLoader(true, `Verarbeiten... Tokens: ${tokenCount}`);
                                this.updatePreview(result);
                            }
                        } catch (e) {
                            console.warn('Stream Parsing Error:', e);
                        }
                    }
                }
                this.editor.setValue(result);
            }
        } finally {
            clearTimeout(timeout); // Timeout beenden
        }
    }

    runCode() {
        if (!this.editor) return;
        const code = this.editor.getValue();
        const lang = $('#languageSelection') ? $('#languageSelection').value : 'html';
        try {
            const newWindow = window.open('', '_blank');
            if (!newWindow) throw new Error('Popup blocked');
            if (lang === 'javascript') {
                const escapedCode = code.replace(/<\/script>/g, '<\\/script>');
                newWindow.document.write(`<!DOCTYPE html><html><body><script>${escapedCode}<\/script></body></html>`);
            } else if (lang === 'html') {
                newWindow.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>${code}</body></html>`);
            } else if (lang === 'css') {
                newWindow.document.write(`<!DOCTYPE html><html><head><style>${code}</style></head><body><h1>Test Heading</h1><p>Test Paragraph</p></body></html>`);
            } else {
                newWindow.document.write(`<pre>${code}</pre>`);
            }
            newWindow.document.close();
            showMessage('Code ausgeführt!');
            updateStatus('Running');
        } catch (error) {
            showMessage(`Ausführungsfehler: ${error.message}`, 'error');
            updateStatus('Error');
        }
    }

    debugCode() {
        if (!this.editor) return;
        const code = this.editor.getValue();
        const lang = $('#languageSelection') ? $('#languageSelection').value : 'html';
        const debugPanel = $('#debugPanel');
        if (debugPanel) debugPanel.hidden = false;
        const consoleOutput = $('#consoleOutput');
        if (consoleOutput) consoleOutput.innerHTML = '';

        if (lang === 'javascript') {
            try {
                const escapedCode = code.replace(/<\/script>/g, '<\\/script>');
                const wrappedCode = `
                    (function() {
                        const log = (...args) => document.getElementById('consoleOutput').innerHTML += args.join(' ') + '<br>';
                        ${Array.from(state.breakpoints).map(line => `if (${line} === ${this.editor.getCursor().line}) debugger;`).join('\n')}
                        ${escapedCode}
                    })();
                `;
                const newWindow = window.open('', '_blank');
                if (!newWindow) throw new Error('Popup blocked');
                newWindow.document.write(`<!DOCTYPE html><html><body><script>${wrappedCode}<\/script></body></html>`);
                newWindow.document.close();
                showMessage('Debugging gestartet!');
                updateStatus('Debugging');
            } catch (error) {
                if (consoleOutput) consoleOutput.innerHTML += `Fehler: ${error.message}<br>`;
                showMessage(`Debugging-Fehler: ${error.message}`, 'error');
            }
        } else {
            showMessage('Debugging nur für JavaScript unterstützt!', 'error');
        }
    }

    formatCode() {
        if (!this.editor) return;
        const code = this.editor.getValue();
        const lang = $('#languageSelection') ? $('#languageSelection').value : 'html';

        if (!window.prettier && !window.js_beautify) {
            showMessage('Weder Prettier noch js-beautify geladen!', 'error');
            return;
        }

        if (window.prettier) {
            try {
                const parserMap = {
                    javascript: 'babel',
                    html: 'html',
                    css: 'css',
                    markdown: 'markdown',
                    python: null
                };
                const parser = parserMap[lang];
                if (parser && window.prettierPlugins && window.prettierPlugins[parser]) {
                    const formatted = prettier.format(code, {
                        parser,
                        plugins: [
                            window.prettierPlugins.babel,
                            window.prettierPlugins.html,
                            window.prettierPlugins.postcss,
                            window.prettierPlugins.markdown
                        ].filter(Boolean),
                        singleQuote: true
                    });
                    this.editor.setValue(formatted);
                    state.files[state.currentTab] = formatted;
                    state.save();
                    showMessage('Code mit Prettier formatiert!');
                    updateStatus('Formatted');
                } else if (!parser) {
                    showMessage('Formatierung für diese Sprache nicht unterstützt!', 'error');
                } else {
                    showMessage('Prettier-Parser nicht geladen!', 'error');
                }
            } catch (error) {
                showMessage(`Prettier-Formatierungsfehler: ${error.message}`, 'error');
            }
        } else if (window.js_beautify) {
            try {
                const formatted = js_beautify(code);
                this.editor.setValue(formatted);
                state.files[state.currentTab] = formatted;
                state.save();
                showMessage('Code mit js-beautify formatiert!');
                updateStatus('Formatted');
            } catch (error) {
                showMessage(`js-beautify-Formatierungsfehler: ${error.message}`, 'error');
            }
        }
    }

    copyCode() {
        if (!this.editor) return;
        navigator.clipboard.writeText(this.editor.getValue())
            .then(() => showMessage('Code kopiert!'))
            .catch(err => showMessage(`Kopierfehler: ${err}`, 'error'));
        updateStatus('Copied');
    }

    downloadProject() {
        const blob = new Blob([JSON.stringify(state.files, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `torbes-project-${state.currentProject}-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showMessage('Projekt heruntergeladen!');
        updateStatus('Downloaded');
    }

    toggleDarkMode() {
        if (!this.editor) return;
        state.darkMode = !state.darkMode;
        state.save();
        document.body.classList.toggle('dark-mode');
        this.editor.setOption('theme', state.settings.theme);
        updateStatus(state.darkMode ? 'Dark Mode' : 'Light Mode');
    }

    undoChange() {
        if (!this.editor) return;
        this.editor.undo();
        state.files[state.currentTab] = this.editor.getValue();
        state.save();
        showMessage('Rückgängig gemacht');
        updateStatus('Undo');
    }

    redoChange() {
        if (!this.editor) return;
        this.editor.redo();
        state.files[state.currentTab] = this.editor.getValue();
        state.save();
        showMessage('Wiederholt');
        updateStatus('Redo');
    }

    addNewFile() {
        const fileName = prompt('Dateinamen eingeben (z.B. script.js):');
        if (fileName && !state.files[fileName]) {
            state.files[fileName] = '';
            this.setupTabs();
            this.switchTab(fileName);
            showMessage(`Erstellt: ${fileName}`);
        } else if (state.files[fileName]) {
            showMessage('Datei existiert bereits!', 'error');
        }
    }

    uploadFiles() {
        const fileUpload = $('#fileUpload');
        if (!fileUpload) return;
        const files = fileUpload.files;
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                state.files[file.name] = e.target.result;
                this.setupTabs();
                this.switchTab(file.name);
                showMessage(`Hochgeladen: ${file.name}`);
            };
            reader.readAsText(file);
        });
    }

    searchCode() {
        if (!this.editor) return;
        const query = $('#searchInput') ? $('#searchInput').value : '';
        if (!query) return;
        this.editor.execCommand('find');
        this.editor.focus();
        const cursor = this.editor.getSearchCursor(query);
        this.editor.setSelection(cursor.pos.from, cursor.pos.to);
        updateStatus(`Gefunden: ${query}`);
    }

    replaceCode() {
        if (!this.editor) return;
        const search = $('#searchInput') ? $('#searchInput').value : '';
        const replace = $('#replaceInput') ? $('#replaceInput').value : '';
        if (!search || !replace) return;
        const code = this.editor.getValue().replace(new RegExp(search, 'g'), replace);
        this.editor.setValue(code);
        state.files[state.currentTab] = code;
        state.save();
        showMessage(`"${search}" durch "${replace}" ersetzt`);
        updateStatus('Replaced');
    }

    newProject() {
        const projectName = prompt('Projektname eingeben:');
        if (projectName && !state.projects[projectName]) {
            state.projects[projectName] = {
                'index.html': '<!DOCTYPE html>\n<html>\n<head>\n    <title>New Project</title>\n</head>\n<body>\n    <h1>Hello, World!</h1>\n</body>\n</html>',
                'styles.css': 'body {\n    margin: 0;\n    padding: 20px;\n}\n'
            };
            state.currentProject = projectName;
            state.files = state.projects[projectName];
            state.currentTab = 'index.html';
            state.save();
            this.setupTabs();
            this.switchTab('index.html');
            showMessage(`Neues Projekt "${projectName}" erstellt!`);
        } else if (state.projects[projectName]) {
            showMessage('Projekt existiert bereits!', 'error');
        }
    }

    manageProjects() {
        const panel = $('#projectPanel');
        if (!panel) return;
        panel.hidden = !panel.hidden;
        const list = $('#projectList');
        if (!list) return;
        list.innerHTML = '';
        Object.keys(state.projects).forEach(project => {
            const li = document.createElement('li');
            li.textContent = project;
            li.addEventListener('click', () => {
                state.currentProject = project;
                state.files = state.projects[project];
                state.currentTab = Object.keys(state.files)[0];
                this.setupTabs();
                this.switchTab(state.currentTab);
                panel.hidden = true;
                showMessage(`Projekt "${project}" geladen`);
            });
            list.appendChild(li);
        });
    }

    exportProjects() {
        const blob = new Blob([JSON.stringify(state.projects, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `torbes-projects-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showMessage('Alle Projekte exportiert!');
    }

    gitIntegration() {
        const action = prompt('Git-Befehl (commit, push, pull):');
        if (!action) return;
        switch (action.toLowerCase()) {
            case 'commit':
                showMessage('Git Commit simuliert!', 'success');
                break;
            case 'push':
                showMessage('Git Push simuliert!', 'success');
                break;
            case 'pull':
                showMessage('Git Pull simuliert!', 'success');
                break;
            default:
                showMessage('Unbekannter Git-Befehl!', 'error');
        }
    }

    toggleSettings() {
        const panel = $('#settingsPanel');
        if (!panel) return;
        panel.hidden = !panel.hidden;
        const customTheme = $('#customTheme');
        const fontSize = $('#fontSize');
        if (customTheme) customTheme.value = state.settings.theme;
        if (fontSize) fontSize.value = state.settings.fontSize;
    }

    saveSettings() {
        const customTheme = $('#customTheme');
        const fontSize = $('#fontSize');
        if (customTheme) state.settings.theme = customTheme.value;
        if (fontSize) state.settings.fontSize = parseInt(fontSize.value, 10);
        state.save();
        this.applySettings();
        const panel = $('#settingsPanel');
        if (panel) panel.hidden = true;
        showMessage('Einstellungen gespeichert!');
    }

    applySettings() {
        if (!this.editor) return;
        this.editor.setOption('theme', state.settings.theme);
        this.editor.getWrapperElement().style.fontSize = `${state.settings.fontSize}px`;
    }

    startCollaboration() {
        if (state.collabSession) {
            showMessage('Kollaboration bereits aktiv!', 'error');
            return;
        }
        this.collabSocket = new WebSocket('ws://localhost:8080');
        this.collabSocket.onopen = () => {
            state.collabSession = Date.now().toString();
            const collabStatus = $('#collabStatus');
            if (collabStatus) collabStatus.textContent = `Kollaboration: Aktiv (${state.collabSession})`;
            showMessage('Kollaboration gestartet!');
        };
        this.collabSocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'update' && data.file === state.currentTab && this.editor) {
                this.editor.setValue(data.content, { origin: 'remote' });
            }
        };
        this.collabSocket.onclose = () => {
            state.collabSession = null;
            const collabStatus = $('#collabStatus');
            if (collabStatus) collabStatus.textContent = 'Kollaboration: Offline';
            showMessage('Kollaboration beendet!');
        };
        this.collabSocket.onerror = () => {
            showMessage('Kollaborationsfehler!', 'error');
            state.collabSession = null;
            const collabStatus = $('#collabStatus');
            if (collabStatus) collabStatus.textContent = 'Kollaboration: Offline';
        };
    }

    scrollToBottom() {
        if (!this.editor) return;
        const lastLine = this.editor.lastLine();
        this.editor.scrollIntoView({ line: lastLine, ch: 0 }, 200);
    }
}

// Authentication Module
class AuthManager {
    static toggleAuthPanel() {
        const panel = $('#authPanel');
        if (panel) panel.hidden = !panel.hidden;
    }

    static authenticateUser() {
        const email = $('#email') ? $('#email').value : '';
        const password = $('#password') ? $('#password').value : '';
        if (!email || !password) {
            showMessage('Email und Passwort erforderlich!', 'error');
            return;
        }
        state.user = { email };
        showMessage('Anmeldung erfolgreich!', 'success');
        this.toggleAuthPanel();
    }
}

// Event Bindings
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM fully loaded');
    const editor = new CodeEditor();
    try {
        await editor.initialize();

        // Header Buttons
        const newProjectBtn = $('#newProjectBtn');
        if (newProjectBtn) newProjectBtn.addEventListener('click', () => editor.newProject());
        const manageProjectsBtn = $('#manageProjectsBtn');
        if (manageProjectsBtn) manageProjectsBtn.addEventListener('click', () => editor.manageProjects());
        const gitBtn = $('#gitBtn');
        if (gitBtn) gitBtn.addEventListener('click', () => editor.gitIntegration());
        const settingsBtn = $('#settingsBtn');
        if (settingsBtn) settingsBtn.addEventListener('click', () => editor.toggleSettings());
        const authToggleBtn = $('#authToggleBtn');
        if (authToggleBtn) authToggleBtn.addEventListener('click', AuthManager.toggleAuthPanel);
        const loginBtn = $('#loginBtn');
        if (loginBtn) loginBtn.addEventListener('click', AuthManager.authenticateUser);

        // Toolbar Buttons
        const generateBtn = $('#generateBtn');
        if (generateBtn) generateBtn.addEventListener('click', () => editor.processUpdates());
        const runBtn = $('#runBtn');
        if (runBtn) runBtn.addEventListener('click', () => editor.runCode());
        const debugBtn = $('#debugBtn');
        if (debugBtn) debugBtn.addEventListener('click', () => editor.debugCode());
        const formatBtn = $('#formatBtn');
        if (formatBtn) formatBtn.addEventListener('click', () => editor.formatCode());
        const copyBtn = $('#copyBtn');
        if (copyBtn) copyBtn.addEventListener('click', () => editor.copyCode());
        const downloadBtn = $('#downloadBtn');
        if (downloadBtn) downloadBtn.addEventListener('click', () => editor.downloadProject());
        const themeBtn = $('#themeBtn');
        if (themeBtn) themeBtn.addEventListener('click', () => editor.toggleDarkMode());
        const undoBtn = $('#undoBtn');
        if (undoBtn) undoBtn.addEventListener('click', () => editor.undoChange());
        const redoBtn = $('#redoBtn');
        if (redoBtn) redoBtn.addEventListener('click', () => editor.redoChange());
        const newFileBtn = $('#newFileBtn');
        if (newFileBtn) newFileBtn.addEventListener('click', () => editor.addNewFile());
        const uploadBtn = $('#uploadBtn');
        if (uploadBtn) uploadBtn.addEventListener('click', () => $('#fileUpload') && $('#fileUpload').click());
        const fileUpload = $('#fileUpload');
        if (fileUpload) fileUpload.addEventListener('change', () => editor.uploadFiles());
        const searchBtn = $('#searchBtn');
        if (searchBtn) searchBtn.addEventListener('click', () => editor.searchCode());
        const replaceBtn = $('#replaceBtn');
        if (replaceBtn) replaceBtn.addEventListener('click', () => editor.replaceCode());
        const collaborateBtn = $('#collaborateBtn');
        if (collaborateBtn) collaborateBtn.addEventListener('click', () => editor.startCollaboration());

        // Context Menu
        const contextGenerate = $('#contextGenerate');
        if (contextGenerate) contextGenerate.addEventListener('click', () => editor.processUpdates());
        const contextRun = $('#contextRun');
        if (contextRun) contextRun.addEventListener('click', () => editor.runCode());
        const contextDebug = $('#contextDebug');
        if (contextDebug) contextDebug.addEventListener('click', () => editor.debugCode());
        const contextFormat = $('#contextFormat');
        if (contextFormat) contextFormat.addEventListener('click', () => editor.formatCode());
        const contextCopy = $('#contextCopy');
        if (contextCopy) contextCopy.addEventListener('click', () => editor.copyCode());
        const contextDownload = $('#contextDownload');
        if (contextDownload) contextDownload.addEventListener('click', () => editor.downloadProject());

        // Settings
        const loadProjectBtn = $('#loadProjectBtn');
        if (loadProjectBtn) loadProjectBtn.addEventListener('click', () => editor.manageProjects());
        const exportProjectsBtn = $('#exportProjectsBtn');
        if (exportProjectsBtn) exportProjectsBtn.addEventListener('click', () => editor.exportProjects());
        const saveSettingsBtn = $('#saveSettingsBtn');
        if (saveSettingsBtn) saveSettingsBtn.addEventListener('click', () => editor.saveSettings());

        // Debug
        const toggleBreakpointBtn = $('#toggleBreakpointBtn');
        if (toggleBreakpointBtn) toggleBreakpointBtn.addEventListener('click', () => {
            if (!editor.editor) return;
            const line = editor.editor.getCursor().line;
            const info = editor.editor.lineInfo(line);
            if (info.gutterMarkers && info.gutterMarkers.breakpoints) {
                editor.editor.setGutterMarker(line, 'breakpoints', null);
                state.breakpoints.delete(line);
            } else {
                const marker = document.createElement('div');
                marker.style.color = '#ff0000';
                marker.innerHTML = '●';
                editor.editor.setGutterMarker(line, 'breakpoints', marker);
                state.breakpoints.add(line);
            }
        });

        // Sicherstellen, dass der Status nach Initialisierung "Bereit" ist
        updateStatus('Bereit');
    } catch (error) {
        console.error('Initialization failed:', error);
        showMessage('Initialisierung fehlgeschlagen! Bitte Seite neu laden.', 'error');
        updateStatus('Error');
    }
});
