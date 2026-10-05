import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import {
  Artifact,
  ArtifactImage,
  Category,
  Artist,
  HistoricalPeriod,
  Location,
  Exhibition,
  ProvenanceRecord,
  ConservationRecord,
  Favorite,
  Review,
  Comment,
  CartItem,
  User,
} from '../models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env configuration
dotenv.config({ path: path.join(__dirname, '../../.env') });

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

function escapeXml(unsafe) {
  return String(unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapText(text, maxCharsPerLine = 26) {
  const words = String(text || '').split(' ');
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

const categoryThemes = {
  'Sculpture': { bg: '#3D2E24', accent: '#D4A373', badge: '#594132', text: '#FAF0E6' },
  'Painting': { bg: '#1B3644', accent: '#5DADE2', badge: '#2A4D60', text: '#EBF5FB' },
  'Textile': { bg: '#4A1521', accent: '#F1948A', badge: '#6A2232', text: '#FDEDEC' },
  'Pottery': { bg: '#512E1A', accent: '#E59866', badge: '#724024', text: '#FBEEE6' },
  'Manuscript': { bg: '#2E282A', accent: '#FAD7A0', badge: '#4A4043', text: '#FEF9E7' },
  'Metalwork': { bg: '#1D3331', accent: '#76D7C4', badge: '#2C4C49', text: '#E8F8F5' },
  'Jewelry': { bg: '#3B1A3F', accent: '#BB8FCE', badge: '#56275C', text: '#F4ECF7' },
  'Arms & Armor': { bg: '#212529', accent: '#A6ACAF', badge: '#343A40', text: '#F2F3F4' },
};

function generateArtifactSvg({ name, categoryName, accessionNumber, periodName, material }) {
  const theme = categoryThemes[categoryName] || {
    bg: '#2C3E50',
    accent: '#E0E6ED',
    badge: '#34495E',
    text: '#FFFFFF',
  };

  const lines = wrapText(name, 26);
  const lineHeight = 36;
  const startY = 300 - ((lines.length - 1) * lineHeight) / 2;
  const tspans = lines
    .map((line, idx) => `<tspan x="400" y="${startY + idx * lineHeight}">${escapeXml(line)}</tspan>`)
    .join('\n        ');

  const badgeText = (categoryName || 'ARTIFACT').toUpperCase();
  const badgeWidth = Math.max(140, badgeText.length * 12 + 40);
  const badgeX = 400 - badgeWidth / 2;

  const subtitle = [periodName, material].filter(Boolean).join(' • ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bg}" />
      <stop offset="100%" stop-color="#14181B" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.45" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="800" height="600" fill="url(#bgGrad)" />

  <!-- Borders -->
  <rect x="25" y="25" width="750" height="550" fill="none" stroke="${theme.accent}" stroke-width="2" stroke-opacity="0.4" rx="8" />
  <rect x="35" y="35" width="730" height="530" fill="none" stroke="${theme.accent}" stroke-width="1" stroke-opacity="0.2" rx="4" />

  <!-- Corner Ornaments -->
  <path d="M 25 50 L 50 25 M 25 60 L 60 25 M 775 50 L 750 25 M 775 60 L 740 25 M 25 550 L 50 575 M 25 540 L 60 575 M 775 550 L 750 575 M 775 540 L 740 575" stroke="${theme.accent}" stroke-width="1.5" stroke-opacity="0.5" />

  <!-- Museum Title -->
  <text x="400" y="80" text-anchor="middle" font-family="Georgia, serif" font-size="13" font-weight="600" letter-spacing="4" fill="${theme.accent}">HERITAGE MUSEUM COLLECTION</text>

  <!-- Category Badge -->
  <g filter="url(#shadow)">
    <rect x="${badgeX}" y="115" width="${badgeWidth}" height="32" rx="16" fill="${theme.badge}" stroke="${theme.accent}" stroke-width="1.5" />
    <text x="400" y="136" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="bold" letter-spacing="2" fill="${theme.accent}">${escapeXml(badgeText)}</text>
  </g>

  <!-- Decorative Center Medallion / Line -->
  <line x1="200" y1="180" x2="600" y2="180" stroke="${theme.accent}" stroke-width="1" stroke-opacity="0.3" />
  <polygon points="400,175 405,180 400,185 395,180" fill="${theme.accent}" />

  <!-- Artifact Name -->
  <text text-anchor="middle" font-family="Georgia, serif" font-size="30" font-weight="bold" fill="${theme.text}" filter="url(#shadow)">
    ${tspans}
  </text>

  <!-- Decorative Divider Bottom -->
  <line x1="250" y1="420" x2="550" y2="420" stroke="${theme.accent}" stroke-width="1" stroke-opacity="0.3" />
  <circle cx="400" cy="420" r="3" fill="${theme.accent}" />

  <!-- Accession Number -->
  <text x="400" y="465" text-anchor="middle" font-family="'Courier New', monospace" font-size="16" font-weight="bold" letter-spacing="2" fill="${theme.accent}">${escapeXml(accessionNumber)}</text>

  <!-- Subtitle -->
  <text x="400" y="500" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="${theme.text}" fill-opacity="0.8">${escapeXml(subtitle)}</text>
</svg>
`;
}

function generateExhibitionSvg({ title, statusText, dateText, categoryColor = '#8E2800' }) {
  const lines = wrapText(title, 24);
  const lineHeight = 40;
  const startY = 300 - ((lines.length - 1) * lineHeight) / 2;
  const tspans = lines
    .map((line, idx) => `<tspan x="400" y="${startY + idx * lineHeight}">${escapeXml(line)}</tspan>`)
    .join('\n        ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
  <defs>
    <linearGradient id="exhGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${categoryColor}" />
      <stop offset="100%" stop-color="#0F1115" />
    </linearGradient>
    <filter id="shadowExh" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.5" />
    </filter>
  </defs>

  <rect width="800" height="600" fill="url(#exhGrad)" />
  <rect x="25" y="25" width="750" height="550" fill="none" stroke="#E5C158" stroke-width="2" stroke-opacity="0.4" rx="8" />
  <rect x="35" y="35" width="730" height="530" fill="none" stroke="#E5C158" stroke-width="1" stroke-opacity="0.2" rx="4" />

  <text x="400" y="80" text-anchor="middle" font-family="Georgia, serif" font-size="13" font-weight="600" letter-spacing="4" fill="#E5C158">HERITAGE MUSEUM EXHIBITION</text>

  <!-- Status Badge -->
  <g filter="url(#shadowExh)">
    <rect x="310" y="115" width="180" height="32" rx="16" fill="#1A1A1A" stroke="#E5C158" stroke-width="1.5" />
    <text x="400" y="136" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="bold" letter-spacing="2" fill="#E5C158">${escapeXml(statusText.toUpperCase())}</text>
  </g>

  <!-- Title -->
  <text text-anchor="middle" font-family="Georgia, serif" font-size="32" font-weight="bold" fill="#FFFFFF" filter="url(#shadowExh)">
    ${tspans}
  </text>

  <!-- Dates -->
  <text x="400" y="485" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="500" letter-spacing="1" fill="#E5C158">${escapeXml(dateText)}</text>
</svg>
`;
}

async function cleanupTestData() {
  console.log('🧹 [STEP 2] Checking for test artifacts to clean up...');
  const testArtifacts = await Artifact.find({
    name: { $in: [/^john snow$/i, /^budhha$/i] },
  });

  if (testArtifacts.length > 0) {
    const testIds = testArtifacts.map((a) => a._id);
    console.log(`Found ${testArtifacts.length} test artifact(s): ${testArtifacts.map((a) => a.name).join(', ')}`);

    const testImages = await ArtifactImage.find({ artifact_id: { $in: testIds } });
    for (const img of testImages) {
      if (img.image_url) {
        try {
          const parsed = new URL(img.image_url, 'http://localhost:5000');
          const filename = path.basename(parsed.pathname);
          const fPath = path.join(uploadsDir, filename);
          if (fs.existsSync(fPath)) {
            fs.unlinkSync(fPath);
            console.log(`  - Deleted image file: ${filename}`);
          }
        } catch (err) {
          console.warn(`  - Could not remove file for ${img.image_url}:`, err.message);
        }
      }
    }

    await ArtifactImage.deleteMany({ artifact_id: { $in: testIds } });
    await Favorite.deleteMany({ artifact_id: { $in: testIds } });
    await Review.deleteMany({ artifact_id: { $in: testIds } });
    await Comment.deleteMany({ artifact_id: { $in: testIds } });
    await CartItem.deleteMany({ artifact_id: { $in: testIds } });
    await ProvenanceRecord.deleteMany({ artifact_id: { $in: testIds } });
    await ConservationRecord.deleteMany({ artifact_id: { $in: testIds } });
    await Artifact.deleteMany({ _id: { $in: testIds } });
    console.log('✅ Cleaned up test artifacts and linked data.');
  } else {
    console.log('ℹ️  No test artifacts ("John snow", "Budhha") found.');
  }

  // Remove known test images if still present on disk
  const orphanedFiles = ['1791136973814-936186252.jpg', '1791137051404-12576936.jpg'];
  for (const filename of orphanedFiles) {
    const fPath = path.join(uploadsDir, filename);
    if (fs.existsSync(fPath)) {
      try {
        fs.unlinkSync(fPath);
        console.log(`  - Removed residual test image file: ${filename}`);
      } catch (err) {
        console.warn(`  - Failed to remove residual file ${filename}:`, err.message);
      }
    }
  }
}

async function seedArtifacts() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/museum_collection';
  console.log(`📡 Connecting to MongoDB at ${mongoUri}...`);
  await mongoose.connect(mongoUri);

  // STEP 2: Clean up test data
  await cleanupTestData();

  // Look up reference collections
  console.log('\n🔍 [STEP 3] Fetching existing reference collections...');
  const [categories, artists, periods, locations, adminUser] = await Promise.all([
    Category.find(),
    Artist.find(),
    HistoricalPeriod.find(),
    Location.find(),
    User.findOne({ role: 'admin' }) || User.findOne(),
  ]);

  if (!adminUser) {
    throw new Error('No user found in database to associate created_by. Run initial seed first.');
  }

  const categoryMap = new Map();
  categories.forEach((c) => categoryMap.set(c.name.toLowerCase().trim(), c));

  const artistMap = new Map();
  artists.forEach((a) => artistMap.set(a.name.toLowerCase().trim(), a));

  const periodMap = new Map();
  periods.forEach((p) => periodMap.set(p.name.toLowerCase().trim(), p));

  const locationMap = new Map();
  locations.forEach((l) => {
    // Key by gallery and room
    const key = `${l.gallery} - ${l.room || ''}`.toLowerCase().trim();
    locationMap.set(key, l);
    locationMap.set(l.gallery.toLowerCase().trim(), l);
  });

  const getCategory = (name) => categoryMap.get(name.toLowerCase().trim());
  const getArtist = (name) => (name ? artistMap.get(name.toLowerCase().trim()) : null);
  const getPeriod = (name) => periodMap.get(name.toLowerCase().trim());
  const getLocation = (galleryKeyword) => {
    const found = locations.find((l) => l.gallery.toLowerCase().includes(galleryKeyword.toLowerCase()));
    return found || locations[0];
  };

  // 24 realistic Indian heritage museum artifacts
  const rawArtifacts = [
    // 1. Pottery - Indus Valley
    {
      accession_number: 'MCMS-2024-001',
      name: 'Harappan Perforated Storage Jar',
      description: 'A cylindrical terracotta perforated vessel recovered from the citadel mound at Harappa. Characterized by regularly spaced perforations and a slipped surface, scholars suggest it served ritual fermentation or steam filtration purposes. Preserves faint traces of soot along its lower perimeter indicating exposure to domestic hearths.',
      category_name: 'Pottery',
      artist_name: 'Unknown Harappan Artisan',
      period_name: 'Indus Valley Civilization',
      location_keyword: 'Ancient Art Wing',
      origin: 'Harappa, Indus Valley (Punjab)',
      creation_date: 'c. 2400 BCE',
      material: 'Terracotta with red slip',
      dimensions: '34.0 x 16.5 x 16.5 cm',
      weight: '3.8 kg',
      condition: 'good',
      acquisition_date: '1985-04-12',
      acquisition_method: 'excavation',
      ownership_status: 'owned',
      status: 'active',
      is_public: true,
    },
    // 2. Sculpture - Maurya Empire
    {
      accession_number: 'MCMS-2024-002',
      name: 'Polished Mauryan Yakshi Torso',
      description: 'Fragmentary female attendant carved in buff-colored Chunar sandstone bearing the distinctive mirror-like imperial Mauryan polish. The sculptural articulation exemplifies early subcontinental naturalism with heavy beaded waist girdles and sensuous drapery folds. Discovered near the banks of the Son River during early 20th-century excavations.',
      category_name: 'Sculpture',
      artist_name: 'Unknown Ancient Sculptor',
      period_name: 'Maurya Empire',
      location_keyword: 'Ancient Art Wing',
      origin: 'Didarganj, Pataliputra, Bihar',
      creation_date: 'c. 250 BCE',
      material: 'Chunar sandstone with mirror polish',
      dimensions: '82.0 x 36.0 x 24.5 cm',
      weight: '47.5 kg',
      condition: 'good',
      acquisition_date: '1972-10-18',
      acquisition_method: 'donation',
      ownership_status: 'owned',
      status: 'active',
      is_public: true,
    },
    // 3. Metalwork - Medieval Period
    {
      accession_number: 'MCMS-2024-003',
      name: 'Chola Nataraja in Cosmic Dance',
      description: 'Masterpiece bronze icon depicting Lord Shiva dancing in the circle of primal fire (prabhamandala) crushing the demon Apasmara beneath his right foot. Cast via the cire-perdue (lost wax) process, showing exquisite poise, flying matted locks, and the damaru drum signifying creation. Widely regarded as the zenith of Tamil medieval metallurgical art.',
      category_name: 'Metalwork',
      artist_name: 'Devi Prasad',
      period_name: 'Medieval Period',
      location_keyword: 'Decorative Arts',
      origin: 'Thanjavur, Tamil Nadu',
      creation_date: 'c. 1050 CE',
      material: 'Panchaloha (five-metal alloy bronze)',
      dimensions: '76.5 x 62.0 x 22.0 cm',
      weight: '28.2 kg',
      condition: 'excellent',
      acquisition_date: '1965-02-28',
      acquisition_method: 'purchase',
      ownership_status: 'owned',
      status: 'active',
      is_public: true,
    },
    // 4. Painting - Mughal Empire
    {
      accession_number: 'MCMS-2024-004',
      name: 'Mughal Court Durbar of Emperor Jahangir',
      description: 'Fine miniature painting on multi-layered wasli paper depicting Emperor Jahangir granting audience to European envoys and courtiers. Rendered with microscopic brushwork, pure gold leaf application, and lapis lazuli pigments highlighting courtly silks and carpets. Signed in subtle Persian nasta\'liq script by imperial master painters.',
      category_name: 'Painting',
      artist_name: 'Master Bihari',
      period_name: 'Mughal Empire',
      location_keyword: 'Ancient Art Wing',
      origin: 'Agra, Mughal Empire',
      creation_date: 'c. 1618 CE',
      material: 'Opaque watercolor, gold leaf, and ink on wasli paper',
      dimensions: '38.2 x 26.5 cm',
      weight: '0.35 kg',
      condition: 'excellent',
      acquisition_date: '1980-06-15',
      acquisition_method: 'purchase',
      ownership_status: 'owned',
      status: 'active',
      is_public: true,
    },
    // 5. Textile - Colonial Era
    {
      accession_number: 'MCMS-2024-005',
      name: 'Gujarati Double-Ikat Patola Saree',
      description: 'Magnificent ceremonial silk saree woven using the intricate double-ikat technique where both warp and weft threads are resist-dyed before weaving. Features the traditional "chhabdi bhat" (basket of flowers) geometric motif bounded by dancing parrots and elephant borders. Naturally dyed using madder root, indigo, and pomegranate rinds.',
      category_name: 'Textile',
      artist_name: 'Ram Singh Mali',
      period_name: 'Colonial Era',
      location_keyword: 'Textile Gallery',
      origin: 'Patan, Gujarat',
      creation_date: 'c. 1895 CE',
      material: 'Double-ikat mulberry silk with natural plant dyes',
      dimensions: '520.0 x 118.0 cm',
      weight: '0.78 kg',
      condition: 'good',
      acquisition_date: '1990-11-20',
      acquisition_method: 'donation',
      ownership_status: 'owned',
      status: 'active',
      is_public: true,
    },
    // 6. Sculpture - Gupta Empire
    {
      accession_number: 'MCMS-2024-006',
      name: 'Gupta Era Sarnath Standing Buddha',
      description: 'Classical sandstone sculpture portraying Gautama Buddha in varadamudra (gesture of granting boons) with clinging sheer monastic robes. Carved from pale buff sandstone characteristic of the Sarnath workshop, showing a serene smiling countenance, snail-shell curls, and elongated earlobes. Embodying the spiritual equilibrium and artistic perfection of India\'s Golden Age.',
      category_name: 'Sculpture',
      artist_name: 'Unknown Ancient Sculptor',
      period_name: 'Gupta Empire',
      location_keyword: 'Ancient Art Wing',
      origin: 'Sarnath, Uttar Pradesh',
      creation_date: 'c. 475 CE',
      material: 'Chunar buff sandstone',
      dimensions: '98.0 x 42.0 x 26.0 cm',
      weight: '64.0 kg',
      condition: 'restored',
      acquisition_date: '1960-03-10',
      acquisition_method: 'excavation',
      ownership_status: 'owned',
      status: 'active',
      is_public: true,
    },
    // 7. Arms & Armor - Mughal Empire
    {
      accession_number: 'MCMS-2024-007',
      name: 'Mughal Damascus Steel Talwar with Jade Hilt',
      description: 'Curved ceremonial single-edged saber forged from crucible Damascus steel (wootz) displaying distinctive watered crystal patterns. The hilt is carved from nephrite white mutton-fat jade inlaid with rubies and emeralds using the kundan gold-setting technique. Bears an inscribed gold cartouche praising royal martial valor.',
      category_name: 'Arms & Armor',
      artist_name: null,
      period_name: 'Mughal Empire',
      location_keyword: 'Decorative Arts',
      origin: 'Delhi Imperial Armory',
      creation_date: 'c. 1680 CE',
      material: 'Wootz steel, mutton-fat jade, rubies, gold inlay',
      dimensions: '92.5 x 11.0 x 4.2 cm',
      weight: '1.25 kg',
      condition: 'excellent',
      acquisition_date: '1978-09-04',
      acquisition_method: 'bequest',
      ownership_status: 'owned',
      status: 'active',
      is_public: true,
    },
    // 8. Jewelry - Colonial Era
    {
      accession_number: 'MCMS-2024-008',
      name: 'Navaratna Royal Choker Necklace',
      description: 'Imperial nine-gem talismanic choker featuring uncut diamonds, natural Burmese rubies, emeralds, pearls, and blue sapphire mounted in pure 24-karat gold. The reverse side is entirely decorated in brilliant floral Meenakari enamel on a white and green base. Originating from the royal treasury of Jaipur, worn during coronation ceremonies.',
      category_name: 'Jewelry',
      artist_name: null,
      period_name: 'Colonial Era',
      location_keyword: 'Decorative Arts',
      origin: 'Jaipur, Rajasthan',
      creation_date: 'c. 1870 CE',
      material: '24k gold, navaratna gemstones, natural pearls, vitreous enamel',
      dimensions: '24.0 x 6.5 x 1.2 cm',
      weight: '0.24 kg',
      condition: 'excellent',
      acquisition_date: '1988-12-14',
      acquisition_method: 'purchase',
      ownership_status: 'owned',
      status: 'active',
      is_public: true,
    },
    // 9. Manuscript - Medieval Period
    {
      accession_number: 'MCMS-2024-009',
      name: 'Pala Illustrated Ashtasahasrika Prajnaparamita',
      description: 'Eleventh-century preserved palm-leaf folios containing the Buddhist Perfection of Wisdom treatise in eastern Sanskrit script. Embellished with vivid micro-illuminations of Tara and Bodhisattva Avalokiteshvara in mineral gouache. Encased between two carved wooden covers depicting the life of Shakyamuni Buddha.',
      category_name: 'Manuscript',
      artist_name: null,
      period_name: 'Medieval Period',
      location_keyword: 'Ancient Art Wing',
      origin: 'Nalanda Mahavihara, Bihar',
      creation_date: 'c. 1090 CE',
      material: 'Corypha talipot palm leaf, ink, mineral pigments, teak wood',
      dimensions: '54.5 x 6.0 x 4.8 cm',
      weight: '0.92 kg',
      condition: 'fair',
      acquisition_date: '1968-07-22',
      acquisition_method: 'donation',
      ownership_status: 'owned',
      status: 'active',
      is_public: true,
    },
    // 10. Pottery - Indus Valley
    {
      accession_number: 'MCMS-2024-010',
      name: 'Indus Terracotta Painted Storage Urn',
      description: 'Large globular storage vessel ornamented with interlocking circle motifs, peacocks, and pipal tree leaves in rich black pigment over red terracotta slip. Used in proto-urban households of Lothal for storing grain and clarified butter. Features a heavy collared rim and concave neck designed for taut cloth bindings.',
      category_name: 'Pottery',
      artist_name: 'Unknown Harappan Artisan',
      period_name: 'Indus Valley Civilization',
      location_keyword: 'Ancient Art Wing',
      origin: 'Lothal, Gujarat',
      creation_date: 'c. 2200 BCE',
      material: 'Terracotta, black manganese pigment, red iron oxide slip',
      dimensions: '46.0 x 42.0 x 42.0 cm',
      weight: '8.4 kg',
      condition: 'restored',
      acquisition_date: '1975-01-19',
      acquisition_method: 'excavation',
      ownership_status: 'owned',
      status: 'active',
      is_public: true,
    },
    // 11. Painting - Colonial Era
    {
      accession_number: 'MCMS-2024-011',
      name: 'Procession of the Delhi Resident and Raja',
      description: 'Company School panoramic painting recording the ceremonial diplomatic procession of British resident William Fraser alongside Mughal dignitaries. Painted with realistic British watercolor shading fused with traditional Mughal compositional hierarchy. Signed by renowned Delhi master Ghulam Ali Khan.',
      category_name: 'Painting',
      artist_name: 'Ghulam Ali Khan',
      period_name: 'Colonial Era',
      location_keyword: 'Ancient Art Wing',
      origin: 'Shahjahanabad, Delhi',
      creation_date: 'c. 1825 CE',
      material: 'Watercolour and gouache on imported English paper',
      dimensions: '45.0 x 62.5 cm',
      weight: '0.4 kg',
      condition: 'good',
      acquisition_date: '1983-05-18',
      acquisition_method: 'purchase',
      ownership_status: 'owned',
      status: 'active',
      is_public: true,
    },
    // 12. Textile - Mughal Empire
    {
      accession_number: 'MCMS-2024-012',
      name: 'Mughal Embroidered Pashmina Shawl',
      description: 'Exquisite winter royal shoulder mantle woven with fine Himalayan mountain goat pashm wool using wooden bobbins (kanis). Shows an opulent field of cypress cones, twisting almond florals, and gold thread needlework borders. Retains remarkable softness and vibrancy despite centuries of ceremonial wear.',
      category_name: 'Textile',
      artist_name: null,
      period_name: 'Mughal Empire',
      location_keyword: 'Textile Gallery',
      origin: 'Srinagar, Kashmir',
      creation_date: 'c. 1675 CE',
      material: 'Cashmere wool (pashm), silk embroidery, gold zari thread',
      dimensions: '280.0 x 135.0 cm',
      weight: '0.45 kg',
      condition: 'good',
      acquisition_date: '1995-08-30',
      acquisition_method: 'purchase',
      ownership_status: 'owned',
      status: 'active',
      is_public: true,
    },
    // 13. Metalwork - Indus Valley
    {
      accession_number: 'MCMS-2024-013',
      name: 'Harappan Dancing Girl Replica Icon',
      description: 'Bronze statuette cast using the cire-perdue method depicting a young woman standing in a relaxed tribhanga posture with one hand on her hip. Adorned with bangles stacking up her left arm, a cowrie shell necklace, and stylized hair gathered in a bun. Reflects advanced metallurgical proficiency of Indus urban casting found at Mohenjo-daro.',
      category_name: 'Metalwork',
      artist_name: 'Unknown Harappan Artisan',
      period_name: 'Indus Valley Civilization',
      location_keyword: 'Ancient Art Wing',
      origin: 'Mohenjo-daro, Indus Valley',
      creation_date: 'c. 2300 BCE',
      material: 'Cast bronze with greenish patina',
      dimensions: '10.8 x 5.0 x 2.8 cm',
      weight: '0.32 kg',
      condition: 'good',
      acquisition_date: '1981-03-24',
      acquisition_method: 'exchange',
      ownership_status: 'owned',
      status: 'active',
      is_public: true,
    },
    // 14. Jewelry - Indus Valley
    {
      accession_number: 'MCMS-2024-014',
      name: 'Harappan Carnelian and Steatite Bead Girdle',
      description: 'Multi-strand ceremonial girdle composed of elongated biconical carnelian beads etched with alkali white geometric patterns, separated by micro-steatite beads. Carnelian beads required weeks of diamond-tip drilling, demonstrating specialized Indus craft guild networks. Unearthed during stratigraphic excavations in the lower town sector.',
      category_name: 'Jewelry',
      artist_name: 'Unknown Harappan Artisan',
      period_name: 'Indus Valley Civilization',
      location_keyword: 'Decorative Arts',
      origin: 'Chanhudaro, Indus Valley',
      creation_date: 'c. 2100 BCE',
      material: 'Etched carnelian, glazed steatite, gold end-caps',
      dimensions: '74.0 x 4.5 x 0.8 cm',
      weight: '0.28 kg',
      condition: 'excellent',
      acquisition_date: '1979-11-12',
      acquisition_method: 'excavation',
      ownership_status: 'owned',
      status: 'active',
      is_public: true,
    },
    // 15. Arms & Armor - Medieval Period
    {
      accession_number: 'MCMS-2024-015',
      name: 'Maratha Steel Dhal Shield with Gilded Bosses',
      description: 'Circular combat buckler beaten from hardened carbon steel and reinforced with four ornate gilded brass bosses backed by hand-stitched leather. The convex exterior is incised with fighting floral vines and sun motifs surrounded by Persian couplets wishing victory. Fitted with a crimson velvet inner cushion and knuckle grip.',
      category_name: 'Arms & Armor',
      artist_name: null,
      period_name: 'Medieval Period',
      location_keyword: 'Decorative Arts',
      origin: 'Satara, Maharashtra',
      creation_date: 'c. 1720 CE',
      material: 'Crucible steel, fire-gilt brass, hide, velvet',
      dimensions: '42.5 x 42.5 x 7.0 cm',
      weight: '2.1 kg',
      condition: 'good',
      acquisition_date: '1998-02-15',
      acquisition_method: 'purchase',
      ownership_status: 'owned',
      status: 'active',
      is_public: true,
    },
    // 16. Manuscript - Mughal Empire
    {
      accession_number: 'MCMS-2024-016',
      name: 'Illuminated Mughal Shahnama Folio',
      description: 'Single leaf from an imperial manuscript of the Persian Book of Kings detailing Rustam battling the White Div in Mount Damavand. Text penned in elegant four-column nasta\'liq script by royal calligraphers with margins showered in pure gold flakes. The reverse features floral arabesques painted in ultramarine and cinnabar.',
      category_name: 'Manuscript',
      artist_name: 'Master Bihari',
      period_name: 'Mughal Empire',
      location_keyword: 'Ancient Art Wing',
      origin: 'Lahore, Mughal Empire',
      creation_date: 'c. 1605 CE',
      material: 'Wasli rag paper, gold leaf, lapis lazuli, lampblack ink',
      dimensions: '41.0 x 28.5 cm',
      weight: '0.15 kg',
      condition: 'good',
      acquisition_date: '2002-09-08',
      acquisition_method: 'purchase',
      ownership_status: 'owned',
      status: 'active',
      is_public: true,
    },
    // 17. Sculpture - Medieval Period
    {
      accession_number: 'MCMS-2024-017',
      name: 'Chandela Khajuraho Celestial Apsara Relief',
      description: 'High-relief architectural fragment depicting a celestial maiden (surasundari) applying collyrium to her eyes while turning her body gracefully. Rendered in deep warm buff sandstone with exquisite anatomical proportions and flowing drapery characteristic of northern temple architecture. Salvaged from temple ruins in the Bundelkhand plateau.',
      category_name: 'Sculpture',
      artist_name: null,
      period_name: 'Medieval Period',
      location_keyword: 'Ancient Art Wing',
      origin: 'Khajuraho, Madhya Pradesh',
      creation_date: 'c. 1020 CE',
      material: 'Panna buff sandstone',
      dimensions: '72.0 x 28.0 x 19.5 cm',
      weight: '34.0 kg',
      condition: 'fair',
      acquisition_date: '1964-05-11',
      acquisition_method: 'donation',
      ownership_status: 'owned',
      status: 'active',
      is_public: true,
    },
    // 18. Textile - Medieval Period
    {
      accession_number: 'MCMS-2024-018',
      name: 'Coromandel Coast Kalamkari Temple Hanging',
      description: 'Monumental cotton temple cloth hand-drawn with a reed pen (kalam) and vegetable-dyed illustrating episodes from the Ramayana epic. Features multi-register narrative panels with Telugu explanatory cartouches and rich madder red and indigo tones. Commissioned by coastal merchant guilds for display during annual temple car festivals.',
      category_name: 'Textile',
      artist_name: null,
      period_name: 'Medieval Period',
      location_keyword: 'Textile Gallery',
      origin: 'Machilipatnam, Andhra Pradesh',
      creation_date: 'c. 1740 CE',
      material: 'Mordant-printed and hand-painted cotton with natural plant dyes',
      dimensions: '380.0 x 160.0 cm',
      weight: '1.85 kg',
      condition: 'fair',
      acquisition_date: '1987-03-29',
      acquisition_method: 'field_collection',
      ownership_status: 'owned',
      status: 'active',
      is_public: true,
    },
    // 19. Painting - Mughal Empire
    {
      accession_number: 'MCMS-2024-019',
      name: 'Radha and Krishna in the Grove',
      description: 'Lyrical Rajasthani miniature portraying divine lovers seated beneath flowering kadamba trees by the lotus-filled lake of Kishangarh. Celebrated for its elongated arched eyes, sharp arched brows, and glowing moonlit horizon rendered in gossamer gouache. Reflects the mystical devotional poetry of Sawant Singh (Nagari Das).',
      category_name: 'Painting',
      artist_name: null,
      period_name: 'Mughal Empire',
      location_keyword: 'Ancient Art Wing',
      origin: 'Kishangarh, Rajasthan',
      creation_date: 'c. 1760 CE',
      material: 'Opaque pigment, gold powder, and gum arabic on handmade paper',
      dimensions: '32.0 x 22.4 cm',
      weight: '0.22 kg',
      condition: 'excellent',
      acquisition_date: '1994-04-16',
      acquisition_method: 'donation',
      ownership_status: 'owned',
      status: 'active',
      is_public: true,
    },
    // 20. Pottery - Maurya Empire
    {
      accession_number: 'MCMS-2024-020',
      name: 'Northern Black Polished Ware Bowl',
      description: 'Fine deluxe tableware vessel exhibiting the lustrous jet-black metallic sheen hallmark of the Mauryan urbanization horizon. Produced from levigated clay fired under high-temperature reducing conditions, resulting in an exceptionally thin, vitrified ceramic body. Recovered intact from stratified habitation layers in ancient Magadha.',
      category_name: 'Pottery',
      artist_name: 'Unknown Ancient Sculptor',
      period_name: 'Maurya Empire',
      location_keyword: 'Ancient Art Wing',
      origin: 'Rajgir, Magadha, Bihar',
      creation_date: 'c. 300 BCE',
      material: 'Fine levigated clay with iron-rich slip and metallic glaze',
      dimensions: '8.5 x 15.2 x 15.2 cm',
      weight: '0.42 kg',
      condition: 'excellent',
      acquisition_date: '1976-08-14',
      acquisition_method: 'excavation',
      ownership_status: 'owned',
      status: 'active',
      is_public: true,
    },
    // 21. Metalwork - Colonial Era
    {
      accession_number: 'MCMS-2024-021',
      name: 'Kerala Bronze Deepam Peacock Ritual Lamp',
      description: 'Towering multi-tier ceremonial oil lamp cast in solid bell metal topped with a crested dancing peacock with open plumage. Designed with oil reservoirs capable of holding sixty cotton wicks for nocturnal temple sanctum illuminations. Hand-turned and chased with precision lotus petal moldings around its heavy circular base.',
      category_name: 'Metalwork',
      artist_name: 'Devi Prasad',
      period_name: 'Colonial Era',
      location_keyword: 'Decorative Arts',
      origin: 'Mannar, Kerala',
      creation_date: 'c. 1890 CE',
      material: 'Bell metal (copper-tin bronze alloy)',
      dimensions: '125.0 x 48.0 x 48.0 cm',
      weight: '32.0 kg',
      condition: 'excellent',
      acquisition_date: '2004-10-05',
      acquisition_method: 'donation',
      ownership_status: 'owned',
      status: 'active',
      is_public: true,
    },
    // 22. Jewelry - Gupta Empire
    {
      accession_number: 'MCMS-2024-022',
      name: 'Gupta Imperial Gold Dinar of Samudragupta',
      description: 'Classical numismatic coin commemorating the imperial Ashvamedha (horse sacrifice) Vedic ceremony. The obverse depicts the caparisoned sacred stallion standing before an yupa sacrificial post with Brahmi legends, while the reverse displays Queen Dattadevi holding a fly-whisk. Struck from high-purity refined alluvial gold with sharp epigraphic relief.',
      category_name: 'Jewelry',
      artist_name: null,
      period_name: 'Gupta Empire',
      location_keyword: 'Decorative Arts',
      origin: 'Pataliputra, Bihar',
      creation_date: 'c. 360 CE',
      material: 'High-purity gold (98% Au)',
      dimensions: '2.1 x 2.1 x 0.2 cm',
      weight: '7.8 g',
      condition: 'excellent',
      acquisition_date: '1970-12-01',
      acquisition_method: 'purchase',
      ownership_status: 'owned',
      status: 'active',
      is_public: true,
    },
    // 23. Manuscript - Medieval Period (In conservation / private)
    {
      accession_number: 'MCMS-2024-023',
      name: 'Birch-Bark Sharada Script Vedic Hymnal',
      description: 'Ancient birch-bark (bhurjapatra) manuscript preserving Atharvaveda recitations penned in the historic Sharada script of Kashmir. The fragile bark folios were treated with natural cedar oils and stitched using wild tussar silk cordage. Displays red pigment section dividers and marginal scholarly glosses in Sanskrit.',
      category_name: 'Manuscript',
      artist_name: null,
      period_name: 'Medieval Period',
      location_keyword: 'Ancient Art Wing',
      origin: 'Kashmir Valley',
      creation_date: 'c. 1150 CE',
      material: 'Himalayan birch bark, carbon soot ink, cinnabar, silk thread',
      dimensions: '22.5 x 16.0 x 3.2 cm',
      weight: '0.38 kg',
      condition: 'poor',
      acquisition_date: '1958-06-20',
      acquisition_method: 'field_collection',
      ownership_status: 'owned',
      status: 'in_conservation',
      is_public: false,
    },
    // 24. Arms & Armor - Mughal Empire (On loan / archived)
    {
      accession_number: 'MCMS-2024-024',
      name: 'Mughal Chiseled Steel Katar Punch Dagger',
      description: 'Thrusting push-dagger featuring an H-shaped dual-crossbar grip and reinforced armor-piercing blade chiseled with hunting cheetahs and gazelles. Forged from high-grade wootz steel with fullers inlaid with micro gold floral cartouches. Stored in its original red velvet wooden sheath with pierced brass chape.',
      category_name: 'Arms & Armor',
      artist_name: null,
      period_name: 'Mughal Empire',
      location_keyword: 'Decorative Arts',
      origin: 'Lahore, Punjab',
      creation_date: 'c. 1640 CE',
      material: 'Chiseled wootz steel, gold damascening, velvet-covered wood',
      dimensions: '39.0 x 9.5 x 2.4 cm',
      weight: '0.65 kg',
      condition: 'good',
      acquisition_date: '1986-07-17',
      acquisition_method: 'purchase',
      ownership_status: 'owned',
      status: 'on_loan',
      is_public: true,
    },
  ];

  console.log(`\n📦 [STEP 3 & 4] Seeding ${rawArtifacts.length} artifacts and generating SVG placeholders...`);

  const createdArtifactDocs = new Map();

  for (const item of rawArtifacts) {
    const catDoc = getCategory(item.category_name);
    const artistDoc = getArtist(item.artist_name);
    const periodDoc = getPeriod(item.period_name);
    const locDoc = getLocation(item.location_keyword);

    if (!catDoc) throw new Error(`Category "${item.category_name}" not found in DB`);
    if (!periodDoc) throw new Error(`Period "${item.period_name}" not found in DB`);
    if (!locDoc) throw new Error(`Location matching "${item.location_keyword}" not found in DB`);

    let artifactDoc = await Artifact.findOne({ accession_number: item.accession_number });
    let created = false;

    if (!artifactDoc) {
      artifactDoc = await Artifact.create({
        accession_number: item.accession_number,
        name: item.name,
        description: item.description,
        category_id: catDoc._id,
        artist_id: artistDoc ? artistDoc._id : null,
        historical_period_id: periodDoc._id,
        origin: item.origin,
        creation_date: item.creation_date,
        material: item.material,
        dimensions: item.dimensions,
        weight: item.weight,
        condition: item.condition,
        acquisition_date: item.acquisition_date,
        acquisition_method: item.acquisition_method,
        ownership_status: item.ownership_status,
        current_location_id: locDoc._id,
        status: item.status,
        is_public: item.is_public,
        created_by: adminUser._id,
      });
      created = true;
      console.log(`  + [Created Artifact] ${item.accession_number}: ${item.name}`);
    } else {
      console.log(`  = [Existing Artifact] ${item.accession_number}: ${item.name} (skipped creation)`);
    }

    createdArtifactDocs.set(item.accession_number, artifactDoc);

    // STEP 4: SVG Placeholder generation
    const svgFilename = `artifact-${item.accession_number.toLowerCase().replace(/[^a-z0-9]/g, '-')}.svg`;
    const svgFilePath = path.join(uploadsDir, svgFilename);

    if (!fs.existsSync(svgFilePath)) {
      const svgContent = generateArtifactSvg({
        name: item.name,
        categoryName: item.category_name,
        accessionNumber: item.accession_number,
        periodName: item.period_name,
        material: item.material,
      });
      fs.writeFileSync(svgFilePath, svgContent, 'utf-8');
      console.log(`    ↳ Generated SVG: ${svgFilename}`);
    }

    // Check primary image record in ArtifactImage
    const imageUrl = `http://localhost:5000/uploads/${svgFilename}`;
    const existingImage = await ArtifactImage.findOne({ artifact_id: artifactDoc._id });
    if (!existingImage) {
      await ArtifactImage.create({
        artifact_id: artifactDoc._id,
        image_url: imageUrl,
        caption: `${item.name} - Primary Gallery View`,
        is_primary: true,
        uploaded_by: adminUser._id,
      });
      console.log(`    ↳ Created primary image record: ${imageUrl}`);
    } else {
      console.log(`    ↳ Image record already present for ${item.accession_number}`);
    }
  }

  // STEP 5: Exhibitions, Provenance, and Conservation
  console.log('\n🏛️  [STEP 5] Seeding 4 exhibitions...');

  const exhibitionsData = [
    {
      title: 'Echoes of the Indus: Dawn of Subcontinental Civilizations',
      description: 'A retrospective archaeological survey showcasing urban craftsmanship, metallurgy, bead-making technologies, and ceramic forms across Harappan civilization centers.',
      start_date: '2024-01-15',
      end_date: '2024-07-20',
      status: 'ended',
      location_keyword: 'Ancient Art Wing',
      categoryColor: '#8E2800',
      artifacts: [
        'MCMS-2024-001', // Perforated Jar
        'MCMS-2024-010', // Painted Urn
        'MCMS-2024-013', // Dancing Girl Bronze
        'MCMS-2024-014', // Carnelian Girdle
        'MCMS-2024-002', // Mauryan Yakshi
        'MCMS-2024-020', // NBPW Bowl
      ],
    },
    {
      title: 'Splendors of the Imperial Mughal Court',
      description: 'An exploration of refined Mughal court culture, featuring imperial miniature portraiture, fine damascened weaponry, jewel-encrusted regalia, and opulent woven silks.',
      start_date: '2026-06-01',
      end_date: '2026-12-31',
      status: 'active',
      location_keyword: 'Ancient Art Wing',
      categoryColor: '#1B3B52',
      artifacts: [
        'MCMS-2024-004', // Jahangir Durbar
        'MCMS-2024-007', // Damascus Talwar
        'MCMS-2024-012', // Pashmina Shawl
        'MCMS-2024-016', // Shahnama Folio
        'MCMS-2024-019', // Radha Krishna
        'MCMS-2024-024', // Chiseled Katar
        'MCMS-2024-008', // Navaratna Choker
      ],
    },
    {
      title: 'Sacred Bronzes & Temple Sculpture of Ancient India',
      description: 'Tracing divine iconography from Mauryan polish and classical Gupta spirituality to towering Medieval Chola bronzes and sacred architectural reliefs.',
      start_date: '2026-08-15',
      end_date: '2027-02-28',
      status: 'active',
      location_keyword: 'Decorative Arts',
      categoryColor: '#24403E',
      artifacts: [
        'MCMS-2024-003', // Chola Nataraja
        'MCMS-2024-006', // Sarnath Buddha
        'MCMS-2024-017', // Khajuraho Apsara
        'MCMS-2024-021', // Kerala Deepam
        'MCMS-2024-009', // Pala Prajnaparamita
        'MCMS-2024-022', // Gupta Gold Dinar
      ],
    },
    {
      title: 'Threads of Gold: Historic Indian Textiles & Adornments',
      description: 'A grand celebration of subcontinental textile heritage and goldsmithing traditions, spotlighting double-ikat silk weaving, kalamkari tapestries, and royal gems.',
      start_date: '2026-11-15',
      end_date: '2027-05-31',
      status: 'upcoming',
      location_keyword: 'Textile Gallery',
      categoryColor: '#6B1D2F',
      artifacts: [
        'MCMS-2024-005', // Gujarati Patola
        'MCMS-2024-012', // Pashmina Shawl
        'MCMS-2024-018', // Kalamkari Hanging
        'MCMS-2024-008', // Navaratna Choker
        'MCMS-2024-014', // Carnelian Girdle
        'MCMS-2024-011', // Delhi Procession
      ],
    },
  ];

  for (let i = 0; i < exhibitionsData.length; i++) {
    const exh = exhibitionsData[i];
    const locDoc = getLocation(exh.location_keyword);

    // Generate exhibition cover SVG
    const coverFilename = `exhibition-${i + 1}.svg`;
    const coverFilePath = path.join(uploadsDir, coverFilename);
    if (!fs.existsSync(coverFilePath)) {
      const coverSvg = generateExhibitionSvg({
        title: exh.title,
        statusText: exh.status,
        dateText: `${exh.start_date} to ${exh.end_date}`,
        categoryColor: exh.categoryColor,
      });
      fs.writeFileSync(coverFilePath, coverSvg, 'utf-8');
      console.log(`  ↳ Generated Exhibition SVG: ${coverFilename}`);
    }
    const coverUrl = `http://localhost:5000/uploads/${coverFilename}`;

    const existingExh = await Exhibition.findOne({
      $or: [{ title: exh.title }, { name: exh.title }],
    });

    if (!existingExh) {
      const exhibitionArtifacts = exh.artifacts
        .map((acc, index) => {
          const doc = createdArtifactDocs.get(acc);
          if (!doc) return null;
          return {
            artifact_id: doc._id,
            display_order: index + 1,
            notes: `Featured item in ${exh.title}`,
          };
        })
        .filter(Boolean);

      await Exhibition.create({
        title: exh.title,
        name: exh.title,
        description: exh.description,
        start_date: exh.start_date,
        end_date: exh.end_date,
        status: exh.status,
        location_id: locDoc ? locDoc._id : null,
        curator_id: adminUser._id,
        cover_image_url: coverUrl,
        exhibition_artifacts: exhibitionArtifacts,
      });
      console.log(`  + [Created Exhibition] ${exh.title} (${exhibitionArtifacts.length} artifacts)`);
    } else {
      console.log(`  = [Existing Exhibition] ${exh.title} (skipped creation)`);
    }
  }

  // Provenance Records (10 records across different artifacts)
  console.log('\n📜 [STEP 5] Seeding 10 provenance records...');
  const provenanceData = [
    {
      accession_number: 'MCMS-2024-001',
      owner_name: 'Archaeological Survey of India Field Depot',
      ownership_type: 'government',
      era_or_date: '1924 - 1985',
      start_date: '1924-02-10',
      end_date: '1985-04-12',
      transfer_method: 'Archaeological Excavation and Central Repository Transfer',
      location: 'Harappa Site Field Repository, Punjab',
      description: 'Excavated during Sir John Marshall\'s systematic survey of the lower citadel mound, recorded under excavation lot #H-42.',
      supporting_documentation: 'ASI Excavation Register Book III, Entry #42 (1924)',
    },
    {
      accession_number: 'MCMS-2024-002',
      owner_name: 'Patna Antiquities Society',
      ownership_type: 'institutional',
      era_or_date: '1917 - 1972',
      start_date: '1917-10-15',
      end_date: '1972-10-18',
      transfer_method: 'Donation by Founding Trustee Dr. D. B. Spooner',
      location: 'Patna, Bihar',
      description: 'Preserved in the private collection of the founding trustee before formal institutional accessioning.',
      supporting_documentation: 'Society Minutes Vol 4, folio 18, 1917',
    },
    {
      accession_number: 'MCMS-2024-003',
      owner_name: 'Brihadisvara Temple Devasthanam',
      ownership_type: 'religious',
      era_or_date: 'c. 1050 - 1965',
      start_date: '1050-01-01',
      end_date: '1965-02-28',
      transfer_method: 'Temple Trust Heritage Custody Transfer',
      location: 'Thanjavur, Tamil Nadu',
      description: 'Sanctified and worshipped in the outer mandapa storage until relocated to safe museum vault keeping.',
      supporting_documentation: 'Devasthanam Vault Registry entry #T-105',
    },
    {
      accession_number: 'MCMS-2024-004',
      owner_name: 'Imperial Library of Awadh',
      ownership_type: 'private',
      era_or_date: '1760 - 1856',
      start_date: '1760-01-01',
      end_date: '1856-02-07',
      transfer_method: 'Royal Court Succession',
      location: 'Lucknow, Uttar Pradesh',
      description: 'Cataloged in the royal muraqqa (album) of Nawab Shuja-ud-Daula before entering private noble holding.',
      supporting_documentation: 'Seal of the Royal Librarian of Awadh on verso',
    },
    {
      accession_number: 'MCMS-2024-005',
      owner_name: 'Salvi Master Weavers Guild Archive',
      ownership_type: 'institutional',
      era_or_date: '1895 - 1990',
      start_date: '1895-05-12',
      end_date: '1990-11-20',
      transfer_method: 'Guild Master Donation',
      location: 'Patan, Gujarat',
      description: 'Preserved by three generations of master weavers as a benchmark pattern sample for double-ikat craftsmanship.',
      supporting_documentation: 'Guild Registry Certificate of Heritage Authenticity #SM-895',
    },
    {
      accession_number: 'MCMS-2024-007',
      owner_name: 'Nawab of Rampur Armory Trust',
      ownership_type: 'private',
      era_or_date: '1801 - 1978',
      start_date: '1801-04-10',
      end_date: '1978-09-04',
      transfer_method: 'Estate Bequest to the Public Trust',
      location: 'Rampur, Uttar Pradesh',
      description: 'Kept in the Khas Mahal armory case 14 with original velvet-covered scabbard and gilded fixtures.',
      supporting_documentation: 'Rampur State Armory Catalog #RA-78',
    },
    {
      accession_number: 'MCMS-2024-008',
      owner_name: 'Jaipur Durbar Treasury (Zenana Deorhi)',
      ownership_type: 'private',
      era_or_date: '1870 - 1988',
      start_date: '1870-01-01',
      end_date: '1988-12-14',
      transfer_method: 'Direct Acquisition from Royal Estate Trust',
      location: 'City Palace, Jaipur, Rajasthan',
      description: 'Commissioned under Maharaja Ram Singh II for royal family ceremonial wear.',
      supporting_documentation: 'Toshakhana Inventory Roll of 1884, folio 92',
    },
    {
      accession_number: 'MCMS-2024-009',
      owner_name: 'Tibetan Monastic Repository of Sakya',
      ownership_type: 'religious',
      era_or_date: 'c. 1205 - 1968',
      start_date: '1205-06-01',
      end_date: '1968-07-22',
      transfer_method: 'Preservation Gift by Lama Kunga Rinpoche',
      location: 'Dharamsala, Himachal Pradesh',
      description: 'Carried across Himalayan passes during the 13th-century dispersals and guarded in cedar wood chests.',
      supporting_documentation: 'Gift Letter signed by Lama Kunga Rinpoche (1968)',
    },
    {
      accession_number: 'MCMS-2024-015',
      owner_name: 'Bhosale Family Military Archive',
      ownership_type: 'private',
      era_or_date: '1725 - 1998',
      start_date: '1725-03-15',
      end_date: '1998-02-15',
      transfer_method: 'Purchase via Numismatic and Antiquities Guild',
      location: 'Satara, Maharashtra',
      description: 'Inherited down five generations of Maratha cavalry officers who participated in Konkan campaigns.',
      supporting_documentation: 'Deed of Sale and Authenticity Dossier #BM-1725',
    },
    {
      accession_number: 'MCMS-2024-022',
      owner_name: 'Calcutta Coin Cabinet & Antiquity Society',
      ownership_type: 'institutional',
      era_or_date: '1935 - 1970',
      start_date: '1935-08-11',
      end_date: '1970-12-01',
      transfer_method: 'Institutional Transfer Agreement',
      location: 'Kolkata, West Bengal',
      description: 'Recovered from the Bayana hoard find in eastern Rajasthan and cataloged under entry #B-1944.',
      supporting_documentation: 'Bayana Hoard Descriptive Catalog #714',
    },
  ];

  for (const prov of provenanceData) {
    const artDoc = createdArtifactDocs.get(prov.accession_number);
    if (!artDoc) continue;

    const existingProv = await ProvenanceRecord.findOne({
      artifact_id: artDoc._id,
      owner_name: prov.owner_name,
      start_date: prov.start_date,
    });

    if (!existingProv) {
      await ProvenanceRecord.create({
        artifact_id: artDoc._id,
        owner_name: prov.owner_name,
        ownership_type: prov.ownership_type,
        era_or_date: prov.era_or_date,
        start_date: prov.start_date,
        end_date: prov.end_date,
        transfer_method: prov.transfer_method,
        location: prov.location,
        description: prov.description,
        supporting_documentation: prov.supporting_documentation,
        created_by: adminUser._id,
      });
      console.log(`  + [Created Provenance] ${prov.accession_number} -> ${prov.owner_name}`);
    } else {
      console.log(`  = [Existing Provenance] ${prov.accession_number} -> ${prov.owner_name} (skipped)`);
    }
  }

  // Conservation Records (10 records across different artifacts)
  console.log('\n🔬 [STEP 5] Seeding 10 conservation records...');
  const conservationData = [
    {
      accession_number: 'MCMS-2024-001',
      assessment_date: '2024-04-10',
      condition: 'good',
      treatment_description: 'Gentle chemical desiccation, consolidation of friable clay micro-fractures using 5% Paraloid B-72 in acetone, and removal of surface salts.',
      conservator_name: 'Dr. Sunita Sharma (Chief Archaeological Conservator)',
      cost: 14500,
      treatment_date: '2024-04-25',
      next_inspection_date: '2027-04-25',
      notes: 'Saline efflorescence stabilized. Relative humidity in display case must be maintained between 45% and 50%.',
    },
    {
      accession_number: 'MCMS-2024-003',
      assessment_date: '2023-11-15',
      condition: 'excellent',
      treatment_description: 'Mechanical removal of bronze disease spots with sodium sesquicarbonate buffer, followed by microcrystalline Renaissance wax barrier application.',
      conservator_name: 'Priya Nair (Metals Specialist)',
      cost: 28000,
      treatment_date: '2023-12-02',
      next_inspection_date: '2026-12-02',
      notes: 'Prabhamandala joint stress checked with ultrasonic testing. No active cuprous chloride corrosion detected.',
    },
    {
      accession_number: 'MCMS-2024-005',
      assessment_date: '2024-08-20',
      condition: 'good',
      treatment_description: 'Vacuum suction surface cleaning beneath nylon mesh, ultrasonic humidification chamber relaxing, and stitch stabilization of border fringe.',
      conservator_name: 'Arjun Mehta (Senior Textile Conservator)',
      cost: 32000,
      treatment_date: '2024-09-10',
      next_inspection_date: '2027-09-10',
      notes: 'Natural dyes remain vibrant. Framed in UV-filtering museum acrylic glass under zero-tension support.',
    },
    {
      accession_number: 'MCMS-2024-006',
      assessment_date: '2022-05-18',
      condition: 'restored',
      treatment_description: 'Structural stabilization of fractured pedestal using internal titanium dowel and lime-based mortar infill color-matched to Chunar sandstone.',
      conservator_name: 'Dr. Sunita Sharma (Chief Archaeological Conservator)',
      cost: 54000,
      treatment_date: '2022-06-30',
      next_inspection_date: '2026-06-30',
      notes: 'Pedestal load-bearing capacity re-verified. Micro-vibration sensors active at display base.',
    },
    {
      accession_number: 'MCMS-2024-007',
      assessment_date: '2024-02-14',
      condition: 'excellent',
      treatment_description: 'Degreasing of ancient oil coatings, removal of microscopic ferric oxide deposits, application of synthetic vapor corrosion inhibitor (VCI).',
      conservator_name: 'Priya Nair (Metals Specialist)',
      cost: 18500,
      treatment_date: '2024-02-28',
      next_inspection_date: '2027-02-28',
      notes: 'Jade hilt checked for loose gemstone settings; kundan gold foil remains securely adhered.',
    },
    {
      accession_number: 'MCMS-2024-009',
      assessment_date: '2024-07-05',
      condition: 'fair',
      treatment_description: 'Individual folios humidified and flattened under weight; insect perforations backed with toned Japanese Tengujo kozo tissue.',
      conservator_name: 'Ananya Sengupta (Manuscripts Conservator)',
      cost: 42000,
      treatment_date: '2024-08-01',
      next_inspection_date: '2026-11-01',
      notes: 'Palm leaves treated with cedar oil anti-fungal mist. Kept in climate-controlled archival clam-shell box.',
    },
    {
      accession_number: 'MCMS-2024-012',
      assessment_date: '2023-09-12',
      condition: 'good',
      treatment_description: 'Fiber stabilization using archival silk crepeline backing along worn fold lines; micro-vacuum extraction of historical dust.',
      conservator_name: 'Arjun Mehta (Senior Textile Conservator)',
      cost: 26000,
      treatment_date: '2023-10-04',
      next_inspection_date: '2026-10-04',
      notes: 'Display rotation scheduled every 6 months to prevent gravitational stress on warp threads.',
    },
    {
      accession_number: 'MCMS-2024-015',
      assessment_date: '2024-03-10',
      condition: 'good',
      treatment_description: 'Cleaning of gilded brass bosses with non-abrasive carbonate paste; conditioning of interior leather knuckle grip with lanolin solution.',
      conservator_name: 'Priya Nair (Metals Specialist)',
      cost: 16000,
      treatment_date: '2024-03-22',
      next_inspection_date: '2027-03-22',
      notes: 'Exterior surface sealed with microcrystalline wax to prevent finger-acid discoloration.',
    },
    {
      accession_number: 'MCMS-2024-018',
      assessment_date: '2023-06-18',
      condition: 'fair',
      treatment_description: 'Aqueous bath washing in deionized water with neutral pH surfactant (Vulpex), air-drying on suction table, full linen backing stitching.',
      conservator_name: 'Arjun Mehta (Senior Textile Conservator)',
      cost: 48000,
      treatment_date: '2023-07-28',
      next_inspection_date: '2026-12-15',
      notes: 'Tear along lower register completely stabilized. Light levels restricted to 50 lux.',
    },
    {
      accession_number: 'MCMS-2024-023',
      assessment_date: '2026-01-10',
      condition: 'poor',
      treatment_description: 'Delamination stabilization of separated bark layers with 3% Klucel G in ethanol; encapsulated in inert Melinex polyester film sleeves.',
      conservator_name: 'Ananya Sengupta (Manuscripts Conservator)',
      cost: 38500,
      treatment_date: '2026-02-15',
      next_inspection_date: '2026-10-15',
      notes: 'Currently sequestered in dark conservation lab. Inspection due soon to assess ink adherence.',
    },
  ];

  for (const cons of conservationData) {
    const artDoc = createdArtifactDocs.get(cons.accession_number);
    if (!artDoc) continue;

    const existingCons = await ConservationRecord.findOne({
      artifact_id: artDoc._id,
      assessment_date: cons.assessment_date,
    });

    if (!existingCons) {
      await ConservationRecord.create({
        artifact_id: artDoc._id,
        assessment_date: cons.assessment_date,
        condition: cons.condition,
        treatment: cons.treatment_description,
        treatment_description: cons.treatment_description,
        conservator: cons.conservator_name,
        conservator_name: cons.conservator_name,
        cost: cons.cost,
        treatment_date: cons.treatment_date,
        next_inspection_date: cons.next_inspection_date,
        next_assessment_date: cons.next_inspection_date,
        notes: cons.notes,
        created_by: adminUser._id,
      });
      console.log(`  + [Created Conservation] ${cons.accession_number} (${cons.assessment_date})`);
    } else {
      console.log(`  = [Existing Conservation] ${cons.accession_number} (${cons.assessment_date}) (skipped)`);
    }
  }

  // STEP 6: Print counts
  const [totalArtifacts, totalImages, totalExhibitions, totalProvenance, totalConservation] = await Promise.all([
    Artifact.countDocuments(),
    ArtifactImage.countDocuments(),
    Exhibition.countDocuments(),
    ProvenanceRecord.countDocuments(),
    ConservationRecord.countDocuments(),
  ]);

  console.log('\n======================================================');
  console.log('🎉 Museum Collection Seed Completed Successfully!');
  console.log('================ Current Database Counts ================');
  console.log(`Artifacts:            ${totalArtifacts}`);
  console.log(`Artifact Images:      ${totalImages}`);
  console.log(`Exhibitions:          ${totalExhibitions}`);
  console.log(`Provenance Records:   ${totalProvenance}`);
  console.log(`Conservation Records: ${totalConservation}`);
  console.log('======================================================\n');

  await mongoose.disconnect();
}

seedArtifacts().catch((err) => {
  console.error('❌ Fatal error during artifact seeding:', err);
  process.exit(1);
});
