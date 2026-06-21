<div align="center">

# 🎟️ Encore
### A concurrency-safe event ticket booking platform

**Two people click "Reserve" on the same seat in the same millisecond.
Only one gets the ticket — and the other gets told instantly, instead of
both walking into the venue to find one seat and two ticket holders.**

That single sentence is the reason this project exists.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-encore--eventbookingsystem--rrj.netlify.app-f2a93b?style=for-the-badge)](https://encore-eventbookingsystem-rrj.netlify.app)
[![API Docs](https://img.shields.io/badge/API%20Docs-Swagger-85ea2d?style=for-the-badge&logo=swagger)](https://event-booking-backend-h73m.onrender.com/swagger-ui/index.html)

![Java](https://img.shields.io/badge/Java-17-orange?logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3-6DB33F?logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-compatible-4479A1?logo=mysql&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT-000000?logo=jsonwebtokens&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)

</div>

---

## The 30-second pitch

Most beginner full-stack projects are CRUD with a login screen bolted on.
This one isn't. **Encore** is a full event ticket booking platform —
think a scoped-down BookMyShow — built specifically around the one problem
every real booking system has to solve and most tutorial projects quietly
skip: **what happens when two people try to book the exact same seat at
the exact same instant?**

The answer here is optimistic locking at the database level, not a
"please don't click twice" disclaimer. Open two browser tabs, log in as
two different users, race to book the same seat — one wins, one gets a
clean `409 Conflict` with a human-readable message, and nothing is ever
double-booked. That's not a hypothetical in the code; it's a five-minute
demo anyone can run themselves on the live link above.

Everything else a real ticketing platform needs is here too: JWT
authentication with refresh tokens, two layers of authorization (role
checks *and* per-resource ownership checks), a Leaflet-powered map for
"events near me," full-text search with pagination, and a payment flow
(mocked, clearly labeled as such) that takes a booking from reserved →
paid → confirmed.

## Try it yourself

| | |
|---|---|
| 🌐 **Live app** | [encore-eventbookingsystem-rrj.netlify.app](https://encore-eventbookingsystem-rrj.netlify.app) |
| 📑 **API docs (Swagger)** | [event-booking-backend-h73m.onrender.com/swagger-ui](https://event-booking-backend-h73m.onrender.com/swagger-ui/index.html) |
| 💻 **Source** | you're looking at it |

> **Note:** the backend is on a free hosting tier that sleeps after 15
> minutes of inactivity. If the first load takes 30-60 seconds, that's
> why — it's waking back up, not broken.

## What's actually interesting here (for the technically curious)

**1. The seat that can't be double-booked.**
Every bookable seat is its own row (`EventSeat`) carrying a Hibernate
`@Version` field. Reserving a seat reads it, checks it's `AVAILABLE`, then
writes `LOCKED` with an immediate flush. If two requests race for the same
row, the database rejects the second write the instant the version number
has moved — Spring catches that as an `ObjectOptimisticLockingFailureException`
and turns it into a clean, immediate `409` instead of a corrupted booking.

**2. A seat schema that doesn't make the obvious beginner mistake.**
A physical seat (`Seat`) and a *bookable* seat for one specific event
(`EventSeat`) are deliberately different entities. Seat "A12" can be
`AVAILABLE` for next month's show and `BOOKED` for tonight's, at the same
time — because availability isn't a property of the chair, it's a property
of the chair *for that event*.

**3. Two-layer authorization, not one.**
`@PreAuthorize` answers "is this *type* of user allowed to attempt this."
A separate ownership check in the service layer answers "is this
*specific* user allowed to touch *this specific* resource." An organizer
can create events; a different organizer still can't edit *your* event,
even though both pass the role check.

**4. A real auth lifecycle, not a tutorial shortcut.**
Short-lived access tokens (15 min) + longer-lived refresh tokens (7 days),
with silent refresh-on-401 handled by an Axios interceptor on the frontend
— the kind of detail that separates "I copied a JWT example" from
"I understand why sessions are designed this way."

**5. It's actually deployed.**
Spring Boot on Render (via Docker), a MySQL-compatible serverless database
on TiDB Cloud, React on Netlify — three different free-tier platforms
wired together with environment-driven config, not hardcoded values. The
`Dockerfile`, the CORS setup, the production properties profile — all of
it is in this repo, not just claimed in a bullet point.

## Tech stack

**Backend** — Java 17 · Spring Boot 3 · Spring Security · Spring Data JPA /
Hibernate · MySQL (TiDB Cloud in production) · JWT (jjwt) · Maven ·
springdoc-openapi (Swagger)

**Frontend** — React 18 · Vite · React Router · Axios · Leaflet /
react-leaflet · lucide-react

**Infra** — Docker · Render · Netlify · TiDB Cloud Serverless

## The seat lifecycle, visually

```
AVAILABLE --(booking created)--> LOCKED --(payment confirmed)--> BOOKED
                                    |                                |
                                    +----------(cancelled)-----------+
                                                  v
                                              AVAILABLE
```

## Project structure

```
event-booking-platform/
├── event-booking-backend/    Spring Boot API — see its README for a full,
│                              phase-by-phase build log (schema → auth →
│                              authorization → booking engine → search/maps)
└── event-booking-frontend/   React + Vite app
```

---

## Running it locally

```bash
# Terminal 1 - backend
cd event-booking-backend
docker compose up -d        # starts MySQL
cp src/main/resources/application.properties.example src/main/resources/application.properties
mvn spring-boot:run         # http://localhost:8080

# Terminal 2 - frontend
cd event-booking-frontend
npm install
cp .env.example .env
npm run dev                 # http://localhost:5173
```

**First-time setup** (no data exists yet):
1. Visit `http://localhost:8080/swagger-ui/index.html`
2. Register a normal account via `POST /api/auth/register`, then run
   `UPDATE users SET role='ADMIN' WHERE email='you@example.com';`
   directly in MySQL, just for yourself, to unlock venue/seat creation
   (self-service admin signup is intentionally not allowed via the API)
3. As that admin (use the **Authorize** button in Swagger UI with your
   access token), create a venue (`POST /api/venues`) and a few seats
   (`POST /api/venues/{venueId}/seats`)
4. Register a second account as `ORGANIZER` through the actual frontend at
   `localhost:5173/register`, log in, and use **Create event** to create an
   event at that venue
5. Browse to the event from the homepage and book a seat as any user

## Deploying your own copy

This stack: **TiDB Cloud** (free, MySQL-compatible database) + **Render**
(free backend hosting, via Docker) + **Netlify or Vercel** (free frontend
hosting). Render's free tier only includes a Postgres database, not MySQL,
which is why TiDB Cloud is in the mix instead — it speaks the MySQL wire
protocol, so nothing about the JDBC/Hibernate setup changes.

### 1. Database — TiDB Cloud

1. Sign up at [tidbcloud.com](https://tidbcloud.com), create a free
   **Starter** cluster
2. Click **Connect**, generate a password, and copy the connection details
   (host, username — it'll look like `xxxxxx.root`, not just `root`)
3. Your JDBC URL will look like:
   ```
   jdbc:mysql://<host>:4000/event_booking?createDatabaseIfNotExist=true&sslMode=VERIFY_IDENTITY&enabledTLSProtocols=TLSv1.2,TLSv1.3
   ```
   (note port `4000`, not `3306`, and the SSL params are required)

### 2. Push the whole project to GitHub

One repo, both folders inside it — Render and Netlify/Vercel can each be
pointed at a subfolder ("Root Directory" / "Base Directory") of the same
repo, so there's no need to split it into two.

### 3. Backend → Render

1. New → **Web Service** → connect your repo (a public repo can be
   connected via its URL directly, no GitHub permission grant needed)
2. **Root Directory**: `event-booking-backend`
3. Render should auto-detect the `Dockerfile` and offer **Docker** as the
   runtime
4. Instance type: **Free**
5. Environment variables:

   | Key | Value |
   |---|---|
   | `SPRING_PROFILES_ACTIVE` | `prod` |
   | `DB_URL` | your TiDB JDBC URL from step 1 |
   | `DB_USERNAME` | the `xxxxxx.root` username from TiDB |
   | `DB_PASSWORD` | the password you generated |
   | `JWT_SECRET` | a long random string (don't reuse the one in this repo) |
   | `FRONTEND_URL` | leave as `http://localhost:5173` for now, update after step 4 |

6. Create the service — first deploy takes a few minutes (building a
   Docker image)

Render's free tier spins the service down after 15 minutes of inactivity;
the first request after that takes 30-60 seconds to wake back up.

### 4. Frontend → Netlify (or Vercel)

**Netlify:**
1. Add new site → import from GitHub → select this repo
2. Base directory: `event-booking-frontend` · Build command: `npm run build`
   · Publish directory: `dist`
3. Environment variable: `VITE_API_BASE_URL` = your Render URL + `/api`

**Vercel:** same idea — Root Directory `event-booking-frontend`, Vite
preset auto-detected, same environment variable. (Vercel may ask for phone
verification on some accounts; Netlify doesn't.)

### 5. Close the loop

Back on Render, update `FRONTEND_URL` to your real Netlify/Vercel URL.
This feeds `app.cors.allowed-origins` — without it, the deployed frontend
can't call the deployed backend. Render redeploys automatically on env var
changes.

### 6. Seed it with real data

Same as local setup: make yourself ADMIN directly via TiDB Cloud's SQL
console, then use your live `/swagger-ui/index.html` to create a venue and
seats, then create an event through the live frontend as an organizer.

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

---

<div align="center">

### Built by Rahul Raj

📧 rahulraj.rrj.official@gmail.com · 💻 [github.com/rahulraj-rrj](https://github.com/rahulraj-rrj) 

*B.Tech Computer Science, Galgotias University — looking for backend /
full-stack opportunities where I can keep building things like this one.*

</div>
