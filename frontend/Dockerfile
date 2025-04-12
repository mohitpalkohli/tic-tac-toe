FROM node:20-bookworm-slim

WORKDIR /app

COPY package*.json .

RUN npm ci

COPY . .

EXPOSE 3001

CMD ["/bin/sh", "-c", "npm start & tail -f /dev/null"]