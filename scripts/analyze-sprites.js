#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ASSETS_DIR = path.join(__dirname, '../public/assets');
const OUTPUT_FILE = path.join(__dirname, '../src/data/sprite-grid-mapping.json');

const categories = ['characters', 'eyes', 'clothes', 'hair', 'acc'];

function getImageDimensions(imagePath) {
  try {
    const output = execSync(`identify -format "%wx%h" "${imagePath}"`, { encoding: 'utf8' });
    const [width, height] = output.trim().split('x').map(Number);
    return { width, height };
  } catch (error) {
    console.error(`Error getting dimensions for ${imagePath}:`, error.message);
    return null;
  }
}

function analyzeGridPattern(width, height, baseSize = 32) {
  // Try to determine grid pattern based on dimensions
  const cols = Math.round(width / baseSize);
  const rows = Math.round(height / baseSize);
  
  // Common patterns we expect
  const knownPatterns = [
    { cols: 2, rows: 6, total: 12, description: '2x6 grid (12 variations)' },
    { cols: 6, rows: 2, total: 12, description: '6x2 grid (12 variations)' },
    { cols: 2, rows: 10, total: 20, description: '2x10 grid (20 variations)' },
    { cols: 10, rows: 2, total: 20, description: '10x2 grid (20 variations)' },
    { cols: 2, rows: 2, total: 4, description: '2x2 grid (4 variations)' },
    { cols: 1, rows: 1, total: 1, description: 'Single sprite' },
    { cols: 4, rows: 3, total: 12, description: '4x3 grid (12 variations)' },
    { cols: 3, rows: 4, total: 12, description: '3x4 grid (12 variations)' },
  ];
  
  // Find best matching pattern
  const exactMatch = knownPatterns.find(p => p.cols === cols && p.rows === rows);
  if (exactMatch) {
    return {
      cols,
      rows,
      total: exactMatch.total,
      cellWidth: Math.round(width / cols),
      cellHeight: Math.round(height / rows),
      description: exactMatch.description,
      confidence: 'high'
    };
  }
  
  // If no exact match, make best guess
  return {
    cols,
    rows,
    total: cols * rows,
    cellWidth: Math.round(width / cols),
    cellHeight: Math.round(height / rows),
    description: `${cols}x${rows} grid (${cols * rows} variations)`,
    confidence: 'estimated'
  };
}

function analyzeSpriteAssets() {
  const mapping = {
    metadata: {
      generatedAt: new Date().toISOString(),
      description: 'Sprite sheet grid mapping for character creation assets',
      baseSize: 32
    },
    categories: {}
  };

  for (const category of categories) {
    const categoryDir = path.join(ASSETS_DIR, category);
    
    if (!fs.existsSync(categoryDir)) {
      console.warn(`Category directory not found: ${categoryDir}`);
      continue;
    }

    console.log(`\nAnalyzing ${category}...`);
    mapping.categories[category] = {
      assets: {},
      summary: {
        totalAssets: 0,
        gridPatterns: {},
        averageDimensions: { width: 0, height: 0 }
      }
    };

    const files = fs.readdirSync(categoryDir).filter(file => 
      file.toLowerCase().endsWith('.png') || file.toLowerCase().endsWith('.jpg')
    );

    let totalWidth = 0, totalHeight = 0;

    for (const file of files) {
      const filePath = path.join(categoryDir, file);
      const dimensions = getImageDimensions(filePath);
      
      if (!dimensions) continue;

      const gridAnalysis = analyzeGridPattern(dimensions.width, dimensions.height);
      
      mapping.categories[category].assets[file] = {
        filename: file,
        dimensions,
        grid: gridAnalysis,
        path: `/assets/${category}/${file}`
      };

      // Update summary
      totalWidth += dimensions.width;
      totalHeight += dimensions.height;
      
      const patternKey = `${gridAnalysis.cols}x${gridAnalysis.rows}`;
      if (!mapping.categories[category].summary.gridPatterns[patternKey]) {
        mapping.categories[category].summary.gridPatterns[patternKey] = {
          count: 0,
          description: gridAnalysis.description,
          examples: []
        };
      }
      mapping.categories[category].summary.gridPatterns[patternKey].count++;
      if (mapping.categories[category].summary.gridPatterns[patternKey].examples.length < 3) {
        mapping.categories[category].summary.gridPatterns[patternKey].examples.push(file);
      }

      console.log(`  ${file}: ${dimensions.width}x${dimensions.height} -> ${gridAnalysis.description} (${gridAnalysis.confidence})`);
    }

    mapping.categories[category].summary.totalAssets = files.length;
    mapping.categories[category].summary.averageDimensions = {
      width: Math.round(totalWidth / files.length),
      height: Math.round(totalHeight / files.length)
    };
  }

  return mapping;
}

function main() {
  console.log('🔍 Analyzing sprite assets...\n');
  
  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    const mapping = analyzeSpriteAssets();
    
    // Write the mapping to file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(mapping, null, 2));
    
    console.log('\n✅ Analysis complete!');
    console.log(`📄 Grid mapping saved to: ${OUTPUT_FILE}`);
    
    // Print summary
    console.log('\n📊 Summary:');
    for (const [category, data] of Object.entries(mapping.categories)) {
      console.log(`\n${category.toUpperCase()}:`);
      console.log(`  Assets: ${data.summary.totalAssets}`);
      console.log(`  Average size: ${data.summary.averageDimensions.width}x${data.summary.averageDimensions.height}`);
      console.log(`  Grid patterns:`);
      for (const [pattern, info] of Object.entries(data.summary.gridPatterns)) {
        console.log(`    ${pattern}: ${info.count} files (${info.description})`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error during analysis:', error);
    process.exit(1);
  }
}

main(); 