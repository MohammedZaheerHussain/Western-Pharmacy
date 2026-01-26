# Westorn Pharmacy - Medicine Inventory Management

A simple, fast, and clean medicine inventory management system designed for small pharmacies and clinics.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.3-61DAFB.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6.svg)

## Features

- 🔍 **Real-time Search** - Instant filtering by name, brand, salt, or location
- 📊 **Smart Alerts** - Low stock, expiring soon, and out-of-stock warnings
- 📦 **Bulk Actions** - Multi-select delete and location updates
- 📥 **CSV Import/Export** - Easy data migration with validation
- 📜 **Audit History** - Track all changes to inventory
- 💾 **Offline First** - Works without internet using IndexedDB
- 🖥️ **Desktop App (PWA)** - Install as native desktop app with one click
- 📱 **Responsive** - Works on desktop, tablet, and mobile
- 🧾 **Billing** - Create bills, edit incorrect bills, print receipts, view history
- ✏️ **Bill Editing** - Fix qty errors, items restock automatically
- 🖨️ **Professional Receipts** - Thermal printer optimized with pharmacy header
- 🌙 **Dark Mode** - Toggle with `D` key, persists across sessions
- ⌨️ **Keyboard Shortcuts** - `B` billing, `D` dark mode, `/` search, `Esc` close

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Storage**: IndexedDB (via idb library)
- **Icons**: Lucide React
- **Build**: Vite

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Security

- ✅ No backend dependencies - all data stored locally in browser
- ✅ No external API calls - fully offline capable
- ✅ No authentication required (v1) - designed for internal pharmacy use
- ✅ Input validation on all forms
- ✅ XSS protection via React's built-in escaping
- ✅ No sensitive data transmitted over network

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome for Android)

## Install as Desktop App (PWA)

Westorn Pharmacy is a Progressive Web App! Install it for a native desktop experience:

1. **Open the app** in Chrome or Edge on your desktop
2. **Click "Install App"** button in the header (or use browser menu → Install)
3. **Launch from desktop** - The app appears in your Start Menu/Applications
4. **Works offline** - All features work without internet after first load
5. **Own window** - Runs in standalone mode without browser UI

> 💡 After installation, the Install button automatically hides. Data persists locally in the browser's IndexedDB.

## License

MIT
