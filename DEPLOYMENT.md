
# Deployment Guide

This guide describes how to deploy the Rental Management Application to a production environment.

## Prerequisites

- Node.js 18+
- PostgreSQL Database
- npm or yarn or pnpm

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@host:port/dbname?schema=public"

# Next Auth
AUTH_SECRET="your-generated-secret-key" # Generate with: npx auth secret
AUTH_URL="https://your-domain.com" # Or http://localhost:3000 for local

# Google OAuth (Optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## Build for Production

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Generate Prisma Client:**
    ```bash
    npx prisma generate
    ```

3.  **Run Database Migrations:**
    ```bash
    npx prisma migrate deploy
    ```
    *Note: Use `migrate deploy` for production, not `migrate dev`.*

4.  **Build the Application:**
    ```bash
    npm run build
    ```

5.  **Start the Server:**
    ```bash
    npm start
    ```

## Deployment Options

### Vercel (Recommended)

1.  Push your code to a Git repository (GitHub, GitLab, Bitbucket).
2.  Import the project into Vercel.
3.  Configure the Environment Variables in Vercel Project Settings.
4.  Vercel will automatically detect Next.js and build the application.
5.  **Important:** Add a "Build Command" override in Vercel if needed to include prisma generation:
    `npx prisma generate && next build`
    *(This is already configured in `package.json` scripts)*

### Docker / VPS

You can containerize the application using Docker.

**Dockerfile Example:**

```dockerfile
FROM node:18-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

## Troubleshooting

- **Database Connection:** Ensure your database is accessible from the deployment environment. If using Vercel, ensure you "Allow all IP addresses" or whitelist Vercel IPs in your database setup (e.g., Supabase, Neon).
- **Build Errors:** Check `npm run build` locally before pushing. Common errors include type mismatches or missing environment variables during build (though Next.js usually inlines env vars at runtime, some build-time logic might need them).
