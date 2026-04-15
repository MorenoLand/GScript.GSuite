const TabManager = {
    _tabs: [],
    _activeTabId: null,
    _idCounter: 0,
    _barEl: null,
    _suppressClick: false,
    _initialized: false,
    _listEl: null,
    _pendingRestoreState: null,

    get _listEl() {
        return document.getElementById('suiteTabsList');
    },

    _debugLog(...args) {
        try { console.debug('[TabManager]', ...args); } catch (e) {}
    },

    init() {
        this._barEl = document.getElementById('suiteTabs');
        if (!this._listEl) return false;
        if (this._initialized) return true;
        const container = this._listEl;
        const btnL = document.getElementById('suiteTabScrollLeft');
        const btnR = document.getElementById('suiteTabScrollRight');
        const update = () => {
            if (btnL) btnL.style.display = container.scrollLeft > 2 ? '' : 'none';
            if (btnR) btnR.style.display = container.scrollLeft + container.clientWidth < container.scrollWidth - 2 ? '' : 'none';
        };
        container.addEventListener('scroll', update);
        if (btnL) btnL.addEventListener('click', () => container.scrollBy({ left: -200, behavior: 'smooth' }));
        if (btnR) btnR.addEventListener('click', () => container.scrollBy({ left: 200, behavior: 'smooth' }));
        this._updateScrollButtons = update;
        this._setupDrag();
        this._initialized = true;
        this._debugLog('init complete');
        return true;
    },

    restoreState() {
        try {
            const stored = localStorage.getItem('graalSuiteTabs');
            if (!stored) return false;
            const state = JSON.parse(stored).filter(t => t?.type !== 'beautify' && t?.type !== 'setshape');
            if (!Array.isArray(state) || state.length === 0) return false;
            this._pendingRestoreState = state;
            this._restorePendingState();
            return true;
        } catch (e) { console.warn('[TabManager restoreState] failed:', e); return false; }
    },

    saveState() {
        try {
            if (!this._tabs.length && (!Array.isArray(this._pendingRestoreState) || !this._pendingRestoreState.length)) {
                this.clearState();
                return;
            }
            const state = this._tabs.filter(t => t.type !== 'beautify' && t.type !== 'setshape').map(t => ({ type: t.type, name: t.name, data: this._serializeTabData(t) }));
            if (Array.isArray(this._pendingRestoreState) && this._pendingRestoreState.length) {
                const unmatchedSaved = this._pendingRestoreState.filter(saved =>
                    !this._tabs.some(tab => this._tabMatchesState(tab, saved))
                );
                state.push(...unmatchedSaved);
            }
            localStorage.setItem('graalSuiteTabs', JSON.stringify(state));
        } catch (e) { console.warn('[TabManager saveState] failed:', e); }
    },

    clearState() {
        try { localStorage.removeItem('graalSuiteTabs'); } catch (e) {}
    },

    addTab(type, name, data) {
        this.init();
        if (!this._listEl) { return null; }
        const id = 'tab_' + (++this._idCounter);
        const entry = { id, type, name, dirty: false, data: data || {} };
        this._tabs.push(entry);
        this._renderTab(entry);
        this._restorePendingState();
        this._updateScrollButtons();
        this.switchTo(id);
        this.saveState();
        return entry;
    },

    removeTab(id) {
        const idx = this._tabs.findIndex(t => t.id === id);
        if (idx === -1) return;
        const tab = this._tabs[idx];
        this._confirmClose([tab], () => this._doRemove(id));
    },

    _isTabDirty(tab) {
        if (tab.dirty) return true;
        if (tab.type === 'gani' && typeof window.isGaniTabDirty === 'function') return window.isGaniTabDirty(tab);
        if (tab.type === 'level' && typeof window.levelEditor?.isLevelTabDirty === 'function') return window.levelEditor.isLevelTabDirty(tab);
        return false;
    },

    _confirmClose(tabs, cb) {
        const dirty = tabs.filter(t => this._isTabDirty(t));
        if (!dirty.length) { cb(); return; }
        const msg = tabs.length === 1
            ? `Close "${tabs[0].name}"?\nUnsaved changes will be lost.`
            : `Close ${tabs.length} tab(s)?\n${dirty.length} unsaved: ${dirty.slice(0, 3).map(t => t.name).join(', ')}${dirty.length > 3 ? ' +' + (dirty.length - 3) + ' more' : ''}`;
        if (typeof window.showConfirmDialog === 'function') {
            window.showConfirmDialog(msg, ok => { if (ok) cb(); });
        } else if (window.confirm(msg)) {
            cb();
        }
    },

    _doRemove(id) {
        const idx = this._tabs.findIndex(t => t.id === id);
        if (idx === -1) return;
        const tab = this._tabs[idx];
        if (tab.type === 'gani' && typeof window.closeGaniTab === 'function') window.closeGaniTab(tab);
        else if (tab.type === 'level' && window.levelEditor?.closeLevelTabByData) window.levelEditor.closeLevelTabByData(tab);
        else if (tab.type === 'beautify' && typeof window.closeBeautifyTab === 'function') window.closeBeautifyTab(tab);
        else if (tab.type === 'setshape' && typeof window.closeSetshapeTab === 'function') window.closeSetshapeTab(tab);
        this._forceRemoveTab(id);
    },

    _forceRemoveTab(id) {
        const idx = this._tabs.findIndex(t => t.id === id);
        if (idx === -1) return;
        this._tabs.splice(idx, 1);
        this._unrenderTab(id);
        if (this._activeTabId === id) {
            const next = this._tabs[Math.min(idx, this._tabs.length - 1)];
            if (next) this.switchTo(next.id);
            else {
                this._activeTabId = null;
                if (typeof window.showEmptyEditorState === 'function') window.showEmptyEditorState();
            }
        }
        this._updateScrollButtons();
        this.saveState();
    },

    switchTo(id) {
        const tab = this._tabs.find(t => t.id === id);
        if (!tab) { return; }
        const prev = this._tabs.find(t => t.id === this._activeTabId);
        if (prev) {
            if (prev.type === 'gani' && typeof window.deactivateGaniTab === 'function') window.deactivateGaniTab(prev);
            else if (prev.type === 'level' && window.levelEditor && typeof window.levelEditor.deactivateLevelTab === 'function') window.levelEditor.deactivateLevelTab(prev);
            else if (prev.type === 'beautify' && typeof window.deactivateBeautifyTab === 'function') window.deactivateBeautifyTab(prev);
            else if (prev.type === 'setshape' && typeof window.deactivateSetshapeTab === 'function') window.deactivateSetshapeTab(prev);
        }
        this._activeTabId = id;
        if (tab.type === 'gani' && typeof window.activateGaniTab === 'function') {
            window.activateGaniTab(tab);
        } else if (tab.type === 'level' && window.levelEditor) {
            if (typeof window.levelEditor.activateLevelTab === 'function') {
                window.levelEditor.activateLevelTab(tab);
            } else if (typeof window.levelEditor.switchLevel === 'function') {
                window.levelEditor.switchLevel(tab.data?.index);
            }
        } else if (tab.type === 'beautify' && typeof window.activateBeautifyTab === 'function') {
            window.activateBeautifyTab(tab);
        } else if (tab.type === 'setshape' && typeof window.activateSetshapeTab === 'function') {
            window.activateSetshapeTab(tab);
        }
        if (typeof window.switchToTab === 'function') {
            const targetUI = tab.type === 'gani' ? 'gani' : (tab.type === 'beautify' ? 'beautify' : (tab.type === 'setshape' ? 'setshape' : 'level'));
            if (targetUI === 'gani' && window.levelEditor?._playMode) window.levelEditor.exitPlayMode();
            window.switchToTab(targetUI);
        }
        this._updateHighlight();
        this._scrollTabIntoView(id);
        document.dispatchEvent(new CustomEvent('tabswitch', { detail: tab }));
    },

    getActiveTab() { return this._tabs.find(t => t.id === this._activeTabId) || null; },
    getTabsByType(type) { return this._tabs.filter(t => t.type === type); },

    _serializeTabData(tab) {
        if (!tab) return {};
        if (tab.type === 'gani') {
            const ani = tab.data?.ani;
            return {
                index: typeof tab.data?.index === 'number' ? tab.data.index : null,
                id: ani?.id || tab.data?.id || null,
                fileName: ani?.fileName || tab.data?.fileName || tab.name || '',
                fullPath: ani?.fullPath || tab.data?.fullPath || ''
            };
        }
        if (tab.type === 'level') {
            const level = tab.data?.level;
            return {
                index: typeof tab.data?.index === 'number' ? tab.data.index : null,
                name: level?.name || tab.data?.name || tab.name || '',
                fullPath: level?.fullPath || tab.data?.fullPath || ''
            };
        }
        return tab.data || {};
    },

    _tabMatchesState(tab, saved) {
        if (!tab || !saved || tab.type !== saved.type) return false;
        const savedData = saved.data || {};
        const currentData = this._serializeTabData(tab);
        if (savedData.id && currentData.id && savedData.id === currentData.id) return true;
        if (savedData.fullPath && currentData.fullPath && savedData.fullPath === currentData.fullPath) return true;
        if (tab.type === 'gani') {
            const savedName = savedData.fileName || saved.name || '';
            const currentName = currentData.fileName || tab.name || '';
            return !!savedName && savedName === currentName;
        }
        const savedName = savedData.name || saved.name || '';
        const currentName = currentData.name || tab.name || '';
        return !!savedName && savedName === currentName;
    },

    _restorePendingState() {
        if (!Array.isArray(this._pendingRestoreState) || !this._pendingRestoreState.length) return false;
        if (!this._tabs.length || !this._listEl) return false;
        const ordered = [];
        const remaining = [...this._tabs];
        const unmatchedSaved = [];
        for (const saved of this._pendingRestoreState) {
            const matchIndex = remaining.findIndex(tab => this._tabMatchesState(tab, saved));
            if (matchIndex >= 0) ordered.push(remaining.splice(matchIndex, 1)[0]);
            else unmatchedSaved.push(saved);
        }
        if (!ordered.length) return false;
        ordered.push(...remaining);
        this._tabs = ordered;
        this._listEl.innerHTML = '';
        for (const tab of this._tabs) this._renderTab(tab);
        this._updateHighlight();
        this._updateScrollButtons();
        this._pendingRestoreState = unmatchedSaved.length ? unmatchedSaved : null;
        return true;
    },

    markDirty(id, dirty) {
        const tab = this._tabs.find(t => t.id === id);
        if (!tab) return;
        tab.dirty = dirty;
    },

    renameTab(id, name) {
        const tab = this._tabs.find(t => t.id === id);
        if (!tab) return;
        tab.name = name;
        const el = this._listEl.querySelector(`[data-tab-id="${id}"] .tab-name`);
        if (el) { el.textContent = name; el.title = name; }
    },

    findTabByData(key, value) { return this._tabs.find(t => t.data[key] === value) || null; },

    closeAll() {
        const toClose = [...this._tabs];
        const ids = toClose.map(t => t.id);
        this._confirmClose(toClose, () => ids.forEach(id => this._doRemove(id)));
    },

    _renderTab(entry) {
        this.init();
        if (!this._listEl) return;
        if (this._barEl) this._barEl.style.display = '';
        const el = document.createElement('div');
        el.className = 'tab';
        el.dataset.tabId = entry.id;
        el.dataset.tabType = entry.type;
        el.draggable = false;
        el.innerHTML = `<span class="tab-name">${entry.name}</span><span class="tab-close">×</span>`;
        const closeBtn = el.querySelector('.tab-close');
        const iconMarkup = this._getTabIconHTML(entry);
        if (iconMarkup) el.insertAdjacentHTML('afterbegin', iconMarkup);
        closeBtn.addEventListener('click', e => { e.stopPropagation(); this.removeTab(entry.id); });
        el.addEventListener('click', () => {
            if (this._suppressClick) {
                this._suppressClick = false;
                return;
            }
            this.switchTo(entry.id);
        });
        el.addEventListener('dragstart', e => e.preventDefault());
        el.addEventListener('contextmenu', e => { e.preventDefault(); this._showContextMenu(e, entry); });
        this._listEl.appendChild(el);
    },

    _unrenderTab(id) {
        const el = this._listEl.querySelector(`[data-tab-id="${id}"]`);
        if (el) el.remove();
        if (this._barEl && this._tabs.length === 0) this._barEl.style.display = 'none';
    },

    _updateHighlight() {
        if (!this._listEl) return;
        this._listEl.querySelectorAll('.tab').forEach(el => {
            const isActive = el.dataset.tabId === this._activeTabId;
            el.classList.toggle('active', isActive);
        });
    },

    _scrollTabIntoView(id) {
        const el = this._listEl.querySelector(`[data-tab-id="${id}"]`);
        if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
    },

    _updateScrollButtons() {},

    _getTabIconHTML(entry) {
        const iconMap = {
            level: { src: 'icons/rcfiles_nw.png', cls: '' },
            gani: { src: 'icons/user.svg', cls: 'svg-icon' },
            beautify: { src: 'icons/code.svg', cls: 'svg-icon' },
            setshape: { src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACbUlEQVQ4y52P20uTcRzGn9972MEdHBvOw1JZZk4dTjyXhGEGUgkWFJH1P3QTQXgVne6UThCEFxVBYWVgWCCBQ6IM0cBkouLxTbc5NJzv67b39/66SG2pQfXcfPnC83y/n4fgP1RZd8JAeJ4nIDH+X8OFpQdyKE2063T6S5QmwgIAVNUdE0yWVCMhAGMbTgYQAjAAK5FwS2Zm5sGhgf6LvCC0rq4s3fBV13Z+HRwAceXuE1PtzisAvAD5/R0BwBisNkfxKbfsGdHcseHRQF35oYbHfW9ePZweH2kTIqEFc15Rme/chTOKOz+/eiMFgDCAEQBsKbzk6H/WQWrNU3pDZUW3v7fnqiJH72mUMmHzGdVojijq8vCrAQAgHoth/EMv0uk3+OfNpMwxnDbrSi9YNJrIwuwk45KJ2bYZi63jXVcXrMHPWLSWYH/jWfi/u+LrTGyKhCQOAITtlTcnpRSTYxNw5XkgGS1objyCGSmMZUXt9fe8OOnM2KPuOJAsjufg8RZCmplDia8IgigCAHhB0ADEQ4vzP327hdkGB8fxyHbnQhBFKLKMdUUBRzh9fVOLbtO7KwHZtklzEtpv3eyU12QZYLA50i+X1tRfH/74XtuVIJkkGo3iwe07jxi0+0Vl5a8bmk+vBr586jNZbW1bBIQQHiA81bQdB1SVQlW1YNXho63dTzuOuwuK07wVNXaAtwOAoFFKOY7kTEwHfRPTwR0UaiIBg8nsefv8ybW9Hm+9McWUPTo0GLLY7IGtunpDSkaK2VL4pyrOrNzzdmeWh+O4OGOANDX2UllbvRtamGUEfyczCDEk7ctgjALAD3gS6nZ20OQgAAAAAElFTkSuQmCC', cls: '' }
        };
        const icon = iconMap[entry.type];
        if (!icon) return '';
        return `<img class="tab-icon ${icon.cls}" src="${icon.src}" alt="">`;
    },

    _setupContextMenu() {},

    _showContextMenu(e, tab) {
        let menu = document.getElementById('tabCtxMenu');
        if (menu) menu.remove();
        menu = document.createElement('div');
        menu.id = 'tabCtxMenu';
        menu.className = 'tab-ctx-menu';
        menu.style.display = 'block';
        const tabIdx = this._tabs.findIndex(t => t.id === tab.id);
        const items = [
            { label: 'Close', action: () => this.removeTab(tab.id) },
            { label: 'Close to Left', action: () => {
                const toClose = this._tabs.slice(0, tabIdx);
                const ids = toClose.map(t => t.id);
                this._confirmClose(toClose, () => ids.forEach(id => this._doRemove(id)));
            }},
            { label: 'Close to Right', action: () => {
                const toClose = this._tabs.slice(tabIdx + 1);
                const ids = toClose.map(t => t.id);
                this._confirmClose(toClose, () => ids.forEach(id => this._doRemove(id)));
            }},
            { label: 'Close Others', action: () => {
                const toClose = this._tabs.filter(t => t.id !== tab.id);
                const ids = toClose.map(t => t.id);
                this._confirmClose(toClose, () => ids.forEach(id => this._doRemove(id)));
            }},
            { label: 'Close All', action: () => this.closeAll() },
            { label: 'Rename', action: () => this._renameTab(tab.id) },
        ];
        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'tab-ctx-item';
            div.textContent = item.label;
            div.addEventListener('click', () => { menu.remove(); item.action(); });
            menu.appendChild(div);
        });
        menu.style.left = e.clientX + 'px';
        menu.style.top = e.clientY + 'px';
        document.body.appendChild(menu);
        const close = ev => { if (!menu.contains(ev.target)) { menu.remove(); document.removeEventListener('mousedown', close); } };
        setTimeout(() => document.addEventListener('mousedown', close), 0);
    },

    _renameTab(id) {
        const tab = this._tabs.find(t => t.id === id);
        if (!tab) return;
        const box = document.createElement('div');
        box.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#2b2b2b;border:1px solid #404040;padding:14px 16px;z-index:99999;min-width:260px;font-size:12px;color:#e0e0e0;box-shadow:0 2px 8px rgba(0,0,0,0.5);';
        const input = document.createElement('input');
        input.value = tab.name;
        input.style.cssText = 'width:100%;box-sizing:border-box;background:#1a1a1a;color:#e0e0e0;border:1px solid #404040;padding:4px 6px;margin:8px 0 10px;font-family:inherit;font-size:12px;';
        const btnRow = document.createElement('div'); btnRow.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;';
        const ok = document.createElement('button'); ok.textContent = 'Rename'; ok.style.cssText = 'padding:4px 12px;background:#1a1a1a;color:#e0e0e0;border:1px solid #404040;cursor:pointer;font-size:12px;';
        const cancel = document.createElement('button'); cancel.textContent = 'Cancel'; cancel.style.cssText = 'padding:4px 12px;background:#1a1a1a;color:#e0e0e0;border:1px solid #404040;cursor:pointer;font-size:12px;';
        const finish = (save) => { 
            if (save && input.value.trim()) { 
                tab.name = input.value.trim(); 
                this._renderTab(tab);
            } 
            document.body.removeChild(box); 
        };
        ok.onclick = () => finish(true); cancel.onclick = () => finish(false);
        input.onkeydown = (ev) => { if (ev.key === 'Enter') finish(true); if (ev.key === 'Escape') finish(false); };
        box.appendChild(Object.assign(document.createElement('div'), {textContent:'Rename Tab', style:'font-weight:bold;margin-bottom:4px;'}));
        box.appendChild(input); btnRow.appendChild(ok); btnRow.appendChild(cancel); box.appendChild(btnRow);
        document.body.appendChild(box);
        input.focus();
        input.select();
    },

    _setupDrag() {
        let dragId = null, startX = 0, startY = 0, dragging = false, dragEl = null;
        const clearIndicators = () => {
            this._listEl?.querySelectorAll('.tab').forEach(t => t.classList.remove('drag-over-left', 'drag-over-right'));
        };
        const getTabAtPoint = (x, y) => {
            const el = document.elementFromPoint(x, y);
            return el ? el.closest('.tab') : null;
        };
        const syncDomOrderToTabs = () => {
            if (!this._listEl) return;
            const orderedIds = Array.from(this._listEl.querySelectorAll('.tab')).map(t => t.dataset.tabId);
            const byId = new Map(this._tabs.map(t => [t.id, t]));
            this._tabs = orderedIds.map(id => byId.get(id)).filter(Boolean);
        };
        const resetDraggedStyles = () => {
            if (!dragEl) return;
            dragEl.classList.remove('dragging');
            dragEl.style.transform = '';
            dragEl.style.zIndex = '';
            dragEl.style.pointerEvents = '';
        };
        this._listEl.addEventListener('mousedown', e => {
            if (e.button !== 0) return;
            const el = e.target.closest('.tab');
            if (!el || e.target.classList.contains('tab-close')) return;
            dragId = el.dataset.tabId;
            dragEl = el;
            startX = e.clientX;
            startY = e.clientY;
            dragging = false;
            this._suppressClick = false;
            document.body.classList.add('tab-dragging');
            this._debugLog('drag start', { dragId, startX, startY, label: el.querySelector('.tab-name')?.textContent });
        });
        document.addEventListener('mousemove', e => {
            if (!dragId) return;
            if (!dragging && (Math.abs(e.clientX - startX) > 5 || Math.abs(e.clientY - startY) > 5)) {
                dragging = true;
                if (dragEl) {
                    dragEl.classList.add('dragging');
                    dragEl.style.zIndex = '80';
                    dragEl.style.pointerEvents = 'none';
                }
                this._debugLog('drag threshold passed', { dragId, x: e.clientX, y: e.clientY });
            }
            if (!dragging) return;
            e.preventDefault();
            const target = getTabAtPoint(e.clientX, e.clientY);
            if (target && target.dataset.tabId !== dragId) {
                const rect = target.getBoundingClientRect();
                const insertBefore = e.clientX < rect.left + rect.width / 2;
                if (insertBefore) {
                    if (target !== dragEl?.nextElementSibling) {
                        this._listEl.insertBefore(dragEl, target);
                    }
                } else {
                    if (target.nextElementSibling !== dragEl) {
                        this._listEl.insertBefore(dragEl, target.nextElementSibling);
                    }
                }
                syncDomOrderToTabs();
                this._debugLog('drag target', {
                    dragId,
                    targetId: target.dataset.tabId,
                    targetLabel: target.querySelector('.tab-name')?.textContent,
                    insertAfter: !insertBefore
                });
            }
        });
        document.addEventListener('mouseup', e => {
            if (!dragId) return;
            if (dragging) {
                this._suppressClick = true;
                if (dragEl) {
                    syncDomOrderToTabs();
                    this._debugLog('drop reorder', {
                        dragId,
                        order: this._tabs.map(t => t.name)
                    });
                    this.saveState();
                }
            }
            clearIndicators();
            resetDraggedStyles();
            document.body.classList.remove('tab-dragging');
            dragId = null;
            dragEl = null;
            dragging = false;
        });
    },

    _rebuildDOM() {
        this.init();
        if (!this._listEl) return;
        this._listEl.innerHTML = '';
        this._tabs.forEach(t => this._renderTab(t));
        this._updateHighlight();
        this._updateScrollButtons();
    }
};

window.tabManager = TabManager;
