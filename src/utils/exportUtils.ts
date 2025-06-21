import type { SelectedLayers } from '../App'
import { ASSET_CATEGORIES, getAssetPath, type AssetCategory } from './assetLoader'

export type SpriteLayerData = {
  category: string
  filename: string
  displayName: string
  path: string
  zIndex: number
}

export type SpriteExportData = {
  timestamp: string
  canvasSize: {
    width: number
    height: number
  }
  layers: SpriteLayerData[]
  metadata: {
    totalLayers: number
    activeLayers: number
    exportFormat: string
  }
}

export const generateSpriteData = (selectedLayers: SelectedLayers, canvas?: HTMLCanvasElement): SpriteExportData => {
  const layerOrder: (keyof SelectedLayers)[] = ['characters', 'clothes', 'eyes', 'hair', 'acc']
  const layers: SpriteLayerData[] = []
  
  layerOrder.forEach((layerType, index) => {
    const assetName = selectedLayers[layerType]
    if (assetName) {
      layers.push({
        category: layerType,
        filename: assetName,
        displayName: ASSET_CATEGORIES[layerType as AssetCategory],
        path: getAssetPath(layerType as AssetCategory, assetName),
        zIndex: index
      })
    }
  })

  return {
    timestamp: new Date().toISOString(),
    canvasSize: {
      width: canvas?.width || 256,
      height: canvas?.height || 256
    },
    layers,
    metadata: {
      totalLayers: Object.keys(selectedLayers).length,
      activeLayers: layers.length,
      exportFormat: 'character-sprite-builder-v1'
    }
  }
}

export const exportSpriteAsJSON = (selectedLayers: SelectedLayers, canvas?: HTMLCanvasElement) => {
  const spriteData = generateSpriteData(selectedLayers, canvas)
  
  const jsonString = JSON.stringify(spriteData, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = `character-sprite-${Date.now()}.json`
  link.click()
  
  URL.revokeObjectURL(url)
}

export const generateGodotResource = (selectedLayers: SelectedLayers, canvas?: HTMLCanvasElement): string => {
  const spriteData = generateSpriteData(selectedLayers, canvas)
  
  let godotResource = `[gd_resource type="Resource" format=3]\n\n`
  godotResource += `[resource]\n`
  godotResource += `canvas_width = ${spriteData.canvasSize.width}\n`
  godotResource += `canvas_height = ${spriteData.canvasSize.height}\n`
  godotResource += `layers = [\n`
  
  spriteData.layers.forEach((layer, index) => {
    godotResource += `\t{\n`
    godotResource += `\t\t"category": "${layer.category}",\n`
    godotResource += `\t\t"filename": "${layer.filename}",\n`
    godotResource += `\t\t"path": "${layer.path}",\n`
    godotResource += `\t\t"z_index": ${layer.zIndex}\n`
    godotResource += `\t}${index < spriteData.layers.length - 1 ? ',' : ''}\n`
  })
  
  godotResource += `]\n`
  
  return godotResource
}

export const exportGodotResource = (selectedLayers: SelectedLayers, canvas?: HTMLCanvasElement) => {
  const godotResource = generateGodotResource(selectedLayers, canvas)
  
  const blob = new Blob([godotResource], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = `character-sprite-${Date.now()}.tres`
  link.click()
  
  URL.revokeObjectURL(url)
} 