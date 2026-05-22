/**
 * Seed 5 property bookings + 5 vehicle bookings for each buyer account.
 * Run: node scripts/seed-bookings.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../config/db');
const Booking = require('../src/api/models/bookingModel');
const User = require('../src/api/models/userModel');
const Property = require('../src/api/models/propertyModel');
const Vehicle = require('../src/api/models/vehicleModel');

// Helper – generate reference numbers like REF-2026-001
let refCounter = 1000;
const genRef = () => `REF-2026-${++refCounter}`;

// Helper – offset date from today
const dateOffset = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};

// Booking status cycle
const STATUSES = ['pending', 'accepted', 'accepted', 'declined', 'cancelled'];

// How many booking slots each buyer gets
const BOOKINGS_PER_BUYER = 5;

async function run() {
  await connectDB();
  console.log('🗑️  Removing existing seeded bookings...');
  await Booking.deleteMany({});

  // ── Load buyers ──────────────────────────────────────────────────────────
  const buyers = await User.find({ role: 'client' }, '_id fullName').lean();
  if (!buyers.length) {
    console.error('❌  No client users found. Run the main seed script first.');
    process.exit(1);
  }
  console.log(`✅  Found ${buyers.length} buyer(s)`);

  // ── Load listings ─────────────────────────────────────────────────────────
  const properties = await Property.find({ status: 'active' }, '_id title owner pricing listingType').lean();
  const vehicles   = await Vehicle.find({ status: 'active' },  '_id title owner pricing listingType').lean();

  if (!properties.length || !vehicles.length) {
    console.error('❌  No active properties or vehicles found. Seed listings first.');
    process.exit(1);
  }
  console.log(`✅  Found ${properties.length} properties and ${vehicles.length} vehicles`);

  const bookings = [];

  for (const buyer of buyers) {
    console.log(`\n📋  Creating bookings for ${buyer.fullName}...`);

    // ── 5 Property Bookings ───────────────────────────────────────────────
    for (let i = 0; i < BOOKINGS_PER_BUYER; i++) {
      const prop     = properties[i % properties.length];
      const status   = STATUSES[i % STATUSES.length];
      const startOff = -30 + i * 15;  // spread across past/future dates
      const startDate = dateOffset(startOff);
      const endDate   = dateOffset(startOff + 5 + i * 2);

      const basePrice = prop.pricing?.rentPrice || prop.pricing?.salePrice || 1000;
      const duration  = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
      const total     = basePrice * duration;

      const booking = {
        guest:          buyer._id,
        owner:          prop.owner,
        listingType:    'property',
        property:       prop._id,
        startDate,
        endDate,
        numberOfGuests: 1 + (i % 3),
        basePrice,
        proposedPrice:  Math.round(total * (0.85 + i * 0.05)),
        finalPrice:     status === 'accepted' ? total : undefined,
        currency:       'TND',
        status,
        guestMessage:   `Booking request ${i + 1} from ${buyer.fullName}`,
        specialRequests: i % 2 === 0 ? 'Early check-in if possible' : undefined,
      };

      if (status === 'accepted') {
        booking.referenceNumber = genRef();
        booking.acceptedAt = new Date();
      }
      if (status === 'declined') {
        booking.declinedAt = new Date();
      }
      if (status === 'cancelled') {
        booking.cancellationReason = 'change_of_plans';
        booking.cancelledAt = new Date();
        booking.cancelledBy = buyer._id;
      }

      bookings.push(booking);
    }

    // ── 5 Vehicle Bookings ────────────────────────────────────────────────
    for (let i = 0; i < BOOKINGS_PER_BUYER; i++) {
      const veh    = vehicles[i % vehicles.length];
      const status = STATUSES[(i + 2) % STATUSES.length]; // offset for variety
      const startOff = -20 + i * 12;
      const startDate = dateOffset(startOff);
      const endDate   = dateOffset(startOff + 3 + i);

      const basePrice = veh.pricing?.rentPrice || veh.pricing?.salePrice || 300;
      const duration  = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
      const total     = basePrice * duration;

      const booking = {
        guest:          buyer._id,
        owner:          veh.owner,
        listingType:    'vehicle',
        vehicle:        veh._id,
        startDate,
        endDate,
        numberOfGuests: 1,
        basePrice,
        proposedPrice:  Math.round(total * (0.90 + i * 0.03)),
        finalPrice:     status === 'accepted' ? total : undefined,
        currency:       'TND',
        status,
        guestMessage:   `Vehicle rental request ${i + 1} from ${buyer.fullName}`,
      };

      if (status === 'accepted') {
        booking.referenceNumber = genRef();
        booking.acceptedAt = new Date();
      }
      if (status === 'declined') {
        booking.declinedAt = new Date();
      }
      if (status === 'cancelled') {
        booking.cancellationReason = 'found_alternative';
        booking.cancelledAt = new Date();
        booking.cancelledBy = buyer._id;
      }

      bookings.push(booking);
    }
  }

  console.log(`\n💾  Inserting ${bookings.length} bookings...`);
  const inserted = await Booking.insertMany(bookings, { ordered: false });
  console.log(`✅  Inserted ${inserted.length} bookings successfully!`);

  // ── Summary ───────────────────────────────────────────────────────────────
  const summary = await Booking.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);
  console.log('\n📊  Booking summary by status:');
  summary.forEach(s => console.log(`   ${s._id}: ${s.count}`));

  await mongoose.connection.close();
  console.log('\n🎉  Done! Bookings seeded successfully.');
}

run().catch(err => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
