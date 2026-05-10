import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Search, ExternalLink, Copy, Check } from 'lucide-react'
import { formatDate, getWarrantyStatusColor, isProofDeadlinePassed } from '../utils/helpers'
import { sendTelegramMessage, formatNewSaleMessage } from '../lib/telegram'
import { addHours } from 'date-fns'

export default function Sales() {
  const [sales, setSales] = useState([])
  const [accounts, setAccounts] = useState([])
  const [customers, setCustomers] = useState([])
  const [, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [copied, setCopied] = useState(null)
  const [form, setForm] = useState({
    account_id: '', customer_id: '', product_id: '', amount_paid: '',
  })

  async function loadData() {
    const [{ data: s }, { data: a }, { data: c }, { data: p }] = await Promise.all([
      supabase.from('sales').select('*, accounts(email, password), customers(name, telegram_username), products(name)').order('created_at', { ascending: false }),
      supabase.from('accounts').select('id, email, product_id, products(name)').eq('status', 'available'),
      supabase.from('customers').select('id, name').order('name'),
      supabase.from('products').select('id, name, price').eq('is_active', true).order('name'),
    ])
    setSales(s || [])
    setAccounts(a || [])
    setCustomers(c || [])
    setProducts(p || [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    const selectedAccount = accounts.find(a => a.id === form.account_id)
    const soldAt = new Date().toISOString()
    const { data: sale, error } = await supabase.from('sales').insert({
      account_id: form.account_id,
      customer_id: form.customer_id,
      product_id: selectedAccount?.product_id || form.product_id,
      amount_paid: Number(form.amount_paid),
      sold_at: soldAt,
      proof_deadline: addHours(new Date(), 24).toISOString(),
      warranty_status: 'pending_proof',
    }).select('*, customers(name), products(name)').single()

    if (!error && sale) {
      await supabase.from('accounts').update({ status: 'sold' }).eq('id', form.account_id)
      const productName = sale.products?.name || 'Unknown'
      const customerName = sale.customers?.name || 'Unknown'
      sendTelegramMessage(formatNewSaleMessage(sale, productName, customerName))
    }

    setShowModal(false)
    setForm({ account_id: '', customer_id: '', product_id: '', amount_paid: '' })
    loadData()
  }

  function copyProofLink(saleId) {
    const link = `${window.location.origin}/proof/${saleId}`
    navigator.clipboard.writeText(link)
    setCopied(saleId)
    setTimeout(() => setCopied(null), 2000)
  }

  async function checkExpiredProofs() {
    const pendingSales = sales.filter(s => s.warranty_status === 'pending_proof')
    for (const sale of pendingSales) {
      if (isProofDeadlinePassed(sale.sold_at)) {
        await supabase.from('sales').update({ warranty_status: 'no_warranty' }).eq('id', sale.id)
      }
    }
    loadData()
  }

  useEffect(() => {
    if (sales.length > 0) checkExpiredProofs()
  }, [sales.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = sales.filter(s => {
    const matchSearch = (s.customers?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.products?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.accounts?.email || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || s.warranty_status === statusFilter
    return matchSearch && matchStatus
  })

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
          <p className="text-sm text-gray-500 mt-1">Track sales and warranty proof submissions</p>
        </div>
        <button
          onClick={() => { setForm({ account_id: '', customer_id: '', product_id: '', amount_paid: '' }); setShowModal(true) }}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> New Sale
        </button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sales..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
          <option value="all">All Warranty</option>
          <option value="pending_proof">Pending Proof</option>
          <option value="warranted">Warranted</option>
          <option value="no_warranty">No Warranty</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Account</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Paid</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Warranty</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Proof Deadline</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Proof Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(sale => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{sale.customers?.name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{sale.products?.name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 font-mono text-xs">{sale.accounts?.email || '—'}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">₱{Number(sale.amount_paid).toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getWarrantyStatusColor(sale.warranty_status)}`}>
                      {sale.warranty_status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {sale.proof_deadline ? formatDate(sale.proof_deadline) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {sale.customer_proof_url && (
                        <a href={sale.customer_proof_url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-green-500 hover:text-green-700">
                          <ExternalLink size={15} />
                        </a>
                      )}
                      {sale.warranty_status === 'pending_proof' && (
                        <button onClick={() => copyProofLink(sale.id)} className="p-1.5 text-gray-400 hover:text-primary" title="Copy proof submission link">
                          {copied === sale.id ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-500">No sales found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Sale Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">New Sale</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                <select required value={form.customer_id} onChange={e => setForm({ ...form, customer_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                  <option value="">Select customer</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account (Available)</label>
                <select required value={form.account_id} onChange={e => {
                  const acc = accounts.find(a => a.id === e.target.value)
                  setForm({ ...form, account_id: e.target.value, product_id: acc?.product_id || '' })
                }} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                  <option value="">Select account</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.products?.name} — {a.email}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid (₱)</label>
                <input required type="number" step="0.01" value={form.amount_paid} onChange={e => setForm({ ...form, amount_paid: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-colors">Create Sale</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
