import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import { Category } from '../models/Category.js';
import { Artist } from '../models/Artist.js';
import { HistoricalPeriod } from '../models/HistoricalPeriod.js';
import { Location } from '../models/Location.js';

dotenv.config();

const categories = [
  { name: 'Sculpture', description: 'Three-dimensional artworks including stone, bronze, and terracotta sculptures.' },
  { name: 'Painting', description: 'Miniature paintings, murals, and canvas works spanning multiple traditions.' },
  { name: 'Textile', description: 'Handwoven fabrics, embroideries, tapestries, and traditional garments.' },
  { name: 'Pottery', description: 'Ceramic vessels, terracotta figurines, and archaeological pottery shards.' },
  { name: 'Manuscript', description: 'Historical manuscripts, illuminated texts, and calligraphic works.' },
  { name: 'Metalwork', description: 'Bronze, copper, and iron ritual objects, tools, and decorative items.' },
  { name: 'Jewelry', description: 'Ornaments, amulets, and decorative personal adornments from various eras.' },
  { name: 'Arms & Armor', description: 'Weapons, shields, helmets, and military regalia from historical periods.' },
];

const artists = [
  { name: 'Unknown Ancient Sculptor', biography: 'Anonymous artisan from the Mauryan period.', birth_year: -300, death_year: -100, nationality: 'Indian' },
  { name: 'Master Bihari', biography: 'Renowned Mughal court painter specializing in miniature portraiture.', birth_year: 1740, death_year: 1810, nationality: 'Indian' },
  { name: 'Ram Singh Mali', biography: 'Traditional Gujarati textile weaver from the Patola tradition.', birth_year: 1850, death_year: 1920, nationality: 'Indian' },
  { name: 'Devi Prasad', biography: 'Master bronze caster of South Indian ritual icons.', birth_year: 1880, death_year: 1955, nationality: 'Indian' },
  { name: 'Ghulam Ali Khan', biography: 'Delhi-based painter documenting court life.', birth_year: 1790, death_year: 1860, nationality: 'Indian' },
  { name: 'Unknown Harappan Artisan', biography: 'Skilled potter from the Indus Valley Civilization.', birth_year: -2500, death_year: -2000, nationality: 'Indian' },
];

const periods = [
  { name: 'Indus Valley Civilization', start_year: -2600, end_year: -1900, description: 'Bronze Age urban civilization.' },
  { name: 'Maurya Empire', start_year: -322, end_year: -185, description: 'First major empire of the Indian subcontinent.' },
  { name: 'Gupta Empire', start_year: 320, end_year: 550, description: 'Classical golden age of Indian art, science, and literature.' },
  { name: 'Medieval Period', start_year: 600, end_year: 1200, description: 'Era of regional kingdoms and temple architecture.' },
  { name: 'Mughal Empire', start_year: 1526, end_year: 1857, description: 'Period of Indo-Islamic art and miniature painting.' },
  { name: 'Colonial Era', start_year: 1858, end_year: 1947, description: 'British colonial period with hybrid artistic traditions.' },
];

const locations = [
  { building: 'Main Gallery', gallery: 'Ancient Art Wing', room: 'Hall A', shelf_or_display: 'Display Case 1', description: 'Early civilization artifacts' },
  { building: 'Main Gallery', gallery: 'Ancient Art Wing', room: 'Hall B', shelf_or_display: 'Center Pedestal', description: 'Sculptures and monumental art' },
  { building: 'Heritage Wing', gallery: 'Textile Gallery', room: 'Room 101', shelf_or_display: 'Display Frame 4', description: 'Historic woven fabrics' },
  { building: 'Heritage Wing', gallery: 'Decorative Arts', room: 'Room 203', shelf_or_display: 'Case 7', description: 'Metalwork and jewelry' },
];

async function seed() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/museum_collection';
    console.log(`Connecting to ${mongoUri}...`);
    await mongoose.connect(mongoUri);

    console.log('Clearing existing reference collections...');
    await Promise.all([
      Category.deleteMany({}),
      Artist.deleteMany({}),
      HistoricalPeriod.deleteMany({}),
      Location.deleteMany({}),
    ]);

    console.log('Seeding categories...');
    await Category.insertMany(categories);

    console.log('Seeding artists...');
    await Artist.insertMany(artists);

    console.log('Seeding historical periods...');
    await HistoricalPeriod.insertMany(periods);

    console.log('Seeding locations...');
    await Location.insertMany(locations);

    // Create default admin user if not exists
    const adminEmail = 'admin@museum.org';
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      console.log('Creating default admin user (admin@museum.org)...');
      await User.create({
        email: adminEmail,
        password: 'adminPassword123!',
        full_name: 'System Administrator',
        role: 'admin',
        is_active: true,
      });
      console.log('Admin user created (Email: admin@museum.org, Password: adminPassword123!)');
    }

    console.log('🎉 Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during seeding:', err);
    process.exit(1);
  }
}

seed();
