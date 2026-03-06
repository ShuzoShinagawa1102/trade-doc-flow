import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getCaseById, updateCaseStatus, createAuditEvent } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const caseDetail = getCaseById(params.id)
    if (!caseDetail) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }
    return NextResponse.json(caseDetail)
  } catch (error) {
    console.error('GET /api/cases/[id] error:', error)
    return NextResponse.json({ error: 'Failed to fetch case' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status, actor, reason } = body

    if (!status) {
      return NextResponse.json({ error: 'status is required' }, { status: 400 })
    }

    const existing = getCaseById(params.id)
    if (!existing) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    const now = new Date().toISOString()
    updateCaseStatus(params.id, status, now)

    createAuditEvent({
      id: uuidv4(),
      case_id: params.id,
      event_type: 'StatusChanged',
      description: `ステータスが ${status} に変更されました${reason ? ': ' + reason : ''}`,
      actor: actor || 'システム',
      created_at: now,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PATCH /api/cases/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update case' }, { status: 500 })
  }
}
