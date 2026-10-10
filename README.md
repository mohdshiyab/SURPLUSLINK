# SurplusLink (MERN Food-Rescue Platform)

SurplusLink is a full-stack MERN (MongoDB, Express.js, React, Node.js) web application designed for a city NGO connecting restaurants with volunteers to rescue surplus food. The application enforces capacity, zone, and pickup timing rules, guarantees atomic no-overbooking claims, and reports food saved vs. wasted through an official accounting invariant.

---

## 🌟 Key Features

### 1. Authoritative Simulated Clock
- The platform uses a dedicated **simulated clock** initialized to `2026-03-10T12:00` from `seed.json`.
- **System time is never used** for any business logic.
- Time can be moved forward or kept the same from the UI, but **never backwards**.
- Advancing past a donation's `pickup_until` automatically transitions all its `ACTIVE` claims to `MISSED`.

### 2. Multi-Rule Claim Engine
When a volunteer attempts to claim food, the server evaluates all official rules simultaneously and returns **every violated rule** in a single refusal response:
1. **Rule 1**: Donation is not `CANCELLED` or `EXPIRED`.
2. **Rule 2**: Claimed kg $\le$ Volunteer's capacity.
3. **Rule 3**: Claimed kg $\le$ Donation's remaining kg.
4. **Rule 4**: Donation's donor zone is included in Volunteer's zones.
5. **Rule 5**: Planned pickup time $T$ is between `pickup_from` and `pickup_until` (both inclusive).
6. **Rule 6**: Planned pickup time $T$ is not before current simulated time.
7. **Rule 7**: Planned pickup time $T$ is at least 60 minutes away from every other `ACTIVE` or `COLLECTED` claim of that volunteer.

### 3. Claim Lifecycle & Concurrency
- **Atomic claim reservation**: Concurrency locks guarantee that if two volunteers compete for the final available kilograms at the same instant, at most one succeeds.
- **Collect**: Volunteer marks an `ACTIVE` claim as `COLLECTED` only when simulated clock is between `pickup_from` and `pickup_until` (inclusive).
- **Cancel**: Volunteer may cancel an `ACTIVE` claim only when simulated time is strictly before planned time $T$ (`now < T`). Returned kg become available again.
- **Distribution Record**: Once collected, volunteers can document post-collection distribution details (portions, general shelter/area, notes) with privacy protection.

### 4. Operations Dashboard & Invariant Verification
Tracks all non-cancelled donations in kg:
- **Listed**: Total original quantity posted across non-cancelled donations.
- **Collected**: Total kg in `COLLECTED` claims.
- **Missed**: Total kg in `MISSED` claims.
- **Wasted**: Remaining kg on `EXPIRED` donations.
- **In progress**: Total kg in `ACTIVE` claims.
- **Still open**: Remaining kg on donations that are not `EXPIRED`.
- **Invariant Guarantee**: Displays equation and **PASS/FAIL** indicator:
  $$\text{Listed} = \text{Collected} + \text{Missed} + \text{Wasted} + \text{In progress} + \text{Still open}$$

### 5. Leaderboards & Community Heroes
- **Restaurant Leaderboard**: Ranked by actual collected kg and successful donations.
- **Volunteer Leaderboard**: Ranked by collected kg and pickups, displaying missed claims and reliability rate.
- **Community Heroes**: Public opt-in cards highlighting participants with earned badges (`First Rescue`, `Consistent Helper`, `100 kg Rescued`, `Reliable Pickup`, `Community Hero`) with consent and privacy toggles.

### 6. Demo Persona Switcher (No-Login Evaluation)
- Instant 1-click persona switcher lets evaluators act as any seeded donor (`D1`–`D5`), seeded volunteer (`V1`–`V6`), or NGO Coordinator without needing to register or log in.
- Full email/password registration with bcrypt and JWT is also supported.

---

## 🛠 Prerequisites & Tech Stack

- **Node.js**: v18.0.0+ (Tested on v24.18.0)
- **MongoDB**: v6.0+ / v8.0+ (Local MongoDB or MongoDB Atlas URI)
- **Frontend**: React 18, Vite, React Router v6, Lucide Icons, Leaflet & OpenStreetMap
- **Backend**: Express.js, Mongoose, bcryptjs, jsonwebtoken, Jest, Supertest

---

## 🚀 Quick Start & Setup

### 1. Clone & Navigate
```bash
cd "Discover Dollars"
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example server/.env
```
Default values:
```env
PORT=5001
MONGODB_URI=mongodb://127.0.0.1:27017/surpluslink
JWT_SECRET=surpluslink_super_secret_hackathon_jwt_key_2026
NODE_ENV=development
```

### 3. Install Dependencies
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
cd ..
```

### 4. Build Frontend for Hosting / Production
```bash
npm run build
```
The backend automatically serves the compiled frontend from `client/dist` when accessed via `http://localhost:5001`.

### 5. Start the Application
```bash
# Start the unified backend & frontend server
npm start
```
Open **[http://localhost:5001](http://localhost:5001)** in your browser!

*(Optional for Frontend Hot Reloading)*:
```bash
npm run client
# Starts Vite dev server at http://localhost:3000 with API proxy to port 5001
```

---

## 🧪 Running Automated Tests

Run the comprehensive test suite verifying all 18 rules and edge cases:
```bash
npm test
```
**Test Coverage Includes:**
- Fresh seed initialization & persistence across restarts
- Rejection of invalid kg inputs (zero, negative, fractional, non-numeric)
- Rejection of invalid pickup windows (`pickup_from >= pickup_until`, `pickup_until < now`)
- Multi-rule claim refusal collecting all violated rules
- Inclusive pickup boundary conditions
- 60-minute volunteer schedule conflict enforcement (Rule 7)
- Claim collection only inside pickup window
- Claim cancellation only strictly before planned pickup time
- Auto-transition of active claims to `MISSED` when advancing past deadline
- Atomic concurrency & partial vs. fully claimed status
- Donor cancellation blocking if active/collected claims exist
- Mathematical invariant verification ($\text{Listed} = \text{Sum of 5}$)
- Zone eligibility enforcement over proximity

---

## 🔄 Resetting to Seed Data
To reset the database back to clean initial seed state:
```bash
npm run seed:reset
```

---

## 👥 Seed Demo Personas

### Donors (Restaurants):
- **D1**: Spice Garden (NORTH)
- **D2**: Green Bowl (NORTH)
- **D3**: Harbor Bakery (SOUTH)
- **D4**: Sunrise Canteen (EAST)
- **D5**: Tandoor Tales (WEST)

### Volunteers:
- **V1**: Rhea (Capacity 20 kg | Zones: NORTH, EAST)
- **V2**: Kabir (Capacity 15 kg | Zones: NORTH)
- **V3**: Meera (Capacity 25 kg | Zones: SOUTH)
- **V4**: Imran (Capacity 30 kg | Zones: SOUTH, WEST)
- **V5**: Divya (Capacity 10 kg | Zones: EAST)
- **V6**: Lalit (Capacity 18 kg | Zones: WEST, NORTH)

*Default password for registered seed accounts:* `password123`

---

## 🌐 Free Hosting Deployment Guide

### Deploying to Render / Railway / Cyclic:
1. Connect this GitHub repository.
2. Set Build Command:
   ```bash
   cd client && npm install && npm run build && cd ../server && npm install
   ```
3. Set Start Command:
   ```bash
   node server/src/index.js
   ```
4. Set Environment Variables:
   - `MONGODB_URI`: Your free MongoDB Atlas connection string (`mongodb+srv://...`)
   - `JWT_SECRET`: Any random secure key
   - `PORT`: Provided by host (e.g. 10000 or 5001)
   - `NODE_ENV`: `production`

---

## 📝 Assumptions & Notes
1. **Timezone Representation**: All timestamps are formatted as `YYYY-MM-DDTHH:MM` local ISO strings without timezone offsets to guarantee uniform evaluation across client and server.
2. **Demo Coordinates**: Sample coordinates are provided for D1–D5 and V1–V6 to demonstrate the interactive map and Haversine distance estimation; zone eligibility strictly governs all claim rules regardless of physical distance.
