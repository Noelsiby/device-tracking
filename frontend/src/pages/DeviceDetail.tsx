import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Download, QrCode, Package, User, Wrench, History } from 'lucide-react'
import { socket } from '../lib/socket'
import api from '../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { QRCodeGenerator } from '../components/QRCodeGenerator'

export default function DeviceDetail() {
    const { id } = useParams()
    const deviceId = Number(id)
    const [data, setData] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const role = localStorage.getItem('role')

    const [showQR, setShowQR] = useState(false)

    const load = async () => {
        setLoading(true)
        setError(null)
        try {
            const r = await api.get(`/api/devices/${deviceId}`)
            setData(r.data)
        } catch (e: any) {
            setError(e?.response?.data?.error || 'Failed to load')
        } finally { setLoading(false) }
    }

    useEffect(() => { load() }, [])

    useEffect(() => {
        const onStatus = (payload: any) => { if (payload?.id === deviceId) load() }
        const onApproved = (a: any) => { if (a?.device_id === deviceId) load() }
        const onCreated = (a: any) => { if (a?.device_id === deviceId) load() }
        const onReturned = (a: any) => { if (a?.device_id === deviceId) load() }
        socket.on('device:status', onStatus)
        socket.on('assignment:approved', onApproved)
        socket.on('assignment:created', onCreated)
        socket.on('assignment:returned', onReturned)
        return () => {
            socket.off('device:status', onStatus)
            socket.off('assignment:approved', onApproved)
            socket.off('assignment:created', onCreated)
            socket.off('assignment:returned', onReturned)
        }
    }, [])

    const downloadQR = () => {
        const canvas = document.querySelector('canvas')
        if (canvas) {
            const url = canvas.toDataURL('image/png')
            const link = document.createElement('a')
            link.download = `device-${deviceId}-qr.png`
            link.href = url
            link.click()
        }
    }

    const downloadPDF = () => {
        window.open(`/api/reports/device/${deviceId}`, '_blank')
    }

    const changeStatus = async (status: string) => {
        try {
            await api.post(`/api/devices/${deviceId}/status`, { status })
            await load()
        } catch (e: any) {
            alert(e?.response?.data?.error || 'Failed')
        }
    }

    const approveLatest = async () => {
        try {
            const pending = (data?.assignments || []).find((a: any) => a.status === 'pending_approval')
            if (!pending) return alert('No pending approval')
            await api.post(`/api/assign/${pending.id}/approve`)
            await load()
        } catch (e: any) {
            alert(e?.response?.data?.error || 'Failed')
        }
    }

    const requestAssign = async (userId: number, notes: string) => {
        try {
            await api.post('/api/assign', { deviceId, userId, notes })
            await load()
        } catch (e: any) {
            alert(e?.response?.data?.error || 'Failed')
        }
    }

    if (loading) return (
        <div className="space-y-6">
            <Card className="animate-pulse">
                <CardHeader><div className="h-8 bg-muted rounded w-64" /></CardHeader>
                <CardContent><div className="h-64 bg-muted rounded" /></CardContent>
            </Card>
        </div>
    )
    if (error) return (
        <Card className="border-destructive">
            <CardContent className="pt-6">
                <div className="text-destructive">{error}</div>
            </CardContent>
        </Card>
    )

    const getStatusColor = (status: string) => {
        const colors: any = {
            available: 'default',
            assigned: 'default',
            maintenance: 'secondary',
            lost: 'destructive',
            retired: 'secondary',
        }
        return colors[status] || 'default'
    }

    const d = data.device
    const qrValue = JSON.stringify({ deviceId: d.id, serial: d.serial, name: d.name })

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{d.name}</h2>
                    <p className="text-muted-foreground mt-1">Serial: {d.serial}</p>
                </div>
                <div className="flex gap-2">
                    <Badge variant={getStatusColor(d.status)} className="text-sm">
                        {d.status.toUpperCase()}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => setShowQR(!showQR)}>
                        <QrCode className="mr-2 h-4 w-4" />
                        {showQR ? 'Hide' : 'Show'} QR
                    </Button>
                    <Button variant="outline" size="sm" onClick={downloadPDF}>
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                    </Button>
                </div>
            </div>

            {/* QR Code Section */}
            {showQR && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Device QR Code</span>
                            <Button variant="outline" size="sm" onClick={downloadQR}>
                                <Download className="mr-2 h-4 w-4" />
                                Download
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <div className="bg-white p-4 rounded-lg">
                            <QRCodeGenerator value={qrValue} size={250} />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Device Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Device Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-sm text-muted-foreground">Name</div>
                            <div className="font-medium">{d.name}</div>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">Serial Number</div>
                            <div className="font-medium">{d.serial}</div>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">Category</div>
                            <div className="font-medium">{d.category || 'N/A'}</div>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">Status</div>
                            <Badge variant={getStatusColor(d.status)}>{d.status}</Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Admin Actions */}
            {role === 'admin' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Admin Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={() => changeStatus('maintenance')}>
                            <Wrench className="mr-2 h-4 w-4" />
                            Mark Maintenance
                        </Button>
                        <Button variant="outline" onClick={() => changeStatus('retired')}>
                            Retire Device
                        </Button>
                        <Button variant="destructive" onClick={() => changeStatus('lost')}>
                            Mark Lost
                        </Button>
                        <Button onClick={approveLatest}>
                            Approve Latest Assignment
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Request Assignment */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Request Assignment
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const uid = Number((e.currentTarget.elements.namedItem('uid') as any).value); const notes = String((e.currentTarget.elements.namedItem('notes') as any).value || ''); requestAssign(uid, notes) }}>
                        <input
                            name="uid"
                            type="number"
                            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                            placeholder="User ID"
                            required
                        />
                        <input
                            name="notes"
                            className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                            placeholder="Notes (optional)"
                        />
                        <Button type="submit">Request</Button>
                    </form>
                </CardContent>
            </Card>

            {/* Assignments */}
            <Card>
                <CardHeader>
                    <CardTitle>Assignment History</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {(data.assignments || []).length === 0 ? (
                            <div className="text-sm text-muted-foreground text-center py-4">No assignments yet</div>
                        ) : (
                            (data.assignments || []).map((a: any) => (
                                <div key={a.id} className="border rounded-lg p-3 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <div className="font-medium">Assignment #{a.id}</div>
                                        <Badge variant={a.status === 'assigned' ? 'default' : 'secondary'}>
                                            {a.status}
                                        </Badge>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        User ID: {a.user_id}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Assigned: {a.assigned_at || '—'} • Returned: {a.returned_at || '—'}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Maintenance */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Wrench className="h-5 w-5" />
                        Maintenance History
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {(data.maintenance || []).length === 0 ? (
                            <div className="text-sm text-muted-foreground text-center py-4">No maintenance records</div>
                        ) : (
                            (data.maintenance || []).map((m: any) => (
                                <div key={m.id} className="border rounded-lg p-3 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <div className="font-medium">Maintenance #{m.id}</div>
                                        <Badge variant="secondary">{m.status}</Badge>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        Date: {m.maintenance_at}
                                    </div>
                                    {m.notes && (
                                        <div className="text-sm">Notes: {m.notes}</div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Audit History */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Audit Trail
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {(data.audit || []).length === 0 ? (
                            <div className="text-sm text-muted-foreground text-center py-4">No audit records</div>
                        ) : (
                            (data.audit || []).map((a: any) => (
                                <div key={a.id} className="border-l-2 border-primary pl-3 py-2">
                                    <div className="font-medium text-sm">{a.action}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {a.old_status && `${a.old_status} → `}{a.new_status || ''}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {a.created_at}
                                    </div>
                                    {a.comments && (
                                        <div className="text-xs mt-1">{a.comments}</div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
