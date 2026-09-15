# Airport Management API

A NestJS backend for managing airports, flights, staff, passengers, and seat bookings.
The system exposes a **GraphQL API** over **Fastify**, persists data in **PostgreSQL** via **TypeORM**, and uses **Redis** for OTP storage, rate limiting, pub/sub subscriptions, and background email jobs.

## Tech Stack

- **Framework**: NestJS, Fastify
- **API**: GraphQL (Apollo), AutoMapper
- **Database**: PostgreSQL, TypeORM
- **Cache/Queue**: Redis, BullMQ
- **Auth**: JWT (HttpOnly Cookies), bcrypt
- **Language**: TypeScript

---

## Getting Started

### 1. Environment Setup

Create a `.env` file based on `.env.example`:

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
SUPER_ADMIN_EMAIL=admin@airport.local
SUPER_ADMIN_PASSWORD=Admin123!
```

### 2. Infrastructure Setup

You need PostgreSQL and Redis running.

```bash
# Start Redis
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

### 3. Installation & Migrations

```bash
npm install
npm run migration:run
```

### 4. Running the Application

The system requires both the API and the background worker to be running for full functionality (especially emails).

```bash
# Terminal 1: Start the API
npm run start:dev

# Terminal 2: Start the background worker
npm run worker:dev
```

API listens on **port 3000** (`0.0.0.0/graphql`). Apollo Sandbox is enabled in development.

---

## Core Architecture

### 1. Booking DataLoader

To optimize GraphQL relationship fetching and avoid the N+1 query problem, the Booking module implements a **module-scoped DataLoader architecture**.

- **DataLoaders**: `PassengerLoader`, `FlightLoader`
- **Location**: `src/bookings/dataloaders/`
- **How it works**: Batches individual relationship requests within a single GraphQL tick into a single TypeORM `In(...)` query.
- **Caching**: Configured with `@Injectable({ scope: Scope.REQUEST })` to ensure instances are safely scoped per-request.

### 2. Booking Concurrency

While the DataLoader solves read-side N+1 problems, booking creation has strict concurrency controls to prevent double-booking of seats:

- **Transaction**: Entire booking creation is wrapped in a TypeORM transaction.
- **Pessimistic Lock**: A `pessimistic_write` lock is acquired on the `Flight` row to serialize concurrent bookings.
- **Validation**: Application checks ensure `existsConfirmedBookingForSeat` is false before insertion.

### 3. Authentication Flow

- `login` issues Access and Refresh tokens.
- Tokens are returned as `HttpOnly` cookies.
- GraphQL operations must be sent with `credentials: 'include'`.
- `AuthGuard` extracts the cookie, verifies the JWT, and enforces `@Roles`.

### 4. Background Email Jobs

Registration OTPs and Booking Confirmations are processed asynchronously:

1. `NotificationService` pushes payload to `EmailChannel`.
2. Added to BullMQ `emails` queue via Redis.
3. `MailProcessor` worker consumes job and sends via Resend API.

---

## Development Scripts

| Command                              | Description                      |
| ------------------------------------ | -------------------------------- |
| `npm run start:dev`                  | Start API in watch mode          |
| `npm run worker:dev`                 | Start email worker in watch mode |
| `npm run migration:run`              | Apply database migrations        |
| `npm run migration:generate -- path` | Generate new migration           |
| `npm run build`                      | Build for production             |
| `npm run format`                     | Run Prettier                     |
| `npm run lint`                       | Run ESLint                       |

## Important Limitations

- **Super Admin**: Created automatically when the API starts if no user exists with `SUPER_ADMIN_EMAIL`. The default development credentials are `admin@airport.local` / `Admin123!`; set both `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD` to unique, secure values before production. Existing accounts are never overwritten.
- **Docker**: Postgres/Redis `docker-compose.yml` not included; must be managed externally.
- **Testing**: End-to-end tests are currently outdated.

---

## Functional Requirements

- **Role-based Access Control**: Distinguish between `PASSENGER`, `STAFF`, `AIRPORT_ADMIN`, and `SUPER_ADMIN`.
- **Flight Management**: Admins can create and schedule flights. Staff can update flight statuses.
- **Booking & Concurrency**: Passengers can book specific seats. The system prevents concurrent double-booking of the same seat on a flight via pessimistic locking.
- **Background Notifications**: Passengers receive asynchronous email confirmations for registrations and bookings.
- **Performance**: High-throughput read APIs using DataLoaders to eliminate N+1 GraphQL query problems.
- **Real-time Updates**: Clients can subscribe to flight status changes and system notifications.

---

## API Reference

### Queries

| Query                            | Description                            | Access               |
| -------------------------------- | -------------------------------------- | -------------------- |
| `profile`                        | Get current user profile               | Authenticated        |
| `airport` / `airports`           | Get specific airport or paginated list | Any                  |
| `flight` / `flights`             | Get specific flight or paginated list  | Any                  |
| `booking` / `bookings`           | Get booking details or history         | `PASSENGER`          |
| `passenger` / `passengers`       | Get passenger profile(s)               | `PASSENGER` / Admins |
| `staff` / `staffs`               | Get staff details                      | Admins               |
| `airportAdmin` / `airportAdmins` | Get airport admin details              | `SUPER_ADMIN`        |
| `getNotifications`               | Get user notifications                 | Authenticated        |

### Mutations

| Mutation                                            | Description                               | Access          |
| --------------------------------------------------- | ----------------------------------------- | --------------- |
| `register`                                          | Register a new passenger                  | Public          |
| `login`                                             | Authenticate and receive HttpOnly cookies | Public          |
| `refreshToken`                                      | Rotate access & refresh tokens            | Public          |
| `verifyEmail`                                       | Verify email via OTP                      | Public          |
| `createBooking`                                     | Book a seat on a flight                   | `PASSENGER`     |
| `cancelBooking`                                     | Cancel an existing booking                | `PASSENGER`     |
| `updateMyPassengerProfile`                          | Update own profile                        | `PASSENGER`     |
| `createAirport` / `updateAirport` / `deleteAirport` | Manage airports                           | `SUPER_ADMIN`   |
| `createFlight` / `updateFlight` / `deleteFlight`    | Manage flights                            | `AIRPORT_ADMIN` |
| `createStaff` / `updateStaff` / `deleteStaff`       | Manage staff                              | `AIRPORT_ADMIN` |
| `assignStaffToFlight`                               | Assign a staff member to a flight         | `AIRPORT_ADMIN` |
| `updatePassenger` / `deletePassenger`               | Manage passengers                         | Admins          |
| `createAirportAdmin` / `deleteAirportAdmin`         | Manage airport admins                     | `SUPER_ADMIN`   |

### Subscriptions

| Subscription          | Description                                  | Access        |
| --------------------- | -------------------------------------------- | ------------- |
| `flightStatusUpdated` | Listen to real-time flight status changes    | Public        |
| `notificationCreated` | Receive live notifications (e.g. email sent) | Authenticated |
