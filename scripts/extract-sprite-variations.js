import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SPRITE_GRID_MAPPING_PATH = path.join(__dirname, '../src/data/sprite-grid-mapping.json');
const PUBLIC_ASSETS_PATH = path.join(__dirname, '../public/assets');
const EXTRACTED_PATH = path.join(__dirname, '../public/assets/extracted');

// Load the sprite grid mapping
const spriteGridMapping = JSON.parse(fs.readFileSync(SPRITE_GRID_MAPPING_PATH, 'utf8'));

// Create extracted directory structure
function createDirectoryStructure() {
  const categories = Object.keys(spriteGridMapping.categories || {});
  
  categories.forEach(category => {
    const categoryPath = path.join(EXTRACTED_PATH, category);
    if (!fs.existsSync(categoryPath)) {
      fs.mkdirSync(categoryPath, { recursive: true });
    }
    
    // Create subdirectories for each sprite in the category
    const assets = spriteGridMapping.categories[category]?.assets || {};
    Object.keys(assets).forEach(spriteName => {
      const spritePath = path.join(categoryPath, spriteName.replace(/\.(png|jpg)$/, ''));
      if (!fs.existsSync(spritePath)) {
        fs.mkdirSync(spritePath, { recursive: true });
      }
    });
  });
}

// Extract individual frames from a sprite sheet
function extractSpriteFrames(category, spriteName, assetInfo) {
  const inputPath = path.join(PUBLIC_ASSETS_PATH, category, spriteName);
  const outputDir = path.join(EXTRACTED_PATH, category, spriteName.replace(/\.(png|jpg)$/, ''));
  
  if (!fs.existsSync(inputPath)) {
    console.log(`⚠️  Skipping ${inputPath} - file not found`);
    return;
  }
  
  const gridInfo = assetInfo.grid;
  console.log(`🔄 Extracting ${spriteName} (${gridInfo.cols}x${gridInfo.rows})`);
  
  const frameWidth = gridInfo.cellWidth || 32;
  const frameHeight = gridInfo.cellHeight || 32;
  
  // Extract each column (color variation) from the first row only
  // We'll focus on the idle/standing frame (row 0)
  for (let col = 0; col < gridInfo.cols; col++) {
    const x = col * frameWidth;
    const y = 0; // First row only for now
    
    const outputFileName = `${spriteName.replace(/\.(png|jpg)$/, '')}_var${col.toString().padStart(2, '0')}.png`;
    const outputPath = path.join(outputDir, outputFileName);
    
    try {
      // Use ImageMagick to extract the frame
      const command = `magick "${inputPath}" -crop ${frameWidth}x${frameHeight}+${x}+${y} "${outputPath}"`;
      execSync(command, { stdio: 'pipe' });
      
      // Check if the extracted image is not empty/transparent
      try {
        const identifyCommand = `magick identify -ping -format "%[opaque]" "${outputPath}"`;
        const isOpaque = execSync(identifyCommand, { stdio: 'pipe' }).toString().trim();
        
        if (isOpaque === 'false') {
          // Image is completely transparent, remove it
          fs.unlinkSync(outputPath);
          console.log(`  ⚪ Removed transparent frame: ${outputFileName}`);
        } else {
          console.log(`  ✅ Extracted: ${outputFileName}`);
        }
      } catch (identifyError) {
        // If we can't identify the image, keep it anyway
        console.log(`  ⚠️  Kept (couldn't verify): ${outputFileName}`);
      }
    } catch (error) {
      console.error(`❌ Error extracting frame ${col} from ${spriteName}:`, error.message);
    }
  }
}

// Main extraction process
function extractAllSprites() {
  console.log('🚀 Starting sprite extraction process...');
  
  // Create directory structure
  createDirectoryStructure();
  
  // Process each category
  const categories = spriteGridMapping.categories || {};
  Object.entries(categories).forEach(([category, categoryData]) => {
    console.log(`\n📁 Processing ${category} category...`);
    
    const assets = categoryData.assets || {};
    Object.entries(assets).forEach(([spriteName, assetInfo]) => {
      const gridInfo = assetInfo.grid;
      
      // Skip if it's already a single frame or has only one column
      if (gridInfo.cols <= 1) {
        console.log(`⏭️  Skipping ${spriteName} - single frame`);
        return;
      }
      
      extractSpriteFrames(category, spriteName, assetInfo);
    });
  });
  
  console.log('\n✅ Sprite extraction completed!');
  console.log(`📂 Extracted sprites are available in: ${EXTRACTED_PATH}`);
}

// Run the extraction
extractAllSprites(); 