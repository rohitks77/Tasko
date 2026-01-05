# ✨ Tasko - Chrome Extension

A beautiful, feature-rich Chrome extension that replaces your new tab with Tasko - a powerful task management app featuring floating widgets, quick search, smart timestamps, popup access, and much more.

![Tasko Preview](preview.png)

---

## 🚀 Features

### 🏠 New Tab Experience
Every time you open a new tab, you'll see:
- **Live Animated Clock** - Beautiful flip-style clock with date
- **Personalized Greeting** - "Good morning, [Your Name]!"
- **Todo List** - Your tasks with progress tracking
- **Quick Search Bar** - Search tasks or the web instantly
- **Floating Widgets** - Quick links and sticky notes

### 📝 Task Management
- **Add, Edit, Delete** - Full CRUD operations for tasks
- **Mark Complete** - Visual strike-through and checkbox
- **Priority Levels** - High, Medium, Low with customizable colors
- **Categories/Tags** - Organize with custom categories and icon picker
- **Due Dates & Times** - Schedule tasks with deadlines
- **Smart Timestamps** - Shows "Today 2:30 PM", "Yesterday 5:00 PM", or full date (toggleable)
- **Delete Confirmation** - Prevents accidental task deletion

### 🔍 Quick Search System
- **Google Search** - Type `//` followed by your query to search Google
- **Custom Search Engines** - Use `@prefix` to search YouTube, GitHub, Wikipedia, Maps, X (Twitter)
- **Quick Links** - Type `@prefix` alone (without query) to open the website directly
- **Visual Suggestions** - Autocomplete dropdown when typing `//` or `@` (toggleable)
- **Blur Effect** - Content blurs when suggestions appear
- **Customizable Engines** - Add, edit, delete search engines with custom prefixes and URLs

### 🎯 Floating Widgets
- **Quick Links** - Add floating link buttons with custom icons
- **Sticky Notes** - Floating notes with timestamps
- **Drag & Drop** - Position widgets anywhere on screen
- **Edit & Delete** - Right-click or use edit button
- **Persistent Position** - Remembers where you placed them

### 🔘 Extension Popup
Click the extension icon in toolbar for quick access:
- **Quick Add Tasks** - Add tasks without opening new tab
- **Task Overview** - See your recent tasks and stats
- **Real-time Sync** - Changes sync instantly with new tab
- **Theme Toggle** - Switch dark/light mode
- **How to Use Guide** - Built-in help documentation

### ⚙️ Settings Panel
- **Personalization** - Set your name for greeting
- **Task Settings** - Priority colors, timestamps toggle
- **Appearance** - Dark/Light mode, clock visibility
- **Quick Search** - Toggle feature, manage search engines, custom placeholder
- **Widgets** - Add links and notes
- **Keyboard Shortcuts** - Customizable shortcuts
- **Modal Behavior** - Settings only closes with close button, shakes on outside click (Windows-style)

### 🎨 Themes & UI
- **Dark/Light Mode** - Beautiful themes with smooth transitions
- **Theme Color** - Browser toolbar adapts to theme (on supported platforms)
- **Modern Design** - Clean, minimal interface
- **Responsive** - Works on all screen sizes
- **No Selection** - Text selection disabled for app-like feel
- **No Zoom** - Pinch zoom disabled for consistent experience

### 📊 Progress & Organization
- **Progress Bar** - Visual completion percentage
- **Filter Tasks** - All, Active, Completed
- **Search Tasks** - Find by title, description, or category
- **Drag & Drop Reorder** - Organize task order manually

### ⌨️ Keyboard Shortcuts
| Default Key | Action |
|-------------|--------|
| `N` | New Task |
| `F` | Focus Search |
| `D` | Toggle Dark Mode |
| `S` | Open Settings |
| `Esc` | Close Modal/Settings |

*All shortcuts are customizable in Settings → Shortcuts*

---

## 📦 Installation

### From Source (Developer Mode)

1. **Download or Clone**
   ```bash
   git clone https://github.com/yourusername/tasko.git
   ```

2. **Open Chrome Extensions**
   - Navigate to `chrome://extensions/`
   - Or: Menu → More Tools → Extensions

3. **Enable Developer Mode**
   - Toggle "Developer mode" in the top right

4. **Load Extension**
   - Click "Load unpacked"
   - Select the extension folder

5. **Done!**
   - Open a new tab to see Tasko
   - Click extension icon for quick popup access

---

## 📁 Project Structure

```
tasko/
├── manifest.json        # Chrome extension manifest (v3)
├── newtab.html          # Main new tab page
├── popup.html           # Extension popup
├── README.md            # Documentation
├── css/
│   └── styles.css       # All styles with theming
├── js/
│   ├── app.js           # Main application logic
│   ├── popup.js         # Popup functionality
│   ├── storage.js       # Chrome Storage API handler
│   └── dragdrop.js      # Drag and drop functionality
└── icons/
    ├── icon16.png       # Toolbar icon
    ├── icon48.png       # Extensions page icon
    └── icon128.png      # Chrome Web Store icon
```

---

## 🔧 Technologies

- **HTML5** - Semantic markup
- **CSS3** - Variables, animations, flexbox, grid
- **Vanilla JavaScript** - ES6+ classes, async/await
- **Chrome Extension Manifest V3**
- **Chrome Storage API** - Sync storage for persistence

---

## 🎯 Default Search Engines

| Prefix | Website | Example |
|--------|---------|---------|
| `//` | Google | `// weather today` |
| `@yt` | YouTube | `@yt music videos` |
| `@gh` | GitHub | `@gh react repository` |
| `@wiki` | Wikipedia | `@wiki javascript` |
| `@maps` | Google Maps | `@maps new york` |
| `@x` | X (Twitter) | `@x elon musk` |
| `@chat` | ChatGPT | `@chat explain quantum physics` |

*Type prefix alone (e.g., `@yt`) to open the website directly*

---

## 🔒 Privacy & Data

- ✅ **100% Offline** - Works without internet (except web searches)
- ✅ **Local Storage** - All data stays on your device
- ✅ **No Tracking** - Zero analytics or telemetry
- ✅ **No Ads** - Completely ad-free experience
- ✅ **No External Servers** - Nothing leaves your browser
- ✅ **Open Source** - Fully transparent code

### ⚠️ Important Notice

**Uninstalling this extension will permanently delete all your data** including:
- All tasks
- Floating notes and widgets
- Custom settings and preferences
- Search engine configurations

This data **cannot be recovered** after uninstallation. Consider backing up important notes before removing the extension.

---

## 🎨 Customization

### Priority Colors
Settings → Tasks → Customize High/Medium/Low colors

### Search Placeholder
Settings → Quick Search → Edit placeholder text

### Search Engines
Settings → Quick Search → Add custom engines with `{query}` placeholder

### Widgets
Settings → Widgets → Add links or notes with custom icons

### Shortcuts
Settings → Shortcuts → Click any shortcut to rebind

---

## 🐛 Known Limitations

- Browser UI (tabs, toolbar) theme is controlled by Chrome/OS settings, not the extension
- Search suggestions require typing `//` or `@` to appear
- Chrome Storage sync has a quota limit (for very large amounts of data)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## 📄 License

MIT License - Free for personal and commercial use.

---

## 💡 Tips

- **Quick Google Search**: Type `// your search` and press Enter
- **Open YouTube**: Just type `@yt` and press Enter
- **Add Floating Note**: Settings → Widgets → Add Note
- **Change Theme Quickly**: Press `D` key
- **Exit Anything**: Press `Esc` key
- **Quick Add from Popup**: Click extension icon → Add task
- **Real-time Sync**: Popup and new tab stay in sync automatically

---

## 👤 Author

Made with ❤️ by [rohitks.com.np](https://rohitks.com.np)
