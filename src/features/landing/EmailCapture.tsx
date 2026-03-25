import { useState } from 'react'
import { Mail, CheckCircle, Loader2 } from 'lucide-react'
import { supabase, supabaseConfigured } from '../../core/storage/supabase'

export function EmailCapture() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [waitlistNumber, setWaitlistNumber] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || status === 'loading') return

    setStatus('loading')
    setErrorMessage('')

    try {
      if (supabaseConfigured) {
        const { data, error } = await supabase
          .from('waitlist')
          .insert({ email: email.trim() })
          .select('id')
          .single()

        if (error) {
          if (error.code === '23505') {
            setErrorMessage('This email is already on the waitlist!')
            setStatus('error')
            return
          }
          throw error
        }

        const { count } = await supabase
          .from('waitlist')
          .select('*', { count: 'exact', head: true })

        setWaitlistNumber(count || 1)
        if (data) {
          setStatus('success')
        }
      } else {
        // localStorage fallback
        const stored = JSON.parse(localStorage.getItem('jobflow_waitlist') || '[]') as string[]
        if (stored.includes(email.trim())) {
          setErrorMessage('This email is already on the waitlist!')
          setStatus('error')
          return
        }
        stored.push(email.trim())
        localStorage.setItem('jobflow_waitlist', JSON.stringify(stored))
        setWaitlistNumber(stored.length)
        setStatus('success')
      }
    } catch {
      // Final fallback to localStorage
      try {
        const stored = JSON.parse(localStorage.getItem('jobflow_waitlist') || '[]') as string[]
        if (!stored.includes(email.trim())) {
          stored.push(email.trim())
          localStorage.setItem('jobflow_waitlist', JSON.stringify(stored))
        }
        setWaitlistNumber(stored.length)
        setStatus('success')
      } catch {
        setErrorMessage('Something went wrong. Please try again.')
        setStatus('error')
      }
    }
  }

  return (
    <section className="py-20 bg-blue-600">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Mail className="w-12 h-12 text-blue-200 mx-auto mb-6" />
        <h2 className="text-3xl font-bold text-white mb-4">Get Early Access</h2>
        <p className="text-blue-100 text-lg mb-8">
          Be the first to know when JobFlow Autofill launches. Join the waitlist and skip the
          line.
        </p>

        {status === 'success' ? (
          <div className="bg-white/10 backdrop-blur rounded-xl p-8">
            <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-4" />
            <p className="text-white text-xl font-semibold mb-2">You're on the list!</p>
            <p className="text-blue-100 text-lg">
              You are <span className="text-white font-bold">#{waitlistNumber}</span> on the
              waitlist.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Joining...
                </>
              ) : (
                'Get Early Access'
              )}
            </button>
          </form>
        )}

        {status === 'error' && (
          <p className="text-red-200 mt-3 text-sm">{errorMessage}</p>
        )}
      </div>
    </section>
  )
}
