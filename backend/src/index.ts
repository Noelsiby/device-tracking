import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import http from 'http'
import { Server as SocketIOServer } from 'socket.io'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import axios from 'axios'
import FormData from 'form-data'
import { z } from 'zod'
import { Pool } from 'pg'

const app = express()
const server = http.createServer(app)
const io = new SocketIOServer(server, { cors: { origin: '*' } })

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

// DB
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/devicetracking'
})

async function initDatabase() {
    const schemaPath = path.join(process.cwd(), 'src', 'db', 'schema.sql')
    const sql = fs.readFileSync(schemaPath, 'utf-8')
    await pool.query(sql)
    // Ensure extra columns for approvals
    await pool.query("ALTER TABLE IF EXISTS assignments ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;")
    await pool.query("ALTER TABLE IF EXISTS assignments ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id);")
    await pool.query("ALTER TABLE IF EXISTS assignments ADD COLUMN IF NOT EXISTS requested_by INTEGER REFERENCES users(id);")
}

async function ensureAdminUser() {
    const email = 'admin@example.com'
    const role = 'admin'
    const password = 'password'
    const { rows } = await pool.query('SELECT id FROM users WHERE email=$1', [email])
    if (rows.length === 0) {
        const hash = await bcrypt.hash(password, 10)
        await pool.query('INSERT INTO users(email, role, password_hash) VALUES($1,$2,$3)', [email, role, hash])
        console.log('Seeded default admin user: admin@example.com / password')
    }
}

initDatabase().then(ensureAdminUser).catch((e) => {
    console.error('DB init error', e)
})

const AI_URL = process.env.AI_URL || 'http://localhost:8001'
const APPROVAL_REQUIRED = (process.env.APPROVAL_REQUIRED || 'false') === 'true'


// Auth
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'
const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const token = (req.headers.authorization || '').replace('Bearer ', '')
    if (!token) return res.status(401).json({ error: 'Unauthorized' })
    try {
        const decoded = jwt.verify(token, JWT_SECRET)
            ; (req as any).user = decoded
        next()
    } catch {
        res.status(401).json({ error: 'Invalid token' })
    }
}

// Uploads
const storage = multer.diskStorage({
    destination: (_, __, cb) => cb(null, path.join(process.cwd(), 'uploads')),
    filename: (_, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
        const ext = path.extname(file.originalname)
        cb(null, unique + ext)
    }
})
const upload = multer({ storage })

// Schemas
const DeviceSchema = z.object({
    name: z.string().min(1),
    serial: z.string().min(1),
    category: z.string().min(1),
    status: z.string().default('inventory'),
    location: z.string().optional()
})

// Socket.IO
io.on('connection', (socket) => {
    console.log('socket connected', socket.id)
})

app.get('/api/me', authMiddleware, async (req, res) => {
    const u = (req as any).user || {}
    res.json({ id: u.id, role: u.role })
})


app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body
    try {
        const { rows } = await pool.query('SELECT id, email, role, password_hash FROM users WHERE email=$1', [email])
        if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' })
        const user = rows[0]
        const valid = await bcrypt.compare(password || '', user.password_hash)
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' })
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' })
        res.json({ token })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Server error' })
    }
})

app.post('/api/devices', authMiddleware, async (req, res) => {
    const parsed = DeviceSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
    const d = parsed.data
    const result = await pool.query(
        'INSERT INTO devices(name, serial, category, status, location) VALUES($1,$2,$3,$4,$5) RETURNING *',
        [d.name, d.serial, d.category, d.status, d.location || null]
    )
    io.emit('device:created', result.rows[0])
    io.emit('dashboard:update')
    io.emit('dashboard:update')
    res.status(201).json(result.rows[0])
})

app.get('/api/devices', authMiddleware, async (req, res) => {
    const { name, id, serial, category, status, location, user } = req.query as any
    const where: string[] = []
    const values: any[] = []
    let idx = 1
    if (id) { where.push(`id = $${idx++}`); values.push(Number(id)) }
    if (name) { where.push(`name ILIKE $${idx++}`); values.push(`%${name}%`) }
    if (serial) { where.push(`serial ILIKE $${idx++}`); values.push(`%${serial}%`) }
    if (category) { where.push(`category ILIKE $${idx++}`); values.push(`%${category}%`) }
    if (status) { where.push(`status = $${idx++}`); values.push(String(status)) }
    if (location) { where.push(`location ILIKE $${idx++}`); values.push(`%${location}%`) }
    if (user) { where.push(`EXISTS (SELECT 1 FROM assignments a WHERE a.device_id=devices.id AND a.user_id=$${idx++} AND a.status='assigned')`); values.push(Number(user)) }
    const sql = `SELECT * FROM devices${where.length ? ' WHERE ' + where.join(' AND ') : ''} ORDER BY id DESC`
    const result = await pool.query(sql, values)
    res.json(result.rows)
})

app.get('/api/devices/:id', authMiddleware, async (req, res) => {
    const id = Number(req.params.id)
    const device = await pool.query('SELECT * FROM devices WHERE id=$1', [id])
    if (device.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    const assignments = await pool.query('SELECT * FROM assignments WHERE device_id=$1 ORDER BY id DESC', [id])
    const maintenance = await pool.query('SELECT * FROM maintenance WHERE device_id=$1 ORDER BY id DESC', [id])
    const audit = await pool.query("SELECT * FROM audit_logs WHERE entity='device' AND entity_id=$1 ORDER BY id DESC", [id])
    res.json({ device: device.rows[0], assignments: assignments.rows, maintenance: maintenance.rows, audit: audit.rows })
})

app.post('/api/devices/:id/status', authMiddleware, async (req, res) => {
    const id = Number(req.params.id)
    const { status, comments } = req.body
    const allowed = ['inventory', 'assigned', 'maintenance', 'retired', 'lost']
    const user = (req as any).user
    if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Admin only' })
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' })
    const current = await pool.query('SELECT status FROM devices WHERE id=$1', [id])
    if (current.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    const oldStatus = current.rows[0].status
    await pool.query('UPDATE devices SET status=$1 WHERE id=$2', [status, id])
    await pool.query(
        'INSERT INTO audit_logs(entity, entity_id, action, old_status, new_status, comments, created_at) VALUES($1,$2,$3,$4,$5,$6,NOW())',
        ['device', id, 'status_change', oldStatus, status, comments || null]
    )
    io.emit('device:status', { id, status })
    io.emit('dashboard:update')
    io.emit('dashboard:update')
    res.json({ id, status })
})


app.post('/api/assign', authMiddleware, async (req, res) => {
    const { deviceId, userId, notes } = req.body
    const user = (req as any).user
    const pending = APPROVAL_REQUIRED && user.role !== 'admin'
    const result = await pool.query(
        pending
            ? 'INSERT INTO assignments(device_id, user_id, requested_by, notes, status) VALUES($1,$2,$3,$4,$5) RETURNING *'
            : 'INSERT INTO assignments(device_id, user_id, assigned_at, requested_by, notes, status) VALUES($1,$2,NOW(),$3,$4,$5) RETURNING *',
        [deviceId, userId, user.id, notes || null, pending ? 'pending_approval' : 'assigned']
    )
    if (!pending) {
        await pool.query('UPDATE devices SET status=$1 WHERE id=$2', ['assigned', deviceId])
        io.emit('assignment:created', result.rows[0])
        io.emit('dashboard:update')
        io.emit('dashboard:update')
    }
    res.status(201).json(result.rows[0])
})

app.post('/api/assign/:id/approve', authMiddleware, async (req, res) => {
    const id = Number(req.params.id)
    const user = (req as any).user
    if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Admin only' })
    const row = await pool.query('SELECT * FROM assignments WHERE id=$1', [id])
    if (row.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    const a = row.rows[0]
    if (a.status !== 'pending_approval') return res.status(400).json({ error: 'Not pending approval' })
    await pool.query('UPDATE assignments SET status=$1, assigned_at=NOW(), approved_at=NOW(), approved_by=$2 WHERE id=$3', ['assigned', user.id, id])
    await pool.query('UPDATE devices SET status=$1 WHERE id=$2', ['assigned', a.device_id])
    const updated = await pool.query('SELECT * FROM assignments WHERE id=$1', [id])
    io.emit('assignment:approved', updated.rows[0])
    io.emit('dashboard:update')
    io.emit('dashboard:update')
    res.json(updated.rows[0])
})



app.post('/api/return', authMiddleware, upload.single('photo'), async (req, res) => {
    const { assignmentId, condition, notes } = req.body
    const photoPath = req.file ? `/uploads/${req.file.filename}` : null
    const result = await pool.query(
        'UPDATE assignments SET returned_at=NOW(), notes=$1, status=$2, return_photo=$3 WHERE id=$4 RETURNING *',
        [notes || null, condition || 'returned', photoPath, assignmentId]
    )
    const assignment = result.rows[0]
    await pool.query('UPDATE devices SET status=$1 WHERE id=$2', ['inventory', assignment.device_id])
    io.emit('assignment:returned', assignment)
    res.json(assignment)
})

app.post('/api/audit', authMiddleware, async (req, res) => {
    const { entity, entityId, action, oldStatus, newStatus, comments } = req.body
    const result = await pool.query(
        'INSERT INTO audit_logs(entity, entity_id, action, old_status, new_status, comments, created_at) VALUES($1,$2,$3,$4,$5,$6,NOW()) RETURNING *',
        [entity, entityId, action, oldStatus || null, newStatus || null, comments || null]
    )
    res.status(201).json(result.rows[0])
})

app.post('/api/upload', authMiddleware, upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file' })
    res.status(201).json({ path: `/uploads/${req.file.filename}` })
})

app.post('/api/ai/damage-detect', authMiddleware, upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No photo' })
        const filePath = path.join(process.cwd(), 'uploads', req.file.filename)
        const form = new FormData()
        form.append('photo', fs.createReadStream(filePath), req.file.originalname)
        const r = await axios.post(`${AI_URL}/damage-detect`, form, { headers: form.getHeaders() })
        res.json({ ai: r.data, path: `/uploads/${req.file.filename}` })
    } catch (e) {
        console.error(e)
        res.status(500).json({ error: 'AI proxy error' })
    }
})

app.get('/api/dashboard/stats', authMiddleware, async (_, res) => {
    const available = await pool.query("SELECT COUNT(*) FROM devices WHERE status='inventory'")
    const assigned = await pool.query("SELECT COUNT(*) FROM devices WHERE status='assigned'")
    const maintenance = await pool.query("SELECT COUNT(*) FROM devices WHERE status='maintenance'")
    const lost = await pool.query("SELECT COUNT(*) FROM devices WHERE status='lost'")
    const overdue = await pool.query("SELECT COUNT(*) FROM assignments WHERE status='assigned' AND returned_at IS NULL AND assigned_at < NOW() - INTERVAL '7 days'")
    res.json({
        available: Number(available.rows[0].count),
        assigned: Number(assigned.rows[0].count),
        maintenance: Number(maintenance.rows[0].count),
        lost: Number(lost.rows[0].count),
        overdue: Number(overdue.rows[0].count)
    })
})


app.post('/api/sync', authMiddleware, async (req, res) => {
    try {
        const { actions } = req.body
        if (!Array.isArray(actions)) return res.status(400).json({ error: 'Invalid payload' })
        const results: any[] = []
        for (const a of actions) {
            if (a?.type === 'assign') {
                const result = await pool.query(
                    'INSERT INTO assignments(device_id, user_id, assigned_at, notes, status) VALUES($1,$2,NOW(),$3,$4) RETURNING *',
                    [a.deviceId, a.userId, a.notes || null, 'assigned']
                )
                await pool.query('UPDATE devices SET status=$1 WHERE id=$2', ['assigned', a.deviceId])
                results.push({ type: 'assign', id: result.rows[0].id })
            } else if (a?.type === 'return') {
                const found = await pool.query("SELECT id FROM assignments WHERE device_id=$1 AND status='assigned' ORDER BY id DESC LIMIT 1", [a.deviceId])
                if (found.rows.length) {
                    const assignmentId = found.rows[0].id
                    const result = await pool.query(
                        'UPDATE assignments SET returned_at=NOW(), notes=$1, status=$2 WHERE id=$3 RETURNING *',
                        [a.notes || null, a.condition || 'returned', assignmentId]
                    )
                    await pool.query('UPDATE devices SET status=$1 WHERE id=$2', ['inventory', a.deviceId])
                    results.push({ type: 'return', id: result.rows[0].id })
                } else {
                    results.push({ type: 'return', error: 'No active assignment' })
                }
            }
        }
        res.json({ results })
    } catch (e) {
        console.error(e)
        res.status(500).json({ error: 'Sync failed' })
    }
})

app.get('/api/approvals/pending', authMiddleware, async (req, res) => {
    const user = (req as any).user
    if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Admin only' })
    const rows = await pool.query("SELECT * FROM assignments WHERE status='pending_approval' ORDER BY id DESC")
    res.json(rows.rows)
})

app.get('/api/dashboard/stats', authMiddleware, async (_, res) => {
    const available = await pool.query("SELECT COUNT(*) FROM devices WHERE status='inventory'")
    const assigned = await pool.query("SELECT COUNT(*) FROM devices WHERE status='assigned'")
    const maintenance = await pool.query("SELECT COUNT(*) FROM devices WHERE status='maintenance'")
    const lost = await pool.query("SELECT COUNT(*) FROM devices WHERE status='lost'")
    const overdue = await pool.query("SELECT COUNT(*) FROM assignments WHERE status='assigned' AND returned_at IS NULL AND assigned_at < NOW() - INTERVAL '7 days'")
    res.json({
        available: Number(available.rows[0].count),
        assigned: Number(assigned.rows[0].count),
        maintenance: Number(maintenance.rows[0].count),
        lost: Number(lost.rows[0].count),
        overdue: Number(overdue.rows[0].count)
    })
})

const PORT = process.env.PORT || 4000
server.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`)
})
