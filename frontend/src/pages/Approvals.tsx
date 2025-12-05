import { useEffect, useState } from 'react'
import api from '../lib/api'
import { socket } from '../lib/socket'

export default function Approvals() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await api.get('/api/approvals/pending')
      setItems(r.data)
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed')
    } finally { setLoading(false) }
  }

  useEffect(() => {
    load()
    socket.on('assignment:approved', load)
    socket.on('assignment:created', load)
    return () => {
      socket.off('assignment:approved', load)
      socket.off('assignment:created', load)
    }
  }, [])

  const approve = async (id: number) => {
    try {
      await api.post(`/api/assign/${id}/approve`)
      await load()
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Failed')
    }
  }

  if (loading) return <div className="p-4">Loading...</div>
  if (error) return <div className="p-4 text-red-600">{error}</div>

  return (
    <div className="p-4 grid gap-3">
      <h2 className="text-xl font-semibold">Pending Approvals</h2>
      {items.length === 0 ? (
        <div>No pending approvals</div>
      ) : (
        <div className="grid gap-2">
          {items.map(a => (
            <div key={a.id} className="border rounded p-2 text-sm flex items-center justify-between">
              <div>Assignment #{a.id} • Device {a.device_id} • User {a.user_id} • {a.status}</div>
              <button className="border rounded px-3 py-1" onClick={() => approve(a.id)}>Approve</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
