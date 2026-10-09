import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar.tsx'
import BottomNav from './components/BottomNav.tsx'
import ProtectedRoute from './components/ProtectedRoute.tsx'
import Landing from './pages/Landing.tsx'
import Login from './pages/Login.tsx'
import Signup from './pages/Signup.tsx'
import Dashboard from './pages/Dashboard.tsx'
import Today from './pages/Today.tsx'
import Stats from './pages/Stats.tsx'
import NewPlan from './pages/NewPlan.tsx'
import PlanDetail from './pages/PlanDetail.tsx'

export default function App() {
  return (
    <div className="min-h-screen pb-20 sm:pb-0">
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/today" element={<ProtectedRoute><Today /></ProtectedRoute>} />
        <Route path="/stats" element={<ProtectedRoute><Stats /></ProtectedRoute>} />
        <Route path="/new" element={<ProtectedRoute><NewPlan /></ProtectedRoute>} />
        <Route path="/plan/:id" element={<ProtectedRoute><PlanDetail /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </div>
  )
}  
