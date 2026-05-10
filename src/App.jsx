import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Accounts from './pages/Accounts'
import Customers from './pages/Customers'
import Sales from './pages/Sales'
import Claims from './pages/Claims'
import CustomerProof from './pages/CustomerProof'
import WarrantyForm from './pages/WarrantyForm'
import ClaimStatus from './pages/ClaimStatus'
import Login from './pages/Login'

const ADMIN_PASSWORD = 'ajstore2024'

function ProtectedRoute({ children, isAuth }) {
  if (!isAuth) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const [isAuth, setIsAuth] = useState(() => localStorage.getItem('aj_auth') === 'true')

  function handleLogin(password) {
    if (password === ADMIN_PASSWORD) {
      setIsAuth(true)
      localStorage.setItem('aj_auth', 'true')
      return true
    }
    return false
  }

  function handleLogout() {
    setIsAuth(false)
    localStorage.removeItem('aj_auth')
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/proof/:saleId" element={<CustomerProof />} />
        <Route path="/warranty-claim" element={<WarrantyForm />} />
        <Route path="/claim-status" element={<ClaimStatus />} />
        <Route path="/login" element={<Login onLogin={handleLogin} isAuth={isAuth} />} />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute isAuth={isAuth}>
              <Layout onLogout={handleLogout} />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="accounts" element={<Accounts />} />
          <Route path="customers" element={<Customers />} />
          <Route path="sales" element={<Sales />} />
          <Route path="claims" element={<Claims />} />
        </Route>

        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
