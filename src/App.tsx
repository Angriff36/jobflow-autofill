import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Dashboard } from './features/dashboard/Dashboard'
import { ProfileEditor } from './features/profile-editor/ProfileEditor'
import { Applications } from './features/applications/Applications'
import { Settings } from './features/settings/Settings'
import { Layout } from './components/Layout'
import { AuthProvider } from './features/auth/AuthProvider'
import { NotificationsProvider } from './features/notifications'
import { AuthPage } from './features/auth/AuthPage'
import { LandingPage } from './features/landing/LandingPage'
import { BlogPage } from './features/blog/BlogPage'
import { ArticleApply50Jobs } from './features/blog/ArticleApply50Jobs'
import { ArticleBestAutofillTools } from './features/blog/ArticleBestAutofillTools'
import { ArticleRetypingSameInfo } from './features/blog/ArticleRetypingSameInfo'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationsProvider>
          <Routes>
            {/* Public routes (no layout) */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/blog" element={<div className="min-h-screen bg-gray-50 py-12 px-4"><BlogPage /></div>} />
            <Route path="/blog/how-to-apply-50-jobs-a-day" element={<div className="min-h-screen bg-white py-12 px-4"><ArticleApply50Jobs /></div>} />
            <Route path="/blog/best-job-application-autofill-tools-2026" element={<div className="min-h-screen bg-white py-12 px-4"><ArticleBestAutofillTools /></div>} />
            <Route path="/blog/why-you-keep-retyping-same-info" element={<div className="min-h-screen bg-white py-12 px-4"><ArticleRetypingSameInfo /></div>} />

            {/* App routes (with layout) */}
            <Route path="/app" element={<Layout />}>
              <Route index element={<Navigate to="/app/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="profile" element={<ProfileEditor />} />
              <Route path="applications" element={<Applications />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Redirect old routes */}
            <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
            <Route path="/profile" element={<Navigate to="/app/profile" replace />} />
            <Route path="/applications" element={<Navigate to="/app/applications" replace />} />
            <Route path="/settings" element={<Navigate to="/app/settings" replace />} />
          </Routes>
        </NotificationsProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
