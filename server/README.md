# ClassiCo Tech Backend

Express backend that:
- Accepts a ZIP of website code at `POST /upload/`
- Detects forms (login/signup/contact) using simple keyword heuristics
- Auto-selects DB: MySQL (auth-focused) vs MongoDB (contact/free-form)
- Creates tables/collections
- Exposes auth endpoints `/api/auth/signup` and `/api/auth/login`
- Exposes contact endpoint `/api/contact` to store messages

## Getting started

1. Copy `.env.example` to `.env` and configure DBs
2. Install deps and run

```bash
cd server
npm install
npm run dev
```

Server listens on `http://localhost:8080`.

## Endpoints

- `POST /upload/` with `file` field (.zip). Returns `{ detected_forms, db_kind, db_url }`.
- `POST /api/auth/signup` `{ email, password, username? }`
- `POST /api/auth/login` `{ email, password }`
- `POST /api/contact` `{ name?, email?, subject?, message? }`

## Security
- helmet, rate limiting, mongo sanitize, HPP
- mysql2 prepared statements
- bcrypt password hashing
- JWT auth token issuance

