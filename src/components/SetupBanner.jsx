import { AlertTriangle } from 'lucide-react'
import { isConfigured } from '../lib/supabase'

export default function SetupBanner() {
  if (isConfigured) return null

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <AlertTriangle size={20} className="text-amber-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-800">Supabase Not Configured</p>
          <p className="text-xs text-amber-600 mt-1">
            Set <code className="bg-amber-100 px-1 rounded">VITE_SUPABASE_URL</code> and{' '}
            <code className="bg-amber-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> in your{' '}
            <code className="bg-amber-100 px-1 rounded">.env</code> file, then restart the dev server.
            Data operations will fail until configured.
          </p>
        </div>
      </div>
    </div>
  )
}
