import type { CaseStatus } from '@/types'

const statusConfig: Record<CaseStatus, { label: string; className: string }> = {
  Draft: { label: '下書き', className: 'bg-gray-100 text-gray-700 border border-gray-300' },
  IntakeValidated: { label: '受付確認済', className: 'bg-blue-100 text-blue-700 border border-blue-300' },
  WaitingForEvidence: { label: '証憑待ち', className: 'bg-amber-100 text-amber-700 border border-amber-300' },
  InReview: { label: '審査中', className: 'bg-indigo-100 text-indigo-700 border border-indigo-300' },
  Approved: { label: '承認済', className: 'bg-green-100 text-green-700 border border-green-300' },
  Rejected: { label: '却下', className: 'bg-red-100 text-red-700 border border-red-300' },
  Exception: { label: '例外処理', className: 'bg-orange-100 text-orange-700 border border-orange-300' },
  Closed: { label: 'クローズ', className: 'bg-gray-100 text-gray-500 border border-gray-200' },
}

export default function StatusBadge({ status }: { status: CaseStatus }) {
  const config = statusConfig[status] ?? { label: status, className: 'bg-gray-100 text-gray-700' }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}
