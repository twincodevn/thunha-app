# 🚀 ThuNhà - Production Deployment Guide

## Prerequisites

Before deploying, ensure you have:
- [ ] Vercel account (https://vercel.com)
- [ ] PostgreSQL database (Supabase, Neon, or PlanetScale recommended)
- [ ] Resend account for emails (https://resend.com)
- [ ] Google Cloud Console project for OAuth
- [ ] Domain name (optional but recommended)

---

## 1. Database Setup

### Option A: Supabase (Recommended - Free tier available)

1. Create project at https://supabase.com
2. Go to **Settings > Database**
3. Copy the **Connection string (URI)**
4. Replace `[YOUR-PASSWORD]` with your DB password

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

### Option B: Neon (Serverless PostgreSQL)

1. Create project at https://neon.tech
2. Copy connection string from dashboard

---

## 2. Environment Variables

Create these in Vercel Dashboard > Settings > Environment Variables:

| Variable | Value | Required |
|----------|-------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `AUTH_SECRET` | Random 32+ char string (generate: `openssl rand -base64 32`) | ✅ |
| `NEXTAUTH_URL` | Your production URL (e.g., `https://thunha.vn`) | ✅ |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console | ✅ |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console | ✅ |
| `RESEND_API_KEY` | From Resend dashboard | ✅ |
| `FROM_EMAIL` | Your verified domain email (e.g., `noreply@thunha.vn`) | ✅ |
| `CRON_SECRET` | Random secret for cron jobs | ✅ |
| `NEXT_PUBLIC_APP_URL` | Same as NEXTAUTH_URL | ✅ |
| `NEXT_PUBLIC_APP_NAME` | `ThuNhà` | ❌ |

### Generate AUTH_SECRET:
```bash
openssl rand -base64 32
```

---

## 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Navigate to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth 2.0 Client IDs**
5. Application type: **Web application**
6. Add Authorized redirect URIs:
   - `https://your-domain.com/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google` (for dev)
7. Copy Client ID and Client Secret

---

## 4. Deploy to Vercel

### Method A: GitHub Integration (Recommended)

1. Push code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/new)
3. Import your repository
4. Configure environment variables (from step 2)
5. Click **Deploy**

### Method B: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (from project directory)
vercel --prod
```

---

## 5. Database Migration

After first deployment, run Prisma migration:

```bash
# Option 1: Via Vercel CLI
vercel env pull .env.local
npx prisma migrate deploy

# Option 2: Via Vercel Dashboard
# Go to Settings > Functions > Add script
# Add: npx prisma migrate deploy
```

Or use Prisma Studio to verify:
```bash
npx prisma studio
```

---

## 6. Verify Cron Jobs

Vercel automatically picks up cron jobs from `vercel.json`:

| Endpoint | Schedule (UTC) | Vietnam Time |
|----------|---------------|--------------|
| `/api/cron/overdue-bills` | 23:00 | 06:00 |
| `/api/cron/plan-expiry` | 00:00 | 07:00 |
| `/api/cron/send-reminders` | 01:00 | 08:00 |

To verify, check **Vercel Dashboard > Cron Jobs** after deployment.

---

## 7. Domain Setup (Optional)

1. Go to **Vercel Dashboard > Settings > Domains**
2. Add your domain (e.g., `thunha.vn`)
3. Configure DNS:
   - Type A: `76.76.21.21`
   - Type CNAME: `cname.vercel-dns.com`
4. Update `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to use your domain

---

## 8. Email Domain Verification

For production emails (not `onboarding@resend.dev`):

1. Go to [Resend Dashboard](https://resend.com/domains)
2. Add your domain
3. Add DNS records (TXT, CNAME) as instructed
4. Update `FROM_EMAIL` to use your domain

---

## 9. Post-Deployment Checklist

- [ ] Test user registration
- [ ] Test Google OAuth login
- [ ] Test password reset email
- [ ] Create a property and room
- [ ] Create a tenant
- [ ] Generate a bill
- [ ] Download PDF invoice
- [ ] Verify cron jobs are scheduled

---

## 10. Monitoring & Logs

### Vercel Dashboard
- **Overview**: Deployment status, traffic stats
- **Logs**: Real-time function logs
- **Analytics**: Performance metrics

### Recommended Additions
- Sentry for error tracking
- Posthog for product analytics

---

## Troubleshooting

### Database Connection Failed
- Verify `DATABASE_URL` is correct
- Check if database allows external connections
- Add Vercel IPs to database firewall

### OAuth Not Working
- Verify redirect URIs match exactly
- Check `NEXTAUTH_URL` matches your domain
- Ensure Google Cloud Console project is in production mode

### Emails Not Sending
- Verify `RESEND_API_KEY` is correct
- Check domain verification status
- Check Resend dashboard for failed deliveries

---

## Support

For issues, check:
1. Vercel deployment logs
2. Database connection logs
3. Resend email logs

**Production URL**: `https://your-domain.com`
**Admin Email**: Set up in database User table with `plan: "BUSINESS"`
