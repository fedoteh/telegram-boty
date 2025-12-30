FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM deps AS builder
COPY tsconfig*.json ./
COPY src ./src
COPY config ./config
RUN npm run build && npm prune --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/config ./config

RUN addgroup -S -g 10001 app && adduser -S -u 10001 -G app app

USER 10001:10001

CMD ["node", "dist/bot.js"]
