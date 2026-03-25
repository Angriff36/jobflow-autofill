import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Dashboard } from './features/dashboard/Dashboard'
import { ProfileEditor } from './features/profile-editor/ProfileEditor'
import { Applications } from './features/applications/Applications'
import { Settings } from './features/settings/Settings'
import { UpgradePage } from './features/upgrade/UpgradePage'
import { Layout } from './components/Layout'
import { AuthProvider } from './features/auth/AuthProvider'
import { NotificationsProvider } from './features/notifications'
import { AuthPage } from './features/auth/AuthPage'
import { LandingPage } from './features/landing/LandingPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationsProvider>
          <Routes>
            {/* Landing page (unauthenticated) */}
            <Route path="/" element={<LandingPage />} />

            {/* Auth routes (no layout) */}
            <Route path="/auth" element={<AuthPage />} />

            {/* App routes (with layout) */}
            <Route path="/app" element={<Layout />}>
              <Route index element={<Navigate to="/app/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="profile" element={<ProfileEditor />} />
              <Route path="applications" element={<Applications />} />
              <Route path="settings" element={<Settings />} />
              <Route path="upgrade" element={<UpgradePage />} />
            </Route>
          </Routes>
        </NotificationsProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
