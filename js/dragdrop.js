/**
 * Drag and Drop Module - Handles drag and drop reordering
 */
const DragDrop = {
    draggedItem: null,
    placeholder: null,

    /**
     * Initialize drag and drop on the todo list
     * @param {HTMLElement} container - The container element
     * @param {Function} onReorder - Callback when items are reordered
     */
    init(container, onReorder) {
        this.container = container;
        this.onReorder = onReorder;
        
        container.addEventListener('dragstart', this.handleDragStart.bind(this));
        container.addEventListener('dragend', this.handleDragEnd.bind(this));
        container.addEventListener('dragover', this.handleDragOver.bind(this));
        container.addEventListener('drop', this.handleDrop.bind(this));
        container.addEventListener('dragleave', this.handleDragLeave.bind(this));
    },

    /**
     * Handle drag start event
     * @param {DragEvent} e - Drag event
     */
    handleDragStart(e) {
        const todoItem = e.target.closest('.todo-item');
        if (!todoItem) return;

        this.draggedItem = todoItem;
        todoItem.classList.add('dragging');
        
        // Set drag data
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', todoItem.dataset.id);
        
        // Create visual feedback
        setTimeout(() => {
            todoItem.style.opacity = '0.5';
        }, 0);
    },

    /**
     * Handle drag end event
     * @param {DragEvent} e - Drag event
     */
    handleDragEnd(e) {
        const todoItem = e.target.closest('.todo-item');
        if (!todoItem) return;

        todoItem.classList.remove('dragging');
        todoItem.style.opacity = '1';
        
        // Remove all drag-over classes
        this.container.querySelectorAll('.todo-item').forEach(item => {
            item.classList.remove('drag-over');
        });

        this.draggedItem = null;
    },

    /**
     * Handle drag over event
     * @param {DragEvent} e - Drag event
     */
    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        const todoItem = e.target.closest('.todo-item');
        if (!todoItem || todoItem === this.draggedItem) return;

        // Remove drag-over from all items
        this.container.querySelectorAll('.todo-item').forEach(item => {
            item.classList.remove('drag-over');
        });

        // Add drag-over to current target
        todoItem.classList.add('drag-over');
    },

    /**
     * Handle drag leave event
     * @param {DragEvent} e - Drag event
     */
    handleDragLeave(e) {
        const todoItem = e.target.closest('.todo-item');
        if (todoItem) {
            todoItem.classList.remove('drag-over');
        }
    },

    /**
     * Handle drop event
     * @param {DragEvent} e - Drag event
     */
    handleDrop(e) {
        e.preventDefault();
        
        const todoItem = e.target.closest('.todo-item');
        if (!todoItem || !this.draggedItem || todoItem === this.draggedItem) return;

        const draggedId = this.draggedItem.dataset.id;
        const targetId = todoItem.dataset.id;

        // Remove drag-over styling
        todoItem.classList.remove('drag-over');

        // Call reorder callback
        if (this.onReorder) {
            this.onReorder(draggedId, targetId);
        }
    },

    /**
     * Make an element draggable
     * @param {HTMLElement} element - Element to make draggable
     */
    makeDraggable(element) {
        element.setAttribute('draggable', 'true');
    }
};
