# Stage 1: Builder
FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build-time environment variables for NEXT_PUBLIC
ARG NEXT_PUBLIC_HASURA_GRAPHQL_URL
ARG NEXT_PUBLIC_HASURA_ADMIN_SECRET

ENV NEXT_PUBLIC_HASURA_GRAPHQL_URL=$NEXT_PUBLIC_HASURA_GRAPHQL_URL
ENV NEXT_PUBLIC_HASURA_ADMIN_SECRET=$NEXT_PUBLIC_HASURA_ADMIN_SECRET

# Build Next.js app for standalone output
RUN npm run build


# Stage 2: Runner
FROM node:18-alpine AS runner
WORKDIR /app

# Install FFmpeg - still required for the merge-all route
RUN apk add --no-cache ffmpeg

# Set user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output from builder
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# Copy public assets
COPY --from=builder /app/public ./public

RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000
ENV PORT=3000

# Correct command to run the standalone server
CMD ["node", "server.js"]
