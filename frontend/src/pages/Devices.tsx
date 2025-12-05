import { useEffect, useState } from 'react'
import api from '../lib/api'
import { Link } from 'react-router-dom'
import { socket } from '../lib/socket'
import { flushQueue } from '../lib/offlineQueue'
import ReturnWithAI from '../shared/ReturnWithAI'

interface Device {
    id: number
    name: string
    serial: string
    category: string
    status: string
    location?: string
}

export default function Devices() {
    const [devices, setDevices] = useState<Device[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [returnId, setReturnId] = useState<number | null>(null)
    const [qName, setQName] = useState('')
    const [qSerial, setQSerial] = useState('')
    const [qCategory, setQCategory] = useState('')
    const [qStatus, setQStatus] = useState('')
    const [qLocation, setQLocation] = useState('')
    const [qUserId, setQUserId] = useState<number | null>(null)

    useEffect(() => {
        const fetchDevices = async () => {
            setLoading(true)
            setError(null)
            try {
                const { data } = await api.get('/api/devices')
                setDevices(data)
            } catch (err: any) {
                setError(err?.response?.data?.error || 'Failed to load devices')
            } finally {
                setLoading(false)
            }
        }
        fetchDevices()
    }, [])

    const applyFilters = async () => {
        setLoading(true)
        setError(null)
        try {
            const params: any = {}
            if (qName) params.name = qName
            if (qSerial) params.serial = qSerial
            if (qCategory) params.category = qCategory
            if (qStatus) params.status = qStatus
            if (qLocation) params.location = qLocation
            if (qUserId != null) params.user = qUserId
            const { data } = await api.get('/api/devices', { params })
            setDevices(data)
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Failed to load devices')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-4 grid gap-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Devices</h2>
                <button className="border rounded px-3 py-1" onClick={() => window.location.reload()}>Refresh</button>
                <button className="border rounded px-3 py-1" onClick={async () => { const r = await flushQueue(); alert(r.ok ? 'Synced' : (r.error || r.message)); }}>Sync Offline</button>
            </div>
            <div className="grid md:grid-cols-3 gap-2">
                <input className="border rounded p-2" placeholder="Name" value={qName} onChange={(e) => setQName(e.target.value)} />
                <input className="border rounded p-2" placeholder="Serial" value={qSerial} onChange={(e) => setQSerial(e.target.value)} />
                <input className="border rounded p-2" placeholder="Category" value={qCategory} onChange={(e) => setQCategory(e.target.value)} />
                <select className="border rounded p-2" value={qStatus} onChange={(e) => setQStatus(e.target.value)}>
                    <option value="">Any Status</option>
                    <option value="inventory">Inventory</option>
                    <option value="assigned">Assigned</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="retired">Retired</option>
                    <option value="lost">Lost</option>
                </select>
                <input className="border rounded p-2" placeholder="Location" value={qLocation} onChange={(e) => setQLocation(e.target.value)} />
                <input className="border rounded p-2" type="number" placeholder="User ID" value={qUserId ?? ''} onChange={(e) => setQUserId(e.target.value ? Number(e.target.value) : null)} />
            </div>
            <div>
                <button className="border rounded px-3 py-1" onClick={applyFilters}>Apply Filters</button>
            </div>
            {loading ? (
                <div className="animate-pulse h-20 bg-muted rounded" />
            ) : error ? (
                <div className="text-red-600">{error}</div>
            ) : (
                <div className="grid gap-3">
                    {devices.map(d => (
                        <div key={d.id} className="border rounded p-3 flex items-center justify-between">
                            <div>
                                <div className="font-medium">{d.name}</div>
                                <div className="text-sm text-muted-foreground">{d.serial} • {d.category} • {d.status}</div>
                            </div>
                            <div className="flex gap-2">
                                <Link className="border rounded px-3 py-1" to={`/devices/${d.id}`}>View</Link>
                                {d.status === 'assigned' && (
                                    <button className="border rounded px-3 py-1" onClick={() => setReturnId(d.id)}>Return with AI</button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {returnId && (
                <ReturnWithAI deviceId={returnId} onClose={() => setReturnId(null)} />
            )}
        </div>
    )
}
