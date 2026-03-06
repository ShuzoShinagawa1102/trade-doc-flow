import Link from 'next/link'

export default function Navigation() {
  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">TF</span>
              </div>
              <span className="text-xl font-bold text-gray-900">TradeDocFlow</span>
            </Link>
            <div className="hidden md:flex space-x-6">
              <Link href="/" className="text-gray-600 hover:text-blue-600 font-medium text-sm transition-colors">
                ダッシュボード
              </Link>
              <Link href="/cases" className="text-gray-600 hover:text-blue-600 font-medium text-sm transition-colors">
                案件一覧
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-600 text-sm font-medium">管</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
