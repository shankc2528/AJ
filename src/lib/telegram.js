const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || ''
const CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID || ''

export async function sendTelegramMessage(text, parseMode = 'HTML') {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn('Telegram not configured')
    return null
  }
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text,
      parse_mode: parseMode,
    }),
  })
  return res.json()
}

export async function sendTelegramPhoto(photoUrl, caption = '') {
  if (!BOT_TOKEN || !CHAT_ID) return null
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      photo: photoUrl,
      caption,
      parse_mode: 'HTML',
    }),
  })
  return res.json()
}

export function formatNewSaleMessage(sale, product, customer) {
  return `🛒 <b>New Sale!</b>
━━━━━━━━━━━━━━━
📦 Product: <b>${product}</b>
👤 Customer: <b>${customer}</b>
💰 Amount: <b>₱${sale.amount_paid}</b>
⏰ Proof deadline: 24 hours
━━━━━━━━━━━━━━━`
}

export function formatProofSubmittedMessage(product, customer) {
  return `✅ <b>Proof Submitted!</b>
━━━━━━━━━━━━━━━
📦 Product: <b>${product}</b>
👤 Customer: <b>${customer}</b>
🔒 Warranty: <b>ACTIVE</b>
━━━━━━━━━━━━━━━`
}

export function formatWarrantyClaimMessage(claim, product, customer) {
  return `⚠️ <b>New Warranty Claim!</b>
━━━━━━━━━━━━━━━
🎫 Claim #: <b>${claim.claim_number}</b>
📦 Product: <b>${product}</b>
👤 Customer: <b>${customer}</b>
📝 Issue: ${claim.issue_description}
━━━━━━━━━━━━━━━`
}

export function formatClaimStatusMessage(claimNumber, status, product) {
  const statusEmoji = {
    replacement_given: '🔄',
    refunded: '💰',
    rejected: '❌',
    closed: '📁',
  }
  return `${statusEmoji[status] || '📋'} <b>Claim Update</b>
━━━━━━━━━━━━━━━
🎫 Claim #: <b>${claimNumber}</b>
📦 Product: <b>${product}</b>
📊 Status: <b>${status.replace(/_/g, ' ').toUpperCase()}</b>
━━━━━━━━━━━━━━━`
}
