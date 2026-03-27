FROM node:22-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --production=false

COPY . .
RUN npm run build

ENV PORT=3002
ENV HOST=0.0.0.0
ENV NODE_ENV=production

EXPOSE 3002

CMD ["node", "build/remote.js"]
