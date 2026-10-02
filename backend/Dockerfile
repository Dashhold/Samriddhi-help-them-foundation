FROM node:22.14.0-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --include=dev

COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:22.14.0-bookworm-slim AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY --chown=node:node package.json package-lock.json ./
COPY --chown=node:node --from=build /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/dist ./dist
COPY --chown=node:node --from=build /app/migrations ./migrations
COPY --chown=node:node --from=build /app/src/content/default-content.json ./src/content/default-content.json

USER node

CMD ["npm", "start"]
