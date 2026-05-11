import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Upload, CheckCircle, XCircle, Clock, Camera } from 'lucide-react'
import { formatDate, isProofDeadlinePassed, getProofDeadline, uploadFile } from '../utils/helpers'
import { sendTelegramMessage, formatProofSubmittedMessage } from '../lib/telegram'

export default function CustomerProof() {
  const { saleId } = useParams()
  const [sale, setSale] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)

  async function loadSale() {
    const { data, error: err } = await supabase
      .from('sales')
      .select('*, customers(name), products(name), accounts(email)')
      .eq('id', saleId)
      .single()
    if (err || !data) {
      setError('Sale not found. Please check the link.')
    } else {
      setSale(data)
      if (data.customer_proof_url) setSubmitted(true)
    }
    setLoading(false)
  }

  useEffect(() => { loadSale() }, [saleId]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleFileChange(e) {
    const f = e.target.files[0]
    if (!f) return
    if (!f.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) { setError('Please select a screenshot'); return }
    if (!sale) return

    if (isProofDeadlinePassed(sale.sold_at)) {
      setError('The 24-hour proof deadline has passed. This account no longer qualifies for warranty.')
      return
    }

    setUploading(true)
    try {
      const proofUrl = await uploadFile(supabase, file)
      await supabase.from('sales').update({
        customer_proof_url: proofUrl,
        proof_submitted_at: new Date().toISOString(),
        warranty_status: 'warranted',
      }).eq('id', saleId)

      await supabase.from('accounts').update({ status: 'warranty_active' }).eq('id', sale.account_id)

      const productName = sale.products?.name || 'Unknown'
      const customerName = sale.customers?.name || 'Unknown'
      sendTelegramMessage(formatProofSubmittedMessage(productName, customerName))

      setSubmitted(true)
    } catch (err) {
      setError('Upload failed. Please try again.')
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (error && !sale) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <XCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid Link</h1>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Proof Submitted!</h1>
          <p className="text-sm text-gray-500 mb-4">
            Your login proof has been submitted successfully. Your account is now covered by warranty.
          </p>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-800 font-medium">Warranty Status: Active</p>
            <p className="text-xs text-green-600 mt-1">Product: {sale?.products?.name}</p>
          </div>
        </div>
      </div>
    )
  }

  const deadline = getProofDeadline(sale?.sold_at)
  const expired = isProofDeadlinePassed(sale?.sold_at)

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <Camera size={24} className="text-primary" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Submit Login Proof</h1>
          <p className="text-sm text-gray-500 mt-1">Upload a screenshot showing you've successfully logged in</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Product:</span>
            <span className="font-medium text-gray-900">{sale?.products?.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Customer:</span>
            <span className="font-medium text-gray-900">{sale?.customers?.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Deadline:</span>
            <span className={`font-medium ${expired ? 'text-red-600' : 'text-gray-900'}`}>
              {deadline ? formatDate(deadline) : '—'}
            </span>
          </div>
        </div>

        {expired ? (
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <XCircle size={24} className="text-red-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-red-800">Deadline Expired</p>
            <p className="text-xs text-red-600 mt-1">The 24-hour proof window has passed. This account is no longer eligible for warranty.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Screenshot of Successful Login</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer" onClick={() => document.getElementById('proof-file').click()}>
                {preview ? (
                  <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded" />
                ) : (
                  <>
                    <Upload size={32} className="text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Click to upload screenshot</p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</p>
                  </>
                )}
              </div>
              <input id="proof-file" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-lg p-3">
              <Clock size={14} />
              <span>You have 24 hours from purchase to submit proof</span>
            </div>

            <button
              type="submit"
              disabled={uploading || !file}
              className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : 'Submit Proof'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
