import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, Link } from 'react-router-dom'
import Devices from './pages/Devices'
import Login from './pages/Login'
import DeviceDetail from './pages/DeviceDetail'
import Approvals from './pages/Approvals'
import Dashboard from './pages/Dashboard'

function App() {
    const [ready, setReady] = useState(false)
    useEffect(() => {
        const t = setTimeout(() => setReady(true), 200)
        return () => clearTimeout(t)
    }, [])

    const isAuthed = !!localStorage.getItem('token')
    const role = localStorage.getItem('role')

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="p-4 border-b flex items-center justify-between">
                <h1 className="text-xl font-semibold">Device Tracking</h1>
                <nav className="flex gap-3 text-sm">
                    <Link to="/dashboard">Dashboard</Link>
                    <Link to="/devices">Devices</Link>
                    {role === 'admin' && (
                        <Link to="/approvals">Approvals</Link>
                    )}
                    {isAuthed ? (
                        <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('role'); location.href = '/login' }} className="border rounded px-2 py-1">Logout</button>
                    ) : (
                        <Link to="/login">Login</Link>
                    )}                </nav>
            </header>
            <main className="p-4">
                {ready ? (
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/dashboard" element={isAuthed ? <Dashboard /> : <Navigate to="/login" />} />
                        <Route path="/devices" element={isAuthed ? <Devices /> : <Navigate to="/login" />} />
                        <Route path="/approvals" element={isAuthed && role === 'admin' ? <Approvals /> : <Navigate to="/login" />} />
                        <Route path="/devices/:id" element={isAuthed ? <DeviceDetail /> : <Navigate to="/login" />} />
                        <Route path="*" element={<Navigate to={isAuthed ? '/dashboard' : '/login'} />} />
                    </Routes>
                ) : (
                    <div className="animate-pulse h-20 bg-muted rounded" />
                )}
            </main>
        </div>
    )
}

export default App
