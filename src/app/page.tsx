'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Case, CaseStatus } from '@/types'
import StatusBadge from '@/components/StatusBadge'

export default function Dashboard() {
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      try {
        await fetch('/api/seed', { method: 'POST' })
        const res = await fetch('/api/cases')
        if (res.ok) {
          const data = await res.json()
          setCases(data)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const total = cases.length
  const inReview = cases.filter(c => c.status === 'InReview').length
  const exceptions = cases.filter(c => c.status === 'Exception').length
  const today = new Date().toDateString()
  const approvedToday = cases.filter(c => c.status === 'Approved' && new Date(c.updated_at).toDateString() === today).length

  const recentCases = [...cases].slice(0, 5)

  const stats = [
    { label: '総案件数', value: total, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { label: '審査中', value: inReview, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
    { label: '例外処理', value: exceptions, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
    { label: '本日承認', value: approvedToday, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
          <p className="text-gray-500 mt-1">貿易書類案件管理システム</p>
        </div>
        <Link
          href="/cases/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          + 新規案件起票
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-20 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-12" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(stat => (
            <div key={stat.label} className={`bg-white border ${stat.border} rounded-lg p-6`}>
              <p className="text-sm font-medium text-gray-600">{stat.label}</p>
              <p className={`text-3xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">最近の案件</h2>
          <Link href="/cases" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            すべて表示 →
          </Link>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : recentCases.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p>案件がありません</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">案件名</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">種別</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">担当者</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">完成度</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">更新日</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentCases.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/cases/${c.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
                      {c.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {c.case_type === 'Export' ? '輸出' : '輸入'}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={c.status as CaseStatus} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{c.assigned_to || '-'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 w-32">
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${c.completeness_score ?? 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{c.completeness_score ?? 0}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(c.updated_at).toLocaleDateString('ja-JP')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
