# JobFlow Autofill

JobFlow Autofill is a job application assistant that stores a user's job-related profile data locally and uses it to auto-complete online job applications, track submitted applications, monitor stages, and remind users when to follow up. It combines form autofill, application tracking, and follow-up workflow management in one product.

## Client
- Name: Ryan Cort
- Email: ryan@cort.dev
- Timeline: Within 1 month
- Budget: Under $5,000

## Platforms
Web, Browser Extension

## Features
User Auth, Notifications

## Tech Stack

| Component | Technology |
|-----------|------------|
| Web Framework | React 18 + TypeScript |
| Build Tool | Vite |
| State Management | Zustand |
| Storage | Dexie.js (IndexedDB) |
| UI Components | Tailwind CSS + Radix UI |
| Browser Extension | Chrome Extension API |

## Project Structure

```
jobflow-autofill/
├── src/                      # React web application
│   ├── components/           # Reusable UI components
│   ├── core/
│   │   ├── storage/          # IndexedDB with Dexie.js
│   │   └── types/            # TypeScript type definitions
│   ├── features/
│   │   ├── dashboard/        # Main dashboard view
│   │   ├── profile-editor/   # Profile management UI
│   │   ├── applications/     # Application tracking
│   │   └── settings/         # App settings
│   ├── App.tsx
│   └── main.tsx
│
├── extension/                # Browser extension
│   ├── manifest.json         # Extension manifest (v3)
│   ├── background.js         # Service worker
│   ├── content.js            # Form detection & autofill
│   ├── popup.html/js         # Extension popup UI
│   └── icons/                # Extension icons
│
├── ARCHITECTURE.md           # System architecture document
└── package.json
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Install Dependencies

```bash
npm install
```

### Development

```bash
# Start development server
npm run dev
```

### Build

```bash
# Build for production
npm run build
```

### Type Check

```bash
# Run TypeScript type checking
npm run type-check
```

## Browser Extension

To load the extension in Chrome/Chromium:

1. Build the project: `npm run build`
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the `extension` folder from the project directory

## Data Models

### User Profile
- Personal information (name, email, phone, location)
- Work experience history
- Education history
- Skills
- Documents (resumes, cover letters)
- Saved answers to common questions

### Job Application
- Company & position
- Source (LinkedIn, Indeed, etc.)
- Application date
- Pipeline stage (Applied, Interviewing, Offer, Rejected, Closed)
- Follow-up reminders
- Notes & contacts

## Architecture Highlights

- **Local-First**: All data stored in IndexedDB, never sent to servers
- **Extension ↔ Web Sync**: Uses Broadcast Channel API for cross-context communication
- **Form Detection**: Pattern-based field matching + heuristic analysis
- **Privacy-Focused**: Sensitive PII stays on user's device

## License

Private - All rights reserved
