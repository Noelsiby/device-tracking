import { useState, FormEvent, ChangeEvent } from 'react'
import api from '../lib/api'
import { enqueueAction } from '../lib/offlineQueue'

export default function ReturnWithAI({ deviceId, onClose }: { deviceId: number, onClose: () => void }) {
    const [file, setFile] = useState<File | null>(null)
    const [notes, setNotes] = useState('')
    const [condition, setCondition] = useState('returned')
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const submit = async (e: FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        try {
            const fd = new FormData()
            fd.append('deviceId', String(deviceId))
            fd.append('notes', notes)
            fd.append('condition', condition)
            if (file) fd.append('photo', file)
            const { data } = await api.post('/api/return-with-ai', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
            setResult(data)
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Failed to return')
            await enqueueAction({ type: 'return', deviceId, condition, notes })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
            <form onSubmit={submit} className="bg-white text-black w-full max-w-md p-4 rounded grid gap-3">
                <h3 className="text-lg font-semibold">Return Device #{deviceId}</h3>
                <input type="file" accept="image/*" onChange={(e: ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] || null)} />
                <input className="border p-2 rounded" placeholder="Notes" value={notes} onChange={(e: ChangeEvent<HTMLInputElement>) => setNotes(e.target.value)} />
                <select className="border p-2 rounded" value={condition} onChange={(e) => setCondition(e.target.value)}>
                    <option value="returned">Returned</option>
                    <option value="damaged">Damaged</option>
                </select>
                {error && <div className="text-red-600 text-sm">{error}</div>}
                <div className="flex gap-2">
                    <button className="bg-black text-white rounded px-3 py-1" disabled={loading}>{loading ? 'Processing...' : 'Submit'}</button>
                    <button type="button" className="border rounded px-3 py-1" onClick={onClose}>Close</button>
                </div>
                {result && (
                    <div className="border rounded p-2">
                        <div className="font-medium mb-1">AI Detections</div>
                        <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(result?.ai, null, 2)}</pre>
                        <div className="font-medium mt-2">Updated Assignment</div>
                        <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(result?.assignment, null, 2)}</pre>
                    </div>
                )}
            </form>
        </div>
    )
}
