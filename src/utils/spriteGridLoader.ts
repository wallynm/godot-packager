import type { SpriteCategory, SpriteAssetWithVariations, ColorVariation, SpriteSelection } from '../types/sprite'
import spriteGridMapping from '../data/sprite-grid-mapping.json'

// Color names for different variations (based on common color palettes)
const COLOR_NAMES = [
  'Default', 'Black', 'Brown', 'Blonde', 'Red', 'Blue', 'Green', 'Purple',
  'Pink', 'Orange', 'Yellow', 'Gray', 'White', 'Cyan', 'Magenta', 'Lime',
  'Navy', 'Maroon', 'Olive', 'Teal', 'Silver', 'Gold', 'Copper', 'Bronze',
  'Emerald', 'Ruby', 'Sapphire', 'Amethyst', 'Topaz', 'Pearl', 'Onyx', 'Jade'
]

export const CATEGORY_LABELS: Record<SpriteCategory, string> = {
  characters: 'Characters',
  eyes: 'Eyes & Makeup',
  clothes: 'Clothes',
  hair: 'Hair',
  acc: 'Accessories'
}

function generateColorVariations(columnCount: number): ColorVariation[] {
  return Array.from({ length: columnCount }, (_, index) => ({
    index,
    name: COLOR_NAMES[index] || `Color ${index + 1}`,
    description: `Color variation ${index + 1}`
  }))
}

export function loadSpriteAssets(): Record<SpriteCategory, SpriteAssetWithVariations[]> {
  const assets: Record<SpriteCategory, SpriteAssetWithVariations[]> = {
    characters: [],
    eyes: [],
    clothes: [],
    hair: [],
    acc: []
  }

  const categories = Object.keys(spriteGridMapping.categories) as SpriteCategory[]
  
  for (const category of categories) {
    const categoryData = spriteGridMapping.categories[category]
    
    for (const [, assetInfo] of Object.entries(categoryData.assets)) {
      const colorVariations = generateColorVariations(assetInfo.grid.cols)
      
      assets[category].push({
        ...assetInfo,
        grid: {
          ...assetInfo.grid,
          confidence: assetInfo.grid.confidence as 'high' | 'estimated'
        },
        colorVariations,
        defaultFrame: 0 // Use first frame as default for character creation
      })
    }
  }

  return assets
}

export function extractSpriteFromSheet(
  sourceCanvas: HTMLCanvasElement,
  selection: SpriteSelection,
  assetInfo: SpriteAssetWithVariations
): HTMLCanvasElement {
  const { grid } = assetInfo
  const { colorVariation, animationFrame } = selection
  
  // Create a new canvas for the extracted sprite
  const extractedCanvas = document.createElement('canvas')
  extractedCanvas.width = grid.cellWidth
  extractedCanvas.height = grid.cellHeight
  
  const ctx = extractedCanvas.getContext('2d')
  if (!ctx) {
    throw new Error('Could not get canvas context')
  }

  // Calculate source coordinates
  const sourceX = colorVariation * grid.cellWidth
  const sourceY = animationFrame * grid.cellHeight
  
  // Extract the specific sprite cell
  ctx.drawImage(
    sourceCanvas,
    sourceX, sourceY, grid.cellWidth, grid.cellHeight, // Source
    0, 0, grid.cellWidth, grid.cellHeight // Destination
  )
  
  return extractedCanvas
}

export function createSpriteSheetLoader() {
  const loadedSheets = new Map<string, HTMLImageElement>()
  
  return {
    async loadSpriteSheet(path: string): Promise<HTMLImageElement> {
      if (loadedSheets.has(path)) {
        return loadedSheets.get(path)!
      }
      
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
          loadedSheets.set(path, img)
          resolve(img)
        }
        img.onerror = reject
        img.src = path
      })
    },
    
    async extractSprite(selection: SpriteSelection, assetInfo: SpriteAssetWithVariations): Promise<HTMLCanvasElement> {
      const img = await this.loadSpriteSheet(assetInfo.path)
      
      // Create a temporary canvas to draw the full sprite sheet
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = img.naturalWidth
      tempCanvas.height = img.naturalHeight
      
      const tempCtx = tempCanvas.getContext('2d')
      if (!tempCtx) {
        throw new Error('Could not get temporary canvas context')
      }
      
      tempCtx.drawImage(img, 0, 0)
      
      // Extract the specific sprite
      return extractSpriteFromSheet(tempCanvas, selection, assetInfo)
    },
    
    clearCache() {
      loadedSheets.clear()
    }
  }
}

export const spriteLoader = createSpriteSheetLoader() 