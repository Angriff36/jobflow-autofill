import { useState } from 'react'
import type { JobApplication, PipelineStage, Contact } from '@/core/types'
import { STAGES, stageConfig } from './Applications'
import {
  X, Trash2, Plus, ExternalLink,
  DollarSign, Users, FileText, Save
} from 'lucide-react'
import { format } from 'date-fns'

interface Props {
  application: JobApplication
  onClose: () => void
  onUpdate: (updates: Partial<JobApplication>) => void
  onStageChange: (stage: PipelineStage) => void
  onDelete: () => void
}

export function ApplicationDetailModal({ application, onClose, onUpdate, onStageChange, onDelete }: Props) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    company: application.company,
    position: application.position,
    source: application.source,
    sourceUrl: application.sourceUrl || '',
    appliedDate: application.appliedDate,
    notes: application.notes,
    followUpDate: application.followUpDate || '',
    salaryAmount: application.salary?.amount?.toString() || '',
    salaryCurrency: application.salary?.currency || 'USD',
    salaryFrequency: application.salary?.frequency || 'yearly' as const,
  })
  const [contacts, setContacts] = useState<Contact[]>(application.contacts || [])
  const [newContact, setNewContact] = useState({ name: '', role: '', email: '', phone: '', notes: '' })
  const [showAddContact, setShowAddContact] = useState(false)

  function handleSave() {
    const updates: Partial<JobApplication> = {
      company: form.company,
      position: form.position,
      source: form.source,
      sourceUrl: form.sourceUrl || undefined,
      appliedDate: form.appliedDate,
      notes: form.notes,
      followUpDate: form.followUpDate || undefined,
      contacts,
      salary: form.salaryAmount ? {
        amount: parseFloat(form.salaryAmount),
        currency: form.salaryCurrency,
        frequency: form.salaryFrequency,
      } : undefined,
    }
    onUpdate(updates)
    setEditing(false)
  }

  function addContact() {
    if (!newContact.name.trim()) return
    const contact: Contact = {
      id: crypto.randomUUID(),
      name: newContact.name.trim(),
      role: newContact.role.trim(),
      email: newContact.email.trim() || undefined,
      phone: newContact.phone.trim() || undefined,
      notes: newContact.notes.trim(),
    }
    const updated = [...contacts, contact]
    setContacts(updated)
    setNewContact({ name: '', role: '', email: '', phone: '', notes: '' })
    setShowAddContact(false)
    onUpdate({ contacts: updated })
  }

  function removeContact(id: string) {
    const updated = contacts.filter(c => c.id !== id)
    setContacts(updated)
    onUpdate({ contacts: updated })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[5vh] bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-start justify-between z-10">
          <div className="flex-1 min-w-0">
            {editing ? (
              <input
                type="text"
                value={form.company}
                onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                className="text-xl font-bold text-gray-900 w-full border-b border-gray-300 focus:border-blue-500 focus:outline-none pb-1"
              />
            ) : (
              <h2 className="text-xl font-bold text-gray-900 truncate">{application.company}</h2>
            )}
            {editing ? (
              <input
                type="text"
                value={form.position}
                onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
                className="text-sm text-gray-500 w-full border-b border-gray-300 focus:border-blue-500 focus:outline-none mt-1 pb-1"
              />
            ) : (
              <p className="text-sm text-gray-500 mt-0.5">{application.position}</p>
            )}
          </div>
          <div className="flex items-center gap-2 ml-4">
            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
              >
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Stage Pipeline */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Pipeline Stage</label>
            <div className="flex gap-1">
              {STAGES.map(s => (
                <button
                  key={s}
                  onClick={() => onStageChange(s)}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
                    application.stage === s
                      ? stageConfig[s].bg + ' ring-2 ring-offset-1 ring-current'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {stageConfig[s].label}
                </button>
              ))}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Source</label>
              {editing ? (
                <input
                  type="text"
                  value={form.source}
                  onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-sm text-gray-900">{application.source || '—'}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Source URL</label>
              {editing ? (
                <input
                  type="url"
                  value={form.sourceUrl}
                  onChange={e => setForm(f => ({ ...f, sourceUrl: e.target.value }))}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : application.sourceUrl ? (
                <a
                  href={application.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View listing
                </a>
              ) : (
                <p className="text-sm text-gray-400">—</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Applied Date</label>
              {editing ? (
                <input
                  type="date"
                  value={form.appliedDate}
                  onChange={e => setForm(f => ({ ...f, appliedDate: e.target.value }))}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-sm text-gray-900">
                  {format(new Date(application.appliedDate), 'MMMM d, yyyy')}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Follow-up Date</label>
              {editing ? (
                <input
                  type="date"
                  value={form.followUpDate}
                  onChange={e => setForm(f => ({ ...f, followUpDate: e.target.value }))}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-sm text-gray-900">
                  {application.followUpDate
                    ? format(new Date(application.followUpDate), 'MMMM d, yyyy')
                    : '—'}
                </p>
              )}
            </div>
          </div>

          {/* Salary */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              <DollarSign className="w-3.5 h-3.5 inline" /> Salary
            </label>
            {editing ? (
              <div className="flex gap-2">
                <select
                  value={form.salaryCurrency}
                  onChange={e => setForm(f => ({ ...f, salaryCurrency: e.target.value }))}
                  className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm w-20"
                >
                  <option value="USD">$</option>
                  <option value="EUR">€</option>
                  <option value="GBP">£</option>
                </select>
                <input
                  type="number"
                  value={form.salaryAmount}
                  onChange={e => setForm(f => ({ ...f, salaryAmount: e.target.value }))}
                  className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                  placeholder="Amount"
                />
                <select
                  value={form.salaryFrequency}
                  onChange={e => setForm(f => ({ ...f, salaryFrequency: e.target.value as 'hourly' | 'yearly' }))}
                  className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="yearly">/ year</option>
                  <option value="hourly">/ hour</option>
                </select>
              </div>
            ) : (
              <p className="text-sm text-gray-900">
                {application.salary
                  ? `${application.salary.currency === 'USD' ? '$' : application.salary.currency === 'EUR' ? '€' : '£'}${application.salary.amount.toLocaleString()} / ${application.salary.frequency === 'yearly' ? 'year' : 'hour'}`
                  : '—'}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              <FileText className="w-3.5 h-3.5 inline" /> Notes
            </label>
            {editing ? (
              <textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-vertical"
              />
            ) : (
              <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3 min-h-[60px]">
                {application.notes || <span className="text-gray-400 italic">No notes</span>}
              </div>
            )}
          </div>

          {/* Contacts */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                <Users className="w-3.5 h-3.5 inline" /> Contacts
              </label>
              <button
                onClick={() => setShowAddContact(true)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-0.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>

            {contacts.length === 0 && !showAddContact && (
              <p className="text-sm text-gray-400 italic">No contacts added</p>
            )}

            <div className="space-y-2">
              {contacts.map(contact => (
                <div key={contact.id} className="flex items-start justify-between bg-gray-50 rounded-lg p-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{contact.name}</p>
                    {contact.role && <p className="text-xs text-gray-500">{contact.role}</p>}
                    <div className="flex gap-3 mt-1">
                      {contact.email && (
                        <a href={`mailto:${contact.email}`} className="text-xs text-blue-600 hover:underline">
                          {contact.email}
                        </a>
                      )}
                      {contact.phone && (
                        <span className="text-xs text-gray-500">{contact.phone}</span>
                      )}
                    </div>
                    {contact.notes && <p className="text-xs text-gray-500 mt-1">{contact.notes}</p>}
                  </div>
                  <button
                    onClick={() => removeContact(contact.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {/* Add contact form */}
              {showAddContact && (
                <div className="bg-blue-50 rounded-lg p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Name *"
                      value={newContact.name}
                      onChange={e => setNewContact(c => ({ ...c, name: e.target.value }))}
                      className="px-2 py-1.5 border border-gray-200 rounded text-sm"
                      autoFocus
                    />
                    <input
                      type="text"
                      placeholder="Role"
                      value={newContact.role}
                      onChange={e => setNewContact(c => ({ ...c, role: e.target.value }))}
                      className="px-2 py-1.5 border border-gray-200 rounded text-sm"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={newContact.email}
                      onChange={e => setNewContact(c => ({ ...c, email: e.target.value }))}
                      className="px-2 py-1.5 border border-gray-200 rounded text-sm"
                    />
                    <input
                      type="tel"
                      placeholder="Phone"
                      value={newContact.phone}
                      onChange={e => setNewContact(c => ({ ...c, phone: e.target.value }))}
                      className="px-2 py-1.5 border border-gray-200 rounded text-sm"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Notes"
                    value={newContact.notes}
                    onChange={e => setNewContact(c => ({ ...c, notes: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setShowAddContact(false)}
                      className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={addContact}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Add Contact
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <button
              onClick={onDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete Application
            </button>
            <p className="text-xs text-gray-400">
              Added {format(new Date(application.createdAt), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
