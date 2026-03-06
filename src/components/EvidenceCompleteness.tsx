export default function EvidenceCompleteness({ score }: { score: number }) {
  const color =
    score === 100 ? 'bg-green-500' :
    score >= 80 ? 'bg-blue-500' :
    score >= 50 ? 'bg-amber-500' :
    'bg-red-500'

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-600 w-8 text-right">{score}%</span>
    </div>
  )
}
