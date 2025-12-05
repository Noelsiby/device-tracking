import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, Link } from 'react-router-dom'
import { Moon, Sun, LogOut, LayoutDashboard, Package, CheckCircle, BarChart3, QrCode } from 'lucide-react'
import Devices from './pages/Devices'
import Login from './pages/Login'
import DeviceDetail from './pages/DeviceDetail'
import Approvals from './pages/Approvals'
import Dashboard from './pages/Dashboard'
import Analytics from './pages/Analytics'
import QRScannerPage from './pages/QRScannerPage'
import { ThemeProvider, useTheme } from './components/theme-provider'
import { Button } from './components/ui/button'

function ThemeToggle() {
    const { theme, setTheme } = useTheme()

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-full"
        >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
        </Button>
    )
}

function AppContent() {
    const [ready, setReady] = useState(false)
    useEffect(() => {
        const t = setTimeout(() => setReady(true), 200)
        return () => clearTimeout(t)
    }, [])

    const isAuthed = !!localStorage.getItem('token')
    const role = localStorage.getItem('role')

    const handleLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('role')
        location.href = '/login'
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center px-4">
                    <div className="flex items-center gap-2 font-bold text-lg">
                        <Package className="h-6 w-6 text-primary" />
                        <span>Device Tracking</span>
                    </div>
                    <nav className="ml-auto flex items-center gap-2">
                        {isAuthed && (
                            <>
                                <Link to="/dashboard" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-9 px-3 gap-2">
                                    <LayoutDashboard className="h-4 w-4" />
                                    Dashboard
                                </Link>
                                <Link to="/devices" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-9 px-3 gap-2">
                                    <Package className="h-4 w-4" />
                                    Devices
                                </Link>
                                <Link to="/analytics" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-9 px-3 gap-2">
                                    <BarChart3 className="h-4 w-4" />
                                    Analytics
                                </Link>
                                <Link to="/qr-scanner" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-9 px-3 gap-2">
                                    <QrCode className="h-4 w-4" />
                                    QR Scanner
                                </Link>
                                {role === 'admin' && (
                                    <Link to="/approvals" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-9 px-3 gap-2">
                                        <CheckCircle className="h-4 w-4" />
                                        Approvals
                                    </Link>
                                )}
                            </>
                        )}
                        <ThemeToggle />
                        {isAuthed && (
                            <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center gap-2">
                                <LogOut className="h-4 w-4" />
                                Logout
                            </Button>
                        )}
                    </nav>
                </div>
            </header>
            <main className="container mx-auto p-4 md:p-6 lg:p-8">
                {ready ? (
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/dashboard" element={isAuthed ? <Dashboard /> : <Navigate to="/login" />} />
                        <Route path="/devices" element={isAuthed ? <Devices /> : <Navigate to="/login" />} />
                        <Route path="/analytics" element={isAuthed ? <Analytics /> : <Navigate to="/login" />} />
                        <Route path="/qr-scanner" element={isAuthed ? <QRScannerPage /> : <Navigate to="/login" />} />
                        <Route path="/approvals" element={isAuthed && role === 'admin' ? <Approvals /> : <Navigate to="/login" />} />
                        <Route path="/devices/:id" element={isAuthed ? <DeviceDetail /> : <Navigate to="/login" />} />
                        <Route path="*" element={<Navigate to={isAuthed ? '/dashboard' : '/login'} />} />
                    </Routes>
                ) : (
                    <div className="grid gap-4 md:grid-cols-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}

function App() {
    return (
        <ThemeProvider defaultTheme="system" storageKey="device-tracking-theme">
            <AppContent />
        </ThemeProvider>
    )
}

export default App
