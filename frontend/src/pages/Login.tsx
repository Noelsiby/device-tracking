import { useState, FormEvent } from 'react'
import api from '../lib/api'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'

export default function Login() {
    const nav = useNavigate()
    const [email, setEmail] = useState('admin@example.com')
    const [password, setPassword] = useState('password')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const submit = async (e: FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        console.log('Attempting login with:', email)
        try {
            const { data } = await api.post('/api/auth/login', { email, password })
            console.log('Login response:', data)
            localStorage.setItem('token', data.token)
            const me = await api.get('/api/me')
            console.log('User info:', me.data)
            localStorage.setItem('role', me.data.role)
            // Force reload to update App auth state
            window.location.href = '/dashboard'
        } catch (err: any) {
            console.error('Login error:', err)
            setError(err?.response?.data?.error || err.message || 'Login failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
                    <p className="text-sm text-muted-foreground text-center">Sign in to your account</p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={submit} className="grid gap-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Email</label>
                            <input
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@example.com"
                                type="email"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Password</label>
                            <input
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        {error && (
                            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive">
                                {error}
                            </div>
                        )}
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign In'}
                        </Button>
                        <div className="text-xs text-center text-muted-foreground">
                            Default: admin@example.com / password
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
