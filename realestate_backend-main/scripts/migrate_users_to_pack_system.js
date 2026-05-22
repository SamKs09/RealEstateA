// Migration script: Migrate users to new role and pack system
const mongoose = require('mongoose');
const User = require('../src/api/models/userModel');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/realestate';

async function migrate() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const users = await User.find({});
  let updated = 0;

  for (const user of users) {
    let needsUpdate = false;

    // Migrate role: if array, pick one (prefer seller > renter > client > support > admin)
    if (Array.isArray(user.role)) {
      if (user.role.includes('seller')) user.role = 'seller';
      else if (user.role.includes('renter')) user.role = 'renter';
      else if (user.role.includes('client') || user.role.includes('buyer')) user.role = 'client';
      else if (user.role.includes('support')) user.role = 'support';
      else if (user.role.includes('admin')) user.role = 'admin';
      else user.role = 'client';
      needsUpdate = true;
    }

    // Remove any points/credits fields
    if (user.credits !== undefined) {
      user.credits = undefined;
      needsUpdate = true;
    }

    // Add pack if missing
    if (!user.pack) {
      user.pack = 'freemium';
      needsUpdate = true;
    }

    if (needsUpdate) {
      await user.save();
      updated++;
      console.log(`Updated user ${user._id}`);
    }
  }

  console.log(`Migration complete. Updated ${updated} users.`);
  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
