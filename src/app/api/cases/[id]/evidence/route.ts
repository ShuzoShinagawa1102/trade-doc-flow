import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getCaseById, addEvidence, createAuditEvent } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { requirement_id, document_type, file_name, submitted_by, expiry_date, notes } = body

    if (!requirement_id || !document_type) {
      return NextResponse.json({ error: 'requirement_id and document_type are required' }, { status: 400 })
    }

    const existing = getCaseById(id)
    if (!existing) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    const now = new Date().toISOString()
    const evidenceId = uuidv4()

    addEvidence({
      id: evidenceId,
      requirement_id,
      case_id: id,
      document_type,
      file_name,
      submitted_by,
      submitted_at: now,
      expiry_date,
      notes,
    })

    createAuditEvent({
      id: uuidv4(),
      case_id: id,
      event_type: 'EvidenceAdded',
      description: `証憑「${document_type}」が追加されました`,
      actor: submitted_by || 'システム',
      created_at: now,
    })

    return NextResponse.json({ id: evidenceId }, { status: 201 })
  } catch (error) {
    console.error('POST /api/cases/[id]/evidence error:', error)
    return NextResponse.json({ error: 'Failed to add evidence' }, { status: 500 })
  }
}
