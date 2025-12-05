import { useEffect, useState } from 'react'
import { Package, AlertTriangle, Wrench, XCircle, Clock } from 'lucide-react'
import api from '../lib/api'
import { socket } from '../lib/socket'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'

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

    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                {[1, 2, 3, 4, 5].map(i => (
                    <Card key={i} className="animate-pulse">
                        <CardHeader className="pb-2">
                            <div className="h-4 bg-muted rounded w-24" />
                        </CardHeader>
                        <CardContent>
                            <div className="h-8 bg-muted rounded w-16" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    if (error) return <div className="p-4 text-destructive bg-destructive/10 rounded-lg border border-destructive">{error}</div>

    const statCards = [
        { label: 'Available', value: stats?.available || 0, icon: Package, color: 'text-green-500', bgColor: 'bg-green-500/10' },
        { label: 'Assigned', value: stats?.assigned || 0, icon: Package, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
        { label: 'Maintenance', value: stats?.maintenance || 0, icon: Wrench, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
        { label: 'Lost', value: stats?.lost || 0, icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-500/10' },
        { label: 'Overdue', value: stats?.overdue || 0, icon: AlertTriangle, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
    ]

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <p className="text-muted-foreground">Real-time overview of your device inventory</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 animate-fade-in">
                {statCards.map((stat, index) => {
                    const Icon = stat.icon
                    return (
                        <Card key={stat.label} className="hover:shadow-lg transition-all duration-300 cursor-pointer" style={{ animationDelay: `${index * 100}ms` }}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {stat.label}
                                </CardTitle>
                                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                                    <Icon className={`h-4 w-4 ${stat.color}`} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">{stat.value}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {stat.value === 1 ? 'device' : 'devices'}
                                </p>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
