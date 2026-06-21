# Event Booking Platform - Backend

A Spring Boot backend for an event ticket booking platform with concurrency-safe
seat reservation, JWT auth with roles, payment flow, and venue maps.

## Roadmap

- [x] Phase 1 - Schema + entities
- [x] Phase 2 - Core CRUD (venues, events, seats)
- [x] Phase 3 - Authentication (Spring Security + JWT)
- [x] Phase 4 - Authorization (roles, ownership checks)
- [x] Phase 5 - Booking engine (optimistic locking) + payment mock
- [x] Phase 6 - Map integration + search/filter + Swagger docs
- [x] Phase 7 - React frontend + deployment (this delivery)

## Phase 1: schema design

Six entities, deliberately structured to avoid a common booking-app bug:

- `User` - account + role (USER, ORGANIZER, ADMIN)
- `Venue` - physical location, includes `latitude`/`longitude` for phase 6's map
- `Seat` - a physical chair in a venue (e.g. "A12"), reusable across events
- `Event` - something happening at a venue, owned by an ORGANIZER user
- `EventSeat` - **the bookable unit**. Links one `Seat` to one `Event` and
  carries availability status + price + the `@Version` field. This split
  exists because a physical seat must be independently bookable per event -
  if status lived directly on `Seat`, booking it for tonight's show would
  incorrectly block it for next month's show too.
- `Booking` - a user's reservation for an event (one booking can cover
  multiple `EventSeat`s)
- `Payment` - one payment per booking

The `@Version` field on `EventSeat` is what powers optimistic locking in
phase 5 - it's the mechanism that prevents two people from booking the same
seat at the same time.

## Running it locally

**Prerequisites:** Java 17, Maven (or use your IDE's built-in Maven), and either
a local MySQL install or Docker.

**1. Start MySQL** (pick one):

```bash
# Option A: Docker (recommended, no local install needed)
docker compose up -d

# Option B: your own local MySQL - just make sure it's running on port 3306
```

**2. Update credentials** in `src/main/resources/application.properties` if
you changed them from the defaults.

**3. Run the app:**

```bash
mvn spring-boot:run
```

On first run, Hibernate will create all tables for you automatically
(`ddl-auto=update`). Check your MySQL client - you should see `users`,
`venues`, `seats`, `events`, `event_seats`, `bookings`, `payments`.

## Phase 2: core CRUD

Endpoints added:

- `POST/GET /api/venues`, `GET/PUT/DELETE /api/venues/{id}`
- `POST/GET /api/venues/{venueId}/seats`
- `POST/GET /api/events`, `GET/PUT/DELETE /api/events/{id}`
- `GET /api/events/{id}/seats` - per-event seat availability

**Key business rule:** creating an event automatically generates one
`EventSeat` row per physical seat in the venue, all `AVAILABLE` at the
event's `basePrice`. That's what `GET /api/events/{id}/seats` returns.

## Phase 3: authentication

Endpoints added:

- `POST /api/auth/register` - create a USER or ORGANIZER account (ADMIN is never self-service)
- `POST /api/auth/login` - returns an access token (15 min) + refresh token (7 days)
- `POST /api/auth/refresh` - exchange a valid refresh token for a new pair (rotated)

Every other endpoint requires a header:

```
Authorization: Bearer <accessToken>
```

**How the pieces fit together:**
- `SecurityConfig` wires everything: which routes are public, stateless
  sessions (no server-side session, the JWT carries everything), and where
  the custom filter slots into the chain
- `JwtAuthenticationFilter` runs on every request, validates the token if
  present, and tells Spring Security who's making the request
- `JwtUtil` is the actual token generation/validation logic (HMAC-signed,
  using the `jjwt` library)
- `CustomUserDetailsService` is the bridge between our `User` entity and
  what Spring Security expects

## Phase 4: authorization

Two layers of control, working together:

**1. Role checks (`@PreAuthorize` on controllers)** - coarse-grained, "is this
type of user even allowed to attempt this":
- Venue/seat create-update-delete: `ADMIN` only
- Event create/update/delete: `ORGANIZER` or `ADMIN`
- All GET requests on venues/events: public, no login required

**2. Ownership checks (inside the service layer)** - fine-grained, "is this
*specific* user allowed to touch *this specific* resource":
- An `ORGANIZER` can only update/delete events *they* created
- `ADMIN` bypasses ownership checks entirely

This split matters: `@PreAuthorize("hasAnyRole('ORGANIZER','ADMIN')")` only
knows the caller's role, not which event they're touching. So Organizer A
editing Organizer B's event passes the role check but fails the ownership
check in the service layer, and gets a 403 with a clear message instead of
silently succeeding.

`POST /api/events` takes the organizer directly from the authenticated
user's token via `CurrentUserProvider` - it's never accepted from the client.

**Try it out:**
1. Register two ORGANIZER accounts (A and B)
2. Log in as A, create an event
3. Log in as B, try to `PUT` or `DELETE` A's event -> expect `403 Forbidden`
4. Set one user's role to `ADMIN` directly in the DB and confirm an ADMIN
   *can* edit anyone's event

## Phase 5: the booking engine

This is the feature the whole project is built around. Endpoints:

- `POST /api/bookings` - reserve seats for an event
- `POST /api/bookings/{id}/pay` - confirm payment (mock gateway)
- `POST /api/bookings/{id}/cancel` - cancel and release seats back
- `GET /api/bookings/{id}` - view one booking (owner or ADMIN only)
- `GET /api/bookings/my` - list your own bookings

**The seat lifecycle now uses all three `SeatStatus` values:**

```
AVAILABLE --(booking created)--> LOCKED --(payment confirmed)--> BOOKED
                                    |                                |
                                    +----------(cancelled)-----------+
                                                  v
                                              AVAILABLE
```

A seat is `LOCKED` the moment it's reserved (before payment), and only
becomes `BOOKED` once payment succeeds. Cancelling at any point releases it
back to `AVAILABLE` for someone else to book.

**The concurrency-safe part:** `BookingService.createBooking()` reads each
selected `EventSeat`, checks it's `AVAILABLE`, then writes `LOCKED` with
`saveAndFlush()`. If two requests race for the same seat, both pass the
initial `AVAILABLE` check (they read it at nearly the same instant), but
only the first `saveAndFlush()` actually commits - Hibernate's `@Version`
check on the second one fails because the version it read is now stale,
throwing `ObjectOptimisticLockingFailureException`. The service catches
that and turns it into a clean `409 Conflict`, and the whole transaction
rolls back - no half-created booking left behind.

**Try it yourself (worth actually doing, not just reading):** open two
terminal tabs and fire the same `POST /api/bookings` request for the same
`eventSeatId` from two different logged-in users back to back. One gets
`201 Created`, the other gets `409 Conflict`. That's the optimistic lock
doing its job.

**Payment is intentionally mocked** - `confirmPayment()` simulates an
instant success rather than calling a real gateway. The booking/seat state
machine is the real feature here; swapping the mock for Stripe/Razorpay
later only touches this one method.

## Phase 6: search, pagination, nearby events, and API docs

**`GET /api/events`** now accepts optional filters and pagination, all
combinable:

```
GET /api/events?category=music&keyword=jazz&from=2026-07-01T00:00:00&to=2026-08-01T00:00:00&page=0&size=10&sort=startTime,asc
```

Built with Spring Data's `Specification` API (`EventSpecifications`) - each
filter is its own small composable predicate, `null` filters are simply
skipped, and they all combine into one query. Adding a new filter later
(e.g. price range) means adding one more method, not touching existing ones.

**`GET /api/events/nearby?lat=..&lng=..&radiusKm=25`** - returns events
within a radius, sorted closest-first, using the Haversine formula to
compute distance between the search point and each venue's coordinates
(plain Java, not a native SQL query - simpler to read and explain, plenty
fast at this scale). This is the backend half of the map feature; the
frontend (phase 7) calls this to power "events near me."

**Swagger / OpenAPI docs** - run the app and visit:

```
http://localhost:8080/swagger-ui/index.html
```

Every endpoint is listed with its request/response shape. Click
**Authorize** in the top right, paste in an access token (no need to type
"Bearer", it's added for you), and you can call protected endpoints
directly from the browser - useful for demoing the project without
Postman.

## Phase 7 backend addition: GET /api/users/me

One small endpoint added to support the frontend: `GET /api/users/me`
returns the authenticated user's `id`, `name`, `email`, and `role`. The JWT
itself only carries the email (`sub` claim) - this endpoint is how the
frontend finds out who's logged in and what role they have, right after
login, so it can show/hide things like the "Create event" link.

## CORS

`SecurityConfig` allows requests from `http://localhost:5173` (the Vite dev
server) — without this, the browser blocks every API call before it even
reaches a controller, which is a confusing failure mode because nothing
shows up in Spring's logs. If you deploy the frontend somewhere else later,
add that URL to the `allowedOrigins` list in `corsConfigurationSource()`.

## Production config

`Dockerfile` and `application-prod.properties` (activated via
`SPRING_PROFILES_ACTIVE=prod`) are set up for deploying this to Render with
a TiDB Cloud database — see the deployment section in the top-level
project README for the full walkthrough.
