import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Search, Clock, CheckCircle, XCircle, ArrowRight, ShieldCheck } from 'lucide-react'
import { formatDate, getClaimStatusColor } from '../utils/helpers'

const STATUS_STEPS = [
  { key: 'pending', label: 'Submitted', icon: Clock },
  { key: 'submitted_to_supplier', label: 'With Supplier', icon: ArrowRight },
  { key: 'resolved', label: 'Resolved', icon: CheckCircle },
]

export default function ClaimStatus() {
  const [claimNumber, setClaimNumber] = useState('')
  const [claim, setClaim] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  async function handleSearch(e) {
    e.preventDefault()
    if (!claimNumber.trim()) return
    setLoading(true)
    setError('')
    setClaim(null)

    const { data, error: err } = await supabase
      .from('warranty_claims')
      .select('*, customers(name), products(name)')
      .eq('claim_number', claimNumber.trim().toUpperCase())
      .single()

    if (err || !data) {
      setError('Claim not found. Please check the claim number.')
    } else {
      setClaim(data)
    }
    setSearched(true)
    setLoading(false)
  }

  function getStepStatus(stepKey) {
    if (!claim) return 'pending'
    const order = ['pending', 'submitted_to_supplier', 'replacement_given', 'refunded', 'rejected', 'closed']
    const currentIdx = order.indexOf(claim.status)
    if (stepKey === 'resolved') {
      return currentIdx >= 2 ? 'complete' : 'pending'
    }
    if (stepKey === 'submitted_to_supplier') {
      return currentIdx >= 1 ? 'complete' : 'pending'
    }
    return 'complete'
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <ShieldCheck size={24} className="text-primary" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Check Claim Status</h1>
          <p className="text-sm text-gray-500 mt-1">Enter your claim number to track progress</p>
        </div>

        <form onSubmit={handleSearch} className="bg-white rounded-xl shadow-lg p-6 mb-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={claimNumber}
                onChange={e => { setClaimNumber(e.target.value); setError('') }}
                placeholder="e.g. AJ-XXXXX-XXX"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? '...' : 'Track'}
            </button>
          </div>
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
        </form>

        {claim && (
          <div className="bg-white rounded-xl shadow-lg p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Claim Number</p>
                <p className="font-mono font-bold text-primary">{claim.claim_number}</p>
              </div>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getClaimStatusColor(claim.status)}`}>
                {claim.status.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Product:</span>
                <span className="font-medium">{claim.products?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Submitted:</span>
                <span className="font-medium">{formatDate(claim.created_at)}</span>
              </div>
              {claim.resolved_at && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Resolved:</span>
                  <span className="font-medium">{formatDate(claim.resolved_at)}</span>
                </div>
              )}
            </div>

            {/* Progress tracker */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Progress</p>
              <div className="space-y-4">
                {STATUS_STEPS.map((step, idx) => {
                  const status = getStepStatus(step.key)
                  const Icon = status === 'complete' ? CheckCircle : step.icon
                  return (
                    <div key={step.key} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        status === 'complete' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                        <Icon size={16} />
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${status === 'complete' ? 'text-gray-900' : 'text-gray-400'}`}>
                          {step.label}
                        </p>
                      </div>
                      {idx < STATUS_STEPS.length - 1 && (
                        <div className={`w-0.5 h-4 ${status === 'complete' ? 'bg-green-300' : 'bg-gray-200'}`} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {claim.supplier_response && (
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-xs font-medium text-blue-800 mb-1">Supplier Response</p>
                <p className="text-sm text-blue-700">{claim.supplier_response}</p>
              </div>
            )}

            {['replacement_given', 'refunded'].includes(claim.status) && (
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <CheckCircle size={24} className="text-green-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-green-800">
                  {claim.status === 'replacement_given' ? 'A replacement account has been provided!' : 'A refund has been processed!'}
                </p>
              </div>
            )}

            {claim.status === 'rejected' && (
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <XCircle size={24} className="text-red-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-red-800">This claim was rejected by the supplier.</p>
              </div>
            )}
          </div>
        )}

        {searched && !claim && !error && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <p className="text-sm text-gray-500">No claim found</p>
          </div>
        )}

        <div className="text-center mt-4">
          <a href="/warranty-claim" className="text-xs text-gray-400 hover:text-primary">Need to submit a claim? →</a>
        </div>
      </div>
    </div>
  )
}
