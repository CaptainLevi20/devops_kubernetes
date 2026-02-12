FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY controller.js ./

ENV NODE_ENV=production

CMD ["node", "controller.js"]
