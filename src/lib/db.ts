import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DB_DIR = path.join(process.cwd(), '.db')
const DB_PATH = path.join(DB_DIR, 'trade-doc-flow.db')

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true })
}

let db: Database.Database

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    initializeSchema(db)
  }
  return db
}

function initializeSchema(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS cases (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      case_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Draft',
      exporter TEXT,
      importer TEXT,
      description TEXT,
      assigned_to TEXT,
      due_date TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS requirements (
      id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'Pending',
      due_date TEXT,
      FOREIGN KEY (case_id) REFERENCES cases(id)
    );

    CREATE TABLE IF NOT EXISTS evidence (
      id TEXT PRIMARY KEY,
      requirement_id TEXT NOT NULL,
      case_id TEXT NOT NULL,
      document_type TEXT NOT NULL,
      file_name TEXT,
      status TEXT DEFAULT 'Received',
      submitted_by TEXT,
      submitted_at TEXT NOT NULL,
      expiry_date TEXT,
      notes TEXT,
      FOREIGN KEY (requirement_id) REFERENCES requirements(id)
    );

    CREATE TABLE IF NOT EXISTS audit_events (
      id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      description TEXT NOT NULL,
      actor TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (case_id) REFERENCES cases(id)
    );
  `)
}

export function getAllCases() {
  const database = getDb()
  const cases = database.prepare('SELECT * FROM cases ORDER BY updated_at DESC').all() as import('@/types').Case[]

  return cases.map(c => {
    const reqs = database.prepare('SELECT * FROM requirements WHERE case_id = ?').all(c.id) as import('@/types').Requirement[]
    const total = reqs.length
    if (total === 0) return { ...c, completeness_score: 0 }
    const satisfied = reqs.filter(r => r.status === 'Satisfied').length
    const completeness_score = Math.round((satisfied / total) * 100)
    return { ...c, completeness_score }
  })
}

export function getCaseById(id: string) {
  const database = getDb()
  const caseRow = database.prepare('SELECT * FROM cases WHERE id = ?').get(id) as import('@/types').Case | undefined
  if (!caseRow) return null

  const requirements = database.prepare('SELECT * FROM requirements WHERE case_id = ?').all(id) as import('@/types').Requirement[]
  const requirementsWithEvidence = requirements.map(req => {
    const evidence = database.prepare('SELECT * FROM evidence WHERE requirement_id = ?').all(req.id) as import('@/types').Evidence[]
    return { ...req, evidence }
  })

  const audit_events = database.prepare('SELECT * FROM audit_events WHERE case_id = ? ORDER BY created_at DESC').all(id) as import('@/types').AuditEvent[]

  const total = requirements.length
  const satisfied = requirements.filter(r => r.status === 'Satisfied').length
  const completeness_score = total === 0 ? 0 : Math.round((satisfied / total) * 100)

  const missing_items = requirements
    .filter(r => r.status !== 'Satisfied')
    .map(r => r.name)

  let recommendation: import('@/types').DecisionType = 'Reject'
  let reason = ''

  if (completeness_score === 100) {
    recommendation = 'Approve'
    reason = 'すべての必要書類が揃っています。承認を推奨します。'
  } else if (completeness_score >= 80) {
    recommendation = 'Escalate'
    reason = `書類の${100 - completeness_score}%が未提出です。例外処理を検討してください。`
  } else {
    recommendation = 'Reject'
    reason = `書類の${100 - completeness_score}%が未提出です。必要書類が不足しています。`
  }

  return {
    ...caseRow,
    completeness_score,
    requirements: requirementsWithEvidence,
    audit_events,
    decision_recommendation: {
      recommendation,
      reason,
      missing_items,
      completeness_score,
    },
  }
}

export function createCase(data: {
  id: string
  title: string
  case_type: string
  exporter?: string
  importer?: string
  description?: string
  assigned_to?: string
  due_date?: string
  now: string
}) {
  const database = getDb()
  database.prepare(`
    INSERT INTO cases (id, title, case_type, status, exporter, importer, description, assigned_to, due_date, created_at, updated_at)
    VALUES (?, ?, ?, 'Draft', ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.id, data.title, data.case_type,
    data.exporter || null, data.importer || null,
    data.description || null, data.assigned_to || null,
    data.due_date || null, data.now, data.now
  )
}

export function createRequirement(data: {
  id: string
  case_id: string
  name: string
  description?: string
}) {
  const database = getDb()
  database.prepare(`
    INSERT INTO requirements (id, case_id, name, description, status)
    VALUES (?, ?, ?, ?, 'Pending')
  `).run(data.id, data.case_id, data.name, data.description || null)
}

export function addEvidence(data: {
  id: string
  requirement_id: string
  case_id: string
  document_type: string
  file_name?: string
  submitted_by?: string
  submitted_at: string
  expiry_date?: string
  notes?: string
}) {
  const database = getDb()
  database.prepare(`
    INSERT INTO evidence (id, requirement_id, case_id, document_type, file_name, status, submitted_by, submitted_at, expiry_date, notes)
    VALUES (?, ?, ?, ?, ?, 'Received', ?, ?, ?, ?)
  `).run(
    data.id, data.requirement_id, data.case_id,
    data.document_type, data.file_name || null,
    data.submitted_by || null, data.submitted_at,
    data.expiry_date || null, data.notes || null
  )
  database.prepare(`UPDATE requirements SET status = 'Satisfied' WHERE id = ?`).run(data.requirement_id)
}

export function updateCaseStatus(id: string, status: string, now: string) {
  const database = getDb()
  database.prepare(`UPDATE cases SET status = ?, updated_at = ? WHERE id = ?`).run(status, now, id)
}

export function createAuditEvent(data: {
  id: string
  case_id: string
  event_type: string
  description: string
  actor: string
  created_at: string
}) {
  const database = getDb()
  database.prepare(`
    INSERT INTO audit_events (id, case_id, event_type, description, actor, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(data.id, data.case_id, data.event_type, data.description, data.actor, data.created_at)
}

export function getCaseCount(): number {
  const database = getDb()
  const result = database.prepare('SELECT COUNT(*) as count FROM cases').get() as { count: number }
  return result.count
}

export function insertCaseDirect(data: {
  id: string
  title: string
  case_type: string
  status: string
  exporter?: string
  importer?: string
  description?: string
  assigned_to?: string
  due_date?: string
  created_at: string
  updated_at: string
}) {
  const database = getDb()
  database.prepare(`
    INSERT OR IGNORE INTO cases (id, title, case_type, status, exporter, importer, description, assigned_to, due_date, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.id, data.title, data.case_type, data.status,
    data.exporter || null, data.importer || null,
    data.description || null, data.assigned_to || null,
    data.due_date || null, data.created_at, data.updated_at
  )
}

export function insertRequirementDirect(data: {
  id: string
  case_id: string
  name: string
  description?: string
  status: string
}) {
  const database = getDb()
  database.prepare(`
    INSERT OR IGNORE INTO requirements (id, case_id, name, description, status)
    VALUES (?, ?, ?, ?, ?)
  `).run(data.id, data.case_id, data.name, data.description || null, data.status)
}

export function insertEvidenceDirect(data: {
  id: string
  requirement_id: string
  case_id: string
  document_type: string
  file_name?: string
  status: string
  submitted_by?: string
  submitted_at: string
  expiry_date?: string
  notes?: string
}) {
  const database = getDb()
  database.prepare(`
    INSERT OR IGNORE INTO evidence (id, requirement_id, case_id, document_type, file_name, status, submitted_by, submitted_at, expiry_date, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.id, data.requirement_id, data.case_id,
    data.document_type, data.file_name || null, data.status,
    data.submitted_by || null, data.submitted_at,
    data.expiry_date || null, data.notes || null
  )
}

export function insertAuditEventDirect(data: {
  id: string
  case_id: string
  event_type: string
  description: string
  actor: string
  created_at: string
}) {
  const database = getDb()
  database.prepare(`
    INSERT OR IGNORE INTO audit_events (id, case_id, event_type, description, actor, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(data.id, data.case_id, data.event_type, data.description, data.actor, data.created_at)
}
