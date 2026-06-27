/**
 * Tasko - Background Service Worker
 * Handles alarms and notifications when tab is closed
 */

// Alarm names
const ALARMS = {
    MORNING: 'tasko-morning-reminder',
    EVENING: 'tasko-evening-reminder',
    MIDNIGHT: 'tasko-midnight-check'
};

// Initialize alarms when extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
    // console.log('Tasko: Extension installed/updated');
    setupAlarms();
});

// Also setup alarms when service worker starts
chrome.runtime.onStartup.addListener(() => {
    // console.log('Tasko: Browser started');
    setupAlarms();
});

// Handle alarm events
chrome.alarms.onAlarm.addListener(async (alarm) => {
    // console.log('Tasko: Alarm triggered:', alarm.name);
    
    const settings = await getSettings();
    if (!settings.dailyReminders) return;
    
    const state = await getReminderState();
    const today = new Date().toDateString();
    
    switch (alarm.name) {
        case ALARMS.MORNING:
            if (settings.morningReminder && state.lastMorningReminder !== today) {
                await sendMorningReminder(settings);
                await saveReminderState({ ...state, lastMorningReminder: today });
            }
            break;
            
        case ALARMS.EVENING:
            if (settings.eveningReminder && state.lastEveningReminder !== today) {
                await sendEveningReminder(settings);
                await saveReminderState({ ...state, lastEveningReminder: today });
            }
            break;
            
        case ALARMS.MIDNIGHT:
            if (state.lastReminderDate !== today) {
                await handleMidnightReset(settings, state);
                await saveReminderState({
                    lastReminderDate: today,
                    lastMorningReminder: null,
                    lastEveningReminder: null
                });
            }
            break;
    }
});

// Setup all alarms
async function setupAlarms() {
    // Clear existing alarms first
    await chrome.alarms.clearAll();
    
    const settings = await getSettings();
    if (!settings.dailyReminders) {
        // console.log('Tasko: Daily reminders disabled, no alarms set');
        return;
    }
    
    const now = new Date();
    const today = now.toDateString();
    
    // Morning alarm (8 AM daily)
    const morningTime = new Date();
    morningTime.setHours(8, 0, 0, 0);
    if (morningTime <= now) {
        morningTime.setDate(morningTime.getDate() + 1);
    }
    chrome.alarms.create(ALARMS.MORNING, {
        when: morningTime.getTime(),
        periodInMinutes: 24 * 60 // Repeat daily
    });
    
    // Evening alarm (user's selected time, default 9 PM)
    const eveningHour = settings.eveningReminderTime || 21;
    const eveningTime = new Date();
    eveningTime.setHours(eveningHour, 0, 0, 0);
    if (eveningTime <= now) {
        eveningTime.setDate(eveningTime.getDate() + 1);
    }
    chrome.alarms.create(ALARMS.EVENING, {
        when: eveningTime.getTime(),
        periodInMinutes: 24 * 60 // Repeat daily
    });
    
    // Midnight alarm (12:05 AM to handle day change)
    const midnightTime = new Date();
    midnightTime.setHours(0, 5, 0, 0);
    if (midnightTime <= now) {
        midnightTime.setDate(midnightTime.getDate() + 1);
    }
    chrome.alarms.create(ALARMS.MIDNIGHT, {
        when: midnightTime.getTime(),
        periodInMinutes: 24 * 60 // Repeat daily
    });
    
    // console.log('Tasko: Alarms set up successfully');
    // console.log('  Morning:', new Date(morningTime).toLocaleString());
    // console.log('  Evening:', new Date(eveningTime).toLocaleString());
    // console.log('  Midnight:', new Date(midnightTime).toLocaleString());
}

// Get settings from storage
async function getSettings() {
    try {
        const result = await chrome.storage.sync.get('settings');
        return result.settings || {
            dailyReminders: false,
            morningReminder: true,
            eveningReminder: true,
            missedTaskAlert: true,
            eveningReminderTime: 21
        };
    } catch (e) {
        console.error('Tasko: Error getting settings:', e);
        return { dailyReminders: false };
    }
}

// Get reminder state from storage
async function getReminderState() {
    try {
        const result = await chrome.storage.local.get(['lastReminderDate', 'lastEveningReminder', 'lastMorningReminder']);
        return {
            lastReminderDate: result.lastReminderDate || null,
            lastEveningReminder: result.lastEveningReminder || null,
            lastMorningReminder: result.lastMorningReminder || null
        };
    } catch (e) {
        console.error('Tasko: Error getting reminder state:', e);
        return {};
    }
}

// Save reminder state
async function saveReminderState(state) {
    try {
        await chrome.storage.local.set(state);
    } catch (e) {
        console.error('Tasko: Error saving reminder state:', e);
    }
}

// Get todos from storage
async function getTodos() {
    try {
        const result = await chrome.storage.sync.get('todos');
        return result.todos || [];
    } catch (e) {
        console.error('Tasko: Error getting todos:', e);
        return [];
    }
}

// Save todos to storage
async function saveTodos(todos) {
    try {
        await chrome.storage.sync.set({ todos });
    } catch (e) {
        console.error('Tasko: Error saving todos:', e);
    }
}

// Get today's incomplete tasks
async function getTodaysTasks() {
    const todos = await getTodos();
    const today = new Date().toISOString().split('T')[0];
    
    // Get all incomplete tasks
    const allIncompleteTasks = todos.filter(todo => !todo.completed);
    
    // Get daily recurring tasks
    const dailyTasks = todos.filter(todo => 
        !todo.completed && 
        todo.recurrence === 'daily'
    );
    
    // Get tasks due today or overdue
    const tasksDueToday = todos.filter(todo =>
        !todo.completed &&
        todo.dueDate && todo.dueDate <= today
    );
    
    // Prioritize daily and due tasks
    const priorityTasks = [...new Map([...dailyTasks, ...tasksDueToday].map(t => [t.id, t])).values()];
    
    return priorityTasks.length > 0 ? priorityTasks : allIncompleteTasks;
}

// Send morning reminder notification
async function sendMorningReminder(settings) {
    const tasks = await getTodaysTasks();
    if (tasks.length === 0) return;
    
    const taskNames = tasks.slice(0, 3).map(t => t.title).join(', ');
    const moreText = tasks.length > 3 ? ` and ${tasks.length - 3} more` : '';
    
    chrome.notifications.create('tasko-morning', {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: '☀️ Good Morning! Tasks for Today',
        message: `You have ${tasks.length} task${tasks.length > 1 ? 's' : ''} to complete: ${taskNames}${moreText}`,
        priority: 2
    });
}

// Send evening reminder notification
async function sendEveningReminder(settings) {
    const tasks = await getTodaysTasks();
    if (tasks.length === 0) return;
    
    const taskNames = tasks.slice(0, 3).map(t => t.title).join(', ');
    const moreText = tasks.length > 3 ? ` and ${tasks.length - 3} more` : '';
    
    chrome.notifications.create('tasko-evening', {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: '🌙 Evening Reminder - Complete Your Tasks!',
        message: `Don't miss out! ${tasks.length} task${tasks.length > 1 ? 's' : ''} remaining: ${taskNames}${moreText}`,
        priority: 2
    });
}

// Handle midnight reset - mark missed tasks and create new daily occurrences
async function handleMidnightReset(settings, state) {
    const todos = await getTodos();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    // Find incomplete daily tasks
    const incompleteDailyTasks = todos.filter(todo => 
        !todo.completed && 
        todo.recurrence === 'daily'
    );
    
    // Find tasks that were due yesterday and not completed
    const missedTasks = todos.filter(todo =>
        !todo.completed &&
        todo.dueDate === yesterdayStr
    );
    
    let hasChanges = false;
    const allMissed = [...incompleteDailyTasks, ...missedTasks];
    
    // Mark tasks as missed
    allMissed.forEach(task => {
        const idx = todos.findIndex(t => t.id === task.id);
        if (idx !== -1 && !todos[idx].missed) {
            todos[idx].missed = true;
            todos[idx].missedDate = yesterdayStr;
            hasChanges = true;
        }
    });
    
    // Create new occurrences for daily tasks
    const today = new Date().toISOString().split('T')[0];
    incompleteDailyTasks.forEach(task => {
        const newTodo = {
            id: generateId(),
            title: task.title,
            description: task.description || '',
            priority: task.priority,
            category: task.category || '',
            dueDate: today,
            recurrence: 'daily',
            completed: false,
            createdAt: new Date().toISOString()
        };
        todos.unshift(newTodo);
        hasChanges = true;
    });
    
    if (hasChanges) {
        await saveTodos(todos);
    }
    
    // Send missed task notification
    if (settings.missedTaskAlert && allMissed.length > 0) {
        const uniqueMissed = [...new Map(allMissed.map(t => [t.id, t])).values()];
        const taskNames = uniqueMissed.slice(0, 3).map(t => t.title).join(', ');
        const moreText = uniqueMissed.length > 3 ? ` and ${uniqueMissed.length - 3} more` : '';
        
        chrome.notifications.create('tasko-missed', {
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: '😔 Tasks Missed Yesterday',
            message: `You missed ${uniqueMissed.length} task${uniqueMissed.length > 1 ? 's' : ''}: ${taskNames}${moreText}`,
            priority: 2
        });
    }
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Listen for notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
    // Open new tab when notification is clicked
    chrome.tabs.create({ url: 'chrome://newtab' });
    chrome.notifications.clear(notificationId);
});

// Listen for settings changes to update alarms
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync' && changes.settings) {
        // console.log('Tasko: Settings changed, updating alarms');
        setupAlarms();
    }
});

// Initial setup
setupAlarms();
