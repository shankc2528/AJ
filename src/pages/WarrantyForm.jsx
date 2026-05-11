import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Upload, CheckCircle, ShieldAlert } from 'lucide-react'
import { generateClaimNumber, uploadFile } from '../utils/helpers'
import { sendTelegramMessage, formatWarrantyClaimMessage } from '../lib/telegram'

export default function WarrantyForm() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [claimNumber, setClaimNumber] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    email: '',
    name: '',
    product: '',
    issue_description: '',
  })
  const [issueFile, setIssueFile] = useState(null)
  const [issuePreview, setIssuePreview] = useState(null)
  const [foundSale, setFoundSale] = useState(null)

  async function handleLookup(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: sales } = await supabase
      .from('sales')
      .select('*, customers(name, email, telegram_username), products(name), accounts(email)')
      .eq('warranty_status', 'warranted')

    const match = sales?.find(s =>
      s.accounts?.email?.toLowerCase() === form.email.toLowerCase() ||
      s.customers?.email?.toLowerCase() === form.email.toLowerCase()
    )

    if (!match) {
      setError('No warranted account found with this email. Make sure you submitted your login proof within 24 hours.')
      setLoading(false)
      return
    }

    setFoundSale(match)
    setForm(f => ({
      ...f,
      name: match.customers?.name || '',
      product: match.products?.name || '',
    }))
    setStep(2)
    setLoading(false)
  }

  function handleFileChange(e) {
    const f = e.target.files[0]
    if (!f) return
    if (!f.type.startsWith('image/')) { setError('Please select an image'); return }
    setIssueFile(f)
    setIssuePreview(URL.createObjectURL(f))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.issue_description.trim()) { setError('Please describe the issue'); return }
    setLoading(true)

    try {
      let issueUrl = null
      if (issueFile) {
        issueUrl = await uploadFile(supabase, issueFile)
      }

      const newClaimNumber = generateClaimNumber()
      const { error: insertError } = await supabase.from('warranty_claims').insert({
        claim_number: newClaimNumber,
        sale_id: foundSale.id,
        customer_id: foundSale.customer_id,
        account_id: foundSale.account_id,
        product_id: foundSale.product_id,
        issue_description: form.issue_description,
        issue_screenshot_url: issueUrl,
        customer_proof_url: foundSale.customer_proof_url,
        status: 'pending',
      })

      if (insertError) throw insertError

      const claim = { claim_number: newClaimNumber, issue_description: form.issue_description }
      sendTelegramMessage(formatWarrantyClaimMessage(claim, form.product, form.name))

      setClaimNumber(newClaimNumber)
      setSubmitted(true)
    } catch (err) {
      setError('Submission failed. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Claim Submitted!</h1>
          <p className="text-sm text-gray-500 mb-4">Your warranty claim has been submitted and is being reviewed.</p>
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-xs text-gray-500 mb-1">Claim Number</p>
            <p className="text-lg font-mono font-bold text-primary">{claimNumber}</p>
          </div>
          <p className="text-xs text-gray-400">Save this claim number to check your status later.</p>
          <a href="/claim-status" className="inline-block mt-4 text-sm text-primary hover:underline">Check claim status →</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <ShieldAlert size={24} className="text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Warranty Claim</h1>
          <p className="text-sm text-gray-500 mt-1">
            {step === 1 ? 'Enter your account email to start' : 'Describe the issue with your account'}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          <div className={`flex-1 h-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-gray-200'}`} />
          <div className={`flex-1 h-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-gray-200'}`} />
        </div>

        {step === 1 && (
          <form onSubmit={handleLookup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Email</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={e => { setForm({ ...form, email: e.target.value }); setError('') }}
                placeholder="The email of your purchased account"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
            >
              {loading ? 'Looking up...' : 'Find My Account'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Customer:</span>
                <span className="font-medium">{form.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Product:</span>
                <span className="font-medium">{form.product}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Account:</span>
                <span className="font-medium">{foundSale?.accounts?.email}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Describe the Issue</label>
              <textarea
                required
                value={form.issue_description}
                onChange={e => setForm({ ...form, issue_description: e.target.value })}
                placeholder="What happened? When did it start? What error do you see?"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Issue Screenshot (optional)</label>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => document.getElementById('issue-file').click()}
              >
                {issuePreview ? (
                  <img src={issuePreview} alt="Preview" className="max-h-32 mx-auto rounded" />
                ) : (
                  <>
                    <Upload size={24} className="text-gray-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">Click to upload screenshot</p>
                  </>
                )}
              </div>
              <input id="issue-file" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Back</button>
              <button type="submit" disabled={loading} className="flex-1 bg-primary hover:bg-primary-dark text-white py-3 rounded-lg font-medium text-sm transition-colors disabled:opacity-50">
                {loading ? 'Submitting...' : 'Submit Claim'}
              </button>
            </div>
          </form>
        )}

        <div className="text-center mt-4">
          <a href="/claim-status" className="text-xs text-gray-400 hover:text-primary">Already have a claim? Check status →</a>
        </div>
      </div>
    </div>
  )
}
