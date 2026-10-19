FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    DATABASE_URL=file:/data/jobtrail.db

RUN mkdir /data && chown node:node /data

COPY --from=build /app/package.json /app/next.config.mjs ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/drizzle ./drizzle

USER node
VOLUME /data
EXPOSE 3000

# Migrations run automatically on startup (see src/instrumentation.ts)
CMD ["node_modules/.bin/next", "start"]
