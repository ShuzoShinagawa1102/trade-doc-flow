'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import type { CaseDetail, CaseStatus, DecisionType } from '@/types'
import StatusBadge from '@/components/StatusBadge'
import EvidenceCompleteness from '@/components/EvidenceCompleteness'

const STATUS_TRANSITIONS: Record<CaseStatus, { label: string; next: CaseStatus }[]> = {
  Draft: [{ label: '受付確認', next: 'IntakeValidated' }],
  IntakeValidated: [{ label: '証憑収集開始', next: 'WaitingForEvidence' }],
  WaitingForEvidence: [{ label: '審査開始', next: 'InReview' }],
  InReview: [],
  Approved: [{ label: 'クローズ', next: 'Closed' }],
  Rejected: [{ label: 'クローズ', next: 'Closed' }],
  Exception: [{ label: '審査再開', next: 'InReview' }],
  Closed: [],
}

const REQUIREMENT_STATUS_ICON: Record<string, string> = {
  Satisfied: '✓',
  Pending: '⚠',
  Rejected: '✗',
}

const REQUIREMENT_STATUS_COLOR: Record<string, string> = {
  Satisfied: 'text-green-600 bg-green-50 border-green-200',
  Pending: 'text-amber-600 bg-amber-50 border-amber-200',
  Rejected: 'text-red-600 bg-red-50 border-red-200',
}

const DECISION_CONFIG: Record<DecisionType, { label: string; className: string; btnClass: string }> = {
  Approve: { label: '承認推奨', className: 'bg-green-100 text-green-700 border border-green-300', btnClass: 'bg-green-600 hover:bg-green-700' },
  Reject: { label: '却下推奨', className: 'bg-red-100 text-red-700 border border-red-300', btnClass: 'bg-red-600 hover:bg-red-700' },
  Escalate: { label: 'エスカレーション推奨', className: 'bg-orange-100 text-orange-700 border border-orange-300', btnClass: 'bg-orange-600 hover:bg-orange-700' },
}

const AUDIT_EVENT_ICONS: Record<string, string> = {
  CaseCreated: '📋',
  StatusChanged: '🔄',
  EvidenceAdded: '📎',
  EvidenceRejected: '❌',
  DecisionMade: '✅',
}

export default function CaseDetailPage() {
  const params = useParams<{ id: string }>()
  const caseId = params.id
  const [caseData, setCaseData] = useState<CaseDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeEvidenceForm, setActiveEvidenceForm] = useState<string | null>(null)
  const [evidenceForm, setEvidenceForm] = useState({ document_type: '', file_name: '', submitted_by: '', expiry_date: '', notes: '' })
  const [submittingEvidence, setSubmittingEvidence] = useState(false)
  const [showDecisionModal, setShowDecisionModal] = useState(false)
  const [decisionForm, setDecisionForm] = useState({ decision: '' as DecisionType | '', decided_by: '', reason: '' })
  const [submittingDecision, setSubmittingDecision] = useState(false)
  const [transitionLoading, setTransitionLoading] = useState(false)

  const fetchCase = useCallback(async () => {
    try {
      const res = await fetch(`/api/cases/${caseId}`)
      if (res.ok) {
        const data = await res.json()
        setCaseData(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [caseId])

  useEffect(() => { fetchCase() }, [fetchCase])

  async function handleStatusTransition(newStatus: CaseStatus) {
    setTransitionLoading(true)
    try {
      await fetch(`/api/cases/${caseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, actor: '担当者' }),
      })
      await fetchCase()
    } finally {
      setTransitionLoading(false)
    }
  }

  async function handleEvidenceSubmit(requirementId: string) {
    setSubmittingEvidence(true)
    try {
      await fetch(`/api/cases/${caseId}/evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...evidenceForm, requirement_id: requirementId }),
      })
      setActiveEvidenceForm(null)
      setEvidenceForm({ document_type: '', file_name: '', submitted_by: '', expiry_date: '', notes: '' })
      await fetchCase()
    } finally {
      setSubmittingEvidence(false)
    }
  }

  async function handleDecisionSubmit() {
    if (!decisionForm.decision) return
    setSubmittingDecision(true)
    try {
      await fetch(`/api/cases/${caseId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(decisionForm),
      })
      setShowDecisionModal(false)
      await fetchCase()
    } finally {
      setSubmittingDecision(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64" />
        <div className="grid grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <div key={i} className="h-96 bg-gray-200 rounded-lg" />)}
        </div>
      </div>
    )
  }

  if (!caseData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">案件が見つかりません</p>
        <Link href="/cases" className="text-blue-600 hover:underline mt-2 inline-block">案件一覧に戻る</Link>
      </div>
    )
  }

  const transitions = STATUS_TRANSITIONS[caseData.status] ?? []
  const rec = caseData.decision_recommendation
  const recConfig = DECISION_CONFIG[rec.recommendation]
  const canMakeDecision = caseData.status === 'InReview'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/cases" className="text-gray-500 hover:text-gray-700 text-sm">← 案件一覧</Link>
        <h1 className="text-xl font-bold text-gray-900 truncate">{caseData.title}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel 1: Case Info */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
          <div className="flex items-start justify-between">
            <h2 className="text-base font-semibold text-gray-900">案件情報</h2>
            <StatusBadge status={caseData.status} />
          </div>

          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase">種別</dt>
              <dd className="mt-0.5 text-gray-900">{caseData.case_type === 'Export' ? '輸出' : '輸入'}</dd>
            </div>
            {caseData.exporter && (
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase">輸出者</dt>
                <dd className="mt-0.5 text-gray-900">{caseData.exporter}</dd>
              </div>
            )}
            {caseData.importer && (
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase">輸入者</dt>
                <dd className="mt-0.5 text-gray-900">{caseData.importer}</dd>
              </div>
            )}
            {caseData.assigned_to && (
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase">担当者</dt>
                <dd className="mt-0.5 text-gray-900">{caseData.assigned_to}</dd>
              </div>
            )}
            {caseData.due_date && (
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase">期限日</dt>
                <dd className={`mt-0.5 ${new Date(caseData.due_date) < new Date() ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                  {new Date(caseData.due_date).toLocaleDateString('ja-JP')}
                </dd>
              </div>
            )}
            {caseData.description && (
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase">説明</dt>
                <dd className="mt-0.5 text-gray-700 text-xs leading-relaxed">{caseData.description}</dd>
              </div>
            )}
          </dl>

          {transitions.length > 0 && (
            <div className="pt-3 border-t border-gray-100 space-y-2">
              <p className="text-xs font-medium text-gray-500">ステータス遷移</p>
              {transitions.map(t => (
                <button
                  key={t.next}
                  onClick={() => handleStatusTransition(t.next)}
                  disabled={transitionLoading}
                  className="w-full text-sm font-medium py-2 px-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                >
                  {t.label} →
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Panel 2: Requirements & Evidence */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">必要書類・証憑</h2>
          </div>

          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>書類完成度</span>
              <span>{caseData.completeness_score}%</span>
            </div>
            <EvidenceCompleteness score={caseData.completeness_score ?? 0} />
          </div>

          <div className="space-y-3">
            {caseData.requirements.map(req => (
              <div key={req.id} className="border rounded-lg overflow-hidden">
                <div className={`flex items-center justify-between px-3 py-2.5 ${REQUIREMENT_STATUS_COLOR[req.status]}`}>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{REQUIREMENT_STATUS_ICON[req.status]}</span>
                    <span className="text-sm font-medium">{req.name}</span>
                  </div>
                  {req.status !== 'Satisfied' && (
                    <button
                      onClick={() => setActiveEvidenceForm(activeEvidenceForm === req.id ? null : req.id)}
                      className="text-xs px-2 py-1 bg-white border rounded hover:bg-gray-50 transition-colors text-gray-600"
                    >
                      証憑追加
                    </button>
                  )}
                </div>

                {req.evidence.length > 0 && (
                  <div className="px-3 py-2 bg-white border-t border-gray-100 space-y-1">
                    {req.evidence.map(ev => (
                      <div key={ev.id} className="text-xs text-gray-600">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-800">{ev.file_name || ev.document_type}</span>
                          <span className={`px-1.5 py-0.5 rounded text-xs ${
                            ev.status === 'Verified' ? 'bg-green-100 text-green-700' :
                            ev.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>{ev.status === 'Verified' ? '確認済' : ev.status === 'Rejected' ? '却下' : '受領済'}</span>
                        </div>
                        <div className="text-gray-500 mt-0.5">
                          {ev.submitted_by && <span>提出者: {ev.submitted_by}</span>}
                          {ev.expiry_date && <span className="ml-2">有効期限: {new Date(ev.expiry_date).toLocaleDateString('ja-JP')}</span>}
                        </div>
                        {ev.notes && <div className="text-gray-500 italic">{ev.notes}</div>}
                      </div>
                    ))}
                  </div>
                )}

                {activeEvidenceForm === req.id && (
                  <div className="px-3 py-3 bg-gray-50 border-t border-gray-200 space-y-2">
                    <p className="text-xs font-semibold text-gray-700">証憑情報を入力</p>
                    <input
                      type="text"
                      placeholder="書類種別 *"
                      value={evidenceForm.document_type}
                      onChange={e => setEvidenceForm(f => ({ ...f, document_type: e.target.value }))}
                      className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="ファイル名"
                      value={evidenceForm.file_name}
                      onChange={e => setEvidenceForm(f => ({ ...f, file_name: e.target.value }))}
                      className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="提出者"
                      value={evidenceForm.submitted_by}
                      onChange={e => setEvidenceForm(f => ({ ...f, submitted_by: e.target.value }))}
                      className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <input
                      type="date"
                      placeholder="有効期限"
                      value={evidenceForm.expiry_date}
                      onChange={e => setEvidenceForm(f => ({ ...f, expiry_date: e.target.value }))}
                      className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <textarea
                      placeholder="備考"
                      value={evidenceForm.notes}
                      onChange={e => setEvidenceForm(f => ({ ...f, notes: e.target.value }))}
                      rows={2}
                      className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEvidenceSubmit(req.id)}
                        disabled={submittingEvidence || !evidenceForm.document_type}
                        className="flex-1 text-xs py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {submittingEvidence ? '追加中...' : '追加'}
                      </button>
                      <button
                        onClick={() => setActiveEvidenceForm(null)}
                        className="text-xs px-3 py-1.5 bg-gray-200 text-gray-600 rounded hover:bg-gray-300 transition-colors"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Panel 3: Decision Support & Audit Trail */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
            <h2 className="text-base font-semibold text-gray-900">判断支援</h2>

            <div className={`px-3 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium ${recConfig.className}`}>
              <span>{rec.recommendation === 'Approve' ? '✅' : rec.recommendation === 'Reject' ? '❌' : '⚠️'}</span>
              {recConfig.label}
            </div>

            <p className="text-sm text-gray-700">{rec.reason}</p>

            {rec.missing_items.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">未提出書類:</p>
                <ul className="space-y-1">
                  {rec.missing_items.map(item => (
                    <li key={item} className="text-xs text-gray-600 flex items-center gap-1.5">
                      <span className="text-amber-500">•</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>完成度スコア</span>
                <span className="font-semibold">{rec.completeness_score}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    rec.completeness_score === 100 ? 'bg-green-500' :
                    rec.completeness_score >= 80 ? 'bg-blue-500' :
                    rec.completeness_score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${rec.completeness_score}%` }}
                />
              </div>
            </div>

            {canMakeDecision && (
              <button
                onClick={() => {
                  setDecisionForm({ decision: rec.recommendation, decided_by: '', reason: '' })
                  setShowDecisionModal(true)
                }}
                className={`w-full text-sm font-medium py-2.5 text-white rounded-lg transition-colors ${recConfig.btnClass}`}
              >
                判断を確定する
              </button>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-3">
            <h2 className="text-base font-semibold text-gray-900">監査証跡</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {caseData.audit_events.length === 0 ? (
                <p className="text-sm text-gray-500">イベントなし</p>
              ) : caseData.audit_events.map(event => (
                <div key={event.id} className="flex gap-2.5 text-xs">
                  <span className="flex-shrink-0 mt-0.5">{AUDIT_EVENT_ICONS[event.event_type] || '📌'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800">{event.description}</div>
                    <div className="text-gray-500 mt-0.5">
                      {event.actor} · {new Date(event.created_at).toLocaleString('ja-JP', { dateStyle: 'short', timeStyle: 'short' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Decision Modal */}
      {showDecisionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-gray-900">判断を確定する</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">判断</label>
              <select
                value={decisionForm.decision}
                onChange={e => setDecisionForm(f => ({ ...f, decision: e.target.value as DecisionType }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">選択してください</option>
                <option value="Approve">承認</option>
                <option value="Reject">却下</option>
                <option value="Escalate">エスカレーション</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">判断者</label>
              <input
                type="text"
                value={decisionForm.decided_by}
                onChange={e => setDecisionForm(f => ({ ...f, decided_by: e.target.value }))}
                placeholder="判断者名"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">理由</label>
              <textarea
                value={decisionForm.reason}
                onChange={e => setDecisionForm(f => ({ ...f, reason: e.target.value }))}
                rows={3}
                placeholder="判断理由を入力してください"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleDecisionSubmit}
                disabled={submittingDecision || !decisionForm.decision}
                className="flex-1 bg-blue-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {submittingDecision ? '処理中...' : '確定'}
              </button>
              <button
                onClick={() => setShowDecisionModal(false)}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
