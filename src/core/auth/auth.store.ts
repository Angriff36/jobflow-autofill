import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserProfile, Session, UserSettings } from '../types/auth'
import { authService, settingsService } from '../storage/supabase'

interface AuthState {
  user: UserProfile | null
  session: Session | null
  settings: UserSettings | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
}

interface AuthActions {
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName?: string) => Promise<void>
  signInWithOAuth: (provider: 'google' | 'github') => Promise<void>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  updateProfile: (updates: Partial<Pick<UserProfile, 'displayName' | 'avatarUrl' | 'syncEnabled'>>) => Promise<void>
  updateSettings: (updates: Partial<Omit<UserSettings, 'userId' | 'createdAt' | 'updatedAt'>>) => Promise<void>
  clearError: () => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      session: null,
      settings: null,
      isLoading: true,
      isAuthenticated: false,
      error: null,

      // Actions
      signIn: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        
        const result = await authService.signIn(email, password)
        
        if (result.success) {
          await get().refreshSession()
        } else {
          set({ error: result.error, isLoading: false })
        }
      },

      signUp: async (email: string, password: string, displayName?: string) => {
        set({ isLoading: true, error: null })
        
        const result = await authService.signUp(email, password, displayName)
        
        if (result.success) {
          // For email confirmation, don't auto-login
          set({ isLoading: false })
        } else {
          set({ error: result.error, isLoading: false })
        }
      },

      signInWithOAuth: async (provider: 'google' | 'github') => {
        set({ isLoading: true, error: null })
        
        const result = await authService.signInWithOAuth(provider)
        
        if (!result.success) {
          set({ error: result.error, isLoading: false })
        }
        // OAuth will redirect, so we don't update state here
      },

      signOut: async () => {
        set({ isLoading: true })
        await authService.signOut()
        set({
          user: null,
          session: null,
          settings: null,
          isAuthenticated: false,
          isLoading: false
        })
      },

      refreshSession: async () => {
        set({ isLoading: true })
        
        try {
          const [session, profile, settings] = await Promise.all([
            authService.getSession(),
            authService.getProfile(),
            settingsService.get()
          ])
          
          set({
            session,
            user: profile,
            settings,
            isAuthenticated: !!session && !!profile,
            isLoading: false,
            error: null
          })
        } catch (error) {
          set({
            session: null,
            user: null,
            settings: null,
            isAuthenticated: false,
            isLoading: false,
            error: 'Failed to refresh session'
          })
        }
      },

      updateProfile: async (updates) => {
        const result = await authService.updateProfile(updates)
        
        if (result.success) {
          const current = get().user
          if (current) {
            set({
              user: { ...current, ...updates }
            })
          }
        } else {
          set({ error: result.error })
        }
      },

      updateSettings: async (updates) => {
        const result = await settingsService.update(updates)
        
        if (result.success) {
          const current = get().settings
          if (current) {
            set({
              settings: { ...current, ...updates }
            })
          }
        } else {
          set({ error: result.error })
        }
      },

      clearError: () => set({ error: null }),
      
      setLoading: (loading: boolean) => set({ isLoading: loading })
    }),
    {
      name: 'jobflow-auth',
      partialize: (state) => ({
        session: state.session
      })
    }
  )
)

// Subscribe to auth state changes
export function initializeAuth() {
  const { refreshSession } = useAuthStore.getState()
  
  // Initial session check
  refreshSession()
  
  // Listen for auth changes
  authService.onAuthStateChange((event, _session) => {
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      refreshSession()
    } else if (event === 'SIGNED_OUT') {
      useAuthStore.setState({
        user: null,
        session: null,
        settings: null,
        isAuthenticated: false
      })
    }
  })
}
