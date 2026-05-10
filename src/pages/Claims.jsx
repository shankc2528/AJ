import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Search, ExternalLink, MessageSquare } from 'lucide-react'
import { formatDate, getClaimStatusColor } from '../utils/helpers'
import { sendTelegramMessage, formatClaimStatusMessage } from '../lib/telegram'

export default function Claims() {
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [updatingId, setUpdatingId] = useState(null)

  async function loadClaims() {
    const { data } = await supabase
      .from('warranty_claims')
      .select('*, customers(name, telegram_username), products(name), accounts(email), sales(amount_paid)')
      .order('created_at', { ascending: false })
    setClaims(data || [])
    setLoading(false)
  }

  useEffect(() => { loadClaims() }, [])

  async function updateClaimStatus(claim, newStatus) {
    setUpdatingId(claim.id)
    const updates = {
      status: newStatus,
      ...((['replacement_given', 'refunded', 'rejected', 'closed'].includes(newStatus)) && { resolved_at: new Date().toISOString() }),
    }
    await supabase.from('warranty_claims').update(updates).eq('id', claim.id)

    if (newStatus === 'replacement_given' || newStatus === 'refunded') {
      const accountStatus = newStatus === 'replacement_given' ? 'replaced' : 'refunded'
      await supabase.from('accounts').update({ status: accountStatus }).eq('id', claim.account_id)
    }

    const productName = claim.products?.name || 'Unknown'
    sendTelegramMessage(formatClaimStatusMessage(claim.claim_number, newStatus, productName))

    setUpdatingId(null)
    loadClaims()
  }

  const filtered = claims.filter(c => {
    const matchSearch = c.claim_number.toLowerCase().includes(search.toLowerCase()) ||
      (c.customers?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.products?.name || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || c.status === statusFilter
    return matchSearch && matchStatus
  })

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Warranty Claims</h1>
        <p className="text-sm text-gray-500 mt-1">Manage customer warranty claims and supplier submissions</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search claims..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="submitted_to_supplier">Submitted to Supplier</option>
          <option value="replacement_given">Replacement Given</option>
          <option value="refunded">Refunded</option>
          <option value="rejected">Rejected</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div className="space-y-4">
        {filtered.map(claim => (
          <div key={claim.id} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{claim.claim_number}</h3>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getClaimStatusColor(claim.status)}`}>
                    {claim.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  {claim.customers?.name || 'Unknown'} — {claim.products?.name || 'Unknown'}
                </p>
              </div>
              <span className="text-xs text-gray-400">{formatDate(claim.created_at)}</span>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 mb-3">
              <p className="text-sm text-gray-700"><strong>Issue:</strong> {claim.issue_description}</p>
              {claim.accounts?.email && (
                <p className="text-sm text-gray-600 mt-1"><strong>Account:</strong> {claim.accounts.email}</p>
              )}
            </div>

            <div className="flex items-center gap-2 mb-3">
              {claim.issue_screenshot_url && (
                <a href={claim.issue_screenshot_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  <ExternalLink size={12} /> Issue Screenshot
                </a>
              )}
              {claim.customer_proof_url && (
                <a href={claim.customer_proof_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  <ExternalLink size={12} /> Login Proof
                </a>
              )}
            </div>

            {claim.supplier_response && (
              <div className="bg-blue-50 rounded-lg p-3 mb-3">
                <p className="text-sm text-blue-800"><MessageSquare size={14} className="inline mr-1" /><strong>Supplier:</strong> {claim.supplier_response}</p>
              </div>
            )}

            {claim.resolved_at && (
              <p className="text-xs text-gray-400 mb-3">Resolved: {formatDate(claim.resolved_at)}</p>
            )}

            {/* Status actions */}
            {claim.status !== 'closed' && (
              <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                {claim.status === 'pending' && (
                  <button
                    onClick={() => updateClaimStatus(claim, 'submitted_to_supplier')}
                    disabled={updatingId === claim.id}
                    className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    Submit to Supplier
                  </button>
                )}
                {(claim.status === 'pending' || claim.status === 'submitted_to_supplier') && (
                  <>
                    <button
                      onClick={() => updateClaimStatus(claim, 'replacement_given')}
                      disabled={updatingId === claim.id}
                      className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      Replacement Given
                    </button>
                    <button
                      onClick={() => updateClaimStatus(claim, 'refunded')}
                      disabled={updatingId === claim.id}
                      className="px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      Refunded
                    </button>
                    <button
                      onClick={() => updateClaimStatus(claim, 'rejected')}
                      disabled={updatingId === claim.id}
                      className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      Rejected
                    </button>
                  </>
                )}
                <button
                  onClick={() => updateClaimStatus(claim, 'closed')}
                  disabled={updatingId === claim.id}
                  className="px-3 py-1.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-sm text-gray-500">
            No warranty claims found
          </div>
        )}
      </div>
    </div>
  )
}
