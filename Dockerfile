# ===== Stage 1: Builder =====
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

# Build Next.js app
RUN npm run build


# ===== Stage 2: Runner =====
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package.json and lock file
COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Copy build output and public folder from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Expose port
EXPOSE 3000

# Start Next.js
CMD ["npm", "run", "start"]
