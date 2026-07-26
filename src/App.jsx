import { Routes, Route } from 'react-router-dom'

import MainLayout from './components/pages/MainLayout'
import HomePage from './components/pages/HomePage'
import FocusPage from './components/pages/FocusPage'
import SchedulePage from './components/pages/SchedulePage'
import AboutPage from './components/pages/AboutPage'

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="focus" element={<FocusPage />} />
        <Route path="schedule" element={<SchedulePage />} />
        <Route path="about" element={<AboutPage />} />
      </Route>
    </Routes>
  )
}

export default App