/**
 * Storage Module - Handles data persistence using Chrome Storage API
 */
const Storage = {
    KEYS: {
        TODOS: 'todos',
        THEME: 'theme',
        CATEGORIES: 'categories',
        SETTINGS: 'settings'
    },

    /**
     * Save todos to storage
     * @param {Array} todos - Array of todo objects
     */
    async saveTodos(todos) {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
                await chrome.storage.sync.set({ [this.KEYS.TODOS]: todos });
            } else {
                localStorage.setItem(this.KEYS.TODOS, JSON.stringify(todos));
            }
        } catch (error) {
            console.error('Error saving todos:', error);
            // Fallback to localStorage
            try {
                localStorage.setItem(this.KEYS.TODOS, JSON.stringify(todos));
            } catch (e) {
                console.error('LocalStorage fallback also failed:', e);
            }
        }
    },

    /**
     * Load todos from storage
     * @returns {Promise<Array>} Array of todo objects
     */
    async loadTodos() {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
                const result = await chrome.storage.sync.get(this.KEYS.TODOS);
                return result[this.KEYS.TODOS] || [];
            } else {
                const data = localStorage.getItem(this.KEYS.TODOS);
                return data ? JSON.parse(data) : [];
            }
        } catch (error) {
            console.error('Error loading todos:', error);
            // Fallback to localStorage
            const data = localStorage.getItem(this.KEYS.TODOS);
            return data ? JSON.parse(data) : [];
        }
    },

    /**
     * Save theme preference
     * @param {string} theme - 'light' or 'dark'
     */
    async saveTheme(theme) {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                await chrome.storage.sync.set({ [this.KEYS.THEME]: theme });
            } else {
                localStorage.setItem(this.KEYS.THEME, theme);
            }
        } catch (error) {
            console.error('Error saving theme:', error);
            localStorage.setItem(this.KEYS.THEME, theme);
        }
    },

    /**
     * Load theme preference
     * @returns {Promise<string>} Theme name
     */
    async loadTheme() {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                const result = await chrome.storage.sync.get(this.KEYS.THEME);
                return result[this.KEYS.THEME] || 'light';
            } else {
                return localStorage.getItem(this.KEYS.THEME) || 'light';
            }
        } catch (error) {
            console.error('Error loading theme:', error);
            return localStorage.getItem(this.KEYS.THEME) || 'light';
        }
    },

    /**
     * Save categories
     * @param {Array} categories - Array of category strings
     */
    async saveCategories(categories) {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                await chrome.storage.sync.set({ [this.KEYS.CATEGORIES]: categories });
            } else {
                localStorage.setItem(this.KEYS.CATEGORIES, JSON.stringify(categories));
            }
        } catch (error) {
            console.error('Error saving categories:', error);
            localStorage.setItem(this.KEYS.CATEGORIES, JSON.stringify(categories));
        }
    },

    /**
     * Load categories
     * @returns {Promise<Array>} Array of category strings
     */
    async loadCategories() {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                const result = await chrome.storage.sync.get(this.KEYS.CATEGORIES);
                return result[this.KEYS.CATEGORIES] || [];
            } else {
                const data = localStorage.getItem(this.KEYS.CATEGORIES);
                return data ? JSON.parse(data) : [];
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            const data = localStorage.getItem(this.KEYS.CATEGORIES);
            return data ? JSON.parse(data) : [];
        }
    },

    /**
     * Save settings - widget imageUrls go to local storage (large data),
     * everything else goes to sync storage.
     * @param {Object} settings - Settings object
     */
    async saveSettings(settings) {
        try {
            // Separate imageUrls (can be large base64) from sync payload
            const imageUrlMap = {};
            const settingsForSync = {
                ...settings,
                widgets: (settings.widgets || []).map(w => {
                    if (w.imageUrl) {
                        imageUrlMap[w.id] = w.imageUrl;
                    }
                    const { imageUrl, ...rest } = w;
                    return rest;
                })
            };

            // Save imageUrls to local storage (10MB limit)
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                await chrome.storage.local.set({ widgetImageUrls: imageUrlMap });
            } else {
                localStorage.setItem('widgetImageUrls', JSON.stringify(imageUrlMap));
            }

            // Save settings (without imageUrls) to sync storage
            if (typeof chrome !== 'undefined' && chrome.storage) {
                await chrome.storage.sync.set({ [this.KEYS.SETTINGS]: settingsForSync });
            } else {
                localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settingsForSync));
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
        }
    },

    /**
     * Load settings - merges imageUrls from local storage back into widgets.
     * @returns {Promise<Object>} Settings object
     */
    async loadSettings() {
        try {
            let settingsData = null;
            let imageUrlMap = {};

            if (typeof chrome !== 'undefined' && chrome.storage) {
                const [syncResult, localResult] = await Promise.all([
                    chrome.storage.sync.get(this.KEYS.SETTINGS),
                    chrome.storage.local.get('widgetImageUrls')
                ]);
                settingsData = syncResult[this.KEYS.SETTINGS] || null;
                imageUrlMap = localResult.widgetImageUrls || {};
            } else {
                const data = localStorage.getItem(this.KEYS.SETTINGS);
                settingsData = data ? JSON.parse(data) : null;
                const imgData = localStorage.getItem('widgetImageUrls');
                imageUrlMap = imgData ? JSON.parse(imgData) : {};
            }

            // Merge imageUrls back into widget objects
            if (settingsData && settingsData.widgets && Object.keys(imageUrlMap).length > 0) {
                settingsData.widgets = settingsData.widgets.map(w => ({
                    ...w,
                    imageUrl: imageUrlMap[w.id] || w.imageUrl || ''
                }));
            }

            return settingsData;
        } catch (error) {
            console.error('Error loading settings:', error);
            const data = localStorage.getItem(this.KEYS.SETTINGS);
            return data ? JSON.parse(data) : null;
        }
    },

    /**
     * Generate unique ID
     * @returns {string} Unique identifier
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * Save reading notes
     * @param {Array} notes - Array of reading note objects
     */
    async saveReadingNotes(notes) {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
                await chrome.storage.sync.set({ readingNotes: notes });
            } else {
                localStorage.setItem('readingNotes', JSON.stringify(notes));
            }
        } catch (error) {
            console.error('Error saving reading notes:', error);
            try {
                localStorage.setItem('readingNotes', JSON.stringify(notes));
            } catch (e) {
                console.error('LocalStorage fallback also failed:', e);
            }
        }
    },

    /**
     * Load reading notes
     * @returns {Promise<Array>} Array of reading note objects
     */
    async loadReadingNotes() {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
                const result = await chrome.storage.sync.get('readingNotes');
                return result.readingNotes || [];
            } else {
                const data = localStorage.getItem('readingNotes');
                return data ? JSON.parse(data) : [];
            }
        } catch (error) {
            console.error('Error loading reading notes:', error);
            const data = localStorage.getItem('readingNotes');
            return data ? JSON.parse(data) : [];
        }
    }
};
