import { openDB, IDBPDatabase } from 'idb'
import api from './api'

const dbPromise = openDB('device-tracking', 1, {
    upgrade(db: IDBPDatabase) {
        if (!db.objectStoreNames.contains('queue')) {
            db.createObjectStore('queue', { keyPath: 'id', autoIncrement: true })
        }
    }
})

export async function enqueueAction(action: any) {
    const db = await dbPromise
    await db.add('queue', { action, timestamp: Date.now() })
}

export async function flushQueue() {
    const db = await dbPromise
    const tx = db.transaction('queue', 'readwrite')
    const store = tx.store
    const actions: any[] = []
    let cursor = await store.openCursor()
    while (cursor) {
        actions.push(cursor.value.action)
        cursor = await cursor.continue()
    }
    if (actions.length === 0) return { ok: true, message: 'No queued actions' }
    try {
        await api.post('/api/sync', { actions })
        await store.clear()
        return { ok: true }
    } catch (e) {
        return { ok: false, error: 'Sync failed' }
    } finally {
        await tx.done
    }
}
