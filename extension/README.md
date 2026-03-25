# JobFlow Autofill Extension

Browser extension for auto-filling job applications with your stored profile data.

## Features

- **Form Detection**: Automatically detects job application forms on popular job sites
- **Auto-fill**: Fill forms instantly with your stored profile data
- **Application Tracking**: Logs applications automatically
- **Smart Reminders**: Get notified when it's time to follow up

## Installation

### Chrome/Edge

1. Open `chrome://extensions/` (or `edge://extensions/`)
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the `dist/extension` folder

### Firefox

1. Open `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select any file from the `dist/extension` folder

## Development

```bash
# Build extension
npm run build:extension

# Build web app
npm run build

# Build both
npm run build:all
```

## Supported Job Sites

The extension works on most job application sites including:

- Greenhouse
- Lever
- Workday
- Indeed
- LinkedIn
- Glassdoor
- Monster
- ZipRecruiter
- SmartRecruiters
- And many more!

## Permissions

- `storage`: Store your profile and settings
- `activeTab`: Detect forms on the current page
- `notifications`: Show follow-up reminders
- `<all_urls>`: Detect forms on any job site
