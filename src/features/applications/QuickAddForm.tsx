import { useState } from 'react'
import type { JobApplication, PipelineStage } from '@/core/types'
import { STAGES, stageConfig } from './Applications'
import { X } from 'lucide-react'
import { format } from 'date-fns'

interface Props {
  onSubmit: (data: Omit<JobApplication, 'id' | 'createdAt' | 'updatedAt'>) => void
  onClose: () => void
}

export function QuickAddForm({ onSubmit, onClose }: Props) {
  const [company, setCompany] = useState('')
  const [position, setPosition] = useState('')
  const [source, setSource] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [appliedDate, setAppliedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [stage, setStage] = useState<PipelineStage>('applied')
  const [notes, setNotes] = useState('')
  const [salaryAmount, setSalaryAmount] = useState('')
  const [salaryCurrency, setSalaryCurrency] = useState('USD')
  const [salaryFrequency, setSalaryFrequency] = useState<'hourly' | 'yearly'>('yearly')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!company.trim() || !position.trim()) return

    onSubmit({
      company: company.trim(),
      position: position.trim(),
      source: source.trim(),
      sourceUrl: sourceUrl.trim() || undefined,
      appliedDate,
      status: 'active',
      stage,
      notes: notes.trim(),
      contacts: [],
      salary: salaryAmount ? {
        amount: parseFloat(salaryAmount),
        currency: salaryCurrency,
        frequency: salaryFrequency,
      } : undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Add Application</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
              <input
                type="text"
                value={company}
                onChange={e => setCompany(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Google"
                autoFocus
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Position *</label>
              <input
                type="text"
                value={position}
                onChange={e => setPosition(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Software Engineer"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
              <input
                type="text"
                value={source}
                onChange={e => setSource(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="LinkedIn, Indeed..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source URL</label>
              <input
                type="url"
                value={sourceUrl}
                onChange={e => setSourceUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Applied Date</label>
              <input
                type="date"
                value={appliedDate}
                onChange={e => setAppliedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
              <select
                value={stage}
                onChange={e => setStage(e.target.value as PipelineStage)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STAGES.map(s => (
                  <option key={s} value={s}>{stageConfig[s].label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Salary */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Salary (optional)</label>
            <div className="flex gap-2">
              <select
                value={salaryCurrency}
                onChange={e => setSalaryCurrency(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-20"
              >
                <option value="USD">$</option>
                <option value="EUR">€</option>
                <option value="GBP">£</option>
              </select>
              <input
                type="number"
                value={salaryAmount}
                onChange={e => setSalaryAmount(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Amount"
                min="0"
              />
              <select
                value={salaryFrequency}
                onChange={e => setSalaryFrequency(e.target.value as 'hourly' | 'yearly')}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="yearly">/ year</option>
                <option value="hourly">/ hour</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-vertical"
              placeholder="Any initial notes..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Application
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
