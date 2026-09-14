# Airport Management

A NestJS backend for managing airports, flights, staff, passengers, and seat bookings. The system exposes a **GraphQL API** over **Fastify**, persists data in **PostgreSQL** via **TypeORM**, and uses **Redis** for OTP storage, rate limiting, pub/sub subscriptions, and background email jobs processed by a separate **worker** process.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Functional Requirements](#functional-requirements)
- [API Documentation](#api-documentation)
- [GraphQL Examples](#graphql-examples)
- [Authentication & Authorization](#authentication--authorization)
- [Database](#database)
- [Workers & Background Jobs](#workers--background-jobs)
- [Email System](#email-system)
- [Security & Cryptography](#security--cryptography)
- [Redis](#redis)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Technologies](#technologies)
- [Environment Variables](#environment-variables)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Database Migrations](#database-migrations)
- [Testing](#testing)
- [Error Handling](#error-handling)
- [Important Business Flows](#important-business-flows)
- [Concurrency & Transaction Safety](#concurrency--transaction-safety)
- [API Authentication Flow](#api-authentication-flow)
- [Development Notes](#development-notes)
- [Known Limitations](#known-limitations)

---

## Project Overview

### What problem it solves

The system provides a centralized backend for airport operations: managing airport records, scheduling flights, assigning staff, registering passengers, and booking seats on flights—with role-based access control and real-time notifications.

### High-level architecture

```
Client (GraphQL)
      │
      ▼
NestJS API (Fastify + Apollo GraphQL) — port 3000
      │
      ├── Resolvers → Services → Repositories → PostgreSQL
      ├── Auth (JWT cookies + refresh tokens in DB)
      ├── NotificationService → EmailChannel → BullMQ → Redis
      └── GraphQL Subscriptions → Redis Pub/Sub

Worker Process (separate NestJS app context)
      │
      ▼
BullMQ `emails` queue (Redis) → MailProcessor → Resend API
```

### Main features

| Feature | Status |
|---------|--------|
| Passenger registration with email OTP verification | Implemented |
| Cookie-based JWT authentication with refresh token rotation | Implemented |
| Airport CRUD (Super Admin) | Implemented |
| Flight management with airport-admin scoping | Implemented |
| Staff & airport admin management | Implemented |
| Seat booking with transactional locking | Implemented |
| Email notifications via background worker (Resend) | Implemented |
| In-app notifications (query + mark read) | Implemented |
| Real-time GraphQL subscriptions (notifications, flight status) | Implemented |
| Rate limiting (Redis-backed) | Implemented |
| Password reset flow | Partially implemented (templates/jobs exist, no API) |
| Socket/SMS notification channels | Not implemented (enum values only) |
| Logout mutation | Not implemented (`clearAuthCookies` exists internally) |

### Main modules

| Module | Responsibility |
|--------|----------------|
| `auth` | Registration, login, refresh, email verification, profile |
| `users` | User entity and repository (internal; no GraphQL resolver) |
| `passengers` | Passenger profiles linked to user accounts |
| `airports` | Airport CRUD and listing |
| `airport-admins` | Airport administrator accounts scoped to airports |
| `staff` | Staff accounts, roles, flight assignment |
| `flights` | Flight CRUD, filtering, status subscriptions |
| `bookings` | Seat booking and cancellation for passengers |
| `notification` | Multi-channel notification dispatch and in-app inbox |
| `email` | Resend integration and BullMQ queue producer |
| `redis` | Redis client for OTP and cache helpers |
| `workers` | Separate process consuming the `emails` queue |
| `common` | Guards, decorators, pipes, plugins, shared utilities |
| `database` | TypeORM config, migrations, data source |

---

## Functional Requirements

Requirements below are derived from the current codebase. Status reflects what is actually wired end-to-end.

### Auth Module

| Requirement | Who | Roles | Status |
|-------------|-----|-------|--------|
| Register as passenger with email, password, name, passport, nationality | Public | — | Implemented |
| Verify email with OTP sent by email | Public | — | Implemented |
| Login with email/password | Public | — | Implemented (requires verified email) |
| Refresh access token using refresh cookie | Authenticated (cookie) | Any | Implemented |
| View own profile | Authenticated | Any | Implemented |
| Logout / revoke session explicitly | — | — | **Not implemented** (no GraphQL mutation) |

**Business rules:**
- Registration creates a `User` (role `PASSENGER`) and linked `Passenger` record in a single transaction.
- Email must be unique; passport number must be unique.
- Password: 6–16 characters (validated on register input).
- Login blocked until `emailVerified` is `true`.
- OTP stored in Redis (`auth:email-otp:{email}`), expires in 10 minutes, hashed with bcrypt.
- Staff and airport admin accounts are created with `emailVerified: true` (no OTP flow).

### Airport Module

| Requirement | Who | Roles | Status |
|-------------|-----|-------|--------|
| List airports (paginated) | Authenticated | Any | Implemented |
| Get airport by ID | Authenticated | Any | Implemented |
| Create / update / delete airport | Authenticated | `SUPER_ADMIN` | Implemented |

**Business rules:**
- Airport `code` must be unique.
- Mutations require `SUPER_ADMIN` role.

### Passenger Module

| Requirement | Who | Roles | Status |
|-------------|-----|-------|--------|
| List all passengers | Authenticated | `SUPER_ADMIN` | Implemented |
| Get passenger by ID | Authenticated | `SUPER_ADMIN` or own profile (`PASSENGER`) | Implemented |
| Update any passenger | Authenticated | `SUPER_ADMIN` | Implemented |
| Update own profile | Authenticated | `PASSENGER` | Implemented |
| Delete passenger (and linked user) | Authenticated | `SUPER_ADMIN` | Implemented |

**Business rules:**
- Passport number uniqueness enforced on update.
- Delete removes both `Passenger` and linked `User` in a transaction.

### Staff Module

| Requirement | Who | Roles | Status |
|-------------|-----|-------|--------|
| List staff (optionally scoped to airport) | Authenticated | `SUPER_ADMIN`, `AIRPORT_ADMIN` | Implemented |
| Get staff by ID | Authenticated | `SUPER_ADMIN`, `AIRPORT_ADMIN` (own airport), `STAFF` (self) | Implemented |
| Create staff user + record | Authenticated | `SUPER_ADMIN`, `AIRPORT_ADMIN` | Implemented |
| Update staff role | Authenticated | `SUPER_ADMIN`, `AIRPORT_ADMIN` (own airport) | Implemented |
| Delete staff (and linked user) | Authenticated | `SUPER_ADMIN`, `AIRPORT_ADMIN` (own airport) | Implemented |
| Assign staff to flight | Authenticated | `SUPER_ADMIN`, `AIRPORT_ADMIN` (own airport) | Implemented |

**Business rules:**
- `SUPER_ADMIN` must supply `airportId` when creating staff; `AIRPORT_ADMIN` uses their own airport automatically.
- Staff can only be assigned to flights that involve their airport (departure or destination).
- New staff accounts have role `STAFF` and `emailVerified: true`.

### Airport Admin Module

| Requirement | Who | Roles | Status |
|-------------|-----|-------|--------|
| List airport admins | Authenticated | `SUPER_ADMIN`, `AIRPORT_ADMIN` (own airport) | Implemented |
| Get airport admin by ID | Authenticated | `SUPER_ADMIN`, `AIRPORT_ADMIN` (own airport) | Implemented |
| Create airport admin | Authenticated | `SUPER_ADMIN`, `AIRPORT_ADMIN` | Implemented |
| Delete airport admin (and linked user) | Authenticated | `SUPER_ADMIN`, `AIRPORT_ADMIN` (own airport) | Implemented |

**Business rules:**
- `SUPER_ADMIN` must supply `airportId`; `AIRPORT_ADMIN` creates within their own airport.
- No update mutation exists for airport admins.

### Flight Module

| Requirement | Who | Roles | Status |
|-------------|-----|-------|--------|
| List flights (with filters) | Authenticated | Any (`AIRPORT_ADMIN` scoped to own airport) | Implemented |
| Get flight by ID | Authenticated | Any (`AIRPORT_ADMIN` scoped) | Implemented |
| Create / update / delete flight | Authenticated | `SUPER_ADMIN`, `AIRPORT_ADMIN` | Implemented |
| Subscribe to flight status changes | Authenticated (WebSocket/SSE) | Any | Implemented |

**Business rules:**
- `AIRPORT_ADMIN` can only manage/view flights involving their airport.
- Departure and destination airports must differ; departure time must be before arrival time.
- `availableSeats` cannot be negative.
- `flightNumber` must be unique.
- Updating flight `status` publishes a `FLIGHT_STATUS_UPDATED` subscription event.

### Booking Module

| Requirement | Who | Roles | Status |
|-------------|-----|-------|--------|
| List own bookings | Authenticated | `PASSENGER` | Implemented |
| Get own booking by ID | Authenticated | `PASSENGER` | Implemented |
| Book a seat on a flight | Authenticated | `PASSENGER` | Implemented |
| Cancel own booking | Authenticated | `PASSENGER` | Implemented |

**Business rules:**
- Cannot book on a `CANCELED` flight.
- Seat number must be ≥ 1 and ≤ flight `availableSeats`.
- Only one confirmed booking per seat per flight (application check + transaction; see [Concurrency](#concurrency--transaction-safety)).
- Booking confirmation email queued after successful booking.
- Cancel sets status to `CANCELED`; does not free seat for re-booking in current logic (existing canceled record remains).

### Notification Module

| Requirement | Who | Roles | Status |
|-------------|-----|-------|--------|
| List own notifications (paginated, filter by read) | Authenticated | Any | Implemented |
| Mark notification as read | Authenticated | Any (own notifications) | Implemented |
| Subscribe to new notifications | Authenticated (WebSocket/SSE) | Any | Implemented (pub/sub channel exists; current flows only send EMAIL) |

**Business rules:**
- Currently triggered flows use `EMAIL` channel only (registration OTP, booking confirmation).
- `DATABASE` and `GRAPHQL_PUBSUB` channels are implemented but not used by existing business flows.
- `SOCKET` and `SMS` channels are defined in enums only; `SocketChannel` is commented out.

---

## API Documentation

**GraphQL endpoint:** `http://localhost:3000/graphql` (default NestJS Apollo path)

**Additional subscription endpoint:** `http://localhost:3000/graphql/sse` (Server-Sent Events via `graphql-sse`)

**Authentication for HTTP queries/mutations:** HttpOnly cookies `accessToken` and `refreshToken` (credentials must be included by the client).

**Authentication for WebSocket subscriptions (`graphql-ws`):** `Authorization: Bearer <accessToken>` in connection params.

All list queries use pagination with defaults: `page = 1`, `limit = 10`.

---

### Auth Module

#### Queries

##### `profile`

| Field | Value |
|-------|-------|
| **Type** | Query |
| **Authentication** | Required (cookie) |
| **Roles** | Any authenticated user |
| **Purpose** | Return the current user's profile |
| **Arguments** | None |
| **Returns** | `UserProfile` (`id`, `email`, `role`, `emailVerified`, `createdAt`, `updatedAt`) |
| **Errors** | `401 Unauthorized`, `404 User not found` |

#### Mutations

##### `register`

| Field | Value |
|-------|-------|
| **Type** | Mutation |
| **Authentication** | None |
| **Purpose** | Create passenger user + profile; send email OTP |
| **Arguments** | `input: RegisterInput!` — `email`, `password`, `name`, `passportNumber`, `nationality` |
| **Returns** | `UserProfile` |
| **Business rules** | Email and passport must be unique; password 6–16 chars; OTP emailed asynchronously |
| **Errors** | `409 Conflict` (duplicate email/passport), validation errors |

##### `login`

| Field | Value |
|-------|-------|
| **Type** | Mutation |
| **Authentication** | None |
| **Purpose** | Authenticate and set auth cookies |
| **Arguments** | `input: LoginInput!` — `email`, `password` |
| **Returns** | `UserProfile` |
| **Side effects** | Sets `accessToken` and `refreshToken` HttpOnly cookies |
| **Errors** | `401` invalid credentials, unverified email, wrong password |

##### `refreshToken`

| Field | Value |
|-------|-------|
| **Type** | Mutation |
| **Authentication** | Refresh cookie required |
| **Purpose** | Rotate refresh token and issue new access token |
| **Arguments** | None (reads `refreshToken` cookie) |
| **Returns** | `UserProfile` |
| **Side effects** | Revokes matched refresh token; saves new hash; updates cookies |
| **Errors** | `401` missing/invalid/reused refresh token (reuse revokes all user sessions) |

##### `verifyEmail`

| Field | Value |
|-------|-------|
| **Type** | Mutation |
| **Authentication** | None |
| **Purpose** | Verify email with OTP |
| **Arguments** | `email: String!`, `otp: String!` |
| **Returns** | `Boolean` |
| **Errors** | `400` invalid/expired OTP, `404` user not found |

---

### Airport Module

#### Queries

##### `airports`

| Field | Value |
|-------|-------|
| **Type** | Query |
| **Authentication** | Required |
| **Roles** | Any |
| **Arguments** | `input: AirportQueryInput` — `page`, `limit` |
| **Returns** | `AirportResponse` — `airports[]`, `meta { page, totalCount }` |

##### `airport`

| Field | Value |
|-------|-------|
| **Type** | Query |
| **Authentication** | Required |
| **Roles** | Any |
| **Arguments** | `id: ID!` |
| **Returns** | `Airport` |
| **Errors** | `404 Airport not found` |

#### Mutations

##### `createAirport`

| Field | Value |
|-------|-------|
| **Type** | Mutation |
| **Authentication** | Required |
| **Roles** | `SUPER_ADMIN` |
| **Arguments** | `input: CreateAirportInput!` — `name`, `code`, `city`, `country` |
| **Returns** | `Airport` |
| **Errors** | `409` duplicate code, `403` insufficient role |

##### `updateAirport`

| Field | Value |
|-------|-------|
| **Type** | Mutation |
| **Authentication** | Required |
| **Roles** | `SUPER_ADMIN` |
| **Arguments** | `id: ID!`, `input: UpdateAirportInput` — optional `name`, `code`, `city`, `country` |
| **Returns** | `Airport` |
| **Errors** | `404`, `409` duplicate code |

##### `deleteAirport`

| Field | Value |
|-------|-------|
| **Type** | Mutation |
| **Authentication** | Required |
| **Roles** | `SUPER_ADMIN` |
| **Arguments** | `id: ID!` |
| **Returns** | `Boolean` |
| **Errors** | `404` |

---

### Passenger Module

#### Queries

##### `passengers`

| Field | Value |
|-------|-------|
| **Type** | Query |
| **Authentication** | Required |
| **Roles** | `SUPER_ADMIN` |
| **Arguments** | `query: PassengerQueryInput` — `page`, `limit` |
| **Returns** | `PassengerResponse` |

##### `passenger`

| Field | Value |
|-------|-------|
| **Type** | Query |
| **Authentication** | Required |
| **Roles** | `SUPER_ADMIN` (any), `PASSENGER` (own only) |
| **Arguments** | `id: ID!` |
| **Returns** | `Passenger` |
| **Errors** | `403`, `404` |

#### Mutations

##### `updatePassenger`

| Field | Value |
|-------|-------|
| **Type** | Mutation |
| **Authentication** | Required |
| **Roles** | `SUPER_ADMIN` |
| **Arguments** | `id: ID!`, `input: UpdatePassengerInput` — optional `name`, `passportNumber`, `nationality` |
| **Returns** | `Passenger` |
| **Errors** | `409` duplicate passport |

##### `updateMyPassengerProfile`

| Field | Value |
|-------|-------|
| **Type** | Mutation |
| **Authentication** | Required |
| **Roles** | `PASSENGER` |
| **Arguments** | `input: UpdateMyPassengerProfileInput` |
| **Returns** | `Passenger` |

##### `deletePassenger`

| Field | Value |
|-------|-------|
| **Type** | Mutation |
| **Authentication** | Required |
| **Roles** | `SUPER_ADMIN` |
| **Arguments** | `id: ID!` |
| **Returns** | `Boolean` |

---

### Staff Module

#### Queries

##### `staffs`

| Field | Value |
|-------|-------|
| **Type** | Query |
| **Authentication** | Required |
| **Roles** | `SUPER_ADMIN`, `AIRPORT_ADMIN` |
| **Arguments** | `input: StaffQueryInput` — `page`, `limit` |
| **Returns** | `StaffResponse` |
| **Business rules** | `AIRPORT_ADMIN` sees only their airport's staff |

##### `staff`

| Field | Value |
|-------|-------|
| **Type** | Query |
| **Authentication** | Required |
| **Roles** | `SUPER_ADMIN`, `AIRPORT_ADMIN` (own airport), `STAFF` (self) |
| **Arguments** | `id: ID!` |
| **Returns** | `Staff` |

#### Mutations

##### `createStaff`

| Field | Value |
|-------|-------|
| **Type** | Mutation |
| **Authentication** | Required |
| **Roles** | `SUPER_ADMIN`, `AIRPORT_ADMIN` |
| **Arguments** | `input: CreateStaffInput!` — `email`, `password`, `airportId?`, `role` (`PILOT`, `CREW`, `GROUND_STAFF`, `SECURITY`) |
| **Returns** | `Staff` |
| **Errors** | `409` duplicate email, `400` missing airportId for SUPER_ADMIN |

##### `updateStaff`

| Field | Value |
|-------|-------|
| **Type** | Mutation |
| **Authentication** | Required |
| **Roles** | `SUPER_ADMIN`, `AIRPORT_ADMIN` (own airport) |
| **Arguments** | `id: ID!`, `input: UpdateStaffInput` — optional `role` |
| **Returns** | `Staff` |

##### `deleteStaff`

| Field | Value |
|-------|-------|
| **Type** | Mutation |
| **Authentication** | Required |
| **Roles** | `SUPER_ADMIN`, `AIRPORT_ADMIN` (own airport) |
| **Arguments** | `id: ID!` |
| **Returns** | `Boolean` |

##### `assignStaffToFlight`

| Field | Value |
|-------|-------|
| **Type** | Mutation |
| **Authentication** | Required |
| **Roles** | `SUPER_ADMIN`, `AIRPORT_ADMIN` (own airport) |
| **Arguments** | `staffId: ID!`, `flightId: ID!` |
| **Returns** | `Staff` (with updated `assignedFlightId`) |
| **Errors** | `403` flight doesn't involve staff's airport |

---

### Airport Admin Module

#### Queries

##### `airportAdmins`

| Field | Value |
|-------|-------|
| **Type** | Query |
| **Authentication** | Required |
| **Roles** | `SUPER_ADMIN`, `AIRPORT_ADMIN` |
| **Arguments** | `input: AirportAdminQueryInput` — `page`, `limit` |
| **Returns** | `AirportAdminResponse` |

##### `airportAdmin`

| Field | Value |
|-------|-------|
| **Type** | Query |
| **Authentication** | Required |
| **Roles** | `SUPER_ADMIN`, `AIRPORT_ADMIN` (own airport) |
| **Arguments** | `id: ID!` |
| **Returns** | `AirportAdmin` |

#### Mutations

##### `createAirportAdmin`

| Field | Value |
|-------|-------|
| **Type** | Mutation |
| **Authentication** | Required |
| **Roles** | `SUPER_ADMIN`, `AIRPORT_ADMIN` |
| **Arguments** | `input: CreateAirportAdminInput!` — `email`, `password`, `airportId?` |
| **Returns** | `AirportAdmin` |

##### `deleteAirportAdmin`

| Field | Value |
|-------|-------|
| **Type** | Mutation |
| **Authentication** | Required |
| **Roles** | `SUPER_ADMIN`, `AIRPORT_ADMIN` (own airport) |
| **Arguments** | `id: ID!` |
| **Returns** | `Boolean` |

---

### Flight Module

#### Queries

##### `flights`

| Field | Value |
|-------|-------|
| **Type** | Query |
| **Authentication** | Required |
| **Roles** | Any (`AIRPORT_ADMIN` scoped) |
| **Arguments** | `query: FlightQueryInput` — `page`, `limit`, `departureTimeFrom`, `departureTimeTo`, `destinationAirportId`, `airline` |
| **Returns** | `FlightResponse` |

##### `flight`

| Field | Value |
|-------|-------|
| **Type** | Query |
| **Authentication** | Required |
| **Roles** | Any (`AIRPORT_ADMIN` scoped) |
| **Arguments** | `id: ID!` |
| **Returns** | `Flight` |

#### Mutations

##### `createFlight`

| Field | Value |
|-------|-------|
| **Type** | Mutation |
| **Authentication** | Required |
| **Roles** | `SUPER_ADMIN`, `AIRPORT_ADMIN` |
| **Arguments** | `input: CreateFlightInput!` |
| **Returns** | `Flight` |
| **Errors** | `409` duplicate flight number, validation errors |

##### `updateFlight`

| Field | Value |
|-------|-------|
| **Type** | Mutation |
| **Authentication** | Required |
| **Roles** | `SUPER_ADMIN`, `AIRPORT_ADMIN` |
| **Arguments** | `id: ID!`, `input: UpdateFlightInput` |
| **Returns** | `Flight` |
| **Side effects** | Publishes `FLIGHT_STATUS_UPDATED` if status changed |

##### `deleteFlight`

| Field | Value |
|-------|-------|
| **Type** | Mutation |
| **Authentication** | Required |
| **Roles** | `SUPER_ADMIN`, `AIRPORT_ADMIN` |
| **Arguments** | `id: ID!` |
| **Returns** | `Boolean` |

#### Subscriptions

##### `FLIGHT_STATUS_UPDATED`

| Field | Value |
|-------|-------|
| **Type** | Subscription |
| **Authentication** | Required (WebSocket Bearer token or SSE cookie) |
| **Arguments** | `flightId: ID!` |
| **Returns** | `Flight` |
| **Business rules** | Filtered server-side to matching `flightId`; emitted on flight status update |

---

### Booking Module

#### Queries

##### `bookings`

| Field | Value |
|-------|-------|
| **Type** | Query |
| **Authentication** | Required |
| **Roles** | `PASSENGER` |
| **Arguments** | `query: BookingQueryInput` — `page`, `limit` |
| **Returns** | `BookingResponse` |

##### `booking`

| Field | Value |
|-------|-------|
| **Type** | Query |
| **Authentication** | Required |
| **Roles** | `PASSENGER` (own bookings only) |
| **Arguments** | `id: ID!` |
| **Returns** | `Booking` (includes resolved `flight` field) |
| **Errors** | `403` not own booking, `404` |

#### Mutations

##### `createBooking`

| Field | Value |
|-------|-------|
| **Type** | Mutation |
| **Authentication** | Required |
| **Roles** | `PASSENGER` |
| **Arguments** | `input: CreateBookingInput!` — `flightId`, `seatNumber` |
| **Returns** | `Booking` |
| **Side effects** | Queues booking confirmation email |
| **Errors** | `400` invalid seat/canceled flight, `409` seat taken, `404` flight not found |

##### `cancelBooking`

| Field | Value |
|-------|-------|
| **Type** | Mutation |
| **Authentication** | Required |
| **Roles** | `PASSENGER` |
| **Arguments** | `id: ID!` |
| **Returns** | `Booking` (status `CANCELED`) |
| **Errors** | `400` already canceled, `403` not own booking |

---

### Notification Module

#### Queries

##### `getNotifications`

| Field | Value |
|-------|-------|
| **Type** | Query |
| **Authentication** | Required |
| **Roles** | Any (own notifications) |
| **Arguments** | `input: QueryInput!` — `page`, `limit`, `is_read` |
| **Returns** | `NotificationResponse` |

#### Mutations

##### `markAsRead`

| Field | Value |
|-------|-------|
| **Type** | Mutation |
| **Authentication** | Required |
| **Roles** | Any (own notifications) |
| **Arguments** | `id: String!` |
| **Returns** | `Notification` |
| **Errors** | `404 Notification not found` |

#### Subscriptions

##### `notificationCreated`

| Field | Value |
|-------|-------|
| **Type** | Subscription |
| **Authentication** | Required (WebSocket/SSE) |
| **Arguments** | None |
| **Returns** | `Notification` |
| **Note** | Pub/sub infrastructure exists; current email-only flows do not publish to this subscription |

---

## GraphQL Examples

> Include credentials/cookies in HTTP requests. Examples assume Apollo Sandbox or a client with cookie support.

### Registration and email verification

```graphql
mutation Register {
  register(input: {
    email: "passenger@example.com"
    password: "secret12"
    name: "Jane Doe"
    passportNumber: "AB1234567"
    nationality: "US"
  }) {
    id
    email
    role
    emailVerified
  }
}
```

```graphql
mutation VerifyEmail {
  verifyEmail(email: "passenger@example.com", otp: "123456")
}
```

### Login and profile

```graphql
mutation Login {
  login(input: {
    email: "passenger@example.com"
    password: "secret12"
  }) {
    id
    email
    role
    emailVerified
  }
}
```

```graphql
query Profile {
  profile {
    id
    email
    role
    emailVerified
  }
}
```

```graphql
mutation Refresh {
  refreshToken {
    id
    email
  }
}
```

### Search flights and book a seat

```graphql
query Flights {
  flights(query: {
    page: 1
    limit: 10
    airline: "Example Air"
    departureTimeFrom: "2026-01-01T00:00:00Z"
  }) {
    flights {
      id
      flightNumber
      airline
      availableSeats
      status
      departureTime
      arrivalTime
    }
    meta {
      page
      totalCount
    }
  }
}
```

```graphql
mutation CreateBooking {
  createBooking(input: {
    flightId: "550e8400-e29b-41d4-a716-446655440000"
    seatNumber: 12
  }) {
    id
    seatNumber
    status
    flight {
      flightNumber
      airline
    }
  }
}
```

### Admin: create airport and flight

```graphql
mutation CreateAirport {
  createAirport(input: {
    name: "International Airport"
    code: "INT"
    city: "Metropolis"
    country: "US"
  }) {
    id
    code
  }
}
```

```graphql
mutation CreateFlight {
  createFlight(input: {
    flightNumber: "EA101"
    departureAirportId: "550e8400-e29b-41d4-a716-446655440001"
    destinationAirportId: "550e8400-e29b-41d4-a716-446655440002"
    departureTime: "2026-06-01T08:00:00Z"
    arrivalTime: "2026-06-01T12:00:00Z"
    airline: "Example Air"
    availableSeats: 150
    status: ON_TIME
  }) {
    id
    flightNumber
    status
  }
}
```

### Notifications

```graphql
query Notifications {
  getNotifications(input: { page: 1, limit: 10, is_read: false }) {
    notifications {
      id
      type
      message
      isRead
      createdAt
    }
    meta {
      totalCount
    }
  }
}
```

```graphql
mutation MarkRead {
  markAsRead(id: "notification-uuid-here") {
    id
    isRead
    readAt
  }
}
```

### Subscriptions

**WebSocket (`graphql-ws`)** — connect with `connectionParams: { authorization: "Bearer <accessToken>" }`:

```graphql
subscription OnNotification {
  notificationCreated {
    id
    type
    message
    createdAt
  }
}
```

```graphql
subscription OnFlightStatus($flightId: ID!) {
  FLIGHT_STATUS_UPDATED(flightId: $flightId) {
    id
    flightNumber
    status
  }
}
```

**SSE** — connect to `GET/POST http://localhost:3000/graphql/sse` with `accessToken` cookie set.

---

## Authentication & Authorization

### Overview

Authentication uses **JWT access tokens** and **JWT refresh tokens** stored as **HttpOnly cookies** (`accessToken`, `refreshToken`). The access token is validated by `AuthGuard` on protected GraphQL operations. Role checks use `@Roles()` + `RolesGuard`.

There is **no Bearer token header** flow for standard HTTP GraphQL requests—clients must send cookies with `credentials: true`.

### Registration

1. Validate unique email and passport number.
2. Hash password with bcrypt (12 rounds).
3. Transaction: create `User` (`PASSENGER`, `emailVerified: false`) + `Passenger`.
4. Generate 6-digit OTP (`crypto.randomInt`), hash with bcrypt, store in Redis (`auth:email-otp:{email}`, TTL 600s).
5. Queue OTP confirmation email via notification service.

### Login

```
Login
  ↓
Validate email exists + bcrypt password compare
  ↓
Check emailVerified === true
  ↓
Generate Access Token (JWT, ACCESS_TOKEN_SECRET, ACCESS_TOKEN_EXPIRES_IN)
  ↓
Generate Refresh Token (JWT, REFRESH_TOKEN_SECRET, REFRESH_TOKEN_EXPIRES_IN)
  ↓
Hash Refresh Token (bcrypt, 10 rounds)
  ↓
Store hash in refresh_tokens table (expiresAt = now + 7 days)
  ↓
Set HttpOnly cookies (access: 15 min maxAge, refresh: 7 days)
  ↓
Return UserProfile
```

### JWT payload

```typescript
{ id: string; role: string }
```

Roles: `SUPER_ADMIN`, `AIRPORT_ADMIN`, `STAFF`, `PASSENGER`.

### Refresh token flow

```
refreshToken mutation
  ↓
Read refreshToken cookie
  ↓
Verify JWT signature (REFRESH_TOKEN_SECRET)
  ↓
Find active (non-revoked) token hashes for user
  ↓
bcrypt.compare incoming token against each hash
  ↓
If no match → revoke ALL tokens for user → 401 (reuse detection)
  ↓
Revoke matched token (isRevoked = true)
  ↓
Issue new access + refresh tokens
  ↓
Store new refresh hash
  ↓
Update cookies
```

### Token revocation / logout

- **Refresh token rotation** revokes the previous token on each refresh.
- **Reuse detection** revokes all sessions for the user.
- **Explicit logout** is not exposed via GraphQL. `TokenService.clearAuthCookies()` exists but is unused.

### Guards

| Guard | Purpose |
|-------|---------|
| `AuthGuard` | Validates `accessToken` cookie; sets `request.userId` and `request.userRole` |
| `RolesGuard` | Checks `@Roles(...)` against `request.userRole` |
| `SubscriptionAuthGuard` | Requires `context.user` (set by WebSocket `onConnect` or SSE context) |
| `GqlThrottlerGuard` | Global rate limiter (3000 req/min per throttler config); skips subscriptions |
| `WsAuthGuard` | Defined but **not used** by any resolver |

### How the current user is resolved

- HTTP: `@CurrentUser()` reads `request.userId` set by `AuthGuard`.
- Subscriptions (WebSocket): `app.module.ts` `onConnect` verifies Bearer token and returns `{ user: payload }`; `SubscriptionAuthGuard` checks `context.user`.
- Subscriptions (SSE): `/graphql/sse` handler reads `accessToken` from cookies and sets `{ user: payload }`.

---

## Database

### Technology

- **PostgreSQL** with **TypeORM**
- `synchronize: false` — schema managed by migrations only
- Connection pool configured via optional env vars (defaults: max 20, min 5)

### Entities and relationships

| Entity | Table | Key relationships / constraints |
|--------|-------|--------------------------------|
| `User` | `users` | Unique `email`; enum `role` |
| `Passenger` | `passengers` | One-to-one with `User` (unique `user_id`); unique `passport_number` |
| `Airport` | `airports` | Unique `code` |
| `AirportAdmin` | `airport_admins` | One-to-one with `User`; many-to-one with `Airport` |
| `Staff` | `staff` | One-to-one with `User`; many-to-one with `Airport`; optional `assigned_flight_id` |
| `Flight` | `flights` | Unique `flight_number`; FK to airports (departure, destination) |
| `Booking` | `bookings` | FK to `passengers`, `flights`; enum `status` (`CONFIRMED`, `CANCELED`) |
| `RefreshToken` | `refresh_tokens` | Stores bcrypt hash of refresh token per user |
| `Notification` | `notifications` | Stores in-app notification records |

### Migrations

Located in `src/database/migrations/`:

1. `1789330112730` — users, airports, notifications, refresh_tokens
2. `1789393828097` — airport_admins, staff
3. `1789402839701` — passengers
4. `1789398496323` — flights
5. `1789410561603` — bookings

### Transactions

Used for:
- Registration (user + passenger)
- Staff/airport admin creation (user + role record)
- Passenger/staff/airport admin deletion (role record + user)
- **Booking creation** (pessimistic lock on flight + seat check + insert)

### Important note on booking uniqueness

There is **no database unique constraint** on `(flight_id, seat_number)` in the booking migration. Seat uniqueness is enforced at the application level inside a transaction with pessimistic write lock on the flight row. The service also handles PostgreSQL error code `23505` if a unique constraint were added later.

---

## Workers & Background Jobs

### Architecture

```
API (NotificationService → EmailChannel)
        ↓
MailQueueService.addDataToQueue()
        ↓
Redis — BullMQ queue `emails`
        ↓
Worker (WorkerModule → MailProcessor)
        ↓
EmailService → Resend API
```

### Queue: `emails`

| Job name | Triggered by | Processor action |
|----------|--------------|------------------|
| `otp-confirmation` | Registration OTP email | `sendOTPConfirmationEmail` |
| `welcome` | — (not triggered in current flows) | `sendWelcomeEmail` |
| `booking-confirmation` | Successful booking | `sendBookingConfirmationEmail` |
| `reset-password` | — (not triggered; no processor case) | — |

### Job options

- **Attempts:** 3
- **Backoff:** exponential, 1000ms base delay
- **removeOnComplete:** true
- **removeOnFail:** false
- **Concurrency:** 5 (MailProcessor)
- **Optional delay:** supported via `addDataToQueue(jobName, data, delayMs)`

### Running the worker

The API and worker are **separate processes**. The worker bootstraps `WorkerModule` as a NestJS application context (no HTTP server).

```bash
# Terminal 1 — API
npm run start:dev

# Terminal 2 — Worker
npm run worker:dev
```

There is no dedicated production worker script in `package.json` (only `worker:dev`).

---

## Email System

### Provider

**[Resend](https://resend.com)** — SDK: `resend` npm package.

### Configuration

- `RESEND_API_KEY` environment variable
- From address hardcoded: `Dababat <no-reply@dababat.com>`

### Templates

| Template class | Used for |
|----------------|----------|
| `OtpConfirmationTemplate` | Email verification OTP |
| `BookingConfirmationTemplate` | Booking confirmation |
| `WelcomeTemplate` | Welcome email (job exists, not triggered) |
| `ResetPasswordTemplate` | Password reset (service method exists, not wired) |

### Delivery model

Emails are **never sent synchronously from the API**. Flow:

1. Business logic calls `NotificationService.send()` with `channels: [EMAIL]`.
2. `EmailChannel` enqueues a BullMQ job.
3. Worker `MailProcessor` calls `EmailService` → Resend.

### Retry behavior

BullMQ retries failed jobs up to 3 times with exponential backoff. Email send errors inside `EmailService.sendEmail` are logged but not re-thrown (job may still complete successfully).

---

## Security & Cryptography

| Library | Usage | Location |
|---------|-------|----------|
| **bcrypt** | Password hashing (12 rounds on register/create staff/admin) | `auth.service.ts`, `staff.service.ts`, `airport-admin.service.ts` |
| **bcrypt** | Refresh token hash storage (10 rounds) | `auth.service.ts` |
| **bcrypt** | OTP hash in Redis (10 rounds) | `auth.service.ts` |
| **@nestjs/jwt** / **jsonwebtoken** | Access & refresh JWT sign/verify | `token.service.ts`, guards |
| **crypto** (`randomInt`) | Secure OTP generation | `utils/generate-otp.util.ts` |
| **crypto** (`randomUUID`) | Request ID generation | `main.ts` |

### Cookie security

Both tokens use HttpOnly, Secure, SameSite=None cookies (designed for cross-origin clients with credentials).

### Other security measures

- **Helmet** — CSP configured for Apollo Sandbox
- **graphql-depth-limit** — max depth 10
- **graphql-query-complexity** — max complexity 200
- **Throttling** — 3000 requests per 60 seconds (Redis storage)
- **Validation** — global `GraphQLValidationPipe` (whitelist, forbidNonWhitelisted)

---

## Redis

### Uses

| Use case | Implementation |
|----------|----------------|
| Email OTP storage | `RedisService.set/del` — key `auth:email-otp:{email}` |
| Rate limiting | `@nest-lab/throttler-storage-redis` |
| BullMQ job queue | `@nestjs/bullmq` connection |
| GraphQL subscriptions pub/sub | `graphql-redis-subscriptions` (`pubSub` in `notification/pubsub.ts`) |
| Tag-based cache helpers | `RedisService.setCacheWithTag/deleteCacheWithTag` (available, not used by business flows) |

### Configuration

| Environment | Host | Port | Password |
|-------------|------|------|----------|
| Non-production | `REDIS_HOST` | `REDIS_PORT` | `REDIS_PASSWORD` |
| Production (`NODE_ENV=prod`) | `redis` (hardcoded) | `6379` | none |

### Running Redis locally

```bash
# Example with Docker
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

Set `REDIS_HOST=localhost`, `REDIS_PORT=6379` in `.env`.

---

## Architecture

### Layer responsibilities

| Layer | Responsibility |
|-------|----------------|
| **Resolver** | GraphQL entry point; applies guards/decorators; delegates to service |
| **Service** | Business logic, authorization checks, transactions |
| **Repository** | TypeORM data access, pagination |
| **Entity** | TypeORM database model |
| **ObjectType / Input** | GraphQL schema types and validated inputs |
| **Mapper** | AutoMapper entity ↔ GraphQL type conversion |
| **Guard** | Authentication and authorization |
| **Worker / Processor** | Async job consumption |
| **Channel** | Notification delivery abstraction (database, email, pub/sub) |

### ASCII diagram

```
Client
  │
  ▼
GraphQL API (Fastify :3000)
  │
  ├── GqlThrottlerGuard (global)
  ├── AuthGuard / RolesGuard (per operation)
  │
  ▼
Resolvers
  │
  ▼
Services
  │
  ├────────────────────┬──────────────────┐
  ▼                    ▼                  ▼
Repositories        RedisService      NotificationService
  │                                      │
  ▼                                      ▼
PostgreSQL                          EmailChannel → BullMQ
                                           │
                                           ▼
                                      Redis Queue
                                           │
                                           ▼
                                      Worker → Resend

Subscriptions: Redis Pub/Sub ← FlightService / GraphQLPubSubChannel
```

### Architectural decisions

- **Cookie-based auth** rather than Authorization headers for HTTP GraphQL simplifies browser client integration but requires CORS credentials.
- **Separate worker process** keeps email delivery off the request path and allows independent scaling/retry.
- **Entity/ObjectType separation** with AutoMapper keeps persistence models decoupled from the GraphQL schema.
- **Airport-admin scoping** is enforced in services (not just resolvers) for flights, staff, and airport admins.

---

## Project Structure

```
src/
├── main.ts                    # API bootstrap (Fastify, GraphQL, SSE endpoint)
├── app.module.ts              # Root module
├── auth/                      # Authentication & refresh tokens
├── users/                     # User entity & repository (internal)
├── passengers/                # Passenger profiles
├── airports/                  # Airport management
├── airport-admins/            # Airport administrator accounts
├── staff/                     # Staff management & flight assignment
├── flights/                   # Flight CRUD & status subscriptions
├── bookings/                  # Seat booking & cancellation
├── notification/              # Notifications, channels, pub/sub, resolver
├── email/                     # Resend service & mail queue producer
├── redis/                     # Redis client wrapper
├── workers/
│   ├── worker-main.ts         # Worker entry point
│   ├── worker.module.ts       # Worker NestJS module
│   └── processors/email/      # BullMQ mail processor
├── database/
│   ├── database.config.ts
│   ├── data-source.ts         # TypeORM CLI data source
│   └── migrations/
├── graphql/
│   ├── schema.gql             # Auto-generated schema (do not edit manually)
│   └── graphql-context.ts
├── common/
│   ├── guards/
│   ├── decorators/
│   ├── pipes/
│   ├── plugins/
│   ├── filters/
│   └── utils/
└── utils/
test/
├── app.e2e-spec.ts
└── jest-e2e.json
```

---

## Technologies

### Core Technologies

| Technology | Purpose |
|------------|---------|
| NestJS 11 | Backend framework |
| TypeScript | Language |
| Fastify | HTTP adapter |
| Apollo Server 5 + @nestjs/graphql | GraphQL API |
| PostgreSQL | Primary database |
| TypeORM | ORM & migrations |
| Redis (ioredis) | OTP, throttling, queues, pub/sub |
| BullMQ (@nestjs/bullmq) | Background job queue |
| JWT (@nestjs/jwt) | Access & refresh tokens |
| bcrypt | Password & token hashing |
| Resend | Transactional email |
| AutoMapper (@automapper/nestjs) | Entity ↔ GraphQL mapping |
| class-validator / class-transformer | Input validation |
| Winston (nest-winston) | Logging |

### Important Libraries

| Library | Purpose |
|---------|---------|
| graphql-redis-subscriptions | Subscription pub/sub backend |
| graphql-sse | SSE subscription endpoint |
| graphql-depth-limit | Query depth protection |
| graphql-query-complexity | Query cost limiting |
| @nestjs/throttler + throttler-storage-redis | Rate limiting |
| @fastify/cookie, helmet, compress | HTTP middleware |
| dataloader | Available in context types (infrastructure) |

---

## Environment Variables

Copy `.env.example` to `.env` and fill in values.

### Application

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NODE_ENV` | Yes | Environment mode; `prod` changes Redis host behavior | `dev` |

### Database

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DB_HOST` | Yes | PostgreSQL host | `localhost` |
| `DB_PORT` | Yes | PostgreSQL port | `5432` |
| `DB_USERNAME` | Yes | Database user | `postgres` |
| `DB_PASSWORD` | Yes | Database password | `your_password` |
| `DB_NAME` | Yes | Database name | `airport_management` |

**Optional pool settings** (used in `database.config.ts`, not in `.env.example`):

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_POOL_MAX` | `20` | Max pool connections |
| `DB_POOL_MIN` | `5` | Min pool connections |
| `DB_POOL_IDLE_TIMEOUT` | `30000` | Idle timeout (ms) |
| `DB_POOL_CONNECTION_TIMEOUT` | `5000` | Connection timeout (ms) |

### JWT

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `ACCESS_TOKEN_SECRET` | Yes | Access JWT signing secret | `your_access_secret` |
| `REFRESH_TOKEN_SECRET` | Yes | Refresh JWT signing secret | `your_refresh_secret` |
| `ACCESS_TOKEN_EXPIRES_IN` | Yes | Access token TTL (ms format) | `15m` |
| `REFRESH_TOKEN_EXPIRES_IN` | Yes | Refresh token TTL | `7d` |

### Redis

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `REDIS_HOST` | Yes (non-prod) | Redis host | `localhost` |
| `REDIS_PORT` | Yes (non-prod) | Redis port | `6379` |
| `REDIS_PASSWORD` | Optional | Redis password | `your_redis_password` |

### Email

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `RESEND_API_KEY` | Yes | Resend API key | `re_xxxxxxxx` |

### Example `.env`

```env
NODE_ENV=dev
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=airport_management
ACCESS_TOKEN_SECRET=your_access_secret
REFRESH_TOKEN_SECRET=your_refresh_secret
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
RESEND_API_KEY=re_your_api_key
```

---

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd airport-management
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment**

   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

4. **Start PostgreSQL** — ensure the database in `DB_NAME` exists.

5. **Start Redis**

   ```bash
   docker run -d --name redis -p 6379:6379 redis:7-alpine
   ```

6. **Run migrations**

   ```bash
   npm run migration:run
   ```

7. **Seed a SUPER_ADMIN** (manual — no API exists)

   Insert a user directly into PostgreSQL with role `SUPER_ADMIN`, bcrypt-hashed password, and `email_verified = true`.

8. **Start the API**

   ```bash
   npm run start:dev
   ```

9. **Start the worker** (required for emails)

   ```bash
   npm run worker:dev
   ```

---

## Running the Application

### API

| Command | Description |
|---------|-------------|
| `npm run start` | Start API |
| `npm run start:dev` | Start API with watch mode |
| `npm run start:debug` | Start API with debugger |
| `npm run start:prod` | Run compiled API (`node dist/main`) |

API listens on **port 3000** (`0.0.0.0`).

GraphQL Playground is disabled; Apollo Sandbox landing page is enabled.

### Worker

| Command | Description |
|---------|-------------|
| `npm run worker:dev` | Start worker with watch mode |

The worker must run alongside the API for email delivery.

### Production

- API: `npm run build && npm run start:prod`
- Worker: build then run with Nest entry file — **no dedicated production script is defined**. You would need to run the compiled worker entry manually, e.g.:

  ```bash
  node dist/workers/worker-main.js
  ```

  (after `npm run build`)

- When `NODE_ENV=prod`, Redis connects to host `redis:6379` without password.

---

## Database Migrations

| Command | Description |
|---------|-------------|
| `npm run migration:run` | Apply pending migrations |
| `npm run migration:revert` | Revert last migration |
| `npm run migration:show` | Show migration status |
| `npm run migration:generate -- src/database/migrations/MigrationName` | Generate migration from entity changes |

Migrations use the data source at `src/database/data-source.ts`.

---

## Testing

| Command | Description |
|---------|-------------|
| `npm test` | Unit tests (Jest, `*.spec.ts` in `src/`) |
| `npm run test:watch` | Watch mode |
| `npm run test:cov` | Coverage report → `coverage/` |
| `npm run test:e2e` | E2E tests (`test/jest-e2e.json`) |

**Current state:**
- No unit test files (`*.spec.ts`) exist in `src/`.
- E2E test (`test/app.e2e-spec.ts`) expects `GET /` to return `Hello World!`, which does not match the current application (GraphQL-only API). The E2E test is **outdated**.

---

## Error Handling

### GraphQL errors

`app.module.ts` configures `formatError` to:
- Flatten NestJS `HttpException` validation message arrays into a single string
- Return `{ message, path, extensions: { code } }`

Common HTTP exception mappings:

| Exception | Typical cause |
|-----------|---------------|
| `UnauthorizedException` (401) | Missing/invalid token, unverified email |
| `ForbiddenException` (403) | Role or ownership check failed |
| `NotFoundException` (404) | Resource not found |
| `BadRequestException` (400) | Business rule or OTP validation failure |
| `ConflictException` (409) | Duplicate email, passport, flight number, seat |
| Validation errors | class-validator failures via `GraphQLValidationPipe` |

### Non-GraphQL errors

`AllExceptionsFilter` exists for HTTP exception formatting but is **not registered globally** in `main.ts`.

### Email/notification errors

Email and notification channel failures in registration/booking are **logged and swallowed** so the primary operation still succeeds.

---

## Important Business Flows

### Registration

```
Client → register mutation
  ↓
AuthService.register
  ↓
Check email + passport uniqueness
  ↓
Transaction: Create User + Passenger
  ↓
Generate OTP → hash → Redis (10 min)
  ↓
NotificationService.send (EMAIL channel)
  ↓
EmailChannel → BullMQ job
  ↓
Return UserProfile (emailVerified: false)
```

### Login

```
Client → login mutation
  ↓
Validate credentials + emailVerified
  ↓
Generate access + refresh JWTs
  ↓
Hash refresh token → save to DB
  ↓
Set cookies → return UserProfile
```

### Booking

```
Client → createBooking mutation
  ↓
Resolve passenger from userId
  ↓
Pre-validate flight exists + not canceled + seat in range
  ↓
Transaction:
  ├── Pessimistic write lock on Flight row
  ├── Re-validate flight status + seat
  ├── Check no CONFIRMED booking for seat
  └── Insert Booking (CONFIRMED)
  ↓
Queue booking confirmation email
  ↓
Return Booking
```

### Background email job

```
API → NotificationService.send
  ↓
EmailChannel → MailQueueService.addDataToQueue
  ↓
Redis (BullMQ queue: emails)
  ↓
Worker MailProcessor.process
  ↓
EmailService → Resend API
```

### Flight status subscription

```
Client subscribes to FLIGHT_STATUS_UPDATED(flightId)
  ↓
Admin updates flight status via updateFlight
  ↓
FlightService publishes to Redis pub/sub
  ↓
Subscriber receives filtered Flight payload
```

---

## Concurrency & Transaction Safety

### Booking creation

**Problem:** Two passengers booking the same seat concurrently could both succeed without coordination.

**Solution:**
1. `dataSource.manager.transaction` wraps the entire booking.
2. `pessimistic_write` lock on the `Flight` row serializes concurrent bookings for that flight.
3. Application check: `existsConfirmedBookingForSeat` counts confirmed bookings for the seat.
4. Fallback: catches PostgreSQL unique violation (`23505`) if a DB constraint exists.

**Why pessimistic locking on Flight:** Locking the parent flight row provides a simple serialization point without requiring a separate seat inventory table.

### Other transactional operations

| Operation | Why |
|-----------|-----|
| Registration | User + passenger must both succeed or neither |
| Staff/admin creation | User account + role record atomicity |
| Deletions | Role record + user removed together |

### Rollback

TypeORM transactions automatically roll back on thrown exceptions inside the transaction callback.

### Limitations

- No DB unique constraint on `(flight_id, seat_number)` — race protection relies on pessimistic locking + app check.
- Canceled bookings do not delete the row; a canceled seat cannot be re-booked if the old record remains (no filter excluding canceled in uniqueness check for re-booking same seat number — actually the check is only for CONFIRMED status, so re-booking after cancel should work).

---

## API Authentication Flow

### HTTP GraphQL

```
login mutation
  ↓
Access + Refresh tokens issued
  ↓
Stored as HttpOnly cookies
  ↓
Subsequent requests include cookies (credentials: true)
  ↓
AuthGuard reads accessToken cookie
  ↓
JWT verify (ACCESS_TOKEN_SECRET)
  ↓
request.userId + request.userRole set
  ↓
RolesGuard checks @Roles (if present)
  ↓
Resolver → Service
```

### Token refresh

```
Access token expires
  ↓
refreshToken mutation (refreshToken cookie)
  ↓
Verify refresh JWT + match bcrypt hash in DB
  ↓
Revoke old token, issue new pair
  ↓
Update cookies
```

### Subscriptions

```
WebSocket connect with Bearer accessToken
  OR
SSE connect to /graphql/sse with accessToken cookie
  ↓
JWT verified → context.user set
  ↓
SubscriptionAuthGuard
  ↓
Subscription resolver
```

---

## Development Notes

- **Schema file:** `src/graphql/schema.gql` is auto-generated. Edit resolvers/inputs/types, not the schema file directly.
- **Entity vs ObjectType:** Database entities live in `entities/`; GraphQL types in `graphql/types/`. AutoMapper profiles are in `*.mapper.ts` files.
- **Role enforcement:** Always enforced in services as well as resolver guards for defense in depth.
- **Cookies + CORS:** Allowed origins include `localhost:5173`, `localhost:3000`, and Apollo Sandbox URLs. Clients must use `credentials: 'include'`.
- **Worker dependency:** Email sending requires both Redis and the worker process running.
- **SUPER_ADMIN bootstrap:** No GraphQL mutation creates super admins; seed directly in the database.
- **Production Redis:** Hardcoded to `redis:6379` when `NODE_ENV=prod`.
- **Unused code:** `WsAuthGuard`, `SocketChannel`, `AllExceptionsFilter` (not globally registered), `TokenService.clearAuthCookies` (no logout mutation).

---

## Known Limitations

| Limitation | Details |
|------------|---------|
| No logout mutation | `clearAuthCookies` exists but is not exposed |
| No SUPER_ADMIN creation API | Must be seeded manually in PostgreSQL |
| No password reset API | `ResetPasswordTemplate`, `EmailJobs.RESET_PASSWORD`, and `sendResetPasswordEmail` exist but no auth flow or processor case |
| Welcome email not triggered | Job and template exist; registration does not send it |
| FLIGHT_DELAY notifications | Enum value exists; no code triggers it |
| SOCKET / SMS channels | Enum values only; `SocketChannel` is fully commented out |
| DATABASE / GRAPHQL_PUBSUB channels | Implemented but not used by registration or booking flows |
| `notificationCreated` subscription | Pub/sub works, but current flows only queue emails (no pub/sub publish on OTP/booking) |
| No booking seat DB unique constraint | Relies on pessimistic lock + application check |
| No Docker Compose in repo | PostgreSQL/Redis must be run separately |
| Outdated E2E test | Expects `GET /` Hello World; app is GraphQL-only |
| No unit tests | No `*.spec.ts` files in source |
| No production worker npm script | Only `worker:dev` defined |
| `MailProcessor` missing `reset-password` case | Job constant defined but not handled in switch |
| Email errors swallowed | Resend failures logged inside `EmailService` without re-throw |

---

## Summary (documentation audit)

| Item | Count / Status |
|------|----------------|
| README sections | 26 major sections |
| Modules documented | 14 (auth, users, passengers, airports, airport-admins, staff, flights, bookings, notification, email, redis, workers, common, database) |
| Queries documented | **14** |
| Mutations documented | **22** |
| Subscriptions documented | **2** |
| Authentication flow | Documented (cookie JWT + refresh rotation + reuse detection) |
| Worker/queue documentation | Documented (`emails` queue, `worker:dev`) |
| Technologies documented | 20+ from `package.json` usage |
| Could not confidently document | Production worker deployment (no script); SUPER_ADMIN seed SQL (no seed file in repo); exact Resend domain verification requirements |
