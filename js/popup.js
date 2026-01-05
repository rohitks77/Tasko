// Popup Script for Todo Extension
class PopupApp {
    constructor() {
        this.todos = [];
        this.settings = { theme: 'light' };
        this.init();
    }

    async init() {
        await this.loadData();
        this.cacheElements();
        this.bindEvents();
        this.applyTheme();
        this.render();
        
        // Listen for storage changes (from new tab app)
        chrome.storage.onChanged.addListener((changes, area) => {
            if (area === 'sync') {
                if (changes.todos) {
                    this.todos = changes.todos.newValue || [];
                    this.render();
                }
                if (changes.settings) {
                    this.settings = changes.settings.newValue || { theme: 'light' };
                    this.applyTheme();
                }
            }
        });
    }

    async loadData() {
        return new Promise((resolve) => {
            chrome.storage.sync.get(['todos', 'settings'], (result) => {
                this.todos = result.todos || [];
                this.settings = result.settings || { theme: 'light' };
                resolve();
            });
        });
    }

    cacheElements() {
        this.quickAddForm = document.getElementById('quickAddForm');
        this.quickInput = document.getElementById('quickInput');
        this.tasksList = document.getElementById('tasksList');
        this.totalTasks = document.getElementById('totalTasks');
        this.activeTasks = document.getElementById('activeTasks');
        this.completedTasks = document.getElementById('completedTasks');
        this.themeToggle = document.getElementById('themeToggle');
        this.openFullBtn = document.getElementById('openFullBtn');
        this.helpBtn = document.getElementById('helpBtn');
        this.backBtn = document.getElementById('backBtn');
        this.mainView = document.getElementById('mainView');
        this.helpView = document.getElementById('helpView');
        this.mainFooter = document.getElementById('mainFooter');
        this.headerTitle = document.getElementById('headerTitle');
    }

    bindEvents() {
        this.quickAddForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        this.openFullBtn.addEventListener('click', () => this.openFullPage());
        this.helpBtn.addEventListener('click', () => this.showHelp());
        this.backBtn.addEventListener('click', () => this.hideHelp());
    }

    showHelp() {
        this.mainView.style.display = 'none';
        this.mainFooter.style.display = 'none';
        this.helpView.style.display = 'block';
        this.headerTitle.textContent = '? How to Use';
    }

    hideHelp() {
        this.helpView.style.display = 'none';
        this.mainView.style.display = 'block';
        this.mainFooter.style.display = 'block';
        this.headerTitle.textContent = '✓ Todo List';
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.settings.theme);
        this.updateThemeIcon();
    }

    updateThemeIcon() {
        const isDark = this.settings.theme === 'dark';
        this.themeToggle.innerHTML = isDark 
            ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
               </svg>`
            : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="5"/>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
               </svg>`;
    }

    toggleTheme() {
        this.settings.theme = this.settings.theme === 'dark' ? 'light' : 'dark';
        this.applyTheme();
        chrome.storage.sync.set({ settings: this.settings });
    }

    addTask() {
        const title = this.quickInput.value.trim();
        if (!title) return;

        const todo = {
            id: Date.now(),
            title,
            description: '',
            priority: 'medium',
            category: '',
            dueDate: '',
            dueTime: '',
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.todos.unshift(todo);
        this.save();
        this.quickInput.value = '';
        this.render();
    }

    toggleTask(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.save();
            this.render();
        }
    }

    save() {
        chrome.storage.sync.set({ todos: this.todos });
    }

    render() {
        this.renderStats();
        this.renderTasks();
    }

    renderStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(t => t.completed).length;
        const active = total - completed;

        this.totalTasks.textContent = total;
        this.activeTasks.textContent = active;
        this.completedTasks.textContent = completed;
    }

    renderTasks() {
        // Show only first 5 active tasks, then completed
        const activeTodos = this.todos.filter(t => !t.completed).slice(0, 5);
        const completedTodos = this.todos.filter(t => t.completed).slice(0, 2);
        const displayTodos = [...activeTodos, ...completedTodos];

        if (displayTodos.length === 0) {
            this.tasksList.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                        <rect x="9" y="3" width="6" height="4" rx="1"/>
                        <path d="M9 12l2 2 4-4"/>
                    </svg>
                    <p>No tasks yet. Add one above!</p>
                </div>
            `;
            return;
        }

        this.tasksList.innerHTML = displayTodos.map(todo => `
            <div class="task-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
                <div class="task-checkbox ${todo.completed ? 'checked' : ''}" data-id="${todo.id}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                </div>
                <div class="task-content">
                    <div class="task-title">${this.escapeHtml(todo.title)}</div>
                    <div class="task-meta">
                        <span class="task-priority ${todo.priority}">${todo.priority}</span>
                        ${todo.dueDate ? `<span class="task-due">${this.formatDate(todo.dueDate)}</span>` : ''}
                    </div>
                </div>
            </div>
        `).join('');

        // Add click handlers
        this.tasksList.querySelectorAll('.task-checkbox').forEach(checkbox => {
            checkbox.addEventListener('click', () => {
                this.toggleTask(parseInt(checkbox.dataset.id));
            });
        });
    }

    formatDate(dateStr) {
        const date = new Date(dateStr);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    openFullPage() {
        chrome.tabs.create({ url: 'chrome://newtab' });
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new PopupApp();
});
