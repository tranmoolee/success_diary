FROM node:20-alpine

WORKDIR /app

COPY server/package.json server/package-lock.json* ./server/
RUN cd server && npm install --production

COPY server/src ./server/src
COPY public ./public

EXPOSE 3000

CMD ["node", "server/src/index.js"]
