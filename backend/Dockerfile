# ---- Build Stage ----
FROM node:20-slim AS builder

WORKDIR /app

# Install OpenSSL required by Prisma's query engine
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

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
FROM node:20-slim AS runner

WORKDIR /app

# Install OpenSSL required by Prisma's query engine at runtime
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Install only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --production

# Copy Prisma generated client + schema from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/prisma ./prisma

# Copy compiled output
COPY --from=builder /app/dist ./dist

# Copy startup script
COPY docker-start.sh ./
RUN chmod +x docker-start.sh

EXPOSE 4000

ENV NODE_ENV=production

CMD ["./docker-start.sh"]
