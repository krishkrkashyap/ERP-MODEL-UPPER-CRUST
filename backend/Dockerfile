# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Install all dependencies (including dev)
COPY package.json package-lock.json ./
RUN npm ci

# Copy Prisma schema and generate client (needed BEFORE tsc build)
COPY prisma ./prisma
RUN npx prisma generate

# Copy source and build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- Production Stage ----
FROM node:20-alpine AS runner

WORKDIR /app

# Install only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --production

# Copy Prisma generated client + schema from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/prisma ./prisma

# Copy compiled output
COPY --from=builder /app/dist ./dist

EXPOSE 4000

ENV NODE_ENV=production

CMD ["node", "dist/server.js"]
