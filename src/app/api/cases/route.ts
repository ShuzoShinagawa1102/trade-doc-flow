import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getAllCases, createCase, createRequirement, createAuditEvent } from '@/lib/db'

const EXPORT_REQUIREMENTS = [
  '船荷証券 (B/L)',
  '商業送り状',
  'パッキングリスト',
  '原産地証明書',
  '輸出許可証',
]

const IMPORT_REQUIREMENTS = [
  '船荷証券 (B/L)',
  '商業送り状',
  'パッキングリスト',
  '輸入許可証',
  '税関申告書',
]

export async function GET() {
  try {
    const cases = getAllCases()
    return NextResponse.json(cases)
  } catch (error) {
    console.error('GET /api/cases error:', error)
    return NextResponse.json({ error: 'Failed to fetch cases' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, case_type, exporter, importer, description, assigned_to, due_date } = body

    if (!title || !case_type) {
      return NextResponse.json({ error: 'title and case_type are required' }, { status: 400 })
    }

    const id = uuidv4()
    const now = new Date().toISOString()

    createCase({ id, title, case_type, exporter, importer, description, assigned_to, due_date, now })

    const requirements = case_type === 'Export' ? EXPORT_REQUIREMENTS : IMPORT_REQUIREMENTS
    for (const name of requirements) {
      createRequirement({ id: uuidv4(), case_id: id, name })
    }

    createAuditEvent({
      id: uuidv4(),
      case_id: id,
      event_type: 'CaseCreated',
      description: '案件が作成されました',
      actor: assigned_to || 'システム',
      created_at: now,
    })

    return NextResponse.json({ id }, { status: 201 })
  } catch (error) {
    console.error('POST /api/cases error:', error)
    return NextResponse.json({ error: 'Failed to create case' }, { status: 500 })
  }
}
