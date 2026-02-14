# Pick Pocket 💡

> Seize ideas, arguments, and thoughts to contemplate later

A Chrome extension that lets you save text snippets from any webpage with a single click.

## Features

- **💡 Pick Popover** - Select any text and a "Pick" button appears above it
- **Right-click Menu** - Use "Pick Idea" from the context menu
- **New Tab Dashboard** - View all your saved ideas organized by date
- **⏳ Life Progress** - Visualize your life, year, month, and day progress on the dashboard
- **Smart Source Links** - Automatically extracts permalinks from Twitter/X, StackOverflow, Reddit, Quora, and Hacker News
- **📧 Share via Gmail** - Email individual ideas, a day's ideas, or all ideas
- **☁️ Cloud Sync** - Optional sync to a Cloudflare Worker for cross-device access (requires self-hosted server)
- **💾 Backup & Restore** - Export your ideas to JSON or import from a backup
- **Self/Social Mode** - Toggle to hide share buttons for distraction-free viewing

## Installation

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** and select the extension folder

## Configuration

### Cloud Sync (Optional)
To enable syncing across devices, you can deploy the included Cloudflare Worker:
1. Navigate to `server/` directory
2. Deploy the worker using Wrangler
3. Add your Worker URL in the extension Options page

### Life Progress
- Go to the Options page to set your **Birth Year**
- The dashboard will show your estimated life progress (based on 75-year expectancy)

## Usage

### Saving Ideas
- **Method 1**: Select text → Click the 💡 Pick button that appears
- **Method 2**: Select text → Right-click → "Pick Idea"

### Viewing Ideas
- Open a new tab to see all your saved ideas
- Ideas are grouped by date (newest first)
- Click "Source" to visit the original page

## Tech Stack

- Manifest V3
- Chrome Storage API (local & sync)
- jQuery

## License

MIT
