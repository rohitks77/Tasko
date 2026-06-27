# Tasko - Chrome Extension

## Project Overview
A Chrome extension that replaces the default new tab with Tasko - a powerful task management app.

## Features
- Add, edit, and delete tasks
- Mark tasks as complete
- Categories/tags for organization
- Priority levels (High, Medium, Low)
- Due dates with reminders
- Search and filter functionality
- Drag and drop reordering
- Local storage persistence
- Dark/Light mode toggle
- Progress tracking
- Floating widgets (quick links & sticky notes)
- Quick search with custom search engines
- Beautiful modern UI

## Tech Stack
- HTML5
- CSS3 (with CSS Variables for theming)
- Vanilla JavaScript
- Chrome Extension APIs
- Chrome Storage API for persistence

## Project Structure
```
tasko/
├── manifest.json       # Chrome extension manifest
├── newtab.html        # Main HTML page
├── popup.html         # Extension popup
├── css/
│   └── styles.css     # Styles with dark/light theme
├── js/
│   ├── app.js         # Main application logic
│   ├── popup.js       # Popup functionality
│   ├── storage.js     # Storage handling
│   └── dragdrop.js    # Drag and drop functionality
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md          # Documentation
```

## Development
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the extension folder
4. Open a new tab to see Tasko

## Build Guidelines
- Use semantic HTML
- Follow BEM naming convention for CSS
- Use ES6+ JavaScript features
- Ensure accessibility (ARIA labels, keyboard navigation)
- Responsive design for all screen sizes
