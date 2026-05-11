import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Edit2, Trash2, Search, Eye, EyeOff, Copy, Check } from 'lucide-react'
import { getAccountStatusColor, formatDate } from '../utils/helpers'

export default function Accounts() {
  const [accounts, setAccounts] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showPasswords, setShowPasswords] = useState({})
  const [copied, setCopied] = useState(null)
  const [form, setForm] = useState({
    product_id: '', email: '', password: '', supplier_proof_url: '', status: 'available', notes: '',
  })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const [{ data: accs }, { data: prods }] = await Promise.all([
      supabase.from('accounts').select('*, products(name)').order('created_at', { ascending: false }),
      supabase.from('products').select('id, name').eq('is_active', true).order('name'),
    ])
    setAccounts(accs || [])
    setProducts(prods || [])
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (editing) {
      await supabase.from('accounts').update(form).eq('id', editing.id)
    } else {
      await supabase.from('accounts').insert(form)
    }
    setShowModal(false)
    setEditing(null)
    setForm({ product_id: '', email: '', password: '', supplier_proof_url: '', status: 'available', notes: '' })
    loadData()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this account?')) return
    await supabase.from('accounts').delete().eq('id', id)
    loadData()
  }

  function openEdit(acc) {
    setEditing(acc)
    setForm({
      product_id: acc.product_id,
      email: acc.email,
      password: acc.password,
      supplier_proof_url: acc.supplier_proof_url || '',
      status: acc.status,
      notes: acc.notes || '',
    })
    setShowModal(true)
  }

  function copyToClipboard(text, id) {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const filtered = accounts.filter(a => {
    const matchSearch = a.email.toLowerCase().includes(search.toLowerCase()) ||
      a.products?.name?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || a.status === statusFilter
    return matchSearch && matchStatus
  })

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
          <p className="text-sm text-gray-500 mt-1">Manage purchased accounts from suppliers</p>
        </div>
        <button
          onClick={() => { setEditing(null); setForm({ product_id: products[0]?.id || '', email: '', password: '', supplier_proof_url: '', status: 'available', notes: '' }); setShowModal(true) }}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Add Account
        </button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by email or product..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
          <option value="all">All Status</option>
          <option value="available">Available</option>
          <option value="sold">Sold</option>
          <option value="warranty_active">Warranty Active</option>
          <option value="warranty_expired">Warranty Expired</option>
          <option value="replaced">Replaced</option>
          <option value="refunded">Refunded</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Password</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Added</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(acc => (
                <tr key={acc.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{acc.products?.name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      {acc.email}
                      <button onClick={() => copyToClipboard(acc.email, `email-${acc.id}`)} className="p-1 text-gray-400 hover:text-primary">
                        {copied === `email-${acc.id}` ? <Check size={13} /> : <Copy size={13} />}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-xs">{showPasswords[acc.id] ? acc.password : '••••••••'}</span>
                      <button onClick={() => setShowPasswords(p => ({ ...p, [acc.id]: !p[acc.id] }))} className="p-1 text-gray-400 hover:text-primary">
                        {showPasswords[acc.id] ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                      <button onClick={() => copyToClipboard(acc.password, `pass-${acc.id}`)} className="p-1 text-gray-400 hover:text-primary">
                        {copied === `pass-${acc.id}` ? <Check size={13} /> : <Copy size={13} />}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getAccountStatusColor(acc.status)}`}>
                      {acc.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(acc.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(acc)} className="p-1.5 text-gray-400 hover:text-primary rounded"><Edit2 size={15} /></button>
                      <button onClick={() => handleDelete(acc.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-500">No accounts found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{editing ? 'Edit Account' : 'Add Account'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                <select required value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                  <option value="">Select product</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="account@email.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Proof URL</label>
                <input value={form.supplier_proof_url} onChange={e => setForm({ ...form, supplier_proof_url: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                  <option value="available">Available</option>
                  <option value="sold">Sold</option>
                  <option value="warranty_active">Warranty Active</option>
                  <option value="warranty_expired">Warranty Expired</option>
                  <option value="replaced">Replaced</option>
                  <option value="refunded">Refunded</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" rows={2} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-colors">{editing ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
