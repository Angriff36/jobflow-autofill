import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Dashboard } from './features/dashboard/Dashboard'
import { ProfileEditor } from './features/profile-editor/ProfileEditor'
import { Applications } from './features/applications/Applications'
import { Settings } from './features/settings/Settings'
import { Layout } from './components/Layout'
import { AuthProvider } from './features/auth/AuthProvider'
import { NotificationsProvider } from './features/notifications'
import { AuthPage } from './features/auth/AuthPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationsProvider>
          <Routes>
            {/* Auth routes (no layout) */}
            <Route path="/auth" element={<AuthPage />} />
            
            {/* App routes (with layout) */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="profile" element={<ProfileEditor />} />
              <Route path="applications" element={<Applications />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </NotificationsProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
