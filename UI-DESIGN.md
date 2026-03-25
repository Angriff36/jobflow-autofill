# JobFlow Autofill - UI/UX Design Specification

**Created by:** Scribe  
**Date:** March 20, 2026  
**Project:** JobFlow Autofill  
**Client:** Ryan Cort

---

## 1. Design Philosophy

### Core Principles
- **Local-first aesthetic**: Clean, trustworthy, privacy-focused design that communicates "your data stays yours"
- **Efficiency-first**: Minimize friction for high-volume job seekers who spend hours in the app
- **Calm productivity**: Reduce anxiety around job hunting with clear organization and actionable insights

### Visual Identity

| Attribute | Value |
|-----------|-------|
| Primary Color | `#2563EB` (Blue 600) - Trust, professionalism |
| Secondary Color | `#10B981` (Emerald 500) - Success, progress |
| Accent Color | `#F59E0B` (Amber 500) - Action, reminders |
| Error Color | `#EF4444` (Red 500) |
| Background Light | `#F8FAFC` (Slate 50) |
| Background Dark | `#0F172A` (Slate 900) |
| Text Primary Light | `#1E293B` (Slate 800) |
| Text Primary Dark | `#F1F5F9` (Slate 100) |
| Border Color | `#E2E8F0` (Slate 200) |

### Typography

| Element | Font | Weight | Size |
|---------|------|--------|------|
| Headings | Inter | 600-700 | 24-32px |
| Body | Inter | 400 | 14-16px |
| Labels | Inter | 500 | 12-14px |
| Monospace (code) | JetBrains Mono | 400 | 13px |

---

## 2. Layout Structure

### Main Application Shell

```
┌─────────────────────────────────────────────────────────────┐
│ Header: Logo | Search | Notifications | Profile Avatar      │
├────────────┬────────────────────────────────────────────────┤
│            │                                                │
│  Sidebar   │              Main Content Area               │
│            │                                                │
│  - Dashboard│                                              │
│  - Profile  │                                              │
│  - Jobs     │                                              │
│  - Settings │                                              │
│            │                                                │
└────────────┴────────────────────────────────────────────────┘
```

**Dimensions:**
- Sidebar: 240px fixed width (collapsible to 64px icons-only on mobile)
- Header: 56px fixed height
- Content: Fluid, max-width 1280px centered
- Spacing unit: 4px base (multiples: 8, 12, 16, 24, 32, 48)

### Responsive Breakpoints
- **Mobile**: < 640px (sidebar hidden, hamburger menu)
- **Tablet**: 640px - 1024px (collapsed sidebar)
- **Desktop**: > 1024px (full sidebar)

---

## 3. Page Designs

### 3.1 Dashboard

**Purpose:** At-a-glance view of job search progress and upcoming actions

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Welcome back, [Name]!                    [This Week ▼]     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Applied  │ │ Interview│ │  Offers  │ │  Rate   │       │
│  │    47    │ │    12    │ │    3    │ │  28%    │       │
│  │  +5 this │ │  +2 this │ │   this   │ │ vs 22%  │       │
│  │   week   │ │   week   │ │   month  │ │ last mo │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                             │
│  ┌─────────────────────────┐ ┌─────────────────────────┐  │
│  │    Upcoming Actions     │ │    Recent Activity     │  │
│  │  • Follow up: Tech Co   │ │  • Applied: Startup X  │  │
│  │  • Interview: BigTech   │ │  • Interview: FinTech  │  │
│  │  • Deadline: 2 days     │ │  • Profile updated     │  │
│  └─────────────────────────┘ └─────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              Application Pipeline (Kanban)            │  │
│  │  Applied → Interviewing → Offer → Rejected           │  │
│  │  [cards]    [cards]       [cards]   [cards]         │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Components:**
- **Stat Cards**: Rounded corners (8px), subtle shadow, icon + number + trend indicator
- **Upcoming Actions List**: Chronological with urgency indicators (red = < 24hr, amber = < 3 days)
- **Pipeline Kanban**: Horizontal scrollable columns, drag-and-drop cards

### 3.2 Profile Editor

**Purpose:** Manage personal info, work history, education, skills, documents, and saved answers

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Profile Editor                              [Save] [Clear] │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│  ○ Personal │  ┌────────────────────────────────────────┐  │
│  ○ Work     │  │ First Name  │  Last Name              │  │
│  ○ Education│  ├────────────────────────────────────────┤  │
│  ○ Skills   │  │ Email       │  Phone                  │  │
│  ○ Docs     │  ├────────────────────────────────────────┤  │
│  ○ Answers  │  │ Address                              │  │
│              │  │ City        │  State    │  ZIP       │  │
│              │  ├────────────────────────────────────────┤  │
│              │  │ LinkedIn    │  Portfolio               │  │
│              │  └────────────────────────────────────────┘  │
│              │                                              │
│              │  [Section 2: Work Experience]                │
│              │  ┌────────────────────────────────────────┐  │
│              │  │ Company   │ Title        │ [+] [-]     │  │
│              │  │ Duration  │ Description  │             │  │
│              │  └────────────────────────────────────────┘  │
│              │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

**Features:**
- Tabbed navigation for each profile section
- Inline add/remove for repeatable sections (work, education)
- Auto-save indicator (saved/saving/error)
- Document upload with drag-and-drop
- Saved answers with tagging for reuse

### 3.3 Applications (Job Tracker)

**Purpose:** Track all job applications through the pipeline

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Applications                                    [+ Add]    │
├─────────────────────────────────────────────────────────────┤
│ [Search...        ] [Source ▼] [Status ▼] [Stage ▼] [View] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Table View / Kanban View / Calendar View                  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Company     │ Position │ Source │ Stage │ Applied  │   │
│  ├─────────────┼──────────┼────────┼───────┼─────────┤   │
│  │ Tech Corp   │ Dev      │ LinkedIn│ Inter │ Mar 15  │   │
│  │ Startup X   │ PM       │ Indeed │ Applie │ Mar 18  │   │
│  │ Big Finance │ Analyst  │ Site   │ Offer │ Mar 10  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Selected: Tech Corp                                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Company: Tech Corp     Position: Software Engineer │   │
│  │ Source: LinkedIn        Applied: Mar 15, 2026      │   │
│  │ Stage: Interviewing     Next Action: Follow-up      │   │
│  │ Due: Mar 22, 2026                                  │   │
│  │                                                    │   │
│  │ Notes: [multi-line text area]                      │   │
│  │ Contacts: John (HR) - john@techcorp.com           │   │
│  │                                    [Delete] [Save]  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Multi-view toggle (table/kanban/calendar)
- Inline editing for quick updates
- Bulk actions (archive, delete, change stage)
- Side panel for detailed view/edit

### 3.4 Settings

**Purpose:** Configure app behavior, notifications, and preferences

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Settings                                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Notifications                                        │  │
│  │  [Toggle] Enable notifications                       │  │
│  │  Reminder days before follow-up: [3 ▼] days         │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Autofill                                             │  │
│  │  [Toggle] Auto-fill forms automatically             │  │
│  │  [Toggle] Confirm before filling                    │  │
│  │  [Toggle] Auto-submit after fill                    │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Appearance                                           │  │
│  │  Theme: (○) Light  (●) Dark  (○) System            │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Data                                                 │  │
│  │  [Export Data] [Import Data] [Clear All Data]      │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Extension                                            │  │
│  │  Status: Connected                                  │  │
│  │  Last sync: 5 minutes ago                           │  │
│  │  [Reconnect Extension]                              │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Component Library

### Buttons
| Variant | Use Case | Style |
|---------|----------|-------|
| Primary | Main actions | Blue bg, white text, 8px radius |
| Secondary | Secondary actions | White bg, blue border, blue text |
| Ghost | Tertiary actions | Transparent, gray text |
| Danger | Destructive actions | Red bg, white text |
| Icon | Toolbar actions | 40x40px, rounded |

### Form Inputs
- **Text Input**: 40px height, 8px radius, slate-200 border, focus ring blue-500
- **Select**: Same as text with chevron icon
- **Textarea**: Min-height 100px, resize vertical
- **Toggle**: 44x24px, blue when on
- **Checkbox/Radio**: Custom styled, blue accent

### Cards
- Background: white (light) / slate-800 (dark)
- Border: 1px slate-200 (light) / slate-700 (dark)
- Shadow: `0 1px 3px rgba(0,0,0,0.1)`
- Radius: 8px

### Navigation
- **Sidebar Item**: 40px height, 8px radius, icon + label, hover:bg-slate-100
- **Tabs**: Underline style, blue active indicator

### Feedback
- **Toast**: Bottom-right, auto-dismiss 5s, blue/red/green/amber variants
- **Modal**: Centered, backdrop blur, max-width 500px
- **Empty State**: Centered illustration + message + CTA

---

## 5. Interaction Patterns

### Drag and Drop
- Applications can be dragged between pipeline stages
- Visual feedback: opacity 0.5 while dragging, drop zone highlight
- Touch-friendly hit areas (min 44px)

### Inline Editing
- Click to edit (transforms text to input)
- Enter to save, Escape to cancel
- Auto-save for form sections

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `Ctrl/Cmd + N` | New application |
| `Ctrl/Cmd + S` | Save current form |
| `Ctrl/Cmd + /` | Open command palette |
| `Esc` | Close modal/panel |

---

## 6. Extension Popup UI

**Dimensions:** 360px width × 500px height

**Layout:**
```
┌────────────────────────────────────┐
│  [Logo] JobFlow          [⚙️]     │
├────────────────────────────────────┤
│  [🔍 Detect Forms]  [▶️ Auto-fill]│
├────────────────────────────────────┤
│  Recent Applications               │
│  ┌────────────────────────────────┐│
│  │ Tech Corp - Software Engineer ││
│  │ Applied: Today        [Fill]  ││
│  ├────────────────────────────────┤│
│  │ Startup X - PM                ││
│  │ Applied: Yesterday    [Fill]  ││
│  └────────────────────────────────┘│
├────────────────────────────────────┤
│  [Open Dashboard]                  │
└────────────────────────────────────┘
```

---

## 7. Animations & Transitions

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Page transitions | Fade + slide | 200ms | ease-out |
| Card hover | Scale 1.02 + shadow | 150ms | ease |
| Button press | Scale 0.98 | 100ms | ease |
| Modal open | Fade + scale from 0.95 | 200ms | ease-out |
| Sidebar collapse | Width transition | 200ms | ease-in-out |
| Drag start | Scale 1.05 + shadow | 150ms | ease |
| Drop | Scale back + position snap | 200ms | ease-out |

---

## 8. Accessibility

- All interactive elements: min 44×44px touch target
- Color contrast: WCAG AA (4.5:1 for text, 3:1 for large text)
- Focus indicators: 2px blue outline
- Screen reader labels on all icons
- Keyboard navigation throughout
- Reduced motion support (`prefers-reduced-motion`)

---

## 9. Implementation Notes

### Dependencies to Add
- `@radix-ui/react-*` components (dialog, dropdown, tabs, toggle, etc.)
- `framer-motion` for animations
- `react-beautiful-dnd` or `@dnd-kit` for kanban
- `date-fns` for date formatting
- `react-hook-form` for form state
- `zod` for validation

### File Structure Update
```
src/
├── components/
│   ├── ui/                    # Base UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   └── ...
│   ├── Layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Shell.tsx
│   └── ...
├── hooks/
│   ├── useAutoSave.ts
│   ├── useKeyboard.ts
│   └── ...
└── lib/
    ├── utils.ts
    └── constants.ts
```

---

## 10. Acceptance Criteria

- [ ] Dashboard displays accurate stats from IndexedDB
- [ ] Profile editor saves all sections correctly
- [ ] Applications can be added, edited, deleted, and moved between stages
- [ ] Settings persist and apply immediately
- [ ] Dark mode toggles all components correctly
- [ ] Extension popup connects to web app via Broadcast Channel
- [ ] All forms validate input before saving
- [ ] Empty states guide users to create content
- [ ] Responsive layout works on mobile/tablet/desktop
- [ ] Keyboard navigation works for all major flows
