import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import SetupBanner from '../components/SetupBanner'
import {
  Package,
  KeyRound,
  Users,
  ShoppingCart,
  ShieldCheck,
  AlertTriangle,
  Clock,
  TrendingUp,
} from 'lucide-react'
import { formatRelative } from '../utils/helpers'

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    products: 0,
    accounts: 0,
    customers: 0,
    sales: 0,
    pendingProofs: 0,
    pendingClaims: 0,
    totalRevenue: 0,
    totalProfit: 0,
  })
  const [recentSales, setRecentSales] = useState([])
  const [recentClaims, setRecentClaims] = useState([])
  const [loading, setLoading] = useState(true)

  async function loadDashboard() {
    try {
      const [
        { count: products },
        { count: accounts },
        { count: customers },
        { data: salesData },
        { count: pendingProofs },
        { count: pendingClaims },
        { data: recentSalesData },
        { data: recentClaimsData },
      ] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('accounts').select('*', { count: 'exact', head: true }),
        supabase.from('customers').select('*', { count: 'exact', head: true }),
        supabase.from('sales').select('amount_paid'),
        supabase.from('sales').select('*', { count: 'exact', head: true }).eq('warranty_status', 'pending_proof'),
        supabase.from('warranty_claims').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('sales').select('*, customers(name), products(name)').order('created_at', { ascending: false }).limit(5),
        supabase.from('warranty_claims').select('*, customers(name), products(name)').order('created_at', { ascending: false }).limit(5),
      ])

      const totalRevenue = salesData?.reduce((sum, s) => sum + Number(s.amount_paid || 0), 0) || 0

      setStats({
        products: products || 0,
        accounts: accounts || 0,
        customers: customers || 0,
        sales: salesData?.length || 0,
        pendingProofs: pendingProofs || 0,
        pendingClaims: pendingClaims || 0,
        totalRevenue,
        totalProfit: 0,
      })
      setRecentSales(recentSalesData || [])
      setRecentClaims(recentClaimsData || [])
    } catch (err) {
      console.error('Dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SetupBanner />
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your store and warranty system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package} label="Products" value={stats.products} color="bg-blue-100 text-blue-600" />
        <StatCard icon={KeyRound} label="Accounts" value={stats.accounts} color="bg-green-100 text-green-600" />
        <StatCard icon={Users} label="Customers" value={stats.customers} color="bg-purple-100 text-purple-600" />
        <StatCard icon={ShoppingCart} label="Total Sales" value={stats.sales} color="bg-amber-100 text-amber-600" />
        <StatCard icon={Clock} label="Pending Proofs" value={stats.pendingProofs} color="bg-yellow-100 text-yellow-600" />
        <StatCard icon={AlertTriangle} label="Pending Claims" value={stats.pendingClaims} color="bg-red-100 text-red-600" />
        <StatCard icon={TrendingUp} label="Revenue" value={`₱${stats.totalRevenue.toLocaleString()}`} color="bg-emerald-100 text-emerald-600" />
        <StatCard icon={ShieldCheck} label="Active Warranties" value={stats.pendingProofs + stats.pendingClaims} color="bg-indigo-100 text-indigo-600" />
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Recent Sales</h2>
          {recentSales.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No sales yet</p>
          ) : (
            <div className="space-y-3">
              {recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{sale.products?.name || 'Unknown'}</p>
                    <p className="text-xs text-gray-500">{sale.customers?.name || 'Unknown'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">₱{Number(sale.amount_paid).toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{formatRelative(sale.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Claims */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Recent Claims</h2>
          {recentClaims.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No claims yet</p>
          ) : (
            <div className="space-y-3">
              {recentClaims.map((claim) => (
                <div key={claim.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{claim.claim_number}</p>
                    <p className="text-xs text-gray-500">{claim.customers?.name || 'Unknown'} — {claim.products?.name || 'Unknown'}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      claim.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {claim.status.replace(/_/g, ' ')}
                    </span>
                    <p className="text-xs text-gray-500 mt-0.5">{formatRelative(claim.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
