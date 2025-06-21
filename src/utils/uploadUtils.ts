import type { UploadedLayer, SpriteDimensions } from '../types/sprite'

export const generateLayerId = (): string => {
  return `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export const loadImageFromFile = (file: File): Promise<{
  imageData: string
  dimensions: SpriteDimensions
}> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File must be an image'))
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const imageData = e.target?.result as string
      
      // Create an image element to get dimensions
      const img = new Image()
      img.onload = () => {
        resolve({
          imageData,
          dimensions: {
            width: img.width,
            height: img.height
          }
        })
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = imageData
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export const createLayerFromFile = async (
  file: File, 
  canvasCenter: { x: number; y: number },
  zIndex: number = Date.now()
): Promise<UploadedLayer> => {
  const { imageData, dimensions } = await loadImageFromFile(file)
  
  // Center the layer on the canvas
  const position = {
    x: canvasCenter.x - dimensions.width / 2,
    y: canvasCenter.y - dimensions.height / 2,
    zIndex
  }

  return {
    id: generateLayerId(),
    name: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
    imageData,
    dimensions,
    position,
    opacity: 1,
    visible: true
  }
}

export const calculateSuggestedPosition = (
  newLayerDimensions: SpriteDimensions,
  baseDimensions: SpriteDimensions | null,
  existingLayers: UploadedLayer[]
): { x: number; y: number } => {
  if (!baseDimensions) {
    return { x: 0, y: 0 }
  }

  // If the new layer is larger than the base, suggest centering it
  if (newLayerDimensions.width > baseDimensions.width || 
      newLayerDimensions.height > baseDimensions.height) {
    return {
      x: Math.max(0, (baseDimensions.width - newLayerDimensions.width) / 2),
      y: Math.max(0, (baseDimensions.height - newLayerDimensions.height) / 2)
    }
  }

  // For smaller layers, suggest positioning to avoid overlap with existing layers
  const occupied = existingLayers.map(layer => ({
    x: layer.position.x,
    y: layer.position.y,
    width: layer.dimensions.width,
    height: layer.dimensions.height
  }))

  // Simple algorithm: try positions in a grid pattern
  const step = 32 // 32px steps
  for (let y = 0; y <= baseDimensions.height - newLayerDimensions.height; y += step) {
    for (let x = 0; x <= baseDimensions.width - newLayerDimensions.width; x += step) {
      const overlaps = occupied.some(rect => 
        x < rect.x + rect.width &&
        x + newLayerDimensions.width > rect.x &&
        y < rect.y + rect.height &&
        y + newLayerDimensions.height > rect.y
      )
      
      if (!overlaps) {
        return { x, y }
      }
    }
  }

  // If no free space found, default to center
  return {
    x: (baseDimensions.width - newLayerDimensions.width) / 2,
    y: (baseDimensions.height - newLayerDimensions.height) / 2
  }
}

export const exportLayerStack = (layers: UploadedLayer[]): string => {
  return JSON.stringify({
    version: '1.0',
    exportedAt: new Date().toISOString(),
    layers: layers.map(layer => ({
      id: layer.id,
      name: layer.name,
      dimensions: layer.dimensions,
      position: layer.position,
      opacity: layer.opacity,
      visible: layer.visible
      // Note: imageData is excluded from export for size reasons
    }))
  }, null, 2)
} 