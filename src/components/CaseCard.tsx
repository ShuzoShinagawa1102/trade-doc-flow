import Link from 'next/link'
import type { Case } from '@/types'
import StatusBadge from './StatusBadge'
import EvidenceCompleteness from './EvidenceCompleteness'

export default function CaseCard({ caseData }: { caseData: Case }) {
  const dueDate = caseData.due_date ? new Date(caseData.due_date) : null
  const isOverdue = dueDate && dueDate < new Date()

  return (
    <Link href={`/cases/${caseData.id}`}>
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{caseData.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                {caseData.case_type === 'Export' ? '輸出' : '輸入'}
              </span>
              {caseData.assigned_to && (
                <span className="text-xs text-gray-500">担当: {caseData.assigned_to}</span>
              )}
            </div>
          </div>
          <StatusBadge status={caseData.status} />
        </div>

        <div className="mb-3">
          <div className="text-xs text-gray-500 mb-1">書類完成度</div>
          <EvidenceCompleteness score={caseData.completeness_score ?? 0} />
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <div>
            {caseData.exporter && <span>輸出: {caseData.exporter}</span>}
          </div>
          {dueDate && (
            <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
              期限: {dueDate.toLocaleDateString('ja-JP')}
              {isOverdue && ' (期限超過)'}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
