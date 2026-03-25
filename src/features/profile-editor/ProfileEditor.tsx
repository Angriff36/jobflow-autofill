import { useEffect, useState } from 'react'
import { profileRepository, initializeDatabase } from '@/core/storage/db'
import type { UserProfile, PersonalInfo, WorkExperience, Education } from '@/core/types'
import { Plus, Trash2, Save } from 'lucide-react'

const emptyProfile = (): Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'> => ({
  personal: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: { address: '', city: '', state: '', zip: '', country: 'US' },
    linkedIn: '',
    portfolio: '',
    website: ''
  },
  workExperience: [],
  education: [],
  skills: [],
  documents: [],
  answers: []
})

export function ProfileEditor() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    initializeDatabase().then(loadProfile)
  }, [])

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
          updatedAt: new Date()
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
    setSaving(true)
    try {
      await profileRepository.save(profile)
      alert('Profile saved!')
    } catch (error) {
      console.error('Failed to save profile:', error)
      alert('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  function updatePersonal(field: keyof PersonalInfo, value: string) {
    if (!profile) return
    setProfile({
      ...profile,
      personal: { ...profile.personal, [field]: value }
    })
  }

  function updateLocation(field: keyof PersonalInfo['location'], value: string) {
    if (!profile) return
    setProfile({
      ...profile,
      personal: {
        ...profile.personal,
        location: { ...profile.personal.location, [field]: value }
      }
    })
  }

  function addWorkExperience() {
    if (!profile) return
    setProfile({
      ...profile,
      workExperience: [
        ...profile.workExperience,
        {
          id: crypto.randomUUID(),
          company: '',
          title: '',
          location: '',
          startDate: '',
          endDate: null,
          description: ''
        }
      ]
    })
  }

  function updateWorkExperience(id: string, field: keyof WorkExperience, value: string) {
    if (!profile) return
    setProfile({
      ...profile,
      workExperience: profile.workExperience.map((exp) =>
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    })
  }

  function removeWorkExperience(id: string) {
    if (!profile) return
    setProfile({
      ...profile,
      workExperience: profile.workExperience.filter((exp) => exp.id !== id)
    })
  }

  function addEducation() {
    if (!profile) return
    setProfile({
      ...profile,
      education: [
        ...profile.education,
        {
          id: crypto.randomUUID(),
          institution: '',
          degree: '',
          field: '',
          graduationDate: '',
          gpa: ''
        }
      ]
    })
  }

  function updateEducation(id: string, field: keyof Education, value: string) {
    if (!profile) return
    setProfile({
      ...profile,
      education: profile.education.map((edu) =>
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    })
  }

  function removeEducation(id: string) {
    if (!profile) return
    setProfile({
      ...profile,
      education: profile.education.filter((edu) => edu.id !== id)
    })
  }

  function updateSkills(skills: string) {
    if (!profile) return
    setProfile({
      ...profile,
      skills: skills.split(',').map((s) => s.trim()).filter(Boolean)
    })
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!profile) {
    return <div>Error loading profile</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Profile Editor</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      {/* Personal Information */}
      <section className="p-6 bg-card rounded-lg border">
        <h3 className="text-xl font-semibold mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">First Name</label>
            <input
              type="text"
              value={profile.personal.firstName}
              onChange={(e) => updatePersonal('firstName', e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Last Name</label>
            <input
              type="text"
              value={profile.personal.lastName}
              onChange={(e) => updatePersonal('lastName', e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={profile.personal.email}
              onChange={(e) => updatePersonal('email', e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              type="tel"
              value={profile.personal.phone}
              onChange={(e) => updatePersonal('phone', e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">City</label>
            <input
              type="text"
              value={profile.personal.location.city}
              onChange={(e) => updateLocation('city', e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">State</label>
            <input
              type="text"
              value={profile.personal.location.state}
              onChange={(e) => updateLocation('state', e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">LinkedIn</label>
            <input
              type="url"
              value={profile.personal.linkedIn || ''}
              onChange={(e) => updatePersonal('linkedIn', e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Portfolio</label>
            <input
              type="url"
              value={profile.personal.portfolio || ''}
              onChange={(e) => updatePersonal('portfolio', e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>
      </section>

      {/* Work Experience */}
      <section className="p-6 bg-card rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Work Experience</h3>
          <button
            onClick={addWorkExperience}
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
        {profile.workExperience.length === 0 ? (
          <p className="text-muted-foreground">No work experience added yet.</p>
        ) : (
          <div className="space-y-4">
            {profile.workExperience.map((exp) => (
              <div key={exp.id} className="p-4 border rounded-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Company</label>
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) => updateWorkExperience(exp.id, 'company', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <input
                      type="text"
                      value={exp.title}
                      onChange={(e) => updateWorkExperience(exp.id, 'title', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Date</label>
                    <input
                      type="month"
                      value={exp.startDate}
                      onChange={(e) => updateWorkExperience(exp.id, 'startDate', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">End Date</label>
                    <input
                      type="month"
                      value={exp.endDate || ''}
                      onChange={(e) => updateWorkExperience(exp.id, 'endDate', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => removeWorkExperience(exp.id)}
                    className="flex items-center gap-1 text-sm text-destructive hover:underline"
                  >
                    <Trash2 className="w-4 h-4" /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Education */}
      <section className="p-6 bg-card rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Education</h3>
          <button
            onClick={addEducation}
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
        {profile.education.length === 0 ? (
          <p className="text-muted-foreground">No education added yet.</p>
        ) : (
          <div className="space-y-4">
            {profile.education.map((edu) => (
              <div key={edu.id} className="p-4 border rounded-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Institution</label>
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Degree</label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Field of Study</label>
                    <input
                      type="text"
                      value={edu.field}
                      onChange={(e) => updateEducation(edu.id, 'field', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Graduation Date</label>
                    <input
                      type="month"
                      value={edu.graduationDate}
                      onChange={(e) => updateEducation(edu.id, 'graduationDate', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => removeEducation(edu.id)}
                    className="flex items-center gap-1 text-sm text-destructive hover:underline"
                  >
                    <Trash2 className="w-4 h-4" /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Skills */}
      <section className="p-6 bg-card rounded-lg border">
        <h3 className="text-xl font-semibold mb-4">Skills</h3>
        <p className="text-sm text-muted-foreground mb-2">Comma-separated (e.g., JavaScript, React, Node.js)</p>
        <textarea
          value={profile.skills.join(', ')}
          onChange={(e) => updateSkills(e.target.value)}
          className="w-full px-3 py-2 border rounded-md h-24"
          placeholder="Enter skills separated by commas"
        />
      </section>
    </div>
  )
}
