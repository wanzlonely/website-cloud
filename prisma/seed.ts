/**
 * WALZ EXPLOIT - Database Seed Script
 * Creates initial admin license key
 */

import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

function generateLicenseKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let key = 'WALZ-';
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (i < 3) key += '-';
  }
  return key;
}

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin license key
  const adminKey = await prisma.licenseKey.create({
    data: {
      key: 'WALZ-ADMIN-0000-0000-0001',
      type: 'multi',
      maxUses: 999,
      isActive: true,
    }
  });

  console.log('✅ Created admin license key:', adminKey.key);

  // Create a demo user with admin privileges
  const sessionId = randomBytes(16).toString('hex');
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year

  const adminUser = await prisma.user.create({
    data: {
      licenseKeyId: adminKey.id,
      sessionId,
      isAdmin: true,
      sessions: {
        create: {
          token,
          expiresAt
        }
      }
    }
  });

  console.log('✅ Created admin user with session');
  console.log('🔑 Admin License Key: WALZ-ADMIN-0000-0000-0001');
  console.log('📝 Use this key to login as admin');

  // Create some demo license keys
  for (let i = 0; i < 3; i++) {
    const key = await prisma.licenseKey.create({
      data: {
        key: generateLicenseKey(),
        type: i === 0 ? 'single' : 'multi',
        maxUses: i === 0 ? 1 : 10,
        isActive: true,
      }
    });
    console.log(`✅ Created demo key: ${key.key} (${key.type})`);
  }

  console.log('\n🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
