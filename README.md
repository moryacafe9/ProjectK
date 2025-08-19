# ClassiCo Tech – Main Repository

This repo contains the backend server and a static frontend to upload website ZIP files, auto-detect forms, and auto-provision a database and APIs.

## Run locally (Node.js)

```bash
cd server
cp .env.example .env  # adjust values
npm install
npm run dev
# Open http://localhost:8080
```

## Run in Docker

```bash
cd server
docker build -t classico-tech:latest .
docker run --rm -p 8080:8080 \
  -e PORT=8080 \
  -e MONGO_URI=mongodb://host.docker.internal:27017/classico \
  -e MYSQL_HOST=host.docker.internal -e MYSQL_USER=root -e MYSQL_PASSWORD=secret -e MYSQL_DATABASE=classico \
  classico-tech:latest
# Open http://localhost:8080
```

Frontend is served from `server/public/index.html`.
