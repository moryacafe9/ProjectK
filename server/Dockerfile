FROM node:20-alpine
WORKDIR /app

# Install dependencies first
COPY package.json ./
RUN npm install --only=production

# Copy source
COPY src ./src
COPY .env.example ./.env.example

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["node", "src/app.js"]

