# Stage 1: Install dependencies
FROM node:18-alpine AS deps
WORKDIR /app

COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile

# Stage 2: Build the Next.js app
FROM node:18-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn build

# Stage 3: Run the built app in production
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 8080
CMD ["yarn", "start", "-p", "8080"]
