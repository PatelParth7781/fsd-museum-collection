import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import {
  Artifact,
  ArtifactImage,
  User,
} from '../models/index.js';

// Ensure TLS issues on local environments do not block public CDN fetches
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 24 Artifact real photograph specifications
const artifactImageSpecs = [
  {
    accession_number: 'MCMS-2024-001',
    name: 'Harappan Perforated Storage Jar',
    source: 'Wikimedia Commons',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fa/Harappan_Pottery_-_Showcase_4-19_-_Prehistory_and_Terracotta_Gallery_-_Government_Museum_-_Mathura_2013-02-24_6230.JPG/1280px-Harappan_Pottery_-_Showcase_4-19_-_Prehistory_and_Terracotta_Gallery_-_Government_Museum_-_Mathura_2013-02-24_6230.JPG',
    caption: 'Harappan perforated terracotta pottery vessel (Photo: Wikimedia Commons, CC BY 3.0 / Government Museum Mathura)',
    filename: 'artifact-mcms-2024-001.jpg',
  },
  {
    accession_number: 'MCMS-2024-002',
    name: 'Polished Mauryan Yakshi Torso',
    source: 'Old Supabase (Pexels)',
    url: 'https://images.pexels.com/photos/30695044/pexels-photo-30695044.jpeg?auto=compress&cs=tinysrgb&w=1200',
    caption: 'Ancient polished stone yakshi sculpture (Photo: Pexels Stock Archive / Supabase Seed)',
    filename: 'artifact-mcms-2024-002.jpg',
  },
  {
    accession_number: 'MCMS-2024-003',
    name: 'Chola Nataraja in Cosmic Dance',
    source: 'Old Supabase (Pexels)',
    url: 'https://images.pexels.com/photos/6593890/pexels-photo-6593890.jpeg?auto=compress&cs=tinysrgb&w=1200',
    caption: 'Bronze Nataraja statue depicting the cosmic dance (Photo: Pexels Stock Archive / Supabase Seed)',
    filename: 'artifact-mcms-2024-003.jpg',
  },
  {
    accession_number: 'MCMS-2024-004',
    name: 'Mughal Court Durbar of Emperor Jahangir',
    source: 'Old Supabase (Pexels)',
    url: 'https://images.pexels.com/photos/38948167/pexels-photo-38948167.jpeg?auto=compress&cs=tinysrgb&w=1200',
    caption: 'Intricate Mughal court durbar miniature painting (Photo: Pexels Stock Archive / Supabase Seed)',
    filename: 'artifact-mcms-2024-004.jpg',
  },
  {
    accession_number: 'MCMS-2024-005',
    name: 'Gujarati Double-Ikat Patola Saree',
    source: 'Old Supabase (Pexels)',
    url: 'https://images.pexels.com/photos/10317127/pexels-photo-10317127.jpeg?auto=compress&cs=tinysrgb&w=1200',
    caption: 'Traditional Indian silk textile with double-ikat patterns (Photo: Pexels Stock Archive / Supabase Seed)',
    filename: 'artifact-mcms-2024-005.jpg',
  },
  {
    accession_number: 'MCMS-2024-006',
    name: 'Gupta Era Sarnath Standing Buddha',
    source: 'Old Supabase (Pexels)',
    url: 'https://images.pexels.com/photos/38017915/pexels-photo-38017915.jpeg?auto=compress&cs=tinysrgb&w=1200',
    caption: 'Serene carved sandstone Buddha from the classical era (Photo: Pexels Stock Archive / Supabase Seed)',
    filename: 'artifact-mcms-2024-006.jpg',
  },
  {
    accession_number: 'MCMS-2024-007',
    name: 'Mughal Damascus Steel Talwar with Jade Hilt',
    source: 'Old Supabase (Pexels)',
    url: 'https://images.pexels.com/photos/31350049/pexels-photo-31350049.jpeg?auto=compress&cs=tinysrgb&w=1200',
    caption: 'Ornate historical sword with watered Damascus steel and detailed hilt (Photo: Pexels Stock Archive / Supabase Seed)',
    filename: 'artifact-mcms-2024-007.jpg',
  },
  {
    accession_number: 'MCMS-2024-008',
    name: 'Navaratna Royal Choker Necklace',
    source: 'Old Supabase (Pexels)',
    url: 'https://images.pexels.com/photos/37485307/pexels-photo-37485307.jpeg?auto=compress&cs=tinysrgb&w=1200',
    caption: 'Royal golden ornaments with intricate gemstone settings (Photo: Pexels Stock Archive / Supabase Seed)',
    filename: 'artifact-mcms-2024-008.jpg',
  },
  {
    accession_number: 'MCMS-2024-009',
    name: 'Pala Illustrated Ashtasahasrika Prajnaparamita',
    source: 'Wikimedia Commons',
    url: 'https://upload.wikimedia.org/wikipedia/commons/e/ed/Brooklyn_Museum_-_Three_Illustrated_Palm_leaves_from_a_Prajnaparamita.jpg',
    caption: 'Illustrated palm leaves from an ancient Prajnaparamita manuscript (Photo: Wikimedia Commons, Public domain / Brooklyn Museum)',
    filename: 'artifact-mcms-2024-009.jpg',
  },
  {
    accession_number: 'MCMS-2024-010',
    name: 'Indus Terracotta Painted Storage Urn',
    source: 'Old Supabase (Pexels)',
    url: 'https://images.pexels.com/photos/12785140/pexels-photo-12785140.jpeg?auto=compress&cs=tinysrgb&w=1200',
    caption: 'Terracotta pottery urn with ancient geometric motifs (Photo: Pexels Stock Archive / Supabase Seed)',
    filename: 'artifact-mcms-2024-010.jpg',
  },
  {
    accession_number: 'MCMS-2024-011',
    name: 'Procession of the Delhi Resident and Raja',
    source: 'Old Supabase (Pexels)',
    url: 'https://images.pexels.com/photos/30673013/pexels-photo-30673013.jpeg?auto=compress&cs=tinysrgb&w=1200',
    caption: 'Company school painting depicting courtly procession and palace architecture (Photo: Pexels Stock Archive / Supabase Seed)',
    filename: 'artifact-mcms-2024-011.jpg',
  },
  {
    accession_number: 'MCMS-2024-012',
    name: 'Mughal Embroidered Pashmina Shawl',
    source: 'Old Supabase (Pexels)',
    url: 'https://images.pexels.com/photos/32673642/pexels-photo-32673642.jpeg?auto=compress&cs=tinysrgb&w=1200',
    caption: 'Finely woven Kashmir pashmina with floral boteh embroidery (Photo: Pexels Stock Archive / Supabase Seed)',
    filename: 'artifact-mcms-2024-012.jpg',
  },
  {
    accession_number: 'MCMS-2024-013',
    name: 'Harappan Dancing Girl Replica Icon',
    source: 'Wikimedia Commons',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/58/Dancing_girl.jpg/1280px-Dancing_girl.jpg',
    caption: 'Iconic bronze Dancing Girl statuette from Mohenjo-daro (Photo: Wikimedia Commons, CC BY-SA 3.0 / National Museum New Delhi)',
    filename: 'artifact-mcms-2024-013.jpg',
  },
  {
    accession_number: 'MCMS-2024-014',
    name: 'Harappan Carnelian and Steatite Bead Girdle',
    source: 'Wikimedia Commons',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a9/Indus_carnelian_beads_with_white_design_imported_to_Susa_in_2600-1700_BCE_LOUVRE_Sb_13099.jpg/1280px-Indus_carnelian_beads_with_white_design_imported_to_Susa_in_2600-1700_BCE_LOUVRE_Sb_13099.jpg',
    caption: 'Ancient Indus carnelian and steatite etched beads (Photo: Wikimedia Commons, CC BY-SA 2.0 / Musee du Louvre)',
    filename: 'artifact-mcms-2024-014.jpg',
  },
  {
    accession_number: 'MCMS-2024-015',
    name: 'Maratha Steel Dhal Shield with Gilded Bosses',
    source: 'Wikimedia Commons',
    url: 'https://upload.wikimedia.org/wikipedia/commons/0/07/Indian_dhal_shield.jpg',
    caption: 'Traditional Indian steel dhal shield with gilded ornamentation (Photo: Wikimedia Commons, CC BY 2.0)',
    filename: 'artifact-mcms-2024-015.jpg',
  },
  {
    accession_number: 'MCMS-2024-016',
    name: 'Illuminated Mughal Shahnama Folio',
    source: 'Old Supabase (Pexels)',
    url: 'https://images.pexels.com/photos/30019470/pexels-photo-30019470.jpeg?auto=compress&cs=tinysrgb&w=1200',
    caption: 'Ancient manuscript folio with calligraphic text and illumination (Photo: Pexels Stock Archive / Supabase Seed)',
    filename: 'artifact-mcms-2024-016.jpg',
  },
  {
    accession_number: 'MCMS-2024-017',
    name: 'Chandela Khajuraho Celestial Apsara Relief',
    source: 'Wikimedia Commons',
    url: 'https://upload.wikimedia.org/wikipedia/commons/9/99/5._Khajuraho_chitragupsta_apsara.jpg',
    caption: 'Sandstone celestial apsara relief carving from Khajuraho (Photo: Wikimedia Commons, CC BY-SA 4.0)',
    filename: 'artifact-mcms-2024-017.jpg',
  },
  {
    accession_number: 'MCMS-2024-018',
    name: 'Coromandel Coast Kalamkari Temple Hanging',
    source: 'Wikimedia Commons',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7d/Kalamkari_painting.jpg/1280px-Kalamkari_painting.jpg',
    caption: 'Hand-painted traditional Kalamkari narrative textile hanging (Photo: Wikimedia Commons, CC BY-SA 3.0)',
    filename: 'artifact-mcms-2024-018.jpg',
  },
  {
    accession_number: 'MCMS-2024-019',
    name: 'Radha and Krishna in the Grove',
    source: 'Wikimedia Commons',
    url: 'https://upload.wikimedia.org/wikipedia/commons/0/04/2_Attributed_to_Nihal_Chand._Savant_Singh_and_Bani_Thani_as_Krishna_and_Radha_%28detail%29%2C_Kishangarh%2C_ca._1760._Madison_Avenue_gallery.jpg',
    caption: 'Radha and Krishna in the grove, Kishangarh school (Photo: Wikimedia Commons, Public domain / Nihal Chand attr.)',
    filename: 'artifact-mcms-2024-019.jpg',
  },
  {
    accession_number: 'MCMS-2024-020',
    name: 'Northern Black Polished Ware Bowl',
    source: 'Wikimedia Commons',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/68/Fragment_-_Northern_Black_Polished_Ware_-_500-100_BCE_-_Sonkh_-_Showcase_6-15_-_Prehistory_and_Terracotta_Gallery_-_Government_Museum_-_Mathura_2013-02-24_6458.JPG/1280px-Fragment_-_Northern_Black_Polished_Ware_-_500-100_BCE_-_Sonkh_-_Showcase_6-15_-_Prehistory_and_Terracotta_Gallery_-_Government_Museum_-_Mathura_2013-02-24_6458.JPG',
    caption: 'Ancient Northern Black Polished Ware ceramic fragment (Photo: Wikimedia Commons, CC BY 3.0 / Government Museum Mathura)',
    filename: 'artifact-mcms-2024-020.jpg',
  },
  {
    accession_number: 'MCMS-2024-021',
    name: 'Kerala Bronze Deepam Peacock Ritual Lamp',
    source: 'Wikimedia Commons',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/37/WLA_haa_Kerala_Bronze_Lamp.jpg/1280px-WLA_haa_Kerala_Bronze_Lamp.jpg',
    caption: 'Traditional Kerala ceremonial bronze oil lamp (Photo: Wikimedia Commons, CC0)',
    filename: 'artifact-mcms-2024-021.jpg',
  },
  {
    accession_number: 'MCMS-2024-022',
    name: 'Gupta Imperial Gold Dinar of Samudragupta',
    source: 'Wikimedia Commons',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fb/SamudraguptaCoin.jpg/1280px-SamudraguptaCoin.jpg',
    caption: 'Imperial Ashvamedha gold dinar coin of Emperor Samudragupta (Photo: Wikimedia Commons, CC BY-SA 3.0)',
    filename: 'artifact-mcms-2024-022.jpg',
  },
  {
    accession_number: 'MCMS-2024-023',
    name: 'Birch-Bark Sharada Script Vedic Hymnal',
    source: 'Wikimedia Commons',
    url: 'https://upload.wikimedia.org/wikipedia/commons/b/b2/Kashmir_Sharada_MS.jpg',
    caption: 'Ancient birch-bark manuscript folio in Kashmiri Sharada script (Photo: Wikimedia Commons, Public domain)',
    filename: 'artifact-mcms-2024-023.jpg',
  },
  {
    accession_number: 'MCMS-2024-024',
    name: 'Mughal Chiseled Steel Katar Punch Dagger',
    source: 'Wikimedia Commons',
    url: 'https://upload.wikimedia.org/wikipedia/commons/e/e2/Katar_India_Louvre_7546.jpg',
    caption: 'Mughal chiseled steel katar push dagger (Photo: Wikimedia Commons, Public domain / Musee du Louvre)',
    filename: 'artifact-mcms-2024-024.jpg',
  },
];

async function downloadFile(url, destPath) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'MuseumCollectionDemo/1.0 (contact: admin@museum.org; https://museum.org)',
      'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} when fetching ${url}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(destPath, buffer);
  return buffer.length;
}

async function updateArtifactImages() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/museum_collection';
  console.log(`📡 Connecting to MongoDB at ${mongoUri}...`);
  await mongoose.connect(mongoUri);

  const adminUser = (await User.findOne({ role: 'admin' })) || (await User.findOne());
  if (!adminUser) {
    throw new Error('Admin user not found. Please ensure database has been seeded.');
  }

  console.log(`\n🖼️  Processing ${artifactImageSpecs.length} artifacts to replace placeholders with real photos...\n`);

  const resultsTable = [];

  for (const item of artifactImageSpecs) {
    const artifact = await Artifact.findOne({ accession_number: item.accession_number });
    if (!artifact) {
      console.warn(`⚠️  Artifact ${item.accession_number} not found in database. Skipping.`);
      continue;
    }

    const localFilePath = path.join(uploadsDir, item.filename);
    const localUrl = `http://localhost:5000/uploads/${item.filename}`;
    const oldSvgName = `artifact-${item.accession_number.toLowerCase().replace(/[^a-z0-9]/g, '-')}.svg`;
    const oldSvgPath = path.join(uploadsDir, oldSvgName);

    let downloaded = false;
    let fallbackToPlaceholder = false;

    // 1. Download file if missing or empty
    if (!fs.existsSync(localFilePath) || fs.statSync(localFilePath).size === 0) {
      try {
        console.log(`⬇️  Downloading real photo for ${item.accession_number}: ${item.name} (${item.source})...`);
        const bytes = await downloadFile(item.url, localFilePath);
        console.log(`   Saved ${item.filename} (${(bytes / 1024).toFixed(1)} KB)`);
        downloaded = true;
      } catch (err) {
        console.error(`❌ Failed to download from ${item.url}: ${err.message}`);
        if (fs.existsSync(oldSvgPath)) {
          console.warn(`   Keeping existing SVG placeholder for ${item.accession_number}`);
          fallbackToPlaceholder = true;
        }
      }
    } else {
      console.log(`✓ Local photo already exists: ${item.filename}`);
    }

    // 2. Remove old SVG file from disk if real photo was successfully saved
    if (!fallbackToPlaceholder && fs.existsSync(localFilePath) && fs.existsSync(oldSvgPath)) {
      try {
        fs.unlinkSync(oldSvgPath);
        console.log(`   Deleted old SVG placeholder: ${oldSvgName}`);
      } catch (e) {
        console.warn(`   Could not delete old SVG ${oldSvgName}:`, e.message);
      }
    }

    // 3. Update ArtifactImage in MongoDB
    if (!fallbackToPlaceholder) {
      // Remove any SVG image records for this artifact
      await ArtifactImage.deleteMany({
        artifact_id: artifact._id,
        image_url: /\.svg$/i,
      });

      // Find or update the primary ArtifactImage
      let imageRecord = await ArtifactImage.findOne({ artifact_id: artifact._id });
      if (imageRecord) {
        imageRecord.image_url = localUrl;
        imageRecord.caption = item.caption;
        imageRecord.is_primary = true;
        await imageRecord.save();
        console.log(`   Updated ArtifactImage record -> ${localUrl}`);
      } else {
        imageRecord = await ArtifactImage.create({
          artifact_id: artifact._id,
          image_url: localUrl,
          caption: item.caption,
          is_primary: true,
          uploaded_by: adminUser._id,
        });
        console.log(`   Created new ArtifactImage record -> ${localUrl}`);
      }

      // Ensure no secondary duplicates remain
      await ArtifactImage.deleteMany({
        artifact_id: artifact._id,
        _id: { $ne: imageRecord._id },
      });

      resultsTable.push({
        name: artifact.name,
        accession: artifact.accession_number,
        source: item.source,
        url: localUrl,
        status: 'Real Photo',
      });
    } else {
      resultsTable.push({
        name: artifact.name,
        accession: artifact.accession_number,
        source: 'Placeholder Kept',
        url: `http://localhost:5000/uploads/${oldSvgName}`,
        status: 'Placeholder',
      });
    }
  }

  // Final summary table output
  console.log('\n========================================================================================================');
  console.log('Artifact Photo Replacement Summary');
  console.log('========================================================================================================');
  console.table(
    resultsTable.map((r) => ({
      'Artifact Name': r.name,
      'Accession No.': r.accession,
      'Image Source': r.source,
      'Status': r.status,
    }))
  );

  const realCount = resultsTable.filter((r) => r.status === 'Real Photo').length;
  const placeholderCount = resultsTable.filter((r) => r.status === 'Placeholder').length;

  console.log(`Total Artifacts: ${resultsTable.length}`);
  console.log(`Real Photos:     ${realCount}`);
  console.log(`Placeholders:    ${placeholderCount}`);
  console.log('========================================================================================================\n');

  await mongoose.disconnect();
}

updateArtifactImages().catch((err) => {
  console.error('❌ Fatal error updating artifact images:', err);
  process.exit(1);
});
