import { useEffect, useState } from 'react'
import api from '../lib/api'
import { socket } from '../lib/socket'

export default function Dashboard() {
    const [stats, setStats] = useState<{ available: number, assigned: number, maintenance: number, lost: number, overdue: number } | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const load = async () => {
        setLoading(true)
        setError(null)
        try {
            const r = await api.get('/api/dashboard/stats')
            setStats(r.data)
        } catch (e: any) {
            setError(e?.response?.data?.error || 'Failed to load stats')
        } finally { setLoading(false) }
    }

    useEffect(() => {
        load()
        const refresh = () => load()
        socket.on('dashboard:update', refresh)
        socket.on('device:status', refresh)
        socket.on('assignment:created', refresh)
        socket.on('assignment:returned', refresh)
        return () => {
            socket.off('dashboard:update', refresh)
            socket.off('device:status', refresh)
            socket.off('assignment:created', refresh)
            socket.off('assignment:returned', refresh)
        }
    }, [])

    if (loading) return <div className="p-4">Loading...</div>
    if (error) return <div className="p-4 text-red-600">{error}</div>

    return (
        <div className="p-4 grid gap-4 md:grid-cols-5">
            <div className="border rounded p-4"><div className="text-sm">Available</div><div className="text-2xl font-semibold">{stats?.available}</div></div>
            <div className="border rounded p-4"><div className="text-sm">Assigned</div><div className="text-2xl font-semibold">{stats?.assigned}</div></div>
            <div className="border rounded p-4"><div className="text-sm">Maintenance</div><div className="text-2xl font-semibold">{stats?.maintenance}</div></div>
            <div className="border rounded p-4"><div className="text-sm">Lost</div><div className="text-2xl font-semibold">{stats?.lost}</div></div>
            <div className="border rounded p-4"><div className="text-sm">Overdue</div><div className="text-2xl font-semibold">{stats?.overdue}</div></div>
        </div>
    )
}
