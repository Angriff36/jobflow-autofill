import { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import { profileRepository, initializeDatabase } from '@/core/storage/db'
import type {
  UserProfile,
  PersonalInfo,
  WorkExperience,
  Education,
  SavedAnswer,
} from '@/core/types'
import type { Document as ProfileDocument } from '@/core/types'
import * as Tabs from '@radix-ui/react-tabs'
import {
  Plus,
  Trash2,
  Save,
  X,
  Upload,
  FileText,
  File,
  MessageSquare,
  User,
  Briefcase,
  GraduationCap,
  Tags,
  Paperclip,
  CheckCircle,
  AlertCircle,
  Loader2,
  Info,
  Zap,
} from 'lucide-react'

// ============================================================================
// Types & Helpers
// ============================================================================

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

const emptyProfile = (): Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'> => ({
  personal: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: { address: '', city: '', state: '', zip: '', country: 'US' },
    linkedIn: '',
    portfolio: '',
    website: '',
  },
  workExperience: [],
  education: [],
  skills: [],
  documents: [],
  answers: [],
})

const TABS = [
  { value: 'personal', label: 'Personal', icon: User },
  { value: 'work', label: 'Work Experience', icon: Briefcase },
  { value: 'education', label: 'Education', icon: GraduationCap },
  { value: 'skills', label: 'Skills', icon: Tags },
  { value: 'documents', label: 'Documents', icon: Paperclip },
  { value: 'answers', label: 'Saved Answers', icon: MessageSquare },
] as const

function computeCompleteness(profile: UserProfile): number {
  let filled = 0
  let total = 0

  // Personal fields
  const p = profile.personal
  const personalFields = [p.firstName, p.lastName, p.email, p.phone, p.location.city]
  total += personalFields.length
  filled += personalFields.filter(Boolean).length

  // Work experience
  total += 1
  if (profile.workExperience.length > 0) filled += 1

  // Education
  total += 1
  if (profile.education.length > 0) filled += 1

  // Skills
  total += 1
  if (profile.skills.length > 0) filled += 1

  // Documents
  total += 1
  if (profile.documents.length > 0) filled += 1

  return Math.round((filled / total) * 100)
}

// ============================================================================
// Main Component
// ============================================================================

export function ProfileEditor() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [activeTab, setActiveTab] = useState('personal')
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    initializeDatabase().then(loadProfile)
  }, [])

  useEffect(() => {
    if (saveStatus === 'saved') {
      const t = setTimeout(() => setSaveStatus('idle'), 3000)
      return () => clearTimeout(t)
    }
  }, [saveStatus])

  async function loadProfile() {
    try {
      const existing = await profileRepository.get()
      if (existing) {
        setProfile(existing)
      } else {
        setProfile({
          id: crypto.randomUUID(),
          ...emptyProfile(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }
    } catch (error) {
      console.error('Failed to load profile:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!profile) return
    setSaveStatus('saving')
    try {
      await profileRepository.save({ ...profile, updatedAt: new Date() })
      
      // Sync profile to extension via BroadcastChannel
      try {
        const channel = new BroadcastChannel('jobflow-sync')
        channel.postMessage({ type: 'PROFILE_UPDATED', payload: profile })
        channel.close()
      } catch (_) { /* BroadcastChannel not available */ }

      // Also write to localStorage as fallback for extension popup
      try {
        localStorage.setItem('jobflow_profile', JSON.stringify(profile))
      } catch (_) { /* storage full */ }

      setSaveStatus('saved')
    } catch (error) {
      console.error('Failed to save profile:', error)
      setSaveStatus('error')
    }
  }

  const scheduleAutoSave = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {}, 2000)
  }, [])

  function updateProfile(updater: (p: UserProfile) => UserProfile) {
    setProfile((prev) => {
      if (!prev) return prev
      return updater(prev)
    })
    scheduleAutoSave()
  }

  function updatePersonal(field: keyof PersonalInfo, value: string) {
    updateProfile((p) => ({
      ...p,
      personal: { ...p.personal, [field]: value },
    }))
  }

  function updateLocation(field: keyof PersonalInfo['location'], value: string) {
    updateProfile((p) => ({
      ...p,
      personal: {
        ...p.personal,
        location: { ...p.personal.location, [field]: value },
      },
    }))
  }

  function addWorkExperience() {
    updateProfile((p) => ({
      ...p,
      workExperience: [
        ...p.workExperience,
        {
          id: crypto.randomUUID(),
          company: '',
          title: '',
          location: '',
          startDate: '',
          endDate: null,
          description: '',
        },
      ],
    }))
  }

  function updateWorkExperience(id: string, field: keyof WorkExperience, value: string | null) {
    updateProfile((p) => ({
      ...p,
      workExperience: p.workExperience.map((exp) =>
        exp.id === id ? { ...exp, [field]: value } : exp
      ),
    }))
  }

  function removeWorkExperience(id: string) {
    updateProfile((p) => ({
      ...p,
      workExperience: p.workExperience.filter((exp) => exp.id !== id),
    }))
  }

  function addEducation() {
    updateProfile((p) => ({
      ...p,
      education: [
        ...p.education,
        {
          id: crypto.randomUUID(),
          institution: '',
          degree: '',
          field: '',
          graduationDate: '',
          gpa: '',
        },
      ],
    }))
  }

  function updateEducation(id: string, field: keyof Education, value: string) {
    updateProfile((p) => ({
      ...p,
      education: p.education.map((edu) =>
        edu.id === id ? { ...edu, [field]: value } : edu
      ),
    }))
  }

  function removeEducation(id: string) {
    updateProfile((p) => ({
      ...p,
      education: p.education.filter((edu) => edu.id !== id),
    }))
  }

  function addSkill(skill: string) {
    const trimmed = skill.trim()
    if (!trimmed) return
    updateProfile((p) => {
      if (p.skills.includes(trimmed)) return p
      return { ...p, skills: [...p.skills, trimmed] }
    })
  }

  function removeSkill(skill: string) {
    updateProfile((p) => ({
      ...p,
      skills: p.skills.filter((s) => s !== skill),
    }))
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, docType: ProfileDocument['type']) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1] || ''
      updateProfile((p) => ({
        ...p,
        documents: [
          ...p.documents,
          {
            id: crypto.randomUUID(),
            name: file.name,
            type: docType,
            content: base64,
            mimeType: file.type,
          },
        ],
      }))
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function removeDocument(id: string) {
    updateProfile((p) => ({
      ...p,
      documents: p.documents.filter((d) => d.id !== id),
    }))
  }

  function addAnswer() {
    updateProfile((p) => ({
      ...p,
      answers: [
        ...p.answers,
        {
          id: crypto.randomUUID(),
          question: '',
          answer: '',
          tags: [],
        },
      ],
    }))
  }

  function updateAnswer(id: string, field: keyof SavedAnswer, value: string | string[]) {
    updateProfile((p) => ({
      ...p,
      answers: p.answers.map((a) => (a.id === id ? { ...a, [field]: value } : a)),
    }))
  }

  function removeAnswer(id: string) {
    updateProfile((p) => ({
      ...p,
      answers: p.answers.filter((a) => a.id !== id),
    }))
  }

  function addAnswerTag(answerId: string, tag: string) {
    const trimmed = tag.trim()
    if (!trimmed) return
    updateProfile((p) => ({
      ...p,
      answers: p.answers.map((a) => {
        if (a.id !== answerId) return a
        if (a.tags.includes(trimmed)) return a
        return { ...a, tags: [...a.tags, trimmed] }
      }),
    }))
  }

  function removeAnswerTag(answerId: string, tag: string) {
    updateProfile((p) => ({
      ...p,
      answers: p.answers.map((a) => {
        if (a.id !== answerId) return a
        return { ...a, tags: a.tags.filter((t) => t !== tag) }
      }),
    }))
  }

  const completeness = useMemo(() => profile ? computeCompleteness(profile) : 0, [profile])

  // ============================================================================
  // Render
  // ============================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-sm text-muted-foreground">Loading profile...</span>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <AlertCircle className="w-6 h-6 text-destructive" />
        <span className="ml-2">Error loading profile</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Profile Editor</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Complete your profile so the extension can autofill job applications.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SaveStatusIndicator status={saveStatus} />
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all text-sm font-semibold shadow-sm"
          >
            <Save className="w-4 h-4" />
            {saveStatus === 'saving' ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>

      {/* Profile Completeness */}
      <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-foreground">Profile Completeness</span>
          </div>
          <span className={`text-sm font-bold ${
            completeness >= 80 ? 'text-emerald-600' : completeness >= 50 ? 'text-amber-600' : 'text-red-500'
          }`}>{completeness}%</span>
        </div>
        <div className="h-2 bg-accent rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              completeness >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
              completeness >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
              'bg-gradient-to-r from-red-400 to-red-500'
            }`}
            style={{ width: `${completeness}%` }}
          />
        </div>
        {completeness < 80 && (
          <p className="text-xs text-muted-foreground mt-2">
            Complete your profile to improve autofill accuracy. Fields marked with <Zap className="w-3 h-3 inline text-blue-500" /> are used by the extension.
          </p>
        )}
      </div>

      {/* Tabbed Content */}
      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List className="flex gap-1 p-1 bg-accent/50 rounded-xl mb-6 overflow-x-auto" aria-label="Profile sections">
          {TABS.map((tab) => (
            <Tabs.Trigger
              key={tab.value}
              value={tab.value}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-muted-foreground rounded-lg transition-all whitespace-nowrap hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="personal">
          <PersonalInfoSection
            personal={profile.personal}
            onUpdatePersonal={updatePersonal}
            onUpdateLocation={updateLocation}
          />
        </Tabs.Content>

        <Tabs.Content value="work">
          <WorkExperienceSection
            experiences={profile.workExperience}
            onAdd={addWorkExperience}
            onUpdate={updateWorkExperience}
            onRemove={removeWorkExperience}
          />
        </Tabs.Content>

        <Tabs.Content value="education">
          <EducationSection
            education={profile.education}
            onAdd={addEducation}
            onUpdate={updateEducation}
            onRemove={removeEducation}
          />
        </Tabs.Content>

        <Tabs.Content value="skills">
          <SkillsSection
            skills={profile.skills}
            onAdd={addSkill}
            onRemove={removeSkill}
          />
        </Tabs.Content>

        <Tabs.Content value="documents">
          <DocumentsSection
            documents={profile.documents}
            onUpload={handleFileUpload}
            onRemove={removeDocument}
          />
        </Tabs.Content>

        <Tabs.Content value="answers">
          <SavedAnswersSection
            answers={profile.answers}
            onAdd={addAnswer}
            onUpdate={updateAnswer}
            onRemove={removeAnswer}
            onAddTag={addAnswerTag}
            onRemoveTag={removeAnswerTag}
          />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}

// ============================================================================
// Sub-Components
// ============================================================================

function SaveStatusIndicator({ status }: { status: SaveStatus }) {
  if (status === 'idle') return null
  return (
    <span className="flex items-center gap-1.5 text-sm">
      {status === 'saving' && (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Saving...</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <span className="text-emerald-600">Saved</span>
        </>
      )}
      {status === 'error' && (
        <>
          <AlertCircle className="w-4 h-4 text-destructive" />
          <span className="text-destructive">Error saving</span>
        </>
      )}
    </span>
  )
}

// ---- Reusable Input ----

function FormField({
  label,
  children,
  className = '',
  autofill,
  hint,
}: {
  label: string
  children: React.ReactNode
  className?: string
  autofill?: boolean
  hint?: string
}) {
  return (
    <div className={className}>
      <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5">
        {label}
        {autofill && (
          <span title="Used by the extension for autofill" className="inline-flex">
            <Zap className="w-3 h-3 text-blue-500" />
          </span>
        )}
        {hint && (
          <span title={hint} className="inline-flex cursor-help">
            <Info className="w-3 h-3 text-muted-foreground" />
          </span>
        )}
      </label>
      {children}
    </div>
  )
}

const inputClass =
  'w-full px-3 py-2.5 border border-border rounded-lg bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 placeholder:text-muted-foreground/50 transition-all'

// ---- Personal Info ----

function PersonalInfoSection({
  personal,
  onUpdatePersonal,
  onUpdateLocation,
}: {
  personal: PersonalInfo
  onUpdatePersonal: (field: keyof PersonalInfo, value: string) => void
  onUpdateLocation: (field: keyof PersonalInfo['location'], value: string) => void
}) {
  return (
    <section className="p-6 bg-card rounded-xl border border-border shadow-sm">
      <h3 className="text-lg font-semibold text-foreground mb-5">Personal Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="First Name" autofill>
          <input
            type="text"
            value={personal.firstName}
            onChange={(e) => onUpdatePersonal('firstName', e.target.value)}
            className={inputClass}
            placeholder="John"
          />
        </FormField>
        <FormField label="Last Name" autofill>
          <input
            type="text"
            value={personal.lastName}
            onChange={(e) => onUpdatePersonal('lastName', e.target.value)}
            className={inputClass}
            placeholder="Doe"
          />
        </FormField>
        <FormField label="Email" autofill>
          <input
            type="email"
            value={personal.email}
            onChange={(e) => onUpdatePersonal('email', e.target.value)}
            className={inputClass}
            placeholder="john@example.com"
          />
        </FormField>
        <FormField label="Phone" autofill>
          <input
            type="tel"
            value={personal.phone}
            onChange={(e) => onUpdatePersonal('phone', e.target.value)}
            className={inputClass}
            placeholder="(555) 123-4567"
          />
        </FormField>
      </div>

      <h4 className="text-base font-semibold text-foreground mt-7 mb-4">Location</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Address" className="md:col-span-2" autofill>
          <input
            type="text"
            value={personal.location.address}
            onChange={(e) => onUpdateLocation('address', e.target.value)}
            className={inputClass}
            placeholder="123 Main St"
          />
        </FormField>
        <FormField label="City" autofill>
          <input
            type="text"
            value={personal.location.city}
            onChange={(e) => onUpdateLocation('city', e.target.value)}
            className={inputClass}
            placeholder="San Francisco"
          />
        </FormField>
        <FormField label="State" autofill>
          <input
            type="text"
            value={personal.location.state}
            onChange={(e) => onUpdateLocation('state', e.target.value)}
            className={inputClass}
            placeholder="CA"
          />
        </FormField>
        <FormField label="ZIP Code" autofill>
          <input
            type="text"
            value={personal.location.zip}
            onChange={(e) => onUpdateLocation('zip', e.target.value)}
            className={inputClass}
            placeholder="94102"
          />
        </FormField>
        <FormField label="Country" autofill>
          <input
            type="text"
            value={personal.location.country}
            onChange={(e) => onUpdateLocation('country', e.target.value)}
            className={inputClass}
            placeholder="US"
          />
        </FormField>
      </div>

      <h4 className="text-base font-semibold text-foreground mt-7 mb-4">Online Presence</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="LinkedIn" autofill hint="Many applications ask for your LinkedIn URL">
          <input
            type="url"
            value={personal.linkedIn || ''}
            onChange={(e) => onUpdatePersonal('linkedIn', e.target.value)}
            className={inputClass}
            placeholder="https://linkedin.com/in/johndoe"
          />
        </FormField>
        <FormField label="Portfolio" hint="Your portfolio or project showcase">
          <input
            type="url"
            value={personal.portfolio || ''}
            onChange={(e) => onUpdatePersonal('portfolio', e.target.value)}
            className={inputClass}
            placeholder="https://johndoe.dev"
          />
        </FormField>
        <FormField label="Website" className="md:col-span-2" autofill>
          <input
            type="url"
            value={personal.website || ''}
            onChange={(e) => onUpdatePersonal('website', e.target.value)}
            className={inputClass}
            placeholder="https://example.com"
          />
        </FormField>
      </div>
    </section>
  )
}

// ---- Work Experience ----

function WorkExperienceSection({
  experiences,
  onAdd,
  onUpdate,
  onRemove,
}: {
  experiences: WorkExperience[]
  onAdd: () => void
  onUpdate: (id: string, field: keyof WorkExperience, value: string | null) => void
  onRemove: (id: string) => void
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Work Experience</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Add your work history for autofill.</p>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {experiences.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No work experience added"
          description="Add your work history to auto-fill job applications."
          actionLabel="Add Experience"
          onAction={onAdd}
        />
      ) : (
        <div className="space-y-4">
          {experiences.map((exp, index) => (
            <div key={exp.id} className="p-5 bg-card rounded-xl border border-border shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Position {index + 1}
                </span>
                <button
                  onClick={() => onRemove(exp.id)}
                  className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Company" autofill>
                  <input
                    type="text"
                    value={exp.company}
                    onChange={(e) => onUpdate(exp.id, 'company', e.target.value)}
                    className={inputClass}
                    placeholder="Acme Inc."
                  />
                </FormField>
                <FormField label="Title" autofill>
                  <input
                    type="text"
                    value={exp.title}
                    onChange={(e) => onUpdate(exp.id, 'title', e.target.value)}
                    className={inputClass}
                    placeholder="Software Engineer"
                  />
                </FormField>
                <FormField label="Location">
                  <input
                    type="text"
                    value={exp.location}
                    onChange={(e) => onUpdate(exp.id, 'location', e.target.value)}
                    className={inputClass}
                    placeholder="San Francisco, CA"
                  />
                </FormField>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Start Date">
                    <input
                      type="month"
                      value={exp.startDate}
                      onChange={(e) => onUpdate(exp.id, 'startDate', e.target.value)}
                      className={inputClass}
                    />
                  </FormField>
                  <FormField label="End Date">
                    <div className="space-y-1.5">
                      <input
                        type="month"
                        value={exp.endDate || ''}
                        onChange={(e) =>
                          onUpdate(exp.id, 'endDate', e.target.value || null)
                        }
                        disabled={exp.endDate === null}
                        className={`${inputClass} disabled:opacity-50`}
                      />
                      <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={exp.endDate === null}
                          onChange={(e) =>
                            onUpdate(exp.id, 'endDate', e.target.checked ? null : '')
                          }
                          className="rounded border-border"
                        />
                        Current position
                      </label>
                    </div>
                  </FormField>
                </div>
                <FormField label="Description" className="md:col-span-2" hint="Key responsibilities and achievements">
                  <textarea
                    value={exp.description}
                    onChange={(e) => onUpdate(exp.id, 'description', e.target.value)}
                    className={`${inputClass} min-h-[100px] resize-y`}
                    placeholder="Describe your responsibilities and achievements..."
                  />
                </FormField>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

// ---- Education ----

function EducationSection({
  education,
  onAdd,
  onUpdate,
  onRemove,
}: {
  education: Education[]
  onAdd: () => void
  onUpdate: (id: string, field: keyof Education, value: string) => void
  onRemove: (id: string) => void
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Education</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Add your educational background.</p>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {education.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No education added"
          description="Add your educational background to complete your profile."
          actionLabel="Add Education"
          onAction={onAdd}
        />
      ) : (
        <div className="space-y-4">
          {education.map((edu, index) => (
            <div key={edu.id} className="p-5 bg-card rounded-xl border border-border shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Education {index + 1}
                </span>
                <button
                  onClick={() => onRemove(edu.id)}
                  className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Institution" autofill>
                  <input
                    type="text"
                    value={edu.institution}
                    onChange={(e) => onUpdate(edu.id, 'institution', e.target.value)}
                    className={inputClass}
                    placeholder="University of California"
                  />
                </FormField>
                <FormField label="Degree" autofill>
                  <input
                    type="text"
                    value={edu.degree}
                    onChange={(e) => onUpdate(edu.id, 'degree', e.target.value)}
                    className={inputClass}
                    placeholder="Bachelor of Science"
                  />
                </FormField>
                <FormField label="Field of Study" autofill>
                  <input
                    type="text"
                    value={edu.field}
                    onChange={(e) => onUpdate(edu.id, 'field', e.target.value)}
                    className={inputClass}
                    placeholder="Computer Science"
                  />
                </FormField>
                <FormField label="Graduation Date">
                  <input
                    type="month"
                    value={edu.graduationDate}
                    onChange={(e) => onUpdate(edu.id, 'graduationDate', e.target.value)}
                    className={inputClass}
                  />
                </FormField>
                <FormField label="GPA" hint="Optional but some applications require it">
                  <input
                    type="text"
                    value={edu.gpa || ''}
                    onChange={(e) => onUpdate(edu.id, 'gpa', e.target.value)}
                    className={inputClass}
                    placeholder="3.8"
                  />
                </FormField>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

// ---- Skills ----

function SkillsSection({
  skills,
  onAdd,
  onRemove,
}: {
  skills: string[]
  onAdd: (skill: string) => void
  onRemove: (skill: string) => void
}) {
  const [input, setInput] = useState('')

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (input.trim()) {
        onAdd(input)
        setInput('')
      }
    }
    if (e.key === 'Backspace' && input === '' && skills.length > 0) {
      onRemove(skills[skills.length - 1])
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData('text')
    if (text.includes(',')) {
      e.preventDefault()
      text
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach(onAdd)
      setInput('')
    }
  }

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Skills</h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          Type a skill and press Enter. Paste a comma-separated list for bulk import.
        </p>
      </div>
      <div className="p-6 bg-card rounded-xl border border-border shadow-sm">
        <div className="flex flex-wrap gap-2 p-3 border border-border rounded-lg bg-background min-h-[52px] focus-within:ring-2 focus-within:ring-blue-500/40 focus-within:border-blue-500 transition-all">
          {skills.map((skill) => (
            <span
              key={skill}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 text-sm rounded-lg font-medium border border-blue-200 dark:border-blue-500/20"
            >
              {skill}
              <button
                onClick={() => onRemove(skill)}
                className="ml-0.5 hover:text-red-500 transition-colors"
                aria-label={`Remove ${skill}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            className="flex-1 min-w-[140px] bg-transparent outline-none text-sm py-1.5 placeholder:text-muted-foreground/50"
            placeholder={skills.length === 0 ? 'e.g., JavaScript, React, Node.js' : 'Add a skill...'}
          />
        </div>
        {skills.length > 0 && (
          <p className="text-xs text-muted-foreground mt-2.5 font-medium">
            {skills.length} skill{skills.length !== 1 ? 's' : ''} added
          </p>
        )}
      </div>
    </section>
  )
}

// ---- Documents ----

function DocumentsSection({
  documents,
  onUpload,
  onRemove,
}: {
  documents: ProfileDocument[]
  onUpload: (e: React.ChangeEvent<HTMLInputElement>, type: ProfileDocument['type']) => void
  onRemove: (id: string) => void
}) {
  const resumeInputRef = useRef<HTMLInputElement>(null)
  const coverLetterInputRef = useRef<HTMLInputElement>(null)
  const otherInputRef = useRef<HTMLInputElement>(null)

  const resumes = documents.filter((d) => d.type === 'resume')
  const coverLetters = documents.filter((d) => d.type === 'cover-letter')
  const otherDocs = documents.filter((d) => d.type === 'other')

  function getDocIcon(type: ProfileDocument['type']) {
    switch (type) {
      case 'resume':
        return FileText
      case 'cover-letter':
        return File
      default:
        return Paperclip
    }
  }

  function renderDocList(docs: ProfileDocument[], label: string) {
    if (docs.length === 0) return null
    return (
      <div className="space-y-2">
        <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</h5>
        {docs.map((doc) => {
          const Icon = getDocIcon(doc.type)
          return (
            <div
              key={doc.id}
              className="flex items-center justify-between p-3.5 bg-background border border-border rounded-lg hover:border-blue-200 transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-medium text-foreground truncate block">{doc.name}</span>
                  <span className="text-xs text-muted-foreground">{doc.mimeType}</span>
                </div>
              </div>
              <button
                onClick={() => onRemove(doc.id)}
                className="p-1.5 text-muted-foreground/50 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Documents</h3>
        <p className="text-sm text-muted-foreground mt-0.5">Upload your resume and cover letters for autofill.</p>
      </div>
      <div className="p-6 bg-card rounded-xl border border-border shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <UploadCard
            label="Resume"
            description="PDF, DOC, or DOCX"
            icon={FileText}
            inputRef={resumeInputRef}
            onUpload={(e) => onUpload(e, 'resume')}
            accept=".pdf,.doc,.docx"
          />
          <UploadCard
            label="Cover Letter"
            description="PDF, DOC, or DOCX"
            icon={File}
            inputRef={coverLetterInputRef}
            onUpload={(e) => onUpload(e, 'cover-letter')}
            accept=".pdf,.doc,.docx"
          />
          <UploadCard
            label="Other"
            description="Any document"
            icon={Paperclip}
            inputRef={otherInputRef}
            onUpload={(e) => onUpload(e, 'other')}
            accept="*"
          />
        </div>

        {documents.length === 0 ? (
          <p className="text-center text-muted-foreground py-6 text-sm">
            No documents uploaded yet. Upload your resume and cover letters above.
          </p>
        ) : (
          <div className="space-y-5">
            {renderDocList(resumes, 'Resumes')}
            {renderDocList(coverLetters, 'Cover Letters')}
            {renderDocList(otherDocs, 'Other Documents')}
          </div>
        )}
      </div>
    </section>
  )
}

function UploadCard({
  label,
  description,
  inputRef,
  onUpload,
  accept,
}: {
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  inputRef: React.RefObject<HTMLInputElement | null>
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  accept: string
}) {
  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="flex flex-col items-center gap-2.5 p-6 border-2 border-dashed border-border rounded-xl hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-500/5 transition-all cursor-pointer group"
    >
      <div className="w-10 h-10 rounded-xl bg-accent group-hover:bg-blue-100 dark:group-hover:bg-blue-500/10 flex items-center justify-center transition-all">
        <Upload className="w-5 h-5 text-muted-foreground group-hover:text-blue-600 transition-colors" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="file"
        accept={accept}
        onChange={onUpload}
        className="hidden"
      />
    </button>
  )
}

// ---- Saved Answers ----

function SavedAnswersSection({
  answers,
  onAdd,
  onUpdate,
  onRemove,
  onAddTag,
  onRemoveTag,
}: {
  answers: SavedAnswer[]
  onAdd: () => void
  onUpdate: (id: string, field: keyof SavedAnswer, value: string | string[]) => void
  onRemove: (id: string) => void
  onAddTag: (answerId: string, tag: string) => void
  onRemoveTag: (answerId: string, tag: string) => void
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Saved Answers</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Save answers to common questions for quick reuse during applications.
          </p>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {answers.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No saved answers"
          description='Save your answers to common questions like "Why do you want to work here?" for quick reuse.'
          actionLabel="Add Answer"
          onAction={onAdd}
        />
      ) : (
        <div className="space-y-4">
          {answers.map((ans, index) => (
            <SavedAnswerCard
              key={ans.id}
              answer={ans}
              index={index}
              onUpdate={onUpdate}
              onRemove={onRemove}
              onAddTag={onAddTag}
              onRemoveTag={onRemoveTag}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function SavedAnswerCard({
  answer,
  index,
  onUpdate,
  onRemove,
  onAddTag,
  onRemoveTag,
}: {
  answer: SavedAnswer
  index: number
  onUpdate: (id: string, field: keyof SavedAnswer, value: string | string[]) => void
  onRemove: (id: string) => void
  onAddTag: (answerId: string, tag: string) => void
  onRemoveTag: (answerId: string, tag: string) => void
}) {
  const [tagInput, setTagInput] = useState('')

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (tagInput.trim()) {
        onAddTag(answer.id, tagInput)
        setTagInput('')
      }
    }
  }

  return (
    <div className="p-5 bg-card rounded-xl border border-border shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Answer {index + 1}
        </span>
        <button
          onClick={() => onRemove(answer.id)}
          className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" /> Remove
        </button>
      </div>
      <div className="space-y-4">
        <FormField label="Question" hint="The question this answer responds to">
          <input
            type="text"
            value={answer.question}
            onChange={(e) => onUpdate(answer.id, 'question', e.target.value)}
            className={inputClass}
            placeholder='e.g., "Why do you want to work here?"'
          />
        </FormField>
        <FormField label="Answer">
          <textarea
            value={answer.answer}
            onChange={(e) => onUpdate(answer.id, 'answer', e.target.value)}
            className={`${inputClass} min-h-[120px] resize-y`}
            placeholder="Write your answer..."
          />
        </FormField>
        <FormField label="Tags" hint="Tags help match answers to the right questions">
          <div className="flex flex-wrap gap-1.5 items-center p-2 border border-border rounded-lg bg-background min-h-[40px] focus-within:ring-2 focus-within:ring-blue-500/40 focus-within:border-blue-500 transition-all">
            {answer.tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 text-xs rounded-md font-medium border border-blue-200 dark:border-blue-500/20"
              >
                {tag}
                <button
                  onClick={() => onRemoveTag(answer.id, tag)}
                  className="hover:text-red-500 transition-colors"
                  aria-label={`Remove tag ${tag}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              className="flex-1 min-w-[80px] bg-transparent outline-none text-xs py-1 placeholder:text-muted-foreground/50"
              placeholder="Add tag + Enter"
            />
          </div>
        </FormField>
      </div>
    </div>
  )
}

// ---- Empty State ----

function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  actionLabel: string
  onAction: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-4 bg-card rounded-xl border border-dashed border-border">
      <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-muted-foreground/50" />
      </div>
      <h4 className="text-base font-semibold text-foreground mb-1">{title}</h4>
      <p className="text-sm text-muted-foreground mb-5 text-center max-w-sm">
        {description}
      </p>
      <button
        onClick={onAction}
        className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm"
      >
        <Plus className="w-4 h-4" /> {actionLabel}
      </button>
    </div>
  )
}
