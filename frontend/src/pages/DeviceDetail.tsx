import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { socket } from '../lib/socket'
import api from '../lib/api'

export default function DeviceDetail() {
    const { id } = useParams()
    const deviceId = Number(id)
    const [data, setData] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const role = localStorage.getItem('role')

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

    if (loading) return <div className="p-4">Loading...</div>
    if (error) return <div className="p-4 text-red-600">{error}</div>

    const d = data.device
    return (
        <div className="p-4 grid gap-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{d.name}</h2>
                <div className="text-sm">Serial: {d.serial} • Status: {d.status}</div>
            </div>

            {role === 'admin' && (
                <div className="flex gap-2">
                    <button className="border rounded px-3 py-1" onClick={() => changeStatus('maintenance')}>Mark Maintenance</button>
                    <button className="border rounded px-3 py-1" onClick={() => changeStatus('retired')}>Retire</button>
                    <button className="border rounded px-3 py-1" onClick={() => changeStatus('lost')}>Mark Lost</button>
                    <button className="border rounded px-3 py-1" onClick={approveLatest}>Approve Latest Assignment</button>
                </div>
            )}

            <div className="border rounded p-3">
                <div className="font-medium mb-2">Request Assignment</div>
                <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const uid = Number((e.currentTarget.elements.namedItem('uid') as any).value); const notes = String((e.currentTarget.elements.namedItem('notes') as any).value || ''); requestAssign(uid, notes) }}>
                    <input name="uid" type="number" className="border rounded p-2" placeholder="User ID" />
                    <input name="notes" className="border rounded p-2" placeholder="Notes" />
                    <button className="border rounded px-3 py-1">Request</button>
                </form>
            </div>

            <div>
                <h3 className="font-medium">Assignments</h3>
                <div className="grid gap-2">
                    {(data.assignments || []).map((a: any) => (
                        <div key={a.id} className="border rounded p-2 text-sm">
                            <div>#{a.id} • User {a.user_id} • {a.status}</div>
                            <div>Assigned: {a.assigned_at || '—'} • Returned: {a.returned_at || '—'}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="font-medium">Maintenance</h3>
                <div className="grid gap-2">
                    {(data.maintenance || []).map((m: any) => (
                        <div key={m.id} className="border rounded p-2 text-sm">
                            <div>#{m.id} • {m.status}</div>
                            <div>When: {m.maintenance_at} • Notes: {m.notes || '—'}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="font-medium">Audit History</h3>
                <div className="grid gap-2">
                    {(data.audit || []).map((a: any) => (
                        <div key={a.id} className="border rounded p-2 text-sm">
                            <div>{a.action} • old: {a.old_status || '—'} → new: {a.new_status || '—'}</div>
                            <div>{a.created_at} • {a.comments || ''}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
