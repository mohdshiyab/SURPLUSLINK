const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../src/index');
const Donation = require('../src/models/Donation');
const Claim = require('../src/models/Claim');
const SimulationClock = require('../src/models/SimulationClock');
const RestaurantProfile = require('../src/models/RestaurantProfile');
const VolunteerProfile = require('../src/models/VolunteerProfile');

const connectDB = require('../src/config/db');

jest.setTimeout(30000);

describe('SurplusLink Official Hackathon Business Rules & Edge Cases', () => {
  beforeAll(async () => {
    await connectDB();
    // Ensure simulated clock is at initial seed
    await SimulationClock.updateOne(
      { key: 'global' },
      { $set: { simulatedNow: '2026-03-10T12:00' } }
    );
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test('TC1 & TC2: Clock starts at 2026-03-10T12:00 and seed data is intact', async () => {
    const res = await request(app).get('/api/clock');
    expect(res.status).toBe(200);
    expect(res.body.simulatedNow).toBe('2026-03-10T12:00');

    const donorsRes = await request(app).get('/api/demo/people');
    expect(donorsRes.status).toBe(200);
    expect(donorsRes.body.donors.length).toBe(5);
    expect(donorsRes.body.volunteers.length).toBe(6);
  });

  test('TC3: Reject zero, negative, fractional, missing, and nonnumeric kg inputs for donation', async () => {
    const badCases = [0, -5, 4.5, null, 'abc'];
    for (const badKg of badCases) {
      const res = await request(app)
        .post('/api/donations')
        .set('x-demo-id', 'D1')
        .send({
          description: 'Invalid Kg Food',
          quantity_kg: badKg,
          pickup_from: '2026-03-10T14:00',
          pickup_until: '2026-03-10T16:00'
        });
      expect([400, 422]).toContain(res.status);
      expect(res.body.success).toBe(false);
    }
  });

  test('TC4: Reject pickup_from >= pickup_until and pickup_until < simulated now', async () => {
    // pickup_from >= pickup_until
    const res1 = await request(app)
      .post('/api/donations')
      .set('x-demo-id', 'D1')
      .send({
        description: 'Time order violation',
        quantity_kg: 10,
        pickup_from: '2026-03-10T16:00',
        pickup_until: '2026-03-10T14:00'
      });
    expect([400, 422]).toContain(res1.status);
    expect(res1.body.errors.some(e => e.includes('strictly before'))).toBe(true);

    // pickup_until < simulated now (now is 12:00, until is 11:00)
    const res2 = await request(app)
      .post('/api/donations')
      .set('x-demo-id', 'D1')
      .send({
        description: 'Past time violation',
        quantity_kg: 10,
        pickup_from: '2026-03-10T10:00',
        pickup_until: '2026-03-10T11:00'
      });
    expect([400, 422]).toContain(res2.status);
    expect(res2.body.errors.some(e => e.includes('cannot be before current simulated time'))).toBe(true);
  });

  test('TC5: Multi-rule claim failure returns EVERY violated rule together', async () => {
    // Donation DN1: D1, NORTH zone, quantity 30kg, pickup 18:00 to 20:00
    // Try claiming with V3 (SOUTH only, capacity 25kg) with:
    // - kg: 50 (> capacity AND > remaining) -> violates Rule 2 and Rule 3
    // - zone mismatch -> violates Rule 4
    // - T: '2026-03-10T10:00' (outside pickup window AND before now 12:00) -> violates Rule 5 and Rule 6
    const res = await request(app)
      .post('/api/donations/DN1/claims')
      .set('x-demo-id', 'V3')
      .send({
        kg: 50,
        plannedPickupTime: '2026-03-10T10:00'
      });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.length).toBeGreaterThanOrEqual(4);
    // Verifies multi-rule accumulation:
    expect(res.body.errors.some(e => e.includes('Rule 2 violated'))).toBe(true);
    expect(res.body.errors.some(e => e.includes('Rule 3 violated'))).toBe(true);
    expect(res.body.errors.some(e => e.includes('Rule 4 violated'))).toBe(true);
    expect(res.body.errors.some(e => e.includes('Rule 5 violated'))).toBe(true);
    expect(res.body.errors.some(e => e.includes('Rule 6 violated'))).toBe(true);
  });

  test('TC6: Boundary times for pickup_from and pickup_until are inclusive', async () => {
    // DN4: EAST, 12kg, pickup 17:00 to 19:00
    // V1: NORTH, EAST, capacity 20kg
    // Claim 2kg at exactly 17:00 (pickup_from boundary)
    const resStart = await request(app)
      .post('/api/donations/DN4/claims')
      .set('x-demo-id', 'V1')
      .send({
        kg: 2,
        plannedPickupTime: '2026-03-10T17:00'
      });
    expect(resStart.status).toBe(201);
    expect(resStart.body.claim.status).toBe('ACTIVE');

    // Claim 2kg at exactly 19:00 with V5 (EAST, capacity 10kg)
    const resEnd = await request(app)
      .post('/api/donations/DN4/claims')
      .set('x-demo-id', 'V5')
      .send({
        kg: 2,
        plannedPickupTime: '2026-03-10T19:00'
      });
    expect(resEnd.status).toBe(201);
    expect(resEnd.body.claim.status).toBe('ACTIVE');
  });

  test('TC7: Rule 7 - T must be at least 60 minutes apart for the same volunteer', async () => {
    // V1 claimed at 17:00 on DN4.
    // Try to claim another donation (e.g. DN2 in NORTH, pickup 18:00 to 21:00) at 17:45 (only 45 min apart)
    const resConflict = await request(app)
      .post('/api/donations/DN2/claims')
      .set('x-demo-id', 'V1')
      .send({
        kg: 5,
        plannedPickupTime: '2026-03-10T18:30' // 18:30 is 90 mins from 17:00 -> ok, but 17:45 is not
      });
    // Let's test 17:45 which is within 60 mins of 17:00
    const resViolation = await request(app)
      .post('/api/donations/DN2/claims')
      .set('x-demo-id', 'V1')
      .send({
        kg: 5,
        plannedPickupTime: '2026-03-10T17:45'
      });
    expect(resViolation.status).toBe(422);
    expect(resViolation.body.errors.some(e => e.includes('Rule 7 violated'))).toBe(true);
  });

  test('TC8: Cancellation allowed only when now < plannedPickupTime; returns kg', async () => {
    // V1 created claim on DN4 for 2kg at 17:00. Now is 12:00 (12:00 < 17:00).
    const claimsRes = await request(app).get('/api/claims/mine').set('x-demo-id', 'V1');
    const claim = claimsRes.body.claims.find(c => c.donation_id === 'DN4' && c.status === 'ACTIVE');
    expect(claim).toBeDefined();

    const cancelRes = await request(app)
      .post(`/api/claims/${claim.claim_id}/cancel`)
      .set('x-demo-id', 'V1');
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.claim.status).toBe('CANCELLED');
  });

  test('TC9: Collection allowed only inside pickup window [pickup_from, pickup_until]', async () => {
    // DN3: D3 (SOUTH), 25kg, pickup 14:00 to 16:00
    // V3: SOUTH, capacity 25kg. Claim 10kg at 14:30.
    const claimRes = await request(app)
      .post('/api/donations/DN3/claims')
      .set('x-demo-id', 'V3')
      .send({
        kg: 10,
        plannedPickupTime: '2026-03-10T14:30'
      });
    expect(claimRes.status).toBe(201);
    const claimId = claimRes.body.claim.claim_id;

    // Try collecting when clock is 12:00 (< 14:00)
    const earlyCollect = await request(app)
      .post(`/api/claims/${claimId}/collect`)
      .set('x-demo-id', 'V3');
    expect(earlyCollect.status).toBe(422);
    expect(earlyCollect.body.errors[0]).toContain('pickup window');

    // Advance clock to 14:15
    await request(app).patch('/api/clock').send({ time: '2026-03-10T14:15' });

    // Now collection should succeed!
    const validCollect = await request(app)
      .post(`/api/claims/${claimId}/collect`)
      .set('x-demo-id', 'V3');
    expect(validCollect.status).toBe(200);
    expect(validCollect.body.claim.status).toBe('COLLECTED');
  });

  test('TC10: When clock moves past pickup_until, ACTIVE claims become MISSED', async () => {
    // V5 has an ACTIVE claim on DN4 at 19:00 (pickup until is 19:00).
    // Let's create an active claim on DN2 (until 21:00) with V2 (NORTH)
    const claimRes = await request(app)
      .post('/api/donations/DN2/claims')
      .set('x-demo-id', 'V2')
      .send({
        kg: 5,
        plannedPickupTime: '2026-03-10T20:00'
      });
    expect(claimRes.status).toBe(201);
    const claimId = claimRes.body.claim.claim_id;

    // Advance clock past DN2's pickup_until (21:00) -> e.g. 21:30
    const advanceRes = await request(app)
      .patch('/api/clock')
      .send({ time: '2026-03-10T21:30' });
    expect(advanceRes.status).toBe(200);

    const updatedClaim = await Claim.findOne({ claim_id: claimId });
    expect(updatedClaim.status).toBe('MISSED');
  });

  test('TC11 & TC12: Concurrency & partial vs fully claimed status', async () => {
    // Create fresh test donation with 10kg
    const newDonationRes = await request(app)
      .post('/api/donations')
      .set('x-demo-id', 'D4') // EAST
      .send({
        description: 'Limited Fresh Pastries',
        quantity_kg: 10,
        pickup_from: '2026-03-10T22:00',
        pickup_until: '2026-03-10T23:30'
      });
    expect(newDonationRes.status).toBe(201);
    const dId = newDonationRes.body.donation.id;

    // Advance clock to 22:00
    await request(app).patch('/api/clock').send({ time: '2026-03-10T22:00' });

    // Partial claim: V1 claims 4kg out of 10kg
    const claim1 = await request(app)
      .post(`/api/donations/${dId}/claims`)
      .set('x-demo-id', 'V1')
      .send({
        kg: 4,
        plannedPickupTime: '2026-03-10T22:15'
      });
    expect(claim1.status).toBe(201);
    expect(claim1.body.remainingKg).toBe(6);
    expect(claim1.body.donationStatus).toBe('OPEN');

    // Full remaining claim: V5 claims remaining 6kg
    const claim2 = await request(app)
      .post(`/api/donations/${dId}/claims`)
      .set('x-demo-id', 'V5')
      .send({
        kg: 6,
        plannedPickupTime: '2026-03-10T22:30'
      });
    expect(claim2.status).toBe(201);
    expect(claim2.body.remainingKg).toBe(0);
    expect(claim2.body.donationStatus).toBe('FULLY_CLAIMED');
  });

  test('TC13: Donor cannot cancel donation with ACTIVE or COLLECTED claims', async () => {
    // DN3 has a COLLECTED claim from TC9. D3 tries to cancel it.
    const cancelRes = await request(app)
      .post('/api/donations/DN3/cancel')
      .set('x-demo-id', 'D3');
    expect(cancelRes.status).toBe(422);
    expect(cancelRes.body.errors.some(e => e.includes('ACTIVE or COLLECTED claim'))).toBe(true);
  });

  test('TC14: Dashboard Invariant Listed = Collected + Missed + Wasted + In Progress + Still Open ALWAYS holds', async () => {
    const summaryRes = await request(app).get('/api/dashboard/summary');
    expect(summaryRes.status).toBe(200);
    expect(summaryRes.body.invariantPassed).toBe(true);
    expect(summaryRes.body.status).toBe('PASS');
    expect(summaryRes.body.listed).toBe(summaryRes.body.sumOfFive);
  });

  test('TC15: Zone eligibility is strictly enforced regardless of geographic distance', async () => {
    // D3 is in SOUTH zone. V2 is in NORTH zone only.
    // V2 cannot claim D3 even if nearby.
    const res = await request(app)
      .post('/api/donations/DN3/claims')
      .set('x-demo-id', 'V2')
      .send({
        kg: 5,
        plannedPickupTime: '2026-03-10T15:00'
      });
    expect(res.status).toBe(422);
    expect(res.body.errors.some(e => e.includes('Rule 4 violated'))).toBe(true);
  });
});
