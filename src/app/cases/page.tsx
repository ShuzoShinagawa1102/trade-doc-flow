'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Case } from '@/types'
import CaseCard from '@/components/CaseCard'

const FILTER_TABS: { label: string; value: string }[] = [
  { label: 'すべて', value: 'all' },
  { label: '証憑待ち', value: 'WaitingForEvidence' },
  { label: '審査中', value: 'InReview' },
  { label: '例外処理', value: 'Exception' },
]

export default function CasesPage() {
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')

  useEffect(() => {
    fetch('/api/cases')
      .then(r => r.json())
      .then(data => { setCases(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = activeFilter === 'all'
    ? cases
    : cases.filter(c => c.status === activeFilter)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">案件一覧</h1>
        <Link
          href="/cases/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          + 新規案件起票
        </Link>
      </div>

      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveFilter(tab.value)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeFilter === tab.value
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs">
              ({tab.value === 'all' ? cases.length : cases.filter(c => c.status === tab.value).length})
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse h-36" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-500">該当する案件がありません</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <CaseCard key={c.id} caseData={c} />
          ))}
        </div>
      )}
    </div>
  )
}
