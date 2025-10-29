import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  console.log('Clearing existing data...');
  await prisma.event.deleteMany();
  await prisma.place.deleteMany();
  await prisma.user.deleteMany();
  await prisma.ingestLog.deleteMany();

  // Seed Users
  console.log('Creating users...');
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'alice@example.com',
        interests: ['music', 'technology', 'art'],
      },
    }),
    prisma.user.create({
      data: {
        email: 'bob@example.com',
        interests: ['sports', 'food', 'networking'],
      },
    }),
  ]);
  console.log(`✓ Created ${users.length} users`);

  // Seed Places (Venues)
  console.log('Creating places...');
  const places = await Promise.all([
    prisma.$executeRaw`
      INSERT INTO places (id, provider, provider_id, name, category, location, address, city, state, country, url, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        'manual',
        'venue-001',
        'The Grand Theater',
        ARRAY['theater', 'performing-arts']::text[],
        ST_SetSRID(ST_MakePoint(-122.4194, 37.7749), 4326)::geography,
        '123 Market St',
        'San Francisco',
        'CA',
        'USA',
        'https://grandtheater.example.com',
        NOW(),
        NOW()
      )
      RETURNING id
    `,
    prisma.$executeRaw`
      INSERT INTO places (id, provider, provider_id, name, category, location, address, city, state, country, url, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        'manual',
        'venue-002',
        'Tech Hub Conference Center',
        ARRAY['conference', 'technology']::text[],
        ST_SetSRID(ST_MakePoint(-122.4089, 37.7833), 4326)::geography,
        '456 Mission St',
        'San Francisco',
        'CA',
        'USA',
        'https://techhub.example.com',
        NOW(),
        NOW()
      )
      RETURNING id
    `,
    prisma.$executeRaw`
      INSERT INTO places (id, provider, provider_id, name, category, location, address, city, state, country, url, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        'manual',
        'venue-003',
        'Golden Gate Park',
        ARRAY['park', 'outdoor']::text[],
        ST_SetSRID(ST_MakePoint(-122.4862, 37.7694), 4326)::geography,
        'Golden Gate Park',
        'San Francisco',
        'CA',
        'USA',
        'https://goldengatepark.example.com',
        NOW(),
        NOW()
      )
      RETURNING id
    `,
    prisma.$executeRaw`
      INSERT INTO places (id, provider, provider_id, name, category, location, address, city, state, country, url, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        'manual',
        'venue-004',
        'Downtown Sports Arena',
        ARRAY['sports', 'arena']::text[],
        ST_SetSRID(ST_MakePoint(-122.3892, 37.7911), 4326)::geography,
        '789 Third St',
        'San Francisco',
        'CA',
        'USA',
        'https://sportsarena.example.com',
        NOW(),
        NOW()
      )
      RETURNING id
    `,
  ]);
  console.log(`✓ Created ${places.length} places`);

  // Get place IDs for events
  const venueRecords = await prisma.place.findMany({
    select: { id: true, name: true },
  });

  // Seed Events
  console.log('Creating events...');
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const events = await Promise.all([
    prisma.event.create({
      data: {
        provider: 'manual',
        providerId: 'event-001',
        title: 'Summer Music Festival',
        description:
          'Join us for an amazing outdoor music festival featuring local and international artists.',
        category: ['music', 'festival', 'outdoor'],
        startAt: nextWeek,
        endAt: new Date(nextWeek.getTime() + 8 * 60 * 60 * 1000),
        venueId: venueRecords.find((v) => v.name === 'Golden Gate Park')?.id,
        priceMin: 50,
        priceMax: 150,
        currency: 'USD',
        url: 'https://summerfest.example.com',
        popularityScore: 95,
      },
    }),
    prisma.event.create({
      data: {
        provider: 'manual',
        providerId: 'event-002',
        title: 'Tech Innovation Summit 2025',
        description:
          'Annual technology conference featuring keynotes from industry leaders and hands-on workshops.',
        category: ['technology', 'conference', 'networking'],
        startAt: nextMonth,
        endAt: new Date(nextMonth.getTime() + 2 * 24 * 60 * 60 * 1000),
        venueId: venueRecords.find((v) => v.name === 'Tech Hub Conference Center')?.id,
        priceMin: 200,
        priceMax: 500,
        currency: 'USD',
        url: 'https://techinnovation.example.com',
        popularityScore: 88,
      },
    }),
    prisma.event.create({
      data: {
        provider: 'manual',
        providerId: 'event-003',
        title: 'Shakespeare in the Park',
        description: 'Classic theater performance under the stars. Bring a blanket and enjoy!',
        category: ['theater', 'performing-arts', 'outdoor'],
        startAt: tomorrow,
        endAt: new Date(tomorrow.getTime() + 3 * 60 * 60 * 1000),
        venueId: venueRecords.find((v) => v.name === 'The Grand Theater')?.id,
        priceMin: 0,
        priceMax: 25,
        currency: 'USD',
        url: 'https://shakespeare.example.com',
        popularityScore: 72,
      },
    }),
    prisma.event.create({
      data: {
        provider: 'manual',
        providerId: 'event-004',
        title: 'NBA Preseason Game',
        description: 'Watch your favorite teams battle it out in this exciting preseason matchup.',
        category: ['sports', 'basketball'],
        startAt: new Date(nextWeek.getTime() + 3 * 24 * 60 * 60 * 1000),
        endAt: new Date(nextWeek.getTime() + 3 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
        venueId: venueRecords.find((v) => v.name === 'Downtown Sports Arena')?.id,
        priceMin: 30,
        priceMax: 200,
        currency: 'USD',
        url: 'https://nba.example.com',
        popularityScore: 91,
      },
    }),
    prisma.event.create({
      data: {
        provider: 'manual',
        providerId: 'event-005',
        title: 'Art Gallery Opening',
        description: 'Exclusive opening of contemporary art exhibition featuring emerging artists.',
        category: ['art', 'gallery', 'culture'],
        startAt: new Date(tomorrow.getTime() + 2 * 24 * 60 * 60 * 1000),
        endAt: new Date(tomorrow.getTime() + 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
        venueId: venueRecords.find((v) => v.name === 'The Grand Theater')?.id,
        priceMin: 0,
        priceMax: 0,
        currency: 'USD',
        url: 'https://artgallery.example.com',
        popularityScore: 65,
      },
    }),
    prisma.event.create({
      data: {
        provider: 'manual',
        providerId: 'event-006',
        title: 'Food Truck Festival',
        description:
          'Sample delicious food from 50+ local food trucks. Live music and family activities.',
        category: ['food', 'festival', 'family'],
        startAt: new Date(nextWeek.getTime() + 5 * 24 * 60 * 60 * 1000),
        endAt: new Date(nextWeek.getTime() + 5 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
        venueId: venueRecords.find((v) => v.name === 'Golden Gate Park')?.id,
        priceMin: 0,
        priceMax: 0,
        currency: 'USD',
        url: 'https://foodtrucks.example.com',
        popularityScore: 82,
      },
    }),
  ]);
  console.log(`✓ Created ${events.length} events`);

  // Seed Ingest Logs
  console.log('Creating ingest logs...');
  const logs = await Promise.all([
    prisma.ingestLog.create({
      data: {
        provider: 'manual',
        startedAt: new Date(now.getTime() - 60 * 60 * 1000),
        finishedAt: new Date(now.getTime() - 30 * 60 * 1000),
        ok: true,
        records: events.length,
      },
    }),
    prisma.ingestLog.create({
      data: {
        provider: 'eventbrite',
        startedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        finishedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000 + 5 * 60 * 1000),
        ok: false,
        records: 0,
        error: 'API rate limit exceeded',
      },
    }),
  ]);
  console.log(`✓ Created ${logs.length} ingest logs`);

  console.log('\n✅ Seeding complete!');
  console.log(`   Users: ${users.length}`);
  console.log(`   Places: ${places.length}`);
  console.log(`   Events: ${events.length}`);
  console.log(`   Ingest Logs: ${logs.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
