import { format, formatDistanceToNow, isPast, addHours } from 'date-fns'

export function generateClaimNumber() {
  const prefix = 'AJ'
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

export function formatDate(date) {
  if (!date) return '—'
  return format(new Date(date), 'MMM dd, yyyy HH:mm')
}

export function formatRelative(date) {
  if (!date) return '—'
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function isProofDeadlinePassed(soldAt) {
  if (!soldAt) return false
  return isPast(addHours(new Date(soldAt), 24))
}

export function getProofDeadline(soldAt) {
  if (!soldAt) return null
  return addHours(new Date(soldAt), 24)
}

export function getWarrantyStatusColor(status) {
  const colors = {
    pending_proof: 'bg-yellow-100 text-yellow-800',
    warranted: 'bg-green-100 text-green-800',
    no_warranty: 'bg-red-100 text-red-800',
    expired: 'bg-gray-100 text-gray-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export function getClaimStatusColor(status) {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    submitted_to_supplier: 'bg-blue-100 text-blue-800',
    replacement_given: 'bg-green-100 text-green-800',
    refunded: 'bg-purple-100 text-purple-800',
    rejected: 'bg-red-100 text-red-800',
    closed: 'bg-gray-100 text-gray-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export function getAccountStatusColor(status) {
  const colors = {
    available: 'bg-green-100 text-green-800',
    sold: 'bg-blue-100 text-blue-800',
    warranty_active: 'bg-emerald-100 text-emerald-800',
    warranty_expired: 'bg-orange-100 text-orange-800',
    replaced: 'bg-purple-100 text-purple-800',
    refunded: 'bg-pink-100 text-pink-800',
    closed: 'bg-gray-100 text-gray-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export async function uploadFile(supabase, file, bucket = 'proofs') {
  const ext = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file)
  if (error) throw error
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path)
  return urlData.publicUrl
}
