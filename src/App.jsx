import { Routes, Route } from 'react-router-dom'

import MainLayout from './components/pages/MainLayout'
import HomePage from './components/pages/HomePage'
import FocusPage from './components/pages/FocusPage'
import SchedulePage from './components/pages/SchedulePage'
import AboutPage from './components/pages/AboutPage'
import SettingsPage from './components/pages/SettingsPage'
import NotFoundPage from './components/pages/NotFoundPage'
import LoginPage from './components/pages/LoginPage'
import RegisterPage from './components/pages/RegisterPage'
import ProfilePage from './components/pages/ProfilePage'
import ProtectedRoute from './components/auth/ProtectedRoute'
import NotesPage from './pages/NotesPage'

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="focus" element={<FocusPage />} />
        <Route path="schedule" element={<SchedulePage />} />
        <Route path="about" element={<SettingsPage />} />
        <Route path="about/statistics" element={<AboutPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="profile" element={<ProfilePage />} />
          <Route path="notes" element={<NotesPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
