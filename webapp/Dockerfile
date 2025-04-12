FROM node:20-bookworm-slim

WORKDIR /app

COPY package*.json .

RUN npm ci

COPY . .

EXPOSE 3000

CMD ["/bin/sh", "-c", "npm start & tail -f /dev/null"]