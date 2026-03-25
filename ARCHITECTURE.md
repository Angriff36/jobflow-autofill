# JobFlow Autofill - System Architecture

## 1. Overview

JobFlow Autofill is a local-first job application assistant that combines:
- **Form Autofill**: Browser extension that detects and auto-fills job application forms
- **Application Tracking**: Dashboard to manage job applications through pipeline stages
- **Follow-up Reminders**: Notifications for timely follow-ups

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        JobFlow Autofill                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────┐     ┌──────────────────────────────┐  │
│  │   Browser Extension  │     │        Web Dashboard         │  │
│  │                      │     │                              │  │
│  │  - Form Detection    │     │  - Application Management    │  │
│  │  - Auto-fill         │◄───►│  - Profile Editor            │  │
│  │  - Field Mapping     │     │  - Pipeline View             │  │
│  │                      │     │  - Analytics                 │  │
│  └──────────────────────┘     └──────────────────────────────┘  │
│              │                           │                      │
│              ▼                           ▼                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Local Storage Layer                    │  │
│  │                                                           │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │  │
│  │  │  IndexedDB  │  │ LocalStorage│  │  Extension DB   │   │  │
│  │  │ (Profile,   │  │ (Settings,  │  │  (Form Schemas, │   │  │
│  │  │  Applications)│ │  UI State) │  │   Mappings)     │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Native Notifications Service                  │  │
│  │  - Follow-up reminders                                    │  │
│  │  - Application status updates                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 3. Tech Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Web Framework | React 18 + TypeScript | Type safety, component ecosystem |
| Build Tool | Vite | Fast dev, optimized builds |
| State Management | Zustand | Lightweight, TypeScript-friendly |
| Storage (Local) | Dexie.js (IndexedDB) | Promise-based IndexedDB wrapper |
| Storage (Cloud) | Supabase (PostgreSQL) | Auth, RLS, real-time subscriptions |
| UI Components | Tailwind CSS + Radix UI | Customizable, accessible |
| Browser Extension | Chrome Extension API | Form detection, autofill |
| Notifications | Browser Notifications API | Cross-browser support |
| Date Handling | date-fns | Lightweight date utilities |

## 4. Data Models

### 4.1 User Profile

```typescript
interface UserProfile {
  id: string;
  personal: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    location: {
      address: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    };
    linkedIn?: string;
    portfolio?: string;
    website?: string;
  };
  workExperience: WorkExperience[];
  education: Education[];
  skills: string[];
  documents: Document[];
  answers: SavedAnswer[];
  createdAt: Date;
  updatedAt: Date;
}

interface WorkExperience {
  id: string;
  company: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string | null; // null = current
  description: string;
}

interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  graduationDate: string;
  gpa?: string;
}

interface Document {
  id: string;
  name: string;
  type: 'resume' | 'cover-letter' | 'other';
  content: string; // Base64 or file path
  mimeType: string;
}

interface SavedAnswer {
  id: string;
  question: string;
  answer: string;
  tags: string[];
}
```

### 4.2 Application

```typescript
interface JobApplication {
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
  salary?: {
    amount: number;
    currency: string;
    frequency: 'hourly' | 'yearly';
  };
  createdAt: Date;
  updatedAt: Date;
}

type ApplicationStatus = 'active' | 'archived' | 'deleted';
type PipelineStage = 'applied' | 'interviewing' | 'offer' | 'rejected' | 'closed';

interface NextAction {
  type: 'follow-up' | 'interview' | 'decision' | 'other';
  dueDate: string;
  description: string;
}

interface Contact {
  id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  notes: string;
}
```

### 4.3 Form Schema

```typescript
interface FormSchema {
  id: string;
  domain: string;
  urlPattern: string;
  fieldMappings: FieldMapping[];
  createdAt: Date;
}

interface FieldMapping {
  formField: string; // CSS selector or name
  profileField: string; // Path in UserProfile (e.g., "personal.firstName")
  transform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
}
```

## 5. Module Design

### 5.1 Core Modules

```
src/
├── core/                    # Shared business logic
│   ├── profile/             # Profile management
│   │   ├── profile.service.ts
│   │   ├── profile.store.ts
│   │   └── profile.types.ts
│   ├── applications/        # Application tracking
│   │   ├── application.service.ts
│   │   ├── application.store.ts
│   │   └── application.types.ts
│   ├── auth/                # User authentication (NEW)
│   │   ├── auth.store.ts
│   │   └── auth.hooks.ts
│   ├── notifications/       # Notifications (NEW)
│   │   ├── notifications.store.ts
│   │   └── browser-notifications.ts
│   ├── storage/             # IndexedDB + Supabase abstraction
│   │   ├── db.ts            # IndexedDB (Dexie)
│   │   ├── supabase.ts      # Cloud sync client
│   │   └── repositories/
│   └── sync/                # Cross-context sync (extension ↔ web)
│
├── features/
│   ├── dashboard/          # Main dashboard view
│   ├── profile-editor/     # Profile management UI
│   ├── applications/       # Application list/kanban
│   ├── pipeline/           # Pipeline view
│   └── settings/           # App settings
│
├── components/              # Reusable UI components
├── hooks/                   # Custom React hooks
├── utils/                   # Utility functions
└── lib/                     # Third-party integrations
```

### 5.2 Browser Extension Structure

```
extension/
├── manifest.json
├── background/
│   └── background.ts       # Service worker
├── content/
│   ├── content.ts          # Page injection
│   ├── form-detector.ts    # Form field detection
│   └── autofill.ts         # Auto-fill logic
├── popup/
│   ├── popup.tsx           # Extension popup
│   └── QuickProfile/
└── shared/                 # Shared types/utils
```

## 6. Database Schema

### 6.1 Cloud Database (Supabase)

The cloud database supports optional user authentication and cross-device sync.

#### Tables

| Table | Purpose |
|-------|---------|
| `profiles` | Extended user profile data, sync metadata |
| `user_settings` | User preferences (notifications, autofill, theme) |
| `notifications` | In-app notifications with scheduling |
| `synced_applications` | Cloud backup of job applications |
| `synced_contacts` | Contacts linked to synced applications |

#### Key Relationships

```
auth.users (Supabase)
    └── profiles (1:1)
        ├── user_settings (1:1)
        ├── notifications (1:N)
        └── synced_applications (1:N)
                └── synced_contacts (1:N)
```

#### Row Level Security

All tables use RLS policies ensuring users can only access their own data:
- SELECT: `auth.uid() = user_id`
- INSERT/UPDATE/DELETE: `auth.uid() = user_id`

### 6.2 Local Database (IndexedDB)

Primary storage for offline-first operation.

| Store | Purpose |
|-------|---------|
| `profiles` | User profile data |
| `applications` | Job applications |
| `formSchemas` | Domain-specific form mappings |
| `settings` | App settings |
| `notifications` | Local notifications queue |
| `syncQueue` | Pending sync operations |
| `syncStatus` | Sync state tracking |

### 6.3 Sync Strategy

1. **Offline-first**: All writes go to IndexedDB first
2. **Background sync**: Changes queued in `syncQueue` for cloud sync
3. **Conflict resolution**: Last-write-wins with timestamp comparison
4. **Selective sync**: Users can enable/disable cloud sync per data type

## 7. Key Design Decisions

### 7.1 Local-First with Optional Cloud

**Decision**: Primary storage is IndexedDB; Supabase is optional for auth and sync.

**Rationale**:
- Privacy: Users control what data (if any) is synced to cloud
- Offline-capable: Core functionality works without internet
- Flexibility: Users can use app anonymously or with account
- Future-proof: Cloud sync ready when users want it

### 7.2 Extension ↔ Web Sync

**Decision**: Use `window.postMessage` + Broadcast Channel API for communication between extension and web dashboard.

**Rationale**:
- No backend required
- Works on same origin
- Simple, reliable message passing

### 7.3 Form Detection Strategy

**Decision**: Combination of:
1. Common field name matching (email, phone, company, etc.)
2. Domain-specific schemas (stored mappings for known job sites)
3. Heuristic analysis (label association, placeholder patterns)

**Rationale**: Balances coverage with accuracy. Start with common patterns, let users create custom mappings.

### 7.4 Notification Strategy

**Decision**: Dual notification system:
- **Browser notifications**: Follow-up reminders, application updates via Web Notifications API
- **In-app notifications**: Stored in database, support scheduling and read/unread state

**Rationale**: 
- Browser notifications for time-sensitive alerts even when app is closed
- In-app notifications for persistent record and detailed history

## 8. Security Considerations

1. **Data at Rest**: IndexedDB is origin-isolated; extension has access only to its own storage
2. **Cloud Data**: Supabase RLS ensures users can only access their own data
3. **Sensitive Fields**: Mark fields as sensitive (SSN, salary expectations) for extra confirmation before autofill
4. **Content Security**: Sanitize all user input before rendering
5. **Auth Tokens**: Stored securely via Supabase client with automatic refresh

## 9. Future Considerations (Out of Scope)

- Encrypted cloud sync
- Mobile companion app
- AI-powered cover letter generation
- Application analytics
- Team/recruiter sharing
- Push notifications (PWA)

## 10. Acceptance Criteria

### Core Features
- [ ] User can create and edit profile with all resume fields
- [ ] User can add/edit/delete job applications
- [ ] User can view applications in pipeline/kanban view
- [ ] User receives follow-up reminders
- [ ] Browser extension detects common job application forms
- [ ] Browser extension autofills detected forms from profile
- [ ] All data persists locally between sessions

### User Authentication (NEW)
- [ ] User can sign up with email/password
- [ ] User can sign in with email/password
- [ ] User can sign in with Google/GitHub OAuth
- [ ] User can sign out
- [ ] Session persists across browser sessions
- [ ] User profile syncs to cloud when logged in

### Notifications (NEW)
- [ ] User receives browser notifications for follow-ups
- [ ] User can view notification history in app
- [ ] User can mark notifications as read
- [ ] User can dismiss notifications
- [ ] Notifications can be scheduled for future delivery
- [ ] Notification preferences can be customized
