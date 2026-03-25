# JobFlow Autofill - User Guide

**Version:** 1.0  
**Last Updated:** March 2026

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Setting Up Your Profile](#setting-up-your-profile)
3. [Tracking Applications](#tracking-applications)
4. [Browser Extension](#browser-extension)
5. [Managing Reminders](#managing-reminders)
6. [Settings](#settings)
7. [Privacy & Security](#privacy--security)
8. [Troubleshooting](#troubleshooting)

---

## Getting Started

### What is JobFlow Autofill?

JobFlow Autofill helps you:
- **Save time** by auto-filling job applications
- **Stay organized** by tracking all your applications in one place
- **Never miss a follow-up** with smart reminders

### Installation

#### Web Application

1. Open your browser and navigate to the application
2. Create an account (optional - you can use it anonymously too)
3. Start filling out your profile

#### Browser Extension

1. Build the project: `npm run build`
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the `extension` folder from the project directory

The extension icon will appear in your browser toolbar.

---

## Setting Up Your Profile

Your profile contains all the information needed to auto-fill job applications.

### Accessing Profile Editor

Click **Profile** in the sidebar navigation.

### Sections

#### Personal Information
- **Name**: First and last name
- **Email**: Primary email address
- **Phone**: Contact number
- **Location**: Address, city, state, ZIP, country
- **LinkedIn**: Your LinkedIn profile URL
- **Portfolio**: Link to your portfolio website
- **Website**: Personal website (optional)

#### Work Experience
Click **+ Add Experience** to add each job:

- **Company**: Employer name
- **Title**: Your role
- **Location**: Job location
- **Dates**: Start and end dates (leave end date blank for current job)
- **Description**: Brief description of your responsibilities

#### Education
Click **+ Add Education** for each degree:

- **Institution**: School name
- **Degree**: Type (Bachelor's, Master's, etc.)
- **Field**: Major/field of study
- **Graduation Date**: When you graduated
- **GPA**: Optional

#### Skills
Add skills as tags (e.g., JavaScript, React, Python). These help match your profile to job requirements.

#### Documents
Upload your resume and cover letter:

1. Click **+ Add Document**
2. Choose type (Resume, Cover Letter, or Other)
3. Upload the file
4. The document is stored locally for quick access

#### Saved Answers
Store answers to common application questions:

- **Question**: The question text (e.g., "Why do you want to work here?")
- **Answer**: Your prepared response
- **Tags**: Categories for organization

### Auto-Save

Your profile saves automatically as you type. You'll see a "Saved" indicator.

---

## Tracking Applications

### Adding an Application

1. Click **+ Add** in the Applications section
2. Fill in the details:
   - **Company**: Company name
   - **Position**: Job title
   - **Source**: Where you found the job (LinkedIn, Indeed, Company Website, etc.)
   - **Source URL**: Link to the job posting (optional)
   - **Applied Date**: When you submitted
   - **Stage**: Current pipeline stage
   - **Salary**: Compensation details (optional)
   - **Notes**: Any additional notes

3. Click **Save**

### Pipeline Stages

Applications move through these stages:

| Stage | Description |
|-------|-------------|
| Applied | Application submitted |
| Interviewing | In interview process |
| Offer | Received job offer |
| Rejected | Application rejected |
| Closed | Position filled or not pursuing |

### Views

#### Table View
See all applications in a spreadsheet-like format with columns: Company, Position, Source, Stage, Applied Date.

#### Kanban View
Drag and drop applications between columns to update their stage visually.

#### Calendar View
See applications mapped to a calendar based on follow-up dates and interview schedules.

### Managing Applications

- **Edit**: Click on an application to view details and make changes
- **Archive**: Move inactive applications to archive
- **Delete**: Permanently remove an application
- **Add Contact**: Record hiring manager or recruiter info
- **Set Reminder**: Add follow-up reminders

---

## Browser Extension

### Opening the Extension

Click the JobFlow icon in your browser toolbar, or press the keyboard shortcut.

### Detecting Forms

When you visit a job application page:

1. The extension automatically scans for form fields
2. If detected, you'll see a notification: "Form detected! Click to autofill"
3. Click the notification or the extension icon

### Auto-Filling

1. Click **Auto-Fill** in the extension popup
2. The extension matches form fields to your profile
3. Fields are filled automatically
4. Review and submit the form

### Manual Fill

If auto-fill misses fields:

1. Click on any field in the popup
2. Select which profile section to pull from
3. The field is filled with that data

### Creating Custom Mappings

For sites with unique field names:

1. Click the extension icon
2. Go to **Field Mapping**
3. Enter the form's field name
4. Map it to your profile field
5. Save for future use

### Extension Popup Features

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

## Managing Reminders

### Adding a Reminder

1. Open an application
2. Click **Add Reminder**
3. Choose reminder type:
   - **Follow-up**: When to follow up with employer
   - **Interview**: Interview scheduling
   - **Decision**: When expecting a decision
   - **Other**: Custom reminder
4. Set the due date and description
5. Save

### Notification Types

| Type | When Triggered |
|------|----------------|
| Browser Notification | Shows even when app is closed |
| In-App Notification | Shows when app is open |

### Notification Preferences

Configure in **Settings → Notifications**:

- Enable/disable all notifications
- Set default reminder days (e.g., 7 days after applying)
- Choose notification types

### Viewing Reminders

The **Dashboard** shows upcoming reminders sorted by urgency:

- **Red**: Due within 24 hours
- **Amber**: Due within 3 days
- **Green**: Due later

---

## Settings

Access via the **Settings** link in the sidebar.

### Notifications

| Setting | Description |
|---------|-------------|
| Enable Notifications | Turn all notifications on/off |
| Follow-up Reminder Days | Days after applying to remind |
| Browser Notifications | Show desktop notifications |
| Email Notifications | Receive email reminders |

### Autofill

| Setting | Description |
|---------|-------------|
| Auto-Fill Forms | Automatically fill when form detected |
| Confirm Before Fill | Show confirmation dialog |
| Auto-Submit | Submit form after filling (use with caution) |

### Appearance

| Setting | Description |
|---------|-------------|
| Theme | Light, Dark, or System |
| Compact Mode | Show more content with less spacing |

### Data

| Action | Description |
|--------|-------------|
| Export Data | Download all your data as JSON |
| Import Data | Restore from a backup |
| Clear All Data | Delete all local data |

### Account

- **Sign Up**: Create an account for cloud sync
- **Sign In**: Log in to existing account
- **Sign Out**: Log out (keeps local data)
- **Delete Account**: Remove account and all cloud data

---

## Privacy & Security

### Data Storage

- **Local First**: All data is stored in your browser's IndexedDB
- **Your Device**: Data never leaves your device unless you enable cloud sync
- **Optional Sync**: Cloud sync requires an account and is opt-in

### Cloud Sync

When enabled:

- Profile data syncs to Supabase
- Applications can be backed up to the cloud
- Sync across devices (coming soon)

### What We Don't Do

- ❌ We never sell your data
- ❌ We never share your information with employers
- ❌ We don't access your data without your permission
- ❌ We don't store sensitive fields (SSN, etc.) without extra confirmation

### Deleting Your Data

- **Local**: Use "Clear All Data" in Settings
- **Cloud**: Delete your account (Settings → Account → Delete Account)

---

## Troubleshooting

### Extension Not Working

1. **Check if enabled**: Right-click extension icon → "Manage Extensions" → Enable
2. **Reload page**: Refresh the job application page
3. **Check permissions**: Ensure "Access to all sites" is allowed
4. **Rebuild**: Run `npm run build` and reload extension

### Auto-Fill Missing Fields

1. **Check profile**: Ensure the field exists in your profile
2. **Create mapping**: Use Field Mapping to link the form field
3. **Manual fill**: Use the popup to manually select data

### Notifications Not Showing

1. **Check browser permissions**: Allow notifications for the site
2. **Check settings**: Ensure notifications are enabled
3. **Check OS notifications**: Ensure system notifications aren't blocked

### Data Not Saving

1. **Check storage**: Browser storage may be full
2. **Clear cache**: Try clearing browser data
3. **Export backup**: Save your data before clearing

### Lost Data After Clearing Cache

If you cleared browser data and lost local data:

1. If logged in: Sign back in to restore from cloud
2. If not logged in: Data cannot be recovered (this is why we recommend exporting backups)

---

## Getting Help

- **Documentation**: Check this guide first
- **Report Bugs**: Open an issue on the project
- **Feature Requests**: Suggest new features

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + N` | New application |
| `Ctrl/Cmd + S` | Save current form |
| `Ctrl/Cmd + /` | Command palette |
| `Esc` | Close modal/panel |
