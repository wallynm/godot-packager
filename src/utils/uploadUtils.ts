import type { UploadedLayer } from '../types/sprite'

export const generateLayerId = (): string => {
  return `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export const loadImageFromFile = (file: File): Promise<{
  imageData: string
  width: number
  height: number
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
          width: img.width,
          height: img.height
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
  isBase: boolean = false,
  existingLayers: UploadedLayer[] = []
): Promise<UploadedLayer> => {
  const { imageData, width, height } = await loadImageFromFile(file)
  
  // Calculate position based on whether it's a base layer or additional layer
  let position
  if (isBase || existingLayers.length === 0) {
    // Base layers start at center
    position = {
      x: 0,
      y: 0,
      zIndex: isBase ? 0 : Date.now()
    }
  } else {
    // Additional layers get suggested positioning
    const suggestedPos = calculateSuggestedPosition(
      { width, height },
      existingLayers.find(l => l.isBase) || null,
      existingLayers
    )
    position = {
      x: suggestedPos.x,
      y: suggestedPos.y,
      zIndex: Date.now()
    }
  }

  return {
    id: generateLayerId(),
    name: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
    imageData,
    width,
    height,
    position,
    opacity: 1,
    visible: true,
    isBase
  }
}

export const calculateSuggestedPosition = (
  newLayerDimensions: { width: number; height: number },
  baseLayer: UploadedLayer | null,
  existingLayers: UploadedLayer[]
): { x: number; y: number } => {
  if (!baseLayer) {
    return { x: 0, y: 0 }
  }

  // If the new layer is larger than the base, suggest centering it
  if (newLayerDimensions.width > baseLayer.width || 
      newLayerDimensions.height > baseLayer.height) {
    return {
      x: Math.max(0, (baseLayer.width - newLayerDimensions.width) / 2),
      y: Math.max(0, (baseLayer.height - newLayerDimensions.height) / 2)
    }
  }

  // For smaller layers, suggest positioning to avoid overlap with existing layers
  const occupied = existingLayers.map(layer => ({
    x: layer.position.x,
    y: layer.position.y,
    width: layer.width,
    height: layer.height
  }))

  // Simple algorithm: try positions in a grid pattern
  const step = 32 // 32px steps
  for (let y = 0; y <= baseLayer.height - newLayerDimensions.height; y += step) {
    for (let x = 0; x <= baseLayer.width - newLayerDimensions.width; x += step) {
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
    x: (baseLayer.width - newLayerDimensions.width) / 2,
    y: (baseLayer.height - newLayerDimensions.height) / 2
  }
}

export const exportLayerStack = (layers: UploadedLayer[]): string => {
  return JSON.stringify({
    version: '1.0',
    exportedAt: new Date().toISOString(),
    layers: layers.map(layer => ({
      id: layer.id,
      name: layer.name,
      width: layer.width,
      height: layer.height,
      position: layer.position,
      opacity: layer.opacity,
      visible: layer.visible,
      isBase: layer.isBase
      // Note: imageData is excluded from export for size reasons
    }))
  }, null, 2)
} 