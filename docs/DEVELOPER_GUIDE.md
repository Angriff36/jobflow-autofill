# JobFlow Autofill - Developer Guide

**Version:** 1.0  
**Last Updated:** March 2026

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Development Setup](#development-setup)
3. [Project Structure](#project-structure)
4. [Core Concepts](#core-concepts)
5. [Adding Features](#adding-features)
6. [Browser Extension](#browser-extension)
7. [Testing](#testing)
8. [Building & Deployment](#building--deployment)
9. [API Reference](#api-reference)

---

## Project Overview

JobFlow Autofill is a local-first job application assistant built with:

- **React 18** + TypeScript
- **Vite** for building
- **Zustand** for state management
- **Dexie.js** for IndexedDB storage
- **Supabase** for optional cloud sync
- **Tailwind CSS** + Radix UI for styling

### Core Features

1. **Profile Management**: Store resume data locally
2. **Application Tracking**: Track job applications through pipeline
3. **Auto-fill Extension**: Browser extension to fill forms
4. **Notifications**: Follow-up reminders

---

## Development Setup

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd jobflow-autofill

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Environment Variables

Create `.env.local` in the project root:

```bash
# Supabase (optional - for cloud sync)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run type-check` | Run TypeScript type checking |
| `npm run test` | Run tests |

---

## Project Structure

```
jobflow-autofill/
├── src/                      # React application
│   ├── components/           # Reusable UI components
│   │   └── ui/              # Base UI primitives
│   ├── core/                 # Business logic
│   │   ├── storage/         # IndexedDB + cloud storage
│   │   ├── types/          # TypeScript definitions
│   │   └── services/       # Data services
│   ├── features/            # Feature modules
│   │   ├── dashboard/     # Dashboard view
│   │   ├── profile-editor/# Profile management
│   │   ├── applications/  # Application tracking
│   │   └── settings/      # App settings
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities
│   ├── App.tsx
│   └── main.tsx
│
├── extension/               # Browser extension
│   ├── manifest.json       # Extension manifest v3
│   ├── background.js       # Service worker
│   ├── content.js          # Page injection
│   └── popup/              # Extension popup
│
├── supabase/               # Database migrations
├── docs/                   # Documentation
│   ├── USER_GUIDE.md
│   └── DEVELOPER_GUIDE.md
│
└── package.json
```

---

## Core Concepts

### State Management (Zustand)

All application state is managed through Zustand stores in `src/core/`.

**Example: Application Store**

```typescript
// src/core/applications/application.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { JobApplication } from '../types';

interface ApplicationStore {
  applications: JobApplication[];
  addApplication: (app: JobApplication) => void;
  updateApplication: (id: string, updates: Partial<JobApplication>) => void;
  deleteApplication: (id: string) => void;
  getApplication: (id: string) => JobApplication | undefined;
}

export const useApplicationStore = create<ApplicationStore>()(
  persist(
    (set, get) => ({
      applications: [],
      
      addApplication: (app) => set((state) => ({
        applications: [...state.applications, app]
      })),
      
      updateApplication: (id, updates) => set((state) => ({
        applications: state.applications.map((app) =>
          app.id === id ? { ...app, ...updates } : app
        )
      })),
      
      deleteApplication: (id) => set((state) => ({
        applications: state.applications.filter((app) => app.id !== id)
      })),
      
      getApplication: (id) => get().applications.find((app) => app.id === id),
    }),
    {
      name: 'jobflow-applications',
    }
  )
);
```

### Data Storage (Dexie.js)

IndexedDB is accessed through Dexie in `src/core/storage/`.

**Example: Database Setup**

```typescript
// src/core/storage/db.ts
import Dexie, { Table } from 'dexie';
import { JobApplication, UserProfile, FormSchema } from '../types';

export class JobFlowDB extends Dexie {
  applications!: Table<JobApplication>;
  profiles!: Table<UserProfile>;
  formSchemas!: Table<FormSchema>;

  constructor() {
    super('JobFlowDB');
    this.version(1).stores({
      applications: 'id, company, position, stage, appliedDate',
      profiles: 'id',
      formSchemas: 'id, domain, urlPattern',
    });
  }
}

export const db = new JobFlowDB();
```

### Type Definitions

All types are defined in `src/core/types/index.ts`:

```typescript
// src/core/types/index.ts

// Profile Types
export interface UserProfile {
  id: string;
  personal: PersonalInfo;
  workExperience: WorkExperience[];
  education: Education[];
  skills: string[];
  documents: Document[];
  answers: SavedAnswer[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: Location;
  linkedIn?: string;
  portfolio?: string;
  website?: string;
}

// Application Types
export interface JobApplication {
  id: string;
  company: string;
  position: string;
  source: string;
  sourceUrl?: string;
  appliedDate: string;
  status: ApplicationStatus;
  stage: PipelineStage;
  nextAction?: NextAction;
  notes: string;
  contacts: Contact[];
  followUpDate?: string;
  salary?: Salary;
  createdAt: Date;
  updatedAt: Date;
}

export type ApplicationStatus = 'active' | 'archived' | 'deleted';
export type PipelineStage = 'applied' | 'interviewing' | 'offer' | 'rejected' | 'closed';

// ... more types
```

---

## Adding Features

### Adding a New Feature

1. **Create the feature folder**: `src/features/new-feature/`
2. **Add routes**: Update `App.tsx` with new routes
3. **Create components**: Build UI components in the feature folder
4. **Add store**: Create Zustand store for state management
5. **Update types**: Add any new types to `src/core/types/`

**Example: New Feature Structure**

```
src/features/new-feature/
├── NewFeature.tsx         # Main component
├── new-feature.store.ts  # State management
├── new-feature.types.ts # Types (if needed)
├── components/          # Sub-components
│   ├── FeatureCard.tsx
│   └── FeatureForm.tsx
└── index.ts             # Barrel export
```

### Adding a New UI Component

1. Create component in `src/components/ui/`
2. Use Radix UI primitives for accessibility
3. Style with Tailwind CSS

**Example:**

```tsx
// src/components/ui/Button.tsx
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  className = '',
  children,
  ...props 
}) => {
  const baseStyles = 'px-4 py-2 rounded-lg font-medium transition-colors';
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-white text-blue-600 border border-blue-600',
    ghost: 'text-gray-600 hover:bg-gray-100',
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
```

### Adding a New Data Model

1. **Define types**: Add to `src/core/types/index.ts`
2. **Update database**: Add table to Dexie in `src/core/storage/db.ts`
3. **Create store**: Add Zustand store
4. **Create UI**: Build the feature UI

---

## Browser Extension

### Extension Structure

```
extension/
├── manifest.json          # Extension manifest (v3)
├── background.js          # Service worker
├── content.js            # Content script
├── popup.html            # Popup HTML
├── popup.js              # Popup script
└── icons/               # Extension icons
```

### Manifest Configuration

```json
{
  "manifest_version": 3,
  "name": "JobFlow Autofill",
  "version": "1.0",
  "permissions": [
    "activeTab",
    "storage",
    "notifications"
  ],
  "host_permissions": ["<all_urls>"],
  "action": {
    "default_popup": "popup.html"
  },
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["content.js"]
  }]
}
```

### Form Detection

The content script scans pages for forms:

```javascript
// extension/content.js - Form Detection
const formSelectors = [
  'form[name="apply"]',
  'form[id*="application"]',
  'input[name*="resume"]',
  // ... more selectors
];

function detectForms() {
  const forms = document.querySelectorAll('form');
  return forms.map(form => ({
    action: form.action,
    method: form.method,
    fields: Array.from(form.elements).map(el => ({
      name: el.name,
      type: el.type,
      label: findLabel(el)
    }))
  }));
}
```

### Auto-Fill Logic

```javascript
// extension/content.js - Auto-Fill
function autoFill(profile) {
  const fields = document.querySelectorAll('input, textarea, select');
  
  fields.forEach(field => {
    const value = getProfileValue(field.name, profile);
    if (value) {
      field.value = value;
      // Trigger change event for React/Angular forms
      field.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
}

function getProfileValue(fieldName, profile) {
  const mapping = {
    'email': profile.personal.email,
    'firstName': profile.personal.firstName,
    'lastName': profile.personal.lastName,
    'phone': profile.personal.phone,
    // ... more mappings
  };
  
  return mapping[fieldName.toLowerCase()] || null;
}
```

### Extension ↔ Web Communication

Use Broadcast Channel API:

```javascript
// In extension
const channel = new BroadcastChannel('jobflow-sync');
channel.postMessage({ type: 'APPLICATION_UPDATED', data: app });

// In web app
const channel = new BroadcastChannel('jobflow-sync');
channel.onmessage = (event) => {
  if (event.data.type === 'APPLICATION_UPDATED') {
    // Update local state
  }
};
```

---

## Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run in watch mode
npm run test -- --watch

# Run with coverage
npm run test -- --coverage
```

### Test Structure

Tests live alongside components with `.test.tsx` extension:

```
src/
├── components/
│   └── Button/
│       ├── Button.tsx
│       └── Button.test.tsx
└── features/
    └── applications/
        ├── ApplicationCard.tsx
        └── ApplicationCard.test.tsx
```

### Example Test

```tsx
// src/components/ui/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick handler', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

---

## Building & Deployment

### Building for Production

```bash
# Build the React app
npm run build

# Build the extension
# (The extension files are already in /extension)
```

### Loading the Extension

1. Build: `npm run build`
2. Open Chrome → `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select `jobflow-autofill/extension`

### Deploying the Web App

1. Build: `npm run build`
2. Deploy the `dist` folder to any static host:
   - Vercel
   - Netlify
   - GitHub Pages
   - Any web server

**Example - Vercel:**

```bash
npm i -g vercel
vercel
```

---

## API Reference

### Stores

#### `useProfileStore`

```typescript
// State
profile: UserProfile | null
isLoading: boolean

// Actions
setProfile(profile: UserProfile): void
updatePersonal(updates: Partial<PersonalInfo>): void
addWorkExperience(work: WorkExperience): void
removeWorkExperience(id: string): void
addEducation(edu: Education): void
removeEducation(id: string): void
addSkill(skill: string): void
removeSkill(skill: string): void
addDocument(doc: Document): void
removeDocument(id: string): void
addSavedAnswer(answer: SavedAnswer): void
removeSavedAnswer(id: string): void
```

#### `useApplicationStore`

```typescript
// State
applications: JobApplication[]
isLoading: boolean

// Actions
addApplication(app: JobApplication): void
updateApplication(id: string, updates: Partial<JobApplication>): void
deleteApplication(id: string): void
getApplication(id: string): JobApplication | undefined
getApplicationsByStage(stage: PipelineStage): JobApplication[]
```

#### `useSettingsStore`

```typescript
// State
settings: AppSettings

// Actions
updateSettings(updates: Partial<AppSettings>): void
setTheme(theme: 'light' | 'dark' | 'system'): void
setNotifications(enabled: boolean): void
```

### Database (Dexie)

```typescript
// Applications
db.applications.toArray()
db.applications.add(application)
db.applications.update(id, updates)
db.applications.delete(id)
db.applications.where('stage').equals('applied')

// Profiles
db.profiles.get(id)
db.profiles.put(profile)

// Form Schemas
db.formSchemas.where('domain').equals('linkedin.com')
```

### Events

Custom events for cross-component communication:

```typescript
// Dispatch event
const event = new CustomEvent('application:created', { 
  detail: application 
});
window.dispatchEvent(event);

// Listen for event
window.addEventListener('application:created', (e) => {
  console.log('New application:', e.detail);
});
```

---

## Contributing

### Code Style

- Use TypeScript for all new code
- Follow existing component patterns
- Use Tailwind CSS classes
- Test critical functionality

### Commit Messages

Use conventional commits:

```
feat: add new application form
fix: resolve auto-fill mapping issue  
docs: update API documentation
refactor: simplify application store
test: add tests for profile store
```

### Pull Requests

1. Create a feature branch
2. Make changes
3. Add tests
4. Ensure type-check passes
5. Submit PR

---

## Troubleshooting

### Extension Not Loading

1. Check `chrome://extensions/` for errors
2. Ensure `manifest.json` is valid
3. Rebuild: `npm run build`

### Database Errors

1. Clear IndexedDB: Open DevTools → Application → Storage → Clear
2. Check console for errors

### Type Errors

Run type-check:

```bash
npm run type-check
```

### Build Failures

1. Delete `node_modules` and reinstall
2. Clear build cache: `rm -rf dist`

---

## Additional Resources

- [React Documentation](https://react.dev)
- [Zustand Docs](https://zustand-demo.pmnd.rs/)
- [Dexie Docs](https://dexie.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
