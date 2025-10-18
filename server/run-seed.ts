import { seedDatabase } from './seed-data';

async function main() {
  try {
    await seedDatabase();
    // eslint-disable-next-line no-console
    console.log('Seeding finished.');
    process.exit(0);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

// Run if called directly
main();

