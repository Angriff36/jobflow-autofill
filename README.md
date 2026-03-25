# JobFlow - Auto-fill Job Applications

Stop spending hours filling out the same information on every job application. JobFlow saves your profile once and auto-fills job application forms across the web, tracks your applications through every stage, and reminds you when to follow up.

<!-- ![JobFlow Dashboard](docs/screenshots/dashboard.png) -->
<!-- ![JobFlow Autofill](docs/screenshots/autofill.png) -->

## Features

- **One-Click Autofill** — Browser extension detects job application forms and fills them with your saved profile
- **Application Tracker** — Kanban board to track applications through Applied, Interviewing, Offer, and more
- **Follow-Up Reminders** — Never miss a follow-up with smart reminder scheduling
- **Local-First Storage** — Your data stays on your device by default, with optional cloud sync
- **Privacy-Focused** — Sensitive PII never leaves your browser unless you opt in

## Tech Stack

| Component | Technology |
|-----------|------------|
| Web Framework | React 18 + TypeScript |
| Build Tool | Vite |
| State Management | Zustand |
| Local Storage | Dexie.js (IndexedDB) |
| Cloud Sync | Supabase (optional) |
| UI | Tailwind CSS + Radix UI |
| Browser Extension | Chrome Extension Manifest V3 |
| Payments | Stripe |

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Setup

```bash
# Clone the repository
git clone https://github.com/your-org/jobflow-autofill.git
cd jobflow-autofill

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Build

```bash
# Build web app
npm run build

# Build browser extension
npm run build:extension

# Build both
npm run build:all
```

## Browser Extension (Dev Mode)

1. Run `npm run build:extension`
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked**
5. Select the `dist/extension` folder
6. Navigate to a job application page and click the JobFlow icon

## Project Structure

```
├── src/                    # React web application
│   ├── components/         # Shared UI components
│   ├── core/               # Storage, types, utilities
│   └── features/           # Feature modules (dashboard, profile, applications)
├── extension/              # Chrome extension source
├── supabase/               # Database migrations and config
├── scripts/                # Build scripts
└── dist/                   # Build output (web + extension)
```

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Run `npm run type-check` and `npm test` before committing
4. Open a pull request

## License

Private — All rights reserved
