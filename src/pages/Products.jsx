import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Edit2, Trash2, Search } from 'lucide-react'

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({
    name: '', category: 'subscription', price: '', cost: '', description: '', is_active: true,
  })

  useEffect(() => { loadProducts() }, [])

  async function loadProducts() {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    setProducts(data || [])
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const payload = { ...form, price: Number(form.price), cost: Number(form.cost) }
    if (editing) {
      await supabase.from('products').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('products').insert(payload)
    }
    setShowModal(false)
    setEditing(null)
    setForm({ name: '', category: 'subscription', price: '', cost: '', description: '', is_active: true })
    loadProducts()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this product?')) return
    await supabase.from('products').delete().eq('id', id)
    loadProducts()
  }

  function openEdit(product) {
    setEditing(product)
    setForm({
      name: product.name,
      category: product.category,
      price: product.price,
      cost: product.cost,
      description: product.description || '',
      is_active: product.is_active,
    })
    setShowModal(true)
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your subscription products</p>
        </div>
        <button
          onClick={() => { setEditing(null); setForm({ name: '', category: 'subscription', price: '', cost: '', description: '', is_active: true }); setShowModal(true) }}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search products..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Cost</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Profit</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(product => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{product.name}</td>
                <td className="px-4 py-3 text-sm text-gray-600 capitalize">{product.category}</td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right">₱{Number(product.price).toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-gray-600 text-right">₱{Number(product.cost).toLocaleString()}</td>
                <td className="px-4 py-3 text-sm font-medium text-green-600 text-right">₱{(Number(product.price) - Number(product.cost)).toLocaleString()}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    {product.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(product)} className="p-1.5 text-gray-400 hover:text-primary rounded"><Edit2 size={15} /></button>
                    <button onClick={() => handleDelete(product.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-500">No products found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{editing ? 'Edit Product' : 'Add Product'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="e.g. ChatGPT Plus" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                  <option value="subscription">Subscription</option>
                  <option value="account">Account</option>
                  <option value="license">License</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (₱)</label>
                  <input required type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost (₱)</label>
                  <input required type="number" step="0.01" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" rows={2} />
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="rounded" />
                <span className="text-sm text-gray-700">Active</span>
              </label>
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
