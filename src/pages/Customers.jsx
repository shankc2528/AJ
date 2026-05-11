import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Edit2, Trash2, Search } from 'lucide-react'
import { formatDate } from '../utils/helpers'

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({
    name: '', telegram_username: '', email: '', phone: '', notes: '',
  })

  useEffect(() => { loadCustomers() }, [])

  async function loadCustomers() {
    const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false })
    setCustomers(data || [])
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (editing) {
      await supabase.from('customers').update(form).eq('id', editing.id)
    } else {
      await supabase.from('customers').insert(form)
    }
    setShowModal(false)
    setEditing(null)
    setForm({ name: '', telegram_username: '', email: '', phone: '', notes: '' })
    loadCustomers()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this customer?')) return
    await supabase.from('customers').delete().eq('id', id)
    loadCustomers()
  }

  function openEdit(c) {
    setEditing(c)
    setForm({
      name: c.name,
      telegram_username: c.telegram_username || '',
      email: c.email || '',
      phone: c.phone || '',
      notes: c.notes || '',
    })
    setShowModal(true)
  }

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.telegram_username || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your customer records</p>
        </div>
        <button
          onClick={() => { setEditing(null); setForm({ name: '', telegram_username: '', email: '', phone: '', notes: '' }); setShowModal(true) }}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Add Customer
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Telegram</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Joined</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(c => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{c.name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{c.telegram_username ? `@${c.telegram_username}` : '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{c.email || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{c.phone || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{formatDate(c.created_at)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-primary rounded"><Edit2 size={15} /></button>
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-500">No customers found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{editing ? 'Edit Customer' : 'Add Customer'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telegram Username</label>
                <input value={form.telegram_username} onChange={e => setForm({ ...form, telegram_username: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="username (without @)" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
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
