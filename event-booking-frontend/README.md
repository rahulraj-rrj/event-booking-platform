# Encore — Event Booking Frontend

React + Vite frontend for the event booking platform. Talks to the Spring
Boot backend over the REST API built in phases 1-6.

## Running it locally

**Prerequisite:** the backend (`event-booking-backend`) running on
`http://localhost:8080`, with at least one venue + seats + event created
(use Swagger UI at `/swagger-ui/index.html` to seed a venue and seats as
ADMIN, then create an event from this app as an ORGANIZER).

```bash
npm install
cp .env.example .env   # edit if your backend runs somewhere other than localhost:8080
npm run dev
```

Visit `http://localhost:5173`.

## What's here

- **Auth** (`LoginPage`, `RegisterPage`, `AuthContext`) - register as USER or
  ORGANIZER, log in, and the access/refresh tokens are stored and silently
  refreshed by the Axios interceptor in `api/client.js` whenever a request
  comes back `401`.
- **Browse + search** (`HomePage`) - paginated, filterable by keyword and
  category, calling the `Specification`-based search from phase 6.
- **Near me** (`NearbyEventsPage`) - asks for browser geolocation, calls
  `/api/events/nearby`, and plots results on a Leaflet map.
- **Event detail + seat selection** (`EventDetailPage`, `SeatMap`,
  `VenueMap`) - the seat grid is colored by live status (available / locked
  / booked) and only lets you select `AVAILABLE` seats. The venue map below
  it uses the same lat/lng stored on `Venue` since phase 1.
- **Booking + payment** (`BookingConfirmationPage`, `TicketStub`) - shows
  the booking's live status, with a "Pay now" button that calls the mock
  payment endpoint and a cancel button that releases the seats. If you try
  to book a seat someone else just took, the 409 from the backend's
  optimistic lock shows up here as a friendly error message and the seat
  map refreshes to reflect the new state.
- **My bookings** (`MyBookingsPage`) - all your bookings as ticket stubs.
- **Create event** (`CreateEventPage`, organizer-only route) - picks from
  existing venues and creates an event; the backend auto-generates
  `EventSeat` rows for every seat in that venue.

## Design direction

The palette is built around two deliberate accents instead of the generic
"dark background, one accent color" look: **gold** (`--gold`, a marquee
spotlight) and **teal** (`--teal-bright`, a velvet curtain) — both grounded
in an actual theater, not picked arbitrarily. Type pairs **Space Grotesk**
(display) with **Inter** (body) and **IBM Plex Mono** for anything
data-shaped — seat numbers, booking IDs, prices.

The signature element is the `TicketStub` — a perforated-card shape with a
notched divider, used for every booking. It's the one place the design
takes a real risk; everything else (navbar, forms, cards) stays quiet and
disciplined so the ticket stands out instead of competing with it. A subtle
grain texture on the page background nods to the paper a ticket is printed
on, and the color of the left edge of each stub mirrors its booking status.

## Why a few things are the way they are

- **Leaflet + OpenStreetMap instead of Google Maps** - no API key or
  billing account needed, which matters for a project you want to actually
  run and demo without friction.
- **Venues/seats aren't managed from this app** - that's deliberately left
  to Swagger UI as the "admin back office," since most real consumer apps
  don't expose master-data management to end users either. Keeps this
  frontend focused on the booking experience.
- **Tokens in `localStorage`** - simplest approach for a project like this.
  A production app might consider httpOnly cookies instead to reduce XSS
  exposure; worth knowing as a tradeoff if it comes up in an interview.
