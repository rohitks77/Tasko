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
     * Save settings
     * @param {Object} settings - Settings object
     */
    async saveSettings(settings) {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                await chrome.storage.sync.set({ [this.KEYS.SETTINGS]: settings });
            } else {
                localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
        }
    },

    /**
     * Load settings
     * @returns {Promise<Object>} Settings object
     */
    async loadSettings() {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                const result = await chrome.storage.sync.get(this.KEYS.SETTINGS);
                return result[this.KEYS.SETTINGS] || null;
            } else {
                const data = localStorage.getItem(this.KEYS.SETTINGS);
                return data ? JSON.parse(data) : null;
            }
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
    }
};
