# AI_USAGE.md — SurplusLink AI Usage Record

This document provides a truthful and detailed disclosure of how Artificial Intelligence assistance was utilized in building SurplusLink, what recommendations were accepted, what was modified, and what was rejected.

---

## 1. Where AI Was Used

1. **System Architecture & Data Modeling**:
   - Designing the MERN stack structure (Express + Mongoose schemas + Vite React frontend).
   - Establishing the single authoritative `SimulationClock` model and state persistence pattern across backend restarts.
   - Structuring `Donation`, `Claim`, `User`, `RestaurantProfile`, `VolunteerProfile`, and `CommunityHero` schemas.

2. **Core Rule Engine Implementation**:
   - Implementing `ruleValidationService.js` to evaluate all 7 official claim rules simultaneously.
   - Formatting exact rule violation refusal strings so evaluators receive all reasons at once.
   - Writing the simulated time difference functions (`diffMinutes`, `compareLocalTimes`) using pinned UTC timestamps to eliminate host timezone/DST shifts.

3. **Concurrency & Accounting Invariant**:
   - Formulating the atomic locking mechanism for simultaneous claim requests to prevent overbooking.
   - Implementing `dashboardService.js` to compute the 6 dashboard figures and verify $\text{Listed} = \text{Collected} + \text{Missed} + \text{Wasted} + \text{In progress} + \text{Still open}$.

4. **Automated Test Suite**:
   - Developing `server/tests/rules.test.js` covering all 18 test cases specified in the brief.

5. **Frontend UI & Map Integration**:
   - Crafting the minimalist responsive UI in React with live simulated clock control and 1-click Demo Persona switching.
   - Integrating Leaflet/OpenStreetMap with fallback for missing or denied geolocation coordinates.

---

## 2. What Was Accepted

- **Unified Error Collection Pattern**: Instead of failing fast on the first error, AI suggested collecting an array of failed rules (`ruleViolations.push(...)`) and returning a structured 422 JSON response with all errors. This was accepted as it directly matches the official requirement.
- **Clock Advance Hook for Missed Claims**: Advancing the clock immediately executes a bulk update on claims where `donation.pickup_until < newSimulatedNow` and `status == 'ACTIVE'`, setting them to `MISSED`. This was accepted.
- **Unified Full-Stack Production Serving**: The Express server is configured to statically serve the compiled React Vite app from `client/dist`. This eliminates CORS issues in production and allows single-container deployment on free cloud platforms (Render, Railway).
- **Haversine Distance as a Visual Convenience Only**: Retained strict zone validation on the server while allowing frontend distance sorting to assist volunteer discovery.

---

## 3. What Was Changed or Adapted

- **Port Configuration on Windows**: Initial port selection was `5000`. On Windows, port 5000 is frequently reserved by system services (`EACCES: permission denied`). Changed the default port to `5001` in the code, `.env`, and documentation.
- **Standalone MongoDB Concurrency**: Standard MongoDB replica set transactions (`session.startTransaction()`) fail on standalone local mongod instances. Adapted the concurrency protection to an in-memory donation-level mutex lock combined with atomic conditional writes, ensuring zero overbooking even on standalone MongoDB instances.
- **Date Comparison Strategy**: Standard `new Date(timeStr)` parses timestamps in the host machine's local time zone, causing test discrepancies across different systems. Standardized on `Date.parse(timeStr + ':00Z')` to evaluate local timestamps uniformly.

---

## 4. What Was Rejected

- **Full Mandatory Login Barrier**: An initial standard auth flow required every user to sign up or log in before performing any action. This was rejected because the hackathon document specifically requires: *"Choose which person you are acting as (donor or volunteer). There is no login... Keep a Demo Mode / Continue as Seeded Person option available so evaluators can select D1–D5 or V1–V6 without registration."* A 1-click persona switcher was prioritized.
- **Overriding Zone Rules with Geolocation**: AI considered matching volunteers to donations based on a proximity radius (e.g. within 5 km). This was rejected because official rule #4 explicitly requires the donor's zone to be one of the volunteer's assigned zones. Distance was kept strictly as an estimated discovery filter.
- **Color-Only Status Indicators**: Initial UI mockups color-coded statuses (green for OPEN, red for CANCELLED). This was rejected to comply with accessibility standards; explicit textual badges (`● OPEN`, `✓ FULLY CLAIMED`, `⏱ EXPIRED`, `✕ CANCELLED`, `⚡ ACTIVE`, `✓ COLLECTED`, `⚠ MISSED`) were implemented.
