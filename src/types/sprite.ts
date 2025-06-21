export type SpriteGridInfo = {
  cols: number
  rows: number
  total: number
  cellWidth: number
  cellHeight: number
  description: string
  confidence: 'high' | 'estimated'
}

export type SpriteDimensions = {
  width: number
  height: number
}

export type SpriteAssetInfo = {
  filename: string
  dimensions: SpriteDimensions
  grid: SpriteGridInfo
  path: string
}

export type SpriteCategory = 'characters' | 'eyes' | 'clothes' | 'hair' | 'acc'

export type SpriteSelection = {
  category: SpriteCategory
  filename: string
  colorVariation: number // Column index (0-based)
  animationFrame: number // Row index (0-based, default to 0 for idle)
}

export type SelectedSpriteLayers = {
  characters: SpriteSelection | null
  eyes: SpriteSelection | null
  clothes: SpriteSelection | null
  hair: SpriteSelection | null
  acc: SpriteSelection | null
}

export type ColorVariation = {
  index: number
  name: string
  description?: string
}

export type SpriteAssetWithVariations = SpriteAssetInfo & {
  colorVariations: ColorVariation[]
  defaultFrame: number // Default animation frame to use for character creation
}

// New types for uploaded layer system
export type LayerPosition = {
  x: number
  y: number
  zIndex: number
}

export type UploadedLayer = {
  id: string
  name: string
  imageData: string // base64 data URL
  dimensions: SpriteDimensions
  position: LayerPosition
  opacity: number
  visible: boolean
  isBase?: boolean // True for the character base layer
}

export type LayerStack = {
  baseLayer: UploadedLayer | null
  additionalLayers: UploadedLayer[]
}

export type DragState = {
  isDragging: boolean
  draggedLayerId: string | null
  dragOffset: { x: number; y: number }
} 