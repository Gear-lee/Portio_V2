import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import FollowList from './pages/FollowList'
import Settings from './pages/Settings'
import Notifications from './pages/Notifications'
import Create from './pages/Create'
import Projects from './pages/Projects'
import ProjectDashboard from './pages/ProjectDashboard'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/following" element={<FollowList mode="following" />} />
        <Route path="/followers" element={<FollowList mode="followers" />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/create" element={<Create />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/project/:projectId" element={<ProjectDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
