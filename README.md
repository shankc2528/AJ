# AJ Store — Warranty & Subscription Manager

A web application for managing discounted subscription sales, customer warranties, and supplier claims. Built with React, Supabase, and Telegram Bot integration.

## Features

### Admin Dashboard
- **Products** — manage subscription products (ChatGPT, Grok, CapCut, etc.) with pricing and profit tracking
- **Accounts** — store purchased accounts with email/password, track status (available, sold, warranted, etc.)
- **Customers** — customer database with Telegram, email, and phone info
- **Sales** — record sales, auto-generate proof submission links, 24-hour warranty deadlines
- **Claims** — manage warranty claims through the full lifecycle (pending → supplier → resolved)

### Customer-Facing Pages
- **Proof Submission** (`/proof/:saleId`) — customers upload login screenshots within 24 hours to activate warranty
- **Warranty Claim** (`/warranty-claim`) — customers file warranty claims with issue descriptions and screenshots
- **Claim Status** (`/claim-status`) — customers track claim progress by claim number

### Telegram Bot Notifications
- New sale alerts
- Proof submission confirmations
- New warranty claim alerts
- Claim status updates (replacement, refund, rejection)

## Tech Stack

- **Frontend**: React 19 + Vite + Tailwind CSS 4
- **Database**: Supabase (PostgreSQL)
- **Notifications**: Telegram Bot API
- **Icons**: Lucide React
- **Dates**: date-fns

## Setup

### 1. Supabase Database
1. Create a project at [supabase.com](https://supabase.com)
2. Run the SQL in `supabase/schema.sql` in the SQL Editor
3. Copy your project URL and anon key from Settings → API

### 2. Telegram Bot
1. Message [@BotFather](https://t.me/BotFather) with `/newbot`
2. Save the bot token
3. Add the bot to your notification group
4. Get the chat ID via `https://api.telegram.org/bot<TOKEN>/getUpdates`

### 3. Environment Variables
```bash
cp .env.example .env
# Fill in your credentials:
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key
# VITE_TELEGRAM_BOT_TOKEN=your-bot-token
# VITE_TELEGRAM_CHAT_ID=your-chat-id
```

### 4. Run
```bash
npm install
npm run dev
```

## Warranty Workflow

1. **Add Product** → Add accounts purchased from supplier
2. **Sell to Customer** → Creates sale, marks account as sold, sends Telegram notification
3. **Customer submits proof** → Upload login screenshot via unique link within 24 hours
4. **Warranty activated** → Account marked as warranted
5. **Issue occurs** → Customer files warranty claim form
6. **Admin processes** → Submit to supplier, update with result (replacement/refund/rejected)
7. **Customer tracks** → Check claim status by claim number

## Admin Login

Default password: `ajstore2024`
