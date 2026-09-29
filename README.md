# Farm Records Backend

## Setup

1. Install PostgreSQL if you don't have it, then create a database:
   ```
   createdb farm_records
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Copy the environment file and fill in your real database credentials:
   ```
   cp .env.example .env
   ```

4. Load the schema into your database:
   ```
   psql -d farm_records -f db/schema.sql
   ```

5. Start the dev server (auto-restarts on file changes):
   ```
   npm run dev
   ```

6. Confirm it's working by visiting:
   ```
   http://localhost:5000/api/health
   ```
   You should see `{"status":"ok","database":"connected"}`. If `database`
   shows an error instead, double check your `DATABASE_URL` in `.env`.

## Folder structure

```
backend/
├── db/
│   └── schema.sql       # table definitions -- run once to set up the DB
├── src/
│   ├── config/
│   │   └── db.js        # shared PostgreSQL connection pool
│   ├── routes/           # (next lesson) URL -> controller mappings
│   ├── controllers/       # (next lesson) request handling logic
│   └── app.js            # Express app + middleware + health check
├── server.js             # starts the server
├── .env.example
└── package.json
```

Why this structure: routes, controllers, and config are split into
separate folders so each file has one job. As the app grows, you'll
know exactly where to look -- "how does login work?" is always in
`routes/auth.js` and `controllers/authController.js`, never scattered
across app.js.
