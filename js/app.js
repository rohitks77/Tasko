/**
 * Tasko - Task Management App
 */

class TodoApp {
    constructor() {
        this.todos = [];
        this.categories = [];
        this.editingId = null;
        this.filters = { status: 'all', priority: null, search: '' };
        this.defaultShortcuts = {
            newTask: 'n',
            search: '/',
            toggleTheme: 'd',
            settings: ','
        };
        this.defaultSearchEngines = [
            { id: 'yt', prefix: 'yt', name: 'YouTube', url: 'https://www.youtube.com/results?search_query={query}' },
            { id: 'gh', prefix: 'gh', name: 'GitHub', url: 'https://github.com/search?q={query}' },
            { id: 'wiki', prefix: 'wiki', name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Special:Search?search={query}' },
            { id: 'maps', prefix: 'maps', name: 'Google Maps', url: 'https://www.google.com/maps/search/{query}' },
            { id: 'x', prefix: 'x', name: 'X / Twitter', url: 'https://x.com/search?q={query}' },
            { id: 'chat', prefix: 'chat', name: 'ChatGPT', url: 'https://chatgpt.com/?q={query}' }
        ];
        this.settings = {
            theme: 'light',
            colors: { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' },
            shortcuts: { ...this.defaultShortcuts },
            showClock: true,
            quickSearch: true,
            showSuggestions: false,
            showTimestamps: false,
            spotlightSearch: true,
            dailyReminders: false,
            morningReminder: true,
            eveningReminder: true,
            missedTaskAlert: true,
            eveningReminderTime: 21, // 9 PM
            showMissedTab: false,
            skipDeleteConfirm: false,
            autoCreateDailyTasks: false, // Auto-create daily tasks at midnight
            placeholder: 'Add task, /url, // to search, @ for quick links...',
            searchEngines: [...this.defaultSearchEngines],
            fontFamily: 'Inter',
            name: '',
            widgets: [],
            conditions: [],
            showConditionBoard: false,
            conditionBoardTitle: "Today's Schedule",
            hideMainContent: false
        };
        this.lastTime = { h1: '', h2: '', m1: '', m2: '', s1: '', s2: '' };
        this.recordingShortcut = null;
        this.editingWidgetId = null;
        this.editingSearchEngineId = null;
        this.isSaving = false;
        this.lastAddedTodoId = null;
        this.reminderInterval = null;
        this.lastReminderDate = null;
        this.editingConditionId = null;
        this.conditionCheckerInterval = null;
        
        this.init();
    }

    async init() {
        this.cacheElements();
        this.bindEvents();
        await this.loadData();
        
        // Check if a midnight reset should have happened (for when laptop was off)
        await this.checkAndRunMissedReset();
        
        this.updateGreeting();
        this.startClock();
        this.applySettings();
        this.render();
        DragDrop.init(this.todoList, (from, to) => this.reorder(from, to));
        
        // Listen for storage changes (from popup)
        chrome.storage.onChanged.addListener((changes, area) => {
            if (area === 'sync') {
                // Skip if we just saved ourselves
                if (this.isSaving) {
                    return;
                }
                if (changes.todos) {
                    this.todos = changes.todos.newValue || [];
                    this.render();
                }
                if (changes.settings) {
                    const newSettings = changes.settings.newValue;
                    if (newSettings) {
                        this.settings = {
                            ...this.settings,
                            ...newSettings,
                            shortcuts: { ...this.defaultShortcuts, ...(newSettings.shortcuts || {}) },
                            widgets: newSettings.widgets || [],
                            conditions: newSettings.conditions || [],
                            searchEngines: newSettings.searchEngines || [...this.defaultSearchEngines]
                        };
                        this.applySettings();
                    }
                }
            }
        });
    }

    cacheElements() {
        // Clock
        this.hour1 = document.getElementById('hour1');
        this.hour2 = document.getElementById('hour2');
        this.min1 = document.getElementById('min1');
        this.min2 = document.getElementById('min2');
        this.sec1 = document.getElementById('sec1');
        this.sec2 = document.getElementById('sec2');
        this.clockPeriod = document.getElementById('clockPeriod');
        this.dateEn = document.getElementById('dateEn');
        
        // Header
        this.greeting = document.getElementById('greeting');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        
        // Quick add
        this.quickInput = document.getElementById('quickInput');
        this.expandBtn = document.getElementById('expandBtn');
        this.searchSuggestions = document.getElementById('searchSuggestions');
        this.selectedSuggestionIndex = -1;
        
        // Filters
        this.filterTabs = document.querySelectorAll('.filter-tab');
        this.priorityFilters = document.querySelectorAll('.priority-filter');
        this.searchInput = document.getElementById('searchInput');
        
        // List
        this.todoList = document.getElementById('todoList');
        this.emptyState = document.getElementById('emptyState');
        this.taskCount = document.getElementById('taskCount');
        this.clearCompletedBtn = document.getElementById('clearCompleted');
        
        // Modal
        this.modal = document.getElementById('taskModal');
        this.modalTitle = document.getElementById('modalTitle');
        this.taskForm = document.getElementById('taskForm');
        this.taskTitle = document.getElementById('taskTitle');
        this.taskDesc = document.getElementById('taskDesc');
        this.taskDue = document.getElementById('taskDue');
        this.taskCategory = document.getElementById('taskCategory');
        this.priorityBtns = document.querySelectorAll('.pri-btn');
        this.recurrenceBtns = document.querySelectorAll('.recur-btn');
        this.closeModalBtn = document.getElementById('closeModal');
        this.cancelBtn = document.getElementById('cancelBtn');
        this.saveBtn = document.getElementById('saveBtn');
        this.categoriesDatalist = document.getElementById('categories');
        
        // Settings
        this.settingsBtn = document.getElementById('settingsBtn');
        this.settingsPanel = document.getElementById('settingsPanel');
        this.closeSettingsBtn = document.getElementById('closeSettings');
        this.themeToggle = document.getElementById('themeToggle');
        this.colorHigh = document.getElementById('colorHigh');
        this.colorMedium = document.getElementById('colorMedium');
        this.colorLow = document.getElementById('colorLow');
        this.clearAllBtn = document.getElementById('clearAllData');
        this.shortcutKeys = document.querySelectorAll('.shortcut-key');
        this.resetShortcutsBtn = document.getElementById('resetShortcuts');
        this.clockToggle = document.getElementById('clockToggle');
        this.clockSection = document.querySelector('.clock-section');
        this.fontSelect = document.getElementById('fontSelect');
        this.hideMainContentToggle = document.getElementById('hideMainContentToggle');
        this.mainContent = document.querySelector('.main');
        this.quickSearchToggle = document.getElementById('quickSearchToggle');
        this.showSuggestionsToggle = document.getElementById('showSuggestionsToggle');
        this.spotlightSearchToggle = document.getElementById('spotlightSearchToggle');
        this.showTimestampsToggle = document.getElementById('showTimestampsToggle');
        this.dailyRemindersToggle = document.getElementById('dailyRemindersToggle');
        this.morningReminderToggle = document.getElementById('morningReminderToggle');
        this.eveningReminderToggle = document.getElementById('eveningReminderToggle');
        this.eveningTimeSelect = document.getElementById('eveningTimeSelect');
        this.missedTaskAlertToggle = document.getElementById('missedTaskAlertToggle');
        this.showMissedTabToggle = document.getElementById('showMissedTabToggle');
        this.autoCreateDailyTasksToggle = document.getElementById('autoCreateDailyTasksToggle');
        this.missedTab = document.getElementById('missedTab');
        this.reminderOptions = document.getElementById('reminderOptions');
        this.editPlaceholderBtn = document.getElementById('editPlaceholderBtn');
        this.placeholderModal = document.getElementById('placeholderModal');
        this.placeholderForm = document.getElementById('placeholderForm');
        this.placeholderInput = document.getElementById('placeholderInput');
        this.placeholderCancel = document.getElementById('placeholderCancel');
        this.quickAddContainer = document.querySelector('.quick-add');
        this.nameInput = document.getElementById('nameInput');
        
        // Floating widgets
        this.floatingWidgets = document.getElementById('floatingWidgets');
        this.widgetsList = document.getElementById('widgetsList');
        this.addLinkWidgetBtn = document.getElementById('addLinkWidget');
        this.addNoteWidgetBtn = document.getElementById('addNoteWidget');
        
        // Widget edit modal
        this.widgetEditModal = document.getElementById('widgetEditModal');
        this.widgetEditForm = document.getElementById('widgetEditForm');
        this.widgetEditTitle = document.getElementById('widgetEditTitle');
        this.widgetEditId = document.getElementById('widgetEditId');
        this.widgetEditType = document.getElementById('widgetEditType');
        this.widgetEditName = document.getElementById('widgetEditName');
        this.widgetEditUrl = document.getElementById('widgetEditUrl');
        this.widgetEditContent = document.getElementById('widgetEditContent');
        this.widgetEditColor = document.getElementById('widgetEditColor');
        this.widgetEditEnabled = document.getElementById('widgetEditEnabled');
        this.widgetEditIcon = document.getElementById('widgetEditIcon');
        this.widgetUrlGroup = document.getElementById('widgetUrlGroup');
        this.widgetContentGroup = document.getElementById('widgetContentGroup');
        this.widgetIconGroup = document.getElementById('widgetIconGroup');
        this.iconPicker = document.getElementById('iconPicker');
        this.widgetEditCancel = document.getElementById('widgetEditCancel');
        // Image picker elements
        this.tabIconsBtn = document.getElementById('tabIconsBtn');
        this.tabImageBtn = document.getElementById('tabImageBtn');
        this.iconPickerPanel = document.getElementById('iconPickerPanel');
        this.imagePickerPanel = document.getElementById('imagePickerPanel');
        this.widgetEditImageUrl = document.getElementById('widgetEditImageUrl');
        this.widgetEditImageFile = document.getElementById('widgetEditImageFile');
        this.widgetImagePreview = document.getElementById('widgetImagePreview');
        this.widgetImagePreviewImg = document.getElementById('widgetImagePreviewImg');
        this.widgetImageClear = document.getElementById('widgetImageClear');
        this.widgetImageSizeText = document.getElementById('widgetImageSizeText');
        this.widgetImageSizeHint = document.getElementById('widgetImageSizeHint');
        this._pendingImageData = null; // base64 string for uploaded/compressed image

        
        // Search engine elements
        this.searchEnginesList = document.getElementById('searchEnginesList');
        this.addSearchEngineBtn = document.getElementById('addSearchEngine');
        this.searchEngineModal = document.getElementById('searchEngineModal');
        this.searchEngineForm = document.getElementById('searchEngineForm');
        this.searchEngineTitle = document.getElementById('searchEngineTitle');
        this.searchEngineId = document.getElementById('searchEngineId');
        this.searchEnginePrefix = document.getElementById('searchEnginePrefix');
        this.searchEngineName = document.getElementById('searchEngineName');
        this.searchEngineUrl = document.getElementById('searchEngineUrl');
        this.searchEngineCancel = document.getElementById('searchEngineCancel');
        
        // Confirm modal
        this.confirmModal = document.getElementById('confirmModal');
        this.confirmTitle = document.getElementById('confirmTitle');
        this.confirmMessage = document.getElementById('confirmMessage');
        this.confirmOkBtn = document.getElementById('confirmOk');
        this.confirmCancelBtn = document.getElementById('confirmCancel');
        this.dontAskAgain = document.getElementById('dontAskAgain');
        this.confirmCallback = null;
        this.confirmType = null;

        // Custom Context Menu
        this.widgetContextMenu = document.getElementById('widgetContextMenu');
        this.contextDeleteBtn = document.getElementById('contextDeleteBtn');

        // Condition Board
        this.conditionBoard = document.getElementById('conditionBoard');
        this.conditionBoardHeader = document.getElementById('conditionBoardHeader');
        this.conditionBoardBody = document.getElementById('conditionBoardBody');
        this.conditionBoardEmpty = document.getElementById('conditionBoardEmpty');
        this.conditionBoardTime = document.getElementById('conditionBoardTime');
        this.conditionBoardMinimize = document.getElementById('conditionBoardMinimize');
        this.conditionsList = document.getElementById('conditionsList');
        this.addConditionBtn = document.getElementById('addConditionBtn');
        this.showConditionBoardToggle = document.getElementById('showConditionBoardToggle');
        this.conditionBoardTitleInput = document.getElementById('conditionBoardTitleInput');
        this.conditionBoardTitleText = this.conditionBoardHeader ? this.conditionBoardHeader.querySelector('.condition-board-title span') : null;

        // Condition Edit Modal
        this.conditionEditModal = document.getElementById('conditionEditModal');
        this.conditionEditForm = document.getElementById('conditionEditForm');
        this.conditionEditTitle = document.getElementById('conditionEditTitle');
        this.conditionEditId = document.getElementById('conditionEditId');
        this.conditionEditLabel = document.getElementById('conditionEditLabel');
        this.conditionEditEmoji = document.getElementById('conditionEditEmoji');
        this.conditionEditColor = document.getElementById('conditionEditColor');
        this.conditionEditEnabled = document.getElementById('conditionEditEnabled');
        this.conditionEditStart = document.getElementById('conditionEditStart');
        this.conditionEditEnd = document.getElementById('conditionEditEnd');
        this.conditionEditCancel = document.getElementById('conditionEditCancel');
        this.conditionEditBackdrop = document.getElementById('conditionEditBackdrop');
        this.conditionAllDaysBtn = document.getElementById('conditionAllDaysBtn');
        this.conditionDayCheckboxes = document.querySelectorAll('.condition-days-picker input[type="checkbox"]');
    }

    bindEvents() {
        // Quick add / Quick search with suggestions
        this.quickInput.addEventListener('keydown', (e) => {
            // Handle suggestion navigation
            if (this.searchSuggestions.classList.contains('active')) {
                const suggestions = this.searchSuggestions.querySelectorAll('.search-suggestion');
                
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.selectedSuggestionIndex = Math.min(this.selectedSuggestionIndex + 1, suggestions.length - 1);
                    this.updateSuggestionSelection();
                    return;
                }
                
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    this.selectedSuggestionIndex = Math.max(this.selectedSuggestionIndex - 1, -1);
                    this.updateSuggestionSelection();
                    return;
                }
                
                if (e.key === 'Tab' && suggestions.length > 0) {
                    e.preventDefault();
                    const index = this.selectedSuggestionIndex >= 0 ? this.selectedSuggestionIndex : 0;
                    this.selectSuggestion(suggestions[index]);
                    return;
                }
                
                if (e.key === 'Enter' && this.selectedSuggestionIndex >= 0) {
                    e.preventDefault();
                    this.selectSuggestion(suggestions[this.selectedSuggestionIndex]);
                    return;
                }
                
                if (e.key === 'Escape') {
                    this.hideSuggestions();
                    return;
                }
            }
            
            if (e.key === 'Enter' && this.quickInput.value.trim()) {
                this.hideSuggestions();
                const value = this.quickInput.value.trim();
                
                if (this.settings.quickSearch) {
                    // Check for /url prefix to open URL directly
                    if (value.startsWith('/') && !value.startsWith('//')) {
                        const url = value.slice(1).trim();
                        if (url) {
                            // Add https:// if no protocol specified
                            let finalUrl = url;
                            if (!url.match(/^https?:\/\//i)) {
                                finalUrl = 'https://' + url;
                            }
                            // Validate it looks like a URL
                            if (finalUrl.includes('.') || finalUrl.includes('localhost')) {
                                window.open(finalUrl, '_blank');
                                this.quickInput.value = '';
                                return;
                            }
                        }
                    }
                    
                    // Check for // prefix for Google search
                    if (value.startsWith('//')) {
                        const query = value.slice(2).trim();
                        if (query) {
                            window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
                            this.quickInput.value = '';
                            return;
                        }
                    }
                    
                    // Check for @prefix custom search engines
                    if (value.startsWith('@')) {
                        // Match @prefix with optional query
                        const matchWithQuery = value.match(/^@(\w+)\s+(.+)$/);
                        const matchWithoutQuery = value.match(/^@(\w+)$/);
                        
                        if (matchWithQuery) {
                            const prefix = matchWithQuery[1].toLowerCase();
                            const query = matchWithQuery[2].trim();
                            const engine = this.settings.searchEngines.find(e => e.prefix.toLowerCase() === prefix);
                            if (engine && query) {
                                const url = engine.url.replace('{query}', encodeURIComponent(query));
                                window.open(url, '_blank');
                                this.quickInput.value = '';
                                return;
                            }
                        } else if (matchWithoutQuery) {
                            // Just @prefix - open the base website
                            const prefix = matchWithoutQuery[1].toLowerCase();
                            const engine = this.settings.searchEngines.find(e => e.prefix.toLowerCase() === prefix);
                            if (engine) {
                                try {
                                    const baseUrl = new URL(engine.url).origin;
                                    window.open(baseUrl, '_blank');
                                } catch {
                                    // Fallback: remove {query} and everything after it
                                    const baseUrl = engine.url.split('{query}')[0].replace(/[?&]$/, '');
                                    window.open(baseUrl, '_blank');
                                }
                                this.quickInput.value = '';
                                return;
                            }
                        }
                    }
                }
                
                this.quickAdd();
            }
        });
        
        // Show suggestions on input
        this.quickInput.addEventListener('input', () => this.handleQuickInputChange());
        
        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.quickInput.contains(e.target) && !this.searchSuggestions.contains(e.target)) {
                this.hideSuggestions();
            }
        });
        
        this.expandBtn.addEventListener('click', () => this.openModal());
        
        // Filters
        this.filterTabs.forEach(tab => {
            tab.addEventListener('click', () => this.setStatusFilter(tab.dataset.filter));
        });
        this.priorityFilters.forEach(btn => {
            btn.addEventListener('click', () => this.togglePriorityFilter(btn.dataset.priority));
        });
        this.searchInput.addEventListener('input', (e) => {
            this.filters.search = e.target.value.toLowerCase();
            this.render();
        });
        
        // Clear completed
        this.clearCompletedBtn.addEventListener('click', () => this.clearCompleted());
        
        // Modal
        this.closeModalBtn.addEventListener('click', () => this.closeModal());
        this.cancelBtn.addEventListener('click', () => this.closeModal());
        this.modal.querySelector('.modal-backdrop').addEventListener('click', () => this.closeModal());
        this.taskForm.addEventListener('submit', (e) => this.handleSubmit(e));
        this.priorityBtns.forEach(btn => {
            btn.addEventListener('click', () => this.selectPriority(btn.dataset.priority));
        });
        this.recurrenceBtns.forEach(btn => {
            btn.addEventListener('click', () => this.selectRecurrence(btn.dataset.recur));
        });
        
        // Settings
        this.settingsBtn.addEventListener('click', () => this.toggleSettings());
        this.closeSettingsBtn.addEventListener('click', () => this.closeSettings());
        this.themeToggle.addEventListener('change', () => this.toggleTheme());
        this.clockToggle.addEventListener('change', () => this.toggleClock());
        this.fontSelect.addEventListener('change', (e) => this.changeFont(e.target.value));
        this.quickSearchToggle.addEventListener('change', () => this.toggleQuickSearch());
        this.showSuggestionsToggle.addEventListener('change', () => this.toggleShowSuggestions());
        this.spotlightSearchToggle.addEventListener('change', () => this.toggleSpotlightSearch());
        this.showTimestampsToggle.addEventListener('change', () => this.toggleShowTimestamps());
        this.dailyRemindersToggle.addEventListener('change', () => this.toggleDailyReminders());
        this.morningReminderToggle.addEventListener('change', () => this.toggleMorningReminder());
        this.eveningReminderToggle.addEventListener('change', () => this.toggleEveningReminder());
        this.eveningTimeSelect.addEventListener('change', (e) => this.changeEveningTime(e.target.value));
        this.missedTaskAlertToggle.addEventListener('change', () => this.toggleMissedTaskAlert());
        this.showMissedTabToggle.addEventListener('change', () => this.toggleShowMissedTab());
        if (this.autoCreateDailyTasksToggle) {
            this.autoCreateDailyTasksToggle.addEventListener('change', () => this.toggleAutoCreateDailyTasks());
        }
        this.editPlaceholderBtn.addEventListener('click', () => this.openPlaceholderModal());
        this.placeholderForm.addEventListener('submit', (e) => this.savePlaceholder(e));
        this.placeholderCancel.addEventListener('click', () => this.closePlaceholderModal());
        this.placeholderModal.querySelector('.widget-edit-backdrop').addEventListener('click', () => this.closePlaceholderModal());
        this.nameInput.addEventListener('input', (e) => this.updateName(e.target.value));
        this.colorHigh.addEventListener('input', (e) => this.updateColor('high', e.target.value));
        this.colorMedium.addEventListener('input', (e) => this.updateColor('medium', e.target.value));
        this.colorLow.addEventListener('input', (e) => this.updateColor('low', e.target.value));
        this.clearAllBtn.addEventListener('click', () => this.clearAll());
        
        // Floating widgets
        this.addLinkWidgetBtn.addEventListener('click', () => this.openWidgetModal('link'));
        this.addNoteWidgetBtn.addEventListener('click', () => this.openWidgetModal('note'));
        this.widgetEditForm.addEventListener('submit', (e) => this.saveWidget(e));
        this.widgetEditCancel.addEventListener('click', () => this.closeWidgetModal());
        this.widgetEditModal.querySelector('.widget-edit-backdrop').addEventListener('click', () => this.closeWidgetModal());
        
        // Icon picker
        this.iconPicker.querySelectorAll('.icon-option').forEach(btn => {
            btn.addEventListener('click', () => this.selectIcon(btn.dataset.icon));
        });

        // Icon / Image tab switching
        this.tabIconsBtn.addEventListener('click', () => this.switchIconImageTab('icons'));
        this.tabImageBtn.addEventListener('click', () => this.switchIconImageTab('image'));

        // Image URL live preview
        this.widgetEditImageUrl.addEventListener('input', () => {
            const url = this.widgetEditImageUrl.value.trim();
            this._pendingImageData = null; // clear file upload when URL typed
            if (url) {
                this.widgetImagePreviewImg.src = url;
                this.widgetImagePreview.style.display = 'flex';
            } else {
                this.widgetImagePreview.style.display = 'none';
            }
        });

        // File upload → compress → base64
        this.widgetEditImageFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const originalKB = (file.size / 1024).toFixed(1);
            const reader = new FileReader();
            reader.onload = (ev) => {
                const rawData = ev.target.result;
                // Compress via canvas
                this._compressImage(rawData, 128, 0.80, (compressed) => {
                    this._pendingImageData = compressed;
                    this.widgetEditImageUrl.value = '';
                    this.widgetImagePreviewImg.src = compressed;
                    this.widgetImagePreview.style.display = 'flex';
                    // Show size info
                    const compKB = ((compressed.length * 0.75) / 1024).toFixed(1);
                    this.widgetImageSizeText.textContent = `${originalKB} KB → ${compKB} KB`;
                    const saved = Math.round((1 - compKB / originalKB) * 100);
                    let hint = '', cls = '';
                    if (compKB < 50) { hint = `✓ Good (${saved > 0 ? saved + '% saved' : 'compressed'})`; cls = 'image-size-ok'; }
                    else if (compKB < 150) { hint = `⚠ Moderate (${compKB} KB)`; cls = 'image-size-warn'; }
                    else { hint = `✗ Large – may hit limits`; cls = 'image-size-bad'; }
                    this.widgetImageSizeHint.textContent = hint;
                    this.widgetImageSizeHint.className = cls;
                });
            };
            reader.readAsDataURL(file);
        });

        // Clear image
        this.widgetImageClear.addEventListener('click', () => {
            this._pendingImageData = null;
            this.widgetEditImageUrl.value = '';
            this.widgetEditImageFile.value = '';
            this.widgetImagePreviewImg.src = '';
            this.widgetImagePreview.style.display = 'none';
            this.widgetImageSizeText.textContent = '—';
            this.widgetImageSizeHint.textContent = '';
            this.widgetImageSizeHint.className = '';
        });


        // Search engines
        this.addSearchEngineBtn.addEventListener('click', () => this.openSearchEngineModal());
        this.searchEngineForm.addEventListener('submit', (e) => this.saveSearchEngine(e));
        this.searchEngineCancel.addEventListener('click', () => this.closeSearchEngineModal());
        this.searchEngineModal.querySelector('.widget-edit-backdrop').addEventListener('click', () => this.closeSearchEngineModal());
        
        // Confirm modal
        this.confirmOkBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleConfirmOk();
        });
        this.confirmCancelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.closeConfirm();
        });
        this.confirmModal.querySelector('.confirm-backdrop').addEventListener('click', () => this.closeConfirm());
        
        // Shortcut customization
        this.shortcutKeys.forEach(btn => {
            btn.addEventListener('click', () => this.startRecordingShortcut(btn));
        });
        this.resetShortcutsBtn.addEventListener('click', () => this.resetShortcuts());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Scroll snap to searchbar when scrolling up fast
        this.setupScrollSnap();
        
        // Highlight settings on outside click (like Windows modal)
        document.addEventListener('click', (e) => {
            // Don't shake if a modal is open or clicked
            const modals = [this.widgetEditModal, this.searchEngineModal, this.placeholderModal, this.confirmModal, this.modal, this.conditionEditModal];
            const isModalClick = modals.some(modal => modal && (modal.classList.contains('active') || modal.contains(e.target)));
            
            if (this.settingsPanel.classList.contains('active') && 
                !this.settingsPanel.contains(e.target) && 
                !this.settingsBtn.contains(e.target) &&
                !isModalClick) {
                this.highlightSettings();
            }
        });

        // Condition Board
        this.showConditionBoardToggle.addEventListener('change', () => this.toggleShowConditionBoard());
        this.addConditionBtn.addEventListener('click', () => this.openConditionModal());
        this.conditionEditForm.addEventListener('submit', (e) => this.saveCondition(e));
        this.conditionEditCancel.addEventListener('click', () => this.closeConditionModal());
        this.conditionEditBackdrop.addEventListener('click', () => this.closeConditionModal());
        this.conditionAllDaysBtn.addEventListener('click', () => this.selectAllConditionDays());
        this.conditionBoardMinimize.addEventListener('click', () => this.toggleConditionBoardMinimize());
        this.makeConditionBoardDraggable();
        this.makeConditionBoardResizable();
        this.conditionBoardTitleInput.addEventListener('input', () => this.updateConditionBoardTitle());
        
        if (this.conditionBoard) {
            this._bindContextMenu(this.conditionBoard, { type: 'conditionBoard' });
        }

        // Close custom context menu on outside click or escape
        document.addEventListener('click', () => this.closeContextMenu());
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeContextMenu();
        });

        // Hide Dashboard Toggle
        if (this.hideMainContentToggle) {
            this.hideMainContentToggle.addEventListener('change', () => this.toggleHideMainContent());
        }
    }

    handleKeyboard(e) {
        // Recording a new shortcut
        if (this.recordingShortcut) {
            e.preventDefault();
            const key = e.key.toLowerCase();
            if (key !== 'escape') {
                this.setShortcut(this.recordingShortcut, key);
            }
            this.stopRecordingShortcut();
            return;
        }
        
        // Don't trigger shortcuts when typing
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            if (e.key === 'Escape') {
                e.target.blur();
                this.closeModal();
                this.closeSettings();
            }
            return;
        }
        
        const key = e.key.toLowerCase();
        const shortcuts = this.settings.shortcuts;
        
        // Spacebar to focus quick input (search bar) with optional spotlight mode
        if (e.key === ' ' || e.code === 'Space') {
            e.preventDefault();
            if (this.settings.spotlightSearch) {
                this.enableSpotlightMode();
            }
            this.quickInput.focus();
            return;
        }
        
        if (key === shortcuts.newTask) {
            e.preventDefault();
            this.openModal();
        } else if (key === shortcuts.search) {
            e.preventDefault();
            this.searchInput.focus();
        } else if (key === shortcuts.toggleTheme) {
            e.preventDefault();
            this.themeToggle.checked = !this.themeToggle.checked;
            this.toggleTheme();
        } else if (key === shortcuts.settings) {
            e.preventDefault();
            this.toggleSettings();
        } else if (key === 'escape') {
            this.closeModal();
            this.closeSettings();
        }
    }

    setupScrollSnap() {
        let lastScrollY = window.scrollY;
        let scrollVelocity = 0;
        let lastTime = Date.now();
        let snapTimeout = null;
        
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            const currentTime = Date.now();
            const timeDelta = currentTime - lastTime;
            
            if (timeDelta > 0) {
                scrollVelocity = (lastScrollY - currentScrollY) / timeDelta;
            }
            
            // Get the position where searchbar becomes sticky
            const quickAddTop = this.quickAddContainer.offsetTop;
            
            // Clear any pending snap
            if (snapTimeout) {
                clearTimeout(snapTimeout);
            }
            
            // If scrolling up fast and near the snap zone
            if (scrollVelocity > 0.5 && currentScrollY < quickAddTop && currentScrollY > 0) {
                snapTimeout = setTimeout(() => {
                    // Snap to the searchbar position
                    window.scrollTo({
                        top: quickAddTop - 10,
                        behavior: 'smooth'
                    });
                }, 50);
            }
            
            lastScrollY = currentScrollY;
            lastTime = currentTime;
        }, { passive: true });
    }

    startRecordingShortcut(btn) {
        // Stop any existing recording
        this.stopRecordingShortcut();
        
        this.recordingShortcut = btn.dataset.action;
        btn.classList.add('recording');
        btn.textContent = '...';
    }

    stopRecordingShortcut() {
        if (this.recordingShortcut) {
            this.shortcutKeys.forEach(btn => {
                btn.classList.remove('recording');
                btn.textContent = this.getDisplayKey(this.settings.shortcuts[btn.dataset.action]);
            });
            this.recordingShortcut = null;
        }
    }

    setShortcut(action, key) {
        this.settings.shortcuts[action] = key;
        this.updateShortcutDisplay();
        this.saveSettings();
    }

    resetShortcuts() {
        this.settings.shortcuts = { ...this.defaultShortcuts };
        this.updateShortcutDisplay();
        this.saveSettings();
    }

    updateShortcutDisplay() {
        this.shortcutKeys.forEach(btn => {
            const action = btn.dataset.action;
            btn.textContent = this.getDisplayKey(this.settings.shortcuts[action]);
        });
    }

    getDisplayKey(key) {
        const displayNames = {
            ' ': 'Space',
            'arrowup': '↑',
            'arrowdown': '↓',
            'arrowleft': '←',
            'arrowright': '→',
            'enter': '↵',
            'tab': 'Tab',
            'backspace': '⌫'
        };
        return displayNames[key] || key.toUpperCase();
    }

    async loadData() {
        this.todos = await Storage.loadTodos();
        this.categories = await Storage.loadCategories();
        const settings = await Storage.loadSettings();
        if (settings) {
            this.settings = { 
                ...this.settings, 
                ...settings,
                shortcuts: { ...this.defaultShortcuts, ...(settings.shortcuts || {}) },
                widgets: settings.widgets || [],
                conditions: settings.conditions || [],
                searchEngines: settings.searchEngines || [...this.defaultSearchEngines]
            };
        }
    }

    applySettings() {
        // Theme
        document.documentElement.setAttribute('data-theme', this.settings.theme);
        this.themeToggle.checked = this.settings.theme === 'dark';
        this.updateThemeColor();
        
        // Clock
        this.clockToggle.checked = this.settings.showClock;
        if (this.settings.showClock) {
            this.clockSection.classList.remove('hidden');
        } else {
            this.clockSection.classList.add('hidden');
        }
        
        // Font
        this.fontSelect.value = this.settings.fontFamily || 'Inter';
        this.applyFont();
        
        // Quick Search
        this.quickSearchToggle.checked = this.settings.quickSearch !== false;
        this.showSuggestionsToggle.checked = this.settings.showSuggestions !== false;
        this.spotlightSearchToggle.checked = this.settings.spotlightSearch !== false;
        
        // Timestamps
        this.showTimestampsToggle.checked = this.settings.showTimestamps !== false;
        
        // Daily Reminders
        this.dailyRemindersToggle.checked = this.settings.dailyReminders === true;
        this.morningReminderToggle.checked = this.settings.morningReminder !== false;
        this.eveningReminderToggle.checked = this.settings.eveningReminder !== false;
        this.eveningTimeSelect.value = this.settings.eveningReminderTime || 21;
        this.missedTaskAlertToggle.checked = this.settings.missedTaskAlert !== false;
        this.showMissedTabToggle.checked = this.settings.showMissedTab === true;
        this.autoCreateDailyTasksToggle.checked = this.settings.autoCreateDailyTasks === true;
        this.updateReminderOptionsVisibility();
        this.updateMissedTabVisibility();
        this.setupDailyReminders();
                // Placeholder
        this.quickInput.placeholder = this.settings.placeholder || 'Add task, /url, // to search, @ for quick links...';
        
        // Search Engines
        this.renderSearchEnginesList();
        
        // Name
        this.nameInput.value = this.settings.name || '';

        // Hide Dashboard
        if (this.hideMainContentToggle) {
            this.hideMainContentToggle.checked = this.settings.hideMainContent === true;
        }
        if (this.mainContent) {
            const hideDash = this.settings.hideMainContent === true;
            this.mainContent.classList.toggle('hidden-dashboard', hideDash);
            if (!hideDash) {
                this.mainContent.classList.add('main--ready');
            } else {
                this.mainContent.classList.remove('main--ready');
            }
        }
        
        // Colors
        this.colorHigh.value = this.settings.colors.high;
        this.colorMedium.value = this.settings.colors.medium;
        this.colorLow.value = this.settings.colors.low;
        this.updateCSSColors();
        
        // Floating widgets
        this.renderWidgets();
        this.renderWidgetsList();
        
        // Condition Board
        this.showConditionBoardToggle.checked = this.settings.showConditionBoard !== false;
        if (this.conditionBoardTitleInput) {
            this.conditionBoardTitleInput.value = this.settings.conditionBoardTitle || "Today's Schedule";
        }
        if (this.conditionBoard) {
            const boardColor = this.settings.conditionBoardColor || '#6366f1';
            this.conditionBoard.style.backgroundColor = `color-mix(in srgb, ${boardColor} 10%, var(--bg-card))`;
            this.conditionBoard.style.borderColor = `color-mix(in srgb, ${boardColor} 25%, var(--border))`;
            this.conditionBoard.dataset.textSize = this.settings.conditionBoardFontSize || 'medium';
        }
        this.applyConditionBoardTitle();
        this.applyConditionBoardVisibility();
        this.restoreConditionBoardPosition();
        this.renderConditionBoard();
        this.renderConditionsList();
        if (!this.conditionCheckerInterval) {
            this.startConditionChecker();
        }
        
        // Shortcuts
        this.updateShortcutDisplay();
    }

    applyFont() {
        const font = this.settings.fontFamily || 'Inter';
        const fallback = '-apple-system, BlinkMacSystemFont, sans-serif';
        document.body.style.fontFamily = `'${font}', ${fallback}`;
        
        // Use system fonts to avoid external dependencies
        // Maps custom font names to system font stacks for offline compatibility
        const systemFontMap = {
            'Roboto': '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            'Open Sans': '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            'Lato': '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            'Poppins': '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            'Montserrat': '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            'Nunito': '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            'Quicksand': '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            'Ubuntu': '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            'Fira Sans': '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            'Source Sans Pro': '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            'Merriweather': 'Georgia, serif',
            'Playfair Display': 'Georgia, serif',
            'JetBrains Mono': '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Menlo, monospace',
            'Fira Code': '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Menlo, monospace'
        };
        
        if (systemFontMap[font]) {
            document.body.style.fontFamily = systemFontMap[font];
        }
    }

    updateCSSColors() {
        document.documentElement.style.setProperty('--high', this.settings.colors.high);
        document.documentElement.style.setProperty('--medium', this.settings.colors.medium);
        document.documentElement.style.setProperty('--low', this.settings.colors.low);
    }

    updateGreeting() {
        const hour = new Date().getHours();
        let text = 'Good evening';
        if (hour < 12) text = 'Good morning';
        else if (hour < 18) text = 'Good afternoon';
        
        if (this.settings.name) {
            text += `, ${this.settings.name}`;
        }
        this.greeting.textContent = text;
    }

    // Clock Functions
    startClock() {
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
    }

    updateClock() {
        const now = new Date();
        let hours = now.getHours();
        const mins = now.getMinutes();
        const secs = now.getSeconds();
        const period = hours >= 12 ? 'PM' : 'AM';
        
        // Convert to 12-hour format
        hours = hours % 12 || 12;
        
        const h1 = Math.floor(hours / 10).toString();
        const h2 = (hours % 10).toString();
        const m1 = Math.floor(mins / 10).toString();
        const m2 = (mins % 10).toString();
        const s1 = Math.floor(secs / 10).toString();
        const s2 = (secs % 10).toString();
        
        this.updateDigit(this.hour1, h1, this.lastTime.h1);
        this.updateDigit(this.hour2, h2, this.lastTime.h2);
        this.updateDigit(this.min1, m1, this.lastTime.m1);
        this.updateDigit(this.min2, m2, this.lastTime.m2);
        this.updateDigit(this.sec1, s1, this.lastTime.s1);
        this.updateDigit(this.sec2, s2, this.lastTime.s2);
        
        this.lastTime = { h1, h2, m1, m2, s1, s2 };
        this.clockPeriod.textContent = period;
        
        this.updateDateDisplay();
    }

    updateDigit(el, newVal, oldVal) {
        if (newVal === oldVal) return;
        
        const curr = el.querySelector('.curr');
        const next = el.querySelector('.next');
        
        // Set: curr has old value, next has new value
        next.textContent = newVal;
        
        // Trigger animation
        el.classList.add('flip');
        
        // After animation: swap values and reset
        setTimeout(() => {
            curr.textContent = newVal;
            el.classList.remove('flip');
        }, 350);
    }

    updateDateDisplay() {
        const now = new Date();
        const options = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
        this.dateEn.textContent = now.toLocaleDateString('en-US', options);
    }

    // Settings
    toggleSettings() {
        this.settingsPanel.classList.toggle('active');
    }

    closeSettings() {
        this.settingsPanel.classList.remove('active');
    }

    highlightSettings() {
        this.settingsPanel.classList.remove('shake');
        // Trigger reflow to restart animation
        void this.settingsPanel.offsetWidth;
        this.settingsPanel.classList.add('shake');
        // Remove class after animation ends
        setTimeout(() => {
            this.settingsPanel.classList.remove('shake');
        }, 500);
    }

    toggleTheme() {
        this.settings.theme = this.themeToggle.checked ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.settings.theme);
        this.updateThemeColor();
        this.saveSettings();
    }

    updateThemeColor() {
        const themeColorMeta = document.getElementById('themeColor');
        if (themeColorMeta) {
            themeColorMeta.content = this.settings.theme === 'dark' ? '#1a1a2e' : '#ffffff';
        }
    }

    toggleClock() {
        this.settings.showClock = this.clockToggle.checked;
        if (this.settings.showClock) {
            this.clockSection.classList.remove('hidden');
        } else {
            this.clockSection.classList.add('hidden');
        }
        this.saveSettings();
    }

    changeFont(font) {
        this.settings.fontFamily = font;
        this.applyFont();
        this.saveSettings();
    }

    toggleQuickSearch() {
        this.settings.quickSearch = this.quickSearchToggle.checked;
        this.saveSettings();
    }

    toggleShowSuggestions() {
        this.settings.showSuggestions = this.showSuggestionsToggle.checked;
        this.saveSettings();
    }

    toggleSpotlightSearch() {
        this.settings.spotlightSearch = this.spotlightSearchToggle.checked;
        this.saveSettings();
    }

    enableSpotlightMode() {
        document.body.classList.add('spotlight-mode');
        
        // Add listener to disable spotlight when clicking outside or pressing Escape
        const disableSpotlight = (e) => {
            if (e.type === 'keydown' && e.key !== 'Escape') return;
            if (e.type === 'click' && this.quickInput.contains(e.target)) return;
            if (e.type === 'click' && this.searchSuggestions.contains(e.target)) return;
            
            this.disableSpotlightMode();
            document.removeEventListener('click', disableSpotlight);
            document.removeEventListener('keydown', disableSpotlight);
        };
        
        // Small delay to avoid immediate trigger
        setTimeout(() => {
            document.addEventListener('click', disableSpotlight);
            document.addEventListener('keydown', disableSpotlight);
        }, 100);
        
        // Also disable when input loses focus
        const blurHandler = () => {
            // Small delay to check if focus moved to suggestions
            setTimeout(() => {
                if (!this.quickInput.matches(':focus') && !this.searchSuggestions.matches(':hover')) {
                    this.disableSpotlightMode();
                }
            }, 100);
            this.quickInput.removeEventListener('blur', blurHandler);
        };
        this.quickInput.addEventListener('blur', blurHandler);
    }

    disableSpotlightMode() {
        document.body.classList.remove('spotlight-mode');
    }

    toggleShowTimestamps() {
        this.settings.showTimestamps = this.showTimestampsToggle.checked;
        this.saveSettings();
        this.render();
        this.renderWidgets();
    }

    // ===== Daily Reminders =====
    
    toggleDailyReminders() {
        this.settings.dailyReminders = this.dailyRemindersToggle.checked;
        this.saveSettings();
        this.updateReminderOptionsVisibility();
        
        if (this.settings.dailyReminders) {
            this.requestNotificationPermission();
        }
        
        this.setupDailyReminders();
    }

    toggleMorningReminder() {
        this.settings.morningReminder = this.morningReminderToggle.checked;
        this.saveSettings();
    }

    toggleEveningReminder() {
        this.settings.eveningReminder = this.eveningReminderToggle.checked;
        this.saveSettings();
    }

    changeEveningTime(time) {
        this.settings.eveningReminderTime = parseInt(time);
        this.saveSettings();
    }

    toggleMissedTaskAlert() {
        this.settings.missedTaskAlert = this.missedTaskAlertToggle.checked;
        this.saveSettings();
    }

    toggleShowMissedTab() {
        this.settings.showMissedTab = this.showMissedTabToggle.checked;
        this.saveSettings();
        this.updateMissedTabVisibility();
    }

    toggleAutoCreateDailyTasks() {
        this.settings.autoCreateDailyTasks = this.autoCreateDailyTasksToggle.checked;
        this.saveSettings();
    }

    updateMissedTabVisibility() {
        if (this.missedTab) {
            this.missedTab.style.display = this.settings.showMissedTab ? '' : 'none';
        }
    }

    updateReminderOptionsVisibility() {
        if (this.reminderOptions) {
            this.reminderOptions.classList.toggle('visible', this.settings.dailyReminders);
        }
    }

    async requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            await Notification.requestPermission();
        }
    }

    setupDailyReminders() {
        // Background service worker handles all alarms and notifications now
        // This just requests permission when enabled
        if (!this.settings.dailyReminders) return;
        
        // Request permission if needed
        this.requestNotificationPermission();
    }

    async loadReminderState() {
        try {
            const result = await chrome.storage.local.get(['lastReminderDate', 'lastEveningReminder', 'lastMorningReminder']);
            this.lastReminderDate = result.lastReminderDate || null;
            this.lastEveningReminder = result.lastEveningReminder || null;
            this.lastMorningReminder = result.lastMorningReminder || null;
        } catch (e) {
            console.log('Error loading reminder state:', e);
        }
    }

    async saveReminderState() {
        try {
            await chrome.storage.local.set({
                lastReminderDate: this.lastReminderDate,
                lastEveningReminder: this.lastEveningReminder,
                lastMorningReminder: this.lastMorningReminder
            });
        } catch (e) {
            console.log('Error saving reminder state:', e);
        }
    }

    checkDailyReminders() {
        if (!this.settings.dailyReminders) return;
        
        const now = new Date();
        const today = now.toDateString();
        const hour = now.getHours();
        
        // Check if it's a new day (midnight reset)
        if (this.lastReminderDate && this.lastReminderDate !== today) {
            // New day - handle missed tasks from yesterday
            this.handleMidnightReset();
            this.lastReminderDate = today;
            this.lastEveningReminder = null;
            this.lastMorningReminder = null;
            this.saveReminderState();
        } else if (!this.lastReminderDate) {
            // First load - set the date
            this.lastReminderDate = today;
            this.saveReminderState();
        }
        
        // Morning reminder (6 AM - 10 AM)
        if (this.settings.morningReminder && hour >= 6 && hour <= 10) {
            if (this.lastMorningReminder !== today) {
                this.sendMorningReminder();
                this.lastMorningReminder = today;
                this.saveReminderState();
            }
        }
        
        // Evening reminder - triggers from selected time until midnight
        const eveningTime = this.settings.eveningReminderTime || 21;
        if (this.settings.eveningReminder && hour >= eveningTime) {
            if (this.lastEveningReminder !== today) {
                this.sendEveningReminder();
                this.lastEveningReminder = today;
                this.saveReminderState();
            }
        }
    }

    async checkAndRunMissedReset() {
        // Check if a midnight reset should have happened since last load
        const today = this.toLocalDateString(new Date());
        
        // Get last reset date from storage
        try {
            const result = await new Promise(resolve => {
                chrome.storage.local.get(['lastMidnightReset'], resolve);
            });
            const lastReset = result.lastMidnightReset;
            
            // If last reset was a different day, run the reset now
            if (lastReset !== today) {
                this.handleMidnightReset();
                // Save today as the last reset date
                await new Promise(resolve => {
                    chrome.storage.local.set({ lastMidnightReset: today }, resolve);
                });
            }
        } catch (e) {
            console.error('Error checking missed reset:', e);
        }
    }

    handleMidnightReset() {
        // Calculate yesterday's date
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = this.toLocalDateString(yesterday);
        
        // Find incomplete daily tasks from yesterday only
        const incompleteDailyTasks = this.todos.filter(todo => 
            !todo.completed && 
            todo.recurrence === 'daily' &&
            todo.dueDate === yesterdayStr
        );
        
        // Find tasks that should be marked as fully missed based on overdue period
        const fullyMissedTasks = this.todos.filter(todo => {
            if (todo.completed || todo.missed) return false;
            
            const overdueIntensity = this.getOverdueIntensity(todo);
            return overdueIntensity === 5; // Fully missed after period completes
        });
        
        // Mark tasks as missed
        let hasChanges = false;
        [...incompleteDailyTasks, ...fullyMissedTasks].forEach(task => {
            if (!task.missed) {
                const idx = this.todos.findIndex(t => t.id === task.id);
                if (idx !== -1) {
                    this.todos[idx].missed = true;
                    this.todos[idx].missedDate = this.toLocalDateString(new Date(this.todos[idx].dueDate + 'T00:00:00'));
                    hasChanges = true;
                }
            }
        });
        
        // Create new occurrences for daily tasks (only if enabled)
        if (this.settings.autoCreateDailyTasks) {
            incompleteDailyTasks.forEach(task => {
                this.createNewDailyOccurrence(task);
            });
        }
        
        if (hasChanges) {
            this.save();
            this.render();
        }
        
        // Send missed task notification
        if (this.settings.missedTaskAlert && incompleteDailyTasks.length > 0) {
            this.sendMissedTaskNotification(incompleteDailyTasks);
        }
    }

    createNewDailyOccurrence(oldTask) {
        const today = this.toLocalDateString(new Date());
        
        // Check if a task with the same title and today's date already exists (prevent duplicates)
        const alreadyExists = this.todos.some(todo => 
            todo.title === oldTask.title &&
            todo.dueDate === today &&
            todo.recurrence === 'daily' &&
            !todo.completed
        );
        
        if (alreadyExists) {
            return; // Don't create duplicate
        }
        
        const newTodo = {
            id: Storage.generateId(),
            title: oldTask.title,
            description: oldTask.description || '',
            priority: oldTask.priority,
            category: oldTask.category || '',
            dueDate: today,
            recurrence: 'daily',
            completed: false,
            missed: false, // Explicitly set missed to false for new occurrence
            createdAt: new Date().toISOString()
        };
        
        this.todos.unshift(newTodo);
    }

    createNextOccurrence(taskId) {
        const task = this.todos.find(t => t.id === taskId);
        if (!task || !task.recurrence || task.recurrence === 'none') return;

        // Base the next date off the task's due date so a missed task creates today's instance
        const baseDate = task.dueDate
            ? new Date(`${task.dueDate}T00:00:00`)
            : new Date();

        let nextDate = new Date(baseDate);
        if (task.recurrence === 'daily') {
            nextDate.setDate(baseDate.getDate() + 1);
        } else if (task.recurrence === 'weekly') {
            nextDate.setDate(baseDate.getDate() + 7);
        } else if (task.recurrence === 'monthly') {
            nextDate.setMonth(baseDate.getMonth() + 1);
        }

        const nextDateStr = this.toLocalDateString(nextDate);

        // Check if already exists
        const alreadyExists = this.todos.some(todo => 
            todo.title === task.title &&
            todo.dueDate === nextDateStr &&
            todo.recurrence === task.recurrence &&
            !todo.completed
        );

        if (alreadyExists) {
            this.showToast('Next occurrence already exists');
            return;
        }

        const newTodo = {
            id: Storage.generateId(),
            title: task.title,
            description: task.description || '',
            priority: task.priority,
            category: task.category || '',
            dueDate: nextDateStr,
            recurrence: task.recurrence,
            completed: false,
            missed: false,
            createdAt: new Date().toISOString()
        };

        this.todos.unshift(newTodo);
        this.showToast(`Created next ${task.recurrence} task for ${nextDateStr}`);
        this.saveAndRender();
    }

    sendMorningReminder() {
        if (!('Notification' in window) || Notification.permission !== 'granted') return;
        
        const tasks = this.getTodaysTasks();
        if (tasks.length === 0) return;
        
        const taskNames = tasks.slice(0, 3).map(t => t.title).join(', ');
        const moreText = tasks.length > 3 ? ` and ${tasks.length - 3} more` : '';
        
        this.showNotification(
            '☀️ Good Morning! Tasks for Today',
            `You have ${tasks.length} task${tasks.length > 1 ? 's' : ''} to complete: ${taskNames}${moreText}`,
            'morning-reminder'
        );
    }

    sendEveningReminder() {
        if (!('Notification' in window) || Notification.permission !== 'granted') {
            console.log('Notification permission not granted');
            return;
        }
        
        const tasks = this.getTodaysTasks();
        if (tasks.length === 0) {
            console.log('No tasks for today');
            return;
        }
        
        const taskNames = tasks.slice(0, 3).map(t => t.title).join(', ');
        const moreText = tasks.length > 3 ? ` and ${tasks.length - 3} more` : '';
        
        this.showNotification(
            '🌙 Evening Reminder - Complete Your Tasks!',
            `Don't miss out! ${tasks.length} task${tasks.length > 1 ? 's' : ''} remaining: ${taskNames}${moreText}`,
            'evening-reminder'
        );
    }

    sendMissedTaskNotification(missedTasks) {
        if (!('Notification' in window) || Notification.permission !== 'granted') return;
        
        const taskNames = missedTasks.slice(0, 3).map(t => t.title).join(', ');
        const moreText = missedTasks.length > 3 ? ` and ${missedTasks.length - 3} more` : '';
        
        this.showNotification(
            '😔 Tasks Missed Yesterday',
            `You missed ${missedTasks.length} task${missedTasks.length > 1 ? 's' : ''}: ${taskNames}${moreText}. New tasks created for today!`,
            'missed-tasks'
        );
    }

    getTodaysTasks() {
        const today = this.toLocalDateString(new Date());
        
        // Get all incomplete tasks (for general reminders)
        const allIncompleteTasks = this.todos.filter(todo => !todo.completed);
        
        // Get incomplete daily recurring tasks
        const dailyTasks = this.todos.filter(todo => 
            !todo.completed && 
            todo.recurrence === 'daily'
        );
        
        // Get tasks due today or overdue
        const tasksDueToday = this.todos.filter(todo =>
            !todo.completed &&
            todo.dueDate && todo.dueDate <= today
        );
        
        // For evening reminder, return all incomplete tasks
        // Prioritize daily tasks and due today tasks first
        const priorityTasks = [...new Map([...dailyTasks, ...tasksDueToday].map(t => [t.id, t])).values()];
        
        // If no priority tasks, return all incomplete
        return priorityTasks.length > 0 ? priorityTasks : allIncompleteTasks;
    }

    showNotification(title, body, tag) {
        try {
            const notification = new Notification(title, {
                body: body,
                icon: 'icons/icon128.png',
                tag: tag,
                requireInteraction: false
            });
            
            notification.onclick = () => {
                window.focus();
                notification.close();
            };
            
            // Auto close after 10 seconds
            setTimeout(() => notification.close(), 10000);
        } catch (e) {
            console.log('Notification error:', e);
        }
    }

    showToast(message) {
        // Remove existing toast if any
        const existingToast = document.querySelector('.toast-message');
        if (existingToast) {
            existingToast.remove();
        }
        
        // Create toast element
        const toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('visible');
        });
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    openPlaceholderModal() {
        this.placeholderInput.value = this.settings.placeholder || '';
        this.placeholderModal.classList.add('active');
    }

    closePlaceholderModal() {
        this.placeholderModal.classList.remove('active');
    }

    savePlaceholder(e) {
        e.preventDefault();
        const value = this.placeholderInput.value.trim();
        this.settings.placeholder = value;
        this.quickInput.placeholder = value || 'Add task, /url, // to search, @ for quick links...';
        this.saveSettings();
        this.closePlaceholderModal();
    }

    // ===== Search Suggestions =====
    
    handleQuickInputChange() {
        const value = this.quickInput.value;
        
        if (!this.settings.quickSearch || !this.settings.showSuggestions) {
            this.hideSuggestions();
            return;
        }
        
        if (!this.settings.quickSearch) {
            this.hideSuggestions();
            return;
        }
        
        // Show suggestions for @ prefix
        if (value.startsWith('@')) {
            const typedPrefix = value.slice(1).split(' ')[0].toLowerCase();
            const matchingEngines = this.settings.searchEngines.filter(e => 
                e.prefix.toLowerCase().startsWith(typedPrefix) || 
                e.name.toLowerCase().includes(typedPrefix)
            );
            
            if (matchingEngines.length > 0 || typedPrefix === '') {
                this.showSuggestions(matchingEngines, typedPrefix);
                return;
            }
        }
        
        // Show Google hint for // or direct URL hint for /
        if (value.startsWith('//')) {
            this.showGoogleHint(value.slice(2));
            return;
        }
        
        // Show URL hint for / (but not //)
        if (value.startsWith('/') && !value.startsWith('//')) {
            this.showUrlHint(value.slice(1));
            return;
        }
        
        this.hideSuggestions();
    }
    
    showSuggestions(engines, typedPrefix) {
        this.selectedSuggestionIndex = -1;
        
        let html = '<div class="search-suggestions-header">Quick Search</div>';
        
        engines.forEach((engine, index) => {
            html += `
                <div class="search-suggestion" data-prefix="${engine.prefix}" data-index="${index}">
                    <span class="search-suggestion-prefix">@${engine.prefix}</span>
                    <div class="search-suggestion-info">
                        <span class="search-suggestion-name">${engine.name}</span>
                        <span class="search-suggestion-hint">Type to search or press Enter to open</span>
                    </div>
                </div>
            `;
        });
        
        // Only show Google option when @ is typed alone (no prefix yet)
        if (!typedPrefix) {
            html += `
                <div class="search-suggestion search-suggestion-google" data-prefix="//" data-index="${engines.length}">
                    <span class="search-suggestion-prefix">//</span>
                    <div class="search-suggestion-info">
                        <span class="search-suggestion-name">Google Search</span>
                        <span class="search-suggestion-hint">Type // followed by your query</span>
                    </div>
                </div>
            `;
        }
        
        this.searchSuggestions.innerHTML = html;
        this.searchSuggestions.classList.add('active');
        this.quickAddContainer.classList.add('suggestions-active');
        
        // Bind click events
        this.searchSuggestions.querySelectorAll('.search-suggestion').forEach(el => {
            el.addEventListener('click', () => this.selectSuggestion(el));
        });
    }
    
    showGoogleHint(query) {
        this.selectedSuggestionIndex = -1;
        
        let html = '<div class="search-suggestions-header">Google Search</div>';
        
        html += `
            <div class="search-suggestion search-suggestion-google" data-prefix="//">
                <span class="search-suggestion-prefix">//</span>
                <div class="search-suggestion-info">
                    <span class="search-suggestion-name">${query ? `Search "${query}"` : 'Google Search'}</span>
                    <span class="search-suggestion-hint">${query ? 'Press Enter to search' : 'Type your query after //'}</span>
                </div>
            </div>
        `;
        
        // Also show @ engines as alternatives
        html += '<div class="search-suggestions-header">Or try custom engines</div>';
        this.settings.searchEngines.slice(0, 3).forEach((engine, index) => {
            html += `
                <div class="search-suggestion" data-prefix="${engine.prefix}" data-index="${index}">
                    <span class="search-suggestion-prefix">@${engine.prefix}</span>
                    <div class="search-suggestion-info">
                        <span class="search-suggestion-name">${engine.name}</span>
                        <span class="search-suggestion-hint">@${engine.prefix} your query</span>
                    </div>
                </div>
            `;
        });
        
        this.searchSuggestions.innerHTML = html;
        this.searchSuggestions.classList.add('active');
        this.quickAddContainer.classList.add('suggestions-active');
        
        // Bind click events
        this.searchSuggestions.querySelectorAll('.search-suggestion').forEach(el => {
            el.addEventListener('click', () => this.selectSuggestion(el));
        });
    }
    
    selectSuggestion(el) {
        const prefix = el.dataset.prefix;
        
        if (prefix === '//') {
            this.quickInput.value = '//';
        } else if (prefix === '/') {
            this.quickInput.value = '/';
        } else {
            this.quickInput.value = `@${prefix} `;
        }
        
        this.quickInput.focus();
        this.hideSuggestions();
    }
    
    updateSuggestionSelection() {
        const suggestions = this.searchSuggestions.querySelectorAll('.search-suggestion');
        suggestions.forEach((el, index) => {
            el.classList.toggle('selected', index === this.selectedSuggestionIndex);
        });
        
        // Scroll into view if needed
        if (this.selectedSuggestionIndex >= 0) {
            suggestions[this.selectedSuggestionIndex].scrollIntoView({ block: 'nearest' });
        }
    }
    
    hideSuggestions() {
        this.searchSuggestions.classList.remove('active');
        this.quickAddContainer.classList.remove('suggestions-active');
    }
    
    showUrlHint(url) {
        this.selectedSuggestionIndex = -1;
        
        let displayUrl = url || 'url';
        let fullUrl = url;
        if (url && !url.match(/^https?:\/\//i)) {
            fullUrl = 'https://' + url;
        }
        
        let html = '<div class="search-suggestions-header">Open URL</div>';
        html += `
            <div class="search-suggestion search-suggestion-url" data-prefix="/" data-url="${url}">
                <span class="search-suggestion-prefix">/</span>
                <div class="search-suggestion-info">
                    <span class="search-suggestion-name">${url ? `Open ${displayUrl}` : 'Open URL directly'}</span>
                    <span class="search-suggestion-hint">${url ? 'Press Enter to open' : 'Type URL after / (e.g., /google.com)'}</span>
                </div>
            </div>
        `;
        
        // Also show // Google search as alternative
        html += '<div class="search-suggestions-header">Or search instead</div>';
        html += `
            <div class="search-suggestion search-suggestion-google" data-prefix="//">
                <span class="search-suggestion-prefix">//</span>
                <div class="search-suggestion-info">
                    <span class="search-suggestion-name">Google Search</span>
                    <span class="search-suggestion-hint">Type // followed by your query</span>
                </div>
            </div>
        `;
        
        this.searchSuggestions.innerHTML = html;
        this.searchSuggestions.classList.add('active');
        this.quickAddContainer.classList.add('suggestions-active');
        
        // Bind click events
        this.searchSuggestions.querySelectorAll('.search-suggestion').forEach(el => {
            el.addEventListener('click', () => this.selectSuggestion(el));
        });
        this.selectedSuggestionIndex = -1;
    }

    // ===== Custom Search Engines =====
    
    renderSearchEnginesList() {
        if (!this.settings.searchEngines) {
            this.settings.searchEngines = [...this.defaultSearchEngines];
        }
        
        this.searchEnginesList.innerHTML = this.settings.searchEngines.map(engine => `
            <div class="search-engine-item">
                <span class="search-engine-prefix">@${engine.prefix}</span>
                <span class="search-engine-name">${engine.name}</span>
                <div class="search-engine-actions">
                    <button type="button" class="edit" data-id="${engine.id}" title="Edit">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button type="button" class="delete" data-id="${engine.id}" title="Delete">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');
        
        // Bind edit buttons
        this.searchEnginesList.querySelectorAll('.edit').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                this.openSearchEngineModal(id);
            });
        });
        
        // Bind delete buttons
        this.searchEnginesList.querySelectorAll('.delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                this.deleteSearchEngine(id);
            });
        });
    }

    openSearchEngineModal(id = null) {
        this.editingSearchEngineId = id;
        
        if (id) {
            const engine = this.settings.searchEngines.find(e => e.id === id);
            if (engine) {
                this.searchEngineTitle.textContent = 'Edit Custom Search';
                this.searchEnginePrefix.value = engine.prefix;
                this.searchEngineName.value = engine.name;
                this.searchEngineUrl.value = engine.url;
            }
        } else {
            this.searchEngineTitle.textContent = 'Add Custom Search';
            this.searchEnginePrefix.value = '';
            this.searchEngineName.value = '';
            this.searchEngineUrl.value = '';
        }
        
        this.searchEngineModal.classList.add('active');
    }

    closeSearchEngineModal() {
        this.searchEngineModal.classList.remove('active');
        this.editingSearchEngineId = null;
    }

    saveSearchEngine(e) {
        e.preventDefault();
        
        const prefix = this.searchEnginePrefix.value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        const name = this.searchEngineName.value.trim();
        let url = this.searchEngineUrl.value.trim();
        
        if (!prefix || !name || !url) return;
        
        // Add https if missing
        if (!/^https?:\/\//i.test(url)) {
            url = 'https://' + url;
        }
        
        // Check if {query} placeholder exists
        if (!url.includes('{query}')) {
            url += '{query}';
        }
        
        // Check for duplicate prefix (excluding current when editing)
        const existingWithPrefix = this.settings.searchEngines.find(e => 
            e.prefix.toLowerCase() === prefix && e.id !== this.editingSearchEngineId
        );
        if (existingWithPrefix) {
            alert(`A search engine with prefix @${prefix} already exists.`);
            return;
        }
        
        if (this.editingSearchEngineId) {
            // Update existing
            const index = this.settings.searchEngines.findIndex(e => e.id === this.editingSearchEngineId);
            if (index !== -1) {
                this.settings.searchEngines[index] = {
                    ...this.settings.searchEngines[index],
                    prefix,
                    name,
                    url
                };
            }
        } else {
            // Add new
            this.settings.searchEngines.push({
                id: `custom_${Date.now()}`,
                prefix,
                name,
                url
            });
        }
        
        this.saveSettings();
        this.renderSearchEnginesList();
        this.closeSearchEngineModal();
    }

    deleteSearchEngine(id) {
        const engine = this.settings.searchEngines.find(e => e.id === id);
        if (!engine) return;
        
        this.showConfirm(
            'Delete Search Engine?',
            `Are you sure you want to delete "@${engine.prefix}" (${engine.name})?`,
            () => {
                this.settings.searchEngines = this.settings.searchEngines.filter(e => e.id !== id);
                this.saveSettings();
                this.renderSearchEnginesList();
            }
        );
    }

    updateName(name) {
        this.settings.name = name.trim();
        this.updateGreeting();
        this.saveSettings();
    }

    updateColor(priority, color) {
        this.settings.colors[priority] = color;
        this.updateCSSColors();
        this.saveSettings();
    }

    // ===== Floating Widgets System =====
    
    // Icon SVG definitions
    getIconSVG(iconName) {
        const icons = {
            link: '<path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line>',
            globe: '<circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"></path>',
            star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>',
            heart: '<path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"></path>',
            home: '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>',
            mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline>',
            search: '<circle cx="11" cy="11" r="8"></circle><path d="M21 21l-4.35-4.35"></path>',
            bookmark: '<path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"></path>',
            play: '<polygon points="5 3 19 12 5 21 5 3"></polygon>',
            music: '<path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle>',
            image: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline>',
            camera: '<path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"></path><circle cx="12" cy="13" r="4"></circle>',
            shopping: '<circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"></path>',
            coffee: '<path d="M18 8h1a4 4 0 010 8h-1"></path><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line>',
            code: '<polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline>',
            folder: '<path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"></path>',
            message: '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"></path>',
            zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>',
            calendar: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>',
            user: '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>',
            book: '<path d="M4 19.5A2.5 2.5 0 016.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"></path>',
            'book-open': '<path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"></path><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"></path>',
            graduation: '<path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path>',
            target: '<circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle>',
            lightbulb: '<path d="M9 18h6"></path><path d="M10 22h4"></path><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0018 8 6 6 0 006 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 019 14"></path>',
            brain: '<path d="M9.5 2A2.5 2.5 0 0112 4.5v15a2.5 2.5 0 01-4.96.44 2.5 2.5 0 01-2.96-3.08 3 3 0 01-.34-5.58 2.5 2.5 0 011.32-4.24 2.5 2.5 0 011.98-3A2.5 2.5 0 019.5 2z"></path><path d="M14.5 2A2.5 2.5 0 0012 4.5v15a2.5 2.5 0 004.96.44 2.5 2.5 0 002.96-3.08 3 3 0 00.34-5.58 2.5 2.5 0 00-1.32-4.24 2.5 2.5 0 00-1.98-3A2.5 2.5 0 0014.5 2z"></path>',
            pen: '<path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle>',
            'edit-3': '<path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"></path>',
            clock: '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>',
            award: '<circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>',
            'file-text': '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline>',
            headphones: '<path d="M3 18v-6a9 9 0 0118 0v6"></path><path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z"></path>',
            download: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line>',
            settings: '<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"></path>',
            bell: '<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 01-3.46 0"></path>',
            gift: '<polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"></path>',
            tv: '<rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline>',
            wifi: '<path d="M5 12.55a11 11 0 0114.08 0"></path><path d="M1.42 9a16 16 0 0121.16 0"></path><path d="M8.53 16.11a6 6 0 016.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line>',
            sun: '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>',
            moon: '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"></path>',
            compass: '<circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>',
            map: '<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line>',
            truck: '<rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle>',
            battery: '<rect x="1" y="6" width="18" height="12" rx="2" ry="2"></rect><line x1="23" y1="13" x2="23" y2="11"></line>',
            tool: '<path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"></path>'
        };
        return icons[iconName] || icons.link;
    }
    
    selectIcon(iconName) {
        this.widgetEditIcon.value = iconName;
        this.iconPicker.querySelectorAll('.icon-option').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.icon === iconName);
        });
    }

    switchIconImageTab(tab) {
        const isIcons = tab === 'icons';
        this.tabIconsBtn.classList.toggle('active', isIcons);
        this.tabImageBtn.classList.toggle('active', !isIcons);
        this.iconPickerPanel.style.display = isIcons ? '' : 'none';
        this.imagePickerPanel.style.display = isIcons ? 'none' : '';
    }

    /**
     * Bind both right-click (contextmenu) and long-press touch to open the context menu.
     * @param {HTMLElement} el     - Target element
     * @param {Object}      widget - Widget data object passed to openContextMenu
     */
    _bindContextMenu(el, widget) {
        // Desktop: right-click
        el.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.openContextMenu(e, widget);
        });
        // Mobile: long-press touch
        this._addLongPress(el, (x, y) => {
            // Build a minimal synthetic event with clientX/Y for menu positioning
            const syntheticE = { clientX: x, clientY: y, preventDefault: () => {}, stopPropagation: () => {} };
            this.openContextMenu(syntheticE, widget);
        }, 500);
    }

    /**
     * Attach a long-press listener via touch events.
     * @param {HTMLElement} el      - Target element
     * @param {Function}    cb      - Callback(clientX, clientY) when long press fires
     * @param {number}      delay   - Hold duration in ms (default 500)
     */
    _addLongPress(el, cb, delay = 500) {
        let timer = null;
        let startX = 0, startY = 0;
        const MOVE_THRESHOLD = 8; // px — cancel if user is scrolling

        el.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            timer = setTimeout(() => {
                timer = null;
                cb(touch.clientX, touch.clientY);
            }, delay);
        }, { passive: true });

        const cancel = () => { if (timer) { clearTimeout(timer); timer = null; } };

        el.addEventListener('touchmove', (e) => {
            if (!timer) return;
            const t = e.touches[0];
            if (Math.abs(t.clientX - startX) > MOVE_THRESHOLD ||
                Math.abs(t.clientY - startY) > MOVE_THRESHOLD) {
                cancel();
            }
        }, { passive: true });

        el.addEventListener('touchend',    cancel, { passive: true });
        el.addEventListener('touchcancel', cancel, { passive: true });
    }

    _resetImagePicker() {
        this._pendingImageData = null;
        this.widgetEditImageUrl.value = '';
        if (this.widgetEditImageFile) this.widgetEditImageFile.value = '';
        this.widgetImagePreviewImg.src = '';
        this.widgetImagePreview.style.display = 'none';
        if (this.widgetImageSizeText) this.widgetImageSizeText.textContent = '—';
        if (this.widgetImageSizeHint) { this.widgetImageSizeHint.textContent = ''; this.widgetImageSizeHint.className = ''; }
    }

    /**
     * Compress an image data URL via canvas to JPEG.
     * @param {string} dataUrl  Source image data URL
     * @param {number} maxSize  Max width/height (px) — default 128
     * @param {number} quality  JPEG quality 0–1 — default 0.80
     * @param {Function} cb     Callback(compressedDataUrl)
     */
    _compressImage(dataUrl, maxSize = 128, quality = 0.80, cb) {
        const img = new Image();
        img.onload = () => {
            let { width, height } = img;
            if (width > maxSize || height > maxSize) {
                if (width >= height) {
                    height = Math.round((height / width) * maxSize);
                    width = maxSize;
                } else {
                    width = Math.round((width / height) * maxSize);
                    height = maxSize;
                }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            canvas.getContext('2d').drawImage(img, 0, 0, width, height);
            cb(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => cb(dataUrl); // fallback: use original on failure
        img.src = dataUrl;
    }

    generateWidgetId() {
        return 'widget_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    renderWidgets() {
        this.floatingWidgets.innerHTML = '';
        this.settings.widgets.forEach(widget => {
            const el = this.createWidgetElement(widget);
            this.floatingWidgets.appendChild(el);
        });
    }

    createWidgetElement(widget) {
        const el = document.createElement('div');
        el.className = `floating-widget floating-widget--${widget.type}`;
        el.dataset.widgetId = widget.id;
        
        if (!widget.enabled) {
            el.classList.add('hidden');
        }
        
        // Set position
        if (widget.position) {
            el.style.left = widget.position.x || 'auto';
            el.style.top = widget.position.y || 'auto';
            el.style.right = widget.position.x ? 'auto' : '30px';
            el.style.bottom = widget.position.y ? 'auto' : '80px';
        } else {
            // Default position - stack widgets
            const index = this.settings.widgets.indexOf(widget);
            el.style.right = '30px';
            el.style.bottom = (80 + index * 60) + 'px';
        }

        if (widget.type === 'link') {
            el.dataset.textSize = widget.fontSize || 'medium';

            if (widget.imageUrl) {
                // Image mode: transparent bg + colored ring border
                el.classList.add('has-image');
                el.style.background = 'transparent';
                el.style.boxShadow = 'none';

                const img = document.createElement('img');
                img.className = 'widget-icon-img';
                img.src = widget.imageUrl;
                img.alt = widget.name || '';
                img.style.border = `2.5px solid ${widget.color || 'var(--accent)'}`;
                img.style.boxShadow = `0 4px 15px ${widget.color ? widget.color + '66' : 'rgba(99,102,241,0.4)'}`;

                // Fallback to SVG icon on image load error
                img.addEventListener('error', () => {
                    el.classList.remove('has-image');
                    el.style.background = widget.color || 'var(--accent)';
                    el.style.boxShadow = '';
                    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    svg.setAttribute('viewBox', '0 0 24 24');
                    svg.setAttribute('fill', 'none');
                    svg.setAttribute('stroke', 'currentColor');
                    svg.setAttribute('stroke-width', '2');
                    svg.innerHTML = this.getIconSVG(widget.icon || 'link');
                    img.replaceWith(svg);
                });
                el.appendChild(img);
            } else {
                // Icon mode: colored background
                el.style.background = widget.color || 'var(--accent)';
                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svg.setAttribute('viewBox', '0 0 24 24');
                svg.setAttribute('fill', 'none');
                svg.setAttribute('stroke', 'currentColor');
                svg.setAttribute('stroke-width', '2');
                svg.innerHTML = this.getIconSVG(widget.icon || 'link');
                el.appendChild(svg);
            }

            if (widget.name) {
                const label = document.createElement('span');
                label.className = 'widget-label';
                label.textContent = widget.name;
                el.appendChild(label);
            }


            // Double click to open link
            el.addEventListener('dblclick', () => {
                if (widget.url) {
                    let url = widget.url;
                    // Add https:// if no protocol specified
                    if (!/^https?:\/\//i.test(url)) {
                        url = 'https://' + url;
                    }
                    window.open(url, '_blank');
                }
            });

            // Bind right-click + long-press (mobile) context menu
            this._bindContextMenu(el, widget);

        } else if (widget.type === 'note') {
            // Apply saved size if exists
            if (widget.size && widget.size.w && widget.size.h) {
                el.style.width = widget.size.w;
                el.style.height = widget.size.h;
            }

            // Apply minimized state if active
            if (widget.minimized) {
                el.classList.add('minimized');
                el.style.height = 'auto';
            }

            // Apply color styling tint cleanly
            const noteColor = widget.color || '#f59e0b';
            el.style.backgroundColor = `color-mix(in srgb, ${noteColor} 10%, var(--bg-card))`;
            el.style.borderColor = `color-mix(in srgb, ${noteColor} 25%, var(--border))`;

            // Apply custom text sizing class modifier
            el.dataset.textSize = widget.fontSize || 'medium';

            const timestampStr = this.settings.showTimestamps && widget.createdAt ? this.formatTimestamp(widget.createdAt) : '';
            el.innerHTML = `
                <div class="note-header">
                    <span class="note-color" style="background: ${widget.color || 'var(--medium)'}"></span>
                    <span class="note-title">${this.escapeHTML(widget.name || 'Note')}</span>
                    ${timestampStr ? `<span class="note-timestamp">${timestampStr}</span>` : ''}
                    <button class="note-add-btn" title="Add New Note">
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </button>
                </div>
                <div class="note-content">${widget.content || ''}</div>
            `;
            
            // Make note content editable on double click
            const contentEl = el.querySelector('.note-content');
            contentEl.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                this.makeNoteEditable(el, widget);
            });

            // Make note title editable on double click
            const titleEl = el.querySelector('.note-title');
            titleEl.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                this.makeNoteTitleEditable(el, widget);
            });

            // Bind click to create new sticky note
            const addBtn = el.querySelector('.note-add-btn');
            if (addBtn) {
                addBtn.addEventListener('mousedown', (e) => {
                    e.stopPropagation();
                    e.preventDefault(); // Prevent text input blur from hiding the button before trigger
                    this.createNewStickyNote(widget);
                });
            }

            // Listen to resizer drag completion
            el.addEventListener('mousedown', (e) => {
                const rect = el.getBoundingClientRect();
                // Check bottom-right corner (within 12px)
                const isClickingResizer = (e.clientX >= rect.right - 12) && (e.clientY >= rect.bottom - 12);
                if (isClickingResizer) {
                    const onMouseUp = () => {
                        window.removeEventListener('mouseup', onMouseUp);
                        widget.size = {
                            w: el.style.width,
                            h: el.style.height
                        };
                        this.saveSettings();
                    };
                    window.addEventListener('mouseup', onMouseUp);
                }
            });

            // Bind right-click + long-press (mobile) context menu
            this._bindContextMenu(el, widget);

        }

        // Make draggable
        this.makeWidgetDraggable(el, widget);
        
        return el;
    }

    makeNoteEditable(el, widget) {
        const contentEl = el.querySelector('.note-content');
        if (contentEl.querySelector('textarea')) return;
        
        el.classList.add('editing');
        const textarea = document.createElement('textarea');
        textarea.value = widget.content || '';
        textarea.placeholder = 'Write your note...';
        contentEl.innerHTML = '';
        contentEl.appendChild(textarea);
        textarea.focus();
        
        const save = () => {
            widget.content = textarea.value;
            contentEl.innerHTML = widget.content || '';
            this.saveSettings();
            el.classList.remove('editing');
        };
        
        textarea.addEventListener('blur', save);
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                save();
            }
        });
    }

    makeNoteTitleEditable(el, widget) {
        const titleEl = el.querySelector('.note-title');
        if (titleEl.querySelector('input')) return;

        el.classList.add('editing');
        const input = document.createElement('input');
        input.type = 'text';
        input.value = widget.name || 'Note';
        input.placeholder = 'Note title';
        input.style.width = '100%';
        input.style.fontSize = 'inherit';
        input.style.fontWeight = 'inherit';
        input.style.border = 'none';
        input.style.background = 'transparent';
        input.style.outline = 'none';
        input.style.padding = '0';
        input.style.margin = '0';
        input.style.color = 'inherit';
        input.style.fontFamily = 'inherit';

        titleEl.innerHTML = '';
        titleEl.appendChild(input);
        input.focus();
        input.select();

        const save = () => {
            widget.name = input.value.trim() || 'Note';
            titleEl.innerHTML = this.escapeHTML(widget.name);
            this.saveSettings();
            el.classList.remove('editing');
        };

        input.addEventListener('blur', save);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                save();
            } else if (e.key === 'Escape') {
                input.value = widget.name || 'Note';
                save();
            }
        });
    }

    createNewStickyNote(sourceWidget = null) {
        let position = null;
        if (sourceWidget) {
            const sourceEl = document.querySelector(`.floating-widget[data-widget-id="${sourceWidget.id}"]`);
            if (sourceEl) {
                const rect = sourceEl.getBoundingClientRect();
                const noteWidth = rect.width || 180;
                const noteHeight = rect.height || 100;
                
                // Position it slightly shifted to the right with 20px spacer
                let newX = rect.left + noteWidth + 20;
                let newY = rect.top;
                
                // If it goes out of screen right, place it to the left of the note
                if (newX + noteWidth > window.innerWidth) {
                    newX = rect.left - noteWidth - 20;
                }
                
                // If it goes out of screen left, place it below the note
                if (newX < 0) {
                    newX = rect.left;
                    newY = rect.top + noteHeight + 20;
                }
                
                // Contain it inside screen boundaries with a 10px buffer
                newX = Math.max(10, Math.min(window.innerWidth - noteWidth - 10, newX));
                newY = Math.max(10, Math.min(window.innerHeight - noteHeight - 10, newY));
                
                position = {
                    x: Math.round(newX) + 'px',
                    y: Math.round(newY) + 'px'
                };
            }
        }

        const widgetData = {
            id: this.generateWidgetId(),
            type: 'note',
            name: 'Note',
            content: '',
            color: '#f59e0b',
            enabled: true,
            createdAt: new Date().toISOString(),
            position
        };
        this.settings.widgets.push(widgetData);
        this.saveSettings();
        this.renderWidgets();
    }

    openContextMenu(e, widget) {
        const menu = this.widgetContextMenu;
        if (!menu) return;

        menu.classList.add('active');

        // Reset views to show main view first
        const mainView = menu.querySelector('#contextMainMenu');
        const subView = menu.querySelector('#contextSubMenu');
        if (mainView) mainView.classList.add('active');
        if (subView) subView.classList.remove('active');

        // Prevent offscreen placement
        let x = e.clientX;
        let y = e.clientY;
        const menuWidth = 172; 
        const menuHeight = 220; 

        if (x + menuWidth > window.innerWidth) {
            x = window.innerWidth - menuWidth - 10;
        }
        if (y + menuHeight > window.innerHeight) {
            y = window.innerHeight - menuHeight - 10;
        }

        menu.style.left = x + 'px';
        menu.style.top = y + 'px';

        // Select active color dot
        const dots = menu.querySelectorAll('.color-dot-opt');
        dots.forEach(dot => {
            const color = dot.dataset.color;
            const currentColor = widget.type === 'conditionBoard'
                ? (this.settings.conditionBoardColor || '#6366f1')
                : (widget.color || (widget.type === 'link' ? '#6366f1' : '#f59e0b'));
            dot.classList.toggle('active', currentColor === color);
            
            // Re-bind click listener cleanly
            const newDot = dot.cloneNode(true);
            dot.parentNode.replaceChild(newDot, dot);
            
            newDot.addEventListener('click', (ev) => {
                ev.stopPropagation();
                if (widget.type === 'conditionBoard') {
                    this.settings.conditionBoardColor = color;
                    this.conditionBoard.style.backgroundColor = `color-mix(in srgb, ${color} 10%, var(--bg-card))`;
                    this.conditionBoard.style.borderColor = `color-mix(in srgb, ${color} 25%, var(--border))`;
                } else {
                    widget.color = color;
                    this.renderWidgets();
                }
                this.saveSettings();
                this.closeContextMenu();
            });
        });

        // Setup custom color picker input
        const customColorBtn = menu.querySelector('#customColorBtn');
        const customColorInput = menu.querySelector('#customColorPickerInput');
        if (customColorBtn && customColorInput) {
            customColorInput.value = widget.type === 'conditionBoard'
                ? (this.settings.conditionBoardColor || '#6366f1')
                : (widget.color || (widget.type === 'link' ? '#6366f1' : '#f59e0b'));
            
            // Re-bind triggers
            const newBtn = customColorBtn.cloneNode(true);
            customColorBtn.parentNode.replaceChild(newBtn, customColorBtn);
            
            newBtn.addEventListener('mousedown', (ev) => ev.stopPropagation());
            newBtn.addEventListener('click', (ev) => {
                ev.stopPropagation();
                customColorInput.click();
            });

            // Re-bind color input change
            const newInput = customColorInput.cloneNode(true);
            customColorInput.parentNode.replaceChild(newInput, customColorInput);
            
            newInput.addEventListener('mousedown', (ev) => ev.stopPropagation());
            newInput.addEventListener('change', (ev) => {
                const colorVal = newInput.value;
                if (widget.type === 'conditionBoard') {
                    this.settings.conditionBoardColor = colorVal;
                    this.conditionBoard.style.backgroundColor = `color-mix(in srgb, ${colorVal} 10%, var(--bg-card))`;
                    this.conditionBoard.style.borderColor = `color-mix(in srgb, ${colorVal} 25%, var(--border))`;
                } else {
                    widget.color = colorVal;
                    this.renderWidgets();
                }
                this.saveSettings();
                this.closeContextMenu();
            });
        }

        // Setup text sizing selector buttons
        const currentSize = widget.type === 'conditionBoard'
            ? (this.settings.conditionBoardFontSize || 'medium')
            : (widget.fontSize || 'medium');
            
        const sizeBtns = menu.querySelectorAll('.size-btn-opt');
        sizeBtns.forEach(btn => {
            const size = btn.dataset.size;
            btn.classList.toggle('active', currentSize === size);

            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);

            newBtn.addEventListener('mousedown', (ev) => ev.stopPropagation());
            newBtn.addEventListener('click', (ev) => {
                ev.stopPropagation();
                if (widget.type === 'conditionBoard') {
                    this.settings.conditionBoardFontSize = size;
                    this.conditionBoard.dataset.textSize = size;
                } else {
                    widget.fontSize = size;
                    this.renderWidgets();
                }
                this.saveSettings();
                this.closeContextMenu();
            });
        });

        // ===== Navigation and Submenu options =====
        const moreBtn = menu.querySelector('#contextMoreBtn');
        if (moreBtn && mainView && subView) {
            const newMoreBtn = moreBtn.cloneNode(true);
            moreBtn.parentNode.replaceChild(newMoreBtn, moreBtn);
            
            newMoreBtn.addEventListener('mousedown', (ev) => ev.stopPropagation());
            newMoreBtn.addEventListener('click', (ev) => {
                ev.stopPropagation();
                mainView.classList.remove('active');
                subView.classList.add('active');
            });
        }

        const backBtn = menu.querySelector('#contextBackBtn');
        if (backBtn && mainView && subView) {
            const newBackBtn = backBtn.cloneNode(true);
            backBtn.parentNode.replaceChild(newBackBtn, backBtn);
            
            newBackBtn.addEventListener('mousedown', (ev) => ev.stopPropagation());
            newBackBtn.addEventListener('click', (ev) => {
                ev.stopPropagation();
                subView.classList.remove('active');
                mainView.classList.add('active');
            });
        }

        // Context Edit Widget (Edit Link / Edit Note)
        const editWidgetBtn = menu.querySelector('#contextEditWidgetBtn');
        const editWidgetText = menu.querySelector('#contextEditWidgetText');
        if (editWidgetBtn && editWidgetText) {
            if (widget.type === 'conditionBoard') {
                editWidgetBtn.style.display = 'none';
            } else {
                editWidgetBtn.style.display = 'flex';
                editWidgetText.textContent = widget.type === 'link' ? 'Edit Link Info' : 'Edit Note Content';
                
                const newEditWidgetBtn = editWidgetBtn.cloneNode(true);
                editWidgetBtn.parentNode.replaceChild(newEditWidgetBtn, editWidgetBtn);
                
                newEditWidgetBtn.addEventListener('mousedown', (ev) => ev.stopPropagation());
                newEditWidgetBtn.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    this.closeContextMenu();
                    if (widget.type === 'link') {
                        this.openWidgetModal('link', widget.id);
                    } else {
                        const noteEl = document.querySelector(`.floating-widget[data-widget-id="${widget.id}"]`);
                        if (noteEl) {
                            this.makeNoteEditable(noteEl, widget);
                        }
                    }
                });
            }
        }

        // Rename Board (Condition Board only)
        const renameBoardBtn = menu.querySelector('#contextRenameBoardBtn');
        if (renameBoardBtn) {
            if (widget.type !== 'conditionBoard') {
                renameBoardBtn.style.display = 'none';
            } else {
                renameBoardBtn.style.display = 'flex';
                const newRenameBoardBtn = renameBoardBtn.cloneNode(true);
                renameBoardBtn.parentNode.replaceChild(newRenameBoardBtn, renameBoardBtn);
                
                newRenameBoardBtn.addEventListener('mousedown', (ev) => ev.stopPropagation());
                newRenameBoardBtn.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    this.closeContextMenu();
                    const currentTitle = this.settings.conditionBoardTitle || "Today's Schedule";
                    const newTitle = prompt("Rename Schedule Board:", currentTitle);
                    if (newTitle !== null) {
                        const trimmed = newTitle.trim();
                        this.settings.conditionBoardTitle = trimmed || "Today's Schedule";
                        if (this.conditionBoardTitleInput) {
                            this.conditionBoardTitleInput.value = this.settings.conditionBoardTitle;
                        }
                        this.applyConditionBoardTitle();
                        this.saveSettings();
                    }
                });
            }
        }

        // Manage Conditions (Condition Board only)
        const manageConditionsBtn = menu.querySelector('#contextManageConditionsBtn');
        if (manageConditionsBtn) {
            if (widget.type !== 'conditionBoard') {
                manageConditionsBtn.style.display = 'none';
            } else {
                manageConditionsBtn.style.display = 'flex';
                const newManageConditionsBtn = manageConditionsBtn.cloneNode(true);
                manageConditionsBtn.parentNode.replaceChild(newManageConditionsBtn, manageConditionsBtn);
                
                newManageConditionsBtn.addEventListener('mousedown', (ev) => ev.stopPropagation());
                newManageConditionsBtn.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    this.closeContextMenu();
                    
                    // Open Settings panel
                    this.toggleSettings();
                    
                    // Scroll & Highlight the conditions area inside the settings panel
                    setTimeout(() => {
                        const conditionsSection = document.getElementById('conditionsList');
                        if (conditionsSection) {
                            const parentSection = conditionsSection.closest('.settings-section');
                            if (parentSection) {
                                parentSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                
                                // Temporary highlight animation
                                parentSection.style.transition = 'background-color 0.5s ease';
                                const originalBg = parentSection.style.backgroundColor;
                                parentSection.style.backgroundColor = 'rgba(99, 102, 241, 0.15)'; 
                                setTimeout(() => {
                                    parentSection.style.backgroundColor = originalBg;
                                }, 1500);
                            }
                        }
                    }, 350);
                });
            }
        }

        // Create New Note / Link / Condition
        const createBtn = menu.querySelector('#contextCreateBtn');
        if (createBtn) {
            if (widget.type === 'conditionBoard') {
                createBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Create New Condition
                `;
            } else if (widget.type === 'link') {
                createBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"></path>
                        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"></path>
                    </svg>
                    Create New Link
                `;
            } else {
                createBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Create New Note
                `;
            }

            const newCreateBtn = createBtn.cloneNode(true);
            createBtn.parentNode.replaceChild(newCreateBtn, createBtn);
            
            newCreateBtn.addEventListener('mousedown', (ev) => ev.stopPropagation());
            newCreateBtn.addEventListener('click', (ev) => {
                ev.stopPropagation();
                this.closeContextMenu();
                if (widget.type === 'conditionBoard') {
                    this.openConditionModal();
                } else if (widget.type === 'link') {
                    this.openWidgetModal('link');
                } else {
                    this.createNewStickyNote(widget);
                }
            });
        }

        // Minimize Note Toggle
        const minimizeBtn = menu.querySelector('#contextMinimizeBtn');
        const minimizeText = menu.querySelector('#contextMinimizeText');
        if (minimizeBtn && minimizeText) {
            if (widget.type === 'link') {
                minimizeBtn.style.display = 'none';
            } else {
                minimizeBtn.style.display = 'flex';
                const isMinimized = widget.type === 'conditionBoard' 
                    ? this.conditionBoard.classList.contains('minimized') 
                    : widget.minimized === true;
                
                minimizeText.textContent = isMinimized ? 'Restore Note' : 'Minimize Note';
                if (widget.type === 'conditionBoard') {
                    minimizeText.textContent = isMinimized ? 'Restore Board' : 'Minimize Board';
                }
                
                // Toggle SVG icon
                minimizeBtn.querySelector('svg').innerHTML = isMinimized ? `
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <polyline points="9 21 3 21 3 15"></polyline>
                    <line x1="21" y1="3" x2="14" y2="10"></line>
                    <line x1="3" y1="21" x2="10" y2="14"></line>
                ` : `
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                `;

                const newMinimizeBtn = minimizeBtn.cloneNode(true);
                minimizeBtn.parentNode.replaceChild(newMinimizeBtn, minimizeBtn);
                
                newMinimizeBtn.addEventListener('mousedown', (ev) => ev.stopPropagation());
                newMinimizeBtn.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    if (widget.type === 'conditionBoard') {
                        this.toggleConditionBoardMinimize();
                    } else {
                        widget.minimized = !widget.minimized;
                        const noteEl = document.querySelector(`.floating-widget[data-widget-id="${widget.id}"]`);
                        if (noteEl) {
                            noteEl.classList.toggle('minimized', widget.minimized);
                            if (widget.minimized) {
                                noteEl.style.height = 'auto';
                            } else if (widget.size && widget.size.h) {
                                noteEl.style.height = widget.size.h;
                            }
                        }
                        this.saveSettings();
                    }
                    this.closeContextMenu();
                });
            }
        }

        // Duplicate Note / Link
        const duplicateBtn = menu.querySelector('#contextDuplicateBtn');
        if (duplicateBtn) {
            if (widget.type === 'conditionBoard') {
                duplicateBtn.style.display = 'none';
            } else {
                duplicateBtn.style.display = 'flex';
                const newDuplicateBtn = duplicateBtn.cloneNode(true);
                duplicateBtn.parentNode.replaceChild(newDuplicateBtn, duplicateBtn);
                
                newDuplicateBtn.addEventListener('mousedown', (ev) => ev.stopPropagation());
                newDuplicateBtn.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    this.closeContextMenu();
                    
                    let position = null;
                    const sourceEl = document.querySelector(`.floating-widget[data-widget-id="${widget.id}"]`);
                    if (sourceEl) {
                        const rect = sourceEl.getBoundingClientRect();
                        const noteWidth = rect.width || (widget.type === 'link' ? 50 : 180);
                        const noteHeight = rect.height || (widget.type === 'link' ? 50 : 100);
                        
                        let newX = rect.left + noteWidth + 20;
                        let newY = rect.top;
                        
                        if (newX + noteWidth > window.innerWidth) {
                            newX = rect.left - noteWidth - 20;
                        }
                        if (newX < 0) {
                            newX = rect.left;
                            newY = rect.top + noteHeight + 20;
                        }
                        
                        newX = Math.max(10, Math.min(window.innerWidth - noteWidth - 10, newX));
                        newY = Math.max(10, Math.min(window.innerHeight - noteHeight - 10, newY));
                        
                        position = {
                            x: Math.round(newX) + 'px',
                            y: Math.round(newY) + 'px'
                        };
                    }
                    
                    const duplicateData = {
                        id: this.generateWidgetId(),
                        type: widget.type,
                        name: widget.name || (widget.type === 'link' ? 'Link' : 'Note'),
                        color: widget.color,
                        fontSize: widget.fontSize || 'medium',
                        enabled: true,
                        createdAt: new Date().toISOString(),
                        position,
                        // Link specific:
                        icon: widget.icon || 'link',
                        url: widget.url || '',
                        // Note specific:
                        content: widget.content || '',
                        size: widget.size ? { ...widget.size } : null,
                        minimized: widget.minimized === true
                    };
                    
                    this.settings.widgets.push(duplicateData);
                    this.saveSettings();
                    this.renderWidgets();
                });
            }
        }

        // Delete Note / Link / Hide Board
        const delBtn = menu.querySelector('#contextDeleteBtn');
        if (delBtn) {
            if (widget.type === 'conditionBoard') {
                delBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                        <line x1="12" y1="2" x2="12" y2="12"></line>
                    </svg>
                    Hide Board
                `;
            } else {
                delBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                    </svg>
                    Delete Note
                `;
                if (widget.type === 'link') {
                    delBtn.innerHTML = delBtn.innerHTML.replace('Delete Note', 'Delete Link');
                }
            }

            const newDelBtn = delBtn.cloneNode(true);
            delBtn.parentNode.replaceChild(newDelBtn, delBtn);
            
            newDelBtn.addEventListener('mousedown', (ev) => ev.stopPropagation());
            newDelBtn.addEventListener('click', (ev) => {
                ev.stopPropagation();
                this.closeContextMenu();
                if (widget.type === 'conditionBoard') {
                    this.settings.showConditionBoard = false;
                    this.showConditionBoardToggle.checked = false;
                    this.applyConditionBoardVisibility();
                    this.saveSettings();
                } else {
                    this.deleteWidget(widget.id);
                }
            });
        }
    }

    closeContextMenu() {
        if (this.widgetContextMenu) {
            this.widgetContextMenu.classList.remove('active');
        }
    }

    makeWidgetDraggable(el, widget) {
        let isDragging = false;
        let startX, startY, initialX, initialY;
        
        const dragHandle = widget.type === 'note' ? el.querySelector('.note-header') : el;
        
        const onMouseDown = (e) => {
            if (e.target.tagName === 'TEXTAREA') return;
            
            isDragging = false;
            startX = e.clientX || e.touches?.[0]?.clientX;
            startY = e.clientY || e.touches?.[0]?.clientY;
            
            const rect = el.getBoundingClientRect();
            initialX = rect.left;
            initialY = rect.top;
            
            el.classList.add('dragging');
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
            document.addEventListener('touchmove', onMouseMove);
            document.addEventListener('touchend', onMouseUp);
        };
        
        const onMouseMove = (e) => {
            const currentX = e.clientX || e.touches?.[0]?.clientX;
            const currentY = e.clientY || e.touches?.[0]?.clientY;
            
            const deltaX = Math.abs(currentX - startX);
            const deltaY = Math.abs(currentY - startY);
            
            if (deltaX > 5 || deltaY > 5) {
                isDragging = true;
            }
            
            if (isDragging) {
                let newX = initialX + (currentX - startX);
                let newY = initialY + (currentY - startY);
                
                // Keep within bounds
                const elWidth = el.offsetWidth;
                const elHeight = el.offsetHeight;
                newX = Math.max(0, Math.min(window.innerWidth - elWidth, newX));
                newY = Math.max(0, Math.min(window.innerHeight - elHeight, newY));
                
                el.style.left = newX + 'px';
                el.style.top = newY + 'px';
                el.style.right = 'auto';
                el.style.bottom = 'auto';
            }
        };
        
        const onMouseUp = () => {
            el.classList.remove('dragging');
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            document.removeEventListener('touchmove', onMouseMove);
            document.removeEventListener('touchend', onMouseUp);
            
            if (isDragging) {
                widget.position = {
                    x: el.style.left,
                    y: el.style.top
                };
                this.saveSettings();
            }
        };
        
        dragHandle.addEventListener('mousedown', onMouseDown);
        dragHandle.addEventListener('touchstart', onMouseDown);
    }

    renderWidgetsList() {
        if (this.settings.widgets.length === 0) {
            this.widgetsList.innerHTML = '<div class="widgets-empty">No widgets yet. Add a link or note!</div>';
            return;
        }
        
        this.widgetsList.innerHTML = this.settings.widgets.map(widget => `
            <div class="widget-item" data-widget-id="${widget.id}" data-widget-type="${widget.type}">
                <div class="widget-item-icon widget-item-icon--${widget.type}" style="background: ${widget.color || (widget.type === 'link' ? 'var(--accent)' : 'var(--medium)')}">
                    ${widget.type === 'link' ? `
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"></path>
                            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"></path>
                        </svg>
                    ` : `
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                        </svg>
                    `}
                </div>
                <div class="widget-item-info">
                    <div class="widget-item-name">${widget.name || (widget.type === 'link' ? 'Untitled Link' : 'Untitled Note')}</div>
                    <div class="widget-item-type">${widget.type === 'link' ? 'Quick Link' : 'Sticky Note'} • ${widget.enabled ? 'Enabled' : 'Disabled'}</div>
                </div>
                <div class="widget-item-actions">
                    <button class="widget-edit-btn" data-widget-id="${widget.id}" data-widget-type="${widget.type}" title="Edit">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="widget-delete-btn delete" data-widget-id="${widget.id}" title="Delete">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');
        
        // Attach event listeners (CSP compliant - no inline handlers)
        this.widgetsList.querySelectorAll('.widget-edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.widgetId;
                const type = btn.dataset.widgetType;
                this.openWidgetModal(type, id);
            });
        });
        
        this.widgetsList.querySelectorAll('.widget-delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.widgetId;
                this.deleteWidget(id);
            });
        });
    }

    openWidgetModal(type, id = null) {
        this.editingWidgetId = id;
        const isNew = !id;
        
        // Set title
        this.widgetEditTitle.textContent = isNew 
            ? (type === 'link' ? 'Add Quick Link' : 'Add Sticky Note')
            : (type === 'link' ? 'Edit Quick Link' : 'Edit Sticky Note');
        
        // Show/hide relevant fields
        this.widgetUrlGroup.style.display = type === 'link' ? 'block' : 'none';
        this.widgetIconGroup.style.display = type === 'link' ? 'block' : 'none';
        this.widgetContentGroup.style.display = type === 'note' ? 'block' : 'none';
        
        // Set form values
        if (id) {
            const widget = this.settings.widgets.find(w => w.id === id);
            if (widget) {
                this.widgetEditType.value = widget.type;
                this.widgetEditName.value = widget.name || '';
                this.widgetEditUrl.value = widget.url || '';
                this.widgetEditContent.value = widget.content || '';
                this.widgetEditColor.value = widget.color || (type === 'link' ? '#6366f1' : '#f59e0b');
                this.widgetEditEnabled.value = widget.enabled !== false ? 'true' : 'false';
                this.selectIcon(widget.icon || 'link');
                // Restore image state
                if (widget.imageUrl) {
                    this._pendingImageData = null;
                    this.widgetEditImageUrl.value = widget.imageUrl.startsWith('data:') ? '' : widget.imageUrl;
                    if (widget.imageUrl.startsWith('data:')) this._pendingImageData = widget.imageUrl;
                    this.widgetImagePreviewImg.src = widget.imageUrl;
                    this.widgetImagePreview.style.display = 'flex';
                    this.switchIconImageTab('image');
                } else {
                    this._resetImagePicker();
                    this.switchIconImageTab('icons');
                }
            }
        } else {
            this.widgetEditType.value = type;
            this.widgetEditName.value = '';
            this.widgetEditUrl.value = '';
            this.widgetEditContent.value = '';
            this.widgetEditColor.value = type === 'link' ? '#6366f1' : '#f59e0b';
            this.widgetEditEnabled.value = 'true';
            this.selectIcon('link');
            this._resetImagePicker();
            this.switchIconImageTab('icons');
        }
        
        this.widgetEditModal.classList.add('active');
    }

    closeWidgetModal() {
        this.widgetEditModal.classList.remove('active');
        this.editingWidgetId = null;
    }

    saveWidget(e) {
        e.preventDefault();
        
        const type = this.widgetEditType.value;
        // Determine final imageUrl: file upload takes priority, then URL field
        let imageUrl = '';
        if (type === 'link') {
            if (this._pendingImageData) {
                imageUrl = this._pendingImageData;
            } else {
                imageUrl = this.widgetEditImageUrl.value.trim();
            }
        }
        const widgetData = {
            type,
            name: this.widgetEditName.value.trim(),
            url: type === 'link' ? this.widgetEditUrl.value.trim() : '',
            content: type === 'note' ? this.widgetEditContent.value : '',
            color: this.widgetEditColor.value,
            enabled: this.widgetEditEnabled.value === 'true',
            icon: type === 'link' ? this.widgetEditIcon.value : '',
            imageUrl
        };
        
        if (this.editingWidgetId) {
            // Update existing widget
            const index = this.settings.widgets.findIndex(w => w.id === this.editingWidgetId);
            if (index !== -1) {
                this.settings.widgets[index] = { 
                    ...this.settings.widgets[index], 
                    ...widgetData 
                };
            }
        } else {
            // Create new widget
            widgetData.id = this.generateWidgetId();
            widgetData.position = null;
            widgetData.createdAt = new Date().toISOString();
            this.settings.widgets.push(widgetData);
        }
        
        this.saveSettings();
        this.renderWidgets();
        this.renderWidgetsList();
        this.closeWidgetModal();
    }

    deleteWidget(id) {
        const widget = this.settings.widgets.find(w => w.id === id);
        const name = widget?.name || (widget?.type === 'link' ? 'this link' : 'this note');
        
        this.showConfirm(
            'Delete Widget?',
            `Are you sure you want to delete "${name}"? This cannot be undone.`,
            () => {
                this.settings.widgets = this.settings.widgets.filter(w => w.id !== id);
                this.saveSettings();
                this.renderWidgets();
                this.renderWidgetsList();
            }
        );
    }

    // ===== Condition Board =====

    startConditionChecker() {
        this.renderConditionBoard();
        this.conditionCheckerInterval = setInterval(() => {
            this.renderConditionBoard();
        }, 30000); // Check every 30 seconds
    }

    isConditionActive(cond) {
        if (!cond || !cond.enabled || !cond.startTime) return false;
        const now = new Date();
        const dayMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        const todayKey = dayMap[now.getDay()];
        const days = cond.days || ['all'];
        if (!days.includes('all') && !days.includes(todayKey)) return false;

        const hh = now.getHours();
        const mm = now.getMinutes();
        const nowMins = hh * 60 + mm;

        const [startH, startM] = cond.startTime.split(':').map(Number);
        const startMins = startH * 60 + startM;

        if (cond.endTime) {
            const [endH, endM] = cond.endTime.split(':').map(Number);
            const endMins = endH * 60 + endM;
            return nowMins >= startMins && nowMins < endMins;
        }
        // No end time: active for 30 min window
        return nowMins >= startMins && nowMins < startMins + 30;
    }

    isConditionPast(cond) {
        if (!cond || !cond.startTime) return false;
        const now = new Date();
        const hh = now.getHours();
        const mm = now.getMinutes();
        const nowMins = hh * 60 + mm;

        const [startH, startM] = cond.startTime.split(':').map(Number);
        const startMins = startH * 60 + startM;

        if (cond.endTime) {
            const [endH, endM] = cond.endTime.split(':').map(Number);
            const endMins = endH * 60 + endM;
            return nowMins >= endMins;
        }
        return nowMins >= startMins + 30;
    }

    getConditionCountdown(cond) {
        if (!cond || !cond.startTime) return '';
        const now = new Date();
        const hh = now.getHours();
        const mm = now.getMinutes();
        const nowMins = hh * 60 + mm;

        const [startH, startM] = cond.startTime.split(':').map(Number);
        const startMins = startH * 60 + startM;

        let diffMins = startMins - nowMins;
        if (diffMins < 0) diffMins += 24 * 60; // wrap around midnight

        if (diffMins === 0) return 'Now';
        if (diffMins < 60) return `in ${diffMins}m`;
        const hrs = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        return mins > 0 ? `in ${hrs}h ${mins}m` : `in ${hrs}h`;
    }

    formatConditionTime(cond) {
        if (!cond || !cond.startTime) return '';
        const fmt = (t) => {
            const [h, m] = t.split(':').map(Number);
            const period = h >= 12 ? 'PM' : 'AM';
            const h12 = h % 12 || 12;
            return `${h12}:${String(m).padStart(2,'0')} ${period}`;
        };
        if (cond.endTime) {
            return `${fmt(cond.startTime)} – ${fmt(cond.endTime)}`;
        }
        return fmt(cond.startTime);
    }

    renderConditionBoard() {
        if (!this.conditionBoard) return;

        // Update clock in header
        if (this.conditionBoardTime) {
            const now = new Date();
            let h = now.getHours();
            const m = String(now.getMinutes()).padStart(2, '0');
            const period = h >= 12 ? 'PM' : 'AM';
            h = h % 12 || 12;
            this.conditionBoardTime.textContent = `${h}:${m} ${period}`;
        }

        const conditions = (this.settings.conditions || []).filter(c => c && c.enabled !== false && c.startTime);

        // Render active conditions only
        const active = conditions.filter(c => this.isConditionActive(c));

        // Show/hide empty state
        const isEmpty = active.length === 0;
        this.conditionBoardEmpty.style.display = isEmpty ? '' : 'none';
        this.conditionBoardBody.style.display = isEmpty ? 'none' : '';

        if (!isEmpty) {
            this.conditionBoardBody.innerHTML = active.map(cond => {
                const timeLabel = this.formatConditionTime(cond);
                const hasEmoji = cond.emoji && cond.emoji !== '📌';

                const badgeContent = hasEmoji ? `
                    <span class="condition-card-emoji">${cond.emoji}</span>
                ` : `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="condition-card-svg" style="width: 14px; height: 14px;">
                        <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3"></circle>
                        <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2"></circle>
                        <path d="M12 9v3h3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                `;

                return `
                    <div class="condition-card-wrapper" style="--card-color: ${cond.color || 'var(--accent)'}">
                        <div class="condition-card-badge">
                            ${badgeContent}
                        </div>
                        <div class="condition-card-info">
                            <span class="condition-card-label">${this.escapeHTML(cond.label)}</span>
                            <span class="condition-card-time">${this.escapeHTML(timeLabel)}</span>
                        </div>
                        <div class="condition-card-pulse">
                            <span class="condition-card-dot"></span>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    applyConditionBoardTitle() {
        if (this.conditionBoardTitleText) {
            this.conditionBoardTitleText.textContent = this.settings.conditionBoardTitle || "Today's Schedule";
        }
    }

    updateConditionBoardTitle() {
        this.settings.conditionBoardTitle = this.conditionBoardTitleInput.value.trim() || "Today's Schedule";
        this.applyConditionBoardTitle();
        this.saveSettings();
    }

    applyConditionBoardVisibility() {
        if (!this.conditionBoard) return;
        const show = this.settings.showConditionBoard !== false;
        this.conditionBoard.classList.toggle('hidden', !show);
    }

    toggleShowConditionBoard() {
        this.settings.showConditionBoard = this.showConditionBoardToggle.checked;
        this.applyConditionBoardVisibility();
        this.saveSettings();
    }

    toggleHideMainContent() {
        this.settings.hideMainContent = this.hideMainContentToggle.checked;
        this.saveSettings();
        if (this.mainContent) {
            const hideDash = this.settings.hideMainContent === true;
            this.mainContent.classList.toggle('hidden-dashboard', hideDash);
            if (!hideDash) {
                this.mainContent.classList.add('main--ready');
            } else {
                this.mainContent.classList.remove('main--ready');
            }
        }
    }

    toggleConditionBoardMinimize() {
        this.conditionBoard.classList.toggle('minimized');
        // Save minimized state
        const isMinimized = this.conditionBoard.classList.contains('minimized');
        this.settings.conditionBoardMinimized = isMinimized;
        this.saveSettings();

        if (isMinimized) {
            this.conditionBoard.style.height = '';
        } else {
            const size = this.settings.conditionBoardSize;
            if (size && size.h) {
                this.conditionBoard.style.height = size.h;
            }
        }
    }

    restoreConditionBoardPosition() {
        const el = this.conditionBoard;
        if (!el) return;

        // Apply no-transition to prevent collapse/resize animation on page load
        el.classList.add('no-transition');

        const pos = this.settings.conditionBoardPosition;
        if (pos && pos.x && pos.y) {
            el.style.left = pos.x;
            el.style.top = pos.y;
            el.style.right = 'auto';
        }
        
        const isMinimized = this.settings.conditionBoardMinimized;
        if (isMinimized) {
            el.classList.add('minimized');
            el.style.height = '';
        } else {
            el.classList.remove('minimized');
            const size = this.settings.conditionBoardSize;
            if (size && size.w && size.h) {
                el.style.width = size.w;
                el.style.height = size.h;
            }
        }
        el.classList.add('condition-board--ready');

        // Force a layout repaint to apply positions instantly
        void el.offsetHeight;

        // Remove no-transition so future user-triggered minimize/maximize actions animate normally
        setTimeout(() => {
            el.classList.remove('no-transition');
        }, 50);
    }

    makeConditionBoardDraggable() {
        const el = this.conditionBoard;
        const handle = this.conditionBoardHeader;
        let isDragging = false;
        let startX, startY, initialX, initialY;

        const onMouseDown = (e) => {
            if (e.target === this.conditionBoardMinimize || this.conditionBoardMinimize.contains(e.target)) return;
            // Prevent dragging from resizer handle click
            if (e.offsetX > el.clientWidth - 16 && e.offsetY > el.clientHeight - 16) return;

            isDragging = false;
            startX = e.clientX;
            startY = e.clientY;
            const rect = el.getBoundingClientRect();
            initialX = rect.left;
            initialY = rect.top;

            el.classList.add('dragging');
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };

        const onMouseMove = (e) => {
            const deltaX = Math.abs(e.clientX - startX);
            const deltaY = Math.abs(e.clientY - startY);
            if (deltaX > 4 || deltaY > 4) isDragging = true;

            if (isDragging) {
                let newX = initialX + (e.clientX - startX);
                let newY = initialY + (e.clientY - startY);
                newX = Math.max(0, Math.min(window.innerWidth - el.offsetWidth, newX));
                newY = Math.max(0, Math.min(window.innerHeight - el.offsetHeight, newY));
                el.style.left = newX + 'px';
                el.style.top = newY + 'px';
                el.style.right = 'auto';
            }
        };

        const onMouseUp = () => {
            el.classList.remove('dragging');
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);

            if (isDragging) {
                this.settings.conditionBoardPosition = {
                    x: el.style.left,
                    y: el.style.top
                };
                this.saveSettings();
            }
        };

        handle.addEventListener('mousedown', onMouseDown);
    }

    makeConditionBoardResizable() {
        const el = this.conditionBoard;
        if (!el) return;

        el.addEventListener('mousedown', (e) => {
            if (el.classList.contains('minimized')) return;

            const rect = el.getBoundingClientRect();
            // Check if the click is in the bottom-right corner (within 16px of right/bottom borders)
            const isClickingResizer = (e.clientX >= rect.right - 16) && (e.clientY >= rect.bottom - 16);
            
            if (isClickingResizer) {
                const onMouseUp = () => {
                    window.removeEventListener('mouseup', onMouseUp);
                    
                    // Save size metrics
                    this.settings.conditionBoardSize = {
                        w: el.style.width,
                        h: el.style.height
                    };
                    this.saveSettings();
                };
                window.addEventListener('mouseup', onMouseUp);
            }
        });
    }

    // Condition CRUD

    openConditionModal(id = null) {
        this.editingConditionId = id;
        const isNew = !id;

        this.conditionEditTitle.textContent = isNew ? 'Add Condition' : 'Edit Condition';

        if (id) {
            const cond = this.settings.conditions.find(c => c.id === id);
            if (cond) {
                this.conditionEditLabel.value = cond.label || '';
                this.conditionEditEmoji.value = cond.emoji || '';
                this.conditionEditColor.value = cond.color || '#6366f1';
                this.conditionEditEnabled.value = cond.enabled !== false ? 'true' : 'false';
                this.conditionEditStart.value = cond.startTime || '';
                this.conditionEditEnd.value = cond.endTime || '';
                // Set day checkboxes
                const days = cond.days || ['all'];
                this.conditionDayCheckboxes.forEach(cb => {
                    cb.checked = days.includes('all') || days.includes(cb.value);
                });
            }
        } else {
            this.conditionEditLabel.value = '';
            this.conditionEditEmoji.value = '';
            this.conditionEditColor.value = '#6366f1';
            this.conditionEditEnabled.value = 'true';
            this.conditionEditStart.value = '';
            this.conditionEditEnd.value = '';
            // Default: all days checked
            this.conditionDayCheckboxes.forEach(cb => { cb.checked = true; });
        }

        this.conditionEditModal.classList.add('active');
        this.conditionEditLabel.focus();
    }

    closeConditionModal() {
        this.conditionEditModal.classList.remove('active');
        this.editingConditionId = null;
    }

    selectAllConditionDays() {
        this.conditionDayCheckboxes.forEach(cb => { cb.checked = true; });
    }

    saveCondition(e) {
        e.preventDefault();

        const label = this.conditionEditLabel.value.trim();
        const startTime = this.conditionEditStart.value;
        if (!label || !startTime) return;

        const selectedDays = Array.from(this.conditionDayCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);

        // If all 7 days selected, store as ['all']
        const days = selectedDays.length === 7 ? ['all'] : (selectedDays.length > 0 ? selectedDays : ['all']);

        const condData = {
            label,
            emoji: this.conditionEditEmoji.value.trim() === '📌' ? '' : this.conditionEditEmoji.value.trim(),
            color: this.conditionEditColor.value,
            enabled: this.conditionEditEnabled.value === 'true',
            startTime,
            endTime: this.conditionEditEnd.value || null,
            days
        };

        if (this.editingConditionId) {
            const idx = this.settings.conditions.findIndex(c => c.id === this.editingConditionId);
            if (idx !== -1) {
                this.settings.conditions[idx] = { ...this.settings.conditions[idx], ...condData };
            }
        } else {
            condData.id = 'cond_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
            condData.createdAt = new Date().toISOString();
            this.settings.conditions.push(condData);
        }

        this.saveSettings();
        this.renderConditionBoard();
        this.renderConditionsList();
        this.closeConditionModal();
    }

    deleteCondition(id) {
        const cond = this.settings.conditions.find(c => c.id === id);
        const name = cond?.label || 'this condition';

        this.showConfirm(
            'Delete Condition?',
            `Are you sure you want to delete "${name}"?`,
            () => {
                this.settings.conditions = this.settings.conditions.filter(c => c.id !== id);
                this.saveSettings();
                this.renderConditionBoard();
                this.renderConditionsList();
            }
        );
    }

    renderConditionsList() {
        if (!this.conditionsList) return;

        const conditions = this.settings.conditions || [];

        if (conditions.length === 0) {
            this.conditionsList.innerHTML = '<div class="conditions-empty">No conditions yet.</div>';
            return;
        }

        this.conditionsList.innerHTML = conditions.map(cond => {
            const timeStr = this.formatConditionTime(cond);
            const daysStr = (cond.days || ['all']).includes('all') ? 'Every day' : (cond.days || []).join(', ');
            const hasEmoji = cond.emoji && cond.emoji !== '📌';

            const iconContent = hasEmoji ? `
                <span class="condition-item-emoji">${cond.emoji}</span>
            ` : `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="condition-item-svg" style="width: 13px; height: 13px; color: ${cond.color || 'var(--accent)'}; flex-shrink: 0; display: inline-block;">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3"></circle>
                    <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2"></circle>
                    <path d="M12 9v3h3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
            `;

            return `
                <div class="condition-item ${!cond.enabled ? 'condition-item-disabled' : ''}" data-cond-id="${cond.id}">
                    <span class="condition-item-color" style="background: ${cond.color || '#6366f1'}"></span>
                    ${iconContent}
                    <div class="condition-item-info">
                        <div class="condition-item-label">${this.escapeHTML(cond.label)}</div>
                        <div class="condition-item-time">${timeStr} · ${daysStr}</div>
                    </div>
                    <div class="condition-item-actions">
                        <button class="edit" data-cond-id="${cond.id}" title="Edit">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="delete" data-cond-id="${cond.id}" title="Delete">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Bind events
        this.conditionsList.querySelectorAll('.edit').forEach(btn => {
            btn.addEventListener('click', () => this.openConditionModal(btn.dataset.condId));
        });
        this.conditionsList.querySelectorAll('.delete').forEach(btn => {
            btn.addEventListener('click', () => this.deleteCondition(btn.dataset.condId));
        });
    }

    showConfirm(title, message, onConfirm, type = 'default') {
        this.confirmTitle.textContent = title;
        this.confirmMessage.textContent = message;
        this.confirmCallback = onConfirm;
        this.confirmType = type;
        
        // Show "Don't ask again" only for delete confirmations
        if (this.dontAskAgain) {
            const dontAskContainer = this.dontAskAgain.parentElement;
            if (dontAskContainer) {
                dontAskContainer.style.display = type === 'delete' ? 'flex' : 'none';
            }
            this.dontAskAgain.checked = false;
        }
        
        this.confirmModal.classList.add('active');
    }

    closeConfirm() {
        this.confirmModal.classList.remove('active');
        this.confirmCallback = null;
    }

    handleConfirmOk() {
        // Save "Don't ask again" preference for delete confirmations
        if (this.confirmType === 'delete' && this.dontAskAgain?.checked) {
            this.settings.skipDeleteConfirm = true;
            this.saveSettings();
        }
        
        if (this.confirmCallback) {
            this.confirmCallback();
        }
        this.closeConfirm();
    }

    saveSettings() {
        this.isSaving = true;
        Storage.saveSettings(this.settings);
        setTimeout(() => {
            this.isSaving = false;
        }, 100);
    }

    // Filters
    setStatusFilter(filter) {
        this.filters.status = filter;
        this.filterTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.filter === filter);
        });
        this.render();
    }

    togglePriorityFilter(priority) {
        const btn = document.querySelector(`[data-priority="${priority}"]`);
        if (this.filters.priority === priority) {
            this.filters.priority = null;
            btn.classList.remove('active');
        } else {
            this.priorityFilters.forEach(b => b.classList.remove('active'));
            this.filters.priority = priority;
            btn.classList.add('active');
        }
        this.render();
    }

    // Modal
    openModal(id = null) {
        this.editingId = id;
        this.taskForm.reset();
        this.selectPriority('medium');
        this.selectRecurrence('none');
        
        if (id) {
            const todo = this.todos.find(t => String(t.id) === String(id));
            if (todo) {
                this.modalTitle.textContent = 'Edit Task';
                this.saveBtn.textContent = 'Save';
                this.taskTitle.value = todo.title;
                this.taskDesc.value = todo.description || '';
                this.taskDue.value = todo.dueDate || '';
                this.taskCategory.value = todo.category || '';
                this.selectPriority(todo.priority);
                this.selectRecurrence(todo.recurrence || 'none');
            }
        } else {
            this.modalTitle.textContent = 'New Task';
            this.saveBtn.textContent = 'Add';
        }
        
        this.updateCategoriesDatalist();
        this.modal.classList.add('active');
        this.taskTitle.focus();
    }

    closeModal() {
        this.modal.classList.remove('active');
        this.editingId = null;
    }

    selectPriority(priority) {
        this.priorityBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.priority === priority);
        });
    }

    getSelectedPriority() {
        const active = document.querySelector('.pri-btn.active');
        return active ? active.dataset.priority : 'medium';
    }

    selectRecurrence(recurrence) {
        this.recurrenceBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.recur === recurrence);
        });
    }

    getSelectedRecurrence() {
        const active = document.querySelector('.recur-btn.active');
        return active ? active.dataset.recur : 'none';
    }

    updateCategoriesDatalist() {
        const cats = [...new Set([...this.categories, ...this.todos.map(t => t.category).filter(Boolean)])];
        this.categoriesDatalist.innerHTML = cats.map(c => `<option value="${this.escapeHTML(c)}">`).join('');
    }

    // CRUD
    quickAdd() {
        const title = this.quickInput.value.trim();
        if (!title) return;
        
        // Show animation if in spotlight mode
        if (document.body.classList.contains('spotlight-mode')) {
            this.showTaskAddedAnimation();
        }
        
        this.addTodo({
            title,
            description: '',
            priority: 'medium',
            category: '',
            dueDate: null
        });
        
        this.quickInput.value = '';
    }

    showTaskAddedAnimation() {
        // Create animation container
        const animation = document.createElement('div');
        animation.className = 'task-added-animation';
        animation.innerHTML = `
            <div class="success-flash"></div>
            <div class="particle circle"></div>
            <div class="particle star"></div>
            <div class="particle dot"></div>
            <div class="particle square"></div>
            <div class="particle circle"></div>
            <div class="particle dot"></div>
            <div class="particle star"></div>
            <div class="particle square"></div>
            <div class="particle circle"></div>
            <div class="particle dot"></div>
            <div class="particle star"></div>
            <div class="particle square"></div>
            <span class="confirm-text">✓ Added!</span>
        `;
        
        // Add to quick-add container
        this.quickAddContainer.appendChild(animation);
        
        // Remove animation element after it completes
        setTimeout(() => {
            animation.remove();
        }, 1000);
    }

    handleSubmit(e) {
        e.preventDefault();
        
        const data = {
            title: this.taskTitle.value.trim(),
            description: this.taskDesc.value.trim(),
            priority: this.getSelectedPriority(),
            category: this.taskCategory.value.trim(),
            dueDate: this.taskDue.value || null,
            recurrence: this.getSelectedRecurrence()
        };
        
        // Default due date to today when a recurrence is selected but no date provided
        if (data.recurrence && data.recurrence !== 'none' && !data.dueDate) {
            data.dueDate = this.toLocalDateString(new Date());
        }
        
        if (!data.title) return;
        
        if (this.editingId) {
            this.updateTodo(this.editingId, data);
        } else {
            this.addTodo(data);
        }
        
        this.closeModal();
    }

    addTodo(data) {
        const todo = {
            id: Storage.generateId(),
            ...data,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        this.todos.unshift(todo);
        this.lastAddedTodoId = todo.id;
        this.save();
        
        if (data.category && !this.categories.includes(data.category)) {
            this.categories.push(data.category);
            Storage.saveCategories(this.categories);
        }
        
        this.render();
    }

    updateTodo(id, data) {
        const idx = this.todos.findIndex(t => String(t.id) === String(id));
        if (idx === -1) return;
        
        this.todos[idx] = { ...this.todos[idx], ...data };
        this.save();
        
        if (data.category && !this.categories.includes(data.category)) {
            this.categories.push(data.category);
            Storage.saveCategories(this.categories);
        }
        
        this.render();
    }

    confirmDelete(id) {
        const todo = this.todos.find(t => String(t.id) === String(id));
        const title = todo ? todo.title : 'this task';
        
        // Skip confirmation if user chose "Don't ask again"
        if (this.settings.skipDeleteConfirm === true) {
            this.deleteTodo(id);
            return;
        }
        
        this.showConfirm(
            'Delete Task',
            `Are you sure you want to delete "${title}"?`,
            () => this.deleteTodo(id),
            'delete'
        );
    }

    async deleteTodo(id) {
        this.todos = this.todos.filter(t => String(t.id) !== String(id));
        await this.save();
        this.render();
    }

    async toggleComplete(id) {
        const todo = this.todos.find(t => String(t.id) === String(id));
        if (!todo) return;
        
        // Prevent completing missed tasks
        if (!todo.completed) {
            const overdueIntensity = this.getOverdueIntensity(todo);
            const isMissed = todo.missed === true || overdueIntensity === 5;
            
            if (isMissed) {
                this.showToast('This task is marked as missed and cannot be completed. You can delete it or keep it for reference.');
                this.render(); // Re-render to reset checkbox state
                return;
            }
        }
        
        // If task is already completed, check if it can be undone
        if (todo.completed && todo.completedAt) {
            const completedTime = new Date(todo.completedAt).getTime();
            const now = Date.now();
            const minutesPassed = (now - completedTime) / (1000 * 60);
            
            if (minutesPassed >= 15) {
                // Can't undo after 15 minutes - show message
                this.showToast('This task is locked and cannot be undone.');
                this.render(); // Re-render to reset checkbox state
                return;
            }
        }
        
        todo.completed = !todo.completed;
        todo.completedAt = todo.completed ? new Date().toISOString() : null;
        
        // Handle recurring tasks - create next occurrence when completed
        if (todo.completed && todo.recurrence && todo.recurrence !== 'none') {
            this.createNextRecurrence(todo);
        }
        
        await this.save();
        this.render();
    }

    createNextRecurrence(completedTodo) {
        const nextDueDate = this.calculateNextDueDate(completedTodo.dueDate, completedTodo.recurrence);
        
        const newTodo = {
            id: Storage.generateId(),
            title: completedTodo.title,
            description: completedTodo.description,
            priority: completedTodo.priority,
            category: completedTodo.category,
            dueDate: nextDueDate,
            recurrence: completedTodo.recurrence,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        this.todos.unshift(newTodo);
    }

    calculateNextDueDate(currentDueDate, recurrence) {
        const baseDate = currentDueDate ? new Date(currentDueDate + 'T00:00:00') : new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        baseDate.setHours(0, 0, 0, 0);
        
        // If base date is in the past, start from today (local)
        if (baseDate < today) {
            baseDate.setTime(today.getTime());
            baseDate.setHours(0, 0, 0, 0);
        }
        
        switch (recurrence) {
            case 'daily':
                baseDate.setDate(baseDate.getDate() + 1);
                break;
            case 'weekly':
                baseDate.setDate(baseDate.getDate() + 7);
                break;
            case 'monthly':
                baseDate.setMonth(baseDate.getMonth() + 1);
                break;
            default:
                return null;
        }
        
        return this.toLocalDateString(baseDate);
    }

    reorder(fromId, toId) {
        const fromIdx = this.todos.findIndex(t => String(t.id) === String(fromId));
        const toIdx = this.todos.findIndex(t => String(t.id) === String(toId));
        if (fromIdx === -1 || toIdx === -1) return;
        
        const [item] = this.todos.splice(fromIdx, 1);
        this.todos.splice(toIdx, 0, item);
        this.save();
        this.render();
    }

    clearCompleted() {
        this.todos = this.todos.filter(t => !t.completed);
        this.save();
        this.render();
    }

    clearAll() {
        if (confirm('Are you sure you want to delete all tasks?')) {
            this.todos = [];
            this.save();
            this.render();
            this.closeSettings();
        }
    }

    async save() {
        this.isSaving = true;
        await Storage.saveTodos(this.todos);
        // Reset flag after a short delay to allow onChanged to fire first
        setTimeout(() => {
            this.isSaving = false;
        }, 100);
    }

    async saveAndRender() {
        await this.save();
        this.render();
    }

    // Rendering
    getFilteredTodos() {
        return this.todos.filter(todo => {
            if (this.filters.search) {
                const s = this.filters.search;
                const match = todo.title.toLowerCase().includes(s) ||
                    (todo.description && todo.description.toLowerCase().includes(s)) ||
                    (todo.category && todo.category.toLowerCase().includes(s));
                if (!match) return false;
            }
            
            if (this.filters.status === 'active' && todo.completed) return false;
            if (this.filters.status === 'completed' && !todo.completed) return false;
            if (this.filters.status === 'missed') {
                // Show tasks that are missed or overdue (and not completed)
                const isMissed = todo.missed === true || this.isOverdue(todo);
                if (todo.completed || !isMissed) return false;
            }
            if (this.filters.priority && todo.priority !== this.filters.priority) return false;
            
            return true;
        });
    }

    render() {
        const filtered = this.getFilteredTodos();
        
        if (filtered.length === 0) {
            this.todoList.innerHTML = '';
            this.emptyState.classList.add('visible');
        } else {
            this.emptyState.classList.remove('visible');
            this.todoList.innerHTML = filtered.map(t => this.renderTodo(t)).join('');
            this.bindTodoEvents();
            
            // Add entrance animation to newly added task
            if (this.lastAddedTodoId) {
                const newItem = this.todoList.querySelector(`[data-id="${this.lastAddedTodoId}"]`);
                if (newItem) {
                    newItem.classList.add('todo-item--new');
                    // Remove animation class after it completes
                    setTimeout(() => {
                        newItem.classList.remove('todo-item--new');
                    }, 800);
                }
                this.lastAddedTodoId = null;
            }
        }
        
        this.updateStats();
    }

    renderTodo(todo) {
        const isOverdue = this.isOverdue(todo);
        const overdueIntensity = this.getOverdueIntensity(todo);
        
        // Show as fully missed if: explicitly marked as missed OR overdue intensity is 5
        const isMissed = (!todo.completed && (todo.missed === true || overdueIntensity === 5));
        
        // Apply progressive overdue class (overdue-1 through overdue-4 for gradual intensity)
        let overdueClass = '';
        if (!todo.completed && overdueIntensity && overdueIntensity < 5) {
            overdueClass = `overdue-${overdueIntensity}`;
        }
        
        const dateStr = this.formatDate(todo);
        const timestampStr = this.settings.showTimestamps ? this.formatTimestamp(todo.createdAt) : '';
        
        // Check if task is locked (completed more than 15 minutes ago)
        let isLocked = false;
        if (todo.completed && todo.completedAt) {
            const completedTime = new Date(todo.completedAt).getTime();
            const minutesPassed = (Date.now() - completedTime) / (1000 * 60);
            isLocked = minutesPassed >= 15;
        }
        
        return `
            <li class="todo-item ${todo.completed ? 'completed' : ''} ${isMissed ? 'missed' : ''} ${overdueClass} ${isLocked ? 'locked' : ''}" data-id="${todo.id}" data-priority="${todo.priority}" draggable="true">
                <label class="checkbox">
                    <input type="checkbox" ${todo.completed ? 'checked' : ''}>
                    <span class="checkmark"></span>
                </label>
                <div class="todo-content">
                    <div class="todo-title">
                        ${this.escapeHTML(todo.title)}
                        ${todo.description ? `<span class="desc-indicator" title="${this.escapeHTML(todo.description)}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                            </svg>
                        </span>` : ''}
                    </div>
                    <div class="todo-meta">
                        ${todo.category ? `<span class="tag">${this.escapeHTML(todo.category)}</span>` : ''}
                        ${todo.recurrence && todo.recurrence !== 'none' ? `<span class="tag tag--recur" title="Repeats ${todo.recurrence}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="23 4 23 10 17 10"></polyline>
                                <polyline points="1 20 1 14 7 14"></polyline>
                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                            </svg>
                            ${todo.recurrence.charAt(0).toUpperCase() + todo.recurrence.slice(1)}
                        </span>` : ''}
                        <div class="tag-wrapper ${isMissed && todo.recurrence && todo.recurrence !== 'none' && !this.settings.autoCreateDailyTasks ? 'has-hover-button' : ''}">
                            ${dateStr ? `<span class="tag date-badge ${isOverdue ? 'tag--overdue' : ''}">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                                ${dateStr}
                            </span>` : ''}
                            ${isMissed && todo.recurrence && todo.recurrence !== 'none' && !this.settings.autoCreateDailyTasks ? `
                            <button type="button" class="tag hover-button action-btn--duplicate-meta" aria-label="Create Next Occurrence" title="Create next occurrence">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="8" y1="17" x2="21" y2="17"></line>
                                    <path d="M16 16V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2"></path>
                                </svg>
                                Dup
                            </button>
                            ` : ''}
                        </div>
                        ${timestampStr ? `<span class="tag tag--timestamp">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            ${timestampStr}
                        </span>` : ''}
                    </div>
                </div>
                <div class="todo-actions">
                    <button type="button" class="action-btn action-btn--edit" aria-label="Edit">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button type="button" class="action-btn action-btn--delete" aria-label="Delete">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                        </svg>
                    </button>
                </div>
            </li>
        `;
    }

    bindTodoEvents() {
        this.todoList.querySelectorAll('.todo-item').forEach(item => {
            const id = item.dataset.id;
            
            const checkbox = item.querySelector('input[type="checkbox"]');
            if (checkbox) {
                checkbox.addEventListener('change', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.toggleComplete(id);
                });
            }
            
            const editBtn = item.querySelector('.action-btn--edit');
            if (editBtn) {
                editBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.openModal(id);
                });
            }
            
            const duplicateBtn = item.querySelector('.action-btn--duplicate-meta');
            if (duplicateBtn) {
                duplicateBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.createNextOccurrence(id);
                });
            }
            
            const deleteBtn = item.querySelector('.action-btn--delete');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.confirmDelete(id);
                });
            }
        });
    }

    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(t => t.completed).length;
        const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        this.taskCount.textContent = `${total} task${total !== 1 ? 's' : ''}`;
        this.progressText.textContent = `${pct}%`;
        this.progressFill.setAttribute('stroke-dasharray', `${pct}, 100`);
    }

    isOverdue(todo) {
        if (!todo.dueDate || todo.completed) return false;
        const due = new Date(todo.dueDate + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return due < today;
    }

    getDaysOverdue(todo) {
        if (!todo.dueDate || todo.completed) return 0;
        const due = new Date(todo.dueDate + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffMs = today - due;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    }

    getOverdueIntensity(todo) {
        const daysOverdue = this.getDaysOverdue(todo);
        if (daysOverdue === 0) return null;

        const recurrence = todo.recurrence || 'none';
        let maxDays = 1; // Default for one-time tasks
        
        if (recurrence === 'weekly') {
            maxDays = 7;
        } else if (recurrence === 'monthly') {
            maxDays = 30;
        } else if (recurrence === 'daily') {
            maxDays = 1; // Daily tasks turn fully missed immediately
        }

        // Calculate intensity level (1-5, where 5 is fully missed)
        if (daysOverdue >= maxDays) {
            return 5; // Fully missed
        }
        
        const intensity = Math.ceil((daysOverdue / maxDays) * 4);
        return Math.min(intensity, 4); // 1-4 for gradual, 5 for fully missed
    }

    // Utility: format a Date to YYYY-MM-DD in local time
    toLocalDateString(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    formatDate(todo) {
        if (!todo.dueDate) return '';
        
        const date = new Date(todo.dueDate + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
        
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    formatTimestamp(isoDate) {
        if (!isoDate) return '';
        
        const date = new Date(isoDate);
        const now = new Date();
        
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const timeStr = date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
        
        if (date >= today) {
            // Today - just show time
            return timeStr;
        } else if (date >= yesterday) {
            // Yesterday
            return `Yesterday, ${timeStr}`;
        } else {
            // Older - show date and time
            const dateStr = date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric'
            });
            return `${dateStr}, ${timeStr}`;
        }
    }

    escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

// Initialize - make app globally accessible for widget button handlers
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new TodoApp();
});
