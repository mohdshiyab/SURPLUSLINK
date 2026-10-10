# SurplusLink (MERN Food-Rescue Platform)

SurplusLink is a full-stack MERN (MongoDB, Express.js, React, Node.js) web application connecting restaurants with community volunteers to rescue surplus food. It combines **interactive GPS map navigation**, a **strict 7-rule business engine**, **atomic concurrency locks**, and an **authoritative simulated clock** with an official mathematical accounting invariant ensuring zero food is unaccounted for.

---

## 🌐 Live Production Deployment
- **Live URL:** [https://surpluslink-la31.onrender.com/](https://surpluslink-la31.onrender.com/)
- **Local Dev:** `http://localhost:5001`

---

## 🌟 Key Features & Innovations

### 📍 1. Interactive Geolocation & Turn-by-Turn GPS Navigation
- **Restaurant Map Pinning:** When a restaurant signs up, they enter their physical street address and drop an exact marker on an interactive **Leaflet / OpenStreetMap** map or click **"Detect My GPS"** for instant browser geolocation.
- **GeoJSON Persistence:** Restaurant pickup coordinates are stored as MongoDB standard GeoJSON `Point` coordinates (`[longitude, latitude]`) with `2dsphere` spatial indexing.
- **Discovery Feed with Distance & Map:** Volunteers see the restaurant's address, estimated Haversine distance, zone badge, and a **"View Restaurant on Map"** preview on every donation card.
- **Volunteer Route Navigation:** Inside **"My Claims"**, volunteers can click **"Route Map"** to inspect the interactive pickup pin and launch **"🧭 Open Live Directions in Google Maps"** for turn-by-turn navigation directly to the kitchen entrance.

### ⏰ 2. Authoritative Simulated Clock & Rule Enforcement
- The platform uses an authoritative **simulated clock** initialized to `2026-03-10T12:00` from `seed.json`.
- **System time is never used** for business decisions, allowing deterministic evaluation of time-sensitive workflows.
- Evaluators can advance time (`+15m`, `+1h`, `+4h`, or custom) via the top navigation bar.
- Advancing past a donation's `pickup_until` deadline automatically transitions pending `ACTIVE` claims to `MISSED`.
- Real-time visual indicators clearly display pickup window states (e.g., `⏳ Opens at 18:00 (Clock is 14:00)`).

### 🛡️ 3. Multi-Rule Claim Engine (Zero Ghost Claims)
When a volunteer claims food, the server evaluates all official business rules simultaneously and returns **all violated rules** in a single refusal response:
1. **Rule 1**: Donation is open and not `CANCELLED` or `EXPIRED`.
2. **Rule 2**: Claimed kg $\le$ Volunteer's vehicle capacity.
3. **Rule 3**: Claimed kg $\le$ Donation's remaining available kg.
4. **Rule 4**: Donation zone is included in Volunteer's eligible zones.
5. **Rule 5**: Planned pickup time $T$ is between `pickup_from` and `pickup_until` (both inclusive).
6. **Rule 6**: Planned pickup time $T$ is not in the simulated past (`T >= now`).
7. **Rule 7**: Planned pickup time $T$ is at least 60 minutes away from every other active or collected claim of that volunteer (schedule conflict buffer).

### 🔒 4. Atomic Concurrency & Claim Lifecycle
- **Atomic Concurrency:** Concurrency locks guarantee that if multiple volunteers compete for the final available kilograms simultaneously, race conditions are prevented.
- **Collection Window (Rule 4):** Volunteers may mark a claim as `COLLECTED` only when the simulated clock is inside `[pickup_from, pickup_until]`.
- **Cancellation Deadline:** Volunteers can cancel only strictly before planned pickup time $T$ (`now < T`). Returned kg are immediately released back to the donation pool.
- **Community Distribution Documentation:** Once collected, volunteers record privacy-safe distribution records (meal portions, shelter area, impact notes).

### 📊 5. Operations Dashboard & Invariant Verification
Tracks all non-cancelled donations in kg:
- **Listed**: Total original quantity posted across all active donations.
- **Collected**: Total kg in `COLLECTED` claims.
- **Missed**: Total kg in `MISSED` claims.
- **Wasted**: Remaining kg on `EXPIRED` donations.
- **In progress**: Total kg in `ACTIVE` claims.
- **Still open**: Remaining kg on donations that are not `EXPIRED`.
- **Mathematical Invariant Guarantee**: Live verification badge confirms:
  $$\text{Listed} = \text{Collected} + \text{Missed} + \text{Wasted} + \text{In progress} + \text{Still open}$$

### 🏆 6. Community Heroes & Leaderboards
- **Restaurant Leaderboard:** Ranked by total verified kilograms rescued and successful donation batches.
- **Volunteer Leaderboard:** Ranked by kilograms delivered and pickups completed, highlighting reliability rates.
- **Community Heroes:** Public recognition badges (`First Rescue`, `Consistent Helper`, `100 kg Rescued`, `Reliable Pickup`, `Community Hero`) with privacy opt-in toggles.

### 🎭 7. Instant Demo Persona Switcher (No-Login Evaluation)
- Evaluators can switch identities with 1 click to any seeded restaurant (`D1`–`D5`), volunteer (`V1`–`V6`), or the NGO Coordinator (`COORD1`).
- Full email/password registration with bcrypt password hashing and JWT authentication is also fully supported.

---

## 🛠 Tech Stack

- **Frontend:** React 18, Vite, React Router v6, Lucide React Icons, Leaflet & React-Leaflet, OpenStreetMap
- **Backend:** Node.js, Express.js REST API, Mongoose ORM, JSON Web Tokens (JWT), bcryptjs
- **Database:** MongoDB Atlas with GeoJSON geospatial indexing (`2dsphere`)
- **Testing:** Jest, Supertest (comprehensive 18-rule test suite)

---

## 🚀 Local Development Setup

### 1. Clone & Navigate
```bash
git clone https://github.com/mohdshiyab/SURPLUSLINK.git
cd SURPLUSLINK
```

### 2. Configure Environment Variables
Create `server/.env` with:
```env
PORT=5001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=surpluslink_super_secret_hackathon_jwt_key_2026
NODE_ENV=development
```

### 3. Install Dependencies
```bash
# Install root, server, and client dependencies
npm install
cd server && npm install
cd ../client && npm install
cd ..
```

### 4. Build Frontend & Run
```bash
# Build React client bundle
npm run build

# Start the unified backend & frontend server
npm start
```
Open **[http://localhost:5001](http://localhost:5001)** in your browser!

*(Optional for Frontend Hot Reloading)*:
```bash
npm run client
# Starts Vite dev server with proxy to port 5001
```

---

## 🧪 Automated Test Suite

Run the automated test suite verifying all 18 rules and edge cases:
```bash
npm test
```
**Coverage Includes:**
- Fresh seed initialization & persistence across restarts
- Rejection of invalid kg inputs (zero, negative, fractional, non-numeric)
- Rejection of invalid pickup windows (`pickup_from >= pickup_until`, `pickup_until < now`)
- Multi-rule claim refusal collecting all violated rules
- Inclusive pickup boundary conditions
- 60-minute volunteer schedule conflict enforcement (Rule 7)
- Claim collection restricted to pickup window
- Claim cancellation restricted to strictly before planned time $T$
- Auto-transition of active claims to `MISSED` upon deadline expiry
- Atomic concurrency & partial vs. fully claimed status
- Donor cancellation blocking when active or collected claims exist
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
- **V1**: Rhea (Capacity: 20 kg | Zones: NORTH, EAST)
- **V2**: Kabir (Capacity: 15 kg | Zones: NORTH)
- **V3**: Meera (Capacity: 25 kg | Zones: SOUTH)
- **V4**: Imran (Capacity: 30 kg | Zones: SOUTH, WEST)
- **V5**: Divya (Capacity: 10 kg | Zones: EAST)
- **V6**: Lalit (Capacity: 18 kg | Zones: WEST, NORTH)

*Default password for registered seed accounts:* `password123`

---

## 📄 License
This project is licensed under the MIT License.
