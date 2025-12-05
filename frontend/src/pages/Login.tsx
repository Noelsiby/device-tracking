import { useState, FormEvent } from 'react'
import api from '../lib/api'
import { useNavigate } from 'react-router-dom'

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
        try {
            const { data } = await api.post('/api/auth/login', { email, password })
            localStorage.setItem('token', data.token)
            const me = await api.get('/api/me')
            localStorage.setItem('role', me.data.role)
            nav('/devices')
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Login failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center">
            <form onSubmit={submit} className="w-full max-w-sm p-6 border rounded-lg grid gap-3">
                <h2 className="text-lg font-semibold">Login</h2>
                <input className="border rounded p-2" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
                <input className="border rounded p-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
                {error && <div className="text-red-600 text-sm">{error}</div>}
                <button className="bg-black text-white rounded p-2" disabled={loading}>{loading ? '...' : 'Sign In'}</button>
            </form>
        </div>
    )
}
