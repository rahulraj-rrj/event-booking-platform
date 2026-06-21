# Encore — Event Booking Platform

A full-stack event ticket booking platform built in 7 phases:

1. Schema + entities
2. Core CRUD
3. Authentication (JWT)
4. Authorization (roles + ownership)
5. Concurrency-safe booking engine + payment mock
6. Search, pagination, nearby-events (map), Swagger docs
7. React frontend + deployment (this doc)

```
event-booking-platform/
├── event-booking-backend/    Spring Boot API - see its README for full phase-by-phase notes
└── event-booking-frontend/   React + Vite app
```

## Running both locally

```bash
# Terminal 1 - backend
cd event-booking-backend
docker compose up -d        # starts MySQL
mvn spring-boot:run         # http://localhost:8080

# Terminal 2 - frontend
cd event-booking-frontend
npm install
cp .env.example .env
npm run dev                 # http://localhost:5173
```

**First-time setup** (no data exists yet):
1. Visit `http://localhost:8080/swagger-ui/index.html`
2. Register an ADMIN-equivalent account isn't possible via the API by
   design — register a normal account via `POST /api/auth/register`, then
   run `UPDATE users SET role='ADMIN' WHERE email='you@example.com';`
   directly in MySQL, just for yourself, to unlock venue/seat creation.
3. As that admin (use the **Authorize** button in Swagger UI with your
   access token), create a venue (`POST /api/venues`) and a few seats
   (`POST /api/venues/{venueId}/seats`).
4. Register a second account as `ORGANIZER` through the actual frontend at
   `localhost:5173/register`, log in, and use **Create event** to create an
   event at that venue.
5. Browse to the event from the homepage and book a seat as any user.

## Deploying it for real (so your resume links to something live)

This stack: **TiDB Cloud** (free, MySQL-compatible database) + **Render**
(free backend hosting, via Docker) + **Vercel** (free frontend hosting).
Render's free tier only includes a Postgres database, not MySQL, which is
why TiDB Cloud is in the mix instead — it speaks the MySQL wire protocol,
so nothing about the JDBC/Hibernate setup changes.

### 1. Database — TiDB Cloud

1. Sign up at [tidbcloud.com](https://tidbcloud.com), create a free
   **Serverless** cluster
2. Click **Connect**, generate a password, and copy the connection details
   (host, username — it'll look like `xxxxxx.root`, not just `root`)
3. Your JDBC URL will look like:
   ```
   jdbc:mysql://gateway01.<region>.prod.aws.tidbcloud.com:4000/event_booking?sslMode=VERIFY_IDENTITY&enabledTLSProtocols=TLSv1.2,TLSv1.3
   ```
   (note port `4000`, not `3306`, and the SSL params are required)

### 2. Push to GitHub

Push `event-booking-backend` and `event-booking-frontend` as two separate
GitHub repos (simplest — avoids monorepo config on both platforms).

### 3. Backend → Render

1. New → **Web Service** → connect your backend repo
2. Render should auto-detect the `Dockerfile` in the repo root and offer
   **Docker** as the runtime — accept that (don't use a build/start command
   here, the Dockerfile handles it)
3. Instance type: **Free**
4. Add these environment variables:
   | Key | Value |
   |---|---|
   | `SPRING_PROFILES_ACTIVE` | `prod` |
   | `DB_URL` | your TiDB JDBC URL from step 1 |
   | `DB_USERNAME` | the `xxxxxx.root` username from TiDB |
   | `DB_PASSWORD` | the password you generated |
   | `JWT_SECRET` | a long random string (don't reuse the one in this repo) |
5. Create the service. First deploy takes a few minutes (it's building a
   Docker image). Once live, you'll get a URL like
   `https://event-booking-backend-xxxx.onrender.com`

Note: Render's free tier spins the service down after 15 minutes of
inactivity. The first request after that takes 30-60 seconds to wake back
up — mention this if you send the link to someone cold, so they don't
think it's broken.

### 4. Frontend → Vercel

1. Import your frontend repo on [vercel.com](https://vercel.com)
2. Framework preset: **Vite** (auto-detected)
3. Add environment variable `VITE_API_BASE_URL` = your Render backend URL
   + `/api`, e.g. `https://event-booking-backend-xxxx.onrender.com/api`
4. Deploy — you'll get a URL like `https://your-app.vercel.app`

### 5. Close the loop: tell the backend about the frontend

Back on Render, add one more environment variable:
| Key | Value |
|---|---|
| `FRONTEND_URL` | your Vercel URL, e.g. `https://your-app.vercel.app` |

This feeds into `app.cors.allowed-origins` in `application-prod.properties`
— without it, the deployed frontend can't call the deployed backend (same
CORS issue as local dev, just with live URLs instead of localhost ones).
Render redeploys automatically when you change an env var.

### 6. Seed it with real data

Same as local setup: make yourself ADMIN directly in TiDB Cloud's SQL
console (or any MySQL client pointed at it), then use your live
`/swagger-ui/index.html` URL to create a venue and seats, then create an
event through the live frontend as an organizer.

Once both are live, put the live URL *and* the GitHub links on your resume
next to this project — a working demo a recruiter can click is worth more
than a repo they have to clone and run themselves.

## What to actually understand before an interview

If you only have time to deeply understand a handful of things, make it
these — they're the parts most likely to come up:

1. **Why `EventSeat` exists separately from `Seat`** (backend README, phase 1)
2. **How the JWT filter chain works**, end to end (backend README, phase 3)
3. **The role check vs ownership check split** (backend README, phase 4)
4. **How optimistic locking prevents double-booking**, and why `LOCKED` vs
   `BOOKED` are two different states (backend README, phase 5) — this is
   the single most interview-worthy thing in the whole project
5. **Why the frontend stores tokens in `localStorage`** and what the
   tradeoff is (frontend README)
