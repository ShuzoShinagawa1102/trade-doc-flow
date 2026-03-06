import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getCaseById, updateCaseStatus, createAuditEvent } from '@/lib/db'

const DECISION_STATUS_MAP: Record<string, string> = {
  Approve: 'Approved',
  Reject: 'Rejected',
  Escalate: 'Exception',
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { decision, decided_by, reason } = body

    if (!decision || !['Approve', 'Reject', 'Escalate'].includes(decision)) {
      return NextResponse.json({ error: 'Valid decision (Approve/Reject/Escalate) is required' }, { status: 400 })
    }

    const existing = getCaseById(id)
    if (!existing) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    const newStatus = DECISION_STATUS_MAP[decision]
    const now = new Date().toISOString()

    updateCaseStatus(id, newStatus, now)

    const decisionLabel = decision === 'Approve' ? '承認' : decision === 'Reject' ? '却下' : 'エスカレーション'
    createAuditEvent({
      id: uuidv4(),
      case_id: id,
      event_type: 'DecisionMade',
      description: `案件が${decisionLabel}されました${reason ? ': ' + reason : ''}`,
      actor: decided_by || 'システム',
      created_at: now,
    })

    return NextResponse.json({ success: true, new_status: newStatus })
  } catch (error) {
    console.error('POST /api/cases/[id]/decision error:', error)
    return NextResponse.json({ error: 'Failed to process decision' }, { status: 500 })
  }
}
