// File: backend/src/scripts/approve-user.js
#!/usr/bin/env node
import { db } from '../db/connection.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

async function approveUser(email) {
  if (!email) {
    console.error('❌ Error: Email address is required');
    console.error('Usage: node approve-user.js <email>');
    process.exit(1);
  }

  try {
    console.log(`🔍 Looking up user with email: ${email}`);

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      console.error(`❌ User with email "${email}" not found`);
      console.error('💡 Tip: Make sure the user has logged in via Google SSO first');
      process.exit(1);
    }

    console.log(`👤 Found user:`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Current status: ${user.approvalStatus || 'N/A'}`);
    console.log(`   Role: ${user.role}`);

    if (user.approvalStatus === 'approved') {
      console.warn(`⚠️  User is already approved`);
      process.exit(0);
    }

    console.log(`\n✅ Approving user...`);

    await db
      .update(users)
      .set({
        approvalStatus: 'approved',
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    console.log(`\n✨ User "${email}" approved successfully!`);
    console.log(`   They can now log in via Google SSO.`);
  } catch (error) {
    console.error(`❌ Error approving user:`, error.message);
    process.exit(1);
  }
}

// Get email from command line argument
const email = process.argv[2];

approveUser(email);
