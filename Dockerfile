FROM node:18 AS builder

COPY package.json package.json
COPY package-lock.json package-lock.json
COPY prisma prisma

RUN npm i

COPY src src
COPY tsconfig.json tsconfig.json

RUN npm run build

FROM node:18 AS runner

WORKDIR /app

COPY .env.example .env.example
COPY --from=builder prisma prisma
COPY --from=builder build build
COPY --from=builder package-lock.json package-lock.json
COPY --from=builder package.json package.json

RUN npm i --production

ENTRYPOINT [ "node", "build/index.js" ]
