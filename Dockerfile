FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY src/infrastructure/persistence/prisma ./src/infrastructure/persistence/prisma
RUN npm ci

COPY . .
RUN npx prisma generate --schema src/infrastructure/persistence/prisma/schema.prisma \
  && npm run build

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY src/infrastructure/persistence/prisma ./src/infrastructure/persistence/prisma
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy --schema src/infrastructure/persistence/prisma/schema.prisma && node dist/main.js"]
